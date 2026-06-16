import { PrismaClient, ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Imagens (Unsplash — a UI faz fallback gracioso se alguma falhar)
const IMG = {
  cheeseburger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=70",
  bigburger:
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=70",
  fries:
    "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=700&q=70",
  rusticfries:
    "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=700&q=70",
  loadedfries:
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=700&q=70",
  soda:
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=70",
  beer:
    "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=70",
  dessert:
    "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=700&q=70",
  water:
    "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=700&q=70",
  cover:
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=75",
};

async function main() {
  console.log("🌱 Limpando dados...");
  await prisma.orderItemComplement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.productComplementGroup.deleteMany();
  await prisma.complementItem.deleteMany();
  await prisma.complementGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.paymentConfig.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.user.deleteMany();
  await prisma.store.deleteMany();

  console.log("🏪 Criando loja...");
  const store = await prisma.store.create({
    data: {
      name: "Cariri Burguer",
      slug: "cariri-burguer",
      whatsapp: "(88) 99719-8394",
      minOrder: 500,
      prepTime: 40,
      primaryColor: "#F2611F",
      coverUrl: IMG.cover,
      street: "Rua João Aires de Aquino",
      number: "54",
      neighborhood: "Vila Alta",
      city: "Crato",
      state: "CE",
      zipCode: "63119-450",
      deliveryMode: "KM",
      freeShippingAbove: 8000,
      pixKey: "88997198394",
      pixKeyType: "PHONE",
    },
  });

  // Horários: todos os dias 18:00–23:30
  await prisma.businessHour.createMany({
    data: Array.from({ length: 7 }, (_, weekday) => ({
      storeId: store.id,
      weekday,
      openTime: "18:00",
      closeTime: "23:30",
      active: true,
    })),
  });

  console.log("👤 Criando usuário admin...");
  await prisma.user.create({
    data: {
      storeId: store.id,
      name: "Administrador",
      email: "admin@cariri.com",
      passwordHash: await bcrypt.hash("cariri123", 10),
      role: "OWNER",
    },
  });

  // ── Grupos de adicionais ────────────────────────────────────
  console.log("➕ Criando grupos de adicionais...");
  async function group(
    title: string,
    items: { name: string; price: number; description?: string; imageUrl?: string }[],
    description?: string,
  ) {
    return prisma.complementGroup.create({
      data: {
        storeId: store.id,
        title,
        description,
        items: {
          create: items.map((it, i) => ({
            name: it.name,
            price: it.price,
            description: it.description,
            imageUrl: it.imageUrl,
            position: i,
          })),
        },
      },
      include: { items: true },
    });
  }

  const gTurbinar = await group("Que tal turbinar seu hambúrguer?", [
    { name: "Bife bovino", price: 500 },
    { name: "Bife de frango", price: 400 },
    { name: "Molho barbecue", price: 300 },
    { name: "Molho de pimenta", price: 300 },
    { name: "Queijo Cheddar", price: 500 },
    { name: "Queijo Mussarela", price: 400 },
    { name: "Queijo Prato", price: 400 },
  ]);

  const gFritas = await group("Acompanhe com fritas", [
    {
      name: "Fritas com cheddar e bacon",
      price: 2400,
      description:
        "Fritas crocantes, acompanhadas de molho de cheddar inglês e cubos crocantes de bacon.",
      imageUrl: IMG.loadedfries,
    },
    {
      name: "Fritas rústicas",
      price: 1900,
      description:
        "Nossas batatas rústicas são temperadas com ervas e especiarias.",
      imageUrl: IMG.rusticfries,
    },
  ]);

  const gMaionese = await group(
    "Deseja maionese e ketchup?",
    [
      { name: "Maionese caseira", price: 0 },
      { name: "Sachê de ketchup", price: 0 },
    ],
    "Cortesia da casa",
  );

  const gDocinho = await group("Que tal um docinho?", [
    { name: "Bis Xtra Oreo", price: 350 },
    { name: "Caixa Bombom Nestlé 251g", price: 1199 },
    { name: "Ferrero Rocher 12un 150g", price: 1899 },
    { name: "Fini Beijos Morango 90g", price: 599 },
    { name: "Nutella 150g", price: 999 },
    { name: "Serenata de amor", price: 100 },
  ]);

  const gBebida = await group("Que tal uma bebida?", [
    { name: "Coca-Cola lata 350ml", price: 499 },
    { name: "H2O Lemon 500ml", price: 499 },
    { name: "Heineken long neck", price: 599 },
    { name: "Suco de laranja natural 500ml", price: 700 },
    { name: "Suco natural de morango 500ml", price: 899 },
  ]);

  const gQueijos = await group("Queijos", [
    { name: "Queijo Cheddar", price: 500 },
    { name: "Queijo Mussarela", price: 400 },
    { name: "Queijo Prato", price: 400 },
  ]);

  // ── Categorias e produtos ───────────────────────────────────
  console.log("🍔 Criando categorias e produtos...");
  type P = {
    name: string;
    price: number;
    description?: string;
    images?: string[];
    measureValue?: string;
    measureUnit?: string;
    serves?: number;
    featured?: boolean;
    groups?: { id: string; required?: boolean; min?: number; max?: number }[];
    removable?: string[];
  };

  async function category(name: string, emoji: string, position: number, products: P[]) {
    const cat = await prisma.category.create({
      data: { storeId: store.id, name, emoji, position },
    });
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId: cat.id,
          type: ProductType.COMMON,
          name: p.name,
          description: p.description,
          price: p.price,
          images: p.images ?? [],
          measureValue: p.measureValue,
          measureUnit: p.measureUnit,
          serves: p.serves,
          featured: p.featured ?? false,
          position: i,
          removableIngredients: p.removable ?? [],
          complementLinks: p.groups
            ? {
                create: p.groups.map((g, gi) => ({
                  groupId: g.id,
                  required: g.required ?? false,
                  min: g.min ?? 0,
                  max: g.max ?? 0,
                  position: gi,
                })),
              }
            : undefined,
        },
      });
    }
    return cat;
  }

  const burgerGroups = [
    { id: gTurbinar.id },
    { id: gFritas.id },
    { id: gMaionese.id },
    { id: gQueijos.id },
    { id: gDocinho.id },
    { id: gBebida.id },
  ];

  await category("Hambúrgueres", "🍔", 0, [
    {
      name: "Cheeseburguer barbecue",
      price: 1500,
      description: "Nosso clássico! Pão, carne, queijo e nosso delicioso molho barbecue.",
      images: [IMG.cheeseburger],
      serves: 1,
      groups: burgerGroups,
      removable: ["Pão brioche", "Carne", "Queijo", "Molho barbecue"],
    },
    {
      name: "Triple cheddar bacon",
      price: 3900,
      description:
        "Nosso carro-chefe! 3 bifes artesanais de 180g, 6 fatias de cheddar inglês e 3 generosas fatias de bacon crocante.",
      images: [IMG.bigburger],
      measureValue: "730",
      measureUnit: "g",
      serves: 1,
      featured: true,
      groups: burgerGroups,
      removable: ["Pão brioche", "Bife bovino", "Cheddar", "Bacon"],
    },
  ]);

  await category("Fritas", "🍟", 1, [
    {
      name: "Batata frita",
      price: 1600,
      description: "O clássico acompanhamento para seu hambúrguer!",
      images: [IMG.fries],
      measureValue: "400",
      measureUnit: "g",
      serves: 2,
      groups: [{ id: gMaionese.id }, { id: gBebida.id }],
    },
    {
      name: "Batata rústica",
      price: 1900,
      description:
        "Nossas batatas rústicas são temperadas com ervas e especiarias, que trazem um sabor robusto e textura crocante.",
      images: [IMG.rusticfries],
      measureValue: "400",
      measureUnit: "g",
      serves: 2,
      featured: true,
      groups: [{ id: gMaionese.id }, { id: gBebida.id }],
    },
    {
      name: "Batata com cheddar e bacon",
      price: 2400,
      description:
        "Fritas crocantes, acompanhadas de molho de cheddar inglês e cubos crocantes de bacon. Você vai se apaixonar!",
      images: [IMG.loadedfries],
      measureValue: "400",
      measureUnit: "g",
      serves: 2,
      groups: [{ id: gBebida.id }],
    },
  ]);

  await category("Que tal uma sobremesa?", "🍫", 2, [
    { name: "Serenata de amor", price: 100, measureValue: "16.5", measureUnit: "g", images: [IMG.dessert] },
    {
      name: "Chocolate Bis Xtra 45g",
      price: 350,
      description: "Ao Leite, Black ou Oreo. Wafer em versão Xtra do Bis.",
      measureValue: "45",
      measureUnit: "g",
      images: [IMG.dessert],
    },
    {
      name: "Bala de Gelatina Beijos Morango Fini",
      price: 599,
      description: "Feita com gelatina natural, formato divertido e sabores exclusivos.",
      measureValue: "90",
      measureUnit: "g",
      images: [IMG.dessert],
    },
    { name: "Nutella", price: 999, measureValue: "150", measureUnit: "g", images: [IMG.dessert] },
    { name: "Ferrero Rocher 12 bombons", price: 1900, measureValue: "150", measureUnit: "g", images: [IMG.dessert] },
  ]);

  await category("Bebidas", "🥤", 3, [
    { name: "Água com gás", price: 250, measureValue: "500", measureUnit: "ml", images: [IMG.water] },
    { name: "Coca-cola lata", price: 499, measureValue: "350", measureUnit: "ml", images: [IMG.soda] },
    { name: "Guaraná lata", price: 500, measureValue: "350", measureUnit: "ml", images: [IMG.soda] },
    { name: "Coca-Cola 2L", price: 1000, measureValue: "2", measureUnit: "L", images: [IMG.soda] },
    { name: "Guaraná 2L", price: 1000, measureValue: "2", measureUnit: "L", images: [IMG.soda] },
    { name: "Cerveja Heineken", price: 1000, measureValue: "350", measureUnit: "ml", images: [IMG.beer] },
    { name: "Cerveja Budweiser", price: 1000, images: [IMG.beer] },
  ]);

  // ── Faixas de entrega (Km) ──────────────────────────────────
  console.log("🛵 Criando faixas de entrega...");
  await prisma.deliveryZone.createMany({
    data: [
      { storeId: store.id, label: "Até 1 km", maxKm: 1, fee: 0, etaMinutes: 25, position: 0 },
      { storeId: store.id, label: "Até 3 km", maxKm: 3, fee: 100, etaMinutes: 30, position: 1 },
      { storeId: store.id, label: "Até 5 km", maxKm: 5, fee: 150, etaMinutes: 35, position: 2 },
      { storeId: store.id, label: "Até 10 km", maxKm: 10, fee: 300, etaMinutes: 45, position: 3 },
      { storeId: store.id, label: "Até 15 km", maxKm: 15, fee: 450, etaMinutes: 55, position: 4 },
    ],
  });

  // ── Formas de pagamento ─────────────────────────────────────
  console.log("💳 Criando formas de pagamento...");
  await prisma.paymentConfig.createMany({
    data: [
      { storeId: store.id, method: "PIX" },
      { storeId: store.id, method: "CASH" },
      { storeId: store.id, method: "CREDIT", extraFeePercent: 0 },
      { storeId: store.id, method: "DEBIT", extraFeePercent: 0 },
      { storeId: store.id, method: "MEAL_VOUCHER" },
      { storeId: store.id, method: "FOOD_VOUCHER" },
    ],
  });

  // ── Mesas ───────────────────────────────────────────────────
  console.log("🪑 Criando mesas...");
  await prisma.restaurantTable.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      storeId: store.id,
      number: i + 1,
    })),
  });

  // ── Cupom de boas-vindas ────────────────────────────────────
  await prisma.coupon.create({
    data: {
      storeId: store.id,
      code: "BEMVINDO10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrder: 2000,
    },
  });

  // ── Entregador exemplo ──────────────────────────────────────
  await prisma.driver.create({
    data: { storeId: store.id, name: "João Motoboy", phone: "(88) 99999-0000" },
  });

  console.log("✅ Seed concluído!");
  console.log("   Painel:  admin@cariri.com / cariri123");
  console.log("   Cardápio: /cardapio/cariri-burguer");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
