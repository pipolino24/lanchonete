"use client";

import { useState } from "react";
import { Plus, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { salvarCupom } from "@/app/painel/(panel)/cupons/actions";

const inputClass =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-medium text-ash">{children}</span>
  );
}

export function CupomForm() {
  const [open, setOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">(
    "PERCENT",
  );

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Novo cupom
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-coal-950/70 p-4 backdrop-blur-sm">
      <div className="mt-10 w-full max-w-lg rounded-2xl border border-coal-800 bg-coal-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cream">
            <Ticket className="h-5 w-5 text-ember-400" />
            Novo cupom
          </h2>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form
          action={async (formData) => {
            await salvarCupom(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <label className="block">
            <Label>Código</Label>
            <input
              name="code"
              required
              placeholder="BEMVINDO10"
              autoCapitalize="characters"
              className={`${inputClass} uppercase`}
              style={{ textTransform: "uppercase" }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <Label>Tipo de desconto</Label>
              <select
                name="discountType"
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as "PERCENT" | "FIXED")
                }
                className={inputClass}
              >
                <option value="PERCENT">Porcentagem (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
              </select>
            </label>

            <label className="block">
              <Label>
                {discountType === "PERCENT"
                  ? "Valor (0-100%)"
                  : "Valor (R$)"}
              </Label>
              <input
                name="discountValue"
                required
                inputMode={discountType === "PERCENT" ? "numeric" : "decimal"}
                placeholder={discountType === "PERCENT" ? "10" : "5,00"}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <Label>Pedido mínimo (R$, opcional)</Label>
            <input
              name="minOrder"
              inputMode="decimal"
              placeholder="30,00"
              className={inputClass}
            />
          </label>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              name="freeShipping"
              value="1"
              className="h-4 w-4 rounded border-coal-700 bg-coal-900 accent-ember-500"
            />
            <span className="text-sm text-cream">Frete grátis</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <Label>Limite por cliente (opcional)</Label>
              <input
                name="perCustomerLimit"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="1"
                className={inputClass}
              />
            </label>

            <label className="block">
              <Label>Limite geral (opcional)</Label>
              <input
                name="totalLimit"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="100"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <Label>Início (opcional)</Label>
              <input
                name="startsAt"
                type="datetime-local"
                className={inputClass}
              />
            </label>

            <label className="block">
              <Label>Fim (opcional)</Label>
              <input
                name="endsAt"
                type="datetime-local"
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Salvar cupom
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
