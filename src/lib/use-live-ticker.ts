"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveTickerData } from "./types";

interface UseLiveTickerResult {
  data: LiveTickerData | null;
  lastUpdate: Date | null;
  isPolling: boolean;
}

/**
 * Vanilla-React polling hook for /api/ticker. No external deps.
 *
 * Key behaviors:
 *  - First fetch fires immediately on mount.
 *  - Then refetches every `refreshMs` (default 60s).
 *  - Pauses polling when document is hidden (Page Visibility API) — when the
 *    tab becomes hidden we clear the interval; when it becomes visible again
 *    we kick off an immediate refetch and resume the interval.
 *  - Cancels in-flight state updates on unmount.
 *  - Swallows fetch errors silently — the next tick will retry. Stale data
 *    is preferable to flashing an error in a marquee ticker.
 */
export function useLiveTicker(refreshMs: number = 60_000): UseLiveTickerResult {
  const [data, setData] = useState<LiveTickerData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const fetchOnce = async (): Promise<void> => {
      try {
        const res = await fetch("/api/ticker", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as LiveTickerData;
        if (!cancelledRef.current) {
          setData(json);
          setLastUpdate(new Date());
        }
      } catch {
        // Silent retry on next tick.
      }
    };

    const startInterval = (): void => {
      if (intervalRef.current != null) return;
      intervalRef.current = setInterval(fetchOnce, refreshMs);
      setIsPolling(true);
    };

    const stopInterval = (): void => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };

    const handleVisibility = (): void => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "hidden") {
        stopInterval();
      } else {
        // Tab back in focus — immediate refresh + resume cadence.
        void fetchOnce();
        startInterval();
      }
    };

    // Kick off.
    void fetchOnce();
    if (typeof document === "undefined" || document.visibilityState === "visible") {
      startInterval();
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      cancelledRef.current = true;
      stopInterval();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [refreshMs]);

  return { data, lastUpdate, isPolling };
}
