import { useEffect, useState } from "react";
import { BookImage, BookOpen, ChevronRight, FilePenLine, House, Package, Plus, ReceiptText, ScanBarcode, ShoppingCart, type LucideIcon } from "lucide-react";
import { useToast } from "./lib/toast";
import { RecipeFromPhoto } from "./components/RecipeFromPhoto";
import type { RecipeDraft } from "./lib/recipeOcr";
import { IconTile } from "./components/icons";
import type { FoodItem, Recipe } from "./lib/types";
import { Home } from "./screens/Home";
import { Pantry } from "./screens/Pantry";
import { Recipes } from "./screens/Recipes";
import { Settings } from "./screens/Settings";
import { Shopping } from "./screens/Shopping";
import { useLiveQuery } from "dexie-react-hooks";
import { ScanReceipt } from "./screens/ScanReceipt";
import { Sheet } from "./components/Sheet";
import { ItemForm } from "./components/ItemForm";
import { ItemDetail } from "./components/ItemDetail";
import { RecipeDetail } from "./components/RecipeDetail";
import { RecipeForm } from "./components/RecipeForm";
import { AISuggest } from "./components/AISuggest";
import { BarcodeAdd } from "./components/BarcodeAdd";
import { WasteReport } from "./components/WasteReport";
import { BuyAgain, QuickAdd } from "./components/QuickAdd";
import { notifyExpiringOncePerDay } from "./lib/notify";
import { db } from "./lib/db";
import { installBackButton, useBack } from "./lib/back";

type Tab = "inicio" | "despensa" | "receitas" | "compras" | "ajustes";
type Modal =
  | { kind: "add-menu" }
  | { kind: "add-manual" }
  | { kind: "scan" }
  | { kind: "item"; item: FoodItem }
  | { kind: "recipe"; recipe: Recipe }
  | { kind: "recipe-new" }
  | { kind: "recipe-photo" }
  | { kind: "recipe-draft"; draft: RecipeDraft }
  | { kind: "ai" }
  | { kind: "barcode" }
  | { kind: "waste" }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>("inicio");
  const [pantryFilter, setPantryFilter] = useState<string | undefined>();
  const [modal, setModalState] = useState<Modal>(null);
  // Earlier steps of the current flow (e.g. Adicionar → Código de barras), for "voltar".
  const [trail, setTrail] = useState<Modal[]>([]);
  /** open a sheet from scratch */
  const setModal = (m: Modal) => { setTrail([]); setModalState(m); };
  /** go one step deeper, remembering where we came from */
  const push = (m: Modal) => { setTrail((t) => (modal ? [...t, modal] : t)); setModalState(m); };
  const back = trail.length ? () => { setModalState(trail[trail.length - 1]); setTrail((t) => t.slice(0, -1)); } : undefined;
  const close = () => setModal(null);
  const showToast = useToast();
  const shoppingCount = useLiveQuery(() => db.shopping.filter((s) => !s.done).count(), []) ?? 0;

  useEffect(() => {
    notifyExpiringOncePerDay().catch(() => {});
    installBackButton().catch(() => {});
  }, []);

  // Back from another tab goes to Início first; only then the app goes to the background.
  useBack(tab !== "inicio", () => setTab("inicio"), 0);

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
      <div className="screen" key={tab}>
        {tab === "inicio" && <Home go={go} openSettings={() => setTab("ajustes")} openWaste={() => setModal({ kind: "waste" })} openItem={(item) => setModal({ kind: "item", item })} openRecipe={(recipe) => setModal({ kind: "recipe", recipe })} />}
        {tab === "despensa" && <Pantry key={pantryFilter ?? "all"} initialFilter={pantryFilter} openItem={(item) => setModal({ kind: "item", item })} onAdd={() => setModal({ kind: "add-menu" })} />}
        {tab === "receitas" && <Recipes openRecipe={(recipe) => setModal({ kind: "recipe", recipe })} onNew={() => setModal({ kind: "recipe-new" })} onAI={() => setModal({ kind: "ai" })} openShopping={() => setTab("compras")} />}
        {tab === "compras" && <Shopping />}
        {tab === "ajustes" && <Settings />}
      </div>

      <nav className="tabbar">
        <div className="tabbar-inner">
          <TabBtn icon={House} label="Início" active={tab === "inicio"} onClick={() => setTab("inicio")} />
          <TabBtn icon={Package} label="Despensa" active={tab === "despensa"} onClick={() => { setPantryFilter(undefined); setTab("despensa"); }} />
          <button className="tab add" onClick={() => setModal({ kind: "add-menu" })} aria-label="Adicionar comida"><span className="ico"><Plus size={26} strokeWidth={2.5} /></span>Adicionar</button>
          <TabBtn icon={BookOpen} label="Receitas" active={tab === "receitas"} onClick={() => setTab("receitas")} />
          <TabBtn icon={ShoppingCart} label="Compras" count={shoppingCount} active={tab === "compras"} onClick={() => setTab("compras")} />
        </div>
      </nav>

      {modal?.kind === "add-menu" && (
        <Sheet title="Adicionar comida" onClose={close} onBack={back}>
          <div className="stack">
            <div className="tiles-3">
              <button className="tile-btn" onClick={() => push({ kind: "barcode" })}><IconTile icon={ScanBarcode} hue={200} size={44} />Código de barras</button>
              <button className="tile-btn" onClick={() => push({ kind: "scan" })}><IconTile icon={ReceiptText} hue={135} size={44} />Nota fiscal</button>
              <button className="tile-btn" onClick={() => push({ kind: "add-manual" })}><IconTile icon={FilePenLine} hue={280} size={44} />Formulário</button>
            </div>
            <div className="divider">ou escreva o que comprou</div>
            <QuickAdd onAdded={(n) => { close(); showToast(`${n} ${n === 1 ? "item adicionado" : "itens adicionados"} à despensa`); }} />
            <BuyAgain onAdded={(name, undo) => showToast(`${name} adicionado`, undo)} />
          </div>
        </Sheet>
      )}
      {modal?.kind === "add-manual" && <Sheet title="Novo item" onClose={close} onBack={back}><ItemForm onDone={close} /></Sheet>}
      {modal?.kind === "scan" && (
        <Sheet title="Ler nota fiscal" onClose={close} onBack={back}>
          <ScanReceipt onDone={() => { close(); setPantryFilter(undefined); setTab("despensa"); }} onNeedKey={toSettings} />
        </Sheet>
      )}
      {modal?.kind === "item" && <Sheet title="Item" onClose={close} onBack={back}><ItemDetail item={modal.item} onDone={close} /></Sheet>}
      {modal?.kind === "recipe" && (
        <Sheet title={modal.recipe.title} onClose={close} onBack={back}>
          <RecipeDetail recipe={modal.recipe} onDone={close} onOpenShopping={() => { close(); setTab("compras"); }} />
        </Sheet>
      )}
      {modal?.kind === "recipe-new" && (
        <Sheet title="Nova receita" onClose={close} onBack={back}>
          <div className="stack">
            <button className="item" onClick={() => push({ kind: "recipe-photo" })}>
              <IconTile icon={BookImage} hue={25} />
              <div className="body"><div className="title">Foto do livro de receitas</div><div className="meta">Tire foto da página e o app monta a receita</div></div>
              <ChevronRight size={18} className="muted" />
            </button>
            <div className="divider">ou escreva</div>
            <RecipeForm onDone={(id) => (id ? openRecipeById(id) : close())} />
          </div>
        </Sheet>
      )}
      {modal?.kind === "recipe-photo" && (
        <Sheet title="Receita por foto" onClose={close} onBack={back}>
          <RecipeFromPhoto onDraft={(draft) => push({ kind: "recipe-draft", draft })} />
        </Sheet>
      )}
      {modal?.kind === "recipe-draft" && (
        <Sheet title="Confira a receita" onClose={close} onBack={back}>
          <div className="stack">
            <div className="notice small">Confira o que foi lido e corrija antes de salvar.</div>
            <RecipeForm initial={{ ...modal.draft, source: "minha" }} onDone={(id) => (id ? openRecipeById(id) : close())} />
          </div>
        </Sheet>
      )}
      {modal?.kind === "barcode" && <Sheet title="Código de barras" onClose={close} onBack={back}><BarcodeAdd onDone={close} /></Sheet>}
      {modal?.kind === "waste" && <Sheet title="Desperdício" onClose={close} onBack={back}><WasteReport /></Sheet>}
      {modal?.kind === "ai" && (
        <Sheet title="Sugestão da IA" onClose={close} onBack={back}>
          <AISuggest onSaved={openRecipeById} onNeedKey={toSettings} />
        </Sheet>
      )}
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick, count = 0 }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined}>
      <span className="ico"><Icon size={22} strokeWidth={active ? 2.4 : 2} /></span>
      {count > 0 && <span className="count">{count}</span>}
      {label}
    </button>
  );
}
