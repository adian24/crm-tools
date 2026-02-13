"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { X, ZoomIn, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  alt?: string;
}

const ImagePreviewDialog = ({ open, onOpenChange, imageUrl, alt = "Preview" }: ImagePreviewDialogProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (open) {
      setImageError(false);
    }
  }, [open, imageUrl]);

  const handleDownload = () => {
    if (!imageUrl) return;

    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `bukti-kunjungan-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[calc(100%-2rem)] max-w-[100vw] md:max-w-[100vw] w-[100vw] md:w-[100vw] h-[100vh] md:h-[100vh] max-h-[100vh] p-0 gap-0 overflow-hidden bg-black dark:bg-black border-0 shadow-2xl rounded-none !fixed !top-0 !left-0 !translate-x-0 !translate-y-0 m-0">
        <DialogTitle className="sr-only">Preview Bukti Kunjungan</DialogTitle>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-safe-top pb-3 sm:px-6 sm:py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
            <h3 className="text-white font-semibold text-xs sm:text-sm truncate">Preview Bukti Kunjungan</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:text-white hover:bg-white/20 h-8 px-2 bg-black/30 backdrop-blur-sm rounded-full border border-white/20"
          >
            <Download className="w-4 h-4 mr-1" />
            <span className="text-xs">Download</span>
          </Button>
        </div>

        {/* Image Container */}
        <div className="w-full h-full flex items-center justify-center p-0 pt-12 sm:pt-16 pb-20 bg-black">
          {imageError ? (
            <div className="text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                <X className="w-8 h-8" />
              </div>
              <p className="text-lg font-semibold mb-2">Gagal memuat gambar</p>
              <p className="text-sm text-white/70">Gambar tidak dapat ditampilkan</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={alt}
              className="w-full h-full object-contain max-h-[calc(100vh-80px)]"
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* Footer with Close Button */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-black/40 safe-bottom">
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer bg-white hover:bg-white/90 text-black h-12 px-8 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/40 shadow-lg text-sm font-semibold"
            >
              <X className="w-5 h-5" />
              Tutup
            </Button>
          </div>
          <p className="text-center text-white/60 text-[10px] sm:text-xs mt-3">
            Klik di luar gambar untuk menutup
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { ImagePreviewDialog };
