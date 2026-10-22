import { createClient } from '@supabase/supabase-js';

// نضع المفاتيح كخيار بديل لتفادي انهيار البناء في خوادم Cloudflare
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wtekbgfnxnahbgkevurx.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0ZWtiZ2ZueG5haGJna2V2dXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2OTU4MzEsImV4cCI6MjEwODI3MTgzMX0.BCRlItzVevZA2mhoFSXOX7BdPsRZO5Y53RDhszvcihk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);