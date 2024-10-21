import type { IGitLink } from "./IGitLink.js";
import type { IGitTrailer } from "./IGitTrailer.js";

export interface IGitCommitInfo {
  hash: string;
  tags: string[];
  authorName: string;
  authorEmail: string;
  subject: string;
  body: string;
  trailers: IGitTrailer[];
  links: Record<string, IGitLink>;
}
