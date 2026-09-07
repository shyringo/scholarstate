import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

test("local server delivers the web app and projected API", { timeout: 15_000 }, async (context) => {
  const port = 4327;
  const child = spawn(process.execPath, ["src/server.js", "--port", String(port), "--store", "examples/flashattention/events.jsonl"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  context.after(() => child.kill());
  await new Promise((resolve, reject) => {
    child.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("ScholarState is running")) resolve();
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`server exited early with ${code}`)));
  });

  const [page, api, focus] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/`).then((response) => response.text()),
    fetch(`http://127.0.0.1:${port}/api/state`).then((response) => response.json()),
    fetch(`http://127.0.0.1:${port}/api/focus?root=claim:flashattention-io-aware-exact&depth=1&limit=2`).then((response) => response.json()),
  ]);
  assert.match(page, /What does the evidence support now\?/);
  assert.equal(api.eventCount >= 12, true);
  assert.equal(api.objects["claim:flashattention-io-aware-exact"].status, "supported");
  assert.equal(Object.keys(focus.objects).length, 2);
  assert.equal(focus.truncated, true);
});
