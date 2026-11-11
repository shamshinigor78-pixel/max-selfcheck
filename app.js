/* =====================================================================
   app.js — Логика теста под существующий index.html
   Совместим с CSP: default-src 'none'; script-src 'self' https://st.max.ru;
                    style-src 'self'; img-src 'self' data:; connect-src 'none'
   ===================================================================== */
(function () {
  'use strict';

  const C = window.CONTENT;
  if (!C) {
    console.error('[app.js] content.js не загружен или пуст');
    return;
  }

  const app       = C.app      || {};
  const settings  = C.settings || {};
  const links     = C.links    || {};
  const theme     = C.theme    || {};
  const questions = Array.isArray(C.questions) ? C.questions : [];
  const profiles  = app.profiles || {};

  /* ===================== ТЕМА / ПРЕСЕТ ===================== */
  (function applyTheme() {
    const r = document.documentElement;
    if (theme.primary) r.style.setProperty('--accent', theme.primary);
    if (theme.tg)      r.style.setProperty('--tg', theme.tg);
    if (theme.wa)      r.style.setProperty('--wa', theme.wa);
    if (theme.preset)  document.body.classList.add('preset-' + theme.preset);
  })();

  /* ===================== DOM ===================== */
  const $ = function (id) { return document.getElementById(id); };

  const appEl          = $('app');
  const screenStart    = $('screen-start');
  const screenQuestion = $('screen-question');
  const screenResult   = $('screen-result');

  const startTitle     = $('ui-start-title');
  const startSubtitle  = $('ui-start-subtitle');
  const privacyNote    = document.querySelector('.privacy-note');
  const privacyUl      = document.querySelector('.privacy-note ul');
  const btnStart       = $('btn-start');
  const startHint      = $('ui-start-hint');
  const browserNote    = $('ui-browser-note');

  const btnBack        = $('btn-back');
  const progressWrap   = $('progress-wrap');
  const progressBar    = $('progress-bar');
  const qCurrent       = $('q-current');
  const qTotal         = $('q-total');
  const qText          = $('q-text');
  const answersEl      = $('answers');

  const resultIcon     = $('result-icon');
  const resultTitle    = $('result-title');
  const verdict        = $('verdict');
  const resultActions  = $('result-actions');
  const resultHint     = $('result-hint');
  const btnRestart     = $('btn-restart');
  const btnClose       = $('btn-close');

  /* ===================== HELPERS ===================== */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isMaxWebApp() {
    return !!(window.WebApp && window.WebApp.initData);
  }

  function openLink(url) {
    if (!url) return;
    const isHttp = /^https?:\/\//i.test(url);
    if (!isHttp) { window.location.href = url; return; }
    if (isMaxWebApp() && typeof window.WebApp.openLink === 'function') {
      try { window.WebApp.openLink(url); return; } catch (e) { /* fallback */ }
    }
    window.location.href = url;
  }

  function closeApp() {
    if (isMaxWebApp() && typeof window.WebApp.close === 'function') {
      try { window.WebApp.close(); return; } catch (e) { /* fallback */ }
    }
    if (appEl) appEl.hidden = true;
  }

  function withPressed(el, cb) {
    if (!el) { cb(); return; }
    el.classList.add('pressed');
    setTimeout(function () {
      el.classList.remove('pressed');
      try { cb(); } catch (e) { console.error(e); }
    }, 150);
  }

  function showScreen(name) {
    [screenStart, screenQuestion, screenResult].forEach(function (s) {
      if (s) s.classList.remove('active');
    });
    const map = { start: screenStart, question: screenQuestion, result: screenResult };
    if (map[name]) map[name].classList.add('active');
  }

  /* ===================== STATE ===================== */
  const state = {
    index: -1,
    answers: [],
    maxPossible: questions.map(function (q) {
      const arr = (q && q.options) || [];
      return arr.reduce(function (m, o) { return Math.max(m, Number(o.weight) || 0); }, 0);
    })
  };

  /* ===================== СТАРТ ===================== */
  function initStart() {
    if (startTitle)    startTitle.textContent    = app.title    || 'Самодиагностика';
    if (startSubtitle) startSubtitle.textContent = app.subtitle || '';

    if (privacyUl && Array.isArray(app.privacyList) && app.privacyList.length) {
      privacyUl.innerHTML = app.privacyList.map(function (t) {
        return '<li>' + esc(t) + '</li>';
      }).join('');
    } else if (privacyNote) {
      privacyNote.hidden = true;
    }

    if (btnStart)  btnStart.textContent  = app.btnStart || 'Начать тест';

    if (startHint) {
      if (app.hint) { startHint.textContent = app.hint; startHint.hidden = false; }
      else          { startHint.hidden = true; }
    }

    if (browserNote) {
      if (app.browserNote) {
        browserNote.textContent = app.browserNote;
        browserNote.hidden = false;
      } else {
        browserNote.hidden = true;
      }
    }
  }

  /* ===================== ВОПРОС ===================== */
  function renderQuestion() {
    const q = questions[state.index];
    const total = questions.length;
    if (!q) return;

    if (qCurrent) qCurrent.textContent = state.index + 1;
    if (qTotal)   qTotal.textContent   = total;
    if (qText)    qText.textContent    = q.text || '';

    const progress = total > 0 ? ((state.index) / total) * 100 : 0;
    if (progressBar)  progressBar.style.width = progress + '%';
    if (progressWrap) progressWrap.setAttribute('aria-valuenow', String(Math.round(progress)));

    if (btnBack) btnBack.disabled = (state.index === 0);

    if (answersEl) {
      answersEl.innerHTML = '';
      (q.options || []).forEach(function (opt) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn answer';
        b.textContent = opt.text;
        b.addEventListener('click', function () {
          withPressed(b, function () {
            state.answers[state.index] = opt;
            state.index++;
            if (state.index >= total) renderResult();
            else renderQuestion();
          });
        });
        answersEl.appendChild(b);
      });
    }

    showScreen('question');
  }

  /* ===================== ЛОГИКА РЕЗУЛЬТАТА ===================== */
  function computeResult() {
    const threshold = Number(settings.osteoThreshold);
    const th = isNaN(threshold) ? 30 : threshold;

    let redflag = false;
    let forceOsteo = false;
    let sumW = 0;
    let sumMax = 0;
    const profileCount = {};

    state.answers.forEach(function (opt, i) {
      if (!opt) return;
      if (opt.redflag) redflag = true;
      if (opt.forceOutcome === 'osteo') forceOsteo = true;
      sumW   += Number(opt.weight) || 0;
      sumMax += state.maxPossible[i] || 0;
      if (opt.profile) {
        profileCount[opt.profile] = (profileCount[opt.profile] || 0) + 1;
      }
    });

    const percent = sumMax > 0 ? (sumW / sumMax) * 100 : 0;

    let type = 'normal';
    if (redflag) type = 'doctor';
    else if (forceOsteo || percent >= th) type = 'osteo';

    let dominant = null;
    let maxCount = 0;
    Object.keys(profileCount).forEach(function (k) {
      if (profileCount[k] > maxCount) { maxCount = profileCount[k]; dominant = k; }
    });

    return {
      type: type,
      percent: percent,
      redflag: redflag,
      profile: dominant,
      profileText: dominant ? (profiles[dominant] || '') : ''
    };
  }

  /* ===================== РЕЗУЛЬТАТ ===================== */
  function renderResult() {
    const r = computeResult();

    const map = {
      doctor: { icon: '⚠️', title: app.doctorTitle, body: app.doctorBody },
      osteo:  { icon: '🦴', title: app.osteoTitle,  body: app.osteoBody  },
      normal: { icon: '✅', title: app.normalTitle, body: app.normalBody }
    };
    const cfg = map[r.type] || map.normal;

    if (resultIcon)  resultIcon.textContent  = cfg.icon;
    if (resultTitle) resultTitle.textContent = cfg.title || '';

    if (verdict) {
      let html = esc(cfg.body || '').replace(/\n/g, '<br>');
      if (r.profileText) html += '<br><br><strong>' + esc(r.profileText) + '</strong>';
      verdict.innerHTML = html;
    }

    if (resultActions) {
      resultActions.innerHTML = '';

      const defs = [];
      if (links.max)   defs.push({ url: links.max, label: app.btnWriteMax || 'Написать в MAX',      cls: 'btn max'    });
      if (links.tg)    defs.push({ url: links.tg,  label: app.btnWriteTg  || 'Написать в Telegram', cls: 'btn tg'     });
      if (links.wa)    defs.push({ url: links.wa,  label: app.btnWriteWa  || 'Написать в WhatsApp', cls: 'btn wa'     });
      if (links.phone) {
        const tel = 'tel:' + String(links.phone).replace(/[^\d+]/g, '');
        defs.push({ url: tel, label: app.btnCall || 'Позвонить', cls: 'btn call' });
      }
      if (links.landing) {
        defs.push({ url: links.landing, label: app.methodBtn || 'Узнать о методике', cls: 'btn method' });
      }

      defs.forEach(function (d) {
        const a = document.createElement('a');
        a.href = d.url;
        a.className = d.cls;
        a.textContent = d.label;
        a.addEventListener('click', function (e) {
          e.preventDefault();
          withPressed(a, function () { openLink(d.url); });
        });
        resultActions.appendChild(a);
      });
    }

    if (resultHint) {
      if (app.btnWriteTitle) {
        resultHint.textContent = app.btnWriteTitle;
        resultHint.hidden = false;
      } else {
        resultHint.hidden = true;
      }
    }

    if (btnRestart) {
      btnRestart.textContent = app.btnRestart || 'Пройти заново';
      btnRestart.hidden = false;
    }
    if (btnClose) {
      btnClose.textContent = app.btnClose || 'Закрыть';
      btnClose.hidden = false;
    }

    showScreen('result');
  }

  /* ===================== ОБРАБОТЧИКИ ===================== */
  if (btnStart) {
    btnStart.addEventListener('click', function () {
      withPressed(btnStart, function () {
        if (questions.length === 0) {
          if (browserNote) {
            browserNote.textContent = 'Ошибка: вопросы не загружены (content.js пуст или не содержит questions).';
            browserNote.hidden = false;
          }
          return;
        }
        state.index = 0;
        state.answers = [];
        renderQuestion();
      });
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', function () {
      if (state.index <= 0) return;
      withPressed(btnBack, function () {
        state.index--;
        state.answers = state.answers.slice(0, state.index);
        renderQuestion();
      });
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', function () {
      withPressed(btnRestart, function () {
        state.index = -1;
        state.answers = [];
        initStart();
        showScreen('start');
      });
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', function () {
      withPressed(btnClose, function () { closeApp(); });
    });
  }

  /* ===================== INIT ===================== */
  function init() {
    initStart();
    showScreen('start');
    if (appEl) appEl.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
