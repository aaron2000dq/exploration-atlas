import type {
  Checkpoint,
  ExplorationZone,
  LatLng,
  MapBounds,
  PositionSample,
  RouteMatch,
} from "@/src/types";

const EARTH_RADIUS_M = 6_371_000;

export function haversineDistance(a: LatLng, b: LatLng) {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Geographic bearing from point A to B, where 0 is north and 90 is east. */
export function bearingDegrees(a: LatLng, b: LatLng) {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function toMeters(point: LatLng, origin: LatLng) {
  const latScale = (Math.PI / 180) * EARTH_RADIUS_M;
  const lngScale = latScale * Math.cos((origin.latitude * Math.PI) / 180);
  return {
    x: (point.longitude - origin.longitude) * lngScale,
    y: (point.latitude - origin.latitude) * latScale,
  };
}

function mercatorLatitude(latitude: number) {
  const radians = (Math.max(-85.0511, Math.min(85.0511, latitude)) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function segmentProjection(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const rawT = lengthSq
    ? ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq
    : 0;
  const t = Math.max(0, Math.min(1, rawT));
  const x = a.x + t * dx;
  const y = a.y + t * dy;
  return { rawT, t, x, y, distance: Math.hypot(point.x - x, point.y - y) };
}

function projectLocationToRegisteredRoute(
  point: LatLng,
  route: LatLng[],
  mapRoutePoints: Array<{ x: number; y: number }>,
) {
  const origin = route[0];
  const live = toMeters(point, origin);
  const routeMeters = route.map((item) => toMeters(item, origin));
  let best:
    | {
        segmentIndex: number;
        t: number;
        rawT: number;
        signedDistanceM: number;
        distanceM: number;
      }
    | undefined;

  for (let index = 0; index < routeMeters.length - 1; index += 1) {
    const start = routeMeters[index];
    const end = routeMeters[index + 1];
    const projection = segmentProjection(live, start, end);
    if (!best || projection.distance < best.distanceM) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy) || 1;
      const signedDistanceM =
        (dx * (live.y - projection.y) - dy * (live.x - projection.x)) / length;
      best = {
        segmentIndex: index,
        t: projection.t,
        rawT: projection.rawT,
        signedDistanceM,
        distanceM: projection.distance,
      };
    }
  }

  if (!best) return mapRoutePoints[0];
  const mapStart = mapRoutePoints[best.segmentIndex];
  const mapEnd = mapRoutePoints[best.segmentIndex + 1];
  const mapDx = mapEnd.x - mapStart.x;
  const mapDy = mapEnd.y - mapStart.y;
  const mapLength = Math.hypot(mapDx, mapDy) || 1;
  const geoStart = routeMeters[best.segmentIndex];
  const geoEnd = routeMeters[best.segmentIndex + 1];
  const geoLength = Math.hypot(geoEnd.x - geoStart.x, geoEnd.y - geoStart.y) || 1;
  // A live fix before the suggested start or beyond the final route anchor is
  // still a real position. Allow the first/last segment to extrapolate instead
  // of clamping every such sample to a route endpoint. The old clamp is what
  // made the distance counter change while the explorer dot stayed frozen.
  let routeT = best.t;
  if (best.segmentIndex === 0 && best.t === 0) {
    routeT = Math.max(-2.5, best.rawT);
  } else if (best.segmentIndex === routeMeters.length - 2 && best.t === 1) {
    routeT = Math.min(3.5, best.rawT);
  }
  const routePoint = {
    x: mapStart.x + mapDx * routeT,
    y: mapStart.y + mapDy * routeT,
  };
  // Preserve cross-track movement as a second dimension. This is intentionally
  // wider than the previous 56 px cap: someone may park on a neighbouring
  // street, and walking there must visibly move the dot rather than pin it.
  const lateralPixels = Math.max(
    -180,
    Math.min(180, best.signedDistanceM * (mapLength / geoLength)),
  );
  const mapLeftNormal = { x: mapDy / mapLength, y: -mapDx / mapLength };
  return {
    x: Math.max(16, Math.min(784, routePoint.x + mapLeftNormal.x * lateralPixels)),
    y: Math.max(16, Math.min(484, routePoint.y + mapLeftNormal.y * lateralPixels)),
  };
}

export function projectLocationToBounds(
  point: LatLng,
  bounds: MapBounds,
  width = 800,
  height = 500,
) {
  const x = ((point.longitude - bounds.west) / (bounds.east - bounds.west)) * width;
  const north = mercatorLatitude(bounds.north);
  const south = mercatorLatitude(bounds.south);
  const y = ((north - mercatorLatitude(point.latitude)) / (north - south)) * height;
  return {
    x: Math.max(10, Math.min(width - 10, x)),
    y: Math.max(10, Math.min(height - 10, y)),
  };
}

/**
 * Maps a live coordinate directly onto the illustrated page. It deliberately
 * never snaps to the route: walking beside the suggested line must still move
 * the explorer dot in two dimensions.
 */
export function projectPositionToMap(
  point: LatLng,
  zone: ExplorationZone,
  checkpoint: Checkpoint,
) {
  if (zone.mapOrientation === "north-up" && zone.mapBounds) {
    return projectLocationToBounds(point, zone.mapBounds);
  }
  if (
    zone.mapRoutePoints &&
    zone.routeGeo.length >= 2 &&
    zone.mapRoutePoints.length === zone.routeGeo.length
  ) {
    return projectLocationToRegisteredRoute(point, zone.routeGeo, zone.mapRoutePoints);
  }
  if (zone.mapBounds) return projectLocationToBounds(point, zone.mapBounds);

  const originGeo = zone.routeGeo[0] ?? zone.center;
  const destinationGeo = checkpoint.location;
  const live = toMeters(point, originGeo);
  const destination = toMeters(destinationGeo, originGeo);
  // Convert north-positive geographic metres into screen coordinates.
  const geoX = destination.x;
  const geoY = -destination.y;
  const liveX = live.x;
  const liveY = -live.y;
  const mapX = checkpoint.mapPoint.x - zone.parkingMapPoint.x;
  const mapY = checkpoint.mapPoint.y - zone.parkingMapPoint.y;
  const denominator = geoX * geoX + geoY * geoY;
  if (!denominator) return zone.parkingMapPoint;
  const real = (mapX * geoX + mapY * geoY) / denominator;
  const imaginary = (mapY * geoX - mapX * geoY) / denominator;
  return {
    x: Math.max(10, Math.min(790, zone.parkingMapPoint.x + real * liveX - imaginary * liveY)),
    y: Math.max(10, Math.min(490, zone.parkingMapPoint.y + imaginary * liveX + real * liveY)),
  };
}

export function smoothPositionSample(
  previous: PositionSample | null,
  next: PositionSample,
): PositionSample {
  if (!previous || next.timestamp <= previous.timestamp) return next;
  const movedM = haversineDistance(previous, next);
  // Geolocation fixes on iPadOS already arrive relatively slowly. Applying a
  // second, heavy low-pass filter here made the marker trail several metres
  // behind every fix. Preserve a little damping only for sub-metre GPS noise;
  // any real walking step is rendered at the newest accepted coordinate.
  const meaningfulMoveM = Math.max(1, Math.min(2, next.accuracy * 0.04));
  const alpha = movedM >= meaningfulMoveM ? 1 : 0.72;
  return {
    latitude: previous.latitude + (next.latitude - previous.latitude) * alpha,
    longitude: previous.longitude + (next.longitude - previous.longitude) * alpha,
    accuracy: next.accuracy,
    timestamp: next.timestamp,
    // Keep the last trustworthy walking course until a new course can be
    // calculated. Falling back to the raw compass on every small GPS step made
    // the arrow spin while the explorer was walking in a straight line.
    heading: Number.isFinite(next.heading) ? next.heading : previous.heading,
  };
}

function destinationPoint(point: LatLng, distanceM: number, headingDegrees: number): LatLng {
  const heading = (headingDegrees * Math.PI) / 180;
  return {
    latitude:
      point.latitude +
      ((distanceM * Math.cos(heading)) / EARTH_RADIUS_M) * (180 / Math.PI),
    longitude:
      point.longitude +
      ((distanceM * Math.sin(heading)) /
        (EARTH_RADIUS_M * Math.cos((point.latitude * Math.PI) / 180))) *
        (180 / Math.PI),
  };
}

/** Convert a geographic course into the illustrated page's local direction. */
export function projectHeadingToMap(
  point: LatLng,
  headingDegrees: number,
  zone: ExplorationZone,
  checkpoint: Checkpoint,
) {
  if (!Number.isFinite(headingDegrees)) return 0;
  // A north-up page shares the compass coordinate system directly: north is
  // screen-up and east is screen-right. No decorative-map rotation is allowed.
  if (zone.mapOrientation === "north-up") {
    return ((headingDegrees % 360) + 360) % 360;
  }
  const start = projectPositionToMap(point, zone, checkpoint);
  const ahead = projectPositionToMap(
    destinationPoint(point, 6, headingDegrees),
    zone,
    checkpoint,
  );
  const dx = ahead.x - start.x;
  const dy = ahead.y - start.y;
  if (Math.hypot(dx, dy) < 0.01) return ((headingDegrees % 360) + 360) % 360;
  return ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
}

/**
 * A coarse sample is useful for telling the explorer why tracking is paused,
 * but it must never move the ink dot. Keep the last reliable coordinate while
 * copying only freshness/accuracy metadata from the rejected reading.
 */
export function holdLastReliablePosition(
  previous: PositionSample | null,
  rejected: PositionSample,
): PositionSample | null {
  if (!previous) return null;
  return {
    ...previous,
    accuracy: rejected.accuracy,
    timestamp: rejected.timestamp,
    heading: Number.isFinite(rejected.heading) ? rejected.heading : previous.heading,
  };
}

export function matchPositionToRoute(
  position: LatLng,
  route: LatLng[],
  checkpoint: LatLng,
): RouteMatch {
  if (route.length < 2) {
    return {
      progress: 0,
      distanceFromRouteM: haversineDistance(position, route[0] ?? checkpoint),
      distanceToCheckpointM: haversineDistance(position, checkpoint),
    };
  }

  const origin = route[0];
  const point = toMeters(position, origin);
  const projected = route.map((item) => toMeters(item, origin));
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < projected.length - 1; i += 1) {
    const length = Math.hypot(
      projected[i + 1].x - projected[i].x,
      projected[i + 1].y - projected[i].y,
    );
    lengths.push(length);
    total += length;
  }

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestAlong = 0;
  let accumulated = 0;
  for (let i = 0; i < projected.length - 1; i += 1) {
    const projection = segmentProjection(point, projected[i], projected[i + 1]);
    if (projection.distance < bestDistance) {
      bestDistance = projection.distance;
      bestAlong = accumulated + projection.t * lengths[i];
    }
    accumulated += lengths[i];
  }

  return {
    progress: total ? Math.max(0, Math.min(1, bestAlong / total)) : 0,
    distanceFromRouteM: bestDistance,
    distanceToCheckpointM: haversineDistance(position, checkpoint),
  };
}

export function medianSample(samples: PositionSample[]): PositionSample | null {
  if (!samples.length) return null;
  const sortedLat = [...samples].sort((a, b) => a.latitude - b.latitude);
  const sortedLng = [...samples].sort((a, b) => a.longitude - b.longitude);
  const sortedAccuracy = [...samples].sort((a, b) => a.accuracy - b.accuracy);
  const middle = Math.floor(samples.length / 2);
  return {
    latitude: sortedLat[middle].latitude,
    longitude: sortedLng[middle].longitude,
    accuracy: sortedAccuracy[middle].accuracy,
    timestamp: Math.max(...samples.map((item) => item.timestamp)),
    heading: [...samples].reverse().find((item) => Number.isFinite(item.heading))?.heading,
  };
}

export function isInsideCheckpoint(
  distanceM: number,
  accuracyM: number,
  radiusM: number,
  maxAccuracyM = 200,
) {
  if (
    !Number.isFinite(distanceM) ||
    !Number.isFinite(accuracyM) ||
    accuracyM < 0 ||
    accuracyM > maxAccuracyM
  ) return false;
  // The checkpoint radius is the story rule. Accuracy may soften the edge a
  // little, but it must never turn a 30 m checkpoint into a broad geofence.
  const accuracyAllowance = Math.min(10, Math.max(0, accuracyM * 0.2));
  return distanceM <= radiusM + accuracyAllowance;
}

export function formatDistance(distanceM: number) {
  if (!Number.isFinite(distanceM)) return "等待定位";
  if (distanceM < 1000) return `${Math.max(0, Math.round(distanceM))} 米`;
  return `${(distanceM / 1000).toFixed(1)} 公里`;
}
