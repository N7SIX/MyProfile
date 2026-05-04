export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      });
    }

    if (request.method === 'POST' && url.pathname === '/event') {
      return handleEvent(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/stats') {
      return handleStats(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/count') {
      return handlePublicCount(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/trend') {
      return handlePublicTrend(request, env);
    }

    if (request.method === 'GET' && url.pathname === '/countries') {
      return handlePublicCountries(request, env);
    }

    return jsonResponse({ error: 'Not found' }, 404, request, env);
  },
};

async function handleEvent(request, env) {
  await ensureSchema(env);

  const payload = await safeJson(request);

  if (!isAllowedRequestOrigin(request, env)) {
    return jsonResponse({ error: 'Forbidden origin' }, 403, request, env);
  }

  if (!payload) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, request, env);
  }

  if (env.WRITE_KEY && payload.writeKey !== env.WRITE_KEY) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
  }

  const site = normalize(payload.site, 120);
  const event = normalize(payload.event, 80);
  const path = normalize(payload.path, 300);
  const referrer = normalize(payload.referrer, 600);
  const userAgent = normalize(payload.userAgent, 400);
  const ipAddress = normalize(request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown', 100);
  const country = normalize(request.headers.get('CF-IPCountry') || 'unknown', 8);

  if (!site || !event) {
    return jsonResponse({ error: 'Missing required fields' }, 400, request, env);
  }

  await env.DB.prepare(
    `INSERT INTO usage_events (site, event, ip_address, country, path, referrer, user_agent)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  )
    .bind(site, event, ipAddress, country, path, referrer, userAgent)
    .run();

  return jsonResponse({ ok: true }, 201, request, env);
}

async function handleStats(request, env) {
  await ensureSchema(env);

  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const site = normalize(url.searchParams.get('site') || '', 120);

  if (!site) {
    return jsonResponse({ error: 'Missing site parameter' }, 400, request, env);
  }

  if (!token || token !== env.ADMIN_TOKEN) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request, env);
  }

  const totals = await env.DB.prepare(
    `SELECT
       COUNT(*) as total_events,
       COUNT(DISTINCT ip_address) as unique_ips
     FROM usage_events
     WHERE site = ?1`
  )
    .bind(site)
    .first();

  const byCountry = await env.DB.prepare(
    `SELECT country, COUNT(*) as count
     FROM usage_events
     WHERE site = ?1
     GROUP BY country
     ORDER BY count DESC
     LIMIT 25`
  )
    .bind(site)
    .all();

  const byEvent = await env.DB.prepare(
    `SELECT event, COUNT(*) as count
     FROM usage_events
     WHERE site = ?1
     GROUP BY event
     ORDER BY count DESC
     LIMIT 100`
  )
    .bind(site)
    .all();

  const recent = await env.DB.prepare(
    `SELECT event, ip_address, country, path, referrer, created_at
     FROM usage_events
     WHERE site = ?1
     ORDER BY created_at DESC
     LIMIT 100`
  )
    .bind(site)
    .all();

  return jsonResponse(
    {
      site,
      totals,
      countries: byCountry.results,
      events: byEvent.results,
      recent: recent.results,
    },
    200,
    request,
    env
  );
}

async function handlePublicCount(request, env) {
  await ensureSchema(env);

  const url = new URL(request.url);
  const site = normalize(url.searchParams.get('site') || '', 120);

  if (!site) {
    return jsonResponse({ error: 'Missing site parameter' }, 400, request, env);
  }

  const totals = await env.DB.prepare(
    `SELECT COUNT(*) as total_events
     FROM usage_events
     WHERE site = ?1`
  )
    .bind(site)
    .first();

  return jsonResponse(
    {
      site,
      total_events: Number(totals?.total_events || 0),
    },
    200,
    request,
    env
  );
}

async function handlePublicTrend(request, env) {
  await ensureSchema(env);

  const url = new URL(request.url);
  const site = normalize(url.searchParams.get('site') || '', 120);
  const requestedHours = Number.parseInt(url.searchParams.get('hours') || '24', 10);
  const hours = Number.isFinite(requestedHours)
    ? Math.min(Math.max(requestedHours, 1), 168)
    : 24;

  if (!site) {
    return jsonResponse({ error: 'Missing site parameter' }, 400, request, env);
  }

  const rows = await env.DB.prepare(
    `SELECT
       strftime('%Y-%m-%dT%H:00:00Z', created_at) as hour_bucket,
       COUNT(*) as count
     FROM usage_events
     WHERE site = ?1
       AND datetime(created_at) >= datetime('now', '-' || ?2 || ' hours')
     GROUP BY hour_bucket
     ORDER BY hour_bucket ASC`
  )
    .bind(site, String(hours))
    .all();

  const rowMap = new Map(
    (rows.results || []).map((item) => [item.hour_bucket, Number(item.count || 0)])
  );

  const buckets = [];

  for (let offset = hours - 1; offset >= 0; offset -= 1) {
    const timestamp = new Date(Date.now() - (offset * 60 * 60 * 1000));
    timestamp.setUTCMinutes(0, 0, 0);
    const key = timestamp.toISOString().slice(0, 19) + 'Z';

    buckets.push({
      hour: key,
      count: rowMap.get(key) || 0,
    });
  }

  return jsonResponse(
    {
      site,
      hours,
      buckets,
    },
    200,
    request,
    env
  );
}

async function handlePublicCountries(request, env) {
  await ensureSchema(env);

  const url = new URL(request.url);
  const site = normalize(url.searchParams.get('site') || '', 120);
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '6', 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 25)
    : 6;

  if (!site) {
    return jsonResponse({ error: 'Missing site parameter' }, 400, request, env);
  }

  const rows = await env.DB.prepare(
    `SELECT country, COUNT(*) as count
     FROM usage_events
     WHERE site = ?1
     GROUP BY country
     ORDER BY count DESC
     LIMIT ?2`
  )
    .bind(site, limit)
    .all();

  const countries = (rows.results || []).map((row) => ({
    country: normalize(String(row.country || 'unknown'), 8),
    count: Number(row.count || 0),
  }));

  return jsonResponse(
    {
      site,
      limit,
      countries,
    },
    200,
    request,
    env
  );
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function getAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAllowedRequestOrigin(request, env) {
  const allowedOrigins = getAllowedOrigins(env);

  if (allowedOrigins.length === 0) {
    return false;
  }

  const origin = request.headers.get('Origin');

  if (origin) {
    return allowedOrigins.includes(origin);
  }

  const referer = request.headers.get('Referer') || '';

  return allowedOrigins.some((allowedOrigin) => referer.startsWith(allowedOrigin));
}

function jsonResponse(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request, env),
  });
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalize(value, maxLen) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLen);
}

let schemaInitPromise = null;

async function ensureSchema(env) {
  if (schemaInitPromise) {
    return schemaInitPromise;
  }

  schemaInitPromise = (async () => {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS usage_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site TEXT NOT NULL,
        event TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        country TEXT NOT NULL,
        path TEXT,
        referrer TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_usage_events_site_created
        ON usage_events (site, created_at DESC)`
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_usage_events_site_country
        ON usage_events (site, country)`
    ).run();

    await env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_usage_events_site_ip
        ON usage_events (site, ip_address)`
    ).run();
  })().catch((error) => {
    schemaInitPromise = null;
    throw error;
  });

  return schemaInitPromise;
}
