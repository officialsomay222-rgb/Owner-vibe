const isDev = import.meta.env.DEV;

/**
 * A centralized logger utility to manage application logs.
 * In development mode, all logs are shown.
 * In production mode, only warnings and errors are shown to keep the console clean
 * and focus on critical issues.
 */
export const Logger = {
  /**
   * Logs informational messages. Only visible in development.
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Logs general messages. Only visible in development.
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Logs debug messages. Only visible in development.
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Logs warnings. Always visible.
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Logs errors. Always visible.
   */
  error: (...args: any[]) => {
    console.error(...args);
  }
};
