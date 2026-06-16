"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderType = "DELIVERY" | "PICKUP" | "DINEIN";

export type CartComplement = {
  itemId: string;
  groupId: string;
  groupTitle: string;
  name: string;
  price: number; // centavos
  quantity: number;
};

export type CartLine = {
  lineId: string;
  productId: string;
  name: string;
  image?: string;
  unitPrice: number; // centavos (base)
  quantity: number;
  note?: string;
  removedIngredients: string[];
  complements: CartComplement[];
};

export function lineUnitTotal(line: CartLine): number {
  const comps = line.complements.reduce((s, c) => s + c.price * c.quantity, 0);
  return line.unitPrice + comps;
}

export function lineTotal(line: CartLine): number {
  return lineUnitTotal(line) * line.quantity;
}

export type CustomerInfo = {
  name: string;
  phone: string;
};

export type AddressInfo = {
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
};

type CartState = {
  storeSlug: string | null;
  items: CartLine[];
  orderType: OrderType;
  customer: CustomerInfo;
  address: AddressInfo;
  scheduledFor: string | null;

  setStore: (slug: string) => void;
  addItem: (line: Omit<CartLine, "lineId">) => void;
  updateQty: (lineId: string, delta: number) => void;
  removeItem: (lineId: string) => void;
  setOrderType: (t: OrderType) => void;
  setCustomer: (c: Partial<CustomerInfo>) => void;
  setAddress: (a: Partial<AddressInfo>) => void;
  setScheduledFor: (v: string | null) => void;
  clear: () => void;
};

const emptyCustomer: CustomerInfo = { name: "", phone: "" };
const emptyAddress: AddressInfo = {
  zipCode: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  complement: "",
};

let counter = 0;
function newLineId() {
  counter += 1;
  return `line_${Date.now()}_${counter}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      storeSlug: null,
      items: [],
      orderType: "DELIVERY",
      customer: emptyCustomer,
      address: emptyAddress,
      scheduledFor: null,

      setStore: (slug) =>
        set((s) => (s.storeSlug === slug ? s : { storeSlug: slug, items: [] })),

      addItem: (line) =>
        set((s) => ({ items: [...s.items, { ...line, lineId: newLineId() }] })),

      updateQty: (lineId, delta) =>
        set((s) => ({
          items: s.items
            .map((it) =>
              it.lineId === lineId ? { ...it, quantity: it.quantity + delta } : it,
            )
            .filter((it) => it.quantity > 0),
        })),

      removeItem: (lineId) =>
        set((s) => ({ items: s.items.filter((it) => it.lineId !== lineId) })),

      setOrderType: (orderType) => set({ orderType }),
      setCustomer: (c) => set((s) => ({ customer: { ...s.customer, ...c } })),
      setAddress: (a) => set((s) => ({ address: { ...s.address, ...a } })),
      setScheduledFor: (scheduledFor) => set({ scheduledFor }),
      clear: () => set({ items: [] }),
    }),
    { name: "cariri-cart" },
  ),
);

export function cartCount(items: CartLine[]): number {
  return items.reduce((s, it) => s + it.quantity, 0);
}

export function cartSubtotal(items: CartLine[]): number {
  return items.reduce((s, it) => s + lineTotal(it), 0);
}
