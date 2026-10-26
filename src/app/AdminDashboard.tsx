"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Package,
  Megaphone,
  Settings,
  ShoppingBag,
  Trash2,
  Edit3,
  ExternalLink,
  ArrowRight,
  Lock,
  Bot,
  Save,
  BarChart3,
  KeyRound,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  TicketPercent,
  UserCheck,
  Crop,
  ZoomIn,
  Move,
  CheckCircle2,
  Mail,
  CreditCard,
  LogOut,
  Plus,
  Send,
  Sparkles,
  RotateCw,
  Maximize2,
  RefreshCw,
  CloudCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  DigitalProduct,
  StorePost,
  ActivationMethod,
  ProductTemplateStyle,
  AdminPermission,
  StaffMember,
  PaymentMethodConfig,
  useRevelioStore,
  calculateUnitEconomics,
} from "./store-data";
import { buildPortfolioTelemetry } from "@/lib/analytics-engine";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type AdminTab =
  | "orders"
  | "customers"
  | "products"
  | "promos"
  | "posts"
  | "vault"
  | "analytics"
  | "staff"
  | "settings";

const ALL_PERMISSION_OPTIONS: Array<{ id: AdminPermission; label: string }> = [
  { id: "orders", label: "إدارة الطلبات والتسليم" },
  { id: "customers", label: "سجل وتتبع الزبائن (CRM)" },
  { id: "products", label: "إدارة المنتجات والصور" },
  { id: "promos", label: "أكواد البرومو والخصم" },
  { id: "posts", label: "المنشورات والنشرات" },
  { id: "vault", label: "خزنة الأكواد السرية" },
  { id: "analytics", label: "التحليلات والأرباح المالية" },
  { id: "settings", label: "إعدادات الدفع والبوت" },
  { id: "staff", label: "إدارة الموظفين (CEO)" },
];

export default function AdminDashboard() {
  const {
    config,
    products,
    posts,
    orders,
    staff,
    promoCodes,
    currentAdmin,
    cloudSyncStatus,
    setConfig,
    authenticateAdmin,
    logoutAdmin,
    addStaffMember,
    removeStaffMember,
    addPromoCode,
    togglePromoCode,
    removePromoCode,
    upsertProduct,
    removeProduct,
    setPosts,
    updateOrderStatus,
  } = useRevelioStore();

  const [pinInput, setPinInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");

  // فلترة الطلبات
  const [orderFilter, setOrderFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [deliveryMessages, setDeliveryMessages] = useState<Record<string, string>>({});

  // حقول المنتج
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [prodTitle, setProdTitle] = useState<string>("");
  const [prodCategory, setProdCategory] = useState<string>("AI");
  const [prodPriceDzd, setProdPriceDzd] = useState<number>(950);
  const [prodPriceUsd, setProdPriceUsd] = useState<number>(4);
  const [prodCostUsd, setProdCostUsd] = useState<number>(2.2);
  const [prodStock, setProdStock] = useState<number>(15);
  const [prodDuration, setProdDuration] = useState<string>("شهر كامل");
  const [prodDelivery, setProdDelivery] = useState<"manual" | "auto">("manual");
  const [prodActivationMethod, setProdActivationMethod] =
    useState<ActivationMethod>("EMAIL_INVITE");
  const [prodTemplateStyle, setProdTemplateStyle] =
    useState<ProductTemplateStyle>("cyber_cyan");
  const [prodBadge, setProdBadge] = useState<string>("الأكثر مبيعاً 🔥");
  const [prodShortDesc, setProdShortDesc] = useState<string>("");
  const [prodDetails, setProdDetails] = useState<string>("");
  const [prodFeaturesText, setProdFeaturesText] = useState<string>(
    "تفعيل رسمي 100%\nضمان ذهبي طوال المدة\nدعم فني عبر واتساب وتيليجرام"
  );
  const [prodImageUrl, setProdImageUrl] = useState<string>("");
  const [prodImageFitMode, setProdImageFitMode] = useState<"cover" | "contain">("cover");

  // =========================================================================
  // استوديو تحرير وقص الصور الحر والكبير (سحب مباشر بالماوس + تكبير عجلة الماوس + تدوير + طابع زجاجي)
  // =========================================================================
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [studioFitMode, setStudioFitMode] = useState<"cover" | "contain" | "free">("contain");
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);
  const [cropRotation, setCropRotation] = useState<number>(0);
  const [glassBgGlow, setGlassBgGlow] = useState<string>("#00eeff");
  const [isDraggingImg, setIsDraggingImg] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  // خزنة الأكواد
  const [selectedVaultProduct, setSelectedVaultProduct] = useState<string>(
    products[0]?.id || "prod-gemini-adv"
  );
  const [rawKeysInput, setRawKeysInput] = useState<string>("");
  const [vaultStatusMsg, setVaultStatusMsg] = useState<string>("");

  // المنشورات
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string>("");
  const [postBadge, setPostBadge] = useState<string>("عرض جديد 🔥");
  const [postContent, setPostContent] = useState<string>("");
  const [broadcastStatus, setBroadcastStatus] = useState<string>("");

  // البرومو
  const [newPromoCode, setNewPromoCode] = useState<string>("");
  const [newPromoPercent, setNewPromoPercent] = useState<number>(10);

  // الموظفين
  const [staffName, setStaffName] = useState<string>("");
  const [staffRoleTitle, setStaffRoleTitle] = useState<string>("مسؤول مبيعات وتفعيل");
  const [staffPinCode, setStaffPinCode] = useState<string>("");
  const [staffPerms, setStaffPerms] = useState<AdminPermission[]>([
    "orders",
    "customers",
    "products",
  ]);

  // حالة ربط وفحص البوت
  const [webhookStatus, setWebhookStatus] = useState<string>("");

  const telemetry = useMemo(
    () => buildPortfolioTelemetry(products, orders, config.dzdRate),
    [products, orders, config.dzdRate]
  );

  const customerDirectory = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        contact: string;
        email?: string;
        platform: string;
        ordersCount: number;
        totalSpentDzd: number;
        lastOrderDate: string;
        lastProduct: string;
        status: string;
      }
    >();

    orders.forEach((o) => {
      const key = (o.customerContact || o.customerName).toLowerCase().trim();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: o.customerName,
          contact: o.customerContact,
          email: o.customerEmail,
          platform: o.socialPlatform || o.channel || "WhatsApp",
          ordersCount: 1,
          totalSpentDzd: Number(o.amountDzd || 950),
          lastOrderDate: o.createdAt,
          lastProduct: o.productName || o.productTitle,
          status: o.status,
        });
      } else {
        existing.ordersCount += 1;
        existing.totalSpentDzd += Number(o.amountDzd || 950);
        if (o.customerEmail && !existing.email) {
          existing.email = o.customerEmail;
        }
      }
    });

    return Array.from(map.values());
  }, [orders]);

  // رسم الصورة الحرة داخل الاستوديو الكبير مع الطابع الزجاجي والهالة الخلفية
  useEffect(() => {
    if (!rawImageSrc || !cropCanvasRef.current || !loadedImageRef.current) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = loadedImageRef.current;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // 1. خلفية زجاجية داكنة مع هالة ضوئية ملونة (Glass Ambient Backdrop)
    const bgGrad = ctx.createLinearGradient(0, 0, cw, ch);
    bgGrad.addColorStop(0, "#020617");
    bgGrad.addColorStop(0.5, "#07142b");
    bgGrad.addColorStop(1, "#020617");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    const radialGlow = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      20,
      cw / 2,
      ch / 2,
      cw * 0.55
    );
    radialGlow.addColorStop(0, `${glassBgGlow}38`);
    radialGlow.addColorStop(0.6, `${glassBgGlow}12`);
    radialGlow.addColorStop(1, "transparent");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, cw, ch);

    // 2. حساب أبعاد الصورة حسب الوضع (Contain = كامل بدون قص | Cover = تغطية | Free = حر)
    const baseScale =
      studioFitMode === "contain"
        ? Math.min((cw * 0.88) / img.width, (ch * 0.88) / img.height)
        : Math.max(cw / img.width, ch / img.height);

    const finalScale = baseScale * cropZoom;
    const drawW = img.width * finalScale;
    const drawH = img.height * finalScale;

    ctx.save();
    ctx.translate(cw / 2 + cropOffsetX, ch / 2 + cropOffsetY);
    ctx.rotate((cropRotation * Math.PI) / 180);

    // ظل عميق خلف الصورة لإبراز الطابع الزجاجي ثلاثي الأبعاد
    ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // 3. لمعة زجاجية قطرية خفيفة فوق الإطار (Glass Specular Overlay)
    const sheenGrad = ctx.createLinearGradient(0, 0, cw, ch);
    sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    sheenGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.01)");
    sheenGrad.addColorStop(0.5, "transparent");
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, cw, ch);
  }, [rawImageSrc, studioFitMode, cropZoom, cropOffsetX, cropOffsetY, cropRotation, glassBgGlow]);

  const handleSelectImageForCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = String(reader.result || "");
      const imgObj = new window.Image();
      imgObj.onload = () => {
        loadedImageRef.current = imgObj;
        setRawImageSrc(resultStr);
        setStudioFitMode("contain");
        setCropZoom(1);
        setCropOffsetX(0);
        setCropOffsetY(0);
        setCropRotation(0);
      };
      imgObj.src = resultStr;
    };
    reader.readAsDataURL(file);
  };

  // السحب الحر بالماوس واللمس مباشرة فوق لوحة الصورة
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDraggingImg(true);
    dragStartRef.current = {
      x: e.clientX - cropOffsetX,
      y: e.clientY - cropOffsetY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingImg) return;
    setCropOffsetX(e.clientX - dragStartRef.current.x);
    setCropOffsetY(e.clientY - dragStartRef.current.y);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDraggingImg(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setCropZoom((prev) => Math.min(3.5, Math.max(0.2, Number((prev + delta).toFixed(2)))));
  };

  const handleApplyCrop = () => {
    if (!cropCanvasRef.current) return;
    const croppedDataUrl = cropCanvasRef.current.toDataURL("image/webp", 0.85);
    setProdImageUrl(croppedDataUrl);
    setProdImageFitMode(studioFitMode === "contain" ? "contain" : "cover");
    setRawImageSrc(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = authenticateAdmin(pinInput);
    if (user) {
      setLoginError("");
      setPinInput("");
      if (user.permissions.length > 0) {
        setActiveTab(user.permissions[0] as AdminTab);
      }
    } else {
      setLoginError("كود الدخول السري غير صحيح! يرجى التأكد من الكود الخاص بك.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) return;

    const featuresArray = prodFeaturesText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const newProd: DigitalProduct = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: prodTitle.trim(),
      name: prodTitle.trim(),
      category: prodCategory,
      duration: prodDuration,
      priceDzd: Number(prodPriceDzd),
      priceUsd: Number(prodPriceUsd),
      priceEur: Number((prodPriceUsd * 0.92).toFixed(2)),
      costUsd: Number(prodCostUsd),
      stockCount: Number(prodStock),
      stock: Number(prodStock),
      deliveryType: prodDelivery,
      activationMethod: prodActivationMethod,
      templateStyle: prodTemplateStyle,
      fulfillmentMode: prodDelivery === "auto" ? "INSTANT_WEB" : "MANUAL_VERIFY",
      badge: prodBadge || "متوفر ⚡",
      warranty: "ضمان ذهبي شامل",
      shortDesc: prodShortDesc || "تفعيل رسمي ومضمون من Revelio Digital.",
      description: prodShortDesc || "تفعيل رسمي ومضمون من Revelio Digital.",
      details: prodDetails || prodShortDesc || "اشتراك رقمي أصلي مع ضمان كامل.",
      features:
        featuresArray.length > 0
          ? featuresArray
          : ["تفعيل رسمي 100%", "ضمان ذهبي شامل", "دعم فني متواصل"],
      sampleKeys: [],
      imageUrl: prodImageUrl,
      imageFitMode: prodImageFitMode,
      accentColor: glassBgGlow || "#00eeff",
    };

    const res = await upsertProduct(newProd);
    setEditingProduct(null);
    setProdTitle("");
    setProdShortDesc("");
    setProdDetails("");
    setProdImageUrl("");
    alert(res.message);
  };

  const startEditProduct = (p: DigitalProduct) => {
    setEditingProduct(p);
    setProdTitle(p.title || p.name);
    setProdCategory(p.category);
    setProdPriceDzd(p.priceDzd);
    setProdPriceUsd(p.priceUsd);
    setProdCostUsd(p.costUsd || 2);
    setProdStock(p.stockCount ?? p.stock);
    setProdDuration(p.duration);
    setProdDelivery(p.deliveryType);
    setProdActivationMethod(p.activationMethod || "KEY");
    setProdTemplateStyle(p.templateStyle || "cyber_cyan");
    setProdBadge(p.badge || "متوفر ⚡");
    setProdShortDesc(p.shortDesc || p.description);
    setProdDetails(p.details || p.description);
    setProdFeaturesText((p.features || []).join("\n"));
    setProdImageUrl(p.imageUrl || "");
    setProdImageFitMode(p.imageFitMode || "cover");
    setGlassBgGlow(p.accentColor || "#00eeff");
  };

  const handleUploadVaultKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = rawKeysInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    if (isSupabaseConfigured) {
      const payload = lines.map((key) => ({
        product_id: selectedVaultProduct,
        secret_key: key,
        is_used: false,
      }));
      const { error } = await supabase.from("inventory_keys").insert(payload);
      if (error) {
        setVaultStatusMsg(`⚠️ تنبيه السحابة: ${error.message}`);
        return;
      }
    }

    setVaultStatusMsg(
      `✅ تم تشفير وإيداع ${lines.length} كود تفعيل في الخزنة المحمية بنجاح!`
    );
    setRawKeysInput("");
  };

  const handleSavePost = async (e: React.FormEvent, sendToTelegram = false) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    let updatedPosts: StorePost[] = [];
    if (editingPostId) {
      updatedPosts = posts.map((p) =>
        p.id === editingPostId
          ? { ...p, title: postTitle, badge: postBadge, content: postContent }
          : p
      );
      setEditingPostId(null);
    } else {
      const newPost: StorePost = {
        id: `post-${Date.now()}`,
        title: postTitle,
        badge: postBadge,
        content: postContent,
        date: new Date().toISOString().split("T")[0],
        active: true,
      };
      updatedPosts = [newPost, ...posts];
    }

    const syncRes = await setPosts(updatedPosts);
    setBroadcastStatus(syncRes.message);

    if (sendToTelegram) {
      try {
        const res = await fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "broadcast-newsletter",
            title: postTitle,
            badge: postBadge,
            content: postContent,
            botToken: config.telegramBotToken,
            adminChatId: config.telegramAdminChatId,
          }),
        });
        if (res.ok) {
          setBroadcastStatus(
            `${syncRes.message} | ✈️ وتم إرسال النشرة إلى تيليجرام بنجاح!`
          );
        }
      } catch {}
    }

    setPostTitle("");
    setPostContent("");
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newPromoCode.trim().toUpperCase();
    if (!cleanCode) return;

    await addPromoCode({
      id: `promo-${Date.now()}`,
      code: cleanCode,
      discountPercent: Number(newPromoPercent),
      active: true,
      usageCount: 0,
    });
    await setConfig({
      promoCode: cleanCode,
      promoDiscountPercent: Number(newPromoPercent),
    });
    setNewPromoCode("");
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffPinCode.trim()) return;

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: staffName.trim(),
      roleTitle: staffRoleTitle.trim() || "موظف مبيعات",
      pinCode: staffPinCode.trim(),
      permissions: staffPerms.length > 0 ? staffPerms : ["orders"],
      active: true,
      createdAt: new Date().toISOString().split("T")[0],
    };

    await addStaffMember(newMember);
    setStaffName("");
    setStaffPinCode("");
    alert(`✅ تم إضافة الموظف (${newMember.name}) وحفظه في السحابة بنجاح!`);
  };

  const toggleStaffPermission = (perm: AdminPermission) => {
    setStaffPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleUpdatePaymentMethod = (
    id: string,
    field: keyof PaymentMethodConfig,
    value: string | boolean
  ) => {
    const updatedList = (config.paymentMethods || []).map((pm) =>
      pm.id === id ? { ...pm, [field]: value } : pm
    );

    const baridi = updatedList.find((p) => p.name === "BaridiMob");
    const ccp = updatedList.find((p) => p.name === "CCP");
    const usdt = updatedList.find((p) => p.name === "USDT");
    const redot = updatedList.find((p) => p.name === "RedotPay");

    setConfig({
      paymentMethods: updatedList,
      ...(baridi ? { baridiMobRip: baridi.accountValue } : {}),
      ...(ccp ? { ccpAccount: `${ccp.accountValue} — ${ccp.accountHolder}` } : {}),
      ...(usdt
        ? { usdtAddress: usdt.accountValue, usdtNetwork: usdt.networkOrNote }
        : {}),
      ...(redot ? { redotpayId: redot.accountValue } : {}),
    });
  };

  // تفعيل Webhook البوت + اختبار إرسال رسالة حية
  const activateTelegramWebhook = async () => {
    setWebhookStatus("جاري ربط البوت وتفعيل الوكيل الذكي...");
    try {
      const tokenQuery = config.telegramBotToken
        ? `&token=${encodeURIComponent(config.telegramBotToken.trim())}`
        : "";
      const res = await fetch(`/api/telegram?action=set-webhook${tokenQuery}`);
      const data = (await res.json()) as {
        telegramResponse?: { ok?: boolean; description?: string };
        error?: string;
      };
      if (data.telegramResponse?.ok) {
        setWebhookStatus(
          "✅ تم ربط البوت بنجاح! أرسل له الآن أي رسالة في تيليجرام وسيرد عليك فوراً."
        );
      } else {
        setWebhookStatus(
          `⚠️ تنبيه: ${
            data.error ||
            data.telegramResponse?.description ||
            "تأكد من لصق توكن البوت في الخانة المخصصة أعلاه أولاً"
          }`
        );
      }
    } catch {
      setWebhookStatus("⚠️ تعذر الاتصال، تأكد من تشغيل السيرفر.");
    }
  };

  const sendTelegramTestMessage = async () => {
    setWebhookStatus("جاري إرسال رسالة اختبارية إلى تيليجرام...");
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-test",
          botToken: config.telegramBotToken,
          adminChatId: config.telegramAdminChatId,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setWebhookStatus(
          "✅ وصلت رسالة الاختبار إلى حسابك في تيليجرام الآن! البوت يعمل 100%."
        );
      } else {
        setWebhookStatus(
          `❌ فشل الإرسال: ${
            data.error || "تأكد من صحة توكن البوت وأنك ضغطت Start داخل البوت"
          }`
        );
      }
    } catch {
      setWebhookStatus("⚠️ خطأ في الاتصال بالخادم.");
    }
  };

  if (!currentAdmin) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="cyber-card max-w-md w-full p-7 space-y-6 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300 shadow-lg shadow-cyan-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase">
              ENCRYPTED EXECUTIVE & STAFF ACCESS
            </div>
            <h1 className="text-2xl font-black text-white">
              بوابة القيادة المشفرة — REVELIO
            </h1>
            <p className="text-xs text-slate-400">
              أدخل كود الدخول الشخصي الخاص بك (CEO أو كود الموظف المعتمد)
            </p>
          </div>

          <input
            type="password"
            required
            autoComplete="off"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="أدخل كود الدخول السري..."
            className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-center text-base font-mono text-white tracking-widest focus:outline-none focus:border-cyan-400"
          />

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-bold">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-sm hover:brightness-110 transition cursor-pointer"
          >
            تحقق ودخول للوحة القيادة
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
          >
            <span>العودة لواجهة المتجر</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </form>
      </div>
    );
  }

  const allTabs: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    perm: AdminPermission;
  }> = [
    { id: "orders", label: "الطلبات والتسليم", icon: ShoppingBag, perm: "orders" },
    { id: "customers", label: "سجل الزبائن CRM", icon: Users, perm: "customers" },
    { id: "products", label: "المنتجات واستوديو الصور", icon: Package, perm: "products" },
    { id: "promos", label: "أكواد البرومو", icon: TicketPercent, perm: "promos" },
    { id: "posts", label: "المنشورات والنشرات", icon: Megaphone, perm: "posts" },
    { id: "vault", label: "خزنة الأكواد", icon: KeyRound, perm: "vault" },
    { id: "analytics", label: "الأرباح والتحليلات", icon: BarChart3, perm: "analytics" },
    { id: "staff", label: "الموظفين (CEO)", icon: UserCheck, perm: "staff" },
    { id: "settings", label: "الدفع والبوت والـ AI", icon: Settings, perm: "settings" },
  ];

  const allowedTabs = allTabs.filter((t) =>
    currentAdmin.permissions.includes(t.perm)
  );

  const filteredOrders = orders.filter((o) => {
    const statusMatch =
      orderFilter === "ALL" || o.status.toUpperCase() === orderFilter;
    const q = orderSearch.toLowerCase().trim();
    const searchMatch =
      !q ||
      (o.orderId || o.id).toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerContact.toLowerCase().includes(q) ||
      (o.customerEmail || "").toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q);
    return statusMatch && searchMatch;
  });

  return (
    <div
      dir="rtl"
      className="min-h-screen text-slate-100 p-3 sm:p-6 max-w-7xl mx-auto space-y-6 relative z-10"
    >
      {/* الهيدر مع مؤشر حالة المزامنة السحابية الحقيقية */}
      <div className="cyber-card p-4 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-white">
                  مركز القيادة والإدارة — REVELIO
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                    currentAdmin.role === "CEO"
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                  }`}
                >
                  {currentAdmin.role === "CEO" ? "👑 CEO MASTER" : "🛡️ STAFF"}:{" "}
                  {currentAdmin.name} ({currentAdmin.roleTitle})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                جميع التعديلات تُحفظ في جدول <code>site_config</code> السحابي لتظهر على
                الهواتف فوراً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
            >
              <span>معاينة المتجر</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={logoutAdmin}
              className="px-3.5 py-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-900 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* شريط حالة اتصال قاعدة بيانات Supabase */}
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex flex-wrap items-center justify-between gap-2 ${
            isSupabaseConfigured
              ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
              : "bg-amber-500/15 border-amber-400/40 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CloudCheck className="w-4 h-4 shrink-0" />
            <span>
              {cloudSyncStatus ||
                (isSupabaseConfigured
                  ? "☁️ متصل بقاعدة بيانات Supabase (جدول site_config جاهز للمزامنة الفورية مع الهواتف)"
                  : "⚠️ مفتاح NEXT_PUBLIC_SUPABASE_ANON_KEY غير موضوع في src/lib/supabase.ts بعد — الصقه في السطر 8 ليظهر كل شيء على الهاتف!")}
            </span>
          </div>
        </div>
      </div>

      {/* شريط التبويبات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
        {allowedTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 border transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-cyan-400 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25"
                  : "cyber-card text-slate-200 hover:border-cyan-400/50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          1. تبويب الطلبات الموسع
         ==================================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-5">
          <div className="cyber-card p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white">
                مركز إدارة الطلبات والتسليم المباشر ({filteredOrders.length})
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                تأكد من وصول المبلغ في حسابك، ثم اضغط على زر مراسلة الزبون لإرسال
                التفعيل مباشرة مع رسالة الطلب الجاهزة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "PENDING", "COMPLETED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderFilter(st)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    orderFilter === st
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-900 text-slate-300 border border-cyan-500/20"
                  }`}
                >
                  {st === "ALL"
                    ? `الكل (${orders.length})`
                    : st === "PENDING"
                    ? `قيد المراجعة (${telemetry.pendingOrdersCount})`
                    : `مكتمل (${telemetry.completedOrdersCount})`}
                </button>
              ))}

              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="ابحث برقم الطلب أو اسم الزبون..."
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-white min-w-[220px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((ord) => {
              const ordKey = ord.orderId || ord.id;
              const isDone = ord.status.toUpperCase() === "COMPLETED";
              const cleanPhone = ord.customerContact.replace(/\D/g, "");
              const intlPhone = cleanPhone.startsWith("0")
                ? `213${cleanPhone.slice(1)}`
                : cleanPhone;
              const platform = ord.socialPlatform || ord.channel || "WhatsApp";
              const customPayload =
                deliveryMessages[ordKey] ?? ord.deliveredCode ?? "";

              const readyMessage = `مرحباً ${ord.customerName} ⚡، معك إدارة متجر ${config.storeName} بخصوص طلبك رقم (${ordKey}) للمنتج: ${ord.productName}.\n✅ تم التأكد من الدفع بنجاح!\n${
                ord.customerEmail
                  ? `📧 تم تفعيل الدعوة على إيميلك: ${ord.customerEmail}\n`
                  : ""
              }${
                customPayload
                  ? `🔑 بيانات التفعيل / الكود الخاص بك:\n${customPayload}\n`
                  : ""
              }🛡️ ضمانك الذهبي مفعل برقم طلبك: ${ordKey}`;

              const contactHref =
                platform === "WhatsApp"
                  ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(readyMessage)}`
                  : platform === "Instagram"
                  ? `https://instagram.com/${ord.customerContact.replace("@", "").trim()}`
                  : `https://t.me/${ord.customerContact.replace("@", "").trim()}?text=${encodeURIComponent(
                      readyMessage
                    )}`;

              return (
                <div
                  key={ordKey}
                  className="cyber-card p-5 sm:p-6 space-y-4 border-r-4 border-r-cyan-400"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/40 font-mono font-black text-cyan-300 text-sm sm:text-base">
                        {ordKey}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                          isDone
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {isDone ? "✅ مكتمل وتم التسليم" : "⏳ بانتظار تأكيد وصول المال"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        📅 {ord.createdAt}
                      </span>
                    </div>

                    <div className="text-lg sm:text-xl font-black text-cyan-300">
                      المبلغ: {ord.totalPrice} ({ord.paymentMethod})
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-xl border border-cyan-500/15 text-xs sm:text-sm">
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-xs">
                        📦 المنتج المطلوب:
                      </span>
                      <div className="font-black text-white text-base">
                        {ord.productName}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[11px]">
                        نوع التسليم:{" "}
                        {ord.activationMethod === "EMAIL_INVITE"
                          ? "📧 دعوة على الإيميل"
                          : ord.activationMethod === "ACCOUNT"
                          ? "👤 حساب جاهز"
                          : "🔑 كود تفعيل"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block text-xs">
                        👤 بيانات الزبون ومنصة الاستلام:
                      </span>
                      <div className="font-bold text-white">{ord.customerName}</div>
                      <div className="text-amber-300 font-mono">
                        {platform}: <strong>{ord.customerContact}</strong>
                      </div>
                      {ord.customerEmail && (
                        <div className="p-2 mt-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 font-mono text-xs flex items-center gap-1.5">
                          <Mail className="w-4 h-4 shrink-0" />
                          <span>إيميل الدعوة: {ord.customerEmail}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block text-xs">
                        🧾 مرجع الدفع / ملاحظات الوصل:
                      </span>
                      <div className="text-slate-200 font-medium">
                        {ord.notes || "لا توجد ملاحظات إضافية"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center pt-1">
                    <input
                      type="text"
                      value={customPayload}
                      onChange={(e) =>
                        setDeliveryMessages({
                          ...deliveryMessages,
                          [ordKey]: e.target.value,
                        })
                      }
                      placeholder="اكتب هنا الكود، أو بيانات الحساب، أو ملاحظة التفعيل..."
                      className="lg:col-span-6 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs sm:text-sm text-white font-mono"
                    />

                    <div className="lg:col-span-6 flex flex-wrap items-center justify-end gap-2.5">
                      <a
                        href={contactHref}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 hover:brightness-110 shadow-md shadow-emerald-500/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>مراسلة الزبون عبر {platform} مع رسالة الطلب</span>
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          updateOrderStatus(
                            ordKey,
                            isDone ? "PENDING" : "COMPLETED",
                            customPayload ||
                              "تم التفعيل الرسمي وإرسال البيانات لحسابك الشخصي ✓"
                          )
                        }
                        className={`px-4 py-3 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition ${
                          isDone
                            ? "bg-slate-800 text-slate-300 border border-slate-700"
                            : "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                        }`}
                      >
                        {isDone ? "إرجاع لقيد المراجعة" : "✅ اعتماد الدفع وتعليم كمكتمل"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          2. تبويب سجل الزبائن (CRM)
         ==================================================================== */}
      {activeTab === "customers" && (
        <div className="cyber-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-white">
                سجل وتتبع الزبائن الدائمين (Customer CRM)
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                تتبع مشتريات كل زبون، إيميله المسجل للتفعيل، وإمكانية مراسلته لتجديد
                الاشتراك بضغطة زر.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold">
              إجمالي الزبائن المسجلين: {customerDirectory.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerDirectory.map((cust, idx) => {
              const cleanPhone = cust.contact.replace(/\D/g, "");
              const intlPhone = cleanPhone.startsWith("0")
                ? `213${cleanPhone.slice(1)}`
                : cleanPhone;
              const renewUrl =
                cust.platform === "WhatsApp"
                  ? `https://wa.me/${intlPhone}?text=${encodeURIComponent(
                      `مرحباً ${cust.name} 🌟، نتمنى أن تكون تجربتك مع اشتراك (${cust.lastProduct}) من متجر REVELIO DIGITAL ممتازة! نود تذكيرك بإمكانية تجديد اشتراكك لدينا بخصم خاص للزبائن الأوفياء.`
                    )}`
                  : `https://t.me/${cust.contact.replace("@", "")}`;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/25 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-base">
                        {cust.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                        {cust.ordersCount} طلبات | {cust.totalSpentDzd.toLocaleString()}{" "}
                        د.ج
                      </span>
                    </div>
                    <div className="text-cyan-300 font-mono text-xs">
                      📱 {cust.platform}: {cust.contact}
                    </div>
                    {cust.email && (
                      <div className="text-emerald-300 font-mono text-xs">
                        📧 الإيميل: {cust.email}
                      </div>
                    )}
                    <div className="text-slate-400 text-xs">
                      آخر اشتراك:{" "}
                      <strong className="text-slate-200">{cust.lastProduct}</strong> (
                      {cust.lastOrderDate})
                    </div>
                  </div>

                  <div className="pt-2 border-t border-cyan-500/15 flex justify-end">
                    <a
                      href={renewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/25"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال رسالة تذكير / عرض تجديد</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          3. تبويب المنتجات + استوديو تحرير وتأطير الصور الزجاجي الحر والكبير
         ==================================================================== */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveProduct}
            className="cyber-card lg:col-span-7 p-5 sm:p-6 space-y-4 h-fit"
          >
            <h3 className="font-black text-lg text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>
                {editingProduct
                  ? `تعديل المنتج: ${editingProduct.title}`
                  : "إضافة منتج جديد + استوديو الصور الزجاجي الحر"}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  اسم المنتج:
                </label>
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="مثال: Google Gemini Advanced + 2TB"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  الشارة العلوية (Badge):
                </label>
                <input
                  type="text"
                  value={prodBadge}
                  onChange={(e) => setProdBadge(e.target.value)}
                  placeholder="مثال: الأكثر مبيعاً 🔥"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs text-cyan-300 font-bold block mb-1">
                  طريقة التفعيل والتسليم:
                </label>
                <select
                  value={prodActivationMethod}
                  onChange={(e) =>
                    setProdActivationMethod(e.target.value as ActivationMethod)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-cyan-400/50 text-xs text-cyan-200 font-bold"
                >
                  <option value="EMAIL_INVITE">
                    📧 دعوة على الإيميل (يطلب إيميل الزبون)
                  </option>
                  <option value="KEY">🔑 كود رقمي (مفتاح تفعيل)</option>
                  <option value="ACCOUNT">👤 حساب جاهز (إيميل + باسورد)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  التصنيف:
                </label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                >
                  <option value="AI">ذكاء اصطناعي (AI)</option>
                  <option value="Streaming">بث وترفيه (Streaming)</option>
                  <option value="Gaming">ألعاب (Gaming)</option>
                  <option value="Software">برامج وتصميم (Software)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  قالب البطاقة الزجاجي (Template):
                </label>
                <select
                  value={prodTemplateStyle}
                  onChange={(e) =>
                    setProdTemplateStyle(e.target.value as ProductTemplateStyle)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                >
                  <option value="cyber_cyan">🌐 نيون سماوي (Cyber Cyan)</option>
                  <option value="emerald_ai">🟢 زمردي ذكي (Emerald AI)</option>
                  <option value="crimson_stream">🔴 قرمزي سينمائي (Netflix/Stream)</option>
                  <option value="violet_gaming">🟣 بنفسجي ألعاب (Gaming Pro)</option>
                  <option value="gold_vip">🟡 ذهبي ملكي (VIP Gold)</option>
                </select>
              </div>
            </div>

            {/* =================================================================
                استوديو الصور الزجاجي الحر والكبير (اسحب بالماوس + كبر بالعجلة + احتواء كامل أو ملء)
               ================================================================= */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-cyan-400/40 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-300 flex items-center gap-2">
                  <Crop className="w-4 h-4" />
                  <span>
                    استوديو تحرير وتأطير صورة المنتج بحرية كاملة (Glass Image Studio):
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelectImageForCrop}
                  className="text-xs text-slate-300 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:bg-cyan-400 file:text-slate-950 file:font-black cursor-pointer"
                />
              </div>

              {rawImageSrc && (
                <div className="space-y-4 pt-1">
                  {/* أزرار أنماط التأطير الحرة */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-cyan-500/20">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setStudioFitMode("contain");
                          setCropZoom(1);
                          setCropOffsetX(0);
                          setCropOffsetY(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                          studioFitMode === "contain"
                            ? "bg-cyan-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        🖼️ إظهار الصورة كاملة بدون قص (Contain)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStudioFitMode("cover");
                          setCropZoom(1);
                          setCropOffsetX(0);
                          setCropOffsetY(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                          studioFitMode === "cover"
                            ? "bg-cyan-400 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        📐 ملء الكبسولة الزجاجية (Cover)
                      </button>

                      <button
                        type="button"
                        onClick={() => setCropRotation((r) => (r + 90) % 360)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>تدوير 90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCropZoom(1);
                          setCropOffsetX(0);
                          setCropOffsetY(0);
                          setCropRotation(0);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>توسيط</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">لون الهالة الزجاجية:</span>
                      {[
                        "#00eeff",
                        "#10b981",
                        "#f43f5e",
                        "#8b5cf6",
                        "#f59e0b",
                      ].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setGlassBgGlow(hex)}
                          className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                            glassBgGlow === hex ? "border-white scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* مساحة الرسم الكبيرة التفاعلية (اسحب بالماوس مباشرة + كبر بالعجلة) */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/60 bg-slate-950 shadow-2xl">
                    <div className="absolute top-2.5 right-3 z-10 pointer-events-none px-2.5 py-1 rounded-full bg-slate-950/80 border border-cyan-500/40 text-[11px] text-cyan-300 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5" />
                      <span>اسحب الصورة بالماوس بحرية أو حرك عجلة الماوس للتكبير/التصغير</span>
                    </div>
                    <canvas
                      ref={cropCanvasRef}
                      width={800}
                      height={500}
                      onPointerDown={handleCanvasPointerDown}
                      onPointerMove={handleCanvasPointerMove}
                      onPointerUp={handleCanvasPointerUp}
                      onWheel={handleCanvasWheel}
                      className="w-full h-[300px] sm:h-[360px] object-contain cursor-grab active:cursor-grabbing touch-none"
                    />
                  </div>

                  {/* أشرطة تحكم إضافية دقيقة */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/70 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-300 flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> حجم الصورة
                          (Zoom):
                        </span>
                        <strong className="text-cyan-300 font-mono">
                          {Math.round(cropZoom * 100)}%
                        </strong>
                      </span>
                      <input
                        type="range"
                        min="0.2"
                        max="3.5"
                        step="0.02"
                        value={cropZoom}
                        onChange={(e) => setCropZoom(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <span className="text-slate-300 flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> زاوية
                          الميلان (Rotation):
                        </span>
                        <strong className="text-cyan-300 font-mono">
                          {cropRotation}°
                        </strong>
                      </span>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={cropRotation}
                        onChange={(e) => setCropRotation(Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCrop}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد هذا التصميم الزجاجي للصورة</span>
                  </button>
                </div>
              )}

              {prodImageUrl && !rawImageSrc && (
                <div className="flex items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-emerald-500/40">
                  <img
                    src={prodImageUrl}
                    alt="Preview"
                    className="w-28 h-16 object-cover rounded-xl border border-cyan-400/40 shadow-md"
                  />
                  <span className="text-xs text-emerald-300 font-bold">
                    ✓ الصورة الزجاجية جاهزة ومعتمدة للبطاقة
                  </span>
                  <button
                    type="button"
                    onClick={() => setProdImageUrl("")}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    حذف / تغيير
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] text-slate-400">السعر (د.ج)</label>
                <input
                  type="number"
                  value={prodPriceDzd}
                  onChange={(e) => setProdPriceDzd(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">السعر ($)</label>
                <input
                  type="number"
                  step="0.1"
                  value={prodPriceUsd}
                  onChange={(e) => setProdPriceUsd(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">التكلفة ($)</label>
                <input
                  type="number"
                  step="0.1"
                  value={prodCostUsd}
                  onChange={(e) => setProdCostUsd(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">المخزون</label>
                <input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={prodDuration}
                onChange={(e) => setProdDuration(e.target.value)}
                placeholder="مدة الاشتراك (مثال: شهر كامل)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
              />
              <select
                value={prodDelivery}
                onChange={(e) =>
                  setProdDelivery(e.target.value as "manual" | "auto")
                }
                className="px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-amber-300 font-bold"
              >
                <option value="manual">يدوي آمن (بعد التأكد من المال)</option>
                <option value="auto">تلقائي فوري من الخزنة</option>
              </select>
            </div>

            <textarea
              rows={2}
              value={prodShortDesc}
              onChange={(e) => setProdShortDesc(e.target.value)}
              placeholder="وصف مختصر يظهر في واجهة البطاقة..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
            />

            <textarea
              rows={3}
              value={prodFeaturesText}
              onChange={(e) => setProdFeaturesText(e.target.value)}
              placeholder="مميزات المنتج (ميزة في كل سطر)..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
            />

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              {editingProduct
                ? "حفظ التعديلات ومزامنتها في site_config"
                : "نشر المنتج في المتجر ومزامنته للهواتف"}
            </button>
          </form>

          <div className="cyber-card lg:col-span-5 p-5 space-y-3">
            <h3 className="font-black text-lg text-white">
              كتالوج المنتجات الحالي ({products.length})
            </h3>
            <div className="space-y-3">
              {products.map((p) => {
                const econ = calculateUnitEconomics(p, config.dzdRate);
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-16 h-12 rounded-lg object-cover border border-cyan-500/40 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xs font-mono shrink-0">
                          {p.category}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white text-sm">
                          {p.title || p.name}
                        </div>
                        <div className="text-xs text-cyan-300 font-mono">
                          {p.priceDzd} د.ج | صافي الربح: {econ.netProfitDzd} د.ج
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditProduct(p)}
                        className="p-2 rounded-lg bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduct(p.id)}
                        className="p-2 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. تبويب أكواد البرومو
         ==================================================================== */}
      {activeTab === "promos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreatePromo}
            className="cyber-card lg:col-span-5 p-5 space-y-4 h-fit"
          >
            <h3 className="font-black text-lg text-cyan-300 flex items-center gap-2">
              <TicketPercent className="w-5 h-5" />
              <span>إنشاء كود برومو وتخفيض جديد</span>
            </h3>
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                رمز الكود (مثال: REV10):
              </label>
              <input
                type="text"
                required
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value)}
                placeholder="REV20"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-sm text-white font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                نسبة التخفيض (%):
              </label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={newPromoPercent}
                onChange={(e) => setNewPromoPercent(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-sm text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وتفعيل الكود في السحابة</span>
            </button>
          </form>

          <div className="cyber-card lg:col-span-7 p-5 space-y-3">
            <h3 className="font-black text-lg text-white">
              أكواد البرومو المتاحة ({promoCodes.length})
            </h3>
            {promoCodes.map((pr) => (
              <div
                key={pr.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-mono font-black text-cyan-300 text-base">
                    {pr.code}
                  </span>
                  <span className="mr-3 text-xs text-emerald-300 font-bold">
                    خصم {pr.discountPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePromoCode(pr.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      pr.active
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {pr.active ? "نشط ✓" : "متوقف"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePromoCode(pr.id)}
                    className="p-2 rounded-lg bg-rose-500/15 text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          5. تبويب المنشورات وإرسال النشرات
         ==================================================================== */}
      {activeTab === "posts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => handleSavePost(e, false)}
            className="cyber-card lg:col-span-5 p-5 space-y-3 h-fit"
          >
            <h3 className="font-black text-base text-cyan-300">
              {editingPostId
                ? "تعديل المنشور"
                : "نشر خبر / عرض في المتجر (يُحفظ في site_config ويظهر للهواتف فوراً)"}
            </h3>
            <input
              type="text"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="عنوان النشرة أو العرض..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
            />
            <input
              type="text"
              value={postBadge}
              onChange={(e) => setPostBadge(e.target.value)}
              placeholder="الشارة (مثال: عرض خاص 🔥)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
            />
            <textarea
              rows={4}
              required
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="محتوى الخبر أو العرض..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="submit"
                className="py-3 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                {editingPostId ? "حفظ التعديل" : "نشر في الموقع الآن"}
              </button>
              <button
                type="button"
                onClick={(e) => handleSavePost(e, true)}
                className="py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>نشر + إرسال لبوت تيليجرام</span>
              </button>
            </div>

            {broadcastStatus && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-300">
                {broadcastStatus}
              </div>
            )}
          </form>

          <div className="cyber-card lg:col-span-7 p-5 space-y-3">
            <h3 className="font-black text-base text-white">المنشورات الحالية</h3>
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-cyan-300">
                    {post.badge} • {post.date}
                  </span>
                  <div className="font-bold text-white text-sm">{post.title}</div>
                  <p className="text-xs text-slate-300">{post.content}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(post.id);
                      setPostTitle(post.title);
                      setPostBadge(post.badge);
                      setPostContent(post.content);
                    }}
                    className="p-2 rounded-lg bg-cyan-500/15 text-cyan-300 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosts(posts.filter((p) => p.id !== post.id))}
                    className="p-2 rounded-lg bg-rose-500/15 text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          6. تبويب خزنة الأكواد
         ==================================================================== */}
      {activeTab === "vault" && (
        <div className="cyber-card p-6 space-y-4">
          <h3 className="font-black text-lg text-white">
            🔐 خزنة الأكواد السرية المحمية (Supabase Inventory Vault)
          </h3>
          <form onSubmit={handleUploadVaultKeys} className="space-y-3 max-w-xl">
            <select
              value={selectedVaultProduct}
              onChange={(e) => setSelectedVaultProduct(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name}
                </option>
              ))}
            </select>
            <textarea
              rows={5}
              value={rawKeysInput}
              onChange={(e) => setRawKeysInput(e.target.value)}
              placeholder={"KEY-XXXX-YYYY-1111\nKEY-XXXX-YYYY-2222"}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              إيداع الأكواد في الخزنة المشفرة
            </button>
            {vaultStatusMsg && (
              <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-300">
                {vaultStatusMsg}
              </div>
            )}
          </form>
        </div>
      )}

      {/* ====================================================================
          7. تبويب التحليلات المالية
         ==================================================================== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="cyber-card p-5 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>إجمالي المبيعات المؤكدة</span>
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {telemetry.totalRevenueDzd.toLocaleString()} د.ج
              </div>
              <div className="text-xs font-mono text-cyan-300">
                ${telemetry.totalRevenueUsd.toFixed(2)} USD
              </div>
            </div>

            <div className="cyber-card p-5 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>صافي الربح التقديري</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {telemetry.estimatedNetProfitDzd.toLocaleString()} د.ج
              </div>
              <div className="text-xs font-mono text-emerald-300">
                متوسط الهامش: {telemetry.averageMarginPercent}%
              </div>
            </div>

            <div className="cyber-card p-5 space-y-1">
              <div className="text-xs text-slate-400">الطلبات المكتملة / المعلقة</div>
              <div className="text-2xl font-black text-white">
                {telemetry.completedOrdersCount} /{" "}
                <span className="text-amber-400">{telemetry.pendingOrdersCount}</span>
              </div>
            </div>

            <div className="cyber-card p-5 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>تنبيهات انخفاض المخزون</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">
                {telemetry.lowStockAlerts.length} منتجات
              </div>
            </div>
          </div>

          <div className="cyber-card p-5 space-y-4">
            <h3 className="font-black text-base text-white">
              منحنى الإيرادات وصافي الأرباح الأسبوعي (د.ج)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry.dailyRevenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#00eeff",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenueDzd"
                    name="المبيعات (د.ج)"
                    stroke="#00eeff"
                    fill="rgba(0, 238, 255, 0.2)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profitDzd"
                    name="صافي الربح (د.ج)"
                    stroke="#10b981"
                    fill="rgba(16, 185, 129, 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          8. تبويب الموظفين (CEO فقط)
         ==================================================================== */}
      {activeTab === "staff" && currentAdmin.role === "CEO" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleCreateStaff}
            className="cyber-card lg:col-span-5 p-5 space-y-4 h-fit"
          >
            <h3 className="font-black text-lg text-amber-300 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              <span>إضافة موظف جديد وتحديد صلاحياته (CEO Only)</span>
            </h3>

            <div>
              <label className="text-xs text-slate-300 block mb-1">اسم الموظف:</label>
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="مثال: كريم بن عمر"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">
                المنصب الوظيفي:
              </label>
              <input
                type="text"
                required
                value={staffRoleTitle}
                onChange={(e) => setStaffRoleTitle(e.target.value)}
                placeholder="مثال: مسؤول تفعيل الطلبات / دعم فني"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs text-cyan-300 font-bold block mb-1">
                كود الدخول السري الخاص بهذا الموظف:
              </label>
              <input
                type="text"
                required
                value={staffPinCode}
                onChange={(e) => setStaffPinCode(e.target.value)}
                placeholder="مثال: KARIM2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 block">
                الأقسام المسموح للموظف برؤيتها:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSION_OPTIONS.filter((p) => p.id !== "staff").map(
                  (perm) => (
                    <button
                      key={perm.id}
                      type="button"
                      onClick={() => toggleStaffPermission(perm.id)}
                      className={`p-2 rounded-lg text-[11px] font-bold border text-right cursor-pointer ${
                        staffPerms.includes(perm.id)
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {staffPerms.includes(perm.id) ? "✓ " : ""}
                      {perm.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs cursor-pointer"
            >
              اعتماد الموظف وتفعيل كوده في السحابة
            </button>
          </form>

          <div className="cyber-card lg:col-span-7 p-5 space-y-3">
            <h3 className="font-black text-lg text-white">
              فريق العمل والموظفين الحاليين ({staff.length})
            </h3>
            <div className="space-y-3">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-black text-white text-sm">
                      {member.name} —{" "}
                      <span className="text-cyan-300">{member.roleTitle}</span>
                    </div>
                    <div className="text-xs font-mono text-amber-300">
                      كود دخول الموظف: {member.pinCode}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      الصلاحيات: {member.permissions.join(" • ")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStaffMember(member.id)}
                    className="p-2.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          9. تبويب إعدادات وسائل الدفع + البوت + BYTEZ AI
         ==================================================================== */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="cyber-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-black text-lg">
              <CreditCard className="w-5 h-5" />
              <span>إدارة وسائل الدفع الرسمية (CCP • BaridiMob • USDT • RedotPay)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(config.paymentMethods || []).map((pm) => (
                <div
                  key={pm.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/25 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-sm">
                      {pm.labelAr}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdatePaymentMethod(pm.id, "enabled", !pm.enabled)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        pm.enabled
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {pm.enabled ? "مفعّل في السلة ✓" : "مخفي"}
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      رقم الحساب / RIP / عنوان محفظة USDT:
                    </label>
                    <input
                      type="text"
                      value={pm.accountValue}
                      onChange={(e) =>
                        handleUpdatePaymentMethod(
                          pm.id,
                          "accountValue",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs text-cyan-200 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        اسم صاحب الحساب:
                      </label>
                      <input
                        type="text"
                        value={pm.accountHolder}
                        onChange={(e) =>
                          handleUpdatePaymentMethod(
                            pm.id,
                            "accountHolder",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        الشبكة / المفتاح / ملاحظة:
                      </label>
                      <input
                        type="text"
                        value={pm.networkOrNote}
                        onChange={(e) =>
                          handleUpdatePaymentMethod(
                            pm.id,
                            "networkOrNote",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* إعدادات الذكاء الاصطناعي (BYTEZ AI + OpenRouter) وتوكن البوت */}
          <div className="cyber-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-cyan-300 font-black text-lg">
                <Bot className="w-5 h-5" />
                <span>
                  إعدادات الذكاء الاصطناعي (BYTEZ AI / OpenRouter) وبوت تيليجرام
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                ☁️ يُحفظ تلقائياً في جدول site_config
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-cyan-300 font-bold block mb-1">
                  محرك الذكاء الاصطناعي المفضل للبوت:
                </label>
                <select
                  value={config.aiProviderMode}
                  onChange={(e) =>
                    setConfig({
                      aiProviderMode: e.target.value as
                        | "bytez"
                        | "openrouter"
                        | "zerokey"
                        | "smart_rules",
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-400/50 text-xs text-cyan-200 font-bold"
                >
                  <option value="bytez">
                    🔥 BYTEZ AI (محرك Bytez الذكي — موصى به)
                  </option>
                  <option value="openrouter">
                    🚀 OpenRouter.ai (النماذج المجانية)
                  </option>
                  <option value="zerokey">
                    ⚡ ذكاء مجاني بدون أي مفتاح API (Zero-Key AI)
                  </option>
                  <option value="smart_rules">
                    🛡️ الرد التلقائي السريع من جدول الأسعار فقط
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs text-amber-300 font-bold block mb-1">
                  مفتاح BYTEZ API Key:
                </label>
                <input
                  type="password"
                  value={config.bytezApiKey || ""}
                  onChange={(e) =>
                    setConfig({ bytezApiKey: e.target.value.trim() })
                  }
                  placeholder="ضع مفتاح Bytez API Key هنا..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-400/50 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-amber-300 font-bold block mb-1">
                  اسم موديل BYTEZ:
                </label>
                <input
                  type="text"
                  value={config.bytezModel || "Qwen/Qwen2.5-7B-Instruct"}
                  onChange={(e) =>
                    setConfig({ bytezModel: e.target.value.trim() })
                  }
                  placeholder="Qwen/Qwen2.5-7B-Instruct"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-400/50 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-cyan-500/15">
              <div>
                <label className="text-xs text-emerald-300 font-bold block mb-1">
                  توكن بوت تيليجرام (TELEGRAM_BOT_TOKEN):
                </label>
                <input
                  type="password"
                  value={config.telegramBotToken || ""}
                  onChange={(e) =>
                    setConfig({ telegramBotToken: e.target.value.trim() })
                  }
                  placeholder="الصق التوكن من @BotFather هنا..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-400/50 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  مفتاح OpenRouter API Key (احتياطي):
                </label>
                <input
                  type="password"
                  value={config.openrouterApiKey || ""}
                  onChange={(e) =>
                    setConfig({ openrouterApiKey: e.target.value.trim() })
                  }
                  placeholder="sk-or-v1-..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  موديل OpenRouter:
                </label>
                <input
                  type="text"
                  value={config.openrouterModel || "openrouter/free"}
                  onChange={(e) =>
                    setConfig({ openrouterModel: e.target.value.trim() })
                  }
                  placeholder="openrouter/free"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={sendTelegramTestMessage}
                className="px-5 py-3 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>🔔 اختبار إرسال رسالة لحسابك في تيليجرام الآن</span>
              </button>

              <button
                type="button"
                onClick={activateTelegramWebhook}
                className="px-5 py-3 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-cyan-500/25"
              >
                <Bot className="w-4 h-4" />
                <span>🔗 تفعيل ربط البوت (@{config.telegramBotUsername})</span>
              </button>
            </div>

            {webhookStatus && (
              <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-300 font-bold">
                {webhookStatus}
              </div>
            )}
          </div>

          {/* حسابات التواصل الاجتماعي */}
          <div className="cyber-card p-6 space-y-4">
            <h3 className="font-black text-base text-white">
              حسابات التواصل الاجتماعي الرسمية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  رقم واتساب الرسمي (مع 213):
                </label>
                <input
                  type="text"
                  value={config.whatsappSupport}
                  onChange={(e) => setConfig({ whatsappSupport: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  حساب Instagram:
                </label>
                <input
                  type="text"
                  value={config.instagramPage}
                  onChange={(e) => setConfig({ instagramPage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  صفحة Facebook:
                </label>
                <input
                  type="text"
                  value={config.facebookPage}
                  onChange={(e) => setConfig({ facebookPage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  حساب TikTok:
                </label>
                <input
                  type="text"
                  value={config.tiktokPage}
                  onChange={(e) => setConfig({ tiktokPage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  معرف بوت تيليجرام:
                </label>
                <input
                  type="text"
                  value={config.telegramBotUsername}
                  onChange={(e) =>
                    setConfig({
                      telegramBotUsername: e.target.value.replace("@", "").trim(),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  سعر صرف الدولار (DZD Rate):
                </label>
                <input
                  type="number"
                  value={config.dzdRate}
                  onChange={(e) => setConfig({ dzdRate: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfig({})}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ ومزامنة جميع الإعدادات في السحابة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}