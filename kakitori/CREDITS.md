# Credits

Stroke-order data (`js/strokes-hiragana.js`, `js/strokes-katakana.js`,
`js/strokes-kanji-g1.js`) is derived from the [KanjiVG](http://kanjivg.tagaini.net)
project by Ulrich Apel, © 2009–2011, licensed under the
[Creative Commons Attribution-Share Alike 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
license.

The original SVG stroke paths were resampled into point arrays and each
stroke's ending was classified as とめ (tome) / はね (hane) / はらい (harai)
based on KanjiVG's own stroke-type annotations (for kanji) and stroke
geometry (for kana). This derived dataset is distributed under the same
CC BY-SA 3.0 license as the source data.

All other code, game design, and content (readings, example words, UI) in
this `kakitori/` app were written for this project.
