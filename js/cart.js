/**
 * Cart drawer, restaurant menu modal, and the checkout flow.
 *
 * Checkout is a three-step machine inside one dialog: cart → address → done.
 */

import { getRestaurant, getDish, CATEGORY_IMG } from './data.js';
import {
  getCart, cartCount, addToCart, setQty, removeFromCart, clearCart,
  conflictsWith, cartRestaurantId, subscribe, toggleFavourite, qtyOf,
} from './store.js';
import { menuMarkup, menuRow, stepper } from './render.js';
import { createOverlay, confirmDialog, toast, rupees, escapeHTML, motionOK } from './ui.js';

const DELIVERY_FLAT = 39;
const FREE_ABOVE = 499;

export function cartTotals() {
  const lines = getCart().map((l) => ({ ...l, dish: getDish(l.itemId) })).filter((l) => l.dish);
  const subtotal = lines.reduce((sum, l) => sum + l.dish.price * l.qty, 0);
  const restaurant = getRestaurant(cartRestaurantId());
  const baseFee = restaurant?.deliveryFee ?? DELIVERY_FLAT;
  const delivery = subtotal === 0 || subtotal >= FREE_ABOVE ? 0 : baseFee;
  const taxes = Math.round(subtotal * 0.05);
  return { lines, subtotal, delivery, taxes, total: subtotal + delivery + taxes, restaurant };
}

export function initCart() {
  const drawer = document.getElementById('cartDrawer');
  const modal = document.getElementById('menuModal');
  const badge = document.getElementById('cartBadge');
  const trigger = document.getElementById('cartTrigger');
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  const modalBody = document.getElementById('menuModalBody');

  const cartOverlay = createOverlay(drawer);
  const menuOverlay = createOverlay(modal);
  let step = 'cart';
  let openRestaurantId = null;

  /* ── Badge ──────────────────────────────────────────────────────── */

  function paintBadge() {
    if (!badge) return;
    const n = cartCount();
    badge.textContent = String(n);
    badge.hidden = n === 0;
    if (n > 0 && motionOK) {
      badge.classList.remove('is-bump');
      void badge.offsetWidth; // restart the animation
      badge.classList.add('is-bump');
    }
  }

  /* ── Cart drawer body ───────────────────────────────────────────── */

  function paintCart() {
    if (!body || !foot) return;
    if (step !== 'cart') return;

    const { lines, subtotal, delivery, taxes, total, restaurant } = cartTotals();

    if (!lines.length) {
      body.innerHTML = `
        <div class="cart-empty">
          <i class="fa fa-basket-shopping" aria-hidden="true"></i>
          <h4>Your cart is empty</h4>
          <p>Browse restaurants and add a few dishes to get started.</p>
          <button class="btn-primary" type="button" data-close>Browse restaurants</button>
        </div>`;
      foot.hidden = true;
      return;
    }

    foot.hidden = false;
    body.innerHTML = `
      ${restaurant ? `<p class="cart-from">Order from <strong>${escapeHTML(restaurant.name)}</strong></p>` : ''}
      <ul class="cart-lines">
        ${lines.map((l) => `
          <li class="cart-line">
            <img src="${l.dish.img}" alt="" width="72" height="72" loading="lazy" decoding="async"
                 referrerpolicy="no-referrer" data-fallback="${CATEGORY_IMG[l.dish.category] || ''}"/>
            <div class="cart-line__body">
              <h5>${escapeHTML(l.dish.name)}</h5>
              <span class="cart-line__price">${rupees(l.dish.price)}</span>
            </div>
            <div class="cart-line__side">
              ${stepper(l.itemId, l.qty)}
              <button class="cart-line__remove" type="button" data-remove="${l.itemId}"
                      aria-label="Remove ${escapeHTML(l.dish.name)}">Remove</button>
            </div>
          </li>`).join('')}
      </ul>`;

    foot.innerHTML = `
      <dl class="cart-summary">
        <div><dt>Subtotal</dt><dd>${rupees(subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd>${delivery === 0 ? '<span class="tag tag--free">FREE</span>' : rupees(delivery)}</dd></div>
        <div><dt>Taxes &amp; charges</dt><dd>${rupees(taxes)}</dd></div>
        <div class="cart-summary__total"><dt>Total</dt><dd>${rupees(total)}</dd></div>
      </dl>
      ${subtotal < FREE_ABOVE ? `
        <p class="cart-nudge">
          Add ${rupees(FREE_ABOVE - subtotal)} more for free delivery
          <span class="progress"><span class="progress__bar" style="width:${Math.min(100, (subtotal / FREE_ABOVE) * 100).toFixed(0)}%"></span></span>
        </p>` : ''}
      <button class="btn-primary btn-block" type="button" data-checkout>
        Checkout · ${rupees(total)}
      </button>`;
  }

  /* ── Checkout steps ─────────────────────────────────────────────── */

  function paintAddress() {
    if (!body || !foot) return;
    step = 'address';
    foot.hidden = true;
    const { total } = cartTotals();

    body.innerHTML = `
      <form class="checkout-form" id="checkoutForm" novalidate>
        <button class="link-back" type="button" data-back>
          <i class="fa fa-arrow-left" aria-hidden="true"></i> Back to cart
        </button>
        <h4>Delivery details</h4>

        <label class="field">
          <span>Full name</span>
          <input name="name" type="text" autocomplete="name" required data-autofocus/>
          <em class="field__error" hidden></em>
        </label>

        <label class="field">
          <span>Phone</span>
          <input name="phone" type="tel" inputmode="numeric" autocomplete="tel"
                 placeholder="10-digit mobile number" required/>
          <em class="field__error" hidden></em>
        </label>

        <label class="field">
          <span>Delivery address</span>
          <textarea name="address" rows="3" autocomplete="street-address" required></textarea>
          <em class="field__error" hidden></em>
        </label>

        <fieldset class="pay-options">
          <legend>Payment</legend>
          <label><input type="radio" name="pay" value="upi" checked/> <span>UPI</span></label>
          <label><input type="radio" name="pay" value="card"/> <span>Card</span></label>
          <label><input type="radio" name="pay" value="cod"/> <span>Cash on delivery</span></label>
        </fieldset>

        <button class="btn-primary btn-block" type="submit">Place order · ${rupees(total)}</button>
      </form>`;

    body.querySelector('#checkoutForm').addEventListener('submit', onPlaceOrder);
  }

  const VALIDATORS = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    phone: (v) => (/^\d{10}$/.test(v.replace(/\D/g, '')) ? '' : 'Enter a valid 10-digit number.'),
    address: (v) => (v.trim().length >= 10 ? '' : 'Please enter a complete address.'),
  };

  function onPlaceOrder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    let firstBad = null;

    for (const [field, validate] of Object.entries(VALIDATORS)) {
      const input = form.elements[field];
      const error = validate(input.value);
      const slot = input.parentElement.querySelector('.field__error');
      slot.textContent = error;
      slot.hidden = !error;
      input.parentElement.classList.toggle('has-error', Boolean(error));
      input.setAttribute('aria-invalid', String(Boolean(error)));
      if (error && !firstBad) firstBad = input;
    }

    if (firstBad) {
      firstBad.focus();
      toast('Please fix the highlighted fields.', 'error');
      return;
    }
    paintConfirmation(form.elements.name.value.trim());
  }

  function paintConfirmation(name) {
    step = 'done';
    const { restaurant } = cartTotals();
    const eta = restaurant?.eta ?? 30;
    const orderId = `CR${Date.now().toString().slice(-6)}`;

    body.innerHTML = `
      <div class="confirm">
        <div class="confirm__tick" aria-hidden="true"><i class="fa fa-check"></i></div>
        <h4>Order confirmed</h4>
        <p>Thanks ${escapeHTML(name.split(' ')[0])} — order <strong>#${orderId}</strong>
           from ${escapeHTML(restaurant?.name ?? 'Crunch')} is on its way.</p>
        <p class="confirm__eta">Arriving in <strong id="etaCount">${eta}:00</strong></p>
        <ol class="tracker">
          <li class="is-done"><span></span>Order placed</li>
          <li class="is-active"><span></span>Restaurant preparing</li>
          <li><span></span>Out for delivery</li>
          <li><span></span>Delivered</li>
        </ol>
        <button class="btn-primary btn-block" type="button" data-close>Done</button>
      </div>`;
    foot.hidden = true;

    startEtaCountdown(eta);
    advanceTracker();
    clearCart();          // badge resets; drawer content is already the receipt
    toast('Order placed successfully.', 'success');
  }

  let etaTimer = null;
  let trackerTimer = null;

  function startEtaCountdown(minutes) {
    clearInterval(etaTimer);
    let remaining = minutes * 60;
    const el = document.getElementById('etaCount');
    etaTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0 || !document.getElementById('etaCount')) {
        clearInterval(etaTimer);
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = String(remaining % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
    }, 1000);
  }

  function advanceTracker() {
    clearTimeout(trackerTimer);
    if (!motionOK) return;
    let stage = 1;
    const tick = () => {
      const steps = body.querySelectorAll('.tracker li');
      if (!steps.length || stage >= steps.length) return;
      steps[stage].classList.replace('is-active', 'is-done');
      steps[stage + 1]?.classList.add('is-active');
      stage += 1;
      trackerTimer = setTimeout(tick, 6000);
    };
    trackerTimer = setTimeout(tick, 6000);
  }

  function resetToCart() {
    step = 'cart';
    clearInterval(etaTimer);
    clearTimeout(trackerTimer);
    paintCart();
  }

  /* ── Menu modal ─────────────────────────────────────────────────── */

  function openMenu(restaurantId) {
    const r = getRestaurant(restaurantId);
    if (!r || !modalBody) return;
    openRestaurantId = restaurantId;
    modalBody.innerHTML = menuMarkup(r);
    menuOverlay.open();
  }

  /** Repaint only the row that changed, so the modal doesn't scroll-jump. */
  function refreshMenuRow(itemId) {
    if (!openRestaurantId) return;
    const row = modalBody?.querySelector(`[data-item="${itemId}"]`);
    const dish = getDish(itemId);
    if (!row || !dish) return;
    row.outerHTML = menuRow(dish, openRestaurantId);
  }

  async function tryAdd(itemId, restaurantId) {
    if (conflictsWith(restaurantId)) {
      const current = getRestaurant(cartRestaurantId());
      const ok = await confirmDialog({
        title: 'Start a new order?',
        message: `Your cart has items from ${current?.name}. Adding this dish will clear it.`,
        confirmLabel: 'Clear and add',
      });
      if (!ok) return false;
      clearCart();
    }
    addToCart(itemId, restaurantId);
    toast(`${getDish(itemId)?.name} added to cart.`, 'success', 2200);
    return true;
  }

  /* ── Delegated events ───────────────────────────────────────────── */

  document.addEventListener('click', (event) => {
    const t = event.target;

    const openBtn = t.closest('[data-open-menu]');
    if (openBtn) return openMenu(openBtn.dataset.openMenu);

    const card = t.closest('.rest-card');
    if (card && !t.closest('button') && card.dataset.restaurant) {
      return openMenu(card.dataset.restaurant);
    }

    const favBtn = t.closest('[data-fav]');
    if (favBtn) {
      const id = favBtn.dataset.fav;
      const now = toggleFavourite(id);
      favBtn.classList.toggle('is-active', now);
      favBtn.setAttribute('aria-pressed', String(now));
      favBtn.querySelector('i').className = `fa${now ? '' : '-regular'} fa-heart`;
      toast(
        `${getRestaurant(id)?.name} ${now ? 'added to' : 'removed from'} favourites.`,
        'info', 2000
      );
      return;
    }

    const add = t.closest('[data-add]');
    if (add) {
      tryAdd(add.dataset.add, add.dataset.restaurant)
        .then((added) => { if (added) refreshMenuRow(add.dataset.add); });
      return;
    }

    const inc = t.closest('[data-inc]');
    if (inc) {
      setQty(inc.dataset.inc, qtyOf(inc.dataset.inc) + 1);
      refreshMenuRow(inc.dataset.inc);
      return;
    }

    const dec = t.closest('[data-dec]');
    if (dec) {
      setQty(dec.dataset.dec, qtyOf(dec.dataset.dec) - 1);
      refreshMenuRow(dec.dataset.dec);
      return;
    }

    const rm = t.closest('[data-remove]');
    if (rm) return removeFromCart(rm.dataset.remove);

    if (t.closest('[data-checkout]')) {
      if (!getCart().length) return toast('Your cart is empty.', 'error');
      return paintAddress();
    }

    if (t.closest('[data-back]')) return resetToCart();
  });

  trigger?.addEventListener('click', () => {
    if (step === 'done') resetToCart();
    cartOverlay.open();
  });

  drawer?.addEventListener('transitionend', () => {
    // Once a finished order's receipt is dismissed, go back to the cart view.
    if (!cartOverlay.isOpen() && step === 'done') resetToCart();
  });

  subscribe(() => {
    paintBadge();
    if (step === 'cart') paintCart();
  });

  paintBadge();
  paintCart();

  return { open: cartOverlay.open, openMenu };
}
