"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/store/CategoryIcon";

export function CategoryNav({
  categories,
}: {
  categories: { id: string; name: string; emoji: string | null }[];
}) {
  const [active, setActive] = useState(categories[0]?.id);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace("cat-", ""));
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 },
    );
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  function scrollTo(id: string) {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  return (
    <div className="sticky top-0 z-30 border-b border-coal-800 bg-coal-950/90 backdrop-blur">
      <div ref={navRef} className="no-scrollbar mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => scrollTo(c.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === c.id
                ? "bg-ember-500 text-white"
                : "bg-coal-850 text-ash ring-1 ring-coal-700 hover:text-cream",
            )}
          >
            <span className="flex items-center gap-1.5">
              <CategoryIcon emoji={c.emoji} size={15} className="shrink-0" />
              {c.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
