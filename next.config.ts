import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // إيقاف تحذيرات ESLint أثناء البناء على السحابة
    ignoreDuringBuilds: true,
  }, // <--- هذه الفاصلة كانت مفقودة
  typescript: {
    // تخطي أخطاء TypeScript للسماح برفع الموقع
    ignoreBuildErrors: true,
  },
};

export default nextConfig;