'use strict';
/* Shared helpers: random numbers, formatting, parsing, storage, sound, confetti. */
window.TOPICS = [];

const U = (() => {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const round = (x, dp = 2) => Math.round(x * 10 ** dp) / 10 ** dp;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** Format a number with thousands separators and a real minus sign. */
  function fmt(n, dp) {
    const neg = n < 0;
    const abs = Math.abs(n);
    const s = dp != null ? abs.toFixed(dp) : String(round(abs, 6));
    let [i, f] = s.split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + i + (f ? '.' + f : '');
  }
  /** Negative numbers in brackets, e.g. (−3), for calculations. */
  const paren = (n) => (n < 0 ? '(' + fmt(n) + ')' : fmt(n));

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const settings = Object.assign({ year: 1, currency: '€', sound: true }, store.get('mq-settings', {}));
  const saveSettings = () => store.set('mq-settings', settings);

  /* ---------- money ---------- */
  const centUnit = () => (settings.currency === '£' ? 'p' : 'c');
  const money = (c) => (c < 0 ? '−' : '') + settings.currency + fmt(Math.abs(c) / 100, 2);
  /** Small amounts in cents (45c), bigger ones in units (€2.45). */
  const cash = (c) => (Math.abs(c) < 100 ? (c < 0 ? '−' : '') + Math.abs(c) + centUnit() : money(c));

  /* ---------- parsing answers ---------- */
  function parseNum(str) {
    if (str == null) return NaN;
    let s = String(str).trim().replace(/[−–—]/g, '-').replace(/[€$£°\s]/g, '').replace(/[a-zA-Z]+$/, '');
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return parseFloat(s);
  }
  function parseFrac(str) {
    const s = String(str).trim().replace(/[−–—]/g, '-');
    let m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/); // mixed number 1 1/2
    if (m) {
      const w = +m[1], n = +m[2], d = +m[3];
      if (!d) return null;
      return { n: (Math.abs(w) * d + n) * (w < 0 ? -1 : 1), d };
    }
    m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (m) return +m[2] === 0 ? null : { n: +m[1], d: +m[2] };
    if (/^-?\d+$/.test(s)) return { n: +s, d: 1 };
    return null;
  }
  const simplify = (n, d) => { const g = gcd(n, d); return { n: n / g, d: d / g }; };

  /* ---------- sound ---------- */
  let ctx;
  function tone(freq, start, dur, type = 'sine', vol = 0.15) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.05);
  }
  function sound(kind) {
    if (!settings.sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      if (kind === 'ok') { tone(660, t, 0.12); tone(880, t + 0.1, 0.2); }
      else if (kind === 'bad') { tone(240, t, 0.25, 'triangle', 0.12); }
      else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.25)); }
      else if (kind === 'click') { tone(520, t, 0.05, 'square', 0.03); }
    } catch (e) { /* audio not available */ }
  }

  /* ---------- confetti ---------- */
  function confetti() {
    const c = document.getElementById('confetti');
    if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const g = c.getContext('2d');
    c.width = innerWidth;
    c.height = innerHeight;
    c.style.display = 'block';
    const cols = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4'];
    const ps = Array.from({ length: 170 }, () => ({
      x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
      vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
      s: 7 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: pick(cols),
    }));
    const end = performance.now() + 3200;
    (function frame(now) {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
        g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
      });
      if (now < end) requestAnimationFrame(frame);
      else { g.clearRect(0, 0, c.width, c.height); c.style.display = 'none'; }
    })(performance.now());
  }

  /** Number in words, UK style: 345 → "three hundred and forty-five". Works up to 9,999,999. */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function words(n) {
    n = Math.floor(Math.abs(n));
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + words(n % 100) : '');
    if (n < 1e6) { const r = n % 1000; return words(Math.floor(n / 1000)) + ' thousand' + (r ? (r < 100 ? ' and ' : ' ') + words(r) : ''); }
    const r = n % 1e6; return words(Math.floor(n / 1e6)) + ' million' + (r ? (r < 100 ? ' and ' : ' ') + words(r) : '');
  }
  /** Normalise typed words so "Forty five", "forty-five" and "one hundred twenty" match. */
  const normWords = (s) => String(s).toLowerCase().replace(/[-,.]/g, ' ').replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();

  /* ---------- read aloud (Nursery only) ----------
   * Voices are recorded ahead of time with Kokoro (tools/make_voices.py) into audio/nursery/.
   * audio/nursery/manifest.json maps each spoken sentence to its mp3. A sentence that is not
   * recorded is read by the browser voice instead. */
  const hasBrowserVoice = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
  let manifest = null, voicesReady = null;
  function loadVoices() {
    if (voicesReady) return voicesReady;
    if (typeof fetch !== 'function' || typeof location === 'undefined' || !/^https?:/.test(location.protocol)) return (voicesReady = Promise.resolve());
    voicesReady = fetch('audio/nursery/manifest.json').then((r) => (r.ok ? r.json() : {})).then((m) => { manifest = m || {}; }).catch(() => { manifest = {}; });
    return voicesReady;
  }
  const canSpeak = () => settings.year === 0 && (hasBrowserVoice() || typeof Audio !== 'undefined');
  const autoSpeak = () => canSpeak() && settings.speak !== false;
  /** Turn lesson HTML into words a child can listen to. */
  function speakText(html) {
    let s = String(html || '')
      .replace(/<span class="frac"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, ' $1 over $2 ')
      .replace(/<span class="box">\?<\/span>/g, ' what number ')
      .replace(/<(svg|table|style)[\s\S]*?<\/\1>/g, ' ')
      .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/div>/g, '. ')
      .replace(/<[^>]+>/g, ' ');
    // decode entities the same way in the browser and in Node (tools/collect-voices.js)
    const ENT = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&nbsp;': ' ', '&quot;': '"', '&#39;': "'", '&rsquo;': '’', '&lsquo;': '‘', '&ldquo;': '“', '&rdquo;': '”', '&times;': '×', '&minus;': '−', '&divide;': '÷' };
    s = s.replace(/&[a-z#0-9]+;/gi, (e) => (ENT[e] !== undefined ? ENT[e] : ' '));
    return s
      .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, ' ')
      .replace(/(\d),(\d{3})/g, '$1$2')
      .replace(/\s−\s?(?=\d)/g, ' minus ').replace(/−/g, ' minus ')
      .replace(/×/g, ' times ').replace(/÷/g, ' divided by ')
      .replace(/\s=\s?\?/g, ' equals what?').replace(/=/g, ' equals ')
      .replace(/\+1(?=\s|$)/g, '')
      .replace(/\s\+\s/g, ' plus ').replace(/\s<\s/g, ' is less than ').replace(/\s>\s/g, ' is greater than ')
      .replace(/°C/g, ' degrees').replace(/→/g, ', ').replace(/≈/g, ' is about ')
      .replace(/\s+/g, ' ').replace(/\s+([?.!,…:;])/g, '$1').trim();
  }
  let voice = null;
  function pickVoice() {
    if (!hasBrowserVoice()) return null;
    const vs = speechSynthesis.getVoices();
    return vs.find((v) => /en-GB/i.test(v.lang) && /female|libby|sonia|hazel|serena|kate/i.test(v.name))
      || vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if (hasBrowserVoice()) speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
  function browserSay(text) {
    return new Promise((done) => {
      if (!hasBrowserVoice()) return done();
      const u = new SpeechSynthesisUtterance(text);
      voice = voice || pickVoice();
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'en-GB';
      u.rate = 0.85;
      u.pitch = 1.1;
      u.onend = done; u.onerror = done;
      speechSynthesis.speak(u);
    });
  }
  let player = null, gen = 0, chain = Promise.resolve();
  function playFile(file, text, myGen) {
    return new Promise((done) => {
      if (myGen !== gen) return done();
      player = new Audio('audio/nursery/' + file);
      player.onended = () => done(); player.onerror = () => { browserSay(text).then(done); };
      player.play().catch(() => done());
    });
  }
  /** Speak html/text (Nursery only). queue=true waits for what is already being said. */
  function speak(html, queue = false) {
    if (!canSpeak()) return;
    loadVoices();
    const text = speakText(html);
    if (!text) return;
    if (!queue) stopSpeak();
    const myGen = gen;
    chain = chain.then(() => loadVoices()).then(() => {
      if (myGen !== gen) return null;
      const file = manifest && manifest[text];
      return file ? playFile(file, text, myGen) : browserSay(text);
    });
  }
  function stopSpeak() {
    gen++;
    chain = Promise.resolve();
    if (player) { player.pause(); player = null; }
    if (hasBrowserVoice()) speechSynthesis.cancel();
  }

  const NAMES = ['Mia', 'Leo', 'Zara', 'Sam', 'Aisha', 'Noah', 'Lina', 'Omar', 'Ella', 'Kofi', 'Yuki', 'Ben', 'Sofia', 'Ravi', 'Chloe', 'Theo', 'Amara', 'Lucas', 'Nia', 'Hugo'];
  const name = () => pick(NAMES);
  const twoNames = () => { const [a, b] = shuffle(NAMES); return [a, b]; };

  return {
    rand, pick, shuffle, gcd, lcm, round, cap, fmt, paren, store, settings, saveSettings,
    centUnit, money, cash, parseNum, parseFrac, simplify, sound, confetti, name, twoNames, words, normWords, canSpeak, autoSpeak, speak, speakText, stopSpeak, loadVoices,
  };
})();
