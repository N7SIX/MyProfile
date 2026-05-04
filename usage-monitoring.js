const usageCounterNode = document.getElementById('usage-counter');
const usageTotalNode = document.getElementById('usage-total');
const usageLastUpdatedNode = document.getElementById('usage-last-updated');
const usageHealthNode = document.getElementById('usage-health');
const usageTrendChartNode = document.getElementById('usage-trend-chart');
const usageTrendPeakNode = document.getElementById('usage-trend-peak');
const usageCountriesTotalNode = document.getElementById('usage-countries-total');
const usageCountriesListNode = document.getElementById('usage-countries-list');

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
      const code = String(item.country || 'UNKNOWN');
      const count = Number(item.count || 0);
      const width = Math.round((count / maxCount) * 100);

      return `
        <div class="country-row">
          <span class="country-code">${escapeHtml(code)}</span>
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
};

const renderCountryPlaceholder = (message = 'No country data yet') => {
  if (usageCountriesListNode) {
    usageCountriesListNode.innerHTML = `<p class="usage-last-updated">${message}</p>`;
  }

  if (usageCountriesTotalNode) {
    usageCountriesTotalNode.textContent = 'Total countries: --';
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
