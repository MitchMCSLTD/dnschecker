import { Hono } from "hono";
import { checkDomainHandler } from "./checkDomainHandler";

// Basic in-memory rate limiter for demonstration purposes
const LIMIT = 3; // Max 3 requests
const WINDOW_MS = 30 * 60 * 1000; // in 30 minutes
const ipRequestCounts = new Map<string, { count: number; timer: NodeJS.Timeout }>();

const rateLimitMiddleware = async (c: any, next: any) => {
  const ip = c.req.raw.headers.get("CF-Connecting-IP") || "unknown";

  let entry = ipRequestCounts.get(ip);

  if (!entry) {
    entry = { count: 0, timer: setTimeout(() => ipRequestCounts.delete(ip), WINDOW_MS) };
    ipRequestCounts.set(ip, entry);
  }

  if (entry.count >= LIMIT) {
    return c.json({ error: "Failed to check domain please wait 30 minutes" }, 429);
  }

  entry.count++;
  await next();
};

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));
app.post("/api/check-domain", rateLimitMiddleware, checkDomainHandler);

export default app;
