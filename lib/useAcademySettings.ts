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
import { safeFetchJson } from "./safeFetch";

// Module-level cache to eliminate redundant network requests across component mounts
let cachedMappings: AcademyClassTradeMapping[] | null = null;
let inFlightFetch: Promise<AcademyClassTradeMapping[] | null> | null = null;

export function useAcademySettings() {
  const [mappings, setMappings] = useState<AcademyClassTradeMapping[]>(
    cachedMappings || DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS
  );
  const [loading, setLoading] = useState<boolean>(!cachedMappings);

  useEffect(() => {
    let active = true;

    // If cache already exists, initialize immediately and skip fetch
    if (cachedMappings) {
      setMappings(cachedMappings);
      setLoading(false);
      return;
    }

    // Reuse in-flight request if another component triggered it simultaneously
    if (!inFlightFetch) {
      inFlightFetch = safeFetchJson<{ mappings: AcademyClassTradeMapping[] }>(
        "/api/academic/academy-settings"
      )
        .then((res) => {
          if (res.ok && res.data?.mappings && Array.isArray(res.data.mappings)) {
            cachedMappings = res.data.mappings;
            return cachedMappings;
          } else if (res.ok && Array.isArray((res as any).mappings)) {
            cachedMappings = (res as any).mappings;
            return cachedMappings;
          }
          return null;
        })
        .catch(() => null)
        .finally(() => {
          inFlightFetch = null;
        });
    }

    setLoading(true);
    inFlightFetch.then((data) => {
      if (active) {
        if (data && data.length > 0) {
          setMappings(data);
        } else if (!cachedMappings) {
          setMappings(DEFAULT_ACADEMY_CLASS_TRADE_MAPPINGS);
        }
        setLoading(false);
      }
    });

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
