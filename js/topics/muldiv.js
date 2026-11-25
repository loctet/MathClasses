'use strict';
/* Multiplication and division, built from small skills (England National Curriculum, Years 1–6). */
(() => {
  const { rand, pick, fmt, shuffle } = U;
  const EMO = ['🍪', '🍓', '⭐', '🐟', '🍎', '🧁', '🎈', '🐞', '🥚', '🌸'];
  const OPS = [{ v: '+', html: 'Add ➕' }, { v: '−', html: 'Subtract ➖' }, { v: '×', html: 'Multiply ✖️' }, { v: '÷', html: 'Divide ➗' }];
  const YN = (q, ok, o = {}) => Object.assign({ q, type: 'choice', choices: [{ v: 'yes', html: 'Yes ✔️' }, { v: 'no', html: 'No ✖️' }], answer: ok ? 'yes' : 'no' }, o);
  const big = (html) => `<div class="say-big">${html}</div>`;
  const item = (e) => `<span>${e}</span>`;

  /* ---------------- shared pictures ---------------- */
  /** q full groups of d, plus r left over. */
  function packs(q, d, r, emoji) {
    let s = '<div class="groups">';
    for (let i = 0; i < q; i++) s += `<div class="plate"><div class="plate-items">${item(emoji).repeat(d)}</div><span class="plate-n">${d}</span></div>`;
    if (r) s += `<div class="plate left"><div class="plate-items">${item(emoji).repeat(r)}</div><span class="plate-n">${r} left over</span></div>`;
    return s + '</div>';
  }
  /** Plates with given counts (for "are they equal?" questions). */
  function plates(counts, emoji) {
    return `<div class="groups">${counts.map((n) => `<div class="plate"><div class="plate-items">${item(emoji).repeat(n)}</div></div>`).join('')}</div>`;
  }
  function skipCount(a, b) {
    const out = [];
    for (let i = 1; i <= b; i++) out.push(fmt(a * i));
    return `<div class="skip">${out.map((v, i) => `<span style="animation-delay:${i * 0.08}s">${v}</span>`).join('')}</div>`;
  }
  /** b jumps of a, starting at 0. */
  function skipLine(a, b) {
    const jumps = [];
    for (let i = 0; i < b; i++) jumps.push({ from: a * i, to: a * (i + 1), label: '+' + a });
    return V.numberLine({ min: 0, max: a * (b + 1), step: a, jumps });
  }
  /** Jump back from n to 0 in steps of d. */
  function backLine(n, d) {
    const jumps = [];
    for (let v = n; v - d >= 0; v -= d) jumps.push({ from: v, to: v - d, label: '−' + d });
    return V.numberLine({ min: 0, max: n + d, step: d, jumps });
  }
  /** Grid for the grid method, showing the first `shown` products. */
  function gridHTML(a, b, shown = 99) {
    const P = V.decompose(a);
    return `<table class="area"><tr><th class="corner">×</th>${P.map((p) => `<th>${fmt(p)}</th>`).join('')}</tr>
      <tr><th>${b}</th>${P.map((p, i) => `<td class="c${i}">${i < shown ? fmt(p * b) : '?'}</td>`).join('')}</tr></table>`;
  }
  const busHTML = (n, d) => {
    const ds = String(n).split('');
    return `<table class="bus"><tr><td></td>${ds.map(() => '<td></td>').join('')}</tr><tr><td class="dv">${d}</td>${ds.map((x, k) => `<td class="dd${k === 0 ? ' first' : ''}">${x}</td>`).join('')}</tr></table>`;
  };
  const factFamily = (a, b) => `<div class="fact-family"><span>${a} × ${b} = ${a * b}</span><span>${b} × ${a} = ${a * b}</span><span>${a * b} ÷ ${b} = ${a}</span><span>${a * b} ÷ ${a} = ${b}</span></div>`;
  const factorsOf = (n) => { const f = []; for (let k = 1; k <= n; k++) if (n % k === 0) f.push(k); return f; };
  const isPrime = (n) => n > 1 && factorsOf(n).length === 2;

  /** A guided real-life problem: choose the operation, (optional middle steps), answer with units. */
  function story(o) {
    return {
      type: 'guided', story: true, scene: o.scene, q: o.q, hint: o.hint,
      parts: [
        { say: 'What do we need to do?', type: 'choice', choices: OPS, answer: o.op, after: o.why },
        ...(o.mid || []),
        { say: o.ask || `Work it out: <b>${o.calc}</b>`, answer: o.answer, suffix: o.suffix, decimals: o.decimals },
      ],
      steps: o.steps,
    };
  }

  /* ---------------- tables ---------------- */
  const TIPS = {
    2: 'Times 2 is the same as <b>doubling</b>.',
    3: 'Times 3: do <b>times 2, then add one more lot</b>.',
    4: 'Times 4: <b>double, then double again</b>.',
    5: 'Times 5 is <b>half of times 10</b>. Answers end in 0 or 5.',
    6: 'Times 6: <b>double the times 3 answer</b>.',
    7: 'Times 7: do <b>times 5 and times 2</b>, then add.',
    8: 'Times 8: <b>double, double, double</b>.',
    9: 'Times 9: do <b>times 10, then take away</b> one lot.',
    10: 'Times 10: every digit moves one place left — a zero fills the ones.',
    11: 'Times 11 (up to 9): the digit repeats. Beyond: times 10 plus one more lot.',
    12: 'Times 12: do <b>times 10 and times 2</b>, then add.',
  };
  function tableSteps(a, b) {
    return [`${b} × ${a} means ${b} lots of ${a}.`, `Count in ${a}s:`, skipCount(a, b), TIPS[a] ? `💡 ${TIPS[a]}` : '', `${b} × ${a} = <b>${a * b}</b>`];
  }

  /* =====================================================================
   * MULTIPLICATION SKILLS
   * ===================================================================== */
  const mGroups = {
    id: 'equal-groups', title: 'Equal groups', icon: '🍽️', years: [1, 1],
    desc: 'Groups with the same number in each. Count them in 2s, 5s or 10s.',
    lesson() {
      const n = pick([2, 5, 10]), k = rand(2, 4), e = pick(EMO);
      const n2 = pick([2, 5, 10]), k2 = rand(2, 5), e2 = pick(EMO);
      return [
        { say: `Look at these plates. Every plate has the <b>same number</b> of ${e}. We call them <b>equal groups</b>.`, show: packs(k, n, 0, e) },
        { say: 'First, count the <b>groups</b>. Each plate is one group.', show: packs(k, n, 0, e), try: { q: 'How many groups are there?', answer: k } },
        { say: 'Now look inside one group.', show: packs(k, n, 0, e), try: { q: `How many ${e} are on each plate?`, answer: n } },
        { say: `To find how many <b>altogether</b>, count in ${n}s — one ${n} for every plate: ${Array.from({ length: k }, (_, i) => n * (i + 1)).join(', ')}.`, show: skipCount(n, k), try: { q: `${k} groups of ${n} = ?`, answer: n * k, hint: `Count in ${n}s, ${k} times.` } },
        { say: `We can write <b>${k} groups of ${n}</b> as <b>${k} × ${n}</b>. The sign × means “groups of”. 🎉`, show: big(`${k} × ${n} = ${n * k}`) },
        { say: 'Now you do all the steps!', show: packs(k2, n2, 0, e2), try: { type: 'guided', parts: [
          { say: 'How many groups?', answer: k2 }, { say: 'How many in each group?', answer: n2 }, { say: `Count in ${n2}s. How many altogether?`, answer: n2 * k2 },
        ] } },
      ];
    },
    gen() {
      const n = pick([2, 5, 10]), k = rand(2, 5), e = pick(EMO);
      if (Math.random() < 0.3) {
        const equal = Math.random() < 0.5;
        const counts = Array(k).fill(n > 5 ? 3 : n);
        if (!equal) counts[rand(0, k - 1)] += rand(1, 2);
        return YN('Are these <b>equal</b> groups?', equal, { visual: plates(counts, e), hint: 'Equal groups all have the same number.', steps: [`Count each plate: ${counts.join(', ')}.`, equal ? 'They are all the same, so they are equal groups.' : 'They are not all the same, so they are <b>not</b> equal groups.'] });
      }
      return { q: 'How many altogether?', visual: packs(k, n, 0, e), answer: k * n, hint: `Count in ${n}s.`, steps: [`There are ${k} groups of ${n}.`, skipCount(n, k), `${k} × ${n} = <b>${k * n}</b>`] };
    },
    word() {
      const n = pick([2, 5, 10]), k = rand(2, 5);
      const [what, sc] = pick([['apples', '🍎'], ['pencils', '✏️'], ['sweets', '🍬'], ['shells', '🐚']]);
      return story({ q: `There are <b>${k}</b> bags. Each bag has <b>${n}</b> ${what}. How many ${what} are there altogether?`, scene: sc, op: '×', why: 'Equal groups: we multiply (or count in steps).', calc: `${k} × ${n}`, answer: k * n, suffix: what, steps: [skipCount(n, k)] });
    },
  };

  const mCount = {
    id: 'count-in-steps', title: 'Count in 2s, 5s and 10s', icon: '🦘', years: [1, 2],
    desc: 'Jump along a number line in equal steps.',
    lesson(y) {
      const s = pick([2, 5, 10]);
      const seq = Array.from({ length: 6 }, (_, i) => s * (i + 1));
      const pat = { 2: 'Counting in 2s from 0 gives <b>even numbers</b>: they end in 0, 2, 4, 6 or 8.', 5: 'Counting in 5s, the numbers always end in <b>5 or 0</b>.', 10: 'Counting in 10s, the numbers always end in <b>0</b>.' }[s];
      const s2 = pick([2, 5, 10]), st2 = s2 * rand(0, y === 1 ? 3 : 6);
      const miss = [st2, st2 + s2, st2 + 2 * s2, st2 + 3 * s2];
      const hands = rand(3, 7);
      return [
        { say: `Counting in <b>${s}s</b> means jumping ${s} each time instead of 1. It is much faster than counting in ones!`, show: skipLine(s, 5) },
        { say: 'Say the numbers out loud with me: 🎵', show: V.chips(seq.map(String)) },
        { say: 'What comes next? Make one more jump.', show: V.chips(seq.slice(0, 4).map(String).concat(['?'])), try: { q: `${seq.slice(0, 4).join(', ')}, ?`, answer: seq[4], hint: `Add ${s} to ${seq[3]}.` } },
        { say: `💡 Spot the pattern! ${pat}`, show: skipCount(s, 10) },
        { say: 'Find the missing number. Is it a jump forward from the one before?', show: V.chips([miss[0], miss[1], '?', miss[3]].map(String), [2]), try: { q: `${miss[0]}, ${miss[1]}, ?, ${miss[3]}`, answer: miss[2] } },
        { say: `Real life: each hand has 5 fingers. Count the fingers on <b>${hands}</b> hands in 5s. ✋`, show: `<div class="demo-row">${'✋'.repeat(hands)}</div>`, try: { q: `How many fingers on ${hands} hands?`, answer: hands * 5, hint: 'Count in 5s: 5, 10, 15…' } },
      ];
    },
    gen(y) {
      const s = pick([2, 5, 10]), start = s * rand(0, y === 1 ? 4 : 8);
      const seq = [0, 1, 2, 3, 4].map((i) => start + s * i);
      const gap = rand(1, 4);
      const shown = seq.map((v, i) => (i === gap ? '?' : v));
      return { q: `Count in ${s}s. What is the missing number?`, visual: V.chips(shown.map(String), [gap]), answer: seq[gap], hint: `Each jump is ${s}.`, steps: [V.chips(seq.map(String), [gap]), `The missing number is <b>${seq[gap]}</b>.`] };
    },
    word() {
      const k = rand(3, 8);
      const [what, per, sc] = pick([['socks', 2, '🧦'], ['hands', 5, '✋'], ['shoes', 2, '👟'], ['10c coins', 10, '🪙']]);
      return story({ q: `There are <b>${k}</b> pairs or sets of ${what}, with <b>${per}</b> in each. Count in ${per}s. How many altogether?`, scene: sc, op: '×', why: `Equal groups of ${per}: count in ${per}s.`, calc: `${k} × ${per}`, answer: k * per, steps: [skipCount(per, k)] });
    },
  };

  const mArrays = {
    id: 'arrays', title: 'Arrays: rows and columns', icon: '🔲', years: [1, 2],
    desc: 'Put things in neat rows to multiply.',
    lesson() {
      const r = rand(2, 4), c = rand(3, 5);
      const r2 = rand(2, 5), c2 = rand(2, 6);
      return [
        { say: 'An <b>array</b> is things set out in neat <b>rows</b> ➡️ and <b>columns</b> ⬇️. Egg boxes, chocolate bars and windows are arrays!', show: `<div class="demo-row" style="font-size:40px">🥚🍫🪟</div>${V.array(r, c)}` },
        { say: 'Rows go across, like lines in a book. Count the rows.', show: V.array(r, c), try: { q: 'How many rows?', answer: r } },
        { say: 'Now count the dots in <b>one</b> row.', show: V.array(r, c), try: { q: 'How many dots in each row?', answer: c } },
        { say: `So we have <b>${r} rows of ${c}</b>. Count in ${c}s, one ${c} for each row.`, show: V.array(r, c) + skipCount(c, r), try: { q: `${r} × ${c} = ?`, answer: r * c, hint: `Count in ${c}s.` } },
        { say: `Your turn to build one! Make <b>${r2} rows of ${c2}</b>. Tap the dot at the bottom-right corner of your array.`, try: { type: 'guided', parts: [
          { say: `Make ${r2} rows of ${c2}.`, type: 'array', rows: r2, cols: c2 }, { say: 'How many dots altogether?', answer: r2 * c2 },
        ] } },
      ];
    },
    gen() {
      const r = rand(2, 5), c = rand(2, 6);
      if (Math.random() < 0.5) return { type: 'guided', q: `Make an array to show <b>${r} × ${c}</b>.`, hint: `${r} rows, ${c} in each row.`, parts: [{ say: `Make ${r} rows of ${c}.`, type: 'array', rows: r, cols: c }, { say: `${r} × ${c} = ?`, answer: r * c }] };
      return { q: 'How many dots? Write the multiplication in your head first.', visual: V.array(r, c), answer: r * c, hint: `${r} rows of ${c}: count in ${c}s.`, steps: [`${r} rows of ${c}.`, skipCount(c, r), `${r} × ${c} = <b>${r * c}</b>`] };
    },
    word() {
      const r = rand(2, 5), c = rand(2, 6);
      return story({ q: `A box of chocolates has <b>${r}</b> rows with <b>${c}</b> chocolates in each row. How many chocolates are in the box?`, scene: '🍫', op: '×', why: 'Rows with the same number in each: multiply.', calc: `${r} × ${c}`, answer: r * c, suffix: 'chocolates', mid: [{ say: 'Draw the box as an array.', type: 'array', rows: r, cols: c }] });
    },
  };

  const mDouble = {
    id: 'doubling', title: 'Doubling', icon: '👯', years: [1, 3],
    desc: 'Double means two lots of the same number.',
    lesson(y) {
      const n = y === 1 ? rand(2, 5) : rand(3, 9), e = pick(EMO);
      const frames = [
        { say: `To <b>double</b> means to have <b>two lots</b> of the same number. Double ${n} is ${n} + ${n}.`, show: `<div class="obj-sum">${V.objects(n, e)}<span class="op">+</span>${V.objects(n, e)}</div>` },
        { say: 'Count them all.', show: `<div class="obj-sum">${V.objects(n, e)}<span class="op">+</span>${V.objects(n, e)}</div>`, try: { q: `Double ${n} = ?`, answer: 2 * n } },
        { say: `Doubling is the same as <b>times 2</b>: double ${n} = ${n} + ${n} = 2 × ${n}. Your two hands are a doubling machine! 🙌`, show: big(`2 × ${n} = ${2 * n}`) },
      ];
      if (y === 1) {
        const m = rand(3, 8);
        frames.push({ say: `A ten frame helps: put ${m} red and ${m} blue.`, show: V.tenFrame(2 * m, '🔴', { second: m }), try: { q: `Double ${m} = ?`, answer: 2 * m } });
        const p = rand(2, 10);
        frames.push({ say: 'Last one! You can use your fingers.', try: { q: `Double ${p} = ?`, answer: 2 * p } });
        return frames;
      }
      const T = rand(1, y === 2 ? 3 : 4) * 10, O = rand(1, y === 2 ? 4 : 9), N = T + O;
      frames.push(
        { say: `Bigger numbers: <b>split</b> ${N} into tens and ones: ${T} and ${O}. Double each part.`, show: V.base10(N) },
        { say: `Double the tens first.`, try: { q: `Double ${T} = ?`, answer: 2 * T, hint: `Double ${T / 10} is ${T / 5}, so double ${T} is ${2 * T}.` } },
        { say: 'Now double the ones.', try: { q: `Double ${O} = ?`, answer: 2 * O } },
        { say: 'Put the two parts back together.', try: { q: `${2 * T} + ${2 * O} = ?`, answer: 2 * N } },
        { say: `So double ${N} = <b>${2 * N}</b>. 🎉`, show: big(`2 × ${N} = ${2 * N}`) },
      );
      return frames;
    },
    gen(y) {
      const n = y === 1 ? rand(1, 10) : y === 2 ? rand(5, 25) : rand(12, 99);
      if (n > 10) {
        const T = n - (n % 10), O = n % 10;
        return { type: 'guided', q: `Double ${n}`, hint: 'Double the tens, double the ones, then add.', parts: [{ say: `Double ${T} = ?`, answer: 2 * T }, { say: `Double ${O} = ?`, answer: 2 * O }, { say: `${2 * T} + ${2 * O} = ?`, answer: 2 * n }] };
      }
      return { q: `Double ${n} = ?`, visual: y === 1 ? `<div class="obj-sum">${V.objects(n, '🍓')}<span class="op">+</span>${V.objects(n, '🍓')}</div>` : '', answer: 2 * n, hint: `${n} + ${n}`, steps: [`${n} + ${n} = <b>${2 * n}</b>`] };
    },
    word(y) {
      const n = y === 1 ? rand(2, 10) : rand(11, y === 2 ? 25 : 60);
      const nm = U.name();
      return story({ q: `${nm} has <b>${n}</b> stickers. A friend has <b>double</b> that number. How many stickers does the friend have?`, scene: '⭐', op: '×', why: 'Double means two lots: × 2.', calc: `double ${n}`, answer: 2 * n, suffix: 'stickers' });
    },
  };

  const mT2510 = {
    id: 'tables-2-5-10', title: '2, 5 and 10 times tables', icon: '🔟', years: [2, 2],
    desc: 'Learn the 2s, 5s and 10s facts and their patterns.',
    lesson() {
      const s = pick([2, 5, 10]), b = rand(3, 8);
      const facts = Array.from({ length: 10 }, (_, i) => `${i + 1} × ${s} = ${(i + 1) * s}`);
      const b2 = rand(4, 10), b3 = rand(2, 9);
      const trick = { 2: `Times 2 is <b>doubling</b>: ${b2} × 2 = ${b2} + ${b2}.`, 5: `Times 5 is <b>half of times 10</b>: ${b2} × 10 = ${b2 * 10}, half of that is ${b2 * 5}.`, 10: `Times 10: the digits move one place left and a <b>0</b> fills the ones: ${b2} × 10 = ${b2 * 10}.` }[s];
      return [
        { say: `A <b>times table</b> is a list of facts. Here is the <b>${s} times table</b>. Each answer is ${s} more than the one before.`, show: V.chips(facts) },
        { say: `On a number line, each fact is one more jump of ${s}. Here are ${b} jumps.`, show: skipLine(s, b), try: { q: `${b} × ${s} = ?`, answer: b * s, hint: `Count the jumps of ${s}.` } },
        { say: `💡 A trick: ${trick}`, show: big(`${b2} × ${s} = ${b2 * s}`), try: { q: `${b2} × ${s} = ?`, answer: b2 * s } },
        { say: `Missing number! How many ${s}s make ${b3 * s}? Count in ${s}s until you reach it.`, show: skipLine(s, b3), try: { q: `? × ${s} = ${b3 * s}`, answer: b3, hint: 'Count the jumps.' } },
        { say: 'Great work! Keep practising and these facts will stick in your head. 🧠' },
      ];
    },
    gen() {
      const s = pick([2, 5, 10]), b = rand(1, 12);
      if (Math.random() < 0.3) return { q: `? × ${s} = ${b * s}`, answer: b, hint: `Count in ${s}s up to ${b * s}.`, steps: [skipCount(s, b), `${b} × ${s} = ${b * s}, so the missing number is <b>${b}</b>.`] };
      return { q: `${b} × ${s} = ?`, visual: b <= 10 ? skipLine(s, b).replace(/<path[^>]*class="nl-jump"[^>]*\/>|<text[^>]*class="nl-jlab"[^>]*>[^<]*<\/text>/g, '') : '', answer: b * s, hint: `Count in ${s}s, ${b} times.`, steps: tableSteps(s, b) };
    },
    word() {
      const s = pick([2, 5, 10]), b = rand(2, 10);
      const nm = U.name();
      const [txt, sc] = pick([[`${nm} buys <b>${b}</b> packs of stickers. Each pack has <b>${s}</b> stickers. How many stickers?`, '⭐'], [`A shop has <b>${b}</b> boxes with <b>${s}</b> cakes in each. How many cakes?`, '🧁']]);
      return story({ q: txt, scene: sc, op: '×', why: '“Each” and “in each” mean equal groups: multiply.', calc: `${b} × ${s}`, answer: b * s, steps: tableSteps(s, b) });
    },
  };

  const mTurn = {
    id: 'turn-around', title: 'Turn it around (any order)', icon: '🔄', years: [2, 3],
    desc: '3 × 5 is the same as 5 × 3. Division is different!',
    lesson() {
      let r = rand(2, 5), c = rand(3, 7);
      if (r === c) c++;
      const a = rand(2, 6);
      let b = rand(3, 9);
      if (a === b) b++;
      return [
        { say: `Here are <b>${r} rows of ${c}</b>. That is ${r} × ${c}.`, show: V.array(r, c), try: { q: `${r} × ${c} = ?`, answer: r * c } },
        { say: `Now let's <b>turn the array</b> on its side! 🔄 It is now ${c} rows of ${r}. Did any dots disappear?`, show: V.array(c, r), try: { q: `${c} × ${r} = ?`, answer: r * c } },
        { say: `Same dots, same answer! So <b>${r} × ${c} = ${c} × ${r}</b>. You can multiply in <b>any order</b>. Super shortcut: if you know 2 × 9, you also know 9 × 2!`, show: big(`${r} × ${c} = ${c} × ${r} = ${r * c}`) },
        { say: 'Which one is the same?', try: { q: `Which is the same as <b>${a} × ${b}</b>?`, type: 'choice', choices: shuffle([{ v: 'turn', html: `${b} × ${a}` }, { v: 'add', html: `${a} + ${b}` }, { v: 'sq', html: `${a} × ${a}` }]), answer: 'turn' } },
        { say: `⚠️ Careful: this only works for × (and +). ${a * b} ÷ ${a} is <b>not</b> the same as ${a} ÷ ${a * b}! Sharing ${a * b} sweets between ${a} friends is very different from sharing ${a} sweets between ${a * b} friends.` },
        { say: `Make an array for <b>${b} × ${a}</b>. Either way round is fine!`, try: { type: 'array', rows: Math.min(a, b), cols: Math.max(a, b), turn: true } },
      ];
    },
    gen(y) {
      const a = rand(2, y === 2 ? 10 : 12);
      let b = rand(2, 9);
      if (a === b) b++;
      if (Math.random() < 0.5) return { q: `${a} × ${b} = ${b} × ?`, answer: a, hint: 'You can multiply in any order.', steps: [`${a} × ${b} = ${b} × ${a}, so the missing number is <b>${a}</b>.`] };
      return { q: `Which is the same as <b>${a} × ${b}</b>?`, type: 'choice', choices: shuffle([{ v: 'turn', html: `${b} × ${a}` }, { v: 'add', html: `${a} + ${b}` }, { v: 'div', html: `${b} ÷ ${a}` }]), answer: 'turn', hint: 'Turn the array around.', steps: [`${a} × ${b} = ${b} × ${a} = ${a * b}`] };
    },
  };

  const mSentences = {
    id: 'number-sentences', title: 'Write multiplication sentences', icon: '✍️', years: [2, 2],
    desc: 'Turn pictures and repeated adding into × sentences.',
    lesson() {
      const k = rand(3, 5), n = pick([2, 5, 10, 3]), e = pick(EMO);
      const k2 = rand(3, 6), n2 = pick([2, 5, 10]);
      return [
        { say: `Pictures can be written as <b>number sentences</b>. Look: ${k} groups of ${n}.`, show: packs(k, n, 0, e) },
        { say: 'As an <b>adding</b> sentence, we add a group for every plate.', show: big(Array(k).fill(n).join(' + ') + ' = ?'), try: { q: `${Array(k).fill(n).join(' + ')} = ?`, answer: n * k } },
        { say: `As a <b>multiplying</b> sentence, it is much shorter: <b>${k} × ${n} = ${k * n}</b>. The first number says how many groups; the second says how many in each.`, show: big(`${k} × ${n} = ${k * n}`) },
        { say: 'Which sentence matches the picture?', show: packs(k2, n2, 0, '🐟'), try: { q: 'Choose the sentence.', type: 'choice', choices: shuffle([{ v: 'ok', html: `${k2} × ${n2} = ${k2 * n2}` }, { v: 'plus', html: `${k2} + ${n2} = ${k2 + n2}` }, { v: 'more', html: `${k2 + 1} × ${n2} = ${(k2 + 1) * n2}` }]), answer: 'ok' } },
        { say: 'Change the adding into multiplying: count how many times the number is added.', try: { q: `${Array(k2).fill(n2).join(' + ')} = ? × ${n2}`, answer: k2 } },
      ];
    },
    gen() {
      const k = rand(2, 6), n = pick([2, 5, 10]);
      if (Math.random() < 0.5) return { q: `${Array(k).fill(n).join(' + ')} = ? × ${n}`, answer: k, hint: `Count how many ${n}s are added.`, steps: [`${n} is added ${k} times, so it is <b>${k}</b> × ${n}.`] };
      return { q: 'Which sentence matches the picture?', visual: packs(k, n, 0, pick(EMO)), type: 'choice', choices: shuffle([{ v: 'ok', html: `${k} × ${n} = ${k * n}` }, { v: 'plus', html: `${k} + ${n} = ${k + n}` }, { v: 'less', html: `${k} × ${n + 1} = ${k * (n + 1)}` }]), answer: 'ok', hint: 'Count the groups, then how many in each.', steps: [`${k} groups of ${n}: <b>${k} × ${n} = ${k * n}</b>`] };
    },
  };

  const mT348 = {
    id: 'tables-3-4-8', title: '3, 4 and 8 times tables', icon: '🕷️', years: [3, 3],
    desc: 'Use doubling to learn the 4s and 8s, and count in 3s.',
    lesson() {
      const b = rand(3, 9), b2 = rand(3, 9), b3 = rand(4, 9);
      return [
        { say: 'The <b>4 times table</b> is the <b>2 times table doubled</b>! Why? Because 4 lots is 2 lots and 2 more lots.', show: `<div class="demo-row">${V.chips(Array.from({ length: 6 }, (_, i) => `2 × ${i + 1} = ${2 * (i + 1)}`))}</div><div class="demo-row">${V.chips(Array.from({ length: 6 }, (_, i) => `4 × ${i + 1} = ${4 * (i + 1)}`))}</div>` },
        { say: `Let's find 4 × ${b}. First the 2 times table fact.`, try: { type: 'guided', parts: [{ say: `2 × ${b} = ?`, answer: 2 * b }, { say: `Double it: 4 × ${b} = ?`, answer: 4 * b }] } },
        { say: `The <b>8 times table</b> is the 4 times table doubled. So 8 × ${b2} = double (4 × ${b2}).`, try: { type: 'guided', parts: [{ say: `4 × ${b2} = ?`, answer: 4 * b2 }, { say: `Double it: 8 × ${b2} = ?`, answer: 8 * b2 }] } },
        { say: `The <b>3 times table</b>: count in 3s, or do × 2 and add one more lot. 3 × ${b3} = ${2 * b3} + ${b3}.`, show: skipLine(3, b3), try: { q: `3 × ${b3} = ?`, answer: 3 * b3 } },
        { say: '🕷️ Spiders have 8 legs. 🍀 Some clovers have 3 leaves, 4 for a lucky one! Now you know which tables to use.' },
      ];
    },
    gen() {
      const a = pick([3, 4, 8]), b = rand(1, 12);
      if (a !== 3 && Math.random() < 0.4) {
        const half = a / 2;
        return { type: 'guided', q: `${a} × ${b} = ?`, hint: `Use ${half} × ${b} and double it.`, parts: [{ say: `${half} × ${b} = ?`, answer: half * b }, { say: `Double it: ${a} × ${b} = ?`, answer: a * b }] };
      }
      return { q: `${a} × ${b} = ?`, answer: a * b, hint: TIPS[a].replace(/<[^>]+>/g, ''), steps: tableSteps(a, b) };
    },
    word() {
      const k = rand(3, 10);
      const [txt, per, sc, unit] = pick([[`A spider has 8 legs. How many legs do <b>${k}</b> spiders have?`, 8, '🕷️', 'legs'], [`A tricycle has 3 wheels. How many wheels on <b>${k}</b> tricycles?`, 3, '🚲', 'wheels'], [`A chair has 4 legs. How many legs do <b>${k}</b> chairs have?`, 4, '🪑', 'legs']]);
      return story({ q: txt, scene: sc, op: '×', why: `${k} equal groups of ${per}.`, calc: `${k} × ${per}`, answer: k * per, suffix: unit, steps: tableSteps(per, k) });
    },
  };

  function gridGuided(a, b) {
    const P = V.decompose(a);
    return {
      type: 'guided', q: `${fmt(a)} × ${b} = ?`, visual: gridHTML(a, b, 0), hint: 'Split the big number by place value. Multiply each part.',
      parts: [
        ...P.map((p) => ({ say: `${fmt(p)} × ${b} = ?${p >= 10 ? ` <span class="muted">(think ${p / 10 ** Math.floor(Math.log10(p))} × ${b}, then make it ${p >= 100 ? '100' : '10'} times bigger)</span>` : ''}`, answer: p * b })),
        { say: `Add the parts: ${P.map((p) => fmt(p * b)).join(' + ')} = ?`, answer: a * b },
      ],
      steps: [gridHTML(a, b), `${P.map((p) => fmt(p * b)).join(' + ')} = <b>${fmt(a * b)}</b>`],
    };
  }
  const mGrid = {
    id: 'grid-method', title: 'Grid method: 2-digit × 1-digit', icon: '🧱', years: [3, 4],
    desc: 'Split the number into tens and ones, multiply each part, then add.',
    lesson(y) {
      const a = y === 3 ? rand(13, 49) : rand(23, 98), b = rand(3, y === 3 ? 8 : 9);
      const T = a - (a % 10), O = a % 10 || 1;
      const A = T + O;
      const n = y === 3 ? rand(13, 39) : rand(112, 389);
      return [
        { say: `${A} × ${b} looks hard. The trick: <b>split</b> ${A} into tens and ones — <b>${T}</b> and <b>${O}</b>. Small pieces are easy!`, show: V.base10(A) },
        { say: `Draw a grid. Put the parts along the top and ${b} down the side. Each box is one small multiplication.`, show: gridHTML(A, b, 0) },
        { say: `Tens box: ${T} × ${b}. Think <b>${T / 10} × ${b} = ${(T / 10) * b}</b>, then make it ten times bigger, because ${T} is ten times bigger than ${T / 10}.`, show: gridHTML(A, b, 0), try: { q: `${T} × ${b} = ?`, answer: T * b } },
        { say: 'Ones box: an easy times-table fact.', show: gridHTML(A, b, 1), try: { q: `${O} × ${b} = ?`, answer: O * b } },
        { say: 'Now <b>add</b> the two boxes together.', show: gridHTML(A, b, 2), try: { q: `${T * b} + ${O * b} = ?`, answer: A * b } },
        { say: `So <b>${A} × ${b} = ${A * b}</b>. 🎉 ✔️ Check: it should be a bit more than ${T} × ${b} = ${T * b}. Yes!`, show: gridHTML(A, b) },
        { say: 'Your turn! Fill each part of the grid.', try: gridGuided(n, rand(3, 9)) },
      ];
    },
    gen(y) {
      const a = y === 3 ? rand(13, 49) : Math.random() < 0.5 ? rand(23, 99) : rand(112, 499);
      const b = rand(3, 9);
      if (y === 4 && Math.random() < 0.3) return { q: `${fmt(a)} × ${b} = ?`, answer: a * b, hint: 'Use the grid in your head.', steps: gridGuided(a, b).steps };
      return gridGuided(a, b);
    },
    word(y) {
      const a = y === 3 ? rand(13, 39) : rand(24, 99), b = rand(3, 9);
      const [txt, unit, sc] = pick([[`A school bus holds <b>${a}</b> children. How many children can <b>${b}</b> buses hold?`, 'children', '🚌'], [`A book has <b>${a}</b> pages. How many pages are in <b>${b}</b> copies?`, 'pages', '📚'], [`A box holds <b>${a}</b> crayons. How many crayons in <b>${b}</b> boxes?`, 'crayons', '🖍️']]);
      const g = gridGuided(a, b);
      return story({ q: txt, scene: sc, op: '×', why: `${b} equal groups of ${a}.`, mid: g.parts.slice(0, -1), ask: `Add the parts. How many ${unit}?`, answer: a * b, suffix: unit, steps: g.steps });
    },
  };

  const mScale = {
    id: 'times-as-many', title: 'Times as many (scaling)', icon: '📏', years: [3, 4],
    desc: '“3 times as many” means 3 copies of the amount.',
    lesson(y) {
      const n = rand(2, 5), k = rand(2, 4), [a, b] = U.twoNames();
      const n2 = rand(3, y === 3 ? 9 : 12), k2 = rand(2, 5);
      return [
        { say: `${a} has <b>${n}</b> stars. ${b} has <b>${k} times as many</b>. That means ${b} has ${k} copies of ${a}'s stars!`, show: `<p><b>${a}:</b> ${'⭐'.repeat(n)}</p><p><b>${b}:</b> ${Array(k).fill('⭐'.repeat(n)).join(' &nbsp; ')}</p>` },
        { say: `How many stars does ${b} have? Count, or work out ${k} × ${n}.`, try: { q: `${k} × ${n} = ?`, answer: k * n } },
        { say: `A tower of blocks is <b>${n2} cm</b> tall. Another tower is <b>${k2} times as tall</b>. Picture ${k2} copies of the small tower stacked up.`, show: `<div class="demo-row">${'🟦'.repeat(1)}<span class="op">→</span>${'🟦'.repeat(k2)}</div>`, try: { q: `How tall is the big tower?`, answer: n2 * k2, suffix: 'cm' } },
        { say: '⚠️ “Times as many” means multiply. “More than” means add. 3 times as many as 5 is 15, but 3 more than 5 is 8!', try: { q: `What is <b>4 times as many</b> as 6?`, type: 'choice', choices: [{ v: '24', html: '24' }, { v: '10', html: '10' }, { v: '2', html: '2' }], answer: '24' } },
      ];
    },
    gen(y) { return mScale.word(y); },
    word(y) {
      const [a, b] = U.twoNames();
      const n = rand(3, y === 3 ? 10 : 25), k = rand(2, y === 3 ? 4 : 8);
      const [txt, unit, sc] = pick([
        [`${a} has <b>${n}</b> marbles. ${b} has <b>${k} times as many</b>. How many marbles does ${b} have?`, 'marbles', '🔵'],
        [`A puppy weighs <b>${n} kg</b>. A big dog weighs <b>${k} times as much</b>. How heavy is the dog?`, 'kg', '🐕'],
        [`A ribbon is <b>${n} cm</b> long. Another ribbon is <b>${k} times as long</b>. How long is it?`, 'cm', '🎀'],
      ]);
      return story({ q: txt, scene: sc, op: '×', why: `“${k} times as many” means ${k} copies: multiply.`, calc: `${n} × ${k}`, answer: n * k, suffix: unit, steps: [`${n} × ${k} = <b>${n * k}</b>`] });
    },
  };

  const mT12 = {
    id: 'tables-to-12', title: 'Times tables to 12 × 12', icon: '🏆', years: [4, 5],
    desc: 'Clever tricks for 6, 7, 9, 11 and 12.',
    lesson() {
      const b = rand(3, 9), c = rand(3, 9), d = rand(3, 9), e = rand(4, 9);
      return [
        { say: 'You already know lots of facts! Turning facts around (7 × 3 = 3 × 7) means there are only a few new ones to learn. Let\'s use <b>tricks</b>.', show: big('9 × 7 = 70 − 7 = 63') },
        { say: `<b>× 9 trick:</b> do × 10, then take away one lot. Why? 9 lots is one lot less than 10 lots.`, try: { type: 'guided', parts: [{ say: `10 × ${b} = ?`, answer: 10 * b }, { say: `Take away one ${b}: 9 × ${b} = ?`, answer: 9 * b }] } },
        { say: `<b>× 11 trick:</b> up to 9 the digit repeats: 11 × 4 = 44. For 11 × 12 do 11 × 10 + 11 × 2 = 110 + 22 = 132.`, try: { q: `11 × ${c} = ?`, answer: 11 * c } },
        { say: `<b>× 12 trick:</b> 12 = 10 + 2. So do × 10 and × 2, then add.`, try: { type: 'guided', parts: [{ say: `10 × ${d} = ?`, answer: 10 * d }, { say: `2 × ${d} = ?`, answer: 2 * d }, { say: `Add: 12 × ${d} = ?`, answer: 12 * d }] } },
        { say: `<b>× 7 trick:</b> 7 = 5 + 2. Do × 5 and × 2, then add. <b>× 6</b>: double the × 3 answer.`, try: { q: `7 × ${e} = ?`, answer: 7 * e, hint: `5 × ${e} = ${5 * e}, 2 × ${e} = ${2 * e}` } },
      ];
    },
    gen() {
      const a = rand(2, 12), b = rand(2, 12);
      if (Math.random() < 0.25) return { q: `? × ${a} = ${a * b}`, answer: b, hint: `Which number times ${a} makes ${a * b}?`, steps: tableSteps(a, b) };
      return { q: `${b} × ${a} = ?`, answer: a * b, hint: (TIPS[a] || `Count in ${a}s.`).replace(/<[^>]+>/g, ''), steps: tableSteps(a, b) };
    },
    word() {
      const k = rand(3, 12);
      const [txt, per, unit, sc] = pick([[`Eggs come in boxes of 12. How many eggs are in <b>${k}</b> boxes?`, 12, 'eggs', '🥚'], [`A week has 7 days. How many days are in <b>${k}</b> weeks?`, 7, 'days', '📅'], [`A football team has 11 players. How many players are in <b>${k}</b> teams?`, 11, 'players', '⚽']]);
      return story({ q: txt, scene: sc, op: '×', why: `${k} equal groups of ${per}.`, calc: `${k} × ${per}`, answer: k * per, suffix: unit, steps: tableSteps(per, k) });
    },
  };

  const m10 = {
    id: 'times-10-100', title: 'Multiply by 10, 100 and 1,000', icon: '🚀', years: [4, 5],
    desc: 'Digits move to the left. Zeros hold the empty places.',
    lesson(y) {
      const n = rand(12, 89), m = rand(3, 47), k = rand(2, 9);
      const cols = ['tt', 'th', 'h', 't', 'o'];
      const frames = [
        { say: `When we multiply by 10, every digit moves <b>one place to the LEFT</b>. The number becomes ten times bigger. A <b>0</b> fills the empty ones place.`, show: V.pvTable(n, cols) + '<div class="op">× 10 ⬅️</div>' + V.pvTable(n * 10, cols) },
        { say: 'Your turn: where do the digits go?', try: { q: `${n} × 10 = ?`, answer: n * 10 } },
        { say: 'Multiplying by 100 moves every digit <b>two places</b> left. Two zeros fill the empty places.', show: V.pvTable(m, cols) + '<div class="op">× 100 ⬅️⬅️</div>' + V.pvTable(m * 100, cols), try: { q: `${m} × 100 = ?`, answer: m * 100 } },
      ];
      if (y >= 5) {
        const x = rand(12, 98) / 10;
        frames.push({ say: `× 1,000 moves digits <b>three places</b>. ⚠️ With decimals we do not just “add a zero”: ${fmt(x)} × 10 = ${fmt(U.round(x * 10, 2))}, the digits move across the decimal point.`, try: { q: `${fmt(x)} × 100 = ?`, answer: U.round(x * 100, 2), decimals: true } });
      }
      frames.push({ say: 'Missing number: how many places did the digits move?', try: { q: `${k} × ? = ${k * 100}`, answer: 100 } });
      return frames;
    },
    gen(y) {
      const by = pick(y === 4 ? [10, 100] : [10, 100, 1000]);
      if (y >= 5 && Math.random() < 0.35) {
        const x = rand(11, 999) / 10;
        return { q: `${fmt(x)} × ${fmt(by)} = ?`, answer: U.round(x * by, 2), decimals: true, hint: `Move every digit ${String(by).length - 1} place(s) left.`, steps: [`Each digit moves ${String(by).length - 1} place(s) to the left.`, `${fmt(x)} × ${fmt(by)} = <b>${fmt(U.round(x * by, 2))}</b>`] };
      }
      const n = rand(2, y === 4 ? 99 : 999);
      if (Math.random() < 0.3) return { q: `? × ${fmt(by)} = ${fmt(n * by)}`, answer: n, hint: 'Move the digits back to the right.', steps: [`${fmt(n)} × ${fmt(by)} = ${fmt(n * by)}`] };
      return { q: `${fmt(n)} × ${fmt(by)} = ?`, answer: n * by, hint: `Every digit moves ${String(by).length - 1} place(s) left.`, steps: [V.pvTable(n, ['ht', 'tt', 'th', 'h', 't', 'o']), V.pvTable(n * by, ['ht', 'tt', 'th', 'h', 't', 'o']), `${fmt(n)} × ${fmt(by)} = <b>${fmt(n * by)}</b>`] };
    },
    word(y) {
      const n = rand(12, y === 4 ? 95 : 450), by = pick([10, 100]);
      return story({ q: `A packet holds <b>${n}</b> grams of rice. How many grams are in <b>${by}</b> packets?`, scene: '🍚', op: '×', why: `${by} equal packets: multiply by ${by}.`, calc: `${n} × ${by}`, answer: n * by, suffix: 'g' });
    },
  };

  function carryPairMul(y) {
    for (;;) {
      const a = y === 4 ? rand(112, 899) : rand(1012, 4999), b = rand(3, 9);
      const ds = String(a).split('').map(Number);
      if (ds.slice(-2).some((x) => x * b >= 10)) return { a, b };
    }
  }
  const mShort = {
    id: 'short-multiplication', title: 'Short multiplication', icon: '✏️', years: [4, 6],
    desc: 'The column method: multiply each digit, carry the tens.',
    lesson(y) {
      const { a, b } = carryPairMul(y);
      const ds = String(a).split('').reverse().map(Number);
      const o = ds[0] * b, t = ds[1] * b + Math.floor(o / 10);
      const n = carryPairMul(y);
      return [
        { say: `Short multiplication is the <b>grid method squashed</b> into columns. Here is ${fmt(a)} × ${b} as a grid — each place value times ${b}.`, show: V.areaModel(a, b) },
        { say: `In the column method we write ${fmt(a)}, put <b>${b}</b> under the ones, and multiply each digit by ${b}, starting with the <b>ones</b>.`, show: big(`${fmt(a)} × ${b}`) },
        { say: `<b>Ones:</b> ${ds[0]} × ${b}.`, try: { q: `${ds[0]} × ${b} = ?`, answer: o } },
        { say: o >= 10 ? `${o} ones = <b>${Math.floor(o / 10)} ten${o >= 20 ? 's' : ''}</b> and ${o % 10} ones. Write ${o % 10} in the ones, and <b>carry ${Math.floor(o / 10)}</b> into the tens column — just like in addition.` : `${o} is less than 10, so write ${o} in the ones. Nothing to carry.` },
        { say: `<b>Tens:</b> ${ds[1]} × ${b}${o >= 10 ? `, then add the carried ${Math.floor(o / 10)}` : ''}.`, try: { q: `${ds[1]} × ${b}${o >= 10 ? ` + ${Math.floor(o / 10)}` : ''} = ?`, answer: t } },
        { say: `Keep going left in the same way until every digit is done. ✔️ Estimate to check: ${fmt(a)} is about ${fmt(Math.round(a / 100) * 100)}, and ${fmt(Math.round(a / 100) * 100)} × ${b} = ${fmt(Math.round(a / 100) * 100 * b)}. The answer, <b>${fmt(a * b)}</b>, is close!`, show: V.areaModel(a, b) },
        { say: 'Your turn! The helper asks each small step. Write each digit and each carry.', try: { type: 'column', a: n.a, b: n.b, op: '×', q: `${fmt(n.a)} × ${n.b}` } },
      ];
    },
    gen(y) {
      const a = y === 4 ? (Math.random() < 0.3 ? rand(23, 99) : rand(112, 999)) : rand(1012, 9899), b = rand(2, 9);
      return { type: 'column', q: `Work out ${fmt(a)} × ${b}`, a, b, op: '×', hint: 'Start with the ones. Carry the tens to the next column.', steps: [V.areaModel(a, b), `${fmt(a)} × ${b} = <b>${fmt(a * b)}</b>`] };
    },
    word(y) {
      const a = y === 4 ? rand(112, 899) : rand(1012, 4999), b = rand(3, 9);
      const [txt, unit, sc] = pick([[`A lorry carries <b>${fmt(a)}</b> kg on each trip. It makes <b>${b}</b> trips. How many kg does it carry?`, 'kg', '🚚'], [`A theatre sells <b>${fmt(a)}</b> tickets every night for <b>${b}</b> nights. How many tickets is that?`, 'tickets', '🎭']]);
      return story({ q: txt, scene: sc, op: '×', why: `${b} equal amounts of ${fmt(a)}.`, mid: [{ say: `Work out ${fmt(a)} × ${b}:`, type: 'column', a, b, op: '×' }], ask: 'Write the answer:', answer: a * b, suffix: unit });
    },
  };

  const mThree = {
    id: 'three-numbers', title: 'Multiply three numbers', icon: '🧩', years: [4, 4],
    desc: 'Multiply two numbers first, then the third. Pick an easy pair!',
    lesson() {
      const a = rand(2, 4), b = rand(2, 5), c = rand(2, 5);
      const x = rand(3, 9);
      return [
        { say: `To work out <b>${a} × ${b} × ${c}</b>, multiply two of them first, then multiply the answer by the third.`, show: big(`${a} × ${b} × ${c}`) },
        { say: 'Start with the first two.', try: { q: `${a} × ${b} = ?`, answer: a * b } },
        { say: `Now multiply that by ${c}.`, try: { q: `${a * b} × ${c} = ?`, answer: a * b * c } },
        { say: `💡 You can choose <b>any pair first</b> — the answer is the same. Look for easy pairs that make 10: 2 × 5 = 10! So 2 × ${x} × 5 = ${x} × 10 = ${x * 10}.`, show: big(`2 × ${x} × 5 = ${x} × 10 = ${x * 10}`) },
        { say: 'Find the easy pair!', try: { q: `5 × ${x} × 2 = ?`, answer: x * 10, hint: '5 × 2 = 10 first.' } },
      ];
    },
    gen() {
      const a = rand(2, 5), b = rand(2, 6), c = pick([2, 5, rand(2, 4)]);
      return { type: 'guided', q: `${a} × ${b} × ${c} = ?`, hint: 'Multiply two numbers first.', parts: [{ say: `${a} × ${b} = ?`, answer: a * b }, { say: `${a * b} × ${c} = ?`, answer: a * b * c }] };
    },
    word() {
      const a = rand(2, 5), b = rand(2, 6), c = rand(2, 5);
      return story({ q: `A shop has <b>${a}</b> shelves. Each shelf has <b>${b}</b> boxes. Each box has <b>${c}</b> toy cars. How many toy cars?`, scene: '🚗', op: '×', why: 'Equal groups inside equal groups: multiply.', mid: [{ say: `How many boxes? ${a} × ${b} = ?`, answer: a * b }], ask: `Cars: ${a * b} × ${c} = ?`, answer: a * b * c, suffix: 'cars' });
    },
  };

  const mFactors = {
    id: 'factors-multiples', title: 'Multiples and factors', icon: '🔍', years: [5, 6],
    desc: 'Multiples are in the times table. Factors multiply to make a number.',
    lesson() {
      const t = pick([6, 7, 8, 9]), k = rand(4, 9);
      const isM = Math.random() < 0.5, test = isM ? t * k : t * k + rand(1, t - 1);
      const n = pick([12, 18, 20, 24, 30, 36]);
      const pairs = factorsOf(n).filter((f) => f * f <= n);
      const dv = pick(factorsOf(n).filter((f) => f > 1 && f < n));
      return [
        { say: `<b>Multiples</b> of ${t} are the answers in the ${t} times table: they go on forever!`, show: skipCount(t, 10) + '<p class="center">… and on and on …</p>' },
        { say: `Is ${test} a multiple of ${t}? Is it in the ${t} times table?`, try: YN(`Is <b>${test}</b> a multiple of ${t}?`, isM, { hint: `Count in ${t}s.` }) },
        { say: `<b>Factors</b> are numbers that multiply together to make a number. Let's make arrays with <b>${n}</b> dots. Each array shows a <b>factor pair</b>.`, show: pairs.filter((f) => f > 1).slice(0, 3).map((f) => V.array(f, n / f, { gap: 18 })).join('') },
        { say: `The factor pairs of ${n}: ${pairs.map((f) => `${f} × ${n / f}`).join(', ')}. So the factors are <b>${factorsOf(n).join(', ')}</b>. 💡 Work in pairs from 1 up so you don't miss any!`, try: { q: `${n} = ${dv} × ?`, answer: n / dv } },
        { say: 'Count them carefully.', try: { q: `How many factors does ${n} have?`, answer: factorsOf(n).length } },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.3) { const n = pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 48]); const f = pick(factorsOf(n).filter((x) => x > 1 && x < n)); return { q: `${n} = ${f} × ?`, answer: n / f, hint: `Which number times ${f} makes ${n}?`, steps: [`Factor pairs of ${n}: ${factorsOf(n).filter((x) => x * x <= n).map((x) => `${x} × ${n / x}`).join(', ')}`] }; }
      if (r < 0.55) {
        const n = pick([12, 18, 20, 24, 30, 36, 40]);
        const fs = factorsOf(n);
        const good = pick(fs.filter((x) => x > 1));
        const bads = shuffle([5, 7, 8, 9, 11, 14, 16].filter((x) => n % x)).slice(0, 2);
        return { q: `Which number is a <b>factor</b> of ${n}?`, type: 'choice', choices: shuffle([good, ...bads]).map((v) => ({ v: String(v), html: String(v) })), answer: String(good), hint: 'A factor divides exactly, with no remainder.', steps: [`Factors of ${n}: ${fs.join(', ')}`] };
      }
      if (r < 0.8) { const t = rand(3, 12), k = rand(3, 12); return { q: `What is the <b>${k}${k === 3 ? 'rd' : 'th'}</b> multiple of ${t}?`, answer: t * k, hint: `${k} × ${t}`, steps: [skipCount(t, k)] }; }
      const n = pick([10, 12, 15, 16, 18, 20, 24, 28, 30, 36]);
      return { q: `How many factors does <b>${n}</b> have?`, answer: factorsOf(n).length, hint: 'List the factor pairs from 1 upwards.', steps: [`${factorsOf(n).filter((x) => x * x <= n).map((x) => `${x} × ${n / x}`).join(', ')}`, `Factors: ${factorsOf(n).join(', ')} — that is <b>${factorsOf(n).length}</b>.`] };
    },
  };

  const mPrimes = {
    id: 'primes-squares', title: 'Prime, square and cube numbers', icon: '💎', years: [5, 6],
    desc: 'Primes have exactly two factors. Squares make square arrays.',
    lesson(y) {
      const p = pick([7, 11, 13]);
      const q = pick([15, 21, 9, 25]);
      const s = rand(4, 9), s2 = rand(6, 12);
      const frames = [
        { say: `A <b>prime number</b> has exactly <b>two factors</b>: 1 and itself. ${p} is prime — the only array you can make is one long line!`, show: V.array(1, p, { gap: 22 }) },
        { say: 'Numbers with more factors are called <b>composite</b>. They make other arrays too. (1 is special: it is not prime.)', show: V.array(3, 4), try: YN(`Is <b>${q}</b> a prime number?`, isPrime(q), { hint: 'Can you find a factor other than 1 and itself?' }) },
        { say: `<b>Square numbers</b> make a perfect square array! ${s} rows of ${s}. We write ${s} × ${s} as <b>${s}²</b> (“${s} squared”).`, show: V.array(s, s, { gap: 18 }), try: { q: `${s}² = ${s} × ${s} = ?`, answer: s * s } },
        { say: 'Another one, without the picture.', try: { q: `${s2}² = ?`, answer: s2 * s2 } },
      ];
      if (y === 6) frames.push({ say: 'A <b>cube number</b> is like a cube of blocks: 2³ = 2 × 2 × 2 = 8.', try: { q: '3³ = 3 × 3 × 3 = ?', answer: 27 } });
      return frames;
    },
    gen(y) {
      const r = Math.random();
      if (r < 0.35) {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
        const comp = [4, 6, 8, 9, 10, 12, 14, 15, 21, 25, 27, 33, 35, 39, 49, 51];
        const good = pick(primes), bads = shuffle(comp).slice(0, 3);
        return { q: 'Which number is <b>prime</b>?', type: 'choice', choices: shuffle([good, ...bads]).map((v) => ({ v: String(v), html: String(v) })), answer: String(good), hint: 'A prime has only two factors: 1 and itself.', steps: [`${good} has only the factors 1 and ${good}.`, ...bads.map((b) => `${b} = ${factorsOf(b)[1]} × ${b / factorsOf(b)[1]}`)] };
      }
      if (r < 0.7) { const s = rand(2, 12); return { q: `${s}² = ?`, answer: s * s, hint: `${s} × ${s}`, steps: [`${s}² = ${s} × ${s} = <b>${s * s}</b>`] }; }
      if (y === 6 && r < 0.85) { const c = rand(2, 5); return { q: `${c}³ = ?`, answer: c ** 3, hint: `${c} × ${c} × ${c}`, steps: [`${c} × ${c} = ${c * c}, × ${c} = <b>${c ** 3}</b>`] }; }
      const n = rand(10, 50);
      return YN(`Is <b>${n}</b> a prime number?`, isPrime(n), { hint: 'Look for a factor other than 1 and the number.', steps: [`Factors of ${n}: ${factorsOf(n).join(', ')}`] });
    },
  };

  function longNums(y) {
    for (;;) {
      const a = y === 5 ? (Math.random() < 0.6 ? rand(13, 99) : rand(112, 999)) : rand(1012, 4999);
      const b = rand(12, y === 5 ? 49 : 69);
      if (b % 10) return { a, b };
    }
  }
  function longGuided(a, b) {
    const t = Math.floor(b / 10), o = b % 10;
    return {
      type: 'guided', q: `${fmt(a)} × ${b} = ?`, hint: `Split ${b} into ${t * 10} and ${o}.`,
      parts: [
        { say: `Split ${b} into <b>${t * 10}</b> and <b>${o}</b>. First: ${fmt(a)} × ${o}`, type: 'column', a, b: o, op: '×' },
        { say: `Next: ${fmt(a)} × ${t * 10}. Work out ${fmt(a)} × ${t} first…`, type: 'column', a, b: t, op: '×' },
        { say: `…then make it 10 times bigger (put the <b>0</b> placeholder in the ones): ${fmt(a * t)} × 10 = ?`, answer: a * t * 10 },
        { say: `Add the two parts: ${fmt(a * o)} + ${fmt(a * t * 10)} = ?`, answer: a * b },
      ],
      steps: [V.areaModel(a, b), `${fmt(a)} × ${o} = ${fmt(a * o)}`, `${fmt(a)} × ${t * 10} = ${fmt(a * t * 10)}`, `${fmt(a * o)} + ${fmt(a * t * 10)} = <b>${fmt(a * b)}</b>`],
    };
  }
  const mLong = {
    id: 'long-multiplication', title: 'Long multiplication', icon: '📜', years: [5, 6],
    desc: 'Multiply by a 2-digit number: two short multiplications, then add.',
    lesson(y) {
      const { a, b } = longNums(y);
      const t = Math.floor(b / 10), o = b % 10;
      const n = longNums(y);
      return [
        { say: `${fmt(a)} × ${b}: the second number has <b>two digits</b>. Split it: ${b} = <b>${t * 10} + ${o}</b>. We multiply ${fmt(a)} by each part, then add. The grid shows why:`, show: V.areaModel(a, b) },
        { say: `<b>Line 1:</b> ${fmt(a)} × ${o} (the ones). Use short multiplication.`, try: { type: 'column', a, b: o, op: '×' } },
        { say: `<b>Line 2:</b> ${fmt(a)} × ${t * 10}. That is ${fmt(a)} × ${t}, made ten times bigger. First ${fmt(a)} × ${t}:`, try: { type: 'column', a, b: t, op: '×' } },
        { say: `Now × 10: write a <b>0</b> in the ones first (a placeholder), because we are multiplying by tens.`, try: { q: `${fmt(a * t)} × 10 = ?`, answer: a * t * 10 } },
        { say: '<b>Last step:</b> add line 1 and line 2.', try: { q: `${fmt(a * o)} + ${fmt(a * t * 10)} = ?`, answer: a * b } },
        { say: `So <b>${fmt(a)} × ${b} = ${fmt(a * b)}</b>. 🎉 Estimate to check: about ${fmt(Math.round(a / 10 ** (String(a).length - 1)) * 10 ** (String(a).length - 1))} × ${Math.round(b / 10) * 10} = ${fmt(Math.round(a / 10 ** (String(a).length - 1)) * 10 ** (String(a).length - 1) * Math.round(b / 10) * 10)}.` },
        { say: 'Your turn, all the steps!', try: longGuided(n.a, n.b) },
      ];
    },
    gen(y) { const { a, b } = longNums(y); return longGuided(a, b); },
    word(y) {
      const { a, b } = longNums(y);
      const g = longGuided(a, b);
      const [txt, unit, sc] = pick([[`A factory packs <b>${fmt(a)}</b> bottles every hour. How many bottles in <b>${b}</b> hours?`, 'bottles', '🍼'], [`A stadium has <b>${b}</b> rows with <b>${fmt(a)}</b> seats in each row. How many seats?`, 'seats', '🏟️']]);
      return story({ q: txt, scene: sc, op: '×', why: `${b} equal groups of ${fmt(a)}.`, mid: g.parts.slice(0, -1), ask: `Add the two lines. How many ${unit}?`, answer: a * b, suffix: unit, steps: g.steps });
    },
  };

  function bidmas() {
    const r = rand(0, 4);
    let e, parts, ans;
    if (r === 0) { const a = rand(2, 20), b = rand(2, 9), c = rand(2, 9); e = `${a} + ${b} × ${c}`; ans = a + b * c; parts = [{ say: `Multiply first: ${b} × ${c} = ?`, answer: b * c }, { say: `Then add: ${a} + ${b * c} = ?`, answer: ans }]; }
    else if (r === 1) { const a = rand(2, 9), b = rand(2, 9), c = rand(2, 9); e = `(${a} + ${b}) × ${c}`; ans = (a + b) * c; parts = [{ say: `Brackets first: ${a} + ${b} = ?`, answer: a + b }, { say: `Then multiply: ${a + b} × ${c} = ?`, answer: ans }]; }
    else if (r === 2) { const b = rand(2, 9), c = rand(2, 9), a = b * c + rand(1, 30); e = `${a} − ${b} × ${c}`; ans = a - b * c; parts = [{ say: `Multiply first: ${b} × ${c} = ?`, answer: b * c }, { say: `Then subtract: ${a} − ${b * c} = ?`, answer: ans }]; }
    else if (r === 3) { const c = rand(2, 9), q = rand(2, 9), a = rand(2, 30); e = `${a} + ${c * q} ÷ ${c}`; ans = a + q; parts = [{ say: `Divide first: ${c * q} ÷ ${c} = ?`, answer: q }, { say: `Then add: ${a} + ${q} = ?`, answer: ans }]; }
    else { const a = rand(2, 9), b = rand(2, 9), c = rand(2, 9), d = rand(2, 9); e = `${a} × ${b} + ${c} × ${d}`; ans = a * b + c * d; parts = [{ say: `${a} × ${b} = ?`, answer: a * b }, { say: `${c} × ${d} = ?`, answer: c * d }, { say: `Add: ${a * b} + ${c * d} = ?`, answer: ans }]; }
    return { e, ans, parts };
  }
  const mBidmas = {
    id: 'order-of-operations', title: 'Order of operations (BIDMAS)', icon: '🚦', years: [6, 6],
    desc: 'Brackets, Indices, Division and Multiplication, Addition and Subtraction.',
    lesson() {
      const a = rand(2, 9), b = rand(2, 9), c = rand(2, 9);
      const x = rand(2, 9), y2 = rand(2, 9), z = rand(2, 9);
      return [
        { say: `What is <b>2 + 3 × 4</b>? Some people say 20, some say 14. Maths needs one rule so everyone gets the same answer!`, show: big('2 + 3 × 4 = ?') },
        { say: 'The rule is <b>BIDMAS</b>: <b>B</b>rackets first, then <b>I</b>ndices (powers like 3²), then <b>D</b>ivide and <b>M</b>ultiply, and last <b>A</b>dd and <b>S</b>ubtract.', show: V.chips(['B ( )', 'I ²', 'D ÷  M ×', 'A +  S −'], [0]) },
        { say: 'So in 2 + 3 × 4 we multiply first: 3 × 4 = 12, then 2 + 12 = <b>14</b>. Now you try.', try: { type: 'guided', q: `${a} + ${b} × ${c} = ?`, parts: [{ say: `Multiply first: ${b} × ${c} = ?`, answer: b * c }, { say: `Then add: ${a} + ${b * c} = ?`, answer: a + b * c }] } },
        { say: '<b>Brackets</b> change the order: do what is inside them first.', try: { q: `(${x} + ${y2}) × ${z} = ?`, answer: (x + y2) * z, hint: `${x} + ${y2} first.` } },
        { say: 'Which do you do first?', try: { q: `In <b>20 − 12 ÷ 4</b>, which do you do first?`, type: 'choice', choices: [{ v: '−', html: 'The −' }, { v: '÷', html: 'The ÷' }], answer: '÷' } },
      ];
    },
    gen() {
      const { e, ans, parts } = bidmas();
      if (Math.random() < 0.5) return { type: 'guided', q: `${e} = ?`, hint: 'Brackets, then × and ÷, then + and −.', parts };
      return { q: `${e} = ?`, answer: ans, hint: 'Brackets, then × and ÷, then + and −.', steps: parts.map((p) => `${p.say.replace('?', '')} <b>${p.answer}</b>`) };
    },
  };

  const mCommon = {
    id: 'common-factors-multiples', title: 'Common factors and multiples', icon: '🤝', years: [6, 6],
    desc: 'Numbers that belong to both lists.',
    lesson() {
      const [a, b] = pick([[12, 18], [16, 24], [18, 24], [20, 30], [15, 25]]);
      const [m, n] = pick([[4, 6], [3, 5], [6, 8], [4, 10]]);
      const fa = factorsOf(a), fb = factorsOf(b);
      const ma = Array.from({ length: 8 }, (_, i) => m * (i + 1)), mb = Array.from({ length: 8 }, (_, i) => n * (i + 1));
      return [
        { say: `<b>Common factors</b> are factors of <b>both</b> numbers. Factors of ${a} and ${b}: the yellow ones are in both lists.`, show: `<p class="center"><b>${a}:</b></p>${V.chips(fa.map(String), fa.map((f, i) => (b % f === 0 ? i : -1)))}<p class="center"><b>${b}:</b></p>${V.chips(fb.map(String), fb.map((f, i) => (a % f === 0 ? i : -1)))}` },
        { say: 'The biggest one is the <b>highest common factor</b> (HCF).', try: { q: `HCF of ${a} and ${b} = ?`, answer: U.gcd(a, b) } },
        { say: `<b>Common multiples</b> are in <b>both</b> times tables. Look for numbers in both lists.`, show: `<p class="center"><b>${m}s:</b></p>${V.chips(ma.map(String), ma.map((x, i) => (x % n === 0 ? i : -1)))}<p class="center"><b>${n}s:</b></p>${V.chips(mb.map(String), mb.map((x, i) => (x % m === 0 ? i : -1)))}` },
        { say: 'The smallest one is the <b>lowest common multiple</b> (LCM).', try: { q: `LCM of ${m} and ${n} = ?`, answer: U.lcm(m, n) } },
        { say: `Real life! One bus comes every ${m} minutes, another every ${n} minutes. They leave together now. When are they together again? That's the LCM!`, try: { q: 'After how many minutes?', answer: U.lcm(m, n), suffix: 'min' } },
      ];
    },
    gen() {
      if (Math.random() < 0.5) {
        const [a, b] = pick([[12, 18], [16, 24], [18, 27], [20, 30], [15, 25], [24, 36], [14, 21], [30, 45]]);
        return { q: `What is the <b>highest common factor</b> of ${a} and ${b}?`, answer: U.gcd(a, b), hint: 'List the factors of both. Find the biggest in both lists.', steps: [`${a}: ${factorsOf(a).join(', ')}`, `${b}: ${factorsOf(b).join(', ')}`, `HCF = <b>${U.gcd(a, b)}</b>`] };
      }
      const [m, n] = pick([[4, 6], [3, 5], [6, 8], [4, 10], [6, 9], [5, 8], [3, 7]]);
      return { q: `What is the <b>lowest common multiple</b> of ${m} and ${n}?`, answer: U.lcm(m, n), hint: 'Count in both numbers until you find one in both lists.', steps: [skipCount(m, U.lcm(m, n) / m), skipCount(n, U.lcm(m, n) / n), `LCM = <b>${U.lcm(m, n)}</b>`] };
    },
    word() {
      if (Math.random() < 0.5) {
        const [m, n] = pick([[6, 8], [4, 6], [10, 12], [6, 10]]);
        return story({ q: `Hot dogs come in packs of <b>${m}</b> and buns in packs of <b>${n}</b>. What is the smallest number of hot dogs you can buy to have exactly the same number of buns?`, scene: '🌭', op: '×', why: 'We need a number in both times tables: a common multiple.', ask: 'Lowest common multiple = ?', answer: U.lcm(m, n), suffix: 'hot dogs' });
      }
      const [a, b] = pick([[12, 18], [20, 30], [24, 36]]);
      return story({ q: `${U.name()} has <b>${a}</b> red flowers and <b>${b}</b> yellow flowers. They want to make bunches that are all the same, with no flowers left over. What is the greatest number of bunches?`, scene: '💐', op: '÷', why: 'The number of bunches must divide both numbers: a common factor.', ask: 'Highest common factor = ?', answer: U.gcd(a, b), suffix: 'bunches' });
    },
  };

  /* =====================================================================
   * DIVISION SKILLS
   * ===================================================================== */
  const dShare = {
    id: 'sharing', title: 'Sharing equally', icon: '🍪', years: [1, 2],
    desc: 'Share things fairly so everyone gets the same.',
    lesson(y) {
      const k = rand(2, 3), q = rand(2, y === 1 ? 4 : 5), e = pick(EMO);
      const k2 = rand(2, y === 1 ? 3 : 4), q2 = rand(2, 5);
      return [
        { say: `Sharing <b>equally</b> means everyone gets the <b>same amount</b>. That's fair! 😊 Here are ${k * q} ${e} for ${k} friends.`, show: V.objects(k * q, e) },
        { say: 'Deal them out one at a time, like cards: one for you, one for you, one for you… then start again.', show: V.groups(k * q, k, e) },
        { say: `Your turn! Tap <b>“Deal one to every plate”</b> or tap a plate to share ${k * q} ${e} between ${k} plates.`, try: { type: 'share', total: k * q, groups: k, emoji: e, answer: q } },
        { say: `We write this as <b>${k * q} ÷ ${k} = ${q}</b>. The sign ÷ means “shared equally between”.`, show: big(`${k * q} ÷ ${k} = ${q}`) },
        { say: 'One more time!', try: { type: 'share', total: k2 * q2, groups: k2, emoji: '🍓', answer: q2 } },
      ];
    },
    gen(y) {
      const k = rand(2, y === 1 ? 3 : 5), q = rand(1, y === 1 ? 5 : 6);
      if (y === 2 && Math.random() < 0.4) return { q: `${k * q} ÷ ${k} = ?`, visual: V.objects(k * q, '🍪', { perRow: 10 }), answer: q, hint: `Share ${k * q} between ${k}.`, steps: [V.groups(k * q, k, '🍪'), `Each gets <b>${q}</b>.`] };
      return { type: 'share', q: `Share <b>${k * q}</b> equally between <b>${k}</b> plates.`, total: k * q, groups: k, emoji: pick(EMO), answer: q, hint: 'Give one to each plate, again and again.' };
    },
    word(y) {
      const k = rand(2, y === 1 ? 3 : 5), q = rand(2, 5), [a] = U.twoNames();
      return story({ q: `${a} has <b>${k * q}</b> sweets to share equally between <b>${k}</b> friends. How many sweets does each friend get?`, scene: '🍬', op: '÷', why: '“Share equally” means divide.', calc: `${k * q} ÷ ${k}`, answer: q, suffix: 'sweets', steps: [V.groups(k * q, k, '🍬')] });
    },
  };

  const dGroup = {
    id: 'grouping', title: 'Grouping', icon: '🥚', years: [1, 2],
    desc: 'How many groups of the same size can we make?',
    lesson(y) {
      const s = pick(y === 1 ? [2, 5] : [2, 3, 5]), g = rand(2, 4);
      const s2 = pick([2, 5, 10]), g2 = rand(2, 4);
      return [
        { say: `Another way to divide: put things into <b>groups of the same size</b>, then count the groups. Let's put ${s * g} eggs into boxes of ${s}.`, show: V.objects(s * g, '🥚') },
        { say: `Fill one box of ${s}, then another, until the eggs are all gone.`, show: packs(g, s, 0, '🥚') },
        { say: `Your turn! Tap <b>“Fill a bag of ${s2}”</b> until you can't any more. Then count the bags.`, try: { type: 'share', mode: 'group', total: s2 * g2, size: s2, emoji: '🍎', answer: g2 } },
        { say: `On a number line we can <b>jump back</b> in ${s}s to 0. Count the jumps!`, show: backLine(s * g, s), try: { q: `How many jumps of ${s}?`, answer: g } },
        { say: `So ${s * g} ÷ ${s} = <b>${g}</b>. There are ${g} groups of ${s}.`, show: big(`${s * g} ÷ ${s} = ${g}`) },
      ];
    },
    gen(y) {
      const s = pick(y === 1 ? [2, 5, 10] : [2, 3, 5, 10]), g = rand(2, y === 1 ? 4 : 6);
      if (Math.random() < 0.5) return { type: 'share', mode: 'group', q: `Put <b>${s * g}</b> into bags of <b>${s}</b>. How many bags?`, total: s * g, size: s, emoji: pick(EMO), answer: g, hint: `Fill bags of ${s} until there are none left.` };
      return { q: `How many groups of ${s} make ${s * g}?`, visual: backLine(s * g, s).replace(/<path[^>]*class="nl-jump"[^>]*\/>|<text[^>]*class="nl-jlab"[^>]*>[^<]*<\/text>/g, ''), answer: g, hint: `Jump back in ${s}s to 0.`, steps: [backLine(s * g, s), `${g} jumps, so ${s * g} ÷ ${s} = <b>${g}</b>`] };
    },
    word(y) {
      const s = pick([2, 5, 10]), g = rand(2, y === 1 ? 4 : 8);
      return story({ q: `A teacher puts <b>${s * g}</b> children into teams of <b>${s}</b>. How many teams are there?`, scene: '👫', op: '÷', why: 'Making groups of the same size is division.', calc: `${s * g} ÷ ${s}`, answer: g, suffix: 'teams' });
    },
  };

  const dHalf = {
    id: 'halving', title: 'Halving: share between 2', icon: '✂️', years: [1, 1],
    desc: 'Half means sharing into 2 equal groups.',
    lesson() {
      const n = 2 * rand(2, 5), m = 2 * rand(3, 8);
      return [
        { say: `<b>Halving</b> means sharing into <b>2 equal groups</b>. It is the opposite of doubling!`, show: V.groups(n, 2, '🍓') },
        { say: `Share ${n} strawberries between 2 plates.`, try: { type: 'share', total: n, groups: 2, emoji: '🍓', answer: n / 2 } },
        { say: `Half of ${n} is <b>${n / 2}</b>, because double ${n / 2} is ${n}. ✔️`, show: big(`${n / 2} + ${n / 2} = ${n}`) },
        { say: 'Use doubles to help you halve.', try: { q: `Half of ${m} = ?`, answer: m / 2, hint: `What doubled makes ${m}?` } },
      ];
    },
    gen() {
      const n = 2 * rand(1, 10);
      if (Math.random() < 0.5) return { type: 'share', q: `Find half of <b>${n}</b>.`, total: n, groups: 2, emoji: pick(EMO), answer: n / 2, ask: 'How many on each plate?' };
      return { q: `Half of ${n} = ?`, visual: V.objects(n, '🍎'), answer: n / 2, hint: 'Share into 2 equal groups.', steps: [V.groups(n, 2, '🍎'), `Half of ${n} is <b>${n / 2}</b>.`] };
    },
  };

  const d2510 = {
    id: 'divide-2-5-10', title: 'Divide by 2, 5 and 10', icon: '🔟', years: [2, 3],
    desc: 'Ask: how many 5s make 20?',
    lesson() {
      const q = rand(3, 8), q2 = rand(3, 9), q3 = rand(3, 10);
      return [
        { say: `To work out <b>${5 * q} ÷ 5</b>, ask yourself: <b>how many 5s make ${5 * q}?</b> Count in 5s and count the jumps.`, show: skipLine(5, q), try: { q: `${5 * q} ÷ 5 = ?`, answer: q, hint: 'Count the jumps.' } },
        { say: `Dividing by 10: count in 10s, or think of the times table backwards. ${q2 * 10} ÷ 10 = ${q2}, because ${q2} × 10 = ${q2 * 10}.`, try: { q: `${q2 * 10} ÷ 10 = ?`, answer: q2 } },
        { say: 'Dividing by 2 is the same as <b>halving</b>.', try: { q: `${q3 * 2} ÷ 2 = ?`, answer: q3, hint: `Half of ${q3 * 2}.` } },
        { say: '💡 Use your times tables backwards — they are your best friend for dividing!' },
      ];
    },
    gen() {
      const d = pick([2, 5, 10]), q = rand(1, 12);
      return { q: `${d * q} ÷ ${d} = ?`, answer: q, hint: `How many ${d}s make ${d * q}?`, steps: [skipCount(d, q), `${q} × ${d} = ${d * q}, so ${d * q} ÷ ${d} = <b>${q}</b>`] };
    },
    word() {
      const d = pick([2, 5, 10]), q = rand(2, 12);
      return story({ q: `${d * q} pencils are packed into boxes of <b>${d}</b>. How many boxes are filled?`, scene: '✏️', op: '÷', why: 'Groups of the same size: divide.', calc: `${d * q} ÷ ${d}`, answer: q, suffix: 'boxes' });
    },
  };

  const dInverse = {
    id: 'fact-families', title: 'Fact families (× and ÷ are a team)', icon: '👨‍👩‍👧‍👦', years: [2, 4],
    desc: 'Division undoes multiplication.',
    lesson(y) {
      const a = rand(2, y === 2 ? 5 : 9), b = rand(2, y === 2 ? 10 : 12);
      return [
        { say: `× and ÷ are a team: they <b>undo</b> each other! This array is ${a} × ${b} = ${a * b}. Read it the other way: ${a * b} shared into ${a} rows gives ${b} in each row.`, show: V.array(a, b, { gap: 22 }) },
        { say: 'One array gives us <b>four facts</b>. We call them a <b>fact family</b>.', show: factFamily(a, b) },
        { say: 'Use the family!', try: { q: `${a} × ${b} = ${a * b}. So ${a * b} ÷ ${b} = ?`, answer: a } },
        { say: 'And the other division fact.', try: { q: `${a * b} ÷ ${a} = ?`, answer: b } },
        { say: 'Missing numbers are easy with fact families.', try: { q: `? × ${b} = ${a * b}`, answer: a } },
      ];
    },
    gen(y) {
      const a = rand(2, y === 2 ? 5 : 12), b = rand(2, y === 2 ? 10 : 12);
      const r = Math.random();
      if (r < 0.35) return { q: `${a} × ${b} = ${a * b}. What is ${a * b} ÷ ${a}?`, answer: b, hint: 'Use the multiplication fact backwards.', steps: [factFamily(a, b)] };
      if (r < 0.7) return { q: `${a * b} ÷ ? = ${a}`, answer: b, hint: `${a} × ? = ${a * b}`, steps: [factFamily(a, b)] };
      return { q: `Which fact is <b>not</b> in the family of ${a}, ${b} and ${a * b}?`, type: 'choice', choices: shuffle([{ v: 'ok1', html: `${a * b} ÷ ${a} = ${b}` }, { v: 'ok2', html: `${b} × ${a} = ${a * b}` }, { v: 'bad', html: `${a} ÷ ${b} = ${a * b}` }]), answer: 'bad', hint: 'The biggest number is divided, never the small ones.', steps: [factFamily(a, b)] };
    },
  };

  const d348 = {
    id: 'divide-3-4-8', title: 'Divide by 3, 4 and 8', icon: '🕷️', years: [3, 3],
    desc: 'Use the 3, 4 and 8 times tables backwards, or halve.',
    lesson() {
      const q = rand(3, 9), q2 = rand(3, 9), q3 = rand(3, 9);
      return [
        { say: `To work out <b>${8 * q} ÷ 8</b>, use the 8 times table backwards: which number × 8 = ${8 * q}?`, show: V.chips(Array.from({ length: 10 }, (_, i) => `${i + 1} × 8 = ${8 * (i + 1)}`), [q - 1]), try: { q: `${8 * q} ÷ 8 = ?`, answer: q } },
        { say: `💡 Halving trick: <b>÷ 4 = halve, then halve again</b>. Why? Sharing between 4 is like sharing between 2, then 2 again.`, try: { type: 'guided', q: `${4 * q2} ÷ 4`, parts: [{ say: `Half of ${4 * q2} = ?`, answer: 2 * q2 }, { say: `Half of ${2 * q2} = ?`, answer: q2 }] } },
        { say: '÷ 8 = halve three times! ÷ 3: count in 3s.', show: skipLine(3, q3), try: { q: `${3 * q3} ÷ 3 = ?`, answer: q3 } },
      ];
    },
    gen() {
      const d = pick([3, 4, 8]), q = rand(1, 12);
      if (d !== 3 && Math.random() < 0.35) {
        const halves = d === 4 ? 2 : 3;
        const parts = [];
        let v = d * q;
        for (let k = 0; k < halves; k++) { parts.push({ say: `Half of ${v} = ?`, answer: v / 2 }); v /= 2; }
        return { type: 'guided', q: `${d * q} ÷ ${d} = ?`, hint: `Halve ${halves} times.`, parts };
      }
      return { q: `${d * q} ÷ ${d} = ?`, answer: q, hint: `Which number × ${d} = ${d * q}?`, steps: [skipCount(d, q), `${q} × ${d} = ${d * q}`] };
    },
    word() {
      const d = pick([3, 4, 8]), q = rand(2, 12);
      return story({ q: `<b>${d * q}</b> children sit at tables of <b>${d}</b>. How many tables are needed?`, scene: '🪑', op: '÷', why: 'Equal groups of ' + d + ': divide.', calc: `${d * q} ÷ ${d}`, answer: q, suffix: 'tables' });
    },
  };

  const dRem = {
    id: 'remainders', title: 'Remainders', icon: '🧩', years: [3, 4],
    desc: 'What is left over when things don\'t share out exactly.',
    lesson(y) {
      const k = rand(3, 4), q = rand(2, 4), r = rand(1, k - 1), n = k * q + r;
      const k2 = rand(3, 5), q2 = rand(2, 4), r2 = rand(1, k2 - 1);
      const d3 = rand(3, y === 3 ? 5 : 9), q3 = rand(3, 9), r3 = rand(1, d3 - 1);
      return [
        { say: `Share <b>${n}</b> cookies between <b>${k}</b> plates. Uh-oh, they don't share out exactly!`, show: V.groups(n, k, '🍪') },
        { say: `Each plate gets ${q}, and <b>${r}</b> ${r === 1 ? 'is' : 'are'} left over. We can't share ${r} between ${k} without cutting! The left over part is called the <b>remainder</b>.`, show: big(`${n} ÷ ${k} = ${q} r ${r}`) },
        { say: 'Your turn. Share them out, then say how many on each plate.', try: { type: 'share', total: k2 * q2 + r2, groups: k2, emoji: '⭐', answer: q2 } },
        { say: `💡 The remainder is always <b>smaller</b> than the number you divide by. If it was bigger, you could give everyone one more!`, try: { q: `What is the remainder when ${d3 * q3 + r3} is divided by ${d3}?`, answer: r3, hint: `${q3} × ${d3} = ${d3 * q3}. How many more to ${d3 * q3 + r3}?` } },
      ];
    },
    gen(y) {
      const d = rand(2, y === 3 ? 5 : 9), q = rand(2, y === 3 ? 6 : 12), r = rand(1, d - 1), n = d * q + r;
      const x = Math.random();
      if (x < 0.3 && n <= 30) return { type: 'share', q: `Share <b>${n}</b> between <b>${d}</b> plates.`, total: n, groups: d, emoji: pick(EMO), answer: q, ask: 'How many on each plate?' };
      if (x < 0.65) return { q: `${n} ÷ ${d} = ? remainder ?<br><span class="muted">What is the <b>remainder</b>?</span>`, answer: r, hint: `Find the biggest multiple of ${d} below ${n}.`, steps: [`${q} × ${d} = ${q * d}`, `${n} − ${q * d} = <b>${r}</b>`] };
      const wrong1 = `${q} r ${r + d}`, wrong2 = `${q + 1} r ${r}`;
      return { q: `${n} ÷ ${d} = ?`, type: 'choice', choices: shuffle([{ v: 'ok', html: `${q} r ${r}` }, { v: 'w1', html: r + d < 2 * d && q > 0 ? `${q - 1} r ${r + d}` : wrong1 }, { v: 'w2', html: wrong2 }]), answer: 'ok', hint: 'The remainder must be smaller than ' + d + '.', steps: [`${q} × ${d} = ${q * d}, and ${n} − ${q * d} = ${r}`] };
    },
  };

  function busNums(y, exact) {
    for (;;) {
      const d = rand(3, 9);
      const n = y === 4 ? rand(Math.max(d * 10, 42), 999) : y === 5 ? rand(312, 9999) : rand(1012, 9999);
      const r = n % d;
      if (exact && r) continue;
      if (!exact && y === 4 && r && Math.random() < 0.6) continue;
      return { n, d };
    }
  }
  const dShort = {
    id: 'short-division', title: 'Short division (bus stop)', icon: '🚏', years: [4, 6],
    desc: 'Divide digit by digit from the left. Remainders are exchanged.',
    lesson(y) {
      let n, d, ds, q1, r1;
      for (;;) { ({ n, d } = busNums(y, true)); ds = String(n).split('').map(Number); q1 = Math.floor(ds[0] / d); r1 = ds[0] % d; if (q1 > 0 && r1 > 0) break; }
      const cur2 = r1 * 10 + ds[1];
      const place = ['', '', 'tens', 'hundreds', 'thousands'][ds.length] || 'hundreds';
      const next = ['', '', 'ones', 'tens', 'hundreds'][ds.length] || 'tens';
      const nn = busNums(y, y === 4);
      return [
        { say: `Short division is called the <b>bus stop</b> method 🚏. ${fmt(n)} goes under the shelter, and ${d} waits outside.`, show: busHTML(n, d) },
        { say: `We work from the <b>left</b>, the biggest place first. How many ${d}s go into ${ds[0]} (${ds[0]} ${place})?`, show: busHTML(n, d) + V.chips(Array.from({ length: 10 }, (_, k) => `${k} × ${d} = ${k * d}`)), try: { q: `How many ${d}s in ${ds[0]}?`, answer: q1 } },
        { say: `${q1} × ${d} = ${q1 * d}, so <b>${r1}</b> ${place} ${r1 === 1 ? 'is' : 'are'} left over. We <b>exchange</b> them: ${r1} ${place} = ${r1 * 10} ${next}. We write a small ${r1} next to the ${ds[1]}, making <b>${cur2}</b>.`, show: big(`<sup style="color:#e11d48">${r1}</sup>${ds[1]} → ${cur2}`) },
        { say: `Now how many ${d}s go into ${cur2}?`, try: { q: `How many ${d}s in ${cur2}?`, answer: Math.floor(cur2 / d) } },
        { say: 'Keep going like this to the last digit. Any amount left at the very end is the <b>remainder</b>. Now do a whole one with the helper!', try: { type: 'busstop', n: nn.n, d: nn.d } },
      ];
    },
    gen(y) { const { n, d } = busNums(y, false); return { type: 'busstop', q: `Work out ${fmt(n)} ÷ ${d}`, n, d, hint: 'Work from the left. Carry each remainder to the next digit.', steps: [`${fmt(n)} ÷ ${d} = <b>${fmt(Math.floor(n / d))}${n % d ? ` r ${n % d}` : ''}</b>`] }; },
    word(y) {
      const { n, d } = busNums(y, true);
      return story({ q: `<b>${fmt(n)}</b> stickers are shared equally between <b>${d}</b> albums. How many stickers go in each album?`, scene: '📒', op: '÷', why: 'Shared equally: divide.', mid: [{ say: `Work out ${fmt(n)} ÷ ${d}:`, type: 'busstop', n, d }], ask: 'How many in each album?', answer: n / d, suffix: 'stickers' });
    },
  };

  const d10 = {
    id: 'divide-10-100', title: 'Divide by 10, 100 and 1,000', icon: '🎯', years: [4, 5],
    desc: 'Digits move to the right.',
    lesson(y) {
      const n = rand(2, 9) * 10 + rand(1, 9) * 100, m = rand(2, 9) * 100 + rand(1, 9) * 1000;
      const cols = ['th', 'h', 't', 'o'];
      const frames = [
        { say: 'Dividing by 10 is the opposite of × 10: every digit moves <b>one place to the RIGHT</b>. The number becomes ten times smaller.', show: V.pvTable(n, cols) + '<div class="op">÷ 10 ➡️</div>' + V.pvTable(n / 10, cols), try: { q: `${fmt(n)} ÷ 10 = ?`, answer: n / 10 } },
        { say: '÷ 100 moves every digit <b>two places</b> right.', show: V.pvTable(m, cols) + '<div class="op">÷ 100 ➡️➡️</div>' + V.pvTable(m / 100, cols), try: { q: `${fmt(m)} ÷ 100 = ?`, answer: m / 100 } },
      ];
      if (y >= 5) {
        const x = rand(12, 999);
        frames.push({ say: `When a digit moves past the ones, it goes after the <b>decimal point</b>: ${x} ÷ 10 = ${fmt(x / 10)}.`, try: { q: `${x} ÷ 100 = ?`, answer: x / 100, decimals: true } });
      }
      const k = rand(2, 9) * 10;
      frames.push({ say: 'Missing number: how many places did the digits move to the right?', try: { q: `${fmt(k * 10)} ÷ ? = ${k / 10}`, answer: 100, hint: 'Count the places the digits moved.' } });
      return frames;
    },
    gen(y) {
      const by = pick(y === 4 ? [10, 100] : [10, 100, 1000]);
      if (y === 4) { const n = rand(2, 99) * by; return { q: `${fmt(n)} ÷ ${by} = ?`, answer: n / by, hint: `Every digit moves ${String(by).length - 1} place(s) right.`, steps: [`${fmt(n)} ÷ ${by} = <b>${fmt(n / by)}</b>`] }; }
      const n = rand(3, 9999);
      return { q: `${fmt(n)} ÷ ${fmt(by)} = ?`, answer: n / by, decimals: true, hint: `Every digit moves ${String(by).length - 1} place(s) right.`, steps: [`${fmt(n)} ÷ ${fmt(by)} = <b>${fmt(n / by)}</b>`] };
    },
  };

  function realRem(y) {
    const d = pick([4, 5, 6, 8]), q = rand(3, y === 4 ? 9 : 25), r = rand(1, d - 1), n = d * q + r;
    const up = Math.random() < 0.5;
    const [txt, unit, sc] = up
      ? pick([[`<b>${n}</b> children go on a trip. Each minibus holds <b>${d}</b>. How many minibuses are needed?`, 'minibuses', '🚌'], [`<b>${n}</b> people need tents. Each tent sleeps <b>${d}</b>. How many tents are needed?`, 'tents', '⛺']])
      : pick([[`A farmer has <b>${n}</b> eggs. Boxes hold <b>${d}</b>. How many boxes can be <b>completely filled</b>?`, 'boxes', '🥚'], [`Tickets cost ${U.settings.currency}${d}. ${U.name()} has ${U.settings.currency}${n}. How many tickets can they buy?`, 'tickets', '🎟️']]);
    return { d, q, r, n, up, txt, unit, sc, ans: up ? q + 1 : q };
  }
  const dReal = {
    id: 'remainders-real-life', title: 'Remainders in real life', icon: '🚌', years: [4, 6],
    desc: 'Should we round up or round down?',
    lesson() {
      const n = 26, d = 4;
      const ex = realRem(5);
      return [
        { say: `<b>${n}</b> children go on a trip. Each car holds <b>${d}</b> children. How many cars do we need?`, show: '<div class="demo-row" style="font-size:36px">🧒🧒🧒🧒 🚗</div>', try: { q: `${n} ÷ ${d} = ? <span class="muted">(ignore the remainder)</span>`, answer: 6 } },
        { say: '6 cars hold 24 children. How many children are left?', try: { q: `${n} − 24 = ?`, answer: 2 } },
        { say: '26 ÷ 4 = 6 r 2. But 2 children can\'t stay at home! We need <b>one more car</b>: 7 cars. We <b>round UP</b>.', show: packs(6, 4, 2, '🧒') },
        { say: '26 eggs go in boxes of 4. Only <b>full</b> boxes can be sold: 6 boxes. The 2 extra eggs don\'t fill a box. We <b>round DOWN</b>.', show: packs(6, 4, 2, '🥚') },
        { say: 'Always ask: <b>what makes sense in real life?</b>', try: { q: ex.txt, type: 'choice', choices: [{ v: 'up', html: 'Round up ⬆️' }, { v: 'down', html: 'Round down ⬇️' }], answer: ex.up ? 'up' : 'down', hint: 'Does the remainder still need something, or is it just left over?' } },
      ];
    },
    gen(y) {
      const e = realRem(y);
      return {
        type: 'guided', story: true, scene: e.sc, q: e.txt, hint: 'Divide, then decide: round up or down?',
        parts: [
          { say: `${e.n} ÷ ${e.d} = ? <span class="muted">(whole groups)</span>`, answer: e.q },
          { say: 'What is the remainder?', answer: e.r },
          { say: 'Round up or round down?', type: 'choice', choices: [{ v: 'up', html: 'Round up ⬆️' }, { v: 'down', html: 'Round down ⬇️' }], answer: e.up ? 'up' : 'down', after: e.up ? 'The extra ones still need one more.' : 'The extra ones are not enough for another whole one.' },
          { say: 'So what is the answer?', answer: e.ans, suffix: e.unit },
        ],
      };
    },
    word(y) { return dReal.gen(y); },
  };

  const DIVRULES = {
    2: 'the last digit is even (0, 2, 4, 6, 8)',
    3: 'the digits add up to a multiple of 3',
    4: 'the last two digits make a multiple of 4',
    5: 'the last digit is 0 or 5',
    9: 'the digits add up to a multiple of 9',
    10: 'the last digit is 0',
  };
  const digitSum = (n) => String(n).split('').reduce((s, c) => s + +c, 0);
  const dDiv = {
    id: 'divisibility', title: 'Divisibility rules', icon: '🕵️', years: [5, 6],
    desc: 'Quick tests to see if a number divides exactly.',
    lesson() {
      const a = rand(100, 999), b = 3 * rand(40, 300), c = rand(100, 999);
      return [
        { say: '<b>Divisible</b> means it divides exactly, with no remainder. Detectives have quick tests! 🕵️', show: `<ul class="tips">${Object.entries(DIVRULES).map(([k, t]) => `<li><span class="tag">÷${k}</span> ${t}</li>`).join('')}</ul>` },
        { say: `Test for 2 and 5: just look at the <b>last digit</b>. Why? Every ten is already divisible by 2 and 5, so only the ones matter.`, try: YN(`Is <b>${a}</b> divisible by 5?`, a % 5 === 0) },
        { say: `Test for 3: add the digits. ${b}: ${String(b).split('').join(' + ')} = ${digitSum(b)}.`, try: YN(`Is ${digitSum(b)} a multiple of 3? So is ${b} divisible by 3?`, true) },
        { say: 'One more!', try: YN(`Is <b>${c}</b> divisible by 3?`, c % 3 === 0, { hint: `${String(c).split('').join(' + ')} = ${digitSum(c)}` }) },
      ];
    },
    gen() {
      const d = pick([2, 3, 4, 5, 9, 10]);
      if (Math.random() < 0.6) {
        const n = Math.random() < 0.5 ? d * rand(12, 999) : rand(100, 9999);
        return YN(`Is <b>${fmt(n)}</b> divisible by ${d}?`, n % d === 0, { hint: `Divisible by ${d} if ${DIVRULES[d]}.`, steps: [`Rule: ${DIVRULES[d]}.`, d === 3 || d === 9 ? `${String(n).split('').join(' + ')} = ${digitSum(n)}` : `Look at the end: ${String(n).slice(-2)}.`, n % d === 0 ? 'Yes, it is divisible.' : 'No, it is not divisible.'] });
      }
      const good = d * rand(12, 300);
      const bads = new Set();
      while (bads.size < 3) { const x = rand(100, 2999); if (x % d) bads.add(x); }
      return { q: `Which number is divisible by <b>${d}</b>?`, type: 'choice', choices: shuffle([good, ...bads]).map((v) => ({ v: String(v), html: fmt(v) })), answer: String(good), hint: `Divisible by ${d} if ${DIVRULES[d]}.`, steps: [`${fmt(good)} ÷ ${d} = ${fmt(good / d)}`] };
    },
  };

  function chunks(n, d) {
    let rem = n;
    const out = [];
    while (rem >= d) {
      let p = 1;
      while (d * p * 10 <= rem) p *= 10;
      const m = Math.floor(rem / (d * p));
      out.push({ k: m * p, take: d * p * m, before: rem, after: rem - d * p * m });
      rem -= d * p * m;
    }
    return { list: out, r: rem };
  }
  function longDivGuided(n, d) {
    const c = chunks(n, d);
    return {
      type: 'guided', q: `${fmt(n)} ÷ ${d} = ?`, hint: `Take away big chunks of ${d}: 10 × ${d}, 20 × ${d}…`,
      parts: [
        { say: `Useful multiple: 10 × ${d} = ?`, answer: 10 * d, after: `Now take away chunks of ${d}.` },
        ...c.list.map((ch) => ({ say: `Take away ${fmt(ch.k)} × ${d} = ${fmt(ch.take)}. ${fmt(ch.before)} − ${fmt(ch.take)} = ?`, answer: ch.after })),
        { say: `Add up the chunks: ${c.list.map((ch) => fmt(ch.k)).join(' + ')} = ?`, answer: Math.floor(n / d) },
      ],
      steps: [`<div class="chunks">${c.list.map((ch) => `<div>${fmt(ch.before)} − ${fmt(ch.take)} = ${fmt(ch.after)} <span class="muted">(${fmt(ch.k)} × ${d})</span></div>`).join('')}</div>`, `${fmt(n)} ÷ ${d} = <b>${fmt(Math.floor(n / d))}</b>${c.r ? ` r ${c.r}` : ''}`],
    };
  }
  const dLong = {
    id: 'long-division', title: 'Long division (chunking)', icon: '🧱', years: [6, 6],
    desc: 'Divide by a 2-digit number by taking away big chunks.',
    lesson() {
      const d = rand(12, 25), q = rand(13, 45), n = d * q;
      const c = chunks(n, d);
      const nn = rand(12, 25), qq = rand(13, 45);
      return [
        { say: `${fmt(n)} ÷ ${d}: dividing by a 2-digit number is hard to do in one go. Instead, we take away <b>big chunks</b> of ${d} until nothing is left. Start by writing useful multiples:`, show: V.chips([`1 × ${d} = ${d}`, `2 × ${d} = ${2 * d}`, `5 × ${d} = ${5 * d}`, `10 × ${d} = ${10 * d}`, `20 × ${d} = ${20 * d}`]) },
        { say: 'Check one of the multiples yourself.', try: { q: `10 × ${d} = ?`, answer: 10 * d } },
        { say: `Take the biggest chunk that fits: <b>${fmt(c.list[0].k)} × ${d} = ${fmt(c.list[0].take)}</b>.`, try: { q: `${fmt(n)} − ${fmt(c.list[0].take)} = ?`, answer: c.list[0].after } },
        { say: 'Keep taking chunks until there is nothing left (or less than one ' + d + ').', show: `<div class="chunks">${c.list.map((ch) => `<div>${fmt(ch.before)} − ${fmt(ch.take)} = ${fmt(ch.after)} <span class="muted">(${fmt(ch.k)} × ${d})</span></div>`).join('')}</div>` },
        { say: 'How many lots of ' + d + ' did we take away? Add the chunks.', try: { q: `${c.list.map((ch) => fmt(ch.k)).join(' + ')} = ?`, answer: q } },
        { say: 'Your turn, all the way!', try: longDivGuided(nn * qq, nn) },
      ];
    },
    gen() { const d = rand(12, 25), q = rand(12, 60); return longDivGuided(d * q, d); },
    word() {
      const d = rand(12, 30), q = rand(12, 40);
      const g = longDivGuided(d * q, d);
      return story({ q: `A school has <b>${fmt(d * q)}</b> books to put on shelves. Each shelf holds <b>${d}</b> books. How many shelves are needed?`, scene: '📚', op: '÷', why: 'Groups of ' + d + ': divide.', mid: g.parts.slice(0, -1), ask: 'Add up the chunks. How many shelves?', answer: q, suffix: 'shelves', steps: g.steps });
    },
  };

  const dRemFrac = {
    id: 'remainders-fractions', title: 'Remainders as fractions and decimals', icon: '🍕', years: [6, 6],
    desc: 'Share the remainder too: 7 ÷ 2 = 3½.',
    lesson() {
      const d = pick([2, 4, 5]), q = rand(2, 9), r = rand(1, d - 1), n = d * q + r;
      const d2 = pick([3, 4, 5, 8]), q2 = rand(2, 9), r2 = rand(1, d2 - 1);
      const d3 = pick([2, 4, 5]), q3 = rand(3, 12), r3 = rand(1, d3 - 1);
      return [
        { say: `Share <b>7 pizzas</b> between <b>2</b> people. Each gets 3 whole pizzas and 1 is left. But we can cut that one in half! Each gets <b>3½</b>.`, show: V.shape(7, 2, 'pie', { size: 70 }) },
        { say: `The remainder becomes a fraction: <b>remainder ÷ divisor</b>. ${n} ÷ ${d} = ${q} r ${r} = ${q} ${V.frac(r, d)}.`, show: big(`${n} ÷ ${d} = ${q} ${V.frac(r, d)}`) },
        { say: 'Your turn. Write the answer as a mixed number, like <b>3 1/2</b>.', try: { q: `${d2 * q2 + r2} ÷ ${d2} = ?`, type: 'fraction', answer: { n: d2 * q2 + r2, d: d2 }, hint: `${q2} r ${r2}, so ${q2} and ${r2}/${d2}.` } },
        { say: 'As a <b>decimal</b>: ½ = 0.5, ¼ = 0.25, ¾ = 0.75, ⅕ = 0.2. So 7 ÷ 2 = 3.5.', try: { q: `${d3 * q3 + r3} ÷ ${d3} = ? <span class="muted">(as a decimal)</span>`, answer: (d3 * q3 + r3) / d3, decimals: true } },
      ];
    },
    gen() {
      const d = pick([2, 4, 5, 10]), q = rand(2, 30), r = rand(1, d - 1), n = d * q + r;
      if (Math.random() < 0.5) return { q: `${n} ÷ ${d} = ? <span class="muted">(write a mixed number, like 3 1/2)</span>`, type: 'fraction', answer: { n, d }, hint: 'Remainder over the divisor.', steps: [`${n} ÷ ${d} = ${q} r ${r} = <b>${q} ${V.frac(r, d)}</b>`] };
      return { q: `${n} ÷ ${d} = ? <span class="muted">(as a decimal)</span>`, answer: n / d, decimals: true, hint: `${q} r ${r}: change ${r}/${d} into a decimal.`, steps: [`${q} r ${r} = ${q} ${V.frac(r, d)} = <b>${fmt(n / d)}</b>`] };
    },
    word() {
      const d = pick([2, 4, 5]), q = rand(2, 9), r = rand(1, d - 1), n = d * q + r;
      return story({ q: `<b>${n}</b> pizzas are shared equally between <b>${d}</b> families. How many pizzas does each family get? Give a decimal.`, scene: '🍕', op: '÷', why: 'Shared equally: divide. Cut the remainder too!', calc: `${n} ÷ ${d}`, answer: n / d, decimals: true, suffix: 'pizzas' });
    },
  };

  /* ---------------- explorers ---------------- */
  function mulExplorer(root) {
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Build an array. How many dots? Try turning it around!</p>
        <div class="ex-controls">
          <label>Rows <input type="range" id="r" min="1" max="12" value="3"><output id="or"></output></label>
          <label>In each row <input type="range" id="c" min="1" max="12" value="5"><output id="oc"></output></label>
          <button class="btn ghost" id="turn">🔄 Turn it around</button>
        </div>
        <div class="ex-stage" id="stage"></div>
      </div>`;
    const R = root.querySelector('#r'), C = root.querySelector('#c'), stage = root.querySelector('#stage');
    function draw() {
      const r = +R.value, c = +C.value;
      root.querySelector('#or').textContent = r;
      root.querySelector('#oc').textContent = c;
      stage.innerHTML = `<div class="ex-eq">${r} × ${c} = <button class="reveal" id="rv">?</button></div>
        <div class="row-center">${V.array(r, c)}</div><p class="center muted">${r} rows of ${c}</p>${skipCount(c, r)}`;
      const rv = stage.querySelector('#rv');
      rv.onclick = () => { rv.textContent = r * c; rv.classList.add('shown'); U.sound('ok'); };
    }
    R.oninput = draw; C.oninput = draw;
    root.querySelector('#turn').onclick = () => { const t = R.value; R.value = C.value; C.value = t; draw(); };
    draw();
  }
  function divExplorer(root) {
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Share the cookies fairly between the plates. Is anything left over?</p>
        <div class="ex-controls">
          <label>Cookies <input type="range" id="n" min="0" max="40" value="13"><output id="on"></output></label>
          <label>Plates <input type="range" id="k" min="1" max="10" value="4"><output id="ok"></output></label>
        </div>
        <div class="ex-stage" id="stage"></div>
      </div>`;
    const N = root.querySelector('#n'), K = root.querySelector('#k'), stage = root.querySelector('#stage');
    function draw() {
      const n = +N.value, k = +K.value, q = Math.floor(n / k), r = n % k;
      root.querySelector('#on').textContent = n;
      root.querySelector('#ok').textContent = k;
      stage.innerHTML = `<div class="ex-eq">${n} ÷ ${k} = <button class="reveal" id="rv">?</button></div>${V.groups(n, k, '🍪')}`;
      const rv = stage.querySelector('#rv');
      rv.onclick = () => { rv.textContent = r ? `${q} r ${r}` : q; rv.classList.add('shown'); U.sound('ok'); };
    }
    N.oninput = draw; K.oninput = draw;
    draw();
  }

  /* ---------------- topics ---------------- */
  TOPICS.push({
    id: 'multiplication', name: 'Multiplication', icon: '✖️', color: '#8b5cf6', minYear: 1,
    tagline: 'Equal groups, arrays and times tables',
    explore: mulExplorer,
    skills: [mGroups, mCount, mArrays, mDouble, mT2510, mTurn, mSentences, mT348, mGrid, mScale, mT12, m10, mShort, mThree, mFactors, mPrimes, mLong, mBidmas, mCommon],
  });

  TOPICS.push({
    id: 'division', name: 'Division', icon: '➗', color: '#06b6d4', minYear: 1,
    tagline: 'Sharing fairly and grouping',
    explore: divExplorer,
    skills: [dShare, dGroup, dHalf, d2510, dInverse, d348, dRem, dShort, d10, dReal, dDiv, dLong, dRemFrac],
  });
})();
