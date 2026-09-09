/** Bootstrap: wire every module once the DOM is parsed. */

import { renderCategories, renderCredits } from './render.js';
import { IMAGE_CREDITS } from './data.js';
import { initSearch } from './search.js';
import { initCart } from './cart.js';
import { initNav, initTheme } from './nav.js';
import { initReveal, initCounters, initParallax, initCarousel } from './animations.js';
import { toast, initImageFallback } from './ui.js';

function boot() {
  initImageFallback();   // must be listening before any image starts loading
  initTheme();
  initNav();

  renderCategories(document.getElementById('categoriesGrid'));

  initCart();
  initCarousel();
  initCounters();
  initParallax();

  // Re-scan for new .reveal nodes each time the results grid is re-rendered.
  const search = initSearch({ onResults: () => initReveal() });
  search.start();

  initReveal();
  renderCredits(document.getElementById('creditList'), IMAGE_CREDITS);
  initNewsletter();
  initStubs();
}

function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.elements.email;
    const error = form.querySelector('.field__error');
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());

    if (error) {
      error.textContent = valid ? '' : 'Please enter a valid email address.';
      error.hidden = valid;
    }
    input.setAttribute('aria-invalid', String(!valid));
    form.classList.toggle('has-error', !valid);

    if (!valid) return input.focus();

    form.reset();
    toast('Subscribed — look out for our weekly deals.', 'success');
  });
}

/** Buttons with no backend behind them yet. */
function initStubs() {
  document.getElementById('locationBtn')?.addEventListener('click', () => {
    document.getElementById('filterCity')?.focus();
    document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('[data-stub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toast(`${btn.dataset.stub} isn’t wired up in this demo.`, 'info');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
