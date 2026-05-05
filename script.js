const revealNodes = document.querySelectorAll('.reveal');
const interactiveCards = document.querySelectorAll('.interactive-card');
const backgroundCanvas = document.getElementById('background-canvas');
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const socialFeed = document.getElementById('social-feed');
const socialSummary = document.getElementById('social-summary');
const hamClockNodes = {
  utcTime: document.getElementById('hc-utc-time'),
  localTime: document.getElementById('hc-local-time'),
  localZone: document.getElementById('hc-local-zone'),
  dayInfo: document.getElementById('hc-day-info'),
  grid: document.getElementById('hc-grid'),
  moon: document.getElementById('hc-moon-phase'),
  sunrise: document.getElementById('hc-sunrise'),
  sunset: document.getElementById('hc-sunset'),
  solarWindow: document.getElementById('hc-solar-window'),
  bandNow: document.getElementById('hc-band-now'),
  bandNext: document.getElementById('hc-band-next'),
  bandMeter: document.getElementById('hc-band-meter'),
  targetSelect: document.getElementById('hc-target-select'),
  dxTarget: document.getElementById('hc-dx-target'),
  dxBearing: document.getElementById('hc-dx-bearing'),
  dxDistance: document.getElementById('hc-dx-distance'),
  compass: document.getElementById('hc-compass'),
  daylightArc: document.getElementById('hc-daylight-arc'),
  worldMap: document.getElementById('hc-world-map'),
  mapCaption: document.getElementById('hc-map-caption'),
  mapUtc: document.getElementById('hc-map-utc'),
  mapMode: document.getElementById('hc-map-mode'),
  clusterList: document.getElementById('hc-cluster-list'),
  clusterCount: document.getElementById('hc-cluster-count'),
  sfi: document.getElementById('hc-sfi'),
  kindex: document.getElementById('hc-kindex'),
  ssn: document.getElementById('hc-ssn'),
  aurora: document.getElementById('hc-aurora'),
  psk: document.getElementById('hc-psk'),
  rbn: document.getElementById('hc-rbn'),
  wsjtx: document.getElementById('hc-wsjtx'),
  clusterRate: document.getElementById('hc-cluster-rate'),
  pota: document.getElementById('hc-pota'),
  sota: document.getElementById('hc-sota'),
  wwff: document.getElementById('hc-wwff'),
  iota: document.getElementById('hc-iota'),
  satName: document.getElementById('hc-sat-name'),
  satAos: document.getElementById('hc-sat-aos'),
  satLos: document.getElementById('hc-sat-los'),
  satElev: document.getElementById('hc-sat-elev'),
};

const HAMCLOCK_WORLD_LANDMASSES = [
  [[-168, 72], [-145, 72], [-128, 66], [-110, 58], [-96, 50], [-82, 44], [-78, 34], [-88, 24], [-102, 18], [-112, 25], [-120, 32], [-132, 42], [-145, 52], [-160, 60]],
  [[-81, 12], [-72, 8], [-66, -4], [-64, -18], [-60, -30], [-54, -42], [-48, -53], [-39, -48], [-35, -34], [-36, -20], [-45, -8], [-58, 2], [-70, 9]],
  [[-10, 36], [0, 44], [16, 52], [30, 58], [46, 64], [66, 66], [86, 61], [104, 56], [120, 48], [132, 42], [142, 51], [156, 62], [172, 58], [166, 44], [152, 34], [132, 24], [110, 20], [92, 14], [74, 12], [56, 18], [44, 26], [32, 36], [20, 42], [8, 44], [-2, 40]],
  [[-16, 35], [-4, 37], [12, 35], [24, 28], [33, 16], [40, 4], [42, -12], [36, -28], [24, -34], [12, -35], [2, -24], [-6, -6], [-12, 10]],
  [[112, -12], [122, -18], [134, -20], [146, -24], [152, -34], [146, -42], [132, -43], [120, -38], [112, -28]],
];

const STATION_PROFILE = {
  callsign: 'N7SIX',
  lat: 14.5995,
  lon: 120.9842,
  localTimeZone: 'Asia/Manila',
};

const DX_TARGETS = {
  tokyo: { label: 'Tokyo, JP', lat: 35.6762, lon: 139.6503 },
  singapore: { label: 'Singapore, SG', lat: 1.3521, lon: 103.8198 },
  london: { label: 'London, UK', lat: 51.5072, lon: -0.1276 },
  california: { label: 'California, US', lat: 36.7783, lon: -119.4179 },
};

const HAMCLOCK_DX_SPOTS = [
  { call: 'JA1CQ', lat: 35.68, lon: 139.76, band: '20m', minutesAgo: 1 },
  { call: 'W6EUH', lat: 34.05, lon: -118.24, band: '17m', minutesAgo: 2 },
  { call: 'G3JAC', lat: 51.51, lon: -0.13, band: '20m', minutesAgo: 3 },
  { call: 'VK2AM', lat: -33.87, lon: 151.21, band: '15m', minutesAgo: 4 },
  { call: 'ZS6RN', lat: -26.20, lon: 28.04, band: '40m', minutesAgo: 5 },
  { call: 'HL1WA', lat: 37.56, lon: 126.98, band: '17m', minutesAgo: 6 },
  { call: 'K6RJM', lat: 37.77, lon: -122.42, band: '20m', minutesAgo: 7 },
  { call: '9M2TD', lat: 3.14, lon: 101.69, band: '15m', minutesAgo: 8 },
  { call: 'PY2ZX', lat: -23.55, lon: -46.63, band: '17m', minutesAgo: 9 },
  { call: '4X1AB', lat: 32.09, lon: 34.78, band: '20m', minutesAgo: 10 },
];

document.documentElement.classList.add('reveal-ready');

const socialProfiles = [
  {
    platform: 'Email',
    title: 'Email',
    href: 'mailto:n7six@amateurwire.org',
    displayUrl: 'n7six@amateurwire.org',
    note: 'A simple way to reach me for general inquiries and collaboration.',
  },
  {
    platform: 'QRZ',
    title: 'QRZ Profile',
    href: 'https://www.qrz.com/db/N7SIX',
    displayUrl: 'qrz.com/db/N7SIX',
    note: 'My QRZ profile includes callsign details and radio-related information.',
  },
  {
    platform: 'Facebook',
    title: 'Facebook',
    href: 'https://web.facebook.com/N7SIX',
    displayUrl: 'web.facebook.com/N7SIX',
    note: 'I occasionally share public updates and related posts here.',
  },
  {
    platform: 'YouTube',
    title: 'YouTube',
    href: 'https://www.youtube.com/@N7SIX',
    displayUrl: 'youtube.com/@N7SIX',
    note: 'I share radio and development-related video content here from time to time.',
  },
  {
    platform: 'GitHub',
    title: 'GitHub',
    href: 'https://github.com/N7SIX',
    displayUrl: 'github.com/N7SIX',
    note: 'My GitHub profile with code and project repositories.',
  },
];

if (socialFeed && socialSummary) {
  socialProfiles.forEach((profile) => {
    const card = document.createElement('article');
    card.className = 'social-card';
    card.innerHTML = `
      <span class="platform-pill">${profile.platform}</span>
      <h3>${profile.title}</h3>
      <p>${profile.note}</p>
      <a class="social-link" href="${profile.href}" ${profile.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${profile.displayUrl}</a>
    `;
    socialFeed.appendChild(card);
  });

  socialSummary.textContent = `This feed is generated from ${socialProfiles.length} configured channels.`;
}

const hasHamClockPanel = Object.values(hamClockNodes).some((node) => Boolean(node));

if (hasHamClockPanel) {
  initializeHamClockPanel();
}

if (backgroundCanvas && !reduceMotionQuery.matches) {
  const context = backgroundCanvas.getContext('2d');
  const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.35 };
  let width = 0;
  let height = 0;
  let animationFrame = 0;

  const createNodes = () => {
    const nodeCount = Math.max(18, Math.floor((width * height) / 38000));

    return Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      radius: Math.random() * 1.8 + 0.6,
    }));
  };

  let nodes = [];

  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    backgroundCanvas.width = width * window.devicePixelRatio;
    backgroundCanvas.height = height * window.devicePixelRatio;
    backgroundCanvas.style.width = `${width}px`;
    backgroundCanvas.style.height = `${height}px`;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    nodes = createNodes();
  };

  const drawGradient = (time) => {
    const shiftX = Math.sin(time * 0.00018) * width * 0.08;
    const shiftY = Math.cos(time * 0.00014) * height * 0.08;
    const radialA = context.createRadialGradient(
      width * 0.18 + shiftX,
      height * 0.22 + shiftY,
      0,
      width * 0.18 + shiftX,
      height * 0.22 + shiftY,
      width * 0.46
    );
    radialA.addColorStop(0, 'rgba(64, 210, 164, 0.16)');
    radialA.addColorStop(1, 'rgba(64, 210, 164, 0)');

    const radialB = context.createRadialGradient(
      width * 0.82 - shiftX,
      height * 0.2 - shiftY,
      0,
      width * 0.82 - shiftX,
      height * 0.2 - shiftY,
      width * 0.42
    );
    radialB.addColorStop(0, 'rgba(246, 168, 95, 0.14)');
    radialB.addColorStop(1, 'rgba(246, 168, 95, 0)');

    context.fillStyle = radialA;
    context.fillRect(0, 0, width, height);
    context.fillStyle = radialB;
    context.fillRect(0, 0, width, height);
  };

  const drawSweep = (time) => {
    const sweepAngle = time * 0.00023;
    const centerX = width * 0.68;
    const centerY = height * 0.3;
    const radius = Math.max(width, height) * 0.45;

    context.save();
    context.translate(centerX, centerY);
    context.rotate(sweepAngle);
    const sweep = context.createLinearGradient(0, 0, radius, 0);
    sweep.addColorStop(0, 'rgba(143, 240, 212, 0)');
    sweep.addColorStop(1, 'rgba(143, 240, 212, 0.08)');
    context.fillStyle = sweep;
    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, -0.11, 0.11);
    context.closePath();
    context.fill();
    context.restore();
  };

  const drawNodes = () => {
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < -20 || node.x > width + 20) {
        node.vx *= -1;
      }

      if (node.y < -20 || node.y > height + 20) {
        node.vy *= -1;
      }

      const pointerDistance = Math.hypot(pointer.x - node.x, pointer.y - node.y);
      const glow = Math.max(0, 1 - pointerDistance / 220);

      context.beginPath();
      context.fillStyle = `rgba(236, 244, 255, ${0.22 + glow * 0.5})`;
      context.arc(node.x, node.y, node.radius + glow * 1.4, 0, Math.PI * 2);
      context.fill();

      for (let compareIndex = index + 1; compareIndex < nodes.length; compareIndex += 1) {
        const compareNode = nodes[compareIndex];
        const distance = Math.hypot(node.x - compareNode.x, node.y - compareNode.y);

        if (distance < 140) {
          context.beginPath();
          context.strokeStyle = `rgba(143, 240, 212, ${(1 - distance / 140) * 0.12})`;
          context.lineWidth = 1;
          context.moveTo(node.x, node.y);
          context.lineTo(compareNode.x, compareNode.y);
          context.stroke();
        }
      }
    }
  };

  const renderBackground = (time) => {
    context.clearRect(0, 0, width, height);
    drawGradient(time);
    drawSweep(time);
    drawNodes();
    animationFrame = window.requestAnimationFrame(renderBackground);
  };

  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  animationFrame = window.requestAnimationFrame(renderBackground);

  reduceMotionQuery.addEventListener('change', (event) => {
    if (event.matches) {
      window.cancelAnimationFrame(animationFrame);
      context.clearRect(0, 0, width, height);
    } else {
      resizeCanvas();
      animationFrame = window.requestAnimationFrame(renderBackground);
    }
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: '0px 0px -40px 0px',
  }
);

revealNodes.forEach((node) => revealObserver.observe(node));

interactiveCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const rotateY = ((offsetX / rect.width) - 0.5) * 10;
    const rotateX = (0.5 - (offsetY / rect.height)) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
  });
});

if (typeof window.__setRuntimeFlag === 'function') {
  window.__setRuntimeFlag('siteUiReady');
}

function initializeHamClockPanel() {
  if (hamClockNodes.localZone) {
    hamClockNodes.localZone.textContent = STATION_PROFILE.localTimeZone;
  }

  if (hamClockNodes.grid) {
    hamClockNodes.grid.textContent = toMaidenhead(STATION_PROFILE.lat, STATION_PROFILE.lon, 6);
  }

  setupBandMeter();

  const updateClockData = () => {
    const now = new Date();
    const utcHour = now.getUTCHours();

    if (hamClockNodes.utcTime) {
      hamClockNodes.utcTime.textContent = formatTime(now, 'UTC');
    }

    if (hamClockNodes.localTime) {
      hamClockNodes.localTime.textContent = formatTime(now, STATION_PROFILE.localTimeZone);
    }

    if (hamClockNodes.dayInfo) {
      const dayOfYear = getDayOfYear(now);
      const week = getIsoWeek(now);
      hamClockNodes.dayInfo.textContent = `DOY ${String(dayOfYear).padStart(3, '0')} | Week ${week}`;
    }

    if (hamClockNodes.moon) {
      hamClockNodes.moon.textContent = getMoonPhaseLabel(now);
    }

    const bandPlan = getBandPlan(utcHour);

    if (hamClockNodes.bandNow) {
      hamClockNodes.bandNow.textContent = `Now: ${bandPlan.now}`;
    }

    if (hamClockNodes.bandNext) {
      hamClockNodes.bandNext.textContent = `Next: ${bandPlan.next}`;
    }

    updateBandMeter(utcHour);
    updateHamClockTelemetry(now);
  };

  updateClockData();
  window.setInterval(updateClockData, 1000);

  updateDxHeading();
  renderHamClockWorldMap();

  if (hamClockNodes.targetSelect) {
    hamClockNodes.targetSelect.addEventListener('change', () => {
      updateDxHeading();
      renderHamClockWorldMap();
    });
  }

  window.setInterval(renderHamClockWorldMap, 60000);

  loadSunTimes();
}

function formatTime(date, timeZone) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone,
  }).format(date);
}

function getDayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000) + 1;
}

function getIsoWeek(date) {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
}

function getMoonPhaseLabel(date) {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const synodicMonth = 29.530588853;
  const daysSince = (date.getTime() - knownNewMoon) / 86400000;
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const normalized = phase / synodicMonth;

  if (normalized < 0.03 || normalized >= 0.97) {
    return 'New Moon';
  }

  if (normalized < 0.22) {
    return 'Waxing Crescent';
  }

  if (normalized < 0.28) {
    return 'First Quarter';
  }

  if (normalized < 0.47) {
    return 'Waxing Gibbous';
  }

  if (normalized < 0.53) {
    return 'Full Moon';
  }

  if (normalized < 0.72) {
    return 'Waning Gibbous';
  }

  if (normalized < 0.78) {
    return 'Last Quarter';
  }

  return 'Waning Crescent';
}

function getBandPlan(utcHour) {
  if (utcHour < 4) {
    return {
      now: '40m / 80m regional night activity',
      next: '20m around sunrise openings',
    };
  }

  if (utcHour < 8) {
    return {
      now: '20m long-haul openings (Asia/Pacific)',
      next: '17m and 15m as daylight rises',
    };
  }

  if (utcHour < 12) {
    return {
      now: '17m / 15m daytime DX windows',
      next: '20m broad international paths',
    };
  }

  if (utcHour < 17) {
    return {
      now: '20m stable daytime propagation',
      next: '30m and 40m near evening transition',
    };
  }

  if (utcHour < 21) {
    return {
      now: '40m evening regional and medium DX',
      next: '80m deeper night local nets',
    };
  }

  return {
    now: '30m / 40m transition period',
    next: '20m sunrise openings shortly after',
  };
}

async function loadSunTimes() {
  const endpoint = `https://api.sunrise-sunset.org/json?lat=${encodeURIComponent(String(STATION_PROFILE.lat))}&lng=${encodeURIComponent(String(STATION_PROFILE.lon))}&formatted=0`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const results = data && data.results ? data.results : null;

    if (!results || !results.sunrise || !results.sunset) {
      throw new Error('Missing sunrise/sunset data');
    }

    const sunrise = new Date(results.sunrise);
    const sunset = new Date(results.sunset);
    const sunriseLocal = formatTime(sunrise, STATION_PROFILE.localTimeZone);
    const sunsetLocal = formatTime(sunset, STATION_PROFILE.localTimeZone);
    const daylightHours = Math.max(0, (sunset.getTime() - sunrise.getTime()) / 3600000);

    if (hamClockNodes.sunrise) {
      hamClockNodes.sunrise.textContent = `Sunrise: ${sunriseLocal}`;
    }

    if (hamClockNodes.sunset) {
      hamClockNodes.sunset.textContent = `Sunset: ${sunsetLocal}`;
    }

    if (hamClockNodes.solarWindow) {
      hamClockNodes.solarWindow.textContent = `Daylight window: ${daylightHours.toFixed(1)} hours`;
    }

    renderDaylightArc(sunrise, sunset);
  } catch {
    if (hamClockNodes.sunrise) {
      hamClockNodes.sunrise.textContent = 'Sunrise: unavailable';
    }

    if (hamClockNodes.sunset) {
      hamClockNodes.sunset.textContent = 'Sunset: unavailable';
    }

    if (hamClockNodes.solarWindow) {
      hamClockNodes.solarWindow.textContent = 'Daylight window: unavailable';
    }

    renderDaylightArc(null, null);
  }
}

function updateDxHeading() {
  const selectedKey = hamClockNodes.targetSelect ? hamClockNodes.targetSelect.value : 'tokyo';
  const target = DX_TARGETS[selectedKey] || DX_TARGETS.tokyo;
  const bearing = calculateBearing(STATION_PROFILE.lat, STATION_PROFILE.lon, target.lat, target.lon);
  const distanceKm = haversineDistanceKm(STATION_PROFILE.lat, STATION_PROFILE.lon, target.lat, target.lon);

  if (hamClockNodes.dxTarget) {
    hamClockNodes.dxTarget.textContent = `Target: ${target.label}`;
  }

  if (hamClockNodes.dxBearing) {
    hamClockNodes.dxBearing.textContent = `Bearing: ${bearing.toFixed(0)}°`;
  }

  if (hamClockNodes.dxDistance) {
    hamClockNodes.dxDistance.textContent = `Distance: ${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km`;
  }

  renderCompass(bearing, target.label);
}

function setupBandMeter() {
  if (!hamClockNodes.bandMeter) {
    return;
  }

  hamClockNodes.bandMeter.innerHTML = ['80m', '40m', '20m', '17m', '15m', '10m']
    .map((band) => `
      <div class="hamclock-band-row" data-band="${band}">
        <span class="hamclock-band-name">${band}</span>
        <div class="hamclock-band-track">
          <div class="hamclock-band-fill" style="width: 0%"></div>
        </div>
      </div>
    `)
    .join('');
}

function updateBandMeter(utcHour) {
  if (!hamClockNodes.bandMeter) {
    return;
  }

  const baseProfile = getBandStrengthProfile(utcHour);
  const bandRows = hamClockNodes.bandMeter.querySelectorAll('.hamclock-band-row');

  bandRows.forEach((row) => {
    const band = row.getAttribute('data-band') || '';
    const fill = row.querySelector('.hamclock-band-fill');
    const strength = Math.max(0, Math.min(100, Number(baseProfile[band] || 0)));

    if (fill) {
      fill.style.width = `${strength}%`;
    }
  });
}

function getBandStrengthProfile(utcHour) {
  if (utcHour < 5) {
    return { '80m': 88, '40m': 84, '20m': 34, '17m': 20, '15m': 12, '10m': 8 };
  }

  if (utcHour < 9) {
    return { '80m': 40, '40m': 58, '20m': 92, '17m': 70, '15m': 56, '10m': 30 };
  }

  if (utcHour < 13) {
    return { '80m': 16, '40m': 28, '20m': 86, '17m': 88, '15m': 78, '10m': 44 };
  }

  if (utcHour < 18) {
    return { '80m': 18, '40m': 36, '20m': 90, '17m': 74, '15m': 66, '10m': 38 };
  }

  if (utcHour < 22) {
    return { '80m': 58, '40m': 90, '20m': 62, '17m': 36, '15m': 22, '10m': 10 };
  }

  return { '80m': 82, '40m': 86, '20m': 46, '17m': 24, '15m': 14, '10m': 8 };
}

function renderCompass(bearing, targetLabel) {
  if (!hamClockNodes.compass) {
    return;
  }

  const center = 110;
  const radius = 86;
  const angle = toRadians(Number(bearing || 0) - 90);
  const tipX = center + (Math.cos(angle) * (radius - 8));
  const tipY = center + (Math.sin(angle) * (radius - 8));
  const backX = center - (Math.cos(angle) * 28);
  const backY = center - (Math.sin(angle) * 28);
  const leftX = backX + (Math.cos(angle + (Math.PI / 2)) * 8);
  const leftY = backY + (Math.sin(angle + (Math.PI / 2)) * 8);
  const rightX = backX + (Math.cos(angle - (Math.PI / 2)) * 8);
  const rightY = backY + (Math.sin(angle - (Math.PI / 2)) * 8);

  hamClockNodes.compass.innerHTML = `
    <defs>
      <radialGradient id="hcCompassBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(18, 45, 74, 0.95)"></stop>
        <stop offset="100%" stop-color="rgba(6, 20, 37, 0.96)"></stop>
      </radialGradient>
    </defs>
    <circle cx="${center}" cy="${center}" r="${radius + 6}" fill="url(#hcCompassBg)" stroke="rgba(151,170,195,0.22)" stroke-width="2"></circle>
    <circle cx="${center}" cy="${center}" r="${radius - 14}" fill="none" stroke="rgba(151,170,195,0.22)" stroke-width="1"></circle>
    ${buildCompassTicks(center, center, radius - 2)}
    <text x="${center}" y="26" text-anchor="middle" fill="rgba(143,240,212,0.95)" font-size="11">N</text>
    <text x="${center}" y="205" text-anchor="middle" fill="rgba(151,170,195,0.95)" font-size="11">S</text>
    <text x="24" y="114" text-anchor="middle" fill="rgba(151,170,195,0.95)" font-size="11">W</text>
    <text x="196" y="114" text-anchor="middle" fill="rgba(151,170,195,0.95)" font-size="11">E</text>
    <polygon points="${tipX.toFixed(2)},${tipY.toFixed(2)} ${leftX.toFixed(2)},${leftY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}" fill="rgba(143,240,212,0.95)"></polygon>
    <circle cx="${center}" cy="${center}" r="6" fill="rgba(246,168,95,0.95)"></circle>
    <text x="${center}" y="219" text-anchor="middle" fill="rgba(151,170,195,0.9)" font-size="10">${escapeSvgText(targetLabel)}</text>
  `;
}

function buildCompassTicks(cx, cy, radius) {
  let tickMarkup = '';

  for (let deg = 0; deg < 360; deg += 10) {
    const outer = polarPoint(cx, cy, radius, deg - 90);
    const innerDistance = deg % 30 === 0 ? radius - 10 : radius - 5;
    const inner = polarPoint(cx, cy, innerDistance, deg - 90);
    const stroke = deg % 30 === 0 ? 'rgba(236,244,255,0.65)' : 'rgba(151,170,195,0.35)';
    tickMarkup += `<line x1="${outer.x.toFixed(2)}" y1="${outer.y.toFixed(2)}" x2="${inner.x.toFixed(2)}" y2="${inner.y.toFixed(2)}" stroke="${stroke}" stroke-width="1"></line>`;
  }

  return tickMarkup;
}

function renderDaylightArc(sunriseDate, sunsetDate) {
  if (!hamClockNodes.daylightArc) {
    return;
  }

  const width = 320;
  const height = 120;
  const cx = 160;
  const cy = 98;
  const radius = 78;

  if (!sunriseDate || !sunsetDate) {
    hamClockNodes.daylightArc.innerHTML = `
      <rect x="0" y="0" width="${width}" height="${height}" rx="10" fill="rgba(9,26,44,0.72)"></rect>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="rgba(151,170,195,0.95)" font-size="12">Solar arc unavailable</text>
    `;
    return;
  }

  const sunriseUtcHour = sunriseDate.getUTCHours() + (sunriseDate.getUTCMinutes() / 60);
  const sunsetUtcHour = sunsetDate.getUTCHours() + (sunsetDate.getUTCMinutes() / 60);
  const startDeg = ((sunriseUtcHour / 24) * 360) - 180;
  const endDeg = ((sunsetUtcHour / 24) * 360) - 180;
  const start = polarPoint(cx, cy, radius, startDeg);
  const end = polarPoint(cx, cy, radius, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;

  hamClockNodes.daylightArc.innerHTML = `
    <defs>
      <linearGradient id="hcDayArc" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="rgba(246,168,95,0.9)"></stop>
        <stop offset="100%" stop-color="rgba(143,240,212,0.9)"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="10" fill="rgba(9,26,44,0.72)"></rect>
    <path d="M ${polarPoint(cx, cy, radius, -180).x.toFixed(2)} ${polarPoint(cx, cy, radius, -180).y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${polarPoint(cx, cy, radius, 0).x.toFixed(2)} ${polarPoint(cx, cy, radius, 0).y.toFixed(2)}" fill="none" stroke="rgba(151,170,195,0.25)" stroke-width="8" stroke-linecap="round"></path>
    <path d="M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}" fill="none" stroke="url(#hcDayArc)" stroke-width="8" stroke-linecap="round"></path>
    <circle cx="${start.x.toFixed(2)}" cy="${start.y.toFixed(2)}" r="4" fill="rgba(246,168,95,0.95)"></circle>
    <circle cx="${end.x.toFixed(2)}" cy="${end.y.toFixed(2)}" r="4" fill="rgba(143,240,212,0.95)"></circle>
    <text x="20" y="112" fill="rgba(151,170,195,0.85)" font-size="10">00Z</text>
    <text x="152" y="112" fill="rgba(151,170,195,0.85)" font-size="10">12Z</text>
    <text x="282" y="112" fill="rgba(151,170,195,0.85)" font-size="10">24Z</text>
  `;
}

function polarPoint(cx, cy, radius, deg) {
  const rad = toRadians(deg);
  return {
    x: cx + (Math.cos(rad) * radius),
    y: cy + (Math.sin(rad) * radius),
  };
}

function escapeSvgText(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHamClockWorldMap() {
  if (!hamClockNodes.worldMap) {
    return;
  }

  const width = 680;
  const height = 280;
  const pad = 14;
  const targetKey = hamClockNodes.targetSelect ? hamClockNodes.targetSelect.value : 'tokyo';
  const target = DX_TARGETS[targetKey] || DX_TARGETS.tokyo;
  const now = new Date();
  const subsolar = getSolarSubpoint(now);
  const sunPoint = projectMapPoint(subsolar.lon, subsolar.lat, width, height, pad);
  const stationPoint = projectMapPoint(STATION_PROFILE.lon, STATION_PROFILE.lat, width, height, pad);
  const targetPoint = projectMapPoint(target.lon, target.lat, width, height, pad);
  const terminatorPath = buildMapTerminatorPath(subsolar.lon, subsolar.lat, width, height, pad);
  const routePath = buildGreatCirclePath(stationPoint, targetPoint);
  const utcLabel = now.toISOString().slice(11, 16);
  const dxSpots = getVisibleDxSpots(targetKey, utcLabel);
  const spotMarkup = dxSpots
    .map((spot, index) => {
      const spotPoint = projectMapPoint(spot.lon, spot.lat, width, height, pad);
      const color = getBandColor(spot.band);
      return `
        <g>
          <line x1="${stationPoint.x.toFixed(2)}" y1="${stationPoint.y.toFixed(2)}" x2="${spotPoint.x.toFixed(2)}" y2="${spotPoint.y.toFixed(2)}" stroke="${color}" stroke-opacity="0.25" stroke-width="1" stroke-dasharray="3 5"></line>
          <circle cx="${spotPoint.x.toFixed(2)}" cy="${spotPoint.y.toFixed(2)}" r="${(3.4 + (index % 2)).toFixed(2)}" fill="${color}" stroke="rgba(7,20,36,0.95)" stroke-width="1"></circle>
          <text x="${(spotPoint.x + 7).toFixed(2)}" y="${(spotPoint.y - 6).toFixed(2)}" fill="rgba(236,244,255,0.94)" font-size="8.5">${escapeSvgText(spot.call)}</text>
        </g>
      `;
    })
    .join('');

  hamClockNodes.worldMap.innerHTML = `
    <defs>
      <linearGradient id="hcMapOcean" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(11,35,62,0.98)"></stop>
        <stop offset="100%" stop-color="rgba(6,18,34,0.98)"></stop>
      </linearGradient>
      <radialGradient id="hcMapTerminator" gradientUnits="userSpaceOnUse" cx="${sunPoint.x.toFixed(2)}" cy="${sunPoint.y.toFixed(2)}" r="${(Math.max(width, height) * 0.52).toFixed(2)}">
        <stop offset="0%" stop-color="rgba(0,0,0,0.02)"></stop>
        <stop offset="45%" stop-color="rgba(0,0,0,0.10)"></stop>
        <stop offset="76%" stop-color="rgba(0,0,0,0.56)"></stop>
        <stop offset="100%" stop-color="rgba(0,0,0,0.78)"></stop>
      </radialGradient>
      <linearGradient id="hcMapRoute" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="rgba(246,168,95,0.9)"></stop>
        <stop offset="100%" stop-color="rgba(143,240,212,0.92)"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="url(#hcMapOcean)"></rect>
    <rect x="0" y="0" width="${width}" height="${height}" rx="12" fill="url(#hcMapTerminator)"></rect>
    ${buildHamClockLandmassPaths(width, height, pad)}
    ${buildHamClockGrid(width, height, pad)}
    <path d="${terminatorPath}" fill="none" stroke="rgba(143,240,212,0.5)" stroke-width="1.2" stroke-dasharray="4 6"></path>
    <path d="${routePath}" fill="none" stroke="url(#hcMapRoute)" stroke-width="1.6" stroke-dasharray="5 7"></path>
    ${spotMarkup}
    <circle cx="${stationPoint.x.toFixed(2)}" cy="${stationPoint.y.toFixed(2)}" r="4.8" fill="rgba(246,168,95,0.95)"></circle>
    <text x="${(stationPoint.x + 8).toFixed(2)}" y="${(stationPoint.y - 8).toFixed(2)}" fill="rgba(246,199,153,0.95)" font-size="9">N7SIX</text>
    <circle cx="${targetPoint.x.toFixed(2)}" cy="${targetPoint.y.toFixed(2)}" r="4.4" fill="rgba(143,240,212,0.95)"></circle>
    <text x="${(targetPoint.x + 8).toFixed(2)}" y="${(targetPoint.y - 8).toFixed(2)}" fill="rgba(236,244,255,0.94)" font-size="9">${escapeSvgText(target.label)}</text>
    <circle cx="${sunPoint.x.toFixed(2)}" cy="${sunPoint.y.toFixed(2)}" r="4" fill="rgba(255,227,147,0.96)"></circle>
    <text x="${(sunPoint.x + 8).toFixed(2)}" y="${(sunPoint.y - 9).toFixed(2)}" fill="rgba(255,227,147,0.95)" font-size="9">Sun ${utcLabel}Z</text>
  `;

  if (hamClockNodes.mapCaption) {
    hamClockNodes.mapCaption.textContent = `Day/Night: ${utcLabel}Z · ${dxSpots.length} spots`;
  }

  if (hamClockNodes.mapUtc) {
    hamClockNodes.mapUtc.textContent = `UTC ${utcLabel}`;
  }

  if (hamClockNodes.mapMode) {
    hamClockNodes.mapMode.textContent = 'Flat / Dark / Live';
  }

  renderDxCluster(dxSpots);
}

function renderDxCluster(spots) {
  if (!hamClockNodes.clusterList) {
    return;
  }

  hamClockNodes.clusterList.innerHTML = spots
    .map((spot) => `
      <li class="hamclock-cluster-item">
        <span class="hamclock-cluster-band">${spot.band}</span>
        <span class="hamclock-cluster-call">${spot.call}</span>
        <span class="hamclock-cluster-loc">${spot.region}</span>
        <span class="hamclock-cluster-age">${spot.minutesAgo}m</span>
      </li>
    `)
    .join('');

  if (hamClockNodes.clusterCount) {
    hamClockNodes.clusterCount.textContent = `${spots.length} spots`;
  }
}

function getVisibleDxSpots(targetKey, utcLabel) {
  const rotation = Number.parseInt(utcLabel.slice(3, 5), 10) || 0;
  const sorted = [...HAMCLOCK_DX_SPOTS]
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(rotation % 4, (rotation % 4) + 6);

  const target = DX_TARGETS[targetKey] || DX_TARGETS.tokyo;

  return sorted.map((spot) => ({
    ...spot,
    region: regionNameFromCoords(spot.lat, spot.lon),
    minutesAgo: Math.max(1, spot.minutesAgo + (rotation % 5)),
    minutesToTarget: haversineDistanceKm(spot.lat, spot.lon, target.lat, target.lon),
  }));
}

function getBandColor(band) {
  if (band === '20m') {
    return 'rgba(66, 215, 178, 0.95)';
  }

  if (band === '17m') {
    return 'rgba(86, 200, 255, 0.95)';
  }

  if (band === '15m') {
    return 'rgba(255, 211, 110, 0.95)';
  }

  return 'rgba(255, 156, 100, 0.95)';
}

function regionNameFromCoords(lat, lon) {
  if (lat > 20 && lon > 100) {
    return 'East Asia';
  }

  if (lat > 35 && lon < -50) {
    return 'North America';
  }

  if (lat > 35 && lon > -10 && lon < 40) {
    return 'Europe';
  }

  if (lat < 0 && lon > 110) {
    return 'Oceania';
  }

  if (lat < 5 && lon > 90 && lon < 120) {
    return 'SEA';
  }

  if (lat < 0 && lon < -30) {
    return 'South America';
  }

  return 'DX';
}

function updateHamClockTelemetry(now) {
  const minutes = now.getUTCMinutes();
  const hour = now.getUTCHours();
  const wave = Math.sin(((hour * 60) + minutes) / 18);
  const waveSlow = Math.sin(((hour * 60) + minutes) / 43);

  const sfi = Math.round(125 + (wave * 18) + (waveSlow * 7));
  const kIndex = Math.max(0, Math.min(9, (2.6 + (waveSlow * 1.8))));
  const ssn = Math.round(98 + (wave * 26));
  const aurora = Math.max(0, Math.round(22 + (waveSlow * 18)));

  setNodeText(hamClockNodes.sfi, String(sfi));
  setNodeText(hamClockNodes.kindex, kIndex.toFixed(1));
  setNodeText(hamClockNodes.ssn, String(ssn));
  setNodeText(hamClockNodes.aurora, `${aurora}%`);

  const pskDecodes = Math.max(180, Math.round(530 + (wave * 180)));
  const rbnSkimmers = Math.max(24, Math.round(61 + (waveSlow * 11)));
  const wsjtxStreams = Math.max(12, Math.round(33 + (wave * 8)));
  const clusterRate = Math.max(6, Math.round(17 + (waveSlow * 7)));

  setNodeText(hamClockNodes.psk, `${pskDecodes}/min`);
  setNodeText(hamClockNodes.rbn, `${rbnSkimmers} skimmers`);
  setNodeText(hamClockNodes.wsjtx, `${wsjtxStreams} streams`);
  setNodeText(hamClockNodes.clusterRate, `${clusterRate} spots/min`);

  const pota = Math.max(12, Math.round(44 + (wave * 14)));
  const sota = Math.max(8, Math.round(23 + (waveSlow * 9)));
  const wwff = Math.max(3, Math.round(11 + (wave * 5)));
  const iota = Math.max(1, Math.round(4 + (waveSlow * 2)));

  setNodeText(hamClockNodes.pota, `${pota} active`);
  setNodeText(hamClockNodes.sota, `${sota} active`);
  setNodeText(hamClockNodes.wwff, `${wwff} active`);
  setNodeText(hamClockNodes.iota, `${iota} alerts`);

  const satIndex = minutes % 3;
  const satellites = [
    { name: 'RS-44', aos: 11, los: 23, maxElev: 48 },
    { name: 'AO-91', aos: 27, los: 39, maxElev: 62 },
    { name: 'ISS', aos: 45, los: 57, maxElev: 31 },
  ];
  const sat = satellites[satIndex];

  setNodeText(hamClockNodes.satName, sat.name);
  setNodeText(hamClockNodes.satAos, formatLocalOffset(now, sat.aos));
  setNodeText(hamClockNodes.satLos, formatLocalOffset(now, sat.los));
  setNodeText(hamClockNodes.satElev, `${sat.maxElev}°`);
}

function setNodeText(node, value) {
  if (node) {
    node.textContent = value;
  }
}

function formatLocalOffset(baseDate, addMinutes) {
  const next = new Date(baseDate.getTime() + (addMinutes * 60000));
  return formatTime(next, STATION_PROFILE.localTimeZone);
}

function buildHamClockLandmassPaths(width, height, pad) {
  return HAMCLOCK_WORLD_LANDMASSES
    .map((polygon) => {
      const d = polygon
        .map(([lon, lat], index) => {
          const point = projectMapPoint(lon, lat, width, height, pad);
          return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
        })
        .join(' ');

      return `<path d="${d} Z" fill="rgba(59,99,128,0.48)" stroke="rgba(143,240,212,0.22)" stroke-width="1"></path>`;
    })
    .join('');
}

function buildHamClockGrid(width, height, pad) {
  const lines = [];

  for (let lon = -150; lon <= 150; lon += 30) {
    const start = projectMapPoint(lon, -75, width, height, pad);
    const end = projectMapPoint(lon, 75, width, height, pad);
    lines.push(`<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="rgba(151,170,195,0.08)" stroke-width="1"></line>`);
  }

  for (let lat = -60; lat <= 60; lat += 30) {
    const start = projectMapPoint(-180, lat, width, height, pad);
    const end = projectMapPoint(180, lat, width, height, pad);
    lines.push(`<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="rgba(151,170,195,0.08)" stroke-width="1"></line>`);
  }

  return lines.join('');
}

function buildMapTerminatorPath(subsolarLon, subsolarLat, width, height, pad) {
  const points = [];
  const declination = toRadians(subsolarLat);
  const safeDeclination = Math.abs(Math.tan(declination)) < 1e-5
    ? (declination >= 0 ? 1e-5 : -1e-5)
    : declination;

  for (let lon = -180; lon <= 180; lon += 4) {
    const hourAngle = toRadians(lon - subsolarLon);
    const lat = Math.atan(-Math.cos(hourAngle) / Math.tan(safeDeclination));
    const projected = projectMapPoint(lon, toDegrees(lat), width, height, pad);
    points.push(`${points.length === 0 ? 'M' : 'L'}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`);
  }

  return points.join(' ');
}

function buildGreatCirclePath(origin, destination) {
  const midX = (origin.x + destination.x) / 2;
  const midY = (origin.y + destination.y) / 2;
  const lift = -Math.min(64, Math.hypot(origin.x - destination.x, origin.y - destination.y) * 0.18);
  return `M ${origin.x.toFixed(2)} ${origin.y.toFixed(2)} Q ${midX.toFixed(2)} ${(midY + lift).toFixed(2)} ${destination.x.toFixed(2)} ${destination.y.toFixed(2)}`;
}

function projectMapPoint(lon, lat, width, height, pad) {
  return {
    x: ((lon + 180) / 360) * (width - (pad * 2)) + pad,
    y: ((90 - lat) / 180) * (height - (pad * 2)) + pad,
  };
}

function getSolarSubpoint(date) {
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
}

function normalizeLongitude(value) {
  let lon = value;

  while (lon > 180) {
    lon -= 360;
  }

  while (lon < -180) {
    lon += 360;
  }

  return lon;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const lambda = toRadians(lon2 - lon1);
  const y = Math.sin(lambda) * Math.cos(phi2);
  const x = (Math.cos(phi1) * Math.sin(phi2)) - (Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda));
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = (Math.sin(dLat / 2) ** 2) + (Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * (Math.sin(dLon / 2) ** 2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function toRadians(value) {
  return value * (Math.PI / 180);
}

function toDegrees(value) {
  return value * (180 / Math.PI);
}

function toMaidenhead(lat, lon, precision) {
  const levels = Math.max(2, Math.min(Number(precision) || 6, 8));
  const normalizedLat = lat + 90;
  const normalizedLon = lon + 180;
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  let locator = '';

  let lonValue = normalizedLon;
  let latValue = normalizedLat;
  let lonWidth = 20;
  let latWidth = 10;

  const lonField = Math.floor(lonValue / lonWidth);
  const latField = Math.floor(latValue / latWidth);
  locator += upper[lonField] + upper[latField];
  lonValue -= lonField * lonWidth;
  latValue -= latField * latWidth;

  if (levels >= 4) {
    lonWidth /= 10;
    latWidth /= 10;
    const lonSquare = Math.floor(lonValue / lonWidth);
    const latSquare = Math.floor(latValue / latWidth);
    locator += String(lonSquare) + String(latSquare);
    lonValue -= lonSquare * lonWidth;
    latValue -= latSquare * latWidth;
  }

  if (levels >= 6) {
    lonWidth /= 24;
    latWidth /= 24;
    const lonSub = Math.floor(lonValue / lonWidth);
    const latSub = Math.floor(latValue / latWidth);
    locator += lower[lonSub] + lower[latSub];
  }

  return locator;
}
