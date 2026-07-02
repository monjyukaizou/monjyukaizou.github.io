// かきとりんぐ: localStorage-backed progress — streaks, mastery, daily quest, theme.

const KakitoriProgress = (() => {
  const STORAGE_KEY = "kakitori_state_v1";
  const MASTERY_MAX = 5;
  const MASTERED_AT = 4;
  const DAILY_GOAL = 10;

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function daysBetween(a, b) {
    const da = new Date(a + "T00:00:00");
    const db = new Date(b + "T00:00:00");
    return Math.round((db - da) / 86400000);
  }

  function defaultState() {
    return {
      theme: null,
      coins: 0,
      streak: { count: 0, longest: 0, lastPlayedDate: null },
      mastery: {},
      dailyQuest: { date: todayStr(), done: 0, goal: DAILY_GOAL, claimed: false },
      totalAttempts: 0,
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed, {
        streak: Object.assign(defaultState().streak, parsed.streak),
        dailyQuest: Object.assign(defaultState().dailyQuest, parsed.dailyQuest),
        mastery: parsed.mastery || {},
      });
    } catch (e) {
      return defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function ensureDailyQuestFresh() {
    const today = todayStr();
    if (state.dailyQuest.date !== today) {
      state.dailyQuest = { date: today, done: 0, goal: DAILY_GOAL, claimed: false };
    }
  }

  function touchDailyStreak() {
    const today = todayStr();
    const last = state.streak.lastPlayedDate;
    if (last === today) return { changed: false, streakBroken: false };
    let streakBroken = false;
    if (!last) {
      state.streak.count = 1;
    } else {
      const gap = daysBetween(last, today);
      if (gap === 1) {
        state.streak.count += 1;
      } else {
        streakBroken = state.streak.count > 0 && gap > 1;
        state.streak.count = 1;
      }
    }
    state.streak.longest = Math.max(state.streak.longest, state.streak.count);
    state.streak.lastPlayedDate = today;
    return { changed: true, streakBroken };
  }

  function keyFor(setKey, char) {
    return `${setKey}:${char}`;
  }

  function getMastery(setKey, char) {
    const m = state.mastery[keyFor(setKey, char)];
    return m ? m.level : 0;
  }

  function recordAttempt(setKey, char, score) {
    ensureDailyQuestFresh();
    const k = keyFor(setKey, char);
    const prev = state.mastery[k] || { level: 0, seenCount: 0 };
    let level = prev.level;
    if (score >= 85) level = Math.min(MASTERY_MAX, level + 1);
    else if (score < 55) level = Math.max(0, level - 1);
    state.mastery[k] = { level, seenCount: (prev.seenCount || 0) + 1, lastScore: score };

    state.totalAttempts += 1;
    state.coins += score >= 85 ? 3 : score >= 70 ? 2 : 1;
    state.dailyQuest.done = Math.min(state.dailyQuest.goal, state.dailyQuest.done + 1);

    const streakInfo = touchDailyStreak();
    save();
    return {
      level,
      coins: state.coins,
      dailyQuest: { ...state.dailyQuest },
      streak: { ...state.streak },
      streakInfo,
      questCompletedNow: state.dailyQuest.done === state.dailyQuest.goal,
    };
  }

  function getMasterySummary(setKey, chars) {
    let masteredCount = 0;
    chars.forEach((ch) => {
      if (getMastery(setKey, ch) >= MASTERED_AT) masteredCount += 1;
    });
    return { masteredCount, total: chars.length };
  }

  // Weighted random pick favoring low-mastery / less-seen characters, so
  // practice sessions naturally cycle back to weak spots.
  function pickNextCharacter(setKey, chars, excludeChar) {
    const pool = chars.filter((c) => c !== excludeChar || chars.length === 1);
    const weights = pool.map((ch) => {
      const m = state.mastery[keyFor(setKey, ch)];
      const level = m ? m.level : 0;
      const seen = m ? m.seenCount : 0;
      return (MASTERY_MAX - level) + (seen === 0 ? 3 : 0) + 1;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function setTheme(theme) {
    state.theme = theme;
    save();
  }

  function getTheme() {
    return state.theme;
  }

  function getState() {
    ensureDailyQuestFresh();
    return state;
  }

  function claimDailyQuest() {
    if (state.dailyQuest.done >= state.dailyQuest.goal && !state.dailyQuest.claimed) {
      state.dailyQuest.claimed = true;
      state.coins += 20;
      save();
      return true;
    }
    return false;
  }

  return {
    getState,
    setTheme,
    getTheme,
    recordAttempt,
    getMastery,
    getMasterySummary,
    pickNextCharacter,
    claimDailyQuest,
    MASTERY_MAX,
    MASTERED_AT,
  };
})();
