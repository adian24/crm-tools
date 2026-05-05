"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { X } from "lucide-react";
import Image from "next/image";

interface TerimaKasihDrawerProps {
  open: boolean;
  onClose: () => void;
}

function playApplause() {
  try {
    const audio = new Audio("/sound/EFEKSUARA.mp3.mpeg");
    audio.volume = 1;
    audio.play();
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 6000);
  } catch {
    // Audio unavailable — skip
  }
}

export function TerimaKasihDrawer({ open, onClose }: TerimaKasihDrawerProps) {
  const confettiInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstance = useRef<confetti.CreateTypes | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open && canvasRef.current && !confettiInstance.current) {
      confettiInstance.current = confetti.create(canvasRef.current, { resize: true, useWorker: false });
    }
    if (!open && confettiInstance.current) {
      confettiInstance.current.reset();
      confettiInstance.current = null;
    }
  }, [open, canvasRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const fire = useCallback(() => {
    const fn = confettiInstance.current;
    if (!fn) return;
    const opts = { particleCount: 60, spread: 55, ticks: 200 };
    fn({ ...opts, origin: { x: 0.15, y: 0.6 }, angle: 60 });
    fn({ ...opts, origin: { x: 0.85, y: 0.6 }, angle: 120 });
    setTimeout(() => fn({ particleCount: 80, spread: 80, origin: { x: 0.5, y: 0.5 }, ticks: 250 }), 190);
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      playApplause();
      const startDelay = setTimeout(() => {
        fire();
        confettiInterval.current = setInterval(fire, 380);
        setTimeout(() => {
          if (confettiInterval.current) {
            clearInterval(confettiInterval.current);
            confettiInterval.current = null;
          }
        }, 3800);
      }, 50);
      return () => clearTimeout(startDelay);
    } else {
      setVisible(false);
      if (confettiInterval.current) {
        clearInterval(confettiInterval.current);
        confettiInterval.current = null;
      }
    }
    return () => {
      if (confettiInterval.current) {
        clearInterval(confettiInterval.current);
        confettiInterval.current = null;
      }
    };
  }, [open, fire]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose],
  );
  useEffect(() => {
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[10001] pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* PowerPoint-style closing slide */}
      <div
        className="absolute inset-0 z-[10000] flex flex-col overflow-hidden"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
          background: "linear-gradient(150deg, #0f0120 0%, #1e0338 20%, #3b0764 45%, #4c0d6e 60%, #2d0520 80%, #0a000f 100%)",
        }}
      >
        {/* Top gold accent line */}
        <div
          className="h-1 w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #7c3aed, #e8b84b, #db2777, #7c3aed)" }}
        />

        {/* Decorative large circle — top right */}
        <div
          className="absolute -top-32 -right-32 rounded-full pointer-events-none"
          style={{
            width: 360,
            height: 360,
            background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
            border: "1px solid rgba(139,92,246,0.12)",
          }}
        />

        {/* Decorative large circle — bottom left */}
        <div
          className="absolute -bottom-24 -left-24 rounded-full pointer-events-none"
          style={{
            width: 280,
            height: 280,
            background: "radial-gradient(circle, rgba(168,8,155,0.15) 0%, transparent 70%)",
            border: "1px solid rgba(168,8,155,0.10)",
          }}
        />

        {/* Diagonal accent band */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, transparent 0%, transparent 48%, rgba(255,255,255,0.018) 50%, transparent 52%, transparent 100%)",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 h-9 w-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.20)",
          }}
          aria-label="Tutup"
        >
          <X className="h-4 w-4 text-white/70" />
        </button>

        {/* ── SLIDE BODY ── */}
        <div className="flex-1 flex flex-col items-center justify-between px-6 sm:px-12 py-6 sm:py-10 min-h-0">

          {/* TOP ZONE — Logo */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative" style={{ width: 360, height: 96 }}>
              <Image
                src="/images/tsilogo.png"
                alt="TSI Logo"
                fill
                className="object-contain"
                priority
                style={{ filter: "brightness(0) invert(1) opacity(0.92)" }}
              />
            </div>
            {/* Thin divider below logo */}
            <div className="flex items-center gap-3">
              <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(232,184,75,0.7))" }} />
              <div className="h-1 w-1 rounded-full bg-yellow-400/60" />
              <div className="h-px w-12" style={{ background: "linear-gradient(90deg, rgba(232,184,75,0.7), transparent)" }} />
            </div>
          </div>

          {/* CENTER ZONE — Main message */}
          <div className="flex flex-col items-center gap-4 sm:gap-5 text-center flex-shrink-0">

            {/* CRM team photo — rounded with gold ring */}
            <div
              className="relative flex-shrink-0"
              style={{
                width: 108,
                height: 108,
                borderRadius: "50%",
                padding: 3,
                background: "linear-gradient(135deg, #e8b84b, #7c3aed, #db2777)",
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image
                  src="/images/sales/CRM.jpeg"
                  alt="CRM Team"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* "TERIMA KASIH" headline */}
            <div className="space-y-1">
              <p
                className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase"
                style={{ color: "rgba(232,184,75,0.85)" }}
              >
                Dengan Penuh Rasa
              </p>
              <h1
                className="font-black tracking-tight leading-none"
                style={{
                  fontSize: "clamp(3rem, 12vw, 5.5rem)",
                  background: "linear-gradient(135deg, #ffffff 0%, #e8d5ff 40%, #fce7f3 70%, #fef3c7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "none",
                }}
              >
                Terima Kasih
              </h1>
            </div>

            {/* Gold divider */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(232,184,75,0.8))" }} />
              <div className="flex gap-1">
                <div className="h-1 w-1 rounded-full bg-yellow-400/80" />
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                <div className="h-1 w-1 rounded-full bg-yellow-400/80" />
              </div>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(232,184,75,0.8), transparent)" }} />
            </div>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg font-semibold tracking-widest uppercase"
              style={{ color: "rgba(216,180,254,0.90)", letterSpacing: "0.2em" }}
            >
              Atas Dedikasi &amp; Kerja Keras Anda
            </p>

            {/* Body text */}
            <p
              className="text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-sm"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Setiap langkah yang Anda ambil, setiap usaha yang Anda curahkan,
              dan setiap kontribusi Anda adalah bagian penting dari perjalanan kita bersama.
            </p>

            {/* Closing line */}
            <p
              className="text-xs sm:text-sm font-semibold italic"
              style={{ color: "rgba(232,184,75,0.80)" }}
            >
              Terus semangat — karya terbaik selalu berawal dari hati. ✨
            </p>
          </div>

          {/* BOTTOM ZONE — Motto & tagline */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            {/* Thin divider above motto */}
            <div className="flex items-center gap-3 mb-1">
              <div className="h-px w-8" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2))" }} />
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <div className="h-px w-8" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.2), transparent)" }} />
            </div>
            <div className="relative" style={{ width: 420, height: 116 }}>
              <Image
                src="/images/tsimoto.png"
                alt="TSI Moto"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p
              className="text-[10px] tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.30)", letterSpacing: "0.22em" }}
            >
              PT TSI Sertifikasi Internasional · CRM Tools
            </p>
          </div>
        </div>

        {/* Bottom gold accent line */}
        <div
          className="h-1 w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #db2777, #e8b84b, #7c3aed, #db2777)" }}
        />
      </div>
    </div>,
    document.body,
  );
}
