import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wtekbgfnxnahbgkevurx.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key-placeholder";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "public-anon-key-placeholder"
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * عميل خاص بالخادم (Server API Routes) يستخدم مفتاح Service Role إن وجد
 * لتنفيذ العمليات الحساسة مثل تسليم الأكواد وتحديث الطلبات من بوت تيليجرام
 */
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}