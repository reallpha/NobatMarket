"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type CropModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (position: { x: number; y: number }) => void;
  imageSrc: string;
  aspect: "1:1" | "16:9";
  title: string;
};

export default function CropModal({ open, onClose, onConfirm, imageSrc, aspect, title }: CropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, startX: 0, startY: 0 });

  useEffect(() => {
    if (open) setPos({ x: 50, y: 50 });
  }, [open]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, startX: pos.x, startY: pos.y });
  }, [pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
    const newX = Math.max(0, Math.min(100, dragStart.startX + dx));
    const newY = Math.max(0, Math.min(100, dragStart.startY + dy));
    setPos({ x: newX, y: newY });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    }
  }, [dragging, handleMouseUp]);

  if (!open) return null;

  const isAvatar = aspect === "1:1";
  const previewClass = isAvatar ? "rounded-full" : "rounded-xl";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>

        <div
          ref={containerRef}
          className={`relative overflow-hidden ${previewClass} border border-zinc-700 bg-zinc-800 cursor-grab active:cursor-grabbing ${isAvatar ? "h-64 w-64 mx-auto" : "h-48 w-full"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <img
            src={imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
            style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
            draggable={false}
          />
          <div className="absolute inset-0 border-2 border-white/20 pointer-events-none" />
          {isAvatar && <div className="absolute inset-0 rounded-full border-2 border-rose-500/40 pointer-events-none" />}
        </div>

        <p className="text-xs text-zinc-500 text-center mt-3">بکشید تا موقعیت تصویر را تنظیم کنید</p>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            انصراف
          </button>
          <button onClick={() => onConfirm(pos)} className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-500">
            تأیید
          </button>
        </div>
      </div>
    </div>
  );
}
