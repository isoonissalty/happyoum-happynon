/* The landing's two scripts: the viewer that opens an envelope item large, and the
   envelope pop. The pop is skipped under reduced motion, where the CSS already renders
   the finished composition. */
(function () {
  'use strict';

  var root = document.documentElement;
  var pops = document.querySelectorAll('.pop');
  var envelope = document.querySelector('.envelope');

  function each(fn) { for (var i = 0; i < pops.length; i++) fn(pops[i]); }

  // --- viewer ---------------------------------------------------------------
  // Every item is a link to its image, so without a working <dialog> the link
  // simply opens the picture; the viewer only steps in where it can.
  var viewer = document.querySelector('.viewer');
  var viewerImg = viewer && viewer.querySelector('.viewer-img');
  if (viewer && typeof viewer.showModal === 'function') {
    each(function (p) {
      p.addEventListener('click', function (e) {
        e.preventDefault();
        viewerImg.src = p.getAttribute('href');
        viewerImg.alt = p.getAttribute('aria-label') || '';
        viewer.showModal();
      });
    });
    // a click on the dialog itself is a click off the picture
    viewer.addEventListener('click', function (e) {
      if (e.target === viewer || e.target.closest('.viewer-close')) viewer.close();
    });
    // an empty src stops the last picture flashing up before the next one loads
    viewer.addEventListener('close', function () { viewerImg.removeAttribute('src'); });
  }

  // --- pop -------------------------------------------------------------------
  // .motion is never added under reduced motion, so the CSS default - the finished
  // composition - is what renders
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.classList.add('motion');

  try {
    var LAST_DELAY = 330, FLIGHT = 620;
    var flying = false;

    // .landed swaps the entrance timing for the hover timing once every item is down,
    // so the first hover does not wait out the last item's entrance delay
    function pop() {
      flying = true;
      each(function (p) { p.classList.add('is-in'); });
      setTimeout(function () {
        each(function (p) { p.classList.add('landed'); });
        flying = false;
      }, LAST_DELAY + FLIGHT + 50);
    }

    // the envelope is above the fold, so the pop is timed to the copy's entrance
    // rather than scrolled into: it fires once the lead-in line has landed
    setTimeout(pop, 1300);

    // tapping the envelope tucks everything back in and pops it again; the tuck is
    // instant because neither class carries a transition on the way out. A tap on an
    // item is the viewer's, not a replay.
    envelope.addEventListener('click', function (e) {
      if (flying || e.target.closest('.pop')) return;
      each(function (p) { p.classList.remove('is-in', 'landed'); });
      // two frames so the tucked state paints before the entrance starts from it
      requestAnimationFrame(function () { requestAnimationFrame(pop); });
    });
  } catch (e) {
    // a throw must not strand the page mid-entrance; dropping the class restores the
    // same landed composition a script-less visitor gets
    root.classList.remove('motion');
  }
}());
