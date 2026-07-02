// かきとりんぐ: compares a drawn stroke against KanjiVG-derived reference data.
// Reference points are pre-resampled (see build script); user points are
// resampled here to the same count so corresponding indices line up.

const KakitoriScoring = (() => {
  const REF_SIZE = 109;
  const N = 32;

  function dist(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }

  function pathLength(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
    return len;
  }

  function resample(pts, n = N) {
    if (pts.length === 1) return new Array(n).fill(pts[0]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    const total = cum[cum.length - 1];
    if (total === 0) return new Array(n).fill(pts[0]);
    const out = [];
    let j = 0;
    for (let k = 0; k < n; k++) {
      const target = (k / (n - 1)) * total;
      while (j < pts.length - 2 && cum[j + 1] < target) j++;
      const segLen = cum[j + 1] - cum[j];
      const frac = segLen === 0 ? 0 : (target - cum[j]) / segLen;
      const a = pts[j], b = pts[j + 1];
      out.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
    }
    return out;
  }

  function boundingBox(strokesPts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    strokesPts.forEach((pts) => pts.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }));
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: REF_SIZE, maxY: REF_SIZE };
    return { minX, minY, maxX, maxY };
  }

  // Normalize a whole set of user strokes onto the reference character's
  // bounding box. Lets free-drawn (no guide) attempts in test mode land in
  // roughly the same coordinate space as the reference before comparing.
  function normalizeToRef(userStrokesPts, refBox) {
    const box = boundingBox(userStrokesPts);
    const uw = Math.max(1, box.maxX - box.minX);
    const uh = Math.max(1, box.maxY - box.minY);
    const rw = Math.max(1, refBox.maxX - refBox.minX);
    const rh = Math.max(1, refBox.maxY - refBox.minY);
    const s = Math.min(rw / uw, rh / uh);
    return userStrokesPts.map((pts) => pts.map(([x, y]) => [
      refBox.minX + (x - box.minX) * s,
      refBox.minY + (y - box.minY) * s,
    ]));
  }

  function angle(a, b) {
    return Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  function angleDiff(a, b) {
    let d = Math.abs(a - b);
    return Math.min(d, Math.PI * 2 - d);
  }

  // Mirrors the Python build-time heuristic: a sharp direction reversal in
  // the stroke's tail means the pen hooked back on itself (hane).
  function looksHooked(pts) {
    const n = pts.length;
    const tail = Math.max(4, Math.floor(n / 6));
    if (n < tail + 2) return false;
    const entryDir = angle(pts[n - tail - 1], pts[n - tail]);
    const exitDir = angle(pts[n - 2], pts[n - 1]);
    return angleDiff(entryDir, exitDir) > (75 * Math.PI) / 180;
  }

  function compareStroke(userPtsRaw, refStroke) {
    const user = resample(userPtsRaw, N);
    const ref = refStroke.pts;

    let sumDist = 0;
    for (let i = 0; i < N; i++) sumDist += dist(user[i], ref[i]);
    const avgDist = sumDist / N;

    const startDist = dist(user[0], ref[0]);
    const endDist = dist(user[N - 1], ref[N - 1]);

    const shapeScore = clamp01(1 - avgDist / (REF_SIZE * 0.22));
    const startScore = clamp01(1 - startDist / (REF_SIZE * 0.28));
    const endScore = clamp01(1 - endDist / (REF_SIZE * 0.28));

    let endingBonus = 1;
    let tip = null;
    const userHooked = looksHooked(user);
    if (refStroke.kind === "hane") {
      endingBonus = userHooked ? 1 : 0.6;
      if (!userHooked) tip = "さいごに ちいさく はねてみよう(はね)";
    } else if (refStroke.kind === "harai") {
      tip = "さいごは すーっと ほそく はらおう(はらい)";
    } else if (userHooked && refStroke.kind === "tome") {
      endingBonus = 0.85;
      tip = "さいごは しっかり とめよう(とめ)";
    }

    const raw = (shapeScore * 0.5 + startScore * 0.2 + endScore * 0.3) * endingBonus;
    const score = Math.round(clamp01(raw) * 100);
    return { score, tip, kind: refStroke.kind };
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  function scoreLabel(score) {
    if (score >= 90) return { label: "かんぺき!", tier: "great" };
    if (score >= 70) return { label: "じょうず!", tier: "good" };
    if (score >= 45) return { label: "おしい!", tier: "ok" };
    return { label: "もういちど!", tier: "retry" };
  }

  // Full-character comparison for test/recall mode: user strokes are matched
  // 1:1 by draw order against reference strokes (a wrong stroke order simply
  // scores poorly against the reference index it lines up with).
  function compareCharacter(userStrokesRaw, refStrokes) {
    const refBox = boundingBox(refStrokes.map((s) => s.pts));
    const normalized = normalizeToRef(userStrokesRaw, refBox);
    const n = Math.min(normalized.length, refStrokes.length);
    const perStroke = [];
    for (let i = 0; i < n; i++) {
      perStroke.push(compareStroke(normalized[i], refStrokes[i]));
    }
    const countPenalty = Math.abs(userStrokesRaw.length - refStrokes.length) * 12;
    const base = perStroke.length
      ? perStroke.reduce((s, r) => s + r.score, 0) / perStroke.length
      : 0;
    const overall = Math.max(0, Math.round(base - countPenalty));
    return { overall, perStroke, strokeCountDiff: userStrokesRaw.length - refStrokes.length };
  }

  return { resample, compareStroke, compareCharacter, scoreLabel, boundingBox, normalizeToRef };
})();
