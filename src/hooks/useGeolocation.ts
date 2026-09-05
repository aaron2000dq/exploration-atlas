"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bearingDegrees,
  haversineDistance,
  holdLastReliablePosition,
  smoothPositionSample,
} from "@/src/lib/geo";
import type { PositionSample } from "@/src/types";

type LocationStatus = "idle" | "requesting" | "active" | "imprecise" | "denied" | "unavailable";

function smoothCourse(previous: number | undefined, next: number, alpha = 0.58) {
  if (!Number.isFinite(previous)) return ((next % 360) + 360) % 360;
  const turn = ((next - Number(previous) + 540) % 360) - 180;
  return (Number(previous) + turn * alpha + 360) % 360;
}

export function useGeolocation(enabled: boolean, maxAccuracy = 200) {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [sample, setSample] = useState<PositionSample | null>(null);
  const [error, setError] = useState("");
  const sampleRef = useRef<PositionSample | null>(null);
  const courseAnchorRef = useRef<PositionSample | null>(null);
  const stableCourseRef = useRef<number | undefined>(undefined);
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      setError("此设备没有提供网页定位能力。你仍可通过制图人暗门继续。 ");
      return;
    }
    stop();
    sampleRef.current = null;
    courseAnchorRef.current = null;
    stableCourseRef.current = undefined;
    setSample(null);
    setStatus("requesting");
    setError("");
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const next: PositionSample = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          // Safari's coords.heading has been observed pointing along the
          // reverse course on the target Wi-Fi iPad. Always derive walking
          // course from successive WGS-84 positions instead.
          heading: undefined,
        };
        if (!Number.isFinite(next.accuracy) || next.accuracy < 0 || next.accuracy > maxAccuracy) {
          setSample(holdLastReliablePosition(sampleRef.current, next));
          setStatus("imprecise");
          setError(`当前定位精度约 ±${Math.round(next.accuracy)} 米，墨点已冻结，等待更准确的位置。`);
          return;
        }
        const previous = sampleRef.current;
        const anchor = courseAnchorRef.current;
        if (!anchor) {
          courseAnchorRef.current = next;
        } else {
          // Accumulate several small Safari fixes against a stable anchor.
          // The resulting bearing is deterministic and cannot inherit an
          // implementation-specific reversed heading from iPadOS.
          const movedM = haversineDistance(anchor, next);
          const courseThresholdM = Math.max(3, Math.min(6, next.accuracy * 0.16));
          if (movedM >= courseThresholdM) {
            const course = bearingDegrees(anchor, next);
            stableCourseRef.current = smoothCourse(stableCourseRef.current, course);
            next.heading = stableCourseRef.current;
            courseAnchorRef.current = next;
          } else if (Number.isFinite(stableCourseRef.current)) {
            next.heading = stableCourseRef.current;
          }
        }
        const smoothed = smoothPositionSample(sampleRef.current, next);
        sampleRef.current = smoothed;
        setSample(smoothed);
        setStatus("active");
        setError("");
      },
      (locationError) => {
        setStatus(locationError.code === 1 ? "denied" : "unavailable");
        setError(
          locationError.code === 1
            ? "定位权限没有开启。请在 Safari 网站设置中允许位置访问。"
            : "暂时无法获得位置，墨点会停留在云雾里。",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25_000 },
    );
  }, [maxAccuracy, stop]);

  useEffect(() => {
    if (enabled) start();
    else {
      stop();
      setStatus("idle");
      sampleRef.current = null;
      courseAnchorRef.current = null;
      stableCourseRef.current = undefined;
      setSample(null);
    }
    return stop;
  }, [enabled, start, stop]);

  return { status, sample, error, retry: start, stop };
}
