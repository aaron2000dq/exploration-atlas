import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("exploration-atlas:intro-film-played-v1", "true");
  });
});

async function openCartographer(page: import("@playwright/test").Page) {
  const compass = page.getByRole("button", { name: "指南针" });
  await compass.dispatchEvent("pointerdown");
  await page.waitForTimeout(70);
  await compass.dispatchEvent("pointerup");
  await page.locator("input[inputmode='numeric']").fill("2468");
  await page.getByRole("button", { name: "进入" }).click();
  await expect(page.getByRole("heading", { name: "制图人控制台" })).toBeVisible();
}

test("starts at the web letter when the optional intro film is disabled", async ({ page }) => {
  await page.goto("/?run=e2e-no-film&intro=1");

  await expect(page.locator(".intro-film-overlay")).toHaveCount(0);
  await expect(page.locator(".intro-film-video")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "开启地图" })).toBeVisible();
  await expect(page.getByRole("button", { name: "重看片头" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "第一次查看？进入无需定位的完整演示" })).toBeVisible();
});

test("lets a first-time visitor finish the public demo without being in Hangzhou", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    let demoGeolocationWatchCount = 0;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: () => {
          demoGeolocationWatchCount += 1;
          return 1;
        },
        clearWatch: () => undefined,
      },
    });
    Object.defineProperty(window, "__demoGeolocationWatchCount", {
      configurable: true,
      get: () => demoGeolocationWatchCount,
    });
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 4_650 ? 40 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?run=e2e-newcomer-demo-entry");
  await page.getByRole("link", { name: "第一次查看？进入无需定位的完整演示" }).click();
  await expect(page).toHaveURL(/\?mode=demo$/);
  await expect(page.getByText("PUBLIC DEMO · 不读取真实定位")).toBeVisible();

  await page.getByRole("button", { name: "开启地图" }).click();
  for (const [gift, continuation] of [
    ["好听的", "带着这一页返回飞行扫帚"],
    ["好用的", "带着这一页返回飞行扫帚"],
    ["好闻的", "寻找下一枚未知坐标"],
    ["好看的", "寻找下一枚未知坐标"],
    ["好吃的", "寻找下一枚未知坐标"],
  ] as const) {
    await page.getByRole("button", { name: "模拟抵达当前地点" }).click();
    await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
    await page.getByRole("button", { name: "跳过照片，查看揭晓" }).click();
    await expect(page.locator(".unlock-card h2")).toContainText(gift);
    await expect(page.getByText(/照片匹配度/)).toHaveCount(0);
    await page.getByRole("button", { name: continuation }).click();
    if (continuation === "带着这一页返回飞行扫帚") {
      await page.getByRole("button", { name: "我已停车，翻开下一页" }).click();
    }
  }

  await expect(page.getByText("最后一页不需要定位，直接打开信件。")).toBeVisible();
  await page.getByRole("button", { name: "打开最后一封信" }).click();
  await page.getByRole("button", { name: "翻开新一岁的第一章" }).click();
  await expect(page.getByRole("heading", { name: "Exploration Completed" })).toBeVisible();
  await expect(page.getByText("完整流程已走通，可以从头重新彩排。")).toBeVisible();
  expect(await page.evaluate(() =>
    (window as typeof window & { __demoGeolocationWatchCount: number }).__demoGeolocationWatchCount
  )).toBe(0);
});

test("opens the atlas and exposes a complete no-dead-end fallback", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await page.getByRole("button", { name: "开启地图" }).click();
  await expect(page.locator(".intro-screen")).toHaveClass(/is-opening/);
  await expect(page.locator(".intro-map-sheet")).toHaveCount(0);
  await expect(page.getByText("第一枚未知坐标")).toBeVisible({ timeout: 7_000 });
  await expect(page.locator("image.illustrated-base-map")).toHaveAttribute("href", "/assets/maps/jingwei-sound-v3.jpg");
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();

  const compass = page.getByRole("button", { name: "指南针" });
  await compass.dispatchEvent("pointerdown");
  await expect(compass).toHaveClass(/is-holding/);
  expect(
    await compass.locator(".compass-hold-progress circle").evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("compassHoldProgress");
  await compass.dispatchEvent("pointermove", { pointerId: 1, clientX: -20, clientY: -20 });
  await page.waitForTimeout(3_100);
  await compass.dispatchEvent("pointerup");
  await expect(page.getByRole("heading", { name: "输入制图人口令" })).toBeVisible();
  await page.locator("input[inputmode='numeric']").fill("2468");
  await page.getByRole("button", { name: "进入" }).click();
  await expect(page.getByRole("heading", { name: "制图人控制台" })).toBeVisible();
  await page.getByRole("button", { name: "强制抵达" }).click();
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
});

test("does not render optional soundtrack controls until music is enabled", async ({ page }) => {
  await page.goto("/?run=e2e-no-background-track");
  await expect(page.locator(".music-toggle")).toHaveCount(0);
  await expect(page.locator(".atlas-background-audio")).toHaveCount(0);
});

test("keeps the formal finale clean while retaining reset only in rehearsal flows", async ({ page }) => {
  await page.goto("/?run=e2e-formal-finale");
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("exploration-atlas-formal-e2e-formal-finale");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction("state", "readwrite");
        transaction.objectStore("state").put({
          activeZoneId: "exploration-main",
          activeCheckpointId: "hidden-love",
          completedCheckpointIds: [
            "vinyl-sound",
            "liv-motion",
            "aesop-scent",
            "dior-sparkle",
            "ruich-taste",
            "hidden-love",
          ],
          photoAttempts: {},
          capturedPhotoIds: [],
          phase: "finale",
          zoneStarted: true,
          arrivedCheckpointIds: [
            "vinyl-sound",
            "liv-motion",
            "aesop-scent",
            "dior-sparkle",
            "ruich-taste",
          ],
        }, "progress");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Exploration Completed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "重新彩排" })).toHaveCount(0);
});

test("renders a layered magical atmosphere without blocking the atlas", async ({ page }) => {
  await page.goto("/?mode=fulltest&run=e2e-magical-atmosphere");
  await expect(page.locator(".magic-atmosphere")).toHaveAttribute("data-phase", "intro");
  await expect(page.locator(".ambient-motes i")).toHaveCount(12);
  await expect(page.locator(".rune-dial")).toHaveCount(2);
  await expect(page.locator(".enchanted-quill")).toBeVisible();
  await expect(page.locator(".courier-owl")).toHaveCount(1);
  await expect(page.locator(".envelope-prop")).toBeVisible();
  await expect(page.locator(".intro-wax-trigger")).toBeVisible();
  const openingVine = page.locator(".opening-letter > .magic-micro-vine");
  await expect(openingVine).not.toHaveClass(/is-active/);
  await expect(page.locator(".micro-vine-growth-art")).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "开启地图" }).click();
  await expect(openingVine).toHaveClass(/is-active/);
  expect(
    await page.locator(".vine-reveal-up").evaluate((element) => getComputedStyle(element).animationName),
  ).toContain("vineMaskGrow");
  expect(
    await page.locator(".vine-growth-trace-right").evaluate((element) => getComputedStyle(element).animationName),
  ).toContain("vineGrowthTrace");
  await expect(page.locator(".owl-flight-shadow")).toHaveCount(1);
  await expect(page.locator(".owl-wind-lanes i")).toHaveCount(4);
  await expect(page.locator(".owl-feather-burst i")).toHaveCount(6);
  await expect(page.locator(".cinematic-fog")).toHaveCount(2);
  await expect(page.locator(".cinematic-owl-sprite")).toHaveCount(1);
  await expect(page.locator(".atlas-gilded-frame")).toBeVisible();
  await expect(page.locator(".atlas-constellation-veil")).toHaveCount(2);

  await expect(page.locator(".map-magic-overlay")).toBeVisible({ timeout: 7_000 });
  await expect(page.locator(".map-reveal-veil")).toHaveCount(0);
  await expect(page.locator(".map-illustration-loading")).toHaveCount(0);
  await expect(page.locator(".map-arcane-fog")).toHaveCount(2);
  await expect(page.locator(".theme-ambient")).toHaveCount(1);
  await expect(page.locator(".theme-ambient")).toHaveAttribute("data-theme", "sound");
  await expect(page.locator(".theme-trace")).toHaveCount(1);
  await expect(page.locator(".theme-particles i")).toHaveCount(12);
  await expect(page.locator(".theme-light-blooms i")).toHaveCount(3);
  await expect(page.locator(".chapter-cinematic-asset")).toHaveCount(0);
  expect(
    await page.locator(".theme-particles i").first().evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("soundNotePhrase");
  await expect(page.locator(".ink-constellation circle")).toHaveCount(6);
  await expect(page.locator(".chapter-relic[data-gift='mystery']")).toBeVisible();
  await expect(page.locator(".you-magic-orbit")).toBeVisible();
  await expect(page.locator(".route-path-aura")).toBeVisible();
  await expect(page.locator(".quest-medallion")).toBeVisible();
  await expect(page.locator(".quest-card > .magic-micro-ripple")).toBeVisible();
  expect(
    await page.locator(".micro-ripple-ring").first().evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("microWaterRipple");
  await expect(page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(false);
});

test("loads the self-hosted Chinese and English atlas type system", async ({ page }) => {
  await page.goto("/?mode=fulltest&run=e2e-atlas-fonts");
  const loadedFonts = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('16px "Atlas Serif SC"', "探索地图"),
      document.fonts.load('16px "Atlas Display"', "EXPLORATION"),
      document.fonts.load('16px "Atlas Inscription"', "XXVIII"),
    ]);
    return {
      serif: document.fonts.check('16px "Atlas Serif SC"', "探索地图"),
      display: document.fonts.check('16px "Atlas Display"', "EXPLORATION"),
      inscription: document.fonts.check('16px "Atlas Inscription"', "XXVIII"),
    };
  });
  expect(loadedFonts).toEqual({ serif: true, display: true, inscription: true });
  await expect(page.locator("body")).toHaveCSS("font-family", /Atlas Serif SC/);
  await expect(page.locator(".opening-letter h1")).toHaveCSS("font-family", /Atlas Display/);
  await expect(page.locator(".opening-letter .eyebrow")).toHaveCSS("font-family", /Atlas Inscription/);

  for (const asset of [
    "/assets/fonts/atlas-serif-sc-v1.woff2",
    "/assets/fonts/atlas-display-v1.woff2",
    "/assets/fonts/atlas-inscription-v1.woff2",
  ]) {
    expect((await page.request.get(asset)).ok()).toBe(true);
  }
});

test("keeps the first-play delivery cinematic geometrically stable", async ({ page }) => {
  await page.goto("/?mode=fulltest&run=e2e-intro-compositor-stability");
  await expect(page.locator(".atlas-shell")).toHaveAttribute("data-intro-assets", "ready");
  await expect(page.locator(".intro-map-sheet")).toHaveCount(0);
  await expect(page.locator(".intro-atlas-reveal")).toHaveCount(0);
  await expect(page.locator(".opening-letter")).toHaveCSS("filter", "none");

  const intro = page.locator(".intro-screen");
  const initial = await intro.boundingBox();
  expect(initial).not.toBeNull();
  await page.getByRole("button", { name: "开启地图" }).click();

  const heights: number[] = [];
  const widths: number[] = [];
  const tops: number[] = [];
  for (let index = 0; index < 12; index += 1) {
    await page.waitForTimeout(50);
    const frame = await page.evaluate(() => {
      const introElement = document.querySelector<HTMLElement>(".intro-screen");
      const letter = document.querySelector<HTMLElement>(".opening-letter");
      const map = document.querySelector<SVGImageElement>("image.illustrated-base-map");
      const visible = (element: Element | null) => {
        if (!element) return false;
        const style = getComputedStyle(element);
        const bounds = element.getBoundingClientRect();
        return style.display !== "none" && Number(style.opacity) > .1 && bounds.width > 0 && bounds.height > 0;
      };
      const bounds = introElement?.getBoundingClientRect();
      return {
        hasVisibleContent: visible(letter) || visible(map),
        introBounds: bounds ? { height: bounds.height, width: bounds.width, top: bounds.top } : null,
      };
    });
    expect(frame.hasVisibleContent).toBe(true);
    if (frame.introBounds) {
      heights.push(frame.introBounds.height);
      widths.push(frame.introBounds.width);
      tops.push(frame.introBounds.top);
    }
  }

  expect(heights.length).toBeGreaterThan(3);
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
  await expect(page.locator(".map-stage")).toBeVisible({ timeout: 7_000 });
  await expect(page.locator("image.illustrated-base-map")).toHaveCSS("opacity", "1");
});

test("keeps the magical interface usable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?mode=fulltest&run=e2e-magic-reduced-motion");
  await expect(page.locator(".courier-owl")).toHaveCSS("display", "none");
  await expect(page.locator(".owl-flight-shadow")).toHaveCSS("display", "none");
  await expect(page.locator(".owl-wind-lanes")).toHaveCSS("display", "none");
  await expect(page.locator(".owl-feather-burst")).toHaveCSS("display", "none");
  await page.getByRole("button", { name: "开启地图" }).click();
  await expect(page.locator(".map-stage")).toBeVisible();
  await expect(page.locator(".quest-card > .magic-micro-effect")).toHaveCSS("display", "none");
  await expect(page.locator(".theme-ambient")).toHaveCSS("display", "none");
  await expect(page.locator(".chapter-relic[data-gift='mystery']")).toBeVisible();
  await expect(page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" })).toBeEnabled();
});

test("automatically arrives after two accurate nearby location samples", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["geolocation"], { origin: new URL(baseURL!).origin });
  await context.setGeolocation({ latitude: 30.3270953, longitude: 120.1834653, accuracy: 18 });
  await page.goto("/");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await context.setGeolocation({ latitude: 30.32694, longitude: 120.1852, accuracy: 16 });
  await page.waitForTimeout(100);
  await context.setGeolocation({ latitude: 30.326913, longitude: 120.18552, accuracy: 14 });
  await page.waitForTimeout(100);
  await context.setGeolocation({ latitude: 30.3269132, longitude: 120.1855202, accuracy: 13 });
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
  await expect(page.locator("[data-celebration='arrival']")).toBeVisible();
  await expect(page.locator(".arrival-rune-seal")).toBeVisible();
  await expect(page.locator(".arrival-copy strong")).toHaveText("聆翔文化");
  await expect(page.getByText("坐标已回应")).toBeVisible();
  expect(
    await page.locator(".arrival-copy strong").evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeGreaterThanOrEqual(48);
  await expect(page.locator(".quest-card h2")).toContainText("聆翔文化");
  expect(
    await page.locator(".quest-card h2").evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
  ).toBeGreaterThanOrEqual(34);
  await expect(page.locator(".goal-arrival-ripple")).toHaveCount(2);
  await expect(page.getByText("精度 ±13m")).toBeVisible();
  await expect(page.locator(".paw-trail").first()).toBeVisible();
  await expect(page.locator(".paw-trail").first().locator(".paw-toe")).toHaveCount(4);
  await expect(page.locator(".paw-trail").first().locator(".paw-ripple")).toHaveCount(2);
  expect(
    await page.locator(".paw-trail").first().evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("pawTrailLifecycle");
  await expect(page.locator(".paw-trail").first()).toHaveCSS("animation-duration", "9s");
  await expect(page.locator(".you-marker")).toBeVisible();
  await expect(page.locator("[data-celebration='arrival']")).toHaveCount(0, { timeout: 3_000 });
  await page.getByRole("button", { name: "开启照片复刻" }).click();
  await expect(page.getByAltText("制图人预先拍摄的模特参考照片")).toHaveAttribute(
    "src",
    "/references/sound.svg",
  );
  await expect(page.locator(".reference-pending")).toContainText("当前为示意图");
});

test("moves outside the suggested first-route start and lets the live compass override walking course", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["geolocation"], { origin: new URL(baseURL!).origin });
  await context.setGeolocation({ latitude: 30.3270153, longitude: 120.1833853, accuracy: 20 });
  await page.addInitScript(() => {
    if (!("DeviceOrientationEvent" in window)) {
      Object.defineProperty(window, "DeviceOrientationEvent", {
        configurable: true,
        value: class DeviceOrientationEvent extends Event {},
      });
    }
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 4_650 ? 40 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?run=e2e-formal-field-movement-v3");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();

  const marker = page.locator(".you-marker");
  const goal = page.locator(".goal-point");
  await expect(marker).toHaveAttribute("data-map-x", /\d/);
  const first = {
    x: Number(await marker.getAttribute("data-map-x")),
    y: Number(await marker.getAttribute("data-map-y")),
  };
  expect(first.x).toBeLessThan(Number(await goal.getAttribute("data-map-x")));

  await context.setGeolocation({ latitude: 30.3270953, longitude: 120.1834653, accuracy: 19 });
  await expect.poll(async () => {
    const x = Number(await marker.getAttribute("data-map-x"));
    const y = Number(await marker.getAttribute("data-map-y"));
    return Math.hypot(x - first.x, y - first.y);
  }).toBeGreaterThan(5);
  await context.setGeolocation({ latitude: 30.3271753, longitude: 120.1835453, accuracy: 18 });
  await expect(marker).toHaveAttribute("data-heading", /\d+/);
  await page.evaluate(() => {
    const event = new Event("deviceorientation");
    Object.defineProperty(event, "webkitCompassHeading", { value: 44 });
    window.dispatchEvent(event);
  });
  await expect(marker).toHaveAttribute("data-heading", "224");

  // Walking must not replace the calibrated device-facing direction with a
  // GPS-derived course or an alpha-only event from another reference frame.
  await context.setGeolocation({ latitude: 30.3272553, longitude: 120.1836253, accuracy: 18 });
  await page.evaluate(() => {
    const event = new Event("deviceorientation");
    Object.defineProperty(event, "alpha", { value: 224 });
    Object.defineProperty(event, "absolute", { value: false });
    window.dispatchEvent(event);
  });
  await expect(marker).toHaveAttribute("data-heading", "224");
  await expect(page.locator(".paw-trail").first()).toBeVisible();
});

test("freezes the dot and resets arrival streak for coarse location samples", async ({ page, context, baseURL }) => {
  const parking = { latitude: 30.3270953, longitude: 120.1834653, accuracy: 18 };
  const target = { latitude: 30.326913, longitude: 120.18552, accuracy: 18 };
  await context.grantPermissions(["geolocation"], { origin: new URL(baseURL!).origin });
  await context.setGeolocation(parking);
  await page.goto("/?mode=fulltest&run=e2e-coarse-location-gate");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();

  const marker = page.locator(".you-marker");
  await expect(marker).toHaveAttribute("data-map-x", /\d/);
  const before = {
    x: await marker.getAttribute("data-map-x"),
    y: await marker.getAttribute("data-map-y"),
  };

  await context.setGeolocation({ ...target, accuracy: 500 });
  await expect(page.getByText("墨点已冻结")).toBeVisible();
  await expect(marker).toHaveAttribute("data-map-x", before.x!);
  await expect(marker).toHaveAttribute("data-map-y", before.y!);
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toHaveCount(0);

  await context.setGeolocation(target);
  await page.waitForTimeout(120);
  await context.setGeolocation({ ...target, accuracy: 500 });
  await expect(page.getByText("墨点已冻结")).toBeVisible();
  await context.setGeolocation({ ...target, latitude: target.latitude + 0.000001 });
  await page.waitForTimeout(120);
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toHaveCount(0);
  await context.setGeolocation({ ...target, latitude: target.latitude + 0.000002 });
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
});

test("uses two breathing dots and rotates the current-position arrow", async ({ page }) => {
  await page.addInitScript(() => {
    if (!("DeviceOrientationEvent" in window)) {
      Object.defineProperty(window, "DeviceOrientationEvent", {
        configurable: true,
        value: class DeviceOrientationEvent extends Event {},
      });
    }
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-point-markers");
  await page.getByRole("button", { name: "开启地图" }).click();

  await expect(page.locator(".goal-point")).toBeVisible({ timeout: 7_000 });
  await expect(page.locator(".goal-tag")).toContainText("GOAL");
  await expect(page.locator(".you-marker")).toBeVisible();
  await expect(page.locator(".atlas-point .point-glow")).toHaveCount(2);
  await expect(page.locator(".parking-mark, .checkpoint-mark")).toHaveCount(0);
  await expect(page.locator(".you-marker text")).toHaveCount(0);
  expect(
    await page.locator(".point-glow").first().evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("atlasPointBreath");

  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await page.evaluate(() => {
    const event = new Event("deviceorientation");
    Object.defineProperty(event, "webkitCompassHeading", { value: 123 });
    window.dispatchEvent(event);
  });
  await expect(page.locator(".you-marker")).toHaveAttribute("data-heading", "303");
  await expect(page.locator(".you-heading-arrow")).toHaveAttribute("transform", "rotate(303)");

  await openCartographer(page);
  await expect(page.getByText("方向来源：设备罗盘 · 当前总补偿：180°")).toBeVisible();
  await page.getByRole("button", { name: "方向翻转 180°并返回地图" }).click();
  await expect(page.getByRole("heading", { name: "制图人控制台" })).toHaveCount(0);
  await expect(page.locator(".you-marker")).toHaveAttribute("data-heading", "123");

  await openCartographer(page);
  await page.getByRole("button", { name: "关闭方向指示并返回地图" }).click();
  await expect(page.locator(".you-marker")).toBeVisible();
  await expect(page.locator(".you-heading-arrow")).toHaveCount(0);
});

test("compensates the compass for an iPad landscape screen", async ({ page }) => {
  await page.addInitScript(() => {
    if (!("DeviceOrientationEvent" in window)) {
      Object.defineProperty(window, "DeviceOrientationEvent", {
        configurable: true,
        value: class DeviceOrientationEvent extends Event {},
      });
    }
  });
  await page.goto("/?mode=fulltest&run=e2e-landscape-heading");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await page.evaluate(() => {
    Object.defineProperty(window.screen.orientation, "angle", {
      configurable: true,
      get: () => 90,
    });
    const event = new Event("deviceorientation");
    Object.defineProperty(event, "webkitCompassHeading", { value: 123 });
    window.dispatchEvent(event);
  });
  await expect(page.locator(".you-marker")).toHaveAttribute("data-heading", "213");
  await expect(page.locator(".you-heading-arrow")).toHaveAttribute("transform", "rotate(213)");
});

test("uses the iPad legacy quarter-turn when Screen Orientation is stuck at zero", async ({ page }) => {
  await page.addInitScript(() => {
    if (!("DeviceOrientationEvent" in window)) {
      Object.defineProperty(window, "DeviceOrientationEvent", {
        configurable: true,
        value: class DeviceOrientationEvent extends Event {},
      });
    }
    Object.defineProperty(window.screen.orientation, "angle", {
      configurable: true,
      get: () => 0,
    });
    Object.defineProperty(window, "orientation", {
      configurable: true,
      get: () => 90,
    });
  });
  await page.goto("/?mode=fulltest&run=e2e-legacy-landscape-heading");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await page.evaluate(() => {
    const event = new Event("deviceorientation");
    Object.defineProperty(event, "webkitCompassHeading", { value: 123 });
    window.dispatchEvent(event);
  });
  await expect(page.locator(".you-marker")).toHaveAttribute("data-heading", "213");
});

test("uses the physical iPad landscape side when screen orientation reports the opposite side", async ({ page }) => {
  await page.addInitScript(() => {
    if (!("DeviceOrientationEvent" in window)) {
      Object.defineProperty(window, "DeviceOrientationEvent", {
        configurable: true,
        value: class DeviceOrientationEvent extends Event {},
      });
    }
    Object.defineProperty(window.screen.orientation, "angle", {
      configurable: true,
      get: () => 90,
    });
    Object.defineProperty(window, "orientation", {
      configurable: true,
      get: () => 270,
    });
  });
  await page.goto("/?mode=fulltest&run=e2e-opposite-landscape-heading");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await page.evaluate(() => {
    const event = new Event("deviceorientation");
    Object.defineProperty(event, "webkitCompassHeading", { value: 123 });
    window.dispatchEvent(event);
  });
  await expect(page.locator(".you-marker")).toHaveAttribute("data-heading", "33");
  await expect(page.locator(".you-heading-arrow")).toHaveAttribute("transform", "rotate(33)");
});

test("moves the explorer dot from live coordinates and force-arrival never teleports it", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["geolocation"], { origin: new URL(baseURL!).origin });
  await context.setGeolocation({ latitude: 30.3270953, longitude: 120.1834653, accuracy: 18 });
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-live-dot-v2");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();

  const marker = page.locator(".you-marker");
  await expect(marker).toHaveAttribute("data-map-y", /\d/);
  const before = {
    x: Number(await marker.getAttribute("data-map-x")),
    y: Number(await marker.getAttribute("data-map-y")),
  };
  await context.setGeolocation({ latitude: 30.32696, longitude: 120.18415, accuracy: 18 });
  await expect.poll(async () => {
    const x = Number(await marker.getAttribute("data-map-x"));
    const y = Number(await marker.getAttribute("data-map-y"));
    return Math.hypot(x - before.x, y - before.y);
  }).toBeGreaterThan(10);
  await expect(marker).toHaveAttribute("data-heading", /\d+/);
  await expect(page.locator(".paw-trail").first()).toBeVisible();

  const beforeForce = {
    x: await marker.getAttribute("data-map-x"),
    y: await marker.getAttribute("data-map-y"),
  };
  await openCartographer(page);
  await page.getByRole("button", { name: "强制抵达" }).click();
  await expect(marker).toHaveAttribute("data-map-x", beforeForce.x!);
  await expect(marker).toHaveAttribute("data-map-y", beforeForce.y!);
});

test("keeps the retired nearby mode on the public example experience", async ({ page }) => {
  await page.goto("/?mode=nearby");
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await expect(page.locator(".nearby-route")).toHaveCount(0);
});

test("keeps the map immersive with a collapsible floating quest card", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-immersive-map");
  await page.getByRole("button", { name: "开启地图" }).click();

  const map = page.locator(".map-stage");
  const card = page.locator(".floating-quest-card");
  await expect(card).toHaveClass(/is-collapsed/, { timeout: 15_000 });
  await expect(page.locator(".quest-clue")).toHaveCount(0);
  expect(await map.evaluate((element) => getComputedStyle(element).position)).toBe("relative");
  expect(await card.evaluate((element) => getComputedStyle(element).position)).toBe("absolute");
  const [mapBox, cardBox, viewport] = await Promise.all([
    map.boundingBox(),
    card.boundingBox(),
    page.evaluate(() => innerWidth),
  ]);
  expect(mapBox!.width / viewport).toBeGreaterThan(0.98);
  expect(cardBox!.x).toBeLessThan(viewport / 2);
  await expect(page.locator(".map-tools")).toHaveCSS("right", "20px");

  await page.getByRole("button", { name: "查看线索" }).click();
  await expect(card).toHaveClass(/is-expanded/);
  await expect(page.locator(".quest-clue")).toBeVisible();
  await map.click({ position: { x: 700, y: 260 } });
  await expect(card).toHaveClass(/is-collapsed/);

  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制抵达" }).click();
  await expect(card).toHaveClass(/is-expanded/);
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
});

test("conceals every first coordinate answer until arrival, then reveals it together", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout === 4_650 ? 40 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-no-spoilers");
  await page.getByRole("button", { name: "开启地图" }).click();

  await expect(page.locator(".topbar b")).toHaveText("PAST CHAPTER · THE FIRST ECHO");
  await expect(page.locator(".map-cartouche .map-title")).toHaveText("PAST CHAPTER · THE FIRST ECHO");
  await expect(page.locator(".quest-card h2")).toContainText("第一枚未知坐标");
  await expect(page.locator(".chapter-relic[data-gift='mystery']")).toBeVisible();
  await expect(page.locator(".chapter-relic[data-gift='sound']")).toHaveCount(0);
  await expect(page.getByText("好听的", { exact: true })).toHaveCount(0);
  await expect(page.getByText("聆翔文化", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel(/目的地 聆翔文化/)).toHaveCount(0);
  await expect(page.getByLabel("尚未揭晓的目的地")).toBeVisible();

  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制抵达" }).click();

  await expect(page.locator(".topbar b")).toHaveText("Jingwei · Sound District");
  await expect(page.locator(".quest-card h2")).toContainText("好听的");
  await expect(page.locator(".quest-card h2")).toContainText("聆翔文化");
  await expect(page.locator(".chapter-relic[data-gift='sound']")).toBeVisible();
  await expect(page.locator(".chapter-relic[data-gift='mystery']")).toHaveCount(0);
});

test("restores the current unlocked checkpoint after a refresh", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["geolocation"], { origin: new URL(baseURL!).origin });
  await context.setGeolocation({ latitude: 30.3270953, longitude: 120.1834653, accuracy: 18 });
  await page.goto("/");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await context.setGeolocation({ latitude: 30.32694, longitude: 120.1852, accuracy: 16 });
  await page.waitForTimeout(100);
  await context.setGeolocation({ latitude: 30.326913, longitude: 120.18552, accuracy: 14 });
  await page.waitForTimeout(100);
  await context.setGeolocation({ latitude: 30.3269132, longitude: 120.1855202, accuracy: 13 });
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
  await page.reload();
  await expect(page.locator(".topbar b")).toHaveText("Jingwei · Sound District");
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
});

test("places the fifth formal goal at RUICH T1 and unlocks there", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["geolocation"], { origin: new URL(baseURL!).origin });
  await context.setGeolocation({ latitude: 30.2512, longitude: 120.2082, accuracy: 16 });
  await page.goto("/?run=e2e-ruich-goal");
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await page.waitForTimeout(250);
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("exploration-atlas-formal-e2e-ruich-goal");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction("state", "readwrite");
        transaction.objectStore("state").put({
          activeZoneId: "exploration-main",
          activeCheckpointId: "ruich-taste",
          completedCheckpointIds: ["vinyl-sound", "liv-motion", "aesop-scent", "dior-sparkle"],
          photoAttempts: {},
          capturedPhotoIds: [],
          phase: "map",
          zoneStarted: true,
          arrivedCheckpointIds: [],
        }, "progress");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.reload();

  await expect(page.locator(".quest-card h2")).toContainText("第五枚未知坐标");
  await expect(page.locator("image.illustrated-base-map")).toHaveAttribute(
    "href",
    "/assets/maps/qianjiang-grand-north-v4.png",
  );
  await expect(page.locator(".goal-point")).toHaveAttribute("data-map-x", "394.2");
  await expect(page.locator(".goal-point")).toHaveAttribute("data-map-y", "222.9");

  await context.setGeolocation({ latitude: 30.2509232, longitude: 120.2078163, accuracy: 14 });
  await page.waitForTimeout(120);
  await context.setGeolocation({ latitude: 30.2509233, longitude: 120.2078164, accuracy: 13 });
  await page.waitForTimeout(120);
  await context.setGeolocation({ latitude: 30.2509234, longitude: 120.2078165, accuracy: 12 });

  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
  await expect(page.locator(".quest-card h2")).toContainText("RUICH");
  await expect(page.getByText("坐标已回应")).toBeVisible();
});

test("shows the replaceable Aesop example image on the first third-map task", async ({ page }) => {
  await page.goto("/?run=e2e-third-map-reference");
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await page.waitForTimeout(250);
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("exploration-atlas-formal-e2e-third-map-reference");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction("state", "readwrite");
        transaction.objectStore("state").put({
          activeZoneId: "exploration-main",
          activeCheckpointId: "aesop-scent",
          completedCheckpointIds: ["vinyl-sound", "liv-motion"],
          photoAttempts: {},
          capturedPhotoIds: [],
          phase: "map",
          zoneStarted: true,
          arrivedCheckpointIds: ["aesop-scent"],
        }, "progress");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "开启照片复刻" }).click();
  await expect(page.getByAltText("制图人预先拍摄的模特参考照片")).toHaveAttribute(
    "src",
    "/references/scent.svg",
  );
  await expect(page.locator(".reference-pending")).toContainText("当前为示意图");
});

test("isolates a named formal preview run from previously saved formal progress", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开启地图" }).click();
  await expect(page.getByText("第一枚未知坐标")).toBeVisible({ timeout: 7_000 });

  await page.goto("/?run=e2e-formal-isolated");
  await expect(page.locator(".intro-screen")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await page.getByRole("button", { name: "开启地图" }).click();
  await expect(page.getByText("第一枚未知坐标")).toBeVisible({ timeout: 7_000 });
  await expect(page.locator("image.illustrated-base-map")).toHaveAttribute(
    "href",
    "/assets/maps/jingwei-sound-v3.jpg",
  );

  expect(await page.evaluate(async () => {
    const databases = await indexedDB.databases();
    return databases.map((database) => database.name);
  })).toContain("exploration-atlas-formal-e2e-formal-isolated");
});

test("recovers safely from corrupted local progress", async ({ page }) => {
  await page.goto("/?mode=fulltest&run=e2e-corrupt-progress");
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("exploration-atlas-fulltest-e2e-corrupt-progress");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction("state", "readwrite");
        transaction.objectStore("state").put({ phase: "map", zoneStarted: "broken" }, "progress");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "开启地图" })).toBeVisible();
});

test("location denial never blocks the cartographer fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: (_success: PositionCallback, error?: PositionErrorCallback) => {
          window.setTimeout(() => error?.({ code: 1, message: "denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }), 0);
          return 1;
        },
        clearWatch: () => undefined,
      },
    });
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-location-denied");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await page.getByRole("button", { name: "查看线索" }).click();
  await expect(page.getByText("定位权限没有开启")).toBeVisible();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制抵达" }).click();
  await expect(page.getByRole("button", { name: "开启照片复刻" })).toBeVisible();
});

test("portrait viewport asks the explorer to rotate", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "请将 iPad 横过来" })).toBeVisible();
});

test("walks all six gifts through the fallback path to the finale", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-complete");
  await expect(page.locator(".intro-map-sheet")).toHaveCount(0);
  await page.getByRole("button", { name: "开启地图" }).click();

  for (const [mystery, gift, asset, theme, particleAnimation] of [
    ["第一枚未知坐标", "好听的", "/assets/maps/jingwei-sound-v3.jpg", "sound", "soundNotePhrase"],
    ["第二枚未知坐标", "好用的", "/assets/maps/caihe-motion-v4.png", "motion", "motionWindCurrent"],
  ]) {
    await expect(page.locator(".quest-card h2")).toContainText(mystery, { timeout: 10_000 });
    await expect(page.getByText(gift, { exact: true })).toHaveCount(0);
    await expect(page.locator("image.illustrated-base-map")).toHaveAttribute("href", asset);
    await expect(page.locator(".theme-ambient")).toHaveAttribute("data-theme", theme);
    expect(
      await page.locator(".theme-particles i").first().evaluate((element) => getComputedStyle(element).animationName),
    ).toBe(particleAnimation);
    await expect(page.locator(".chapter-cinematic-asset")).toHaveCount(0);
    await expect(page.locator(".chapter-relic[data-gift='mystery']")).toBeVisible();
    await openCartographer(page);
    await page.getByRole("button", { name: "强制过关" }).click();
    await expect(page.locator(".unlock-card h2")).toContainText(gift);
    await expect(page.locator(".unlock-card > .magic-micro-star-trail")).toBeVisible();
    await page.getByRole("button", { name: "带着这一页返回飞行扫帚" }).click();
    await page.getByRole("button", { name: "我已停车，翻开下一页" }).click();
  }

  await expect(page.locator(".quest-card h2")).toContainText("第三枚未知坐标");
  await page.locator(".exploration-screen").evaluate((element) => {
    element.setAttribute("data-e2e-map-instance", "keep");
  });
  await expect(page.locator(".map-cartouche .map-subtitle")).toContainText("还藏着三枚坐标");
  await expect(page.locator(".theme-ambient")).toHaveAttribute("data-theme", "scent");
  await expect(page.locator(".chapter-relic[data-gift='mystery']")).toBeVisible();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制过关" }).click();
  await expect(page.locator(".unlock-card h2")).toContainText("好闻的");
  await page.getByRole("button", { name: "寻找下一枚未知坐标" }).click();

  await expect(page.locator(".quest-card h2")).toContainText("第四枚未知坐标");
  await expect(page.locator(".exploration-screen")).toHaveAttribute("data-e2e-map-instance", "keep");
  await expect(page.locator(".map-cartouche .map-subtitle")).toContainText("还藏着两枚坐标");
  await expect(page.locator(".theme-ambient")).toHaveAttribute("data-theme", "sparkle");
  await expect(page.locator(".chapter-cinematic-asset")).toHaveCount(0);
  await expect(page.locator(".chapter-relic[data-gift='mystery']")).toBeVisible();
  await expect(page.locator("image.illustrated-base-map")).toHaveAttribute("href", "/assets/maps/qianjiang-grand-north-v4.png");
  await openCartographer(page);
  await page.getByRole("button", { name: "强制过关" }).click();
  await expect(page.locator(".unlock-card h2")).toContainText("好看的");
  await page.getByRole("button", { name: "寻找下一枚未知坐标" }).click();

  await expect(page.locator(".quest-card h2")).toContainText("第五枚未知坐标");
  await expect(page.locator(".map-cartouche .map-subtitle")).toContainText("还藏着最后一枚坐标");
  await expect(page.locator(".theme-ambient")).toHaveAttribute("data-theme", "taste");
  await expect(page.locator(".chapter-cinematic-asset")).toHaveCount(0);
  await expect(page.locator(".chapter-relic[data-gift='mystery']")).toBeVisible();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制过关" }).click();
  await expect(page.locator(".unlock-card h2")).toContainText("好吃的");
  await page.getByRole("button", { name: "寻找下一枚未知坐标" }).click();

  await expect(page.locator(".quest-card h2")).toContainText("好爱的");
  await expect(page.locator(".theme-ambient")).toHaveAttribute("data-theme", "love");
  await expect(page.locator(".chapter-cinematic-asset")).toHaveCount(0);
  await expect(page.locator(".chapter-relic[data-gift='love']")).toBeVisible();
  await page.getByRole("button", { name: "打开最后一封信" }).click();
  await page.getByRole("button", { name: "翻开新一岁的第一章" }).click();
  await expect(page.getByRole("heading", { name: "Exploration Completed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "重新彩排" })).toBeVisible();
});

test("supports dragging and two-pointer zoom on the hand-drawn map", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开启地图" }).click();
  const map = page.getByLabel("可拖拽和双指缩放的探索地图");
  await expect(map).toBeVisible({ timeout: 7_000 });
  await map.dispatchEvent("pointerdown", { pointerId: 1, clientX: 300, clientY: 300 });
  await map.dispatchEvent("pointermove", { pointerId: 1, clientX: 355, clientY: 330 });
  await map.dispatchEvent("pointerup", { pointerId: 1, clientX: 355, clientY: 330 });
  await page.waitForTimeout(1_200);
  await expect(map).toHaveAttribute("data-pan", "55,30");

  await map.dispatchEvent("pointerdown", { pointerId: 1, clientX: 300, clientY: 300 });
  await map.dispatchEvent("pointerdown", { pointerId: 2, clientX: 400, clientY: 300 });
  await map.dispatchEvent("pointermove", { pointerId: 2, clientX: 500, clientY: 300 });
  await map.dispatchEvent("pointerup", { pointerId: 2, clientX: 500, clientY: 300 });
  await map.dispatchEvent("pointerup", { pointerId: 1, clientX: 300, clientY: 300 });
  await page.waitForTimeout(1_200);
  expect(Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(1.2);
});

test("shows the bicycle reference photo, scores an uploaded recreation, and stores it locally", async ({ page }) => {
  test.setTimeout(45_000);
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制过关" }).click();
  await page.getByRole("button", { name: "带着这一页返回飞行扫帚" }).click();
  await page.getByRole("button", { name: "我已停车，翻开下一页" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制抵达" }).click();
  await page.getByRole("button", { name: "开启照片复刻" }).click();

  await expect(page.getByAltText("制图人预先拍摄的模特参考照片")).toBeVisible();
  await expect(page.getByAltText("制图人预先拍摄的模特参考照片")).toHaveAttribute(
    "src",
    "/references/motion.svg",
  );
  await expect(page.locator(".reference-pending")).toContainText("当前为示意图");
  await expect(page.locator(".photo-panel > .magic-micro-wave")).toHaveCount(2);
  await expect(page.locator("video")).toHaveCount(0);
  const uploadInput = page.locator("input[data-role='capture-photo']").first();
  await uploadInput.waitFor({ state: "attached" });
  await uploadInput.setInputFiles("public/references/motion.svg");
  const startedAt = Date.now();
  await page.getByRole("button", { name: "开始匹配" }).click();
  await expect(page.locator(".memory-scan-beam")).toBeVisible();
  await expect(page.locator("[data-celebration='photo']")).toBeVisible();
  await expect(page.locator(".memory-rune-seal")).toBeVisible();
  await expect(page.locator(".confetti-cannon")).toHaveCount(2);
  await expect(page.locator(".confetti-piece")).toHaveCount(52);
  await expect(page.getByText("画面与记忆重合")).toBeVisible();
  await expect(page.getByText("PAGE 02 · REVEALED")).toBeVisible();
  expect(Date.now() - startedAt).toBeLessThan(4_000);
  await expect(page.getByText(/照片匹配度 \d+%/)).toBeVisible();

  const photoCount = await page.evaluate(async () => {
    return new Promise<number>((resolve, reject) => {
      const request = indexedDB.open("exploration-atlas-formal-field-sound-v1");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const count = request.result.transaction("photos").objectStore("photos").count();
        count.onerror = () => reject(count.error);
        count.onsuccess = () => resolve(count.result);
      };
    });
  });
  expect(photoCount).toBe(1);
});

test("reports an unreadable photo without trapping the explorer", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-invalid-photo");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await openCartographer(page);
  await page.getByRole("button", { name: "强制抵达" }).click();
  await page.getByRole("button", { name: "开启照片复刻" }).click();
  const uploadInput = page.locator("input[data-role='capture-photo']").first();
  await uploadInput.setInputFiles("package.json");
  await expect(page.getByRole("alert")).toContainText("这张照片无法读取");
  await expect(page.getByRole("button", { name: "开始匹配" })).toBeDisabled();
  await page.getByRole("button", { name: "返回地图" }).click();
  await expect(page.locator(".map-stage")).toBeVisible();
});

test("falls back to scene matching when a full pose cannot be detected", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
      nativeTimeout(handler, timeout === 3_000 ? 30 : timeout, ...arguments_)) as typeof window.setTimeout;
  });
  await page.goto("/?mode=fulltest&run=e2e-no-pose-model");
  await page.getByRole("button", { name: "开启地图" }).click();
  await page.getByRole("button", { name: "飞行扫帚已抵达，开始探索" }).click();
  await openCartographer(page);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "强制抵达" }).click();
  await page.getByRole("button", { name: "开启照片复刻" }).click();
  await page.locator("input[data-role='reference-photo']").setInputFiles("public/references/motion.svg");
  const uploadInput = page.locator("input[data-role='capture-photo']").first();
  await uploadInput.setInputFiles("public/references/motion.svg");
  const startedAt = Date.now();
  await page.getByRole("button", { name: "开始匹配" }).click();
  await expect(page.getByText("PAGE 01 · REVEALED")).toBeVisible();
  expect(Date.now() - startedAt).toBeLessThan(4_000);
  await expect(page.getByText(/场景匹配模式/)).toBeVisible();
});

test("stores the complete atlas and local vision model for offline use", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Exploration Atlas" })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, 5_000);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            window.clearTimeout(timer);
            resolve();
          },
          { once: true },
        );
      });
    }
  });
  await expect(page.getByText("猫头鹰缓存中")).toBeVisible();
  await context.setOffline(true);
  const offlineAssets = await page.evaluate(async () => {
    const paths = [
      "index.html",
      "models/pose_landmarker_lite.task",
      "mediapipe/wasm/vision_wasm_internal.js",
      "mediapipe/wasm/vision_wasm_internal.wasm",
      "workers/photo-score.js",
      "references/motion.svg",
      "references/sound.svg",
      "references/scent.svg",
      "references/sparkle.svg",
      "references/taste.svg",
      "assets/magic/parchment-cinematic-v1.jpg",
      "assets/magic/arcane-fog-field-v1.jpg",
      "assets/magic/rune-seal-burst-v1.png",
      "assets/magic/ink-bloom-mask-v1.jpg",
      "assets/magic/owl-courier-sprite-v1.png",
      "assets/magic/gilded-atlas-frame-v2.png",
      "assets/magic/constellation-veins-v2.png",
      "assets/magic/cartographer-medallion-v2.png",
      "assets/magic/explorer-envelope-open-v3.png",
      "assets/magic/exploration-wax-seal-v3.png",
    ];
    const exact = await Promise.all(
      paths.map(async (path) => {
        const response = await caches.match(path);
        return { path, ok: Boolean(response), bytes: response ? (await response.arrayBuffer()).byteLength : 0 };
      }),
    );
    const cacheName = (await caches.keys()).find((name) => name.startsWith("exploration-atlas-"));
    const keys = (cacheName ? await caches.open(cacheName).then((cache) => cache.keys()) : []).map(
      (request) => new URL(request.url).pathname,
    );
    return {
      exact,
      hasApplicationScript: keys.some((path) => /\/assets\/index-[^/]+\.js$/.test(path)),
      hasApplicationStyles: keys.some((path) => /\/assets\/index-[^/]+\.css$/.test(path)),
    };
  });
  expect(offlineAssets.exact.every((asset) => asset.ok && asset.bytes > 0)).toBe(true);
  expect(offlineAssets.hasApplicationScript).toBe(true);
  expect(offlineAssets.hasApplicationStyles).toBe(true);
  await context.setOffline(false);
});
