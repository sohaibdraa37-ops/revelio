export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, customerName, customerContact, itemsSummary, totalAmount, botToken, chatId } = body;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: "بيانات ربط تيليجرام غير مكتملة في لوحة الإدارة" }, { status: 400 });
    }

    const text = `
🚀 *طلب جديد في المتجر!*
━━━━━━━━━━━━━━━
🔖 *رقم الطلب:* \`${orderId}\`
👤 *اسم العميل:* ${customerName || "غير محدد"}
📞 *وسيلة التواصل:* ${customerContact || "لم يتم تقديمها"}
    
📦 *المنتجات المطلوبة:*
${itemsSummary}

💰 *المبلغ الإجمالي:* ${totalAmount}
━━━━━━━━━━━━━━━
⏳ *الحالة:* بانتظار تأكيد الدفع.
`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "فشل إرسال الرسالة لتيليجرام" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم إرسال الطلب بنجاح!" });
    
  } catch (error) {
    return NextResponse.json({ error: "خطأ داخلي في الخادم" }, { status: 500 });
  }
}