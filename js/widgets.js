'use strict';
/*
 * Interactive answer widgets and the problem runner.
 * A problem is a plain object. Its `type` picks the widget (default "number").
 * See docs/SKILLS.md for every type and its fields.
 */
const W = (() => {
  const reg = {};
  const PRAISE = ['Brilliant!', 'You\'re a star!', 'Super maths!', 'Nailed it!', 'Fantastic!', 'Great thinking!', 'Wow, well done!', 'Spot on!'];
  const OKS = ['Yes!', 'Correct!', 'Good!', 'Right!'];
  /** Fixed lines read aloud by widgets (recorded ahead of time for Nursery). */
  const FIXED_LINES = ['Here is the answer. Look carefully.', 'Tap the ones you want first.', 'Type your answer first.', 'Fill in every empty box first.', 'Read aloud is on. I will read the questions to you.'];
  const NUDGE = ['Nearly! Have another go.', 'Not quite — try again!', 'Good try! Check your working.', 'Hmm, look again carefully.'];
  const PLACES = V.PLACES;
  const placeName = (p) => (p >= 0 ? PLACES[p] : p === -1 ? 'tenths' : 'hundredths');
  const single = (w) => w.replace(/s$/, '');
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const coarse = () => window.matchMedia && matchMedia('(pointer: coarse)').matches;

  function shake(node) { if (!node) return; node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); }

  /* ---------- answers ---------- */
  function answerHTML(p) {
    if (p.answerHTML) return p.answerHTML;
    if (p.type === 'choice') { const c = (p.choices || []).find((x) => x.v === String(p.answer)); return c ? c.html : p.answer; }
    if (p.type === 'fraction') { const f = p.exact ? p.answer : U.simplify(p.answer.n, p.answer.d); return V.frac(f.n, f.d); }
    if (p.type === 'money') return U.money(Math.round(p.answer * 100));
    if (p.type === 'time') return timeStr(p);
    if (p.type === 'text') return Array.isArray(p.answer) ? p.answer[0] : p.answer;
    return (p.prefix || '') + U.fmt(p.answer) + (p.suffix || '');
  }
  /** Time answers: answer = {h, m}; h24 shows the hour with two digits (09:05). */
  const timeStr = (p) => `${p.h24 ? String(p.answer.h).padStart(2, '0') : p.answer.h}:${String(p.answer.m).padStart(2, '0')}`;
  function parseTime(raw) {
    const m = String(raw).trim().match(/^(\d{1,2})\s*[:.h]\s*(\d{2})$/);
    return m ? { h: +m[1], m: +m[2] } : null;
  }
  function check(p, raw) {
    if (p.type === 'choice') return raw === String(p.answer);
    if (p.type === 'text') {
      if (!String(raw).trim()) return null;
      return (Array.isArray(p.answer) ? p.answer : [p.answer]).some((a) => U.normWords(a) === U.normWords(raw));
    }
    if (p.type === 'time') {
      const t = parseTime(raw);
      if (!t || t.m > 59) return null;
      return t.h === p.answer.h && t.m === p.answer.m;
    }
    if (p.type === 'fraction') {
      const f = U.parseFrac(raw);
      if (!f) return null;
      const a = p.answer;
      if (p.exact) { const s = U.simplify(a.n, a.d); return f.n === s.n && f.d === s.d; }
      return f.n * a.d === a.n * f.d;
    }
    const v = U.parseNum(raw);
    if (Number.isNaN(v)) return null;
    return Math.abs(v - p.answer) <= (p.tol || 1e-6);
  }

  /**
   * Run one problem inside `host`.
   * opts: { onDone({firstTry, mistakes}), compact (lesson mode), autofocus, noHow }
   * Returns the api object.
   */
  function run(host, p, opts = {}) {
    let mistakes = 0, helped = false, finished = false;
    const type = p.type || 'number';
    host.innerHTML = `
      <div class="prob${opts.compact ? ' compact' : ''}">
        ${p.scene ? `<div class="scene" aria-hidden="true">${p.scene}</div>` : ''}
        ${p.q || p.say ? `<div class="qtext${p.story || p.scene ? ' story' : ''}">${U.canSpeak() && !opts.compact ? '<button class="spk" data-act="speak" aria-label="Read the question aloud" title="Listen">🔊</button>' : ''}${p.q || p.say}</div>` : ''}
        ${p.visual ? `<div class="qvisual">${p.visual}</div>` : ''}
        <div class="wz"></div>
        <div class="feedback" aria-live="polite"></div>
        <div class="qactions">
          ${p.hint ? '<button class="btn ghost small" data-act="hint">💡 Hint</button>' : ''}
          ${p.steps && !opts.noHow ? '<button class="btn ghost small" data-act="how">👀 Show me how</button>' : ''}
        </div>
        <div class="solution" hidden></div>
      </div>`;
    const box = host.querySelector('.prob');
    const fb = host.querySelector('.feedback');
    const api = {
      opts,
      /** Show feedback. `spoken` (text or list) is what is read aloud instead of the html. */
      say(html, cls = 'hint', spoken) { fb.className = 'feedback show ' + cls; fb.innerHTML = html; if (U.autoSpeak() && html && html.trim()) { const list = [].concat(spoken || html); list.filter(Boolean).forEach((t, i) => U.speak(t, i > 0)); } },
      mistake(msg) {
        mistakes++;
        U.sound('bad');
        shake(box);
        const nudge = U.pick(NUDGE);
        api.say('🤔 ' + (msg || nudge), 'bad', [nudge, p.hint]);
        return mistakes;
      },
      good(msg) { U.sound('click'); if (msg) api.say(msg, 'good'); },
      reveal() { helped = true; },
      complete(msg) {
        if (finished) return;
        finished = true;
        const firstTry = mistakes === 0 && !helped;
        const praise = U.pick(PRAISE);
        if (msg) api.say(msg, firstTry ? 'good' : 'bad', msg.trim() ? 'Here is the answer. Look carefully.' : '');
        else api.say(`🎉 <b>${praise}</b>${firstTry && !opts.compact ? ' +1 ⭐' : ''}`, 'good', praise);
        U.sound('ok');
        box.classList.add('solved');
        if (opts.onDone) opts.onDone({ firstTry, mistakes });
      },
      get finished() { return finished; },
    };
    host.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => {
        if (b.dataset.act === 'hint') { api.say('💡 ' + p.hint, 'hint'); U.speak(p.hint); }
        else if (b.dataset.act === 'speak') U.speak(p.q || p.say || '');
        else showSteps();
      };
    });
    function showSteps() {
      helped = true;
      const sol = host.querySelector('.solution');
      sol.hidden = false;
      sol.innerHTML = `<h3>👀 Here's how</h3><ol class="steps-list">${p.steps.filter(Boolean).map((s) => `<li>${s}</li>`).join('')}</ol>`;
      sol.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (!opts.compact && U.autoSpeak() && (p.q || p.say)) setTimeout(() => U.speak(p.q || p.say), 250);
    if (!reg[type]) throw new Error('Unknown widget type: ' + type);
    reg[type](host.querySelector('.wz'), p, api);
    return api;
  }

  /* =========================================================
   * number / money / fraction: one answer box (+ keypad)
   * fields: answer, prefix, suffix, allowNeg, decimals, exact, tol, placeholder
   * ========================================================= */
  function inputWidget(root, p, api) {
    const prefix = p.type === 'money' ? U.settings.currency : p.prefix || '';
    const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
    if (p.allowNeg) keys.push('−');
    keys.push('0');
    if (p.type === 'money' || p.decimals) keys.push('.');
    if (p.type === 'fraction') keys.push('/');
    if (p.type === 'time') keys.push(':');
    keys.push('⌫');
    const showPad = p.type !== 'text' && (!api.opts.compact || coarse());
    root.innerHTML = `
      <div class="answer-row">
        ${prefix ? `<span class="affix">${prefix}</span>` : ''}
        <input class="ans-input${p.type === 'text' ? ' txt' : ''}" autocomplete="off" inputmode="${p.type === 'fraction' || p.type === 'time' || p.type === 'text' || p.allowNeg ? 'text' : 'decimal'}" placeholder="${p.placeholder || (p.type === 'fraction' ? 'e.g. 3/4' : p.type === 'time' ? 'e.g. 4:05' : p.type === 'text' ? 'Type it in words' : '?')}" aria-label="Your answer">
        ${p.suffix ? `<span class="affix">${p.suffix}</span>` : ''}
        <button class="btn" data-check>Check</button>
      </div>
      ${showPad ? `<div class="keypad">${keys.map((k) => `<button class="key${k === '⌫' ? ' back' : ''}" data-k="${k}">${k}</button>`).join('')}</div>` : ''}`;
    const input = root.querySelector('input');
    let tries = 0, done = false;
    if (api.opts.autofocus && !coarse()) input.focus({ preventScroll: true });
    const lock = () => { done = true; input.readOnly = true; root.querySelectorAll('button').forEach((b) => { b.disabled = true; }); };
    function submit() {
      if (done) return;
      const raw = input.value;
      if (raw.trim() === '') { api.say('✍️ Type your answer first.'); return; }
      const ok = check(p, raw);
      if (ok === null) {
        if (p.type === 'fraction') api.say('Write a fraction like <b>3/4</b>.');
        else if (p.type === 'time') api.say('Write the time with a colon, like <b>4:05</b>: hours, then <b>:</b>, then two digits for the minutes.');
        else if (/[:.]\d\d$/.test(raw.trim()) && /:/.test(raw)) api.say('This box needs just <b>one number</b>, not a whole time. Type only what the question asks for.');
        else api.say('Please type a number.');
        return;
      }
      if (ok) { input.classList.add('right'); lock(); api.complete(); return; }
      tries++;
      input.classList.add('wrong');
      setTimeout(() => input.classList.remove('wrong'), 600);
      if (tries >= 2) {
        api.mistake();
        api.reveal();
        input.value = p.type === 'text' ? answerHTML(p) : p.type === 'time' ? timeStr(p) : typeof p.answer === 'object' ? `${p.answer.n}/${p.answer.d}` : p.type === 'money' ? p.answer.toFixed(2) : String(p.answer).replace('-', '−');
        lock();
        api.complete(`The answer is <b>${answerHTML(p)}</b>. ${p.steps ? 'Tap “Show me how” to see why.' : ''}`);
      } else {
        api.mistake(p.hint ? `${U.pick(NUDGE)} <span class="muted">Hint: ${p.hint}</span>` : null);
        input.select();
      }
    }
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    root.querySelector('[data-check]').onclick = submit;
    root.querySelectorAll('.key').forEach((b) => {
      b.onclick = () => {
        if (done) return;
        const k = b.dataset.k;
        if (k === '⌫') input.value = input.value.slice(0, -1);
        else input.value += k === '−' ? '-' : k;
        U.sound('click');
      };
    });
  }
  reg.number = inputWidget;
  reg.money = inputWidget;
  reg.fraction = inputWidget;
  reg.time = inputWidget;
  reg.text = inputWidget;

  /* =========================================================
   * choice: big buttons.  fields: choices:[{v, html}], answer
   * ========================================================= */
  reg.choice = function (root, p, api) {
    root.innerHTML = `<div class="choices">${p.choices.map((c) => `<button class="choice" data-v="${c.v}">${c.html}</button>`).join('')}</div>`;
    let tries = 0;
    root.querySelectorAll('.choice').forEach((b) => {
      b.onclick = () => {
        if (api.finished) return;
        if (b.dataset.v === String(p.answer)) {
          b.classList.add('right');
          root.querySelectorAll('.choice').forEach((x) => { x.disabled = true; });
          api.complete();
          return;
        }
        tries++;
        b.classList.add('wrong');
        b.disabled = true;
        if (tries >= 2 || p.choices.length <= 2) {
          api.mistake();
          api.reveal();
          root.querySelectorAll('.choice').forEach((x) => { x.disabled = true; if (x.dataset.v === String(p.answer)) x.classList.add('right'); });
          api.complete(`The answer is <b>${answerHTML(p)}</b>.`);
        } else api.mistake(p.hint ? `Hint: ${p.hint}` : null);
      };
    });
  };

  /* =========================================================
   * note: a "Got it" button (for guided steps that only explain)
   * fields: button
   * ========================================================= */
  reg.note = function (root, p, api) {
    root.innerHTML = `<button class="btn small">${p.button || 'Got it ➜'}</button>`;
    root.querySelector('button').onclick = (e) => { e.target.disabled = true; api.complete(' '); };
  };

  /* =========================================================
   * guided: several small steps, one after another.
   * fields: parts:[{say, visual, type, ...widget fields, after}]
   * ========================================================= */
  reg.guided = function (root, p, api) {
    root.innerHTML = '<div class="gsteps"></div>';
    const list = root.firstElementChild;
    let k = 0;
    function next() {
      if (k >= p.parts.length) { api.complete(p.doneMsg); return; }
      const part = p.parts[k++];
      const box = el(`<div class="gstep"><div class="gs-num">${k}</div><div class="gs-body">
        ${part.say ? `<div class="gs-say">${part.say}</div>` : ''}${part.visual ? `<div class="gs-vis">${part.visual}</div>` : ''}
        <div class="gs-w"></div><div class="gs-after" hidden></div></div></div>`);
      list.appendChild(box);
      if (U.autoSpeak() && part.say) setTimeout(() => U.speak(part.say, true), k > 1 ? 0 : 300);
      const sub = {
        opts: Object.assign({}, api.opts, { compact: true, autofocus: true }),
        say: api.say, mistake: api.mistake, reveal: api.reveal, good: api.good,
        complete(msg) {
          box.classList.add('done');
          if (part.after) { const a = box.querySelector('.gs-after'); a.hidden = false; a.innerHTML = part.after; }
          if (msg && msg.trim()) api.say(msg, 'bad', 'Here is the answer. Look carefully.'); else { const ok = U.pick(OKS); api.say('✔️ ' + ok, 'good', ok); }
          U.sound('click');
          next();
        },
        get finished() { return false; },
      };
      reg[part.type || 'number'](box.querySelector('.gs-w'), part, sub);
      if (k > 1) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    next();
  };

  /* =========================================================
   * column: written column method, digit by digit.
   * fields: a, b, op ('+', '−', '×' with one-digit b), dp, guided (default on)
   * ========================================================= */
  reg.column = function (root, p, api) {
    const op = p.op, dp = p.dp || 0, sc = 10 ** dp;
    const A = Math.round(p.a * sc), B = op === '×' ? p.b : Math.round(p.b * sc);
    const R = op === '+' ? A + B : op === '−' ? A - B : A * B;
    const str = (x) => String(x).padStart(dp + 1, '0');
    const len = Math.max(str(A).length, op === '×' ? 1 : str(B).length, str(R).length);
    const digs = (x) => str(x).padStart(len, ' ').split('').map((c) => (c === ' ' ? null : +c));
    const da = digs(A), dr = digs(R);
    const db = op === '×' ? Array(len - 1).fill(null).concat([B]) : digs(B);
    const place = (i) => placeName(len - 1 - i - dp);
    const pt = dp ? len - dp : -1;
    let guided = p.guided != null ? p.guided : U.settings.helper !== false;

    const cur = da.map((v) => v || 0);           // subtraction: current top digits
    const carryIn = Array(len).fill(0);          // addition / ×: carry into column
    const cells = Array.from({ length: len }, () => []);

    // ---- build the grid ----
    const td = (i, inner, cls = '') => { const c = `<td class="c${i} ${cls}">${inner}</td>`; return c; };
    const rowHTML = (cls, first, fn) => {
      let r = `<tr class="${cls}"><td class="op">${first}</td>`;
      for (let i = 0; i < len; i++) { if (i === pt) r += `<td class="pt">${cls === 'marks' ? '' : '.'}</td>`; r += fn(i); }
      return r + '</tr>';
    };
    const marks = rowHTML('marks', '', (i) => td(i, op === '−' ? '<span class="exv"></span>' : (i < len - 1 ? `<input class="cin" data-i="${i}" maxlength="2" inputmode="numeric" disabled aria-label="carry into ${place(i)}">` : '')));
    const top = rowHTML('top', '', (i) => td(i, da[i] == null ? '' : `<button class="dg" data-i="${i}" tabindex="-1">${da[i]}</button>`));
    const bot = rowHTML('bot', op, (i) => td(i, db[i] == null ? '' : db[i]));
    const res = rowHTML('res', '', (i) => td(i, dr[i] == null ? '' : `<input class="ain" data-i="${i}" maxlength="1" inputmode="numeric" disabled aria-label="${place(i)} answer">`));
    root.innerHTML = `
      <div class="colw">
        <label class="toggle"><input type="checkbox" ${guided ? 'checked' : ''}> 🧮 Helper steps</label>
        <table class="colm interactive">${marks}${top}${bot}${res}</table>
        <div class="col-helper" aria-live="polite"></div>
      </div>`;
    root.querySelectorAll('td[class^="c"]').forEach((c) => { const i = +c.className.match(/^c(\d+)/)[1]; cells[i].push(c); });
    const helper = root.querySelector('.col-helper');
    const ain = (i) => root.querySelector(`.ain[data-i="${i}"]`);
    const cin = (i) => root.querySelector(`.cin[data-i="${i}"]`);
    root.querySelector('.toggle input').onchange = (e) => { guided = e.target.checked; U.settings.helper = guided; U.saveSettings(); };

    let i = len - 1, phase = null, tries = 0, needs = [];
    const setActive = () => { cells.forEach((cs, k) => cs.forEach((c) => c.classList.toggle('act', k === i))); };
    function ask(html) { helper.innerHTML = `<div class="ch-say">${html}</div>`; }
    function miss(msg, fix) {
      tries++;
      if (tries >= 2 && fix) { api.mistake(msg); api.reveal(); fix(); return; }
      api.mistake(msg);
    }
    function enterOnly(input) {
      root.querySelectorAll('.ain, .cin').forEach((x) => { x.disabled = x !== input || x.readOnly; });
      if (input) { input.disabled = false; if (!coarse() || api.opts.autofocus) input.focus({ preventScroll: true }); }
    }
    // little sum box in the helper panel
    function helperInput(label, expected, onOk) {
      helper.innerHTML = `<div class="ch-say">${label} <input class="ch-in" inputmode="numeric" maxlength="3" aria-label="helper answer"> <button class="btn small">OK</button></div>`;
      const inp = helper.querySelector('input'), btn = helper.querySelector('button');
      enterOnly(null);
      if (!coarse() || api.opts.autofocus) inp.focus({ preventScroll: true });
      const go = () => {
        if (inp.value.trim() === '') return;
        if (+inp.value === expected) { inp.classList.add('right'); inp.readOnly = true; btn.disabled = true; U.sound('click'); onOk(); }
        else miss(`Not quite. ${label.replace(/<[^>]+>/g, '').replace('=', '').trim()} — count carefully.`, () => { inp.value = expected; inp.readOnly = true; btn.disabled = true; onOk(); });
      };
      btn.onclick = go;
      inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    }
    function writeDigit(expected, msg, after) {
      const box = ain(i);
      ask(msg);
      enterOnly(box);
      box.oninput = () => {
        if (box.value === '') return;
        if (+box.value === expected) { box.classList.add('right'); box.readOnly = true; tries = 0; U.sound('click'); after(); }
        else { const v = box.value; box.value = ''; miss(`${v} is not right for the ${place(i)}.`, () => { box.value = expected; box.readOnly = true; box.classList.add('right'); tries = 0; after(); }); }
      };
    }
    function writeCarry(j, expected, after) {
      const box = cin(j);
      ask(`Carry <b>${expected}</b> over to the ${place(j)}. Type it in the little box above the ${place(j)} ⬆️`);
      enterOnly(box);
      box.oninput = () => {
        if (box.value === '') return;
        if (+box.value === expected) { box.classList.add('right'); box.readOnly = true; tries = 0; U.sound('click'); after(); }
        else { box.value = ''; miss(`The carry is the tens part of the column answer.`, () => { box.value = expected; box.readOnly = true; tries = 0; after(); }); }
      };
    }

    function nextColumn() {
      i--;
      tries = 0;
      step();
    }
    function finish() {
      i = -1; setActive();
      enterOnly(null);
      helper.innerHTML = `<div class="ch-say">✅ ${U.fmt(p.a)} ${op} ${U.fmt(p.b)} = <b>${U.fmt(U.round(op === '+' ? p.a + p.b : op === '−' ? p.a - p.b : p.a * p.b, dp))}</b></div>`;
      api.complete();
    }

    function step() {
      if (i < 0) return finish();
      setActive();
      if (op === '+' || op === '×') {
        const x = da[i], y = op === '+' ? db[i] : null;
        const c = carryIn[i];
        if (x == null && y == null && !c) return finish();
        const sum = op === '+' ? (x || 0) + (y || 0) + c : (x || 0) * B + c;
        const dig = sum % 10, carry = Math.floor(sum / 10);
        const carryTxt = c ? ` + <span class="carry-t">${c}</span> carried` : '';
        const doWrite = () => writeDigit(dig, x == null && y == null
          ? `<b>${U.cap(place(i))}:</b> nothing left to ${op === '+' ? 'add' : 'multiply'} except the carried <b>${c}</b>. Write it in the answer.`
          : `<b>${U.cap(place(i))}:</b> ${guided ? `${sum} → write the <b>${dig}</b>` : 'write the answer digit'} in the ${place(i)} answer box.${carry && i > 0 && guided ? ` The <b>${carry}</b> is carried.` : ''}`,
          () => { if (carry && i > 0) { carryIn[i - 1] = carry; writeCarry(i - 1, carry, nextColumn); } else nextColumn(); });
        if (x != null && (op === '+' && y == null) && !c) {
          return writeDigit(x, `<b>${U.cap(place(i))}:</b> nothing to add here, so bring down the <b>${x}</b>.`, nextColumn);
        }
        if (guided && x != null) {
          const terms = op === '+' ? [x, y].filter((v) => v != null).join(' + ') : `${x} × ${B}`;
          helperInput(`<b>${U.cap(place(i))}:</b> ${terms}${carryTxt} =`, sum, doWrite);
        } else doWrite();
        return;
      }
      // ----- subtraction -----
      const y = db[i] || 0;
      if (da[i] == null) return finish();
      if (dr[i] == null && cur[i] - y === 0 && cur[i] >= y) { // leading zero
        ask(`<b>${U.cap(place(i))}:</b> ${cur[i]} − ${y} = 0. A zero at the front is not written.`);
        setTimeout(nextColumn, 900);
        return;
      }
      const afterExchange = () => {
        const t = cur[i];
        const doWrite = () => writeDigit(t - y, `<b>${U.cap(place(i))}:</b> write ${guided ? `<b>${t - y}</b>` : 'the answer'} in the ${place(i)} answer box.`, nextColumn);
        if (db[i] == null) writeDigit(t, `<b>${U.cap(place(i))}:</b> nothing to take away, so bring down the <b>${t}</b>.`, nextColumn);
        else if (guided) helperInput(`<b>${U.cap(place(i))}:</b> ${t} − ${y} =`, t - y, doWrite);
        else doWrite();
      };
      const needEx = cur[i] < y;
      if (!needEx) {
        if (guided && db[i] != null) {
          helper.innerHTML = `<div class="ch-say"><b>${U.cap(place(i))}:</b> ${cur[i]} − ${y}. Is ${cur[i]} big enough to take away ${y}?
            <button class="btn small" data-yn="y">Yes</button> <button class="btn small ghost" data-yn="n">No, exchange</button></div>`;
          enterOnly(null);
          helper.querySelectorAll('[data-yn]').forEach((b) => {
            b.onclick = () => { if (b.dataset.yn === 'y') { tries = 0; afterExchange(); } else miss(`${cur[i]} is bigger than (or equal to) ${y}, so no exchange is needed.`, afterExchange); };
          });
        } else afterExchange();
        return;
      }
      const startExchange = () => {
        needs = [i];
        phase = 'exchange';
        enterOnly(null);
        ask(`<b>${U.cap(place(i))}:</b> ${cur[i]} is too small to take away ${y}. 👆 <b>Click the ${place(i - 1)} digit</b> to exchange 1 ${single(place(i - 1))} for 10 ${place(i)}.`);
        cells[i - 1].forEach((c) => c.classList.add('pulse'));
      };
      root._afterExchange = afterExchange; // used by the digit click handler below
      if (guided) {
        helper.innerHTML = `<div class="ch-say"><b>${U.cap(place(i))}:</b> ${cur[i]} − ${y}. Is ${cur[i]} big enough to take away ${y}?
          <button class="btn small" data-yn="y">Yes</button> <button class="btn small ghost" data-yn="n">No, exchange</button></div>`;
        enterOnly(null);
        helper.querySelectorAll('[data-yn]').forEach((b) => {
          b.onclick = () => { if (b.dataset.yn === 'n') { tries = 0; startExchange(); } else miss(`${cur[i]} is smaller than ${y}! We can't take ${y} away from ${cur[i]}.`, startExchange); };
        });
      } else startExchange();
    }

    function markChanged(j) {
      const ex = cells[j][0].querySelector('.exv');
      if (ex) ex.textContent = cur[j];
      const dg = cells[j][1].querySelector('.dg');
      if (dg) dg.classList.add('crossed');
    }
    root.querySelectorAll('.dg').forEach((b) => {
      b.onclick = () => {
        if (op !== '−') return;
        const j = +b.dataset.i;
        if (phase !== 'exchange') { api.say('Only click a digit when you need to exchange.'); return; }
        const tgt = needs[needs.length - 1];
        if (j !== tgt - 1) { miss(`Exchange from the column right next door: the <b>${place(tgt - 1)}</b>.`); return; }
        if (cur[j] === 0) {
          needs.push(j);
          cells.forEach((cs) => cs.forEach((c) => c.classList.remove('pulse')));
          cells[j - 1].forEach((c) => c.classList.add('pulse'));
          ask(`The ${place(j)} has <b>0</b> — nothing to give! First it must exchange from the <b>${place(j - 1)}</b>. Click the ${place(j - 1)} digit.`);
          return;
        }
        cur[j] -= 1; cur[tgt] += 10;
        markChanged(j); markChanged(tgt);
        U.sound('click');
        needs.pop();
        cells.forEach((cs) => cs.forEach((c) => c.classList.remove('pulse')));
        if (needs.length) {
          const t2 = needs[needs.length - 1];
          cells[t2 - 1].forEach((c) => c.classList.add('pulse'));
          ask(`Now the ${place(tgt)} has <b>${cur[tgt]}</b>. Click it to pass 1 ${single(place(tgt))} on to the ${place(t2)}.`);
        } else {
          phase = null;
          tries = 0;
          ask(`1 ${single(place(j))} became 10 ${place(tgt)}: now the ${place(tgt)} has <b>${cur[tgt]}</b>.`);
          setTimeout(() => root._afterExchange(), 700);
        }
      };
    });
    step();
  };

  /* =========================================================
   * busstop: short division, digit by digit.  fields: n, d
   * ========================================================= */
  reg.busstop = function (root, p, api) {
    const n = p.n, d = p.d, ds = String(n).split('').map(Number);
    const L = ds.length;
    let j = 0, rem = 0, tries = 0, started = false;
    root.innerHTML = `
      <div class="colw">
        <table class="bus">
          <tr class="qrow"><td></td>${ds.map((_, k) => `<td><input class="ain" data-k="${k}" maxlength="1" inputmode="numeric" disabled aria-label="answer digit ${k + 1}"></td>`).join('')}<td class="rlab"></td></tr>
          <tr class="drow"><td class="dv">${d}</td>${ds.map((x, k) => `<td class="dd${k === 0 ? ' first' : ''}"><sup class="cr" data-k="${k}"></sup>${x}</td>`).join('')}<td></td></tr>
        </table>
        <div class="tstrip">${Array.from({ length: 10 }, (_, k) => `<span>${k} × ${d} = ${k * d}</span>`).join('')}</div>
        <div class="col-helper" aria-live="polite"></div>
      </div>`;
    const helper = root.querySelector('.col-helper');
    const cellIn = (k) => root.querySelector(`.ain[data-k="${k}"]`);
    function miss(msg, fix) { tries++; api.mistake(msg); if (tries >= 2 && fix) { api.reveal(); fix(); } }
    function setAct() { root.querySelectorAll('.dd').forEach((c, k) => c.classList.toggle('act', k === j)); }
    function hlStrip(cur) { root.querySelectorAll('.tstrip span').forEach((s, k) => { s.classList.toggle('fit', k * d <= cur); s.classList.toggle('best', k === Math.floor(cur / d)); }); }
    function step() {
      if (j >= L) {
        root.querySelectorAll('.dd').forEach((c) => c.classList.remove('act'));
        helper.innerHTML = `<div class="ch-say">✅ ${U.fmt(n)} ÷ ${d} = <b>${U.fmt(Math.floor(n / d))}${n % d ? ` r ${n % d}` : ''}</b></div>`;
        return api.complete();
      }
      tries = 0;
      setAct();
      const cur = rem * 10 + ds[j], q = Math.floor(cur / d), r = cur % d;
      hlStrip(cur);
      if (!started && q === 0 && j < L - 1) {
        helper.innerHTML = `<div class="ch-say">How many ${d}s in <b>${cur}</b>? None — ${d} is bigger than ${cur}. So we carry the ${cur} to the next digit.</div>`;
        rem = cur;
        root.querySelector(`.cr[data-k="${j + 1}"]`).textContent = rem;
        j++;
        setTimeout(step, 1100);
        return;
      }
      started = true;
      const box = cellIn(j);
      helper.innerHTML = `<div class="ch-say">How many <b>${d}s</b> fit into <b>${cur}</b>? Use the table strip 👇 then write it on top.</div>`;
      root.querySelectorAll('.ain').forEach((x) => { x.disabled = x !== box; });
      box.focus({ preventScroll: true });
      box.oninput = () => {
        if (box.value === '') return;
        if (+box.value === q) { box.classList.add('right'); box.readOnly = true; afterQ(); }
        else { const v = +box.value; box.value = ''; miss(v * d > cur ? `${v} × ${d} = ${v * d}. That is more than ${cur}!` : `${v} × ${d} = ${v * d}. Can you fit in one more ${d}?`, () => { box.value = q; box.readOnly = true; afterQ(); }); }
      };
      function afterQ() {
        tries = 0;
        U.sound('click');
        if (r === 0) { rem = 0; j++; step(); return; }
        helper.innerHTML = `<div class="ch-say">${q} × ${d} = ${q * d}. What is left over? ${cur} − ${q * d} = <input class="ch-in" inputmode="numeric" maxlength="2"> <button class="btn small">OK</button></div>`;
        const inp = helper.querySelector('input'), btn = helper.querySelector('button');
        inp.focus({ preventScroll: true });
        const go = () => {
          if (inp.value === '') return;
          if (+inp.value === r) done();
          else { inp.value = ''; miss(`${cur} − ${q * d} = ?`, () => { inp.value = r; done(); }); }
        };
        function done() {
          inp.readOnly = true; btn.disabled = true; U.sound('click');
          rem = r;
          if (j < L - 1) root.querySelector(`.cr[data-k="${j + 1}"]`).textContent = r;
          else root.querySelector('.rlab').innerHTML = `r ${r}`;
          j++;
          setTimeout(step, 400);
        }
        btn.onclick = go;
        inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
      }
    }
    step();
  };

  /* =========================================================
   * nlplace: click on a number line to place a number.
   * fields: min, max, answer, step (label step), snap (default 1), tol, showValue
   * ========================================================= */
  reg.nlplace = function (root, p, api) {
    const snap = p.snap || 1, tol = p.tol || 0;
    let v = null, tries = 0;
    root.innerHTML = '<div class="nlp"></div><div class="answer-row"><span class="nlp-val muted">Tap the line to place your marker</span><button class="btn" data-check>Check</button></div>';
    const box = root.querySelector('.nlp');
    const base = { min: p.min, max: p.max, step: p.step, minor: p.minor, label: p.label, signColors: p.signColors, height: 100 };
    const draw = (extra = []) => {
      const fmtv = p.label || U.fmt;
      const pts = v == null ? [] : [{ v, emoji: '📍', label: p.showValue ? fmtv(v) : '' }];
      box.innerHTML = V.numberLine(Object.assign({}, base, { points: pts.concat(extra) }));
    };
    draw();
    box.onclick = (e) => {
      if (api.finished) return;
      const svg = box.querySelector('svg');
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const x = ((e.clientX - r.left) / r.width) * vb.width;
      let val = p.min + ((x - 26) * (p.max - p.min)) / (vb.width - 52);
      val = Math.round(val / snap) * snap;
      v = Math.max(p.min, Math.min(p.max, U.round(val, 4)));
      U.sound('click');
      root.querySelector('.nlp-val').textContent = p.showValue ? `You chose ${(p.label || U.fmt)(v)}` : 'Marker placed. Check when ready!';
      draw();
    };
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      if (v == null) { api.say('Tap the number line first.'); return; }
      if (Math.abs(v - p.answer) <= tol + 1e-9) { draw([{ v: p.answer, color: '#16a34a' }]); api.complete(); return; }
      tries++;
      const dir = v < p.answer ? 'right' : 'left';
      if (tries >= 2) { api.mistake(); api.reveal(); draw([{ v: p.answer, color: '#16a34a', label: (p.label || U.fmt)(p.answer) }]); api.complete(`It goes here: <b>${(p.label || U.fmt)(p.answer)}</b> (the green dot).`); }
      else api.mistake(`A bit too far ${dir === 'right' ? 'left' : 'right'}. Move it to the <b>${dir}</b>.`);
    };
  };

  /* =========================================================
   * coins: tap coins and notes to make an amount.
   * fields: target (cents), allowed (cents list)
   * ========================================================= */
  reg.coins = function (root, p, api) {
    const allowed = p.allowed || [1, 2, 5, 10, 20, 50, 100, 200];
    let tray = [], tries = 0;
    root.innerHTML = `
      <div class="till">${allowed.map((c) => `<button class="coin-btn" data-c="${c}" aria-label="add ${V.coinLabel(c)}">${V.coin(c)}</button>`).join('')}</div>
      <div class="tray"></div>
      <div class="answer-row"><span class="total-pill">0</span><button class="btn ghost small" data-clear>Clear</button><button class="btn" data-check>Check</button></div>`;
    const trayEl = root.querySelector('.tray'), tot = root.querySelector('.total-pill');
    const sum = () => tray.reduce((s, c) => s + c, 0);
    function draw() {
      tray.sort((a, b) => b - a);
      trayEl.innerHTML = tray.length ? tray.map((c, k) => `<button class="coin-btn" data-k="${k}" aria-label="remove ${V.coinLabel(c)}">${V.coin(c)}</button>`).join('') : '<span class="muted">Tap coins to put them here</span>';
      tot.textContent = p.hideTotal ? '?' : U.cash(sum());
    }
    root.querySelector('.till').onclick = (e) => { const b = e.target.closest('[data-c]'); if (!b || api.finished) return; tray.push(+b.dataset.c); U.sound('click'); draw(); };
    trayEl.onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b || api.finished) return; tray.splice(+b.dataset.k, 1); draw(); };
    root.querySelector('[data-clear]').onclick = () => { if (!api.finished) { tray = []; draw(); } };
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      const s = sum();
      if (s === p.target) { api.complete(); return; }
      tries++;
      if (tries >= 2) {
        api.mistake(); api.reveal();
        tray = greedy(p.target, allowed); draw();
        api.complete(`Here is one way to make <b>${U.cash(p.target)}</b>.`);
      } else api.mistake(s > p.target ? `That is ${U.cash(s)} — too much! Take some away.` : `That is ${U.cash(s)} — you need ${U.cash(p.target - s)} more.`);
    };
    draw();
  };
  function greedy(t, allowed) {
    const out = [];
    [...allowed].sort((a, b) => b - a).forEach((c) => { while (t >= c) { out.push(c); t -= c; } });
    return out;
  }

  /* =========================================================
   * slice: cut a shape into equal parts and shade some.
   * fields: n, d, kind ('pie'|'bar'), fixed (already cut into d), equiv (accept equivalent)
   * ========================================================= */
  reg.slice = function (root, p, api) {
    let parts = p.fixed ? p.d : (p.start || 1), shaded = new Set(), tries = 0;
    const kind = p.kind || 'pie';
    root.innerHTML = `
      ${p.fixed ? '' : '<div class="answer-row"><span>Cut into</span><button class="btn small ghost" data-m>−</button><b class="sl-n"></b><button class="btn small ghost" data-p>+</button><span>equal parts</span></div>'}
      <div class="sl-shape"></div>
      <div class="answer-row"><span class="sl-frac"></span><button class="btn" data-check>Check</button></div>`;
    const shape = root.querySelector('.sl-shape');
    function draw() {
      if (!p.fixed) root.querySelector('.sl-n').textContent = parts;
      const col = '#f472b6';
      let s;
      if (kind === 'bar') {
        const Wd = 320, h = 70, w = Wd / parts;
        s = `<svg viewBox="0 0 ${Wd + 4} ${h + 4}" width="${Wd + 4}" class="sl-svg">`;
        for (let k = 0; k < parts; k++) s += `<rect data-s="${k}" x="${2 + k * w}" y="2" width="${w}" height="${h}" fill="${shaded.has(k) ? col : '#fff'}" stroke="#334155" stroke-width="2"/>`;
      } else {
        const S = 220, r = 104, c = 110;
        s = `<svg viewBox="0 0 ${S} ${S}" width="${S}" class="sl-svg">`;
        if (parts === 1) s += `<circle data-s="0" cx="${c}" cy="${c}" r="${r}" fill="${shaded.has(0) ? col : '#fff'}" stroke="#334155" stroke-width="2"/>`;
        else for (let k = 0; k < parts; k++) {
          const a0 = (k / parts) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / parts) * 2 * Math.PI - Math.PI / 2;
          s += `<path data-s="${k}" d="M${c} ${c}L${(c + r * Math.cos(a0)).toFixed(2)} ${(c + r * Math.sin(a0)).toFixed(2)}A${r} ${r} 0 ${1 / parts > 0.5 ? 1 : 0} 1 ${(c + r * Math.cos(a1)).toFixed(2)} ${(c + r * Math.sin(a1)).toFixed(2)}Z" fill="${shaded.has(k) ? col : '#fff'}" stroke="#334155" stroke-width="2"/>`;
        }
      }
      shape.innerHTML = s + '</svg>';
      root.querySelector('.sl-frac').innerHTML = `Shaded: ${V.frac(shaded.size, parts)}`;
    }
    shape.onclick = (e) => {
      const t = e.target.closest('[data-s]');
      if (!t || api.finished) return;
      const k = +t.dataset.s;
      shaded.has(k) ? shaded.delete(k) : shaded.add(k);
      U.sound('click');
      draw();
    };
    if (!p.fixed) {
      root.querySelector('[data-m]').onclick = () => { if (parts > 1 && !api.finished) { parts--; shaded = new Set([...shaded].filter((k) => k < parts)); draw(); } };
      root.querySelector('[data-p]').onclick = () => { if (parts < 12 && !api.finished) { parts++; draw(); } };
    }
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      const ok = p.equiv ? shaded.size * p.d === p.n * parts : parts === p.d && shaded.size === p.n;
      if (ok) { api.complete(); return; }
      tries++;
      let msg;
      if (parts !== p.d && !p.equiv) msg = `The bottom number is <b>${p.d}</b>, so cut it into ${p.d} equal parts.`;
      else msg = `The top number is <b>${p.n}</b>, so shade ${p.n} part${p.n === 1 ? '' : 's'}.`;
      if (tries >= 2) {
        api.mistake(msg); api.reveal();
        parts = p.d; shaded = new Set(Array.from({ length: p.n }, (_, k) => k)); draw();
        api.complete(`This is ${V.frac(p.n, p.d)}: ${p.d} equal parts, ${p.n} shaded.`);
      } else api.mistake(msg);
    };
    draw();
  };

  /* =========================================================
   * share: deal items onto plates (or into bags of a size).
   * fields: total, groups (plates) OR size (bag size, mode 'group'), emoji, answer, ask
   * ========================================================= */
  reg.share = function (root, p, api) {
    const mode = p.mode || 'share', emoji = p.emoji || '🍪';
    let pool = p.total, plates = mode === 'share' ? Array(p.groups).fill(0) : [], tries = 0, asked = false;
    root.innerHTML = `
      <div class="pool"></div>
      <div class="answer-row">${mode === 'share' ? '<button class="btn small" data-deal>Deal one to every plate</button>' : `<button class="btn small" data-bag>Fill a bag of ${p.size}</button>`}<button class="btn small ghost" data-reset>Start again</button></div>
      <div class="groups sh-plates"></div>
      <div class="sh-ask"></div>`;
    const poolEl = root.querySelector('.pool'), platesEl = root.querySelector('.sh-plates'), askEl = root.querySelector('.sh-ask');
    const item = `<span>${emoji}</span>`;
    function draw() {
      poolEl.innerHTML = pool ? `<div class="objs" style="--per:10">${item.repeat(pool)}</div>` : '<span class="muted">All shared out!</span>';
      if (mode === 'share') platesEl.innerHTML = plates.map((n, k) => `<button class="plate" data-k="${k}" aria-label="plate ${k + 1}"><div class="plate-items">${item.repeat(n)}</div><span class="plate-n">${n}</span></button>`).join('');
      else platesEl.innerHTML = plates.map((n) => `<div class="plate bag"><div class="plate-items">${item.repeat(n)}</div><span class="plate-n">${n}</span></div>`).join('');
      if (!asked && ((mode === 'share' && pool < plates.length) || (mode === 'group' && pool < p.size))) ready();
    }
    function ready() {
      if (mode === 'share' && new Set(plates).size > 1) { api.say('The plates are not fair yet! Every plate needs the same number. Tap “Start again” and deal fairly.'); return; }
      asked = true;
      const sub = Object.assign({}, p, { type: 'number' });
      const host = document.createElement('div');
      askEl.innerHTML = `<p class="ch-say">${p.ask || (mode === 'share' ? 'How many are on each plate?' : 'How many bags did you fill?')}${pool ? ` <span class="muted">(${pool} left over)</span>` : ''}</p>`;
      askEl.appendChild(host);
      inputWidget(host, sub, Object.assign({}, api, { opts: Object.assign({}, api.opts, { compact: true, autofocus: true }) }));
    }
    platesEl.onclick = (e) => {
      const b = e.target.closest('[data-k]');
      if (!b || !pool || asked) return;
      plates[+b.dataset.k]++; pool--; U.sound('click'); draw();
    };
    const deal = root.querySelector('[data-deal]');
    if (deal) deal.onclick = () => { if (asked || pool < plates.length) return; plates = plates.map((n) => n + 1); pool -= plates.length; U.sound('click'); draw(); };
    const bag = root.querySelector('[data-bag]');
    if (bag) bag.onclick = () => { if (asked || pool < p.size) return; plates.push(p.size); pool -= p.size; U.sound('click'); draw(); };
    root.querySelector('[data-reset]').onclick = () => { if (asked) return; pool = p.total; plates = mode === 'share' ? Array(p.groups).fill(0) : []; askEl.innerHTML = ''; draw(); };
    void tries;
    draw();
  };

  /* =========================================================
   * blocks: build a number with hundreds, tens and ones.
   * fields: target, max place ('h' default if target>=100)
   * ========================================================= */
  reg.blocks = function (root, p, api) {
    let h = 0, t = 0, o = 0, tries = 0;
    const big = p.target >= 100 || p.hundreds;
    root.innerHTML = `
      <div class="blk-btns">
        ${big ? '<div><b>Hundreds</b><button class="btn small ghost" data-d="-100">−</button><button class="btn small" data-d="100">+</button></div>' : ''}
        <div><b>Tens</b><button class="btn small ghost" data-d="-10">−</button><button class="btn small" data-d="10">+</button></div>
        <div><b>Ones</b><button class="btn small ghost" data-d="-1">−</button><button class="btn small" data-d="1">+</button></div>
      </div>
      <div class="blk-show"></div>
      <div class="answer-row"><button class="btn" data-check>Check</button></div>`;
    const show = root.querySelector('.blk-show');
    const val = () => h * 100 + t * 10 + o;
    function draw() {
      show.innerHTML = `<div class="row-center">${V.base10(val())}</div><p class="center">${big ? `${h} hundreds, ` : ''}${t} tens, ${o} ones</p>`;
    }
    root.querySelectorAll('[data-d]').forEach((b) => {
      b.onclick = () => {
        if (api.finished) return;
        const d = +b.dataset.d;
        if (Math.abs(d) === 100) h = Math.max(0, Math.min(9, h + Math.sign(d)));
        else if (Math.abs(d) === 10) t = Math.max(0, Math.min(15, t + Math.sign(d)));
        else o = Math.max(0, Math.min(15, o + Math.sign(d)));
        U.sound('click');
        draw();
      };
    });
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      if (val() === p.target) { api.complete(); return; }
      tries++;
      const msg = `You made <b>${val()}</b>. ${p.target} has ${Math.floor(p.target / 100) ? `${Math.floor(p.target / 100)} hundreds, ` : ''}${Math.floor((p.target % 100) / 10)} tens and ${p.target % 10} ones.`;
      if (tries >= 2) { api.mistake(msg); api.reveal(); h = Math.floor(p.target / 100); t = Math.floor((p.target % 100) / 10); o = p.target % 10; draw(); api.complete(msg); }
      else api.mistake(msg);
    };
    draw();
  };

  /* =========================================================
   * array: pick a rectangle on a grid.  fields: rows, cols, turn (accept swapped)
   * ========================================================= */
  reg.array = function (root, p, api) {
    const M = p.max || 10;
    let sel = null, tries = 0;
    root.innerHTML = `<div class="agrid" style="--m:${M}">${Array.from({ length: M * M }, (_, k) => `<button class="acell" data-r="${Math.floor(k / M) + 1}" data-c="${(k % M) + 1}" tabindex="-1" aria-label="${Math.floor(k / M) + 1} rows of ${(k % M) + 1}"></button>`).join('')}</div>
      <div class="answer-row"><span class="arr-lab muted">Tap a square to make your array</span><button class="btn" data-check>Check</button></div>`;
    const grid = root.querySelector('.agrid');
    const paint = (r, c, cls) => grid.querySelectorAll('.acell').forEach((x) => x.classList.toggle(cls, +x.dataset.r <= r && +x.dataset.c <= c));
    grid.onmouseover = (e) => { const b = e.target.closest('.acell'); if (b && !api.finished) paint(+b.dataset.r, +b.dataset.c, 'hov'); };
    grid.onmouseleave = () => paint(0, 0, 'hov');
    grid.onclick = (e) => {
      const b = e.target.closest('.acell');
      if (!b || api.finished) return;
      sel = [+b.dataset.r, +b.dataset.c];
      paint(sel[0], sel[1], 'on');
      U.sound('click');
      root.querySelector('.arr-lab').textContent = `${sel[0]} rows of ${sel[1]}`;
    };
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      if (!sel) { api.say('Tap the grid first.'); return; }
      const ok = (sel[0] === p.rows && sel[1] === p.cols) || (p.turn && sel[0] === p.cols && sel[1] === p.rows);
      if (ok) { api.complete(); return; }
      tries++;
      const msg = `You made ${sel[0]} rows of ${sel[1]}. We need <b>${p.rows} rows</b> of <b>${p.cols}</b>.`;
      if (tries >= 2) { api.mistake(msg); api.reveal(); sel = [p.rows, p.cols]; paint(p.rows, p.cols, 'on'); api.complete(msg); }
      else api.mistake(msg);
    };
  };

  /* =========================================================
   * order: tap items in order.  fields: items:[{v, html}], dir ('asc'|'desc')
   * ========================================================= */
  reg.order = function (root, p, api) {
    const want = [...p.items].sort((a, b) => (p.dir === 'desc' ? b.v - a.v : a.v - b.v)).map((x) => String(x.v));
    let picked = [], tries = 0;
    root.innerHTML = `<p class="center muted">Tap them from <b>${p.dir === 'desc' ? 'biggest to smallest' : 'smallest to biggest'}</b>.</p>
      <div class="choices ord">${U.shuffle(p.items).map((x) => `<button class="choice" data-v="${x.v}">${x.html}<span class="ord-n"></span></button>`).join('')}</div>
      <div class="ord-line"></div>
      <div class="answer-row"><button class="btn ghost small" data-reset>Start again</button><button class="btn" data-check>Check</button></div>`;
    const line = root.querySelector('.ord-line');
    function draw() {
      root.querySelectorAll('.ord .choice').forEach((b) => { const k = picked.indexOf(b.dataset.v); b.querySelector('.ord-n').textContent = k >= 0 ? k + 1 : ''; b.classList.toggle('picked', k >= 0); });
      line.innerHTML = picked.map((v) => p.items.find((x) => String(x.v) === v).html).join(' <span class="muted">,</span> ');
    }
    root.querySelectorAll('.ord .choice').forEach((b) => { b.onclick = () => { if (api.finished || picked.includes(b.dataset.v)) return; picked.push(b.dataset.v); U.sound('click'); draw(); }; });
    root.querySelector('[data-reset]').onclick = () => { if (!api.finished) { picked = []; draw(); } };
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      if (picked.length < want.length) { api.say('Tap all of them first.'); return; }
      if (picked.join('|') === want.join('|')) { api.complete(); return; }
      tries++;
      if (tries >= 2) { api.mistake(); api.reveal(); picked = want.slice(); draw(); api.complete('Here is the right order.'); }
      else { api.mistake(p.hint || 'Not quite. Find the smallest one first.'); picked = []; draw(); }
    };
  };

  /* =========================================================
   * thermo: set a thermometer.  fields: answer, min, max
   * ========================================================= */
  reg.thermo = function (root, p, api) {
    const min = p.min ?? -10, max = p.max ?? 10;
    let t = 0, tries = 0;
    root.innerHTML = `<div class="ex-split"><div class="th-pic"></div><div class="th-btns">
      <button class="btn small" data-d="5">+5</button><button class="btn small" data-d="1">+1</button>
      <span class="ex-eq big th-v"></span>
      <button class="btn small ghost" data-d="-1">−1</button><button class="btn small ghost" data-d="-5">−5</button>
      <button class="btn" data-check>Check</button></div></div>`;
    const draw = () => { root.querySelector('.th-pic').innerHTML = V.thermometer(t, { min, max }); root.querySelector('.th-v').textContent = U.fmt(t) + '°C'; };
    root.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => { if (api.finished) return; t = Math.max(min, Math.min(max, t + +b.dataset.d)); U.sound('click'); draw(); }; });
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      if (t === p.answer) { api.complete(); return; }
      tries++;
      const msg = t > p.answer ? 'Too warm! Go down.' : 'Too cold! Go up.';
      if (tries >= 2) { api.mistake(msg); api.reveal(); t = p.answer; draw(); api.complete(`It should show <b>${U.fmt(p.answer)}°C</b>.`); }
      else api.mistake(msg);
    };
    draw();
  };

  /* =========================================================
   * clockset: move the hands to show a time.  fields: h, m, step (minutes, default 5), minuteNumbers, roman
   * ========================================================= */
  reg.clockset = function (root, p, api) {
    const step = p.step || 5;
    let h = 12, m = 0, tries = 0;
    root.innerHTML = `<div class="ex-split"><div class="ck-face" title="Tap the clock to move the minute hand"></div><div class="ck-btns">
      <div class="ck-row"><span><b class="hh">Hour hand</b> (short)</span><button class="btn small ghost" data-h="-1">−</button><button class="btn small" data-h="1">+</button></div>
      <div class="ck-row"><span><b class="mh">Minute hand</b> (long)</span><button class="btn small ghost" data-m="-${step}">−${step}</button><button class="btn small" data-m="${step}">+${step}</button></div>
      <p class="muted ck-tip">Tip: tap the clock face to move the minute hand.</p>
      <button class="btn" data-check>Check</button></div></div>`;
    const face = root.querySelector('.ck-face');
    const draw = () => { face.innerHTML = V.clock(h, m, { minuteNumbers: !!p.minuteNumbers, roman: !!p.roman }); };
    const fix = () => { while (m >= 60) { m -= 60; h++; } while (m < 0) { m += 60; h--; } h = (((h - 1) % 12) + 12) % 12 + 1; };
    root.querySelectorAll('[data-h]').forEach((b) => { b.onclick = () => { if (api.finished) return; h += +b.dataset.h; fix(); U.sound('click'); draw(); }; });
    root.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { if (api.finished) return; m += +b.dataset.m; fix(); U.sound('click'); draw(); }; });
    face.onclick = (e) => {
      if (api.finished) return;
      const svg = face.querySelector('svg'), r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      const nm = (Math.round(deg / 6 / step) * step) % 60;
      if (m > 45 && nm < 15) h++; else if (m < 15 && nm > 45) h--;
      m = nm; fix(); U.sound('click'); draw();
    };
    root.querySelector('[data-check]').onclick = () => {
      if (api.finished) return;
      const okM = m === p.m, okH = h % 12 === p.h % 12;
      if (okM && okH) { api.complete(); return; }
      tries++;
      const where = p.m === 0 ? 'straight up at the 12' : p.m % 5 === 0 ? `at the ${p.m / 5} (${p.m} minutes)` : `${p.m} minutes round from the 12`;
      const msg = !okM ? `Check the <b>long minute hand</b>. It should point ${where}.`
        : `The minutes are right! Now check the <b>short hour hand</b>.${p.m >= 30 ? ' After half past, it is getting close to the <b>next</b> hour.' : ''}`;
      if (tries >= 2) { api.mistake(msg); api.reveal(); h = ((p.h - 1) % 12) + 1; m = p.m; draw(); api.complete('Here is the right time on the clock.'); }
      else api.mistake(msg);
    };
    draw();
  };

  /* =========================================================
   * cells: fill the empty boxes in a layout (number-grid pieces, worms, sequences).
   * fields: cells:[{x, y, v, given}] (x, y in box units, may be fractional), size (px, default 58)
   * ========================================================= */
  reg.cells = function (root, p, api) {
    const size = p.size || 58;
    const maxX = Math.max(...p.cells.map((c) => c.x)) + 1, maxY = Math.max(...p.cells.map((c) => c.y)) + 1;
    let tries = 0;
    root.innerHTML = `<div class="cells-wrap"><div class="cells" style="width:${maxX * size}px;height:${maxY * size}px;--fs:${Math.min(20, Math.floor((size * 0.82) / (Math.max(...p.cells.map((c) => U.fmt(c.v).length)) * 0.6)))}px">${p.cells.map((c, k) =>
      `<div class="cell${c.given ? ' given' : ''}" style="left:${c.x * size}px;top:${c.y * size}px;width:${size}px;height:${size}px">${c.given ? U.fmt(c.v) : `<input data-k="${k}" inputmode="numeric" aria-label="missing number">`}</div>`).join('')}</div></div>
      <div class="answer-row"><button class="btn" data-check>Check</button></div>`;
    const inputs = [...root.querySelectorAll('.cells input')];
    if (inputs[0] && api.opts.autofocus) inputs[0].focus({ preventScroll: true });
    inputs.forEach((inp, i) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (inputs[i + 1]) inputs[i + 1].focus(); else go(); } }));
    function go() {
      if (api.finished) return;
      if (inputs.some((i) => i.value.trim() === '')) { api.say('✍️ Fill in every empty box first.'); return; }
      let wrong = 0;
      inputs.forEach((inp) => { const ok = U.parseNum(inp.value) === p.cells[+inp.dataset.k].v; inp.classList.toggle('wrong', !ok); inp.classList.toggle('right', ok); if (!ok) wrong++; });
      if (!wrong) { inputs.forEach((i) => { i.readOnly = true; }); api.complete(); return; }
      tries++;
      if (tries >= 2) {
        api.mistake(); api.reveal();
        inputs.forEach((inp) => { inp.value = U.fmt(p.cells[+inp.dataset.k].v); inp.readOnly = true; inp.classList.remove('wrong'); inp.classList.add('right'); });
        api.complete('Here are the right numbers. Look at the pattern!');
      } else api.mistake(`${wrong} box${wrong > 1 ? 'es are' : ' is'} not right yet (red). ${p.hint || ''}`);
    }
    root.querySelector('[data-check]').onclick = go;
  };

  /* =========================================================
   * tapfind: tap every item that matches (or just one with single:true).
   * fields: items:[{label, ok}], fancy (random colours, shapes, sizes), single
   * ========================================================= */
  const FCOL = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
  const FSH = ['circle', 'square', 'star', 'blob', 'heart'];
  reg.tapfind = function (root, p, api) {
    let tries = 0;
    const sel = new Set();
    root.innerHTML = `<div class="tapfind${p.fancy ? ' fancy' : ''}">${p.items.map((it, k) => {
      const st = p.fancy ? `--bg:${U.pick(FCOL)};--rot:${U.rand(-15, 15)}deg;--sz:${U.rand(54, 78)}px` : '';
      return `<button class="tf ${p.fancy ? U.pick(FSH) : ''}" data-k="${k}" style="${st}">${it.label}</button>`;
    }).join('')}</div>${p.single ? '' : '<div class="answer-row"><button class="btn" data-check>Check</button></div>'}`;
    const btns = [...root.querySelectorAll('.tf')];
    const want = new Set(p.items.map((it, k) => (it.ok ? k : -1)).filter((k) => k >= 0));
    function reveal(msg) { api.reveal(); btns.forEach((b, k) => { b.classList.toggle('picked', want.has(k)); b.classList.toggle('right', want.has(k)); b.disabled = true; }); api.complete(msg); }
    btns.forEach((b, k) => {
      b.onclick = () => {
        if (api.finished) return;
        if (p.single) {
          if (want.has(k)) { b.classList.add('right'); btns.forEach((x) => { x.disabled = true; }); api.complete(); return; }
          tries++; b.classList.add('wrong'); b.disabled = true;
          if (tries >= 2) { api.mistake(); reveal('Here it is!'); } else api.mistake(p.hint);
          return;
        }
        sel.has(k) ? sel.delete(k) : sel.add(k);
        b.classList.toggle('picked', sel.has(k));
        U.sound('click');
      };
    });
    const chk = root.querySelector('[data-check]');
    if (chk) chk.onclick = () => {
      if (api.finished) return;
      if (!sel.size) { api.say('Tap the ones you want first.'); return; }
      const ok = sel.size === want.size && [...sel].every((k) => want.has(k));
      if (ok) { btns.forEach((b) => { b.disabled = true; }); api.complete(); return; }
      tries++;
      const missing = [...want].filter((k) => !sel.has(k)).length, extra = [...sel].filter((k) => !want.has(k)).length;
      const msg = `${missing ? `You missed ${missing}. ` : ''}${extra ? `${extra} of yours ${extra > 1 ? 'are' : 'is'} not right. ` : ''}${p.hint || ''}`;
      if (tries >= 2) { api.mistake(msg); reveal('These are the right ones.'); } else api.mistake(msg);
    };
  };

  return { run, reg, answerHTML, check, PRAISE, NUDGE, OKS, FIXED_LINES };
})();
