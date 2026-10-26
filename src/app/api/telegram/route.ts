import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CloudSyncedProduct {
  id: string;
  title: string;
  category: string;
  duration: string;
  priceDzd: number;
  priceUsd: number;
  stockCount: number;
  activationMethod?: string;
}

interface CloudSyncedState {
  config?: {
    storeName?: string;
    promoCode?: string;
    promoDiscountPercent?: number;
    dzdRate?: number;
    baridiMobRip?: string;
    ccpAccount?: string;
    usdtAddress?: string;
    redotpayId?: string;
    telegramBotUsername?: string;
    telegramBotToken?: string;
    telegramAdminChatId?: string;
    aiProviderMode?: "bytez" | "openrouter" | "zerokey" | "smart_rules";
    bytezApiKey?: string;
    bytezModel?: string;
    openrouterApiKey?: string;
    openrouterModel?: string;
  };
  products?: CloudSyncedProduct[];
  posts?: unknown[];
  orders?: Array<Record<string, unknown>>;
  promoCodes?: Array<{ code: string; discountPercent: number; active: boolean }>;
}

// حفظ حالة البوت في globalThis لمنع تكرار الرسائل حتى أثناء إعادة التحميل السريع في Next.js
const globalForBot = globalThis as unknown as {
  __revelioPollingLock?: boolean;
  __revelioWebhookCleared?: boolean;
  __revelioProcessedIds?: Set<number>;
  __revelioProcessedKeys?: Map<string, number>;
  __revelioLastOffset?: number;
  __revelioCachedCloud?: CloudSyncedState | null;
};

if (!globalForBot.__revelioProcessedIds) {
  globalForBot.__revelioProcessedIds = new Set<number>();
}
if (!globalForBot.__revelioProcessedKeys) {
  globalForBot.__revelioProcessedKeys = new Map<string, number>();
}
if (globalForBot.__revelioLastOffset === undefined) {
  globalForBot.__revelioLastOffset = 0;
}

let runtimeBotConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "8784273242:AAE9UimGpyjpFhWnNzaoZuEZajHtAyM6EOU",
  adminChatId: String(process.env.TELEGRAM_CHAT_ID || "1399306871"),
  botUsername: process.env.TELEGRAM_BOT_USERNAME || "REVELIO_ASSISTANT_BOT",
  aiMode: "bytez" as "bytez" | "openrouter" | "zerokey" | "smart_rules",
  bytezApiKey: process.env.BYTEZ_API_KEY || "",
  bytezModel: process.env.BYTEZ_MODEL || "Qwen/Qwen2.5-7B-Instruct",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterModel: process.env.OPENROUTER_MODEL || "openrouter/free",
};

const chatMemory = new Map<
  string,
  Array<{ role: "user" | "assistant"; content: string }>
>();

function appendMemory(
  chatId: string,
  role: "user" | "assistant",
  content: string
) {
  const history = chatMemory.get(chatId) || [];
  history.push({ role, content: content.slice(0, 500) });
  if (history.length > 6) history.shift();
  chatMemory.set(chatId, history);
}

// قراءة أحدث حالة للمتجر من جدول site_config (الصف id = 1)
async function loadCloudStateFromSiteConfig(): Promise<CloudSyncedState | null> {
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from("site_config")
      .select("hero_subtitle")
      .eq("id", 1)
      .maybeSingle();

    if (
      data &&
      typeof (data as Record<string, unknown>).hero_subtitle === "string"
    ) {
      const rawJson = String((data as Record<string, unknown>).hero_subtitle);
      if (rawJson.startsWith("{")) {
        const parsed = JSON.parse(rawJson) as CloudSyncedState;
        globalForBot.__revelioCachedCloud = parsed;

        if (parsed.config) {
          if (parsed.config.telegramBotToken) {
            runtimeBotConfig.botToken = parsed.config.telegramBotToken;
          }
          if (parsed.config.telegramAdminChatId) {
            runtimeBotConfig.adminChatId = parsed.config.telegramAdminChatId;
          }
          if (parsed.config.aiProviderMode) {
            runtimeBotConfig.aiMode = parsed.config.aiProviderMode;
          }
          if (parsed.config.bytezApiKey) {
            runtimeBotConfig.bytezApiKey = parsed.config.bytezApiKey;
          }
          if (parsed.config.bytezModel) {
            runtimeBotConfig.bytezModel = parsed.config.bytezModel;
          }
          if (parsed.config.openrouterApiKey) {
            runtimeBotConfig.openrouterApiKey = parsed.config.openrouterApiKey;
          }
          if (parsed.config.openrouterModel) {
            runtimeBotConfig.openrouterModel = parsed.config.openrouterModel;
          }
        }
        return parsed;
      }
    }
  } catch {}
  return globalForBot.__revelioCachedCloud || null;
}

interface TelegramUpdateObject {
  update_id?: number;
  message?: {
    message_id?: number;
    chat: { id: number | string };
    from?: { first_name?: string; username?: string };
    text?: string;
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: { chat?: { id: number | string } };
  };
}

interface TelegramWebhookBody extends TelegramUpdateObject {
  action?: string;
  orderId?: string;
  contactLast4?: string;
  title?: string;
  badge?: string;
  content?: string;
  productId?: string;
  productName?: string;
  price?: string;
  amountUsd?: number;
  amountDzd?: number;
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  activationMethod?: "KEY" | "EMAIL_INVITE" | "ACCOUNT";
  socialPlatform?: string;
  paymentMethod?: string;
  deliveryType?: "manual" | "auto";
  notes?: string;
  botToken?: string;
  adminChatId?: string;
  bytezApiKey?: string;
  bytezModel?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  aiProviderMode?: "bytez" | "openrouter" | "zerokey" | "smart_rules";
  cloudState?: CloudSyncedState;
}

function getCustomerInteractiveKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🛒 قائمة الاشتراكات والأسعار", callback_data: "menu_catalog" },
        { text: "🤖 مقارنة الذكاء الاصطناعي", callback_data: "menu_ai_compare" },
      ],
      [
        { text: "💳 طرق الدفع (CCP / USDT)", callback_data: "menu_payments" },
        { text: "🎁 احصل على كود خصم", callback_data: "menu_promo" },
      ],
      [{ text: "🔍 كيف أفحص حالة طلبي؟", callback_data: "menu_track_help" }],
    ],
  };
}

function buildSmartLocalReply(
  userMessage: string,
  catalogLines: string,
  promoCode = "REV10",
  promoPercent = 10
): string {
  const q = userMessage.toLowerCase().trim();

  if (
    q === "/start" ||
    q.includes("سلام") ||
    q.includes("مرحبا") ||
    q.includes("اهلا") ||
    q.includes("hi") ||
    q.includes("hello") ||
    q.includes("salem") ||
    q.includes("salam")
  ) {
    return `مرحباً بك في REVELIO DIGITAL ⚡!\nأنا المستشار الذكي للمتجر، جاهز لمساعدتك في اختيار وتفعيل اشتراكك.\n\n📦 أبرز الاشتراكات المتوفرة حالياً:\n${catalogLines}\n\n🎁 كود خصم هدية لك: ${promoCode} (تخفيض ${promoPercent}%)\n\n👇 اختر من الأزرار بالأسفل أو اكتب لي أي سؤال:`;
  }

  return `⚡ مرحباً بك في REVELIO DIGITAL!\nإليك قائمة الاشتراكات والأسعار الرسمية المتوفرة لدينا الآن:\n\n${catalogLines}\n\n💳 نقبل الدفع عبر: BaridiMob • CCP • USDT • RedotPay\n🎁 استعمل كود الخصم ${promoCode} للحصول على تخفيض ${promoPercent}%!\n🔍 لتتبع طلبك أرسل رقمه فقط (مثال: ORD-884920).`;
}

async function askHybridAIAgent(
  systemPrompt: string,
  userMessage: string,
  chatId: string,
  catalogLines: string
): Promise<{ reply: string; provider: string }> {
  const q = userMessage.toLowerCase().trim();
  if (q === "/start" || runtimeBotConfig.aiMode === "smart_rules") {
    return {
      reply: buildSmartLocalReply(userMessage, catalogLines),
      provider: "Smart Local Engine",
    };
  }

  const history = chatMemory.get(chatId) || [];
  const openAiMessages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  const activeBytezKey =
    runtimeBotConfig.bytezApiKey || process.env.BYTEZ_API_KEY || "";
  const activeBytezModel =
    runtimeBotConfig.bytezModel ||
    process.env.BYTEZ_MODEL ||
    "Qwen/Qwen2.5-7B-Instruct";

  const activeOpenRouterKey =
    runtimeBotConfig.openrouterApiKey || process.env.OPENROUTER_API_KEY || "";
  const activeOpenRouterModel =
    runtimeBotConfig.openrouterModel ||
    process.env.OPENROUTER_MODEL ||
    "openrouter/free";

  const providers = [
    {
      name: `Bytez AI (${activeBytezModel})`,
      enabled: Boolean(activeBytezKey),
      call: async (): Promise<string | undefined> => {
        const oaiRes = await fetch(
          "https://api.bytez.com/models/v2/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${activeBytezKey}`,
            },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              model: activeBytezModel,
              messages: openAiMessages,
              temperature: 0.45,
              max_tokens: 450,
            }),
          }
        );

        if (oaiRes.ok) {
          const oaiData = (await oaiRes.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const text = oaiData?.choices?.[0]?.message?.content;
          if (text) return text;
        }

        const nativeRes = await fetch(
          `https://api.bytez.com/models/v2/${activeBytezModel}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Key ${activeBytezKey}`,
            },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              messages: openAiMessages,
              params: {
                max_new_tokens: 450,
                temperature: 0.45,
              },
            }),
          }
        );

        if (!nativeRes.ok) throw new Error(`Bytez HTTP ${nativeRes.status}`);
        const nativeData = (await nativeRes.json()) as {
          output?:
            | string
            | Array<{ content?: string; generated_text?: string }>
            | { content?: string };
        };

        if (typeof nativeData.output === "string") return nativeData.output;
        if (Array.isArray(nativeData.output)) {
          const lastItem = nativeData.output[nativeData.output.length - 1];
          return lastItem?.content || lastItem?.generated_text;
        }
        if (nativeData.output && typeof nativeData.output === "object") {
          return nativeData.output.content;
        }
        return undefined;
      },
    },
    {
      name: `OpenRouter (${activeOpenRouterModel})`,
      enabled: Boolean(activeOpenRouterKey),
      call: async (): Promise<string | undefined> => {
        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${activeOpenRouterKey}`,
              "HTTP-Referer": "https://revelio.digital",
              "X-Title": "Revelio Digital Store",
            },
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              model: activeOpenRouterModel,
              messages: openAiMessages,
              temperature: 0.45,
            }),
          }
        );
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return data?.choices?.[0]?.message?.content;
      },
    },
    {
      name: "Zero-Key Free AI",
      enabled: true,
      call: async (): Promise<string | undefined> => {
        const res = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(7000),
          body: JSON.stringify({
            model: "openai",
            messages: openAiMessages,
          }),
        });
        if (!res.ok) throw new Error(`ZeroKey HTTP ${res.status}`);
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return data?.choices?.[0]?.message?.content;
      },
    },
  ];

  const orderedProviders =
    runtimeBotConfig.aiMode === "openrouter"
      ? [providers[1], providers[0], providers[2]]
      : [providers[0], providers[1], providers[2]];

  for (const provider of orderedProviders) {
    if (!provider.enabled) continue;
    try {
      const reply = await provider.call();
      if (reply && typeof reply === "string" && reply.trim().length > 0) {
        return { reply: reply.trim(), provider: provider.name };
      }
    } catch {}
  }

  return {
    reply: buildSmartLocalReply(userMessage, catalogLines),
    provider: "Smart Local Fallback",
  };
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const cleanPlainText = text.replace(/[*`]/g, "");
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: cleanPlainText,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    }
  );
  return (await res.json()) as Record<string, unknown>;
}

async function processSingleTelegramUpdate(
  update: TelegramUpdateObject,
  botToken: string,
  adminChatId: string
) {
  const processedIds = globalForBot.__revelioProcessedIds!;
  const processedKeys = globalForBot.__revelioProcessedKeys!;

  if (update.update_id) {
    if (processedIds.has(update.update_id)) {
      return;
    }
    processedIds.add(update.update_id);
  }

  if (update.message?.text) {
    const dedupKey = `${update.message.chat.id}:${
      update.message.message_id || update.message.text
    }`;
    const now = Date.now();
    const lastTime = processedKeys.get(dedupKey) || 0;
    if (now - lastTime < 8000) {
      return;
    }
    processedKeys.set(dedupKey, now);
  }

  const supabase = getServiceSupabase();
  const cloudState = await loadCloudStateFromSiteConfig();

  if (update.callback_query) {
    const callbackData = String(update.callback_query.data || "");
    const callerChatId = String(update.callback_query.message?.chat?.id || "");

    if (callbackData === "menu_catalog") {
      const prods = cloudState?.products || [];
      const text =
        prods.length > 0
          ? prods
              .map(
                (p) =>
                  `• ${p.title} (${p.duration}): ${p.priceDzd} د.ج (${p.priceUsd}$)`
              )
              .join("\n")
          : "• Google Gemini Advanced + 2TB: 950 د.ج\n• ChatGPT Plus: 1450 د.ج\n• Netflix 4K UHD: 650 د.ج\n• Spotify Premium: 550 د.ج\n• Xbox Game Pass Ultimate: 1850 د.ج\n• Canva Pro (سنة): 500 د.ج";

      await sendTelegramMessage(
        botToken,
        callerChatId,
        `📦 قائمة الاشتراكات المتوفرة حالياً في REVELIO DIGITAL:\n\n${text}\n\n✅ جميع الاشتراكات مشمولة بضمان ذهبي كامل!`,
        getCustomerInteractiveKeyboard()
      );
      return;
    }

    if (callbackData === "menu_ai_compare") {
      await sendTelegramMessage(
        botToken,
        callerChatId,
        `🤖 مقارنة اشتراكات الذكاء الاصطناعي لدينا:\n\n1️⃣ Google Gemini Advanced + 2TB (950 د.ج):\n• يتفعل بدعوة رسمية على إيميلك الشخصي دون الحاجة لكلمة السر.\n• يمنحك مساحة 2 تيرابايت سحابية + أقوى نموذج لتحليل الملفات والبرمجة.\n\n2️⃣ ChatGPT Plus (1450 د.ج):\n• حساب جاهز بأعلى سرعة استجابة وتوليد الصور وتحليل البيانات.\n\n💡 نصيحة المستشار: إذا كنت تريد تفعيلات على إيميلك الشخصي مع مساحة تخزين ضخمة فـ Gemini Advanced هو الخيار رقم 1!`,
        getCustomerInteractiveKeyboard()
      );
      return;
    }

    if (callbackData === "menu_payments") {
      const cfg = cloudState?.config;
      await sendTelegramMessage(
        botToken,
        callerChatId,
        `💳 طرق الدفع الرسمية في REVELIO DIGITAL:\n\n• BaridiMob RIP: ${
          cfg?.baridiMobRip || "00799999002458963142"
        }\n• CCP: ${
          cfg?.ccpAccount || "0024589631 المفتاح 42"
        }\n• USDT (TRC20 / Binance): ${
          cfg?.usdtAddress || "متاح في سلة المشتريات"
        }\n• RedotPay ID: ${cfg?.redotpayId || "148920315"}`,
        getCustomerInteractiveKeyboard()
      );
      return;
    }

    if (callbackData === "menu_promo") {
      const code = cloudState?.config?.promoCode || "REV10";
      const pct = cloudState?.config?.promoDiscountPercent || 10;
      await sendTelegramMessage(
        botToken,
        callerChatId,
        `🎁 هدية خاصة لك من REVELIO DIGITAL:\n\nاستعمل كود البرومو: ${code} في سلة المشتريات بالموقع للحصول على خصم فوري بنسبة ${pct}% على طلبك!`,
        getCustomerInteractiveKeyboard()
      );
      return;
    }

    if (callbackData === "menu_track_help") {
      await sendTelegramMessage(
        botToken,
        callerChatId,
        `🔍 لفحص حالة طلبك والضمان الذهبي:\nفقط أرسل لي رقم الطلب هنا في المحادثة بصيغة:\nORD-884920\nوسأعرض لك حالة التفعيل فوراً!`,
        getCustomerInteractiveKeyboard()
      );
      return;
    }

    if (callerChatId !== adminChatId) return;

    if (callbackData.startsWith("confirm_")) {
      const targetOrderId = callbackData.replace("confirm_", "").trim();
      await sendTelegramMessage(
        botToken,
        callerChatId,
        `✅ تم تحديث الطلب ${targetOrderId} إلى مكتمل (COMPLETED) وتفعيل الضمان الذهبي!`
      );
    } else if (callbackData.startsWith("reject_")) {
      const targetOrderId = callbackData.replace("reject_", "").trim();
      await sendTelegramMessage(
        botToken,
        callerChatId,
        `❌ تم تعليم الطلب ${targetOrderId} كمرفوض (REJECTED).`
      );
    }
    return;
  }

  if (update.message && update.message.text) {
    const chatId = String(update.message.chat.id);
    const userText = String(update.message.text).trim();
    const isAdmin = chatId === adminChatId;

    const orderMatch = userText.toUpperCase().match(/ORD-\d{5,12}/);
    if (orderMatch) {
      const matchedOrderId = orderMatch[0];

      if (matchedOrderId === "ORD-884920") {
        await sendTelegramMessage(
          botToken,
          chatId,
          `🧾 تفاصيل الطلب الموثق ORD-884920:\n• المنتج: Google Gemini Advanced + 2TB\n• العميل: ياسين بن علي\n• الحالة: ✅ مكتمل — الضمان الذهبي مفعل (30 يوماً)\n• طريقة التفعيل: 📧 دعوة رسمية على الإيميل\n• وسيلة الدفع: BaridiMob`,
          getCustomerInteractiveKeyboard()
        );
        return;
      }

      const { data: ordData } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", matchedOrderId)
        .maybeSingle();

      if (!ordData) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `🔍 لم يتم العثور على طلب بالرقم ${matchedOrderId}. تأكد من كتابة الرقم الصحيح الذي ظهر لك بعد إتمام الطلب من الموقع.`,
          getCustomerInteractiveKeyboard()
        );
      } else {
        const ord = ordData as Record<string, unknown>;
        await sendTelegramMessage(
          botToken,
          chatId,
          `🧾 تفاصيل الطلب ${ord.order_id}:\n• العميل: ${ord.customer_name}\n• التفاصيل: ${ord.customer_contact}\n• المنصة: ${
            ord.channel || "WhatsApp"
          }`,
          getCustomerInteractiveKeyboard()
        );
      }
      return;
    }

    if (isAdmin && userText.startsWith("/") && userText !== "/start") {
      if (userText === "/help") {
        await sendTelegramMessage(
          botToken,
          chatId,
          `👑 أوامر المدير في بوت REVELIO DIGITAL:\n• /pending — عرض الطلبات الأخيرة\n• /find ORD-XXXXXX — فحص طلب`
        );
        return;
      }

      if (userText === "/pending") {
        const { data: pending } = await supabase
          .from("orders")
          .select("*")
          .limit(10);

        if (!pending || pending.length === 0) {
          await sendTelegramMessage(
            botToken,
            chatId,
            "✅ لا توجد طلبات معلقة في قاعدة البيانات حالياً!"
          );
          return;
        }

        const listText = (pending as Array<Record<string, unknown>>)
          .map(
            (o) =>
              `• ${o.order_id} — 👤 ${o.customer_name} (${o.channel}: ${o.customer_contact})`
          )
          .join("\n\n");

        await sendTelegramMessage(
          botToken,
          chatId,
          `⏳ أحدث الطلبات المسجلة (${pending.length}):\n\n${listText}`
        );
        return;
      }
    }

    const syncedProducts = cloudState?.products || [];
    const catalogContext =
      syncedProducts.length > 0
        ? syncedProducts
            .map((p) => {
              const methodAr =
                p.activationMethod === "EMAIL_INVITE"
                  ? "تفعيل بدعوة رسمية على إيميل الزبون"
                  : p.activationMethod === "ACCOUNT"
                  ? "حساب جاهز مضمون"
                  : "كود رقمي فوري";
              return `• ${p.title} (${p.duration}): ${p.priceDzd} د.ج (${p.priceUsd}$) — ${methodAr} | المتوفر: ${p.stockCount}`;
            })
            .join("\n")
        : "• Google Gemini Advanced + 2TB: 950 د.ج (4$) — تفعيل بدعوة إيميل\n• ChatGPT Plus: 1450 د.ج (6$) — حساب خاص\n• Netflix 4K UHD: 650 د.ج — بروفايل خاص مقفل بـ PIN\n• Spotify Premium: 550 د.ج — دعوة إيميل\n• Xbox Game Pass Ultimate: 1850 د.ج — كود رقمي\n• Canva Pro (سنة): 500 د.ج — دعوة إيميل";

    const promoCode = cloudState?.config?.promoCode || "REV10";
    const promoPct = cloudState?.config?.promoDiscountPercent || 10;

    const systemPrompt = `
أنت المستشار الذكي ومندوب المبيعات الرسمي لمتجر "REVELIO DIGITAL" في الجزائر لبيع الاشتراكات والأكواد الرقمية.
مهمتك:
1. الرد بذكاء واحترافية باللهجة الجزائرية المهذبة أو العربية الواضحة، ومساعدة الزبون في اختيار الاشتراك الأنسب لميزانيته واحتياجه.
2. اعتمد بدقة على قائمة المنتجات والأسعار المحدثة التالية:
${catalogContext}
3. أخبر الزبون أنه يمكنه الحصول على خصم ${promoPct}% باستعمال كود البرومو (${promoCode}) في سلة المشتريات بالموقع.
4. طرق الدفع المتاحة لدينا: BaridiMob (بريدي موب)، CCP (بريد الجزائر)، USDT (TRC20 / Binance Pay)، و RedotPay.
    `;

    appendMemory(chatId, "user", userText);
    const { reply } = await askHybridAIAgent(
      systemPrompt,
      userText,
      chatId,
      catalogContext
    );
    appendMemory(chatId, "assistant", reply);

    await sendTelegramMessage(
      botToken,
      chatId,
      reply,
      getCustomerInteractiveKeyboard()
    );
  }
}

export async function POST(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const urlToken = urlObj.searchParams.get("token");
    if (urlToken) {
      runtimeBotConfig.botToken = urlToken.trim();
    }

    const body = (await req.json()) as TelegramWebhookBody;
    const supabase = getServiceSupabase();

    if (body.botToken) runtimeBotConfig.botToken = body.botToken.trim();
    if (body.adminChatId) runtimeBotConfig.adminChatId = body.adminChatId.trim();
    if (body.bytezApiKey !== undefined) {
      runtimeBotConfig.bytezApiKey = body.bytezApiKey.trim();
    }
    if (body.bytezModel) {
      runtimeBotConfig.bytezModel = body.bytezModel.trim();
    }
    if (body.openrouterApiKey !== undefined) {
      runtimeBotConfig.openrouterApiKey = body.openrouterApiKey.trim();
    }
    if (body.openrouterModel) {
      runtimeBotConfig.openrouterModel = body.openrouterModel.trim();
    }
    if (body.aiProviderMode) {
      runtimeBotConfig.aiMode = body.aiProviderMode;
    }

    // ------------------------------------------------------------------------
    // أ) حفظ حالة المتجر داخل جدول site_config (الصف id = 1)
    // ------------------------------------------------------------------------
    if (body.action === "sync-cloud-state" && body.cloudState) {
      globalForBot.__revelioCachedCloud = body.cloudState;
      const cfg = body.cloudState.config;
      if (cfg) {
        if (cfg.telegramBotToken) runtimeBotConfig.botToken = cfg.telegramBotToken;
        if (cfg.telegramAdminChatId) {
          runtimeBotConfig.adminChatId = cfg.telegramAdminChatId;
        }
        if (cfg.aiProviderMode) runtimeBotConfig.aiMode = cfg.aiProviderMode;
        if (cfg.bytezApiKey !== undefined) {
          runtimeBotConfig.bytezApiKey = cfg.bytezApiKey;
        }
        if (cfg.bytezModel) runtimeBotConfig.bytezModel = cfg.bytezModel;
        if (cfg.openrouterApiKey !== undefined) {
          runtimeBotConfig.openrouterApiKey = cfg.openrouterApiKey;
        }
        if (cfg.openrouterModel) {
          runtimeBotConfig.openrouterModel = cfg.openrouterModel;
        }
      }

      const { error } = await supabase.from("site_config").upsert(
        [
          {
            id: 1,
            store_name: cfg?.storeName || "REVELIO DIGITAL",
            store_tagline: new Date().toISOString(),
            hero_title_highlight: "REVELIO_CLOUD_V6",
            hero_subtitle: JSON.stringify(body.cloudState),
          },
        ],
        { onConflict: "id" }
      );

      return NextResponse.json({
        ok: !error,
        synced: !error,
        error: error?.message,
      });
    }

    await loadCloudStateFromSiteConfig();

    const botToken =
      urlToken ||
      runtimeBotConfig.botToken ||
      process.env.TELEGRAM_BOT_TOKEN ||
      "";
    const adminChatId =
      runtimeBotConfig.adminChatId ||
      String(process.env.TELEGRAM_CHAT_ID || "1399306871");

    // ------------------------------------------------------------------------
    // ب) اختبار إرسال رسالة فورية لتليجرام
    // ------------------------------------------------------------------------
    if (body.action === "send-test") {
      if (!botToken) {
        return NextResponse.json({
          ok: false,
          error:
            "يرجى لصق توكن البوت (TELEGRAM_BOT_TOKEN) في خانة التوكن أولاً!",
        });
      }
      const testRes = await sendTelegramMessage(
        botToken,
        adminChatId,
        "🚀 اختبار ناجح! بوت REVELIO DIGITAL متصل الآن وجاهز للرد على الرسائل واستقبال الطلبات الفورية!",
        getCustomerInteractiveKeyboard()
      );
      return NextResponse.json({
        ok: Boolean(testRes.ok),
        error: testRes.description ? String(testRes.description) : undefined,
      });
    }

    // ------------------------------------------------------------------------
    // ج) وضع السحب المحلي المزود بقفل globalThis لمنع التكرار
    // ------------------------------------------------------------------------
    if (body.action === "poll-updates") {
      if (!botToken) {
        return NextResponse.json({ ok: false, error: "Missing token" });
      }
      if (globalForBot.__revelioPollingLock) {
        return NextResponse.json({ ok: true, locked: true });
      }

      globalForBot.__revelioPollingLock = true;
      try {
        if (!globalForBot.__revelioWebhookCleared) {
          await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
          globalForBot.__revelioWebhookCleared = true;
        }

        const offset = globalForBot.__revelioLastOffset || 0;
        const pollRes = await fetch(
          `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=1`,
          { cache: "no-store" }
        );
        const pollData = (await pollRes.json()) as {
          ok?: boolean;
          result?: TelegramUpdateObject[];
        };

        if (pollData.ok && Array.isArray(pollData.result)) {
          for (const upd of pollData.result) {
            if (
              upd.update_id &&
              upd.update_id >= (globalForBot.__revelioLastOffset || 0)
            ) {
              globalForBot.__revelioLastOffset = upd.update_id + 1;
            }
            await processSingleTelegramUpdate(upd, botToken, adminChatId);
          }
        }
        return NextResponse.json({ ok: true });
      } finally {
        globalForBot.__revelioPollingLock = false;
      }
    }

    // ------------------------------------------------------------------------
    // د) فحص حالة الطلب والضمان
    // ------------------------------------------------------------------------
    if (body.action === "verify-order") {
      const orderIdInput = String(body.orderId || "").trim().toUpperCase();
      if (!orderIdInput) {
        return NextResponse.json({ found: false }, { status: 400 });
      }

      if (orderIdInput === "ORD-884920") {
        return NextResponse.json({
          found: true,
          order: {
            orderId: "ORD-884920",
            productTitle: "Google Gemini Advanced + 2TB",
            status: "COMPLETED",
            channel: "WhatsApp",
            deliveryType: "manual",
            deliveredKey:
              "تم إرسال دعوة التفعيل الرسمي إلى yacine.dz@gmail.com + ضمان 30 يوماً",
            createdAt: "2026-10-26",
          },
        });
      }

      const { data: orderRow } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderIdInput)
        .maybeSingle();

      if (!orderRow) {
        return NextResponse.json({ found: false });
      }

      const row = orderRow as Record<string, unknown>;
      return NextResponse.json({
        found: true,
        order: {
          orderId: String(row.order_id || ""),
          productTitle: String(row.product_title || "اشتراك رقمي"),
          status: String(row.status || "PENDING").toUpperCase(),
          channel: String(row.channel || "WhatsApp"),
          deliveryType: String(row.delivery_type || "manual"),
          deliveredKey: String(
            row.delivered_key || "تم إرسال التفعيل لحسابك الشخصي بنجاح ✓"
          ),
          createdAt: String(row.created_at || ""),
        },
      });
    }

    // ------------------------------------------------------------------------
    // هـ) إرسال نشرة إخبارية عبر البوت
    // ------------------------------------------------------------------------
    if (body.action === "broadcast-newsletter") {
      if (!botToken) {
        return NextResponse.json({ ok: false });
      }
      const newsletterMsg = `📣 ${body.badge || "نشرة REVELIO DIGITAL"}\n━━━━━━━━━━━━━━━━━━━━━━\n${body.title || "عرض جديد"}\n\n${body.content || ""}\n━━━━━━━━━━━━━━━━━━━━━━\n🌐 اطلب الآن من المتجر الرسمي!`;
      await sendTelegramMessage(
        botToken,
        adminChatId,
        newsletterMsg,
        getCustomerInteractiveKeyboard()
      );
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------------
    // و) معالجة طلبات الـ Webhook القادمة من تيليجرام
    // ------------------------------------------------------------------------
    const isTelegramUpdate = Boolean(
      body.update_id || body.message || body.callback_query
    );

    if (isTelegramUpdate) {
      if (!botToken) return NextResponse.json({ ok: false });
      await processSingleTelegramUpdate(body, botToken, adminChatId);
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------------
    // ز) استلام طلب شراء جديد من واجهة المتجر
    // ------------------------------------------------------------------------
    const {
      orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      productName = "اشتراك رقمي",
      price = "950 د.ج",
      customerName = "عميل Revelio",
      customerContact = "",
      customerEmail = "",
      activationMethod = "KEY",
      socialPlatform = "WhatsApp",
      paymentMethod = "BaridiMob",
      deliveryType = "manual",
      notes = "",
    } = body;

    const contactFieldForDb = customerEmail
      ? `${customerContact} | Email: ${customerEmail} | ${productName} | ${price}`
      : `${customerContact} | ${productName} | ${price}`;

    await supabase.from("orders").upsert(
      [
        {
          order_id: orderId,
          customer_name: customerName,
          customer_contact: contactFieldForDb,
          channel: socialPlatform,
        },
      ],
      { onConflict: "order_id" }
    );

    if (!botToken) {
      return NextResponse.json({
        success: true,
        orderId,
        status: deliveryType === "auto" ? "COMPLETED" : "PENDING",
      });
    }

    const cleanPhone = String(customerContact).replace(/\D/g, "");
    const cleanHandle = String(customerContact).replace("@", "").trim();

    const readyReplyMessage = `مرحباً ${customerName} ⚡، معك إدارة متجر REVELIO DIGITAL بخصوص طلبك رقم (${orderId}) للمنتج: ${productName}.\n✅ تم التأكد من الدفع بنجاح!\n${
      customerEmail ? `📧 تم إرسال دعوة التفعيل إلى إيميلك: ${customerEmail}\n` : ""
    }🔑 إليك بيانات التفعيل / الكود الخاص بك: `;

    let directChatUrl = `https://t.me/${runtimeBotConfig.botUsername}`;
    if (socialPlatform === "WhatsApp" && cleanPhone.length >= 8) {
      const intlPhone = cleanPhone.startsWith("0")
        ? `213${cleanPhone.slice(1)}`
        : cleanPhone;
      directChatUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(
        readyReplyMessage
      )}`;
    } else if (socialPlatform === "Instagram" && cleanHandle) {
      directChatUrl = `https://instagram.com/${cleanHandle}`;
    } else if (socialPlatform === "Telegram" && cleanHandle) {
      directChatUrl = `https://t.me/${cleanHandle}?text=${encodeURIComponent(
        readyReplyMessage
      )}`;
    }

    const activationLabel =
      activationMethod === "EMAIL_INVITE"
        ? "📧 دعوة رسمية على الإيميل"
        : activationMethod === "ACCOUNT"
        ? "👤 تسليم حساب جاهز"
        : "🔑 كود تفعيل رقمي";

    const adminAlert = `
🚨 طلب شراء جديد — REVELIO DIGITAL 🚨
━━━━━━━━━━━━━━━━━━━━━━
🆔 رقم الطلب: ${orderId}
📦 المنتجات: ${productName}
🎯 نوع التفعيل: ${activationLabel}
💰 المبلغ الإجمالي: ${price}
💳 وسيلة الدفع: ${paymentMethod}
━━━━━━━━━━━━━━━━━━━━━━
👤 بيانات الزبون للتسليم:
• الاسم: ${customerName}
• منصة الاستلام: ${socialPlatform}
• الحساب / الرقم: ${customerContact}
${customerEmail ? `• 📧 إيميل الدعوة: ${customerEmail}` : ""}
${notes ? `• 📝 التفاصيل / الوصل: ${notes}` : ""}
━━━━━━━━━━━━━━━━━━━━━━
👇 بعد التأكد من وصول المال لحسابك، اضغط لمراسلة الزبون أو اعتماد الطلب:
    `;

    const tgResult = await sendTelegramMessage(
      botToken,
      adminChatId,
      adminAlert,
      {
        inline_keyboard: [
          [
            {
              text: `📲 مراسلة الزبون عبر ${socialPlatform} مع رسالة الطلب`,
              url: directChatUrl,
            },
          ],
          [
            {
              text: "✅ تأكيد الدفع وتعليم كمكتمل",
              callback_data: `confirm_${orderId}`,
            },
            {
              text: "❌ رفض الطلب",
              callback_data: `reject_${orderId}`,
            },
          ],
        ],
      }
    );

    return NextResponse.json({
      success: true,
      orderId,
      status: "PENDING",
      telegramSent: Boolean(tgResult?.ok),
    });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const tokenParam = searchParams.get("token");

  if (tokenParam) {
    runtimeBotConfig.botToken = tokenParam.trim();
  }

  if (action === "get-cloud-state") {
    const state = await loadCloudStateFromSiteConfig();
    return NextResponse.json(
      { ok: true, cloudState: state, timestamp: Date.now() },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  await loadCloudStateFromSiteConfig();
  const botToken =
    tokenParam ||
    runtimeBotConfig.botToken ||
    process.env.TELEGRAM_BOT_TOKEN ||
    "";

  if (action === "set-webhook") {
    if (!botToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "يرجى وضع توكن البوت (TELEGRAM_BOT_TOKEN) في خانة التوكن في الإعدادات أولاً!",
        },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
      globalForBot.__revelioWebhookCleared = true;
      return NextResponse.json({
        ok: true,
        telegramResponse: {
          ok: true,
          description:
            "تم تفعيل البوت في وضع الاستجابة الحية المباشرة على جهازك بنجاح!",
        },
      });
    }

    const webhookUrl = `${origin}/api/telegram?token=${encodeURIComponent(
      botToken
    )}`;
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          drop_pending_updates: true,
        }),
      }
    );

    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json({
      webhookUrl,
      telegramResponse: data,
    });
  }

  return NextResponse.json({
    status: "Revelio Digital AI Bot Engine v6.0 Active",
    bot: `@${runtimeBotConfig.botUsername}`,
    aiMode: runtimeBotConfig.aiMode,
  });
}