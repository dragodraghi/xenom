/* ============================================
   XENOM BAD BOARS EDITION — Animations
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMobileMenu();
  initBackToTop();
  initRevealAnimations();
  initCounterAnimations();
  renderEvents();
  renderAthletes();
  renderSchedule();
  renderEPILevels();
});

/* --- Navigation scroll effect --- */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 80);
  });

  // Smooth scroll for nav links (exclude bare "#" to avoid invalid selector)
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* --- Mobile Menu --- */
function initMobileMenu() {
  const hamburger = document.querySelector('.nav__hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const closeBtn = document.getElementById('mobile-close');
  if (!hamburger || !drawer) return;

  hamburger.addEventListener('click', () => {
    drawer.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  function closeDrawer() {
    drawer.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeDrawer);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      closeDrawer();
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        setTimeout(() => {
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    });
  });
}

/* --- Back to top button --- */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'all';
    } else {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* --- Scroll reveal via IntersectionObserver --- */
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* --- Counter animation --- */
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-counter'), 10);
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(eased * target);
    el.textContent = current.toLocaleString('it-IT');

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString('it-IT');
    }
  }

  requestAnimationFrame(update);
}

/* --- Render Events from data.js --- */
function renderEvents() {
  const container = document.getElementById('events-list');
  if (!container || typeof XENOM_DATA === 'undefined') return;

  XENOM_DATA.eventi.forEach((evento, i) => {
    const isMystery = evento.categoria === 'mystery';
    const card = document.createElement('div');
    card.className = `event-card reveal ${isMystery ? 'event-card--mystery' : ''}`;
    card.setAttribute('data-cat', evento.categoria);
    card.style.transitionDelay = `${i * 0.08}s`;

    card.innerHTML = `
      <div class="event-card__number">
        <span>${String(evento.numero).padStart(3, '0')}</span>
      </div>
      <div class="event-card__body">
        <div class="event-card__title">${evento.nome}</div>
        <div class="event-card__subtitle">${evento.nomeIT} — <span class="badge badge--${evento.categoria}">${evento.categoriaLabel}</span></div>
        <p>${evento.descrizione}</p>
        <div class="event-card__meta">
          <span class="event-card__tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${evento.tempo}
          </span>
          <span class="event-card__tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            ${evento.formato}
          </span>
          ${evento.pesoRX_M !== '—' && evento.pesoRX_M !== 'TBD' ? `
          <span class="event-card__tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="6" y="7" width="3" height="10" rx="0.5"/><rect x="15" y="7" width="3" height="10" rx="0.5"/></svg>
            ${evento.pesoRX_M}${evento.pesoRX_F && evento.pesoRX_F !== evento.pesoRX_M ? ' / ' + evento.pesoRX_F : ''}
          </span>` : ''}
        </div>
      </div>
      <div class="event-card__side">
        <span class="event-card__icon">${evento.icona}</span>
      </div>
    `;

    container.appendChild(card);
  });

  // Re-init observer for new elements
  initRevealAnimations();
}

/* --- Render Athletes from data.js --- */
function renderAthletes() {
  const container = document.getElementById('athletes-grid');
  if (!container || typeof XENOM_DATA === 'undefined') return;

  XENOM_DATA.atleti.forEach((atleta, i) => {
    const card = document.createElement('div');
    card.className = 'athlete-card reveal';
    card.style.transitionDelay = `${i * 0.06}s`;

    card.innerHTML = `
      <span class="athlete-card__number">#${String(atleta.id).padStart(2, '0')}</span>
      <div class="athlete-card__avatar" style="background: linear-gradient(135deg, ${atleta.gradientFrom}, ${atleta.gradientTo});">
        ${String(atleta.id).padStart(2, '0')}
      </div>
      <div class="athlete-card__name">${atleta.nome}</div>
      <div class="athlete-card__info">${atleta.eta} anni — ${atleta.box}</div>
    `;

    container.appendChild(card);
  });

  initRevealAnimations();
}

/* --- Render Schedule from data.js --- */
function renderSchedule() {
  const container = document.getElementById('schedule-timeline');
  if (!container || typeof XENOM_DATA === 'undefined') return;

  XENOM_DATA.programma.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = `schedule__item schedule__item--${item.tipo} reveal`;
    div.style.transitionDelay = `${i * 0.05}s`;

    div.innerHTML = `
      <div class="schedule__time">${item.ora}</div>
      <div class="schedule__activity">${item.attivita}</div>
    `;

    container.appendChild(div);
  });

  initRevealAnimations();
}

/* --- Render EPI Levels --- */
function renderEPILevels() {
  const container = document.getElementById('epi-levels');
  if (!container || typeof XENOM_DATA === 'undefined') return;

  const maxScore = XENOM_DATA.epiSystem.maxTeorico;

  XENOM_DATA.epiSystem.livelli.forEach(level => {
    const div = document.createElement('div');
    div.className = 'epi__level';
    const width = (level.min / maxScore) * 100;

    div.innerHTML = `
      <span class="epi__level-name">${level.emoji} ${level.nome}</span>
      <div class="epi__level-bar">
        <div class="epi__level-bar-fill" style="width: ${Math.max(width, 5)}%; background: ${level.colore};"></div>
      </div>
      <span class="epi__level-range" style="color: ${level.colore};">${level.min.toLocaleString('it-IT')}+</span>
    `;

    container.appendChild(div);
  });
}

/* --- Animate EPI Gauge on scroll --- */
function animateEPIGauge() {
  const gauge = document.querySelector('.epi__gauge-fill');
  const scoreEl = document.querySelector('.epi__gauge-number');
  if (!gauge || !scoreEl) return;

  const targetScore = 7850;
  const circumference = 753;
  const percentage = targetScore / 12000;
  const offset = circumference - (circumference * percentage);

  gauge.style.strokeDashoffset = offset;

  // Animate number
  animateCounter(scoreEl);
  scoreEl.setAttribute('data-counter', targetScore);
}

// Observe EPI section
const epiSection = document.getElementById('epi');
if (epiSection) {
  const epiObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateEPIGauge();
        epiObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  epiObserver.observe(epiSection);
}
