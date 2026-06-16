"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  emoji = "🍔",
  className,
  sizes,
  priority,
}: {
  src?: string | null;
  alt: string;
  emoji?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-gradient-to-br from-coal-750 to-coal-850 text-2xl",
          className,
        )}
        aria-label={alt}
      >
        <span className="opacity-50 grayscale">{emoji}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "200px"}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
