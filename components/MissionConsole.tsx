"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { Feature, MultiPolygon } from "geojson";
import { LAND } from "@/lib/land";
import type { SiteContent } from "@/lib/content";

type Layer = "track" | "cone" | "labels";
type ConsoleCopy = SiteContent["workspace"]["console"];

const R = 6371;
const ALT = 420;
const INC = (51.6 * Math.PI) / 180;
const PERIOD = 92.7;
const DAY = 1440;
const EARTH_ROTATION = 1436;
const STATION = { lat: (40.4 * Math.PI) / 180, lon: (-3.7 * Math.PI) / 180, minElevation: 10 };
const U0 = -0.6;
const LON0 = (-8 * Math.PI) / 180;
const CENTER = { lat: 22, lon: -8 };
const LAND_FEATURE: Feature<MultiPolygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiPolygon",
    coordinates: LAND.map((ring) => [ring]),
  },
};

function wrapLon(lon: number) {
  return ((lon + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
}

function subpoint(minutes: number) {
  const u = U0 + 2 * Math.PI * (minutes / PERIOD);
  const lat = Math.asin(Math.sin(INC) * Math.sin(u));
  const lon = wrapLon(
    Math.atan2(Math.cos(INC) * Math.sin(u), Math.cos(u)) +
      LON0 -
      2 * Math.PI * (minutes / EARTH_ROTATION),
  );
  return { lat, lon };
}

function elevationFor(sat: { lat: number; lon: number }) {
  const dLon = sat.lon - STATION.lon;
  const cosC =
    Math.sin(STATION.lat) * Math.sin(sat.lat) +
    Math.cos(STATION.lat) * Math.cos(sat.lat) * Math.cos(dLon);
  const c = Math.acos(Math.max(-1, Math.min(1, cosC)));
  return (
    (Math.atan2(Math.cos(c) - R / (R + ALT), Math.sin(c)) * 180) / Math.PI
  );
}

type PassWindow = { start: number; end: number; max: number };

function findWindows(): PassWindow[] {
  const windows: PassWindow[] = [];
  let open: { start: number; max: number } | null = null;
  for (let minute = 0; minute < DAY; minute += 1) {
    const elevation = elevationFor(subpoint(minute));
    if (elevation >= STATION.minElevation) {
      if (!open) open = { start: minute, max: elevation };
      else open.max = Math.max(open.max, elevation);
    } else if (open) {
      windows.push({ start: open.start, end: minute - 1, max: open.max });
      open = null;
    }
  }
  if (open) windows.push({ start: open.start, end: DAY - 1, max: open.max });
  return windows;
}

const WINDOWS = findWindows();

function distanceFor(sat: { lat: number; lon: number }) {
  const dLon = sat.lon - STATION.lon;
  const cosC =
    Math.sin(STATION.lat) * Math.sin(sat.lat) +
    Math.cos(STATION.lat) * Math.cos(sat.lat) * Math.cos(dLon);
  const c = Math.acos(Math.max(-1, Math.min(1, cosC)));
  return Math.sqrt(R * R + (R + ALT) * (R + ALT) - 2 * R * (R + ALT) * Math.cos(c));
}

function destination(lat: number, lon: number, bearing: number, angular: number) {
  const lat2 = Math.asin(
    Math.sin(lat) * Math.cos(angular) +
      Math.cos(lat) * Math.sin(angular) * Math.cos(bearing),
  );
  const lon2 =
    lon +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
      Math.cos(angular) - Math.sin(lat) * Math.sin(lat2),
    );
  return [wrapLon(lon2), lat2] as [number, number];
}

const FOOTPRINT = Array.from({ length: 72 }, (_, index) =>
  destination(STATION.lat, STATION.lon, (index / 72) * Math.PI * 2, 0.17),
);
FOOTPRINT.push(FOOTPRINT[0]);

function unwrapTrack(minutes: number) {
  const points: [number, number][] = [];
  let previous: number | null = null;
  for (let offset = -PERIOD / 2; offset <= PERIOD / 2; offset += 1) {
    const sat = subpoint(minutes + offset);
    let lon = (sat.lon * 180) / Math.PI;
    if (previous !== null) {
      while (lon - previous > 180) lon -= 360;
      while (lon - previous < -180) lon += 360;
    }
    previous = lon;
    points.push([lon, (sat.lat * 180) / Math.PI]);
  }
  return points;
}

function formatMinutes(minutes: number, seconds = false) {
  const normalized = ((minutes % DAY) + DAY) % DAY;
  const hour = Math.floor(normalized / 60);
  const minute = Math.floor(normalized % 60);
  if (!seconds) return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const second = Math.floor((normalized % 1) * 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

function makeStars() {
  let seed = 0x53544b;
  const random = () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: 130 }, () => ({
    x: random(),
    y: random(),
    r: 0.35 + random() * 0.8,
    a: 0.15 + random() * 0.45,
  }));
}
const STARS = makeStars();

export function MissionConsole({ copy }: { copy: ConsoleCopy }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firstStart = WINDOWS[0]?.start ?? 0;
  const [time, setTime] = useState(() => Math.max(0, firstStart - 8));
  const [playing, setPlaying] = useState(false);
  const [layers, setLayers] = useState<Record<Layer, boolean>>({
    track: true,
    cone: true,
    labels: true,
  });

  const sat = useMemo(() => subpoint(time), [time]);
  const elevation = useMemo(() => elevationFor(sat), [sat]);
  const distance = useMemo(() => distanceFor(sat), [sat]);
  const inPass = elevation >= STATION.minElevation;
  const activeWindow = WINDOWS.find((window) => time >= window.start && time <= window.end);
  const nextWindow =
    WINDOWS.find((window) => window.start > time) ?? WINDOWS[0];
  const nextIsTomorrow = Boolean(nextWindow && nextWindow.start <= time);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setTime((current) => (current + delta * 12) % DAY);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    function draw() {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const background = context.createLinearGradient(0, 0, 0, height);
      background.addColorStop(0, "#060a10");
      background.addColorStop(1, "#04070b");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      for (const star of STARS) {
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(205,224,244,${star.a})`;
        context.fill();
      }

      const cx = width * 0.5;
      const cy = height * 0.49;
      const radius = Math.min(width * 0.405, height * 0.445);
      const projection = geoOrthographic()
        .translate([cx, cy])
        .scale(radius)
        .rotate([-CENTER.lon, -CENTER.lat])
        .clipAngle(90);
      const path = geoPath(projection, context);
      const stationPoint = projection([
        (STATION.lon * 180) / Math.PI,
        (STATION.lat * 180) / Math.PI,
      ]);
      const satellitePoint = projection([
        (sat.lon * 180) / Math.PI,
        (sat.lat * 180) / Math.PI,
      ]);

      context.save();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.shadowColor = "rgba(45,129,255,0.48)";
      context.shadowBlur = 38;
      context.fillStyle = "#071421";
      context.fill();
      context.shadowBlur = 0;
      context.clip();

      const ocean = context.createRadialGradient(
        cx - radius * 0.38,
        cy - radius * 0.45,
        radius * 0.08,
        cx,
        cy,
        radius * 1.1,
      );
      ocean.addColorStop(0, "#0f2b44");
      ocean.addColorStop(0.6, "#0a1e31");
      ocean.addColorStop(1, "#06121f");
      context.fillStyle = ocean;
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      context.beginPath();
      path(LAND_FEATURE);
      context.fillStyle = "#1b4b6e";
      context.fill();
      context.strokeStyle = "#4f89ad";
      context.lineWidth = 0.55;
      context.stroke();

      context.beginPath();
      path(geoGraticule10());
      context.strokeStyle = "rgba(113,175,220,0.28)";
      context.lineWidth = 0.55;
      context.stroke();

      if (layers.cone && stationPoint) {
        context.beginPath();
        path({ type: "Polygon", coordinates: [FOOTPRINT] });
        context.fillStyle = "rgba(45,129,255,0.13)";
        context.fill();
        context.strokeStyle = "rgba(90,162,255,0.62)";
        context.lineWidth = 0.8;
        context.setLineDash([3, 4]);
        context.stroke();
        context.setLineDash([]);
      }

      if (layers.track) {
        context.beginPath();
        path({ type: "LineString", coordinates: unwrapTrack(time) });
        context.strokeStyle = "#e0533f";
        context.lineWidth = 1.4;
        context.stroke();
      }

      const shade = context.createRadialGradient(
        cx - radius * 0.42,
        cy - radius * 0.5,
        radius * 0.05,
        cx,
        cy,
        radius * 1.04,
      );
      shade.addColorStop(0, "rgba(214,238,255,0.1)");
      shade.addColorStop(0.5, "rgba(0,0,0,0)");
      shade.addColorStop(1, "rgba(0,0,0,0.46)");
      context.fillStyle = shade;
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      context.restore();

      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.strokeStyle = "rgba(122,174,224,0.34)";
      context.lineWidth = 0.8;
      context.stroke();

      if (stationPoint) {
        const pulse = 5 + ((time * 1.9) % 9);
        context.beginPath();
        context.arc(stationPoint[0], stationPoint[1], pulse, 0, Math.PI * 2);
        context.strokeStyle = "rgba(45,129,255,0.34)";
        context.lineWidth = 1;
        context.stroke();
        context.beginPath();
        context.arc(stationPoint[0], stationPoint[1], 3.2, 0, Math.PI * 2);
        context.fillStyle = "#56a2ff";
        context.fill();
        context.strokeStyle = "#d8ecff";
        context.lineWidth = 1;
        context.stroke();

        if (satellitePoint && inPass) {
          context.beginPath();
          context.setLineDash([3, 5]);
          context.moveTo(stationPoint[0], stationPoint[1]);
          context.lineTo(satellitePoint[0], satellitePoint[1]);
          context.strokeStyle = "rgba(224,83,63,0.62)";
          context.lineWidth = 1;
          context.stroke();
          context.setLineDash([]);
        }

        if (layers.labels) {
          context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
          context.fillStyle = "#b6c9dc";
          context.fillText(copy.station, stationPoint[0] + 8, stationPoint[1] - 8);
        }
      }

      if (satellitePoint) {
        context.beginPath();
        context.arc(satellitePoint[0], satellitePoint[1], 8, 0, Math.PI * 2);
        context.fillStyle = "rgba(224,83,63,0.18)";
        context.fill();
        context.beginPath();
        context.arc(satellitePoint[0], satellitePoint[1], 3.4, 0, Math.PI * 2);
        context.fillStyle = "#ff7a64";
        context.fill();
        context.strokeStyle = "#ffe2da";
        context.lineWidth = 1;
        context.stroke();

        if (layers.labels) {
          context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
          context.fillStyle = "#ffd9d2";
          context.fillText(copy.satellite, satellitePoint[0] + 8, satellitePoint[1] - 8);
        }
      }

      context.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.fillStyle = "rgba(145,176,205,0.7)";
      context.fillText("N", cx - 3, cy - radius + 14);
    }

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [time, layers, sat, inPass, copy]);

  const timelineStyle = { "--value": `${(time / (DAY - 1)) * 100}%` } as CSSProperties;

  return (
    <div className="console" role="group" aria-label="STKCraft illustrative workspace">
      <div className="console__bar">
        <span className="console__brand">
          STKCRAFT <span>/ {copy.windowTitle.split(" / ").slice(1).join(" / ")}</span>
        </span>
        <span className="console__tag">{copy.tag}</span>
        <span className="console__tabs">
          <b>{copy.scenarioTab}</b>
          <span>{copy.commandTab}</span>
        </span>
      </div>

      <div className="console__body">
        <aside className="console__left">
          <p className="console__label">{copy.scenario}</p>
          <ul className="tree">
            <li className="is-active">
              <span className="dot dot--sat" />
              <span>{copy.satellite}<small>{copy.satelliteMeta}</small></span>
            </li>
            <li>
              <span className="dot dot--station" />
              <span>{copy.station}<small>{copy.stationMeta}</small></span>
            </li>
            <li>
              <span className="dot dot--target" />
              <span>{copy.target}<small>{copy.targetMeta}</small></span>
            </li>
          </ul>

          <p className="console__label">{copy.layers}</p>
          <div className="layer-list">
            {(["track", "cone", "labels"] as const).map((layer) => (
              <button
                className="layer"
                key={layer}
                type="button"
                aria-pressed={layers[layer]}
                onClick={() => setLayers((current) => ({ ...current, [layer]: !current[layer] }))}
              >
                <span>{layer === "track" ? copy.groundTrack : layer === "cone" ? copy.accessCone : copy.labels}</span>
                <i aria-hidden="true" />
              </button>
            ))}
          </div>
        </aside>

        <div className="console__stage">
          <canvas
            ref={canvasRef}
            className="console__canvas"
            role="img"
            aria-label={copy.stageLabel}
          />
          <div className="console__hud">
            <span className="mono">UTC <b>{formatMinutes(time, true)}</b></span>
            <span className="mono">{copy.illustrative}</span>
          </div>
          <div className="console__legend">
            <span><i className="key key--orbit" />{copy.orbit}</span>
            <span><i className="key key--station" />{copy.stationKey}</span>
            <span><i className="key key--pass" />{copy.accessKey}</span>
          </div>
        </div>

        <aside className="console__right">
          <p className="console__label">{copy.accessWindows}</p>
          <ol className="windows">
            {WINDOWS.map((window, index) => (
              <li key={`${window.start}-${window.end}`}>
                <button
                  type="button"
                  className={activeWindow === window ? "is-active" : undefined}
                  onClick={() => {
                    setPlaying(false);
                    setTime(window.start);
                  }}
                >
                  <span className="mono">{copy.windowLabel} {String(index + 1).padStart(2, "0")}</span>
                  <b>{formatMinutes(window.start)}–{formatMinutes(window.end)}</b>
                  <span className="mono">{Math.round(window.end - window.start + 1)} {copy.duration}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="console__stat">
            <span className="mono">{copy.status}</span>
            <strong className={inPass ? "is-pass" : undefined}>{inPass ? copy.inPass : copy.belowHorizon}</strong>
          </div>
          <div className="console__stat">
            <span className="mono">{copy.elevation}</span>
            <strong>{elevation.toFixed(1)}°</strong>
          </div>
          <div className="console__stat">
            <span className="mono">{copy.range}</span>
            <strong>{Math.round(distance).toLocaleString("en-US")} km</strong>
          </div>
          <div className="console__next">
            <span className="mono">{copy.nextPass}</span>
            <strong>
              {nextWindow
                ? `${formatMinutes(nextWindow.start)}–${formatMinutes(nextWindow.end)}${nextIsTomorrow ? " +1d" : ""}`
                : "—"}
            </strong>
          </div>
        </aside>
      </div>

      <div className="console__timeline">
        <button
          className="play"
          type="button"
          aria-label={playing ? copy.pause : copy.play}
          aria-pressed={playing}
          onClick={() => setPlaying((value) => !value)}
        >
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
        </button>
        <span className="mono console__clock">{formatMinutes(time, true)}</span>
        <div className="scrub">
          <input
            id="timeline"
            type="range"
            min="0"
            max={DAY - 1}
            step="1"
            value={Math.round(time)}
            onChange={(event) => {
              setPlaying(false);
              setTime(Number(event.target.value));
            }}
            aria-label={copy.timeLabel}
            aria-valuetext={`${formatMinutes(time, true)} UTC`}
            style={timelineStyle}
          />
          <div className="scrub__ticks" aria-hidden="true">
            {WINDOWS.map((window) => (
              <span
                key={`tick-${window.start}`}
                style={{
                  left: `${(window.start / DAY) * 100}%`,
                  width: `${Math.max(0.4, ((window.end - window.start) / DAY) * 100)}%`,
                }}
              />
            ))}
          </div>
        </div>
        <span className="mono">{copy.day}</span>
      </div>
    </div>
  );
}
