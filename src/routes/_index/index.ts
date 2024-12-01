import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
	return c.json({ status: "healthy" }, 200);
});

export default app;
