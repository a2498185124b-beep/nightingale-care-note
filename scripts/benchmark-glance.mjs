import { performance } from "node:perf_hooks";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("bench", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };
const samples = [];

for (let index = 0; index < 35; index += 1) {
  const started = performance.now();
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html", cookie: "care_demo_user=usr-clinician" } }), env, ctx);
  await response.arrayBuffer();
  if (index >= 5) samples.push(performance.now() - started);
}

samples.sort((a, b) => a - b);
const percentile = (value) => samples[Math.min(samples.length - 1, Math.ceil(samples.length * value) - 1)];
console.log(JSON.stringify({
  definition: "warm SSR glance shell; 5 warm-up + 30 measured sequential requests",
  p50_ms: Number(percentile(0.5).toFixed(2)),
  p95_ms: Number(percentile(0.95).toFixed(2)),
  max_ms: Number(samples.at(-1).toFixed(2)),
  target_ms: 300,
}, null, 2));
