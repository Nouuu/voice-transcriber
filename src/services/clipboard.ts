import clipboardy from "clipboardy";

export interface ClipboardResult {
  success: boolean;
  error?: string;
}

export class ClipboardService {
  private clipboard: typeof clipboardy;

  constructor() {
    this.clipboard = clipboardy;
  }

  /**
   * Writes text to clipboard
   */
  public async writeText(text: string): Promise<ClipboardResult> {
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "Text cannot be empty"
      };
    }

    try {
      await this.clipboard.write(text);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write to clipboard: ${error}`
      };
    }
  }

  /**
   * Reads text from clipboard
   */
  public async readText(): Promise<ClipboardResult & { text?: string }> {
    try {
      const text = await this.clipboard.read();
      return { success: true, text };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read from clipboard: ${error}`
      };
    }
  }

  /**
   * Clears clipboard
   */
  public async clear(): Promise<ClipboardResult> {
    try {
      await this.clipboard.write("");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear clipboard: ${error}`
      };
    }
  }
}