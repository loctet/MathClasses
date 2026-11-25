'use strict';
/* Measures: length, mass and capacity.
 * Compare (longer, heavier, fuller), non-standard units, rulers and scales,
 * metres and centimetres, adding and subtracting measures, converting units,
 * perimeter and multi-step real-life problems. */
(() => {
  const { rand, pick, shuffle, fmt } = U;
  const INK = '#334155';
  const big = (html) => `<div class="say-big">${html}</div>`;
  const esc = (s) => (s === '<' ? '&lt;' : s === '>' ? '&gt;' : s);
  const sgn = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
  const signTry = (q, ans, hint) => ({ type: 'choice', q, choices: ['<', '=', '>'].map((s) => ({ v: s, html: `<span class="sign">${esc(s)}</span>` })), answer: ans, hint: hint || 'The open mouth faces the bigger amount.' });
  const r10 = (n) => Math.round(n / 10) * 10;
  const opChoice = (ans, why) => ({ say: 'What do we need to do?', type: 'choice', choices: [{ v: '+', html: 'Add ➕' }, { v: '−', html: 'Subtract ➖' }, { v: '×', html: 'Multiply ✖️' }, { v: '÷', html: 'Divide ➗' }], answer: ans, after: why });

  /* ======================= pictures ======================= */
  const LONG = [
    { e: '✏️', n: 'pencil', c: '#f59e0b' }, { e: '🖍️', n: 'crayon', c: '#ef4444' }, { e: '🎀', n: 'ribbon', c: '#ec4899' },
    { e: '🐍', n: 'snake', c: '#22c55e' }, { e: '🥕', n: 'carrot', c: '#f97316' }, { e: '🖌️', n: 'paintbrush', c: '#8b5cf6' },
    { e: '🐛', n: 'caterpillar', c: '#84cc16' }, { e: '🧣', n: 'scarf', c: '#06b6d4' }, { e: '🪢', n: 'rope', c: '#a16207' },
  ];
  const TALL = [{ e: '🦒', n: 'giraffe', c: '#f59e0b' }, { e: '🌳', n: 'tree', c: '#16a34a' }, { e: '🏠', n: 'house', c: '#ef4444' }, { e: '🧒', n: 'child', c: '#3b82f6' }, { e: '🐶', n: 'dog', c: '#a16207' }, { e: '🌻', n: 'sunflower', c: '#eab308' }, { e: '🚀', n: 'rocket', c: '#8b5cf6' }];
  const HEAVY = [['🍉', 'melon', 8], ['🍎', 'apple', 2], ['🪶', 'feather', 1], ['📚', 'pile of books', 6], ['🧸', 'teddy', 3], ['🎈', 'balloon', 1], ['🧱', 'brick', 7], ['🍍', 'pineapple', 5], ['🥔', 'potato', 2], ['🎃', 'pumpkin', 9]];

  /** Horizontal bars that all start at the same line. items: [{len, e, n, c}] */
  function lengthBars(items, unit = 24) {
    const max = Math.max(...items.map((i) => i.len));
    const W = 70 + max * unit + 120, H = items.length * 46 + 10;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="lengths">`;
    s += `<line x1="50" y1="2" x2="50" y2="${H - 2}" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>`;
    items.forEach((it, k) => {
      const y = 8 + k * 46;
      s += `<text x="22" y="${y + 26}" font-size="24" text-anchor="middle">${it.e}</text>`;
      s += `<rect x="50" y="${y + 4}" width="${it.len * unit}" height="26" rx="13" fill="${it.c}" stroke="${INK}" stroke-width="1.5"/>`;
      s += `<text x="${58 + it.len * unit}" y="${y + 23}" font-family="Nunito, sans-serif" font-weight="700" font-size="15" fill="${INK}">${it.n}</text>`;
    });
    return s + '</svg>';
  }
  /** Vertical bars standing on the same floor. */
  function heightBars(items, unit = 16) {
    const max = Math.max(...items.map((i) => i.len));
    const colW = 86, W = items.length * colW + 20, H = max * unit + 90;
    const floor = H - 30;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="heights">`;
    s += `<line x1="0" y1="${floor}" x2="${W}" y2="${floor}" stroke="#16a34a" stroke-width="4"/>`;
    items.forEach((it, k) => {
      const x = 20 + k * colW, h = it.len * unit;
      s += `<rect x="${x + 14}" y="${floor - h}" width="38" height="${h}" rx="6" fill="${it.c}" fill-opacity=".8" stroke="${INK}" stroke-width="1.5"/>`;
      s += `<text x="${x + 33}" y="${floor - h - 8}" font-size="26" text-anchor="middle">${it.e}</text>`;
      s += `<text x="${x + 33}" y="${floor + 20}" font-family="Nunito, sans-serif" font-weight="700" font-size="14" text-anchor="middle" fill="${INK}">${it.n}</text>`;
    });
    return s + '</svg>';
  }
  /** An object measured with cubes or paper clips. */
  function nonStd(len, kind, obj, size) {
    size = size || (kind === 'clip' ? 40 : 28);
    const W = len * size + 40, H = 100;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="measured with ${kind}s">`;
    s += `<rect x="20" y="10" width="${len * size}" height="26" rx="13" fill="${obj.c}" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<text x="${20 + (len * size) / 2}" y="30" font-size="18" text-anchor="middle">${obj.e}</text>`;
    for (let i = 0; i < len; i++) {
      const x = 20 + i * size;
      if (kind === 'clip') s += `<rect x="${x + 3}" y="52" width="${size - 6}" height="16" rx="8" fill="none" stroke="#64748b" stroke-width="3"/><rect x="${x + 9}" y="56" width="${size - 16}" height="8" rx="4" fill="none" stroke="#64748b" stroke-width="2"/>`;
      else s += `<rect x="${x}" y="48" width="${size}" height="${size}" fill="${['#f87171', '#60a5fa', '#4ade80', '#facc15'][i % 4]}" stroke="${INK}" stroke-width="1.5"/>`;
    }
    s += `<line x1="20" y1="4" x2="20" y2="${H - 4}" stroke="${INK}" stroke-dasharray="4 3"/><line x1="${20 + len * size}" y1="4" x2="${20 + len * size}" y2="${H - 4}" stroke="${INK}" stroke-dasharray="4 3"/>`;
    return s + '</svg>';
  }
  /** A centimetre ruler. obj = {start, len, c, e}; o.mm draws millimetre marks. */
  function ruler(max, obj, o = {}) {
    const S = o.scale || 38, pad = 22, W = pad * 2 + max * S, top = obj ? 54 : 8, H = top + 58;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="ruler">`;
    if (obj) {
      const x0 = pad + obj.start * S, x1 = pad + (obj.start + obj.len) * S;
      s += `<rect x="${x0}" y="12" width="${x1 - x0}" height="30" rx="15" fill="${obj.c}" stroke="${INK}" stroke-width="1.5"/>`;
      s += `<text x="${(x0 + x1) / 2}" y="34" font-size="20" text-anchor="middle">${obj.e}</text>`;
      s += `<line x1="${x0}" y1="12" x2="${x0}" y2="${top + 14}" stroke="#7c3aed" stroke-width="2" stroke-dasharray="4 3"/><line x1="${x1}" y1="12" x2="${x1}" y2="${top + 14}" stroke="#7c3aed" stroke-width="2" stroke-dasharray="4 3"/>`;
    }
    s += `<rect x="${pad - 14}" y="${top}" width="${max * S + 28}" height="50" rx="6" fill="#fde68a" stroke="${INK}" stroke-width="2"/>`;
    for (let i = 0; i <= max; i++) {
      const x = pad + i * S;
      s += `<line x1="${x}" y1="${top}" x2="${x}" y2="${top + 20}" stroke="${INK}" stroke-width="2"/>`;
      s += `<text x="${x}" y="${top + 40}" font-family="Fredoka, sans-serif" font-weight="600" font-size="15" text-anchor="middle" fill="${i === 0 ? '#dc2626' : INK}">${i}</text>`;
      if (i < max) {
        if (o.mm) for (let k = 1; k < 10; k++) s += `<line x1="${x + (k * S) / 10}" y1="${top}" x2="${x + (k * S) / 10}" y2="${top + (k === 5 ? 14 : 8)}" stroke="${INK}" stroke-width="1"/>`;
        else s += `<line x1="${x + S / 2}" y1="${top}" x2="${x + S / 2}" y2="${top + 11}" stroke="${INK}" stroke-width="1.2"/>`;
      }
    }
    s += `<text x="${W - pad}" y="${top + 40}" font-family="Nunito, sans-serif" font-weight="800" font-size="12" text-anchor="end" fill="#92400e">cm</text>`;
    return s + '</svg>';
  }
  /** Balance scales. The heavier side goes down. */
  function balance(lw, rw, lHTML, rHTML) {
    const cx = 160, cy = 70, L = 110;
    const th = lw === rw ? 0 : lw > rw ? -12 : 12;
    const t = (th * Math.PI) / 180;
    const lx = cx - L * Math.cos(t), ly = cy - L * Math.sin(t), rx = cx + L * Math.cos(t), ry = cy + L * Math.sin(t);
    const pan = (x, y, html) => `<line x1="${x}" y1="${y}" x2="${x - 34}" y2="${y + 44}" stroke="${INK}" stroke-width="1.5"/><line x1="${x}" y1="${y}" x2="${x + 34}" y2="${y + 44}" stroke="${INK}" stroke-width="1.5"/>
      <path d="M${x - 44} ${y + 44} Q${x} ${y + 66} ${x + 44} ${y + 44} Z" fill="#e2e8f0" stroke="${INK}" stroke-width="2"/>
      <text x="${x}" y="${y + 40}" font-size="34" text-anchor="middle">${html}</text>`;
    let s = '<svg viewBox="0 0 320 210" width="320" style="max-width:100%;height:auto" role="img" aria-label="balance scales">';
    s += `<path d="M${cx - 50} 200 L${cx + 50} 200 L${cx} ${cy}Z" fill="#94a3b8" stroke="${INK}" stroke-width="2"/>`;
    s += `<line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
    s += pan(lx, ly, lHTML) + pan(rx, ry, rHTML);
    s += `<circle cx="${cx}" cy="${cy}" r="7" fill="${INK}"/>`;
    return s + '</svg>';
  }
  /** A measuring jug. o = {max, minor, step (labels), unit, noScale, size, label} */
  function jug(level, o = {}) {
    const max = o.max || 100, minor = o.minor || max / 10, step = o.step || max / 2, unit = o.unit || 'ml';
    const W = 240, top = 24, bottom = 244, x0 = 50, x1 = 160;
    const Y = (v) => bottom - (v / max) * (bottom - top);
    let s = `<svg viewBox="0 0 ${W} 262" width="${o.size || W}" style="max-width:100%;height:auto" role="img" aria-label="measuring jug">`;
    s += `<path d="M${x0} ${top - 10} Q${x0 - 34} ${top + 50} ${x0} ${top + 110}" fill="none" stroke="${INK}" stroke-width="7"/>`;
    s += `<rect x="${x0 + 3}" y="${Y(level)}" width="${x1 - x0 - 6}" height="${bottom - Y(level)}" fill="#60a5fa" fill-opacity=".75"/>`;
    if (level > 0) s += `<line x1="${x0 + 3}" y1="${Y(level)}" x2="${x1 - 3}" y2="${Y(level)}" stroke="#1d4ed8" stroke-width="2"/>`;
    s += `<path d="M${x0} ${top - 12} L${x0} ${bottom} Q${x0} ${bottom + 8} ${x0 + 8} ${bottom + 8} L${x1 - 8} ${bottom + 8} Q${x1} ${bottom + 8} ${x1} ${bottom} L${x1} ${top - 12} L${x1 + 12} ${top - 20}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    if (!o.noScale) {
      for (let v = 0; v <= max + 1e-9; v += minor) {
        const y = Y(v), lab = Math.abs(v % step) < 1e-9;
        s += `<line x1="${x1}" y1="${y}" x2="${x1 - (lab ? 18 : 9)}" y2="${y}" stroke="${INK}" stroke-width="${lab ? 2.2 : 1.2}"/>`;
        if (lab) s += `<text x="${x1 + 8}" y="${y + 5}" font-family="Fredoka, sans-serif" font-weight="600" font-size="14" fill="${INK}">${fmt(v)} ${unit}</text>`;
      }
    }
    if (o.label) s += `<text x="${(x0 + x1) / 2}" y="${top - 2}" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" text-anchor="middle" fill="#7c3aed">${o.label}</text>`;
    return s + '</svg>';
  }
  /** A scale line with a pointer (kitchen scales, tape measures). */
  const scaleLine = (max, minor, step, unit, v) => V.numberLine({ min: 0, max, step, minor, label: (x) => `${fmt(x)}${unit}`, points: v == null ? [] : [{ v, emoji: '🔻' }], height: 100 });
  /** A tape of 100 cm, with an optional piece cut off at the start. */
  function tape(cut) {
    const S = 5.4, x0 = 20, W = x0 * 2 + 100 * S;
    let s = `<svg viewBox="0 0 ${W} 104" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="one metre tape">`;
    s += `<rect x="${x0}" y="20" width="${100 * S}" height="34" rx="4" fill="#fbcfe8" stroke="${INK}" stroke-width="2"/>`;
    if (cut) {
      s += `<rect x="${x0}" y="20" width="${cut * S}" height="34" rx="4" fill="#f472b6" stroke="${INK}" stroke-width="2"/>`;
      s += `<text x="${x0 + cut * S}" y="16" font-size="18" text-anchor="middle">✂️</text>`;
      s += `<text x="${x0 + (cut * S) / 2}" y="43" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" text-anchor="middle" fill="#fff">${cut} cm cut</text>`;
      s += `<text x="${x0 + cut * S + ((100 - cut) * S) / 2}" y="43" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" text-anchor="middle" fill="#9d174d">? cm left</text>`;
    }
    for (let i = 0; i <= 100; i += 10) {
      const x = x0 + i * S;
      s += `<line x1="${x}" y1="54" x2="${x}" y2="66" stroke="${INK}" stroke-width="2"/><text x="${x}" y="84" font-family="Fredoka, sans-serif" font-weight="600" font-size="13" text-anchor="middle" fill="${INK}">${i}</text>`;
    }
    s += `<text x="${x0 + 50 * S}" y="101" font-family="Nunito, sans-serif" font-weight="800" font-size="13" text-anchor="middle" fill="#9d174d">1 metre = 100 cm</text>`;
    return s + '</svg>';
  }
  /** A rectangle with its side lengths. */
  function rect(w, h, unit, o = {}) {
    const k = 220 / Math.max(w, h), Wd = w * k, Hd = h * k, x = 60, y = 30;
    let s = `<svg viewBox="0 0 ${Wd + 130} ${Hd + 70}" width="${Wd + 130}" style="max-width:100%;height:auto" role="img" aria-label="rectangle ${w} by ${h}">`;
    s += `<rect x="${x}" y="${y}" width="${Wd}" height="${Hd}" fill="${o.fill || '#d1fae5'}" stroke="#059669" stroke-width="4"/>`;
    const lab = (tx, ty, txt, anchor = 'middle') => `<text x="${tx}" y="${ty}" font-family="Fredoka, sans-serif" font-weight="600" font-size="17" text-anchor="${anchor}" fill="${INK}">${txt}</text>`;
    s += lab(x + Wd / 2, y - 8, `${fmt(w)} ${unit}`);
    s += lab(x + Wd + 8, y + Hd / 2 + 6, o.hideRight ? '?' : `${fmt(h)} ${unit}`, 'start');
    if (o.all) { s += lab(x + Wd / 2, y + Hd + 24, `${fmt(w)} ${unit}`); s += lab(x - 8, y + Hd / 2 + 6, `${fmt(h)} ${unit}`, 'end'); }
    if (o.ant) s += `<text x="${x - 4}" y="${y - 2}" font-size="22">🐜</text>`;
    return s + '</svg>';
  }

  /* ======================= Year 1 ======================= */
  function distinctLens(n, lo, hi) { const set = new Set(); while (set.size < n) set.add(rand(lo, hi)); return [...set]; }
  const objs = (n, list) => shuffle(list).slice(0, n);

  const compareLength = {
    id: 'compare-length', title: 'Longer, shorter, taller', years: [1, 1], icon: '📏',
    desc: 'Line things up at the same start, then compare.',
    lesson() {
      const [A, B, C] = objs(3, LONG);
      const [la, lb, lc] = distinctLens(3, 3, 12);
      const two = [{ ...A, len: la }, { ...B, len: lb }];
      const three = [{ ...A, len: la }, { ...B, len: lb }, { ...C, len: lc }];
      const tall = objs(3, TALL).map((t, i) => ({ ...t, len: [rand(3, 5), rand(7, 9), rand(10, 13)][i] }));
      const shortest = three.reduce((a, b) => (a.len < b.len ? a : b));
      const tallest = tall.reduce((a, b) => (a.len > b.len ? a : b));
      return [
        { say: 'To compare <b>lengths</b>, line things up at the <b>same start line</b> (the dotted line). Then look at which one goes further.', show: lengthBars(two) },
        { say: `The one that goes further is <b>longer</b>.`, show: lengthBars(two),
          try: { type: 'choice', q: 'Which is longer?', choices: shuffle(two).map((t) => ({ v: t.n, html: `${t.e} ${t.n}` })), answer: (la > lb ? A : B).n, hint: 'Which bar goes further from the dotted line?' } },
        { say: 'The one that stops first is <b>shorter</b>. With three things, the shortest is the one that stops first of all.', show: lengthBars(three),
          try: { type: 'choice', q: 'Which is the shortest?', choices: three.map((t) => ({ v: t.n, html: `${t.e} ${t.n}` })), answer: shortest.n } },
        { say: 'For things that stand up we say <b>taller</b> and <b>shorter</b>. Stand them on the same floor (the green line)!', show: heightBars(tall),
          try: { type: 'choice', q: 'Which is the tallest?', choices: shuffle(tall).map((t) => ({ v: t.n, html: `${t.e} ${t.n}` })), answer: tallest.n } },
        { say: 'Your turn: put them in order, from the <b>shortest</b> to the <b>longest</b>.', show: lengthBars(three),
          try: { type: 'order', items: three.map((t) => ({ v: t.len, html: `${t.e} ${t.n}` })), dir: 'asc', hint: 'Find the shortest first.' } },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.4) {
        const items = objs(rand(2, 3), LONG).map((t, i, a) => ({ ...t, len: distinctLens(a.length, 2, 12)[i] }));
        const lens = items.map((i) => i.len);
        if (new Set(lens).size < lens.length) items.forEach((t, i) => { t.len = 3 + i * 3; });
        const longQ = Math.random() < 0.5;
        const ans = items.reduce((a, b) => ((longQ ? a.len > b.len : a.len < b.len) ? a : b));
        return { type: 'choice', q: `Which is the <b>${longQ ? 'longest' : 'shortest'}</b>?`, visual: lengthBars(items), choices: items.map((t) => ({ v: t.n, html: `${t.e} ${t.n}` })), answer: ans.n, hint: 'Look at where each bar stops.' };
      }
      if (r < 0.7) {
        const lens = distinctLens(3, 3, 13);
        const items = objs(3, TALL).map((t, i) => ({ ...t, len: lens[i] }));
        const tallQ = Math.random() < 0.5;
        const ans = items.reduce((a, b) => ((tallQ ? a.len > b.len : a.len < b.len) ? a : b));
        return { type: 'choice', q: `Which is the <b>${tallQ ? 'tallest' : 'shortest'}</b>?`, visual: heightBars(items), choices: items.map((t) => ({ v: t.n, html: `${t.e} ${t.n}` })), answer: ans.n };
      }
      const lens = distinctLens(3, 2, 12);
      const items = objs(3, LONG).map((t, i) => ({ ...t, len: lens[i] }));
      const dir = pick(['asc', 'desc']);
      return { type: 'order', q: `Put them in order from the <b>${dir === 'asc' ? 'shortest to the longest' : 'longest to the shortest'}</b>.`, visual: lengthBars(items), items: items.map((t) => ({ v: t.len, html: `${t.e} ${t.n}` })), dir };
    },
    word() {
      const [a, b] = U.twoNames();
      const la = rand(5, 10), lb = rand(2, la - 1);
      const [A, B] = objs(2, LONG);
      return {
        type: 'guided', story: true, scene: '🎀',
        q: `${a}'s ${A.n} is <b>${la} cubes</b> long. ${b}'s ${B.n} is <b>${lb} cubes</b> long.`,
        visual: lengthBars([{ ...A, len: la, n: `${a}'s ${A.n}` }, { ...B, len: lb, n: `${b}'s ${B.n}` }], 22),
        parts: [
          { say: 'Whose is longer?', type: 'choice', choices: shuffle([a, b]).map((n) => ({ v: n, html: n })), answer: a },
          { say: 'How many cubes longer?', answer: la - lb, suffix: 'cubes', hint: `${la} − ${lb}`, after: `${la} − ${lb} = ${la - lb}` },
        ],
      };
    },
  };

  function heavyPair() {
    const [x, y] = shuffle(HEAVY.filter((h, i, arr) => arr.findIndex((z) => z[2] === h[2]) === i)).slice(0, 2);
    return [x, y];
  }
  const compareMass = {
    id: 'compare-mass', title: 'Heavier and lighter', years: [1, 1], icon: '⚖️',
    desc: 'On balance scales the heavier side goes down.',
    lesson() {
      const [x, y] = heavyPair();
      const [p, q] = heavyPair();
      const heavier = x[2] > y[2] ? x : y;
      const lighter = p[2] < q[2] ? p : q;
      return [
        { say: 'A <b>balance scale</b> is like a seesaw. Put something on each side. The <b>heavier</b> side goes <b>down</b>. The <b>lighter</b> side goes up.', show: balance(x[2], y[2], x[0], y[0]) },
        { say: `Look at the ${x[1]} and the ${y[1]}. Which side went down?`, show: balance(x[2], y[2], x[0], y[0]),
          try: { type: 'choice', q: 'Which is heavier?', choices: [x, y].map((h) => ({ v: h[1], html: `${h[0]} ${h[1]}` })), answer: heavier[1], hint: 'The heavier one is on the side that goes down.' } },
        { say: 'The side that goes <b>up</b> is lighter.', show: balance(p[2], q[2], p[0], q[0]),
          try: { type: 'choice', q: 'Which is lighter?', choices: [p, q].map((h) => ({ v: h[1], html: `${h[0]} ${h[1]}` })), answer: lighter[1], hint: 'Which side went up?' } },
        { say: 'If the scale is <b>level</b>, both sides weigh the <b>same</b>.', show: balance(3, 3, '🍎🍎', '🍐🍐') },
        { say: '⚠️ Big does not always mean heavy! A balloon is big but very light. A brick is small but heavy.', show: balance(1, 7, '🎈', '🧱'),
          try: { type: 'choice', q: 'Which is heavier?', choices: [{ v: 'balloon', html: '🎈 balloon' }, { v: 'brick', html: '🧱 brick' }], answer: 'brick' } },
      ];
    },
    gen() {
      const r = Math.random();
      if (r < 0.2) {
        return { type: 'choice', q: 'What does the balance show?', visual: balance(4, 4, '🍌🍌', '🍊🍊'), choices: [{ v: 'left', html: 'The bananas are heavier' }, { v: 'same', html: 'They weigh the same' }, { v: 'right', html: 'The oranges are heavier' }], answer: 'same', hint: 'Is the scale level?' };
      }
      if (r < 0.45) {
        const a = rand(2, 9);
        let b = rand(2, 9); if (b === a) b = a + 1;
        const [A, B] = shuffle([['🍎', 'apple'], ['🍐', 'pear'], ['🥭', 'mango'], ['🍋', 'lemon']]);
        return { type: 'choice', q: `The ${A[1]} balances <b>${a} cubes</b>. The ${B[1]} balances <b>${b} cubes</b>. Which is heavier?`, choices: [A, B].map((h) => ({ v: h[1], html: `${h[0]} ${h[1]}` })), answer: a > b ? A[1] : B[1], hint: 'More cubes means heavier.' };
      }
      const [x, y] = heavyPair();
      const hq = Math.random() < 0.5;
      const ans = (hq ? x[2] > y[2] : x[2] < y[2]) ? x : y;
      return { type: 'choice', q: `Which is <b>${hq ? 'heavier' : 'lighter'}</b>?`, visual: balance(x[2], y[2], x[0], y[0]), choices: shuffle([x, y]).map((h) => ({ v: h[1], html: `${h[0]} ${h[1]}` })), answer: ans[1], hint: hq ? 'Heavier goes down.' : 'Lighter goes up.' };
    },
  };

  const FULLNESS = [['full', 1], ['nearly full', 0.85], ['half full', 0.5], ['nearly empty', 0.12], ['empty', 0]];
  const capacityWords = {
    id: 'capacity-words', title: 'Full, half full, empty', years: [1, 1], icon: '🫙',
    desc: 'How much a container holds.',
    lesson() {
      const jugs = shuffle([0, 1, 2]);
      const lv = [100, 50, 0];
      const lab = ['A', 'B', 'C'];
      const three = jugs.map((j, i) => jug(lv[j], { noScale: true, size: 120, label: lab[i] })).join('');
      const fullIdx = jugs.indexOf(0), halfIdx = jugs.indexOf(1);
      const ord = shuffle([[10, 'A'], [55, 'B'], [90, 'C']]);
      return [
        { say: '<b>Capacity</b> is how much a container can hold. A jug can be <b>full</b>, <b>half full</b> or <b>empty</b>.', show: `<div class="demo-row">${jug(100, { noScale: true, size: 120, label: 'full' })}${jug(50, { noScale: true, size: 120, label: 'half' })}${jug(0, { noScale: true, size: 120, label: 'empty' })}</div>` },
        { say: 'Full means the water comes right to the top.', show: `<div class="demo-row">${three}</div>`,
          try: { type: 'choice', q: 'Which jug is full?', choices: lab.map((l) => ({ v: l, html: l })), answer: lab[fullIdx] } },
        { say: 'Half full means the water comes <b>half way</b> up.', show: `<div class="demo-row">${three}</div>`,
          try: { type: 'choice', q: 'Which jug is half full?', choices: lab.map((l) => ({ v: l, html: l })), answer: lab[halfIdx] } },
        { say: 'Some jugs are <b>nearly full</b> or <b>nearly empty</b>.', show: `<div class="demo-row">${jug(85, { noScale: true, size: 120, label: 'nearly full' })}${jug(12, { noScale: true, size: 120, label: 'nearly empty' })}</div>` },
        { say: 'Your turn: put the jugs in order, from the <b>least</b> water to the <b>most</b>.',
          try: { type: 'order', items: ord.map(([v, l]) => ({ v, html: `<div style="width:70px">${jug(v, { noScale: true, size: 70 })}</div>${l}` })), dir: 'asc' } },
      ];
    },
    gen() {
      if (Math.random() < 0.6) {
        const [w, f] = pick(FULLNESS);
        const opts = shuffle(FULLNESS.filter((x) => x[0] !== w)).slice(0, 2).map((x) => x[0]).concat(w);
        return { type: 'choice', q: 'How full is this jug?', visual: jug(f * 100, { noScale: true, size: 140 }), choices: shuffle(opts).map((v) => ({ v, html: v })), answer: w };
      }
      const lv = distinctLens(3, 0, 10).map((x) => x * 10);
      const most = Math.random() < 0.5;
      const lab = ['A', 'B', 'C'];
      const ans = lab[lv.indexOf(most ? Math.max(...lv) : Math.min(...lv))];
      return { type: 'choice', q: `Which jug has the <b>${most ? 'most' : 'least'}</b> water?`, visual: `<div class="demo-row">${lv.map((v, i) => jug(v, { noScale: true, size: 110, label: lab[i] })).join('')}</div>`, choices: lab.map((l) => ({ v: l, html: l })), answer: ans };
    },
  };

  const nonStandard = {
    id: 'non-standard', title: 'Measure with cubes and clips', years: [1, 2], icon: '🧊',
    desc: 'Line up cubes or paper clips with no gaps, then count.',
    lesson(y) {
      const [A, B] = objs(2, LONG);
      const n = rand(4, 9), m = rand(3, 7);
      const cl = rand(3, 6);
      const fr = [
        { say: 'We can measure how long something is with <b>cubes</b>. Put them in a line from one end to the other, with <b>no gaps</b> and no overlaps.', show: nonStd(n, 'cube', A) },
        { say: 'Now count the cubes.', show: nonStd(n, 'cube', A), try: { q: `How many cubes long is the ${A.n}?`, answer: n, suffix: 'cubes' } },
        { say: 'We can use <b>paper clips</b> too.', show: nonStd(cl, 'clip', B), try: { q: `How many paper clips long is the ${B.n}?`, answer: cl, suffix: 'clips' } },
      ];
      if (y >= 2) {
        const cubes = 8, clips = 5;
        fr.push({ say: 'But look! The same pencil is <b>8 cubes</b> long and <b>5 clips</b> long. Cubes and clips are different sizes, so we get different numbers. That is why we use <b>centimetres</b>: they are the same size everywhere in the world.', show: nonStd(cubes, 'cube', LONG[0], 25) + nonStd(clips, 'clip', LONG[0], 40),
          try: { type: 'choice', q: 'Why do we use centimetres?', choices: shuffle([{ v: 'same', html: 'Every centimetre is the same size' }, { v: 'big', html: 'Centimetres are very big' }, { v: 'col', html: 'Centimetres are colourful' }]), answer: 'same' } });
      } else {
        fr.push({ say: `The ${A.n} is ${n} cubes long. A ${LONG[2].n} is ${m} cubes long.`, try: { q: `How many cubes longer is the ${n > m ? A.n : LONG[2].n}?`, answer: Math.abs(n - m), suffix: 'cubes', hint: `${Math.max(n, m)} − ${Math.min(n, m)}` } });
      }
      return fr;
    },
    gen(y) {
      const A = pick(LONG), kind = pick(['cube', 'clip']), n = rand(2, y === 1 ? 9 : 12);
      if (Math.random() < 0.7) return { q: `How many ${kind === 'cube' ? 'cubes' : 'paper clips'} long is the ${A.n}?`, visual: nonStd(n, kind, A, kind === 'cube' ? 26 : 38), answer: n, suffix: kind === 'cube' ? 'cubes' : 'clips', hint: 'Count them one by one.' };
      const B = pick(LONG.filter((x) => x !== A)), m = rand(1, n);
      return { q: `The ${A.n} is <b>${n} cubes</b> long. The ${B.n} is <b>${m} cubes</b> long. How many cubes longer is the ${A.n}?`, visual: nonStd(n, 'cube', A, 24) + nonStd(m, 'cube', B, 24), answer: n - m, suffix: 'cubes', hint: `${n} − ${m}` };
    },
  };

  /* ======================= Year 2 ======================= */
  const rulerCm = {
    id: 'ruler-cm', title: 'Measure with a ruler', years: [2, 3], icon: '📐',
    desc: 'Start at 0 and read the centimetres.',
    lesson(y) {
      const A = pick(LONG), L = rand(4, 11), B = pick(LONG), s = rand(2, 4), L2 = rand(3, 8);
      const C = pick(LONG), s3 = y >= 3 ? rand(1, 4) : 0, L3 = rand(3, 9);
      return [
        { say: 'A ruler measures in <b>centimetres</b>, written <b>cm</b>. Look: the numbers start at <b>0</b>, not at the very end of the ruler!', show: ruler(12) },
        { say: `Put one end of the ${A.n} exactly on the <b>0</b>. Then read the number at the other end.`, show: ruler(13, { start: 0, len: L, ...A }),
          try: { q: `How long is the ${A.n}?`, answer: L, suffix: 'cm', hint: 'Read the number under the right-hand end.' } },
        { say: `This ${B.n} does <b>not</b> start at 0. It starts at ${s} and ends at ${s + L2}. Don't just read the end! Count the cm <b>spaces</b> between the ends, or do end − start.`, show: ruler(13, { start: s, len: L2, ...B }),
          try: { type: 'guided', parts: [{ say: 'Where does it start?', answer: s }, { say: 'Where does it end?', answer: s + L2 }, { say: `Length = ${s + L2} − ${s} = ?`, answer: L2, suffix: 'cm' }] } },
        { say: 'Your turn: measure this one.', show: ruler(13, { start: s3, len: L3, ...C }), try: { q: `How long is the ${C.n}?`, answer: L3, suffix: 'cm', hint: s3 ? `It starts at ${s3}, not 0.` : 'It starts at 0.' } },
      ];
    },
    gen(y) {
      const A = pick(LONG), L = rand(2, 11), s = y >= 3 && Math.random() < 0.6 ? rand(1, 3) : (Math.random() < 0.25 ? rand(1, 2) : 0);
      return { q: `How long is the ${A.n}?`, visual: ruler(Math.min(15, s + L + 2), { start: s, len: L, ...A }), answer: L, suffix: 'cm', hint: s ? `It starts at ${s}. Count the spaces, or do end − start.` : 'Read the number at the end.', steps: [`Start: ${s}, end: ${s + L}.`, `${s + L} − ${s} = <b>${L} cm</b>`] };
    },
    word(y) {
      const [a, b] = U.twoNames();
      const la = rand(8, y === 2 ? 15 : 30), lb = rand(5, y === 2 ? 15 : 30);
      return {
        type: 'guided', story: true, scene: '🐛',
        q: `${a} measures a caterpillar: <b>${la} cm</b>. ${b} measures a worm: <b>${lb} cm</b>. If they lie end to end, how long are they altogether?`,
        parts: [opChoice('+', '“Altogether” means add.'), { say: `${la} + ${lb} = ?`, answer: la + lb, suffix: 'cm' }],
      };
    },
  };

  function scalePick(y) {
    if (y <= 2) {
      const [max, minor, step] = pick([[20, 2, 10], [50, 5, 10], [100, 10, 50], [100, 5, 20], [20, 1, 5]]);
      return { max, minor, step };
    }
    const [max, minor, step] = pick([[100, 10, 50], [200, 20, 100], [500, 50, 100], [1000, 100, 500], [500, 25, 100], [1000, 50, 200]]);
    return { max, minor, step };
  }
  const offLabel = (sc) => { for (;;) { const v = rand(1, sc.max / sc.minor - 1) * sc.minor; if (v % sc.step !== 0) return v; } };
  const readScales = {
    id: 'read-scales', title: 'Read scales and jugs', years: [2, 3], icon: '🔎',
    desc: 'Work out what each small step is worth.',
    lesson(y) {
      const sc = scalePick(y), v = offLabel(sc), k = sc.step / sc.minor;
      const jc = y <= 2 ? { max: 100, minor: 10, step: 50 } : { max: 1000, minor: 100, step: 500 };
      const jv = offLabel(jc);
      const sc2 = scalePick(y), v2 = offLabel(sc2);
      return [
        { say: 'On a scale, <b>not every mark has a number</b>. Before you read it, find out what <b>each small step</b> is worth.', show: scaleLine(sc.max, sc.minor, sc.step, 'g') },
        { say: `From 0 to ${sc.step} there are <b>${k}</b> small steps. So each step is ${sc.step} ÷ ${k}.`, show: scaleLine(sc.max, sc.minor, sc.step, 'g'),
          try: { q: 'How much is each small step worth?', answer: sc.minor, suffix: 'g', hint: `${sc.step} ÷ ${k}` } },
        { say: `Now read where the arrow points. Start at the nearest number before it, then count on in ${sc.minor}s.`, show: scaleLine(sc.max, sc.minor, sc.step, 'g', v),
          try: { q: 'How heavy is it?', answer: v, suffix: 'g', hint: `Count on in ${sc.minor}s from ${Math.floor(v / sc.step) * sc.step}.` } },
        { say: `Jugs work the same way. Here each step is ${jc.minor} ml. Read the top of the water.`, show: jug(jv, jc),
          try: { q: 'How much water is in the jug?', answer: jv, suffix: 'ml' } },
        { say: 'Your turn: work out the steps first!', show: scaleLine(sc2.max, sc2.minor, sc2.step, 'g', v2), try: { q: 'What does the scale show?', answer: v2, suffix: 'g', hint: `Each small step is ${sc2.minor} g.` } },
      ];
    },
    gen(y) {
      const sc = scalePick(y), v = offLabel(sc), r = Math.random();
      const steps = [`From 0 to ${sc.step} there are ${sc.step / sc.minor} steps, so each step is <b>${sc.minor}</b>.`, `Count on from ${Math.floor(v / sc.step) * sc.step} in ${sc.minor}s → <b>${v}</b>.`];
      if (r < 0.4) return { q: 'What does the scale show?', visual: scaleLine(sc.max, sc.minor, sc.step, 'g', v), answer: v, suffix: 'g', hint: 'Find what each small step is worth first.', steps };
      if (r < 0.75) return { q: 'How much water is in the jug?', visual: jug(v, { max: sc.max, minor: sc.minor, step: sc.step, size: 200 }), answer: v, suffix: 'ml', hint: 'What is each small step worth?', steps };
      return { q: 'What is each small step worth on this scale?', visual: scaleLine(sc.max, sc.minor, sc.step, 'cm'), answer: sc.minor, suffix: 'cm', hint: `${sc.step} ÷ ${sc.step / sc.minor}` };
    },
  };

  const compareMeasures = {
    id: 'compare-measures', title: 'Compare with < > =', years: [2, 2], icon: '🐊',
    desc: 'Compare lengths, masses and capacities with signs.',
    lesson() {
      const a = rand(12, 49), b = rand(12, 49) === a ? a + 3 : rand(12, 49);
      const m1 = rand(2, 9) * 100, m2 = rand(1, 9) * 100 === m1 ? m1 + 50 : rand(1, 9) * 100;
      const caps = distinctLens(3, 1, 9).map((x) => x * 100);
      return [
        { say: 'The signs <b>&lt;</b> and <b>&gt;</b> are like a hungry crocodile 🐊: the open mouth always eats the <b>bigger</b> amount. <b>=</b> means the same.', show: big('45 cm &lt; 54 cm · 3 kg &gt; 1 kg · 50 ml = 50 ml') },
        { say: 'Compare these lengths.', try: signTry(`${a} cm <span class="box">?</span> ${b} cm`, sgn(a, b)) },
        { say: 'Masses work the same way.', try: signTry(`${m1} g <span class="box">?</span> ${m2} g`, sgn(m1, m2)) },
        { say: '⚠️ Watch the <b>units</b>! <b>1 m = 100 cm</b>. So 1 m is more than 90 cm, even though 90 is a bigger number than 1.', try: signTry('1 m <span class="box">?</span> 100 cm', '=', '1 metre is the same as 100 centimetres.') },
        { say: 'Your turn: put the drinks in order, from the least to the most.', try: { type: 'order', items: caps.map((c) => ({ v: c, html: `🧃 ${c} ml` })), dir: 'asc' } },
      ];
    },
    gen() {
      const kind = pick(['cm', 'g', 'kg', 'ml', 'l', 'm']);
      const r = Math.random();
      if (r < 0.15) { const v = pick([90, 100, 120]); return signTry(`1 m <span class="box">?</span> ${v} cm`, sgn(100, v), '1 m = 100 cm'); }
      if (r < 0.3) {
        const items = distinctLens(3, 2, 30).map((x) => x * (kind === 'ml' || kind === 'g' ? 10 : 1));
        return { type: 'order', q: 'Put these in order, smallest first.', items: items.map((x) => ({ v: x, html: `${x} ${kind}` })), dir: 'asc' };
      }
      const a = rand(2, 99), b = Math.random() < 0.15 ? a : rand(2, 99);
      return signTry(`${a} ${kind} <span class="box">?</span> ${b} ${kind}`, sgn(a, b));
    },
  };

  const UNIT_ITEMS = {
    length: [['the length of a pencil', 'cm', 2], ['the height of a door', 'm', 2], ['the distance from London to Paris', 'km', 3], ['the length of an ant', 'mm', 4], ['the length of a football pitch', 'm', 2], ['the width of a book', 'cm', 2], ['the length of a car journey', 'km', 3], ['the thickness of a coin', 'mm', 4]],
    mass: [['an apple', 'g', 2], ['a bag of potatoes', 'kg', 2], ['a feather', 'g', 2], ['a dog', 'kg', 2], ['a grown-up person', 'kg', 2], ['a biscuit', 'g', 2]],
    capacity: [['a cup of tea', 'ml', 2], ['a bath', 'l', 2], ['a spoonful of medicine', 'ml', 2], ['a bucket', 'l', 2], ['a swimming pool', 'l', 2], ['a yoghurt pot', 'ml', 2]],
  };
  const UNITS_OF = { length: ['mm', 'cm', 'm', 'km'], mass: ['g', 'kg'], capacity: ['ml', 'l'] };
  const ESTIMATES = [
    ['How tall is a door?', '2 m', ['20 m', '20 cm', '2 km']], ['How long is a pencil?', '15 cm', ['15 m', '1 cm', '150 cm']],
    ['How heavy is a bag of sugar?', '1 kg', ['1 g', '100 kg', '10 g']], ['How much does a glass of water hold?', '250 ml', ['25 l', '2 ml', '250 l']],
    ['How heavy is an apple?', '150 g', ['150 kg', '1 g', '15 kg']], ['How far can you walk in an hour?', '5 km', ['5 m', '50 km', '500 cm']],
    ['How much does a bucket hold?', '10 l', ['10 ml', '1000 l', '1 ml']], ['How tall is a ten-year-old child?', '140 cm', ['14 cm', '14 m', '1 km']],
  ];
  function unitQ(y) {
    const kind = pick(Object.keys(UNIT_ITEMS));
    const list = UNIT_ITEMS[kind].filter((x) => x[2] <= Math.max(2, y));
    const [what, u] = pick(list);
    const units = UNITS_OF[kind].filter((x) => (y >= 4 ? true : x !== 'mm') && (y >= 3 ? true : x !== 'km'));
    return { type: 'choice', q: `Which unit would you use to measure <b>${what}</b>?`, choices: units.map((x) => ({ v: x, html: x })), answer: u, hint: kind === 'length' ? 'Small: cm (tiny: mm). Long: m. Very far: km.' : kind === 'mass' ? 'Light things: g. Heavy things: kg.' : 'Small amounts: ml. Big amounts: l.' };
  }
  const estQ = () => { const [q, a, w] = pick(ESTIMATES); return { type: 'choice', q: `<b>Estimate:</b> ${q}`, choices: shuffle([a, ...w.slice(0, 2)]).map((v) => ({ v, html: `about ${v}` })), answer: a, hint: 'Picture it in real life. Does the answer make sense?' }; };
  const unitsChoice = {
    id: 'choose-units', title: 'Choose the right unit and estimate', years: [2, 6], icon: '🤔',
    desc: 'cm or m? g or kg? ml or l? Then make a sensible guess.',
    lesson(y) {
      const fr = [
        { say: `<b>Length</b>: small things in <b>cm</b>${y >= 4 ? ' (tiny things in <b>mm</b>)' : ''}, long things in <b>m</b>${y >= 3 ? ', very far distances in <b>km</b>' : ''}.`, show: V.chips([...(y >= 4 ? ['🐜 mm'] : []), '✏️ cm', '🚪 m', ...(y >= 3 ? ['🗺️ km'] : [])]) },
        { say: 'Which unit fits?', try: { type: 'choice', q: 'The length of a pencil is measured in…', choices: [{ v: 'cm', html: 'cm' }, { v: 'm', html: 'm' }], answer: 'cm' } },
        { say: '<b>Mass</b> (how heavy): light things in <b>grams (g)</b>, heavy things in <b>kilograms (kg)</b>. <b>Capacity</b>: small amounts in <b>millilitres (ml)</b>, big amounts in <b>litres (l)</b>.', show: V.chips(['🍎 g', '🥔 kg', '🥄 ml', '🛁 l']),
          try: unitQ(Math.max(2, y)) },
      ];
      if (y >= 4) fr.push({ say: 'Estimating means making a <b>sensible guess</b>. Picture the thing in real life and compare it with something you know — a door is about 2 m tall, a bag of sugar is about 1 kg.', try: estQ() });
      fr.push({ say: 'Your turn!', try: y >= 4 && Math.random() < 0.5 ? estQ() : unitQ(y) });
      return fr;
    },
    gen(y) { return y >= 4 && Math.random() < 0.45 ? estQ() : unitQ(y); },
  };

  /* ======================= Year 3–4 ======================= */
  function bondGuided(total, used, unit, story) {
    const T = Math.ceil(used / 10) * 10;
    const parts = [];
    if (T !== used) parts.push({ say: `${used} + ? = ${T} (to the next ten)`, answer: T - used });
    if (total !== T) parts.push({ say: `${T} + ? = ${total}`, answer: total - T });
    parts.push({ say: `So how much is left?`, answer: total - used, suffix: unit, after: `${total} − ${used} = ${total - used} ${unit}` });
    return { type: 'guided', story: !!story, q: story || `${total} ${unit} − ${used} ${unit} = ?`, parts, hint: 'Count up from the part used to the whole.' };
  }
  const metreBonds = {
    id: 'metre-bonds', title: 'Make a metre (and a kilogram)', years: [3, 4], icon: '🎀',
    desc: '1 m = 100 cm, 1 kg = 1000 g, 1 l = 1000 ml. How much is left?',
    lesson(y) {
      let cut = rand(12, 88); if (cut % 10 === 0) cut += 3;
      const T = Math.ceil(cut / 10) * 10;
      const g = rand(1, 9) * 100 + pick([0, 50, 25]);
      const n = rand(11, 89);
      return [
        { say: 'A <b>metre</b> is <b>100 centimetres</b>. Here is a 1 m ribbon with a mark every 10 cm.', show: tape() },
        { say: `We cut off <b>${cut} cm</b>. How much ribbon is left? We need <b>100 − ${cut}</b>. Let's make 100 in two easy steps.`, show: tape(cut) },
        { say: `<b>Step 1:</b> from ${cut} up to the next ten, ${T}.`, show: tape(cut), try: { q: `${cut} + ? = ${T}`, answer: T - cut } },
        { say: `<b>Step 2:</b> from ${T} up to 100.`, try: { q: `${T} + ? = 100`, answer: 100 - T, hint: `Count in tens from ${T}.` } },
        { say: `Add the two steps: ${T - cut} + ${100 - T}.`, try: { q: 'How many cm are left?', answer: 100 - cut, suffix: 'cm' } },
        { say: `You can also write it as a <b>column subtraction</b>: 100 − ${cut}. The zeros mean we must exchange twice — the helper will guide you.`, try: { type: 'column', a: 100, b: cut, op: '−' } },
        { say: `It works with other units too. <b>1 kg = 1000 g</b> and <b>1 l = 1000 ml</b>. A bag has 1 kg of flour. We use <b>${g} g</b> for a cake. How much is left?`, try: { type: 'column', a: 1000, b: g, op: '−' } },
        { say: 'Your turn: the whole problem!', try: bondGuided(100, n, 'cm', `A rope is <b>1 metre</b> long. ${U.name()} cuts off <b>${n} cm</b>. How much rope is left?`) },
      ];
    },
    gen(y) {
      const r = Math.random();
      if (r < 0.4) { const n = rand(11, 89); return bondGuided(100, n, 'cm', `A ribbon is <b>1 m</b> long. <b>${n} cm</b> is cut off. How much is left?`); }
      if (r < 0.7) { const n = rand(11, 89); return { type: 'column', q: `1 m − ${n} cm: work out <b>100 − ${n}</b> in columns.`, a: 100, b: n, op: '−', steps: V.columnMethod(100, n, '−').steps }; }
      const [whole, unit, thing] = pick([[1000, 'g', 'flour'], [1000, 'ml', 'juice']]);
      const used = y === 3 ? rand(1, 9) * 100 + pick([0, 50]) : rand(101, 899);
      return { type: 'column', q: `There is 1 ${unit === 'g' ? 'kg' : 'l'} of ${thing}. ${used} ${unit} is used. Work out <b>1000 − ${used}</b> to find what is left.`, a: whole, b: used, op: '−', steps: V.columnMethod(whole, used, '−').steps };
    },
    word() {
      const n = U.name(), used = rand(120, 880);
      const [unit, big1, thing, emo] = pick([['g', 'kg', 'flour', '🍰'], ['ml', 'l', 'orange juice', '🧃']]);
      return {
        type: 'guided', story: true, scene: emo,
        q: `${n} has a <b>1 ${big1}</b> pack of ${thing} and uses <b>${used} ${unit}</b>. How much is left?`,
        parts: [
          { say: `How many ${unit} are in 1 ${big1}?`, answer: 1000, suffix: unit },
          opChoice('−', '“Left” means take away.'),
          { say: `Work out 1000 − ${used}:`, type: 'column', a: 1000, b: used, op: '−' },
          { say: 'How much is left?', answer: 1000 - used, suffix: unit },
        ],
      };
    },
  };

  function msNums(y) {
    const kind = pick([['cm', '📏'], ['g', '⚖️'], ['ml', '🧃']]);
    const hi = y === 3 ? 999 : 9999;
    const a = rand(y === 3 ? 120 : 1200, hi - 400), b = rand(y === 3 ? 25 : 150, Math.min(a - 10, hi - a));
    return { a, b, unit: kind[0], emo: kind[1] };
  }
  function estimateParts(a, b, op) {
    return [
      { say: `Estimate first. Round ${fmt(a)} to the nearest 10:`, answer: r10(a) },
      { say: `Round ${fmt(b)} to the nearest 10:`, answer: r10(b) },
      { say: `Estimate: ${fmt(r10(a))} ${op} ${fmt(r10(b))} = ?`, answer: op === '+' ? r10(a) + r10(b) : r10(a) - r10(b), after: 'Our exact answer should be close to this.' },
    ];
  }
  const addSubMeasures = {
    id: 'add-sub-measures', title: 'Add and subtract measures', years: [3, 4], icon: '➕',
    desc: 'Keep the same unit, estimate, then use columns.',
    lesson(y) {
      const s = msNums(y), t = msNums(y);
      return [
        { say: 'Lengths, masses and capacities add and subtract just like numbers. The golden rule: <b>both amounts must be in the same unit</b>.', show: big(`${fmt(s.a)} ${s.unit} + ${fmt(s.b)} ${s.unit}`) },
        { say: 'Always <b>estimate</b> first, so you can check your answer. Round each amount to the nearest 10.', try: { type: 'guided', parts: estimateParts(s.a, s.b, '+') } },
        { say: 'Now add exactly in columns.', try: { type: 'column', a: s.a, b: s.b, op: '+' } },
        { say: `${fmt(s.a + s.b)} ${s.unit} is close to our estimate ✔️. Subtracting works the same way.`, try: { type: 'column', a: t.a, b: t.b, op: '−' } },
        { say: 'Your turn: a real problem!', try: addSubMeasures.word(y) },
      ];
    },
    gen(y) {
      const { a, b, unit } = msNums(y);
      const op = pick(['+', '−']);
      if (Math.random() < 0.5) {
        return { type: 'guided', q: `${fmt(a)} ${unit} ${op} ${fmt(b)} ${unit} = ?`, parts: [...estimateParts(a, b, op), { say: 'Now work it out exactly:', type: 'column', a, b, op }, { say: 'Answer:', answer: op === '+' ? a + b : a - b, suffix: unit, after: 'Is it close to your estimate? ✔️' }] };
      }
      return { type: 'column', q: `${fmt(a)} ${unit} ${op} ${fmt(b)} ${unit} = ?`, a, b, op, steps: V.columnMethod(a, b, op).steps };
    },
    word(y) {
      const n = U.name();
      const { a, b } = msNums(y);
      const [q, op, unit, emo] = pick([
        [`A path is <b>${fmt(a)} cm</b> long. ${n} paints <b>${fmt(b)} cm</b> of it. How much is not painted yet?`, '−', 'cm', '🖌️'],
        [`A parcel weighs <b>${fmt(a)} g</b>. ${n} adds a book that weighs <b>${fmt(b)} g</b>. How heavy is the parcel now?`, '+', 'g', '📦'],
        [`A tank holds <b>${fmt(a)} ml</b> of water. <b>${fmt(b)} ml</b> is poured out. How much is left?`, '−', 'ml', '🪣'],
        [`${n} runs <b>${fmt(a)} m</b> on Monday and <b>${fmt(b)} m</b> on Tuesday. How far is that altogether?`, '+', 'm', '🏃'],
      ]);
      return { type: 'guided', story: true, scene: emo, q, parts: [opChoice(op, op === '+' ? 'We put two amounts together, so we add.' : 'We find what is left, so we subtract.'), ...estimateParts(a, b, op), { say: 'Work it out in columns:', type: 'column', a, b, op }, { say: 'So the answer is:', answer: op === '+' ? a + b : a - b, suffix: unit }] };
    },
  };

  const MIX = [['m', 'cm', 100], ['kg', 'g', 1000], ['l', 'ml', 1000]];
  const mixedUnits = {
    id: 'mixed-units', title: 'Metres and centimetres together', years: [3, 4], icon: '🔀',
    desc: '1 m 25 cm = 125 cm. And back again.',
    lesson() {
      const m = rand(1, 4), c = rand(5, 95), total = m * 100 + c;
      const t2 = rand(2, 8) * 100 + rand(1, 99);
      const kg = rand(1, 5), g = rand(1, 9) * 100;
      const l = rand(1, 3), ml = pick([250, 500, 750]);
      return [
        { say: `<b>${m} m ${c} cm</b> means ${m} metre${m > 1 ? 's' : ''} <b>and</b> ${c} centimetres. Each metre is 100 cm.`, show: big(`${m} m ${c} cm = ${m * 100} cm + ${c} cm`) },
        { say: 'Change it all into centimetres.', try: { q: `${m} m ${c} cm = ? cm`, answer: total, suffix: 'cm', hint: `${m} × 100 = ${m * 100}, then add ${c}.` } },
        { say: `Backwards: <b>${t2} cm</b>. Every 100 cm makes 1 metre, so the hundreds digit tells the metres.`, try: { type: 'guided', parts: [{ say: 'How many whole metres?', answer: Math.floor(t2 / 100), suffix: 'm' }, { say: 'How many cm left over?', answer: t2 % 100, suffix: 'cm', after: `${t2} cm = ${Math.floor(t2 / 100)} m ${t2 % 100} cm` }] } },
        { say: `Mass: <b>1 kg = 1000 g</b>. So ${kg} kg ${g} g = ${kg * 1000} g + ${g} g.`, try: { q: `${kg} kg ${g} g = ? g`, answer: kg * 1000 + g, suffix: 'g' } },
        { say: `Capacity: <b>1 l = 1000 ml</b>. Your turn!`, try: { q: `${l} l ${ml} ml = ? ml`, answer: l * 1000 + ml, suffix: 'ml', hint: `${l} × 1000 = ${l * 1000}` } },
      ];
    },
    gen() {
      const [bigU, smallU, f] = pick(MIX);
      const n = rand(1, 5), r = f === 100 ? rand(1, 99) : rand(1, 19) * 50;
      if (Math.random() < 0.55) return { q: `${n} ${bigU} ${r} ${smallU} = ? ${smallU}`, answer: n * f + r, suffix: smallU, hint: `1 ${bigU} = ${f} ${smallU}`, steps: [`${n} × ${f} = ${n * f}`, `${n * f} + ${r} = <b>${n * f + r}</b>`] };
      const t = n * f + r;
      return { type: 'guided', q: `Change <b>${fmt(t)} ${smallU}</b> into ${bigU} and ${smallU}.`, parts: [{ say: `Whole ${bigU}?`, answer: n, suffix: bigU }, { say: `${smallU} left over?`, answer: r, suffix: smallU }] };
    },
  };

  /* ======================= Year 4–6 ======================= */
  const FACTS = [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['l', 'ml', 1000]];
  function convQ(y) {
    const [bigU, smallU, f] = pick(FACTS);
    const down = Math.random() < 0.5;
    let n;
    if (y <= 4) n = rand(2, 12);
    else if (f === 1000 && Math.random() < 0.4) n = pick([0.25, 0.75, 1.25, 1.75, 2.25, 0.05, 3.45]);
    else n = rand(11, 95) / 10;
    const small = Math.round(n * f);
    if (down) return { q: `${fmt(n)} ${bigU} = ? ${smallU}`, answer: small, suffix: smallU, hint: `1 ${bigU} = ${f} ${smallU}. Big → small: multiply by ${f}.`, steps: [`${fmt(n)} × ${f} = <b>${fmt(small)}</b>`] };
    return { q: `${fmt(small)} ${smallU} = ? ${bigU}`, answer: n, suffix: bigU, decimals: y >= 5, hint: `Small → big: divide by ${f}.`, steps: [`${fmt(small)} ÷ ${f} = <b>${fmt(n)}</b>`] };
  }
  const convert = {
    id: 'convert-units', title: 'Convert between units', years: [4, 6], icon: '🔁',
    desc: 'Big unit to small: multiply. Small to big: divide.',
    lesson(y) {
      const k = rand(2, 9), g = rand(2, 9) * 1000, c = rand(3, 25);
      const dec = pick([1.5, 2.5, 0.75, 3.2, 1.25]), ml = pick([750, 250, 1500, 2300]);
      const fr = [
        { say: 'Learn these facts. They are the key to every conversion!', show: V.chips(FACTS.map(([b, s, f]) => `1 ${b} = ${fmt(f)} ${s}`)) },
        { say: `Going from a <b>big</b> unit to a <b>small</b> unit, you need <b>more</b> of them, so <b>multiply</b>. ${k} km = ${k} × 1000 m.`, try: { q: `${k} km = ? m`, answer: k * 1000, suffix: 'm' } },
        { say: 'Going from a <b>small</b> unit to a <b>big</b> one, you need <b>fewer</b>, so <b>divide</b>.', try: { q: `${fmt(g)} g = ? kg`, answer: g / 1000, suffix: 'kg', hint: '÷ 1000' } },
        { say: '1 cm = 10 mm. Each centimetre on a ruler has 10 tiny millimetre marks.', show: ruler(4, null, { mm: true, scale: 90 }), try: { q: `${c} cm = ? mm`, answer: c * 10, suffix: 'mm' } },
      ];
      if (y >= 5) {
        fr.push({ say: `Decimals too! When you × 1000 the digits move <b>3 places</b> to the left: ${dec} kg = ${fmt(dec * 1000)} g.`, show: big(`${dec} kg × 1000 = ${fmt(dec * 1000)} g`), try: { q: `${dec} l = ? ml`, answer: Math.round(dec * 1000), suffix: 'ml' } });
        fr.push({ say: 'And ÷ 1000 moves them 3 places to the right.', try: { q: `${fmt(ml)} ml = ? l`, answer: ml / 1000, suffix: 'l', decimals: true, hint: `${ml} ÷ 1000` } });
      }
      fr.push({ say: 'Your turn!', try: convQ(y) });
      return fr;
    },
    gen(y) { return convQ(y); },
    word(y) {
      const n = U.name(), km = y <= 4 ? rand(3, 9) : pick([5, 10, 3, 4]), done = rand(11, km * 10 - 1) * 100;
      return {
        type: 'guided', story: true, scene: '🏃',
        q: `${n} is running a <b>${km} km</b> race and has run <b>${fmt(done)} m</b> so far. How many metres are left?`,
        parts: [
          { say: `First change ${km} km into metres:`, answer: km * 1000, suffix: 'm' },
          opChoice('−', 'We need what is left, so subtract.'),
          { say: `Work out ${fmt(km * 1000)} − ${fmt(done)}:`, type: 'column', a: km * 1000, b: done, op: '−' },
          { say: 'Metres left:', answer: km * 1000 - done, suffix: 'm' },
        ],
      };
    },
  };

  const perimeter = {
    id: 'perimeter', title: 'Perimeter of rectangles', years: [4, 6], icon: '🔲',
    desc: 'The distance all the way round a shape.',
    lesson(y) {
      const w = rand(4, 12), h = rand(2, w - 1), s = rand(3, 9);
      const w2 = rand(5, 15), h2 = rand(2, 9), P2 = 2 * (w2 + h2);
      const fr = [
        { say: 'The <b>perimeter</b> is the distance <b>all the way round</b> the edge of a shape. Imagine an ant 🐜 walking round the edge once.', show: rect(w, h, 'cm', { ant: true, all: true }) },
        { say: 'Add up all four sides.', show: rect(w, h, 'cm', { all: true }), try: { q: `${w} + ${h} + ${w} + ${h} = ?`, answer: 2 * (w + h), suffix: 'cm' } },
        { say: `A rectangle's opposite sides are <b>equal</b>. So a quicker way: add one long side and one short side, then <b>double</b> it.`, show: rect(w, h, 'cm'),
          try: { type: 'guided', parts: [{ say: `${w} + ${h} = ?`, answer: w + h }, { say: `Double it: ${w + h} × 2 = ?`, answer: 2 * (w + h), suffix: 'cm' }] } },
        { say: 'A <b>square</b> has 4 equal sides, so its perimeter is 4 × one side.', show: rect(s, s, 'cm'), try: { q: `Perimeter of a square with sides of ${s} cm?`, answer: 4 * s, suffix: 'cm' } },
      ];
      if (y >= 5) fr.push({ say: `Backwards: a rectangle has a perimeter of <b>${P2} cm</b> and one side is <b>${w2} cm</b>. Half the perimeter is one long side + one short side.`, show: rect(w2, h2, 'cm', { hideRight: true }),
        try: { type: 'guided', parts: [{ say: `Half of ${P2} = ?`, answer: P2 / 2 }, { say: `${P2 / 2} − ${w2} = ? (the other side)`, answer: h2, suffix: 'cm' }] } });
      fr.push({ say: 'Your turn!', try: perimeter.gen(y) });
      return fr;
    },
    gen(y) {
      const r = Math.random();
      const u = pick(['cm', 'm']);
      if (r < 0.25) { const s = rand(3, 15); return { q: 'What is the perimeter of this square?', visual: rect(s, s, u), answer: 4 * s, suffix: u, hint: '4 equal sides: 4 × side.' }; }
      const w = rand(4, y >= 5 ? 25 : 15), h = rand(2, w - 1);
      if (y >= 5 && r > 0.7) return { type: 'guided', q: `A rectangle has a perimeter of <b>${2 * (w + h)} ${u}</b>. One side is <b>${w} ${u}</b>. How long is the other side?`, visual: rect(w, h, u, { hideRight: true }), parts: [{ say: 'Half the perimeter?', answer: w + h }, { say: 'The other side?', answer: h, suffix: u }] };
      return { q: 'What is the perimeter of this rectangle?', visual: rect(w, h, u), answer: 2 * (w + h), suffix: u, hint: 'Opposite sides are equal. Add all four sides.', steps: [`${w} + ${h} = ${w + h}`, `${w + h} × 2 = <b>${2 * (w + h)} ${u}</b>`] };
    },
    word(y) {
      const n = U.name(), w = rand(5, y >= 5 ? 30 : 15), h = rand(3, w - 1), post = pick([2, 3]);
      return {
        type: 'guided', story: true, scene: '🌱',
        q: `${n} wants to put a fence all the way round a garden that is <b>${w} m</b> long and <b>${h} m</b> wide. How much fence is needed?`,
        visual: rect(w, h, 'm', { fill: '#bbf7d0' }),
        parts: [
          { say: 'All the way round means we need the…', type: 'choice', choices: [{ v: 'p', html: 'perimeter' }, { v: 'l', html: 'length only' }], answer: 'p' },
          { say: `${w} + ${h} = ?`, answer: w + h },
          { say: 'Double it:', answer: 2 * (w + h), suffix: 'm', after: `${n} needs ${2 * (w + h)} m of fence.` },
          ...(y >= 5 ? [{ say: `The fence costs ${U.settings.currency}${post} per metre. How much is that?`, answer: post * 2 * (w + h), prefix: U.settings.currency }] : []),
        ],
      };
    },
  };

  /* ---- multi-step problems ---- */
  function recipeQ() {
    const people = 4;
    const [ing, amt, unit, emo] = pick([['flour', pick([200, 250, 300, 350]), 'g', '🍪'], ['milk', pick([300, 400, 500]), 'ml', '🥞'], ['sugar', pick([100, 150, 120]), 'g', '🧁']]);
    const want = pick([8, 12, 2, 6]);
    const parts = [];
    if (want === 2) parts.push({ say: `${want} people is half of ${people}. Half of ${amt} ${unit}?`, answer: amt / 2, suffix: unit });
    else if (want === 6) { parts.push({ say: `First find the amount for 2 people (half of ${amt}):`, answer: amt / 2, suffix: unit }); parts.push({ say: `6 people = 4 people + 2 people: ${amt} + ${amt / 2} = ?`, answer: amt * 1.5, suffix: unit }); }
    else { parts.push({ say: `${want} people is ${want / people} times as many. ${amt} × ${want / people} = ?`, type: 'column', a: amt, b: want / people, op: '×' }); parts.push({ say: 'How much is needed?', answer: amt * (want / people), suffix: unit }); }
    return { type: 'guided', story: true, scene: emo, q: `A recipe for <b>${people} people</b> needs <b>${amt} ${unit}</b> of ${ing}. How much ${ing} do you need for <b>${want} people</b>?`, parts, doneMsg: `For ${want} people you need ${fmt(amt * want / people)} ${unit}.` };
  }
  function journeyQ() {
    const km = pick([1.2, 1.5, 2.3, 0.8, 1.75]), m = rand(2, 9) * 100 + pick([0, 50]);
    const a = Math.round(km * 1000);
    return { type: 'guided', story: true, scene: '🚶', q: `${U.name()} walks <b>${km} km</b> to the park, then <b>${fmt(m)} m</b> to the shop. How far is that in metres?`,
      parts: [{ say: `${km} km in metres?`, answer: a, suffix: 'm', hint: '× 1000' }, opChoice('+', 'Two distances together: add.'), { say: `${fmt(a)} + ${fmt(m)}:`, type: 'column', a, b: m, op: '+' }, { say: 'Total distance:', answer: a + m, suffix: 'm' }] };
  }
  function parcelQ() {
    const kg = pick([1.25, 1.5, 2.4, 0.75, 1.2]), k = rand(2, 5), g = Math.round(kg * 1000);
    return { type: 'guided', story: true, scene: '📦', q: `A parcel weighs <b>${kg} kg</b>. How many grams do <b>${k}</b> parcels like this weigh?`,
      parts: [{ say: `${kg} kg in grams?`, answer: g, suffix: 'g' }, opChoice('×', `${k} equal parcels: multiply.`), { say: `${fmt(g)} × ${k}:`, type: 'column', a: g, b: k, op: '×' }, { say: `${k} parcels weigh:`, answer: g * k, suffix: 'g' }] };
  }
  function bottleQ() {
    const l = pick([1, 2, 1.5]), glass = pick([150, 200, 250, 300]), k = rand(2, Math.floor((l * 1000) / glass) - 1), ml = l * 1000;
    return { type: 'guided', story: true, scene: '🧃', q: `A bottle holds <b>${l} l</b> of juice. ${U.name()} pours <b>${k} glasses</b> of <b>${glass} ml</b>. How much juice is left in the bottle?`,
      parts: [{ say: `${l} l in ml?`, answer: ml, suffix: 'ml' }, { say: `Juice poured: ${glass} × ${k} = ?`, answer: glass * k, suffix: 'ml' }, { say: `Left: ${fmt(ml)} − ${fmt(glass * k)}`, type: 'column', a: ml, b: glass * k, op: '−' }, { say: 'Juice left:', answer: ml - glass * k, suffix: 'ml' }] };
  }
  const multiStep = {
    id: 'measure-problems', title: 'Multi-step measure problems', years: [5, 6], icon: '🧩',
    desc: 'Recipes, journeys, parcels and bottles — one step at a time.',
    lesson() {
      return [
        { say: 'Real problems often need <b>more than one step</b>. A good plan: 1️⃣ make all the units the <b>same</b>, 2️⃣ decide the operation, 3️⃣ calculate (estimate, then columns), 4️⃣ answer with the <b>unit</b>.', show: V.chips(['same units', 'which operation?', 'calculate', 'answer + unit']) },
        { say: 'Let\'s try a journey. The units are different, so change km into m first.', try: journeyQ() },
        { say: 'Now a recipe. If there are more people, you need more of everything.', try: recipeQ() },
        { say: 'Your turn: a bottle of juice!', try: bottleQ() },
      ];
    },
    gen() { return pick([recipeQ, journeyQ, parcelQ, bottleQ])(); },
    word() { return pick([recipeQ, journeyQ, parcelQ, bottleQ])(); },
  };

  /* ======================= explorer ======================= */
  function explore(root, y) {
    const big2 = y >= 3;
    root.innerHTML = `
      <div class="explorer">
        <p class="ex-intro">Fill the jug and stretch the ribbon. Watch the units change!</p>
        <div class="ex-controls">
          <label>Water <input type="range" id="w" min="0" max="${big2 ? 1000 : 100}" step="${big2 ? 50 : 5}" value="${big2 ? 350 : 40}"><output id="ow"></output></label>
          <label>Ribbon <input type="range" id="r" min="1" max="${big2 ? 150 : 14}" value="${big2 ? 75 : 6}"><output id="or"></output></label>
        </div>
        <div class="ex-split"><div id="jug"></div><div id="facts" class="side-text"></div></div>
        <div id="rib" class="row-center"></div>
      </div>`;
    const Wv = root.querySelector('#w'), Rv = root.querySelector('#r');
    function draw() {
      const w = +Wv.value, r = +Rv.value;
      root.querySelector('#ow').textContent = `${w} ml`;
      root.querySelector('#or').textContent = `${r} cm`;
      root.querySelector('#jug').innerHTML = jug(w, big2 ? { max: 1000, minor: 50, step: 250 } : { max: 100, minor: 5, step: 20 });
      root.querySelector('#facts').innerHTML = `<p class="say-big">${w} ml</p>${big2 ? `<p>= ${fmt(w / 1000)} l${w >= 1000 ? ' (a full litre!)' : ''}</p><p>${1000 - w} ml more to fill 1 litre</p>` : `<p>${100 - w} ml more to fill the jug</p>`}`;
      root.querySelector('#rib').innerHTML = big2
        ? `${tape(Math.min(r, 99))}<p class="center"><b>${r} cm</b>${r >= 100 ? ` = 1 m ${r - 100} cm` : ` · ${100 - r} cm more makes 1 m`} · ${r * 10} mm</p>`
        : `${ruler(15, { start: 0, len: r, ...LONG[2] })}<p class="center"><b>${r} cm</b></p>`;
    }
    Wv.oninput = draw; Rv.oninput = draw;
    draw();
  }

  TOPICS.push({
    id: 'measures', name: 'Measures', icon: '📏', color: '#10b981', minYear: 1,
    tagline: 'Length, mass and capacity',
    explore,
    skills: [compareLength, compareMass, capacityWords, nonStandard, rulerCm, readScales, compareMeasures, unitsChoice, metreBonds, addSubMeasures, mixedUnits, convert, perimeter, multiStep],
  });
})();
