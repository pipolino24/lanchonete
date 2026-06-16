"use client";

import { useRef } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NovaCategoria({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <details ref={detailsRef} className="relative">
      <summary className="list-none">
        <span className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-coal-750 px-3 text-sm font-semibold text-cream ring-1 ring-coal-700 transition-colors hover:bg-coal-700">
          <FolderPlus className="h-4 w-4" />
          Nova categoria
        </span>
      </summary>

      <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-coal-700 bg-coal-900 p-4 shadow-xl">
        <form
          action={action}
          onSubmit={() => {
            // fecha o dropdown ao enviar
            requestAnimationFrame(() => {
              if (detailsRef.current) detailsRef.current.open = false;
            });
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Nome da categoria</span>
            <input
              name="name"
              required
              placeholder="Ex: Hambúrgueres"
              className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Emoji (opcional)</span>
            <input
              name="emoji"
              maxLength={4}
              placeholder="🍔"
              className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
            />
          </label>

          <Button type="submit" size="sm" className="w-full">
            Criar categoria
          </Button>
        </form>
      </div>
    </details>
  );
}
