"use client";

// ============================================================================
// ImageLightbox - کامپوننت نمایش تصویر در حالت تمام صفحه
// ============================================================================

import { useState, useCallback, useEffect } from "react";

interface ImageLightboxProps {
  /** آیا lightbox باز است */
  isOpen: boolean;
  /** URL تصویر */
  src: string;
  /** متن جایگزین */
  alt?: string;
  /** بستن lightbox */
  onClose: () => void;
  /** متن تصویر (اختیاری - مثلاً عنوان اثر) */
  caption?: string;
  /** نام هنرمند (اختیاری) */
  artist?: string;
}

export default function ImageLightbox({
  isOpen,
  src,
  alt = "",
  onClose,
  caption,
  artist,
}: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // بستن با Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.5, 5));
      if (e.key === "-") setScale((s) => Math.max(s - 0.5, 0.5));
      if (e.key === "0") {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // ریست در باز شدن
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // زوم با اسکرول
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale((s) => Math.max(0.5, Math.min(5, s + delta)));
  }, []);

  // شروع درگ
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [scale, position]
  );

  // درگ
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  // پایان درگ
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={handleWheel}
    >
      {/* دکمه‌های کنترل */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        {/* زوم */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 backdrop-blur-md">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.5, 5))}
            className="flex h-8 w-8 items-center justify-center text-white transition-colors hover:bg-white/10"
            title="بزرگ‌نمایی"
          >
            +
          </button>
          <span className="min-w-[3rem] text-center text-xs text-white/60">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.5, 0.5))}
            className="flex h-8 w-8 items-center justify-center text-white transition-colors hover:bg-white/10"
            title="کوچک‌نمایی"
          >
            −
          </button>
        </div>

        {/* ریست */}
        <button
          onClick={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/10 px-3 text-xs text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          ۱:۱
        </button>

        {/* بستن */}
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-red-500/80"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* تصویر */}
      <div
        className="flex h-full w-full cursor-grab items-center justify-center p-16"
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full select-none object-contain transition-transform"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* کپشن */}
      {(caption || artist) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="mx-auto max-w-2xl text-center">
            {artist && (
              <p className="text-sm text-zinc-400">{artist}</p>
            )}
            {caption && (
              <p className="mt-1 text-lg font-medium text-white">{caption}</p>
            )}
          </div>
        </div>
      )}

      {/* راهنمای کلیدها */}
      <div className="absolute bottom-4 left-4 text-[10px] text-white/30">
        ESC: بستن • +/-: زوم • 0: ریست
      </div>
    </div>
  );
}
