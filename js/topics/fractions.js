'use strict';
/*
 * Fractions (Years 1–6) and Decimals & Percentages (Years 4–6).
 * Each topic is a list of small skills: a step-by-step lesson, practice and real-life problems.
 */
(() => {
  const { rand, pick, shuffle, gcd, lcm, fmt } = U;
  const F = V.frac;
  const fs = (n, d) => `${n}/${d}`;
  const COLS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];
  const coprime = (d) => { let n; do { n = rand(1, d - 1); } while (gcd(n, d) > 1); return n; };
  const fracAns = (n, d, exact) => ({ type: 'fraction', answer: { n, d }, exact: !!exact });
  const kind = () => pick(['pie', 'bar']);
  /** Mixed number as HTML, e.g. 7/4 → 1 ¾ */
  const mixed = (n, d) => {
    const w = Math.floor(n / d), r = n % d;
    if (w === 0) return F(r, d);
    return r === 0 ? `<span class="fnum">${w}</span>` : `<span class="fnum">${w}</span>${F(r, d)}`;
  };
  const simpNote = (n, d) => {
    const g = gcd(n, d), N = n / g, D = d / g;
    let s = '';
    if (g > 1) s += `Simplify: divide top and bottom by ${g} → <b>${F(N, D)}</b>. `;
    if (N > D && D > 1) s += `As a mixed number: <b>${mixed(N, D)}</b>.`;
    else if (N === D) s += 'That is exactly <b>1 whole</b>!';
    return s || `${F(n, d)} is already as simple as it can be.`;
  };
  /** Up to three different (not equivalent) fraction choices including n/d. */
  function choiceSet(n, d, pool) {
    const opts = new Map([[fs(n, d), [n, d]]]);
    for (const [a, b] of shuffle(pool)) {
      if (opts.size >= 3) break;
      if (a * d !== n * b && ![...opts.values()].some(([x, y]) => x * b === a * y)) opts.set(fs(a, b), [a, b]);
    }
    return shuffle([...opts.entries()]).map(([v, [a, b]]) => ({ v, html: F(a, b) }));
  }
  const yesNo = (yes) => ({ type: 'choice', choices: [{ v: 'yes', html: 'Yes ✅' }, { v: 'no', html: 'No ❌' }], answer: yes ? 'yes' : 'no' });

  /* ---------------- pictures ---------------- */
  /** A bar split into parts of the given widths (to show equal vs unequal parts). */
  function splitRect(parts, shade = [0], col = COLS[1]) {
    const W = 200, H = 70;
    let x = 2, s = `<svg viewBox="0 0 ${W + 4} ${H + 4}" width="${W + 4}" role="img" aria-label="bar cut into ${parts.length} parts">`;
    parts.forEach((p, i) => { const w = p * W; s += `<rect x="${x}" y="2" width="${w}" height="${H}" fill="${shade.includes(i) ? col : '#fff'}" stroke="#334155" stroke-width="2"/>`; x += w; });
    return s + '</svg>';
  }
  const fracLabel = (v, d) => (v % d === 0 ? String(v / d) : v > d ? `${Math.floor(v / d)} ${v % d}/${d}` : `${v}/${d}`);
  /** Number line from 0 to `wholes`, cut into steps of 1/d. */
  function fracLine(d, o = {}) {
    const w = o.wholes || 1;
    return V.numberLine({
      min: 0, max: d * w, step: 1,
      label: (v) => (o.only && v % d ? '' : fracLabel(v, d)),
      points: (o.marks || []).map((m) => ({ v: m.v, emoji: m.emoji || '👇', label: m.label || '' })),
      jumps: o.jumps,
    });
  }
  /** Number line for decimals: values are multiplied by `scale` so every small step gets a tick. */
  function decLine(lo, hi, scale, o = {}) {
    return V.numberLine({
      min: Math.round(lo * scale), max: Math.round(hi * scale), step: o.step || 1,
      label: (v) => (o.only && v % (o.only) ? '' : U.fmt(U.round(v / scale, 3))),
      points: (o.points || []).map((p) => Object.assign({}, p, { v: Math.round(p.v * scale) })),
      jumps: (o.jumps || []).map((j) => Object.assign({}, j, { from: Math.round(j.from * scale), to: Math.round(j.to * scale) })),
    });
  }
  /** 10 × 10 grid with the first n squares shaded (row by row, so one row = one tenth). */
  function grid100(n, o = {}) {
    const c = o.cell || 20, col = o.color || '#38bdf8';
    let s = `<svg viewBox="0 0 ${c * 10 + 4} ${c * 10 + 4}" width="${c * 10 + 4}" role="img" aria-label="${n} out of 100 squares shaded">`;
    for (let k = 0; k < 100; k++) {
      const r = Math.floor(k / 10), q = k % 10;
      s += `<rect x="${2 + q * c}" y="${2 + r * c}" width="${c}" height="${c}" fill="${k < n ? col : '#fff'}" stroke="#94a3b8" stroke-width="1"/>`;
    }
    for (let r = 1; r < 10; r++) s += `<line x1="2" y1="${2 + r * c}" x2="${2 + c * 10}" y2="${2 + r * c}" stroke="#334155" stroke-width="1.5"/>`;
    s += `<rect x="2" y="2" width="${c * 10}" height="${c * 10}" fill="none" stroke="#334155" stroke-width="2.5"/>`;
    return s + '</svg>';
  }
  /** Area model for a/b × c/d: columns show a/b, rows show c/d, overlap = answer. */
  function areaFrac(a, b, c, d) {
    const S = 240, cw = S / b, rh = S / d;
    let s = `<svg viewBox="0 0 ${S + 4} ${S + 4}" width="${S + 4}" role="img" aria-label="area model">`;
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < b; j++) {
        const inA = j < a, inC = i < c;
        const fill = inA && inC ? '#a78bfa' : inA ? '#bfdbfe' : inC ? '#fbcfe8' : '#fff';
        s += `<rect x="${2 + j * cw}" y="${2 + i * rh}" width="${cw}" height="${rh}" fill="${fill}" stroke="#334155" stroke-width="1.5"/>`;
      }
    }
    return s + `<rect x="2" y="2" width="${S}" height="${S}" fill="none" stroke="#334155" stroke-width="3"/></svg>`;
  }
  const bars = (...list) => `<div class="row-center col">${list.join('')}</div>`;
  const row = (...list) => `<div class="demo-row">${list.join('')}</div>`;
  const big = (html) => `<div class="say-big">${html}</div>`;

  /* =====================================================================
   * FRACTIONS — Year 1 and 2
   * ===================================================================== */
  const halves = {
    id: 'halves', title: 'Halves of shapes', years: [1, 2], icon: '🍕',
    desc: 'A half is one of 2 EQUAL parts.',
    lesson() {
      return [
        { say: 'A <b>fraction</b> is a part of a whole thing. Here is a whole pizza 🍕. When we share it, we must cut it into <b>equal</b> parts — exactly the same size — so it is fair!', show: V.pie(0, 1, { size: 150 }) },
        { say: `Cut the pizza into <b>2 equal parts</b>. Each part is called <b>one half</b>. We write it like this: ${F(1, 2)}. The bottom number <b>2</b> says “cut into 2 equal parts”. The top number <b>1</b> says “take 1 of them”.`, show: row(V.pie(1, 2, { size: 140 }), V.bar(1, 2, { width: 200 })) },
        { say: 'Your turn! Press <b>+</b> to cut the circle into 2 equal parts. Then tap one part to colour it.', try: { type: 'slice', n: 1, d: 2, kind: 'pie', hint: 'Cut into 2, then tap 1 part.' } },
        { say: 'Careful! Halves must be the <b>same size</b>. If one part is bigger, it is not fair — it is not a half.', show: row(splitRect([0.5, 0.5]), '<span class="op">✅</span>', splitRect([0.72, 0.28]), '<span class="op">❌</span>') },
        { say: 'Which bar is cut into <b>halves</b>?', try: { type: 'choice', choices: shuffle([{ v: 'eq', html: splitRect([0.5, 0.5]) }, { v: 'un', html: splitRect([0.68, 0.32]) }]), answer: 'eq', hint: 'Halves are exactly the same size.' } },
        { say: 'Two halves make <b>one whole</b> again: half + half = 1 whole. 🎉', show: big(`${F(1, 2)} + ${F(1, 2)} = 1`) },
        { say: 'Now all by yourself: cut the bar into halves and shade <b>one half</b>.', try: { type: 'slice', n: 1, d: 2, kind: 'bar' } },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.4) return { type: 'slice', q: `Cut the shape into halves and shade ${F(1, 2)}.`, n: 1, d: 2, kind: kind(), hint: 'Cut into 2 equal parts. Shade 1.' };
      if (r < 0.75) {
        const eq = Math.random() < 0.5;
        const parts = eq ? [0.5, 0.5] : pick([[0.7, 0.3], [0.62, 0.38], [0.25, 0.75]]);
        return Object.assign(yesNo(eq), { q: 'Is this bar cut into <b>halves</b>?', visual: splitRect(parts), hint: 'Are the 2 parts exactly the same size?', steps: [eq ? 'Both parts are the same size, so they are halves.' : 'One part is bigger, so these are <b>not</b> halves.'] });
      }
      const shaded = Math.random() < 0.6;
      return Object.assign(yesNo(shaded), { q: `Is ${F(1, 2)} of this shape shaded?`, visual: shaded ? V.shape(1, 2, kind()) : V.shape(1, pick([3, 4]), kind()), hint: 'Count the equal parts. Half means 1 out of 2.', steps: ['A half is 1 out of 2 equal parts.'] });
    },
    word() {
      const n = U.name();
      return {
        type: 'guided', scene: '🍰', story: true,
        q: `${n} cuts a cake into 2 equal pieces and eats 1 piece.`,
        parts: [
          { say: 'How many equal pieces is the cake cut into?', answer: 2 },
          { say: `How many pieces did ${n} eat?`, answer: 1 },
          { say: `What fraction of the cake did ${n} eat?`, type: 'choice', choices: choiceSet(1, 2, [[1, 3], [1, 4], [2, 3]]), answer: '1/2', after: 'One piece out of 2 equal pieces is one half.' },
        ],
      };
    },
  };

  const quarters = {
    id: 'quarters', title: 'Quarters of shapes', years: [1, 2], icon: '🍫',
    desc: 'A quarter is one of 4 equal parts.',
    lesson(y) {
      const [n, d] = y === 1 ? [1, 4] : pick([[1, 4], [3, 4], [2, 4]]);
      return [
        { say: 'Cut a whole into <b>4 equal parts</b>. Each part is called <b>one quarter</b>. We write it ' + F(1, 4) + '.', show: row(V.pie(1, 4, { size: 140 }), V.bar(1, 4, { width: 220, labels: true })) },
        { say: 'Here is a trick: cut it in <b>half</b>, then cut each half in half again. Now you have 4 equal quarters!', show: row(V.pie(0, 2, { size: 120 }), '<span class="op">→</span>', V.pie(0, 4, { size: 120 })) },
        { say: 'Your turn: press <b>+</b> to cut the circle into quarters, then shade <b>one quarter</b>.', try: { type: 'slice', n: 1, d: 4, kind: 'pie', hint: 'Cut into 4 equal parts, shade 1.' } },
        { say: `Look: <b>two quarters</b> cover the same as <b>one half</b>! ${F(2, 4)} = ${F(1, 2)}. And four quarters make one whole.`, show: bars(V.bar(2, 4, { labels: true }), V.bar(1, 2, { labels: true, color: COLS[2] })) },
        { say: 'Which picture shows <b>one quarter</b> shaded?', try: { type: 'choice', choices: shuffle([{ v: 'q', html: V.pie(1, 4, { size: 90 }) }, { v: 'h', html: V.pie(1, 2, { size: 90 }) }, { v: 'u', html: splitRect([0.4, 0.2, 0.25, 0.15], [0]) }]), answer: 'q', hint: 'A quarter is 1 of 4 EQUAL parts.' } },
        { say: `Last one, all by yourself: show ${F(n, d)} on the bar.`, try: { type: 'slice', n, d, kind: 'bar' } },
      ];
    },
    gen(y) {
      const pool = y === 1 ? [[1, 4]] : [[1, 4], [2, 4], [3, 4]];
      const [n, d] = pick(pool);
      const r = Math.random();
      if (r < 0.4) return { type: 'slice', q: `Cut the shape into quarters and shade ${F(n, d)}.`, n, d, kind: kind(), hint: `Cut into 4 equal parts. Shade ${n}.` };
      if (r < 0.7) {
        const eq = Math.random() < 0.5;
        return Object.assign(yesNo(eq), { q: 'Is this bar cut into <b>quarters</b>?', visual: splitRect(eq ? [0.25, 0.25, 0.25, 0.25] : pick([[0.4, 0.2, 0.25, 0.15], [0.3, 0.3, 0.2, 0.2]]), [0]), hint: 'Quarters are 4 parts that are all the same size.' });
      }
      return { type: 'choice', q: 'What fraction is shaded?', visual: V.shape(n, d, kind(), { color: pick(COLS) }), choices: choiceSet(n, d, [[1, 2], [1, 3], [3, 4], [1, 4]]), answer: fs(n, d), hint: 'Count the equal parts (bottom), then the shaded parts (top).', steps: [`${d} equal parts, ${n} shaded: ${F(n, d)}.`] };
    },
    word() {
      const n = U.name();
      return {
        type: 'guided', scene: '🍫', story: true,
        q: `${n} has a chocolate bar with 4 equal pieces. ${n} gives 1 piece to a friend.`,
        parts: [
          { say: 'Cut the bar and shade the piece that was given away.', type: 'slice', n: 1, d: 4, kind: 'bar' },
          { say: 'What fraction was given away?', type: 'choice', choices: choiceSet(1, 4, [[1, 2], [3, 4], [1, 3]]), answer: '1/4' },
          { say: `How many pieces does ${n} have left?`, answer: 3, after: `That is ${F(3, 4)} of the bar.` },
        ],
      };
    },
  };

  const EMO = ['🍓', '🍪', '🍬', '🧁', '🍇', '⭐', '🐟', '🌸'];
  const halfAmount = {
    id: 'half-amount', title: 'Half of an amount', years: [1, 2], icon: '🍓',
    desc: 'Share into 2 equal groups.',
    lesson(y) {
      const k = rand(3, y === 1 ? 6 : 10), e = pick(EMO), k2 = rand(2, y === 1 ? 8 : 12);
      return [
        { say: `We can find <b>half of a group</b> of things too! Here are ${2 * k} ${e}. Half means <b>share them into 2 equal groups</b>.`, show: V.objects(2 * k, e) },
        { say: `Give one to each group, then again, and again… until none are left. Each group gets <b>${k}</b>. So half of ${2 * k} is ${k}.`, show: V.groups(2 * k, 2, e) },
        { say: 'Your turn! Tap the plates (or press “Deal”) to share the strawberries fairly between 2 plates.', try: { type: 'share', total: 2 * k2, groups: 2, emoji: '🍓', answer: k2, ask: 'How many on each plate? That is half!' } },
        { say: `💡 A quick trick: halving is the opposite of <b>doubling</b>. ${k} + ${k} = ${2 * k}, so half of ${2 * k} is ${k}.`, show: V.chips([`${k} + ${k} = ${2 * k}`, `half of ${2 * k} = ${k}`], [1]) },
        (() => { const m = rand(2, 10); return { say: 'Use your doubles to answer.', try: { q: `What is half of <b>${2 * m}</b>?`, answer: m, hint: `Which number doubled makes ${2 * m}?` } }; })(),
      ];
    },
    gen(y) {
      const k = rand(1, y === 1 ? 10 : 20), e = pick(EMO);
      if (Math.random() < 0.5 && 2 * k <= 24) return { type: 'share', q: `Find half of ${2 * k}. Share them onto 2 plates.`, total: 2 * k, groups: 2, emoji: e, answer: k, ask: 'How many on each plate?' };
      return { q: `What is half of <b>${2 * k}</b>?`, visual: 2 * k <= 20 ? V.objects(2 * k, e) : '', answer: k, hint: `Share into 2 equal groups, or think: ? + ? = ${2 * k}.`, steps: [2 * k <= 30 ? V.groups(2 * k, 2, e) : '', `${k} + ${k} = ${2 * k}, so half of ${2 * k} is <b>${k}</b>.`] };
    },
    word(y) {
      const [a, b] = U.twoNames();
      const k = rand(2, y === 1 ? 8 : 15);
      return {
        type: 'guided', scene: '🍇', story: true,
        q: `${a} has <b>${2 * k}</b> grapes and gives <b>half</b> of them to ${b}.`,
        parts: [
          { say: 'Share the grapes into 2 equal groups.', type: 'share', total: 2 * k, groups: 2, emoji: '🍇', answer: k, ask: `How many grapes does ${b} get?` },
          { say: `How many grapes does ${a} have left?`, answer: k, after: 'Both halves are the same!' },
        ],
      };
    },
  };

  const quarterAmount = {
    id: 'quarter-amount', title: 'Quarter of an amount', years: [1, 2], icon: '🍪',
    desc: 'Share into 4 equal groups.',
    lesson(y) {
      const k = rand(2, y === 1 ? 3 : 5), k2 = rand(2, y === 1 ? 3 : 6);
      return [
        { say: `A <b>quarter</b> means <b>4 equal groups</b>. Let's find a quarter of ${4 * k} cookies by sharing them onto 4 plates.`, show: V.objects(4 * k, '🍪') },
        { say: `Each plate gets <b>${k}</b>. So a quarter of ${4 * k} is ${k}. ${F(1, 4)} of ${4 * k} = ${k}.`, show: V.groups(4 * k, 4, '🍪') },
        { say: 'Your turn! Share these onto 4 plates.', try: { type: 'share', total: 4 * k2, groups: 4, emoji: '🧁', answer: k2, ask: 'How many on each plate? That is a quarter!' } },
        { say: `💡 Another way: a quarter is <b>half of a half</b>! Half of ${4 * k} is ${2 * k}. Half of ${2 * k} is ${k}.`, show: V.chips([`${4 * k}`, `→ half → ${2 * k}`, `→ half → ${k}`], [2]) },
        (() => { const m = rand(1, 5); return { say: 'Try the half-of-a-half trick:', try: { q: `What is a quarter of <b>${4 * m}</b>?`, answer: m, hint: `Half of ${4 * m} is ${2 * m}. Now halve again.` } }; })(),
      ];
    },
    gen(y) {
      const k = rand(1, y === 1 ? 3 : 6), e = pick(EMO);
      if (Math.random() < 0.5) return { type: 'share', q: `Find ${F(1, 4)} of ${4 * k}. Share them onto 4 plates.`, total: 4 * k, groups: 4, emoji: e, answer: k, ask: 'How many on each plate?' };
      return { q: `What is ${F(1, 4)} of <b>${4 * k}</b>?`, visual: V.objects(4 * k, e, { perRow: 4 }), answer: k, hint: 'Share into 4 equal groups, or halve and halve again.', steps: [V.groups(4 * k, 4, e), `${F(1, 4)} of ${4 * k} = <b>${k}</b>`] };
    },
    word(y) {
      const n = U.name(), k = rand(2, y === 1 ? 3 : 6);
      return {
        type: 'guided', scene: '🐟', story: true,
        q: `${n} catches <b>${4 * k}</b> fish and shares them equally between 4 cats.`,
        parts: [
          { say: 'Share the fish between 4 cats.', type: 'share', total: 4 * k, groups: 4, emoji: '🐟', answer: k, ask: 'How many fish does each cat get?' },
          { say: 'What fraction of the fish does each cat get?', type: 'choice', choices: choiceSet(1, 4, [[1, 2], [1, 3], [3, 4]]), answer: '1/4' },
        ],
      };
    },
  };

  const thirds = {
    id: 'thirds', title: 'Thirds and three quarters', years: [2, 2], icon: '🥧',
    desc: 'One third, two thirds, and three quarters.',
    lesson() {
      const k = rand(2, 5);
      return [
        { say: `Cut a whole into <b>3 equal parts</b>: each one is <b>one third</b>, ${F(1, 3)}. Two of them are <b>two thirds</b>, ${F(2, 3)}.`, show: row(V.pie(1, 3, { size: 130 }), V.pie(2, 3, { size: 130, color: COLS[1] })) },
        { say: `Your turn: cut the circle into thirds and shade ${F(2, 3)}.`, try: { type: 'slice', n: 2, d: 3, kind: 'pie', hint: 'Cut into 3 equal parts, shade 2.' } },
        { say: `<b>Three quarters</b>, ${F(3, 4)}, means 4 equal parts and we take 3. Only one quarter is left!`, show: row(V.pie(3, 4, { size: 130 }), V.bar(3, 4, { labels: true })) },
        { say: `A third of a group: share into <b>3</b> equal groups. ${F(1, 3)} of ${3 * k} = ${k}.`, show: V.groups(3 * k, 3, '🍬') },
        (() => { const m = rand(2, 5); return { say: 'Share these sweets between 3 friends.', try: { type: 'share', total: 3 * m, groups: 3, emoji: '🍬', answer: m, ask: `So ${F(1, 3)} of ${3 * m} is…` } }; })(),
        { say: 'Which shape shows three quarters?', try: { type: 'choice', choices: shuffle([{ v: 'a', html: V.pie(3, 4, { size: 90 }) }, { v: 'b', html: V.pie(1, 4, { size: 90 }) }, { v: 'c', html: V.pie(2, 3, { size: 90 }) }]), answer: 'a', hint: '4 equal parts, 3 shaded.' } },
      ];
    },
    gen() {
      const pool = [[1, 3], [2, 3], [1, 4], [3, 4], [2, 4], [1, 2]];
      const [n, d] = pick(pool);
      const r = Math.random();
      if (r < 0.3) return { type: 'slice', q: `Show ${F(n, d)}.`, n, d, kind: kind(), hint: `Cut into ${d} equal parts and shade ${n}.` };
      if (r < 0.6) return { type: 'choice', q: 'What fraction is shaded?', visual: V.shape(n, d, kind(), { color: pick(COLS) }), choices: choiceSet(n, d, pool), answer: fs(n, d), hint: 'Bottom: all equal parts. Top: shaded parts.' };
      if (r < 0.8) {
        const k = rand(2, 6), [a, b] = pick([[1, 3], [1, 4], [3, 4], [2, 3]]);
        return { q: `What is ${F(a, b)} of <b>${b * k}</b>?`, visual: V.objects(b * k, pick(EMO), { perRow: b }), answer: a * k, hint: `Share into ${b} groups${a > 1 ? `, then count ${a} groups` : ''}.`, steps: [V.groups(b * k, b, '⭐'), `${F(1, b)} of ${b * k} = ${k}${a > 1 ? `, so ${F(a, b)} = ${k} × ${a} = <b>${a * k}</b>` : ''}`] };
      }
      return { type: 'choice', q: `Which fraction is the same as ${F(1, 2)}?`, visual: V.bar(1, 2), choices: [{ v: '2/4', html: F(2, 4) }, { v: '1/3', html: F(1, 3) }, { v: '3/4', html: F(3, 4) }], answer: '2/4', hint: 'Look at the bars: which one covers half?', steps: [bars(V.bar(1, 2), V.bar(2, 4)), `${F(2, 4)} = ${F(1, 2)}`] };
    },
  };

  const countHQ = {
    id: 'count-halves', title: 'Counting in halves and quarters', years: [2, 3], icon: '🐸',
    desc: 'Count along a number line: ½, 1, 1½, 2…',
    lesson() {
      return [
        { say: `We can count in halves! Each hop is ${F(1, 2)}: <b>½, 1, 1½, 2, 2½, 3</b>. Two halves make 1 whole.`, show: fracLine(2, { wholes: 3, jumps: [1, 2, 3, 4].map((v) => ({ from: v - 1, to: v, label: '+½' })) }) },
        { say: 'What comes next? ½, 1, 1½, 2, …', try: { type: 'choice', choices: [{ v: '5', html: mixed(5, 2) }, { v: '6', html: '3' }, { v: '3', html: mixed(3, 2) }], answer: '5', hint: 'Add one more half to 2.' } },
        { say: `Now count in <b>quarters</b>: ${F(1, 4)}, ${F(2, 4)}, ${F(3, 4)}, 1, 1${F(1, 4)}… Four quarters make 1 whole.`, show: fracLine(4, { wholes: 2 }) },
        { say: 'Which number is the frog on?', show: fracLine(4, { wholes: 2, only: true, marks: [{ v: 6, emoji: '🐸' }] }), try: { type: 'choice', choices: [{ v: '6', html: mixed(6, 4) }, { v: '5', html: mixed(5, 4) }, { v: '3', html: F(3, 4) }], answer: '6', hint: 'Count the small hops from 0. Each hop is a quarter.' } },
        { say: 'One more: what comes next? 1¼, 1½, 1¾, …', try: { type: 'choice', choices: [{ v: '8', html: '2' }, { v: '9', html: mixed(9, 4) }, { v: '7', html: mixed(7, 4) }], answer: '8', hint: '1¾ + ¼ = 2.' } },
      ];
    },
    gen() {
      const d = pick([2, 4]), start = rand(1, d === 2 ? 4 : 5);
      if (Math.random() < 0.5) {
        const seq = [start, start + 1, start + 2], nxt = start + 3;
        const opts = new Set([nxt, nxt + 1, start + 2]);
        if (opts.size < 3) opts.add(nxt + 2);
        return { type: 'choice', q: `What comes next? ${seq.map((v) => mixed(v, d)).join(', ')}, …`, choices: shuffle([...opts].slice(0, 3).map((v) => ({ v: String(v), html: mixed(v, d) }))), answer: String(nxt), hint: `Each step is ${d === 2 ? 'one half' : 'one quarter'}.`, steps: [fracLine(d, { wholes: Math.ceil((nxt + 1) / d) }), `Next is <b>${mixed(nxt, d)}</b>.`] };
      }
      const w = 2, v = rand(1, d * w - 1);
      const opts = new Set([v]);
      for (const c of shuffle([v - 1, v + 1, v + 2, v - 2])) { if (opts.size < 3 && c > 0 && c <= d * w) opts.add(c); }
      return { type: 'choice', q: 'Which number is the arrow pointing to?', visual: fracLine(d, { wholes: w, only: true, marks: [{ v }] }), choices: shuffle([...opts].map((x) => ({ v: String(x), html: mixed(x, d) }))), answer: String(v), hint: `Count the hops from 0. Each hop is ${d === 2 ? 'a half' : 'a quarter'}.`, steps: [fracLine(d, { wholes: w, marks: [{ v }] })] };
    },
  };

  /* =====================================================================
   * FRACTIONS — Year 3 and 4
   * ===================================================================== */
  const unitNon = {
    id: 'unit-fractions', title: 'Unit and non-unit fractions', years: [3, 3], icon: '🧩',
    desc: 'What the top and bottom numbers mean.',
    lesson() {
      const d = rand(5, 8), n = rand(2, d - 1);
      return [
        { say: `Every fraction has two numbers. The <b>denominator</b> (bottom) says how many <b>equal parts</b> the whole is cut into. The <b>numerator</b> (top) says how many parts we <b>take</b>.`, show: `<div class="row-center">${V.pie(3, 5, { size: 130 })}<div class="frac-explain">${F(3, 5)}<div><p>⬆️ numerator: 3 parts taken</p><p>⬇️ denominator: 5 equal parts</p></div></div></div>` },
        { say: `A <b>unit fraction</b> has <b>1</b> on top: ${F(1, 2)}, ${F(1, 5)}, ${F(1, 9)}. It is just one part. A <b>non-unit fraction</b> has more than 1 on top, like ${F(3, 5)}.`, show: row(V.bar(1, 5, { width: 200 }), V.bar(3, 5, { width: 200, color: COLS[1] })) },
        { say: 'What fraction is shaded? Type it like <b>3/5</b>.', show: V.bar(n, d, { color: COLS[2] }), try: Object.assign(fracAns(n, d), { hint: `${d} equal parts, count the shaded ones.` }) },
        { say: `Now you make one: show ${F(n, d)}.`, try: { type: 'slice', n, d, kind: 'bar', hint: `Cut into ${d}, shade ${n}.` } },
        { say: 'Which of these is a <b>unit fraction</b>?', try: { type: 'choice', choices: shuffle([...new Set([1, n, d - 1, 2])].slice(0, 3).map((x) => ({ v: String(x), html: F(x, d) }))), answer: '1', hint: 'A unit fraction has 1 on top.' } },
      ];
    },
    gen() {
      const d = rand(3, 10), n = rand(1, d - 1);
      const r = Math.random();
      if (r < 0.4) return Object.assign(fracAns(n, d), { q: 'What fraction is shaded? Type it like <b>3/5</b>.', visual: V.shape(n, d, kind(), { color: pick(COLS) }), hint: 'Bottom = equal parts. Top = shaded parts.', steps: [`${d} equal parts, ${n} shaded → ${F(n, d)}`] });
      if (r < 0.75) return { type: 'slice', q: `Show ${F(n, d)}.`, n, d, kind: kind(), hint: `Cut into ${d}, shade ${n}.` };
      return { q: `${F(n, d)} of a shape is shaded. How many parts are <b>not</b> shaded?`, visual: V.bar(n, d), answer: d - n, hint: `${d} parts altogether.`, steps: [`${d} − ${n} = <b>${d - n}</b>`] };
    },
  };

  const tenths = {
    id: 'tenths', title: 'Tenths', years: [3, 4], icon: '🔟',
    desc: 'Cut into 10 equal parts and count in tenths.',
    lesson() {
      const n = rand(2, 8), k = rand(2, 8);
      return [
        { say: `Cut a whole into <b>10 equal parts</b>. Each part is <b>one tenth</b>: ${F(1, 10)}.`, show: V.bar(1, 10, { width: 400, labels: true }) },
        { say: `Count in tenths: ${F(1, 10)}, ${F(2, 10)}, ${F(3, 10)} … ${F(9, 10)}, ${F(10, 10)}. And <b>10 tenths make 1 whole</b>!`, show: fracLine(10) },
        { say: 'How many tenths are shaded? Write the fraction.', show: V.bar(n, 10, { width: 400, color: COLS[1] }), try: Object.assign(fracAns(n, 10), { hint: 'Count the shaded parts. Bottom number is 10.' }) },
        { say: `What do we add to ${F(n, 10)} to make <b>1 whole</b>? Look at the white parts.`, show: V.bar(n, 10, { width: 400, color: COLS[1] }), try: { q: `${F(n, 10)} + <span class="frac"><span class="box">?</span><span>10</span></span> = 1`, answer: 10 - n, hint: '10 tenths make a whole.' } },
        { say: `Tenths of a number: to find ${F(1, 10)}, <b>divide by 10</b>. ${F(1, 10)} of ${k * 10} = ${k}.`, show: V.chips([`${k * 10} ÷ 10 = ${k}`]), try: (() => { const m = rand(2, 9); return { q: `${F(1, 10)} of ${m * 10} = ?`, answer: m, hint: 'Divide by 10.' }; })() },
      ];
    },
    gen() {
      const n = rand(1, 9), r = Math.random();
      if (r < 0.3) return Object.assign(fracAns(n, 10), { q: 'What fraction is shaded?', visual: V.bar(n, 10, { width: 400, color: pick(COLS) }), hint: 'Count the shaded tenths.' });
      if (r < 0.5) return { q: `${F(n, 10)} + <span class="frac"><span class="box">?</span><span>10</span></span> = 1`, visual: V.bar(n, 10, { width: 400 }), answer: 10 - n, hint: '10 tenths make 1 whole.', steps: [`10 − ${n} = <b>${10 - n}</b>`] };
      if (r < 0.7) {
        const a = rand(1, 8), b = rand(1, 9 - a);
        return Object.assign(fracAns(a + b, 10), { q: `${F(a, 10)} + ${F(b, 10)} = ?`, visual: V.bar(a, 10, { width: 400 }), hint: 'Add the tenths. The bottom stays 10.', steps: [`${a} tenths + ${b} tenths = <b>${a + b} tenths</b> = ${F(a + b, 10)}`] });
      }
      if (r < 0.85) { const m = rand(1, 12); return { q: `${F(1, 10)} of <b>${m * 10}</b> = ?`, answer: m, hint: 'Divide by 10.', steps: [`${m * 10} ÷ 10 = <b>${m}</b>`] }; }
      return { type: 'slice', q: `Show ${F(n, 10)}.`, n, d: 10, kind: 'bar', hint: 'Cut into 10, shade the right number.' };
    },
  };

  const numberLineFr = {
    id: 'fraction-number-line', title: 'Fractions on a number line', years: [3, 5], icon: '📏',
    desc: 'Count equal jumps between 0 and 1.',
    lesson(y) {
      const d = y === 3 ? pick([4, 5]) : pick([4, 5, 8]), v = coprime(d);
      const w = y === 3 ? 1 : 2, v2 = rand(d + 1, d * 2 - 1);
      return [
        { say: `A number line from <b>0 to 1</b> can be cut into equal jumps too. Here it is cut into <b>${d}</b> equal jumps, so each jump is ${F(1, d)}.`, show: fracLine(d) },
        { say: `Count the jumps from 0: ${Array.from({ length: d }, (_, k) => F(k + 1, d)).join(', ')}. The last one, ${F(d, d)}, is the same as <b>1</b>!`, show: fracLine(d, { jumps: Array.from({ length: d }, (_, k) => ({ from: k, to: k + 1, label: '' })) }) },
        { say: 'Which fraction is the arrow pointing to? Count the jumps from 0.', show: fracLine(d, { only: true, marks: [{ v }] }), try: { type: 'choice', choices: shuffle([v, v === 1 ? v + 2 : v - 1, v + 1 < d ? v + 1 : v - 2].filter((x, i, a) => x > 0 && a.indexOf(x) === i).map((x) => ({ v: String(x), html: F(x, d) }))), answer: String(v), hint: `Each jump is ${fs(1, d)}.` } },
        ...(w === 2 ? [{ say: `The line keeps going past 1! After 1 we count 1${F(1, d)}, 1${F(2, d)}… These are <b>mixed numbers</b>.`, show: fracLine(d, { wholes: 2 }) },
          { say: 'Where is the arrow now?', show: fracLine(d, { wholes: 2, only: true, marks: [{ v: v2 }] }), try: { type: 'choice', choices: shuffle([v2, v2 - d, v2 + 1 <= 2 * d - 1 ? v2 + 1 : v2 - 1].filter((x, i, a) => a.indexOf(x) === i && x > 0).map((x) => ({ v: String(x), html: mixed(x, d) }))), answer: String(v2), hint: 'Start counting at 1.' } }]
          : [{ say: 'Is the arrow nearer to 0 or to 1?', show: fracLine(d, { only: true, marks: [{ v }] }), try: { type: 'choice', choices: [{ v: '0', html: 'Nearer 0' }, { v: '1', html: 'Nearer 1' }, { v: 'h', html: 'Exactly half way' }], answer: 2 * v === d ? 'h' : 2 * v < d ? '0' : '1', hint: 'Half way is the middle of the line.' } }]),
      ];
    },
    gen(y) {
      const d = y === 3 ? pick([2, 3, 4, 5, 10]) : pick([3, 4, 5, 6, 8, 10]);
      const w = y === 3 ? 1 : 2;
      let v;
      do { v = rand(1, d * w - 1); } while (v % d === 0);
      const opts = new Set([v]);
      for (const c of shuffle([v - 1, v + 1, v + 2, v - 2, d * w - v])) if (opts.size < 3 && c > 0 && c < d * w && c % d) opts.add(c);
      if (opts.size < 2) opts.add(v === 1 ? 2 : 1);
      return {
        type: 'choice', q: 'Which number is the arrow pointing to?', visual: fracLine(d, { wholes: w, only: true, marks: [{ v }] }),
        choices: shuffle([...opts].map((x) => ({ v: String(x), html: mixed(x, d) }))), answer: String(v),
        hint: `The space between whole numbers is cut into ${d} equal jumps.`,
        steps: [`Each jump is ${F(1, d)}.`, fracLine(d, { wholes: w, marks: [{ v }] }), `The arrow is on <b>${mixed(v, d)}</b>.`],
      };
    },
  };

  const compareSame = {
    id: 'compare-same', title: 'Comparing and ordering fractions', years: [3, 4], icon: '⚖️',
    desc: 'Same bottom number? More parts is bigger.',
    lesson() {
      const d = rand(5, 9), a = rand(1, d - 2), b = rand(a + 1, d - 1);
      return [
        { say: `${F(a, d)} or ${F(b, d)}: which is bigger? Both are cut into <b>${d}</b> equal parts, so the parts are the <b>same size</b>. The one with <b>more parts</b> is bigger.`, show: bars(V.bar(a, d), V.bar(b, d, { color: COLS[1] })) },
        { say: 'Which is bigger?', try: (() => { const dd = rand(4, 10), x = rand(1, dd - 2), z = rand(x + 1, dd - 1); return { type: 'choice', choices: shuffle([{ v: fs(x, dd), html: F(x, dd) }, { v: fs(z, dd), html: F(z, dd) }]), answer: fs(z, dd), hint: 'Same bottom number: compare the tops.' }; })() },
        { say: `Now unit fractions: ${F(1, 2)}, ${F(1, 4)}, ${F(1, 8)}. More pieces means <b>smaller</b> pieces! Sharing a pizza with 8 people gives you less than sharing with 2.`, show: bars(V.bar(1, 2, { labels: true }), V.bar(1, 4, { labels: true, color: COLS[1] }), V.bar(1, 8, { labels: true, color: COLS[2] })) },
        { say: 'Which is bigger?', try: (() => { const p = rand(2, 4), q = rand(p + 2, 10); return { type: 'choice', choices: shuffle([{ v: fs(1, p), html: F(1, p) }, { v: fs(1, q), html: F(1, q) }]), answer: fs(1, p), hint: 'Fewer pieces → bigger pieces.' }; })() },
        { say: 'Put these in order, smallest first.', try: (() => { const dd = rand(6, 10); const ns = shuffle(Array.from({ length: dd - 1 }, (_, i) => i + 1)).slice(0, 3); return { type: 'order', items: ns.map((n) => ({ v: n / dd, html: F(n, dd) })), dir: 'asc', hint: 'Same bottom number: smallest top first.' }; })() },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.35) {
        const d = rand(3, 10), a = rand(1, d - 2), b = rand(a + 1, d - 1);
        const bigQ = Math.random() < 0.6;
        return { type: 'choice', q: `Which fraction is <b>${bigQ ? 'bigger' : 'smaller'}</b>?`, visual: bars(V.bar(a, d), V.bar(b, d, { color: COLS[1] })), choices: shuffle([{ v: fs(a, d), html: F(a, d) }, { v: fs(b, d), html: F(b, d) }]), answer: bigQ ? fs(b, d) : fs(a, d), hint: 'The parts are the same size. Compare the number of parts.' };
      }
      if (r < 0.65) {
        const p = rand(2, 6), q = rand(p + 1, 12);
        return { type: 'choice', q: 'Which fraction is <b>bigger</b>?', choices: shuffle([{ v: fs(1, p), html: F(1, p) }, { v: fs(1, q), html: F(1, q) }]), answer: fs(1, p), hint: 'The bigger the bottom number, the smaller each piece.', steps: [bars(V.bar(1, p), V.bar(1, q, { color: COLS[1] })), `${F(1, p)} is bigger.`] };
      }
      if (r < 0.85) {
        const d = rand(5, 12); const ns = shuffle(Array.from({ length: d - 1 }, (_, i) => i + 1)).slice(0, 3);
        const desc = Math.random() < 0.4;
        return { type: 'order', q: 'Put the fractions in order.', items: ns.map((n) => ({ v: n / d, html: F(n, d) })), dir: desc ? 'desc' : 'asc', hint: 'Same bottom number: look at the tops.' };
      }
      const ds = shuffle([2, 3, 4, 5, 6, 8, 10]).slice(0, 3);
      return { type: 'order', q: 'Put these unit fractions in order.', items: ds.map((d) => ({ v: 1 / d, html: F(1, d) })), dir: 'asc', hint: 'Smallest first: the biggest bottom number gives the smallest piece.' };
    },
  };

  const addSame = {
    id: 'add-subtract-same', title: 'Add and subtract fractions', years: [3, 4], icon: '➕',
    desc: 'Same bottom number: add or take away the tops.',
    lesson(y) {
      const d = rand(5, 9), a = rand(1, d - 3), b = rand(1, d - a - 1);
      const c = rand(3, d - 1), e = rand(1, c - 1);
      const frames = [
        { say: `${F(a, d)} + ${F(b, d)}. Both fractions are counted in <b>${d}ths</b> — the pieces are the same size. So it is just like adding ${a} apples + ${b} apples!`, show: bars(V.bar(a, d), V.bar(b, d, { color: COLS[1] })) },
        { say: `${a} ${d}ths + ${b} ${d}ths = <b>${a + b} ${d}ths</b>. The bottom number <b>stays the same</b> — the size of the pieces doesn't change!`, show: bars(V.bar(a + b, d, { color: COLS[2] })) + big(`${F(a, d)} + ${F(b, d)} = ${F(a + b, d)}`) },
        { say: 'Your turn:', try: (() => { const dd = rand(4, 10), x = rand(1, dd - 2), z = rand(1, dd - x - 1); return Object.assign(fracAns(x + z, dd), { q: `${F(x, dd)} + ${F(z, dd)} = ?`, visual: V.bar(x, dd), hint: 'Add the tops. Keep the bottom.' }); })() },
        { say: `Taking away works the same way. ${F(c, d)} − ${F(e, d)}: ${c} ${d}ths take away ${e} ${d}ths = <b>${c - e} ${d}ths</b>.`, show: bars(V.bar(c, d, { color: COLS[3] }), V.bar(c - e, d, { color: COLS[2] })) + big(`${F(c, d)} − ${F(e, d)} = ${F(c - e, d)}`) },
        { say: 'Your turn:', try: (() => { const dd = rand(4, 10), x = rand(2, dd - 1), z = rand(1, x - 1); return Object.assign(fracAns(x - z, dd), { q: `${F(x, dd)} − ${F(z, dd)} = ?`, visual: V.bar(x, dd), hint: 'Take away the tops. Keep the bottom.' }); })() },
      ];
      if (y >= 4) {
        frames.push({ say: `Sometimes the answer is <b>more than 1 whole</b>! ${F(5, 6)} + ${F(4, 6)} = ${F(9, 6)}. 6 sixths make 1 whole, so ${F(9, 6)} = 1 whole and ${F(3, 6)}.`, show: V.shape(9, 6, 'bar', { color: COLS[2], width: 240 }) + big(`${F(9, 6)} = ${mixed(9, 6)}`) });
        frames.push({ say: 'Try one that goes over 1. You can write it as 7/5 or as 1 2/5.', try: Object.assign(fracAns(7, 5), { q: `${F(4, 5)} + ${F(3, 5)} = ?`, hint: '4 + 3 = 7 fifths.' }) });
      }
      return frames;
    },
    gen(y) {
      const d = rand(4, 12), sub = Math.random() < 0.45;
      let a, b;
      if (sub) { a = rand(2, y >= 4 ? d + 3 : d - 1); b = rand(1, a - 1); } else { a = rand(1, d - 1); b = y >= 4 ? rand(1, d - 1) : rand(1, Math.max(1, d - a - 1)); if (y < 4 && a + b >= d) { a = 1; b = 1; } }
      const r = sub ? a - b : a + b, op = sub ? '−' : '+';
      return Object.assign(fracAns(r, d), {
        q: `${a > d ? mixed(a, d) + ' <span class="muted">(' + F(a, d) + ')</span>' : F(a, d)} ${op} ${F(b, d)} = ?`, visual: y < 4 ? V.bar(a, d) : '',
        hint: `Same bottom number: ${sub ? 'take away' : 'add'} the tops.`,
        steps: [`${a} ${op} ${b} = ${r}, the bottom stays ${d}.`, `= ${F(r, d)}`, V.shape(r, d, 'bar', { color: COLS[2], width: 220 }), simpNote(r, d)],
      });
    },
    word(y) {
      const n = U.name(), d = pick([6, 8, 10, 12]);
      const a = rand(1, d - 2), b = rand(1, d - a - 1);
      return {
        type: 'guided', scene: '🍕', story: true,
        q: `A pizza is cut into <b>${d}</b> equal slices. ${n} eats <b>${a}</b> slice${a > 1 ? 's' : ''} and a friend eats <b>${b}</b>.`,
        parts: [
          { say: `What fraction did ${n} eat?`, ...fracAns(a, d) },
          { say: 'What fraction did they eat altogether?', ...fracAns(a + b, d), after: `${F(a, d)} + ${F(b, d)} = ${F(a + b, d)}` },
          { say: 'What fraction of the pizza is left?', ...fracAns(d - a - b, d), after: `1 whole = ${F(d, d)}. ${F(d, d)} − ${F(a + b, d)} = ${F(d - a - b, d)}` },
        ],
      };
    },
  };

  const equivalent = {
    id: 'equivalent', title: 'Equivalent fractions', years: [3, 4], icon: '🟰',
    desc: 'Different fractions, same amount.',
    lesson(y) {
      const k = rand(2, 4), [n, d] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]]);
      return [
        { say: `Look at these bars. ${F(1, 2)}, ${F(2, 4)} and ${F(4, 8)} all cover <b>exactly the same amount</b>! They are <b>equivalent</b> fractions.`, show: bars(V.bar(1, 2, { labels: true }), V.bar(2, 4, { labels: true, color: COLS[1] }), V.bar(4, 8, { labels: true, color: COLS[2] })) },
        { say: 'This bar is already cut into <b>8</b> equal parts. Shade <b>one half</b> of it.', try: { type: 'slice', n: 4, d: 8, kind: 'bar', fixed: true, hint: 'Half of 8 parts is 4 parts.' } },
        { say: `Why does it work? If we cut <b>every</b> piece into ${k}, we get ${k} times as many pieces — and ${k} times as many shaded pieces. So we <b>multiply the top and bottom by the same number</b>.`, show: bars(V.bar(n, d), V.bar(n * k, d * k, { color: COLS[1] })) + big(`${F(n, d)} = ${F(n * k, d * k)} &nbsp; <span class="muted">(× ${k})</span>`) },
        { say: 'Find the missing number.', try: (() => { const kk = rand(2, 5), [x, z] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5]]); return { q: `${F(x, z)} = <span class="frac"><span class="box">?</span><span>${z * kk}</span></span>`, answer: x * kk, hint: `${z} × ${kk} = ${z * kk}. Do the same to the top.`, visual: bars(V.bar(x, z), V.bar(0, z * kk, { color: COLS[1] })) }; })() },
        { say: `A <b>family</b> of equivalent fractions keeps going: ${[1, 2, 3, 4, 5].map((m) => F(n * m, d * m)).join(' = ')}…`, show: V.chips([1, 2, 3, 4, 5].map((m) => `${n * m}/${d * m}`)) },
        { say: 'Which one is <b>not</b> in the family?', try: (() => { const fam = [2, 3, 4].map((m) => [n * m, d * m]); const odd = [n * 2 + 1, d * 2]; const items = shuffle([...fam.slice(0, 2), odd]); return { type: 'choice', choices: items.map(([a, b]) => ({ v: fs(a, b), html: F(a, b) })), answer: fs(odd[0], odd[1]), hint: `Check: is the top × ? the same as the bottom × ? for ${fs(n, d)}?` }; })() },
        ...(y >= 4 ? [{ say: `We can also <b>divide</b> top and bottom by the same number: ${F(6, 8)} = ${F(3, 4)} (÷ 2).`, try: { q: `${F(6, 9)} = <span class="frac"><span class="box">?</span><span>3</span></span>`, answer: 2, hint: '9 ÷ 3 = 3. Divide the top by 3 too.' } }] : []),
      ];
    },
    gen(y) {
      const [n, d] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [5, 6]]);
      const k = rand(2, y >= 4 ? 6 : 4), r = Math.random();
      if (r < 0.45) {
        const top = Math.random() < 0.6;
        return { q: top ? `${F(n, d)} = <span class="frac"><span class="box">?</span><span>${d * k}</span></span>` : `${F(n, d)} = <span class="frac"><span>${n * k}</span><span class="box">?</span></span>`, answer: top ? n * k : d * k, visual: d * k <= 24 ? bars(V.bar(n, d), V.bar(n * k, d * k, { color: COLS[1] })) : '', hint: 'Multiply top and bottom by the same number.', steps: [`× ${k}: ${F(n, d)} = ${F(n * k, d * k)}`] };
      }
      if (r < 0.75 && d * k <= 12) return { type: 'slice', q: `This bar has ${d * k} parts. Shade ${F(n, d)} of it.`, n: n * k, d: d * k, kind: 'bar', fixed: true, hint: `${F(n, d)} = ${fs(n * k, d * k)}` };
      const wrong = [[n * k + 1, d * k], [n + 1, d + 1], [n * k, d * k + 1]].filter(([a, b]) => a < b && a * d !== n * b);
      const [wa, wb] = pick(wrong);
      return { type: 'choice', q: `Which fraction is equivalent to ${F(n, d)}?`, choices: shuffle([{ v: fs(n * k, d * k), html: F(n * k, d * k) }, { v: fs(wa, wb), html: F(wa, wb) }]), answer: fs(n * k, d * k), hint: 'Was the top and bottom multiplied by the same number?', steps: [`${F(n, d)} × ${k}/${k} = ${F(n * k, d * k)}`] };
    },
  };

  const fracOf = {
    id: 'fraction-of-amount', title: 'Fraction of an amount', years: [3, 5], icon: '🍬',
    desc: 'Divide by the bottom, multiply by the top.',
    lesson(y) {
      const d = pick([3, 4, 5]), k = rand(2, 4), n = y >= 4 ? rand(2, d - 1) : 1;
      const frames = [
        { say: `What is ${F(1, d)} of ${d * k}? The bottom number says: <b>share into ${d} equal groups</b>.`, show: V.objects(d * k, '🍬', { perRow: d }) },
        { say: `Each group has <b>${k}</b>. So ${F(1, d)} of ${d * k} = ${k}. That's the same as ${d * k} ÷ ${d}!`, show: V.groups(d * k, d, '🍬') },
        { say: 'Your turn. Share them out:', try: (() => { const dd = pick([3, 4, 5]), kk = rand(2, 4); return { type: 'share', total: dd * kk, groups: dd, emoji: '🧁', answer: kk, ask: `So ${F(1, dd)} of ${dd * kk} is…` }; })() },
      ];
      if (y >= 4) {
        frames.push({ say: `Now ${F(n, d)} of ${d * k}. ${F(1, d)} is ${k}. The top number <b>${n}</b> says: take <b>${n}</b> of those groups. ${k} × ${n} = <b>${k * n}</b>.`, show: V.groups(d * k, d, '🍬') + big(`${d * k} ÷ ${d} = ${k} &nbsp;→&nbsp; ${k} × ${n} = ${k * n}`) });
        const dd = pick([3, 4, 5, 6, 8]), nn = rand(2, dd - 1), kk = rand(3, y >= 5 ? 12 : 8);
        frames.push({ say: `Two steps: <b>divide by the bottom</b>, then <b>multiply by the top</b>. Find ${F(nn, dd)} of ${dd * kk}.`, try: { type: 'guided', parts: [{ say: `Step 1: ${dd * kk} ÷ ${dd} = ?  (that's ${F(1, dd)})`, answer: kk }, { say: `Step 2: ${kk} × ${nn} = ?  (that's ${F(nn, dd)})`, answer: kk * nn }] } });
      } else {
        frames.push({ say: 'Use division to answer.', try: (() => { const dd = pick([2, 3, 4, 5, 10]), kk = rand(2, 9); return { q: `${F(1, dd)} of <b>${dd * kk}</b> = ?`, answer: kk, hint: `${dd * kk} ÷ ${dd}` }; })() });
      }
      return frames;
    },
    gen(y) {
      const d = y === 3 ? pick([2, 3, 4, 5, 8, 10]) : pick([3, 4, 5, 6, 8, 10]);
      const n = y === 3 ? 1 : rand(2, d - 1), k = rand(2, y === 3 ? 8 : y === 4 ? 12 : 25);
      const total = d * k;
      if (y === 3 && total <= 24 && Math.random() < 0.4) return { type: 'share', q: `Find ${F(1, d)} of ${total}.`, total, groups: d, emoji: pick(EMO), answer: k, ask: 'How many in each group?' };
      if (n > 1 && Math.random() < 0.6) {
        return { type: 'guided', q: `Find ${F(n, d)} of <b>${fmt(total)}</b>.`, hint: 'Divide by the bottom, multiply by the top.', parts: [{ say: `${fmt(total)} ÷ ${d} = ?`, answer: k, after: `${F(1, d)} of ${fmt(total)} = ${k}` }, { say: `${k} × ${n} = ?`, answer: k * n, after: `${F(n, d)} of ${fmt(total)} = <b>${fmt(k * n)}</b>` }] };
      }
      return { q: `${F(n, d)} of <b>${fmt(total)}</b> = ?`, answer: k * n, hint: `Divide by ${d}${n > 1 ? `, then multiply by ${n}` : ''}.`, steps: [`${fmt(total)} ÷ ${d} = ${k}`, n > 1 ? `${k} × ${n} = <b>${k * n}</b>` : `So the answer is <b>${k}</b>.`] };
    },
    word(y) {
      const nm = U.name(), d = pick([3, 4, 5, 8, 10]), n = y === 3 ? 1 : rand(1, d - 1), k = rand(2, y >= 5 ? 20 : 8), tot = d * k;
      const [txt, sc] = pick([
        [`A class has <b>${tot}</b> children. ${F(n, d)} of them walk to school.`, '🚶'],
        [`${nm} has <b>${tot}</b> stickers and gives away ${F(n, d)} of them.`, '⭐'],
        [`A farmer has <b>${tot}</b> chickens. ${F(n, d)} of them are brown.`, '🐔'],
        [`A book has <b>${tot}</b> pages. ${nm} has read ${F(n, d)} of it.`, '📖'],
      ]);
      const parts = [{ say: `First find ${F(1, d)}: ${tot} ÷ ${d} = ?`, answer: k }];
      if (n > 1) parts.push({ say: `Now ${F(n, d)}: ${k} × ${n} = ?`, answer: k * n });
      parts.push({ say: 'How many is that left over (the rest)?', answer: tot - k * n, after: `${tot} − ${k * n} = ${tot - k * n}` });
      return { type: 'guided', scene: sc, story: true, q: txt, parts };
    },
  };

  /* =====================================================================
   * FRACTIONS — Year 5 and 6
   * ===================================================================== */
  const RELATED = [[2, 4], [2, 6], [2, 8], [3, 6], [3, 9], [3, 12], [4, 8], [4, 12], [5, 10], [6, 12]];
  const compareDiff = {
    id: 'compare-different', title: 'Compare fractions with different denominators', years: [5, 6], icon: '⚖️',
    desc: 'Make the pieces the same size first.',
    lesson() {
      return [
        { say: `Which is bigger, ${F(2, 3)} or ${F(3, 4)}? The pieces are different sizes, so it is hard to tell just by looking.`, show: bars(V.bar(2, 3), V.bar(3, 4, { color: COLS[1] })) },
        { say: 'Trick: cut both into the <b>same size pieces</b>. Find a number in both the 3 and 4 times tables: <b>12</b>. That is the <b>common denominator</b>.', show: V.chips(['3, 6, 9, 12', '4, 8, 12'], [0, 1]) },
        { say: `${F(2, 3)} = <b>?/12</b>. We multiplied 3 by 4 to get 12, so multiply the top by 4 too.`, try: { q: `${F(2, 3)} = <span class="frac"><span class="box">?</span><span>12</span></span>`, answer: 8, hint: '2 × 4' } },
        { say: `Now ${F(3, 4)} = ?/12. We multiplied 4 by 3, so multiply the top by 3.`, try: { q: `${F(3, 4)} = <span class="frac"><span class="box">?</span><span>12</span></span>`, answer: 9, hint: '3 × 3' } },
        { say: `Now the pieces are the same size: ${F(8, 12)} and ${F(9, 12)}. So which is bigger?`, show: bars(V.bar(8, 12), V.bar(9, 12, { color: COLS[1] })), try: { type: 'choice', choices: [{ v: 'a', html: F(2, 3) }, { v: 'b', html: F(3, 4) }], answer: 'b' } },
        (() => { const [b, d] = pick(RELATED), a = coprime(b), c = rand(1, d - 1), A = a * (d / b); const s = A > c ? '>' : A < c ? '<' : '='; return { say: 'Your turn: choose the sign.', try: { type: 'choice', q: `${F(a, b)} <span class="box">?</span> ${F(c, d)}`, choices: ['<', '=', '>'].map((x) => ({ v: x, html: `<span class="sign">${x}</span>` })), answer: s, hint: `Change ${fs(a, b)} into ${d}ths.` } }; })(),
      ];
    },
    gen(y) {
      if (Math.random() < 0.6) {
        let b, d;
        if (y === 5) [b, d] = pick(RELATED); else do { b = rand(2, 10); d = rand(2, 10); } while (b === d);
        const a = coprime(b), c = coprime(d), L = lcm(b, d), A = a * (L / b), C = c * (L / d);
        const s = A > C ? '>' : A < C ? '<' : '=';
        return { type: 'choice', q: `Choose the sign: ${F(a, b)} <span class="box">?</span> ${F(c, d)}`, choices: ['<', '=', '>'].map((x) => ({ v: x, html: `<span class="sign">${x}</span>` })), answer: s, hint: `Common denominator: ${L}.`, steps: [`${F(a, b)} = ${F(A, L)} and ${F(c, d)} = ${F(C, L)}`, `${A} ${s} ${C}, so ${F(a, b)} <b>${s}</b> ${F(c, d)}`] };
      }
      const base = pick([6, 8, 10, 12]);
      const ds = shuffle([...new Set([2, 3, 4, 5, 6, base])].filter((x) => base % x === 0));
      const set = new Map();
      for (const d of ds) { if (set.size >= 3) break; const n = rand(1, d - 1); const v = n / d; if (![...set.keys()].some((x) => Math.abs(x - v) < 1e-9)) set.set(v, F(n, d)); }
      if (set.size < 3) set.set(1 / base, F(1, base));
      return { type: 'order', q: 'Put these fractions in order.', items: [...set.entries()].filter((e, i, arr) => arr.findIndex((z) => Math.abs(z[0] - e[0]) < 1e-9) === i).map(([v, html]) => ({ v, html })), dir: 'asc', hint: `Change them all into ${base}ths first.` };
    },
  };

  const improper = {
    id: 'improper-mixed', title: 'Improper fractions and mixed numbers', years: [5, 6], icon: '🥧',
    desc: 'More than one whole: 7/4 = 1 ¾',
    lesson() {
      const d = pick([3, 4, 5]), n = d + rand(1, d - 1) + (Math.random() < 0.5 ? d : 0);
      return [
        { say: `${F(7, 4)} means 7 quarters. But one pie only has 4 quarters! So we need <b>more than one pie</b>. This is an <b>improper fraction</b> (top bigger than bottom).`, show: V.shape(7, 4, 'pie', { size: 110 }) },
        { say: `4 quarters fill <b>1 whole</b> pie. 3 quarters are left over. So ${F(7, 4)} = <b>1 whole and ${F(3, 4)}</b> = ${mixed(7, 4)}. That's a <b>mixed number</b>.`, show: V.shape(7, 4, 'pie', { size: 110 }) + big(`${F(7, 4)} = ${mixed(7, 4)}`) },
        { say: `Your turn: change ${F(n, d)} into a mixed number.`, show: V.shape(n, d, 'pie', { size: 100 }), try: { type: 'guided', parts: [{ say: `How many whole pies? (How many ${d}s fit into ${n}?)`, answer: Math.floor(n / d) }, { say: `How many ${d === 3 ? 'thirds' : d === 4 ? 'quarters' : 'fifths'} are left over?`, answer: n % d, after: `${F(n, d)} = ${mixed(n, d)}` }] } },
        { say: `Going back: ${mixed(7, 3)} → thirds. Each whole is 3 thirds, so 2 wholes = 6 thirds. Plus 1 more third = <b>7 thirds</b>.`, show: V.shape(7, 3, 'pie', { size: 100, color: COLS[1] }) + big(`2 × 3 + 1 = 7 &nbsp;→&nbsp; ${F(7, 3)}`) },
        (() => { const dd = pick([2, 3, 4, 5, 6]), w = rand(1, 3), r = rand(1, dd - 1); return { say: 'Your turn: write it as an improper fraction.', try: { q: `${mixed(w * dd + r, dd)} = <span class="frac"><span class="box">?</span><span>${dd}</span></span>`, answer: w * dd + r, hint: `${w} × ${dd} + ${r}` } }; })(),
      ];
    },
    gen() {
      const d = rand(2, 8), w = rand(1, 4), r = rand(1, d - 1), n = w * d + r;
      if (Math.random() < 0.5) return { type: 'guided', q: `Change ${F(n, d)} into a mixed number.`, visual: n <= 24 ? V.shape(n, d, 'pie', { size: 80 }) : '', parts: [{ say: `How many wholes? (${n} ÷ ${d})`, answer: w }, { say: 'How many parts left over?', answer: r, after: `${F(n, d)} = <b>${mixed(n, d)}</b>` }] };
      return { q: `${mixed(n, d)} = <span class="frac"><span class="box">?</span><span>${d}</span></span>`, answer: n, hint: `Wholes × ${d}, then add the extra parts.`, steps: [`${w} × ${d} = ${w * d}`, `${w * d} + ${r} = <b>${n}</b>`] };
    },
  };

  const addRelated = {
    id: 'add-related', title: 'Add and subtract with related denominators', years: [5, 6], icon: '➕',
    desc: 'Change one fraction so the bottoms match.',
    lesson() {
      return [
        { say: `${F(1, 2)} + ${F(1, 4)}. Halves and quarters are <b>different sized pieces</b>. We can't just add them… but we can change the halves into quarters!`, show: bars(V.bar(1, 2), V.bar(1, 4, { color: COLS[1] })) },
        { say: `4 is in the 2 times table, so halves can turn into quarters: ${F(1, 2)} = ?/4`, show: bars(V.bar(1, 2), V.bar(2, 4)), try: { q: `${F(1, 2)} = <span class="frac"><span class="box">?</span><span>4</span></span>`, answer: 2, hint: '2 × 2 = 4, so top × 2.' } },
        { say: `Now the pieces match: ${F(2, 4)} + ${F(1, 4)} = ?`, try: Object.assign(fracAns(3, 4), { hint: 'Add the tops.' }) },
        { say: `Taking away is the same: ${F(5, 6)} − ${F(1, 3)}. Change thirds into sixths: ${F(1, 3)} = ${F(2, 6)}.`, show: bars(V.bar(5, 6), V.bar(2, 6, { color: COLS[1] })), try: Object.assign(fracAns(3, 6), { q: `${F(5, 6)} − ${F(2, 6)} = ?`, hint: '5 − 2' }) },
        (() => { const [b, d] = pick(RELATED), a = coprime(b), c = rand(1, d - 1), A = a * (d / b); return { say: 'Your turn, all steps:', try: { type: 'guided', q: `${F(a, b)} + ${F(c, d)}`, parts: [{ say: `${F(a, b)} = ?/${d}`, answer: A }, { say: `${F(A, d)} + ${F(c, d)} = ?`, ...fracAns(A + c, d) }] } }; })(),
      ];
    },
    gen() {
      const [b, d] = pick(RELATED), a = coprime(b), A = a * (d / b);
      const sub = Math.random() < 0.45;
      let c = rand(1, d - 1);
      if (sub && c >= A) c = rand(1, Math.max(1, A - 1));
      if (sub && c >= A) return this.gen();
      const r = sub ? A - c : A + c, op = sub ? '−' : '+';
      if (Math.random() < 0.5) return { type: 'guided', q: `${F(a, b)} ${op} ${F(c, d)} = ?`, parts: [{ say: `Change ${F(a, b)} into ${d}ths: ${F(a, b)} = ?/${d}`, answer: A }, { say: `${F(A, d)} ${op} ${F(c, d)} = ?`, ...fracAns(r, d), after: simpNote(r, d) }] };
      return Object.assign(fracAns(r, d), { q: `${F(a, b)} ${op} ${F(c, d)} = ?`, hint: `Change ${fs(a, b)} into ${d}ths.`, steps: [`${F(a, b)} = ${F(A, d)}`, `${F(A, d)} ${op} ${F(c, d)} = ${F(r, d)}`, simpNote(r, d)] });
    },
  };

  const mulWhole = {
    id: 'multiply-whole', title: 'Multiply a fraction by a whole number', years: [5, 6], icon: '✖️',
    desc: '3 × 2/5 means 2/5 + 2/5 + 2/5.',
    lesson() {
      return [
        { say: `3 × ${F(2, 5)} means <b>3 lots of ${F(2, 5)}</b>: ${F(2, 5)} + ${F(2, 5)} + ${F(2, 5)}.`, show: bars(V.bar(2, 5), V.bar(2, 5), V.bar(2, 5)) },
        { say: 'Add them up: 2 + 2 + 2 fifths = how many fifths?', try: { q: `${F(2, 5)} + ${F(2, 5)} + ${F(2, 5)} = <span class="frac"><span class="box">?</span><span>5</span></span>`, answer: 6, hint: '2 + 2 + 2' } },
        { say: `${F(6, 5)} is more than 1 whole: ${F(6, 5)} = ${mixed(6, 5)}. 💡 Shortcut: <b>multiply the top by the whole number</b>. The bottom stays the same, because the pieces are still fifths.`, show: V.shape(6, 5, 'bar', { width: 220, color: COLS[2] }) + big(`3 × ${F(2, 5)} = ${F(6, 5)} = ${mixed(6, 5)}`) },
        (() => { const d = rand(3, 8), n = coprime(d), w = rand(2, 5); return { say: 'Your turn:', try: Object.assign(fracAns(n * w, d), { q: `${w} × ${F(n, d)} = ?`, hint: `${n} × ${w} on top. Bottom stays ${d}.` }) }; })(),
        (() => { const d = pick([3, 4, 5]), n = rand(1, d - 1), w = d * rand(2, 4); return { say: `When the answer is a whole number of wholes, write it simply: 6 × ${F(2, 3)} = ${F(12, 3)} = 4.`, try: { q: `${w} × ${F(n, d)} = ? <span class="muted">(a whole number)</span>`, answer: (n * w) / d, hint: `${n * w} ÷ ${d}` } }; })(),
      ];
    },
    gen() {
      const d = rand(2, 9), n = coprime(d), w = rand(2, 9);
      return Object.assign(fracAns(n * w, d), { q: `${w} × ${F(n, d)} = ?`, hint: 'Multiply the top. Keep the bottom.', steps: [`${n} × ${w} = ${n * w}`, `= ${F(n * w, d)}`, simpNote(n * w, d)] });
    },
    word() {
      const nm = U.name(), d = pick([2, 3, 4]), n = rand(1, d - 1), w = rand(3, 9);
      return { type: 'guided', scene: '🧁', story: true, q: `A cupcake recipe needs ${F(n, d)} of a cup of sugar. ${nm} makes <b>${w}</b> batches.`, parts: [{ say: 'What calculation do we need?', type: 'choice', choices: [{ v: 'm', html: `${w} × ${F(n, d)}` }, { v: 'a', html: `${w} + ${F(n, d)}` }, { v: 'd', html: `${F(n, d)} ÷ ${w}` }], answer: 'm' }, { say: 'How many cups of sugar?', ...fracAns(n * w, d), after: simpNote(n * w, d) }] };
    },
  };

  const simplify = {
    id: 'simplify', title: 'Simplify fractions', years: [5, 6], icon: '✂️',
    desc: 'Divide top and bottom by the biggest common factor.',
    lesson() {
      return [
        { say: `${F(6, 8)} and ${F(3, 4)} cover the same amount. ${F(3, 4)} uses smaller numbers, so it is <b>simpler</b>. Simplifying = finding the equivalent fraction with the smallest numbers.`, show: bars(V.bar(6, 8), V.bar(3, 4, { color: COLS[1] })) },
        { say: 'Find the <b>highest common factor</b> (HCF): the biggest number that divides into the top AND the bottom. Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18.', show: V.chips(['1', '2', '3', '6'], [3]), try: { type: 'choice', q: `What is the HCF of 12 and 18?`, choices: [{ v: '2', html: '2' }, { v: '3', html: '3' }, { v: '6', html: '6' }], answer: '6', hint: 'The biggest number in both lists.' } },
        { say: `Divide top and bottom by 6: ${F(12, 18)} = ?`, try: Object.assign(fracAns(2, 3, true), { q: `${F(12, 18)} = ?`, hint: '12 ÷ 6 and 18 ÷ 6.' }) },
        (() => { const [a, b] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [5, 6], [3, 8]]), k = rand(2, 6); return { say: 'Your turn. Simplify fully (use the HCF):', try: Object.assign(fracAns(a, b, true), { q: `${F(a * k, b * k)} = ?`, hint: `Both divide by ${k}.` }) }; })(),
      ];
    },
    gen() {
      const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 7], [3, 8], [5, 8], [7, 10], [5, 12]]);
      const k = rand(2, 8);
      if (Math.random() < 0.4) {
        const common = [];
        for (let x = 2; x < k; x++) if ((a * k) % x === 0 && (b * k) % x === 0) common.push(x);
        const opts = [...new Set([k, ...shuffle(common), k + 1, k * 2])].slice(0, 3);
        return { type: 'guided', q: `Simplify ${F(a * k, b * k)}.`, parts: [
          { say: `What is the <b>highest</b> common factor of ${a * k} and ${b * k}?`, type: 'choice', choices: shuffle(opts).map((x) => ({ v: String(x), html: String(x) })), answer: String(k), hint: 'The biggest number that divides into both.' },
          { say: 'Now divide top and bottom by it:', ...fracAns(a, b, true) },
        ] };
      }
      return Object.assign(fracAns(a, b, true), { q: `Simplify ${F(a * k, b * k)} fully.`, hint: 'Divide top and bottom by the biggest number that goes into both.', steps: [`HCF of ${a * k} and ${b * k} is ${k}.`, `${a * k} ÷ ${k} = ${a}, ${b * k} ÷ ${k} = ${b}`, `= <b>${F(a, b)}</b>`] });
    },
  };

  const addAny = {
    id: 'add-subtract-any', title: 'Add and subtract any fractions', years: [6, 6], icon: '🔀',
    desc: 'Find a common denominator, convert, then add.',
    lesson() {
      return [
        { say: `${F(1, 3)} + ${F(1, 4)}: thirds and quarters. Neither turns into the other, so we find a <b>common multiple</b> of 3 and 4.`, show: V.chips(['3, 6, 9, 12, 15', '4, 8, 12, 16'], [0, 1]), try: { q: 'Smallest number in both the 3 and 4 times tables?', answer: 12 } },
        { say: `Change both into twelfths: ${F(1, 3)} = ?/12`, try: { q: `${F(1, 3)} = <span class="frac"><span class="box">?</span><span>12</span></span>`, answer: 4, hint: '3 × 4 = 12, so 1 × 4.' } },
        { say: `${F(1, 4)} = ?/12`, try: { q: `${F(1, 4)} = <span class="frac"><span class="box">?</span><span>12</span></span>`, answer: 3, hint: '4 × 3 = 12, so 1 × 3.' } },
        { say: `Now add: ${F(4, 12)} + ${F(3, 12)} = ${F(7, 12)}.`, show: bars(V.bar(4, 12), V.bar(3, 12, { color: COLS[1] }), V.bar(7, 12, { color: COLS[2] })) + big(`${F(1, 3)} + ${F(1, 4)} = ${F(7, 12)}`) },
        (() => { let b, d; do { b = rand(2, 6); d = rand(2, 6); } while (b === d || b % d === 0 || d % b === 0); const a = coprime(b), c = coprime(d), L = lcm(b, d); return { say: 'Your turn, step by step:', try: { type: 'guided', q: `${F(a, b)} + ${F(c, d)}`, parts: [{ say: `Common denominator of ${b} and ${d}?`, answer: L }, { say: `${F(a, b)} = ?/${L}`, answer: a * (L / b) }, { say: `${F(c, d)} = ?/${L}`, answer: c * (L / d) }, { say: 'Add them:', ...fracAns(a * (L / b) + c * (L / d), L), after: simpNote(a * (L / b) + c * (L / d), L) }] } }; })(),
      ];
    },
    gen() {
      let b, d;
      do { b = rand(2, 8); d = rand(2, 8); } while (b === d || b % d === 0 || d % b === 0);
      let a = coprime(b), c = coprime(d);
      const sub = Math.random() < 0.45;
      if (sub && a / b < c / d) [a, b, c, d] = [c, d, a, b];
      const L = lcm(b, d), A = a * (L / b), C = c * (L / d), r = sub ? A - C : A + C, op = sub ? '−' : '+';
      if (Math.random() < 0.5) return { type: 'guided', q: `${F(a, b)} ${op} ${F(c, d)} = ?`, parts: [{ say: `Common denominator of ${b} and ${d}?`, answer: L }, { say: `${F(a, b)} = ?/${L}`, answer: A }, { say: `${F(c, d)} = ?/${L}`, answer: C }, { say: `${F(A, L)} ${op} ${F(C, L)} = ?`, ...fracAns(r, L), after: simpNote(r, L) }] };
      return Object.assign(fracAns(r, L), { q: `${F(a, b)} ${op} ${F(c, d)} = ?`, hint: `Use ${L} as the common denominator.`, steps: [`${F(a, b)} = ${F(A, L)}`, `${F(c, d)} = ${F(C, L)}`, `${F(A, L)} ${op} ${F(C, L)} = ${F(r, L)}`, simpNote(r, L)] });
    },
    word() {
      let b, d;
      do { b = rand(2, 6); d = rand(2, 6); } while (b === d);
      const [x, z] = U.twoNames(), L = lcm(b, d), used = L / b + L / d;
      return { type: 'guided', scene: '🎂', story: true, q: `${x} eats ${F(1, b)} of a cake. ${z} eats ${F(1, d)} of the same cake. What fraction is <b>left</b>?`, parts: [{ say: 'Common denominator?', answer: L }, { say: 'How much was eaten altogether?', ...fracAns(used, L) }, { say: `The whole cake is ${F(L, L)}. What is left?`, ...fracAns(L - used, L), after: simpNote(L - used, L) }] };
    },
  };

  const mulFrac = {
    id: 'multiply-fractions', title: 'Multiply fractions', years: [6, 6], icon: '🟪',
    desc: 'Multiply tops, multiply bottoms. “× ½” means “half of”.',
    lesson() {
      return [
        { say: `${F(1, 2)} × ${F(1, 3)} means <b>${F(1, 2)} of ${F(1, 3)}</b>. Here is a third (pink rows)…`, show: areaFrac(0, 2, 1, 3) },
        { say: `…and now take <b>half</b> of it (blue columns). The purple overlap is the answer: <b>1</b> square out of <b>6</b>. ${F(1, 2)} × ${F(1, 3)} = ${F(1, 6)}.`, show: areaFrac(1, 2, 1, 3) },
        { say: 'Here is 2/3 × 3/4. Count the purple squares and all squares.', show: areaFrac(2, 3, 3, 4), try: Object.assign(fracAns(6, 12), { q: `${F(2, 3)} × ${F(3, 4)} = ?`, hint: 'Purple squares over all squares.' }) },
        { say: `💡 Shortcut: <b>multiply the tops</b> (2 × 3 = 6) and <b>multiply the bottoms</b> (3 × 4 = 12). ${F(6, 12)} simplifies to ${F(1, 2)}.`, show: big(`${F(2, 3)} × ${F(3, 4)} = ${F(6, 12)} = ${F(1, 2)}`) },
        (() => { const b = rand(2, 6), d = rand(2, 6), a = coprime(b), c = coprime(d); return { say: 'Your turn:', try: Object.assign(fracAns(a * c, b * d), { q: `${F(a, b)} × ${F(c, d)} = ?`, hint: 'Tops × tops, bottoms × bottoms.' }) }; })(),
      ];
    },
    gen() {
      const b = rand(2, 8), d = rand(2, 8), a = coprime(b), c = coprime(d);
      return Object.assign(fracAns(a * c, b * d), { q: `${F(a, b)} × ${F(c, d)} = ?`, visual: b * d <= 30 && Math.random() < 0.5 ? areaFrac(a, b, c, d) : '', hint: 'Multiply the tops, multiply the bottoms.', steps: [`${a} × ${c} = ${a * c}`, `${b} × ${d} = ${b * d}`, `= ${F(a * c, b * d)}`, simpNote(a * c, b * d)] });
    },
  };

  const divWhole = {
    id: 'divide-by-whole', title: 'Divide a fraction by a whole number', years: [6, 6], icon: '➗',
    desc: 'Share a fraction into equal parts.',
    lesson() {
      return [
        { say: `${F(1, 2)} ÷ 3: share <b>half a pizza</b> between 3 people. Each person gets a piece that is ${F(1, 6)} of the whole pizza!`, show: row(V.pie(1, 2, { size: 120 }), '<span class="op">→</span>', V.pie(1, 6, { size: 120, color: COLS[1] })) },
        { say: 'Why sixths? Cutting each half into 3 makes 6 pieces in the whole. 💡 So we <b>multiply the bottom number</b> by 3.', show: big(`${F(1, 2)} ÷ 3 = ${F(1, 6)}`), try: Object.assign(fracAns(1, 8), { q: `${F(1, 4)} ÷ 2 = ?`, hint: 'Multiply the bottom by 2.' }) },
        { say: `Sometimes it is easier: ${F(4, 5)} ÷ 2 — 4 fifths shared by 2 is <b>2 fifths</b> each. When the top divides exactly, just divide the top.`, show: bars(V.bar(4, 5), V.bar(2, 5, { color: COLS[2] })), try: Object.assign(fracAns(3, 7), { q: `${F(6, 7)} ÷ 2 = ?`, hint: '6 ÷ 2 on top.' }) },
        (() => { const d = rand(2, 5), n = coprime(d), w = rand(2, 4); return { say: 'Your turn:', try: Object.assign(fracAns(n, d * w), { q: `${F(n, d)} ÷ ${w} = ?`, hint: `Multiply the bottom by ${w}.` }) }; })(),
      ];
    },
    gen() {
      const w = rand(2, 5);
      if (Math.random() < 0.4) { const d = rand(3, 9), k = rand(1, Math.max(1, Math.floor((d - 1) / w))); const n = k * w; if (n < d) return Object.assign(fracAns(k, d), { q: `${F(n, d)} ÷ ${w} = ?`, hint: `${n} ÷ ${w} on top.`, steps: [`${n} ÷ ${w} = ${k}`, `= ${F(k, d)}`] }); }
      const d = rand(2, 8), n = coprime(d);
      return Object.assign(fracAns(n, d * w), { q: `${F(n, d)} ÷ ${w} = ?`, hint: `Multiply the bottom by ${w}.`, steps: [`${d} × ${w} = ${d * w}`, `= ${F(n, d * w)}`, simpNote(n, d * w)] });
    },
  };

  const multiStep = {
    id: 'fraction-problems', title: 'Multi-step fraction problems', years: [6, 6], icon: '🧩',
    desc: 'Fractions of amounts in real life, step by step.',
    lesson() {
      return [
        { say: 'A shop has <b>120</b> balloons. It sells <b>¼</b> on Monday and <b>⅓ of the rest</b> on Tuesday. How many are left? Read carefully: “of the rest” means of what is left, not of 120!', show: V.objects(12, '🎈', { perRow: 12 }) + '<p class="center muted">(each 🎈 = 10 balloons)</p>' },
        { say: 'Step 1: ¼ of 120 = 120 ÷ 4.', try: { q: `${F(1, 4)} of 120 = ?`, answer: 30 } },
        { say: 'Step 2: what is left after Monday?', try: { q: '120 − 30 = ?', answer: 90 } },
        { say: 'Step 3: ⅓ of the rest: ⅓ of 90.', try: { q: `${F(1, 3)} of 90 = ?`, answer: 30 } },
        { say: 'Step 4: how many are left at the end? 90 − 30 = <b>60</b> balloons. 🎈 Always ask: of WHAT are we taking the fraction?', try: { q: 'How many balloons are left?', answer: 60 } },
      ];
    },
    gen() { return this.word(); },
    word() {
      const d1 = pick([2, 4, 5]), d2 = pick([2, 3, 4]), k = rand(2, 10), tot = d1 * d2 * k * (d1 === 2 ? 2 : 1);
      const n1 = d1 === 2 ? 1 : rand(1, d1 - 1), first = (tot / d1) * n1, rest = tot - first, second = rest / d2;
      if (!Number.isInteger(second)) return this.word();
      const [name] = U.twoNames();
      const [thing, sc] = pick([['eggs', '🥚'], ['tickets', '🎟️'], ['books', '📚'], ['apples', '🍎']]);
      return {
        type: 'guided', scene: sc, story: true,
        q: `${name} has <b>${tot}</b> ${thing}. ${name} uses ${F(n1, d1)} of them, then gives away ${F(1, d2)} <b>of the rest</b>. How many are left?`,
        parts: [
          { say: `${F(n1, d1)} of ${tot} = ?`, answer: first },
          { say: `The rest: ${tot} − ${first} = ?`, answer: rest },
          { say: `${F(1, d2)} of ${rest} = ?`, answer: second },
          { say: 'How many are left?', answer: rest - second, suffix: thing },
        ],
      };
    },
  };

  /* ---------------- fraction explorer ---------------- */
  function exploreFractions(root, y) {
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Cut the shape into equal parts and colour some in.</p>
        <div class="ex-controls">
          <label>Equal parts (bottom) <input type="range" id="d" min="1" max="12" value="4"><output id="od"></output></label>
          <label>Coloured parts (top) <input type="range" id="n" min="0" max="24" value="3"><output id="on"></output></label>
        </div>
        <div class="ex-stage" id="stage"></div>
      </div>`;
    const D = root.querySelector('#d'), N = root.querySelector('#n'), stage = root.querySelector('#stage');
    function draw() {
      const d = +D.value;
      N.max = y >= 5 ? d * 2 : d;
      if (+N.value > +N.max) N.value = N.max;
      const n = +N.value;
      root.querySelector('#od').textContent = d;
      root.querySelector('#on').textContent = n;
      const g = gcd(n, d) || 1;
      stage.innerHTML = `<div class="ex-eq big">${F(n, d)}${n > d && d > 1 ? ` = ${mixed(n, d)}` : ''}</div>
        <div class="row-center">${V.shape(n, d, 'pie', { size: 150 })}${V.shape(n, d, 'bar', { width: 280, height: 50, color: '#60a5fa' })}</div>
        <div class="facts">
          <p><b>Same as:</b> ${[2, 3, 4].map((k) => F(n * k, d * k)).join(' = ')}</p>
          ${g > 1 && n ? `<p><b>Simplest form:</b> ${F(n / g, d / g)}</p>` : ''}
          ${y >= 4 ? `<p><b>Decimal:</b> ${fmt(U.round(n / d, 3))}${y >= 5 ? ` &nbsp;·&nbsp; <b>Percent:</b> ${fmt(U.round((n / d) * 100, 1))}%` : ''}</p>` : ''}
          ${n === d ? '<p>🎉 All parts coloured: that is <b>1 whole</b>!</p>' : n === 0 ? '<p>Nothing coloured: that is <b>0</b>.</p>' : ''}
        </div>`;
    }
    D.oninput = draw; N.oninput = draw;
    draw();
  }

  TOPICS.push({
    id: 'fractions', name: 'Fractions', icon: '🍕', color: '#ec4899', minYear: 1,
    tagline: 'Halves, quarters and parts of a whole',
    explore: exploreFractions,
    skills: [halves, quarters, halfAmount, quarterAmount, thirds, countHQ, unitNon, tenths, numberLineFr, compareSame, equivalent, addSame, fracOf, compareDiff, improper, addRelated, mulWhole, simplify, addAny, mulFrac, divWhole, multiStep],
  });

  /* =====================================================================
   * DECIMALS & PERCENTAGES — Year 4 to 6
   * ===================================================================== */
  const d2 = (x) => U.fmt(U.round(x, 2));
  const pvDec = (x) => {
    const w = Math.floor(x), t = Math.floor(U.round(x * 10, 4)) % 10, h = Math.round(x * 100) % 10;
    return `<table class="pv-table"><tr><th class="o">Ones</th><th></th><th class="h">Tenths</th><th class="t">Hundredths</th></tr><tr><td class="o">${w}</td><td>.</td><td class="h">${t}</td><td class="t">${h}</td></tr></table>`;
  };

  const tenthsHundredths = {
    id: 'tenths-hundredths', title: 'Tenths and hundredths', years: [4, 5], icon: '💯',
    desc: 'Decimals are another way to write tenths and hundredths.',
    lesson() {
      const t = rand(2, 8), h = rand(11, 89);
      return [
        { say: `Cut 1 whole into 10 equal parts: each is a <b>tenth</b>. We can write ${F(3, 10)} as a <b>decimal</b>: <b>0.3</b>. The dot is the <b>decimal point</b>; it separates wholes from parts.`, show: V.bar(3, 10, { width: 400, labels: true }) + big(`${F(3, 10)} = 0.3`) },
        { say: 'How many tenths are shaded? Write it as a decimal.', show: V.bar(t, 10, { width: 400, color: COLS[1] }), try: { answer: t / 10, decimals: true, placeholder: '0.?', hint: `${t} tenths = 0.${t}` } },
        { say: 'Now cut each tenth into 10 again: that makes <b>100</b> tiny squares. Each square is a <b>hundredth</b>, 0.01. One row of 10 squares = 1 tenth.', show: grid100(1) },
        { say: `Here ${h} squares are shaded: ${h} hundredths = <b>${d2(h / 100)}</b>. That's ${Math.floor(h / 10)} full rows (tenths) and ${h % 10} more squares (hundredths).`, show: grid100(h) + pvDec(h / 100) },
        (() => { const n = rand(12, 95); return { say: 'Your turn: write the shaded part as a decimal.', show: grid100(n, { color: COLS[2] }), try: { answer: n / 100, decimals: true, placeholder: '0.??', hint: `${n} hundredths: ${Math.floor(n / 10)} tenths and ${n % 10} hundredths.` } }; })(),
        (() => { const x = rand(101, 999) / 100; return { say: 'In this number, what digit is in the <b>tenths</b> place?', try: { q: `${d2(x)}`, answer: Math.floor(U.round(x * 10, 4)) % 10, hint: 'The first digit after the decimal point.' } }; })(),
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.35) { const n = rand(5, 98); return { q: 'Write the shaded part as a decimal.', visual: grid100(n, { color: pick(COLS) }), answer: n / 100, decimals: true, hint: 'Count rows (tenths) and extra squares (hundredths).', steps: [`${n} hundredths = <b>${d2(n / 100)}</b>`] }; }
      if (r < 0.55) { const t = rand(1, 9); return { q: 'Write the shaded part as a decimal.', visual: V.bar(t, 10, { width: 400, color: pick(COLS) }), answer: t / 10, decimals: true, hint: 'Each part is one tenth, 0.1.' }; }
      if (r < 0.8) { const x = rand(101, 999) / 100, place = pick(['tenths', 'hundredths']); return { q: `In <b>${d2(x)}</b>, which digit is in the <b>${place}</b> place?`, visual: '', answer: place === 'tenths' ? Math.floor(U.round(x * 10, 4)) % 10 : Math.round(x * 100) % 10, hint: 'Tenths come first after the point, then hundredths.', steps: [pvDec(x)] }; }
      const t = rand(1, 9), h = rand(0, 9);
      return { type: 'guided', q: `Write <b>${t} tenths and ${h} hundredths</b> as a decimal.`, parts: [{ say: 'How many hundredths is that altogether?', answer: t * 10 + h, after: `${t} tenths = ${t * 10} hundredths` }, { say: 'Now write it as a decimal:', answer: (t * 10 + h) / 100, decimals: true }] };
    },
  };

  const FDP = [[1, 2, 0.5, 50], [1, 4, 0.25, 25], [3, 4, 0.75, 75], [1, 10, 0.1, 10], [3, 10, 0.3, 30], [7, 10, 0.7, 70], [1, 5, 0.2, 20], [2, 5, 0.4, 40], [1, 100, 0.01, 1], [9, 10, 0.9, 90]];
  const fracDec = {
    id: 'fractions-decimals', title: 'Fractions as decimals', years: [4, 6], icon: '🔁',
    desc: '½ = 0.5, ¼ = 0.25, ¾ = 0.75 …',
    lesson() {
      return [
        { say: `Tenths are easy: ${F(7, 10)} = 0.7. Hundredths too: ${F(23, 100)} = 0.23.`, show: big(`${F(7, 10)} = 0.7 &nbsp; ${F(23, 100)} = 0.23`) },
        { say: `${F(1, 2)} is the same as ${F(5, 10)} (equivalent fractions!). So ${F(1, 2)} = <b>0.5</b>.`, show: bars(V.bar(1, 2), V.bar(5, 10, { color: COLS[1] })) },
        { say: `${F(1, 4)} = ${F(25, 100)} = <b>0.25</b>. Look: a quarter of the grid is 25 squares.`, show: grid100(25), try: { q: `${F(3, 4)} as a decimal = ?`, answer: 0.75, decimals: true, hint: `${F(3, 4)} = ${F(75, 100)}` } },
        { say: 'Remember these! They come up all the time.', show: V.chips(['½ = 0.5', '¼ = 0.25', '¾ = 0.75', '⅕ = 0.2', '1/10 = 0.1']), try: { type: 'choice', q: `Which decimal is the same as ${F(1, 5)}?`, choices: [{ v: '0.2', html: '0.2' }, { v: '0.5', html: '0.5' }, { v: '0.15', html: '0.15' }], answer: '0.2', hint: `${F(1, 5)} = ${F(2, 10)}` } },
      ];
    },
    gen(y) {
      const pool = y === 4 ? FDP.filter((f) => [2, 4, 10, 100].includes(f[1])) : FDP;
      const [n, d, dec] = pick(pool);
      if (Math.random() < 0.5) {
        const others = shuffle(pool.filter((f) => f[2] !== dec)).slice(0, 2).map((f) => f[2]);
        return { type: 'choice', q: `Which decimal is equal to ${F(n, d)}?`, choices: shuffle([dec, ...others]).map((v) => ({ v: String(v), html: d2(v) })), answer: String(dec), hint: d === 10 || d === 100 ? 'Tenths and hundredths go straight after the point.' : `Change ${fs(n, d)} into tenths or hundredths.`, steps: [`${F(n, d)} = <b>${d2(dec)}</b>`] };
      }
      if (Math.random() < 0.5) { const t = rand(1, 99); return { q: `Write ${F(t, 100)} as a decimal.`, answer: t / 100, decimals: true, hint: 'Hundredths fill 2 places after the point.', steps: [`${F(t, 100)} = <b>${d2(t / 100)}</b>`] }; }
      return Object.assign(fracAns(n, d), { q: `Write <b>${d2(dec)}</b> as a fraction.`, hint: 'How many tenths or hundredths?', steps: [`${d2(dec)} = ${F(Math.round(dec * 100), 100)} = ${F(n, d)}`] });
    },
  };

  const compareDec = {
    id: 'compare-decimals', title: 'Compare and order decimals', years: [4, 6], icon: '⚖️',
    desc: 'Line up the points and compare digit by digit.',
    lesson() {
      return [
        { say: 'Which is bigger, <b>0.5</b> or <b>0.45</b>? Careful! 45 looks bigger than 5… but let\'s check.', show: big('0.5 &nbsp;or&nbsp; 0.45 ?') },
        { say: 'Line up the decimal points and fill the gap with a zero: 0.<b>5</b>0 and 0.<b>4</b>5. Compare the <b>tenths</b> first: 5 tenths beats 4 tenths. So 0.5 is bigger!', show: pvDec(0.5) + pvDec(0.45) },
        { say: 'Which is bigger?', try: (() => { const t = rand(2, 9), x = t / 10, z = U.round((t - 1) / 10 + rand(1, 9) / 100, 2); return { type: 'choice', choices: shuffle([{ v: String(x), html: d2(x) }, { v: String(z), html: d2(z) }]), answer: String(x), hint: 'Compare the tenths digit first.' }; })() },
        { say: 'On a number line, bigger numbers are further right.', show: decLine(0.3, 0.6, 100, { step: 10, points: [{ v: 0.45, label: '0.45', color: '#ef4444' }, { v: 0.5, label: '0.5', color: '#16a34a' }] }) },
        (() => { const vals = new Set([rand(1, 9) / 10]); while (vals.size < 3) vals.add(Math.random() < 0.5 ? rand(11, 99) / 100 : rand(1, 9) / 10); return { say: 'Your turn: order from smallest to biggest.', try: { type: 'order', items: [...vals].map((v) => ({ v, html: d2(v) })), dir: 'asc', hint: 'Line up the points. Compare tenths, then hundredths.' } }; })(),
      ];
    },
    gen(y) {
      const mk = () => U.round(rand(0, y >= 5 ? 20 : 9) + (Math.random() < 0.5 ? rand(1, 99) / 100 : rand(1, 9) / 10), 2);
      if (Math.random() < 0.5) {
        let a = mk(), b = mk();
        if (Math.random() < 0.5) { const w = Math.floor(a); a = U.round(w + rand(1, 9) / 10, 2); b = U.round(w + rand(11, 99) / 100, 2); }
        if (a === b) b = U.round(b + 0.01, 2);
        const s = a > b ? '>' : '<';
        return { type: 'choice', q: `Choose the sign: <b>${d2(a)}</b> <span class="box">?</span> <b>${d2(b)}</b>`, choices: ['<', '=', '>'].map((x) => ({ v: x, html: `<span class="sign">${x}</span>` })), answer: s, hint: 'Line up the decimal points. Compare wholes, then tenths, then hundredths.', steps: [`${d2(a)} ${s} ${d2(b)}`] };
      }
      const set = new Set();
      while (set.size < (y >= 5 ? 4 : 3)) set.add(mk());
      return { type: 'order', q: 'Put these decimals in order.', items: [...set].map((v) => ({ v, html: d2(v) })), dir: Math.random() < 0.7 ? 'asc' : 'desc', hint: 'Line up the decimal points.' };
    },
  };

  const roundDec = {
    id: 'round-decimals', title: 'Round decimals', years: [4, 6], icon: '🎯',
    desc: 'To the nearest whole number or tenth.',
    lesson(y) {
      const w = rand(2, 8), t = rand(1, 9), x = w + t / 10;
      return [
        { say: `Round <b>${d2(x)}</b> to the nearest whole number. It lives between <b>${w}</b> and <b>${w + 1}</b>. Which one is it closer to?`, show: decLine(w, w + 1, 10, { points: [{ v: x, label: d2(x), color: '#7c3aed' }] }) },
        { say: `The half way point is <b>${w}.5</b>. Look at the tenths digit: <b>${t}</b>. 5 or more → round <b>up</b>. Less than 5 → round <b>down</b>.`, show: decLine(w, w + 1, 10, { points: [{ v: w + 0.5, label: 'half way', color: '#f59e0b' }, { v: x, label: d2(x), color: '#7c3aed' }] }), try: { q: `${d2(x)} rounded to the nearest whole number = ?`, answer: t >= 5 ? w + 1 : w, hint: t >= 5 ? 'The tenths digit is 5 or more.' : 'The tenths digit is less than 5.' } },
        ...(y >= 5 ? [(() => { let h2; do { h2 = rand(101, 999); } while (h2 % 10 === 0); const x2 = h2 / 100, r = Math.round(h2 / 10) / 10; return { say: `To round to the nearest <b>tenth</b> (1 decimal place), look at the <b>hundredths</b> digit instead. ${d2(x2)} is between ${d2(Math.floor(x2 * 10) / 10)} and ${d2(Math.ceil(x2 * 10) / 10)}.`, show: decLine(Math.floor(x2 * 10) / 10, Math.ceil(x2 * 10) / 10, 100, { points: [{ v: x2, label: d2(x2), color: '#7c3aed' }] }), try: { q: `${d2(x2)} to the nearest tenth = ?`, answer: r, decimals: true, hint: 'Look at the hundredths digit.' } }; })()]
          : [(() => { const x3 = rand(11, 99) / 10; return { say: 'One more:', try: { q: `Round ${d2(x3)} to the nearest whole number.`, answer: Math.round(x3), hint: 'Look at the tenths digit.' } }; })()]),
        { say: '💡 Rounding helps with <b>estimating</b>: ' + d2(x) + ' + 2.1 is about ' + (t >= 5 ? w + 1 : w) + ' + 2 = ' + ((t >= 5 ? w + 1 : w) + 2) + '.', show: '' },
      ];
    },
    gen(y) {
      if (y >= 5 && Math.random() < 0.5) {
        let x; do { x = rand(101, 2999) / 100; } while (Math.round(x * 100) % 10 === 0);
        const r = Math.round(Math.round(x * 100) / 10) / 10;
        return { q: `Round <b>${d2(x)}</b> to the nearest tenth (1 decimal place).`, answer: r, decimals: true, hint: 'Look at the hundredths digit: 5 or more rounds up.', steps: [decLine(Math.floor(x * 10) / 10, Math.ceil(x * 10) / 10, 100, { points: [{ v: x, label: d2(x), color: '#7c3aed' }] }), `${d2(x)} → <b>${d2(r)}</b>`] };
      }
      const x = y === 4 ? rand(11, 199) / 10 : rand(101, 9999) / 100;
      const w = Math.floor(x);
      const rw = Math.round(Math.round(x * 100) / 100 + 1e-9);
      return { q: `Round <b>${d2(x)}</b> to the nearest whole number.`, answer: rw, hint: 'Look at the tenths digit.', steps: [decLine(w, w + 1, 10, { points: [{ v: Math.round(x * 10) / 10, label: d2(x), color: '#7c3aed' }] }), `${d2(x)} → <b>${rw}</b>`] };
    },
  };

  const percent = {
    id: 'percentages', title: 'What is a percentage?', years: [5, 6], icon: '💯',
    desc: 'Per cent means “out of 100”.',
    lesson() {
      const n = rand(12, 88);
      return [
        { say: '<b>Per cent</b> means <b>“out of 100”</b>. The sign is <b>%</b>. This grid has 100 squares. 37 shaded squares = <b>37%</b>.', show: grid100(37) },
        { say: 'What percentage is shaded?', show: grid100(n, { color: COLS[2] }), try: { answer: n, suffix: '%', hint: 'Count rows of 10, then the extra squares.' } },
        { say: 'The whole grid is <b>100%</b>. So if 30% is shaded, how much is <b>not</b> shaded?', show: grid100(30), try: { answer: 70, suffix: '%', hint: '100 − 30' } },
        { say: 'Some to remember: 50% = half, 25% = a quarter, 10% = one tenth, 100% = everything!', show: row(grid100(50, { cell: 12 }), grid100(25, { cell: 12, color: COLS[1] }), grid100(10, { cell: 12, color: COLS[2] })), try: { type: 'choice', q: '25% is the same as…', choices: [{ v: 'q', html: 'a quarter' }, { v: 'h', html: 'a half' }, { v: 't', html: 'a tenth' }], answer: 'q' } },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.4) { const n = rand(3, 97); return { q: 'What percentage is shaded?', visual: grid100(n, { color: pick(COLS) }), answer: n, suffix: '%', hint: 'Out of 100 squares.' }; }
      if (r < 0.7) { const n = rand(5, 95); return { q: `${n}% of a garden is grass. What percentage is <b>not</b> grass?`, answer: 100 - n, suffix: '%', hint: 'The whole garden is 100%.', steps: [`100 − ${n} = <b>${100 - n}%</b>`] }; }
      const n = rand(1, 99);
      return { q: `${n} out of 100 children like football. What percentage is that?`, answer: n, suffix: '%', hint: 'Out of 100 → per cent.' };
    },
  };

  const fdpConvert = {
    id: 'fractions-decimals-percentages', title: 'Fractions, decimals and percentages', years: [5, 6], icon: '🔄',
    desc: 'Three ways to write the same amount.',
    lesson() {
      return [
        { say: `${F(1, 2)}, 0.5 and 50% are three ways to say the same thing: <b>half</b>.`, show: row(V.pie(1, 2, { size: 110 }), grid100(50, { cell: 11 })) + big(`${F(1, 2)} = 0.5 = 50%`) },
        { say: 'Decimal → percent: <b>multiply by 100</b> (move the digits 2 places). 0.37 = 37%. 0.4 = 40%.', try: { q: '0.6 = ?%', answer: 60, suffix: '%', hint: '0.6 = 0.60 → 60 hundredths.' } },
        { say: `Fraction → percent: make it <b>out of 100</b>. ${F(3, 5)} = ${F(60, 100)} = 60%.`, try: { q: `${F(1, 4)} = ?%`, answer: 25, suffix: '%', hint: `${F(1, 4)} = ${F(25, 100)}` } },
        { say: 'Match them up!', show: `<table class="rules">${FDP.slice(0, 7).map(([n, d, dec, p]) => `<tr><td>${F(n, d)}</td><td>${d2(dec)}</td><td>${p}%</td></tr>`).join('')}</table>`, try: { type: 'choice', q: 'Which is the biggest?', choices: shuffle([{ v: 'a', html: '0.7' }, { v: 'b', html: '65%' }, { v: 'c', html: F(3, 5) }]), answer: 'a', hint: 'Turn them all into percentages: 70%, 65%, 60%.' } },
      ];
    },
    gen() {
      const [n, d, dec, p] = pick(FDP);
      const r = Math.random();
      if (r < 0.3) return { q: `${F(n, d)} = ?%`, answer: p, suffix: '%', hint: 'Make it out of 100.', steps: [`${F(n, d)} = ${F(p, 100)} = <b>${p}%</b>`] };
      if (r < 0.55) return { q: `${d2(dec)} = ?%`, answer: p, suffix: '%', hint: 'Multiply by 100.' };
      if (r < 0.75) return { q: `${p}% as a decimal = ?`, answer: dec, decimals: true, hint: 'Divide by 100.' };
      const vals = shuffle(FDP).slice(0, 3);
      const items = vals.map(([a, b, c, q], i) => ({ v: q / 100, html: i === 0 ? F(a, b) : i === 1 ? d2(c) : q + '%' }));
      if (new Set(items.map((x) => x.v)).size < 3) return this.gen();
      return { type: 'order', q: 'Put these in order.', items, dir: 'asc', hint: 'Change them all into percentages first.' };
    },
  };

  const percentOf = {
    id: 'percentage-of-amount', title: 'Percentage of an amount', years: [5, 6], icon: '🏷️',
    desc: 'Find 10%, 50%, 25%… then build any percent.',
    lesson() {
      return [
        { say: '<b>10%</b> means 10 out of 100 = one tenth. So to find 10%, <b>divide by 10</b>. 10% of 80 = 8.', show: V.chips(['10% of 80 = 80 ÷ 10 = 8']) },
        { say: 'Your turn:', try: { q: '10% of 60 = ?', answer: 6, hint: '60 ÷ 10' } },
        { say: '<b>50%</b> = half (÷ 2). <b>25%</b> = a quarter (÷ 4). <b>5%</b> = half of 10%.', show: V.chips(['50% of 40 = 20', '25% of 40 = 10', '5% of 40 = 2']) },
        { say: 'Build other percents from 10%! 30% = 3 × 10%. Find 30% of 70.', try: { type: 'guided', parts: [{ say: '10% of 70 = ?', answer: 7 }, { say: '30% = 3 × 10%. 3 × 7 = ?', answer: 21 }] } },
        (() => { const amt = pick([40, 60, 80, 120, 200]); return { say: 'Your turn:', try: { q: `25% of ${amt} = ?`, answer: amt / 4, hint: 'A quarter: divide by 4.' } }; })(),
      ];
    },
    gen() {
      const pct = pick([10, 50, 25, 20, 30, 5, 75, 40]);
      const amt = pick([20, 40, 60, 80, 120, 160, 200, 240, 300, 400]);
      const ans = (amt * pct) / 100;
      if (!Number.isInteger(ans)) return this.gen();
      if ([20, 30, 40].includes(pct)) return { type: 'guided', q: `Find ${pct}% of <b>${amt}</b>.`, parts: [{ say: `10% of ${amt} = ?`, answer: amt / 10 }, { say: `${pct}% = ${pct / 10} × 10%. ${pct / 10} × ${amt / 10} = ?`, answer: ans }] };
      if (pct === 75) return { type: 'guided', q: `Find 75% of <b>${amt}</b>.`, parts: [{ say: `25% of ${amt} = ?`, answer: amt / 4 }, { say: `75% = 3 × 25%. 3 × ${amt / 4} = ?`, answer: ans }] };
      return { q: `${pct}% of <b>${amt}</b> = ?`, answer: ans, hint: pct === 10 ? 'Divide by 10.' : pct === 50 ? 'Half.' : pct === 25 ? 'Divide by 4.' : 'Half of 10%.', steps: [`<b>${ans}</b>`] };
    },
    word() {
      const sym = U.settings.currency, price = pick([20, 40, 60, 80, 120]), pct = pick([10, 20, 25, 50]);
      const off = (price * pct) / 100;
      const it = pick(['jacket', 'bike helmet', 'pair of trainers', 'board game', 'backpack']);
      return {
        type: 'guided', scene: '🏷️', story: true,
        q: `A ${it} costs <b>${sym}${price}</b>. In the sale it is <b>${pct}% off</b>. What is the sale price?`,
        parts: [
          { say: `How much is ${pct}% of ${sym}${price}?`, answer: off, prefix: sym, hint: pct === 25 ? '÷ 4' : pct === 50 ? 'half' : pct === 20 ? '10% × 2' : '÷ 10' },
          { say: 'Take it away from the price. Sale price?', answer: price - off, prefix: sym, after: `${sym}${price} − ${sym}${off} = ${sym}${price - off}` },
        ],
      };
    },
  };

  /* ---------------- decimals explorer ---------------- */
  function exploreDecimals(root) {
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Shade squares in the hundred grid. Watch the fraction, decimal and percentage change together.</p>
        <div class="ex-controls"><label>Shaded squares <input type="range" id="n" min="0" max="100" value="25"><output id="on"></output></label></div>
        <div class="ex-split"><div id="g"></div><div id="facts" class="side-text"></div></div>
      </div>`;
    const N = root.querySelector('#n');
    function draw() {
      const n = +N.value, g = gcd(n, 100) || 1;
      root.querySelector('#on').textContent = n;
      root.querySelector('#g').innerHTML = grid100(n, { cell: 22 });
      root.querySelector('#facts').innerHTML = `<p class="say-big">${F(n, 100)}${g > 1 && n && n < 100 ? ` = ${F(n / g, 100 / g)}` : ''}</p>
        <p class="say-big">= ${d2(n / 100)}</p><p class="say-big">= ${n}%</p>
        <p class="muted">${Math.floor(n / 10)} tenths and ${n % 10} hundredths</p>`;
    }
    N.oninput = draw;
    draw();
  }

  TOPICS.push({
    id: 'decimals', name: 'Decimals & Percentages', icon: '🔟', color: '#0ea5e9', minYear: 4,
    tagline: 'Tenths, hundredths and per cent',
    explore: exploreDecimals,
    skills: [tenthsHundredths, fracDec, compareDec, roundDec, percent, fdpConvert, percentOf],
  });
})();
