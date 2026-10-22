export interface DigitalProduct {
  id: string;
  title: string;
  category: 'AI' | 'STREAMING' | 'GAMING';
  duration: string;
  deliveryType: 'INSTANT_KEY' | 'SHARED_VAULT' | 'DIRECT_TOPUP';
  priceUSD: number;
  wholesaleCostUSD: number; // التكلفة الحقيقية لحساب صافي الربح الدقيق
  gatewayFeePercent: number;
  stockCount: number;
  salesVelocityPerDay: number; // معدل البيع اليومي للتنبؤ بنفاد المخزون
  renewalRate: number; // نسبة تجديد الاشتراك الشهري
  badge?: string;
  accentColor: string;
}

export const PRODUCTS_DATA: DigitalProduct[] = [
  {
    id: 'gem-adv-1m',
    title: 'Google Gemini Advanced + 2TB',
    category: 'AI',
    duration: 'اشتراك شهر كامل - حساب خاص',
    deliveryType: 'INSTANT_KEY',
    priceUSD: 12.99,
    wholesaleCostUSD: 6.50,
    gatewayFeePercent: 2.5,
    stockCount: 18,
    salesVelocityPerDay: 9.5,
    renewalRate: 88,
    badge: 'الأكثر طلباً في AI',
    accentColor: '#7c3aed',
  },
  {
    id: 'nf-uhd-1m',
    title: 'Netflix Premium 4K UHD',
    category: 'STREAMING',
    duration: 'ملف خاص مضمون - 30 يوم',
    deliveryType: 'SHARED_VAULT',
    priceUSD: 4.50,
    wholesaleCostUSD: 1.80,
    gatewayFeePercent: 2.0,
    stockCount: 64,
    salesVelocityPerDay: 22.0,
    renewalRate: 92,
    badge: 'تسليم فوري تلقائي',
    accentColor: '#e11d48',
  },
  {
    id: 'val-vp-4750',
    title: 'Valorant 4750 VP (EU/MENA)',
    category: 'GAMING',
    duration: 'كود تفعيل فوري',
    deliveryType: 'INSTANT_KEY',
    priceUSD: 38.00,
    wholesaleCostUSD: 31.20,
    gatewayFeePercent: 2.5,
    stockCount: 5,
    salesVelocityPerDay: 4.2,
    renewalRate: 65,
    badge: 'وشيك على النفاد',
    accentColor: '#06b6d4',
  },
  {
    id: 'sp-ind-3m',
    title: 'Spotify Premium Individual',
    category: 'STREAMING',
    duration: '3 أشهر - ترقية حسابك الشخصي',
    deliveryType: 'DIRECT_TOPUP',
    priceUSD: 8.99,
    wholesaleCostUSD: 4.10,
    gatewayFeePercent: 2.0,
    stockCount: 42,
    salesVelocityPerDay: 11.4,
    renewalRate: 84,
    accentColor: '#10b981',
  },
];

// معادلة حساب صافي الربح الحقيقي وهامش الربح المئوي لكل منتج
export function calculateUnitEconomics(product: DigitalProduct) {
  const gatewayFee = (product.priceUSD * product.gatewayFeePercent) / 100;
  const netProfit = product.priceUSD - product.wholesaleCostUSD - gatewayFee;
  const profitMarginPercent = (netProfit / product.priceUSD) * 100;
  const hoursUntilStockout = Math.round((product.stockCount / product.salesVelocityPerDay) * 24);

  return {
    gatewayFee: Number(gatewayFee.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    profitMarginPercent: Number(profitMarginPercent.toFixed(1)),
    hoursUntilStockout,
  };
}

// بيانات السلاسل الزمنية للرسوم البيانية (إيرادات إجمالية مقابل صافي الربح الحقيقي)
export const TELEMETRY_SERIES = [
  { time: '00:00', grossRevenue: 420, netProfit: 195, orders: 28, latencyMs: 112 },
  { time: '04:00', grossRevenue: 310, netProfit: 142, orders: 19, latencyMs: 98 },
  { time: '08:00', grossRevenue: 680, netProfit: 325, orders: 47, latencyMs: 118 },
  { time: '12:00', grossRevenue: 1250, netProfit: 610, orders: 89, latencyMs: 134 },
  { time: '16:00', grossRevenue: 1590, netProfit: 785, orders: 114, latencyMs: 121 },
  { time: '20:00', grossRevenue: 2140, netProfit: 1090, orders: 156, latencyMs: 105 },
  { time: '23:59', grossRevenue: 1890, netProfit: 940, orders: 132, latencyMs: 94 },
];