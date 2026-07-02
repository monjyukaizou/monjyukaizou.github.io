// かきとりんぐ: screen flow, session state, and DOM wiring.

(() => {
  const SESSION_LENGTH = 10;

  function contentMap(rows) {
    const m = new Map();
    rows.forEach((r) => m.set(r.char, r));
    return m;
  }

  const SETS = {
    hiragana: { label: "ひらがな", strokes: STROKES_HIRAGANA, content: contentMap(CONTENT_HIRAGANA), kanji: false },
    katakana: { label: "カタカナ", strokes: STROKES_KATAKANA, content: contentMap(CONTENT_KATAKANA), kanji: false },
    kanji: { label: "かんじ(1年生)", strokes: STROKES_KANJI_G1, content: contentMap(CONTENT_KANJI_G1), kanji: true },
  };
  Object.keys(SETS).forEach((k) => { SETS[k].chars = Object.keys(SETS[k].strokes); });

  const MASCOTS = {
    boy: { emoji: "🚀", encourage: ["なぞって かいてみよう!", "その ちょうし!", "かっこいい じ だね!"] },
    girl: { emoji: "🌸", encourage: ["なぞって かいてみよう!", "すてき!そのちょうし!", "とっても きれいな じ!"] },
  };

  let els = {};
  let selectedSet = "hiragana";
  let selectedMode = "practice";

  let currentSetKey = null;
  let currentMode = null;
  let currentChar = null;
  let currentRef = null;
  let currentStrokeIdx = 0;
  let strokeScores = [];
  let sessionCount = 0;
  let comboCount = 0;
  let hintUsed = false;

  let practiceCanvasApi = null;
  let testCanvasApi = null;

  function $(id) { return document.getElementById(id); }

  function cacheEls() {
    [
      "themePicker", "pickBoy", "pickGirl", "themeToggleBtn",
      "statStreak", "statCoins", "statQuest",
      "screenMenu", "screenPractice", "screenTest",
      "startBtn",
      "mascotEmoji", "mascotText", "practiceReading", "practiceEmoji", "practiceWord",
      "practiceCanvas", "practiceFeedback", "demoBtn", "redoStrokeBtn",
      "sessionBarPractice", "backToMenuFromPractice",
      "testMascotEmoji", "testMascotText", "testReading", "testEmoji", "testWord",
      "testCanvas", "hintBtn", "undoStrokeTestBtn", "clearTestBtn", "submitTestBtn",
      "sessionBarTest", "backToMenuFromTest",
      "resultOverlay", "resultTitle", "resultDetail", "resultContinueBtn",
      "questOverlay", "questContinueBtn",
      "sessionEndOverlay", "sessionEndTitle", "sessionEndDetail",
      "sessionEndContinueBtn", "sessionEndMenuBtn",
    ].forEach((id) => { els[id] = $(id); });
  }

  function applyTheme(theme) {
    document.body.classList.remove("theme-boy", "theme-girl");
    document.body.classList.add(theme === "girl" ? "theme-girl" : "theme-boy");
    const m = MASCOTS[theme] || MASCOTS.boy;
    els.mascotEmoji.textContent = m.emoji;
    els.testMascotEmoji.textContent = m.emoji;
  }

  function mascotSay(target) {
    const theme = KakitoriProgress.getTheme() || "boy";
    const m = MASCOTS[theme] || MASCOTS.boy;
    const text = m.encourage[Math.floor(Math.random() * m.encourage.length)];
    if (target === "practice") els.mascotText.textContent = text;
    else els.testMascotText.textContent = text;
  }

  function updateStatsBar() {
    const s = KakitoriProgress.getState();
    els.statStreak.textContent = s.streak.count;
    els.statCoins.textContent = s.coins;
    els.statQuest.textContent = `${s.dailyQuest.done}/${s.dailyQuest.goal}`;
  }

  function updateSetProgressLabels() {
    Object.keys(SETS).forEach((key) => {
      const el = document.querySelector(`[data-progress="${key}"]`);
      if (!el) return;
      const sum = KakitoriProgress.getMasterySummary(key, SETS[key].chars);
      el.textContent = `${sum.masteredCount}/${sum.total}`;
    });
  }

  function showScreen(name) {
    ["screenMenu", "screenPractice", "screenTest"].forEach((s) => {
      els[s].classList.toggle("hidden", s !== name);
    });
  }

  function readingLine(setKey, char) {
    const entry = SETS[setKey].content.get(char);
    if (!entry) return char;
    if (SETS[setKey].kanji) {
      const on = entry.on.length ? "音:" + entry.on.join("・") : "";
      const kun = entry.kun.length ? "訓:" + entry.kun.join("・") : "";
      return [char, [on, kun].filter(Boolean).join(" ")].join("  ");
    }
    return `${char}  (${entry.romaji})`;
  }

  function wordInfo(setKey, char) {
    const entry = SETS[setKey].content.get(char);
    if (!entry) return { word: "", gloss: "", emoji: "" };
    if (SETS[setKey].kanji) {
      const theme = KakitoriProgress.getTheme() || "boy";
      const w = theme === "girl" ? entry.wordGirl : entry.wordBoy;
      return { word: `${w.word}(${w.reading})`, gloss: w.gloss, emoji: "" };
    }
    return { word: entry.word, gloss: entry.gloss, emoji: entry.emoji };
  }

  function tierColor(tier) {
    return { great: "#6BCB77", good: "#4FA65A", ok: "#C79A00", retry: "#FF6B6B" }[tier] || "#4A4453";
  }

  // ---------- Practice mode ----------

  function startPracticeSession(setKey) {
    currentSetKey = setKey;
    currentMode = "practice";
    sessionCount = 0;
    comboCount = 0;
    showScreen("screenPractice");
    els.sessionBarPractice.style.width = "0%";
    if (!practiceCanvasApi) {
      practiceCanvasApi = KakitoriCanvas.create(els.practiceCanvas, { onStrokeComplete: handlePracticeStroke });
    }
    loadNextPracticeChar();
  }

  function loadNextPracticeChar(excludeChar) {
    if (sessionCount >= SESSION_LENGTH) { endSession(); return; }
    const chars = SETS[currentSetKey].chars;
    currentChar = KakitoriProgress.pickNextCharacter(currentSetKey, chars, excludeChar);
    currentRef = SETS[currentSetKey].strokes[currentChar].strokes;
    currentStrokeIdx = 0;
    strokeScores = [];
    practiceCanvasApi.setReference(currentRef);
    practiceCanvasApi.setGhost(true);
    practiceCanvasApi.showGuide(0);
    els.practiceReading.textContent = readingLine(currentSetKey, currentChar);
    const info = wordInfo(currentSetKey, currentChar);
    els.practiceEmoji.textContent = info.emoji;
    els.practiceWord.textContent = info.gloss ? `${info.word} — ${info.gloss}` : info.word;
    mascotSay("practice");
    hideFeedbackBadge();
  }

  function showFeedbackBadge(label, tip, comboText) {
    els.practiceFeedback.textContent = tip ? `${label.label} ${comboText || ""}` : `${label.label} ${comboText || ""}`;
    els.practiceFeedback.className = `feedback-badge tier-${label.tier}`;
    if (tip) {
      els.practiceFeedback.textContent = `${label.label}  ${tip}`;
    }
    clearTimeout(showFeedbackBadge._t);
    showFeedbackBadge._t = setTimeout(hideFeedbackBadge, 1400);
  }

  function hideFeedbackBadge() {
    els.practiceFeedback.classList.add("hidden");
  }

  function handlePracticeStroke(rawPts) {
    // Ignore stray input while a character is finishing up and the next one
    // hasn't loaded yet (there's a brief transition delay between the two).
    if (!currentRef || currentStrokeIdx >= currentRef.length) return;
    const ref = currentRef[currentStrokeIdx];
    const result = KakitoriScoring.compareStroke(rawPts, ref);
    const label = KakitoriScoring.scoreLabel(result.score);
    els.practiceFeedback.classList.remove("hidden");

    if (label.tier === "retry") {
      comboCount = 0;
      showFeedbackBadge(label, result.tip || "もういちど なぞってみよう");
      practiceCanvasApi.undo();
      return;
    }

    strokeScores.push(result.score);
    practiceCanvasApi.addConfirmedStroke(rawPts, tierColor(label.tier));
    if (label.tier === "great") comboCount += 1; else comboCount = 0;
    const comboText = comboCount >= 2 ? `🔥x${comboCount}` : "";
    showFeedbackBadge(label, result.tip, comboText);

    currentStrokeIdx++;
    if (currentStrokeIdx >= currentRef.length) {
      setTimeout(finishCurrentPracticeChar, 500);
    } else {
      practiceCanvasApi.showGuide(currentStrokeIdx);
    }
  }

  function finishCurrentPracticeChar() {
    const avg = strokeScores.length
      ? Math.round(strokeScores.reduce((a, b) => a + b, 0) / strokeScores.length)
      : 0;
    const res = KakitoriProgress.recordAttempt(currentSetKey, currentChar, avg);
    updateStatsBar();
    sessionCount++;
    els.sessionBarPractice.style.width = `${Math.min(100, (sessionCount / SESSION_LENGTH) * 100)}%`;

    const finish = () => {
      practiceCanvasApi.hideGuide();
      practiceCanvasApi.setGhost(false);
      if (res.questCompletedNow) {
        showOverlay("questOverlay");
      } else {
        loadNextPracticeChar(currentChar);
      }
    };
    setTimeout(finish, 300);
  }

  // ---------- Test / recall mode ----------

  function startTestSession(setKey) {
    currentSetKey = setKey;
    currentMode = "test";
    sessionCount = 0;
    showScreen("screenTest");
    els.sessionBarTest.style.width = "0%";
    if (!testCanvasApi) {
      testCanvasApi = KakitoriCanvas.create(els.testCanvas, { onStrokeComplete: handleTestStroke });
    }
    loadNextTestChar();
  }

  function loadNextTestChar(excludeChar) {
    if (sessionCount >= SESSION_LENGTH) { endSession(); return; }
    const chars = SETS[currentSetKey].chars;
    currentChar = KakitoriProgress.pickNextCharacter(currentSetKey, chars, excludeChar);
    currentRef = SETS[currentSetKey].strokes[currentChar].strokes;
    hintUsed = false;
    testCanvasApi.setReference(currentRef);
    testCanvasApi.clear();
    testCanvasApi.setGhost(false);
    testCanvasApi.hideGuide();
    els.testReading.textContent = readingLine(currentSetKey, currentChar);
    const info = wordInfo(currentSetKey, currentChar);
    els.testEmoji.textContent = info.emoji;
    els.testWord.textContent = info.gloss ? `${info.word} — ${info.gloss}` : info.word;
    mascotSay("test");
  }

  function handleTestStroke(rawPts) {
    testCanvasApi.addConfirmedStroke(rawPts, "#4A4453");
  }

  function submitTest() {
    const userStrokes = testCanvasApi.getConfirmedStrokes();
    if (userStrokes.length === 0) return;
    const result = KakitoriScoring.compareCharacter(userStrokes, currentRef);
    let score = result.overall;
    if (hintUsed) score = Math.round(score * 0.85);
    const res = KakitoriProgress.recordAttempt(currentSetKey, currentChar, score);
    updateStatsBar();
    sessionCount++;
    els.sessionBarTest.style.width = `${Math.min(100, (sessionCount / SESSION_LENGTH) * 100)}%`;

    const label = KakitoriScoring.scoreLabel(score);
    els.resultTitle.textContent = `${currentChar}  ${label.label}`;
    els.resultDetail.textContent = `スコア ${score}てん ${hintUsed ? "(ヒントつかった)" : ""}`;
    showOverlay("resultOverlay", () => {
      if (res.questCompletedNow) {
        showOverlay("questOverlay");
      } else {
        loadNextTestChar(currentChar);
      }
    });
  }

  // ---------- Session end / overlays ----------

  function endSession() {
    const s = KakitoriProgress.getState();
    els.sessionEndDetail.textContent = `もんすう: ${SESSION_LENGTH}もん  🪙${s.coins}  🔥${s.streak.count}にち`;
    showOverlay("sessionEndOverlay");
    updateSetProgressLabels();
  }

  let overlayResumeCb = null;

  function showOverlay(id, resumeCb) {
    overlayResumeCb = resumeCb || null;
    els[id].classList.remove("hidden");
  }

  function hideOverlay(id) {
    els[id].classList.add("hidden");
    const cb = overlayResumeCb;
    overlayResumeCb = null;
    if (cb) cb();
  }

  // ---------- Menu wiring ----------

  function wireMenu() {
    document.querySelectorAll(".set-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedSet = btn.dataset.set;
        document.querySelectorAll(".set-card").forEach((b) => b.classList.toggle("selected", b === btn));
      });
    });
    document.querySelectorAll(".mode-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedMode = btn.dataset.mode;
        document.querySelectorAll(".mode-card").forEach((b) => b.classList.toggle("selected", b === btn));
      });
    });
    els.startBtn.addEventListener("click", () => {
      if (selectedMode === "practice") startPracticeSession(selectedSet);
      else startTestSession(selectedSet);
    });
    els.backToMenuFromPractice.addEventListener("click", () => { showScreen("screenMenu"); updateSetProgressLabels(); });
    els.backToMenuFromTest.addEventListener("click", () => { showScreen("screenMenu"); updateSetProgressLabels(); });
  }

  function wirePractice() {
    els.demoBtn.addEventListener("click", () => {
      practiceCanvasApi.animateReferenceStroke(currentStrokeIdx, 700, () => {
        practiceCanvasApi.showGuide(currentStrokeIdx);
      });
    });
    els.redoStrokeBtn.addEventListener("click", () => {
      practiceCanvasApi.undo();
      hideFeedbackBadge();
    });
  }

  function wireTest() {
    els.hintBtn.addEventListener("click", () => {
      hintUsed = true;
      testCanvasApi.setGhost(true);
    });
    els.undoStrokeTestBtn.addEventListener("click", () => testCanvasApi.undo());
    els.clearTestBtn.addEventListener("click", () => testCanvasApi.clear());
    els.submitTestBtn.addEventListener("click", submitTest);
  }

  function wireOverlays() {
    els.resultContinueBtn.addEventListener("click", () => hideOverlay("resultOverlay"));
    els.questContinueBtn.addEventListener("click", () => {
      KakitoriProgress.claimDailyQuest();
      updateStatsBar();
      hideOverlay("questOverlay");
      if (currentMode === "practice") loadNextPracticeChar(currentChar);
      else if (currentMode === "test") loadNextTestChar(currentChar);
    });
    els.sessionEndContinueBtn.addEventListener("click", () => {
      hideOverlay("sessionEndOverlay");
      sessionCount = 0;
      if (currentMode === "practice") { showScreen("screenPractice"); loadNextPracticeChar(); }
      else { showScreen("screenTest"); loadNextTestChar(); }
    });
    els.sessionEndMenuBtn.addEventListener("click", () => {
      hideOverlay("sessionEndOverlay");
      showScreen("screenMenu");
      updateSetProgressLabels();
    });
  }

  function wireTheme() {
    els.pickBoy.addEventListener("click", () => chooseTheme("boy"));
    els.pickGirl.addEventListener("click", () => chooseTheme("girl"));
    els.themeToggleBtn.addEventListener("click", () => {
      els.themePicker.classList.remove("hidden");
    });
  }

  function chooseTheme(theme) {
    KakitoriProgress.setTheme(theme);
    applyTheme(theme);
    els.themePicker.classList.add("hidden");
  }

  function init() {
    cacheEls();
    wireMenu();
    wirePractice();
    wireTest();
    wireOverlays();
    wireTheme();

    const theme = KakitoriProgress.getTheme();
    if (theme) {
      applyTheme(theme);
    } else {
      applyTheme("boy");
      els.themePicker.classList.remove("hidden");
    }
    updateStatsBar();
    updateSetProgressLabels();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
