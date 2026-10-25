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
  // إعدادات البوت المباشرة (تعمل حتى على localhost)
  telegramBotToken: string;
  telegramAdminChatId: string;
  enableLocalBotPolling: boolean;
  // إعدادات الذكاء الاصطناعي
  aiProviderMode: "openrouter" | "zerokey" | "smart_rules";
  openrouterApiKey: string;
  openrouterModel: string;
  // إعدادات المؤثرات الثلاثية الأبعاد والأشعة القابلة للتفعيل والإيقاف
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
    createdAt: "2026-10-25",
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
  aiProviderMode: "openrouter",
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
    date: "2026-10-25",
    active: true,
  },
  {
    id: "post-2",
    title: "💳 نقبل الدفع عبر BaridiMob و CCP و USDT (TRC20 / Binance)",
    content:
      "يمكنك الآن اختيار وسيلة الدفع الأنسب لك في سلة المشتريات واستلام اشتراكك (سواء كان كوداً، دعوة إيميل، أو حساباً جاهزاً) عبر واتساب أو إنستغرام أو تيليجرام.",
    badge: "تحديث الدفع",
    date: "2026-10-25",
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
    createdAt: "2026-10-25",
    expiresAt: "2026-11-24",
  },
];

export async function saveOrderToSupabase(order: OrderRecord): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from("orders").upsert(
      [
        {
          order_id: order.orderId || order.id,
          customer_name: order.customerName,
          customer_contact: order.customerEmail
            ? `${order.customerContact} | Email: ${order.customerEmail}`
            : order.customerContact,
          channel: order.socialPlatform || order.channel,
          product_id: order.productId || "",
          product_title: order.productName || order.productTitle,
          amount_usd: order.amountUsd || 4,
          amount_dzd: order.amountDzd || 950,
          payment_method: order.paymentMethod,
          delivery_type: order.deliveryType,
          status: order.status.toUpperCase(),
          delivered_key: order.deliveredCode || "",
        },
      ],
      { onConflict: "order_id" }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function saveProductToSupabase(product: DigitalProduct): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from("products").upsert(
      [
        {
          id: product.id,
          title: product.title || product.name,
          category: product.category,
          duration: product.duration,
          price_usd: product.priceUsd,
          cost_usd: product.costUsd || Number((product.priceUsd * 0.55).toFixed(2)),
          stock_count: product.stockCount ?? product.stock,
          delivery_type: product.deliveryType,
          badge: product.badge || "متوفر ⚡",
          description: product.shortDesc || product.description,
          features: product.features,
          image_url: product.imageUrl || "",
          accent_color: product.accentColor || "#00eeff",
        },
      ],
      { onConflict: "id" }
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
  setConfig: (cfg: Partial<SiteConfig>) => void;
  authenticateAdmin: (pinCode: string) => AuthenticatedAdminUser | null;
  logoutAdmin: () => void;
  addStaffMember: (member: StaffMember) => void;
  updateStaffMember: (member: StaffMember) => void;
  removeStaffMember: (id: string) => void;
  addPromoCode: (promo: PromoCodeItem) => void;
  togglePromoCode: (id: string) => void;
  removePromoCode: (id: string) => void;
  setProducts: (prods: DigitalProduct[]) => void;
  upsertProduct: (prod: DigitalProduct) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  setPosts: (posts: StorePost[]) => void;
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

  setConfig: (partial) => {
    const updated: SiteConfig = {
      ...get().config,
      ...partial,
      adminPin: CEO_MASTER_CODE,
      masterPin: CEO_MASTER_CODE,
    };
    set({ config: updated, siteConfig: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_config", JSON.stringify(updated));
    }
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

  addStaffMember: (member) => {
    const updated = [member, ...get().staff];
    set({ staff: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_staff", JSON.stringify(updated));
    }
  },

  updateStaffMember: (member) => {
    const updated = get().staff.map((s) => (s.id === member.id ? member : s));
    set({ staff: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_staff", JSON.stringify(updated));
    }
  },

  removeStaffMember: (id) => {
    const updated = get().staff.filter((s) => s.id !== id);
    set({ staff: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_staff", JSON.stringify(updated));
    }
  },

  addPromoCode: (promo) => {
    const updated = [promo, ...get().promoCodes];
    set({ promoCodes: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_promos", JSON.stringify(updated));
    }
  },

  togglePromoCode: (id) => {
    const updated = get().promoCodes.map((p) =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    set({ promoCodes: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_promos", JSON.stringify(updated));
    }
  },

  removePromoCode: (id) => {
    const updated = get().promoCodes.filter((p) => p.id !== id);
    set({ promoCodes: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_promos", JSON.stringify(updated));
    }
  },

  setProducts: (prods) => {
    set({ products: prods });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_products", JSON.stringify(prods));
    }
  },

  upsertProduct: async (prod) => {
    const current = get().products;
    const exists = current.some((p) => p.id === prod.id);
    const updated = exists
      ? current.map((p) => (p.id === prod.id ? prod : p))
      : [prod, ...current];
    set({ products: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_products", JSON.stringify(updated));
    }
    await saveProductToSupabase(prod);
  },

  removeProduct: async (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    set({ products: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_products", JSON.stringify(updated));
    }
    if (isSupabaseConfigured) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch {}
    }
  },

  setPosts: (posts) => {
    set({ posts });
    if (typeof window !== "undefined") {
      localStorage.setItem("revelio_posts", JSON.stringify(posts));
    }
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
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("orders")
          .update({
            status: normalizedStatus,
            ...(deliveredCode ? { delivered_key: deliveredCode } : {}),
          })
          .eq("order_id", orderId);
      } catch {}
    }
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
        const cfg = localStorage.getItem("revelio_config");
        if (cfg) {
          const parsedCfg: SiteConfig = {
            ...DEFAULT_SITE_CONFIG,
            ...JSON.parse(cfg),
            adminPin: CEO_MASTER_CODE,
            masterPin: CEO_MASTER_CODE,
          };
          if (!parsedCfg.paymentMethods || parsedCfg.paymentMethods.length === 0) {
            parsedCfg.paymentMethods = INITIAL_PAYMENT_METHODS;
          }
          if (!parsedCfg.visualFx) {
            parsedCfg.visualFx = DEFAULT_SITE_CONFIG.visualFx;
          }
          set({ config: parsedCfg, siteConfig: parsedCfg });
        }

        const localProds = localStorage.getItem("revelio_products");
        if (localProds) set({ products: JSON.parse(localProds) });

        const localPosts = localStorage.getItem("revelio_posts");
        if (localPosts) set({ posts: JSON.parse(localPosts) });

        const localOrders = localStorage.getItem("revelio_orders");
        if (localOrders) set({ orders: JSON.parse(localOrders) });

        const localStaff = localStorage.getItem("revelio_staff");
        if (localStaff) set({ staff: JSON.parse(localStaff) });

        const localPromos = localStorage.getItem("revelio_promos");
        if (localPromos) set({ promoCodes: JSON.parse(localPromos) });

        const localCart = localStorage.getItem("revelio_cart");
        if (localCart) set({ cart: JSON.parse(localCart) });
      } catch {}
    }

    if (isSupabaseConfigured) {
      try {
        const { data: dbProducts } = await supabase
          .from("products")
          .select(
            "id, title, category, duration, price_usd, cost_usd, stock_count, delivery_type, badge, description, features, image_url, accent_color"
          );

        if (dbProducts && dbProducts.length > 0) {
          const rate = get().config.dzdRate || 245;
          const localMap = new Map(get().products.map((lp) => [lp.id, lp]));

          const mapped: DigitalProduct[] = dbProducts.map(
            (p: Record<string, unknown>) => {
              const idStr = String(p.id || "");
              const existingLocal = localMap.get(idStr);
              const usd = Number(p.price_usd || 4);
              const dzd = existingLocal?.priceDzd || Math.round(usd * rate);

              return {
                id: idStr,
                title: String(p.title || "منتج رقمي"),
                name: String(p.title || "منتج رقمي"),
                category: String(p.category || "AI"),
                duration: String(p.duration || "شهر كامل"),
                durationDays: existingLocal?.durationDays || 30,
                priceUsd: usd,
                priceDzd: dzd,
                priceEur: Number((usd * 0.92).toFixed(2)),
                costUsd: Number(p.cost_usd || usd * 0.55),
                stockCount: Number(p.stock_count ?? 15),
                stock: Number(p.stock_count ?? 15),
                deliveryType: p.delivery_type === "auto" ? "auto" : "manual",
                activationMethod: existingLocal?.activationMethod || "KEY",
                templateStyle: existingLocal?.templateStyle || "cyber_cyan",
                fulfillmentMode:
                  p.delivery_type === "auto" ? "INSTANT_WEB" : "MANUAL_VERIFY",
                badge: String(p.badge || "متوفر ⚡"),
                warranty: "ضمان ذهبي شامل",
                shortDesc: String(
                  p.description || "تفعيل رسمي ومضمون من Revelio Digital."
                ),
                description: String(
                  p.description || "تفعيل رسمي ومضمون من Revelio Digital."
                ),
                details:
                  existingLocal?.details ||
                  String(p.description || "اشتراك رقمي أصلي مع ضمان كامل."),
                features: Array.isArray(p.features)
                  ? (p.features as string[])
                  : [
                      "تفعيل رسمي 100%",
                      "ضمان ذهبي شامل",
                      "دعم فني عبر واتساب وتيليجرام",
                    ],
                sampleKeys: [],
                imageUrl: String(p.image_url || existingLocal?.imageUrl || ""),
                accentColor: String(p.accent_color || "#00eeff"),
              };
            }
          );
          set({ products: mapped });
        }

        const { data: dbOrders } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbOrders && dbOrders.length > 0) {
          const mappedOrders: OrderRecord[] = dbOrders.map(
            (o: Record<string, unknown>) => {
              const rawContact = String(o.customer_contact || "");
              const parts = rawContact.split("| Email:");
              const contactClean = parts[0]?.trim() || "";
              const emailClean = parts[1]?.trim() || undefined;
              const createdStr = o.created_at
                ? String(o.created_at).split("T")[0]
                : new Date().toISOString().split("T")[0];

              return {
                id: String(o.order_id || o.id),
                orderId: String(o.order_id || o.id),
                productId: String(o.product_id || ""),
                productName: String(o.product_title || "اشتراك رقمي"),
                productTitle: String(o.product_title || "اشتراك رقمي"),
                totalPrice: o.amount_dzd
                  ? `${o.amount_dzd} د.ج`
                  : `$${o.amount_usd || 4}`,
                amountUsd: Number(o.amount_usd || 4),
                amountDzd: Number(o.amount_dzd || 950),
                customerName: String(o.customer_name || "عميل Revelio"),
                customerContact: contactClean,
                customerEmail: emailClean,
                channel: (o.channel as SocialPlatform) || "WhatsApp",
                socialPlatform: (o.channel as SocialPlatform) || "WhatsApp",
                paymentMethod: String(o.payment_method || "BaridiMob"),
                status: String(o.status || "PENDING").toUpperCase() as OrderRecord["status"],
                deliveryType: o.delivery_type === "auto" ? "auto" : "manual",
                deliveredCode: String(o.delivered_key || ""),
                createdAt: createdStr,
              };
            }
          );
          set({ orders: mappedOrders });
        }
      } catch {}
    }

    set({ isHydrated: true });
  },
}));