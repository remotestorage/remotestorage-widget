const DEFAULT_LANGUAGE = 'en';

const baseTag = tag => tag.toLowerCase().split('-')[0];

/**
 * Find the dictionary for a language tag, trying the exact tag first and then
 * its base language (e.g. "es-MX" -> "es").
 *
 * @private
 */
function findLocale (language, locales) {
  if (!language) return undefined;
  const tag = language.toLowerCase();
  const match = Object.keys(locales).find(l => l.toLowerCase() === tag)
             || Object.keys(locales).find(l => l.toLowerCase() === baseTag(tag));
  return match ? locales[match] : undefined;
}

/**
 * Decide which language the widget should use.
 *
 * An explicitly requested language always wins, even without a built-in
 * dictionary for it, since the app may translate via its own `t`. Otherwise
 * the first of the browser's preferred languages we have a dictionary for is
 * used, falling back to English.
 *
 * @param {string}   [requested] - Language requested via widget options
 * @param {string[]} [preferred] - Browser languages, e.g. navigator.languages
 * @param {string[]} available   - Languages with a built-in dictionary
 * @returns {string} BCP 47 language tag
 */
export function resolveLanguage (requested, preferred = [], available) {
  if (requested) return requested;
  const supported = available.map(l => l.toLowerCase());
  return (preferred || []).find(tag => {
    return supported.includes(tag.toLowerCase()) || supported.includes(baseTag(tag));
  }) || DEFAULT_LANGUAGE;
}

/**
 * Create a translation function.
 *
 * Lookup order: the app's own `t(key, language)` (if given), the built-in
 * dictionary for the language, then English. If nothing matches, the key
 * itself is returned. An app translation that is empty or equal to the key
 * counts as missing, which is what most i18n libraries return.
 *
 * @param {object}   config
 * @param {string}   config.language - Resolved language tag
 * @param {object}   config.locales  - Built-in dictionaries by language
 * @param {function} [config.t]      - App-provided translation function
 * @returns {function} (key) => string
 */
export function createTranslator ({ language, locales, t }) {
  const dictionary = findLocale(language, locales) || {};
  const fallback = locales[DEFAULT_LANGUAGE] || {};

  return (key) => {
    if (typeof t === 'function') {
      const translated = t(key, language);
      if (typeof translated === 'string' && translated !== '' && translated !== key) {
        return translated;
      }
    }
    return dictionary[key] ?? fallback[key] ?? key;
  };
}

/**
 * Replace an element's content with translated text.
 *
 * Placeholders like `{link}` are replaced by the element's child marked with
 * `data-i18n-slot="link"`, so translations can freely position markup within
 * a sentence. Text is always inserted as text, never parsed as HTML.
 *
 * @param {HTMLElement} element
 * @param {string}      text
 */
export function translateElement (element, text) {
  const slots = {};
  element.querySelectorAll('[data-i18n-slot]').forEach(el => {
    slots[el.getAttribute('data-i18n-slot')] = el;
  });

  element.textContent = '';
  text.split(/(\{\w+\})/).forEach(part => {
    const slot = part.match(/^\{(\w+)\}$/) && slots[part.slice(1, -1)];
    if (slot) {
      element.appendChild(slot);
    } else if (part) {
      element.appendChild(document.createTextNode(part));
    }
  });
}

/**
 * Translate all marked elements within a DOM tree:
 *
 * - `data-i18n="key"`             - element content
 * - `data-i18n-title="key"`       - title attribute
 * - `data-i18n-placeholder="key"` - placeholder attribute
 *
 * @param {HTMLElement} root
 * @param {function}    t    - Translation function from createTranslator
 */
export function translateDom (root, t) {
  // Translate slot children before their parents re-arrange them
  [...root.querySelectorAll('[data-i18n]')].reverse().forEach(el => {
    translateElement(el, t(el.getAttribute('data-i18n')));
  });
  ['title', 'placeholder'].forEach(attr => {
    root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
      el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`)));
    });
  });
}
