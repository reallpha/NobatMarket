"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

import { toPersianNumbers } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  isApproved: boolean;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  user: { id: string; displayName: string; firstName: string | null; lastName: string | null; avatarUrl: string | null; role: string };
  replies: Comment[];
  _count: { replies: number };
  myReaction?: "LIKE" | "DISLIKE" | null;
}

export default function BlogComments({ postSlug }: { postSlug: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/blog/comments?postSlug=${postSlug}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, content: content.trim(), parentId }),
      });
      const data = await res.json();
      
      if (data.needsApproval) {
        setMessage(data.message);
        setNewComment("");
        setReplyContent("");
        setReplyTo(null);
      } else if (parentId) {
        setMessage("✅ پاسخ ثبت شد");
        setReplyContent("");
        setReplyTo(null);
      } else {
        setMessage("✅ نظر شما ثبت شد");
        setNewComment("");
      }
      
      fetchComments();
      setTimeout(() => setMessage(""), 4000);
    } catch (e) {
      setMessage("خطا در ارسال کامنت");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, type: "LIKE" | "DISLIKE") => {
    try {
      await fetch("/api/blog/comments/reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, type }),
      });
      fetchComments();
    } catch (e) {
      console.error("Reaction failed");
    }
  };

  const handleApprove = async (commentId: string, approved: boolean) => {
    try {
      await fetch("/api/blog/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, isApproved: approved }),
      });
      fetchComments();
    } catch (e) {
      console.error("Approve failed");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("آیا از حذف این کامنت مطمئن هستید؟")) return;
    try {
      await fetch(`/api/blog/comments?commentId=${commentId}`, { method: "DELETE" });
      fetchComments();
    } catch (e) {
      console.error("Delete failed");
    }
  };

  const getName = (user: Comment["user"]) => {
    if (user.displayName) return user.displayName;
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length ? parts.join(" ") : "کاربر";
  };

  const getInitial = (user: Comment["user"]) => {
    return (user.displayName || user.firstName || user.lastName || "ک")[0];
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "همین الان";
    if (mins < 60) return `${toPersianNumbers(mins)} دقیقه پیش`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${toPersianNumbers(hours)} ساعت پیش`;
    const days = Math.floor(hours / 24);
    return `${toPersianNumbers(days)} روز پیش`;
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? "mr-8 sm:mr-12" : ""} ${!comment.isApproved ? "opacity-50" : ""}`}>
      <div className="group rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 transition-colors hover:border-zinc-700/50">
        {!comment.isApproved && (
          <div className="mb-2 text-[10px] font-medium text-amber-400">⏳ در انتظار تأیید ادمین</div>
        )}
        <div className="flex items-start gap-3">
          {comment.user.avatarUrl ? (
            <img src={comment.user.avatarUrl} alt={getName(comment.user)} className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-sm font-bold text-white border border-white/10">
              {getInitial(comment.user)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{getName(comment.user)}</span>
              {comment.user.role === "ADMIN" && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-400">ادمین</span>
              )}
              {comment.user.role === "ARTIST" && (
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-bold text-rose-400">هنرمند</span>
              )}
              <span className="text-[11px] text-zinc-600">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
            
            {/* Actions */}
            <div className="mt-2.5 flex items-center gap-3">
              {session?.user && (
                <>
                  <button
                    onClick={() => handleReaction(comment.id, "LIKE")}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-emerald-400 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    <span>{toPersianNumbers(comment.likeCount || 0)}</span>
                  </button>
                  <button
                    onClick={() => handleReaction(comment.id, "DISLIKE")}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    <span>{toPersianNumbers(comment.dislikeCount || 0)}</span>
                  </button>
                  {!isReply && (
                    <button
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="text-[11px] text-zinc-500 hover:text-white transition-colors"
                    >
                      پاسخ
                    </button>
                  )}
                </>
              )}
              {session?.user?.role === "ADMIN" && !comment.isApproved && (
                <button
                  onClick={() => handleApprove(comment.id, true)}
                  className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                >
                  تأیید
                </button>
              )}
              {(session?.user?.id === comment.user.id || session?.user?.role === "ADMIN") && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-[11px] text-zinc-600 hover:text-rose-400 transition-colors"
                >
                  حذف
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply form */}
      {replyTo === comment.id && (
        <div className="mr-8 sm:mr-12 mt-2">
          <div className="flex gap-2">
            <input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(comment.id)}
              placeholder="پاسخ دهید..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              onClick={() => handleSubmit(comment.id)}
              disabled={submitting || !replyContent.trim()}
              className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
            >
              ارسال
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 sm:p-6 lg:p-8 backdrop-blur-xl">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
        <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        نظرات ({toPersianNumbers(comments.length)})
      </h3>

      {/* New comment form */}
      {session?.user ? (
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-sm font-bold text-white border border-white/10">
              {(session.user as any).name?.[0] || "ش"}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="نظر خود را بنویسید..."
                rows={3}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] text-zinc-600">حداکثر ۲۰۰۰ کاراکتر • لینک و شماره تلفن مجاز نیست</p>
                <button
                  onClick={() => handleSubmit()}
                  disabled={submitting || !newComment.trim()}
                  className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-rose-600/20"
                >
                  {submitting ? "در حال ارسال..." : "ارسال نظر"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-sm text-zinc-400">برای ثبت نظر باید <a href="/login" className="text-rose-400 hover:text-rose-300 font-medium">ورود</a> کنید</p>
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm text-amber-400">
          {message}
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/30" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-10 text-center">
          <svg className="mx-auto h-12 w-12 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="mt-3 text-sm text-zinc-500">هنوز نظری ثبت نشده. اولین نفر باشید!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
