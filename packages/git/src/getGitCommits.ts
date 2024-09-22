import { execa } from "execa";

import type { IGitCommitInfo } from "./IGitCommitInfo.js";
import { v4 as uuidv4 } from "uuid";
import { validateGitEnvironment } from "./validateGitEnvironment.js";
import type { IGitTrailer } from "./IGitTrailer.js";
import type { IGitLink } from "./IGitLink.js";

const linesPerCommit = 6;

interface IGitGetCommitsOptions {
  from?: string | null;
  to?: string;
  path?: string;
  maxCommits?: number;
  includeTags?: boolean;
  includeTrailers?: boolean;
  customTrailers?: RegExp[];
  customLinks?: RegExp[];
}

const trailerRegex =
  /^(?<token>[^\s\t\n]+)[\s\t]*(?::[\s\t]*(.+)|(#[^\s\n]+.+))$/;
const trailerMultilineValueRegex = /^[\s\t]{1}(?<value>.*)/gm;
const tagsRegex = /tag: ([^,]+)[,)]/g;

export async function* getGitCommits({
  from,
  to = "HEAD",
  path = ".",
  maxCommits,
  includeTags = true,
  includeTrailers = true,
  customTrailers = [],
  customLinks = [],
}: IGitGetCommitsOptions = {}): AsyncGenerator<IGitCommitInfo> {
  await validateGitEnvironment();
  /**
   * %h: abbreviated commit hash
   * %d: ref names
   * %an: author name
   * %ae: author email
   * %s: subject
   * %b: body
   * %n: newline
   */
  const endMarker = `===${uuidv4()}===`;

  const args = [
    "--no-pager",
    "log",
    [from, to].filter(Boolean).join(".."),
    `--pretty=format:%h%n%d%n%an%n%ae%n%s%n%b%n${endMarker}`,
  ];

  if (path) {
    args.push("--", path);
  }

  const max = maxCommits ?? Infinity;
  let commitCount = 0;
  let commitBuffer: string[] = [];
  for await (const line of execa("git", args)) {
    if (line === endMarker) {
      if (commitBuffer.length < linesPerCommit) {
        console.warn("Incomplete commit information encountered.");
        commitBuffer = [];
        continue;
      }

      const [hash, ref, authorName, authorEmail, subject, ...bodyLines] =
        commitBuffer;
      let bodyLinesCopy: (string | null)[] = [...bodyLines];

      const trailers: IGitTrailer[] = [];

      if (includeTrailers) {
        let currentTrailer: IGitTrailer | null = null;
        let canStartTrailer = false;
        let lineIndex = 0;
        for (const line of bodyLines) {
          if (line === "") {
            canStartTrailer = true;
          }

          let foundTrailer: IGitTrailer | null = null;

          for (const customTrailer of customTrailers) {
            const match = line.match(customTrailer);

            if (match) {
              const token = match.groups!["token"]!;
              const value = match.groups!["value"]!;
              foundTrailer = { token, value };
              break;
            }
          }

          if (!foundTrailer) {
            const match = line.match(trailerRegex);
            if (match) {
              const token = match[1]!;
              const value = (match[2] || match[3])!;
              foundTrailer = { token, value };
            }
          }

          if (canStartTrailer && foundTrailer) {
            if (currentTrailer) {
              trailers.push(currentTrailer);
            }
            currentTrailer = foundTrailer;
          } else {
            if (currentTrailer) {
              const match = line.match(trailerMultilineValueRegex);
              if (match) {
                currentTrailer.value += "\n" + match.groups!["value"];
              } else {
                trailers.push(currentTrailer);
                currentTrailer = null;
              }
            }
          }

          if (
            bodyLinesCopy.length >= lineIndex &&
            (currentTrailer || trailers.length > 0)
          ) {
            bodyLinesCopy.splice(lineIndex);
          }
          lineIndex++;
        }

        if (currentTrailer) {
          trailers.push(currentTrailer);
        }
      }

      const links: Record<string, IGitLink> = {};

      for (const link of customLinks) {
        for (const line of [subject, ...bodyLines]) {
          if (line) {
            const matches = line.matchAll(link);
            for (const match of matches) {
              const token = match.groups?.["token"]!;
              links[token] = {
                token,
                link: match.groups?.["link"]!,
                ...match.groups,
              };
            }
          }
        }
      }

      const commitInfo: IGitCommitInfo = {
        hash: hash!,
        tags: [],
        authorName: authorName!,
        authorEmail: authorEmail!,
        subject: subject!,
        body: bodyLinesCopy.join("\n"),
        trailers,
        links,
      };

      if (includeTags) {
        commitInfo.tags = Array.from(ref!.matchAll(tagsRegex)).map(
          (match) => match[1]!,
        );
      }

      yield commitInfo;

      commitBuffer = [];
      commitCount++;

      if (commitCount >= max) {
        break;
      }
    } else {
      commitBuffer.push(line);
    }
  }
}
