const revealNodes = document.querySelectorAll('.reveal');
const interactiveCards = document.querySelectorAll('.interactive-card');
const backgroundCanvas = document.getElementById('background-canvas');
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const socialFeed = document.getElementById('social-feed');
const socialSummary = document.getElementById('social-summary');

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