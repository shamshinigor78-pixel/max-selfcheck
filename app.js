"use strict";

(function () {
  const C = window.CONTENT;
  if (!C) {
    document.body.innerHTML = '<p style="padding:24px;text-align:center;font-family:sans-serif;">Ошибка: content.js не загрузился.</p>';
    return;
  }

  const webApp = window.WebApp || null;
  const canUseOpenLink = !!(webApp && typeof webApp.openLink === "function" && typeof webApp.initData === "string" && webApp.initData.length > 0);
  if (canUseOpenLink && typeof webApp.ready === "function") { try { webApp.ready(); } catch (_) {} }

  let userName = "";
  if (canUseOpenLink && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
    const raw = webApp.initDataUnsafe.user.first_name;
    if (typeof raw === "string" && raw.length <= 64) userName = raw;
  }

  const LINKS = C.links || {};
  const TEXT = C.app || {};
  const SETTINGS = C.settings || {};
  const QUESTIONS = (Array.isArray(C.questions) ? C.questions : []).map(normalizeQuestion);
  const TOTAL = QUESTIONS.length;
  const THRESHOLD = typeof SETTINGS.osteoThreshold === "number" ? SETTINGS.osteoThreshold : 35;

  if (!TOTAL) {
    document.body.innerHTML = '<p style="padding:24px;text-align:center;font-family:sans-serif;">Тест не настроен.</p>';
    return;
  }

  let currentIndex = 0;
  let answers = new Array(TOTAL).fill(null);
  let locked = false;
  let chosenProfile = "general";

  function normalizeQuestion(q) {
    const opts = Array.isArray(q.options) ? q.options : [];
    return {
      type: q.type || "osteo",
      includeInScore: q.includeInScore !== false,
      text: q.text || "",
      options: opts.map(function (o) {
        if (typeof o === "string") return { text: o, weight: 3, profile: null, redflag: false };
        return {
          text: o.text || "",
          weight: typeof o.weight === "number" ? o.weight : 3,
          profile: o.profile || null,
          redflag: !!o.redflag
        };
      })
    };
  }

  function $(s) { return document.querySelector(s); }
  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = String(txt);
    return n;
  }

  function openExternal(url) {
    if (!url) return;
    if (canUseOpenLink) {
      try { webApp.openLink(url); return; } catch (_) {}
    }
    if (/^tel:|^mailto:/.test(url)) { window.location.href = url; return; }
    window.open(url, "_blank", "noopener,noreferrer");
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
  const btnBack = $("#btn-back");

  qTotal.textContent = String(TOTAL);

  $("#ui-start-title").textContent = TEXT.title || "";
  $("#ui-start-subtitle").textContent = (userName ? ("Привет, " + userName + "! ") : "") + (TEXT.subtitle || "");
  $("#ui-start-hint").textContent = TEXT.hint || "";
  $("#btn-start").textContent = TEXT.btnStart || "Начать";
  $("#btn-restart").textContent = TEXT.btnRestart || "Пройти заново";
  $("#btn-close").textContent = TEXT.btnClose || "Закрыть";

  const privacyUl = document.querySelector(".privacy-note ul");
  if (privacyUl && Array.isArray(TEXT.privacyList)) {
    privacyUl.innerHTML = "";
    TEXT.privacyList.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      privacyUl.appendChild(li);
    });
  }

  function showScreen(name) {
    Object.keys(screens).forEach(function (k) { if (screens[k]) screens[k].classList.remove("active"); });
    if (screens[name]) screens[name].classList.add("active");
    try { window.scrollTo(0, 0); } catch (_) {}
  }

  function renderQuestion() {
    const q = QUESTIONS[currentIndex];
    qCurrent.textContent = String(currentIndex + 1);
    qText.textContent = q.text;
    const percent = Math.round((currentIndex / TOTAL) * 100);
    progressBar.style.width = percent + "%";
    if (progressWrap) progressWrap.setAttribute("aria-valuenow", String(percent));

    if (btnBack) {
      btnBack.textContent = TEXT.btnBack || "← Назад";
      btnBack.style.display = "inline-flex";
    }

    answersBox.textContent = "";
    q.options.forEach(function (opt, i) {
      const btn = el("button", "answer", opt.text);
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
    const q = QUESTIONS[currentIndex];
    if (optionIndex < 0 || optionIndex >= q.options.length) return;
    locked = true;
    answers[currentIndex] = optionIndex;

    const opt = q.options[optionIndex];
    if (opt.profile) chosenProfile = opt.profile;

    const buttons = answersBox.querySelectorAll(".answer");
    buttons.forEach(function (b) { b.classList.remove("selected"); });
    if (buttons[optionIndex]) buttons[optionIndex].classList.add("selected");

    window.setTimeout(function () {
      if (currentIndex < TOTAL - 1) { currentIndex++; renderQuestion(); }
      else { showResult(); }
      locked = false;
    }, 180);
  }

  function goBack() {
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    } else {
      showScreen("start");
    }
  }

  function evaluate() {
    let redFlagCount = 0, sum = 0, max = 0;
    QUESTIONS.forEach(function (q, i) {
      const idx = answers[i];
      if (idx === null) return;
      const opt = q.options[idx];
      if (!opt) return;
      if (q.type === "redflag") {
        if (opt.redflag) redFlagCount++;
        return;
      }
      if (!q.includeInScore) return;
      sum += opt.weight;
      const localMax = q.options.reduce(function (m, o) { return Math.max(m, o.weight); }, 0);
      max += localMax;
    });
    const percent = max > 0 ? Math.round((sum / max) * 100) : 0;
    if (redFlagCount >= 2) return { outcome: "doctor" };
    if (redFlagCount === 1) return { outcome: "osteo", warning: true, percent: percent };
    if (percent >= THRESHOLD) return { outcome: "osteo", warning: false, percent: percent };
    return { outcome: "normal", percent: percent };
  }

  function makeBtn(label, href, style, bg, shadow) {
    const a = el("a", "btn " + (style || "secondary"), label);
    a.href = href || "#";
    a.rel = "noopener noreferrer";
    if (!/^tel:|^mailto:/.test(a.href)) a.target = "_blank";
    if (bg) {
      a.style.background = bg;
      a.style.color = "#fff";
      a.style.boxShadow = "0 4px 0 " + (shadow || "#000");
    }
    a.addEventListener("click", function (e) {
      if (canUseOpenLink && href) {
        e.preventDefault();
        openExternal(href);
      }
      if (navigator.vibrate) navigator.vibrate(10);
    });
    return a;
  }

  function messengerList() {
    const list = [];
    if (LINKS.max) list.push({ label: TEXT.btnWriteMax || "Написать в MAX", href: LINKS.max, style: "primary" });
    if (LINKS.tg) list.push({ label: TEXT.btnWriteTg || "Написать в Telegram", href: LINKS.tg, style: "custom", bg: "#229ED9", shadow: "#1A7CA8" });
    if (LINKS.wa) list.push({ label: TEXT.btnWriteWa || "Написать в WhatsApp", href: LINKS.wa, style: "custom", bg: "#25D366", shadow: "#128C7E" });
    return list;
  }

  function showResult() {
    const r = evaluate();
    resultActions.textContent = "";
    resultIcon.textContent = "";
    resultTitle.textContent = "";
    verdictEl.textContent = "";
    resultHint.textContent = "";

    if (r.outcome === "normal") {
      resultIcon.textContent = "✅";
      resultTitle.textContent = TEXT.normalTitle || "";
      verdictEl.textContent = TEXT.normalVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.normalBody || ""));
      resultHint.textContent = TEXT.hint || "";

    } else if (r.outcome === "osteo") {
      resultIcon.textContent = "🌿";
      resultTitle.textContent = TEXT.osteoTitle || "";
      verdictEl.textContent = TEXT.osteoVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.osteoBody || ""));

      const prize = el("div", "result-body");
      prize.style.cssText = "background:var(--accent-soft);padding:20px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--accent)";
      const pt = el("div", "action-title", "🎁 " + (TEXT.prizeTitle || "Твой персональный разбор"));
      pt.style.color = "var(--accent)";
      pt.style.marginBottom = "10px";
      prize.appendChild(pt);
      const map = TEXT.profiles || {};
      const pb = el("div", "", map[chosenProfile] || map.general || "");
      pb.style.fontSize = "1rem";
      prize.appendChild(pb);
      resultActions.appendChild(prize);

      if (TEXT.guideBox) {
        const gb = el("div", "result-body", TEXT.guideBox);
        gb.style.cssText = "background:var(--guide-bg);color:var(--guide-fg);padding:15px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--guide-border);font-size:1rem";
        resultActions.appendChild(gb);
      }
      if (r.warning && TEXT.warningText) {
        const w = el("div", "result-body", TEXT.warningText);
        w.style.cssText = "background:var(--warn-bg);color:var(--warn-fg);padding:15px;border-radius:12px;margin-bottom:20px;font-size:1rem";
        resultActions.appendChild(w);
      }

      const list = messengerList();
      if (list.length || LINKS.phone) {
        const block = el("div", "action-block");
        block.appendChild(el("div", "action-title", TEXT.btnWriteTitle || "Написать мне"));
        if (TEXT.btnWriteHint) block.appendChild(el("div", "action-hint", TEXT.btnWriteHint));
        list.forEach(function (b) { block.appendChild(makeBtn(b.label, b.href, b.style, b.bg, b.shadow)); });
        if (LINKS.phone) {
          block.appendChild(makeBtn(TEXT.btnCall || "Позвонить мне", LINKS.phone, "secondary"));
          if (TEXT.callNote) {
            const cn = el("div", "action-hint", TEXT.callNote);
            cn.style.cssText = "margin-top:10px;margin-bottom:0;font-size:0.85rem";
            block.appendChild(cn);
          }
        }
        resultActions.appendChild(block);
      }

      if (TEXT.methodTitle && LINKS.landing) {
        const m = el("div", "action-block");
        m.appendChild(el("div", "action-title", TEXT.methodTitle));
        m.appendChild(makeBtn(TEXT.methodBtn || "Подробнее", LINKS.landing, "secondary"));
        resultActions.appendChild(m);
      }

      resultHint.textContent = TEXT.hint || "";

    } else {
      resultIcon.textContent = "⚠️";
      resultTitle.textContent = TEXT.doctorTitle || "";
      verdictEl.textContent = TEXT.doctorVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.doctorBody || ""));
      resultHint.textContent = TEXT.hint || "";
    }

    showScreen("result");
  }

  $("#btn-start").addEventListener("click", function () {
    currentIndex = 0;
    answers = new Array(TOTAL).fill(null);
    chosenProfile = "general";
    renderQuestion();
    showScreen("question");
  });

  $("#btn-restart").addEventListener("click", function () {
    currentIndex = 0;
    answers = new Array(TOTAL).fill(null);
    chosenProfile = "general";
    showScreen("start");
  });

  if (btnBack) btnBack.addEventListener("click", goBack);

  const closeBtn = $("#btn-close");
  if (closeBtn) closeBtn.addEventListener("click", function () {
    answers = new Array(TOTAL).fill(null);
    showScreen("start");
    if (canUseOpenLink && typeof webApp.close === "function") {
      try { webApp.close(); } catch (_) {}
    }
  });

  const appRoot = $("#app");
  if (appRoot) appRoot.removeAttribute("hidden");
})();
