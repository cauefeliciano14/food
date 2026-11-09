import { StrictMode } from "react";
import { Capacitor } from "@capacitor/core";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { applyTheme, loadSettings, watchSystemTheme } from "./lib/settings";

applyTheme(loadSettings().theme);
watchSystemTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The Android app ships its files inside the APK; the service worker is only for the web version.
if ("serviceWorker" in navigator && import.meta.env.PROD && !Capacitor.isNativePlatform()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
