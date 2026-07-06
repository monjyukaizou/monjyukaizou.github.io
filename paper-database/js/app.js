// フォームの状態管理とDOM描画。PaperCalcとdata.jsの値を使って計算するだけ。
(function () {
  function populateSelect(selectEl, items, labelFn) {
    items.forEach(function (item, index) {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = labelFn(item);
      selectEl.appendChild(opt);
    });
  }

  function init() {
    const pageCountInput = document.getElementById("page-count");
    const trimSizeSelect = document.getElementById("trim-size");
    const bindingSelect = document.getElementById("binding-type");
    const paperSelect = document.getElementById("paper");
    const coverWeightInput = document.getElementById("cover-weight");
    const calcButton = document.getElementById("calc-button");
    const resultEl = document.getElementById("result");

    populateSelect(trimSizeSelect, TRIM_SIZES, function (t) {
      return t.name + "(" + t.widthMm + "×" + t.heightMm + "mm)";
    });
    populateSelect(bindingSelect, BINDING_TYPES, function (b) {
      return b.name;
    });
    populateSelect(paperSelect, SAMPLE_PAPERS, function (p) {
      return p.name + "(" + p.basisWeightGsm + "g/m², " + p.thicknessUm + "μm)";
    });

    calcButton.addEventListener("click", function () {
      const pageCount = parseInt(pageCountInput.value, 10);
      const trimSize = TRIM_SIZES[Number(trimSizeSelect.value)];
      const binding = BINDING_TYPES[Number(bindingSelect.value)];
      const paper = SAMPLE_PAPERS[Number(paperSelect.value)];
      const coverWeight = parseFloat(coverWeightInput.value) || 0;

      if (!pageCount || pageCount <= 0) {
        resultEl.textContent = "ページ数を正しく入力してください。";
        return;
      }

      const paperWeight = PaperCalc.paperWeightG(
        pageCount,
        trimSize.widthMm,
        trimSize.heightMm,
        paper.basisWeightGsm
      );
      const spineWidth = PaperCalc.spineWidthMm(
        pageCount,
        paper.thicknessUm,
        binding.correctionFactor,
        binding.fixedAdditionMm
      );
      const totalWeight = paperWeight + coverWeight;

      resultEl.innerHTML =
        "本文用紙重量: " + paperWeight.toFixed(1) + " g<br>" +
        "背幅: " + spineWidth.toFixed(2) + " mm<br>" +
        "書籍総重量(概算・表紙込み): " + totalWeight.toFixed(1) + " g";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
