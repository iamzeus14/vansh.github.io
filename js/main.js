const root = document.documentElement;
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  });
}

let savedTheme;
try {
  savedTheme = localStorage.getItem('portfolio-theme');
} catch {
  savedTheme = null;
}
if (savedTheme) root.dataset.theme = savedTheme;

const initAmbientCollision = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 1024px), (pointer: coarse)').matches) return;

  const stage = document.createElement('div');
  stage.className = 'ambient-stage';
  stage.setAttribute('aria-hidden', 'true');
  document.body.prepend(stage);

  const orbs = [
    { className: 'ambient-orb--primary', size: 420, x: .86, y: .23, vx: -24, vy: 20, maxSpeed: 42, nextImpulse: 0 },
    { className: 'ambient-orb--secondary', size: 300, x: .17, y: .78, vx: 22, vy: -18, maxSpeed: 42, nextImpulse: 0 },
    { className: 'ambient-orb--tertiary', size: 190, x: .52, y: .45, vx: -16, vy: -22, maxSpeed: 42, nextImpulse: 0 },
    { className: 'ambient-orb--accent', size: 120, x: .38, y: .16, vx: 28, vy: 14, maxSpeed: 42, nextImpulse: 0 }
  ].map(config => {
    const element = document.createElement('div');
    element.className = `ambient-orb ${config.className}`;
    element.setAttribute('aria-hidden', 'true');
    stage.appendChild(element);
    return { ...config, element };
  });

  const bounds = () => ({ width: window.innerWidth, height: window.innerHeight });
  const resize = () => {
    const { width, height } = bounds();
    orbs.forEach(orb => {
      orb.x = Math.min(width, Math.max(0, width * orb.xRatio));
      orb.y = Math.min(height, Math.max(0, height * orb.yRatio));
    });
  };

  orbs.forEach(orb => {
    orb.xRatio = orb.x;
    orb.yRatio = orb.y;
  });
  resize();

  let previousTime;
  const animate = time => {
    if (!previousTime) previousTime = time;
    const delta = Math.min((time - previousTime) / 1000, .04);
    previousTime = time;
    const { width, height } = bounds();

    orbs.forEach(orb => {
      const radius = orb.size / 2;
      if (time >= orb.nextImpulse) {
        const angle = Math.random() * Math.PI * 2;
        const impulse = 5 + Math.random() * 8;
        orb.vx += Math.cos(angle) * impulse * delta;
        orb.vy += Math.sin(angle) * impulse * delta;
        orb.nextImpulse = time + 2600 + Math.random() * 4200;
      }
      const speed = Math.hypot(orb.vx, orb.vy);
      if (speed > orb.maxSpeed) {
        orb.vx = orb.vx / speed * orb.maxSpeed;
        orb.vy = orb.vy / speed * orb.maxSpeed;
      }
      orb.x += orb.vx * delta;
      orb.y += orb.vy * delta;
      if (orb.x < -radius) {
        orb.x = width + radius;
      } else if (orb.x > width + radius) {
        orb.x = -radius;
      }
      if (orb.y < -radius) {
        orb.y = height + radius;
      } else if (orb.y > height + radius) {
        orb.y = -radius;
      }
    });

    orbs.forEach(orb => {
      orb.element.style.transform = `translate3d(${orb.x}px, ${orb.y}px, 0) translate3d(-50%, -50%, 0)`;
    });
    window.requestAnimationFrame(animate);
  };

  window.addEventListener('resize', resize, { passive: true });
  window.requestAnimationFrame(animate);
};

const initCursorCat = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cat = document.createElement('div');
  cat.className = 'cursor-cat';
  cat.setAttribute('aria-hidden', 'true');
  cat.innerHTML = '<span class="cat-sprite"></span>';
  document.body.appendChild(cat);
  const sprite = cat.querySelector('.cat-sprite');
  const movementFrames = {
    right: [[3, 0], [3, 1]], downright: [[5, 1], [5, 2]], down: [[6, 3], [7, 2]], downleft: [[5, 3], [6, 1]],
    left: [[4, 2], [4, 3]], upleft: [[1, 0], [1, 1]], up: [[1, 2], [1, 3]], upright: [[0, 2], [0, 3]]
  };
  const idleFrames = {
    rest: [[7, 3], [7, 3], [5, 0], [6, 0]],
    scratch: [[5, 0], [6, 0]],
    yawn: [[3, 2], [3, 3]]
  };

  const state = { x: window.innerWidth * .5, y: window.innerHeight * .52, vx: 0, vy: 0, targetX: window.innerWidth * .5, targetY: window.innerHeight * .52, pointerX: 0, pointerY: 0, active: false, lastPointerTime: 0, idleTimer: 0, actionTimer: 0, playUntil: 0, spriteDirection: 'down', frameIndex: 0, frameTime: 0, actionFrames: null, actionUntil: 0, lastRestAnimation: 'scratch' };
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const clearIdleAction = () => {
    window.clearTimeout(state.idleTimer);
    window.clearTimeout(state.actionTimer);
    state.actionFrames = null;
    state.actionUntil = 0;
    cat.classList.remove('is-curious');
  };
  const setIdleBehavior = () => {
    window.clearTimeout(state.idleTimer);
    state.idleTimer = window.setTimeout(() => {
      const remainingDistance = Math.hypot(state.targetX - state.x, state.targetY - state.y);
      if (remainingDistance > 42 || Math.hypot(state.vx, state.vy) > 12) {
        setIdleBehavior();
        return;
      }
      state.targetX = state.x;
      state.targetY = state.y;
      state.vx = 0;
      state.vy = 0;
      state.lastRestAnimation = state.lastRestAnimation === 'yawn' ? 'scratch' : 'yawn';
      state.actionFrames = idleFrames[state.lastRestAnimation];
      const actionDuration = 4200 + Math.random() * 800;
      state.actionUntil = performance.now() + actionDuration;
      state.frameIndex = 0;
      state.frameTime = performance.now();
      cat.classList.add('is-curious');
      state.actionTimer = window.setTimeout(() => {
        state.actionFrames = null;
        state.actionUntil = 0;
        cat.classList.remove('is-curious');
        if (state.active && performance.now() - state.lastPointerTime > 500) setIdleBehavior();
      }, actionDuration);
    }, 620 + Math.random() * 480);
  };

  if (isTouchDevice) {
    state.pointerX = state.x + 32;
    state.pointerY = state.y + 32;
    state.active = true;
    state.lastPointerTime = performance.now();
    cat.classList.add('is-visible');
    setIdleBehavior();
  }

  window.addEventListener('pointermove', event => {
    const now = performance.now();
    if (state.actionFrames && now < state.actionUntil) {
      clearIdleAction();
    }
    if (!state.active) {
      state.pointerX = event.clientX;
      state.pointerY = event.clientY;
      state.lastPointerTime = now;
      state.targetX = event.clientX - 32;
      state.targetY = event.clientY - 32;
      state.active = true;
      cat.classList.add('is-visible');
      setIdleBehavior();
      return;
    }
    clearIdleAction();
    const elapsed = Math.max(now - state.lastPointerTime, 16);
    const movementX = event.clientX - state.pointerX;
    const movementY = event.clientY - state.pointerY;
    const pointerVelocityX = movementX / elapsed * 16;
    const pointerVelocityY = movementY / elapsed * 16;
    const pointerSpeed = Math.hypot(pointerVelocityX, pointerVelocityY);
    const followDistance = Math.min(18, 4 + pointerSpeed * .25);
    const directionX = pointerSpeed ? pointerVelocityX / pointerSpeed : 0;
    const directionY = pointerSpeed ? pointerVelocityY / pointerSpeed : 0;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.lastPointerTime = now;
    state.actionFrames = null;
    state.actionUntil = 0;
    state.targetX = event.clientX - 32 - directionX * followDistance;
    state.targetY = event.clientY - 32 - directionY * followDistance;
    if (Math.hypot(event.clientX - state.x, event.clientY - state.y) < 105) state.playUntil = now + 720;
    state.active = true;
    cat.classList.add('is-visible');
    setIdleBehavior();
  }, { passive: true });

  let previousTime;
  const animate = time => {
    if (!previousTime) previousTime = time;
    const delta = Math.min((time - previousTime) / 1000, .033);
    previousTime = time;
    if (state.active) {
      const pointerDistance = Math.hypot(state.pointerX - state.x, state.pointerY - state.y) || 1;
      if (time < state.playUntil) {
        const awayX = (state.x - state.pointerX) / pointerDistance;
        const awayY = (state.y - state.pointerY) / pointerDistance;
        state.targetX = state.pointerX - 32 + awayX * 76;
        state.targetY = state.pointerY - 32 + awayY * 76;
        cat.classList.add('is-playing');
      } else {
        cat.classList.remove('is-playing');
      }
      const distance = Math.hypot(state.targetX - state.x, state.targetY - state.y);
      const stiffness = distance > 180 ? 68 : 74;
      const damping = 16;
      let accelerationX = (state.targetX - state.x) * stiffness;
      let accelerationY = (state.targetY - state.y) * stiffness;
      const acceleration = Math.hypot(accelerationX, accelerationY);
      const maximumAcceleration = 2600;
      if (acceleration > maximumAcceleration) {
        accelerationX = accelerationX / acceleration * maximumAcceleration;
        accelerationY = accelerationY / acceleration * maximumAcceleration;
      }
      state.vx += accelerationX * delta;
      state.vy += accelerationY * delta;
      state.vx *= Math.exp(-damping * delta);
      state.vy *= Math.exp(-damping * delta);
      const maximumSpeed = state.playUntil > time ? 240 : 300;
      const velocity = Math.hypot(state.vx, state.vy);
      if (velocity > maximumSpeed) {
        state.vx = state.vx / velocity * maximumSpeed;
        state.vy = state.vy / velocity * maximumSpeed;
      }
      state.x += state.vx * delta;
      state.y += state.vy * delta;
      const travelAngle = Math.atan2(state.vy, state.vx) * 180 / Math.PI;
      const lean = Math.max(-9, Math.min(9, state.vx * .08));
      const lookX = Math.max(-3, Math.min(3, (state.pointerX - state.x) * .025));
      const speed = Math.hypot(state.vx, state.vy);
      const directionNames = ['right', 'downright', 'down', 'downleft', 'left', 'upleft', 'up', 'upright'];
      const directionIndex = Math.round((travelAngle + 360) % 360 / 45) % 8;
      if (speed > 3) state.spriteDirection = directionNames[directionIndex];
      const isActing = state.actionFrames && time < state.actionUntil;
      const isIdle = performance.now() - state.lastPointerTime > 500;
      const movementSequence = movementFrames[state.spriteDirection] || movementFrames.down;
      const frames = isActing ? state.actionFrames : speed > 3 ? movementSequence : isIdle ? idleFrames.rest : [[7, 3]];
      state.frameIndex %= frames.length;
      if (speed > 3 || state.actionFrames || isIdle) {
        if (time - state.frameTime > (state.actionFrames ? 190 : Math.max(115, 230 - speed * 4))) {
          state.frameIndex = (state.frameIndex + 1) % frames.length;
          state.frameTime = time;
        }
      } else {
        state.frameIndex = 0;
      }
      const [spriteColumn, spriteRow] = frames[state.frameIndex];
      sprite.style.backgroundPosition = `${-spriteColumn * 64}px ${-spriteRow * 64}px`;
      cat.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${lean}deg)`;
      cat.style.setProperty('--look-x', `${lookX}px`);
      cat.style.setProperty('--travel-angle', `${travelAngle}deg`);
      cat.style.setProperty('--bounce', `${Math.min(3, speed * .018)}px`);
      cat.style.setProperty('--walk-speed', `${Math.max(.16, Math.min(.34, .34 - speed * .004))}s`);
      
      cat.classList.toggle('is-walking', speed > 12);
    }
    window.requestAnimationFrame(animate);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      previousTime = undefined;
      state.frameTime = performance.now();
      state.vx = 0;
      state.vy = 0;
    }
  });
  window.requestAnimationFrame(animate);
};

document.addEventListener('DOMContentLoaded', () => {
  initAmbientCollision();
  initCursorCat();
  const preloader = document.querySelector('.preloader');
  window.setTimeout(() => preloader?.classList.add('done'), 450);

  const menu = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav-links');
  menu?.addEventListener('click', () => {
    if (!nav) return;
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.textContent = open ? '×' : '☰';
  });

  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('portfolio-theme', next);
    } catch {
    }
  });

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${index * 120}ms`);
  });
  document.querySelectorAll('.progress i').forEach((bar, index) => {
    bar.style.setProperty('--bar-delay', `${index * 120}ms`);
  });
  const showReveal = element => {
    element.classList.add('visible');
    element.querySelectorAll('.progress i').forEach(bar => { bar.style.width = bar.dataset.level; });
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= .12) {
          showReveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: [0, .12] });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(showReveal);
  }

  document.querySelectorAll('.btn').forEach(button => button.addEventListener('click', event => {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(button.clientWidth, button.clientHeight);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.offsetX - size / 2}px`;
    ripple.style.top = `${event.offsetY - size / 2}px`;
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }));

  document.querySelectorAll('.filter').forEach(filter => filter.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(item => {
      item.classList.remove('active');
      item.setAttribute('aria-pressed', 'false');
    });
    filter.classList.add('active');
    filter.setAttribute('aria-pressed', 'true');
    const value = filter.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const tags = card.dataset.tags?.split(/\s+/) || [];
      card.hidden = value !== 'all' && !tags.includes(value);
    });
  }));

  const lightbox = document.querySelector('.lightbox');
  document.querySelectorAll('.gallery-item').forEach(item => item.addEventListener('click', () => {
    if (!lightbox) return;
    lightbox.querySelector('.gallery-art').className = `gallery-art ${item.dataset.art}`;
    lightbox.querySelector('h2').textContent = item.dataset.title;
    lightbox.classList.add('open');
    lightbox.querySelector('.lightbox-close').focus();
  }));
  document.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.classList.remove('open'); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      lightbox?.classList.remove('open');
      nav?.classList.remove('open');
      menu?.setAttribute('aria-expanded', 'false');
      menu?.setAttribute('aria-label', 'Open menu');
      if (menu) menu.textContent = '☰';
    }
  });

  document.querySelector('.contact-form')?.addEventListener('submit', event => {
    const form = event.currentTarget;
    const message = form.querySelector('.form-message');
    const issueField = form.querySelector('#message');
    if (!form.checkValidity()) {
      event.preventDefault();
      message.textContent = 'Please complete each field before sending.';
      message.className = 'form-message error';
      form.reportValidity();
      return;
    }
    if (!issueField.value.trim()) {
      event.preventDefault();
      message.textContent = 'Please describe the issue before sending.';
      message.className = 'form-message error';
      issueField.focus();
      return;
    }
    event.preventDefault();
    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const issue = String(formData.get('message') || '').trim();
    const subject = `Inquiry from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${issue}`;
    window.location.href = `mailto:iamdrzeus14@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    message.textContent = 'Your email app is opening with the message ready to send.';
    message.className = 'form-message success';
  });

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
});

console.log('%cHello, fellow builder. %cTry the theme toggle, then inspect the source.', 'color:#e77d5a;font-weight:bold', 'color:#a8b4ac');
