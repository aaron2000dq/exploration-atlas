import { haversineDistance } from "./geo";
import type { LatLng } from "@/src/types";

const EARTH_RADIUS_M = 6_371_000;

type OsrmNearestResponse = {
  code: string;
  waypoints?: Array<{
    distance: number;
    location: [number, number];
    name: string;
  }>;
};

type ValhallaRouteResponse = {
  trip?: {
    legs?: Array<{ shape?: string }>;
  };
};

export type RealNearbyDestination = {
  location: LatLng;
  roadName: string;
  routeGeo: LatLng[];
  distanceFromOriginM: number;
};

function destinationPoint(origin: LatLng, distanceM: number, bearingDeg: number): LatLng {
  const bearing = (bearingDeg * Math.PI) / 180;
  return {
    latitude:
      origin.latitude +
      ((distanceM * Math.cos(bearing)) / EARTH_RADIUS_M) * (180 / Math.PI),
    longitude:
      origin.longitude +
      ((distanceM * Math.sin(bearing)) /
        (EARTH_RADIUS_M * Math.cos((origin.latitude * Math.PI) / 180))) *
        (180 / Math.PI),
  };
}

function decodePolyline6(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: latitude / 1e6, longitude: longitude / 1e6 });
  }
  return points;
}

async function snapToRoad(point: LatLng) {
  const url =
    `https://router.project-osrm.org/nearest/v1/driving/${point.longitude},${point.latitude}` +
    "?number=1";
  const response = await fetch(url);
  if (!response.ok) throw new Error("道路吸附服务暂不可用");
  const data = (await response.json()) as OsrmNearestResponse;
  const waypoint = data.waypoints?.[0];
  if (data.code !== "Ok" || !waypoint) throw new Error("附近没有可用道路");
  return {
    location: {
      latitude: waypoint.location[1],
      longitude: waypoint.location[0],
    },
    roadName: waypoint.name.trim(),
    snapDistanceM: waypoint.distance,
  };
}

async function pedestrianRoute(start: LatLng, end: LatLng): Promise<LatLng[]> {
  const request = {
    locations: [
      { lat: start.latitude, lon: start.longitude },
      { lat: end.latitude, lon: end.longitude },
    ],
    costing: "pedestrian",
    units: "kilometers",
  };
  const url = new URL("https://valhalla1.openstreetmap.de/route");
  url.searchParams.set("json", JSON.stringify(request));
  const response = await fetch(url);
  if (!response.ok) throw new Error("步行路线服务暂不可用");
  const data = (await response.json()) as ValhallaRouteResponse;
  const shape = data.trip?.legs?.[0]?.shape;
  const decoded = shape ? decodePolyline6(shape) : [];
  return decoded.length >= 2 ? decoded : [start, end];
}

export async function generateRealNearbyDestinations(
  origin: LatLng,
  count = 4,
): Promise<RealNearbyDestination[]> {
  const baseBearing = Math.random() * 360;
  const rawCandidates = Array.from({ length: 16 }, (_, index) => {
    const ring = index % 4;
    const distance = 140 + ring * 82 + Math.random() * 42;
    const bearing = (baseBearing + index * 53 + Math.random() * 18) % 360;
    return destinationPoint(origin, distance, bearing);
  });

  const snapped = (
    await Promise.all(
      rawCandidates.map((candidate) =>
        snapToRoad(candidate).catch(() => null),
      ),
    )
  ).filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

  const unique: typeof snapped = [];
  for (const candidate of snapped) {
    const distance = haversineDistance(origin, candidate.location);
    if (distance < 90 || distance > 520 || candidate.snapDistanceM > 220) continue;
    if (unique.some((item) => haversineDistance(item.location, candidate.location) < 75)) continue;
    unique.push(candidate);
    if (unique.length === count) break;
  }

  if (unique.length < count) {
    throw new Error("附近真实道路点不足，请稍后重新生成");
  }

  const destinations: RealNearbyDestination[] = [];
  let previous = origin;
  for (const candidate of unique) {
    const routeGeo = await pedestrianRoute(previous, candidate.location).catch(() => [
      previous,
      candidate.location,
    ]);
    destinations.push({
      location: candidate.location,
      roadName: candidate.roadName || "无名道路",
      routeGeo,
      distanceFromOriginM: haversineDistance(origin, candidate.location),
    });
    previous = candidate.location;
  }
  return destinations;
}

export function webMercatorPixel(point: LatLng, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const latitude = Math.max(-85.0511, Math.min(85.0511, point.latitude));
  return {
    x: ((point.longitude + 180) / 360) * scale,
    y:
      ((1 -
        Math.asinh(Math.tan((latitude * Math.PI) / 180)) / Math.PI) /
        2) *
      scale,
  };
}
