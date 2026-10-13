// Shared pieces for every SVG: palette, embedded fonts, the plate frame and keyframe helpers.

import { readFileSync } from "node:fs";

export interface Theme {
  name: "dark" | "light";
  bg: string;
  fg: string;
  muted: string;
  line: string;
  accent: string;
}

// Same tokens as the portfolio's global.css. Vermilion is the one thing that matters.
export const THEMES: Theme[] = [
  { name: "dark", bg: "#0b0b0a", fg: "#ecebe6", muted: "#8f8c85", line: "#2a2925", accent: "#ff5b2e" },
  { name: "light", bg: "#ecebe6", fg: "#0d0d0c", muted: "#5c5a54", line: "#cbc8c0", accent: "#c23a0c" },
];

const font = (file: string) => readFileSync(new URL(`fonts/${file}`, import.meta.url)).toString("base64");
const MONO = font("mono-subset.woff2"); // Fragment Mono, Latin only
const SANS = font("sans-subset.woff2"); // Mona Sans at weight 600, Latin only

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const r1 = (n: number) => Math.round(n * 10) / 10;

// Seeded so every build draws the same picture.
export function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function keyframes(name: string, stops: [number, string][]): string {
  return `@keyframes ${name}{${stops.map(([p, d]) => `${r1(p)}%{${d}}`).join("")}}`;
}

interface Doc {
  w: number;
  h: number;
  theme: Theme;
  title: string;
  css: string;
  body: string;
}

// Under reduced motion every animation stops, so each element's base style is the finished frame.
export function svg({ w, h, theme: t, title, css, body }: Doc): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t">
<title id="t">${esc(title)}</title>
<style>
@font-face{font-family:M;src:url(data:font/woff2;base64,${MONO}) format("woff2")}
@font-face{font-family:S;src:url(data:font/woff2;base64,${SANS}) format("woff2")}
:root{--bg:${t.bg};--fg:${t.fg};--muted:${t.muted};--line:${t.line};--accent:${t.accent}}
text{font-family:M,ui-monospace,Menlo,monospace;font-size:14px;fill:var(--muted)}
.v{font-family:S,system-ui,sans-serif;font-size:30px;font-weight:600;fill:var(--fg)}
.s{font-size:12.5px}.f{fill:var(--fg)}.a{fill:var(--accent)}.m{text-anchor:middle}.e{text-anchor:end}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect width="${w}" height="${h}" rx="16" fill="${t.bg}"/>
${body}
</svg>
`;
}

export const PLATE = { w: 640, h: 420, left: 28, right: 612 };

interface Plate {
  theme: Theme;
  title: string;
  label: string;
  metrics: [string, string][];
  css: string;
  body: string;
}

// A project figure: a one-line label, the motion graphic, a hairline, then the real numbers.
export function plate({ theme, title, label, metrics, css, body }: Plate): string {
  const { w, h, left, right } = PLATE;
  const readout = metrics
    .map(
      ([v, l], i) =>
        `<text class="v" x="${left + i * 200}" y="362">${esc(v)}</text><text class="s" x="${left + i * 200}" y="388">${esc(l)}</text>`,
    )
    .join("");
  return svg({
    w,
    h,
    theme,
    title,
    css,
    body: `<text x="${left}" y="44">${esc(label)}</text>
${body}
<path d="M${left} 318H${right}" stroke="var(--line)"/>
${readout}`,
  });
}
