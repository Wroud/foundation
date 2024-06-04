import data from "../../../../coverage/coverage-summary.json";

export function getPackageJestSummary(packageName: string) {
  try {
    let branches: number | null = null;
    let functions: number | null = null;
    let lines: number | null = null;
    let statements: number | null = null;
    let files = 0;
    for (const [key, value] of Object.entries(data)) {
      if (!key.includes("/packages/" + packageName + "/")) {
        continue;
      }
      branches = (branches === null ? 0 : branches) + data.total.branches.pct;
      functions =
        (functions === null ? 0 : functions) + data.total.functions.pct;
      lines = (lines === null ? 0 : lines) + data.total.lines.pct;
      statements =
        (statements === null ? 0 : statements) + data.total.statements.pct;
      files++;
    }

    if (branches === null) {
      branches = 0;
    }
    if (functions === null) {
      functions = 0;
    }
    if (lines === null) {
      lines = 0;
    }
    if (statements === null) {
      statements = 0;
    }

    if (files === 0) {
      return {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
        total: 0,
      };
    }

    branches = Math.round((branches / files + Number.EPSILON) * 100) / 100;
    functions = Math.round((functions / files + Number.EPSILON) * 100) / 100;
    lines = Math.round((lines / files + Number.EPSILON) * 100) / 100;
    statements = Math.round((statements / files + Number.EPSILON) * 100) / 100;

    const total =
      Math.round(
        ((branches + functions + lines + statements) / 4 + Number.EPSILON) *
          100,
      ) / 100;

    return {
      branches,
      functions,
      lines,
      statements,
      total,
    };
  } catch (e) {
    console.error(e);
    return {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
      total: 0,
    };
  }
}
