import { z } from "zod";

const savedAliasSchema = z.object({
	originalUrl: z.string().url(),
	id: z.string(),
});
export type SavedAlias = z.infer<typeof savedAliasSchema>;
