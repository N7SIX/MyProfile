const usageCounterNode = document.getElementById('usage-counter');
const usageTotalNode = document.getElementById('usage-total');
const usageLastUpdatedNode = document.getElementById('usage-last-updated');
const usageHealthNode = document.getElementById('usage-health');
const usageTrendChartNode = document.getElementById('usage-trend-chart');
const usageTrendPeakNode = document.getElementById('usage-trend-peak');
const usageCountriesTotalNode = document.getElementById('usage-countries-total');
const usageCountriesListNode = document.getElementById('usage-countries-list');
const usageWorldMapNode = document.getElementById('usage-world-map');
const usageWorldMapCaptionNode = document.getElementById('usage-world-map-caption');

const DEFAULT_USAGE_TRACKER = {
  eventEndpoint: 'https://your-worker-subdomain.workers.dev/event',
  publicCountEndpoint: 'https://your-worker-subdomain.workers.dev/count',
  publicTrendEndpoint: 'https://your-worker-subdomain.workers.dev/trend',
  publicCountriesEndpoint: 'https://your-worker-subdomain.workers.dev/countries',
  site: 'n7six-myprofile-website',
  writeKey: 'replace-with-your-public-write-key',
  sessionKey: 'uvtools-tracker-pageview-v1',
  countRefreshMs: 60000,
  trendHours: 24,
  countriesLimit: 6,
};

const externalUsageTrackerConfig =
  window.USAGE_TRACKER_CONFIG && typeof window.USAGE_TRACKER_CONFIG === 'object'
    ? window.USAGE_TRACKER_CONFIG
    : {};

const USAGE_TRACKER = {
  ...DEFAULT_USAGE_TRACKER,
  ...externalUsageTrackerConfig,
};

let lastCountValue = 0;

const countryNameResolver = typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

const COUNTRY_NAME_FALLBACK = {
  AU: 'Australia',
  BR: 'Brazil',
  CA: 'Canada',
  CN: 'China',
  DE: 'Germany',
  ES: 'Spain',
  FR: 'France',
  GB: 'United Kingdom',
  HK: 'Hong Kong',
  ID: 'Indonesia',
  IN: 'India',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  MY: 'Malaysia',
  NL: 'Netherlands',
  NZ: 'New Zealand',
  PH: 'Philippines',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SE: 'Sweden',
  SG: 'Singapore',
  TH: 'Thailand',
  TR: 'Turkey',
  TW: 'Taiwan',
  US: 'United States',
  VN: 'Vietnam',
};

const COUNTRY_CENTROIDS = {
  AU: { lat: -25.27, lon: 133.77 },
  BR: { lat: -14.24, lon: -51.93 },
  CA: { lat: 56.13, lon: -106.35 },
  CN: { lat: 35.86, lon: 104.2 },
  DE: { lat: 51.17, lon: 10.45 },
  ES: { lat: 40.46, lon: -3.75 },
  FR: { lat: 46.23, lon: 2.21 },
  GB: { lat: 55.38, lon: -3.44 },
  HK: { lat: 22.32, lon: 114.17 },
  ID: { lat: -0.79, lon: 113.92 },
  IN: { lat: 20.59, lon: 78.96 },
  IT: { lat: 41.87, lon: 12.57 },
  JP: { lat: 36.2, lon: 138.25 },
  KR: { lat: 35.91, lon: 127.77 },
  MY: { lat: 4.21, lon: 101.98 },
  NL: { lat: 52.13, lon: 5.29 },
  NZ: { lat: -40.9, lon: 174.89 },
  PH: { lat: 12.88, lon: 121.77 },
  RU: { lat: 61.52, lon: 105.32 },
  SA: { lat: 23.89, lon: 45.08 },
  SE: { lat: 60.13, lon: 18.64 },
  SG: { lat: 1.35, lon: 103.82 },
  TH: { lat: 15.87, lon: 100.99 },
  TR: { lat: 38.96, lon: 35.24 },
  TW: { lat: 23.7, lon: 121.0 },
  US: { lat: 37.09, lon: -95.71 },
  VN: { lat: 14.06, lon: 108.28 },
};

const WORLD_LANDMASSES = [
  // North America
  [
    [-168, 72], [-145, 72], [-128, 66], [-110, 58], [-96, 50], [-82, 44],
    [-78, 34], [-88, 24], [-102, 18], [-112, 25], [-120, 32], [-132, 42],
    [-145, 52], [-160, 60],
  ],
  // South America
  [
    [-81, 12], [-72, 8], [-66, -4], [-64, -18], [-60, -30], [-54, -42],
    [-48, -53], [-39, -48], [-35, -34], [-36, -20], [-45, -8], [-58, 2],
    [-70, 9],
  ],
  // Europe + Asia (Eurasia)
  [
    [-10, 36], [0, 44], [16, 52], [30, 58], [46, 64], [66, 66], [86, 61],
    [104, 56], [120, 48], [132, 42], [142, 51], [156, 62], [172, 58],
    [166, 44], [152, 34], [132, 24], [110, 20], [92, 14], [74, 12],
    [56, 18], [44, 26], [32, 36], [20, 42], [8, 44], [-2, 40],
  ],
  // Africa
  [
    [-16, 35], [-4, 37], [12, 35], [24, 28], [33, 16], [40, 4], [42, -12],
    [36, -28], [24, -34], [12, -35], [2, -24], [-6, -6], [-12, 10],
  ],
  // Arabian Peninsula
  [
    [34, 32], [44, 30], [52, 24], [54, 16], [50, 12], [44, 13], [40, 18],
    [36, 25],
  ],
  // Southeast Asia islands
  [
    [96, 18], [106, 18], [116, 12], [124, 6], [128, -2], [122, -8],
    [112, -6], [102, 0], [96, 8],
  ],
  // Australia
  [
    [112, -12], [122, -18], [134, -20], [146, -24], [152, -34], [146, -42],
    [132, -43], [120, -38], [112, -28],
  ],
  // Greenland
  [
    [-58, 82], [-42, 80], [-30, 74], [-34, 64], [-46, 60], [-56, 66],
  ],
];

const trackUsageEvent = async (eventName, extra = {}) => {
  if (!USAGE_TRACKER.eventEndpoint || USAGE_TRACKER.eventEndpoint.includes('your-worker-subdomain')) {
    return;
  }

  try {
    const writeKey = USAGE_TRACKER.writeKey && !USAGE_TRACKER.writeKey.startsWith('replace-with-')
      ? USAGE_TRACKER.writeKey
      : '';

    await fetch(USAGE_TRACKER.eventEndpoint, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site: USAGE_TRACKER.site,
        writeKey,
        event: eventName,
        path: window.location.pathname,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...extra,
      }),
    });
  } catch (error) {
    // Tracking should never break site behavior.
    console.debug('Usage tracking failed', error);
  }
};

const loadPublicUsageCount = async () => {
  if (!usageCounterNode && !usageTotalNode) {
    return false;
  }

  if (!USAGE_TRACKER.publicCountEndpoint || USAGE_TRACKER.publicCountEndpoint.includes('your-worker-subdomain')) {
    if (usageCounterNode) {
      usageCounterNode.textContent = 'Uses: setup required';
    }

    if (usageTotalNode) {
      usageTotalNode.textContent = '--';
    }

    return false;
  }

  try {
    const url = `${USAGE_TRACKER.publicCountEndpoint}?site=${encodeURIComponent(USAGE_TRACKER.site)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const count = Number(data.total_events || 0);

    animateCounter(lastCountValue, count, 850, (value) => {
      if (usageCounterNode) {
        usageCounterNode.textContent = `Uses: ${value.toLocaleString()}`;
      }

      if (usageTotalNode) {
        usageTotalNode.textContent = value.toLocaleString();
      }
    });

    lastCountValue = count;

    return true;
  } catch {
    if (usageCounterNode) {
      usageCounterNode.textContent = 'Uses: unavailable';
    }

    if (usageTotalNode) {
      usageTotalNode.textContent = '--';
    }

    return false;
  }
};

const loadPublicUsageTrend = async () => {
  if (!usageTrendChartNode) {
    return false;
  }

  if (!USAGE_TRACKER.publicTrendEndpoint || USAGE_TRACKER.publicTrendEndpoint.includes('your-worker-subdomain')) {
    renderTrendPlaceholder();
    return false;
  }

  try {
    const url = `${USAGE_TRACKER.publicTrendEndpoint}?site=${encodeURIComponent(USAGE_TRACKER.site)}&hours=${encodeURIComponent(String(USAGE_TRACKER.trendHours || 24))}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const buckets = Array.isArray(data.buckets) ? data.buckets : [];
    renderTrendChart(buckets);

    return true;
  } catch {
    renderTrendPlaceholder('Trend unavailable');

    return false;
  }
};

const loadPublicCountrySummary = async () => {
  if (!usageCountriesListNode) {
    return false;
  }

  if (!USAGE_TRACKER.publicCountriesEndpoint || USAGE_TRACKER.publicCountriesEndpoint.includes('your-worker-subdomain')) {
    renderCountryPlaceholder();
    return false;
  }

  try {
    const url = `${USAGE_TRACKER.publicCountriesEndpoint}?site=${encodeURIComponent(USAGE_TRACKER.site)}&limit=${encodeURIComponent(String(USAGE_TRACKER.countriesLimit || 6))}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const countries = Array.isArray(data.countries) ? data.countries : [];
    renderCountrySummary(countries);

    return true;
  } catch {
    renderCountryPlaceholder('Country summary unavailable');

    return false;
  }
};

const setUsageHealthState = (isLive) => {
  if (!usageHealthNode) {
    return;
  }

  usageHealthNode.textContent = isLive ? 'Source: Live feed' : 'Source: Offline';
  usageHealthNode.classList.toggle('is-live', isLive);
};

const renderCountrySummary = (countries) => {
  if (!usageCountriesListNode) {
    return;
  }

  if (!countries.length) {
    renderCountryPlaceholder();
    return;
  }

  const maxCount = Math.max(...countries.map((item) => Number(item.count || 0)), 1);

  usageCountriesListNode.innerHTML = countries
    .map((item) => {
      const code = String(item.country || 'UNKNOWN').toUpperCase();
      const countryLabel = formatCountryLabel(code);
      const count = Number(item.count || 0);
      const width = Math.round((count / maxCount) * 100);

      return `
        <div class="country-row">
          <span class="country-code">${escapeHtml(countryLabel)}</span>
          <div class="country-bar-track">
            <div class="country-bar-fill" style="width: ${width}%"></div>
          </div>
          <span class="country-count">${count.toLocaleString()}</span>
        </div>
      `;
    })
    .join('');

  if (usageCountriesTotalNode) {
    usageCountriesTotalNode.textContent = `Total countries: ${countries.length}`;
  }

  renderWorldMap(countries);
};

const renderCountryPlaceholder = (message = 'No country data yet') => {
  if (usageCountriesListNode) {
    usageCountriesListNode.innerHTML = `<p class="usage-last-updated">${message}</p>`;
  }

  if (usageCountriesTotalNode) {
    usageCountriesTotalNode.textContent = 'Total countries: --';
  }

  renderWorldMap([], 'No map data yet');
};

const renderWorldMap = (countries, message) => {
  if (!usageWorldMapNode) {
    return;
  }

  const width = 860;
  const height = 360;
  const pad = 18;
  const maxCount = Math.max(...countries.map((item) => Number(item.count || 0)), 1);
  const markerEntries = countries
    .map((item) => {
      const code = String(item.country || '').toUpperCase();
      const centroid = COUNTRY_CENTROIDS[code];

      if (!centroid) {
        return null;
      }

      const projected = projectWorldPoint(centroid.lon, centroid.lat, width, height, pad);
      const count = Number(item.count || 0);
      const radius = 4 + ((count / maxCount) * 7);

      return {
        code,
        label: formatCountryLabel(code),
        count,
        x: projected.x,
        y: projected.y,
        radius,
      };
    })
    .filter(Boolean);

  const markerSvg = markerEntries
    .map((entry) => `
      <circle cx="${entry.x.toFixed(2)}" cy="${entry.y.toFixed(2)}" r="${entry.radius.toFixed(2)}" fill="rgba(143,240,212,0.86)" stroke="rgba(6,22,42,0.95)" stroke-width="1.3"></circle>
      <text x="${(entry.x + 8).toFixed(2)}" y="${(entry.y - 8).toFixed(2)}" fill="rgba(236,244,255,0.9)" font-size="10" font-family="'Hyundai Sans Head', sans-serif">${escapeHtml(entry.code)}</text>
    `)
    .join('');

  usageWorldMapNode.innerHTML = `
    <defs>
      <linearGradient id="mapBg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(14,36,63,0.95)"></stop>
        <stop offset="100%" stop-color="rgba(8,22,40,0.98)"></stop>
      </linearGradient>
      <radialGradient id="mapGlow" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="rgba(64,210,164,0.20)"></stop>
        <stop offset="100%" stop-color="rgba(64,210,164,0.02)"></stop>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="url(#mapBg)"></rect>
    <rect x="0" y="0" width="${width}" height="${height}" fill="url(#mapGlow)"></rect>
    ${buildLandmassPaths(width, height, pad)}
    ${buildMapGrid(width, height, pad)}
    ${markerSvg}
    ${message ? `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="rgba(151,170,195,0.95)" font-size="14">${escapeHtml(message)}</text>` : ''}
  `;

  if (usageWorldMapCaptionNode) {
    usageWorldMapCaptionNode.textContent = markerEntries.length
      ? `Plotted countries: ${markerEntries.length}`
      : 'Plotted countries: --';
  }
};

const buildMapGrid = (width, height, pad) => {
  const lines = [];

  for (let lon = -150; lon <= 150; lon += 30) {
    const start = projectWorldPoint(lon, -75, width, height, pad);
    const end = projectWorldPoint(lon, 75, width, height, pad);
    lines.push(`<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="rgba(151,170,195,0.12)" stroke-width="1"></line>`);
  }

  for (let lat = -60; lat <= 60; lat += 30) {
    const start = projectWorldPoint(-180, lat, width, height, pad);
    const end = projectWorldPoint(180, lat, width, height, pad);
    lines.push(`<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="rgba(151,170,195,0.12)" stroke-width="1"></line>`);
  }

  return lines.join('');
};

const buildLandmassPaths = (width, height, pad) => WORLD_LANDMASSES
  .map((polygon) => {
    const path = polygon
      .map(([lon, lat], index) => {
        const point = projectWorldPoint(lon, lat, width, height, pad);
        return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      })
      .join(' ');

    return `<path d="${path} Z" fill="rgba(53, 92, 124, 0.45)" stroke="rgba(143, 240, 212, 0.22)" stroke-width="1.1"></path>`;
  })
  .join('');

const projectWorldPoint = (lon, lat, width, height, pad) => {
  const x = ((lon + 180) / 360) * (width - (pad * 2)) + pad;
  const y = ((90 - lat) / 180) * (height - (pad * 2)) + pad;
  return { x, y };
};

const formatCountryLabel = (countryCode) => {
  const code = String(countryCode || '').toUpperCase();

  if (!code || code === 'UNKNOWN' || code === 'XX') {
    return 'Unknown';
  }

  if (!/^[A-Z]{2}$/.test(code)) {
    return code;
  }

  if (!countryNameResolver) {
    const fallbackName = COUNTRY_NAME_FALLBACK[code];
    return fallbackName ? `${fallbackName} - ${code}` : code;
  }

  try {
    const name = countryNameResolver.of(code);
    if (name) {
      return `${name} - ${code}`;
    }

    const fallbackName = COUNTRY_NAME_FALLBACK[code];
    return fallbackName ? `${fallbackName} - ${code}` : code;
  } catch {
    const fallbackName = COUNTRY_NAME_FALLBACK[code];
    return fallbackName ? `${fallbackName} - ${code}` : code;
  }
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const renderTrendChart = (buckets) => {
  if (!usageTrendChartNode) {
    return;
  }

  if (!buckets.length) {
    renderTrendPlaceholder();
    return;
  }

  const width = 520;
  const height = 120;
  const left = 8;
  const right = 8;
  const top = 10;
  const bottom = 18;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = buckets.map((bucket) => Number(bucket.count || 0));
  const maxValue = Math.max(...values, 1);

  const points = values.map((value, index) => {
    const x = left + ((plotWidth * index) / Math.max(values.length - 1, 1));
    const y = top + (plotHeight - ((value / maxValue) * plotHeight));
    return { x, y, value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${left + plotWidth},${height - bottom} L ${left},${height - bottom} Z`;

  const peakIndex = values.indexOf(Math.max(...values));
  const peakBucket = buckets[peakIndex];
  const peakHour = peakBucket?.hour ? new Date(peakBucket.hour).toLocaleString() : '--';
  const peakCount = Number(peakBucket?.count || 0);

  if (usageTrendPeakNode) {
    usageTrendPeakNode.textContent = `Peak hour: ${peakCount} at ${peakHour}`;
  }

  usageTrendChartNode.innerHTML = `
    <defs>
      <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(143, 240, 212, 0.42)" />
        <stop offset="100%" stop-color="rgba(143, 240, 212, 0.04)" />
      </linearGradient>
    </defs>
    <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="rgba(151,170,195,0.35)" stroke-width="1" />
    <path d="${areaPath}" fill="url(#trendFill)"></path>
    <path d="${linePath}" fill="none" stroke="rgba(143, 240, 212, 0.95)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"></path>
  `;
};

const renderTrendPlaceholder = (message = 'No trend data yet') => {
  if (usageTrendChartNode) {
    usageTrendChartNode.innerHTML = `
      <text x="50%" y="50%" text-anchor="middle" fill="rgba(151,170,195,0.92)" font-size="12" dominant-baseline="middle">
        ${message}
      </text>
    `;
  }

  if (usageTrendPeakNode) {
    usageTrendPeakNode.textContent = 'Peak hour: --';
  }
};

const updateLastUpdatedText = () => {
  if (usageLastUpdatedNode) {
    const now = new Date();
    usageLastUpdatedNode.textContent = `Last updated: ${now.toLocaleString()}`;
  }
};

const setLastUpdatedUnavailable = () => {
  if (usageLastUpdatedNode) {
    usageLastUpdatedNode.textContent = 'Last updated: unavailable';
  }
};

const refreshUsagePanels = async () => {
  const [countOk, trendOk, countriesOk] = await Promise.all([
    loadPublicUsageCount(),
    loadPublicUsageTrend(),
    loadPublicCountrySummary(),
  ]);

  const hasLiveData = Boolean(countOk || trendOk || countriesOk);

  if (hasLiveData) {
    updateLastUpdatedText();
  } else {
    setLastUpdatedUnavailable();
  }

  setUsageHealthState(hasLiveData);
};

const animateCounter = (from, to, duration, onUpdate) => {
  const start = Number.isFinite(from) ? from : 0;
  const end = Number.isFinite(to) ? to : 0;

  if (start === end || duration <= 0) {
    onUpdate(end);
    return;
  }

  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - ((1 - progress) * (1 - progress) * (1 - progress));
    const current = Math.round(start + ((end - start) * eased));
    onUpdate(current);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

const trackPageViewOncePerSession = () => {
  const alreadyTracked = window.sessionStorage.getItem(USAGE_TRACKER.sessionKey);

  if (alreadyTracked) {
    return;
  }

  window.sessionStorage.setItem(USAGE_TRACKER.sessionKey, '1');
  trackUsageEvent('page_view');
};

const setupActionTracking = () => {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-track-event]') : null;

    if (!target) {
      return;
    }

    const eventName = target.getAttribute('data-track-event');
    const label = target.getAttribute('data-track-label') || target.textContent?.trim() || '';

    if (!eventName) {
      return;
    }

    trackUsageEvent(eventName, {
      label,
      elementTag: target.tagName,
      elementId: target.id || '',
    });
  });
};

trackPageViewOncePerSession();
setupActionTracking();
refreshUsagePanels();

if (USAGE_TRACKER.countRefreshMs > 0) {
  window.setInterval(refreshUsagePanels, USAGE_TRACKER.countRefreshMs);
}

if (typeof window.__setRuntimeFlag === 'function') {
  window.__setRuntimeFlag('monitoringReady');
}
