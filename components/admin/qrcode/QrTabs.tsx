"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type TabKey = "online" | "mesa";

const TABS: { key: TabKey; label: string; icon: typeof ShoppingBag; hint: string }[] = [
  {
    key: "online",
    label: "Pedidos Online",
    icon: ShoppingBag,
    hint: "Compartilhe este QR Code com seus clientes para que eles acessem o cardápio e façam pedidos de delivery ou retirada.",
  },
  {
    key: "mesa",
    label: "Pedidos Mesa",
    icon: UtensilsCrossed,
    hint: "Imprima e coloque este QR Code nas mesas. O cliente acessa o mesmo cardápio direto pelo celular.",
  },
];

export function QrTabs({ menuUrl }: { menuUrl: string }) {
  const [tab, setTab] = useState<TabKey>("online");
  const [copied, setCopied] = useState(false);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(
    menuUrl,
  )}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-coal-800 bg-coal-900/60 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-ember-500 text-coal-950"
                  : "text-ash hover:bg-coal-800 hover:text-cream",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-coal-800 bg-coal-900/60 p-5">
        <p className="mb-5 text-sm text-ash">{active.hint}</p>

        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="rounded-xl bg-white p-4 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt={`QR Code do cardápio (${active.label})`}
              width={320}
              height={320}
              className="h-[280px] w-[280px] sm:h-[320px] sm:w-[320px]"
            />
          </div>

          <div className="w-full flex-1 space-y-4">
            <div>
              <span className="mb-1 block text-xs font-medium text-ash">
                Link do cardápio
              </span>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={menuUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyLink}
                  aria-label="Copiar link"
                  title="Copiar link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="mt-1 text-xs text-success">Link copiado!</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ember-500 px-5 text-sm font-semibold text-white shadow-lg shadow-ember-600/20 transition-colors duration-150 hover:bg-ember-600 active:bg-ember-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/60"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir cardápio
              </a>
              <a
                href={qrSrc}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-transparent px-5 text-sm font-semibold text-cream ring-1 ring-coal-600 transition-colors duration-150 hover:bg-coal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/60"
              >
                Baixar QR Code
              </a>
            </div>

            <p className="text-xs text-ash-dark">
              Dica: clique com o botão direito sobre o QR Code para salvar a imagem
              e usar em materiais impressos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
