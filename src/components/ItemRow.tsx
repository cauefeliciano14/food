import { useRef, useState, type ReactNode } from "react";
import { Check, PackageOpen, Trash2 } from "lucide-react";
import type { FoodItem } from "../lib/types";
import { locationInfo } from "../lib/types";
import { daysBetween, expiryLabel, expiryStatus, today } from "../lib/dates";
import { consumeItem, quickUseAmount } from "../lib/db";
import { useToast } from "../lib/toast";
import { CategoryIcon, LocationIcon } from "./icons";
import { effectiveDate, itemLabel, itemStatus } from "../lib/freshness";

export function ExpiryBadge({ date }: { date: string }) {
  const st = expiryStatus(date);
  return <span className={`badge ${st}`}>{expiryLabel(date)}</span>;
}

/** Badge that knows about opened packages and "best before" tolerance. */
export function ItemBadge({ item }: { item: FoodItem }) {
  return <span className={`badge ${itemStatus(item)}`}>{itemLabel(item)}</span>;
}

export function fmtQty(q: number, unit: string) {
  const n = Number.isInteger(q) ? String(q) : q.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return `${n} ${unit}`;
}

/** Share of the item's shelf life still ahead (0..1), from purchase to expiry. */
export function freshness(item: FoodItem, ref = today()): number | null {
  const end = effectiveDate(item);
  if (!end) return null;
  const start = item.openedAt || item.purchaseDate || ref;
  const total = Math.max(1, daysBetween(start, end));
  const left = daysBetween(ref, end);
  return Math.max(0, Math.min(1, left / total));
}

export function ItemRow({ item, onClick, swipe = false }: { item: FoodItem; onClick?: () => void; swipe?: boolean }) {
  const st = itemStatus(item);
  const f = freshness(item);
  const row = (
    <div className="item" onClick={onClick} role={onClick ? "button" : undefined}>
      <CategoryIcon category={item.category} />
      <div className="body">
        <div className="title">{item.name}</div>
        <div className="meta">
          <span>{fmtQty(item.quantity, item.unit)}</span>·<LocationIcon location={item.location} />
          <span>{locationInfo(item.location).label}</span>
          {item.openedAt && <><span>·</span><PackageOpen size={14} aria-label="Aberto" /></>}
        </div>
      </div>
      <ItemBadge item={item} />
      {f != null && <div className={`fresh ${st}`} aria-hidden="true"><i style={{ width: `${Math.max(4, f * 100)}%` }} /></div>}
    </div>
  );
  return swipe ? <SwipeActions item={item}>{row}</SwipeActions> : row;
}

const THRESHOLD = 88;

/** Swipe right = used, swipe left = thrown away. Both can be undone from the toast. */
function SwipeActions({ item, children }: { item: FoodItem; children: ReactNode }) {
  const notify = useToast();
  const [dx, setDx] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const [gone, setGone] = useState(false);
  const start = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const moved = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);

  async function commit(dir: "right" | "left") {
    const el = wrap.current;
    setSnapping(true);
    setDx(dir === "right" ? window.innerWidth : -window.innerWidth);
    const amount = dir === "right" ? quickUseAmount(item) : item.quantity;
    const removes = amount >= item.quantity;
    if (removes && el) {
      // collapse the row so the list closes the gap smoothly
      el.style.height = `${el.offsetHeight}px`;
      requestAnimationFrame(() => { setGone(true); el.style.height = "0px"; el.style.marginBottom = "-8px"; });
    }
    await new Promise((r) => setTimeout(r, removes ? 220 : 160));
    const undo = await consumeItem(item, amount, dir === "right" ? "consumido" : "descartado");
    if (!removes) { setDx(0); }
    notify(
      dir === "left" ? `${item.name}: jogado fora` : removes ? `${item.name}: usado` : `${item.name}: usou 1 (restam ${fmtQty(item.quantity - 1, item.unit)})`,
      undo,
    );
  }

  return (
    <div className={`swipe ${gone ? "gone" : ""}`} ref={wrap}>
      {dx !== 0 && (
        <div className={`swipe-bg ${dx > 0 ? "right" : "left"} ${Math.abs(dx) >= THRESHOLD ? "armed" : ""}`} aria-hidden="true">
          <span>{dx > 0 ? <><Check size={20} /> Usei</> : <>Joguei fora <Trash2 size={20} /></>}</span>
        </div>
      )}
      <div
        className={`swipe-fg ${snapping ? "snapping" : ""}`}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY, active: false };
          moved.current = false;
          setSnapping(false);
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const mx = e.clientX - s.x;
          const my = e.clientY - s.y;
          if (!s.active) {
            if (Math.abs(mx) < 12 || Math.abs(mx) < Math.abs(my) * 1.5) return;
            s.active = true;
            moved.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          setDx(mx);
        }}
        onPointerUp={() => {
          const s = start.current;
          start.current = null;
          if (!s?.active) return;
          if (dx >= THRESHOLD) void commit("right");
          else if (dx <= -THRESHOLD) void commit("left");
          else { setSnapping(true); setDx(0); }
        }}
        onPointerCancel={() => { start.current = null; setSnapping(true); setDx(0); }}
        onClickCapture={(e) => {
          // a swipe must not also open the item
          if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; }
        }}
      >
        {children}
      </div>
    </div>
  );
}
