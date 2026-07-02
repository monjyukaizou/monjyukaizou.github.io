// オトツクリ: 画面のつなぎこみ (状態管理)

(() => {
  const state = {
    mode: "phrase", // "phrase" | "compose"
    selectedPhraseId: null,
    selectedMoodId: null,
    selectedStyleId: null,
    composedNotes: [],
    isPlaying: false,
  };

  let playEndTimer = null;

  let playBtn, styleSection, composeSection, noteStrip;

  document.addEventListener("DOMContentLoaded", () => {
    playBtn = document.getElementById("playBtn");
    styleSection = document.getElementById("styleSection");
    composeSection = document.getElementById("composeSection");
    noteStrip = document.getElementById("noteStrip");

    document.querySelectorAll("[data-phrase]").forEach((card) => {
      card.addEventListener("click", () => onPhraseCard(card.dataset.phrase));
    });
    document.querySelectorAll("[data-mood]").forEach((card) => {
      card.addEventListener("click", () => onMoodCard(card.dataset.mood));
    });
    document.querySelectorAll("[data-style]").forEach((card) => {
      card.addEventListener("click", () => onStyleCard(card.dataset.style));
    });
    document.querySelectorAll("[data-pitch]").forEach((pad) => {
      pad.addEventListener("click", () => onPad(pad.dataset.pitch));
    });

    document.getElementById("undoBtn").addEventListener("click", onUndo);
    document.getElementById("clearBtn").addEventListener("click", onClear);
    playBtn.addEventListener("click", onTogglePlay);

    updateSectionVisibility();
    updateTransportEnabled();
    renderNoteStrip();
  });

  function stopIfPlaying() {
    if (state.isPlaying) {
      OtoAudio.stopAll();
      state.isPlaying = false;
      clearTimeout(playEndTimer);
      updatePlayButton();
    }
  }

  function onPhraseCard(id) {
    stopIfPlaying();
    state.selectedPhraseId = id;
    state.mode = id === "custom" ? "compose" : "phrase";
    setSelected("[data-phrase]", "data-phrase", id);
    updateSectionVisibility();
    updateTransportEnabled();
  }

  function onMoodCard(id) {
    stopIfPlaying();
    state.selectedMoodId = id;
    setSelected("[data-mood]", "data-mood", id);
    updateTransportEnabled();
  }

  function onStyleCard(id) {
    stopIfPlaying();
    state.selectedStyleId = id;
    setSelected("[data-style]", "data-style", id);
    updateTransportEnabled();
  }

  function onPad(pitch) {
    const ctx = OtoAudio.initAudio();
    OtoAudio.playMelody([{ pitch, dur: 0.5 }], 120, "triangle", ctx.currentTime + 0.02);
    state.composedNotes.push({ pitch, dur: 1 });
    renderNoteStrip();
    updateTransportEnabled();
  }

  function onUndo() {
    state.composedNotes.pop();
    renderNoteStrip();
    updateTransportEnabled();
  }

  function onClear() {
    state.composedNotes = [];
    renderNoteStrip();
    updateTransportEnabled();
  }

  function onTogglePlay() {
    if (state.isPlaying) {
      stopIfPlaying();
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    const ctx = OtoAudio.initAudio();
    OtoAudio.stopAll();

    let notes, bpm, wave, chords, pattern;

    if (state.mode === "phrase") {
      if (!state.selectedPhraseId || !state.selectedMoodId || !state.selectedStyleId) return;
      const phrase = PHRASES.find((p) => p.id === state.selectedPhraseId);
      const mood = MOODS.find((m) => m.id === state.selectedMoodId);
      const style = STYLES.find((s) => s.id === state.selectedStyleId);
      notes = phrase.notes;
      bpm = mood.tempo * style.tempoMul;
      wave = style.wave;
      chords = mood.chords;
      pattern = style.pattern;
    } else {
      if (state.composedNotes.length === 0) return;
      notes = state.composedNotes;
      const mood = state.selectedMoodId ? MOODS.find((m) => m.id === state.selectedMoodId) : null;
      bpm = mood ? mood.tempo : 100;
      wave = "triangle";
      chords = mood ? mood.chords : [];
      pattern = "sustain";
    }

    const startAt = ctx.currentTime + 0.06;
    OtoAudio.playMelody(notes, bpm, wave, startAt);
    const totalSeconds = OtoAudio.beatsToSeconds(OtoAudio.totalBeats(notes), bpm);
    if (chords && chords.length) {
      OtoAudio.playChordLoop(chords, CHORD_TONES, bpm, startAt, totalSeconds, pattern);
    }

    state.isPlaying = true;
    updatePlayButton();

    clearTimeout(playEndTimer);
    const waitMs = (startAt - ctx.currentTime + totalSeconds) * 1000 + 150;
    playEndTimer = setTimeout(() => {
      state.isPlaying = false;
      updatePlayButton();
    }, waitMs);
  }

  function setSelected(selector, attr, id) {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.toggle("selected", el.getAttribute(attr) === id);
    });
  }

  function updateSectionVisibility() {
    const isCompose = state.mode === "compose";
    composeSection.classList.toggle("hidden", !isCompose);
    styleSection.classList.toggle("hidden", isCompose);
  }

  function updateTransportEnabled() {
    let canPlay;
    if (state.mode === "phrase") {
      canPlay = !!(state.selectedPhraseId && state.selectedMoodId && state.selectedStyleId);
    } else {
      canPlay = state.composedNotes.length > 0;
    }
    playBtn.disabled = !canPlay && !state.isPlaying;
  }

  function updatePlayButton() {
    playBtn.textContent = state.isPlaying ? "⏹️ トメル" : "▶️ ナラス";
    updateTransportEnabled();
  }

  function renderNoteStrip() {
    noteStrip.innerHTML = "";
    state.composedNotes.forEach((note) => {
      const idx = PENTATONIC_PADS.findIndex((p) => p.pitch === note.pitch);
      const dot = document.createElement("span");
      dot.className = "dot dot-" + (idx >= 0 ? idx : 0);
      noteStrip.appendChild(dot);
    });
  }
})();
