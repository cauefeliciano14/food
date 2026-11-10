import type { CSSProperties, ReactNode } from "react";
import {
  Archive, Beef, CakeSlice, Carrot, ChefHat, DoorClosed, Cookie, CookingPot, Croissant, CupSoda, Drumstick, Egg, Fish, Flame, Milk,
  Moon, Package, Refrigerator, Salad, Sandwich, Snowflake, Soup, Sun, Utensils, Wheat, type LucideIcon,
} from "lucide-react";
import type { Category, Location, MealSlot, Recipe } from "../lib/types";
import { normalize } from "../lib/normalize";

/** One icon + one hue per food category. The hue tints the icon tile in both themes. */
const CATEGORY: Record<Category, { icon: LucideIcon; hue: number }> = {
  hortifruti: { icon: Carrot, hue: 135 },
  carnes: { icon: Beef, hue: 5 },
  peixes: { icon: Fish, hue: 200 },
  laticinios: { icon: Milk, hue: 45 },
  padaria: { icon: Croissant, hue: 30 },
  graos: { icon: Wheat, hue: 75 },
  enlatados: { icon: Soup, hue: 345 },
  temperos: { icon: Flame, hue: 18 },
  bebidas: { icon: CupSoda, hue: 250 },
  congelados: { icon: Snowflake, hue: 190 },
  lanches: { icon: Cookie, hue: 300 },
  outros: { icon: Package, hue: 220 },
};

const hueStyle = (hue: number) => ({ "--h": hue }) as CSSProperties;

/** Tinted rounded tile with an icon inside. */
export function IconTile({ icon: Icon, hue, size = 40, className = "" }: { icon: LucideIcon; hue?: number; size?: number; className?: string }) {
  return (
    <span className={`tile ${hue == null ? "tile-neutral" : ""} ${className}`} style={{ ...(hue == null ? {} : hueStyle(hue)), width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.52)} strokeWidth={2} />
    </span>
  );
}

export function CategoryIcon({ category, size }: { category: Category; size?: number }) {
  const c = CATEGORY[category] ?? CATEGORY.outros;
  return <IconTile icon={c.icon} hue={c.hue} size={size} />;
}

const LOCATION: Record<Location, LucideIcon> = { geladeira: Refrigerator, freezer: Snowflake, despensa: Archive, armario: DoorClosed };

export function LocationIcon({ location, size = 14 }: { location: Location; size?: number }) {
  const Icon = LOCATION[location] ?? Archive;
  return <Icon size={size} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "-2px" }} />;
}

export function MealIcon({ slot, size = 14 }: { slot: MealSlot; size?: number }) {
  const Icon = slot === "almoco" ? Sun : Moon;
  return <Icon size={size} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "-2px" }} />;
}

/** Dish "kind" from a recipe's tags → icon + hue for the recipe card band. */
const DISH: [string[], LucideIcon, number][] = [
  [["doce", "sobremesa"], CakeSlice, 330],
  [["bebida"], CupSoda, 250],
  [["cafe da manha"], Egg, 48],
  [["lanche"], Sandwich, 32],
  [["massa"], Utensils, 22],
  [["proteina"], Drumstick, 8],
  [["vegetariano", "leve", "salada"], Salad, 135],
  [["forno"], CookingPot, 280],
  [["basico", "acompanhamento"], Soup, 75],
];

export function dishStyle(recipe: Pick<Recipe, "tags">): { icon: LucideIcon; hue: number } {
  const tags = recipe.tags.map(normalize);
  for (const [keys, icon, hue] of DISH) if (keys.some((k) => tags.includes(k))) return { icon, hue };
  return { icon: ChefHat, hue: 165 };
}

/** Inline icon + text with consistent spacing. */
export function IconLabel({ icon: Icon, children, size = 16 }: { icon: LucideIcon; children: ReactNode; size?: number }) {
  return (
    <span className="icon-label">
      <Icon size={size} strokeWidth={2} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

export function EmptyState({ icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="empty">
      <IconTile icon={icon} size={72} className="empty-ico" />
      {children}
    </div>
  );
}
