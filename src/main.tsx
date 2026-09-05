import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ExplorationApp } from "./components/ExplorationApp";
import { fullTestZones } from "./config/fullTestStory";
import { experienceConfig } from "./config/experience";
import "../app/globals.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch(() => undefined);
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") registration.update().catch(() => undefined);
        });
      })
      .catch((error) => {
        console.error("Exploration Atlas offline cache failed to register", error);
      });
  });
}

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");
const demoMode = mode === "demo" && experienceConfig.publicDemo.enabled;
const runNamespace = params.get("run")?.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 32);
const storageNamespace =
  mode === "fulltest"
    ? `fulltest-${runNamespace || "default"}`
    : demoMode
      ? `fulltest-demo-${runNamespace || "default"}`
    : runNamespace
      ? `formal-${runNamespace}`
      : "formal-field-sound-v1";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExplorationApp
      storageNamespace={storageNamespace}
      storyZones={mode === "fulltest" || demoMode ? fullTestZones : undefined}
      demoMode={demoMode}
      enableCinematicIntro={
        experienceConfig.optionalMedia.introFilm.enabled &&
        (mode !== "fulltest" && !demoMode || params.get("intro") === "1")
      }
    />
  </StrictMode>,
);
