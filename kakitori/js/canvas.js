// かきとりんぐ: canvas drawing surface — reference-guide rendering + pointer capture.
// Reference stroke points live in a fixed 0-109 square (matches KanjiVG's viewBox).

const KakitoriCanvas = (() => {
  const REF_SIZE = 109;

  function create(canvasEl, { onStrokeComplete } = {}) {
    const ctx = canvasEl.getContext("2d");
    let cssSize = canvasEl.clientWidth || 300;
    let dpr = window.devicePixelRatio || 1;
    let scale = cssSize / REF_SIZE;

    let referenceStrokes = [];
    let confirmedStrokes = []; // [{pts:[[x,y]...], color}]
    let activePoints = null; // points of the stroke currently being drawn
    let guideIndex = -1; // which reference stroke to show as the "next" guide, -1 = show none
    let showFullGhost = false;
    let animFrame = null;

    function resize() {
      cssSize = canvasEl.clientWidth || 300;
      dpr = window.devicePixelRatio || 1;
      scale = cssSize / REF_SIZE;
      canvasEl.width = cssSize * dpr;
      canvasEl.height = cssSize * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    }

    function toRef(clientX, clientY) {
      const rect = canvasEl.getBoundingClientRect();
      return [(clientX - rect.left) / scale, (clientY - rect.top) / scale];
    }

    function strokePolyline(pts, color, width) {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * scale, pts[0][1] * scale);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0] * scale, pts[i][1] * scale);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    function render() {
      ctx.clearRect(0, 0, cssSize, cssSize);

      if (showFullGhost) {
        referenceStrokes.forEach((s) => strokePolyline(s.pts, "#dcd4c4", cssSize * 0.05));
      }
      if (guideIndex >= 0 && guideIndex < referenceStrokes.length) {
        const s = referenceStrokes[guideIndex];
        strokePolyline(s.pts, "#b9aef0", cssSize * 0.06);
        drawStartDot(s.pts[0], "#8b7fe0");
      }
      confirmedStrokes.forEach((s) => strokePolyline(s.pts, s.color || "#4A4453", cssSize * 0.055));
      if (activePoints && activePoints.length > 1) {
        strokePolyline(activePoints, "#4A4453", cssSize * 0.055);
      }
    }

    function drawStartDot(pt, color) {
      ctx.beginPath();
      ctx.arc(pt[0] * scale, pt[1] * scale, cssSize * 0.035, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Pointer Events already unify mouse/touch/pen input with clientX/clientY,
    // so no separate TouchEvent handling is needed here.
    function pointerPos(e) {
      return toRef(e.clientX, e.clientY);
    }

    let drawing = false;

    function onDown(e) {
      e.preventDefault();
      drawing = true;
      activePoints = [pointerPos(e)];
      render();
    }

    function onMove(e) {
      if (!drawing) return;
      e.preventDefault();
      activePoints.push(pointerPos(e));
      render();
    }

    function onUp(e) {
      if (!drawing) return;
      drawing = false;
      const finished = activePoints;
      activePoints = null;
      render();
      if (finished && finished.length > 2 && onStrokeComplete) {
        onStrokeComplete(finished);
      }
    }

    canvasEl.addEventListener("pointerdown", onDown);
    canvasEl.addEventListener("pointermove", onMove);
    canvasEl.addEventListener("pointerup", onUp);
    canvasEl.addEventListener("pointercancel", onUp);
    canvasEl.addEventListener("pointerleave", (e) => { if (drawing) onUp(e); });
    window.addEventListener("resize", resize);

    resize();

    return {
      setReference(strokes) {
        referenceStrokes = strokes;
        confirmedStrokes = [];
        guideIndex = -1;
        render();
      },
      showGuide(index) {
        guideIndex = index;
        render();
      },
      hideGuide() {
        guideIndex = -1;
        render();
      },
      setGhost(on) {
        showFullGhost = on;
        render();
      },
      addConfirmedStroke(pts, color) {
        confirmedStrokes.push({ pts, color: color || "#4A4453" });
        render();
      },
      clear() {
        confirmedStrokes = [];
        activePoints = null;
        render();
      },
      undo() {
        confirmedStrokes.pop();
        render();
      },
      getConfirmedStrokes() {
        return confirmedStrokes.map((s) => s.pts);
      },
      animateReferenceStroke(index, durationMs, onDone) {
        const s = referenceStrokes[index];
        if (!s) { if (onDone) onDone(); return; }
        if (animFrame) cancelAnimationFrame(animFrame);
        const start = performance.now();
        const total = s.pts.length;
        function step(now) {
          const t = Math.min(1, (now - start) / durationMs);
          const count = Math.max(2, Math.round(t * total));
          render();
          strokePolyline(s.pts.slice(0, count), "#FF6B6B", cssSize * 0.06);
          if (t < 1) {
            animFrame = requestAnimationFrame(step);
          } else if (onDone) {
            onDone();
          }
        }
        animFrame = requestAnimationFrame(step);
      },
      destroy() {
        window.removeEventListener("resize", resize);
        if (animFrame) cancelAnimationFrame(animFrame);
      },
      refSize: REF_SIZE,
    };
  }

  return { create, REF_SIZE };
})();
