# UI Spec - Oum & Non Wedding Site (single page)

**Oracle image:** `docs/ui-specs/assets/wedding-site.png` (1440x5207)
**Fidelity mode:** MATCH (greenfield, no design system; measurements taken from oracle, rounded to 4px)
**Design reference:** `2026-08-23-wedding-site.design.md` (build from BOTH files)

## Context

- Static one-page wedding invitation, deployed to GitHub Pages (user pushes manually).
- Plain HTML + CSS (+ tiny JS only if needed for calendar). No framework, no build step.
- Output lives in `site/` at repo root; `site/index.html` is the entry. (GitHub Pages: user can point Pages at `/site` via `docs/`-style config or move files; keep everything relative-path so it works from any subpath.)
- All artwork is real assets in `site/assets/` (from the couple's zip + high-res crops of the mock). NEVER redraw artwork; use the files.

## Page structure (top to bottom, one scrolling column)

1. **Hero**
   - Eyebrow caps: `WE'RE GETTING`
   - Script headline: `Married!`
   - Illustration: `logo-hearts.png` (heart locket with ribbon)
   - Script names: `Oum & Non`
   - Body: `Together with our families, we'd like to invite you to celebrate our wedding.` (NOTE: mock has typo "tocelebrate" - fix to "to celebrate")
   - Caps date block, 2 lines: `23 JANUARY 2027` / `6 PM @FOUND VENUE`
2. **Dress code**
   - Grey label: `Dress Code`
   - `dresscode-cluster.png` (script word "Pastel" ringed by pastel doodles - text baked into image)
3. **Agenda**
   - Grey label: `Agenda`
   - 4 items, each = bow image + doodle icon + bold time + item name:
     | bow | icon | time | label | sub |
     |---|---|---|---|---|
     | bow-teal | icon-registration | 6 pm | Guest registration | - |
     | bow-blue | icon-camera | 6:30 pm | Photo time | - |
     | bow-pink | icon-dinner | 7:30 pm | Dinner reception | (Seated buffet) |
     | bow-purple | icon-afterparty | 9:30 pm | After party | - |
4. **Where to celebrate**
   - Grey label: `Where to celebrate`
   - `map.png` in a rounded container; whole map is a link to Google Maps (found venue, 8 86 Nuan Chan 12 Alley) opening in new tab: `https://www.google.com/maps/search/?api=1&query=found+venue+8+86+Nuan+Chan+12+Alley+Bangkok+10230`
   - Venue name bold: `found venue`
   - Address: `8 86 Nuan Chan 12 Alley, Nuan Chan,` / `Bueng Kum, Bangkok 10230`
5. **Actions (added scope - not in mock, styled to match)**
   - `RSVP` button - href placeholder `#rsvp` with HTML comment `<!-- TODO: replace with real RSVP URL -->`
   - `Add to calendar` button - links to Google Calendar template URL for 23 Jan 2027 18:00-23:59 ICT, title "Oum & Non Wedding", location = venue address. (No .ics download; single link keeps it JS-free.)
   - Both styled as pill outline buttons in ink color on cream (see design.md).
6. **Footer (on the striped background, below the cream card)**
   - Cream text: `#oumnonhappyhappy`
- Decorative star/diamond/sparkle assets scattered throughout the cream card margins (see design.md scatter plan).

## Behavior

- No nav, no scroll-jacking, no animation required. Optional: subtle `prefers-reduced-motion`-safe hover on buttons only.
- Links: map + buttons open in new tab (`rel="noopener"`).
- Language: English only.
- `<title>`: `Oum & Non - We're Getting Married!` Meta description + og:image (use `assets/logo-hearts.png`).

## Data / copy

All copy is static and listed above. No forms, no API.

## Responsive (defaulted)

- Mock is desktop 1440. Single centered column already; on mobile keep same stacking, shrink stripe width and card inset per design.md. Content column max-width 720px.
- Must look right at 390px and 1440px widths.

## Acceptance checklist (for verify-ui-against-design-headless)

- [ ] Striped background: alternating vertical mint/lavender bars, visible on both sides and above/below the card
- [ ] Cream card with WAVY edge on all sides (not straight, not simple border-radius)
- [ ] Hero: caps eyebrow -> script "Married!" -> heart-locket image -> script "Oum & Non" -> 2-line invite body -> caps date block, all centered
- [ ] Dress Code section shows the Pastel cluster image at correct size
- [ ] Agenda: 4 items in order with correct bow color, icon, time (bold), label; dinner has "(Seated buffet)" small line
- [ ] Map section: rounded map image linking to Google Maps; venue name bold + 2-line address
- [ ] RSVP + Add to calendar pill buttons, styled per design.md
- [ ] Footer hashtag in cream on the stripes
- [ ] Decorative stars scattered in card margins, none overlapping text content
- [ ] No horizontal scroll at 390px or 1440px; all assets load (no 404s)
- [ ] Fonts: script/caps/rounded-sans trio loaded from Google Fonts per design.md
