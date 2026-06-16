"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function DesktopCategoryRail({
  categories,
}: {
  categories: { id: string; name: string; emoji: string | null; count: number }[];
}) {
  const [active, setActive] = useState(categories[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace("cat-", ""));
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  function scrollTo(id: string) {
    const el = document.getElementById(`cat-${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: "smooth" });
  }

  return (
    <nav className="sticky top-24 space-y-1">
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ash-dark">Categorias</p>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => scrollTo(c.id)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
            active === c.id
              ? "bg-ember-500/15 font-semibold text-ember-400"
              : "text-ash hover:bg-coal-800 hover:text-cream",
          )}
        >
          <span className="truncate">
            {c.emoji ? `${c.emoji} ` : ""}
            {c.name}
          </span>
          <span className="text-xs text-ash-dark">{c.count}</span>
        </button>
      ))}
    </nav>
  );
}
