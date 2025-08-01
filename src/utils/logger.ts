export class Logger {
  public info(message: string): void {
    const timestamp = new Date().toISOString();
    console.info(`${timestamp} [INFO] ${message}`);
  }

  public error(message: string): void {
    const timestamp = new Date().toISOString();
    console.error(`${timestamp} [ERROR] ${message}`);
  }
}

export const logger = new Logger();