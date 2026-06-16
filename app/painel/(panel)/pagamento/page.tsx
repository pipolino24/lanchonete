import type { PaymentMethod } from "@prisma/client";
import {
  Banknote,
  CreditCard,
  QrCode,
  Ticket,
  UtensilsCrossed,
  Check,
  X,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Card } from "@/components/admin/ui";
import { alternarPagamento, salvarTaxa } from "./actions";

export const dynamic = "force-dynamic";

const METHODS: {
  method: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  hasFee: boolean;
}[] = [
  { method: "PIX", label: "Pix", icon: <QrCode className="h-5 w-5" />, hasFee: false },
  { method: "CASH", label: "Dinheiro", icon: <Banknote className="h-5 w-5" />, hasFee: false },
  { method: "CREDIT", label: "Crédito", icon: <CreditCard className="h-5 w-5" />, hasFee: true },
  { method: "DEBIT", label: "Débito", icon: <CreditCard className="h-5 w-5" />, hasFee: true },
  {
    method: "MEAL_VOUCHER",
    label: "Vale Refeição",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    hasFee: true,
  },
  {
    method: "FOOD_VOUCHER",
    label: "Vale Alimentação",
    icon: <Ticket className="h-5 w-5" />,
    hasFee: true,
  },
];

export default async function PagamentoPage() {
  const session = await requireSession();

  // Garante que existam as 6 configurações da loja (cria com defaults se faltar).
  await Promise.all(
    METHODS.map(({ method }) =>
      prisma.paymentConfig.upsert({
        where: { storeId_method: { storeId: session.storeId, method } },
        update: {},
        create: { storeId: session.storeId, method },
      }),
    ),
  );

  const configs = await prisma.paymentConfig.findMany({
    where: { storeId: session.storeId },
  });

  const byMethod = new Map(configs.map((c) => [c.method, c]));

  return (
    <>
      <PageHeader
        title="Pagamento"
        subtitle="Formas de pagamento presenciais aceitas na entrega e na retirada."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {METHODS.map(({ method, label, icon, hasFee }) => {
          const config = byMethod.get(method)!;
          return (
            <Card key={method}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-coal-800 text-ember-400">
                    {icon}
                  </span>
                  <div>
                    <h2 className="font-display text-base font-semibold text-cream">
                      {label}
                    </h2>
                    {hasFee && config.extraFeePercent > 0 ? (
                      <Badge tone="warning">
                        Taxa de {config.extraFeePercent.toString().replace(".", ",")}%
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Toggle
                  method={method}
                  campo="delivery"
                  label="Entrega"
                  enabled={config.enabledDelivery}
                />
                <Toggle
                  method={method}
                  campo="pickup"
                  label="Retirada"
                  enabled={config.enabledPickup}
                />
              </div>

              {hasFee && (
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const raw = String(formData.get("percent") ?? "").replace(",", ".");
                    await salvarTaxa(method, Number.parseFloat(raw));
                  }}
                  className="mt-4 border-t border-coal-800 pt-4"
                >
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ash">
                      Taxa extra %
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        name="percent"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={config.extraFeePercent}
                        className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        Salvar
                      </Button>
                    </div>
                  </label>
                  <p className="mt-1 text-xs text-ash-dark">
                    Acréscimo aplicado ao total para este meio de pagamento.
                  </p>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}

function Toggle({
  method,
  campo,
  label,
  enabled,
}: {
  method: PaymentMethod;
  campo: "delivery" | "pickup";
  label: string;
  enabled: boolean;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await alternarPagamento(method, campo);
      }}
    >
      <button
        type="submit"
        className={
          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors " +
          (enabled
            ? "border-ember-500/40 bg-ember-500/10 text-cream"
            : "border-coal-700 bg-coal-900 text-ash hover:text-cream")
        }
      >
        <span className="font-medium">{label}</span>
        <span
          className={
            "grid h-5 w-5 place-items-center rounded-full " +
            (enabled ? "bg-ember-500 text-white" : "bg-coal-750 text-ash-dark")
          }
        >
          {enabled ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </span>
      </button>
    </form>
  );
}
