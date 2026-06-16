"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type ProductTypeValue = "COMMON" | "COMBO" | "PIZZA" | "WEIGHT";

const TYPE_OPTIONS: { value: ProductTypeValue; label: string }[] = [
  { value: "COMMON", label: "Comum" },
  { value: "COMBO", label: "Combo" },
  { value: "PIZZA", label: "Pizza" },
  { value: "WEIGHT", label: "Por peso" },
];

export type ProdutoInitial = {
  id: string;
  type: ProductTypeValue;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  imageUrl: string;
  measureValue: string | null;
  measureUnit: string | null;
  serves: number | null;
  stock: number | null;
  pdvCode: string | null;
  availableDelivery: boolean;
  availableDineIn: boolean;
  featured: boolean;
  active: boolean;
  removableIngredients: string[];
  groupIds: string[];
  groupRules: Record<string, { required: boolean; min: number; max: number }>;
};

type GroupRule = { on: boolean; required: boolean; min: number; max: number };

const inputCls =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-ash">{children}</span>;
}

function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ProdutoForm({
  initial,
  categories,
  groups,
  onSave,
  onDelete,
}: {
  initial: ProdutoInitial | null;
  categories: { id: string; name: string; emoji: string | null }[];
  groups: { id: string; title: string }[];
  onSave: (formData: FormData) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const isNew = !initial;
  const [type, setType] = useState<ProductTypeValue>(initial?.type ?? "COMMON");

  const [groupRules, setGroupRules] = useState<Record<string, GroupRule>>(() => {
    const map: Record<string, GroupRule> = {};
    for (const g of groups) {
      const rule = initial?.groupRules?.[g.id];
      const on = initial?.groupIds.includes(g.id) ?? false;
      map[g.id] = {
        on,
        required: rule?.required ?? false,
        min: rule?.min ?? 0,
        max: rule?.max ?? 0,
      };
    }
    return map;
  });

  function updateRule(id: string, patch: Partial<GroupRule>) {
    setGroupRules((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  return (
    <>
      <PageHeader
        title={isNew ? "Novo produto" : "Editar produto"}
        subtitle={isNew ? "Adicione um item ao cardápio." : initial?.name}
        actions={
          <Link href="/painel/produtos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        }
      />

      <form action={onSave} className="space-y-6">
        <input type="hidden" name="id" value={initial?.id ?? "novo"} />
        <input type="hidden" name="type" value={type} />

        {/* Tipo */}
        <div className="rounded-2xl border border-coal-800 bg-coal-900/60 p-5">
          <Label>Tipo de produto</Label>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-semibold ring-1 transition-colors",
                  type === opt.value
                    ? "bg-ember-500 text-white ring-ember-500"
                    : "bg-coal-850 text-ash ring-coal-700 hover:text-cream",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dados principais */}
        <div className="rounded-2xl border border-coal-800 bg-coal-900/60 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <Label>Categoria</Label>
              <select name="categoryId" required defaultValue={initial?.categoryId ?? ""} className={inputCls}>
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji ? `${c.emoji} ` : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <Label>Nome</Label>
              <input
                name="name"
                required
                defaultValue={initial?.name ?? ""}
                placeholder="Ex: X-Tudo da casa"
                className={inputCls}
              />
            </label>

            <label className="block sm:col-span-2">
              <Label>Descrição</Label>
              <textarea
                name="description"
                rows={3}
                defaultValue={initial?.description ?? ""}
                placeholder="Ingredientes, modo de preparo, etc."
                className={inputCls}
              />
            </label>

            <label className="block">
              <Label>Preço (R$)</Label>
              <input
                name="price"
                required
                inputMode="decimal"
                defaultValue={centsToInput(initial?.price)}
                placeholder="39,00"
                className={inputCls}
              />
            </label>

            <label className="block">
              <Label>Preço promocional (R$) — opcional</Label>
              <input
                name="promoPrice"
                inputMode="decimal"
                defaultValue={centsToInput(initial?.promoPrice)}
                placeholder="29,90"
                className={inputCls}
              />
            </label>

            <label className="block sm:col-span-2">
              <Label>Imagem (URL)</Label>
              <input
                name="imageUrl"
                type="url"
                defaultValue={initial?.imageUrl ?? ""}
                placeholder="https://..."
                className={inputCls}
              />
            </label>
          </div>
        </div>

        {/* Detalhes / medidas / estoque */}
        <div className="rounded-2xl border border-coal-800 bg-coal-900/60 p-5">
          <h3 className="mb-4 font-display text-sm font-bold text-cream">Detalhes</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <label className="block">
              <Label>Medida</Label>
              <input
                name="measureValue"
                defaultValue={initial?.measureValue ?? ""}
                placeholder="730"
                className={inputCls}
              />
            </label>

            <label className="block">
              <Label>Unidade</Label>
              <input
                name="measureUnit"
                defaultValue={initial?.measureUnit ?? ""}
                placeholder="g / ml / un"
                className={inputCls}
              />
            </label>

            <label className="block">
              <Label>Serve (pessoas)</Label>
              <input
                name="serves"
                type="number"
                min={0}
                defaultValue={initial?.serves ?? ""}
                placeholder="2"
                className={inputCls}
              />
            </label>

            <label className="block">
              <Label>Estoque</Label>
              <input
                name="stock"
                type="number"
                min={0}
                defaultValue={initial?.stock ?? ""}
                placeholder="—"
                className={inputCls}
              />
            </label>

            <label className="block">
              <Label>Código PDV</Label>
              <input
                name="pdvCode"
                defaultValue={initial?.pdvCode ?? ""}
                placeholder="—"
                className={inputCls}
              />
            </label>
          </div>

          <label className="mt-4 block">
            <Label>Ingredientes removíveis (separados por vírgula)</Label>
            <textarea
              name="removableIngredients"
              rows={2}
              defaultValue={(initial?.removableIngredients ?? []).join(", ")}
              placeholder="Cebola, Tomate, Picles"
              className={inputCls}
            />
          </label>
        </div>

        {/* Disponibilidade */}
        <div className="rounded-2xl border border-coal-800 bg-coal-900/60 p-5">
          <h3 className="mb-4 font-display text-sm font-bold text-cream">Disponibilidade</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToggleRow
              name="availableDelivery"
              label="Disponível para entrega/retirada"
              defaultChecked={initial?.availableDelivery ?? true}
            />
            <ToggleRow
              name="availableDineIn"
              label="Disponível para mesa/balcão"
              defaultChecked={initial?.availableDineIn ?? true}
            />
            <ToggleRow
              name="featured"
              label="Destaque na vitrine"
              defaultChecked={initial?.featured ?? false}
            />
            <ToggleRow
              name="active"
              label="Produto ativo (visível)"
              defaultChecked={initial?.active ?? true}
            />
          </div>
        </div>

        {/* Grupos de adicionais */}
        <div className="rounded-2xl border border-coal-800 bg-coal-900/60 p-5">
          <h3 className="mb-1 font-display text-sm font-bold text-cream">Grupos de adicionais</h3>
          <p className="mb-4 text-xs text-ash">
            Selecione os grupos que aparecem para este produto e defina as regras de cada um.
          </p>

          {groups.length === 0 ? (
            <p className="text-sm text-ash-dark">
              Nenhum grupo cadastrado. Crie grupos na área de Adicionais.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => {
                const rule = groupRules[g.id];
                const on = rule?.on ?? false;
                return (
                  <div
                    key={g.id}
                    className={cn(
                      "rounded-lg border bg-coal-850 px-3 py-2.5 transition-colors",
                      on ? "border-ember-500/60" : "border-coal-700",
                    )}
                  >
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-cream">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => updateRule(g.id, { on: e.target.checked })}
                        className="h-4 w-4 accent-ember-500"
                      />
                      <span className="font-medium">{g.title}</span>
                    </label>

                    {on && (
                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-coal-700 pt-3 sm:grid-cols-3">
                        <label className="flex items-center justify-between gap-2 rounded-lg border border-coal-700 bg-coal-900 px-3 py-2 sm:col-span-1">
                          <span className="text-xs text-ash">Obrigatório</span>
                          <input
                            type="checkbox"
                            checked={rule.required}
                            onChange={(e) => updateRule(g.id, { required: e.target.checked })}
                            className="h-4 w-4 accent-ember-500"
                          />
                        </label>

                        <label className="block">
                          <Label>Mín</Label>
                          <input
                            type="number"
                            min={0}
                            value={rule.min}
                            onChange={(e) =>
                              updateRule(g.id, {
                                min: Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            className={inputCls}
                          />
                        </label>

                        <label className="block">
                          <Label>Máx (0 = sem limite)</Label>
                          <input
                            type="number"
                            min={0}
                            value={rule.max}
                            onChange={(e) =>
                              updateRule(g.id, {
                                max: Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            className={inputCls}
                          />
                        </label>
                      </div>
                    )}

                    {/* Campos enviados no FormData */}
                    {on && (
                      <>
                        <input type="hidden" name="groupIds" value={g.id} />
                        {rule.required && (
                          <input type="hidden" name={`group_${g.id}_required`} value="1" />
                        )}
                        <input type="hidden" name={`group_${g.id}_min`} value={String(rule.min)} />
                        <input type="hidden" name={`group_${g.id}_max`} value={String(rule.max)} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between gap-3">
          <Button type="submit">
            <Save className="h-4 w-4" />
            Salvar
          </Button>

          {!isNew && initial && (
            <Button type="submit" variant="danger" formAction={onDelete.bind(null, initial.id)}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
      </form>
    </>
  );
}

function ToggleRow({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-coal-700 bg-coal-850 px-3 py-2.5">
      <span className="text-sm text-cream">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-ember-500" />
    </label>
  );
}
