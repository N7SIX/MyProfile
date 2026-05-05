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
let usageLeafletMap = null;
let usageLeafletLayerGroup = null;
let usageMapRetryTimerId = 0;

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

const countryNameResolver = createCountryNameResolver();

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

function createCountryNameResolver() {
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
    return null;
  }

  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
}

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

const WORLD_MAP_STATION = {
  code: 'PH',
  lat: 14.5995,
  lon: 120.9842,
  label: 'N7SIX QTH',
};

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

  if (!ensureLeafletMap()) {
    usageWorldMapNode.innerHTML = '<p class="usage-map-status">Map base is loading. Please wait...</p>';
    if (usageWorldMapCaptionNode) {
      usageWorldMapCaptionNode.textContent = 'Plotted countries: --';
    }

    if (!usageMapRetryTimerId) {
      usageMapRetryTimerId = window.setTimeout(() => {
        usageMapRetryTimerId = 0;
        renderWorldMap(countries, message);
      }, 1200);
    }

    return;
  }

  if (!usageLeafletLayerGroup) {
    return;
  }

  usageLeafletLayerGroup.clearLayers();
  const mapTime = new Date();
  const subsolar = getSolarSubpoint(mapTime);
  const nightPolygon = buildNightPolygon(subsolar.lon, subsolar.lat);

  const maxCount = Math.max(...countries.map((item) => Number(item.count || 0)), 1);
  const markerEntries = countries
    .map((item) => {
      const code = String(item.country || '').toUpperCase();
      const centroid = COUNTRY_CENTROIDS[code];

      if (!centroid) {
        return null;
      }

      const count = Number(item.count || 0);
      const radius = 4 + ((count / maxCount) * 7);

      return {
        code,
        label: formatCountryLabel(code),
        count,
        lat: centroid.lat,
        lon: centroid.lon,
        radius,
      };
    })
    .filter(Boolean);

  const L = window.L;
  const stationLatLng = [WORLD_MAP_STATION.lat, WORLD_MAP_STATION.lon];

  L.polygon(nightPolygon, {
    color: 'rgba(143,240,212,0.45)',
    weight: 1,
    dashArray: '6 8',
    fillColor: 'rgba(5,12,24,0.52)',
    fillOpacity: 0.52,
    interactive: false,
  }).addTo(usageLeafletLayerGroup);

  L.circleMarker([subsolar.lat, subsolar.lon], {
    radius: 4.5,
    color: 'rgba(255,227,147,0.98)',
    weight: 1.2,
    fillColor: 'rgba(255,227,147,0.98)',
    fillOpacity: 0.95,
  })
    .bindTooltip(`Sun ${mapTime.toISOString().slice(11, 16)}Z`, {
      permanent: true,
      direction: 'top',
      offset: [0, -6],
      className: 'usage-map-tooltip',
    })
    .addTo(usageLeafletLayerGroup);

  L.circleMarker(stationLatLng, {
    radius: 7,
    color: 'rgba(8,24,42,0.95)',
    weight: 1.5,
    fillColor: 'rgba(246,168,95,0.95)',
    fillOpacity: 0.95,
  })
    .bindTooltip('N7SIX QTH', {
      permanent: true,
      direction: 'top',
      offset: [0, -8],
      className: 'usage-map-tooltip usage-map-tooltip-station',
    })
    .addTo(usageLeafletLayerGroup);

  markerEntries.forEach((entry) => {
    const markerLatLng = [entry.lat, entry.lon];

    L.polyline([stationLatLng, markerLatLng], {
      color: 'rgba(143,240,212,0.38)',
      weight: 1.2,
      opacity: 0.75,
      dashArray: '4 6',
    }).addTo(usageLeafletLayerGroup);

    L.circleMarker(markerLatLng, {
      radius: entry.radius,
      color: 'rgba(8,28,49,0.92)',
      weight: 1.2,
      fillColor: 'rgba(143,240,212,0.9)',
      fillOpacity: 0.9,
    })
      .bindTooltip(`${entry.label} (${entry.count.toLocaleString()})`, {
        direction: 'top',
        offset: [0, -6],
        className: 'usage-map-tooltip',
      })
      .addTo(usageLeafletLayerGroup);
  });

  if (usageWorldMapCaptionNode) {
    if (message) {
      usageWorldMapCaptionNode.textContent = message;
    } else {
      const utcLabel = mapTime.toISOString().slice(11, 16);
      usageWorldMapCaptionNode.textContent = markerEntries.length
        ? `Plotted countries: ${markerEntries.length} • Day/Night ${utcLabel}Z`
        : 'Plotted countries: --';
    }
  }
};
const ensureLeafletMap = () => {
  if (!usageWorldMapNode || typeof window.L === 'undefined') {
    return false;
  }

  if (usageLeafletMap) {
    return true;
  }

  const L = window.L;
  usageLeafletMap = L.map(usageWorldMapNode, {
    center: [18, 12],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    worldCopyJump: true,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(usageLeafletMap);

  usageLeafletLayerGroup = L.layerGroup().addTo(usageLeafletMap);
  window.setTimeout(() => {
    if (usageLeafletMap) {
      usageLeafletMap.invalidateSize();
    }
  }, 0);

  return true;
};

const getSolarSubpoint = (date) => {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86400000);
  const utcHours = date.getUTCHours() + (date.getUTCMinutes() / 60) + (date.getUTCSeconds() / 3600);
  const gamma = (2 * Math.PI / 365) * ((dayOfYear - 1) + ((utcHours - 12) / 24));

  const declinationRad =
    0.006918
    - (0.399912 * Math.cos(gamma))
    + (0.070257 * Math.sin(gamma))
    - (0.006758 * Math.cos(2 * gamma))
    + (0.000907 * Math.sin(2 * gamma))
    - (0.002697 * Math.cos(3 * gamma))
    + (0.00148 * Math.sin(3 * gamma));

  const equationOfTime = 229.18 * (
    0.000075
    + (0.001868 * Math.cos(gamma))
    - (0.032077 * Math.sin(gamma))
    - (0.014615 * Math.cos(2 * gamma))
    - (0.040849 * Math.sin(2 * gamma))
  );

  const minutesUtc = utcHours * 60;
  const hourAngle = ((minutesUtc + equationOfTime) / 4) - 180;

  return {
    lat: toDegrees(declinationRad),
    lon: normalizeLongitude(-hourAngle),
  };
};

const buildNightPolygon = (subsolarLon, subsolarLat) => {
  const declination = toRadians(subsolarLat);
  const safeDeclination = Math.abs(Math.tan(declination)) < 1e-5
    ? (declination >= 0 ? 1e-5 : -1e-5)
    : declination;
  const terminatorPoints = [];

  for (let lon = -180; lon <= 180; lon += 2) {
    const hourAngle = toRadians(lon - subsolarLon);
    const lat = Math.atan(-Math.cos(hourAngle) / Math.tan(safeDeclination));
    terminatorPoints.push([toDegrees(lat), lon]);
  }

  if (subsolarLat >= 0) {
    return [
      [-90, -180],
      ...terminatorPoints,
      [-90, 180],
    ];
  }

  return [
    [90, -180],
    ...terminatorPoints,
    [90, 180],
  ];
};

const toRadians = (value) => value * (Math.PI / 180);

const toDegrees = (value) => value * (180 / Math.PI);

const normalizeLongitude = (value) => {
  let lon = value;

  while (lon > 180) {
    lon -= 360;
  }

  while (lon < -180) {
    lon += 360;
  }

  return lon;
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
