import { QuizPlateTemplate, SessionParticipantPlateAssignment } from "./database";

// In-memory persistence of assignments for this session
const plateAssignments: SessionParticipantPlateAssignment[] = [];

// Available templates (in production this would come from DB)
const AVAILABLE_TEMPLATES: QuizPlateTemplate[] = [
  { id: "neon-blue", name: "Neon Blue", category: "neon", enabled: true, config: { backgroundColor: "bg-slate-950", borderColor: "border-cyan-500", glowColor: "shadow-cyan-500/50", borderAnimation: true, fontFamily: "sans" } },
  { id: "pink-grad", name: "Pink Gradient", category: "gradient", enabled: true, config: { backgroundColor: "bg-gradient-to-br from-purple-900 to-pink-900", borderColor: "border-pink-400", glowColor: "shadow-pink-500/50", borderAnimation: false, fontFamily: "sans" } },
  { id: "glass-morphism", name: "Glassmorphism", category: "glass", enabled: true, config: { backgroundColor: "bg-white/10 backdrop-blur-lg", borderColor: "border-white/20", glowColor: "shadow-lg", borderAnimation: false, fontFamily: "sans" } },
  { id: "3d-card", name: "White 3D", category: "3d", enabled: true, config: { backgroundColor: "bg-slate-50", borderColor: "border-slate-200", glowColor: "shadow-2xl", borderAnimation: false, fontFamily: "serif" } },
  { id: "cyber-purple", name: "Cyber Purple", category: "neon", enabled: true, config: { backgroundColor: "bg-slate-900", borderColor: "border-purple-500", glowColor: "shadow-purple-500/50", borderAnimation: true, fontFamily: "sans" } },
  { id: "rainbow", name: "Rainbow", category: "gradient", enabled: true, config: { backgroundColor: "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500", borderColor: "border-white", glowColor: "shadow-xl", borderAnimation: true, fontFamily: "sans" } },
  { id: "midnight-gold", name: "Midnight Gold", category: "neon", enabled: true, config: { backgroundColor: "bg-black", borderColor: "border-amber-400", glowColor: "shadow-amber-500/50", borderAnimation: true, fontFamily: "sans" } },
  { id: "emerald-matrix", name: "Emerald Matrix", category: "neon", enabled: true, config: { backgroundColor: "bg-slate-950", borderColor: "border-emerald-400", glowColor: "shadow-emerald-500/50", borderAnimation: true, fontFamily: "sans" } },
];

export function getAssignedPlate(
  sessionId: string,
  participantId: string,
  questionIdx: number,
  participants: string[], // List of all participant IDs
  manualTemplateId?: string // Optional manual selection
): QuizPlateTemplate {
  // 1. Manual Template Override
  if (manualTemplateId) {
    return AVAILABLE_TEMPLATES.find((t) => t.id === manualTemplateId) || AVAILABLE_TEMPLATES[0];
  }

  // 2. Check for existing assignment
  const existing = plateAssignments.find(
    (a) => a.sessionId === sessionId && a.participantId === participantId && a.questionIdx === questionIdx
  );
  if (existing) {
    return AVAILABLE_TEMPLATES.find((t) => t.id === existing.plateId) || AVAILABLE_TEMPLATES[0];
  }

  // 3. Server-side Automatic Rotation
  const enabledTemplates = AVAILABLE_TEMPLATES.filter((t) => t.enabled);
  
  // Get all assignments for this specific question to ensure uniqueness
  const currentQuestionAssignments = plateAssignments.filter(
    (a) => a.sessionId === sessionId && a.questionIdx === questionIdx
  );
  const usedPlateIdsInThisQuestion = currentQuestionAssignments.map(a => a.plateId);

  // Get recent templates for this student to avoid repetition
  const studentRecentPlates = plateAssignments
    .filter((a) => a.sessionId === sessionId && a.participantId === participantId)
    .slice(-2)
    .map((a) => a.plateId);

  // Candidate templates: enabled, not used in this question, not recent for this student
  let candidates = enabledTemplates.filter(
    (t) => !usedPlateIdsInThisQuestion.includes(t.id) && !studentRecentPlates.includes(t.id)
  );

  // If no candidates, try just not recent
  if (candidates.length === 0) {
    candidates = enabledTemplates.filter((t) => !studentRecentPlates.includes(t.id));
  }

  // If still no candidates, just random enabled
  const selectedTemplate = candidates.length > 0 
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : enabledTemplates[Math.floor(Math.random() * enabledTemplates.length)];

  // Persist assignment (bounded to avoid memory leaks)
  if (plateAssignments.length > 2000) {
    plateAssignments.splice(0, 500);
  }
  plateAssignments.push({
    sessionId,
    participantId,
    questionIdx,
    plateId: selectedTemplate.id,
  });

  return selectedTemplate;
}
