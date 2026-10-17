import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeIco } from "../lib/ico.js";

// Smallest valid PNG-looking payloads are enough: the encoder only wraps them.
const png = (n) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(n, 1)]);

test("encodeIco writes an ICO header, one directory entry per image and the PNG payloads at the stated offsets", () => {
  const a = png(20), b = png(30), c = png(40);
  const ico = encodeIco([{ size: 16, png: a }, { size: 32, png: b }, { size: 48, png: c }]);
  // header: reserved 0, type 1 (icon), count 3
  assert.deepEqual([...ico.subarray(0, 6)], [0, 0, 1, 0, 3, 0]);
  const dirStart = 6, entry = 16;
  const headerLen = dirStart + 3 * entry;
  const expectOffsets = [headerLen, headerLen + a.length, headerLen + a.length + b.length];
  [a, b, c].forEach((p, i) => {
    const e = ico.subarray(dirStart + i * entry, dirStart + (i + 1) * entry);
    assert.equal(e[0], [16, 32, 48][i], "width byte");
    assert.equal(e[1], [16, 32, 48][i], "height byte");
    assert.equal(e.readUInt16LE(4), 1, "colour planes");
    assert.equal(e.readUInt16LE(6), 32, "bits per pixel");
    assert.equal(e.readUInt32LE(8), p.length, "payload size");
    assert.equal(e.readUInt32LE(12), expectOffsets[i], "payload offset");
    assert.deepEqual(ico.subarray(expectOffsets[i], expectOffsets[i] + p.length), p);
  });
  assert.equal(ico.length, headerLen + a.length + b.length + c.length);
});

test("a 256 px image is encoded with width/height byte 0 per the ICO format", () => {
  const ico = encodeIco([{ size: 256, png: png(10) }]);
  assert.equal(ico[6], 0);
  assert.equal(ico[7], 0);
});
