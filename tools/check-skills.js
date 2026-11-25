/* Node check for every topic, skill, lesson frame and generated problem.
 * Run: node tools/check-skills.js [topicId]
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..', 'js');
const ctx = { console, Math, performance: { now: () => 0 }, localStorage: { getItem: () => null, setItem: () => {} } };
ctx.window = ctx;
vm.createContext(ctx);
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="js\/([^"]+)"/g)].map((m) => m[1]).filter((f) => f !== 'app.js');
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8').replace(/^const (U|V|W) =/m, 'var $1 ='), ctx, { filename: f });

const only = process.argv[2];
const TYPES = ['number', 'money', 'fraction', 'choice', 'note', 'guided', 'column', 'busstop', 'nlplace', 'coins', 'slice', 'share', 'blocks', 'array', 'order', 'thermo', 'clockset', 'time', 'text', 'cells', 'tapfind'];
// also catches numbers like "26.0" (usually a .map(fmt) bug that passes the index as decimals)
const BAD = /undefined|NaN|\[object|\bnull\b|Infinity|\d\.0, \d+\.00/;
let errors = 0, problems = 0, frames = 0, skills = 0;
const report = (where, msg) => { errors++; if (errors <= 60) console.log('✖', where, '—', msg); };

function checkProblem(p, where, topicId) {
  problems++;
  if (!p || typeof p !== 'object') return report(where, 'not an object');
  const type = p.type || 'number';
  if (!TYPES.includes(type)) return report(where, 'unknown type ' + type);
  const text = [p.q, p.visual, p.hint, p.say, p.after, ...(p.steps || [])].filter((x) => typeof x === 'string').join(' ');
  if (BAD.test(text)) report(where, `bad text: ${text.match(new RegExp('.{0,50}(' + BAD.source + ').{0,30}'))[0]}`);
  const negOk = topicId === 'negatives';
  switch (type) {
    case 'number': case 'money':
      if (!Number.isFinite(p.answer)) report(where, 'answer not a number: ' + p.answer);
      else if (p.answer < 0 && !negOk && !p.allowNeg) report(where, 'negative answer ' + p.answer + ' in ' + (p.q || p.say));
      break;
    case 'fraction':
      if (!p.answer || !Number.isInteger(p.answer.n) || !(p.answer.d > 0)) report(where, 'bad fraction answer');
      break;
    case 'choice':
      if (!Array.isArray(p.choices) || !p.choices.some((c) => c.v === String(p.answer))) report(where, 'answer not in choices: ' + p.answer);
      else if (new Set(p.choices.map((c) => c.v)).size !== p.choices.length) report(where, 'duplicate choices');
      break;
    case 'guided':
      if (!Array.isArray(p.parts) || !p.parts.length) report(where, 'no parts');
      else p.parts.forEach((pt, k) => checkProblem(pt, where + ` part${k + 1}`, topicId));
      break;
    case 'column':
      if (!['+', '−', '×'].includes(p.op)) report(where, 'bad op ' + p.op);
      if (!(p.a >= 0 && p.b >= 0)) report(where, 'bad a/b');
      if (p.op === '−' && p.b > p.a) report(where, 'b > a in subtraction');
      if (p.op === '×' && !(Number.isInteger(p.b) && p.b < 10)) report(where, '× needs one-digit b');
      break;
    case 'busstop': if (!(p.n > 0 && p.d > 1 && p.d < 13)) report(where, 'bad n/d'); break;
    case 'nlplace': if (!(p.answer >= p.min && p.answer <= p.max)) report(where, 'answer outside line'); break;
    case 'coins': if (!(p.target > 0)) report(where, 'bad target'); break;
    case 'slice': if (!(p.d >= 1 && p.d <= 12 && p.n >= 0 && p.n <= p.d)) report(where, 'bad n/d'); break;
    case 'share': if (!(p.total > 0) || !Number.isFinite(p.answer)) report(where, 'bad share'); break;
    case 'blocks': if (!(p.target >= 0 && p.target < 1000)) report(where, 'bad target'); break;
    case 'array': if (!(p.rows >= 1 && p.cols >= 1 && p.rows <= (p.max || 10) && p.cols <= (p.max || 10))) report(where, 'bad array'); break;
    case 'order': if (!Array.isArray(p.items) || p.items.length < 2) report(where, 'bad items'); break;
    case 'time': if (!p.answer || !(p.answer.h >= 0 && p.answer.h <= 23 && p.answer.m >= 0 && p.answer.m < 60)) report(where, 'bad time answer'); break;
    case 'text': if (!p.answer || (Array.isArray(p.answer) && !p.answer.length)) report(where, 'no text answer'); break;
    case 'cells': if (!Array.isArray(p.cells) || !p.cells.some((c) => !c.given) || p.cells.some((c) => !Number.isFinite(c.v))) report(where, 'bad cells'); break;
    case 'tapfind': if (!Array.isArray(p.items) || !p.items.some((i) => i.ok) || (p.single && p.items.filter((i) => i.ok).length !== 1)) report(where, 'bad tapfind'); break;
    case 'clockset': if (!(p.h >= 1 && p.h <= 24 && p.m >= 0 && p.m < 60 && p.m % (p.step || 5) === 0)) report(where, 'bad clock time'); break;
    case 'thermo': if (!(p.answer >= (p.min ?? -10) && p.answer <= (p.max ?? 10))) report(where, 'bad thermo'); break;
    default: break;
  }
}

for (const t of ctx.TOPICS) {
  if (only && t.id !== only) continue;
  if (!Array.isArray(t.skills) || !t.skills.length) { report(t.id, 'no skills'); continue; }
  const ids = new Set();
  for (const s of t.skills) {
    skills++;
    const where0 = `${t.id}/${s.id}`;
    if (ids.has(s.id)) report(where0, 'duplicate id');
    ids.add(s.id);
    if (!Array.isArray(s.years) || s.years[0] > s.years[1] || s.years[0] < 0 || s.years[1] > 6) { report(where0, 'bad years'); continue; }
    for (let y = s.years[0]; y <= s.years[1]; y++) {
      for (let r = 0; r < 4; r++) {
        let fs2;
        try { fs2 = s.lesson(y); } catch (e) { report(where0 + ` Y${y} lesson`, e.stack.split('\n').slice(0, 2).join(' ')); break; }
        if (!Array.isArray(fs2) || fs2.length < 3) report(where0 + ` Y${y} lesson`, 'fewer than 3 frames');
        let tries = 0;
        (fs2 || []).forEach((f, k) => {
          frames++;
          const show = typeof f.show === 'string' ? f.show : '';
          if (BAD.test((f.say || '') + show)) report(where0 + ` Y${y} frame${k + 1}`, 'bad text: ' + ((f.say || '') + show).match(new RegExp('.{0,50}(' + BAD.source + ').{0,30}'))[0]);
          if (f.try) { tries++; checkProblem(f.try, where0 + ` Y${y} frame${k + 1} try`, t.id); }
        });
        if (tries < 2) report(where0 + ` Y${y} lesson`, `only ${tries} "try" frames (need 2+)`);
      }
      for (const m of ['gen', 'word']) {
        if (!s[m]) continue;
        for (let r = 0; r < 300; r++) {
          let p;
          try { p = s[m](y); } catch (e) { report(where0 + ` Y${y} ${m}`, e.stack.split('\n').slice(0, 2).join(' ')); break; }
          checkProblem(p, where0 + ` Y${y} ${m}`, t.id);
        }
      }
    }
  }
}
const perYear = {};
for (const t of ctx.TOPICS) for (const s of t.skills || []) for (let y = s.years[0]; y <= s.years[1]; y++) perYear[y] = (perYear[y] || 0) + 1;
console.log(`skills ${skills}, frames ${frames}, problems ${problems}, errors ${errors}`);
console.log('skills per year:', JSON.stringify(perYear));
process.exitCode = errors ? 1 : 0;
