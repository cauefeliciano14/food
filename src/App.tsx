import { useEffect, useState } from "react";
import type { FoodItem, Recipe } from "./lib/types";
import { Home } from "./screens/Home";
import { Pantry } from "./screens/Pantry";
import { Recipes } from "./screens/Recipes";
import { Settings } from "./screens/Settings";
import { ScanReceipt } from "./screens/ScanReceipt";
import { Sheet } from "./components/Sheet";
import { ItemForm } from "./components/ItemForm";
import { ItemDetail } from "./components/ItemDetail";
import { RecipeDetail } from "./components/RecipeDetail";
import { RecipeForm } from "./components/RecipeForm";
import { AISuggest } from "./components/AISuggest";
import { notifyExpiringOncePerDay } from "./lib/notify";
import { db } from "./lib/db";

type Tab = "inicio" | "despensa" | "receitas" | "ajustes";
type Modal =
  | { kind: "add-menu" }
  | { kind: "add-manual" }
  | { kind: "scan" }
  | { kind: "item"; item: FoodItem }
  | { kind: "recipe"; recipe: Recipe }
  | { kind: "recipe-new" }
  | { kind: "ai" }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>("inicio");
  const [pantryFilter, setPantryFilter] = useState<string | undefined>();
  const [modal, setModal] = useState<Modal>(null);
  const close = () => setModal(null);

  useEffect(() => {
    notifyExpiringOncePerDay().catch(() => {});
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const go = (t: "despensa" | "add" | "receitas", filter?: string) => {
    if (t === "add") return setModal({ kind: "add-menu" });
    if (t === "despensa") setPantryFilter(filter);
    setTab(t);
  };
  const openRecipeById = async (id: number) => {
    const r = await db.recipes.get(id);
    setModal(r ? { kind: "recipe", recipe: r } : null);
  };
  const toSettings = () => { close(); setTab("ajustes"); };

  return (
    <div className="app">
      {tab === "inicio" && <Home go={go} openItem={(item) => setModal({ kind: "item", item })} openRecipe={(recipe) => setModal({ kind: "recipe", recipe })} />}
      {tab === "despensa" && <Pantry key={pantryFilter ?? "all"} initialFilter={pantryFilter} openItem={(item) => setModal({ kind: "item", item })} onAdd={() => setModal({ kind: "add-menu" })} />}
      {tab === "receitas" && <Recipes openRecipe={(recipe) => setModal({ kind: "recipe", recipe })} onNew={() => setModal({ kind: "recipe-new" })} onAI={() => setModal({ kind: "ai" })} />}
      {tab === "ajustes" && <Settings />}

      <nav className="tabbar">
        <div className="tabbar-inner">
          <TabBtn icon="🏠" label="Início" active={tab === "inicio"} onClick={() => setTab("inicio")} />
          <TabBtn icon="🗄️" label="Despensa" active={tab === "despensa"} onClick={() => { setPantryFilter(undefined); setTab("despensa"); }} />
          <button className="tab add" onClick={() => setModal({ kind: "add-menu" })} aria-label="Adicionar"><span className="ico">+</span>Adicionar</button>
          <TabBtn icon="📖" label="Receitas" active={tab === "receitas"} onClick={() => setTab("receitas")} />
          <TabBtn icon="⚙️" label="Ajustes" active={tab === "ajustes"} onClick={() => setTab("ajustes")} />
        </div>
      </nav>

      {modal?.kind === "add-menu" && (
        <Sheet title="Adicionar comida" onClose={close}>
          <div className="stack">
            <button className="btn primary block" style={{ minHeight: 56 }} onClick={() => setModal({ kind: "scan" })}>📸 Foto da nota fiscal</button>
            <button className="btn block" style={{ minHeight: 56 }} onClick={() => setModal({ kind: "add-manual" })}>✍️ Adicionar manualmente</button>
          </div>
        </Sheet>
      )}
      {modal?.kind === "add-manual" && <Sheet title="Novo item" onClose={close}><ItemForm onDone={close} /></Sheet>}
      {modal?.kind === "scan" && (
        <Sheet title="Ler nota fiscal" onClose={close}>
          <ScanReceipt onDone={() => { close(); setPantryFilter(undefined); setTab("despensa"); }} onNeedKey={toSettings} />
        </Sheet>
      )}
      {modal?.kind === "item" && <Sheet title="Item" onClose={close}><ItemDetail item={modal.item} onDone={close} /></Sheet>}
      {modal?.kind === "recipe" && <Sheet title={modal.recipe.title} onClose={close}><RecipeDetail recipe={modal.recipe} onDone={close} /></Sheet>}
      {modal?.kind === "recipe-new" && (
        <Sheet title="Nova receita" onClose={close}>
          <RecipeForm onDone={(id) => (id ? openRecipeById(id) : close())} />
        </Sheet>
      )}
      {modal?.kind === "ai" && (
        <Sheet title="Sugestão da IA" onClose={close}>
          <AISuggest onSaved={openRecipeById} onNeedKey={toSettings} />
        </Sheet>
      )}
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      <span className="ico">{icon}</span>
      {label}
    </button>
  );
}
