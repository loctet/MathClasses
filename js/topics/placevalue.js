'use strict';
/* Place value: counting, tens and ones, comparing, ordering, number lines, rounding, estimating, × and ÷ by 10, 100, 1000. */
(() => {
  const { rand, pick, shuffle, fmt } = U;
  const EM = ['🔴', '🟢', '🔵', '🟡', '⭐', '🍎', '🐞'];
  const PLACES = V.PLACES;

  /* ================= helpers ================= */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function under1000(n) {
    const h = Math.floor(n / 100), r = n % 100;
    let s = h ? ONES[h] + ' hundred' : '';
    if (r) {
      if (h) s += ' and ';
      s += r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? '-' + ONES[r % 10] : '');
    }
    return s;
  }
  /** British number words, e.g. 342,506 → "three hundred and forty-two thousand, five hundred and six". */
  function words(n) {
    if (n === 0) return 'zero';
    const m = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1000), r = n % 1000;
    const parts = [];
    if (m) parts.push(under1000(m) + ' million');
    if (th) parts.push(under1000(th) + ' thousand');
    if (!r) return parts.join(', ');
    if (r < 100 && parts.length) return parts.join(', ') + ' and ' + under1000(r);
    parts.push(under1000(r));
    return parts.join(', ');
  }

  const signHTML = (s) => (s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=');
  const SIGNS = () => ['<', '=', '>'].map((s) => ({ v: s, html: `<span class="sign">${signHTML(s)}</span>` }));
  const signOf = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
  const SIGN_WORD = { '>': 'is greater than', '<': 'is less than', '=': 'is equal to' };
  const RANGE = { 1: [0, 20], 2: [10, 99], 3: [100, 999], 4: [1000, 9999], 5: [10000, 999999], 6: [100000, 9999999] };
  const randNum = (y) => rand(RANGE[y][0], RANGE[y][1]);
  const digitsOf = (n) => String(n).split('').map(Number);
  const single = (w) => w.replace(/s$/, '');

  /** Change one digit (not the first) so the numbers are close and tricky to compare. */
  function changeDigit(n) {
    const d = digitsOf(n);
    const k = rand(1, d.length - 1);
    let v;
    do { v = rand(0, 9); } while (v === d[k]);
    d[k] = v;
    return +d.join('');
  }
  function pair(y, allowEqual = true) {
    const a = randNum(y);
    if (allowEqual && Math.random() < 0.1) return [a, a];
    let b;
    if (y >= 3 && Math.random() < 0.6) b = changeDigit(a);
    else do { b = randNum(y); } while (b === a);
    return [a, b];
  }
  function distinctNums(y, k) {
    const set = new Set();
    const base = randNum(y);
    set.add(base);
    let guard = 0;
    while (set.size < k && guard++ < 200) set.add(y >= 3 && Math.random() < 0.5 ? changeDigit(base) : randNum(y));
    return [...set];
  }
  /** Picture of a number that suits the year. */
  function showNum(n, y) {
    if (y === 1) return V.tenFrame(n, '🔴');
    if (y === 2) return V.base10(n);
    return V.pvTable(n);
  }
  /** Number with digit p (0 = ones) highlighted. */
  function hlDigit(n, p) {
    const s = fmt(n).split('');
    let c = -1;
    for (let i = s.length - 1; i >= 0; i--) {
      if (/\d/.test(s[i])) { c++; if (c === p) { s[i] = `<span class="hl"><u>${s[i]}</u></span>`; break; } }
    }
    return s.join('');
  }
  const digitAt = (n, p) => Math.floor(n / 10 ** p) % 10;
  const seqHTML = (list, hide) => `<div class="demo-row">${list.map((v, i) => (i === hide ? '<span class="chip-num hot">?</span>' : `<span class="chip-num">${fmt(v)}</span>`)).join('<span class="muted">,</span>')}</div>`;
  const roundTo = (n, to) => Math.round(n / to) * to;
  const roundSig = (n) => { const p = 10 ** (String(Math.round(n)).length - 1); return Math.round(n / p) * p; };

  /** Explain why one number is bigger, digit by digit. */
  function whyCompare(a, b) {
    if (a === b) return `${fmt(a)} and ${fmt(b)} are the same, so they are <b>equal</b>.`;
    const sa = String(a), sb = String(b);
    if (sa.length !== sb.length) {
      const big = sa.length > sb.length ? a : b;
      return `${fmt(big)} has <b>more digits</b>, so it is bigger.`;
    }
    for (let k = 0; k < sa.length; k++) {
      if (sa[k] !== sb[k]) {
        const place = PLACES[sa.length - 1 - k];
        const same = k ? `The digits are the same until the <b>${place}</b>. ` : '';
        return `${same}Compare the ${place}: ${sa[k]} and ${sb[k]}. ${Math.max(+sa[k], +sb[k])} is bigger, so <b>${fmt(+sa[k] > +sb[k] ? a : b)}</b> is greater.`;
      }
    }
    return '';
  }

  /** Place value table for whole numbers and decimals, one row per number. rows: [{label, n}] */
  function pvRows(rows) {
    const NAME = { 6: 'M', 5: 'HTh', 4: 'TTh', 3: 'Th', 2: 'H', 1: 'T', 0: 'O', '-1': '1/10', '-2': '1/100', '-3': '1/1000' };
    const CLS = { 3: 'th', 2: 'h', 1: 't', 0: 'o' };
    const N = (v) => Math.round(v * 1000);
    const dig = (v, p) => Math.floor(N(v) / 10 ** (p + 3)) % 10;
    const topOf = (v) => (v >= 1 ? String(Math.floor(v)).length - 1 : 0);
    const lowOf = (v) => { for (let p = -3; p < 0; p++) if (dig(v, p)) return p; return 0; };
    const top = Math.max(...rows.map((r) => topOf(r.n)));
    const low = Math.min(0, ...rows.map((r) => lowOf(r.n)));
    const ps = [];
    for (let p = top; p >= low; p--) ps.push(p);
    let s = '<table class="pv-table"><tr><th></th>';
    ps.forEach((p) => { s += `<th class="${CLS[p] || ''}">${NAME[p]}</th>`; if (p === 0 && low < 0) s += '<th></th>'; });
    s += '</tr>';
    rows.forEach((r) => {
      s += `<tr><th>${r.label}</th>`;
      ps.forEach((p) => {
        const show = p <= topOf(r.n) && p >= Math.min(0, lowOf(r.n));
        s += `<td class="${CLS[p] || ''}">${show ? dig(r.n, p) : ''}</td>`;
        if (p === 0 && low < 0) s += '<td>.</td>';
      });
      s += '</tr>';
    });
    return s + '</table>';
  }

  /* ================= Y1: count to 20 with ten frames ================= */
  const count20 = {
    id: 'count-20', title: 'Count to 20 with ten frames', years: [1, 1], icon: '🔟',
    desc: 'Spot 10 at a glance, then count on.',
    lesson() {
      const m = rand(6, 9), n = rand(11, 19), n2 = rand(12, 20), e = pick(EM);
      return [
        { say: 'This is a <b>ten frame</b>. It has 2 rows of 5 boxes. When every box is full, there are exactly <b>10</b>! 🎉', show: V.tenFrame(10, e) },
        { say: 'Don\'t count one by one! The top row is full, so that is <b>5</b>. Then count on along the bottom row: 6, 7, 8…', show: V.tenFrame(m, e),
          try: { q: 'How many counters?', answer: m, hint: 'Say “5” for the top row, then count on.' } },
        { say: 'Now there are <b>two</b> ten frames. The first one is full: that is <b>10</b> straight away! Count on with the second frame: 11, 12, 13…', show: V.tenFrame(n, e),
          try: { q: 'How many counters altogether?', answer: n, hint: 'Start at 10 and count on.' } },
        { say: `So <b>${n}</b> is <b>1 ten and ${n - 10} ones</b>. In teen numbers, the 1 at the front means one full ten frame!`, show: `<div class="say-big">${n} = 10 + ${n - 10}</div>` + V.tenFrame(n, e) },
        { say: 'Your turn! Count it the clever way.', show: V.tenFrame(n2, '🟢'),
          try: { type: 'guided', parts: [
            { say: 'How many are in the full frame?', answer: 10 },
            { say: 'How many are in the other frame?', answer: n2 - 10 },
            { say: 'So how many altogether?', answer: n2, after: `10 + ${n2 - 10} = ${n2}` },
          ] } },
      ];
    },
    gen() {
      const n = rand(3, 20), e = pick(EM), r = Math.random();
      if (n > 10 && r < 0.25) return { q: `What number is <b>1 ten and ${n - 10} ones</b>?`, visual: V.tenFrame(n, e), answer: n, hint: 'A full frame is 10. Add the ones.', steps: [`10 + ${n - 10} = <b>${n}</b>`] };
      if (n > 10 && r < 0.4) return { q: `10 + ${n - 10} = ?`, visual: V.tenFrame(n, e), answer: n, hint: 'Start at 10 and count on.', steps: [`Start at 10 and count on ${n - 10}: <b>${n}</b>`] };
      return {
        q: 'How many are there?', visual: V.tenFrame(n, e), answer: n,
        hint: n > 10 ? 'One frame is full: start at 10 and count on.' : 'Look for a full row of 5.',
        steps: [n > 10 ? `The full frame is <b>10</b>. Count on the other frame: ${Array.from({ length: n - 10 }, (_, k) => 11 + k).join(', ')}.` : n > 5 ? `The top row is <b>5</b>. Count on: ${Array.from({ length: n - 5 }, (_, k) => 6 + k).join(', ')}.` : `Count them: ${Array.from({ length: n }, (_, k) => k + 1).join(', ')}.`, `There are <b>${n}</b>.`],
      };
    },
    word() {
      const n = rand(11, 19), nm = U.name();
      return {
        type: 'guided', scene: '🥚', story: true,
        q: `${nm} has <b>${n}</b> eggs. An egg box holds 10 eggs.`, visual: V.tenFrame(n, '🥚'),
        parts: [
          { say: 'How many boxes can be completely filled?', answer: 1 },
          { say: 'How many eggs are left over?', answer: n - 10, after: `${n} = 10 + ${n - 10}` },
        ],
      };
    },
  };

  /* ================= Y1–2: one more, one less (ten more, ten less) ================= */
  const moreLessLine = (v, jumps = []) => V.numberLine({ min: Math.max(0, v - 4), max: v + 4, step: 1, jumps, points: jumps.length ? [] : [{ v, color: '#14b8a6', label: fmt(v) }] });
  const oneMoreLess = {
    id: 'one-more-less', title: 'One more, one less', years: [1, 2], icon: '↔️',
    desc: 'Hop one step (or a jump of ten) along the number line.',
    lesson(y) {
      const n = y === 1 ? rand(4, 16) : rand(23, 85), m = y === 1 ? rand(3, 18) : rand(24, 85), k = y === 1 ? rand(3, 18) : rand(24, 85);
      const fr = [
        { say: '<b>One more</b> is the next number when we count. On a number line it is one hop to the <b>right</b> ➡️.', show: moreLessLine(n, [{ from: n, to: n + 1, label: '+1' }]) },
        { say: 'Find the number, then hop one to the right.', show: moreLessLine(m), try: { q: `What is one more than <b>${m}</b>?`, answer: m + 1, hint: `Count on one from ${m}.` } },
        { say: '<b>One less</b> is one hop back, to the <b>left</b> ⬅️. It is the number just before.', show: moreLessLine(n, [{ from: n, to: n - 1, label: '−1' }]),
          try: { q: `What is one less than <b>${m}</b>?`, answer: m - 1, hint: `Which number comes just before ${m}?` } },
      ];
      if (y >= 2) {
        fr.push({ say: `<b>Ten more</b> is a big jump of 10. With blocks, we add one more ten stick. Only the <b>tens</b> digit changes: ${n} → ${n + 10}!`, show: `<div class="row-center">${V.base10(n)}<span class="op">→</span>${V.base10(n + 10)}</div>`,
          try: { q: `What is 10 more than <b>${m}</b>?`, answer: m + 10, hint: 'Add 1 to the tens digit.' } });
        fr.push({ say: '<b>Ten less</b>: take one ten stick away. The tens digit goes down by 1, the ones stay the same.', show: `<div class="row-center">${V.base10(n)}<span class="op">→</span>${V.base10(n - 10)}</div>`,
          try: { q: `What is 10 less than <b>${k}</b>?`, answer: k - 10, hint: 'Take 1 away from the tens digit.' } });
      }
      const parts = [
        { say: `What is one more than <b>${k}</b>?`, answer: k + 1 },
        { say: `What is one less than <b>${k}</b>?`, answer: k - 1 },
      ];
      if (y >= 2) parts.push({ say: `What is 10 more than <b>${k}</b>?`, answer: k + 10 }, { say: `What is 10 less than <b>${k}</b>?`, answer: k - 10 });
      fr.push({ say: 'Your turn! Do them all.', try: { type: 'guided', visual: moreLessLine(k), parts } });
      return fr;
    },
    gen(y) {
      const ops = y === 1 ? [[1, 'one more than'], [-1, 'one less than']] : [[1, 'one more than'], [-1, 'one less than'], [10, '10 more than'], [-10, '10 less than']];
      const [d, txt] = pick(ops);
      const max = y === 1 ? 20 : 99;
      const n = rand(Math.max(1, -d), max - Math.max(0, d));
      const visual = y === 1 ? V.numberLine({ min: 0, max: 20, step: 1, points: [{ v: n, color: '#14b8a6' }] }) : Math.abs(d) === 10 ? V.base10(n) : '';
      return {
        q: `What is <b>${txt}</b> ${fmt(n)}?`, visual, answer: n + d,
        hint: d > 0 ? (d === 1 ? 'Hop one to the right.' : 'Add 1 to the tens digit.') : (d === -1 ? 'Hop one to the left.' : 'Take 1 from the tens digit.'),
        steps: [moreLessLine(n, [{ from: n, to: n + d, label: (d > 0 ? '+' : '−') + Math.abs(d) }]), `${fmt(n)} ${d > 0 ? '+' : '−'} ${Math.abs(d)} = <b>${fmt(n + d)}</b>`],
      };
    },
    word(y) {
      const nm = U.name();
      if (y === 1) {
        const n = rand(4, 18);
        return Math.random() < 0.5
          ? { q: `There are <b>${n}</b> ducks on the pond. One more duck lands. How many ducks are there now?`, scene: '🦆', story: true, answer: n + 1, hint: 'One more.', steps: [`One more than ${n} is <b>${n + 1}</b>.`] }
          : { q: `There are <b>${n}</b> birds in a tree. One flies away. How many are left?`, scene: '🐦', story: true, answer: n - 1, hint: 'One less.', steps: [`One less than ${n} is <b>${n - 1}</b>.`] };
      }
      const n = rand(21, 85);
      return Math.random() < 0.5
        ? { q: `${nm} has <b>${n}</b> stickers and buys a pack of <b>10</b> more. How many stickers now?`, scene: '⭐', story: true, answer: n + 10, hint: '10 more: the tens digit goes up by 1.', steps: [`10 more than ${n} is <b>${n + 10}</b>.`] }
        : { q: `A shop has <b>${n}</b> balloons. It sells a bunch of <b>10</b>. How many balloons are left?`, scene: '🎈', story: true, answer: n - 10, hint: '10 less: the tens digit goes down by 1.', steps: [`10 less than ${n} is <b>${n - 10}</b>.`] };
    },
  };

  /* ================= Y1–2: number bonds ================= */
  const bonds = {
    id: 'bonds', title: 'Number bonds to 10 (and 20, 100)', years: [1, 2], icon: '🤝',
    desc: 'Pairs of numbers that make 10 — the empty boxes tell you!',
    lesson(y) {
      const a = rand(2, 8), c = rand(1, 8), b = rand(1, 9), t = rand(1, 9);
      const choices = shuffle([
        { v: `${c}+${10 - c}`, html: `${c} + ${10 - c}` },
        { v: `${c}+${11 - c}`, html: `${c} + ${11 - c}` },
        { v: `${c}+${9 - c}`, html: `${c} + ${9 - c}` },
      ]);
      const fr = [
        { say: 'A <b>number bond</b> is a pair of numbers that make a bigger number. Look: 7 red and 3 blue fill the frame. 7 and 3 make <b>10</b>!', show: V.tenFrame(10, '🔴', { second: 3, emoji2: '🔵' }) + '<div class="say-big">7 + 3 = 10</div>' },
        { say: `Here are ${a} counters. The <b>empty boxes</b> show how many more we need to make 10. Count the empty boxes!`, show: V.tenFrame(a, '🔴'),
          try: { q: `${a} + ? = 10`, answer: 10 - a, hint: 'Count the empty boxes.' } },
        { say: 'Here are all the bonds to 10. See the pattern? One number goes up while the other goes down!', show: V.chips(Array.from({ length: 11 }, (_, k) => `${k} + ${10 - k}`)),
          try: { q: 'Which pair makes 10?', type: 'choice', choices, answer: `${c}+${10 - c}`, hint: 'Add each pair. Which one makes exactly 10?' } },
      ];
      if (y >= 2) {
        fr.push({ say: `Bonds to 10 help with bigger numbers! If ${t} + ${10 - t} = 10, then ${t}0 + ${10 - t}0 = <b>100</b>. Tens work just like ones.`, show: V.chips([`${t} + ${10 - t} = 10`, `${t * 10} + ${(10 - t) * 10} = 100`]),
          try: { q: `${t * 10} + ? = 100`, answer: 100 - t * 10, hint: `${t} + ? = 10, so ${t}0 + ?0 = 100.` } });
        fr.push({ say: `And for 20: one frame is full (10), so we only need to fill the second frame.`, show: V.tenFrame(10 + b, '🔴'),
          try: { q: `${10 + b} + ? = 20`, answer: 10 - b, hint: 'Count the empty boxes in the second frame.' } });
      }
      const k = rand(2, 8);
      fr.push(y === 1
        ? { say: 'Your turn! Use the empty boxes.', show: V.tenFrame(k, '🟢'), try: { q: `? + ${k} = 10`, answer: 10 - k, hint: 'Count the empty boxes.' } }
        : { say: 'Your turn! One bond helps with three sums.', try: { type: 'guided', parts: [
          { say: `${k} + ? = 10`, answer: 10 - k },
          { say: `${10 + k} + ? = 20`, answer: 10 - k },
          { say: `${k * 10} + ? = 100`, answer: 100 - k * 10, after: 'Same bond, three times! 🎉' },
        ] } });
      return fr;
    },
    gen(y) {
      const r = Math.random();
      const a = rand(1, 9);
      if (y === 1 || r < 0.4) {
        return Math.random() < 0.5
          ? { q: `${a} + ? = 10`, visual: V.tenFrame(a, pick(EM)), answer: 10 - a, hint: 'Count the empty boxes.', steps: [`${a} + <b>${10 - a}</b> = 10`] }
          : { q: `? + ${a} = 10`, visual: V.tenFrame(a, pick(EM)), answer: 10 - a, hint: 'How many empty boxes?', steps: [`<b>${10 - a}</b> + ${a} = 10`] };
      }
      if (r < 0.7) return { q: `${10 + a} + ? = 20`, visual: V.tenFrame(10 + a, pick(EM)), answer: 10 - a, hint: 'Fill the second frame.', steps: [`${a} + ${10 - a} = 10, so ${10 + a} + <b>${10 - a}</b> = 20`] };
      return { q: `${a * 10} + ? = 100`, answer: 100 - a * 10, hint: `Use the bond ${a} + ? = 10.`, steps: [`${a} + ${10 - a} = 10, so ${a * 10} + <b>${100 - a * 10}</b> = 100`] };
    },
    word(y) {
      const nm = U.name();
      if (y === 1 || Math.random() < 0.5) {
        const a = rand(2, 9);
        return { q: `A minibus has <b>10</b> seats. <b>${a}</b> children sit down. How many seats are still empty?`, scene: '🚐', story: true, visual: V.tenFrame(a, '🧒'), answer: 10 - a, hint: `${a} + ? = 10`, steps: [`${a} + <b>${10 - a}</b> = 10`] };
      }
      const a = rand(11, 19);
      return { q: `In a game you need <b>20</b> points to win. ${nm} has <b>${a}</b> points. How many more points are needed?`, scene: '🎮', story: true, answer: 20 - a, hint: `${a} + ? = 20`, steps: [`${a} + <b>${20 - a}</b> = 20`] };
    },
  };

  /* ================= Y1–6: compare numbers ================= */
  const compare = {
    id: 'compare', title: 'Compare numbers with <, > and =', years: [1, 6], icon: '🐊',
    desc: 'Which is greater? Compare the biggest place first.',
    lesson(y) {
      let a, b;
      do { [a, b] = pair(y, false); } while (a === b);
      let c, d;
      do { [c, d] = pair(y, false); } while (c === d);
      const fr = [
        { say: 'To <b>compare</b> two numbers we ask: which one is <b>greater</b> (bigger)? We use special signs.', show: '<div class="say-big">8 &gt; 3 &nbsp;·&nbsp; 3 &lt; 8 &nbsp;·&nbsp; 5 = 5</div><p class="tip">🐊 Think of a hungry crocodile: its open mouth always faces the <b>bigger</b> number! <b>&gt;</b> means “greater than”, <b>&lt;</b> means “less than”.</p>' },
      ];
      if (y <= 2) {
        fr.push({ say: y === 1 ? 'Look at the ten frames. Which one has <b>more</b> counters?' : 'Look at the blocks. Count the tens first: more tens means a bigger number. If the tens are the same, look at the ones.',
          show: `<div class="row-center">${showNum(a, y)}<span class="op">?</span>${showNum(b, y)}</div>`,
          try: { q: 'Which number is greater?', type: 'choice', choices: [{ v: String(a), html: fmt(a) }, { v: String(b), html: fmt(b) }], answer: String(Math.max(a, b)), hint: y === 1 ? 'Which has more counters?' : 'Which has more tens?' } });
      } else {
        fr.push({ say: 'Put the numbers in a place value table. Compare the <b>biggest place first</b> (on the left). If those digits are the same, move one place to the right.',
          show: V.pvTable(a) + V.pvTable(b),
          try: { q: 'Which number is greater?', type: 'choice', choices: [{ v: String(a), html: fmt(a) }, { v: String(b), html: fmt(b) }], answer: String(Math.max(a, b)), hint: 'Start with the digits on the left.' } });
      }
      fr.push({ say: `${whyCompare(a, b)} Now choose the right sign. Remember: the open mouth faces the bigger number.`, show: `<div class="say-big">${fmt(a)} <span class="box">?</span> ${fmt(b)}</div>`,
        try: { q: `${fmt(a)} <span class="box">?</span> ${fmt(b)}`, type: 'choice', choices: SIGNS(), answer: signOf(a, b), hint: `${fmt(Math.max(a, b))} is bigger.` } });
      if (y >= 3) {
        const L = String(a).length;
        fr.push({ say: `Watch out! A whole number with <b>more digits</b> is always bigger: ${fmt(10 ** L)} has ${L + 1} digits, ${fmt(10 ** L - 1)} has only ${L}.`, show: `<div class="say-big">${fmt(10 ** L)} &gt; ${fmt(10 ** L - 1)}</div>`,
          try: { q: `${fmt(c)} <span class="box">?</span> ${fmt(d)}`, type: 'choice', choices: SIGNS(), answer: signOf(c, d), hint: 'Compare the biggest place first.' } });
      } else {
        fr.push({ say: 'When both numbers are the same, we use the <b>equals</b> sign: they are balanced, like a see-saw. ⚖️', show: `<div class="say-big">${fmt(c)} = ${fmt(c)}</div>`,
          try: { q: `${fmt(c)} <span class="box">?</span> ${fmt(d)}`, type: 'choice', choices: SIGNS(), answer: signOf(c, d), visual: y === 1 ? `<div class="row-center">${showNum(c, y)}<span class="op">?</span>${showNum(d, y)}</div>` : '' } });
      }
      let e, f;
      do { [e, f] = pair(y, false); } while (e === f);
      fr.push({ say: 'Your turn! Two small steps.', try: { type: 'guided', parts: [
        { say: `Which is greater: ${fmt(e)} or ${fmt(f)}?`, type: 'choice', choices: [{ v: String(e), html: fmt(e) }, { v: String(f), html: fmt(f) }], answer: String(Math.max(e, f)) },
        { say: `Choose the sign: ${fmt(e)} <span class="box">?</span> ${fmt(f)}`, type: 'choice', choices: SIGNS(), answer: signOf(e, f), after: `${fmt(e)} ${signHTML(signOf(e, f))} ${fmt(f)}` },
      ] } });
      return fr;
    },
    gen(y) {
      const [a, b] = pair(y);
      if (a !== b && Math.random() < 0.25) {
        return { q: 'Which number is <b>greater</b>?', type: 'choice', choices: [{ v: String(a), html: fmt(a) }, { v: String(b), html: fmt(b) }], answer: String(Math.max(a, b)), hint: 'Compare the biggest place first.', steps: [whyCompare(a, b)] };
      }
      return {
        q: `${fmt(a)} <span class="box">?</span> ${fmt(b)}`, type: 'choice', choices: SIGNS(), answer: signOf(a, b),
        visual: y <= 2 ? `<div class="row-center">${showNum(a, y)}<span class="op">?</span>${showNum(b, y)}</div>` : '',
        hint: 'The open mouth faces the bigger number.',
        steps: [whyCompare(a, b), `${fmt(a)} ${SIGN_WORD[signOf(a, b)]} ${fmt(b)}: <b>${fmt(a)} ${signHTML(signOf(a, b))} ${fmt(b)}</b>`],
      };
    },
    word(y) {
      let a, b;
      do { [a, b] = pair(y, false); } while (a === b);
      const [n1, n2] = U.twoNames();
      const ctx = y <= 2
        ? { q: `${n1} has <b>${fmt(a)}</b> marbles. ${n2} has <b>${fmt(b)}</b> marbles. Who has <b>more</b>?`, scene: '🔵' }
        : y <= 4
          ? { q: `${n1}'s school has <b>${fmt(a)}</b> books in the library. ${n2}'s school has <b>${fmt(b)}</b>. Whose library has <b>more</b> books?`, scene: '📚' }
          : { q: `${n1} lives in a town with <b>${fmt(a)}</b> people. ${n2}'s town has <b>${fmt(b)}</b> people. Whose town is <b>bigger</b>?`, scene: '🏙️' };
      return {
        q: ctx.q, scene: ctx.scene, story: true, type: 'choice',
        choices: [{ v: n1, html: n1 }, { v: n2, html: n2 }], answer: a > b ? n1 : n2,
        hint: 'Compare the biggest place first.', steps: [whyCompare(a, b)],
      };
    },
  };

  /* ================= Y1–6: order numbers ================= */
  function orderLine(list) {
    const lo = Math.min(...list), hi = Math.max(...list);
    const pad = Math.max(1, Math.round((hi - lo) * 0.1));
    return V.numberLine({ min: Math.max(0, lo - pad), max: hi + pad, points: list.map((v) => ({ v, label: fmt(v), color: '#14b8a6' })) });
  }
  const order = {
    id: 'order', title: 'Order numbers', years: [1, 6], icon: '📶',
    desc: 'Smallest to biggest (ascending) or biggest to smallest (descending).',
    lesson(y) {
      const k = y === 1 ? 3 : 4;
      const list = distinctNums(y, k);
      const sorted = [...list].sort((p, q) => p - q);
      const next = distinctNums(y, k);
      return [
        { say: '<b>Ordering</b> means putting numbers in a line. <b>Ascending</b> means smallest to biggest, like going up the stairs 📈. <b>Descending</b> means biggest to smallest 📉.', show: V.chips(list.map((v) => fmt(v))) },
        { say: y <= 2 ? 'On a number line, smaller numbers are always further to the <b>left</b>.' : 'On a number line, smaller numbers are further to the <b>left</b>. You can also compare the digits in the biggest place first.', show: orderLine(list),
          try: { q: 'Which number is the <b>smallest</b>?', type: 'choice', choices: list.map((v) => ({ v: String(v), html: fmt(v) })), answer: String(sorted[0]), hint: 'Which one is furthest to the left?' } },
        { say: 'Great! The biggest number is furthest to the <b>right</b>.', show: orderLine(list),
          try: { q: 'Which number is the <b>biggest</b>?', type: 'choice', choices: list.map((v) => ({ v: String(v), html: fmt(v) })), answer: String(sorted[sorted.length - 1]), hint: 'Which one is furthest to the right?' } },
        { say: 'To order them: find the smallest, then the next smallest, and so on. In ascending order they go:', show: V.chips(sorted.map((v) => fmt(v)), [0]) },
        { say: 'Your turn! Put these numbers in order.', try: { type: 'order', items: next.map((v) => ({ v, html: fmt(v) })), dir: 'asc', hint: 'Find the smallest first.' } },
      ];
    },
    gen(y) {
      const list = distinctNums(y, y === 1 ? 3 : 4);
      const dir = y >= 2 && Math.random() < 0.4 ? 'desc' : 'asc';
      const sorted = [...list].sort((p, q) => (dir === 'asc' ? p - q : q - p));
      return {
        q: `Put these numbers in order, <b>${dir === 'asc' ? 'smallest first' : 'biggest first'}</b>.`, type: 'order',
        items: list.map((v) => ({ v, html: fmt(v) })), dir,
        hint: dir === 'asc' ? 'Find the smallest number first.' : 'Find the biggest number first.',
        steps: [orderLine(list), `In order: <b>${sorted.map((v) => fmt(v)).join(', ')}</b>`],
      };
    },
    word(y) {
      const names = shuffle(['Mia', 'Leo', 'Zara', 'Sam', 'Aisha', 'Noah', 'Lina', 'Omar']).slice(0, 4);
      const list = distinctNums(y, 4);
      const ctx = y <= 2 ? ['points in a game', '🎯'] : y <= 4 ? ['steps walked in a day', '👟'] : ['views on their video', '📺'];
      return {
        q: `Four friends counted their ${ctx[0]}. Put them in order from the <b>most</b> to the <b>fewest</b>.`, scene: ctx[1], story: true, type: 'order', dir: 'desc',
        items: list.map((v, i) => ({ v, html: `${names[i]}: ${fmt(v)}` })),
        hint: 'Find the biggest number first.',
        steps: [`From most to fewest: ${[...list].sort((p, q) => q - p).map((v) => `${names[list.indexOf(v)]} (${fmt(v)})`).join(', ')}`],
      };
    },
  };

  /* ================= Y2: tens and ones ================= */
  function twoDigit() { let n; do { n = rand(21, 89); } while (n % 10 === 0); return n; }
  const tensOnes = {
    id: 'tens-ones', title: 'Tens and ones', years: [2, 2], icon: '🧱',
    desc: 'Build 2-digit numbers with ten sticks and ones, then partition them.',
    lesson() {
      const n = twoDigit(), m = twoDigit(), k = twoDigit();
      const T = n - (n % 10), O = n % 10;
      return [
        { say: 'When we have <b>10 ones</b>, we can bundle them into <b>1 ten</b>. A ten stick is just 10 cubes joined together!', show: `<div class="row-center">${V.objects(10, '🟨', { perRow: 10 })}<span class="op">→</span>${V.base10(10)}</div>` },
        { say: `${n} is made of <b>${T / 10} tens</b> and <b>${O} ones</b>. The first digit tells us the tens, the second digit tells us the ones.`, show: V.base10(n) + V.pvTable(n, ['t', 'o']),
          try: { q: `How many <b>tens</b> are in ${n}?`, answer: T / 10, hint: 'Look at the first digit.' } },
        { say: 'Now you build a number! Use the + and − buttons.', try: { type: 'blocks', target: m, q: `Build <b>${m}</b> with tens and ones.`, hint: `${m} has ${Math.floor(m / 10)} tens and ${m % 10} ones.` } },
        { say: `We can <b>partition</b> (split) a number into tens and ones: ${n} = ${T} + ${O}.`, show: `<div class="say-big">${n} = ${T} + ${O}</div>`,
          try: { q: `${n} = ${T} + ?`, answer: O, hint: 'How many ones?' } },
        { say: `There are other ways to partition! Swap 1 ten for 10 ones: ${T} becomes ${T - 10}, and ${O} becomes ${O + 10}.`, show: `<div class="say-big">${n} = ${T} + ${O} = ${T - 10} + ${O + 10}</div>`,
          try: { q: `${n} = ${T - 10} + ?`, answer: O + 10, hint: `${T - 10} + ? = ${n}` } },
        { say: 'Your turn! Build it, then split it.', try: { type: 'guided', parts: [
          { say: `Build <b>${k}</b>.`, type: 'blocks', target: k },
          { say: `How many tens are in ${k}?`, answer: Math.floor(k / 10) },
          { say: `${k} = ? + ${k % 10}`, answer: k - (k % 10), after: `${k} = ${k - (k % 10)} + ${k % 10}` },
        ] } },
      ];
    },
    gen() {
      const n = twoDigit(), T = n - (n % 10), O = n % 10, r = Math.random();
      if (r < 0.25) return { q: `Build <b>${n}</b> with tens and ones.`, type: 'blocks', target: n, hint: `${Math.floor(n / 10)} tens and ${O} ones.`, steps: [V.base10(n), `${n} = ${T / 10} tens and ${O} ones`] };
      if (r < 0.45) return { q: 'What number is shown?', visual: V.base10(n), answer: n, hint: 'Count the tens in 10s, then the ones.', steps: [`${T / 10} tens = ${T}, and ${O} ones.`, `${T} + ${O} = <b>${n}</b>`] };
      if (r < 0.65) return { q: `${n} = ? + ${O}`, answer: T, hint: 'How many tens? Write it as a tens number.', steps: [`${n} = <b>${T}</b> + ${O}`] };
      if (r < 0.85) return { q: `${n} = ${T - 10} + ?`, answer: O + 10, hint: 'Swap one ten for 10 ones.', steps: [`${n} = ${T} + ${O} = ${T - 10} + <b>${O + 10}</b>`] };
      return { q: `What number has <b>${T / 10} tens</b> and <b>${O} ones</b>?`, answer: n, hint: 'Tens first, then ones.', steps: [`${T} + ${O} = <b>${n}</b>`] };
    },
    word() {
      const n = twoDigit(), nm = U.name();
      return {
        type: 'guided', scene: '✏️', story: true,
        q: `Pencils come in boxes of 10. ${nm} has <b>${Math.floor(n / 10)}</b> full boxes and <b>${n % 10}</b> loose pencils.`,
        parts: [
          { say: `How many pencils are in the ${Math.floor(n / 10)} boxes?`, answer: n - (n % 10) },
          { say: 'How many pencils altogether?', answer: n, after: `${n - (n % 10)} + ${n % 10} = ${n}` },
        ],
      };
    },
  };

  /* ================= Y1–3: count in steps ================= */
  function makeSeq(y) {
    const steps = y === 1 ? [2, 5, 10] : y === 2 ? [2, 3, 5, 10] : [4, 8, 50, 100];
    const s = pick(steps);
    let start = s * rand(0, y === 1 ? 3 : 6);
    if (y === 2 && s === 10 && Math.random() < 0.5) start = rand(1, 9) + 10 * rand(0, 3);
    const list = Array.from({ length: 5 }, (_, k) => start + k * s);
    const desc = y >= 2 && Math.random() < 0.35;
    if (desc) list.reverse();
    return { s, list, desc };
  }
  const countSteps = {
    id: 'count-steps', title: 'Count in steps', years: [1, 3], icon: '🐸',
    desc: 'Count in 2s, 3s, 4s, 5s, 8s, 10s, 50s and 100s. Find the missing number.',
    lesson(y) {
      const s = y === 1 ? pick([2, 5, 10]) : y === 2 ? pick([2, 3, 5]) : pick([4, 8, 50]);
      const jumps = Array.from({ length: 5 }, (_, k) => ({ from: k * s, to: (k + 1) * s, label: '+' + s }));
      const a = Array.from({ length: 5 }, (_, k) => (rand(0, 3) * s) + k * s).map((v, k, arr) => arr[0] + k * s);
      const bStart = s * rand(6, 9);
      const b = Array.from({ length: 5 }, (_, k) => bStart - k * s);
      const c = makeSeq(y);
      const hide = rand(1, 3);
      return [
        { say: `Counting in <b>${s}s</b> means jumping <b>${s}</b> each time, like a frog on a number line. 🐸`, show: V.numberLine({ min: 0, max: 5 * s, step: s, jumps }) + V.chips(jumps.map((j) => fmt(j.to))) },
        { say: 'To find a missing number, first find the <b>step</b>: how much do we jump from one number to the next?', show: seqHTML(a, 4),
          try: { q: `The numbers go ${a.slice(0, 4).map((v) => fmt(v)).join(', ')}… What is the step?`, answer: s, hint: `${fmt(a[1])} − ${fmt(a[0])} = ?` } },
        { say: `Yes, the step is <b>${s}</b>. So the next number is ${fmt(a[3])} + ${s}.`, show: seqHTML(a, 4),
          try: { q: 'What is the next number?', answer: a[4], hint: `${fmt(a[3])} + ${s}` } },
        { say: `Sequences can go <b>backwards</b> too! Then we jump back ${s} each time.`, show: seqHTML(b, 2),
          try: { q: 'What is the missing number?', answer: b[2], hint: `${fmt(b[1])} − ${s}` } },
        { say: 'Your turn! Find the step first, then the missing number.', show: seqHTML(c.list, hide),
          try: { type: 'guided', parts: [
            { say: 'How big is each step?', answer: c.s },
            { say: `Does the sequence go up or down?`, type: 'choice', choices: [{ v: 'up', html: 'Up ⬆️' }, { v: 'down', html: 'Down ⬇️' }], answer: c.desc ? 'down' : 'up' },
            { say: 'What is the missing number?', answer: c.list[hide], after: seqHTML(c.list, -1) },
          ] } },
      ];
    },
    gen(y) {
      const { s, list, desc } = makeSeq(y);
      const hide = rand(1, 4);
      return {
        q: 'What is the missing number?', visual: seqHTML(list, hide), answer: list[hide],
        hint: 'Find the step between two numbers next to each other.',
        steps: [`The step is <b>${desc ? '−' : '+'}${s}</b>.`, seqHTML(list, -1), `The missing number is <b>${fmt(list[hide])}</b>.`],
      };
    },
  };

  /* ================= Y2–4: number lines ================= */
  const NL = { 2: { max: 100, step: 10, snap: 1, tol: 3 }, 3: { max: 1000, step: 100, snap: 10, tol: 30 }, 4: { max: 10000, step: 1000, snap: 100, tol: 300 } };
  const nlNum = (c) => { let n; do { n = rand(1, c.max / c.snap - 1) * c.snap; } while (n % c.step === 0); return n; };
  const nlPlace = {
    id: 'number-line', title: 'Numbers on a number line', years: [2, 4], icon: '📏',
    desc: 'Place numbers and estimate where an arrow points.',
    lesson(y) {
      const c = NL[y];
      const n = nlNum(c), lo = Math.floor(n / c.step) * c.step, v = nlNum(c), w = nlNum(c);
      const line = (o = {}) => V.numberLine(Object.assign({ min: 0, max: c.max, step: c.step }, o));
      return [
        { say: `This number line goes from 0 to ${fmt(c.max)}. Each mark is a jump of <b>${fmt(c.step)}</b>. The marks are evenly spaced, like stepping stones.`, show: line() },
        { say: `Halfway between 0 and ${fmt(c.max)} is <b>${fmt(c.max / 2)}</b>, right in the middle. Tap the line to put your marker there.`,
          try: { type: 'nlplace', q: `Put the marker on <b>${fmt(c.max / 2)}</b>.`, min: 0, max: c.max, step: c.step, snap: c.snap, answer: c.max / 2, tol: c.tol } },
        { say: `To place <b>${fmt(n)}</b>, find the two marks it is between: <b>${fmt(lo)}</b> and <b>${fmt(lo + c.step)}</b>. Is it nearer the start or the end of that gap?`,
          show: V.numberLine({ min: lo, max: lo + c.step, step: c.step / 10, points: [{ v: n, label: fmt(n), color: '#14b8a6' }] }),
          try: { type: 'nlplace', q: `Put the marker on <b>${fmt(n)}</b>.`, min: 0, max: c.max, step: c.step, snap: c.snap, answer: n, tol: c.tol, hint: `Between ${fmt(lo)} and ${fmt(lo + c.step)}.` } },
        { say: 'Now read a number line. Find the marks either side of the arrow, then <b>estimate</b>. A close answer counts!', show: line({ points: [{ v, emoji: '👇' }] }),
          try: { q: 'About what number is the arrow pointing to?', answer: v, tol: c.tol, hint: 'Which two marks is it between?' } },
        { say: 'Your turn!', try: { type: 'nlplace', q: `Put the marker on <b>${fmt(w)}</b>.`, min: 0, max: c.max, step: c.step, snap: c.snap, answer: w, tol: c.tol, hint: `It is between ${fmt(Math.floor(w / c.step) * c.step)} and ${fmt(Math.floor(w / c.step) * c.step + c.step)}.` } },
      ];
    },
    gen(y) {
      const c = NL[y], n = nlNum(c), lo = Math.floor(n / c.step) * c.step;
      const steps = [`${fmt(n)} is between ${fmt(lo)} and ${fmt(lo + c.step)}.`, V.numberLine({ min: 0, max: c.max, step: c.step, points: [{ v: n, label: fmt(n), color: '#16a34a' }] })];
      if (Math.random() < 0.6) return { type: 'nlplace', q: `Put the marker on <b>${fmt(n)}</b>.`, min: 0, max: c.max, step: c.step, snap: c.snap, answer: n, tol: c.tol, hint: `Find ${fmt(lo)} first.`, steps };
      return { q: 'About what number is the arrow pointing to?', visual: V.numberLine({ min: 0, max: c.max, step: c.step, points: [{ v: n, emoji: '👇' }] }), answer: n, tol: c.tol, hint: 'Which two marks is it between? Is it nearer one of them?', steps };
    },
  };

  /* ================= Y3: hundreds, tens and ones ================= */
  const hto3 = () => rand(1, 9) * 100 + rand(1, 9) * 10 + rand(1, 9);
  const hto = {
    id: 'hto', title: 'Hundreds, tens and ones', years: [3, 3], icon: '🟦',
    desc: '3-digit numbers with blocks and a place value table. Zero holds a place!',
    lesson() {
      const n = hto3(), m = hto3(), m2 = hto3(), k = hto3();
      const [h, t, o] = digitsOf(n);
      const z = rand(1, 9) * 100 + rand(1, 9);
      const zh = Math.floor(z / 100), zo = z % 10;
      return [
        { say: '10 ones make 1 ten. And <b>10 tens make 1 hundred</b>! A hundred is a big flat square made of 10 ten sticks.', show: `<div class="row-center">${V.base10(100)}</div><div class="say-big">10 tens = 100</div>` },
        { say: `${n} has <b>${h} hundreds</b>, <b>${t} tens</b> and <b>${o} ones</b>. Each digit's <b>place</b> tells us its value.`, show: V.base10(n) + V.pvTable(n),
          try: { q: `What is the value of the highlighted digit in ${hlDigit(n, 1)}?`, answer: t * 10, hint: 'It is in the tens place.' } },
        { say: 'Now build a 3-digit number yourself!', try: { type: 'blocks', target: m, q: `Build <b>${m}</b>.`, hint: `${Math.floor(m / 100)} hundreds, ${Math.floor((m % 100) / 10)} tens, ${m % 10} ones.` } },
        { say: `We can <b>partition</b> a number by place value: ${n} = ${h * 100} + ${t * 10} + ${o}.`, show: `<div class="say-big">${n} = ${h * 100} + ${t * 10} + ${o}</div>`,
          try: { q: `${m2} = ${Math.floor(m2 / 100) * 100} + ? + ${m2 % 10}`, answer: Math.floor((m2 % 100) / 10) * 10, hint: 'What are the tens worth?' } },
        { say: `What about <b>${z}</b>? It has ${zh} hundreds, <b>0 tens</b> and ${zo} ones. The 0 is a <b>place holder</b>: it keeps the ${zh} in the hundreds place!`, show: V.base10(z) + V.pvTable(z),
          try: { q: `Which number is <b>${zh} hundreds and ${zo} ones</b>?`, type: 'choice', choices: shuffle([z, zh * 10 + zo, zh * 100 + zo * 10]).map((v) => ({ v: String(v), html: fmt(v) })), answer: String(z), hint: 'There are 0 tens.' } },
        { say: 'Your turn!', try: { type: 'guided', parts: [
          { say: `Build <b>${k}</b>.`, type: 'blocks', target: k },
          { say: `What is the value of the highlighted digit in ${hlDigit(k, 2)}?`, answer: Math.floor(k / 100) * 100 },
          { say: `${k} = ${Math.floor(k / 100) * 100} + ${Math.floor((k % 100) / 10) * 10} + ?`, answer: k % 10 },
        ] } },
      ];
    },
    gen() {
      const n = rand(101, 999), [h, t, o] = digitsOf(n), r = Math.random();
      if (r < 0.25) return { q: `Build <b>${n}</b>.`, type: 'blocks', target: n, hint: `${h} hundreds, ${t} tens, ${o} ones.`, steps: [V.base10(n), V.pvTable(n)] };
      if (r < 0.5) {
        const p = pick([0, 1, 2].filter((q) => digitAt(n, q)));
        return { q: `What is the value of the highlighted digit in ${hlDigit(n, p)}?`, answer: digitAt(n, p) * 10 ** p, hint: `It is in the ${PLACES[p]} place.`, steps: [V.pvTable(n), `The ${digitAt(n, p)} is in the ${PLACES[p]} place, so it is worth <b>${fmt(digitAt(n, p) * 10 ** p)}</b>.`] };
      }
      if (r < 0.75) return { q: `What number has <b>${h} hundreds</b>, <b>${t} tens</b> and <b>${o} ones</b>?`, answer: n, hint: 'Write the digits in order: hundreds, tens, ones.', steps: [`${h * 100} + ${t * 10} + ${o} = <b>${n}</b>`] };
      return { q: `${n} = ${h * 100} + ? + ${o}`, answer: t * 10, hint: 'What are the tens worth?', steps: [`${n} = ${h * 100} + <b>${t * 10}</b> + ${o}`] };
    },
    word() {
      const n = hto3(), nm = U.name(), [h, t, o] = digitsOf(n);
      return {
        type: 'guided', scene: '⭐', story: true,
        q: `Stickers come in sheets of 100, strips of 10 and single stickers. ${nm} has <b>${h}</b> sheets, <b>${t}</b> strips and <b>${o}</b> single stickers.`,
        parts: [
          { say: 'How many stickers are on the sheets?', answer: h * 100 },
          { say: 'How many are on the strips?', answer: t * 10 },
          { say: 'How many stickers altogether?', answer: n, after: `${h * 100} + ${t * 10} + ${o} = ${n}` },
        ],
      };
    },
  };

  /* ================= Y3–4: 10, 100, 1000 more or less ================= */
  const amtText = (d) => `${fmt(Math.abs(d))} ${d > 0 ? 'more' : 'less'}`;
  function moreLessSteps(n, d) {
    const p = String(Math.abs(d)).length - 1;
    const r = n + d;
    const carry = Math.floor(n / 10 ** (p + 1)) !== Math.floor(r / 10 ** (p + 1));
    return [
      `${amtText(d)} changes the <b>${PLACES[p]}</b> digit by 1.`,
      carry ? `The ${PLACES[p]} digit was ${digitAt(n, p)}, so it crosses into the next place: ${d > 0 ? `10 ${PLACES[p]} make 1 ${single(PLACES[p + 1])}` : `we exchange 1 ${single(PLACES[p + 1])}`}.` : '',
      `<div class="row-center">${V.pvTable(n)}<span class="op">→</span>${V.pvTable(r)}</div>`,
      `${fmt(n)} ${d > 0 ? '+' : '−'} ${fmt(Math.abs(d))} = <b>${fmt(r)}</b>`,
    ];
  }
  const moreLess = {
    id: 'more-less-10-100', title: '10, 100 and 1,000 more or less', years: [3, 4], icon: '🔼',
    desc: 'Only one digit changes… unless it is a 9!',
    lesson(y) {
      const lo = y === 3 ? 120 : 1200, hi = y === 3 ? 880 : 8800;
      const safe = () => { let n; do { n = rand(lo, hi); } while (digitAt(n, 1) === 9 || digitAt(n, 1) === 0 || digitAt(n, 2) === 9 || digitAt(n, 2) === 0); return n; };
      const n = safe(), m = safe(), k = safe();
      const x = (y === 3 ? rand(1, 8) * 100 : rand(1, 8) * 1000 + rand(0, 9) * 100) + 90 + rand(0, 9);
      const x2 = (y === 3 ? rand(1, 8) * 100 : rand(1, 8) * 1000 + rand(0, 9) * 100) + 90 + rand(0, 9);
      const fr = [
        { say: 'Adding <b>10</b> makes the <b>tens</b> digit go up by 1. All the other digits stay the same!', show: `<div class="row-center">${V.pvTable(n)}<span class="op">→</span>${V.pvTable(n + 10)}</div><div class="say-big">${fmt(n)} + 10 = ${fmt(n + 10)}</div>`,
          try: { q: `What is 10 more than <b>${fmt(m)}</b>?`, answer: m + 10, hint: 'Add 1 to the tens digit.' } },
        { say: 'Adding <b>100</b> makes the <b>hundreds</b> digit go up by 1. Taking away 10 or 100 makes the digit go <b>down</b> by 1.', show: `<div class="row-center">${V.pvTable(n)}<span class="op">→</span>${V.pvTable(n + 100)}</div>`,
          try: { q: `What is 100 less than <b>${fmt(m)}</b>?`, answer: m - 100, hint: 'Take 1 from the hundreds digit.' } },
        { say: `Watch out for a <b>9</b>! What is 10 more than ${fmt(x)}? The tens digit is 9. 9 tens + 1 ten = 10 tens = <b>1 more hundred</b>. So the hundreds go up and the tens become 0.`, show: `<div class="row-center">${V.pvTable(x)}<span class="op">→</span>${V.pvTable(x + 10)}</div><div class="say-big">${fmt(x)} + 10 = ${fmt(x + 10)}</div>`,
          try: { q: `What is 10 more than <b>${fmt(x2)}</b>?`, answer: x2 + 10, hint: 'The 9 tens become 10 tens: one more hundred!' } },
      ];
      if (y >= 4) {
        fr.push({ say: 'And <b>1,000 more</b> changes the <b>thousands</b> digit.', show: `<div class="row-center">${V.pvTable(n)}<span class="op">→</span>${V.pvTable(n + 1000)}</div>`,
          try: { q: `What is 1,000 more than <b>${fmt(k)}</b>?`, answer: k + 1000, hint: 'Add 1 to the thousands digit.' } });
      }
      const parts = [
        { say: `10 less than ${fmt(k)}`, answer: k - 10 },
        { say: `100 more than ${fmt(k)}`, answer: k + 100 },
      ];
      if (y >= 4) parts.push({ say: `1,000 less than ${fmt(k)}`, answer: k - 1000 });
      fr.push({ say: 'Your turn!', try: { type: 'guided', parts } });
      return fr;
    },
    gen(y) {
      const ds = y === 3 ? [10, 100, -10, -100] : [10, 100, 1000, -10, -100, -1000];
      const d = pick(ds);
      const lo = (y === 3 ? 100 : 1000) + Math.max(0, -d), hi = (y === 3 ? 999 : 9999) - Math.max(0, d);
      let n = rand(lo, hi);
      if (Math.random() < 0.3 && d > 0 && d < 1000) {
        const p = String(d).length - 1;
        n = n - digitAt(n, p) * 10 ** p + 9 * 10 ** p; // make the changing digit a 9
        if (n + d > (y === 3 ? 999 : 9999)) n -= 10 ** (p + 1);
      }
      return { q: `What is <b>${amtText(d)}</b> than ${fmt(n)}?`, answer: n + d, hint: `Which digit changes when you ${d > 0 ? 'add' : 'take away'} ${fmt(Math.abs(d))}?`, steps: moreLessSteps(n, d).filter(Boolean) };
    },
    word(y) {
      const n = y === 3 ? rand(150, 850) : rand(1500, 8500), nm = U.name();
      return Math.random() < 0.5
        ? { q: `A school has <b>${fmt(n)}</b> pupils. Next year <b>100</b> more will join. How many pupils will there be?`, scene: '🏫', story: true, answer: n + 100, hint: 'The hundreds digit goes up by 1.', steps: moreLessSteps(n, 100) }
        : { q: `${nm}'s game score is <b>${fmt(n)}</b>. ${nm} loses <b>10</b> points. What is the score now?`, scene: '🎮', story: true, answer: n - 10, hint: 'The tens digit goes down by 1.', steps: moreLessSteps(n, -10) };
    },
  };

  /* ================= Y4–6: big numbers and digit values ================= */
  const bigNum = (y) => (y === 4 ? rand(1000, 9999) : y === 5 ? rand(10000, 999999) : rand(1000000, 9999999));
  function valueChoice(n) {
    const ps = [];
    for (let p = 1; p < String(n).length; p++) if (digitAt(n, p)) ps.push(p);
    const p = pick(ps), d = digitAt(n, p);
    const vals = [...new Set([d * 10 ** p, d * 10 ** (p + 1), d * 10 ** (p - 1), d])];
    return {
      q: `What is the value of the highlighted digit in <b>${hlDigit(n, p)}</b>?`, type: 'choice',
      choices: shuffle(vals).map((v) => ({ v: String(v), html: fmt(v) })), answer: String(d * 10 ** p),
      hint: `Count the places from the right: ones, tens, hundreds…`,
      steps: [V.pvTable(n), `The ${d} is in the <b>${PLACES[p]}</b> place, so it is worth ${d} × ${fmt(10 ** p)} = <b>${fmt(d * 10 ** p)}</b>.`],
    };
  }
  const partitionOf = (n) => digitsOf(n).map((d, i, arr) => d * 10 ** (arr.length - 1 - i)).filter(Boolean);
  const digitValue = {
    id: 'big-numbers', title: 'Read big numbers and digit values', years: [4, 6], icon: '🔭',
    desc: 'Thousands, ten-thousands, millions: what is each digit worth?',
    lesson(y) {
      const n = bigNum(y), m = bigNum(y), k = bigNum(y);
      const parts = partitionOf(n);
      const miss = rand(0, parts.length - 1);
      return [
        { say: 'Each place is <b>10 times bigger</b> than the place to its right: ones, tens, hundreds, thousands… That is why the same digit can be worth very different amounts!', show: V.pvTable(n) },
        { say: `We read big numbers in <b>groups of three digits</b>, using the commas. <b>${fmt(n)}</b> is read “${words(n)}”.`, show: `<div class="say-big">${fmt(n)}</div>` },
        { say: 'Find the place of the highlighted digit. Its value is the digit times that place.', show: V.pvTable(m), try: valueChoice(m) },
        { say: `We can <b>partition</b> any number into the values of its digits.`, show: `<div class="say-big">${fmt(n)} = ${parts.map((v) => fmt(v)).join(' + ')}</div>`,
          try: { q: `${fmt(n)} = ${parts.map((v, i) => (i === miss ? '<span class="box">?</span>' : fmt(v))).join(' + ')}`, answer: parts[miss], hint: 'Which digit is missing? What is it worth?' } },
        { say: 'Now write a number from words. Listen for the word “thousand” (and “million”): it tells you where the comma goes.', try: { q: `Write in digits: <b>${words(m)}</b>`, answer: m, hint: 'Write the thousands group first, then the last three digits.' } },
        { say: 'Your turn!', try: { type: 'guided', parts: [
          Object.assign(valueChoice(k), { say: 'Value of the highlighted digit:' }),
          { say: `Write in digits: <b>${words(k)}</b>`, answer: k },
        ] } },
      ];
    },
    gen(y) {
      const n = bigNum(y), r = Math.random();
      if (r < 0.4) return valueChoice(n);
      if (r < 0.7) return { q: `Write in digits: <b>${words(n)}</b>`, answer: n, hint: 'Find the word “thousand”: the numbers before it are the thousands.', steps: [`“${words(n)}” = <b>${fmt(n)}</b>`, V.pvTable(n)] };
      const parts = partitionOf(n), miss = rand(0, parts.length - 1);
      return { q: `${fmt(n)} = ${parts.map((v, i) => (i === miss ? '<span class="box">?</span>' : fmt(v))).join(' + ')}`, answer: parts[miss], hint: 'Each part is one digit times its place.', steps: [V.pvTable(n), `The missing part is <b>${fmt(parts[miss])}</b>.`] };
    },
    word(y) {
      const n = bigNum(y);
      const ctx = y === 4 ? ['A stadium has', 'seats', '🏟️'] : y === 5 ? ['A city has', 'people', '🏙️'] : ['A country has', 'people', '🌍'];
      return { q: `${ctx[0]} <b>${words(n)}</b> ${ctx[1]}. Write this number in digits.`, scene: ctx[2], story: true, answer: n, hint: 'The word “thousand” tells you where the comma goes.', steps: [`<b>${fmt(n)}</b>`, V.pvTable(n)] };
    },
  };

  /* ================= Y4–6: rounding ================= */
  const ROUND_TO = { 4: [10, 100, 1000], 5: [10, 100, 1000, 10000, 100000], 6: [10, 100, 1000, 10000, 100000, 1000000] };
  function roundNum(y, to) {
    const max = y === 4 ? 9999 : y === 5 ? 999999 : 9999999;
    let n;
    do { n = rand(Math.max(to + 1, Math.floor(max / 100)), max); } while (n % to === 0);
    return n;
  }
  const lineFor = (n, to) => { const lo = Math.floor(n / to) * to; return V.numberLine({ min: lo, max: lo + to, step: to / 10, points: [{ v: n, label: fmt(n), color: '#14b8a6' }] }); };
  function roundGuided(n, to) {
    const lo = Math.floor(n / to) * to, hi = lo + to, place = PLACES[String(to / 10).length - 1], d = digitAt(n, String(to / 10).length - 1);
    return {
      type: 'guided', q: `Round <b>${fmt(n)}</b> to the nearest <b>${fmt(to)}</b>.`, visual: lineFor(n, to),
      parts: [
        { say: `Which multiple of ${fmt(to)} comes just <b>before</b> ${fmt(n)}?`, answer: lo },
        { say: 'And which comes just <b>after</b>?', answer: hi },
        { say: `Look at the <b>${place}</b> digit: <b>${d}</b>. Do we round up or down?`, type: 'choice', choices: [{ v: 'down', html: 'Down ⬇️' }, { v: 'up', html: 'Up ⬆️' }], answer: d >= 5 ? 'up' : 'down', after: d >= 5 ? '5 or more: round up.' : '4 or less: round down.' },
        { say: 'So the answer is…', answer: roundTo(n, to) },
      ],
      steps: [`${fmt(n)} is between ${fmt(lo)} and ${fmt(hi)}.`, `The ${place} digit is ${d}, so round ${d >= 5 ? 'up' : 'down'}: <b>${fmt(roundTo(n, to))}</b>`],
    };
  }
  const rounding = {
    id: 'rounding', title: 'Rounding', years: [4, 6], icon: '🎯',
    desc: 'Round to the nearest 10, 100, 1,000 and more. Which is it closer to?',
    lesson(y) {
      let n1; do { n1 = rand(21, 389); } while (n1 % 10 === 0 || n1 % 10 === 5);
      const lo1 = Math.floor(n1 / 10) * 10;
      const m5 = rand(2, 98) * 10 + 5;
      let n2; do { n2 = rand(1001, 9899); } while (n2 % 100 === 0);
      const bigTo = y === 4 ? 1000 : y === 5 ? pick([10000, 100000]) : pick([100000, 1000000]);
      const n3 = roundNum(y, bigTo);
      const to4 = pick(ROUND_TO[y]);
      const n4 = roundNum(y, to4);
      return [
        { say: `<b>Rounding</b> makes a number simpler but keeps it close. “Round ${n1} to the nearest 10” means: which <b>ten</b> is ${n1} closest to?`, show: lineFor(n1, 10) },
        { say: `${n1} is between <b>${lo1}</b> and <b>${lo1 + 10}</b>. Look at the number line: which one is it nearer to?`, show: lineFor(n1, 10),
          try: { q: `Round ${n1} to the nearest 10.`, type: 'choice', choices: [{ v: String(lo1), html: fmt(lo1) }, { v: String(lo1 + 10), html: fmt(lo1 + 10) }], answer: String(roundTo(n1, 10)), hint: 'Which end of the line is closer?' } },
        { say: 'The <b>5 rule</b>: look at the digit just to the right of the place you round to. <b>0–4: round down</b>. <b>5–9: round up</b>. Exactly halfway (5) always rounds <b>up</b>!', show: V.chips(['43 → 40', '45 → 50', '47 → 50'], [1]),
          try: { q: `Round <b>${m5}</b> to the nearest 10.`, answer: roundTo(m5, 10), hint: 'It ends in 5: round up!' } },
        { say: `To round to the nearest <b>100</b>, look at the <b>tens</b> digit. ${fmt(n2)} has ${digitAt(n2, 1)} tens.`, show: lineFor(n2, 100),
          try: { q: `Round <b>${fmt(n2)}</b> to the nearest 100.`, answer: roundTo(n2, 100), hint: `Tens digit ${digitAt(n2, 1)}: ${digitAt(n2, 1) >= 5 ? 'round up' : 'round down'}.` } },
        { say: `Bigger places work the same way. To round to the nearest ${fmt(bigTo)}, look at the digit in the <b>${PLACES[String(bigTo / 10).length - 1]}</b> place.`, show: lineFor(n3, bigTo),
          try: { q: `Round <b>${fmt(n3)}</b> to the nearest ${fmt(bigTo)}.`, answer: roundTo(n3, bigTo), hint: `Look at the ${PLACES[String(bigTo / 10).length - 1]} digit.` } },
        { say: 'Your turn! Do every step.', try: roundGuided(n4, to4) },
      ];
    },
    gen(y) {
      const to = pick(ROUND_TO[y]), n = roundNum(y, to);
      if (Math.random() < 0.35) return roundGuided(n, to);
      const place = PLACES[String(to / 10).length - 1], d = digitAt(n, String(to / 10).length - 1);
      return {
        q: `Round <b>${fmt(n)}</b> to the nearest <b>${fmt(to)}</b>.`, visual: Math.random() < 0.5 ? lineFor(n, to) : '', answer: roundTo(n, to),
        hint: `Look at the ${place} digit.`,
        steps: [lineFor(n, to), `The ${place} digit is <b>${d}</b>, so round ${d >= 5 ? 'up' : 'down'}: <b>${fmt(roundTo(n, to))}</b>`],
      };
    },
    word(y) {
      const to = y === 4 ? pick([100, 1000]) : pick([1000, 10000]);
      const n = roundNum(y, to);
      const ctx = pick([[`<b>${fmt(n)}</b> people came to a festival. A newspaper rounds the number to the nearest ${fmt(to)}. What number does it print?`, '📰'], [`A plane flies <b>${fmt(n)}</b> km. Round the distance to the nearest ${fmt(to)} km.`, '✈️']]);
      return { q: ctx[0], scene: ctx[1], story: true, answer: roundTo(n, to), hint: `Look at the digit to the right of the ${PLACES[String(to).length - 1]}.`, steps: [lineFor(n, to), `<b>${fmt(roundTo(n, to))}</b>`] };
    },
  };

  /* ================= Y3–6: estimating ================= */
  /** Estimates always round to the nearest 10 (the school rule). Only the rounding skill practises 100 / 1,000. */
  function estNums(y) {
    const nz = (lo, hi) => { let n; do { n = rand(lo, hi); } while (n % 10 === 0); return n; };
    if (y === 3) return { a: nz(110, 890), b: nz(110, 890), u: 10 };
    if (y === 4) return { a: nz(1010, 8900), b: nz(1010, 8900), u: 10 };
    return { a: nz(10100, 89000), b: nz(1010, 89000), u: 10 };
  }
  /** Is the answer sensible? Estimate first (round both to the nearest 10), then decide. */
  function sensible(y) {
    const { a, b, u } = estNums(y);
    const add = Math.random() < 0.5;
    let [x, z] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
    if (x === z) x += 11;
    const exact = add ? x + z : x - z;
    const X = roundTo(x, u), Z = roundTo(z, u);
    const est = add ? X + Z : X - Z;
    const ok = Math.random() < 0.5;
    let shown = exact;
    if (!ok) {
      const off = pick([100, 200, 300, 1000, 9 * exact]);
      shown = off === 9 * exact ? exact * 10 : exact - off > 0 && Math.random() < 0.5 ? exact - off : exact + off;
    }
    const nm = U.name();
    const op = add ? '+' : '−';
    return {
      type: 'guided',
      q: `${nm} worked out <b>${fmt(x)} ${op} ${fmt(z)} = ${fmt(shown)}</b>. Is that answer sensible? Estimate first!`,
      hint: 'Round both numbers to the nearest 10, then calculate.',
      parts: [
        { say: `Round <b>${fmt(x)}</b> to the nearest 10.`, answer: X, hint: `Look at the ones digit: ${x % 10}. ${x % 10 >= 5 ? '5 or more: round up.' : 'Less than 5: round down.'}` },
        { say: `Round <b>${fmt(z)}</b> to the nearest 10.`, answer: Z, hint: `Look at the ones digit: ${z % 10}.` },
        { say: `Estimate: ${fmt(X)} ${op} ${fmt(Z)} = ?`, answer: est, after: `So ${fmt(x)} ${op} ${fmt(z)} ≈ ${fmt(est)}.` },
        { say: `${nm}'s answer was <b>${fmt(shown)}</b>. Is it close to your estimate?`, type: 'choice',
          choices: [{ v: 'yes', html: 'Yes, it is sensible 👍' }, { v: 'no', html: 'No, it is way off 👎' }], answer: ok ? 'yes' : 'no',
          after: ok ? `${fmt(shown)} is close to ${fmt(est)} ✔️` : `${fmt(shown)} is far from ${fmt(est)}. The exact answer is ${fmt(exact)}.` },
      ],
      steps: [`${fmt(x)} ≈ ${fmt(X)}, ${fmt(z)} ≈ ${fmt(Z)}`, `Estimate: ${fmt(X)} ${op} ${fmt(Z)} = <b>${fmt(est)}</b>.`, ok ? `${fmt(shown)} is close to ${fmt(est)}, so it is <b>sensible</b>.` : `${fmt(shown)} is far from ${fmt(est)}, so it is <b>not sensible</b>. The exact answer is ${fmt(exact)}.`],
    };
  }
  function mulEstimate() {
    const a = rand(21, 89), b = rand(12, 98);
    const A = roundSig(a), B = roundSig(b);
    return {
      q: `Estimate <b>${a} × ${b}</b> by rounding each number to the nearest 10.`, answer: A * B,
      hint: `${a} ≈ ${A} and ${b} ≈ ${B}.`,
      steps: [`${a} ≈ ${A}, ${b} ≈ ${B}`, `${A} × ${B} = <b>${fmt(A * B)}</b>`, `(The exact answer is ${fmt(a * b)} — close!)`],
    };
  }
  function divEstimate() {
    const d = rand(3, 9), Q = rand(2, 9) * 10;
    const n = d * Q + rand(-(d - 1), d - 1);
    return {
      q: `Estimate <b>${fmt(n)} ÷ ${d}</b>. Find a multiple of ${d} close to ${fmt(n)}.`, answer: Q, tol: 0,
      hint: `${d} × ${Q} = ${d * Q}, which is very close to ${fmt(n)}.`,
      steps: [`${fmt(n)} is close to ${fmt(d * Q)}, and ${fmt(d * Q)} ÷ ${d} = ${Q}.`, `So ${fmt(n)} ÷ ${d} ≈ <b>${Q}</b>.`],
    };
  }
  const estimate = {
    id: 'estimate', title: 'Estimate and check', years: [3, 6], icon: '🤔',
    desc: 'Round first, do the easy sum, then check the real answer is sensible.',
    lesson(y) {
      const { a, b, u } = estNums(y);
      const A = roundTo(a, u), B = roundTo(b, u);
      let c, d; ({ a: c, b: d } = estNums(y));
      if (c < d) [c, d] = [d, c];
      if (roundTo(c, u) <= roundTo(d, u)) c += 2 * u;
      const n = estNums(y);
      const fr = [
        { say: '<b>Estimating</b> means making a clever, quick guess. We round the numbers so the sum is easy to do in our head. The sign <b>≈</b> means “is about”.', show: `<div class="say-big">${fmt(a)} + ${fmt(b)} ≈ ?</div>` },
        { say: `Step 1: round <b>${fmt(a)}</b> to the nearest ${fmt(u)}.`, show: lineFor(a, u), try: { q: `Round ${fmt(a)} to the nearest ${fmt(u)}.`, answer: A, hint: `Look at the digit after the ${PLACES[String(u).length - 1]}.` } },
        { say: `Step 2: round <b>${fmt(b)}</b> to the nearest ${fmt(u)}.`, show: lineFor(b, u), try: { q: `Round ${fmt(b)} to the nearest ${fmt(u)}.`, answer: B } },
        { say: 'Step 3: add the rounded numbers. That is easy because of all the zeros!', show: `<div class="say-big">${fmt(a)} + ${fmt(b)} ≈ ${fmt(A)} + ${fmt(B)}</div>`, try: { q: `${fmt(A)} + ${fmt(B)} = ?`, answer: A + B } },
        { say: `The exact answer is <b>${fmt(a + b)}</b>. Our estimate, ${fmt(A + B)}, is close, so the exact answer is <b>sensible</b> ✔️. If your answer is far from the estimate, check your working!`, show: `<div class="say-big">${fmt(a + b)} ≈ ${fmt(A + B)}</div>` },
        { say: 'Subtraction works the same way: round, then subtract.', try: { q: `Estimate <b>${fmt(c)} − ${fmt(d)}</b> by rounding to the nearest ${fmt(u)}.`, answer: roundTo(c, u) - roundTo(d, u), hint: `${fmt(roundTo(c, u))} − ${fmt(roundTo(d, u))}` } },
        { say: 'Estimates help you catch mistakes. Is this answer sensible?', try: sensible(y) },
      ];
      if (y >= 6) fr.push({ say: 'For <b>multiplying</b>, round each number to the nearest 10 too: 38 × 21 ≈ 40 × 20 = 800.', try: mulEstimate() });
      fr.push({ say: 'Your turn! All the steps.', try: { type: 'guided', q: `Estimate <b>${fmt(n.a)} + ${fmt(n.b)}</b>.`, parts: [
        { say: `Round ${fmt(n.a)} to the nearest ${fmt(n.u)}.`, answer: roundTo(n.a, n.u) },
        { say: `Round ${fmt(n.b)} to the nearest ${fmt(n.u)}.`, answer: roundTo(n.b, n.u) },
        { say: 'Add the rounded numbers.', answer: roundTo(n.a, n.u) + roundTo(n.b, n.u), after: `The exact answer is ${fmt(n.a + n.b)} — close! ✔️` },
      ] } });
      return fr;
    },
    gen(y) {
      const r = Math.random();
      if (y >= 6 && r < 0.2) return mulEstimate();
      if (y >= 6 && r < 0.35) return divEstimate();
      if (r < 0.6) return sensible(y);
      const { a, b, u } = estNums(y);
      const add = Math.random() < 0.6 || roundTo(Math.max(a, b), u) === roundTo(Math.min(a, b), u);
      const [x, z] = add ? [a, b] : [Math.max(a, b), Math.min(a, b)];
      const est = add ? roundTo(x, u) + roundTo(z, u) : roundTo(x, u) - roundTo(z, u);
      return {
        q: `Estimate <b>${fmt(x)} ${add ? '+' : '−'} ${fmt(z)}</b> by rounding each number to the nearest ${fmt(u)}.`, answer: est,
        hint: 'Round both numbers first, then calculate.',
        steps: [`${fmt(x)} ≈ ${fmt(roundTo(x, u))} and ${fmt(z)} ≈ ${fmt(roundTo(z, u))}`, `${fmt(roundTo(x, u))} ${add ? '+' : '−'} ${fmt(roundTo(z, u))} = <b>${fmt(est)}</b>`],
      };
    },
    word(y) {
      if (y >= 6 && Math.random() < 0.4) {
        const packs = rand(21, 89), per = rand(12, 48), A = roundSig(packs), B = roundSig(per);
        return {
          type: 'guided', scene: '🖊️', story: true,
          q: `A school buys <b>${packs}</b> packs of pens. Each pack has <b>${per}</b> pens. About how many pens is that?`,
          parts: [
            { say: `Round ${packs} to the nearest 10.`, answer: A },
            { say: `Round ${per} to the nearest 10.`, answer: B },
            { say: `${A} × ${B} = ?`, answer: A * B, after: `About ${fmt(A * B)} pens (exactly ${fmt(packs * per)}).` },
          ],
        };
      }
      const { a, b, u } = estNums(y);
      return {
        type: 'guided', scene: '🚆', story: true,
        q: `A train carried <b>${fmt(a)}</b> passengers on Monday and <b>${fmt(b)}</b> on Tuesday. <b>About</b> how many passengers is that?`,
        parts: [
          { say: `Round ${fmt(a)} to the nearest ${fmt(u)}.`, answer: roundTo(a, u) },
          { say: `Round ${fmt(b)} to the nearest ${fmt(u)}.`, answer: roundTo(b, u) },
          { say: 'Add them.', answer: roundTo(a, u) + roundTo(b, u), after: `About ${fmt(roundTo(a, u) + roundTo(b, u))} passengers (exactly ${fmt(a + b)}).` },
        ],
      };
    },
  };

  /* ================= Y4–6: × and ÷ by 10, 100, 1000 ================= */
  function mdNum(y) {
    const F = y === 4 ? [10, 100] : [10, 100, 1000];
    const f = pick(F);
    const op = Math.random() < 0.5 ? '×' : '÷';
    let n;
    if (y === 4) n = op === '×' ? rand(2, 99) : rand(1, 99);
    else n = Math.random() < 0.5 ? rand(2, 999) : rand(11, 999) / pick([10, 100]);
    n = U.round(n, 2);
    const dpN = String(n).includes('.') ? String(n).split('.')[1].length : 0;
    if (op === '÷' && dpN + String(f).length - 1 > 3) return { n, f, op: '×', res: U.round(n * f, 6) };
    const res = U.round(op === '×' ? n * f : n / f, 6);
    return { n, f, op, res };
  }
  function mdSteps(n, f, op, res) {
    const k = String(f).length - 1;
    return [
      `${op === '×' ? 'Multiplying' : 'Dividing'} by ${fmt(f)} moves every digit <b>${k} place${k > 1 ? 's' : ''} to the ${op === '×' ? 'left' : 'right'}</b>.`,
      pvRows([{ label: fmt(n), n }, { label: `${op} ${fmt(f)}`, n: res }]),
      `${fmt(n)} ${op} ${fmt(f)} = <b>${fmt(res)}</b>`,
    ];
  }
  const mulDiv10 = {
    id: 'times-10-100', title: '× and ÷ by 10, 100 and 1,000', years: [4, 6], icon: '🚀',
    desc: 'Digits slide left or right in the place value table.',
    lesson(y) {
      const m = rand(12, 89), m2 = rand(3, 48), k = rand(2, 9) * 10 + rand(1, 9), dec = U.round(rand(11, 99) / 10, 1), k2 = rand(3, 89);
      const fr = [
        { say: 'When we <b>multiply by 10</b>, every digit moves <b>one place to the left</b>. Each digit becomes 10 times bigger. A zero fills the empty ones place.', show: pvRows([{ label: '34', n: 34 }, { label: '× 10', n: 340 }]) + '<div class="say-big">34 × 10 = 340</div>' },
        { say: 'Slide the digits one place left.', show: pvRows([{ label: fmt(m), n: m }]), try: { q: `${m} × 10 = ?`, answer: m * 10, hint: 'Each digit moves one place left.' } },
        { say: '× 100 moves the digits <b>two places</b> left. × 1,000 moves them <b>three places</b> left.', show: pvRows([{ label: '7', n: 7 }, { label: '× 10', n: 70 }, { label: '× 100', n: 700 }, { label: '× 1,000', n: 7000 }]),
          try: { q: `${m2} × 100 = ?`, answer: m2 * 100, hint: 'Two places left.' } },
        { say: '<b>Dividing</b> by 10 moves the digits one place to the <b>right</b>, so the number gets smaller. Digits can even slide past the decimal point!', show: pvRows([{ label: '470', n: 470 }, { label: '÷ 10', n: 47 }, { label: '÷ 10', n: 4.7 }]),
          try: { q: `${k} ÷ 10 = ?`, answer: k / 10, decimals: true, hint: 'One place right: the ones digit becomes tenths.' } },
      ];
      if (y >= 5) {
        fr.push({ say: `Decimals move too! ${fmt(dec)} × 10: the tenths digit slides into the ones. ⚠️ Don't just “add a zero”: ${fmt(dec)}0 is the same as ${fmt(dec)}!`, show: pvRows([{ label: fmt(dec), n: dec }, { label: '× 10', n: U.round(dec * 10, 4) }]),
          try: { q: `${fmt(dec)} × 100 = ?`, answer: U.round(dec * 100, 4), decimals: true, hint: 'Two places left.' } });
      } else {
        fr.push({ say: '÷ 100 moves the digits two places right. The ones become <b>hundredths</b>.', show: pvRows([{ label: '35', n: 35 }, { label: '÷ 100', n: 0.35 }]),
          try: { q: `${k2} ÷ 100 = ?`, answer: U.round(k2 / 100, 4), decimals: true, hint: 'Two places right.' } });
      }
      const a = mdNum(y), b = mdNum(y);
      fr.push({ say: 'Your turn!', try: { type: 'guided', parts: [
        { say: `${fmt(a.n)} ${a.op} ${fmt(a.f)} = ?`, answer: a.res, decimals: true },
        { say: `${fmt(b.n)} ${b.op} ${fmt(b.f)} = ?`, answer: b.res, decimals: true },
      ] } });
      return fr;
    },
    gen(y) {
      const { n, f, op, res } = mdNum(y);
      if (Math.random() < 0.2) {
        return { q: `${fmt(n)} ${op} <span class="box">?</span> = ${fmt(res)}`, type: 'choice', choices: [10, 100, 1000].filter((v) => y >= 5 || v < 1000).map((v) => ({ v: String(v), html: fmt(v) })), answer: String(f), hint: 'How many places did the digits move?', steps: mdSteps(n, f, op, res) };
      }
      return { q: `${fmt(n)} ${op} ${fmt(f)} = ?`, answer: res, decimals: true, hint: `Move the digits ${String(f).length - 1} place(s) to the ${op === '×' ? 'left' : 'right'}.`, steps: mdSteps(n, f, op, res) };
    },
    word(y) {
      const nm = U.name();
      if (Math.random() < 0.5) {
        const per = rand(12, 250), f = y === 4 ? pick([10, 100]) : pick([10, 100, 1000]);
        return { q: `One box holds <b>${per}</b> paper clips. How many paper clips are in <b>${fmt(f)}</b> boxes?`, scene: '📎', story: true, answer: per * f, hint: `× ${fmt(f)}: move the digits left.`, steps: mdSteps(per, f, '×', per * f) };
      }
      const kg = rand(3, 95), f = y === 4 ? 10 : pick([10, 100]);
      return { q: `${nm} shares <b>${kg} kg</b> of rice equally into <b>${f}</b> bags. How many kg go in each bag?`, scene: '🍚', story: true, answer: U.round(kg / f, 4), decimals: true, suffix: 'kg', hint: `÷ ${f}: move the digits right.`, steps: mdSteps(kg, f, '÷', U.round(kg / f, 4)) };
    },
  };

  /* ================= explore: number builder ================= */
  /* ================= Y1–3: number-square pieces ================= */
  /** Piece shapes as [dx, dy] offsets (right = +1, down = +10). */
  const SHAPES = [
    { name: 'cross', c: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
    { name: 'L', c: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
    { name: 'T', c: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]] },
    { name: 'column', c: [[0, 0], [0, 1], [0, 2], [0, 3]] },
    { name: 'steps', c: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]] },
    { name: 'U', c: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]] },
    { name: 'tall', c: [[1, 0], [1, 1], [0, 2], [1, 2], [2, 2], [1, 3], [1, 4]] },
    { name: 'zigzag', c: [[2, 0], [2, 1], [1, 1], [1, 2], [0, 2], [0, 3]] },
    { name: 'row', c: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]] },
  ];
  /** A piece cut from a 1–N number square (rows of 10). Never wraps past the end of a row. */
  function makePiece(y, shapeName) {
    const N = y <= 2 ? 100 : 1000;
    const sh = shapeName ? SHAPES.find((s) => s.name === shapeName) : pick(SHAPES);
    const w = Math.max(...sh.c.map((c) => c[0])) + 1, h = Math.max(...sh.c.map((c) => c[1])) + 1;
    const rows = N / 10;
    const c0 = rand(0, 10 - w), r0 = rand(y === 3 ? 10 : 0, rows - h);
    const base = r0 * 10 + c0 + 1;
    const cells = sh.c.map(([dx, dy]) => ({ x: dx, y: dy, v: base + dy * 10 + dx, given: false }));
    const nGiven = y === 1 ? 2 : 1;
    shuffle(cells.map((_, i) => i)).slice(0, nGiven).forEach((i) => { cells[i].given = true; });
    return { cells, shape: sh.name };
  }
  function pieceProblem(y, q) {
    const pc = makePiece(y);
    const g = pc.cells.find((c) => c.given);
    return {
      type: 'cells', q: q || `This piece comes from a <b>1 to ${y <= 2 ? 100 : 1000}</b> number square. Fill in the missing numbers.`,
      cells: pc.cells, size: y === 3 ? 64 : 58,
      hint: 'Right → +1, left → −1, down ↓ +10, up ↑ −10.',
      steps: [`Start from the number you know: <b>${fmt(g.v)}</b>.`, 'Moving right adds 1, moving left takes 1 away.', 'Moving down adds 10, moving up takes 10 away (the tens digit changes, the ones digit stays the same).',
        `<div class="row-center">${pieceHTML(pc.cells)}</div>`],
    };
  }
  /** The finished piece as a picture (all numbers shown). */
  function pieceHTML(cells, size = 52) {
    const W = Math.max(...cells.map((c) => c.x)) + 1, H = Math.max(...cells.map((c) => c.y)) + 1;
    return `<div style="position:relative;width:${W * size}px;height:${H * size}px">${cells.map((c) => `<div style="position:absolute;left:${c.x * size}px;top:${c.y * size}px;width:${size}px;height:${size}px;display:grid;place-items:center;border:2.5px solid #334155;margin:-1.25px 0 0 -1.25px;background:${c.given ? '#fef9c3' : '#f0fdf4'};font:600 18px var(--font-h)">${fmt(c.v)}</div>`).join('')}</div>`;
  }
  /** Part of a 100 (or 1000) square as a table, with some cells highlighted. */
  function squareHTML(firstRow, nRows, hl = {}) {
    let s = '<table style="border-collapse:collapse;font:600 15px var(--font-h)">';
    for (let r = firstRow; r < firstRow + nRows; r++) {
      s += '<tr>';
      for (let c = 0; c < 10; c++) {
        const v = r * 10 + c + 1;
        s += `<td style="border:1.5px solid #94a3b8;width:40px;height:34px;text-align:center;background:${hl[v] || (c % 2 ? '#fff' : '#f8fafc')}">${fmt(v)}</td>`;
      }
      s += '</tr>';
    }
    return s + '</table>';
  }
  const squarePieces = {
    id: 'square-pieces', title: 'Number square jigsaw pieces', years: [1, 3], icon: '🧩',
    desc: 'Right +1, left −1, down +10, up −10.',
    lesson(y) {
      const N = y <= 2 ? 100 : 1000;
      const r0 = y === 3 ? rand(20, 95) : rand(1, 6);
      const n = r0 * 10 + rand(2, 8) + 1; // not at the start or end of a row
      const rowEnd = (r0 + 1) * 10 + 10;
      const small = { cells: [{ x: 1, y: 0, v: n - 10, given: false }, { x: 0, y: 1, v: n - 1, given: false }, { x: 1, y: 1, v: n, given: true }, { x: 2, y: 1, v: n + 1, given: false }, { x: 1, y: 2, v: n + 10, given: false }] };
      const big = makePiece(y);
      return [
        { say: `This is part of a <b>number square</b>. It shows the numbers 1 to ${fmt(N)} in rows of <b>10</b>. Each row starts just after a multiple of 10.`, show: squareHTML(r0 - 1, 4, { [n]: '#fde68a' }) },
        { say: `Look at <b>${fmt(n)}</b> (yellow). The number on its <b>right</b> is one more. The number on its <b>left</b> is one less.`, show: squareHTML(r0 - 1, 4, { [n]: '#fde68a', [n + 1]: '#bbf7d0', [n - 1]: '#fecaca' }),
          try: { q: `What number is to the <b>right</b> of ${fmt(n)}?`, answer: n + 1, hint: 'Right means one more: +1.' } },
        { say: `Now look <b>down</b>. The number under ${fmt(n)} is in the next row, so it is <b>10 more</b>. Only the tens digit changes! Going <b>up</b> is 10 less.`, show: squareHTML(r0 - 1, 4, { [n]: '#fde68a', [n + 10]: '#bfdbfe', [n - 10]: '#e9d5ff' }),
          try: { q: `What number is just <b>below</b> ${fmt(n)}?`, answer: n + 10, hint: 'Down means +10.' } },
        { say: `Careful at the <b>end of a row</b>! After ${fmt(rowEnd)} the next number, ${fmt(rowEnd + 1)}, starts a <b>new row</b> on the left. So a piece can never go “right” past a multiple of 10.`, show: squareHTML(r0 + 1, 2, { [rowEnd]: '#fde68a', [rowEnd + 1]: '#bbf7d0' }) },
        { say: `Here is a small piece cut out of the square. You know the middle number, ${fmt(n)}. Use the rules to fill in the rest.`, try: { type: 'cells', cells: small.cells, size: y === 3 ? 64 : 58, hint: 'Up −10, left −1, right +1, down +10.' } },
        { say: 'Your turn: a bigger piece, like on a worksheet. Start from the number you know and move one box at a time.', try: { type: 'cells', cells: big.cells, size: y === 3 ? 64 : 58, hint: 'Right +1, left −1, down +10, up −10.' } },
      ];
    },
    gen(y) { return pieceProblem(y); },
  };

  /* ================= Y1–4: worms and sequences ================= */
  const STEPS_BY_YEAR = { 1: [1, 2, 5, 10], 2: [2, 3, 5, 10], 3: [4, 8, 50, 100, 10], 4: [6, 7, 9, 25, 50, 100, 1000] };
  /** A sequence of `len` numbers. Returns values, step and direction. */
  function makeWorm(y, len = 7) {
    const step = pick(STEPS_BY_YEAR[y]);
    const back = y === 1 ? Math.random() < 0.25 && (step === 1 || step === 10) : Math.random() < 0.4;
    const maxStart = y === 1 ? 20 : y === 2 ? 100 : y === 3 ? 1000 : 10000;
    let start;
    if (back) start = rand(step * (len - 1), Math.max(step * (len - 1), maxStart));
    else start = rand(0, Math.max(0, maxStart - step * (len - 1)));
    if (step >= 25 && step < 1000) start = Math.round(start / 5) * 5 + (y >= 3 ? rand(0, 9) : 0);
    if (back && start - step * (len - 1) < 0) start = step * (len - 1) + rand(0, 9);
    const vals = Array.from({ length: len }, (_, i) => start + (back ? -1 : 1) * step * i);
    return { vals, step, back };
  }
  function wormCells(vals, given, size) {
    return vals.map((v, i) => ({ x: i, y: i % 2 ? 0.35 : 0, v, given: given.includes(i) }));
  }
  function wormProblem(y) {
    const { vals, step, back } = makeWorm(y);
    const k = rand(0, vals.length - 2);
    const given = [k, k + 1];
    if (y <= 2) given.push(k >= 3 ? 0 : vals.length - 1);
    return {
      type: 'cells', q: `Write the missing numbers on the worm 🐛.`,
      cells: wormCells(vals, [...new Set(given)]), size: vals[0] >= 1000 || vals[vals.length - 1] >= 1000 ? 70 : 58,
      hint: 'Find the step between two numbers next to each other, then keep going both ways.',
      steps: [`Two neighbours: ${fmt(vals[k])} and ${fmt(vals[k + 1])}. The step is <b>${back ? '−' : '+'}${fmt(step)}</b>.`, `The worm: ${vals.map((v) => fmt(v)).join(', ')}`],
    };
  }
  const worms = {
    id: 'worms', title: 'Missing numbers on a worm', years: [1, 4], icon: '🐛',
    desc: 'Find the step, then fill in the missing numbers both ways.',
    lesson(y) {
      const a = makeWorm(y);
      const b = (() => { for (;;) { const w = makeWorm(y); if (w.back) return w; if (y === 1) return w; } })();
      const k = 2;
      return [
        { say: 'This worm counts in <b>steps</b>. Every box is the same jump from the one before. 🐛', show: `<div class="row-center">${pieceHTML(wormCells(a.vals, a.vals.map((_, i) => i)), y >= 3 ? 64 : 52)}</div>` },
        { say: `To find the step, look at <b>two neighbours</b>: ${fmt(a.vals[k])} and ${fmt(a.vals[k + 1])}. How far is it from one to the next?`, show: V.chips([fmt(a.vals[k]), '→', fmt(a.vals[k + 1])]),
          try: { q: `${fmt(a.vals[k])} → ${fmt(a.vals[k + 1])}: what is the step?`, answer: a.step, hint: `${fmt(Math.min(a.vals[k], a.vals[k + 1]))} + ? = ${fmt(Math.max(a.vals[k], a.vals[k + 1]))}` } },
        { say: `The worm goes ${a.back ? 'down' : 'up'} in <b>${fmt(a.step)}s</b>. So the next box is ${a.back ? 'take away' : 'add'} ${fmt(a.step)} again.`, show: V.chips(a.vals.slice(0, 4).map((v) => fmt(v)).concat('?'), [4]),
          try: { q: `What comes after ${fmt(a.vals[3])}?`, answer: a.vals[4] } },
        { say: `To go <b>backwards</b> along the worm, do the opposite: ${a.back ? 'add' : 'take away'} ${fmt(a.step)}.`, show: V.chips(['?'].concat(a.vals.slice(1, 4).map((v) => fmt(v))), [0]),
          try: { q: `What comes before ${fmt(a.vals[1])}?`, answer: a.vals[0] } },
        { say: 'Your turn: fill in the whole worm!', try: { type: 'cells', cells: wormCells(b.vals, [2, 3]), size: b.vals.some((v) => v >= 1000) ? 70 : 58, hint: `Find the step from the two numbers you know.` } },
      ];
    },
    gen(y) {
      if (Math.random() < 0.25) {
        const { vals, step, back } = makeWorm(y, 5);
        return { q: `What is the step? ${vals.map((v) => fmt(v)).join(', ')}`, answer: step, hint: 'How far from one number to the next?', steps: [`${fmt(vals[0])} → ${fmt(vals[1])} is ${back ? '−' : '+'}${fmt(step)}`] };
      }
      return wormProblem(y);
    },
  };

  /* ================= Y1–3: before, after, between ================= */
  function baNum(y) {
    if (y === 1) return rand(1, 19);
    if (y === 2) return Math.random() < 0.4 ? rand(2, 9) * 10 + pick([0, 9]) : rand(11, 98);
    return Math.random() < 0.45 ? rand(2, 9) * 100 + pick([0, 99, 90, 9]) : rand(101, 998);
  }
  const baLine = (n, pts) => V.numberLine({ min: Math.max(0, n - 3), max: Math.max(0, n - 3) + 6, step: 1, points: pts });
  const beforeAfter = {
    id: 'before-after', title: 'Before, after and between', years: [1, 3], icon: '🚂',
    desc: 'Just after is one more, just before is one less.',
    lesson(y) {
      const n = baNum(y);
      const cross = y === 1 ? 19 : y === 2 ? rand(2, 9) * 10 + 9 : rand(2, 9) * 100 + 99;
      const m = baNum(y);
      return [
        { say: `On a number line, numbers get bigger as you go <b>right</b> ➡️. The number <b>just after</b> ${fmt(n)} is one step to the right: <b>one more</b>.`, show: baLine(n, [{ v: n, color: '#14b8a6', label: fmt(n) }]),
          try: { q: `What number comes just <b>after</b> ${fmt(n)}?`, answer: n + 1, hint: 'One more: +1.' } },
        { say: `The number <b>just before</b> ${fmt(n)} is one step to the left: <b>one less</b>.`, show: baLine(n, [{ v: n, color: '#14b8a6', label: fmt(n) }]),
          try: { q: `What number comes just <b>before</b> ${fmt(n)}?`, answer: n - 1, hint: 'One less: −1.' } },
        { say: `The number <b>between</b> ${fmt(n - 1)} and ${fmt(n + 1)} is the one in the middle.`, show: V.chips([fmt(n - 1), '?', fmt(n + 1)], [1]),
          try: { q: `Which number is between ${fmt(n - 1)} and ${fmt(n + 1)}?`, answer: n } },
        { say: `Watch out when the ones are <b>9</b>! After ${fmt(cross)} the ones are full, so they go back to 0 and the ${y === 3 ? 'tens and hundreds' : 'tens'} go up: ${fmt(cross)} → <b>${fmt(cross + 1)}</b>.`, show: baLine(cross, [{ v: cross + 1, color: '#16a34a', label: fmt(cross + 1) }]),
          try: { q: `What comes after ${fmt(cross)}?`, answer: cross + 1 } },
        { say: `And going backwards from ${fmt(cross + 1)}: one less is ${fmt(cross)}.`, try: { q: `What comes just before ${fmt(cross + 1)}?`, answer: cross } },
        { say: 'Your turn: all three!', try: { type: 'guided', parts: [
          { say: `Just after ${fmt(m)}?`, answer: m + 1 }, { say: `Just before ${fmt(m)}?`, answer: m - 1 }, { say: `Between ${fmt(m + 1)} and ${fmt(m + 3)}?`, answer: m + 2 }] } },
      ];
    },
    gen(y) {
      const n = baNum(y), r = Math.random();
      if (r < 0.35) return { q: `What number comes just <b>after</b> ${fmt(n)}?`, answer: n + 1, hint: 'One more.', steps: [baLine(n, [{ v: n + 1, color: '#16a34a', label: fmt(n + 1) }])] };
      if (r < 0.7) return { q: `What number comes just <b>before</b> ${fmt(n)}?`, answer: n - 1, hint: 'One less.', steps: [baLine(n, [{ v: n - 1, color: '#16a34a', label: fmt(n - 1) }])] };
      if (r < 0.85 || y === 1) return { q: `Which number is <b>between</b> ${fmt(n - 1)} and ${fmt(n + 1)}?`, answer: n, hint: 'The one in the middle.' };
      const d = y === 2 ? 10 : pick([10, 100]);
      return { q: `What number is <b>${d} after</b> ${fmt(n)}?`, answer: n + d, hint: `${d} more.` };
    },
  };

  /* ================= Y1–4: number words ================= */
  const WR = { 1: [0, 20], 2: [21, 99], 3: [101, 999], 4: [1001, 99999] };
  const wordNum = (y) => { const [lo, hi] = WR[y]; if (y >= 2 && Math.random() < 0.25) return rand(lo, Math.min(hi, 99)); return rand(lo, hi); };
  const wordAns = (n) => [...new Set([U.words(n), words(n)])];
  const numberWords = {
    id: 'number-words', title: 'Numbers in words', years: [1, 4], icon: '🔤',
    desc: 'Read and write numbers in words: teens, -ty words and “hundred and”.',
    lesson(y) {
      const fr = [
        { say: 'Every number has a <b>name</b> we can write in words.', show: V.chips(['0 zero', '1 one', '2 two', '3 three', '4 four', '5 five', '6 six', '7 seven', '8 eight', '9 nine', '10 ten']) },
      ];
      const t = rand(13, 19), s = rand(1, 9);
      fr.push({ say: `The <b>teens</b> (13 to 19) end in “-teen”, which means “and ten”: <b>${U.words(t)}</b> is ${t - 10} and ten. Eleven and twelve are special.`, show: V.chips(['11 eleven', '12 twelve', '13 thirteen', '14 fourteen', '15 fifteen', '16 sixteen', '17 seventeen', '18 eighteen', '19 nineteen']),
        try: { q: `Write <b>${s}</b> in words.`, type: 'text', answer: wordAns(s), hint: 'Look at the list above.' } });
      fr.push({ say: 'Now read the word and write the number.', try: { q: `<b>${U.words(t)}</b> = ?`, answer: t, hint: '-teen means “and ten”.' } });
      if (y >= 2) {
        const n = rand(2, 9) * 10 + rand(1, 9);
        fr.push({ say: `Tens end in “<b>-ty</b>”: twenty, thirty, <b>forty</b> (no u!), fifty, sixty, seventy, eighty, ninety. For a number like ${n}, say the tens, then a hyphen, then the ones: <b>${U.words(n)}</b>.`, show: V.chips(['20 twenty', '30 thirty', '40 forty', '50 fifty', '60 sixty', '70 seventy', '80 eighty', '90 ninety']),
          try: { q: `Write <b>${n}</b> in words.`, type: 'text', answer: wordAns(n), hint: `${n - (n % 10)} is ${U.words(n - (n % 10))}. Then “-${U.words(n % 10)}”.` } });
      }
      if (y >= 3) {
        const h = rand(101, 999);
        fr.push({ say: `For hundreds, say how many hundreds, then “<b>and</b>”, then the rest: ${fmt(h)} = <b>${U.words(h)}</b>.`, show: V.pvTable(h),
          try: { q: `<b>${U.words(h)}</b> = ?`, answer: h, hint: 'Hundreds first, then tens and ones.' } });
      }
      if (y >= 4) {
        const k = rand(1001, 99999);
        fr.push({ say: `For thousands, say the thousands part first, then the rest: ${fmt(k)} = <b>${U.words(k)}</b>. The comma in the number shows where “thousand” goes.`, show: V.pvTable(k),
          try: { q: `<b>${U.words(k)}</b> = ?`, answer: k } });
      }
      const n2 = wordNum(y);
      fr.push({ say: 'Your turn: write this number in words. Hyphens and “and” are fine either way.', try: { q: `Write <b>${fmt(n2)}</b> in words.`, type: 'text', answer: wordAns(n2) } });
      return fr;
    },
    gen(y) {
      const n = wordNum(y), r = Math.random();
      if (r < 0.45) return { q: `Write <b>${fmt(n)}</b> in words.`, type: 'text', answer: wordAns(n), hint: n < 20 ? 'Teens end in -teen.' : 'Say the biggest part first.', steps: [`${fmt(n)} = <b>${U.words(n)}</b>`] };
      if (r < 0.85) return { q: `Write <b>${U.words(n)}</b> in digits.`, answer: n, hint: 'Listen for “thousand”, “hundred”, the -ty word, then the ones.', steps: [`${U.words(n)} = <b>${fmt(n)}</b>`] };
      const opts = new Set([n]);
      const near = [n + 1, n - 1, n + 10, n - 10, y === 1 ? n + 2 : n + 100];
      shuffle(near).forEach((v) => { if (opts.size < 3 && v >= 0) opts.add(v); });
      return { type: 'choice', q: `Which number is <b>${U.words(n)}</b>?`, choices: shuffle([...opts]).map((v) => ({ v: String(v), html: fmt(v) })), answer: String(n) };
    },
  };

  /* ================= Y1–3: odd and even ================= */
  const OE = { 1: 20, 2: 100, 3: 1000 };
  const isEven = (n) => n % 2 === 0;
  function pairsHTML(n, emoji = '🧦') {
    let s = '<div class="demo-row">';
    for (let i = 0; i + 1 < n; i += 2) s += `<span style="border:2px solid #14b8a6;border-radius:12px;padding:4px 6px;font-size:24px">${emoji}${emoji}</span>`;
    if (n % 2) s += `<span style="border:2px dashed #ef4444;border-radius:12px;padding:4px 6px;font-size:24px">${emoji}</span>`;
    return s + '</div>';
  }
  function tapOddEven(y, wantEven) {
    const set = new Set();
    while (set.size < (y === 1 ? 8 : 10)) set.add(rand(0, OE[y]));
    let items = [...set].map((v) => ({ label: fmt(v), ok: isEven(v) === wantEven }));
    if (!items.some((i) => i.ok)) items[0] = { label: fmt(wantEven ? 2 * rand(1, 9) : 2 * rand(1, 9) + 1), ok: true };
    return { type: 'tapfind', q: `Tap <b>all</b> the <b>${wantEven ? 'even' : 'odd'}</b> numbers.`, items, fancy: y === 1, hint: `Look at the last digit: ${wantEven ? '0, 2, 4, 6 or 8' : '1, 3, 5, 7 or 9'}.` };
  }
  const oddEven = {
    id: 'odd-even', title: 'Odd and even numbers', years: [1, 3], icon: '🧦',
    desc: 'Even numbers make pairs. Odd numbers have one left over.',
    lesson(y) {
      const e = 2 * rand(2, 5), o = 2 * rand(2, 5) + 1;
      const big = rand(OE[y] / 2, OE[y]);
      const fr = [
        { say: `Put socks into <b>pairs</b>. ${e} socks make ${e / 2} pairs with <b>none left over</b>. ${e} is an <b>even</b> number.`, show: pairsHTML(e) },
        { say: `Now ${o} socks: ${(o - 1) / 2} pairs and <b>one sock left on its own</b>. ${o} is an <b>odd</b> number.`, show: pairsHTML(o),
          try: { type: 'choice', q: `Is ${o} odd or even?`, choices: [{ v: 'odd', html: 'Odd' }, { v: 'even', html: 'Even' }], answer: 'odd', hint: 'Is there one left over?' } },
        { say: 'Counting in 2s from 0 gives the even numbers. The numbers in between are odd.', show: V.chips(Array.from({ length: 11 }, (_, i) => String(i)), [0, 2, 4, 6, 8, 10]) + '<p class="center muted">Yellow = even · white = odd</p>' },
        { say: `For any number, you only need the <b>last digit</b> (the ones). Ends in 0, 2, 4, 6, 8 → even. Ends in 1, 3, 5, 7, 9 → odd. So <b>${fmt(big)}</b> is ${isEven(big) ? 'even' : 'odd'} because it ends in ${big % 10}.`, show: `<div class="say-big">${hlDigit(big, 0)}</div>`,
          try: { type: 'choice', q: `Is <b>${fmt(big + 1)}</b> odd or even?`, choices: [{ v: 'odd', html: 'Odd' }, { v: 'even', html: 'Even' }], answer: isEven(big + 1) ? 'even' : 'odd', hint: `Look at the last digit: ${(big + 1) % 10}.` } },
      ];
      if (y >= 3) fr.push({ say: 'Adding odd and even numbers follows rules: even + even = even, odd + odd = <b>even</b> (the two left-over socks make a pair!), odd + even = odd.', show: pairsHTML(3) + '<span class="op">+</span>' + pairsHTML(5),
        try: { type: 'choice', q: 'odd + odd = ?', choices: [{ v: 'odd', html: 'odd' }, { v: 'even', html: 'even' }], answer: 'even' } });
      fr.push({ say: 'Your turn!', try: tapOddEven(y, Math.random() < 0.5) });
      return fr;
    },
    gen(y) {
      const r = Math.random(), n = rand(0, OE[y]);
      if (r < 0.35) return { type: 'choice', q: `Is <b>${fmt(n)}</b> odd or even?`, visual: y === 1 && n <= 12 ? pairsHTML(n, pick(['🧦', '👟', '🧤'])) : '', choices: [{ v: 'odd', html: 'Odd' }, { v: 'even', html: 'Even' }], answer: isEven(n) ? 'even' : 'odd', hint: y === 1 ? 'Make pairs. Is one left over?' : `Look at the last digit: ${n % 10}.` };
      if (r < 0.7) return tapOddEven(y, Math.random() < 0.5);
      if (y >= 3 && r < 0.85) {
        const [a, b] = [pick(['odd', 'even']), pick(['odd', 'even'])];
        return { type: 'choice', q: `${a} + ${b} = ?`, choices: [{ v: 'odd', html: 'odd' }, { v: 'even', html: 'even' }], answer: a === b ? 'even' : 'odd', hint: 'Think of socks: do the left-over ones make a pair?' };
      }
      const wantEven = Math.random() < 0.5;
      const ans = n + (isEven(n + 1) === wantEven ? 1 : 2);
      return { q: `What is the next <b>${wantEven ? 'even' : 'odd'}</b> number after ${fmt(n)}?`, answer: ans, hint: 'Count on and check the last digit.' };
    },
    word(y) {
      const n = rand(y === 1 ? 5 : 15, y === 1 ? 20 : y === 2 ? 60 : 300);
      const [who, thing] = pick([['children', 'partner'], ['socks', 'matching sock'], ['shoes', 'pair']]);
      return { type: 'choice', scene: '👫', story: true, q: `There are <b>${fmt(n)}</b> ${who} lining up in twos. Will every one have a ${thing}?`, choices: [{ v: 'yes', html: `Yes — ${fmt(n)} is even` }, { v: 'no', html: `No — ${fmt(n)} is odd, one is left over` }], answer: isEven(n) ? 'yes' : 'no', hint: 'Is the number odd or even?' };
    },
  };

  function explore(root, y) {
    const big = y >= 3;
    const maxN = big ? 999 : 99;
    let n = y === 1 ? 14 : y === 2 ? 47 : 347;
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Build a number with blocks. Watch the place value table, the number line and the words change!</p>
        <div class="blk-btns">
          ${big ? '<div><b>Hundreds</b><button class="btn small ghost" data-d="-100">−</button><button class="btn small" data-d="100">+</button></div>' : ''}
          <div><b>Tens</b><button class="btn small ghost" data-d="-10">−</button><button class="btn small" data-d="10">+</button></div>
          <div><b>Ones</b><button class="btn small ghost" data-d="-1">−</button><button class="btn small" data-d="1">+</button></div>
        </div>
        <div class="ex-stage" id="pvStage"></div>
      </div>`;
    const stage = root.querySelector('#pvStage');
    function draw() {
      const parts = partitionOf(n);
      stage.innerHTML = `
        <div class="ex-eq big">${fmt(n)}</div>
        <div class="row-center">${V.base10(n)}</div>
        <div class="row-center">${V.pvTable(n, big ? ['h', 't', 'o'] : ['t', 'o'])}</div>
        <div class="facts">
          <p><b>Partition:</b> ${n ? `${fmt(n)} = ${parts.map((v) => fmt(v)).join(' + ')}` : '0'}</p>
          <p><b>In words:</b> ${words(n)}</p>
          <p><b>One more:</b> ${fmt(n + 1)} · <b>One less:</b> ${n ? fmt(n - 1) : '—'} · <b>10 more:</b> ${fmt(n + 10)}${big ? ` · <b>100 more:</b> ${fmt(n + 100)}` : ''}</p>
          ${y >= 3 ? `<p><b>Rounded:</b> nearest 10 → ${fmt(roundTo(n, 10))} · nearest 100 → ${fmt(roundTo(n, 100))}</p>` : ''}
        </div>
        ${V.numberLine({ min: 0, max: big ? 1000 : 100, step: big ? 100 : 10, points: [{ v: n, emoji: '🐸', label: fmt(n) }] })}`;
    }
    root.querySelectorAll('[data-d]').forEach((b) => {
      b.onclick = () => { n = Math.max(0, Math.min(maxN, n + +b.dataset.d)); U.sound('click'); draw(); };
    });
    draw();
  }

  TOPICS.push({
    id: 'placevalue', name: 'Place Value', icon: '🔢', color: '#14b8a6', minYear: 1,
    tagline: 'Counting, tens and ones, comparing, rounding and estimating',
    explore,
    skills: [count20, oneMoreLess, beforeAfter, oddEven, numberWords, bonds, tensOnes, hto, countSteps, worms, squarePieces, compare, order, nlPlace, moreLess, digitValue, rounding, estimate, mulDiv10],
  });
})();
