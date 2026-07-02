// オトツクリ: Web Audio 再生エンジン (DOMに触れない)

const OtoAudio = (() => {
  let audioCtx = null;
  let activeNodes = [];

  const SEMITONE_FROM_A = {
    C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4,
    "F#": -3, G: -2, "G#": -1, A: 0, "A#": 1, B: 2,
  };

  function initAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function noteToFreq(note) {
    const m = /^([A-G]#?)(\d)$/.exec(note);
    if (!m) return 440;
    const [, name, octStr] = m;
    const oct = parseInt(octStr, 10);
    const semitones = SEMITONE_FROM_A[name] + (oct - 4) * 12;
    return 440 * Math.pow(2, semitones / 12);
  }

  function beatsToSeconds(beats, bpm) {
    return (beats * 60) / bpm;
  }

  function scheduleTone(freq, startTime, duration, waveform, peakGain) {
    if (duration <= 0 || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    osc.type = waveform || "sine";
    osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    const attack = Math.min(0.02, duration / 4);
    const release = Math.min(0.05, duration / 3);
    const sustainEnd = Math.max(startTime + attack, startTime + duration - release);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    gain.gain.setValueAtTime(peakGain, sustainEnd);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
    const entry = { osc, gain };
    activeNodes.push(entry);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (e) {
        // already disconnected, ignore
      }
      const idx = activeNodes.indexOf(entry);
      if (idx >= 0) activeNodes.splice(idx, 1);
    };
  }

  function totalBeats(notes) {
    return notes.reduce((sum, n) => sum + n.dur, 0);
  }

  function playMelody(notes, bpm, waveform, startAt) {
    let t = startAt;
    notes.forEach((n) => {
      const dur = beatsToSeconds(n.dur, bpm);
      scheduleTone(noteToFreq(n.pitch), t, dur * 0.92, waveform, 0.25);
      t += dur;
    });
    return t;
  }

  function playChordLoop(chordSymbols, chordTones, bpm, startAt, totalDurationSeconds, pattern) {
    if (!chordSymbols || chordSymbols.length === 0) return;
    const beatsPerChord = 4;
    const barSeconds = beatsToSeconds(beatsPerChord, bpm);
    let t = startAt;
    let i = 0;
    while (t < startAt + totalDurationSeconds) {
      const sym = chordSymbols[i % chordSymbols.length];
      const tones = chordTones[sym] || [];
      if (pattern === "pulse8") {
        const pulseSeconds = barSeconds / 8;
        for (let p = 0; p < 8; p++) {
          const pt = t + p * pulseSeconds;
          tones.forEach((pitch) =>
            scheduleTone(noteToFreq(pitch), pt, pulseSeconds * 0.85, "triangle", 0.1)
          );
        }
      } else {
        tones.forEach((pitch) =>
          scheduleTone(noteToFreq(pitch), t, barSeconds * 0.95, "sine", 0.09)
        );
      }
      t += barSeconds;
      i++;
    }
  }

  function stopAll() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    activeNodes.slice().forEach(({ osc, gain }) => {
      try {
        const current = gain.gain.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(current, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.02);
        osc.stop(now + 0.03);
      } catch (e) {
        // already stopped, ignore
      }
    });
  }

  return {
    initAudio,
    noteToFreq,
    beatsToSeconds,
    totalBeats,
    playMelody,
    playChordLoop,
    stopAll,
    get context() {
      return audioCtx;
    },
  };
})();
