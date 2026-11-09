"use strict";
(function () {
  const w = window.WebApp || null;
  const isMax = w !== null;
  if (w && typeof w.ready === "function") { try { w.ready(); } catch (_) {} }

  const C = CONTENT, L = C.links, A = C.app, S = C.settings, T = C.theme || {};
  
  if (T.primary) {
    document.documentElement.style.setProperty('--accent', T.primary);
    document.documentElement.style.setProperty('--accent-soft', T.primary + '20');
  }

  let userName = "";
  if (w && w.initDataUnsafe && w.initDataUnsafe.user) {
    const n = w.initDataUnsafe.user.first_name;
    if (typeof n === "string" && n.length <= 64) userName = n;
  }

  const $ = (s) => document.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };

  document.getElementById("ui-start-title").textContent = A.title;
  document.getElementById("ui-start-hint").textContent = A.hint;
  document.getElementById("btn-start").textContent = A.btnStart;
  document.getElementById("btn-restart").textContent = A.btnRestart;
  document.getElementById("btn-close").textContent = A.btnClose;

  const pl = document.getElementById("privacy-list");
  if (pl) {
    pl.innerHTML = "";
    A.privacyList.forEach(t => { const li = document.createElement("li"); li.textContent = t; pl.appendChild(li); });
  }

  if (!isMax) {
    document.getElementById("btn-close").style.display = "none";
    const bn = document.getElementById("ui-browser-note");
    bn.textContent = A.browserNote;
    bn.style.display = "block";
  }

  const Q = C.questions.map((q, i) => {
    let w = q.weights;
    if (q.type === "osteo" && q.options.length !== w.length) {
      w = q.options.map((_, idx) => q.weights[idx] !== undefined ? q.weights[idx] : 3);
    } else if (q.type === "redflag") {
      w = [1, 5];
    }
    return { type: q.type, profile: q.profile || "any", text: q.text, options: q.options, weights: w };
  });

  const TOTAL = Q.length;
  let idx = 0, ans = new Array(TOTAL).fill(null), lock = false, prof = "general";

  const scr = { start: $("#screen-start"), question: $("#screen-question"), result: $("#screen-result") };
  const pWrap = $("#progress-wrap"), pBar = $("#progress-bar"), qCur = $("#q-current"), qTot = $("#q-total");
  const qTxt = $("#q-text"), ansBox = $("#answers"), resIcon = $("#result-icon"), resTitle = $("#result-title");
  const verd = $("#verdict"), resAct = $("#result-actions"), resHint = $("#result-hint");

  qTot.textContent = TOTAL;

  const showScr = (n) => {
    Object.keys(scr).forEach(k => scr[k].classList.remove("active"));
    scr[n].classList.add("active");
    window.scrollTo(0, 0);
  };

  const renderQ = () => {
    const q = Q[idx];
    qCur.textContent = idx + 1;
    qTxt.textContent = q.text;
    pBar.style.width = Math.round((idx / TOTAL) * 100) + "%";
    if (pWrap) pWrap.setAttribute("aria-valuenow", Math.round((idx / TOTAL) * 100));
    
    ansBox.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = el("button", "answer", opt);
      btn.type = "button";
      if (ans[idx] === i) btn.classList.add("selected");
      btn.onclick = () => {
        if (navigator.vibrate) navigator.vibrate(10);
        selectAns(i);
      };
      ansBox.appendChild(btn);
    });
  };

  const selectAns = (i) => {
    if (lock) return;
    lock = true;
    if (typeof i !== "number" || i < 0 || i >= Q[idx].options.length) { lock = false; return; }
    
    ans[idx] = i;
    if (idx === 0) {
      if (i === 0) prof = "neck";
      else if (i === 1) prof = "lower_back";
      else if (i === 3) prof = "pelvis";
      else prof = "general";
    }
    if (Q[idx].profile === "scar" && i >= 2) {
      if (prof === "general" || prof === "neck" || prof === "lower_back") prof = "scar";
    }

    const btns = ansBox.querySelectorAll(".answer");
    btns.forEach(b => b.classList.remove("selected"));
    if (btns[i]) btns[i].classList.add("selected");

    setTimeout(() => {
      if (idx < TOTAL - 1) { idx++; renderQ(); } else { showRes(); }
      lock = false;
    }, 180);
  };

  const evalRes = () => {
    let rf = 0, sum = 0, max = 0;
    Q.forEach((q, i) => {
      const a = ans[i], s = (typeof a === "number" && a >= 0 && a < q.options.length) ? a : 0;
      if (q.type === "redflag") { if (s > 0) rf++; }
      else if (q.type === "osteo" && i > 0) { sum += q.weights[s]; max += Math.max(...q.weights); }
    });
    const p = max > 0 ? Math.round((sum / max) * 100) : 0;
    if (rf >= 2) return { out: "doc" };
    if (rf === 1) return { out: "osteo", p, warn: true };
    if (p >= S.osteoThreshold) return { out: "osteo", p, warn: false };
    return { out: "norm", p };
  };

  const mkBtn = (txt, href, type, bg, sh) => {
    const a = el("a", "btn " + (type || "secondary"), txt);
    a.href = href;
    a.target = "_blank";
    if (bg) {
      a.style.background = bg;
      a.style.color = "#fff";
      a.style.boxShadow = "0 4px 0 " + (sh || "#000");
      a.classList.remove("btn-secondary");
    }
    a.onclick = () => { if (navigator.vibrate) navigator.vibrate(10); };
    return a;
  };

  const getProfTxt = (p) => {
    if (p === "neck") return "Твой профиль: «Офисная шея». Судя по ответам, твое тело застряло в режиме работы за компьютером. Голова уходит вперед, а фасции шеи и груди сжимаются. Наша задача — мягко раскрыть грудную клетку и вернуть шее свободу.";
    if (p === "lower_back") return "Твой профиль: «Зажатая поясница». Твои ответы указывают на напряжение в нижней части спины. Это может быть связано с долгим сидением или компенсацией после нагрузок. Работа с фасциями таза и ног поможет снять эту нагрузку.";
    if (p === "pelvis") return "Твой профиль: «Перекос таза». Тело подает сигналы о том, что ось сместилась. Из-за этого одна сторона тела работает больше, отнимая энергию. Остеокоррекция помогает вернуть тазу баланс и симметрию.";
    if (p === "scar") return "Твой профиль: «Скрытые спайки». Ты отметил наличие рубцов или операций. Рубец — это плотная ткань, которая может стягивать фасции, вызывая перекосы. Мы можем бережно проработать эти натяжения, чтобы тело снова двигалось свободно.";
    return "Твой профиль: «Внутренний марафон». Твоя нервная система долго находится в напряжении. Мышцы и фасции зажаты, как пружина. Наша задача — перевести тело в режим глубокого покоя.";
  };

  const showRes = () => {
    const r = evalRes();
    resAct.innerHTML = ""; resIcon.textContent = ""; resTitle.textContent = ""; verd.textContent = ""; resHint.textContent = "";

    if (r.out === "norm") {
      resIcon.textContent = "✅"; resTitle.textContent = A.normalTitle; verd.textContent = A.normalVerdict;
      resAct.appendChild(el("div", "result-body", A.normalBody));
      resHint.textContent = "Это не медицинская диагностика. Сделайте скриншот, если хотите сохранить результат.";
    } else if (r.out === "osteo") {
      resIcon.textContent = "🌿"; resTitle.textContent = A.osteoTitle; verd.textContent = A.osteoVerdict;
      resAct.appendChild(el("div", "result-body", A.osteoBody));

      const pBox = el("div", "result-body");
      pBox.style.cssText = "background:var(--accent-soft);padding:20px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--accent)";
      const pTitle = el("div", "action-title", "🎁 Твой персональный разбор");
      pTitle.style.cssText = "color:var(--accent);margin-bottom:10px";
      const pTxt = el("div", "", getProfTxt(prof));
      pTxt.style.fontSize = "0.95rem";
      pBox.appendChild(pTitle); pBox.appendChild(pTxt); resAct.appendChild(pBox);

      const gBox = el("div", "result-body");
      gBox.style.cssText = "background:var(--guide-bg);color:var(--guide-fg);padding:15px;border-radius:12px;margin-bottom:20px;border-left:4px solid var(--guide-border);font-size:0.9rem";
      gBox.textContent = "🎁 Если хотите получить персональный гайд по экспресс-разгрузке именно вашей зоны напряжения — напишите мне в удобный мессенджер и пришлите скриншот этого результата. Отправлю методику бесплатно.";
      resAct.appendChild(gBox);

      if (r.warn) {
        const wBox = el("div", "result-body");
        wBox.style.cssText = "background:var(--warn-bg);color:var(--warn-fg);padding:15px;border-radius:12px;margin-bottom:20px;font-size:0.9rem";
        wBox.textContent = "Вы отметили один симптом, требующий наблюдения. Рекомендую перед сеансом проконсультироваться с врачом.";
        resAct.appendChild(wBox);
      }

      const aBlock = el("div", "action-block");
      aBlock.appendChild(el("div", "action-title", A.btnWriteTitle));
      
      if (!isMax || S.showAllMessengersInsideMax) {
        aBlock.appendChild(el("div", "action-hint", A.btnWriteHint));
        if (C.messengerButtons && C.messengerButtons.length > 0) {
          C.messengerButtons.forEach(b => {
            let lnk = b.link;
            if (lnk === "https://t.me/ТВОЙ_НИК") lnk = L.tg;
            if (lnk === "https://wa.me/79951149954") lnk = L.wa;
            if (lnk === "https://max.ru/se14074027_bot") lnk = L.max;
            let bg = b.type === 'tg' ? T.tg : (b.type === 'wa' ? T.wa : (b.type === 'primary' ? T.primary : null));
            aBlock.appendChild(mkBtn(b.text, lnk, b.type, bg, bg ? bg.replace('#','#00') : null));
          });
        }
      } else {
        aBlock.appendChild(mkBtn(A.btnWriteMax || "Написать в MAX", L.max, "primary"));
      }

      aBlock.appendChild(mkBtn(A.btnCall, L.phone, "secondary"));
      const cHint = el("div", "action-hint", A.callNote);
      cHint.style.cssText = "margin-top:10px;margin-bottom:0;font-size:0.75rem";
      aBlock.appendChild(cHint);
      resAct.appendChild(aBlock);

      const mBlock = el("div", "action-block");
      mBlock.appendChild(el("div", "action-title", A.methodTitle));
      // 🚀 ЗДЕСЬ ПЕРЕДАЕТСЯ ССЫЛКА ИЗ CONTENT.JS
      mBlock.appendChild(mkBtn(A.methodBtn, L.landing, "secondary"));
      resAct.appendChild(mBlock);
      
      resHint.textContent = "Это не медицинская диагностика. Приложение не ставит диагноз и не назначает лечение. Сделайте скриншот результата, если хотите его сохранить.";
    } else {
      resIcon.textContent = "⚠️"; resTitle.textContent = A.doctorTitle; verd.textContent = A.doctorVerdict;
      resAct.appendChild(el("div", "result-body", A.doctorBody));
      resHint.textContent = "Это не медицинская диагностика. Решение о лечении принимает врач. Сделайте скриншот результата, если хотите его сохранить.";
    }
    showScr("result");
  };

  $("#btn-start").onclick = () => { idx = 0; ans.fill(null); prof = "general"; renderQ(); showScr("question"); };
  $("#btn-restart").onclick = () => { idx = 0; ans.fill(null); showScr("start"); };
  $("#btn-close").onclick = () => {
    ans.fill(null); showScr("start");
    if (w && typeof w.close === "function") { try { w.close(); } catch (_) {} }
  };

  const app = $("#app");
  if (app) app.removeAttribute("hidden");
  const sub = $("#start-subtitle");
  if (sub) sub.textContent = userName ? "Привет, " + userName + "! " + A.subtitle : A.subtitle;
})();
