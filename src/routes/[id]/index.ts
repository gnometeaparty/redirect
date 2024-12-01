import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { env } from "~/env";
import { redis } from "~/impl";
import type { SavedAlias } from "~/lib/saved-alias";
import { unkeyBearerAuth } from "~/middleware/unkey-bearer-auth";

const app = new Hono();

app.get("/", zValidator("param", z.object({ id: z.string().min(1) })), async (c) => {
	const { id } = c.req.valid("param");

	const savedAlias: SavedAlias | null = await redis.get(`id:${id}`);
	if (!savedAlias) {
		if (env.NOT_FOUND_REDIRECT_URL) {
			// If a redirect URL is set, redirect to it.
			return c.redirect(env.NOT_FOUND_REDIRECT_URL);
		}

		return c.json({ error: "Not found" }, 404);
	}

	return c.redirect(savedAlias.originalUrl);
});

export default app;

app.use(
	unkeyBearerAuth({
		apiId: env.UNKEY_API_ID,
	}),
);

app.delete("/", zValidator("param", z.object({ id: z.string().min(1) })), async (c) => {
	const { id } = c.req.valid("param");

	// Check if the alias exists.
	const existingSavedAlias: SavedAlias | null = await redis.get(`id:${id}`);
	if (!existingSavedAlias) {
		return c.json({ error: "Not found" }, 404);
	}

	// Remove both the alias and original URL mappings.
	const transaction = redis.multi();
	transaction.del(`id:${id}`);
	transaction.del(`original_url:${existingSavedAlias.originalUrl}`);
	await transaction.exec();

	return c.body(null, 204);
});
