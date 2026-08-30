/* The landing's motion: tile crossfade, envelope pop, and the pinned-panel drift.
   All three are skipped under reduced motion, where the CSS already renders the
   finished composition. */
(function () {
  'use strict';

  var root = document.documentElement;

  // Nothing below runs under reduced motion, and .motion is never added, so the CSS
  // default - the finished composition - is what renders.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.classList.add('motion');

  try {

  /* --- envelope ------------------------------------------------------------ */

  var pops = document.querySelectorAll('.pop');
  function showPops() {
    for (var i = 0; i < pops.length; i++) pops[i].classList.add('is-in');
  }

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

  /* --- tile flash ---------------------------------------------------------- */

  var grid = document.querySelector('.grid');
  var POOL = parseInt(grid.getAttribute('data-pool'), 10) || 0;
  var SLOTS = 4, DWELL = 3500;

  var tiles = document.querySelectorAll('.tile');
  var current = [0, 1, 2, 3];   // the pool image each slot is showing
  var face = [0, 0, 0, 0];      // which of the slot's two img elements is visible
  var turn = 0;
  var busy = false;
  var timer = null;
  var giveUps = 0;

  // repeated failures mean the photos are not arriving at all; stop re-requesting and
  // let the grid settle on the still composition the no-script path already renders
  function strike() {
    if (++giveUps >= 3) { clearInterval(timer); timer = null; }
  }

  // One swap at a time, round robin. Four concurrent decodes would let two slots scan
  // for a free image before either had committed to one, and both take it - which a
  // megabyte photo on a slow phone hits and a few-KB placeholder never does.
  function advance() {
    if (busy) return;   // a slow photo delays the next swap rather than stacking them

    var slot = turn;
    turn = (turn + 1) % SLOTS;

    var i = current[slot];
    do { i = (i + 1) % POOL; } while (current.indexOf(i) !== -1);

    var imgs = [tiles[slot].querySelector('.tile-a'), tiles[slot].querySelector('.tile-b')];
    var next = imgs[1 - face[slot]];
    next.src = 'assets/landing/tile-' + (i + 1) + '.png';

    busy = true;
    var abandoned = false;

    // long enough that a large photo on a weak connection still lands: re-setting src
    // cancels the fetch already in flight, so an eager valve makes a slow link slower
    var valve = setTimeout(function () { abandoned = true; busy = false; strike(); }, 2 * DWELL);

    next.decode().then(function () {
      clearTimeout(valve);
      if (abandoned) return;   // the turn has moved on; committing now could claim an
      giveUps = 0;             // index another slot legitimately holds
      current[slot] = i;
      imgs[face[slot]].classList.remove('is-shown');
      next.classList.add('is-shown');
      face[slot] = 1 - face[slot];
      busy = false;
    }, function () {
      clearTimeout(valve);
      if (abandoned) return;
      busy = false;
      strike();
    });
  }

  // with no more photos than slots there is nothing free to rotate into, so the grid
  // stays on its opening four
  if (POOL > SLOTS) {
    setTimeout(function () { timer = setInterval(advance, DWELL / SLOTS); }, DWELL);
  }

  /* --- pinned-panel drift -------------------------------------------------- */

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

  } catch (e) {
    // a throw partway through must not strand the page mid-entrance; dropping the
    // class restores the same landed composition a script-less visitor gets
    root.classList.remove('motion');
  }
}());
