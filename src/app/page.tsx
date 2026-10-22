"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import {
  Bell,
  ShoppingCart,
  X,
  Trash2,
  Send,
  MessageCircle,
  Zap,
  CheckCircle2,
  Copy,
  Tag,
} from "lucide-react";
import {
  DigitalProduct,
  CartItem,
  Currency,
  useRevelioStore,
  calculateUnitEconomics,
  createUniqueId,
} from "./store-data";
import RevelioLogo from "./RevelioLogo";
import StorefrontView from "./StorefrontView";

export default function RevelioMainStorePage() {
  const {
    siteConfig,
    categories,
    products,
    setProducts,
    orders,
    setOrders,
    setTickets,
  } = useRevelioStore();

  const [currency, setCurrency] = useState<Currency>("DZD");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  const [deliveredOrder, setDeliveredOrder] = useState<{
    title: string;
    secretKey: string;
    orderId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const formatPrice = (usd: number) => {
    const rates: Record<Currency, { rate: number; symbol: string }> = {
      USD: { rate: 1, symbol: "$" },
      EUR: { rate: siteConfig.eurRate, symbol: "€" },
      DZD: { rate: siteConfig.dzdRate, symbol: "د.ج" },
    };
    const converted = usd * rates[currency].rate;
    return currency === "DZD"
      ? `${Math.round(converted).toLocaleString()} ${rates[currency].symbol}`
      : `${rates[currency].symbol}${converted.toFixed(2)}`;
  };

  const addToCart = (product: DigitalProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleDirectBuy = (product: DigitalProduct) => {
    addToCart(product);
    setIsCartOpen(true);
  };

  const subtotalUSD = cart.reduce(
    (acc, i) => acc + i.product.priceUSD * i.quantity,
    0
  );
  const finalTotalUSD = discountApplied ? subtotalUSD * 0.9 : subtotalUSD;

  const handleCheckoutChannel = (
    channel: "INSTANT_WEB" | "TELEGRAM_BOT" | "WHATSAPP"
  ) => {
    if (cart.length === 0) return;

    const orderId = createUniqueId("ORD");
    const firstItem = cart[0].product;
    const econ = calculateUnitEconomics(firstItem);
    const deliveredKey =
      firstItem.sampleKeys[0] || createUniqueId(`KEY-${firstItem.category}`);

    setProducts((prev) =>
      prev.map((p) => {
        const inCart = cart.find((c) => c.product.id === p.id);
        if (!inCart) return p;
        return {
          ...p,
          stockCount: Math.max(0, p.stockCount - inCart.quantity),
          soldCount: p.soldCount + inCart.quantity,
          sampleKeys: p.sampleKeys.slice(inCart.quantity),
        };
      })
    );

    setOrders((prev) => [
      {
        orderId,
        customerName: customerName || "عميل المتجر",
        customerContact: customerContact || "مباشر",
        channel,
        productTitle: cart
          .map((c) => `${c.product.title} (x${c.quantity})`)
          .join(" + "),
        category: firstItem.category,
        priceUSD: Number(finalTotalUSD.toFixed(2)),
        netProfitUSD: econ.netProfit,
        deliveredKey,
        timestamp: "الآن",
        status: channel === "INSTANT_WEB" ? "COMPLETED" : "PENDING_VERIFICATION",
      },
      ...prev,
    ]);

    const itemsSummary = cart
      .map((c) => `• ${c.product.title} (x${c.quantity})`)
      .join("\n");
    const messageText = `🚀 *طلب جديد من متجر ${siteConfig.storeName}*\nرقم الطلب: ${orderId}\nالعميل: ${
      customerName || "غير محدد"
    }\nالمنتجات:\n${itemsSummary}\nالإجمالي: ${formatPrice(finalTotalUSD)}`;

    if (channel === "WHATSAPP") {
      window.open(
        `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
          messageText
        )}`,
        "_blank"
      );
    } else if (channel === "TELEGRAM_BOT") {
      window.open(
        `https://t.me/${siteConfig.telegramUsername}?start=${orderId}`,
        "_blank"
      );
    } else {
      setDeliveredOrder({
        title: cart.map((c) => c.product.title).join(" + "),
        secretKey: deliveredKey,
        orderId,
      });
    }

    setCart([]);
    setIsCartOpen(false);
  };

  return (
    <div dir="rtl" className="min-h-screen text-slate-100 pb-20 relative">
      {/* كرات الإضاءة النيون العائمة في الخلفية */}
      <div className="ambient-orb w-96 h-96 bg-cyan-500/15 top-20 -right-20" />
      <div className="ambient-orb w-96 h-96 bg-violet-600/15 bottom-20 -left-20" />

      {siteConfig.showAnnouncement && (
        <div className="bg-gradient-to-r from-cyan-950 via-violet-950 to-cyan-950 border-b border-cyan-400/20 py-2 px-4 text-center text-xs font-medium text-cyan-200 flex items-center justify-center gap-2 relative z-20">
          <Bell className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
          <span>{siteConfig.announcementText}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#000206]/85 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <RevelioLogo className="w-14 h-14" showWordmark={false} />
            <div>
              <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                {siteConfig.storeName}
              </span>
              <span className="block text-[10px] text-cyan-400 font-mono">
                ● {siteConfig.storeTagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 px-2 py-1.5 rounded-xl border border-white/10">
              {(["DZD", "USD", "EUR"] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    currency === cur
                      ? "bg-cyan-400 text-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة</span>
              {cart.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-black text-cyan-300 font-mono text-[11px]">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        <StorefrontView
          products={products}
          categories={categories}
          orders={orders}
          siteConfig={siteConfig}
          formatPrice={formatPrice}
          onAddToCart={addToCart}
          onDirectBuy={handleDirectBuy}
          onCreateTicket={(tk) =>
            setTickets((prev) => [
              {
                ...tk,
                id: createUniqueId("TCK"),
                status: "OPEN",
                createdAt: "الآن",
              },
              ...prev,
            ])
          }
        />
      </main>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#040711] border-r border-cyan-500/30 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  سلة المشتريات الذكية
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-16">
                  سلة المشتريات فارغة حالياً
                </p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white">
                          {item.product.title}
                        </h4>
                        <span className="text-xs text-cyan-400 font-mono">
                          {formatPrice(item.product.priceUSD)} × {item.quantity}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter((c) => c.product.id !== item.product.id)
                          )
                        }
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="كود الخصم (جرب REV10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={() => {
                        if (couponCode.toUpperCase() === "REV10")
                          setDiscountApplied(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-cyan-400 hover:text-black text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      تطبيق
                    </button>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <input
                      type="text"
                      placeholder="اسمك الكريم"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="رقم واتساب أو معرف تيليجرام (@username)"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">الإجمالي النهائي:</span>
                  <span className="text-xl font-black text-cyan-400">
                    {formatPrice(finalTotalUSD)}
                  </span>
                </div>

                <button
                  onClick={() => handleCheckoutChannel("INSTANT_WEB")}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  دفع واستلام الكود فوراً في الموقع
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCheckoutChannel("TELEGRAM_BOT")}
                    className="py-3 rounded-xl bg-sky-500/20 hover:bg-sky-500 border border-sky-400/40 text-sky-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    اطلب عبر تيليجرام
                  </button>
                  <button
                    onClick={() => handleCheckoutChannel("WHATSAPP")}
                    className="py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-400/40 text-emerald-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    اطلب عبر واتساب
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {deliveredOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="cyber-card max-w-md w-full p-7 space-y-5 border border-cyan-400/50">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                تم التسليم الفوري بنجاح
              </span>
              <button
                onClick={() => setDeliveredOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono">
                {deliveredOrder.orderId}
              </p>
              <h3 className="text-lg font-black mt-1">{deliveredOrder.title}</h3>
            </div>
            <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/40 flex items-center justify-between gap-2">
              <code
                className="text-sm font-mono font-bold text-cyan-300 break-all"
                dir="ltr"
              >
                {deliveredOrder.secretKey}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(deliveredOrder.secretKey);
                  setCopied(true);
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-cyan-400 hover:text-black text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? "تم!" : "نسخ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}