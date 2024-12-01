import { createEnv } from "@t3-oss/env-core";
import { fly } from "@t3-oss/env-core/presets";
import { z } from "zod";

export const env = createEnv({
	extends: [fly()],

	server: {
		NODE_ENV: z.string().min(1).default("development"),
		PORT: z.coerce.number().default(3000),
		ID_LENGTH: z.coerce.number().optional(),
		DOMAIN: z.string().min(1),
		REDIS_URL: z.string().url(),
		REDIS_TOKEN: z.string().min(1),
		UNKEY_API_ID: z.string().min(1),
		AUTHORIZED_DOMAINS: z
			.string()
			.min(1)
			.transform((domains) => domains.split(",").map((domain) => domain.trim())),
		NOT_FOUND_REDIRECT_URL: z.string().url().optional(),
	},

	/**
	 * What object holds the environment variables at runtime. This is usually
	 * `process.env` or `import.meta.env`.
	 */
	runtimeEnv: process.env,

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * In order to solve these issues, we recommend that all new projects
	 * explicitly specify this option as true.
	 */
	emptyStringAsUndefined: true,

	isServer: true,
});
