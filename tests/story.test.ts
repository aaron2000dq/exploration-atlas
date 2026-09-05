import { describe, expect, it } from "vitest";
import { fullTestZones } from "@/src/config/fullTestStory";
import { fogMessages, zones } from "@/src/config/story";
import { haversineDistance, projectPositionToMap } from "@/src/lib/geo";

describe("formal story route", () => {
  it("uses two standalone drives followed by one three-coordinate walking atlas", () => {
    expect(zones).toHaveLength(3);
    expect(fogMessages).toHaveLength(2);
    expect(zones.map((zone) => zone.checkpoints.filter((item) => item.giftType !== "love").length))
      .toEqual([1, 1, 3]);
    expect(zones.flatMap((zone) => zone.checkpoints).map((item) => item.giftType))
      .toEqual(["sound", "motion", "scent", "sparkle", "taste", "love"]);
  });

  it("starts each map at the intended parking area", () => {
    expect(zones.map((zone) => zone.parkingLabel)).toEqual([
      "经纬国际创意产业园停车场 · 石桥路 279 号",
      "采荷科普园东侧 · 五安路附近",
      "杭州来福士中心 · T1 停车区",
    ]);
  });

  it("keeps browser positioning, checkpoints and illustrated anchors registered together", () => {
    for (const zone of zones) {
      expect(zone.coordinateSystem).toBe("wgs84");
      expect(zone.mapOrientation).toBe("north-up");
      expect(zone.mapBounds).toBeDefined();
      expect(zone.mapRoutePoints).toHaveLength(zone.routeGeo.length);
      expect(zone.routeGeo.at(-1)).toEqual(zone.checkpoints.at(-1)?.location);
      for (const checkpoint of zone.checkpoints) {
        const anchorIndex = zone.routeGeo.findIndex(
          (anchor) => haversineDistance(anchor, checkpoint.location) < 0.5,
        );
        expect(anchorIndex).toBeGreaterThanOrEqual(0);
        const projected = projectPositionToMap(checkpoint.location, zone, checkpoint);
        expect(projected.x).toBeCloseTo(checkpoint.mapPoint.x, 0);
        expect(projected.y).toBeCloseTo(checkpoint.mapPoint.y, 0);
        expect(checkpoint.mapPoint).toEqual(zone.mapRoutePoints![anchorIndex]);
      }
    }
  });

  it("keeps Aesop, Dior and RUICH on the same walking route", () => {
    expect(zones[2].checkpoints.slice(0, 3).map((item) => item.label))
      .toEqual(["Aesop", "Dior", "RUICH"]);
    expect(zones[2].mysterySubtitle).toContain("三枚坐标");
  });

  it("ships the three field-shot references in third-map order", () => {
    expect(zones[2].checkpoints.slice(0, 3).map((item) => item.referenceImage))
      .toEqual([
        "/references/scent.svg",
        "/references/sparkle.svg",
        "/references/taste.svg",
      ]);
  });

  it("uses a daylight-tolerant pass score for every formal photo task", () => {
    const photoCheckpoints = zones
      .flatMap((zone) => zone.checkpoints)
      .filter((checkpoint) => checkpoint.giftType !== "love");
    expect(photoCheckpoints.every((checkpoint) => checkpoint.passScore === 55)).toBe(true);
  });

  it("uses the field-shot storefront reference for the vinyl task", () => {
    expect(zones[0].checkpoints[0].referenceImage)
      .toBe("/references/sound.svg");
  });

  it("uses one new illustrated map for each of the three formal walking areas", () => {
    expect(zones.map((zone) => zone.illustratedMapAsset)).toEqual([
      "/assets/maps/jingwei-sound-v3.jpg",
      "/assets/maps/caihe-motion-v4.png",
      "/assets/maps/qianjiang-grand-north-v4.png",
    ]);
  });

  it("keeps the field-tested bicycle pose photo instead of a placeholder", () => {
    const bicycleZone = zones.find((zone) => zone.id === "motion-district");
    expect(bicycleZone?.checkpoints[0].referenceImage).toBe("/references/motion.svg");
  });

  it("locks the two field-tested follow-up maps to their verified WGS-84 endpoints", () => {
    expect(zones[1].id).toBe("motion-district");
    expect(zones[1].checkpoints[0]).toMatchObject({
      id: "liv-motion",
      label: "Liv",
      location: { latitude: 30.2597418, longitude: 120.1912823 },
      unlockRadiusM: 30,
    });
    expect(zones[2].checkpoints.slice(0, 3).map(({ id, location, unlockRadiusM }) => ({
      id,
      location,
      unlockRadiusM,
    }))).toEqual([
      {
        id: "aesop-scent",
        location: { latitude: 30.2552323, longitude: 120.2099383 },
        unlockRadiusM: 30,
      },
      {
        id: "dior-sparkle",
        location: { latitude: 30.253989, longitude: 120.2110951 },
        unlockRadiusM: 30,
      },
      {
        id: "ruich-taste",
        location: { latitude: 30.2509232654, longitude: 120.2078163859 },
        unlockRadiusM: 30,
      },
    ]);
  });

  it("keeps every active goal clear of the collapsed left quest panel", () => {
    for (const zone of zones) {
      for (const checkpoint of zone.checkpoints) {
        expect(checkpoint.mapPoint.x).toBeGreaterThanOrEqual(260);
      }
    }
  });
});

describe("isolated full-test story route", () => {
  it("mirrors the public example without sharing progress identifiers", () => {
    expect(fullTestZones).toHaveLength(3);
    expect(fullTestZones.flatMap((zone) => zone.checkpoints).map((item) => item.giftType))
      .toEqual(["sound", "motion", "scent", "sparkle", "taste", "love"]);
  });
});
