// Bundles the browser shell (src/web) with esbuild in memory and rebuilds on change.
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

export interface WebAssets {
  get(pathname: string): Promise<{ body: string | Buffer; type: string } | undefined>;
}

export function webAssets(webDir: string, log: (...a: unknown[]) => void): WebAssets {
  let js: string | undefined;
  let building: Promise<void> | undefined;

  const build = async () => {
    const res = await esbuild.build({
      entryPoints: [path.join(webDir, 'main.tsx')],
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'browser',
      jsx: 'automatic',
      minify: false,
      sourcemap: 'inline',
      define: { 'process.env.NODE_ENV': '"development"' },
      logLevel: 'silent',
    });
    js = res.outputFiles[0].text;
  };

  fs.watch(webDir, { recursive: true }, () => {
    js = undefined;
  });

  return {
    async get(p) {
      if (p === '/' || p === '/index.html') return { body: fs.readFileSync(path.join(webDir, 'index.html'), 'utf8'), type: 'text/html' };
      if (p === '/app.css') return { body: fs.readFileSync(path.join(webDir, 'styles.css'), 'utf8'), type: 'text/css' };
      if (p === '/app.js') {
        if (!js) {
          building ??= build()
            .catch((e) => {
              log('[web] build failed:', e.message);
              js = `document.body.textContent = ${JSON.stringify('UI build failed: ' + e.message)};`;
            })
            .finally(() => (building = undefined));
          await building;
        }
        return { body: js!, type: 'text/javascript' };
      }
      // Static files (favicon, icons, manifest, images) from src/web/public.
      const pub = path.join(webDir, 'public');
      const file = path.normalize(path.join(pub, decodeURIComponent(p)));
      if (file.startsWith(pub + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        return { body: fs.readFileSync(file), type: MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream' };
      }
      return undefined;
    },
  };
}

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};
