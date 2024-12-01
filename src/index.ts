import app from "~/app";
import { env } from "~/env";

const port = env.PORT;

console.log(`Starting server on port ${port}`);

Bun.serve({ port, fetch: app.fetch });
