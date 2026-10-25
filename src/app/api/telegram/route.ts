import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "REVELIO_ASSISTANT_BOT";
const DEFAULT_DZD_RATE = 245;

// إعدادات runtime المحفوظة في الذاكرة عند تحديثها من لوحة الإدارة
let runtimeAiConfig = {
  mode: "openrouter" as "openrouter" | "zerokey" | "smart_rules",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterModel: process.env.OPENROUTER_MODEL || "openrouter/free",
};

// ذاكرة محادثة خفيفة لحفظ سياق آخر 6 رسائل لكل مستخدم
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

interface TelegramWebhookBody {
  action?: string;
  orderId?: string;
  contactLast4?: string;
  title?: string;
  badge?: string;
  content?: string;
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
  openrouterApiKey?: string;
  openrouterModel?: string;
  aiProviderMode?: "openrouter" | "zerokey" | "smart_rules";
}

// ============================================================================
// 1. الرد الذكي المحلي (يعمل 100% بدون أي API خارجي مباشرة من قاعدة البيانات)
// ============================================================================
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
    return `مرحباً بك في *REVELIO DIGITAL* ⚡!\nأنا المساعد الرقمي الرسمي للمتجر.\n\n📦 *قائمة الاشتراكات المتوفرة حالياً:*\n${catalogLines}\n\n💳 *طرق الدفع المقبولة:*\n• BaridiMob (بريدي موب)\n• CCP (بريد الجزائر)\n• USDT (TRC20 / Binance Pay)\n• RedotPay\n\n🔍 *لتتبع طلبك:* أرسل لي رقم الطلب فقط (مثال: \`ORD-884920\`).`;
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

  if (
    q.includes("ضمان") ||
    q.includes("مضمون") ||
    q.includes("ثقة") ||
    q.includes("مشكلة")
  ) {
    return `🛡️ *الضمان الذهبي من REVELIO DIGITAL:*\nجميع اشتراكاتنا أصلية 100% ومشمولة بضمان ذهبي طوال مدة الاشتراك.\n• يمكنك التحقق من حالة ضمانك في أي وقت من قسم (فاحص الضمان) في الموقع أو بإرسال رقم طلبك \`ORD-XXXXXX\` هنا في المحادثة.`;
  }

  return `⚡ *مرحباً بك في REVELIO DIGITAL!*\nإليك قائمة الاشتراكات والأسعار الرسمية المتوفرة لدينا الآن:\n\n${catalogLines}\n\n💳 نقبل الدفع عبر: *BaridiMob • CCP • USDT • RedotPay*\n📲 اطلب مباشرة من الموقع وسنرسل لك التفعيل (كود، دعوة إيميل، أو حساب جاهز) فور تأكيد الدفع!`;
}

// ============================================================================
// 2. محرك الذكاء الاصطناعي الهجين (OpenRouter.ai + Zero-Key AI + الرد المحلي)
// ============================================================================
async function askHybridAIAgent(
  systemPrompt: string,
  userMessage: string,
  chatId: string,
  catalogLines: string
): Promise<{ reply: string; provider: string }> {
  // إذا اختار المدير وضع الرد المباشر بدون AI خارجي
  if (runtimeAiConfig.mode === "smart_rules") {
    return {
      reply: buildSmartLocalReply(userMessage, catalogLines),
      provider: "Smart Local Engine (No API Needed)",
    };
  }

  const history = chatMemory.get(chatId) || [];
  const openAiMessages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  const activeOpenRouterKey =
    runtimeAiConfig.openrouterApiKey || process.env.OPENROUTER_API_KEY || "";
  const activeOpenRouterModel =
    runtimeAiConfig.openrouterModel ||
    process.env.OPENROUTER_MODEL ||
    "openrouter/free";

  const providers = [
    {
      name: `OpenRouter (${activeOpenRouterModel})`,
      enabled:
        runtimeAiConfig.mode === "openrouter" && Boolean(activeOpenRouterKey),
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
          signal: AbortSignal.timeout(7500),
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
    } catch {
      console.warn(`[AI Rotator] ${provider.name} timed out, switching...`);
    }
  }

  return {
    reply: buildSmartLocalReply(userMessage, catalogLines),
    provider: "Smart Local Fallback",
  };
}

// دالة إرسال رسائل تيليجرام
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
// 3. معالج الطلبات الرئيسي (POST)
// ============================================================================
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TelegramWebhookBody;
    const supabase = getServiceSupabase();

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const adminChatId = String(process.env.TELEGRAM_CHAT_ID || "1399306871");
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";

    // تحديث إعدادات OpenRouter في الذاكرة إذا أرسلتها الواجهة
    if (body.openrouterApiKey !== undefined) {
      runtimeAiConfig.openrouterApiKey = body.openrouterApiKey;
    }
    if (body.openrouterModel) {
      runtimeAiConfig.openrouterModel = body.openrouterModel;
    }
    if (body.aiProviderMode) {
      runtimeAiConfig.aiProviderMode = body.aiProviderMode;
    }

    // ------------------------------------------------------------------------
    // أ) فحص حالة الطلب والضمان من الواجهة (Action: verify-order)
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
    // ب) إرسال نشرة إخبارية أو عرض جديد عبر البوت (Action: broadcast-newsletter)
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
    // ج) معالجة التحديثات القادمة من تيليجرام (الأزرار + الأوامر + محادثة الزبائن)
    // ------------------------------------------------------------------------
    const isTelegramUpdate = Boolean(
      body.update_id || body.message || body.callback_query
    );

    if (isTelegramUpdate) {
      const incomingHeaderSecret = req.headers.get(
        "x-telegram-bot-api-secret-token"
      );
      if (
        webhookSecret &&
        incomingHeaderSecret &&
        incomingHeaderSecret !== webhookSecret
      ) {
        return NextResponse.json(
          { error: "Unauthorized webhook signature" },
          { status: 401 }
        );
      }

      if (!botToken) {
        return NextResponse.json({
          ok: false,
          warning: "TELEGRAM_BOT_TOKEN not configured",
        });
      }

      // 1) معالجة ضغط المدير على أزرار تأكيد أو رفض الطلب داخل تيليجرام
      if (body.callback_query) {
        const callbackData = String(body.callback_query.data || "");
        const callerChatId = String(
          body.callback_query.message?.chat?.id || ""
        );

        if (callerChatId !== adminChatId) {
          return NextResponse.json({ ok: true });
        }

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

        return NextResponse.json({ ok: true });
      }

      // 2) معالجة الرسائل النصية في البوت
      if (body.message && body.message.text) {
        const chatId = String(body.message.chat.id);
        const userText = String(body.message.text).trim();
        const isAdmin = chatId === adminChatId;

        // إذا أرسل الزبون أو المدير رقم طلب بصيغة ORD-XXXXXX، نبحث عنه تلقائياً!
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
          return NextResponse.json({ ok: true });
        }

        // أوامر خاصة بالمدير فقط
        if (isAdmin && userText.startsWith("/")) {
          if (userText === "/help") {
            await sendTelegramMessage(
              botToken,
              chatId,
              `👑 *أوامر المدير في بوت REVELIO DIGITAL:*\n• \`/pending\` — عرض الطلبات المعلقة بانتظار التفعيل\n• \`/today\` — إحصائيات ومبيعات اليوم\n• \`/stock\` — تقرير المخزون المتبقي\n• \`/find ORD-XXXXXX\` — فحص بيانات أي طلب`
            );
            return NextResponse.json({ ok: true });
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
              return NextResponse.json({ ok: true });
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
              `⏳ *الطلبات المعلقة بانتظار التفعيل (${pending.length}):*\n\n${listText}`
            );
            return NextResponse.json({ ok: true });
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
            return NextResponse.json({ ok: true });
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
            return NextResponse.json({ ok: true });
          }

          if (userText.startsWith("/find")) {
            const searchId = userText.replace("/find", "").trim().toUpperCase();
            const { data: ord } = await supabase
              .from("orders")
              .select("*")
              .eq("order_id", searchId)
              .maybeSingle();

            if (!ord) {
              await sendTelegramMessage(
                botToken,
                chatId,
                `❌ لم يتم العثور على الطلب \`${searchId}\``
              );
            } else {
              const o = ord as Record<string, unknown>;
              await sendTelegramMessage(
                botToken,
                chatId,
                `🔍 *بيانات الطلب* \`${o.order_id}\`:\n• المنتج: ${o.product_title}\n• العميل: ${o.customer_name}\n• التواصل: ${o.channel} (\`${o.customer_contact}\`)\n• الحالة: *${o.status}*`
              );
            }
            return NextResponse.json({ ok: true });
          }
        }

        // جلب الكتالوج الحقيقي من Supabase لتغذية البوت
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
أنت المساعد الذكي الرسمي لمتجر "REVELIO DIGITAL" (@${BOT_USERNAME}) في الجزائر لبيع الاشتراكات والأكواد الرقمية.
قواعد صارمة:
1. اعتمد فقط على قائمة المنتجات والأسعار الرسمية التالية:
${catalogContext}
2. طرق الدفع المتاحة لدينا هي: BaridiMob (بريدي موب)، CCP (بريد الجزائر)، USDT (TRC20 / Binance Pay)، و RedotPay.
3. طرق التسليم لدينا تشمل: إرسال كود رقمي، أو إرسال دعوة تفعيل رسمية على إيميل الزبون، أو تسليم حساب جاهز، ويتم ذلك عبر واتساب أو إنستغرام أو تيليجرام فور مراجعة الدفع مع ضمان ذهبي شامل.
4. أجب باختصار وأناقة باللهجة الجزائرية المهذبة أو العربية الواضحة.
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
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // ------------------------------------------------------------------------
    // د) استلام طلب شراء جديد من واجهة المتجر وحفظه وإرسال إشعار غني للمدير
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

    let directChatUrl = `https://t.me/${BOT_USERNAME}`;
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

// ============================================================================
// 4. تفعيل الـ Webhook وفحص حالة البوت (GET)
// ============================================================================
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";

  if (action === "set-webhook") {
    if (!botToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "يرجى وضع TELEGRAM_BOT_TOKEN في ملف .env.local (أو في إعدادات Cloudflare Variables)",
        },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
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
      securedWithSecretToken: Boolean(webhookSecret),
      telegramResponse: data,
    });
  }

  return NextResponse.json({
    status: "Revelio Digital Hybrid Telegram Bot & Order Engine v4.5 Active",
    endpoint: "/api/telegram",
    bot: `@${BOT_USERNAME}`,
    aiMode: runtimeAiConfig.mode,
  });
}