import { z } from "zod";
import { env } from "~/env";

export const authorizedUrlSchema = z
	.string()
	.url()
	.refine(
		(url) => isDomainAuthorized(url, env.AUTHORIZED_DOMAINS),
		() => ({ message: `URL must be from one of these domains: ${env.AUTHORIZED_DOMAINS.join(", ")}` }),
	);

/**
 * Check if a URL is authorized.
 *
 * @param url - The URL to check.
 * @param authorizedDomains - The list of authorized domains.
 * @returns `true` if the URL is authorized, `false` otherwise.
 */
const isDomainAuthorized = (url: string, authorizedDomains: string[]): boolean => {
	try {
		const urlObj = new URL(url);
		return authorizedDomains.some((domain) => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`));
	} catch {
		return false;
	}
};
