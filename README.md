# remotestorage-widget

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
| `leaveOpen` | Keep the widget open when user clicks outside of it | Boolean | false |
| `autoCloseAfter` | Timeout after which the widget closes automatically (in milliseconds). The widget only closes when a storage is connected. | Number | 1500 |

Example:

    const widget = new Widget(remoteStorage, { autoCloseAfter: 2000 });

## Development / Customization

Install deps:

    npm install

Build, run and watch demo/test app:

    npm run dev

The demo app will then be served at http://localhost:8008
