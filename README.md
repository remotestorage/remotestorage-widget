# remotestorage-widget

[![npm](https://img.shields.io/npm/v/remotestorage-widget.svg)](https://www.npmjs.com/package/remotestorage-widget)

A ready-to-use connect/sync widget, as add-on library for
[remoteStorage.js](https://github.com/remotestorage/remotestorage.js/).

## Usage

```js
import RemoteStorage from 'remotestoragejs';
import Widget from 'remotestorage-widget';

// ...

const remoteStorage = new RemoteStorage(/* options */);

remoteStorage.access.claim('bookmarks', 'rw');

const widget = new Widget(remoteStorage);
widget.attach();

// ...
```

## Configuration

The widget has some configuration options to customize the behavior:

| Option | Description | Type | Default |
|---|---|---|---|
| `leaveOpen` | Keep the widget open when user clicks outside of it | Boolean | `false` |
| `autoCloseAfter` | Timeout after which the widget closes automatically (in milliseconds). The widget only closes when a storage is connected. | Number | `1500` |
| `skipInitial` | Don't show the initial connect hint, but show sign-in screen directly instead | Boolean | `false` |
| `logging` | Enable logging for debugging purposes | Boolean | `false` |
| `modalBackdrop` | Show a dark, transparent backdrop when opening the widget for connecting an account. `true` shows backdrop everywhere, `false` turns it off everywhere. Default is to only show it on small screens. | Boolean, String | `"onlySmallScreens"` |
| `language` | Language of the widget's UI, as a [language tag](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language) like `"es"` or `"es-MX"`. Set it if your app has its own language switcher. See [Translations](#translations). | String | Browser's preferred language if supported, otherwise `"en"` |
| `t` | Translation function `(key, language) => string`, to translate the widget with your app's own i18n library. See [Translations](#translations). | Function | none |

Example:

```js
const widget = new Widget(remoteStorage, { autoCloseAfter: 2000 });
```

## Translations

The widget ships with these languages: English (`en`) and Spanish (`es`).

By default it uses the first of the browser's preferred languages
(`navigator.languages`, then `navigator.language`) it has a translation for,
falling back to English.
Regional variants fall back to their base language (`es-MX` uses `es`).
Apps with their own language setting should pass it explicitly:

```js
const widget = new Widget(remoteStorage, { language: 'es' });
```

To translate the widget with your app's own i18n library, or to use a
language the widget doesn't ship, pass a `t` function. It receives a message
key (see [`src/locales/en.json`](src/locales/en.json) for all of them) and
the widget's language. Return `undefined`, an empty string, or the key itself
to fall back to the widget's built-in translation:

```js
const widget = new Widget(remoteStorage, {
  language: i18next.language,
  t: (key) => i18next.t(key, { ns: 'rs-widget' })
});
```

Placeholders like `{link}` mark where a link goes within a sentence. If a
translation leaves one out, the link is appended at the end of the sentence.

Errors reported by remoteStorage.js are shown with their own (English)
message. An error that carries a `code` is first looked up as
`error.<code>`, but current remoteStorage.js releases don't set codes on the
errors the widget displays, so there are no such keys in the locales yet.

### Contributing a translation

1. Copy `src/locales/en.json` to `src/locales/<language>.json` and translate
   the values. Keep the keys and any `{placeholders}` unchanged.
2. Register it in `src/locales/index.js`.
3. Add it to the list of languages above.
4. Run `npm test`, which checks that every locale has the same keys and
   placeholders as English.

## Available Functions

`attach(elementID)` - Attach the widget to the DOM and display it. You can
use an optional element ID that the widget should be attached to.
Otherwise it will be attached to the body.

While the `attach()` method is required for the widget to be actually
shown, the following functions are usually not needed. They allow for
fine-tuning the experience.

`close()` - Close/minimize the widget to only show the icon.

`open()` - Open the widget when it's minimized.

`toggle()` - Switch between open and closed state.

## Development / Customization

Install deps:

    npm install

Build, run and watch demo/test app:

    npm start

The demo app will then be served at http://localhost:8008

Run the tests:

    npm test
