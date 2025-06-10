import { Hono } from "hono";
import { checkDomainHandler } from "./checkDomainHandler";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));
app.post("/api/check-domain", checkDomainHandler);

export default app;
