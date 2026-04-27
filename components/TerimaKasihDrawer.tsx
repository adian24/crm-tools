"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { X, Star } from "lucide-react";
import Image from "next/image";

interface TerimaKasihDrawerProps {
  open: boolean;
  onClose: () => void;
}

function playApplause() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // White noise buffer (3s)
    const bufLen = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    // Bandpass filter → crowd applause range
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1200;
    bp.Q.value = 0.9;

    // Tremolo (7 Hz)
    const osc = ctx.createOscillator();
    osc.frequency.value = 7;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain.gain);
    osc.start();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.3);
    masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.4);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(masterGain);
    masterGain.connect(ctx.destination);

    src.start();
    setTimeout(() => {
      src.stop();
      ctx.close();
    }, 3100);
  } catch {
    // AudioContext unavailable — skip
  }
}

function fireConfetti() {
  const opts = { particleCount: 60, spread: 55, ticks: 200 };
  confetti({ ...opts, origin: { x: 0.15, y: 0.6 }, angle: 60 });
  confetti({ ...opts, origin: { x: 0.85, y: 0.6 }, angle: 120 });
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 80, origin: { x: 0.5, y: 0.5 }, ticks: 250 });
  }, 190);
}

const STARS = [
  { top: "8%",  left: "6%",  size: 16, delay: "0s"    },
  { top: "12%", left: "88%", size: 14, delay: "0.4s"  },
  { top: "72%", left: "5%",  size: 12, delay: "0.8s"  },
  { top: "78%", left: "91%", size: 18, delay: "0.2s"  },
  { top: "45%", left: "3%",  size: 10, delay: "1.1s"  },
  { top: "50%", left: "95%", size: 10, delay: "0.6s"  },
  { top: "28%", left: "92%", size: 13, delay: "1.3s"  },
  { top: "62%", left: "7%",  size: 15, delay: "0.9s"  },
];

export function TerimaKasihDrawer({ open, onClose }: TerimaKasihDrawerProps) {
  const confettiInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstance = useRef<confetti.CreateTypes | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Create confetti instance bound to our canvas when it becomes available
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

  // Trigger animation + effects when opened
  useEffect(() => {
    if (open) {
      setVisible(true);
      playApplause();
      // slight delay so canvas is in DOM and confettiInstance is ready
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

  // Escape key
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
      {/* Confetti canvas — above everything */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[10001] pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Full-screen panel — slides up from bottom */}
      <div
        className="absolute inset-0 z-[10000] flex flex-col overflow-hidden transition-transform duration-500 ease-out"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          background: "linear-gradient(160deg, #ffffff 0%, #faf5ff 35%, #fdf2f8 65%, #fff7ed 100%)",
        }}
      >
        {/* Top decoration bar */}
        <div className="h-1.5 w-full flex-shrink-0 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400" />

        {/* Floating stars */}
        {STARS.map((s, i) => (
          <Star
            key={i}
            className="absolute text-purple-300 animate-pulse fill-purple-200 pointer-events-none"
            style={{
              top: s.top, left: s.left,
              width: s.size, height: s.size,
              animationDelay: s.delay,
              opacity: 0.55,
            }}
          />
        ))}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)" }}
          aria-label="Tutup"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Top — company logo */}
        <div className="flex-shrink-0 flex items-center justify-center pt-10 pb-4 px-8">
          <div className="relative w-full max-w-sm h-40">
            <Image
              src="/images/tsilogo.png"
              alt="TSI Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Middle — main content, scrollable */}
        <div className="flex-1 flex items-center justify-center overflow-y-auto px-6 py-4">
          <div className="w-full max-w-md flex flex-col items-center gap-5 text-center">

            {/* CRM Team image */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 animate-pulse rounded-3xl overflow-hidden drop-shadow-xl">
              <Image
                src="/images/sales/CRM.jpeg"
                alt="CRM Team"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Title */}
            <h2
              className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #db2777 55%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Terima Kasih
            </h2>

            {/* Subtitle */}
            <p className="text-lg font-semibold text-purple-700/80 -mt-2">
              Atas Dedikasi &amp; Kerja Keras Anda
            </p>

            {/* Glassmorphism card */}
            <div
              className="w-full rounded-2xl px-6 py-5 text-sm text-gray-700 leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(167,139,250,0.35)",
                boxShadow: "0 8px 32px rgba(124,58,237,0.10)",
              }}
            >
              <p>
                Setiap langkah yang Anda ambil, setiap usaha yang Anda curahkan,
                dan setiap kontribusi yang Anda berikan adalah bagian penting dari
                perjalanan kita bersama.
              </p>
              <p className="mt-3 font-semibold text-purple-700">
                Terus semangat — karya terbaik selalu berawal dari hati. 🌟
              </p>
            </div>

          </div>
        </div>

        {/* Bottom — motto logo */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center pb-8 pt-4 gap-3">
          <Image
            src="/images/tsimoto.png"
            alt="TSI Moto"
            width={200}
            height={60}
            className="object-contain opacity-80"
            priority
          />
          <p className="text-xs text-gray-400 tracking-wide italic">
            PT TSI Sertifikasi Internasional · CRM Tools
          </p>
        </div>

        {/* Bottom decoration bar */}
        <div className="h-1.5 w-full flex-shrink-0 bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400" />
      </div>
    </div>,
    document.body,
  );
}
