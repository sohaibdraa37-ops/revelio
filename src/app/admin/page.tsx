"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { useRevelioStore, Currency } from "../store-data";
import RevelioLogo from "../RevelioLogo";
import AdminDashboard from "../AdminDashboard";

export default function SecretAdminRoutePage() {
  const {
    siteConfig, setSiteConfig,
    categories, setCategories,
    products, setProducts,
    orders, setOrders,
    tickets, setTickets,
    telemetry,
  } = useRevelioStore();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState<Currency>("DZD");

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === siteConfig.masterPin) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("رمز الدخول غير صحيح! (الرمز الافتراضي: 2026)");
    }
  };

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="cyber-card max-w-sm w-full p-8 space-y-5 text-center border border-cyan-500/30">
          <RevelioLogo className="w-28 h-28 mx-auto" />
          <div>
            <span className="text-[11px] font-mono text-cyan-400 flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5" /> PRIVATE STAFF PORTAL (/admin)
            </span>
            <h1 className="text-xl font-black mt-1">بوابة قيادة الفريق الخاصة</h1>
            <p className="text-xs text-slate-400 mt-1">الرمز السري الافتراضي: 2026</p>
          </div>
          <input
            type="password"
            autoFocus
            placeholder="أدخل رمز الـ PIN السري..."
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full bg-black/80 border border-cyan-500/30 rounded-xl px-4 py-3 text-center text-lg font-mono text-cyan-300"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-xs cursor-pointer">
            الدخول إلى لوحة الإدارة
          </button>
        </form>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen text-slate-100 pb-20">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#03050c]/90 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RevelioLogo className="w-11 h-11" />
            <div>
              <span className="text-lg font-black text-white">مركز قيادة {siteConfig.storeName}</span>
              <span className="block text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> مسار الإدارة المستقل (/admin)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-xl border border-white/10">
              {(["DZD", "USD", "EUR"] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                    currency === cur ? "bg-cyan-400 text-black" : "text-slate-400"
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-black text-xs font-bold flex items-center gap-1.5 transition"
            >
              معاينة المتجر
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        <AdminDashboard
          products={products}
          setProducts={setProducts}
          categories={categories}
          setCategories={setCategories}
          orders={orders}
          setOrders={setOrders}
          tickets={tickets}
          setTickets={setTickets}
          siteConfig={siteConfig}
          setSiteConfig={setSiteConfig}
          telemetry={telemetry}
          formatPrice={formatPrice}
        />
      </main>
    </div>
  );
}