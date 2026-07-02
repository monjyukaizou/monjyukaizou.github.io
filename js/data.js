// オトツクリ: 曲・コード・音階のデータ (ロジックなし)

// 有名でフリーな(パブリックドメインの)フレーズ。 pitch:音の高さ、dur:長さ(拍)
const PHRASES = [
  {
    id: "kirakira",
    emoji: "🌟",
    label: "キラキラボシ",
    notes: [
      { pitch: "C4", dur: 1 }, { pitch: "C4", dur: 1 },
      { pitch: "G4", dur: 1 }, { pitch: "G4", dur: 1 },
      { pitch: "A4", dur: 1 }, { pitch: "A4", dur: 1 },
      { pitch: "G4", dur: 2 },
      { pitch: "F4", dur: 1 }, { pitch: "F4", dur: 1 },
      { pitch: "E4", dur: 1 }, { pitch: "E4", dur: 1 },
      { pitch: "D4", dur: 1 }, { pitch: "D4", dur: 1 },
      { pitch: "C4", dur: 2 },
    ],
  },
  {
    id: "kaeru",
    emoji: "🐸",
    label: "カエルノウタ",
    notes: [
      { pitch: "C4", dur: 1 }, { pitch: "D4", dur: 1 },
      { pitch: "E4", dur: 1 }, { pitch: "C4", dur: 1 },
      { pitch: "E4", dur: 1 }, { pitch: "F4", dur: 1 },
      { pitch: "G4", dur: 2 },
      { pitch: "G4", dur: 1 }, { pitch: "A4", dur: 1 },
      { pitch: "G4", dur: 1 }, { pitch: "F4", dur: 1 },
      { pitch: "E4", dur: 1 }, { pitch: "C4", dur: 2 },
    ],
  },
  {
    id: "chocho",
    emoji: "🦋",
    label: "チョウチョ",
    notes: [
      { pitch: "G4", dur: 1 }, { pitch: "E4", dur: 1 },
      { pitch: "E4", dur: 1 }, { pitch: "F4", dur: 1 },
      { pitch: "D4", dur: 1 }, { pitch: "D4", dur: 1 },
      { pitch: "C4", dur: 2 },
      { pitch: "D4", dur: 1 }, { pitch: "E4", dur: 1 },
      { pitch: "F4", dur: 1 }, { pitch: "G4", dur: 1 },
      { pitch: "G4", dur: 1 }, { pitch: "G4", dur: 2 },
    ],
  },
  {
    id: "london",
    emoji: "🌉",
    label: "ロンドンバシ",
    notes: [
      { pitch: "G4", dur: 1 }, { pitch: "A4", dur: 1 },
      { pitch: "G4", dur: 1 }, { pitch: "F4", dur: 1 },
      { pitch: "E4", dur: 1 }, { pitch: "F4", dur: 1 },
      { pitch: "G4", dur: 2 },
      { pitch: "D4", dur: 1 }, { pitch: "E4", dur: 1 },
      { pitch: "F4", dur: 1 }, { pitch: "E4", dur: 1 },
      { pitch: "F4", dur: 1 }, { pitch: "G4", dur: 2 },
    ],
  },
  {
    id: "mary",
    emoji: "🐑",
    label: "メリーサンノヒツジ",
    notes: [
      { pitch: "E4", dur: 1 }, { pitch: "D4", dur: 1 },
      { pitch: "C4", dur: 1 }, { pitch: "D4", dur: 1 },
      { pitch: "E4", dur: 1 }, { pitch: "E4", dur: 1 },
      { pitch: "E4", dur: 2 },
      { pitch: "D4", dur: 1 }, { pitch: "D4", dur: 1 },
      { pitch: "D4", dur: 2 },
      { pitch: "E4", dur: 1 }, { pitch: "G4", dur: 1 },
      { pitch: "G4", dur: 2 },
    ],
  },
  {
    id: "elise",
    emoji: "🎹",
    label: "エリーゼノタメニ",
    notes: [
      { pitch: "E5", dur: 0.5 }, { pitch: "D#5", dur: 0.5 },
      { pitch: "E5", dur: 0.5 }, { pitch: "D#5", dur: 0.5 },
      { pitch: "E5", dur: 0.5 }, { pitch: "B4", dur: 0.5 },
      { pitch: "D5", dur: 0.5 }, { pitch: "C5", dur: 0.5 },
      { pitch: "A4", dur: 1.5 },
    ],
  },
];

// 気分(ムード)ごとのコード進行プリセット
const MOODS = [
  { id: "wakuwaku", emoji: "🤩", label: "ワクワク", chords: ["C", "G", "Am", "F"], tempo: 120, pattern: "sustain" },
  { id: "yumemiru", emoji: "✨", label: "ユメミル", chords: ["FMaj7", "Cmaj7", "Am7", "G"], tempo: 90, pattern: "sustain" },
  { id: "nonbiri", emoji: "😌", label: "ノンビリ", chords: ["Am", "F", "C", "G"], tempo: 80, pattern: "sustain" },
  { id: "kakkoii", emoji: "😎", label: "カッコイイ", chords: ["Am", "G", "F", "E"], tempo: 100, pattern: "sustain" },
  { id: "shiawase", emoji: "😊", label: "シアワセ", chords: ["C", "Am", "F", "G"], tempo: 110, pattern: "sustain" },
  { id: "fushigi", emoji: "🤔", label: "フシギ", chords: ["Dm", "G", "Em", "Am"], tempo: 95, pattern: "sustain" },
];

// 現代風アレンジのスタイル(音色・テンポ・リズム)プリセット
const STYLES = [
  { id: "pop", emoji: "🎤", label: "ポップ", wave: "triangle", tempoMul: 1.0, pattern: "sustain" },
  { id: "lofi", emoji: "🎧", label: "ローファイ", wave: "sine", tempoMul: 0.85, pattern: "sustain" },
  { id: "edm", emoji: "🕺", label: "イーディーエム", wave: "square", tempoMul: 1.2, pattern: "pulse8" },
  { id: "rock", emoji: "🎸", label: "ロック", wave: "sawtooth", tempoMul: 1.1, pattern: "pulse8" },
];

// コード名 -> 構成音(低めのオクターブでメロディーと被らないように)
const CHORD_TONES = {
  C: ["C3", "E3", "G3"],
  G: ["G3", "B3", "D4"],
  Am: ["A3", "C4", "E4"],
  F: ["F3", "A3", "C4"],
  FMaj7: ["F3", "A3", "C4", "E4"],
  Cmaj7: ["C3", "E3", "G3", "B3"],
  Am7: ["A3", "C4", "E4", "G4"],
  E: ["E3", "G#3", "B3"],
  Dm: ["D3", "F3", "A3"],
  Em: ["E3", "G3", "B3"],
};

// ジブンデツクル用のペンタトニック音階(どの組み合わせでも気持ちよく聞こえる)
const PENTATONIC_PADS = [
  { pitch: "C4", label: "ド" },
  { pitch: "D4", label: "レ" },
  { pitch: "E4", label: "ミ" },
  { pitch: "G4", label: "ソ" },
  { pitch: "A4", label: "ラ" },
  { pitch: "C5", label: "ド↑" },
];
