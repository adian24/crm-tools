"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCcw, Calendar } from 'lucide-react';

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export interface ImageItem {
  url: string;
  title?: string;
  description?: string;
  month?: number;
  year?: number;
  tanggalTerbit?: string;
  tanggalBroadcast?: string;
}

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ImageItem[];
  initialIndex?: number;
}

const ImagePreviewDialog = ({ open, onOpenChange, images, initialIndex = 0 }: ImagePreviewDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageError, setImageError] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const posRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef<number | null>(null);

  const DEFAULT_SCALE = 1;

  const applyTransform = (s: number, x: number, y: number) => {
    const clamped = Math.min(8, Math.max(0.5, s));
    scaleRef.current = clamped;
    posRef.current = { x, y };
    setScale(clamped);
    setPos({ x, y });
  };

  const resetView = useCallback(() => {
    applyTransform(DEFAULT_SCALE, 0, 0);
    draggingRef.current = false;
    setDragging(false);
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    setImageError(false);
    applyTransform(DEFAULT_SCALE, 0, 0);
    draggingRef.current = false;
    setDragging(false);
  }, []);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    goTo((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, goTo]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    goTo((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, goTo]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setImageError(false);
      applyTransform(DEFAULT_SCALE, 0, 0);
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goPrev, goNext]);

  // Non-passive wheel + touch listeners
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;

    const getD = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyTransform(scaleRef.current * (e.deltaY > 0 ? 0.9 : 1.1), posRef.current.x, posRef.current.y);
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        draggingRef.current = true;
        setDragging(true);
        dragStart.current = {
          x: e.touches[0].clientX - posRef.current.x,
          y: e.touches[0].clientY - posRef.current.y,
        };
        pinchDistRef.current = null;
      } else if (e.touches.length === 2) {
        draggingRef.current = false;
        setDragging(false);
        pinchDistRef.current = getD(e.touches);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && draggingRef.current) {
        const x = e.touches[0].clientX - dragStart.current.x;
        const y = e.touches[0].clientY - dragStart.current.y;
        posRef.current = { x, y };
        setPos({ x, y });
      } else if (e.touches.length === 2 && pinchDistRef.current !== null) {
        const d = getD(e.touches);
        applyTransform(scaleRef.current * (d / pinchDistRef.current), posRef.current.x, posRef.current.y);
        pinchDistRef.current = d;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        draggingRef.current = false;
        setDragging(false);
        pinchDistRef.current = null;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [open]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    dragStart.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current) return;
    const x = e.clientX - dragStart.current.x;
    const y = e.clientY - dragStart.current.y;
    posRef.current = { x, y };
    setPos({ x, y });
  };

  const onMouseUp = () => {
    draggingRef.current = false;
    setDragging(false);
  };

  const handleDownload = () => {
    const img = images[currentIndex];
    if (!img?.url) return;
    try {
      const link = document.createElement('a');
      link.href = img.url;
      link.download = `gambar-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  if (!images.length) return null;

  const current = images[currentIndex];
  const hasMultiple = images.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-screen h-screen max-h-screen p-0 gap-0 overflow-hidden bg-black/95 border-0 rounded-none !fixed !inset-0 !translate-x-0 !translate-y-0 m-0 flex flex-col">
        <DialogTitle className="sr-only">Preview Gambar</DialogTitle>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
          <div className="text-white/60 text-sm font-medium">
            {hasMultiple ? `${currentIndex + 1} / ${images.length}` : ""}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main: image 80% | info panel 20% */}
        <div className="flex flex-1 min-h-0">

          {/* Image area */}
          <div
            ref={containerRef}
            className="relative w-4/5 flex items-center justify-center overflow-hidden"
            style={{ cursor: dragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onDoubleClick={resetView}
          >
            {hasMultiple && (
              <button
                onClick={goPrev}
                className="absolute left-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {imageError ? (
              <div className="text-center text-white pointer-events-none">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                  <X className="w-8 h-8" />
                </div>
                <p className="text-lg font-semibold mb-1">Gagal memuat gambar</p>
                <p className="text-sm text-white/60">Gambar tidak dapat ditampilkan</p>
              </div>
            ) : (
              <img
                key={currentIndex}
                src={current?.url}
                alt={current?.title || "Preview"}
                draggable={false}
                className="max-w-full max-h-full object-contain select-none px-16 py-4"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: dragging ? 'none' : 'transform 0.12s ease-out',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'none',
                  willChange: 'transform',
                }}
                onError={() => setImageError(true)}
              />
            )}

            {hasMultiple && (
              <button
                onClick={goNext}
                className="absolute right-4 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors cursor-pointer z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className="w-1/5 border-l border-white/10 flex flex-col p-5 gap-5 overflow-y-auto">
            {current?.title && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Judul</p>
                <p className="text-white font-semibold text-sm leading-snug">{current.title}</p>
              </div>
            )}
            {current?.description && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Deskripsi</p>
                <p className="text-white/80 text-base leading-relaxed">{current.description}</p>
              </div>
            )}

            {(current?.month && current?.year) && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Periode</p>
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <span>{MONTHS[(current.month ?? 1) - 1]} {current.year}</span>
                </div>
              </div>
            )}

            {current?.tanggalTerbit && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Tanggal Terbit</p>
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <span>{new Date(current.tanggalTerbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            )}

            {current?.tanggalBroadcast && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Tanggal Broadcast</p>
                <div className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <span>{new Date(current.tanggalBroadcast).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            )}

            <div className="flex-1" />

            {/* Controls */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => applyTransform(scaleRef.current * 0.75, posRef.current.x, posRef.current.y)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetView}
                  className="text-white/70 text-[11px] font-mono bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1 border border-white/20 min-w-[3rem] text-center"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={() => applyTransform(scaleRef.current * 1.33, posRef.current.x, posRef.current.y)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetView}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-white/80 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-colors w-full justify-center cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="flex items-center justify-center gap-1.5 py-3 flex-shrink-0">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all cursor-pointer ${i === currentIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { ImagePreviewDialog };
