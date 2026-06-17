"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  X, ChevronLeft, Trash2, Plus, Minus, Bike, ShoppingBag,
  Banknote, QrCode, CreditCard, Check, Loader2, PartyPopper, Flame, Copy,
  Phone, MessageCircle, KeyRound, User, Calendar, Fingerprint, MapPin,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Button } from "@/components/ui/Button";
import { PriceFlow } from "@/components/ui/PriceFlow";
import { formatPrice } from "@/lib/money";
import type { DeliveryQuote } from "@/lib/delivery";
import {
  useCart, cartSubtotal, lineTotal, type OrderType, type CartLine,
} from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type PaymentMethod = "PIX" | "CASH" | "CREDIT" | "DEBIT" | "MEAL_VOUCHER" | "FOOD_VOUCHER";
type Step = "cart" | "phone" | "code" | "register" | "address" | "payment" | "review" | "success";

type SavedAddress = {
  id?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  complement?: string;
};

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; icon: React.ReactNode; hint: string }> = {
  CASH: { label: "Dinheiro", icon: <Banknote size={18} />, hint: "Pagamento na entrega" },
  PIX: { label: "Pix", icon: <QrCode size={18} />, hint: "Pague pela chave e mostre o comprovante" },
  CREDIT: { label: "Crédito", icon: <CreditCard size={18} />, hint: "Maquininha na entrega" },
  DEBIT: { label: "Débito", icon: <CreditCard size={18} />, hint: "Maquininha na entrega" },
  MEAL_VOUCHER: { label: "Vale Refeição", icon: <CreditCard size={18} />, hint: "Maquininha na entrega" },
  FOOD_VOUCHER: { label: "Vale Alimentação", icon: <CreditCard size={18} />, hint: "Maquininha na entrega" },
};

const stepVariants = {
  enter: { opacity: 0, x: 48 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -48 },
};

// Liga/desliga o login por OTP (WhatsApp). Desligado = vai direto p/ endereço,
// coletando nome + telefone na própria tela. Religar: trocar para true.
const OTP_ENABLED = false;

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function formatCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function formatBirth(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function CartSheet({
  slug,
  minOrder,
  payments,
  pixKey,
  pixKeyType,
  cartMessage,
  initialStep = "cart",
  onClose,
  onAddMore,
}: {
  slug: string;
  minOrder: number;
  freeShippingAbove: number | null;
  deliveryFeePreview: number;
  payments: { method: PaymentMethod; enabledDelivery: boolean; enabledPickup: boolean }[];
  pixKey?: string | null;
  pixKeyType?: string | null;
  cartMessage?: string | null;
  initialStep?: Step;
  onClose: () => void;
  onAddMore: () => void;
}) {
  const { items, orderType, customer, address, setOrderType, setCustomer, setAddress, updateQty, removeItem, clear } =
    useCart();
  const [step, setStep] = useState<Step>(initialStep);

  // Identidade (OTP) — o backend é construído à parte; aqui é o front
  const [phone, setPhone] = useState(customer.phone || "");
  const [code, setCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [demo, setDemo] = useState(false); // backend ainda não disponível → preview

  // Cadastro de novo cliente
  const [regName, setRegName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [registering, setRegistering] = useState(false);

  // Endereços salvos do cliente (vêm do verify-otp)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // Pedido
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [changeFor, setChangeFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const subtotal = cartSubtotal(items);
  const deliveryFee = orderType === "DELIVERY" ? (quote?.fee ?? 0) : 0;
  const total = subtotal + deliveryFee;
  const blockedByArea = orderType === "DELIVERY" && quote != null && !quote.served;

  const availablePayments = useMemo(
    () => payments.filter((p) => (orderType === "DELIVERY" ? p.enabledDelivery : p.enabledPickup)),
    [payments, orderType],
  );

  const belowMin = subtotal < minOrder;
  // Com OTP desligado, nome+telefone são coletados na tela de endereço
  const identityOk = OTP_ENABLED || (customer.name.trim() !== "" && customer.phone.replace(/\D/g, "").length >= 10);
  const addressValid =
    identityOk &&
    (orderType !== "DELIVERY" ||
      (address.street.trim() !== "" &&
        address.number.trim() !== "" &&
        address.neighborhood.trim() !== "" &&
        address.city.trim() !== ""));

  const fetchQuote = useCallback(async () => {
    if (orderType !== "DELIVERY") {
      setQuote({ served: true, free: true, fee: 0, distanceKm: null, etaMinutes: 0, estimated: false, reason: null });
      return;
    }
    setQuoteLoading(true);
    try {
      const res = await fetch(`/api/stores/${slug}/delivery-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal,
          address: {
            zipCode: address.zipCode,
            street: address.street,
            number: address.number,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
          },
        }),
      });
      if (!res.ok) throw new Error();
      setQuote(await res.json());
    } catch {
      setQuote({ served: true, free: false, fee: 0, distanceKm: null, etaMinutes: 0, estimated: true, reason: null });
    } finally {
      setQuoteLoading(false);
    }
  }, [orderType, slug, subtotal, address.zipCode, address.street, address.number, address.neighborhood, address.city, address.state]);

  // Recalcula o frete conforme o endereço muda (e ao revisar) — o valor anima sozinho
  useEffect(() => {
    if (orderType !== "DELIVERY") return;
    if (step !== "address" && step !== "review") return;
    const ready = address.neighborhood.trim() !== "" && address.city.trim() !== "";
    if (!ready) return;
    const t = setTimeout(fetchQuote, 550);
    return () => clearTimeout(t);
  }, [step, orderType, address.zipCode, address.street, address.number, address.neighborhood, address.city, fetchQuote]);

  async function lookupCep(value: string) {
    setAddress({ zipCode: value });
    const digits = value.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const d = await res.json();
        if (!d.erro) {
          setAddress({
            street: d.logradouro || "",
            neighborhood: d.bairro || "",
            city: d.localidade || "",
            state: d.uf || "",
          });
        }
      } catch {
        /* ignora falha de CEP */
      }
    }
  }

  function goAfterIdentity() {
    setStep(orderType === "DELIVERY" ? "address" : "payment");
  }

  // ── Identidade ───────────────────────────────────────────────
  async function requestOtp() {
    if (phone.replace(/\D/g, "").length < 10) return;
    setSendingOtp(true);
    setAuthError(null);
    setCustomer({ phone });
    try {
      const res = await fetch(`/api/stores/${slug}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.status === 404 || res.status === 503) {
        // serviço de OTP ainda não configurado → modo preview
        setDemo(true);
        setStep("code");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Não foi possível enviar o código.");
      setDevCode(data?.devCode ?? null);
      setStep("code");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Erro ao enviar o código.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    if (code.length < 4) return;
    setVerifying(true);
    setAuthError(null);
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 900));
        setCustomer({ phone });
        setStep("register");
        return;
      }
      const res = await fetch(`/api/stores/${slug}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Código inválido. Tente novamente.");
      setCustomer({ name: data?.customer?.name ?? customer.name, phone });
      if (data?.registered) {
        const addrs: SavedAddress[] = data?.addresses ?? [];
        setSavedAddresses(addrs);
        if (addrs.length > 0) applySaved(addrs[0]);
        goAfterIdentity();
      } else {
        setStep("register");
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Erro na verificação.");
    } finally {
      setVerifying(false);
    }
  }

  async function registerCustomer() {
    if (!regName.trim() || cpf.replace(/\D/g, "").length !== 11 || birthDate.replace(/\D/g, "").length !== 8) return;
    setRegistering(true);
    setAuthError(null);
    try {
      if (!demo) {
        const res = await fetch(`/api/stores/${slug}/customers/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, name: regName, cpf, birthDate }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status !== 404 && !res.ok) throw new Error(data?.error || "Não foi possível cadastrar.");
      }
      setCustomer({ name: regName, phone });
      goAfterIdentity();
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Erro no cadastro.");
    } finally {
      setRegistering(false);
    }
  }

  function applySaved(a: SavedAddress) {
    setAddress({
      zipCode: a.zipCode ?? "",
      street: a.street ?? "",
      number: a.number ?? "",
      neighborhood: a.neighborhood ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      complement: a.complement ?? "",
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          customer: { name: customer.name, phone: customer.phone, cpf },
          address: orderType === "DELIVERY" ? address : null,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            note: it.note,
            removedIngredients: it.removedIngredients,
            complements: it.complements.map((c) => ({ itemId: c.itemId, quantity: c.quantity })),
          })),
          paymentMethod: payment,
          changeFor: payment === "CASH" && changeFor ? Math.round(parseFloat(changeFor.replace(",", ".")) * 100) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Falha ao enviar pedido");
      setOrderCode(data.code);
      clear();
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    setAuthError(null);
    setError(null);
    setStep((s) => {
      switch (s) {
        case "phone": return "cart";
        case "code": return "phone";
        case "register": return "code";
        case "address": return OTP_ENABLED ? "code" : "cart";
        case "payment": return orderType === "DELIVERY" ? "address" : OTP_ENABLED ? "code" : "address";
        case "review": return "payment";
        default: return "cart";
      }
    });
  }

  const titles: Record<Step, string> = {
    cart: "Seu pedido",
    phone: "Identifique-se",
    code: "Confirmação",
    register: "Criar cadastro",
    address: "Endereço de entrega",
    payment: "Pagamento",
    review: "Revisar pedido",
    success: "Pedido enviado!",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-coal-700 bg-coal-900 sm:rounded-3xl lg:max-h-[86vh] lg:w-auto lg:max-w-3xl lg:flex-row">
        {/* Coluna esquerda — fluxo */}
        <div className="flex min-h-0 w-full flex-col lg:w-[440px]">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 border-b border-coal-800 p-4">
          {step !== "cart" && step !== "success" && (
            <button
              onClick={goBack}
              className="grid h-8 w-8 place-items-center rounded-lg text-ash transition-colors hover:bg-coal-800"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <h2 className="flex-1 font-display text-lg font-bold text-cream">
            {step === "address" && !OTP_ENABLED ? "Seus dados" : titles[step]}
          </h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ash hover:bg-coal-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              {step === "cart" && (
                <>
                  {cartMessage && items.length > 0 && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl border border-ember-500/25 bg-ember-500/10 p-3 text-sm text-ember-300">
                      <Flame size={16} className="mt-0.5 shrink-0 text-ember-400" />
                      <span>{cartMessage}</span>
                    </div>
                  )}
                  <CartStep
                    items={items}
                    orderType={orderType}
                    onType={setOrderType}
                    onQty={updateQty}
                    onRemove={removeItem}
                    onAddMore={onAddMore}
                  />
                </>
              )}

              {/* ── TELEFONE ── */}
              {step === "phone" && (
                <div className="space-y-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ember-500/15 text-ember-400">
                    <MessageCircle size={26} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream">Qual seu WhatsApp?</h3>
                    <p className="mt-1 text-sm text-ash">
                      Enviaremos um código para confirmar seu número e identificar seu pedido.
                    </p>
                  </div>
                  <Field label="Número de WhatsApp">
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-dark" />
                      <input
                        autoFocus
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        className="input pl-9"
                        placeholder="(88) 99999-9999"
                        inputMode="numeric"
                      />
                    </div>
                  </Field>
                  {authError && <p className="text-sm text-danger">{authError}</p>}
                </div>
              )}

              {/* ── CÓDIGO OTP ── */}
              {step === "code" && (
                <div className="space-y-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ember-500/15 text-ember-400">
                    <KeyRound size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream">Digite o código</h3>
                    <p className="mt-1 text-sm text-ash">
                      Enviamos um código de 6 dígitos para <span className="text-cream">{phone}</span>.
                    </p>
                  </div>
                  <input
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="input text-center font-mono text-2xl tracking-[0.5em]"
                    placeholder="••••••"
                    inputMode="numeric"
                    maxLength={6}
                  />
                  {demo && (
                    <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                      Modo de demonstração (login por WhatsApp ainda sendo publicado): digite qualquer
                      código de 6 dígitos para continuar.
                    </p>
                  )}
                  {devCode && (
                    <p className="text-xs text-ash-dark">Código de teste: <span className="font-mono text-ember-400">{devCode}</span></p>
                  )}
                  <button onClick={requestOtp} className="text-sm text-ember-400 hover:underline" disabled={sendingOtp}>
                    Reenviar código
                  </button>
                  {authError && <p className="text-sm text-danger">{authError}</p>}
                </div>
              )}

              {/* ── CADASTRO (novo cliente) ── */}
              {step === "register" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-cream">Quase lá! Seu cadastro</h3>
                    <p className="mt-1 text-sm text-ash">É a primeira vez por aqui — só precisamos de alguns dados.</p>
                  </div>
                  {[
                    { key: "name", label: "Nome completo", icon: <User size={16} />, value: regName, set: (v: string) => setRegName(v), placeholder: "Seu nome completo", mode: undefined },
                    { key: "cpf", label: "CPF", icon: <Fingerprint size={16} />, value: cpf, set: (v: string) => setCpf(formatCpf(v)), placeholder: "000.000.000-00", mode: "numeric" as const },
                    { key: "birth", label: "Data de nascimento", icon: <Calendar size={16} />, value: birthDate, set: (v: string) => setBirthDate(formatBirth(v)), placeholder: "DD/MM/AAAA", mode: "numeric" as const },
                  ].map((f, i) => (
                    <motion.div
                      key={f.key}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.08 }}
                    >
                      <Field label={f.label}>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-dark">{f.icon}</span>
                          <input
                            value={f.value}
                            onChange={(e) => f.set(e.target.value)}
                            className="input pl-9"
                            placeholder={f.placeholder}
                            inputMode={f.mode}
                          />
                        </div>
                      </Field>
                    </motion.div>
                  ))}
                  {authError && <p className="text-sm text-danger">{authError}</p>}
                </div>
              )}

              {/* ── ENDEREÇO ── */}
              {step === "address" && (
                <div className="space-y-4">
                  <TypeToggle orderType={orderType} onType={setOrderType} />

                  {!OTP_ENABLED && (
                    <div className="space-y-4">
                      <Field label="Seu nome">
                        <input
                          value={customer.name}
                          onChange={(e) => setCustomer({ name: e.target.value })}
                          className="input"
                          placeholder="Nome completo"
                        />
                      </Field>
                      <Field label="Telefone / WhatsApp">
                        <input
                          value={customer.phone}
                          onChange={(e) => setCustomer({ phone: formatPhone(e.target.value) })}
                          className="input"
                          placeholder="(88) 99999-9999"
                          inputMode="numeric"
                        />
                      </Field>
                    </div>
                  )}

                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-ash-dark">Endereços salvos</p>
                      {savedAddresses.map((a, i) => {
                        const active = a.street === address.street && a.number === address.number;
                        return (
                          <motion.button
                            key={a.id ?? i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, type: "spring", stiffness: 320, damping: 26 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applySaved(a)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                              active ? "border-ember-500 bg-ember-500/10" : "border-coal-700 bg-coal-850 hover:border-coal-600",
                            )}
                          >
                            <MapPin size={16} className="mt-0.5 shrink-0 text-ember-400" />
                            <div className="min-w-0 text-sm">
                              <p className="font-medium text-cream">{a.street}, {a.number}</p>
                              <p className="text-xs text-ash">{a.neighborhood} · {a.city}</p>
                            </div>
                            {active && <Check size={16} className="ml-auto text-ember-500" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {orderType === "DELIVERY" ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="CEP">
                          <input value={address.zipCode} onChange={(e) => lookupCep(e.target.value)} className="input" placeholder="00000-000" inputMode="numeric" />
                        </Field>
                        <Field label="Número">
                          <input value={address.number} onChange={(e) => setAddress({ number: e.target.value })} className="input" placeholder="123" />
                        </Field>
                      </div>
                      <Field label="Rua">
                        <input value={address.street} onChange={(e) => setAddress({ street: e.target.value })} className="input" placeholder="Nome da rua" />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Bairro">
                          <input value={address.neighborhood} onChange={(e) => setAddress({ neighborhood: e.target.value })} className="input" placeholder="Bairro" />
                        </Field>
                        <Field label="Cidade">
                          <input value={address.city} onChange={(e) => setAddress({ city: e.target.value })} className="input" placeholder="Cidade" />
                        </Field>
                      </div>
                      <Field label="Complemento / referência (opcional)">
                        <input value={address.complement} onChange={(e) => setAddress({ complement: e.target.value })} className="input" placeholder="Apto, bloco, ponto de referência" />
                      </Field>

                      {/* Frete ao vivo — anima conforme o endereço muda */}
                      {(address.neighborhood.trim() || address.city.trim()) && (
                        <motion.div layout className="rounded-xl border border-coal-800 bg-coal-850 p-3">
                          {quoteLoading ? (
                            <p className="flex items-center gap-2 text-sm text-ash">
                              <Loader2 size={14} className="animate-spin" /> Calculando entrega…
                            </p>
                          ) : quote && !quote.served ? (
                            <p className="text-sm font-medium text-danger">{quote.reason}</p>
                          ) : quote ? (
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1.5 text-ash">
                                <Bike size={14} className="text-ember-400" /> Entrega
                                {quote.distanceKm != null && <span className="text-ash-dark">· {quote.distanceKm} km</span>}
                              </span>
                              {quote.free ? (
                                <span className="font-semibold text-success">GRÁTIS</span>
                              ) : (
                                <PriceFlow cents={quote.fee} className="font-semibold text-ember-400" />
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-ash-dark">Preencha o endereço para calcular a entrega.</p>
                          )}
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-coal-800 bg-coal-850 p-4 text-sm text-ash">
                      Você escolheu <span className="font-medium text-cream">retirada</span> — é só passar na loja para
                      buscar o pedido.
                    </div>
                  )}
                </div>
              )}

              {/* ── PAGAMENTO ── */}
              {step === "payment" && (
                <div className="space-y-3">
                  <p className="text-sm text-ash">Como você vai pagar na entrega?</p>
                  {availablePayments.length === 0 ? (
                    <div className="rounded-xl border border-coal-800 bg-coal-850 p-4 text-sm text-ash">
                      Nenhuma forma de pagamento está ativa para esse tipo de pedido.
                    </div>
                  ) : (
                    availablePayments.map((p, index) => {
                      const selected = payment === p.method;
                      return (
                        <motion.button
                          key={p.method}
                          onClick={() => setPayment(p.method)}
                          initial={{ opacity: 0, x: -18 }}
                          animate={{ opacity: 1, x: 0, scale: selected ? 1.02 : 1 }}
                          transition={{ delay: index * 0.07, type: "spring", stiffness: 320, damping: 24 }}
                          whileHover={{ scale: selected ? 1.02 : 1.01, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left",
                            selected
                              ? "border-ember-500 bg-ember-500/10 shadow-lg shadow-ember-600/20"
                              : "border-coal-700 bg-coal-850 hover:border-coal-600",
                          )}
                        >
                          <span className="text-ember-400">{PAYMENT_LABELS[p.method].icon}</span>
                          <span className="flex-1">
                            <span className="block font-medium text-cream">{PAYMENT_LABELS[p.method].label}</span>
                            <span className="block text-xs text-ash">{PAYMENT_LABELS[p.method].hint}</span>
                          </span>
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                              selected ? "border-ember-500 bg-ember-500" : "border-coal-600",
                            )}
                          >
                            {selected && <Check size={13} className="text-white" />}
                          </span>
                        </motion.button>
                      );
                    })
                  )}

                  <AnimatePresence mode="wait">
                    {payment === "CASH" && (
                      <motion.div
                        key="cash"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-1">
                          <Field label="Troco para quanto? (opcional)">
                            <input
                              value={changeFor}
                              onChange={(e) => setChangeFor(e.target.value)}
                              className="input"
                              placeholder="R$ 0,00"
                              inputMode="decimal"
                            />
                          </Field>
                        </div>
                      </motion.div>
                    )}
                    {payment === "PIX" && pixKey && (
                      <motion.div
                        key="pix"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 rounded-xl border border-ember-500/25 bg-ember-500/10 p-3.5">
                          <p className="text-xs text-ash">
                            Chave Pix
                            {pixKeyType
                              ? ` · ${({ CPF: "CPF", CNPJ: "CNPJ", EMAIL: "E-mail", PHONE: "Telefone", RANDOM: "Aleatória" } as Record<string, string>)[pixKeyType] ?? pixKeyType}`
                              : ""}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <code className="flex-1 break-all text-sm font-semibold text-cream">{pixKey}</code>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard?.writeText(pixKey)}
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-coal-800 text-ember-400 ring-1 ring-coal-700 hover:bg-coal-750"
                              title="Copiar chave"
                            >
                              <Copy size={15} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── REVISÃO ── */}
              {step === "review" && (
                <div className="space-y-4">
                  <Summary items={items} />
                  <div className="rounded-xl border border-coal-800 bg-coal-850 p-3 text-sm">
                    <Row label="Tipo" value={orderType === "DELIVERY" ? "Delivery" : orderType === "PICKUP" ? "Retirada" : "Mesa"} />
                    <Row label="Cliente" value={customer.name || phone} />
                    {orderType === "DELIVERY" && <Row label="Endereço" value={`${address.street}, ${address.number}`} />}
                    <Row label="Pagamento" value={payment ? PAYMENT_LABELS[payment].label : "—"} />
                  </div>
                  <div className="rounded-xl border border-coal-800 bg-coal-850 p-3">
                    {orderType === "DELIVERY" && quoteLoading ? (
                      <p className="flex items-center gap-2 text-sm text-ash">
                        <Loader2 size={15} className="animate-spin" /> Calculando entrega…
                      </p>
                    ) : blockedByArea ? (
                      <p className="text-sm font-medium text-danger">{quote?.reason}</p>
                    ) : (
                      <>
                        <Totals subtotal={subtotal} deliveryFee={deliveryFee} orderType={orderType} total={total} />
                        {orderType === "DELIVERY" && quote?.distanceKm != null && (
                          <p className="mt-2 text-xs text-ash-dark">≈ {quote.distanceKm} km da loja</p>
                        )}
                        {orderType === "DELIVERY" && quote?.estimated && !quote.free && (
                          <p className="mt-1 text-xs text-warning">Taxa estimada — confirmada no preparo.</p>
                        )}
                      </>
                    )}
                  </div>
                  {error && <p className="text-sm text-danger">{error}</p>}
                </div>
              )}

              {/* ── SUCESSO ── */}
              {step === "success" && (
                <div className="relative grid place-items-center overflow-hidden py-8 text-center">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-32" aria-hidden>
                    {[8, 24, 40, 58, 72, 90].map((left, i) => (
                      <span
                        key={left}
                        className="absolute top-16 h-1.5 w-1.5 rounded-full bg-ember-400"
                        style={{ left: `${left}%`, animation: `spark-rise ${2.4 + (i % 3) * 0.5}s ease-in ${i * 0.3}s infinite` }}
                      />
                    ))}
                  </div>
                  <motion.div
                    initial={{ scale: 0, rotate: -25 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="relative grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success ring-4 ring-success/10"
                  >
                    <PartyPopper size={32} />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mt-4 font-display text-2xl font-bold text-cream"
                  >
                    Pedido confirmado!
                  </motion.h3>
                  <p className="mt-1 text-ash">
                    Código <span className="font-semibold text-ember-400">{orderCode}</span>
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-ash">Já recebemos seu pedido e ele está sendo preparado. 🔥</p>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 flex w-full max-w-xs flex-col gap-2"
                  >
                    {orderCode && (
                      <Link href={`/cardapio/${slug}/pedido/${encodeURIComponent(orderCode)}`}>
                        <Button className="w-full">Acompanhar pedido</Button>
                      </Link>
                    )}
                    <Button variant="ghost" onClick={onClose}>Voltar ao cardápio</Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Rodapé */}
        {step !== "success" && (
          <div className="border-t border-coal-700 bg-coal-900 p-4">
            {(step === "phone" || step === "code" || step === "register") && (
              <div className="mb-3 flex items-center justify-between text-sm lg:hidden">
                <span className="text-ash">Subtotal do pedido</span>
                <PriceFlow cents={subtotal} className="text-base font-bold text-cream" />
              </div>
            )}
            {step === "cart" && (
              <>
                <div className="mb-3 space-y-1">
                  <div className="flex justify-between text-base font-bold text-cream">
                    <span>Subtotal</span>
                    <PriceFlow cents={subtotal} />
                  </div>
                  {orderType === "DELIVERY" && (
                    <p className="flex items-center gap-1.5 text-xs text-ash-dark">
                      <Bike size={13} /> Entrega calculada na finalização
                    </p>
                  )}
                </div>
                {belowMin && (
                  <p className="mb-2 text-center text-xs text-warning">Pedido mínimo de {formatPrice(minOrder)}</p>
                )}
                <Button
                  className="w-full"
                  disabled={!items.length || belowMin}
                  onClick={() => setStep(OTP_ENABLED ? "phone" : "address")}
                >
                  Continuar
                </Button>
              </>
            )}
            {step === "phone" && (
              <Button
                className="w-full"
                disabled={phone.replace(/\D/g, "").length < 10 || sendingOtp}
                onClick={requestOtp}
              >
                {sendingOtp ? <Loader2 className="animate-spin" size={18} /> : "Enviar código no WhatsApp"}
              </Button>
            )}
            {step === "code" && (
              <Button className="w-full" disabled={code.length < (demo ? 6 : 4) || verifying} onClick={verifyOtp}>
                {verifying ? <Loader2 className="animate-spin" size={18} /> : "Confirmar código"}
              </Button>
            )}
            {step === "register" && (
              <Button
                className="w-full"
                disabled={
                  !regName.trim() ||
                  cpf.replace(/\D/g, "").length !== 11 ||
                  birthDate.replace(/\D/g, "").length !== 8 ||
                  registering
                }
                onClick={registerCustomer}
              >
                {registering ? <Loader2 className="animate-spin" size={18} /> : "Continuar"}
              </Button>
            )}
            {step === "address" && (
              <>
                <div className="mb-3 lg:hidden">
                  <Totals subtotal={subtotal} deliveryFee={deliveryFee} orderType={orderType} total={total} />
                </div>
                <Button
                  className="w-full"
                  disabled={!addressValid || blockedByArea || quoteLoading}
                  onClick={() => setStep("payment")}
                >
                  {blockedByArea ? "Fora da área de entrega" : "Ir para pagamento"}
                </Button>
              </>
            )}
            {step === "payment" && (
              <>
                <div className="mb-3 lg:hidden">
                  <Totals subtotal={subtotal} deliveryFee={deliveryFee} orderType={orderType} total={total} />
                </div>
                <Button className="w-full" disabled={!payment} onClick={() => setStep("review")}>
                  Revisar pedido
                </Button>
              </>
            )}
            {step === "review" && (
              <Button
                className="w-full justify-between"
                shimmer
                disabled={submitting || quoteLoading || blockedByArea}
                onClick={submit}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <span>{blockedByArea ? "Fora da área de entrega" : "Fazer pedido"}</span>
                )}
                {!blockedByArea && <span>{formatPrice(total)}</span>}
              </Button>
            )}
          </div>
        )}
        </div>
        {/* Coluna direita — Resumo do Pedido (desktop) */}
        {step !== "cart" && step !== "success" && (
          <aside className="hidden w-[300px] shrink-0 border-l border-coal-800 bg-coal-950/50 lg:block">
            <ResumoPedido
              items={items}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              orderType={orderType}
              total={total}
              showFrete={step === "address" || step === "payment" || step === "review"}
            />
          </aside>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid var(--color-coal-700);
          background: var(--color-coal-850);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-cream);
        }
        .input::placeholder { color: var(--color-ash-dark); }
        .input:focus { outline: none; border-color: var(--color-ember-500); }
      `}</style>
    </div>
  );
}

function CartStep({
  items, orderType, onType, onQty, onRemove, onAddMore,
}: {
  items: CartLine[];
  orderType: OrderType;
  onType: (t: OrderType) => void;
  onQty: (id: string, d: number) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
}) {
  if (!items.length) {
    return (
      <div className="grid place-items-center py-10 text-center text-ash">
        <ShoppingBag size={40} className="opacity-40" />
        <p className="mt-3">Seu carrinho está vazio</p>
        <Button variant="secondary" className="mt-4" onClick={onAddMore}>Ver cardápio</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <TypeToggle orderType={orderType} onType={onType} />
      <div className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((it) => (
            <motion.div
              key={it.lineId}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, x: -24, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="overflow-hidden rounded-xl border border-coal-800 bg-coal-850 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-cream">{it.name}</p>
                  {it.complements.map((c) => (
                    <p key={c.itemId} className="text-xs text-ash">+ {c.quantity}× {c.name}</p>
                  ))}
                  {it.removedIngredients.map((r) => (
                    <p key={r} className="text-xs text-danger">− {r}</p>
                  ))}
                  {it.note && <p className="mt-0.5 text-xs italic text-ash-dark">“{it.note}”</p>}
                </div>
                <button onClick={() => onRemove(it.lineId)} className="text-ash-dark transition-colors hover:text-danger">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <PriceFlow cents={lineTotal(it)} className="font-semibold text-ember-400" />
                <div className="inline-flex items-center rounded-lg bg-coal-800 ring-1 ring-coal-700">
                  <button onClick={() => onQty(it.lineId, -1)} className="grid h-8 w-8 place-items-center text-ember-400 transition-transform active:scale-90">
                    <Minus size={15} strokeWidth={3} />
                  </button>
                  <NumberFlow value={it.quantity} className="w-6 text-center text-sm text-cream" />
                  <button onClick={() => onQty(it.lineId, 1)} className="grid h-8 w-8 place-items-center text-ember-400 transition-transform active:scale-90">
                    <Plus size={15} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <button onClick={onAddMore} className="w-full rounded-xl border border-dashed border-coal-700 py-2.5 text-sm font-medium text-ember-400 hover:bg-coal-850">
        + Adicionar mais itens
      </button>
    </div>
  );
}

function TypeToggle({ orderType, onType }: { orderType: OrderType; onType: (t: OrderType) => void }) {
  const opts: { type: OrderType; label: string; icon: React.ReactNode }[] = [
    { type: "DELIVERY", label: "Delivery", icon: <Bike size={16} /> },
    { type: "PICKUP", label: "Retirada", icon: <ShoppingBag size={16} /> },
  ];
  return (
    <div className="flex gap-2 rounded-xl bg-coal-850 p-1 ring-1 ring-coal-700">
      {opts.map((o) => (
        <button
          key={o.type}
          onClick={() => onType(o.type)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
            orderType === o.type ? "bg-ember-500 text-white" : "text-ash hover:text-cream",
          )}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ash">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-ash">{label}</span>
      <span className="text-right font-medium text-cream">{value}</span>
    </div>
  );
}

function Totals({ subtotal, deliveryFee, orderType, total }: { subtotal: number; deliveryFee: number; orderType: OrderType; total: number }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-ash">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      {orderType === "DELIVERY" && (
        <div className="flex justify-between text-ash">
          <span>Entrega</span>
          <span className={deliveryFee === 0 ? "font-semibold text-success" : ""}>
            {deliveryFee === 0 ? "GRÁTIS" : formatPrice(deliveryFee)}
          </span>
        </div>
      )}
      <div className="flex justify-between border-t border-coal-800 pt-1 text-base font-bold text-cream">
        <span>Total</span>
        <PriceFlow cents={total} />
      </div>
    </div>
  );
}

function Summary({ items }: { items: CartLine[] }) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.lineId} className="flex justify-between text-sm">
          <span className="text-cream">{it.quantity}× {it.name}</span>
          <span className="text-ash">{formatPrice(lineTotal(it))}</span>
        </div>
      ))}
    </div>
  );
}

/** Card "Resumo do Pedido" persistente (coluna lateral no desktop). */
function ResumoPedido({
  items, subtotal, deliveryFee, orderType, total, showFrete,
}: {
  items: CartLine[];
  subtotal: number;
  deliveryFee: number;
  orderType: OrderType;
  total: number;
  showFrete: boolean;
}) {
  return (
    <div className="flex h-full flex-col p-5">
      <h3 className="font-display text-lg font-bold text-cream">Resumo do Pedido</h3>
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-ash-dark">Seu carrinho está vazio.</p>
        ) : (
          items.map((it) => (
            <div key={it.lineId} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 text-ash">
                <span className="text-cream">{it.quantity}×</span> {it.name}
              </span>
              <span className="shrink-0 text-cream">{formatPrice(lineTotal(it))}</span>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 space-y-1.5 border-t border-coal-800 pt-3 text-sm">
        <div className="flex justify-between text-ash">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {orderType === "DELIVERY" && (
          <div className="flex justify-between text-ash">
            <span>Entrega</span>
            <span className={!showFrete ? "text-ash-dark" : deliveryFee === 0 ? "font-semibold text-success" : ""}>
              {!showFrete ? "a calcular" : deliveryFee === 0 ? "GRÁTIS" : formatPrice(deliveryFee)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-coal-800 pt-2 text-lg font-bold text-cream">
          <span>Total</span>
          <PriceFlow cents={showFrete ? total : subtotal} />
        </div>
      </div>
    </div>
  );
}
