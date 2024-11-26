export interface ILogger {
  /**
   * Logs a message with the "info" level.
   * @param {any[]} messages - The messages to log.
   */
  info(...messages: any[]): void;

  /**
   * Logs a message with the "warn" level.
   * @param {any[]} messages - The messages to log.
   */
  warn(...messages: any[]): void;

  /**
   * Logs a message with the "error" level.
   * @param {any[]} messages - The messages to log.
   */
  error(...messages: any[]): void;
}
