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

    // the envelope is above the fold, so the pop is timed to the copy's entrance
    // rather than scrolled into: it fires once the lead-in line has landed
    setTimeout(function () {
      for (var i = 0; i < pops.length; i++) pops[i].classList.add('is-in');
    }, 1300);
  } catch (e) {
    // a throw must not strand the page mid-entrance; dropping the class restores the
    // same landed composition a script-less visitor gets
    root.classList.remove('motion');
  }
}());
