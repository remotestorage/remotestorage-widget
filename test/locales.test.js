import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import locales from '../src/locales/index.js';

const en = locales.en;
const placeholders = s => (s.match(/\{\w+\}/g) || []).sort();

describe('locales', () => {
  for (const [lang, dict] of Object.entries(locales)) {
    describe(lang, () => {
      it('has exactly the same keys as en', () => {
        expect(Object.keys(dict).sort()).toEqual(Object.keys(en).sort());
      });

      it('keeps the same placeholders as en', () => {
        for (const key of Object.keys(en)) {
          expect(placeholders(dict[key]), key).toEqual(placeholders(en[key]));
        }
      });

      it('has no empty strings', () => {
        for (const [key, value] of Object.entries(dict)) {
          expect(value.trim(), key).not.toBe('');
        }
      });
    });
  }

  it('covers every key used in widget.html', () => {
    const html = readFileSync(resolve(__dirname, '../src/assets/widget.html'), 'utf8');
    const used = [...html.matchAll(/data-i18n(?:-title|-placeholder)?="([^"]+)"/g)].map(m => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const key of used) {
      expect(en, key).toHaveProperty([key]);
    }
  });
});
