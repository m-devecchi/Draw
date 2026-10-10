import { test } from "node:test";
import assert from "node:assert/strict";
import { refineLines, SUMI } from "../src/lib/refine-lines.ts";

test("assottiglia i tratti e li colora sumi", () => {
  const out = refineLines('<path stroke="#000000" stroke-width="10" fill="#FFFFFF"/>');
  assert.equal(out, `<path stroke="${SUMI}" stroke-width="5.5" fill="#FFFFFF"/>`);
});

test("non scende sotto lo spessore minimo", () => {
  assert.match(refineLines('<circle stroke-width="2"/>'), /stroke-width="2.5"/);
});

test("lascia stare i colori diversi dal nero", () => {
  const svg = '<rect fill="#ff0000" stroke="#123456"/>';
  assert.equal(refineLines(svg), svg);
});
