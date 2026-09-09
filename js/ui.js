/** Shared UI primitives: escaping, toasts, and modal/drawer plumbing. */

export const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

/** Escape text that ends up inside a template literal (search echoes user input). */
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Coalesce bursty events (scroll/resize) into one call per animation frame. */
export function rafThrottle(fn) {
  let queued = false;
  return (...args) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn(...args);
    });
  };
}

/* ── Toasts ───────────────────────────────────────────────────────── */

const ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-exclamation',
  info: 'fa-circle-info',
};

export function toast(message, type = 'success', duration = 3200) {
  const host = document.getElementById('toastHost');
  if (!host) return;

  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `
    <i class="fa ${ICONS[type] || ICONS.info}" aria-hidden="true"></i>
    <span>${escapeHTML(message)}</span>
    <button class="toast__close" type="button" aria-label="Dismiss notification">
      <i class="fa fa-xmark" aria-hidden="true"></i>
    </button>`;

  const dismiss = () => {
    el.classList.add('is-leaving');
    const done = () => el.remove();
    if (motionOK) el.addEventListener('transitionend', done, { once: true });
    else done();
  };

  el.querySelector('.toast__close').addEventListener('click', dismiss);
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-visible'));
  setTimeout(dismiss, duration);
}

/* ── Body scroll lock ─────────────────────────────────────────────── */

let lockCount = 0;

export function lockScroll() {
  if (lockCount++ > 0) return;
  // Reserve the space the scrollbar occupied so the page doesn't jump sideways.
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.paddingRight = gap > 0 ? `${gap}px` : '';
  document.body.classList.add('is-locked');
}

export function unlockScroll() {
  if (lockCount === 0 || --lockCount > 0) return;
  document.body.style.paddingRight = '';
  document.body.classList.remove('is-locked');
}

/* ── Focus management ─────────────────────────────────────────────── */

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

const focusableIn = (root) =>
  Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);

/**
 * Turn a panel into a modal surface: focus trap, Escape to close, focus
 * restored to whatever opened it.
 * @returns {{open: () => void, close: () => void, isOpen: () => boolean}}
 */
export function createOverlay(panel, { onOpen, onClose } = {}) {
  if (!panel) return { open() {}, close() {}, isOpen: () => false };

  let open = false;
  let lastFocused = null;

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;

    const items = focusableIn(panel);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];

    // Wrap focus at both ends so Tab can never escape the panel.
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openPanel() {
    if (open) return;
    open = true;
    lastFocused = document.activeElement;
    panel.hidden = false;
    lockScroll();
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      (panel.querySelector('[data-autofocus]') || focusableIn(panel)[0] || panel).focus();
    });
    document.addEventListener('keydown', onKeydown);
    onOpen?.();
  }

  function close() {
    if (!open) return;
    open = false;
    panel.classList.remove('is-open');
    document.removeEventListener('keydown', onKeydown);
    unlockScroll();

    const finish = () => { panel.hidden = true; };
    if (motionOK) {
      const surface = panel.querySelector('[data-surface]') || panel;
      surface.addEventListener('transitionend', finish, { once: true });
      setTimeout(finish, 400); // fallback if the transition never fires
    } else {
      finish();
    }

    lastFocused?.focus?.();
    onClose?.();
  }

  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-close]') || event.target === panel) close();
  });

  return { open: openPanel, close, isOpen: () => open };
}

/* ── Confirm dialog ───────────────────────────────────────────────── */

let confirmOverlay = null;
let settle = null;

/**
 * Promise-based replacement for window.confirm, which blocks the whole page.
 * Resolves true when confirmed, false on cancel/Escape/backdrop.
 *
 * The overlay and its listeners are built once and reused; rebuilding them per
 * call would stack a new handler on the host element every time.
 */
export function confirmDialog({ title, message, confirmLabel = 'Continue', cancelLabel = 'Cancel' }) {
  const host = document.getElementById('confirmDialog');
  if (!host) return Promise.resolve(window.confirm(message));

  host.innerHTML = `
    <div class="overlay__backdrop" data-close></div>
    <div class="confirm-box" role="alertdialog" aria-modal="true"
         aria-labelledby="confirmTitle" data-surface tabindex="-1">
      <h4 id="confirmTitle">${escapeHTML(title)}</h4>
      <p>${escapeHTML(message)}</p>
      <div class="confirm-box__actions">
        <button class="btn-ghost" type="button" data-close>${escapeHTML(cancelLabel)}</button>
        <button class="btn-primary" type="button" data-confirm data-autofocus>${escapeHTML(confirmLabel)}</button>
      </div>
    </div>`;

  if (!confirmOverlay) {
    confirmOverlay = createOverlay(host, {
      // Fires for Escape, the backdrop and the cancel button alike.
      onClose: () => { settle?.(false); settle = null; },
    });
    host.addEventListener('click', (event) => {
      if (!event.target.closest('[data-confirm]')) return;
      settle?.(true);
      settle = null;
      confirmOverlay.close();
    });
  }

  return new Promise((resolve) => {
    settle = resolve;
    confirmOverlay.open();
  });
}

/* ── Remote image fallback ────────────────────────────────────────── */

/**
 * Dish photos are hotlinked from Wikimedia Commons. If one ever stops
 * resolving, swap in the local category art rather than showing a broken
 * image icon.
 *
 * One capturing listener covers every image on the page, including ones
 * rendered later into the cards, the menu modal and the cart. `error` does not
 * bubble, hence capture; the flag stops a failing fallback from looping.
 */
export function initImageFallback() {
  document.addEventListener('error', (event) => {
    const img = event.target;
    if (!img || img.tagName !== 'IMG') return;
    const fallback = img.dataset.fallback;
    if (!fallback || img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    img.src = fallback;
  }, true);
}
