/* The invitation's one scripted motion: each decoration grows in as it scrolls into
   view, then drifts. Skipped under reduced motion, where the CSS renders the static
   scatter. */
(function () {
  'use strict';

  var root = document.documentElement;

  // .motion is never added under reduced motion, so the CSS default - the finished
  // scatter - is what renders
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.classList.add('motion');

  try {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          io.unobserve(entries[i].target);   // grows in once; re-growing on every pass reads as a tic
        }
      }
    }, { rootMargin: '0px 0px -8% 0px' });

    var decos = document.querySelectorAll('.deco');
    for (var j = 0; j < decos.length; j++) io.observe(decos[j]);
  } catch (e) {
    // a throw must not strand the page with an empty scatter; dropping the class restores
    // the same static composition a script-less visitor gets
    root.classList.remove('motion');
  }
}());
