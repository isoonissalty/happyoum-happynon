# Oum & Non Wedding Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page static wedding invitation site (GitHub Pages) matching the oracle mock pixel-faithfully.

**Architecture:** One `site/index.html` + `site/styles.css`, zero JS, zero build step. Striped body background, wavy-edged cream card via SVG mask, centered 720px content column, all artwork from `site/assets/*.png`.

**Tech Stack:** Plain HTML5/CSS3, Google Fonts (Rouge Script, Oswald, Quicksand). Verified with headless browser screenshots against the oracle.

**Spec:** `docs/ui-specs/2026-08-23-wedding-site.md` AND `docs/ui-specs/2026-08-23-wedding-site.design.md` — implementers MUST read both before writing code. The oracle image is `docs/ui-specs/assets/wedding-site.png`.

## Global Constraints

- All asset/font/CSS paths RELATIVE (site must work from any subpath on github.io).
- Colors exactly: `--mint:#b5d5cd; --lavender:#cbc1e1; --cream:#f5ebe1; --ink:#4a5560; --label:#6f757c`. No other colors in CSS.
- Never redraw or CSS-recolor artwork; use the PNGs in `site/assets/` as-is.
- No shadows, no gradients, no dividers (design.md state-weight).
- No horizontal scroll at 390px or 1440px.
- Copy text exactly as in the spec (including fixing the mock's "tocelebrate" → "to celebrate").
- Plain dash "-" in any comments; no em dash. Comments why-not-what, no task-scaffolding references.

---

### Task 1: Page shell - stripes, wavy cream card, fonts, tokens

**Files:**
- Create: `site/index.html`
- Create: `site/styles.css`
- (git: `git init` if repo not initialized; commit at end)

**Interfaces:**
- Produces: `site/index.html` with `<main class="card"><div class="content">` empty content column; `site/styles.css` defining the token custom properties above, `.stripes`-on-body, `.card` wavy mask, `.content` column. Task 2 fills `.content` and appends `<footer class="hashtag">`.

- [ ] **Step 1: Write the shell**

`site/index.html`:
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Oum &amp; Non - We're Getting Married!</title>
<meta name="description" content="Together with our families, we'd like to invite you to celebrate our wedding. 23 January 2027, 6 pm at found venue, Bangkok.">
<meta property="og:title" content="Oum &amp; Non - We're Getting Married!">
<meta property="og:image" content="assets/logo-hearts.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400&family=Quicksand:wght@500;600&family=Rouge+Script&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<main class="card">
  <div class="content">
    <!-- sections land here -->
  </div>
</main>
<footer class="hashtag">#oumnonhappyhappy</footer>
</body>
</html>
```

- [ ] **Step 2: Write the shell CSS**

`site/styles.css` core (implementer completes sizing with design.md values):
```css
:root{
  --mint:#b5d5cd; --lavender:#cbc1e1; --cream:#f5ebe1;
  --ink:#4a5560; --label:#6f757c;
  --stripe-w: clamp(32px, 5.85vw, 84px);
  --card-inset: clamp(16px, 6.1vw, 88px);
}
*{margin:0;padding:0;box-sizing:border-box}
body{
  background: repeating-linear-gradient(90deg,
    var(--mint) 0, var(--mint) var(--stripe-w),
    var(--lavender) var(--stripe-w), var(--lavender) calc(var(--stripe-w)*2));
  font-family:'Quicksand',sans-serif; color:var(--ink); text-align:center;
}
.card{
  background:var(--cream);
  margin: clamp(40px,6.9vw,100px) var(--card-inset) 0;
  /* wavy hand-drawn edge - SVG data-uri mask, wave amp ~14px wl ~150px */
  -webkit-mask: url("data:image/svg+xml;utf8,...") ; /* see step 3 */
}
```

- [ ] **Step 3: Implement the wavy edge**

Technique (pick this, do not use border-radius): generate an inline SVG used as a CSS `mask` with `mask-size: 100% 100%` will stretch the wave - instead use a 9-slice approach: four repeating edge masks via `mask-composite`, OR simpler and robust: wrap card content between two `<svg>` wave strips (top/bottom, `preserveAspectRatio="none"` avoided; use `width:100%; height:28px` with a repeating `<pattern>`), and give the card left/right edges a vertical wavy mask:
```css
.card{
  --wave: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='28'><path d='M0 28 Q37.5 0 75 14 T150 28 Z' fill='black'/></svg>");
}
```
Acceptable simplest implementation that passes review: a single SVG-mask on the card using `mask-image` with four layered repeating wave strips (top, bottom, left, right) plus a center fill rect, `mask-composite: add`. The visual bar: edges must visibly undulate (amplitude 10-16px, wavelength 120-180px) on all four sides at 1440px, larger slow wave (amp ~30px, wl ~360px) allowed on the bottom edge. Corners must not show square notches.

- [ ] **Step 4: Verify in headless browser**

Run: `cd site && python3 -m http.server 8123 &` then screenshot 1440px wide (use the session browser or `verify-ui-against-design-headless`). Check: stripes alternate mint→lavender from left edge; cream card floats with wavy edges; hashtag text renders cream on stripes below the card.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: page shell - stripes, wavy cream card, fonts"
```

---

### Task 2: Content sections - hero, dress code, agenda, map, buttons, footer

**Files:**
- Modify: `site/index.html` (fill `.content`)
- Modify: `site/styles.css` (append section styles)

**Interfaces:**
- Consumes: `.content` column and tokens from Task 1.
- Produces: complete page content per spec section list.

- [ ] **Step 1: Hero markup**

```html
<section class="hero">
  <p class="eyebrow">WE'RE GETTING</p>
  <h1 class="script">Married!</h1>
  <img class="locket" src="assets/logo-hearts.png" alt="Heart lockets tied with a ribbon, engraved Oum and Non" width="300">
  <h2 class="script names">Oum &amp; Non</h2>
  <p class="invite">Together with our families, we'd like to<br>invite you to celebrate our wedding.</p>
  <p class="date-block">23 JANUARY 2027<br>6 PM @FOUND VENUE</p>
</section>
```

- [ ] **Step 2: Dress code + agenda markup**

```html
<section class="dresscode">
  <p class="label">Dress Code</p>
  <img src="assets/dresscode-cluster.png" alt="Dress code: Pastel" width="450">
</section>
<section class="agenda">
  <p class="label">Agenda</p>
  <ul>
    <li><img class="bow" src="assets/bow-teal.png" alt=""><img class="doodle" src="assets/icon-registration.png" alt="">
        <p class="time">6 pm</p><p class="what">Guest registration</p></li>
    <li><img class="bow" src="assets/bow-blue.png" alt=""><img class="doodle" src="assets/icon-camera.png" alt="">
        <p class="time">6:30 pm</p><p class="what">Photo time</p></li>
    <li><img class="bow" src="assets/bow-pink.png" alt=""><img class="doodle" src="assets/icon-dinner.png" alt="">
        <p class="time">7:30 pm</p><p class="what">Dinner reception</p><p class="note">(Seated buffet)</p></li>
    <li><img class="bow" src="assets/bow-purple.png" alt=""><img class="doodle" src="assets/icon-afterparty.png" alt="">
        <p class="time">9:30 pm</p><p class="what">After party</p></li>
  </ul>
</section>
```

- [ ] **Step 3: Map + actions markup**

```html
<section class="where">
  <p class="label">Where to celebrate</p>
  <a class="maplink" href="https://www.google.com/maps/search/?api=1&amp;query=found+venue+8+86+Nuan+Chan+12+Alley+Bangkok+10230" target="_blank" rel="noopener">
    <img src="assets/map.png" alt="Map showing found venue near Nuan Chan Road" width="640">
  </a>
  <p class="venue">found venue</p>
  <p class="address">8 86 Nuan Chan 12 Alley, Nuan Chan,<br>Bueng Kum, Bangkok 10230</p>
</section>
<section class="actions">
  <!-- TODO: replace with real RSVP URL -->
  <a class="btn" href="#rsvp">RSVP</a>
  <a class="btn" target="_blank" rel="noopener"
     href="https://calendar.google.com/calendar/render?action=TEMPLATE&amp;text=Oum+%26+Non+Wedding&amp;dates=20270123T110000Z/20270123T170000Z&amp;location=found+venue,+8+86+Nuan+Chan+12+Alley,+Nuan+Chan,+Bueng+Kum,+Bangkok+10230">Add to calendar</a>
</section>
```
(18:00-24:00 ICT = 11:00-17:00 UTC; keep the Z times exactly.)

- [ ] **Step 4: Section CSS**

Apply EVERY size/gap from design.md "Typography", "Vertical rhythm", "Component sizing" tables using `clamp(mobile, vw, design-value)`. Buttons: pill, `border:2px solid var(--ink)`, `border-radius:999px`, `padding:16px 40px`, Quicksand 600, transparent bg; hover inverts to ink bg + cream text. Labels use `--label` color. `.time` is Quicksand 600. Images `max-width:100%;height:auto`.

- [ ] **Step 5: Verify against oracle**

Screenshot at 1440 and 390 widths; compare side-by-side with `docs/ui-specs/assets/wedding-site.png` regions. Every acceptance-checklist content item must pass; no horizontal scroll.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: all page sections - hero, dress code, agenda, map, actions"
```

---

### Task 3: Decoration scatter + responsive polish + final verification

**Files:**
- Modify: `site/index.html` (decoration img elements inside `.card`)
- Modify: `site/styles.css` (absolute positioning, media queries)

**Interfaces:**
- Consumes: full page from Task 2.
- Produces: final site passing the full acceptance checklist.

- [ ] **Step 1: Scatter decorations**

Add `<img class="deco" aria-hidden="true" ...>` elements as direct children of `.card` (position:relative on card, absolute deco with % offsets so they track the card, not the viewport). Follow design.md scatter plan: 3-5 per section side band, only outside the 720px column, sizes 24-90px, rotations -25deg..25deg, using star-*/diamond-*/sparkle-*/cross-teal/starburst-orange PNGs. Reference the oracle for approximate placement per section (hero: blue star top-left, orange star top-right, pink star mid-left, yellow-ish star right...). Set `pointer-events:none` on `.deco`.

- [ ] **Step 2: Responsive pass**

At <480px: hide the smallest decos (`display:none` for a `.deco--sm` class), stack the two buttons, confirm clamp() typography reads well at 390px. Body must not scroll horizontally (decos must use `overflow:hidden` on `.card` or safe offsets).

- [ ] **Step 3: Full acceptance checklist run**

Serve `site/`, screenshot full page at 1440 and 390. Walk EVERY checkbox in the spec's acceptance checklist, marking each. Fix failures before proceeding.

- [ ] **Step 4: README for deploy**

Create `README.md`: one paragraph - site lives in `site/`, deploy by enabling GitHub Pages on the repo with source = `site/` folder (or move contents to root/docs), no build step.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: decorations, responsive polish, deploy notes"
```
