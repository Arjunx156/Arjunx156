// Every film on the profile: what the particles become, how long one loop lasts, and how it is framed.

export const SHAPE = { glyph: 0, wave: 1, orb: 2, terrain: 3, knot: 4, galaxy: 5, dust: 6 } as const;

// A word film's rhythm, per script: hold, dissolve into a spoken waveform, re-form as the next script.
export interface Rhythm {
  hold: number;
  toWave: number;
  wave: number;
  toGlyph: number;
}

export interface Film {
  name: string;
  width: number;
  height: number;
  display: number; // CSS width it is shown at on GitHub, so dots keep their on-screen size
  fps: number;
  grid: number; // particles = grid * grid
  exposure: number; // light per particle, against how densely this frame packs them
  loop: number; // seconds; every clock in the shaders turns a whole number of times per loop
  shape: number;
  words?: { cycle: "name" | "hello"; scripts: number[]; rhythm: Rhythm; burst: number };
  fill: number; // share of the frame width (words) or height (shapes) the subject spans
  anchor: [number, number];
  spring: number;
  drag: number;
  flow: number;
  spin: number; // radians per second, before snapping to the loop
  trail: number;
  intensity: number;
  sway: [number, number]; // camera yaw and pitch amplitude, one slow orbit per loop
  feather: [number, number]; // edge fade, as a share of width and height
  still: number; // seconds into the loop for the reduced-motion frame
}

const SPEAK: Rhythm = { hold: 2.4, toWave: 0.95, wave: 0.45, toGlyph: 1.2 };
export const beat = (r: Rhythm) => r.hold + r.toWave + r.wave + r.toGlyph;

const word = {
  still: 1.6,
  grid: 144,
  exposure: 0.8,
  shape: SHAPE.glyph,
  spring: 20,
  drag: 6.5,
  flow: 0.3,
  spin: 0,
  trail: 0.78,
  intensity: 1,
};
const solid = {
  still: 0,
  grid: 128,
  exposure: 0.9,
  spring: 9,
  drag: 4.5,
  flow: 0.35,
  trail: 0.55,
  anchor: [0, 0] as [number, number],
};

export const FILMS: Film[] = [
  {
    ...word,
    name: "hero",
    width: 1280,
    height: 540,
    display: 840,
    fps: 24,
    loop: 4 * beat(SPEAK),
    words: { cycle: "name", scripts: [0, 1, 2, 3], rhythm: SPEAK, burst: 2.6 },
    fill: 0.74,
    anchor: [0, 0.02],
    sway: [0.16, 0.06],
    feather: [0.06, 0.1],
  },
  {
    ...solid,
    name: "voice",
    width: 720,
    height: 720,
    display: 380,
    fps: 24,
    loop: 16,
    shape: SHAPE.orb,
    fill: 0.66,
    spin: 0.39,
    intensity: 0.62, // the rings converge at the poles; keep them from blowing out
    sway: [0, 0.08],
    feather: [0.1, 0.1],
  },
  {
    ...solid,
    name: "descent",
    width: 720,
    height: 720,
    display: 380,
    fps: 24,
    loop: 12.5, // one full descent down the landscape per loop
    shape: SHAPE.terrain,
    fill: 0.8,
    spin: 0,
    intensity: 1,
    sway: [0.32, 0.05],
    feather: [0.1, 0.1],
  },
  {
    ...solid,
    name: "knot",
    width: 720,
    height: 720,
    display: 380,
    fps: 24,
    loop: 20,
    shape: SHAPE.knot,
    fill: 0.72,
    spin: 0.314,
    intensity: 0.9,
    sway: [0, 0.06],
    feather: [0.1, 0.1],
  },
  {
    ...word,
    name: "hello",
    width: 1280,
    height: 520,
    display: 840,
    fps: 24,
    loop: 5 * beat(SPEAK),
    words: { cycle: "hello", scripts: [4, 5, 6, 7, 8], rhythm: SPEAK, burst: 2.2 },
    fill: 0.62,
    anchor: [0, 0],
    sway: [0.12, 0.05],
    feather: [0.06, 0.1],
  },
];

export interface Palette {
  name: "dark" | "light";
  bg: string;
  dot: string;
  accent: string;
}

// The page colour is GitHub's own, so the films have no visible frame. Dots and vermilion are the portfolio's.
export const PALETTES: Palette[] = [
  { name: "dark", bg: "#0d1117", dot: "#ecebe6", accent: "#ff5b2e" },
  { name: "light", bg: "#ffffff", dot: "#0d0d0c", accent: "#c23a0c" },
];
