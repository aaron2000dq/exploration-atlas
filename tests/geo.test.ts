import { describe, expect, it } from "vitest";
import {
  bearingDegrees,
  haversineDistance,
  holdLastReliablePosition,
  isInsideCheckpoint,
  matchPositionToRoute,
  medianSample,
  projectHeadingToMap,
  projectLocationToBounds,
  projectPositionToMap,
  smoothPositionSample,
} from "../src/lib/geo";
import { gcj02ToWgs84Approx, wgs84ToGcj02 } from "../src/lib/coordinateTransform";
import { zones } from "../src/config/story";

const bicycleZone = zones.find((zone) => zone.id === "motion-district")!;
const soundZone = zones.find((zone) => zone.id === "sound-district")!;

describe("geographic matching", () => {
  const route = [
    { latitude: 30.327, longitude: 120.183 },
    { latitude: 30.327, longitude: 120.184 },
    { latitude: 30.327, longitude: 120.185 },
  ];

  it("computes useful meter distances", () => {
    const distance = haversineDistance(route[0], route[1]);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(100);
  });

  it("snaps a nearby position to route progress", () => {
    const match = matchPositionToRoute(
      { latitude: 30.32702, longitude: 120.184 },
      route,
      route[2],
    );
    expect(match.progress).toBeGreaterThan(0.45);
    expect(match.progress).toBeLessThan(0.55);
    expect(match.distanceFromRouteM).toBeLessThan(4);
  });

  it("uses median values to suppress a location spike", () => {
    const sample = medianSample([
      { latitude: 30.32, longitude: 120.18, accuracy: 20, timestamp: 1 },
      { latitude: 31.5, longitude: 121.0, accuracy: 900, timestamp: 2 },
      { latitude: 30.3201, longitude: 120.1801, accuracy: 22, timestamp: 3 },
    ]);
    expect(sample?.latitude).toBeCloseTo(30.3201);
    expect(sample?.accuracy).toBe(22);
  });

  it("keeps the 30 metre geofence tight while allowing a small accuracy edge", () => {
    expect(isInsideCheckpoint(39, 80, 30)).toBe(true);
    expect(isInsideCheckpoint(41, 80, 30)).toBe(false);
    expect(isInsideCheckpoint(0, 500, 30, 200)).toBe(false);
    expect(isInsideCheckpoint(0, Number.NaN, 30, 200)).toBe(false);
  });

  it("derives a geographic walking direction when GPS has no compass heading", () => {
    expect(bearingDegrees(route[0], route[1])).toBeCloseTo(90, 1);
    expect(
      bearingDegrees(route[0], {
        latitude: route[0].latitude + 0.001,
        longitude: route[0].longitude,
      }),
    ).toBeCloseTo(0, 1);
  });

  it("freezes at the last reliable coordinate when a coarse sample arrives", () => {
    const previous = { latitude: 30.327, longitude: 120.183, accuracy: 24, timestamp: 1 };
    const held = holdLastReliablePosition(previous, {
      latitude: 30.28,
      longitude: 120.01,
      accuracy: 500,
      timestamp: 2,
    });
    expect(held?.latitude).toBe(previous.latitude);
    expect(held?.longitude).toBe(previous.longitude);
    expect(held?.accuracy).toBe(500);
    expect(held?.timestamp).toBe(2);
    expect(holdLastReliablePosition(null, { ...previous, accuracy: 500 })).toBeNull();
  });

  it("projects paired WGS route anchors onto the illustrated route", () => {
    const zone = zones[0];
    const checkpoint = zone.checkpoints[0];
    const first = projectPositionToMap(zone.routeGeo[0], zone, checkpoint);
    const second = projectPositionToMap(zone.routeGeo[1], zone, checkpoint);
    expect(first.x).toBeCloseTo(zone.mapRoutePoints![0].x, 0);
    expect(first.y).toBeCloseTo(zone.mapRoutePoints![0].y, 0);
    expect(second.x).toBeCloseTo(zone.mapRoutePoints![1].x, 0);
    expect(second.y).toBeCloseTo(zone.mapRoutePoints![1].y, 0);
  });

  it("uses the same registered-route projection on every public example map", () => {
    for (const zone of zones) {
      expect(zone.coordinateSystem).toBe("wgs84");
      expect(zone.mapRoutePoints).toHaveLength(zone.routeGeo.length);
      const checkpoint = zone.checkpoints[0];
      const start = projectPositionToMap(zone.routeGeo[0], zone, checkpoint);
      expect(start.x).toBeCloseTo(zone.mapRoutePoints![0].x, 0);
      expect(start.y).toBeCloseTo(zone.mapRoutePoints![0].y, 0);
    }
  });

  it("contains a far or wrong-system sample inside the visible map", () => {
    const zone = bicycleZone;
    const point = projectPositionToMap(
      { latitude: 30.257345, longitude: 120.195869 },
      zone,
      zone.checkpoints[0],
    );
    expect(point.x).toBeGreaterThanOrEqual(10);
    expect(point.x).toBeLessThanOrEqual(790);
    expect(point.y).toBeGreaterThanOrEqual(10);
    expect(point.y).toBeLessThanOrEqual(490);
  });

  it("keeps moving before the suggested start instead of pinning to the route endpoint", () => {
    const zone = bicycleZone;
    const checkpoint = zone.checkpoints[0];
    const first = projectPositionToMap(
      { latitude: 30.2594229, longitude: 120.1935934 },
      zone,
      checkpoint,
    );
    const second = projectPositionToMap(
      { latitude: 30.2594729, longitude: 120.1935434 },
      zone,
      checkpoint,
    );
    expect(Math.hypot(second.x - first.x, second.y - first.y)).toBeGreaterThan(5);
  });

  it("registers the field-test scene with the explorer east of the goal", () => {
    const zone = bicycleZone;
    const checkpoint = zone.checkpoints[0];
    const start = projectPositionToMap(zone.routeGeo[0], zone, checkpoint);
    const goal = projectPositionToMap(checkpoint.location, zone, checkpoint);
    expect(start.x).toBeGreaterThan(goal.x);
    expect(goal.x).toBeCloseTo(checkpoint.mapPoint.x, 0);
    expect(goal.y).toBeCloseTo(checkpoint.mapPoint.y, 0);
  });

  it("rotates a geographic course into the illustrated route direction", () => {
    const zone = bicycleZone;
    const checkpoint = zone.checkpoints[0];
    const geographicHeading = bearingDegrees(zone.routeGeo[0], zone.routeGeo[1]);
    const mapped = projectHeadingToMap(zone.routeGeo[0], geographicHeading, zone, checkpoint);
    const first = zone.mapRoutePoints![0];
    const second = zone.mapRoutePoints![1];
    const expected = ((Math.atan2(second.x - first.x, -(second.y - first.y)) * 180) / Math.PI + 360) % 360;
    expect(mapped).toBeCloseTo(expected, 0);
  });

  it("keeps compass bearings literal on every north-up formal map", () => {
    for (const zone of zones) {
      const checkpoint = zone.checkpoints[0];
      expect(projectHeadingToMap(zone.routeGeo[0], 0, zone, checkpoint)).toBe(0);
      expect(projectHeadingToMap(zone.routeGeo[0], 90, zone, checkpoint)).toBe(90);
      expect(projectHeadingToMap(zone.routeGeo[0], 180, zone, checkpoint)).toBe(180);
      expect(projectHeadingToMap(zone.routeGeo[0], 270, zone, checkpoint)).toBe(270);
    }
  });

  it("keeps the first public map aligned to its geographic bounds", () => {
    const zone = zones[0];
    const point = projectLocationToBounds(zone.checkpoints[0].location, zone.mapBounds!);
    expect(point.x).toBeCloseTo(zone.checkpoints[0].mapPoint.x, -1);
    expect(point.y).toBeCloseTo(zone.checkpoints[0].mapPoint.y, -1);
  });

  it("responds immediately to meaningful movement without a five-sample freeze", () => {
    const previous = { latitude: 30.327, longitude: 120.183, accuracy: 35, timestamp: 1, heading: 180 };
    const next = { latitude: 30.3272, longitude: 120.183, accuracy: 35, timestamp: 2 };
    const smoothed = smoothPositionSample(previous, next);
    expect(smoothed.latitude).toBe(next.latitude);
    expect(smoothed.timestamp).toBe(2);
    expect(smoothed.heading).toBe(180);
  });

  it("keeps movement near Lingxiang inside the visible map instead of clamping it", () => {
    const checkpoint = soundZone.checkpoints[0];
    const west = projectPositionToMap(
      { latitude: 30.326913, longitude: 120.18542 },
      soundZone,
      checkpoint,
    );
    const east = projectPositionToMap(
      { latitude: 30.326913, longitude: 120.18552 },
      soundZone,
      checkpoint,
    );
    expect(east.x - west.x).toBeGreaterThan(15);
    expect(east.x).toBeGreaterThan(100);
    expect(east.x).toBeLessThan(700);
  });
});

describe("offline coordinate preparation", () => {
  it("uses the field-captured WGS-84 storefront point for Lingxiang", () => {
    const storefront = { latitude: 30.326913, longitude: 120.18552 };
    expect(haversineDistance(soundZone.checkpoints[0].location, storefront)).toBeLessThan(0.5);
    expect(haversineDistance(soundZone.checkpoints[0].location, {
      latitude: 30.3274763,
      longitude: 120.1840469,
    })).toBeGreaterThan(150);
  });

  it("places the former AMap bicycle destination on the expected local roads", () => {
    const destination = gcj02ToWgs84Approx({ latitude: 30.257345, longitude: 120.195869 });
    const configured = bicycleZone.checkpoints[0].location;
    const shuanglingRoadReference = { latitude: 30.259743, longitude: 120.1910573 };
    const qingchunRoadReference = { latitude: 30.2599455, longitude: 120.1912823 };
    expect(haversineDistance(destination, configured)).toBeLessThan(1);
    expect(haversineDistance(destination, shuanglingRoadReference)).toBeLessThan(25);
    expect(haversineDistance(destination, qingchunRoadReference)).toBeLessThan(25);
    expect(
      haversineDistance(wgs84ToGcj02(configured), {
        latitude: 30.257345,
        longitude: 120.195869,
      }),
    ).toBeLessThan(1);
  });

  it("uses the field-tested start east of Caihe Science Park", () => {
    const convertedStart = gcj02ToWgs84Approx({ latitude: 30.256131, longitude: 120.197919 });
    const configuredStart = bicycleZone.routeGeo[0];
    expect(haversineDistance(convertedStart, configuredStart)).toBeLessThan(1);
    expect(haversineDistance(configuredStart, bicycleZone.checkpoints[0].location)).toBeGreaterThan(150);
    expect(haversineDistance(configuredStart, bicycleZone.checkpoints[0].location)).toBeLessThan(250);
  });

  it("places the RUICH endpoint inside Raffles T1 instead of at City Balcony", () => {
    const ruichFromCtrip = gcj02ToWgs84Approx({
      latitude: 30.2484995,
      longitude: 120.2123588,
    });
    const ruich = zones[2].checkpoints.find((checkpoint) => checkpoint.id === "ruich-taste")!;
    const rafflesFootprintCenter = { latitude: 30.2512685, longitude: 120.20854 };
    const formerCityBalcony = { latitude: 30.2442573, longitude: 120.2122716 };
    expect(haversineDistance(ruichFromCtrip, ruich.location)).toBeLessThan(1);
    expect(haversineDistance(ruich.location, rafflesFootprintCenter)).toBeLessThan(100);
    expect(haversineDistance(ruich.location, formerCityBalcony)).toBeGreaterThan(800);
  });
});
