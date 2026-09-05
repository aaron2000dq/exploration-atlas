"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { webMercatorPixel } from "@/src/lib/realMap";
import type { Checkpoint, ExplorationZone, LatLng, PositionSample } from "@/src/types";

type Props = {
  zone: ExplorationZone;
  checkpoint: Checkpoint;
  position: PositionSample | null;
  routeProgress: number;
  locationReliable: boolean;
  arrived: boolean;
  completedIds: string[];
};

const VIEW_SIZE = 800;
const TILE_SIZE = 256;
const ZOOM = 17;

export function LocalRealMapCanvas({
  zone,
  checkpoint,
  position,
  routeProgress,
  locationReliable,
  arrived,
  completedIds,
}: Props) {
  const routeRef = useRef<SVGPathElement>(null);
  const [footsteps, setFootsteps] = useState<Array<{ x: number; y: number; angle: number }>>([]);
  const [loadedTiles, setLoadedTiles] = useState<Set<string>>(new Set());
  const [failedTiles, setFailedTiles] = useState<Set<string>>(new Set());

  const map = useMemo(() => {
    const origin = zone.routeGeo[0];
    const center: LatLng = {
      latitude: (origin.latitude + checkpoint.location.latitude) / 2,
      longitude: (origin.longitude + checkpoint.location.longitude) / 2,
    };
    const centerPixel = webMercatorPixel(center, ZOOM);
    const topLeft = {
      x: centerPixel.x - VIEW_SIZE / 2,
      y: centerPixel.y - VIEW_SIZE / 2,
    };
    const project = (point: LatLng) => {
      const pixel = webMercatorPixel(point, ZOOM);
      return { x: pixel.x - topLeft.x, y: pixel.y - topLeft.y };
    };

    const minTileX = Math.floor(topLeft.x / TILE_SIZE);
    const maxTileX = Math.floor((topLeft.x + VIEW_SIZE) / TILE_SIZE);
    const minTileY = Math.floor(topLeft.y / TILE_SIZE);
    const maxTileY = Math.floor((topLeft.y + VIEW_SIZE) / TILE_SIZE);
    const tiles = [];
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
        tiles.push({
          id: `${ZOOM}/${tileX}/${tileY}`,
          url: `https://tile.openstreetmap.org/${ZOOM}/${tileX}/${tileY}.png`,
          x: tileX * TILE_SIZE - topLeft.x,
          y: tileY * TILE_SIZE - topLeft.y,
        });
      }
    }
    const routePoints = zone.routeGeo.map(project);
    const routePath = routePoints
      .map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(" ");
    return {
      tiles,
      project,
      routePath,
      originPoint: project(origin),
      targetPoint: project(checkpoint.location),
    };
  }, [zone, checkpoint.location]);

  useEffect(() => {
    setLoadedTiles(new Set());
    setFailedTiles(new Set());
  }, [zone.id]);

  useEffect(() => {
    const path = routeRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    setFootsteps(
      Array.from({ length: 16 }, (_, index) => {
        const distance = (total * (index + 1)) / 17;
        const before = path.getPointAtLength(Math.max(0, distance - 2));
        const point = path.getPointAtLength(distance);
        const after = path.getPointAtLength(Math.min(total, distance + 2));
        return {
          x: point.x,
          y: point.y,
          angle: (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI + 90,
        };
      }),
    );
  }, [map.routePath]);

  const marker = position ? map.project(position) : map.originPoint;
  const tileReady = loadedTiles.size + failedTiles.size === map.tiles.length;
  const enoughTiles = loadedTiles.size >= Math.ceil(map.tiles.length * 0.6);

  return (
    <div className="map-stage real-map-stage" aria-label="基于真实地图数据的附近彩排地图">
      <svg viewBox="0 0 800 800" preserveAspectRatio="none" role="img">
        <defs>
          <filter id="realMapInk">
            <feColorMatrix
              type="matrix"
              values="0.44 0.38 0.18 0 0
                      0.31 0.28 0.13 0 0
                      0.18 0.16 0.08 0 0
                      0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1.2" exponent=".86" offset=".02" />
              <feFuncG type="gamma" amplitude="1.05" exponent=".9" offset=".01" />
              <feFuncB type="gamma" amplitude=".82" exponent=".92" offset="0" />
            </feComponentTransfer>
          </filter>
          <filter id="realInkGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <pattern id="realHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(13)">
            <path d="M0 0V12" stroke="#3d2718" strokeWidth=".7" opacity=".16" />
          </pattern>
        </defs>

        <g className="real-tile-layer" filter="url(#realMapInk)">
          {map.tiles.map((tile) => (
            <image
              key={tile.id}
              href={tile.url}
              x={tile.x}
              y={tile.y}
              width={TILE_SIZE + 1}
              height={TILE_SIZE + 1}
              onLoad={() => setLoadedTiles((current) => new Set(current).add(tile.id))}
              onError={() => setFailedTiles((current) => new Set(current).add(tile.id))}
            />
          ))}
        </g>
        <rect className="real-map-sepia-wash" width="800" height="800" />
        <rect className="real-map-hatch" width="800" height="800" fill="url(#realHatch)" />

        <path ref={routeRef} d={map.routePath} className="real-walking-route" />
        {footsteps.map((point, index) => {
          const visible = index / 15 <= Math.max(.06, routeProgress + .05);
          return (
            <g
              key={index}
              className={`footstep real-footstep ${visible ? "visible" : ""}`}
              transform={`translate(${point.x} ${point.y}) rotate(${point.angle}) translate(${index % 2 ? 6 : -6} 0)`}
            >
              <ellipse cy="-5" rx="4.2" ry="8.2" />
              <ellipse cy="7" rx="2.8" ry="4.9" />
            </g>
          );
        })}

        <g transform={`translate(${map.originPoint.x} ${map.originPoint.y})`} className="parking-mark real-parking-mark">
          <circle r="28" /><path d="M-8 12V-13h12q11 0 11 9T4 6H-2v6z" />
        </g>
        <g transform={`translate(${map.targetPoint.x} ${map.targetPoint.y})`} className={`checkpoint-mark real-checkpoint-mark ${arrived ? "arrived" : ""}`}>
          <path d="M0-38 32-19 32 20 0 39-32 20-32-19z" />
          <text y="9">{zone.order}</text>
        </g>
        <text x={map.targetPoint.x + 42} y={map.targetPoint.y + 50} className="checkpoint-label">{checkpoint.label}</text>

        <motion.g
          initial={false}
          animate={{ x: marker.x, y: marker.y, opacity: arrived ? 0 : 1 }}
          transition={{ duration: .7, ease: "easeOut" }}
          className={`you-marker ${locationReliable ? "" : "in-fog"}`}
        >
          <circle r="23" className="ink-pool" /><circle r="7" className="ink-core" />
          <path d="M-34 32h68l-8 16h-52z" className="marker-ribbon" /><text y="44">YOU</text>
        </motion.g>

        <g className="map-cartouche" transform="translate(34 34)">
          <path d="M0 0h350l-14 42H0l11-21z" />
          <text x="22" y="18" className="map-title">{zone.title}</text>
          <text x="22" y="34" className="map-subtitle">真实街区数据 · 随机步行彩排</text>
        </g>

        <g className="atlas-compass real-compass" transform="translate(720 94)">
          <circle r="52" /><circle r="42" /><path d="M0-37 13 0 0 37-13 0z" className="compass-needle" />
          <path d="M-37 0H37M0-37V37" /><text y="-58">N</text>
        </g>
        {completedIds.map((id, index) => (
          <g key={id} transform={`translate(${690 + index * 26} 754)`} className="wax-dot">
            <circle r="9" /><path d="m-4 0 3 3 6-7" />
          </g>
        ))}
      </svg>

      {!tileReady && !enoughTiles && (
        <div className="map-illustration-loading" role="status">
          <span className="ink-loader" /><b>正在描摹真实街区…</b>
        </div>
      )}
      {tileReady && loadedTiles.size === 0 && (
        <div className="map-illustration-fallback">真实地图暂时无法载入，请检查网络后重试</div>
      )}
      {!locationReliable && <div className="map-fog map-fog-local" aria-hidden="true" />}
      <a
        className="osm-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >© OpenStreetMap contributors</a>
    </div>
  );
}
