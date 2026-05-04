const revealNodes = document.querySelectorAll('.reveal');
const interactiveCards = document.querySelectorAll('.interactive-card');
const backgroundCanvas = document.getElementById('background-canvas');
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const socialFeed = document.getElementById('social-feed');
const socialSummary = document.getElementById('social-summary');
const usageCounterNode = document.getElementById('usage-counter');
const usageTotalNode = document.getElementById('usage-total');
const usageLastUpdatedNode = document.getElementById('usage-last-updated');
const usageTrendChartNode = document.getElementById('usage-trend-chart');
const usageTrendPeakNode = document.getElementById('usage-trend-peak');
const usageCountriesTotalNode = document.getElementById('usage-countries-total');
const usageCountriesListNode = document.getElementById('usage-countries-list');

const USAGE_TRACKER = {
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
    return;
  }

  if (!USAGE_TRACKER.publicCountEndpoint || USAGE_TRACKER.publicCountEndpoint.includes('your-worker-subdomain')) {
    if (usageCounterNode) {
      usageCounterNode.textContent = 'Uses: setup required';
    }

    if (usageTotalNode) {
      usageTotalNode.textContent = '--';
    }

    return;
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

    updateLastUpdatedText();
  } catch {
    if (usageCounterNode) {
      usageCounterNode.textContent = 'Uses: unavailable';
    }

    if (usageTotalNode) {
      usageTotalNode.textContent = '--';
    }

    setLastUpdatedUnavailable();
  }
};

const loadPublicUsageTrend = async () => {
  if (!usageTrendChartNode) {
    return;
  }

  if (!USAGE_TRACKER.publicTrendEndpoint || USAGE_TRACKER.publicTrendEndpoint.includes('your-worker-subdomain')) {
    renderTrendPlaceholder();
    return;
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
  } catch {
    renderTrendPlaceholder('Trend unavailable');
  }
};

const loadPublicCountrySummary = async () => {
  if (!usageCountriesListNode) {
    return;
  }

  if (!USAGE_TRACKER.publicCountriesEndpoint || USAGE_TRACKER.publicCountriesEndpoint.includes('your-worker-subdomain')) {
    renderCountryPlaceholder();
    return;
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
  } catch {
    renderCountryPlaceholder('Country summary unavailable');
  }
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

trackPageViewOncePerSession();
setupActionTracking();
loadPublicUsageCount();
loadPublicUsageTrend();
loadPublicCountrySummary();

if (USAGE_TRACKER.countRefreshMs > 0) {
  window.setInterval(loadPublicUsageCount, USAGE_TRACKER.countRefreshMs);
  window.setInterval(loadPublicUsageTrend, USAGE_TRACKER.countRefreshMs);
  window.setInterval(loadPublicCountrySummary, USAGE_TRACKER.countRefreshMs);
}