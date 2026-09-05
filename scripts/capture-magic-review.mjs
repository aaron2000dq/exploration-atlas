import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { webkit } from "@playwright/test";

const baseURL = process.env.ATLAS_REVIEW_URL ?? "http://127.0.0.1:4174";
const cartographerPin = process.env.ATLAS_CARTOGRAPHER_PIN ?? "2468";
const outputDir = resolve("test-results/magic-review");

await mkdir(outputDir, { recursive: true });

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 1366, height: 1024 },
  permissions: ["geolocation"],
  geolocation: { latitude: 30.3270953, longitude: 120.1834653, accuracy: 18 },
});
const page = await context.newPage();

await page.addInitScript(() => {
  const nativeTimeout = window.setTimeout.bind(window);
  window.setTimeout = ((handler, timeout, ...arguments_) =>
    nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_));
});

async function capture(name) {
  await page.screenshot({ path: resolve(outputDir, `${name}.png`) });
}

async function openCartographer() {
  const compass = page.getByRole("button", { name: "指南针" });
  await compass.dispatchEvent("pointerdown");
  await page.waitForTimeout(70);
  await compass.dispatchEvent("pointerup");
  await page.locator("input[inputmode='numeric']").fill(cartographerPin);
  await page.getByRole("button", { name: "进入" }).click();
}

await page.goto(`${baseURL}/?mode=fulltest&run=magic-visual-review`);
await page.getByRole("button", { name: "开启地图" }).waitFor({ state: "visible" });
await page.waitForTimeout(350);
await capture("01-intro-resting");
await page.getByRole("button", { name: "开启地图" }).click();
await page.waitForTimeout(420);
await capture("02a-seal-release");
await page.waitForTimeout(1_450);
await capture("02b-intro-owl-courier");
await page.waitForTimeout(1_150);
await capture("02c-map-unfolding");
await page.locator(".map-stage").waitFor({ state: "visible" });
await page.waitForTimeout(2_600);
await capture("03-map-settled");

await page.getByRole("button", { name: "停车完毕，开始探索" }).click();
await openCartographer();
await page.getByRole("button", { name: "强制抵达" }).click();
await page.locator("[data-celebration='arrival']").waitFor({ state: "visible" });
await page.waitForTimeout(420);
await capture("04-coordinate-arrival");
await page.locator("[data-celebration='arrival']").waitFor({ state: "hidden" });

await page.getByRole("button", { name: "开启照片复刻" }).click();
await page.locator(".camera-modal").waitFor({ state: "visible" });
await page.waitForTimeout(420);
await capture("05-photo-memory-gate");
await page.locator("input[data-role='capture-photo']").first().setInputFiles("public/references/scent.svg");
await page.getByRole("button", { name: "开始匹配" }).click();
await page.locator(".photo-comparison.is-scanning-memory").waitFor({ state: "visible" });
await page.waitForTimeout(460);
await capture("05b-photo-memory-scanning");
await page.locator(".unlock-card").waitFor({ state: "visible" });
await page.locator("[data-celebration='photo']").waitFor({ state: "hidden" });
await capture("06-gift-unlock");

await page.getByRole("button", { name: "返回载具" }).click();
await page.getByRole("button", { name: "我已停车，展开下一片地图" }).click();
for (let zoneIndex = 0; zoneIndex < 2; zoneIndex += 1) {
  await openCartographer();
  await page.getByRole("button", { name: "强制过关" }).click();
  await page.getByRole("button", { name: "返回载具" }).click();
  await page.getByRole("button", { name: "我已停车，展开下一片地图" }).click();
}
for (const action of ["点亮下一个坐标", "点亮下一个坐标"]) {
  await openCartographer();
  await page.getByRole("button", { name: "强制过关" }).click();
  await page.getByRole("button", { name: action }).click();
}
await page.getByRole("button", { name: "打开最后一封信" }).click();
await page.locator("[data-celebration='arrival']").waitFor({ state: "hidden" }).catch(() => undefined);
await page.locator(".unlock-card").waitFor({ state: "visible" });
await page.waitForTimeout(320);
await capture("07-love-unlock");
await page.getByRole("button", { name: "完成探索" }).click();
await page.locator(".finale-screen").waitFor({ state: "visible" });
await capture("08-finale");

await browser.close();
