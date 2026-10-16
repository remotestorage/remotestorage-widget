import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Mirror webpack's html-loader / asset/source: import these files as strings
const rawAssets = {
  name: 'raw-assets',
  enforce: 'pre',
  load (id) {
    if (/\.(html|css|svg)$/.test(id)) {
      return `export default ${JSON.stringify(readFileSync(id, 'utf8'))};`;
    }
  }
};

export default defineConfig({
  plugins: [rawAssets],
  test: {
    environment: 'happy-dom'
  }
});
