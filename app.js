/* ============================================================
   APP.JS — Alfred 1.0 Core Logic
   Navigation · Data · Trackers · UI
   ============================================================ */

/* ============================================================
   DATA LAYER
   ============================================================ */
const AlfredData = (() => {
  const KEY = 'alfred_v1';

  const DEFAULT = {
    settings: { raceDate: null, currentPhase: 1, setupDone: false, pmpExamDate: null },
    character: { name: '', career: '', class: '', age: null, height: null, weight: null, hobbies: '', chaScore: 10, backstory: '', setupDone: false },
    training: {
      completedSessions: [],
      stationPBs: { skierg: null, sledPush: null, sledPull: null, burpeeJumps: null, rowing: null, farmersCarry: null, sandbagLunges: null, wallBalls: null },
      runLogs: [],
    },
    studies: {
      pmp: { completedChapters: [], completedLessons: [], mockScores: [], lastStudyDate: null, studyStreak: 0 },
      po:  { completedTopics: [], weeklyBuildLog: {}, currentWeek: 1, buildEntries: [] },
    },
    chat: { history: [] },
  };

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      const stored = JSON.parse(raw);
      // Deep merge to handle new fields
      return deepMerge(JSON.parse(JSON.stringify(DEFAULT)), stored);
    } catch { return JSON.parse(JSON.stringify(DEFAULT)); }
  }

  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) { console.warn('Save failed', e); }
  }

  function update(fn) {
    const d = get();
    fn(d);
    save(d);
    return d;
  }

  function reset() { localStorage.removeItem(KEY); }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  return { get, save, update, reset };
})();

window.AlfredData = AlfredData;

/* ============================================================
   STATIC CONTENT
   ============================================================ */
const PHASES = [
  { num: 1, name: 'Foundation', full: 'Foundation & Activation', months: 'June · Weeks 1–4',
    color: 'var(--phase1)',
    focus: 'Build your movement vocabulary. Establish Pilates habits, introduce running base, and get your body working as a system. No rushing — this phase prevents every injury that could derail you later.',
    days: {
      Monday: { activity: 'Pilates Intro', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'Diaphragmatic Breathing', detail: '3 min continuous', tag: 'warm-up' },
          { name: 'Cat-Cow', detail: '2 × 10 slow reps' },
          { name: 'Dead Bug', detail: '3 × 10 each side' },
          { name: 'Bird Dog', detail: '3 × 10 each side' },
          { name: 'Glute Bridge Hold', detail: '3 × 10 (2 sec hold at top)' },
          { name: 'Single Leg Stretch', detail: '2 × 10 each side' },
          { name: 'Spine Stretch Forward', detail: '2 × 8 reps' },
        ]},
      Tuesday: { activity: 'Easy Run 20–30min', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Walk Warm-Up', detail: '5 min', tag: 'warm-up' },
          { name: 'Zone 2 Easy Run', detail: '20–30 min at conversational pace', tag: 'main' },
          { name: 'Pace Target', detail: '~6:45–7:30/km — should hold a full conversation' },
          { name: 'Cool-Down Walk', detail: '5 min', tag: 'cool-down' },
          { name: 'Calf + Hip Flexor Stretch', detail: '2 min each side', tag: 'cool-down' },
        ]},
      Wednesday: { activity: 'Bodyweight Strength', type: 'strength', codexLink: 'hyrox',
        exercises: [
          { name: 'Bodyweight Squat', detail: '3 × 12 reps' },
          { name: 'Push-Up', detail: '3 × 8–10 reps (knee option OK)' },
          { name: 'Romanian Deadlift', detail: '3 × 12 (bodyweight, hinge focus)' },
          { name: 'Reverse Lunge', detail: '3 × 10 each leg' },
          { name: 'Bent-Over Row', detail: '3 × 12 (light DB or band)' },
          { name: 'Plank Hold', detail: '3 × 30 sec' },
        ]},
      Thursday: { activity: 'Pilates Core', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'The Hundred', detail: '1 × 100 pumps (breathing)', tag: 'warm-up' },
          { name: 'Single Leg Stretch', detail: '3 × 10 each side' },
          { name: 'Double Leg Stretch', detail: '3 × 10 reps' },
          { name: 'Rolling Like a Ball', detail: '2 × 8 reps' },
          { name: 'Shoulder Bridge', detail: '3 × 10 reps' },
          { name: 'Leg Circle', detail: '2 × 8 each direction, each leg' },
        ]},
      Friday: { activity: 'Easy Run 25–35min', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Walk Warm-Up', detail: '5 min', tag: 'warm-up' },
          { name: 'Zone 2 Easy Run', detail: '25–35 min conversational pace', tag: 'main' },
          { name: 'Pace Target', detail: '~6:45–7:30/km — aerobic base building' },
          { name: 'Cool-Down + Stretch', detail: '5–10 min hip flexors & hamstrings', tag: 'cool-down' },
        ]},
      Saturday: { activity: 'Yoga / Walk', type: 'active', codexLink: 'pilates',
        exercises: [
          { name: 'Easy Walk', detail: '30–45 min with dogs or outdoor', tag: 'active recovery' },
          { name: 'Hip Flexor Stretch', detail: '2 min each side' },
          { name: 'Pigeon Pose', detail: '90 sec each side' },
          { name: 'Hamstring Stretch', detail: '2 min each side' },
          { name: 'Deep Breathing', detail: '5 min — reset for the week' },
        ]},
      Sunday: { activity: 'Rest', type: 'rest', codexLink: null,
        exercises: [
          { name: 'Complete Rest', detail: 'Mandatory. Sleep is adaptation.', tag: 'rest' },
          { name: 'Nutrition Focus', detail: 'High protein + carbs to refuel the week' },
          { name: 'Sleep Target', detail: '8–9 hrs tonight — recovery compounds' },
        ]},
    },
    pillars: [
      { color: 'var(--phase1)', title: 'Pilates Focus', body: 'Breathing, neutral spine, dead bugs, bird dogs, glute bridges, pelvic floor activation. 2× per week mat classes.' },
      { color: 'var(--run)', title: 'Running Focus', body: 'Run at conversational pace only. No intervals yet. Build to 3× per week. Total weekly distance: 10–15km.' },
      { color: 'var(--strength)', title: 'Strength Focus', body: 'Squats, Romanian deadlifts, push-ups, rows, lunges. 2–3 sets × 10–12 reps. Learn movement patterns.' },
    ]},

  { num: 2, name: 'Aerobic Dev', full: 'Aerobic Development', months: 'July · Weeks 5–8',
    color: 'var(--phase2)',
    focus: 'Grow your aerobic engine and start lifting heavier. Introduce rowing and SkiErg. Your Pilates practice moves into more functional movements to build strength.',
    days: {
      Monday: { activity: 'Strength — Lower', type: 'strength', codexLink: 'hyrox',
        exercises: [
          { name: 'Goblet Squat', detail: '3 × 10 (KB 12–16kg)' },
          { name: 'KB Romanian Deadlift', detail: '3 × 10 each leg' },
          { name: 'Walking Lunge', detail: '3 × 12 each leg' },
          { name: 'KB Swing', detail: '3 × 15 reps', tag: 'key' },
          { name: 'Hip Thrust', detail: '3 × 12 (bodyweight or barbell)' },
          { name: 'Calf Raise', detail: '3 × 15 (slow eccentric)' },
        ]},
      Tuesday: { activity: 'Tempo Run 40min', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Easy Jog Warm-Up', detail: '10 min', tag: 'warm-up' },
          { name: 'Tempo Run', detail: '20 min at comfortably hard pace', tag: 'main' },
          { name: 'Pace Target', detail: '~6:00–6:30/km — cannot hold full conversation' },
          { name: 'Easy Jog Cool-Down', detail: '10 min', tag: 'cool-down' },
          { name: 'Post-Run Stretch', detail: 'Hip flexors + quads 2 min each', tag: 'cool-down' },
        ]},
      Wednesday: { activity: 'Pilates + Rowing', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'Plank Progressions', detail: '3 × 30 sec (build to 45 sec)', tag: 'warm-up' },
          { name: 'Side Kick Series', detail: '2 × 10 each side' },
          { name: 'Swimming (Pilates)', detail: '2 × 20 counts' },
          { name: 'Shoulder Bridge with March', detail: '2 × 10 reps' },
          { name: 'Rowing Technique Drills', detail: '5–10 min easy (legs → hips → arms)', tag: 'key' },
          { name: 'SkiErg Intro', detail: '3 × 2 min easy — learn the pull pattern' },
        ]},
      Thursday: { activity: 'Strength — Upper', type: 'strength', codexLink: 'hyrox',
        exercises: [
          { name: 'Push-Up Variations', detail: '3 × 10 (wide, narrow, or incline)' },
          { name: 'DB Single-Arm Row', detail: '3 × 12 each arm', tag: 'key' },
          { name: 'DB Shoulder Press', detail: '3 × 10' },
          { name: 'Face Pulls (Band)', detail: '3 × 15 — rear delts for SkiErg' },
          { name: 'Lat Pulldown or Pull-Up', detail: '3 × 8 — upper back priority', tag: 'key' },
          { name: 'Chest Press (DB)', detail: '3 × 10' },
        ]},
      Friday: { activity: 'Long Run 45–55min', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Walk Warm-Up', detail: '5 min', tag: 'warm-up' },
          { name: 'Zone 2 Long Run', detail: '45–55 min at easy pace', tag: 'main' },
          { name: 'Pace Target', detail: '~6:45–7:00/km — aerobic engine builder' },
          { name: 'Cool-Down Walk + Stretch', detail: '10 min full lower body stretch', tag: 'cool-down' },
        ]},
      Saturday: { activity: 'Pilates Flow', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'Leg Circles', detail: '2 × 8 each direction, each leg' },
          { name: 'Corkscrew', detail: '2 × 8 each side' },
          { name: 'Shoulder Bridge with March', detail: '2 × 10' },
          { name: 'Resistance Band Side Steps', detail: '3 × 15 each direction' },
          { name: 'Thoracic Rotation', detail: '2 × 10 each side — SkiErg prep' },
        ]},
      Sunday: { activity: 'Rest', type: 'rest', codexLink: null,
        exercises: [
          { name: 'Complete Rest', detail: 'Mandatory. Adaptation happens here.', tag: 'rest' },
          { name: 'Sleep Target', detail: '8+ hrs' },
          { name: 'Nutrition', detail: 'Carb-rich meals to fuel the next week' },
        ]},
    },
    pillars: [
      { color: 'var(--phase2)', title: 'Pilates Focus', body: 'Standing Pilates, hip mobility series, thoracic rotation, shoulder stability. Begin learning Pilates with resistance bands.' },
      { color: 'var(--run)', title: 'Machine Intro', body: 'Learn proper rowing technique. 5–10 min sessions. SkiErg basics. Focus on breathing mechanics — Pilates breathing transfers directly.' },
      { color: 'var(--strength)', title: 'Strength Focus', body: 'Add kettlebells. Goblet squats, KB swings, farmer carries. Introduce sled basics. 3 sets × 8–10 reps.' },
    ]},

  { num: 3, name: 'Specificity', full: 'Hyrox Specificity', months: 'August · Weeks 9–13',
    color: 'var(--phase3)',
    focus: 'Now you train like a Hyrox athlete. Every workout starts mimicking race conditions. You\'ll pair runs with exercise stations. Pilates shifts to injury prevention and mobility maintenance.',
    days: {
      Monday: { activity: 'Heavy Strength', type: 'strength', codexLink: 'hyrox',
        exercises: [
          { name: 'Back Squat', detail: '4 × 6–8 (heavy)', tag: 'key' },
          { name: 'Deadlift', detail: '4 × 6 (heavy — sled pull carryover)', tag: 'key' },
          { name: 'Push-Up / Bench Press', detail: '4 × 8' },
          { name: 'KB Swing', detail: '4 × 12 (explosive hip drive)' },
          { name: 'Single-Leg RDL', detail: '3 × 10 each (sandbag lunge prep)', tag: 'key' },
          { name: 'Farmer Carry', detail: '3 × 30m (grip + posture)', tag: 'key' },
        ]},
      Tuesday: { activity: 'Run + Stations', type: 'hyrox', codexLink: 'hyrox',
        exercises: [
          { name: '1km Run', detail: 'Target ~6:30/km pace', tag: 'round 1' },
          { name: 'SkiErg', detail: '500m steady — breathe!', tag: 'round 1' },
          { name: 'Rest', detail: '2 min transition rest' },
          { name: '1km Run', detail: 'Target ~6:30/km pace', tag: 'round 2' },
          { name: 'Rowing', detail: '500m — hips before arms', tag: 'round 2' },
          { name: 'Rest', detail: '2 min — repeat above × 3 total rounds', tag: 'key' },
        ]},
      Wednesday: { activity: 'Pilates Mobility', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'Hip Flexor Lengthening Flow', detail: '15 min — essential for running' },
          { name: 'Thoracic Rotation Series', detail: '10 min each side — SkiErg & rowing prep', tag: 'key' },
          { name: 'Shoulder Opener Sequence', detail: '5 min — sled pull protection' },
          { name: 'Lottie Murphy Daily Routine', detail: '16 min video — Hips, Obliques & Mobility', tag: 'video' },
        ]},
      Thursday: { activity: 'Interval Run + Row', type: 'hyrox', codexLink: 'hyrox',
        exercises: [
          { name: 'Easy Warm-Up Jog', detail: '10 min', tag: 'warm-up' },
          { name: 'Run Intervals', detail: '6 × 400m at ~5:00/km, 90 sec rest between', tag: 'key' },
          { name: 'Rowing Intervals', detail: '4 × 3 min at moderate effort, 90 sec rest', tag: 'key' },
          { name: 'Cool-Down', detail: '5 min easy jog + stretch', tag: 'cool-down' },
        ]},
      Friday: { activity: 'Functional Circuit', type: 'strength', codexLink: 'hyrox',
        exercises: [
          { name: '400m Run', detail: 'Easy effort', tag: 'circuit A' },
          { name: 'SkiErg', detail: '2 min steady pace', tag: 'circuit A' },
          { name: 'Rest', detail: '2 min — × 4 rounds' },
          { name: '400m Run', detail: 'Easy effort', tag: 'circuit B' },
          { name: 'Rowing', detail: '3 min steady pace', tag: 'circuit B' },
          { name: 'Rest', detail: '2 min — × 4 rounds', tag: 'key' },
        ]},
      Saturday: { activity: 'Long Run 60–70min', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Walk Warm-Up', detail: '5 min', tag: 'warm-up' },
          { name: 'Zone 2 Long Run', detail: '60–70 min at easy aerobic pace', tag: 'main' },
          { name: 'Pace Target', detail: '~6:45–7:00/km — aerobic engine peak' },
          { name: 'Glute Activation', detail: '5 min walk + bridges post-run', tag: 'cool-down' },
          { name: 'Full Lower Body Stretch', detail: '10 min — hip flexors, quads, calves', tag: 'cool-down' },
        ]},
      Sunday: { activity: 'Rest', type: 'rest', codexLink: null,
        exercises: [
          { name: 'Complete Rest', detail: 'Mandatory — highest load phase.', tag: 'rest' },
          { name: 'Sleep Target', detail: '8+ hrs — peak adaptation week' },
          { name: 'Hydration', detail: '3L water minimum, electrolytes' },
        ]},
    },
    pillars: [
      { color: 'var(--phase3)', title: 'Key Workout', body: '1km run → SkiErg 500m → 1km run → Row 500m. Rest 3min. Repeat. Learn to transition under fatigue.' },
      { color: 'var(--phase3)', title: 'Station Drill', body: 'Master all 8 stations in isolation first. Burpee broad jump technique, sled mechanics, wall ball breathing patterns.' },
      { color: 'var(--pilates)', title: 'Pilates Role', body: '1× per week. Focus: hip flexor release, thoracic spine mobility, shoulder opener, and deep core activation before hard sessions.' },
    ]},

  { num: 4, name: 'Simulation', full: 'Race Simulation', months: 'September · Weeks 14–18',
    color: 'var(--phase4)',
    focus: 'Full Hyrox simulations. Practice your pacing strategy. Your goal is to prove to yourself you can complete the race — speed comes from your fitness base, not forcing pace in training.',
    days: {
      Monday: { activity: 'Active Recovery', type: 'active', codexLink: 'pilates',
        exercises: [
          { name: 'Easy Walk', detail: '20–30 min — light blood flow' },
          { name: 'Lottie Murphy Pilates Core', detail: '10 min gentle session', tag: 'video' },
          { name: 'Foam Roll — Quads', detail: '2 min each leg' },
          { name: 'Foam Roll — IT Band', detail: '2 min each leg' },
          { name: 'Foam Roll — Calves', detail: '2 min each leg' },
          { name: 'Hip Flexor Stretch', detail: '2 min each side' },
        ]},
      Tuesday: { activity: 'Hyrox Sim A (Half)', type: 'hyrox', codexLink: 'hyrox',
        exercises: [
          { name: '1km Run + SkiErg 1,000m', detail: 'Round 1 — target 6:30/km + ~4:00 SkiErg', tag: 'round 1' },
          { name: '1km Run + Sled Push 50m', detail: 'Round 2 — hip drive, lean forward', tag: 'round 2' },
          { name: '1km Run + Rowing 1,000m', detail: 'Round 3 — hips before arms', tag: 'round 3' },
          { name: '1km Run + Burpee Broad Jumps 80m', detail: 'Round 4 — breathe on every jump', tag: 'round 4' },
          { name: 'Target Total', detail: 'Sub-45 min for 4 rounds', tag: 'goal' },
        ]},
      Wednesday: { activity: 'Pilates + Stretch', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'Lottie Murphy Daily Routine', detail: '16 min — Hips, Obliques & Mobility', tag: 'video' },
          { name: 'Hip Flexor Release Flow', detail: '10 min each side' },
          { name: 'Thoracic Spine Mobility', detail: '10 min rotation work' },
          { name: 'Shoulder Opener Sequence', detail: '5 min — protect the sled pull' },
        ]},
      Thursday: { activity: 'Run Intervals', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Easy Warm-Up Jog', detail: '10 min', tag: 'warm-up' },
          { name: 'Run Intervals', detail: '6 × 400m at ~5:00/km, 90 sec rest', tag: 'key' },
          { name: 'Race Pace Runs', detail: '2 × 1km at target race pace (6:30/km)', tag: 'key' },
          { name: 'Cool-Down Jog', detail: '5 min easy + lower body stretch', tag: 'cool-down' },
        ]},
      Friday: { activity: 'Moderate Strength', type: 'strength', codexLink: 'hyrox',
        exercises: [
          { name: 'Goblet Squat', detail: '3 × 10 (moderate weight)' },
          { name: 'KB Swing', detail: '3 × 15' },
          { name: 'Push-Up', detail: '3 × 12' },
          { name: 'DB Row', detail: '3 × 12 each arm' },
          { name: 'Farmer Carry', detail: '3 × 40m (race-weight KB)', tag: 'key' },
          { name: 'Wall Ball Practice', detail: '3 × 20 reps — breathe every rep', tag: 'key' },
        ]},
      Saturday: { activity: 'Hyrox Sim B (Full)', type: 'hyrox', codexLink: 'hyrox',
        exercises: [
          { name: '8 × (1km Run + 1 Station)', detail: 'All 8 stations in race order', tag: 'main' },
          { name: 'Station Order', detail: 'SkiErg → Sled Push → Sled Pull → Burpees → Row → Farmers Carry → Sandbag Lunges → Wall Balls' },
          { name: 'Target Total', detail: 'Sub-1:40 — confidence builder, not race effort', tag: 'goal' },
          { name: 'Key Focus', detail: 'Practice transitions — under 20 sec each', tag: 'key' },
        ]},
      Sunday: { activity: 'Rest', type: 'rest', codexLink: null,
        exercises: [
          { name: 'Complete Rest', detail: 'After full sim Saturday — essential.', tag: 'rest' },
          { name: 'Recovery Nutrition', detail: 'Protein + carbs within 45 min of sim' },
          { name: 'Sleep Target', detail: '8–9 hrs — simulation adaptation' },
        ]},
    },
    pillars: [
      { color: 'var(--phase4)', title: 'Sim A — Half', body: '4 runs of 1km + 4 stations. Target sub-45min. Practice transitions and breathing during stations.' },
      { color: 'var(--phase4)', title: 'Sim B — Full', body: 'Full 8-round simulation at race effort. Time yourself. Target: complete under 1:40. Build confidence, not exhaustion.' },
      { color: 'var(--cyan)', title: 'Mental Strategy', body: 'Practice your race split targets. Learn what "sustainable" feels like at each station under fatigue.' },
    ]},

  { num: 5, name: 'Taper', full: 'Taper & Race Prep', months: 'Early October · Weeks 19–20',
    color: 'var(--phase5)',
    focus: 'The fitness is banked. Now you protect it. Reduce volume by 40%, keep intensity sharp with short efforts. Pilates daily to stay loose. Sleep is your biggest performance advantage.',
    days: {
      Monday: { activity: 'Easy Run 20min', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Walk Warm-Up', detail: '5 min', tag: 'warm-up' },
          { name: 'Easy Jog', detail: '20 min at very easy pace (Zone 1–2)', tag: 'main' },
          { name: 'Pace Target', detail: '~7:00/km — blood flow, no effort' },
          { name: 'Hip Flexor Stretch', detail: '2 min each side', tag: 'cool-down' },
        ]},
      Tuesday: { activity: 'Pilates — Gentle', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'Pilates Core (Lottie Murphy)', detail: '10 min — gentle session only', tag: 'video' },
          { name: 'Hip Opener Flow', detail: '10 min — stay loose' },
          { name: 'Breathing Practice', detail: '5 min — race day pacing tool' },
          { name: 'Total Session', detail: '20–25 min max. No fatigue.', tag: 'note' },
        ]},
      Wednesday: { activity: 'Light Strength', type: 'strength', codexLink: 'hyrox',
        exercises: [
          { name: 'Goblet Squat', detail: '2 × 10 (lighter than usual)' },
          { name: 'Push-Up', detail: '2 × 10' },
          { name: 'DB Row', detail: '2 × 10 each arm' },
          { name: 'Glute Bridge', detail: '2 × 10' },
          { name: 'Note', detail: 'No new movements. No heavy loads.', tag: 'note' },
        ]},
      Thursday: { activity: 'Strides 4×200m', type: 'run', codexLink: 'hyrox',
        exercises: [
          { name: 'Easy Warm-Up Jog', detail: '10 min very easy', tag: 'warm-up' },
          { name: 'Strides', detail: '4 × 200m at race effort, full rest between', tag: 'main' },
          { name: 'Effort', detail: '~5:00/km — feel the legs turn over fast' },
          { name: 'Easy Cool-Down', detail: '5 min easy jog home', tag: 'cool-down' },
        ]},
      Friday: { activity: 'Pilates Mobility', type: 'pilates', codexLink: 'pilates',
        exercises: [
          { name: 'Morning Pilates', detail: '10–15 min — Lottie Murphy Core 10 min', tag: 'video' },
          { name: 'Hip Flexor Release', detail: '2 min each side' },
          { name: 'Thoracic Spine Mobility', detail: '5 min gentle rotations' },
          { name: 'Note', detail: 'Race tomorrow. Stay calm. Kit is already packed.', tag: 'note' },
        ]},
      Saturday: { activity: 'Walk + Rest', type: 'active', codexLink: null,
        exercises: [
          { name: 'Short Easy Walk', detail: '20–30 min — legs stay active, nothing more' },
          { name: 'Lay Out Race Kit', detail: 'Kit, nutrition, timing chip, warm layers' },
          { name: 'Race Morning Nutrition', detail: 'Prep oats/honey/banana for tomorrow' },
          { name: 'Sleep', detail: 'Bed by 21:30. Race day is tomorrow.', tag: 'note' },
        ]},
      Sunday: { activity: 'Rest', type: 'rest', codexLink: null,
        exercises: [
          { name: 'Complete Rest', detail: 'Trust the 20 weeks. No extra work.', tag: 'rest' },
          { name: 'Sunday Review', detail: 'Plan next week, check phase, set priorities' },
          { name: 'Sleep Target', detail: '22:00 lights out — race week starts fresh' },
        ]},
    },
    pillars: [
      { color: 'var(--phase5)', title: 'Sleep', body: 'Aim for 8–9 hours. Sleep is where adaptation happens. More impactful than any workout in taper week.' },
      { color: 'var(--phase5)', title: 'Nutrition', body: 'Increase carbs slightly 3 days out. Stay well hydrated. Avoid new foods race week. Race morning: familiar breakfast 2hrs before.' },
      { color: 'var(--phase5)', title: 'Race Day', body: 'Lay kit out the night before. Arrive 45min early. Warm up 15min. Seed yourself in a realistic wave. Trust your weeks of training.' },
    ]},
];

const PMP_CHAPTERS = [
  { id: 'integration', name: 'Integration Management', duration: 270, lessons: [
    { id: 'int-1', name: 'Develop Project Charter', duration: 45 },
    { id: 'int-2', name: 'Develop Project Management Plan', duration: 60 },
    { id: 'int-3', name: 'Direct & Manage Project Work', duration: 45 },
    { id: 'int-4', name: 'Monitor & Control Project Work', duration: 45 },
    { id: 'int-5', name: 'Perform Integrated Change Control', duration: 45 },
    { id: 'int-6', name: 'Close Project or Phase', duration: 30 },
  ]},
  { id: 'scope', name: 'Scope Management', duration: 240, lessons: [
    { id: 'scp-1', name: 'Plan Scope Management', duration: 30 },
    { id: 'scp-2', name: 'Collect Requirements', duration: 45 },
    { id: 'scp-3', name: 'Define Scope', duration: 45 },
    { id: 'scp-4', name: 'Create WBS', duration: 60 },
    { id: 'scp-5', name: 'Validate Scope', duration: 30 },
    { id: 'scp-6', name: 'Control Scope', duration: 30 },
  ]},
  { id: 'schedule', name: 'Schedule Management', duration: 255, lessons: [
    { id: 'sch-1', name: 'Plan Schedule Management', duration: 30 },
    { id: 'sch-2', name: 'Define Activities', duration: 30 },
    { id: 'sch-3', name: 'Sequence Activities', duration: 45 },
    { id: 'sch-4', name: 'Estimate Activity Durations', duration: 45 },
    { id: 'sch-5', name: 'Develop Schedule (CPM & Float)', duration: 60 },
    { id: 'sch-6', name: 'Control Schedule', duration: 45 },
  ]},
  { id: 'cost', name: 'Cost Management', duration: 180, lessons: [
    { id: 'cst-1', name: 'Plan Cost Management', duration: 30 },
    { id: 'cst-2', name: 'Estimate Costs', duration: 45 },
    { id: 'cst-3', name: 'Determine Budget', duration: 45 },
    { id: 'cst-4', name: 'Control Costs & Earned Value (EVM)', duration: 60 },
  ]},
  { id: 'quality', name: 'Quality Management', duration: 135, lessons: [
    { id: 'qlt-1', name: 'Plan Quality Management', duration: 45 },
    { id: 'qlt-2', name: 'Manage Quality (QA)', duration: 45 },
    { id: 'qlt-3', name: 'Control Quality (QC)', duration: 45 },
  ]},
  { id: 'resources', name: 'Resource Management', duration: 210, lessons: [
    { id: 'res-1', name: 'Plan Resource Management', duration: 30 },
    { id: 'res-2', name: 'Estimate Activity Resources', duration: 30 },
    { id: 'res-3', name: 'Acquire Resources', duration: 30 },
    { id: 'res-4', name: 'Develop Team', duration: 45 },
    { id: 'res-5', name: 'Manage Team', duration: 45 },
    { id: 'res-6', name: 'Control Resources', duration: 30 },
  ]},
  { id: 'communications', name: 'Communications Management', duration: 105, lessons: [
    { id: 'com-1', name: 'Plan Communications Management', duration: 30 },
    { id: 'com-2', name: 'Manage Communications', duration: 45 },
    { id: 'com-3', name: 'Monitor Communications', duration: 30 },
  ]},
  { id: 'risk', name: 'Risk Management', duration: 270, lessons: [
    { id: 'rsk-1', name: 'Plan Risk Management', duration: 30 },
    { id: 'rsk-2', name: 'Identify Risks', duration: 45 },
    { id: 'rsk-3', name: 'Qualitative Risk Analysis', duration: 45 },
    { id: 'rsk-4', name: 'Quantitative Risk Analysis', duration: 45 },
    { id: 'rsk-5', name: 'Plan Risk Responses', duration: 45 },
    { id: 'rsk-6', name: 'Implement & Monitor Risks', duration: 60 },
  ]},
  { id: 'procurement', name: 'Procurement Management', duration: 165, lessons: [
    { id: 'pro-1', name: 'Plan Procurement Management', duration: 45 },
    { id: 'pro-2', name: 'Conduct Procurements', duration: 45 },
    { id: 'pro-3', name: 'Control Procurements', duration: 45 },
    { id: 'pro-4', name: 'Close Procurements', duration: 30 },
  ]},
  { id: 'stakeholders', name: 'Stakeholder Management', duration: 135, lessons: [
    { id: 'stk-1', name: 'Identify Stakeholders', duration: 30 },
    { id: 'stk-2', name: 'Plan Stakeholder Engagement', duration: 30 },
    { id: 'stk-3', name: 'Manage Stakeholder Engagement', duration: 45 },
    { id: 'stk-4', name: 'Monitor Stakeholder Engagement', duration: 30 },
  ]},
];

const PO_WEEKS = [
  { week: 1,  title: 'Agile & Scrum Foundations',   topics: ['Agile manifesto & 12 principles', 'Scrum roles: PO, Scrum Master, Dev team', 'Scrum ceremonies overview', 'Definition of Done & Definition of Ready'] },
  { week: 2,  title: 'The Product Owner Role',       topics: ['PO responsibilities & accountabilities', 'Stakeholder identification & mapping', 'Product vision & strategy basics', 'Working agreements with dev teams'] },
  { week: 3,  title: 'Product Discovery',            topics: ['User research techniques (interviews, surveys)', 'Jobs-to-be-Done (JTBD) framework', 'User personas & empathy maps', 'Problem framing & opportunity sizing'] },
  { week: 4,  title: 'User Stories & Requirements',  topics: ['Writing user stories (INVEST criteria)', 'Acceptance criteria — BDD / Given-When-Then', 'Epic & feature breakdown', 'Story mapping sessions'] },
  { week: 5,  title: 'Backlog Management',           topics: ['Backlog creation & refinement', 'Prioritisation: RICE, MoSCoW, Kano model', 'Sprint planning facilitation', 'Managing technical debt'] },
  { week: 6,  title: 'Technical Literacy for POs',  topics: ['Frontend vs backend vs APIs explained', 'Reading & interpreting API documentation', 'Database concepts for POs (SQL basics)', 'System architecture: monolith vs microservices'] },
  { week: 7,  title: 'Data & Analytics',             topics: ['Defining product KPIs & success metrics', 'Funnel analysis & cohort analysis', 'A/B testing — design & interpretation', 'Product analytics tools (Mixpanel, GA4)'] },
  { week: 8,  title: 'Roadmapping & Strategy',       topics: ['Roadmap formats: Now-Next-Later, outcome-based', 'OKRs for product teams', 'Release planning & sequencing', 'Communicating roadmap to stakeholders'] },
  { week: 9,  title: 'Delivery & Ceremonies',        topics: ['Sprint review & retrospective facilitation', 'Writing detailed technical tickets (Jira/Linear)', 'Estimation with dev teams (story points)', 'Continuous delivery & deployment concepts'] },
  { week: 10, title: 'AI Tools for Product Owners',  topics: ['AI-assisted user research & synthesis', 'Prompt engineering for PO tasks', 'Vibe coding — prototyping with AI tools', 'Evaluating AI-built features as a PO'] },
  { week: 11, title: 'Go-to-Market & Launch',        topics: ['GTM strategy for feature launches', 'Internal stakeholder communication plan', 'Release notes & changelog writing', 'Post-launch monitoring & iteration'] },
  { week: 12, title: 'PO Portfolio & Capstone',      topics: ['Document a product case study end-to-end', 'Write a full PRD (Product Requirements Doc)', 'Build your PO portfolio (Notion / website)', 'Present your product thinking'] },
];

const STATIONS = [
  { id: 'skierg',        name: 'SkiErg',         spec: '1,000m', unit: 'time', placeholder: 'e.g. 4:20' },
  { id: 'sledPush',      name: 'Sled Push',       spec: '50m · 102kg', unit: 'time', placeholder: 'e.g. 5:00' },
  { id: 'sledPull',      name: 'Sled Pull',       spec: '50m · 78kg', unit: 'time', placeholder: 'e.g. 4:45' },
  { id: 'burpeeJumps',   name: 'Burpee Broad Jump', spec: '80m', unit: 'time', placeholder: 'e.g. 5:30' },
  { id: 'rowing',        name: 'Rowing',          spec: '1,000m', unit: 'time', placeholder: 'e.g. 4:10' },
  { id: 'farmersCarry',  name: 'Farmers Carry',   spec: '200m · 2×16kg', unit: 'time', placeholder: 'e.g. 2:30' },
  { id: 'sandbagLunges', name: 'Sandbag Lunges',  spec: '100m · 10kg', unit: 'time', placeholder: 'e.g. 6:00' },
  { id: 'wallBalls',     name: 'Wall Balls',      spec: '100 reps · 6kg', unit: 'time', placeholder: 'e.g. 7:00' },
];

const YOUTUBE_VIDEOS = [
  { type: 'pilates', channel: 'Move With Nicole', title: '35 Min Full Body Pilates for Absolute Beginners', desc: 'Your very first Pilates session. Nicole walks through neutral spine, breathing, dead bugs, glute bridges and the foundational movement vocabulary you need before anything else.', url: 'https://www.youtube.com/watch?v=2En0LrCWoGI', tags: ['p1', 'No Equipment', '35 min'] },
  { type: 'pilates', channel: 'Move With Nicole', title: '30 Min Pilates for Beginners — Full Body, No Equipment', desc: 'A slightly more dynamic beginner session. Use this in your second and third weeks of Phase 1.', url: 'https://www.youtube.com/watch?v=ywzZXO-A7Pg', tags: ['p1', 'No Equipment', '30 min'] },
  { type: 'pilates', channel: 'Lottie Murphy Pilates', title: 'Pilates Warm Up — Beginners Level Routine', desc: 'A short warm-up routine to prime your body before any Pilates or training session. Use this before every workout in Phase 1 and 2.', url: 'https://www.youtube.com/watch?v=JVtuvz2_cDA', tags: ['p1', 'Warm-Up', '15 min'] },
  { type: 'pilates', channel: 'Move With Nicole', title: '30 Min Morning Pilates — Energising Full Body (Moderate)', desc: 'Step up to this in Phase 2. Adds more challenge to your standing stability and shoulder work — both directly relevant to the SkiErg and farmers carry stations.', url: 'https://www.youtube.com/watch?v=LbG1ovCGp-E', tags: ['p2', 'Morning', '30 min'] },
  { type: 'pilates', channel: 'Lottie Murphy Pilates', title: 'Pilates for Core and Flexibility', desc: 'Combines core stability with flexibility — the exact combo you need in Phase 2–3 as training intensity ramps up.', url: 'https://www.youtube.com/watch?v=9JsUGdWU2DE', tags: ['p2', 'p3', 'Core + Flex'] },
  { type: 'pilates', channel: 'Move With Nicole', title: '30 Min Full Body Pilates — At-Home Intermediate', desc: 'Graduate to this in Phase 3. Increased challenge, more dynamic movement. Your weekly Pilates maintenance session during heavy Hyrox training months.', url: 'https://www.youtube.com/watch?v=lBCBSy9cNT0', tags: ['p3', 'Intermediate', '30 min'] },
  { type: 'pilates', channel: 'Lottie Murphy Pilates', title: 'Essential Daily Pilates — Hips, Obliques & Mobility', desc: '16 minutes. Hips, lower abs, obliques and mobility — exactly what you need daily in Phases 4 and 5.', url: 'https://www.youtube.com/watch?v=-74SDcT58eE', tags: ['p4', 'p5', 'Daily', '16 min'] },
  { type: 'pilates', channel: 'Lottie Murphy Pilates', title: 'Pilates Core in 10 Mins', desc: 'Your race week Pilates. Just 10 minutes, fires deep core without creating fatigue. Perfect every morning in race week.', url: 'https://www.youtube.com/watch?v=RTUfkzdRyY0', tags: ['p5', '10 min', 'Race Week'] },
  { type: 'hyrox', channel: 'Rox Lyfe', title: 'Hyrox Beginners Guide — Training for Your First Event', desc: 'The best starting point for any first-timer. Covers the race format, how to structure training, what each station feels like, and how to build toward your first event.', url: 'https://www.youtube.com/watch?v=lXf-7YE9Huk', tags: ['p1', 'Must Watch First'] },
  { type: 'race', channel: 'HYROX Official', title: '10 Tips for a HYROX Beginner', desc: 'Straight from the official Hyrox channel. Covers the 10 most common beginner mistakes — transitions, pacing, sled technique, wave seeding, and race-day logistics.', url: 'https://www.youtube.com/watch?v=-sVXGZ6uwb8', tags: ['p1', 'Official', 'Race Tips'] },
  { type: 'hyrox', channel: 'Nick Bare', title: 'My Next Fitness Challenge | Hyrox Prep Episode 1', desc: 'Nick Bare documents his entire Hyrox journey from scratch across 16 episodes. Episode 1 — his goals, initial assessment, and training plan. Highly relatable for a first-timer.', url: 'https://www.youtube.com/watch?v=xV6ZhNdj750', tags: ['p1', 'Series', '16 Episodes'] },
  { type: 'hyrox', channel: 'Nick Bare', title: 'Full Day of Hyrox Training | Episode 9', desc: 'Shows exactly what a full Hyrox training day looks like in Phase 3 — the run + station combinations, how to pace, and what "compromised running" actually feels like.', url: 'https://www.youtube.com/watch?v=WrtjhjNSdyE', tags: ['p3', 'Full Day', 'Simulation'] },
  { type: 'run', channel: 'RMR Training', title: 'The One Hyrox Training Method That Will Make You Faster', desc: 'Threshold training is the single biggest lever for improving your Hyrox run time. This video explains exactly how to implement it, with pace targets.', url: 'https://www.youtube.com/watch?v=eHnvndpBNnM', tags: ['p3', 'Running', 'Speed Work'] },
  { type: 'race', channel: 'YouTube — Hyrox Simulation', title: 'Hyrox Training Simulation — The Ultimate Hyrox Sim', desc: 'Watch a full Hyrox simulation being executed at race pace. Invaluable for Phase 4 — see exactly how an experienced athlete transitions between stations.', url: 'https://www.youtube.com/watch?v=uPNEvZLvqJY', tags: ['p4', 'Full Simulation', 'Pacing Study'] },
  { type: 'race', channel: 'YouTube — Hyrox Guide', title: 'How to Do Your First Hyrox Race | Ultimate Guide', desc: 'Everything about race day logistics — what to expect in the venue, how warm-up works, transitions, timing chips, and what happens at each station.', url: 'https://www.youtube.com/watch?v=jX7WFQAVMmM', tags: ['p5', 'Race Day', 'Logistics'] },
];

/* ============================================================
   NAVIGATION
   ============================================================ */
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab, .mobile-nav-btn').forEach(b => b.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  document.querySelectorAll('[data-nav="' + name + '"]').forEach(b => b.classList.add('active'));
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (name === 'dashboard') renderDashboard();
  if (name === 'training')  renderTraining();
  if (name === 'studies')   renderStudies();
  if (name === 'chat')      renderChat();
  if (name === 'codex')     renderCodex();
  if (name === 'character') renderCharacter();
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
function showToast(msg, type = 'blue', sysLabel = 'SYSTEM') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="toast-sys">${sysLabel}</div><div class="toast-msg">${msg}</div>`;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('leaving');
    setTimeout(() => t.remove(), 350);
  }, 3500);
}

/* ============================================================
   XP / LEVEL
   ============================================================ */
function calcLevel(sessions) { return Math.floor(sessions / 10) + 1; }
function calcXPPercent(sessions) { return ((sessions % 10) / 10) * 100; }

function calcKnowledgeXP(d) {
  const lessons  = (d.studies.pmp.completedLessons  || []).length;
  const chapters = (d.studies.pmp.completedChapters || []).length;
  const poTopics = (d.studies.po.completedTopics    || []).length;
  const scores   = d.studies.pmp.mockScores || [];
  const avgScore = scores.length ? Math.round(scores.reduce((a,b) => a + (b.score/b.total*100), 0) / scores.length) : 0;
  return lessons * 15 + chapters * 50 + poTopics * 8 + Math.floor(avgScore);
}
function calcKnowledgeLevel(d) { return Math.floor(calcKnowledgeXP(d) / 200) + 1; }
function calcOverallXP(d)      { return (d.training.completedSessions || []).length * 20 + calcKnowledgeXP(d); }
function calcOverallLevel(d)   { return Math.floor(calcOverallXP(d) / 300) + 1; }
function modifier(score)       { return Math.floor((score - 10) / 2); }
function modStr(n)             { return (n >= 0 ? '+' : '') + n; }

function deriveClass(career) {
  if (!career) return 'The Adventurer';
  const c = career.toLowerCase();
  if (/product|owner|po\b|pm\b/.test(c))                   return 'The Strategist';
  if (/engineer|developer|software|dev\b|tech|coder/.test(c)) return 'The Artificer';
  if (/data|analyst|scientist|research/.test(c))            return 'The Sage';
  if (/sales|commercial|entrepreneur/.test(c))              return 'The Merchant';
  if (/athlete|coach|fitness|sport|trainer/.test(c))        return 'The Gladiator';
  if (/consult/.test(c))                                    return 'The Scholar';
  if (/design|creative|art/.test(c))                        return 'The Visionary';
  if (/manager|director|lead/.test(c))                      return 'The Commander';
  return 'The Adventurer';
}

function calcStats(d) {
  const sessions = (d.training.completedSessions || []).length;
  const streak   = d.studies.pmp.studyStreak || 0;
  const lessons  = (d.studies.pmp.completedLessons  || []).length;
  const poTopics = (d.studies.po.completedTopics    || []).length;
  const scores   = d.studies.pmp.mockScores || [];
  const avgScore = scores.length ? Math.round(scores.reduce((a,b) => a + (b.score/b.total*100), 0) / scores.length) : 0;
  const runLogs  = (d.training.runLogs || []).length;
  const char     = d.character || {};
  return {
    str: Math.min(20, Math.max(8, 8 + Math.floor(sessions / 4))),
    dex: Math.min(20, Math.max(8, 8 + Math.floor(runLogs * 2) + Math.floor(sessions / 15))),
    con: Math.min(20, Math.max(8, 8 + Math.floor(streak / 3) + Math.floor(sessions / 8))),
    int: Math.min(20, Math.max(8, 8 + Math.floor(lessons / 3) + Math.floor(poTopics / 4) + Math.floor(avgScore / 15))),
    wis: Math.min(20, Math.max(8, 8 + Math.floor(calcOverallXP(d) / 200))),
    cha: Math.min(20, Math.max(8, char.chaScore || 10)),
  };
}

function updateNavXP() {
  const d = AlfredData.get();
  const sessions = (d.training.completedSessions || []).length;
  const level = calcLevel(sessions);
  const pct = calcXPPercent(sessions);
  const el = document.getElementById('nav-level');
  const bar = document.getElementById('nav-xp-fill');
  if (el) el.textContent = 'LV ' + level;
  if (bar) bar.style.width = pct + '%';
}

/* ============================================================
   DASHBOARD RENDER
   ============================================================ */
function renderDashboard() {
  const d = AlfredData.get();
  const sessions = (d.training.completedSessions || []).length;
  const phase = d.settings.currentPhase || 1;
  const streak = d.studies.pmp.studyStreak || 0;
  const scores = d.studies.pmp.mockScores || [];
  const avgScore = scores.length ? Math.round(scores.reduce((a,b) => a + (b.score/b.total*100), 0) / scores.length) : null;
  const poTopics = (d.studies.po.completedTopics || []).length;

  // Greeting
  const greetEl = document.getElementById('alfred-greeting-msg');
  if (greetEl) {
    const hour = new Date().getHours();
    const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    greetEl.textContent = `Good ${time}, Sir. Phase ${phase} training is active. ${sessions} sessions logged. The System is watching.`;
  }

  // Race countdown
  const countEl = document.getElementById('countdown-num');
  const countLabel = document.getElementById('countdown-date');
  if (d.settings.raceDate) {
    const diff = Math.ceil((new Date(d.settings.raceDate + 'T00:00:00') - new Date()) / 86400000);
    if (countEl) countEl.textContent = Math.max(0, diff);
    if (countLabel) countLabel.textContent = new Date(d.settings.raceDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    if (countEl) countEl.textContent = '—';
    if (countLabel) countLabel.textContent = 'Set race date in Settings ⚙';
  }

  // PMP Exam countdown
  const examCountEl    = document.getElementById('exam-countdown-num');
  const examCountLabel = document.getElementById('exam-countdown-date');
  if (d.settings.pmpExamDate) {
    const diff = Math.ceil((new Date(d.settings.pmpExamDate + 'T00:00:00') - new Date()) / 86400000);
    if (examCountEl)    examCountEl.textContent = Math.max(0, diff);
    if (examCountLabel) examCountLabel.textContent = new Date(d.settings.pmpExamDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    if (examCountEl)    examCountEl.textContent = '—';
    if (examCountLabel) examCountLabel.textContent = 'Set exam date in Settings ⚙';
  }

  // Stats
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl('stat-level',  'LV ' + calcLevel(sessions));
  setEl('stat-pmp',    avgScore != null ? avgScore + '%' : '—');
  setEl('stat-po',     'LV ' + calcKnowledgeLevel(d));
  setEl('stat-streak', streak + 'd');

  // XP bar — Overall Character Level
  const overallLvl  = calcOverallLevel(d);
  const overallXP   = calcOverallXP(d);
  const xpInLevel   = overallXP - (overallLvl - 1) * 300;
  const xpFill = document.getElementById('xp-fill');
  const xpLevelEl = document.getElementById('xp-level-txt');
  const xpCapLeft = document.getElementById('xp-cap-left');
  const xpCapRight = document.getElementById('xp-cap-right');
  if (xpFill)    xpFill.style.width = Math.min(100, Math.round((xpInLevel / 300) * 100)) + '%';
  if (xpLevelEl) xpLevelEl.innerHTML = `LEVEL ${overallLvl} <span>CHARACTER</span>`;
  if (xpCapLeft) xpCapLeft.textContent = `Training LV${calcLevel(sessions)} · Knowledge LV${calcKnowledgeLevel(d)}`;
  if (xpCapRight) xpCapRight.textContent = overallXP + ' total XP';

  // Phase strip — Hyrox
  const phaseList = document.getElementById('phase-list');
  if (phaseList) {
    phaseList.innerHTML = PHASES.map(p => `
      <div class="phase-item ${p.num === phase ? 'current' : p.num < phase ? 'done' : ''}">
        <div class="phase-num" style="color:${p.num === phase ? p.color : ''}">${'PHASE ' + p.num}</div>
        <div class="phase-title">${p.name}</div>
      </div>
    `).join('');
  }

  // PMP Knowledge Areas arc
  const pmpArcList = document.getElementById('pmp-arc-list');
  if (pmpArcList) {
    const completedChapters = d.studies.pmp.completedChapters || [];
    let foundCurrent = false;
    pmpArcList.innerHTML = PMP_CHAPTERS.map((ch, i) => {
      const done      = completedChapters.includes(ch.id);
      const isCurrent = !done && !foundCurrent;
      if (isCurrent) foundCurrent = true;
      const shortName = ch.name.replace(' Management', '').replace(' Management', '');
      return `<div class="phase-item ${done ? 'done' : isCurrent ? 'current arc-current-gold' : ''}">
        <div class="phase-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="phase-title">${shortName}</div>
      </div>`;
    }).join('');
  }

  // PO Roadmap weeks arc
  const poArcList = document.getElementById('po-arc-list');
  if (poArcList) {
    const completedTopics = d.studies.po.completedTopics || [];
    const currentPoWeek   = d.studies.po.currentWeek || 1;
    poArcList.innerHTML = PO_WEEKS.map(w => {
      const allDone   = w.topics.map(t => `${w.week}_${t}`).every(id => completedTopics.includes(id));
      const isCurrent = w.week === currentPoWeek;
      const shortTitle = w.title.length > 13 ? w.title.slice(0, 12) + '…' : w.title;
      return `<div class="phase-item ${allDone ? 'done' : isCurrent ? 'current arc-current-blue' : ''}">
        <div class="phase-num">W${String(w.week).padStart(2, '0')}</div>
        <div class="phase-title">${shortTitle}</div>
      </div>`;
    }).join('');
  }

  // Today's quest
  const questList = document.getElementById('quest-list');
  if (questList) {
    const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
    const phaseData = PHASES[phase - 1];
    const todayTraining = phaseData ? phaseData.days[today] : null;
    const alreadyLogged = isSessionLoggedToday(d);

    questList.innerHTML = `
      <div class="quest-row">
        <div class="quest-icon qi-train">🏃</div>
        <div class="quest-info">
          <div class="quest-name">${todayTraining ? todayTraining.activity : 'Rest Day'}</div>
          <div class="quest-desc">Phase ${phase} · ${today} · ${phaseData ? phaseData.full : ''}</div>
        </div>
        <span class="quest-badge ${alreadyLogged ? 'qb-done' : 'qb-pending'}">${alreadyLogged ? '✓ Done' : 'Pending'}</span>
      </div>
      <div class="quest-row">
        <div class="quest-icon qi-pmp">📚</div>
        <div class="quest-info">
          <div class="quest-name">PMP Daily Study — 15 mins</div>
          <div class="quest-desc">Current streak: ${streak} days · Average score: ${avgScore != null ? avgScore + '%' : 'No scores yet'}</div>
        </div>
        <span class="quest-badge ${isStudiedToday(d) ? 'qb-done' : 'qb-pending'}">${isStudiedToday(d) ? '✓ Done' : 'Pending'}</span>
      </div>
      <div class="quest-row">
        <div class="quest-icon qi-po">💻</div>
        <div class="quest-info">
          <div class="quest-name">Product Owner — Week ${d.studies.po.currentWeek || 1}</div>
          <div class="quest-desc">${(PO_WEEKS[( d.studies.po.currentWeek || 1) - 1] || PO_WEEKS[0]).title} · ${poTopics} topics completed</div>
        </div>
        <span class="quest-badge qb-pending">In Progress</span>
      </div>
    `;
  }

  // Alert
  const alert = document.getElementById('sys-alert');
  if (alert && d.settings.raceDate) {
    const diff = Math.ceil((new Date(d.settings.raceDate) - new Date()) / 86400000);
    if (diff > 0 && diff <= 14) {
      alert.classList.add('visible');
      document.getElementById('alert-msg').innerHTML = `<strong>SYSTEM ALERT:</strong> Race day is ${diff} days away. Taper protocol active. Reduce volume, prioritise sleep.`;
    }
  }

  updateNavXP();
}

/* ============================================================
   TRAINING PAGE RENDER
   ============================================================ */
function renderTraining() {
  const d = AlfredData.get();
  const phase = d.settings.currentPhase || 1;
  const phaseData = PHASES[phase - 1];
  const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const todaySession = phaseData.days[today];
  const alreadyLogged = isSessionLoggedToday(d);

  // Phase color
  const phaseBar = document.getElementById('session-phase-bar');
  if (phaseBar) phaseBar.style.background = phaseData.color;

  // Today's session
  const sessionTitle = document.getElementById('session-title');
  const sessionDesc  = document.getElementById('session-desc');
  const sessionDay   = document.getElementById('session-day-label');
  const logBtn       = document.getElementById('log-session-btn');

  if (sessionTitle) sessionTitle.textContent = todaySession.activity;
  if (sessionDay)   sessionDay.textContent = `Phase ${phase} · ${today}`;
  if (sessionDesc) {
    const descs = {
      pilates: 'Focus on breathing mechanics and controlled movement. 30–40 min.',
      run: `Running session — Phase ${phase}. Maintain conversational pace unless tempo/interval day.`,
      strength: 'Strength session. Controlled eccentric, explosive concentric. Log your lifts.',
      hyrox: 'Hyrox-specific session. Pair run with station work. Breathe, practice transitions.',
      active: 'Active recovery. Light movement only — walk, gentle yoga, or short Pilates.',
      rest: 'Full rest day. Mandatory. Sleep is adaptation.',
    };
    sessionDesc.textContent = descs[todaySession.type] || 'Follow your phase programme for today.';
  }

  // Exercise list
  const exerciseList = document.getElementById('exercise-list');
  if (exerciseList) {
    const exercises = todaySession.exercises || [];
    if (exercises.length) {
      exerciseList.innerHTML = exercises.map(ex => {
        const tagHtml = ex.tag ? `<span class="exercise-tag ${ex.tag}">${ex.tag}</span>` : '';
        return `<div class="exercise-row">
          <span class="exercise-name">${ex.name}</span>
          <span class="exercise-detail">${ex.detail}</span>
          ${tagHtml}
        </div>`;
      }).join('');
    } else {
      exerciseList.innerHTML = '';
    }
  }

  // Reference video link — opens YouTube directly in a new tab
  const VIDEO_MAP = {
    pilates: {
      1: 'https://www.youtube.com/watch?v=2En0LrCWoGI',
      2: 'https://www.youtube.com/watch?v=LbG1ovCGp-E',
      3: 'https://www.youtube.com/watch?v=lBCBSy9cNT0',
      4: 'https://www.youtube.com/watch?v=-74SDcT58eE',
      5: 'https://www.youtube.com/watch?v=RTUfkzdRyY0',
    },
    hyrox: {
      1: 'https://www.youtube.com/watch?v=lXf-7YE9Huk',
      2: 'https://www.youtube.com/watch?v=lXf-7YE9Huk',
      3: 'https://www.youtube.com/watch?v=WrtjhjNSdyE',
      4: 'https://www.youtube.com/watch?v=uPNEvZLvqJY',
      5: 'https://www.youtube.com/watch?v=jX7WFQAVMmM',
    },
    run: {
      1: 'https://www.youtube.com/watch?v=lXf-7YE9Huk',
      2: 'https://www.youtube.com/watch?v=lXf-7YE9Huk',
      3: 'https://www.youtube.com/watch?v=eHnvndpBNnM',
      4: 'https://www.youtube.com/watch?v=eHnvndpBNnM',
      5: 'https://www.youtube.com/watch?v=jX7WFQAVMmM',
    },
  };
  const codexBtn = document.getElementById('session-codex-link');
  if (codexBtn) {
    const videoUrl = VIDEO_MAP[todaySession.codexLink] && VIDEO_MAP[todaySession.codexLink][phase];
    if (videoUrl) {
      codexBtn.classList.remove('hidden');
      codexBtn.textContent = '► Watch Reference Video';
      codexBtn.onclick = () => window.open(videoUrl, '_blank', 'noopener');
    } else {
      codexBtn.classList.add('hidden');
    }
  }

  if (logBtn) {
    logBtn.textContent = alreadyLogged ? '✓ Session Logged Today' : '[ LOG SESSION AS COMPLETE ]';
    logBtn.className = 'session-log-btn' + (alreadyLogged ? ' logged' : '');
    logBtn.onclick = alreadyLogged ? null : () => logSession();
  }

  // Week grid
  const weekCells = document.getElementById('week-cells');
  if (weekCells) {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const todayIdx = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(today);
    // Normalize: Monday=0
    const todayMon = (todayIdx + 6) % 7;
    weekCells.innerHTML = days.map((day, i) => {
      const activity = phaseData.days[day];
      const isToday = i === todayMon;
      const isDone = isSessionLoggedOnDay(d, i, todayMon);
      const icons = { pilates: '🧘', run: '🏃', strength: '💪', hyrox: '⚡', active: '🚶', rest: '💤' };
      return `
        <div class="week-cell ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}">
          <div class="week-day-label">${day.slice(0,3)}</div>
          <div class="week-cell-icon">${icons[activity.type] || '📋'}</div>
        </div>`;
    }).join('');
  }

  // Phase progress
  const phaseProg = document.getElementById('phase-prog-fill');
  const phaseProgTitle = document.getElementById('phase-prog-title');
  const phaseProgMonths = document.getElementById('phase-prog-months');
  const phaseProgCapL = document.getElementById('phase-prog-cap-left');
  const phaseProgCapR = document.getElementById('phase-prog-cap-right');
  if (phaseData) {
    const sessionsThisPhase = (d.training.completedSessions || []).filter(s => s.phase === phase).length;
    const targetSessions = [20, 24, 25, 20, 10][phase - 1];
    const pct = Math.min(100, Math.round((sessionsThisPhase / targetSessions) * 100));
    if (phaseProg) phaseProg.style.width = pct + '%';
    if (phaseProgTitle) phaseProgTitle.textContent = `Phase ${phase}: ${phaseData.full}`;
    if (phaseProgMonths) phaseProgMonths.textContent = phaseData.months;
    if (phaseProgCapL) phaseProgCapL.textContent = pct + '% complete';
    if (phaseProgCapR) phaseProgCapR.textContent = `${sessionsThisPhase}/${targetSessions} sessions`;
  }

  // Station PBs
  const stationsBody = document.getElementById('stations-body');
  if (stationsBody) {
    stationsBody.innerHTML = STATIONS.map(s => {
      const pb = d.training.stationPBs[s.id];
      return `
        <tr>
          <td>
            <div class="station-name">${s.name}</div>
            <div class="station-spec">${s.spec}</div>
          </td>
          <td class="station-pb ${pb ? '' : 'no-data'}">${pb ? pb.time : '—'}</td>
          <td style="font-size:10px;color:var(--muted)">${pb ? new Date(pb.date).toLocaleDateString('en-GB', {day:'numeric',month:'short'}) : '—'}</td>
          <td><button class="btn-log-station" onclick="openStationModal('${s.id}')">LOG PB</button></td>
        </tr>`;
    }).join('');
  }

  // Run logs
  renderRunLogs();
}

function isSessionLoggedToday(d) {
  const today = new Date().toISOString().slice(0, 10);
  return (d.training.completedSessions || []).some(s => s.date === today);
}

function isStudiedToday(d) {
  const today = new Date().toISOString().slice(0, 10);
  return d.studies.pmp.lastStudyDate === today;
}

function isSessionLoggedOnDay(d, dayIdx, todayMonIdx) {
  // Check if there's a logged session for that day of the current week
  const now = new Date();
  const diff = dayIdx - todayMonIdx;
  const target = new Date(now);
  target.setDate(now.getDate() + diff);
  const dateStr = target.toISOString().slice(0, 10);
  return (d.training.completedSessions || []).some(s => s.date === dateStr);
}

function logSession() {
  AlfredData.update(d => {
    const today = new Date().toISOString().slice(0, 10);
    if (!d.training.completedSessions.some(s => s.date === today)) {
      d.training.completedSessions.push({ date: today, phase: d.settings.currentPhase || 1, type: 'session' });
    }
  });
  showToast('Training session recorded. The System acknowledges your effort, Sir.', 'green', 'QUEST COMPLETE');
  renderTraining();
  renderDashboard();
  updateNavXP();
  checkAchievements();
}

function checkAchievements() {
  const d = AlfredData.get();
  const sessions = (d.training.completedSessions || []).length;
  if (sessions === 1)  showToast('First Session Logged — The journey has begun, Sir.', 'gold', 'ACHIEVEMENT');
  if (sessions === 10) showToast('10 Sessions — Level 2 attained. One notes progress.', 'gold', 'ACHIEVEMENT');
  if (sessions === 50) showToast('50 Sessions — Halfway to Level 6. Remarkable consistency.', 'gold', 'ACHIEVEMENT');
  const streak = d.studies.pmp.studyStreak || 0;
  if (streak === 7)  showToast('7-Day Study Streak — Iron Will. Keep going, Sir.', 'gold', 'ACHIEVEMENT');
  if (streak === 30) showToast('30-Day Study Streak — Scholarly Dedication. Most impressive.', 'gold', 'ACHIEVEMENT');
}

function renderRunLogs() {
  const d = AlfredData.get();
  const logs = (d.training.runLogs || []).slice(-6).reverse();
  const container = document.getElementById('run-entries');
  if (!container) return;
  if (!logs.length) {
    container.innerHTML = '<div style="padding:16px 20px;font-size:11px;color:var(--muted)">No runs logged yet. Add your first run below.</div>';
    return;
  }
  container.innerHTML = logs.map(r => `
    <div class="run-entry">
      <div class="run-date">${new Date(r.date).toLocaleDateString('en-GB', {day:'numeric',month:'short'})}</div>
      <div class="run-dist">${r.distanceKm}km</div>
      <div class="run-time">${r.timeMin}min</div>
      <div class="run-pace">${r.kmPace}/km</div>
    </div>`).join('');
}

function addRun() {
  const km  = parseFloat(document.getElementById('run-km')?.value);
  const min = parseFloat(document.getElementById('run-min')?.value);
  if (!km || !min || km <= 0 || min <= 0) { showToast('Please enter valid distance and time.', 'red', 'ERROR'); return; }
  const pace = formatPace(min / km);
  AlfredData.update(d => {
    d.training.runLogs.push({ date: new Date().toISOString().slice(0,10), distanceKm: km, timeMin: min, kmPace: pace });
  });
  document.getElementById('run-km').value = '';
  document.getElementById('run-min').value = '';
  showToast(`Run logged: ${km}km in ${min}min @ ${pace}/km`, 'blue', 'RUN LOGGED');
  renderRunLogs();
}

function formatPace(decMin) {
  const m = Math.floor(decMin);
  const s = Math.round((decMin - m) * 60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}

/* ============================================================
   STATION MODAL
   ============================================================ */
let activeStation = null;

function openStationModal(stationId) {
  activeStation = STATIONS.find(s => s.id === stationId);
  if (!activeStation) return;
  const modal = document.getElementById('station-modal');
  const title = document.getElementById('station-modal-title');
  const label = document.getElementById('station-modal-label');
  const input = document.getElementById('station-modal-input');
  if (title) title.textContent = 'Log PB — ' + activeStation.name;
  if (label) label.textContent = `Enter your personal best time for ${activeStation.name} (${activeStation.spec}). Example: ${activeStation.placeholder}`;
  if (input) { input.value = ''; input.placeholder = activeStation.placeholder; }
  if (modal) modal.classList.add('visible');
}

function saveStationPB() {
  if (!activeStation) return;
  const input = document.getElementById('station-modal-input');
  const val = input?.value?.trim();
  if (!val) { showToast('Please enter a time.', 'red', 'ERROR'); return; }
  AlfredData.update(d => {
    d.training.stationPBs[activeStation.id] = { time: val, date: new Date().toISOString() };
  });
  closeModal('station-modal');
  showToast(`${activeStation.name} PB saved: ${val}`, 'green', 'PB RECORDED');
  renderTraining();
}

/* ============================================================
   STUDIES PAGE RENDER
   ============================================================ */
let activePoWeek = 1;

function renderStudies() {
  const d = AlfredData.get();
  renderPMPCourse(d);
  renderStreakCalendar(d);
  renderMockScores(d);
  renderPOCourse(d);
  renderBuildLog(d);
  const btn = document.getElementById('mark-studied-btn');
  if (btn) {
    const done = isStudiedToday(d);
    btn.textContent = done ? '✓ Studied Today' : '[ MARK TODAY AS STUDIED ]';
    btn.className = 'btn-mark-studied' + (done ? ' done-today' : '');
    btn.onclick = done ? null : markStudiedToday;
  }
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function generateStudyPlan(examDate, completedChapters) {
  const today = new Date(); today.setHours(0,0,0,0);
  const exam  = new Date(examDate + 'T00:00:00'); exam.setHours(0,0,0,0);
  const daysLeft = Math.ceil((exam - today) / (1000*60*60*24));
  if (daysLeft <= 0) return [];

  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const remaining = PMP_CHAPTERS.filter(ch => !(completedChapters || []).includes(ch.id));
  if (!remaining.length) return [];

  const chapPerWeek = Math.ceil(remaining.length / Math.max(1, weeksLeft - (daysLeft > 14 ? 1 : 0)));
  const contentWeeks = [];
  let idx = 0;

  for (let w = 0; w < weeksLeft && idx < remaining.length; w++) {
    const wStart = new Date(today); wStart.setDate(today.getDate() + w * 7);
    const wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate() + 6);
    const slice  = remaining.slice(idx, idx + chapPerWeek);
    idx += chapPerWeek;
    const isCurrent = wStart <= today && today <= wEnd;
    const isPast    = wEnd < today;
    contentWeeks.push({
      weekNum: w + 1,
      startDate: wStart.toISOString().slice(0,10),
      endDate:   wEnd.toISOString().slice(0,10),
      chapters:  slice,
      status:    isPast ? 'past' : isCurrent ? 'current' : 'upcoming',
    });
  }

  // Final review week before exam
  if (daysLeft > 14) {
    const revStart = new Date(exam); revStart.setDate(exam.getDate() - 7);
    const isCurrent = revStart <= today && today <= exam;
    contentWeeks.push({
      weekNum:   contentWeeks.length + 1,
      startDate: revStart.toISOString().slice(0,10),
      endDate:   examDate,
      chapters:  [],
      isReview:  true,
      status:    revStart <= today ? 'current' : 'upcoming',
    });
  }

  return contentWeeks;
}

function renderPMPCourse(d) {
  const completedChapters = d.studies.pmp.completedChapters || [];
  const completedLessons  = d.studies.pmp.completedLessons  || [];
  const examDate = d.settings.pmpExamDate;

  const totalLessons = PMP_CHAPTERS.reduce((a, ch) => a + ch.lessons.length, 0);
  const doneLessons  = completedLessons.length;
  const donePct = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;

  let daysToExam = null;
  if (examDate) {
    const today = new Date(); today.setHours(0,0,0,0);
    const exam  = new Date(examDate + 'T00:00:00'); exam.setHours(0,0,0,0);
    daysToExam = Math.ceil((exam - today) / (1000*60*60*24));
  }

  // ── Course hero ──
  const hero = document.getElementById('pmp-course-hero');
  if (hero) {
    const countdownHtml = daysToExam !== null
      ? `<div class="pmp-exam-countdown ${daysToExam <= 14 ? 'urgent' : ''}">
           <div class="pmp-countdown-num">${daysToExam > 0 ? daysToExam : '0'}</div>
           <div class="pmp-countdown-label">${daysToExam > 0 ? 'days to exam' : 'EXAM DAY'}</div>
           <div class="pmp-countdown-date">${new Date(examDate + 'T00:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
         </div>`
      : `<div class="pmp-exam-countdown no-date">
           <div class="pmp-countdown-label">No exam date set</div>
           <button class="pmp-set-date-btn" onclick="openSettings()">+ Set Exam Date</button>
         </div>`;
    hero.innerHTML = `
      <div class="pmp-hero-inner">
        <div class="pmp-hero-left">
          <div class="pmp-course-label">Certification Course</div>
          <div class="pmp-course-name">Project Management Professional</div>
          <div class="pmp-course-sub">PMBOK 7th Edition · ${totalLessons} lessons · ${PMP_CHAPTERS.length} knowledge areas</div>
          <div class="pmp-progress-bar"><div class="pmp-progress-fill" style="width:${donePct}%"></div></div>
          <div class="pmp-progress-label">${doneLessons} / ${totalLessons} lessons complete · ${donePct}%</div>
        </div>
        ${countdownHtml}
      </div>`;
  }

  // ── Study plan ──
  const planPanel = document.getElementById('pmp-study-plan-panel');
  const planContainer = document.getElementById('pmp-study-plan');
  if (planPanel && planContainer) {
    if (examDate) {
      planPanel.style.display = '';
      const weeks = generateStudyPlan(examDate, completedChapters);
      if (weeks.length) {
        planContainer.innerHTML = `<div class="study-plan-inner">` + weeks.map(week => {
          const chipsHtml = week.isReview
            ? '<span class="study-chip review-chip">Mock Exams &amp; Review</span>'
            : week.chapters.map(ch => `<span class="study-chip ${completedChapters.includes(ch.id) ? 'done' : ''}">${ch.name}</span>`).join('');
          return `<div class="study-week-card ${week.status}">
            <div class="study-week-head">
              <span class="study-week-num">Week ${week.weekNum}</span>
              <span class="study-week-dates">${formatShortDate(week.startDate)} – ${formatShortDate(week.endDate)}</span>
              ${week.status === 'current' ? '<span class="study-week-badge">CURRENT WEEK</span>' : ''}
            </div>
            <div class="study-week-chips">${chipsHtml}</div>
          </div>`;
        }).join('') + '</div>';
      } else {
        planContainer.innerHTML = '<div style="padding:14px 16px;font-size:11px;color:var(--green)">All chapters complete, Sir. Focus on mock examinations.</div>';
      }
    } else {
      planPanel.style.display = 'none';
    }
  }

  // ── Curriculum accordion ──
  const curriculum = document.getElementById('pmp-curriculum');
  if (curriculum) {
    curriculum.innerHTML = PMP_CHAPTERS.map((ch, i) => {
      const chDone = completedChapters.includes(ch.id);
      const lessonsDone = ch.lessons.filter(l => completedLessons.includes(l.id)).length;
      const chPct = Math.round((lessonsDone / ch.lessons.length) * 100);
      const badgeHtml = chDone
        ? '<span class="ch-badge complete">✓ COMPLETE</span>'
        : lessonsDone > 0 ? `<span class="ch-badge in-progress">${chPct}%</span>`
        : '<span class="ch-badge not-started">NOT STARTED</span>';
      const lessonRows = ch.lessons.map(l => {
        const lDone = completedLessons.includes(l.id);
        return `<div class="lesson-row ${lDone ? 'done' : ''}" onclick="toggleLesson('${l.id}','${ch.id}')">
          <div class="lesson-check">${lDone ? '✓' : ''}</div>
          <div class="lesson-name">${l.name}</div>
          <div class="lesson-duration">${l.duration} min</div>
        </div>`;
      }).join('');
      return `<div class="chapter-section ${chDone ? 'complete' : ''}" id="chapter-section-${ch.id}">
        <div class="chapter-header" onclick="toggleChapterSection('${ch.id}')">
          <div class="chapter-num">${String(i+1).padStart(2,'0')}</div>
          <div class="chapter-info">
            <div class="chapter-name">${ch.name}</div>
            <div class="chapter-meta">${ch.lessons.length} lessons · ${ch.duration} min · ${lessonsDone}/${ch.lessons.length} done</div>
          </div>
          ${badgeHtml}
          <div class="chapter-chevron">›</div>
        </div>
        <div class="chapter-lessons" id="lessons-${ch.id}" style="display:none">
          ${lessonRows}
          <div class="chapter-complete-row">
            <button class="btn-mark-chapter ${chDone ? 'done' : ''}" onclick="toggleChapter('${ch.id}')">
              ${chDone ? '✓ Chapter Marked Complete' : 'Mark Chapter as Complete'}
            </button>
          </div>
        </div>
      </div>`;
    }).join('');
  }
}

function toggleChapterSection(id) {
  const lessonsEl = document.getElementById(`lessons-${id}`);
  const section   = document.getElementById(`chapter-section-${id}`);
  if (!lessonsEl) return;
  const isOpen = lessonsEl.style.display !== 'none';
  lessonsEl.style.display = isOpen ? 'none' : 'block';
  if (section) section.classList.toggle('expanded', !isOpen);
}

function toggleLesson(lessonId, chapterId) {
  AlfredData.update(d => {
    if (!d.studies.pmp.completedLessons) d.studies.pmp.completedLessons = [];
    const idx = d.studies.pmp.completedLessons.indexOf(lessonId);
    if (idx > -1) {
      d.studies.pmp.completedLessons.splice(idx, 1);
    } else {
      d.studies.pmp.completedLessons.push(lessonId);
      // Auto-complete chapter when all lessons done
      const ch = PMP_CHAPTERS.find(c => c.id === chapterId);
      if (ch && ch.lessons.every(l => d.studies.pmp.completedLessons.includes(l.id))) {
        if (!d.studies.pmp.completedChapters.includes(chapterId)) {
          d.studies.pmp.completedChapters.push(chapterId);
          showToast(`${ch.name} — all lessons complete.`, 'gold', 'CHAPTER UNLOCKED');
        }
      }
    }
  });
  renderStudies();
}

function toggleChapter(id) {
  AlfredData.update(d => {
    const idx = d.studies.pmp.completedChapters.indexOf(id);
    if (idx > -1) d.studies.pmp.completedChapters.splice(idx, 1);
    else d.studies.pmp.completedChapters.push(id);
  });
  renderStudies();
}

function renderStreakCalendar(d) {
  const container = document.getElementById('streak-calendar');
  if (!container) return;
  const streak = d.studies.pmp.studyStreak || 0;
  const streakEl = document.getElementById('streak-count');
  if (streakEl) streakEl.textContent = streak;

  // Build last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    days.push(dt.toISOString().slice(0, 10));
  }
  // We only know last study date + streak, so approximate
  const lastStudy = d.studies.pmp.lastStudyDate;
  const studiedDays = new Set();
  if (lastStudy) {
    for (let i = 0; i < streak; i++) {
      const dt = new Date(lastStudy);
      dt.setDate(dt.getDate() - i);
      studiedDays.add(dt.toISOString().slice(0, 10));
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  container.innerHTML = days.map(day => `
    <div class="streak-cell ${studiedDays.has(day) ? 'studied' : ''} ${day === today ? 'today-cell' : ''}" title="${day}"></div>
  `).join('');
}

function markStudiedToday() {
  AlfredData.update(d => {
    const today = new Date().toISOString().slice(0, 10);
    const last = d.studies.pmp.lastStudyDate;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const ydStr = yesterday.toISOString().slice(0, 10);
    if (last === ydStr || last === today) {
      if (last !== today) d.studies.pmp.studyStreak = (d.studies.pmp.studyStreak || 0) + 1;
    } else {
      d.studies.pmp.studyStreak = 1;
    }
    d.studies.pmp.lastStudyDate = today;
  });
  showToast('PMP study logged. Streak updated, Sir.', 'gold', 'STUDY LOGGED');
  renderStudies();
  checkAchievements();
}

function renderMockScores(d) {
  const container = document.getElementById('score-entries');
  if (!container) return;
  const scores = (d.studies.pmp.mockScores || []).slice(-6).reverse();
  if (!scores.length) {
    container.innerHTML = '<div style="padding:10px 4px;font-size:11px;color:var(--muted)">No scores yet. Add your first mock exam result below.</div>';
    return;
  }
  container.innerHTML = scores.map(s => {
    const pct = Math.round((s.score / s.total) * 100);
    const cls = pct >= 75 ? 'good' : pct >= 60 ? 'ok' : 'low';
    return `
      <div class="score-entry">
        <div class="score-date">${new Date(s.date).toLocaleDateString('en-GB', {day:'numeric',month:'short'})}</div>
        <div class="score-value ${cls}">${s.score}/${s.total}</div>
        <div class="score-pct">${pct}%</div>
      </div>`;
  }).join('');
}

function addMockScore() {
  const scoreEl = document.getElementById('score-val');
  const totalEl = document.getElementById('score-total');
  const score = parseInt(scoreEl?.value);
  const total = parseInt(totalEl?.value) || 180;
  if (!score || score <= 0 || score > total) { showToast('Please enter a valid score.', 'red', 'ERROR'); return; }
  AlfredData.update(d => {
    d.studies.pmp.mockScores.push({ date: new Date().toISOString().slice(0,10), score, total });
  });
  scoreEl.value = ''; if (totalEl) totalEl.value = '';
  const pct = Math.round((score / total) * 100);
  showToast(`Mock exam logged: ${score}/${total} (${pct}%). ${pct >= 75 ? 'Excellent, Sir.' : pct >= 60 ? 'Satisfactory. Keep going.' : 'Below target. Review weak areas.'}`, pct >= 75 ? 'green' : 'blue', 'SCORE LOGGED');
  renderStudies();
}

function renderPOCourse(d) {
  const completedTopics = d.studies.po.completedTopics || [];
  const totalTopics = PO_WEEKS.reduce((a, w) => a + w.topics.length, 0);
  const doneTopics  = completedTopics.length;
  const donePct     = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;
  const currentWeek = d.studies.po.currentWeek || 1;
  const currentWeekData = PO_WEEKS[currentWeek - 1] || PO_WEEKS[0];

  // Course hero
  const hero = document.getElementById('po-course-hero');
  if (hero) {
    hero.innerHTML = `
      <div class="pmp-hero-inner">
        <div class="pmp-hero-left">
          <div class="pmp-course-label">Learning Roadmap</div>
          <div class="pmp-course-name">Technical Product Owner</div>
          <div class="pmp-course-sub">${PO_WEEKS.length} weeks · ${totalTopics} topics · Agile · Technical literacy · AI tools</div>
          <div class="pmp-progress-bar">
            <div class="pmp-progress-fill" style="width:${donePct}%;background:linear-gradient(90deg,var(--phase2),#7ab4ff)"></div>
          </div>
          <div class="pmp-progress-label" style="color:var(--phase2)">${doneTopics} / ${totalTopics} topics complete · ${donePct}%</div>
        </div>
        <div class="pmp-exam-countdown" style="border-color:rgba(96,165,250,0.3);background:rgba(96,165,250,0.08)">
          <div class="pmp-countdown-num" style="color:var(--phase2)">${currentWeek}</div>
          <div class="pmp-countdown-label">current week</div>
          <div class="pmp-countdown-date">${currentWeekData.title}</div>
        </div>
      </div>`;
  }

  // Curriculum accordion
  const curriculum = document.getElementById('po-curriculum');
  if (curriculum) {
    curriculum.innerHTML = PO_WEEKS.map(w => {
      const topicIds = w.topics.map(t => `${w.week}_${t}`);
      const doneCnt  = topicIds.filter(id => completedTopics.includes(id)).length;
      const wDone    = doneCnt === w.topics.length;
      const wPct     = Math.round((doneCnt / w.topics.length) * 100);
      const badgeHtml = wDone
        ? '<span class="ch-badge complete">✓ COMPLETE</span>'
        : doneCnt > 0 ? `<span class="ch-badge in-progress" style="border-color:rgba(96,165,250,0.3);color:var(--phase2)">${wPct}%</span>`
        : '<span class="ch-badge not-started">NOT STARTED</span>';
      const topicRows = w.topics.map(t => {
        const topicId = `${w.week}_${t}`;
        const tDone = completedTopics.includes(topicId);
        return `<div class="lesson-row ${tDone ? 'done' : ''}" onclick="togglePoTopic('${topicId}',${w.week})">
          <div class="lesson-check">${tDone ? '✓' : ''}</div>
          <div class="lesson-name">${t}</div>
        </div>`;
      }).join('');
      return `<div class="chapter-section ${wDone ? 'complete' : ''}" id="po-section-${w.week}">
        <div class="chapter-header" onclick="togglePoSection(${w.week})">
          <div class="chapter-num">W${String(w.week).padStart(2,'0')}</div>
          <div class="chapter-info">
            <div class="chapter-name">${w.title}</div>
            <div class="chapter-meta">${w.topics.length} topics · ${doneCnt}/${w.topics.length} done</div>
          </div>
          ${badgeHtml}
          <div class="chapter-chevron">›</div>
        </div>
        <div class="chapter-lessons" id="po-lessons-${w.week}" style="display:none">
          ${topicRows}
        </div>
      </div>`;
    }).join('');
  }
}

function togglePoSection(week) {
  const lessonsEl = document.getElementById(`po-lessons-${week}`);
  const section   = document.getElementById(`po-section-${week}`);
  if (!lessonsEl) return;
  const isOpen = lessonsEl.style.display !== 'none';
  lessonsEl.style.display = isOpen ? 'none' : 'block';
  if (section) section.classList.toggle('expanded', !isOpen);
}

function togglePoTopic(id, week) {
  AlfredData.update(d => {
    const idx = d.studies.po.completedTopics.indexOf(id);
    if (idx > -1) d.studies.po.completedTopics.splice(idx, 1);
    else {
      d.studies.po.completedTopics.push(id);
      if (week) d.studies.po.currentWeek = week;
    }
  });
  renderStudies();
}

/* ── Vibe Coding Build Log ── */
let activeBuildTags = new Set();

function renderBuildLog(d) {
  const entries = (d.studies.po.buildEntries || []).slice().reverse();
  const container = document.getElementById('build-log-entries');
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = '<div style="padding:16px 16px 4px;font-size:11px;color:var(--muted)">No builds logged yet, Sir. Ship something and tell me about it.</div>';
    return;
  }
  container.innerHTML = entries.map(e => {
    const tagHtml = (e.tags || []).map(t => `<span class="build-tag">${t}</span>`).join('');
    const date = new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
    return `<div class="build-entry-card">
      <div class="build-entry-head">
        <div class="build-entry-name">${escapeHtml(e.project)}</div>
        <div class="build-entry-date">${date}</div>
        <button class="build-delete-btn" onclick="deleteBuildEntry('${e.id}')">×</button>
      </div>
      ${e.desc ? `<div class="build-entry-desc">${escapeHtml(e.desc)}</div>` : ''}
      ${tagHtml ? `<div class="build-entry-tags">${tagHtml}</div>` : ''}
    </div>`;
  }).join('');
}

function addBuildEntry() {
  const projectEl = document.getElementById('build-project');
  const descEl    = document.getElementById('build-desc');
  const project   = projectEl?.value?.trim();
  const desc      = descEl?.value?.trim() || '';
  if (!project) { showToast('Project name required, Sir.', 'red', 'ERROR'); return; }
  const entry = {
    id:      Date.now().toString(),
    date:    new Date().toISOString().slice(0,10),
    project, desc,
    tags:    [...activeBuildTags],
  };
  AlfredData.update(d => {
    if (!d.studies.po.buildEntries) d.studies.po.buildEntries = [];
    d.studies.po.buildEntries.push(entry);
  });
  if (projectEl) projectEl.value = '';
  if (descEl)    descEl.value = '';
  activeBuildTags.clear();
  document.querySelectorAll('.build-tag-btn.active').forEach(b => b.classList.remove('active'));
  showToast(`Build logged: ${project}. One notes your productivity with quiet satisfaction, Sir.`, 'cyan', 'BUILD LOGGED');
  renderStudies();
}

function deleteBuildEntry(id) {
  AlfredData.update(d => {
    d.studies.po.buildEntries = (d.studies.po.buildEntries || []).filter(e => e.id !== id);
  });
  renderStudies();
}

function toggleBuildTag(tag) {
  if (activeBuildTags.has(tag)) activeBuildTags.delete(tag);
  else activeBuildTags.add(tag);
  document.querySelectorAll('.build-tag-btn').forEach(b => {
    b.classList.toggle('active', activeBuildTags.has(b.dataset.tag));
  });
}

/* ============================================================
   CHAT PAGE RENDER
   ============================================================ */
function renderChat() {
  const d = AlfredData.get();
  const history = d.chat.history || [];
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.innerHTML = history.map(msg => buildMsgHTML(msg.role, msg.text, msg.ts)).join('');

  // If no history, add greeting
  if (!history.length) {
    const greeting = Alfred.loadGreeting();
    appendChatMsg('alfred', greeting);
  } else {
    container.scrollTop = container.scrollHeight;
  }
}

function buildMsgHTML(role, text, ts) {
  const time = ts ? new Date(ts).toLocaleTimeString('en-GB', {hour:'2-digit',minute:'2-digit'}) : '';
  if (role === 'alfred') {
    return `
      <div class="chat-msg alfred">
        <div class="msg-avatar msg-av-alfred">A</div>
        <div>
          <div class="msg-bubble alfred">${escapeHtml(text)}</div>
          <span class="msg-time">Alfred · ${time}</span>
        </div>
      </div>`;
  }
  return `
    <div class="chat-msg user">
      <div class="msg-avatar msg-av-user">S</div>
      <div>
        <div class="msg-bubble user">${escapeHtml(text)}</div>
        <span class="msg-time" style="text-align:right;display:block">Sir · ${time}</span>
      </div>
    </div>`;
}

function appendChatMsg(role, text) {
  const ts = new Date().toISOString();
  AlfredData.update(d => {
    if (!d.chat.history) d.chat.history = [];
    d.chat.history.push({ role, text, ts });
    if (d.chat.history.length > 80) d.chat.history = d.chat.history.slice(-80);
  });
  const container = document.getElementById('chat-messages');
  if (container) {
    const el = document.createElement('div');
    el.innerHTML = buildMsgHTML(role, text, ts);
    container.appendChild(el.firstElementChild);
    container.scrollTop = container.scrollHeight;
  }
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input?.value?.trim();
  if (!text) return;
  input.value = '';
  appendChatMsg('user', text);
  showTyping();
  setTimeout(() => {
    hideTyping();
    const response = Alfred.respond(text);
    appendChatMsg('alfred', response);
  }, 900 + Math.random() * 600);
}

function sendQuick(prompt) {
  const input = document.getElementById('chat-input');
  if (input) input.value = prompt;
  sendChat();
}

function showTyping() {
  const el = document.getElementById('alfred-typing');
  if (el) { el.classList.add('visible'); document.getElementById('chat-messages')?.scrollTo(0, 9999); }
}
function hideTyping() {
  const el = document.getElementById('alfred-typing');
  if (el) el.classList.remove('visible');
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ============================================================
   CODEX PAGE RENDER
   ============================================================ */
let codexSubActive = 'roadmap';

function switchCodexTab(name) {
  codexSubActive = name;
  document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.codex-sub').forEach(s => s.classList.remove('active'));
  document.querySelector(`.codex-tab[data-tab="${name}"]`)?.classList.add('active');
  document.getElementById(`codex-${name}`)?.classList.add('active');
}

function renderCodex() {
  renderCodexRoadmap();
  renderCodexYoutube();
}

function renderCodexRoadmap() {
  const container = document.getElementById('codex-phases');
  if (!container) return;
  container.innerHTML = PHASES.map(p => `
    <div class="codex-phase-row">
      <div class="codex-phase-sidebar" style="border-left-color:${p.color}">
        <div>
          <div class="codex-phase-label">PHASE 0${p.num}</div>
          <div class="codex-phase-name" style="color:${p.color}">${p.full}</div>
          <div class="codex-phase-months">${p.months}</div>
        </div>
        <div class="codex-phase-bg-num">${p.num}</div>
      </div>
      <div class="codex-phase-body">
        <p class="codex-phase-focus">${p.focus}</p>
        <div class="codex-pillars">
          ${p.pillars.map(pi => `
            <div class="codex-pillar">
              <div class="codex-pillar-tag" style="color:${pi.color}">${pi.title}</div>
              <div class="codex-pillar-body">${pi.body}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`).join('');
}

function renderCodexYoutube() {
  const tagMap = { p1: 'vtag-p1', p2: 'vtag-p2', p3: 'vtag-p3', p4: 'vtag-p4', p5: 'vtag-p5' };
  function card(v) {
    return `<div class="codex-video-card v-${v.type}">
      <div class="codex-video-body">
        <div class="codex-video-channel">${v.channel}</div>
        <div class="codex-video-title">${v.title}</div>
        <div class="codex-video-desc">${v.desc}</div>
        <div class="codex-video-meta">
          <div class="video-tags">${v.tags.map(t => `<span class="vtag ${tagMap[t] || ''}">${t}</span>`).join('')}</div>
          <a class="watch-btn" href="${v.url}" target="_blank" rel="noopener">▶ Watch</a>
        </div>
      </div>
    </div>`;
  }
  // Split containers (used in index.html)
  const pilatesEl = document.getElementById('codex-videos-pilates');
  const hyroxEl   = document.getElementById('codex-videos-hyrox');
  if (pilatesEl) pilatesEl.innerHTML = YOUTUBE_VIDEOS.filter(v => v.type === 'pilates').map(card).join('');
  if (hyroxEl)   hyroxEl.innerHTML   = YOUTUBE_VIDEOS.filter(v => v.type !== 'pilates').map(card).join('');
}

/* ============================================================
   SETTINGS MODAL
   ============================================================ */
function openSettings() {
  const d = AlfredData.get();
  const modal = document.getElementById('settings-modal');
  const dateInput  = document.getElementById('settings-race-date');
  const pmpInput   = document.getElementById('settings-pmp-date');
  const phaseSelect = document.getElementById('settings-phase');
  if (dateInput  && d.settings.raceDate)    dateInput.value  = d.settings.raceDate;
  if (pmpInput   && d.settings.pmpExamDate) pmpInput.value   = d.settings.pmpExamDate;
  if (phaseSelect) phaseSelect.value = d.settings.currentPhase || 1;
  if (modal) modal.classList.add('visible');
}

function saveSettings() {
  const date    = document.getElementById('settings-race-date')?.value;
  const pmpDate = document.getElementById('settings-pmp-date')?.value;
  const phase   = parseInt(document.getElementById('settings-phase')?.value) || 1;
  AlfredData.update(d => {
    if (date)    d.settings.raceDate    = date;
    if (pmpDate) d.settings.pmpExamDate = pmpDate;
    d.settings.currentPhase = phase;
    d.settings.setupDone = true;
  });
  closeModal('settings-modal');
  closeModal('setup-modal');
  showToast('Settings saved. The System has been updated, Sir.', 'blue', 'SETTINGS');
  renderDashboard();
  renderStudies();
}

function confirmReset() {
  if (confirm('Reset ALL data? This cannot be undone, Sir.')) {
    AlfredData.reset();
    showToast('All data has been cleared. A fresh start, Sir.', 'red', 'SYSTEM RESET');
    setTimeout(() => location.reload(), 1000);
  }
}

/* ============================================================
   CHARACTER SHEET
   ============================================================ */
function renderCharacter() {
  const d    = AlfredData.get();
  const char = d.character || {};

  if (!char.setupDone) {
    const el = document.getElementById('char-panel-inner');
    if (el) el.innerHTML = `
      <div class="char-empty-state">
        <div class="char-empty-title">Character Not Yet Forged</div>
        <div>Answer a few questions to generate your D&D-style character sheet, Sir.</div>
        <button class="char-create-btn" onclick="openCharModal()">⚔ Create Character</button>
      </div>`;
    return;
  }

  const sessions      = (d.training.completedSessions || []).length;
  const trainingLvl   = calcLevel(sessions);
  const knowledgeLvl  = calcKnowledgeLevel(d);
  const overallLvl    = calcOverallLevel(d);
  const overallXP     = calcOverallXP(d);
  const xpInLevel     = overallXP - (overallLvl - 1) * 300;
  const xpPct         = Math.min(100, Math.round((xpInLevel / 300) * 100));
  const knowledgeXP   = calcKnowledgeXP(d);
  const knowledgeXPIn = knowledgeXP - (knowledgeLvl - 1) * 200;
  const stats         = calcStats(d);
  const charClass     = char.class || deriveClass(char.career);
  const charName      = char.name || 'Sir';

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  const setHTML = (id, val) => { const e = document.getElementById(id); if (e) e.innerHTML = val; };

  setEl('char-avatar',       charName.charAt(0).toUpperCase());
  setEl('char-class-label',  charClass.toUpperCase());
  setEl('char-name',         charName);
  setEl('char-meta',         `Human · ${char.age ? 'Age ' + char.age + ' · ' : ''}Level ${overallLvl}`);
  setEl('char-career-line',  char.career || '');
  setEl('char-overall-level', overallLvl);
  setEl('char-xp-label',    `${overallXP} XP total`);
  const xpFillEl = document.getElementById('char-xp-fill');
  if (xpFillEl) xpFillEl.style.width = xpPct + '%';

  // Ability scores
  const abilityEl = document.getElementById('ability-scores');
  if (abilityEl) {
    const defs = [
      { key:'str', label:'STR', desc:'Training sessions', color:'var(--strength)' },
      { key:'dex', label:'DEX', desc:'Speed & run work',  color:'var(--run)' },
      { key:'con', label:'CON', desc:'Streak consistency',color:'var(--green)' },
      { key:'int', label:'INT', desc:'Study progress',    color:'var(--blue)' },
      { key:'wis', label:'WIS', desc:'Total XP earned',   color:'var(--purple)' },
      { key:'cha', label:'CHA', desc:'Natural presence',  color:'var(--alfred-gold)' },
    ];
    abilityEl.innerHTML = defs.map(s => {
      const val = stats[s.key]; const mod = modifier(val);
      return `<div class="ability-box">
        <div class="ability-val" style="color:${s.color}">${val}</div>
        <div class="ability-label" style="color:${s.color}">${s.label}</div>
        <div class="ability-mod">${modStr(mod)}</div>
        <div class="ability-desc">${s.desc}</div>
      </div>`;
    }).join('');
  }

  // Level breakdown
  const lvlEl = document.getElementById('level-breakdown');
  if (lvlEl) {
    const rows = [
      { label: 'Training Level', lvl: trainingLvl, pct: calcXPPercent(sessions), sub: `${sessions} sessions · ${10-(sessions%10)} to next`, color: 'var(--strength)' },
      { label: 'Knowledge Level', lvl: knowledgeLvl, pct: Math.min(100,Math.round((knowledgeXPIn/200)*100)), sub: `${knowledgeXP} XP · ${Math.max(0,knowledgeLvl*200-knowledgeXP)} to next`, color: 'var(--gold)' },
      { label: 'Overall Level',  lvl: overallLvl,  pct: xpPct, sub: `${overallXP} total XP`, color: 'var(--blue)', overall: true },
    ];
    lvlEl.innerHTML = rows.map(r => `
      <div class="level-row${r.overall ? ' overall' : ''}">
        <div class="level-row-label">${r.label}</div>
        <div class="level-row-num" style="color:${r.color}">LV ${r.lvl}</div>
        <div class="level-row-bar"><div class="level-bar-fill" style="width:${r.pct}%;background:${r.color}"></div></div>
        <div class="level-row-sub">${r.sub}</div>
      </div>`).join('');
  }

  // Proficiencies
  const profEl = document.getElementById('proficiencies-list');
  if (profEl) {
    const phase    = d.settings.currentPhase || 1;
    const chapters = (d.studies.pmp.completedChapters || []).length;
    const poWeek   = d.studies.po.currentWeek || 1;
    const builds   = (d.studies.po.buildEntries || []).length;
    const runLogs  = (d.training.runLogs || []).length;
    const streak   = d.studies.pmp.studyStreak || 0;
    const profs = [
      { icon:'⚔', name:`Hyrox Training — Phase ${phase}`, color:'var(--strength)' },
      { icon:'📚', name:`PMP Certification — ${chapters}/10 chapters complete`, color:'var(--gold)' },
      { icon:'🎯', name:`Technical PO Roadmap — Week ${poWeek}`, color:'var(--phase2)' },
    ];
    if (builds > 0)    profs.push({ icon:'⌨', name:`Vibe Coding — ${builds} builds shipped`, color:'var(--cyan)' });
    if (streak >= 7)   profs.push({ icon:'🔥', name:`Iron Will — ${streak}-day study streak`, color:'var(--purple)' });
    if (runLogs > 0)   profs.push({ icon:'🏃', name:`Sprint Protocol — ${runLogs} runs logged`, color:'var(--run)' });
    if (overallLvl >= 5) profs.push({ icon:'⭐', name:`Veteran — Level ${overallLvl} achieved`, color:'var(--gold)' });
    profEl.innerHTML = profs.map(p => `
      <div class="prof-row">
        <span class="prof-icon">${p.icon}</span>
        <span class="prof-name">${p.name}</span>
        <span class="prof-check" style="color:${p.color}">✓</span>
      </div>`).join('');
  }

  // Background
  const bgEl = document.getElementById('char-background');
  if (bgEl) {
    const physCols = [];
    if (char.height) physCols.push(`<div class="char-phys-item"><div class="char-phys-label">Height</div><div class="char-phys-val">${char.height} cm</div></div>`);
    if (char.weight) physCols.push(`<div class="char-phys-item"><div class="char-phys-label">Weight</div><div class="char-phys-val">${char.weight} kg</div></div>`);
    if (char.age)    physCols.push(`<div class="char-phys-item"><div class="char-phys-label">Age</div><div class="char-phys-val">${char.age}</div></div>`);
    const hobbiesHtml  = char.hobbies ? `<div class="char-hobbies"><b>Hobbies:</b> ${escapeHtml(char.hobbies)}</div>` : '';
    const backstoryHtml = char.backstory ? `<div class="char-backstory-text">${escapeHtml(char.backstory)}</div>` : '';
    bgEl.innerHTML = `${physCols.length ? `<div class="char-phys-grid">${physCols.join('')}</div>` : ''}${hobbiesHtml}${backstoryHtml}`;
  }
}

function openCharModal() {
  const d    = AlfredData.get();
  const char = d.character || {};
  const vals = {
    'char-name-input':      char.name     || '',
    'char-career-input':    char.career   || '',
    'char-age-input':       char.age      || '',
    'char-height-input':    char.height   || '',
    'char-weight-input':    char.weight   || '',
    'char-hobbies-input':   char.hobbies  || '',
    'char-backstory-input': char.backstory || '',
  };
  Object.entries(vals).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.value = v; });
  const chaInput = document.getElementById('char-cha-input');
  if (chaInput) { chaInput.value = char.chaScore || 10; updateChaDisplay(); }
  document.getElementById('char-modal')?.classList.add('visible');
}

function updateChaDisplay() {
  const v   = parseInt(document.getElementById('char-cha-input')?.value) || 10;
  const mod = modifier(v);
  const el  = document.getElementById('cha-display');
  if (el) el.innerHTML = `${v} <span>(${modStr(mod)})</span>`;
}

function saveChar() {
  const name      = document.getElementById('char-name-input')?.value?.trim() || 'Sir';
  const career    = document.getElementById('char-career-input')?.value?.trim() || '';
  const age       = parseInt(document.getElementById('char-age-input')?.value) || null;
  const height    = parseInt(document.getElementById('char-height-input')?.value) || null;
  const weight    = parseInt(document.getElementById('char-weight-input')?.value) || null;
  const hobbies   = document.getElementById('char-hobbies-input')?.value?.trim() || '';
  const chaScore  = parseInt(document.getElementById('char-cha-input')?.value) || 10;
  const backstory = document.getElementById('char-backstory-input')?.value?.trim() || '';
  AlfredData.update(d => {
    d.character = { name, career, class: deriveClass(career), age, height, weight, hobbies, chaScore, backstory, setupDone: true };
  });
  closeModal('char-modal');
  showToast(`${name} — ${deriveClass(career)}. Character forged, Sir. The System recognises you.`, 'gold', 'CHARACTER FORGED');
  renderCharacter();
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('visible');
}

/* ============================================================
   SETUP (FIRST RUN)
   ============================================================ */
function openSetup() {
  document.getElementById('setup-modal')?.classList.add('visible');
}

/* ============================================================
   BOOT SCREEN
   ============================================================ */
function runBoot() {
  const lines = ['BUTLER PROTOCOL LOADING...','INITIALIZING SYSTEM...','CALIBRATING TRAINING MODULES...','ENGAGING ALFRED v1.0...'];
  const sub = document.getElementById('boot-sub');
  const bar = document.getElementById('boot-bar-fill');
  const statusEl = document.getElementById('boot-status');
  let i = 0;
  let pct = 0;
  const lineInterval = setInterval(() => {
    if (sub && i < lines.length) sub.textContent = lines[i++];
  }, 380);
  const barInterval = setInterval(() => {
    pct += 2;
    if (bar) bar.style.width = Math.min(pct, 100) + '%';
    if (pct >= 100) clearInterval(barInterval);
  }, 30);
  setTimeout(() => {
    clearInterval(lineInterval);
    if (statusEl) statusEl.textContent = 'READY';
    if (sub) sub.textContent = 'BUTLER PROTOCOL ENGAGED';
  }, 1500);
  setTimeout(() => {
    const boot = document.getElementById('boot-screen');
    if (boot) {
      boot.classList.add('boot-done');
      setTimeout(() => { boot.style.display = 'none'; }, 600);
    }
    const d = AlfredData.get();
    if (!d.settings.setupDone) openSetup();
    renderDashboard();
  }, 2000);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Chat send on Enter
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } });
  }

  // Kick off boot
  runBoot();
  renderCodex();
});
