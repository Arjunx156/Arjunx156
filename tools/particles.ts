// The particle word: 640 dots that reflow through nine scripts, swirling and flaring vermilion
// mid-flight, the way the portfolio's hero does on the GPU. Pure CSS, one shared keyframe set;
// each dot carries its nine targets as custom properties.

import { esc, keyframes, r1, random, svg, type Theme } from "./kit.ts";

export interface Script {
  lang: string;
  word: string;
  hello: string;
  name: [number, number, number][];
  greet: [number, number, number][];
}

const SAMPLE_W = 1200;
const SAMPLE_H = 420;
const PERIOD = 27; // seconds for all nine scripts
const HOLD = 0.6; // share of each script's slot spent standing still
const HOT_SHARE = 0.09; // dots that swing wide and flare

interface Options {
  scripts: Script[];
  key: "name" | "greet";
  theme: Theme;
  w: number;
  h: number;
  scale: number;
  cy: number;
  left: string; // fg part of the caption
  leftMuted: string;
  title: string;
  seed: number;
}

// Matching the i-th leftmost point across scripts keeps each morph a reflow, not a scramble.
function byX(points: [number, number, number][]): [number, number, number][] {
  const edge = points.filter((p) => p[2] === 1).sort((a, b) => a[0] - b[0]);
  const fill = points.filter((p) => p[2] === 0).sort((a, b) => a[0] - b[0]);
  return [...edge, ...fill];
}

function motionCss(n: number): string {
  const slot = 100 / n;
  const at = (k: number) => `transform:translate(calc(var(--x${k % n})*1px),calc(var(--y${k % n})*1px))`;
  const ease = "animation-timing-function:cubic-bezier(.65,0,.25,1)";
  const move: [number, string][] = [];
  const swirl: [number, string][] = [];
  const flare: [number, string][] = [];
  for (let k = 0; k < n; k++) {
    const start = k * slot;
    const leave = start + HOLD * slot;
    const mid = (leave + start + slot) / 2;
    move.push([start, `${at(k)};animation-timing-function:linear`], [leave, `${at(k)};${ease}`]);
    swirl.push(
      [start, "transform:none"],
      [leave, `transform:none;${ease}`],
      [mid, `transform:translate(calc(var(--sx)*1px),calc(var(--sy)*1px));${ease}`],
    );
    flare.push([leave, "fill:var(--fg)"], [mid, "fill:var(--accent)"], [start + slot, "fill:var(--fg)"]);
  }
  move.push([100, at(0)]);
  swirl.push([100, "transform:none"]);
  return [
    keyframes("move", move),
    keyframes("swirl", swirl),
    keyframes("flare", [[0, "fill:var(--fg)"], ...flare]),
    keyframes("cap", [
      [0, "opacity:1"],
      [slot - 0.6, "opacity:1"],
      [slot, "opacity:0"],
      [100 - 0.6, "opacity:0"],
      [100, "opacity:1"],
    ]),
    `.p{transform:translate(calc(var(--x0)*1px),calc(var(--y0)*1px));animation:move ${PERIOD}s infinite;animation-delay:var(--d)}`,
    `.p circle{fill:var(--fg);animation:swirl ${PERIOD}s infinite;animation-delay:var(--d)}`,
    `.p .h{animation:swirl ${PERIOD}s infinite,flare ${PERIOD}s infinite;animation-delay:var(--d)}`,
    `.c{opacity:0;animation:cap ${PERIOD}s infinite linear}.c0{opacity:1}`,
  ].join("\n");
}

export function particleWord(o: Options): string {
  const n = o.scripts.length;
  const sets = o.scripts.map((s) => byX(s[o.key]));
  const cx = o.w / 2;
  const map = (x: number, y: number) =>
    [cx + (x - SAMPLE_W / 2) * o.scale, o.cy + (y - SAMPLE_H / 2) * o.scale] as const;
  const rand = random(o.seed);
  const count = sets[0]?.length ?? 0;

  const dots: string[] = [];
  for (let i = 0; i < count; i++) {
    const vars: string[] = [];
    sets.forEach((set, k) => {
      const p = set[i] ?? [0, 0, 0];
      const [x, y] = map(p[0], p[1]);
      vars.push(`--x${k}:${Math.round(x)};--y${k}:${Math.round(y)}`);
    });
    // Swirl tangent to the word's centre, so mid-flight the cloud turns like a current.
    const [x0, y0] = map(sets[0]?.[i]?.[0] ?? 0, sets[0]?.[i]?.[1] ?? 0);
    const dx = x0 - cx;
    const dy = y0 - o.cy;
    const len = Math.hypot(dx, dy) || 1;
    const hot = rand() < HOT_SHARE;
    const mag = hot ? 70 + rand() * 90 : 12 + rand() * 44;
    const sx = (-dy / len) * mag + (rand() - 0.5) * 24;
    const sy = (dx / len) * mag * 0.6 + (rand() - 0.5) * 24;
    vars.push(`--sx:${Math.round(sx)};--sy:${Math.round(sy)};--d:${r1(-rand() * 0.35)}s`);
    const edge = (sets[0]?.[i]?.[2] ?? 0) === 1;
    const r = edge ? 1.8 + rand() * 0.6 : 1.2 + rand() * 1.8;
    const op = edge ? 1 : r1(0.3 + rand() * 0.45);
    dots.push(
      `<g class="p" style="${vars.join(";")}"><circle r="${r1(r)}"${op < 1 ? ` opacity="${op}"` : ""}${hot ? ' class="h"' : ""}/></g>`,
    );
  }

  // Captions change halfway through each morph, when the cloud is least readable.
  const slot = PERIOD / n;
  const shift = ((1 - HOLD) * slot) / 2;
  const captions = o.scripts
    .map((s, k) => {
      const local = (((shift - k * slot) % PERIOD) + PERIOD) % PERIOD;
      return `<text class="c c${k} e" x="${o.w - 32}" y="${o.h - 32}" style="animation-delay:${r1(-local)}s">${esc(s.lang)}</text>`;
    })
    .join("");

  return svg({
    w: o.w,
    h: o.h,
    theme: o.theme,
    title: o.title,
    css: motionCss(n),
    body: `<g>${dots.join("")}</g>
<text x="32" y="${o.h - 32}"><tspan class="f">${esc(o.left)}</tspan>${esc(o.leftMuted)}</text>
${captions}`,
  });
}
