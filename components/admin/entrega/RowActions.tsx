"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToggleButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => onToggle())}
      title={active ? "Ativo — clique para desativar" : "Inativo — clique para ativar"}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50",
        active ? "bg-ember-500" : "bg-coal-700",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-cream transition-transform",
          active ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Tem certeza que deseja excluir?")) start(() => onDelete());
      }}
      title="Excluir"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ash transition-colors hover:bg-danger/15 hover:text-danger disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
