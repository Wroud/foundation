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

  let reading = false;
  for await (const line of createInterface(
    createReadStream(changeLogFile, {
      flags: "r",
    }),
  )) {
    if (reading) {
      if (conventionalChangelogMarkers.isVersionMarker(line)) {
        break;
      }
      data += line + "\n";
    } else if (line === conventionalChangelogMarkers.version(version)) {
      reading = true;
    }
  }

  return data;
}
