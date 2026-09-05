/* Pixie dust off the wand: sparks spawned along a path on a fixed canvas over the page.
   Under a fine pointer the path is the hand's. A touch screen has no wand to trail, so
   where the page asks for it (data-hands-free on this script's tag) the wand flies
   itself: a lazy figure of eight across the band above the first heading. Skipped under
   reduced motion. Every failure here is silent: the dust is decoration, never the page. */
(function () {
  'use strict';

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var tag = document.currentScript;
  var handsFree = !fine && !!(tag && tag.hasAttribute('data-hands-free'));
  if (!fine && !handsFree) return;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'pixie';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  // the two CI tints a shade deeper than the ground - the flat ones vanish on the cream
  // card - and one warm gold so it reads as magic rather than confetti. The glint on
  // each spark is white, so white itself is not in the mix.
  var COLORS = ['#b3a3de', '#8fc4b4', '#f2c65a'];
  var MAX = 240;        // the oldest spark yields when the hand is fast
  // px of travel per spark, so speed sets density not frame rate, and how far each spark
  // scatters from the path. The flying wand moves slowly, so it lays a tighter, denser
  // trail: at the hand's spacing it reads as a fault rather than a path.
  var HAND = { spacing: 6, spread: 22 };
  var FLIGHT = { spacing: 2, spread: 14 };
  var GRAVITY = 70;     // px/s^2: dust settles, it does not drop
  var DRAG = 2.4;
  var LAP = 7;          // s per figure of eight, when the wand flies itself

  var dpr = 1, w = 0, h = 0;
  var sparks = [];
  var last = null;      // the previous path sample: x, y, t
  var raf = 0, lastFrame = 0;
  var figure = null;    // the figure of eight: centre and half-axes
  var theta = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (handsFree) fitLoop();
  }

  // The figure sits in the band between the top of the screen and the first heading,
  // so the dust falls onto the copy rather than across it. The band is read live: it
  // is a few px on a phone on its side and a hundred on one held upright.
  function fitLoop() {
    var head = document.querySelector('h1');
    var band = head ? head.getBoundingClientRect().top : 0;
    band = Math.max(band, 40);
    figure = { cx: w / 2, cy: band / 2, a: Math.min(w * .3, 170), b: Math.min(band * .45, 44) };
  }

  function spawn(x, y, vx, vy, spread) {
    if (sparks.length >= MAX) sparks.shift();
    var a = Math.random() * Math.PI * 2;
    var s = spread * (.3 + Math.random());
    sparks.push({
      x: x, y: y,
      // a spark carries a little of the hand's motion and scatters around it
      vx: vx * .12 + Math.cos(a) * s,
      vy: vy * .12 + Math.sin(a) * s,
      life: 0,
      ttl: .7 + Math.random() * .9,
      r: 1.2 + Math.random() * 2.2,
      star: Math.random() < .3,
      spin: Math.random() * Math.PI,
      twinkle: 6 + Math.random() * 10,
      color: COLORS[(Math.random() * COLORS.length) | 0]
    });
  }

  // one spark per emitter.spacing px, laid along the segment from the previous sample so a
  // fast sweep leaves a line of dust rather than a spark per event
  function trail(x, y, t, emitter) {
    if (!last) { last = { x: x, y: y, t: t }; return; }
    var dx = x - last.x, dy = y - last.y;
    var dist = Math.hypot(dx, dy);
    var dtms = Math.max(t - last.t, 1);
    var vx = dx / dtms * 1000, vy = dy / dtms * 1000;
    var n = Math.floor(dist / emitter.spacing);
    for (var i = 1; i <= n; i++) {
      var f = i / n;
      spawn(last.x + dx * f, last.y + dy * f, vx, vy, emitter.spread);
    }
    if (n) { last = { x: x, y: y, t: t }; wake(); }
  }

  function star(x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var rad = i % 2 ? r * .38 : r;
      var ang = rot + i * Math.PI / 4;
      ctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad);
    }
    ctx.closePath();
  }

  function frame(t) {
    var dt = Math.min((t - lastFrame) / 1000, .05);   // a tab coming back must not fling the dust
    lastFrame = t;
    ctx.clearRect(0, 0, w, h);

    if (handsFree) {
      // a lemniscate: x runs sin, y runs sin*cos, so the crossing is at the centre
      theta += dt * Math.PI * 2 / LAP;
      var s = Math.sin(theta), c = Math.cos(theta);
      trail(figure.cx + figure.a * s, figure.cy + figure.b * s * c, t, FLIGHT);
    }

    for (var i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i];
      p.life += dt;
      if (p.life >= p.ttl) { sparks.splice(i, 1); continue; }

      var k = 1 - DRAG * dt;
      p.vx *= k;
      p.vy = p.vy * k + GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // a spark holds its brightness and then goes out, rather than dimming from birth
      var fade = Math.pow(1 - p.life / p.ttl, .6);
      var glint = .6 + .4 * Math.sin(p.life * p.twinkle);
      var r = p.r * (.4 + .6 * fade);

      ctx.fillStyle = p.color;
      // a soft halo under each spark is what makes dust glow rather than speckle
      ctx.globalAlpha = fade * .2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = fade * glint;
      if (p.star) star(p.x, p.y, r * 1.8, p.spin + p.life * 2);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); }
      ctx.fill();

      // the white core is the glint: a point of light inside the tinted spark
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = fade * glint * .8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * .35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // under a pointer the loop runs only while there is dust in the air; the flying
    // wand keeps it running
    raf = (sparks.length || handsFree) ? requestAnimationFrame(frame) : 0;
  }

  function wake() {
    if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
  }

  resize();
  addEventListener('resize', resize);

  if (handsFree) {
    // the heading moves when the web font lands, and the figure follows it
    if (document.fonts) document.fonts.ready.then(fitLoop);
    wake();
    return;
  }

  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    trail(e.clientX, e.clientY, e.timeStamp, HAND);
  }, { passive: true });

  // a press is a flick of the wand: a burst from the tip
  addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;
    for (var i = 0; i < 16; i++) spawn(e.clientX, e.clientY, 0, -40, 90);
    wake();
  }, { passive: true });

  // the trail must not jump across the gap when the hand comes back in
  addEventListener('pointerleave', function () { last = null; });
  document.addEventListener('pointerleave', function () { last = null; });
}());
