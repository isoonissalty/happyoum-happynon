/* The landing's one scripted motion: the envelope pop. Skipped under reduced motion,
   where the CSS already renders the finished composition. */
(function () {
  'use strict';

  var root = document.documentElement;

  // .motion is never added under reduced motion, so the CSS default - the finished
  // composition - is what renders
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.classList.add('motion');

  try {
    var pops = document.querySelectorAll('.pop');
    var envelope = document.querySelector('.envelope');
    var LAST_DELAY = 330, FLIGHT = 620;
    var flying = false;

    function each(fn) { for (var i = 0; i < pops.length; i++) fn(pops[i]); }

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
    // instant because neither class carries a transition on the way out
    envelope.addEventListener('click', function () {
      if (flying) return;
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
