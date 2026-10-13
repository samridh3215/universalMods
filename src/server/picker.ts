// Native "choose folder / files" dialogs. The floor server runs on the user's own machine,
// so it can open the OS dialog and hand the absolute path(s) back to the browser, which
// can't read real paths from its own file pickers.
import { execFile } from 'node:child_process';

export type PickMode = 'folder' | 'files';
export type PickResult = { paths: string[] } | { cancelled: true };

// Prompts are fixed strings: nothing from the request is interpolated into a command.
const PROMPT: Record<PickMode, string> = {
  folder: 'Choose a folder',
  files: 'Choose files',
};

function command(mode: PickMode): [string, string[]] {
  if (process.platform === 'darwin') {
    const choose =
      mode === 'folder' ? `choose folder with prompt "${PROMPT.folder}"` : `choose file with prompt "${PROMPT.files}" with multiple selections allowed`;
    // `activate` brings the dialog in front of the browser.
    const script =
      mode === 'folder'
        ? `POSIX path of (${choose})`
        : `set out to ""\nrepeat with f in (${choose})\nset out to out & POSIX path of f & linefeed\nend repeat\nout`;
    return ['osascript', ['-e', 'activate', '-e', script]];
  }
  if (process.platform === 'win32') {
    const ps =
      mode === 'folder'
        ? `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = '${PROMPT.folder}'; if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath } else { exit 1 }`
        : `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.OpenFileDialog; $d.Multiselect = $true; $d.Title = '${PROMPT.files}'; if ($d.ShowDialog() -eq 'OK') { $d.FileNames } else { exit 1 }`;
    return ['powershell', ['-NoProfile', '-STA', '-Command', ps]];
  }
  return mode === 'folder'
    ? ['zenity', ['--file-selection', '--directory', `--title=${PROMPT.folder}`]]
    : ['zenity', ['--file-selection', '--multiple', '--separator=\n', `--title=${PROMPT.files}`]];
}

/** Open the OS dialog and wait for the user. Resolves with the chosen paths or `cancelled`. */
export function pick(mode: PickMode): Promise<PickResult> {
  const [cmd, args] = command(mode);
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 10 * 60_000 }, (err, stdout) => {
      if (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'ENOENT') return reject(new Error(`No system file dialog available here (${cmd} not found). Type the path instead.`));
        // osascript exits 1 with -128, zenity/PowerShell exit 1 on cancel.
        return resolve({ cancelled: true });
      }
      const paths = stdout
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((p) => (p.length > 1 ? p.replace(/[\\/]$/, '') : p));
      resolve(paths.length ? { paths } : { cancelled: true });
    });
  });
}
