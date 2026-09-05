import { defineConfig, devices } from "@playwright/test";

const deployedBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localPort = Number(process.env.PLAYWRIGHT_PORT ?? 4187);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    ...devices["Desktop Safari"],
    baseURL: deployedBaseUrl ?? `http://127.0.0.1:${localPort}`,
    viewport: { width: 1180, height: 820 },
    video: "off",
    trace: "retain-on-failure",
  },
  webServer: deployedBaseUrl
    ? undefined
    : {
        command: `npm run preview -- --host 127.0.0.1 --port ${localPort} --strictPort`,
        port: localPort,
        reuseExistingServer: false,
      },
  projects: [{ name: "iPad landscape WebKit", use: { browserName: "webkit" } }],
});
