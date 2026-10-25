"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Plus,
  Minus,
  Trash2,
  Send,
  Eye,
  MessageCircle,
  CreditCard,
  Copy,
  Check,
  Bot,
  Megaphone,
  SlidersHorizontal,
  Flame,
  Star,
  AlertCircle,
  FileText,
  ArrowUpRight,
  RefreshCw,
  HelpCircle,
  Tag,
  Zap,
  Mail,
  KeyRound,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import RevelioLogo from "./RevelioLogo";
import CyberVisualEngine from "./CyberVisualEngine";
import {
  DigitalProduct,
  OrderRecord,
  Currency,
  SocialPlatform,
  ProductTemplateStyle,
  useRevelioStore,
  calculateUnitEconomics,
  createUniqueId,
} from "./store-data";

interface VerifyApiResponse {
  found: boolean;
  error?: string;
  order?: {
    orderId: string;
    productTitle: string;
    status: string;
    channel: string;
    deliveryType: string;
    deliveredKey: string;
    createdAt: string;
  };
}

interface CheckoutApiResponse {
  success: boolean;
  orderId?: string;
  status?: OrderRecord["status"];
  deliveredCode?: string;
  telegramSent?: boolean;
  error?: string;
}

const TEMPLATE_GRADIENTS: Record<
  ProductTemplateStyle,
  { border: string; badgeBg: string; glow: string }
> = {
  cyber_cyan: {
    border: "border-cyan-500/30 hover:border-cyan-400/80",
    badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
    glow: "from-cyan-500/20 via-sky-500/5 to-transparent",
  },
  emerald_ai: {
    border: "border-emerald-500/30 hover:border-emerald-400/80",
    badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    glow: "from-emerald-500/20 via-teal-500/5 to-transparent",
  },
  crimson_stream: {
    border: "border-rose-500/30 hover:border-rose-400/80",
    badgeBg: "bg-rose-500/15 text-rose-300 border-rose-400/30",
    glow: "from-rose-500/20 via-red-500/5 to-transparent",
  },
  violet_gaming: {
    border: "border-violet-500/30 hover:border-violet-400/80",
    badgeBg: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    glow: "from-violet-500/20 via-purple-500/5 to-transparent",
  },
  gold_vip: {
    border: "border-amber-500/30 hover:border-amber-400/80",
    badgeBg: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    glow: "from-amber-500/20 via-yellow-500/5 to-transparent",
  },
};

export default function RevelioStorePage() {
  const {
    config,
    products,
    posts,
    orders,
    promoCodes,
    cart,
    currency,
    isHydrated,
    setCurrency,
    addToCart,
    updateCartQty,
    clearCart,
    addOrder,
    hydrateFromCloud,
  } = useRevelioStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeProductModal, setActiveProductModal] = useState<DigitalProduct | null>(null);

  const [customerName, setCustomerName] = useState<string>("");
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>("WhatsApp");
  const [customerContact, setCustomerContact] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("BaridiMob");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [receiptImageName, setReceiptImageName] = useState<string>("");
  const [promoInput, setPromoInput] = useState<string>("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [completedOrderModal, setCompletedOrderModal] = useState<OrderRecord | null>(null);

  const [lookupOrderId, setLookupOrderId] = useState<string>("");
  const [lookupContactLast4, setLookupContactLast4] = useState<string>("");
  const [isCheckingOrder, setIsCheckingOrder] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<OrderRecord | null | "not_found">(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      hydrateFromCloud();
    }
  }, [isHydrated, hydrateFromCloud]);

// اختصار كيبورد سري للـ CEO فقط (Ctrl + Shift + A) للدخول لصفحة الإدارة السرية + منع التكرار على السحابة
  useEffect(() => {
    const handleSecretShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        window.location.href = "/admin";
      }
    };
    window.addEventListener("keydown", handleSecretShortcut);

    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    let interval: ReturnType<typeof setInterval> | null = null;
    if (isLocal && config.enableLocalBotPolling) {
      interval = setInterval(() => {
        fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "poll-updates",
            botToken: config.telegramBotToken,
            adminChatId: config.telegramAdminChatId,
            bytezApiKey: config.bytezApiKey,
            bytezModel: config.bytezModel,
            openrouterApiKey: config.openrouterApiKey,
            openrouterModel: config.openrouterModel,
            aiProviderMode: config.aiProviderMode,
          }),
        }).catch(() => {});
      }, 4500);
    }

    return () => {
      window.removeEventListener("keydown", handleSecretShortcut);
      if (interval) clearInterval(interval);
    };
  }, [
    config.enableLocalBotPolling,
    config.telegramBotToken,
    config.telegramAdminChatId,
    config.bytezApiKey,
    config.bytezModel,
    config.openrouterApiKey,
    config.openrouterModel,
    config.aiProviderMode,
  ]);

  const activePaymentMethods = useMemo(() => {
    const list = (config.paymentMethods || []).filter((pm) => pm.enabled);
    return list.length > 0
      ? list
      : [
          {
            id: "pm-baridimob",
            name: "BaridiMob",
            labelAr: "BaridiMob (بريدي موب)",
            accountValue: config.baridiMobRip,
            accountHolder: "REVELIO DIGITAL",
            networkOrNote: "تحويل فوري عبر بريدي موب",
            enabled: true,
          },
        ];
  }, [config.paymentMethods, config.baridiMobRip]);

  const selectedPaymentDetails = useMemo(() => {
    return (
      activePaymentMethods.find((pm) => pm.name === paymentMethod) ||
      activePaymentMethods[0]
    );
  }, [activePaymentMethods, paymentMethod]);

  const cartRequiresEmailInvite = useMemo(() => {
    return cart.some((item) => item.product.activationMethod === "EMAIL_INVITE");
  }, [cart]);

  const formatPrice = (product: DigitalProduct, qty = 1): string => {
    if (currency === "USD") {
      return `$${(product.priceUsd * qty).toFixed(2)}`;
    }
    if (currency === "EUR") {
      return `€${(product.priceEur * qty).toFixed(2)}`;
    }
    return `${Math.round(product.priceDzd * qty).toLocaleString()} د.ج`;
  };

  const cartTotals = useMemo(() => {
    let rawTotal = 0;
    let totalUsd = 0;
    let totalDzd = 0;

    cart.forEach(({ product, quantity }) => {
      totalUsd += product.priceUsd * quantity;
      totalDzd += product.priceDzd * quantity;
      if (currency === "USD") rawTotal += product.priceUsd * quantity;
      else if (currency === "EUR") rawTotal += product.priceEur * quantity;
      else rawTotal += product.priceDzd * quantity;
    });

    const discountRatio = appliedDiscountPercent > 0 ? appliedDiscountPercent / 100 : 0;
    const discountAmount = rawTotal * discountRatio;
    const finalTotal = Math.max(0, rawTotal - discountAmount);
    const finalUsd = Number((totalUsd * (1 - discountRatio)).toFixed(2));
    const finalDzd = Math.round(totalDzd * (1 - discountRatio));

    const formatted =
      currency === "USD"
        ? `$${finalTotal.toFixed(2)}`
        : currency === "EUR"
        ? `€${finalTotal.toFixed(2)}`
        : `${Math.round(finalTotal).toLocaleString()} د.ج`;

    const formattedDiscount =
      currency === "USD"
        ? `$${discountAmount.toFixed(2)}`
        : currency === "EUR"
        ? `€${discountAmount.toFixed(2)}`
        : `${Math.round(discountAmount).toLocaleString()} د.ج`;

    return {
      rawTotal,
      discountAmount,
      finalTotal,
      finalUsd,
      finalDzd,
      formatted,
      formattedDiscount,
    };
  }, [cart, currency, appliedDiscountPercent]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
      const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
      const titleText = (p.title || p.name || "").toLowerCase();
      const descText = (p.shortDesc || p.description || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      return matchesCat && (!q || titleText.includes(q) || descText.includes(q));
    });

    if (sortBy === "price_asc") {
      return [...list].sort((a, b) => a.priceDzd - b.priceDzd);
    }
    if (sortBy === "price_desc") {
      return [...list].sort((a, b) => b.priceDzd - a.priceDzd);
    }
    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // تتبع حركة الماوس لتوليد منظور 3D Tilt وإضاءة Spotlight
  const handleCard3DMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);

    if (config.visualFx?.tilt3DCards !== false) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = ((x - centerX) / centerX) * 6.5;
      const rotateX = -((y - centerY) / centerY) * 6.5;
      e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(
        2
      )}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-5px)`;
    }
  };

  const handleCard3DMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "";
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleApplyPromo = () => {
    const cleanInput = promoInput.trim().toUpperCase();
    if (!cleanInput) return;

    const matchedInList = promoCodes.find(
      (p) => p.active && p.code.toUpperCase() === cleanInput
    );

    if (matchedInList) {
      setAppliedDiscountPercent(matchedInList.discountPercent);
      setAppliedPromoCode(matchedInList.code);
      return;
    }

    if (cleanInput === config.promoCode.toUpperCase()) {
      setAppliedDiscountPercent(config.promoDiscountPercent);
      setAppliedPromoCode(config.promoCode);
      return;
    }

    alert("كود الخصم المدخل غير صحيح أو غير مفعل حالياً!");
  };

  const handleAddAndOpen = (product: DigitalProduct) => {
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImageName(file.name);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerContact.trim()) {
      alert("يرجى كتابة رقم الواتساب أو معرف حسابك لنرسل لك التفعيل عليه!");
      return;
    }

    if (cartRequiresEmailInvite && !customerEmail.trim()) {
      alert(
        "أحد المنتجات في سلتك يتم تفعيله عبر دعوة رسمية؛ يرجى كتابة إيميلك الشخصي (Gmail/Email) لإرسال الدعوة إليه!"
      );
      return;
    }

    setIsSubmittingOrder(true);
    const newOrderId = createUniqueId("ORD");
    const productNames = cart
      .map((i) => `${i.product.title || i.product.name} (x${i.quantity})`)
      .join(" + ");
    const primaryProduct = cart[0]?.product;
    const primaryProductId = primaryProduct?.id || "";
    const primaryActivation = primaryProduct?.activationMethod || "KEY";

    const effectiveDeliveryMode: "manual" | "auto" =
      config.globalDeliveryMode === "manual"
        ? "manual"
        : cart.every((i) => i.product.deliveryType === "auto")
        ? "auto"
        : "manual";

    const combinedNotes = [
      customerEmail.trim() ? `إيميل التفعيل: ${customerEmail.trim()}` : "",
      paymentReference ? `مرجع التحويل: ${paymentReference}` : "",
      receiptImageName ? `مرفق وصل: ${receiptImageName}` : "",
      appliedPromoCode ? `برومو: ${appliedPromoCode} (-${appliedDiscountPercent}%)` : "",
      orderNotes.trim(),
    ]
      .filter(Boolean)
      .join(" | ");

    let serverDeliveredCode: string | undefined = undefined;
    let serverStatus: OrderRecord["status"] =
      effectiveDeliveryMode === "auto" ? "COMPLETED" : "PENDING";

    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newOrderId,
          productId: primaryProductId,
          productName: productNames,
          price: cartTotals.formatted,
          amountUsd: cartTotals.finalUsd,
          amountDzd: cartTotals.finalDzd,
          customerName: customerName.trim() || "عميل Revelio",
          customerContact: customerContact.trim(),
          customerEmail: customerEmail.trim() || undefined,
          activationMethod: primaryActivation,
          socialPlatform,
          paymentMethod,
          deliveryType: effectiveDeliveryMode,
          notes: combinedNotes,
          botToken: config.telegramBotToken,
          adminChatId: config.telegramAdminChatId,
          openrouterApiKey: config.openrouterApiKey,
          openrouterModel: config.openrouterModel,
          aiProviderMode: config.aiProviderMode,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as CheckoutApiResponse;
        if (data.deliveredCode) serverDeliveredCode = data.deliveredCode;
        if (data.status) serverStatus = data.status;
      }
    } catch {}

    const newOrder: OrderRecord = {
      id: newOrderId,
      orderId: newOrderId,
      productId: primaryProductId,
      productName: productNames,
      productTitle: productNames,
      totalPrice: cartTotals.formatted,
      amountUsd: cartTotals.finalUsd,
      amountDzd: cartTotals.finalDzd,
      customerName: customerName.trim() || "عميل Revelio",
      customerContact: customerContact.trim(),
      customerEmail: customerEmail.trim() || undefined,
      channel: socialPlatform,
      socialPlatform,
      paymentMethod,
      status: serverStatus,
      deliveryType: effectiveDeliveryMode,
      activationMethod: primaryActivation,
      deliveredCode: serverDeliveredCode,
      notes: combinedNotes,
      createdAt: new Date().toISOString().split("T")[0],
    };

    await addOrder(newOrder);
    setIsSubmittingOrder(false);
    clearCart();
    setIsCartOpen(false);
    setOrderNotes("");
    setPaymentReference("");
    setReceiptImageName("");
    setCompletedOrderModal(newOrder);
  };

  const handleOrderLookup = async (overrideId?: string) => {
    const target = (overrideId ?? lookupOrderId).trim().toUpperCase();
    if (!target) return;

    setIsCheckingOrder(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-order",
          orderId: target,
          contactLast4: lookupContactLast4.trim(),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as VerifyApiResponse;
        if (data.found && data.order) {
          setLookupResult({
            id: data.order.orderId,
            orderId: data.order.orderId,
            productName: data.order.productTitle,
            productTitle: data.order.productTitle,
            totalPrice: "",
            amountUsd: 0,
            amountDzd: 0,
            customerName: "",
            customerContact: lookupContactLast4 || "موثق ✓",
            channel: (data.order.channel as SocialPlatform) || "WhatsApp",
            socialPlatform: (data.order.channel as SocialPlatform) || "WhatsApp",
            paymentMethod: "",
            status: data.order.status.toUpperCase() as OrderRecord["status"],
            deliveryType: data.order.deliveryType === "auto" ? "auto" : "manual",
            deliveredCode: data.order.deliveredKey,
            createdAt: data.order.createdAt
              ? String(data.order.createdAt).split("T")[0]
              : "",
          });
          setIsCheckingOrder(false);
          return;
        }
      }
    } catch {}

    const localFound = orders.find(
      (o) => o.id.toUpperCase() === target || o.orderId.toUpperCase() === target
    );
    setLookupResult(localFound || "not_found");
    setIsCheckingOrder(false);
  };

  const latestCompletedOrder = useMemo(() => {
    return (
      orders.find((o) => o.status.toUpperCase() === "COMPLETED") || orders[0]
    );
  }, [orders]);

  const getCustomerDirectSupportUrl = (ord: OrderRecord) => {
    const msg = `مرحباً إدارة ${config.storeName} ⚡، قمتُ الآن بإرسال طلب جديد:\n• رقم الطلب: ${ord.orderId}\n• المنتج: ${ord.productName}\n• المبلغ: ${ord.totalPrice} (${ord.paymentMethod})\n${
      ord.customerEmail ? `• إيميل الدعوة: ${ord.customerEmail}\n` : ""
    }يرجى مراجعة الدفع وإرسال التفعيل، شكراً لكم!`;

    const supportPhone = (config.whatsappSupport || "213550000000").replace(/\D/g, "");
    if (ord.socialPlatform === "WhatsApp") {
      return `https://wa.me/${supportPhone}?text=${encodeURIComponent(msg)}`;
    }
    if (ord.socialPlatform === "Instagram") {
      return `https://instagram.com/${config.instagramPage.replace("@", "").trim()}`;
    }
    return `https://t.me/${config.telegramBotUsername.replace("@", "").trim()}`;
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen text-slate-100 relative selection:bg-cyan-500 selection:text-black"
    >
      {/* محرك الـ 3D والخلفية الحية والأشعة المستوحى من الفيديو */}
      <CyberVisualEngine />

      {/* 1. شريط الإعلانات العلوي */}
      <div className="bg-gradient-to-r from-cyan-950/95 via-sky-900/85 to-cyan-950/95 border-b border-cyan-400/30 px-3 py-2 text-center text-xs sm:text-sm font-medium text-cyan-100 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
          <Zap className="w-3.5 h-3.5 text-cyan-300 shrink-0 animate-pulse" />
          <span>{config.AnnouncementText}</span>
          <button
            type="button"
            onClick={() => handleCopy(config.promoCode)}
            className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/50 text-cyan-200 text-[11px] font-mono hover:bg-cyan-400 hover:text-slate-950 transition cursor-pointer"
          >
            {copiedText === config.promoCode ? "تم النسخ ✓" : config.promoCode}
          </button>
        </div>
      </div>

      {/* 2. الهيدر السيبراني مع روابط التنقل ذات النقطة المضيئة (بأسلوب الفيديو SKRIKSI) */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div dir="ltr" className="shrink-0">
              <RevelioLogo
                className="w-10 h-10 sm:w-13 sm:h-13"
                showWordmark={false}
              />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold tracking-wider text-sm sm:text-xl text-white flex items-center gap-2 truncate">
                <span>{config.storeName}</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  3D ENGINE v5.0
                </span>
              </div>
              <p className="text-[9px] sm:text-xs font-mono text-cyan-400/90 tracking-widest uppercase truncate">
                A MULTIMEDIA DIGITAL UNIVERSE
              </p>
            </div>
          </div>

          {/* شريط التنقل المستوحى من الفيديو مع النقطة الساطعة تحت القسم النشط */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-mono tracking-widest uppercase">
            {[
              { label: "UNIVERSE // الرئيسية", href: "#" },
              { label: "CATALOG // الاشتراكات", href: "#catalog" },
              { label: "WARRANTY // الضمان", href: "#warranty-radar" },
              {
                label: "AI AGENT // البوت",
                href: `https://t.me/${config.telegramBotUsername.replace("@", "").trim()}`,
                external: true,
              },
            ].map((nav, i) => (
              <a
                key={i}
                href={nav.href}
                target={nav.external ? "_blank" : undefined}
                rel={nav.external ? "noreferrer" : undefined}
                className="cyber-nav-link group relative py-1 text-slate-300 hover:text-cyan-300 transition font-bold"
              >
                <span>{nav.label}</span>
                <span className="cyber-nav-dot" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 ms-auto lg:ms-0">
            <div className="flex items-center bg-slate-900/90 border border-cyan-500/30 rounded-full p-0.5 text-[10px] sm:text-[11px] font-mono">
              {(["DZD", "USD", "EUR"] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  className={`px-2 sm:px-2.5 py-1 rounded-full transition cursor-pointer ${
                    currency === cur
                      ? "bg-cyan-400 text-slate-950 font-bold shadow-sm shadow-cyan-400/50"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>

            <a
              href={`https://t.me/${config.telegramBotUsername.replace("@", "").trim()}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>بوت المساعد الذكي</span>
            </a>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 hover:brightness-110 transition cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة</span>
              {cart.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-cyan-300 text-[10px] font-mono">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>

          
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-10 relative z-10">
        {/* 3. شريط البث الحي للعمليات الموثقة */}
        <div
          onMouseMove={handleCard3DMouseMove}
          onMouseLeave={handleCard3DMouseLeave}
          className="cyber-card px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-mono text-cyan-300 font-bold text-xs">
              LIVE FEED:
            </span>
            <span className="text-slate-200">
              آخر عملية تسليم موثقة:{" "}
              <strong className="text-white">
                {latestCompletedOrder?.productName || "Google Gemini Advanced + 2TB"}
              </strong>{" "}
              للعميل{" "}
              <span className="text-cyan-300">
                {latestCompletedOrder?.customerName || "ياسين بن علي"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-cyan-300/90">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              الدفع المتاح:{" "}
              {activePaymentMethods.map((p) => p.name).join(" • ")}
            </span>
          </div>
        </div>

        {/* 4. قسم الـ Hero الرئيسي + الشعار الهولوغرافي ثلاثي الأبعاد */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div
            onMouseMove={handleCard3DMouseMove}
            onMouseLeave={handleCard3DMouseLeave}
            className="cyber-card lg:col-span-7 p-5 sm:p-10 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>REVELIO 3D DIGITAL UNIVERSE • الجيل الخامس</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight text-white">
                القوة والسرعة في{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500">
                  الاشتراكات والأكواد الرقمية
                </span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
                بوابتك الأولى في الجزائر والعالم العربي لاشتراكات الذكاء الاصطناعي
                (Gemini Advanced & ChatGPT Plus)، البث الترفيهي (Netflix 4K &
                Spotify)، وشحن الألعاب بضمان ذهبي واستلام فوري (كود رقمي، دعوة رسمية
                على إيميلك، أو حساب جاهز).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/75 border border-cyan-500/20 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">ضمان ذهبي شامل</div>
                  <div className="text-[11px] text-slate-400">تعويض واستبدال فوري</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/75 border border-cyan-500/20 flex items-center gap-3">
                <Mail className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">تفعيل متنوع</div>
                  <div className="text-[11px] text-slate-400">كود • دعوة إيميل • حساب</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/75 border border-cyan-500/20 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">دفع مرن وسريع</div>
                  <div className="text-[11px] text-slate-400">BaridiMob • CCP • USDT</div>
                </div>
              </div>
            </div>
          </div>

          <div
            dir="ltr"
            onMouseMove={handleCard3DMouseMove}
            onMouseLeave={handleCard3DMouseLeave}
            className="cyber-card lg:col-span-5 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
          >
            <div className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase mb-2">
              HOLOGRAPHIC 3D EMBLEM // INTERACTIVE CORE
            </div>
            <RevelioLogo
              className="w-56 h-56 sm:w-72 sm:h-72 mx-auto"
              showWordmark={true}
              showReplayButton={true}
            />
          </div>
        </section>

        {/* 5. قسم المنشورات والعروض النشطة */}
        {posts.filter((p) => p.active).length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm sm:text-base">
              <Megaphone className="w-5 h-5 text-cyan-400" />
              <span>أحدث المنشورات والعروض الرسمية</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts
                .filter((p) => p.active)
                .map((post) => (
                  <div
                    key={post.id}
                    onMouseMove={handleCard3DMouseMove}
                    onMouseLeave={handleCard3DMouseLeave}
                    className="cyber-card p-5 space-y-2 border-r-4 border-r-cyan-400"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px] font-mono border border-cyan-500/30">
                        {post.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {post.date}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg">
                      {post.title}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* 6. كتالوج المنتجات الزجاجي ثلاثي الأبعاد */}
        <section id="catalog" className="space-y-6">
          <div className="cyber-card p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: "ALL", label: "جميع المنتجات" },
                { id: "AI", label: "الذكاء الاصطناعي 🤖" },
                { id: "Streaming", label: "البث والترفيه 🎬" },
                { id: "Gaming", label: "الألعاب 🎮" },
                { id: "Software", label: "البرامج والتصميم 🎨" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-cyan-500/20"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "featured" | "price_asc" | "price_desc")
                }
                className="px-3 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs text-cyan-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="featured">الترتيب: الأكثر شهرة ⭐</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن اشتراك أو كود..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const stockVal = product.stockCount ?? product.stock;
              const econ = calculateUnitEconomics(product, config.dzdRate);
              const tpl =
                TEMPLATE_GRADIENTS[product.templateStyle || "cyber_cyan"] ||
                TEMPLATE_GRADIENTS.cyber_cyan;

              return (
                <div
                  key={product.id}
                  onMouseMove={handleCard3DMouseMove}
                  onMouseLeave={handleCard3DMouseLeave}
                  className={`cyber-card p-5 flex flex-col justify-between gap-4 group ${tpl.border}`}
                >
                  <div className="space-y-3.5 relative z-10">
                    {product.imageUrl ? (
                      <div className="relative h-40 w-full rounded-xl overflow-hidden border border-cyan-500/25 bg-slate-950">
                        <img
                          src={product.imageUrl}
                          alt={product.title || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div
                        className={`h-2.5 w-full rounded-full bg-gradient-to-r ${tpl.glow}`}
                      />
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1 ${tpl.badgeBg}`}
                      >
                        <Star className="w-3 h-3" />
                        {product.badge || product.category}
                      </span>
                      <span
                        className={`text-[11px] font-mono flex items-center gap-1 ${
                          stockVal <= 5 ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        {stockVal <= 0
                          ? "نفد المخزون"
                          : stockVal <= 5
                          ? `ينفد خلال ~${econ.hoursUntilStockout} ساعة (${stockVal})`
                          : `متوفر (${stockVal})`}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white group-hover:text-cyan-300 transition">
                      {product.title || product.name}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {product.shortDesc || product.description}
                    </p>

                    <div className="pt-1 space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>المدة: {product.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{product.warranty}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1.5 rounded-lg border border-cyan-500/20">
                        {product.activationMethod === "EMAIL_INVITE" ? (
                          <>
                            <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>التسليم: دعوة رسمية مباشرة على إيميلك الشخصي</span>
                          </>
                        ) : product.activationMethod === "ACCOUNT" ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>التسليم: حساب جاهز كامل بضمان ذهبي</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>التسليم: كود تفعيل رقمي رسمي</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-cyan-500/20 space-y-3 relative z-10">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">السعر الرسمي</span>
                        <span className="text-xl sm:text-2xl font-black text-cyan-300">
                          {formatPrice(product)}
                        </span>
                      </div>
                      {currency === "DZD" && product.oldPriceDzd && (
                        <span className="text-xs text-slate-500 line-through font-mono">
                          {product.oldPriceDzd.toLocaleString()} د.ج
                        </span>
                      )}
                    </div>

                    {stockVal > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveProductModal(product)}
                          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>التفاصيل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddAndOpen(product)}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 hover:brightness-110 transition cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>اشترِ الآن</span>
                        </button>
                      </div>
                    ) : (
                      <a
                        href={`https://t.me/${config.telegramBotUsername.replace("@", "").trim()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-500/30 transition"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>أعلمني عند التوفر عبر تيليجرام</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. قسم فاحص الضمان وتتبع حالة الطلب المؤمّن */}
        <section
          id="warranty-radar"
          onMouseMove={handleCard3DMouseMove}
          onMouseLeave={handleCard3DMouseLeave}
          className="cyber-card p-5 sm:p-8 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                WARRANTY & ORDER STATUS RADAR
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                فاحص الضمان وتتبع حالة الطلبات
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  أدخل رقم طلبك بصيغة{" "}
                  <code className="text-cyan-300 font-mono">ORD-XXXXXX</code> مع آخر 4
                  أرقام من هاتفك للتحقق من حالة التفعيل والضمان الذهبي.
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setLookupOrderId("ORD-884920");
                handleOrderLookup("ORD-884920");
              }}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition cursor-pointer"
            >
              تجربة مثال: ORD-884920
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <input
              type="text"
              value={lookupOrderId}
              onChange={(e) => setLookupOrderId(e.target.value)}
              placeholder="رقم الطلب (مثال: ORD-884920)"
              className="sm:col-span-6 px-4 py-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
            <input
              type="text"
              value={lookupContactLast4}
              onChange={(e) => setLookupContactLast4(e.target.value)}
              placeholder="آخر 4 أرقام من هاتفك أو حسابك (اختياري)"
              className="sm:col-span-4 px-4 py-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              disabled={isCheckingOrder}
              onClick={() => handleOrderLookup()}
              className="sm:col-span-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-sm hover:brightness-110 transition cursor-pointer"
            >
              {isCheckingOrder ? "جاري الفحص..." : "فحص الآن"}
            </button>
          </div>

          {lookupResult === "not_found" && (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm">
              لم يتم العثور على طلب بهذا الرقم. تأكد من كتابة الرقم بشكل صحيح (مثال:
              ORD-884920).
            </div>
          )}

          {lookupResult && lookupResult !== "not_found" && (
            <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-400/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  رقم الطلب: {lookupResult.orderId || lookupResult.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    lookupResult.status.toUpperCase() === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {lookupResult.status.toUpperCase() === "COMPLETED"
                    ? "✅ مكتمل — الضمان الذهبي مفعل"
                    : "⏳ قيد مراجعة وصول المبلغ من الإدارة"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block">المنتج:</span>
                  <strong className="text-white">
                    {lookupResult.productName || lookupResult.productTitle}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">منصة الاستلام:</span>
                  <strong className="text-cyan-300">
                    {lookupResult.socialPlatform || lookupResult.channel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">حالة التفعيل:</span>
                  <strong className="text-emerald-300">
                    {lookupResult.status.toUpperCase() === "COMPLETED"
                      ? lookupResult.deliveredCode ||
                        "تم إرسال التفعيل لحسابك الشخصي بنجاح ✓"
                      : "سيتم إرسال التفعيل إلى حسابك فور التأكد من وصول الدفع"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 8. الفوتر الرسمي مع أيقونات منصات التواصل الجذابة */}
      <footer className="border-t border-cyan-500/20 bg-slate-950/95 py-12 px-4 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-5">
          <div dir="ltr">
            <RevelioLogo className="w-16 h-16" showWordmark={false} />
          </div>
          <div className="font-black text-xl text-white tracking-wider">
            {config.storeName}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
            المنصة الرقمية الأولى للاشتراكات الأصلية والأكواد الرقمية بضمان ذهبي.
            تواصل معنا عبر منصاتنا الرسمية أو تحدث مباشرة مع المساعد الذكي على تيليجرام.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`https://t.me/${config.telegramBotUsername.replace("@", "").trim()}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 text-sky-300 hover:bg-sky-500 hover:text-slate-950 font-bold text-xs transition shadow-lg shadow-sky-500/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              <span>Telegram Bot</span>
            </a>

            <a
              href={`https://instagram.com/${config.instagramPage.replace("@", "").trim()}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-500/10 border border-pink-400/30 text-pink-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-amber-500 hover:text-white font-bold text-xs transition shadow-lg shadow-pink-500/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </a>

            <a
              href={`https://facebook.com/${(config.facebookPage || "revelio.digital.dz").replace("@", "").trim()}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-400/30 text-blue-300 hover:bg-blue-600 hover:text-white font-bold text-xs transition shadow-lg shadow-blue-500/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>

            <a
              href={`https://tiktok.com/@${(config.tiktokPage || "revelio.digital").replace("@", "").trim()}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
              <span>TikTok</span>
            </a>

            <a
              href={`https://wa.me/${(config.whatsappSupport || "213550000000").replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/10"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-4">
            © {new Date().getFullYear()} {config.storeName}. جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>

      {/* 9. نافذة تفاصيل المنتج الكاملة */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="cyber-card max-w-lg w-full p-6 space-y-5 relative my-8">
            <button
              type="button"
              onClick={() => setActiveProductModal(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-slate-900 border border-cyan-500/30 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {activeProductModal.imageUrl && (
              <img
                src={activeProductModal.imageUrl}
                alt={activeProductModal.title}
                className="w-full h-44 object-cover rounded-xl border border-cyan-500/30"
              />
            )}

            <div className="space-y-2 pr-1">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold">
                {activeProductModal.badge || activeProductModal.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white pt-1">
                {activeProductModal.title || activeProductModal.name}
              </h3>
              <div className="text-2xl font-black text-cyan-300">
                {formatPrice(activeProductModal)}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/70 p-4 rounded-xl border border-cyan-500/20">
              {activeProductModal.details || activeProductModal.description}
            </p>

            <div className="space-y-2">
              <div className="text-xs font-bold text-cyan-300">مميزات الاشتراك:</div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                {activeProductModal.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs leading-relaxed">
              🔒 <strong>طريقة التسليم:</strong>{" "}
              {activeProductModal.activationMethod === "EMAIL_INVITE"
                ? "يتم التفعيل بإرسال دعوة رسمية مباشرة إلى بريدك الإلكتروني الشخصي فور مراجعة الدفع."
                : activeProductModal.activationMethod === "ACCOUNT"
                ? "يتم تسليمك بيانات حساب جاهز وخاص بك مع ضمان ذهبي كامل."
                : "يتم إرسال كود التفعيل الرقمي مباشرة إلى حسابك في واتساب أو إنستغرام أو تيليجرام."}
            </div>

            <button
              type="button"
              onClick={() => {
                handleAddAndOpen(activeProductModal);
                setActiveProductModal(null);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-sm hover:brightness-110 transition cursor-pointer"
            >
              إضافة إلى السلة وإتمام الطلب
            </button>
          </div>
        </div>
      )}

      {/* 10. درج سلة المشتريات */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-md bg-slate-950 border-r border-cyan-500/30 h-full flex flex-col justify-between p-5 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                <div className="flex items-center gap-2 font-black text-lg text-white">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  <span>سلة المشتريات وإتمام الطلب</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-full bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-sm">سلة مشترياتك فارغة حالياً.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-white text-xs sm:text-sm">
                            {product.title || product.name}
                          </div>
                          <div className="text-cyan-300 font-mono text-xs font-bold">
                            {formatPrice(product, quantity)}
                          </div>
                          <span className="inline-block text-[10px] text-slate-400">
                            {product.activationMethod === "EMAIL_INVITE"
                              ? "📧 تفعيل بدعوة إيميل"
                              : product.activationMethod === "ACCOUNT"
                              ? "👤 حساب جاهز"
                              : "🔑 كود رقمي"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, -1)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-mono text-xs font-bold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, 1)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCartQty(product.id, -99)}
                            className="p-1.5 rounded-lg bg-rose-950/60 text-rose-300 hover:bg-rose-900 mr-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 items-center">
                    <Tag className="w-4 h-4 text-cyan-400 shrink-0" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder={`كود البرومو (مثال: ${config.promoCode})`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 cursor-pointer"
                    >
                      تطبيق
                    </button>
                  </div>

                  {appliedDiscountPercent > 0 && (
                    <div className="text-xs text-emerald-400 font-bold">
                      ✓ تم تطبيق كود ({appliedPromoCode}) بخصم {appliedDiscountPercent}% (-
                      {cartTotals.formattedDiscount})
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2 border-t border-cyan-500/20">
                    <label className="text-xs text-cyan-300 font-bold block">
                      💳 اختر وسيلة الدفع المناسبة لك:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {activePaymentMethods.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.name)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border text-center transition cursor-pointer ${
                            paymentMethod === pm.name
                              ? "bg-cyan-400 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-400/30"
                              : "bg-slate-900 text-slate-300 border-cyan-500/20 hover:bg-slate-800"
                          }`}
                        >
                          {pm.name}
                        </button>
                      ))}
                    </div>

                    {selectedPaymentDetails && (
                      <div className="p-3.5 rounded-xl bg-slate-900/95 border border-cyan-400/35 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-cyan-300 font-bold">
                          <span>{selectedPaymentDetails.labelAr}</span>
                          <span className="text-[11px] text-slate-400">
                            {selectedPaymentDetails.accountHolder}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-lg border border-cyan-500/20">
                          <span className="text-white font-mono text-xs break-all">
                            {selectedPaymentDetails.accountValue}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(selectedPaymentDetails.accountValue)
                            }
                            className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                          >
                            {copiedText === selectedPaymentDetails.accountValue ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>نسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-amber-300/90">
                          ℹ️ {selectedPaymentDetails.networkOrNote}
                        </div>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handleCheckout}
                    className="space-y-3 pt-2 border-t border-cyan-500/20"
                  >
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        الاسم الكامل:
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="مثال: محمد أمين"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                      />
                    </div>

                    {cartRequiresEmailInvite && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/40 space-y-1.5">
                        <label className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          <span>
                            بريدك الإلكتروني الشخصي (لإرسال دعوة التفعيل إليه):
                          </span>
                        </label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="example@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-400/50 text-xs text-white font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-cyan-300 font-bold block mb-1.5">
                        أين تريد أن نرسل لك تأكيد التفعيل / الكود؟
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["WhatsApp", "Instagram", "Telegram"] as SocialPlatform[]).map(
                          (plat) => (
                            <button
                              key={plat}
                              type="button"
                              onClick={() => setSocialPlatform(plat)}
                              className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                socialPlatform === plat
                                  ? "bg-cyan-400 text-slate-950 border-cyan-400"
                                  : "bg-slate-900 text-slate-300 border-cyan-500/20"
                              }`}
                            >
                              {plat === "WhatsApp"
                                ? "واتساب 📱"
                                : plat === "Instagram"
                                ? "إنستغرام 📸"
                                : "تيليجرام ✈️"}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        {socialPlatform === "WhatsApp"
                          ? "رقم الواتساب الخاص بك (مثال: 0550123456):"
                          : `معرف حسابك في ${socialPlatform} (مثال: @username):`}
                      </label>
                      <input
                        type="text"
                        required
                        value={customerContact}
                        onChange={(e) => setCustomerContact(e.target.value)}
                        placeholder={
                          socialPlatform === "WhatsApp" ? "0550XXXXXX" : "@your_username"
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        رقم عملية التحويل / مرجع الدفع (اختياري):
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="مثال: رقم المعاملة في بريدي موب أو TxID"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 flex items-center gap-1.5 mb-1">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>إرفاق صورة وصل الدفع (اختياري):</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptFileChange}
                        className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30"
                      />
                      {receiptImageName && (
                        <span className="text-[11px] text-emerald-400 block mt-1">
                          ✓ تم إرفاق: {receiptImageName}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        ملاحظة إضافية للإدارة (اختياري):
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="أي تفاصيل إضافية..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                      <span className="text-xs text-slate-300">المبلغ الإجمالي:</span>
                      <span className="text-lg font-black text-cyan-300">
                        {cartTotals.formatted}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSubmittingOrder
                          ? "جاري تسجيل الطلب وإبلاغ الإدارة..."
                          : "تأكيد الطلب واستلام التفعيل"}
                      </span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. نافذة تأكيد الطلب */}
      {completedOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cyber-card max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-300">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">تم تسجيل طلبك بنجاح!</h3>

            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 font-mono text-sm text-cyan-300">
              رقم الطلب: <strong>{completedOrderModal.orderId}</strong>
            </div>

            {completedOrderModal.deliveryType === "manual" ||
            !completedOrderModal.deliveredCode ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs sm:text-sm leading-relaxed space-y-2">
                <p className="font-bold">🛡️ طلبك الآن قيد مراجعة الدفع والتفعيل:</p>
                <p>
                  وصل إشعار فوري للإدارة. بمجرد التأكد من وصول المبلغ (
                  {completedOrderModal.totalPrice}) عبر {completedOrderModal.paymentMethod}
                  ، سنرسل لك التفعيل مباشرة إلى{" "}
                  <strong>{completedOrderModal.socialPlatform}</strong> (
                  {completedOrderModal.customerContact})
                  {completedOrderModal.customerEmail
                    ? ` وإلى إيميلك (${completedOrderModal.customerEmail})`
                    : ""}
                  .
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm space-y-1">
                <div className="font-bold">⚡ الكود الفوري الخاص بك:</div>
                <div className="font-mono text-base text-white">
                  {completedOrderModal.deliveredCode}
                </div>
              </div>
            )}

            <a
              href={getCustomerDirectSupportUrl(completedOrderModal)}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:brightness-110 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>إرسال رسالة الطلب مباشرة عبر {completedOrderModal.socialPlatform}</span>
            </a>

            <button
              type="button"
              onClick={() => setCompletedOrderModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-slate-300 font-bold text-xs cursor-pointer"
            >
              إغلاق والعودة للمتجر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}