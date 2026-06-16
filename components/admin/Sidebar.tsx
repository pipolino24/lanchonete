"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, ClipboardList, ShoppingCart, UtensilsCrossed, PlusSquare,
  Users, Ticket, Bike, CreditCard, Clock, BarChart3, Wallet, QrCode,
  Store, LogOut, Armchair,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { logoutAction } from "@/app/painel/actions";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: React.ElementType }[] = [
  { href: "/painel", label: "Início", icon: LayoutGrid },
  { href: "/painel/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/painel/pdv", label: "PDV / Nova venda", icon: ShoppingCart },
  { href: "/painel/mesas", label: "Mesas", icon: Armchair },
  { href: "/painel/produtos", label: "Produtos", icon: UtensilsCrossed },
  { href: "/painel/adicionais", label: "Adicionais", icon: PlusSquare },
  { href: "/painel/clientes", label: "Clientes", icon: Users },
  { href: "/painel/cupons", label: "Cupons", icon: Ticket },
  { href: "/painel/entrega", label: "Entrega", icon: Bike },
  { href: "/painel/pagamento", label: "Pagamento", icon: CreditCard },
  { href: "/painel/horarios", label: "Horários", icon: Clock },
  { href: "/painel/caixa", label: "Caixa", icon: Wallet },
  { href: "/painel/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/painel/qrcode", label: "QR Code", icon: QrCode },
  { href: "/painel/loja", label: "Minha loja", icon: Store },
];

export function Sidebar({
  storeName,
  userName,
}: {
  storeName: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-coal-800 bg-coal-900">
      <div className="flex items-center gap-2 border-b border-coal-800 px-4 py-4">
        <Logo size="sm" />
      </div>

      <div className="border-b border-coal-800 px-4 py-3">
        <p className="text-xs text-ash-dark">Loja</p>
        <p className="truncate text-sm font-semibold text-cream">{storeName}</p>
      </div>

      <nav className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active =
            item.href === "/painel"
              ? pathname === "/painel"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-ember-500/15 text-ember-400 ring-1 ring-ember-500/20"
                  : "text-ash hover:bg-coal-800 hover:text-cream",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-coal-800 p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-cream">{userName}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ash hover:bg-coal-800 hover:text-danger"
          >
            <LogOut size={18} /> Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
