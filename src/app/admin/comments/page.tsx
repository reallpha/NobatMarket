"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { formatJalaliDate } from "@/lib/utils";

interface Comment {
  id: string;
  postSlug: string;
  content: string;
  isApproved: boolean;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  user: { id: string; displayName: string; firstName: string | null; lastName: string | null; phone: string; avatarUrl: string | null; role: string };
  replies: Comment[];
  _count: { replies: number };
}

export default function AdminCommentsPage() {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [postSlugs, setPostSlugs] = useState<string[]>([]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Fetch all comments (admin endpoint)
      const res = await fetch("/api/blog/comments?all=true");
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (e) {
      console.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  const handleApprove = async (commentId: string, approved: boolean) => {
    try {
      await fetch("/api/blog/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, isApproved: approved }),
      });
      fetchComments();
    } catch (e) {
      console.error("Failed to update comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("آیا از حذف این کامنت مطمئن هستید؟")) return;
    try {
      await fetch(`/api/blog/comments?commentId=${commentId}`, { method: "DELETE" });
      fetchComments();
    } catch (e) {
      console.error("Failed to delete comment");
    }
  };

  const filtered = comments.filter(c => {
    if (filter === "pending") return !c.isApproved;
    if (filter === "approved") return c.isApproved;
    return true;
  });

  const pendingCount = comments.filter(c => !c.isApproved).length;
  const approvedCount = comments.filter(c => c.isApproved).length;

  const POST_TITLES: Record<string, string> = {
    "best-tattoo-styles-2025": "بهترین سبک‌های تتو",
    "tattoo-aftercare-complete-guide": "مراقبت بعد از تتو",
    "how-to-choose-tattoo-artist": "انتخاب هنرمند تتو",
    "tattoo-pricing-guide-iran": "قیمت تتو در ایران",
    "tattoo-equipment-tools-guide": "ابزار و تجهیزات تتو",
    "tattoo-artist-career-iran": "شغل تتوآرتیست",
    "tattoo-design-methods": "متدهای طراحی تتو",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">کامنت‌ها</h1>
          <p className="text-sm text-zinc-500 mt-1">{comments.length} کامنت کل • {pendingCount} در انتظار تأیید</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "all" ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
          >
            همه ({comments.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "pending" ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
          >
            در انتظار ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === "approved" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
          >
            تأیید شده ({approvedCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800/30" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="mt-4 text-zinc-500">کامنتی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((comment) => (
            <div key={comment.id} className={`rounded-xl border p-4 transition-colors ${comment.isApproved ? "border-zinc-800 bg-zinc-900/50" : "border-amber-500/20 bg-amber-500/5"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.user.avatarUrl ? (
                      <img src={comment.user.avatarUrl} alt="" className="h-7 w-7 rounded-full border border-white/10 object-cover" />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-[11px] font-bold text-white">
                        {(comment.user.displayName || comment.user.firstName || "ک")[0]}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-white">
                      {comment.user.displayName || `${comment.user.firstName || ""} ${comment.user.lastName || ""}`.trim() || "کاربر"}
                    </span>
                    <span className="text-[10px] text-zinc-600">{comment.user.phone}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      comment.user.role === "ADMIN" ? "bg-amber-500/15 text-amber-400" :
                      comment.user.role === "ARTIST" ? "bg-rose-500/15 text-rose-400" :
                      "bg-zinc-700 text-zinc-400"
                    }`}>
                      {comment.user.role === "ADMIN" ? "ادمین" : comment.user.role === "ARTIST" ? "هنرمند" : "مشتری"}
                    </span>
                    {!comment.isApproved && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">در انتظار</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">
                    مقاله: {POST_TITLES[comment.postSlug] || comment.postSlug} • {formatJalaliDate(new Date(comment.createdAt), "datetime")}
                  </p>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-600">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      {comment.likeCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                      {comment.dislikeCount}
                    </span>
                    {comment._count.replies > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {comment._count.replies} پاسخ
                      </span>
                    )}
                  </div>

                  {/* Show replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className={`rounded-lg p-3 ${reply.isApproved ? "bg-zinc-800/30" : "border border-amber-500/20 bg-amber-500/5"}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-white">
                              {reply.user.firstName} {reply.user.lastName}
                            </span>
                            <span className="text-[10px] text-zinc-600">{formatJalaliDate(new Date(reply.createdAt), "datetime")}</span>
                            {!reply.isApproved && (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">در انتظار</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">{reply.content}</p>
                          <div className="mt-2 flex gap-2">
                            {!reply.isApproved ? (
                              <button
                                onClick={() => handleApprove(reply.id, true)}
                                className="rounded-md bg-emerald-600/20 px-2.5 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                              >
                                تأیید
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApprove(reply.id, false)}
                                className="rounded-md bg-amber-600/20 px-2.5 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-600/30 transition-colors"
                              >
                                رد
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="rounded-md bg-rose-600/20 px-2.5 py-1 text-[10px] font-medium text-rose-400 hover:bg-rose-600/30 transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {!comment.isApproved && (
                    <button
                      onClick={() => handleApprove(comment.id, true)}
                      className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                    >
                      تأیید
                    </button>
                  )}
                  {comment.isApproved && (
                    <button
                      onClick={() => handleApprove(comment.id, false)}
                      className="rounded-lg bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-600/30 transition-colors"
                    >
                      رد
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="rounded-lg bg-rose-600/20 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-600/30 transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
