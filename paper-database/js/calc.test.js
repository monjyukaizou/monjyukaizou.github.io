// 計算ロジックの手動テスト用スクリプト(フレームワーク不使用)。
// 実行方法: node paper-database/js/calc.test.js
const PaperCalc = require("./calc.js");

let failures = 0;

function assertClose(actual, expected, tolerance, label) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    console.error(
      "NG: " + label + " -> got " + actual + ", expected " + expected + " (誤差" + diff.toFixed(3) + ")"
    );
    failures += 1;
  } else {
    console.log("OK: " + label + " -> " + actual);
  }
}

// design.md記載の例: 200ページ・A5判(148x210mm)・米坪81.4g/m2 -> 約253g
assertClose(PaperCalc.paperWeightG(200, 148, 210, 81.4), 253, 1, "本文用紙重量(design.mdの例)");

// 奇数ページは切り上げで枚数計算(201ページ->101枚)
assertClose(PaperCalc.sheetsFromPages(201), 101, 0, "奇数ページの枚数切り上げ");

// 米坪⇔連量換算(四六判・連量70kg -> 約81.4g/m2)
assertClose(
  PaperCalc.basisWeightFromReamWeight(70, PaperCalc.BASE_SHEET_AREA_M2["四六判"]),
  81.4,
  0.1,
  "連量から米坪への換算(四六判70kg)"
);

// 背幅: 200ページ(100枚)・紙厚88um・並製本(係数1.02, 固定加算0)
assertClose(PaperCalc.spineWidthMm(200, 88, 1.02, 0), 8.976, 0.01, "背幅(並製本の例)");

if (failures > 0) {
  console.error(failures + "件のテストが失敗しました。");
  process.exit(1);
}
console.log("全テスト成功。");
