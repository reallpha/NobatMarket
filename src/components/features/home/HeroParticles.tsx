"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number; y: number; r: number;
  vx: number; vy: number;
  color: string; alpha: number;
}

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const raf = useRef<number>(0);

  const init = useCallback(() => {
    const palette = ["rgba(244,63,94,0.6)", "rgba(232,121,249,0.5)", "rgba(251,191,36,0.4)", "rgba(6,182,212,0.35)"];
    particles.current = Array.from({ length: 60 }, (_, i) => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 2 + 0.4,
      vx: (Math.random() - 0.5) * 0.0004, vy: (Math.random() - 0.5) * 0.0004,
      color: palette[i % 4], alpha: Math.random() * 0.5 + 0.15,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    init();
    const resize = () => { const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect(); canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; };
    resize(); window.addEventListener("resize", resize);
    const onMouse = (e: MouseEvent) => { const rect = canvas.getBoundingClientRect(); mouse.current = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }; };
    window.addEventListener("mousemove", onMouse);
    const draw = () => {
      const w = canvas.width; const h = canvas.height; const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, w, h);
      const ps = particles.current;
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const dx = mouse.current.x - p.x; const dy = mouse.current.y - p.y; const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.2) { p.x += dx * 0.001; p.y += dy * 0.001; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0; if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        const px = p.x * w; const py = p.y * h; const sz = p.r * dpr;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill(); ctx.globalAlpha = 1;
        for (let j = i + 1; j < ps.length; j++) { const q = ps[j]; const d2 = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2); if (d2 < 0.08) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(q.x * w, q.y * h); ctx.strokeStyle = `rgba(244,63,94,${0.12 * (1 - d2 / 0.08)})`; ctx.lineWidth = 0.5 * dpr; ctx.stroke(); } }
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMouse); };
  }, [init]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
