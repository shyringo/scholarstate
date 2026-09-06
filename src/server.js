import { createServer } from "node:http";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { project } from "./core/project.js";
import { appendEvent, readEvents } from "./core/store.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = join(root, "web");
const exampleStore = join(root, "examples", "flashattention", "events.jsonl");
const workspaceStore = join(root, ".scholarstate", "events.jsonl");
const portArg = process.argv.indexOf("--port");
const port = portArg >= 0 ? Number(process.argv[portArg + 1]) : 4317;

await ensureWorkspace();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === "/api/state" && request.method === "GET") {
      return json(response, 200, project(await readEvents(workspaceStore)));
    }
    if (url.pathname === "/api/events" && request.method === "GET") {
      return json(response, 200, await readEvents(workspaceStore));
    }
    if (url.pathname === "/api/events" && request.method === "POST") {
      const draft = await readJson(request);
      const event = await appendEvent(workspaceStore, draft);
      return json(response, 201, event);
    }
    if (request.method !== "GET") return json(response, 405, { error: "method not allowed" });
    const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = resolve(publicDir, normalize(requested));
    if (!file.startsWith(`${publicDir}\\`) && file !== publicDir) return json(response, 403, { error: "forbidden" });
    const body = await readFile(file);
    response.writeHead(200, { "content-type": contentType(file), "cache-control": "no-store" });
    response.end(body);
  } catch (error) {
    const status = error.code === "ENOENT" ? 404 : 400;
    json(response, status, { error: error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ScholarState is running at http://127.0.0.1:${port}`);
  console.log(`Local event store: ${workspaceStore}`);
});

async function ensureWorkspace() {
  try {
    await access(workspaceStore);
  } catch {
    await mkdir(join(root, ".scholarstate"), { recursive: true });
    await writeFile(workspaceStore, await readFile(exampleStore, "utf8"), "utf8");
  }
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.reduce((sum, chunk) => sum + chunk.length, 0) > 1_000_000) throw new Error("request too large");
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function json(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

function contentType(path) {
  return ({ ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" })[extname(path)] ?? "application/octet-stream";
}
