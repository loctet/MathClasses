'use strict';
/* Visual builders. Each function returns an HTML or SVG string. */
const V = (() => {
  let uid = 0;
  const EMOJI = ['🍎', '🍓', '⭐', '🐟', '🍪', '🎈', '🌸', '🐞', '⚽', '🧁', '🍌', '🦆', '🚗', '🐣'];
  const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'];
  const INK = '#334155';

  /* ---------- objects (emoji counters) ---------- */
  function objects(n, emoji = '🍎', o = {}) {
    const crossed = o.crossed || 0;
    const per = o.perRow || 5;
    let s = `<div class="objs" style="--per:${Math.min(per, Math.max(n, 1))}">`;
    for (let i = 0; i < n; i++) {
      s += `<span class="obj${i >= n - crossed ? ' gone' : ''}" style="animation-delay:${i * 0.03}s">${emoji}</span>`;
    }
    return s + '</div>';
  }

  /* ---------- number line ---------- */
  function niceStep(r) {
    for (const s of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000, 100000]) {
      if (r / s <= 12) return s;
    }
    return 10 ** Math.ceil(Math.log10(r / 10));
  }

  /**
   * o = {min, max, step, jumps:[{from,to,label}], points:[{v,label,emoji,color}],
   *      empty (only mark jump ends), marks, label(fn), signColors, width}
   */
  function numberLine(o) {
    const { min, max } = o;
    const W = o.width || 640;
    const hasJ = o.jumps && o.jumps.length;
    const H = o.height || (hasJ ? 130 : (o.points && o.points.some((p) => p.emoji) ? 100 : 72));
    const pad = 26;
    const y = H - 34;
    const X = (v) => pad + ((v - min) * (W - 2 * pad)) / (max - min);
    const lab = o.label || ((v) => U.fmt(v));
    const id = 'nl' + ++uid;
    const colors = { fw: '#16a34a', bw: '#ea580c' };
    let s = `<svg class="nl" viewBox="0 0 ${W} ${H}" role="img" aria-label="number line"><defs>`;
    for (const [k, c] of Object.entries(colors)) {
      s += `<marker id="${id}${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
    }
    s += `<marker id="${id}ax" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${INK}"/></marker></defs>`;
    s += `<line x1="${pad - 18}" y1="${y}" x2="${W - pad + 18}" y2="${y}" class="nl-axis" marker-start="url(#${id}ax)" marker-end="url(#${id}ax)"/>`;

    const range = max - min;
    let marks = [];
    if (o.empty) {
      const set = new Set(o.marks || []);
      (o.jumps || []).forEach((j) => { set.add(j.from); set.add(j.to); });
      marks = [...set].map((v) => ({ v, label: true }));
    } else {
      const step = o.step || niceStep(range);
      const minor = o.minor || (range <= 50 ? Math.min(1, step) : step);
      for (let v = Math.ceil(min / minor) * minor; v <= max + 1e-9; v += minor) {
        marks.push({ v, label: Math.abs(v % step) < 1e-9 || v === 0 });
      }
    }
    marks.forEach(({ v, label }) => {
      const x = X(v);
      const z = v === 0 && !o.empty;
      const big = label;
      s += `<line x1="${x}" y1="${y - (big ? 9 : 5) - (z ? 4 : 0)}" x2="${x}" y2="${y + (big ? 9 : 5) + (z ? 4 : 0)}" class="nl-tick${z ? ' zero' : ''}"/>`;
      if (label) {
        const cls = o.signColors ? (v < 0 ? ' neg' : v > 0 ? ' pos' : ' zero') : (z ? ' zero' : '');
        s += `<text x="${x}" y="${y + 28}" class="nl-lab${cls}">${lab(v)}</text>`;
      }
    });
    (o.jumps || []).forEach((j, k) => {
      if (j.from === j.to) return;
      const x1 = X(j.from), x2 = X(j.to);
      const dir = j.to >= j.from ? 'fw' : 'bw';
      const c = colors[dir];
      const h = Math.min(y - 30, 16 + Math.abs(x2 - x1) * 0.3);
      const yy = y - 4;
      s += `<path d="M${x1} ${yy} Q${(x1 + x2) / 2} ${yy - 2 * h} ${x2} ${yy}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" marker-end="url(#${id}${dir})" class="nl-jump" pathLength="100" style="animation-delay:${k * 0.45}s"/>`;
      if (j.label) s += `<text x="${(x1 + x2) / 2}" y="${yy - h - 8}" class="nl-jlab" fill="${c}" style="animation-delay:${k * 0.45 + 0.3}s">${j.label}</text>`;
    });
    (o.points || []).forEach((p) => {
      const x = X(p.v);
      if (p.emoji) s += `<text x="${x}" y="${y - 12}" class="nl-emoji">${p.emoji}</text>`;
      else s += `<circle cx="${x}" cy="${y}" r="7" fill="${p.color || '#7c3aed'}" stroke="#fff" stroke-width="2"/>`;
      if (p.label) s += `<text x="${x}" y="${y - (p.emoji ? 46 : 16)}" class="nl-plab" fill="${p.color || '#7c3aed'}">${p.label}</text>`;
    });
    return s + '</svg>';
  }

  /** Jumps that add/subtract b from a in place-value chunks (hundreds, tens, ones). */
  function splitJumps(a, b, sign = 1) {
    const parts = decompose(b);
    const jumps = [];
    let cur = a;
    parts.forEach((p) => {
      const nxt = cur + sign * p;
      jumps.push({ from: cur, to: nxt, label: (sign > 0 ? '+' : '−') + U.fmt(p) });
      cur = nxt;
    });
    return jumps;
  }
  function jumpLine(jumps, label) {
    const vals = jumps.flatMap((j) => [j.from, j.to]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const padv = Math.max(1, (hi - lo) * 0.08);
    return numberLine({ min: lo - padv, max: hi + padv, jumps, empty: true, label });
  }

  /* ---------- base-10 blocks ---------- */
  function base10(n, o = {}) {
    const u = o.unit || 6;
    const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), on = n % 10;
    const H = u * 10;
    let x = 4, s = '';
    for (let i = 0; i < h; i++) {
      s += `<rect x="${x}" y="4" width="${H}" height="${H}" fill="#93c5fd" stroke="#1d4ed8" stroke-width="1.5"/>`;
      for (let k = 1; k < 10; k++) {
        s += `<line x1="${x + k * u}" y1="4" x2="${x + k * u}" y2="${4 + H}" stroke="#1d4ed8" stroke-opacity=".35"/>`;
        s += `<line x1="${x}" y1="${4 + k * u}" x2="${x + H}" y2="${4 + k * u}" stroke="#1d4ed8" stroke-opacity=".35"/>`;
      }
      x += H + 8;
    }
    for (let i = 0; i < t; i++) {
      s += `<rect x="${x}" y="4" width="${u}" height="${H}" fill="#86efac" stroke="#15803d" stroke-width="1.5"/>`;
      for (let k = 1; k < 10; k++) s += `<line x1="${x}" y1="${4 + k * u}" x2="${x + u}" y2="${4 + k * u}" stroke="#15803d" stroke-opacity=".45"/>`;
      x += u + 4;
    }
    if (t) x += 4;
    const colsN = Math.ceil(on / 5);
    for (let i = 0; i < on; i++) {
      const col = Math.floor(i / 5), row = i % 5;
      s += `<rect x="${x + col * (u + 3)}" y="${4 + H - u - row * (u + 3)}" width="${u}" height="${u}" fill="#fcd34d" stroke="#b45309" stroke-width="1.2"/>`;
    }
    x += colsN * (u + 3);
    const W = Math.max(x + 4, 20);
    return `<figure class="b10"><svg viewBox="0 0 ${W} ${H + 8}" width="${W * 1.25}" height="${(H + 8) * 1.25}" role="img" aria-label="${n} in base ten blocks">${s}</svg><figcaption>${n}</figcaption></figure>`;
  }

  /* ---------- arrays & groups ---------- */
  const DOTC = ['#f43f5e', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4'];
  function array(r, c, o = {}) {
    const g = o.gap || 26, rad = g * 0.36;
    const W = c * g + 8, H = r * g + 8;
    let s = `<svg class="arr" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${r} rows of ${c}">`;
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        s += `<circle cx="${4 + g / 2 + j * g}" cy="${4 + g / 2 + i * g}" r="${rad}" fill="${DOTC[i % DOTC.length]}" class="arr-dot" style="animation-delay:${(i * c + j) * 0.01}s"/>`;
      }
    }
    return s + '</svg>';
  }
  function groups(n, k, emoji = '🍪') {
    const each = Math.floor(n / k), rem = n - each * k;
    let s = '<div class="groups">';
    for (let i = 0; i < k; i++) {
      s += `<div class="plate"><div class="plate-items">${('<span>' + emoji + '</span>').repeat(each)}</div><span class="plate-n">${each}</span></div>`;
    }
    if (rem) s += `<div class="plate left"><div class="plate-items">${('<span>' + emoji + '</span>').repeat(rem)}</div><span class="plate-n">${rem} left over</span></div>`;
    return s + '</div>';
  }

  /* ---------- multiplication grid (area model) ---------- */
  function decompose(n) {
    const out = [];
    let p = 1;
    n = Math.round(n);
    while (n > 0) { const d = n % 10; if (d) out.unshift(d * p); n = Math.floor(n / 10); p *= 10; }
    return out.length ? out : [0];
  }
  function areaModel(a, b) {
    const A = decompose(a), B = decompose(b);
    let s = '<table class="area"><tr><th class="corner">×</th>' + B.map((x) => `<th>${U.fmt(x)}</th>`).join('') + '</tr>';
    A.forEach((x, i) => {
      s += `<tr><th>${U.fmt(x)}</th>` + B.map((y, j) => `<td class="c${(i + j) % 4}">${U.fmt(x * y)}</td>`).join('') + '</tr>';
    });
    return s + '</table>';
  }

  /* ---------- fractions ---------- */
  const FC = '#f472b6';
  function pie(n, d, o = {}) {
    const S = o.size || 110, r = S / 2 - 4, c = S / 2, col = o.color || FC;
    let s = `<svg class="pie" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${n} out of ${d} parts shaded">`;
    if (d === 1) s += `<circle cx="${c}" cy="${c}" r="${r}" fill="${n >= 1 ? col : '#fff'}" stroke="${INK}" stroke-width="2"/>`;
    else {
      for (let i = 0; i < d; i++) {
        const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
        const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0), x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
        s += `<path d="M${c} ${c}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${1 / d > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${i < n ? col : '#fff'}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
      }
    }
    return s + '</svg>';
  }
  function bar(n, d, o = {}) {
    const W = o.width || 280, h = o.height || 40, col = o.color || FC, w = W / d;
    let s = `<svg class="fbar" viewBox="0 0 ${W + 4} ${h + 4}" width="${W + 4}" height="${h + 4}" role="img" aria-label="${n} out of ${d} parts shaded">`;
    for (let i = 0; i < d; i++) {
      s += `<rect x="${2 + i * w}" y="2" width="${w}" height="${h}" fill="${i < n ? col : '#fff'}" stroke="${INK}" stroke-width="2"/>`;
      if (o.labels && w >= 26) s += `<text x="${2 + i * w + w / 2}" y="${h / 2 + 7}" class="fbar-lab">${d === 1 ? '1' : '1/' + d}</text>`;
    }
    return s + '</svg>';
  }
  /** Draw n/d, using several wholes if n > d. */
  function shape(n, d, kind = 'pie', o = {}) {
    const wholes = Math.max(1, Math.ceil(n / d));
    let s = '<div class="shapes">';
    for (let k = 0; k < wholes; k++) {
      const sh = Math.max(0, Math.min(d, n - k * d));
      s += kind === 'bar' ? bar(sh, d, o) : pie(sh, d, o);
    }
    return s + '</div>';
  }
  function frac(n, d) {
    if (d === 1) return `<span class="fnum">${U.fmt(n)}</span>`;
    const neg = n < 0;
    return `${neg ? '−' : ''}<span class="frac"><span>${Math.abs(n)}</span><span>${d}</span></span>`;
  }

  /* ---------- money ---------- */
  const COIN_SIZE = { 1: 34, 2: 38, 5: 42, 10: 40, 20: 44, 50: 48, 100: 50, 200: 54 };
  const NOTE_COL = { 500: '#94a3b8', 1000: '#f87171', 2000: '#60a5fa', 5000: '#fb923c', 10000: '#4ade80' };
  function coinLabel(c) { return c < 100 ? c + U.centUnit() : U.settings.currency + c / 100; }
  function coin(c) {
    if (c >= 500) {
      const col = NOTE_COL[c] || '#a78bfa';
      return `<svg class="note" viewBox="0 0 112 58" width="112" height="58" role="img" aria-label="${coinLabel(c)} note"><rect x="2" y="2" width="108" height="54" rx="7" fill="${col}" stroke="${INK}" stroke-width="2"/><rect x="9" y="9" width="94" height="40" rx="4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-dasharray="4 3"/><circle cx="30" cy="29" r="12" fill="#fff" fill-opacity=".45"/><text x="72" y="37" class="note-lab">${coinLabel(c)}</text></svg>`;
    }
    const S = COIN_SIZE[c] || 44, r = S / 2 - 2, m = S / 2;
    let outer, inner;
    if (c <= 5) { outer = '#d9824b'; inner = '#e9a271'; }
    else if (c <= 50) { outer = '#e4b528'; inner = '#f6d86b'; }
    else if (c === 100) { outer = '#e4b528'; inner = '#d4d4d8'; }
    else { outer = '#c7c7cc'; inner = '#f2cf55'; }
    return `<svg class="coin" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="${coinLabel(c)} coin"><circle cx="${m}" cy="${m}" r="${r}" fill="${outer}" stroke="${INK}" stroke-width="1.5"/><circle cx="${m}" cy="${m}" r="${r * 0.72}" fill="${inner}"/><text x="${m}" y="${m + S * 0.12}" class="coin-lab" style="font-size:${S * (coinLabel(c).length > 3 ? 0.26 : 0.32)}px">${coinLabel(c)}</text></svg>`;
  }
  const coins = (list) => `<div class="coins">${list.map(coin).join('')}</div>`;

  /* ---------- thermometer ---------- */
  function thermometer(t, o = {}) {
    const min = o.min ?? -10, max = o.max ?? 10;
    const W = 120, H = o.height || 300, top = 18, bottom = H - 58;
    const Y = (v) => bottom - ((v - min) * (bottom - top)) / (max - min);
    const tx = 54, tw = 18, liquid = t >= 0 ? '#ef4444' : '#3b82f6';
    const labStep = max - min <= 20 ? 2 : 5;
    let s = `<svg class="thermo" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="thermometer">`;
    s += `<rect x="${tx}" y="${top - 10}" width="${tw}" height="${bottom - top + 34}" rx="9" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
    s += `<circle cx="${tx + tw / 2}" cy="${bottom + 30}" r="19" fill="${liquid}" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="${tx + 4}" y="${Y(t)}" width="${tw - 8}" height="${bottom + 22 - Y(t)}" fill="${liquid}" class="thermo-liquid"/>`;
    for (let v = min; v <= max; v++) {
      const yy = Y(v), major = v % labStep === 0;
      s += `<line x1="${tx + tw}" y1="${yy}" x2="${tx + tw + (v === 0 ? 16 : major ? 10 : 5)}" y2="${yy}" stroke="${INK}" stroke-width="${v === 0 ? 2.5 : 1.3}"/>`;
      if (major) s += `<text x="${tx - 7}" y="${yy + 5}" class="thermo-lab${v < 0 ? ' neg' : v > 0 ? ' pos' : ' zero'}">${U.fmt(v)}</text>`;
    }
    s += `<text x="${tx + tw + 20}" y="${Y(0) + 5}" class="thermo-zero">0°C</text>`;
    if (o.showValue) s += `<text x="${W / 2}" y="${H - 2}" class="thermo-val">${U.fmt(t)}°C</text>`;
    return s + '</svg>';
  }

  /* ---------- lift / building ---------- */
  function elevator(f, o = {}) {
    const min = o.min ?? -3, max = o.max ?? 5;
    const rowH = 32, W = 210, top = 10;
    const H = (max - min + 1) * rowH + top + 10;
    const rowY = (v) => top + (max - v) * rowH;
    const groundY = rowY(0) + rowH;
    let s = `<svg class="lift" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="lift on floor ${f}">`;
    s += `<rect x="0" y="0" width="${W}" height="${groundY}" fill="#e0f2fe"/>`;
    s += `<rect x="0" y="${groundY}" width="${W}" height="${H - groundY}" fill="#e7cfa8"/>`;
    s += `<rect x="70" y="${rowY(max)}" width="120" height="${(max - min + 1) * rowH}" fill="#fff" fill-opacity=".75" stroke="${INK}" stroke-width="2"/>`;
    for (let v = max; v >= min; v--) {
      const yy = rowY(v);
      s += `<line x1="70" y1="${yy + rowH}" x2="190" y2="${yy + rowH}" stroke="${INK}" stroke-opacity=".3"/>`;
      s += `<text x="60" y="${yy + rowH / 2 + 5}" class="lift-lab${v < 0 ? ' neg' : v > 0 ? ' pos' : ' zero'}">${v === 0 ? '0 G' : U.fmt(v)}</text>`;
      if (v !== f) s += `<rect x="82" y="${yy + 8}" width="14" height="14" fill="${v < 0 ? '#c4b5fd' : '#bae6fd'}" stroke="${INK}" stroke-opacity=".4"/>`;
    }
    s += `<line x1="0" y1="${groundY}" x2="${W}" y2="${groundY}" stroke="#16a34a" stroke-width="5"/>`;
    s += `<rect x="130" y="${rowY(max)}" width="40" height="${(max - min + 1) * rowH}" fill="#f1f5f9" stroke="${INK}" stroke-opacity=".5"/>`;
    s += `<g class="lift-car" style="transform:translateY(${rowY(f)}px)"><rect x="132" y="2" width="36" height="${rowH - 4}" rx="4" fill="#facc15" stroke="${INK}" stroke-width="2"/><text x="150" y="${rowH / 2 + 6}" class="lift-emoji">🙂</text></g>`;
    return s + '</svg>';
  }

  /* ---------- column method (+ and −) ---------- */
  const placeName = (p) => (p >= 0 ? PLACES[p] : p === -1 ? 'tenths' : 'hundredths');
  const single = (w) => w.replace(/s$/, '');
  function columnMethod(a, b, op, o = {}) {
    const dp = o.dp || 0, sc = 10 ** dp;
    const A = Math.round(a * sc), B = Math.round(b * sc), R = op === '+' ? A + B : A - B;
    const str = (x) => String(x).padStart(dp + 1, '0');
    const len = Math.max(str(A).length, str(B).length, str(R).length);
    const digs = (x) => str(x).padStart(len, ' ').split('').map((c) => (c === ' ' ? null : +c));
    const da = digs(A), db = digs(B), dr = digs(R);
    const place = (i) => placeName(len - 1 - i - dp);
    const marks = Array(len).fill(null);
    const when = Array(len).fill(null); // column (from the right) being worked when this mark appeared
    const steps = [];
    if (op === '+') {
      let carry = 0;
      for (let i = len - 1; i >= 0; i--) {
        const x = da[i], y = db[i];
        if (x == null && y == null && !carry) continue;
        const sum = (x || 0) + (y || 0) + carry;
        const parts = [x, y].filter((v) => v != null);
        if (carry) parts.push('<span class="carry-t">1</span>');
        let t = `<b>${U.cap(place(i))}:</b> ${parts.join(' + ')} = ${sum}.`;
        const nc = sum >= 10 ? 1 : 0;
        if (nc && i > 0) { t += ` Write <b>${sum % 10}</b> and carry <span class="carry-t">1</span> to the ${place(i - 1)}.`; marks[i - 1] = 1; when[i - 1] = len - 1 - i; }
        else t += ` Write <b>${sum}</b>.`;
        steps.push(t);
        carry = nc;
      }
    } else {
      const cur = da.map((v) => v || 0);
      for (let i = len - 1; i >= 0; i--) {
        if (da[i] == null) continue;
        const y = db[i] || 0;
        const c = cur[i];
        const res = c < y ? c + 10 - y : c - y;
        if (dr[i] == null && db[i] == null && res === 0) { if (c < y) { cur[i] = c + 10; cur[i - 1] -= 1; when[i] = when[i - 1] = len - 1 - i; } continue; } // leading zero
        let t;
        if (c < y) {
          cur[i] = c + 10; cur[i - 1] -= 1;
          when[i] = len - 1 - i; when[i - 1] = len - 1 - i;
          if (c < 0) t = `<b>${U.cap(place(i))}:</b> this column had 0 and already gave 1 away, so it exchanges 1 from the ${place(i - 1)} too. Now it has ${cur[i]}. ${cur[i]} − ${y} = <b>${res}</b>.`;
          else t = `<b>${U.cap(place(i))}:</b> ${c} − ${y}? ${c} is too small, so exchange 1 ${single(place(i - 1))} for 10 ${place(i)}. Now ${cur[i]} − ${y} = <b>${res}</b>.`;
        } else {
          const note = c !== da[i] ? ` <span class="muted">(it gave 1 away, so ${da[i]} became ${c})</span>` : '';
          t = `<b>${U.cap(place(i))}:</b> ${c} − ${y} = <b>${res}</b>.${note}`;
        }
        steps.push(t);
      }
      cur.forEach((v, i) => { if (da[i] != null && v !== da[i]) marks[i] = v; });
    }
    const pt = dp ? len - dp : -1;
    const fromR = (i) => len - 1 - i; // 0 = rightmost column
    const shown = (i) => o.upto == null || fromR(i) < o.upto;
    const markShown = (i) => o.upto == null || (when[i] != null && when[i] < o.upto);
    const act = (i) => (o.active != null && fromR(i) === o.active ? ' act' : '');
    const row = (arr, fn, first = '', cls = '') => {
      let r = `<tr class="${cls}"><td class="op">${first}</td>`;
      arr.forEach((v, i) => { if (i === pt) r += `<td class="pt">${cls === 'marks' ? '' : '.'}</td>`; r += fn(v, i); });
      return r + '</tr>';
    };
    let h = `<table class="colm${o.active != null ? ' interactive' : ''}" role="img" aria-label="column method">`;
    h += row(marks, (v, i) => `<td class="mk${act(i)}">${v == null || !markShown(i) ? '' : v}</td>`, '', 'marks');
    h += row(da, (v, i) => `<td class="${op === '−' && marks[i] != null && markShown(i) ? 'crossed' : ''}${act(i)}">${v == null ? '' : v}</td>`);
    h += row(db, (v, i) => `<td class="${act(i)}">${v == null ? '' : v}</td>`, op);
    h += row(dr, (v, i) => (o.blank || !shown(i) ? `<td class="blank${act(i)}"></td>` : `<td class="ans${act(i)}">${v == null ? '' : v}</td>`), '', 'res');
    h += '</table>';
    return { html: h, steps };
  }

  /* ---------- clocks ---------- */
  const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  /**
   * Analogue clock. o = {size, roman, minuteNumbers, halves (past/to), quarters, sweep (shade 12 to minute hand),
   *                      noHour, noMinute, noNumbers}
   */
  function clock(h, m, o = {}) {
    const S = o.size || 220, c = S / 2, R = S / 2 - 6, pad = o.minuteNumbers ? 26 : 2;
    const pt = (deg, r) => [c + r * Math.sin((deg * Math.PI) / 180), c - r * Math.cos((deg * Math.PI) / 180)];
    const f = (v) => v.toFixed(1);
    let s = `<svg class="clock" viewBox="${-pad} ${-pad} ${S + 2 * pad} ${S + 2 * pad}" width="${S + 2 * pad}" height="${S + 2 * pad}" role="img" aria-label="clock">`;
    s += `<circle cx="${c}" cy="${c}" r="${R}" fill="#fff" stroke="${INK}" stroke-width="5"/>`;
    const sector = (a0, a1, fill) => { const [x0, y0] = pt(a0, R - 3), [x1, y1] = pt(a1, R - 3); return `<path d="M${c} ${c}L${f(x0)} ${f(y0)}A${R - 3} ${R - 3} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}Z" fill="${fill}"/>`; };
    if (o.halves) {
      s += sector(0, 180, '#dcfce7') + sector(180, 359.99, '#fee2e2');
      s += `<text x="${c + R * 0.45}" y="${c + 5}" class="ck-side past">past</text><text x="${c - R * 0.45}" y="${c + 5}" class="ck-side to">to</text>`;
    }
    if (o.quarters) [0, 90, 180, 270].forEach((a, k) => { s += sector(a, a + 90, ['#e0f2fe', '#fef3c7', '#dcfce7', '#fce7f3'][k]); });
    if (o.sweep && m > 0) s += sector(0, m * 6, '#fde68a');
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      const [x0, y0] = pt(i * 6, R - 3), [x1, y1] = pt(i * 6, R - (big ? 14 : 8));
      s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${INK}" stroke-width="${big ? 3 : 1.3}"/>`;
    }
    if (!o.noNumbers) for (let n = 1; n <= 12; n++) {
      const [x, y] = pt(n * 30, R - (o.roman ? 32 : 30));
      s += `<text x="${f(x)}" y="${f(y + 7)}" class="ck-num${o.roman ? ' roman' : ''}">${o.roman ? ROMAN[n % 12] : n}</text>`;
    }
    if (o.minuteNumbers) for (let n = 0; n < 12; n++) {
      const [x, y] = pt(n * 30, R + 16);
      s += `<text x="${f(x)}" y="${f(y + 5)}" class="ck-min">${n === 0 ? '00' : n * 5}</text>`;
    }
    if (!o.noHour) { const [x, y] = pt(((h % 12) + m / 60) * 30, R * 0.5); s += `<line x1="${c}" y1="${c}" x2="${f(x)}" y2="${f(y)}" stroke="#2563eb" stroke-width="9" stroke-linecap="round"/>`; }
    if (!o.noMinute) { const [x, y] = pt(m * 6, R * 0.8); s += `<line x1="${c}" y1="${c}" x2="${f(x)}" y2="${f(y)}" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>`; }
    s += `<circle cx="${c}" cy="${c}" r="7" fill="${INK}"/>`;
    return s + '</svg>';
  }
  /** Digital display. o = {h24, ampm} */
  function digital(h, m, o = {}) {
    const hh = o.h24 ? String(h).padStart(2, '0') : String(((h + 11) % 12) + 1);
    const ap = o.ampm ? ` <small>${h < 12 ? 'am' : 'pm'}</small>` : '';
    return `<div class="digital">${hh}<span class="colon">:</span>${String(m).padStart(2, '0')}${ap}</div>`;
  }

  /* ---------- lesson helpers ---------- */
  function tenFrame(n, emoji = '🔴', o = {}) {
    const frames = Math.max(1, Math.ceil(n / 10));
    let s = '<div class="demo-row">';
    for (let f = 0; f < frames; f++) {
      s += '<div class="ten-frame">';
      for (let k = 0; k < 10; k++) { const idx = f * 10 + k; s += `<span>${idx < n ? (o.second && idx >= n - o.second ? (o.emoji2 || '🔵') : emoji) : ''}</span>`; }
      s += '</div>';
    }
    return s + '</div>';
  }
  /** Place value table. cols e.g. ['th','h','t','o']; n number. */
  function pvTable(n, cols) {
    const names = { m: 'Millions', ht: 'Hundred thousands', tt: 'Ten thousands', th: 'Thousands', h: 'Hundreds', t: 'Tens', o: 'Ones', d1: 'Tenths', d2: 'Hundredths' };
    const all = ['m', 'ht', 'tt', 'th', 'h', 't', 'o'];
    const digits = String(Math.floor(n)).padStart(7, '0').split('');
    cols = cols || all.slice(all.length - Math.max(1, String(Math.floor(n)).length));
    let s = '<table class="pv-table"><tr>' + cols.map((c) => `<th class="${c}">${names[c]}</th>`).join('') + '</tr><tr>';
    s += cols.map((c) => `<td class="${c}">${digits[all.indexOf(c)]}</td>`).join('');
    return s + '</tr></table>';
  }
  const chips = (list, hot = []) => `<div class="demo-row">${list.map((v, i) => `<span class="chip-num${hot.includes(i) ? ' hot' : ''}">${v}</span>`).join('')}</div>`;

  return {
    tenFrame, pvTable, chips, clock, digital, ROMAN,
    EMOJI, PLACES, objects, numberLine, splitJumps, jumpLine, base10, array, groups, decompose, areaModel,
    pie, bar, shape, frac, coin, coins, coinLabel, thermometer, elevator, columnMethod,
  };
})();
