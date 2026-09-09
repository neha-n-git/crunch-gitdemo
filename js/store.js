/**
 * Application state: cart, favourites and theme.
 *
 * Every localStorage access is wrapped — the API throws outright in some
 * privacy modes, and an uncaught throw here would run at import time and take
 * the whole page down with it.
 */

const KEYS = {
  cart: 'crunch:cart',
  favourites: 'crunch:favourites',
  theme: 'crunch:theme',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage unavailable or full — state still works for this session. */
  }
}

const state = {
  /** @type {{itemId: string, restaurantId: string, qty: number}[]} */
  cart: readJSON(KEYS.cart, []),
  /** @type {string[]} restaurant ids */
  favourites: readJSON(KEYS.favourites, []),
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

/* ── Cart ─────────────────────────────────────────────────────────── */

export const getCart = () => state.cart.slice();

export const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);

export const cartRestaurantId = () => (state.cart.length ? state.cart[0].restaurantId : null);

/** True when the cart holds items from a different restaurant. */
export function conflictsWith(restaurantId) {
  const current = cartRestaurantId();
  return current !== null && current !== restaurantId;
}

export function addToCart(itemId, restaurantId, qty = 1) {
  const line = state.cart.find((l) => l.itemId === itemId);
  if (line) line.qty += qty;
  else state.cart.push({ itemId, restaurantId, qty });
  persistCart();
}

export function setQty(itemId, qty) {
  const next = Math.max(0, Math.trunc(qty));
  if (next === 0) return removeFromCart(itemId);
  const line = state.cart.find((l) => l.itemId === itemId);
  if (line) {
    line.qty = next;
    persistCart();
  }
}

export function removeFromCart(itemId) {
  state.cart = state.cart.filter((l) => l.itemId !== itemId);
  persistCart();
}

export function clearCart() {
  state.cart = [];
  persistCart();
}

export const qtyOf = (itemId) => state.cart.find((l) => l.itemId === itemId)?.qty ?? 0;

function persistCart() {
  writeJSON(KEYS.cart, state.cart);
  emit();
}

/* ── Favourites ───────────────────────────────────────────────────── */

export const getFavourites = () => state.favourites.slice();

export const isFavourite = (id) => state.favourites.includes(id);

export function toggleFavourite(id) {
  const idx = state.favourites.indexOf(id);
  if (idx === -1) state.favourites.push(id);
  else state.favourites.splice(idx, 1);
  writeJSON(KEYS.favourites, state.favourites);
  emit();
  return isFavourite(id);
}

/* ── Theme ────────────────────────────────────────────────────────── */

export function storedTheme() {
  try {
    const value = localStorage.getItem(KEYS.theme);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(KEYS.theme, theme);
  } catch {
    /* no-op */
  }
}
