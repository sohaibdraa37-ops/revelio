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
  Lock,
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
} from "lucide-react";
import RevelioLogo from "./RevelioLogo";
import {
  DigitalProduct,
  OrderRecord,
  Currency,
  SocialPlatform,
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

export default function StorefrontView() {
  const {
    config,
    products,
    posts,
    orders,
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

  // حالات الفلترة والبحث والترتيب
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc">("featured");

  // النوافذ المنبثقة وسلة المشتريات
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [activeProductModal, setActiveProductModal] = useState<DigitalProduct | null>(null);

  // بيانات إتمام الطلب وخيار التسليم اليدوي/الفوري
  const [customerName, setCustomerName] = useState<string>("");
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>("WhatsApp");
  const [customerContact, setCustomerContact] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("BaridiMob");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [receiptImageName, setReceiptImageName] = useState<string>("");
  const [promoInput, setPromoInput] = useState<string>("");
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [completedOrderModal, setCompletedOrderModal] = useState<OrderRecord | null>(null);

  // حالات فاحص الضمان واسترجاع الأكواد الفوري
  const [lookupOrderId, setLookupOrderId] = useState<string>("");
  const [lookupContactLast4, setLookupContactLast4] = useState<string>("");
  const [isCheckingOrder, setIsCheckingOrder] = useState<boolean>(false);
  const [lookupResult, setLookupResult] = useState<OrderRecord | null | "not_found">(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // تحميل ومزامنة البيانات عند فتح المتجر
  useEffect(() => {
    if (!isHydrated) {
      hydrateFromCloud();
    }
  }, [isHydrated, hydrateFromCloud]);

  // دالة تنسيق الأسعار حسب العملة المختارة (DZD / USD / EUR)
  const formatPrice = (product: DigitalProduct, qty = 1): string => {
    if (currency === "USD") {
      return `$${(product.priceUsd * qty).toFixed(2)}`;
    }
    if (currency === "EUR") {
      return `€${(product.priceEur * qty).toFixed(2)}`;
    }
    return `${Math.round(product.priceDzd * qty).toLocaleString()} د.ج`;
  };

  // حساب إجماليات السلة مع الخصم بالعملات الثلاث
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

    const discountRatio = promoApplied ? config.promoDiscountPercent / 100 : 0;
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
  }, [cart, currency, promoApplied, config.promoDiscountPercent]);

  // فلترة وترتيب المنتجات
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    if (promoInput.trim().toUpperCase() === config.promoCode.toUpperCase()) {
      setPromoApplied(true);
    } else {
      alert("كود الخصم المدخل غير صحيح أو منتهي الصلاحية!");
    }
  };

  const handleAddAndOpen = (product: DigitalProduct) => {
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  // معالجة اختيار صورة الوصل (إرفاق اسم الملف وتفاصيله مع الطلب)
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptImageName(file.name);
    }
  };

  // إتمام الطلب وإرساله إلى الخادم (/api/telegram) وحفظه في Supabase
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerContact.trim()) {
      alert("يرجى كتابة رقم الواتساب أو معرف حسابك لنرسل لك الكود عليه!");
      return;
    }

    setIsSubmittingOrder(true);
    const newOrderId = createUniqueId("ORD");
    const productNames = cart
      .map((i) => `${i.product.title || i.product.name} (x${i.quantity})`)
      .join(" + ");
    const primaryProductId = cart[0]?.product.id || "";

    // خيار الأمان: إذا كان الإعداد العام manual أو أي منتج في السلة manual، لا يُعطى الكود تلقائياً
    const effectiveDeliveryMode: "manual" | "auto" =
      config.globalDeliveryMode === "manual"
        ? "manual"
        : cart.every((i) => i.product.deliveryType === "auto")
        ? "auto"
        : "manual";

    const combinedNotes = [
      paymentReference ? `مرجع التحويل: ${paymentReference}` : "",
      receiptImageName ? `مرفق وصل: ${receiptImageName}` : "",
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
          socialPlatform,
          paymentMethod,
          deliveryType: effectiveDeliveryMode,
          notes: combinedNotes,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as CheckoutApiResponse;
        if (data.deliveredCode) serverDeliveredCode = data.deliveredCode;
        if (data.status) serverStatus = data.status;
      }
    } catch (err) {
      console.warn("Telegram notification warning:", err);
    }

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
      channel: socialPlatform,
      socialPlatform,
      paymentMethod,
      status: serverStatus,
      deliveryType: effectiveDeliveryMode,
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

  // فحص حالة الطلب والضمان عبر الـ API والمخزن المحلي
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
    } catch {
      // المتابعة للبحث في القائمة المحلية إذا تعذر الاتصال بالخادم
    }

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

  return (
    <div
      dir="rtl"
      className="min-h-screen text-slate-100 relative selection:bg-cyan-500 selection:text-black"
    >
      {/* 1. شريط الإعلانات وكود الخصم العلوي */}
      <div className="bg-gradient-to-r from-cyan-950/95 via-sky-900/85 to-cyan-950/95 border-b border-cyan-400/30 px-3 py-2 text-center text-xs sm:text-sm font-medium text-cyan-100 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2">
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

      {/* 2. شريط التنقل العلوي (Navbar) المتوافق أوتوماتيكياً مع الهاتف والحاسوب */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
          {/* الشعار والهوية */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <RevelioLogo
              className="w-10 h-10 sm:w-13 sm:h-13 shrink-0"
              showWordmark={false}
            />
            <div className="min-w-0">
              <div className="font-extrabold tracking-wider text-sm sm:text-xl text-white flex items-center gap-2 truncate">
                <span>{config.storeName}</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  v4.5 PRO
                </span>
              </div>
              <p className="text-[9px] sm:text-xs font-mono text-cyan-400/90 tracking-widest uppercase truncate">
                CYBER VERIFIED DELIVERY
              </p>
            </div>
          </div>

          {/* أزرار العملات + البوت الذكي + السلة + لوحة الإدارة */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ms-auto sm:ms-0">
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
              href={`https://t.me/${config.telegramBotUsername}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-medium transition"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>المساعد الذكي AI</span>
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

            <Link
              href="/admin"
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 transition"
              title="لوحة القيادة والإدارة"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-10 relative z-10">
        {/* 3. شريط البث الحي للعمليات الموثقة */}
        <div className="cyber-card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
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
              وضع التسليم:{" "}
              {config.globalDeliveryMode === "manual"
                ? "مراجعة الدفع والتسليم عبر واتساب/إنستغرام"
                : "التسليم الفوري مفعّل"}
            </span>
          </div>
        </div>

        {/* 4. قسم الـ Hero الرئيسي + الشعار السيبراني */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="cyber-card lg:col-span-7 p-5 sm:p-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>REVELIO DIGITAL SOLUTIONS • الجيل الرابع</span>
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
              Spotify)، وشحن الألعاب بضمان ذهبي واستلام آمن عبر واتساب، إنستغرام
              أو تيليجرام فور تأكيد الدفع.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">ضمان ذهبي شامل</div>
                  <div className="text-[11px] text-slate-400">تعويض واستبدال فوري</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">استلام موثوق</div>
                  <div className="text-[11px] text-slate-400">عبر واتساب أو إنستغرام</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/20 flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">دفع مرن وسريع</div>
                  <div className="text-[11px] text-slate-400">BaridiMob • CCP • USDT</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cyber-card lg:col-span-5 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase mb-2">
              OFFICIAL HOLOGRAPHIC EMBLEM // NEON CIRCUIT v4.5
            </div>
            <RevelioLogo
              className="w-52 h-52 sm:w-72 sm:h-72 mx-auto"
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

        {/* 6. كتالوج المنتجات مع البحث والتصنيفات والترتيب */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => {
              const isManual =
                config.globalDeliveryMode === "manual" ||
                product.deliveryType === "manual";
              const stockVal = product.stockCount ?? product.stock;
              const econ = calculateUnitEconomics(product, config.dzdRate);

              return (
                <div
                  key={product.id}
                  className="cyber-card p-5 flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 text-cyan-400" />
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
                      <div className="flex items-center gap-2 text-[11px] text-amber-300/95">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isManual
                            ? "يُرسل الكود عبر واتساب/إنستغرام فور التأكد من الدفع"
                            : "تسليم رقمي فوري"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-cyan-500/20 space-y-3">
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
                        href={`https://t.me/${config.telegramBotUsername}`}
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
        <section className="cyber-card p-5 sm:p-8 space-y-5">
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
                  أرقام من هاتفك للتحقق من حالة مراجعة الدفع والضمان الذهبي.
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

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  1. تم استلام الطلب ✓
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    lookupResult.status.toUpperCase() === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  2. التحقق من الدفع
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    lookupResult.status.toUpperCase() === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  3. إرسال الكود والضمان
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block">المنتج:</span>
                  <strong className="text-white">
                    {lookupResult.productName || lookupResult.productTitle}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">منصة استلام الكود:</span>
                  <strong className="text-cyan-300">
                    {lookupResult.socialPlatform || lookupResult.channel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">حالة الكود / التفعيل:</span>
                  <strong className="text-emerald-300">
                    {lookupResult.status.toUpperCase() === "COMPLETED"
                      ? lookupResult.deliveredCode ||
                        "تم إرسال الكود لحسابك الشخصي بنجاح ✓"
                      : "سيتم إرسال الكود إلى حسابك فور التأكد من وصول الدفع"}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 8. الفوتر الرسمي */}
      <footer className="border-t border-cyan-500/20 bg-slate-950/90 py-10 px-4 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-4">
          <RevelioLogo className="w-16 h-16" showWordmark={false} />
          <div className="font-black text-lg text-white tracking-wider">
            {config.storeName}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            تواصل مع المساعد الذكي على تيليجرام أو تابع صفحتنا الرسمية للحصول على
            أحدث العروض اليومية.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`https://t.me/${config.telegramBotUsername}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono hover:bg-cyan-500/20 transition"
            >
              Telegram Bot: @{config.telegramBotUsername}
            </a>
            <a
              href={`https://instagram.com/${config.instagramPage}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-mono hover:bg-pink-500/20 transition"
            >
              Instagram: @{config.instagramPage}
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
              🔒 <strong>آلية التسليم الآمن:</strong> بعد إرسال الطلب والتأكد من وصول
              المبلغ، نرسل لك كود التفعيل مباشرة إلى حسابك في{" "}
              <strong>واتساب أو إنستغرام أو تيليجرام</strong> مع تفعيل الضمان الذهبي.
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

      {/* 10. درج سلة المشتريات وإتمام الدفع */}
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

                  {/* كود الخصم */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder={`كود الخصم (مثال: ${config.promoCode})`}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 cursor-pointer"
                    >
                      تطبيق
                    </button>
                  </div>

                  {promoApplied && (
                    <div className="text-xs text-emerald-400 font-bold">
                      ✓ تم تطبيق خصم {config.promoDiscountPercent}% (-
                      {cartTotals.formattedDiscount})
                    </div>
                  )}

                  {/* حسابات الدفع الرسمية */}
                  <div className="p-3.5 rounded-xl bg-slate-900/95 border border-cyan-400/30 space-y-2 text-xs">
                    <div className="font-bold text-cyan-300">
                      💳 معلومات الدفع الرسمية:
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg">
                      <span className="text-slate-300 truncate font-mono">
                        RIP: {config.baridiMobRip}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(config.baridiMobRip)}
                        className="text-cyan-400 hover:text-cyan-200 shrink-0 cursor-pointer"
                      >
                        {copiedText === config.baridiMobRip ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      CCP: {config.ccpAccount}
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      RedotPay ID: {config.redotpayId}
                    </div>
                  </div>

                  {/* نموذج بيانات الزبون واختيار منصة الاستلام */}
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

                    <div>
                      <label className="text-xs text-cyan-300 font-bold block mb-1.5">
                        أين تريد أن نرسل لك الكود بعد التأكد من الدفع؟
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
                        وسيلة الدفع المستخدمة:
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                      >
                        <option value="BaridiMob">BaridiMob (بريدي موب)</option>
                        <option value="CCP">CCP (بريد الجزائر)</option>
                        <option value="USDT / Binance">USDT / Binance Pay</option>
                        <option value="RedotPay">RedotPay</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        رقم عملية التحويل / مرجع الوصل (اختياري):
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="مثال: رقم المعاملة في بريدي موب"
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
                          : "تأكيد الطلب واستلام الكود"}
                      </span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. نافذة تأكيد استلام الطلب */}
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
                <p className="font-bold">🛡️ طلبك الآن قيد مراجعة وصول المبلغ:</p>
                <p>
                  وصل إشعار فوري للإدارة على تيليجرام. بمجرد التأكد من وصول المبلغ (
                  {completedOrderModal.totalPrice})، سنرسل لك كود التفعيل مباشرة إلى
                  حسابك في <strong>{completedOrderModal.socialPlatform}</strong> (
                  {completedOrderModal.customerContact}).
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

            <button
              type="button"
              onClick={() => setCompletedOrderModal(null)}
              className="w-full py-3 rounded-xl bg-cyan-400 text-slate-950 font-black text-sm cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </div>
  );
}