// Writes every SVG in assets/, in a dark and a light cut.
// Usage: bun tools/build.ts   (points.json comes from `just sample`)

import { mkdirSync, writeFileSync } from "node:fs";
import { charge, fusion, intercept, relief, spike, voice } from "./figures.ts";
import { THEMES, type Theme } from "./kit.ts";
import { particleWord, type Script } from "./particles.ts";

const { scripts } = (await Bun.file(new URL("points.json", import.meta.url)).json()) as { scripts: Script[] };

const pages: Record<string, (t: Theme) => string> = {
  hero: (theme) =>
    particleWord({
      scripts,
      key: "name",
      theme,
      w: 1280,
      h: 540,
      scale: 0.9,
      cy: 238,
      left: "Arjun Krishnan Suresh",
      leftMuted: "  ·  AI engineer and researcher",
      title:
        "Arjun, written in particles that reflow through nine scripts: English, Malayalam, Hindi, Tamil, Telugu, Kannada, Bengali, Gujarati and Punjabi.",
      seed: 3,
    }),
  hello: (theme) =>
    particleWord({
      scripts,
      key: "greet",
      theme,
      w: 1280,
      h: 380,
      scale: 0.62,
      cy: 170,
      left: "Say hello",
      leftMuted: "  ·  in any of nine scripts",
      title: "Hello, in particles that reflow through nine scripts, from English to Punjabi.",
      seed: 5,
    }),
  voice,
  fusion,
  charge,
  relief,
  intercept,
  spike,
};

const out = new URL("../assets/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const [name, draw] of Object.entries(pages)) {
  for (const theme of THEMES) {
    const file = new URL(`${name}-${theme.name}.svg`, out);
    const text = draw(theme);
    writeFileSync(file, text);
    console.log(`${name}-${theme.name}.svg  ${(text.length / 1024).toFixed(0)} KB`);
  }
}
