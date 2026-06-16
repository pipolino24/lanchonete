"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ExportCustomer = {
  name: string;
  phone: string;
  ordersCount: number;
  createdAt: string; // ISO
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Escapa um valor para uma célula CSV (aspas duplas + escape de aspas internas).
function csvCell(value: string | number): string {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}

export function ExportButton({ customers }: { customers: ExportCustomer[] }) {
  function handleExport() {
    const header = ["Nome", "Telefone", "Pedidos", "Cadastro"];
    const rows = customers.map((c) =>
      [
        csvCell(c.name),
        csvCell(c.phone),
        csvCell(c.ordersCount),
        csvCell(dateFmt.format(new Date(c.createdAt))),
      ].join(","),
    );

    // BOM para o Excel reconhecer UTF-8 (acentos PT-BR)
    const csv = "﻿" + [header.map(csvCell).join(","), ...rows].join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `clientes-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleExport}
      disabled={customers.length === 0}
    >
      <Download size={16} />
      Exportar CSV
    </Button>
  );
}
