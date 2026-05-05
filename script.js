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
};

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
  };

  updateClockData();
  window.setInterval(updateClockData, 1000);

  updateDxHeading();

  if (hamClockNodes.targetSelect) {
    hamClockNodes.targetSelect.addEventListener('change', updateDxHeading);
  }

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
