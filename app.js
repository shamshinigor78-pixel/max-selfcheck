"use strict";
(function () {
  const C = window.CONTENT;
  if (!C) { document.body.innerHTML = '<p style="padding:24px;text-align:center;">Ошибка: content.js не загрузился.</p>'; return; }

  const webApp = window.WebApp || null;
  const canUseOpenLink = !!(webApp && typeof webApp.openLink === "function" && typeof webApp.initData === "string" && webApp.initData.length > 0);
  if (canUseOpenLink && typeof webApp.ready === "function") { try { webApp.ready(); } catch (_) {} }

  let userName = "";
  if (canUseOpenLink && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
    const raw = webApp.initDataUnsafe.user.first_name;
    if (typeof raw === "string" && raw.length <= 64) userName = raw;
  }

  const LINKS = C.links || {}, TEXT = C.app || {}, SETTINGS = C.settings || {};
  const QUESTIONS = (Array.isArray(C.questions) ? C.questions : []).map(normalizeQuestion);
  const TOTAL = QUESTIONS.length;
  const THRESHOLD = typeof SETTINGS.osteoThreshold === "number" ? SETTINGS.osteoThreshold : 30;

  if (!TOTAL) { document.body.innerHTML = '<p style="padding:24px;text-align:center;">Тест не настроен.</p>'; return; }

  let currentIndex = 0, answers = new Array(TOTAL).fill(null), locked = false, chosenProfile = "general", forceOsteo = false;

  function normalizeQuestion(q) {
    const opts = Array.isArray(q.options) ? q.options : [];
    return {
      type: q.type || "osteo", includeInScore: q.includeInScore !== false, text: q.text || "",
      options: opts.map(function (o) {
        if (typeof o === "string") return { text: o, weight: 3, profile: null, redflag: false, forceOutcome: null };
        return { text: o.text || "", weight: typeof o.weight === "number" ? o.weight : 3, profile: o.profile || null, redflag: !!o.redflag, forceOutcome: o.forceOutcome || null };
      })
    };
  }

  function $(s) { return document.querySelector(s); }
  function el(tag, cls, txt) { const n = document.createElement(tag); if (cls) n.className = cls; if (txt !== undefined) n.textContent = String(txt); return n; }
  function openExternal(url) { if (!url) return; if (canUseOpenLink) { try { webApp.openLink(url); return; } catch (_) {} } if (/^tel:|^mailto:/.test(url)) { window.location.href = url; return; } window.open(url, "_blank", "noopener,noreferrer"); }

  const screens = { start: $("#screen-start"), question: $("#screen-question"), result: $("#screen-result") };
  const progressWrap = $("#progress-wrap"), progressBar = $("#progress-bar");
  const qCurrent = $("#q-current"), qTotal = $("#q-total"), qText = $("#q-text"), answersBox = $("#answers");
  const resultIcon = $("#result-icon"), resultTitle = $("#result-title"), verdictEl = $("#verdict"), resultActions = $("#result-actions"), resultHint = $("#result-hint");
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
    TEXT.privacyList.forEach(item => { const li = document.createElement("li"); li.textContent = item; privacyUl.appendChild(li); });
  }

  function showScreen(name) {
    Object.keys(screens).forEach(k => { if (screens[k]) screens[k].classList.remove("active"); });
    if (screens[name]) screens[name].classList.add("active");
    try { window.scrollTo(0, 0); } catch (_) {}
  }

  function renderQuestion() {
    const q = QUESTIONS[currentIndex];
    qCurrent.textContent = String(currentIndex + 1);
    qText.textContent = q.text;
    progressBar.style.width = Math.round((currentIndex / TOTAL) * 100) + "%";
    if (btnBack) { btnBack.textContent = TEXT.btnBack || "← Назад"; btnBack.style.display = "inline-flex"; }

    answersBox.textContent = "";
    q.options.forEach((opt, i) => {
      const btn = el("button", "answer", opt.text);
      btn.type = "button";
      if (answers[currentIndex] === i) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        if (navigator.vibrate) navigator.vibrate(10);
        selectAnswer(i);
      });
      answersBox.appendChild(btn);
    });
  }

  function selectAnswer(optionIndex) {
    if (locked) return;
    locked = true;
    answers[currentIndex] = optionIndex;
    const opt = QUESTIONS[currentIndex].options[optionIndex];
    
    if (opt.profile) chosenProfile = opt.profile;
    if (opt.forceOutcome === "osteo") forceOsteo = true;

    const buttons = answersBox.querySelectorAll(".answer");
    buttons.forEach(b => b.classList.remove("selected"));
    if (buttons[optionIndex]) buttons[optionIndex].classList.add("selected");

    setTimeout(() => {
      if (currentIndex < TOTAL - 1) { currentIndex++; renderQuestion(); }
      else { showResult(); }
      locked = false;
    }, 200);
  }

  function goBack() { if (currentIndex > 0) { currentIndex--; renderQuestion(); } else { showScreen("start"); } }

  function evaluate() {
    let redFlagCount = 0, sum = 0, max = 0, hasPain = false;

    QUESTIONS.forEach((q, i) => {
      const idx = answers[i]; if (idx === null) return;
      const opt = q.options[idx]; if (!opt) return;
      
      if (q.type === "redflag") {
        if (opt.redflag) redFlagCount++;
        return;
      }
      if (q.includeInScore) {
        sum += opt.weight;
        max += Math.max(...q.options.map(o => o.weight));
      }
      if (opt.weight > 1) hasPain = true; 
    });

    const percent = max > 0 ? Math.round((sum / max) * 100) : 0;
    
    if (redFlagCount >= 1) return { outcome: "doctor" }; 
    if (forceOsteo || percent >= THRESHOLD || hasPain) return { outcome: "osteo", warning: false, percent: percent };
    return { outcome: "normal", percent: percent };
  }

  function makeBtn(label, href, style, bg, shadow) {
    const a = el("a", "btn " + (style || "secondary"), label);
    a.href = href || "#"; a.rel = "noopener noreferrer";
    if (!/^tel:|^mailto:/.test(a.href)) a.target = "_blank";
    if (bg) { a.style.background = bg; a.style.color = "#fff"; a.style.boxShadow = "0 4px 0 " + (shadow || "#000"); }
    a.addEventListener("click", (e) => { if (canUseOpenLink && href) { e.preventDefault(); openExternal(href); } if (navigator.vibrate) navigator.vibrate(10); });
    return a;
  }

  function showResult() {
    const r = evaluate();
    resultActions.textContent = ""; resultIcon.textContent = ""; resultTitle.textContent = ""; verdictEl.textContent = ""; resultHint.textContent = "";

    if (r.outcome === "normal") {
      resultIcon.textContent = "✅"; resultTitle.textContent = TEXT.normalTitle || ""; verdictEl.textContent = TEXT.normalVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.normalBody || ""));
      
      if (TEXT.methodTitle && LINKS.landing) {
        const m = el("div", "action-block");
        m.appendChild(el("div", "action-title", TEXT.methodTitle));
        m.appendChild(makeBtn(TEXT.methodBtn || "Подробнее", LINKS.landing, "secondary"));
        resultActions.appendChild(m);
      }
      resultHint.textContent = TEXT.hint || "";

    } else if (r.outcome === "osteo") {
      resultIcon.textContent = "🌿"; resultTitle.textContent = TEXT.osteoTitle || ""; verdictEl.textContent = TEXT.osteoVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.osteoBody || ""));

      const prize = el("div", "result-body");
      prize.style.cssText = "background:var(--accent-soft);padding:20px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--accent)";
      const pt = el("div", "action-title", "🎁 " + (TEXT.prizeTitle || "Твой персональный разбор")); pt.style.color = "var(--accent)"; pt.style.marginBottom = "10px";
      prize.appendChild(pt);
      const pb = el("div", "", (TEXT.profiles && TEXT.profiles[chosenProfile]) || TEXT.profiles.general || ""); pb.style.fontSize = "1rem";
      prize.appendChild(pb); resultActions.appendChild(prize);

      if (TEXT.guideBox) {
        const gb = el("div", "result-body", TEXT.guideBox);
        gb.style.cssText = "background:var(--guide-bg);color:var(--guide-fg);padding:15px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--guide-border);font-size:1rem";
        resultActions.appendChild(gb);
      }

      const list = [];
      if (LINKS.max) list.push({ label: TEXT.btnWriteMax || "Написать в MAX", href: LINKS.max, style: "primary" });
      if (LINKS.tg) list.push({ label: TEXT.btnWriteTg || "Написать в Telegram", href: LINKS.tg, style: "custom", bg: "#229ED9", shadow: "#1A7CA8" });
      if (LINKS.wa) list.push({ label: TEXT.btnWriteWa || "Написать в WhatsApp", href: LINKS.wa, style: "custom", bg: "#25D366", shadow: "#128C7E" });

      if (list.length || LINKS.phone) {
        const block = el("div", "action-block");
        block.appendChild(el("div", "action-title", TEXT.btnWriteTitle || "Написать мне"));
        if (TEXT.btnWriteHint) block.appendChild(el("div", "action-hint", TEXT.btnWriteHint));
        list.forEach(b => block.appendChild(makeBtn(b.label, b.href, b.style, b.bg, b.shadow)));
        if (LINKS.phone) {
          block.appendChild(makeBtn(TEXT.btnCall || "Позвонить мне", LINKS.phone, "secondary"));
          if (TEXT.callNote) { const cn = el("div", "action-hint", TEXT.callNote); cn.style.cssText = "margin-top:10px;margin-bottom:0;font-size:0.85rem"; block.appendChild(cn); }
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
      resultIcon.textContent = "⚠️"; resultTitle.textContent = TEXT.doctorTitle || ""; verdictEl.textContent = TEXT.doctorVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.doctorBody || ""));
      resultHint.textContent = TEXT.hint || "";
    }
    showScreen("result");
  }

  $("#btn-start").addEventListener("click", () => { currentIndex = 0; answers.fill(null); chosenProfile = "general"; forceOsteo = false; renderQuestion(); showScreen("question"); });
  $("#btn-restart").addEventListener("click", () => { currentIndex = 0; answers.fill(null); chosenProfile = "general"; forceOsteo = false; showScreen("start"); });
  if (btnBack) btnBack.addEventListener("click", goBack);
  
  const closeBtn = $("#btn-close");
  if (closeBtn) closeBtn.addEventListener("click", () => { answers.fill(null); showScreen("start"); if (canUseOpenLink && webApp.close) webApp.close(); });

  const appRoot = $("#app"); if (appRoot) appRoot.removeAttribute("hidden");
})();
