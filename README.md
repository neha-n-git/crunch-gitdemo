# Crunch

Github Collaboration Demo — a food-ordering landing page built with vanilla
HTML, CSS and JavaScript. No framework, no build step.

## Running it

The JavaScript ships as ES modules, which browsers refuse to load over
`file://`. Serve the folder over HTTP:

```bash
npm run dev          # python3 -m http.server 5173
```

Then open <http://localhost:5173>. Any static server works — `npx serve`,
`php -S localhost:5173`, the VS Code Live Server extension, and so on.

## Layout

```
index.html        Markup. Category and restaurant sections carry a static
                  fallback that JS replaces on boot (keeps the page useful
                  without JS and gives crawlers real content).
style.css         Single stylesheet, tokenised for light/dark themes.
js/
  data.js         Restaurants, menus, categories, testimonials.
  store.js        Cart / favourites / theme state + localStorage.
  ui.js           Toasts, overlays, focus trap, scroll lock, helpers.
  render.js       Card and menu templates.
  search.js       Keyword, city, category and sort filtering.
  cart.js         Cart drawer, menu modal, checkout flow.
  nav.js          Navbar, mobile menu, scrollspy, theme toggle.
  animations.js   Scroll reveal, counters, carousel, parallax.
  main.js         Bootstrap.
images/           Photography and product art.
```

## What it does

- **Ordering** — browse a restaurant's menu, add dishes, adjust quantities,
  and check out through an address form into an order confirmation with a
  live ETA countdown and progress tracker.
- **Cart persistence** — the cart and favourites survive a reload. Starting an
  order at a second restaurant prompts before clearing the first.
- **Search** — matches restaurant names, areas, cuisines *and* dish names, so
  searching `tiramisu` finds the place that serves it. Combines with city,
  category and sort filters, each removable as a chip.
- **Dark mode** — follows the OS by default, overridable, and remembered.
- **Accessibility** — focus trapping in the drawer and modals, Escape to
  close, focus restored to the trigger, `aria-*` state on every toggle,
  visible focus rings, and a skip link.
- **Motion** — scroll reveals, animated counters and a testimonial carousel,
  all disabled under `prefers-reduced-motion: reduce`.

## Data and provenance

Content lives in `js/data.js`. Adding a restaurant or dish there is enough — the
cards, category counts, menus and search index all derive from it.

**The restaurants and their signature dishes are real** — Truffles, Meghana
Foods, Bademiya, Karim's, Moti Mahal, Buhari and the rest, each paired with the
dish it is actually known for.

**Everything numeric is invented.** Ratings, review counts, prices, delivery
times and the customer testimonials are illustrative sample data for this demo,
not claims about these businesses. The footer says so on the page itself.

### Restaurant storefronts

Seven restaurants have a genuine Commons photograph of the actual premises
(Koshy's, Bademiya, Pizza By The Bay, Buhari, Karim's, Toit, Moti Mahal). For
the other eleven no such photo exists, so `js/render.js` draws an SVG shopfront
carrying that restaurant's own name.

That is deliberate. Commons storefront photography is almost always *of a
specific named business* — the nearest matches were things like "Cactus Club
Cafe" and "India Palace", and using one as another restaurant's frontage would
put a different company's signage on the card. A drawing that says the right
name is more honest than a photograph of the wrong building.

### Photography

Dish photos are hotlinked from [Wikimedia Commons](https://commons.wikimedia.org/)
at `upload.wikimedia.org`, so they add nothing to the repository. Each carries
its author and licence in `credit`, surfaced by the **Photo credits** panel in
the footer — most are CC BY-SA, which requires that attribution.

Two consequences worth knowing:

- The photos need an internet connection. If one ever stops resolving, a single
  delegated `error` listener in `js/ui.js` swaps in the local category image, so
  a dead link degrades to the right-looking picture rather than a broken icon.
- Wikimedia rate-limits bursts from one IP. Normal browsing is far below the
  limit, but scripted checks over every URL at once will get `429`s — pace them.

To vendor the images instead, download each `img` URL into `images/dishes/` and
rewrite the fields; nothing else changes.
