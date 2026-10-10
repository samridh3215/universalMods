// Runs an agent CLI interactively in a pseudo-terminal so the browser can show (and
// type into) the real TUI. Floor-level status still comes from the CLI's hooks.
import pty, { type IPty } from 'node-pty';

const RING = 400_000;

/** Prompt the CLI shows before it is usable, and the keys that answer it. */
export interface AutoAnswer {
  /** Tested against the recent screen with ANSI codes and whitespace stripped. */
  pattern: RegExp;
  keys: string[];
  /** Wait for the prompt to settle before pressing keys (Ink re-renders on start-up). */
  delayMs?: number;
}

export interface PtyOptions {
  bin: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  cols?: number;
  rows?: number;
  autoAnswers?: AutoAnswer[];
  onData(data: string): void;
  onExit(code: number): void;
}

const plain = (s: string) =>
  s
    .replace(/\x1b\[[0-9;?<>=]*[ -/]*[@-~]/g, '')
    .replace(/\x1b[\]P][^\x07\x1b]*(\x07|\x1b\\)/g, '')
    .replace(/\x1b./g, '')
    .replace(/\s+/g, '');

export class PtySession {
  private p: IPty;
  private buf = '';
  private answered = new Set<number>();
  private readyResolve!: () => void;
  /** Resolves once the CLI reports SessionStart (see markReady). */
  readonly ready: Promise<void>;
  cols: number;
  rows: number;
  alive = true;

  constructor(private o: PtyOptions) {
    this.cols = o.cols ?? 120;
    this.rows = o.rows ?? 32;
    this.ready = new Promise((r) => (this.readyResolve = r));
    this.p = pty.spawn(o.bin, o.args, {
      name: 'xterm-256color',
      cols: this.cols,
      rows: this.rows,
      cwd: o.cwd,
      env: { ...process.env, ...o.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' } as Record<string, string>,
    });
    this.p.onData((d) => {
      this.buf = (this.buf + d).slice(-RING);
      this.autoAnswer();
      o.onData(d);
    });
    this.p.onExit(({ exitCode }) => {
      this.alive = false;
      this.readyResolve();
      o.onExit(exitCode);
    });
  }

  private autoAnswer() {
    const answers = this.o.autoAnswers ?? [];
    if (!answers.length || this.answered.size === answers.length) return;
    const screen = plain(this.buf.slice(-6000));
    answers.forEach((a, i) => {
      if (this.answered.has(i) || !a.pattern.test(screen)) return;
      this.answered.add(i);
      let t = a.delayMs ?? 2000;
      for (const k of a.keys) {
        setTimeout(() => this.alive && this.p.write(k), t);
        t += 600;
      }
    });
  }

  markReady() {
    this.readyResolve();
  }

  get buffer() {
    return this.buf;
  }

  /** Raw keystrokes from a viewer. */
  write(data: string) {
    if (this.alive) this.p.write(data);
  }

  resize(cols: number, rows: number) {
    if (!this.alive || cols < 10 || rows < 4) return;
    this.cols = cols;
    this.rows = rows;
    this.p.resize(cols, rows);
  }

  /** Type a prompt as one bracketed paste (keeps newlines intact) and press Enter. */
  async submit(text: string, timeoutMs = 120_000) {
    const ok = await Promise.race([this.ready.then(() => true), new Promise<boolean>((r) => setTimeout(() => r(false), timeoutMs))]);
    if (!ok) throw new Error('agent did not become ready (answer any prompt in its terminal)');
    if (!this.alive) throw new Error('agent terminal has exited');
    this.p.write(`\x1b[200~${text}\x1b[201~`);
    await new Promise((r) => setTimeout(r, 400));
    this.p.write('\r');
  }

  interrupt() {
    this.write('\x1b');
  }

  kill() {
    if (!this.alive) return;
    this.p.kill('SIGTERM');
    setTimeout(() => this.alive && this.p.kill('SIGKILL'), 3000);
  }
}
