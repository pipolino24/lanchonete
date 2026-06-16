import { PrismaClient } from "@prisma/client";
import { createOrder } from "../lib/orders";

const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.findFirstOrThrow();
  const products = await prisma.product.findMany({ where: { storeId: store.id }, take: 6 });
  const groups = await prisma.complementGroup.findMany({
    where: { storeId: store.id },
    include: { items: true },
  });
  const turbinar = groups.find((g) => g.title.includes("turbinar"));

  const burger = products.find((p) => p.name.includes("Triple")) ?? products[0];
  const fries = products.find((p) => p.name.includes("Batata")) ?? products[1];

  // Limpa pedidos anteriores de demo
  await prisma.order.deleteMany({ where: { storeId: store.id } });

  const demos: { name: string; phone: string; type: "DELIVERY" | "PICKUP" | "DINEIN"; status: "NEW" | "PREPARING" | "DELIVERING" }[] = [
    { name: "João Silva", phone: "(88) 99111-1111", type: "DELIVERY", status: "NEW" },
    { name: "Maria Souza", phone: "(88) 99222-2222", type: "DELIVERY", status: "PREPARING" },
    { name: "Pedro Lima", phone: "(88) 99333-3333", type: "PICKUP", status: "PREPARING" },
    { name: "Ana Costa", phone: "(88) 99444-4444", type: "DELIVERY", status: "DELIVERING" },
    { name: "Mesa 4", phone: "", type: "DINEIN", status: "NEW" },
  ];

  for (const d of demos) {
    const order = await createOrder({
      storeId: store.id,
      channel: "ONLINE",
      type: d.type,
      customer: { name: d.name, phone: d.phone || `(88) 90000-${Math.floor(1000 + Math.random() * 8999)}` },
      address:
        d.type === "DELIVERY"
          ? { street: "Rua das Flores", number: "100", neighborhood: "Centro", city: "Crato", state: "CE", zipCode: "63100-000" }
          : null,
      items: [
        {
          productId: burger.id,
          quantity: 1,
          complements: turbinar ? [{ itemId: turbinar.items[0].id, quantity: 1 }] : [],
        },
        { productId: fries.id, quantity: 1 },
      ],
      paymentMethod: d.type === "DELIVERY" ? "PIX" : "CASH",
    });
    if (d.status !== "NEW") {
      await prisma.order.update({ where: { id: order.id }, data: { status: d.status } });
    }
  }

  console.log("✅ Pedidos de demonstração criados!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
