export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export class Logger {
	private logLevel: LogLevel = LogLevel.INFO;

	/**
	 * Set the minimum log level to display
	 * @param level - Minimum level (DEBUG, INFO, or ERROR)
	 */
	public setLogLevel(level: LogLevel): void {
		this.logLevel = level;
	}

	/**
	 * Get current log level
	 */
	public getLogLevel(): LogLevel {
		return this.logLevel;
	}

	/**
	 * Log debug information (only shown when level is DEBUG)
	 */
	public debug(message: string): void {
		if (this.logLevel <= LogLevel.DEBUG) {
			const timestamp = new Date().toISOString();
			console.log(`${timestamp} [DEBUG] ${message}`);
		}
	}

	public info(message: string): void {
		if (this.logLevel <= LogLevel.INFO) {
			const timestamp = new Date().toISOString();
			console.info(`${timestamp} [INFO] ${message}`);
		}
	}

	public warn(message: string): void {
		if (this.logLevel <= LogLevel.WARN) {
			const timestamp = new Date().toISOString();
			console.warn(`${timestamp} [WARN] ${message}`);
		}
	}

	public error(message: string): void {
		if (this.logLevel <= LogLevel.ERROR) {
			const timestamp = new Date().toISOString();
			console.error(`${timestamp} [ERROR] ${message}`);
		}
	}
}

export const logger = new Logger();
