/**
 * Restaurant search and filtering.
 *
 * Filters compose: keyword AND city AND category, then sorted. The keyword
 * matches restaurant name, area, cuisine labels and dish names, so searching
 * "tiramisu" finds the restaurant that serves it.
 */

import { RESTAURANTS, CATEGORIES } from './data.js';
import { renderRestaurants, renderEmptyState, renderSkeletons } from './render.js';
import { debounce, escapeHTML } from './ui.js';

const filters = { keyword: '', city: '', category: '', sort: 'relevance' };

const labelFor = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

function matchesKeyword(r, q) {
  if (!q) return true;
  const haystack = [
    r.name, r.area, r.city,
    ...r.cuisines.map(labelFor),
    ...r.menu.map((m) => m.name),
  ].join(' ').toLowerCase();
  // Every whitespace-separated term must appear somewhere.
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

const SORTS = {
  relevance: (a, b) => b.rating - a.rating,
  rating: (a, b) => b.rating - a.rating,
  eta: (a, b) => a.eta - b.eta,
  delivery: (a, b) => a.deliveryFee - b.deliveryFee || b.rating - a.rating,
  price: (a, b) => a.priceForTwo - b.priceForTwo,
};

export function currentResults() {
  return RESTAURANTS
    .filter((r) => matchesKeyword(r, filters.keyword))
    .filter((r) => !filters.city || r.city === filters.city)
    .filter((r) => !filters.category || r.cuisines.includes(filters.category))
    .sort(SORTS[filters.sort] || SORTS.relevance);
}

export function initSearch({ onResults } = {}) {
  const grid = document.getElementById('restaurantsGrid');
  const countEl = document.getElementById('resultCount');
  const chipHost = document.getElementById('activeFilters');
  const sortEl = document.getElementById('sortBy');
  const cityEl = document.getElementById('filterCity');
  const keywordEl = document.getElementById('filterKeyword');
  const heroKeyword = document.getElementById('heroKeyword');
  const heroCity = document.getElementById('heroCity');
  const heroForm = document.getElementById('heroSearchForm');

  function apply({ scroll = false } = {}) {
    const results = currentResults();

    if (results.length) renderRestaurants(grid, results);
    else renderEmptyState(grid, filters.keyword);

    if (countEl) {
      countEl.textContent = results.length === 1
        ? '1 restaurant'
        : `${results.length} restaurants`;
    }
    renderChips();
    onResults?.(results);

    if (scroll) {
      document.getElementById('restaurants')?.scrollIntoView({
        behavior: 'smooth', block: 'start',
      });
    }
  }

  function renderChips() {
    if (!chipHost) return;
    const chips = [];
    if (filters.keyword) chips.push(['keyword', `“${escapeHTML(filters.keyword)}”`]);
    if (filters.city) chips.push(['city', escapeHTML(filters.city)]);
    if (filters.category) chips.push(['category', escapeHTML(labelFor(filters.category))]);

    chipHost.innerHTML = chips.length
      ? chips.map(([key, label]) => `
          <button class="chip" type="button" data-remove-filter="${key}">
            ${label} <i class="fa fa-xmark" aria-hidden="true"></i>
          </button>`).join('')
        + '<button class="chip chip--clear" type="button" data-clear-filters>Clear all</button>'
      : '';
  }

  /** Keep the hero and filter-bar inputs showing the same state. */
  function syncInputs() {
    if (keywordEl) keywordEl.value = filters.keyword;
    if (heroKeyword) heroKeyword.value = filters.keyword;
    if (cityEl) cityEl.value = filters.city;
    if (heroCity) heroCity.value = filters.city;
    document.querySelectorAll('[data-category]').forEach((btn) => {
      const active = btn.dataset.category === filters.category;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  const setKeyword = debounce((value) => {
    filters.keyword = value.trim();
    syncInputs();
    apply();
  }, 250);

  keywordEl?.addEventListener('input', (e) => setKeyword(e.target.value));

  cityEl?.addEventListener('change', (e) => {
    filters.city = e.target.value;
    syncInputs();
    apply();
  });

  sortEl?.addEventListener('change', (e) => {
    filters.sort = e.target.value;
    apply();
  });

  heroForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    filters.keyword = heroKeyword?.value.trim() ?? '';
    filters.city = heroCity?.value ?? '';
    syncInputs();
    apply({ scroll: true });
  });

  // Category cards act as toggles; clicking the active one clears it.
  document.getElementById('categoriesGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    filters.category = filters.category === btn.dataset.category ? '' : btn.dataset.category;
    syncInputs();
    apply({ scroll: true });
  });

  // Chip removal and "clear all", from both the chip bar and the empty state.
  document.addEventListener('click', (e) => {
    const remove = e.target.closest('[data-remove-filter]');
    if (remove) {
      filters[remove.dataset.removeFilter] = '';
      syncInputs();
      apply();
      return;
    }
    if (e.target.closest('[data-clear-filters]')) {
      filters.keyword = '';
      filters.city = '';
      filters.category = '';
      syncInputs();
      apply();
    }
  });

  /** Boot: show skeletons briefly so the loading path is real, then render. */
  function start() {
    renderSkeletons(grid, 6);
    setTimeout(() => { syncInputs(); apply(); }, 450);
  }

  return { start, apply, filters };
}
