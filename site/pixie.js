/* Pixie dust off the wand: sparks spawned along the pointer's path on a fixed canvas
   over the page. Skipped where there is no wand to trail - coarse pointers - and under
   reduced motion. Every failure here is silent: the dust is decoration, never the page. */
(function () {
  'use strict';

  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
  var SPACING = 6;      // px of travel per spark, so speed sets density not frame rate
  var GRAVITY = 70;     // px/s^2: dust settles, it does not drop
  var DRAG = 2.4;

  var dpr = 1, w = 0, h = 0;
  var sparks = [];
  var last = null;      // the previous pointer sample: x, y, t
  var raf = 0, lastFrame = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

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

    // the loop runs only while there is dust in the air
    raf = sparks.length ? requestAnimationFrame(frame) : 0;
  }

  function wake() {
    if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
  }

  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var x = e.clientX, y = e.clientY, t = e.timeStamp;
    if (!last) { last = { x: x, y: y, t: t }; return; }

    var dx = x - last.x, dy = y - last.y;
    var dist = Math.hypot(dx, dy);
    var dtms = Math.max(t - last.t, 1);
    var vx = dx / dtms * 1000, vy = dy / dtms * 1000;

    // one spark per SPACING px, laid along the segment so a fast sweep leaves a line
    // of dust rather than a spark per event
    var n = Math.floor(dist / SPACING);
    for (var i = 1; i <= n; i++) {
      var f = i / n;
      spawn(last.x + dx * f, last.y + dy * f, vx, vy, 22);
    }
    if (n) { last = { x: x, y: y, t: t }; wake(); }
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
