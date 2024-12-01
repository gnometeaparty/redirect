import { headerVersion } from "@gnometeaparty/hono-header-version";
import { RedisStore } from "@hono-rate-limiter/redis";
import { Hono } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { getConnInfo } from "hono/bun";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { trimTrailingSlash } from "hono/trailing-slash";
import { env } from "~/env";
import id from "~/routes/[id]";
import health from "~/routes/_index";
import alias from "~/routes/alias";
import ping from "~/routes/ping";
import { redis } from "./impl";

const app = new Hono();

app.use(secureHeaders());
app.use(cors());
app.use(poweredBy());
app.use(trimTrailingSlash());
app.use(timing());
app.use(prettyJSON());
app.use(logger());

app.use(
	rateLimiter({
		windowMs: 60 * 1000,
		limit: 1000,
		standardHeaders: "draft-7",
		keyGenerator: (c) => {
			const info = getConnInfo(c);
			// See https://fly.io/docs/networking/request-headers/#fly-client-ip.
			// If you're not using Fly, you can replace this with whatever your provider uses.
			return c.req.header("Fly-Client-IP") ?? info.remote.address ?? "unknown";
		},
		store: new RedisStore({ client: redis }),
	}),
);

app.route("/", health);
app.route("/ping", ping);

app.use(headerVersion({ versions: new Set(["v0"]), fallbackVersion: "v0" }));
app.route("/alias", alias);
app.route("/:id", id);

if (env.NODE_ENV !== "production") showRoutes(app, { verbose: true, colorize: true });

export default app;
