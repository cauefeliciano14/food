import { db } from "./db";
import { today } from "./dates";
import { daysLeft, effectiveDate, itemStatus } from "./freshness";
import { loadSettings } from "./settings";

const KEY = "despensa:lastNotified";

/** Once per day, show a local notification listing items that expire soon. */
export async function notifyExpiringOncePerDay() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const ref = today();
  try {
    if (localStorage.getItem(KEY) === ref) return;
  } catch {
    return;
  }
  const { notifyDays } = loadSettings();
  const items = await db.items.toArray();
  const soon = items
    .filter((i) => { const d = daysLeft(i, ref); return d != null && d <= notifyDays && itemStatus(i, ref) !== "passou"; })
    .sort((a, b) => effectiveDate(a).localeCompare(effectiveDate(b)));
  try {
    localStorage.setItem(KEY, ref);
  } catch {
    /* ignore */
  }
  if (soon.length === 0) return;
  const body = soon.slice(0, 5).map((i) => i.name).join(", ") + (soon.length > 5 ? ` e mais ${soon.length - 5}` : "");
  const title = `${soon.length} item(ns) vencendo`;
  const reg = await navigator.serviceWorker?.getRegistration?.();
  if (reg) reg.showNotification(title, { body, icon: "./icon.svg", tag: "despensa-validade" });
  else new Notification(title, { body, icon: "./icon.svg" });
}
