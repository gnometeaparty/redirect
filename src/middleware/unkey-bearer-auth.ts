import { verifyKey } from "@unkey/api";
import type { MiddlewareHandler } from "hono";

interface UnkeyBearerAuthOptions {
	/**
	 * The API ID to use for authentication.
	 */
	apiId: string;
}

/**
 * Middleware for Unkey Bearer Authentication.
 *
 * @param options - The options for the middleware.
 */
export const unkeyBearerAuth = (options: UnkeyBearerAuthOptions): MiddlewareHandler => {
	return async function bearerAuth(c, next) {
		const apiKey = c.req.header("Authorization")?.split(" ")[1];
		if (!apiKey) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const { result, error } = await verifyKey({ key: apiKey, apiId: options.apiId });
		if (error || !result?.valid) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		return next();
	};
};
