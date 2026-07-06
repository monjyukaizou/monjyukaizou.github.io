// design.md「4. 重量・背幅の計算式」の実装。DOMには一切触れない純粋関数群。
const PaperCalc = (function () {
  function sheetsFromPages(pageCount) {
    return Math.ceil(pageCount / 2);
  }

  function areaM2(widthMm, heightMm) {
    return (widthMm * heightMm) / 1000000;
  }

  function paperWeightG(pageCount, widthMm, heightMm, basisWeightGsm) {
    return sheetsFromPages(pageCount) * areaM2(widthMm, heightMm) * basisWeightGsm;
  }

  function spineWidthMm(pageCount, thicknessUm, correctionFactor, fixedAdditionMm) {
    const thicknessMm = thicknessUm / 1000;
    return sheetsFromPages(pageCount) * thicknessMm * correctionFactor + fixedAdditionMm;
  }

  function basisWeightFromReamWeight(reamWeightKg, baseAreaM2) {
    return reamWeightKg / baseAreaM2;
  }

  return {
    sheetsFromPages: sheetsFromPages,
    areaM2: areaM2,
    paperWeightG: paperWeightG,
    spineWidthMm: spineWidthMm,
    basisWeightFromReamWeight: basisWeightFromReamWeight,
    BASE_SHEET_AREA_M2: { "四六判": 0.85958, "菊判": 0.5972 },
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PaperCalc;
}
