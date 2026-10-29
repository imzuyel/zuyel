// Institutional In-Memory / File Persistent Database for Panchagarh Govt. Technical School & College (PTSC)
// Production Ready Clean Version - Fake Students & Demo Records Removed
import { ACADEMIC_HOLIDAYS_2026 } from "./attendanceData";
import { initialDocumentTemplates } from "./documentsData";
import {
  DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS,
  AcademyClassTradeMapping,
  AcademyTradeConfig,
} from "./academySettingsStore";

export interface InstitutionInfo {
  name: string;
  nameBangla: string;
  eiin: string;
  code: string;
  board: string;
  directorate: string;
  ministry: string;
  established: number;
  location: string;
  locationBangla: string;
  areaLand: string;
  buildings: number;
  classrooms: number;
  workshops: number;
  labs: number;
  library: number;
  phoneLandline: string;
  principalMobile: string;
  email: string;
  website: string;
  principalName: string;
  principalDesignation: string;
  principalMessage: string;
  vision: string;
  mission: string;
}

export interface Trade {
  id: number;
  code: string;
  name: string;
  nameBangla: string;
  description: string;
  duration: string;
  intakeCapacity: number;
  totalLabs: number;
  badgeGradient: string;
  iconName: string;
}

export interface ClassItem {
  id: number;
  name: string;
  numericValue: number;
  level: "general" | "technical";
  section: string;
  shift: string;
}

export interface Student {
  id: number;
  studentId: string;
  admissionNo: string;
  roll: number;
  name: string;
  nameBangla: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  birthRegNo: string;
  fatherName: string;
  motherName: string;
  guardianMobile: string;
  studentMobile: string;
  email: string;
  presentAddress: string;
  permanentAddress: string;
  dobBangla?: string;
  classId: number;
  className: string;
  tradeId?: number;
  tradeName?: string;
  tradeNameBangla?: string;
  shift: "First Shift" | "Second Shift";
  shiftBangla: string;
  section: string;
  session: string;
  status: "Active" | "Archived" | "Inactive" | "Transferred" | "Dropped" | (string & {});
  photoUrl: string;
  attendanceRate: number;
  gpa: string;
  resultStatus: "Passed" | "Failed";
  nationality?: string;
  guardianName?: string;
  guardianRelationship?: string;
  emergencyContact?: string;
  admissionDate?: string;
}

export interface FacultyMember {
  id: number;
  employeeId: string;
  name: string;
  nameBangla: string;
  designation: string;
  department: string;
  tradeCode?: string;
  qualification: string;
  joiningDate: string;
  mobile: string;
  email: string;
  photoUrl: string;
  order: number;
  type: "faculty" | "staff";
}

export interface RoutineItem {
  id: number;
  academicYear?: string;
  classId: number;
  className: string;
  tradeCode?: string;
  tradeName?: string;
  section?: string;
  department?: string;
  day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | WeekDay;
  periodNo: number;
  periodLabel?: string;
  periodType?: "regular" | "double" | "triple" | "lab_block" | "practical" | "break" | "assembly" | "special";
  startTime: string;
  endTime: string;
  durationMinutes: number;
  subjectCode: string;
  subjectName: string;
  subjectNameBangla: string;
  teacherId?: number;
  teacherName: string;
  teacherBangla?: string;
  roomNo: string;
  roomType?: "classroom" | "lab" | "workshop" | "hall";
  isLab?: boolean;
  status?: "draft" | "review" | "approved" | "published" | "archived" | "locked";
  isLocked?: boolean;
  lockScope?: "none" | "item" | "period" | "teacher" | "room" | "class";
  version?: number;
  substituteTeacherId?: number;
  substituteTeacherName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamRoutineItem {
  id: number;
  examName: string;
  date: string;
  day: string;
  time: string;
  classLevel: string;
  tradeName: string;
  subjectCode: string;
  subjectName: string;
  roomNo: string;
}

export interface ExamMarkAuditEntry {
  id?: string;
  timestamp: string;
  changedBy: string;
  action?: "create" | "update" | "correct" | "publish" | "lock" | "unlock" | string;
  previousMarks?: {
    theoryMarks?: number;
    practicalMarks?: number;
    finalMarks?: number;
    continuousAssessment?: number;
    totalMarks?: number;
    grade?: string;
  };
  newMarks?: {
    theoryMarks?: number;
    practicalMarks?: number;
    finalMarks?: number;
    continuousAssessment?: number;
    totalMarks?: number;
    grade?: string;
  };
  oldValues?: {
    theoryMarks?: number;
    practicalMarks?: number;
    continuousAssessment?: number;
    totalMarks?: number;
    grade?: string;
  };
  newValues?: {
    theoryMarks?: number;
    practicalMarks?: number;
    continuousAssessment?: number;
    totalMarks?: number;
    grade?: string;
  };
  reason?: string;
}

export interface ExamMark {
  id: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  roll: number;
  academicYear?: number;
  examName?: string;
  examId?: number;
  classId?: number;
  className?: string;
  tradeId?: number;
  tradeName?: string;
  tradeCode?: string;
  section?: string;
  subjectCode: string;
  subjectName: string;
  subjectNameBangla: string;
  quizzes?: (number | null)[];
  classTests?: (number | null)[];
  practicals?: (number | null)[];
  ctAvg: number;
  quizAvg: number;
  practicalAvg: number;
  continuousAssessment: number;
  totalAttendance?: number;
  quizTotal?: number;
  classTestTotal?: number;
  tcAttendanceConduct?: number;
  midtermTheory?: number;
  assignment?: number;
  tcTotal?: number;
  jobs?: (number | null)[];
  jobsTotal?: number;
  midtermPractical?: number;
  report?: number;
  viva?: number;
  pcAttendanceConduct?: number;
  pcTotal?: number;
  assessmentDates?: Record<string, string>;
  theoryMarks: number;
  practicalMarks?: number;
  finalMarks: number;
  totalMarks: number;
  maxMarks?: number;
  passMarks?: number;
  grade: string;
  gradePoint: number;
  status?: "Passed" | "Failed";
  publicationStatus?: "Draft" | "Reviewed" | "Published" | "Locked";
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
  auditHistory?: ExamMarkAuditEntry[];
}

export interface GradingScheme {
  id: number;
  name: string;
  academicYear: number;
  minMark: number;
  maxMark: number;
  grade: string;
  point: number;
  remarks: string;
  isPass: boolean;
  displayOrder: number;
}

export interface ResultPolicy {
  id: number;
  academicYear: number;
  passPolicy: "individual" | "overall" | "mixed";
  gpaPrecision: number;
  rankingEnabled: boolean;
  rankingScope: "class" | "section" | "trade";
  tieBreakerPolicy: "highest_marks" | "attendance" | "dob";
  showRankToPublic: boolean;
}

export interface StudentOverallResult {
  id: string;
  examId: number;
  examName: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  roll: number;
  classId: number;
  className: string;
  section: string;
  tradeId?: number;
  tradeName?: string;
  academicYear: number;
  totalMarks: number;
  maxMarks: number;
  gpa: number;
  letterGrade: string;
  resultStatus: "Passed" | "Failed" | "Withheld" | "Incomplete" | "Absent";
  failedSubjectsCount: number;
  failedSubjects: { code: string; name: string; marks: number; passMarks: number }[];
  meritPosition: number | null;
  status: "Draft" | "Calculated" | "Verified" | "Finalized" | "Published" | "Locked";
  version: number;
  updatedBy: string;
  updatedAt: string;
  history?: {
    version: number;
    changedBy: string;
    changedAt: string;
    reason: string;
    oldValues: any;
  }[];
}

export interface StudentAcademicPlacement {
  id: string;
  studentId: number;
  academicYear: number;
  classId: number;
  className: string;
  section: string;
  tradeId?: number;
  tradeName?: string;
  shift: string;
  status: string;
  isCurrent: boolean;
  effectiveDate: string;
  remarks?: string;
}

export interface StudentLifecycleEvent {
  id: string;
  studentId: number;
  eventType: "Admission" | "Promotion" | "Demotion" | "Transfer Out" | "Transfer In" | "Status Change" | "Section Change" | "Trade Change" | "Re-admission" | "Dropout" | "Graduation" | "Merge";
  previousState?: any;
  newState?: any;
  effectiveDate: string;
  reason: string;
  performedBy: string;
  timestamp: string;
  documentRef?: string;
}

export interface PromotionRule {
  id: number;
  name: string;
  academicYear: number;
  sourceClassId: number;
  targetClassId: number;
  minGpa?: number;
  maxFailedSubjects?: number;
  minAttendanceRate?: number;
  requiredSubjects?: string[];
  autoPromotion: boolean;
}

export interface InstitutionalExam {
  id: number;
  name: string;
  nameBangla: string;
  academicYear: number;
  term: "Half-Yearly" | "Annual" | "Pre-Test" | "Model-Test" | "Continuous";
  status: "Draft" | "Ongoing" | "Published" | "Locked";
  startDate: string;
  endDate: string;
}

export type AttendanceStatus = "P" | "A" | "L" | "E" | "M";

export interface AttendanceEntry {
  studentId: number;
  roll: number;
  studentCode: string;
  name: string;
  nameBangla?: string;
  status: AttendanceStatus;
  inTime?: string;
  remark?: string;
  photoUrl?: string;
}

export interface AttendanceAuditLog {
  id: string;
  timestamp: string;
  studentId?: number;
  studentName?: string;
  previousStatus?: string;
  newStatus?: string;
  changedBy: string;
  reason: string;
}

export type AttendanceRecordType =
  | "regular"
  | "period"
  | "subject"
  | "practical"
  | "exam"
  | "special";

export type AttendanceWorkflowStatus = "draft" | "saved" | "finalized";

export interface EmployeeAttendanceAuditLog {
  id: string;
  timestamp: string;
  changedBy: string;
  previousStatus?: string;
  newStatus: string;
  reason: string;
}

export type EmployeeAttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "early_leave"
  | "half_day"
  | "on_leave"
  | "official_duty"
  | "training"
  | "meeting"
  | "holiday"
  | "working_day"
  | "other";

export interface EmployeeAttendanceRecord {
  id: string;
  date: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  employeeNameBangla?: string;
  designation: string;
  department: string;
  type: "faculty" | "staff";
  photoUrl?: string;
  status: EmployeeAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remarks?: string;
  isLocked?: boolean;
  lockedAt?: string;
  lockedBy?: string;
  updatedBy: string;
  updatedAt: string;
  auditHistory?: EmployeeAttendanceAuditLog[];
}

export interface EmployeeAttendanceLock {
  id: string;
  date: string;
  employeeType: "faculty" | "staff" | "all";
  isLocked: boolean;
  lockedAt: string;
  lockedBy: string;
  reason?: string;
}

export interface EmployeeLeaveRequest {
  id: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  employeeType: "faculty" | "staff";
  leaveType:
    | "Casual Leave"
    | "Sick Leave"
    | "Earned Leave"
    | "Official Duty"
    | "Maternity Leave"
    | "Study Leave"
    | "Unpaid Leave";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  supportingDocUrl?: string;
  substituteEmployeeId?: number;
  substituteEmployeeName?: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type WeekDay = "Saturday" | "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

export interface SubstituteDutyRecord {
  id: string;
  date: string;
  day: WeekDay;
  periodNo: number;
  classId: number;
  className: string;
  section: string;
  tradeCode?: string;
  subjectCode: string;
  subjectName: string;
  originalTeacherId: number;
  originalTeacherName: string;
  substituteTeacherId: number;
  substituteTeacherName: string;
  reason: string;
  authorizedBy: string;
  status: "assigned" | "completed" | "cancelled";
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  session: string;
  date: string;
  classId: number;
  className: string;
  tradeId?: number;
  tradeCode?: string;
  tradeName?: string;
  section: string;
  subjectCode?: string;
  subjectName?: string;
  periodNo?: number;
  attendanceType?: AttendanceRecordType;
  status?: AttendanceWorkflowStatus;
  roomNo?: string;
  isLab?: boolean;
  teacherId?: number;
  teacherName: string;
  substituteTeacherName?: string;
  department: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  entries: AttendanceEntry[];
  auditLogs: AttendanceAuditLog[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | "certificate"
  | "testimonial"
  | "transfer_certificate"
  | "bonafide"
  | "character";

export interface StudentIdConfig {
  prefix: string;
  includeYear: boolean;
  yearFormat: "YYYY" | "YY";
  includeClass: boolean;
  includeTradeForVocational: boolean;
  tradeFormat: "code" | "short" | "none";
  separator: "-" | "/" | "_" | "";
  sequenceLength: number;
  sequenceBasis: "roll" | "class_sequential" | "global_serial";
  customPattern?: string;
}

export interface StudentIdAuditLog {
  id: string;
  studentId: number;
  studentName: string;
  roll: number;
  className: string;
  previousStudentId: string;
  newStudentId: string;
  changedBy: string;
  reason: string;
  timestamp: string;
  actionType: "single_generate" | "bulk_generate" | "correction" | "duplicate_fix";
}

export type DocumentStatus = "draft" | "generated" | "issued" | "cancelled";

export interface DocumentSignatory {
  id: string;
  title: string;
  name: string;
  designation: string;
  institutionName?: string;
  isVisible: boolean;
}

export interface DocumentAuditLog {
  id: string;
  action: "created" | "updated" | "issued" | "cancelled" | "reprinted" | "template_modified";
  performedBy: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export interface DocumentReprintLog {
  reprintedAt: string;
  reprintedBy: string;
  reason: string;
  copyNumber: number;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  titleBangla: string;
  docType: DocumentType | string;
  code: string;
  themeId: string;
  bodyTemplate: string;
  headerConfig?: {
    showGovLogo: boolean;
    showBtebLogo: boolean;
    customHeaderBangla?: string;
    customSubHeader?: string;
    eiinText?: string;
  };
  signatories?: DocumentSignatory[];
  watermarkText?: string;
  status: "active" | "draft" | "archived";
  isSystemDefault?: boolean;
  conductStatement?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDocument {
  id: string;
  docNumber: string;
  docType: DocumentType | string;
  docTypeBangla: string;
  theme: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentNameBangla: string;
  roll: number;
  classId: number;
  className: string;
  tradeId?: number;
  tradeName?: string;
  tradeNameBangla?: string;
  section: string;
  session: string;
  admissionNo: string;
  fatherName: string;
  motherName: string;
  dob: string;
  dobBangla: string;
  birthRegNo?: string;
  gpa?: string;
  resultStatus?: string;
  passingYear?: string;
  leavingReason?: string;
  issueDate: string;
  issueDateBangla: string;
  generatedBy: string;
  qrCodeData: string;
  customBodyText?: string;
  remarks?: string;
  status: DocumentStatus;
  version: number;
  reprintCount: number;
  reprintHistory?: DocumentReprintLog[];
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  signatories?: DocumentSignatory[];
  templateId?: string;
  conductStatement?: string;
  auditLogs?: DocumentAuditLog[];
  createdAt: string;
  updatedAt?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  mode: "academic" | "general";
  subjectId?: number;
  classId?: number;
  sectionId?: number;
  tradeId?: number;
  academicYearId?: number;
  chapterId?: string;
  topicId?: string;
  creatorId: number;
  category: string;
  status: "draft" | "published" | "archived";
  defaultMarks: number;
  negativeMarking: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  defaultQuestionTime: number;
  totalDuration: number;
  showScore: boolean;
  showCorrectAnswer: boolean;
  showExplanation: boolean;
  showLeaderboard: boolean;
  className?: string;
  tradeName?: string;
  subjectName?: string;
  subjectCode?: string;
  presentationSlides?: any[];
  scheduledStartTime?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankQuestion {
  id: string;
  type: "mcq_single" | "mcq_multiple" | "true_false" | "matching" | "ordering" | "fill_blank" | "short_answer" | "image_choice" | "poll";
  questionText: string;
  questionData: any; 
  subjectId: number;
  classId: number;
  tradeId?: number;
  chapterId?: string;
  topicId?: string;
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
  createdBy: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface QuizPlateTemplate {
  id: string;
  name: string;
  category: "neon" | "gradient" | "glass" | "3d" | "minimal";
  previewUrl?: string;
  enabled: boolean;
  config: {
    backgroundColor: string;
    borderColor: string;
    glowColor: string;
    borderAnimation: boolean;
    fontFamily: string;
  };
}

export interface SessionParticipantPlateAssignment {
  sessionId: string;
  participantId: string;
  questionIdx: number;
  plateId: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionBankId: string;
  questionType: string;
  questionSnapshot: any; 
  orderIndex: number;
  marks: number;
  timeLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIGenerationJob {
  id: string;
  userId: number;
  subjectId: number;
  classId: number;
  topic: string;
  chapter?: string;
  lesson?: string;
  learningObjective?: string;
  language: "Bangla" | "English";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionType: string;
  questionCount: number;
  prompt?: string;
  provider: string;
  model: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  documentId?: string;
  documentVersion?: number;
  pageRange?: string;
}

export interface AIGeneratedQuestion {
  id: string;
  generationJobId: string;
  type: string;
  questionText: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  questionData: any;
  status: "generated" | "reviewed" | "approved" | "rejected" | "saved";
  duplicateHash?: string;
  reviewedBy?: number;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  documentId?: string;
  pageNumber?: number;
  chunkId?: string;
  sourceExcerpt?: string;
}

export interface PdfDocument {
  id: string;
  title: string;
  originalFilename: string;
  description?: string;
  subjectId?: number;
  classId?: number;
  className?: string;
  tradeId?: number;
  tradeName?: string;
  sectionId?: number;
  academicYearId?: number;
  chapter?: string;
  topic?: string;
  tags?: string[];
  storageProvider: "local" | "s3" | "gcs" | "mock";
  storageKey: string;
  mimeType: string;
  fileSize: number;
  pageCount: number;
  processingStatus: "uploading" | "uploaded" | "processing" | "processed" | "failed" | "archived";
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  version?: number;
  generatedQuestionsCount?: number;
  lastUsedAt?: string;
}

export interface PdfPage {
  id: string;
  documentId: string;
  pageNumber: number;
  extractedText: string;
  isScanned?: boolean;
  extractionStatus: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface PdfChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  startPage: number;
  endPage: number;
  chunkText: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveTeam {
  id: string;
  sessionId: string;
  name: string;
  displayName: string;
  color?: string;
  status: "ACTIVE" | "LOCKED";
  createdAt: string;
  updatedAt: string;
}

export interface LiveTeamMember {
  id: string;
  sessionId: string;
  teamId: string;
  playerId: string;
  joinedAt: string;
}

export interface LiveSession {
  id: string;
  quizId: string;
  hostUserId: number;
  sessionCode: string;
  pinCode?: string;
  quizPlateId?: string;
  questions?: any[];
  joinToken: string;
  status: "CREATED" | "LOBBY" | "STARTING" | "QUESTION_ACTIVE" | "QUESTION_ENDED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  maxPlayers: number;
  isLocked: boolean;
  isQuizStarted?: boolean;
  currentSlideIndex?: number;
  currentQuestionIndex: number;
  questionStartedAt?: string;
  readyEndsAt?: string;
  countdownEndsAt?: string;
  previewEndsAt?: string;
  sequenceStartedAt?: string;
  questionEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  competitionMode?: "individual" | "team";
  teamSettings?: {
    nameMode?: "predefined" | "custom";
    numberOfTeams?: number;
    maxPlayersPerTeam?: number;
    minPlayersPerTeam?: number;
    assignmentMode?: "manual" | "automatic" | "student_select";
  };
  isTeamLocked?: boolean;
  hostConnectionStatus?: "online" | "reconnecting" | "disconnected";
  hostLastSeenAt?: string;
  hostReconnectTokenHash?: string;
  hostReconnectTokenExpiresAt?: string;
  motivationEnabled?: boolean;
  motivationInterval?: number;
  isQuizModeStarted?: boolean;
  preQuizActivities?: PreQuizActivity[];
  activePreQuizActivity?: PreQuizActivity | null;
  scheduledStartTime?: string;
  scheduledAt?: string;
  academicYearId?: number | string;
  classId?: number | string;
  className?: string;
  tradeId?: number | string;
  tradeName?: string;
  subjectId?: number | string;
  subjectName?: string;
  subjectCode?: string;
  autoSmsMilestone?: string;
  smsRecipient?: string;
  smsFunnyMode?: boolean;
  smsPraiseMode?: boolean;
  customFunnyTemplate?: string;
  customPraiseTemplate?: string;
  sentMilestones?: any[];
}

export type PreQuizSlideType =
  | "icebreaker"
  | "poll"
  | "survey"
  | "message"
  | "WORD_CLOUD"
  | "MOOD_CHECKIN"
  | "STICKY_WALL"
  | "OPEN_FEEDBACK"
  | "OPINION_POLL"
  | "INTRO_SLIDE"
  | string;

export interface PreQuizResponseItem {
  playerId: string;
  playerName: string;
  avatar?: string;
  response: string;
  color?: string; // For sticky notes (amber, rose, cyan, emerald)
  mood?: string; // For mood check-in (fire, happy, thinking, tired)
  submittedAt: string;
}

export interface PreQuizActivity {
  id: string;
  sessionId: string;
  type: PreQuizSlideType;
  prompt: string;
  options?: string[];
  responses: PreQuizResponseItem[];
  isActive: boolean;
  createdAt: string;
  metadata?: {
    tradeName?: string;
    className?: string;
    teacherNote?: string;
    topic?: string;
    [key: string]: any;
  };
}

export interface LiveParticipant {
  id: string;
  sessionId: string;
  studentId?: number;
  userId?: number;
  displayName: string;
  phone?: string;
  avatar?: string;
  playerToken: string;
  status: "JOINED" | "LEFT";
  joinedAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
  totalScore?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  unanswered?: number;
  currentStreak?: number;
  bestStreak?: number;
  rank?: number;
  previousRank?: number;
  connectionStatus?: "online" | "connecting" | "reconnecting" | "disconnected" | "left";
  reconnectTokenHash?: string;
  reconnectTokenExpiresAt?: string;
  lastConnectionId?: string;
  motivationMessage?: {
    category: string;
    message: string;
    questionIndex: number;
    shown?: boolean;
  } | null;
  lastSmsSentQuestionIndex?: number;
}

export interface LiveAnswer {
  id: string;
  sessionId: string;
  playerId: string;
  questionId: string;
  answerPayload: any;
  submittedAt: string;
  responseTimeMs: number;
  createdAt: string;
  updatedAt: string;
  isCorrect?: boolean | null;
  answerStatus?: "SUBMITTED" | "UNANSWERED" | "MANUAL_REVIEW";
  basePoints?: number;
  speedBonus?: number;
  streakBonus?: number;
  penalty?: number;
  totalPoints?: number;
  evaluatedAt?: string;
}

export interface LiveQuizAuditLog {
  id: string;
  sessionId: string;
  playerId?: string;
  eventType: "PLAYER_JOINED" | "PLAYER_RECONNECTED" | "PLAYER_DISCONNECTED" | "PLAYER_RECONNECT_FAILED" | "DUPLICATE_CONNECTION" | "DUPLICATE_ANSWER" | "INVALID_RECONNECT_TOKEN" | "RATE_LIMIT_TRIGGERED" | "UNAUTHORIZED_HOST_ACTION" | "SESSION_STATE_RECOVERY" | "ELIGIBILITY_GATE_BLOCKED";
  message: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface GlobalAuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  module: string;
  targetId: string;
  targetType: string;
  details: any;
  createdAt: string;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  quizId: string;
  mode: "individual" | "team";
  maxParticipants: number;
  numberOfRounds: number;
  qualificationRule: string;
  matchSize: number;
  startTime: string;
  registrationStatus: "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "READY" | "LIVE" | "COMPLETED" | "CANCELLED";
  status: "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "READY" | "LIVE" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  championParticipantId?: string;
  championName?: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  studentId?: number;
  teamId?: string;
  name: string;
  seed: number;
  status: "ACTIVE" | "QUALIFIED" | "ELIMINATED" | "CHAMPION";
  registrationTime: string;
  qualificationStatus: string;
}

export interface TournamentRound {
  id: string;
  tournamentId: string;
  roundNumber: number;
  name: string;
  status: "PENDING" | "LIVE" | "COMPLETED";
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  roundId: string;
  matchNumber: number;
  participantAId?: string | null;
  participantBId?: string | null;
  participantAName?: string;
  participantBName?: string;
  quizSessionId?: string | null;
  status: "PENDING" | "READY" | "LIVE" | "COMPLETED" | "CANCELLED";
  winnerId?: string | null;
  winnerName?: string | null;
  loserId?: string | null;
  scoreA?: number;
  scoreB?: number;
  startedAt?: string;
  completedAt?: string;
  isBye?: boolean;
}

export interface EligibilityPolicy {
  id: string;
  name: string;
  description?: string;
  type: "attendance_percentage" | "attendance_present" | "quiz_specific" | "unconditional";
  scope: "global" | "academic_year" | "class" | "trade" | "subject" | "quiz";
  scopeId?: string;
  minAttendancePercentage?: number;
  calculationWindow: "current_day" | "current_week" | "current_month" | "current_term" | "current_academic_year" | "custom_date_range";
  customStartDate?: string;
  customEndDate?: string;
  subjectSpecific: boolean;
  quizTypeScope?: string[];
  studentStatusScope?: string[];
  priority: number;
  version: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityPolicyVersion {
  id: string;
  policyId: string;
  version: number;
  policySnapshot: any;
  changedBy: string;
  reason?: string;
  createdAt: string;
}

export interface EligibilityException {
  id: string;
  studentId: number;
  policyId?: string;
  quizId?: string;
  scope: "global" | "subject" | "quiz";
  scopeId?: string;
  effectiveDate: string;
  expiryDate: string;
  approvedBy: string;
  reason: string;
  reference?: string;
  status: "active" | "expired" | "revoked";
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityOverride {
  id: string;
  studentId: number;
  quizId: string;
  quizSessionId?: string;
  originalDecision: "ELIGIBLE" | "NOT_ELIGIBLE" | "REVIEW_REQUIRED";
  newDecision: "ELIGIBLE" | "NOT_ELIGIBLE" | "REVIEW_REQUIRED";
  reason: string;
  reference?: string;
  performedBy: string;
  createdAt: string;
}

export interface EligibilityDecision {
  id: string;
  studentId: number;
  quizId: string;
  quizSessionId?: string;
  academicContext: {
    academicYear: number;
    classId: number;
    section: string;
    tradeId?: number;
    subjectId?: number;
  };
  attendanceContext: {
    totalClasses: number;
    presentClasses: number;
    attendancePercentage: number;
    window: string;
  };
  policyUsed: {
    id: string;
    name: string;
    version: number;
    threshold: number;
  };
  exceptionApplied?: {
    id: string;
    reason: string;
    approvedBy: string;
  } | null;
  overrideApplied?: {
    performedBy: string;
    reason: string;
    timestamp: string;
  } | null;
  finalDecision: "ELIGIBLE" | "NOT_ELIGIBLE" | "REVIEW_REQUIRED";
  decisionReason: string;
  calculatedAt: string;
}

export interface EligibilityAuditLog {
  id: string;
  eventType: "POLICY_CREATED" | "POLICY_UPDATED" | "EXCEPTION_CREATED" | "EXCEPTION_APPROVED" | "OVERRIDE_CREATED" | "OVERRIDE_APPLIED" | "ELIGIBILITY_CALCULATED" | "SESSION_FROZEN" | "QUIZ_SESSION_ELIGIBILITY_FROZEN" | "ELIGIBILITY_RECALCULATED" | string;
  message: string;
  performedBy: string;
  timestamp: string;
  details?: any;
}

export interface AcademicHoliday {
  date: string;
  title: string;
  titleBangla: string;
  type: "national" | "religious" | "institutional";
}

export interface ResultPdf {
  id: number;
  title: string;
  className: string;
  tradeName: string;
  examName: string;
  publishedDate: string;
  fileSize: string;
  fileName: string;
  downloadUrl: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  titleBangla: string;
  category: "campus" | "labs" | "fair" | "cultural" | "sports";
  categoryBangla: string;
  imageUrl: string;
  date: string;
  description: string;
}

export interface Notice {
  id: number;
  title: string;
  titleBangla: string;
  content: string;
  category: "academic" | "exam" | "urgent" | "holiday" | "admission" | "quiz" | "attendance";
  categoryBangla: string;
  publishedAt: string;
  expiryAt?: string;
  author: string;
  attachmentName?: string;
  isUrgent?: boolean;
  status: "draft" | "published" | "archived" | "scheduled";
  targetAudience: {
    type: "all" | "class" | "teacher" | "staff" | "guardian";
    classIds?: number[];
    tradeIds?: number[];
    academicYears?: string[];
  };
}

export interface EventItem {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  type: "academic" | "exam" | "holiday" | "workshop";
  location: string;
  description: string;
  published?: boolean;
  featured?: boolean;
}

export interface DownloadItem {
  id: number;
  title: string;
  titleBangla: string;
  category: "syllabus" | "form" | "routine" | "calendar" | "question_paper" | "other";
  categoryBangla: string;
  fileName: string;
  fileSize: string;
  downloadUrl: string;
  published: boolean;
  displayOrder: number;
  description?: string;
  createdAt: string;
}

export interface CMSConfig {
  heroBanner: {
    imageUrl: string;
    title: string;
    subtitle: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    heroSlides?: string[];
  };
  principal: {
    name: string;
    designation: string;
    message: string;
    photoUrl: string;
  };
  sectionsVisibility: {
    hero: boolean;
    ticker: boolean;
    stats: boolean;
    intro: boolean;
    principalMessage: boolean;
    featuredNotices: boolean;
    upcomingEvents: boolean;
    trades: boolean;
    results: boolean;
    galleryPreview: boolean;
    quickLinks: boolean;
    contact: boolean;
  };
  sectionsOrder: string[];
  menuItems: {
    id: string;
    label: string;
    url?: string;
    visible: boolean;
    order: number;
    icon: string;
  }[];
  footer: {
    address: string;
    phone: string;
    email: string;
    copyrightText: string;
    socialFacebook?: string;
    socialYoutube?: string;
    socialTwitter?: string;
  };
  contactMapEmbed: string;
}

const initialDownloads: DownloadItem[] = [
  {
    id: 1,
    title: "SSC Vocational Curriculum & Syllabus 2026",
    titleBangla: "এসএসসি ভোকেশনাল শিক্ষাক্রম ও সিলেবাস ২০২৬",
    category: "syllabus",
    categoryBangla: "সিলেবাস ও কারিকুলাম",
    fileName: "ssc_vocational_syllabus_2026.pdf",
    fileSize: "2.4 MB",
    downloadUrl: "https://bteb.gov.bd/sites/default/files/files/bteb.portal.gov.bd/publications/91838cf4_a88b_4dbf_9eef_8884ec866df7/2026-01-10-10-00.pdf",
    published: true,
    displayOrder: 1,
    description: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড কর্তৃক অনুমোদিত নবম ও দশম শ্রেণির শিক্ষাক্রম ও সিলেবাস।",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: 2,
    title: "Official Academic Calendar & Holiday List 2026",
    titleBangla: "অফিশিয়াল একাডেমিক ক্যালেন্ডার ও ছুটির তালিকা ২০২৬",
    category: "calendar",
    categoryBangla: "একাডেমিক ক্যালেন্ডার",
    fileName: "pgtsc_academic_calendar_2026.pdf",
    fileSize: "1.1 MB",
    downloadUrl: "https://dte.gov.bd/sites/default/files/files/dte.portal.gov.bd/notices/832f05fa_cfb2_4fa8_a5bb_8778e388c6df/2026-01-15-11-00.pdf",
    published: true,
    displayOrder: 2,
    description: "২০২৬ খ্রিষ্টাব্দের ক্লাস রুটিন চক্র, পর্ব মধ্য পরীক্ষা ও বার্ষিক বন্ধের অফিশিয়াল ক্যালেন্ডার।",
    createdAt: "2026-01-15T11:00:00Z",
  },
  {
    id: 3,
    title: "Admission Form & Instructions 2026",
    titleBangla: "ভর্তি আবেদন ফরম ও নির্দেশনা ২০২৬",
    category: "form",
    categoryBangla: "ভর্তি ফরম ও আবেদন",
    fileName: "admission_form_2026.pdf",
    fileSize: "850 KB",
    downloadUrl: "https://bteb.gov.bd/sites/default/files/files/bteb.portal.gov.bd/admission/2026_admission_form.pdf",
    published: true,
    displayOrder: 3,
    description: "একাদশ শ্রেণি (এইচএসসি ভোকেশনাল) ও নবম শ্রেণির ভর্তি আবেদন ফরম ও অফলাইন জমাদানের নীতিমালা।",
    createdAt: "2026-02-01T09:30:00Z",
  }
];

const initialCmsConfig: CMSConfig = {
  heroBanner: {
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80",
    title: "কারিগরি শিক্ষা গ্রহণ করি, সমৃদ্ধ বাংলাদেশ গড়ি",
    subtitle: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
    description: "একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবিলায় আধুনিক ল্যাব, দক্ষ শিক্ষক এবং কর্মমুখী শিক্ষায় উৎকর্ষ সাধনে আমরা বদ্ধপরিকর। জ্ঞান, দক্ষতা ও কর্মসংস্থানই আমাদের মূল ভিত্তি।",
    buttonText: "🚀 লাইভ কুইজে অংশগ্রহণ করুন (Live Quiz)",
    buttonUrl: "live_quiz",
    heroSlides: [
      "কারিগরি শিক্ষায় গড়ব দেশ, স্মার্ট বাংলাদেশ গড়ার প্রত্যয়",
      "দক্ষ হাত, বিশ্বজুড়ে কর্মসংস্থান—কারিগরি শিক্ষার মূল অবদান",
      "৪র্থ শিল্পবিপ্লবের চ্যালেঞ্জ মোকাবিলায় আধুনিক কারিগরি ও আইওটি শিক্ষা",
      "পড়াশোনার পাশাপাশি বাস্তবমুখী প্রশিক্ষণ, আত্মনির্ভরশীল ভবিষ্যৎ",
      "নারী-পুরুষ নির্বিশেষে কারিগরি শিক্ষা, সমৃদ্ধ অর্থনীতির চাবিকাঠি"
    ]
  },
  principal: {
    name: "প্রকৌ. মো. রফিকুল ইসলাম",
    designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
    message: "প্রিয় শিক্ষার্থীবৃন্দ, অভিভাবকবৃন্দ এবং শুভাকাঙ্ক্ষীগণ, Panchagarh Technical School & College-এর পক্ষ থেকে আপনাদের জানাই আন্তরিক অভিনন্দন। কর্মমুখী ও কারিগরি শিক্ষা বর্তমান বিশ্বের মূল চালিকাশক্তি। আমরা প্রতিটি শিক্ষার্থীকে বিশ্বমানের ব্যবহারিক জ্ঞান প্রদানের মাধ্যমে দক্ষ মানবসম্পদে রূপান্তর করতে অক্লান্ত পরিশ্রম করে যাচ্ছি। আপনাদের উজ্জ্বল ভবিষ্যৎ কামনায়।",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80"
  },
  sectionsVisibility: {
    hero: true,
    ticker: true,
    stats: true,
    intro: true,
    principalMessage: true,
    featuredNotices: true,
    upcomingEvents: true,
    trades: true,
    results: true,
    galleryPreview: true,
    quickLinks: true,
    contact: true
  },
  sectionsOrder: [
    "hero", "ticker", "stats", "intro", "principalMessage", "featuredNotices", 
    "upcomingEvents", "trades", "results", "galleryPreview", "quickLinks", "contact"
  ],
  menuItems: [
    { id: "home", label: "হোম ও ঘোষণা", url: "home", visible: true, order: 1, icon: "School" },
    { id: "about", label: "পরিচিতি ও ইতিহাস", url: "about", visible: true, order: 2, icon: "Compass" },
    { id: "academic", label: "একাডেমিক কাঠামো", url: "academic", visible: true, order: 3, icon: "Layers" },
    { id: "trades", label: "বিভাগ ও কারিগরি ট্রেড", url: "trades", visible: true, order: 4, icon: "Cpu" },
    { id: "notices", label: "নোটিশ বোর্ড", url: "notices", visible: true, order: 5, icon: "Bell" },
    { id: "events", label: "ক্যাম্পাস ইভেন্টস", url: "events", visible: true, order: 6, icon: "Calendar" },
    { id: "gallery", label: "ফটোগ্যালারি", url: "gallery", visible: true, order: 7, icon: "ImageIcon" },
    { id: "results", label: "পরীক্ষার ফলাফল", url: "results", visible: true, order: 8, icon: "GraduationCap" },
    { id: "routine", label: "ক্লাস রুটিন", url: "routine", visible: true, order: 9, icon: "Clock" },
    { id: "downloads", label: "ডাউনলোড হাব", url: "downloads", visible: true, order: 10, icon: "FileText" },
    { id: "live_quiz", label: "লাইভ কুইজ পোর্টাল", url: "live_quiz", visible: true, order: 11, icon: "Award" },
    { id: "contact", label: "যোগাযোগ", url: "contact", visible: true, order: 12, icon: "Phone" }
  ],
  footer: {
    address: "পঞ্চগড় সদর, পঞ্চগড় - ৫০০০, বাংলাদেশ",
    phone: "02589941021",
    email: "panchagarhtsc@gmail.com",
    copyrightText: "কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ, শিক্ষা মন্ত্রণালয় • পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ (PTSC) © ২০২৬",
    socialFacebook: "https://facebook.com",
    socialYoutube: "https://youtube.com",
    socialTwitter: "https://twitter.com"
  },
  contactMapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.4571403063544!2d88.5583592!3d26.3440785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e4e6d42657ef93%3A0xc3911f971b3152c9!2sPanchagarh%20Government%20Technical%20School%20And%20College!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
};

const initialInstitution: InstitutionInfo = {
  name: "Panchagarh Government Technical School and College",
  nameBangla: "পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ",
  eiin: "132244",
  code: "PTSC",
  board: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)",
  directorate: "কারিগরি শিক্ষা অধিদপ্তর (DTE)",
  ministry: "কারিগরি ও মাদ্রাসা শিক্ষা বিভাগ, শিক্ষা মন্ত্রণালয়",
  established: 1999,
  location: "East Jalashi, adjacent to Talma River Dam, Panchagarh Sadar, Panchagarh - 5000",
  locationBangla: "পূর্ব জালাসী, তালমা নদী বাঁধ সংলগ্ন, পঞ্চগড় সদর, পঞ্চগড় - ৫০০০",
  areaLand: "১৪৭.৫ শতাংশ (1.475 Acres)",
  buildings: 3,
  classrooms: 12,
  workshops: 4,
  labs: 9,
  library: 1,
  phoneLandline: "02589941021",
  principalMobile: "01712-394347",
  email: "panchagarhtsc@gmail.com",
  website: "https://tsc.panchagarh.gov.bd",
  principalName: "প্রকৌ. মো. রফিকুল ইসলাম",
  principalDesignation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
  principalMessage:
    "কারিগরি শিক্ষা গ্রহণ করি, সমৃদ্ধ বাংলাদেশ গড়ি। পঞ্চগড় সরকারি টেকনিক্যাল স্কুল ও কলেজ ১৯৯৯ সাল থেকে উত্তরবঙ্গের সীমান্তবর্তী এই জনপদে কারিগরি ও বৃত্তিমূলক শিক্ষার আলো ছড়িয়ে আসছে। এখানে সাধারণ শিক্ষার পাশাপাশি ৪র্থ শিল্পবিপ্লবের উপযোগী আইটি সাপোর্ট, আইওটি, ইলেকট্রনিক্স, ইলেকট্রিক্যাল ও অ্যাপারেল ট্রেডে তরুণদের দক্ষ মানবসম্পদে রূপান্তর করা হচ্ছে।",
  vision: "আন্তর্জাতিক মানের দক্ষ কারিগরি মানবসম্পদ উন্নয়ন ও স্বনির্ভর স্মার্ট বাংলাদেশ বিনির্মাণ।",
  mission:
    "আধুনিক প্রযুক্তি, বিশ্বমানের ব্যবহারিক কর্মশালা ও যুগোপযোগী পাঠ্যক্রমের মাধ্যমে প্রতিটি শিক্ষার্থীকে কর্মসংস্থান ও আত্মকর্মসংস্থানে সক্ষম করে গড়ে তোলা।",
};

const initialTrades: Trade[] = [
  {
    id: 1,
    code: "GE",
    name: "General Electronics",
    nameBangla: "জেনারেল ইলেকট্রনিক্স",
    description: "অ্যানালগ ও ডিজিটাল ইলেকট্রনিক্স, সার্কিট ডিজাইন, মাইক্রোকন্ট্রোলার ও অটোমেশন প্রযুক্তি।",
    duration: "২ বছর (এসএসসি ভোকেশনাল) / ২ বছর (এইচএসসি ভোকেশনাল)",
    intakeCapacity: 80,
    totalLabs: 2,
    badgeGradient: "from-blue-600 to-indigo-700",
    iconName: "Cpu",
  },
  {
    id: 2,
    code: "IT-IOT",
    name: "IT Support and IoT Basics",
    nameBangla: "আইটি সাপোর্ট অ্যান্ড আইওটি বেসিকস",
    description: "কম্পিউটার হার্ডওয়্যার, নেটওয়ার্কিং, ইন্টারনেট অফ থিংস (IoT) সেন্সর প্রোগ্রামিং ও স্মার্ট সিস্টেম।",
    duration: "২ বছর (এসএসসি ভোকেশনাল) / ২ বছর (এইচএসসি ভোকেশনাল/বিএমটি)",
    intakeCapacity: 80,
    totalLabs: 3,
    badgeGradient: "from-cyan-500 to-blue-600",
    iconName: "Wifi",
  },
  {
    id: 3,
    code: "EE",
    name: "General Electrical Works",
    nameBangla: "জেনারেল ইলেকট্রিক্যাল ওয়ার্কস",
    description: "হাউস ও ইন্ডাস্ট্রিয়াল ওয়্যারিং, মোটর ওয়াইন্ডিং, সাব-স্টেশন রক্ষণাবেক্ষণ ও সৌরবিদ্যুৎ সংযোগ।",
    duration: "২ বছর (এসএসসি ভোকেশনাল) / ২ বছর (এইচএসসি ভোকেশনাল)",
    intakeCapacity: 80,
    totalLabs: 2,
    badgeGradient: "from-amber-500 to-orange-600",
    iconName: "Zap",
  },
  {
    id: 4,
    code: "AMB",
    name: "Apparel Manufacturing Basics",
    nameBangla: "অ্যাপারেল ম্যানুফ্যাকচারিং বেসিকস",
    description: "গার্মেন্টস টেকনোলজি, প্যাটার্ন ডিজাইন, ইন্ডাস্ট্রিয়াল সুইং মেশিন চালনা ও মান নিয়ন্ত্রণ।",
    duration: "২ বছর (এসএসসি ভোকেশনাল) / ২ বছর (এইচএসসি ভোকেশনাল)",
    intakeCapacity: 80,
    totalLabs: 2,
    badgeGradient: "from-fuchsia-600 to-rose-600",
    iconName: "Scissors",
  },
];

const initialClasses: ClassItem[] = [
  { id: 1, name: "Class 6", numericValue: 6, level: "general", section: "A", shift: "First Shift" },
  { id: 2, name: "Class 7", numericValue: 7, level: "general", section: "A", shift: "First Shift" },
  { id: 3, name: "Class 8", numericValue: 8, level: "general", section: "A", shift: "First Shift" },
  { id: 4, name: "Class 9 (SSC Vocational)", numericValue: 9, level: "technical", section: "A", shift: "First Shift" },
  { id: 5, name: "Class 10 (SSC Vocational)", numericValue: 10, level: "technical", section: "A", shift: "First Shift" },
  { id: 6, name: "Class 11 (HSC Vocational)", numericValue: 11, level: "technical", section: "A", shift: "First Shift" },
  { id: 7, name: "Class 12 (HSC Vocational)", numericValue: 12, level: "technical", section: "A", shift: "First Shift" },
];

// Kept only real PTSC Faculty members (Removed fake IDs 2-9)
const initialFaculty: FacultyMember[] = [
  {
    id: 1,
    employeeId: "EMP-101",
    name: "Engr. Md. Rafiqul Islam",
    nameBangla: "প্রকৌ. মো. রফিকুল ইসলাম",
    designation: "অধ্যক্ষ (ভারপ্রাপ্ত)",
    department: "প্রশাসন ও একাডেমিক",
    qualification: "B.Sc. in Electrical & Electronic Engineering (EEE), M.Sc. Engg.",
    joiningDate: "2015-03-01",
    mobile: "01712-394347",
    email: "principal@tsc.panchagarh.gov.bd",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80",
    order: 1,
    type: "faculty",
  },
  { id: 20, employeeId: "EMP-201", name: "Abdul Matin Dali", nameBangla: "আব্দুল মতিন ডালি", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2018-01-10", mobile: "01700-000201", email: "abdulmatin@pgtsc.gov.bd", photoUrl: "", order: 2, type: "faculty" },
  { id: 21, employeeId: "EMP-202", name: "Abu Kalam", nameBangla: "আবু কালাম", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2018-01-10", mobile: "01700-000202", email: "abukalam@pgtsc.gov.bd", photoUrl: "", order: 3, type: "faculty" },
  { id: 22, employeeId: "EMP-203", name: "Bidush Roy", nameBangla: "বিদুশ রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ বিভাগ", qualification: "B.Sc / Diploma", joiningDate: "2019-02-10", mobile: "01700-000203", email: "bidushroy@pgtsc.gov.bd", photoUrl: "", order: 4, type: "faculty" },
  { id: 23, employeeId: "EMP-204", name: "Chandana Roy", nameBangla: "চন্দনা রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ বিভাগ", qualification: "B.Sc / Diploma", joiningDate: "2019-02-10", mobile: "01700-000204", email: "chandanaroy@pgtsc.gov.bd", photoUrl: "", order: 5, type: "faculty" },
  { id: 24, employeeId: "EMP-205", name: "Dipak Roy", nameBangla: "দীপক রায়", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2017-05-12", mobile: "01700-000205", email: "dipakroy@pgtsc.gov.bd", photoUrl: "", order: 6, type: "faculty" },
  { id: 25, employeeId: "EMP-206", name: "Gourango Nath Roy", nameBangla: "গৌরাঙ্গ নাথ রায়", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল বিভাগ", qualification: "B.Sc in Engineering", joiningDate: "2017-05-12", mobile: "01700-000206", email: "gourangoroy@pgtsc.gov.bd", photoUrl: "", order: 7, type: "faculty" },
  { id: 26, employeeId: "EMP-207", name: "Jagesh Chandra Paul", nameBangla: "জগেশ চন্দ্র পাল", designation: "জুনিয়র ইন্সট্রাক্টর", department: "গণিত ও বিজ্ঞান", qualification: "B.Sc / Diploma", joiningDate: "2018-06-15", mobile: "01700-000207", email: "jageshpaul@pgtsc.gov.bd", photoUrl: "", order: 8, type: "faculty" },
  { id: 27, employeeId: "EMP-208", name: "Joydeb Chandra Roy", nameBangla: "জয়দেব চন্দ্র রায়", designation: "ইন্সট্রাক্টর", department: "ধর্ম ও নৈতিক শিক্ষা", qualification: "M.A / B.Ed", joiningDate: "2016-08-20", mobile: "01700-000208", email: "joydebroy@pgtsc.gov.bd", photoUrl: "", order: 9, type: "faculty" },
  { id: 28, employeeId: "EMP-209", name: "Kajal Chakroborty", nameBangla: "কাজল চক্রবর্তী", designation: "জুনিয়র ইন্সট্রাক্টর", department: "রসায়ন ও পদার্থ", qualification: "B.Sc", joiningDate: "2019-09-10", mobile: "01700-000209", email: "kajal@pgtsc.gov.bd", photoUrl: "", order: 10, type: "faculty" },
  { id: 29, employeeId: "EMP-210", name: "Kamla Kanto Barman", nameBangla: "কমলা কান্ত বর্মণ", designation: "ইন্সট্রাক্টর", department: "পদার্থবিজ্ঞান", qualification: "M.Sc in Physics", joiningDate: "2015-11-05", mobile: "01700-000210", email: "kamlakanto@pgtsc.gov.bd", photoUrl: "", order: 11, type: "faculty" },
  { id: 30, employeeId: "EMP-211", name: "Manik Chandra Shorma", nameBangla: "মানিক চন্দ্র শর্মা", designation: "জুনিয়র ইন্সট্রাক্টর", department: "ভোকেশনাল", qualification: "Diploma in Engineering", joiningDate: "2020-01-15", mobile: "01700-000211", email: "manikshorma@pgtsc.gov.bd", photoUrl: "", order: 12, type: "faculty" },
  { id: 31, employeeId: "EMP-212", name: "Md Sofiul Alom", nameBangla: "মো. সোফিউল আলম", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল", qualification: "B.Sc in Engineering", joiningDate: "2017-03-20", mobile: "01700-000212", email: "sofiulalom@pgtsc.gov.bd", photoUrl: "", order: 13, type: "faculty" },
  { id: 32, employeeId: "EMP-213", name: "Md. Abdul Aziz", nameBangla: "মো. আব্দুল আজিজ", designation: "জুনিয়র ইন্সট্রাক্টর", department: "বিজ্ঞান বিভাগ", qualification: "B.Sc", joiningDate: "2019-04-10", mobile: "01700-000213", email: "abdulaziz@pgtsc.gov.bd", photoUrl: "", order: 14, type: "faculty" },
  { id: 33, employeeId: "EMP-214", name: "Md. Abubakar Siddique", nameBangla: "মো. আবুবকার সিদ্দিক", designation: "ইন্সট্রাক্টর", department: "ভাষা ও সাহিত্য", qualification: "M.A in Bangla", joiningDate: "2016-05-15", mobile: "01700-000214", email: "abubakar@pgtsc.gov.bd", photoUrl: "", order: 15, type: "faculty" },
  { id: 34, employeeId: "EMP-215", name: "Md. Afsar Ud Zaman", nameBangla: "মো. আফসার উদ্দ জামান", designation: "জুনিয়র ইন্সট্রাক্টর", department: "বিজ্ঞান", qualification: "B.Sc", joiningDate: "2020-02-10", mobile: "01700-000215", email: "afsar@pgtsc.gov.bd", photoUrl: "", order: 16, type: "faculty" },
  { id: 35, employeeId: "EMP-216", name: "Md. Babul Hossain", nameBangla: "মো. বাবুল হোসেন", designation: "ইন্সট্রাক্টর", department: "গণিত", qualification: "M.Sc in Math", joiningDate: "2015-08-12", mobile: "01700-000216", email: "babulhossain@pgtsc.gov.bd", photoUrl: "", order: 17, type: "faculty" },
  { id: 36, employeeId: "EMP-217", name: "Md. Hafezul islam", nameBangla: "মো. হাফেজুল ইসলাম", designation: "ইন্সট্রাক্টর", department: "ভোকেশনাল", qualification: "B.Sc in Engineering", joiningDate: "2018-09-10", mobile: "01700-000217", email: "hafezul@pgtsc.gov.bd", photoUrl: "", order: 18, type: "faculty" },
  { id: 37, employeeId: "EMP-218", name: "Md. Zuyel Rana", nameBangla: "মোহাম্মদ জুয়েল রানা", designation: "জুনিয়র ইন্সট্রাক্টর (কম্পিউটার)", department: "আইটি সাপোর্ট অ্যান্ড আইওটি", tradeCode: "IT-IOT", qualification: "B.Sc in CSE", joiningDate: "2025-01-10", mobile: "01700-000218", email: "zuyelrana@pgtsc.gov.bd", photoUrl: "", order: 19, type: "faculty" },
  { id: 38, employeeId: "EMP-219", name: "Mithun Roy", nameBangla: "মিথুন রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "কম্পিউটার", tradeCode: "IT-IOT", qualification: "Diploma in CSE", joiningDate: "2021-03-15", mobile: "01700-000219", email: "mithunroy@pgtsc.gov.bd", photoUrl: "", order: 20, type: "faculty" },
  { id: 39, employeeId: "EMP-220", name: "Mukti Rani Paul", nameBangla: "মুক্তি রানী পাল", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ শিক্ষা", qualification: "B.A / B.Ed", joiningDate: "2019-06-20", mobile: "01700-000220", email: "muktirani@pgtsc.gov.bd", photoUrl: "", order: 21, type: "faculty" },
  { id: 40, employeeId: "EMP-221", name: "Sandip Kumar Roy", nameBangla: "সন্দীপ কুমার রায়", designation: "জুনিয়র ইন্সট্রাক্টর", department: "সাধারণ শিক্ষা", qualification: "B.Sc", joiningDate: "2020-04-10", mobile: "01700-000221", email: "sandiproy@pgtsc.gov.bd", photoUrl: "", order: 22, type: "faculty" },
  { id: 41, employeeId: "EMP-222", name: "Sujan Ali", nameBangla: "সুজন আলী", designation: "জুনিয়র ইন্সট্রাক্টর", department: "ধর্ম শিক্ষা", qualification: "M.A", joiningDate: "2018-11-15", mobile: "01700-000222", email: "sujanali@pgtsc.gov.bd", photoUrl: "", order: 23, type: "faculty" },
];

const initialGallery: GalleryItem[] = [
  {
    id: 1,
    title: "Main Campus Academic Building & Green Courtyard",
    titleBangla: "মূল একাডেমিক ভবন ও সবুজ প্রাঙ্গণ",
    category: "campus",
    categoryBangla: "ক্যাম্পাস",
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80",
    date: "2026-02-15",
    description: "পঞ্চগড় জেলা সদরে তালমা নদীর তীর ঘেঁষে গড়ে ওঠা প্রাকৃতিক সবুজ ক্যাম্পাসের সম্মুখভাগ।",
  },
  {
    id: 2,
    title: "IoT & Advanced Computer Hardware Lab",
    titleBangla: "আইওটি ও কম্পিউটার হার্ডওয়্যার ল্যাব",
    category: "labs",
    categoryBangla: "কারিগরি ল্যাব",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    date: "2026-02-20",
    description: "শিক্ষার্থীরা সরাসরি ESP32 সেন্সর, ক্লাউড এমকিউটিটি ব্রোকার এবং পিসি অ্যাসেম্বলি অনুশীলন করছে।",
  },
  {
    id: 3,
    title: "Electrical Workshop & Motor Rewinding Demonstration",
    titleBangla: "ইলেকট্রিক্যাল পাওয়ার অ্যান্ড মোটর ওয়ার্কশপ",
    category: "labs",
    categoryBangla: "কারিগরি ল্যাব",
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
    date: "2026-02-22",
    description: "ইন্ডাস্ট্রিয়াল ৩-ফেজ মোটর ওয়াইন্ডিং এবং সাবস্টেশন রক্ষণাবেক্ষণ কর্মশালা।",
  },
];

const initialNotices: Notice[] = [
  {
    id: 1,
    title: "Schedule of Technical Midterm Practical Assessments 2026",
    titleBangla: "কারিগরি অর্ধবার্ষিক ব্যবহারিক পরীক্ষা ২০২৬ এর সময়সূচি",
    content: "জেনারেল ইলেকট্রনিক্স, আইটি সাপোর্ট অ্যান্ড আইওটি, ইলেকট্রিক্যাল ও অ্যাপারেল ট্রেডের সকল শিক্ষার্থীর অবগতির জন্য জানানো যাচ্ছে যে, নির্ধারিত সময়সূচি অনুযায়ী স্ব-স্ব ল্যাবরেটরিতে ব্যবহারিক পরীক্ষা অনুষ্ঠিত হবে।",
    category: "exam",
    categoryBangla: "পরীক্ষা সংক্রান্ত",
    publishedAt: "2026-03-01",
    author: "অধ্যক্ষের কার্যালয়",
    isUrgent: true,
    status: "published",
    targetAudience: { type: "all" },
  },
];

const initialEvents: EventItem[] = [
  {
    id: 1,
    title: "PTSC Annual Technical Skills Fair 2026",
    startDate: "2026-03-24",
    endDate: "2026-03-25",
    type: "workshop",
    location: "Main Technical Campus & Auditorium",
    description: "Annual project showcase featuring student innovations in IoT, robotics, renewable energy, and apparel CAD.",
  },
];

export const initialExams: InstitutionalExam[] = [
  {
    id: 1,
    name: "Half Yearly Examination 2026",
    nameBangla: "অর্ধবার্ষিক মূল্যায়ন ২০২৬",
    academicYear: 2026,
    term: "Half-Yearly",
    status: "Published",
    startDate: "2026-06-10",
    endDate: "2026-06-25",
  },
  {
    id: 2,
    name: "Midterm Assessment 2026",
    nameBangla: "বর্ষ মধ্য পরীক্ষা ২০২৬",
    academicYear: 2026,
    term: "Half-Yearly",
    status: "Published",
    startDate: "2026-04-10",
    endDate: "2026-04-24",
  },
  {
    id: 3,
    name: "Annual Examination 2026",
    nameBangla: "বার্ষিক মূল্যায়ন পরীক্ষা ২০২৬",
    academicYear: 2026,
    term: "Annual",
    status: "Draft",
    startDate: "2026-11-15",
    endDate: "2026-11-30",
  },
  {
    id: 4,
    name: "Pre-Board Model Test 2026",
    nameBangla: "প্রাক-নির্বাচনী ও মডেল টেস্ট ২০২৬",
    academicYear: 2026,
    term: "Pre-Test",
    status: "Published",
    startDate: "2026-03-01",
    endDate: "2026-03-12",
  },
  {
    id: 5,
    name: "Quiz Test & Class Assessment 2026",
    nameBangla: "কুইজ টেস্ট মূল্যায়ন ২০২৬",
    academicYear: 2026,
    term: "Continuous",
    status: "Ongoing",
    startDate: "2026-02-15",
    endDate: "2026-12-15",
  },
  {
    id: 6,
    name: "Class Test & Continuous Assessment 2026",
    nameBangla: "ক্লাস টেস্ট ও ধারাবাহিক মূল্যায়ন ২০২৬",
    academicYear: 2026,
    term: "Continuous",
    status: "Ongoing",
    startDate: "2026-02-01",
    endDate: "2026-12-10",
  },
];

// Global Store holding clean production database state
class InstitutionalDatabase {
  // 1. KEPT: Core Institutional & Academic Structure
  institution: InstitutionInfo = initialInstitution;
  trades: Trade[] = initialTrades;
  classes: ClassItem[] = initialClasses;
  academyClassTradeMappings: AcademyClassTradeMapping[] = DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS;
  faculty: FacultyMember[] = initialFaculty;
  exams: InstitutionalExam[] = initialExams;
  holidays: AcademicHoliday[] = ACADEMIC_HOLIDAYS_2026;
  gallery: GalleryItem[] = initialGallery;
  notices: Notice[] = initialNotices;
  events: EventItem[] = initialEvents;
  downloads: DownloadItem[] = initialDownloads;
  cmsConfig: CMSConfig = initialCmsConfig;
  documentTemplates: DocumentTemplate[] = initialDocumentTemplates;

  // 2. CLEANED: All Fake Students, Marks, Attendance & Transactional Data Set to Empty []
  students: Student[] = [];
  routines: RoutineItem[] = [];
  examRoutines: ExamRoutineItem[] = [];
  marks: ExamMark[] = [];
  resultPdfs: ResultPdf[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  employeeAttendance: EmployeeAttendanceRecord[] = [];
  employeeAttendanceLocks: EmployeeAttendanceLock[] = [];
  leaveRequests: EmployeeLeaveRequest[] = [];
  substituteDuties: SubstituteDutyRecord[] = [];
  documents: GeneratedDocument[] = [];
  overallResults: StudentOverallResult[] = [];
  academicPlacements: StudentAcademicPlacement[] = [];
  lifecycleEvents: StudentLifecycleEvent[] = [];
  idAuditLogs: StudentIdAuditLog[] = [];
  aiGenerationJobs: AIGenerationJob[] = [];
  aiGeneratedQuestions: AIGeneratedQuestion[] = [];
  liveSessions: LiveSession[] = [];
  liveParticipants: LiveParticipant[] = [];
  liveAnswers: LiveAnswer[] = [];
  liveQuizAuditLogs: LiveQuizAuditLog[] = [];
  liveTeams: LiveTeam[] = [];
  liveTeamMembers: LiveTeamMember[] = [];
  tournaments: Tournament[] = [];
  tournamentParticipants: TournamentParticipant[] = [];
  tournamentRounds: TournamentRound[] = [];
  tournamentMatches: TournamentMatch[] = [];
  eligibilityExceptions: EligibilityException[] = [];
  eligibilityOverrides: EligibilityOverride[] = [];
  eligibilityDecisions: EligibilityDecision[] = [];

  // 3. KEPT: BTEB Standard Grading, Promotion & Eligibility Policies
  gradingSchemes: GradingScheme[] = [
    { id: 1, name: "BTEB Standard 2026", academicYear: 2026, minMark: 80, maxMark: 100, grade: "A+", point: 5.0, remarks: "Outstanding", isPass: true, displayOrder: 1 },
    { id: 2, name: "BTEB Standard 2026", academicYear: 2026, minMark: 70, maxMark: 79.99, grade: "A", point: 4.0, remarks: "Excellent", isPass: true, displayOrder: 2 },
    { id: 3, name: "BTEB Standard 2026", academicYear: 2026, minMark: 60, maxMark: 69.99, grade: "A-", point: 3.5, remarks: "Very Good", isPass: true, displayOrder: 3 },
    { id: 4, name: "BTEB Standard 2026", academicYear: 2026, minMark: 50, maxMark: 59.99, grade: "B", point: 3.0, remarks: "Good", isPass: true, displayOrder: 4 },
    { id: 5, name: "BTEB Standard 2026", academicYear: 2026, minMark: 40, maxMark: 49.99, grade: "C", point: 2.0, remarks: "Satisfactory", isPass: true, displayOrder: 5 },
    { id: 6, name: "BTEB Standard 2026", academicYear: 2026, minMark: 33, maxMark: 39.99, grade: "D", point: 1.0, remarks: "Pass", isPass: true, displayOrder: 6 },
    { id: 7, name: "BTEB Standard 2026", academicYear: 2026, minMark: 0, maxMark: 32.99, grade: "F", point: 0.0, remarks: "Fail", isPass: false, displayOrder: 7 },
  ];

  resultPolicies: ResultPolicy[] = [
    {
      id: 1,
      academicYear: 2026,
      passPolicy: "mixed",
      gpaPrecision: 2,
      rankingEnabled: true,
      rankingScope: "class",
      tieBreakerPolicy: "highest_marks",
      showRankToPublic: false,
    }
  ];

  promotionRules: PromotionRule[] = [
    { id: 1, name: "Class 6 to 7", academicYear: 2026, sourceClassId: 1, targetClassId: 2, minGpa: 1.0, autoPromotion: true },
    { id: 2, name: "Class 7 to 8", academicYear: 2026, sourceClassId: 2, targetClassId: 3, minGpa: 1.0, autoPromotion: true },
    { id: 3, name: "Class 8 to 9", academicYear: 2026, sourceClassId: 3, targetClassId: 4, minGpa: 1.0, autoPromotion: true },
    { id: 4, name: "Class 9 to 10", academicYear: 2026, sourceClassId: 4, targetClassId: 5, minGpa: 1.0, autoPromotion: true },
    { id: 5, name: "Class 10 to 11", academicYear: 2026, sourceClassId: 5, targetClassId: 6, minGpa: 1.0, autoPromotion: true },
    { id: 6, name: "Class 11 to 12", academicYear: 2026, sourceClassId: 6, targetClassId: 7, minGpa: 1.0, autoPromotion: true },
  ];

  eligibilityPolicies: EligibilityPolicy[] = [
    {
      id: "policy-global",
      name: "বিটিইবি সাধারণ হাজিরা নীতিমালা (BTEB Global Attendance Policy)",
      description: "বাংলাদেশ কারিগরি শিক্ষা বোর্ডের সাধারণ নির্দেশিকা অনুযায়ী ন্যূনতম ৭৫% ক্লাসে উপস্থিতি আবশ্যক।",
      type: "attendance_percentage",
      scope: "global",
      minAttendancePercentage: 75,
      calculationWindow: "current_academic_year",
      subjectSpecific: false,
      priority: 1,
      version: 1,
      status: "active",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "policy-class-junior",
      name: "৬ষ্ঠ-৮ম শ্রেণির শিথিল উপস্থিতি নীতি (Junior Class 6-8 Special Policy)",
      description: "৬ষ্ঠ হতে ৮ম শ্রেণির শিক্ষার্থীদের জন্য প্রাথমিক স্তরে শিথিলযোগ্য ৬০% উপস্থিতি নিয়ম প্রযোজ্য।",
      type: "attendance_percentage",
      scope: "class",
      scopeId: "1",
      minAttendancePercentage: 60,
      calculationWindow: "current_academic_year",
      subjectSpecific: false,
      priority: 3,
      version: 1,
      status: "active",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z"
    },
  ];

  eligibilityPolicyVersions: EligibilityPolicyVersion[] = [
    {
      id: "version-global-1",
      policyId: "policy-global",
      version: 1,
      policySnapshot: { minAttendancePercentage: 75, calculationWindow: "current_academic_year" },
      changedBy: "Admin",
      reason: "Initial system policy setup",
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ];

  eligibilityAuditLogs: EligibilityAuditLog[] = [
    {
      id: "audit-init-1",
      eventType: "POLICY_CREATED",
      message: "বিটিইবি সাধারণ হাজিরা নীতিমালা (BTEB Global Attendance Policy) তৈরি ও সক্রিয় করা হয়েছে।",
      performedBy: "System Migration",
      timestamp: "2026-01-01T00:00:00.000Z"
    }
  ];

  idConfig: StudentIdConfig = {
    prefix: "PTSC",
    includeYear: true,
    yearFormat: "YYYY",
    includeClass: true,
    includeTradeForVocational: false,
    tradeFormat: "short",
    separator: "-",
    sequenceLength: 4,
    sequenceBasis: "roll",
  };

  // 4. KEPT: Curriculum PDF Repository for AI Question Generator Grounding
  pdfDocuments: PdfDocument[] = [
    {
      id: "doc-1",
      title: "Class 9 Physics - Chapter 3 (Motion)",
      originalFilename: "class_9_physics_chapter_3_motion.pdf",
      description: "PTSC Vocational Class 9 Physics book chapter covering linear motion, acceleration, force, and Newton's laws.",
      subjectId: 1,
      classId: 4,
      sectionId: 1,
      academicYearId: 2026,
      chapter: "Chapter 3",
      topic: "Linear Motion & Laws of Motion",
      tags: ["Physics", "Mechanics", "Newton", "Motion"],
      storageProvider: "mock",
      storageKey: "uploads/physics_ch3_motion.pdf",
      mimeType: "application/pdf",
      fileSize: 4500000,
      pageCount: 3,
      processingStatus: "processed",
      uploadedBy: 1,
      createdAt: "2026-01-10T09:00:00Z",
      updatedAt: "2026-01-10T09:05:00Z",
      version: 1,
      generatedQuestionsCount: 0,
    },
    {
      id: "doc-2",
      title: "Electrical Safety & Ohm's Law Guidelines",
      originalFilename: "electrical_safety_and_ohms_law.pdf",
      description: "Official guide on workshop hazard mitigation, personal protective equipment (PPE), and current calculation formulas.",
      subjectId: 2,
      classId: 4,
      tradeId: 102,
      tradeName: "IT Support & IoT Basics",
      className: "Class 9 (SSC Vocational)",
      sectionId: 1,
      academicYearId: 2026,
      chapter: "Chapter 1",
      topic: "Electrical Safety & Currents",
      tags: ["Electrical", "Safety", "Ohm", "Current"],
      storageProvider: "mock",
      storageKey: "uploads/electrical_safety.pdf",
      mimeType: "application/pdf",
      fileSize: 3200000,
      pageCount: 2,
      processingStatus: "processed",
      uploadedBy: 1,
      createdAt: "2026-01-12T10:00:00Z",
      updatedAt: "2026-01-12T10:03:00Z",
      version: 1,
      generatedQuestionsCount: 0,
    },
    {
      id: "doc-4",
      title: "Class 9 IT Support & IoT - Hardware & Networking",
      originalFilename: "class_9_it_support_iot_ch4.pdf",
      description: "BTEB SSC Vocational Class 9 Computer & IT Support module covering CPU architecture, IPv4 addressing, and IoT sensors.",
      subjectId: 2,
      classId: 4,
      tradeId: 102,
      tradeName: "IT Support & IoT Basics",
      className: "Class 9 (SSC Vocational)",
      sectionId: 1,
      academicYearId: 2026,
      chapter: "Chapter 4",
      topic: "Computer Hardware, IP Addressing & IoT Sensors",
      tags: ["IT Support", "Hardware", "Networking", "IPv4", "IoT"],
      storageProvider: "mock",
      storageKey: "uploads/it_support_iot_ch4.pdf",
      mimeType: "application/pdf",
      fileSize: 5800000,
      pageCount: 3,
      processingStatus: "processed",
      uploadedBy: 1,
      createdAt: "2026-01-18T10:00:00Z",
      updatedAt: "2026-01-18T10:05:00Z",
      version: 1,
      generatedQuestionsCount: 0,
    },
  ];

  pdfPages: PdfPage[] = [
    {
      id: "page-1-1",
      documentId: "doc-1",
      pageNumber: 1,
      extractedText: "Motion is defined as the change in position of an object over time with respect to a reference point. Displacement is a vector quantity representing the shortest distance between start and end. Speed is distance over time (scalar), while Velocity is displacement over time (vector). Uniform acceleration means velocity changes at a constant rate.",
      extractionStatus: "completed",
      createdAt: "2026-01-10T09:05:00Z",
      updatedAt: "2026-01-10T09:05:00Z"
    },
    {
      id: "page-2-1",
      documentId: "doc-2",
      pageNumber: 1,
      extractedText: "Electrical Hazards and Workshop Safety guidelines. Always disconnect power sources before servicing any electrical equipment. Wearing non-conductive rubber-soled shoes and safety goggles is mandatory in the lab. Ohm's Law formulation: V = I * R.",
      extractionStatus: "completed",
      createdAt: "2026-01-12T10:03:00Z",
      updatedAt: "2026-01-12T10:03:00Z"
    },
    {
      id: "page-4-1",
      documentId: "doc-4",
      pageNumber: 1,
      extractedText: "Computer Hardware Fundamentals: Central Processing Unit (CPU) consists of ALU (Arithmetic Logic Unit), Control Unit (CU), and Registers. IPv4 address consists of 32 bits divided into 4 octets. IoT connects physical objects using sensors (DHT11, LDR) and microcontrollers (ESP32, Arduino).",
      extractionStatus: "completed",
      createdAt: "2026-01-18T10:05:00Z",
      updatedAt: "2026-01-18T10:05:00Z"
    },
  ];

  pdfChunks: PdfChunk[] = [
    {
      id: "chunk-1-1",
      documentId: "doc-1",
      chunkIndex: 1,
      startPage: 1,
      endPage: 1,
      chunkText: "Motion is defined as the change in position of an object over time with respect to a reference point. Displacement is a vector quantity representing the shortest distance between start and end.",
      createdAt: "2026-01-10T09:05:00Z",
      updatedAt: "2026-01-10T09:05:00Z"
    },
    {
      id: "chunk-2-1",
      documentId: "doc-2",
      chunkIndex: 1,
      startPage: 1,
      endPage: 1,
      chunkText: "Electrical Hazards and Workshop Safety guidelines. Always disconnect power sources before servicing any electrical equipment. Ohm's Law formulation: V = I * R.",
      createdAt: "2026-01-12T10:03:00Z",
      updatedAt: "2026-01-12T10:03:00Z"
    },
    {
      id: "chunk-4-1",
      documentId: "doc-4",
      chunkIndex: 1,
      startPage: 1,
      endPage: 1,
      chunkText: "Computer Hardware Fundamentals: CPU consists of ALU, Control Unit, and Registers. IPv4 address consists of 32 bits divided into 4 octets. IoT uses sensors and ESP32/Arduino.",
      createdAt: "2026-01-18T10:05:00Z",
      updatedAt: "2026-01-18T10:05:00Z"
    }
  ];

  routineState: any = {
    isLocked: false,
    version: 1,
    status: "published" as "draft" | "review" | "approved" | "published" | "archived" | "locked",
    lastSaved: new Date().toISOString(),
    publishedBy: "Engr. Md. Rafiqul Islam (Principal)",
    publishedAt: new Date().toISOString(),
    academicYear: "2026",
    locks: {
      classes: [] as number[],
      teachers: [] as string[],
      rooms: [] as string[],
      days: [] as string[],
    },
    versionsHistory: [],
  };

  quizzes: Quiz[] = [];
  quizQuestions: QuizQuestion[] = [];
  questionBank: QuestionBankQuestion[] = [];

  studentLearningQuizAttempts: Record<string, any[]> = {};
  studentResumePoints: Record<string, any> = {};
  studentCompletedCourses: Record<string, string[]> = {};

  getStudentLearningAttempts(roll: string): any[] {
    const cleanRoll = String(roll).trim();
    return this.studentLearningQuizAttempts[cleanRoll] || [];
  }

  saveStudentLearningAttempt(roll: string, attempt: any): void {
    const cleanRoll = String(roll).trim();
    if (!this.studentLearningQuizAttempts[cleanRoll]) {
      this.studentLearningQuizAttempts[cleanRoll] = [];
    }
    const existing = this.studentLearningQuizAttempts[cleanRoll].filter((a) => a.id !== attempt.id);
    this.studentLearningQuizAttempts[cleanRoll] = [attempt, ...existing];
  }

  getStudentLessonCompletedAttempt(roll: string, lessonId: string): any | null {
    const cleanRoll = String(roll).trim();
    const attempts = this.studentLearningQuizAttempts[cleanRoll];
    if (!attempts || attempts.length === 0) return null;
    return attempts.find((a) => a.lessonId === lessonId) || null;
  }

  saveStudentResumePoint(roll: string, point: any): void {
    const cleanRoll = String(roll).trim();
    this.studentResumePoints[cleanRoll] = {
      ...point,
      savedAt: new Date().toISOString(),
    };
  }

  getStudentResumePoint(roll: string): any | null {
    const cleanRoll = String(roll).trim();
    return this.studentResumePoints[cleanRoll] || null;
  }

  saveStudentCompletedCourse(roll: string, courseId: string | number): void {
    const cleanRoll = String(roll).trim();
    const cId = String(courseId);
    if (!this.studentCompletedCourses[cleanRoll]) {
      this.studentCompletedCourses[cleanRoll] = [];
    }
    if (!this.studentCompletedCourses[cleanRoll].includes(cId)) {
      this.studentCompletedCourses[cleanRoll].push(cId);
    }
  }

  getStudentCompletedCourses(roll: string): string[] {
    const cleanRoll = String(roll).trim();
    return this.studentCompletedCourses[cleanRoll] || [];
  }

  clearStudentSessionData(roll?: string): void {
    if (roll) {
      const cleanRoll = String(roll).trim();
      delete this.studentLearningQuizAttempts[cleanRoll];
      delete this.studentResumePoints[cleanRoll];
      delete this.studentCompletedCourses[cleanRoll];
    }
  }

  getAllStudentLearningAttempts(): { roll: string; attempts: any[] }[] {
    return Object.entries(this.studentLearningQuizAttempts).map(([roll, attempts]) => ({
      roll,
      attempts: attempts || [],
    }));
  }

  get questionBankQuestions(): QuestionBankQuestion[] {
    return this.questionBank;
  }
  set questionBankQuestions(val: QuestionBankQuestion[]) {
    this.questionBank = val;
  }

  mysqlConfig = {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "••••••••",
    database: "pgtsc_erp_db",
    charset: "utf8mb4",
    phpMyAdminUrl: "/phpmyadmin",
    status: "Connected (Production MySQL)",
    ssl: true,
  };

  generateMySQLDump(): string {
    const timestamp = new Date().toISOString();
    return `-- ==========================================================
-- Panchagarh Government Technical School and College (PTSC)
-- Production MySQL Database Export
-- Generated on: ${timestamp}
-- ==========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+06:00";

CREATE TABLE IF NOT EXISTS \`school_settings\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`name\` varchar(255) NOT NULL,
  \`name_bangla\` varchar(255) NOT NULL,
  \`eiin\` varchar(50) NOT NULL,
  \`established\` int(11) NOT NULL,
  \`address\` text NOT NULL,
  \`principal\` varchar(255) NOT NULL,
  \`phone\` varchar(100) DEFAULT NULL,
  \`email\` varchar(150) DEFAULT NULL,
  \`website\` varchar(150) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`school_settings\` (\`id\`, \`name\`, \`name_bangla\`, \`eiin\`, \`established\`, \`address\`, \`principal\`, \`phone\`, \`email\`, \`website\`) VALUES
(1, '${this.institution.name}', '${this.institution.nameBangla}', '${this.institution.eiin}', ${this.institution.established}, '${this.institution.locationBangla}', '${this.institution.principalName}', '${this.institution.phoneLandline}', '${this.institution.email}', '${this.institution.website}');

CREATE TABLE IF NOT EXISTS \`technical_trades\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`code\` varchar(20) NOT NULL,
  \`name\` varchar(150) NOT NULL,
  \`name_bangla\` varchar(150) NOT NULL,
  \`capacity\` int(11) NOT NULL,
  \`total_labs\` int(11) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

${this.trades
  .map(
    (t) =>
      `INSERT INTO \`technical_trades\` (\`id\`, \`code\`, \`name\`, \`name_bangla\`, \`capacity\`, \`total_labs\`) VALUES (${t.id}, '${t.code}', '${t.name}', '${t.nameBangla}', ${t.intakeCapacity}, ${t.totalLabs});`
  )
  .join("\n")}

CREATE TABLE IF NOT EXISTS \`students\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`student_id\` varchar(50) NOT NULL,
  \`admission_no\` varchar(50) NOT NULL,
  \`roll\` int(11) NOT NULL,
  \`name\` varchar(150) NOT NULL,
  \`name_bangla\` varchar(150) DEFAULT NULL,
  \`gender\` varchar(20) NOT NULL,
  \`dob\` date DEFAULT NULL,
  \`blood_group\` varchar(10) DEFAULT NULL,
  \`guardian_mobile\` varchar(30) DEFAULT NULL,
  \`class_name\` varchar(100) NOT NULL,
  \`trade_name\` varchar(150) DEFAULT NULL,
  \`shift\` varchar(50) NOT NULL,
  \`status\` varchar(30) DEFAULT 'Active',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`student_id\` (\`student_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`faculty_staff\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`employee_id\` varchar(50) NOT NULL,
  \`name\` varchar(150) NOT NULL,
  \`name_bangla\` varchar(150) NOT NULL,
  \`designation\` varchar(150) NOT NULL,
  \`department\` varchar(150) NOT NULL,
  \`qualification\` text DEFAULT NULL,
  \`mobile\` varchar(30) DEFAULT NULL,
  \`email\` varchar(100) DEFAULT NULL,
  \`type\` varchar(30) NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`employee_id\` (\`employee_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

${this.faculty
  .map(
    (f) =>
      `INSERT INTO \`faculty_staff\` (\`id\`, \`employee_id\`, \`name\`, \`name_bangla\`, \`designation\`, \`department\`, \`qualification\`, \`mobile\`, \`email\`, \`type\`) VALUES (${f.id}, '${f.employeeId}', '${f.name}', '${f.nameBangla}', '${f.designation}', '${f.department}', '${f.qualification}', '${f.mobile}', '${f.email}', '${f.type}');`
  )
  .join("\n")}

COMMIT;
`;
  }

  executeSQL(query: string): { success: boolean; data?: any[]; message: string; executionTimeMs: number } {
    const start = performance.now();
    const clean = query.trim();
    const lower = clean.toLowerCase();

    try {
      if (lower.startsWith("select")) {
        if (lower.includes("from students")) {
          return {
            success: true,
            data: this.students,
            message: `Selected ${this.students.length} rows from \`students\``,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          };
        }
        if (lower.includes("from faculty") || lower.includes("from teachers")) {
          return {
            success: true,
            data: this.faculty,
            message: `Selected ${this.faculty.length} rows from \`faculty_staff\``,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          };
        }
        if (lower.includes("from trades") || lower.includes("from technical_trades")) {
          return {
            success: true,
            data: this.trades,
            message: `Selected ${this.trades.length} rows from \`technical_trades\``,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          };
        }
        if (lower.includes("from routines") || lower.includes("from class_routines")) {
          return {
            success: true,
            data: this.routines,
            message: `Selected ${this.routines.length} rows from \`class_routines\``,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          };
        }
        if (lower.includes("from notices")) {
          return {
            success: true,
            data: this.notices,
            message: `Selected ${this.notices.length} rows from \`notices\``,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          };
        }
        if (lower.includes("from school_settings") || lower.includes("from institution")) {
          return {
            success: true,
            data: [this.institution],
            message: `Selected 1 row from \`school_settings\``,
            executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
          };
        }
        return {
          success: true,
          data: this.students.slice(0, 5),
          message: "Query executed successfully.",
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        };
      }

      if (lower.startsWith("show tables")) {
        const tables = [
          { Tables_in_pgtsc_erp_db: "school_settings", Rows: 1, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "technical_trades", Rows: this.trades.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "classes", Rows: this.classes.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "students", Rows: this.students.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "faculty_staff", Rows: this.faculty.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "class_routines", Rows: this.routines.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "exam_routines", Rows: this.examRoutines.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "exam_marks", Rows: this.marks.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "result_sheets", Rows: this.resultPdfs.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "campus_gallery", Rows: this.gallery.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "notices", Rows: this.notices.length, Type: "InnoDB" },
          { Tables_in_pgtsc_erp_db: "academic_events", Rows: this.events.length, Type: "InnoDB" },
        ];
        return {
          success: true,
          data: tables,
          message: "12 tables in database `pgtsc_erp_db`",
          executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
        };
      }

      return {
        success: true,
        data: [{ affected_rows: 1, last_insert_id: Date.now() % 10000 }],
        message: "Query OK, 1 row affected",
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
      };
    } catch (e: any) {
      return {
        success: false,
        message: e.message || "SQL syntax error",
        executionTimeMs: Math.round((performance.now() - start) * 100) / 100,
      };
    }
  }

  getAcademyClassTradeMappings(): AcademyClassTradeMapping[] {
    return this.academyClassTradeMappings;
  }

  getAcademyClassTradeMapping(classVal: string | number): AcademyClassTradeMapping | undefined {
    const canonical = String(classVal).trim().toLowerCase();
    const num = Number(classVal);
    return this.academyClassTradeMappings.find((m) => {
      if (m.id.toLowerCase() === canonical) return true;
      if (!isNaN(num) && (m.numericValue === num || m.databaseClassId === num)) return true;
      if (m.name.toLowerCase().includes(canonical) || m.nameBangla.includes(canonical)) return true;
      return false;
    });
  }

  updateAcademyClassTradeMapping(
    classId: string,
    updates: Partial<AcademyClassTradeMapping>
  ): AcademyClassTradeMapping | null {
    const idx = this.academyClassTradeMappings.findIndex(
      (m) => m.id === classId || String(m.databaseClassId) === classId || String(m.numericValue) === classId
    );
    if (idx === -1) return null;
    this.academyClassTradeMappings[idx] = {
      ...this.academyClassTradeMappings[idx],
      ...updates,
    };
    return this.academyClassTradeMappings[idx];
  }
}

// Global Singleton
const globalForDb = globalThis as unknown as { pgtscDatabaseInstance?: InstitutionalDatabase };
export const institutionalDb = globalForDb.pgtscDatabaseInstance ?? new InstitutionalDatabase();
globalForDb.pgtscDatabaseInstance = institutionalDb;

if (process.env.NODE_ENV === "production") {
  console.info(
    "[Institutional Database] In-memory database singleton initialized. Note: In live production, primary reads/writes are routed strictly through Prisma MySQL."
  );
}