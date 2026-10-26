"use client";

import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type Currency = "DZD" | "USD" | "EUR";
export type CurrencyCode = Currency;
export type DeliveryMode = "manual" | "auto" | "INSTANT_WEB";
export type SocialPlatform = "WhatsApp" | "Instagram" | "Telegram";
export type ActivationMethod = "KEY" | "EMAIL_INVITE" | "ACCOUNT";

export type ProductTemplateStyle =
  | "cyber_cyan"
  | "emerald_ai"
  | "crimson_stream"
  | "violet_gaming"
  | "gold_vip";

export type AdminPermission =
  | "orders"
  | "products"
  | "customers"
  | "posts"
  | "promos"
  | "vault"
  | "analytics"
  | "settings"
  | "staff";

export interface VisualEffectsConfig {
  liveCanvas3D: boolean;
  kineticMarquee: boolean;
  tilt3DCards: boolean;
  laserBeams: boolean;
  hudOverlay: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  roleTitle: string;
  pinCode: string;
  permissions: AdminPermission[];
  active: boolean;
  createdAt: string;
}

export interface AuthenticatedAdminUser {
  id: string;
  name: string;
  role: "CEO" | "STAFF";
  roleTitle: string;
  permissions: AdminPermission[];
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  labelAr: string;
  accountValue: string;
  accountHolder: string;
  networkOrNote: string;
  enabled: boolean;
}

export interface PromoCodeItem {
  id: string;
  code: string;
  discountPercent: number;
  active: boolean;
  usageCount: number;
}

export interface DigitalProduct {
  id: string;
  title: string;
  name: string;
  category: string;
  duration: string;
  durationDays?: number;
  priceUsd: number;
  priceDzd: number;
  priceEur: number;
  costUsd: number;
  oldPriceDzd?: number;
  stockCount: number;
  stock: number;
  deliveryType: "manual" | "auto";
  activationMethod: ActivationMethod;
  templateStyle?: ProductTemplateStyle;
  fulfillmentMode?: "MANUAL_VERIFY" | "INSTANT_WEB";
  badge?: string;
  warranty: string;
  shortDesc: string;
  description: string;
  details: string;
  features: string[];
  sampleKeys: string[];
  secretCode?: string;
  imageUrl?: string;
  imageFitMode?: "cover" | "contain";
  accentColor?: string;
  dailySalesVelocity?: number;
  renewalRate?: number;
  gatewayFeePercent?: number;
}

export type Product = DigitalProduct;

export interface CartItem {
  product: DigitalProduct;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productTitle: string;
  totalPrice: string;
  amountUsd: number;
  amountDzd: number;
  customerName: string;
  customerContact: string;
  customerEmail?: string;
  channel: SocialPlatform;
  socialPlatform: SocialPlatform;
  paymentMethod: string;
  status: "PENDING" | "COMPLETED" | "REJECTED" | "pending" | "completed" | "rejected";
  deliveryType: "manual" | "auto";
  activationMethod?: ActivationMethod;
  deliveredCode?: string;
  notes?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface StorePost {
  id: string;
  title: string;
  content: string;
  badge: string;
  date: string;
  active: boolean;
}

export interface SiteConfig {
  storeName: string;
  AnnouncementText: string;
  promoCode: string;
  promoDiscountPercent: number;
  dzdRate: number;
  eurRate: number;
  globalDeliveryMode: "manual" | "auto";
  ccpAccount: string;
  baridiMobRip: string;
  usdtAddress: string;
  usdtNetwork: string;
  redotpayId: string;
  paymentMethods: PaymentMethodConfig[];
  whatsappSupport: string;
  instagramPage: string;
  facebookPage: string;
  tiktokPage: string;
  telegramBotUsername: string;
  telegramChannel: string;
  telegramBotToken: string;
  telegramAdminChatId: string;
  enableLocalBotPolling: boolean;
  aiProviderMode: "bytez" | "openrouter" | "zerokey" | "smart_rules";
  bytezApiKey: string;
  bytezModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  visualFx: VisualEffectsConfig;
  adminPin: string;
  masterPin: string;
}

export interface UnitEconomicsResult {
  grossRevenueUsd: number;
  grossRevenueDzd: number;
  gatewayFeeUsd: number;
  netProfitUsd: number;
  netProfitDzd: number;
  marginPercent: number;
  roiPercent: number;
  hoursUntilStockout: number;
  expectedLtvUsd: number;
}

export function createUniqueId(prefix = "ORD"): string {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  const timePart = Date.now().toString().slice(-3);
  return `${prefix}-${randomPart}${timePart}`;
}

export function calculateUnitEconomics(
  product: Partial<DigitalProduct>,
  dzdRate = 245
): UnitEconomicsResult {
  const priceUsd = Number(product.priceUsd ?? 4);
  const costUsd = Number(product.costUsd ?? priceUsd * 0.55);
  const feePercent = Number(product.gatewayFeePercent ?? 2.5);
  const gatewayFeeUsd = Number(((priceUsd * feePercent) / 100).toFixed(2));
  const netProfitUsd = Number((priceUsd - costUsd - gatewayFeeUsd).toFixed(2));
  const netProfitDzd = Math.round(netProfitUsd * dzdRate);
  const grossRevenueDzd = Number(product.priceDzd ?? Math.round(priceUsd * dzdRate));

  const marginPercent =
    priceUsd > 0 ? Number(((netProfitUsd / priceUsd) * 100).toFixed(1)) : 0;
  const roiPercent =
    costUsd > 0 ? Number(((netProfitUsd / costUsd) * 100).toFixed(1)) : 0;

  const velocity = Number(product.dailySalesVelocity ?? 3.5);
  const stock = Number(product.stockCount ?? product.stock ?? 12);
  const hoursUntilStockout =
    velocity > 0 ? Math.max(1, Math.round((stock / velocity) * 24)) : 999;

  const renewalRate = Number(product.renewalRate ?? 0.68);
  const expectedMonths = 1 / Math.max(0.1, 1 - renewalRate);
  const expectedLtvUsd = Number((netProfitUsd * expectedMonths).toFixed(2));

  return {
    grossRevenueUsd: priceUsd,
    grossRevenueDzd,
    gatewayFeeUsd,
    netProfitUsd,
    netProfitDzd,
    marginPercent,
    roiPercent,
    hoursUntilStockout,
    expectedLtvUsd,
  };
}

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "pm-baridimob",
    name: "BaridiMob",
    labelAr: "BaridiMob (بريدي موب)",
    accountValue: "00799999002458963142",
    accountHolder: "REVELIO DIGITAL",
    networkOrNote: "تحويل فوري عبر تطبيق بريدي موب",
    enabled: true,
  },
  {
    id: "pm-ccp",
    name: "CCP",
    labelAr: "CCP (بريد الجزائر)",
    accountValue: "0024589631 المفتاح 42",
    accountHolder: "REVELIO DIGITAL",
    networkOrNote: "الدفع عبر مكاتب البريد أو CCP",
    enabled: true,
  },
  {
    id: "pm-usdt",
    name: "USDT",
    labelAr: "USDT (العملات الرقمية / Binance)",
    accountValue: "TX8k9R...ضع_عنوان_محفظتك_هنا",
    accountHolder: "REVELIO CRYPTO VAULT",
    networkOrNote: "الشبكة: TRC20 أو Binance Pay ID",
    enabled: true,
  },
  {
    id: "pm-redotpay",
    name: "RedotPay",
    labelAr: "RedotPay ID",
    accountValue: "148920315",
    accountHolder: "REVELIO DIGITAL",
    networkOrNote: "تحويل داخلي مجاني عبر RedotPay UID",
    enabled: true,
  },
];

export const INITIAL_PROMO_CODES: PromoCodeItem[] = [
  {
    id: "promo-1",
    code: "REV10",
    discountPercent: 10,
    active: true,
    usageCount: 14,
  },
  {
    id: "promo-2",
    code: "VIP20",
    discountPercent: 20,
    active: true,
    usageCount: 3,
  },
];

export const CEO_MASTER_CODE = "MINOU2018";

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "أمين (مسؤول التفعيل)",
    roleTitle: "مسؤول الطلبات والتفعيل",
    pinCode: "STAFF01",
    permissions: ["orders", "customers", "products"],
    active: true,
    createdAt: "2026-10-26",
  },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  storeName: "REVELIO DIGITAL",
  AnnouncementText:
    "⚡ استعمل كود الخصم REV10 للحصول على تخفيض 10% إضافي على سلة مشترياتك!",
  promoCode: "REV10",
  promoDiscountPercent: 10,
  dzdRate: 245,
  eurRate: 0.92,
  globalDeliveryMode: "manual",
  ccpAccount: "0024589631 المفتاح 42 — باسم: REVELIO DIGITAL",
  baridiMobRip: "00799999002458963142",
  usdtAddress: "TX8k9R... (TRC20 / Binance Pay)",
  usdtNetwork: "TRC20 / Binance Pay",
  redotpayId: "148920315",
  paymentMethods: INITIAL_PAYMENT_METHODS,
  whatsappSupport: "213550000000",
  instagramPage: "revelio.digital",
  facebookPage: "revelio.digital.dz",
  tiktokPage: "@revelio.digital",
  telegramBotUsername: "REVELIO_ASSISTANT_BOT",
  telegramChannel: "revelio_digital_channel",
  telegramBotToken: "",
  telegramAdminChatId: "1399306871",
  enableLocalBotPolling: true,
  aiProviderMode: "bytez",
  bytezApiKey: "",
  bytezModel: "Qwen/Qwen2.5-7B-Instruct",
  openrouterApiKey: "",
  openrouterModel: "openrouter/free",
  visualFx: {
    liveCanvas3D: true,
    kineticMarquee: true,
    tilt3DCards: true,
    laserBeams: true,
    hudOverlay: true,
  },
  adminPin: CEO_MASTER_CODE,
  masterPin: CEO_MASTER_CODE,
};

export const INITIAL_PRODUCTS: DigitalProduct[] = [
  {
    id: "prod-gemini-adv",
    title: "Google Gemini Advanced + 2TB",
    name: "Google Gemini Advanced + 2TB",
    category: "AI",
    duration: "شهر كامل (قابل للتجديد)",
    durationDays: 30,
    priceUsd: 4,
    priceDzd: 950,
    priceEur: 3.8,
    costUsd: 2.1,
    oldPriceDzd: 2400,
    stockCount: 18,
    stock: 18,
    deliveryType: "manual",
    activationMethod: "EMAIL_INVITE",
    templateStyle: "cyber_cyan",
    fulfillmentMode: "MANUAL_VERIFY",
    badge: "الأكثر مبيعاً 🔥",
    warranty: "ضمان ذهبي 30 يوماً",
    shortDesc:
      "تفعيل رسمي بدعوة على إيميلك الشخصي مع مساحة 2 تيرابايت Google One ونموذج Gemini 2.5 Pro.",
    description:
      "تفعيل رسمي بدعوة على إيميلك الشخصي مع مساحة 2 تيرابايت Google One ونموذج Gemini 2.5 Pro.",
    details:
      "احصل على أقوى نماذج الذكاء الاصطناعي من جوجل مع مساحة تخزين سحابية 2TB على Google Drive و Google Photos، يتم التفعيل عبر إرسال دعوة رسمية مباشرة إلى بريدك الشخصي Gmail.",
    features: [
      "تفعيل رسمي 100% بدعوة على إيميلك الشخصي دون الحاجة لكلمة السر",
      "مساحة 2TB سحابية + Gemini Advanced",
      "ضمان كامل طوال فترة الاشتراك",
    ],
    sampleKeys: [],
    accentColor: "#00eeff",
    dailySalesVelocity: 4.5,
    renewalRate: 0.78,
  },
  {
    id: "prod-chatgpt-plus",
    title: "ChatGPT Plus — باقة المحترفين",
    name: "ChatGPT Plus — باقة المحترفين",
    category: "AI",
    duration: "شهر كامل",
    durationDays: 30,
    priceUsd: 6,
    priceDzd: 1450,
    priceEur: 5.5,
    costUsd: 3.4,
    oldPriceDzd: 3200,
    stockCount: 12,
    stock: 12,
    deliveryType: "manual",
    activationMethod: "ACCOUNT",
    templateStyle: "emerald_ai",
    fulfillmentMode: "MANUAL_VERIFY",
    badge: "ذكاء اصطناعي ⚡",
    warranty: "ضمان ذهبي طوال المدة",
    shortDesc:
      "وصول كامل لأحدث نماذج OpenAI وتوليد الصور وتحليل الملفات البرمجية.",
    description:
      "وصول كامل لأحدث نماذج OpenAI وتوليد الصور وتحليل الملفات البرمجية.",
    details:
      "اشتراك ChatGPT Plus يمنحك سرعة فائقة في الاستجابة، أولوية الوصول وقت الذروة، وإنشاء الصور وتحليل البيانات المعقدة.",
    features: [
      "دعم كامل لتحليل الملفات والصور والبرمجة",
      "ثبات عالٍ وضمان استبدال فوري",
      "دعم فني متواصل عبر واتساب وتيليجرام",
    ],
    sampleKeys: [],
    accentColor: "#10b981",
    dailySalesVelocity: 3.8,
    renewalRate: 0.82,
  },
  {
    id: "prod-netflix-4k",
    title: "Netflix Premium 4K UHD",
    name: "Netflix Premium 4K UHD",
    category: "Streaming",
    duration: "شهر كامل",
    durationDays: 30,
    priceUsd: 2.8,
    priceDzd: 650,
    priceEur: 2.6,
    costUsd: 1.4,
    oldPriceDzd: 1200,
    stockCount: 25,
    stock: 25,
    deliveryType: "manual",
    activationMethod: "ACCOUNT",
    templateStyle: "crimson_stream",
    fulfillmentMode: "MANUAL_VERIFY",
    badge: "بث ترفيهي 🎬",
    warranty: "ضمان 30 يوماً",
    shortDesc:
      "حساب بروفايل خاص مقفل برمز سري (PIN) بأعلى جودة 4K Ultra HD يدعم جميع الأجهزة.",
    description:
      "حساب بروفايل خاص مقفل برمز سري (PIN) بأعلى جودة 4K Ultra HD يدعم جميع الأجهزة.",
    details:
      "استمتع بمشاهدة أحدث الأفلام والمسلسلات بجودة 4K الحقيقية بدون تقطيع، مع ملف شخصي مقفل برمز خاص بك وحدك.",
    features: [
      "جودة 4K UHD + HDR",
      "بروفايل خاص مقفل بـ PIN",
      "يعمل على التلفاز، الهاتف، والحاسوب",
    ],
    sampleKeys: [],
    accentColor: "#f43f5e",
    dailySalesVelocity: 6.2,
    renewalRate: 0.74,
  },
  {
    id: "prod-spotify-ind",
    title: "Spotify Premium Individual",
    name: "Spotify Premium Individual",
    category: "Streaming",
    duration: "شهر كامل",
    durationDays: 30,
    priceUsd: 2.5,
    priceDzd: 550,
    priceEur: 2.3,
    costUsd: 1.2,
    oldPriceDzd: 950,
    stockCount: 30,
    stock: 30,
    deliveryType: "manual",
    activationMethod: "EMAIL_INVITE",
    templateStyle: "emerald_ai",
    fulfillmentMode: "MANUAL_VERIFY",
    badge: "موسيقى بلا إعلانات 🎧",
    warranty: "ضمان شامل",
    shortDesc:
      "تفعيل بدعوة على إيميل حسابك الشخصي مع تحميل الأغاني والاستماع بدون إنترنت.",
    description:
      "تفعيل بدعوة على إيميل حسابك الشخصي مع تحميل الأغاني والاستماع بدون إنترنت.",
    details:
      "تفعيل رسمي يحول حسابك المجاني إلى Premium مع الحفاظ على جميع قوائم التشغيل المفضلة لديك بجودة صوت فائقة.",
    features: [
      "بدون إعلانات نهائياً + تخطي غير محدود",
      "تحميل للاستماع بدون إنترنت",
      "تفعيل آمن بدعوة على إيميلك",
    ],
    sampleKeys: [],
    accentColor: "#22c55e",
    dailySalesVelocity: 4.1,
    renewalRate: 0.79,
  },
  {
    id: "prod-gamepass-ult",
    title: "Xbox Game Pass Ultimate",
    name: "Xbox Game Pass Ultimate",
    category: "Gaming",
    duration: "شهر كامل",
    durationDays: 30,
    priceUsd: 7.5,
    priceDzd: 1850,
    priceEur: 7,
    costUsd: 4.8,
    oldPriceDzd: 2900,
    stockCount: 9,
    stock: 9,
    deliveryType: "manual",
    activationMethod: "KEY",
    templateStyle: "violet_gaming",
    fulfillmentMode: "MANUAL_VERIFY",
    badge: "كود رقمي 🎮",
    warranty: "ضمان التفعيل",
    shortDesc:
      "كود رقمي لتفعيل أكثر من 400 لعبة أصلية على PC و Xbox مع خدمة EA Play.",
    description:
      "كود رقمي لتفعيل أكثر من 400 لعبة أصلية على PC و Xbox مع خدمة EA Play.",
    details:
      "كود رقمي رسمي لتفعيل Game Pass Ultimate يمنحك مكتبة ضخمة من أحدث الألعاب من اليوم الأول لإصدارها.",
    features: [
      "يعمل على PC و Console",
      "يشمل EA Play + اللعب السحابي",
      "تفعيل مضمون 100%",
    ],
    sampleKeys: [],
    accentColor: "#8b5cf6",
    dailySalesVelocity: 2.9,
    renewalRate: 0.65,
  },
  {
    id: "prod-canva-pro",
    title: "Canva Pro — اشتراك المصممين",
    name: "Canva Pro — اشتراك المصممين",
    category: "Software",
    duration: "سنة كاملة",
    durationDays: 365,
    priceUsd: 2.2,
    priceDzd: 500,
    priceEur: 2,
    costUsd: 0.9,
    oldPriceDzd: 1100,
    stockCount: 40,
    stock: 40,
    deliveryType: "manual",
    activationMethod: "EMAIL_INVITE",
    templateStyle: "gold_vip",
    fulfillmentMode: "MANUAL_VERIFY",
    badge: "دعوة رسمية 🎨",
    warranty: "ضمان ذهبي",
    shortDesc:
      "تفعيل رسمي بدعوة على إيميلك الشخصي يفتح جميع القوالب والخطوط وأدوات الذكاء الاصطناعي.",
    description:
      "تفعيل رسمي بدعوة على إيميلك الشخصي يفتح جميع القوالب والخطوط وأدوات الذكاء الاصطناعي.",
    details:
      "انضم لفريق المصممين المحترفين بدعوة رسمية على إيميلك مع وصول غير محدود لملايين الصور والقوالب الاحترافية وإزالة الخلفية بضغطة زر.",
    features: [
      "تفعيل بدعوة رسمية على إيميلك الشخصي",
      "جميع أدوات Magic Studio مفتوحة",
      "خصوصية تامة لتصاميمك",
    ],
    sampleKeys: [],
    accentColor: "#f59e0b",
    dailySalesVelocity: 5.0,
    renewalRate: 0.7,
  },
];

export const INITIAL_POSTS: StorePost[] = [
  {
    id: "post-1",
    title: "🔥 عرض خاص: Google Gemini Advanced + 2TB بأفضل سعر في الجزائر",
    content:
      "متوفر الآن تفعيل رسمي بدعوة مباشرة على إيميلك الشخصي مع ضمان ذهبي شامل. اطلب الآن وسنرسل لك التفعيل فور مراجعة الدفع!",
    badge: "عرض الأسبوع",
    date: "2026-10-26",
    active: true,
  },
  {
    id: "post-2",
    title: "💳 نقبل الدفع عبر BaridiMob و CCP و USDT (TRC20 / Binance)",
    content:
      "يمكنك الآن اختيار وسيلة الدفع الأنسب لك في سلة المشتريات واستلام اشتراكك (سواء كان كوداً، دعوة إيميل، أو حساباً جاهزاً) عبر واتساب أو إنستغرام أو تيليجرام.",
    badge: "تحديث الدفع",
    date: "2026-10-26",
    active: true,
  },
];

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: "ORD-884920",
    orderId: "ORD-884920",
    productId: "prod-gemini-adv",
    productName: "Google Gemini Advanced + 2TB",
    productTitle: "Google Gemini Advanced + 2TB",
    totalPrice: "950 د.ج",
    amountUsd: 4,
    amountDzd: 950,
    customerName: "ياسين بن علي",
    customerContact: "0550123456",
    customerEmail: "yacine.dz@gmail.com",
    channel: "WhatsApp",
    socialPlatform: "WhatsApp",
    paymentMethod: "BaridiMob",
    status: "COMPLETED",
    deliveryType: "manual",
    activationMethod: "EMAIL_INVITE",
    deliveredCode: "تم إرسال دعوة التفعيل الرسمي إلى yacine.dz@gmail.com + ضمان 30 يوماً",
    createdAt: "2026-10-26",
    expiresAt: "2026-11-25",
  },
];

/**
 * الحفظ السحابي المضمون 100% داخل جدول site_config (الصف id = 1)
 * بالأعمدة الحقيقية: id, store_name, store_tagline, hero_title_highlight, hero_subtitle
 */
async function syncFullStateToSiteConfig(state: {
  config: SiteConfig;
  products: DigitalProduct[];
  posts: StorePost[];
  promoCodes: PromoCodeItem[];
  orders?: OrderRecord[];
  staff?: StaffMember[];
}): Promise<{ ok: boolean; message: string }> {
  const payloadObj = {
    config: state.config,
    products: state.products,
    posts: state.posts,
    promoCodes: state.promoCodes,
    orders: state.orders || [],
    staff: state.staff || [],
    updatedAt: new Date().toISOString(),
  };

  const payloadJson = JSON.stringify(payloadObj);

  // 1. إرسال نسخة إلى مسار الخادم لتحديث البوت والـ AI فوراً
  try {
    fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        action: "sync-cloud-state",
        cloudState: payloadObj,
      }),
    }).catch(() => {});
  } catch {}

  // 2. الحفظ المباشر في جدول site_config (صف رقم 1) الذي يمتلك سياسة RLS مفعلة
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from("site_config").upsert(
        [
          {
            id: 1,
            store_name: state.config.storeName || "REVELIO DIGITAL",
            store_tagline: new Date().toISOString(),
            hero_title_highlight: "REVELIO_CLOUD_V6",
            hero_subtitle: payloadJson,
          },
        ],
        { onConflict: "id" }
      );

      if (!error) {
        return {
          ok: true,
          message:
            "✅ تم الحفظ في سحابة Supabase (جدول site_config صف رقم 1) بنجاح! سيظهر على الهاتف ولجميع الزوار فوراً.",
        };
      }
      return {
        ok: false,
        message: `⚠️ خطأ من Supabase: ${error.message}`,
      };
    } catch (err: unknown) {
      return {
        ok: false,
        message: `⚠️ تعذر الاتصال بـ Supabase: ${
          err instanceof Error ? err.message : "Network error"
        }`,
      };
    }
  }

  return {
    ok: false,
    message:
      "⚠️ تنبيه: مفتاح NEXT_PUBLIC_SUPABASE_ANON_KEY غير مضاف في src/lib/supabase.ts؛ تم الحفظ محلياً فقط.",
  };
}

export async function saveOrderToSupabase(order: OrderRecord): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from("orders").upsert(
      [
        {
          order_id: order.orderId || order.id,
          customer_name: order.customerName,
          customer_contact: order.customerEmail
            ? `${order.customerContact} | Email: ${order.customerEmail} | ${order.productName} | ${order.totalPrice}`
            : `${order.customerContact} | ${order.productName} | ${order.totalPrice}`,
          channel: order.socialPlatform || order.channel,
        },
      ],
      { onConflict: "order_id" }
    );
    return !error;
  } catch {
    return false;
  }
}

interface RevelioStoreState {
  config: SiteConfig;
  siteConfig: SiteConfig;
  products: DigitalProduct[];
  posts: StorePost[];
  orders: OrderRecord[];
  staff: StaffMember[];
  promoCodes: PromoCodeItem[];
  currentAdmin: AuthenticatedAdminUser | null;
  cart: CartItem[];
  currency: Currency;
  isHydrated: boolean;
  lastCloudSyncAt: string;
  cloudSyncStatus: string;
  setConfig: (cfg: Partial<SiteConfig>) => Promise<void>;
  authenticateAdmin: (pinCode: string) => AuthenticatedAdminUser | null;
  logoutAdmin: () => void;
  addStaffMember: (member: StaffMember) => Promise<void>;
  updateStaffMember: (member: StaffMember) => Promise<void>;
  removeStaffMember: (id: string) => Promise<void>;
  addPromoCode: (promo: PromoCodeItem) => Promise<void>;
  togglePromoCode: (id: string) => Promise<void>;
  removePromoCode: (id: string) => Promise<void>;
  setProducts: (prods: DigitalProduct[]) => Promise<void>;
  upsertProduct: (prod: DigitalProduct) => Promise<{ ok: boolean; message: string }>;
  removeProduct: (id: string) => Promise<void>;
  setPosts: (posts: StorePost[]) => Promise<{ ok: boolean; message: string }>;
  setOrders: (orders: OrderRecord[]) => void;
  addOrder: (order: OrderRecord) => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: OrderRecord["status"],
    deliveredCode?: string
  ) => Promise<void>;
  setCurrency: (cur: Currency) => void;
  addToCart: (product: DigitalProduct, qty?: number) => void;
  updateCartQty: (productId: string, delta: number) => void;
  clearCart: () => void;
  hydrateFromCloud: () => Promise<void>;
}

const ALL_CEO_PERMISSIONS: AdminPermission[] = [
  "orders",
  "products",
  "customers",
  "posts",
  "promos",
  "vault",
  "analytics",
  "settings",
  "staff",
];

export const useRevelioStore = create<RevelioStoreState>((set, get) => ({
  config: DEFAULT_SITE_CONFIG,
  siteConfig: DEFAULT_SITE_CONFIG,
  products: INITIAL_PRODUCTS,
  posts: INITIAL_POSTS,
  orders: INITIAL_ORDERS,
  staff: INITIAL_STAFF,
  promoCodes: INITIAL_PROMO_CODES,
  currentAdmin: null,
  cart: [],
  currency: "DZD",
  isHydrated: false,
  lastCloudSyncAt: "",
  cloudSyncStatus: "",

  setConfig: async (partial) => {
    const updated: SiteConfig = {
      ...get().config,
      ...partial,
      adminPin: CEO_MASTER_CODE,
      masterPin: CEO_MASTER_CODE,
    };
    set({
      config: updated,
      siteConfig: updated,
      lastCloudSyncAt: new Date().toLocaleTimeString(),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_config", JSON.stringify(updated));
    }
    const res = await syncFullStateToSiteConfig({
      config: updated,
      products: get().products,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: get().staff,
    });
    set({ cloudSyncStatus: res.message });
  },

  authenticateAdmin: (pinCode) => {
    const cleanPin = pinCode.trim();
    if (!cleanPin) return null;

    if (cleanPin === CEO_MASTER_CODE) {
      const ceoUser: AuthenticatedAdminUser = {
        id: "ceo-master",
        name: "المدير التنفيذي (CEO)",
        role: "CEO",
        roleTitle: "Founder & CEO — صلاحية كاملة",
        permissions: ALL_CEO_PERMISSIONS,
      };
      set({ currentAdmin: ceoUser });
      return ceoUser;
    }

    const foundStaff = get().staff.find(
      (s) => s.active && s.pinCode.trim() === cleanPin
    );
    if (foundStaff) {
      const staffUser: AuthenticatedAdminUser = {
        id: foundStaff.id,
        name: foundStaff.name,
        role: "STAFF",
        roleTitle: foundStaff.roleTitle,
        permissions: foundStaff.permissions,
      };
      set({ currentAdmin: staffUser });
      return staffUser;
    }

    return null;
  },

  logoutAdmin: () => set({ currentAdmin: null }),

  addStaffMember: async (member) => {
    const updated = [member, ...get().staff];
    set({ staff: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_staff", JSON.stringify(updated));
    }
    const res = await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: updated,
    });
    set({ cloudSyncStatus: res.message });
  },

  updateStaffMember: async (member) => {
    const updated = get().staff.map((s) => (s.id === member.id ? member : s));
    set({ staff: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_staff", JSON.stringify(updated));
    }
    await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: updated,
    });
  },

  removeStaffMember: async (id) => {
    const updated = get().staff.filter((s) => s.id !== id);
    set({ staff: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_staff", JSON.stringify(updated));
    }
    await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: updated,
    });
  },

  addPromoCode: async (promo) => {
    const updated = [promo, ...get().promoCodes];
    set({ promoCodes: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_promos", JSON.stringify(updated));
    }
    const res = await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: updated,
      orders: get().orders,
      staff: get().staff,
    });
    set({ cloudSyncStatus: res.message });
  },

  togglePromoCode: async (id) => {
    const updated = get().promoCodes.map((p) =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    set({ promoCodes: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_promos", JSON.stringify(updated));
    }
    await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: updated,
      orders: get().orders,
      staff: get().staff,
    });
  },

  removePromoCode: async (id) => {
    const updated = get().promoCodes.filter((p) => p.id !== id);
    set({ promoCodes: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_promos", JSON.stringify(updated));
    }
    await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: updated,
      orders: get().orders,
      staff: get().staff,
    });
  },

  setProducts: async (prods) => {
    set({ products: prods });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_products", JSON.stringify(prods));
    }
    const res = await syncFullStateToSiteConfig({
      config: get().config,
      products: prods,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: get().staff,
    });
    set({ cloudSyncStatus: res.message });
  },

  upsertProduct: async (prod) => {
    const current = get().products;
    const exists = current.some((p) => p.id === prod.id);
    const updated = exists
      ? current.map((p) => (p.id === prod.id ? prod : p))
      : [prod, ...current];
    set({
      products: updated,
      lastCloudSyncAt: new Date().toLocaleTimeString(),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_products", JSON.stringify(updated));
    }
    const res = await syncFullStateToSiteConfig({
      config: get().config,
      products: updated,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: get().staff,
    });
    set({ cloudSyncStatus: res.message });
    return res;
  },

  removeProduct: async (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    set({
      products: updated,
      lastCloudSyncAt: new Date().toLocaleTimeString(),
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_products", JSON.stringify(updated));
    }
    const res = await syncFullStateToSiteConfig({
      config: get().config,
      products: updated,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: get().staff,
    });
    set({ cloudSyncStatus: res.message });
  },

  setPosts: async (posts) => {
    set({ posts, lastCloudSyncAt: new Date().toLocaleTimeString() });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_posts", JSON.stringify(posts));
    }
    const res = await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts,
      promoCodes: get().promoCodes,
      orders: get().orders,
      staff: get().staff,
    });
    set({ cloudSyncStatus: res.message });
    return res;
  },

  setOrders: (orders) => {
    set({ orders });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_orders", JSON.stringify(orders));
    }
  },

  addOrder: async (order) => {
    const updated = [order, ...get().orders];
    set({ orders: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_orders", JSON.stringify(updated));
    }
    await saveOrderToSupabase(order);
    await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: updated,
      staff: get().staff,
    });
  },

  updateOrderStatus: async (orderId, status, deliveredCode) => {
    const normalizedStatus = status.toUpperCase() as OrderRecord["status"];
    const updated = get().orders.map((o) =>
      o.id === orderId || o.orderId === orderId
        ? {
            ...o,
            status: normalizedStatus,
            ...(deliveredCode ? { deliveredCode } : {}),
          }
        : o
    );
    set({ orders: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_orders", JSON.stringify(updated));
    }
    const res = await syncFullStateToSiteConfig({
      config: get().config,
      products: get().products,
      posts: get().posts,
      promoCodes: get().promoCodes,
      orders: updated,
      staff: get().staff,
    });
    set({ cloudSyncStatus: res.message });
  },

  setCurrency: (currency) => set({ currency }),

  addToCart: (product, qty = 1) => {
    const current = get().cart;
    const existing = current.find((i) => i.product.id === product.id);
    const updated = existing
      ? current.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        )
      : [...current, { product, quantity: qty }];
    set({ cart: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_cart", JSON.stringify(updated));
    }
  },

  updateCartQty: (productId, delta) => {
    const updated = get()
      .cart.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(0, i.quantity + delta) }
          : i
      )
      .filter((i) => i.quantity > 0);
    set({ cart: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_cart", JSON.stringify(updated));
    }
  },

  clearCart: () => {
    set({ cart: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem("revelio_cart");
    }
  },

  hydrateFromCloud: async () => {
    if (typeof window !== "undefined") {
      try {
        const localCart = localStorage.getItem("revelio_cart");
        if (localCart) set({ cart: JSON.parse(localCart) });
      } catch {}
    }

    let cloudLoaded = false;

    // 1. القراءة المباشرة من جدول site_config (الصف id = 1)
    if (isSupabaseConfigured) {
      try {
        const { data: cfgRow } = await supabase
          .from("site_config")
          .select("hero_subtitle")
          .eq("id", 1)
          .maybeSingle();

        if (
          cfgRow &&
          typeof (cfgRow as Record<string, unknown>).hero_subtitle === "string"
        ) {
          const rawJson = String(
            (cfgRow as Record<string, unknown>).hero_subtitle
          );
          if (rawJson.startsWith("{")) {
            const parsed = JSON.parse(rawJson) as {
              config?: Partial<SiteConfig>;
              products?: DigitalProduct[];
              posts?: StorePost[];
              promoCodes?: PromoCodeItem[];
              orders?: OrderRecord[];
              staff?: StaffMember[];
            };

            if (Array.isArray(parsed.products) && parsed.products.length > 0) {
              set({ products: parsed.products });
            }
            if (Array.isArray(parsed.posts) && parsed.posts.length > 0) {
              set({ posts: parsed.posts });
            }
            if (
              Array.isArray(parsed.promoCodes) &&
              parsed.promoCodes.length > 0
            ) {
              set({ promoCodes: parsed.promoCodes });
            }
            if (Array.isArray(parsed.orders) && parsed.orders.length > 0) {
              set({ orders: parsed.orders });
            }
            if (Array.isArray(parsed.staff) && parsed.staff.length > 0) {
              set({ staff: parsed.staff });
            }
            if (parsed.config) {
              const mergedConfig: SiteConfig = {
                ...get().config,
                ...parsed.config,
                adminPin: CEO_MASTER_CODE,
                masterPin: CEO_MASTER_CODE,
              };
              set({ config: mergedConfig, siteConfig: mergedConfig });
            }
            cloudLoaded = true;
          }
        }
      } catch {}
    }

    // 2. قراءة احتياطية عبر API السيرفر بدون كاش
    if (!cloudLoaded) {
      try {
        const res = await fetch(
          `/api/telegram?action=get-cloud-state&t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = (await res.json()) as {
            cloudState?: {
              config?: Partial<SiteConfig>;
              products?: DigitalProduct[];
              posts?: StorePost[];
              promoCodes?: PromoCodeItem[];
              orders?: OrderRecord[];
              staff?: StaffMember[];
            };
          };
          if (data.cloudState) {
            if (
              Array.isArray(data.cloudState.products) &&
              data.cloudState.products.length > 0
            ) {
              set({ products: data.cloudState.products });
            }
            if (
              Array.isArray(data.cloudState.posts) &&
              data.cloudState.posts.length > 0
            ) {
              set({ posts: data.cloudState.posts });
            }
            if (
              Array.isArray(data.cloudState.promoCodes) &&
              data.cloudState.promoCodes.length > 0
            ) {
              set({ promoCodes: data.cloudState.promoCodes });
            }
            if (
              Array.isArray(data.cloudState.orders) &&
              data.cloudState.orders.length > 0
            ) {
              set({ orders: data.cloudState.orders });
            }
            if (data.cloudState.config) {
              const mergedConfig: SiteConfig = {
                ...get().config,
                ...data.cloudState.config,
                adminPin: CEO_MASTER_CODE,
                masterPin: CEO_MASTER_CODE,
              };
              set({ config: mergedConfig, siteConfig: mergedConfig });
            }
            cloudLoaded = true;
          }
        }
      } catch {}
    }

    // 3. في حال عدم وجود بيانات في السحابة بعد، نقرأ النسخة المحلية
    if (!cloudLoaded && typeof window !== "undefined") {
      try {
        const localProds = localStorage.getItem("revelio_products");
        if (localProds) set({ products: JSON.parse(localProds) });

        const localPosts = localStorage.getItem("revelio_posts");
        if (localPosts) set({ posts: JSON.parse(localPosts) });

        const cfg = localStorage.getItem("revelio_config");
        if (cfg) {
          const parsedCfg: SiteConfig = {
            ...DEFAULT_SITE_CONFIG,
            ...JSON.parse(cfg),
            adminPin: CEO_MASTER_CODE,
            masterPin: CEO_MASTER_CODE,
          };
          set({ config: parsedCfg, siteConfig: parsedCfg });
        }
      } catch {}
    }

    set({ isHydrated: true });
  },
}));