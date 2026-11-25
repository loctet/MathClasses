'use strict';
/* Time: telling the time (o'clock to the nearest minute), digital, Roman numerals,
 * am/pm and 24-hour clock, days and months, durations, units of time, timetables. */
(() => {
  const { rand, pick, shuffle } = U;
  const pad = (n) => String(n).padStart(2, '0');
  const H12 = (h) => ((((h - 1) % 12) + 12) % 12) + 1;
  const dig = (h, m) => `${H12(h)}:${pad(m)}`;
  const d24 = (h, m) => `${pad(((h % 24) + 24) % 24)}:${pad(m)}`;
  const big = (html) => `<div class="say-big">${html}</div>`;
  const row = (...clocks) => `<div class="clock-row">${clocks.join('<span class="op">→</span>')}</div>`;
  const ck = (h, m, o) => V.clock(h, m, o);
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /** The time in words, the way children say it. */
  function words(h, m) {
    const H = H12(h), N = H12(h + 1);
    if (m === 0) return `${H} o’clock`;
    if (m === 15) return `quarter past ${H}`;
    if (m === 30) return `half past ${H}`;
    if (m === 45) return `quarter to ${N}`;
    if (m < 30) return `${m} minute${m === 1 ? '' : 's'} past ${H}`;
    return `${60 - m} minute${60 - m === 1 ? '' : 's'} to ${N}`;
  }
  /** Common mistakes: wrong hour, swapped hands, past/to mixed up. */
  function wrongTimes(h, m) {
    const out = [[h + 1, m], [h - 1, m]];
    if (m % 5 === 0 && m > 0) out.push([m / 5, (H12(h) * 5) % 60]);
    if (m !== 0 && m !== 30) out.push([h, 60 - m]);
    if (m > 30) out.push([h + 1, 60 - m]);
    return out;
  }
  function readChoice(h, m, o = {}) {
    const correct = words(h, m);
    const opts = new Set([correct]);
    for (const [a, b] of shuffle(wrongTimes(h, m))) { if (opts.size >= (o.n || 3)) break; opts.add(words(a, b)); }
    return {
      type: 'choice', q: o.q || 'What time does the clock show?',
      visual: o.noVisual ? undefined : ck(h, m, o.clock || {}),
      choices: shuffle([...opts]).map((w) => ({ v: w, html: w })), answer: correct,
      hint: o.hint || (m === 0 ? 'The long hand is on 12, so it is something o’clock.' : 'Look at the long minute hand first, then the short hour hand.'),
      steps: o.steps || readSteps(h, m),
    };
  }
  function readSteps(h, m) {
    const st = [];
    if (m === 0) st.push('The long minute hand points to <b>12</b>: it is an <b>o’clock</b> time.');
    else if (m <= 30) st.push(`The long minute hand has gone <b>${m} minutes</b> round from the 12 (count in 5s${m % 5 ? ', then 1s' : ''}). It is on the right side: minutes <b>past</b>.`);
    else st.push(`The long minute hand is on the left side: it is <b>${60 - m} minutes</b> before the 12, so we say minutes <b>to</b> the next hour.`);
    st.push(m < 30 || m === 0 ? `The short hour hand has just passed <b>${H12(h)}</b>.` : `The short hour hand is getting close to <b>${H12(h + 1)}</b>.`);
    st.push(`So it is <b>${words(h, m)}</b> (${dig(h, m)}).`);
    st.push(ck(h, m, { minuteNumbers: true, sweep: true }));
    return st;
  }
  const setClock = (h, m, step, q, extra = {}) => Object.assign({ type: 'clockset', q, h: H12(h), m, step, hint: 'Move the long minute hand first, then the short hour hand.', steps: readSteps(h, m) }, extra);

  /* ================= skills ================= */
  const oclock = {
    id: 'oclock', title: 'O’clock and half past', years: [1, 1], icon: '🕐',
    desc: 'The two hands of a clock, o’clock and half past.',
    lesson() {
      const h = rand(1, 12), h2 = rand(1, 11), h3 = rand(1, 12), h4 = rand(1, 12);
      return [
        { say: 'This is a <b>clock</b>. It has the numbers 1 to 12 and two hands. The <b class="hh">short blue hand</b> is the <b>hour hand</b>. The <b class="mh">long red hand</b> is the <b>minute hand</b>.', show: ck(3, 0) },
        { say: `When the long minute hand points <b>straight up to 12</b>, it is an <b>o’clock</b> time. Then look at the short hand: it points to the hour.`, show: ck(h, 0),
          try: readChoice(h, 0, { noVisual: true, q: 'What time is it?' }) },
        { say: 'In one hour, the minute hand goes <b>all the way round</b> once. The hour hand moves on to the next number.', show: row(ck(h, 0), ck(h + 1, 0)) },
        { say: `When the minute hand has gone <b>half way</b> round, it points down to the <b>6</b>. That is <b>half past</b>. The yellow part shows half the clock.`, show: ck(h2, 30, { sweep: true }),
          try: readChoice(h2, 30, { noVisual: true, q: 'What time is it?' }) },
        { say: `Careful! At half past, the hour hand is <b>between two numbers</b>, ${h2} and ${h2 + 1}. We say the number it has <b>just passed</b>: half past <b>${h2}</b>.`, show: ck(h2, 30),
          try: { type: 'choice', q: 'Which is right?', choices: shuffle([`half past ${h2}`, `half past ${h2 + 1}`]).map((w) => ({ v: w, html: w })), answer: `half past ${h2}`, hint: 'Which number has the short hand just gone past?' } },
        { say: `Your turn! Move the hands to show <b>${words(h3, 0)}</b>. Use the buttons, or tap the clock.`, try: setClock(h3, 0, 30, `Show <b>${words(h3, 0)}</b>.`) },
        { say: `And now <b>half past ${H12(h4)}</b>. Remember: the minute hand goes to 6.`, try: setClock(h4, 30, 30, `Show <b>half past ${H12(h4)}</b>.`) },
      ];
    },
    gen() {
      const h = rand(1, 12), m = pick([0, 30]);
      return Math.random() < 0.5 ? readChoice(h, m) : setClock(h, m, 30, `Show <b>${words(h, m)}</b> on the clock.`);
    },
    word() {
      const n = U.name();
      const [act, h, m, e] = pick([['wakes up', 7, 0, '⏰'], ['has lunch', 12, 0, '🥪'], ['goes to the park', 3, 30, '🛝'], ['has a bath', 6, 30, '🛁'], ['goes to bed', 7, 30, '🛏️'], ['reads a story', 8, 0, '📖']]);
      return setClock(h, m, 30, `${n} ${act} at <b>${words(h, m)}</b>. Show this time on the clock.`, { scene: e, story: true });
    },
  };

  const quarters = {
    id: 'quarters', title: 'Quarter past and quarter to', years: [2, 2], icon: '🕒',
    desc: 'Split the clock into four quarters.',
    lesson() {
      const h = rand(1, 12), h2 = rand(1, 12), h3 = rand(1, 12), h4 = rand(1, 12);
      return [
        { say: 'Cut the clock into <b>4 equal parts</b>, like a pizza 🍕. Each part is a <b>quarter</b> of an hour.', show: ck(12, 0, { quarters: true, noHour: true, noMinute: true }) },
        { say: `When the minute hand points to <b>3</b>, it has gone one quarter of the way round. That is <b>quarter past</b>.`, show: ck(h, 15, { sweep: true }),
          try: readChoice(h, 15, { noVisual: true, q: 'What time is it?' }) },
        { say: 'Minute hand on <b>6</b>: half way round. <b>Half past</b>. Minute hand on <b>9</b>: three quarters of the way round. Only one quarter is left until the next o’clock!', show: row(ck(h, 30, { sweep: true }), ck(h, 45, { sweep: true })) },
        { say: `So when the minute hand is on 9, we say <b>quarter to</b> the <b>next</b> hour. Look: the hour hand is nearly at ${H12(h2 + 1)}.`, show: row(ck(h2, 45), ck(h2 + 1, 0)),
          try: readChoice(h2, 45, { noVisual: true, q: 'What time is the first clock?' }) },
        { say: 'Here is the whole family. 15 minutes is a quarter of an hour, because 4 × 15 = 60.', show: row(ck(3, 0, { size: 150 }), ck(3, 15, { size: 150 }), ck(3, 30, { size: 150 }), ck(3, 45, { size: 150 })) + big('3 o’clock · quarter past 3 · half past 3 · quarter to 4') },
        { say: `Your turn! Show <b>quarter past ${H12(h3)}</b>.`, try: setClock(h3, 15, 15, `Show <b>quarter past ${H12(h3)}</b>.`) },
        { say: `Now show <b>quarter to ${H12(h4 + 1)}</b>. Think: which hour has just gone?`, try: setClock(h4, 45, 15, `Show <b>quarter to ${H12(h4 + 1)}</b>.`) },
      ];
    },
    gen() {
      const h = rand(1, 12), m = pick([0, 15, 30, 45]);
      return Math.random() < 0.5 ? readChoice(h, m, { n: 4 }) : setClock(h, m, 15, `Show <b>${words(h, m)}</b> on the clock.`);
    },
    word() {
      const n = U.name(), h = rand(2, 7), m = pick([15, 45]);
      const [what, e] = pick([['The film starts', '🎬'], ['Swimming starts', '🏊'], ['The party starts', '🎉'], ['The bus leaves', '🚌']]);
      return setClock(h, m, 15, `${what} at <b>${words(h, m)}</b>. Help ${n} show it on the clock.`, { scene: e, story: true });
    },
  };

  const fiveMin = {
    id: 'five-minutes', title: 'Telling the time to 5 minutes', years: [2, 3], icon: '🕔',
    desc: 'Count in 5s round the clock: minutes past and minutes to.',
    lesson() {
      const h = rand(1, 12), k = rand(1, 5), h2 = rand(1, 12), j = rand(7, 11), h3 = rand(1, 12), m3 = pick([5, 10, 20, 25, 35, 40, 50, 55]);
      const fives = Array.from({ length: k }, (_, i) => (i + 1) * 5);
      const back = Array.from({ length: 12 - j }, (_, i) => (i + 1) * 5);
      return [
        { say: 'Look at the little marks. Between two big numbers there are <b>5 small steps</b>: 5 minutes. So we count the minute hand <b>in 5s</b> (the red numbers).', show: ck(12, 0, { minuteNumbers: true, noHour: true, noMinute: true }) },
        { say: `The minute hand points to <b>${k}</b>. Count in 5s from the 12: ${fives.join(', ')}.`, show: ck(h, k * 5, { minuteNumbers: true, sweep: true }),
          try: { q: 'How many minutes past the hour?', answer: k * 5, suffix: 'minutes', hint: `Count in 5s: ${fives.join(', ')}.` } },
        { say: 'On the <b>right</b> side of the clock we count minutes <b>past</b> the hour. On the <b>left</b> side we count how many minutes are left <b>to</b> the next hour.', show: ck(12, 0, { halves: true, noHour: true, noMinute: true }) },
        { say: `This minute hand is on <b>${j}</b>, on the “to” side. Count <b>backwards</b> in 5s to the 12: ${back.join(', ')}.`, show: ck(h2, j * 5, { halves: true, minuteNumbers: true }),
          try: { q: 'How many minutes to the next hour?', answer: 60 - j * 5, suffix: 'minutes', hint: `Count back from the ${j} to the 12 in 5s.` } },
        { say: `So the time is <b>${words(h2, j * 5)}</b>. The hour hand is nearly at ${H12(h2 + 1)}.`, show: ck(h2, j * 5),
          try: readChoice(h3, m3, { q: 'Now read this clock:' }) },
        (() => { const hh = rand(1, 12), mm = pick([5, 10, 20, 25, 35, 40, 50, 55]); return { say: `Your turn: show <b>${words(hh, mm)}</b>.`, try: setClock(hh, mm, 5, `Show <b>${words(hh, mm)}</b>.`, { minuteNumbers: true }) }; })(),
      ];
    },
    gen(y) {
      const h = rand(1, 12), m = rand(1, 11) * 5, r = Math.random();
      if (r < 0.4) return readChoice(h, m, { n: 4 });
      if (r < 0.65) return { q: m <= 30 ? 'How many minutes <b>past</b> the hour?' : 'How many minutes <b>to</b> the next hour?', visual: ck(h, m, { minuteNumbers: y <= 2, halves: true }), answer: m <= 30 ? m : 60 - m, suffix: 'minutes', hint: m <= 30 ? 'Count in 5s from the 12.' : 'Count back in 5s to the 12.', steps: readSteps(h, m) };
      return setClock(h, m, 5, `Show <b>${words(h, m)}</b> on the clock.`, { minuteNumbers: y <= 2 });
    },
    word() {
      const n = U.name(), h = rand(3, 6), m = rand(1, 11) * 5;
      return setClock(h, m, 5, `Football practice starts at <b>${words(h, m)}</b>. Show ${n} the time on the clock.`, { scene: '⚽', story: true });
    },
  };

  const nearestMin = {
    id: 'nearest-minute', title: 'Time to the nearest minute', years: [3, 4], icon: '⏱️',
    desc: 'Count in 5s, then in 1s.',
    lesson() {
      const h = rand(1, 12);
      let m = rand(31, 58); if (m % 5 === 0) m++;
      const f = Math.floor(m / 5) * 5;
      const hh = rand(1, 12), mm = pick([7, 13, 22, 28, 34, 41, 47, 53]);
      return [
        { say: 'Not every time is a 5! The minute hand can stop on a <b>small mark</b>. Each small mark is <b>1 minute</b>.', show: ck(h, m, { minuteNumbers: true }) },
        { say: `First count in <b>5s</b> up to the last big number the minute hand has passed (the ${Math.floor(m / 5) || 12}).`, show: ck(h, m, { minuteNumbers: true }),
          try: { q: 'How many minutes is that?', answer: f, suffix: 'minutes', hint: 'Count in 5s from the 12.' } },
        { say: `Now count the <b>small marks</b> after it, in 1s.`, show: ck(h, m, { minuteNumbers: true, sweep: true }),
          try: { q: 'How many more minutes?', answer: m - f, hint: 'Count the little marks one by one.' } },
        { say: `${f} + ${m - f} = <b>${m}</b> minutes past ${H12(h)}. That is <b>${dig(h, m)}</b>. But it's on the “to” side, so people also say how many minutes <b>to</b> ${H12(h + 1)}.`, show: ck(h, m, { halves: true }),
          try: { q: `60 − ${m} = ? minutes to ${H12(h + 1)}`, answer: 60 - m, hint: `From ${m} up to 60.` } },
        { say: `So the time is <b>${words(h, m)}</b>, or <b>${dig(h, m)}</b>.`, show: ck(h, m) + V.digital(h, m) },
        { say: `Your turn: show <b>${words(hh, mm)}</b>. Use the ±1 buttons for the last few minutes.`, try: setClock(hh, mm, 1, `Show <b>${words(hh, mm)}</b>.`, { minuteNumbers: true }) },
      ];
    },
    gen() {
      const h = rand(1, 12); let m = rand(1, 59); if (m % 5 === 0) m++;
      const r = Math.random();
      if (r < 0.4) return readChoice(h, m, { n: 4 });
      if (r < 0.7) return { q: 'How many minutes <b>past</b> the hour does this clock show?', visual: ck(h, m, { minuteNumbers: true }), answer: m, suffix: 'minutes', hint: 'Count in 5s, then 1s.', steps: readSteps(h, m) };
      return setClock(h, m, 1, `Show <b>${dig(h, m)}</b> on the clock.`);
    },
  };

  const digitalSkill = {
    id: 'digital', title: 'Digital clocks', years: [2, 4], icon: '📟',
    desc: 'Hours, a colon, then minutes past the hour.',
    lesson(y) {
      const h = rand(1, 12), m = pick([25, 10, 20, 5]);
      const h2 = rand(1, 11), to = pick([20, 10, 25, 5]);
      const step = y <= 2 ? 5 : 1;
      const h3 = rand(1, 12), m3 = rand(1, 59 / step | 0) * step;
      const h4 = rand(1, 12), m4 = rand(0, 59 / step | 0) * step;
      return [
        { say: 'A <b>digital</b> clock shows the time with numbers. Before the <b>:</b> is the <b>hour</b>. After it are the <b>minutes past</b> the hour.', show: row(ck(h, m), V.digital(h, m)) },
        { say: `O’clock has <b>00</b> minutes: ${H12(h)} o’clock is ${dig(h, 0)}. Quarter past is <b>:15</b>, half past <b>:30</b>, quarter to <b>:45</b>.`, show: big(`${dig(h, 0)} · ${dig(h, 15)} · ${dig(h, 30)} · ${dig(h, 45)}`),
          try: { type: 'choice', q: `Half past ${H12(h)} is…`, choices: shuffle([dig(h, 30), `${H12(h)}:50`, dig(h + 1, 30)]).map((v) => ({ v, html: v })), answer: dig(h, 30), hint: 'Half an hour is 30 minutes.' } },
        { say: `Minutes <b>past</b> are easy: <b>${m} past ${H12(h)}</b> → write ${H12(h)}, then ${pad(m)}.`, show: row(ck(h, m), V.digital(h, m)),
          try: { type: 'time', q: `Write <b>${words(h, m)}</b> as a digital time.`, answer: { h: H12(h), m }, hint: `Hours first (${H12(h)}), then <b>:</b>, then the minutes with two digits.` } },
        { say: `Minutes <b>to</b> need one more step. <b>${to} to ${H12(h2 + 1)}</b> means it is still the <b>${H12(h2)}</b> hour, and ${60 - to} minutes have passed (60 − ${to} = ${60 - to}).`, show: row(ck(h2, 60 - to, { halves: true }), V.digital(h2, 60 - to)),
          try: { q: `${to} to ${H12(h2 + 1)}: how many minutes past ${H12(h2)}?`, answer: 60 - to, hint: `60 − ${to}` } },
        { say: 'Your turn: read the clock and write it the digital way.', show: ck(h3, m3, { minuteNumbers: y <= 2 }),
          try: { type: 'guided', parts: [{ say: 'Which hour has the short hand just passed? Type just that number.', answer: H12(h3) }, { say: 'How many minutes past the hour? Type just the minutes.', answer: m3 }, { say: 'Now write the whole digital time:', type: 'time', answer: { h: H12(h3), m: m3 }, after: `It is ${dig(h3, m3)} ✔️` }] } },
        { say: `And the other way: show <b>${dig(h4, m4)}</b> on the clock.`, show: V.digital(h4, m4), try: setClock(h4, m4, step, `Show ${dig(h4, m4)}.`) },
      ];
    },
    gen(y) {
      const step = y <= 2 ? 5 : y === 3 ? pick([1, 5]) : 1;
      const h = rand(1, 12), m = rand(0, 59 / step | 0) * step, r = Math.random();
      if (r < 0.35) {
        const opts = new Set([dig(h, m), dig(h + 1, m), dig(h, (60 - m) % 60), dig(m / 5 | 0 || 12, (H12(h) * 5) % 60)]);
        return { type: 'choice', q: 'Which digital time matches the clock?', visual: ck(h, m), choices: shuffle([...opts]).slice(0, 4).concat([]).map((v) => ({ v, html: v })).filter((c, i, a) => a.findIndex((x) => x.v === c.v) === i), answer: dig(h, m), hint: 'Hours first, then minutes past.', steps: readSteps(h, m) };
      }
      if (r < 0.65) {
        const opts = new Set([words(h, m)]);
        for (const [a, b] of shuffle(wrongTimes(h, m))) { if (opts.size >= 3) break; opts.add(words(a, b)); }
        return { type: 'choice', q: `What is <b>${dig(h, m)}</b> in words?`, visual: V.digital(h, m), choices: shuffle([...opts]).map((v) => ({ v, html: v })), answer: words(h, m), hint: m > 30 ? `More than 30 minutes past: say minutes TO the next hour (60 − ${m}).` : 'Minutes past the hour.' };
      }
      if (r < 0.82) return { type: 'time', q: 'Write the time on this clock as a digital time.', visual: ck(h, m, { minuteNumbers: y <= 2 }), answer: { h: H12(h), m }, hint: 'Hour the short hand has passed, then :, then minutes past.', steps: readSteps(h, m) };
      return setClock(h, m, step, `Show <b>${dig(h, m)}</b> on the clock.`, { visual: V.digital(h, m) });
    },
  };
  // make sure choices include the answer after slicing
  const _dg = digitalSkill.gen;
  digitalSkill.gen = (y) => { for (;;) { const p = _dg(y); if (p.type !== 'choice' || p.choices.some((c) => c.v === p.answer)) return p; } };

  const daysMonths = {
    id: 'days-months', title: 'Days of the week and months', years: [1, 2], icon: '📅',
    desc: 'The order of days and months, yesterday and tomorrow.',
    lesson(y) {
      const d = rand(0, 6), ds = shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 4);
      const ms = shuffle([...Array(12).keys()]).slice(0, y === 1 ? 4 : 5);
      return [
        { say: 'There are <b>7 days</b> in a week. They always come in the same order, then start again.', show: V.chips(DAYS, [5, 6]) + '<p class="center muted">Saturday and Sunday are the weekend.</p>' },
        { say: 'Put these days in order, starting with the one nearest to Monday.', try: { type: 'order', items: ds.map((i) => ({ v: i, html: DAYS[i] })), dir: 'asc', hint: 'Say the days: Monday, Tuesday, Wednesday…' } },
        { say: `If today is <b>${DAYS[d]}</b>, then <b>tomorrow</b> is the next day and <b>yesterday</b> was the day before.`, show: V.chips([DAYS[(d + 6) % 7], DAYS[d], DAYS[(d + 1) % 7]], [1]),
          try: { type: 'choice', q: `Today is ${DAYS[d]}. What day is tomorrow?`, choices: shuffle([DAYS[(d + 1) % 7], DAYS[(d + 6) % 7], DAYS[(d + 2) % 7]]).map((v) => ({ v, html: v })), answer: DAYS[(d + 1) % 7] } },
        { say: 'There are <b>12 months</b> in a year.', show: V.chips(MONTHS) },
        { say: 'Put these months in order.', try: { type: 'order', items: ms.map((i) => ({ v: i, html: MONTHS[i] })), dir: 'asc', hint: 'January is first, December is last.' } },
      ];
    },
    gen(y) {
      const r = Math.random(), d = rand(0, 6), mo = rand(0, 11);
      if (r < 0.3) { const after = Math.random() < 0.5; const ans = DAYS[(d + (after ? 1 : 6)) % 7]; return { type: 'choice', q: `What day comes <b>${after ? 'after' : 'before'}</b> ${DAYS[d]}?`, choices: shuffle([...new Set([ans, DAYS[(d + 1) % 7], DAYS[(d + 6) % 7], DAYS[(d + 2) % 7]])]).map((v) => ({ v, html: v })), answer: ans, hint: 'Say the days in order.' }; }
      if (r < 0.5) { const ans = MONTHS[(mo + 1) % 12]; return { type: 'choice', q: `Which month comes after <b>${MONTHS[mo]}</b>?`, choices: shuffle([...new Set([ans, MONTHS[(mo + 11) % 12], MONTHS[(mo + 2) % 12]])]).map((v) => ({ v, html: v })), answer: ans }; }
      if (r < 0.75) { const pickD = Math.random() < 0.5; const idx = shuffle([...Array(pickD ? 7 : 12).keys()]).slice(0, 4); return { type: 'order', q: `Put the ${pickD ? 'days' : 'months'} in order.`, items: idx.map((i) => ({ v: i, html: (pickD ? DAYS : MONTHS)[i] })), dir: 'asc' }; }
      const k = y === 1 ? 1 : rand(1, 4);
      return { q: k === 1 ? 'How many days are there in a week?' : `How many days are there in <b>${k}</b> weeks?`, answer: 7 * k, suffix: 'days', hint: k === 1 ? 'Count Monday to Sunday.' : `${k} lots of 7.` };
    },
  };

  const roman = {
    id: 'roman', title: 'Roman numerals on clocks', years: [3, 4], icon: '🏛️',
    desc: 'I, V and X: read clocks with Roman numerals.',
    lesson() {
      const h = rand(1, 12), m = rand(1, 11) * 5;
      return [
        { say: 'Some clocks use <b>Roman numerals</b> — numbers the ancient Romans used 2,000 years ago!', show: ck(10, 10, { roman: true }) },
        { say: 'There are only three letters on a clock: <b>I = 1</b>, <b>V = 5</b>, <b>X = 10</b>.', show: V.chips(['I = 1', 'V = 5', 'X = 10']) },
        { say: 'A small letter <b>after</b> a bigger one is <b>added</b>: VI = 5 + 1 = 6, VII = 5 + 2 = 7.', show: big('VI = 6 · VII = 7 · XI = 11'), try: { q: 'VIII = ?', answer: 8, hint: 'V + I + I + I' } },
        { say: 'A small letter <b>before</b> a bigger one is <b>taken away</b>: IV = 5 − 1 = 4, IX = 10 − 1 = 9.', show: big('IV = 4 · IX = 9'), try: { q: 'IX = ?', answer: 9, hint: 'I is before X: 10 − 1.' } },
        { say: 'Here are all twelve in order.', show: V.chips(V.ROMAN.slice(1).concat('XII').map((r, i) => `${r} = ${i + 1}`)) },
        { say: 'Now read a Roman clock. It works just like a normal one!', try: readChoice(h, m, { clock: { roman: true } }) },
      ];
    },
    gen() {
      const r = Math.random(), n = rand(1, 12), R = V.ROMAN[n % 12];
      if (r < 0.35) return { q: `What number is <b>${R}</b>?`, answer: n, hint: 'I = 1, V = 5, X = 10. Small before big: take away.' };
      if (r < 0.65) { const opts = new Set([R]); while (opts.size < 3) opts.add(V.ROMAN[rand(1, 12) % 12]); return { type: 'choice', q: `How do you write <b>${n}</b> in Roman numerals?`, choices: shuffle([...opts]).map((v) => ({ v, html: v })), answer: R }; }
      const h = rand(1, 12), m = rand(0, 11) * 5;
      return readChoice(h, m, { clock: { roman: true } });
    },
  };

  const ACTS = [['eat breakfast', 7, 30, '🥣'], ['go to school', 8, 15, '🎒'], ['eat lunch', 12, 15, '🥪'], ['go home from school', 15, 20, '🏠'], ['eat dinner', 18, 0, '🍝'], ['go to bed', 20, 0, '🛏️'], ['play in the park', 16, 45, '🛝'], ['watch the sunrise', 6, 10, '🌅'], ['see the stars', 21, 30, '✨']];
  const ampm = (h) => (h < 12 ? 'am' : 'pm');
  const twelve = (h, m) => `${dig(h, m)} ${ampm(h)}`;
  const ampm24 = {
    id: 'am-pm-24', title: 'am, pm and the 24-hour clock', years: [3, 5], icon: '🌗',
    desc: 'The hands go round twice a day. 1 pm is 13:00.',
    lesson() {
      const [act, ah, am] = pick(ACTS);
      const ph = rand(13, 22), pm2 = rand(0, 11) * 5;
      const qh = rand(13, 23), qm = rand(0, 59);
      return [
        { say: 'A day has <b>24 hours</b>, but a clock face only shows 12. So the hands go round <b>twice</b> every day: once in the morning and once in the afternoon and evening.', show: row(ck(8, 0) + '<span class="say-big">☀️</span>', ck(8, 0) + '<span class="say-big">🌙</span>') },
        { say: '<b>am</b> is from midnight to midday (the morning). <b>pm</b> is from midday to midnight (the afternoon and evening).', show: big('🌙 12 am … ☀️ 12 pm … 🌙'),
          try: { type: 'choice', q: `You ${act} at ${dig(ah, am)}. Is it am or pm?`, choices: [{ v: 'am', html: 'am 🌅' }, { v: 'pm', html: 'pm 🌇' }], answer: ampm(ah), hint: 'Is it before or after midday?' } },
        { say: 'The <b>24-hour clock</b> keeps counting after 12 instead of starting again. 1 pm is <b>13:00</b>, 2 pm is <b>14:00</b>… So for pm times, <b>add 12</b> to the hour.', show: V.chips(['1 pm = 13:00', '2 pm = 14:00', '6 pm = 18:00', '11 pm = 23:00']) },
        { say: `Change <b>${twelve(ph, pm2)}</b> to the 24-hour clock. The minutes stay the same.`, show: V.digital(ph, pm2, { ampm: true }),
          try: { type: 'guided', parts: [{ say: `Hours: ${H12(ph)} + 12 = ?`, answer: ph }, { say: 'Now write the whole 24-hour time (the minutes stay the same):', type: 'time', h24: true, answer: { h: ph, m: pm2 }, after: `${twelve(ph, pm2)} = ${d24(ph, pm2)}` }] } },
        { say: `And back again: <b>${d24(qh, qm)}</b>. The hour is more than 12, so it is pm: take away 12.`, show: V.digital(qh, qm, { h24: true }),
          try: { type: 'choice', q: `${d24(qh, qm)} in 12-hour time is…`, choices: shuffle([twelve(qh, qm), `${H12(qh)}:${pad(qm)} am`, `${qh - 10}:${pad(qm)} pm`]).map((v) => ({ v, html: v })), answer: twelve(qh, qm), hint: `${qh} − 12 = ${qh - 12}` } },
        { say: 'In the morning, the 24-hour clock just adds a 0 at the front: 7:30 am is <b>07:30</b>. Midnight is <b>00:00</b>.', show: row(V.digital(7, 30, { h24: true }), V.digital(0, 0, { h24: true })) },
      ];
    },
    gen(y) {
      const r = Math.random();
      if (r < 0.3 || y === 3 && r < 0.5) { const [act, h, m, e] = pick(ACTS); return { type: 'choice', q: `You ${act} at ${dig(h, m)}. Is it am or pm?`, scene: e, choices: [{ v: 'am', html: 'am' }, { v: 'pm', html: 'pm' }], answer: ampm(h), hint: 'am = morning, pm = afternoon and evening.' }; }
      const h = rand(0, 23), m = rand(0, y === 3 ? 11 : 59) * (y === 3 ? 5 : 1);
      if (r < 0.65) {
        return { type: 'time', h24: true, q: `Write <b>${twelve(h, m)}</b> in 24-hour time.`, visual: V.digital(h, m, { ampm: true }), answer: { h, m }, hint: h >= 12 ? (h === 12 ? '12 pm is midday: it stays 12.' : `pm: add 12 to the hour (${H12(h)} + 12 = ${h}).`) : (h === 0 ? '12 am is midnight: 00.' : 'am: the hour stays the same.'), steps: [`${twelve(h, m)} → <b>${d24(h, m)}</b>`] };
      }
      const opts = new Set([twelve(h, m), `${dig(h, m)} ${h < 12 ? 'pm' : 'am'}`, `${dig(h + 2, m)} ${ampm(h)}`]);
      return { type: 'choice', q: `What is <b>${d24(h, m)}</b> in 12-hour time?`, visual: V.digital(h, m, { h24: true }), choices: shuffle([...opts]).map((v) => ({ v, html: v })), answer: twelve(h, m), hint: 'More than 12? Take away 12, and it is pm.' };
    },
  };

  /* ---- durations on a time line ---- */
  const tFmt = (y) => (v) => (y >= 5 ? d24(Math.floor(v / 60), v % 60) : dig(Math.floor(v / 60), v % 60));
  function durJumps(s, e) {
    const js = [];
    let cur = s;
    const nextHour = Math.ceil(cur / 60) * 60;
    if (nextHour > cur && nextHour <= e) { js.push({ from: cur, to: nextHour, kind: 'min' }); cur = nextHour; }
    const lastHour = Math.floor(e / 60) * 60;
    if (lastHour > cur) { js.push({ from: cur, to: lastHour, kind: 'hour' }); cur = lastHour; }
    if (e > cur) js.push({ from: cur, to: e, kind: 'min' });
    js.forEach((j) => { const d = j.to - j.from; j.label = j.kind === 'hour' ? `+${d / 60} h` : `+${d} min`; });
    return js;
  }
  const timeLine = (s, e, y, js) => V.numberLine({ min: s - 10, max: e + 10, empty: true, marks: [s, e], jumps: js || [], label: tFmt(y) });
  const hm = (d) => `${Math.floor(d / 60) ? `${Math.floor(d / 60)} h ` : ''}${d % 60 ? `${d % 60} min` : ''}`.trim();
  function durNums(y) {
    const step = y <= 3 ? 5 : y === 4 ? 5 : 1;
    const s = rand(8 * 60 / step, 15 * 60 / step) * step;
    let d = rand(25 / step, (y <= 3 ? 150 : 260) / step) * step;
    if (y <= 3 && s % 60 === 0) d += 0;
    return { s, e: s + d, d };
  }
  function durGuided(s, e, y, q) {
    const js = durJumps(s, e);
    const f = tFmt(y);
    return {
      type: 'guided', story: true, q: q || `It starts at <b>${f(s)}</b> and ends at <b>${f(e)}</b>. How long does it take?`,
      visual: timeLine(s, e, y),
      hint: 'Jump to the next o’clock first, then whole hours, then the minutes left.',
      parts: [
        ...js.map((j) => ({ say: j.kind === 'hour' ? `Jump from ${f(j.from)} to ${f(j.to)}. How many <b>hours</b>?` : `From ${f(j.from)} to ${f(j.to)}: how many <b>minutes</b>?`, answer: j.kind === 'hour' ? (j.to - j.from) / 60 : j.to - j.from, suffix: j.kind === 'hour' ? 'h' : 'min' })),
        { say: `Add up the jumps (${js.map((j) => j.label.slice(1)).join(' + ')}). Total <b>hours</b>?`, answer: Math.floor((e - s) / 60), suffix: 'h', hint: '60 minutes make 1 hour.' },
        { say: 'And the <b>minutes</b> left over?', answer: (e - s) % 60, suffix: 'min', after: `It takes <b>${hm(e - s)}</b>.` },
      ],
      steps: [timeLine(s, e, y, js), `Total: <b>${hm(e - s)}</b>`],
    };
  }
  const durations = {
    id: 'durations', title: 'How long does it take?', years: [3, 6], icon: '⏳',
    desc: 'Find durations by jumping along a time line.',
    lesson(y) {
      let { s, e } = durNums(y);
      if (s % 60 === 0) s += 15;
      if (e % 60 === 0) e += 10;
      if (e - s < 70) e += 60;
      const f = tFmt(y);
      const js = durJumps(s, e);
      const n = durNums(y);
      const [what, emo] = pick([['A film', '🎬'], ['A football match', '⚽'], ['A school trip', '🚌'], ['A cake in the oven', '🎂']]);
      const frames = [
        { say: `${what} ${emo} starts at <b>${f(s)}</b> and finishes at <b>${f(e)}</b>. How long is it? Time doesn't work in tens — <b>60 minutes make 1 hour</b> — so we use a <b>time line</b>, not the column method.`, show: timeLine(s, e, y) + row(ck(Math.floor(s / 60), s % 60, { size: 140 }), ck(Math.floor(e / 60), e % 60, { size: 140 })) },
      ];
      js.forEach((j, k) => {
        const txt = k === 0 && j.kind === 'min' ? `<b>Jump 1:</b> go to the next <b>o’clock</b>, ${f(j.to)}.` : j.kind === 'hour' ? `<b>Jump ${k + 1}:</b> jump whole <b>hours</b> to ${f(j.to)}.` : `<b>Jump ${k + 1}:</b> now the minutes left, up to ${f(j.to)}.`;
        frames.push({ say: txt, show: timeLine(s, e, y, js.slice(0, k)), try: { q: `${f(j.from)} → ${f(j.to)}: how many ${j.kind === 'hour' ? 'hours' : 'minutes'}?`, answer: j.kind === 'hour' ? (j.to - j.from) / 60 : j.to - j.from, suffix: j.kind === 'hour' ? 'h' : 'min', hint: j.kind === 'hour' ? 'Count the o’clocks.' : `From ${f(j.from)} count on to ${f(j.to)}.` } });
      });
      const mins = js.filter((j) => j.kind === 'min').reduce((a, j) => a + j.to - j.from, 0);
      frames.push({ say: `Add the jumps. Minutes: ${js.filter((j) => j.kind === 'min').map((j) => j.to - j.from).join(' + ')} = ${mins}.${mins >= 60 ? ` That's more than 60, so 60 minutes become <b>1 more hour</b>!` : ''}`, show: timeLine(s, e, y, js),
        try: { type: 'guided', parts: [{ say: 'Total hours?', answer: Math.floor((e - s) / 60), suffix: 'h' }, { say: 'Minutes left over?', answer: (e - s) % 60, suffix: 'min', after: `It lasts <b>${hm(e - s)}</b>.` }] } });
      frames.push({ say: 'Your turn: the whole thing!', try: durGuided(n.s, n.e, y) });
      return frames;
    },
    gen(y) {
      const { s, e, d } = durNums(y);
      const f = tFmt(y);
      if (Math.random() < 0.6) return durGuided(s, e, y);
      // find the end time
      if (y <= 4 && d % 5 === 0 && s % 5 === 0) return setClock(Math.floor(e / 60), e % 60, 5, `A lesson starts at <b>${f(s)}</b> and lasts <b>${hm(d)}</b>. Show the time it ends.`, { visual: ck(Math.floor(s / 60), s % 60, { size: 160 }), steps: [timeLine(s, e, y, durJumps(s, e)), `It ends at <b>${f(e)}</b>.`] });
      const opts = new Set([f(e), f(e + 60), f(e - 10), f(s + (d % 60) + 100)]);
      return { type: 'choice', q: `A train leaves at <b>${f(s)}</b>. The journey takes <b>${hm(d)}</b>. When does it arrive?`, choices: shuffle([...opts]).map((v) => ({ v, html: v })), answer: f(e), hint: 'Add the hours first, then the minutes. 60 minutes = 1 hour.', steps: [timeLine(s, e, y, durJumps(s, e)), `It arrives at <b>${f(e)}</b>.`] };
    },
    word(y) {
      const { s, e } = durNums(y);
      const f = tFmt(y), n = U.name();
      const [what, emo] = pick([['bakes a cake', '🎂'], ['watches a film', '🎬'], ['plays football', '⚽'], ['visits the zoo', '🦒']]);
      const g = durGuided(s, e, y, `${n} ${what} from <b>${f(s)}</b> until <b>${f(e)}</b>. How long is that?`);
      g.scene = emo;
      return g;
    },
  };

  const units = {
    id: 'time-units', title: 'Seconds, minutes, hours, days', years: [2, 6], icon: '⌛',
    desc: 'How many minutes in an hour? Change between units of time.',
    lesson(y) {
      const facts = ['60 seconds = 1 minute', '60 minutes = 1 hour', '24 hours = 1 day', '7 days = 1 week', '12 months = 1 year', '365 days = 1 year (366 in a leap year)'];
      const fr = [
        { say: 'Time has its own units. Learn these facts by heart — they are not in tens like other numbers!', show: V.chips(y <= 2 ? facts.slice(1, 4) : facts) },
        { say: 'An hour is how long the minute hand takes to go all the way round the clock: 60 little marks.', show: ck(12, 0, { minuteNumbers: true, noHour: true }), try: { q: 'How many minutes in 1 hour?', answer: 60, suffix: 'min' } },
        { say: 'A day is the hour hand going round the clock twice.', try: { q: 'How many hours in 1 day?', answer: 24, suffix: 'hours', hint: '12 in the morning + 12 in the afternoon and evening.' } },
      ];
      if (y >= 3) {
        const k = rand(2, y >= 5 ? 9 : 5);
        fr.push({ say: `To change <b>hours into minutes</b>, multiply by 60. ${k} hours = ${k} × 60 minutes.`, show: V.chips(Array.from({ length: k }, () => '60')), try: { q: `${k} hours = ? minutes`, answer: k * 60, suffix: 'min', hint: `${k} × 6 = ${k * 6}, then × 10.` } });
        const t = rand(70, y >= 5 ? 400 : 190);
        fr.push({ say: `To change <b>minutes into hours</b>, take out as many 60s as you can. ${t} minutes:`, show: V.chips(Array.from({ length: Math.floor(t / 60) }, () => '60').concat(t % 60 ? [String(t % 60)] : [])),
          try: { type: 'guided', parts: [{ say: `How many whole hours in ${t} minutes?`, answer: Math.floor(t / 60), suffix: 'h' }, { say: 'Minutes left over?', answer: t % 60, suffix: 'min', after: `${t} min = ${hm(t)}` }] } });
      }
      if (y >= 5) {
        const w = rand(2, 9);
        fr.push({ say: 'Bigger units work the same way: weeks to days is × 7.', try: { q: `${w} weeks = ? days`, answer: w * 7, suffix: 'days' } });
      }
      return fr;
    },
    gen(y) {
      const pool = [
        () => ({ q: 'How many minutes are in 1 hour?', answer: 60, suffix: 'min' }),
        () => ({ q: 'How many hours are in 1 day?', answer: 24, suffix: 'hours' }),
        () => ({ q: 'How many days are in 1 week?', answer: 7, suffix: 'days' }),
      ];
      if (y >= 2) pool.push(() => { const k = pick([15, 30, 45]); return { type: 'choice', q: `${k} minutes is…`, choices: [{ v: '15', html: 'a quarter of an hour' }, { v: '30', html: 'half an hour' }, { v: '45', html: 'three quarters of an hour' }], answer: String(k) }; });
      if (y >= 3) {
        pool.push(() => ({ q: 'How many seconds are in 1 minute?', answer: 60, suffix: 's' }));
        pool.push(() => { const k = rand(2, y >= 4 ? 10 : 5); return { q: `${k} hours = ? minutes`, answer: k * 60, suffix: 'min', hint: '× 60', steps: [`${k} × 60 = <b>${k * 60}</b>`] }; });
        pool.push(() => ({ q: 'How many days are in a year (not a leap year)?', answer: 365, suffix: 'days' }));
      }
      if (y >= 4) {
        pool.push(() => { const t = rand(65, 300); return { type: 'guided', q: `Change <b>${t} minutes</b> into hours and minutes.`, parts: [{ say: 'Whole hours?', answer: Math.floor(t / 60), suffix: 'h' }, { say: 'Minutes left?', answer: t % 60, suffix: 'min' }] }; });
        pool.push(() => { const k = rand(2, 6); return { q: `${k} minutes = ? seconds`, answer: k * 60, suffix: 's' }; });
      }
      if (y >= 5) {
        pool.push(() => { const w = rand(2, 12); return { q: `${w} weeks = ? days`, answer: w * 7, suffix: 'days' }; });
        pool.push(() => { const d = rand(2, 5); return { q: `${d} days = ? hours`, answer: d * 24, suffix: 'hours', hint: '× 24' }; });
        pool.push(() => { const h = rand(1, 3), m = rand(1, 59); return { q: `${h} h ${m} min = ? minutes`, answer: h * 60 + m, suffix: 'min', steps: [`${h} × 60 = ${h * 60}`, `${h * 60} + ${m} = <b>${h * 60 + m}</b>`] }; });
      }
      return pick(pool)();
    },
    word(y) {
      const n = U.name();
      if (y <= 3) { const k = rand(2, 4); return { q: `${n} reads for <b>${k} hours</b> on a rainy day. How many minutes is that?`, answer: k * 60, suffix: 'min', scene: '📚', story: true, hint: '1 hour = 60 minutes.' }; }
      const per = pick([20, 25, 30, 45]), days = rand(4, 7), t = per * days;
      return { type: 'guided', scene: '🎹', story: true, q: `${n} practises the piano for <b>${per} minutes</b> every day for <b>${days} days</b>. How long is that in hours and minutes?`,
        parts: [{ say: 'Total minutes?', answer: t, suffix: 'min' }, { say: 'Whole hours in that?', answer: Math.floor(t / 60), suffix: 'h' }, { say: 'Minutes left over?', answer: t % 60, suffix: 'min', after: `${t} min = ${hm(t)}` }] };
    },
  };

  /* ---- timetables ---- */
  const STOPS = ['Station', 'Park', 'School', 'Library', 'Market'];
  function makeTT() {
    const legs = [rand(4, 12), rand(5, 15), rand(6, 14), rand(4, 11)];
    const first = rand(7 * 12, 9 * 12) * 5;
    const gap = pick([20, 25, 30, 40]);
    const buses = [0, 1, 2].map((b) => { let t = first + b * gap; return [t, ...legs.map((l) => (t += l))]; });
    return { buses, legs };
  }
  const ttHTML = (tt) => `<table class="tt"><tr><th>Stop</th>${tt.buses.map((_, b) => `<th>Bus ${b + 1}</th>`).join('')}</tr>${STOPS.map((s, i) => `<tr><td>${s}</td>${tt.buses.map((bus) => `<td>${d24(Math.floor(bus[i] / 60), bus[i] % 60)}</td>`).join('')}</tr>`).join('')}</table>`;
  const T = (v) => d24(Math.floor(v / 60), v % 60);
  function ttQuestion(tt) {
    const r = Math.random(), b = rand(0, 2), i = rand(1, 4), j = rand(0, i - 1);
    if (r < 0.33) {
      const opts = new Set([T(tt.buses[b][i]), ...tt.buses.map((bs) => T(bs[i])), T(tt.buses[b][i - 1])]);
      return { type: 'choice', q: `When does <b>Bus ${b + 1}</b> get to the <b>${STOPS[i]}</b>?`, visual: ttHTML(tt), choices: shuffle([...opts]).slice(0, 4).map((v) => ({ v, html: v })), answer: T(tt.buses[b][i]), hint: `Find the ${STOPS[i]} row, then the Bus ${b + 1} column.` };
    }
    if (r < 0.66) {
      const d = tt.buses[b][i] - tt.buses[b][j];
      return { q: `How many minutes does Bus ${b + 1} take from the <b>${STOPS[j]}</b> to the <b>${STOPS[i]}</b>?`, visual: ttHTML(tt), answer: d, suffix: 'min', hint: 'Find both times in the same column, then count on from the first to the second.', steps: [`${T(tt.buses[b][j])} → ${T(tt.buses[b][i])}`, `= <b>${d}</b> minutes`] };
    }
    const target = tt.buses[1][i] + rand(1, Math.max(1, tt.buses[2][i] - tt.buses[1][i] - 1));
    return { type: 'choice', q: `You must be at the <b>${STOPS[i]}</b> by <b>${T(target)}</b>. Which is the <b>latest</b> bus you can catch?`, visual: ttHTML(tt), choices: [1, 2, 3].map((k) => ({ v: String(k), html: `Bus ${k}` })), answer: '2', hint: `Look along the ${STOPS[i]} row. Which buses arrive before ${T(target)}?` };
  }
  const timetables = {
    id: 'timetables', title: 'Reading timetables', years: [5, 6], icon: '🚌',
    desc: 'Rows are stops, columns are buses. Find times and journey lengths.',
    lesson() {
      const tt = makeTT();
      const b = rand(0, 2);
      return [
        { say: 'A <b>timetable</b> tells you when buses or trains arrive. It uses the 24-hour clock.', show: ttHTML(tt) },
        { say: `Each <b>column</b> is one bus. Read <b>down</b> a column to follow that bus on its journey. Each <b>row</b> is a stop.`, show: ttHTML(tt),
          try: { type: 'choice', q: `When does Bus ${b + 1} leave the Station?`, choices: tt.buses.map((bs) => T(bs[0])).map((v) => ({ v, html: v })), answer: T(tt.buses[b][0]), hint: 'Station is the first row.' } },
        { say: 'How long is a journey? Find the two times in the <b>same column</b> and count on from one to the other.', show: ttHTML(tt),
          try: { q: `Bus ${b + 1}: how many minutes from the Station to the Market?`, answer: tt.buses[b][4] - tt.buses[b][0], suffix: 'min', hint: `${T(tt.buses[b][0])} → ${T(tt.buses[b][4])}: jump to the next o’clock first if you need to.` } },
        { say: 'Your turn!', try: ttQuestion(tt) },
      ];
    },
    gen() { return ttQuestion(makeTT()); },
  };

  /* ================= explorer ================= */
  function explore(root) {
    let h = 3, m = 0, pm = true;
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Move the hands and see the time in words, on a digital clock and on the 24-hour clock.</p>
        <div class="ex-split">
          <div id="face" class="ck-face"></div>
          <div class="ck-btns">
            <div class="ck-row"><span><b class="hh">Hour</b></span><button class="btn small ghost" data-h="-1">−1</button><button class="btn small" data-h="1">+1</button></div>
            <div class="ck-row"><span><b class="mh">Minutes</b></span><button class="btn small ghost" data-m="-5">−5</button><button class="btn small ghost" data-m="-1">−1</button><button class="btn small" data-m="1">+1</button><button class="btn small" data-m="5">+5</button></div>
            <div class="seg"><button data-p="0">☀️ am</button><button data-p="1">🌙 pm</button></div>
            <div id="out"></div>
          </div>
        </div>
      </div>`;
    const face = root.querySelector('#face'), out = root.querySelector('#out');
    function draw() {
      while (m >= 60) { m -= 60; h++; } while (m < 0) { m += 60; h--; }
      if (h > 12) { h -= 12; pm = !pm; } if (h < 1) { h += 12; pm = !pm; }
      const h24 = (h % 12) + (pm ? 12 : 0);
      face.innerHTML = V.clock(h, m, { minuteNumbers: true, sweep: true });
      out.innerHTML = `<p class="say-big">${words(h, m)}</p>${V.digital(h24, m, { ampm: true })} &nbsp; ${V.digital(h24, m, { h24: true })}`;
      root.querySelectorAll('[data-p]').forEach((b) => b.classList.toggle('on', +b.dataset.p === (pm ? 1 : 0)));
    }
    root.querySelectorAll('[data-h]').forEach((b) => { b.onclick = () => { h += +b.dataset.h; U.sound('click'); draw(); }; });
    root.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { m += +b.dataset.m; U.sound('click'); draw(); }; });
    root.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { pm = b.dataset.p === '1'; draw(); }; });
    face.onclick = (e) => {
      const r = face.querySelector('svg').getBoundingClientRect();
      let deg = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      m = Math.round(deg / 6) % 60; U.sound('click'); draw();
    };
    draw();
  }

  TOPICS.push({
    id: 'time', name: 'Time & Clocks', icon: '🕒', color: '#d946ef', minYear: 1,
    tagline: 'Read clocks, digital and 24-hour time, durations and timetables',
    explore,
    skills: [oclock, daysMonths, quarters, fiveMin, digitalSkill, nearestMin, roman, ampm24, units, durations, timetables],
  });
})();
