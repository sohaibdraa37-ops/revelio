"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Sliders, Eye, EyeOff, Zap, Layers, Box, Radio } from "lucide-react";
import { useRevelioStore } from "./store-data";

interface ParticleNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  pulse: number;
}

export default function CyberVisualEngine() {
  const { config, setConfig } = useRevelioStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFxPanelOpen, setIsFxPanelOpen] = useState<boolean>(false);

  const fx = config.visualFx || {
    liveCanvas3D: true,
    kineticMarquee: true,
    tilt3DCards: true,
    laserBeams: true,
    hudOverlay: true,
  };

  const toggleEffect = (key: keyof typeof fx) => {
    setConfig({
      visualFx: {
        ...fx,
        [key]: !fx[key],
      },
    });
  };

  // محرك الخلفية الحية ثلاثية الأبعاد (3D Neural Nodes & Perspective Horizon)
  useEffect(() => {
    if (!fx.liveCanvas3D) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    const nodeCount = width < 768 ? 32 : 68;
    const nodes: ParticleNode[] = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      size: Math.random() * 2.2 + 0.8,
      pulse: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    const render = () => {
      time += 0.015;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // 1. رسم هالة الماوس الفضائية العميقة
      const cursorGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        380
      );
      cursorGrad.addColorStop(0, "rgba(0, 238, 255, 0.11)");
      cursorGrad.addColorStop(0.45, "rgba(2, 176, 255, 0.04)");
      cursorGrad.addColorStop(1, "transparent");
      ctx.fillStyle = cursorGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. رسم شبكة المنظور الثلاثي الأبعاد في الأفق السفلي (3D Cyber Horizon)
      const horizonY = height * 0.68;
      const offsetX = ((mouse.x - width / 2) / width) * 90;

      ctx.strokeStyle = "rgba(0, 238, 255, 0.065)";
      ctx.lineWidth = 1;

      for (let i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(width / 2 + i * 45 - offsetX * 0.3, horizonY);
        ctx.lineTo(width / 2 + i * 240 - offsetX, height);
        ctx.stroke();
      }

      const gridFlow = (time * 28) % 40;
      for (let r = 0; r < 7; r++) {
        const yPos = horizonY + Math.pow(r + gridFlow / 40, 1.75) * 14;
        if (yPos > height) continue;
        const alpha = Math.min(0.14, ((yPos - horizonY) / (height - horizonY)) * 0.14);
        ctx.strokeStyle = `rgba(0, 238, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(width, yPos);
        ctx.stroke();
      }

      // 3. تحريك ورسم الجزيئات العصبية المضيئة والروابط الليزرية بينها
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulse += 0.03;
        n.x += n.vx * n.z;
        n.y += n.vy * n.z;

        // إزاحة Parallax خفيفة حسب موقع الماوس
        const parallaxX = n.x + ((mouse.x - width / 2) * 0.025) / n.z;
        const parallaxY = n.y + ((mouse.y - height / 2) * 0.025) / n.z;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        const glowAlpha = 0.35 + Math.sin(n.pulse) * 0.25;
        ctx.fillStyle = `rgba(0, 238, 255, ${glowAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, n.size * n.z, 0, Math.PI * 2);
        ctx.fill();

        // ربط العقد القريبة من بعضها أو القريبة من الماوس بخطوط طاقة
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const p2x = n2.x + ((mouse.x - width / 2) * 0.025) / n2.z;
          const p2y = n2.y + ((mouse.y - height / 2) * 0.025) / n2.z;
          const dx = parallaxX - p2x;
          const dy = parallaxY - p2y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            const lineAlpha = (1 - dist / 135) * 0.16;
            ctx.strokeStyle = `rgba(0, 238, 255, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(parallaxX, parallaxY);
            ctx.lineTo(p2x, p2y);
            ctx.stroke();
          }
        }

        const mdx = parallaxX - mouse.x;
        const mdy = parallaxY - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 175) {
          const mAlpha = (1 - mDist / 175) * 0.32;
          ctx.strokeStyle = `rgba(22, 220, 255, ${mAlpha.toFixed(3)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(parallaxX, parallaxY);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [fx.liveCanvas3D]);

  return (
    <>
      {/* 1. الخلفية الحية المتطورة (3D Canvas) */}
      {fx.liveCanvas3D && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-0"
          style={{ opacity: 0.92 }}
        />
      )}

      {/* 2. الشريط الهولوغرافي العملاق في الخلفية (مستوحى من فيديو SKRIKSI) */}
      {fx.kineticMarquee && (
        <div
          dir="ltr"
          className="fixed top-[24%] left-0 right-0 pointer-events-none z-0 overflow-hidden select-none py-5 border-y border-cyan-500/15 bg-gradient-to-r from-slate-950/40 via-cyan-950/15 to-slate-950/40"
        >
          <div className="cyber-kinetic-track flex whitespace-nowrap items-center gap-16">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span
                key={idx}
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.28em] uppercase cyber-outline-text"
              >
                REVELIO DIGITAL • CYBER VERIFIED UNIVERSE •
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. الأشعة الليزرية والنبضات الضوئية السيبرانية */}
      {fx.laserBeams && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="cyber-laser-beam-h top-[18%]" />
          <div className="cyber-laser-beam-h top-[62%] animation-delay-2000" />
          <div className="cyber-laser-beam-v left-[14%]" />
          <div className="cyber-laser-beam-v right-[14%]" />
        </div>
      )}

      {/* 4. إطار الـ HUD السيبراني ومؤشر SCROLL TO EXPLORE (بأسلوب الفيديو) */}
      {fx.hudOverlay && (
        <div
          dir="ltr"
          className="hidden sm:flex fixed bottom-5 left-6 z-30 pointer-events-none items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-300 uppercase">
            SCROLL TO EXPLORE // 3D ENGINE ACTIVE
          </span>
        </div>
      )}

      {/* 5. زر ولوحة التحكم الفورية بمؤثرات الـ 3D والأشعة (تفعيل / إيقاف متى أردت) */}
      <div dir="rtl" className="fixed bottom-5 right-5 z-40">
        {isFxPanelOpen && (
          <div className="cyber-card mb-3 p-4 w-72 space-y-3 border border-cyan-400/50 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
                <Sparkles className="w-4 h-4" />
                <span>استوديو المؤثرات 3D الحية</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFxPanelOpen(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  key: "liveCanvas3D" as const,
                  label: "الخلفية الحية 3D والجزيئات",
                  icon: Layers,
                },
                {
                  key: "kineticMarquee" as const,
                  label: "الشريط الهولوغرافي الخلفي",
                  icon: Radio,
                },
                {
                  key: "tilt3DCards" as const,
                  label: "منظور 3D Tilt للبطاقات والشعار",
                  icon: Box,
                },
                {
                  key: "laserBeams" as const,
                  label: "الأشعة الليزرية والنبضات",
                  icon: Zap,
                },
                {
                  key: "hudOverlay" as const,
                  label: "مؤشر HUD السيبراني",
                  icon: Eye,
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = fx[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleEffect(item.key)}
                    className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      active
                        ? "bg-cyan-500/20 border-cyan-400 text-white font-bold"
                        : "bg-slate-900/80 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{item.label}</span>
                    </span>
                    {active ? (
                      <span className="text-[10px] font-mono text-emerald-300">
                        ON ✓
                      </span>
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsFxPanelOpen(!isFxPanelOpen)}
          className="px-4 py-2.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-cyan-400/50 text-cyan-300 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 backdrop-blur-xl cursor-pointer"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>مؤثرات 3D والأشعة</span>
        </button>
      </div>
    </>
  );
}