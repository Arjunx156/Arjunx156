// One motion figure per project, built from the numbers in the portfolio's work.ts.
// Each plays once per loop and fades back; with motion off it shows its last frame.

import { esc, keyframes, plate, r1, random, type Theme } from "./kit.ts";

const ease = "animation-timing-function:cubic-bezier(.65,0,.25,1)";
const fadeOut: [number, string][] = [
  [92, "opacity:1"],
  [98, "opacity:0"],
  [100, "opacity:0"],
];

// VoiceCare: one call hops through nine agents while a timer fills toward the ten-second budget.
export function voice(theme: Theme): string {
  const agents = ["stt", "intent", "order", "policy", "resolve", "escalate", "reply", "tts", "ticket"];
  const xs = agents.map((_, i) => 60 + i * 65);
  const at = (i: number) => 4 + i * 8; // pulse reaches node i
  const pulse: [number, string][] = [[0, "transform:translateX(0);opacity:0"]];
  const trail: [number, string][] = [[0, "stroke-dashoffset:520"]];
  agents.forEach((_, i) => {
    const dx = (xs[i] ?? 0) - 60;
    pulse.push(
      [at(i), `transform:translateX(${dx}px);opacity:1`],
      [at(i) + 3, `transform:translateX(${dx}px);${ease}`],
    );
    trail.push([at(i), `stroke-dashoffset:${520 - dx}`], [at(i) + 3, `stroke-dashoffset:${520 - dx};${ease}`]);
  });
  pulse.push(
    [92, "transform:translateX(520px);opacity:1"],
    [97, "transform:translateX(520px);opacity:0"],
    [100, "opacity:0"],
  );
  trail.push(
    [92, "stroke-dashoffset:0;opacity:1"],
    [98, "stroke-dashoffset:0;opacity:0"],
    [100, "stroke-dashoffset:520;opacity:0"],
  );

  const nodes = agents
    .map((a, i) => {
      const x = xs[i] ?? 0;
      const ly = i % 2 === 0 ? 128 : 182;
      return `<circle class="n n${i}" cx="${x}" cy="154" r="8"/><text class="s m" x="${x}" y="${ly}">${a}</text>`;
    })
    .join("");
  const css = [
    keyframes("pulse", pulse),
    keyframes("trail", trail),
    ...agents.map((_, i) =>
      keyframes(`n${i}`, [
        [0, "fill:var(--bg)"],
        [at(i), "fill:var(--bg)"],
        [at(i) + 1, "fill:var(--fg)"],
        [92, "fill:var(--fg)"],
        [98, "fill:var(--bg)"],
      ]),
    ),
    keyframes("timer", [
      [0, "transform:scaleX(0)"],
      [at(0), "transform:scaleX(0)"],
      [at(8) + 3, "transform:scaleX(.86)"],
      [92, "transform:scaleX(.86);opacity:1"],
      [98, "transform:scaleX(.86);opacity:0"],
      [100, "transform:scaleX(0);opacity:0"],
    ]),
    ".n{fill:var(--fg);stroke:var(--fg);stroke-width:1.5}",
    ...agents.map((_, i) => `.n${i}{animation:n${i} 9s infinite}`),
    ".pulse{fill:var(--accent);transform:translateX(520px);animation:pulse 9s infinite}",
    ".trail{stroke:var(--fg);stroke-width:1.5;stroke-dasharray:520;animation:trail 9s infinite}",
    ".timer{fill:var(--fg);transform-box:view-box;transform-origin:60px 0;transform:scaleX(.86);animation:timer 9s infinite linear}",
  ].join("\n");
  const body = `<path d="M60 154H580" stroke="var(--line)" stroke-width="1.5"/>
<path class="trail" d="M60 154H580"/>
${nodes}
<circle class="pulse" cx="60" cy="154" r="5"/>
<text class="s" x="60" y="232">0 s</text><text class="s e" x="580" y="232">10 s budget</text>
<rect x="60" y="244" width="520" height="6" rx="3" fill="var(--line)"/>
<rect class="timer" x="60" y="244" width="520" height="6" rx="3"/>
<path d="M580 238V258" stroke="var(--fg)" stroke-width="1.5"/>`;
  return plate({
    theme,
    title:
      "VoiceCare AI: one spoken request hops through nine agents, from speech to text to a ticket, inside a ten-second budget.",
    label: "voicecare-ai · one call through nine agents",
    metrics: [
      ["<10 s", "spoken resolution"],
      ["9", "Indian languages"],
      ["90%", "intent accuracy"],
    ],
    css,
    body,
  });
}

// Hybrid RAG: BM25 and dense rankings fused by reciprocal rank fusion, then a cross-encoder reorders the top.
export function fusion(theme: Theme): string {
  const bm25 = ["d4", "d1", "d7", "d2", "d9", "d5"];
  const dense = ["d1", "d3", "d4", "d8", "d2", "d6"];
  const K = 60;
  const docs = [...new Set([...bm25, ...dense])];
  const rrf = docs
    .map((d) => {
      const score = [bm25, dense].reduce((s, list) => {
        const r = list.indexOf(d);
        return r < 0 ? s : s + 1 / (K + r + 1);
      }, 0);
      return { d, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const reranked = ["d4", "d1", "d3", "d2", "d8", "d7"]; // illustrative cross-encoder order
  const row = (r: number) => 112 + r * 30;

  const chip = (x: number, y: number, w: number, label: string) =>
    `<rect x="${x}" y="${y - 15}" width="${w}" height="22" rx="4" fill="var(--bg)" stroke="var(--line)"/><text class="f" x="${x + 10}" y="${y}">${label}</text>`;
  const sources = [
    { list: bm25, x: 40, name: "bm25", side: 1 },
    { list: dense, x: 536, name: "dense", side: -1 },
  ];
  const fusedIds = rrf.map((f) => f.d);
  const curves: string[] = [];
  const chips: string[] = [];
  for (const { list, x, name, side } of sources) {
    chips.push(`<text x="${x}" y="88">${name}</text>`);
    list.forEach((d, r) => {
      const kept = fusedIds.includes(d);
      chips.push(`<g${kept ? "" : ' opacity=".4"'}>${chip(x, row(r), 64, d)}</g>`);
      const f = fusedIds.indexOf(d);
      if (f >= 0) {
        const y1 = row(r) - 4;
        const y2 = row(f) - 4;
        // Each source runs into the fused column from its own side.
        const from = side > 0 ? x + 64 : x;
        const to = side > 0 ? 258 : 382;
        const bend = (to - from) / 2;
        curves.push(
          `<path class="curve" pathLength="1" d="M${from} ${y1}C${from + bend} ${y1} ${to - bend} ${y2} ${to} ${y2}"/>`,
        );
      }
    });
  }
  const fused: string[] = [];
  const css: string[] = [];
  rrf.forEach(({ d, score }, k) => {
    const to = reranked.indexOf(d);
    const dy = (to - k) * 30;
    const end = to === 5 ? 0.4 : 1;
    fused.push(
      `<g class="fz fz${k}">${chip(258, row(k), 124, d)}<text class="s e" x="372" y="${row(k)}">${score.toFixed(4).slice(1)}</text></g>`,
    );
    css.push(
      keyframes(`fz${k}`, [
        [0, "opacity:0;transform:none"],
        [24 + k * 2, "opacity:0;transform:none"],
        [32 + k * 2, "opacity:1;transform:none"],
        [50, `opacity:1;transform:none;${ease}`],
        [62, `opacity:${end};transform:translateY(${dy}px)`],
        [92, `opacity:${end};transform:translateY(${dy}px)`],
        [98, `opacity:0;transform:translateY(${dy}px)`],
        [100, "opacity:0"],
      ]),
      `.fz${k}{opacity:${end};transform:translateY(${dy}px);animation:fz${k} 10s infinite}`,
    );
  });
  css.push(
    // The votes fade once the reranker reorders, since they point at RRF slots.
    keyframes("draw", [
      [0, "stroke-dashoffset:1;opacity:1"],
      [6, `stroke-dashoffset:1;${ease}`],
      [30, "stroke-dashoffset:0"],
      [48, "opacity:1"],
      [56, "opacity:0"],
      [100, "opacity:0"],
    ]),
    keyframes("top", [[0, "opacity:0"], [64, "opacity:0"], [70, "opacity:1"], ...fadeOut]),
    ".curve{fill:none;stroke:var(--muted);stroke-opacity:.55;stroke-dasharray:1;opacity:0;animation:draw 10s infinite}",
    ".top{animation:top 10s infinite}",
  );
  const body = `${curves.join("")}
${chips.join("")}
<text class="m" x="320" y="88">rrf → rerank</text>
${fused.join("")}
<g class="top">${[0, 1, 2, 3, 4].map((r) => `<rect x="258" y="${row(r) - 15}" width="124" height="22" rx="4" fill="none" stroke="var(--accent)" stroke-width="1.5"/>`).join("")}
<text class="s a m" x="320" y="294">top 5 go to the model</text></g>`;
  return plate({
    theme,
    title:
      "Hybrid RAG engine: a keyword ranking and a vector ranking merge by reciprocal rank fusion, a cross-encoder reorders them, and the top five go to the model.",
    label: "rag-system · two rankings vote, a reranker decides",
    metrics: [
      ["84%", "precision@5, from 68%"],
      ["48", "pytest tests"],
      ["$0", "per token, run locally"],
    ],
    css: css.join("\n"),
    body,
  });
}

// Battery: predicted state of charge tracks the truth, and the doubt band widens while charging.
export function charge(theme: Theme): string {
  const x0 = 76;
  const x1 = 600;
  const y = (soc: number) => 270 - soc * 1.7;
  const rand = random(7);
  const CYCLE = 200;
  const DISCHARGE = 150;
  const soc = (t: number) => {
    const c = (t + 40) % CYCLE;
    if (c < DISCHARGE) {
      const u = c / DISCHARGE;
      return { v: 92 - 70 * (0.85 * u + 0.15 * u ** 3), charging: false };
    }
    const u = (c - DISCHARGE) / (CYCLE - DISCHARGE);
    return { v: 22 + (70 * (1 - Math.exp(-3.2 * u))) / (1 - Math.exp(-3.2)), charging: true };
  };
  const truth: string[] = [];
  const pred: [number, number, number][] = [];
  let drift = 0;
  for (let t = 0; t <= x1 - x0; t += 4) {
    const { v, charging } = soc(t);
    drift = drift * 0.8 + (rand() - 0.5) * (charging ? 2.4 : 0.8);
    pred.push([x0 + t, v + drift + (charging ? 1.2 : 0), charging ? 6 : 1.2]);
    truth.push(`${x0 + t},${r1(y(v))}`);
  }
  const upper = pred.map(([x, v, w]) => `${x},${r1(y(v + w))}`);
  const lower = pred.map(([x, v, w]) => `${x},${r1(y(v - w))}`).reverse();
  const predicted = pred.map(([x, v]) => `${x},${r1(y(v))}`);
  // Label the first charge, where confidence first drops.
  const firstCharge = x0 + (DISCHARGE - 40) + 18;

  const css = [
    keyframes("reveal", [
      [0, "transform:scaleX(0)"],
      [60, "transform:scaleX(1)"],
      [100, "transform:scaleX(1)"],
    ]),
    keyframes("hold", [[0, "opacity:1"], ...fadeOut]),
    `.clip{transform-box:view-box;transform-origin:${x0}px 0;animation:reveal 10s infinite linear}`,
    ".plot{animation:hold 10s infinite}",
  ].join("\n");
  const body = `<clipPath id="c"><rect class="clip" x="${x0}" y="80" width="${x1 - x0 + 4}" height="200"/></clipPath>
<text class="s e" x="66" y="104">100%</text><text class="s e" x="66" y="274">0%</text>
<path d="M${x0} 270H${x1}" stroke="var(--line)"/>
<text class="s" x="${x0}" y="80"><tspan class="f">predicted</tspan>  true  <tspan class="a">doubt</tspan></text>
<g class="plot" clip-path="url(#c)">
<polygon points="${[...upper, ...lower].join(" ")}" fill="var(--accent)" fill-opacity=".22"/>
<polyline points="${truth.join(" ")}" fill="none" stroke="var(--muted)" stroke-width="1.5"/>
<polyline points="${predicted.join(" ")}" fill="none" stroke="var(--fg)" stroke-width="2"/>
<text class="s a" x="${firstCharge}" y="108">widens while charging</text>
</g>`;
  return plate({
    theme,
    title:
      "Battery state of charge: an attention BiLSTM's prediction tracks the true curve, and its Monte Carlo dropout uncertainty widens while the battery charges.",
    label: "battery-soc · held-out charge, and where it doubts",
    metrics: [
      ["0.9958", "R², state of charge"],
      ["1.48", "RMSE, vs BiLSTM 1.61"],
      ["19,735", "sensor readings"],
    ],
    css,
    body,
  });
}

// Relief: supply flows from a depot to five districts until one route is blocked,
// and one DMD eigenvalue leaves the unit circle to flag it.
export function relief(theme: Theme): string {
  const depot = [100, 186] as const;
  const districts = [
    [300, 104, 16],
    [420, 126, 12],
    [476, 222, 20],
    [356, 266, 11],
    [234, 250, 14],
  ] as const;
  const BLOCKED = 2;
  const routes = districts.map(([x, y, r], i) => {
    const mx = (depot[0] + x) / 2;
    const my = Math.min(depot[1], y) - 30;
    const ang = Math.atan2(y - my, x - mx);
    const ex = x - Math.cos(ang) * (r + 4);
    const ey = y - Math.sin(ang) * (r + 4);
    const d = `M${depot[0] + 14} ${depot[1]}Q${mx} ${my} ${r1(ex)} ${r1(ey)}`;
    return { d, i, mid: [(depot[0] + 14 + 2 * mx + ex) / 4, (depot[1] + 2 * my + ey) / 4] as const };
  });
  const flows = routes.map(({ d, i }) => `<path class="flow${i === BLOCKED ? " go" : ""}" d="${d}"/>`).join("");
  const blocked = routes[BLOCKED];
  const [bx, by] = blocked?.mid ?? [0, 0];
  const eig = [562, 112] as const;
  const R = 32;
  const quiet = [
    [0.4, 0.9],
    [2.1, 0.75],
    [3.4, 0.62],
    [4.6, 0.86],
    [5.5, 0.5],
  ]
    .map(
      ([a = 0, m = 0]) =>
        `<circle cx="${r1(eig[0] + Math.cos(a) * m * R)}" cy="${r1(eig[1] + Math.sin(a) * m * R)}" r="2.5" fill="var(--muted)"/>`,
    )
    .join("");
  const hotA = -0.6;
  const out = [Math.cos(hotA) * 0.8 * R, Math.sin(hotA) * 0.8 * R]; // starts at 0.75 R, inside the circle

  const css = [
    keyframes("flow", [
      [0, "stroke-dashoffset:0"],
      [100, "stroke-dashoffset:-20"],
    ]),
    keyframes("go", [
      [0, "opacity:1"],
      [44, "opacity:1"],
      [48, "opacity:0"],
      [96, "opacity:0"],
      [100, "opacity:1"],
    ]),
    keyframes("stop", [[0, "opacity:0"], [44, "opacity:0"], [48, "opacity:1"], ...fadeOut]),
    keyframes("eig", [
      [0, `transform:translate(${r1(-out[0])}px,${r1(-out[1])}px)`],
      [46, `transform:translate(${r1(-out[0])}px,${r1(-out[1])}px);${ease}`],
      [58, "transform:none"],
      [92, "transform:none;opacity:1"],
      [98, "transform:none;opacity:0"],
      [100, "opacity:0"],
    ]),
    ".flow{fill:none;stroke:var(--fg);stroke-opacity:.7;stroke-width:1.5;stroke-dasharray:2 8;animation:flow 1s infinite linear}",
    ".go{opacity:0;animation:flow 1s infinite linear,go 10s infinite}",
    ".stop{animation:stop 10s infinite}",
    ".hot{animation:eig 10s infinite}",
  ].join("\n");
  const body = `${flows}
<g class="stop"><path d="${blocked?.d}" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="2 8"/>
<path d="M${r1(bx - 7)} ${r1(by - 7)}l14 14m0-14l-14 14" stroke="var(--accent)" stroke-width="2.5"/></g>
<rect x="${depot[0] - 12}" y="${depot[1] - 12}" width="24" height="24" fill="var(--fg)"/>
<text class="s m" x="${depot[0]}" y="${depot[1] + 34}">depot</text>
${districts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="var(--fg)" stroke-width="1.5"/>`).join("")}
<circle cx="${eig[0]}" cy="${eig[1]}" r="${R}" fill="none" stroke="var(--muted)" stroke-dasharray="3 4"/>
${quiet}
<circle class="hot" cx="${r1(eig[0] + Math.cos(hotA) * 1.55 * R)}" cy="${r1(eig[1] + Math.sin(hotA) * 1.55 * R)}" r="3.5" fill="var(--accent)"/>
<text class="s m" x="${eig[0]}" y="${eig[1] + R + 22}">eigenvalues</text>`;
  return plate({
    theme,
    title:
      "Emergency relief for Delhi: supply flows from a depot to five districts, a route is blocked, and one Dynamic Mode Decomposition eigenvalue leaves the unit circle to flag it.",
    label: "relief · 800 units of supply for 910 units of need",
    metrics: [
      ["0.963", "weighted fulfilment"],
      ["0.941", "with a route blocked"],
      ["200", "Monte Carlo runs"],
    ],
    css,
    body,
  });
}

// Diffie-Hellman MITM: Mallory swaps both public values and holds two keys, until a CA signs them.
export function intercept(theme: Theme): string {
  const A = [80, 160] as const;
  const B = [560, 160] as const;
  const M = [320, 236] as const;
  const packet = (label: string, cls: string, accent = false) =>
    `<g class="${cls}"><rect x="-24" y="-12" width="48" height="24" rx="4" fill="var(--bg)" stroke="var(${accent ? "--accent" : "--muted"})"/><text class="s m${accent ? " a" : " f"}" y="4">${label}</text></g>`;
  const tr = (x: number, y: number) => `transform:translate(${x}px,${y}px)`;
  const path = (name: string, pts: [number, [number, number]][], show: [number, number]) => {
    const stops: [number, string][] = pts.map(([p, [x, y]]) => [p, `${tr(x, y)};${ease}`]);
    const first = pts[0]?.[1] ?? [0, 0];
    const last = pts.at(-1)?.[1] ?? [0, 0];
    return keyframes(name, [
      [0, `${tr(first[0], first[1])};opacity:0`],
      [show[0] - 2, "opacity:0"],
      [show[0], "opacity:1"],
      ...stops,
      [show[1], "opacity:1"],
      [show[1] + 3, `${tr(last[0], last[1])};opacity:0`],
      [100, "opacity:0"],
    ]);
  };
  const mid = 160;
  const css = [
    path(
      "pa",
      [
        [6, [124, mid]],
        [18, [320, mid]],
        [26, [M[0], M[1] - 34]],
      ],
      [6, 26],
    ),
    path(
      "pb",
      [
        [6, [516, mid]],
        [18, [320, mid]],
        [26, [M[0], M[1] - 34]],
      ],
      [6, 26],
    ),
    path(
      "m1",
      [
        [30, [M[0], M[1] - 34]],
        [36, [320, mid]],
        [46, [124, mid]],
      ],
      [30, 46],
    ),
    path(
      "m2",
      [
        [30, [M[0], M[1] - 34]],
        [36, [320, mid]],
        [46, [516, mid]],
      ],
      [30, 46],
    ),
    path(
      "m3",
      [
        [64, [M[0], M[1] - 34]],
        [68, [320, mid]],
        [74, [430, mid]],
      ],
      [64, 92],
    ),
    keyframes("keys", [[0, "opacity:0"], [46, "opacity:0"], [50, "opacity:1"], ...fadeOut]),
    keyframes("ca", [[0, "opacity:0"], [54, "opacity:0"], [60, "opacity:1"], ...fadeOut]),
    keyframes("fail", [[0, "opacity:0"], [74, "opacity:0"], [77, "opacity:1"], ...fadeOut]),
    ".pa,.pb,.m1,.m2{opacity:0}",
    ".pa{animation:pa 12s infinite}.pb{animation:pb 12s infinite}.m1{animation:m1 12s infinite}.m2{animation:m2 12s infinite}",
    `.m3{${tr(430, mid)};animation:m3 12s infinite}`,
    ".keys{animation:keys 12s infinite}.ca{animation:ca 12s infinite}.fail{animation:fail 12s infinite}",
  ].join("\n");
  const party = ([x, y]: readonly [number, number], name: string, accent = false) =>
    `<circle cx="${x}" cy="${y}" r="20" fill="var(--bg)" stroke="var(${accent ? "--accent" : "--fg"})" stroke-width="1.5"/><text class="m${accent ? " a" : " f"}" x="${x}" y="${y + 42}">${name}</text>`;
  const body = `<g class="ca"><path d="M290 96L${A[0]} ${A[1] - 20}M350 96L${B[0]} ${B[1] - 20}" stroke="var(--muted)" stroke-dasharray="3 4"/>
<rect x="290" y="70" width="60" height="28" rx="4" fill="var(--bg)" stroke="var(--fg)" stroke-width="1.5"/><text class="m f" x="320" y="89">ca</text>
<text class="s" x="362" y="80">signs both keys</text></g>
<path d="M${A[0] + 20} ${mid}H${B[0] - 20}" stroke="var(--line)" stroke-width="1.5"/>
${party(A, "alice")}${party(B, "bob")}${party(M, "mallory", true)}
<g class="keys"><text class="s a" x="${M[0] + 32}" y="${M[1] + 4}">holds k_am and k_bm</text></g>
${packet("g^a", "pa")}${packet("g^b", "pb")}${packet("g^m", "m1", true)}${packet("g^m", "m2", true)}${packet("g^m", "m3", true)}
<g class="fail"><path d="M461 149l22 22m0-22l-22 22" stroke="var(--accent)" stroke-width="2.5"/><text class="s a m" x="460" y="${mid + 40}">forgery fails</text></g>`;
  return plate({
    theme,
    title:
      "Man in the middle on Diffie-Hellman: Mallory swaps both public values and holds two session keys, then a certificate authority signs the keys and her forgery fails.",
    label: "diffie-hellman · a handshake that never checked who",
    metrics: [
      ["0", "crypto libraries"],
      ["512-bit", "RSA, from scratch"],
      ["10", "Miller-Rabin rounds"],
    ],
    css,
    body,
  });
}

// ABMP: live throughput against a rolling 3-sigma band; the protocol calibrates, monitors, then flags the spike.
export function spike(theme: Theme): string {
  const N = 120;
  const WINDOW = 20;
  const SPIKE_AT = 112; // late, so the window it inflates scrolls off the edge
  const SPIKE = 45.09;
  const rand = random(11);
  const v: number[] = [];
  for (let i = 0; i < N; i++) {
    const noise = (rand() + rand() + rand() - 1.5) * 1.6;
    v.push(i === SPIKE_AT ? SPIKE : Math.max(0.6, 6 + 1.4 * Math.sin(i / 9) + noise));
  }
  const x0 = 76;
  const x1 = 600;
  const X = (i: number) => r1(x0 + (i * (x1 - x0)) / (N - 1));
  const Y = (mb: number) => r1(268 - mb * 3.6);
  // Rolling mean and 3 SD over the previous WINDOW samples, as the protocol computes it.
  const upper: string[] = [];
  let z = 0;
  const lower: string[] = [];
  for (let i = WINDOW; i < N; i++) {
    const w = v.slice(i - WINDOW, i);
    const mean = w.reduce((a, b) => a + b, 0) / WINDOW;
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - mean) ** 2, 0) / (WINDOW - 1)); // sample SD, as ABMP
    if (i === SPIKE_AT) z = (SPIKE - mean) / sd;
    upper.push(`${X(i)},${Y(Math.min(48, mean + 3 * sd))}`);
    lower.push(`${X(i)},${Y(Math.max(0, mean - 3 * sd))}`);
  }
  const line = v.map((m, i) => `${X(i)},${Y(m)}`).join(" ");
  const spikeSeg = [SPIKE_AT - 1, SPIKE_AT, SPIKE_AT + 1].map((i) => `${X(i)},${Y(v[i] ?? 0)}`).join(" ");
  const REVEAL = 60;
  const tCal = ((WINDOW - 0.5) / (N - 1)) * REVEAL;
  const tSpike = (SPIKE_AT / (N - 1)) * REVEAL;
  const state = (name: string, on: [number, number], color: string) =>
    keyframes(name, [
      [0, `fill:var(--${on[0] === 0 ? color : "muted"})`],
      [on[0], `fill:var(--${on[0] === 0 ? color : "muted"})`],
      [on[0] + 0.5, `fill:var(--${color})`],
      [on[1], `fill:var(--${color})`],
      [on[1] + 0.5, "fill:var(--muted)"],
      [97, "fill:var(--muted)"],
      [100, `fill:var(--${on[0] === 0 ? color : "muted"})`],
    ]);
  const css = [
    keyframes("reveal", [
      [0, "transform:scaleX(0)"],
      [REVEAL, "transform:scaleX(1)"],
      [100, "transform:scaleX(1)"],
    ]),
    keyframes("hold", [[0, "opacity:1"], ...fadeOut]),
    state("st0", [0, tCal], "fg"),
    state("st1", [tCal, tSpike], "fg"),
    state("st2", [tSpike, 94], "accent"),
    `.clip{transform-box:view-box;transform-origin:${x0}px 0;animation:reveal 10s infinite linear}`,
    ".plot{animation:hold 10s infinite}",
    ".st0{animation:st0 10s infinite}.st1{animation:st1 10s infinite}.st2{fill:var(--accent);animation:st2 10s infinite}",
  ].join("\n");
  const sx = X(SPIKE_AT);
  const body = `<clipPath id="c"><rect class="clip" x="${x0 - 2}" y="84" width="${x1 - x0 + 8}" height="196"/></clipPath>
<text class="s" x="${x0}" y="80"><tspan class="st0">calibration</tspan> → <tspan class="st1">monitoring</tspan> → <tspan class="st2">violation</tspan></text>
<text class="s e" x="66" y="272">0</text><text class="s e" x="66" y="${Number(Y(40)) + 4}">40</text>
<path d="M${x0} 268H${x1}" stroke="var(--line)"/>
<path d="M${X(WINDOW - 0.5)} 96V268" stroke="var(--muted)" stroke-dasharray="3 4"/>
<g class="plot" clip-path="url(#c)">
<polygon points="${[...upper, ...lower.reverse()].join(" ")}" fill="var(--fg)" fill-opacity=".12"/>
<polyline points="${line}" fill="none" stroke="var(--fg)" stroke-width="1.5" stroke-linejoin="round"/>
<polyline points="${spikeSeg}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
<circle cx="${sx}" cy="${Y(SPIKE)}" r="4" fill="var(--accent)"/>
<text class="s a e" x="${Number(sx) - 10}" y="${Number(Y(SPIKE)) + 5}">${esc(`${SPIKE} MB/s, z ${z.toFixed(1)}`)}</text>
</g>`;
  return plate({
    theme,
    title:
      "Adaptive Bandwidth Monitoring Protocol: throughput scrolls past a rolling three-sigma band, a 45.09 MB/s spike breaks out, and the protocol moves from monitor to violation.",
    label: "abmp · a rolling 3σ band over live NIC counters",
    metrics: [
      ["3 SD", "rolling z-score trigger"],
      ["<5 ms", "host overhead"],
      ["45.09 MB/s", "spike, at 1 s grain"],
    ],
    css,
    body,
  });
}
