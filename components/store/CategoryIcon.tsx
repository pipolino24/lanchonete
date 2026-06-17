import { Hamburger, Beef, Ham, Drumstick, Sandwich, CupSoda, Utensils, type LucideIcon } from "lucide-react";

// Mapeia o "emoji" da categoria para um ícone monocromático (renderizado em branco)
const MAP: Record<string, LucideIcon> = {
  "🍔": Hamburger,
  "🐂": Beef,
  "🐑": Beef,
  "🐷": Ham,
  "🍗": Drumstick,
  "🥙": Sandwich,
  "🍟": Utensils,
  "🥤": CupSoda,
};

export function CategoryIcon({
  emoji,
  size = 18,
  className = "",
}: {
  emoji?: string | null;
  size?: number;
  className?: string;
}) {
  const Icon = (emoji && MAP[emoji]) || Utensils;
  return <Icon size={size} className={className} />;
}
