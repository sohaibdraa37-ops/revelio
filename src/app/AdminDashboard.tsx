"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Package,
  Key,
  FileText,
  Settings,
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  Lock,
  Globe,
  X,
  FolderTree,
  Headphones,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  DigitalProduct,
  CategoryItem,
  OrderRecord,
  SupportTicket,
  SiteConfig,
  AdminTab,
  calculateUnitEconomics,
} from "./store-data";

interface AdminProps {
  products: DigitalProduct[];
  setProducts: React.Dispatch<React.SetStateAction<DigitalProduct[]>>;
  categories: CategoryItem[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryItem[]>>;
  orders: OrderRecord[];
  setOrders: React.Dispatch<React.SetStateAction<OrderRecord[]>>;
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  siteConfig: SiteConfig;
  setSiteConfig: React.Dispatch<React.SetStateAction<SiteConfig>>;
  telemetry: { time: string; grossRevenue: number; netProfit: number; orders: number }[];
  formatPrice: (usd: number) => string;
}

export default function AdminDashboard({
  products,
  setProducts,
  categories,
  setCategories,
  orders,
  setOrders,
  tickets,
  setTickets,
  siteConfig,
  setSiteConfig,
  telemetry,
  formatPrice,
}: AdminProps) {
  const [adminTab, setAdminTab] = useState<AdminTab>("OVERVIEW");
  const [adminSearch, setAdminSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [isNewProductModal, setIsNewProductModal] = useState(false);

  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  const [selectedProductForVault, setSelectedProductForVault] = useState(
    products[0]?.id || ""
  );
  const [newKeyInput, setNewKeyInput] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const globalStats = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalOrders = 0;
    let totalStock = 0;
    products.forEach((p) => {
      const econ = calculateUnitEconomics(p);
      totalGross += p.priceUSD * p.soldCount;
      totalNet += econ.totalProductNetProfit;
      totalOrders += p.soldCount;
      totalStock += p.stockCount;
    });
    const avgMargin =
      totalGross > 0 ? ((totalNet / totalGross) * 100).toFixed(1) : "0";
    return { totalGross, totalNet, totalOrders, totalStock, avgMargin };
  }, [products]);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (isNewProductModal) {
      setProducts((prev) => [editingProduct, ...prev]);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
      );
    }
    setEditingProduct(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;
    setCategories((prev) => [
      ...prev,
      {
        id: `cat-${Date.now()}`,
        name: newCatName.trim(),
        slug: newCatSlug.trim().toUpperCase(),
      },
    ]);
    setNewCatName("");
    setNewCatSlug("");
  };

  const handleInjectKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;
    const keysArray = newKeyInput
      .split("\n")
      .map((k) => k.trim())
      .filter(Boolean);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProductForVault
          ? {
              ...p,
              stockCount: p.stockCount + keysArray.length,
              sampleKeys: [...keysArray, ...p.sampleKeys],
            }
          : p
      )
    );
    setNewKeyInput("");
  };

  return (
    <div className="space-y-8">
      <div className="cyber-card p-3 flex items-center gap-2 overflow-x-auto">
        {[
          { id: "OVERVIEW", label: "الإحصائيات الدقيقة", icon: Activity },
          { id: "CATALOG", label: "المنتجات والصور", icon: Package },
          { id: "CATEGORIES", label: "التصنيفات", icon: FolderTree },
          { id: "VAULT", label: "خزنة الأكواد", icon: Key },
          { id: "ORDERS", label: `الطلبات (${orders.length})`, icon: FileText },
          {
            id: "SUPPORT",
            label: `الدعم الفني (${
              tickets.filter((t) => t.status === "OPEN").length
            })`,
            icon: Headphones,
          },
          { id: "SETTINGS", label: "بوت تيليجرام والهوية", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as AdminTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                adminTab === tab.id
                  ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {adminTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="cyber-card p-6">
              <span className="text-xs text-slate-400 flex justify-between">
                صافي الربح الحقيقي <DollarSign className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="text-3xl font-black mt-2 text-emerald-400">
                {formatPrice(globalStats.totalNet)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                هامش الربح: {globalStats.avgMargin}%
              </span>
            </div>
            <div className="cyber-card p-6">
              <span className="text-xs text-slate-400 flex justify-between">
                إجمالي المبيعات <TrendingUp className="w-4 h-4 text-cyan-400" />
              </span>
              <div className="text-3xl font-black mt-2 text-white">
                {formatPrice(globalStats.totalGross)}
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">
                {globalStats.totalOrders} عملية مكتملة
              </span>
            </div>
            <div className="cyber-card p-6">
              <span className="text-xs text-slate-400 flex justify-between">
                مخزون الخزنة <Layers className="w-4 h-4 text-violet-400" />
              </span>
              <div className="text-3xl font-black mt-2 text-violet-300 font-mono">
                {globalStats.totalStock} كود
              </div>
            </div>
            <div className="cyber-card p-6">
              <span className="text-xs text-slate-400 flex justify-between">
                حالة بوت تيليجرام <Send className="w-4 h-4 text-sky-400" />
              </span>
              <div className="text-lg font-black mt-3 text-sky-400 font-mono">
                @{siteConfig.telegramUsername}
              </div>
              <span className="text-[11px] text-emerald-400">
                ● جاهز للربط عبر Webhook
              </span>
            </div>
          </div>

          <div className="cyber-card p-6 h-[320px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetry}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#060914",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="grossRevenue"
                  stroke="#1fe9ff"
                  fill="rgba(31,233,255,0.2)"
                />
                <Area
                  type="monotone"
                  dataKey="netProfit"
                  stroke="#10b981"
                  fill="rgba(16,185,129,0.25)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {adminTab === "CATALOG" && (
        <div className="space-y-6">
          <div className="cyber-card p-5 flex flex-wrap justify-between gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-xs"
              />
            </div>
            <button
              onClick={() => {
                setIsNewProductModal(true);
                setEditingProduct({
                  id: `prod-${Date.now()}`,
                  title: "",
                  category: categories[0]?.slug || "AI",
                  duration: "اشتراك شهر كامل",
                  imageUrl:
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
                  deliveryType: "INSTANT_KEY",
                  priceUSD: 9.99,
                  wholesaleCostUSD: 4.5,
                  gatewayFeePercent: 2.5,
                  stockCount: 10,
                  soldCount: 0,
                  salesVelocityPerDay: 5,
                  renewalRate: 85,
                  badge: "جديد",
                  sampleKeys: ["NEW-KEY-2026"],
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              إضافة منتج جديد مع صورة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {products
              .filter((p) =>
                p.title.toLowerCase().includes(adminSearch.toLowerCase())
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="cyber-card p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="cyber-image-crop mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.title} />
                    </div>
                    <h4 className="font-bold text-sm text-white">{item.title}</h4>
                    <p className="text-xs text-cyan-400 font-mono mt-1">
                      {formatPrice(item.priceUSD)} • المخزون: {item.stockCount}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                    <button
                      onClick={() => {
                        setIsNewProductModal(false);
                        setEditingProduct(item);
                      }}
                      className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-violet-600 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      تعديل الصورة والسعر
                    </button>
                    <button
                      onClick={() =>
                        setProducts((prev) =>
                          prev.filter((p) => p.id !== item.id)
                        )
                      }
                      className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {adminTab === "CATEGORIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddCategory}
            className="cyber-card lg:col-span-5 p-6 space-y-4"
          >
            <h3 className="text-base font-bold">إضافة تصنيف جديد للمتجر</h3>
            <input
              type="text"
              required
              placeholder="اسم التصنيف (مثال: بطاقات هدايا)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs"
            />
            <input
              type="text"
              required
              placeholder="الرمز التقني Slug (مثال: GIFTCARDS)"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 text-black font-bold text-xs cursor-pointer"
            >
              إضافة التصنيف الآن
            </button>
          </form>

          <div className="cyber-card lg:col-span-7 p-6 space-y-3">
            <h3 className="text-base font-bold">التصنيفات الفعالة (تعديل مباشر)</h3>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
              >
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) =>
                    setCategories((prev) =>
                      prev.map((c) =>
                        c.id === cat.id ? { ...c, name: e.target.value } : c
                      )
                    )
                  }
                  className="bg-transparent border-b border-white/10 focus:border-cyan-400 text-xs font-bold text-white px-2 py-1 flex-1"
                />
                <span className="text-xs font-mono text-cyan-400 px-2 py-1 rounded bg-white/5">
                  {cat.slug}
                </span>
                <button
                  onClick={() =>
                    setCategories((prev) => prev.filter((c) => c.id !== cat.id))
                  }
                  className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab === "VAULT" && (
        <form
          onSubmit={handleInjectKeys}
          className="cyber-card p-6 space-y-4 max-w-2xl"
        >
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            شحن أكواد أو حسابات جديدة في الخزنة
          </h3>
          <select
            value={selectedProductForVault}
            onChange={(e) => setSelectedProductForVault(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-3 text-xs"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#060914]">
                {p.title} (المتوفر: {p.stockCount})
              </option>
            ))}
          </select>
          <textarea
            rows={5}
            value={newKeyInput}
            onChange={(e) => setNewKeyInput(e.target.value)}
            placeholder="أدخل كل كود أو حساب في سطر جديد..."
            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-cyan-500 text-black font-bold text-xs cursor-pointer"
          >
            تشفير وإضافة للخزنة
          </button>
        </form>
      )}

      {adminTab === "ORDERS" && (
        <div className="cyber-card p-6 overflow-x-auto">
          <h3 className="text-lg font-bold mb-4">
            إدارة الطلبات متعددة القنوات (الموقع، بوت تيليجرام، واتساب)
          </h3>
          <table className="w-full text-right text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-3 px-3">الطلب</th>
                <th className="py-3 px-3">العميل والتواصل</th>
                <th className="py-3 px-3">قناة الطلب</th>
                <th className="py-3 px-3">المنتجات</th>
                <th className="py-3 px-3">المبلغ</th>
                <th className="py-3 px-3">الحالة والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((ord) => (
                <tr key={ord.orderId}>
                  <td className="py-3.5 px-3 text-cyan-400 font-bold">
                    {ord.orderId}
                  </td>
                  <td className="py-3.5 px-3 font-sans">
                    <div className="font-bold text-white">{ord.customerName}</div>
                    <div className="text-[11px] text-slate-400">
                      {ord.customerContact}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-1 rounded bg-white/5 text-sky-300">
                      {ord.channel}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-sans text-white">
                    {ord.productTitle}
                  </td>
                  <td className="py-3.5 px-3 text-emerald-400 font-bold">
                    {formatPrice(ord.priceUSD)}
                  </td>
                  <td className="py-3.5 px-3">
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        setOrders((prev) =>
                          prev.map((o) =>
                            o.orderId === ord.orderId
                              ? {
                                  ...o,
                                  status: e.target.value as OrderRecord["status"],
                                }
                              : o
                          )
                        )
                      }
                      className="bg-black/60 border border-white/15 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="COMPLETED">مكتمل (COMPLETED)</option>
                      <option value="PENDING_VERIFICATION">
                        قيد التأكيد (PENDING)
                      </option>
                      <option value="REFUNDED">مسترجع (REFUNDED)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adminTab === "SUPPORT" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">تذاكر واستفسارات الزبائن</h3>
          {tickets.map((t) => (
            <div key={t.id} className="cyber-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-cyan-400">{t.id}</span>
                  <h4 className="text-sm font-bold text-white">
                    {t.subject} — ({t.customerName})
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    وسيلة تواصل الزبون: {t.contact}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    t.status === "OPEN"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {t.status === "OPEN" ? "تذكرة مفتوحة" : "تم الحل"}
                </span>
              </div>
              <p className="text-xs text-slate-200 bg-black/40 p-3 rounded-xl border border-white/5">
                {t.message}
              </p>
              {t.adminReply && (
                <p className="text-xs text-emerald-300 bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20">
                  رد الإدارة: {t.adminReply}
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اكتب ردك على الزبون هنا..."
                  value={replyText[t.id] || ""}
                  onChange={(e) =>
                    setReplyText({ ...replyText, [t.id]: e.target.value })
                  }
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs"
                />
                <button
                  onClick={() => {
                    setTickets((prev) =>
                      prev.map((tk) =>
                        tk.id === t.id
                          ? {
                              ...tk,
                              adminReply: replyText[t.id],
                              status: "RESOLVED",
                            }
                          : tk
                      )
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  إرسال وحل التذكرة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adminTab === "SETTINGS" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="cyber-card p-6 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-sky-400">
              <Send className="w-4 h-4" />
              إعدادات الربط مع بوت تيليجرام وواتساب
            </h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                معرف بوت تيليجرام (بدون @):
              </label>
              <input
                type="text"
                value={siteConfig.telegramUsername}
                onChange={(e) =>
                  setSiteConfig({
                    ...siteConfig,
                    telegramUsername: e.target.value,
                  })
                }
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Telegram Bot API Token (للربط البرمجي المستقبلي):
              </label>
              <input
                type="text"
                value={siteConfig.telegramBotToken}
                onChange={(e) =>
                  setSiteConfig({
                    ...siteConfig,
                    telegramBotToken: e.target.value,
                  })
                }
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                رقم واتساب لاستقبال الطلبات (مع رمز الدولة مثل 213):
              </label>
              <input
                type="text"
                value={siteConfig.whatsappNumber}
                onChange={(e) =>
                  setSiteConfig({
                    ...siteConfig,
                    whatsappNumber: e.target.value,
                  })
                }
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400"
              />
            </div>
          </div>

          <div className="cyber-card p-6 space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-violet-400">
              <Globe className="w-4 h-4" />
              روابط التواصل الاجتماعي وأسعار العملات
            </h3>
            <input
              type="text"
              placeholder="رابط Instagram"
              value={siteConfig.instagramUrl}
              onChange={(e) =>
                setSiteConfig({ ...siteConfig, instagramUrl: e.target.value })
              }
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono"
            />
            <input
              type="text"
              placeholder="رابط TikTok"
              value={siteConfig.tiktokUrl}
              onChange={(e) =>
                setSiteConfig({ ...siteConfig, tiktokUrl: e.target.value })
              }
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono"
            />
            <input
              type="text"
              placeholder="رابط Discord"
              value={siteConfig.discordUrl}
              onChange={(e) =>
                setSiteConfig({ ...siteConfig, discordUrl: e.target.value })
              }
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono"
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  سعر الصرف (DZD):
                </label>
                <input
                  type="number"
                  value={siteConfig.dzdRate}
                  onChange={(e) =>
                    setSiteConfig({
                      ...siteConfig,
                      dzdRate: Number(e.target.value) || 245,
                    })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  الرمز السري (Master PIN):
                </label>
                <input
                  type="text"
                  value={siteConfig.masterPin}
                  onChange={(e) =>
                    setSiteConfig({ ...siteConfig, masterPin: e.target.value })
                  }
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="cyber-card max-w-lg w-full p-6 space-y-4 border border-cyan-500/40"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black">
                تعديل المنتج ومعاينة القص الأوتوماتيكي للصورة
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="cyber-image-crop h-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={editingProduct.imageUrl} alt="Preview" />
            </div>

            <input
              type="text"
              required
              placeholder="اسم المنتج"
              value={editingProduct.title}
              onChange={(e) =>
                setEditingProduct({ ...editingProduct, title: e.target.value })
              }
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs"
            />
            <input
              type="text"
              required
              placeholder="رابط صورة المنتج (يتم قصها تلقائياً)"
              value={editingProduct.imageUrl}
              onChange={(e) =>
                setEditingProduct({
                  ...editingProduct,
                  imageUrl: e.target.value,
                })
              }
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={editingProduct.category}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    category: e.target.value,
                  })
                }
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                value={editingProduct.priceUSD}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    priceUSD: Number(e.target.value),
                  })
                }
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <input
                type="number"
                value={editingProduct.stockCount}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    stockCount: Number(e.target.value),
                  })
                }
                className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs cursor-pointer"
            >
              حفظ المنتج والصورة المقصوصة
            </button>
          </form>
        </div>
      )}
    </div>
  );
}