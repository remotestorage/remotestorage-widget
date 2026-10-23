// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);

function buildProduction () {
  process.env.NODE_ENV = 'production';
  const webpack = require('webpack');
  const config = require('../webpack.config.js');
  const outDir = mkdtempSync(path.join(tmpdir(), 'rs-widget-build-'));

  return new Promise((resolve, reject) => {
    webpack({ ...config, output: { ...config.output, path: outDir } }, (err, stats) => {
      if (err || stats.hasErrors()) return reject(err || new Error(stats.toString('errors-only')));
      const bundle = readFileSync(path.join(outDir, config.output.filename), 'utf8');
      rmSync(outDir, { recursive: true, force: true });
      resolve(bundle);
    });
  });
}

describe('production build', () => {
  // Pages served without a UTF-8 charset decode scripts as windows-1252,
  // which turns "¿Necesitas ayuda?" into "Â¿Necesitas ayuda?"
  it('is plain ASCII, so translations survive any page encoding', async () => {
    const bundle = await buildProduction();
    expect(bundle).toContain('Necesitas ayuda');
    expect(bundle.match(/[^\x00-\x7f]/g) ?? []).toEqual([]);
  }, 30000);
});
