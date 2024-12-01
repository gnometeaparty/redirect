import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";
import { env } from "~/env";
import { redis } from "~/impl";
import { authorizedUrlSchema } from "~/lib/domain";
import type { SavedAlias } from "~/lib/saved-alias";
import { unkeyBearerAuth } from "~/middleware/unkey-bearer-auth";

/**
 * Save the new alias to Redis.
 *
 * @param url - The original URL.
 * @param id - The ID of the alias.
 * @returns The saved alias.
 */
const saveNewAlias = async (url: string, id: string) => {
	const newSavedAlias: SavedAlias = {
		originalUrl: url,
		id,
	};

	const transaction = redis.multi();
	transaction.set(`id:${id}`, JSON.stringify(newSavedAlias));
	transaction.set(`original_url:${url}`, id);
	await transaction.exec();

	return newSavedAlias;
};

const app = new Hono();

app.use(
	unkeyBearerAuth({
		apiId: env.UNKEY_API_ID,
	}),
);

app.post(
	"/",
	zValidator(
		"json",
		z.object({
			url: authorizedUrlSchema,
		}),
	),
	async (c) => {
		const { url } = c.req.valid("json");

		// Check if the original URL already has an alias.
		const existingId = await redis.get(`original_url:${url}`);
		if (existingId) {
			const existingSavedAlias: SavedAlias | null = await redis.get(`id:${existingId}`);
			if (existingSavedAlias) {
				return c.json(existingSavedAlias);
			}
		}

		const id = nanoid(env.ID_LENGTH);
		const savedAlias = await saveNewAlias(url, id);
		// If the environment is development, use the local URL.
		const location = `${env.NODE_ENV === "development" ? `http://localhost:${env.PORT}` : env.DOMAIN}/${id}`;

		return c.json(savedAlias, 201, {
			Location: location,
		});
	},
);

export default app;
