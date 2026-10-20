"use client";

import { useState, useEffect, useCallback } from "react";
import { DynamicSubjectItem, fetchSubjectsByClassTrade, getSingleSourceSubjects } from "./globalSubjectMappingHub";

export interface UseGlobalSubjectsOptions {
  classVal?: number | string;
  tradeVal?: number | string;
  academicYear?: string;
  autoFetch?: boolean;
}

export interface UseGlobalSubjectsResult {
  subjects: DynamicSubjectItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  commonSubjects: DynamicSubjectItem[];
  tradeSubjects: DynamicSubjectItem[];
  getSubjectByCode: (code: string) => DynamicSubjectItem | undefined;
  getSubjectById: (id: number | string) => DynamicSubjectItem | undefined;
}

/**
 * Reusable React Hook for fetching centrally mapped subjects
 * Compatible with Routine, Attendance, Examination, and Marks modules
 */
export function useGlobalSubjects({
  classVal,
  tradeVal,
  academicYear = "2026",
  autoFetch = true,
}: UseGlobalSubjectsOptions = {}): UseGlobalSubjectsResult {
  const [subjects, setSubjects] = useState<DynamicSubjectItem[]>(() => {
    if (classVal) {
      return getSingleSourceSubjects({ classVal, tradeVal, academicYear });
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!classVal) {
      setSubjects([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await fetchSubjectsByClassTrade(classVal, tradeVal, academicYear);
      setSubjects(items);
    } catch (err: any) {
      console.error("useGlobalSubjects fetch error:", err);
      setError(err?.message || "Failed to load subjects");
      // Fallback
      setSubjects(getSingleSourceSubjects({ classVal, tradeVal, academicYear }));
    } finally {
      setIsLoading(false);
    }
  }, [classVal, tradeVal, academicYear]);

  useEffect(() => {
    if (autoFetch && classVal) {
      fetchSubjects();
    }
  }, [autoFetch, classVal, tradeVal, academicYear, fetchSubjects]);

  // Listen for global mapping changes dispatched by the Hub
  useEffect(() => {
    const handleGlobalUpdate = () => {
      if (classVal) {
        fetchSubjects();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pts-academic-mapping-updated", handleGlobalUpdate);
      return () => {
        window.removeEventListener("pts-academic-mapping-updated", handleGlobalUpdate);
      };
    }
  }, [classVal, fetchSubjects]);

  const commonSubjects = subjects.filter((s) => s.isCommon);
  const tradeSubjects = subjects.filter((s) => !s.isCommon);

  const getSubjectByCode = useCallback(
    (code: string) => {
      const c = code.trim().toLowerCase();
      return subjects.find((s) => s.code.toLowerCase() === c);
    },
    [subjects]
  );

  const getSubjectById = useCallback(
    (id: number | string) => {
      return subjects.find((s) => String(s.id) === String(id));
    },
    [subjects]
  );

  return {
    subjects,
    isLoading,
    error,
    refetch: fetchSubjects,
    commonSubjects,
    tradeSubjects,
    getSubjectByCode,
    getSubjectById,
  };
}
