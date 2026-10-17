"use strict";

/*
 * Безопасность:
 * - Никаких innerHTML / insertAdjacentHTML / outerHTML.
 * - Только textContent и createElement.
 * - Никаких сетевых запросов.
 * - Никакого localStorage / sessionStorage / IndexedDB.
 * - initDataUnsafe — только для отображения имени.
 */

(function () {
  // ==== MAX Bridge ====
  const webApp = (typeof window !== "undefined" && window.WebApp) ? window.WebApp : null;
  if (webApp && typeof webApp.ready === "function") {
    try { webApp.ready(); } catch (_) {}
  }

  let userName = "";
  if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
    const raw = webApp.initDataUnsafe.user.first_name;
    if (typeof raw === "string" && raw.length <= 64) userName = raw;
  }

  // ==== Ссылки (замени когда будут готовы) ====
  const LINKS = {
    maxChat: "#",                                 // TODO: ссылка на чат-бота MAX
    phone: "tel:+79951149954",
    landing: "#",                                 // TODO: лендинг
    channel: "#"                                  // TODO: канал в MAX
  };

  // ==== Вопросы ====
  // type: "osteo" — обычный вопрос со шкалой 1–5
  // type: "redflag" — бинарный вопрос, любой положительный ответ = врач
  const QUESTIONS = [
    // --- Остеопатические жалобы (8) ---
    { type: "osteo", text: "Как часто к вечеру «тянет» шею или спину?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Каждый день"],
      weights: [1, 2, 3, 4, 5] },
    { type: "osteo", text: "Чувствуете ли вы скованность в теле утром?",
      options: ["Нет", "Слабая", "Умеренная", "Заметная", "Сильная"],
      weights: [1, 2, 3, 4, 5] },
    { type: "osteo", text: "Замечали ли вы асимметрию (одно плечо выше, таз перекошен)?",
      options: ["Нет", "Возможно", "Иногда", "Да", "Выраженная"],
      weights: [1, 2, 3, 4, 5] },
    { type: "osteo", text: "Есть ли хроническая усталость, не проходящая после отдыха?",
      options: ["Нет", "Редко", "Иногда", "Часто", "Постоянно"],
      weights: [1, 2, 3, 4, 5] },
    { type: "osteo", text: "Как часто болит голова в конце рабочего дня?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Почти каждый день"],
      weights: [1, 2, 3, 4, 5] },
    { type: "osteo", text: "Есть ли ограничение подвижности (трудно повернуть голову, наклониться)?",
      options: ["Нет", "Небольшое", "Умеренное", "Заметное", "Сильное"],
      weights: [1, 2, 3, 4, 5] },
    { type: "osteo", text: "Как часто вы чувствуете стресс или тревогу?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Постоянно"],
      weights: [1, 2, 3, 4, 5] },
    { type: "osteo", text: "Как часто вы просыпаетесь ночью или не высыпаетесь?",
      options: ["Никогда", "Редко", "Иногда", "Часто", "Почти каждую ночь"],
      weights: [1, 2, 3, 4, 5] },

    // --- Красные флаги (5) ---
    { type: "redflag", text: "Была ли у вас травма (падение, удар, ДТП) за последние 3 месяца?",
      options: ["Нет", "Да"] },
    { type: "redflag", text: "Есть ли онемение или слабость в руках или ногах?",
      options: ["Нет", "Да"] },
    { type: "redflag", text: "Есть ли острая, простреливающая боль, усиливающаяся при движении?",
      options: ["Нет", "Да"] },
    { type: "redflag", text: "Бывает ли головная боль с тошнотой или светобоязнью?",
      options: ["Нет", "Да"] },
    { type: "redflag", text: "Есть ли у вас температура, озноб или необъяснимая потеря веса?",
      options: ["Нет", "Да"] }
  ];

  const TOTAL = QUESTIONS.length;
  const OSTEO_THRESHOLD = 40; // % — выше этого → рекомендуется остеопластика

  // ==== Состояние ====
  let currentIndex = 0;
  let answers = new Array(TOTAL).fill(null);
  let locked = false;

  // ==== DOM ====
  function $(sel) { return document.querySelector(sel); }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  const screens = {
    start: $("#screen-start"),
    question: $("#screen-question"),
    result: $("#screen-result")
  };

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
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.remove("active");
    });
    screens[name].classList.add("active");
    try { window.scrollTo(0, 0); } catch (_) {}
  }

  // ==== Вопросы ====
  function renderQuestion() {
    const q = QUESTIONS[currentIndex];
    qCurrent.textContent = String(currentIndex + 1);
    qText.textContent = q.text;

    const percent = Math.round((currentIndex / TOTAL) * 100);
    progressBar.style.width = percent + "%";
    if (progressWrap && progressWrap.setAttribute) {
      progressWrap.setAttribute("aria-valuenow", String(percent));
    }

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
      locked = false;
      return;
    }

    answers[currentIndex] = optionIndex;

    const buttons = answersBox.querySelectorAll(".answer");
    buttons.forEach(function (b) { b.classList.remove("selected"); });
    if (buttons[optionIndex]) buttons[optionIndex].classList.add("selected");

    window.setTimeout(function () {
      if (currentIndex < TOTAL - 1) {
        currentIndex++;
        renderQuestion();
      } else {
        showResult();
      }
      locked = false;
    }, 180);
  }

  // ==== Логика оценки ====
  function evaluate() {
    // 1. Проверка красных флагов — любой положительный ответ (не первый вариант) → врач
    let hasRedFlag = false;
    QUESTIONS.forEach(function (q, i) {
      if (q.type === "redflag") {
        const ans = answers[i];
        if (typeof ans === "number" && ans > 0) hasRedFlag = true;
      }
    });

    if (hasRedFlag) {
      return { outcome: "doctor" };
    }

    // 2. Считаем процент напряжения по остео-вопросам
    let sum = 0;
    let max = 0;
    QUESTIONS.forEach(function (q, i) {
      if (q.type === "osteo") {
        const idx = answers[i];
        const safeIdx = (typeof idx === "number" && idx >= 0 && idx < q.weights.length) ? idx : 0;
        sum += q.weights[safeIdx];
        max += 5;
      }
    });

    const percent = max > 0 ? Math.round((sum / max) * 100) : 0;

    if (percent >= OSTEO_THRESHOLD) {
      return { outcome: "osteo", percent: percent };
    }

    return { outcome: "normal", percent: percent };
  }

  // ==== Хелперы для кнопок ====
  function createActionButton(text, href, style) {
    const a = el("a", "btn " + (style || "secondary"), text);
    a.href = href;
    return a;
  }

  function createActionBlock(title, hint, buttons) {
    const block = el("div", "action-block");
    block.appendChild(el("div", "action-title", title));
    if (hint) block.appendChild(el("div", "action-hint", hint));
    buttons.forEach(function (b) {
      block.appendChild(createActionButton(b.text, b.href, b.style));
    });
    return block;
  }

  // ==== Рендер результата ====
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
      resultTitle.textContent = "Всё в норме";
      verdictEl.textContent = "Серьёзных сигналов не обнаружено";

      const body = el("div", "result-body",
        "Судя по вашим ответам, состояние тела в целом хорошее. " +
        "Серьёзных сигналов, требующих внимания, не выявлено. " +
        "Проходите опрос раз в 2–3 месяца, чтобы отслеживать динамику."
      );
      resultActions.appendChild(body);

      resultActions.appendChild(createActionBlock(
        "Хотите узнать больше о телесных практиках?",
        "Разборы, упражнения, ответы на вопросы",
        [{ text: "Перейти в канал", href: LINKS.channel, style: "secondary" }]
      ));

      resultHint.textContent = "Это не медицинская диагностика. Результат носит ознакомительный характер. Сделайте скриншот, если хотите сохранить его — после закрытия приложения он не сохранится.";

    } else if (outcome === "osteo") {
      resultIcon.textContent = "🌿";
      resultTitle.textContent = "Рекомендуется телесная практика";
      verdictEl.textContent = "Обнаружено хроническое напряжение";

      const body = el("div", "result-body",
        "Ваши ответы указывают на хроническое напряжение в теле. " +
        "С этим работает оздоровительная остеопластика — мягкая телесно-фасциальная практика. " +
        "У меня медицинское образование и профильное обучение этой методике. " +
        "Запишитесь на сеанс — помогу разобраться."
      );
      resultActions.appendChild(body);

      resultActions.appendChild(createActionBlock(
        "Хочу записаться на сеанс",
        "Отвечу на вопросы и подберу удобное время",
        [
          { text: "Написать в MAX", href: LINKS.maxChat, style: "primary" },
          { text: "Позвонить", href: LINKS.phone, style: "secondary" }
        ]
      ));

      resultActions.appendChild(createActionBlock(
        "Хочу узнать о методике",
        "Что это, как проходит, кому подходит",
        [{ text: "Подробнее на сайте", href: LINKS.landing, style: "secondary" }]
      ));

      resultActions.appendChild(createActionBlock(
        "Хочу следить за новостями",
        "Разборы, упражнения, ответы на вопросы",
        [{ text: "Перейти в канал", href: LINKS.channel, style: "secondary" }]
      ));

      resultHint.textContent = "Это не медицинская диагностика. Приложение не ставит диагноз и не назначает лечение. Решение о любом воздействии принимает специалист после консультации. Сделайте скриншот результата, если хотите его сохранить — после закрытия приложения он не сохранится.";

    } else {
      // doctor
      resultIcon.textContent = "⚠️";
      resultTitle.textContent = "Рекомендуется обратиться к врачу";
      verdictEl.textContent = "Обнаружены симптомы, требующие внимания";

      const body = el("div", "result-body",
        "Некоторые из ваших ответов указывают на симптомы, которые требуют внимания врача. " +
        "Рекомендуем обратиться к терапевту или неврологу для обследования. " +
        "Если состояние ухудшается — звоните 103."
      );
      resultActions.appendChild(body);

      resultActions.appendChild(createActionBlock(
        "Хотите узнавать больше о телесных практиках?",
        "Разборы, упражнения, ответы на вопросы",
        [{ text: "Перейти в канал", href: LINKS.channel, style: "secondary" }]
      ));

      resultHint.textContent = "Это не медицинская диагностика. Решение о лечении принимает врач. Сделайте скриншот результата, если хотите его сохранить — после закрытия приложения он не сохранится.";
    }

    showScreen("result");
  }

  // ==== Кнопки ====
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
    if (webApp && typeof webApp.close === "function") {
      try { webApp.close(); } catch (_) { showScreen("start"); }
    } else {
      showScreen("start");
    }
  });

  // Показ приложения
  const appRoot = $("#app");
  if (appRoot) appRoot.removeAttribute("hidden");

  // Персонализация
  if (userName) {
    const startSubtitle = $("#start-subtitle");
    if (startSubtitle) {
      startSubtitle.textContent = "Привет, " + userName + "! Ответь на " + TOTAL + " вопросов и узнай, как сейчас чувствует твоё тело.";
    }
  }
})();
