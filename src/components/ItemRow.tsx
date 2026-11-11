import { useRef, useState, type ReactNode } from "react";
import { Check, Droplets, PackageOpen, Snowflake, Trash2 } from "lucide-react";
import type { FoodItem, Location } from "../lib/types";
import { locationInfo } from "../lib/types";
import { daysBetween, expiryLabel, expiryStatus, today } from "../lib/dates";
import { consumeItem, moveItem, moveMessage, quickUseAmount } from "../lib/db";
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
          {item.thawedAt && item.location !== "freezer" && <><span>·</span><Droplets size={14} aria-label="Descongelando" /></>}
        </div>
      </div>
      <ItemBadge item={item} />
      {f != null && <div className={`fresh ${st}`} aria-hidden="true"><i style={{ width: `${Math.max(4, f * 100)}%` }} /></div>}
    </div>
  );
  return swipe ? <SwipeActions item={item}>{row}</SwipeActions> : row;
}

const THRESHOLD = 88;
/** width of the two buttons revealed by a left swipe */
const REVEAL = 200;

/**
 * Swipe right = used. Swipe left = reveals two buttons: move (to the freezer, or
 * out of it to thaw in the fridge) and "joguei fora". Everything can be undone.
 */
function SwipeActions({ item, children }: { item: FoodItem; children: ReactNode }) {
  const notify = useToast();
  const [dx, setDx] = useState(0);
  const [open, setOpen] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const [gone, setGone] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; active: boolean } | null>(null);
  const moved = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const moveTo: Location = item.location === "freezer" ? "geladeira" : "freezer";

  const close = () => { setSnapping(true); setDx(0); setOpen(false); };

  async function collapseThen(fn: () => Promise<void>, removes: boolean, dir: number) {
    const el = wrap.current;
    setSnapping(true);
    setDx(dir * window.innerWidth);
    if (removes && el) {
      // collapse the row so the list closes the gap smoothly
      el.style.height = `${el.offsetHeight}px`;
      requestAnimationFrame(() => { setGone(true); el.style.height = "0px"; el.style.marginBottom = "-8px"; });
    }
    await new Promise((r) => setTimeout(r, removes ? 220 : 160));
    await fn();
    if (!removes) { setDx(0); setOpen(false); }
  }

  function used() {
    const amount = quickUseAmount(item);
    const removes = amount >= item.quantity;
    void collapseThen(async () => {
      const undo = await consumeItem(item, amount, "consumido");
      notify(removes ? `${item.name}: usado` : `${item.name}: usou 1 (restam ${fmtQty(item.quantity - 1, item.unit)})`, undo);
    }, removes, 1);
  }

  function thrown() {
    void collapseThen(async () => {
      const undo = await consumeItem(item, item.quantity, "descartado");
      notify(`${item.name}: jogado fora`, undo);
    }, true, -1);
  }

  async function move() {
    close();
    const r = await moveItem(item, moveTo);
    notify(moveMessage(item, moveTo, r), r.undo);
  }

  return (
    <div className={`swipe ${gone ? "gone" : ""}`} ref={wrap}>
      {dx > 0 && (
        <div className={`swipe-bg right ${dx >= THRESHOLD ? "armed" : ""}`} aria-hidden="true">
          <span><Check size={20} /> Usei</span>
        </div>
      )}
      {dx < 0 && (
        <div className="swipe-actions">
          <button className="swipe-act move" onClick={move} tabIndex={open ? 0 : -1}>
            {moveTo === "freezer" ? <><Snowflake size={20} />Freezer</> : <><Droplets size={20} />Descongelar</>}
          </button>
          <button className="swipe-act trash" onClick={thrown} tabIndex={open ? 0 : -1}><Trash2 size={20} />Jogar fora</button>
        </div>
      )}
      <div
        className={`swipe-fg ${snapping ? "snapping" : ""}`}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY, base: open ? -REVEAL : 0, active: false };
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
          setDx(Math.max(-REVEAL - 40, s.base + mx));
        }}
        onPointerUp={() => {
          const s = start.current;
          start.current = null;
          if (!s?.active) return;
          setSnapping(true);
          if (dx >= THRESHOLD && !open) used();
          else if (dx <= -THRESHOLD) { setDx(-REVEAL); setOpen(true); }
          else close();
        }}
        onPointerCancel={() => { start.current = null; close(); }}
        onClickCapture={(e) => {
          // a swipe (or a tap on an opened row) must not also open the item
          if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false; return; }
          if (open) { e.stopPropagation(); e.preventDefault(); close(); }
        }}
      >
        {children}
      </div>
    </div>
  );
}
