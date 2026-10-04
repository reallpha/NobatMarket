"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        if (!data.alreadySubscribed) setEmail("");
      } else {
        setMessage({ type: "error", text: data.message || "خطا در ثبت عضویت" });
      }
    } catch {
      setMessage({ type: "error", text: "خطا در اتصال به سرور" });
    }

    setLoading(false);
  };

  return (
    <div>
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ایمیل خود را وارد کنید"
          required
          className="flex-1 min-w-0 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex-shrink-0 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "..." : "اشتراک"}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-xs font-medium ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
