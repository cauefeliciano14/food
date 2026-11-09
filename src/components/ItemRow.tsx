import type { FoodItem } from "../lib/types";
import { categoryInfo, locationInfo } from "../lib/types";
import { expiryLabel, expiryStatus } from "../lib/dates";

export function ExpiryBadge({ date }: { date: string }) {
  const st = expiryStatus(date);
  return <span className={`badge ${st}`}>{expiryLabel(date)}</span>;
}

export function fmtQty(q: number, unit: string) {
  const n = Number.isInteger(q) ? String(q) : q.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return `${n} ${unit}`;
}

export function ItemRow({ item, onClick }: { item: FoodItem; onClick?: () => void }) {
  const st = expiryStatus(item.expiryDate);
  return (
    <div className={`item ${st}`} onClick={onClick} role={onClick ? "button" : undefined} style={{ cursor: onClick ? "pointer" : undefined }}>
      <div className="emoji">{categoryInfo(item.category).icon}</div>
      <div className="body">
        <div className="title">{item.name}</div>
        <div className="small muted">
          {fmtQty(item.quantity, item.unit)} · {locationInfo(item.location).icon} {locationInfo(item.location).label}
        </div>
      </div>
      <ExpiryBadge date={item.expiryDate} />
    </div>
  );
}
