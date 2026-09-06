#!/usr/bin/env node
import { resolve } from "node:path";
import { project } from "./core/project.js";
import { readEvents, verifyStore } from "./core/store.js";

const [, , command = "help", target] = process.argv;

if (command === "verify") {
  const path = resolve(target ?? "examples/flashattention/events.jsonl");
  const result = await verifyStore(path);
  if (!result.valid) {
    console.error(JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`Verified ${result.count} immutable events in ${path}`);
  }
} else if (command === "project") {
  const path = resolve(target ?? "examples/flashattention/events.jsonl");
  console.log(JSON.stringify(project(await readEvents(path)), null, 2));
} else if (command === "demo") {
  const path = resolve("examples/flashattention/events.jsonl");
  const verification = await verifyStore(path);
  if (!verification.valid) throw new Error("bundled example failed integrity verification");
  const state = project(await readEvents(path));
  const claims = Object.values(state.objects).filter((item) => item.type === "ai:claim");
  console.log("ScholarState demo: FlashAttention research record");
  console.log(`  immutable events: ${state.eventCount}`);
  console.log(`  research objects: ${Object.keys(state.objects).length}`);
  console.log(`  typed relations:  ${state.relations.length}`);
  console.log(`  attestations:     ${state.attestations.length}`);
  for (const claim of claims) console.log(`  claim state:      ${claim.status} - ${claim.latest.title}`);
  console.log("\nRun `npm run serve` and open http://127.0.0.1:4317 for the interactive view.");
} else {
  console.log(`ScholarState CLI

Usage:
  node src/cli.js demo
  node src/cli.js verify <events.jsonl>
  node src/cli.js project <events.jsonl>`);
}
