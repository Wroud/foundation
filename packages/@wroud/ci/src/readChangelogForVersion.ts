import { createInterface } from "readline";
import { defaultChangelogFile } from "./defaultChangelogFile.js";
import { createReadStream } from "fs";
import { conventionalChangelogMarkers } from "@wroud/conventional-commits-changelog";

export interface IReadChangelogForVersionOptions {
  version: string;
  changeLogFile?: string;
}

export async function readChangelogForVersion({
  version,
  changeLogFile = defaultChangelogFile,
}: IReadChangelogForVersionOptions): Promise<string> {
  let data = "";

  let header = false;
  let reading = false;
  for await (const line of createInterface(
    createReadStream(changeLogFile, {
      flags: "r",
    }),
  )) {
    if (header) {
      if (line === conventionalChangelogMarkers.changelog) {
        header = false;
        reading = true;
      }
    } else if (reading) {
      if (conventionalChangelogMarkers.isVersionMarker(line)) {
        break;
      }
      data += line + "\n";
    } else if (line === conventionalChangelogMarkers.version(version)) {
      header = true;
    }
  }

  return data;
}
