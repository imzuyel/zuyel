"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Users, Play, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, RefreshCw, ChevronRight, Award, Shield, Eye } from "lucide-react";

interface TournamentDashboardProps {
  quizzes: any[];
  students: any[];
  teams?: any[];
  onStartMatchSession?: (sessionId: string, quizId: string) => void;
}

export default function TournamentDashboard({ quizzes, students, teams = [], onStartMatchSession }: TournamentDashboardProps) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "create" | "detail">("list");

  // Create Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuizId, setFormQuizId] = useState(quizzes[0]?.id || "");
  const [formMode, setFormMode] = useState<"individual" | "team">("individual");
  const [formMaxParticipants, setFormMaxParticipants] = useState(8);

  // Add Participant State
  const [selectedStudentId, setSelectedStudentId] = useState<number | "" >("");
  const [customParticipantName, setCustomParticipantName] = useState("");

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTournaments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const loadTournamentDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTournament(data.tournament);
        setParticipants(data.participants);
        setRounds(data.rounds);
        setMatches(data.matches);
        setActiveTab("detail");
      }
    } catch (err) {
      console.error("Failed to load tournament detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuizId) return;

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          quizId: formQuizId,
          mode: formMode,
          maxParticipants: Number(formMaxParticipants)
        })
      });
      const data = await res.json();
      if (data.success) {
        setFormName("");
        setFormDescription("");
        fetchTournaments();
        loadTournamentDetail(data.tournament.id);
      }
    } catch (err) {
      console.error("Failed to create tournament:", err);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId && !customParticipantName.trim()) return;

    let name = customParticipantName;
    let studentId = undefined;

    if (selectedStudentId) {
      const st = students.find(s => s.id === Number(selectedStudentId));
      if (st) {
        name = st.name;
        studentId = st.id;
      }
    }

    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, studentId })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedStudentId("");
        setCustomParticipantName("");
        loadTournamentDetail(selectedTournament.id);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to add participant:", err);
    }
  };

  const handleRemoveParticipant = async (pId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/participants/${pId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        loadTournamentDetail(selectedTournament.id);
      }
    } catch (err) {
      console.error("Failed to remove participant:", err);
    }
  };

  const handleGenerateBracket = async () => {
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/bracket`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        loadTournamentDetail(selectedTournament.id);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to generate bracket:", err);
    }
  };

  const handleStartTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/start`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        loadTournamentDetail(selectedTournament.id);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to start tournament:", err);
    }
  };

  const handleStartMatch = async (matchId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/matches/${matchId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostUserId: 3 })
      });
      const data = await res.json();
      if (data.success) {
        loadTournamentDetail(selectedTournament.id);
        if (onStartMatchSession && data.session) {
          onStartMatchSession(data.session.id, selectedTournament.quizId);
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to start match:", err);
    }
  };

  const handleCompleteMatch = async (matchId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/matches/${matchId}/complete`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        loadTournamentDetail(selectedTournament.id);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to complete match:", err);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Live Quiz Tournament & Brackets</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage round-based elimination tournaments, brackets, and live match sessions.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "list" ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            All Tournaments
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "create" ? "bg-amber-600 text-white shadow-md" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <Plus className="w-4 h-4" /> Create Tournament
          </button>
        </div>
      </div>

      {/* TAB: LIST */}
      {activeTab === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(t => (
            <div
              key={t.id}
              onClick={() => loadTournamentDetail(t.id)}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {t.mode} mode
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    t.status === "LIVE" ? "bg-emerald-100 text-emerald-800 animate-pulse" :
                    t.status === "COMPLETED" ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.description || "No description provided."}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Rounds: {t.numberOfRounds}</span>
                <span className="flex items-center gap-1 font-bold text-amber-600 group-hover:translate-x-1 transition-transform">
                  View Bracket <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}

          {tournaments.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Tournaments Created Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create your first round-based elimination tournament now.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: CREATE */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateTournament} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Create New Tournament</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure round-based elimination tournament parameters.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tournament Name</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="e.g., Annual Science Quiz Championship 2026"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Brief details about tournament rules & prizes..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Quiz / Question Set</label>
                <select
                  value={formQuizId}
                  onChange={e => setFormQuizId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900"
                >
                  {quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title} ({q.questions?.length || 0} Qs)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Competition Mode</label>
                <select
                  value={formMode}
                  onChange={e => setFormMode(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900"
                >
                  <option value="individual">Individual Students</option>
                  <option value="team">Team Mode</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Maximum Participants / Teams (Power of 2: 4, 8, 16)</label>
              <select
                value={formMaxParticipants}
                onChange={e => setFormMaxParticipants(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900"
              >
                <option value={4}>4 Participants (Semi Finals)</option>
                <option value={8}>8 Participants (Quarter Finals)</option>
                <option value={16}>16 Participants (Round of 16)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className="px-6 py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-md"
            >
              Create Tournament
            </button>
          </div>
        </form>
      )}

      {/* TAB: DETAIL & BRACKET */}
      {activeTab === "detail" && selectedTournament && (
        <div className="space-y-6">
          {/* Tournament Overview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800">
                  {selectedTournament.mode} tournament
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  selectedTournament.status === "LIVE" ? "bg-emerald-100 text-emerald-800 animate-pulse" :
                  selectedTournament.status === "COMPLETED" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
                  Status: {selectedTournament.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{selectedTournament.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTournament.description || "No description provided."}</p>
            </div>

            <div className="flex items-center gap-3">
              {selectedTournament.status === "DRAFT" || selectedTournament.status === "REGISTRATION_OPEN" || selectedTournament.status === "READY" ? (
                <button
                  onClick={handleGenerateBracket}
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Generate Bracket
                </button>
              ) : null}

              {selectedTournament.status === "READY" && (
                <button
                  onClick={handleStartTournament}
                  className="px-5 py-3 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center gap-2 animate-bounce"
                >
                  <Play className="w-4 h-4" /> Start Tournament LIVE
                </button>
              )}

              {selectedTournament.championName && (
                <div className="px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 flex items-center gap-3">
                  <Award className="w-6 h-6 text-amber-600 animate-pulse" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Champion 🏆</span>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedTournament.championName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Participants & Seeding Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" /> Participants ({participants.length}/{selectedTournament.maxParticipants})
                </h3>
              </div>

              {selectedTournament.status === "REGISTRATION_OPEN" && (
                <form onSubmit={handleAddParticipant} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">-- Select Existing Student --</option>
                    {students.map(st => (
                      <option key={st.id} value={st.id}>{st.name} (Roll: {st.roll})</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customParticipantName}
                      onChange={e => setCustomParticipantName(e.target.value)}
                      placeholder="Or Custom Name..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none"
                    />
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
                      Add
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">
                        {p.seed}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">{p.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.qualificationStatus}</span>
                      </div>
                    </div>
                    {selectedTournament.status === "REGISTRATION_OPEN" && (
                      <button onClick={() => handleRemoveParticipant(p.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {participants.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No participants added yet.</p>
                )}
              </div>
            </div>

            {/* Visual Tournament Bracket */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" /> Tournament Bracket & Live Matches
                </h3>
                <button onClick={() => loadTournamentDetail(selectedTournament.id)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-8">
                {rounds.map(round => {
                  const roundMatches = matches.filter(m => m.roundId === round.id);
                  return (
                    <div key={round.id} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-600">{round.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{roundMatches.length} Match(es)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roundMatches.map(match => (
                          <div key={match.id} className={`p-4 rounded-2xl border transition-all ${
                            match.status === "LIVE" ? "bg-emerald-50 dark:bg-emerald-950/40/50 border-emerald-300 shadow-md ring-2 ring-emerald-400/20" :
                            match.status === "COMPLETED" ? "bg-slate-50 border-slate-200 dark:border-slate-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          }`}>
                            <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase">
                              <span className="text-slate-400">Match #{match.matchNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full ${
                                match.status === "LIVE" ? "bg-emerald-600 text-white animate-pulse" :
                                match.status === "COMPLETED" ? "bg-indigo-100 text-indigo-800" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              }`}>
                                {match.status}
                              </span>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                                match.winnerId === match.participantAId ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              }`}>
                                <span>{match.participantAName || "TBD"}</span>
                                {match.status === "COMPLETED" && <span>{match.scoreA || 0} pts</span>}
                              </div>
                              <div className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                                match.winnerId === match.participantBId ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              }`}>
                                <span>{match.participantBName || "TBD"}</span>
                                {match.status === "COMPLETED" && <span>{match.scoreB || 0} pts</span>}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              {match.status === "READY" && selectedTournament.status === "LIVE" && !match.isBye && (
                                <button
                                  onClick={() => handleStartMatch(match.id)}
                                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" /> Start Match Session
                                </button>
                              )}

                              {match.status === "LIVE" && (
                                <button
                                  onClick={() => handleCompleteMatch(match.id)}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Complete & Advance Winner
                                </button>
                              )}

                              {match.status === "COMPLETED" && (
                                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                                  Winner: {match.winnerName} 👑
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {rounds.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Bracket not generated yet. Add participants and click &quot;Generate Bracket&quot;.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
