export function createProblemMatcher() {
  const beginPattern =
    /^([^\s].*)[\(:](\d+)[,:](\d+)(?:\):\s+|\s+-\s+)(error|warning|info)\s+TS(\d+)\s*:\s*(.*)$/g;

  return (value: string) => {
    const match = beginPattern.exec(value);
    if (!match) return;

    const [, file, line, column, severity, code, message] =
      match as unknown as [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];

    return {
      file,
      line: parseInt(line, 10),
      column: parseInt(column, 10),
      severity,
      code,
      message,
    };
  };
}
