const DEFAULT_LANGUAGE = 'en';

// Lowercase and accept gettext-style underscores: "es_MX" -> "es-mx"
const normalizeTag = tag => tag.toLowerCase().replace('_', '-');
const baseTag = tag => normalizeTag(tag).split('-')[0];

/**
 * Find the entry in `available` matching a language tag, trying the exact tag
 * first and then its base language (e.g. "es-MX" -> "es").
 *
 * @private
 */
function matchTag (tag, available) {
  const wanted = normalizeTag(tag);
  const base = baseTag(tag);
  return available.find(l => normalizeTag(l) === wanted)
      || available.find(l => normalizeTag(l) === base);
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
 * @param {string[]} [preferred] - Browser languages, most preferred first
 * @param {string[]} available   - Languages with a built-in dictionary
 * @returns {string} BCP 47 language tag
 */
export function resolveLanguage (requested, preferred, available) {
  if (requested) return requested;
  return (preferred || []).find(tag => matchTag(tag, available)) || DEFAULT_LANGUAGE;
}

/**
 * Decide the widget's HTML `lang` attribute.
 *
 * Without a built-in dictionary or an app `t`, every string falls back to
 * English, so declare English. With an app `t`, trust the language: whether
 * it translates a given key is only known at runtime.
 *
 * @param {string}  language - Resolved language tag
 * @param {object}  locales  - Built-in dictionaries by language
 * @param {boolean} hasT     - Whether the app provided its own `t`
 * @returns {string} BCP 47 language tag
 */
export function resolveHtmlLang (language, locales, hasT) {
  const translatable = hasT || matchTag(language, Object.keys(locales));
  // HTML needs BCP 47 tags; gettext-style "es_MX" becomes "es-MX"
  return translatable ? language.replace(/_/g, '-') : DEFAULT_LANGUAGE;
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
  const match = language && matchTag(language, Object.keys(locales));
  const dictionary = match ? locales[match] : {};
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
 * a sentence. A slot whose placeholder is missing from the text is appended
 * at the end, so a translation can never drop a link. Text is always inserted
 * as text, never parsed as HTML.
 *
 * @param {HTMLElement} element
 * @param {string}      text
 */
export function translateElement (element, text) {
  const slots = new Map();
  element.querySelectorAll('[data-i18n-slot]').forEach(el => {
    slots.set(el.getAttribute('data-i18n-slot'), el);
  });

  element.textContent = '';
  text.split(/(\{\w+\})/).forEach(part => {
    const name = part.match(/^\{(\w+)\}$/)?.[1];
    if (name && slots.has(name)) {
      element.appendChild(slots.get(name));
      slots.delete(name);
    } else if (part) {
      element.appendChild(document.createTextNode(part));
    }
  });

  slots.forEach(slot => {
    if (element.textContent !== '') element.appendChild(document.createTextNode(' '));
    element.appendChild(slot);
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
  root.querySelectorAll('[data-i18n]').forEach(el => {
    translateElement(el, t(el.getAttribute('data-i18n')));
  });
  ['title', 'placeholder'].forEach(attr => {
    root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => {
      el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`)));
    });
  });
}
