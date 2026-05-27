/* ============================================================
   ALFRED.JS — Butler AI Chat Engine
   Rule-based intent detection + contextual response system
   ============================================================ */

const Alfred = (() => {

  /* ── Intent patterns ── */
  const INTENTS = [
    { name: 'greeting',       patterns: [/^(hello|hi|hey|good\s*(morning|evening|afternoon|night)|greetings|sup|yo)/i] },
    { name: 'how_am_i',       patterns: [/how\s*(am\s*i|are\s*we|is\s*my|'?s\s*my)\s*(doing|going|progress|training|prep)/i, /status\s*report/i, /progress\s*update/i, /how.*look/i] },
    { name: 'train_today',    patterns: [/what\s*(should|do)\s*i\s*(train|do|work(out)?|exercise)/i, /today('?s)?\s*(session|training|workout|exercise)/i, /train.*today/i] },
    { name: 'pmp_advice',     patterns: [/pmp|project\s*management|exam\s*(tip|advice|help|prep)|study\s*tip/i] },
    { name: 'po_advice',      patterns: [/product\s*owner|po\s*(advice|tip|help|learning|roadmap)|frontend|coding/i] },
    { name: 'motivation',     patterns: [/motivat|inspire|encourage|pump\s*me\s*up|give\s*me.*push|i\s*(feel|am)\s*(tired|exhausted|unmotivated|lazy)/i] },
    { name: 'nutrition',      patterns: [/nutri|eat|food|diet|meal|protein|carb|supplement|creatine|fuel/i] },
    { name: 'race_strategy',  patterns: [/race\s*(strategy|plan|day|tips?|advice|prep)/i, /hyrox\s*(tips?|advice|strategy)/i, /station|sled|skierg|wall\s*ball|rowing|burpee|sandbag|farmer/i] },
    { name: 'race_day',       patterns: [/race\s*day|when.*race|how.*long.*race|countdown/i] },
    { name: 'rest_recovery',  patterns: [/rest|recover|sleep|sore|tired|exhausted|overtraining|tak(e|ing)\s*a\s*day\s*off/i] },
    { name: 'injury',         patterns: [/injur|pain|hurt|knee|back\s*pain|shin|ache|sore\s+(knee|back|shin|hip)/i] },
    { name: 'pilates',        patterns: [/pilates/i] },
    { name: 'thanks',         patterns: [/thank|cheers|appreciate|brilliant|great|perfect|excellent/i] },
    { name: 'joke',           patterns: [/joke|funny|laugh|humor|entertain/i] },
    { name: 'who_are_you',    patterns: [/who\s*are\s*you|what\s*are\s*you|tell\s*me\s*about\s*yourself/i] },
    { name: 'week_plan',      patterns: [/this\s*week|weekly\s*plan|plan\s*for\s*the\s*week|schedule/i] },
  ];

  /* ── Context builder ── */
  function buildContext() {
    const data = window.AlfredData ? window.AlfredData.get() : null;
    if (!data) return {};

    const now = new Date();
    const hour = now.getHours();
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];

    let timeGreeting = 'Good day';
    if (hour < 12)      timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else if (hour < 21) timeGreeting = 'Good evening';
    else                timeGreeting = 'Good evening';

    // Days to race
    let daysToRace = null;
    let raceDateStr = null;
    if (data.settings.raceDate) {
      const race = new Date(data.settings.raceDate);
      const diff = Math.ceil((race - now) / (1000 * 60 * 60 * 24));
      daysToRace = diff;
      raceDateStr = race.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // PMP stats
    const scores = data.studies.pmp.mockScores || [];
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + (b.score / b.total * 100), 0) / scores.length)
      : null;
    const completedChapters = (data.studies.pmp.completedChapters || []).length;
    const streak = data.studies.pmp.studyStreak || 0;

    // Training
    const sessions = (data.training.completedSessions || []).length;
    const phase = data.settings.currentPhase || 1;
    const level = Math.floor(sessions / 10) + 1;

    // PO
    const poTopics = (data.studies.po.completedTopics || []).length;

    // Days to PMP exam
    let daysToExam = null;
    let examDateStr = null;
    if (data.settings.pmpExamDate) {
      const exam = new Date(data.settings.pmpExamDate);
      const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
      daysToExam = diff;
      examDateStr = exam.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    return { timeGreeting, dayName, daysToRace, raceDateStr, daysToExam, examDateStr, avgScore, completedChapters, streak, sessions, phase, level, poTopics, hour };
  }

  /* ── Utility: pick random from array ── */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ── Utility: inject context variables ── */
  function inject(template, ctx) {
    return template
      .replace(/{timeGreeting}/g,       ctx.timeGreeting || 'Good day')
      .replace(/{dayName}/g,            ctx.dayName || 'today')
      .replace(/{daysToRace}/g,         ctx.daysToRace != null ? ctx.daysToRace : 'an unknown number of')
      .replace(/{raceDateStr}/g,        ctx.raceDateStr || 'your target date')
      .replace(/{avgScore}/g,           ctx.avgScore != null ? ctx.avgScore + '%' : 'not yet recorded')
      .replace(/{completedChapters}/g,  ctx.completedChapters)
      .replace(/{daysToExam}/g,         ctx.daysToExam != null ? ctx.daysToExam : 'an unspecified number of')
      .replace(/{examDateStr}/g,        ctx.examDateStr || 'your target exam date')
      .replace(/{streak}/g,             ctx.streak)
      .replace(/{sessions}/g,           ctx.sessions)
      .replace(/{phase}/g,              ctx.phase)
      .replace(/{level}/g,              ctx.level)
      .replace(/{poTopics}/g,           ctx.poTopics);
  }

  /* ── Phase descriptions ── */
  const PHASE_INFO = {
    1: { name: 'Foundation & Activation', months: 'June · Weeks 1–4', focus: 'building your movement vocabulary — easy runs, Pilates foundations, and bodyweight strength. The groundwork everything else stands upon.' },
    2: { name: 'Aerobic Development',     months: 'July · Weeks 5–8',  focus: 'growing your aerobic engine. Tempo runs, kettlebells, and your first introduction to the SkiErg and rowing machine.' },
    3: { name: 'Hyrox Specificity',       months: 'August · Weeks 9–13', focus: 'training like a Hyrox athlete. Every session pairs runs with stations. The hardest month — and the most important.' },
    4: { name: 'Race Simulation',         months: 'September · Weeks 14–18', focus: 'full Hyrox rehearsals. Half-simulations on Tuesdays, full 8-round simulations on Saturdays. Proving to yourself you can complete the race.' },
    5: { name: 'Taper & Race Prep',       months: 'Early October · Weeks 19–20', focus: 'protecting the fitness you have built. Reduced volume, sharp short sessions, and daily Pilates. The work is done — now we preserve it.' },
  };

  /* ── Day-of-week training guide per phase ── */
  const DAY_TRAINING = {
    1: { Monday:'Pilates Introduction', Tuesday:'Easy Run 20–30min', Wednesday:'Bodyweight Strength', Thursday:'Pilates Core', Friday:'Easy Run 25–35min', Saturday:'Yoga / Walk (Active Recovery)', Sunday:'Rest' },
    2: { Monday:'Strength — Lower Body', Tuesday:'Tempo Run 40min', Wednesday:'Pilates + Rowing Intro', Thursday:'Strength — Upper Body', Friday:'Long Run 45–55min', Saturday:'Pilates Flow', Sunday:'Rest' },
    3: { Monday:'Heavy Strength', Tuesday:'Run + Stations', Wednesday:'Pilates Mobility', Thursday:'Interval Run + Row', Friday:'Functional Circuit', Saturday:'Long Run 60–70min', Sunday:'Rest' },
    4: { Monday:'Active Recovery', Tuesday:'Hyrox Simulation A (Half)', Wednesday:'Pilates + Stretch', Thursday:'Run Intervals', Friday:'Moderate Strength', Saturday:'Hyrox Simulation B (Full)', Sunday:'Rest' },
    5: { Monday:'Easy Run 20min', Tuesday:'Pilates — Gentle', Wednesday:'Light Strength', Thursday:'Strides 4×200m', Friday:'Pilates Mobility', Saturday:'Walk + Rest', Sunday:'Rest' },
  };

  /* ── Response banks ── */
  const RESPONSES = {

    greeting: [
      '{timeGreeting}, Sir. Alfred at your service. The System shows {sessions} training sessions logged and your race is {daysToRace} days away. How may I assist?',
      '{timeGreeting}, Sir. One notes the date is {dayName}. Shall we review your progress, or do you require guidance on today\'s session?',
      '{timeGreeting}, Sir. I trust the day finds you in satisfactory condition. You are currently in Phase {phase} of your Hyrox preparation. What do you require?',
      'Ah, Sir. {timeGreeting}. The System has been quietly monitoring your progress. {sessions} sessions logged, study streak at {streak} days. Shall we discuss what comes next?',
    ],

    how_am_i: [
      'A full briefing, Sir. You are in Phase {phase} — {phase_name}. Training sessions logged: {sessions} (Level {level}). PMP study streak: {streak} days. Mock exam average: {avgScore}. PMP chapters completed: {completedChapters} of 10. PO topics covered: {poTopics}. Your race is {daysToRace} days away on {raceDateStr}. I would describe progress as... acceptable.',
      'Your current status, Sir: Phase {phase} training, {sessions} total sessions, Level {level} in the System. PMP streak is {streak} days — {streak_comment}. Average mock score sits at {avgScore}. Race day is in {daysToRace} days. Permit me to observe: the trajectory is solid. Continue.',
      'Status report as requested, Sir. Training: Phase {phase}, {sessions} sessions, Level {level}. Studies: {streak} day streak, {completedChapters}/10 PMP chapters done, mock average {avgScore}. Race countdown: {daysToRace} days. One notes with quiet satisfaction that you are, in fact, doing rather well.',
    ],

    train_today: [
      'Today is {dayName}, Sir. In Phase {phase}, your prescribed session is: {day_training}. I would suggest completing this before 09:00 if at all possible — the body performs better having consumed some fuel, but not too much.',
      'For {dayName} in Phase {phase}, Sir: {day_training}. Do not improvise. The programme was designed with progression in mind, and freelancing the phases is precisely how one ends up injured three weeks before race day.',
      '{dayName}\'s training in Phase {phase} is {day_training}, Sir. A reminder: if you are feeling strong, that is not permission to do more. It is confirmation the programme is working. Stay the course.',
    ],

    pmp_advice: [
      'The PMP examination, Sir. A few observations. Forty-two percent of questions are predictive, fifty percent agile, and eight percent hybrid. The exam tests your judgement in ambiguous situations — not memorisation. Andrew Ramdayal\'s Udemy course remains the single best preparation resource available.',
      'Your mock average currently sits at {avgScore}, Sir. If you are above seventy-five percent consistently, you are examination-ready. Below sixty-five, I would suggest revisiting Agile methodology specifically — it carries disproportionate weight. Do not neglect the situational questions.',
      'A study principle that has proven reliable, Sir: fifteen minutes daily without exception outperforms three-hour weekend sessions. Spaced repetition is the mechanism. Your current streak of {streak} days is, therefore, more valuable than it may appear.',
      'PMP insight, Sir: the exam rewards the "PM way" of thinking, not necessarily how projects are managed in the real world. When in doubt, choose the answer that involves the most communication with stakeholders. PMI is profoundly attached to communication plans.',
      'Chapter {completedChapters} of ten completed, Sir. A methodical approach. I would recommend Risk Management and Stakeholder Engagement next — they are heavily weighted and the most nuanced areas to master.',
    ],

    po_advice: [
      'The Product Owner path, Sir. The technical skills matter less than the bridge you build between business requirements and technical delivery. User stories, acceptance criteria, and the ability to prioritise a backlog ruthlessly — these are your primary weapons.',
      'A practical observation on the PO journey, Sir: build something every week, no matter how small. A component, a page, a prototype. The portfolio you accumulate is worth more than any certification in an interview context.',
      'For the frontend portion of your PO roadmap, Sir: Tailwind CSS will serve you considerably better than wrestling with custom CSS from scratch at this stage. The AI-assisted vibe-coding tools are genuinely useful once you understand the fundamentals — do not skip Week 1.',
      'You have completed {poTopics} PO topics, Sir. Steady progress. The capstone project in Month 4 is where the learning consolidates into something tangible. Begin thinking about what you will build from Week 1 — the clearer the brief, the better the result.',
    ],

    motivation: [
      'You are doing three difficult things simultaneously, Sir. Hyrox training, PMP certification, and a complete career pivot. The fact that you\'re still here, asking the right questions, is itself evidence of the answer. Continue.',
      'Permit me to observe something, Sir. Most people talk about doing a Hyrox. Most people talk about their PMP. You are doing both, simultaneously, with no prior race experience. The bar you\'ve set for yourself is higher than you perhaps realise.',
      'The sled push will feel impossible the first time, Sir. The wall balls will feel catastrophic at station eight. This is by design. The programme builds you precisely to handle what would otherwise break you. Trust the phases.',
      'On the days when motivation is absent, Sir, I find discipline is a far more reliable substitute. Motivation arrives and departs without consulting you. Discipline simply executes. You have built a system — work the system.',
      'A sub-1:30 Hyrox is not a dream, Sir. It is arithmetic. Eight kilometres at 6:30/km is 52 minutes. Thirty-five minutes across eight stations. Three minutes of transitions. The fitness programme delivers exactly this capacity. You simply need to show up.',
      'I have observed, Sir, that the gap between who you are today and who you intend to become is crossed one session at a time. You are {sessions} sessions in. The compound interest of effort has already begun accumulating. Do not cash out early.',
    ],

    nutrition: [
      'On the matter of fuelling, Sir. The fundamentals: protein at 1.6 to 2 grams per kilogram of body weight daily, carbohydrates timed around training sessions, and hydration at a minimum of two and a half litres per day — more in summer. In South African heat, electrolytes are not optional.',
      'Pre-race nutrition protocol, Sir: two and a half hours before the race, porridge with honey and banana. Nothing new. Forty-five minutes before: half a banana or a gel if you have trained with one. Sip water at stations — do not gulp. A stitch at station three is rather inconvenient.',
      'The supplementation hierarchy, Sir, based on evidence rather than marketing: creatine monohydrate five grams daily is your single best investment — strength, power, and recovery simultaneously. Magnesium glycinate before sleep. Omega-3 for inflammation. Everything else is secondary.',
      'Post-workout nutrition window, Sir: within forty-five minutes. Protein plus carbohydrates — eggs on toast, a protein shake with fruit, whatever is practical. The adaptation happens during sleep, but the raw materials must be provided shortly after training.',
      'Creatine, Sir, to be direct about it: it is the most well-researched performance supplement available, it is inexpensive, and it will benefit every station in your race. Five grams daily. Start now. It takes approximately three weeks to saturate.',
    ],

    race_strategy: [
      'The 1:30 Hyrox, Sir, broken down: 52 minutes of running across eight 1km legs at 6:30 per kilometre. 35 minutes across eight stations. Three minutes of transitions. The most important principle: never blow up on the sled push. Station two is where races are lost.',
      'Station guidance, Sir. The SkiErg: target four minutes, breathe steadily, do not sprint. Sled Push: five minutes, hip drive forward, never upright. Burpee Broad Jumps: breathe on every jump, five and a half minutes. Wall Balls at station eight: the station where 70% of first-timers fall apart. Pace at fifteen reps per minute. Your Pilates breathing will carry you here.',
      'The runners\' advantage in Hyrox, Sir, is the transition. Experienced athletes walk briskly between the run exit and station entry — they do not panic, they do not sprint. Under twenty seconds per transition across eight transitions is a meaningful time saving.',
      'Race day, Sir: arrive forty-five minutes before your wave. Warm up for fifteen minutes — light jog, leg swings, glute activation. Seed yourself honestly in your wave. The first 1km run should feel embarrassingly easy. That feeling is correct. Everything compounds from there.',
      'A tactical note on the farmers carry, Sir. Two hundred metres with two sixteen-kilogram kettlebells. Your Pilates core foundation was built for this moment — tall spine, neutral pelvis, long strides. Walk steadily. This station rewards composure over aggression.',
    ],

    race_day: [
      'Your race is {daysToRace} days away, Sir, on {raceDateStr}. {race_comment}',
      'The race stands at {daysToRace} days hence, Sir. {race_comment}',
    ],

    rest_recovery: [
      'Recovery is not weakness, Sir. It is the phase of training where adaptation actually occurs. The gym session creates the stimulus. Sleep manufactures the improvement. Without the second, the first is largely wasted effort.',
      'A day of rest, Sir, is prescribed for a reason. The Hyrox programme builds recovery into the structure — Sundays are not optional. Overtraining is a real phenomenon, and its primary symptom is the conviction that you should be doing more.',
      'Sleep is, in my assessment, the most undervalued performance variable in your toolkit, Sir. Seven and a half hours minimum. In the taper phase, aim for eight to nine. More impactful than any additional session. Guard it accordingly.',
      'If your body is sending signals, Sir, I would strongly recommend listening. A missed session due to genuine fatigue costs you one session. Training through injury can cost you the race. The calculation is straightforward.',
    ],

    injury: [
      'If you are experiencing anterior knee pain, Sir, I would recommend reducing run volume immediately and adding the vastus medialis activation exercises from your Pilates programme. Patellofemoral syndrome in runners is almost always addressable with targeted strength work.',
      'A direct observation, Sir: training through pain and training through discomfort are different activities. Discomfort is expected and navigable. Pain is information. Please attend to what the information is telling you before continuing.',
      'Lower back tension, Sir, is most commonly a hip flexor issue in runners. Your Phase 3 Pilates programme includes hip flexor release flows specifically for this reason. The sled push with poor hip positioning is the most common culprit — lean forward, drive from the hips.',
      'I would suggest seeing a physiotherapist if this has persisted more than three days, Sir. A brief intervention early is categorically preferable to a prolonged absence closer to race day. I am a butler, not a medical professional.',
    ],

    pilates: [
      'Pilates is, in my assessment, the invisible thread that holds the entire programme together, Sir. Strong deep core equals better running economy, more controlled sled mechanics, safer sandbag lunges, and meaningfully reduced injury risk. It is not a nice-to-have. It is infrastructure.',
      'Your Pilates programme in Phase {phase}, Sir: {pilates_focus}. The sessions are structured intentionally — do not replace them with additional cardio, however tempting that may be.',
      'A note on Pilates breathing, Sir: the diaphragmatic breathing technique you develop in Pilates is your pacing tool during the race itself. When your heart rate climbs to uncomfortable levels at station eight, the breathing pattern you have rehearsed is the mechanism that keeps you composed.',
    ],

    thanks: [
      'My pleasure, Sir. Shall there be anything else?',
      'Of course, Sir. One is always at your service.',
      'Quite, Sir. Do let me know should anything else require attention.',
      'Think nothing of it, Sir. That is rather precisely what I am here for.',
    ],

    joke: [
      'A joke, Sir? Very well. A man walks into a gym and asks the trainer, "Can you teach me to do the splits?" The trainer asks, "How flexible are you?" The man says, "I can\'t make Tuesdays." I find that one appropriately absurd.',
      'I am, Sir, fundamentally a butler rather than a comedian. However: why don\'t scientists trust atoms? Because they make up everything. I apologise. That was beneath both of us.',
      'Comedy, Sir, is not strictly within my operational brief. I would, however, note that the concept of voluntarily carrying a sandbag for 100 metres while in the eighth kilometre of an endurance event is, to the uninitiated, inherently humorous.',
    ],

    who_are_you: [
      'Alfred, Sir. Your personal system butler, progress monitor, and occasional voice of unreasonable optimism. I am familiar with your Hyrox training programme, your PMP examination schedule, your Product Owner roadmap, and your preference for not being told things you already know. How may I assist?',
      'I am Alfred, Sir — the intelligence behind your personal operating system. I track your training phases, study progress, race countdown, and general trajectory toward becoming someone who finishes a Hyrox in under ninety minutes while holding a PMP certification. Quite the ambition.',
    ],

    week_plan: [
      'For Phase {phase} this week, Sir, the structure is as follows: {week_plan_detail}. I would recommend reviewing this against your actual calendar and adjusting only for genuine conflicts — not for preference.',
      'Your weekly training architecture in Phase {phase}, Sir: {week_plan_detail}. The key sessions are the ones that align with your current phase goal. Do not sacrifice Tuesday\'s session for convenience — it carries disproportionate load.',
    ],

    fallback: [
      'I\'m afraid that particular query falls outside my current briefing, Sir. I am most useful when discussing your Hyrox training, PMP examination, Product Owner roadmap, race strategy, nutrition, or recovery. Shall we try one of those?',
      'One is not entirely certain one follows, Sir. Perhaps you might rephrase? I am prepared to assist with training, studies, race preparation, nutrition, or any aspect of your programme.',
      'That falls somewhat outside my parameters, Sir. I would suggest trying: "What should I train today?", "How am I doing?", "Give me a PMP tip", or "Motivate me." These tend to produce more actionable results.',
    ],
  };

  /* ── Generate phase-specific Pilates focus text ── */
  const PILATES_FOCUS = {
    1: 'breathing, neutral spine, dead bugs, glute bridges, and pelvic floor activation — the full foundation vocabulary',
    2: 'plank progressions, side kick series for hip stability, shoulder bridge with march, and resistance band work',
    3: 'hip flexor lengthening flows, thoracic rotation work for the SkiErg, and standing Pilates as pre-workout activation',
    4: 'daily 15-20 minute morning activation: hip openers, ITB release, and thoracic spine mobility to manage the increased race simulation load',
    5: 'daily 10-minute gentle sessions only — the fitness is already banked, we are simply maintaining mobility and keeping the nervous system calm before race day',
  };

  const STREAK_COMMENTS = {
    low:  'which needs attention, Sir.',
    mid:  'which is acceptable. Consistency over intensity.',
    good: 'which is commendable. Spaced repetition is compounding.',
    great:'which is exemplary. The streak is doing precisely what it is designed to do.',
  };

  function streakComment(streak) {
    if (streak === 0) return STREAK_COMMENTS.low;
    if (streak < 5)  return STREAK_COMMENTS.mid;
    if (streak < 14) return STREAK_COMMENTS.good;
    return STREAK_COMMENTS.great;
  }

  function raceComment(daysToRace) {
    if (daysToRace == null) return 'Set your race date in Settings to receive a more precise briefing.';
    if (daysToRace < 0)  return 'The race has passed, Sir. I trust the result was satisfactory.';
    if (daysToRace === 0) return 'Race day, Sir. Everything has been building to this. Eat your prescribed breakfast, warm up for fifteen minutes, and trust the twenty weeks. I shall be here when you return.';
    if (daysToRace <= 7) return 'Race week, Sir. No new training. Sleep is your only job now. Lay out your kit tonight.';
    if (daysToRace <= 14) return 'Two weeks remaining. The fitness is almost entirely banked. Protect it.';
    if (daysToRace <= 30) return 'One month to go. Simulation phase. You should be completing full 8-round rehearsals now.';
    return 'Ample time remains to execute the programme with precision.';
  }

  function weekPlanDetail(phase) {
    const plan = DAY_TRAINING[phase] || DAY_TRAINING[1];
    return Object.entries(plan).map(([d, s]) => `${d}: ${s}`).join('; ');
  }

  /* ── Detect intent ── */
  function detectIntent(input) {
    for (const intent of INTENTS) {
      for (const pattern of intent.patterns) {
        if (pattern.test(input)) return intent.name;
      }
    }
    return 'fallback';
  }

  /* ── Build response ── */
  function respond(userInput) {
    const ctx = buildContext();
    const intent = detectIntent(userInput.trim());

    let bank = RESPONSES[intent] || RESPONSES.fallback;
    let template = pick(bank);

    // Extra context substitutions
    const phaseData = PHASE_INFO[ctx.phase] || PHASE_INFO[1];
    template = template
      .replace(/{phase_name}/g,     phaseData.name)
      .replace(/{streak_comment}/g, streakComment(ctx.streak))
      .replace(/{race_comment}/g,   raceComment(ctx.daysToRace))
      .replace(/{day_training}/g,   (DAY_TRAINING[ctx.phase] || DAY_TRAINING[1])[ctx.dayName] || 'Rest or active recovery')
      .replace(/{pilates_focus}/g,  PILATES_FOCUS[ctx.phase] || PILATES_FOCUS[1])
      .replace(/{week_plan_detail}/g, weekPlanDetail(ctx.phase));

    return inject(template, ctx);
  }

  /* ── Greeting on load ── */
  function loadGreeting() {
    const ctx = buildContext();
    const templates = [
      '{timeGreeting}, Sir. Alfred reporting. Phase {phase} is active. Your race is {daysToRace} days away. Shall we begin?',
      '{timeGreeting}, Sir. The System indicates {sessions} training sessions complete and a study streak of {streak} days. One is cautiously optimistic.',
      '{timeGreeting}, Sir. Phase {phase} — {phase_name}. The programme is running exactly as designed. What requires attention today?',
    ];
    let t = pick(templates);
    const phaseData = PHASE_INFO[ctx.phase] || PHASE_INFO[1];
    t = t.replace(/{phase_name}/g, phaseData.name).replace(/{race_comment}/g, raceComment(ctx.daysToRace));
    return inject(t, ctx);
  }

  return { respond, loadGreeting, detectIntent };

})();
