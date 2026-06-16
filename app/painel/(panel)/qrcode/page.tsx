import { QrCode } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { QrTabs } from "@/components/admin/qrcode/QrTabs";

export const dynamic = "force-dynamic";

export default async function QrCodePage() {
  const session = await requireSession();

  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: { slug: true, name: true },
  });

  if (!store) {
    return (
      <>
        <PageHeader
          title="QR Code"
          subtitle="Gere QR Codes para o cardápio da sua loja."
        />
        <EmptyState
          icon={<QrCode className="h-8 w-8" />}
          title="Loja não encontrada"
          description="Não foi possível localizar os dados da loja para gerar o QR Code."
        />
      </>
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const menuUrl = base + "/cardapio/" + store.slug;

  return (
    <>
      <PageHeader
        title="QR Code"
        subtitle="Compartilhe o cardápio digital com seus clientes através de QR Codes."
      />
      <QrTabs menuUrl={menuUrl} />
    </>
  );
}
