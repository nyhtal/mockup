import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFigure, localeShape } from "../lib/figures.js";

test("parseFigure reads English, German and Arabic-Indic figures the way the build formatted them", () => {
  assert.deepEqual(parseFigure("1,284", "en-GB-u-nu-latn"), { number: 1284, decimals: 0, nu: "latn", prefix: "", suffix: "" });
  assert.deepEqual(parseFigure("99.98%", "en-GB-u-nu-latn"), { number: 99.98, decimals: 2, nu: "latn", prefix: "", suffix: "%" });
  assert.deepEqual(parseFigure("+38 %", "en-GB-u-nu-latn"), { number: 38, decimals: 0, nu: "latn", prefix: "+", suffix: " %" });
  assert.deepEqual(parseFigure("1.284", "de-DE-u-nu-latn"), { number: 1284, decimals: 0, nu: "latn", prefix: "", suffix: "" });
  assert.deepEqual(parseFigure("99,98 %", "de-DE-u-nu-latn"), { number: 99.98, decimals: 2, nu: "latn", prefix: "", suffix: " %" });
  assert.deepEqual(parseFigure("9 days", "en-GB-u-nu-latn"), { number: 9, decimals: 0, nu: "latn", prefix: "", suffix: " days" });
  const arab = localeShape("ar-SA-u-nu-arab");
  const value = `${arab.digits[3]}${arab.digits[8]}٪`;
  assert.deepEqual(parseFigure(value, "ar-SA-u-nu-arab"), { number: 38, decimals: 0, nu: "arab", prefix: "", suffix: "٪" });
  assert.equal(parseFigure("n/a", "en-GB-u-nu-latn"), null, "no digit, no figure");
});

test("parseFigure keeps a grouping comma apart from a decimal comma by the digits that follow it", () => {
  assert.equal(parseFigure("1,284,500", "en-GB-u-nu-latn").number, 1284500);
  assert.equal(parseFigure("4.5×", "en-GB-u-nu-latn").decimals, 1);
  assert.equal(parseFigure("12,5", "de-DE-u-nu-latn").number, 12.5);
});
