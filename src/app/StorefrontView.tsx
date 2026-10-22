"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Key,
  ShoppingCart,
  Plus,
  Send,
  MessageCircle,
  Headphones,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  DigitalProduct,
  CategoryItem,
  SiteConfig,
  SupportTicket,
  OrderRecord,
} from "./store-data";
import RevelioLogo from "./RevelioLogo";

interface StorefrontProps {
  products: DigitalProduct[];
  categories: CategoryItem[];
  orders: OrderRecord[];
  siteConfig: SiteConfig;
  formatPrice: (usd: number) => string;
  onAddToCart: (product: DigitalProduct) => void;
  onDirectBuy: (product: DigitalProduct) => void;
  onCreateTicket: (ticket: Omit<SupportTicket, "id" | "status" | "createdAt">) => void;
}

export default function StorefrontView({
  products,
  categories,
  orders,
  siteConfig,
  formatPrice,
  onAddToCart,
  onDirectBuy,
  onCreateTicket,
}: StorefrontProps) {
  const [storeCategory, setStoreCategory] = useState<string>("ALL");
  const [storeSearch, setStoreSearch] = useState("");
  const [showSupportModal, setShowSupportModal] = useState(false);

  // أداة فحص الضمان وتتبع الطلب للزبون
  const [trackOrderInput, setTrackOrderInput] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<OrderRecord | null>(null);
  const [trackNotFound, setTrackNotFound] = useState(false);

  const [tName, setTName] = useState("");
  const [tContact, setTContact] = useState("");
  const [tSubject, setTSubject] = useState("");
  const [tMessage, setTMessage] = useState("");
  const [ticketSent, setTicketSent] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesCat = storeCategory === "ALL" || p.category === storeCategory;
    const matchesSearch = p.title.toLowerCase().includes(storeSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(
      (o) => o.orderId.toLowerCase() === trackOrderInput.trim().toLowerCase()
    );
    if (found) {
      setTrackedOrder(found);
      setTrackNotFound(false);
    } else {
      setTrackedOrder(null);
      setTrackNotFound(true);
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tMessage.trim()) return;
    onCreateTicket({
      customerName: tName,
      contact: tContact,
      subject: tSubject || "استفسار عام",
      message: tMessage,
    });
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setShowSupportModal(false);
      setTName("");
      setTContact("");
      setTSubject("");
      setTMessage("");
    }, 1800);
  };

  return (
    <div className="space-y-12 relative z-10">
      {/* شريط إشعارات الشراء الحية (Live Social Proof Bar) */}
      <div className="cyber-card px-5 py-3 flex flex-wrap items-center justify-between gap-4 border-cyan-400/30 bg-gradient-to-r from-cyan-950/40 via-[#04091a] to-violet-950/40">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-cyan-300 font-bold">LIVE FEED:</span>
          <span className="text-slate-200">
            آخر عملية تسليم فوري: <strong>{orders[0]?.productTitle}</strong> للعميل{" "}
            <span className="text-cyan-300">{orders[0]?.customerName}</span> ({orders[0]?.timestamp})
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-emerald-400">
          <span>● خوادم التسليم التلقائي: نشطة 100%</span>
          <span>● الضمان الذهبي مفعل</span>
        </div>
      </div>

      {/* قسم الـ Hero الرئيسي مع مسرح اللوغو المتحرك الكامل (Revelio Animated Logo Stage) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="cyber-card lg:col-span-7 p-8 md:p-10 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              REVELIO DIGITAL SOLUTIONS • الجيل الرابع
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight">
              القوة والسرعة في{" "}
              <span className="bg-gradient-to-l from-cyan-400 via-sky-200 to-violet-400 bg-clip-text text-transparent">
                {siteConfig.heroTitleHighlight}
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              {siteConfig.heroSubtitle}
            </p>
          </div>

          {/* شريط البحث والفلاتر */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث عن Gemini, Netflix, Valorant, Spotify..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="w-full bg-black/70 border border-cyan-500/30 rounded-2xl pr-11 pl-4 py-3.5 text-sm focus:outline-none focus:border-cyan-400 shadow-inner transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStoreCategory("ALL")}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  storeCategory === "ALL"
                    ? "bg-cyan-400 text-black border-cyan-300 shadow-lg shadow-cyan-500/25"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
                }`}
              >
                الكل ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setStoreCategory(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    storeCategory === cat.slug
                      ? "bg-cyan-400 text-black border-cyan-300 shadow-lg shadow-cyan-500/25"
                      : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* مسرح شعار REVELIO المتحرك الأصلي من ملف الـ HTML */}
        <div className="cyber-card lg:col-span-5 p-6 flex flex-col items-center justify-between text-center bg-[#000206] border-cyan-400/40 shadow-2xl shadow-cyan-500/10">
          <div className="w-full flex items-center justify-between text-[11px] font-mono text-cyan-400 px-2">
            <span>● OFFICIAL HOLOGRAPHIC EMBLEM</span>
            <span>NEON CIRCUIT v4.5</span>
          </div>

          <div className="my-2">
            <RevelioLogo
              className="w-60 h-60 md:w-64 md:h-64 mx-auto"
              showWordmark={true}
              showReplayButton={true}
            />
          </div>

          <div className="w-full grid grid-cols-2 gap-2.5 pt-3 border-t border-white/10">
            <a
              href={`https://t.me/${siteConfig.telegramUsername}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500 hover:text-white border border-sky-400/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              بوت تيليجرام الذكي
            </a>
            <button
              onClick={() => setShowSupportModal(true)}
              className="py-2.5 px-3 rounded-xl bg-violet-500/15 hover:bg-violet-600 hover:text-white border border-violet-400/30 text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              تذكرة دعم فوري
            </button>
          </div>
        </div>
      </section>

      {/* شبكة المنتجات مع القص الأوتوماتيكي العصري والليزر الضوئي */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="cyber-card p-4 flex flex-col justify-between group"
          >
            <div>
              <div className="cyber-image-crop mb-4">
                <img
                  src={
                    product.imageUrl ||
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={product.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000206] via-transparent to-transparent opacity-85" />

                <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-400/40 text-cyan-300">
                  {product.category}
                </span>

                {product.badge && (
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow">
                    {product.badge}
                  </span>
                )}
              </div>

              <div className="px-1">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                  <span className="text-cyan-300 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    {product.deliveryType === "INSTANT_KEY" ? "تسليم كود فوري" : "حساب جاهز مشفر"}
                  </span>
                  <span
                    className={
                      product.stockCount > 0 ? "text-emerald-400 font-bold" : "text-rose-400"
                    }
                  >
                    {product.stockCount > 0 ? `متوفر (${product.stockCount})` : "نفد"}
                  </span>
                </div>

                <h3 className="text-base font-extrabold group-hover:text-cyan-300 transition line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{product.duration}</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2 px-1">
              <div>
                <span className="text-[10px] text-slate-400 block">السعر النهائي</span>
                <span className="text-lg font-black text-white">
                  {formatPrice(product.priceUSD)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.stockCount <= 0}
                  title="أضف إلى السلة"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-cyan-400 hover:text-black disabled:opacity-40 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDirectBuy(product)}
                  disabled={product.stockCount <= 0}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-95 disabled:opacity-40 text-xs font-bold transition flex items-center gap-1 shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  اطلب الآن
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ميزة جديدة: رادار فحص الضمان وتتبع الطلبات الفوري للزبون */}
      <section className="cyber-card p-7 border-cyan-500/30 bg-gradient-to-r from-[#03091e] to-[#060514]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-2">
            <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              WARRANTY & KEY VAULT RADAR
            </span>
            <h3 className="text-xl font-black">فاحص الضمان واسترجاع الأكواد الفوري</h3>
            <p className="text-xs text-slate-400">
              أدخل رقم طلبك (مثال للتجربة: <code className="text-cyan-300">ORD-948210</code>) لعرض الكود المسلم وحالة الضمان الذهبي.
            </p>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <form onSubmit={handleTrackOrder} className="flex gap-2">
              <input
                type="text"
                placeholder="أدخل رقم الطلب هنا (مثال: ORD-948210)..."
                value={trackOrderInput}
                onChange={(e) => setTrackOrderInput(e.target.value)}
                className="flex-1 bg-black/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-xs font-mono text-cyan-300"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                فحص الآن
              </button>
            </form>

            {trackedOrder && (
              <div className="p-4 rounded-xl bg-black/80 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-emerald-400 font-bold block">
                    ✔ المنتج: {trackedOrder.productTitle} ({trackedOrder.status})
                  </span>
                  <code className="text-cyan-300 font-mono" dir="ltr">
                    الكود المسلم: {trackedOrder.deliveredKey}
                  </code>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                  الضمان ساري (30 يوم)
                </span>
              </div>
            )}
            {trackNotFound && (
              <p className="text-xs text-rose-400">
                لم يتم العثور على هذا الرقم، تأكد من كتابة ORD-948210 بشكل صحيح.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* الفوتر ومنصات التواصل الاجتماعي */}
      <footer className="cyber-card p-8 border-t border-cyan-500/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <RevelioLogo className="w-16 h-16" showWordmark={false} />
            <div>
              <h3 className="text-lg font-black text-white">{siteConfig.storeName}</h3>
              <p className="text-xs text-slate-400">
                تابعنا على منصاتنا الرسمية للحصول على أكواد هدايا وعروض يومية حصرية
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {siteConfig.instagramUrl && (
              <a
                href={siteConfig.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600/20 to-amber-500/20 hover:from-pink-600 hover:to-amber-500 border border-pink-500/30 text-xs font-bold flex items-center gap-2 transition"
              >
                Instagram
              </a>
            )}
            {siteConfig.tiktokUrl && (
              <a
                href={siteConfig.tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-cyan-400 hover:text-black border border-white/15 text-xs font-bold flex items-center gap-2 transition"
              >
                TikTok
              </a>
            )}
            {siteConfig.telegramUsername && (
              <a
                href={`https://t.me/${siteConfig.telegramUsername}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 border border-sky-400/30 text-xs font-bold flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                Telegram
              </a>
            )}
            {siteConfig.whatsappNumber && (
              <a
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-400/30 text-xs font-bold flex items-center gap-2 transition"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
            {siteConfig.discordUrl && (
              <a
                href={siteConfig.discordUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-600 border border-indigo-400/30 text-xs font-bold flex items-center gap-2 transition"
              >
                Discord
              </a>
            )}
          </div>
        </div>
      </footer>

      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleTicketSubmit}
            className="cyber-card max-w-md w-full p-7 space-y-4 border border-cyan-500/40"
          >
            <h3 className="text-lg font-black flex items-center gap-2">
              <Headphones className="w-5 h-5 text-cyan-400" />
              فتح تذكرة دعم فني مباشر
            </h3>
            {ticketSent ? (
              <div className="p-6 text-center space-y-2 text-emerald-400">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p className="font-bold text-sm">تم إرسال رسالتك إلى فريق الدعم بنجاح!</p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  required
                  placeholder="اسمك الكريم"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="حساب تيليجرام أو رقم واتساب للتواصل معك"
                  value={tContact}
                  onChange={(e) => setTContact(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="موضوع الطلب أو رقم الطلب (اختياري)"
                  value={tSubject}
                  onChange={(e) => setTSubject(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs"
                />
                <textarea
                  rows={4}
                  required
                  placeholder="اشرح لنا استفسارك أو مشكلتك بالتفصيل..."
                  value={tMessage}
                  onChange={(e) => setTMessage(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-xs"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-400 text-black font-bold text-xs cursor-pointer"
                  >
                    إرسال التذكرة
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}