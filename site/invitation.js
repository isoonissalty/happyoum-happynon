/* The invitation's two scripts: the gallery lightbox, and the scripted motion where
   decorations grow in and agenda items rise as they scroll into view. Only the motion
   is skipped under reduced motion - the lightbox is navigation, not animation. */
(function () {
  'use strict';

  var root = document.documentElement;

  // --- lightbox --------------------------------------------------------------
  // Every tile is a link to its photo, so without a working <dialog> a tap simply
  // opens the picture; the lightbox only steps in where it can.
  var box = document.querySelector('.lightbox');
  var boxImg = box && box.querySelector('.lb-img');
  var boxFrame = box && box.querySelector('.lb-frame');
  if (box && typeof box.showModal === 'function') {
    var roll = [];      // the tiles of the roll on screen, never the page's other tiles
    var at = 0;

    // The alt goes on once the photo is there, never before: a browser paints the alt of
    // a broken img - its text and its own broken-image glyph - over the frame's tint,
    // and clearing it on the error event leaves that glyph up until the load gives out.
    var pendingAlt = '';
    boxImg.addEventListener('load', function () { boxImg.alt = pendingAlt; });

    function show(i) {
      // the index wraps inside this roll, so the ends of a roll meet each other
      at = (i + roll.length) % roll.length;
      var tile = roll[at];
      pendingAlt = tile.getAttribute('aria-label') || '';
      boxImg.alt = '';
      boxImg.src = tile.getAttribute('href');
      // the tile's own pastel backs the picture, so a photo that has not landed yet
      // paints as that tile rather than as a hole
      var fill = tile.querySelector('.tile-fill');
      boxFrame.style.setProperty('--tint', fill ? getComputedStyle(fill).backgroundColor : '');
    }

    var tiles = document.querySelectorAll('.tile');
    for (var i = 0; i < tiles.length; i++) {
      tiles[i].addEventListener('click', function (e) {
        e.preventDefault();
        roll = [].slice.call(this.closest('.roll').querySelectorAll('.tile'));
        show(roll.indexOf(this));
        box.showModal();
      });
    }

    box.querySelector('.lb-prev').addEventListener('click', function () { show(at - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(at + 1); });
    box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });

    // Escape is the dialog's own; the arrows are ours
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
    });

    // a swipe is the finger's arrow key; a short drag is a tap that wandered
    var SWIPE = 40;
    var startX = null;
    var swiped = false;
    box.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].clientX;
      swiped = false;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > SWIPE) { swiped = true; show(at + (dx < 0 ? 1 : -1)); }
    }, { passive: true });

    // anything that is not the picture or a button is off the picture. A swipe across
    // the scrim ends in a click on it too, and that must not close what it just turned.
    box.addEventListener('click', function (e) {
      if (swiped) { swiped = false; return; }
      if (e.target === box) box.close();
    });

    // an empty src stops the last picture flashing up before the next one loads
    box.addEventListener('close', function () { boxImg.removeAttribute('src'); });
  }

  // --- motion ----------------------------------------------------------------
  // .motion is never added under reduced motion, so the CSS default - the finished
  // scatter - is what renders
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.classList.add('motion');

  try {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          io.unobserve(entries[i].target);   // enters once; re-entering on every pass reads as a tic
        }
      }
    }, { rootMargin: '0px 0px -8% 0px' });

    var risers = document.querySelectorAll('.deco, .agenda li');
    for (var j = 0; j < risers.length; j++) io.observe(risers[j]);
  } catch (e) {
    // a throw must not strand the page with an empty scatter; dropping the class restores
    // the same static composition a script-less visitor gets
    root.classList.remove('motion');
  }
}());
