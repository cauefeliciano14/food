import { useEffect, useRef } from "react";

/**
 * Android back gesture/button: goes back ONE step instead of closing the app.
 *
 * Anything that is "a step forward" (an open sheet, a sub-screen inside a
 * sheet, a tab other than Início) registers a handler while it is showing.
 * The newest, deepest handler runs first. Only when nothing is open does the
 * app go to the background.
 */
type Entry = { id: number; level: number; fn: () => void };
let seq = 0;
const stack: Entry[] = [];

/** Run the top handler. Returns false when there is nothing to go back from. */
export function goBack(): boolean {
  if (!stack.length) return false;
  const top = stack.reduce((a, b) => (b.level > a.level || (b.level === a.level && b.id > a.id) ? b : a));
  top.fn();
  return true;
}

/**
 * Register a back handler while `active`.
 * level: 0 = tabs, 1 = sheets, 2+ = steps inside a sheet.
 */
export function useBack(active: boolean, fn: () => void, level = 2) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => (active ? registerBack(level, () => ref.current()) : undefined), [active, level]);
}

/** Add a back handler; returns the function that removes it. */
export function registerBack(level: number, fn: () => void): () => void {
  const entry: Entry = { id: ++seq, level, fn };
  stack.push(entry);
  return () => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Hook the hardware back button once (Android app only). */
export async function installBackButton() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) {
    // Browser: Esc goes back one step too.
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") goBack();
    });
    return;
  }
  const { App } = await import("@capacitor/app");
  await App.addListener("backButton", () => {
    if (!goBack()) App.minimizeApp();
  });
}
