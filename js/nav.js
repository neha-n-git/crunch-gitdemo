/**
 * Navbar behaviour: mobile menu, scroll state, scrollspy, reading progress,
 * back-to-top and the theme toggle.
 *
 * All scroll work runs through a single rAF-coalesced listener; the active
 * section comes from an IntersectionObserver rather than per-event offsetTop
 * reads, which forced a layout on every scroll tick in the old build.
 */

import { rafThrottle } from './ui.js';
import { storedTheme, storeTheme } from './store.js';

export function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      toggle.querySelector('i').className = theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    }
  };

  apply(storedTheme() ?? (media.matches ? 'dark' : 'light'));

  // Follow the OS only while the user hasn't made an explicit choice.
  media.addEventListener('change', (e) => {
    if (!storedTheme()) apply(e.matches ? 'dark' : 'light');
  });

  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    storeTheme(next);
    apply(next);
  });
}

export function initNav() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const progress = document.getElementById('scrollProgress');
  const toTop = document.getElementById('backToTop');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));

  /* ── Mobile menu ────────────────────────────────────────────────── */

  const setMenu = (open) => {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.querySelector('i').className = open ? 'fa fa-xmark' : 'fa fa-bars';
  };

  hamburger?.addEventListener('click', () => {
    setMenu(!mobileMenu.classList.contains('is-open'));
  });

  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  document.addEventListener('click', (e) => {
    if (!mobileMenu?.classList.contains('is-open')) return;
    if (!e.target.closest('#mobileMenu') && !e.target.closest('#hamburger')) setMenu(false);
  });

  /* ── Scroll state (one listener for everything) ─────────────────── */

  const onScroll = rafThrottle(() => {
    const y = window.scrollY;
    navbar?.classList.toggle('is-scrolled', y > 20);
    toTop?.classList.toggle('is-visible', y > 600);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── Scrollspy ──────────────────────────────────────────────────── */

  // Include the footer: the old selector was `section[id]`, so #contact —
  // which is a <footer> — could never light up.
  const targets = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (targets.length) {
    const setActive = (id) => {
      navLinks.forEach((a) => {
        a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`);
      });
    };

    const spy = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, {
      // Band across the middle of the viewport, below the fixed navbar.
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0, 0.25, 0.5, 1],
    });

    targets.forEach((el) => spy.observe(el));
  }
}
