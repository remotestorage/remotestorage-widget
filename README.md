# remotestorage-widget [WORK IN PROGRESS]

Provides a connect-widget as add-on library for
[remoteStorage.js](https://github.com/remotestorage/remotestorage.js/).

## Usage

```js
import RemoteStorage from 'npm:remotestoragejs';
import Widget from 'npm:remotestorage-widget';

// ...

let remoteStorage = new RemoteStorage(/* options */);

remoteStorage.access.claim('bookmarks', 'rw');

new Widget(remoteStorage);

// ...
```

(This example is from an Ember.js app, using ember-browserify. But other than
the imports, the usage is the same in all scenarios.)

## Development / Customization

Install deps:

    npm install

Build, run, watch and open test app:

    npm run dev
