import { Hono } from "hono";
import { env } from "~/env";

const app = new Hono();

app.get("/", async (c) => {
	return c.json({ ping: "pong", region: env.FLY_REGION }, 200);
});

export default app;
