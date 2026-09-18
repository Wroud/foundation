import ts from "typescript";
import path from "node:path";
import { parentPort, workerData } from "node:worker_threads";
import type { TscMessage } from "./parseTscOutput.js";

interface WorkerData {
  tscArgs: string[];
  watch: boolean;
}

const { tscArgs, watch } = workerData as WorkerData;

function send(message: TscMessage) {
  parentPort?.postMessage(message);
}

const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
  const message = ts.flattenDiagnosticMessageText(
    diagnostic.messageText,
    ts.sys.newLine,
  );
  const category = ts.DiagnosticCategory[diagnostic.category].toLowerCase();
  const data: TscMessage = {
    type: "diagnostic",
    category,
    message,
    code: diagnostic.code,
  };
  if (diagnostic.file && typeof diagnostic.start === "number") {
    const { line, character } = ts.getLineAndCharacterOfPosition(
      diagnostic.file,
      diagnostic.start,
    );
    data.loc = {
      file: diagnostic.file.fileName,
      line: line + 1,
      column: character + 1,
    };
  }
  send(data);
};

const reportStatus = (diagnostic: ts.Diagnostic) => {
  send({
    type: "status",
    message: ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      ts.sys.newLine,
    ),
  });
};

function build(): ts.ExitStatus {
  const parsed = ts.parseBuildCommand(tscArgs);
  parsed.errors.forEach(reportDiagnostic);

  const host = ts.createSolutionBuilderWithWatchHost(
    ts.sys,
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportStatus,
    reportStatus,
  );

  if (watch) {
    return ts
      .createSolutionBuilderWithWatch(
        host,
        parsed.projects,
        parsed.buildOptions,
        parsed.watchOptions,
      )
      .build();
  }

  return ts
    .createSolutionBuilder(host, parsed.projects, parsed.buildOptions)
    .build();
}

function findConfigFile({ options, fileNames }: ts.ParsedCommandLine) {
  if (options.project) {
    const project = path.resolve(options.project);
    return ts.sys.directoryExists(project)
      ? path.join(project, "tsconfig.json")
      : project;
  }
  if (fileNames.length) {
    return undefined;
  }
  return ts.findConfigFile(ts.sys.getCurrentDirectory(), ts.sys.fileExists);
}

function compile(): ts.ExitStatus {
  const parsed = ts.parseCommandLine(tscArgs);
  parsed.errors.forEach(reportDiagnostic);
  if (parsed.errors.length) {
    return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
  }

  const configFile = findConfigFile(parsed);
  if (!configFile && !parsed.fileNames.length) {
    send({
      type: "diagnostic",
      category: "error",
      code: 5081,
      message: `Cannot find a tsconfig.json file at the current directory: ${ts.sys.getCurrentDirectory()}.`,
    });
    return ts.ExitStatus.DiagnosticsPresent_OutputsSkipped;
  }

  let errorCount = 0;
  const report = (diagnostic: ts.Diagnostic) => {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errorCount++;
    }
    reportDiagnostic(diagnostic);
  };
  const status = watch ? reportStatus : () => {};
  const unwatched = () => ({ close() {} });
  const hostOverrides = watch
    ? {}
    : { watchFile: unwatched, watchDirectory: unwatched };

  const program = configFile
    ? ts.createWatchProgram(
        Object.assign(
          ts.createWatchCompilerHost(
            configFile,
            parsed.options,
            ts.sys,
            ts.createEmitAndSemanticDiagnosticsBuilderProgram,
            report,
            status,
            parsed.watchOptions,
          ),
          hostOverrides,
        ),
      )
    : ts.createWatchProgram(
        Object.assign(
          ts.createWatchCompilerHost(
            parsed.fileNames,
            parsed.options,
            ts.sys,
            ts.createEmitAndSemanticDiagnosticsBuilderProgram,
            report,
            status,
            parsed.projectReferences,
            parsed.watchOptions,
          ),
          hostOverrides,
        ),
      );

  if (!watch) {
    program.close();
  }

  return errorCount
    ? ts.ExitStatus.DiagnosticsPresent_OutputsGenerated
    : ts.ExitStatus.Success;
}

const exitStatus = /^--?(?:b|build)$/i.test(tscArgs[0] ?? "")
  ? build()
  : compile();

process.exitCode = exitStatus;
