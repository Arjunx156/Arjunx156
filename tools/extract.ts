// Pulls the sampler's JSON out of Chrome's dumped DOM on stdin.
const dom = await new Response(Bun.stdin.stream()).text();
const json = dom.match(/<pre id="out">(\{[\s\S]*?)<\/pre>/)?.[1]; // the brace skips the mention in the comment
if (!json) throw new Error("extract: no sampler output; did the fonts load?");
process.stdout.write(json.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
