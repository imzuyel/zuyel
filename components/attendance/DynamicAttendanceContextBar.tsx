"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileText,
  UserCheck,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import {
  ACADEMIC_CLASSES,
  getApplicableTradesForClass,
  doesClassHaveTrade,
  parseClassNumeric,
  getSubjectsForClass,
  type AcademicTrade,
  type SubjectItem,
} from "@/lib/academicStructure";
import { getSingleSourceSubjects } from "@/lib/globalSubjectMappingHub";
import { AttendanceRecordType } from "@/lib/database";
import { ATTENDANCE_TYPES_CONFIG, correlateRoutineContext } from "@/lib/attendanceEngine";
import { getDayType } from "@/lib/attendanceData";

export interface AttendanceFilterState {
  session: string;
  classId: number;
  section: string;
  tradeId?: number;
  subjectCode: string;
  subjectName: string;
  date: string;
  periodNo: number;
  attendanceType: AttendanceRecordType;
  teacherName?: string;
  teacherId?: number;
  substituteTeacherName?: string;
  roomNo?: string;
  isLab?: boolean;
}

interface DynamicAttendanceContextBarProps {
  filter: AttendanceFilterState;
  onChange: (updated: Partial<AttendanceFilterState>) => void;
  onRefresh?: () => void;
  onOpenTodaySchedule?: () => void;
  onOpenQuizEligibility?: () => void;
  onOpenAbsenceAnalytics?: () => void;
  onOpenExcelHub?: () => void;
}

const PERIODS = [
  { no: 1, label: "১ম পিরিয়ড", time: "০৮:৩০ - ০৯:১৫" },
  { no: 2, label: "২য় পিরিয়ড", time: "০৯:১৫ - ১০:০০" },
  { no: 3, label: "৩য় পিরিয়ড", time: "১০:০০ - ১০:৪৫" },
  { no: 4, label: "৪র্থ পিরিয়ড", time: "১০:৪৫ - ১১:৩০" },
  { no: 5, label: "৫ম পিরিয়ড", time: "১১:৪৫ - ১২:৩০" },
  { no: 6, label: "৬ষ্ঠ পিরিয়ড", time: "১২:৩০ - ০১:১৫" },
  { no: 7, label: "৭ম পিরিয়ড", time: "০২:০০ - ০২:৪৫" },
  { no: 8, label: "৮ম পিরিয়ড", time: "০২:৪৫ - ০৩:৩০" },
];

const SESSION_OPTIONS = [
  { value: "2026", label: "২০২৬ (চলতি শিক্ষাবর্ষ)" },
  { value: "2025", label: "২০২৫" },
  { value: "2024", label: "২০২৪" },
];

const SECTION_OPTIONS = [
  { value: "A", label: "শাখা - ক (Section A)" },
  { value: "B", label: "শাখা - খ (Section B)" },
  { value: "all", label: "উভয় শাখা (All Sections)" },
];

type SelectChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => void;

const selectClassName =
  "w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none";

/* -------------------------------------------------------------------------- */
/*                             Header action buttons                          */
/* -------------------------------------------------------------------------- */

interface ActionButtonsProps {
  onRefresh?: () => void;
  onOpenTodaySchedule?: () => void;
  onOpenQuizEligibility?: () => void;
  onOpenAbsenceAnalytics?: () => void;
  onOpenExcelHub?: () => void;
}

const ActionButtons = memo(function ActionButtons({
  onRefresh,
  onOpenTodaySchedule,
  onOpenQuizEligibility,
  onOpenAbsenceAnalytics,
  onOpenExcelHub,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onOpenTodaySchedule && (
        <button
          type="button"
          onClick={onOpenTodaySchedule}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1.5 transition-colors"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>আজকের রুটিন ড্যাশবোর্ড</span>
        </button>
      )}

      {onOpenQuizEligibility && (
        <button
          type="button"
          onClick={onOpenQuizEligibility}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 flex items-center gap-1.5 transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>কুইজ যোগ্যতা পরীক্ষা</span>
        </button>
      )}

      {onOpenAbsenceAnalytics && (
        <button
          type="button"
          onClick={onOpenAbsenceAnalytics}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1.5 transition-colors"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>অনুপস্থিতি সতর্কতা (&lt;৭৫%)</span>
        </button>
      )}

      {onOpenExcelHub && (
        <button
          type="button"
          onClick={onOpenExcelHub}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>এক্সেল হাব</span>
        </button>
      )}

      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          title="রিফ্রেশ করুন"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                   Granular Memoized Individual Form Inputs                 */
/* -------------------------------------------------------------------------- */

const AcademicYearSelect = memo(function AcademicYearSelect({
  session,
  onChange,
}: {
  session: string;
  onChange: SelectChangeHandler;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
        ১. শিক্ষাবর্ষ (Year)
      </label>
      <select value={session} onChange={onChange} className={selectClassName}>
        {SESSION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

const ClassSelect = memo(function ClassSelect({
  classId,
  onChange,
}: {
  classId: number;
  onChange: SelectChangeHandler;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
        ২. শ্রেণি (Class)
      </label>
      <select value={classId} onChange={onChange} className={selectClassName}>
        {ACADEMIC_CLASSES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nameBangla}
          </option>
        ))}
      </select>
    </div>
  );
});

const SectionSelect = memo(function SectionSelect({
  section,
  onChange,
}: {
  section: string;
  onChange: SelectChangeHandler;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
        ৩. শাখা (Section)
      </label>
      <select value={section} onChange={onChange} className={selectClassName}>
        {SECTION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

const TradeSelect = memo(function TradeSelect({
  tradeId,
  tradeApplies,
  applicableTrades,
  onChange,
}: {
  tradeId?: number;
  tradeApplies: boolean;
  applicableTrades: AcademicTrade[];
  onChange: SelectChangeHandler;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
        ৪. কারিগরি ট্রেড
      </label>
      {tradeApplies ? (
        <select value={tradeId || 0} onChange={onChange} className={selectClassName}>
          <option value={0}>সকল ট্রেড (কমন পাঠদান)</option>
          {applicableTrades.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameBangla}
            </option>
          ))}
        </select>
      ) : (
        <div className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-center font-normal bg-slate-100/50 dark:bg-slate-800/40">
          প্রাক-ভোকেশনাল (প্রযোজ্য নয়)
        </div>
      )}
    </div>
  );
});

const DateInput = memo(function DateInput({
  date,
  isHoliday,
  onChange,
}: {
  date: string;
  isHoliday: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
        <span>৫. তারিখ (Date)</span>
        {isHoliday && (
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-normal">ছুটি</span>
        )}
      </label>
      <input
        type="date"
        value={date}
        onChange={onChange}
        className={`w-full px-2.5 py-1.5 rounded-lg border text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
          isHoliday
            ? "border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80"
        }`}
      />
    </div>
  );
});

const PeriodSelect = memo(function PeriodSelect({
  periodNo,
  onChange,
}: {
  periodNo: number;
  onChange: SelectChangeHandler;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
        ৬. পিরিয়ড (Period)
      </label>
      <select value={periodNo} onChange={onChange} className={selectClassName}>
        {PERIODS.map((p) => (
          <option key={p.no} value={p.no}>
            {p.label} ({p.time})
          </option>
        ))}
      </select>
    </div>
  );
});

const SubjectSelect = memo(function SubjectSelect({
  subjectCode,
  subjects,
  onChange,
}: {
  subjectCode: string;
  subjects: SubjectItem[];
  onChange: SelectChangeHandler;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
        ৭. পাঠ্য বিষয় (Subject)
      </label>
      <select value={subjectCode} onChange={onChange} className={selectClassName}>
        {subjects.map((s) => (
          <option key={s.id} value={s.code}>
            {s.nameBangla || s.name} ({s.code})
          </option>
        ))}
      </select>
    </div>
  );
});

const AttendanceTypeSelect = memo(function AttendanceTypeSelect({
  attendanceType,
  onChange,
}: {
  attendanceType: AttendanceRecordType;
  onChange: SelectChangeHandler;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
        ৮. হাজিরার ধরণ (Type)
      </label>
      <select value={attendanceType} onChange={onChange} className={selectClassName}>
        {ATTENDANCE_TYPES_CONFIG.map((t) => (
          <option key={t.id} value={t.id}>
            {t.labelBangla}
          </option>
        ))}
      </select>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                              Filter controls                               */
/* -------------------------------------------------------------------------- */

interface FilterControlsProps {
  session: string;
  classId: number;
  section: string;
  tradeId?: number;
  date: string;
  periodNo: number;
  subjectCode: string;
  attendanceType: AttendanceRecordType;
  tradeApplies: boolean;
  isHoliday: boolean;
  applicableTrades: AcademicTrade[];
  subjects: SubjectItem[];
  onSessionChange: SelectChangeHandler;
  onClassChange: SelectChangeHandler;
  onSectionChange: SelectChangeHandler;
  onTradeChange: SelectChangeHandler;
  onDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPeriodChange: SelectChangeHandler;
  onSubjectChange: SelectChangeHandler;
  onAttendanceTypeChange: SelectChangeHandler;
}

const FilterControls = memo(function FilterControls({
  session,
  classId,
  section,
  tradeId,
  date,
  periodNo,
  subjectCode,
  attendanceType,
  tradeApplies,
  isHoliday,
  applicableTrades,
  subjects,
  onSessionChange,
  onClassChange,
  onSectionChange,
  onTradeChange,
  onDateChange,
  onPeriodChange,
  onSubjectChange,
  onAttendanceTypeChange,
}: FilterControlsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3 text-xs">
      <AcademicYearSelect session={session} onChange={onSessionChange} />
      <ClassSelect classId={classId} onChange={onClassChange} />
      <SectionSelect section={section} onChange={onSectionChange} />
      <TradeSelect
        tradeId={tradeId}
        tradeApplies={tradeApplies}
        applicableTrades={applicableTrades}
        onChange={onTradeChange}
      />
      <DateInput date={date} isHoliday={isHoliday} onChange={onDateChange} />
      <PeriodSelect periodNo={periodNo} onChange={onPeriodChange} />
      <SubjectSelect
        subjectCode={subjectCode}
        subjects={subjects}
        onChange={onSubjectChange}
      />
      <AttendanceTypeSelect
        attendanceType={attendanceType}
        onChange={onAttendanceTypeChange}
      />
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                            Routine match banner                            */
/* -------------------------------------------------------------------------- */

interface RoutineBannerProps {
  found: boolean;
  dayNameBangla?: string;
  periodNo: number;
  isLab?: boolean;
  labName?: string;
  subjectName?: string;
  subjectCode?: string;
  teacherName?: string;
  substituteTeacherName?: string;
  roomNo?: string;
  date: string;
  isHoliday: boolean;
  holidayTitle?: string;
  onApply: () => void;
}

const RoutineBanner = memo(function RoutineBanner({
  found,
  dayNameBangla,
  periodNo,
  isLab,
  labName,
  subjectName,
  subjectCode,
  teacherName,
  substituteTeacherName,
  roomNo,
  date,
  isHoliday,
  holidayTitle,
  onApply,
}: RoutineBannerProps) {
  if (found) {
    return (
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <span>
                রুটিন অটো-ম্যাচ: {dayNameBangla} - {periodNo}ম পিরিয়ড
              </span>
              {isLab && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                  ব্যবহারিক ল্যাব ({labName || "Lab"})
                </span>
              )}
            </div>
            <div className="text-slate-600 dark:text-slate-400 mt-0.5">
              বিষয়:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {subjectName} ({subjectCode})
              </span>
              {" • "}
              শিক্ষক:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">{teacherName}</span>
              {substituteTeacherName && (
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  {" "}
                  (বদলি: {substituteTeacherName})
                </span>
              )}
              {" • "}
              কক্ষ:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {roomNo || "Room 201"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onApply}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>অটো-ফিল প্রয়োগ করুন</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
      <span>
        তথ্য: {date} তারিখে {periodNo}ম পিরিয়ডে কোনো প্রকাশিত রুটিন সূচি নির্ধারিত নেই (অফ-রুটিন / সাধারণ
        হাজিরা মোড)।
      </span>
      {isHoliday && (
        <span className="font-semibold text-rose-600 dark:text-rose-400">
          ছুটির দিন: {holidayTitle}
        </span>
      )}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*                                  Main bar                                  */
/* -------------------------------------------------------------------------- */

function DynamicAttendanceContextBar({
  filter,
  onChange,
  onRefresh,
  onOpenTodaySchedule,
  onOpenQuizEligibility,
  onOpenAbsenceAnalytics,
  onOpenExcelHub,
}: DynamicAttendanceContextBarProps) {
  // Capture parent callbacks in refs to keep event listeners referentially stable
  // and prevent child components from re-rendering on parent renders.
  const onChangeRef = useRef(onChange);
  const onRefreshRef = useRef(onRefresh);
  const onOpenTodayScheduleRef = useRef(onOpenTodaySchedule);
  const onOpenQuizEligibilityRef = useRef(onOpenQuizEligibility);
  const onOpenAbsenceAnalyticsRef = useRef(onOpenAbsenceAnalytics);
  const onOpenExcelHubRef = useRef(onOpenExcelHub);

  useEffect(() => {
    onChangeRef.current = onChange;
    onRefreshRef.current = onRefresh;
    onOpenTodayScheduleRef.current = onOpenTodaySchedule;
    onOpenQuizEligibilityRef.current = onOpenQuizEligibility;
    onOpenAbsenceAnalyticsRef.current = onOpenAbsenceAnalytics;
    onOpenExcelHubRef.current = onOpenExcelHub;
  });

  const numericClass = useMemo(
    () => parseClassNumeric(filter.classId),
    [filter.classId]
  );

  const tradeApplies = useMemo(
    () => doesClassHaveTrade(filter.classId),
    [filter.classId]
  );

  const applicableTrades = useMemo<AcademicTrade[]>(
    () => (tradeApplies ? getApplicableTradesForClass(filter.classId) : []),
    [tradeApplies, filter.classId]
  );

  const subjects = useMemo<SubjectItem[]>(() => {
    const globalSubjects = getSingleSourceSubjects({
      classVal: filter.classId,
      tradeVal: filter.tradeId,
      academicYear: filter.session || "2026",
    });

    if (globalSubjects.length > 0) {
      return globalSubjects.map((s) => ({
        id: typeof s.id === "number" ? s.id : parseInt(String(s.id), 10) || 100,
        code: s.code,
        name: s.name,
        nameBangla: s.nameBangla || s.name,
        applicableClasses: [numericClass],
        tradeId: s.tradeId,
        tradeCode: s.tradeCode,
        isCommon: s.isCommon,
        type: (s.type || (s.isCommon ? "General" : "Trade")) as SubjectItem["type"],
        marks: s.marks || 100,
      }));
    }

    return getSubjectsForClass(filter.classId, filter.tradeId);
  }, [filter.classId, filter.tradeId, filter.session, numericClass]);

  const dayType = useMemo(() => getDayType(filter.date), [filter.date]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const routineMatch = useMemo(
    () =>
      isMounted
        ? correlateRoutineContext({
            session: filter.session,
            classId: filter.classId,
            section: filter.section,
            tradeId: filter.tradeId,
            date: filter.date,
            periodNo: filter.periodNo,
          })
        : null,
    [
      isMounted,
      filter.session,
      filter.classId,
      filter.section,
      filter.tradeId,
      filter.date,
      filter.periodNo,
    ]
  );

  // Stable filter update dispatcher
  const updateFilter = useCallback((patch: Partial<AttendanceFilterState>) => {
    onChangeRef.current?.(patch);
  }, []);

  const handleSessionChange = useCallback<SelectChangeHandler>(
    (event) => updateFilter({ session: event.target.value }),
    [updateFilter]
  );

  const handleSectionChange = useCallback<SelectChangeHandler>(
    (event) => updateFilter({ section: event.target.value }),
    [updateFilter]
  );

  const handleDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      updateFilter({ date: event.target.value }),
    [updateFilter]
  );

  const handlePeriodChange = useCallback<SelectChangeHandler>(
    (event) => updateFilter({ periodNo: Number(event.target.value) }),
    [updateFilter]
  );

  const handleAttendanceTypeChange = useCallback<SelectChangeHandler>(
    (event) =>
      updateFilter({
        attendanceType: event.target.value as AttendanceRecordType,
      }),
    [updateFilter]
  );

  const filterSubjectNameRef = useRef(filter.subjectName);
  useEffect(() => {
    filterSubjectNameRef.current = filter.subjectName;
  }, [filter.subjectName]);

  const handleSubjectChange = useCallback<SelectChangeHandler>(
    (event) => {
      const code = event.target.value;
      const matchedSub = subjects.find((s) => s.code === code);

      updateFilter({
        subjectCode: code,
        subjectName: matchedSub
          ? matchedSub.nameBangla || matchedSub.name
          : filterSubjectNameRef.current,
      });
    },
    [subjects, updateFilter]
  );

  const handleClassChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newClassId = Number(event.target.value);
      const hasTrades = doesClassHaveTrade(newClassId);
      let newTradeId: number | undefined = undefined;

      if (hasTrades) {
        const trades = getApplicableTradesForClass(newClassId);
        newTradeId = trades.length > 0 ? trades[0].id : 2;
      }

      const availableSubjects = getSubjectsForClass(newClassId, newTradeId);
      const firstSubject = availableSubjects.length > 0 ? availableSubjects[0] : null;

      updateFilter({
        classId: newClassId,
        tradeId: newTradeId,
        subjectCode: firstSubject ? firstSubject.code : "GEN-01",
        subjectName: firstSubject
          ? firstSubject.nameBangla || firstSubject.name
          : "সাধারণ বিষয়",
      });
    },
    [updateFilter]
  );

  const currentClassIdRef = useRef(filter.classId);
  const currentSubjectCodeRef = useRef(filter.subjectCode);
  useEffect(() => {
    currentClassIdRef.current = filter.classId;
    currentSubjectCodeRef.current = filter.subjectCode;
  }, [filter.classId, filter.subjectCode]);

  const handleTradeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newTradeId = Number(event.target.value);
      const availableSubjects = getSubjectsForClass(currentClassIdRef.current, newTradeId);
      const firstSubject = availableSubjects.length > 0 ? availableSubjects[0] : null;

      updateFilter({
        tradeId: newTradeId,
        subjectCode: firstSubject ? firstSubject.code : currentSubjectCodeRef.current,
        subjectName: firstSubject
          ? firstSubject.nameBangla || firstSubject.name
          : filterSubjectNameRef.current,
      });
    },
    [updateFilter]
  );

  const filterStateRef = useRef(filter);
  useEffect(() => {
    filterStateRef.current = filter;
  }, [filter]);

  const handleApplyRoutineSuggestion = useCallback(() => {
    if (!routineMatch || !routineMatch.found) return;

    const currentFilter = filterStateRef.current;
    updateFilter({
      subjectCode: routineMatch.subjectCode || currentFilter.subjectCode,
      subjectName: routineMatch.subjectName || currentFilter.subjectName,
      teacherName: routineMatch.teacherName || currentFilter.teacherName,
      teacherId: routineMatch.teacherId,
      substituteTeacherName: routineMatch.substituteTeacherName,
      roomNo: routineMatch.roomNo || currentFilter.roomNo,
      isLab: routineMatch.isLab,
      attendanceType:
        routineMatch.suggestedAttendanceType || currentFilter.attendanceType,
    });
  }, [routineMatch, updateFilter]);

  // Stable wrapper callbacks for action buttons
  const handleRefresh = useCallback(() => onRefreshRef.current?.(), []);
  const handleOpenTodaySchedule = useCallback(() => onOpenTodayScheduleRef.current?.(), []);
  const handleOpenQuizEligibility = useCallback(() => onOpenQuizEligibilityRef.current?.(), []);
  const handleOpenAbsenceAnalytics = useCallback(() => onOpenAbsenceAnalyticsRef.current?.(), []);
  const handleOpenExcelHub = useCallback(() => onOpenExcelHubRef.current?.(), []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top Header & Fast Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              একাডেমিক হাজিরা প্রেক্ষাপট (Academic Context)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              সেশন, শ্রেণি, সেকশন, ট্রেড, তারিখ ও পিরিয়ডের সমন্বিত রুটিন-সচেতন ডিজিটাল রেজিস্টার
            </p>
          </div>
        </div>

        <ActionButtons
          onRefresh={onRefresh ? handleRefresh : undefined}
          onOpenTodaySchedule={onOpenTodaySchedule ? handleOpenTodaySchedule : undefined}
          onOpenQuizEligibility={onOpenQuizEligibility ? handleOpenQuizEligibility : undefined}
          onOpenAbsenceAnalytics={onOpenAbsenceAnalytics ? handleOpenAbsenceAnalytics : undefined}
          onOpenExcelHub={onOpenExcelHub ? handleOpenExcelHub : undefined}
        />
      </div>

      {/* Dynamic Filter Controls Flow (Step 1 to Step 8) */}
      <FilterControls
        session={filter.session}
        classId={filter.classId}
        section={filter.section}
        tradeId={filter.tradeId}
        date={filter.date}
        periodNo={filter.periodNo}
        subjectCode={filter.subjectCode}
        attendanceType={filter.attendanceType}
        tradeApplies={tradeApplies}
        isHoliday={dayType.isHoliday}
        applicableTrades={applicableTrades}
        subjects={subjects}
        onSessionChange={handleSessionChange}
        onClassChange={handleClassChange}
        onSectionChange={handleSectionChange}
        onTradeChange={handleTradeChange}
        onDateChange={handleDateChange}
        onPeriodChange={handlePeriodChange}
        onSubjectChange={handleSubjectChange}
        onAttendanceTypeChange={handleAttendanceTypeChange}
      />

      {/* Routine Correlated Intelligence Banner */}
      <RoutineBanner
        found={Boolean(routineMatch?.found)}
        dayNameBangla={routineMatch?.dayNameBangla}
        periodNo={filter.periodNo}
        isLab={routineMatch?.isLab}
        labName={routineMatch?.labName}
        subjectName={routineMatch?.subjectName}
        subjectCode={routineMatch?.subjectCode}
        teacherName={routineMatch?.teacherName}
        substituteTeacherName={routineMatch?.substituteTeacherName}
        roomNo={routineMatch?.roomNo}
        date={filter.date}
        isHoliday={dayType.isHoliday}
        holidayTitle={dayType.holidayTitle}
        onApply={handleApplyRoutineSuggestion}
      />
    </div>
  );
}

/**
 * Structural comparison of filter properties.
 * Ignores transient callback reference identity changes from parent re-renders,
 * preventing severe performance drops during student attendance row updates.
 */
function areContextBarPropsEqual(
  prev: DynamicAttendanceContextBarProps,
  next: DynamicAttendanceContextBarProps
): boolean {
  const a = prev.filter;
  const b = next.filter;

  const isFilterIdentical =
    a.session === b.session &&
    a.classId === b.classId &&
    a.section === b.section &&
    a.tradeId === b.tradeId &&
    a.subjectCode === b.subjectCode &&
    a.subjectName === b.subjectName &&
    a.date === b.date &&
    a.periodNo === b.periodNo &&
    a.attendanceType === b.attendanceType &&
    a.teacherName === b.teacherName &&
    a.teacherId === b.teacherId &&
    a.substituteTeacherName === b.substituteTeacherName &&
    a.roomNo === b.roomNo &&
    a.isLab === b.isLab;

  if (!isFilterIdentical) return false;

  // Only re-render if the existence of optional action callbacks changed
  return (
    Boolean(prev.onRefresh) === Boolean(next.onRefresh) &&
    Boolean(prev.onOpenTodaySchedule) === Boolean(next.onOpenTodaySchedule) &&
    Boolean(prev.onOpenQuizEligibility) === Boolean(next.onOpenQuizEligibility) &&
    Boolean(prev.onOpenAbsenceAnalytics) === Boolean(next.onOpenAbsenceAnalytics) &&
    Boolean(prev.onOpenExcelHub) === Boolean(next.onOpenExcelHub)
  );
}

export default memo(DynamicAttendanceContextBar, areContextBarPropsEqual);
