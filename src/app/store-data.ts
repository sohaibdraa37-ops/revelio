"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/purity, @typescript-eslint/no-unused-vars */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Currency = "DZD" | "USD" | "EUR";
export type AdminTab = "OVERVIEW" | "CATALOG" | "CATEGORIES" | "VAULT" | "ORDERS" | "SUPPORT" | "SETTINGS";

export interface CategoryItem { id: string; name: string; slug: string; }
export interface DigitalProduct {
  id: string; title: string; category: string; duration: string; imageUrl: string; deliveryType: "INSTANT_KEY" | "SHARED_VAULT" | "DIRECT_TOPUP";
  priceUSD: number; wholesaleCostUSD: number; gatewayFeePercent: number; stockCount: number; soldCount: number; salesVelocityPerDay: number; renewalRate: number; badge?: string; sampleKeys: string[];
}
export interface CartItem { product: DigitalProduct; quantity: number; }
export interface OrderRecord {
  orderId: string; customerName: string; customerContact: string; channel: "INSTANT_WEB" | "TELEGRAM_BOT" | "WHATSAPP"; productTitle: string; category: string; priceUSD: number; netProfitUSD: number; deliveredKey: string; timestamp: string; status: "COMPLETED" | "PENDING_VERIFICATION" | "REFUNDED";
}
export interface SupportTicket {
  id: string; customerName: string; contact: string; orderId?: string; subject: string; message: string; adminReply?: string; status: "OPEN" | "RESOLVED"; createdAt: string;
}
export interface SiteConfig {
  storeName: string; storeTagline: string; heroTitleHighlight: string; heroSubtitle: string; announcementText: string; showAnnouncement: boolean; dzdRate: number; eurRate: number; masterPin: string; whatsappNumber: string; telegramUsername: string; telegramBotToken: string; telegramChatId: string; autoSyncTelegramBot: boolean; instagramUrl: string; tiktokUrl: string; discordUrl: string;
}

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: "cat-1", name: "الذكاء الاصطناعي (AI)", slug: "AI" },
  { id: "cat-2", name: "البث الترفيهي (Streaming)", slug: "STREAMING" },
  { id: "cat-3", name: "شحن الألعاب (Gaming)", slug: "GAMING" },
  { id: "cat-4", name: "البرامج والتراخيص (Software)", slug: "SOFTWARE" },
];

export const INITIAL_SITE_CONFIG: SiteConfig = {
  storeName: "REVELIO DIGITAL", storeTagline: "CYBER AUTO-DELIVERY v4.5", heroTitleHighlight: "الاشتراكات والأكواد الرقمية", heroSubtitle: "بوابتك الأولى في الجزائر والعالم العربي لاشتراكات الذكاء الاصطناعي (Gemini Advanced)، البث الترفيهي (Netflix 4K & Spotify)، وشحن الألعاب بتسليم فوري أو عبر تيليجرام وواتساب.", announcementText: "⚡ استعمل كود الخصم REV10 للحصول على تخفيض 10% إضافي على سلة مشترياتك!", showAnnouncement: true, dzdRate: 245, eurRate: 0.92, masterPin: "2026", whatsappNumber: "213550000000", telegramUsername: "RevelioDigitalBot", telegramBotToken: "748291002:AAHxyz_SampleToken_RevelioBot", telegramChatId: "-1002026998877", autoSyncTelegramBot: true, instagramUrl: "https://instagram.com/revelio_digital", tiktokUrl: "https://tiktok.com/@revelio_digital", discordUrl: "https://discord.gg/revelio",
};

export const INITIAL_PRODUCTS: DigitalProduct[] = [
  { id: "gem-adv-1m", title: "Google Gemini Advanced + 2TB", category: "AI", duration: "اشتراك شهر كامل - حساب خاص", imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80", deliveryType: "INSTANT_KEY", priceUSD: 12.99, wholesaleCostUSD: 6.5, gatewayFeePercent: 2.5, stockCount: 18, soldCount: 142, salesVelocityPerDay: 9.5, renewalRate: 88, badge: "الأكثر طلباً في AI", sampleKeys: ["GEM-9921-X88A-PRO", "GEM-4410-K92L-ULT", "GEM-7712-M01P-2026"] },
  { id: "nf-uhd-1m", title: "Netflix Premium 4K UHD", category: "STREAMING", duration: "ملف خاص مضمون - 30 يوم", imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=900&q=80", deliveryType: "SHARED_VAULT", priceUSD: 4.5, wholesaleCostUSD: 1.8, gatewayFeePercent: 2.0, stockCount: 64, soldCount: 310, salesVelocityPerDay: 22.0, renewalRate: 92, badge: "تسليم فوري تلقائي", sampleKeys: ["user: vip_nf26@revelio.dz | pass: Nf#99281 | PIN: 4099", "user: ultra_nf@revelio.dz | pass: Pass#2026 | PIN: 1122"] },
  { id: "val-vp-4750", title: "Valorant 4750 VP (EU/MENA)", category: "GAMING", duration: "كود تفعيل فوري داخل اللعبة", imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80", deliveryType: "INSTANT_KEY", priceUSD: 38.0, wholesaleCostUSD: 31.2, gatewayFeePercent: 2.5, stockCount: 5, soldCount: 89, salesVelocityPerDay: 4.2, renewalRate: 65, badge: "وشيك على النفاد", sampleKeys: ["RA-VAL-8827-9910-MNA", "RA-VAL-1102-3849-EUW"] },
  { id: "sp-ind-3m", title: "Spotify Premium Individual", category: "STREAMING", duration: "3 أشهر - ترقية حسابك الشخصي", imageUrl: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=900&q=80", deliveryType: "DIRECT_TOPUP", priceUSD: 8.99, wholesaleCostUSD: 4.1, gatewayFeePercent: 2.0, stockCount: 42, soldCount: 175, salesVelocityPerDay: 11.4, renewalRate: 84, badge: "ضمان ذهبي", sampleKeys: ["SPOT-3M-UPGRADE-77261-DZ", "SPOT-3M-UPGRADE-99104-DZ"] },
];

export const INITIAL_ORDERS: OrderRecord[] = [
  { orderId: "ORD-948210", customerName: "ياسين بن علي", customerContact: "@yacine_dz", channel: "TELEGRAM_BOT", productTitle: "Google Gemini Advanced + 2TB", category: "AI", priceUSD: 12.99, netProfitUSD: 6.17, deliveredKey: "GEM-8821-OLD9-PRO", timestamp: "منذ 4 دقائق", status: "COMPLETED" },
  { orderId: "ORD-948195", customerName: "أمين قسنطينة", customerContact: "+213 558 12 34 56", channel: "WHATSAPP", productTitle: "Netflix Premium 4K UHD", category: "STREAMING", priceUSD: 4.5, netProfitUSD: 2.61, deliveredKey: "user: cine4k@revelio.dz | PIN: 8821", timestamp: "منذ 19 دقيقة", status: "PENDING_VERIFICATION" },
];

export const INITIAL_TICKETS: SupportTicket[] = [
  { id: "TCK-104", customerName: "كريم دزيري", contact: "@karim_pro", orderId: "ORD-948195", subject: "استفسار حول تجديد اشتراك Netflix", message: "السلام عليكم، أريد تجديد نفس الملف الخاص بي لـ 3 أشهر إضافية، هل يمكنني الدفع عبر بريدي موب؟", status: "OPEN", createdAt: "منذ 12 دقيقة" },
  { id: "TCK-101", customerName: "مريم سكيكدة", contact: "+213 661 99 88 77", orderId: "ORD-947002", subject: "تفعيل كود Gemini Advanced", message: "شكراً لكم، تم التفعيل بنجاح في أقل من دقيقة!", adminReply: "مرحباً بك مريم، سعداء بخدمتك دائماً في Revelio Digital!", status: "RESOLVED", createdAt: "منذ ساعتين" },
];

export const INITIAL_TELEMETRY = [
  { time: "00:00", grossRevenue: 420, netProfit: 195, orders: 28 },
  { time: "04:00", grossRevenue: 310, netProfit: 142, orders: 19 },
  { time: "08:00", grossRevenue: 680, netProfit: 325, orders: 47 },
  { time: "12:00", grossRevenue: 1250, netProfit: 610, orders: 89 },
  { time: "16:00", grossRevenue: 1590, netProfit: 785, orders: 114 },
  { time: "20:00", grossRevenue: 2140, netProfit: 1090, orders: 156 },
  { time: "الآن", grossRevenue: 2490, netProfit: 1280, orders: 184 },
];

let seqCounter = 948300;
export function createUniqueId(prefix: string): string {
  seqCounter += 7;
  const timePart = typeof window !== "undefined" ? window.performance.now().toFixed(0) : "26";
  return `${prefix}-${seqCounter}${timePart.slice(-2)}`;
}

export function calculateUnitEconomics(product: DigitalProduct) {
  const gatewayFee = (product.priceUSD * product.gatewayFeePercent) / 100;
  const netProfitPerUnit = product.priceUSD - product.wholesaleCostUSD - gatewayFee;
  const profitMarginPercent = product.priceUSD > 0 ? (netProfitPerUnit / product.priceUSD) * 100 : 0;
  const hoursUntilStockout = product.stockCount > 0 && product.salesVelocityPerDay > 0 ? Math.round((product.stockCount / product.salesVelocityPerDay) * 24) : 0;
  const totalProductNetProfit = netProfitPerUnit * product.soldCount;

  return {
    gatewayFee: Number(gatewayFee.toFixed(2)),
    netProfit: Number(netProfitPerUnit.toFixed(2)),
    totalProductNetProfit: Number(totalProductNetProfit.toFixed(2)),
    profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
    hoursUntilStockout,
  };
}

export function useRevelioStore() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<DigitalProduct[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: configData, error: configError } = await supabase.from('site_config').select('*').single();
        if (!configError && configData) {
            setSiteConfig({
                ...INITIAL_SITE_CONFIG,
                storeName: configData.store_name,
                storeTagline: configData.store_tagline,
                heroTitleHighlight: configData.hero_title_highlight,
                heroSubtitle: configData.hero_subtitle,
                announcementText: configData.announcement_text,
                showAnnouncement: configData.show_announcement,
                dzdRate: configData.dzd_rate,
                eurRate: configData.eur_rate,
                masterPin: configData.master_pin,
                whatsappNumber: configData.whatsapp_number,
                telegramUsername: configData.telegram_username,
                telegramBotToken: configData.telegram_bot_token,
                telegramChatId: configData.telegram_chat_id,
                instagramUrl: configData.instagram_url,
                tiktokUrl: configData.tiktok_url,
                discordUrl: configData.discord_url,
            });
        }

        const { data: catData, error: catError } = await supabase.from('categories').select('*');
        if (!catError && catData && catData.length > 0) {
            setCategories(catData.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })));
        }

        const { data: prodData, error: prodError } = await supabase.from('products').select('*');
        if (!prodError && prodData && prodData.length > 0) {
            setProducts(prodData.map((p: any) => ({
                id: p.id,
                title: p.title,
                category: p.category,
                duration: p.duration,
                imageUrl: p.image_url,
                deliveryType: p.delivery_type as any,
                priceUSD: p.price_usd,
                wholesaleCostUSD: p.wholesale_cost_usd,
                gatewayFeePercent: p.gateway_fee_percent,
                stockCount: p.stock_count,
                soldCount: p.sold_count,
                salesVelocityPerDay: p.sales_velocity_per_day,
                renewalRate: p.renewal_rate,
                badge: p.badge,
                sampleKeys: p.sample_keys || [],
            })));
        }

        const { data: orderData, error: orderError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!orderError && orderData && orderData.length > 0) {
            setOrders(orderData.map((o: any) => ({
                orderId: o.order_id,
                customerName: o.customer_name,
                customerContact: o.customer_contact,
                channel: o.channel as any,
                productTitle: o.product_title,
                category: o.category,
                priceUSD: o.price_usd,
                netProfitUSD: o.net_profit_usd,
                deliveredKey: o.delivered_key,
                status: o.status as any,
                timestamp: new Date(o.created_at).toLocaleString(),
            })));
        }

        const { data: ticketData, error: ticketError } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
        if (!ticketError && ticketData && ticketData.length > 0) {
            setTickets(ticketData.map((t: any) => ({
                id: t.id,
                customerName: t.customer_name,
                contact: t.contact,
                orderId: t.order_id,
                subject: t.subject,
                message: t.message,
                adminReply: t.admin_reply,
                status: t.status as any,
                createdAt: new Date(t.created_at).toLocaleString(),
            })));
        }
      } catch (error) {
        console.error("Supabase Error:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, []);

  // دوال الحفظ في قاعدة البيانات
  const saveSiteConfigToSupabase = async (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    const { error } = await supabase.from('site_config').upsert({
      id: 1,
      store_name: newConfig.storeName,
      store_tagline: newConfig.storeTagline,
      hero_title_highlight: newConfig.heroTitleHighlight,
      hero_subtitle: newConfig.heroSubtitle,
      announcement_text: newConfig.announcementText,
      show_announcement: newConfig.showAnnouncement,
      dzd_rate: newConfig.dzdRate,
      eur_rate: newConfig.eurRate,
      master_pin: newConfig.masterPin,
      whatsapp_number: newConfig.whatsappNumber,
      telegram_username: newConfig.telegramUsername,
      telegram_bot_token: newConfig.telegramBotToken,
      telegram_chat_id: newConfig.telegramChatId,
      instagram_url: newConfig.instagramUrl,
      tiktok_url: newConfig.tiktokUrl,
      discord_url: newConfig.discordUrl,
    });
    if (error) console.error("Error saving site config:", error);
  };

  const saveProductToSupabase = async (product: DigitalProduct) => {
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      title: product.title,
      category: product.category,
      duration: product.duration,
      image_url: product.imageUrl,
      delivery_type: product.deliveryType,
      price_usd: product.priceUSD,
      wholesale_cost_usd: product.wholesaleCostUSD,
      gateway_fee_percent: product.gatewayFeePercent,
      stock_count: product.stockCount,
      sold_count: product.soldCount,
      sales_velocity_per_day: product.salesVelocityPerDay,
      renewal_rate: product.renewalRate,
      badge: product.badge,
      sample_keys: product.sampleKeys,
    });
    if (error) console.error("Error saving product:", error);
  };

  const saveOrderToSupabase = async (order: OrderRecord) => {
      const { error } = await supabase.from('orders').insert({
          order_id: order.orderId,
          customer_name: order.customerName,
          customer_contact: order.customerContact,
          channel: order.channel,
          product_title: order.productTitle,
          category: order.category,
          price_usd: order.priceUSD,
          net_profit_usd: order.netProfitUSD,
          delivered_key: order.deliveredKey,
          status: order.status,
      });
      if(error) console.error("Error saving order:", error);
  }

  return {
    siteConfig,
    setSiteConfig: saveSiteConfigToSupabase,
    categories,
    setCategories,
    products,
    setProducts,
    saveProductToSupabase,
    orders,
    setOrders,
    saveOrderToSupabase,
    tickets,
    setTickets,
    telemetry,
    setTelemetry,
    isLoaded,
  };
}