/**
 * moves.js — keyframes for the exercise animations (see figure.js).
 * Figure faces right, ground at y = 180. Keyed by exercise key in plan.js.
 * Exercises with no entry here (side plank, Pallof press, towel wring) show
 * their coaching card without a figure: side-on they read as nothing.
 */
(function (root) {
  'use strict';
  const G = { type: 'ground' };
  const DB2 = [{ type: 'db', hand: 0 }, { type: 'db', hand: 1 }];
  const HANG_BAR = { type: 'bar', x1: 80, x2: 160, y: -6 };
  const HANG_VIEW = '0 -40 240 240';
  const TOP = '0 50 240 190';   // seen from above: no ground, body spans y 90-210
  const f = function (pose, hold, move) { return { pose: pose, hold: hold || 0, move: move || 0 }; };

  // Walk cycle in place. hands and lean vary per carry.
  function walk(hands, t, speed) {
    const sp = speed || 380;
    return [
      f({ hip: [120, 99], t: t, feet: [[137, 180], [103, 180]], hands: hands }, 0, sp),
      f({ hip: [120, 95], t: t, feet: [[121, 180], [117, 166]], hands: hands }, 0, sp),
      f({ hip: [120, 99], t: t, feet: [[103, 180], [137, 180]], hands: hands }, 0, sp),
      f({ hip: [120, 95], t: t, feet: [[117, 166], [121, 180]], hands: hands }, 0, sp),
    ];
  }

  const pullupFrames = function (down, up) {
    return [
      f({ hip: [120, 102], t: 0, feet: [[110, 178], [108, 180]], hands: [[124, -6], [120, -6]] }, 600, up),
      f({ hip: [117, 48], t: -2, headTilt: 6, feet: [[107, 124], [105, 126]], hands: [[124, -6], [120, -6]] }, 500, down),
    ];
  };

  const stand = { hip: [120, 96], t: 0, feet: [[124, 180], [118, 180]], hands: [[123, 103], [119, 103]] };

  const moves = {
    'goblet-squat': { label: 'Goblet squat', props: [G, { type: 'goblet' }], frames: [
      f({ hip: [120, 96], t: 0, feet: [[124, 180], [118, 180]], hands: [[138, 76], [136, 78]] }, 500, 1400),
      f({ hip: [100, 140], t: 35, feet: [[124, 180], [118, 180]], hands: [[144, 112], [142, 114]] }, 400, 1100),
    ] },
    'db-rdl': { label: 'Dumbbell Romanian deadlift', props: [G].concat(DB2), frames: [
      f({ hip: [120, 96], t: 0, feet: [[122, 180], [118, 180]], hands: [[124, 103], [121, 103]] }, 500, 1600),
      f({ hip: [102, 101], t: 72, feet: [[122, 180], [118, 180]], hands: [[150, 142], [147, 142]] }, 400, 1200),
    ] },
    'pushup': { label: 'Push-up', props: [G], frames: [
      f({ plank: true, hip: [104.5, 143], t: 65.3, feet: [[28, 178], [30, 178]], hands: [[150, 180], [147, 180]] }, 500, 1400),
      f({ plank: true, hip: [111.6, 170], t: 84.4, headTilt: -10, feet: [[28, 178], [30, 178]], hands: [[150, 180], [147, 180]] }, 300, 1000),
    ] },
    'pushup-fe': { label: 'Feet-elevated push-up', props: [G, { type: 'box', x: 4, y: 150, w: 52, h: 30 }], frames: [
      f({ plank: true, hip: [116, 132], t: 78.8, feet: [[34, 148], [36, 148]], hands: [[166, 180], [163, 180]] }, 500, 1400),
      f({ plank: true, hip: [117, 159], t: 97.3, headTilt: -12, feet: [[34, 148], [36, 148]], hands: [[166, 180], [163, 180]] }, 300, 1000),
    ] },
    'lat-pulldown': { label: 'Lat pulldown', props: [G, { type: 'box', x: 88, y: 140, w: 44, h: 40 }, { type: 'grip' }], frames: [
      f({ hip: [110, 136], t: -8, feet: [[150, 180], [146, 180]], hands: [[108, 30], [104, 30]] }, 400, 1000),
      f({ hip: [110, 136], t: -10, feet: [[150, 180], [146, 180]], hands: [[112, 84], [108, 84]] }, 400, 1600),
    ] },
    'farmer-carry': { label: 'Farmer carry', props: [G].concat(DB2), frames: walk([[124, 104], [118, 104]], 0) },
    'suitcase-carry': { label: 'Suitcase carry', props: [G, { type: 'db', hand: 0 }], frames: walk([[124, 104], [116, 100]], 0) },
    'sandbag-carry': { label: 'Sandbag carry', props: [G, { type: 'bag' }], frames: walk([[134, 72], [132, 74]], -6, 420) },
    'big3': { label: 'Bird-dog', props: [G], frames: [
      f({ hip: [90, 138], t: 71.6, feet: [[48, 178], [50, 178]], hands: [[137, 180], [135, 180]] }, 500, 1100),
      f({ hip: [90, 138], t: 74, feet: [[48, 178], [8, 132]], hands: [[194, 112], [135, 180]] }, 1200, 1000),
    ] },
    'step-up': { label: 'Step-up', props: [G, { type: 'box', x: 132, y: 140, w: 72, h: 40 }], frames: [
      f({ hip: [116, 98], t: 8, feet: [[152, 140], [108, 180]], hands: [[124, 104], [118, 104]] }, 400, 700),
      f({ hip: [138, 70], t: 6, feet: [[152, 140], [126, 126]], hands: [[144, 76], [138, 76]] }, 0, 600),
      f({ hip: [150, 58], t: 0, feet: [[152, 140], [146, 140]], hands: [[152, 64], [148, 64]] }, 500, 600),
      f({ hip: [138, 70], t: 6, feet: [[152, 140], [126, 126]], hands: [[144, 76], [138, 76]] }, 0, 800),
    ] },
    'hip-thrust': { label: 'Hip thrust', props: [G, { type: 'box', x: 26, y: 132, w: 52, h: 48 }, { type: 'db', hand: 0 }], frames: [
      f({ hip: [100, 165], t: -39, feet: [[150, 180], [147, 180]], hands: [[100, 160], [98, 160]] }, 400, 1100),
      f({ hip: [112, 128], t: -90, feet: [[150, 180], [147, 180]], hands: [[112, 122], [110, 122]] }, 900, 1100),
    ] },
    'glute-bridge-sl': { label: 'Single-leg glute bridge', props: [G], frames: [
      f({ hip: [108, 174], t: -87.6, feet: [[146, 180], [170, 140]], hands: [[112, 178], [110, 178]] }, 400, 1000),
      f({ hip: [110, 140], t: -117.6, feet: [[146, 180], [186, 110]], hands: [[118, 180], [116, 180]] }, 900, 1000),
    ] },
    'glute-bridge': { label: 'Glute bridge', props: [G], frames: [
      f({ hip: [108, 174], t: -87.6, feet: [[146, 180], [150, 180]], hands: [[112, 178], [110, 178]] }, 400, 1000),
      f({ hip: [110, 140], t: -117.6, feet: [[146, 180], [150, 180]], hands: [[118, 180], [116, 180]] }, 900, 1000),
    ] },
    'db-bench': { label: 'Dumbbell bench press', props: [G, { type: 'box', x: 40, y: 132, w: 110, h: 12 }, { type: 'box', x: 90, y: 144, w: 10, h: 36 }].concat(DB2), frames: [
      f({ hip: [120, 126], t: -90, feet: [[156, 180], [152, 180]], hands: [[72, 70], [70, 70]] }, 400, 1500),
      f({ hip: [120, 126], t: -90, feet: [[156, 180], [152, 180]], hands: [[82, 112], [80, 112]] }, 300, 1000),
    ] },
    'db-row': { label: 'One-arm dumbbell row', props: [G, { type: 'box', x: 20, y: 140, w: 96, h: 12 }, { type: 'box', x: 60, y: 152, w: 10, h: 28 }, { type: 'db', hand: 0 }], frames: [
      f({ hip: [112, 100], t: -80, elbow: -1, feet: [[120, 180], [68, 138]], hands: [[64, 146], [60, 140]] }, 400, 900),
      f({ hip: [112, 100], t: -80, elbow: -1, feet: [[120, 180], [68, 138]], hands: [[94, 106], [60, 140]] }, 600, 1300),
    ] },
    'backpack-row': { label: 'Backpack row', props: [G, { type: 'pack' }], frames: [
      f({ hip: [108, 98], t: 50, feet: [[124, 180], [118, 180]], hands: [[148, 122], [146, 122]] }, 400, 900),
      f({ hip: [108, 98], t: 50, feet: [[124, 180], [118, 180]], hands: [[124, 96], [122, 96]] }, 600, 1300),
    ] },
    'inverted-row': { label: 'Inverted row', props: [G, { type: 'bar', x1: 120, x2: 200, y: 100 }], frames: [
      f({ plank: true, hip: [113, 164], t: 80.5, elbow: -1, feet: [[30, 178], [32, 178]], hands: [[160, 100], [157, 100]] }, 400, 1000),
      f({ plank: true, hip: [103, 137], t: 60.5, elbow: -1, feet: [[30, 178], [32, 178]], hands: [[160, 100], [157, 100]] }, 600, 1300),
    ] },
    'dead-hang': { label: 'Dead hang', view: HANG_VIEW, props: [HANG_BAR], frames: [
      f({ hip: [120, 102], t: 0, feet: [[112, 178], [110, 180]], hands: [[124, -6], [120, -6]] }, 900, 900),
      f({ hip: [120, 102], t: 0, feet: [[118, 172], [114, 176]], hands: [[124, -6], [120, -6]] }, 1500, 900),
    ] },
    'towel-hang': { label: 'Towel hang', view: '0 -60 240 260', props: [{ type: 'bar', x1: 80, x2: 160, y: -26 }, { type: 'strap', y: -26 }], frames: [
      f({ hip: [120, 112], t: 0, feet: [[112, 188], [110, 190]], hands: [[124, 4], [118, 4]] }, 900, 900),
      f({ hip: [120, 112], t: 0, feet: [[118, 182], [114, 186]], hands: [[124, 4], [118, 4]] }, 1500, 900),
    ] },
    'dead-bug': { label: 'Dead bug', props: [G], frames: [
      f({ hip: [130, 172], t: -90, feet: [[172, 130], [170, 132]], hands: [[80, 114], [82, 114]] }, 500, 1300),
      f({ hip: [130, 172], t: -90, feet: [[172, 130], [212, 164]], hands: [[26, 166], [82, 114]] }, 600, 1300),
    ] },
    'calf-raise': { label: 'Single-leg calf raise', props: [G, { type: 'box', x: 110, y: 160, w: 70, h: 20 }], frames: [
      f({ hip: [113, 80], t: 0, feet: [[110, 163], [106, 150]], hands: [[117, 87], [112, 87]] }, 300, 900),
      f({ hip: [116, 68], t: 0, feet: [[114, 160], [110, 140]], hands: [[120, 75], [115, 75]] }, 500, 2400),
    ] },
    'split-squat': { label: 'Split squat', props: [G], frames: [
      f({ hip: [118, 98], t: 0, feet: [[150, 180], [86, 176]], hands: [[120, 105], [116, 105]] }, 400, 1200),
      f({ hip: [116, 136], t: 4, feet: [[150, 180], [86, 176]], hands: [[121, 143], [117, 143]] }, 300, 1000),
    ] },
    'bss': { label: 'Bulgarian split squat', props: [G, { type: 'box', x: 34, y: 140, w: 48, h: 40 }].concat(DB2), frames: [
      f({ hip: [124, 96], t: 4, feet: [[158, 180], [70, 138]], hands: [[128, 104], [124, 104]] }, 400, 1200),
      f({ hip: [118, 134], t: 12, feet: [[158, 180], [70, 138]], hands: [[129, 140], [125, 140]] }, 300, 1000),
    ] },
    'sl-rdl': { label: 'Single-leg RDL', props: [G, { type: 'db', hand: 0 }], frames: [
      f({ hip: [120, 96], t: 0, feet: [[122, 180], [116, 178]], hands: [[124, 103], [119, 103]] }, 400, 1500),
      f({ hip: [112, 98], t: 82, feet: [[122, 180], [29, 110]], hands: [[160, 148], [157, 146]] }, 500, 1200),
    ] },
    'trap-deadlift': { label: 'Trap-bar deadlift', props: [G, { type: 'plate' }], frames: [
      f({ hip: [96, 128], t: 55, feet: [[122, 180], [118, 180]], hands: [[134, 158], [132, 158]] }, 500, 1200),
      f({ hip: [120, 96], t: 0, feet: [[122, 180], [118, 180]], hands: [[124, 103], [121, 103]] }, 500, 1300),
    ] },
    'kb-swing': { label: 'Kettlebell swing', props: [G, { type: 'kb' }], frames: [
      f({ hip: [98, 104], t: 70, feet: [[128, 180], [122, 180]], hands: [[118, 138], [116, 138]] }, 100, 450),
      f({ hip: [120, 96], t: -5, feet: [[128, 180], [122, 180]], hands: [[172, 54], [170, 54]] }, 200, 500),
    ] },
    'walking-lunge': { label: 'Walking lunge', props: [G].concat(DB2), frames: [
      f({ hip: [118, 98], t: 0, feet: [[150, 180], [86, 176]], hands: [[120, 105], [116, 105]] }, 100, 800),
      f({ hip: [116, 136], t: 4, feet: [[150, 180], [86, 176]], hands: [[121, 143], [117, 143]] }, 200, 800),
      f({ hip: [120, 96], t: 0, feet: [[124, 180], [118, 180]], hands: [[123, 103], [119, 103]] }, 100, 800),
      f({ hip: [118, 98], t: 0, feet: [[86, 176], [150, 180]], hands: [[120, 105], [116, 105]] }, 100, 800),
      f({ hip: [116, 136], t: 4, feet: [[86, 176], [150, 180]], hands: [[121, 143], [117, 143]] }, 200, 800),
      f({ hip: [120, 96], t: 0, feet: [[124, 180], [118, 180]], hands: [[123, 103], [119, 103]] }, 100, 800),
    ] },
    'reverse-lunge': { label: 'Reverse lunge', props: [G], frames: [
      f(stand, 400, 1000),
      f({ hip: [118, 136], t: 4, feet: [[82, 176], [150, 180]], hands: [[128, 130], [124, 130]] }, 300, 1000),
    ] },
    'half-kneel-press': { label: 'Half-kneeling dumbbell press', props: [G, { type: 'db', hand: 0 }], frames: [
      f({ hip: [112, 138], t: 0, feet: [[70, 180], [154, 180]], hands: [[124, 82], [116, 140]] }, 400, 1000),
      f({ hip: [112, 138], t: 0, feet: [[70, 180], [154, 180]], hands: [[114, 31], [116, 140]] }, 500, 1400),
    ] },
    'pike-pushup': { label: 'Pike push-up', props: [G], frames: [
      f({ hip: [100, 104], t: 126.9, feet: [[60, 180], [62, 180]], hands: [[150, 180], [147, 180]] }, 400, 1300),
      f({ hip: [108, 118], t: 140, feet: [[60, 180], [62, 180]], hands: [[150, 180], [147, 180]] }, 300, 1000),
    ] },
    'pullup': { label: 'Pull-up', view: HANG_VIEW, props: [HANG_BAR], frames: pullupFrames(1700, 1300) },
    'pullup-assist': { label: 'Assisted pull-up', view: HANG_VIEW, props: [HANG_BAR], frames: pullupFrames(1700, 1300) },
    'pullup-neg': { label: 'Pull-up negative', view: HANG_VIEW, props: [HANG_BAR], frames: [
      f({ hip: [117, 48], t: -2, headTilt: 6, feet: [[107, 124], [105, 126]], hands: [[124, -6], [120, -6]] }, 300, 5000),
      f({ hip: [120, 102], t: 0, feet: [[110, 178], [108, 180]], hands: [[124, -6], [120, -6]] }, 500, 500),
    ] },
    'towel-pullup': { label: 'Towel pull-up', view: '0 -60 240 260', props: [{ type: 'bar', x1: 80, x2: 160, y: -26 }, { type: 'strap', y: -26 }], frames: [
      f({ hip: [120, 112], t: 0, feet: [[110, 188], [108, 190]], hands: [[124, 4], [118, 4]] }, 600, 1300),
      f({ hip: [117, 60], t: -2, headTilt: 6, feet: [[107, 136], [105, 138]], hands: [[124, 4], [118, 4]] }, 500, 1700),
    ] },
    'hanging-knee-raise': { label: 'Hanging knee raise', view: HANG_VIEW, props: [HANG_BAR], frames: [
      f({ hip: [120, 102], t: 0, feet: [[116, 182], [114, 184]], hands: [[124, -6], [120, -6]] }, 400, 1000),
      f({ hip: [122, 98], t: -6, feet: [[160, 140], [158, 142]], hands: [[124, -6], [120, -6]] }, 400, 1400),
    ] },
    'rope-climb': { label: 'Rope climb', view: HANG_VIEW, props: [{ type: 'rope', x: 132 }], frames: [
      f({ hip: [124, 96], t: 4, feet: [[134, 120], [130, 124]], hands: [[132, -14], [131, 4]] }, 400, 1100),
      f({ hip: [126, 58], t: 4, feet: [[134, 120], [130, 124]], hands: [[132, -14], [131, 4]] }, 300, 900),
      f({ hip: [126, 58], t: 4, feet: [[134, 120], [130, 124]], hands: [[132, -30], [131, -14]] }, 300, 900),
    ] },
    'bar-traverse': { label: 'Monkey bars', view: HANG_VIEW, props: [{ type: 'rungs', y: -6, xs: [60, 120, 180] }], frames: [
      f({ hip: [116, 102], t: 0, feet: [[108, 178], [106, 180]], hands: [[122, -6], [118, -6]] }, 300, 900),
      f({ hip: [140, 100], t: 6, feet: [[118, 172], [116, 174]], hands: [[180, -6], [120, -6]] }, 500, 900),
    ] },
    'spear-throw': { label: 'Spear throw', props: [G, { type: 'spear', angle: -8 }], frames: [
      f({ hip: [110, 96], t: -8, feet: [[134, 180], [94, 180]], hands: [[94, 40], [150, 48]] }, 600, 350),
      f({ hip: [118, 96], t: 12, feet: [[134, 180], [94, 180]], hands: [[172, 36], [112, 112]] }, 700, 900),
    ] },
    'burpee': { label: 'Burpee', props: [G], frames: [
      f(stand, 200, 350),
      f({ hip: [112, 150], t: 55, feet: [[124, 180], [120, 180]], hands: [[150, 180], [147, 180]] }, 0, 300),
      f({ plank: true, hip: [104.5, 143], t: 65.3, feet: [[28, 178], [30, 178]], hands: [[150, 180], [147, 180]] }, 0, 350),
      f({ plank: true, hip: [111.6, 170], t: 84.4, headTilt: -10, feet: [[28, 178], [30, 178]], hands: [[150, 180], [147, 180]] }, 100, 350),
      f({ plank: true, hip: [104.5, 143], t: 65.3, feet: [[28, 178], [30, 178]], hands: [[150, 180], [147, 180]] }, 0, 300),
      f({ hip: [112, 150], t: 55, feet: [[124, 180], [120, 180]], hands: [[150, 180], [147, 180]] }, 0, 300),
      f({ hip: [120, 80], t: 0, feet: [[124, 164], [120, 164]], hands: [[124, -26], [120, -26]] }, 100, 300),
    ] },
    'run': { label: 'Run', props: [G], frames: [
      f({ hip: [120, 94], t: 10, feet: [[148, 178], [92, 170]], hands: [[112, 92], [150, 70]] }, 0, 200),
      f({ hip: [120, 90], t: 10, feet: [[124, 180], [104, 140]], hands: [[136, 92], [132, 92]] }, 0, 200),
      f({ hip: [120, 94], t: 10, feet: [[92, 170], [148, 178]], hands: [[150, 70], [112, 92]] }, 0, 200),
      f({ hip: [120, 90], t: 10, feet: [[104, 140], [124, 180]], hands: [[132, 92], [136, 92]] }, 0, 200),
    ] },
    'hike': { label: 'Long climb', props: [{ type: 'mountain' }, G], frames: walk([[136, 98], [110, 100]], 14, 520) },

    // ---- mobility. Floor stretches pin their knees; the two that only read
    // from above (open books, supine twist) use TOP: no ground, head left.
    'air-squat': { label: 'Bodyweight squat', props: [G], frames: [
      f(stand, 400, 1100),
      f({ hip: [100, 140], t: 35, feet: [[124, 180], [118, 180]], hands: [[178, 104], [176, 106]] }, 400, 1000),
    ] },
    'leg-swing': { label: 'Leg swings', props: [G], frames: [
      f({ hip: [130, 96], t: -4, feet: [[204, 140], [128, 180]], hands: [[140, 98], [136, 98]] }, 0, 550),
      f({ hip: [130, 96], t: 8, feet: [[60, 146], [128, 180]], hands: [[140, 98], [136, 98]] }, 0, 550),
    ] },
    'cat-cow': { label: 'Cat-cow', props: [G], frames: [
      f({ hip: [90, 134], t: 76, headTilt: -38, feet: [[48, 178], [50, 178]], hands: [[137, 180], [135, 180]] }, 700, 1500),
      f({ hip: [92, 140], t: 70, headTilt: 48, feet: [[48, 178], [50, 178]], hands: [[137, 180], [135, 180]] }, 700, 1500),
    ] },
    'couch-stretch': { label: 'Couch stretch', props: [G, { type: 'box', x: 14, y: 128, w: 48, h: 52 }], frames: [
      f({ hip: [88, 140], t: -4, knees: [null, [70, 178]], feet: [[150, 180], [66, 136]], hands: [[124, 132], [122, 134]] }, 1200, 1400),
      f({ hip: [94, 142], t: -10, knees: [null, [72, 178]], feet: [[150, 180], [66, 136]], hands: [[128, 134], [126, 136]] }, 2000, 1400),
    ] },
    'worlds-greatest': { label: "World's greatest stretch", props: [G], frames: [
      f({ hip: [112, 134], t: 76, feet: [[168, 180], [56, 176]], hands: [[146, 178], [144, 178]] }, 600, 1200),
      f({ hip: [112, 132], t: 66, headTilt: -30, feet: [[168, 180], [56, 176]], hands: [[160, 52], [148, 176]] }, 1200, 1200),
    ] },
    '90-90': { label: '90/90 hip switches', props: [G], frames: [
      f({ hip: [110, 172], t: -8, knees: [[150, 168], [72, 168]], feet: [[132, 178], [90, 178]], hands: [[84, 176], [82, 176]] }, 700, 900),
      f({ hip: [110, 172], t: -8, feet: [[156, 178], [150, 178]], hands: [[84, 176], [82, 176]] }, 0, 900),
      f({ hip: [110, 172], t: -8, knees: [[72, 168], [150, 168]], feet: [[90, 178], [132, 178]], hands: [[84, 176], [82, 176]] }, 700, 900),
      f({ hip: [110, 172], t: -8, feet: [[156, 178], [150, 178]], hands: [[84, 176], [82, 176]] }, 0, 900),
    ] },
    'hamstring-floss': { label: 'Hamstring floss', props: [G, { type: 'band' }], frames: [
      f({ hip: [130, 172], t: -90, feet: [[172, 104], [214, 176]], hands: [[120, 130], [118, 132]] }, 300, 900),
      f({ hip: [130, 172], t: -90, feet: [[138, 90], [214, 176]], hands: [[112, 126], [110, 128]] }, 300, 900),
    ] },
    'open-books': { label: 'Open books (from above)', view: TOP, props: [], frames: [
      f({ hip: [130, 150], t: -90, knees: [[130, 108], [134, 110]], feet: [[172, 108], [174, 110]], hands: [[80, 92], [84, 93]] }, 500, 900),
      f({ hip: [130, 150], t: -90, knees: [[130, 108], [134, 110]], feet: [[172, 108], [174, 110]], hands: [[22, 150], [84, 93]] }, 0, 900),
      f({ hip: [130, 150], t: -90, headTilt: 40, knees: [[130, 108], [134, 110]], feet: [[172, 108], [174, 110]], hands: [[80, 208], [84, 93]] }, 1600, 900),
      f({ hip: [130, 150], t: -90, knees: [[130, 108], [134, 110]], feet: [[172, 108], [174, 110]], hands: [[22, 150], [84, 93]] }, 0, 900),
    ] },
    'childs-pose': { label: "Child's pose", props: [G], frames: [
      f({ hip: [74, 152], t: 102, headTilt: 10, feet: [[64, 178], [66, 178]], hands: [[180, 176], [178, 176]] }, 1500, 1600),
      f({ hip: [78, 148], t: 98, headTilt: 10, feet: [[64, 178], [66, 178]], hands: [[180, 176], [178, 176]] }, 1500, 1600),
    ] },
    'calf-stretch': { label: 'Calf stretch', props: [G, { type: 'box', x: 194, y: 20, w: 14, h: 160 }], frames: [
      f({ hip: [110, 106], t: 30, feet: [[140, 180], [70, 180]], hands: [[192, 62], [190, 64]] }, 1800, 1200),
      f({ hip: [106, 118], t: 36, feet: [[140, 180], [70, 180]], hands: [[192, 76], [190, 78]] }, 1800, 1200),
    ] },
    'foot-roll': { label: 'Foot roll', props: [G, { type: 'box', x: 56, y: 132, w: 52, h: 48 }, { type: 'ball' }], frames: [
      f({ hip: [92, 128], t: -2, feet: [[132, 166], [150, 180]], hands: [[128, 124], [132, 126]] }, 0, 1100),
      f({ hip: [92, 128], t: -2, feet: [[160, 166], [150, 180]], hands: [[128, 124], [132, 126]] }, 0, 1100),
    ] },
    'deep-squat': { label: 'Deep squat hold', props: [G, { type: 'box', x: 166, y: 60, w: 7, h: 120 }], frames: [
      f({ hip: [104, 152], t: 22, feet: [[124, 180], [120, 180]], hands: [[166, 116], [166, 112]] }, 1800, 1500),
      f({ hip: [102, 148], t: 26, feet: [[124, 180], [120, 180]], hands: [[166, 116], [166, 112]] }, 1800, 1500),
    ] },
    'pigeon': { label: 'Pigeon', props: [G], frames: [
      f({ hip: [104, 164], t: 0, knees: [[144, 174], null], feet: [[104, 178], [20, 176]], hands: [[112, 172], [110, 172]] }, 1200, 1800),
      f({ hip: [104, 166], t: 74, headTilt: 10, knees: [[144, 174], null], feet: [[104, 178], [20, 176]], hands: [[188, 178], [186, 178]] }, 2200, 1800),
    ] },
    'frog': { label: 'Frog', props: [G], frames: [
      f({ hip: [96, 140], t: 80, feet: [[60, 178], [62, 178]], hands: [[172, 178], [170, 178]] }, 600, 1800),
      f({ hip: [80, 150], t: 84, feet: [[60, 178], [62, 178]], hands: [[172, 178], [170, 178]] }, 1200, 1800),
    ] },
    'thread-needle': { label: 'Thread the needle', props: [G], frames: [
      f({ hip: [90, 138], t: 70, headTilt: -20, feet: [[48, 178], [50, 178]], hands: [[137, 64], [135, 180]] }, 600, 1300),
      f({ hip: [92, 140], t: 86, headTilt: 30, feet: [[48, 178], [50, 178]], hands: [[96, 170], [135, 180]] }, 1200, 1300),
    ] },
    'doorway-pec': { label: 'Doorway pec stretch', props: [G, { type: 'box', x: 60, y: 0, w: 8, h: 180 }], frames: [
      f({ hip: [110, 98], t: 0, elbow: -1, feet: [[150, 180], [104, 180]], hands: [[70, 50], [114, 104]] }, 600, 1500),
      f({ hip: [122, 98], t: 6, feet: [[150, 180], [104, 180]], hands: [[70, 50], [128, 104]] }, 2000, 1500),
    ] },
    'supine-twist': { label: 'Supine twist (from above)', view: TOP, props: [], frames: [
      f({ hip: [130, 150], t: -90, knees: [[132, 192], [128, 190]], feet: [[174, 194], [170, 192]], hands: [[80, 92], [80, 208]] }, 1800, 1000),
      f({ hip: [130, 150], t: -90, knees: [[170, 150], [168, 148]], feet: [[210, 152], [208, 150]], hands: [[80, 92], [80, 208]] }, 0, 1000),
      f({ hip: [130, 150], t: -90, knees: [[132, 108], [128, 110]], feet: [[174, 106], [170, 108]], hands: [[80, 92], [80, 208]] }, 1800, 1000),
      f({ hip: [130, 150], t: -90, knees: [[170, 150], [168, 148]], feet: [[210, 152], [208, 150]], hands: [[80, 92], [80, 208]] }, 0, 1000),
    ] },
    'legs-up-wall': { label: 'Legs up the wall', props: [G, { type: 'box', x: 180, y: 40, w: 14, h: 140 }], frames: [
      f({ hip: [172, 172], t: -90, feet: [[172, 88], [174, 89]], hands: [[120, 178], [118, 178]] }, 2000, 2000),
      f({ hip: [172, 172], t: -90, headTilt: -6, feet: [[172, 88], [174, 89]], hands: [[120, 178], [118, 178]] }, 2000, 2000),
    ] },
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = moves; } else { root.MOVES = moves; }
})(typeof window !== 'undefined' ? window : this);
