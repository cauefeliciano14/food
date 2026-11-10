import type { CSSProperties } from "react";
import { Check, Clock, Star } from "lucide-react";
import type { RecipeMatch } from "../lib/matching";
import { dishStyle } from "./icons";

/** Recipe as a book-style card: colored band by dish type, then what you have / what's missing. */
export function RecipeCard({ match: m, onClick }: { match: RecipeMatch; onClick: () => void }) {
  const r = m.recipe;
  const { icon: Icon, hue } = dishStyle(r);
  return (
    <button className="rcard" onClick={onClick}>
      <div className="rcard-band" style={{ "--h": hue } as CSSProperties}>
        <Icon size={36} strokeWidth={1.6} aria-hidden="true" />
        {r.favorite && <Star className="fav" size={18} fill="currentColor" aria-label="Favorita" />}
        <span className="time"><Clock size={12} aria-hidden="true" />{r.minutes} min</span>
      </div>
      <div className="rcard-body">
        <div className="rcard-title">{r.title}</div>
        {m.canMake ? (
          <span className="badge ok" style={{ alignSelf: "flex-start" }}><Check size={12} strokeWidth={3} />Tem tudo</span>
        ) : (
          <span className="badge urgente" style={{ alignSelf: "flex-start" }}>Falta {m.missing.length}</span>
        )}
        {!m.canMake && <div className="rcard-note">{m.missing.map((x) => x.name).join(", ")}</div>}
        {m.expiringUsed.length > 0 && <div className="rcard-note use">Aproveita {m.expiringUsed.map((i) => i.name.toLowerCase()).join(", ")}</div>}
      </div>
    </button>
  );
}
