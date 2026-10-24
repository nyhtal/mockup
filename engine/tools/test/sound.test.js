import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { startServer } from "../serve.js";
import { chromePath } from "../lib/browser.js";

// The real module in real Chrome: the fixture page carries one of each thing the vocabulary answers (spec 2026-10-23-sound-design.md).
const executablePath = chromePath();
const skip = !executablePath && "no local Chrome";
const C5 = 523, E5 = 659, G5 = 784, C4 = 262, G4 = 392;

const FIXTURE = `<!DOCTYPE html><html lang="en" data-motion="standard"><head><meta charset="utf-8"><title>sound</title><link rel="icon" href="data:,">
<style>a,button,summary{display:block;width:200px;height:30px}.far{margin-top:3000px;height:80px}</style></head><body>
<button type="button" data-sound aria-pressed="false" id="toggle">Sound effects</button>
<a href="#a" id="l1">one</a><a href="#b" id="l2">two</a><a href="#c" id="l3">three</a>
<button type="button" id="plain">plain</button>
<button type="button" id="primary" data-variant="primary">primary</button>
<button type="button" popovertarget="pop" id="popbtn">menu</button><div popover id="pop">menu</div>
<button type="button" popovertarget="pop2" id="popbtn2">menu 2</button><div popover id="pop2">menu 2</div>
<details name="g" id="d1"><summary id="s1">one</summary>x</details><details name="g" id="d2"><summary id="s2">two</summary>y</details>
<button type="button" commandfor="dlg" command="show-modal" id="dlgbtn">open</button><dialog id="dlg"><button type="button" commandfor="dlg" command="close" id="dlgclose">close</button></dialog>
<button type="button" commandfor="dlg2" command="show-modal" id="dlgbtn2">open form dialog</button><dialog id="dlg2"><form method="dialog"><button type="submit" id="dlgsubmit">Close</button></form></dialog>
<button type="button" popovertarget="drw" id="drwbtn">drawer</button><div popover id="drw" data-component="mobile-drawer"><button type="button" popovertarget="inner" id="innerbtn">inner</button><div popover id="inner">inner</div></div>
<button type="button" commandfor="lb-1" command="show-modal" id="lbbtn">picture</button>
<dialog id="lb-1" data-lightbox><button type="button" data-lb="lb-2" id="next">next</button></dialog>
<dialog id="lb-2" data-lightbox><button type="button" data-lb="lb-1">previous</button></dialog>
<form id="f" action="#sent" onsubmit="return false"><input name="n" required id="n"><button type="submit" id="send">send</button></form>
<input type="range" id="r" min="0" max="100" value="50">
<button type="button" data-sound-demo="open" id="demo">play open</button>
<div class="far pending:translate-y-4" id="far">far</div>
<script type="module" src="/assets/enhance.js"></script></body></html>`;

let dir, server, browser;
before(async () => {
  if (skip) return;
  dir = mkdtempSync(path.join(tmpdir(), "sound-"));
  mkdirSync(path.join(dir, "assets"));
  for (const f of ["enhance.js", "sound.js"]) copyFileSync(path.join("engine/scripts", f), path.join(dir, "assets", f));
  writeFileSync(path.join(dir, "index.html"), FIXTURE);
  server = await startServer(dir);
  browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
});
after(async () => {
  if (browser) await browser.close();
  if (server) await server.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** A fresh page that records the start frequency of every oscillator (0 for a noise source) into window.__v. */
async function open({ restored = false, reduced = false } = {}) {
  const page = await browser.newPage();
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.evaluateOnNewDocument((restored) => {
    if (restored) sessionStorage.sound = "1";
    window.__v = [];
    const P = AudioContext.prototype, osc = P.createOscillator, src = P.createBufferSource;
    P.createOscillator = function () {
      const n = osc.call(this), set = n.frequency.setValueAtTime.bind(n.frequency);
      n.frequency.setValueAtTime = (v, t) => (window.__v.push(Math.round(v)), set(v, t));
      return n;
    };
    P.createBufferSource = function () { window.__v.push(0); return src.call(this); };
  }, restored);
  await page.goto(server.url + "/");
  return page;
}
const take = async (page, ms = 160) => { await wait(ms); return page.evaluate(() => window.__v.splice(0)); };
// Actions go through the keyboard: a mouse click would also move the pointer onto a button and add a hover cue.
const key = async (page, sel, k = "Enter") => { await page.focus(sel); await page.keyboard.press(k); };
async function on(page) {
  await key(page, "#toggle");
  assert.deepEqual(await take(page, 300), [C5, E5], "switching on plays the rising pair");
}
const corner = (page) => page.mouse.move(2, 2); // the body's margin: no hover target

test("sound.js stays within its budget (R-SND-02)", () => {
  assert.ok(statSync("engine/scripts/sound.js").size <= 4608, `${statSync("engine/scripts/sound.js").size} B`);
});

test("restored on: silent until the first gesture, then hover sounds", { skip }, async () => {
  const page = await open({ restored: true });
  await wait(300);
  await page.hover("#l1");
  assert.deepEqual(await take(page, 300), [], "nothing at load, no hover before a gesture");
  await page.mouse.click(2, 2);
  await page.hover("#l2");
  assert.deepEqual(await take(page, 300), [G5], "after a click, a hover sounds");
  await page.close();
});

test("hover: dwell, throttle and once per target", { skip }, async () => {
  const page = await open();
  await on(page);
  await page.hover("#l1");
  assert.deepEqual(await take(page, 60), [], "no sound before 100 ms of dwell");
  assert.deepEqual(await take(page, 120), [G5]);
  const [x, y] = await page.$eval("#l1", (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y]; });
  await page.mouse.move(x + 10, y + 5); await page.mouse.move(x + 30, y + 10);
  assert.deepEqual(await take(page, 300), [], "moving within the same link: no new sound");
  await corner(page); await wait(300);
  await page.hover("#l1");
  assert.deepEqual(await take(page, 300), [G5], "a target left and re-entered sounds again");
  await page.hover("#l2"); await wait(110); await page.hover("#l3");
  assert.deepEqual(await take(page, 300), [G5], "two links within 250 ms: one sound");
  await page.close();
});

test("press: buttons tap, primary at the same pitch; opening buttons play the open sound instead", { skip }, async () => {
  const page = await open();
  await on(page);
  await key(page, "#plain");
  assert.deepEqual(await take(page), [E5]);
  await key(page, "#primary");
  assert.deepEqual(await take(page), [E5]);
  await key(page, "#popbtn");
  assert.deepEqual(await take(page), [C5], "pop only, no press");
  await page.keyboard.press("Escape");
  assert.deepEqual(await take(page), [E5], "unpop");
  await page.close();
});

test("exclusive groups and replaced popovers play only the open", { skip }, async () => {
  const page = await open();
  await on(page);
  await key(page, "#s1");
  assert.deepEqual(await take(page), [C5], "details open");
  await key(page, "#s2");
  assert.deepEqual(await take(page), [C5], "the sibling's close is silent");
  await key(page, "#s2");
  assert.deepEqual(await take(page), [E5], "a plain close plays");
  await key(page, "#popbtn"); await take(page);
  await key(page, "#popbtn2");
  assert.deepEqual(await take(page), [C5], "the replaced popover's unpop is silent");
  await page.close();
});

test("dialogs: sheet and unsheet; lightbox next is one step", { skip }, async () => {
  const page = await open();
  await on(page);
  await key(page, "#dlgbtn");
  assert.deepEqual(await take(page), [C4]);
  await key(page, "#dlgclose");
  assert.deepEqual(await take(page), [G4]);
  await key(page, "#lbbtn"); await take(page);
  await key(page, "#next");
  assert.deepEqual(await take(page, 250), [E5], "one step, no unsheet or sheet");
  await page.keyboard.press("Escape");
  assert.deepEqual(await take(page), [G4], "closing the lightbox afterwards is an unsheet");
  await page.close();
});

test("a dialog closed by its method=dialog form is one unsheet, not a submit", { skip }, async () => {
  const page = await open();
  await on(page);
  await key(page, "#dlgbtn2");
  assert.deepEqual(await take(page), [C4]);
  await key(page, "#dlgsubmit");
  assert.deepEqual(await take(page, 250), [G4]);
  await page.close();
});

test("drawers are sheets; a menu inside an open drawer still pops", { skip }, async () => {
  const page = await open();
  await on(page);
  await key(page, "#drwbtn");
  assert.deepEqual(await take(page), [C4], "drawer opens as a sheet");
  await key(page, "#innerbtn");
  assert.deepEqual(await take(page), [C5], "a plain popover inside it pops");
  await page.keyboard.press("Escape");
  assert.deepEqual(await take(page), [E5], "and unpops, though the drawer is open");
  await page.keyboard.press("Escape");
  assert.deepEqual(await take(page), [G4], "the drawer closes as an unsheet");
  await page.close();
});

test("submit sounds only when the form really submits; range detents every tenth", { skip }, async () => {
  const page = await open();
  await on(page);
  await key(page, "#send");
  assert.deepEqual(await take(page), [], "an invalid form stays silent");
  await page.type("#n", "x"); await take(page);
  await key(page, "#send");
  assert.deepEqual(await take(page, 250), [C5, G5]);
  await page.focus("#r");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  assert.deepEqual(await take(page, 250), [], "50 → 54 stays inside one tenth");
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  assert.deepEqual(await take(page, 250), [C5], "54 → 60 crosses one");
  await page.close();
});

test("entrances: one breath, not under reduced motion; calm drops hover", { skip }, async () => {
  const page = await open();
  await on(page);
  await page.evaluate(() => document.getElementById("far").scrollIntoView());
  assert.deepEqual(await take(page, 400), [0], "a noise breath, no contour at standard");
  await page.close();
  const p2 = await open({ reduced: true });
  await on(p2);
  await p2.evaluate(() => document.getElementById("far").scrollIntoView());
  assert.deepEqual(await take(p2, 400), [], "reduced motion: no entrance sound");
  await key(p2, "#plain");
  assert.deepEqual(await take(p2), [E5], "but actions still sound");
  await p2.evaluate(() => (document.documentElement.dataset.motion = "calm"));
  await p2.hover("#l1");
  assert.deepEqual(await take(p2, 300), [], "calm: no hover");
  await p2.close();
});

test("off plays, then silence; an audition plays without turning sound on", { skip }, async () => {
  const page = await open();
  await key(page, "#demo");
  assert.deepEqual(await take(page, 300), [C5], "the audition plays while sound is off");
  await page.mouse.click(2, 2); await page.hover("#l1");
  assert.deepEqual(await take(page, 300), [], "and sound stays off");
  assert.equal(await page.$eval("#toggle", (b) => b.getAttribute("aria-pressed")), "false");
  await on(page);
  await key(page, "#toggle");
  assert.deepEqual(await take(page, 300), [E5, C5], "the falling pair");
  await page.hover("#l2");
  await key(page, "#plain");
  assert.deepEqual(await take(page, 300), [], "silent once off");
  await page.close();
});
