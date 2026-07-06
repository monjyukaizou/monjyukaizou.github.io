// サンプルデータ(架空の値・要検証)。
// design.md のテーブル設計/schema.sqlに対応する形だが、実運用ではここを
// メーカー公式カタログ値・自社実測値(paper_official_specs / paper_measured_specs)
// に置き換えること。ここにある数値は計算式を試すためのダミー値。

// 判型マスタ(仕上がり寸法 mm)。
// 「四六判(仕上がり)」は書籍の仕上がりサイズであり、連量換算に使う
// 「原紙 四六判(788×1091mm)」とは別物なので混同しないこと。
const TRIM_SIZES = [
  { name: "A5", widthMm: 148, heightMm: 210 },
  { name: "四六判(仕上がり)", widthMm: 127, heightMm: 188 },
  { name: "B5", widthMm: 182, heightMm: 257 },
];

// 製本方式マスタ(背幅補正)
const BINDING_TYPES = [
  { name: "並製本(無線綴じ)", correctionFactor: 1.02, fixedAdditionMm: 0 },
  { name: "上製本(丸背)", correctionFactor: 1.0, fixedAdditionMm: 4 },
];

// 本文紙サンプル(架空の値・要検証) — 米坪(g/m2)と紙厚(um)
const SAMPLE_PAPERS = [
  { name: "書籍用紙A(クリーム系)", category: "書籍用紙", basisWeightGsm: 81.4, thicknessUm: 88 },
  { name: "嵩高書籍用紙B", category: "嵩高書籍用紙", basisWeightGsm: 72.5, thicknessUm: 100 },
  { name: "コート紙C", category: "コート紙", basisWeightGsm: 104.7, thicknessUm: 80 },
];
