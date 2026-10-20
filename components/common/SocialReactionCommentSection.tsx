"use client";

import React, { useState, useEffect } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  MessageSquare,
  Send,
  Trash2,
  UserCheck,
  Sparkles,
  Lock,
  Smile,
  ShieldAlert,
  CornerDownRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface CommentItem {
  id: string;
  userName: string;
  userRole: string;
  userAvatar: string;
  text: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
}

interface SocialReactionCommentSectionProps {
  contentId: string;
  contentType?: "notice" | "gallery" | "download" | "post" | "quiz";
  initialLikes?: number;
  initialUnlikes?: number;
  initialHearts?: number;
  initialComments?: CommentItem[];
  compact?: boolean;
}

export default function SocialReactionCommentSection({
  contentId,
  contentType = "notice",
  initialLikes = 12,
  initialUnlikes = 1,
  initialHearts = 8,
  initialComments = [],
  compact = false
}: SocialReactionCommentSectionProps) {
  const { currentUser, isLoggedIn, openLoginModal } = useAuth();

  // Load saved state or initial props
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [unlikesCount, setUnlikesCount] = useState(initialUnlikes);
  const [heartsCount, setHeartsCount] = useState(initialHearts);

  const [userReaction, setUserReaction] = useState<"like" | "unlike" | "heart" | null>(null);

  const [comments, setComments] = useState<CommentItem[]>(() => {
    if (initialComments && initialComments.length > 0) {
      return initialComments;
    }
    // Default sample comments for rich initial interaction
    return [
      {
        id: `c-1-${contentId}`,
        userName: "কাজী তানভীর হাসান",
        userRole: "শিক্ষার্থী (Computer Tech)",
        userAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
        text: "খুবই গুরুত্বপূর্ণ তথ্য। ধন্যবাদ কর্তৃপক্ষকে।",
        createdAt: "১০ মিনিট আগে",
        likes: 3,
      },
      {
        id: `c-2-${contentId}`,
        userName: "প্রকৌ. মাহমুদুল হাসান",
        userRole: "চিফ ইন্সট্রাক্টর (IT Support)",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        text: "সকল বিভাগের শিক্ষার্থীদের এটি অনুসরণের নির্দেশ দেওয়া হচ্ছে।",
        createdAt: "২৫ মিনিট আগে",
        likes: 5,
      }
    ];
  });

  const [newCommentText, setNewCommentText] = useState("");
  const [showComments, setShowComments] = useState(!compact);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle Reaction Handler (Strictly capped at 1 reaction per person)
  const handleToggleReaction = (type: "like" | "unlike" | "heart") => {
    if (!isLoggedIn) {
      openLoginModal(`সামাজিক প্রতিক্রিয়া (${type === 'like' ? 'লাইক' : type === 'unlike' ? 'আনলাইক' : 'লাভ/হার্ট'}) দিতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।`);
      return;
    }

    if (userReaction === type) {
      // Remove reaction
      setUserReaction(null);
      if (type === "like") setLikesCount(prev => Math.max(0, prev - 1));
      if (type === "unlike") setUnlikesCount(prev => Math.max(0, prev - 1));
      if (type === "heart") setHeartsCount(prev => Math.max(0, prev - 1));
    } else {
      // Remove existing reaction if switching
      if (userReaction === "like") setLikesCount(prev => Math.max(0, prev - 1));
      if (userReaction === "unlike") setUnlikesCount(prev => Math.max(0, prev - 1));
      if (userReaction === "heart") setHeartsCount(prev => Math.max(0, prev - 1));

      // Set new single reaction
      setUserReaction(type);
      if (type === "like") setLikesCount(prev => prev + 1);
      if (type === "unlike") setUnlikesCount(prev => prev + 1);
      if (type === "heart") setHeartsCount(prev => prev + 1);
    }
  };

  // Submit Comment Handler
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openLoginModal("মতামত বা কমেন্ট পোস্ট করার জন্য প্রথমে আপনার অ্যাকাউন্টে লগইন করুন।");
      return;
    }

    if (!newCommentText.trim()) return;

    setIsSubmitting(true);

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      userName: currentUser.nameBangla || currentUser.fullName || "ইউজার",
      userRole: currentUser.designation || currentUser.role,
      userAvatar: currentUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      text: newCommentText.trim(),
      createdAt: "এখনই",
      likes: 0
    };

    setTimeout(() => {
      setComments(prev => [newComment, ...prev]);
      setNewCommentText("");
      setIsSubmitting(false);
      setShowComments(true);
    }, 200);
  };

  // Like Individual Comment
  const handleLikeComment = (commentId: string) => {
    if (!isLoggedIn) {
      openLoginModal("কমেন্টে লাইক দিতে প্রথমে লগইন করুন।");
      return;
    }

    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const userLiked = !c.userLiked;
          return {
            ...c,
            userLiked,
            likes: userLiked ? c.likes + 1 : Math.max(0, c.likes - 1)
          };
        }
        return c;
      })
    );
  };

  // Delete Comment
  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
      
      {/* ACTION REACTION BUTTONS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* LIKE BUTTON */}
          <button
            type="button"
            onClick={() => handleToggleReaction("like")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              userReaction === "like"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === "like" ? "fill-slate-950 stroke-slate-950" : ""}`} />
            <span>লাইক</span>
            <span className="font-mono text-[11px] opacity-80">({likesCount})</span>
          </button>

          {/* UNLIKE BUTTON */}
          <button
            type="button"
            onClick={() => handleToggleReaction("unlike")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              userReaction === "unlike"
                ? "bg-slate-700 text-white border border-slate-600 shadow-md"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === "unlike" ? "fill-white stroke-white" : ""}`} />
            <span>আনলাইক</span>
            <span className="font-mono text-[11px] opacity-80">({unlikesCount})</span>
          </button>

          {/* HEART BUTTON */}
          <button
            type="button"
            onClick={() => handleToggleReaction("heart")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              userReaction === "heart"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${userReaction === "heart" ? "fill-white text-white" : "text-rose-500"}`} />
            <span>লাভ</span>
            <span className="font-mono text-[11px] opacity-80">({heartsCount})</span>
          </button>
        </div>

        {/* COMMENT TOGGLE BUTTON */}
        <button
          type="button"
          onClick={() => setShowComments(prev => !prev)}
          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-cyan-400 font-bold flex items-center gap-1.5 cursor-pointer hover:bg-indigo-100 transition-all border border-indigo-200 dark:border-indigo-900/40"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>মন্তব্য ({comments.length})</span>
        </button>
      </div>

      {/* COMMENTS EXPANDABLE PANEL */}
      {showComments && (
        <div className="space-y-4 pt-2 animate-fade-in">
          
          {/* COMMENT INPUT FORM */}
          <form onSubmit={handleCommentSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  isLoggedIn
                    ? `${currentUser.nameBangla || currentUser.fullName} হিসেবে মন্তব্য লিখুন...`
                    : "কমেন্ট করতে প্রথমে ক্লিক বা লগইন করুন..."
                }
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onClick={() => {
                  if (!isLoggedIn) {
                    openLoginModal("কমেন্ট করার পূর্বে অনুগ্রহ করে লগইন করুন।");
                  }
                }}
                className="flex-1 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">কমেন্ট করুন</span>
              </button>
            </div>

            {!isLoggedIn && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 px-1">
                <Lock className="w-3 h-3" />
                <span>কমেন্ট বা লাইক দিতে লগইন করা আবশ্যক।</span>
              </div>
            )}
          </form>

          {/* COMMENTS LIST */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                এখনো কোনো মন্তব্য করা হয়নি। প্রথম কমেন্টটি আপনিই করুন!
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <span>{comment.userName}</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                            {comment.userRole}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{comment.createdAt}</div>
                      </div>
                    </div>

                    {/* Delete option if current user's comment */}
                    {isLoggedIn && (currentUser.nameBangla === comment.userName || currentUser.fullName === comment.userName) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer"
                        title="কমেন্ট ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed pl-9">
                    {comment.text}
                  </p>

                  <div className="pl-9 flex items-center gap-3 text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                        comment.userLiked ? "text-cyan-500" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${comment.userLiked ? "fill-cyan-500" : ""}`} />
                      <span>লাইক ({comment.likes})</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
