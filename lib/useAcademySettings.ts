"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS,
  AcademyClassTradeMapping,
  AcademyTradeConfig,
  normalizeClassId,
  doesClassRequireTrade,
  getAvailableTradesForClass,
  getClassLabelBangla,
  getTradeLabelBangla,
  getClassTradeMapping,
} from "./academySettingsStore";

export function useAcademySettings() {
  const [mappings, setMappings] = useState<AcademyClassTradeMapping[]>(DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/academic/academy-settings");
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.success && Array.isArray(data.mappings) && data.mappings.length > 0) {
          setMappings(data.mappings);
        }
      } catch (err) {
        // Resilient fallback keeps static defaults
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const getTradesForClass = useCallback(
    (classVal: string | number | undefined | null): AcademyTradeConfig[] => {
      return getAvailableTradesForClass(classVal, mappings);
    },
    [mappings]
  );

  const hasTrades = useCallback(
    (classVal: string | number | undefined | null): boolean => {
      return doesClassRequireTrade(classVal, mappings);
    },
    [mappings]
  );

  const getMappingForClass = useCallback(
    (classVal: string | number | undefined | null): AcademyClassTradeMapping | undefined => {
      return getClassTradeMapping(classVal, mappings);
    },
    [mappings]
  );

  return {
    mappings,
    loading,
    getTradesForClass,
    hasTrades,
    getMappingForClass,
    normalizeClassId,
    getClassLabelBangla: (classVal: string | number | undefined | null) =>
      getClassLabelBangla(classVal, mappings),
    getTradeLabelBangla,
  };
}
