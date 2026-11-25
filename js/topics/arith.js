'use strict';
/* Addition and subtraction, built from small skills (England National Curriculum, Years 1–6). */
(() => {
  const { rand, pick, fmt } = U;
  const EM = V.EMOJI;
  const OPS = [{ v: '+', html: 'Add ➕' }, { v: '−', html: 'Subtract ➖' }];
  const placeName = (p) => (p >= 0 ? V.PLACES[p] : p === -1 ? 'tenths' : 'hundredths');
  const single = (w) => w.replace(/s$/, '');
  const big = (html) => `<div class="say-big">${html}</div>`;
  const seq = (from, n, dir = 1) => Array.from({ length: n }, (_, i) => from + dir * (i + 1));
  const digitsFor = (y) => Math.min(6, Math.max(3, y));
  const roundTo = (n, base) => Math.round(n / base) * base;
  /* ---------------- estimating: always round to the nearest 10 (whole number for decimals) ---------------- */
  const estBase = (dp) => (dp ? 1 : 10);
  const estR = (n, dp = 0) => roundTo(n, estBase(dp));
  const estName = (dp) => (dp ? 'whole number' : '10');
  /** Guided parts: round a, round b, then work out the estimate. */
  function estParts(a, b, op, dp = 0) {
    const ra = estR(a, dp), rb = estR(b, dp), e = op === '+' ? ra + rb : ra - rb;
    const lo = (n) => Math.floor(n / estBase(dp)) * estBase(dp);
    const tip = dp ? 'Look at the tenths digit: 5 or more rounds up, less than 5 rounds down.' : 'Look at the ones digit: 5 or more rounds up, less than 5 rounds down.';
    return {
      ra, rb, e,
      parts: [
        { say: `Estimate first! Round <b>${fmt(a)}</b> to the nearest ${estName(dp)}. ${tip}`, answer: ra, hint: `Is ${fmt(a)} closer to ${fmt(lo(a))} or ${fmt(lo(a) + estBase(dp))}?` },
        { say: `Round <b>${fmt(b)}</b> to the nearest ${estName(dp)}.`, answer: rb, hint: `Is ${fmt(b)} closer to ${fmt(lo(b))} or ${fmt(lo(b) + estBase(dp))}?` },
        { say: `Estimate: ${fmt(ra)} ${op} ${fmt(rb)} = ?`, answer: e, after: `Our exact answer should be close to <b>${fmt(e)}</b>.` },
      ],
    };
  }
  const closeNote = (exact, e) => ({ say: `Is the exact answer <b>${fmt(exact)}</b> close to the estimate <b>${fmt(e)}</b>?`, type: 'note', button: 'Yes, it is close ✔️', after: 'Close to the estimate, so the answer makes sense.' });
  /** Estimate first, then the column method, then check it is close. */
  function estColumn(a, b, op, dp = 0, q) {
    const ex = U.round(op === '+' ? a + b : a - b, dp);
    const E = estParts(a, b, op, dp);
    return {
      type: 'guided', q: q || `Work out ${fmt(a)} ${op} ${fmt(b)}. Estimate first!`,
      hint: `Round each number to the nearest ${estName(dp)} first.`,
      parts: [...E.parts, { say: `Now work out ${fmt(a)} ${op} ${fmt(b)} exactly:`, type: 'column', a, b, op, dp }, closeNote(ex, E.e)],
      steps: [`Estimate: ${fmt(E.ra)} ${op} ${fmt(E.rb)} = ${fmt(E.e)}`, ...V.columnMethod(a, b, op, { dp }).steps, `Answer: <b>${fmt(ex)}</b>`],
    };
  }

  const objSum = (a, b, e) => `<div class="obj-sum">${V.objects(a, e)}<span class="op">+</span>${V.objects(b, e)}</div>`;
  const yesNo = (q, yes) => ({ type: 'choice', q, choices: [{ v: 'y', html: 'Yes' }, { v: 'n', html: 'No' }], answer: yes ? 'y' : 'n' });

  /** Part–whole bar model. hide: 'w' (whole), 'a' or 'b' (a part) */
  function partWhole(whole, p1, p2, hide, labels = []) {
    const box = (bg, bd, txt, flex) => `<div style="flex:${flex};min-width:70px;background:${bg};border:2px solid ${bd};border-radius:10px;padding:6px 8px">${txt}</div>`;
    return `<div style="width:min(460px,92%);font:600 21px var(--font-h);text-align:center">
      ${box('#ede9fe', '#a78bfa', (hide === 'w' ? '?' : fmt(whole)) + (labels[0] ? ` <small style="font:600 13px var(--font-b)">${labels[0]}</small>` : ''), 1)}
      <div style="display:flex;gap:4px;margin-top:4px">
        ${box('#dcfce7', '#86efac', (hide === 'a' ? '?' : fmt(p1)) + (labels[1] ? ` <small style="font:600 13px var(--font-b)">${labels[1]}</small>` : ''), Math.max(1, p1))}
        ${box('#fef3c7', '#fcd34d', (hide === 'b' ? '?' : fmt(p2)) + (labels[2] ? ` <small style="font:600 13px var(--font-b)">${labels[2]}</small>` : ''), Math.max(1, p2))}
      </div></div>`;
  }
  /** Comparison bar model: two bars and the difference. */
  function compareBars(a, b, la, lb) {
    const w = (v) => Math.max(14, (v / a) * 100);
    return `<div style="width:min(460px,92%);font:600 18px var(--font-h)">
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="width:70px;font:700 14px var(--font-b)">${la}</span><div style="width:${w(a)}%;background:#dcfce7;border:2px solid #86efac;border-radius:10px;padding:4px 8px">${fmt(a)}</div></div>
      <div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="width:70px;font:700 14px var(--font-b)">${lb}</span><div style="width:${w(b)}%;background:#fef3c7;border:2px solid #fcd34d;border-radius:10px;padding:4px 8px">${fmt(b)}</div><div style="flex:1;border:2px dashed #f472b6;border-radius:10px;padding:4px 8px;text-align:center;color:#be185d">? more</div></div>
    </div>`;
  }

  /* ---------------- number generators ---------------- */
  function addNums(y, intOnly) {
    switch (y) {
      case 1: { const a = rand(1, 10); return { a, b: rand(1, Math.min(10, 20 - a)), dp: 0 }; }
      case 2: { const a = rand(11, 79); return { a, b: rand(5, Math.min(60, 99 - a)), dp: 0 }; }
      case 3: { const a = rand(100, 799); return { a, b: rand(25, 999 - a), dp: 0 }; }
      case 4: { const a = rand(1000, 7999); return { a, b: rand(250, 9999 - a), dp: 0 }; }
      case 5: { const a = rand(10000, 79999); return { a, b: rand(2500, 99999 - a), dp: 0 }; }
      default: {
        if (!intOnly && Math.random() < 0.5) {
          const dp = pick([1, 2]), s = 10 ** dp;
          return { a: rand(10 * s, 999 * s) / s, b: rand(s, 99 * s) / s, dp };
        }
        const a = rand(100000, 799999);
        return { a, b: rand(25000, 999999 - a), dp: 0 };
      }
    }
  }
  function subNums(y) {
    switch (y) {
      case 1: { const a = rand(3, 20); return { a, b: rand(1, Math.min(10, a)) }; }
      case 2: { const a = rand(25, 99); return { a, b: rand(5, a - 10) }; }
      case 3: { const a = rand(200, 999); return { a, b: rand(50, a - 20) }; }
      case 4: { const a = rand(2000, 9999); return { a, b: rand(300, a - 100) }; }
      case 5: { const a = rand(20000, 99999); return { a, b: rand(3000, a - 1000) }; }
      default: { const a = rand(200000, 999999); return { a, b: rand(30000, a - 10000) }; }
    }
  }
  const hasStep = (a, b, op, word, dp = 0) => V.columnMethod(a, b, op, { dp }).steps.some((s) => s.includes(word));
  function noCarryPair(d) {
    let a = 0, b = 0;
    for (let k = 0; k < d; k++) {
      const lead = k === d - 1;
      const x = lead ? rand(1, 8) : rand(0, 9);
      const z = lead ? rand(1, 9 - x) : rand(0, 9 - x);
      a += x * 10 ** k; b += z * 10 ** k;
    }
    return { a: Math.max(a, b), b: Math.min(a, b) };
  }
  function noExchangePair(d) {
    let a = 0, b = 0;
    for (let k = 0; k < d; k++) {
      const lead = k === d - 1;
      const x = lead ? rand(2, 9) : rand(1, 9);
      const z = lead ? rand(1, x - 1) : rand(0, x);
      a += x * 10 ** k; b += z * 10 ** k;
    }
    return { a, b };
  }
  function carryPair(y) {
    for (;;) { const { a, b } = addNums(Math.max(3, y), true); if (hasStep(a, b, '+', 'carry')) return { a, b }; }
  }
  function exchangePair(y) {
    for (;;) { const { a, b } = subNums(Math.max(3, y)); if (hasStep(a, b, '−', 'exchange') && !hasStep(a, b, '−', 'already gave')) return { a, b }; }
  }
  function zeroPair(y) {
    const d = digitsFor(Math.max(4, y));
    for (;;) {
      const a = rand(2, 9) * 10 ** (d - 1) + (Math.random() < 0.5 ? 0 : rand(1, 9));
      const b = rand(10 ** (d - 1), a - 1);
      if (b % 10 > a % 10 && hasStep(a, b, '−', 'already gave')) return { a, b };
    }
  }
  function decPair(y, op) {
    for (;;) {
      const dp = y === 5 ? pick([1, 2]) : 2, s = 10 ** dp;
      let a = rand(10 * s, (y === 5 ? 99 : 999) * s) / s, b = rand(s, (y === 5 ? 50 : 99) * s) / s;
      // sometimes the numbers have a different number of decimal places (8.4 and 2.75)
      if (dp === 2 && Math.random() < 0.4) a = Math.round(a * 10) / 10;
      if (op === '−' && b >= a) continue;
      if (hasStep(a, b, op, op === '+' ? 'carry' : 'exchange', dp)) return { a, b, dp };
    }
  }

  /* ---------------- column lesson frames (built from the real sum) ---------------- */
  const colShow = (a, b, op, dp, upto, active) => V.columnMethod(a, b, op, { dp, upto, active }).html;
  function colInfo(a, b, op, dp = 0) {
    const sc = 10 ** dp, A = Math.round(a * sc), B = Math.round(b * sc), R = op === '+' ? A + B : A - B;
    const str = (x) => String(x).padStart(dp + 1, '0');
    const len = Math.max(str(A).length, str(B).length, str(R).length);
    const rev = (x) => str(x).split('').reverse().map(Number);
    return { len, da: rev(A), db: rev(B), dr: rev(R), place: (c) => placeName(c - dp) };
  }
  function addColumnFrames(a, b, dp = 0) {
    const { len, da, db, place } = colInfo(a, b, '+', dp);
    const fr = [];
    let carry = 0;
    for (let c = 0; c < len; c++) {
      const P = U.cap(place(c));
      const x = da[c], z = db[c];
      if (x == null && z == null) {
        if (carry) fr.push({ say: `<b>${P}:</b> nothing left to add except the carried <b>1</b>, so write 1 in the ${place(c)}.`, show: colShow(a, b, '+', dp, c + 1, c) });
        break;
      }
      const terms = [x, z].filter((v) => v != null);
      if (terms.length === 1 && !carry) { fr.push({ say: `<b>${P}:</b> only one digit here, so the <b>${terms[0]}</b> comes straight down.`, show: colShow(a, b, '+', dp, c + 1, c) }); continue; }
      const expr = terms.join(' + ') + (carry ? ' + 1' : '');
      const sum = terms.reduce((s, v) => s + v, 0) + carry;
      fr.push({
        say: `<b>${P}:</b> add the digits in the ${place(c)} column${carry ? ' — and the little carried 1 on top' : ''}.`,
        show: colShow(a, b, '+', dp, c, c),
        try: { q: `${expr} = ?`, answer: sum, hint: carry ? 'Remember the carried 1!' : `Count on from ${Math.max(...terms)}.` },
      });
      if (sum >= 10) {
        const nx = place(c + 1);
        fr.push({ say: `${sum} ${place(c)} is too many for one box! 10 ${place(c)} make <b>1 ${single(nx)}</b>, so ${sum} ${place(c)} = 1 ${single(nx)} and ${sum - 10} ${place(c)}. Write <b>${sum - 10}</b> and <b>carry the 1</b> to the ${nx} (the little red 1).`, show: colShow(a, b, '+', dp, c + 1, c) });
      }
      carry = sum >= 10 ? 1 : 0;
    }
    return fr;
  }
  function subColumnFrames(a, b, dp = 0) {
    const { len, da, db, dr, place } = colInfo(a, b, '−', dp);
    const cur = da.slice();
    const fr = [];
    for (let c = 0; c < len; c++) {
      if (da[c] == null) break;
      const P = U.cap(place(c));
      const show = (u) => colShow(a, b, '−', dp, u, c);
      const y = db[c];
      if (y == null) {
        if (c >= dr.length) break;
        fr.push({ say: `<b>${P}:</b> nothing to take away here, so the <b>${cur[c]}</b> comes straight down.`, show: show(c + 1) });
        continue;
      }
      let t = cur[c];
      if (t < y) {
        fr.push({ say: `<b>${P}:</b> we need ${t} − ${y}. Can we take ${y} away from ${t}?`, show: show(c), try: yesNo(`Is ${t} big enough to take away ${y}?`, false) });
        let k = c + 1;
        while (cur[k] === 0) k++;
        let say;
        if (k === c + 1) {
          say = `No — ${t} is smaller than ${y}. So we <b>exchange</b>: take 1 ${single(place(c + 1))} from the next column and change it into 10 ${place(c)}. The ${place(c + 1)} digit goes from ${cur[k]} to <b>${cur[k] - 1}</b>, and the ${place(c)} go from ${t} to <b>${t + 10}</b>.`;
        } else {
          say = `No — ${t} is smaller than ${y}. But the ${place(c + 1)} has <b>0</b>, so it has nothing to give! Go further left to the ${place(k)}: ${cur[k]} becomes <b>${cur[k] - 1}</b>. That 1 ${single(place(k))} turns into 10 ${place(k - 1)}. Each 0 on the way becomes 10, then gives 1 to its right, so it ends as <b>9</b>. Now the ${place(c)} have <b>${t + 10}</b>.`;
        }
        cur[k] -= 1;
        for (let j = k - 1; j > c; j--) cur[j] = 9;
        cur[c] += 10;
        const pic = `<div class="demo-row"><span class="chip-num">1 ${single(place(c + 1))}</span><b>=</b><span class="chip-num hot">10 ${place(c)}</span></div>` + (c === 0 && dp === 0 && k === 1 ? V.objects(10, '🟨', { perRow: 10 }) : '');
        fr.push({ say, show: pic + show(c) });
        t = cur[c];
      }
      if (c >= dr.length && t - y === 0) {
        fr.push({ say: `<b>${P}:</b> ${t} − ${y} = 0. A zero at the very front is not written.`, show: show(c + 1) });
        continue;
      }
      const changed = t !== da[c];
      fr.push({
        say: changed ? `<b>${P}:</b> this column now has <b>${t}</b> (it changed when we exchanged). Take away ${y}.` : `<b>${P}:</b> ${t} − ${y}. ${t} is big enough, so just take away.`,
        show: show(c),
        try: { q: `${t} − ${y} = ?`, answer: t - y, hint: `Count back ${y} from ${t}, or count up from ${y} to ${t}.` },
      });
    }
    return fr;
  }

  /* ---------------- guided word problems ---------------- */
  /** Choose the operation → (estimate) → calculate → answer with units. */
  function wordProblem({ q, scene = '🧮', a, b, op, unit = '', y, dp = 0, why, est }) {
    const ans = U.round(op === '+' ? a + b : a - b, dp);
    const parts = [{ say: 'What do we need to do?', type: 'choice', choices: OPS, answer: op, after: why || (op === '+' ? 'We put the amounts together, so we <b>add</b>.' : 'We take away or find the difference, so we <b>subtract</b>.') }];
    let E = null;
    if (y >= 3 && est !== false) { E = estParts(a, b, op, dp); parts.push(...E.parts); }
    if (y >= 3) parts.push({ say: `Now work out ${fmt(a)} ${op} ${fmt(b)} exactly:`, type: 'column', a, b, op, dp });
    if (E) parts.push(closeNote(ans, E.e));
    parts.push({ say: y >= 3 ? 'So what is the answer to the question?' : `${fmt(a)} ${op} ${fmt(b)} = ?`, answer: ans, decimals: dp > 0, suffix: unit ? ' ' + unit : '', after: `The answer is <b>${fmt(ans)}${unit ? ' ' + unit : ''}</b>.` });
    return {
      type: 'guided', q, scene, story: true, parts,
      hint: op === '+' ? '“Altogether”, “in total” and “more” usually mean add.' : '“Left”, “how many more” and “difference” usually mean subtract.',
      steps: [`${fmt(a)} ${op} ${fmt(b)} = <b>${fmt(ans)}</b>`],
    };
  }
  const ADD_STORIES = [
    [(a, b, n) => `${n} has <b>${a}</b> stickers. A friend gives ${n} <b>${b}</b> more. How many stickers does ${n} have now?`, 'stickers', '⭐'],
    [(a, b) => `There are <b>${a}</b> people on a bus. At the next stop <b>${b}</b> more get on. How many people are on the bus now?`, 'people', '🚌'],
    [(a, b, n) => `${n} read <b>${a}</b> pages on Monday and <b>${b}</b> pages on Tuesday. How many pages is that altogether?`, 'pages', '📖'],
    [(a, b) => `A farm has <b>${a}</b> sheep and <b>${b}</b> cows. How many animals is that in total?`, 'animals', '🐑'],
    [(a, b) => `A cinema sold <b>${a}</b> tickets on Saturday and <b>${b}</b> on Sunday. How many tickets were sold altogether?`, 'tickets', '🎟️'],
    [(a, b) => `A library has <b>${a}</b> books and buys <b>${b}</b> new ones. How many books does it have now?`, 'books', '📚'],
    [(a, b) => `A lorry drove <b>${a}</b> km last year and <b>${b}</b> km this year. What is the total distance?`, 'km', '🚚'],
  ];
  const SUB_STORIES = [
    [(a, b, n) => `${n} had <b>${a}</b> marbles and lost <b>${b}</b>. How many marbles are left?`, 'marbles', '🔵'],
    [(a, b) => `There were <b>${a}</b> birds on a tree. <b>${b}</b> flew away. How many birds are left?`, 'birds', '🐦'],
    [(a, b) => `A baker made <b>${a}</b> cupcakes and sold <b>${b}</b>. How many cupcakes are left?`, 'cupcakes', '🧁'],
    [(a, b) => `A shop had <b>${a}</b> T-shirts. It sold <b>${b}</b>. How many T-shirts are left?`, 'T-shirts', '👕'],
    [(a, b) => `A concert hall has <b>${a}</b> seats. <b>${b}</b> tickets have been sold. How many seats are still free?`, 'seats', '🎵'],
    [(a, b) => `A plane must fly <b>${a}</b> km. It has flown <b>${b}</b> km. How many km are left?`, 'km', '✈️'],
  ];
  function addStory(y, a, b, dp) { const [tpl, unit, scene] = pick(ADD_STORIES); return wordProblem({ q: tpl(fmt(a), fmt(b), U.name()), unit, scene, a, b, op: '+', y, dp }); }
  function subStory(y, a, b, dp) { const [tpl, unit, scene] = pick(SUB_STORIES); return wordProblem({ q: tpl(fmt(a), fmt(b), U.name()), unit, scene, a, b, op: '−', y, dp }); }

  /* ================================================================
   * ADDITION SKILLS
   * ================================================================ */

  const countOn = {
    id: 'count-on', title: 'Add by counting on', years: [1, 1], icon: '🐞',
    desc: 'Keep the bigger number in your head and count on.',
    lesson() {
      const a = rand(5, 9), b = rand(2, 5), e = pick(EM), s = a + b;
      const n2 = rand(2, 4), m2 = rand(6, 9);
      const x = rand(2, 4), z = rand(5, 9);
      return [
        { say: `Adding means <b>putting groups together</b>. Here are ${a} ${e} and ${b} more ${e}. How many are there <b>altogether</b>?`, show: objSum(a, b, e) },
        { say: `You could count them all from 1… but there is a quicker way! The first group has <b>${a}</b>. Keep ${a} in your head, then <b>count on</b> ${b} more. In this ten frame the red ones are the ${a}, the blue ones are the ${b} more.`, show: V.tenFrame(s, '🔴', { second: b }) },
        { say: `Put your finger on ${a} on the number line. Count on ${b} hops: ${seq(a, b).join(', ')}.`, show: V.numberLine({ min: 0, max: 20, points: [{ v: a, label: 'start', color: '#7c3aed' }] }), try: { q: `${a} + ${b} = ?`, answer: s, hint: `Count on from ${a}: ${seq(a, b).join(', ')}.` } },
        { say: `Each hop is <b>one more</b>. ${b} hops from ${a} land on <b>${s}</b>. So ${a} + ${b} = ${s}.`, show: V.numberLine({ min: 0, max: 20, jumps: Array.from({ length: b }, (_, i) => ({ from: a + i, to: a + i + 1, label: '+1' })) }) },
        { say: `Top tip: <b>start with the bigger number!</b> ${n2} + ${m2} is the same as ${m2} + ${n2}, but counting on ${n2} from ${m2} is much quicker.`, show: big(`${n2} + ${m2} = ${m2} + ${n2}`), try: { q: `${n2} + ${m2} = ?`, answer: n2 + m2, hint: `Start at ${m2} and count on ${n2}.` } },
        { say: 'Your turn to do every step! 💪', try: { type: 'guided', q: `${x} + ${z} = ?`, visual: objSum(x, z, '⭐'), parts: [
          { say: 'Which number is bigger? Start counting from there.', type: 'choice', choices: [{ v: String(x), html: String(x) }, { v: String(z), html: String(z) }], answer: String(z), after: `Start at ${z}.` },
          { say: `Count on ${x} from ${z}. Where do you land?`, answer: x + z, after: `${z} + ${x} = ${x + z} 🎉` }] } },
      ];
    },
    gen() {
      const a = rand(1, 10), b = rand(1, Math.min(10, 20 - a)), e = pick(EM), s = a + b;
      const bigN = Math.max(a, b), small = Math.min(a, b);
      const mode = rand(0, 2);
      const visual = mode === 0 ? objSum(a, b, e) : mode === 1 ? V.tenFrame(s, '🔴', { second: b }) : V.numberLine({ min: 0, max: 20, points: [{ v: bigN, color: '#7c3aed' }] });
      return { q: `${a} + ${b} = ?`, visual, answer: s, hint: `Start at ${bigN} and count on ${small}.`, steps: [`Start at the bigger number, <b>${bigN}</b>.`, `Count on ${small}: ${seq(bigN, small).join(', ')}.`, V.numberLine({ min: 0, max: 20, jumps: [{ from: bigN, to: s, label: '+' + small }] }), `${a} + ${b} = <b>${s}</b>`] };
    },
    word(y) { const a = rand(2, 9), b = rand(1, Math.min(9, 20 - a)); return addStory(y, a, b, 0); },
  };

  const bonds = {
    id: 'bonds', title: 'Number bonds to 10, 20 and 100', years: [1, 2], icon: '🔗',
    desc: 'Pairs of numbers that make a whole ten — the secret to fast adding.',
    lesson(y) {
      const k = rand(2, 8), k2 = rand(1, 9), k3 = rand(1, 9);
      const fr = [
        { say: 'A <b>number bond</b> is a pair of numbers that make a total. Let’s find pairs that make <b>10</b>. A ten frame has exactly 10 boxes.', show: V.tenFrame(10, '🔴', { second: 10 - k }) + big(`${k} + ${10 - k} = 10`) },
        { say: `This ten frame has <b>${k2}</b> counters. How many empty boxes are left? That is the number that goes with ${k2} to make 10.`, show: V.tenFrame(k2, '🔴'), try: { q: `${k2} + ? = 10`, answer: 10 - k2, hint: 'Count the empty boxes.' } },
        { say: 'Here are all the bonds to 10. See the pattern? One number goes <b>up</b> while the other goes <b>down</b>.', show: V.chips(Array.from({ length: 11 }, (_, i) => `${i} + ${10 - i}`)) },
        { say: `Learn them by heart and you can answer instantly!`, try: { q: `${10 - k3} + ? = 10`, answer: k3 } },
      ];
      if (y === 1) {
        const m = rand(1, 9);
        fr.push({ say: `Bonds to <b>20</b> are easy if you know bonds to 10! ${m} + ${10 - m} = 10, so <b>1${m} + ${10 - m} = 20</b>. Look: one full ten frame and the bond in the second one.`, show: V.tenFrame(20, '🔴', { second: 10 - m }) });
        const m2 = rand(1, 9);
        fr.push({ say: 'Your turn with 20!', try: { q: `${10 + m2} + ? = 20`, answer: 10 - m2, hint: `${m2} + ? = 10` } });
      } else {
        const m = rand(1, 9), m2 = rand(1, 9);
        fr.push({ say: `Bonds to <b>100</b> use tens: ${m} + ${10 - m} = 10, so <b>${m}0 + ${10 - m}0 = 100</b>. Ten tens make a hundred!`, show: V.base10(m * 10) + V.base10(100 - m * 10) });
        fr.push({ say: 'Your turn with 100!', try: { q: `${m2 * 10} + ? = 100`, answer: 100 - m2 * 10, hint: `${m2} + ? = 10, so ${m2}0 + ?0 = 100` } });
        const n = rand(21, 79);
        fr.push({ say: `Harder: ${n} + ? = 100. First jump to the next ten (${Math.ceil(n / 10) * 10}), then to 100.`, show: V.jumpLine([{ from: n, to: Math.ceil(n / 10) * 10, label: '+' + (Math.ceil(n / 10) * 10 - n) }, { from: Math.ceil(n / 10) * 10, to: 100, label: '+' + (100 - Math.ceil(n / 10) * 10) }]), try: { q: `${n} + ? = 100`, answer: 100 - n } });
      }
      return fr;
    },
    gen(y) {
      const T = y === 1 ? pick([10, 10, 20]) : pick([10, 20, 100, 100]);
      let a;
      if (T === 100) a = Math.random() < 0.5 ? rand(1, 9) * 10 : rand(11, 89);
      else a = rand(T === 20 ? 11 : 1, T - 1);
      const r = Math.random();
      if (r < 0.3 && T !== 100) {
        const good = [a, T - a];
        const wrongs = [[a, T - a + 1], [a, T - a - 1], [a + 2, T - a]].filter(([p, q]) => q >= 0);
        const opts = U.shuffle([good, ...wrongs.slice(0, 2)]).map(([p, q]) => ({ v: `${p}+${q}`, html: `${p} + ${q}` }));
        return { type: 'choice', q: `Which pair makes <b>${T}</b>?`, choices: opts, answer: `${good[0]}+${good[1]}`, hint: `Add each pair. Which one is exactly ${T}?`, steps: [`${good[0]} + ${good[1]} = ${T}`] };
      }
      return { q: `${a} + ? = ${T}`, visual: T <= 20 ? V.tenFrame(a, '🔴') : '', answer: T - a, hint: T <= 20 ? 'Count the empty boxes.' : 'Jump to the next ten, then to 100.', steps: [`Count on from ${a} to ${T}.`, `${a} + <b>${T - a}</b> = ${T}`] };
    },
  };

  /* ---------------- missing numbers (Years 1–4) ---------------- */
  /** p + q = w. Bonds to 10/20 (Y1), 100 (Y2–3), 1000 (Y3–4), and general sums. */
  function mnNums(y) {
    const r = Math.random();
    if (y === 1) { const w = pick([10, 10, 20, rand(8, 20)]); const p = rand(1, w - 1); return { p, q: w - p, w }; }
    if (y === 2) {
      if (r < 0.3) { const p = rand(1, 9) * 10; return { p, q: 100 - p, w: 100 }; }
      if (r < 0.55) { const p = rand(11, 89); return { p, q: 100 - p, w: 100 }; }
      const w = rand(30, 99), p = rand(11, w - 5); return { p, q: w - p, w };
    }
    if (y === 3) {
      if (r < 0.3) { const p = rand(11, 89); return { p, q: 100 - p, w: 100 }; }
      if (r < 0.5) { const p = rand(1, 99) * 10; return { p, q: 1000 - p, w: 1000 }; }
      const w = rand(200, 999), p = rand(100, w - 20); return { p, q: w - p, w };
    }
    if (r < 0.4) { const p = rand(101, 989); return { p, q: 1000 - p, w: 1000 }; }
    const w = rand(1000, 9999), p = rand(300, w - 100); return { p, q: w - p, w };
  }
  const isBond = (w) => w === 10 || w === 20 || w === 100 || w === 1000;
  /** Guided steps for a bond to 100 or 1000: ones make 10, the other columns make 9. */
  function bondParts(p, w) {
    const parts = [];
    const ds = String(p).padStart(String(w).length - 1, '0').split('').map(Number).reverse(); // ones first
    const q = w - p;
    const qd = String(q).padStart(ds.length, '0').split('').map(Number).reverse();
    let first = ds.findIndex((d) => d !== 0); // the first non-zero column makes 10
    ds.forEach((d, k) => {
      if (k < first) return;
      const place = V.PLACES[k];
      const target = k === first ? 10 : 9;
      parts.push({ say: `${U.cap(place)}: ${d} + ? = ${target}${k === first ? '' : ' <span class="muted">(only 9, because 1 was passed on from the column before)</span>'}`, answer: qd[k] });
    });
    parts.push({ say: `So ${fmt(p)} + ? = ${fmt(w)}`, answer: q, after: `${fmt(p)} + ${fmt(q)} = ${fmt(w)} ✔️` });
    return parts;
  }
  /** Missing-number addition as a problem. pos: 'second' (a + ? = w) or 'first' (? + a = w). */
  function missingAddProblem(y, { p, q, w }, pos) {
    const eq = pos === 'first' ? `<span class="box">?</span> + ${fmt(p)} = ${fmt(w)}` : `${fmt(p)} + <span class="box">?</span> = ${fmt(w)}`;
    const steps = [partWhole(w, p, q, 'b'), `Missing part = whole − part: ${fmt(w)} − ${fmt(p)} = <b>${fmt(q)}</b>`, `Check: ${fmt(p)} + ${fmt(q)} = ${fmt(w)} ✔️`];
    if (y <= 2) {
      return { q: eq, answer: q, visual: w <= 20 ? V.tenFrame(p, '🔴') : '', hint: w <= 20 ? `Count on from ${p} up to ${w}.` : `Jump from ${p} to the next ten, then on to ${w}.`, steps };
    }
    if ((w === 100 || w === 1000) && p % 10 !== 0 && Math.random() < 0.6) {
      return { type: 'guided', q: eq, visual: partWhole(w, p, q, 'b'), hint: `Ones make 10, the other columns make 9.`, parts: bondParts(p, w), steps };
    }
    if (Math.random() < 0.5) return { q: eq, answer: q, visual: partWhole(w, p, q, 'b'), hint: `Missing part = ${fmt(w)} − ${fmt(p)}.`, steps };
    return {
      type: 'guided', q: eq, visual: partWhole(w, p, q, 'b'), hint: 'Take the part you know away from the whole.', steps,
      parts: [
        { say: 'Which calculation finds the missing part?', type: 'choice', choices: U.shuffle([{ v: 's', html: `${fmt(w)} − ${fmt(p)}` }, { v: 'a', html: `${fmt(w)} + ${fmt(p)}` }]), answer: 's', after: 'Whole − part = the other part.' },
        { say: `${fmt(w)} − ${fmt(p)} =`, type: 'column', a: w, b: p, op: '−' },
        { say: 'So the missing number is:', answer: q, after: `${eq.replace('<span class="box">?</span>', `<b>${fmt(q)}</b>`)} ✔️` },
      ],
    };
  }

  const missingAdd = {
    id: 'missing-add', title: 'Missing number sums', years: [1, 4], icon: '❓',
    desc: 'Find the hidden number: 7 + ? = 10, ? + 45 = 100, 274 + ? = 1000.',
    lesson(y) {
      if (y <= 2) {
        const lim = y === 1 ? 20 : 50;
        const a = rand(3, 9), T = rand(a + 3, Math.min(lim, a + 9));
        const b2 = rand(2, 7), T2 = rand(b2 + 3, b2 + 10);
        const n = mnNums(y);
        return [
          { say: `Some sums hide a number in a box: <b>${a} + ? = ${T}</b>. Our job is to find what goes in the box.`, show: big(`${a} + <span class="box">?</span> = ${T}`) },
          { say: `Think of it as a question: <i>“I have ${a}. How many more do I need to get ${T}?”</i> The red counters are what we have. The ❔ are the missing ones.`, show: V.tenFrame(T, '🔴', { second: T - a, emoji2: '❔' }) },
          { say: `Count on from ${a} up to ${T}. Count the hops.`, show: V.numberLine({ min: 0, max: Math.max(20, T + 1), points: [{ v: a, label: fmt(a), color: '#ea580c' }, { v: T, label: fmt(T), color: '#16a34a' }] }), try: { q: `${a} + ? = ${T}`, answer: T - a, hint: `Count on from ${a}: ${seq(a, Math.min(T - a, 12)).join(', ')}…` } },
          { say: `It's <b>${T - a}</b>. ✔️ Check: ${a} + ${T - a} = ${T}. The <b>bar model</b> shows it too: the whole is on top, the two parts are underneath. The missing part = whole − the part we know.`, show: partWhole(T, a, T - a, 'b') },
          { say: `The box can come <b>first</b> too: <b>? + ${b2} = ${T2}</b>. The whole is still ${T2} and one part is ${b2}.`, show: partWhole(T2, T2 - b2, b2, 'a'), try: { q: `? + ${b2} = ${T2}`, answer: T2 - b2, hint: `${T2} − ${b2} = ?` } },
          { say: 'Your turn! 💪', try: missingAddProblem(y, n, pick(['first', 'second'])) },
        ];
      }
      const B = y === 3 ? 100 : 1000;
      let p = B === 100 ? rand(11, 89) : rand(101, 989);
      if (p % 10 === 0) p += 3;
      const g = mnNums(y), g2 = mnNums(y);
      const w2 = y === 3 ? rand(300, 900) : rand(2000, 9000), p2 = rand(Math.round(w2 * 0.2), Math.round(w2 * 0.7)), q2 = w2 - p2;
      return [
        { say: `A missing-number sum hides one <b>part</b>. In <b>${fmt(p2)} + ? = ${fmt(w2)}</b>, ${fmt(w2)} is the <b>whole</b> and ${fmt(p2)} is the part we know.`, show: partWhole(w2, p2, q2, 'b') + big(`${fmt(p2)} + <span class="box">?</span> = ${fmt(w2)}`) },
        { say: 'To find a missing part, take the part you know away from the whole. (Or count up from the part to the whole — that gives the same answer!)', show: partWhole(w2, p2, q2, 'b'),
          try: { type: 'choice', q: 'Which calculation finds the missing part?', choices: U.shuffle([{ v: 's', html: `${fmt(w2)} − ${fmt(p2)}` }, { v: 'a', html: `${fmt(w2)} + ${fmt(p2)}` }]), answer: 's', hint: 'Whole − part = the other part.' } },
        { say: `Work it out in columns:`, try: { type: 'column', a: w2, b: p2, op: '−' } },
        { say: `So ${fmt(p2)} + <b>${fmt(q2)}</b> = ${fmt(w2)} ✔️. 💡 Bonds to <b>${fmt(B)}</b> have a shortcut: the ones make <b>10</b> and every other column makes <b>9</b> (the 10 passes 1 on to the next column).`, show: big(`${fmt(p)} + <span class="box">?</span> = ${fmt(B)}`),
          try: { type: 'guided', parts: bondParts(p, B) } },
        { say: 'The box can be <b>first</b> too. It is still the missing part!', try: missingAddProblem(y, g, 'first') },
        { say: 'Your turn! 💪', try: missingAddProblem(y, g2, pick(['first', 'second'])) },
      ];
    },
    gen(y) { return missingAddProblem(y, mnNums(y), pick(['first', 'second'])); },
    word(y) {
      const n = U.name(), { p, q, w } = mnNums(y);
      return { type: 'guided', scene: '🎯', story: true, q: `${n} has <b>${fmt(p)}</b> stickers and wants <b>${fmt(w)}</b> to fill an album. How many more stickers does ${n} need?`, parts: [
        { say: 'Which sum matches the story?', type: 'choice', choices: U.shuffle([{ v: 'a', html: `${fmt(p)} + ? = ${fmt(w)}` }, { v: 'b', html: `${fmt(p)} + ${fmt(w)} = ?` }]), answer: 'a', after: 'We know the start and the end. The missing part is how many more.' },
        ...(y >= 3 ? [{ say: `${fmt(w)} − ${fmt(p)} =`, type: 'column', a: w, b: p, op: '−' }] : []),
        { say: `${fmt(p)} + ? = ${fmt(w)}`, answer: q, suffix: ' stickers' }], hint: `Count on from ${fmt(p)} to ${fmt(w)}, or work out ${fmt(w)} − ${fmt(p)}.`, steps: [partWhole(w, p, q, 'b'), `${fmt(w)} − ${fmt(p)} = ${fmt(q)}`] };
    },
  };

  const doubles = {
    id: 'doubles', title: 'Doubles and near doubles', years: [1, 2], icon: '👯',
    desc: 'Use doubles you know to add numbers that are next to each other.',
    lesson(y) {
      const d = rand(2, y === 1 ? 5 : 9), n = rand(3, y === 1 ? 8 : 15), m = rand(3, y === 1 ? 8 : 15);
      const lessOne = Math.random() < 0.5;
      return [
        { say: `A <b>double</b> is adding a number to itself, like <b>${d} + ${d}</b>. Two hands with the same number of fingers!`, show: objSum(d, d, '🖐️') + big(`${d} + ${d} = ${d * 2}`) },
        { say: 'Doubles are worth learning by heart. Try this one.', show: objSum(n, n, '🔵'), try: { q: `Double ${n}: ${n} + ${n} = ?`, answer: n * 2, hint: `Count on ${n} from ${n}.` } },
        { say: `<b>Near doubles</b> are numbers next to each other, like ${m} + ${m + 1}. It is just a double plus <b>1 more</b>!`, show: objSum(m, m + 1, '🍓') + big(`${m} + ${m + 1} = ${m} + ${m} + 1`) },
        { say: `First the double, then add the extra 1.`, try: { type: 'guided', parts: [{ say: `${m} + ${m} = ?`, answer: 2 * m }, { say: `${m} + ${m + 1} is one more. = ?`, answer: 2 * m + 1, after: `${m} + ${m + 1} = ${2 * m + 1}` }] } },
        { say: `You can also use the bigger double and take 1 away: ${m + 1} + ${m} = double ${m + 1} − 1 = ${2 * (m + 1)} − 1 = ${2 * m + 1}.`, show: V.chips(Array.from({ length: 10 }, (_, i) => `${i + 1} + ${i + 1} = ${2 * (i + 1)}`)) },
        (() => { const p = rand(3, y === 1 ? 8 : 14); const q2 = lessOne ? p - 1 : p + 1; return { say: 'Your turn! Find the double first. 💪', try: { type: 'guided', q: `${p} + ${q2} = ?`, parts: [
          { say: `Which double helps? ${p} + ${p} = ?`, answer: 2 * p },
          { say: `${q2} is ${lessOne ? '1 less' : '1 more'} than ${p}, so the answer is ${lessOne ? '1 less' : '1 more'}. ${p} + ${q2} = ?`, answer: p + q2 }] } }; })(),
      ];
    },
    gen(y) {
      const n = rand(2, y === 1 ? 10 : 20);
      if (Math.random() < 0.4) return { q: `${n} + ${n} = ?`, visual: n <= 10 ? objSum(n, n, pick(EM)) : '', answer: 2 * n, hint: 'Double it!', steps: [`Double ${n} = <b>${2 * n}</b>`] };
      const near = Math.random() < 0.5 ? n + 1 : Math.max(1, n - 1);
      const lo = Math.min(n, near);
      return { type: 'guided', q: `${n} + ${near} = ?`, parts: [{ say: `Double ${lo}: ${lo} + ${lo} = ?`, answer: 2 * lo }, { say: `${n} + ${near} is one more than that. = ?`, answer: n + near }], hint: `Use double ${lo}.`, steps: [`${lo} + ${lo} = ${2 * lo}`, `${2 * lo} + 1 = <b>${n + near}</b>`] };
    },
  };

  const partitionAdd = {
    id: 'partition-add', title: 'Add by splitting into tens and ones', years: [2, 2], icon: '🧱',
    desc: 'Split both numbers, add the tens, add the ones, then put them together.',
    lesson(y) {
      const ex = () => (y === 2 ? { a: rand(21, 58), b: rand(11, 39) } : { a: rand(120, 780), b: rand(11, 99) });
      const { a, b } = ex();
      const A = V.decompose(a), B = V.decompose(b);
      const at = a - (a % 10), ao = a % 10, bt = b - (b % 10), bo = b % 10;
      const T = at + bt, O = ao + bo;
      const n = ex();
      return [
        { say: `Let's add <b>${a} + ${b}</b>. Every number is made of ${y === 3 ? 'hundreds (squares), ' : ''}tens (sticks) and ones (cubes).`, show: `<div class="row-center">${V.base10(a)}<span class="op">+</span>${V.base10(b)}</div>` },
        { say: `<b>Split (partition)</b> each number: ${a} = ${A.join(' + ')} and ${b} = ${B.join(' + ')}.`, show: V.chips([`${a} = ${A.join(' + ')}`, `${b} = ${B.join(' + ')}`]), try: { q: `${a} = ${at} + ?`, answer: ao, hint: `The ones digit of ${a}.` } },
        { say: `Add the <b>tens</b> (and hundreds) together first — the big parts.`, show: V.chips([`${at}`, '+', `${bt}`]), try: { q: `${at} + ${bt} = ?`, answer: T, hint: 'Add the tens digits, then put the 0 back.' } },
        { say: 'Now add the <b>ones</b> together.', show: V.chips([`${ao}`, '+', `${bo}`]), try: { q: `${ao} + ${bo} = ?`, answer: O } },
        { say: `Put the parts back together: ${T} + ${O}.${O >= 10 ? ` ${O} ones is 1 ten and ${O - 10} ones, so it gives one more ten!` : ''}`, try: { q: `${T} + ${O} = ?`, answer: a + b } },
        { say: `So <b>${a} + ${b} = ${a + b}</b>. 🎉 Splitting makes big sums into small easy ones.`, show: big(`${a} + ${b} = ${T} + ${O} = ${a + b}`) },
        { say: 'Your turn: split, add tens, add ones, put back together.', try: partitionGuided(n.a, n.b) },
      ];
    },
    gen(y) {
      const a = y === 2 ? rand(21, 69) : rand(120, 850), b = y === 2 ? rand(11, Math.min(39, 99 - a)) : rand(11, 99);
      if (Math.random() < 0.6) return partitionGuided(a, b);
      return { q: `${a} + ${b} = ?`, visual: y === 2 ? `<div class="row-center">${V.base10(a)}<span class="op">+</span>${V.base10(b)}</div>` : '', answer: a + b, hint: 'Add the tens, then the ones.', steps: partitionSteps(a, b) };
    },
    word(y) { const a = y === 2 ? rand(21, 59) : rand(120, 700), b = rand(11, y === 2 ? 39 : 99); return addStory(2, a, b, 0); },
  };
  function partitionSteps(a, b) {
    const at = a - (a % 10), bt = b - (b % 10);
    return [`Tens: ${at} + ${bt} = ${at + bt}`, `Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}`, `${at + bt} + ${(a % 10) + (b % 10)} = <b>${a + b}</b>`];
  }
  function partitionGuided(a, b) {
    const at = a - (a % 10), bt = b - (b % 10), ao = a % 10, bo = b % 10;
    return { type: 'guided', q: `${a} + ${b} = ?`, hint: 'Tens with tens, ones with ones.', steps: partitionSteps(a, b), parts: [
      { say: `Add the tens: ${at} + ${bt} = ?`, answer: at + bt },
      { say: `Add the ones: ${ao} + ${bo} = ?`, answer: ao + bo },
      { say: `Put them together: ${at + bt} + ${ao + bo} = ?`, answer: a + b, after: `${a} + ${b} = ${a + b}` }] };
  }

  const lineAdd = {
    id: 'numberline-add', title: 'Add on an empty number line', years: [2, 2], icon: '🦘',
    desc: 'Jump the tens, then jump the ones.',
    lesson(y) {
      const pair = () => (y === 2 ? { a: rand(23, 59), b: rand(21, 38) } : { a: rand(124, 760), b: rand(21, 89) });
      const { a, b } = pair();
      const T = b - (b % 10), O = b % 10;
      const j1 = { from: a, to: a + T, label: '+' + T }, j2 = { from: a + T, to: a + b, label: '+' + O };
      const line = (js, pts) => V.numberLine({ min: a - 4, max: a + b + 4, empty: true, marks: [a], jumps: js, points: pts || [] });
      const n = pair();
      return [
        { say: `An <b>empty number line</b> has no numbers on it until we need them. To work out <b>${a} + ${b}</b>, put ${a} at the start.`, show: line([], [{ v: a, label: fmt(a), color: '#7c3aed' }]) },
        { say: `Split ${b} into tens and ones: ${b} = ${T} + ${O}. We will make one big jump and one small jump.`, show: big(`${b} = ${T} + ${O}`), try: { q: `${b} = ${T} + ?`, answer: O } },
        { say: `<b>Big jump:</b> add the tens. Where do we land after jumping ${T} from ${a}?`, show: line([], [{ v: a, label: fmt(a), color: '#7c3aed' }]), try: { q: `${a} + ${T} = ?`, answer: a + T, hint: `Count on in tens: ${seq(a, T / 10).map((v, i) => a + (i + 1) * 10).join(', ')}.` } },
        { say: `We landed on <b>${a + T}</b>. <b>Small jump:</b> now add the ${O} ones.`, show: line([j1]), try: { q: `${a + T} + ${O} = ?`, answer: a + b } },
        { say: `We land on <b>${a + b}</b>. So ${a} + ${b} = ${a + b}! 🦘`, show: line([j1, j2]) },
        { say: 'Your turn: big jump, then small jump.', try: lineGuided(n.a, n.b) },
      ];
    },
    gen(y) {
      const a = y === 2 ? rand(13, 69) : rand(110, 880), b = y === 2 ? rand(11, Math.min(29, 99 - a)) : rand(11, 99);
      if (b % 10 === 0) return { q: `${a} + ${b} = ?`, answer: a + b, hint: 'Jump the tens.', steps: [V.jumpLine(V.splitJumps(a, b))] };
      if (Math.random() < 0.6) return lineGuided(a, b);
      return { q: `${a} + ${b} = ?`, visual: V.numberLine({ min: a - 4, max: a + b + 4, empty: true, marks: [a] }), answer: a + b, hint: 'Jump the tens, then the ones.', steps: [V.jumpLine(V.splitJumps(a, b)), `${a} + ${b} = <b>${a + b}</b>`] };
    },
  };
  function lineGuided(a, b) {
    const T = b - (b % 10), O = b % 10;
    return { type: 'guided', q: `${a} + ${b} = ?`, visual: V.numberLine({ min: a - 4, max: a + b + 4, empty: true, marks: [a] }), hint: `Split ${b} into ${T} and ${O}.`, steps: [V.jumpLine(V.splitJumps(a, b))], parts: [
      { say: `Big jump: ${a} + ${T} = ?`, answer: a + T },
      { say: `Small jump: ${a + T} + ${O} = ?`, answer: a + b, after: V.jumpLine(V.splitJumps(a, b)) }] };
  }

  const bridge10 = {
    id: 'bridge-10', title: 'Make 10 to add (bridging)', years: [2, 2], icon: '🌉',
    desc: '8 + 5 = 8 + 2 + 3: fill up to ten first.',
    lesson() {
      const a = rand(6, 9), b = rand(11 - a, 9), need = 10 - a, rest = b - need;
      let a2 = rand(24, 78);
      if (a2 % 10 === 0) a2 += 3;
      const need2 = 10 - (a2 % 10), b2 = need2 + rand(1, 7);
      return [
        { say: `<b>${a} + ${b}</b> goes past 10. Let's use a ten frame! The red counters are the ${a}.`, show: V.tenFrame(a, '🔴') },
        { say: 'How many more counters fill the frame up to 10?', show: V.tenFrame(a, '🔴'), try: { q: `${a} + ? = 10`, answer: need, hint: 'Count the empty boxes.' } },
        { say: `So we split ${b} into <b>${need}</b> (to fill the ten) and the rest.`, show: big(`${b} = ${need} + <span class="box">?</span>`), try: { q: `${b} = ${need} + ?`, answer: rest } },
        { say: `${a} + ${need} = 10, then 10 + ${rest} is easy!`, show: V.tenFrame(a + b, '🔴', { second: b }) + V.numberLine({ min: 0, max: 20, jumps: [{ from: a, to: 10, label: '+' + need }, { from: 10, to: a + b, label: '+' + rest }] }), try: { q: `10 + ${rest} = ?`, answer: a + b } },
        { say: `It works with bigger numbers too: ${a2} + ${b2}. Jump to the next ten, ${a2 + need2}, first.`, show: V.jumpLine([{ from: a2, to: a2 + need2, label: '+' + need2 }, { from: a2 + need2, to: a2 + b2, label: '+' + (b2 - need2) }]) },
        (() => { const p = rand(6, 9), q = rand(11 - p, 9); return { say: 'Your turn! 💪', try: bridgeGuided(p, q) }; })(),
      ];
    },
    gen() {
      if (Math.random() < 0.3) {
        const a = rand(21, 87), need = 10 - (a % 10 || 10);
        if (need === 0) return bridgeGuided(7, 6);
        const b = need + rand(1, 8);
        return { type: 'guided', q: `${a} + ${b} = ?`, parts: [{ say: `Jump to the next ten: ${a} + ? = ${a + need}`, answer: need }, { say: `${b} − ${need} = ? left to add`, answer: b - need }, { say: `${a + need} + ${b - need} = ?`, answer: a + b }], hint: 'Fill up to the next ten first.', steps: [V.jumpLine([{ from: a, to: a + need, label: '+' + need }, { from: a + need, to: a + b, label: '+' + (b - need) }])] };
      }
      const a = rand(5, 9), b = rand(11 - a, 9);
      return Math.random() < 0.5 ? bridgeGuided(a, b) : { q: `${a} + ${b} = ?`, visual: V.tenFrame(a + b, '🔴', { second: b }), answer: a + b, hint: `Make 10 first: ${a} + ${10 - a} = 10.`, steps: [`${a} + ${10 - a} = 10`, `10 + ${b - (10 - a)} = <b>${a + b}</b>`] };
    },
  };
  function bridgeGuided(a, b) {
    const need = 10 - a;
    return { type: 'guided', q: `${a} + ${b} = ?`, visual: V.tenFrame(a, '🔴'), hint: `${a} + ${need} = 10`, steps: [`${a} + ${need} = 10`, `10 + ${b - need} = ${a + b}`], parts: [
      { say: `How many to make 10? ${a} + ? = 10`, answer: need },
      { say: `Split ${b}: ${b} = ${need} + ?`, answer: b - need },
      { say: `10 + ${b - need} = ?`, answer: a + b, after: `${a} + ${b} = ${a + b}` }] };
  }

  const addThree = {
    id: 'add-three', title: 'Add three numbers', years: [2, 2], icon: '3️⃣',
    desc: 'Look for a bond to 10 or a double first.',
    lesson() {
      const p = pick([2, 3, 4, 6, 7, 8]), q = 10 - p;
      let r = rand(2, 9);
      while (r === p || r === q) r = rand(2, 9);
      const d = rand(2, 6), e = rand(1, 9);
      const order = U.shuffle([p, q, r]);
      const n1 = rand(3, 7), n3 = rand(2, 9);
      return [
        { say: `How do we add <b>${order.join(' + ')}</b>? Good news: you can add numbers in <b>any order</b> and the total stays the same.`, show: `<div class="obj-sum">${order.map((v) => V.objects(v, '🍒')).join('<span class="op">+</span>')}</div>` },
        { say: 'Smart trick: look for <b>two numbers that make 10</b> and add those first.', try: { type: 'choice', q: 'Which two make 10?', choices: U.shuffle([[p, q], [p, r], [q, r]]).map(([x, z]) => ({ v: `${Math.min(x, z)}+${Math.max(x, z)}`, html: `${x} + ${z}` })), answer: `${Math.min(p, q)}+${Math.max(p, q)}` } },
        { say: `${p} + ${q} = 10. Now add the last number to 10. Easy!`, show: big(`10 + ${r}`), try: { q: `10 + ${r} = ?`, answer: 10 + r } },
        { say: `No bond to 10? Look for a <b>double</b>: ${d} + ${e} + ${d} → ${d} + ${d} = ${2 * d}, then + ${e}.`, show: big(`${d} + ${d} + ${e} = ${2 * d} + ${e} = ${2 * d + e}`) },
        { say: 'Your turn! Find the pair that makes 10 first.', try: (() => { const m = 10 - n1; return { type: 'guided', q: `${n1} + ${n3} + ${m} = ?`, parts: [{ say: `${n1} + ${m} = ?`, answer: 10 }, { say: `10 + ${n3} = ?`, answer: 10 + n3 }] }; })() },
      ];
    },
    gen() {
      const a = rand(1, 9), b = rand(1, 9);
      const c = Math.random() < 0.5 ? (10 - a || 5) : rand(1, 9);
      const nums = U.shuffle([a, b, c]);
      const s = a + b + c;
      const pair = [[0, 1], [0, 2], [1, 2]].find(([i, j]) => nums[i] + nums[j] === 10);
      if (pair) {
        const third = nums[3 - pair[0] - pair[1]];
        return { type: 'guided', q: `${nums.join(' + ')} = ?`, parts: [{ say: `Which two make 10? Add them: ${nums[pair[0]]} + ${nums[pair[1]]} = ?`, answer: 10 }, { say: `10 + ${third} = ?`, answer: s }], hint: 'Find a bond to 10.', steps: [`${nums[pair[0]]} + ${nums[pair[1]]} = 10`, `10 + ${third} = ${s}`] };
      }
      return { q: `${nums.join(' + ')} = ?`, answer: s, hint: 'Add two numbers first, then the third.', steps: [`${nums[0]} + ${nums[1]} = ${nums[0] + nums[1]}`, `${nums[0] + nums[1]} + ${nums[2]} = <b>${s}</b>`] };
    },
    word() {
      const a = rand(2, 9), b = 10 - a, c = rand(2, 9), n = U.name();
      return { type: 'guided', scene: '🍎', story: true, q: `${n} picks <b>${a}</b> apples, then <b>${c}</b> pears, then <b>${b}</b> more apples. How many pieces of fruit altogether?`, parts: [{ say: 'Which two numbers make 10?', type: 'choice', choices: [{ v: 'ab', html: `${a} and ${b}` }, { v: 'ac', html: `${a} and ${c}` }], answer: c + a === 10 && c !== b ? 'ac' : 'ab' }, { say: `10 + ${c} = ?`, answer: a + b + c, suffix: ' pieces' }], steps: [`${a} + ${b} = 10`, `10 + ${c} = ${a + b + c}`] };
    },
  };

  const colAddSimple = {
    id: 'column-add-simple', title: 'Column addition (no carrying)', years: [3, 3], icon: '📝',
    desc: 'Line up the digits and add each column from the right.',
    lesson() {
      const { a, b } = noCarryPair(3);
      const n = noCarryPair(3);
      return [
        { say: `To add <b>${fmt(a)} + ${fmt(b)}</b>, write one number under the other. <b>Hundreds under hundreds, tens under tens, ones under ones</b> — just like a place value table.`, show: V.pvTable(a) + V.pvTable(b) },
        { say: 'Draw a line underneath. The answer goes under the line. We start on the <b>right</b>, with the ones. ➡️', show: colShow(a, b, '+', 0, 0, 0) },
        ...addColumnFrames(a, b),
        { say: `Done! <span class="say-big">${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}</span> Each column was less than 10, so nothing needed carrying.`, show: colShow(a, b, '+', 0) },
        { say: 'Your turn! Fill each answer box, starting with the ones.', try: { type: 'column', a: n.a, b: n.b, op: '+', hint: 'Start with the ones on the right.' } },
      ];
    },
    gen() {
      const { a, b } = noCarryPair(3);
      return { type: 'column', q: `Work out ${fmt(a)} + ${fmt(b)}`, a, b, op: '+', hint: 'Start with the ones.', steps: V.columnMethod(a, b, '+').steps };
    },
    word() { const { a, b } = noCarryPair(3); return addStory(3, a, b, 0); },
  };

  const columnAdd = {
    id: 'column-add', title: 'Column addition with carrying', years: [3, 6], icon: '➕',
    desc: 'Add big numbers column by column, and carry tens.',
    lesson(y) {
      const { a, b } = carryPair(y);
      const n = carryPair(y);
      const E = estParts(a, b, '+');
      return [
        { say: `We want <b>${fmt(a)} + ${fmt(b)}</b>. First, a quick <b>estimate</b>: round each number to the nearest 10, so we know roughly what answer to expect.`, show: big(`${fmt(a)} + ${fmt(b)} ≈ ?`), try: { type: 'guided', parts: E.parts } },
        { say: `Now the exact answer. Write the numbers on top of each other. <b>Ones under ones, tens under tens</b>, like in a place value table.`, show: V.pvTable(a) + V.pvTable(b) },
        { say: 'Draw a line under them. The answer goes underneath. Always start with the <b>ones on the right</b> ➡️ and move left.', show: colShow(a, b, '+', 0, 0, 0) },
        ...addColumnFrames(a, b),
        { say: `Finished! <span class="say-big">${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}</span> ✔️ Our estimate was ${fmt(E.ra)} + ${fmt(E.rb)} = ${fmt(E.e)}. Close, so the answer makes sense!`, show: colShow(a, b, '+', 0) },
        { say: 'Your turn! Estimate first, then the helper asks you each small step: add the column, write the digit, carry the 1.', try: estColumn(n.a, n.b, '+') },
      ];
    },
    gen(y) {
      const { a, b } = Math.random() < 0.8 ? carryPair(y) : addNums(Math.max(3, y), true);
      if (Math.random() < 0.5) return estColumn(a, b, '+');
      return { type: 'column', q: `Work out ${fmt(a)} + ${fmt(b)}`, a, b, op: '+', hint: 'Start with the ones. If a column makes 10 or more, carry 1.', steps: V.columnMethod(a, b, '+').steps };
    },
    word(y) { const { a, b } = addNums(Math.max(3, y), true); return addStory(y, a, b, 0); },
  };

  const add9 = {
    id: 'add-9', title: 'Add 9, 19 or 99 in your head', years: [3, 4], icon: '🧠',
    desc: 'Add 10 (or 20, or 100), then take 1 away.',
    lesson(y) {
      const a = y === 3 ? rand(23, 78) : rand(124, 789);
      const b2 = y === 3 ? 19 : pick([29, 99]), r2 = b2 + 1;
      const a2 = y === 3 ? rand(31, 69) : rand(210, 780);
      return [
        { say: `Adding 9 can feel tricky… but adding <b>10</b> is super easy! And 9 is just <b>1 less than 10</b>.`, show: big('9 = 10 − 1') },
        { say: `So to work out <b>${a} + 9</b>, first add 10.`, try: { q: `${a} + 10 = ?`, answer: a + 10, hint: 'The tens digit goes up by 1.' } },
        { say: 'We added 1 too many! So take 1 away.', show: V.jumpLine([{ from: a, to: a + 10, label: '+10' }, { from: a + 10, to: a + 9, label: '−1' }]), try: { q: `${a + 10} − 1 = ?`, answer: a + 9 } },
        { say: `${a} + 9 = <b>${a + 9}</b>. The same trick works for ${b2}: add ${r2}, then take 1 away.`, show: big(`${b2} = ${r2} − 1`) },
        { say: 'Your turn! 💪', try: { type: 'guided', q: `${a2} + ${b2} = ?`, parts: [{ say: `${a2} + ${r2} = ?`, answer: a2 + r2 }, { say: `${a2 + r2} − 1 = ?`, answer: a2 + b2 }] } },
      ];
    },
    gen(y) {
      const a = y === 3 ? rand(14, 80) : rand(112, 880);
      const b = y === 3 ? pick([9, 19, 29]) : pick([9, 19, 29, 99]);
      if (Math.random() < 0.5) return { type: 'guided', q: `${a} + ${b} = ?`, parts: [{ say: `${a} + ${b + 1} = ?`, answer: a + b + 1 }, { say: 'Now take 1 away:', answer: a + b }], hint: `Add ${b + 1}, then take 1 away.`, steps: [`${a} + ${b + 1} = ${a + b + 1}`, `${a + b + 1} − 1 = <b>${a + b}</b>`] };
      return { q: `${a} + ${b} = ?`, answer: a + b, hint: `Add ${b + 1}, then take 1 away.`, steps: [`${a} + ${b + 1} = ${a + b + 1}`, `${a + b + 1} − 1 = <b>${a + b}</b>`] };
    },
  };

  /** Four answers: the right one and three that an estimate shows are silly. */
  function sensibleChoices(exact, y) {
    const far = y >= 5 ? 1000 * pick([2, 3]) : y === 4 ? 1000 : 100 * pick([2, 3]);
    const opts = [exact, exact * 10, Math.round(exact / 10), exact + far].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i);
    return U.shuffle(opts).map((v) => ({ v: String(v), html: fmt(v) }));
  }
  /** Estimate (nearest 10) → choose the sensible answer, or → work it out exactly. */
  function estimateGuided(a, b, op, y, mode) {
    const exact = op === '+' ? a + b : a - b;
    const E = estParts(a, b, op);
    const tail = mode === 'choose'
      ? [{ say: `Which answer is sensible for ${fmt(a)} ${op} ${fmt(b)}? Pick the one closest to your estimate, ${fmt(E.e)}.`, type: 'choice', choices: sensibleChoices(exact, y), answer: String(exact), after: `${fmt(exact)} is close to ${fmt(E.e)} ✔️` }]
      : [{ say: `Now work out ${fmt(a)} ${op} ${fmt(b)} exactly:`, type: 'column', a, b, op }, closeNote(exact, E.e)];
    return {
      type: 'guided', q: mode === 'choose' ? `Use an estimate to find the sensible answer to <b>${fmt(a)} ${op} ${fmt(b)}</b>.` : `Estimate, then work out <b>${fmt(a)} ${op} ${fmt(b)}</b>.`,
      hint: 'Round each number to the nearest 10 first.',
      parts: [...E.parts, ...tail],
      steps: [`${fmt(a)} ≈ ${fmt(E.ra)} and ${fmt(b)} ≈ ${fmt(E.rb)}`, `Estimate: ${fmt(E.ra)} ${op} ${fmt(E.rb)} = <b>${fmt(E.e)}</b>`, `Exact answer: <b>${fmt(exact)}</b> — close to the estimate.`],
    };
  }
  const roundLine = (n) => { const lo = Math.floor(n / 10) * 10; return V.numberLine({ min: lo, max: lo + 10, step: 1, points: [{ v: n, label: fmt(n), color: '#7c3aed' }] }); };
  function estimateLesson(y, op) {
    const { a, b } = op === '+' ? addNums(Math.max(3, y), true) : subNums(Math.max(3, y));
    const ra = estR(a), rb = estR(b);
    const est = op === '+' ? ra + rb : ra - rb, exact = op === '+' ? a + b : a - b;
    const lo = Math.floor(a / 10) * 10;
    const n = op === '+' ? addNums(Math.max(3, y), true) : subNums(Math.max(3, y));
    return [
      { say: `Before working out <b>${fmt(a)} ${op} ${fmt(b)}</b>, make a quick <b>estimate</b>: a rough answer. If your real answer ends up far away from it, you know to check your work!`, show: big(`${fmt(a)} ${op} ${fmt(b)} ≈ ?`) },
      { say: `We estimate by rounding each number to the <b>nearest 10</b>. ${fmt(a)} is between <b>${fmt(lo)}</b> and <b>${fmt(lo + 10)}</b>. Look at the ones digit, <b>${a % 10}</b>: 5 or more rounds <b>up</b>, less than 5 rounds <b>down</b>.`, show: roundLine(a), try: { q: `${fmt(a)} to the nearest 10 = ?`, answer: ra, hint: `Is ${fmt(a)} closer to ${fmt(lo)} or ${fmt(lo + 10)}?` } },
      { say: `Now round ${fmt(b)} the same way.`, show: roundLine(b), try: { q: `${fmt(b)} to the nearest 10 = ?`, answer: rb } },
      { say: 'Numbers ending in 0 are easier to work with! Now do the estimate.', show: big(`${fmt(ra)} ${op} ${fmt(rb)} = ?`), try: { q: `${fmt(ra)} ${op} ${fmt(rb)} = ?`, answer: est } },
      { say: `The exact answer is <b>${fmt(exact)}</b>. Our estimate was <b>${fmt(est)}</b> — very close! ✔️ If we had written ${fmt(exact * 10)} or ${fmt(Math.round(exact / 10))}, the estimate would warn us that something went wrong.`, show: big(`${fmt(exact)} ≈ ${fmt(est)}`) },
      { say: 'Your turn: estimate first, then pick the sensible answer.', try: estimateGuided(n.a, n.b, op, y, 'choose') },
    ];
  }
  function estimateGen(y, op) {
    const { a, b } = op === '+' ? addNums(Math.max(3, y), true) : subNums(Math.max(3, y));
    return estimateGuided(a, b, op, y, Math.random() < 0.5 ? 'choose' : 'exact');
  }
  const estimateAdd = {
    id: 'estimate-add', title: 'Estimate before you add', years: [3, 6], icon: '🎯',
    desc: 'Round the numbers to find a rough answer and check your work.',
    lesson: (y) => estimateLesson(y, '+'), gen: (y) => estimateGen(y, '+'),
  };

  const decimalAdd = {
    id: 'decimal-add', title: 'Add decimals in columns', years: [5, 6], icon: '🔢',
    desc: 'Line up the decimal points, fill gaps with zeros, then add.',
    lesson(y) {
      const { a, b, dp } = decPair(y, '+');
      const n = decPair(y, '+');
      const fa = a.toFixed(dp), fb = b.toFixed(dp);
      return [
        { say: `To add <b>${fmt(a)} + ${fmt(b)}</b>, the most important rule: <b>line up the decimal points</b>! Then ones are under ones and tenths under tenths.`, show: big(`${fmt(a)} + ${fmt(b)}`) },
        { say: `Give both numbers the same number of decimal places by filling gaps with <b>0</b>. ${fmt(a)} = <b>${fa}</b> and ${fmt(b)} = <b>${fb}</b>. A 0 on the end doesn't change the value.`, show: colShow(a, b, '+', dp, 0, 0) },
        ...addColumnFrames(a, b, dp),
        { say: `Put the decimal point in the answer, right under the others. <span class="say-big">${fa} + ${fb} = ${(a + b).toFixed(dp)}</span>`, show: colShow(a, b, '+', dp) },
        { say: 'Your turn! The point is already lined up for you.', try: { type: 'column', a: n.a, b: n.b, op: '+', dp: n.dp } },
      ];
    },
    gen(y) {
      const { a, b, dp } = decPair(y, '+');
      return { type: 'column', q: `Work out ${fmt(a)} + ${fmt(b)}`, a, b, op: '+', dp, hint: 'Line up the decimal points.', steps: V.columnMethod(a, b, '+', { dp }).steps };
    },
    word(y) {
      const { a, b, dp } = decPair(y, '+');
      const [tpl, unit, scene] = pick([
        [(x, z, n) => `${n} ran <b>${x}</b> km on Saturday and <b>${z}</b> km on Sunday. How far did ${n} run altogether?`, 'km', '🏃'],
        [(x, z) => `A bag of flour weighs <b>${x}</b> kg and a bag of sugar weighs <b>${z}</b> kg. What is the total weight?`, 'kg', '⚖️'],
        [(x, z) => `A jug holds <b>${x}</b> litres of juice and a bottle holds <b>${z}</b> litres. How much juice is there in total?`, 'litres', '🧃'],
      ]);
      return wordProblem({ q: tpl(fmt(a), fmt(b), U.name()), unit, scene, a, b, op: '+', y, dp });
    },
  };

  const inverseAdd = {
    id: 'inverse-add', title: 'Check with the inverse', years: [4, 6], icon: '🔄',
    desc: 'Subtraction undoes addition. Use it to check answers and find missing numbers.',
    lesson(y) {
      const { a, b } = addNums(y, true), c = a + b;
      const wrong = c + pick([10, 100, -10, 1000]) * (y >= 5 ? 10 : 1);
      const n = addNums(y, true);
      return [
        { say: `Addition and subtraction are <b>opposites</b> (inverses). If ${fmt(a)} + ${fmt(b)} = ${fmt(c)}, then going back, ${fmt(c)} − ${fmt(b)} = ${fmt(a)}.`, show: partWhole(c, a, b) },
        { say: 'To <b>check</b> an addition, take one number away from the answer. You should get the other number back.', try: { q: `${fmt(c)} − ${fmt(b)} = ?`, answer: a, hint: 'Use the column method if you need to.' } },
        { say: `You got ${fmt(a)} back, so ${fmt(a)} + ${fmt(b)} = ${fmt(c)} is correct ✔️. Now ${U.name()} says ${fmt(a)} + ${fmt(b)} = <b>${fmt(wrong)}</b>. Check it!`, try: { type: 'guided', parts: [{ say: `${fmt(wrong)} − ${fmt(b)} = ?`, answer: wrong - b, type: 'number' }, { say: `Is that ${fmt(a)}? So is the answer right?`, type: 'choice', choices: [{ v: 'y', html: 'Yes, right' }, { v: 'n', html: 'No, wrong' }], answer: 'n' }] } },
        { say: `The inverse also finds <b>missing numbers</b>: ? + ${fmt(b)} = ${fmt(c)}. Undo the + ${fmt(b)} by subtracting it.`, show: partWhole(c, a, b, 'a') },
        { say: 'Your turn: find the missing number.', try: { type: 'guided', q: `? + ${fmt(n.b)} = ${fmt(n.a + n.b)}`, parts: [{ say: 'Which calculation finds it?', type: 'choice', choices: [{ v: 's', html: `${fmt(n.a + n.b)} − ${fmt(n.b)}` }, { v: 'a', html: `${fmt(n.a + n.b)} + ${fmt(n.b)}` }], answer: 's' }, { say: 'Work it out:', type: 'column', a: n.a + n.b, b: n.b, op: '−' }] } },
      ];
    },
    gen(y) {
      const { a, b } = addNums(y, true), c = a + b;
      if (Math.random() < 0.5) return { type: 'guided', q: `Find the missing number: <b>? + ${fmt(b)} = ${fmt(c)}</b>`, parts: [{ say: 'Which calculation finds it?', type: 'choice', choices: [{ v: 's', html: `${fmt(c)} − ${fmt(b)}` }, { v: 'a', html: `${fmt(c)} + ${fmt(b)}` }], answer: 's' }, { say: `${fmt(c)} − ${fmt(b)} =`, type: 'column', a: c, b, op: '−' }], hint: 'Undo the addition with a subtraction.', steps: [`${fmt(c)} − ${fmt(b)} = ${fmt(a)}`] };
      const right = Math.random() < 0.5, shown = right ? c : c + pick([10, 100, 1000]);
      return { type: 'guided', q: `${U.name()} worked out ${fmt(a)} + ${fmt(b)} = <b>${fmt(shown)}</b>. Check it with the inverse.`, parts: [{ say: `${fmt(shown)} − ${fmt(b)} = ?`, answer: shown - b }, { say: `Should that be ${fmt(a)}? Is the answer right?`, type: 'choice', choices: [{ v: 'y', html: 'Right ✔️' }, { v: 'n', html: 'Wrong ✖️' }], answer: right ? 'y' : 'n' }], steps: [`${fmt(shown)} − ${fmt(b)} = ${fmt(shown - b)}`, right ? 'That is the first number, so it is right.' : `It should be ${fmt(a)}, so it is wrong. The right answer is ${fmt(c)}.`] };
    },
  };

  function multiStep(y) {
    const big3 = y >= 5;
    const a = big3 ? rand(1200, 9000) : rand(120, 900);
    const b = big3 ? rand(300, 3000) : rand(30, 300);
    const c = rand(Math.round((a + b) * 0.2), Math.round((a + b) * 0.7));
    const ctx = pick([
      { q: `A train has <b>${fmt(a)}</b> passengers. At the first station <b>${fmt(b)}</b> get on. At the next station <b>${fmt(c)}</b> get off. How many passengers are on the train now?`, unit: 'passengers', scene: '🚆' },
      { q: `A farmer has <b>${fmt(a)}</b> apples. The farmer picks <b>${fmt(b)}</b> more, then sells <b>${fmt(c)}</b>. How many apples are left?`, unit: 'apples', scene: '🍎' },
      { q: `A school library has <b>${fmt(a)}</b> books. It buys <b>${fmt(b)}</b> new books and gives away <b>${fmt(c)}</b> old ones. How many books does it have now?`, unit: 'books', scene: '📚' },
    ]);
    return { a, b, c, ...ctx };
  }
  const multiStepSkill = {
    id: 'multi-step', title: 'Two-step problems', years: [4, 6], icon: '🪜',
    desc: 'Break a long problem into small steps: add, then subtract.',
    lesson(y) {
      const m = multiStep(y);
      const s1 = m.a + m.b, ans = s1 - m.c;
      const n = multiStep(y);
      return [
        { say: 'Some problems need <b>two steps</b>. Read slowly and find each thing that happens.', show: `<div class="qtext story">${m.q}</div>` },
        { say: `First thing that happens: ${fmt(m.b)} are <b>added</b> to ${fmt(m.a)}. A bar model shows it.`, show: partWhole(s1, m.a, m.b, 'w'), try: { type: 'choice', q: 'Step 1: what do we do?', choices: OPS, answer: '+' } },
        { say: 'Work out step 1:', try: { type: 'column', a: m.a, b: m.b, op: '+' } },
        { say: `After step 1 there are <b>${fmt(s1)}</b>. Then ${fmt(m.c)} <b>leave</b>.`, show: partWhole(s1, m.c, ans, 'b'), try: { type: 'choice', q: 'Step 2: what do we do?', choices: OPS, answer: '−' } },
        { say: 'Work out step 2:', try: { type: 'column', a: s1, b: m.c, op: '−' } },
        { say: `So the answer is <b>${fmt(ans)} ${m.unit}</b>. ✔️ Check: ${fmt(ans)} + ${fmt(m.c)} = ${fmt(s1)}.`, show: big(`${fmt(m.a)} + ${fmt(m.b)} − ${fmt(m.c)} = ${fmt(ans)}`) },
        { say: 'Your turn: a whole two-step problem!', try: multiGuided(n) },
      ];
    },
    gen: (y) => multiGuided(multiStep(y)),
    word: (y) => multiGuided(multiStep(y)),
  };
  function multiGuided(m) {
    const s1 = m.a + m.b, ans = s1 - m.c;
    return { type: 'guided', q: m.q, scene: m.scene, story: true, hint: 'First add, then subtract.', steps: [`${fmt(m.a)} + ${fmt(m.b)} = ${fmt(s1)}`, `${fmt(s1)} − ${fmt(m.c)} = <b>${fmt(ans)}</b>`], parts: [
      { say: 'Step 1: what happens first?', type: 'choice', choices: OPS, answer: '+' },
      { say: `${fmt(m.a)} + ${fmt(m.b)} =`, type: 'column', a: m.a, b: m.b, op: '+' },
      { say: 'Step 2: what happens next?', type: 'choice', choices: OPS, answer: '−' },
      { say: `${fmt(s1)} − ${fmt(m.c)} =`, type: 'column', a: s1, b: m.c, op: '−' },
      { say: 'So what is the answer?', answer: ans, suffix: ' ' + m.unit }] };
  }

  /* ================================================================
   * SUBTRACTION SKILLS
   * ================================================================ */

  const takeAway = {
    id: 'take-away', title: 'Take away', years: [1, 1], icon: '🧁',
    desc: 'Start with a group, cross some out, count what is left.',
    lesson() {
      const a = rand(6, 10), b = rand(2, a - 2), e = pick(['🧁', '🍪', '🍓', '🎈']);
      const a2 = rand(5, 10), b2 = rand(1, a2 - 1);
      const a3 = rand(6, 12), b3 = rand(2, a3 - 2);
      return [
        { say: `Subtracting means <b>taking away</b>. Here are <b>${a}</b> ${e}.`, show: V.objects(a, e) },
        { say: `Oh no, <b>${b}</b> get eaten! We cross them out.`, show: V.objects(a, e, { crossed: b }), try: { q: 'How many are left?', answer: a - b, hint: 'Count the ones that are not crossed out.' } },
        { say: `We write it like this. The <b>−</b> sign means “take away”.`, show: big(`${a} − ${b} = ${a - b}`) },
        { say: 'Try another one. Count what is left.', show: V.objects(a2, '🎈', { crossed: b2 }), try: { q: `${a2} − ${b2} = ?`, answer: a2 - b2 } },
        { say: 'Your turn to do every step! 💪', try: { type: 'guided', visual: V.objects(a3, '🐟', { crossed: b3 }), parts: [
          { say: 'How many fish were there at the start? (Count all of them.)', answer: a3 },
          { say: 'How many are crossed out?', answer: b3 },
          { say: `${a3} − ${b3} = ?`, answer: a3 - b3, after: `${a3} − ${b3} = ${a3 - b3}` }] } },
      ];
    },
    gen() {
      const a = rand(3, 12), b = rand(1, a - 1);
      return { q: `${a} − ${b} = ?`, visual: V.objects(a, pick(EM), { crossed: b }), answer: a - b, hint: 'Count the ones that are not crossed out.', steps: [`Start with ${a}. Cross out ${b}.`, `${a - b} are left. ${a} − ${b} = <b>${a - b}</b>`] };
    },
    word(y) { const a = rand(5, 15), b = rand(1, a - 1); return subStory(y, a, b, 0); },
  };

  const countBack = {
    id: 'count-back', title: 'Count back on a number line', years: [1, 2], icon: '⬅️',
    desc: 'Start at the first number and hop backwards.',
    lesson(y) {
      const a = rand(8, 18), b = rand(2, 6);
      const a2 = y === 2 ? rand(23, 87) : rand(11, 18);
      const ones = a2 % 10 || 3, b2 = ones + rand(1, 5);
      return [
        { say: `To work out <b>${a} − ${b}</b> on a number line, start at ${a} and hop <b>backwards</b> (to the left).`, show: V.numberLine({ min: 0, max: 20, points: [{ v: a, label: 'start', color: '#7c3aed' }] }) },
        { say: `Hop back ${b} times: ${seq(a, b, -1).join(', ')}.`, show: V.numberLine({ min: 0, max: 20, points: [{ v: a, color: '#7c3aed' }] }), try: { q: `${a} − ${b} = ?`, answer: a - b, hint: `Count back: ${seq(a, b, -1).join(', ')}.` } },
        { say: `Each hop is <b>one less</b>. We land on ${a - b}.`, show: V.numberLine({ min: 0, max: 20, jumps: Array.from({ length: b }, (_, i) => ({ from: a - i, to: a - i - 1, label: '−1' })) }) },
        { say: `If you go past a ten, hop back <b>to the ten first</b>. ${a2} − ${b2}: ${a2} − ${ones} = ${a2 - ones}, then ${b2 - ones} more.`, show: V.jumpLine([{ from: a2, to: a2 - ones, label: '−' + ones }, { from: a2 - ones, to: a2 - b2, label: '−' + (b2 - ones) }]), try: { q: `${a2} − ${b2} = ?`, answer: a2 - b2 } },
        (() => { const p = y === 2 ? rand(31, 79) : rand(12, 19), o = p % 10 || 2, q = o + rand(1, 4); return { say: 'Your turn: back to the ten, then the rest.', try: { type: 'guided', q: `${p} − ${q} = ?`, parts: [{ say: `Hop back to the ten: ${p} − ${o} = ?`, answer: p - o }, { say: `Hop back the rest: ${p - o} − ${q - o} = ?`, answer: p - q }] } }; })(),
      ];
    },
    gen(y) {
      const a = y === 1 ? rand(5, 20) : rand(21, 99), b = y === 1 ? rand(1, Math.min(9, a - 1)) : rand(3, 9);
      return { q: `${a} − ${b} = ?`, visual: y === 1 ? V.numberLine({ min: 0, max: 20, points: [{ v: a, color: '#7c3aed' }] }) : V.numberLine({ min: a - 12, max: a + 2, step: 1, points: [{ v: a, color: '#7c3aed' }] }), answer: a - b, hint: `Start at ${a} and hop back ${b}.`, steps: [V.numberLine({ min: Math.max(0, a - b - 3), max: a + 2, jumps: [{ from: a, to: a - b, label: '−' + b }] }), `${a} − ${b} = <b>${a - b}</b>`] };
    },
  };

  /** Missing-number subtraction. pos: 'mid' (w − ? = a) or 'start' (? − b = a). w = a + b. */
  function missingSubProblem(y, { p, q, w }, pos) {
    if (pos === 'mid') {
      const eq = `${fmt(w)} − <span class="box">?</span> = ${fmt(p)}`;
      const steps = [partWhole(w, p, q, 'b'), `Turn it into adding: ${fmt(p)} + ? = ${fmt(w)}`, `${fmt(w)} − ${fmt(p)} = <b>${fmt(q)}</b>`, `Check: ${fmt(w)} − ${fmt(q)} = ${fmt(p)} ✔️`];
      if (y <= 2) return { q: eq, answer: q, hint: `Count up from ${p} to ${w}: ${p} + ? = ${w}.`, steps };
      return {
        type: 'guided', q: eq, visual: partWhole(w, p, q, 'b'), hint: 'We know the whole and one part.', steps,
        parts: [
          { say: 'Turn it into an adding question. Which one matches?', type: 'choice', choices: U.shuffle([{ v: 'a', html: `${fmt(p)} + ? = ${fmt(w)}` }, { v: 'b', html: `${fmt(w)} + ${fmt(p)} = ?` }]), answer: 'a', after: 'Taking away the box leaves the other part, so the box + the part = the whole.' },
          { say: `Find it: ${fmt(w)} − ${fmt(p)} =`, type: 'column', a: w, b: p, op: '−' },
          { say: 'So the missing number is:', answer: q, after: `${fmt(w)} − <b>${fmt(q)}</b> = ${fmt(p)} ✔️` },
        ],
      };
    }
    // ? − b = a  → the start is the whole: a + b
    const eq = `<span class="box">?</span> − ${fmt(q)} = ${fmt(p)}`;
    const steps = [partWhole(w, p, q, 'w'), `We took away ${fmt(q)} and ${fmt(p)} was left. Put them back: ${fmt(p)} + ${fmt(q)} = <b>${fmt(w)}</b>`];
    if (y <= 2) return { q: eq, answer: w, hint: `Add them back together: ${p} + ${q}.`, steps };
    return {
      type: 'guided', q: eq, visual: partWhole(w, p, q, 'w'), hint: 'The missing number is the whole we started with.', steps,
      parts: [
        { say: 'The start is missing. How do we find it?', type: 'choice', choices: U.shuffle([{ v: 'a', html: `${fmt(p)} + ${fmt(q)}` }, { v: 's', html: `${fmt(p)} − ${fmt(q)}` }]), answer: 'a', after: 'Put back what was taken away: add!' },
        { say: `${fmt(p)} + ${fmt(q)} =`, type: 'column', a: p, b: q, op: '+' },
        { say: 'So the missing number is:', answer: w, after: `<b>${fmt(w)}</b> − ${fmt(q)} = ${fmt(p)} ✔️` },
      ],
    };
  }
  const missingSub = {
    id: 'missing-sub', title: 'Missing numbers in take-aways', years: [1, 4], icon: '❓',
    desc: 'Solve 9 − ? = 4 or ? − 25 = 60 by turning it into adding.',
    lesson(y) {
      const g = mnNums(y), g2 = mnNums(y), n = mnNums(y);
      const { p, q, w } = g;
      const small = y <= 2 && w <= 30;
      return [
        { say: `In <b>${fmt(w)} − ? = ${fmt(p)}</b> we know where we start (${fmt(w)}) and what is left (${fmt(p)}). The box is how many we took away.`, show: big(`${fmt(w)} − <span class="box">?</span> = ${fmt(p)}`) + partWhole(w, p, q, 'b') },
        { say: `💡 Secret: a missing take-away can be solved by <b>adding</b>! What goes with ${fmt(p)} to make ${fmt(w)}? That is the same as <b>${fmt(p)} + ? = ${fmt(w)}</b>.`, show: small ? V.numberLine({ min: 0, max: Math.max(20, w + 1), jumps: [{ from: p, to: w, label: '+?' }] }) : big(`${fmt(p)} + <span class="box">?</span> = ${fmt(w)}`),
          try: y <= 2 ? { q: `${fmt(w)} − ? = ${fmt(p)}`, answer: q, hint: `Count up from ${p} to ${w}.` } : missingSubProblem(y, g, 'mid') },
        { say: `It's <b>${fmt(q)}</b>. Check: ${fmt(w)} − ${fmt(q)} = ${fmt(p)} ✔️`, show: partWhole(w, p, q) },
        { say: `What if the <b>start</b> is missing? <b>? − ${fmt(g2.q)} = ${fmt(g2.p)}</b>. We took away ${fmt(g2.q)} and had ${fmt(g2.p)} left. So put them back together: <b>add</b>!`, show: partWhole(g2.w, g2.p, g2.q, 'w'),
          try: missingSubProblem(y, g2, 'start') },
        { say: 'Your turn! 💪', try: missingSubProblem(y, n, pick(['mid', 'start'])) },
      ];
    },
    gen(y) { return missingSubProblem(y, mnNums(y), pick(['mid', 'start'])); },
    word(y) {
      const nm = U.name(), { p, q, w } = mnNums(y);
      return { type: 'guided', scene: '🍪', story: true, q: `${nm} baked <b>${fmt(w)}</b> cookies. After the party there were <b>${fmt(p)}</b> left. How many cookies were eaten?`, parts: [
        { say: 'Which number sentence matches the story?', type: 'choice', choices: U.shuffle([{ v: 'a', html: `${fmt(w)} − ? = ${fmt(p)}` }, { v: 'b', html: `${fmt(w)} + ${fmt(p)} = ?` }]), answer: 'a' },
        ...(y >= 3 ? [{ say: `Find it: ${fmt(w)} − ${fmt(p)} =`, type: 'column', a: w, b: p, op: '−' }] : []),
        { say: 'How many cookies were eaten?', answer: q, suffix: ' cookies' }], hint: `${fmt(p)} + ? = ${fmt(w)}`, steps: [partWhole(w, p, q, 'b'), `${fmt(w)} − ${fmt(p)} = ${fmt(q)}`] };
    },
  };

  const bondFacts = {
    id: 'bond-facts', title: 'Take-away facts from number bonds', years: [1, 1], icon: '🔗',
    desc: 'If 3 + 7 = 10, then 10 − 7 = 3 and 10 − 3 = 7.',
    lesson() {
      const p = pick([2, 3, 4, 6, 7, 8]), q = 10 - p;
      const p2 = rand(1, 9), m = rand(1, 9);
      return [
        { say: `You know the bond <b>${p} + ${q} = 10</b>. That one fact gives you take-aways for free!`, show: V.tenFrame(10, '🔴', { second: q }) },
        { say: `If we take away the ${q} blue counters, the ${p} red ones are left.`, show: V.tenFrame(p, '🔴'), try: { q: `10 − ${q} = ?`, answer: p } },
        { say: `And taking away the ${p} red ones leaves ${q}.`, try: { q: `10 − ${p} = ?`, answer: q } },
        { say: 'The three numbers make a family of facts:', show: V.chips([`${p} + ${q} = 10`, `${q} + ${p} = 10`, `10 − ${q} = ${p}`, `10 − ${p} = ${q}`]) },
        { say: `It works for 20 too: ${10 + m} + ${10 - m} = 20, so 20 − ${10 - m} = ${10 + m}.`, show: V.tenFrame(20, '🔴', { second: 10 - m }) },
        { say: 'Your turn: use a bond you know.', try: { q: `10 − ${p2} = ?`, answer: 10 - p2, hint: `${p2} + ? = 10` } },
      ];
    },
    gen() {
      const T = pick([10, 10, 20]), k = rand(T === 20 ? 1 : 1, T === 20 ? 9 : 9);
      const sub = T === 20 ? 10 - k : k;
      return { q: `${T} − ${sub} = ?`, visual: V.tenFrame(T - sub, '🔴'), answer: T - sub, hint: `Which number goes with ${sub} to make ${T}?`, steps: [`${T - sub} + ${sub} = ${T}`, `so ${T} − ${sub} = <b>${T - sub}</b>`] };
    },
  };

  const jumpBack = {
    id: 'jump-back', title: 'Subtract tens, then ones', years: [2, 2], icon: '🦘',
    desc: 'On an empty number line: jump back the tens, then the ones.',
    lesson(y) {
      const pair = () => (y === 2 ? (() => { const a = rand(45, 98); return { a, b: rand(21, a - 12) }; })() : (() => { const a = rand(240, 980); return { a, b: rand(21, 89) }; })());
      let { a, b } = pair();
      if (b % 10 === 0) b += 3;
      const T = b - (b % 10), O = b % 10;
      const j1 = { from: a, to: a - T, label: '−' + T }, j2 = { from: a - T, to: a - b, label: '−' + O };
      const line = (js) => V.numberLine({ min: a - b - 4, max: a + 4, empty: true, marks: [a], jumps: js, points: js.length ? [] : [{ v: a, label: fmt(a), color: '#7c3aed' }] });
      const n = pair();
      return [
        { say: `To work out <b>${a} − ${b}</b>, start at ${a} on an empty number line. We will jump <b>backwards</b>.`, show: line([]) },
        { say: `Split ${b} into tens and ones: ${b} = ${T} + ${O}.`, try: { q: `${b} = ${T} + ?`, answer: O } },
        { say: `<b>Big jump back:</b> take away the ${T}. (Count back in tens.)`, show: line([]), try: { q: `${a} − ${T} = ?`, answer: a - T, hint: 'The tens digit goes down.' } },
        { say: `We are on <b>${a - T}</b>. <b>Small jump back:</b> take away the ${O} ones.`, show: line([j1]), try: { q: `${a - T} − ${O} = ?`, answer: a - b } },
        { say: `We land on <b>${a - b}</b>, so ${a} − ${b} = ${a - b}. ✔️ Check: ${a - b} + ${b} = ${a}.`, show: line([j1, j2]) },
        { say: 'Your turn: tens first, then ones.', try: jumpBackGuided(n.a, n.b % 10 === 0 ? n.b + 3 : n.b) },
      ];
    },
    gen(y) {
      const a = y === 2 ? rand(35, 99) : rand(150, 990);
      let b = rand(21, y === 2 ? a - 10 : 89);
      if (b % 10 === 0) b += 1;
      if (Math.random() < 0.6) return jumpBackGuided(a, b);
      return { q: `${a} − ${b} = ?`, answer: a - b, visual: V.numberLine({ min: a - b - 4, max: a + 4, empty: true, marks: [a] }), hint: 'Tens first, then ones.', steps: [V.jumpLine(V.splitJumps(a, b, -1)), `${a} − ${b} = <b>${a - b}</b>`] };
    },
    word(y) { const a = y === 2 ? rand(40, 99) : rand(150, 900), b = rand(21, y === 2 ? a - 10 : 89); return subStory(2, a, b, 0); },
  };
  function jumpBackGuided(a, b) {
    const T = b - (b % 10), O = b % 10;
    return { type: 'guided', q: `${a} − ${b} = ?`, visual: V.numberLine({ min: a - b - 4, max: a + 4, empty: true, marks: [a] }), hint: `Split ${b} into ${T} and ${O}.`, steps: [V.jumpLine(V.splitJumps(a, b, -1))], parts: [
      { say: `Jump back the tens: ${a} − ${T} = ?`, answer: a - T },
      { say: `Jump back the ones: ${a - T} − ${O} = ?`, answer: a - b, after: V.jumpLine(V.splitJumps(a, b, -1)) }] };
  }

  /** Two numbers close together that cross a ten, e.g. 47 and 52. */
  function closePair(y) {
    for (;;) {
      const b = y <= 2 ? rand(13, 86) : y === 3 ? rand(103, 985) : rand(1003, 9985);
      if (b % 10 === 0) continue;
      const T = Math.ceil(b / 10) * 10;
      const a = T + rand(1, y <= 2 ? 9 : 25);
      return { a, b, T };
    }
  }
  const countUpLine = (b, a, T, jumps) => V.numberLine({ min: b - 2, max: a + 2, empty: true, marks: [b, a, T].filter((v, i) => i < 2 || jumps >= 1), jumps: [
    ...(jumps >= 1 ? [{ from: b, to: T, label: '+' + (T - b) }] : []),
    ...(jumps >= 2 ? [{ from: T, to: a, label: '+' + (a - T) }] : []),
  ], points: jumps === 0 ? [{ v: b, color: '#ea580c' }, { v: a, color: '#16a34a' }] : [] });
  function countUpGuided(a, b, T) {
    return {
      type: 'guided', q: `${fmt(a)} − ${fmt(b)} = ?`, visual: countUpLine(b, a, T, 0), hint: `Count up from ${fmt(b)} to ${fmt(a)}.`,
      parts: [
        { say: `Jump from <b>${fmt(b)}</b> to the next ten, <b>${fmt(T)}</b>. How many jumps?`, answer: T - b, after: `${fmt(b)} + ${T - b} = ${fmt(T)}` },
        { say: `Now jump from <b>${fmt(T)}</b> to <b>${fmt(a)}</b>. How many?`, answer: a - T, after: `${fmt(T)} + ${a - T} = ${fmt(a)}` },
        { say: `Add the jumps: ${T - b} + ${a - T} = ?`, answer: a - b, after: `So ${fmt(a)} − ${fmt(b)} = <b>${fmt(a - b)}</b>` },
      ],
      steps: [countUpLine(b, a, T, 2), `${T - b} + ${a - T} = <b>${a - b}</b>`],
    };
  }
  const countUp = {
    id: 'count-up', title: 'Find the difference by counting up', years: [2, 2], icon: '🪜',
    desc: 'When two numbers are close, jump up to the next ten, then on.',
    lesson(y) {
      const { a, b, T } = closePair(y);
      const hops = [];
      for (let v = b + 1; v <= T; v++) hops.push(v);
      const n = closePair(y);
      return [
        { say: `Look at <b>${fmt(a)} − ${fmt(b)}</b>. The two numbers are <b>very close</b> together on the number line! Taking away ${fmt(b)} would be a lot of work…`, show: countUpLine(b, a, T, 0) },
        { say: `Here is a trick: <b>count UP</b> from the small number to the big number. How far apart they are is the answer! 💡 It is like asking: “I have ${fmt(b)}. How many more do I need to get ${fmt(a)}?”`, show: big(`${fmt(b)} + <span class="box">?</span> = ${fmt(a)}`) },
        { say: `<b>Step 1:</b> jump from ${fmt(b)} to the <b>next ten</b>. The next ten after ${fmt(b)} is <b>${fmt(T)}</b>. Count the hops: ${hops.map((v) => fmt(v)).join(', ')}.`, show: countUpLine(b, a, T, 0), try: { q: `How many jumps from ${fmt(b)} to ${fmt(T)}?`, answer: T - b, hint: `Count on from ${fmt(b)}: ${hops.map((v) => fmt(v)).join(', ')}.` } },
        { say: `Yes, <b>${T - b}</b>! Here is the first jump on the line. <b>Step 2:</b> now jump from <b>${fmt(T)}</b> to <b>${fmt(a)}</b>.`, show: countUpLine(b, a, T, 1), try: { q: `How many from ${fmt(T)} to ${fmt(a)}?`, answer: a - T, hint: `${fmt(T)} + ? = ${fmt(a)}` } },
        { say: '<b>Step 3:</b> add up the jumps to find how far we travelled.', show: countUpLine(b, a, T, 2), try: { q: `${T - b} + ${a - T} = ?`, answer: a - b } },
        { say: `So the difference is <b>${a - b}</b>: <span class="say-big">${fmt(a)} − ${fmt(b)} = ${a - b}</span>✔️ Check by adding: ${fmt(b)} + ${a - b} = ${fmt(a)}.`, show: countUpLine(b, a, T, 2) },
        { say: 'Now you do all the steps! 💪', try: countUpGuided(n.a, n.b, n.T) },
      ];
    },
    gen(y) {
      const { a, b, T } = closePair(y);
      if (Math.random() < 0.6) return countUpGuided(a, b, T);
      return { q: `${fmt(a)} − ${fmt(b)} = ?`, visual: countUpLine(b, a, T, 0), answer: a - b, hint: `Jump to ${fmt(T)} first.`, steps: [countUpLine(b, a, T, 2), `${T - b} + ${a - T} = <b>${a - b}</b>`] };
    },
    word(y) {
      const { a, b, T } = closePair(y);
      const g = countUpGuided(a, b, T);
      const yr = y <= 2 ? 2000 + rand(10, 25) : null;
      g.q = yr ? `${U.name()} is reading a book with <b>${a}</b> pages and is on page <b>${b}</b>. How many pages are left?` : `A school has <b>${fmt(a)}</b> pupils. <b>${fmt(b)}</b> of them are in the hall. How many are <b>not</b> in the hall?`;
      g.scene = yr ? '📖' : '🏫';
      g.story = true;
      return g;
    },
  };

  const factFamily = {
    id: 'fact-family', title: 'Fact families: check with adding', years: [2, 2], icon: '👨‍👩‍👧',
    desc: 'Three numbers give four facts. Use adding to check a take-away.',
    lesson() {
      const a = rand(14, 60), b = rand(5, a - 5), c = a - b;
      const n = rand(20, 80), m = rand(6, n - 6);
      return [
        { say: `Three numbers that fit together make a <b>fact family</b>: ${b}, ${c} and ${a}. The whole is ${a}; the parts are ${b} and ${c}.`, show: partWhole(a, b, c) },
        { say: 'From one bar model we can write <b>four</b> facts: two adds and two take-aways.', show: V.chips([`${b} + ${c} = ${a}`, `${c} + ${b} = ${a}`, `${a} − ${b} = ${c}`, `${a} − ${c} = ${b}`]) },
        { say: `If you know ${b} + ${c} = ${a}, what is ${a} − ${c}?`, try: { q: `${a} − ${c} = ?`, answer: b, hint: 'Look at the bar model.' } },
        { say: `To <b>check</b> a take-away, add the answer back on. ${U.name()} says ${n} − ${m} = ${n - m}. Check: ${n - m} + ${m} = ?`, try: { q: `${n - m} + ${m} = ?`, answer: n, after: '' } },
        { say: `We got back to ${n}, so the take-away was right ✔️.`, show: partWhole(n, n - m, m) },
        (() => { const w = rand(20, 70), p = rand(5, w - 5); return { say: 'Your turn: complete the family.', try: { type: 'guided', visual: partWhole(w, p, w - p, 'b'), parts: [{ say: `${w} − ${p} = ?`, answer: w - p }, { say: `${p} + ${w - p} = ?`, answer: w }, { say: `${w} − ${w - p} = ?`, answer: p }] } }; })(),
      ];
    },
    gen() {
      const a = rand(15, 90), b = rand(5, a - 5), c = a - b;
      const k = rand(0, 2);
      if (k === 0) return { q: `${b} + ${c} = ${a}, so ${a} − ${b} = ?`, visual: partWhole(a, b, c, 'b'), answer: c, hint: 'Use the addition fact.', steps: [`${a} − ${b} = <b>${c}</b>`] };
      if (k === 1) return { q: `${a} − ${c} = ?`, visual: partWhole(a, b, c, 'a'), answer: b, hint: 'Look at the bar model.', steps: [`${b} + ${c} = ${a}, so ${a} − ${c} = <b>${b}</b>`] };
      const right = Math.random() < 0.5, shown = right ? c : c + pick([1, 10, -1]);
      return { type: 'guided', q: `Is ${a} − ${b} = <b>${shown}</b> right? Check by adding.`, parts: [{ say: `${shown} + ${b} = ?`, answer: shown + b }, { say: `Is that ${a}?`, type: 'choice', choices: [{ v: 'y', html: 'Yes, right ✔️' }, { v: 'n', html: 'No, wrong ✖️' }], answer: right ? 'y' : 'n' }], steps: [`${shown} + ${b} = ${shown + b}`] };
    },
  };

  const colSubSimple = {
    id: 'column-sub-simple', title: 'Column subtraction (no exchanging)', years: [3, 3], icon: '📝',
    desc: 'Line up the digits and take away each column, starting with the ones.',
    lesson() {
      const { a, b } = noExchangePair(3);
      const n = noExchangePair(3);
      return [
        { say: `To work out <b>${fmt(a)} − ${fmt(b)}</b>, write the <b>bigger number on top</b>. Line up hundreds, tens and ones.`, show: V.pvTable(a) + V.pvTable(b) },
        { say: 'Start on the <b>right</b> with the ones. In each column take the bottom digit away from the top digit.', show: colShow(a, b, '−', 0, 0, 0) },
        ...subColumnFrames(a, b),
        { say: `Done! <span class="say-big">${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}</span> ✔️ Check: ${fmt(a - b)} + ${fmt(b)} = ${fmt(a)}.`, show: colShow(a, b, '−', 0) },
        { say: 'Your turn! The helper asks you about each column.', try: { type: 'column', a: n.a, b: n.b, op: '−' } },
      ];
    },
    gen() {
      const { a, b } = noExchangePair(3);
      return { type: 'column', q: `Work out ${fmt(a)} − ${fmt(b)}`, a, b, op: '−', hint: 'Start with the ones.', steps: V.columnMethod(a, b, '−').steps };
    },
    word() { const { a, b } = noExchangePair(3); return subStory(3, a, b, 0); },
  };

  const columnSub = {
    id: 'column-sub', title: 'Column subtraction with exchanging', years: [3, 6], icon: '🔁',
    desc: 'When the top digit is too small, exchange 1 from the next column.',
    lesson(y) {
      const { a, b } = exchangePair(y);
      const n = exchangePair(y);
      return [
        { say: `Let's work out <b>${fmt(a)} − ${fmt(b)}</b>. Bigger number on top, digits lined up.`, show: colShow(a, b, '−', 0, 0, 0) },
        { say: 'Sometimes the top digit is <b>smaller</b> than the bottom one. Then we <b>exchange</b>: we swap 1 from the column on the left for 10 in our column. The number stays the same — just like swapping a 10 coin for ten 1 coins!', show: `<div class="demo-row">${V.base10(10)}<b>=</b>${V.objects(10, '🟨', { perRow: 10 })}</div>` },
        ...subColumnFrames(a, b),
        { say: `Finished! <span class="say-big">${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}</span> ✔️ Check by adding: ${fmt(a - b)} + ${fmt(b)} = ${fmt(a)}. And the estimate ${fmt(estR(a))} − ${fmt(estR(b))} = ${fmt(estR(a) - estR(b))} is close too.`, show: colShow(a, b, '−', 0) },
        { say: 'Your turn! Estimate first (nearest 10). Then answer “Is it big enough?”, click the digit to exchange, and take away.', try: estColumn(n.a, n.b, '−') },
      ];
    },
    gen(y) {
      const { a, b } = Math.random() < 0.8 ? exchangePair(y) : subNums(Math.max(3, y));
      if (Math.random() < 0.5) return estColumn(a, b, '−');
      return { type: 'column', q: `Work out ${fmt(a)} − ${fmt(b)}`, a, b, op: '−', hint: 'If the top digit is too small, exchange from the next column.', steps: V.columnMethod(a, b, '−').steps };
    },
    word(y) { const { a, b } = subNums(Math.max(3, y)); return subStory(y, a, b, 0); },
  };

  const zeros = {
    id: 'zeros', title: 'Subtracting from numbers with zeros', years: [4, 6], icon: '0️⃣',
    desc: 'Exchange across zeros — or use the clever “take 1 from both” trick.',
    lesson(y) {
      const { a, b } = zeroPair(y);
      const n = zeroPair(y);
      return [
        { say: `<b>${fmt(a)} − ${fmt(b)}</b> looks scary: the top number has lots of <b>zeros</b>! A zero has nothing to give when we need to exchange.`, show: colShow(a, b, '−', 0, 0, 0) },
        { say: 'When the next column is 0, we keep going left until we find a digit that can give. Watch carefully!', show: '' },
        ...subColumnFrames(a, b),
        { say: `So ${fmt(a)} − ${fmt(b)} = <b>${fmt(a - b)}</b>. ✔️`, show: colShow(a, b, '−', 0) },
        { say: `💡 <b>Clever trick:</b> take 1 away from <b>both</b> numbers. The difference stays the same! ${fmt(a)} − ${fmt(b)} is the same as <b>${fmt(a - 1)} − ${fmt(b - 1)}</b> — and now no exchanging is needed${a % 10 === 0 ? ' (all those 9s are big enough)' : ''}.`, show: V.numberLine({ min: b - 3, max: a + 2, empty: true, marks: [b - 1, b, a - 1, a] }) + big(`${fmt(a)} − ${fmt(b)} = ${fmt(a - 1)} − ${fmt(b - 1)}`), try: { q: `${fmt(a)} − 1 = ?`, answer: a - 1 } },
        { say: 'Your turn: use whichever way you like! (The boxes use exchanging.)', try: { type: 'column', a: n.a, b: n.b, op: '−' } },
      ];
    },
    gen(y) {
      const { a, b } = zeroPair(y);
      if (a % 10 === 0 && Math.random() < 0.4) {
        return { type: 'guided', q: `Work out ${fmt(a)} − ${fmt(b)} using the “take 1 from both” trick.`, hint: 'Take 1 from both numbers.', steps: [`${fmt(a - 1)} − ${fmt(b - 1)} = ${fmt(a - b)}`], parts: [
          { say: `${fmt(a)} − 1 = ?`, answer: a - 1 }, { say: `${fmt(b)} − 1 = ?`, answer: b - 1 },
          { say: `Now ${fmt(a - 1)} − ${fmt(b - 1)} (no exchanging needed!):`, type: 'column', a: a - 1, b: b - 1, op: '−' }] };
      }
      return { type: 'column', q: `Work out ${fmt(a)} − ${fmt(b)}`, a, b, op: '−', hint: 'A 0 has nothing to give — exchange from further left.', steps: V.columnMethod(a, b, '−').steps };
    },
    word(y) { const { a, b } = zeroPair(y); return subStory(y, a, b, 0); },
  };

  const decimalSub = {
    id: 'decimal-sub', title: 'Subtract decimals in columns', years: [5, 6], icon: '🔢',
    desc: 'Line up the points, fill gaps with zeros, then exchange as usual.',
    lesson(y) {
      const { a, b, dp } = decPair(y, '−');
      const n = decPair(y, '−');
      return [
        { say: `To work out <b>${fmt(a)} − ${fmt(b)}</b>, line up the <b>decimal points</b>.`, show: big(`${fmt(a)} − ${fmt(b)}`) },
        { say: `Give both numbers the same number of decimal places. ${fmt(a)} = <b>${a.toFixed(dp)}</b>. That extra 0 is important — we may need to exchange into it!`, show: colShow(a, b, '−', dp, 0, 0) },
        ...subColumnFrames(a, b, dp),
        { say: `Put the point in the answer under the others: <span class="say-big">${a.toFixed(dp)} − ${b.toFixed(dp)} = ${(a - b).toFixed(dp)}</span>`, show: colShow(a, b, '−', dp) },
        { say: 'Your turn!', try: { type: 'column', a: n.a, b: n.b, op: '−', dp: n.dp } },
      ];
    },
    gen(y) {
      const { a, b, dp } = decPair(y, '−');
      return { type: 'column', q: `Work out ${fmt(a)} − ${fmt(b)}`, a, b, op: '−', dp, hint: 'Line up the decimal points and fill gaps with 0.', steps: V.columnMethod(a, b, '−', { dp }).steps };
    },
    word(y) {
      const { a, b, dp } = decPair(y, '−');
      const [tpl, unit, scene] = pick([
        [(x, z) => `A ribbon is <b>${x}</b> m long. <b>${z}</b> m is cut off. How much ribbon is left?`, 'm', '🎀'],
        [(x, z, n) => `${n} has <b>${x}</b> litres of water and drinks <b>${z}</b> litres. How much is left?`, 'litres', '💧'],
        [(x, z) => `A parcel weighs <b>${x}</b> kg. The box weighs <b>${z}</b> kg. How much do the things inside weigh?`, 'kg', '📦'],
      ]);
      return wordProblem({ q: tpl(fmt(a), fmt(b), U.name()), unit, scene, a, b, op: '−', y, dp });
    },
  };

  const estimateSub = {
    id: 'estimate-sub', title: 'Estimate before you subtract', years: [3, 6], icon: '🎯',
    desc: 'Round both numbers to get a rough answer, then check.',
    lesson: (y) => estimateLesson(y, '−'), gen: (y) => estimateGen(y, '−'),
  };

  function diffProblem(y) {
    const { a, b } = subNums(Math.max(3, y));
    const [n, m] = U.twoNames();
    const ctx = pick([
      { q: `${n} scored <b>${fmt(a)}</b> points in a game. ${m} scored <b>${fmt(b)}</b>. How many <b>more</b> points did ${n} score?`, unit: 'points', scene: '🎮', la: n, lb: m },
      { q: `Mount Tall is <b>${fmt(a)}</b> m high. Mount Small is <b>${fmt(b)}</b> m high. What is the <b>difference</b> in height?`, unit: 'm', scene: '⛰️', la: 'Tall', lb: 'Small' },
      { q: `Town A has <b>${fmt(a)}</b> people. Town B has <b>${fmt(b)}</b>. How many <b>fewer</b> people live in Town B?`, unit: 'people', scene: '🏘️', la: 'Town A', lb: 'Town B' },
    ]);
    return { a, b, ...ctx };
  }
  function diffGuided(y, d) {
    const p = wordProblem({ q: d.q, unit: d.unit, scene: d.scene, a: d.a, b: d.b, op: '−', y, why: '“How many more”, “fewer” and “difference” mean we compare — we <b>subtract</b>.' });
    p.visual = compareBars(d.a, d.b, d.la, d.lb);
    return p;
  }
  const difference = {
    id: 'difference', title: '“How many more?” problems', years: [3, 6], icon: '⚖️',
    desc: 'Compare two amounts with a bar model, then subtract.',
    lesson(y) {
      const d = diffProblem(y);
      const n = diffProblem(y);
      return [
        { say: 'Read this problem carefully. Look for the <b>key words</b>.', show: `<div class="qtext story">${d.q}</div>` },
        { say: `“How many more”, “how many fewer” and “difference” all mean: <b>compare</b> two amounts. Draw them as two bars. The gap at the end is what we want.`, show: compareBars(d.a, d.b, d.la, d.lb), try: { type: 'choice', q: 'Which calculation finds the gap?', choices: [{ v: 's', html: `${fmt(d.a)} − ${fmt(d.b)}` }, { v: 'a', html: `${fmt(d.a)} + ${fmt(d.b)}` }], answer: 's' } },
        { say: 'Before calculating, estimate! Round each number to the nearest 10.', try: { type: 'guided', parts: estParts(d.a, d.b, '−').parts } },
        { say: 'Now calculate exactly with the column method:', try: { type: 'column', a: d.a, b: d.b, op: '−' } },
        { say: `The difference is <b>${fmt(d.a - d.b)} ${d.unit}</b>. Always finish with a sentence that answers the question!`, show: big(`${fmt(d.a)} − ${fmt(d.b)} = ${fmt(d.a - d.b)}`) },
        { say: 'Your turn: a whole problem in steps.', try: diffGuided(y, n) },
      ];
    },
    gen: (y) => diffGuided(y, diffProblem(y)),
    word: (y) => diffGuided(y, diffProblem(y)),
  };

  /* ---------------- compare with <, > and = ---------------- */
  const SIGNS = [{ v: '<', html: '<span class="sign">&lt;</span>' }, { v: '=', html: '<span class="sign">=</span>' }, { v: '>', html: '<span class="sign">&gt;</span>' }];
  const signOf = (x, z) => (x < z ? '<' : x > z ? '>' : '=');
  const signHTML = (s) => (s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=');
  /** A random expression worth v: v, a + b or a − b (numbers scale with the year). */
  function exprFor(v, y) {
    const r = Math.random();
    const step = y <= 2 ? 1 : y === 3 ? 10 : 100;
    if (r < 0.3 || v < 2 * step) return { txt: fmt(v), v };
    if (r < 0.65) { const a = rand(1, Math.floor(v / step) - 1) * step; return { txt: `${fmt(a)} + ${fmt(v - a)}`, v }; }
    const b = rand(1, y <= 2 ? 9 : 9) * step; return { txt: `${fmt(v + b)} − ${fmt(b)}`, v };
  }
  function compareProblem(y) {
    const lim = y === 1 ? 20 : y === 2 ? 100 : y === 3 ? 1000 : 10000;
    const step = y <= 2 ? 1 : y === 3 ? 10 : 100;
    const L = rand(Math.ceil((lim * 0.2) / step), Math.floor((lim * 0.8) / step)) * step;
    const d = pick([0, step, -step, 2 * step, -2 * step, 5 * step, -3 * step]);
    const R = Math.max(step, L + d);
    let left = exprFor(L, y), right = exprFor(R, y);
    if (left.txt === fmt(L) && right.txt === fmt(R) && Math.random() < 0.7) left = exprFor(L, y); // prefer at least one sum
    if (Math.random() < 0.15 && L > 2 * step) { // turnaround: a + b ○ b + a
      const a = rand(1, Math.floor(L / step) - 1) * step;
      left = { txt: `${fmt(a)} + ${fmt(L - a)}`, v: L }; right = { txt: `${fmt(L - a)} + ${fmt(a)}`, v: L };
    }
    const s = signOf(left.v, right.v);
    return {
      type: 'choice', q: `${left.txt} <span class="box">?</span> ${right.txt}`, choices: SIGNS, answer: s,
      hint: 'Work out each side first. The crocodile’s mouth opens towards the bigger number.',
      steps: [`Left side: ${left.txt} = <b>${fmt(left.v)}</b>`, `Right side: ${right.txt} = <b>${fmt(right.v)}</b>`, `${fmt(left.v)} ${signHTML(s)} ${fmt(right.v)}, so <b>${left.txt} ${signHTML(s)} ${right.txt}</b>`],
    };
  }
  const compareSigns = {
    id: 'compare-signs', title: 'Compare with <, > and =', years: [1, 4], icon: '🐊',
    desc: 'Work out each side, then choose the sign. The crocodile eats the bigger number!',
    lesson(y) {
      const s = y <= 2 ? 1 : y === 3 ? 10 : 100;
      const a = rand(3, 9) * s, b = a + rand(2, 6) * s;
      const x = rand(2, 7) * s, z = rand(2, 7) * s, tot = x + z;
      const n = compareProblem(y);
      return [
        { say: 'Meet the hungry crocodile 🐊! Its mouth always opens towards the <b>bigger</b> number, because it wants to eat the most.', show: big(`${fmt(b)} &gt; ${fmt(a)} &nbsp; · &nbsp; ${fmt(a)} &lt; ${fmt(b)}`) },
        { say: '<b>&gt;</b> means “is greater than”. <b>&lt;</b> means “is less than”. <b>=</b> means “is equal to”: both sides are worth the same.', show: V.chips([`${fmt(b)} > ${fmt(a)}`, `${fmt(a)} < ${fmt(b)}`, `${fmt(a)} = ${fmt(a)}`]),
          try: { type: 'choice', q: `${fmt(a)} <span class="box">?</span> ${fmt(b)}`, choices: SIGNS, answer: '<', hint: `${fmt(b)} is bigger. Open the mouth towards it.` } },
        { say: `When a side has a sum, <b>work it out first</b>. ${fmt(x)} + ${fmt(z)} ○ ${fmt(tot - s)}: the left side is ${fmt(x)} + ${fmt(z)} = ?`, show: big(`${fmt(x)} + ${fmt(z)} <span class="box">?</span> ${fmt(tot - s)}`), try: { q: `${fmt(x)} + ${fmt(z)} = ?`, answer: tot } },
        { say: `So we compare ${fmt(tot)} with ${fmt(tot - s)}.`, try: { type: 'choice', q: `${fmt(x)} + ${fmt(z)} <span class="box">?</span> ${fmt(tot - s)}`, choices: SIGNS, answer: '>', hint: `${fmt(tot)} ○ ${fmt(tot - s)}` } },
        { say: `Sometimes both sides are worth the same: ${fmt(x)} + ${fmt(z)} and ${fmt(z)} + ${fmt(x)} both make ${fmt(tot)}. Then we use <b>=</b>.`, show: big(`${fmt(x)} + ${fmt(z)} = ${fmt(z)} + ${fmt(x)}`) },
        { say: 'Your turn! Work out each side, then choose the sign.', try: n },
      ];
    },
    gen: (y) => compareProblem(y),
  };

  /* ---------------- order and grouping (commutative and associative) ---------------- */
  function make10Triple(y) {
    const s = y <= 2 ? 1 : y === 3 ? 10 : 100, T = 10 * s;
    const a = rand(1, 9) * s, b = T - a;
    let c = rand(2, 9) * s + (y >= 3 ? rand(1, 9) * (s / 10) : 0);
    if (c === a || c === b) c += s;
    const order = U.shuffle([a, b, c]);
    return { a, b, c, T, order };
  }
  function make10Guided(y) {
    const { a, b, c, T, order } = make10Triple(y);
    return {
      type: 'guided', q: `${order.map(fmt).join(' + ')} = ?`, hint: `Find two numbers that make ${fmt(T)}.`,
      parts: [
        { say: `Which two numbers make <b>${fmt(T)}</b>? Add them first.`, type: 'choice', choices: U.shuffle([{ v: 'ab', html: `${fmt(a)} and ${fmt(b)}` }, { v: 'ac', html: `${fmt(a)} and ${fmt(c)}` }, { v: 'bc', html: `${fmt(b)} and ${fmt(c)}` }]), answer: 'ab', after: `${fmt(a)} + ${fmt(b)} = ${fmt(T)}` },
        { say: `Now ${fmt(T)} + ${fmt(c)} = ?`, answer: T + c, after: `(${fmt(a)} + ${fmt(b)}) + ${fmt(c)} = ${fmt(T + c)}` },
      ],
      steps: [`(${fmt(a)} + ${fmt(b)}) + ${fmt(c)} = ${fmt(T)} + ${fmt(c)} = <b>${fmt(T + c)}</b>`],
    };
  }
  function orderProblem(y) {
    const s = y <= 2 ? 1 : y === 3 ? 10 : 100;
    const lim = y === 1 ? 10 : y === 2 ? 50 : y === 3 ? 500 : 5000;
    const a = rand(2, Math.floor(lim / s)) * s + (y >= 2 ? rand(0, 9) : 0), b = rand(2, Math.floor(lim / s)) * s + (y >= 2 ? rand(1, 9) : 0);
    const r = Math.random();
    if (r < 0.3) return { q: `${fmt(a)} + ${fmt(b)} = ${fmt(b)} + <span class="box">?</span>`, answer: a, hint: 'Swapping the numbers in an addition does not change the total.', steps: [`${fmt(a)} + ${fmt(b)} = ${fmt(b)} + <b>${fmt(a)}</b> (both make ${fmt(a + b)})`] };
    if (r < 0.5) {
      const hi = Math.max(a, b), lo = Math.min(a, b);
      if (hi === lo) return orderProblem(y);
      return { type: 'choice', q: `Is <b>${fmt(hi)} − ${fmt(lo)}</b> the same as <b>${fmt(lo)} − ${fmt(hi)}</b>?`, choices: [{ v: 'y', html: 'Yes, the same' }, { v: 'n', html: 'No, different' }], answer: 'n', hint: 'Can you take a big number away from a small one?', steps: [`${fmt(hi)} − ${fmt(lo)} = ${fmt(hi - lo)}`, `${fmt(lo)} − ${fmt(hi)}: you can't take ${fmt(hi)} away from ${fmt(lo)} and get the same answer. In subtraction, <b>order matters</b>!`] };
    }
    if (r < 0.75) {
      const opts = U.shuffle([{ v: 'ba', html: `${fmt(b)} + ${fmt(a)}` }, { v: 'bma', html: `${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))}` }, { v: 'x', html: `${fmt(a)} + ${fmt(b + s)}` }]);
      return { type: 'choice', q: `Which is the same as <b>${fmt(a)} + ${fmt(b)}</b>?`, choices: opts, answer: 'ba', hint: 'Swap the two numbers round.', steps: [`${fmt(a)} + ${fmt(b)} = ${fmt(b)} + ${fmt(a)} = ${fmt(a + b)}`] };
    }
    return make10Guided(y);
  }
  const orderGrouping = {
    id: 'order-grouping', title: 'Order and grouping in adding', years: [1, 4], icon: '🔀',
    desc: 'Swap numbers round, and group them to make 10 first. (Not for take-aways!)',
    lesson(y) {
      const s = y <= 2 ? 1 : y === 3 ? 10 : 100;
      const a = rand(2, 5), b = rand(6, 9);
      const A = a * s, B = b * s;
      const t = make10Triple(y);
      return [
        { say: `Look: ${a} 🍎 and ${b} 🍐 — or ${b} 🍐 and ${a} 🍎. Same fruit, same total! In an addition you can <b>swap the numbers round</b>.`, show: `<div class="obj-sum">${V.objects(a, '🍎')}<span class="op">+</span>${V.objects(b, '🍐')}</div><div class="obj-sum">${V.objects(b, '🍐')}<span class="op">+</span>${V.objects(a, '🍎')}</div>` + big(`${a} + ${b} = ${b} + ${a} = ${a + b}`),
          try: { q: `${fmt(A)} + ${fmt(B)} = ${fmt(B)} + ?`, answer: A, hint: 'Swap them round.' } },
        { say: `This is handy: start with the <b>bigger</b> number, it is quicker to count on. ${fmt(A)} + ${fmt(B)} → ${fmt(B)} + ${fmt(A)}.`, try: { q: `${fmt(A)} + ${fmt(B)} = ?`, answer: A + B, hint: `Start at ${fmt(B)} and count on ${fmt(A)}.` } },
        { say: `⚠️ But <b>not</b> in a take-away! ${fmt(B)} − ${fmt(A)} = ${fmt(B - A)}. If you have ${fmt(A)} sweets, you can't give away ${fmt(B)}. So ${fmt(A)} − ${fmt(B)} is <b>not</b> the same.`, show: V.objects(b, '🍬', { crossed: a }),
          try: { type: 'choice', q: `Is ${fmt(B)} − ${fmt(A)} the same as ${fmt(A)} − ${fmt(B)}?`, choices: [{ v: 'y', html: 'Yes' }, { v: 'n', html: 'No' }], answer: 'n' } },
        { say: `With <b>three</b> numbers we can choose which two to add first. Brackets ( ) mean “do this first”. (${fmt(t.a)} + ${fmt(t.b)}) + ${fmt(t.c)} gives the same answer as ${fmt(t.a)} + (${fmt(t.b)} + ${fmt(t.c)}).`, show: big(`(${fmt(t.a)} + ${fmt(t.b)}) + ${fmt(t.c)} = ${fmt(t.a)} + (${fmt(t.b)} + ${fmt(t.c)})`),
          try: { type: 'guided', parts: [{ say: `(${fmt(t.a)} + ${fmt(t.b)}) first:`, answer: t.T }, { say: `${fmt(t.T)} + ${fmt(t.c)} =`, answer: t.T + t.c, after: 'Grouping the ' + fmt(t.T) + ' first made it easy!' }] } },
        { say: `So look for numbers that make <b>${fmt(10 * s)}</b> and add them first. Your turn!`, try: make10Guided(y) },
      ];
    },
    gen: (y) => orderProblem(y),
  };

  /* ---------------- explorer ---------------- */
  function explorer(root, y, op) {
    const max = y === 1 ? 20 : y === 2 ? 100 : 1000;
    const sign = op === '+' ? 1 : -1;
    let a = y === 1 ? 6 : y === 2 ? 47 : 368;
    let b = y === 1 ? 3 : y === 2 ? 25 : 157;
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">${y >= 3 ? 'Move the sliders and watch the column method change, digit by digit.' : op === '+' ? 'Move the sliders and watch the jumps on the number line.' : 'Move the sliders. Watch how we jump backwards.'}</p>
        <div class="ex-controls">
          <label>First number <input type="range" id="exA" min="${op === '+' ? 0 : 1}" max="${max}" value="${a}"><output id="oA"></output></label>
          <label>${op === '+' ? 'Add' : 'Take away'} <input type="range" id="exB" min="0" max="${max}" value="${b}"><output id="oB"></output></label>
        </div>
        <div class="ex-stage" id="stage"></div>
      </div>`;
    const sA = root.querySelector('#exA'), sB = root.querySelector('#exB'), stage = root.querySelector('#stage');
    function draw() {
      a = +sA.value; b = +sB.value;
      if (op !== '+' && b > a) { b = a; sB.value = b; }
      root.querySelector('#oA').textContent = a;
      root.querySelector('#oB').textContent = b;
      const r = a + sign * b;
      let vis;
      if (y === 1) {
        vis = (op === '+' ? objSum(a, b, '🐞') : V.objects(a, '🐞', { crossed: b })) +
          V.numberLine({ min: 0, max: Math.max(20, a + b), jumps: b ? [{ from: a, to: r, label: (op === '+' ? '+' : '−') + b }] : [] });
      } else {
        vis = (y === 2 && op === '+' && a + b < 1000 ? `<div class="row-center">${V.base10(a)}<span class="op">+</span>${V.base10(b)}</div>` : '') +
          (b && y === 2 ? V.jumpLine(V.splitJumps(a, b, sign)) : '') +
          (y >= 3 && b ? `<div class="row-center" id="colx">${V.columnMethod(a, b, op, { blank: true }).html}</div>` : '');
      }
      stage.innerHTML = `<div class="ex-eq">${fmt(a)} ${op} ${fmt(b)} = <button class="reveal" id="rv">?</button></div>${vis}`;
      const rv = stage.querySelector('#rv');
      rv.onclick = () => {
        rv.textContent = fmt(r); rv.classList.add('shown'); U.sound('ok');
        const cx = stage.querySelector('#colx');
        if (cx) cx.innerHTML = V.columnMethod(a, b, op).html;
      };
    }
    sA.oninput = draw; sB.oninput = draw;
    draw();
  }

  /* ---------------- topics ---------------- */
  TOPICS.push({
    id: 'addition', name: 'Addition', icon: '➕', color: '#22c55e', minYear: 1,
    tagline: 'Putting numbers together',
    explore: (root, y) => explorer(root, y, '+'),
    skills: [countOn, bonds, missingAdd, orderGrouping, compareSigns, doubles, bridge10, addThree, partitionAdd, lineAdd, colAddSimple, columnAdd, add9, estimateAdd, decimalAdd, inverseAdd, multiStepSkill],
  });

  TOPICS.push({
    id: 'subtraction', name: 'Subtraction', icon: '➖', color: '#f97316', minYear: 1,
    tagline: 'Taking away and finding differences',
    explore: (root, y) => explorer(root, y, '−'),
    skills: [takeAway, countBack, bondFacts, missingSub, jumpBack, countUp, factFamily, colSubSimple, columnSub, zeros, decimalSub, estimateSub, difference],
  });
})();
