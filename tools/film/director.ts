// Runs in headless Chrome: steps the particle world at twice the film's frame rate, warms up for one loop,
// then renders the next loop frame by frame and posts each PNG to the recording server.

import { beat, FILMS, type Film, PALETTES, type Palette, SHAPE } from "./films";
import { bindTexture, framebuffer, type Program, programs, texture } from "./gl";
import { loadFont, random, SCRIPTS, sampleWord } from "./glyphs";
import { BLUR, BRIGHT, COMPOSITE, FADE, FULLSCREEN, POINTS_FRAG, POINTS_VERT, SIM } from "./glsl";
import { multiply, perspective, rotateX, rotateY, translate } from "./mat4";

const FOV = 0.6;
const DIST = 6;
const WORD_W = 3.6;
const SHAPE_R = 1.3;

const params = new URLSearchParams(location.search);
const film = FILMS.find((f) => f.name === params.get("film"));
const palette = PALETTES.find((p) => p.name === params.get("theme"));
// Preview: render only these frame indices of the recorded loop.
const only = params.get("only")?.split(",").map(Number) ?? null;

const post = (path: string, body?: BodyInit) => fetch(path, { method: "POST", body });
const fail = (msg: string) => post(`/fail?msg=${encodeURIComponent(msg)}`);

function rgb(hex: string): number[] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

async function shoot(f: Film, p: Palette): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = f.width;
  canvas.height = f.height;
  document.body.append(canvas);
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 unavailable");
  if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("float render targets unavailable");
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  await post(`/log?msg=${encodeURIComponent(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "?")}`);

  const [sim, points, fade, bright, blur, composite] = (await programs(gl, [
    [FULLSCREEN, SIM],
    [POINTS_VERT, POINTS_FRAG],
    [FULLSCREEN, FADE],
    [FULLSCREEN, BRIGHT],
    [FULLSCREEN, BLUR],
    [FULLSCREEN, COMPOSITE],
  ])) as [Program, Program, Program, Program, Program, Program];
  gl.bindVertexArray(gl.createVertexArray());

  const N = f.grid;
  const DT = 1 / (2 * f.fps); // two simulation steps per frame
  const count = N * N;
  const rand = random(11);
  const start = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    start[i * 4] = (rand() - 0.5) * 9;
    start[i * 4 + 1] = (rand() - 0.5) * 5;
    start[i * 4 + 2] = (rand() - 0.5) * 4;
    start[i * 4 + 3] = 1;
  }
  const zero = new Float32Array(count * 4);
  const pos = [texture(gl, N, N, "f32", start), texture(gl, N, N, "f32", start)];
  const vel = [texture(gl, N, N, "f32", zero), texture(gl, N, N, "f32", zero)];
  const simFb = pos.map((t, i) => framebuffer(gl, [t, vel[i] as WebGLTexture]));
  const target = texture(gl, N, N, "f32", zero);
  let cur = 0;

  const scene = texture(gl, f.width, f.height, "f16");
  const sceneFb = framebuffer(gl, [scene]);
  const bw = f.width / 2;
  const bh = f.height / 2;
  const bloomTex = [texture(gl, bw, bh, "f16"), texture(gl, bw, bh, "f16")] as const;
  const bloomFb = bloomTex.map((t) => framebuffer(gl, [t]));
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFb);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Glyph targets for every script this film shows.
  const glyphs = new Map<number, Float32Array>();
  for (const i of f.words?.scripts ?? []) {
    const s = SCRIPTS[i];
    if (!s) continue;
    await loadFont(s);
    const data = new Float32Array(count * 4);
    sampleWord(s, f.words?.cycle === "name" ? s.word : s.hello, count, data, 101 + i, 4);
    glyphs.set(i, data);
  }
  let uploaded = -1;
  let energy = 1;
  let shock = 0; // a burst as each new script starts to form, like a click on the portfolio
  const upload = (i: number) => {
    const data = glyphs.get(i);
    if (!data || i === uploaded) return;
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RGBA, gl.FLOAT, data);
    uploaded = i;
    energy = 1;
  };

  // Which shape the particles chase at clock t, and which script, for word films.
  function direct(t: number): number {
    if (!f.words) return f.shape;
    const { scripts, rhythm: r } = f.words;
    const b = beat(r);
    const k = Math.floor(t / b) % scripts.length;
    const local = t % b;
    const forming = local >= r.hold + r.toWave + r.wave;
    const want = scripts[forming ? (k + 1) % scripts.length : k] ?? 0;
    if (want !== uploaded && uploaded !== -1) shock = f.words.burst;
    upload(want);
    const speaking = local >= r.hold && !forming;
    if (speaking) energy = Math.max(energy, 0.6);
    return speaking ? SHAPE.wave : SHAPE.glyph;
  }

  const aspect = f.width / f.height;
  const hh = DIST * Math.tan(FOV / 2);
  const hw = hh * aspect;
  const scale = f.words ? Math.min((f.fill * 2 * hw) / WORD_W, 0.55 * 2 * hh) : (f.fill * hh) / SHAPE_R;
  const bg = rgb(p.bg);
  const away = (hex: string) => rgb(hex).map((v, i) => Math.abs(v - (bg[i] ?? 0)));
  const dot = away(p.dot);
  const accent = away(p.accent);
  const light = p.name === "light";
  const dpr = f.width / f.display;

  function simulate(t: number, shape: number) {
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, simFb[1 - cur] ?? null);
    gl.viewport(0, 0, N, N);
    gl.useProgram(sim.prog);
    bindTexture(gl, 0, pos[cur] as WebGLTexture, sim.u("uPos"));
    bindTexture(gl, 1, vel[cur] as WebGLTexture, sim.u("uVel"));
    bindTexture(gl, 2, target, sim.u("uTarget"));
    gl.uniform1f(sim.u("uTime"), t);
    gl.uniform1f(sim.u("uLoop"), f.loop);
    gl.uniform1f(sim.u("uDt"), DT);
    gl.uniform1f(sim.u("uSize"), N);
    gl.uniform1i(sim.u("uShape"), shape);
    gl.uniform1f(sim.u("uSpring"), f.spring);
    gl.uniform1f(sim.u("uDrag"), f.drag);
    gl.uniform1f(sim.u("uFlow"), f.flow);
    gl.uniform1f(sim.u("uSpin"), f.spin);
    gl.uniform3f(sim.u("uPointer"), 0, 0, 0);
    gl.uniform2f(sim.u("uPointerVel"), 0, 0);
    gl.uniform4f(sim.u("uShock"), 0, 0, shock, 4);
    gl.uniform1f(sim.u("uScroll"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    cur = 1 - cur;
    shock = 0;
  }

  function render(t: number, shape: number) {
    const phase = (t / f.loop) * Math.PI * 2;
    const view = multiply(
      translate(0, 0, -DIST),
      multiply(rotateX(f.sway[1] * Math.sin(phase * 2)), rotateY(f.sway[0] * Math.sin(phase))),
    );
    const mvp = multiply(perspective(FOV, aspect, 0.1, 100), view);

    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFb);
    gl.viewport(0, 0, f.width, f.height);
    const keep = f.words ? f.trail * Math.min(1, energy) : f.trail;
    if (keep > 0.02) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ZERO, gl.SRC_ALPHA);
      gl.useProgram(fade.prog);
      gl.uniform1f(fade.u("uKeep"), keep);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(points.prog);
    bindTexture(gl, 0, pos[cur] as WebGLTexture, points.u("uPos"));
    bindTexture(gl, 1, vel[cur] as WebGLTexture, points.u("uVel"));
    bindTexture(gl, 2, target, points.u("uTarget"));
    gl.uniformMatrix4fv(points.u("uMVP"), false, mvp);
    gl.uniform2f(points.u("uAnchor"), f.anchor[0], f.anchor[1]);
    gl.uniform1f(points.u("uScale"), scale);
    gl.uniform1f(points.u("uSize"), 2.1 * dpr);
    gl.uniform1f(points.u("uFocus"), DIST);
    // Same brightness budget as the portfolio: trails keep a share of each frame, so new light is scaled down.
    const density = Math.min(1.4, Math.sqrt(16384 / count));
    gl.uniform1f(
      points.u("uIntensity"),
      f.intensity * f.exposure * density * (1 - keep * 0.88) * (light ? (f.words ? 0.9 : 0.7) : 1),
    );
    // Ink stacks to black faster than light stacks to white, so the solid shapes print lighter on paper.
    gl.uniform1f(points.u("uGlyph"), shape === SHAPE.glyph ? 1 : 0);
    gl.uniform1i(points.u("uGrid"), N);
    gl.uniform1i(points.u("uShape"), shape);
    gl.uniform3f(points.u("uColor"), dot[0] ?? 1, dot[1] ?? 1, dot[2] ?? 1);
    gl.uniform3f(points.u("uAccent"), accent[0] ?? 1, accent[1] ?? 0.4, accent[2] ?? 0.2);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disable(gl.BLEND);

    const [a, b] = bloomTex;
    const [fa, fb] = bloomFb;
    if (fa && fb) {
      gl.viewport(0, 0, bw, bh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fa);
      gl.useProgram(bright.prog);
      bindTexture(gl, 0, scene, bright.u("uSrc"));
      gl.uniform2f(bright.u("uTexel"), 1 / bw, 1 / bh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.useProgram(blur.prog);
      gl.uniform2f(blur.u("uTexel"), 1 / bw, 1 / bh);
      for (let pass = 0; pass < 2; pass++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        bindTexture(gl, 0, a, blur.u("uSrc"));
        gl.uniform2f(blur.u("uDir"), (1 + pass) / bw, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fa);
        bindTexture(gl, 0, b, blur.u("uSrc"));
        gl.uniform2f(blur.u("uDir"), 0, (1 + pass) / bh);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, f.width, f.height);
    gl.useProgram(composite.prog);
    bindTexture(gl, 0, scene, composite.u("uScene"));
    bindTexture(gl, 1, a, composite.u("uBloom"));
    gl.uniform2f(composite.u("uTexel"), 1 / f.width, 1 / f.height);
    gl.uniform3f(composite.u("uBg"), bg[0] ?? 0, bg[1] ?? 0, bg[2] ?? 0);
    gl.uniform1f(composite.u("uLight"), light ? 1 : 0);
    gl.uniform1f(composite.u("uBloomGain"), light ? 0.3 : 0.55);
    gl.uniform2f(composite.u("uFeather"), f.feather[0], f.feather[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // One loop to settle into the periodic orbit, then one loop on film.
  const steps = Math.round(f.loop / DT);
  const every = 2;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < steps; i++) {
      const t = pass * f.loop + i * DT;
      const shape = direct(i * DT);
      simulate(t, shape);
      energy *= Math.exp(-DT / 1.3);
      render(t, shape);
      const frame = i / every;
      if (pass === 1 && i % every === 0 && (!only || only.includes(frame))) {
        const png = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
        if (!png) throw new Error("toBlob failed");
        await post(`/frame?i=${frame}`, png);
      } else if (i % 30 === 0) {
        gl.finish();
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  }
}

if (!film || !palette) fail("unknown film or theme");
else
  shoot(film, palette).then(
    () => post("/done"),
    (e: unknown) => fail(e instanceof Error ? e.message : String(e)),
  );
