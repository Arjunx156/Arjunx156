// Records every film: serves the director to headless Chrome, collects its frames, then encodes
// each loop as an animated AVIF plus a still for reduced motion.
// Usage: bun tools/film/record.ts [film ...] [--theme dark|light] [--keep] [--only 0,40,90]
// --only renders just those frames into tools/film/.frames for a look, without encoding.

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FILMS, PALETTES } from "./films";

const root = join(import.meta.dir, "..", "..");
const fonts = join(root, "tools", "fonts");
const work = join(root, "tools", "film", ".frames");
const assets = join(root, "assets");
const chromePath = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const picked = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const films = FILMS.filter((f) => picked.length === 0 || picked.includes(f.name));
const only = flag("--only");
const themes = PALETTES.filter((p) => !flag("--theme") || p.name === flag("--theme"));

const bundle = await Bun.build({ entrypoints: [join(import.meta.dir, "director.ts")], target: "browser" });
if (!bundle.success) throw new Error(`record: bundle failed\n${bundle.logs.join("\n")}`);
const script = await bundle.outputs[0]?.text();

const PAGE = `<!doctype html><meta charset="utf-8"><title>film</title>
<style>@font-face{font-family:"Mona Sans";src:url(/fonts/mona-sans.woff2) format("woff2");font-weight:200 900}
html,body{margin:0;background:#000}</style><script type="module" src="/director.js"></script>`;

let job: { dir: string; settle: (err?: string) => void } | null = null;

const server = Bun.serve({
  port: 0,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response(PAGE, { headers: { "content-type": "text/html" } });
    if (url.pathname === "/director.js")
      return new Response(script, { headers: { "content-type": "text/javascript" } });
    if (url.pathname.startsWith("/fonts/")) return new Response(Bun.file(join(fonts, url.pathname.slice(7))));
    if (!job) return new Response("no job", { status: 409 });
    if (url.pathname === "/frame") {
      const i = Number(url.searchParams.get("i"));
      writeFileSync(join(job.dir, `${String(i).padStart(4, "0")}.png`), new Uint8Array(await req.arrayBuffer()));
      if (i % 60 === 0) console.log(`  frame ${i}`);
      return new Response("ok");
    }
    if (url.pathname === "/log") console.log(`  gpu: ${url.searchParams.get("msg")}`);
    if (url.pathname === "/done") job.settle();
    if (url.pathname === "/fail") job.settle(url.searchParams.get("msg") ?? "unknown failure");
    return new Response("ok");
  },
});

function shoot(film: string, theme: string, dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const chrome = spawn(
      chromePath,
      [
        "--headless=new",
        "--ignore-gpu-blocklist",
        "--enable-gpu",
        "--use-angle=d3d11",
        "--hide-scrollbars",
        `--user-data-dir=${join(work, `profile-${server.port}`)}`,
        `http://127.0.0.1:${server.port}/?film=${film}&theme=${theme}${only ? `&only=${only}` : ""}`,
      ],
      { stdio: "ignore" },
    );
    job = {
      dir,
      settle: (err) => {
        job = null;
        chrome.kill();
        if (err) reject(new Error(`record: ${film}-${theme}: ${err}`));
        else resolve();
      },
    };
  });
}

function ffmpeg(argv: string[]) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...argv], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`record: ffmpeg failed: ${argv.join(" ")}`);
}

// AV1 keeps thousands of moving dots sharp at a fraction of WebP's size. Encoding the RGB planes directly
// (identity matrix) skips the YUV round trip, so the page colour comes back exact and the frame vanishes.
const AV1 = ["-pix_fmt", "gbrp", "-c:v", "libaom-av1", "-cpu-used", "6", "-row-mt", "1", "-b:v", "0"];
const RGB = ["-colorspace", "rgb", "-color_range", "pc", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1"];

function encode(dir: string, fps: number, stillFrame: number, out: string) {
  ffmpeg(["-framerate", String(fps), "-i", join(dir, "%04d.png"), ...AV1, "-crf", "50", ...RGB, "-f", "avif", out]);
  const still = join(dir, `${String(stillFrame).padStart(4, "0")}.png`);
  ffmpeg([
    "-i",
    still,
    ...AV1,
    "-crf",
    "24",
    "-still-picture",
    "1",
    ...RGB,
    "-frames:v",
    "1",
    "-f",
    "avif",
    out.replace(".avif", "-still.avif"),
  ]);
}

mkdirSync(assets, { recursive: true });
for (const f of films) {
  for (const p of themes) {
    const dir = join(work, `${f.name}-${p.name}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    console.log(`${f.name}-${p.name}: ${f.loop}s at ${f.fps} fps, ${f.width}x${f.height}`);
    const began = performance.now();
    await shoot(f.name, p.name, dir);
    if (only) continue;
    const out = join(assets, `${f.name}-${p.name}.avif`);
    encode(dir, f.fps, Math.round(f.still * f.fps), out);
    const kb = (statSync(out).size / 1024).toFixed(0);
    console.log(`  ${kb} KB in ${((performance.now() - began) / 1000).toFixed(0)} s`);
    if (!args.includes("--keep")) rmSync(dir, { recursive: true, force: true });
  }
}
server.stop(true);
process.exit(0);
