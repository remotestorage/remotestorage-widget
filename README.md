# remotestorage-widget [WORK IN PROGRESS]

Provides a connect-widget as add-on library for remoteStorage.js.

## Usage

This example is from an Ember.js app, using ember-browserify, but other than
the imports, the usage is the same in all scenarios:

```js
import RemoteStorage from 'npm:remotestoragejs';
import Widget from 'npm:remotestorage-widget';

// ...

let remoteStorage = new RemoteStorage(/* options */);

remoteStorage.access.claim('bookmarks', 'rw');

new Widget(remoteStorage);

// ...
```

## Development / Customization

Install deps:

    npm install

Build, run, watch and open test app:

    npm run dev
