/**
 * app.js — Spartan 2027 training app.
 *
 * Tabs: Today, Week, Reps, Progress, Plan. Full-screen runners for a session,
 * an interval timer and the mobility routine; bottom sheets for coaching
 * cards and quick logs. All plan content comes from plan.js; everything the
 * user does is an entry in store.js.
 */
(function () {
  'use strict';

  const P = window.PLAN;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const main = $('#main');

  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) { } };

  // ---------------------------------------------------------------- dates
  const DAY = 864e5;
  const pad = (n) => String(n).padStart(2, '0');
  const isoOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => isoOf(new Date());
  const parse = (s) => new Date(s + 'T12:00:00');
  const addDays = (s, n) => isoOf(new Date(parse(s).getTime() + n * DAY));
  const fmt = (s, o) => parse(s).toLocaleDateString('en-US', o || { month: 'short', day: 'numeric' });
  const weekOf = (s) => Math.min(P.weeks.length, Math.max(1, Math.floor((parse(s) - parse(P.start)) / (7 * DAY)) + 1));
  const preseason = () => today() < P.start;
  const daysToRace = () => Math.round((parse(P.race.date) - parse(today())) / DAY);
  const curWeek = () => weekOf(today());
  const W = (n) => P.weeks[n - 1];
  const phaseOf = (n) => P.phases.find((p) => p.id === W(n).phase);

  // ---------------------------------------------------------------- derived
  const sessionsIn = (n) => Store.byKind('session').filter((e) => e.week === n);
  const countIn = (n) => sessionsIn(n).length;
  const doneKeys = (n) => new Set(sessionsIn(n).map((e) => e.key));
  function streak() {
    const cur = curWeek();
    let s = countIn(cur) >= W(cur).min ? 1 : 0;
    for (let n = cur - 1; n >= 1; n--) { if (countIn(n) >= W(n).min) s++; else break; }
    return s;
  }
  function nextSession(n) {
    const done = doneKeys(n), w = W(n);
    return w.sessions.find((k) => !done.has(k) && !P.sessions[k].optional) || w.sessions.find((k) => !done.has(k)) || null;
  }
  const gtgFor = (date) => Store.get('gtg-' + date) || { id: 'gtg-' + date, kind: 'gtg', date: date, counts: {} };
  const mobilityDone = (date, which) => !!Store.get('mob-' + which + '-' + date);

  // exercises that take a weight
  const LOAD = new Set(['goblet-squat', 'db-rdl', 'lat-pulldown', 'farmer-carry', 'suitcase-carry', 'step-up', 'hip-thrust', 'db-bench', 'db-row',
    'bss', 'sl-rdl', 'trap-deadlift', 'kb-swing', 'walking-lunge', 'sandbag-carry', 'half-kneel-press', 'pullup-assist']);
  const TIMED_EX = new Set(['dead-hang', 'towel-hang', 'side-plank', 'towel-wring']);
  const isTimed = (b) => TIMED_EX.has(b.ex) || /\d+\s*s\b|−\s*\d+\s*s/.test(b.reps);
  const SPECIAL = new Set(['run', 'hike', 'race', 'mobility-long']);
  const firstNum = (s) => { if (/AMRAP|max/i.test(s)) return null; const m = String(s).match(/\d+/); return m ? +m[0] : null; };

  // ---------------------------------------------------------------- sound, wake lock, toast
  let actx = null;
  function beep(freq, ms) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = freq || 880; o.type = 'square';
      g.gain.setValueAtTime(0.08, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (ms || 180) / 1000);
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + (ms || 180) / 1000);
    } catch (e) { }
    try { navigator.vibrate && navigator.vibrate(ms || 180); } catch (e) { }
  }
  document.addEventListener('touchstart', () => { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } }, { once: true, passive: true });

  let wake = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); }
      if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }

  let toastT = 0;
  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2400);
  }

  const mmss = (sec) => { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + pad(sec % 60); };

  // ---------------------------------------------------------------- figures
  function thumb(ex) {
    const m = window.MOVES[ex];
    if (!m) return `<div class="thumb" aria-hidden="true"></div>`;
    const pose = (m.frames[1] || m.frames[0]).pose;
    return `<div class="thumb" aria-hidden="true">${Figure.svg(m, Figure.render(m, pose))}</div>`;
  }

  // ---------------------------------------------------------------- icons
  const ICON = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3c4.5 0 7 2.8 7 7.5V17c0 1.5-1 2.4-2.4 2.7L14 20l-.3-4.5c0-1-.7-1.5-1.7-1.5s-1.7.5-1.7 1.5L10 20l-2.6-.3C6 19.4 5 18.5 5 17v-6.5C5 5.8 7.5 3 12 3z"/><path d="M7.5 10.5h3.5v2.5M16.5 10.5H13v2.5"/></svg>',
    week: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3.5" y="5" width="17" height="15"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    reps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18M7 6v3a5 5 0 0 0 10 0V6"/><path d="M12 14v6M9 20h6"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 20l6-8 4 4 8-11"/><path d="M15 5h6v6"/></svg>',
    plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M2 20l7-13 4 7 3-4 6 10z"/></svg>',
  };

  // ---------------------------------------------------------------- state + tabs
  const state = { tab: lsGet('spartan27.tab', 'today'), week: null, variant: lsGet('spartan27.variant', 'gym') };
  const TABS = [['today', 'Today'], ['week', 'Week'], ['reps', 'Reps'], ['progress', 'Progress'], ['plan', 'Plan']];
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(([k, label]) => `<button type="button" data-tab="${k}" ${state.tab === k ? 'aria-current="page"' : ''}>${ICON[k]}<span>${label}</span></button>`).join('');
  }
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    go(b.dataset.tab);
  });
  function go(tab, opts) {
    state.tab = tab; lsSet('spartan27.tab', tab);
    if (opts && opts.week) state.week = opts.week;
    render(); main.scrollTop = 0;
  }
  function render() {
    renderTabs();
    const v = { today: viewToday, week: viewWeek, reps: viewReps, progress: viewProgress, plan: viewPlan }[state.tab] || viewToday;
    main.innerHTML = `<div class="view">${v()}</div>`;
  }

  // delegated actions: data-act="name" data-*
  const ACT = {};
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
  });

  // ================================================================ TODAY
  function tally(n) {
    const w = W(n), c = countIn(n), total = Math.max(w.target, c);
    let s = '';
    for (let i = 0; i < total; i++) s += `<i class="${i < c ? 'on' : ''} ${i === w.min - 1 ? 'min' : ''}"></i>`;
    return `<div class="tally" aria-label="${c} of ${w.target} sessions">${s}</div>`;
  }

  function sessionMeta(k) {
    const s = P.sessions[k];
    return `${s.minutes} min · ${s.kind === 'hike' ? 'long climb' : s.kind}${s.optional ? ' · bonus' : ''}`;
  }

  function viewToday() {
    const n = curWeek(), w = W(n), ph = phaseOf(n), d = daysToRace();
    const next = nextSession(n), c = countIn(n);
    const t = today(), g = gtgFor(t), gt = w.gtg;
    const repsPct = P.gtg.items.filter((it) => gt[it.key]).map((it) => Math.min(1, (g.counts[it.key] || 0) / gt[it.key]));
    const avg = repsPct.length ? repsPct.reduce((a, b) => a + b, 0) / repsPct.length : 0;
    const mobDone = mobilityDone(t, 'daily');
    const st = Store.status();

    let nextCard;
    if (d < 0) {
      nextCard = `<div class="card red"><h3>Finished.</h3><p>You trained for this. Log how it went in Progress.</p></div>`;
    } else if (next) {
      const s = P.sessions[next];
      const blocks = s[state.variant].filter((b) => !SPECIAL.has(b.ex)).slice(0, 4).map((b) => P.exercises[b.ex].name);
      const others = w.sessions.filter((k) => k !== next && !doneKeys(n).has(k));
      nextCard = `<div class="card red">
        <div class="spread"><span class="lbl">Next up</span><span class="lbl">${esc(sessionMeta(next))}</span></div>
        <h1 style="font-size:40px">${esc(s.name)}</h1>
        ${s.kind === 'run' ? `<p>${esc(w.run)}</p>` : ''}
        ${s.kind === 'hike' ? `<p>${w.climb.feet ? `<b class="num">${w.climb.feet.toLocaleString('en-US')} ft</b> of climbing. ` : ''}Trail, treadmill, stairs or bike.</p>` : ''}
        ${blocks.length ? `<p class="dim small">${blocks.map(esc).join(' · ')}</p>` : ''}
        <button class="btn block" data-act="start" data-key="${next}" data-week="${n}">Start</button>
        ${others.length ? `<div class="row wrap"><span class="lbl">Or</span>${others.map((k) => `<button class="chip" data-act="start" data-key="${k}" data-week="${n}">${esc(P.sessions[k].name)}</button>`).join('')}</div>` : ''}
      </div>`;
    } else {
      nextCard = `<div class="card red"><span class="lbl">Week ${n}</span><h1 style="font-size:40px">Week conquered</h1><p>Every session done. Rest, do your reps and mobility, and come back Monday.</p></div>`;
    }

    return `
      <div class="hero">
        <img src="helmet.svg" alt="">
        <div><div class="count num">${Math.max(0, d)}<small>${d === 0 ? 'Race day' : 'days to Snowbasin'}</small></div></div>
      </div>
      <div class="stripe"></div>
      ${preseason() ? `<div class="note">Week 1 starts <b>Monday ${fmt(P.start, { month: 'long', day: 'numeric' })}</b>. Want a head start? Do the baseline test (Progress) this weekend.</div>` : ''}
      <div class="card">
        <div class="spread">
          <div class="stat"><span class="lbl">Week ${n} of ${P.weeks.length}</span><b>${esc(ph.name)}</b></div>
          <div class="stat" style="text-align:right"><span class="lbl">Streak</span><b class="num">${streak()} wk</b></div>
        </div>
        <div class="spread">${tally(n)}<span class="small dim num">${c} done · ${w.min} min · ${w.target} target</span></div>
        ${w.deload ? `<div class="note">${w.flags.includes('light') ? 'Light week.' : 'Deload week.'} Same exercises, about a third less: drop a set from everything.</div>` : ''}
      </div>
      ${nextCard}
      <div class="card">
        <h2>Every day</h2>
        <button class="item" data-act="tab" data-tab="reps">
          <span class="mark ${avg >= 1 ? 'on' : ''}">${avg >= 1 ? '✓' : Math.round(avg * 100)}</span>
          <span><b>Reps</b><br><span class="small dim">${gt.pushups} push-ups · ${gt.pullups} pull-ups · ${gt.hang}s hang · ${gt.squats} squats · ${gt.burpees} burpees</span></span>
          <span class="dim">›</span>
        </button>
        <button class="item" data-act="mobility" data-which="daily">
          <span class="mark ${mobDone ? 'on' : ''}">${mobDone ? '✓' : ''}</span>
          <span><b>Mobility</b><br><span class="small dim">12 min · hips, back, calves, feet</span></span>
          <span class="dim">›</span>
        </button>
        <button class="item" data-act="activity">
          <span class="mark">+</span>
          <span><b>Log a walk, run or hike</b><br><span class="small dim">Anything outside the plan</span></span>
          <span class="dim">›</span>
        </button>
      </div>
      ${w.note ? `<div class="note">${esc(w.note)}</div>` : ''}
      ${w.test ? `<button class="btn ghost block" data-act="tab" data-tab="progress">Retest week · log benchmarks</button>` : ''}
      <p class="tiny faint">${st.configured ? (st.pending ? `${st.pending} change${st.pending > 1 ? 's' : ''} waiting to sync` : `Synced${st.lastSync ? ' ' + new Date(st.lastSync).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`) : 'Saved on this phone. Add your sync key in Plan → Settings to back it up.'}</p>`;
  }

  ACT.tab = (el) => go(el.dataset.tab);

  // ================================================================ WEEK
  function viewWeek() {
    const n = state.week || curWeek(), w = W(n), ph = phaseOf(n);
    const done = sessionsIn(n);
    const acts = Store.byKind('activity').filter((a) => weekOf(a.date) === n).sort((a, b) => a.date < b.date ? -1 : 1);
    const chips = [];
    if (w.test) chips.push('Retest');
    if (w.deload) chips.push(w.flags.includes('light') ? 'Light' : 'Deload');
    if (w.flags.includes('recon')) chips.push('Snowbasin recon');
    if (w.flags.includes('rehearsal')) chips.push('Dress rehearsal');
    if (w.flags.includes('race')) chips.push('Race week');
    return `
      <div class="spread">
        <button class="btn ghost small" data-act="wk" data-d="-1" ${n <= 1 ? 'disabled' : ''} aria-label="Previous week">‹</button>
        <div style="text-align:center"><h1 style="font-size:38px">Week ${n}</h1><span class="small dim">${fmt(w.starts)} – ${fmt(w.ends)} · ${esc(ph.name)}</span></div>
        <button class="btn ghost small" data-act="wk" data-d="1" ${n >= P.weeks.length ? 'disabled' : ''} aria-label="Next week">›</button>
      </div>
      ${n !== curWeek() ? `<button class="chip" data-act="wk" data-d="0">Back to this week</button>` : ''}
      <div class="card">
        <div class="spread">${tally(n)}<span class="small dim num">${done.length} done · ${w.min} min · ${w.target} target</span></div>
        ${chips.length ? `<div class="row wrap">${chips.map((c) => `<span class="chip" aria-pressed="true">${esc(c)}</span>`).join('')}</div>` : ''}
        <div class="list">${w.sessions.map((k, i) => {
          const e = done.find((x) => x.key === k);
          return `<button class="item" data-act="start" data-key="${k}" data-week="${n}" ${e ? `data-entry="${e.id}"` : ''}>
            <span class="mark ${e ? 'on' : ''}">${e ? '✓' : String.fromCharCode(65 + i)}</span>
            <span><b>${esc(P.sessions[k].name)}</b><br><span class="small dim">${esc(sessionMeta(k))}</span></span>
            <span class="small ${e ? '' : 'dim'}">${e ? fmt(e.date, { weekday: 'short' }) : '›'}</span></button>`;
        }).join('')}</div>
      </div>
      <div class="card">
        <div><span class="lbl">Run</span><p>${esc(w.run)}</p></div>
        <div><span class="lbl">Long climb</span><p>${w.climb.feet ? `<b class="num">${w.climb.feet.toLocaleString('en-US')} ft.</b> ` : ''}${esc(w.hike)}</p></div>
        <div><span class="lbl">Daily reps</span><p class="num">${w.gtg.pushups} push-ups · ${w.gtg.pullups} pull-ups · ${w.gtg.hang}s hang · ${w.gtg.squats} squats · ${w.gtg.burpees} burpees</p></div>
      </div>
      ${w.note ? `<div class="note">${esc(w.note)}</div>` : ''}
      <div class="card">
        <div class="spread"><h2>Also logged</h2><button class="chip" data-act="activity">+ Add</button></div>
        ${acts.length ? `<div class="list">${acts.map(actRow).join('')}</div>` : `<p class="empty">Walks, runs and hikes outside the plan show up here.</p>`}
      </div>`;
  }
  ACT.wk = (el) => { const d = +el.dataset.d; state.week = d === 0 ? curWeek() : Math.min(P.weeks.length, Math.max(1, (state.week || curWeek()) + d)); render(); };

  function actRow(a) {
    const bits = [a.minutes && a.minutes + ' min', a.miles && a.miles + ' mi', a.feet && Number(a.feet).toLocaleString('en-US') + ' ft'].filter(Boolean).join(' · ');
    return `<button class="item" data-act="activity" data-entry="${a.id}"><span class="mark">${esc((a.type || 'o').charAt(0).toUpperCase())}</span>
      <span><b>${esc(a.type || 'Activity')}</b><br><span class="small dim">${esc(bits || '—')}</span></span><span class="small dim">${fmt(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span></button>`;
  }

  // ================================================================ SESSION RUNNER
  let S = null;   // the open session: { key, week, entryId, draft }
  const draftKey = (week, key) => 'spartan27.draft.' + week + '.' + key;

  ACT.start = (el) => openSession(el.dataset.key, +el.dataset.week, el.dataset.entry);

  function openSession(key, week, entryId) {
    const s = P.sessions[key];
    let draft;
    const existing = entryId ? Store.get(entryId) : null;
    if (existing) {
      draft = { variant: existing.variant || 'gym', option: existing.option || 'trail', sets: {}, warm: [], minutes: existing.minutes || '', miles: existing.miles || '', feet: existing.feet || '', rpe: existing.rpe || '', note: existing.note || '', startedAt: Date.now(), date: existing.date };
      draft.sets[draft.variant] = (existing.blocks || []).map((b) => b.sets.map((x) => Object.assign({ done: true }, x)));
    } else {
      draft = lsGet(draftKey(week, key), null) || { variant: state.variant, option: lsGet('spartan27.climb', 'trail'), sets: {}, warm: [], minutes: '', miles: '', feet: '', rpe: '', note: '', startedAt: Date.now() };
      if (s.kind === 'hike' && !lsGet(draftKey(week, key), null) && W(week).n >= 5 && W(week).n <= 20 && !lsGet('spartan27.climb', null)) draft.option = 'treadmill';
    }
    S = { key: key, week: week, entryId: existing ? existing.id : null, draft: draft };
    drawSession();
    keepAwake(true);
  }

  function blocksOf() { return P.sessions[S.key][S.draft.variant]; }
  function setsOf(i, b) {
    const v = S.draft.variant;
    S.draft.sets[v] = S.draft.sets[v] || [];
    if (!S.draft.sets[v][i]) S.draft.sets[v][i] = Array.from({ length: Math.max(1, b.sets) }, () => ({ r: '', w: '', s: '', done: false }));
    return S.draft.sets[v][i];
  }
  function saveDraft() { if (S && !S.entryId) lsSet(draftKey(S.week, S.key), S.draft); }

  function lastTime(ex) {
    const list = Store.byKind('session').sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const e of list) {
      if (S && e.id === S.entryId) continue;
      const blk = (e.blocks || []).find((b) => b.ex === ex && b.sets && b.sets.length);
      if (blk) {
        const reps = blk.sets.map((x) => x.r || (x.s ? x.s + 's' : '')).filter(Boolean).join(', ');
        const wts = blk.sets.map((x) => +x.w).filter((x) => x > 0);
        return { text: `Last time (${fmt(e.date)}): ${reps || 'done'}${wts.length ? ' @ ' + Math.max.apply(null, wts) + ' lb' : ''}`, w: wts.length ? Math.max.apply(null, wts) : '' };
      }
    }
    return null;
  }

  function doseText(b) {
    if (b.reps === 'circuit') return 'Circuit';
    if (b.sets > 1) return `${b.sets} × ${b.reps}`;
    return b.reps;
  }

  function drawSession() {
    const s = P.sessions[S.key], w = W(S.week), d = S.draft;
    let el = $('#session');
    if (!el) { el = document.createElement('div'); el.id = 'session'; el.className = 'screen'; document.body.appendChild(el); }
    const blocks = blocksOf();
    const showWarm = s.kind === 'strength' || s.kind === 'ocr';
    el.innerHTML = `
      <header>
        <div class="spread">
          <div><span class="lbl">Week ${S.week} · ${esc(sessionMeta(S.key))}</span><h1 style="font-size:30px">${esc(s.name)}</h1></div>
          <button class="x" data-act="closeSession" aria-label="Close">✕</button>
        </div>
        <div class="row"><button class="chip" data-act="variant" data-v="gym" aria-pressed="${d.variant === 'gym'}">Gym</button><button class="chip" data-act="variant" data-v="hotel" aria-pressed="${d.variant === 'hotel'}">Hotel / no gym</button>
        ${S.entryId ? `<span class="small dim">Logged ${fmt(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>` : ''}</div>
      </header>
      <div class="body"><div class="stack">
        ${w.deload ? `<div class="note">Deload week: do one less set of everything.</div>` : ''}
        ${showWarm ? `<details class="blk"><summary class="spread"><span><b>Warm-up</b> <span class="small dim">7 min, every session</span></span><span class="dim">${d.warm.filter(Boolean).length}/${P.warmup.length}</span></summary>
          <div class="list" style="margin-top:8px">${P.warmup.map((x, i) => `<button class="item" data-act="warm" data-i="${i}"><span class="mark ${d.warm[i] ? 'on' : ''}">${d.warm[i] ? '✓' : ''}</span><span><b>${esc(x.name)}</b> <span class="small dim">${esc(x.dose)}</span><br><span class="small dim">${esc(x.how)}</span></span><span></span></button>`).join('')}</div></details>` : ''}
        ${blocks.map((b, i) => blockHTML(b, i)).join('')}
        <div class="blk">
          <b>How hard was it?</b>
          <div class="row wrap">${[['3', 'Easy'], ['5', 'Solid'], ['7', 'Hard'], ['9', 'Brutal']].map(([v, l]) => `<button class="chip" data-act="rpe" data-v="${v}" aria-pressed="${String(d.rpe) === v}">${l}</button>`).join('')}</div>
          <label class="small dim" for="s-note">Notes</label>
          <textarea id="s-note" data-f="note" placeholder="Anything worth remembering: weights, how the back felt, where you hiked">${esc(d.note)}</textarea>
        </div>
      </div></div>
      <footer><button class="btn block" data-act="finish">${S.entryId ? 'Save changes' : 'Finish session'}</button>
        ${S.entryId ? `<button class="chip" style="margin-top:8px;width:100%" data-act="deleteSession">Delete this log</button>` : ''}</footer>`;
    el.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('input', () => { S.draft[inp.dataset.f] = inp.value; saveDraft(); }));
    el.querySelectorAll('[data-set]').forEach((inp) => inp.addEventListener('input', () => {
      const [i, j, f] = inp.dataset.set.split('.');
      setsOf(+i, blocksOf()[+i])[+j][f] = inp.value; saveDraft();
    }));
  }

  function blockHTML(b, i) {
    const d = S.draft, w = W(S.week), e = P.exercises[b.ex];
    if (b.ex === 'run' && (b.reps === 'week' || (P.sessions[S.key].kind === 'run' && b.sets === 1))) {
      const text = b.reps === 'week' ? w.run : b.reps;
      const segs = runSegments(text);
      return `<div class="blk">
        <div class="blk-head" data-act="coach" data-ex="run">${thumb('run')}<span><b>${esc(text)}</b>${b.note ? `<br><span class="small dim">${esc(b.note)}</span>` : ''}</span></div>
        ${segs ? `<button class="btn block" data-act="timer" data-i="${i}">Start timer · ${mmss(segs.reduce((a, x) => a + x.sec, 0))}</button>` : ''}
        ${statFields(['minutes', 'miles'])}</div>`;
    }
    if (b.ex === 'hike') {
      const opt = P.climbOptions.find((o) => o.key === d.option) || P.climbOptions[0];
      return `<div class="blk">
        <div class="blk-head" data-act="coach" data-ex="hike">${thumb('hike')}<span><b>${w.climb.feet ? w.climb.feet.toLocaleString('en-US') + ' ft of climbing' : 'Long climb'}</b>${b.note ? `<br><span class="small dim">${esc(b.note)}</span>` : ''}</span></div>
        <div class="row wrap">${P.climbOptions.map((o) => `<button class="chip" data-act="climb" data-v="${o.key}" aria-pressed="${o.key === opt.key}">${esc(o.name)}</button>`).join('')}</div>
        <p><span class="lbl">${esc(opt.where)}</span><br>${esc(opt.dose(w))}</p>
        ${statFields(['minutes', 'miles', 'feet'])}</div>`;
    }
    if (b.ex === 'race') {
      return `<div class="blk"><b>${esc(b.reps)}</b><p>${esc(b.note)}</p>${statFields(['minutes'])}</div>`;
    }
    if (b.ex === 'mobility-long') {
      return `<div class="blk"><div class="spread"><span><b>Long mobility routine</b><br><span class="small dim">25 min</span></span><button class="btn small" data-act="mobility" data-which="long">Start</button></div></div>`;
    }
    const sets = setsOf(i, b), timed = isTimed(b), load = LOAD.has(b.ex) && S.draft.variant === 'gym';
    const last = lastTime(b.ex);
    const allDone = sets.every((x) => x.done);
    const target = firstNum(b.reps);
    let rows;
    if (b.reps === 'circuit') {
      rows = `<div class="set nowt"><span class="n">✓</span><span class="small dim">All three moves, in order</span><button class="tick ${sets[0].done ? 'on' : ''}" data-act="tick" data-i="${i}" data-j="0">✓</button></div>`;
    } else {
      rows = sets.map((x, j) => `<div class="set ${load ? '' : 'nowt'}">
        <span class="n">${j + 1}</span>
        ${timed
          ? `<button class="sw ${swRunning(i, j) ? 'run' : ''}" data-act="sw" data-i="${i}" data-j="${j}">${x.s ? x.s + ' s' : (swRunning(i, j) ? 'Stop' : '⏱ Start')}</button>`
          : `<input type="text" inputmode="numeric" data-set="${i}.${j}.r" value="${esc(x.r)}" placeholder="${esc(target != null ? target : 'max')}" aria-label="Set ${j + 1} reps">`}
        ${load ? `<input type="text" inputmode="decimal" data-set="${i}.${j}.w" value="${esc(x.w)}" placeholder="${last && last.w ? last.w + ' lb' : 'lb'}" aria-label="Set ${j + 1} weight">` : ''}
        <button class="tick ${x.done ? 'on' : ''}" data-act="tick" data-i="${i}" data-j="${j}" aria-label="Set ${j + 1} done">✓</button></div>`).join('');
    }
    return `<div class="blk ${allDone ? 'done' : ''}">
      <button class="blk-head" data-act="coach" data-ex="${b.ex}">${thumb(b.ex)}<span><b>${esc(e.name)}</b> <span class="dim">ⓘ</span><br><span class="small dim">${esc(doseText(b))}${b.rest ? ` · rest ${b.rest}s` : ''}</span>${b.note ? `<br><span class="small" style="color:var(--gold)">${esc(b.note)}</span>` : ''}${last ? `<br><span class="tiny faint">${esc(last.text)}</span>` : ''}</span></button>
      <div class="sets">${rows}</div></div>`;
  }

  function statFields(fields) {
    const lab = { minutes: 'Minutes', miles: 'Miles', feet: 'Feet climbed' };
    return `<div class="row">${fields.map((f) => `<label style="flex:1" class="small dim">${lab[f]}<input type="text" inputmode="decimal" data-f="${f}" value="${esc(S.draft[f])}"></label>`).join('')}</div>`;
  }

  ACT.variant = (el) => { S.draft.variant = el.dataset.v; state.variant = el.dataset.v; lsSet('spartan27.variant', el.dataset.v); saveDraft(); drawSession(); };
  ACT.climb = (el) => { S.draft.option = el.dataset.v; lsSet('spartan27.climb', el.dataset.v); saveDraft(); drawSession(); };
  ACT.rpe = (el) => { S.draft.rpe = el.dataset.v; saveDraft(); $$('[data-act="rpe"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el))); };
  ACT.warm = (el) => { const i = +el.dataset.i; S.draft.warm[i] = !S.draft.warm[i]; saveDraft(); const m = $('.mark', el); m.classList.toggle('on', !!S.draft.warm[i]); m.textContent = S.draft.warm[i] ? '✓' : ''; };
  ACT.tick = (el) => {
    const i = +el.dataset.i, j = +el.dataset.j, b = blocksOf()[i], x = setsOf(i, b)[j];
    x.done = !x.done;
    if (x.done && !x.r && !isTimed(b)) { const t = firstNum(b.reps); if (t != null && b.reps !== 'circuit') x.r = String(t); }
    if (x.done && LOAD.has(b.ex) && !x.w) { const l = lastTime(b.ex); const prev = j > 0 ? setsOf(i, b)[j - 1].w : ''; x.w = prev || (l && l.w ? String(l.w) : ''); }
    saveDraft();
    const top = $('#session .body').scrollTop;
    drawSession();
    $('#session .body').scrollTop = top;
    if (x.done && b.rest) startRest(b.rest);
  };

  // stopwatch for timed sets
  let SW = null;   // { i, j, t0, raf }
  const swRunning = (i, j) => SW && SW.i === i && SW.j === j;
  ACT.sw = (el) => {
    const i = +el.dataset.i, j = +el.dataset.j;
    if (swRunning(i, j)) {
      const sec = Math.round((Date.now() - SW.t0) / 1000);
      clearInterval(SW.iv); SW = null;
      const x = setsOf(i, blocksOf()[i])[j]; x.s = String(sec); x.done = true; saveDraft();
      const top = $('#session .body').scrollTop; drawSession(); $('#session .body').scrollTop = top;
      const b = blocksOf()[i]; if (b.rest) startRest(b.rest);
      return;
    }
    if (SW) clearInterval(SW.iv);
    SW = { i: i, j: j, t0: Date.now() };
    el.classList.add('run');
    SW.iv = setInterval(() => { el.textContent = 'Stop · ' + Math.round((Date.now() - SW.t0) / 1000) + ' s'; }, 250);
  };

  // rest timer bar
  let REST = null;
  function startRest(sec) {
    stopRest();
    const end = Date.now() + sec * 1000;
    const bar = document.createElement('div'); bar.className = 'rest'; bar.setAttribute('role', 'timer');
    document.body.appendChild(bar);
    const draw = () => {
      const left = Math.ceil((end + (REST ? REST.extra : 0) - Date.now()) / 1000);
      if (left <= 0) { beep(988, 350); stopRest(); return; }
      if (left <= 3 && REST.lastBeep !== left) { REST.lastBeep = left; beep(660, 90); }
      bar.innerHTML = `<span>Rest ${mmss(left)}</span><span class="row"><button data-act="restAdd">+15 s</button><button data-act="restSkip">Skip</button></span>`;
    };
    REST = { bar: bar, extra: 0, iv: setInterval(draw, 250), lastBeep: null };
    draw();
  }
  function stopRest() { if (REST) { clearInterval(REST.iv); REST.bar.remove(); REST = null; } }
  ACT.restAdd = () => { if (REST) REST.extra += 15000; };
  ACT.restSkip = () => stopRest();

  ACT.closeSession = () => {
    saveDraft(); stopRest(); if (SW) { clearInterval(SW.iv); SW = null; }
    const el = $('#session'); if (el) el.remove();
    S = null; keepAwake(false); render();
  };

  ACT.finish = () => {
    const s = P.sessions[S.key], d = S.draft;
    const v = d.variant;
    const blocks = blocksOf().map((b, i) => ({
      ex: b.ex,
      sets: (d.sets[v] && d.sets[v][i] ? d.sets[v][i] : []).filter((x) => x.done).map((x) => { const o = {}; if (x.r) o.r = x.r; if (x.w) o.w = x.w; if (x.s) o.s = x.s; return o; }),
    })).filter((b) => b.sets.length);
    const elapsed = Math.round((Date.now() - (d.startedAt || Date.now())) / 60000);
    const entry = S.entryId ? Store.get(S.entryId) : { kind: 'session', date: today(), week: S.week, key: S.key };
    Object.assign(entry, {
      variant: v, option: s.kind === 'hike' ? d.option : undefined, blocks: blocks,
      minutes: d.minutes || (s.kind === 'strength' || s.kind === 'ocr' ? String(Math.min(elapsed, 180) || s.minutes) : ''),
      miles: d.miles, feet: d.feet, rpe: d.rpe, note: d.note,
    });
    Store.put(entry);
    lsDel(draftKey(S.week, S.key));
    const week = S.week, wasEdit = !!S.entryId;
    ACT.closeSession();
    if (wasEdit) { toast('Saved'); return; }
    celebrate(week);
  };
  ACT.deleteSession = (el) => {
    if (el.dataset.sure !== '1') { el.dataset.sure = '1'; el.textContent = 'Tap again to delete'; return; }
    Store.remove(S.entryId); ACT.closeSession(); toast('Deleted');
  };

  function celebrate(week) {
    const w = W(week), c = countIn(week);
    const msg = c >= w.target ? 'Week conquered.' : c >= w.min ? 'Minimum hit. Streak holds.' : `${w.min - c} more to hold the streak.`;
    sheet(`<div style="text-align:center;display:grid;gap:12px;padding:10px 0">
      <img src="helmet.svg" alt="" style="width:80px;margin:0 auto">
      <h1 style="font-size:44px">Session ${c} done</h1>
      <div style="display:flex;justify-content:center">${tally(week)}</div>
      <p class="dim">${msg}</p>
      <p class="tiny faint">Aroo.</p>
      <button class="btn block" data-act="closeSheet">Back to it</button></div>`);
  }

  // ---------------------------------------------------------------- interval timer
  function runSegments(text) {
    const t = String(text);
    const sec = (s) => (s.indexOf(':') >= 0 ? (+s.split(':')[0]) * 60 + (+s.split(':')[1]) : (+s) * 60);
    let m = t.match(/(\d+)\s*×\s*\((\d+(?::\d\d)?)\s*(?:min\s*)?jog\s*\+\s*(\d+(?::\d\d)?)\s*(?:min\s*)?walk\)/i);
    if (m) {
      const out = [{ label: 'Walk', sub: 'Warm-up, brisk', sec: 300 }];
      for (let i = 0; i < +m[1]; i++) {
        out.push({ label: 'Jog', sub: `Round ${i + 1} of ${m[1]} · easy, conversational`, sec: sec(m[2]) });
        out.push({ label: 'Walk', sub: 'Recover', sec: sec(m[3]) });
      }
      out.push({ label: 'Walk', sub: 'Cool-down', sec: 300 });
      return out;
    }
    if (/hill/i.test(t) && (m = t.match(/(\d+)\s*×\s*(\d+)\s*(s|min)/))) {
      const work = (+m[2]) * (m[3] === 'min' ? 60 : 1);
      const out = [{ label: 'Easy', sub: 'Warm-up jog', sec: 600 }];
      for (let i = 0; i < +m[1]; i++) {
        out.push({ label: 'Uphill', sub: `Rep ${i + 1} of ${m[1]} · hard but controlled`, sec: work });
        out.push({ label: 'Walk down', sub: 'Full recovery', sec: Math.round(work * 1.5) });
      }
      out.push({ label: 'Easy', sub: 'Cool-down', sec: 300 });
      return out;
    }
    if (/tempo/i.test(t)) {
      const n = (t.match(/\d+/g) || []).map(Number);
      if (n.length >= 3) return [{ label: 'Easy', sub: 'Warm-up', sec: n[0] * 60 }, { label: 'Tempo', sub: 'Comfortably hard: short sentences only', sec: n[1] * 60 }, { label: 'Easy', sub: 'Cool-down', sec: n[2] * 60 }];
    }
    if ((m = t.match(/(\d+)\s*min/))) {
      const out = [{ label: 'Easy', sub: 'Conversational pace', sec: (+m[1]) * 60 }];
      const st = t.match(/(\d+)\s*(?:×\s*20\s*s\s*)?(?:uphill\s*)?strides/);
      if (st) for (let i = 0; i < +st[1]; i++) { out.push({ label: 'Stride', sub: `${i + 1} of ${st[1]} · fast and relaxed`, sec: 20 }); out.push({ label: 'Walk', sub: 'Recover', sec: 60 }); }
      return out;
    }
    return null;
  }

  let T = null;
  ACT.timer = (el) => {
    const b = blocksOf()[+el.dataset.i];
    const segs = runSegments(b.reps === 'week' ? W(S.week).run : b.reps);
    if (!segs) return;
    T = { segs: segs, i: 0, left: segs[0].sec, paused: false, total: segs.reduce((a, x) => a + x.sec, 0), last: Date.now() };
    const scr = document.createElement('div'); scr.id = 'timer'; scr.className = 'screen';
    document.body.appendChild(scr);
    beep(880, 200);
    T.iv = setInterval(tickTimer, 250);
    drawTimer();
  };
  function tickTimer() {
    const now = Date.now(), dt = (now - T.last) / 1000; T.last = now;
    if (T.paused) return;
    const before = Math.ceil(T.left);
    T.left -= dt;
    const after = Math.ceil(T.left);
    if (after !== before && after <= 3 && after > 0) beep(660, 90);
    if (T.left <= 0) {
      T.i++;
      if (T.i >= T.segs.length) { beep(988, 600); finishTimer(true); return; }
      T.left = T.segs[T.i].sec; beep(988, 350);
    }
    drawTimer();
  }
  function drawTimer() {
    const el = $('#timer'); if (!el) return;
    const seg = T.segs[T.i], next = T.segs[T.i + 1];
    const doneSec = T.segs.slice(0, T.i).reduce((a, x) => a + x.sec, 0) + (seg.sec - T.left);
    el.innerHTML = `<header><div class="spread"><span class="lbl">Interval ${T.i + 1} of ${T.segs.length}</span><button class="x" data-act="timerClose" aria-label="Stop timer">✕</button></div></header>
      <div class="body"><div class="timer">
        <div class="phase">${esc(seg.label)}</div><div class="dim">${esc(seg.sub)}</div>
        <div class="clock num">${mmss(T.left)}</div>
        <div class="bar"><span style="width:${(doneSec / T.total * 100).toFixed(1)}%"></span></div>
        <div class="small dim num">${mmss(doneSec)} of ${mmss(T.total)}${next ? ` · next: ${esc(next.label)} ${mmss(next.sec)}` : ' · last one'}</div>
      </div>
      <div class="list">${T.segs.map((x, i) => i < T.i - 1 ? '' : `<div class="item"><span class="mark ${i < T.i ? 'on' : ''}">${i < T.i ? '✓' : i + 1}</span><span class="${i === T.i ? '' : 'dim'}">${esc(x.label)}</span><span class="small dim num">${mmss(x.sec)}</span></div>`).join('')}</div></div>
      <footer class="row"><button class="btn ghost" style="flex:1" data-act="timerPause">${T.paused ? 'Resume' : 'Pause'}</button><button class="btn ghost" style="flex:1" data-act="timerSkip">Skip</button></footer>`;
  }
  function finishTimer(completed) {
    clearInterval(T.iv);
    const mins = Math.round(T.segs.slice(0, completed ? T.segs.length : T.i).reduce((a, x) => a + x.sec, 0) / 60);
    T = null;
    const el = $('#timer'); if (el) el.remove();
    if (S && completed && !S.draft.minutes) { S.draft.minutes = String(mins); saveDraft(); drawSession(); toast('Nice. ' + mins + ' minutes logged.'); }
  }
  ACT.timerPause = () => { T.paused = !T.paused; drawTimer(); };
  ACT.timerSkip = () => { T.left = 0.01; };
  ACT.timerClose = () => finishTimer(false);

  // ---------------------------------------------------------------- sheets
  let sheetStop = null;
  function sheet(html, onOpen) {
    closeSheet();
    const scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.id = 'scrim';
    scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    scrim.addEventListener('click', (e) => { if (e.target === scrim) closeSheet(); });
    document.body.appendChild(scrim);
    if (onOpen) onOpen(scrim);
  }
  function closeSheet() {
    if (sheetStop) { sheetStop(); sheetStop = null; }
    const s = $('#scrim'); if (s) s.remove();
  }
  ACT.closeSheet = () => closeSheet();

  function coachHTML(key) {
    const e = P.exercises[key];
    return `<div class="spread"><h1 style="font-size:32px">${esc(e.name)}</h1><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      ${window.MOVES[key] ? `<div class="fig" id="coach-fig"></div>` : ''}
      <div><span class="lbl">Use</span><p>${esc(e.equip)}</p></div>
      <div><span class="lbl">Set up</span><p>${esc(e.setup)}</p></div>
      <div><span class="lbl">Focus on</span><ul class="cues">${e.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
      <div><span class="lbl">Avoid</span><p class="avoid">${esc(e.mistake)}</p></div>`;
  }
  ACT.coach = (el) => {
    const key = el.dataset.ex;
    sheet(coachHTML(key), (root) => {
      const f = $('#coach-fig', root);
      if (f) sheetStop = Figure.mount(f, window.MOVES[key]);
    });
  };

  // ---------------------------------------------------------------- activity log
  const ACT_TYPES = ['Walk', 'Run', 'Hike', 'Bike', 'Other'];
  ACT.activity = (el) => {
    const e = el.dataset.entry ? Store.get(el.dataset.entry) : { kind: 'activity', type: 'Walk', date: today() };
    sheet(`<div class="spread"><h1 style="font-size:30px">${el.dataset.entry ? 'Edit activity' : 'Log activity'}</h1><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <div class="row wrap" id="a-type">${ACT_TYPES.map((t) => `<button class="chip" data-act="atype" data-v="${t}" aria-pressed="${e.type === t}">${t}</button>`).join('')}</div>
      <label class="small dim">Date<input type="date" id="a-date" value="${esc(e.date)}"></label>
      <div class="row"><label class="small dim" style="flex:1">Minutes<input id="a-min" inputmode="decimal" value="${esc(e.minutes || '')}"></label>
      <label class="small dim" style="flex:1">Miles<input id="a-mi" inputmode="decimal" value="${esc(e.miles || '')}"></label>
      <label class="small dim" style="flex:1">Feet up<input id="a-ft" inputmode="numeric" value="${esc(e.feet || '')}"></label></div>
      <label class="small dim">Note<input id="a-note" value="${esc(e.note || '')}" placeholder="Where, how it felt"></label>
      <button class="btn block" data-act="saveActivity" data-entry="${esc(e.id || '')}">Save</button>
      ${e.id ? `<button class="chip" data-act="delEntry" data-entry="${e.id}">Delete</button>` : ''}`);
  };
  ACT.atype = (el) => $$('#a-type .chip').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
  ACT.saveActivity = (el) => {
    const e = el.dataset.entry ? Store.get(el.dataset.entry) : { kind: 'activity' };
    const t = $('#a-type [aria-pressed="true"]');
    Object.assign(e, { type: t ? t.dataset.v : 'Walk', date: $('#a-date').value || today(), minutes: $('#a-min').value, miles: $('#a-mi').value, feet: $('#a-ft').value, note: $('#a-note').value, source: e.source || 'manual' });
    Store.put(e); closeSheet(); render(); toast('Logged');
  };
  ACT.delEntry = (el) => {
    if (el.dataset.sure !== '1') { el.dataset.sure = '1'; el.textContent = 'Tap again to delete'; return; }
    Store.remove(el.dataset.entry); closeSheet(); render(); toast('Deleted');
  };

  // ================================================================ REPS
  let repDate = null;
  const undo = [];
  function viewReps() {
    const date = repDate || today(), n = weekOf(date), gt = W(n).gtg, g = gtgFor(date);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today(), -i), gg = gtgFor(d), tt = W(weekOf(d)).gtg;
      const keys = P.gtg.items.filter((it) => tt[it.key]);
      const pct = keys.length ? keys.reduce((a, it) => a + Math.min(1, (gg.counts[it.key] || 0) / tt[it.key]), 0) / keys.length : 0;
      days.push(`<button class="chip" data-act="repday" data-d="${d}" aria-pressed="${d === date}" style="padding:6px 8px;min-width:0;flex:1"><span class="tiny">${fmt(d, { weekday: 'narrow' })}</span><br><b class="num">${Math.round(pct * 100)}</b></button>`);
    }
    return `
      <div class="spread"><h1 style="font-size:40px">Reps</h1><span class="small dim">${date === today() ? 'Today' : fmt(date, { weekday: 'long', month: 'short', day: 'numeric' })} · week ${n}</span></div>
      <div class="row">${days.join('')}</div>
      ${P.gtg.items.map((it) => {
        const target = gt[it.key] || 0, v = g.counts[it.key] || 0;
        if (!target) return '';
        const pct = Math.min(100, v / target * 100);
        return `<div class="card">
          <div class="counter">
            <div><span class="lbl">${esc(it.name)}</span><div class="big num">${v}<small> / ${target}${it.unit === 'sec' ? ' s' : ''}</small></div>${it.how ? `<span class="tiny faint">${esc(it.how)}</span>` : ''}</div>
            ${it.key === 'hang' ? `<button class="sw ${HS ? 'run' : ''}" style="padding:0 14px" data-act="hangsw" data-d="${date}">${HS ? 'Stop' : '⏱ Hang'}</button>` : `<span class="mark ${pct >= 100 ? 'on' : ''}">${pct >= 100 ? '✓' : ''}</span>`}
            <div class="bar ${pct >= 100 ? 'ok' : ''}" style="grid-column:1/-1"><span style="width:${pct}%"></span></div>
            <div class="btns">${it.step.map((s) => `<button class="btn ghost small" data-act="rep" data-k="${it.key}" data-v="${s}" data-d="${date}">+${s}</button>`).join('')}
              <button class="btn ghost small" data-act="repAsk" data-k="${it.key}" data-d="${date}">+ #</button>
              <button class="btn ghost small" data-act="repUndo" data-d="${date}" aria-label="Undo last">↺</button></div>
          </div></div>`;
      }).join('')}
      <details class="card"><summary class="spread"><b>How to do the daily reps</b><span class="dim">+</span></summary><ul class="cues small">${P.gtg.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></details>`;
  }
  function addRep(date, key, v) {
    const g = gtgFor(date);
    g.counts = Object.assign({}, g.counts);
    g.counts[key] = Math.max(0, (g.counts[key] || 0) + v);
    Store.put(g);
    undo.push({ date: date, key: key, v: v });
    const top = main.scrollTop; render(); main.scrollTop = top;
  }
  ACT.rep = (el) => addRep(el.dataset.d, el.dataset.k, +el.dataset.v);
  ACT.repUndo = (el) => {
    const u = undo.pop(); if (!u) { toast('Nothing to undo'); return; }
    const g = gtgFor(u.date); g.counts = Object.assign({}, g.counts); g.counts[u.key] = Math.max(0, (g.counts[u.key] || 0) - u.v);
    Store.put(g); const top = main.scrollTop; render(); main.scrollTop = top;
  };
  ACT.repday = (el) => { repDate = el.dataset.d === today() ? null : el.dataset.d; render(); };
  ACT.repAsk = (el) => {
    const it = P.gtg.items.find((x) => x.key === el.dataset.k);
    sheet(`<h2>${esc(it.name)}</h2><label class="small dim">How many ${it.unit === 'sec' ? 'seconds' : 'reps'}?<input id="rep-n" inputmode="numeric" autofocus></label>
      <button class="btn block" data-act="repAdd" data-k="${it.key}" data-d="${el.dataset.d}">Add</button>`, (r) => { const i = $('#rep-n', r); i && i.focus(); });
  };
  ACT.repAdd = (el) => { const v = parseInt($('#rep-n').value, 10); closeSheet(); if (v > 0) addRep(el.dataset.d, el.dataset.k, v); };
  let HS = null;   // hang stopwatch
  ACT.hangsw = (el) => {
    if (HS) {
      const sec = Math.round((Date.now() - HS.t0) / 1000); clearInterval(HS.iv); HS = null;
      if (sec > 0) addRep(el.dataset.d, 'hang', sec); else render();
      return;
    }
    HS = { t0: Date.now() }; el.classList.add('run');
    HS.iv = setInterval(() => { el.textContent = 'Stop · ' + Math.round((Date.now() - HS.t0) / 1000) + ' s'; }, 250);
  };

  // ================================================================ MOBILITY
  function doseSec(d) {
    let s, m;
    const per = /\/\s*(side|foot)/.test(d) ? 2 : 1;
    if ((m = d.match(/(\d+)\s*×\s*(\d+)\s*s/))) s = m[1] * m[2];
    else if ((m = d.match(/(\d+)\s*min/))) s = m[1] * 60;
    else if ((m = d.match(/(\d+)\s*s\b/))) s = +m[1];
    else if ((m = d.match(/(\d+)/))) s = m[1] * 5;
    else s = 45;
    if (/×\s*2/.test(d)) s *= 2;
    return Math.max(20, s * per);
  }
  let M = null;
  ACT.mobility = (el) => {
    const which = el.dataset.which;
    const items = which === 'long' ? P.mobility.daily.concat(P.mobility.long.slice(1)) : P.mobility.daily;
    M = { which: which, items: items, i: 0, left: doseSec(items[0].dose), paused: true, last: Date.now() };
    const sc = document.createElement('div'); sc.id = 'mob'; sc.className = 'screen'; document.body.appendChild(sc);
    M.iv = setInterval(() => {
      const now = Date.now(), dt = (now - M.last) / 1000; M.last = now;
      if (M.paused) return;
      const b = Math.ceil(M.left); M.left -= dt;
      if (Math.ceil(M.left) !== b && Math.ceil(M.left) <= 3 && M.left > 0) beep(660, 80);
      if (M.left <= 0) { beep(988, 300); mobNext(); return; }
      drawMob();
    }, 250);
    keepAwake(true);
    drawMob();
  };
  function mobNext() {
    M.i++;
    if (M.i >= M.items.length) { finishMob(); return; }
    M.left = doseSec(M.items[M.i].dose); drawMob();
  }
  function drawMob() {
    const el = $('#mob'); if (!el) return;
    const it = M.items[M.i], total = M.items.reduce((a, x) => a + doseSec(x.dose), 0);
    el.innerHTML = `<header><div class="spread"><span class="lbl">${M.which === 'long' ? 'Long mobility' : 'Daily mobility'} · ${M.i + 1} of ${M.items.length}</span><button class="x" data-act="mobClose" aria-label="Close">✕</button></div></header>
      <div class="body"><div class="timer">
        <div class="phase" style="font-size:40px">${esc(it.name)}</div><div class="dim">${esc(it.dose)}</div>
        <div class="clock num">${mmss(M.left)}</div>
        <p style="max-width:34ch;margin:0 auto">${esc(it.how)}</p>
        <div class="tiny faint">About ${Math.round(total / 60)} min total</div>
      </div>
      <div class="list" style="margin-top:12px">${M.items.map((x, i) => `<div class="item"><span class="mark ${i < M.i ? 'on' : ''}">${i < M.i ? '✓' : i + 1}</span><span class="${i === M.i ? '' : 'dim'}">${esc(x.name)}</span><span class="small dim">${esc(x.dose)}</span></div>`).join('')}</div></div>
      <footer class="row"><button class="btn ghost" style="flex:1" data-act="mobPause">${M.paused ? (M.i === 0 && M.left === doseSec(it.dose) ? 'Start' : 'Resume') : 'Pause'}</button><button class="btn ghost" style="flex:1" data-act="mobSkip">Next</button><button class="btn" style="flex:1" data-act="mobDone">Done</button></footer>`;
  }
  ACT.mobPause = () => { M.paused = !M.paused; M.last = Date.now(); drawMob(); };
  ACT.mobSkip = () => mobNext();
  ACT.mobDone = () => finishMob();
  ACT.mobClose = () => { clearInterval(M.iv); M = null; const el = $('#mob'); if (el) el.remove(); keepAwake(!!S); render(); };
  function finishMob() {
    const which = M.which;
    Store.put({ id: 'mob-' + which + '-' + today(), kind: 'mobility', date: today(), routine: which });
    ACT.mobClose();
    toast(which === 'long' ? 'Long mobility done' : 'Mobility done');
  }

  // ================================================================ PROGRESS
  function viewProgress() {
    const cur = curWeek();
    const weeks = [];
    for (let n = 1; n <= Math.max(cur, 1); n++) weeks.push({ n: n, c: countIn(n), min: W(n).min });
    const sessions = Store.byKind('session'), acts = Store.byKind('activity');
    const feet = sessions.concat(acts).reduce((a, e) => a + (parseFloat(e.feet) || 0), 0);
    const miles = sessions.concat(acts).reduce((a, e) => a + (parseFloat(e.miles) || 0), 0);
    const reps = Store.byKind('gtg').reduce((a, g) => a + ['pushups', 'pullups', 'squats', 'burpees'].reduce((x, k) => x + (g.counts[k] || 0), 0), 0);
    return `
      <h1 style="font-size:40px">Progress</h1>
      <div class="card">
        <div class="spread"><div class="stat"><span class="lbl">Streak</span><b class="num">${streak()} wk</b></div><div class="stat"><span class="lbl">Sessions</span><b class="num">${sessions.length}</b></div><div class="stat"><span class="lbl">Reps</span><b class="num">${reps.toLocaleString('en-US')}</b></div></div>
        <div class="spread"><div class="stat"><span class="lbl">Climbed</span><b class="num">${Math.round(feet).toLocaleString('en-US')} ft</b></div><div class="stat" style="text-align:right"><span class="lbl">Distance</span><b class="num">${miles.toFixed(1)} mi</b></div></div>
        ${consistencyChart(weeks)}
      </div>
      <div class="spread"><h2>Benchmarks</h2>${W(cur).test ? '<span class="chip" aria-pressed="true">Retest week</span>' : ''}</div>
      <p class="small dim">Retest in weeks 1, 9, 14, 20, 26, 32 and 37. Fresh, warmed up, same conditions each time.</p>
      ${P.benchmarks.map(benchCard).join('')}
      <div class="card"><div class="spread"><h2>Activities</h2><button class="chip" data-act="activity">+ Add</button></div>
        ${acts.length ? `<div class="list">${acts.sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 12).map(actRow).join('')}</div>` : '<p class="empty">Nothing logged outside the plan yet.</p>'}</div>`;
  }

  function consistencyChart(weeks) {
    const Wd = 340, H = 120, L = 22, B = 18, max = Math.max(5, ...weeks.map((w) => w.c));
    const bw = (Wd - L) / Math.max(weeks.length, 8);
    const y = (v) => 8 + (H - B - 8) * (1 - v / max);
    let s = `<line x1="${L}" x2="${Wd}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line)"/>`;
    [0, Math.round(max / 2), max].forEach((v) => { s += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="var(--faint)" font-family="Barlow">${v}</text>`; });
    weeks.forEach((w, i) => {
      const x = L + i * bw + 2, h = y(0) - y(w.c);
      s += `<rect x="${x}" y="${y(w.c)}" width="${Math.max(2, bw - 4)}" height="${h}" fill="${w.c >= w.min ? 'var(--red)' : 'var(--panel2)'}"/>`;
      s += `<line x1="${x}" x2="${x + bw - 4}" y1="${y(w.min)}" y2="${y(w.min)}" stroke="var(--gold)" stroke-width="2"/>`;
      if (weeks.length <= 12 || w.n % 4 === 1) s += `<text x="${x + (bw - 4) / 2}" y="${H - 4}" text-anchor="middle" font-size="10" fill="var(--faint)" font-family="Barlow">${w.n}</text>`;
    });
    return `<div><span class="lbl">Sessions per week · gold line is the minimum</span><svg class="chart" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="Sessions per week">${s}</svg></div>`;
  }

  const benchFmt = (b, v) => v == null || v === '' ? '—' : b.unit === 'min' ? mmss(v * 60) : (Math.round(v * 10) / 10) + ' ' + b.unit;
  function benchCard(b) {
    const list = Store.byKind('bench').filter((e) => e.key === b.key).sort((a, c) => a.date < c.date ? -1 : 1);
    const last = list[list.length - 1];
    const start = list.length ? list[0].value : b.baseline;
    let spark = '';
    if (list.length >= 2) {
      const vals = list.map((e) => +e.value), lo = Math.min(...vals, b.target || Infinity), hi = Math.max(...vals, b.target || -Infinity);
      const xs = (i) => 4 + i * (112 / (vals.length - 1)), ys = (v) => 4 + 32 * (1 - (v - lo) / ((hi - lo) || 1));
      const pts = vals.map((v, i) => `${xs(i)},${ys(v)}`).join(' ');
      spark = `<svg viewBox="0 0 120 40" width="120" height="40" aria-hidden="true">${b.target != null ? `<line x1="0" x2="120" y1="${ys(b.target)}" y2="${ys(b.target)}" stroke="var(--gold)" stroke-dasharray="3 3"/>` : ''}<polyline points="${pts}" fill="none" stroke="var(--red)" stroke-width="2.5"/><circle cx="${xs(vals.length - 1)}" cy="${ys(vals[vals.length - 1])}" r="3.5" fill="var(--ink)"/></svg>`;
    }
    const hit = last && b.target != null && (b.better === 'higher' ? +last.value >= b.target : +last.value <= b.target);
    return `<div class="card">
      <div class="spread"><div><b>${esc(b.name)}</b><br><span class="small dim">Start ${benchFmt(b, start)} · Goal ${b.target == null ? 'your call' : (b.better === 'lower' ? 'under ' : '') + benchFmt(b, b.target)}</span></div>
        <div style="text-align:right"><div class="disp num" style="font-size:32px;color:${hit ? 'var(--ok)' : 'var(--ink)'}">${last ? benchFmt(b, last.value) : '—'}</div>${last ? `<span class="tiny faint">${fmt(last.date)}</span>` : ''}</div></div>
      <div class="spread">${spark || `<span class="small dim">${esc(b.how)}</span>`}<button class="btn small" data-act="bench" data-k="${b.key}">Log</button></div></div>`;
  }
  ACT.bench = (el) => {
    const b = P.benchmarks.find((x) => x.key === el.dataset.k);
    const timeInput = b.unit === 'min';
    sheet(`<div class="spread"><h1 style="font-size:30px">${esc(b.name)}</h1><button class="x" data-act="closeSheet" aria-label="Close">✕</button></div>
      <p class="small dim">${esc(b.how)}</p>
      <label class="small dim">${timeInput ? 'Time (m:ss)' : esc(b.unit)}<input id="b-val" inputmode="${timeInput ? 'text' : 'decimal'}" placeholder="${timeInput ? '9:45' : ''}"></label>
      ${b.unit === 'sec' || timeInput ? `<button class="sw" id="b-sw" data-act="benchSw" style="width:100%">⏱ Start stopwatch</button>` : ''}
      <label class="small dim">Date<input type="date" id="b-date" value="${today()}"></label>
      <button class="btn block" data-act="benchSave" data-k="${b.key}">Save</button>
      ${Store.byKind('bench').filter((e) => e.key === b.key).sort((a, c) => a.date < c.date ? 1 : -1).map((e) => `<div class="spread small"><span>${fmt(e.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span class="num">${benchFmt(b, e.value)}</span><button class="chip" data-act="delEntry" data-entry="${e.id}">Delete</button></div>`).join('')}`);
  };
  let BS = null;
  ACT.benchSw = (el) => {
    const b = P.benchmarks.find((x) => x.key === $('[data-act="benchSave"]').dataset.k);
    if (BS) {
      const sec = (Date.now() - BS) / 1000; BS = null; clearInterval(el._iv);
      $('#b-val').value = b.unit === 'min' ? mmss(sec) : String(Math.round(sec));
      el.textContent = '⏱ Start again'; el.classList.remove('run'); return;
    }
    BS = Date.now(); el.classList.add('run');
    el._iv = setInterval(() => { el.textContent = 'Stop · ' + mmss((Date.now() - BS) / 1000); }, 250);
  };
  ACT.benchSave = (el) => {
    const b = P.benchmarks.find((x) => x.key === el.dataset.k);
    let raw = $('#b-val').value.trim(), v;
    if (b.unit === 'min') { const p = raw.split(':'); v = p.length === 2 ? (+p[0]) + (+p[1]) / 60 : parseFloat(raw); }
    else v = parseFloat(raw);
    if (!isFinite(v)) { toast('Enter a number first'); return; }
    Store.put({ kind: 'bench', key: b.key, value: Math.round(v * 1000) / 1000, date: $('#b-date').value || today() });
    BS = null; closeSheet(); render(); toast('Saved');
  };

  // ================================================================ PLAN
  let exQuery = '';
  function viewPlan() {
    const n = curWeek();
    const st = Store.status(), cfg = Store.config();
    const exKeys = Object.keys(P.exercises).filter((k) => !['run', 'hike', 'race', 'mobility-long'].includes(k));
    const gearDone = (i) => !!Store.get('gear-' + i);
    return `
      <h1 style="font-size:40px">The plan</h1>
      <div class="card red"><span class="lbl">${esc(P.race.place)}</span><h3>${esc(P.race.name)} · ${esc(P.race.distance)} · ${P.race.obstacles} obstacles</h3><p>${esc(P.race.goal)}</p></div>
      <div class="card"><h2>Mobility</h2>
        <div class="row"><button class="btn" style="flex:1" data-act="mobility" data-which="daily">Daily · 12 min</button><button class="btn ghost" style="flex:1" data-act="mobility" data-which="long">Long · 25 min</button></div></div>
      <div class="card"><h2>Exercises</h2>
        <input id="ex-q" type="search" placeholder="Search ${exKeys.length} exercises" value="${esc(exQuery)}" aria-label="Search exercises">
        <div class="list" id="ex-list">${exList(exKeys)}</div></div>
      <div class="card"><h2>Phases</h2>${P.phases.map((p) => `<details><summary class="spread" style="padding:8px 0"><span><b>${esc(p.name)}</b> <span class="small dim">weeks ${p.weeks[0]}–${p.weeks[1]}</span></span><span class="dim">+</span></summary>
        <p class="small">${esc(p.goal)}</p><div class="row wrap" style="margin:8px 0">${P.weeks.filter((w) => w.phase === p.id).map((w) => `<button class="chip" data-act="openWeek" data-n="${w.n}" aria-pressed="${w.n === n}">Wk ${w.n}</button>`).join('')}</div></details>`).join('')}</div>
      <div class="card"><h2>Fuel</h2>${P.fuel.map((f) => `<details><summary class="spread" style="padding:8px 0"><b>${esc(f.title)}</b><span class="dim">+</span></summary><ul class="cues small">${f.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('')}</div>
      <div class="card"><h2>Gear</h2><div class="list">${P.gear.map((g, i) => `<button class="item" data-act="gear" data-i="${i}"><span class="mark ${gearDone(i) ? 'on' : ''}">${gearDone(i) ? '✓' : ''}</span><span><b>${esc(g.item)}</b><br><span class="small dim">${esc(g.why)}</span></span><span class="small dim">${esc(g.when)}</span></button>`).join('')}</div></div>
      <div class="card"><h2>Obstacles</h2>${P.obstacles.map((o) => `<div><b>${esc(o.group)}</b> <span class="small dim">${esc(o.names)}</span><p class="small">${esc(o.trains)}</p></div>`).join('')}</div>
      <div class="card"><h2>Rules</h2><ol class="cues small">${P.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol></div>
      <div class="card" id="settings"><h2>Settings</h2>
        <p class="small dim">Your log is saved on this phone and backed up to BlueStep when the sync key is set. ${st.count} entries${st.pending ? `, ${st.pending} waiting to sync` : ''}${st.lastSync ? `, last synced ${new Date(st.lastSync).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}.</p>
        <label class="small dim">Sync key<input id="cfg-key" type="password" autocomplete="off" value="${esc(cfg.key)}" placeholder="Paste the key"></label>
        <details><summary class="small dim" style="padding:4px 0">Endpoint</summary><input id="cfg-url" value="${esc(cfg.url)}"></details>
        <div class="row"><button class="btn small" style="flex:1" data-act="saveCfg">Save & sync</button><button class="btn ghost small" style="flex:1" data-act="export">Export backup</button></div>
        <label class="small dim">Restore from a backup file<input type="file" id="imp" accept="application/json,.json"></label>
        <p class="tiny faint">Screen ${screenInfo()}</p>
      </div>
      <p class="tiny faint" style="text-align:center">Helmet icon is an original drawing, not the Spartan Race mark. Aroo.</p>`;
  }
  // For diagnosing layout on a phone: what the browser reports vs the screen.
  function screenInfo() {
    const cs = getComputedStyle(document.body);
    return `${innerWidth}×${innerHeight} · screen ${screen.width}×${screen.height} · body ${Math.round(parseFloat(cs.height))} · vv ${window.visualViewport ? Math.round(visualViewport.height) : '-'} · ${navigator.standalone ? 'app' : 'browser'} · v4`;
  }
  function exList(keys) {
    const q = exQuery.toLowerCase();
    return keys.filter((k) => !q || P.exercises[k].name.toLowerCase().includes(q)).map((k) => `<button class="item" data-act="coach" data-ex="${k}">${thumb(k)}<span><b>${esc(P.exercises[k].name)}</b><br><span class="small dim">${esc(P.exercises[k].equip)}</span></span><span class="dim">›</span></button>`).join('') || '<p class="empty">No match.</p>';
  }
  main.addEventListener('input', (e) => {
    if (e.target.id === 'ex-q') { exQuery = e.target.value; $('#ex-list').innerHTML = exList(Object.keys(P.exercises).filter((k) => !['run', 'hike', 'race', 'mobility-long'].includes(k))); }
  });
  main.addEventListener('change', (e) => {
    if (e.target.id !== 'imp' || !e.target.files[0]) return;
    const r = new FileReader();
    r.onload = () => { try { const n = Store.importJSON(r.result); toast(n + ' entries restored'); render(); } catch (err) { toast(err.message); } };
    r.readAsText(e.target.files[0]);
  });
  ACT.openWeek = (el) => go('week', { week: +el.dataset.n });
  ACT.gear = (el) => { const id = 'gear-' + el.dataset.i; if (Store.get(id)) Store.remove(id); else Store.put({ id: id, kind: 'gear', date: today() }); const top = main.scrollTop; render(); main.scrollTop = top; };
  ACT.saveCfg = () => {
    Store.setConfig({ key: $('#cfg-key').value.trim(), url: ($('#cfg-url').value || '').trim() });
    Store.sync().then((n) => { toast('Synced · ' + n + ' entries on the server'); render(); }).catch((e) => toast('Sync failed: ' + e.message));
  };
  ACT.export = () => {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'spartan-2027-backup-' + today() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };

  // ---------------------------------------------------------------- boot
  Store.onChange(() => { /* a sync landed while a view is open */ if (!S && !M && !T && !$('#scrim')) { const top = main.scrollTop; render(); main.scrollTop = top; } });
  function quietSync() { if (Store.configured()) Store.sync().catch(() => { }); }
  // A setup link (…/#k=<sync key>) stores the key once, then drops it from the
  // address bar so it does not linger in history or a shared screenshot.
  (function keyFromLink() {
    const m = /[#&]k=([^&]+)/.exec(location.hash || '');
    if (!m) return;
    Store.setConfig({ key: decodeURIComponent(m[1]) });
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { }
    setTimeout(() => toast('Sync key saved'), 400);
  })();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { quietSync(); if (!S && !M && !T) render(); } });
  render();
  quietSync();
})();
