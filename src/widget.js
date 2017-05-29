/**
 * RemoteStorage connect widget
 * @constructor
 * @param {object} remoteStorage - remoteStorage instance
 * @param {object} options - Widget options
 *     leaveOpen: bool (default: false) do not minimize widget when user click outside of it
 *     domID: DOM element to attach widget to
 */
let Widget = function(remoteStorage, options={}) {
  this.rs = remoteStorage;

  this.state = 'initial';

  // true if we have remoteStorage connection's info
  this.active = false;

  // remoteStorage is connected!
  this.online = false;

  // widget is minimized ?
  this.closed = false;

  // logo will be gray when (active && !online)


  this.insertHtmlTemplate(options.domID);
  this.leaveOpen = options.leaveOpen ? options.leaveOpen : false;

  remoteStorage.on('connected', () => this.eventHandler('connected'));
  remoteStorage.on('ready', () => this.eventHandler('ready'));
  remoteStorage.on('disconnected', () => this.eventHandler('disconnected'));
  remoteStorage.on('network-online', () => this.eventHandler('network-online'));
  remoteStorage.on('network-offline', () => this.eventHandler('network-offline'));
  remoteStorage.on('error', (error) => this.eventHandler('error', error));

  this.rsWidget = document.querySelector('.rs-widget');
  this.rsInitial = document.querySelector('.rs-box-initial');
  this.rsChoose = document.querySelector('.rs-box-choose');
  this.rsConnected = document.querySelector('.rs-box-connected');
  this.rsSignIn = document.querySelector('.rs-box-sign-in');

  this.rsChooseRemoteStorageButton = document.querySelector('button.rs-choose-rs');
  this.rsChooseDropboxButton = document.querySelector('button.rs-choose-dropbox');
  this.rsChooseGoogleDriveButton = document.querySelector('button.rs-choose-gdrive');
  this.rsErrorBox = document.querySelector('.rs-box-error');

  // check if apyKeys is set for Dropbox or Google [googledrive, dropbox]
  // to show/hide relative buttons only if needed
  if (! remoteStorage.apiKeys.hasOwnProperty('googledrive')) {
    this.rsChooseGoogleDriveButton.parentNode.removeChild(this.rsChooseGoogleDriveButton);
  }

  if (! remoteStorage.apiKeys.hasOwnProperty('dropbox')) {
    this.rsChooseDropboxButton.parentNode.removeChild(this.rsChooseDropboxButton);
  }

  this.rsSignInForm = document.querySelector('.rs-sign-in-form');

  this.rsDisconnectButton = document.querySelector('.rs-disconnect');
  this.rsSyncButton = document.querySelector('.rs-sync');
  this.rsLogo = document.querySelector('.rs-main-logo');

  this.rsConnectedUser = document.querySelector('.rs-connected-text h1.rs-user');

  this.lastSynced = null;
  this.lastSyncedUpdateLoop = null;

  this.setEventListeners();
  this.setClickHandlers();
};


Widget.prototype = {

  log (...msg) {
    console.debug('[RS-WIDGET] ', ...msg);
  },

  // handle events !
  eventHandler (event, msg) {
    this.log('EVENT: ', event);
    switch (event) {
      case 'ready':
        this.setState(this.state);
        break;
      case 'req-done':
        this.rsSyncButton.classList.add("rs-rotate");
        break;
      case 'done':
        this.rsSyncButton.classList.remove("rs-rotate");

        if (this.rsWidget.classList.contains('rs-state-unauthorized') ||
            !this.rs.remote.online) {
          this.updateLastSyncedOutput();
        } else if (this.rs.remote.online) {
          this.lastSynced = new Date();
          let subHeadlineEl = document.querySelector('.rs-box-connected .rs-sub-headline');
          subHeadlineEl.innerHTML = 'Synced just now';
        }
        break;
      case 'disconnected':
        this.active = false;
        this.online = false;
        this.setState('initial');
        break;
      case 'connected':
        this.active = true;
        this.online = true;
        if (this.rs.hasFeature('Sync')) {
          this.rs.sync.on('req-done', () => this.eventHandler('req-done'));
          this.rs.sync.on('done', () => this.eventHandler('done'));
        } else {
          this.rsSyncButton.classList.add('hidden');
        }
        let connectedUser = this.rs.remote.userAddress;
        this.rsConnectedUser.innerHTML = connectedUser;
        this.setState('connected');
        break;
      case 'network-offline':
        this.online = false;
        // this.active = false;
        this.setState();
        break;
      case 'network-online':
        this.online = true;
        this.active = true;
        this.setState('connected');
        break;
      case 'error':
        if (msg.name === 'DiscoveryError') {
          this.handleDiscoveryError(msg);
        } else if (msg.name === 'SyncError') {
          this.handleSyncError(msg);
        } else if (msg.name === 'Unauthorized') {
          this.handleUnauthorized(msg);
        } else {
          console.debug('Encountered unhandled error', msg);
        }
        break;
    }

  },

  setState (state) {
    this.log('Setting state ', state);

    let lastSelected = document.querySelector('.rs-box.selected');
    // FIXME why is this an expression?
    lastSelected && lastSelected.classList.remove('selected');

    let toSelect = document.querySelector('.rs-box.rs-box-'+state);
    // FIXME why is this an expression?
    toSelect && toSelect.classList.add('selected');

    if (this.closed && state !== 'close') {
      this.rsWidget.className = `rs-widget rs-state-close rs-state-${state || this.state}`;
    } else {
      this.rsWidget.className = `rs-widget rs-state-${state || this.state}`;
    }

    if (!this.online && this.active) {
      this.rsWidget.classList.add('rs-state-offline');
    } else {
      this.rsWidget.classList.remove('rs-state-offline');
    }

    if (state) {
      this.state = state;
    }
  },

  /**
   * append widget to document DOM (inside specified elementId if specified)
   * @param  {String} elementId - widget's parent
   */
  insertHtmlTemplate(elementId=null) {
    const element = document.createElement('div');
    const style = document.createElement('style');
    style.innerHTML = require('raw!./assets/styles.css');

    element.id = "remotestorage-widget";
    element.innerHTML = require('html!./assets/widget.html');
    element.appendChild(style);

    if (elementId) {
      const parent = document.getElementById(elementId);
      if (!parent) {
        throw "Failed to find target DOM element with id=\"" + elementId + "\"";
      }
      parent.appendChild(element);
    } else {
      document.body.appendChild(element);
    }
  },

  setEventListeners() {
    // Sign-in form
    this.rsSignInForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let userAddress = document.querySelector('input[name=rs-user-address]').value;
      this.rs.connect(userAddress);
    });
  },

  setClickHandlers() {

    // Initial button
    this.rsInitial.addEventListener('click', () => {
      // choose backend only if some providers are declared
      if (this.rs.apiKeys) {
        this.setState('choose');
      } else {
        this.setState('sign-in');
      }
    });

    // Choose RS button
    this.rsChooseRemoteStorageButton.addEventListener('click', () => this.setState('sign-in') );

    // Choose Dropbox button
    this.rsChooseDropboxButton.addEventListener('click', () => this.rs["dropbox"].connect() );

    // Choose Google drive button
    this.rsChooseGoogleDriveButton.addEventListener('click', () => this.rs["googledrive"].connect() );

    // Disconnect button
    this.rsDisconnectButton.addEventListener('click', () => this.rs.disconnect() );

    // Sync button
    if (this.rs.hasFeature('Sync')) {
      this.rsSyncButton.addEventListener('click', () => {
        if (this.rsSyncButton.classList.contains('rs-rotate')) {
          this.rs.stopSync();
          this.rsSyncButton.classList.remove("rs-rotate");
        } else {
          this.rs.startSync();
          this.rsSyncButton.classList.add("rs-rotate");
        }
      });
    }

    // Reduce to icon only if connected and clicked outside of widget
    document.addEventListener('click', () => this.closeWidget() );

    // clicks on the widget stops the above event
    this.rsWidget.addEventListener('click', e => e.stopPropagation() );

    // Click on the logo to bring the full widget back
    this.rsLogo.addEventListener('click', () => this.openWidget());
  },

  openWidget() {
    this.closed = false;
    this.setState(this.active ? 'connected' : 'initial');
  },

  closeWidget() {
    if (!this.leaveOpen) {
      this.setState('close');
      this.closed = true;
    } else {
      this.setState(this.active ? 'connected' : 'initial');
    }
  },

  showErrorBox(errorMsg) {
    this.rsErrorBox.innerHTML = errorMsg;
    this.setState('error');
  },

  hideErrorBox() {
    this.rsErrorBox.innerHTML = '';
    this.setState('close');
  },

  handleDiscoveryError(error) {
    let msgContainer = document.querySelector('.rs-sign-in-error');
    msgContainer.innerHTML = error.message;
    msgContainer.classList.remove('hidden');
    msgContainer.classList.add('visible');
  },

  handleSyncError(/* error */) {
    // console.debug('Encountered SyncError', error);
    this.showErrorBox('App sync error');
  },

  handleUnauthorized() {
    // console.debug('RS UNAUTHORIZED');
    // console.debug('Bearer token not valid anymore');
    // this.rs.stopSync();
    // this.rsWidget.classList.add('rs-state-unauthorized');
    this.showErrorBox('App authorization expired or revoked');
    // this.lastSyncedUpdateLoop = setInterval(() => {
    // this.updateLastSyncedOutput();
    // }, 5000);
  },

  updateLastSyncedOutput() {
    let now = new Date();
    let secondsSinceLastSync = Math.round((now.getTime() - this.lastSynced.getTime())/1000);
    let subHeadlineEl = document.querySelector('.rs-box-connected .rs-sub-headline');
    subHeadlineEl.innerHTML = `Synced ${secondsSinceLastSync} seconds ago`;
  }
};

module.exports = Widget;
