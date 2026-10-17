import { describe, it, expect } from 'vitest';
import { resolveLanguage, createTranslator, translateElement, translateDom } from '../src/i18n.js';

const locales = {
  en: { 'a': 'A en', 'b': 'B en' },
  es: { 'a': 'A es' }
};

describe('resolveLanguage', () => {
  const available = ['en', 'es'];

  it('prefers the explicitly requested language', () => {
    expect(resolveLanguage('es', ['en-US'], available)).toBe('es');
  });

  it('keeps a requested language even without a built-in dictionary', () => {
    // The app may provide its own `t` for it; it must win over the browser
    expect(resolveLanguage('fr', ['es'], available)).toBe('fr');
  });

  it('uses the first supported browser language', () => {
    expect(resolveLanguage(undefined, ['fr-FR', 'es-MX', 'en'], available)).toBe('es-MX');
  });

  it('matches browser languages case-insensitively by base tag', () => {
    expect(resolveLanguage(undefined, ['ES-ar'], available)).toBe('ES-ar');
  });

  it('accepts gettext-style underscores', () => {
    expect(resolveLanguage(undefined, ['es_MX'], available)).toBe('es_MX');
    expect(createTranslator({ language: 'es_MX', locales })('a')).toBe('A es');
  });

  it('falls back to English', () => {
    expect(resolveLanguage(undefined, ['fr', 'de'], available)).toBe('en');
    expect(resolveLanguage(undefined, [], available)).toBe('en');
    expect(resolveLanguage(undefined, undefined, available)).toBe('en');
  });
});

describe('createTranslator', () => {
  it('translates from the matching dictionary', () => {
    expect(createTranslator({ language: 'es', locales })('a')).toBe('A es');
  });

  it('falls back from a regional tag to its base language', () => {
    expect(createTranslator({ language: 'es-MX', locales })('a')).toBe('A es');
  });

  it('falls back to English for keys missing in a locale', () => {
    expect(createTranslator({ language: 'es', locales })('b')).toBe('B en');
  });

  it('falls back to English for unknown languages', () => {
    expect(createTranslator({ language: 'fr', locales })('a')).toBe('A en');
  });

  it('returns the key when nothing matches', () => {
    expect(createTranslator({ language: 'es', locales })('nope')).toBe('nope');
  });

  it('lets an injected t win', () => {
    const t = key => key === 'a' ? 'A app' : undefined;
    const translate = createTranslator({ language: 'es', locales, t });
    expect(translate('a')).toBe('A app');
  });

  it('falls back to built-ins when the injected t has no translation', () => {
    // i18next-style libraries return the key itself for missing translations
    const translate = createTranslator({ language: 'es', locales, t: key => key });
    expect(translate('a')).toBe('A es');
    expect(createTranslator({ language: 'es', locales, t: () => '' })('a')).toBe('A es');
    expect(createTranslator({ language: 'es', locales, t: () => null })('b')).toBe('B en');
  });

  it('passes the resolved language to the injected t', () => {
    let seen;
    createTranslator({ language: 'es-MX', locales, t: (key, lang) => { seen = lang; } })('a');
    expect(seen).toBe('es-MX');
  });
});

describe('translateElement', () => {
  it('sets plain text', () => {
    const el = document.createElement('span');
    translateElement(el, 'Hola <b>mundo</b>');
    expect(el.textContent).toBe('Hola <b>mundo</b>');
    expect(el.children.length).toBe(0);
  });

  it('places slot elements where their placeholder is', () => {
    const el = document.createElement('p');
    el.innerHTML = 'Before <a data-i18n-slot="link" href="https://example.com">link</a> after';
    translateElement(el, '{link} va primero.');
    expect(el.textContent).toBe('link va primero.');
    expect(el.firstChild.tagName).toBe('A');
    expect(el.firstChild.getAttribute('href')).toBe('https://example.com');
  });

  it('appends a slot whose placeholder the translation dropped', () => {
    const el = document.createElement('p');
    el.innerHTML = 'Before <a data-i18n-slot="link" href="https://example.com">link</a> after';
    translateElement(el, 'Sin enlace.');
    expect(el.querySelectorAll('a').length).toBe(1);
    expect(el.textContent).toBe('Sin enlace. link');
    expect(el.lastChild.tagName).toBe('A');
  });

  it('keeps unknown placeholders as text', () => {
    const el = document.createElement('p');
    translateElement(el, 'Hola {nobody}');
    expect(el.textContent).toBe('Hola {nobody}');
  });
});

describe('translateDom', () => {
  it('translates content, title and placeholder attributes', () => {
    const root = document.createElement('div');
    root.innerHTML = '<span data-i18n="a">x</span>' +
      '<button data-i18n-title="b" title="x"></button>' +
      '<input data-i18n-placeholder="a" placeholder="x">';
    translateDom(root, createTranslator({ language: 'es', locales }));
    expect(root.querySelector('span').textContent).toBe('A es');
    expect(root.querySelector('button').getAttribute('title')).toBe('B en');
    expect(root.querySelector('input').getAttribute('placeholder')).toBe('A es');
  });
});
