/**
 * Scroll-reveal, counters, hero parallax and the testimonials carousel.
 * Everything motion-heavy is gated behind `motionOK`.
 */

import { motionOK, rafThrottle } from './ui.js';
import { TESTIMONIALS } from './data.js';
import { renderTestimonials } from './render.js';

/**
 * Reveal-on-scroll. The hidden state lives in CSS under `html.js`, so if the
 * module ever fails to load the content simply stays visible.
 */
export function initReveal(root = document) {
  const items = root.querySelectorAll('.reveal:not(.is-visible)');
  if (!items.length) return;

  if (!motionOK) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
}

/** Animated stat counters. Targets come from data attributes, not text parsing. */
export function initCounters() {
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;

  const paint = (el, value) => {
    const suffix = el.dataset.suffix || '';
    const compact = Number(el.dataset.count) >= 1000 && el.dataset.compact === 'true';
    const shown = compact ? `${Math.round(value / 1000)}K` : Math.round(value).toLocaleString('en-IN');
    el.textContent = `${shown}${suffix}`;
  };

  if (!motionOK) {
    nums.forEach((el) => paint(el, Number(el.dataset.count)));
    return;
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const run = (el) => {
    const target = Number(el.dataset.count) || 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      paint(el, target * easeOut(t));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  nums.forEach((el) => observer.observe(el));
}

/** Subtle hero parallax. Desktop only — it costs more than it gives on phones. */
export function initParallax() {
  const layer = document.querySelector('.hero-food-img');
  const bg = document.querySelector('.hero-img');
  if (!layer || !motionOK || window.matchMedia('(max-width: 900px)').matches) return;

  const onScroll = rafThrottle(() => {
    const y = window.scrollY;
    if (y > window.innerHeight) return; // stop working once the hero is gone
    layer.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
    if (bg) bg.style.transform = `translate3d(0, ${y * 0.05}px, 0) scale(1.06)`;
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/** Testimonials carousel: autoplay, swipe, dots, arrow keys. */
export function initCarousel() {
  const root = document.getElementById('testimonials');
  const track = document.getElementById('testimonialTrack');
  const dotHost = document.getElementById('testimonialDots');
  if (!root || !track) return;

  renderTestimonials(track, TESTIMONIALS);

  const slides = Array.from(track.children);
  if (!slides.length) return;

  let index = 0;
  let timer = null;

  const perView = () => (window.matchMedia('(min-width: 900px)').matches ? 2 : 1);
  const maxIndex = () => Math.max(0, slides.length - perView());

  /**
   * Slide width is driven from here so the CSS and the translate maths can
   * never disagree — the track advances exactly one slide per step.
   */
  function syncWidths() {
    track.style.setProperty('--per', String(perView()));
  }

  /** Only as many dots as there are reachable positions. */
  function renderDots() {
    if (!dotHost) return;
    const pages = maxIndex() + 1;
    dotHost.innerHTML = Array.from({ length: pages }, (_, i) => `
      <button class="dot" type="button" data-slide="${i}"
              aria-label="Go to testimonial ${i + 1} of ${pages}"></button>`).join('');
  }

  function go(next) {
    index = Math.max(0, Math.min(next, maxIndex()));
    track.style.transform = `translate3d(-${index * (100 / perView())}%, 0, 0)`;
    dotHost?.querySelectorAll('.dot').forEach((d, i) => {
      const active = i === index;
      d.classList.toggle('is-active', active);
      d.setAttribute('aria-current', String(active));
    });
  }

  const next = () => go(index >= maxIndex() ? 0 : index + 1);
  const prev = () => go(index <= 0 ? maxIndex() : index - 1);

  function play() {
    if (!motionOK || maxIndex() === 0) return;
    stop();
    timer = setInterval(next, 5200);
  }
  const stop = () => clearInterval(timer);

  root.querySelector('[data-carousel-next]')?.addEventListener('click', () => { next(); play(); });
  root.querySelector('[data-carousel-prev]')?.addEventListener('click', () => { prev(); play(); });

  dotHost?.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-slide]');
    if (dot) { go(Number(dot.dataset.slide)); play(); }
  });

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', play);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', play);

  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); play(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); play(); }
  });

  /* Pointer swipe */
  let startX = 0;
  let dragging = false;

  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    stop();
  });

  track.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
    play();
  });

  track.addEventListener('pointercancel', () => { dragging = false; play(); });

  // Crossing the breakpoint changes how many slides fit, so widths, dots and
  // the clamped index all have to be recomputed.
  let lastPerView = perView();
  window.addEventListener('resize', rafThrottle(() => {
    if (perView() === lastPerView) return go(index);
    lastPerView = perView();
    syncWidths();
    renderDots();
    go(index);
  }));

  syncWidths();
  renderDots();
  go(0);
  play();
}
