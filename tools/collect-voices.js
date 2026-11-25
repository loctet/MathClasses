/* Collect every sentence the Nursery level reads aloud, for tools/make_voices.py.
 * Run: node tools/collect-voices.js   → writes tools/voice-texts.json
 * Lessons and questions use random numbers, so it runs them many times until no new sentence appears.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const ctx = { console, Math, performance: { now: () => 0 }, localStorage: { getItem: () => null, setItem: () => {} } };
ctx.window = ctx;
ctx.addEventListener = () => {};
vm.createContext(ctx);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="js\/([^"]+)"/g)].map((m) => m[1]).filter((f) => f !== 'app.js');
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, 'js', f), 'utf8').replace(/^const (U|V|W) =/m, 'var $1 ='), ctx, { filename: f });
const { U, W, TOPICS } = ctx;
U.settings.year = 0;

const texts = new Set();
const add = (h) => { const t = U.speakText(h || ''); if (t) texts.add(t); };

/** What the site reads for one problem (question, hint, and each guided step). */
function fromProblem(p) {
  if (!p) return;
  add(p.q || p.say);
  add(p.hint);
  (p.parts || []).forEach((part) => { add(part.say); add(part.hint); fromProblem(Object.assign({}, part, { say: undefined, hint: undefined, parts: part.parts })); });
}

// fixed lines from the widgets
[...W.PRAISE, ...W.NUDGE, ...W.OKS, ...W.FIXED_LINES].forEach(add);

const skills = TOPICS.flatMap((t) => (t.skills || []).filter((s) => s.years[0] <= 0 && s.years[1] >= 0));
let stale = 0, rounds = 0;
while (stale < 4000 && rounds < 200000) {
  const before = texts.size;
  for (const s of skills) {
    for (const f of s.lesson(0)) { add(f.say); if (f.try) fromProblem(f.try); }
    fromProblem(s.gen(0));
    if (s.word) fromProblem(s.word(0));
  }
  rounds++;
  stale = texts.size === before ? stale + 1 : 0;
}
const list = [...texts].sort();
fs.writeFileSync(path.join(__dirname, 'voice-texts.json'), JSON.stringify(list, null, 1));
console.log(`${skills.length} Nursery skills, ${rounds} rounds, ${list.length} sentences → tools/voice-texts.json`);
console.log(`characters: ${list.reduce((a, t) => a + t.length, 0)}`);
