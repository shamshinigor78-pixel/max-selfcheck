/* =====================================================================
   app.js — Логика мини-теста
   Читает window.CONTENT, проводит тест, показывает результат.
   ===================================================================== */
(function () {
  'use strict';

  const C = window.CONTENT;
  if (!C) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.innerHTML =
        '<div style="padding:40px;font:16px/1.5 sans-serif;color:#666">' +
        'Ошибка: content.js не загружен.</div>';
    });
    return;
  }

  const app       = C.app      || {};
  const settings  = C.settings || {};
  const links     = C.links    || {};
  const theme     = C.theme    || {};
  const questions = Array.isArray(C.questions) ? C.questions : [];

  /* ===================== ТЕМА / ПРЕСЕТ ===================== */
  (function applyTheme() {
    const r = document.documentElement;
    if (theme.primary) r.style.setProperty('--accent', theme.primary);
    if (theme.tg)      r.style.setProperty('--tg', theme.tg);
    if (theme.wa)      r.style.setProperty('--wa', theme.wa);

    const addPreset = function () {
      if (theme.preset) document.body.classList.add('preset-' + theme.preset);
    };
    if (document.body) addPreset();
    else document.addEventListener('DOMContentLoaded', addPreset);
  })();

  /* ===================== СТИЛИ ===================== */
  const STYLES = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    'html,body{min-height:100%}',
    'body{',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;',
      'font-size:18px;line-height:1.5;color:#1a1a1a;background:#f4f5f7;',
      '-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;',
    '}',
    '#app-root{max-width:640px;margin:0 auto;padding:24px 20px 56px;min-height:100vh;display:flex;flex-direction:column}',
    '.screen{flex:1;display:flex;flex-direction:column;animation:fadeIn .25s ease}',
    '@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',

    /* Start */
    '.start-screen{text-align:center;padding:28px 0 0}',
    '.app-title{font-size:30px;font-weight:800;line-height:1.2;letter-spacing:-.01em}',
    '.app-subtitle{font-size:17px;color:#666;margin-top:12px;line-height:1.5}',
    '.start-actions{margin-top:32px;display:flex;justify-content:center}',
    '.start-hint{font-size:16px;color:#555;margin-top:24px;line-height:1.55}',
    '.privacy-note{font-size:13px;color:#999;margin-top:14px;line-height:1.5}',

    /* Buttons base */
    '.btn-primary,.btn-back,.option-btn,.action-btn{',
      'font-family:inherit;cursor:pointer;',
      'transition:transform .15s,background .15s,opacity .15s,box-shadow .15s,border-color .15s;',
      '-webkit-tap-highlight-color:transparent;user-select:none;',
    '}',
    '.btn-primary{',
      'padding:18px 32px;font-size:18px;font-weight:700;color:#fff;',
      'background:var(--accent,#4a7dff);border:none;border-radius:16px;',
      'box-shadow:0 8px 24px -8px var(--accent,#4a7dff);',
    '}',
    '.btn-primary.pressed{transform:scale(.97);opacity:.9}',

    /* Progress */
    '.progress-bar{height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:20px}',
    '.progress-fill{height:100%;background:var(--accent,#4a7dff);transition:width .3s ease}',
    '.q-meta{font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin-bottom:10px}',

    /* Question */
    '.question-text{font-size:22px;font-weight:700;line-height:1.35;margin-bottom:24px;letter-spacing:-.005em}',
    '.options{display:flex;flex-direction:column;gap:12px}',
    '.option-btn{',
      'padding:18px 20px;font-size:17px;line-height:1.4;text-align:left;',
      'background:#fff;color:#1a1a1a;',
      'border:2px solid #e5e7eb;border-radius:16px;font-weight:500;',
    '}',
    '.option-btn.pressed{transform:scale(.97);border-color:var(--accent,#4a7dff);background:#eef3ff}',
    '.actions-row{display:flex;gap:12px;margin-top:28px}',
    '.btn-back{',
      'padding:14px 22px;font-size:16px;font-weight:600;color:#555;',
      'background:#fff;border:2px solid #e5e7eb;border-radius:14px;',
    '}',
    '.btn-back:disabled{opacity:.4;cursor:default}',
    '.btn-back.pressed{transform:scale(.97)}',

    /* Result */
    '.result-card{',
      'background:#fff;border-radius:24px;padding:28px 24px;',
      'box-shadow:0 4px 24px -8px rgba(0,0,0,.08);margin-top:8px;',
    '}',
    '.result-badge{font-size:40px;line-height:1;margin-bottom:14px}',
    '.result-title{font-size:26px;font-weight:800;line-height:1.25;margin-bottom:14px;letter-spacing:-.01em}',
    '.result-body{font-size:17px;color:#444;line-height:1.6}',
    '.result-actions{display:flex;flex-direction:column;gap:10px;margin-top:26px}',
    '.action-btn{',
      'display:block;padding:17px 20px;font-size:17px;font-weight:600;',
      'text-align:center;text-decoration:none;border-radius:14px;border:none;',
    '}',
    '.action-btn.pressed{transform:scale(.97);opacity:.9}',
    '.action-max{background:#7b5cff;color:#fff;box-shadow:0 6px 18px -6px rgba(123,92,255,.5)}',
    '.action-tg{background:var(--tg,#2aabee);color:#fff}',
    '.action-wa{background:var(--wa,#25d366);color:#fff}',
    '.action-call{background:#fff;color:#1a1a1a;border:2px solid #e5e7eb}',
    '.action-method{background:transparent;color:var(--accent,#4a7dff);border:2px solid var(--accent,#4a7dff)}',

    /* Preset: premium — Apple-style */
    'body.preset-premium{background:linear-gradient(160deg,#eef1f7 0%,#f5f5f7 40%,#e8eef8 100%);background-attachment:fixed}',
    'body.preset-premium .result-card{',
      'background:rgba(255,255,255,.6);backdrop-filter:blur(20px) saturate(160%);',
      '-webkit-backdrop-filter:blur(20px) saturate(160%);border-radius:26px;',
    '}',
    'body.preset-premium .btn-primary{box-shadow:none}',
    'body.preset-premium .option-btn{background:rgba(255,255,255,.7);backdrop-filter:blur(10px)}',

    /* Preset: strict — minimal */
    'body.preset-strict .result-card{border-radius:6px}',
    'body.preset-strict .btn-primary{border-radius:6px;background:#1a1a1a;box-shadow:none}',
    'body.preset-strict .option-btn{border-radius:6px}',
    'body.preset-strict .btn-back{border-radius:6px}',
    'body.preset-strict .action-btn{border-radius:6px}'
  ].join('');

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  document.head.appendChild(styleEl);

  /* ===================== HELPERS ===================== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openLink(url) {
    if (!url) return;
    if (url.indexOf('tel:') === 0 || !/^https?:\/\//i.test(url)) {
      window.location.href = url;
      return;
    }
    const wa = window.WebApp;
    if (wa && wa.initData && typeof wa.openLink === 'function') {
      try { wa.openLink(url); return; } catch (e) { /* fallback */ }
    }
    window.location.href = url;
  }

  function withPressed(el, cb) {
    if (!el) { cb(); return; }
    el.classList.add('pressed');
    setTimeout(function () {
      el.classList.remove('pressed');
      try { cb(); } catch (e) { console.error(e); }
    }, 150);
  }

  /* ===================== STATE ===================== */
  const state = {
    index: -1,          // -1 = старт, 0..N-1 = вопросы, N = результат
    answers: [],
    maxPossible: questions.map(function (q) {
      const arr = (q && q.options) || [];
      return arr.reduce(function (m, o) {
        return Math.max(m, Number(o.weight) || 0);
      }, 0);
    })
  };

  /* ===================== ROOT ===================== */
  function ensureRoot() {
    let root = document.getElementById('app-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'app-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function getScreen() {
    let s = document.getElementById('screen');
    if (!s) {
      s = document.createElement('div');
      s.id = 'screen';
      s.className = 'screen';
      ensureRoot().appendChild(s);
    }
    return s;
  }

  /* ===================== RENDER ===================== */
  function render() {
    const screen = getScreen();
    if (state.index === -1)                    return renderStart(screen);
    if (state.index >= questions.length)       return renderResult(screen);
    return renderQuestion(screen);
  }

  function renderStart(screen) {
    screen.innerHTML =
      '<div class="start-screen">' +
        '<h1 class="app-title">' + esc(app.title || 'Тест') + '</h1>' +
        (app.subtitle ? '<p class="app-subtitle">' + esc(app.subtitle) + '</p>' : '') +
        '<div class="start-actions">' +
          '<button class="btn-primary" id="startBtn" type="button">' +
            esc(app.btnStart || 'Начать тест') +
          '</button>' +
        '</div>' +
        (app.hint ? '<p class="start-hint">' + esc(app.hint) + '</p>' : '') +
        (app.browserNote ? '<p class="privacy-note">' + esc(app.browserNote) + '</p>' : '') +
        (Array.isArray(app.privacyList) && app.privacyList.length
          ? '<p class="privacy-note">' + app.privacyList.map(esc).join(' · ') + '</p>'
          : '') +
      '</div>';

    const btn = document.getElementById('startBtn');
    btn.addEventListener('click', function (e) {
      withPressed(e.currentTarget, function () {
        state.index = 0;
        render();
      });
    });
  }

  function renderQuestion(screen) {
    const q = questions[state.index];
    const total = questions.length;
    const progress = total > 0 ? (state.index / total) * 100 : 0;

    screen.innerHTML =
      '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
      '<div class="q-meta">Вопрос ' + (state.index + 1) + ' из ' + total + '</div>' +
      '<div class="question-text">' + esc(q.text) + '</div>' +
      '<div class="options" id="options"></div>' +
      '<div class="actions-row">' +
        '<button class="btn-back" id="backBtn" type="button"' +
          (state.index === 0 ? ' disabled' : '') +
        '>← Назад</button>' +
      '</div>';

    const opts = document.getElementById('options');
    (q.options || []).forEach(function (opt) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'option-btn';
      b.textContent = opt.text;
      b.addEventListener('click', function (e) {
        withPressed(e.currentTarget, function () {
          state.answers[state.index] = opt;
          state.index++;
          render();
        });
      });
      opts.appendChild(b);
    });

    document.getElementById('backBtn').addEventListener('click', function (e) {
      if (state.index === 0) return;
      withPressed(e.currentTarget, function () {
        state.index--;
        state.answers = state.answers.slice(0, state.index);
        render();
      });
    });
  }

  function computeResultType() {
    const threshold = Number(settings.osteoThreshold) || 60;
    let redflag = false;
    let forceOsteo = false;
    let sumW = 0;
    let sumMax = 0;

    state.answers.forEach(function (opt, i) {
      if (!opt) return;
      if (opt.redflag) redflag = true;
      if (opt.forceOutcome === 'osteo') forceOsteo = true;
      sumW += Number(opt.weight) || 0;
      sumMax += state.maxPossible[i] || 0;
    });

    const percent = sumMax > 0 ? (sumW / sumMax) * 100 : 0;

    if (redflag) return 'doctor';
    if (forceOsteo || percent >= threshold) return 'osteo';
    return 'normal';
  }

  function renderResult(screen) {
    const type = computeResultType();

    const map = {
      doctor: { title: app.doctorTitle, body: app.doctorBody, badge: '⚠️' },
      osteo:  { title: app.osteoTitle,  body: app.osteoBody,  badge: '🦴' },
      normal: { title: app.normalTitle, body: app.normalBody, badge: '✅' }
    };
    const cfg = map[type] || {};

    screen.innerHTML =
      '<div class="result-card">' +
        '<div class="result-badge">' + cfg.badge + '</div>' +
        '<h2 class="result-title">' + esc(cfg.title || '') + '</h2>' +
        '<div class="result-body">' +
          esc(cfg.body || '').replace(/\n/g, '<br>') +
        '</div>' +
        '<div class="result-actions" id="resultActions"></div>' +
      '</div>' +
      '<div class="actions-row" style="margin-top:20px">' +
        '<button class="btn-back" id="backBtn" type="button">← Назад</button>' +
      '</div>';

    const actions = document.getElementById('resultActions');

    const defs = [];
    if (links.max) {
      defs.push({ cls: 'action-max', label: app.btnWriteMax || 'Написать в MAX', url: links.max });
    }
    if (links.tg) {
      defs.push({ cls: 'action-tg', label: app.btnWriteTg || 'Написать в Telegram', url: links.tg });
    }
    if (links.wa) {
      defs.push({ cls: 'action-wa', label: app.btnWriteWa || 'Написать в WhatsApp', url: links.wa });
    }
    if (links.phone) {
      const tel = 'tel:' + String(links.phone).replace(/[^\d+]/g, '');
      defs.push({ cls: 'action-call', label: app.btnCall || 'Позвонить', url: tel });
    }
    if (links.landing) {
      defs.push({ cls: 'action-method', label: app.methodBtn || 'Узнать о методике', url: links.landing });
    }

    defs.forEach(function (d) {
      const a = document.createElement('a');
      a.href = d.url;
      a.className = 'action-btn ' + d.cls;
      a.textContent = d.label;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        withPressed(a, function () { openLink(d.url); });
      });
      actions.appendChild(a);
    });

    document.getElementById('backBtn').addEventListener('click', function (e) {
      withPressed(e.currentTarget, function () {
        state.index = questions.length - 1;
        state.answers = state.answers.slice(0, state.index);
        render();
      });
    });
  }

  /* ===================== INIT ===================== */
  function init() {
    ensureRoot();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
