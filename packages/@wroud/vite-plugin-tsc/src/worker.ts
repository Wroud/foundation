import ts from "typescript";
import { parentPort, workerData } from "node:worker_threads";

interface WorkerData {
  tscArgs: string[];
  watch: boolean;
  prebuild?: boolean;
}

const { tscArgs, watch, prebuild } = workerData as WorkerData;

function send(message: any) {
  parentPort?.postMessage(message);
}

const reportDiagnostic = (diagnostic: ts.Diagnostic) => {
  const message = ts.flattenDiagnosticMessageText(
    diagnostic.messageText,
    ts.sys.newLine,
  );
  const category = ts.DiagnosticCategory[diagnostic.category].toLowerCase();
  const data: any = {
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
    data.file = diagnostic.file.fileName;
    data.line = line + 1;
    data.column = character + 1;
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

const parsed = ts.parseBuildCommand(tscArgs);
if (parsed.errors.length) {
  parsed.errors.forEach(reportDiagnostic);
}

const host = ts.createSolutionBuilderWithWatchHost(
  ts.sys,
  ts.createEmitAndSemanticDiagnosticsBuilderProgram,
  reportDiagnostic,
  reportStatus,
  reportStatus,
);

host.afterProgramEmitAndDiagnostics = (program) => {
  const diagnostics = ts.getPreEmitDiagnostics(program.getProgram());
  const hasError = diagnostics.some(
    (d) => d.category === ts.DiagnosticCategory.Error,
  );
  send({ type: "built", success: !hasError });
};

let exitStatus: ts.ExitStatus = ts.ExitStatus.Success;

if (prebuild || !watch) {
  exitStatus = ts
    .createSolutionBuilder(host, parsed.projects, parsed.buildOptions)
    .build();
}

if (watch) {
  exitStatus = ts
    .createSolutionBuilderWithWatch(
      host,
      parsed.projects,
      parsed.buildOptions,
      parsed.watchOptions,
    )
    .build();
}
send({ type: "done", success: exitStatus === ts.ExitStatus.Success });
process.exitCode = exitStatus;
