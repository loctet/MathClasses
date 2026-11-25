# MathQuest

A fun, visual maths website for primary school children (Year 1 to Year 6), following the
England National Curriculum programmes of study. It is plain HTML, CSS and JavaScript. There is no build step.

## Run it

Serve the folder with any static web server, for example:

```powershell
python -m http.server 5173
```

Then open http://localhost:5173.

To host it, upload the whole folder to any static web host. No server code is needed.

### Nursery voice (read aloud)

Nursery children cannot read yet, so in the Nursery level Pip reads every lesson step, question, hint and praise aloud.
The voice is recorded ahead of time with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) (voice `af_heart`)
and stored as small mp3 files in `audio/nursery/`, listed in `audio/nursery/manifest.json`.
A sentence that has no recording is read by the browser's own voice. Other years have no read-aloud.

After changing Nursery lessons, record the new sentences (only new ones are made; unused files are deleted):

```powershell
node tools/collect-voices.js
```

```powershell
D:/GitHub/Personnal/VideoEditor/data/tts-venv/Scripts/python.exe tools/make_voices.py
```

`make_voices.py` needs a Python with `kokoro-onnx` and `soundfile`, plus `ffmpeg`. It reads the model from
`~/.cache/hyperframes/tts/` (set `KOKORO_MODEL`, `KOKORO_VOICES`, `KOKORO_VOICE`, `KOKORO_SPEED` or `FFMPEG` to change).

## How the site is organised

- **Topics**: Place Value, Addition, Subtraction, Multiplication, Division, Money, Fractions,
  Decimals & Percentages (from Year 4), Negative Numbers (from Year 3) and Time & Clocks.
- **Skills**: each topic is split into small lessons for each year (for example “Find the difference by counting up”).
  The home page shows a learning map of every skill for the chosen year.
- **Step-by-step lesson**: Pip the owl explains one small step per screen, with pictures.
  “Your turn” boxes make the child do each step before moving on.
- **Practise**: 10 questions for that skill. Answers are interactive: digit-by-digit column methods with carrying and
  exchanging, bus-stop division, coins, fraction slicing, sharing onto plates, number lines, arrays, ordering and more.
- **Real-life problems**: story problems solved in guided steps (choose the operation, estimate, calculate, answer).

## Files

- `index.html`: page shell and script order.
- `css/styles.css`, `css/widgets.css`: styles.
- `js/utils.js` (U): random numbers, formatting, answer parsing, storage, sound, confetti.
- `js/visuals.js` (V): SVG and HTML pictures (number lines, blocks, coins, pies, thermometer, lift, column method).
- `js/widgets.js` (W): interactive answer widgets and the problem runner.
- `js/topics/*.js`: topics and their skills.
- `js/app.js`: router, home page, topic and skill pages, lesson player and quizzes.
- `docs/SKILLS.md`: how to write a skill, a lesson and a problem.
- `tools/check-skills.js`: checks every skill, lesson and generated problem. Run `node tools/check-skills.js`.
- `tools/collect-voices.js`, `tools/make_voices.py`: record the Nursery voice into `audio/nursery/`.

Settings (year, currency, sound, read aloud, helper steps) and stars are saved in the browser's `localStorage`.
