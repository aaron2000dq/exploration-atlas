import type { LatLng } from "@/src/types";

// Publicly documented GCJ-02 approximation constants. This module is used only
// while preparing and verifying static WGS-84 story data. Runtime geolocation
// never passes through it.
const PI = Math.PI;
const KRASOVSKY_SEMI_MAJOR_AXIS_M = 6_378_245;
const ECCENTRICITY_SQUARED = 0.006693421622965943;

function isOutsideMainlandChina({ latitude, longitude }: LatLng) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271;
}

function latitudeOffset(x: number, y: number) {
  let result = -100 + 2 * x + 3 * y + 0.2 * y ** 2 + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  result += ((20 * Math.sin(y * PI) + 40 * Math.sin((y / 3) * PI)) * 2) / 3;
  result += ((160 * Math.sin((y / 12) * PI) + 320 * Math.sin((y * PI) / 30)) * 2) / 3;
  return result;
}

function longitudeOffset(x: number, y: number) {
  let result = 300 + x + 2 * y + 0.1 * x ** 2 + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += ((20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2) / 3;
  result += ((20 * Math.sin(x * PI) + 40 * Math.sin((x / 3) * PI)) * 2) / 3;
  result += ((150 * Math.sin((x / 12) * PI) + 300 * Math.sin((x / 30) * PI)) * 2) / 3;
  return result;
}

/** Approximate WGS-84 to GCJ-02 conversion for offline data verification. */
export function wgs84ToGcj02(point: LatLng): LatLng {
  if (isOutsideMainlandChina(point)) return { ...point };
  const latitudeRadians = (point.latitude / 180) * PI;
  const sinLatitude = Math.sin(latitudeRadians);
  const magic = 1 - ECCENTRICITY_SQUARED * sinLatitude ** 2;
  const squareRootMagic = Math.sqrt(magic);
  const rawLatitudeOffset = latitudeOffset(point.longitude - 105, point.latitude - 35);
  const rawLongitudeOffset = longitudeOffset(point.longitude - 105, point.latitude - 35);
  const deltaLatitude =
    (rawLatitudeOffset * 180) /
    (((KRASOVSKY_SEMI_MAJOR_AXIS_M * (1 - ECCENTRICITY_SQUARED)) /
      (magic * squareRootMagic)) *
      PI);
  const deltaLongitude =
    (rawLongitudeOffset * 180) /
    ((KRASOVSKY_SEMI_MAJOR_AXIS_M / squareRootMagic) * Math.cos(latitudeRadians) * PI);
  return {
    latitude: point.latitude + deltaLatitude,
    longitude: point.longitude + deltaLongitude,
  };
}

/**
 * Iterative public approximation of GCJ-02 to WGS-84. It is intentionally not
 * used for live positioning. Static results must be checked against local map
 * references before being copied into the story configuration.
 */
export function gcj02ToWgs84Approx(point: LatLng, iterations = 12): LatLng {
  if (isOutsideMainlandChina(point)) return { ...point };
  let estimate = { ...point };
  for (let index = 0; index < iterations; index += 1) {
    const projected = wgs84ToGcj02(estimate);
    estimate = {
      latitude: estimate.latitude + point.latitude - projected.latitude,
      longitude: estimate.longitude + point.longitude - projected.longitude,
    };
  }
  return estimate;
}
