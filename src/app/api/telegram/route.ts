import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

const DEFAULT_DZD_RATE = 245;

// إعدادات البوت والـ AI في الذاكرة الحية (تتحدث مباشرة من لوحة الإدارة أو .env.local)
let runtimeBotConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  adminChatId: String(process.env.TELEGRAM_CHAT_ID || "1399306871"),
  botUsername: process.env.TELEGRAM_BOT_USERNAME || "REVELIO_ASSISTANT_BOT",
  aiMode: "openrouter" as "openrouter" | "zerokey" | "smart_rules",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterModel: process.env.OPENROUTER_MODEL || "openrouter/free",
  lastUpdateOffset: 0,
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

interface TelegramUpdateObject {
  update_id?: number;
  message?: {
    chat: { id: number | string };
    from?: { first_name?: string; username?: string };
    text?: string;
  };
  callback_query?: {
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
  openrouterApiKey?: string;
  openrouterModel?: string;
  aiProviderMode?: "openrouter" | "zerokey" | "smart_rules";
}

function buildSmartLocalReply(
  userMessage: string,
  catalogLines: string
): string {
  const q = userMessage.toLowerCase().trim();

  if (
    q === "/start" ||
    q.includes("سلام") ||
    q.includes("مرحبا") ||
    q.includes("اهلا") ||
    q.includes("salem") ||
    q.includes("salam")
  ) {
    return `مرحباً بك في *REVELIO DIGITAL* ⚡!\nأنا المساعد الرقمي الرسمي للمتجر.\n\n📦 *قائمة الاشتراكات المتوفرة حالياً:*\n${catalogLines}\n\n💳 *طرق الدفع المقبولة:*\n• BaridiMob (بريدي موب)\n• CCP (بريد الجزائر)\n• USDT (TRC20 / Binance Pay)\n• RedotPay\n\n🔍 *لتتبع طلبك أو ضمانك:* أرسل لي رقم الطلب فقط (مثال: \`ORD-884920\`).`;
  }

  if (
    q.includes("دفع") ||
    q.includes("بريدي") ||
    q.includes("ccp") ||
    q.includes("usdt") ||
    q.includes("baridi") ||
    q.includes("كيفاش نشري") ||
    q.includes("طريقة الشراء")
  ) {
    return `💳 *طرق الدفع المتوفرة في REVELIO DIGITAL:*\n1️⃣ *BaridiMob (بريدي موب)*\n2️⃣ *CCP (بريد الجزائر)*\n3️⃣ *USDT (TRC20 / Binance Pay)*\n4️⃣ *RedotPay*\n\n✅ *طريقة الطلب:* اختر المنتج من الموقع وأضفه للسلة، اختر وسيلة الدفع المناسبة لك، واكتب رقمك في واتساب أو معرفك في إنستغرام/تيليجرام (وإيميلك إذا كان التفعيل بدعوة)، وسنرسل لك التفعيل فور مراجعة الدفع مع ضمان ذهبي شامل!`;
  }

  return `⚡ *مرحباً بك في REVELIO DIGITAL!*\nإليك قائمة الاشتراكات والأسعار الرسمية المتوفرة لدينا الآن:\n\n${catalogLines}\n\n💳 نقبل الدفع عبر: *BaridiMob • CCP • USDT • RedotPay*\n📲 اطلب مباشرة من الموقع وسنرسل لك التفعيل (كود، دعوة إيميل، أو حساب جاهز) فور تأكيد الدفع!`;
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

  const activeOpenRouterKey =
    runtimeBotConfig.openrouterApiKey || process.env.OPENROUTER_API_KEY || "";
  const activeOpenRouterModel =
    runtimeBotConfig.openrouterModel ||
    process.env.OPENROUTER_MODEL ||
    "openrouter/free";

  const providers = [
    {
      name: `OpenRouter (${activeOpenRouterModel})`,
      enabled:
        runtimeBotConfig.aiMode === "openrouter" && Boolean(activeOpenRouterKey),
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
            signal: AbortSignal.timeout(7500),
            body: JSON.stringify({
              model: activeOpenRouterModel,
              messages: openAiMessages,
              temperature: 0.4,
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

  for (const provider of providers) {
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
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    }
  );
  return (await res.json()) as Record<string, unknown>;
}

// ============================================================================
// دالة موحدة لمعالجة أي رسالة أو ضغطة زر في تيليجرام (تعمل في Webhook وفي Polling)
// ============================================================================
async function processSingleTelegramUpdate(
  update: TelegramUpdateObject,
  botToken: string,
  adminChatId: string
) {
  const supabase = getServiceSupabase();

  if (update.callback_query) {
    const callbackData = String(update.callback_query.data || "");
    const callerChatId = String(update.callback_query.message?.chat?.id || "");

    if (callerChatId !== adminChatId) return;

    if (callbackData.startsWith("confirm_")) {
      const targetOrderId = callbackData.replace("confirm_", "").trim();
      await supabase
        .from("orders")
        .update({ status: "COMPLETED" })
        .eq("order_id", targetOrderId);

      await sendTelegramMessage(
        botToken,
        callerChatId,
        `✅ *تم تحديث الطلب* \`${targetOrderId}\` *إلى مكتمل (COMPLETED) وتفعيل الضمان الذهبي!*`
      );
    } else if (callbackData.startsWith("reject_")) {
      const targetOrderId = callbackData.replace("reject_", "").trim();
      await supabase
        .from("orders")
        .update({ status: "REJECTED" })
        .eq("order_id", targetOrderId);

      await sendTelegramMessage(
        botToken,
        callerChatId,
        `❌ *تم تعليم الطلب* \`${targetOrderId}\` *كمرفوض (REJECTED).*`
      );
    }
    return;
  }

  if (update.message && update.message.text) {
    const chatId = String(update.message.chat.id);
    const userText = String(update.message.text).trim();
    const isAdmin = chatId === adminChatId;

    // فحص تلقائي إذا أرسل المستخدم رقم طلب ORD-XXXXXX
    const orderMatch = userText.toUpperCase().match(/ORD-\d{5,12}/);
    if (orderMatch) {
      const matchedOrderId = orderMatch[0];
      const { data: ordData } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", matchedOrderId)
        .maybeSingle();

      if (!ordData) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `🔍 لم يتم العثور على طلب بالرقم \`${matchedOrderId}\`. تأكد من كتابة الرقم بشكل صحيح.`
        );
      } else {
        const ord = ordData as Record<string, unknown>;
        const st = String(ord.status || "PENDING").toUpperCase();
        const statusAr =
          st === "COMPLETED"
            ? "✅ مكتمل — الضمان الذهبي مفعل"
            : st === "REJECTED"
            ? "❌ مرفوض"
            : "⏳ قيد مراجعة وصول الدفع والتفعيل";

        await sendTelegramMessage(
          botToken,
          chatId,
          `🧾 *تفاصيل الطلب* \`${ord.order_id}\`:\n• *المنتج:* ${ord.product_title}\n• *الحالة:* ${statusAr}\n• *وسيلة الدفع:* ${ord.payment_method || "BaridiMob"}\n• *منصة الاستلام:* ${ord.channel}`
        );
      }
      return;
    }

    // أوامر الإدارة السريعة
    if (isAdmin && userText.startsWith("/")) {
      if (userText === "/help") {
        await sendTelegramMessage(
          botToken,
          chatId,
          `👑 *أوامر المدير في بوت REVELIO DIGITAL:*\n• \`/pending\` — عرض الطلبات المعلقة\n• \`/today\` — مبيعات اليوم\n• \`/stock\` — تقرير المخزون\n• \`/find ORD-XXXXXX\` — فحص طلب`
        );
        return;
      }

      if (userText === "/pending") {
        const { data: pending } = await supabase
          .from("orders")
          .select(
            "order_id, product_title, customer_name, customer_contact, channel, amount_dzd, payment_method"
          )
          .eq("status", "PENDING")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!pending || pending.length === 0) {
          await sendTelegramMessage(
            botToken,
            chatId,
            "✅ لا توجد طلبات معلقة حالياً!"
          );
          return;
        }

        const listText = (pending as Array<Record<string, unknown>>)
          .map(
            (o) =>
              `• \`${o.order_id}\` — *${o.product_title}*\n  👤 ${o.customer_name} (${o.channel}: \`${o.customer_contact}\`)\n  💰 ${o.amount_dzd} د.ج (${o.payment_method || "BaridiMob"})`
          )
          .join("\n\n");

        await sendTelegramMessage(
          botToken,
          chatId,
          `⏳ *الطلبات المعلقة (${pending.length}):*\n\n${listText}`
        );
        return;
      }

      if (userText === "/stock") {
        const { data: prods } = await supabase
          .from("products")
          .select("title, stock_count, price_usd")
          .order("stock_count", { ascending: true });

        const stockText =
          prods && prods.length > 0
            ? (prods as Array<Record<string, unknown>>)
                .map(
                  (p) =>
                    `${Number(p.stock_count) <= 5 ? "🔴" : "🟢"} *${p.title}*: متبقي \`${p.stock_count}\` (${p.price_usd}$)`
                )
                .join("\n")
            : "لا توجد منتجات مسجلة في Supabase بعد.";

        await sendTelegramMessage(
          botToken,
          chatId,
          `📦 *تقرير المخزون الحالي:*\n\n${stockText}`
        );
        return;
      }

      if (userText === "/today") {
        const todayIso = new Date().toISOString().split("T")[0];
        const { data: todayOrders } = await supabase
          .from("orders")
          .select("amount_dzd, status")
          .gte("created_at", `${todayIso}T00:00:00`);

        const rows = (todayOrders || []) as Array<Record<string, unknown>>;
        const completed = rows.filter(
          (o) => String(o.status).toUpperCase() === "COMPLETED"
        );
        const totalDzd = completed.reduce(
          (acc, o) => acc + Number(o.amount_dzd || 0),
          0
        );

        await sendTelegramMessage(
          botToken,
          chatId,
          `📊 *إحصائيات اليوم (${todayIso}):*\n• إجمالي الطلبات: ${rows.length}\n• المكتملة: ${completed.length}\n• المبيعات المؤكدة: *${totalDzd.toLocaleString()} د.ج*`
        );
        return;
      }
    }

    const { data: dbProducts } = await supabase
      .from("products")
      .select("title, duration, price_usd, stock_count");

    const catalogContext =
      dbProducts && dbProducts.length > 0
        ? (dbProducts as Array<Record<string, unknown>>)
            .map((p) => {
              const usd = Number(p.price_usd || 4);
              const dzd = Math.round(usd * DEFAULT_DZD_RATE);
              return `• ${p.title} (${p.duration || "شهر"}): ${dzd} د.ج (${usd}$) | المتوفر: ${p.stock_count ?? 12}`;
            })
            .join("\n")
        : "• Google Gemini Advanced + 2TB: 950 د.ج (4$) — تفعيل بدعوة إيميل\n• ChatGPT Plus: 1450 د.ج (6$) — حساب خاص\n• Netflix 4K UHD: 650 د.ج — بروفايل خاص مقفل بـ PIN\n• Spotify Premium: 550 د.ج — دعوة إيميل\n• Xbox Game Pass Ultimate: 1850 د.ج — كود رقمي\n• Canva Pro (سنة): 500 د.ج — دعوة إيميل";

    const systemPrompt = `
أنت المساعد الذكي الرسمي لمتجر "REVELIO DIGITAL" (@${runtimeBotConfig.botUsername}) في الجزائر لبيع الاشتراكات والأكواد الرقمية.
قائمة المنتجات والأسعار الرسمية:
${catalogContext}
طرق الدفع: BaridiMob، CCP، USDT (TRC20 / Binance)، و RedotPay.
أجب باختصار وأناقة باللهجة الجزائرية المهذبة أو العربية الواضحة.
    `;

    appendMemory(chatId, "user", userText);
    const { reply } = await askHybridAIAgent(
      systemPrompt,
      userText,
      chatId,
      catalogContext
    );
    appendMemory(chatId, "assistant", reply);

    await sendTelegramMessage(botToken, chatId, reply);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TelegramWebhookBody;
    const supabase = getServiceSupabase();

    if (body.botToken) runtimeBotConfig.botToken = body.botToken.trim();
    if (body.adminChatId) runtimeBotConfig.adminChatId = body.adminChatId.trim();
    if (body.openrouterApiKey !== undefined) {
      runtimeBotConfig.openrouterApiKey = body.openrouterApiKey.trim();
    }
    if (body.openrouterModel) {
      runtimeBotConfig.openrouterModel = body.openrouterModel.trim();
    }
    if (body.aiProviderMode) {
      runtimeBotConfig.aiMode = body.aiProviderMode;
    }

    const botToken =
      runtimeBotConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
    const adminChatId =
      runtimeBotConfig.adminChatId ||
      String(process.env.TELEGRAM_CHAT_ID || "1399306871");

    // ------------------------------------------------------------------------
    // أ) وضع السحب الحي (Live Local Polling) — يجعل البوت يرد حتى على localhost!
    // ------------------------------------------------------------------------
    if (body.action === "poll-updates") {
      if (!botToken) {
        return NextResponse.json({
          ok: false,
          error:
            "لم يتم إدخال TELEGRAM_BOT_TOKEN بعد. ضعه في خانة توكن البوت في لوحة الإدارة!",
        });
      }

      // حذف أي Webhook قديم معلق لكي يسمح تيليجرام بالسحب المباشر على localhost
      if (runtimeBotConfig.lastUpdateOffset === 0) {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
      }

      const pollRes = await fetch(
        `https://api.telegram.org/bot${botToken}/getUpdates?offset=${runtimeBotConfig.lastUpdateOffset}&timeout=1`
      );
      const pollData = (await pollRes.json()) as {
        ok?: boolean;
        description?: string;
        result?: TelegramUpdateObject[];
      };

      if (!pollData.ok) {
        return NextResponse.json({
          ok: false,
          error: pollData.description || "توكن البوت غير صالح",
        });
      }

      const updates = pollData.result || [];
      for (const upd of updates) {
        if (upd.update_id) {
          runtimeBotConfig.lastUpdateOffset = upd.update_id + 1;
        }
        await processSingleTelegramUpdate(upd, botToken, adminChatId);
      }

      return NextResponse.json({
        ok: true,
        processedCount: updates.length,
        nextOffset: runtimeBotConfig.lastUpdateOffset,
      });
    }

    // ------------------------------------------------------------------------
    // ب) إرسال رسالة تجريبية فورية للتأكد من عمل البوت
    // ------------------------------------------------------------------------
    if (body.action === "send-test") {
      if (!botToken) {
        return NextResponse.json({
          ok: false,
          error: "يرجى وضع TELEGRAM_BOT_TOKEN أولاً في الخانة المخصصة!",
        });
      }
      const testRes = await sendTelegramMessage(
        botToken,
        adminChatId,
        `🚀 *اتصال ناجح!* بوت *REVELIO DIGITAL* متصل الآن بموقعك وجاهز للرد على \`/start\` واستقبال إشعارات الطلبات الفورية!`
      );
      return NextResponse.json({
        ok: Boolean(testRes.ok),
        telegramResponse: testRes,
      });
    }

    // ------------------------------------------------------------------------
    // ج) فحص حالة الطلب والضمان
    // ------------------------------------------------------------------------
    if (body.action === "verify-order") {
      const orderIdInput = String(body.orderId || "").trim().toUpperCase();
      const contactLast4 = String(body.contactLast4 || "").trim();

      if (!orderIdInput) {
        return NextResponse.json(
          { found: false, error: "يرجى إدخال رقم الطلب" },
          { status: 400 }
        );
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
      const savedContact = String(row.customer_contact || "");
      const isContactVerified =
        !contactLast4 ||
        savedContact.toLowerCase().includes(contactLast4.toLowerCase());

      return NextResponse.json({
        found: true,
        order: {
          orderId: String(row.order_id || ""),
          productTitle: String(row.product_title || "اشتراك رقمي"),
          status: String(row.status || "PENDING").toUpperCase(),
          channel: String(row.channel || "WhatsApp"),
          deliveryType: String(row.delivery_type || "manual"),
          deliveredKey:
            String(row.status || "").toUpperCase() === "COMPLETED" &&
            isContactVerified
              ? String(
                  row.delivered_key ||
                    "تم إرسال التفعيل إلى حسابك الشخصي بنجاح ✓"
                )
              : "",
          createdAt: String(row.created_at || ""),
        },
      });
    }

    // ------------------------------------------------------------------------
    // د) إرسال نشرة إخبارية عبر البوت
    // ------------------------------------------------------------------------
    if (body.action === "broadcast-newsletter") {
      if (!botToken) {
        return NextResponse.json({
          ok: false,
          warning: "TELEGRAM_BOT_TOKEN غير مضبوط بعد",
        });
      }

      const newsletterMsg = `📣 *${body.badge || "نشرة REVELIO DIGITAL"}*\n━━━━━━━━━━━━━━━━━━━━━━\n*${body.title || "عرض جديد"}*\n\n${body.content || ""}\n━━━━━━━━━━━━━━━━━━━━━━\n🌐 اطلب الآن من المتجر الرسمي!`;

      await sendTelegramMessage(botToken, adminChatId, newsletterMsg);
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------------
    // هـ) معالجة طلبات الـ Webhook القادمة من تيليجرام
    // ------------------------------------------------------------------------
    const isTelegramUpdate = Boolean(
      body.update_id || body.message || body.callback_query
    );

    if (isTelegramUpdate) {
      if (!botToken) {
        return NextResponse.json({ ok: false });
      }
      await processSingleTelegramUpdate(body, botToken, adminChatId);
      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------------
    // و) تسجيل طلب شراء جديد وإرسال إشعار فوري للمدير
    // ------------------------------------------------------------------------
    const {
      orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      productId = "",
      productName = "اشتراك رقمي",
      price = "950 د.ج",
      amountUsd = 4,
      amountDzd = 950,
      customerName = "عميل Revelio",
      customerContact = "",
      customerEmail = "",
      activationMethod = "KEY",
      socialPlatform = "WhatsApp",
      paymentMethod = "BaridiMob",
      deliveryType = "manual",
      notes = "",
    } = body;

    let finalDeliveredKey = "";
    const effectiveMode = deliveryType === "auto" ? "auto" : "manual";

    if (effectiveMode === "auto") {
      const { data: availableKey } = await supabase
        .from("inventory_keys")
        .select("id, secret_key")
        .eq("product_id", productId)
        .eq("is_used", false)
        .limit(1)
        .maybeSingle();

      if (availableKey) {
        const keyRow = availableKey as Record<string, unknown>;
        finalDeliveredKey = String(keyRow.secret_key || "");
        await supabase
          .from("inventory_keys")
          .update({
            is_used: true,
            order_id: orderId,
            used_at: new Date().toISOString(),
          })
          .eq("id", keyRow.id);
      }
    }

    const initialStatus =
      effectiveMode === "auto" && finalDeliveredKey ? "COMPLETED" : "PENDING";

    const contactFieldForDb = customerEmail
      ? `${customerContact} | Email: ${customerEmail}`
      : customerContact;

    await supabase.from("orders").upsert(
      [
        {
          order_id: orderId,
          customer_name: customerName,
          customer_contact: contactFieldForDb,
          channel: socialPlatform,
          product_id: productId,
          product_title: productName,
          amount_usd: Number(amountUsd || 4),
          amount_dzd: Number(amountDzd || 950),
          payment_method: paymentMethod,
          delivery_type: effectiveMode,
          status: initialStatus,
          delivered_key: finalDeliveredKey,
        },
      ],
      { onConflict: "order_id" }
    );

    if (!botToken) {
      return NextResponse.json({
        success: true,
        orderId,
        status: initialStatus,
        deliveredCode: finalDeliveredKey || undefined,
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
🚨 *طلب شراء جديد — REVELIO DIGITAL* 🚨
━━━━━━━━━━━━━━━━━━━━━━
🆔 *رقم الطلب:* \`${orderId}\`
📦 *المنتجات:* ${productName}
🎯 *نوع التفعيل:* ${activationLabel}
💰 *المبلغ الإجمالي:* *${price}*
💳 *وسيلة الدفع:* *${paymentMethod}*
━━━━━━━━━━━━━━━━━━━━━━
👤 *بيانات الزبون للتسليم:*
• *الاسم:* ${customerName}
• *منصة الاستلام:* ${socialPlatform}
• *الحساب / الرقم:* \`${customerContact}\`
${customerEmail ? `• 📧 *إيميل الدعوة:* \`${customerEmail}\`` : ""}
${notes ? `• 📝 *التفاصيل / الوصل:* ${notes}` : ""}
━━━━━━━━━━━━━━━━━━━━━━
👇 *بعد التأكد من وصول المال لحسابك، اضغط لمراسلة الزبون أو اعتماد الطلب:*
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
      status: initialStatus,
      deliveredCode: finalDeliveredKey || undefined,
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

  const botToken =
    runtimeBotConfig.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";

  if (action === "set-webhook") {
    if (!botToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "يرجى إدخال TELEGRAM_BOT_TOKEN أولاً في خانة التوكن!",
        },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return NextResponse.json({
        ok: false,
        isLocalhost: true,
        error:
          "أنت تعمل حالياً على localhost؛ خوادم تيليجرام لا تقبل Webhook على localhost. لذلك قمنا بتشغيل (وضع السحب الحي المباشر Polling) ليرد البوت على /start فوراً من جهازك!",
      });
    }

    const webhookUrl = `${origin}/api/telegram`;
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          ...(webhookSecret ? { secret_token: webhookSecret } : {}),
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
    status: "Revelio Digital Hybrid Bot Engine v5.0 Active",
    bot: `@${runtimeBotConfig.botUsername}`,
    hasToken: Boolean(botToken),
  });
}