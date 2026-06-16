"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copiado!" : "Copiar link"}
    </Button>
  );
}
