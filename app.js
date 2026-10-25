"use strict";

(function () {
  const webApp = (typeof window !== "undefined" && window.WebApp) ? window.WebApp : null;
  if (webApp && typeof webApp.ready === "function") {
    try { webApp.ready(); } catch (_) {}
  }

  let userName = "";
  if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
    const raw = webApp.initDataUnsafe.user.first_name;
    if (typeof raw === "string" && raw.length <= 64) userName = raw;
  }

  const LINKS = {
    maxChat: "#",
    phone: "tel:+79951149954",
    landing: "https://ninigor78-pixel.github.io/max-selfcheck/landing.html" 
  };

  const QUESTIONS = [
    // 0-2: Офисный профиль (Шея, голова, скованность)
    { type: "osteo", profile: "office", text: "Бывает ли, что после рабочего дня хочется «размять» шею или спину?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Каждый день"], weights: [1, 2, 3, 4, 5] },
    { type: "osteo", profile: "office", text: "Замечаете ли вы, что утром телу нужно время, чтобы «расходиться»?",
      options: ["Нет, встаю легко", "Иногда", "Замечаю", "Часто", "Сильная скованность"], weights: [1, 2, 3, 4, 5] },
    { type: "osteo", profile: "office", text: "Как часто к концу дня появляется чувство тяжести в голове?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Почти каждый день"], weights: [1, 2, 3, 4, 5] },
      
    // 3-5: Профиль Перекос (Асимметрия, гибкость, упадок сил)
    { type: "osteo", profile: "asymmetry", text: "Замечали ли вы легкую асимметрию (например, лямка сумки спадает с одного плеча)?",
      options: ["Нет", "Возможно", "Иногда", "Да", "Выраженная"], weights: [1, 2, 3, 4, 5] },
    { type: "osteo", profile: "asymmetry", text: "Часто ли к вечеру чувствуется упадок сил, даже если день был не слишком тяжелым?",
      options: ["Нет", "Редко", "Иногда", "Часто", "Почти всегда"], weights: [1, 2, 3, 4, 5] },
    { type: "osteo", profile: "asymmetry", text: "Замечаете ли вы, что не хватает легкости и гибкости в движениях?",
      options: ["Нет", "Небольшая", "Умеренная", "Заметная", "Сильная"], weights: [1, 2, 3, 4, 5] },
      
    // 6-7: Профиль Усталость (Стресс, сон)
    { type: "osteo", profile: "stress", text: "Часто ли вы чувствуете внутреннее напряжение или спешку?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Постоянно"], weights: [1, 2, 3, 4, 5] },
    { type: "osteo", profile: "stress", text: "Как часто сон не приносит полного восстановления?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Почти каждую ночь"], weights: [1, 2, 3, 4, 5] },

    // Красные флаги
    { type: "redflag", text: "Была ли у вас серьезная травма за последние 3 месяца, после которой осталась боль или отек?", options: ["Нет", "Да"] },
    { type: "redflag", text: "Замечаете ли вы стойкое онемение или выраженную слабость в руках/ногах, которое не проходит?", options: ["Нет", "Да"] },
    { type: "redflag", text: "Беспокоит ли вас боль, которая не утихает даже в покое и мешает спать?", options: ["Нет", "Да"] },
    { type: "redflag", text: "Бывает ли сильная головная боль с тошнотой или светобоязнью, возникшая внезапно (как никогда раньше)?", options: ["Нет", "Да"] },
    { type: "redflag", text: "Бывает ли у вас беспричинная температура или резкая потеря веса в последнее время?", options: ["Нет", "Да"] }
  ];

  const TOTAL = QUESTIONS.length;
  const OSTEO_THRESHOLD = 40; 

  let currentIndex = 0;
  let answers = new Array(TOTAL).fill(null);
  let locked = false;

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
      btn.addEventListener("click", function () { selectAnswer(i); });
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
    let scores = { office: 0, asymmetry: 0, stress: 0 };
    let sum = 0;
    let max = 0;

    QUESTIONS.forEach(function (q, i) {
      const idx = answers[i];
      const safeIdx = (typeof idx === "number" && idx >= 0 && idx < 5) ? idx : 0;
      
      if (q.type === "redflag") {
        if (safeIdx > 0) redFlagCount++;
      } else if (q.type === "osteo") {
        sum += q.weights[safeIdx];
        max += 5;
        // Добавляем баллы в нужный профиль
        if (q.profile) scores[q.profile] += q.weights[safeIdx];
      }
    });

    const percent = max > 0 ? Math.round((sum / max) * 100) : 0;
    
    // Определяем доминирующий профиль
    let dominantProfile = "office";
    if (scores.asymmetry > scores[dominantProfile]) dominantProfile = "asymmetry";
    if (scores.stress > scores[dominantProfile]) dominantProfile = "stress";

    if (redFlagCount >= 2) return { outcome: "doctor" };
    if (redFlagCount === 1) return { outcome: "osteo", percent: percent, warning: true, profile: dominantProfile };
    if (percent >= OSTEO_THRESHOLD) return { outcome: "osteo", percent: percent, warning: false, profile: dominantProfile };
    
    return { outcome: "normal", percent: percent };
  }

  function createActionButton(text, href, style) {
    const a = el("a", "btn " + (style || "secondary"), text);
    a.href = href;
    return a;
  }

  function createActionBlock(title, hint, buttons) {
    const block = el("div", "action-block");
    block.appendChild(el("div", "action-title", title));
    if (hint) block.appendChild(el("div", "action-hint", hint));
    buttons.forEach(function (b) { block.appendChild(createActionButton(b.text, b.href, b.style)); });
    return block;
  }

  function getProfileText(profile) {
    if (profile === "office") {
      return "Твой профиль: «Каменные плечи». Судя по ответам, твое тело застряло в режиме «за компьютером». Когда мы долго смотрим в экран, голова уходит вперед, а фасции шеи и груди сжимаются, чтобы удержать этот вес. Отсюда — тяжесть в голове к вечеру и желание «размять» шею. Это не болезнь, просто телу нужна помощь, чтобы снять этот защитный панцирь.";
    } else if (profile === "asymmetry") {
      return "Твой профиль: «Скрытый перекос». Твое тело подает сигналы о том, что ось немного сместилась. Возможно, ты носишь сумку на одном плече или много сидишь в одной позе. Из-за этого одна сторона тела работает больше, а вторая — компенсирует. Это отнимает энергию (отсюда упадок сил) и создает внутреннее напряжение.";
    } else {
      return "Твой профиль: «Внутренний марафон». Твоя нервная система долгое время находится в напряжении. Даже когда ты отдыхаешь, тело не может расслабиться до конца — поэтому сон не приносит восстановления. Мышцы и фасции зажаты, как тугая пружина. Наша задача — «выключить» этот режим выживания и перевести тело в режим глубокого покоя.";
    }
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
      resultTitle.textContent = "Отличный баланс!";
      verdictEl.textContent = "Серьёзных сигналов не обнаружено";

      const body = el("div", "result-body", "Судя по вашим ответам, состояние тела в целом хорошее. Серьёзных сигналов, требующих внимания, не выявлено. Проходите опрос раз в 2–3 месяца, чтобы отслеживать динамику.");
      resultActions.appendChild(body);
      resultHint.textContent = "Это не медицинская диагностика. Результат носит ознакомительный характер. Сделайте скриншот, если хотите сохранить его.";

    } else if (outcome === "osteo") {
      resultIcon.textContent = "🌿";
      resultTitle.textContent = "Твоему телу нужна перезагрузка";
      verdictEl.textContent = "В целом всё хорошо, но есть сигналы напряжения";

      const body = el("div", "result-body", "Судя по ответам, в целом всё хорошо! Но есть сигналы о том, что телу не хватает расслабления. Это как раз то, с чем бережно работает оздоровительная остеопластика.");
      resultActions.appendChild(body);

      // БЛОК С ПРИЗОМ (Персональный разбор)
      const prizeBox = el("div", "result-body");
      prizeBox.style.background = "var(--accent-soft)";
      prizeBox.style.padding = "20px";
      prizeBox.style.borderRadius = "12px";
      prizeBox.style.marginBottom = "20px";
      prizeBox.style.borderLeft = "4px solid var(--accent)";
      
      const prizeTitle = el("div", "action-title", "🎁 Твой персональный разбор");
      prizeTitle.style.color = "var(--accent)";
      prizeTitle.style.marginBottom = "10px";
      
      const prizeText = el("div", "", getProfileText(result.profile));
      prizeText.style.fontSize = "0.95rem";
      
      prizeBox.appendChild(prizeTitle);
      prizeBox.appendChild(prizeText);
      resultActions.appendChild(prizeBox);

      if (result.warning) {
        const warnBox = el("div", "result-body");
        warnBox.style.background = "#fff8e6";
        warnBox.style.color = "#7a5f1a";
        warnBox.style.padding = "15px";
        warnBox.style.borderRadius = "12px";
        warnBox.style.fontSize = "0.9rem";
        warnBox.style.marginBottom = "20px";
        warnBox.textContent = "Обратите внимание: вы отметили один симптом, который требует наблюдения. Если он усилится, рекомендую сначала проконсультироваться с врачом.";
        resultActions.appendChild(warnBox);
      }

      resultActions.appendChild(createActionBlock("Хочу записаться на сеанс", "Отвечу на вопросы и подберу удобное время", [
        { text: "Написать в MAX", href: LINKS.maxChat, style: "primary" },
        { text: "Позвонить", href: LINKS.phone, style: "secondary" }
      ]));
      resultActions.appendChild(createActionBlock("Хочу узнать о методике", "Что это, как проходит, кому подходит", [
        { text: "Подробнее на сайте", href: LINKS.landing, style: "secondary" }
      ]));
      resultHint.textContent = "Это не медицинская диагностика. Приложение не ставит диагноз и не назначает лечение. Сделайте скриншот результата, если хотите его сохранить.";

    } else {
      resultIcon.textContent = "⚠️";
      resultTitle.textContent = "Лучше начать с врача";
      verdictEl.textContent = "Есть нюансы, требующие внимания специалиста";

      const body = el("div", "result-body", "Забота о теле начинается с безопасности. Некоторые из ваших ответов указывают на нюансы, с которыми сначала лучше обратиться к терапевту или неврологу. Это поможет исключить противопоказания. Если вам станет совсем нехорошо — обязательно позвоните 103.");
      resultActions.appendChild(body);
      resultHint.textContent = "Это не медицинская диагностика. Решение о лечении принимает врач. Сделайте скриншот результата, если хотите его сохранить.";
    }

    showScreen("result");
  }

  $("#btn-start").addEventListener("click", function () {
    currentIndex = 0;
    answers = new Array(TOTAL).fill(null);
    renderQuestion();
    showScreen("question");
  });

  $("#btn-restart").addEventListener("click", function () {
    currentIndex = 0;
    answers = new Array(TOTAL).fill(null);
    showScreen("start");
  });

  $("#btn-close").addEventListener("click", function () {
    answers = new Array(TOTAL).fill(null);
    showScreen("start");
    if (webApp && typeof webApp.close === "function") {
      try { webApp.close(); } catch (_) {}
    }
  });

  const appRoot = $("#app");
  if (appRoot) appRoot.removeAttribute("hidden");

  if (userName) {
    const startSubtitle = $("#start-subtitle");
    if (startSubtitle) {
      startSubtitle.textContent = "Привет, " + userName + "! Ответь на " + TOTAL + " вопросов и узнай, как сейчас чувствует твоё тело.";
    }
  }
})();
