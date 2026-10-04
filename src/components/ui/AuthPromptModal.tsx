"use client";

import Link from "next/link";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function AuthPromptModal({ isOpen, onClose, message = "برای این عملیات ابتدا باید وارد شوید" }: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-3 top-3 rounded-lg p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 mx-auto">
          <svg className="h-6 w-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>

        <p className="mb-6 text-center text-sm text-zinc-300 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <Link
            href="/login"
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-600/20"
          >
            ورود
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
          >
            ثبت‌نام
          </Link>
        </div>
      </div>
    </div>
  );
}
