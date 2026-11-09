"use strict";

(function () {
  const webApp = (typeof window !== "undefined" && window.WebApp) ? window.WebApp : null;
  const isInsideMax = webApp !== null;

  if (webApp && typeof webApp.ready === "function") {
    try { webApp.ready(); } catch (_) {}
  }

  let userName = "";
  if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
    const raw = webApp.initDataUnsafe.user.first_name;
    if (typeof raw === "string" && raw.length <= 64) userName = raw;
  }

  const LINKS = CONTENT.links;
  const TEXT = CONTENT.app;
  const SETTINGS = CONTENT.settings;
  const THEME = CONTENT.theme || {};
  
  if (THEME.primary) {
    document.documentElement.style.setProperty('--accent', THEME.primary);
    document.documentElement.style.setProperty('--accent-soft', THEME.primary + '20'); 
  }

  document.getElementById("ui-start-title").textContent = TEXT.title;
  document.getElementById("ui-start-hint").textContent = TEXT.hint;
  document.getElementById("btn-start").textContent = TEXT.btnStart;
  document.getElementById("btn-restart").textContent = TEXT.btnRestart;
  document.getElementById("btn-close").textContent = TEXT.btnClose;

  const privacyUl = document.getElementById("privacy-list");
  if (privacyUl) {
    privacyUl.innerHTML = "";
    TEXT.privacyList.forEach(function(text) {
      const li = document.createElement("li");
      li.textContent = text;
      privacyUl.appendChild(li);
    });
  }

  if (!isInsideMax) {
    document.getElementById("btn-close").style.display = "none"; 
    const browserNote = document.getElementById("ui-browser-note");
    browserNote.textContent = TEXT.browserNote;
    browserNote.style.display = "block";
  }

  const rawQuestions = CONTENT.questions;
  const QUESTIONS = rawQuestions.map(function(q, index) {
    let safeWeights = q.weights;
    if (q.type === "osteo" && q.options.length !== safeWeights.length) {
      safeWeights = q.options.map(function(_, i) { return q.weights[i] !== undefined ? q.weights[i] : 3; });
    } else if (q.type === "redflag") {
      safeWeights = [1, 5];
    }
    return { type: q.type, profile: q.profile || "any", text: q.text, options: q.options, weights: safeWeights };
  });

  const TOTAL = QUESTIONS.length;
  let currentIndex = 0;
  let answers = new Array(TOTAL).fill(null);
  let locked = false;
  let chosenProfile = "general"; 

  function $(sel) { return document.querySelector(sel); }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  const screens = { start: $("#screen-start"), question: $("#screen-question"), result: $("#screen-result") };
  const progressWrap = $("#progress-wrap");
  const progressBar = $("#progress-bar");
  const qCurrent = $("#q-current");
  const qTotal = $("#q-total");
  const qText = $("#q-text");
  const answersBox = $("#answers");
  const resultIcon = $("#result-icon");
  const resultTitle = $("#result-title");
  const verdictEl = $("#verdict");
  const resultActions = $("#result-actions");
  const resultHint = $("#result-hint");

  qTotal.textContent = String(TOTAL);

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) { screens[key].classList.remove("active"); });
    screens[name].classList.add("active");
    try { window.scrollTo(0, 0); } catch (_) {}
  }

  function renderQuestion() {
    const q = QUESTIONS[currentIndex];
    qCurrent.textContent = String(currentIndex + 1);
    qText.textContent = q.text;

    const percent = Math.round((currentIndex / TOTAL) * 100);
    progressBar.style.width = percent + "%";
    if (progressWrap && progressWrap.setAttribute) progressWrap.setAttribute("aria-valuenow", String(percent));

    answersBox.textContent = "";
    q.options.forEach(function (label, i) {
      const btn = el("button", "answer", label);
      btn.type = "button";
      if (answers[currentIndex] === i) btn.classList.add("selected");
      btn.addEventListener("click", function () { 
        if (navigator.vibrate) navigator.vibrate(10);
        selectAnswer(i); 
      });
      answersBox.appendChild(btn);
    });
  }

  function selectAnswer(optionIndex) {
    if (locked) return;
    locked = true;
    if (typeof optionIndex !== "number" || optionIndex < 0 || optionIndex >= QUESTIONS[currentIndex].options.length) {
      locked = false; return;
    }

    answers[currentIndex] = optionIndex;

    if (currentIndex === 0) {
      if (optionIndex === 0) chosenProfile = "neck";
      else if (optionIndex === 1) chosenProfile = "lower_back";
      else if (optionIndex === 3) chosenProfile = "pelvis";
      else chosenProfile = "general";
    }

    if (QUESTIONS[currentIndex].profile === "scar" && optionIndex >= 2) {
      if (chosenProfile === "general" || chosenProfile === "neck" || chosenProfile === "lower_back") chosenProfile = "scar";
    }

    const buttons = answersBox.querySelectorAll(".answer");
    buttons.forEach(function (b) { b.classList.remove("selected"); });
    if (buttons[optionIndex]) buttons[optionIndex].classList.add("selected");

    window.setTimeout(function () {
      if (currentIndex < TOTAL - 1) { currentIndex++; renderQuestion(); } else { showResult(); }
      locked = false;
    }, 180);
  }

  function evaluate() {
    let redFlagCount = 0;
    let sum = 0;
    let maxPossibleScore = 0;

    QUESTIONS.forEach(function (q, i) {
      const idx = answers[i];
      const safeIdx = (typeof idx === "number" && idx >= 0 && idx < q.options.length) ? idx : 0;
      
      if (q.type === "redflag") {
        if (safeIdx > 0) redFlagCount++;
      } else if (q.type === "osteo") {
        if (i > 0) {
          sum += q.weights[safeIdx];
          maxPossibleScore += Math.max(...q.weights); 
        }
      }
    });

    const percent = maxPossibleScore > 0 ? Math.round((sum / maxPossibleScore) * 100) : 0;

    if (redFlagCount >= 2) return { outcome: "doctor" };
    if (redFlagCount === 1) return { outcome: "osteo", percent: percent, warning: true };
    if (percent >= SETTINGS.osteoThreshold) return { outcome: "osteo", percent: percent, warning: false };
    return { outcome: "normal", percent: percent };
  }

  function createActionButton(text, href, style, customBg, customShadow) {
    const a = el("a", "btn " + (style || "secondary"), text);
    a.href = href;
    a.target = "_blank";
    if (customBg) {
      a.style.background = customBg;
      a.style.color = "#fff";
      a.style.boxShadow = "0 4px 0 " + (customShadow || "#000");
      a.classList.remove("btn-secondary");
    }
    a.addEventListener("click", function() { if (navigator.vibrate) navigator.vibrate(10); });
    return a;
  }

  function getProfileText(profile) {
    if (profile === "neck") return "Твой профиль: «Офисная шея». Судя по ответам, твое тело застряло в режиме работы за компьютером. Голова уходит вперед, а фасции шеи и груди сжимаются. Наша задача — мягко раскрыть грудную клетку и вернуть шее свободу.";
    if (profile === "lower_back") return "Твой профиль: «Зажатая поясница». Твои ответы указывают на напряжение в нижней части спины. Это может быть связано с долгим сидением или компенсацией после нагрузок. Работа с фасциями таза и ног поможет снять эту нагрузку.";
    if (profile === "pelvis") return "Твой профиль: «Перекос таза». Тело подает сигналы о том, что ось сместилась. Из-за этого одна сторона тела работает больше, отнимая энергию. Остеокоррекция помогает вернуть тазу баланс и симметрию.";
    if (profile === "scar") return "Твой профиль: «Скрытые спайки». Ты отметил наличие рубцов или операций. Рубец — это плотная ткань, которая может стягивать фасции, вызывая перекосы. Мы можем бережно проработать эти натяжения, чтобы тело снова двигалось свободно.";
    return "Твой профиль: «Внутренний марафон». Твоя нервная система долго находится в напряжении. Мышцы и фасции зажаты, как пружина. Наша задача — перевести тело в режим глубокого покоя.";
  }

  function showResult() {
    const result = evaluate();
    const outcome = result.outcome;

    resultActions.textContent = "";
    resultIcon.textContent = "";
    resultTitle.textContent = "";
    verdictEl.textContent = "";
    resultHint.textContent = "";

    if (outcome === "normal") {
      resultIcon.textContent = "✅";
      resultTitle.textContent = TEXT.normalTitle;
      verdictEl.textContent = TEXT.normalVerdict;
      resultActions.appendChild(el("div", "result-body", TEXT.normalBody));
      resultHint.textContent = "Это не медицинская диагностика. Сделайте скриншот, если хотите сохранить результат.";
    } else if (outcome === "osteo") {
      resultIcon.textContent = "🌿";
      resultTitle.textContent = TEXT.osteoTitle;
      verdictEl.textContent = TEXT.osteoVerdict;
      resultActions.appendChild(el("div", "result-body", TEXT.osteoBody));

      const prizeBox = el("div", "result-body");
      prizeBox.style.background = "var(--accent-soft)";
      prizeBox.style.padding = "20px";
      prizeBox.style.borderRadius = "12px";
      prizeBox.style.marginBottom = "20px";
      prizeBox.style.borderLeft = "4px solid var(--accent)";
      prizeBox.appendChild(el("div", "action-title", "🎁 Твой персональный разбор")).style.color = "var(--accent)";
      prizeBox.lastChild.style.marginBottom = "10px";
      const prizeText = el("div", "", getProfileText(chosenProfile));
      prizeText.style.fontSize = "0.95rem";
      prizeBox.appendChild(prizeText);
      resultActions.appendChild(prizeBox);

      const guideBox = el("div", "result-body");
      guideBox.style.background = "var(--guide-bg)";
      guideBox.style.color = "var(--guide-fg)";
      guideBox.style.padding = "15px";
      guideBox.style.borderRadius = "12px";
      guideBox.style.marginBottom = "20px";
      guideBox.style.borderLeft = "4px solid var(--guide-border)";
      guideBox.style.fontSize = "0.9rem";
      guideBox.textContent = "🎁 Если хотите получить персональный гайд по экспресс-разгрузке именно вашей зоны напряжения — напишите мне в удобный мессенджер и пришлите скриншот этого результата. Отправлю методику бесплатно.";
      resultActions.appendChild(guideBox);

      if (result.warning) {
        const warnBox = el("div", "result-body");
        warnBox.style.background = "var(--warn-bg)";
        warnBox.style.color = "var(--warn-fg)";
        warnBox.style.padding = "15px";
        warnBox.style.borderRadius = "12px";
        warnBox.style.fontSize = "0.9rem";
        warnBox.style.marginBottom = "20px";
        warnBox.textContent = "Вы отметили один симптом, требующий наблюдения. Рекомендую перед сеансом проконсультироваться с врачом.";
        resultActions.appendChild(warnBox);
      }

      const actionBlock = el("div", "action-block");
      actionBlock.appendChild(el("div", "action-title", TEXT.btnWriteTitle));
      
      if (!isInsideMax || SETTINGS.showAllMessengersInsideMax) {
        actionBlock.appendChild(el("div", "action-hint", TEXT.btnWriteHint));
        if (CONTENT.messengerButtons && CONTENT.messengerButtons.length > 0) {
          CONTENT.messengerButtons.forEach(function(btn) {
            let link = btn.link;
            if (link === "https://t.me/ТВОЙ_НИК") link = LINKS.tg;
            if (link === "https://wa.me/79951149954") link = LINKS.wa;
            if (link === "https://max.ru/se14074027_bot") link = LINKS.max;
            
            let bg = btn.type === 'tg' ? THEME.tg : (btn.type === 'wa' ? THEME.wa : (btn.type === 'primary' ? THEME.primary : null));
            actionBlock.appendChild(createActionButton(btn.text, link, btn.type, bg, bg ? bg.replace('#','#00') : null));
          });
        }
      } else {
        actionBlock.appendChild(createActionButton(TEXT.btnWriteMax || "Написать в MAX", LINKS.max, "primary"));
      }

      actionBlock.appendChild(createActionButton(TEXT.btnCall, LINKS.phone, "secondary"));
      
      const callHint = el("div", "action-hint", TEXT.callNote);
      callHint.style.marginTop = "10px"; callHint.style.marginBottom = "0"; callHint.style.fontSize = "0.75rem";
      actionBlock.appendChild(callHint);
      resultActions.appendChild(actionBlock);

      const methodBlock = el("div", "action-block");
      methodBlock.appendChild(el("div", "action-title", TEXT.methodTitle));
      methodBlock.appendChild(createActionButton(TEXT.methodBtn, LINKS.landing, "secondary"));
      resultActions.appendChild(methodBlock);
      
      resultHint.textContent = "Это не медицинская диагностика. Приложение не ставит диагноз и не назначает лечение. Сделайте скриншот результата, если хотите его сохранить.";
    } else {
      resultIcon.textContent = "⚠️";
      resultTitle.textContent = TEXT.doctorTitle;
      verdictEl.textContent = TEXT.doctorVerdict;
      resultActions.appendChild(el("div", "result-body", TEXT.doctorBody));
      resultHint.textContent = "Это не медицинская диагностика. Решение о лечении принимает врач. Сделайте скриншот результата, если хотите его сохранить.";
    }

    showScreen("result");
  }

  $("#btn-start").addEventListener("click", function () {
    currentIndex = 0; answers = new Array(TOTAL).fill(null); chosenProfile = "general"; renderQuestion(); showScreen("question");
  });
  $("#btn-restart").addEventListener("click", function () {
    currentIndex = 0; answers = new Array(TOTAL).fill(null); showScreen("start");
  });
  $("#btn-close").addEventListener("click", function () {
    answers = new Array(TOTAL).fill(null); showScreen("start");
    if (webApp && typeof webApp.close === "function") { try { webApp.close(); } catch (_) {} }
  });

  const appRoot = $("#app");
  if (appRoot) appRoot.removeAttribute("hidden");
  const startSubtitle = $("#start-subtitle");
  if (startSubtitle) {
    startSubtitle.textContent = userName ? "Привет, " + userName + "! " + TEXT.subtitle : TEXT.subtitle;
  }
})();
