'use strict';
/* Nursery (ages 3–5): numbers 0–10. Spot numbers, find them, count, match, order, more/fewer, number names. */
(() => {
  const { rand, pick, shuffle } = U;
  const EM = ['🐥', '🍎', '🚗', '🌟', '🐟', '🎈', '🍓', '🐞', '🧁', '🦋', '🐸', '🍌'];
  const COL = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
  const SH = ['circle', 'square', 'blob'];
  const W = (n) => U.words(n);

  /** A big, bright numeral in a shape. */
  const bigNum = (n, o = {}) => `<div class="tapfind fancy"><span class="tf ${o.shape || pick(SH)}" style="--bg:${o.col || pick(COL)};--rot:${rand(-8, 8)}deg;--sz:${o.size || 120}px">${n}</span></div>`;
  const numRow = (list) => `<div class="tapfind fancy">${list.map((n) => `<span class="tf ${pick(SH)}" style="--bg:${pick(COL)};--rot:${rand(-15, 15)}deg;--sz:${rand(60, 110)}px">${n}</span>`).join('')}</div>`;
  const big = (html) => `<div class="say-big">${html}</div>`;

  /** Dice dots for 1–6. */
  const DOTS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function dice(n) {
    let s = '<svg viewBox="0 0 100 100" width="110" height="110" role="img" aria-label="dice showing ' + n + '"><rect x="4" y="4" width="92" height="92" rx="18" fill="#fff" stroke="#334155" stroke-width="4"/>';
    (DOTS[n] || []).forEach((k) => { s += `<circle cx="${25 + (k % 3) * 25}" cy="${25 + Math.floor(k / 3) * 25}" r="9" fill="#1e1b4b"/>`; });
    return s + '</svg>';
  }

  /** Number choices: the answer plus near neighbours, all 0–10. */
  function numChoices(n, k = 3, lo = 0, hi = 10) {
    const set = new Set([n]);
    const near = shuffle([n - 1, n + 1, n - 2, n + 2, n + 3, n - 3]).filter((v) => v >= lo && v <= hi);
    for (const v of near) { if (set.size >= k) break; set.add(v); }
    while (set.size < k) set.add(rand(lo, hi));
    return shuffle([...set]).map((v) => ({ v: String(v), html: `<span class="say-big">${v}</span>` }));
  }
  /** Tap the one number (fancy shapes). */
  function spotOne(t, lo = 0, hi = 10, count = 5) {
    const others = shuffle([...Array(hi - lo + 1).keys()].map((i) => i + lo).filter((v) => v !== t)).slice(0, count - 1);
    return {
      type: 'tapfind', single: true, fancy: true, q: `Tap the <b>${t}</b>`,
      items: shuffle([t, ...others]).map((v) => ({ label: String(v), ok: v === t })),
      hint: `Look for the shape of ${t}. Say it: “${W(t)}”.`,
    };
  }
  /** Tap every copy of a number. */
  function findAll(t, copies, total) {
    const others = Array.from({ length: total - copies }, () => { let v; do { v = rand(0, 10); } while (v === t || (t === 6 && v === 9) || (t === 9 && v === 6)); return v; });
    const items = shuffle([...Array(copies).fill(t), ...others]).map((v) => ({ label: String(v), ok: v === t }));
    return { type: 'tapfind', fancy: true, q: `Tap <b>every ${t}</b>. Then press Check.`, items, hint: `There are ${copies} of them. Some are big, some are small!` };
  }
  /** Show a group of n things. */
  function showGroup(n, how, e) {
    if (how === 'dice' && n >= 1 && n <= 6) return dice(n);
    if (how === 'frame') return V.tenFrame(n, e);
    return n === 0 ? '<div class="plate"><div class="plate-items"></div></div>' : V.objects(n, e, { perRow: 5 });
  }

  /* ================= skills ================= */
  const spot = {
    id: 'spot', title: 'Spot the number', years: [0, 0], icon: '👀',
    desc: 'Look at the shape of each number and find it.',
    lesson() {
      const n = rand(1, 5), m = rand(6, 10);
      return [
        { say: `This is the number <b>${n}</b>. Say it out loud: <b>“${W(n)}”</b>!`, show: bigNum(n) },
        { say: `Numbers can be <b>any colour</b> and <b>any size</b>. These are all ${n}!`, show: numRow([n, n, n]) },
        { say: `Can you find the ${n}?`, try: spotOne(n, 0, 5, 4) },
        { say: `Here is a new number: <b>${m}</b>. Say it: <b>“${W(m)}”</b>!`, show: bigNum(m) },
        { say: `Now find the ${m}!`, try: spotOne(m, 0, 10, 5) },
      ];
    },
    gen() {
      const small = Math.random() < 0.5;
      const t = small ? rand(0, 5) : rand(0, 10);
      return spotOne(t, 0, small ? 5 : 10, small ? 4 : rand(5, 6));
    },
  };

  const findThem = {
    id: 'find-all', title: 'Find them all', years: [0, 0], icon: '🔍',
    desc: 'Tap every number that is the same.',
    lesson() {
      const t = rand(1, 9), t2 = rand(0, 10);
      return [
        { say: `Look! Lots of numbers. Some of them are <b>${t}</b>.`, show: numRow(shuffle([t, t, rand(0, 10), t, rand(0, 10)])) },
        { say: `Find <b>every ${t}</b>. Tap them all, then press <b>Check</b>.`, try: findAll(t, 3, 8) },
        { say: `Well done! Now let's look for <b>${t2}</b>. Say it: “${W(t2)}”.`, show: bigNum(t2) },
        { say: `Tap every ${t2}!`, try: findAll(t2, rand(2, 4), 10) },
      ];
    },
    gen() {
      const t = rand(0, 10);
      return findAll(t, rand(2, 4), rand(8, 12));
    },
  };

  const count = {
    id: 'count', title: 'Count the objects', years: [0, 0], icon: '🍎',
    desc: 'Touch each one and count: 1, 2, 3…',
    lesson() {
      const e = pick(EM), n = rand(3, 6), d = rand(2, 6), f = rand(5, 10);
      const seq = Array.from({ length: n }, (_, i) => i + 1).join(', ');
      return [
        { say: `Let's count! Touch each ${e} <b>one time</b> and say a number: ${seq}.`, show: V.objects(n, e, { perRow: 5 }) },
        { say: `The <b>last</b> number you say is how many there are. There are <b>${n}</b>!`, show: V.objects(n, e, { perRow: 5 }) + bigNum(n, { size: 90 }) },
        { say: 'How many dots on the dice?', show: dice(d), try: { type: 'choice', q: 'How many dots?', choices: numChoices(d, 3, 1, 6), answer: String(d), hint: 'Count each dot one time.' } },
        { say: `A <b>ten frame</b> has 10 boxes. How many boxes have a ${e}?`, show: V.tenFrame(f, e), try: { type: 'choice', q: `How many ${e}?`, choices: numChoices(f), answer: String(f), hint: 'The top row has 5 boxes.' } },
      ];
    },
    gen() {
      const how = pick(['objects', 'objects', 'frame', 'dice']);
      const n = how === 'dice' ? rand(1, 6) : rand(how === 'frame' ? 1 : 0, 10);
      const e = pick(EM);
      return {
        type: 'choice', q: how === 'dice' ? 'How many dots?' : `How many ${e}?`,
        visual: showGroup(n, how, e), choices: numChoices(n, how === 'dice' ? 3 : 4, 0, 10), answer: String(n),
        hint: n === 0 ? 'Is there anything there?' : 'Touch each one and count.',
        steps: [n === 0 ? 'There are none. That is <b>0</b>!' : `Count: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}. There are <b>${n}</b>.`],
      };
    },
  };

  const match = {
    id: 'match', title: 'Match number and amount', years: [0, 1], icon: '🧩',
    desc: 'Which group goes with the number?',
    lesson() {
      const e = pick(EM), n = rand(2, 6);
      const groupChoices = (k, e2) => { const set = new Set([k]); while (set.size < 3) set.add(rand(Math.max(1, k - 3), Math.min(10, k + 3))); return shuffle([...set]).map((v) => ({ v: String(v), html: V.objects(v, e2, { perRow: 5 }) })); };
      const m = rand(3, 8), e2 = pick(EM), g = rand(2, 9), e3 = pick(EM);
      return [
        { say: `This is the number <b>${n}</b>. It goes with a group of <b>${n}</b> things.`, show: bigNum(n, { size: 90 }) + V.objects(n, e, { perRow: 5 }) },
        { say: `Which group has <b>${m}</b>? Count each group.`, try: { type: 'choice', q: `Which group has <b>${m}</b>?`, choices: groupChoices(m, e2), answer: String(m), hint: 'Count each group carefully.' } },
        { say: 'Now the other way: count the group, then tap its number.', show: V.objects(g, e3, { perRow: 5 }),
          try: { type: 'tapfind', single: true, fancy: true, q: 'Which number goes with this group?', items: shuffle([g, ...shuffle([...Array(11).keys()].filter((v) => v !== g)).slice(0, 4)]).map((v) => ({ label: String(v), ok: v === g })), hint: 'Count them, then find that number.' } },
        { say: `Great matching! 🧩 The number tells you <b>how many</b>.` , show: big(`${g} = ${e3.repeat(g)}`) },
      ];
    },
    gen() {
      const e = pick(EM);
      if (Math.random() < 0.5) {
        const n = rand(1, 10);
        const set = new Set([n]);
        while (set.size < 3) set.add(rand(Math.max(1, n - 3), Math.min(10, n + 3)));
        return { type: 'choice', q: `Which group has <b>${n}</b>?`, choices: shuffle([...set]).map((v) => ({ v: String(v), html: V.objects(v, e, { perRow: 5 }) })), answer: String(n), hint: 'Count each group.' };
      }
      const g = rand(0, 10);
      return { type: 'tapfind', single: true, fancy: true, q: 'Which number goes with this group?', visual: showGroup(g, pick(['objects', 'frame']), e),
        items: shuffle([g, ...shuffle([...Array(11).keys()].filter((v) => v !== g)).slice(0, 4)]).map((v) => ({ label: String(v), ok: v === g })), hint: g === 0 ? 'Nothing there means 0.' : 'Count them, then find that number.' };
    },
  };

  /** Number track: start..start+len-1 with some boxes empty. */
  function track(start, len, missing) {
    const blanks = new Set(shuffle([...Array(len).keys()]).slice(0, missing));
    return { type: 'cells', q: 'Which numbers are missing?', cells: Array.from({ length: len }, (_, i) => ({ x: i, y: 0, v: start + i, given: !blanks.has(i) })), hint: 'Count along the track: each number is one more.' };
  }
  const order = {
    id: 'order', title: 'Number order 0–10', years: [0, 1], icon: '🐛',
    desc: 'Count along the number track. What comes next?',
    lesson() {
      const n = rand(2, 8), b = rand(2, 9);
      return [
        { say: 'Numbers always come in the <b>same order</b>. Count along with Pip: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10!', show: V.numberLine({ min: 0, max: 10, step: 1 }) },
        { say: `Each step along the track is <b>one more</b>. After ${n} comes…`, show: V.numberLine({ min: 0, max: 10, step: 1, points: [{ v: n, emoji: '🐸' }] }),
          try: { type: 'choice', q: `What comes <b>after</b> ${n}?`, choices: numChoices(n + 1), answer: String(n + 1), hint: `Count: ${n}, …` } },
        { say: `And <b>before</b> a number is one less. What comes before ${b}?`, show: V.numberLine({ min: 0, max: 10, step: 1, points: [{ v: b, emoji: '🐸' }] }),
          try: { type: 'choice', q: `What comes <b>before</b> ${b}?`, choices: numChoices(b - 1), answer: String(b - 1), hint: `Count up to ${b}. Which number did you say just before it?` } },
        { say: 'Some numbers fell off the track! Type the missing ones.', try: track(rand(0, 4), 6, 2) },
      ];
    },
    gen(y) {
      const r = Math.random();
      if (r < 0.4) return track(rand(0, 10 - 6), y === 0 ? 6 : 7, y === 0 ? rand(1, 2) : rand(2, 3));
      if (r < 0.7) { const n = rand(0, 9); return { type: 'choice', q: `What comes <b>after</b> ${n}?`, visual: V.numberLine({ min: 0, max: 10, step: 1, points: [{ v: n, emoji: '🐸' }] }), choices: numChoices(n + 1), answer: String(n + 1), hint: 'One more.' }; }
      const n = rand(1, 10);
      return { type: 'choice', q: `What comes <b>before</b> ${n}?`, visual: V.numberLine({ min: 0, max: 10, step: 1, points: [{ v: n, emoji: '🐸' }] }), choices: numChoices(n - 1), answer: String(n - 1), hint: 'One less.' };
    },
  };

  const moreFewer = {
    id: 'more-fewer', title: 'More or fewer?', years: [0, 1], icon: '⚖️',
    desc: 'Which group has more? One more and one less.',
    lesson() {
      const e1 = pick(EM), e2 = pick(EM);
      let a = rand(2, 8), b = rand(2, 8);
      while (a === b) b = rand(2, 8);
      const n = rand(2, 8), e = pick(EM), m = rand(3, 9);
      return [
        { say: `Here are two groups. Count them: ${a} ${e1} and ${b} ${e2}. The group with the bigger number has <b>more</b>.`, show: V.objects(a, e1, { perRow: 5 }) + V.objects(b, e2, { perRow: 5 }) },
        { say: 'Which group has <b>more</b>?', try: { type: 'choice', q: 'Which has more?', choices: [{ v: 'a', html: V.objects(a, e1, { perRow: 5 }) }, { v: 'b', html: V.objects(b, e2, { perRow: 5 }) }], answer: a > b ? 'a' : 'b', hint: 'Count both groups.' } },
        { say: `There are ${n} ${e}. One more comes along! Now there are…`, show: V.objects(n, e, { perRow: 5 }) + big('+ ' + e),
          try: { type: 'choice', q: `${n} and <b>one more</b> is…`, choices: numChoices(n + 1), answer: String(n + 1), hint: `Count on from ${n}.` } },
        { say: `There are ${m} ${e}. One runs away! Now there are…`, show: V.objects(m, e, { perRow: 5, crossed: 1 }),
          try: { type: 'choice', q: `${m} and <b>one less</b> is…`, choices: numChoices(m - 1), answer: String(m - 1), hint: 'Count the ones that are left.' } },
      ];
    },
    gen() {
      const r = Math.random(), e = pick(EM);
      if (r < 0.4) {
        const e2 = pick(EM); let a = rand(1, 10), b = rand(1, 10); while (a === b) b = rand(1, 10);
        const more = Math.random() < 0.6;
        return { type: 'choice', q: `Which group has <b>${more ? 'more' : 'fewer'}</b>?`, choices: [{ v: 'a', html: V.objects(a, e, { perRow: 5 }) }, { v: 'b', html: V.objects(b, e2, { perRow: 5 }) }], answer: (more ? a > b : a < b) ? 'a' : 'b', hint: 'Count both groups.', steps: [`One group has ${a}, the other has ${b}. ${Math.max(a, b)} is more than ${Math.min(a, b)}.`] };
      }
      if (r < 0.7) { const n = rand(0, 9); return { type: 'choice', q: `${n} ${e} and <b>one more</b> is…`, visual: V.objects(n, e, { perRow: 5 }), choices: numChoices(n + 1), answer: String(n + 1), hint: 'Count on one.' }; }
      const n = rand(1, 10);
      return { type: 'choice', q: `${n} ${e} and <b>one less</b> is…`, visual: V.objects(n, e, { perRow: 5, crossed: 1 }), choices: numChoices(n - 1), answer: String(n - 1), hint: 'Count the ones that are left.' };
    },
  };

  const names = {
    id: 'names', title: 'Number names', years: [0, 1], icon: '🔤',
    desc: 'Match the word to the number: “four” is 4.',
    lesson() {
      const n = rand(1, 5), m = rand(6, 10), k = rand(0, 10);
      const wordChoices = (t) => { const set = new Set([t]); while (set.size < 3) set.add(rand(0, 10)); return shuffle([...set]).map((v) => ({ v: String(v), html: W(v) })); };
      return [
        { say: 'Every number has a <b>name</b> we can say and write.', show: V.chips([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => `${v} ${W(v)}`)) },
        { say: `<b>${W(n)}</b> is the number <b>${n}</b>.`, show: bigNum(n, { size: 90 }) + big(W(n)),
          try: { type: 'choice', q: `Which number is <b>“${W(m)}”</b>?`, choices: numChoices(m), answer: String(m), hint: 'Say the word slowly, then count up to it.' } },
        { say: 'Now the other way: find the name of the number.', show: bigNum(k, { size: 90 }),
          try: { type: 'choice', q: `What is the name of <b>${k}</b>?`, choices: wordChoices(k), answer: String(k), hint: 'Say the number out loud.' } },
      ];
    },
    gen() {
      const n = rand(0, 10);
      if (Math.random() < 0.5) return { type: 'choice', q: `Which number is <b>“${W(n)}”</b>?`, choices: numChoices(n), answer: String(n), hint: 'Say it out loud and count up to it.' };
      const set = new Set([n]); while (set.size < 3) set.add(rand(0, 10));
      return { type: 'choice', q: `What is the name of this number?`, visual: bigNum(n, { size: 90 }), choices: shuffle([...set]).map((v) => ({ v: String(v), html: W(v) })), answer: String(n), hint: 'Say the number out loud.' };
    },
  };

  const zeroFive = {
    id: 'zero-five', title: 'Zero and making 5', years: [0, 0], icon: '✋',
    desc: 'Zero means none. Two numbers can make 5.',
    lesson() {
      const e = pick(EM), a = rand(1, 4);
      return [
        { say: `Look at this plate. How many ${e}? None at all! <b>None</b> is the number <b>0</b> — “zero”.`, show: showGroup(0, 'objects', e) + bigNum(0, { size: 90 }) },
        { say: 'Which plate has <b>zero</b> things on it?', try: { type: 'choice', q: 'Which has 0?', choices: shuffle([0, rand(1, 3), rand(4, 6)]).map((v) => ({ v: String(v), html: showGroup(v, 'objects', e) })), answer: '0', hint: 'Zero means nothing there.' } },
        { say: 'One hand has <b>5</b> fingers. ✋ Count them: 1, 2, 3, 4, 5.', show: big('✋ = 5') },
        { say: `Fill the top row of the ten frame to make <b>5</b>. ${a} are red already. How many blue ones fill the row?`, show: V.tenFrame(5, '🔴', { second: 5 - a }),
          try: { type: 'choice', q: `${a} and how many make 5?`, choices: numChoices(5 - a, 3, 0, 5), answer: String(5 - a), hint: 'Count the blue ones.' } },
      ];
    },
    gen() {
      if (Math.random() < 0.4) { const e = pick(EM); return { type: 'choice', q: 'Which plate has <b>zero</b>?', choices: shuffle([0, rand(1, 3), rand(4, 7)]).map((v) => ({ v: String(v), html: showGroup(v, 'objects', e) })), answer: '0', hint: 'Zero means none.' }; }
      const a = rand(0, 5);
      return { type: 'choice', q: `${a} and how many make <b>5</b>?`, visual: V.tenFrame(5, '🔴', { second: 5 - a }), choices: numChoices(5 - a, 3, 0, 5), answer: String(5 - a), hint: 'Count the blue ones in the row.' };
    },
  };

  /* ================= explorer ================= */
  function explore(root) {
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Tap a number! 👇</p>
        <div class="tapfind fancy">${[...Array(11).keys()].map((n) => `<button class="tf ${SH[n % SH.length]}" data-n="${n}" style="--bg:${COL[n % COL.length]};--rot:0deg;--sz:64px">${n}</button>`).join('')}</div>
        <div class="ex-stage" id="stage"></div>
      </div>`;
    const stage = root.querySelector('#stage');
    function show(n) {
      const e = pick(EM);
      stage.innerHTML = `${bigNum(n, { size: 130, col: COL[n % COL.length] })}<p class="say-big center">${W(n)}</p>${V.tenFrame(n, e)}${n ? V.objects(n, e, { perRow: 5 }) : '<p class="center">Zero: nothing at all!</p>'}`;
      U.sound('click');
    }
    root.querySelectorAll('[data-n]').forEach((b) => { b.onclick = () => show(+b.dataset.n); });
    show(3);
  }

  TOPICS.push({
    id: 'nursery', name: 'Numbers 0–10', icon: '🧸', color: '#f59e0b', minYear: 0,
    tagline: 'Spot, count and play with numbers up to 10',
    explore,
    skills: [spot, findThem, count, match, order, moreFewer, names, zeroFive],
  });
})();
