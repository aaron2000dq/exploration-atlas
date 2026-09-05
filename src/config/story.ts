import type { ExplorationZone, StoryProgress } from "@/src/types";

// Formal runtime coordinates are WGS-84, matching browser Geolocation. The
// original GCJ-02 POIs were converted only during data preparation and checked
// against nearby OSM road/building geometry; they are never mixed at runtime.
const motionZone: ExplorationZone = {
    id: "motion-district",
    order: 2,
    title: "Caihe · Motion District",
    subtitle: "庆春东路与采荷街区 · 寻找移动的方式",
    mysteryTitle: "PAST CHAPTER · THE SECOND PASSAGE",
    mysterySubtitle: "成为巫师的第二步 · 正在寻找新的方向",
    parkingLabel: "采荷科普园东侧 · 五安路附近",
    // The formal page is registered to the real scene shown during the field
    // test. The blue water belongs only to 采荷科普园 and ends south of
    // 庆春东路; the suggested walk goes around its dry northern end and never
    // crosses water.
    parkingMapPoint: { x: 598.1, y: 475.7 },
    center: { latitude: 30.2598, longitude: 120.19218 },
    coordinateSystem: "wgs84",
    routeGeo: [
      { latitude: 30.2585314152, longitude: 120.1933381931 },
      { latitude: 30.25957, longitude: 120.19334 },
      { latitude: 30.25981, longitude: 120.19162 },
      { latitude: 30.2597418, longitude: 120.1912823 },
    ],
    mapRoutePoints: [
      { x: 598.1, y: 475.7 },
      { x: 598.4, y: 283.3 },
      { x: 323.2, y: 238.9 },
      { x: 269.2, y: 251.5 },
    ],
    svgPath: "M598.1 475.7 L598.4 283.3 L323.2 238.9 L269.2 251.5",
    maxLocationAccuracyM: 200,
    accent: "#4c5636",
    mapKind: "garden",
    mapOrientation: "north-up",
    mapBounds: {
      north: 30.2611,
      south: 30.2584,
      west: 120.1896,
      east: 120.1946,
    },
    illustratedMapAsset: "/assets/maps/caihe-motion-v4.png",
    checkpoints: [
      {
        id: "liv-motion",
        label: "Liv",
        mysteryTitle: "第二枚未知坐标",
        mysteryLabel: "答案藏在下一段路",
        storyBeat: "找到你要前进的方式。",
        giftType: "motion",
        location: { latitude: 30.2597418, longitude: 120.1912823 },
        unlockRadiusM: 30,
        referenceImage: "/references/motion.svg",
        matchMode: "pose-scene",
        passScore: 55,
        clue:
          "有些礼物会被你带走，有些却会反过来带着你。沿着这一页的脚印，它的咒语是让你的出发更加轻盈。",
        unlockCopy:
          "从这一页开始，新一岁的路不必只靠双脚。第二个出现的魔法，是让通勤也变成自由旅行的动力。",
        photoPrompt: "复刻制图人的显影照片，留下此刻的你。",
        mapPoint: { x: 269.2, y: 251.5 },
      },
    ],
};

const soundZone: ExplorationZone = {
    id: "sound-district",
    order: 1,
    title: "Jingwei · Sound District",
    subtitle: "石桥路与经纬创意园 · 寻找时间的声音",
    mysteryTitle: "PAST CHAPTER · THE FIRST ECHO",
    mysterySubtitle: "成为巫师的第一步 · 被时间保存的一小段",
    parkingLabel: "经纬国际创意产业园停车场 · 石桥路 279 号",
    parkingMapPoint: { x: 128.9, y: 142.6 },
    center: { latitude: 30.32693, longitude: 120.18499 },
    coordinateSystem: "wgs84",
    routeGeo: [
      { latitude: 30.3270953, longitude: 120.1834653 },
      { latitude: 30.32696, longitude: 120.18415 },
      { latitude: 30.32692, longitude: 120.18485 },
      // Field reading captured at the Lingxiang storefront on 2026-08-08.
      { latitude: 30.326913, longitude: 120.18552 },
    ],
    mapRoutePoints: [
      { x: 128.9, y: 142.6 },
      { x: 250.7, y: 170.8 },
      { x: 375.1, y: 179.2 },
      { x: 494.2, y: 180.6 },
    ],
    svgPath: "M128.9 142.6 L250.7 170.8 L375.1 179.2 L494.2 180.6",
    maxLocationAccuracyM: 200,
    accent: "#3f354a",
    mapKind: "vinyl",
    mapOrientation: "north-up",
    mapBounds: {
      north: 30.32778,
      south: 30.32538,
      west: 120.18274,
      east: 120.18724,
    },
    illustratedMapAsset: "/assets/maps/jingwei-sound-v3.jpg",
    checkpoints: [
      {
        id: "vinyl-sound",
        label: "聆翔文化",
        mysteryTitle: "第一枚未知坐标",
        mysteryLabel: "答案绕着时间旋转",
        storyBeat: "记忆的回声藏起故事。",
        giftType: "sound",
        location: { latitude: 30.326913, longitude: 120.18552 },
        unlockRadiusM: 30,
        referenceImage: "/references/sound.svg",
        matchMode: "pose-scene",
        passScore: 55,
        clue:
          "有些时刻没有消失，只是藏进一圈又一圈的纹路。沿墨迹找到它，它的咒语是保留下记忆在某一刻的声音。",
        unlockCopy:
          "过去一岁的回声，会在新一岁的房间里继续旋转。第一个出现的魔法，是唱针落下时有人在你的身边。",
        photoPrompt: "复刻制图人的显影照片，留下此刻的你。",
        mapPoint: { x: 494.2, y: 180.6 },
      },
    ],
};

const mainZone: ExplorationZone = {
    id: "exploration-main",
    order: 3,
    title: "Qianjiang · Grand Atlas",
    subtitle: "来福士、万象城与天御高空 · 三个魔法连续显形",
    mysteryTitle: "PAST CHAPTER · THE GRAND ATLAS",
    mysterySubtitle: "入学前的最后一程 · 还藏着三枚坐标",
    parkingLabel: "杭州来福士中心 · T1 停车区",
    parkingMapPoint: { x: 172.4, y: 134.8 },
    center: { latitude: 30.2526, longitude: 120.2095 },
    coordinateSystem: "wgs84",
    routeGeo: [
      { latitude: 30.2539161, longitude: 120.2027447 },
      { latitude: 30.2546214, longitude: 120.2063537 },
      { latitude: 30.2552323, longitude: 120.2099383 },
      { latitude: 30.253989, longitude: 120.2110951 },
      // RUICH T1 天御 56F. The GCJ-02 POI (30.2484995, 120.2123588)
      // was converted offline and checked against the Raffles City footprint.
      { latitude: 30.2509232654, longitude: 120.2078163859 },
    ],
    mapRoutePoints: [
      { x: 172.4, y: 134.8 },
      { x: 330.2, y: 114.1 },
      { x: 486.9, y: 96.1 },
      { x: 537.5, y: 132.7 },
      { x: 394.2, y: 222.9 },
    ],
    svgPath:
      "M172.4 134.8 L330.2 114.1 L486.9 96.1 L537.5 132.7 L394.2 222.9",
    maxLocationAccuracyM: 200,
    accent: "#274554",
    mapKind: "city",
    mapOrientation: "north-up",
    mapBounds: {
      north: 30.2585,
      south: 30.2415,
      west: 120.1988,
      east: 120.2171,
    },
    illustratedMapAsset: "/assets/maps/qianjiang-grand-north-v4.png",
    checkpoints: [
      {
        id: "aesop-scent",
        label: "Aesop",
        mysteryTitle: "第三枚未知坐标",
        mysteryLabel: "答案尚在风里",
        storyBeat: "留意风吹来的方向。",
        giftType: "scent",
        location: { latitude: 30.2552323, longitude: 120.2099383 },
        unlockRadiusM: 30,
        referenceImage: "/references/scent.svg",
        matchMode: "pose-scene",
        passScore: 55,
        clue:
          "它有神奇的魔法，看不见也摸不着；顺着风吹来的方向，它的咒语是让路过的人都快乐。",
        unlockCopy:
          "过去一岁的最后一阵风，被装进你亲自挑选的香气里。第三个出现的魔法，是低头时就能闻到被爱包围的味道。",
        photoPrompt: "复刻制图人的显影照片，留下此刻的你。",
        mapPoint: { x: 486.9, y: 96.1 },
      },
      {
        id: "dior-sparkle",
        label: "Dior",
        mysteryTitle: "第四枚未知坐标",
        mysteryLabel: "答案正在夜色里发光",
        storyBeat: "收下一束只属于你的光。",
        giftType: "sparkle",
        location: { latitude: 30.253989, longitude: 120.2110951 },
        unlockRadiusM: 30,
        referenceImage: "/references/sparkle.svg",
        matchMode: "pose-scene",
        passScore: 55,
        clue:
          "这一页不留给世界，你只需要留给自己；它的咒语是在你抬起手的时候，留下一点属于你的光芒。",
        unlockCopy:
          "这是入学前最后一夜里，专门留给你的光。第四个魔法，是把自己装扮好看的闪亮时刻。",
        photoPrompt: "复刻制图人的显影照片，留下此刻的你。",
        mapPoint: { x: 537.5, y: 132.7 },
      },
      {
        id: "ruich-taste",
        label: "RUICH",
        mysteryTitle: "第五枚未知坐标",
        mysteryLabel: "答案比城市更接近天空",
        storyBeat: "新世界的大门已为你打开，天才巫师的惊喜坐标均已解锁。",
        giftType: "taste",
        location: { latitude: 30.2509232654, longitude: 120.2078163859 },
        unlockRadiusM: 30,
        referenceImage: "/references/taste.svg",
        matchMode: "scene-only",
        passScore: 55,
        clue:
          "地面上的四页已经写完。最后一枚坐标不藏在脚边，请抬起头，去往今晚比城市更接近天空的地方。",
        unlockCopy:
          "新一岁的无限可能顺利开启，请前往探索属于你的精彩一年。第五个魔法，是在麻瓜世界的高处，总有人等着你一起分享今天的晚餐。",
        photoPrompt: "复刻制图人的显影照片，留下此刻的你。",
        mapPoint: { x: 394.2, y: 222.9 },
      },
      {
        id: "hidden-love",
        label: "Love",
        mysteryTitle: "地图之外的最后一页",
        mysteryLabel: "它从来不需要坐标",
        storyBeat: "读完这封信，过去一岁的故事合上，新一岁的第一章正式开始。",
        giftType: "love",
        location: { latitude: 30.2509232654, longitude: 120.2078163859 },
        unlockRadiusM: 30,
        referenceImage: "/references/love.svg",
        matchMode: "scene-only",
        passScore: 0,
        clue:
          "地图找到了五枚坐标，却还有一个地方从来不需要导航。无论走到哪里，那里一直都在你的身边。",
        unlockCopy:
          "前面的五个魔法，会陪你走进新的一岁；最后这一份不用拿在手里。过去的地图已经无法抵达，但在今天和地图尚未画出的未来里，你依然会被好好地爱着。那么，准备好面对新的一切了吗，拥有魔法的探索者？",
        photoPrompt: "不需要复刻。请打开最后一封信。",
        mapPoint: { x: 394.2, y: 222.9 },
      },
    ],
};

// Driving order: listen first in Jingwei, then choose the bicycle in Caihe,
// then park once at Raffles and finish the three-point walking atlas.
export const zones: ExplorationZone[] = [soundZone, motionZone, mainZone];

export const initialProgress: StoryProgress = {
  activeZoneId: zones[0].id,
  activeCheckpointId: zones[0].checkpoints[0].id,
  completedCheckpointIds: [],
  photoAttempts: {},
  capturedPhotoIds: [],
  phase: "intro",
  zoneStarted: false,
  arrivedCheckpointIds: [],
};

export const fogMessages = [
  "入学第一枚印记已经收好。前方还有一种让出发更轻盈的魔法，等待被找到。",
  "两枚入学印记已经收好。最后三枚坐标，将在同一片夜色里连续显形。",
];

export function findZone(id: string) {
  return zones.find((zone) => zone.id === id) ?? zones[0];
}

export function findCheckpoint(id: string) {
  for (const zone of zones) {
    const checkpoint = zone.checkpoints.find((item) => item.id === id);
    if (checkpoint) return { checkpoint, zone };
  }
  return { checkpoint: zones[0].checkpoints[0], zone: zones[0] };
}
