export interface ConfigData {
  openaiApiKey: string;
  formatterEnabled: boolean;
}

export class Config {
  public openaiApiKey: string = "";
  public formatterEnabled: boolean = true;
  private configPath: string = "config.json";

  constructor(configPath?: string) {
    if (configPath) {
      this.configPath = configPath;
    }
  }

  public async load(): Promise<void> {
    try {
      const configFile = Bun.file(this.configPath);
      if (await configFile.exists()) {
        const data = await configFile.json() as Partial<ConfigData>;
        this.openaiApiKey = data.openaiApiKey || "";
        this.formatterEnabled = data.formatterEnabled ?? true;
      }
    } catch (error) {
      // Use defaults if config fails to load
    }
  }

  public async save(): Promise<void> {
    const data: ConfigData = {
      openaiApiKey: this.openaiApiKey,
      formatterEnabled: this.formatterEnabled
    };
    await Bun.write(this.configPath, JSON.stringify(data, null, 2));
  }
}