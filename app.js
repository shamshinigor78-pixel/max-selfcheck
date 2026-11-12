"use strict";
(function () {
  let C = window.CONTENT;
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('preview') === 'true') {
    const pd = localStorage.getItem('previewData');
    if (pd) { try { C = JSON.parse(pd); } catch(e) {} }
  }
  if (!C) { document.body.innerHTML = '<p style="padding:24px;text-align:center;">Ошибка: content.js не загрузился.</p>'; return; }

  const webApp = window.WebApp || null;
  const canUseOpenLink = !!(webApp && typeof webApp.openLink === "function" && typeof webApp.initData === "string" && webApp.initData.length > 0);
  if (canUseOpenLink && typeof webApp.ready === "function") { try { webApp.ready(); } catch (_) {} }

  const LINKS = C.links || {}, TEXT = C.app || {}, SETTINGS = C.settings || {};
  const QUESTIONS = (Array.isArray(C.questions) ? C.questions : []).map(normalizeQuestion);
  const TOTAL = QUESTIONS.length;
  const THRESHOLD = typeof SETTINGS.osteoThreshold === "number" ? SETTINGS.osteoThreshold : 30;

  if (!TOTAL) { document.body.innerHTML = '<p style="padding:24px;text-align:center;">Тест не настроен.</p>'; return; }

  let currentIndex = 0, answers = new Array(TOTAL).fill(null), locked = false, chosenProfile = "general", forceOsteo = false;

  function normalizeQuestion(q) {
    const opts = Array.isArray(q.options) ? q.options : [];
    return {
      type: q.type || "osteo", text: q.text || "",
      options: opts.map(function (o) {
        if (typeof o === "string") return { text: o, weight: 3, profile: null, redflag: false, forceOutcome: null };
        return { 
          text: o.text || "", 
          weight: typeof o.weight === "number" ? o.weight : 3, 
          profile: o.profile || null, 
          redflag: !!o.redflag, 
          forceOutcome: o.forceOutcome || null 
        };
      })
    };
  }

  function $(s) { return document.querySelector(s); }
  function el(tag, cls, txt) { const n = document.createElement(tag); if (cls) n.className = cls; if (txt !== undefined) n.textContent = String(txt); return n; }
  
  function applyTheme() {
    const theme = C.theme || {};
    document.documentElement.style.setProperty('--accent', theme.primary || '#4a8f6f');
    document.documentElement.style.setProperty('--tg', theme.tg || '#229ED9');
    document.documentElement.style.setProperty('--wa', theme.wa || '#25D366');
    if (theme.preset) document.body.classList.add('preset-' + theme.preset);
  }

  function openExternal(url) {
    if (!url) return;
    if (canUseOpenLink) { try { webApp.openLink(url); return; } catch (_) {} }
    if (/^tel:|^mailto:/.test(url)) { window.location.href = url; return; }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const screens = { start: $("#screen-start"), question: $("#screen-question"), result: $("#screen-result") };
  const qCurrent = $("#q-current"), qTotal = $("#q-total"), qText = $("#q-text"), answersBox = $("#answers");
  const resultIcon = $("#result-icon"), resultTitle = $("#result-title"), verdictEl = $("#verdict"), resultActions = $("#result-actions"), resultHint = $("#result-hint");
  const btnBack = $("#btn-back"), progressBar = $("#progress-bar"), progressWrap = $("#progress-wrap");

  qTotal.textContent = String(TOTAL);
  $("#ui-start-title").textContent = TEXT.title || "";
  $("#ui-start-subtitle").textContent = TEXT.subtitle || "";
  $("#ui-start-hint").textContent = TEXT.hint || "";
  $("#btn-start").textContent = TEXT.btnStart || "Начать";
  $("#btn-restart").textContent = TEXT.btnRestart || "Пройти заново";
  $("#btn-close").textContent = TEXT.btnClose || "Закрыть";

  if (TEXT.privacyList && Array.isArray(TEXT.privacyList)) {
    const ul = document.querySelector(".privacy-note ul");
    if (ul) {
      ul.innerHTML = "";
      TEXT.privacyList.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    }
  }

  const browserNote = $("#ui-browser-note");
  if (browserNote && TEXT.browserNote && !canUseOpenLink) {
    browserNote.textContent = TEXT.browserNote;
    browserNote.hidden = false;
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
    if (progressWrap) progressWrap.setAttribute("aria-valuenow", String(Math.round((currentIndex / TOTAL) * 100)));
    
    if (btnBack) {
      btnBack.textContent = TEXT.btnBack || "← Назад";
      btnBack.hidden = false;
    }

    answersBox.textContent = "";
    q.options.forEach((opt, i) => {
      const btn = el("button", "btn answer", opt.text);
      btn.type = "button";
      if (answers[currentIndex] === i) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        btn.classList.add("pressed", "selected");
        setTimeout(() => {
          answers[currentIndex] = i;
          if (opt.profile) chosenProfile = opt.profile;
          if (opt.forceOutcome === "osteo") forceOsteo = true;

          setTimeout(() => {
            if (currentIndex < TOTAL - 1) { currentIndex++; renderQuestion(); }
            else { showResult(); }
            locked = false;
          }, 50);
        }, 150);
      });
      answersBox.appendChild(btn);
    });
  }

  function goBack() { if (currentIndex > 0) { currentIndex--; renderQuestion(); } else { showScreen("start"); } }
  if (btnBack) btnBack.addEventListener("click", goBack);

  function evaluate() {
    let redFlagCount = 0, sum = 0, max = 0, hasPain = false;
    QUESTIONS.forEach((q, i) => {
      const idx = answers[i]; if (idx === null) return;
      const opt = q.options[idx]; if (!opt) return;
      if (q.type === "redflag") { if (opt.redflag) redFlagCount++; return; }
      
      sum += opt.weight;
      max += Math.max(...q.options.map(o => o.weight));
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
    if (bg) { a.style.background = bg; a.style.color = "#fff"; }
    a.addEventListener("click", (e) => {
      if (canUseOpenLink && href) e.preventDefault();
      a.classList.add("pressed");
      setTimeout(() => { if (canUseOpenLink && href) openExternal(href); }, 150);
    });
    return a;
  }

  function showResult() {
    const r = evaluate();
    resultActions.textContent = ""; resultIcon.textContent = ""; resultTitle.textContent = ""; verdictEl.textContent = ""; resultHint.textContent = "";

    if (r.outcome === "normal") {
      resultIcon.textContent = "✅"; resultTitle.textContent = TEXT.normalTitle || "Лёгкий дисбаланс"; verdictEl.textContent = TEXT.normalVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.normalBody || ""));
    } else if (r.outcome === "osteo") {
      resultIcon.textContent = "🌿"; resultTitle.textContent = TEXT.osteoTitle || "Есть зоны напряжения"; verdictEl.textContent = TEXT.osteoVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.osteoBody || ""));

      const prize = el("div", "result-body");
      prize.style.cssText = "background:var(--accent-soft);padding:20px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--accent)";
      const pt = el("div", "action-title", "🎁 " + (TEXT.prizeTitle || "Твой персональный разбор")); pt.style.color = "var(--accent)"; pt.style.marginBottom = "10px";
      prize.appendChild(pt);
      const map = TEXT.profiles || {};
      const pb = el("div", "", map[chosenProfile] || map.general || ""); pb.style.fontSize = "1rem";
      prize.appendChild(pb); resultActions.appendChild(prize);

      if (TEXT.guideBox) {
        const gb = el("div", "result-body", TEXT.guideBox);
        gb.style.cssText = "background:var(--guide-bg);color:var(--guide-fg);padding:15px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--guide-border);font-size:1rem";
        resultActions.appendChild(gb);
      }

      const list = [];
      if (LINKS.max) list.push({ label: TEXT.btnWriteMax || "MAX", href: LINKS.max, style: "primary" });
      if (LINKS.tg) list.push({ label: TEXT.btnWriteTg || "Telegram", href: LINKS.tg, style: "tg" });
      if (LINKS.wa) list.push({ label: TEXT.btnWriteWa || "WhatsApp", href: LINKS.wa, style: "wa" });

      if (list.length || LINKS.phone) {
        const block = el("div", "action-block");
        block.appendChild(el("div", "action-title", TEXT.btnWriteTitle || "Написать мне"));
        list.forEach(b => block.appendChild(makeBtn(b.label, b.href, b.style)));
        if (LINKS.phone) {
          block.appendChild(makeBtn(TEXT.btnCall || "Позвонить", LINKS.phone, "secondary"));
          if (TEXT.callNote) {
            const cn = el("div", "action-hint", TEXT.callNote);
            cn.style.cssText = "margin-top:10px;margin-bottom:0;font-size:0.85rem";
            block.appendChild(cn);
          }
        }
        resultActions.appendChild(block);
      }
    } else {
      resultIcon.textContent = "⚠️"; resultTitle.textContent = TEXT.doctorTitle || "Нужен врач"; verdictEl.textContent = TEXT.doctorVerdict || "";
      resultActions.appendChild(el("div", "result-body", TEXT.doctorBody || ""));
    }

    if (LINKS.landing) {
      const m = el("div", "action-block");
      m.appendChild(el("div", "action-title", TEXT.methodTitle || "Узнать о методике"));
      m.appendChild(makeBtn(TEXT.methodBtn || "Подробнее", LINKS.landing, "secondary"));
      resultActions.appendChild(m);
    }

    resultHint.textContent = TEXT.hint || "";
    showScreen("result");
  }

  $("#btn-start").addEventListener("click", () => { currentIndex = 0; answers.fill(null); chosenProfile = "general"; forceOsteo = false; renderQuestion(); showScreen("question"); });
  $("#btn-restart").addEventListener("click", () => { currentIndex = 0; answers.fill(null); chosenProfile = "general"; forceOsteo = false; showScreen("start"); });
  
  const closeBtn = $("#btn-close");
  if (closeBtn) closeBtn.addEventListener("click", () => { 
    answers.fill(null); showScreen("start"); 
    if (canUseOpenLink && webApp.close) webApp.close(); 
    else $("#app").hidden = true;
  });

  applyTheme();
  const appRoot = $("#app"); if (appRoot) appRoot.hidden = false;
})();
