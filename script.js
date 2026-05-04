/* ═══════════════════════════════════════════════════════════
   N7SIX Profile Site — script.js
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── Navbar scroll effect ──────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Mobile hamburger ──────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// ── Animated hero wave canvas ─────────────────────────────
(function initWaveCanvas() {
  const canvas = document.getElementById('wave-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, raf;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const WAVES = [
    { amp: 0.045, freq: 0.008, speed: 0.012, phase: 0,    color: 'rgba(0,229,255,0.18)' },
    { amp: 0.030, freq: 0.013, speed: 0.018, phase: 1.5,  color: 'rgba(124,58,237,0.12)' },
    { amp: 0.020, freq: 0.020, speed: 0.010, phase: 3.0,  color: 'rgba(0,229,255,0.08)' },
    { amp: 0.055, freq: 0.006, speed: 0.008, phase: 4.7,  color: 'rgba(34,197,94,0.07)'  },
  ];

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);

    WAVES.forEach(w => {
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const y = H * 0.5 + Math.sin(x * w.freq + w.phase + t * w.speed) * H * w.amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = w.color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });

    // faint radial glow at centre
    const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.45);
    grd.addColorStop(0,   'rgba(0,229,255,0.05)');
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    t++;
    raf = requestAnimationFrame(draw);
  }
  draw();

  // pause when tab not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else draw();
  });
})();

// ── Spectrum analyser canvas (simulated) ─────────────────
(function initSpectrum() {
  const canvas = document.getElementById('spectrum-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const BINS  = 256;
  const bins  = new Float32Array(BINS);
  const peaks = new Float32Array(BINS);

  // seed with a realistic 2m band noise floor + a few signals
  function seed() {
    for (let i = 0; i < BINS; i++) {
      bins[i]  = 0.05 + Math.random() * 0.12;  // noise floor
      peaks[i] = bins[i];
    }
    // 144.200 SSB calling freq ≈ bin 52
    addSignal(52,  0.82, 3);
    // 146.520 FM national simplex ≈ bin 100
    addSignal(100, 0.95, 4);
    // 147.195 repeater ≈ bin 118
    addSignal(118, 0.70, 3);
    // weak beacon ≈ bin 200
    addSignal(200, 0.38, 2);
  }

  function addSignal(center, strength, width) {
    for (let d = -width; d <= width; d++) {
      const i = center + d;
      if (i >= 0 && i < BINS) {
        bins[i] = Math.max(bins[i], strength * Math.exp(-0.5 * (d/width) ** 2));
      }
    }
  }

  seed();

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let tick = 0;
  function draw() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // subtle grid
    ctx.strokeStyle = 'rgba(42,50,68,0.6)';
    ctx.lineWidth   = 1;
    for (let y = H * 0.25; y < H; y += H * 0.25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    const bw = W / BINS;

    // animate noise + occasional signal flutter
    tick++;
    for (let i = 0; i < BINS; i++) {
      const noise = (Math.random() - 0.5) * 0.03;
      bins[i] = Math.max(0, Math.min(1, bins[i] + noise));
      // spontaneous signal bursts
      if (Math.random() < 0.0008) {
        addSignal(i, 0.4 + Math.random() * 0.5, 2 + Math.floor(Math.random() * 3));
      }
      // decay
      bins[i] *= 0.992;
      peaks[i] = Math.max(peaks[i] * 0.998, bins[i]);
    }

    // gradient fill under curve
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   'rgba(0,229,255,0.7)');
    grad.addColorStop(0.5, 'rgba(124,58,237,0.4)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i < BINS; i++) {
      const x = i * bw;
      const y = H - bins[i] * H * 0.85;
      i === 0 ? ctx.lineTo(x, y) : ctx.lineTo(x + bw / 2, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // top line
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i < BINS; i++) {
      const x = i * bw + bw / 2;
      const y = H - bins[i] * H * 0.85;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(0,229,255,0.9)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // peak hold dots
    ctx.fillStyle = 'rgba(124,58,237,0.8)';
    for (let i = 0; i < BINS; i++) {
      const x = i * bw + bw / 2;
      const y = H - peaks[i] * H * 0.85;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ── Scroll-reveal ─────────────────────────────────────────
(function initReveal() {
  const targets = [
    ...document.querySelectorAll('.radio-card'),
    ...document.querySelectorAll('.project-card'),
    ...document.querySelectorAll('.skill-group'),
    ...document.querySelectorAll('.contact-card'),
    ...document.querySelectorAll('.about-grid'),
    ...document.querySelectorAll('.qso-callout'),
    ...document.querySelectorAll('.spectrum-bar'),
  ];

  targets.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => obs.observe(el));
})();

// ── Animated counter (stats section) ─────────────────────
(function initCounters() {
  const counters = document.querySelectorAll('.stat-value[data-target]');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1400;
      const start  = performance.now();
      obs.unobserve(el);

      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - (1 - progress) ** 3; // ease-out cubic
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => obs.observe(el));
})();

// ── Active nav link highlight ─────────────────────────────
(function initNavHighlight() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.getAttribute('id');
      links.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => obs.observe(s));
})();
