'use strict';
/* App shell: router, home page, topic pages, skill lessons (step player) and quizzes. */
(() => {
  const app = document.getElementById('app');
  const S = U.settings;
  const progress = U.store.get('mq-progress', {});
  const QUESTIONS = 10;

  const MASCOT = `<svg class="mascot" viewBox="0 0 200 200" aria-hidden="true">
    <ellipse cx="100" cy="186" rx="56" ry="8" fill="#000" opacity=".08"/>
    <path d="M42 70 L52 30 L78 58Z" fill="#7c3aed"/><path d="M158 70 L148 30 L122 58Z" fill="#7c3aed"/>
    <ellipse cx="100" cy="112" rx="66" ry="72" fill="#8b5cf6"/>
    <ellipse cx="100" cy="132" rx="42" ry="48" fill="#ede9fe"/>
    <path d="M70 124q8 6 16 0M84 140q8 6 16 0M98 124q8 6 16 0M112 140q8 6 16 0M70 156q8 6 16 0M98 156q8 6 16 0" stroke="#c4b5fd" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="74" cy="84" r="26" fill="#fff"/><circle cx="126" cy="84" r="26" fill="#fff"/>
    <circle cx="78" cy="86" r="11" fill="#1e1b4b"/><circle cx="122" cy="86" r="11" fill="#1e1b4b"/>
    <circle cx="82" cy="81" r="4" fill="#fff"/><circle cx="126" cy="81" r="4" fill="#fff"/>
    <path d="M92 104 L108 104 L100 118Z" fill="#f59e0b"/>
    <path d="M36 118 q-16 22 4 40" stroke="#7c3aed" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M164 118 q16 22 -4 40" stroke="#7c3aed" stroke-width="14" fill="none" stroke-linecap="round"/>
    <rect x="62" y="40" width="76" height="9" rx="3" fill="#1e1b4b"/><path d="M70 40 L100 22 L130 40Z" fill="#1e1b4b"/>
    <path d="M128 36 q14 6 10 24" stroke="#f59e0b" stroke-width="3" fill="none"/><circle cx="138" cy="62" r="5" fill="#f59e0b"/>
  </svg>`;

  /* ---------------- header controls ---------------- */
  const yearSel = document.getElementById('yearSel');
  const curSel = document.getElementById('curSel');
  const soundBtn = document.getElementById('soundBtn');
  yearSel.value = S.year;
  curSel.value = S.currency;
  const syncSound = () => { soundBtn.textContent = S.sound ? '🔊' : '🔇'; soundBtn.setAttribute('aria-pressed', S.sound); };
  syncSound();
  function setYear(y) { S.year = +y; yearSel.value = S.year; U.saveSettings(); if (typeof syncSpeak === 'function') syncSpeak(); route(); }
  yearSel.onchange = () => setYear(yearSel.value);
  curSel.onchange = () => { S.currency = curSel.value; U.saveSettings(); route(); };
  soundBtn.onclick = () => { S.sound = !S.sound; U.saveSettings(); syncSound(); U.sound('click'); };
  const speakBtn = document.getElementById('speakBtn');
  const syncSpeak = () => { const on = U.autoSpeak(); speakBtn.classList.toggle('on', on); speakBtn.setAttribute('aria-pressed', on); speakBtn.title = on ? 'Read aloud is ON' : 'Read aloud is OFF'; speakBtn.hidden = !U.canSpeak(); };
  syncSpeak();
  if (S.year === 0) U.loadVoices();
  speakBtn.onclick = () => { S.speak = !U.autoSpeak(); U.saveSettings(); syncSpeak(); if (S.speak) U.speak('Read aloud is on. I will read the questions to you.'); else U.stopSpeak(); };

  const yn = (y) => (y === 0 ? 'Nursery' : `Year ${y}`);
  /* ---------------- skills & progress ---------------- */
  const skillsFor = (t, y = S.year) => (t.skills || []).filter((s) => y >= s.years[0] && y <= s.years[1]);
  const unlocked = () => TOPICS.filter((t) => S.year >= t.minYear && skillsFor(t).length);
  const starsOf = (tid, key) => (progress[tid] || {})[key] || 0;
  function saveStars(tid, key, stars) {
    progress[tid] = progress[tid] || {};
    if ((progress[tid][key] || 0) < stars) { progress[tid][key] = stars; U.store.set('mq-progress', progress); }
  }
  const starRow = (n, max = 3) => '<span class="stars">' + Array.from({ length: max }, (_, i) => `<span class="${i < n ? 'on' : ''}">★</span>`).join('') + '</span>';
  const topicStars = (t) => skillsFor(t).reduce((s, sk) => s + starsOf(t.id, `${sk.id}-${S.year}`), 0);

  /* ---------------- router ---------------- */
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    window.scrollTo({ top: 0 });
    U.stopSpeak();
    if (parts[0] === 't') {
      const t = TOPICS.find((x) => x.id === parts[1]);
      if (t) {
        if (parts[2] === 's') {
          const s = (t.skills || []).find((x) => x.id === parts[3]);
          if (s) return skillView(t, s, parts[4] || 'lesson');
        }
        return topicView(t, parts[2] || 'learn');
      }
    }
    if (parts[0] === 'mixed') return mixedView();
    return homeView();
  }
  window.addEventListener('hashchange', route);

  /* ---------------- home ---------------- */
  function homeView() {
    document.title = 'MathQuest — Free Fun Maths Lessons for Kids, Nursery to Year 6';
    const cards = TOPICS.map((t) => {
      const locked = S.year < t.minYear || !skillsFor(t).length;
      const n = skillsFor(t).length;
      const got = topicStars(t), max = n * 3;
      return `<a class="topic-card${locked ? ' locked' : ''}" href="#/t/${t.id}" style="--c:${t.color}">
        <span class="tc-icon">${t.icon}</span>
        <h3>${t.name}</h3>
        <p>${t.tagline}</p>
        ${locked ? `<span class="tc-lock">🔒 Starts in ${yn(t.minYear)}</span>`
          : `<div class="tc-progress"><span>${n} lesson${n > 1 ? 's' : ''}</span><span class="tc-bar"><i style="width:${max ? (got / max) * 100 : 0}%"></i></span><span>⭐ ${got}/${max}</span></div>`}
      </a>`;
    }).join('');
    const map = unlocked().map((t) => `
      <div class="map-row" style="--c:${t.color}">
        <a class="map-topic" href="#/t/${t.id}">${t.icon} ${t.name}</a>
        <div class="map-skills">${skillsFor(t).map((s) => { const st = starsOf(t.id, `${s.id}-${S.year}`); return `<a class="map-skill${st ? ' got' : ''}" href="#/t/${t.id}/s/${s.id}">${s.title}${st ? ` <span class="ms-st">${'★'.repeat(st)}</span>` : ''}</a>`; }).join('')}</div>
      </div>`).join('');
    app.innerHTML = `
      <section class="hero">
        <div class="hero-text">
          <span class="pill">🎒 ${yn(S.year)} · ages ${S.year === 0 ? '3–5' : `${S.year + 4}–${S.year + 5}`}</span>
          <h1>Maths is an <span class="grad">adventure</span>!</h1>
          <p class="lead">Step-by-step lessons with pictures, hands-on activities and real-life problems — at just the right level for you.</p>
          <div class="year-chips" role="group" aria-label="Choose your year">
            ${[0, 1, 2, 3, 4, 5, 6].map((y) => `<button class="chip${y === S.year ? ' on' : ''}" data-year="${y}">${yn(y)}</button>`).join('')}
          </div>
          <div class="hero-cta">
            <a class="btn big" href="#/mixed">🎯 Mixed challenge</a>
            <a class="btn big ghost" href="#map">See my ${yn(S.year)} map ↓</a>
          </div>
        </div>
        <div class="hero-art">
          <div class="bubble">Hoot hoot! I'm <b>Pip</b>. Pick a lesson and I'll show you, step by step! 🚀</div>
          ${MASCOT}
          <span class="float f1">7</span><span class="float f2">+</span><span class="float f3">½</span><span class="float f4">−3</span><span class="float f5">×</span>
        </div>
      </section>
      <h2 class="section-title" id="topics">Choose a topic</h2>
      <div class="topic-grid">${cards}</div>
      <h2 class="section-title" id="map">🗺️ ${yn(S.year)} learning map</h2>
      <p class="muted">Every lesson for ${yn(S.year)}. Each one has a step-by-step lesson, a “your turn” activity and 10 practice questions.</p>
      <div class="map card">${map}</div>
      <section class="how">
        <h2 class="section-title">How it works</h2>
        <div class="how-grid">
          <div class="how-card"><span>👣</span><h3>Step by step</h3><p>Pip explains one small step at a time, with pictures that move.</p></div>
          <div class="how-card"><span>✋</span><h3>Your turn</h3><p>Try each step yourself: fill digits, carry, exchange, share, slice and drag.</p></div>
          <div class="how-card"><span>✏️</span><h3>Practise</h3><p>10 questions at your level. Stuck? Use a hint or “Show me how”.</p></div>
          <div class="how-card"><span>🧩</span><h3>Solve</h3><p>Real-life problems in small steps: shopping, cooking, weather and more.</p></div>
        </div>
      </section>`;
    app.querySelectorAll('[data-year]').forEach((b) => { b.onclick = () => setYear(b.dataset.year); });
    app.querySelector('.btn.ghost[href="#map"]').onclick = (e) => { e.preventDefault(); document.getElementById('map').scrollIntoView({ behavior: 'smooth' }); };
  }

  /* ---------------- topic page ---------------- */
  const TABS = [['learn', '📖', 'Lessons'], ['explore', '🔍', 'Explore'], ['practice', '✏️', 'Mixed practice'], ['problems', '🧩', 'Real-life problems']];
  function head(t, sub, tabs, active) {
    return `<div class="topic-head" style="--c:${t.color}">
        <a href="${sub ? `#/t/${t.id}/learn` : '#/'}" class="back">← ${sub ? `${t.name} lessons` : 'All topics'}</a>
        <div class="th-main">
          <span class="th-icon">${t.icon}</span>
          <div><h1>${sub ? sub.title : t.name}</h1><p>${sub ? sub.desc || t.name : t.tagline} · <b>${yn(S.year)}</b></p></div>
        </div>
        ${tabs ? `<nav class="tabs" role="tablist">${tabs.map(([id, ic, label, href]) => `<a role="tab" href="${href}" class="tab${id === active ? ' on' : ''}" aria-selected="${id === active}"><span>${ic}</span> ${label}</a>`).join('')}</nav>` : ''}
      </div>`;
  }
  function lockedPage(t) {
    app.innerHTML = `<div class="locked-page card">${MASCOT}<h1>${t.icon} ${t.name}</h1>
      <p>This topic starts in <b>${yn(t.minYear)}</b>. You are in ${yn(S.year)}.</p>
      <div class="row-center"><button class="btn" id="goYear">Switch to ${yn(t.minYear)}</button><a class="btn ghost" href="#/">Back to topics</a></div></div>`;
    app.querySelector('#goYear').onclick = () => setYear(t.minYear);
  }
  function topicView(t, tab) {
    document.title = `${t.name} · MathQuest`;
    if (S.year < t.minYear || !skillsFor(t).length) return lockedPage(t);
    app.innerHTML = head(t, null, TABS.map(([id, ic, l]) => [id, ic, l, `#/t/${t.id}/${id}`]), tab) + `<div id="tabBody" class="tab-body" style="--c:${t.color}"></div>`;
    const body = app.querySelector('#tabBody');
    const sk = skillsFor(t);
    if (tab === 'learn') {
      body.innerHTML = `<div class="skill-grid">${sk.map((s, i) => {
        const st = starsOf(t.id, `${s.id}-${S.year}`);
        return `<a class="skill-card" href="#/t/${t.id}/s/${s.id}" style="animation-delay:${i * 0.04}s">
          <span class="sk-num">${i + 1}</span>
          <div class="sk-main"><h3>${s.icon ? s.icon + ' ' : ''}${s.title}</h3><p>${s.desc || ''}</p></div>
          <div class="sk-side">${starRow(st)}<span class="sk-go">Start ▶</span></div></a>`;
      }).join('')}</div>`;
    } else if (tab === 'explore') {
      if (t.explore) t.explore(body, S.year); else body.innerHTML = '<p class="card">Nothing to explore here yet.</p>';
    } else if (tab === 'problems') {
      const ws = sk.filter((s) => s.word);
      quiz(body, { pick: () => { const s = U.pick(ws.length ? ws : sk); return { p: s.word ? s.word(S.year) : s.gen(S.year), t }; }, starKey: [t.id, `_problems-${S.year}`], links: [[`#/t/${t.id}/learn`, '📖 Lessons']] });
    } else {
      quiz(body, { pick: () => ({ p: U.pick(sk).gen(S.year), t }), starKey: [t.id, `_mixed-${S.year}`], links: [[`#/t/${t.id}/learn`, '📖 Lessons']] });
    }
  }

  /* ---------------- skill page: lesson player + practice ---------------- */
  function skillView(t, s, sub) {
    document.title = `${s.title} · MathQuest`;
    if (S.year < s.years[0] || S.year > s.years[1]) {
      const fit = Math.min(Math.max(S.year, s.years[0]), s.years[1]);
      app.innerHTML = `<div class="locked-page card">${MASCOT}<h1>${s.title}</h1><p>This lesson is for <b>${yn(s.years[0])}${s.years[1] > s.years[0] ? `–${s.years[1]}` : ''}</b>. You are in ${yn(S.year)}.</p>
        <div class="row-center"><button class="btn" id="goYear">Switch to ${yn(fit)}</button><a class="btn ghost" href="#/t/${t.id}/learn">Back to lessons</a></div></div>`;
      app.querySelector('#goYear').onclick = () => setYear(fit);
      return;
    }
    const base = `#/t/${t.id}/s/${s.id}`;
    const tabs = [['lesson', '👣', 'Step-by-step lesson', base], ['practice', '✏️', 'Practise', `${base}/practice`]];
    if (s.word) tabs.push(['problems', '🧩', 'Real-life problems', `${base}/problems`]);
    app.innerHTML = head(t, s, tabs, sub) + `<div id="tabBody" class="tab-body" style="--c:${t.color}"></div>`;
    const body = app.querySelector('#tabBody');
    const sk = skillsFor(t);
    const nextSkill = sk[sk.indexOf(s) + 1];
    const links = [[base, '👣 Lesson again']];
    if (nextSkill) links.push([`#/t/${t.id}/s/${nextSkill.id}`, `➡️ Next: ${nextSkill.title}`]);
    if (sub === 'practice') quiz(body, { pick: () => ({ p: s.gen(S.year), t }), starKey: [t.id, `${s.id}-${S.year}`], links });
    else if (sub === 'problems' && s.word) quiz(body, { pick: () => ({ p: s.word(S.year), t }), starKey: [t.id, `${s.id}-w-${S.year}`], links });
    else player(body, s, base);
  }

  function player(body, s, base) {
    let frames = s.lesson(S.year), k = 0;
    const done = new Set();
    function render() {
      const f = frames[k];
      const last = k === frames.length - 1;
      body.innerHTML = `
        <div class="player">
          <div class="pl-top">
            <div class="pl-dots">${frames.map((_, j) => `<span class="${j < k ? 'past' : j === k ? 'now' : ''}"></span>`).join('')}</div>
            <span class="muted">Step ${k + 1} of ${frames.length}</span>
            ${s.fixedLesson ? '' : '<button class="btn ghost small" data-new>🔄 New numbers</button>'}
          </div>
          <div class="pl-say"><div class="pl-pip">${MASCOT}</div><div class="bubble2">${U.canSpeak() ? '<button class="spk" data-spk aria-label="Read aloud" title="Listen">🔊</button>' : ''}${f.say || ''}</div></div>
          <div class="pl-show"></div>
          ${f.try ? '<div class="pl-try"><div class="pl-try-lab">✋ Your turn!</div><div class="pl-try-box"></div></div>' : ''}
          <div class="pl-nav">
            <button class="btn ghost" data-back ${k === 0 ? 'disabled' : ''}>← Back</button>
            ${last ? `<a class="btn alt" href="${base}/practice">✏️ Practise now</a>` : '<button class="btn" data-next>Next →</button>'}
          </div>
        </div>`;
      const show = body.querySelector('.pl-show');
      if (typeof f.show === 'function') f.show(show); else show.innerHTML = f.show || '';
      if (!show.innerHTML.trim()) show.hidden = true;
      const nb = body.querySelector('[data-next]');
      if (f.try) {
        if (nb && !done.has(k)) { nb.disabled = true; nb.title = 'Finish “Your turn” first'; }
        W.run(body.querySelector('.pl-try-box'), f.try, {
          compact: true, noHow: !f.try.steps,
          onDone: () => { done.add(k); if (nb) { nb.disabled = false; nb.classList.add('glow'); } },
        });
      }
      if (nb) nb.onclick = () => { k++; render(); window.scrollTo({ top: body.offsetTop - 90, behavior: 'smooth' }); };
      body.querySelector('[data-back]').onclick = () => { if (k > 0) { k--; render(); } };
      const readFrame = () => { U.speak(f.say || ''); if (f.try) U.speak(f.try.q || f.try.say || '', true); };
      const sb = body.querySelector('[data-spk]');
      if (sb) sb.onclick = readFrame;
      if (U.autoSpeak()) setTimeout(readFrame, 250);
      const nw = body.querySelector('[data-new]');
      if (nw) nw.onclick = () => { frames = s.lesson(S.year); k = 0; done.clear(); render(); };
    }
    render();
  }

  function mixedView() {
    document.title = 'Mixed challenge · MathQuest';
    const t0 = { id: 'mixed', name: 'Mixed challenge', icon: '🎯', color: '#8b5cf6', tagline: 'Questions from every topic' };
    app.innerHTML = head(t0, null, null) + '<div id="tabBody" class="tab-body" style="--c:#8b5cf6"></div>';
    quiz(app.querySelector('#tabBody'), {
      mixed: true,
      pick: () => { const t = U.pick(unlocked()); const s = U.pick(skillsFor(t)); return { p: s.word && Math.random() < 0.3 ? s.word(S.year) : s.gen(S.year), t }; },
      starKey: ['_mixed', `all-${S.year}`], links: [],
    });
  }

  /* ---------------- quiz ---------------- */
  function quiz(root, cfg) {
    let i = 0, score = 0, lastQ = '';
    function load() {
      if (i >= QUESTIONS) return finish();
      let item;
      for (let k = 0; k < 25; k++) { item = cfg.pick(); if (item.p.q !== lastQ) break; }
      lastQ = item.p.q;
      const { p, t } = item;
      root.innerHTML = `
        <div class="quiz">
          <div class="quiz-top">
            <div class="qprogress" role="progressbar" aria-valuemin="0" aria-valuemax="${QUESTIONS}" aria-valuenow="${i}"><div style="width:${(i / QUESTIONS) * 100}%"></div></div>
            <span class="qcount">${i + 1} / ${QUESTIONS}</span>
            <span class="qscore">⭐ ${score}</span>
          </div>
          <div class="qcard">
            ${cfg.mixed ? `<span class="qtopic" style="--c:${t.color}">${t.icon} ${t.name}</span>` : ''}
            <div class="qbox"></div>
            <div class="qactions"><button class="btn" id="nextBtn" hidden>Next →</button></div>
          </div>
        </div>`;
      const nb = root.querySelector('#nextBtn');
      W.run(root.querySelector('.qbox'), p, {
        autofocus: true,
        onDone: ({ firstTry }) => {
          if (firstTry) { score++; root.querySelector('.qscore').textContent = `⭐ ${score}`; root.querySelector('.qcard').classList.add('pop'); }
          nb.hidden = false;
          nb.textContent = i + 1 >= QUESTIONS ? 'See my score 🏆' : 'Next →';
          setTimeout(() => nb.focus({ preventScroll: true }), 50);
        },
      });
      nb.onclick = () => { i++; load(); window.scrollTo({ top: root.offsetTop - 90, behavior: 'smooth' }); };
    }
    function finish() {
      const stars = score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
      if (cfg.starKey) saveStars(cfg.starKey[0], cfg.starKey[1], stars);
      const msg = stars === 3 ? 'Amazing! You are a maths superstar! 🌟' : stars === 2 ? 'Great work! Nearly perfect!' : stars === 1 ? 'Good effort! Practise a bit more to get more stars.' : 'Keep going! Watch the lesson again and try once more — you can do it!';
      if (stars >= 2) { U.sound('win'); U.confetti(); }
      root.innerHTML = `
        <div class="result card">
          ${MASCOT}
          <h2>${score} / ${QUESTIONS} right on the first try</h2>
          <div class="big-stars">${starRow(stars)}</div>
          <p>${msg}</p>
          <div class="row-center">
            <button class="btn" id="again">🔁 Play again</button>
            ${cfg.links.map(([h, l]) => `<a class="btn ghost" href="${h}">${l}</a>`).join('')}
            <a class="btn ghost" href="#/">🏠 Home</a>
          </div>
        </div>`;
      root.querySelector('#again').onclick = () => { i = 0; score = 0; load(); };
    }
    load();
  }

  window.MQ = { route };
  route();
})();
