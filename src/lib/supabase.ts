import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wtekbgfnxnahbgkevurx.supabase.co";

// 👈 الصق مفتاح NEXT_PUBLIC_SUPABASE_ANON_KEY (الذي يبدأ بـ eyJ...) هنا بين علامتي التنصيص:
const FALLBACK_ANON_KEY = "sb_publishable_whDYJXaopRtJgsLD1oU_Ww_1jntUPCK";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseAnonKey !== "public-anon-key-placeholder" &&
    supabaseAnonKey !== "sb_publishable_whDYJXaopRtJgsLD1oU_Ww_1jntUPCK"
);

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