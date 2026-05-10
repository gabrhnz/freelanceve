"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/contexts/theme-context";

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  drift: number;
  tail: number;
}

export function StarfallCanvas() {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isDark) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("resize", resize);

    const STAR_COUNT = 60;

    const createStar = (randomY?: boolean): Star => ({
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : -10,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.15,
      opacity: Math.random() * 0.6 + 0.2,
      drift: (Math.random() - 0.5) * 0.2,
      tail: Math.random() * 20 + 10,
    });

    starsRef.current = Array.from({ length: STAR_COUNT }, () => createStar(true));

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of starsRef.current) {
        const gradient = ctx.createLinearGradient(
          star.x, star.y - star.tail,
          star.x, star.y
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${star.opacity})`);

        ctx.beginPath();
        ctx.moveTo(star.x, star.y - star.tail);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = star.size * 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        star.y += star.speed;
        star.x += star.drift;

        if (star.y > canvas.height + 20) {
          Object.assign(star, createStar(false));
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
