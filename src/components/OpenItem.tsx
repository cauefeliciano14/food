import { useState } from "react";
import { PackageOpen, Split } from "lucide-react";
import type { FoodItem, Location } from "../lib/types";
import { LOCATIONS } from "../lib/types";
import { today } from "../lib/dates";
import { openItem } from "../lib/db";
import { locationAfterOpening, ruleFor } from "../lib/freshness";
import { useToast } from "../lib/toast";
import { fmtQty } from "./ItemRow";
import { LocationIcon } from "./icons";

function LocationPicker({ value, onChange, label }: { value: Location; onChange: (l: Location) => void; label: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="segmented locs" role="radiogroup" aria-label={label}>
        {LOCATIONS.map((l) => (
          <button key={l.value} type="button" role="radio" aria-checked={value === l.value} className={value === l.value ? "active" : ""} onClick={() => onChange(l.value)}>
            <LocationIcon location={l.value} />{l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "Abri a embalagem" + optional "separei uma parte num pote". */
export function OpenItem({ item, onDone, onCancel }: { item: FoodItem; onDone: () => void; onCancel: () => void }) {
  const notify = useToast();
  const already = !!item.openedAt;
  const rule = ruleFor(item);
  const [openedAt, setOpenedAt] = useState(item.openedAt ?? today());
  const [location, setLocation] = useState<Location>(already ? item.location : locationAfterOpening(item));
  const [split, setSplit] = useState(already);
  const defaultPart = item.unit === "kg" ? Math.min(1, item.quantity) : item.unit === "g" ? Math.min(500, item.quantity) : 1;
  const [part, setPart] = useState(String(defaultPart).replace(".", ","));
  const [potLocation, setPotLocation] = useState<Location>(rule.fridgeOnOpen ? "geladeira" : "armario");
  const [potName, setPotName] = useState(item.name);

  const partN = Math.max(0, Number(part.replace(",", ".")) || 0);
  const keeps = rule.opened >= 365 ? `cerca de ${Math.round(rule.opened / 365)} ano(s)` : `cerca de ${rule.opened} dia(s)`;

  async function save() {
    await openItem(item, { openedAt, location, ...(split && partN > 0 ? { split: { quantity: partN, location: potLocation, name: potName } } : {}) });
    notify(split && partN > 0 ? `${fmtQty(partN, item.unit)} separado(s) em ${potName}` : `${item.name} marcado como aberto`);
    onDone();
  }

  return (
    <div className="stack">
      <div className="notice ok small icon-label" style={{ alignItems: "flex-start" }}>
        <PackageOpen size={16} style={{ marginTop: 2 }} />
        <span>
          Depois de aberto, {item.name.toLowerCase()} costuma durar {keeps}
          {rule.fridgeOnOpen ? " e deve ir para a geladeira" : ""}. O app passa a contar a partir da abertura.
        </span>
      </div>
      {!already && (
        <>
          <label className="field">
            <span>Aberto em</span>
            <input type="date" value={openedAt} max={today()} onChange={(e) => setOpenedAt(e.target.value || today())} />
          </label>
          <LocationPicker label={split ? "Onde fica o que sobrou na embalagem" : "Onde vai ficar"} value={location} onChange={setLocation} />
        </>
      )}

      <label className="row" style={{ cursor: "pointer", gap: 10 }}>
        <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} style={{ width: 22, height: 22 }} />
        <span className="icon-label"><Split size={16} />Separei uma parte em outro pote</span>
      </label>

      {split && (
        <div className="card stack">
          <div className="grid-2">
            <label className="field">
              <span>Quanto foi para o pote ({item.unit})</span>
              <input type="text" inputMode="decimal" value={part} onChange={(e) => setPart(e.target.value)} />
            </label>
            <label className="field">
              <span>Nome do pote</span>
              <input type="text" value={potName} onChange={(e) => setPotName(e.target.value)} />
            </label>
          </div>
          <LocationPicker label="Onde fica o pote" value={potLocation} onChange={setPotLocation} />
          <div className="small muted">
            Ficam: {fmtQty(partN, item.unit)} no pote e {fmtQty(Math.max(0, +(item.quantity - partN).toFixed(3)), item.unit)} na embalagem.
          </div>
        </div>
      )}

      <button className="btn primary block" onClick={save} disabled={split && (partN <= 0 || partN > item.quantity)}>
        {already ? "Separar" : "Confirmar"}
      </button>
      <button className="btn ghost block" onClick={onCancel}>Voltar</button>
    </div>
  );
}
