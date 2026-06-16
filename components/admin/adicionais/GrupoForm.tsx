"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatAmount } from "@/lib/money";
import { salvarGrupo, editarGrupo } from "@/app/painel/(panel)/adicionais/actions";

export type GrupoItem = {
  name: string;
  price: string; // texto livre, ex: "5,00"
  description: string;
};

export type GrupoFormData = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  items: GrupoItem[];
};

const EMPTY_ITEM: GrupoItem = { name: "", price: "", description: "" };

const INPUT =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-ash">{children}</span>;
}

export function GrupoForm({
  initial,
  onClose,
}: {
  initial?: GrupoFormData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const editing = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [items, setItems] = useState<GrupoItem[]>(
    initial?.items && initial.items.length > 0 ? initial.items : [{ ...EMPTY_ITEM }],
  );

  function updateItem(index: number, patch: Partial<GrupoItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }
  function removeItem(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    const formData = new FormData();
    if (editing) formData.set("id", initial!.id);
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    if (active) formData.set("active", "on");
    for (const it of items) {
      if (!it.name.trim()) continue;
      formData.append("itemName", it.name.trim());
      formData.append("itemPrice", it.price.trim());
      formData.append("itemDescription", it.description.trim());
    }

    startTransition(async () => {
      if (editing) {
        await editarGrupo(formData);
      } else {
        await salvarGrupo(formData);
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex h-full w-full max-w-lg animate-fade-in flex-col border-l border-coal-700 bg-coal-900"
      >
        <div className="flex items-center justify-between border-b border-coal-800 p-4">
          <h2 className="font-display text-xl font-bold text-cream">
            {editing ? "Editar grupo" : "Novo grupo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ash hover:bg-coal-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <label className="block">
            <Label>Título</Label>
            <input
              className={INPUT}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Adicionais do burger"
              required
            />
          </label>

          <label className="block">
            <Label>Descrição (opcional)</Label>
            <textarea
              className={INPUT}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Aparece como subtítulo do grupo"
            />
          </label>

          <label className="flex items-center gap-2.5 rounded-lg border border-coal-800 bg-coal-850 px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-ember-500"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span className="text-sm text-cream">Disponível</span>
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-cream">Itens</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus size={15} /> Adicionar item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((it, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-coal-800 bg-coal-850 p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-[1fr_120px] gap-2">
                        <input
                          className={INPUT}
                          value={it.name}
                          onChange={(e) => updateItem(i, { name: e.target.value })}
                          placeholder="Nome do item"
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ash-dark">
                            R$
                          </span>
                          <input
                            className={INPUT + " pl-9"}
                            value={it.price}
                            onChange={(e) => updateItem(i, { price: e.target.value })}
                            placeholder="0,00"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      <input
                        className={INPUT}
                        value={it.description}
                        onChange={(e) => updateItem(i, { description: e.target.value })}
                        placeholder="Descrição (opcional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                      className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ash hover:bg-coal-800 hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ash"
                      aria-label="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-ash-dark">
              Deixe o preço em branco para itens gratuitos. Linhas sem nome são ignoradas.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-coal-800 p-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending || !title.trim()}>
            {pending ? "Salvando..." : editing ? "Salvar alterações" : "Criar grupo"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Botão "Novo grupo" que abre o formulário em branco. */
export function NovoGrupoButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> Novo grupo
      </Button>
      {open && <GrupoForm onClose={() => setOpen(false)} />}
    </>
  );
}

/** Formata o preço (texto -> exibição). Apenas para reuso eventual. */
export function previewPrice(price: string): string {
  const cents = price.trim()
    ? Math.round(parseFloat(price.replace(/[^0-9.,-]/g, "").replace(",", ".")) * 100)
    : 0;
  return Number.isNaN(cents) ? "—" : formatAmount(cents);
}
