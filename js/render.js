/** Card templates and mount points. Pure string building — no event wiring. */

import { CATEGORIES, CATEGORY_IMG, categoryCounts } from './data.js';
import { escapeHTML, rupees } from './ui.js';
import { isFavourite, qtyOf } from './store.js';

/** Local category art to fall back to when a hotlinked photo fails. */
const fallbackFor = (category) => CATEGORY_IMG[category] || 'images/burger.jpg';

/** A restaurant's fallback follows its first cuisine. */
const restFallback = (r) => fallbackFor(r.cuisines[0]);

/* ── Storefront ───────────────────────────────────────────────────── */

/** Stable 0-359 hue from a string, so each shopfront keeps its own colour. */
function hueOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

/**
 * Drawn shopfront for restaurants we have no genuine photo of.
 *
 * Deliberately an illustration rather than a stock photo of some other
 * building: it shows a storefront carrying this restaurant's own name without
 * passing another business's premises off as theirs.
 */
function storefront(r) {
  const hue = hueOf(r.id);
  const wall = `hsl(${hue} 30% 26%)`;
  const wallDark = `hsl(${hue} 32% 18%)`;
  const trim = `hsl(${hue} 38% 34%)`;
  const name = escapeHTML(r.name.toUpperCase());
  // Long names need to shrink to stay inside the signboard.
  const size = r.name.length > 20 ? 30 : r.name.length > 14 ? 36 : 44;
  const id = `sf-${r.id}`;

  return `
    <svg class="storefront" viewBox="0 0 800 450" role="img"
         aria-label="Illustrated storefront for ${escapeHTML(r.name)}" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${wallDark}"/><stop offset="1" stop-color="${wall}"/>
        </linearGradient>
        <linearGradient id="${id}-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFC120" stop-opacity=".55"/>
          <stop offset="1" stop-color="#FFC120" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <rect width="800" height="450" fill="url(#${id}-sky)"/>
      <rect y="300" width="800" height="150" fill="${wallDark}"/>

      <!-- signboard -->
      <rect x="80" y="52" width="640" height="86" rx="8" fill="${trim}"/>
      <rect x="92" y="64" width="616" height="62" rx="4" fill="${wallDark}"/>
      <text x="400" y="105" text-anchor="middle" fill="#FFC120"
            font-family="Poppins, system-ui, sans-serif" font-weight="800"
            font-size="${size}" letter-spacing="1.5">${name}</text>

      <!-- striped awning -->
      <g>
        <path d="M60 150 H740 L770 224 H30 Z" fill="#FFC120"/>
        ${Array.from({ length: 8 }, (_, i) =>
          `<path d="M${60 + i * 85} 150 H${103 + i * 85} L${76 + i * 85} 224 H${33 + i * 85} Z" fill="#111" opacity=".14"/>`
        ).join('')}
        <path d="M30 224 H770 V236 H30 Z" fill="${trim}"/>
      </g>

      <!-- windows and door, warm light spilling out -->
      <rect x="70" y="262" width="200" height="150" rx="6" fill="#1b1b1f"/>
      <rect x="82" y="274" width="176" height="126" rx="4" fill="#FFC120" opacity=".18"/>
      <rect x="530" y="262" width="200" height="150" rx="6" fill="#1b1b1f"/>
      <rect x="542" y="274" width="176" height="126" rx="4" fill="#FFC120" opacity=".18"/>
      <rect x="320" y="250" width="160" height="200" rx="8" fill="#15151a"/>
      <rect x="332" y="262" width="136" height="176" rx="5" fill="#FFC120" opacity=".26"/>
      <circle cx="452" cy="352" r="6" fill="#FFC120"/>
      <rect x="300" y="430" width="200" height="20" rx="4" fill="${trim}"/>
      <rect x="240" y="236" width="320" height="120" fill="url(#${id}-glow)" opacity=".5"/>
    </svg>`;
}

const stars = (rating) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '<i class="fa fa-star"></i>';
    if (i === full && half) return '<i class="fa fa-star-half-stroke"></i>';
    return '<i class="fa-regular fa-star"></i>';
  }).join('');
};

/* ── Categories ───────────────────────────────────────────────────── */

export function renderCategories(container) {
  if (!container) return;
  const counts = categoryCounts();

  container.innerHTML = CATEGORIES.map((cat, i) => `
    <button class="cat-card reveal" type="button" data-category="${cat.id}"
            style="--i:${i}" aria-pressed="false">
      <span class="cat-img-wrap">
        <img src="${cat.img}" alt="" width="400" height="400" loading="lazy" decoding="async"/>
      </span>
      <span class="cat-card__name">${escapeHTML(cat.name)}</span>
      <span class="cat-card__count">${counts.get(cat.id)} dishes</span>
    </button>`).join('');
}

/* ── Restaurants ──────────────────────────────────────────────────── */

export function restaurantCard(r, index = 0) {
  const fav = isFavourite(r.id);
  const delivery = r.deliveryFee === 0
    ? '<span class="tag tag--free"><i class="fa fa-motorcycle"></i> Free Delivery</span>'
    : `<span><i class="fa fa-motorcycle"></i> ${rupees(r.deliveryFee)} Delivery</span>`;

  return `
    <article class="rest-card reveal" style="--i:${index}" data-restaurant="${r.id}">
      <div class="rest-img-wrap">
        ${r.exterior === 'photo'
          ? `<img src="${r.img}" alt="${escapeHTML(r.name)} storefront" width="800" height="450"
                  loading="lazy" decoding="async" referrerpolicy="no-referrer"
                  data-fallback="${restFallback(r)}"/>`
          : storefront(r)}
        <span class="rest-badge"><i class="fa fa-star"></i> ${r.rating.toFixed(1)}</span>
        <button class="rest-fav ${fav ? 'is-active' : ''}" type="button"
                data-fav="${r.id}" aria-pressed="${fav}"
                aria-label="${fav ? 'Remove' : 'Add'} ${escapeHTML(r.name)} ${fav ? 'from' : 'to'} favourites">
          <i class="fa${fav ? '' : '-regular'} fa-heart" aria-hidden="true"></i>
        </button>
      </div>
      <div class="rest-info">
        <h4>${escapeHTML(r.name)}</h4>
        <p class="rest-loc"><i class="fa fa-location-dot"></i> ${escapeHTML(r.area)}, ${escapeHTML(r.city)}</p>
        <p class="rest-cuisines">${r.cuisines.map((c) => escapeHTML(labelFor(c))).join(' · ')}</p>
        <div class="rest-meta">
          <span><i class="fa fa-clock"></i> ${r.eta}–${r.eta + 10} min</span>
          ${delivery}
        </div>
        <div class="rest-foot">
          <span class="rest-price">${rupees(r.priceForTwo)} for two</span>
          <button class="btn-order" type="button" data-open-menu="${r.id}">View Menu</button>
        </div>
      </div>
    </article>`;
}

const labelFor = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

export function renderRestaurants(container, list) {
  if (!container) return;
  container.innerHTML = list.map((r, i) => restaurantCard(r, i)).join('');
}

export function renderSkeletons(container, count = 6) {
  if (!container) return;
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="rest-card skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton--img"></div>
      <div class="rest-info">
        <div class="skeleton skeleton--line" style="width:65%"></div>
        <div class="skeleton skeleton--line" style="width:45%"></div>
        <div class="skeleton skeleton--line" style="width:80%"></div>
        <div class="skeleton skeleton--btn"></div>
      </div>
    </div>`).join('');
}

export function renderEmptyState(container, keyword) {
  if (!container) return;
  const what = keyword ? ` for “${escapeHTML(keyword)}”` : '';
  container.innerHTML = `
    <div class="empty-state">
      <i class="fa fa-utensils" aria-hidden="true"></i>
      <h4>No restaurants found${what}</h4>
      <p>Try a different dish, or widen your filters.</p>
      <button class="btn-primary" type="button" data-clear-filters>Clear all filters</button>
    </div>`;
}

/* ── Restaurant menu (inside the modal) ───────────────────────────── */

export function menuMarkup(r) {
  return `
    <header class="menu-head">
      ${r.exterior === 'photo'
        ? `<img src="${r.img}" alt="" width="800" height="450" loading="lazy" decoding="async"
                referrerpolicy="no-referrer" data-fallback="${restFallback(r)}"/>`
        : storefront(r)}
      <div class="menu-head__body">
        <h3 id="menuTitle">${escapeHTML(r.name)}</h3>
        <p class="menu-head__meta">
          <span class="stars" aria-label="Rated ${r.rating} out of 5">${stars(r.rating)}</span>
          <span>${r.rating.toFixed(1)} (${r.reviews.toLocaleString('en-IN')})</span>
          <span>· ${r.eta}–${r.eta + 10} min</span>
          <span>· ${r.deliveryFee === 0 ? 'Free delivery' : `${rupees(r.deliveryFee)} delivery`}</span>
        </p>
        <p class="menu-head__loc"><i class="fa fa-location-dot"></i> ${escapeHTML(r.area)}, ${escapeHTML(r.city)}</p>
      </div>
    </header>
    <ul class="menu-list">
      ${r.menu.map((d) => menuRow(d, r.id)).join('')}
    </ul>`;
}

export function menuRow(d, restaurantId) {
  const qty = qtyOf(d.id);
  return `
    <li class="menu-item" data-item="${d.id}">
      <img src="${d.img}" alt="" width="120" height="120" loading="lazy" decoding="async"
           referrerpolicy="no-referrer" data-fallback="${fallbackFor(d.category)}"/>
      <div class="menu-item__body">
        <h5>
          <span class="veg-dot ${d.veg ? 'is-veg' : 'is-nonveg'}"
                title="${d.veg ? 'Vegetarian' : 'Non-vegetarian'}"
                aria-label="${d.veg ? 'Vegetarian' : 'Non-vegetarian'}"></span>
          ${escapeHTML(d.name)}
        </h5>
        <p>${escapeHTML(d.desc)}</p>
        <span class="menu-item__price">${rupees(d.price)}</span>
      </div>
      <div class="menu-item__action">
        ${qty > 0 ? stepper(d.id, qty) : `
          <button class="btn-add" type="button" data-add="${d.id}" data-restaurant="${restaurantId}">
            Add <i class="fa fa-plus" aria-hidden="true"></i>
          </button>`}
      </div>
    </li>`;
}

export const stepper = (itemId, qty) => `
  <div class="stepper" role="group" aria-label="Quantity">
    <button type="button" data-dec="${itemId}" aria-label="Decrease quantity">
      <i class="fa fa-minus" aria-hidden="true"></i>
    </button>
    <span class="stepper__qty" aria-live="polite">${qty}</span>
    <button type="button" data-inc="${itemId}" aria-label="Increase quantity">
      <i class="fa fa-plus" aria-hidden="true"></i>
    </button>
  </div>`;

/* ── Testimonials ─────────────────────────────────────────────────── */

export function renderTestimonials(track, list) {
  if (!track) return;
  track.innerHTML = list.map((t, i) => `
    <li class="testimonial" role="group" aria-roledescription="slide"
        aria-label="${i + 1} of ${list.length}">
      <figure class="testimonial__card">
        <span class="stars" aria-label="Rated ${t.rating} out of 5">${stars(t.rating)}</span>
        <blockquote>${escapeHTML(t.text)}</blockquote>
        <figcaption class="testimonial__who">
          <span class="avatar" aria-hidden="true">${escapeHTML(t.name.charAt(0))}</span>
          <div>
            <strong>${escapeHTML(t.name)}</strong>
            <small>${escapeHTML(t.role)}</small>
          </div>
        </figcaption>
      </figure>
    </li>`).join('');
}

/* ── Photo credits ────────────────────────────────────────────────── */

/**
 * The Commons photos are CC-licensed, and most of those licences require
 * visible attribution — so this list is a legal requirement, not decoration.
 */
export function renderCredits(host, credits) {
  if (!host) return;
  host.innerHTML = credits.map((c) => `
    <li>
      <a href="${c.page}" target="_blank" rel="noopener noreferrer">${escapeHTML(c.label)}</a>
      — ${escapeHTML(c.author)} <span class="credit-lic">(${escapeHTML(c.license)})</span>
    </li>`).join('');
}
