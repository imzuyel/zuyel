"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  ACADEMIC_CLASSES,
  ALL_TRADES,
  AcademicClass,
  AcademicTrade,
  doesClassHaveTrade,
  getApplicableTradesForClass,
  parseClassNumeric,
} from "@/lib/academicStructure";

export interface GlobalAcademicState {
  academicYear: string;
  selectedClassId: string;
  selectedSection: string;
  selectedTradeId: string;
}

export interface GlobalAcademicContextType extends GlobalAcademicState {
  selectedClass?: string | number;
  selectedTrade?: string | number;
  activeClass: AcademicClass;
  activeTrade: AcademicTrade | null;
  isTradeApplicable: boolean;
  availableClasses: AcademicClass[];
  availableTrades: AcademicTrade[];
  availableSections: string[];
  activeClassName: string;
  activeTradeName: string;
  setAcademicYear: (year: string) => void;
  setSelectedClassId: (classId: string | number) => void;
  setSelectedSection: (section: string) => void;
  setSelectedTradeId: (tradeId: string | number) => void;
  setGlobalAcademicMapping: (params: Partial<GlobalAcademicState>) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = "ptsc_global_academic_context";

const DEFAULT_STATE: GlobalAcademicState = {
  academicYear: "2026",
  selectedClassId: "4", // Class 9 by default
  selectedSection: "A",
  selectedTradeId: "101", // Consumer Electronics by default
};

const GlobalAcademicContext = createContext<GlobalAcademicContextType | undefined>(undefined);

export function GlobalAcademicProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GlobalAcademicState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Restore persisted configuration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setState((prev) => ({
            ...prev,
            academicYear: parsed.academicYear || prev.academicYear,
            selectedClassId: String(parsed.selectedClassId || prev.selectedClassId),
            selectedSection: parsed.selectedSection || prev.selectedSection,
            selectedTradeId: String(parsed.selectedTradeId || prev.selectedTradeId),
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to load global academic settings from localStorage", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage and notify listeners whenever state changes (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("ptsc_academic_context_changed", { detail: state })
          );
        }, 0);
      }
    } catch (e) {
      console.warn("Failed to save global academic settings to localStorage", e);
    }
  }, [state, isHydrated]);

  // Active Class Object
  const activeClass = useMemo(() => {
    const found = ACADEMIC_CLASSES.find((c) => String(c.id) === String(state.selectedClassId));
    return found || ACADEMIC_CLASSES[3]; // Default to Class 9 (id: 4)
  }, [state.selectedClassId]);

  // Is Trade applicable for currently active class
  const isTradeApplicable = useMemo(() => {
    return doesClassHaveTrade(state.selectedClassId);
  }, [state.selectedClassId]);

  // Available Trades for active class
  const availableTrades = useMemo(() => {
    if (!isTradeApplicable) return [];
    return getApplicableTradesForClass(state.selectedClassId);
  }, [state.selectedClassId, isTradeApplicable]);

  // Active Trade Object
  const activeTrade = useMemo(() => {
    if (!isTradeApplicable) return null;
    if (state.selectedTradeId === "all") return null;
    return (
      ALL_TRADES.find((t) => String(t.id) === String(state.selectedTradeId)) ||
      availableTrades[0] ||
      null
    );
  }, [isTradeApplicable, state.selectedTradeId, availableTrades]);

  // Available Sections for active class
  const availableSections = useMemo(() => {
    return activeClass.sections && activeClass.sections.length > 0
      ? activeClass.sections
      : ["A", "B"];
  }, [activeClass]);

  // Mutator: Set Academic Year
  const setAcademicYear = useCallback((year: string) => {
    setState((prev) => ({ ...prev, academicYear: String(year) }));
  }, []);

  // Mutator: Set Active Class (automatically revalidates trade applicability)
  const setSelectedClassId = useCallback((classId: string | number) => {
    const clsStr = String(classId);
    setState((prev) => {
      const hasTrade = doesClassHaveTrade(clsStr);
      let nextTradeId = prev.selectedTradeId;

      if (hasTrade) {
        const trades = getApplicableTradesForClass(clsStr);
        const stillValid = trades.some((t) => String(t.id) === prev.selectedTradeId);
        if (!stillValid && trades.length > 0) {
          nextTradeId = String(trades[0].id);
        }
      } else {
        nextTradeId = "all";
      }

      return {
        ...prev,
        selectedClassId: clsStr,
        selectedTradeId: nextTradeId,
      };
    });
  }, []);

  // Mutator: Set Active Section
  const setSelectedSection = useCallback((section: string) => {
    setState((prev) => ({ ...prev, selectedSection: section }));
  }, []);

  // Mutator: Set Active Trade
  const setSelectedTradeId = useCallback((tradeId: string | number) => {
    setState((prev) => ({ ...prev, selectedTradeId: String(tradeId) }));
  }, []);

  // Mutator: Bulk parameter update
  const setGlobalAcademicMapping = useCallback((params: Partial<GlobalAcademicState>) => {
    setState((prev) => ({ ...prev, ...params }));
  }, []);

  // Reset to default institutional configuration
  const resetToDefaults = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value: GlobalAcademicContextType = useMemo(
    () => ({
      ...state,
      selectedClass: state.selectedClassId,
      selectedTrade: state.selectedTradeId,
      activeClass,
      activeTrade,
      isTradeApplicable,
      availableClasses: ACADEMIC_CLASSES,
      availableTrades,
      availableSections,
      activeClassName: activeClass.nameBangla,
      activeTradeName: activeTrade ? activeTrade.nameBangla : "সাধারণ (Pre-Vocational)",
      setAcademicYear,
      setSelectedClassId,
      setSelectedSection,
      setSelectedTradeId,
      setGlobalAcademicMapping,
      resetToDefaults,
    }),
    [
      state,
      activeClass,
      activeTrade,
      isTradeApplicable,
      availableTrades,
      availableSections,
      setAcademicYear,
      setSelectedClassId,
      setSelectedSection,
      setSelectedTradeId,
      setGlobalAcademicMapping,
      resetToDefaults,
    ]
  );

  return (
    <GlobalAcademicContext.Provider value={value}>
      {children}
    </GlobalAcademicContext.Provider>
  );
}

export function useGlobalAcademic() {
  const context = useContext(GlobalAcademicContext);
  if (!context) {
    throw new Error("useGlobalAcademic must be used within a GlobalAcademicProvider");
  }
  return context;
}
