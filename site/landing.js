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
