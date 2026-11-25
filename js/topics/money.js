'use strict';
/* Money: coins and notes, counting, making amounts, change, units and cents,
 * shopping lists, estimating, multiplying and sharing, best buys, budgets, discounts, saving. */
(() => {
  const { rand, pick, shuffle, money, cash, fmt } = U;
  const SYM = () => U.settings.currency;
  const UNIT = () => ({ '€': 'euro', '$': 'dollar', '£': 'pound' }[SYM()] || 'unit');
  const UNITS = () => UNIT() + 's';
  const cu = () => U.centUnit();
  const CENTS = () => (cu() === 'p' ? 'pence' : 'cents');
  const total = (l) => l.reduce((s, c) => s + c, 0);
  const ITEMS = [
    ['🍎', 'apple'], ['🍌', 'banana'], ['🧃', 'juice'], ['✏️', 'pencil'], ['📒', 'notebook'], ['🍦', 'ice cream'],
    ['🍪', 'cookie'], ['🎈', 'balloon'], ['⚽', 'ball'], ['🧸', 'teddy bear'], ['📚', 'book'], ['🧢', 'cap'],
    ['🎨', 'paint set'], ['🪀', 'yo-yo'], ['🥪', 'sandwich'], ['🧣', 'scarf'], ['🖍️', 'crayon box'], ['🍭', 'lolly'],
  ];
  const plural = (w) => (/(ch|sh|s|x)$/.test(w) ? w + 'es' : w + 's');
  const price = (lo, hi, step = 5) => rand(Math.ceil(lo / step), Math.floor(hi / step)) * step;
  const tag = (item, p) => `<div class="price-tag"><span class="pt-emoji">${item[0]}</span><span class="pt-name">${item[1]}</span><span class="pt-price">${cash(p)}</span></div>`;
  const shelf = (items) => `<div class="shelf">${items.map(([it, p]) => tag(it, p)).join('')}</div>`;
  const ansC = (c) => ({ answer: c, suffix: cu() });
  const ansM = (c) => ({ type: 'money', answer: c / 100 });
  const ansAmt = (c, y) => (y <= 2 || c < 100 ? ansC(c) : ansM(c));
  const big = (html) => `<div class="say-big">${html}</div>`;

  function randomCoins(allowed, k, maxTotal) {
    for (let tries = 0; tries < 60; tries++) {
      const list = Array.from({ length: k }, () => pick(allowed)).sort((a, b) => b - a);
      if (total(list) <= maxTotal) return list;
    }
    return [Math.min(...allowed)];
  }
  function greedy(t, allowed) {
    const out = [];
    [...allowed].sort((a, b) => b - a).forEach((c) => { while (t >= c) { out.push(c); t -= c; } });
    return out;
  }
  function running(list) {
    let run = 0;
    return `<div class="running">${list.map((c) => { run += c; return `<span class="run">${cash(run)}</span>`; }).join('<span class="arrow">→</span>')}</div>`;
  }
  function countSteps(list) {
    const sorted = [...list].sort((a, b) => b - a);
    return ['Put the coins in order, <b>biggest first</b>. Then count on:', V.coins(sorted), running(sorted), `Total: <b>${cash(total(list))}</b>`];
  }

  /* ---- change by counting up ---- */
  function changeJumps(p, pay) {
    const jumps = [];
    let cur = p;
    const to10 = Math.ceil(cur / 10) * 10;
    if (to10 > cur && to10 < pay) { jumps.push({ from: cur, to: to10 }); cur = to10; }
    const to100 = Math.ceil(cur / 100) * 100;
    if (to100 > cur && to100 < pay) { jumps.push({ from: cur, to: to100 }); cur = to100; }
    if (pay > cur) jumps.push({ from: cur, to: pay });
    jumps.forEach((j) => { j.label = '+' + cash(j.to - j.from); });
    return jumps;
  }
  function changeLine(p, pay, n) {
    const jumps = changeJumps(p, pay).slice(0, n);
    const padv = Math.max(1, (pay - p) * 0.08);
    return V.numberLine({ min: p - padv, max: pay + padv, empty: true, marks: [p, pay], jumps, label: cash });
  }
  function changeSteps(p, pay) {
    const js = changeJumps(p, pay);
    return [
      `Count up from the price <b>${cash(p)}</b> to the money paid <b>${cash(pay)}</b>:`,
      changeLine(p, pay, js.length),
      `${js.map((j) => cash(j.to - j.from)).join(' + ')} = <b>${cash(pay - p)}</b>`,
      `Check: ${cash(p)} + ${cash(pay - p)} = ${cash(pay)} ✔️`,
    ];
  }
  function changeGuided(p, pay, y, item) {
    const js = changeJumps(p, pay);
    return {
      type: 'guided', story: true, scene: item ? item[0] : '🛒',
      q: `${item ? `A ${item[1]}` : 'It'} costs <b>${cash(p)}</b>. You pay with <b>${cash(pay)}</b>. How much change do you get?`,
      visual: changeLine(p, pay, 0),
      hint: `Count up from ${cash(p)} to ${cash(pay)}.`,
      parts: [
        ...js.map((j, k) => ({ say: `Jump ${k + 1}: from <b>${cash(j.from)}</b> up to <b>${cash(j.to)}</b>. How much is that jump?`, ...ansAmt(j.to - j.from, y), after: `${cash(j.from)} + ${cash(j.to - j.from)} = ${cash(j.to)}` })),
        ...(js.length > 1 ? [{ say: `Add up the jumps: ${js.map((j) => cash(j.to - j.from)).join(' + ')}`, ...ansAmt(pay - p, y), after: `The change is <b>${cash(pay - p)}</b>.` }] : []),
      ],
      steps: changeSteps(p, pay),
    };
  }
  function changeNums(y) {
    if (y <= 2) { const pay = pick([20, 50, 100]); return { pay, p: price(pay === 20 ? 3 : 5, pay - 3, 1) }; }
    if (y === 3) { const pay = pick([200, 500, 1000]); return { pay, p: price(pay === 200 ? 105 : 120, pay - 15) }; }
    const pay = pick([1000, 2000]);
    return { pay, p: price(pay === 1000 ? 215 : 760, pay - 15) };
  }

  /* ---- change / difference with column subtraction (Year 3+) ---- */
  const subCol = (aC, bC) => ({ type: 'column', a: aC / 100, b: bC / 100, op: '−', dp: 2, hint: 'Start on the right. Exchange if the top digit is too small.' });
  function colSubSteps(aC, bC) {
    const cm = V.columnMethod(aC / 100, bC / 100, '−', { dp: 2 });
    return [`Write <b>${money(aC)}</b> on top and <b>${money(bC)}</b> underneath. Line up the decimal points.`, ...cm.steps, cm.html, `Answer: <b>${money(aC - bC)}</b>. Check: ${money(bC)} + ${money(aC - bC)} = ${money(aC)} ✔️`];
  }
  function changeColGuided(p, pay, item) {
    return {
      type: 'guided', story: true, scene: item ? item[0] : '🛒',
      q: `${item ? `A ${item[1]}` : 'It'} costs <b>${money(p)}</b>. You pay with <b>${money(pay)}</b>. How much change do you get?`,
      hint: `Change = ${money(pay)} − ${money(p)}.`,
      parts: [
        { say: 'What do we need to work out?', type: 'choice', choices: [{ v: 'sub', html: `${money(pay)} − ${money(p)}` }, { v: 'add', html: `${money(pay)} + ${money(p)}` }], answer: 'sub', after: 'Change = money paid − price.' },
        { say: `Money paid on top, price underneath, decimal points in a line. Subtract column by column:`, ...subCol(pay, p) },
        { say: 'So how much change?', ...ansM(pay - p), after: `Check: ${money(p)} + ${money(pay - p)} = ${money(pay)} ✔️` },
      ],
      steps: colSubSteps(pay, p),
    };
  }

  /* ---- column frames for money (dp 2) ---- */
  const COLNAME = () => ['1' + cu() + ' column', '10' + cu() + ' column', SYM() + '1 column', SYM() + '10 column', SYM() + '100 column'];
  function columnFrames(aC, bC) {
    const frames = [];
    const A = String(aC).split('').reverse().map(Number), B = String(bC).split('').reverse().map(Number);
    const len = String(aC + bC).length;
    let carry = 0;
    for (let c = 0; c < len; c++) {
      const x = A[c], z = B[c];
      const parts = [x, z].filter((v) => v != null);
      const sum = (x || 0) + (z || 0) + carry;
      if (!parts.length) { frames.push({ say: `Only the carried 1 is left. Write it in the ${COLNAME()[c]}.`, show: V.columnMethod(aC / 100, bC / 100, '+', { dp: 2, upto: c + 1 }).html }); break; }
      const expr = parts.join(' + ') + (carry ? ' + 1 (carried)' : '');
      frames.push({
        say: `<b>${U.cap(COLNAME()[c])}:</b> add the digits in this column.${c === 2 ? ' (We have just passed the decimal point: now we add whole ' + UNITS() + '.)' : ''}`,
        show: V.columnMethod(aC / 100, bC / 100, '+', { dp: 2, upto: c, active: c }).html,
        try: { q: `${expr} = ?`, answer: sum },
      });
      if (sum >= 10) frames.push({ say: `${sum} is too big for one box. Write the <b>${sum % 10}</b> and <b>carry 1</b> to the next column on the left.`, show: V.columnMethod(aC / 100, bC / 100, '+', { dp: 2, upto: c + 1, active: c }).html });
      carry = sum >= 10 ? 1 : 0;
    }
    return frames;
  }

  /* ================= Year 1 ================= */
  const coinValues = {
    id: 'coin-values', title: 'Meet the coins and notes', years: [1, 1],
    desc: 'What each coin is worth. A bigger coin is not always more money!',
    lesson() {
      const three = shuffle([1, 2, 5, 10, 20, 50, 100, 200]).slice(0, 3);
      const four = shuffle([1, 2, 5, 10, 20, 50, 500, 1000]).slice(0, 4);
      return [
        { say: `These are our coins! The number on each coin tells you <b>how much it is worth</b>.`, show: V.coins([1, 2, 5, 10, 20, 50, 100, 200]) },
        { say: `Small amounts are in <b>${CENTS()}</b> (${cu()}). <b>100${cu()}</b> make <b>1 ${UNIT()}</b> (${SYM()}1).`, show: `<div class="demo-row">${V.coins([100])}<span class="op">=</span>${V.coins([50, 50])}<span class="op">=</span>${V.coins([20, 20, 20, 20, 20])}</div>` },
        { say: 'Look carefully! The <b>10' + cu() + '</b> coin is <b>smaller</b> than the 5' + cu() + ' coin, but it is worth <b>more</b>. Always read the number, not the size!', show: V.coins([5, 10]),
          try: { q: 'Which coin is worth more?', type: 'choice', choices: shuffle([5, 10]).map((c) => ({ v: String(c), html: V.coin(c) })), answer: '10', hint: 'Read the numbers: 10 is more than 5.' } },
        { say: 'Now find the coin worth the <b>most</b>.', try: { q: 'Which is worth the most?', type: 'choice', choices: three.map((c) => ({ v: String(c), html: V.coin(c) })), answer: String(Math.max(...three)), hint: 'Read each number. Which number is biggest?' } },
        { say: `For bigger amounts we use paper <b>notes</b>. They are worth a lot more than coins.`, show: V.coins([500, 1000, 2000]) },
        { say: 'Last one: find the money worth the <b>least</b>.', try: { q: 'Which is worth the least?', type: 'choice', choices: four.map((c) => ({ v: String(c), html: V.coin(c) })), answer: String(Math.min(...four)), hint: 'The smallest number wins this time.' } },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.35) {
        const c = pick([1, 2, 5, 10, 20, 50]);
        return { q: `How many ${CENTS()} is this coin worth?`, visual: V.coins([c]), ...ansC(c), hint: 'Read the number on the coin.', steps: [`The coin says <b>${V.coinLabel(c)}</b>, so it is worth ${c}${cu()}.`] };
      }
      const most = Math.random() < 0.6;
      const set = shuffle([1, 2, 5, 10, 20, 50, 100, 200, 500]).slice(0, rand(3, 4));
      const ans = most ? Math.max(...set) : Math.min(...set);
      return {
        q: `Which is worth the <b>${most ? 'most' : 'least'}</b>?`, type: 'choice', choices: set.map((c) => ({ v: String(c), html: V.coin(c) })), answer: String(ans),
        hint: 'Read the numbers, not the size of the coin.',
        steps: [`In order: ${[...set].sort((a, b) => a - b).map((c) => V.coinLabel(c)).join(' < ')}.`, `The ${most ? 'most' : 'least'} is <b>${V.coinLabel(ans)}</b>.`],
      };
    },
    word() {
      const [a, b] = U.twoNames();
      let c1 = pick([1, 2, 5, 10, 20, 50]), c2 = pick([1, 2, 5, 10, 20, 50]);
      while (c2 === c1) c2 = pick([1, 2, 5, 10, 20, 50]);
      const win = c1 > c2 ? a : b;
      return {
        q: `${a} has one ${V.coinLabel(c1)} coin. ${b} has one ${V.coinLabel(c2)} coin. Who has more money?`, scene: '🪙', story: true,
        visual: `<div class="demo-row"><b>${a}</b>${V.coins([c1])}<b>${b}</b>${V.coins([c2])}</div>`,
        type: 'choice', choices: [{ v: a, html: a }, { v: b, html: b }], answer: win,
        hint: 'Compare the numbers on the coins.', steps: [`${V.coinLabel(Math.max(c1, c2))} is more than ${V.coinLabel(Math.min(c1, c2))}, so <b>${win}</b> has more.`],
      };
    },
  };

  const countSame = {
    id: 'count-same', title: 'Count coins in 2s, 5s and 10s', years: [1, 1],
    desc: 'When the coins are all the same, count in jumps.',
    lesson() {
      const c = pick([2, 5, 10]), k = rand(3, 6);
      const c2 = pick([2, 5, 10].filter((x) => x !== c)), k2 = rand(3, 6);
      const seq = Array.from({ length: k }, (_, i) => (i + 1) * c + cu());
      return [
        { say: `Here are <b>${k}</b> coins and they are all <b>${V.coinLabel(c)}</b>. Counting 1, 2, 3… would be slow!`, show: V.coins(Array(k).fill(c)) },
        { say: `When coins are the same, <b>count in ${c}s</b>. Touch each coin and say the next number:`, show: V.chips(seq, [k - 1]) },
        { say: `${k} coins of ${V.coinLabel(c)} make <b>${k * c}${cu()}</b>. Now you try with different coins.`, show: V.coins(Array(k2).fill(c2)),
          try: { q: `Count in ${c2}s. How much money?`, ...ansC(k2 * c2), hint: `Count: ${c2}, ${c2 * 2}, ${c2 * 3}…` } },
        { say: 'Remember the counting patterns:', show: `<p><b>2s:</b></p>${V.chips([2, 4, 6, 8, 10, 12, 14, 16, 18, 20])}<p><b>5s:</b></p>${V.chips([5, 10, 15, 20, 25, 30, 35, 40, 45, 50])}<p><b>10s:</b></p>${V.chips([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])}` },
        (() => { const cc = pick([2, 5, 10]), kk = rand(4, 8); return { say: 'One more! Count in jumps.', show: V.coins(Array(kk).fill(cc)), try: { q: 'How much money is here?', ...ansC(cc * kk), hint: `Count in ${cc}s.` } }; })(),
      ];
    },
    gen() {
      const c = pick([2, 5, 10]), k = rand(2, 10);
      return { q: 'How much money is here?', visual: V.coins(Array(k).fill(c)), ...ansC(c * k), hint: `Count in ${c}s.`, steps: [`Count in ${c}s:`, V.chips(Array.from({ length: k }, (_, i) => (i + 1) * c + cu()), [k - 1]), `Total: <b>${c * k}${cu()}</b>`] };
    },
    word() {
      const n = U.name(), c = pick([2, 5, 10]), k = rand(3, 9);
      return {
        type: 'guided', story: true, scene: '🐷',
        q: `${n} opens a piggy bank and finds <b>${k}</b> coins. They are all ${V.coinLabel(c)} coins.`, visual: V.coins(Array(k).fill(c)),
        parts: [
          { say: 'What should we count in?', type: 'choice', choices: [2, 5, 10].map((x) => ({ v: String(x), html: `${x}s` })), answer: String(c), after: `Each coin is ${V.coinLabel(c)}, so count in ${c}s.` },
          { say: `How much money does ${n} have?`, ...ansC(c * k) },
        ],
      };
    },
  };

  const countMixed = {
    id: 'count-mixed', title: 'Count mixed coins', years: [1, 2],
    desc: 'Put the coins in order, biggest first, then count on.',
    lesson(y) {
      const allowed = y === 1 ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50];
      const max = y === 1 ? 20 : 100;
      const list = randomCoins(allowed, 4, max);
      const sorted = [...list].sort((a, b) => b - a);
      const n = randomCoins(allowed, rand(3, 4), max);
      const ns = [...n].sort((a, b) => b - a);
      let run = 0;
      return [
        { say: 'These coins are all different. How much money is here? It looks tricky…', show: V.coins(shuffle(list)) },
        { say: '<b>Trick 1:</b> put the coins in order, <b>biggest first</b>.', show: V.coins(sorted) },
        { say: `<b>Trick 2:</b> say the biggest coin, then <b>count on</b> each next coin. ${sorted.map((c) => V.coinLabel(c)).join(', ')}:`, show: running(sorted) },
        { say: `So the total is <b>${cash(total(list))}</b>. Now you count on, one coin at a time.`, show: V.coins(ns),
          try: { type: 'guided', parts: ns.map((c, k) => { run += c; return { say: k === 0 ? `Start with the biggest coin: ${V.coinLabel(c)}. How much so far?` : `Count on ${V.coinLabel(c)}. How much now?`, ...ansC(run) }; }) } },
        (() => { const m = randomCoins(allowed, rand(3, 5), max); return { say: 'Your turn: biggest first, then count on.', try: { q: 'How much money is here?', visual: V.coins(shuffle(m)), ...ansC(total(m)), hint: 'Start with the biggest coin.', steps: countSteps(m) } }; })(),
      ];
    },
    gen(y) {
      const list = y === 1 ? randomCoins([1, 2, 5, 10], rand(2, 4), 20) : randomCoins([1, 2, 5, 10, 20, 50], rand(3, 5), 100);
      return { q: 'How much money is here?', visual: V.coins(shuffle(list)), ...ansC(total(list)), hint: 'Start with the biggest coin, then count on.', steps: countSteps(list) };
    },
    word(y) {
      const n = U.name();
      const list = y === 1 ? randomCoins([1, 2, 5, 10], 3, 20) : randomCoins([1, 2, 5, 10, 20, 50], 4, 100);
      return { q: `${n} finds these coins in a coat pocket. How much money did ${n} find?`, scene: '🧥', story: true, visual: V.coins(shuffle(list)), ...ansC(total(list)), hint: 'Biggest coin first, then count on.', steps: countSteps(list) };
    },
  };

  const makeAmount = {
    id: 'make-amount', title: 'Make an amount with coins', years: [1, 2],
    desc: 'Pick coins that add up to exactly the right amount.',
    lesson(y) {
      const allowed = y === 1 ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50];
      const t = y === 1 ? rand(6, 19) : rand(23, 89);
      const g = greedy(t, allowed);
      let left = t;
      const trail = g.map((c) => { left -= c; return `${V.coinLabel(c)} <span class="muted">(${left}${cu()} left)</span>`; });
      return [
        { say: `In a shop you often need to pay the <b>exact</b> money. Let's make <b>${t}${cu()}</b>.`, show: big(`${t}${cu()}`) },
        { say: `Start with the <b>biggest coin that is not too big</b>. Then see how much is still missing, and do it again.`, show: `<div class="running">${trail.map((s) => `<span class="run">${s}</span>`).join('<span class="arrow">→</span>')}</div>${V.coins(g)}` },
        { say: 'Your turn! Tap the coins to put them in the tray. The total shows how much you have.', try: { type: 'coins', q: `Make exactly <b>${y === 1 ? rand(5, 15) : rand(20, 60)}${cu()}</b>`, target: 0, allowed } },
        { say: 'There is often <b>more than one way</b> to make an amount. Any way is fine if the total is right!', show: `<div class="demo-row">${V.coins([10])}<span class="op">=</span>${V.coins([5, 5])}<span class="op">=</span>${V.coins([5, 2, 2, 1])}</div>` },
        { say: 'One more!', try: { type: 'coins', q: `Make exactly <b>${y === 1 ? rand(8, 20) : rand(40, 99)}${cu()}</b>`, target: 0, allowed } },
      ].map((f) => {
        if (f.try && f.try.type === 'coins') f.try.target = +f.try.q.match(/(\d+)/)[1];
        return f;
      });
    },
    gen(y) {
      const allowed = y === 1 ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50];
      const t = y === 1 ? rand(3, 20) : rand(15, 99);
      return { type: 'coins', q: `Make exactly <b>${t}${cu()}</b>`, target: t, allowed, hint: 'Start with the biggest coin that is not too big.', steps: [`One way: ${greedy(t, allowed).map((c) => V.coinLabel(c)).join(' + ')} = ${t}${cu()}`] };
    },
    word(y) {
      const it = pick(ITEMS), t = y === 1 ? rand(5, 20) : rand(25, 95);
      return { type: 'coins', scene: it[0], story: true, q: `A ${it[1]} costs <b>${t}${cu()}</b>. Pay with the exact coins.`, target: t, allowed: y === 1 ? [1, 2, 5, 10] : [1, 2, 5, 10, 20, 50], hint: 'Biggest coin first.' };
    },
  };

  /* ================= Year 2 ================= */
  const waysFewest = {
    id: 'ways-fewest', title: 'Different ways and fewest coins', years: [2, 3],
    desc: 'Many ways to make the same amount — and the way with the fewest coins.',
    lesson(y) {
      const allowed = y === 2 ? [1, 2, 5, 10, 20, 50] : [1, 2, 5, 10, 20, 50, 100, 200];
      const t = y === 2 ? pick([30, 40, 60, 70]) : pick([150, 250, 300, 350]);
      const w1 = greedy(t, allowed);
      const w2 = greedy(t, allowed.filter((c) => c < w1[0]));
      const ways = [w1, w2, greedy(t, allowed.filter((c) => c < w2[0]))];
      const f = y === 2 ? rand(31, 98) : rand(120, 390);
      const fg = greedy(f, allowed);
      const opts = makeSetChoices(y === 2 ? rand(25, 80) : rand(110, 300), allowed);
      return [
        { say: `There are lots of ways to make <b>${cash(t)}</b>. Here are three of them:`, show: ways.map((w) => V.coins(w)).join('') },
        { say: 'Which group of coins makes the amount? Count each group carefully.', try: opts },
        { say: `The way with the <b>fewest coins</b> uses the biggest coins you can. To make <b>${cash(f)}</b>: take the biggest coin that fits, then the next…`, show: `${V.coins(fg)}<p class="center">${fg.map((c) => V.coinLabel(c)).join(' + ')} = ${cash(f)} → <b>${fg.length} coins</b></p>` },
        (() => { const g = y === 2 ? rand(31, 98) : rand(120, 390); const gg = greedy(g, allowed); return { say: 'Your turn: what is the smallest number of coins you need?', try: { q: `Fewest coins to make <b>${cash(g)}</b>?`, answer: gg.length, suffix: 'coins', hint: 'Biggest coin that fits, again and again.', steps: [`${gg.map((c) => V.coinLabel(c)).join(' + ')} = ${cash(g)}`, `That is <b>${gg.length}</b> coins.`] } }; })(),
        (() => { const g = y === 2 ? rand(20, 90) : rand(105, 350); return { say: 'Now make it with coins. Try to use as few as you can!', try: { type: 'coins', q: `Make <b>${cash(g)}</b>`, target: g, allowed } }; })(),
      ];
    },
    gen(y) {
      const allowed = y === 2 ? [1, 2, 5, 10, 20, 50] : [1, 2, 5, 10, 20, 50, 100, 200];
      const r = Math.random();
      if (r < 0.35) return makeSetChoices(y === 2 ? rand(15, 95) : rand(105, 395), allowed);
      if (r < 0.7) {
        const g = y === 2 ? rand(13, 99) : rand(105, 399), gg = greedy(g, allowed);
        return { q: `What is the fewest number of coins to make <b>${cash(g)}</b>?`, answer: gg.length, suffix: 'coins', hint: 'Use the biggest coins you can.', steps: [`${gg.map((c) => V.coinLabel(c)).join(' + ')} = ${cash(g)}`, `<b>${gg.length}</b> coins.`] };
      }
      const g = y === 2 ? rand(15, 99) : rand(105, 399);
      return { type: 'coins', q: `Make <b>${cash(g)}</b> using coins`, target: g, allowed, hint: 'Biggest coin that fits first.' };
    },
  };
  function makeSetChoices(t, allowed) {
    const right = shuffle(greedy(t, allowed.filter((c) => c <= t)));
    const sets = [right];
    while (sets.length < 3) {
      const wrongT = t + pick([-1, 1]) * pick([1, 2, 5, 10]);
      if (wrongT <= 0) continue;
      const w = shuffle(greedy(wrongT, allowed));
      if (!sets.some((s) => total(s) === total(w))) sets.push(w);
    }
    const labels = ['A', 'B', 'C'];
    const sh = shuffle(sets);
    return {
      q: `Which group makes exactly <b>${cash(t)}</b>?`, type: 'choice',
      choices: sh.map((s, i) => ({ v: labels[i], html: `<b>${labels[i]}</b>${V.coins(s)}` })), answer: labels[sh.indexOf(right)],
      hint: 'Count each group: biggest coin first.', steps: sh.map((s, i) => `${labels[i]}: ${cash(total(s))}`),
    };
  }

  const totalTwo = {
    id: 'total-two', title: 'Total cost of two things', years: [2, 2],
    desc: 'Add two prices: tens first, then ones.',
    lesson() {
      const [i1, i2] = shuffle(ITEMS);
      const p1 = rand(21, 58), p2 = rand(12, 39);
      const T = p2 - (p2 % 10), O = p2 % 10;
      const n1 = rand(15, 55), n2 = rand(11, 99 - n1 > 40 ? 40 : 99 - n1);
      return [
        { say: `You want a ${i1[1]} and a ${i2[1]}. How much do they cost <b>altogether</b>? “Altogether” means we <b>add</b>.`, show: shelf([[i1, p1], [i2, p2]]) },
        { say: `Start with the first price, <b>${p1}${cu()}</b>. Split the second price into tens and ones: ${p2}${cu()} = ${T}${cu()} + ${O}${cu()}.`, show: V.jumpLine(V.splitJumps(p1, p2), cash) },
        { say: 'First jump: add the tens.', try: { q: `${p1}${cu()} + ${T}${cu()} = ?`, ...ansC(p1 + T), hint: `Count on in 10s from ${p1}.` } },
        { say: 'Second jump: add the ones.', try: { q: `${p1 + T}${cu()} + ${O}${cu()} = ?`, ...ansC(p1 + p2) } },
        { say: `So the two things cost <b>${p1 + p2}${cu()}</b> altogether. Now try a whole one!`, try: { q: `What is the total of <b>${n1}${cu()}</b> and <b>${n2}${cu()}</b>?`, ...ansC(n1 + n2), hint: 'Add the tens, then the ones.', steps: [V.jumpLine(V.splitJumps(n1, n2), cash)] } },
      ];
    },
    gen() {
      const [i1, i2] = shuffle(ITEMS);
      const p1 = rand(5, 60), p2 = rand(5, 99 - p1);
      return { q: `What is the total cost?`, visual: shelf([[i1, p1], [i2, p2]]), ...ansC(p1 + p2), hint: 'Add the tens, then the ones.', steps: [`${p1}${cu()} + ${p2}${cu()}`, V.jumpLine(V.splitJumps(p1, p2), cash), `= <b>${p1 + p2}${cu()}</b>`] };
    },
    word() {
      const n = U.name(), [i1, i2] = shuffle(ITEMS);
      const p1 = rand(10, 50), p2 = rand(10, 45);
      return {
        type: 'guided', story: true, scene: '🛒',
        q: `${n} buys a ${i1[1]} for <b>${p1}${cu()}</b> and a ${i2[1]} for <b>${p2}${cu()}</b>. How much does ${n} spend?`,
        parts: [
          { say: 'Do we add or take away?', type: 'choice', choices: [{ v: '+', html: 'Add ➕' }, { v: '−', html: 'Take away ➖' }], answer: '+', after: 'We want the total, so we add.' },
          { say: `${p1}${cu()} + ${p2}${cu()} = ?`, ...ansC(p1 + p2) },
        ],
      };
    },
  };

  const change = {
    id: 'change', title: 'Find the change by counting up', years: [2, 2],
    desc: 'Shopkeepers count up from the price to the money paid.',
    lesson(y) {
      const { p, pay } = changeNums(y);
      const js = changeJumps(p, pay);
      const it = pick(ITEMS);
      const n = changeNums(y);
      const frames = [
        { say: `A ${it[1]} costs <b>${cash(p)}</b>. You pay with <b>${cash(pay)}</b>. You paid too much, so the shop gives some money back. That money is your <b>change</b>.`, show: shelf([[it, p]]) + V.coins([pay]) },
        { say: `The change is the <b>difference</b> between ${cash(pay)} and ${cash(p)}. Shopkeepers find it by <b>counting up</b> from the price to the money paid — no hard taking away!`, show: changeLine(p, pay, 0) },
      ];
      js.forEach((j, k) => {
        const why = j.to % 100 === 0 && j.to !== pay ? `the next whole ${UNIT()} (${cash(j.to)})` : j.to % 10 === 0 && j.to !== pay ? `the next ten (${cash(j.to)})` : `the money paid (${cash(j.to)})`;
        frames.push({
          say: `<b>Jump ${k + 1}:</b> from ${cash(j.from)} up to ${why}. How much is that jump?`,
          show: changeLine(p, pay, k),
          try: { q: `${cash(j.from)} → ${cash(j.to)}: how much?`, ...ansAmt(j.to - j.from, y), hint: `${cash(j.from)} + ? = ${cash(j.to)}` },
        });
      });
      frames.push({ say: `Add up all the jumps: ${js.map((j) => cash(j.to - j.from)).join(' + ')}.`, show: changeLine(p, pay, js.length), try: { q: 'How much change?', ...ansAmt(pay - p, y) } });
      frames.push({ say: `Your change is <b>${cash(pay - p)}</b>. ✔️ Check: ${cash(p)} + ${cash(pay - p)} = ${cash(pay)}.`, show: changeLine(p, pay, js.length) });
      frames.push({ say: 'Now you do every jump! 💪', try: changeGuided(n.p, n.pay, y, pick(ITEMS)) });
      return frames;
    },
    gen(y) {
      const { p, pay } = changeNums(y);
      const it = pick(ITEMS);
      if (Math.random() < 0.5) return changeGuided(p, pay, y, it);
      return { q: `A ${it[1]} costs <b>${cash(p)}</b>. You pay with ${cash(pay)}. How much change?`, visual: shelf([[it, p]]) + V.coins([pay]), ...ansAmt(pay - p, y), hint: `Count up from ${cash(p)} to ${cash(pay)}.`, steps: changeSteps(p, pay) };
    },
    word(y) {
      const n = U.name(), it = pick(ITEMS);
      const { p, pay } = changeNums(y);
      const g = changeGuided(p, pay, y, it);
      g.q = `${n} buys a ${it[1]} for <b>${cash(p)}</b> and pays with <b>${cash(pay)}</b>. How much change should ${n} get back?`;
      return g;
    },
  };

  const changeColumn = {
    id: 'change-column', title: 'Find the change with column subtraction', years: [3, 4],
    desc: 'Money paid − price, written in columns with the decimal points lined up.',
    lesson(y) {
      const { p, pay } = changeNums(y);
      const it = pick(ITEMS);
      const n = changeNums(y);
      const zeros = pay % 100 === 0;
      return [
        { say: `A ${it[1]} costs <b>${money(p)}</b>. You pay with <b>${money(pay)}</b>. The shop gives back the extra money: that is your <b>change</b>.`, show: shelf([[it, p]]) + V.coins([pay]) },
        { say: `The change is what is <b>left</b> after paying the price. So we <b>take away</b>: money paid − price.`, show: big(`change = ${money(pay)} − ${money(p)}`),
          try: { q: 'Which calculation finds the change?', type: 'choice', choices: shuffle([{ v: 'sub', html: `${money(pay)} − ${money(p)}` }, { v: 'add', html: `${money(pay)} + ${money(p)}` }, { v: 'rev', html: `${money(p)} − ${money(pay)}` }]), answer: 'sub', hint: 'Start with the money you paid, then take away the price.' } },
        { say: `Write it <b>vertically</b>. The money paid goes on top, the price underneath. ${zeros ? `${money(pay)} has <b>0 ${CENTS()}</b>: we still write both zeros after the point, so every column has a digit.` : ''} The <b>decimal points must be in a line</b>, so ${UNITS()} sit under ${UNITS()} and ${CENTS()} under ${CENTS()}.`,
          show: V.columnMethod(pay / 100, p / 100, '−', { dp: 2, blank: true }).html,
          try: zeros ? { q: `How do we write ${SYM()}${pay / 100} with ${CENTS()}?`, type: 'choice', choices: shuffle([{ v: 'a', html: `${SYM()}${pay / 100}.00` }, { v: 'b', html: `${SYM()}${pay / 100}.0` }, { v: 'c', html: `${SYM()}0.${pay / 100}` }]), answer: 'a', hint: `Money always has two digits after the point.` }
            : { q: `How many ${CENTS()} are in ${money(p)}?`, answer: p % 100, suffix: cu() } },
        { say: `Now subtract, starting on the <b>right</b>. When the top digit is too small, <b>exchange</b> from the column next door${zeros ? ' — if it is 0, it must first exchange from its own neighbour' : ''}. The helper will guide you.`,
          try: subCol(pay, p) },
        { say: `The change is <b>${money(pay - p)}</b>. ✔️ Always check by adding it back: price + change should give the money paid.`,
          try: { q: `${money(p)} + ${money(pay - p)} = ?`, ...ansM(pay), hint: 'Add the cents, then the whole amounts.' } },
        { say: 'Your turn: the whole thing, from the shop to the answer! 💪', try: changeColGuided(n.p, n.pay, pick(ITEMS)) },
      ];
    },
    gen(y) {
      const { p, pay } = changeNums(y);
      const it = pick(ITEMS);
      if (Math.random() < 0.5) return changeColGuided(p, pay, it);
      return { q: `A ${it[1]} costs <b>${money(p)}</b>. You pay with ${money(pay)}. Work out the change in columns.`, visual: shelf([[it, p]]) + V.coins([pay]), ...subCol(pay, p), steps: colSubSteps(pay, p) };
    },
    word(y) {
      const nm = U.name(), it = pick(ITEMS);
      const { p, pay } = changeNums(y);
      const g = changeColGuided(p, pay, it);
      g.q = `${nm} buys a ${it[1]} for <b>${money(p)}</b> and pays with <b>${money(pay)}</b>. How much change should ${nm} get back?`;
      return g;
    },
  };

  const compare = {
    id: 'compare', title: 'Who has more money?', years: [2, 2],
    desc: 'Compare amounts by their value, not by how many coins.',
    lesson() {
      const [a, b] = U.twoNames();
      const setA = [2, 1, 2, 1], setB = [10];
      const mk = () => { const x = randomCoins([1, 2, 5, 10, 20, 50], rand(2, 4), 100); let z = randomCoins([1, 2, 5, 10, 20, 50], rand(2, 4), 100); while (total(z) === total(x)) z = randomCoins([1, 2, 5, 10, 20, 50], rand(2, 4), 100); return [x, z]; };
      const [x, z] = mk();
      const v1 = rand(10, 99); let v2 = rand(10, 99); while (v2 === v1) v2 = rand(10, 99);
      return [
        { say: `${a} has 4 coins. ${b} has only 1 coin. Who has more money? 🤔`, show: `<div class="demo-row"><b>${a}</b>${V.coins(setA)}<b>${b}</b>${V.coins(setB)}</div>` },
        { say: `Count the <b>value</b>, not the number of coins! ${a}: 2 + 2 + 1 + 1 = <b>6${cu()}</b>. ${b}: <b>10${cu()}</b>. So <b>${b}</b> has more, with just one coin!`, show: `<div class="demo-row">${big('6' + cu() + ' &lt; 10' + cu())}</div>` },
        { say: 'Your turn: count each group, then choose.', try: { q: 'Which group is worth more?', type: 'choice', choices: [{ v: 'A', html: `<b>A</b>${V.coins(x)}` }, { v: 'B', html: `<b>B</b>${V.coins(z)}` }], answer: total(x) > total(z) ? 'A' : 'B', steps: [`A = ${cash(total(x))}, B = ${cash(total(z))}`] } },
        { say: 'We can write it with signs. <b>&gt;</b> means “is more than”, <b>&lt;</b> means “is less than”. The open mouth eats the bigger amount! 🐊', show: big(`50${cu()} &gt; 20${cu()} &nbsp; · &nbsp; 5${cu()} &lt; 10${cu()}`) },
        { say: 'Choose the right sign.', try: { q: `${v1}${cu()} <span class="box">?</span> ${v2}${cu()}`, type: 'choice', choices: ['<', '>'].map((s) => ({ v: s, html: `<span class="sign">${s}</span>` })), answer: v1 > v2 ? '>' : '<' } },
      ];
    },
    gen() {
      if (Math.random() < 0.5) {
        const v1 = rand(5, 99); let v2 = rand(5, 99); if (v2 === v1) v2 = v1 + 1;
        return { q: `${v1}${cu()} <span class="box">?</span> ${v2}${cu()}`, type: 'choice', choices: ['<', '=', '>'].map((s) => ({ v: s, html: `<span class="sign">${s}</span>` })), answer: v1 > v2 ? '>' : '<', hint: 'The open side faces the bigger amount.' };
      }
      const x = randomCoins([1, 2, 5, 10, 20, 50], rand(2, 4), 100);
      let z = randomCoins([1, 2, 5, 10, 20, 50], rand(2, 4), 100);
      while (total(z) === total(x)) z = randomCoins([1, 2, 5, 10, 20, 50], rand(2, 4), 100);
      return { q: 'Which group is worth more?', type: 'choice', choices: [{ v: 'A', html: `<b>A</b>${V.coins(x)}` }, { v: 'B', html: `<b>B</b>${V.coins(z)}` }], answer: total(x) > total(z) ? 'A' : 'B', hint: 'Count each group: biggest coin first.', steps: [`A = ${cash(total(x))}, B = ${cash(total(z))}`] };
    },
  };

  /* ================= Year 3 ================= */
  const unitsCents = {
    id: 'units-cents', years: [3, 4],
    get title() { return `${U.cap(UNITS())} and ${CENTS()}: change between them`; },
    get desc() { return `Write money with a decimal point. 100${cu()} = ${SYM()}1.`; },
    lesson(y) {
      const a = y === 3 ? rand(1, 9) * 100 + rand(11, 99) : rand(10, 49) * 100 + rand(11, 99);
      const b = rand(1, 9) * 100 + rand(1, 9);
      const c = y === 3 ? rand(101, 999) : rand(1001, 4999);
      const wrong = Math.floor(b / 100) * 100 + (b % 100) * 10;
      return [
        { say: `Remember: <b>100${cu()} = ${SYM()}1</b>. So 200${cu()} = ${SYM()}2, 300${cu()} = ${SYM()}3…`, show: `<div class="demo-row">${V.coins([100])}<span class="op">=</span>${V.coins([50, 50])}<span class="op">=</span>${V.coins([20, 20, 20, 20, 20])}</div>` },
        { say: `We write money with a <b>decimal point</b>. <b>${money(a)}</b> means <b>${Math.floor(a / 100)} ${UNITS()}</b> and <b>${a % 100}${cu()}</b>. The two digits after the point are always the ${CENTS()}.`, show: big(`${money(a)} = ${SYM()}${Math.floor(a / 100)} + ${a % 100}${cu()}`) },
        { say: `To change ${UNITS()} into ${CENTS()}: ${SYM()}${Math.floor(a / 100)} is ${Math.floor(a / 100) * 100}${cu()}. Add the ${a % 100}${cu()}.`, show: V.chips([`${SYM()}${Math.floor(a / 100)} = ${Math.floor(a / 100) * 100}${cu()}`, `+ ${a % 100}${cu()}`, `= ${a}${cu()}`], [2]),
          try: (() => { const t = y === 3 ? rand(101, 999) : rand(1001, 4999); return { q: `${money(t)} = ? ${cu()}`, ...ansC(t), hint: `${SYM()}1 = 100${cu()}. Write the digits without the point.` }; })() },
        { say: `Now the other way. <b>${b}${cu()}</b> = ${Math.floor(b / 100) * 100}${cu()} + ${b % 100}${cu()} = ${SYM()}${Math.floor(b / 100)} and ${b % 100}${cu()}. Careful! ${b % 100}${cu()} is written <b>.0${b % 100}</b>, because ${CENTS()} always need <b>two digits</b>.`, show: big(`${b}${cu()} = ${money(b)}`) },
        { say: `⚠️ ${money(b)} is <b>not</b> ${SYM()}${Math.floor(b / 100)}.${b % 100}! ${SYM()}${Math.floor(b / 100)}.${b % 100} means ${SYM()}${Math.floor(b / 100)}.${b % 100}0 = ${wrong}${cu()}.`,
          try: { q: `Which is the same as <b>${money(b)}</b>?`, type: 'choice', choices: shuffle([b, wrong, Math.floor(b / 100) * 10 + (b % 100), b * 10]).filter((v, i, arr) => arr.indexOf(v) === i).map((v) => ({ v: String(v), html: `${v}${cu()}` })), answer: String(b) } },
        { say: 'Your turn: change these into money with a point.', try: { q: `${c}${cu()} = ?`, ...ansM(c), hint: `Split off the last two digits: they are the ${CENTS()}.` } },
      ];
    },
    gen(y) {
      const c = y === 3 ? (Math.random() < 0.4 ? rand(1, 9) * 100 + rand(1, 9) : rand(101, 999)) : (Math.random() < 0.3 ? rand(10, 49) * 100 + rand(1, 9) : rand(1001, 4999));
      if (Math.random() < 0.5) return { q: `Write <b>${money(c)}</b> in ${CENTS()}.`, ...ansC(c), hint: `${SYM()}1 = 100${cu()}.`, steps: [`${money(c)} = ${SYM()}${Math.floor(c / 100)} and ${c % 100}${cu()}`, `${Math.floor(c / 100) * 100}${cu()} + ${c % 100}${cu()} = <b>${c}${cu()}</b>`] };
      return { q: `Write <b>${c}${cu()}</b> in ${UNITS()} and ${CENTS()}.`, ...ansM(c), hint: `The last two digits are the ${CENTS()}.`, steps: [`${c}${cu()} = ${Math.floor(c / 100) * 100}${cu()} + ${c % 100}${cu()}`, `= <b>${money(c)}</b> (the ${CENTS()} need two digits)`] };
    },
    word(y) {
      const n = U.name(), c = y === 3 ? rand(205, 985) : rand(1005, 3995);
      const list = greedy(c, [200, 100, 50, 20, 10, 5, 2, 1]);
      return {
        type: 'guided', story: true, scene: '🐷',
        q: `${n} counts the coins in a piggy bank and gets <b>${c}${cu()}</b>. The shop label says prices in ${SYM()}.`,
        visual: y === 3 && list.length <= 10 ? V.coins(list) : '',
        parts: [
          { say: `How many whole ${UNITS()} is that?`, answer: Math.floor(c / 100), prefix: SYM(), after: `${Math.floor(c / 100) * 100}${cu()} = ${SYM()}${Math.floor(c / 100)}` },
          { say: `How many ${CENTS()} are left over?`, ...ansC(c % 100) },
          { say: `Write the amount with a decimal point.`, ...ansM(c) },
        ],
      };
    },
  };

  const addSub = {
    id: 'add-sub-money', title: 'Add and take away money', years: [3, 3],
    get desc() { return `Add the ${UNITS()}, then the ${CENTS()}. 100${cu()} make ${SYM()}1.`; },
    lesson() {
      let p1, p2;
      do { p1 = price(115, 480); p2 = price(115, 480); } while ((p1 % 100) + (p2 % 100) < 105);
      const u = Math.floor(p1 / 100) + Math.floor(p2 / 100), c = (p1 % 100) + (p2 % 100);
      const [i1, i2] = shuffle(ITEMS);
      const big1 = price(320, 890), small1 = price(110, big1 - 150);
      return [
        { say: `How much do these two cost together? To add money, add the <b>${UNITS()}</b> first, then the <b>${CENTS()}</b>.`, show: shelf([[i1, p1], [i2, p2]]) },
        { say: `${UNITS()}: ${SYM()}${Math.floor(p1 / 100)} + ${SYM()}${Math.floor(p2 / 100)}`, try: { q: `${Math.floor(p1 / 100)} + ${Math.floor(p2 / 100)} = ?`, answer: u, prefix: SYM() } },
        { say: `${U.cap(CENTS())}: ${p1 % 100}${cu()} + ${p2 % 100}${cu()}`, try: { q: `${p1 % 100}${cu()} + ${p2 % 100}${cu()} = ?`, ...ansC(c) } },
        { say: `${c}${cu()} is more than 100${cu()}! <b>100${cu()} = ${SYM()}1</b>, so ${c}${cu()} = ${SYM()}1 and ${c - 100}${cu()}. Add that ${SYM()}1 to the ${UNITS()}: ${SYM()}${u} + ${SYM()}1 = ${SYM()}${u + 1}.`, show: big(`${SYM()}${u} + ${c}${cu()} = ${money(p1 + p2)}`),
          try: { q: `So ${money(p1)} + ${money(p2)} = ?`, ...ansM(p1 + p2) } },
        { say: `Taking away works the same way. <b>${money(big1)} − ${money(small1)}</b>: take away the ${SYM()}${Math.floor(small1 / 100)} first, then the ${small1 % 100}${cu()}.`, show: V.jumpLine([{ from: big1, to: big1 - Math.floor(small1 / 100) * 100, label: '−' + SYM() + Math.floor(small1 / 100) }, ...(small1 % 100 ? [{ from: big1 - Math.floor(small1 / 100) * 100, to: big1 - small1, label: '−' + (small1 % 100) + cu() }] : [])], cash),
          try: { q: `${money(big1)} − ${money(small1)} = ?`, ...ansM(big1 - small1), hint: `${money(big1)} − ${SYM()}${Math.floor(small1 / 100)} = ${money(big1 - Math.floor(small1 / 100) * 100)}` } },
      ];
    },
    gen() {
      if (Math.random() < 0.5) {
        const p1 = price(105, 495), p2 = price(105, 495);
        return { q: `${money(p1)} + ${money(p2)} = ?`, ...ansM(p1 + p2), hint: `Add the ${UNITS()}, then the ${CENTS()}.`, steps: [`${UNITS()}: ${Math.floor(p1 / 100)} + ${Math.floor(p2 / 100)} = ${Math.floor(p1 / 100) + Math.floor(p2 / 100)}`, `${CENTS()}: ${p1 % 100} + ${p2 % 100} = ${(p1 % 100) + (p2 % 100)}${cu()}`, `Total: <b>${money(p1 + p2)}</b>`] };
      }
      const a = price(300, 990), b = price(105, a - 100);
      return { q: `${money(a)} − ${money(b)} = ?`, ...ansM(a - b), hint: `Take away the ${UNITS()} first, then the ${CENTS()}.`, steps: [`${money(a)} − ${SYM()}${Math.floor(b / 100)} = ${money(a - Math.floor(b / 100) * 100)}`, `${money(a - Math.floor(b / 100) * 100)} − ${b % 100}${cu()} = <b>${money(a - b)}</b>`] };
    },
    word() {
      const n = U.name(), have = price(500, 990), it = pick(ITEMS), p = price(120, have - 120);
      return {
        type: 'guided', story: true, scene: '👛',
        q: `${n} has <b>${money(have)}</b> and buys a ${it[1]} for <b>${money(p)}</b>. How much money is left?`,
        parts: [
          { say: 'Add or take away?', type: 'choice', choices: [{ v: '+', html: 'Add ➕' }, { v: '−', html: 'Take away ➖' }], answer: '−', after: 'Money is spent, so we take away.' },
          { say: `${money(have)} − ${money(p)} = ?`, ...ansM(have - p) },
        ],
      };
    },
  };

  const columnMoney = {
    id: 'column-money', title: 'Money in columns', years: [3, 4],
    desc: 'Line up the decimal points and add or subtract column by column.',
    lesson(y) {
      let a, b;
      do { a = price(y === 3 ? 115 : 1215, y === 3 ? 595 : 4995); b = price(y === 3 ? 115 : 315, y === 3 ? 395 : 3995); } while (!V.columnMethod(a / 100, b / 100, '+', { dp: 2 }).steps.some((s) => s.includes('carry')));
      const n1 = price(y === 3 ? 125 : 1125, y === 3 ? 595 : 4995), n2 = price(y === 3 ? 105 : 205, y === 3 ? 395 : 3995);
      const s1 = price(y === 3 ? 400 : 3000, y === 3 ? 990 : 9990), s2 = price(105, s1 - 100);
      return [
        { say: `When prices are harder, use the <b>column method</b>. The golden rule for money: <b>line up the decimal points!</b> ${UNITS()} under ${UNITS()}, ${CENTS()} under ${CENTS()}.`, show: V.columnMethod(a / 100, b / 100, '+', { dp: 2, blank: true }).html },
        { say: `Start on the right, with the <b>1${cu()}</b> column, and move left. The decimal point just drops straight down into the answer.`, show: V.columnMethod(a / 100, b / 100, '+', { dp: 2, upto: 0, active: 0 }).html },
        ...columnFrames(a, b),
        { say: `Done! <span class="say-big">${money(a)} + ${money(b)} = ${money(a + b)}</span>`, show: V.columnMethod(a / 100, b / 100, '+', { dp: 2 }).html },
        { say: 'Your turn! Fill in the boxes column by column.', try: { type: 'column', a: n1 / 100, b: n2 / 100, op: '+', dp: 2, hint: 'Start with the right-hand column.' } },
        { say: 'Taking away money works the same way. Exchange when the top digit is too small.', try: { type: 'column', a: s1 / 100, b: s2 / 100, op: '−', dp: 2, hint: 'If the top digit is too small, exchange from the left.' } },
      ];
    },
    gen(y) {
      const add = Math.random() < 0.6;
      const a = price(y === 3 ? 205 : 1005, y === 3 ? 995 : 9995);
      const b = add ? price(y === 3 ? 105 : 205, y === 3 ? 899 : 4995) : price(105, a - 50);
      const op = add ? '+' : '−';
      return { type: 'column', q: `Work out ${money(a)} ${op} ${money(b)}`, a: a / 100, b: b / 100, op, dp: 2, hint: 'Line up the decimal points. Start on the right.', steps: V.columnMethod(a / 100, b / 100, op, { dp: 2 }).steps };
    },
    word(y) {
      const n = U.name(), [i1, i2] = shuffle(ITEMS);
      const a = price(y === 3 ? 215 : 1215, y === 3 ? 695 : 4995), b = price(y === 3 ? 115 : 515, y === 3 ? 595 : 3995);
      return {
        type: 'guided', story: true, scene: '🧾',
        q: `${n} buys a ${i1[1]} for <b>${money(a)}</b> and a ${i2[1]} for <b>${money(b)}</b>. What is the total?`,
        parts: [
          { say: 'What do we need to do?', type: 'choice', choices: [{ v: '+', html: 'Add ➕' }, { v: '−', html: 'Subtract ➖' }], answer: '+', after: 'A total means add.' },
          { say: 'Work it out in columns:', type: 'column', a: a / 100, b: b / 100, op: '+', dp: 2 },
          { say: 'So the total is:', ...ansM(a + b) },
        ],
      };
    },
  };

  /* ================= Year 4 ================= */
  function threeItems(y) {
    return shuffle(ITEMS).slice(0, 3).map((it) => [it, price(y === 4 ? 115 : 325, y === 4 ? 795 : 2495)]);
  }
  const shoppingList = {
    id: 'shopping-list', title: 'Shopping lists: total of three prices', years: [4, 5],
    desc: 'Add two prices, then add the third. Line up the points.',
    lesson(y) {
      const items = threeItems(y);
      const [p1, p2, p3] = items.map((x) => x[1]);
      const n = threeItems(y).map((x) => x[1]);
      return [
        { say: 'Here is a shopping list with <b>three</b> things. How much will it all cost?', show: shelf(items) },
        { say: 'Adding three prices at once is hard. Make it easy: <b>add two prices first</b>, then add the third to your answer.', show: big(`(${money(p1)} + ${money(p2)}) + ${money(p3)}`) },
        { say: 'Step 1: add the first two prices in columns.', try: { type: 'column', a: p1 / 100, b: p2 / 100, op: '+', dp: 2 } },
        { say: `Step 2: now add the third price, ${money(p3)}, to ${money(p1 + p2)}.`, try: { type: 'column', a: (p1 + p2) / 100, b: p3 / 100, op: '+', dp: 2 } },
        { say: `The whole list costs <b>${money(p1 + p2 + p3)}</b>. 💡 Quick check with an estimate (nearest 10${cu()}): ${money(Math.round(p1 / 10) * 10)} + ${money(Math.round(p2 / 10) * 10)} + ${money(Math.round(p3 / 10) * 10)} = ${money(Math.round(p1 / 10) * 10 + Math.round(p2 / 10) * 10 + Math.round(p3 / 10) * 10)}. Close?`, show: shelf(items) },
        { say: 'Your turn with a new list!', try: { type: 'money', q: `${money(n[0])} + ${money(n[1])} + ${money(n[2])} = ?`, answer: total(n) / 100, hint: 'Add two prices first, then the third.' } },
      ];
    },
    gen(y) {
      const items = threeItems(y);
      const ps = items.map((x) => x[1]);
      if (Math.random() < 0.5) {
        return {
          type: 'guided', q: 'What is the total cost of the shopping list?', visual: shelf(items),
          parts: [
            { say: 'Add the first two prices:', type: 'column', a: ps[0] / 100, b: ps[1] / 100, op: '+', dp: 2 },
            { say: 'Now add the third price:', type: 'column', a: (ps[0] + ps[1]) / 100, b: ps[2] / 100, op: '+', dp: 2 },
            { say: 'Total:', ...ansM(total(ps)) },
          ],
        };
      }
      return { q: 'What is the total cost?', visual: shelf(items), ...ansM(total(ps)), hint: 'Add two prices first, then the third.', steps: [`${money(ps[0])} + ${money(ps[1])} = ${money(ps[0] + ps[1])}`, `${money(ps[0] + ps[1])} + ${money(ps[2])} = <b>${money(total(ps))}</b>`] };
    },
    word(y) {
      const n = U.name(), items = threeItems(y), ps = items.map((x) => x[1]);
      const pay = [1000, 2000, 5000, 10000].find((v) => v > total(ps));
      return {
        type: 'guided', story: true, scene: '🛒',
        q: `${n} buys a ${items[0][0][1]} (${money(ps[0])}), a ${items[1][0][1]} (${money(ps[1])}) and a ${items[2][0][1]} (${money(ps[2])}). ${n} pays with a <b>${money(pay)}</b> note. How much change?`,
        parts: [
          { say: 'First find the total cost of the three things.', ...ansM(total(ps)), after: `Total: ${money(total(ps))}` },
          { say: `Now the change: ${money(pay)} − ${money(total(ps))}, in columns.`, ...subCol(pay, total(ps)) },
          { say: 'How much change?', ...ansM(pay - total(ps)) },
        ],
      };
    },
  };

  /* ---- estimating money: round each price to the nearest 10c ---- */
  /** A price whose last digit is not 0, so rounding to 10c really changes it. */
  function notTen(lo, hi) { let p; do { p = rand(lo, hi); } while (p % 10 === 0); return p; }
  const round10 = (c) => Math.round(c / 10) * 10;
  const ten = () => `10${cu()}`;
  const rule10 = (c) => `The last digit is <b>${c % 10}</b>: ${c % 10 < 5 ? `less than 5, so round <b>down</b> to ${money(Math.floor(c / 10) * 10)}` : `5 or more, so round <b>up</b> to ${money(Math.ceil(c / 10) * 10)}`}.`;
  const roundGuided = (ps) => ps.map((p, k) => ({ say: `Round price ${k + 1}, <b>${money(p)}</b>, to the nearest ${ten()}:`, ...ansM(round10(p)), hint: rule10(p) }));
  const estimate = {
    id: 'estimate-money', title: 'Estimate the total', years: [4, 5],
    get desc() { return `Round each price to the nearest ${ten()}, then add, to check you have enough.`; },
    lesson(y) {
      const hi = y === 4 ? 990 : 2490;
      const items = shuffle(ITEMS).slice(0, 3).map((it) => [it, notTen(110, hi)]);
      const ps = items.map((x) => x[1]);
      const r1 = notTen(110, 990);
      let down, up;
      do { down = notTen(205, 945); } while (down % 10 >= 5);
      do { up = notTen(205, 945); } while (up % 10 < 5 || up % 100 < 90);
      const est = ps.reduce((a, p) => a + round10(p), 0);
      const budget = est + pick([-30, -20, 20, 30]);
      const lo = Math.floor(r1 / 10) * 10;
      return [
        { say: `Before you pay, it helps to <b>estimate</b>: find an answer that is nearly right, quickly. We round each price to the <b>nearest ${ten()}</b>.`, show: shelf(items) },
        { say: `${money(r1)} is between <b>${money(lo)}</b> and <b>${money(lo + 10)}</b>. Look at the <b>last digit</b> (the 1${cu()} column). 0 to 4: round <b>down</b>. 5 to 9: round <b>up</b>.`,
          show: V.numberLine({ min: lo, max: lo + 10, step: 5, minor: 1, label: cash, points: [{ v: r1, label: money(r1) }] }),
          try: { q: `${money(r1)} to the nearest ${ten()}?`, ...ansM(round10(r1)), hint: rule10(r1) } },
        { say: `Try two more. Careful with <b>${money(up)}</b>: rounding up makes the ${CENTS()} reach 100, so it becomes a whole ${UNIT()}!`,
          try: { type: 'guided', parts: [{ say: `${money(down)} ≈ ?`, ...ansM(round10(down)), hint: rule10(down) }, { say: `${money(up)} ≈ ?`, ...ansM(round10(up)), hint: rule10(up), after: `${money(up)} ≈ ${money(round10(up))}` }] } },
        { say: 'Now estimate the whole list: round <b>each</b> price first, then add the rounded prices.', show: shelf(items),
          try: { type: 'guided', parts: [...roundGuided(ps), { say: `Add the rounded prices: ${ps.map((p) => money(round10(p))).join(' + ')} = ?`, ...ansM(est), after: `Estimate: about <b>${money(est)}</b>` }] } },
        { say: `Estimating tells you if you have <b>enough money</b>. You have <b>${money(budget)}</b>. Your estimate is ${money(est)}.`, show: shelf(items),
          try: { q: `Is ${money(budget)} enough for all three?`, type: 'choice', choices: [{ v: 'yes', html: 'Yes ✅' }, { v: 'no', html: 'No ❌' }], answer: total(ps) <= budget ? 'yes' : 'no', hint: `Compare ${money(budget)} with the estimate ${money(est)}.`, steps: [`Estimate: ${money(est)}`, `Exact total: ${money(total(ps))}`] } },
      ];
    },
    gen(y) {
      const r = Math.random(), hi = y === 4 ? 990 : 2490;
      if (r < 0.3) { const p = notTen(110, y === 4 ? 990 : 4990); return { q: `Round <b>${money(p)}</b> to the nearest ${ten()}.`, ...ansM(round10(p)), hint: `Look at the last digit: 0–4 round down, 5–9 round up.`, steps: [rule10(p), `<b>${money(p)} ≈ ${money(round10(p))}</b>`] }; }
      const items = shuffle(ITEMS).slice(0, 3).map((it) => [it, notTen(110, hi)]);
      const ps = items.map((x) => x[1]);
      const est = ps.reduce((a, p) => a + round10(p), 0);
      if (r < 0.7) return { type: 'guided', q: `Estimate the total: round each price to the nearest ${ten()}, then add.`, visual: shelf(items), parts: [...roundGuided(ps), { say: 'Add the rounded prices:', ...ansM(est), after: `Estimate: about <b>${money(est)}</b>` }] };
      const budget = est + pick([-30, -20, 20, 30]);
      return { type: 'guided', q: `You have <b>${money(budget)}</b>. Do you have enough for all three?`, visual: shelf(items),
        parts: [...roundGuided(ps), { say: 'Estimated total?', ...ansM(est) }, { say: `Is ${money(budget)} enough?`, type: 'choice', choices: [{ v: 'yes', html: 'Yes ✅' }, { v: 'no', html: 'No ❌' }], answer: total(ps) <= budget ? 'yes' : 'no', after: `Exact total: ${money(total(ps))}` }] };
    },
  };

  const comparePrices = {
    id: 'compare-prices', title: 'Compare and order prices', years: [4, 4],
    get desc() { return `Compare the whole ${UNITS()} first, then the ${CENTS()}.`; },
    lesson() {
      const u = rand(2, 9), a = u * 100 + rand(1, 9), b = u * 100 + rand(1, 9) * 10;
      const set = shuffle([price(105, 995), price(105, 995), price(105, 995), price(105, 995)]).filter((v, i, arr) => arr.indexOf(v) === i);
      const p1 = price(205, 995), p2 = price(105, p1 - 50);
      return [
        { say: `To compare prices, look at the <b>whole ${UNITS()}</b> first. ${SYM()}7.10 is more than ${SYM()}6.95 because 7 is more than 6 — the ${CENTS()} don't matter!`, show: big(`${SYM()}7.10 &gt; ${SYM()}6.95`) },
        { say: `If the ${UNITS()} are the same, compare the ${CENTS()}. Watch out: <b>${money(a)}</b> has ${a % 100}${cu()}, but <b>${money(b)}</b> has ${b % 100}${cu()}!`, show: big(`${money(a)} &lt; ${money(b)}`),
          try: { q: 'Which is cheaper?', type: 'choice', choices: shuffle([a, b]).map((v) => ({ v: String(v), html: money(v) })), answer: String(Math.min(a, b)), hint: `Same ${UNITS()}? Compare the ${CENTS()}: ${a % 100}${cu()} and ${b % 100}${cu()}.` } },
        { say: 'Now put these prices in order, from the cheapest to the most expensive.', try: { type: 'order', items: set.map((v) => ({ v, html: money(v) })), dir: 'asc', hint: `Look at the whole ${UNITS()} first.` } },
        { say: `How much <b>more</b> does one thing cost than another? Find the <b>difference</b>: bigger price − smaller price, written in columns.`,
          try: subCol(p1, p2) },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.35) {
        const u = rand(1, 9), a = u * 100 + rand(1, 9), b = u * 100 + rand(1, 9) * 10 + rand(0, 9);
        const c = price(105, 995);
        const set = shuffle([a, b, c]).filter((v, i, arr) => arr.indexOf(v) === i);
        const cheap = Math.random() < 0.5;
        return { q: `Which price is the ${cheap ? 'cheapest' : 'most expensive'}?`, type: 'choice', choices: set.map((v) => ({ v: String(v), html: money(v) })), answer: String(cheap ? Math.min(...set) : Math.max(...set)), hint: `Compare ${UNITS()} first, then ${CENTS()}.` };
      }
      if (r < 0.65) {
        const set = [...new Set(Array.from({ length: 4 }, () => price(105, 1995)))];
        return { type: 'order', q: 'Put the prices in order.', items: set.map((v) => ({ v, html: money(v) })), dir: pick(['asc', 'desc']), hint: `Compare the whole ${UNITS()} first.` };
      }
      const p1 = price(305, 1995), p2 = price(105, p1 - 50);
      return { q: `How much more is <b>${money(p1)}</b> than <b>${money(p2)}</b>? Subtract in columns.`, ...subCol(p1, p2), steps: colSubSteps(p1, p2) };
    },
    word() {
      const [a, b] = U.twoNames(), it = pick(ITEMS);
      const p1 = price(205, 995), p2 = price(105, p1 - 30);
      return {
        type: 'guided', story: true, scene: '🏪',
        q: `A ${it[1]} costs <b>${money(p1)}</b> in one shop and <b>${money(p2)}</b> in another. ${a} says “buy it in the cheaper shop!”`,
        parts: [
          { say: 'Which price is cheaper?', type: 'choice', choices: shuffle([p1, p2]).map((v) => ({ v: String(v), html: money(v) })), answer: String(p2) },
          { say: `How much do you save? Work out ${money(p1)} − ${money(p2)} in columns.`, ...subCol(p1, p2) },
          { say: 'So you save:', ...ansM(p1 - p2) },
        ],
      };
    },
  };

  /* ================= Year 5 ================= */
  const multiply = {
    id: 'multiply-money', title: 'Many items at the same price', years: [5, 6],
    desc: 'Multiply a price by the number of items.',
    lesson(y) {
      const it = pick(ITEMS), k = rand(3, 7);
      let p;
      do { p = price(y === 5 ? 115 : 325, y === 5 ? 895 : 2495); } while (p % 100 === 0);
      const u = Math.floor(p / 100), c = p % 100;
      const n = price(115, y === 5 ? 995 : 2495), nk = rand(3, 8);
      return [
        { say: `${k} ${plural(it[1])} at <b>${money(p)}</b> each. We could add ${money(p)} ${k} times… but <b>multiplying</b> is much faster!`, show: shelf([[it, p]]) + big(`${money(p)} × ${k}`) },
        { say: `<b>Method 1: split the price.</b> ${money(p)} = ${SYM()}${u} and ${c}${cu()}. Multiply each part by ${k}.`, try: { type: 'guided', parts: [
          { say: `${SYM()}${u} × ${k} = ?`, answer: u * k, prefix: SYM() },
          { say: `${c}${cu()} × ${k} = ?`, ...ansC(c * k) },
          { say: `Add them: ${SYM()}${u * k} + ${c * k}${cu()} = ?`, ...ansM(p * k) },
        ] } },
        { say: `<b>Method 2: column multiplication.</b> Multiply each digit by ${k}, from the right, carrying like normal. The decimal point stays in line.`, show: big(`${money(p)} × ${k} = ${money(p * k)}`) },
        { say: 'Your turn with the column method!', try: { type: 'column', a: n / 100, b: nk, op: '×', dp: 2, hint: 'Start with the right-hand digit.' } },
      ];
    },
    gen(y) {
      const p = price(y === 5 ? 105 : 255, y === 5 ? 995 : 2995), k = rand(2, 9), it = pick(ITEMS);
      if (Math.random() < 0.5) return { type: 'column', q: `${k} ${plural(it[1])} cost <b>${money(p)}</b> each. Work out ${money(p)} × ${k}.`, a: p / 100, b: k, op: '×', dp: 2, hint: 'Multiply each digit by ' + k + ', starting on the right.' };
      return { q: `One ${it[1]} costs <b>${money(p)}</b>. How much do <b>${k}</b> cost?`, visual: shelf([[it, p]]), ...ansM(p * k), hint: `Split the price: ${SYM()}${Math.floor(p / 100)} and ${p % 100}${cu()}.`, steps: [`${SYM()}${Math.floor(p / 100)} × ${k} = ${money(Math.floor(p / 100) * 100 * k)}`, `${p % 100}${cu()} × ${k} = ${cash((p % 100) * k)}`, `Total: <b>${money(p * k)}</b>`] };
    },
    word(y) {
      const n = U.name(), it = pick(ITEMS), p = price(y === 5 ? 125 : 255, y === 5 ? 795 : 1995), k = rand(3, 8);
      const pay = Math.ceil((p * k) / 1000) * 1000 + (Math.random() < 0.5 ? 0 : 1000);
      return {
        type: 'guided', story: true, scene: '🎉',
        q: `${n} buys a ${it[1]} for each of <b>${k}</b> friends. Each one costs <b>${money(p)}</b>. ${n} pays with <b>${money(pay)}</b>.`,
        parts: [
          { say: 'How much do they cost altogether?', type: 'column', a: p / 100, b: k, op: '×', dp: 2 },
          { say: 'Total cost:', ...ansM(p * k) },
          { say: `Change: ${money(pay)} − ${money(p * k)}, in columns.`, ...subCol(pay, p * k) },
          { say: `Change from ${money(pay)}?`, ...ansM(pay - p * k) },
        ],
      };
    },
  };

  function billNums() {
    const n = rand(2, 6);
    const each = price(215, 1495);
    return { n, each, t: each * n };
  }
  const shareBill = {
    id: 'share-bill', title: 'Share a bill equally', years: [5, 5],
    get desc() { return `Change to ${CENTS()}, divide, then change back.`; },
    lesson() {
      const { n, each, t } = billNums();
      const m = billNums();
      return [
        { say: `<b>${n}</b> friends eat pizza 🍕. The bill is <b>${money(t)}</b>. They share it <b>equally</b>. Sharing equally means we <b>divide</b> by ${n}.`, show: big(`${money(t)} ÷ ${n}`) },
        { say: `Dividing with a decimal point is tricky. Easy trick: change the money into <b>${CENTS()}</b> first!`, try: { q: `${money(t)} = ? ${cu()}`, ...ansC(t) } },
        { say: `Now divide ${fmt(t)}${cu()} by ${n} with the bus stop method.`, try: { type: 'busstop', n: t, d: n } },
        { say: `Each person pays ${fmt(each)}${cu()}. Change it back to ${UNITS()} and ${CENTS()}.`, try: { q: `${fmt(each)}${cu()} = ?`, ...ansM(each) } },
        { say: `Each friend pays <b>${money(each)}</b>. ✔️ Check: ${money(each)} × ${n} = ${money(t)}.`, show: big(`${money(t)} ÷ ${n} = ${money(each)}`) },
        { say: 'Your turn: share this bill.', try: { q: `${money(m.t)} shared equally by ${m.n} people. How much each?`, ...ansM(m.each), hint: `Change to ${CENTS()}, divide by ${m.n}, change back.`, steps: [`${money(m.t)} = ${fmt(m.t)}${cu()}`, `${fmt(m.t)} ÷ ${m.n} = ${fmt(m.each)}${cu()}`, `= <b>${money(m.each)}</b>`] } },
      ];
    },
    gen() {
      const { n, each, t } = billNums();
      if (Math.random() < 0.4) return { type: 'guided', q: `Share <b>${money(t)}</b> equally between <b>${n}</b> people.`, parts: [{ say: `Change to ${CENTS()}:`, ...ansC(t) }, { say: 'Divide:', type: 'busstop', n: t, d: n }, { say: 'Each person pays:', ...ansM(each) }] };
      return { q: `<b>${money(t)}</b> shared equally between <b>${n}</b>. How much each?`, ...ansM(each), hint: `Divide ${fmt(t)}${cu()} by ${n}.`, steps: [`${money(t)} = ${fmt(t)}${cu()}`, `${fmt(t)} ÷ ${n} = ${fmt(each)}${cu()} = <b>${money(each)}</b>`] };
    },
    word() {
      const nm = U.name(), { n, each, t } = billNums();
      return {
        type: 'guided', story: true, scene: '🍕',
        q: `${nm} and ${n - 1} friends go out for pizza. The bill is <b>${money(t)}</b> and they split it equally.`,
        parts: [
          { say: 'How many people share the bill?', answer: n, after: `${nm} + ${n - 1} friends = ${n} people` },
          { say: 'Which operation?', type: 'choice', choices: [{ v: '×', html: 'Multiply ✖️' }, { v: '÷', html: 'Divide ➗' }], answer: '÷' },
          { say: 'How much does each person pay?', ...ansM(each) },
        ],
      };
    },
  };

  function bestBuyNums() {
    const it = pick(ITEMS), k = pick([3, 4, 5, 6]);
    const single = price(40, 250);
    let pack = single * k + pick([-1, 1]) * price(10, Math.max(15, Math.floor(single * k * 0.2)));
    pack = Math.round(pack / k) * k; // pack divides evenly
    if (pack === single * k) pack -= k * 5;
    return { it, k, single, pack };
  }
  function bestBuyChoice({ it, k, single, pack }) {
    const packBetter = pack < single * k;
    return {
      q: `You need <b>${k}</b> ${plural(it[1])}. Which is the better buy?`,
      visual: `<div class="shelf"><div class="price-tag"><span class="pt-emoji">${it[0].repeat(Math.min(k, 4))}</span><span class="pt-name">pack of ${k}</span><span class="pt-price">${money(pack)}</span></div><div class="price-tag"><span class="pt-emoji">${it[0]}</span><span class="pt-name">single</span><span class="pt-price">${money(single)}</span></div></div>`,
      type: 'choice', choices: [{ v: 'pack', html: `The pack of ${k}` }, { v: 'single', html: `${k} singles` }], answer: packBetter ? 'pack' : 'single',
      hint: `Work out what ${k} singles cost.`,
      steps: [`${k} singles: ${k} × ${money(single)} = <b>${money(single * k)}</b>`, `Pack: <b>${money(pack)}</b>`, packBetter ? `The pack is cheaper by ${money(single * k - pack)}.` : `The singles are cheaper by ${money(pack - single * k)}.`],
    };
  }
  const bestBuy = {
    id: 'best-buy', title: 'Best buy: which is cheaper?', years: [5, 6],
    desc: 'Compare the same number of items, or the price of one.',
    lesson() {
      const b = bestBuyNums(), c = bestBuyNums();
      return [
        { say: `A big pack or single ${plural(b.it[1])}? A big pack is <b>not always</b> cheaper! To compare fairly, compare the <b>same number</b> of items.`, show: bestBuyChoice(b).visual },
        { say: `How much would <b>${b.k}</b> singles cost?`, try: { q: `${b.k} × ${money(b.single)} = ?`, ...ansM(b.single * b.k) } },
        { say: `${b.k} singles cost ${money(b.single * b.k)}. The pack costs ${money(b.pack)}.`, try: Object.assign(bestBuyChoice(b), { q: 'So which is the better buy?' }) },
        { say: `Another way: find the price of <b>one</b> item in the pack. Divide the pack price by ${c.k}.`, show: bestBuyChoice(c).visual,
          try: { q: `${money(c.pack)} ÷ ${c.k} = ? (price of one in the pack)`, ...ansM(c.pack / c.k), hint: `Change to ${CENTS()}: ${c.pack}${cu()} ÷ ${c.k}.` } },
        { say: `One in the pack costs ${money(c.pack / c.k)}; a single costs ${money(c.single)}. The lower price per item is the better buy!`, try: Object.assign(bestBuyChoice(c), { q: 'Which is the better buy?' }) },
      ];
    },
    gen() {
      const b = bestBuyNums();
      if (Math.random() < 0.6) return bestBuyChoice(b);
      return { q: `A pack of <b>${b.k}</b> ${plural(b.it[1])} costs <b>${money(b.pack)}</b>. What is the price of one?`, ...ansM(b.pack / b.k), hint: `Divide by ${b.k}.`, steps: [`${b.pack}${cu()} ÷ ${b.k} = ${b.pack / b.k}${cu()} = <b>${money(b.pack / b.k)}</b>`] };
    },
    word() {
      const n = U.name(), b = bestBuyNums();
      const g = bestBuyChoice(b);
      return {
        type: 'guided', story: true, scene: '🛍️',
        q: `${n} needs ${b.k} ${plural(b.it[1])}. The shop sells a pack of ${b.k} for <b>${money(b.pack)}</b>, or singles for <b>${money(b.single)}</b> each.`,
        parts: [
          { say: `Cost of ${b.k} singles?`, ...ansM(b.single * b.k) },
          { say: 'Which should they buy?', type: 'choice', choices: g.choices, answer: g.answer },
          { say: 'How much do they save?', ...ansM(Math.abs(b.single * b.k - b.pack)) },
        ],
      };
    },
  };

  function budgetNums() {
    const it = pick(ITEMS), p = price(115, 495), B = pick([1000, 1500, 2000, 2500, 3000]);
    return { it, p, B, k: Math.floor(B / p) };
  }
  const budget = {
    id: 'budget', title: 'How many can I buy?', years: [5, 5],
    desc: 'Keep within your money. You can’t buy part of an item!',
    lesson() {
      const { it, p, B, k } = budgetNums();
      const n = budgetNums();
      const chipsL = Array.from({ length: k + 1 }, (_, i) => `${i + 1} → ${money(p * (i + 1))}`);
      return [
        { say: `You have <b>${money(B)}</b>. A ${it[1]} costs <b>${money(p)}</b>. How many can you buy?`, show: shelf([[it, p]]) + big(`${money(B)} 👛`) },
        { say: `Count up in ${money(p)}s until you go <b>over</b> ${money(B)}:`, show: V.chips(chipsL, [k - 1]) },
        { say: `${k} cost ${money(p * k)} — that's fine. ${k + 1} would cost ${money(p * (k + 1))} — too much! So you can buy:`, try: { q: `How many ${plural(it[1])}?`, answer: k, hint: 'Find the last one that is not more than your money.' } },
        { say: `You can't buy <b>part</b> of a ${it[1]}, so we always round <b>down</b> here. How much money is left over?`, try: { q: `${money(B)} − ${money(p * k)} = ?`, ...ansM(B - p * k) } },
        { say: 'Your turn!', try: { q: `You have <b>${money(n.B)}</b>. A ${n.it[1]} costs <b>${money(n.p)}</b>. How many can you buy?`, answer: n.k, hint: `Count up in ${money(n.p)}s.`, steps: [`${n.k} × ${money(n.p)} = ${money(n.k * n.p)} ✔️`, `${n.k + 1} × ${money(n.p)} = ${money((n.k + 1) * n.p)} ✖️ too much`] } },
      ];
    },
    gen() {
      const { it, p, B, k } = budgetNums();
      if (Math.random() < 0.6) return { q: `You have <b>${money(B)}</b>. A ${it[1]} costs <b>${money(p)}</b>. What is the greatest number you can buy?`, visual: shelf([[it, p]]), answer: k, hint: 'Count up in the price until you go over.', steps: [`${k} × ${money(p)} = ${money(k * p)} ✔️`, `${k + 1} × ${money(p)} = ${money((k + 1) * p)} ✖️`, `Answer: <b>${k}</b>`] };
      return { q: `You have <b>${money(B)}</b> and buy as many ${plural(it[1])} as you can at <b>${money(p)}</b> each. How much money is left?`, ...ansM(B - k * p), hint: 'First find how many you can buy.', steps: [`You can buy ${k}: ${money(k * p)}`, `Left: ${money(B)} − ${money(k * p)} = <b>${money(B - k * p)}</b>`] };
    },
    word() {
      const n = U.name(), { it, p, B, k } = budgetNums();
      return {
        type: 'guided', story: true, scene: '🎒',
        q: `${n} has <b>${money(B)}</b> to spend on ${plural(it[1])} for a class party. Each one costs <b>${money(p)}</b>.`,
        parts: [
          { say: 'How many can be bought?', answer: k },
          { say: 'How much money is left?', ...ansM(B - k * p) },
        ],
      };
    },
  };

  /* ================= Year 6 ================= */
  const PCT_HOW = {
    50: (p) => `50% is <b>half</b>: ${money(p)} ÷ 2`,
    25: (p) => `25% is a <b>quarter</b>: ${money(p)} ÷ 4`,
    10: (p) => `10% means <b>divide by 10</b>: ${money(p)} ÷ 10`,
    20: (p) => `20% is <b>10% doubled</b>: (${money(p)} ÷ 10) × 2`,
  };
  const pctAmount = () => rand(2, 30) * 400;
  const percentOf = {
    id: 'percent-of', title: 'Find 10%, 20%, 25% and 50%', years: [6, 6],
    desc: 'Percent means “out of 100”. Use halves, quarters and tenths.',
    lesson() {
      const p = pctAmount(), q = pctAmount(), r = pctAmount();
      return [
        { say: '<b>%</b> means <b>“out of 100”</b>. 50% = 50 out of every 100 = <b>half</b>. Some percents are easy to find with tricks:', show: `<div class="fact-family"><span>50% = ÷ 2</span><span>25% = ÷ 4</span><span>10% = ÷ 10</span><span>20% = 10% × 2</span></div>` },
        { say: `<b>50%</b> of ${money(p)}: just halve it.`, try: { q: `50% of ${money(p)} = ?`, ...ansM(p / 2), hint: 'Halve it.' } },
        { say: `<b>10%</b>: divide by 10. Every digit moves one place to the right.`, try: { q: `10% of ${money(q)} = ?`, ...ansM(q / 10), hint: `${money(q)} ÷ 10` } },
        { say: `<b>20%</b>: find 10% first, then double it. 10% of ${money(q)} is ${money(q / 10)}.`, try: { q: `20% of ${money(q)} = ?`, ...ansM(q / 5), hint: `${money(q / 10)} × 2` } },
        { say: `<b>25%</b>: a quarter. Halve, then halve again!`, try: { q: `25% of ${money(r)} = ?`, ...ansM(r / 4), hint: `Half of ${money(r)} is ${money(r / 2)}. Half again?` } },
      ];
    },
    gen() {
      const p = pctAmount(), pct = pick([10, 20, 25, 50]);
      return { q: `What is <b>${pct}%</b> of <b>${money(p)}</b>?`, ...ansM((p * pct) / 100), hint: PCT_HOW[pct](p).replace(/<[^>]+>/g, ''), steps: [PCT_HOW[pct](p), `= <b>${money((p * pct) / 100)}</b>`] };
    },
  };

  function saleGuided(p, pct, it) {
    const off = (p * pct) / 100;
    return {
      type: 'guided', q: `A ${it[1]} costs <b>${money(p)}</b>. It is <b>${pct}% off</b> in the sale. What is the sale price?`,
      visual: `<div class="sale">${tag(it, p)}<span class="sale-badge">−${pct}%</span></div>`,
      parts: [
        { say: `How much is ${pct}% of ${money(p)}? (the discount)`, ...ansM(off), after: PCT_HOW[pct](p) + ` = ${money(off)}` },
        { say: `Take the discount off the price: ${money(p)} − ${money(off)} = ?`, ...ansM(p - off) },
      ],
      steps: [PCT_HOW[pct](p) + ` = ${money(off)}`, `${money(p)} − ${money(off)} = <b>${money(p - off)}</b>`],
    };
  }
  const salePrice = {
    id: 'sale-price', title: 'Sale prices and discounts', years: [6, 6],
    desc: 'Find the discount, then take it away from the price.',
    lesson() {
      const it = pick(ITEMS), p = pctAmount(), pct = pick([20, 25, 50]);
      const off = (p * pct) / 100;
      const it2 = pick(ITEMS), p2 = pctAmount(), pct2 = pick([10, 20, 25]);
      return [
        { say: `It's a sale! 🏷️ The ${it[1]} costs ${money(p)}, with <b>${pct}% off</b>. “Off” means the price goes <b>down</b>.`, show: `<div class="sale">${tag(it, p)}<span class="sale-badge">−${pct}%</span></div>` },
        { say: `<b>Step 1:</b> find the discount, ${pct}% of ${money(p)}. ${PCT_HOW[pct](p)}.`, try: { q: `${pct}% of ${money(p)} = ?`, ...ansM(off) } },
        { say: `<b>Step 2:</b> take the discount away from the old price.`, try: { q: `${money(p)} − ${money(off)} = ?`, ...ansM(p - off) } },
        { say: `The sale price is <b>${money(p - off)}</b>. You save ${money(off)}! 🎉`, show: big(`${money(p)} − ${money(off)} = ${money(p - off)}`) },
        { say: 'Your turn: both steps.', try: saleGuided(p2, pct2, it2) },
      ];
    },
    gen() {
      const it = pick(ITEMS), p = pctAmount(), pct = pick([10, 20, 25, 50]);
      if (Math.random() < 0.5) return saleGuided(p, pct, it);
      const g = saleGuided(p, pct, it);
      return { q: g.q, visual: g.visual, ...ansM(p - (p * pct) / 100), hint: 'Find the discount first, then subtract.', steps: g.steps };
    },
    word() {
      const n = U.name(), p = pick([30, 40, 60, 80]) * 100, pct = pick([10, 20, 25, 50]), k = rand(2, 4);
      const sale = p - (p * pct) / 100;
      return {
        type: 'guided', story: true, scene: '👟',
        q: `Trainers cost <b>${money(p)}</b>. Today they are <b>${pct}% off</b>. ${n} buys <b>${k}</b> pairs for the family.`,
        parts: [
          { say: `Discount on one pair (${pct}% of ${money(p)})?`, ...ansM((p * pct) / 100) },
          { say: 'Sale price of one pair?', ...ansM(sale) },
          { say: `Cost of ${k} pairs?`, ...ansM(sale * k) },
        ],
      };
    },
  };

  function multiNums() {
    const [i1, i2] = shuffle(ITEMS);
    const pa = price(115, 695), pb = price(115, 695), ka = rand(2, 5), kb = rand(2, 5);
    const spent = pa * ka + pb * kb;
    const B = Math.ceil((spent + 100) / 1000) * 1000;
    return { i1, i2, pa, pb, ka, kb, spent, B };
  }
  function multiGuided(m, n) {
    return {
      type: 'guided', story: true, scene: '🧺',
      q: `${n} has <b>${money(m.B)}</b>. ${n} buys <b>${m.ka}</b> ${plural(m.i1[1])} at ${money(m.pa)} each and <b>${m.kb}</b> ${plural(m.i2[1])} at ${money(m.pb)} each. How much money is left?`,
      parts: [
        { say: `Cost of the ${plural(m.i1[1])}: ${m.ka} × ${money(m.pa)}`, ...ansM(m.ka * m.pa) },
        { say: `Cost of the ${plural(m.i2[1])}: ${m.kb} × ${money(m.pb)}`, ...ansM(m.kb * m.pb) },
        { say: 'Total spent?', ...ansM(m.spent) },
        { say: `Money left from ${money(m.B)}?`, ...ansM(m.B - m.spent) },
      ],
      steps: [`${m.ka} × ${money(m.pa)} = ${money(m.ka * m.pa)}`, `${m.kb} × ${money(m.pb)} = ${money(m.kb * m.pb)}`, `Total: ${money(m.spent)}`, `Left: ${money(m.B)} − ${money(m.spent)} = <b>${money(m.B - m.spent)}</b>`],
    };
  }
  const multiStep = {
    id: 'multi-step', title: 'Multi-step shopping problems', years: [6, 6],
    desc: 'Break a big problem into small steps.',
    lesson() {
      const m = multiNums(), n = U.name();
      return [
        { say: `Big money problems have <b>several steps</b>. Read carefully and make a plan before you calculate!`, show: `<div class="fact-family"><span>1. What do I know?</span><span>2. What do I need?</span><span>3. Which steps?</span></div>` },
        { say: `${n} has ${money(m.B)}, buys ${m.ka} ${plural(m.i1[1])} at ${money(m.pa)} and ${m.kb} ${plural(m.i2[1])} at ${money(m.pb)}. How much is left? Plan: cost of each kind → total → take from ${money(m.B)}.`, show: shelf([[m.i1, m.pa], [m.i2, m.pb]]),
          try: { q: `Step 1: ${m.ka} × ${money(m.pa)} = ?`, ...ansM(m.ka * m.pa) } },
        { say: 'Step 2: the other item.', try: { q: `${m.kb} × ${money(m.pb)} = ?`, ...ansM(m.kb * m.pb) } },
        { say: 'Step 3: add to find the total spent.', try: { q: `${money(m.ka * m.pa)} + ${money(m.kb * m.pb)} = ?`, ...ansM(m.spent) } },
        { say: `Step 4: ${money(m.B)} − ${money(m.spent)} = <b>${money(m.B - m.spent)}</b> left. ✔️ Does it make sense? Yes: less than ${money(m.B)} and more than 0.`, show: big(`${money(m.B - m.spent)} left`) },
        { say: 'Now a whole problem on your own!', try: multiGuided(multiNums(), U.name()) },
      ];
    },
    gen() { return multiGuided(multiNums(), U.name()); },
    word() { return multiGuided(multiNums(), U.name()); },
  };

  function saveNums() {
    const it = pick([['🚲', 'bike'], ['🎮', 'game console'], ['🛹', 'skateboard'], ['🎸', 'guitar'], ['⌚', 'watch']]);
    const target = price(3000, 15000, 500), have = price(500, target - 1500, 50), per = pick([250, 400, 500, 750, 1000]);
    const need = target - have;
    return { it, target, have, per, need, weeks: Math.ceil(need / per) };
  }
  function saveGuided(s, n) {
    return {
      type: 'guided', story: true, scene: s.it[0],
      q: `${n} wants a ${s.it[1]} that costs <b>${money(s.target)}</b>. ${n} already has <b>${money(s.have)}</b> and saves <b>${money(s.per)}</b> every week. How many weeks until there is enough?`,
      parts: [
        { say: 'How much more money is needed?', ...ansM(s.need), after: `${money(s.target)} − ${money(s.have)} = ${money(s.need)}` },
        { say: `${money(s.need)} ÷ ${money(s.per)} = ? (you can type a decimal)`, answer: U.round(s.need / s.per, 2), decimals: true, tol: 0.05 },
        { say: 'So how many whole weeks must they save?', answer: s.weeks, suffix: 'weeks', after: s.need % s.per ? 'A part-week is not enough, so we round <b>up</b>.' : 'Exactly enough!' },
      ],
      steps: [`Needed: ${money(s.need)}`, `${money(s.need)} ÷ ${money(s.per)} = ${fmt(U.round(s.need / s.per, 2))}`, `Round up: <b>${s.weeks}</b> weeks`],
    };
  }
  const saving = {
    id: 'saving', title: 'Saving up: how many weeks?', years: [6, 6],
    desc: 'Find what is still needed, divide, and round up.',
    lesson() {
      const s = saveNums(), n = U.name();
      const rows = Array.from({ length: Math.min(s.weeks, 8) }, (_, i) => `Week ${i + 1}: ${money(s.have + s.per * (i + 1))}`);
      return [
        { say: `${n} wants a ${s.it[1]} ${s.it[0]} for <b>${money(s.target)}</b>, has <b>${money(s.have)}</b> and saves <b>${money(s.per)}</b> a week.`, show: big(`${money(s.have)} → ${money(s.target)}`) },
        { say: '<b>Step 1:</b> how much more money is needed?', try: { q: `${money(s.target)} − ${money(s.have)} = ?`, ...ansM(s.need) } },
        { say: `<b>Step 2:</b> how many lots of ${money(s.per)} make ${money(s.need)}? We could count up week by week…`, show: V.chips(rows) },
        { say: '…or divide! Type the division answer.', try: { q: `${money(s.need)} ÷ ${money(s.per)} = ?`, answer: U.round(s.need / s.per, 2), decimals: true, tol: 0.05, hint: `Change both to ${CENTS()}: ${s.need} ÷ ${s.per}.` } },
        { say: `<b>Step 3:</b> think about real life! If the answer is not a whole number, a part-week of saving is not enough. So we round <b>up</b>: <b>${s.weeks} weeks</b>.`, show: big(`${s.weeks} weeks`) },
        { say: 'Your turn!', try: saveGuided(saveNums(), U.name()) },
      ];
    },
    gen() {
      const s = saveNums();
      if (Math.random() < 0.5) return saveGuided(s, U.name());
      return { q: `A ${s.it[1]} costs <b>${money(s.target)}</b>. You have <b>${money(s.have)}</b> and save <b>${money(s.per)}</b> a week. How many weeks until you can buy it?`, answer: s.weeks, suffix: 'weeks', hint: 'Find what is still needed, divide, round up.', steps: [`Needed: ${money(s.need)}`, `÷ ${money(s.per)} = ${fmt(U.round(s.need / s.per, 2))}`, `Round up: <b>${s.weeks}</b>`] };
    },
    word() { return saveGuided(saveNums(), U.name()); },
  };

  /* ---------------- explorer: the till ---------------- */
  function explore(root, y) {
    const all = y <= 2 ? [1, 2, 5, 10, 20, 50, 100] : [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
    let tray = [];
    let target = null;
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Tap coins and notes to put them in the tray. Tap money in the tray to take it out. Try to make the challenge amount with the fewest coins!</p>
        <div class="till">${all.map((c) => `<button class="coin-btn" data-c="${c}" aria-label="add ${V.coinLabel(c)}">${V.coin(c)}</button>`).join('')}</div>
        <div class="tray" id="tray"></div>
        <div class="ex-eq">Total: <span id="tot" class="total-pill"></span> <span class="muted" id="cnt"></span></div>
        <div class="challenge">
          <button class="btn" id="newT">🎯 Give me a challenge</button>
          <span id="tgt"></span>
          <button class="btn ghost" id="clr">Clear tray</button>
        </div>
      </div>`;
    const trayEl = root.querySelector('#tray'), tot = root.querySelector('#tot'), tgt = root.querySelector('#tgt');
    function draw() {
      tray.sort((a, b) => b - a);
      trayEl.innerHTML = tray.length ? tray.map((c, i) => `<button class="coin-btn" data-i="${i}" aria-label="remove ${V.coinLabel(c)}">${V.coin(c)}</button>`).join('') : '<span class="muted">The tray is empty</span>';
      const sum = total(tray);
      tot.textContent = cash(sum);
      root.querySelector('#cnt').textContent = tray.length ? `(${tray.length} coin${tray.length > 1 ? 's' : ''})` : '';
      if (target != null) {
        if (sum === target) {
          const best = greedy(target, all).length;
          tgt.innerHTML = `Make <b>${cash(target)}</b> — <span class="good">Perfect! 🎉</span> ${tray.length === best ? 'Fewest coins too! 🏆' : `<span class="muted">(It can be done with ${best} coins.)</span>`}`;
          U.sound('win'); U.confetti(); target = null;
        } else tgt.innerHTML = `Make exactly <b>${cash(target)}</b> ${sum > target ? '<span class="bad">(too much!)</span>' : ''}`;
      }
    }
    root.querySelector('.till').onclick = (e) => { const b = e.target.closest('[data-c]'); if (!b) return; tray.push(+b.dataset.c); U.sound('click'); draw(); };
    trayEl.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; tray.splice(+b.dataset.i, 1); U.sound('click'); draw(); };
    root.querySelector('#clr').onclick = () => { tray = []; draw(); };
    root.querySelector('#newT').onclick = () => { target = y <= 1 ? rand(3, 20) : y === 2 ? rand(10, 99) : price(105, y <= 4 ? 1500 : 4500); tray = []; draw(); };
    draw();
  }

  /* ================= Shopping problems (all years) ================= */
  /** Price range, step and coins for each year. Y1–2 stay under 100 (cents/pence only). */
  function shopCfg(y) {
    if (y <= 1) return { lo: 2, hi: 15, step: 1, coins: [1, 2, 5, 10] };
    if (y === 2) return { lo: 5, hi: 60, step: 1, coins: [1, 2, 5, 10, 20, 50] };
    if (y === 3) return { lo: 105, hi: 650, step: 5, coins: [10, 20, 50, 100, 200, 500] };
    if (y === 4) return { lo: 150, hi: 1200, step: 5, coins: [20, 50, 100, 200, 500, 1000] };
    if (y === 5) return { lo: 250, hi: 2500, step: 5, coins: [50, 100, 200, 500, 1000, 2000] };
    return { lo: 350, hi: 4500, step: 5, coins: [50, 100, 200, 500, 1000, 2000] };
  }
  /** n different items with different prices. */
  function makeShelf(y, n) {
    const c = shopCfg(y);
    for (;;) {
      const its = shuffle(ITEMS).slice(0, n).map((it) => [it, price(c.lo, c.hi, c.step)]);
      if (new Set(its.map((x) => x[1])).size === n) return its;
    }
  }
  const roundTo = (v, s) => Math.ceil(v / s) * s;
  const yesNo = (ans) => ({ type: 'choice', choices: [{ v: 'yes', html: 'Yes ✅' }, { v: 'no', html: 'No ❌' }], answer: ans ? 'yes' : 'no' });
  /** One adding step: a column from Year 3, a plain sum before. */
  const addStep = (a, b, y, say) => (y >= 3 ? { say, type: 'column', a: a / 100, b: b / 100, op: '+', dp: 2 } : { say: `${say} ${cash(a)} + ${cash(b)} = ?`, ...ansC(a + b) });
  /** One taking-away step: a column from Year 3, a plain subtraction before. */
  const subStep = (a, b, y, say) => (y >= 3 ? Object.assign({ say }, subCol(a, b)) : { say: `${say} ${cash(a)} − ${cash(b)} = ?`, ...ansC(a - b), hint: `Count up from ${cash(b)} to ${cash(a)}.` });
  const purseCoins = (amount, y) => greedy(amount, shopCfg(y).coins.concat(y <= 2 ? [] : [1, 2, 5]));
  const itemLabel = ([it, p]) => `<span class="pt-emoji">${it[0]}</span><br><small>${cash(p)}</small>`;

  /* ---- 1. What can I buy? ---- */
  function budgetFor(sh, y) {
    const ps = sh.map((x) => x[1]).sort((a, b) => a - b);
    const k = rand(1, ps.length - 2); // some items affordable, some not
    const lo = ps[k - 1], hi = ps[k] - 1;
    const step = y <= 2 ? 1 : 5;
    let B = roundTo(rand(lo, hi), step);
    if (B > hi) B = lo;
    return B;
  }
  function affordTap(sh, B, q) {
    return {
      type: 'tapfind', q: q || `You have <b>${cash(B)}</b>. Tap <b>every</b> thing you can buy on its own.`,
      visual: V.coins(greedy(B, [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000])),
      items: sh.map((x) => ({ label: itemLabel(x), ok: x[1] <= B })),
      hint: `Compare each price with ${cash(B)}. Same or less: you can buy it.`,
      steps: sh.map(([it, p]) => `${it[0]} ${cash(p)} ${p <= B ? `≤ ${cash(B)} ✔️ yes` : `> ${cash(B)} ✖️ too much`}`),
    };
  }
  function pairProblem(y) {
    for (let t = 0; t < 200; t++) {
      const sh = makeShelf(y, 4);
      const pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]].map(([i, j]) => ({ i, j, s: sh[i][1] + sh[j][1] }));
      const good = pick(pairs);
      const B = y <= 2 ? good.s + rand(0, 2) : roundTo(good.s + price(0, 40), 50);
      if (y <= 2 && B > 99) continue;
      if (pairs.filter((p) => p.s <= B).length !== 1) continue;
      const bad = shuffle(pairs.filter((p) => p.s > B)).slice(0, 2);
      if (bad.length < 2) continue;
      const lab = (p) => `${sh[p.i][0][0]} + ${sh[p.j][0][0]}`;
      return {
        type: 'choice', q: `You have <b>${cash(B)}</b>. Which <b>two</b> things can you buy together?`, visual: shelf(sh),
        choices: shuffle([good, ...bad]).map((p) => ({ v: `${p.i}-${p.j}`, html: lab(p) })), answer: `${good.i}-${good.j}`,
        hint: 'Add the two prices for each choice. The total must be the same as or less than your money.',
        steps: [good, ...bad].map((p) => `${lab(p)}: ${cash(sh[p.i][1])} + ${cash(sh[p.j][1])} = ${cash(p.s)} ${p.s <= B ? '✔️' : '✖️ too much'}`),
      };
    }
    return null;
  }
  const whatCanIBuy = {
    id: 'what-can-i-buy', title: 'What can I buy?', years: [1, 6], icon: '🛍️',
    desc: 'Compare prices with your money. Add prices to buy more than one thing.',
    lesson(y) {
      const sh = makeShelf(y, 5), B = budgetFor(sh, y);
      const one = pick(sh);
      const cheap = [...sh].sort((a, b) => a[1] - b[1]);
      const [p1, p2] = [cheap[0], cheap[1]];
      const two = p1[1] + p2[1];
      const sh2 = makeShelf(y, 5), B2 = budgetFor(sh2, y);
      const pp = y >= 2 ? pairProblem(y) : null;
      const fr = [
        { say: `You have <b>${cash(B)}</b> to spend. Here is the shop. What can you buy?`, show: V.coins(purseCoins(B, y)) + shelf(sh) },
        { say: `You can buy something if its price is <b>the same as or less than</b> your money. If the price is <b>more</b>, you don't have enough.`, show: big(`price ≤ ${cash(B)} → ✔️`),
          try: Object.assign({ q: `Can you buy the ${one[0][1]} for ${cash(one[1])} with ${cash(B)}?` }, yesNo(one[1] <= B), { hint: `Is ${cash(one[1])} more than ${cash(B)}?` }) },
        { say: 'Now check every item. Tap all the things you could buy <b>on its own</b>.', try: affordTap(sh, B) },
        { say: `To buy <b>two</b> things, add their prices first. The ${p1[0][1]} and the ${p2[0][1]} cost ${cash(p1[1])} + ${cash(p2[1])} together.`, show: shelf([p1, p2]),
          try: { type: 'guided', parts: [addStep(p1[1], p2[1], y, 'Add the two prices:'), Object.assign({ say: `${cash(two)} altogether. Is that enough with ${cash(B)}?` }, yesNo(two <= B))] } },
      ];
      if (pp) fr.push({ say: 'Which pair fits your money? Add each pair and compare.', try: pp });
      fr.push({ say: 'Your turn with a new shop!', try: affordTap(sh2, B2) });
      return fr;
    },
    gen(y) {
      const r = Math.random();
      if (y >= 2 && r < 0.35) { const pp = pairProblem(y); if (pp) return pp; }
      if (r < 0.7 || y === 1) { const sh = makeShelf(y, 5); return affordTap(sh, budgetFor(sh, y)); }
      let sh = makeShelf(y, 3);
      while (y <= 2 && total(sh.map((x) => x[1])) > 90) sh = makeShelf(y, 3);
      const tot = total(sh.map((x) => x[1]));
      const B = y <= 2 ? tot + pick([-3, -1, 0, 2, 4]) : roundTo(tot + pick([-150, -50, 0, 50, 150]), 50);
      return {
        type: 'guided', q: `You have <b>${cash(B)}</b>. Can you buy <b>all three</b>?`, visual: shelf(sh),
        parts: [
          addStep(sh[0][1], sh[1][1], y, 'Add the first two prices:'),
          addStep(sh[0][1] + sh[1][1], sh[2][1], y, 'Now add the third price:'),
          Object.assign({ say: `Total ${cash(tot)}. Can you buy all three with ${cash(B)}?` }, yesNo(tot <= B)),
        ],
      };
    },
    word(y) {
      const n = U.name(), sh = makeShelf(y, 5), B = budgetFor(sh, y);
      return affordTap(sh, B, `At the school fair ${n} has <b>${cash(B)}</b> of pocket money. Tap every stall prize ${n} could buy on its own.`);
    },
  };

  /* ---- 2. What did I buy? ---- */
  function boughtNums(y) {
    for (;;) {
      const sh = makeShelf(y, 4);
      const k = rand(0, 3), p = sh[k][1];
      const notes = y <= 1 ? [10, 20] : y === 2 ? [20, 50, 100] : [500, 1000, 2000, 5000];
      const pay = notes.find((x) => x > p);
      if (!pay) continue;
      return { sh, k, p, pay, ch: pay - p };
    }
  }
  function boughtGuided(y, d, q) {
    const n = U.name();
    return {
      type: 'guided', story: true, scene: '🧾',
      q: q || `${n} paid with <b>${cash(d.pay)}</b> and got <b>${cash(d.ch)}</b> change. What did ${n} buy?`,
      visual: shelf(d.sh),
      hint: 'Price = money paid − change.',
      parts: [
        { say: 'How do we find the price?', type: 'choice', choices: shuffle([{ v: 'sub', html: `${cash(d.pay)} − ${cash(d.ch)}` }, { v: 'add', html: `${cash(d.pay)} + ${cash(d.ch)}` }]), answer: 'sub', after: 'The shop kept the price and gave back the change.' },
        subStep(d.pay, d.ch, y, 'Work out the price:'),
        { say: `Which thing costs ${cash(d.p)}? Tap it.`, type: 'tapfind', single: true, items: d.sh.map((x, i) => ({ label: itemLabel(x), ok: i === d.k })) },
      ],
      steps: [`Price = ${cash(d.pay)} − ${cash(d.ch)} = <b>${cash(d.p)}</b>`, `The ${d.sh[d.k][0][1]} costs ${cash(d.p)} ${d.sh[d.k][0][0]}`],
    };
  }
  const whatDidIBuy = {
    id: 'what-did-i-buy', title: 'What did I buy?', years: [2, 6], icon: '🧾',
    desc: 'Paid and got change back? Price = money paid − change.',
    lesson(y) {
      const d = boughtNums(y), n = U.name();
      return [
        { say: `${n} paid with <b>${cash(d.pay)}</b> and got <b>${cash(d.ch)}</b> back as change. But which thing did ${n} buy? 🤔`, show: V.coins([d.pay]) + shelf(d.sh) },
        { say: `The money paid was split in two: the <b>price</b> (the shop keeps it) and the <b>change</b> (you get it back). So price + change = money paid.`, show: `<div class="say-big">${cash(d.pay)} = <span class="box">price</span> + ${cash(d.ch)}</div>`,
          try: { type: 'choice', q: 'So how do we find the price?', choices: shuffle([{ v: 'sub', html: `${cash(d.pay)} − ${cash(d.ch)}` }, { v: 'add', html: `${cash(d.pay)} + ${cash(d.ch)}` }, { v: 'rev', html: `${cash(d.ch)} − ${cash(d.pay)}` }]), answer: 'sub', hint: 'Take the change away from the money paid.' } },
        { say: y >= 3 ? 'Take the change away from the money paid, in columns. Line up the decimal points.' : 'Take the change away from the money paid. You can count up from the change to the money paid.', try: y >= 3 ? subCol(d.pay, d.ch) : { q: `${cash(d.pay)} − ${cash(d.ch)} = ?`, ...ansC(d.p), hint: `Count up from ${cash(d.ch)} to ${cash(d.pay)}.` } },
        { say: `The price is <b>${cash(d.p)}</b>. Now find the thing with that price on the shelf.`, try: { type: 'tapfind', single: true, q: `Tap the thing that costs ${cash(d.p)}.`, items: d.sh.map((x, i) => ({ label: itemLabel(x), ok: i === d.k })) } },
        { say: `${n} bought the <b>${d.sh[d.k][0][1]}</b> ${d.sh[d.k][0][0]}. ✔️ Check: price + change should give the money paid.`, try: Object.assign({ q: `${cash(d.p)} + ${cash(d.ch)} = ?` }, ansAmt(d.pay, y)) },
        { say: 'Your turn: the whole problem!', try: boughtGuided(y, boughtNums(y)) },
      ];
    },
    gen(y) { return boughtGuided(y, boughtNums(y)); },
    word(y) {
      const d = boughtNums(y), n = U.name();
      return boughtGuided(y, d, `${n} went to the corner shop with a <b>${cash(d.pay)}</b> ${d.pay >= 500 ? 'note' : 'coin'}. ${n} bought one thing and came home with <b>${cash(d.ch)}</b>. Which thing did ${n} buy?`);
    },
  };

  /* ---- 3. Have I got enough? ---- */
  function enoughNums(y, want) {
    for (;;) {
      const sh = makeShelf(y, 2), tot = sh[0][1] + sh[1][1];
      if (y <= 1 && tot > 20) continue;
      if (y === 2 && tot > 99) continue;
      const enough = want != null ? want : Math.random() < 0.5;
      const step = y <= 2 ? 1 : 50;
      const Z = enough ? roundTo(tot + rand(0, y <= 2 ? 6 : 400), step) : Math.max(step, roundTo(tot - rand(y <= 2 ? 2 : 60, y <= 2 ? 8 : 500), step) - step);
      if (enough ? Z < tot : Z >= tot) continue;
      if (y <= 2 && Z > 99) continue;
      return { sh, tot, Z, enough };
    }
  }
  function enoughGuided(y, d, n, q) {
    const [a, b] = d.sh;
    return {
      type: 'guided', story: true, scene: '👛',
      q: q || `${n} wants to buy the <b>${a[0][1]}</b> and the <b>${b[0][1]}</b>. ${n} has <b>${cash(d.Z)}</b>. Has ${n} got enough?`,
      visual: shelf(d.sh),
      hint: 'Find the total cost first, then compare it with the money.',
      parts: [
        addStep(a[1], b[1], y, 'Total cost:'),
        Object.assign({ say: `The total is ${cash(d.tot)}. ${n} has ${cash(d.Z)}. Enough?` }, yesNo(d.enough)),
        d.enough ? subStep(d.Z, d.tot, y, 'How much will be left?') : subStep(d.tot, d.Z, y, 'How much more money is needed?'),
      ],
      steps: [`Total: ${cash(a[1])} + ${cash(b[1])} = ${cash(d.tot)}`, d.enough ? `Enough ✔️ Left: ${cash(d.Z)} − ${cash(d.tot)} = <b>${cash(d.Z - d.tot)}</b>` : `Not enough ✖️ Needed: ${cash(d.tot)} − ${cash(d.Z)} = <b>${cash(d.tot - d.Z)}</b>`],
    };
  }
  const haveEnough = {
    id: 'have-enough', title: 'Have I got enough?', years: [1, 6], icon: '👛',
    desc: 'Add up what you want, compare with your money, then find what is left or what you still need.',
    lesson(y) {
      const n = U.name();
      const d1 = enoughNums(y, true), d2 = enoughNums(y, false);
      const [a, b] = d1.sh;
      return [
        { say: `${n} has <b>${cash(d1.Z)}</b> and wants the <b>${a[0][1]}</b> and the <b>${b[0][1]}</b>. Can ${n} buy both? Three small steps!`, show: V.coins(purseCoins(d1.Z, y)) + shelf(d1.sh) },
        { say: '<b>Step 1:</b> find the <b>total</b> cost. Add the two prices.', try: { type: 'guided', parts: [addStep(a[1], b[1], y, 'Total cost:')] } },
        { say: `<b>Step 2:</b> compare. The total is ${cash(d1.tot)} and ${n} has ${cash(d1.Z)}. If the money is the same or more, it's enough!`, show: big(`${cash(d1.Z)} ${d1.Z >= d1.tot ? '≥' : '<'} ${cash(d1.tot)}`),
          try: Object.assign({ q: `Has ${n} got enough?` }, yesNo(true)) },
        { say: `<b>Step 3:</b> when there is enough, find what is <b>left</b>: money − total.`, try: { type: 'guided', parts: [subStep(d1.Z, d1.tot, y, 'Money left:')] } },
        { say: `But what if there is <b>not enough</b>? Another day ${n} has only <b>${cash(d2.Z)}</b> and wants things costing <b>${cash(d2.tot)}</b>. Then we find how much <b>more</b> is needed: total − money. (Always the bigger amount on top!)`, show: shelf(d2.sh),
          try: { type: 'guided', parts: [subStep(d2.tot, d2.Z, y, 'How much more is needed?')] } },
        { say: 'Your turn: all three steps!', try: enoughGuided(y, enoughNums(y), U.name()) },
      ];
    },
    gen(y) { return enoughGuided(y, enoughNums(y), U.name()); },
    word(y) {
      const n = U.name(), d = enoughNums(y);
      const [a, b] = d.sh;
      const story = pick([
        `It's ${U.name()}'s birthday soon. ${n} wants to buy a <b>${a[0][1]}</b> and a <b>${b[0][1]}</b> as presents, and has saved <b>${cash(d.Z)}</b>. Is that enough?`,
        `${n} is at the market with <b>${cash(d.Z)}</b> and needs a <b>${a[0][1]}</b> and a <b>${b[0][1]}</b> for a school project. Is there enough money?`,
      ]);
      return enoughGuided(y, d, n, story);
    },
  };

  /* ---- 4. Coins in my purse ---- */
  function purseNums(y) {
    const c = shopCfg(y);
    const vals = shuffle(c.coins).slice(0, 2).sort((a, b) => b - a);
    for (;;) {
      const k1 = rand(2, y <= 1 ? 3 : 4), k2 = rand(2, y <= 1 ? 4 : 5);
      const tot = k1 * vals[0] + k2 * vals[1];
      if (y <= 1 && tot > 20) return purseNums(y);
      if (y === 2 && tot > 100) return purseNums(y);
      const it = pick(ITEMS);
      const cheaper = Math.random() < 0.6;
      const step = y <= 2 ? 1 : 5;
      const p = cheaper ? price(Math.max(1, Math.floor(tot * 0.3)), tot - step, step) : price(tot + step, tot + (y <= 2 ? 15 : 600), step);
      if (p <= 0 || p === tot) continue;
      if (y <= 2 && p > 99) continue;
      return { vals, k1, k2, tot, it, p, cheaper };
    }
  }
  const coinWord = (c) => (c >= 500 ? 'note' : 'coin');
  const groupTxt = (k, c) => `<b>${k}</b> ${coinWord(c)}s of <b>${cash(c)}</b>`;
  function groupStep(k, c, y) {
    return y <= 1
      ? { say: `${groupTxt(k, c)}: count in ${cash(c)}s.`, ...ansC(k * c), hint: Array.from({ length: k }, (_, i) => cash((i + 1) * c)).join(', ') }
      : Object.assign({ say: `${groupTxt(k, c)}: ${k} × ${cash(c)} = ?`, hint: `Count in ${cash(c)}s ${k} times.` }, ansAmt(k * c, y));
  }
  function purseGuided(y, d, n, q) {
    const coinsList = Array(d.k1).fill(d.vals[0]).concat(Array(d.k2).fill(d.vals[1]));
    return {
      type: 'guided', story: true, scene: '👛',
      q: q || `${n} has ${groupTxt(d.k1, d.vals[0])} and ${groupTxt(d.k2, d.vals[1])}. ${n} wants a <b>${d.it[1]}</b> for <b>${cash(d.p)}</b>.`,
      visual: V.coins(coinsList) + shelf([[d.it, d.p]]),
      hint: 'Work out each group of coins, add them, then compare with the price.',
      parts: [
        groupStep(d.k1, d.vals[0], y),
        groupStep(d.k2, d.vals[1], y),
        addStep(d.k1 * d.vals[0], d.k2 * d.vals[1], y, `How much money does ${n} have altogether?`),
        Object.assign({ say: `${n} has ${cash(d.tot)}. Can ${n} buy the ${d.it[1]}?` }, yesNo(d.cheaper)),
        d.cheaper ? subStep(d.tot, d.p, y, 'How much will be left after buying it?') : subStep(d.p, d.tot, y, 'How much more does ' + n + ' need?'),
      ],
      steps: [`${d.k1} × ${cash(d.vals[0])} = ${cash(d.k1 * d.vals[0])}`, `${d.k2} × ${cash(d.vals[1])} = ${cash(d.k2 * d.vals[1])}`, `Total: <b>${cash(d.tot)}</b>`, d.cheaper ? `Left: ${cash(d.tot)} − ${cash(d.p)} = <b>${cash(d.tot - d.p)}</b>` : `Needed: ${cash(d.p)} − ${cash(d.tot)} = <b>${cash(d.p - d.tot)}</b>`],
    };
  }
  const purse = {
    id: 'purse-coins', title: 'Coins in my purse', years: [1, 6], icon: '💰',
    desc: 'Count groups of the same coin, add them, then buy something.',
    lesson(y) {
      const n = U.name(), d = purseNums(y);
      const coinsList = Array(d.k1).fill(d.vals[0]).concat(Array(d.k2).fill(d.vals[1]));
      return [
        { say: `${n} opens a purse and finds ${groupTxt(d.k1, d.vals[0])} and ${groupTxt(d.k2, d.vals[1])}. How much money is that?`, show: V.coins(coinsList) },
        { say: `Coins of the same value make a <b>group</b>. Work out each group: ${d.k1} ${coinWord(d.vals[0])}s of ${cash(d.vals[0])} is ${d.k1} lots of ${cash(d.vals[0])}.`, show: V.coins(Array(d.k1).fill(d.vals[0])), try: { type: 'guided', parts: [groupStep(d.k1, d.vals[0], y)] } },
        { say: 'Now the other group.', show: V.coins(Array(d.k2).fill(d.vals[1])), try: { type: 'guided', parts: [groupStep(d.k2, d.vals[1], y)] } },
        { say: 'Add the two groups to find the <b>total</b>.', try: { type: 'guided', parts: [addStep(d.k1 * d.vals[0], d.k2 * d.vals[1], y, 'Total money:')] } },
        { say: `${n} wants a <b>${d.it[1]}</b> for <b>${cash(d.p)}</b>. ${d.cheaper ? 'There is enough! What will be left?' : 'Oh no, not enough. How much more is needed?'}`, show: shelf([[d.it, d.p]]),
          try: { type: 'guided', parts: [d.cheaper ? subStep(d.tot, d.p, y, 'Money left:') : subStep(d.p, d.tot, y, 'Money still needed:')] } },
        { say: 'Your turn: a new purse!', try: purseGuided(y, purseNums(y), U.name()) },
      ];
    },
    gen(y) { return purseGuided(y, purseNums(y), U.name()); },
    word(y) {
      const n = U.name(), d = purseNums(y);
      return purseGuided(y, d, n, `${n} empties the piggy bank 🐷 and finds ${groupTxt(d.k1, d.vals[0])} and ${groupTxt(d.k2, d.vals[1])}. ${n} would like a <b>${d.it[1]}</b> that costs <b>${cash(d.p)}</b>.`);
    },
  };

  /* ---- 5. Shopping stories (multi-step, Year 3+) ---- */
  function storyProblem(y) {
    const n = U.name(), [a, b] = U.twoNames();
    const c = shopCfg(y);
    const r = Math.random();
    if (r < 0.34) {
      // several of the same item, pay with a note
      const it = pick(ITEMS), k = rand(2, y >= 5 ? 6 : 4), p = price(c.lo, Math.floor(c.hi / k), 5);
      const pay = [500, 1000, 2000, 5000, 10000].find((v) => v > p * k);
      return {
        type: 'guided', story: true, scene: it[0],
        q: `${n} buys <b>${k}</b> ${plural(it[1])} at <b>${money(p)}</b> each and pays with a <b>${money(pay)}</b> note. How much change?`,
        hint: 'First the cost of all of them, then the change.',
        parts: [
          { say: `Cost of ${k} ${plural(it[1])}:`, type: 'column', a: p / 100, b: k, op: '×', dp: 2 },
          Object.assign({ say: 'Change:' }, subCol(pay, p * k)),
          { say: 'So the change is:', ...ansM(pay - p * k) },
        ],
      };
    }
    if (r < 0.67) {
      // two friends put their money together
      const x = price(c.lo, c.hi, 5), z = price(c.lo, c.hi, 5), it = pick(ITEMS);
      const both = x + z, p = price(Math.floor(both * 0.5), both - 5, 5);
      return {
        type: 'guided', story: true, scene: '🤝',
        q: `${a} has <b>${money(x)}</b> and ${b} has <b>${money(z)}</b>. They put their money together to buy a <b>${it[1]}</b> for <b>${money(p)}</b>. How much is left?`,
        hint: 'Add their money, then take away the price.',
        parts: [
          { say: 'Money together:', type: 'column', a: x / 100, b: z / 100, op: '+', dp: 2 },
          Object.assign({ say: 'Take away the price:' }, subCol(both, p)),
          { say: 'Money left:', ...ansM(both - p) },
        ],
      };
    }
    // pocket money for a few weeks, then a toy
    const per = price(100, y >= 5 ? 600 : 300, 50), w = rand(3, 6), it = pick(ITEMS);
    const saved = per * w, p = price(saved - Math.min(saved - 100, 500), saved + 400, 5);
    const ok = p <= saved;
    return {
      type: 'guided', story: true, scene: '🐷',
      q: `${n} gets <b>${money(per)}</b> pocket money every week and saves it all for <b>${w}</b> weeks. ${n} wants a <b>${it[1]}</b> costing <b>${money(p)}</b>.`,
      hint: 'Multiply to find the savings, then compare with the price.',
      parts: [
        { say: `Money saved in ${w} weeks: ${money(per)} × ${w} = ?`, ...ansM(saved) },
        Object.assign({ say: `Can ${n} buy the ${it[1]}?` }, yesNo(ok)),
        ok ? Object.assign({ say: 'Money left:' }, subCol(saved, p)) : Object.assign({ say: 'Money still needed:' }, subCol(p, saved)),
      ],
    };
  }
  const stories = {
    id: 'shopping-stories', title: 'Shopping stories in steps', years: [3, 6], icon: '🧺',
    desc: 'Longer problems: plan the steps, calculate, then check.',
    lesson(y) {
      const n = U.name(), it = pick(ITEMS), k = 3, p = price(shopCfg(y).lo, Math.floor(shopCfg(y).hi / 3), 5);
      const pay = [500, 1000, 2000, 5000, 10000].find((v) => v > p * k);
      return [
        { say: `Some problems need <b>more than one step</b>. Read this: ${n} buys ${k} ${plural(it[1])} at ${money(p)} each and pays with ${money(pay)}. How much change?`, show: shelf([[it, p]]) + V.coins([pay]) },
        { say: 'Make a plan before calculating. What do we need first?', try: { type: 'choice', q: 'Step 1 is…', choices: shuffle([{ v: 'cost', html: `the cost of all ${k}` }, { v: 'change', html: 'the change' }]), answer: 'cost', hint: 'We cannot find the change until we know what we spend.' } },
        { say: `<b>Step 1:</b> ${k} lots of ${money(p)}. Multiply in columns.`, try: { type: 'column', a: p / 100, b: k, op: '×', dp: 2 } },
        { say: `<b>Step 2:</b> change = ${money(pay)} − ${money(p * k)}.`, try: subCol(pay, p * k) },
        { say: `The change is <b>${money(pay - p * k)}</b>. <b>Check</b> with an estimate: ${money(p)} is about ${money(Math.round(p / 10) * 10)} (nearest 10${cu()}), so ${k} cost about ${money(Math.round(p / 10) * 10 * k)}. Does the answer make sense?`, show: big(`${money(pay)} − ${money(p * k)} = ${money(pay - p * k)}`) },
        { say: 'Your turn: a new story!', try: storyProblem(y) },
      ];
    },
    gen(y) { return storyProblem(y); },
    word(y) { return storyProblem(y); },
  };

  TOPICS.push({
    id: 'money', name: 'Money', icon: '🪙', color: '#eab308', minYear: 1,
    tagline: 'Coins, shopping, change and saving',
    explore,
    skills: [
      coinValues, countSame, countMixed, makeAmount, purse,
      waysFewest, totalTwo, whatCanIBuy, haveEnough, change, whatDidIBuy, changeColumn, compare,
      unitsCents, addSub, columnMoney,
      shoppingList, estimate, comparePrices,
      multiply, shareBill, bestBuy, budget,
      percentOf, salePrice, multiStep, stories, saving,
    ],
  });
})();
