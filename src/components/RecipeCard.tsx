import type { CSSProperties } from "react";
import { Check, Clock, Star } from "lucide-react";
import type { RecipeMatch } from "../lib/matching";
import { db } from "../lib/db";
import { dishStyle } from "./icons";

/** Recipe as a book-style card: photo (or colored band by dish type), then what you have / what's missing. */
export function RecipeCard({ match: m, onClick }: { match: RecipeMatch; onClick: () => void }) {
  const r = m.recipe;
  const { icon: Icon, hue } = dishStyle(r);
  return (
    <div className="rcard-wrap">
      <button className="rcard" onClick={onClick}>
        <div className={`rcard-band ${r.photo ? "has-photo" : ""}`} style={{ "--h": hue } as CSSProperties}>
          {r.photo ? <img src={r.photo} alt="" loading="lazy" /> : <Icon size={36} strokeWidth={1.6} aria-hidden="true" />}
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
      {/* one tap to (un)favorite, without opening the recipe */}
      <button className={`fav-btn ${r.favorite ? "on" : ""}`} aria-pressed={!!r.favorite}
        aria-label={r.favorite ? `Tirar ${r.title} das favoritas` : `Favoritar ${r.title}`}
        onClick={() => db.recipes.update(r.id!, { favorite: !r.favorite })}>
        <Star size={20} fill={r.favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
