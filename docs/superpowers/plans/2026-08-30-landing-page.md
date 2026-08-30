# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-panel scroll landing page at `/` that ends in an "Open invitation" button, and move the existing invitation to `/invitation.html`.

**Architecture:** Panel 1 is `position:sticky`; panel 2 is a cream sheet with a wave-masked top edge and a higher `z-index`, so scrolling slides it up over a pinned intro. A new `base.css` carries the CI primitives both pages share; the landing never loads `styles.css`. Motion is one small `landing.js`: a tile crossfade scheduler, an `IntersectionObserver` for the envelope pop, and an rAF scroll loop that writes `--p`.

**Tech Stack:** Static HTML + CSS + one vanilla JS file. No framework, no build step, no dependencies. Mock art generated with Python PIL. Verified with Playwright from the session scratchpad (deliberately not added to the repo, which has no build tooling).

**Spec:** `docs/ui-specs/2026-08-30-landing-page.design.md`
**Wireframe:** `docs/ui-specs/assets/landing-page.png`
**Rejected alternatives:** `docs/ui-specs/2026-08-30-landing-page.alternatives.md`

## Global Constraints

- **Never use the em dash.** Use a plain dash `-`. Applies to code, comments, copy, and commit messages.
- **Comments are why-not-what,** short, and must never reference this plan. No "Task 3", no "per the spec", no "TODO-LANDING". A reader who has never seen this document must not be able to tell it existed.
- **Never add an agent name as commit co-author.**
- **Commit at the end of each task, on the `feat/landing-page` branch only.** Never push, never merge, never touch `main`.
- **Hashtag is `#happyoumhappynon`** everywhere, on both pages.
- **`100svh`, never `100vh`.**
- **Both `mask-*` and `-webkit-mask-*` blocks must be written, with identical values.** Chromium honours whichever is declared last.
- **Relative asset paths only** (`assets/...`, `invitation.html`), never leading `/` - the site must work from any subpath.
- **Repo root:** `/Users/io/personal-repos/wedding`
- **Scratchpad (Playwright already installed here):** `/private/tmp/claude-501/-Users-io-personal-repos-wedding/cdefef2c-6c6c-442b-bf05-91faa877aed3/scratchpad` - referred to below as `$SCRATCH`. Launch with `chromium.launch({ channel: 'chrome' })`.

## File structure

| file | responsibility |
|---|---|
| `site/base.css` | CI primitives both pages need: `:root` tokens, reset, `body`, `.script`, `.btn` |
| `site/styles.css` | invitation only - everything that is not a CI primitive |
| `site/invitation.html` | the existing invitation, moved |
| `site/index.html` | the landing |
| `site/landing.css` | landing only |
| `site/landing.js` | tile flash, pop trigger, scroll drift |
| `site/assets/landing/*.png` | mock art at final intrinsic sizes |

Tasks 1 and 2 are independent and may run in parallel. Task 3 needs both. Task 4 needs 3.

---

### Task 1: Shared CSS layer, routing move, hashtag

Extract the CI primitives into `base.css`, move the invitation to `invitation.html`, and prove the invitation still renders identically.

**Files:**
- Create: `site/base.css`
- Create: `$SCRATCH/baseline.mjs`, `$SCRATCH/regress.mjs`
- Modify: `site/styles.css` (remove the extracted blocks)
- Rename: `site/index.html` -> `site/invitation.html`

**Interfaces:**
- Consumes: nothing.
- Produces: `site/base.css` exporting the custom properties `--mint --lavender --cream --ink --label --stripe-w --card-inset --wave-a --wave-wl --wave-ab --wave-wlb --wave-h --wave-hb --wave-top --wave-bottom --wave-left --wave-right --wave-fill --content-pad-y --section-gap --label-gap --pop-ease`, and the classes `.script`, `.btn`, `.btn:hover`, `.btn:focus-visible`.

- [ ] **Step 1: Capture the HEAD baseline**

The baseline is HEAD's invitation with only the hashtag patched, so the diff isolates
layout from the one intentional copy change.

```bash
cd /Users/io/personal-repos/wedding
mkdir -p site/_base
git show HEAD:site/index.html > site/_base/index.html
git show HEAD:site/styles.css > site/_base/styles.css
ln -s ../assets site/_base/assets
sed -i '' 's/#oumnonhappyhappy/#happyoumhappynon/' site/_base/index.html
grep -c happyoumhappynon site/_base/index.html   # expect 1
```

Write `$SCRATCH/baseline.mjs`:

```js
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const WIDTHS = [390, 480, 768, 1024, 1100, 1199, 1440, 1920];
const url = process.argv[2];
const out = process.argv[3];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const hashes = {};

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images]
      .filter((i) => !i.complete)
      .map((i) => new Promise((res) => { i.onload = i.onerror = res; })));
  });
  const shot = await page.screenshot({ fullPage: true });
  hashes[width] = createHash('md5').update(shot).digest('hex');
}

await browser.close();
writeFileSync(out, JSON.stringify(hashes, null, 2));
console.log(out, hashes);
```

Run it:

```bash
cd "$SCRATCH" && node baseline.mjs \
  "file:///Users/io/personal-repos/wedding/site/_base/index.html" baseline.json
```

Expected: eight md5 hashes written to `baseline.json`.

- [ ] **Step 2: Create `site/base.css`**

Lines 1-45 of `site/styles.css` are exactly the `:root` block, the `*` reset, and `body`.
Take them verbatim, then append the `.script` and `.btn` blocks:

```bash
cd /Users/io/personal-repos/wedding/site
sed -n '1,45p' styles.css > base.css
sed -n '/^\.script{/,/^}/p' styles.css >> base.css
printf '\n' >> base.css
sed -n '/^\.btn{/,/^}/p' styles.css >> base.css
printf '\n' >> base.css
sed -n '/^\.btn:hover{/,/^}/p' styles.css >> base.css
```

Verify the extraction before trusting anything downstream. A truncated `sed` range shows
up later as a mystery pixel diff, and the implementer hunts the wrong thing:

```bash
grep -c "^\.script{\|^\.btn{\|^\.btn:hover{" base.css   # expect 3
node -e "const c=require('fs').readFileSync('base.css','utf8');
  let d=0; for (const ch of c) { if (ch==='{') d++; if (ch==='}') d--; }
  if (d!==0) throw new Error('unbalanced braces in base.css: '+d);
  console.log('braces balanced');"
```

Then edit `base.css` by hand to add two things.

Add the header comment at the very top of the file:

```css
/* CI primitives shared by the landing and the invitation. The landing loads only
   this sheet: styles.css carries page rules like `.content img{height:auto}` that
   outrank sizing set on the landing's own images. */
```

Add inside `:root`, as the last declaration before the closing brace:

```css
  /* overshoot, so the envelope items read as popping rather than sliding */
  --pop-ease: cubic-bezier(.2,.8,.28,1.08);
```

Append at the end of the file:

```css
.btn:focus-visible{
  outline: 3px solid var(--ink);
  outline-offset: 3px;
}
```

- [ ] **Step 3: Remove the extracted blocks from `site/styles.css`**

```bash
cd /Users/io/personal-repos/wedding/site
python3 - <<'PY'
import re, pathlib
p = pathlib.Path('styles.css')
lines = p.read_text().split('\n')
rest = '\n'.join(lines[45:])            # drop :root, reset, body
for block in ('.script{', '.btn{', '.btn:hover{'):
    rest = re.sub(r'\n?' + re.escape(block) + r'[^}]*\}\n?', '\n', rest, count=1)
p.write_text(rest.lstrip('\n'))
PY
head -4 styles.css
grep -n "^\.script{\|^\.btn{\|^:root{\|^body{" styles.css   # expect no output
```

Expected: `styles.css` now starts with the `.card` rule and its comment; the grep prints nothing.

- [ ] **Step 4: Move the invitation and link the new sheet**

```bash
cd /Users/io/personal-repos/wedding
git mv site/index.html site/invitation.html
```

In `site/invitation.html`, replace the single stylesheet link with two, in this order -
`base.css` must come first or the cascade changes:

```html
<link rel="stylesheet" href="base.css">
<link rel="stylesheet" href="styles.css">
```

And change the footer:

```html
<footer class="hashtag">#happyoumhappynon</footer>
```

- [ ] **Step 5: Prove the invitation is unchanged**

Write `$SCRATCH/regress.mjs`:

```js
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

execFileSync('node', ['baseline.mjs', process.argv[2], 'current.json'], { stdio: 'inherit' });

const base = JSON.parse(readFileSync('baseline.json', 'utf8'));
const cur  = JSON.parse(readFileSync('current.json', 'utf8'));

let bad = 0;
for (const width of Object.keys(base)) {
  const ok = base[width] === cur[width];
  if (!ok) bad++;
  console.log(`${width}px ${ok ? 'IDENTICAL' : 'DIFFERS'}`);
}
console.log(bad ? `FAIL - ${bad} width(s) differ` : 'PASS - all widths identical');
process.exit(bad ? 1 : 0);
```

```bash
cd "$SCRATCH" && node regress.mjs \
  "file:///Users/io/personal-repos/wedding/site/invitation.html"
```

Expected: `PASS - all widths identical`.

If a width differs, the cause is almost always source order or a block that did not move
verbatim. Diff `base.css` + `styles.css` concatenated against HEAD's `styles.css`; the two
should contain the same rules in the same relative order.

- [ ] **Step 6: Remove the baseline scaffold**

```bash
rm -rf site/_base && git status --short
```

Expected: only `site/base.css` (new), `site/styles.css` (modified), and the
`index.html -> invitation.html` rename.

- [ ] **Step 7: Commit**

```bash
git add site/base.css site/styles.css site/invitation.html
git commit -m "refactor: extract shared CI layer and move the invitation to /invitation.html"
```

---

### Task 2: Mock assets

Generate every placeholder at its final intrinsic size, so the layout does not reflow when
real art lands. Independent of Task 1.

**Files:**
- Create: `site/assets/landing/tile-1.png` … `tile-8.png`, `envelope-back.png`, `envelope-front.png`, `photo-strip.png`, `cat-head-1.png`, `cat-head-2.png`, `ticket.png`
- Create: `$SCRATCH/mocks.py`

**Interfaces:**
- Consumes: nothing.
- Produces: the 14 files above, at exactly the sizes in the table, transparent outside the drawn shape.

- [ ] **Step 1: Write the generator**

Write `$SCRATCH/mocks.py`:

```python
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path('/Users/io/personal-repos/wedding/site/assets/landing')
OUT.mkdir(parents=True, exist_ok=True)

MINT, LAVENDER, CREAM, INK = '#b5d5cd', '#cbc1e1', '#f5ebe1', '#4a5560'

def font(size):
    try:
        return ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', size)
    except OSError:
        return ImageFont.load_default()

def label(draw, box, text, size=22):
    f = font(size)
    x0, y0, x1, y1 = box
    w = draw.textlength(text, font=f)
    draw.text(((x0 + x1 - w) / 2, (y0 + y1) / 2 - size / 2), text, font=f, fill=INK)

def canvas(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))

def save(img, name):
    img.save(OUT / name)
    print(name, img.size)

# tiles: alternating CI fills so the crossfade is visible while the art is missing
for i in range(1, 9):
    img = canvas(600, 600)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 599, 599], fill=(MINT if i % 2 else LAVENDER))
    label(d, (0, 0, 600, 600), f'tile-{i}', 40)
    save(img, f'tile-{i}.png')

def plate(w, h, name, fill, radius=18):
    img = canvas(w, h)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=fill, outline=INK, width=3)
    label(d, (0, 0, w, h), name)
    save(img, f'{name}.png')

plate(780, 520, 'envelope-back', CREAM)
plate(780, 300, 'envelope-front', MINT)
plate(200, 580, 'photo-strip', LAVENDER)
plate(240, 220, 'cat-head-1', CREAM)
plate(240, 220, 'cat-head-2', CREAM)
plate(420, 250, 'ticket', CREAM)
```

- [ ] **Step 2: Run it and verify the sizes**

```bash
cd "$SCRATCH" && python3 mocks.py
cd /Users/io/personal-repos/wedding/site/assets/landing && \
  python3 -c "
from PIL import Image; import glob
for f in sorted(glob.glob('*.png')): print(f, Image.open(f).size)"
```

Expected, exactly:

| file | size |
|---|---|
| `tile-1.png` … `tile-8.png` | `(600, 600)` |
| `envelope-back.png` | `(780, 520)` |
| `envelope-front.png` | `(780, 300)` |
| `photo-strip.png` | `(200, 580)` |
| `cat-head-1.png`, `cat-head-2.png` | `(240, 220)` |
| `ticket.png` | `(420, 250)` |

- [ ] **Step 3: Commit**

```bash
git add site/assets/landing
git commit -m "chore: add landing page placeholder art at final intrinsic sizes"
```

---

### Task 3: Landing static composition

Build both panels with every element in its finished state. **No motion in this task** -
nothing hidden, nothing delayed, no JS. Task 4 adds the entrances on top of a composition
already proven correct.

**Files:**
- Create: `site/index.html`, `site/landing.css`
- Create: `$SCRATCH/landing-check.mjs`

**Interfaces:**
- Consumes: `base.css` from Task 1 (`--cream --ink --label --wave-top --wave-h --wave-wl --pop-ease`, `.script`, `.btn`); the mock art from Task 2.
- Produces: the DOM contract Task 4 drives - `.panel--intro`, `.intro-stage`, `.grid`, four `.tile` each holding `img.tile-a` and `img.tile-b`, `.intro-names`, `.intro-line`, `.intro-and`, `.panel--invite`, four `.pop` elements.

- [ ] **Step 1: Write `site/index.html`**

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
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400&family=Quicksand:wght@500;600&family=Rouge+Script&display=swap" rel="stylesheet">
<link rel="stylesheet" href="base.css">
<link rel="stylesheet" href="landing.css">
</head>
<body>
<section class="panel panel--intro">
  <div class="intro-stage">
    <h1 class="script intro-names">Oum &amp; Non</h1>
    <div class="grid" role="img" aria-label="Photos of Oum and Non">
      <div class="tile"><img class="tile-a is-shown" src="assets/landing/tile-1.png" alt="" width="600" height="600"><img class="tile-b" src="assets/landing/tile-5.png" alt="" width="600" height="600"></div>
      <div class="tile"><img class="tile-a is-shown" src="assets/landing/tile-2.png" alt="" width="600" height="600"><img class="tile-b" src="assets/landing/tile-6.png" alt="" width="600" height="600"></div>
      <div class="tile"><img class="tile-a is-shown" src="assets/landing/tile-3.png" alt="" width="600" height="600"><img class="tile-b" src="assets/landing/tile-7.png" alt="" width="600" height="600"></div>
      <div class="tile"><img class="tile-a is-shown" src="assets/landing/tile-4.png" alt="" width="600" height="600"><img class="tile-b" src="assets/landing/tile-8.png" alt="" width="600" height="600"></div>
    </div>
    <p class="intro-line">ARE GETTING MARRIED</p>
    <p class="script intro-and">and&hellip;</p>
  </div>
</section>

<section class="panel panel--invite">
  <p class="invite-eyebrow">YOU ARE</p>
  <p class="invite-tag">#happyoumhappynon</p>

  <div class="envelope" aria-hidden="true">
    <img class="env-back" src="assets/landing/envelope-back.png" alt="" width="780" height="520">
    <img class="pop pop--strip"  src="assets/landing/photo-strip.png" alt="" width="200" height="580" style="--rot:-15deg;--ox:90%;--oy:45%;--delay:0ms">
    <img class="pop pop--cat1"   src="assets/landing/cat-head-1.png"  alt="" width="240" height="220" style="--rot:-8deg;--ox:55%;--oy:85%;--delay:110ms">
    <img class="pop pop--cat2"   src="assets/landing/cat-head-2.png"  alt="" width="240" height="220" style="--rot:9deg;--ox:15%;--oy:85%;--delay:220ms">
    <img class="pop pop--ticket" src="assets/landing/ticket.png"      alt="" width="420" height="250" style="--rot:14deg;--ox:-60%;--oy:70%;--delay:330ms">
    <img class="env-front" src="assets/landing/envelope-front.png" alt="" width="780" height="300">
  </div>

  <h2 class="script invited">invited!!</h2>
  <a class="btn" href="invitation.html">Open invitation</a>
</section>
</body>
</html>
```

The per-item values ride as inline custom properties, matching how the invitation's
decorations already carry their offsets.

- [ ] **Step 2: Write `site/landing.css`**

Write the file with exactly this content. Note that every animated element declares its
own full `animation` shorthand rather than sharing a `.reveal` class - a shared class plus
per-element delay overrides is where cascade bugs come from.

```css
/* base.css sets overflow-x:hidden. A hidden value on either axis makes the element a
   scroll container, which silently disables position:sticky on the panels below;
   clip suppresses the same overflow without creating one. */
body{ overflow-x: clip; }

.panel{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding-inline: clamp(16px, 5vw, 48px);
}

/* the parallax: the intro pins, and the cream sheet rides up over it */
.panel--intro{ position:sticky; top:0; height:100svh; z-index:0; }

.panel--invite{
  position:relative;
  z-index:1;
  min-height:100svh;
  background: var(--cream);
  padding-block: clamp(56px, 9vh, 110px);
  gap: clamp(18px, 3vh, 34px);
}

/* the cream sheet's wavy leading edge. --wave-top fills below its own curve, so masking
   a cream strip with it yields a wavy top without a second recoloured copy of the SVG.
   The 1px overlap matters: an exact abutment leaves a sub-pixel seam at fractional
   clamp() values. */
.panel--invite::before{
  content:'';
  position:absolute;
  left:0; right:0;
  top: calc(var(--wave-h) * -1 + 1px);
  height: var(--wave-h);
  background: var(--cream);

  mask-image: var(--wave-top);
  mask-repeat: repeat-x;
  mask-size: var(--wave-wl) var(--wave-h);

  -webkit-mask-image: var(--wave-top);
  -webkit-mask-repeat: repeat-x;
  -webkit-mask-size: var(--wave-wl) var(--wave-h);
}

.intro-stage{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap: clamp(16px, 2.6vh, 30px);
  opacity: calc(1 - var(--p, 0) * .85);
  transform: translateY(calc(var(--p, 0) * -6vh)) scale(calc(1 - var(--p, 0) * .06));
}

.intro-names{ font-size: clamp(43px, 5vw, 72px); }

.intro-line{
  font-family:'Oswald', sans-serif;
  font-weight:400;
  font-size: clamp(18px, 2.1vw, 30px);
  letter-spacing:.12em;
}

.intro-and{
  font-size: clamp(30px, 3.3vw, 48px);
  color: var(--label);
}

.grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap: clamp(10px, 1.6vw, 18px);
  width: clamp(268px, 62vw, 468px);
}

/* rotations read as hand-placed, echoing the invitation's scattered decorations */
.tile{
  position:relative;
  aspect-ratio:1;
  border: clamp(4px, .7vw, 8px) solid var(--cream);
  overflow:hidden;
}
.tile:nth-child(1){ transform: rotate(-1.5deg); }
.tile:nth-child(2){ transform: rotate(1.2deg); }
.tile:nth-child(3){ transform: rotate(1deg); }
.tile:nth-child(4){ transform: rotate(-1.2deg); }

.tile img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  opacity:0;
  transition: opacity 600ms ease-in-out;
}
.tile img.is-shown{ opacity:1; }

.invite-eyebrow{
  font-family:'Oswald', sans-serif;
  font-weight:400;
  font-size: clamp(18px, 2.1vw, 30px);
  letter-spacing:.12em;
}

.invite-tag{
  font-family:'Quicksand', sans-serif;
  font-weight:600;
  font-size: clamp(22px, 2.8vw, 40px);
}

.invited{ font-size: clamp(64px, 7.5vw, 108px); }

/* three layers, so the items genuinely emerge from inside rather than sit on top */
.envelope{
  position:relative;
  width: clamp(280px, 64vw, 520px);
  aspect-ratio: 78 / 86;
  margin-inline:auto;
}

.env-back, .env-front{
  position:absolute;
  left:0;
  bottom:0;
  width:100%;
  height:auto;
}
.env-back{ z-index:0; }
.env-front{ z-index:5; }

.pop{
  position:absolute;
  height:auto;
  transform: rotate(var(--rot));
}

/* every item dips below the front pocket's top edge so the pocket occludes it, and
   clears that edge by enough to still read. Stacking is explicit rather than left to
   DOM order: the ticket's rotated box is much wider than the ticket, and it buries
   both cat heads if it paints last. */
.pop--strip { left:5%;  bottom:26%; width:24%; z-index:1; }
.pop--ticket{ right:0%; bottom:27%; width:40%; z-index:2; }
.pop--cat1  { left:22%; bottom:29%; width:30%; z-index:3; }
.pop--cat2  { left:40%; bottom:30%; width:30%; z-index:4; }
```

- [ ] **Step 3: Write the geometry check**

Write `$SCRATCH/landing-check.mjs`:

```js
import { chromium } from 'playwright';

const WIDTHS = [390, 768, 1024, 1440, 1920];
const url = 'file:///Users/io/personal-repos/wedding/site/index.html';

const browser = await chromium.launch({ channel: 'chrome' });
let fail = 0;
const bad = (msg) => { console.log('  FAIL ' + msg); fail++; };

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images]
      .filter((i) => !i.complete)
      .map((i) => new Promise((res) => { i.onload = i.onerror = res; })));
  });
  console.log(`\n${width}x844`);

  // measure the pops in their landed state: a no-op before the motion pass, and the
  // position that actually has to fit the viewport after it
  await page.evaluate(() => document.querySelectorAll('.pop').forEach(e => e.classList.add('is-in')));
  await page.waitForTimeout(800);

  const m = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return {
      docW: document.documentElement.scrollWidth,
      winW: innerWidth,
      winH: innerHeight,
      intro: r('.panel--intro').height,
      invite: r('.panel--invite').height,
      sticky: getComputedStyle(document.querySelector('.panel--intro')).position,
      seamTop: parseFloat(getComputedStyle(document.querySelector('.panel--invite'), '::before').top),
      waveH: parseFloat(getComputedStyle(document.querySelector('.panel--invite'), '::before').height),
      frontTop: r('.env-front').top,
      tagBottom: r('.invite-tag').bottom,
      tagLeft: r('.invite-tag').left,
      tagRight: r('.invite-tag').right,
      pops: [...document.querySelectorAll('.pop')].map(e => {
        const b = e.getBoundingClientRect();
        return { cls: e.className, left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      }),
    };
  });

  if (m.docW > m.winW) bad(`horizontal scroll: scrollWidth ${m.docW} > ${m.winW}`);
  if (Math.abs(m.intro - m.winH) > 1) bad(`intro is ${m.intro}, expected ~${m.winH}`);
  if (m.invite < m.winH - 1) bad(`invite is ${m.invite}, expected >= ${m.winH}`);
  if (m.sticky !== 'sticky') bad(`intro position is ${m.sticky}`);
  if (Math.abs(m.seamTop + m.waveH - 1) > 0.6) bad(`seam overlap is ${(m.seamTop + m.waveH).toFixed(2)}px, expected 1`);
  for (const p of m.pops) {
    if (p.left < 0 || p.right > m.winW) bad(`${p.cls} escapes the viewport (${p.left.toFixed(0)}..${p.right.toFixed(0)})`);
    // the layered envelope only reads if each item both dips behind the pocket and
    // still shows above it
    if (p.bottom < m.frontTop + 12) bad(`${p.cls} does not tuck behind the pocket`);
    if (m.frontTop - p.top < 55) bad(`${p.cls} shows only ${(m.frontTop - p.top).toFixed(0)}px above the pocket`);
    const clearsTag = p.top > m.tagBottom + 8 || p.right < m.tagLeft || p.left > m.tagRight;
    if (!clearsTag) bad(`${p.cls} overlaps the hashtag`);
  }

  // the load-bearing claim: sticky must actually pin, not merely compute as sticky
  await page.evaluate(() => scrollTo(0, innerHeight * 0.6));
  await page.waitForTimeout(120);
  const pinned = await page.evaluate(() => document.querySelector('.panel--intro').getBoundingClientRect().top);
  if (Math.abs(pinned) > 1) bad(`intro did not pin: top is ${pinned.toFixed(1)} after scrolling`);

  console.log(`  intro ${m.intro} invite ${m.invite} sticky=${m.sticky} pinnedTop=${pinned.toFixed(1)}`);
  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS');
process.exit(fail ? 1 : 0);
```

- [ ] **Step 4: Run it**

```bash
cd "$SCRATCH" && node landing-check.mjs
```

Expected: `PASS`.

The most likely failure is `intro did not pin`. That means `body{overflow-x:clip}` is not
taking effect - confirm `landing.css` loads after `base.css` and that no other ancestor
sets a non-visible `overflow`.

- [ ] **Step 5: Look at it**

```bash
cd "$SCRATCH" && node -e "
import('playwright').then(async ({chromium}) => {
  const b = await chromium.launch({ channel:'chrome' });
  for (const w of [390, 1440]) {
    const p = await b.newPage({ viewport:{ width:w, height:844 } });
    await p.goto('file:///Users/io/personal-repos/wedding/site/index.html', { waitUntil:'networkidle' });
    await p.waitForTimeout(900);
    await p.screenshot({ path: \`static-\${w}.png\`, fullPage:true });
    await p.close();
  }
  await b.close();
})"
```

Read `static-390.png` and `static-1440.png`. Check by eye: the wavy seam has no transparent
gap against the cream, the four popped items sit between the envelope's two layers, and
nothing collides.

- [ ] **Step 6: Commit**

```bash
git add site/index.html site/landing.css
git commit -m "feat: add the landing page composition"
```

---

### Task 4: Motion

Add the entrances on top of the proven composition: the delayed text reveal, the tile
crossfade, the envelope pop, and the pinned-panel drift - each with a static end-state
under `prefers-reduced-motion`.

**Files:**
- Modify: `site/landing.css` (append the motion block)
- Modify: `site/index.html` (one `<script>` tag)
- Create: `site/landing.js`
- Create: `$SCRATCH/motion-check.mjs`

**Interfaces:**
- Consumes: the DOM contract from Task 3.
- Produces: `landing.js` as a classic script (not a module), reading
  `matchMedia('(prefers-reduced-motion: reduce)')` once and skipping both loops when set.

- [ ] **Step 1: Append the motion CSS to `site/landing.css`**

```css
/* ---------------------------------------------------------------------------
   Motion. Every animated element declares its own full shorthand: a shared
   reveal class with per-element delay overrides is where the cascade bites.
   --------------------------------------------------------------------------- */

@keyframes rise{
  from{ opacity:0; transform: translateY(14px); }
  to  { opacity:1; transform:none; }
}

@keyframes bob{
  0%, 100%{ transform:none; }
  50%     { transform: translateY(8px); }
}

/* the grid is the thing already on screen; the text arrives after it */
.grid       { opacity:0; animation: rise .8s ease-out .15s forwards; }
.intro-names{ opacity:0; animation: rise .8s ease-out 1s forwards; }
.intro-line { opacity:0; animation: rise .8s ease-out 1.2s forwards; }
.intro-and  { opacity:0; animation: rise .8s ease-out 1.8s forwards,
                                    bob 2.4s ease-in-out 2.6s infinite; }

.pop{
  transform: translate(var(--ox), var(--oy)) scale(.2);
  opacity:0;
  transition: transform 620ms var(--pop-ease) var(--delay),
              opacity 280ms ease-out var(--delay);
}
.pop.is-in{
  transform: translate(0, 0) scale(1) rotate(var(--rot));
  opacity:1;
}

/* the page is entirely motion, so reduced motion needs the finished composition
   on load - not a disabled page */
@media (prefers-reduced-motion: reduce){
  .grid, .intro-names, .intro-line, .intro-and{
    opacity:1;
    animation:none;
    transform:none;
  }
  .intro-stage{ opacity:1; transform:none; }
  .tile img{ transition:none; }

  /* the landed state comes from CSS, not from landing.js adding is-in - the media
     query is the stated mechanism, and it has to hold if the script never runs */
  .pop{
    transform: rotate(var(--rot));
    opacity:1;
    transition:none;
  }
}
```

`.pop{transform:…}` here overrides the `rotate(var(--rot))` set in Task 3 because it is
declared later at equal specificity. That is intentional: the rotation now arrives with
`.is-in`, so each item spins slightly as it flies out.

- [ ] **Step 2: Write `site/landing.js`**

```js
/* The landing's motion: tile crossfade, envelope pop, and the pinned-panel drift.
   All three are skipped under reduced motion, where the CSS already renders the
   finished composition. */
(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- envelope ------------------------------------------------------------ */

  var pops = document.querySelectorAll('.pop');
  function showPops() {
    for (var i = 0; i < pops.length; i++) pops[i].classList.add('is-in');
  }

  if (reduce) {
    showPops();
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          showPops();
          obs.disconnect();   // firing once; re-running on every scroll past reads as a tic
          return;
        }
      }
    }, { threshold: 0.35 });
    io.observe(document.querySelector('.panel--invite'));
  }

  /* --- tile flash ---------------------------------------------------------- */

  var POOL = 8, SLOTS = 4, DWELL = 3500, OFFSET = 900;

  function flash(tile, slot) {
    var imgs = [tile.querySelector('.tile-a'), tile.querySelector('.tile-b')];
    var shown = 0;
    var step = slot;

    function advance() {
      step += SLOTS;                        // a full slot-width per turn, so no two
      var next = imgs[1 - shown];           // slots ever land on the same image
      next.src = 'assets/landing/tile-' + (step % POOL + 1) + '.png';
      next.decode().catch(function () {}).then(function () {
        imgs[shown].classList.remove('is-shown');
        next.classList.add('is-shown');
        shown = 1 - shown;
      });
    }

    setTimeout(function () {
      advance();
      setInterval(advance, DWELL);
    }, DWELL + slot * OFFSET);   // hold the opening composition for a full beat first
  }

  if (!reduce) {
    var tiles = document.querySelectorAll('.tile');
    for (var t = 0; t < tiles.length; t++) flash(tiles[t], t);
  }

  /* --- pinned-panel drift -------------------------------------------------- */

  if (!reduce) {
    var intro = document.querySelector('.panel--intro');
    var queued = false;

    function drift() {
      queued = false;
      var p = Math.min(1, Math.max(0, scrollY / innerHeight));
      intro.style.setProperty('--p', p.toFixed(3));
    }

    addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(drift); }
    }, { passive: true });

    drift();
  }
}());
```

- [ ] **Step 3: Load it**

In `site/index.html`, immediately before `</body>`:

```html
<script src="landing.js" defer></script>
```

- [ ] **Step 4: Write the motion check**

Write `$SCRATCH/motion-check.mjs`:

```js
import { chromium } from 'playwright';

const url = 'file:///Users/io/personal-repos/wedding/site/index.html';
const browser = await chromium.launch({ channel: 'chrome' });
let fail = 0;
const bad = (m) => { console.log('  FAIL ' + m); fail++; };
const opacity = (page, sel) => page.evaluate((s) => +getComputedStyle(document.querySelector(s)).opacity, sel);

/* --- full motion --- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  console.log('\nfull motion');

  const srcs = () => page.evaluate(() =>
    [...document.querySelectorAll('.tile')].map(t => t.querySelector('img.is-shown').src.split('/').pop()));

  // t ~ 0.7s: the grid is rising, the text has not started
  await page.waitForTimeout(700);
  if (await opacity(page, '.intro-names') > 0.05) bad('names visible before 1s');
  if (await opacity(page, '.grid') < 0.3) bad('grid has not started by 700ms');
  const first = await srcs();
  if (new Set(first).size !== 4) bad('two slots share an image: ' + first.join(','));

  // t ~ 3.0s: every entrance has finished (the last ends at 2.6s)
  await page.waitForTimeout(2300);
  for (const sel of ['.grid', '.intro-names', '.intro-line', '.intro-and']) {
    if (await opacity(page, sel) < 0.95) bad(`${sel} not revealed by 3s`);
  }

  // t ~ 6.0s: slots 0-2 have swapped once, slot 3 has not - so the set has
  // changed without every slot having cycled back to where it started
  await page.waitForTimeout(3000);
  const later = await srcs();
  if (new Set(later).size !== 4) bad('two slots share an image after cycling: ' + later.join(','));
  if (first.join() === later.join()) bad('tiles never changed');
  console.log('  tiles ' + first.join(',') + ' -> ' + later.join(','));

  if (await opacity(page, '.pop--strip') > 0.05) bad('pop fired before panel 2 was in view');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1400);
  for (const sel of ['.pop--strip', '.pop--cat1', '.pop--cat2', '.pop--ticket']) {
    if (await opacity(page, sel) < 0.9) bad(`${sel} did not pop`);
  }

  const p = await page.evaluate(() => getComputedStyle(document.querySelector('.panel--intro')).getPropertyValue('--p').trim());
  if (parseFloat(p) < 0.99) bad(`--p is ${p} at the page bottom, expected 1`);

  await page.close();
}

/* --- reduced motion --- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  console.log('\nreduced motion');

  for (const sel of ['.grid', '.intro-names', '.intro-line', '.intro-and', '.pop--strip', '.pop--ticket']) {
    if (await opacity(page, sel) < 0.99) bad(`${sel} is not visible on load`);
  }
  const before = await page.evaluate(() => document.querySelector('.tile img.is-shown').src);
  await page.waitForTimeout(4800);   // past the first swap at DWELL + 0
  const after = await page.evaluate(() => document.querySelector('.tile img.is-shown').src);
  if (before !== after) bad('tiles still flashing under reduced motion');

  await page.close();
}

await browser.close();
console.log(fail ? `\nFAIL - ${fail} problem(s)` : '\nPASS');
process.exit(fail ? 1 : 0);
```

- [ ] **Step 5: Run it**

```bash
cd "$SCRATCH" && node motion-check.mjs
```

Expected: `PASS`.

- [ ] **Step 6: Re-run the geometry check**

Motion changed `.pop`'s transform, so re-confirm the items still land inside the viewport:

```bash
cd "$SCRATCH" && node landing-check.mjs
```

Expected: `PASS`. The check forces `is-in` before measuring, so it is the landed positions
that get held to the viewport - the same assertion in both tasks.

- [ ] **Step 7: Commit**

```bash
git add site/landing.js site/landing.css site/index.html
git commit -m "feat: animate the landing page reveal, tile flash, and envelope pop"
```

---

### Task 5: Acceptance sweep and comment trim

**Files:**
- Modify: `site/landing.css`, `site/landing.js`, `site/index.html`, `site/base.css` (comment trim only)
- Modify: `README.md`

- [ ] **Step 1: Trim the comments**

Read every comment added in Tasks 1, 3, and 4. Delete any that restates what the code
already says, and any that mentions this plan, a task number, or the spec. What survives
explains a decision the code cannot: why the wave is a mask, why `overflow-x` is `clip`,
why the observer disconnects, why the tile stride is `SLOTS`.

```bash
cd /Users/io/personal-repos/wedding
grep -rniE "task [0-9]|step [0-9]|per the spec|TODO|FIXME|as specified" site/ || echo "clean"
```

Expected: `clean`, apart from the invitation's pre-existing `<!-- TODO: replace with real RSVP URL -->`, which stays.

- [ ] **Step 2: Update the README**

The paths in "Before sending invites" are now wrong. Replace that section with:

```markdown
## Pages

- `site/index.html` - the landing page, served at `/`
- `site/invitation.html` - the invitation, served at `/invitation.html`

## Before sending invites

- Replace the placeholder art in `site/assets/landing/` with the real photos, envelope,
  photo booth strip, cat die-cuts, and ticket. Keep the file names; the layout is built
  against their intrinsic sizes.
- The RSVP button in `site/invitation.html` (`href="#rsvp"`) is a placeholder - replace it
  with the real RSVP form/link.
- Once the Pages URL is live, make `og:image` in both pages an absolute URL (link previews
  won't resolve a relative path).
```

- [ ] **Step 3: Run the whole acceptance list**

```bash
# rebuild the pre-move invitation to diff against; 7623ad3 is the last commit
# that still had it at site/index.html
rm -rf "$SCRATCH/_base" && mkdir -p "$SCRATCH/_base"
cd /Users/io/personal-repos/wedding
git show 7623ad3:site/index.html  > "$SCRATCH/_base/index.html"
git show 7623ad3:site/styles.css  > "$SCRATCH/_base/styles.css"
ln -s /Users/io/personal-repos/wedding/site/assets "$SCRATCH/_base/assets"
python3 -c "
import pathlib
p = pathlib.Path('$SCRATCH/_base/index.html'); t = p.read_text()
assert 'oumnonhappyhappy' in t
p.write_text(t.replace('#oumnonhappyhappy', '#happyoumhappynon'))"

cd "$SCRATCH"
node landing-check.mjs && node motion-check.mjs && \
  node regress.mjs \
    "file://$SCRATCH/_base/index.html" \
    "file:///Users/io/personal-repos/wedding/site/invitation.html"
```

Expected: three `PASS` lines. Every numbered item in the spec's Acceptance section is
covered by one of these three, except items 3 and 8, which step 4 covers by eye.

- [ ] **Step 4: Check the two visual claims by eye**

```bash
cd "$SCRATCH" && node -e "
import('playwright').then(async ({chromium}) => {
  const b = await chromium.launch({ channel:'chrome' });
  for (const w of [390, 1440]) {
    const p = await b.newPage({ viewport:{ width:w, height:844 } });
    await p.goto('file:///Users/io/personal-repos/wedding/site/index.html', { waitUntil:'networkidle' });
    await p.waitForTimeout(1200);
    await p.evaluate(() => scrollTo(0, innerHeight * 0.75));
    await p.waitForTimeout(1600);
    await p.screenshot({ path: \`accept-seam-\${w}.png\` });
    await p.evaluate(() => document.querySelector('.btn').focus());
    await p.screenshot({ path: \`accept-focus-\${w}.png\` });
    await p.close();
  }
  await b.close();
})"
```

Read `accept-seam-390.png` and `accept-seam-1440.png`: the wavy edge must show cream
against the stripes with no transparent gap, and the intro must be visibly receding behind
it. 390 matters on its own - `--wave-wl` is a `clamp()` that bottoms out on mobile, and the
geometry assertion in `landing-check.mjs` would still pass on a strip whose mask never
painted. Read `accept-focus-*.png`: the button must carry a visible focus ring.

- [ ] **Step 5: Commit**

```bash
git add README.md site/
git commit -m "docs: describe the landing page and the moved invitation"
```
