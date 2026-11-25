'use strict';
/* Negative numbers (from Year 3): built as small skills. Real things first (thermometers,
 * lifts, divers, money owed), then the number line, then the rules. */
(() => {
  const { rand, pick, shuffle, fmt, paren } = U;
  const deg = (t) => `${fmt(t)}°C`;
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const word = (n) => (n < 0 ? 'negative ' : '') + WORDS[Math.abs(n)];
  const cur = () => U.settings.currency;
  const bal = (v) => `${v < 0 ? '−' : ''}${cur()}${Math.abs(v)}`;
  const CITIES = ['Oslo', 'Moscow', 'Helsinki', 'Montreal', 'Reykjavik', 'Stockholm'];
  const WARM = ['Madrid', 'Rome', 'Lisbon', 'Athens', 'Cairo', 'Nairobi'];

  /* ---------------- shared helpers ---------------- */
  /** Number line that fits the values, always showing 0. */
  function nl(values, o = {}) {
    const lo = Math.min(0, ...values) - 2, hi = Math.max(0, ...values) + 2;
    const range = hi - lo;
    return V.numberLine(Object.assign({ min: lo, max: hi, step: range <= 22 ? 1 : range <= 44 ? 2 : 5, signColors: true }, o));
  }
  const LINE10 = (o = {}) => V.numberLine(Object.assign({ min: -10, max: 10, step: 1, signColors: true }, o));
  /** Jumps from `from` to `to`, split at zero when they cross it. */
  function jumpsVia0(from, to) {
    const sgn = to > from ? '+' : '−';
    if (from !== 0 && to !== 0 && Math.sign(from) !== Math.sign(to)) {
      return [{ from, to: 0, label: sgn + Math.abs(from) }, { from: 0, to, label: sgn + Math.abs(to) }];
    }
    return [{ from, to, label: sgn + Math.abs(to - from) }];
  }
  /**
   * Guided steps for a move from → to that crosses zero:
   * 1) steps to zero, 2) steps left after zero, 3) where you land.
   */
  function viaZeroParts(from, to, unit = '') {
    const k = Math.abs(to - from);
    const down = to < from;
    const u = unit ? ` ${unit}` : '';
    if (from !== 0 && to !== 0 && Math.sign(from) !== Math.sign(to)) {
      const z = Math.abs(from), rest = k - z;
      return [
        { say: `How many steps from <b>${fmt(from)}</b> ${down ? 'down' : 'up'} to <b>0</b>?`, answer: z, hint: `Count the steps between ${fmt(from)} and 0.`, after: `${fmt(from)} → 0 is ${z} step${z === 1 ? '' : 's'}.` },
        { say: `We need <b>${k}</b> steps altogether. How many are still left after 0?`, answer: rest, hint: `${k} − ${z}`, after: `${k} − ${z} = ${rest} more step${rest === 1 ? '' : 's'} ${down ? 'below' : 'above'} zero.` },
        { say: `Now go ${rest} more from 0. Where do you land?`, answer: to, allowNeg: true, suffix: u, hint: down ? 'Below zero means a minus sign.' : 'Above zero is positive.', visual: nl([from, to], { jumps: jumpsVia0(from, to) }), after: `We land on <b>${fmt(to)}${u}</b>.` },
      ];
    }
    return [
      { say: `Which way do we move from <b>${fmt(from)}</b>?`, type: 'choice', choices: [{ v: 'd', html: down ? '⬇️ Down / left' : '⬇️ Down / left' }, { v: 'u', html: '⬆️ Up / right' }], answer: down ? 'd' : 'u' },
      { say: `Move ${k} ${down ? 'down (left)' : 'up (right)'} from <b>${fmt(from)}</b>. Where do you land?`, answer: to, allowNeg: true, suffix: u, visual: nl([from, to], { jumps: jumpsVia0(from, to) }), after: `We land on <b>${fmt(to)}${u}</b>.` },
    ];
  }

  /* =====================================================================
   * Y3: What is below zero?
   * ===================================================================== */
  function readChoice(v) {
    const n = Math.abs(v);
    const opts = [{ v: 'neg', html: word(v) }, { v: 'pos', html: `positive ${WORDS[n]}` }, { v: 'big', html: `${WORDS[n]} hundred` }];
    return { q: `How do we read <b>${fmt(v)}</b>?`, type: 'choice', choices: shuffle(opts), answer: 'neg', hint: 'The minus sign in front means it is below zero.', steps: [`The minus sign tells us it is on the left of zero. We say “<b>${word(v)}</b>”.`] };
  }
  function arrowProblem(v, min, max, step) {
    return {
      q: 'Which number is the hand pointing to?', visual: V.numberLine({ min, max, step, signColors: true, points: [{ v, emoji: '👇' }] }),
      answer: v, allowNeg: true, hint: 'Find the nearest labelled number, then count the small marks.',
      steps: ['The hand is left of zero, so the number is negative.', V.numberLine({ min, max, step: max - min <= 22 ? 1 : step, signColors: true, points: [{ v, emoji: '👇', label: fmt(v) }] }), `It points to <b>${fmt(v)}</b>.`],
    };
  }
  const belowZero = {
    id: 'below-zero', title: 'Numbers below zero', years: [3, 3],
    desc: 'The number line keeps going to the left of 0.',
    lesson() {
      const v = -rand(2, 8), w = -rand(3, 9);
      return [
        { say: 'It is a freezing winter morning ❄️. The puddles have turned to ice! The weather report says it is <b>colder than zero</b>. How can anything be smaller than zero? Let’s find out!', show: `<div class="say-big">❄️ ⛄ 🧊</div>${V.thermometer(-3, { showValue: true })}` },
        { say: 'You know the number line: 0, 1, 2, 3… going to the <b>right</b>. But it does not stop at 0! It carries on to the <b>left</b> too. Numbers on the left of zero are called <b>negative numbers</b>.', show: LINE10() },
        { say: 'We write them with a <b>minus sign</b> in front: −1, −2, −3… We read <b>−3</b> as “<b>negative three</b>”. It is 3 steps to the <b>left</b> of zero. Plain 3 is 3 steps to the right.', show: V.numberLine({ min: -6, max: 6, step: 1, signColors: true, jumps: [{ from: 0, to: -3, label: '3 left' }, { from: 0, to: 3, label: '3 right' }] }) },
        { say: 'Your turn! Which words match this number?', try: readChoice(v) },
        { say: '<b>Zero</b> sits in the middle. It is not positive and not negative. The further <b>left</b> you go, the <b>smaller</b> the number.', show: LINE10(),
          try: { type: 'nlplace', q: `Tap the number line to show <b>${fmt(w)}</b>.`, min: -10, max: 10, step: 1, signColors: true, answer: w, showValue: true, hint: `Start at 0 and count ${-w} steps to the left.` } },
        (() => { const u = -rand(2, 9); return { say: 'Now only some numbers are written. Count the little marks! 💪', try: { type: 'nlplace', q: `Show <b>${fmt(u)}</b> on the number line.`, min: -10, max: 10, step: 5, signColors: true, answer: u, hint: `${fmt(u)} is ${-u} steps left of 0.` } }; })(),
      ];
    },
    gen() {
      const r = Math.random();
      const v = -rand(1, 9);
      if (r < 0.35) return { type: 'nlplace', q: `Tap the number line to show <b>${fmt(v)}</b>.`, min: -10, max: 10, step: pick([1, 2, 5]), signColors: true, answer: v, hint: `Start at 0 and go ${-v} steps left.`, steps: [LINE10({ points: [{ v, label: fmt(v) }] })] };
      if (r < 0.6) return readChoice(v);
      if (r < 0.85) return arrowProblem(v, -10, 10, 5);
      const k = rand(1, 9);
      return { q: `Which number is <b>${k}</b> steps to the <b>left</b> of zero?`, answer: -k, allowNeg: true, visual: LINE10(), hint: 'Left of zero means negative.', steps: [LINE10({ jumps: [{ from: 0, to: -k, label: `${k} left` }] }), `It is <b>${fmt(-k)}</b>.`] };
    },
  };

  /* =====================================================================
   * Y3–4: Thermometers
   * ===================================================================== */
  const thermoRange = (y) => (y >= 4 ? { min: -20, max: 20 } : { min: -10, max: 10 });
  function readThermo(t, y) {
    const R = thermoRange(y);
    return {
      q: 'What temperature does the thermometer show?', visual: `<div class="row-center">${V.thermometer(t, R)}</div>`,
      answer: t, suffix: '°C', allowNeg: true, hint: 'Find the top of the liquid. Above or below 0? Then count the marks from 0.',
      steps: [t < 0 ? 'The top of the liquid is <b>below 0</b>, so it is negative.' : 'The top of the liquid is above 0.', `Count the marks from 0: ${Math.abs(t)} ${t < 0 ? 'down' : 'up'}.`, `<div class="row-center">${V.thermometer(t, Object.assign({ showValue: true }, R))}</div>`],
    };
  }
  function setThermo(t, y) {
    const R = thermoRange(y);
    return { type: 'thermo', q: `Set the thermometer to <b>${deg(t)}</b>.`, answer: t, min: R.min, max: R.max, hint: t < 0 ? 'Use −1 and −5 to go below zero.' : 'Use +1 and +5 to go up.', steps: [`${deg(t)} is ${Math.abs(t)} degrees ${t < 0 ? 'below' : 'above'} zero.`] };
  }
  const thermometers = {
    id: 'thermometer', title: 'Reading thermometers', years: [3, 4],
    desc: 'Read and set temperatures above and below 0°C.',
    lesson(y) {
      const lim = y >= 4 ? 15 : 9;
      const t = -rand(2, lim), t2 = -rand(1, lim), t3 = -rand(2, lim);
      return [
        { say: 'A thermometer tells us how hot or cold it is 🌡️. The liquid goes <b>up</b> when it gets warmer and <b>down</b> when it gets colder.', show: `<div class="row-center">${V.thermometer(7, { showValue: true })}${V.thermometer(-4, { showValue: true })}</div>` },
        { say: 'The line marked <b>0°C</b> is where water freezes into ice 🧊. Below that line the temperatures are <b>negative</b>: −1°C, −2°C, −3°C… Each little mark is 1 degree.', show: V.thermometer(0, { showValue: true }) },
        { say: 'To read it: find the <b>top of the liquid</b>. Is it above or below 0? Then count the marks from 0.', try: readThermo(t, y) },
        { say: 'Now you set it! <b>+</b> makes it warmer, <b>−</b> makes it colder.', try: setThermo(t2, y) },
        { say: 'Careful! <b>−5°C is colder than −2°C</b>, even though 5 is bigger than 2. The further below zero, the colder it is. 🥶', show: `<div class="row-center">${V.thermometer(-2, { showValue: true })}${V.thermometer(-5, { showValue: true })}</div>` },
        { say: 'Your turn: one more! 💪', try: setThermo(t3, y) },
      ];
    },
    gen(y) {
      const lim = y >= 4 ? 18 : 9;
      const t = Math.random() < 0.8 ? -rand(1, lim) : rand(0, lim);
      return Math.random() < 0.5 ? readThermo(t, y) : setThermo(t, y);
    },
  };

  /* =====================================================================
   * Y3–4: Counting back through zero
   * ===================================================================== */
  function backPair(y) {
    const s = rand(1, y === 3 ? 6 : 9);
    const k = rand(s + 1, s + (y === 3 ? 4 : 9));
    return { s, k, r: s - k };
  }
  function backGuided({ s, k, r }) {
    return {
      type: 'guided', q: `Start at <b>${s}</b> and count back <b>${k}</b>. Where do you land?`, visual: LINE10({ points: [{ v: s, emoji: '🐸' }] }),
      hint: 'Count back to 0 first, then keep going.',
      parts: viaZeroParts(s, r),
      steps: [nl([s, r], { jumps: jumpsVia0(s, r) }), `${s} − ${k} = <b>${fmt(r)}</b>`],
    };
  }
  const countBack = {
    id: 'count-back-zero', title: 'Counting back through zero', years: [3, 4],
    desc: 'Hop back to zero first, then keep going into the negatives.',
    lesson(y) {
      const { s, k, r } = backPair(y);
      const seqDown = Array.from({ length: s }, (_, i) => s - i - 1).join(', ');
      return [
        { say: `🐸 Freddie the frog is on <b>${s}</b>. He wants to hop back <b>${k}</b> steps. But ${k} is more than ${s}! Where will he land?`, show: LINE10({ points: [{ v: s, emoji: '🐸' }] }) },
        { say: 'Here is the trick: hop back to <b>zero</b> first. Zero is a great stepping stone!', show: LINE10({ points: [{ v: s, emoji: '🐸' }] }),
          try: { q: `How many hops from ${s} back to 0?`, answer: s, hint: `Count: ${seqDown}.` } },
        { say: `Yes! ${s} hop${s > 1 ? 's' : ''} get him to 0. He must do <b>${k}</b> hops altogether, so some are still left.`, show: nl([s, r], { jumps: [{ from: s, to: 0, label: '−' + s }] }),
          try: { q: `${k} − ${s} = ? hops left`, answer: k - s, hint: `He has done ${s} of the ${k} hops.` } },
        { say: 'Now he hops past zero, into the negative numbers.', show: nl([s, r], { jumps: jumpsVia0(s, r) }),
          try: { q: 'Where does Freddie land?', answer: r, allowNeg: true, hint: `${k - s} steps to the left of 0.` } },
        { say: `${s} − ${k} = <b>${fmt(r)}</b>. 🎉 When you take away more than you have, you go <b>below zero</b>.`, show: nl([s, r], { points: [{ v: r, emoji: '🐸', label: fmt(r) }] }) },
        { say: 'Now you do all the steps! 💪', try: backGuided(backPair(y)) },
      ];
    },
    gen(y) {
      const P = backPair(y);
      if (Math.random() < 0.6) return backGuided(P);
      return { q: `${P.s} − ${P.k} = ?`, visual: LINE10(), answer: P.r, allowNeg: true, hint: 'Count back to zero first.', steps: [nl([P.s, P.r], { jumps: jumpsVia0(P.s, P.r) }), `= <b>${fmt(P.r)}</b>`] };
    },
    word(y) {
      const { s, k, r } = backPair(y);
      return { type: 'guided', scene: '❄️', story: true, q: `In the afternoon it was <b>${deg(s)}</b> in the snowy village. By night the temperature fell <b>${k}</b> degrees. What was the temperature at night?`, parts: viaZeroParts(s, r, '°C'), steps: [nl([s, r], { jumps: jumpsVia0(s, r) })] };
    },
  };

  /* =====================================================================
   * Y3: Lifts and floors below ground
   * ===================================================================== */
  const LIFT = { min: -4, max: 5 };
  const liftPic = (f) => `<div class="row-center">${V.elevator(f, LIFT)}</div>`;
  function liftMove() {
    const f = rand(-3, 4);
    const down = f > -3 && Math.random() < 0.6;
    const m = down ? rand(1, f + 4) : rand(1, 5 - f);
    return { f, m, down, r: down ? f - m : f + m };
  }
  const lifts = {
    id: 'lifts', title: 'Lifts and floors below ground', years: [3, 3],
    desc: 'The ground floor is 0. The car park is −1, −2, −3.',
    lesson() {
      const f = -rand(1, 3);
      const L = liftMove();
      const a = -rand(2, 3), m = rand(a === -3 ? 4 : 3, 6);
      return [
        { say: 'In a tall building the <b>ground floor</b> is floor <b>0</b> 🚪. Floors above are 1, 2, 3… The car park is <b>under the ground</b>: floor −1, −2, −3!', show: liftPic(0) },
        { say: 'Going <b>up</b> in the lift is like adding. Going <b>down</b> is like taking away. This lift went down from floor 2 to floor −1: that is <b>3 floors down</b> (2 to the ground, then 1 more).', show: liftPic(-1) },
        { say: 'Look at the lift. Which floor is it on?', show: liftPic(f), try: { q: 'Which floor is the lift on?', answer: f, allowNeg: true, hint: 'It is under the green ground line, so it is negative.' } },
        { say: `The lift is on floor <b>${fmt(L.f)}</b>. It goes <b>${L.down ? 'down' : 'up'} ${L.m}</b> floor${L.m > 1 ? 's' : ''}. Count the floors as it moves.`, show: liftPic(L.f), try: { q: 'Which floor is it on now?', answer: L.r, allowNeg: true, hint: L.down ? 'Down means count back.' : 'Up means count on.' } },
        { say: 'Your turn! Going up from underground, you pass the ground floor 0. 💪', show: liftPic(a), try: { type: 'guided', q: `The lift is on floor <b>${fmt(a)}</b> and goes up <b>${m}</b> floors.`, parts: viaZeroParts(a, a + m) } },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.3) { const f = rand(-4, 4); return { q: 'Which floor is the lift on?', visual: liftPic(f), answer: f, allowNeg: true, hint: 'Floors under the ground are negative.', steps: [`The lift is on floor <b>${fmt(f)}</b>.`] }; }
      if (r < 0.45) {
        const a = -rand(1, 4); let b = -rand(1, 4); while (b === a) b = -rand(1, 4);
        return { q: 'Which floor is <b>lower</b> down?', visual: liftPic(0), type: 'choice', choices: [{ v: String(a), html: `Floor ${fmt(a)}` }, { v: String(b), html: `Floor ${fmt(b)}` }], answer: String(Math.min(a, b)), hint: 'The bigger the number after the minus, the deeper underground.', steps: [`Floor ${fmt(Math.min(a, b))} is further below the ground.`] };
      }
      const L = liftMove();
      return { q: `The lift is on floor <b>${fmt(L.f)}</b>. It goes ${L.down ? 'down' : 'up'} <b>${L.m}</b> floor${L.m > 1 ? 's' : ''}. Which floor is it on now?`, visual: liftPic(L.f), answer: L.r, allowNeg: true, hint: L.down ? 'Down means count back.' : 'Up means count on.', steps: [liftPic(L.r), `${fmt(L.f)} ${L.down ? '−' : '+'} ${L.m} = <b>${fmt(L.r)}</b>`] };
    },
    word() {
      const nm = U.name();
      const a = -rand(1, 3), b = rand(2, 5);
      return {
        type: 'guided', scene: '🛗', story: true,
        q: `${nm} parks the car on floor <b>${fmt(a)}</b> of the car park and takes the lift up to floor <b>${b}</b> to buy a toy. How many floors does the lift go up?`,
        parts: [
          { say: `How many floors from ${fmt(a)} up to the ground floor 0?`, answer: -a, visual: liftPic(a) },
          { say: `How many floors from 0 up to floor ${b}?`, answer: b },
          { say: 'So how many floors altogether?', answer: b - a, after: `${-a} + ${b} = ${b - a} floors.` },
        ],
      };
    },
  };

  /* =====================================================================
   * Y4–5: Placing negative numbers on a number line
   * ===================================================================== */
  const placeCfg = (y) => (y >= 5 ? { min: -50, max: 50, step: 10, tol: 2, lim: 48 } : { min: -20, max: 20, step: 5, tol: 0, lim: 19 });
  function negOffStep(c) { let v = -rand(1, c.lim); if (v % c.step === 0) v -= 1; return v; }
  function placeProblem(y) {
    const c = placeCfg(y);
    const v = negOffStep(c);
    return { type: 'nlplace', q: `Tap the line to show <b>${fmt(v)}</b>.${c.tol ? ' <span class="muted">(Get close!)</span>' : ''}`, min: c.min, max: c.max, step: c.step, signColors: true, answer: v, tol: c.tol, hint: `Find the labelled number next to ${fmt(v)} first.`, steps: [V.numberLine({ min: c.min, max: c.max, step: c.step, signColors: true, points: [{ v, label: fmt(v) }] })] };
  }
  const placeNeg = {
    id: 'place-negatives', title: 'Negative numbers on a number line', years: [4, 5],
    desc: 'Use the labelled numbers like signposts to find any number below zero.',
    lesson(y) {
      const c = placeCfg(y);
      const v = -(c.step + rand(1, Math.min(4, c.step - 1)));
      const lab = -c.step;
      const a = negOffStep(c);
      return [
        { say: `On a long number line, not every number is written. Only every <b>${c.step}</b> has a label. We use them like signposts! 🪧`, show: V.numberLine({ min: c.min, max: c.max, step: c.step, signColors: true }) },
        { say: `To find <b>${fmt(v)}</b>: go left from 0 to the signpost <b>${fmt(lab)}</b>. Then ${Math.abs(v - lab)} more step${Math.abs(v - lab) > 1 ? 's' : ''} left.`, show: V.numberLine({ min: c.min, max: c.max, step: c.step, signColors: true, jumps: [{ from: 0, to: lab, label: fmt(lab) }, { from: lab, to: v, label: `${Math.abs(v - lab)} more` }], points: [{ v, label: fmt(v) }] }) },
        { say: 'Which number is the hand pointing at? Use the nearest signpost.', try: Object.assign(arrowProblem(a, c.min, c.max, c.step), y >= 5 ? { tol: 2, q: 'Which number is the hand pointing to? <span class="muted">(Get as close as you can)</span>' } : {}) },
        { say: 'Negative numbers <b>mirror</b> the positive ones. −7 is as far from 0 as 7, just on the other side. 🪞', show: V.numberLine({ min: -10, max: 10, step: 1, signColors: true, jumps: [{ from: 0, to: -7, label: '7 left' }, { from: 0, to: 7, label: '7 right' }] }) },
        { say: 'Your turn: place it yourself! 💪', try: placeProblem(y) },
      ];
    },
    gen(y) {
      if (Math.random() < 0.55) return placeProblem(y);
      const c = placeCfg(y);
      const v = negOffStep(c);
      const p = arrowProblem(v, c.min, c.max, c.step);
      if (y >= 5) { p.tol = 2; p.q = 'Which number is the hand pointing to? <span class="muted">(Get as close as you can)</span>'; p.hint = 'Each gap between signposts is 10. Is the hand about halfway?'; }
      return p;
    },
  };

  /* =====================================================================
   * Y4–5: Comparing and ordering
   * ===================================================================== */
  function twoDiff(lo, hi) {
    let a, b;
    do { a = rand(lo, hi); b = rand(lo, hi); } while (a === b || (a >= 0 && b >= 0));
    return [a, b];
  }
  function signProblem(y) {
    const [a, b] = twoDiff(y >= 5 ? -50 : -20, y >= 5 ? 20 : 10);
    const s = a < b ? '<' : '>';
    return {
      q: `Choose the sign: <b>${fmt(a)}</b> <span class="box">?</span> <b>${fmt(b)}</b>`, type: 'choice',
      choices: [{ v: '<', html: '<span class="sign">&lt;</span>' }, { v: '>', html: '<span class="sign">&gt;</span>' }], answer: s,
      hint: 'The number further left on the number line is smaller.',
      steps: [nl([a, b], { points: [{ v: a, color: '#7c3aed', label: fmt(a) }, { v: b, color: '#ea580c', label: fmt(b) }] }), `${fmt(Math.min(a, b))} is further left, so <b>${fmt(a)} ${s === '<' ? '&lt;' : '&gt;'} ${fmt(b)}</b>.`],
    };
  }
  function colderProblem(y) {
    const [a, b] = twoDiff(y >= 5 ? -30 : -15, 8);
    const warm = Math.random() < 0.35;
    const ans = warm ? Math.max(a, b) : Math.min(a, b);
    return {
      q: `Which temperature is <b>${warm ? 'warmer' : 'colder'}</b>?`, type: 'choice', choices: shuffle([a, b]).map((v) => ({ v: String(v), html: deg(v) })), answer: String(ans),
      hint: 'Colder means further below zero (further left).',
      steps: [nl([a, b], { points: [{ v: Math.min(a, b), color: '#3b82f6', label: 'colder' }, { v: Math.max(a, b), color: '#ef4444', label: 'warmer' }] }), `${deg(ans)} is ${warm ? 'warmer' : 'colder'}.`],
    };
  }
  function orderProblem(y) {
    const lo = y >= 5 ? -40 : -15, hi = y >= 5 ? 25 : 10;
    const vals = [];
    while (vals.filter((v) => v < 0).length < 2) { vals.length = 0; while (vals.length < 4) { const v = rand(lo, hi); if (!vals.includes(v)) vals.push(v); } }
    const dir = Math.random() < 0.7 ? 'asc' : 'desc';
    return {
      type: 'order', q: `Put these temperatures in order, <b>${dir === 'asc' ? 'coldest first' : 'warmest first'}</b>.`, dir,
      items: vals.map((v) => ({ v, html: deg(v) })),
      hint: dir === 'asc' ? 'Find the one furthest below zero first.' : 'Find the warmest one first.',
      steps: [nl(vals, { points: vals.map((v) => ({ v, color: '#7c3aed', label: fmt(v) })) }), `Order: ${[...vals].sort((p, q) => (dir === 'asc' ? p - q : q - p)).map(deg).join(', ')}`],
    };
  }
  const compare = {
    id: 'compare-order', title: 'Comparing and ordering', years: [4, 5],
    desc: 'Which is colder? Which is smaller? −8 < −2.',
    lesson(y) {
      return [
        { say: 'Which is colder: <b>−8°C</b> or <b>−2°C</b>? Let’s look at two thermometers.', show: `<div class="row-center">${V.thermometer(-2, { showValue: true })}${V.thermometer(-8, { showValue: true })}</div>` },
        { say: '−8°C is lower down, so it is <b>colder</b>. On the number line, −8 is further <b>left</b>. Further left always means <b>smaller</b>. So <b>−8 &lt; −2</b>.', show: V.numberLine({ min: -10, max: 2, step: 1, signColors: true, points: [{ v: -8, color: '#3b82f6', label: '−8' }, { v: -2, color: '#ef4444', label: '−2' }] }) },
        { say: 'Watch out! 8 is bigger than 2, but <b>−8 is smaller than −2</b>. Owing 8 sweets is worse than owing 2! 🍬', try: colderProblem(y) },
        { say: 'The signs: <b>&lt;</b> means “is less than”. <b>&gt;</b> means “is greater than”. The small pointy end always points to the <b>smaller</b> number.', try: signProblem(y) },
        { say: 'Your turn: put them in order! 💪', try: orderProblem(y) },
      ];
    },
    gen(y) {
      const r = Math.random();
      if (r < 0.35) return signProblem(y);
      if (r < 0.65) return colderProblem(y);
      return orderProblem(y);
    },
  };

  /* =====================================================================
   * Y4–6: Temperature rises and falls
   * ===================================================================== */
  function changePair(y) {
    const big = y >= 5 ? 15 : 9;
    if (Math.random() < 0.55) { const s = rand(1, big); const k = rand(s + 1, s + big); return { s, k, down: true, e: s - k }; }
    const s = -rand(1, big); const k = rand(-s + 1, -s + big); return { s, k, down: false, e: s + k };
  }
  function changeGuided(P, story) {
    const p = {
      type: 'guided',
      q: story || `The temperature is <b>${deg(P.s)}</b>. It ${P.down ? 'falls' : 'rises'} by <b>${P.k}</b> degrees. What is the new temperature?`,
      parts: viaZeroParts(P.s, P.e, '°C'),
      steps: [nl([P.s, P.e], { jumps: jumpsVia0(P.s, P.e) }), `${deg(P.s)} ${P.down ? '−' : '+'} ${P.k} = <b>${deg(P.e)}</b>`],
    };
    if (story) { p.scene = pick(['🌡️', '❄️', '🌙']); p.story = true; } else p.visual = `<div class="row-center">${V.thermometer(P.s, { min: -20, max: 20 })}</div>`;
    return p;
  }
  const tempChange = {
    id: 'temp-change', title: 'Temperature rises and falls', years: [4, 6],
    desc: 'Falls go down, rises go up — use zero as a stepping stone.',
    lesson(y) {
      const s = rand(2, 7), k = rand(s + 2, s + 7), e = s - k;
      return [
        { say: `At lunchtime it is <b>${deg(s)}</b> ☀️. At night the temperature <b>falls</b> by <b>${k}</b> degrees 🌙. What will it be?`, show: `<div class="row-center">${V.thermometer(s, { min: -15, max: 15, showValue: true })}</div>` },
        { say: '<b>Falls</b> means go <b>down</b> the thermometer (left on the number line). Go down to <b>0</b> first.', show: nl([s, e]), try: { q: `How many degrees from ${deg(s)} down to 0°C?`, answer: s } },
        { say: `${s} degrees get us to 0°C. We must fall ${k} altogether.`, show: nl([s, e], { jumps: [{ from: s, to: 0, label: '−' + s }] }), try: { q: `How many more degrees below zero? (${k} − ${s})`, answer: k - s } },
        { say: `So the temperature ends up ${k - s} degrees <b>below</b> zero.`, show: nl([s, e], { jumps: jumpsVia0(s, e) }), try: { q: 'What is the new temperature?', answer: e, suffix: '°C', allowNeg: true } },
        { say: '<b>Rises</b> means going <b>up</b>. From −4°C a rise of 6 degrees: 4 up to 0, then 2 more → <b>2°C</b>.', show: V.numberLine({ min: -6, max: 4, step: 1, signColors: true, jumps: [{ from: -4, to: 0, label: '+4' }, { from: 0, to: 2, label: '+2' }] }) },
        { say: 'Your turn, step by step! 💪', try: changeGuided(changePair(y)) },
      ];
    },
    gen(y) {
      const P = changePair(y);
      if (Math.random() < 0.5) return changeGuided(P);
      return { q: `The temperature is <b>${deg(P.s)}</b>. It ${P.down ? 'falls' : 'rises'} by <b>${P.k}</b> degrees. What is the new temperature?`, visual: `<div class="row-center">${V.thermometer(P.s, { min: -20, max: 20 })}</div>`, answer: P.e, suffix: '°C', allowNeg: true, hint: 'Go to 0 first, then the rest.', steps: [nl([P.s, P.e], { jumps: jumpsVia0(P.s, P.e) }), `= <b>${deg(P.e)}</b>`] };
    },
    word(y) {
      const P = changePair(y);
      const city = pick(CITIES);
      const story = P.down
        ? `In ${city} it was <b>${deg(P.s)}</b> at sunset. During the night the temperature fell by <b>${P.k}</b> degrees. What was the temperature in the night?`
        : `In ${city} it was <b>${deg(P.s)}</b> at dawn. By midday the temperature had risen by <b>${P.k}</b> degrees. What was the temperature at midday?`;
      return changeGuided(P, story);
    },
  };

  /* =====================================================================
   * Y5–6: The difference across zero
   * ===================================================================== */
  function diffPair(y) {
    if (y >= 6 && Math.random() < 0.35) { const a = -rand(8, 25); const b = rand(a + 2, -1); return { a, b }; }
    return { a: -rand(2, y >= 6 ? 25 : 15), b: rand(2, y >= 6 ? 30 : 15) };
  }
  function diffGuided({ a, b }, q, story) {
    const parts = b > 0
      ? [
        { say: `How far is <b>${fmt(a)}</b> from 0?`, answer: -a, hint: 'Count the steps up to zero.' },
        { say: `How far is 0 from <b>${fmt(b)}</b>?`, answer: b },
        { say: 'Add the two distances. What is the difference?', answer: b - a, after: `${-a} + ${b} = ${b - a}`, visual: nl([a, b], { jumps: jumpsVia0(a, b) }) },
      ]
      : [
        { say: 'Are both numbers below zero?', type: 'choice', choices: [{ v: 'y', html: 'Yes' }, { v: 'n', html: 'No' }], answer: 'y', after: 'Then we do not need to stop at zero.' },
        { say: `Count up from <b>${fmt(a)}</b> to <b>${fmt(b)}</b>. How many steps?`, answer: b - a, visual: nl([a, b], { jumps: [{ from: a, to: b, label: '?' }] }), after: `${fmt(b)} − ${paren(a)} = ${b - a}` },
      ];
    const p = { type: 'guided', q: q || `What is the difference between <b>${fmt(a)}</b> and <b>${fmt(b)}</b>?`, parts, steps: [nl([a, b], { jumps: b > 0 ? jumpsVia0(a, b) : [{ from: a, to: b, label: '+' + (b - a) }] }), `Difference = <b>${b - a}</b>`] };
    if (story) { p.story = true; p.scene = story; }
    return p;
  }
  const difference = {
    id: 'difference', title: 'The difference across zero', years: [5, 6],
    desc: 'Distance to zero plus distance from zero.',
    lesson(y) {
      const a = -rand(3, 12), b = rand(3, 15);
      const c1 = pick(CITIES), c2 = pick(WARM);
      return [
        { say: `In ${c1} it is <b>${deg(a)}</b> ❄️. In ${c2} it is <b>${deg(b)}</b> ☀️. How many degrees warmer is ${c2}? We need the <b>difference</b>: how far apart they are on the number line.`, show: nl([a, b], { points: [{ v: a, color: '#3b82f6', label: c1 }, { v: b, color: '#ef4444', label: c2 }] }) },
        { say: 'Zero is our stepping stone again. First: how far is the cold city from 0?', show: nl([a, b], { jumps: [{ from: a, to: 0, label: '?' }] }), try: { q: `How far from ${fmt(a)} up to 0?`, answer: -a } },
        { say: `${-a} degrees to reach 0. Now from 0 up to ${b}.`, show: nl([a, b], { jumps: [{ from: a, to: 0, label: String(-a) }, { from: 0, to: b, label: '?' }] }), try: { q: `How far from 0 up to ${b}?`, answer: b } },
        { say: 'Add the two parts to get the whole distance.', show: nl([a, b], { jumps: jumpsVia0(a, b) }), try: { q: `${-a} + ${b} = ?`, answer: b - a } },
        { say: `${c2} is <b>${b - a} degrees</b> warmer. 💡 It is the same as ${b} − ${paren(a)} = ${b - a}. If both numbers are negative, like −9 and −3, just count from one to the other: 6.`, show: V.numberLine({ min: -11, max: 1, step: 1, signColors: true, jumps: [{ from: -9, to: -3, label: '6' }] }) },
        { say: 'Your turn! 💪', try: diffGuided(diffPair(y)) },
      ];
    },
    gen(y) {
      const P = diffPair(y);
      if (Math.random() < 0.55) return diffGuided(P);
      return { q: `How many degrees between <b>${deg(P.a)}</b> and <b>${deg(P.b)}</b>?`, visual: nl([P.a, P.b], { points: [{ v: P.a, color: '#3b82f6' }, { v: P.b, color: '#ef4444' }] }), answer: P.b - P.a, suffix: '°C', hint: 'Count to zero, then on.', steps: [nl([P.a, P.b], { jumps: P.b > 0 ? jumpsVia0(P.a, P.b) : [{ from: P.a, to: P.b, label: '+' + (P.b - P.a) }] }), `= <b>${P.b - P.a}</b> degrees`] };
    },
    word(y) {
      const P = diffPair(y);
      if (P.b > 0 && Math.random() < 0.5) {
        return diffGuided(P, `A seagull flies <b>${P.b} m above</b> sea level. A fish swims <b>${-P.a} m below</b> sea level (${fmt(P.a)} m). How far apart are they?`, '🐟');
      }
      return diffGuided(P, `The coldest night in ${pick(CITIES)} was <b>${deg(P.a)}</b>. The warmest day was <b>${deg(P.b)}</b>. What is the difference in temperature?`, '🌡️');
    },
  };

  /* =====================================================================
   * Y5–6: Sea level and money owed
   * ===================================================================== */
  function diverP() {
    const d = rand(6, 30), u = rand(2, d - 1);
    return { q: `A diver 🤿 is <b>${d} m below</b> the sea (−${d} m). The diver swims <b>${u} m up</b>. Where is the diver now?`, answer: -d + u, suffix: 'm', allowNeg: true, hint: 'Up means add. Still under water?', steps: [nl([-d, -d + u], { jumps: [{ from: -d, to: -d + u, label: '+' + u }] }), `−${d} + ${u} = <b>${fmt(-d + u)}</b> m`] };
  }
  function spendP() {
    const have = rand(2, 20), spend = rand(have + 1, have + 25);
    return { q: `Your balance is <b>${bal(have)}</b>. You spend <b>${bal(spend)}</b>. What is your balance now?`, prefix: cur(), answer: have - spend, allowNeg: true, hint: 'Spend down to 0, then you owe the rest.', steps: [nl([have, have - spend], { jumps: jumpsVia0(have, have - spend) }), `Balance <b>${bal(have - spend)}</b> — you owe ${bal(spend - have)}.`] };
  }
  function oweP() {
    const owe = rand(3, 20), pay = rand(owe + 1, owe + 30);
    return { q: `You owe <b>${bal(owe)}</b>, so your balance is <b>${bal(-owe)}</b>. You pay in <b>${bal(pay)}</b>. What is your balance now?`, prefix: cur(), answer: pay - owe, hint: 'First pay back what you owe (back to 0).', steps: [nl([-owe, pay - owe], { jumps: jumpsVia0(-owe, pay - owe) }), `−${owe} + ${pay} = <b>${pay - owe}</b>`] };
  }
  const context = {
    id: 'context', title: 'Sea level and money owed', years: [5, 6],
    desc: 'Negative numbers in real life: below the sea and owing money.',
    lesson() {
      return [
        { say: '<b>Sea level</b> is 0 m 🌊. A bird flying 8 m above the water is at <b>8 m</b>. A diver 5 m under the water is at <b>−5 m</b>.', show: V.numberLine({ min: -12, max: 12, step: 2, signColors: true, points: [{ v: 8, emoji: '🐦', label: '8 m' }, { v: -5, emoji: '🤿', label: '−5 m' }, { v: 0, emoji: '🌊' }] }) },
        { say: 'Swimming <b>up</b> means adding. Swimming <b>down</b> means taking away. The diver gets closer to 0 when swimming up.', try: diverP() },
        { say: `Money works the same way! 💰 If you have ${cur()}0 and borrow ${cur()}5, your balance is <b>${bal(-5)}</b>. You <b>owe</b> 5. You must pay it back before you have any money again.`, show: V.numberLine({ min: -8, max: 8, step: 1, signColors: true, points: [{ v: -5, emoji: '🏦', label: bal(-5) }] }) },
        { say: 'If you spend more than you have, your balance goes <b>below zero</b>.', try: spendP() },
        { say: 'Your turn: paying back what you owe! 💪 First you get back to 0, then the rest is yours.', try: oweP() },
      ];
    },
    gen() { return pick([diverP, spendP, oweP])(); },
    word() {
      const nm = U.name();
      const owe = rand(4, 15), earn = rand(3, 8), weeks = rand(2, 5), total = earn * weeks;
      return {
        type: 'guided', scene: '🏦', story: true,
        q: `${nm} owes a friend <b>${bal(owe)}</b> (balance ${bal(-owe)}). ${nm} earns <b>${bal(earn)}</b> a week for <b>${weeks}</b> weeks and pays it all in. What is the balance at the end?`,
        parts: [
          { say: `How much does ${nm} earn in ${weeks} weeks?`, answer: total, prefix: cur() },
          { say: `Start at ${bal(-owe)} and add ${bal(total)}. What is the new balance?`, answer: total - owe, prefix: cur(), allowNeg: true, visual: nl([-owe, total - owe], { jumps: jumpsVia0(-owe, total - owe) }) },
          { say: `Does ${nm} still owe money?`, type: 'choice', choices: [{ v: 'yes', html: 'Yes, still below 0' }, { v: 'no', html: 'No, 0 or more' }], answer: total - owe < 0 ? 'yes' : 'no' },
        ],
      };
    },
  };

  /* =====================================================================
   * Y5: Counting in steps across zero
   * ===================================================================== */
  function seqProblem() {
    const step = pick([2, 3, 4, 5, 10, 25]);
    const down = Math.random() < 0.7;
    const start = (down ? 1 : -1) * step * rand(2, 4);
    const terms = Array.from({ length: 7 }, (_, i) => start + (down ? -step : step) * i);
    const hide = rand(3, 6);
    const shown = terms.slice(0, hide).map((v) => fmt(v)).concat(['?']);
    return {
      q: `What comes next? Count ${down ? 'back' : 'on'} in <b>${step}s</b>.`, visual: V.chips(shown, [hide]),
      answer: terms[hide], allowNeg: true, hint: `${down ? 'Take away' : 'Add'} ${step} each time — keep going past 0.`,
      steps: [V.chips(terms.slice(0, hide + 1).map((v) => fmt(v)), [hide]), `${fmt(terms[hide - 1])} ${down ? '−' : '+'} ${step} = <b>${fmt(terms[hide])}</b>`],
    };
  }
  const intervals = {
    id: 'intervals', title: 'Counting in steps across zero', years: [5, 5],
    desc: 'Keep the pattern going below zero: 10, 5, 0, −5, −10…',
    lesson() {
      return [
        { say: 'Counting in steps works below zero too! Count back in 5s from 15: 15, 10, 5, 0, … then keep going: −5, −10, −15.', show: V.chips(['15', '10', '5', '0', '−5', '−10', '−15'], [4, 5, 6]) },
        { say: 'On the number line every jump is the same size, even after we pass 0.', show: V.numberLine({ min: -17, max: 17, step: 5, signColors: true, jumps: [{ from: 15, to: 10, label: '−5' }, { from: 10, to: 5, label: '−5' }, { from: 5, to: 0, label: '−5' }, { from: 0, to: -5, label: '−5' }, { from: -5, to: -10, label: '−5' }] }) },
        { say: 'Your turn: what comes next?', try: seqProblem() },
        { say: 'Patterns can go up too: −12, −9, −6, −3, 0, 3… (count on in 3s).', show: V.chips(['−12', '−9', '−6', '−3', '0', '3'], [4]), try: seqProblem() },
        { say: 'One more! 💪', try: seqProblem() },
      ];
    },
    gen: () => seqProblem(),
  };

  /* =====================================================================
   * Y6: Adding and subtracting negative numbers
   * ===================================================================== */
  function calcOf(kind) {
    const a = rand(-10, 10) || 3, k = rand(1, 10);
    const b = kind === 'addPos' || kind === 'subPos' ? k : -k;
    const op = kind.startsWith('add') ? '+' : '−';
    const r = op === '+' ? a + b : a - b;
    return { a, b, op, r, k };
  }
  const RULE = {
    addPos: (c) => `Adding ${c.k} means move <b>${c.k} right</b> ➡️.`,
    subPos: (c) => `Taking away ${c.k} means move <b>${c.k} left</b> ⬅️.`,
    addNeg: (c) => `Adding a negative is like taking away: ${fmt(c.a)} + (−${c.k}) = ${fmt(c.a)} − ${c.k}. Move <b>${c.k} left</b> ⬅️.`,
    subNeg: (c) => `Taking away a negative is like adding: ${fmt(c.a)} − (−${c.k}) = ${fmt(c.a)} + ${c.k}. Move <b>${c.k} right</b> ➡️. Taking away a debt makes you richer!`,
  };
  const kindOf = (c) => (c.op === '+' ? (c.b > 0 ? 'addPos' : 'addNeg') : (c.b > 0 ? 'subPos' : 'subNeg'));
  function calcProblem(c) {
    const kd = kindOf(c);
    return {
      q: `${fmt(c.a)} ${c.op} ${paren(c.b)} = ?`, answer: c.r, allowNeg: true, visual: nl([c.a, c.r]),
      hint: kd === 'subNeg' ? 'Two minus signs side by side make a plus!' : kd === 'addNeg' ? 'Adding a negative moves you left.' : 'Start at the first number and move.',
      steps: [`Start at <b>${fmt(c.a)}</b>.`, RULE[kd](c), nl([c.a, c.r], { jumps: [{ from: c.a, to: c.r, label: (c.r > c.a ? '+' : '−') + Math.abs(c.r - c.a) }] }), `= <b>${fmt(c.r)}</b>`],
    };
  }
  function calcGuided(c) {
    const kd = kindOf(c);
    const right = kd === 'addPos' || kd === 'subNeg';
    return {
      type: 'guided', q: `${fmt(c.a)} ${c.op} ${paren(c.b)} = ?`, visual: nl([c.a, c.r], { points: [{ v: c.a, emoji: '🐸' }] }),
      parts: [
        { say: 'Which way does the frog hop?', type: 'choice', choices: [{ v: 'L', html: '⬅️ Left' }, { v: 'R', html: 'Right ➡️' }], answer: right ? 'R' : 'L', hint: '+ positive or − negative → right. − positive or + negative → left.', after: RULE[kd](c) },
        { say: 'How many steps?', answer: c.k },
        { say: 'Where does the frog land?', answer: c.r, allowNeg: true, visual: nl([c.a, c.r], { jumps: [{ from: c.a, to: c.r, label: (right ? '+' : '−') + c.k }] }) },
      ],
      steps: [RULE[kd](c), `= <b>${fmt(c.r)}</b>`],
    };
  }
  const addSub = {
    id: 'add-sub-negatives', title: 'Adding and subtracting negatives', years: [6, 6],
    desc: 'Four simple rules, with a number line and real reasons.',
    lesson() {
      const c1 = calcOf('subPos'), c2 = calcOf('addNeg'), c3 = calcOf('subNeg');
      return [
        { say: 'Every calculation starts at the <b>first number</b> on the number line 🐸. The sign and the second number tell the frog which way to hop.', show: LINE10({ points: [{ v: 2, emoji: '🐸' }] }) },
        { say: '<b>Rules 1 and 2</b> you already know: <b>+ positive</b> → hop right. <b>− positive</b> → hop left. Even if you go past zero!', try: calcProblem(c1) },
        { say: `<b>Rule 3: + negative → hop left.</b> Why? Adding a negative is like being handed a bill 🧾 of ${cur()}${c2.k}. You get <b>poorer</b>. So ${fmt(c2.a)} + (−${c2.k}) = ${fmt(c2.a)} − ${c2.k}.`, try: calcProblem(c2) },
        { say: `<b>Rule 4: − negative → hop right!</b> Why? If someone <b>takes away a debt</b> you owe, you get <b>richer</b> 🎉. Taking away cold makes it warmer ☀️. Two minus signs side by side make a plus: ${fmt(c3.a)} − (−${c3.k}) = ${fmt(c3.a)} + ${c3.k}.`, try: calcProblem(c3) },
        { say: 'Here are all four rules. Keep them handy!', show: `<table class="rules">
            <tr><td>+ positive</td><td>hop <b>right</b> ➡️</td><td>2 + 3 = 5</td></tr>
            <tr><td>− positive</td><td>hop <b>left</b> ⬅️</td><td>2 − 3 = −1</td></tr>
            <tr><td>+ negative</td><td>hop <b>left</b> ⬅️</td><td>2 + (−3) = −1</td></tr>
            <tr><td>− negative</td><td>hop <b>right</b> ➡️</td><td>2 − (−3) = 5</td></tr></table>` },
        { say: 'Your turn: decide the direction, then hop! 💪', try: calcGuided(calcOf(pick(['addNeg', 'subNeg']))) },
      ];
    },
    gen() {
      const c = calcOf(pick(['addPos', 'subPos', 'addNeg', 'subNeg', 'addNeg', 'subNeg']));
      return Math.random() < 0.4 ? calcGuided(c) : calcProblem(c);
    },
    word() {
      const a = -rand(3, 15), b = rand(-2, 12);
      return {
        type: 'guided', scene: '🧊', story: true,
        q: `A freezer is at <b>${deg(a)}</b>. A fridge is at <b>${deg(b)}</b>. How many degrees warmer is the fridge?`,
        parts: [
          { say: 'Which calculation finds the difference?', type: 'choice', choices: [{ v: 'a', html: `${fmt(b)} − ${paren(a)}` }, { v: 'b', html: `${fmt(b)} + ${paren(a)}` }], answer: 'a', after: 'Difference = warmer − colder.' },
          { say: `${fmt(b)} − ${paren(a)} is the same as…`, type: 'choice', choices: [{ v: 'p', html: `${fmt(b)} + ${-a}` }, { v: 'm', html: `${fmt(b)} − ${-a}` }], answer: 'p', after: 'Two minus signs side by side make a plus.' },
          { say: 'Work it out:', answer: b - a, suffix: '°C' },
        ],
      };
    },
  };

  /* =====================================================================
   * Y6: Mixed calculations (three numbers, missing numbers)
   * ===================================================================== */
  function threeTerm() {
    const a = rand(-10, 10) || -4;
    const b = rand(-9, 9) || 6, c = rand(-9, 9) || -5;
    const op1 = pick(['+', '−']), op2 = pick(['+', '−']);
    const m = op1 === '+' ? a + b : a - b;
    const r = op2 === '+' ? m + c : m - c;
    return { a, b, c, op1, op2, m, r };
  }
  const hop = (from, to) => [{ from, to, label: (to >= from ? '+' : '−') + Math.abs(to - from) }];
  function threeGuided(T) {
    return {
      type: 'guided', q: `${fmt(T.a)} ${T.op1} ${paren(T.b)} ${T.op2} ${paren(T.c)} = ?`,
      hint: 'Work from left to right, one hop at a time.',
      parts: [
        { say: `First part: ${fmt(T.a)} ${T.op1} ${paren(T.b)} = ?`, answer: T.m, allowNeg: true, visual: nl([T.a, T.m], { points: [{ v: T.a, emoji: '🐸' }] }), after: `= ${fmt(T.m)}` },
        { say: `Now: ${fmt(T.m)} ${T.op2} ${paren(T.c)} = ?`, answer: T.r, allowNeg: true, visual: nl([T.m, T.r], { points: [{ v: T.m, emoji: '🐸' }] }), after: `= <b>${fmt(T.r)}</b>` },
      ],
      steps: [nl([T.a, T.m], { jumps: hop(T.a, T.m) }), `${fmt(T.a)} ${T.op1} ${paren(T.b)} = ${fmt(T.m)}`, nl([T.m, T.r], { jumps: hop(T.m, T.r) }), `${fmt(T.m)} ${T.op2} ${paren(T.c)} = <b>${fmt(T.r)}</b>`],
    };
  }
  function missingP() {
    const a = rand(-12, 8);
    let r = rand(-12, 12);
    if (r === a) r = a - 5;
    const x = r - a;
    return { q: `${fmt(a)} + <span class="box">?</span> = ${fmt(r)}`, answer: x, allowNeg: true, visual: nl([a, r], { points: [{ v: a, emoji: '🐸' }, { v: r, color: '#16a34a', label: fmt(r) }] }), hint: 'How far, and which way, from the first number to the answer?', steps: [nl([a, r], { jumps: hop(a, r) }), `${x >= 0 ? 'Right' : 'Left'} ${Math.abs(x)} → the missing number is <b>${fmt(x)}</b>.`] };
  }
  const mixed = {
    id: 'mixed-calc', title: 'Mixed calculations', years: [6, 6],
    desc: 'Three numbers in a row, and missing numbers.',
    lesson() {
      const T = threeTerm();
      return [
        { say: `A long calculation like <b>${fmt(T.a)} ${T.op1} ${paren(T.b)} ${T.op2} ${paren(T.c)}</b> looks scary. But we just go <b>left to right</b>, one hop at a time. 🐸🐸`, show: nl([T.a, T.m, T.r]) },
        { say: 'Do the first part only.', try: { q: `${fmt(T.a)} ${T.op1} ${paren(T.b)} = ?`, answer: T.m, allowNeg: true, visual: nl([T.a, T.m], { points: [{ v: T.a, emoji: '🐸' }] }) } },
        { say: `Now carry on from <b>${fmt(T.m)}</b>.`, show: nl([T.a, T.m, T.r], { jumps: hop(T.a, T.m) }), try: { q: `${fmt(T.m)} ${T.op2} ${paren(T.c)} = ?`, answer: T.r, allowNeg: true } },
        { say: 'A <b>missing number</b> question asks: which hop takes me from the first number to the answer? Right means positive, left means negative.', try: missingP() },
        { say: 'Your turn: a long one, step by step! 💪', try: threeGuided(threeTerm()) },
      ];
    },
    gen() { return Math.random() < 0.6 ? threeGuided(threeTerm()) : missingP(); },
  };

  /* =====================================================================
   * Y6: Multi-step word problems
   * ===================================================================== */
  function multiStep() {
    const r = rand(0, 3);
    const nm = U.name();
    if (r === 0) {
      const t0 = -rand(2, 9), up = rand(6, 15), down = rand(8, 20);
      const t1 = t0 + up, t2 = t1 - down;
      return {
        type: 'guided', scene: '🌡️', story: true,
        q: `At 6 am it was <b>${deg(t0)}</b>. By noon the temperature rose by <b>${up}</b> degrees. By midnight it fell by <b>${down}</b> degrees. What was the temperature at midnight?`,
        parts: [
          { say: 'Temperature at noon?', answer: t1, suffix: '°C', allowNeg: true, visual: nl([t0, t1], { jumps: jumpsVia0(t0, t1) }) },
          { say: 'Temperature at midnight?', answer: t2, suffix: '°C', allowNeg: true, visual: nl([t1, t2], { jumps: jumpsVia0(t1, t2) }) },
          { say: 'What is the difference between the warmest and the coldest of the three times?', answer: Math.max(t0, t1, t2) - Math.min(t0, t1, t2), suffix: '°C' },
        ],
      };
    }
    if (r === 1) {
      const b0 = rand(5, 20), s1 = rand(8, 20), s2 = rand(3, 12), gift = rand(5, 25);
      const b1 = b0 - s1, b2 = b1 - s2, b3 = b2 + gift;
      return {
        type: 'guided', scene: '💳', story: true,
        q: `${nm} has <b>${bal(b0)}</b> in the bank. ${nm} buys a game for <b>${bal(s1)}</b> and a book for <b>${bal(s2)}</b>. Then ${nm} gets <b>${bal(gift)}</b> birthday money. What is the balance now?`,
        parts: [
          { say: 'Balance after buying the game?', answer: b1, prefix: cur(), allowNeg: true },
          { say: 'Balance after buying the book?', answer: b2, prefix: cur(), allowNeg: true },
          { say: 'Balance after the birthday money?', answer: b3, prefix: cur(), allowNeg: true, visual: nl([b2, b3], { jumps: jumpsVia0(b2, b3) }) },
        ],
      };
    }
    if (r === 2) {
      const d0 = -rand(2, 8), dn = rand(5, 15), upm = rand(3, dn + 4);
      const d1 = d0 - dn, d2 = d1 + upm;
      return {
        type: 'guided', scene: '🤿', story: true,
        q: `A diver is at <b>${fmt(d0)} m</b>. The diver goes down another <b>${dn} m</b> to look at a shipwreck, then swims up <b>${upm} m</b>. Where is the diver now?`,
        parts: [
          { say: 'Depth at the shipwreck?', answer: d1, suffix: 'm', allowNeg: true },
          { say: 'Depth after swimming up?', answer: d2, suffix: 'm', allowNeg: true, visual: nl([d1, d2], { jumps: hop(d1, d2) }) },
          { say: 'How many metres below the surface (0 m) is that?', answer: -d2, suffix: 'm' },
        ],
      };
    }
    const f0 = rand(1, 5), dn = rand(f0 + 1, f0 + 4), upf = rand(1, 3);
    const f1 = f0 - dn, f2 = f1 + upf;
    return {
      type: 'guided', scene: '🛗', story: true,
      q: `${nm} gets in the lift on floor <b>${f0}</b>, goes down <b>${dn}</b> floors to the car park, then sees the car is parked <b>${upf}</b> floor${upf > 1 ? 's' : ''} higher. Which floor is the car on?`,
      parts: [
        { say: 'Which floor did the lift stop at first?', answer: f1, allowNeg: true },
        { say: 'Which floor is the car on?', answer: f2, allowNeg: true },
      ],
    };
  }
  const multi = {
    id: 'multi-step', title: 'Multi-step problems', years: [6, 6],
    desc: 'Real problems in small steps: weather, money, divers and lifts.',
    lesson() {
      return [
        { say: 'Big word problems hide <b>several small steps</b>. 🕵️ Read it twice, then find each change: <b>up / rise / earn = add</b>, <b>down / fall / spend = take away</b>.', show: V.chips(['rise ➕', 'fall ➖', 'earn ➕', 'spend ➖', 'up ➕', 'down ➖']) },
        { say: 'Do one step at a time and write down each answer. A number line helps when you cross zero.', try: { q: `It was <b>${deg(-3)}</b>. It rose by 8 degrees. What is the temperature now?`, answer: 5, suffix: '°C', allowNeg: true, steps: [nl([-3, 5], { jumps: jumpsVia0(-3, 5) })] } },
        { say: 'The next change starts from <b>your last answer</b>.', try: { q: `It was <b>${deg(5)}</b>. Then it fell by 11 degrees. What is it now?`, answer: -6, suffix: '°C', allowNeg: true, steps: [nl([5, -6], { jumps: jumpsVia0(5, -6) })] } },
        { say: 'Your turn: a full problem, step by step! 💪', try: multiStep() },
      ];
    },
    gen: () => multiStep(),
    word: () => multiStep(),
  };

  /* ---------------- explorer: frog, thermometer and lift ---------------- */
  function explore(root) {
    let v = 0, mode = 'thermo';
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Move the frog. Watch the thermometer or the lift change too!</p>
        <div class="ex-controls buttons">
          <button class="btn step" data-d="-5">−5</button><button class="btn step" data-d="-1">−1</button>
          <span class="ex-eq big" id="val"></span>
          <button class="btn step" data-d="1">+1</button><button class="btn step" data-d="5">+5</button>
        </div>
        <div class="seg" role="tablist"><button data-m="thermo" class="on">🌡️ Thermometer</button><button data-m="lift">🛗 Lift</button></div>
        <div id="line"></div>
        <div class="ex-split"><div id="pic"></div><div id="say" class="side-text"></div></div>
      </div>`;
    const lim = () => (mode === 'lift' ? [-4, 6] : [-10, 10]);
    function draw() {
      const [lo, hi] = lim();
      v = Math.max(lo, Math.min(hi, v));
      root.querySelector('#val').innerHTML = `<span class="${v < 0 ? 'negc' : v > 0 ? 'posc' : ''}">${fmt(v)}</span>`;
      root.querySelector('#line').innerHTML = LINE10({ points: [{ v, emoji: '🐸' }] });
      root.querySelector('#pic').innerHTML = mode === 'thermo' ? V.thermometer(v, { showValue: true }) : V.elevator(v, { min: -4, max: 6 });
      const what = mode === 'thermo'
        ? (v < 0 ? `${deg(v)} — that is ${-v} degree${v === -1 ? '' : 's'} <b>below freezing</b>. 🥶` : v > 0 ? `${deg(v)} — above freezing. 🙂` : '0°C — water starts to freeze! 🧊')
        : (v < 0 ? `Floor ${fmt(v)} — ${-v} floor${v === -1 ? '' : 's'} <b>under the ground</b>. 🚗` : v > 0 ? `Floor ${v} — above the ground. 🏢` : 'Floor 0 — the ground floor. 🚪');
      root.querySelector('#say').innerHTML = `<p>${what}</p><p>We say “<b>${word(v)}</b>”.</p><p>${v < 0 ? `${fmt(v)} is <b>less than</b> 0.` : v > 0 ? `${v} is <b>greater than</b> 0.` : 'Zero is in the middle.'}</p>${v ? `<p class="muted">Its mirror number is ${fmt(-v)}: the same distance from zero, on the other side.</p>` : ''}`;
    }
    root.querySelectorAll('.step').forEach((b) => { b.onclick = () => { v += +b.dataset.d; U.sound('click'); draw(); }; });
    root.querySelectorAll('.seg button').forEach((b) => {
      b.onclick = () => { mode = b.dataset.m; root.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b)); draw(); };
    });
    draw();
  }

  TOPICS.push({
    id: 'negatives', name: 'Negative Numbers', icon: '🌡️', color: '#3b82f6', minYear: 3,
    tagline: 'Below zero: cold days, lifts and debts',
    explore,
    skills: [belowZero, thermometers, lifts, countBack, placeNeg, compare, tempChange, difference, context, intervals, addSub, mixed, multi],
  });
})();
