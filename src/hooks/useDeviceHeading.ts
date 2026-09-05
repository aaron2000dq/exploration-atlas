"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HeadingPermission = "idle" | "granted" | "denied" | "unavailable";

type CompassOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

type PermissionAwareOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function currentScreenAngle() {
  const normalize = (angle: number) => ((angle % 360) + 360) % 360;
  const screenAngle = window.screen.orientation?.angle;
  const legacyAngle = (window as Window & { orientation?: number }).orientation;
  const screenValue = Number.isFinite(screenAngle) ? normalize(Number(screenAngle)) : null;
  const legacyValue = Number.isFinite(legacyAngle) ? normalize(Number(legacyAngle)) : null;
  const isLandscape = window.matchMedia?.("(orientation: landscape)").matches;

  // iPadOS Safari can leave screen.orientation.angle on the previous landscape
  // side. window.orientation still distinguishes the two physical ways the
  // user can hold an iPad (90 vs 270), so it must win when both report a
  // quarter turn. Choosing the stale screen value flips the arrow by 180°.
  if (isLandscape) {
    if (legacyValue === 90 || legacyValue === 270) return legacyValue;
    if (screenValue === 90 || screenValue === 270) return screenValue;
  }
  return screenValue ?? legacyValue ?? 0;
}

function compassDegrees(event: CompassOrientationEvent) {
  let raw: number | null = null;
  if (Number.isFinite(event.webkitCompassHeading)) {
    raw = Number(event.webkitCompassHeading);
  } else if (event.absolute === true && Number.isFinite(event.alpha)) {
    raw = (360 - Number(event.alpha) + 360) % 360;
  }
  if (raw === null) return null;
  // iOS reports the direction of the device's portrait top edge. Rotate that
  // vector into the current screen coordinates so "up" remains screen-up in
  // both landscape orientations.
  return (raw - currentScreenAngle() + 720) % 360;
}

export function useDeviceHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [permission, setPermission] = useState<HeadingPermission>("idle");
  const attached = useRef(false);
  const lastRaw = useRef<number | null>(null);
  const continuous = useRef(0);
  const lastUpdate = useRef(0);

  const onOrientation = useCallback((nativeEvent: DeviceOrientationEvent) => {
    const now = performance.now();
    // Keep up with a hand-held turn. The old 70 ms gate was visible on top of
    // Safari's own sensor cadence, especially when the iPad was landscape.
    if (now - lastUpdate.current < 24) return;
    const raw = compassDegrees(nativeEvent as CompassOrientationEvent);
    if (raw === null) return;

    if (lastRaw.current === null) {
      continuous.current = raw;
    } else {
      const shortestTurn = ((raw - lastRaw.current + 540) % 360) - 180;
      continuous.current += shortestTurn;
    }
    lastRaw.current = raw;
    lastUpdate.current = now;
    setHeading(continuous.current);
  }, []);

  const attach = useCallback(() => {
    if (attached.current) return;
    // On iPadOS, `deviceorientation` carries the calibrated
    // webkitCompassHeading. Listening to `deviceorientationabsolute` as well
    // can deliver a second alpha-only event in another reference frame and
    // make the arrow flip just after walking begins.
    window.addEventListener("deviceorientation", onOrientation, true);
    attached.current = true;
  }, [onOrientation]);

  const request = useCallback(async () => {
    if (!("DeviceOrientationEvent" in window)) {
      setPermission("unavailable");
      return false;
    }
    const constructor = window.DeviceOrientationEvent as PermissionAwareOrientationEvent;
    try {
      if (typeof constructor.requestPermission === "function") {
        const result = await constructor.requestPermission();
        if (result !== "granted") {
          setPermission("denied");
          return false;
        }
      }
      attach();
      setPermission("granted");
      return true;
    } catch {
      setPermission("denied");
      return false;
    }
  }, [attach]);

  useEffect(() => {
    if (!("DeviceOrientationEvent" in window)) {
      setPermission("unavailable");
      return;
    }
    const constructor = window.DeviceOrientationEvent as PermissionAwareOrientationEvent;
    if (typeof constructor.requestPermission !== "function") {
      attach();
      setPermission("granted");
    }
    const resetForScreenRotation = () => {
      lastRaw.current = null;
      lastUpdate.current = 0;
    };
    window.addEventListener("orientationchange", resetForScreenRotation);
    window.screen.orientation?.addEventListener?.("change", resetForScreenRotation);
    return () => {
      if (attached.current) {
        window.removeEventListener("deviceorientation", onOrientation, true);
      }
      window.removeEventListener("orientationchange", resetForScreenRotation);
      window.screen.orientation?.removeEventListener?.("change", resetForScreenRotation);
      attached.current = false;
    };
  }, [attach, onOrientation]);

  return { heading, permission, request };
}
