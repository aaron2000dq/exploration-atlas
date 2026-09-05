export type LatLng = {
  latitude: number;
  longitude: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type GiftType =
  | "scent"
  | "motion"
  | "sound"
  | "sparkle"
  | "taste"
  | "love";

export type MatchMode = "pose-scene" | "scene-only";

export type Checkpoint = {
  id: string;
  label: string;
  mysteryTitle?: string;
  mysteryLabel?: string;
  storyBeat?: string;
  giftType: GiftType;
  location: LatLng;
  unlockRadiusM: number;
  referenceImage: string;
  matchMode: MatchMode;
  passScore: number;
  clue: string;
  unlockCopy: string;
  photoPrompt: string;
  mapPoint: { x: number; y: number };
};

export type ExplorationZone = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  mysteryTitle?: string;
  mysterySubtitle?: string;
  parkingLabel: string;
  parkingMapPoint: { x: number; y: number };
  center: LatLng;
  /** Browser geolocation and every runtime checkpoint must use WGS-84. */
  coordinateSystem: "wgs84";
  routeGeo: LatLng[];
  /** Hand-drawn map control points paired one-to-one with routeGeo. */
  mapRoutePoints?: Array<{ x: number; y: number }>;
  svgPath: string;
  maxLocationAccuracyM: number;
  accent: string;
  mapKind: "arcade" | "garden" | "vinyl" | "city";
  /** Formal maps use a fixed geographic north-up projection. */
  mapOrientation?: "north-up" | "illustrated-route";
  mapBounds?: MapBounds;
  illustratedMapAsset?: string;
  checkpoints: Checkpoint[];
};

export type StoryProgress = {
  activeZoneId: string;
  activeCheckpointId: string;
  completedCheckpointIds: string[];
  photoAttempts: Record<string, number>;
  capturedPhotoIds: string[];
  phase: "intro" | "map" | "fog" | "finale";
  zoneStarted: boolean;
  arrivedCheckpointIds: string[];
};

export type PositionSample = LatLng & {
  accuracy: number;
  timestamp: number;
  heading?: number;
};

export type RouteMatch = {
  progress: number;
  distanceFromRouteM: number;
  distanceToCheckpointM: number;
};

export type CapturedPhoto = {
  id: string;
  checkpointId: string;
  dataUrl: string;
  score: number;
  createdAt: number;
};

export type MatchResult = {
  score: number;
  sceneScore: number;
  poseScore: number | null;
  subjectScore: number;
  message: string;
};
