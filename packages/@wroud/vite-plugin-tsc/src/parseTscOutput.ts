import path from "node:path";

export type TscMessage =
  | {
      type: "diagnostic";
      category: string;
      code: number;
      message: string;
      loc?: { file: string; line: number; column: number };
    }
  | { type: "status"; message: string };

const diagnosticPattern =
  /^(?:(.+)\((\d+),(\d+)\): )?(error|warning|suggestion|message) TS(\d+): (.*)$/;
const statusPattern = /^\d{1,2}:\d{2}:\d{2}(?: [AP]M)? - (.*)$/;

export function createTscOutputParser(
  cwd: string,
  onMessage: (message: TscMessage) => void,
) {
  let buffer = "";
  let pending: TscMessage | null = null;

  function flush() {
    if (pending) {
      onMessage(pending);
      pending = null;
    }
  }

  function parseLine(line: string) {
    if (line.trim() === "") {
      flush();
      return;
    }

    if (pending && /^\s/.test(line)) {
      pending.message += "\n" + line;
      return;
    }

    flush();

    const diagnostic = diagnosticPattern.exec(line);
    if (diagnostic) {
      const [
        ,
        file,
        lineNumber,
        column,
        category = "error",
        code = "0",
        message = "",
      ] = diagnostic;
      pending = { type: "diagnostic", category, code: Number(code), message };
      if (file) {
        pending.loc = {
          file: path.resolve(cwd, file),
          line: Number(lineNumber),
          column: Number(column),
        };
      }
      return;
    }

    pending = {
      type: "status",
      message: statusPattern.exec(line)?.[1] ?? line,
    };
  }

  return {
    write(chunk: string) {
      const lines = (buffer + chunk).split(/\r?\n/);
      buffer = lines.pop() ?? "";
      lines.forEach(parseLine);
    },
    end() {
      if (buffer) {
        parseLine(buffer);
        buffer = "";
      }
      flush();
    },
  };
}
