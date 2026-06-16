"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="no-print"
    >
      <Printer size={16} />
      Imprimir / PDF
    </Button>
  );
}
