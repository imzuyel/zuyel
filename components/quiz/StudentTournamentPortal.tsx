"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Users, Play, Shield, Award, ChevronRight, CheckCircle2, Clock, Sparkles, Flame } from "lucide-react";
import { GlowCard, GlowButton, AnimatedBorder, BorderGlowCard } from "@/components/ui/animation-effects";
import { StudentAchievementTrophySVG, QuizArenaBannerSVG } from "@/components/ui/animated-svgs";

interface StudentTournamentPortalProps {
  currentUser?: any;
  onJoinMatchSession?: (sessionCode: string) => void;
}

export default function StudentTournamentPortal({ currentUser, onJoinMatchSession }: StudentTournamentPortalProps) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudentTournaments = async () => {
      try {
        const res = await fetch("/api/tournaments");
        const data = await res.json();
        if (data.success) {
          setTournaments(data.tournaments);
          
          // Find matches assigned to current student
          if (currentUser) {
            const studentName = currentUser.fullName || currentUser.name;
            const allMatches: any[] = [];
            for (const t of data.tournaments) {
              const detailRes = await fetch(`/api/tournaments/${t.id}`);
              const detailData = await detailRes.json();
              if (detailData.success) {
                const matches = detailData.matches.filter((m: any) => 
                  m.participantAName?.toLowerCase() === studentName?.toLowerCase() ||
                  m.participantBName?.toLowerCase() === studentName?.toLowerCase()
                );
                allMatches.push(...matches.map((m: any) => ({ ...m, tournamentName: t.name, mode: t.mode })));
              }
            }
            setMyMatches(allMatches);
          }
        }
      } catch (err) {
        console.error("Failed to load student tournaments:", err);
      }
    };

    fetchStudentTournaments();
  }, [currentUser]);

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 overflow-y-auto space-y-6">
      {/* Student Celebration Banner with Real Trophy SVG */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-rose-600 to-purple-700 text-white p-6 md:p-8 shadow-xl shadow-amber-500/15 border border-amber-400/30">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none opacity-90">
          <StudentAchievementTrophySVG size={130} />
          <QuizArenaBannerSVG size={120} />
        </div>

        <div className="relative z-10 max-w-lg space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>লাইভ একাডেমিক টুর্নামেন্ট ২০২৬</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            স্টুডেন্ট কুইজ অ্যারিনা ও টুর্নামেন্ট
          </h1>
          <p className="text-xs md:text-sm text-amber-100">
            রিয়েলটাইম লাইভ কুইজ প্রতিযোগিতা, রাউন্ড এলিমিনেশন ও লিডারবোর্ড চ্যাম্পিয়নশিপ ট্রফি।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Assigned Matches */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" /> আমার টুর্নামেন্ট ম্যাচ (My Matches)
          </h3>

          <div className="space-y-3">
            {myMatches.map(match => (
              <BorderGlowCard
                key={match.id}
                glowColor={match.status === "LIVE" ? "neon" : "indigo"}
                glowType={match.status === "LIVE" ? "conic-spin" : "gradient"}
                status={match.status === "LIVE" ? "active" : "normal"}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2 text-[10px] font-black uppercase">
                    <span className="text-amber-700 dark:text-amber-400 font-bold">{match.tournamentName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full ${
                      match.status === "LIVE" ? "bg-emerald-600 text-white animate-pulse shadow-[0_0_10px_#10b981]" :
                      match.status === "COMPLETED" ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}>
                      {match.status === "LIVE" ? "🔴 LIVE NOW" : match.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between my-3 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <span className={match.participantAName === currentUser?.fullName ? "text-amber-600 dark:text-amber-400 font-black" : ""}>
                      {match.participantAName}
                    </span>
                    <span className="text-[10px] uppercase font-black text-slate-400 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">VS</span>
                    <span className={match.participantBName === currentUser?.fullName ? "text-amber-600 dark:text-amber-400 font-black" : ""}>
                      {match.participantBName}
                    </span>
                  </div>

                  {match.status === "LIVE" && (
                    <GlowButton
                      variant="emerald"
                      className="w-full justify-center"
                      icon={Play}
                      onClick={() => {
                        if (match.quizSessionId && onJoinMatchSession) {
                          fetch(`/api/live-quizzes/sessions/${match.quizSessionId}/state`)
                            .then(res => (res.ok && (res.headers.get("content-type") || "").includes("application/json") ? res.json() : null))
                            .then(data => {
                              if (data?.session) {
                                onJoinMatchSession(data.session.sessionCode);
                              }
                            })
                            .catch(() => {});
                        }
                      }}
                    >
                      Enter Live Match Arena 🚀
                    </GlowButton>
                  )}

                  {match.status === "COMPLETED" && (
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                      <span>Winner: {match.winnerName} 👑</span>
                      <span>{match.scoreA} vs {match.scoreB}</span>
                    </div>
                  )}
                </div>
              </BorderGlowCard>
            ))}

            {myMatches.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No active tournament matches assigned to you yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* All Active Tournaments Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" /> Active Tournaments
          </h3>

          <div className="space-y-3">
            {tournaments.map(t => (
              <GlowCard key={t.id} variant="amber" intensity="soft" animatedBorder="hover" className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white text-sm">{t.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    t.status === "LIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 animate-pulse" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.description || "Round-based elimination tournament."}</p>
                {t.championName && (
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-1">
                    <Award className="w-4 h-4" /> Champion: {t.championName} 🏆
                  </div>
                )}
              </GlowCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
