/**
 * figure.js — side-view animated stick figure for exercise demos.
 *
 * A pose is { hip:[x,y], t (torso lean, degrees forward from vertical),
 * feet:[near, far], hands:[near, far], knee?, elbow?, knees? }. knees pins a
 * knee exactly ([near|null, far|null]) for floor stretches IK cannot guess. Knees and elbows are
 * solved with two-link IK, so anything pinned (hands on the floor, feet on a
 * box) stays pinned while the body moves between keyframes.
 *
 * A move is { view, props[], frames:[{ pose, hold, move }] }: hold = ms at the
 * pose, move = ms to travel to the next one. Works in the browser
 * (window.Figure) and in node (module.exports) for render checks.
 */
(function (root) {
  'use strict';

  const L = { thigh: 42, shin: 42, torso: 50, upper: 30, fore: 28, neck: 13, head: 9 };
  const GROUND = 180;

  // Joint between root and target for segments a, b. bend picks the side:
  // knees use -1 (forward of the hip→ankle line), elbows +1.
  function ik(r, tg, a, b, bend) {
    const dx = tg[0] - r[0], dy = tg[1] - r[1];
    let d = Math.hypot(dx, dy) || 0.001;
    const ux = dx / d, uy = dy / d;
    if (d >= a + b) { return [r[0] + ux * a, r[1] + uy * a]; }
    d = Math.max(d, Math.abs(a - b) + 0.01);
    const x = (a * a - b * b + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, a * a - x * x));
    return [r[0] + ux * x - uy * h * bend, r[1] + uy * x + ux * h * bend];
  }

  // Where a limb actually ends when the target is out of reach.
  function reach(r, j, tg, b) {
    const dx = tg[0] - j[0], dy = tg[1] - j[1];
    const d = Math.hypot(dx, dy) || 0.001;
    return d <= b + 0.01 ? tg : [j[0] + dx / d * b, j[1] + dy / d * b];
  }

  function solve(p) {
    const rad = p.t * Math.PI / 180;
    // plank: the body is one rigid line from the feet, so only the angle moves
    const hip = p.plank
      ? [p.feet[0][0] + Math.sin(rad) * (L.thigh + L.shin), p.feet[0][1] - Math.cos(rad) * (L.thigh + L.shin)]
      : p.hip;
    const sh = [hip[0] + Math.sin(rad) * L.torso, hip[1] - Math.cos(rad) * L.torso];
    const hr = (p.t + (p.headTilt || 0)) * Math.PI / 180;
    const head = [sh[0] + Math.sin(hr) * L.neck, sh[1] - Math.cos(hr) * L.neck];
    const kb = p.knee == null ? -1 : p.knee;
    const eb = p.elbow == null ? 1 : p.elbow;
    const legs = p.feet.map(function (f, i) {
      const k = (p.knees && p.knees[i]) || ik(hip, f, L.thigh, L.shin, kb);
      return { hip: hip, knee: k, foot: reach(hip, k, f, L.shin) };
    });
    const arms = p.hands.map(function (h) {
      const e = ik(sh, h, L.upper, L.fore, eb);
      return { sh: sh, elbow: e, hand: reach(sh, e, h, L.fore) };
    });
    return { hip: hip, sh: sh, head: head, legs: legs, arms: arms, t: p.t };
  }

  const lerp = function (a, b, k) { return a + (b - a) * k; };
  const lerp2 = function (a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; };

  function mix(a, b, k) {
    return {
      hip: lerp2(a.hip, b.hip, k),
      t: lerp(a.t, b.t, k),
      headTilt: lerp(a.headTilt || 0, b.headTilt || 0, k),
      feet: a.feet.map(function (f, i) { return lerp2(f, b.feet[i], k); }),
      hands: a.hands.map(function (h, i) { return lerp2(h, b.hands[i], k); }),
      plank: !!(a.plank && b.plank),
      knee: k < 0.5 ? a.knee : b.knee,
      elbow: k < 0.5 ? a.elbow : b.elbow,
      knees: (a.knees || b.knees) ? [0, 1].map(function (i) {
        const ka = a.knees && a.knees[i], kb = b.knees && b.knees[i];
        return ka && kb ? lerp2(ka, kb, k) : (k < 0.5 ? ka : kb) || null;
      }) : undefined,
    };
  }

  const f1 = function (n) { return Math.round(n * 10) / 10; };
  const seg = function (a, b, cls) {
    return '<line class="' + cls + '" x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '"/>';
  };

  // Props: scenery drawn behind the figure, and gear that rides on the hands
  // (drawn in front). Hand-attached props read the solved hand positions.
  const ATTACHED = { db: 1, goblet: 1, kb: 1, pack: 1, bag: 1, grip: 1, spear: 1, strap: 1, ball: 1, band: 1 };

  function prop(pr, s) {
    const h = function (i) { return s.arms[i].hand; };
    const mid = function () { return lerp2(h(0), h(1), 0.5); };
    switch (pr.type) {
      case 'ground': return '<line class="fg-ground" x1="-20" y1="' + GROUND + '" x2="260" y2="' + GROUND + '"/>';
      case 'bar':    return '<line class="fg-bar" x1="' + pr.x1 + '" y1="' + pr.y + '" x2="' + pr.x2 + '" y2="' + pr.y + '"/>';
      case 'box':    return '<rect class="fg-box" x="' + pr.x + '" y="' + pr.y + '" width="' + pr.w + '" height="' + pr.h + '" rx="2"/>';
      case 'rope':   return '<line class="fg-rope" x1="' + pr.x + '" y1="-60" x2="' + pr.x + '" y2="' + GROUND + '"/>';
      case 'rungs':  return '<line class="fg-bar" x1="20" y1="' + (pr.y - 10) + '" x2="220" y2="' + (pr.y - 10) + '"/>' +
        pr.xs.map(function (x) { return '<circle class="fg-rung" cx="' + x + '" cy="' + pr.y + '" r="5"/>'; }).join('');
      case 'mountain': return '<path class="fg-box" d="M-20 180 L70 70 L120 120 L170 40 L260 180 Z" opacity=".55"/>';
      case 'plate': {  // a loaded bar seen end-on: the plate is a circle at the hands
        const p = mid();
        return '<circle class="fg-plate" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="20"/>';
      }
      case 'db': {
        const p = h(pr.hand || 0);
        return '<rect class="fg-wt" x="' + f1(p[0] - 9) + '" y="' + f1(p[1] - 4) + '" width="18" height="8" rx="2"/>';
      }
      case 'goblet': {
        const p = mid();
        return '<rect class="fg-wt" x="' + f1(p[0] - 5) + '" y="' + f1(p[1] - 14) + '" width="10" height="24" rx="3"/>';
      }
      case 'kb': {
        const p = mid();
        return '<circle class="fg-wt" cx="' + f1(p[0]) + '" cy="' + f1(p[1] + 9) + '" r="9"/>';
      }
      case 'pack': {
        const p = mid();
        return '<rect class="fg-wt" x="' + f1(p[0] - 11) + '" y="' + f1(p[1] - 2) + '" width="22" height="20" rx="5"/>';
      }
      case 'bag': {
        const p = mid();
        return '<ellipse class="fg-wt" cx="' + f1(p[0] - 4) + '" cy="' + f1(p[1] + 2) + '" rx="13" ry="17"/>';
      }
      case 'grip': {   // pulldown bar on a cable
        const p = mid();
        return '<line class="fg-cable" x1="' + f1(p[0]) + '" y1="-60" x2="' + f1(p[0]) + '" y2="' + f1(p[1]) + '"/>' +
          '<line class="fg-bar" x1="' + f1(p[0] - 10) + '" y1="' + f1(p[1]) + '" x2="' + f1(p[0] + 10) + '" y2="' + f1(p[1]) + '"/>';
      }
      case 'strap': {  // towels hanging from a bar to the hands
        return [0, 1].map(function (i) {
          return '<line class="fg-rope" x1="' + f1(h(i)[0]) + '" y1="' + pr.y + '" x2="' + f1(h(i)[0]) + '" y2="' + f1(h(i)[1] + 6) + '"/>';
        }).join('');
      }
      case 'spear': {
        const p = h(0), a = (pr.angle || -8) * Math.PI / 180;
        const dx = Math.cos(a) * 46, dy = Math.sin(a) * 46;
        return '<line class="fg-spear" x1="' + f1(p[0] - dx) + '" y1="' + f1(p[1] - dy) + '" x2="' + f1(p[0] + dx * 1.2) + '" y2="' + f1(p[1] + dy * 1.2) + '"/>';
      }
      case 'ball': {   // under the near foot, rolling with it
        const p = s.legs[0].foot;
        return '<circle class="fg-wt" cx="' + f1(p[0]) + '" cy="' + (GROUND - 7) + '" r="7"/>';
      }
      case 'band': {   // strap from the hands to the near foot
        const p = mid(), q = s.legs[0].foot;
        return '<line class="fg-spear" x1="' + f1(p[0]) + '" y1="' + f1(p[1]) + '" x2="' + f1(q[0]) + '" y2="' + f1(q[1]) + '"/>';
      }
      default: return '';
    }
  }

  function render(move, pose) {
    const s = solve(pose);
    const props = move.props || [];
    const behind = props.filter(function (p) { return !ATTACHED[p.type]; });
    const front = props.filter(function (p) { return ATTACHED[p.type] && !(p.type === 'db' && p.hand === 1); });
    const farWt = props.filter(function (p) { return p.type === 'db' && p.hand === 1; });
    let out = '';
    behind.forEach(function (p) { out += prop(p, s); });
    // far side first, lighter
    out += seg(s.legs[1].hip, s.legs[1].knee, 'fg-far') + seg(s.legs[1].knee, s.legs[1].foot, 'fg-far');
    out += seg(s.arms[1].sh, s.arms[1].elbow, 'fg-far') + seg(s.arms[1].elbow, s.arms[1].hand, 'fg-far');
    farWt.forEach(function (p) { out += prop(p, s); });
    // near side
    out += seg(s.hip, s.sh, 'fg-body');
    out += seg(s.legs[0].hip, s.legs[0].knee, 'fg-near') + seg(s.legs[0].knee, s.legs[0].foot, 'fg-near');
    out += '<circle class="fg-head" cx="' + f1(s.head[0]) + '" cy="' + f1(s.head[1]) + '" r="' + L.head + '"/>';
    out += seg(s.arms[0].sh, s.arms[0].elbow, 'fg-near') + seg(s.arms[0].elbow, s.arms[0].hand, 'fg-near');
    front.forEach(function (p) { out += prop(p, s); });
    return out;
  }

  const ease = function (k) { return 0.5 - Math.cos(Math.PI * k) / 2; };

  // Pose at time ms into the loop.
  function at(move, ms) {
    const fr = move.frames;
    const total = fr.reduce(function (n, f) { return n + (f.hold || 0) + (f.move || 0); }, 0);
    let t = ms % total;
    for (let i = 0; i < fr.length; i++) {
      const f = fr[i], next = fr[(i + 1) % fr.length];
      if (t < (f.hold || 0)) { return f.pose; }
      t -= f.hold || 0;
      if (t < (f.move || 0)) { return mix(f.pose, next.pose, ease(t / f.move)); }
      t -= f.move || 0;
    }
    return fr[0].pose;
  }

  const CSS = '.fg-near,.fg-far,.fg-body{stroke:var(--fg-ink,currentColor);stroke-width:7;stroke-linecap:round;fill:none}' +
    '.fg-body{stroke-width:9}.fg-far{opacity:.38}.fg-head{fill:var(--fg-ink,currentColor)}' +
    '.fg-ground{stroke:var(--fg-line,#999);stroke-width:2}.fg-bar{stroke:var(--fg-line,#999);stroke-width:5;stroke-linecap:round}' +
    '.fg-box{fill:var(--fg-prop,#ccc)}.fg-wt{fill:var(--fg-accent,#c2410c)}' +
    '.fg-rope{stroke:var(--fg-line,#999);stroke-width:4;stroke-linecap:round}.fg-cable{stroke:var(--fg-line,#999);stroke-width:1.5}' +
    '.fg-rung{fill:var(--fg-line,#999)}.fg-plate{fill:none;stroke:var(--fg-accent,#c2410c);stroke-width:6}' +
    '.fg-spear{stroke:var(--fg-accent,#c2410c);stroke-width:3.5;stroke-linecap:round}';

  function svg(move, inner) {
    return '<svg viewBox="' + (move.view || '0 -30 240 230') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      (move.label || 'Exercise demo') + '"><style>' + CSS + '</style><g class="fg">' + inner + '</g></svg>';
  }

  // Mount a looping animation in el. Returns a stop function.
  function mount(el, move, opts) {
    opts = opts || {};
    el.innerHTML = svg(move, render(move, move.frames[0].pose));
    const g = el.querySelector('g.fg');
    const reduced = opts.reduced != null ? opts.reduced
      : (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduced) {
      // Step through keyframes on tap instead of looping.
      let i = 0;
      const step = function () { i = (i + 1) % move.frames.length; g.innerHTML = render(move, move.frames[i].pose); };
      el.addEventListener('click', step);
      return function () { el.removeEventListener('click', step); };
    }
    let raf = 0, t0 = 0, stopped = false;
    const tick = function (now) {
      if (stopped) { return; }
      if (!t0) { t0 = now; }
      g.innerHTML = render(move, at(move, now - t0));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return function () { stopped = true; cancelAnimationFrame(raf); };
  }

  const api = { mount: mount, render: render, svg: svg, at: at, solve: solve, GROUND: GROUND };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; } else { root.Figure = api; }
})(typeof window !== 'undefined' ? window : this);
