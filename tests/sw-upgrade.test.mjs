import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { webkit } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const legacyRoot = path.join(here, "fixtures", "legacy-pwa");
const currentRoot = path.resolve(here, "..", "dist");

const mime = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".task": "application/octet-stream",
  ".wasm": "application/wasm",
};

test("an installed v1 worker is replaced without interrupting an already-open atlas", async () => {
  let root = legacyRoot;
  const server = createServer(async (request, response) => {
    if (request.url === "/__switch") {
      root = currentRoot;
      response.writeHead(204).end();
      return;
    }

    const pathname = new URL(request.url, "http://localhost").pathname;
    const requested = pathname === "/" ? "index.html" : pathname.slice(1);
    let file = path.join(root, requested);
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const body = await readFile(file);
      response.writeHead(200, {
        "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": pathname === "/sw.js" ? "no-store" : "no-cache",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  await new Promise((resolve) => server.listen(4180, "127.0.0.1", resolve));
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("http://127.0.0.1:4180/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.getByRole("heading", { name: "LEGACY LINE MAP" }).waitFor();
    assert.deepEqual(await page.evaluate(() => caches.keys()), ["exploration-atlas-v1"]);
    await page.evaluate(() => {
      window.__atlasUpdateMessages = [];
      navigator.serviceWorker.addEventListener("message", (event) => {
        window.__atlasUpdateMessages.push(event.data);
      });
    });

    let navigations = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigations += 1;
    });

    await page.request.get("http://127.0.0.1:4180/__switch");
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });

    await page.waitForFunction(
      () => window.__atlasUpdateMessages?.some((message) => message?.type === "ATLAS_UPDATED"),
      undefined,
      { timeout: 30_000 },
    );

    assert.equal(navigations, 0, "the active experience must not be reloaded during an update");
    assert.equal(await page.getByRole("heading", { name: "LEGACY LINE MAP" }).count(), 1);
    assert.equal(await page.getByRole("heading", { name: "Exploration Atlas" }).count(), 0);

    const cacheNames = await page.evaluate(() => caches.keys());
    assert.equal(
      cacheNames.some(
        (name) => name.startsWith("exploration-atlas-") && name !== "exploration-atlas-v1",
      ),
      true,
    );

    await page.reload();
    await page.getByRole("heading", { name: "Exploration Atlas" }).waitFor({ timeout: 30_000 });
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
