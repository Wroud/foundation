import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTscOutputParser, type TscMessage } from "./parseTscOutput.js";

const cwd = path.resolve("/project");

function parse(...chunks: string[]) {
  const messages: TscMessage[] = [];
  const parser = createTscOutputParser(cwd, (m) => messages.push(m));
  chunks.forEach(parser.write);
  parser.end();
  return messages;
}

describe("createTscOutputParser", () => {
  it("parses diagnostics with location relative to cwd", () => {
    expect(
      parse(
        "b/src/index.ts(2,7): error TS2322: Type 'number' is not assignable to type 'string'.\n",
      ),
    ).toEqual([
      {
        type: "diagnostic",
        category: "error",
        code: 2322,
        message: "Type 'number' is not assignable to type 'string'.",
        loc: { file: path.join(cwd, "b/src/index.ts"), line: 2, column: 7 },
      },
    ]);
  });

  it("parses diagnostics without location", () => {
    expect(parse("error TS5072: Unknown build option '--nope'.\n")).toEqual([
      {
        type: "diagnostic",
        category: "error",
        code: 5072,
        message: "Unknown build option '--nope'.",
      },
    ]);
  });

  it("joins indented continuation lines into the diagnostic message", () => {
    const messages = parse(
      "src/index.ts(2,26): error TS2322: Type 'string' is not assignable to type 'number'.\n" +
        "src/index.ts(4,3): error TS2345: Argument of type '(v: { k: number; }) => void' is not assignable to parameter of type '(v: { k: string; }) => void'.\n" +
        "  Types of parameters 'v' and 'v' are incompatible.\n" +
        "    Type '{ k: string; }' is not assignable to type '{ k: number; }'.\n",
    );

    expect(messages).toHaveLength(2);
    expect(messages[1]).toMatchObject({
      code: 2345,
      message:
        "Argument of type '(v: { k: number; }) => void' is not assignable to parameter of type '(v: { k: string; }) => void'.\n" +
        "  Types of parameters 'v' and 'v' are incompatible.\n" +
        "    Type '{ k: string; }' is not assignable to type '{ k: number; }'.",
    });
  });

  it("strips timestamps from watch status lines", () => {
    expect(
      parse(
        "10:34:38 PM - Starting compilation in watch mode...\n\n",
        "b/src/index.ts(2,7): error TS2322: Type 'number' is not assignable to type 'string'.\n",
        "10:34:38 PM - Found 1 error. Watching for file changes.\n\n",
        "22:36:46 - File change detected. Starting incremental compilation...\n\n",
      ).map((m) => [m.type, m.message]),
    ).toEqual([
      ["status", "Starting compilation in watch mode..."],
      ["diagnostic", "Type 'number' is not assignable to type 'string'."],
      ["status", "Found 1 error. Watching for file changes."],
      ["status", "File change detected. Starting incremental compilation..."],
    ]);
  });

  it("keeps multi-line status messages together", () => {
    expect(
      parse(
        "10:34:26 PM - Projects in this build: \n    * a/tsconfig.json\n    * b/tsconfig.json\n\n",
      ),
    ).toEqual([
      {
        type: "status",
        message:
          "Projects in this build: \n    * a/tsconfig.json\n    * b/tsconfig.json",
      },
    ]);
  });

  it("handles lines split across chunks and CRLF line endings", () => {
    expect(
      parse(
        "src/a.ts(1,1): war",
        "ning TS6133: 'x' is declared but its value is never read.\r\n",
        "src/b.ts(3,5): error TS2304: Cannot find name 'y'.",
      ).map(
        (m) => m.type === "diagnostic" && [m.category, m.code, m.loc?.file],
      ),
    ).toEqual([
      ["warning", 6133, path.join(cwd, "src/a.ts")],
      ["error", 2304, path.join(cwd, "src/b.ts")],
    ]);
  });
});
