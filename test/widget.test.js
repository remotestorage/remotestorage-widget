import { describe, it, expect, beforeEach } from 'vitest';
import Widget from '../src/widget.js';
import locales from '../src/locales/index.js';

// Minimal stand-in for a RemoteStorage instance
function fakeRemoteStorage () {
  const handlers = {};
  return {
    apiKeys: {},
    backend: 'remotestorage',
    remote: { userAddress: 'user@example.com' },
    on (event, fn) { (handlers[event] ||= []).push(fn); },
    emit (event, payload) { (handlers[event] || []).forEach(fn => fn(payload)); },
    hasFeature: () => true,
    connect () {},
    disconnect () {},
    reconnect () {}
  };
}

function attach (options) {
  const rs = fakeRemoteStorage();
  const widget = new Widget(rs, options);
  widget.attach();
  const root = document.getElementById('remotestorage-widget');
  return { rs, widget, root };
}

// All visible text plus translatable attributes
function renderedStrings (root) {
  const clone = root.cloneNode(true);
  // .rs-user holds the connected account address, not UI copy
  clone.querySelectorAll('style, svg, .rs-user').forEach(el => el.remove());
  const attrs = [...clone.querySelectorAll('[title], [placeholder]')]
    .flatMap(el => [el.getAttribute('title'), el.getAttribute('placeholder')])
    .filter(Boolean);
  return [clone.textContent, ...attrs].join('\n');
}

describe('Widget i18n', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // Override navigator's language properties on the instance for one test
  function withBrowserLanguages (props, fn) {
    Object.entries(props).forEach(([name, value]) => {
      Object.defineProperty(navigator, name, { value, configurable: true });
    });
    try {
      return fn();
    } finally {
      Object.keys(props).forEach(name => delete navigator[name]);
    }
  }

  it('renders English by default for English browsers', () => {
    withBrowserLanguages({ languages: ['en-US', 'en'] }, () => {
      const { root } = attach();
      expect(root.getAttribute('lang')).toBe('en-US');
      expect(renderedStrings(root)).toContain('Connect your storage');
    });
  });

  it('uses the browser language when none is given', () => {
    withBrowserLanguages({ languages: ['es-MX', 'en'] }, () => {
      const { root } = attach();
      expect(root.getAttribute('lang')).toBe('es-MX');
      expect(renderedStrings(root)).toContain(locales.es['connect.headline']);
    });
  });

  it('falls back to navigator.language when navigator.languages is missing', () => {
    withBrowserLanguages({ languages: undefined, language: 'es' }, () => {
      const { root } = attach();
      expect(root.getAttribute('lang')).toBe('es');
    });
  });

  it('rejects invalid language and t options', () => {
    expect(() => new Widget(fakeRemoteStorage(), { language: 42 })).toThrow(/options.language/);
    expect(() => new Widget(fakeRemoteStorage(), { t: 'nope' })).toThrow(/options.t/);
  });

  it('shows the connected address as text, not HTML', () => {
    const { rs, root } = attach({ language: 'en' });
    rs.remote.userAddress = '<b>user</b>@example.com';
    rs.emit('connected');
    const user = root.querySelector('.rs-user');
    expect(user.textContent).toBe('<b>user</b>@example.com');
    expect(user.children.length).toBe(0);
  });

  it('renders no English strings when set to Spanish', () => {
    const { root } = attach({ language: 'es' });
    const text = renderedStrings(root);
    for (const [key, english] of Object.entries(locales.en)) {
      if (english === locales.es[key]) continue; // identical in both languages
      // Placeholders like {link} are replaced, so compare the literal parts
      for (const part of english.split(/\{\w+\}/).map(s => s.trim()).filter(s => /\p{L}{2,}/u.test(s))) {
        expect(text, key).not.toContain(part);
      }
    }
    expect(text).toContain(locales.es['choose.descriptionLink']);
  });

  it('keeps the provider link inside the translated sentence', () => {
    const { root } = attach({ language: 'es' });
    const desc = root.querySelector('.rs-short-desc');
    const link = desc.querySelector('a.rs-help');
    expect(link.getAttribute('href')).toBe('https://remotestorage.io/');
    expect(link.textContent).toBe(locales.es['choose.descriptionLink']);
    expect(desc.textContent.replace(/\s+/g, ' ').trim()).toBe(
      locales.es['choose.description'].replace('{link}', locales.es['choose.descriptionLink'])
    );
  });

  it('translates status labels set at runtime', () => {
    const { rs, root } = attach({ language: 'es' });
    rs.emit('connected');
    const label = root.querySelector('.rs-box-connected .rs-sub-headline');
    expect(label.textContent).toBe(locales.es['status.connected']);
    rs.emit('network-offline');
    expect(label.textContent).toBe(locales.es['status.offline']);
  });

  it('translates the connecting state and keeps the spinner', () => {
    const { root } = attach({ language: 'es' });
    root.querySelector('input[name=rs-user-address]').value = 'user@example.com';
    root.querySelector('.rs-sign-in-form').dispatchEvent(new Event('submit'));
    const button = root.querySelector('.rs-connect');
    expect(button.textContent.trim()).toBe(locales.es['signIn.connecting']);
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('writes a valid lang attribute for underscore tags', () => {
    let seen;
    const { root } = attach({ language: 'es_MX', t: (key, lang) => { seen = lang; } });
    expect(root.getAttribute('lang')).toBe('es-MX');
    expect(seen).toBe('es_MX');
    expect(renderedStrings(root)).toContain(locales.es['connect.headline']);
  });

  it('declares English for a language it can only show in English', () => {
    const { root } = attach({ language: 'de' });
    expect(root.getAttribute('lang')).toBe('en');
    expect(renderedStrings(root)).toContain(locales.en['connect.headline']);
  });

  it('prefers an injected t and falls back to built-ins', () => {
    const t = key => key === 'signIn.connect' ? 'Verbinden' : key;
    const { root } = attach({ language: 'de', t });
    expect(root.getAttribute('lang')).toBe('de');
    expect(root.querySelector('.rs-connect').textContent).toBe('Verbinden');
    expect(renderedStrings(root)).toContain(locales.en['connect.headline']);
  });

  // rs.js doesn't set codes on displayed errors yet; this covers the mechanism
  // for when it does (see README "Translations")
  it('translates errors by code and falls back to the message', () => {
    const t = key => key === 'error.no_storage_info' ? 'Kein Speicher gefunden' : undefined;
    const { rs, root } = attach({ language: 'de', t });
    const box = root.querySelector('.rs-sign-in-error');

    rs.emit('error', { name: 'DiscoveryError', code: 'no_storage_info', message: 'No storage information found' });
    expect(box.textContent).toBe('Kein Speicher gefunden');

    rs.emit('error', { name: 'DiscoveryError', message: 'Not a valid user address or URL.' });
    expect(box.textContent).toBe('Not a valid user address or URL.');
  });

  it('renders error messages as text, not HTML', () => {
    const { rs, root } = attach({ language: 'en' });
    rs.emit('error', { name: 'DiscoveryError', message: '<img src=x onerror=alert(1)>' });
    const box = root.querySelector('.rs-sign-in-error');
    expect(box.querySelector('img')).toBeNull();
    expect(box.textContent).toBe('<img src=x onerror=alert(1)>');
  });
});
