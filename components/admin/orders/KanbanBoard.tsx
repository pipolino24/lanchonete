"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bike, Store, Armchair, ChevronRight, Clock, Phone, MapPin, X,
  Printer, Ban, RefreshCw, Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import { advanceOrder, cancelOrder } from "@/app/painel/(panel)/pedidos/actions";
import { cn } from "@/lib/utils";

export type KanbanOrder = {
  id: string;
  code: string;
  type: "DELIVERY" | "PICKUP" | "DINEIN";
  status: "NEW" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELED";
  channel: "ONLINE" | "PDV";
  customerName: string | null;
  customerPhone: string | null;
  addressSnapshot: string | null;
  tableNumber: number | null;
  paymentMethod: string | null;
  changeFor: number | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    totalPrice: number;
    note: string | null;
    complements: { name: string; quantity: number }[];
  }[];
};

const COLUMNS = [
  { status: "NEW", label: "Novos", tone: "ember" as const },
  { status: "PREPARING", label: "Em preparo", tone: "warning" as const },
  { status: "DELIVERING", label: "Saiu p/ entrega", tone: "info" as const },
  { status: "COMPLETED", label: "Concluídos", tone: "success" as const },
];

const TABS = [
  { key: "ALL", label: "Todos", icon: null },
  { key: "DELIVERY", label: "Delivery", icon: Bike },
  { key: "DINEIN", label: "Mesas", icon: Armchair },
  { key: "PICKUP", label: "Retirada", icon: Store },
] as const;

const TYPE_LABEL: Record<string, string> = { DELIVERY: "Delivery", PICKUP: "Retirada", DINEIN: "Mesa" };
const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix", CASH: "Dinheiro", CREDIT: "Crédito", DEBIT: "Débito",
  MEAL_VOUCHER: "Vale Refeição", FOOD_VOUCHER: "Vale Alimentação",
};
const ADVANCE_LABEL: Record<string, string> = {
  NEW: "Iniciar preparo", PREPARING: "Pronto / Saiu", DELIVERING: "Concluir",
};

function timeOf(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function KanbanBoard({ orders }: { orders: KanbanOrder[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ALL");
  const [detail, setDetail] = useState<KanbanOrder | null>(null);
  const [, startTransition] = useTransition();

  // Atualização automática
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(id);
  }, [router]);

  const filtered = orders.filter((o) => (tab === "ALL" ? true : o.type === tab) && o.status !== "CANCELED");
  const byStatus = (s: string) => filtered.filter((o) => o.status === s);

  function handleAdvance(id: string) {
    startTransition(async () => {
      await advanceOrder(id);
      setDetail(null);
    });
  }
  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelOrder(id);
      setDetail(null);
    });
  }

  const TypeIcon = ({ type }: { type: string }) =>
    type === "DELIVERY" ? <Bike size={13} /> : type === "PICKUP" ? <Store size={13} /> : <Armchair size={13} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-coal-850 p-1 ring-1 ring-coal-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.key ? "bg-ember-500 text-white" : "text-ash hover:text-cream",
                )}
              >
                {Icon && <Icon size={15} />} {t.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ash hover:text-cream"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = byStatus(col.status);
          return (
            <div key={col.status} className="rounded-2xl border border-coal-800 bg-coal-900/40">
              <div className="flex items-center justify-between border-b border-coal-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-cream">{col.label}</h2>
                  <Badge tone={col.tone}>{list.length}</Badge>
                </div>
                {col.status === "COMPLETED" && (
                  <span className="text-xs text-ash-dark">
                    {formatPrice(list.reduce((s, o) => s + o.total, 0))}
                  </span>
                )}
              </div>
              <div className="space-y-2.5 p-2.5">
                {list.length === 0 ? (
                  <p className="py-8 text-center text-xs text-ash-dark">Vazio</p>
                ) : (
                  list.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setDetail(o)}
                      className="w-full rounded-xl border border-coal-800 bg-coal-850 p-3 text-left transition-colors hover:border-coal-600"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cream">{o.customerName ?? "Cliente"}</span>
                        <Badge tone="neutral">
                          <TypeIcon type={o.type} /> {TYPE_LABEL[o.type]}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ash-dark">
                        <span>#{o.code}</span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={11} /> {timeOf(o.createdAt)}
                        </span>
                      </div>
                      {o.addressSnapshot && (
                        <p className="mt-1.5 line-clamp-1 text-xs text-ash">{o.addressSnapshot}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-ember-400">{formatPrice(o.total)}</span>
                        {o.paymentMethod && (
                          <span className="text-xs text-ash">{PAYMENT_LABEL[o.paymentMethod]}</span>
                        )}
                      </div>
                      {col.status !== "COMPLETED" && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvance(o.id);
                          }}
                          className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-coal-800 py-1.5 text-xs font-semibold text-ember-400 ring-1 ring-coal-700 hover:bg-coal-750"
                        >
                          {ADVANCE_LABEL[o.status]} <ChevronRight size={13} />
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <OrderDetail
          order={detail}
          onClose={() => setDetail(null)}
          onAdvance={() => handleAdvance(detail.id)}
          onCancel={() => handleCancel(detail.id)}
        />
      )}
    </div>
  );
}

function OrderDetail({
  order, onClose, onAdvance, onCancel,
}: {
  order: KanbanOrder;
  onClose: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const steps = ["NEW", "PREPARING", "DELIVERING", "COMPLETED"];
  const currentIdx = steps.indexOf(order.status);
  const stepLabels = ["Entrada", "Preparo", "Entrega", "Concluído"];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md animate-fade-in flex-col border-l border-coal-700 bg-coal-900">
        <div className="flex items-center justify-between border-b border-coal-800 p-4">
          <div>
            <h2 className="font-display text-xl font-bold text-cream">Pedido #{order.code}</h2>
            <p className="text-xs text-ash">{TYPE_LABEL[order.type]} · {timeOf(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ash hover:bg-coal-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Stepper */}
          <div className="flex items-center justify-between">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col items-center">
                <div
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                    i <= currentIdx ? "bg-ember-500 text-white" : "bg-coal-800 text-ash-dark",
                  )}
                >
                  {i < currentIdx ? <Check size={14} /> : i + 1}
                </div>
                <span className={cn("mt-1 text-[10px]", i <= currentIdx ? "text-cream" : "text-ash-dark")}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Cliente */}
          <div className="rounded-xl border border-coal-800 bg-coal-850 p-3">
            <p className="font-semibold text-cream">{order.customerName ?? "Cliente"}</p>
            {order.customerPhone && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ash">
                <Phone size={13} /> {order.customerPhone}
              </p>
            )}
            {order.addressSnapshot && (
              <p className="mt-1 flex items-start gap-1.5 text-sm text-ash">
                <MapPin size={13} className="mt-0.5 shrink-0" /> {order.addressSnapshot}
              </p>
            )}
          </div>

          {/* Itens */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-cream">Itens</h3>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="rounded-lg border border-coal-800 bg-coal-850 p-2.5">
                  <div className="flex justify-between">
                    <span className="text-sm text-cream">{it.quantity}× {it.name}</span>
                    <span className="text-sm text-ash">{formatPrice(it.totalPrice)}</span>
                  </div>
                  {it.complements.map((c, i) => (
                    <p key={i} className="text-xs text-ash">+ {c.quantity}× {c.name}</p>
                  ))}
                  {it.note && <p className="text-xs italic text-ash-dark">“{it.note}”</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Conta */}
          <div className="rounded-xl border border-coal-800 bg-coal-850 p-3 text-sm">
            <div className="flex justify-between text-ash"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.deliveryFee > 0 && <div className="flex justify-between text-ash"><span>Entrega</span><span>{formatPrice(order.deliveryFee)}</span></div>}
            {order.discount > 0 && <div className="flex justify-between text-success"><span>Desconto</span><span>− {formatPrice(order.discount)}</span></div>}
            <div className="mt-1 flex justify-between border-t border-coal-800 pt-1 font-bold text-cream"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            {order.paymentMethod && (
              <p className="mt-2 text-xs text-ash">
                Pagamento: {PAYMENT_LABEL[order.paymentMethod]}
                {order.paymentMethod === "CASH" && order.changeFor ? ` · troco p/ ${formatPrice(order.changeFor)}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 border-t border-coal-800 p-4">
          {order.status !== "COMPLETED" && order.status !== "CANCELED" && (
            <Button className="w-full justify-between" onClick={onAdvance}>
              <span>{ADVANCE_LABEL[order.status]}</span>
              <ChevronRight size={16} />
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
              <Printer size={15} /> Imprimir
            </Button>
            {order.status !== "CANCELED" && order.status !== "COMPLETED" && (
              <Button variant="ghost" size="sm" className="flex-1 text-danger" onClick={onCancel}>
                <Ban size={15} /> Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
