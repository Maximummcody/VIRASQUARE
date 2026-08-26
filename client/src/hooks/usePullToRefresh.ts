import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "./useMobile";

const TRIGGER_DISTANCE = 72;
const MAX_DISTANCE = 96;

export function getPullRefreshState(distance: number, refreshing: boolean) {
  return {
    isReady: distance >= TRIGGER_DISTANCE,
    label: refreshing ? "Refreshing" : distance >= TRIGGER_DISTANCE ? "Release to refresh" : "Pull to refresh",
  };
}

export function usePullToRefresh(onRefresh: () => Promise<unknown> | unknown) {
  const isMobile = useIsMobile();
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  const onTouchStart = useCallback((event: React.TouchEvent<HTMLElement>) => {
    if (!isMobile || refreshing || window.scrollY > 0) return;
    startY.current = event.touches[0]?.clientY ?? null;
  }, [isMobile, refreshing]);

  const onTouchMove = useCallback((event: React.TouchEvent<HTMLElement>) => {
    if (startY.current === null || !isMobile || refreshing || window.scrollY > 0) return;
    const next = Math.max(0, (event.touches[0]?.clientY ?? startY.current) - startY.current);
    setDistance(Math.min(MAX_DISTANCE, next * 0.55));
  }, [isMobile, refreshing]);

  const finishPull = useCallback(async () => {
    const shouldRefresh = distance >= TRIGGER_DISTANCE;
    startY.current = null;
    setDistance(0);
    if (!shouldRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await refreshRef.current();
    } finally {
      setRefreshing(false);
    }
  }, [distance, refreshing]);

  return {
    distance,
    refreshing,
    isReady: getPullRefreshState(distance, refreshing).isReady,
    handlers: { onTouchStart, onTouchMove, onTouchEnd: finishPull, onTouchCancel: finishPull },
  };
}
