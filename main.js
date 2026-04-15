// ═════════════════════════════════════════════════════════
// main.js - Alexis Antoniou portfolio
//
// TABLE OF CONTENTS
// -----------------
//  1. Motion + pointer feature gates ..... top of file
//  2. Custom cursor ...................... search "Custom Cursor"
//  3. Hero particle canvas ............... search "hero-canvas"
//  4. Scroll progress + reveal observer .. search "scrollProgress"
//  5. Tilt cards (event delegation) ...... search "tilt-card"
//  6. Magnetic buttons + parallax ........ search "magnetic"
//  7. Hamburger nav toggle ............... search "hamburger"
//  8. Flag slideshow ..................... search "flagSlideshow"
//  9. Lazy video loader .................. search "lazyVideo"
// 10. Pattern-recognition video switcher . search "prVideo"
// ═════════════════════════════════════════════════════════

// ── Motion preference + fine-pointer gate ────────────
// Respect user OS setting; disable all decorative motion if reduced.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

// ── Custom Cursor (fine-pointer only, respects reduced-motion) ─
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
if (cursor && cursorDot && hasFinePointer && !prefersReducedMotion) {
  let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  });
  (function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
  })();

  // Hover state - event delegation, single listener
  const hoverSel = 'a, button, .proj-sm, .demo-card, .skill, .jcard, .contact-pill';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverSel)) { cursor.classList.add('hover'); cursorDot.classList.add('hover'); }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverSel)) { cursor.classList.remove('hover'); cursorDot.classList.remove('hover'); }
  });
} else if (cursor && cursorDot) {
  cursor.style.display = 'none';
  cursorDot.style.display = 'none';
}

// ── Magnetic Buttons ─────────────────────────────────
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    btn.style.setProperty('--x', ((e.clientX - rect.left) / rect.width * 100) + '%');
    btn.style.setProperty('--y', ((e.clientY - rect.top) / rect.height * 100) + '%');
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

// ── Scroll Progress Bar ──────────────────────────────
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.width = (scrollTop / docHeight * 100) + '%';
}, { passive: true });

// ── Nav Hide on Scroll ───────────────────────────────
let lastScroll = 0;
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  const currentScroll = window.scrollY;
  if (currentScroll > lastScroll && currentScroll > 100) {
    nav.classList.add('hide-nav');
  } else {
    nav.classList.remove('hide-nav');
  }
  lastScroll = currentScroll;
}, { passive: true });

// ── Scroll Reveal (multi-direction) ──────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const siblings = entry.target.parentElement.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale');
      const idx = Array.from(siblings).indexOf(entry.target);
      entry.target.style.transitionDelay = `${idx * 100}ms`;
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el => revealObserver.observe(el));

// ── Nav link close mobile ────────────────────────────
document.querySelectorAll('nav .links a').forEach(link => {
  link.addEventListener('click', () => document.querySelector('.links').classList.remove('open'));
});

// ── 3D Card Tilt (delegated, fine-pointer + motion-aware) ─
if (hasFinePointer && !prefersReducedMotion) {
  document.addEventListener('mousemove', e => {
    const card = e.target.closest('.tilt-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 10;
    const rotateY = (x - 0.5) * 10;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.015)`;
  });
  document.addEventListener('mouseout', e => {
    const card = e.target.closest('.tilt-card');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });

  // ── Hero 3D Parallax on Mouse Move ───────────────────
  const heroVisual = document.getElementById('heroVisual');
  const heroVids = heroVisual ? heroVisual.querySelectorAll('.hero-vid') : [];
  const heroEl = document.querySelector('.hero');
  if (heroEl && heroVids.length) {
    heroEl.addEventListener('mousemove', e => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroVids.forEach((vid, i) => {
        const depth = (i + 1) * 6;
        vid.style.transform = `translate(${x * depth}px, ${y * depth}px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
      });
    });
  }
}


// ── Hero Canvas Particles ────────────────────────────
(function() {
  if (prefersReducedMotion) return;
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  let isVisible = true, isTabVisible = true;
  document.addEventListener('visibilitychange', () => { isTabVisible = !document.hidden; });
  const io = new IntersectionObserver(([entry]) => { isVisible = entry.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);
  const ctx = canvas.getContext('2d');
  let width, height, particles = [], mouse = { x: 0, y: 0 };
  const PARTICLE_COUNT = 80;
  const CONNECTION_DIST = 150;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
        color: ['rgba(37,72,232,', 'rgba(10,138,110,', 'rgba(232,102,60,'][Math.floor(Math.random() * 3)]
      });
    }
  }

  function draw() {
    if (!isVisible || !isTabVisible) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const opacity = (1 - dist / CONNECTION_DIST) * 0.12;
          ctx.strokeStyle = `rgba(37,72,232,${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw and update particles
    particles.forEach(p => {
      // Mouse interaction
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const force = (200 - dist) / 200 * 0.02;
        p.vx -= dx * force;
        p.vy -= dy * force;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.vy *= 0.99;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '0.3)';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  canvas.parentElement.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('resize', () => { resize(); createParticles(); });
  resize();
  createParticles();
  draw();
})();

// ── Colour Block Floating Dots Canvas ────────────────
function initBlockCanvas(canvasId, baseColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dots = [], width, height;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }

  function createDots() {
    dots = [];
    for (let i = 0; i < 40; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        angle: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    dots.forEach(d => {
      d.x += Math.cos(d.angle) * d.speed;
      d.y += Math.sin(d.angle) * d.speed;
      d.angle += (Math.random() - 0.5) * 0.02;
      if (d.x < -10) d.x = width + 10;
      if (d.x > width + 10) d.x = -10;
      if (d.y < -10) d.y = height + 10;
      if (d.y > height + 10) d.y = -10;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${baseColor},${0.08 + Math.random() * 0.05})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createDots(); });
  resize();
  createDots();
  draw();
}

// ── 3D Rotating Graph Icon ──────────────────────────
(function() {
  const canvas = document.querySelector('.icon-canvas-graph');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = 30, h = 30;
  let angle = -0.4, animating = false, rafId = null;
  const bars = [
    {x: -6, z: -3, h: 10, c: 'rgba(37,72,232,0.7)'},
    {x: -2, z: -3, h: 16, c: 'rgba(37,72,232,0.85)'},
    {x: 2, z: -3, h: 8, c: 'rgba(37,72,232,0.6)'},
    {x: 6, z: -3, h: 13, c: 'rgba(37,72,232,0.75)'},
    {x: -6, z: 3, h: 12, c: 'rgba(37,72,232,0.5)'},
    {x: -2, z: 3, h: 7, c: 'rgba(37,72,232,0.45)'},
    {x: 2, z: 3, h: 14, c: 'rgba(37,72,232,0.65)'},
    {x: 6, z: 3, h: 9, c: 'rgba(37,72,232,0.55)'},
  ];

  function project(x, y, z) {
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const rx = x * cosA - z * sinA;
    const rz = x * sinA + z * cosA;
    const scale = 1.1;
    return { px: w/2 + rx * scale, py: h/2 + 4 - y * 0.7 + rz * 0.25, depth: rz };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // Sort by depth for proper overlap
    const sorted = bars.map((b,i) => ({...b, i})).sort((a,b) => {
      const da = a.x * Math.sin(angle) + a.z * Math.cos(angle);
      const db = b.x * Math.sin(angle) + b.z * Math.cos(angle);
      return da - db;
    });
    // Draw floor grid
    ctx.strokeStyle = 'rgba(37,72,232,0.15)';
    ctx.lineWidth = 0.5;
    const corners = [[-9,-5],[9,-5],[9,5],[-9,5]].map(c => project(c[0],0,c[1]));
    ctx.beginPath();
    corners.forEach((c,i) => i === 0 ? ctx.moveTo(c.px,c.py) : ctx.lineTo(c.px,c.py));
    ctx.closePath();
    ctx.stroke();
    // Draw bars
    sorted.forEach(bar => {
      const bot = project(bar.x, 0, bar.z);
      const top = project(bar.x, bar.h, bar.z);
      const bw = 2.5;
      // Bar body
      ctx.fillStyle = bar.c;
      ctx.beginPath();
      ctx.moveTo(bot.px - bw/2, bot.py);
      ctx.lineTo(bot.px + bw/2, bot.py);
      ctx.lineTo(top.px + bw/2, top.py);
      ctx.lineTo(top.px - bw/2, top.py);
      ctx.closePath();
      ctx.fill();
      // Bar top
      ctx.fillStyle = bar.c.replace(/[\d.]+\)$/, m => (parseFloat(m)+0.15)+')');
      ctx.fillRect(top.px - bw/2, top.py - 1, bw, 1.5);
    });
  }

  // Static draw
  draw();

  function animate() {
    angle += 0.015;
    draw();
    if (animating) rafId = requestAnimationFrame(animate);
  }

  const skillCard = canvas.closest('.skill');
  skillCard.addEventListener('mouseenter', () => { animating = true; animate(); });
  skillCard.addEventListener('mouseleave', () => { animating = false; if(rafId) cancelAnimationFrame(rafId); });
})();

// Flag slideshow crossfade (pauses when tab hidden or section offscreen)
(function() {
  if (prefersReducedMotion) return;
  const container = document.getElementById('flagSlideshow');
  const slides = container ? container.querySelectorAll('.flag-slide') : [];
  if (!slides.length) return;
  let current = 0, timer = null, inView = false;
  slides[0].classList.add('active');
  function tick() {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }
  function start() { if (!timer) timer = setInterval(tick, 3000); }
  function stop()  { if (timer) { clearInterval(timer); timer = null; } }
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView && !document.hidden ? start() : stop(); })
    .observe(container);
  document.addEventListener('visibilitychange', () => inView && !document.hidden ? start() : stop());
})();


// ── Smooth Parallax on Scroll ────────────────────────
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('.about-shapes .shape').forEach((shape, i) => {
    const speed = (i + 1) * 0.03;
    shape.style.transform = `translateY(${scrollY * speed}px)`;
  });
}, { passive: true });

// ── Glow angle animation for cards ───────────────────
if (!prefersReducedMotion) {
  let glowAngle = 0;
  const glowCards = document.querySelectorAll('.proj-sm');
  (function animateGlow() {
    glowAngle = (glowAngle + 0.5) % 360;
    glowCards.forEach(card => card.style.setProperty('--glow-angle', glowAngle + 'deg'));
    requestAnimationFrame(animateGlow);
  })();
}

// Pattern Recognition version switcher
document.querySelectorAll('.pr-version-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pr-version-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const video = document.getElementById('prVideo');
    video.src = btn.dataset.src;
    video.load();
    video.play();
  });
});

// ── AFM Cantilever bending animation ──────────────────
(function() {
  const skillCard = document.querySelector('.skill:nth-child(3)');
  if (!skillCard) return;
  const cantilever = skillCard.querySelector('.afm-cantilever');
  const tip = skillCard.querySelector('.afm-probe-tip');
  const apex = skillCard.querySelector('.afm-apex');
  if (!cantilever || !tip || !apex) return;
  let animId = null, t = 0, hovering = false;
  function animate() {
    t += 0.035;
    const bend = Math.sin(t * 2) * 2.5 + Math.sin(t * 5) * 0.8;
    const tipY = 8 + bend * 0.4;
    const midY = 8 + bend * 0.6;
    cantilever.setAttribute('d', 'M6,8 Q13,' + midY + ' 18,' + tipY);
    const triBot = tipY + 6.5;
    tip.setAttribute('points', '18,' + tipY + ' 19.5,' + triBot + ' 16.5,' + triBot);
    apex.setAttribute('cy', triBot + 0.5);
    if (hovering) animId = requestAnimationFrame(animate);
  }
  skillCard.addEventListener('mouseenter', function() { hovering = true; animate(); });
  skillCard.addEventListener('mouseleave', function() {
    hovering = false;
    if (animId) cancelAnimationFrame(animId);
    cantilever.setAttribute('d', 'M6,8 Q13,8 18,8');
    tip.setAttribute('points', '18,8 19.5,14.5 16.5,14.5');
    apex.setAttribute('cy', '15');
  });
})();

// ── Experience → Education label transition ──────────
(function() {
  const label = document.getElementById('exp-label');
  const eduStart = document.getElementById('edu-start');
  if (!label || !eduStart) return;
  // Switch to "Education" once the top of the edu section scrolls past 50% of viewport
  function checkLabel() {
    const rect = eduStart.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.5) {
      label.classList.add('show-education');
    } else {
      label.classList.remove('show-education');
    }
  }
  window.addEventListener('scroll', checkLabel, { passive: true });
  checkLabel();
})();

// ── ENISE Bridge slideshow on hover ───────────────────
(function() {
  const card = document.getElementById('bridge-card');
  if (!card) return;
  const slides = card.querySelectorAll('.bridge-slide');
  if (!slides.length) return;
  let idx = 0, timer = null;
  function showSlide(i) {
    slides.forEach(s => s.classList.remove('active'));
    slides[i].classList.add('active');
  }
  function advance() {
    idx = (idx + 1) % slides.length;
    showSlide(idx);
  }
  card.addEventListener('mouseenter', function() {
    idx = 0;
    showSlide(0);
    timer = setInterval(advance, 2500);
  });
  card.addEventListener('mouseleave', function() {
    clearInterval(timer);
    slides.forEach(s => s.classList.remove('active'));
    idx = 0;
  });
})();

// ── Confetti on LinkedIn / Email hover ────────────────
(function() {
  function createConfetti(container, e) {
    const rect = container.getBoundingClientRect();
    const colors = ['#2548e8','#0a8a6e','#e8663c','#f5c542','#a855f7','#ec4899'];
    for (let i = 0; i < 18; i++) {
      const dot = document.createElement('span');
      dot.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;border-radius:' +
        (Math.random() > 0.5 ? '50%' : '2px') + ';width:' + (4 + Math.random()*5) + 'px;height:' +
        (4 + Math.random()*5) + 'px;background:' + colors[Math.floor(Math.random()*colors.length)] +
        ';left:' + (rect.left + rect.width/2) + 'px;top:' + (rect.top + rect.height/2) +
        'px;opacity:1;transition:none;';
      document.body.appendChild(dot);
      const angle = (Math.PI * 2 * i / 18) + (Math.random() - 0.5) * 0.5;
      const vel = 40 + Math.random() * 60;
      const dx = Math.cos(angle) * vel;
      const dy = Math.sin(angle) * vel - 30;
      const rot = Math.random() * 360;
      requestAnimationFrame(() => {
        dot.style.transition = 'all .7s cubic-bezier(.25,.46,.45,.94)';
        dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg) scale(0)';
        dot.style.opacity = '0';
      });
      setTimeout(() => dot.remove(), 800);
    }
  }
  // Attach to LinkedIn and Email links in the contact section
  document.querySelectorAll('.contact-row a').forEach(link => {
    let fired = false;
    link.addEventListener('mouseenter', function(e) {
      if (!fired) { createConfetti(this, e); fired = true; }
    });
    link.addEventListener('mouseleave', function() { fired = false; });
  });
})();

// ── Hamburger menu (a11y: aria-expanded) ─────────────
(function() {
  const btn = document.querySelector('.hamburger');
  const links = document.querySelector('nav .links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
})();

// ── Lazy video loading ───────────────────────────────
// Videos with data-src only load/play when they scroll into view.
// Offscreen videos are paused to save CPU and battery.
(function() {
  const lazyVids = document.querySelectorAll('video[data-src]');
  if (!lazyVids.length) return;

  const loadIO = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const v = entry.target;
      const source = v.querySelector('source');
      if (source && !source.src) {
        source.src = v.dataset.src;
        v.load();
      }
      v.play().catch(()=>{}); // autoplay may be blocked; that's fine
      obs.unobserve(v);
    });
  }, { rootMargin: '200px' });

  const playIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const v = entry.target;
      if (entry.isIntersecting) v.play().catch(()=>{});
      else v.pause();
    });
  }, { threshold: 0.1 });

  lazyVids.forEach(v => {
    loadIO.observe(v);
    playIO.observe(v);
  });

  document.addEventListener('visibilitychange', () => {
    lazyVids.forEach(v => { if (document.hidden) v.pause(); });
  });
})();

// ───────────────────────────────────────────────
// GDS deployments: show-all toggle
// ───────────────────────────────────────────────
(() => {
  const btn = document.getElementById('gdsToggle');
  const more = document.getElementById('gds-more');
  if (!btn || !more) return;
  btn.addEventListener('click', () => {
    const open = !more.hasAttribute('hidden');
    if (open) {
      more.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Show all 18 deployments';
    } else {
      more.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
      btn.textContent = 'Show fewer';
    }
  });
})();
