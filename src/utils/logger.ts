export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export class Logger {
	private logLevel: LogLevel = LogLevel.INFO;
	private truncateThreshold = 1000;

	/**
	 * Set the minimum log level to display
	 * @param level - Minimum level (DEBUG, INFO, WARN, or ERROR)
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
	 * Set the truncation threshold used by logConditional
	 */
	public setTruncateThreshold(threshold: number): void {
		this.truncateThreshold = Math.max(0, Math.floor(threshold));
	}

	/**
	 * Get current truncation threshold
	 */
	public getTruncateThreshold(): number {
		return this.truncateThreshold;
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

	/**
	 * Log a potentially long piece of text using the rule:
	 * - if content length > threshold => write full content to DEBUG and a truncated version to INFO
	 * - else => write full content to INFO
	 * @param label - label to prefix the message (e.g., "Original", "Formatted")
	 * @param content - the text to log
	 * @param threshold - truncation threshold in characters (optional). If not provided, uses the logger's configured threshold.
	 */
	public logConditional(
		label: string,
		content: string,
		threshold?: number
	): void {
		if (!content) return;
		const t = threshold ?? this.truncateThreshold;
		if (content.length > t) {
			// Full content available in debug for troubleshooting
			this.debug(`${label} (full): "${content}"`);
			// Truncated version in info to avoid flooding standard logs
			const truncated = content.slice(0, t);
			this.info(
				`${label}: "${truncated}"... (truncated, total ${content.length} chars)`
			);
		} else {
			this.info(`${label}: "${content}"`);
		}
	}
}

export const logger = new Logger();
