import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wtekbgfnxnahbgkevurx.supabase.co";

// 👈 الصق مفتاح NEXT_PUBLIC_SUPABASE_ANON_KEY (الذي يبدأ بـ eyJ...) هنا بين علامتي التنصيص ليعمل على الهاتف و Cloudflare فوراً:
const FALLBACK_ANON_KEY = "ضع_مفتاح_ANON_الخاص_بك_هنا";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseAnonKey !== "public-anon-key-placeholder" &&
    supabaseAnonKey !== "ضع_مفتاح_ANON_الخاص_بك_هنا"
);

// عميل المتصفح مزود بـ cache: "no-store" لمنع الهاتف من قراءة أي كاش قديم نهائياً
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        cache: "no-store",
      });
    },
  },
});

export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          cache: "no-store",
        });
      },
    },
  });
}