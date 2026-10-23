/**
 * plan.js — the Spartan Super 2027 training plan, as data.
 *
 * One source of truth: the app (index.html) and the review page both render
 * this object. Week 1 starts Monday 26 Oct 2026; week 43 ends on race day,
 * Sunday 22 Aug 2027.
 *
 * Shape:
 *   race, start, rules[]
 *   phases[]      — id, name, weeks [from, to], min/target sessions, focus
 *   warmup[]      — done before every session
 *   exercises{}   — key → { name, how }
 *   sessions{}    — key → { name, kind, minutes, gym[], hotel[] }
 *                   a block is { ex, sets, reps, rest (s), note }
 *                   kind 'run' / 'hike' sessions take their dose from the week
 *   weeks[]       — n, phase, sessions[], min, run, hike, gtg{}, flags, note
 *   gtg, mobility, benchmarks[], obstacles[], fuel[], gear[]
 */
(function () {
  'use strict';

  const race = {
    name: 'Spartan Super',
    place: 'Snowbasin Resort, Huntsville UT',
    date: '2027-08-22',
    distance: '10 km',
    obstacles: 25,
    terrain: 'Alpine single-track, steep climbs and descents on Mount Ogden',
    goal: 'Finish every obstacle. No burpee penalties.',
  };

  const rules = [
    'Count sessions, not hours. Hit the week\'s minimum and the streak holds. Hit the target and you are ahead.',
    'The week is a queue. Do the sessions on any day, in any order. Two on one day is fine if one of them is the long climb.',
    'Every session has a hotel version. Travel changes the session, never whether it happens.',
    'Easy means you could hold a conversation. Most running should feel almost too easy.',
    'Run time rises about 10% a week at most. Your plantar fascia sets the speed limit, not your lungs.',
    'Strength uses double progression: when every set hits the top of the rep range with clean form, add weight next time.',
    'Leave 1–2 reps in the tank on strength sets. Grinding to failure is not the goal.',
    'Back first: brace before every lift, hinge from the hips, and do the McGill big 3 every strength day.',
    'Mobility and grease-the-groove reps happen every day, but they do not count as sessions.',
    'Pain that is sharp, or that changes how you move, ends the set. Mild soreness is fine.',
    'Deload weeks are planned. Do them. That is when the fitness actually lands.',
  ];

  const phases = [
    { id: 'p0', name: 'Foundation', weeks: [1, 9], min: 3, target: 4,
      goal: 'Build the habit and the base. Learn the movements. Prove you can show up three times a week.',
      focus: ['Baseline test in week 1', 'Run/walk intervals', 'Full-body strength twice a week', 'A weekly long walk that becomes a climb', 'Hangs and pull-up negatives every day'] },
    { id: 'p1', name: 'Base', weeks: [10, 20], min: 3, target: 4,
      goal: 'Run 30+ minutes without stopping. Get stronger in the legs, back and grip.',
      focus: ['Continuous easy runs (treadmill when it snows)', 'Lower and upper strength days', 'Heavy carries', 'Incline hikes with a pack'] },
    { id: 'p2', name: 'Strength & Hills', weeks: [21, 32], min: 3, target: 4,
      goal: 'Turn strength into climbing and obstacle skills.',
      focus: ['Trail runs and hill repeats', 'Weekly long climbs to 2,500 ft', 'Rope, rig and monkey-bar practice', 'Sandbag and bucket carries', 'Spear throws'] },
    { id: 'p3', name: 'Race-Specific', weeks: [33, 40], min: 4, target: 5,
      goal: 'Rehearse the race: run, hit an obstacle, keep moving.',
      focus: ['Obstacle circuits', 'Tempo and long hill repeats', 'Snowbasin recon hike', '10k dress rehearsal'] },
    { id: 'tp', name: 'Taper', weeks: [41, 43], min: 3, target: 4,
      goal: 'Arrive fresh. Keep the intensity, drop the volume.',
      focus: ['Shorter sessions, same sharpness', 'Gear and logistics locked in', 'Sleep'] },
  ];

  const warmup = [
    { name: 'Easy cardio', dose: '3 min', how: 'Bike, incline walk or brisk walk. Just get warm.' },
    { name: 'Leg swings', move: 'leg-swing', dose: '10 each way, each leg', how: 'Front-to-back, then side-to-side, holding a wall.' },
    { name: 'World\'s greatest stretch', move: 'worlds-greatest', dose: '3 per side', how: 'Lunge, elbow to instep, rotate the arm to the ceiling.' },
    { name: 'Glute bridge', move: 'glute-bridge', dose: '10', how: 'Squeeze glutes at the top, ribs down.' },
    { name: 'Bird-dog', move: 'big3', dose: '5 per side', how: 'Slow, hips level.' },
    { name: 'Bodyweight squat', move: 'air-squat', dose: '10', how: 'Full depth you can control.' },
    { name: 'Scap pull-ups', move: 'dead-hang', dose: '5', how: 'Hang, then pull the shoulders down without bending the elbows.' },
  ];

  // Coaching card per exercise: equip (what to grab, which machine), setup,
  // cues (what to focus on during the set), mistake (the one to avoid).
  const X = function (name, equip, setup, cues, mistake) {
    return { name: name, equip: equip, setup: setup, cues: cues, mistake: mistake, how: setup + ' ' + cues.join('. ') + '.' };
  };

  const exercises = {
    'goblet-squat': X('Goblet squat', 'One dumbbell or kettlebell. Start around 25–35 lb.',
      'Hold the dumbbell upright against your chest, hands cupping the top end. Feet shoulder-width, toes turned out a little.',
      ['Sit down between your heels, not back onto a chair', 'Chest tall, weight glued to your chest', 'Knees track out over your toes', 'Push the floor away and squeeze your glutes at the top'],
      'Heels lifting or knees caving in. Only go as deep as you can with heels down.'),
    'db-rdl': X('Dumbbell Romanian deadlift', 'Two dumbbells. Start around 20–30 lb each.',
      'Stand tall with the dumbbells in front of your thighs, knees soft.',
      ['Push your hips back like you are closing a car door with your butt', 'Dumbbells slide down your thighs, close to your legs', 'Flat back, proud chest', 'Feel the hamstring stretch, then squeeze your glutes to stand'],
      'Rounding your back to reach lower. Stop at mid-shin or wherever your back starts to round. This is the move that protects your back on carries.'),
    'pushup': X('Push-up', 'Floor. A bench or box if you need to raise your hands.',
      'Hands just outside shoulder-width, under your shoulders. Glutes and abs tight so your body is one straight line.',
      ['Lower as one plank, hips and chest together', 'Elbows about 45° from your sides', 'Chest to fist height', 'Push the floor away'],
      'Hips sagging. If they sag, put your hands on a bench and do them perfectly.'),
    'pushup-fe': X('Feet-elevated push-up', 'A chair, bench or hotel bed for your feet.',
      'Feet up on the chair, hands on the floor under your shoulders.',
      ['Same straight line as a push-up', 'Elbows about 45°', 'Chest to the floor, not your face'],
      'Piking your hips up to make it easier.'),
    'lat-pulldown': X('Lat pulldown', 'Lat pulldown machine with the long straight bar. Set the thigh pad so your legs are locked in.',
      'Overhand grip just outside your shoulders. Sit tall.',
      ['Pull your shoulders down first, then your elbows', 'Bar to your upper chest', 'Drive your elbows toward your back pockets', 'Let it back up over 2 seconds'],
      'Leaning way back and yanking with momentum. Stay nearly upright.'),
    'farmer-carry': X('Farmer carry', 'Two heavy dumbbells or kettlebells. Start around 35–50 lb each.',
      'Pick them up like a deadlift, flat back. Shoulders back and down.',
      ['Stand tall, ribs down', 'Crush the handles', 'Short, quick steps', 'Set them down with a flat back too'],
      'Leaning or shrugging. Go lighter and keep perfect posture.'),
    'suitcase-carry': X('Suitcase carry', 'One heavy dumbbell or kettlebell. On the road, your suitcase.',
      'Weight in one hand, the other arm relaxed.',
      ['Do not lean toward or away from the weight', 'Brace like someone is about to poke your side', 'Walk slow and tall', 'Switch hands every set'],
      'Tilting. If you lean, it is too heavy.'),
    'big3': X('McGill big 3', 'A mat or any floor.',
      'Three moves in order: curl-up, side plank, bird-dog. Built by a spine researcher for exactly the desk back you have.',
      ['Curl-up: one knee bent, hands under your low back, lift head and shoulders an inch, hold 10 s × 5', 'Side plank: knees or feet, hips high, 15–30 s × 3 per side', 'Bird-dog: opposite arm and leg straight out, hips level, hold 10 s × 5 per side', 'Breathe normally the whole time'],
      'Turning the curl-up into a crunch. It is a tiny lift with a neutral spine.'),
    'step-up': X('Step-up', 'A box or bench about knee height. Hold dumbbells once bodyweight is easy.',
      'Whole foot on the box, not just the toes.',
      ['Drive through the heel of the top foot', 'Stand all the way up, hips through', 'The bottom foot is just along for the ride', 'Lower slowly'],
      'Bouncing off the bottom foot. The top leg does all the work.'),
    'hip-thrust': X('Hip thrust', 'Flat bench plus a dumbbell on your hips, or a barbell with a pad. Use the hip-thrust machine if the gym has one.',
      'Upper back on the edge of the bench, feet flat, shins vertical at the top.',
      ['Chin tucked, ribs down', 'Drive your hips up until your body is a tabletop', 'Squeeze your glutes hard for one second', 'Lower under control'],
      'Arching your low back to get higher. Stop at flat.'),
    'glute-bridge-sl': X('Single-leg glute bridge', 'Floor.',
      'On your back, one foot planted, the other knee pulled in or leg straight.',
      ['Push through the planted heel', 'Hips stay level', 'Pause at the top'],
      'The free-leg side of the hips dropping.'),
    'db-bench': X('Dumbbell bench press', 'Flat bench and two dumbbells.',
      'Sit with the dumbbells on your thighs, lie back and kick them up. Pinch your shoulder blades together.',
      ['Lower to the sides of your chest', 'Elbows about 45° from your body', 'Press up and slightly together', 'Feet planted'],
      'Flaring your elbows straight out to the sides. It is hard on the shoulders.'),
    'db-row': X('One-arm dumbbell row', 'Flat bench and one dumbbell.',
      'Same-side knee and hand on the bench, back flat like a table.',
      ['Pull the dumbbell to your hip pocket', 'Elbow close to your side', 'Squeeze the shoulder blade at the top', 'Lower slowly'],
      'Twisting your torso to heave it up.'),
    'backpack-row': X('Backpack row', 'Backpack loaded with books or water bottles.',
      'Hinge forward about 45°, back flat, knees soft, backpack hanging from both hands.',
      ['Row it to your belly button', 'Squeeze your shoulder blades', 'Torso stays still'],
      'Standing up as you row.'),
    'inverted-row': X('Inverted row', 'Smith machine bar or a barbell in a rack at waist height. In a hotel, a sturdy table edge.',
      'Lie under the bar, grab it, heels on the floor, body straight.',
      ['Pull your chest to the bar', 'Body moves as one plank', 'Squeeze your shoulder blades at the top'],
      'Hips sagging. Bend your knees to make it easier instead.'),
    'dead-hang': X('Dead hang', 'Pull-up bar.',
      'Overhand grip, thumbs wrapped around the bar.',
      ['Pull your shoulders slightly down from your ears', 'Squeeze the bar hard', 'Breathe slowly', 'Drop about 5 s before your grip gives out'],
      'Hanging fully limp on your shoulder joints. Stay slightly engaged.'),
    'towel-hang': X('Towel hang', 'Pull-up bar and two thick towels.',
      'Drape the towels over the bar and grab each one vertically, like a rope.',
      ['Crush grip', 'Shoulders engaged', 'Same slow breathing as a dead hang'],
      'Thin towels that slip. Use thick gym towels.'),
    'towel-wring': X('Towel wring', 'A towel and a sink.',
      'Soak a towel and hold it out in front of you with both hands.',
      ['Wring it as hard as you can one way', 'Then the other way', 'Keep squeezing the whole time'],
      'Going easy. It should burn your forearms.'),
    'pallof': X('Pallof press', 'Cable station with a single D-handle, pulley at chest height. Or a band around a post.',
      'Stand side-on to the machine, handle at your breastbone, feet shoulder-width.',
      ['Press straight out', 'Hold 2 s. The cable is trying to twist you, do not let it', 'Bring it back in slowly'],
      'Rotating toward the machine. Step closer for less tension.'),
    'dead-bug': X('Dead bug', 'Floor.',
      'On your back, arms pointing at the ceiling, knees bent 90° above your hips.',
      ['Low back pressed into the floor', 'Lower the opposite arm and leg slowly', 'Breathe out as you reach', 'Return and switch'],
      'Low back arching off the floor. Shorten the reach until it stays down.'),
    'side-plank': X('Side plank', 'Floor.',
      'On your forearm, elbow under your shoulder, knees or feet stacked.',
      ['Straight line from head to feet', 'Hips high', 'Breathe'],
      'Hips drooping toward the floor.'),
    'calf-raise': X('Single-leg calf raise', 'A step or a weight plate. Hold a rail for balance.',
      'Ball of one foot on the edge, heel hanging off.',
      ['Rise up for 1 s', 'Lower for 3 s', 'Full stretch at the bottom', 'Straight knee'],
      'Bouncing. The slow lowering is what helps the plantar fascia.'),
    'split-squat': X('Split squat', 'Floor. Dumbbells when bodyweight is easy.',
      'Long stance, back heel up, feet hip-width apart like train tracks.',
      ['Drop your back knee straight down', 'Front shin roughly vertical', 'Drive up through the front heel'],
      'Feet on a tightrope. Keep them hip-width for balance.'),
    'bss': X('Bulgarian split squat', 'Flat bench. Dumbbells when bodyweight is easy.',
      'Back foot laces-down on the bench, front foot about two feet in front.',
      ['Drop your back knee straight down', 'Front heel stays planted', 'A slight forward lean is fine', 'Drive up through the front foot'],
      'Front foot too close, so the heel lifts. Scoot it forward.'),
    'sl-rdl': X('Single-leg RDL', 'Dumbbell, kettlebell or a backpack. Hold a wall for balance at first.',
      'Stand on one leg with a soft knee, weight in the opposite hand.',
      ['Hinge forward as the free leg reaches straight back', 'Hips stay square to the floor', 'Flat back', 'Squeeze the standing glute to come up'],
      'Opening your hips toward the ceiling.'),
    'trap-deadlift': X('Trap-bar deadlift', 'Hex (trap) bar, the diamond-shaped one, usually near the platforms. No trap bar? Do heavy dumbbell RDLs instead.',
      'Step into the middle, feet hip-width, grab the handles.',
      ['Hips back, flat back, chest up', 'Big breath and brace before you pull', 'Push the floor away', 'Stand tall, then lower the same way'],
      'Hips shooting up first so your back does the lifting. It is half squat, half hinge.'),
    'kb-swing': X('Kettlebell swing', 'Kettlebell. Start around 35 lb.',
      'Bell a foot in front of you. Hinge, grab it, and hike it back between your legs.',
      ['A hinge, not a squat', 'Snap your hips forward and squeeze your glutes', 'The bell floats to chest height. Arms are just ropes', 'Let it fall back and hinge to catch it'],
      'Lifting with your arms or squatting it up.'),
    'walking-lunge': X('Walking lunge', 'Two dumbbells and some open floor or turf.',
      'Dumbbells at your sides, stand tall.',
      ['Long step forward', 'Back knee lightly touches the floor', 'Drive through the front heel into the next step', 'Torso upright'],
      'Short steps that drive the front knee far past the toes.'),
    'reverse-lunge': X('Reverse lunge', 'Floor. Dumbbells optional.',
      'Stand tall, feet hip-width.',
      ['Step back', 'Drop the back knee', 'Drive through the front heel to return'],
      'Wobbling. Slow down and use a wall.'),
    'sandbag-carry': X('Sandbag / bucket carry', 'A 60 lb sandbag (often near the turf) or a 5-gallon bucket of gravel. On the road, a loaded backpack hugged to your chest.',
      'Lift it to your chest and bear-hug it high, elbows tight.',
      ['Hug it high and tight', 'Lean back slightly, short steps', 'Breathe in short bursts', 'Do not set it down mid-carry. On race day that is a penalty'],
      'Letting it slide down to your belly. Re-hug it high.'),
    'half-kneel-press': X('Half-kneeling dumbbell press', 'One dumbbell and a pad for your knee.',
      'One knee down. Squeeze the glute on the kneeling side.',
      ['Press straight up', 'Ribs down, no arching', 'Biceps by your ear at the top'],
      'Leaning back to press. That is your low back doing the work.'),
    'pike-pushup': X('Pike push-up', 'Floor.',
      'Hands and feet on the floor, hips high like an upside-down V.',
      ['Head goes down between your hands', 'Elbows track back, not out', 'Press back up'],
      'Turning it into a regular push-up by dropping the hips.'),
    'pullup': X('Pull-up', 'Pull-up bar.',
      'Overhand grip just outside your shoulders, start from a dead hang.',
      ['Pull your shoulders down first', 'Drive your elbows to your ribs', 'Chin over the bar', 'Lower for 2 s'],
      'Half reps or kicking. A clean rep beats three ugly ones.'),
    'pullup-assist': X('Assisted pull-up', 'Assisted pull-up machine: kneel on the pad, more weight means more help. Or a loop band on the bar under one foot.',
      'Same grip as a pull-up, full hang at the bottom.',
      ['Full range every rep', 'Pull your shoulders down first', 'Use a little less help every week'],
      'Using so much help it becomes easy. The last 2 reps should be hard.'),
    'pullup-neg': X('Pull-up negative', 'Pull-up bar and a chair or box.',
      'Step or jump up so your chin is over the bar.',
      ['Lower yourself over 5 slow seconds', 'Stay tight the whole way', 'Step back up and repeat'],
      'Dropping the bottom half. Fight it all the way down.'),
    'hanging-knee-raise': X('Hanging knee raise', 'Pull-up bar or a captain\'s chair.',
      'Dead hang, shoulders engaged.',
      ['Bring your knees to your chest', 'Curl your hips up at the top', 'Lower slowly, no swinging'],
      'Swinging to cheat the reps up.'),
    'rope-climb': X('Rope climb (J-hook)', 'Climbing rope, usually in the turf or functional area. None? Do towel pull-ups instead.',
      'Grab high, pull your knees up and let the rope run down the outside of your lead leg.',
      ['Rope goes under your lead foot', 'Step down on it with the other foot to lock it', 'Stand up with your legs, then reach higher', 'Come down hand under hand. Never slide'],
      'Climbing with arms only. Your legs should do most of the work.'),
    'towel-pullup': X('Towel pull-up', 'Pull-up bar and two thick towels.',
      'Drape the towels over the bar and grip them vertically.',
      ['Same as a pull-up, crushing the towels', 'Shoulders down first', 'Go for quality, not reps'],
      'Thin towels that slip.'),
    'bar-traverse': X('Monkey bars / rig traverse', 'Gym rig, monkey bars or a playground set.',
      'Hang from the first bar with both hands.',
      ['Swing gently from your hips', 'Reach on the forward swing', 'Arms slightly bent, shoulders engaged', 'Look at the next bar, not the ground'],
      'Dead-arm hanging and muscling each reach. Use the swing.'),
    'spear-throw': X('Spear throw', 'A practice spear or a weighted broomstick, and a hay bale or cardboard target.',
      'Stand side-on to the target, about 20–30 ft away. Spear by your ear, point slightly up.',
      ['Step toward the target with your front foot', 'Throw through the target, not at it', 'Release with the point slightly up', 'Same routine every throw'],
      'Throwing too hard. Smooth beats strong.'),
    'burpee': X('Burpee (Spartan standard)', 'Floor.',
      'Stand tall.',
      ['Hands down, jump your feet back', 'Chest touches the ground', 'Jump your feet in', 'Jump with your hands overhead'],
      'Going so fast you die halfway. Pick a pace you can hold for 30.'),
    'run': X('Run', 'Running shoes. Treadmill at 1% incline or a flat route.',
      'Dose for this week is on the session.',
      ['Easy means you could hold a conversation', 'Short quick steps, land under your hips', 'Relaxed shoulders and hands', 'Walk breaks are part of the plan, not failure'],
      'Running the easy runs too fast. Slow down.'),
    'hike': X('Long climb', 'See the options on the session.',
      'Dose for this week is on the session.',
      ['Short steps on steep grades', 'Hands on thighs to power-hike the steepest bits', 'Drink every 20 min, eat every 45 on long ones'],
      'Starting too fast. You should finish feeling like you had more.'),
    'mobility-long': X('Long mobility routine', 'A mat.', 'See the Mobility section.', ['Slow, easy breathing'], 'Rushing it.'),
    'race': X('Race', 'Race kit.', 'Sunday 22 August 2027.', ['Every obstacle'], 'Going out too fast on the first climb.'),
  };

  // Session blocks: { ex, sets, reps, rest, note }. rest in seconds.
  const B = function (ex, sets, reps, rest, note) { return { ex: ex, sets: sets, reps: reps, rest: rest || 0, note: note || '' }; };

  const sessions = {
    // ---------- Phase 0 · Foundation ----------
    'p0-A': { name: 'Strength A · Full body', kind: 'strength', minutes: 45,
      gym: [B('goblet-squat', 3, '10', 90), B('db-rdl', 3, '10', 90, 'Light. Learn the hinge before you load it.'), B('pushup', 3, 'AMRAP −2', 60), B('lat-pulldown', 3, '10', 60), B('farmer-carry', 3, '40 m', 60), B('big3', 1, 'circuit', 0)],
      hotel: [B('split-squat', 3, '10 / leg', 60), B('sl-rdl', 3, '10 / leg', 60, 'Hold your backpack.'), B('pushup', 3, 'AMRAP −2', 60), B('backpack-row', 3, '12', 60), B('suitcase-carry', 3, '40 m / hand', 45, 'Your suitcase, down the hallway.'), B('big3', 1, 'circuit', 0)] },
    'p0-B': { name: 'Run / walk + core', kind: 'run', minutes: 40,
      gym: [B('run', 1, 'week', 0, '5 min brisk walk first, 5 min walk after.'), B('calf-raise', 2, '15 / leg', 45), B('dead-bug', 2, '8 / side', 45)],
      hotel: [B('run', 1, 'week', 0, 'Hotel treadmill at 1% or outside.'), B('calf-raise', 2, '15 / leg', 45, 'On a stair.'), B('dead-bug', 2, '8 / side', 45)] },
    'p0-C': { name: 'Strength B · Full body', kind: 'strength', minutes: 45,
      gym: [B('step-up', 3, '8 / leg', 60), B('hip-thrust', 3, '12', 75), B('db-bench', 3, '10', 75), B('db-row', 3, '10 / arm', 60), B('dead-hang', 3, 'max −5 s', 60), B('pallof', 3, '10 / side', 45), B('dead-bug', 2, '8 / side', 30)],
      hotel: [B('step-up', 3, '12 / leg', 45, 'Chair or stairwell.'), B('glute-bridge-sl', 3, '12 / leg', 45), B('pushup-fe', 3, 'AMRAP −2', 60), B('backpack-row', 3, '12', 60), B('towel-wring', 3, '30 s', 30), B('side-plank', 3, '30 s / side', 30), B('dead-bug', 2, '8 / side', 30)] },
    'p0-D': { name: 'Long walk / climb', kind: 'hike', minutes: 60,
      gym: [B('hike', 1, 'week', 0, 'Pick any climb option. Bonneville Shoreline Trail out of Farmington or Layton when you can.')],
      hotel: [B('hike', 1, 'week', 0, 'Hotel treadmill on an incline, or the stairwell.')] },

    // ---------- Phase 1 · Base ----------
    'p1-A': { name: 'Lower + core', kind: 'strength', minutes: 50,
      gym: [B('trap-deadlift', 3, '8', 120, 'From week 15: 4 × 6, heavier.'), B('bss', 3, '8 / leg', 90), B('step-up', 3, '10 / leg', 60, 'Hold dumbbells.'), B('calf-raise', 3, '12 / leg', 45), B('farmer-carry', 4, '40 m', 60, 'Heavy.'), B('big3', 1, 'circuit', 0)],
      hotel: [B('bss', 3, '12 / leg', 60, 'Back foot on the bed.'), B('sl-rdl', 3, '12 / leg', 60), B('step-up', 3, '15 / leg', 45), B('calf-raise', 3, '15 / leg', 45), B('suitcase-carry', 4, '40 m / hand', 45), B('big3', 1, 'circuit', 0)] },
    'p1-B': { name: 'Easy run', kind: 'run', minutes: 45,
      gym: [B('run', 1, 'week', 0, 'Conversational pace. Incline treadmill (1–2%) when the roads are icy.'), B('calf-raise', 2, '15 / leg', 45)],
      hotel: [B('run', 1, 'week', 0), B('calf-raise', 2, '15 / leg', 45)] },
    'p1-C': { name: 'Upper + grip', kind: 'strength', minutes: 50,
      gym: [B('pullup-assist', 4, '5–8', 90, 'Use less assistance each week. Add 2 negatives at the end.'), B('db-bench', 3, '8–10', 90), B('db-row', 3, '10 / arm', 60), B('half-kneel-press', 3, '8 / side', 60), B('towel-hang', 3, 'max −5 s', 60), B('side-plank', 3, '30 s / side', 30)],
      hotel: [B('pullup-neg', 4, '3', 90, 'Door-frame bar if you packed one, else inverted rows under a table.'), B('pushup', 4, 'AMRAP −2', 60), B('backpack-row', 3, '15', 60), B('pike-pushup', 3, '8', 60), B('towel-wring', 3, '30 s', 30), B('side-plank', 3, '30 s / side', 30)] },
    'p1-D': { name: 'Long climb', kind: 'hike', minutes: 75,
      gym: [B('hike', 1, 'week', 0, 'Winter: the incline treadmill or stair climber is the default. Trail when it is clear.')],
      hotel: [B('hike', 1, 'week', 0, 'Hotel treadmill on an incline, or the stairwell.')] },

    // ---------- Phase 2 · Strength & Hills ----------
    'p2-A': { name: 'Lower power + carries', kind: 'strength', minutes: 55,
      gym: [B('trap-deadlift', 4, '5', 150), B('kb-swing', 4, '12', 60), B('walking-lunge', 3, '10 / leg', 75), B('sandbag-carry', 4, '50 m', 75), B('calf-raise', 3, '15 / leg', 45), B('big3', 1, 'circuit', 0)],
      hotel: [B('reverse-lunge', 4, '12 / leg', 60), B('sl-rdl', 3, '12 / leg', 60), B('step-up', 3, '20 / leg', 45, 'Stairwell, fast up, slow down.'), B('sandbag-carry', 4, '1 flight of stairs', 60, 'Bear-hug your loaded backpack.'), B('calf-raise', 3, '20 / leg', 45), B('big3', 1, 'circuit', 0)] },
    'p2-B': { name: 'Hill run', kind: 'run', minutes: 50,
      gym: [B('run', 1, 'week', 0, 'Trail when dry. Treadmill at 6–10% for hill repeats.'), B('calf-raise', 2, '15 / leg', 45)],
      hotel: [B('run', 1, 'week', 0, 'Find a hill, a parking ramp, or the treadmill incline button.')] },
    'p2-C': { name: 'Upper + obstacle skills', kind: 'strength', minutes: 55,
      gym: [B('pullup', 5, 'max −2', 120, 'Band only for the last set if needed.'), B('rope-climb', 5, '1 climb', 90, 'No rope at the gym? Swap for towel pull-ups 3 × 3.'), B('hanging-knee-raise', 3, '10', 60), B('half-kneel-press', 3, '8 / side', 60), B('inverted-row', 3, '10', 60), B('bar-traverse', 4, '1 length', 90, 'Gym rig or a playground set.'), B('towel-hang', 2, 'max', 60)],
      hotel: [B('pushup', 5, 'AMRAP −2', 60), B('pike-pushup', 3, '10', 60), B('inverted-row', 4, '10', 60, 'Under a sturdy table.'), B('dead-hang', 3, 'max', 60, 'Only if you find a bar.'), B('towel-wring', 3, '30 s', 30), B('burpee', 3, '10', 60)] },
    'p2-D': { name: 'Long climb', kind: 'hike', minutes: 120,
      gym: [B('hike', 1, 'week', 0, 'Get outside at least every other week from here. Run the flats and downhills easy, power-hike the steeps.'), B('spear-throw', 1, '20 throws', 0, 'After, if you have a spear.')],
      hotel: [B('hike', 1, 'week', 0, 'Longest hill or stair climb you can find. 60+ min.')] },
    'p2-E': { name: 'OCR conditioning (bonus)', kind: 'ocr', minutes: 35, optional: true,
      gym: [B('run', 5, '400 m', 0, '5 rounds, 2 min rest between rounds:'), B('burpee', 5, '10', 0), B('sandbag-carry', 5, '50 m', 0), B('dead-hang', 5, '30 s', 120)],
      hotel: [B('run', 5, '3 min', 0, '5 rounds, 2 min rest:'), B('burpee', 5, '10', 0), B('suitcase-carry', 5, '1 hallway', 0), B('side-plank', 5, '30 s', 120)] },

    // ---------- Phase 3 · Race-Specific ----------
    'p3-A': { name: 'Strength maintenance', kind: 'strength', minutes: 45,
      gym: [B('trap-deadlift', 3, '5', 150), B('pullup', 4, 'max −1', 120), B('bss', 3, '8 / leg', 75), B('pushup', 3, 'max −3', 60), B('farmer-carry', 3, '60 m', 75, 'Heaviest yet.'), B('big3', 1, 'circuit', 0)],
      hotel: [B('bss', 4, '15 / leg', 60), B('pushup', 4, 'max −3', 60), B('inverted-row', 4, '12', 60), B('sl-rdl', 3, '12 / leg', 45), B('burpee', 3, '15', 60), B('big3', 1, 'circuit', 0)] },
    'p3-B': { name: 'Hill repeats / tempo', kind: 'run', minutes: 50,
      gym: [B('run', 1, 'week', 0), B('calf-raise', 2, '15 / leg', 45)],
      hotel: [B('run', 1, 'week', 0)] },
    'p3-C': { name: 'Obstacle circuit', kind: 'ocr', minutes: 55,
      gym: [B('run', 5, '800 m', 0, '5 rounds. Treadmill at 5% between stations:'), B('bar-traverse', 1, 'Round 1: rig or 3 pull-ups + 20 s hang', 0), B('sandbag-carry', 1, 'Round 2: 100 m', 0), B('rope-climb', 1, 'Round 3: 1 climb (or 3 towel pull-ups)', 0), B('spear-throw', 1, 'Round 4: 3 throws, 10 burpees per miss', 0), B('farmer-carry', 1, 'Round 5: 100 m', 0), B('burpee', 1, '30 for time', 0, 'Finish. Log the time.')],
      hotel: [B('run', 5, '4 min', 0, '5 rounds, 4 min run or stairs between:'), B('pushup', 5, '15', 0), B('reverse-lunge', 5, '10 / leg', 0), B('burpee', 5, '10', 0), B('burpee', 1, '30 for time', 0, 'Finish. Log the time.')] },
    'p3-D': { name: 'Long trail effort', kind: 'hike', minutes: 150,
      gym: [B('hike', 1, 'week', 0, 'Race practice: run what you can, power-hike the steep stuff, eat something every 45 min.')],
      hotel: [B('hike', 1, 'week', 0, 'Longest climb available, 75+ min.')] },
    'p3-E': { name: 'Easy run + long mobility', kind: 'run', minutes: 55,
      gym: [B('run', 1, '30–35 min easy', 0), B('mobility-long', 1, 'routine', 0, 'The long mobility routine right after.')],
      hotel: [B('run', 1, '30 min easy', 0), B('mobility-long', 1, 'routine', 0)] },

    // ---------- Taper ----------
    'tp-A': { name: 'Strength · light', kind: 'strength', minutes: 35,
      gym: [B('trap-deadlift', 2, '5', 150, 'Same weight as last month, crisp.'), B('pullup', 3, 'max −2', 120), B('bss', 2, '8 / leg', 75), B('farmer-carry', 2, '60 m', 75), B('big3', 1, 'circuit', 0)],
      hotel: [B('bss', 3, '12 / leg', 60), B('pushup', 3, 'max −3', 60), B('inverted-row', 3, '10', 60), B('big3', 1, 'circuit', 0)] },
    'tp-B': { name: 'Sharpen run', kind: 'run', minutes: 40,
      gym: [B('run', 1, 'week', 0)], hotel: [B('run', 1, 'week', 0)] },
    'tp-C': { name: 'Obstacle tune-up', kind: 'ocr', minutes: 35,
      gym: [B('bar-traverse', 3, '1 length', 120), B('rope-climb', 3, '1 climb', 120), B('spear-throw', 1, '15 throws', 0), B('sandbag-carry', 2, '50 m', 90), B('burpee', 1, '30, steady', 0)],
      hotel: [B('pushup', 3, '15', 60), B('burpee', 2, '15', 90), B('reverse-lunge', 3, '10 / leg', 60)] },
    'tp-D': { name: 'Trail shakeout', kind: 'hike', minutes: 75,
      gym: [B('hike', 1, 'week', 0)], hotel: [B('hike', 1, 'week', 0)] },
    'rw-1': { name: 'Race-week primer', kind: 'strength', minutes: 20,
      gym: [B('goblet-squat', 2, '8', 60, 'Light. Wake the legs up, nothing more.'), B('pullup', 2, '3', 90), B('dead-hang', 2, '30 s', 60), B('big3', 1, 'circuit', 0)],
      hotel: [B('split-squat', 2, '8 / leg', 60), B('pushup', 2, '10', 60), B('big3', 1, 'circuit', 0)] },
    'rw-2': { name: 'Shakeout run', kind: 'run', minutes: 25,
      gym: [B('run', 1, 'week', 0)], hotel: [B('run', 1, 'week', 0)] },
    'race': { name: 'RACE · Spartan Super', kind: 'race', minutes: 180,
      gym: [B('race', 1, '10 km · 25 obstacles', 0, 'Start easy. Walk the steep climbs. Chalk-free hands, dry grip before the rig. Every obstacle.')],
      hotel: [B('race', 1, '10 km · 25 obstacles', 0)] },
  };

  // Week rows: [n, phase, sessions, min, run, hike, gtg[push, pull, hangSec, squat, burpee], flags, note]
  // gtg values are DAILY totals, spread across the workday.
  const P0 = ['p0-A', 'p0-B', 'p0-C', 'p0-D'];
  const P1 = ['p1-A', 'p1-B', 'p1-C', 'p1-D'];
  const P2 = ['p2-A', 'p2-B', 'p2-C', 'p2-D', 'p2-E'];
  const P3 = ['p3-A', 'p3-B', 'p3-C', 'p3-D', 'p3-E'];
  const TP = ['tp-A', 'tp-B', 'tp-C', 'tp-D'];

  const rows = [
    [1,  'p0', P0, 3, '8 × (1 min jog + 2 min walk)',        'Walk 45 min, any terrain. Note your pace.',            [15, 3, 45, 30, 5],   'test', 'Baseline test this week (Benchmarks tab). Buy a doorway pull-up bar and a set of loop bands.'],
    [2,  'p0', P0, 3, '8 × (1:30 jog + 1:30 walk)',          'Walk 50 min with at least one real hill.',              [20, 4, 60, 30, 5],   '', ''],
    [3,  'p0', P0, 3, '7 × (2 min jog + 1:30 walk)',         'Hike 55 min on the foothills (Farmington or Layton).',  [25, 5, 75, 40, 6],   '', 'Film one set of RDLs from the side. Flat back, hips back.'],
    [4,  'p0', P0, 3, '6 × (3 min jog + 1:30 walk)',         'Hike 60 min, about 600 ft of climbing.',                [30, 6, 90, 40, 7],   '', ''],
    [5,  'p0', P0, 2, '5 × (2 min jog + 2 min walk)',        'Thanksgiving walk, 45 min.',                            [20, 4, 60, 30, 5],   'light', 'Thanksgiving week. Two sessions keeps the streak.'],
    [6,  'p0', P0, 3, '5 × (4 min jog + 1 min walk)',        'Hike 65 min, about 700 ft.',                            [35, 7, 100, 50, 8],  '', ''],
    [7,  'p0', P0, 3, '4 × (5 min jog + 1 min walk)',        'Hike 70 min, about 800 ft.',                            [40, 8, 110, 50, 9],  '', ''],
    [8,  'p0', P0, 3, '3 × (7 min jog + 1 min walk)',        'Hike 75 min, about 900 ft. Microspikes if it is icy.',  [40, 9, 120, 50, 10], '', 'Last week of Foundation.'],
    [9,  'p0', P0, 2, '3 × (6 min jog + 1 min walk)',        'Easy walk or hike, 45–60 min.',                         [25, 5, 75, 30, 5],   'deload test', 'Christmas deload. Retest benchmarks any day this week.'],
    [10, 'p1', P1, 3, '2 × (10 min jog + 1 min walk)',       'Hike or incline treadmill 60 min, about 1,000 ft.',     [45, 10, 120, 50, 10], '', 'Base phase. Four sessions is the target now.'],
    [11, 'p1', P1, 3, '2 × (12 min jog + 1 min walk)',       '65 min, about 1,000 ft.',                               [50, 11, 130, 50, 11], '', ''],
    [12, 'p1', P1, 3, '20 min continuous easy jog',          '70 min, about 1,100 ft.',                               [50, 12, 140, 60, 12], '', 'First continuous run. Slow is correct.'],
    [13, 'p1', P1, 3, '22 min easy',                         '75 min, about 1,200 ft.',                               [55, 13, 150, 60, 12], '', ''],
    [14, 'p1', P1, 3, '18 min easy',                         '50 min easy.',                                          [30, 8, 90, 40, 8],    'deload test', 'Deload and retest.'],
    [15, 'p1', P1, 3, '25 min easy',                         '75 min, about 1,300 ft, 10 lb pack.',                   [60, 14, 150, 60, 13], '', 'Deadlift moves to 4 × 6.'],
    [16, 'p1', P1, 3, '27 min easy',                         '80 min, about 1,400 ft, 10 lb pack.',                   [60, 15, 160, 60, 14], '', ''],
    [17, 'p1', P1, 3, '30 min easy',                         '85 min, about 1,500 ft, 15 lb pack.',                   [65, 16, 170, 60, 15], '', ''],
    [18, 'p1', P1, 3, '30 min easy + 4 × 20 s strides',      '90 min, about 1,600 ft, 15 lb pack.',                   [70, 17, 180, 60, 15], '', ''],
    [19, 'p1', P1, 3, '33 min easy + 4 strides',             '90 min, about 1,700 ft, 15 lb pack.',                   [70, 18, 180, 60, 16], '', ''],
    [20, 'p1', P1, 3, '25 min easy',                         '60 min easy.',                                          [40, 10, 120, 40, 10], 'deload test', 'Deload and retest. Base done.'],
    [21, 'p2', P2, 3, 'Easy 30 min, trail if dry, + 4 uphill strides', 'Trail 4 mi, about 1,200 ft. Jog the flats.',  [75, 20, 180, 50, 18], '', 'Strength & Hills. Find monkey bars and a rope. Get or make a practice spear.'],
    [22, 'p2', P2, 3, 'Hill repeats: 6 × 60 s hard uphill, walk down', '4.5 mi, about 1,400 ft, 15 lb pack.',         [75, 21, 190, 50, 18], '', ''],
    [23, 'p2', P2, 3, 'Easy 35 min on trail',                '5 mi, about 1,500 ft.',                                 [80, 22, 200, 50, 19], '', ''],
    [24, 'p2', P2, 3, 'Hill repeats: 7 × 75 s',              '5 mi, about 1,600 ft. Practice easy downhill running.', [80, 23, 200, 50, 19], '', ''],
    [25, 'p2', P2, 3, 'Easy 38 min on trail',                '5.5 mi, about 1,800 ft, 20 lb pack.',                   [85, 24, 210, 50, 20], '', ''],
    [26, 'p2', P2, 3, 'Easy 25 min',                         '3–4 mi easy.',                                          [50, 14, 120, 30, 12], 'deload test', 'Deload and retest.'],
    [27, 'p2', P2, 3, 'Hill repeats: 8 × 75 s',              '6 mi, about 1,900 ft.',                                 [85, 25, 210, 50, 20], '', 'Buy trail shoes this week: aggressive lugs, drains water. Break them in on easy runs.'],
    [28, 'p2', P2, 3, 'Easy 40 min on trail (new shoes)',    '6 mi, about 2,000 ft.',                                 [90, 26, 220, 50, 21], '', ''],
    [29, 'p2', P2, 3, 'Hill repeats: 8 × 90 s',              '6.5 mi, about 2,200 ft.',                               [90, 27, 220, 50, 22], '', ''],
    [30, 'p2', P2, 3, 'Easy 42 min on trail',                '7 mi, about 2,300 ft. 20 lb pack up, run down easy.',   [95, 28, 230, 50, 23], '', ''],
    [31, 'p2', P2, 3, 'Hill repeats: 10 × 90 s',             '7.5 mi, about 2,500 ft.',                               [95, 30, 240, 50, 24], '', ''],
    [32, 'p2', P2, 3, 'Easy 30 min',                         '4 mi easy.',                                            [60, 16, 150, 30, 15], 'deload test', 'Deload and retest.'],
    [33, 'p3', P3, 4, 'Tempo: 10 min easy, 15 min comfortably hard, 5 min easy', '10k on trail with about 2,000 ft. Run what you can, power-hike the steeps.', [100, 30, 240, 50, 25], '', 'Race-Specific. Five sessions is the target.'],
    [34, 'p3', P3, 4, 'Hill repeats: 10 × 90 s',             '7 mi, about 2,500 ft.',                                 [100, 32, 240, 50, 25], '', ''],
    [35, 'p3', P3, 4, 'Tempo: 10 easy / 20 hard / 5 easy',   '7.5 mi, about 2,700 ft.',                               [100, 33, 250, 50, 26], '', ''],
    [36, 'p3', P3, 4, 'Hill repeats: 6 × 3 min',             '8 mi, about 2,800 ft.',                                 [105, 34, 250, 50, 27], '', ''],
    [37, 'p3', P3, 3, 'Easy 30 min + 4 strides',             '5 mi easy.',                                            [60, 18, 150, 30, 15], 'deload test', 'Fourth of July week. Deload and retest.'],
    [38, 'p3', P3, 4, 'Tempo: 10 easy / 25 hard / 5 easy',   'Snowbasin recon: 6–8 mi on the resort trails, 2,500–3,000 ft. Notice the descents.', [105, 35, 260, 50, 28], 'recon', 'Snowbasin recon hike. Worth getting outside for this one.'],
    [39, 'p3', P3, 4, 'Hill repeats: 6 × 3 min',             'Dress rehearsal: 10k trail in race shoes and kit, about 2,500 ft, then 30 burpees.', [110, 36, 260, 50, 30], 'rehearsal', 'Dress rehearsal. Test what you will eat and wear.'],
    [40, 'p3', P3, 4, 'Tempo: 10 easy / 20 hard / 5 easy',   '8 mi, about 3,000 ft. The last big one.',               [110, 36, 270, 50, 30], '', ''],
    [41, 'tp', TP, 3, 'Hill repeats: 5 × 2 min',             '6 mi, about 1,800 ft.',                                 [70, 24, 180, 30, 20], 'taper', 'Taper. Volume drops, intensity stays. Final gear check.'],
    [42, 'tp', TP, 3, 'Easy 30 min + 6 strides',             '4 mi, about 1,000 ft, easy.',                           [50, 16, 120, 20, 15], 'taper', 'Last obstacle tune-up early in the week.'],
    [43, 'tp', ['rw-1', 'rw-2', 'race'], 3, 'Shakeout: 20 min easy + 4 strides (Wednesday or Thursday)', 'Rest Saturday. Race Sunday.', [20, 6, 60, 0, 0], 'race', 'Race week. Primer Monday or Tuesday, shakeout midweek, rest Saturday, race Sunday 22 August.'],
  ];


  // Long-climb targets per week: [minutes on a trail, feet of climbing].
  // Indoor options convert these (see climbOptions) and cap at 75 minutes.
  const CLIMB = [null,
    [45, 200], [50, 300], [55, 500], [60, 600], [45, 300], [65, 700], [70, 800], [75, 900], [50, 300],
    [60, 1000], [65, 1000], [70, 1100], [75, 1200], [50, 500], [75, 1300], [80, 1400], [85, 1500], [90, 1600], [90, 1700], [60, 700],
    [90, 1200], [100, 1400], [110, 1500], [110, 1600], [120, 1800], [70, 800], [130, 1900], [130, 2000], [140, 2200], [150, 2300], [160, 2500], [80, 900],
    [120, 2000], [150, 2500], [160, 2700], [170, 2800], [100, 1200], [180, 2800], [150, 2500], [180, 3000],
    [130, 1800], [90, 1000], [0, 0]];

  const start = '2026-10-26';
  const addDays = function (iso, d) {
    const t = new Date(iso + 'T12:00:00');
    t.setDate(t.getDate() + d);
    return t.toISOString().slice(0, 10);
  };

  const weeks = rows.map(function (r) {
    const flags = r[7] ? r[7].split(' ') : [];
    return {
      n: r[0], phase: r[1], sessions: r[2], min: r[3],
      target: r[2].filter(function (k) { return !sessions[k].optional; }).length,
      run: r[4], hike: r[5],
      climb: { minutes: CLIMB[r[0]][0], feet: CLIMB[r[0]][1] },
      gtg: { pushups: r[6][0], pullups: r[6][1], hang: r[6][2], squats: r[6][3], burpees: r[6][4] },
      deload: flags.indexOf('deload') >= 0 || flags.indexOf('light') >= 0,
      test: flags.indexOf('test') >= 0,
      flags: flags,
      note: r[8],
      starts: addDays(start, (r[0] - 1) * 7),
      ends: addDays(start, (r[0] - 1) * 7 + 6),
    };
  });


  // Ways to do the long climb. dose(week) turns the week's target into this option.
  // Treadmill at 12% and 3 mph climbs ~32 ft a minute; a stair climber ~30.
  const indoor = function (w, ftPerMin) {
    return Math.max(30, Math.min(75, Math.round(w.climb.feet / ftPerMin / 5) * 5));
  };
  const climbOptions = [
    { key: 'trail', name: 'Trail hike', where: 'Outside',
      dose: function (w) { return w.hike; } },
    { key: 'treadmill', name: 'Incline treadmill', where: 'Gym',
      dose: function (w) { return indoor(w, 32) + ' min at ' + (w.climb.feet < 800 ? '5–8%' : '10–15%') + ' incline, 2.5–3.3 mph, no holding the rails.'; } },
    { key: 'stairs', name: 'Stair climber', where: 'Gym',
      dose: function (w) { return indoor(w, 30) + ' min at a pace you can breathe through (most people sit at level 6–8). Light hands on the rails.'; } },
    { key: 'stairwell', name: 'Stairwell', where: 'Hotel or office',
      dose: function (w) { return indoor(w, 25) + ' min of continuous up-and-down. Walk up briskly, come down easy.'; } },
    { key: 'bike', name: 'Bike (foot flare-up day)', where: 'Gym',
      dose: function (w) { const m = Math.max(30, Math.min(75, w.climb.minutes)); return m + ' min: steady, with 5 × 3 min hard efforts in the middle. Use this when your plantar fascia is angry.'; } },
  ];

  const gtg = {
    items: [
      { key: 'pushups', ex: 'pushup', name: 'Push-ups', unit: 'reps', step: [5, 10] },
      { key: 'pullups', ex: 'pullup', name: 'Pull-ups', unit: 'reps', step: [1, 2], how: 'Can\'t do a full one yet? Negatives count rep for rep.' },
      { key: 'hang', ex: 'dead-hang',    name: 'Dead hang', unit: 'sec', step: [15, 30] },
      { key: 'squats', move: 'air-squat', demo: 'Feet shoulder-width, toes out a little. Sit down between your heels, chest tall, heels down, then stand and squeeze your glutes.',  name: 'Squats', unit: 'reps', step: [10, 20] },
      { key: 'burpees', ex: 'burpee', name: 'Burpees', unit: 'reps', step: [5, 10] },
    ],
    rules: [
      'Spread the day\'s total across the workday: a set every time you stand up from the desk.',
      'Each set is about half of what you could do. Never to failure.',
      'Wait at least 15 minutes between sets of the same thing.',
      'Pair every set with 30 s of the couch stretch. Your back will thank you.',
    ],
  };

  const mobility = {
    daily: [
      { name: 'Cat-cow', move: 'cat-cow', dose: '10 slow', how: 'On hands and knees, round and arch the whole spine.' },
      { name: 'Couch stretch', move: 'couch-stretch', dose: '60 s / side', how: 'Back knee against a wall or couch, front foot forward, squeeze the back glute. The single best stretch for desk hips.' },
      { name: 'World\'s greatest stretch', move: 'worlds-greatest', dose: '5 / side', how: 'Lunge, elbow to instep, rotate the arm up.' },
      { name: '90/90 hip switches', move: '90-90', dose: '10 total', how: 'Seated, both knees bent at 90°, rotate side to side.' },
      { name: 'Hamstring floss', move: 'hamstring-floss', dose: '45 s / side', how: 'On your back, strap or towel around the foot, leg straight up.' },
      { name: 'Open books', move: 'open-books', dose: '8 / side', how: 'On your side, knees bent, rotate the top arm open to the floor behind you.' },
      { name: 'Child\'s pose side reach', move: 'childs-pose', dose: '45 s', how: 'Walk the hands to each side to stretch the lats.' },
      { name: 'Calf stretch', move: 'calf-stretch', dose: '45 s / side, ×2', how: 'Against a wall, once with the knee straight, once bent.' },
      { name: 'Foot roll', move: 'foot-roll', dose: '60 s / foot', how: 'Roll the arch over a lacrosse or golf ball. Plantar fascia care.' },
    ],
    long: [
      { name: 'Daily routine', dose: '12 min', how: 'Everything above.' },
      { name: 'Deep squat hold', move: 'deep-squat', dose: '3 × 45 s', how: 'Hold a post, heels down, chest up.' },
      { name: 'Pigeon', move: 'pigeon', dose: '90 s / side', how: 'Front shin across, hips square, fold forward.' },
      { name: 'Frog', move: 'frog', dose: '90 s', how: 'Knees wide, rock hips back slowly.' },
      { name: 'Thread the needle', move: 'thread-needle', dose: '6 / side', how: 'T-spine rotation on hands and knees.' },
      { name: 'Doorway pec stretch', move: 'doorway-pec', dose: '45 s / side', how: 'Undo the desk hunch.' },
      { name: 'Supine twist', move: 'supine-twist', dose: '60 s / side', how: 'Knees to one side, shoulders flat.' },
      { name: 'Legs up the wall', move: 'legs-up-wall', dose: '3 min', how: 'Breathe slowly through the nose. Recovery, not stretching.' },
    ],
  };

  const benchmarks = [
    { key: 'pushups', name: 'Max push-ups',         unit: 'reps', better: 'higher', baseline: 15,  target: 30,  how: 'Strict, chest to fist height, no rest at the top.' },
    { key: 'pullups', name: 'Max strict pull-ups',  unit: 'reps', better: 'higher', baseline: 2,   target: 8,   how: 'Dead hang to chin over bar, no kipping.' },
    { key: 'hang',    name: 'Max dead hang',        unit: 'sec',  better: 'higher', baseline: null, target: 90, how: 'Overhand, one attempt, fresh.' },
    { key: 'mile',    name: '1-mile run',           unit: 'min',  better: 'lower',  baseline: null, target: 10, how: 'Treadmill at 1% or a flat route. Walking is allowed.' },
    { key: 'burpees', name: '30 burpees',           unit: 'min',  better: 'lower',  baseline: null, target: 3,  how: 'Spartan standard, for time. The penalty you are training to never pay.' },
    { key: 'carry',   name: 'Farmer carry 2 × 50 lb', unit: 'm',  better: 'higher', baseline: null, target: 150, how: 'Unbroken distance before you drop them.' },
    { key: 'weight',  name: 'Body weight',          unit: 'lb',   better: 'lower',  baseline: 185, target: null, how: 'Same scale, first thing in the morning.' },
  ];

  // Course varies year to year and Spartan publishes the map close to the race.
  const obstacles = [
    { group: 'Grip & hang', names: 'Multi-rig, monkey bars, Twister, Beater, Olympus, Z-wall', trains: 'Dead hangs and pull-ups every day, towel hangs, bar traverses, hanging knee raises.' },
    { group: 'Pull', names: 'Rope climb, Hercules hoist, plate drag', trains: 'Pull-ups, rows, J-hook rope technique, deadlifts.' },
    { group: 'Carry', names: 'Bucket brigade, sandbag carry, Atlas carry', trains: 'Farmer, suitcase and sandbag carries; deadlifts; the weighted long climbs.' },
    { group: 'Climb', names: '6–8 ft walls, inverted wall, A-frame cargo, Stairway to Sparta, slip wall', trains: 'Pull-ups, step-ups, push strength, hip mobility.' },
    { group: 'Crawl', names: 'Barbed wire crawl', trains: 'Core work, burpees, hip mobility. Roll on your side when the ground allows.' },
    { group: 'Skill', names: 'Spear throw', trains: '20 practice throws a week from phase 2. The most-failed obstacle, so it is cheap points.' },
    { group: 'The mountain', names: 'The climbs and descents between obstacles', trains: 'Long climbs, hill repeats, calf raises, downhill practice.' },
  ];

  const fuel = [
    { title: 'Protein', points: ['About 150 g a day. That is roughly 30–40 g at each of four meals or snacks.', 'Easy wins: Greek yogurt, eggs, chicken, lean beef, cottage cheese, a protein shake.', 'This is what turns training into muscle and keeps you full while losing fat.'] },
    { title: 'Before the mid-morning session', points: ['60–90 min before: something with carbs and a bit of protein. Oatmeal with a scoop of protein, toast and eggs, a yogurt and fruit.', 'Short on time: a banana 20–30 min before is enough.', 'Coffee is fine.'] },
    { title: 'After', points: ['30–40 g protein within about 2 hours, plus carbs if it was a hard or long session.', 'Lunch right after a 9–10:30 session covers it.'] },
    { title: 'Fat loss, without a diet', points: ['Aim for 0.5–1 lb a week. Faster costs muscle and makes training miserable.', 'Protein first at every meal, then vegetables, then the rest.', 'Liquid calories (soda, juice, fancy coffee) are the easiest thing to cut.'] },
    { title: 'Water and electrolytes', points: ['Roughly half your body weight in ounces a day, more on training days.', 'Electrolytes (LMNT, Liquid IV or salt in water) on sessions over an hour, hot days and anything up high.', 'Snowbasin sits at 6,400–9,000 ft. You will lose more water up there than you notice.'] },
    { title: 'Long sessions and race day', points: ['Over 90 min: 30–60 g of carbs per hour (gels, chews, a PB&J).', 'Practice race-day food on the long climbs. Nothing new on race day.', 'Race morning: a normal breakfast 2–3 hours before, then a small snack 30 min before the start.'] },
    { title: 'Sleep', points: ['7–9 hours. It is when the training turns into fitness.'] },
  ];

  const gear = [
    { item: 'Doorway pull-up bar', when: 'Week 1', why: 'Daily pull-ups and hangs at your desk.' },
    { item: 'Loop resistance bands (set)', when: 'Week 1', why: 'Assisted pull-ups at home and in hotels. They pack flat.' },
    { item: 'Lacrosse ball', when: 'Week 1', why: 'Foot rolling for plantar fasciitis, glutes and back.' },
    { item: 'Microspikes', when: 'November', why: 'Winter traction on the Bonneville Shoreline Trail.' },
    { item: 'Small hiking pack (15–20 lb load)', when: 'Week 15', why: 'Weighted long climbs.' },
    { item: 'Sandbag (filler bags to 60 lb) or a 5-gallon bucket', when: 'Week 21', why: 'Bucket brigade and sandbag carry practice.' },
    { item: 'Practice spear (or a weighted PVC one)', when: 'Week 21', why: 'The most-failed obstacle.' },
    { item: 'Trail shoes with aggressive lugs that drain water', when: 'Week 27', why: 'Mud and steep descents. Break them in for 2+ months.' },
    { item: 'Hydration vest or soft flasks', when: 'Week 30', why: 'Long climbs and race day.' },
  ];

  window.PLAN = {
    race: race, start: start, rules: rules, phases: phases, warmup: warmup,
    exercises: exercises, sessions: sessions, weeks: weeks, gtg: gtg,
    mobility: mobility, benchmarks: benchmarks, obstacles: obstacles,
    fuel: fuel, gear: gear, climbOptions: climbOptions,
  };
})();
