import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds the Exploration Atlas shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>Exploration Atlas<\/title>/i);
  assert.match(html, /id="root"/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships a complete installable PWA", async () => {
  const [html, manifest, sw] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../dist/sw.js", import.meta.url), "utf8"),
  ]);
  assert.match(html, /manifest\.webmanifest/i);
  assert.match(html, /apple-mobile-web-app-capable/i);
  assert.equal(JSON.parse(manifest).orientation, "landscape");
  assert.match(sw, /pose_landmarker_lite\.task/);
  assert.match(sw, /references\/motion\.svg/);
  assert.doesNotMatch(sw, /custom\/intro-film|custom\/background-music/);
});
