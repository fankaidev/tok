import { exec as execCallback } from "child_process";
import { promisify } from "util";

const execAsync = promisify(execCallback);

export class BrowserError extends Error {
  constructor(
    message: string,
    public command: string,
    public stderr: string,
  ) {
    super(message);
    this.name = "BrowserError";
  }
}

export interface SnapshotOptions {
  interactive?: boolean;
  compact?: boolean;
  depth?: number;
  selector?: string;
}

export interface BrowserOptions {
  sessionName?: string;
  profile?: string;
  port?: number;
}

export class Browser {
  private session: string;
  private profile: string | undefined;
  private port: number | undefined;

  constructor(options?: BrowserOptions) {
    this.session = options?.sessionName ?? `tok-${Date.now()}`;
    this.profile = options?.profile;
    this.port = options?.port;
  }

  private async exec(command: string): Promise<string> {
    const flags: string[] = [`--session ${this.session}`];
    if (this.profile) flags.push(`--profile '${this.profile}'`);
    if (this.port) flags.push(`--cdp ${this.port}`);
    const fullCommand = `agent-browser ${flags.join(" ")} ${command}`;
    try {
      const { stdout } = await execAsync(fullCommand);
      return stdout.trim();
    } catch (error) {
      const err = error as { stderr?: string; message?: string };
      const stderr = err.stderr?.trim() || err.message || "Unknown error";
      throw new BrowserError(`agent-browser command failed: ${stderr}`, fullCommand, stderr);
    }
  }

  // Core
  async open(url: string): Promise<void> {
    await this.exec(`open '${url}'`);
  }

  async snapshot(options?: SnapshotOptions): Promise<string> {
    const flags: string[] = [];
    if (options?.interactive) flags.push("-i");
    if (options?.compact) flags.push("-c");
    if (options?.depth !== undefined) flags.push(`-d ${options.depth}`);
    if (options?.selector) flags.push(`-s '${options.selector}'`);
    return this.exec(`snapshot ${flags.join(" ")}`);
  }

  async click(ref: string): Promise<void> {
    await this.exec(`click @${ref}`);
  }

  async fill(ref: string, value: string): Promise<void> {
    const escaped = value.replace(/'/g, "'\\''");
    await this.exec(`fill @${ref} '${escaped}'`);
  }

  async close(): Promise<void> {
    await this.exec("close");
  }

  // Navigation
  async back(): Promise<void> {
    await this.exec("back");
  }

  async forward(): Promise<void> {
    await this.exec("forward");
  }

  async reload(): Promise<void> {
    await this.exec("reload");
  }

  async scroll(direction: "up" | "down" | "left" | "right", pixels?: number): Promise<void> {
    const args = pixels !== undefined ? `${direction} ${pixels}` : direction;
    await this.exec(`scroll ${args}`);
  }

  async wait(selectorOrMs: string | number): Promise<void> {
    await this.exec(`wait ${selectorOrMs}`);
  }

  // Interaction
  async type(ref: string, text: string): Promise<void> {
    const escaped = text.replace(/'/g, "'\\''");
    await this.exec(`type @${ref} '${escaped}'`);
  }

  async press(key: string): Promise<void> {
    await this.exec(`press ${key}`);
  }

  async hover(ref: string): Promise<void> {
    await this.exec(`hover @${ref}`);
  }

  // Info
  async screenshot(path?: string): Promise<string> {
    return this.exec(path ? `screenshot '${path}'` : "screenshot");
  }

  async getTitle(): Promise<string> {
    return this.exec("get title");
  }

  async getUrl(): Promise<string> {
    return this.exec("get url");
  }

  async getText(ref: string): Promise<string> {
    return this.exec(`get text @${ref}`);
  }
}
