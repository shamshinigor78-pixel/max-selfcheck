(function() {
    "use strict";
    const C = window.CONTENT; if (!C) return;
    const wa = window.WebApp || null, canWa = !!(wa && typeof wa.openLink === "function" && typeof wa.initData === "string" && wa.initData.length > 0);
    if (canWa && typeof wa.ready === "function") { try { wa.ready(); } catch (_) {} }
    let uName = ""; if (canWa && wa.initDataUnsafe?.user?.first_name) uName = String(wa.initDataUnsafe.user.first_name).slice(0, 64);
    const utm = new URLSearchParams(window.location.search).get("utm_source"); if (utm) sessionStorage.setItem("site_utm", utm);
    const TEXT = C.app || {}, LINKS = C.links || {};
    const QUESTIONS = (Array.isArray(C.questions) ? C.questions : []).map(q => ({
      type: q.type || "osteo", includeInScore: q.includeInScore !== false, text: q.text || "",
      options: (Array.isArray(q.options) ? q.options : []).map(o => typeof o === "string" ? { text: o, weight: 3, profile: null, redflag: false, forceOutcome: null } : { text: o.text || "", weight: typeof o.weight === "number" ? o.weight : 3, profile: o.profile || null, redflag: !!o.redflag, forceOutcome: o.forceOutcome || null })
    }));
    const TOTAL = QUESTIONS.length, THRESHOLD = typeof C.settings?.osteoThreshold === "number" ? C.settings.osteoThreshold : 30;
    if (!TOTAL) { document.body.innerHTML = "<p style='padding:24px;text-align:center;'>В тесте 0 вопросов.</p>"; return; }
    let currentIndex = 0, answers = new Array(TOTAL).fill(null), locked = false;
    const $ = s => document.querySelector(s), el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = String(x); return n; };
    const screens = { start: $("#screen-start"), question: $("#screen-question"), result: $("#screen-result") };
    if (C.theme?.appStyle) document.body.classList.add("app-" + C.theme.appStyle);
    if (C.theme?.darkMode === "on") document.body.classList.add("theme-dark"); else if (C.theme?.darkMode === "auto") document.body.classList.add("theme-auto");
    if (C.theme?.primary) document.documentElement.style.setProperty("--accent", C.theme.primary);
    $("#q-total").textContent = String(TOTAL); $("#ui-start-title").textContent = TEXT.title || "Самодиагностика";
    $("#ui-start-subtitle").textContent = (uName ? "Привет, " + uName + "! " : "") + (TEXT.subtitle || "");
    const mins = Math.max(1, Math.round(TOTAL * 0.15)); if ($("#ui-start-badge")) $("#ui-start-badge").textContent = "⏱ ~" + mins + " мин • " + TOTAL + " вопросов";
    const defaultPriv = ["Ваши ответы нигде не сохраняются и не передаются третьим лицам.", "Результат носит информационный характер и не заменяет консультацию врача."];
    const rawPriv = Array.isArray(TEXT.privacyList) && TEXT.privacyList.length ? TEXT.privacyList : (String(TEXT.privacyList || TEXT.privacyText || "").trim() ? String(TEXT.privacyList || TEXT.privacyText).split("\n").map(x => x.trim()).filter(Boolean) : defaultPriv);
    if (rawPriv.length && $("#ui-privacy-box")) {
      const pb = $("#ui-privacy-box"); pb.hidden = false; const ul = pb.querySelector("ul"); ul.innerHTML = "";
      rawPriv.forEach(t => { const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
    }
    $("#btn-start").textContent = TEXT.btnStart || "Начать"; $("#btn-back").textContent = TEXT.btnBack || "← Назад"; $("#btn-restart").textContent = TEXT.btnRestart || "Пройти заново";
    if ($("#ui-start-hint")) $("#ui-start-hint").textContent = TEXT.hint || "";
    function showScreen(n) { Object.keys(screens).forEach(k => { if (screens[k]) screens[k].classList.remove("active"); }); if (screens[n]) screens[n].classList.add("active"); window.scrollTo(0, 0); }
    function renderQuestion() {
      const q = QUESTIONS[currentIndex]; $("#q-current").textContent = String(currentIndex + 1); $("#q-text").textContent = q.text;
      $("#progress-bar").style.width = Math.round((currentIndex / TOTAL) * 100) + "%";
      const box = $("#answers"); box.textContent = "";
      q.options.forEach((opt, i) => {
        const b = el("button", "btn answer" + (answers[currentIndex] === i ? " selected" : ""), opt.text); b.type = "button";
        b.onclick = () => { if (locked) return; locked = true; answers[currentIndex] = i; setTimeout(() => { if (currentIndex < TOTAL - 1) { currentIndex++; renderQuestion(); } else { showResult(); } locked = false; }, 150); };
        box.appendChild(b);
      });
    }
    function evaluate() {
      let rf = 0, sum = 0, max = 0, fo = false, ps = {}, primaryProf = null;
      QUESTIONS.forEach((q, i) => {
        const idx = answers[i]; if (idx === null) return; const opt = q.options[idx]; if (!opt) return;
        if (q.type === "redflag") { if (opt.redflag) rf++; return; }
        if (opt.forceOutcome === "osteo") fo = true;
        if (!q.includeInScore) { if (opt.profile) primaryProf = opt.profile; return; }
        sum += opt.weight; max += Math.max(...q.options.map(o => o.weight));
        if (opt.profile) ps[opt.profile] = (ps[opt.profile] || 0) + opt.weight;
      });
      let tp = primaryProf || "general", ms = 0;
      Object.keys(ps).forEach(k => { if (ps[k] > ms) { ms = ps[k]; tp = k; } });
      const pct = max > 0 ? Math.round((sum / max) * 100) : 0;
      if (rf >= 1) return { outcome: "doctor", profile: tp, pct: 100 };
      if (fo || pct >= THRESHOLD) return { outcome: "osteo", profile: tp, pct };
      return { outcome: "normal", profile: tp, pct };
    }
    function addLinkBtn(p, lbl, href, bg) {
      if (!href) return; const a = el("a", "btn primary", lbl); a.href = href; a.target = "_blank"; a.rel = "noopener"; a.style.marginBottom = "10px";
      if (bg) a.style.background = bg;
      a.onclick = (e) => { if (canWa) { e.preventDefault(); try { wa.openLink(href); } catch (_) { window.open(href, "_blank"); } } };
      p.appendChild(a);
    }
    function showResult() {
      const r = evaluate(), ra = $("#result-actions"), isCheckup = TEXT.resultStyle === "checkup"; ra.textContent = "";
      const pKeys = Object.keys(TEXT.profiles || {}), pIdx = pKeys.indexOf(r.profile);
      const pNum = String(pIdx >= 0 ? pIdx + 1 : pKeys.length + 1).padStart(2, "0"), sid = pNum + "-" + Math.floor(10 + Math.random() * 89);
      let bodyTxt = "";
      if (r.outcome === "normal") { $("#result-icon").textContent = "✅"; $("#result-title").textContent = TEXT.normalTitle || "Отличный баланс!"; $("#verdict").textContent = TEXT.normalVerdict || "Серьёзных сигналов нет"; bodyTxt = TEXT.normalBody || ""; }
      else if (r.outcome === "osteo") { $("#result-icon").textContent = "🌿"; $("#result-title").textContent = TEXT.osteoTitle || "Есть зоны напряжения"; $("#verdict").textContent = TEXT.osteoVerdict || "Фасциальная система просит внимания"; bodyTxt = TEXT.osteoBody || ""; }
      else { $("#result-icon").textContent = "⚠️"; $("#result-title").textContent = TEXT.doctorTitle || "Сначала лучше показаться врачу"; $("#verdict").textContent = TEXT.doctorVerdict || "Отмечены острые симптомы"; bodyTxt = TEXT.doctorBody || ""; }
      if (r.outcome !== "doctor") {
        const topPill = el("div", "", "Персональная карта № " + sid);
        topPill.style.cssText = "align-self:center;margin:-4px auto 18px;padding:6px 16px;background:var(--card-bg);border:1px solid var(--border);color:var(--muted);border-radius:999px;font-size:0.82rem;font-weight:600;letter-spacing:0.03em;";
        ra.appendChild(topPill);
      }
      if (isCheckup && r.outcome !== "doctor") {
        const sc = el("div", "action-block"); const lvl = r.outcome === "osteo" ? "Умеренное / выраженное напряжение" : "Лёгкий фоновый тонус";
        sc.appendChild(el("div", "action-title", "📊 Уровень фасциальной нагрузки: " + lvl));
        const bar = el("div", "progress"); bar.style.height = "8px";
        const fill = el("div", "progress-bar"); fill.style.width = Math.max(18, r.pct) + "%"; fill.style.background = r.outcome === "osteo" ? "#d99b43" : "var(--accent)";
        bar.appendChild(fill); sc.appendChild(bar); ra.appendChild(sc);
      }
      if (isCheckup) { const c1 = el("div", "action-block"); c1.appendChild(el("div", "action-title", "🔍 Что показывают ответы")); c1.appendChild(el("p", "", bodyTxt)); ra.appendChild(c1); }
      else { ra.appendChild(el("div", "result-body", bodyTxt)); }
      const pt = TEXT.profiles && TEXT.profiles[r.profile];
      if (pt && r.outcome !== "doctor") {
        const b = el("div", "action-block"); b.style.borderLeft = "4px solid var(--accent)";
        b.appendChild(el("div", "action-title", isCheckup ? "🎯 Главная зона внимания" : ("🎁 " + (TEXT.prizeTitle || "Твой персональный разбор"))));
        b.appendChild(el("p", "", pt)); ra.appendChild(b);
      }
      if (TEXT.guideBox && r.outcome !== "doctor") {
        const gb = el("div", "action-block"); gb.style.cssText = "border:1.5px solid var(--accent);background:var(--accent-soft);";
        gb.appendChild(el("div", "action-title", "✨ Персональная рекомендация"));
        const gTxt = el("p", "", TEXT.guideBox); gTxt.style.marginBottom = "14px"; gb.appendChild(gTxt);
        const foot = el("div", ""); foot.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding-top:12px;border-top:1px solid rgba(0,0,0,0.08);";
        const numSpan = el("span", "", "Карта № " + sid); numSpan.style.cssText = "font-weight:700;font-size:0.92rem;color:var(--accent);";
        const cpBtn = el("button", "", "Скопировать номер"); cpBtn.type = "button";
        cpBtn.style.cssText = "background:var(--card-bg);color:var(--fg);border:1px solid var(--border);padding:6px 14px;border-radius:999px;font-size:0.82rem;font-weight:600;cursor:pointer;";
        cpBtn.onclick = () => { try { navigator.clipboard.writeText(sid); } catch (_) {} cpBtn.textContent = "✓ Скопировано"; setTimeout(() => { cpBtn.textContent = "Скопировать номер"; }, 2000); };
        foot.appendChild(numSpan); foot.appendChild(cpBtn); gb.appendChild(foot); ra.appendChild(gb);
      }
      const cb = el("div", "action-block"); cb.appendChild(el("div", "action-title", TEXT.btnWriteTitle || "Написать мне"));
      const src = sessionStorage.getItem("site_utm");
      const rawMsg = "Здравствуйте! Я прошёл(а) самодиагностику, номер моей карты: " + sid + " (" + $("#result-title").textContent + (src ? ", источник: " + src : "") + "). Прикрепляю скриншот!";
      const sh = encodeURIComponent(rawMsg);
      let tg = LINKS.tg || ""; if (C.settings?.tgBotUsername) tg = "https://t" + ".me/" + C.settings.tgBotUsername.replace(/^@/, "") + "?start=" + encodeURIComponent(sid);
      let waUrl = LINKS.wa || ""; if (waUrl && waUrl.includes("wa.me")) waUrl += (waUrl.includes("?") ? "&" : "?") + "text=" + sh;
      let maxUrl = LINKS.max || ""; const hasMaxBot = !!(C.settings?.maxBotUrl && C.settings.maxBotUrl.trim());
      if (hasMaxBot) { const mb = C.settings.maxBotUrl.trim(); maxUrl = mb + (mb.includes("?") ? "&" : "?") + "start=" + encodeURIComponent(sid); }
      if (maxUrl) {
        const mbx = el("a", "btn primary", TEXT.btnWriteMax || "Написать в MAX"); mbx.href = maxUrl; mbx.target = "_blank"; mbx.rel = "noopener"; mbx.style.marginBottom = "10px";
        if (C.theme?.primary) mbx.style.background = C.theme.primary;
        mbx.onclick = (e) => { if (!hasMaxBot) { try { navigator.clipboard.writeText(rawMsg); } catch (_) {} } if (canWa) { e.preventDefault(); try { wa.openLink(maxUrl); } catch (_) { window.open(maxUrl, "_blank"); } } };
        cb.appendChild(mbx);
      }
      addLinkBtn(cb, TEXT.btnWriteTg || "Написать в Telegram", tg, C.theme?.tg || "#229ED9");
      addLinkBtn(cb, TEXT.btnWriteWa || "Написать в WhatsApp", waUrl, C.theme?.wa || "#25D366");
      if (LINKS.phone) addLinkBtn(cb, TEXT.btnCall || "Позвонить", LINKS.phone.startsWith("tel:") ? LINKS.phone : "tel:" + LINKS.phone, "#555");
      if (TEXT.callNote) { const nt = el("p", "hint", TEXT.callNote); nt.style.marginTop = "8px"; cb.appendChild(nt); }
      ra.appendChild(cb);
      if (LINKS.landing) { const mb = el("div", "action-block"); mb.appendChild(el("div", "action-title", TEXT.methodTitle || "Узнать о методике")); addLinkBtn(mb, TEXT.methodBtn || "Подробнее на сайте", LINKS.landing, C.theme?.primary); ra.appendChild(mb); }
      showScreen("result");
    }
    $("#btn-start").onclick = () => { currentIndex = 0; answers.fill(null); renderQuestion(); showScreen("question"); };
    $("#btn-back").onclick = () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } else showScreen("start"); };
    $("#btn-restart").onclick = () => { currentIndex = 0; answers.fill(null); showScreen("start"); };
    const ar = $("#app"); if (ar) ar.hidden = false;
  })();