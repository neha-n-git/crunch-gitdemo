# Crunch

**Order Healthy and Fresh Food Any Time**
Discover the best restaurants near you and get fresh, delicious meals delivered right to your door — fast and easy.

## Team Members

| Name | GitHub | Focus Area |
|---|---|---|
| Neha N | neha-n-git | Main branch integration, merge conflict resolution |
| Abhishek Suresh | abhisheksuresh4 | UI / CSS, with some related JS |
| Yanish Rai | GeekyYanish | JavaScript functionality, with some related CSS |

## Project Description

Crunch is a food-ordering web app concept. Users can browse restaurants, view dishes across categories (burgers, pizza, pasta, chicken, desserts, sandwiches, shakes), search for what they want, add items to a cart, and place an order — all from a single-page interface.

### Key Features (based on the app's module structure)

- **Restaurant & menu browsing** — dish/restaurant data rendered dynamically onto the page
- **Search** — finding restaurants or dishes by name/category
- **Cart** — adding, removing, and reviewing items before ordering
- **Navigation** — a responsive nav bar across sections of the site
- **Animations** — hero section and scroll-based visual effects
- **Hover/interaction polish** — card layouts, button styling, and hover effects added during the UI pass

## Technologies Used

- **HTML5** — page structure (`index.html`)
- **CSS3** — styling and layout (`style.css`)
- **JavaScript (vanilla, modular)** — application logic, split by responsibility:
  - `js/data.js` — restaurant/menu data
  - `js/store.js` — app/cart state management
  - `js/render.js` — rendering menu and restaurant cards to the DOM
  - `js/cart.js` — cart logic (add/remove/update items)
  - `js/search.js` — search functionality
  - `js/nav.js` — navigation bar behavior
  - `js/ui.js` — general UI interactions
  - `js/animations.js` — hero/scroll animations
  - `js/main.js` — app entry point, ties modules together
- **Git & GitHub** — version control, branching, and collaboration
- `package.json` is present in the repo for project metadata (no build step is required to run the app)

## Project Structure

```
crunch-gitdemo/
├── index.html
├── style.css
├── package.json
├── README.md
├── UI-CHANGES.md
├── images/
│   ├── hero-bg.jpg, hero-food.png, app-mockup.png
│   ├── burger.jpg, pizza.png, pasta.jpg, chicken.jpg,
│   │   dessert.jpg, sandwich.jpg, shakes.jpg, broast.png
│   └── rest1.jpg, rest2.jpg, rest3.jpg
└── js/
    ├── main.js
    ├── data.js
    ├── store.js
    ├── render.js
    ├── cart.js
    ├── search.js
    ├── nav.js
    ├── ui.js
    └── animations.js
```

## Git Branching Strategy

We used a `main` branch as the integration point, with each teammate working on their own feature branch:

- **`main`** — the stable, integrated version of the site. All feature branches are merged here.
- **`feat/yanish`** — Yanish's branch, focused on JavaScript functionality (cart logic, rendering, search, navigation), with related CSS tweaks as needed.
- **`feature/ui`** — Abhishek's branch, focused on UI and CSS improvements (layout, cards, hover effects, animations, a `UI-CHANGES.md` doc), with related JS tweaks as needed.

Workflow:
1. Each teammate committed their work to their own feature branch.
2. Neha fetched both branches into a local clone of `main`.
3. `feat/yanish` was merged first (clean fast-forward).
4. `feature/ui` was merged next — this is where conflicts came up, since both branches had touched `index.html` and `style.css`.
5. Conflicts were resolved locally, committed, and pushed back to `origin/main`.
6. `feature/ui` was later synced back up with `main` so both branches stayed consistent before final PRs were merged.

## Pull Requests Created

| # | Title | Author | Status |
|---|---|---|---|
| 1 | Feature/UI | abhisheksuresh4 | Merged |
| 2 | New PR | abhisheksuresh4 | Merged |
| 3 | Fixed the merge conflict in style css | GeekyYanish | Merged |

*(See repository Pull Requests tab for full diffs and review history.)*

## Merge Conflicts (Major)

Because `feat/yanish` and `feature/ui` were developed independently and both touched shared files, several conflicts came up at different points in the workflow.

### Conflict 1 — merging `feature/ui` into `main`

**What caused it:** Both `main` (already updated with `feat/yanish`'s changes) and `feature/ui` had modified overlapping sections of `index.html` and `style.css` — layout markup and styling rules had diverged.

**How it was resolved:** The conflicted files were opened, the `<<<<<<<` / `=======` / `>>>>>>>` markers were reviewed line by line, and both sets of changes were combined rather than one side being discarded. The merge was completed with `git add .` and `git commit -m "Merged updated css and js after resolving conflicts"`, then pushed to `origin/main`.

Screenshots: https://docs.google.com/document/d/1RY2TKCWVCwsQuvslMzmByIwB9VjSjtWOcUvueAjiv0g/edit?usp=sharing

### Conflict 2 — syncing `feature/ui` with the latest `main`

**What caused it:** After `main` moved ahead, pulling those updates into the local `feature/ui` branch conflicted again on `index.html` and `style.css`. It also produced a modify/delete conflict on `script.js`: it had been removed on one side (its logic had been reorganized into the `js/` folder) but still modified on the other.

**How it was resolved:** The HTML/CSS conflicts were merged manually as before. For `script.js`, since its functionality had already moved into the modular `js/` files, it was removed with `git rm script.js` rather than restored. The merge was finalized with `git commit -m "Resolve merge conflicts - remove obsolete script.js"` and pushed to `origin/feature/ui`.

Screenshots: https://docs.google.com/document/d/1RY2TKCWVCwsQuvslMzmByIwB9VjSjtWOcUvueAjiv0g/edit?usp=sharing

### Conflict 3 — resolved on `feat/yanish`'s side

Yanish also resolved a conflict on his end (PR #3, "Fixed the merge conflict in style css") before that branch was merged in.

Screenshots: https://docs.google.com/document/d/1RY2TKCWVCwsQuvslMzmByIwB9VjSjtWOcUvueAjiv0g/edit?usp=sharing

## Individual Contributions

PFA Contribution: https://docs.google.com/document/d/1RY2TKCWVCwsQuvslMzmByIwB9VjSjtWOcUvueAjiv0g/edit?usp=sharing

- **Neha N:** Initial website source code, resolving merge conflicts and PR requests
- **Abhishek Suresh:** Edits in CSS source code and relevant js, Resolving PR requests and conflicts
- **Yanish Rai:** Edits in JS source code and relevant js, Resolving PR requests and conflicts

## How to Run the Application

1. Clone the repository:
   ```
   git clone https://github.com/neha-n-git/crunch-gitdemo.git
   ```
2. Open the project folder.
3. Open `index.html` directly in your browser — no build step or server required.