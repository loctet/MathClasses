# How topics, skills, lessons and problems work

All code is plain browser JavaScript. Scripts load in this order (see `index.html`):
`utils.js` (U) → `visuals.js` (V) → `widgets.js` (W) → `topics/*.js` → `app.js`.

## Topic

Each file in `js/topics/` pushes one or more topics:

```js
TOPICS.push({
  id: 'subtraction', name: 'Subtraction', icon: '➖', color: '#f97316',
  minYear: 1,                      // topic is locked below this year
  tagline: 'Taking away and finding differences',
  explore(root, year) { ... },     // optional free-play toy (Explore tab)
  skills: [ /* Skill objects, in teaching order */ ],
});
```

## Skill

A skill is one small lesson (like one lesson in a school week).

```js
{
  id: 'count-up',                  // unique inside the topic, used in the URL
  title: 'Find the difference by counting up',
  desc: 'For numbers close together: jump to the next ten, then on.',
  years: [2, 4],                   // shown for Year 2, 3 and 4
  lesson(year) { return [Frame, ...] },   // 4–9 frames; may use random numbers
  gen(year) { return Problem },    // practice question (10 per round)
  word(year) { return Problem },   // optional real-life problem (prefer type 'guided')
  fixedLesson: false,              // true hides the "New numbers" button
}
```

Rules for good skills:

- One idea per skill. Lessons go from concrete (objects, blocks, coins) to pictures (number line, bars) to numbers.
- Every lesson has at least two `try` frames (the child does the step, not only reads it).
- Explain *why* each step happens. Never jump from `52 − 47` to `3 + 2` without the jumps in between.
- Numbers grow with the year (1-digit in Y1, 2-digit in Y2, 3-digit in Y3, 4-digit in Y4, bigger and decimals in Y5–6).
- `gen` must never return a negative answer outside the negative-numbers topic.
- Use `U.name()` / `U.twoNames()` for names. `U.words(n)` writes a number in words. Do not use he/she: repeat the name or use “they”.

## Frame (one step of the lesson player)

```js
{
  say: 'html — what Pip says (short, one idea)',
  show: 'html' | (el) => { /* draw into el, may add buttons/animation */ },
  try: Problem,                   // optional "Your turn!" — Next unlocks when it is finished
}
```

## Problem (used by `try`, `gen`, `word` and guided parts)

Common fields: `type`, `q` (question html), `visual` (html), `hint`, `steps` (array of html, shown by “Show me how”), `scene` (one emoji for story problems), `story: true` (left-aligned text).

| type | extra fields | what the child does |
|---|---|---|
| `number` (default) | `answer`, `prefix`, `suffix`, `allowNeg`, `decimals`, `tol` | types a number (keypad on touch screens) |
| `money` | `answer` (in units, e.g. 2.45) | types an amount after the currency sign |
| `time` | `answer: {h, m}`, `h24` (two-digit hours) | types a time like `4:05` (keypad has `:`) |
| `text` | `answer` (string or list of accepted strings) | types words, e.g. number words (case, hyphens and “and” are ignored) |
| `cells` | `cells: [{x, y, v, given}]`, `size` | fills empty boxes in a layout: number-grid pieces, worms, sequences |
| `tapfind` | `items: [{label, ok}]`, `fancy` (colours/shapes), `single` | taps every matching item (or one) |
| `fraction` | `answer: {n, d}`, `exact` (must be simplest form) | types `3/4` or `1 1/2` |
| `choice` | `choices: [{v, html}]`, `answer` (a `v` string) | taps a button |
| `note` | `button` | taps “Got it” (only inside `guided`) |
| `guided` | `parts: [Problem + {say, visual, after}]`, `doneMsg` | solves small steps one by one; each part can be any type, even `column` |
| `column` | `a`, `b`, `op` (`'+'`, `'−'`, `'×'` with one-digit `b`), `dp` | written method digit by digit: helper sum box, answer digit, carry box; for `−` decides “exchange?” and clicks the digit to exchange (handles zeros) |
| `busstop` | `n`, `d` | short division: how many fit, write digit, remainder carried |
| `nlplace` | `min`, `max`, `step` (labels), `minor` (tick spacing), `label` (fn), `snap`, `answer`, `tol`, `signColors`, `showValue` | taps a number line to place a marker |
| `coins` | `target` (cents), `allowed` (cents list), `hideTotal` | taps coins and notes into a tray |
| `slice` | `n`, `d`, `kind` (`pie`/`bar`), `fixed` (already cut), `equiv` | cuts a shape into parts and shades some |
| `share` | `total`, `groups` (share mode) or `mode:'group'` + `size`, `emoji`, `answer`, `ask` | deals items onto plates / fills bags, then types the answer |
| `blocks` | `target` | builds a number with hundreds, tens and ones |
| `array` | `rows`, `cols`, `turn` (accept swapped), `max` | taps a grid to make an array |
| `order` | `items: [{v, html}]`, `dir` (`asc`/`desc`) | taps items in order |
| `thermo` | `answer`, `min`, `max` | sets a thermometer with ± buttons |
| `clockset` | `h`, `m`, `step` (minutes), `minuteNumbers`, `roman` | moves the clock hands (buttons or tap the face) |

A wrong answer gives a nudge. A second wrong answer on the same step shows the right value and moves on (no star).

## Visual helpers (V)

`objects(n, emoji, {crossed, perRow})`, `tenFrame(n, emoji, {second, emoji2})`, `numberLine({min, max, step, jumps:[{from,to,label}], points:[{v,label,emoji,color}], empty, signColors, label})`, `splitJumps(a, b, sign)`, `jumpLine(jumps, labelFn)`, `base10(n)`, `pvTable(n, cols)`, `chips(list, hotIndexes)`, `array(r, c)`, `groups(n, k, emoji)`, `areaModel(a, b)`, `pie(n, d)`, `bar(n, d, {labels, width, color})`, `shape(n, d, kind)`, `frac(n, d)`, `coin(c)`, `coins(list)`, `coinLabel(c)`, `thermometer(t, {min, max, showValue})`, `elevator(f, {min, max})`, `clock(h, m, {roman, minuteNumbers, halves, quarters, sweep})`, `digital(h, m, {h24, ampm})`, `columnMethod(a, b, op, {dp, blank, upto, active})` returns `{html, steps}` — use `upto` (columns finished, from the right) and `active` (highlighted column from the right) to animate a written method frame by frame.

## Utilities (U)

`rand(a, b)`, `pick(list)`, `shuffle(list)`, `gcd`, `lcm`, `round(x, dp)`, `fmt(n, dp)`, `paren(n)`, `cap(s)`, `money(cents)`, `cash(cents)`, `centUnit()`, `settings.currency`, `name()`, `twoNames()`, `simplify(n, d)`.
