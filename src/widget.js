import RemoteStorage from 'remotestoragejs';

/**
 * RemoteStorage connect widget
 * @constructor
 * @param {object} remoteStorage - remoteStorage instance
 * @param {object} options - Widget options (domID, ...)
 */

let RemoteStorageWidget = function(remoteStorage, options={}) {
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

  remoteStorage.on('connected', () => this.eventHandler('connected'));
  remoteStorage.on('ready', () => this.eventHandler('ready'));
  remoteStorage.on('disconnected', () => this.eventHandler('disconnected'));
  remoteStorage.on('network-online', () => this.eventHandler('network-online'));
  remoteStorage.on('network-offline', () => this.eventHandler('network-offline'));
  remoteStorage.on('error', (error) => this.eventHandler('error', error));

  this.showProviders = false;

  // check if apyKeys is set for Dropbox or Google
  if (Object.keys(remoteStorage.apiKeys).length > 0) {
    this.showProviders = true;
  }

  this.rsWidget = document.querySelector('.rs-widget');
  this.rsInitial = document.querySelector('.rs-box-initial');
  this.rsChoose = document.querySelector('.rs-box-choose');
  this.rsConnected = document.querySelector('.rs-box-connected');
  this.rsSignIn = document.querySelector('.rs-box-sign-in');

  this.rsChooseRemoteStorageButton = document.querySelector('button.rs-choose-rs');
  this.rsChooseDropboxButton = document.querySelector('button.rs-choose-dropbox');
  this.rsChooseGoogleDriveButton = document.querySelector('button.rs-choose-gdrive');
  this.rsErrorBox = document.querySelector('.rs-box-error');

  this.rsSignInForm = document.querySelector('.rs-sign-in-form');
  
  this.rsDisconnectButton = document.querySelector('.rs-disconnect');
  this.rsSyncButton = document.querySelector('.rs-sync');
  this.rsLogo = document.querySelector('.rs-main-logo');

  this.rsConnectedUser = document.querySelector('.rs-connected-text h1.rs-user');

  this.lastSynced = null;
  this.lastSyncedUpdateLoop = null;

  // this.setAssetUrls();
  this.setEventListeners();
  this.setClickHandlers();
};


RemoteStorageWidget.prototype = {

  log (...msg) {
    console.debug('[RS-WIDGET] ', ...msg);
  },

  // handle events !
  eventHandler (event, msg) {
    this.log('EVENTI: ', event);
    switch (event) {
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
          console.debug('Set lastSynced to', this.lastSynced);
          let subHeadlineEl = document.querySelector('.rs-box-connected .rs-sub-headline');
          // this.fadeOut(subHeadlineEl);
          subHeadlineEl.innerHTML = 'Synced just now';
          // this.delayFadeIn(subHeadlineEl, 300);
        }
        // this.updateLastSyncedOutput()
        break;
      case 'disconnected':
        this.active = false;
        this.online = false;
        this.setState('initial');
        break;
      case 'connected':
        this.active = true;
        this.online = true;
        this.rs.sync.on('req-done', () => this.eventHandler('req-done'));
        this.rs.sync.on('done', () => this.eventHandler('done'));
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
        if (msg instanceof RemoteStorage.DiscoveryError) {
          this.handleDiscoveryError(msg);
        } else if (msg instanceof RemoteStorage.SyncError) {
          this.handleSyncError(msg);
        } else if (msg instanceof RemoteStorage.Unauthorized) {
          this.handleUnauthorized(msg);
        } else {
          console.debug('Encountered unhandled error', msg);
        }
        // console.error('sono dentro error', msg)
        // this.rsErrorBox.innerHTML = msg
        // this.setState('error')
        break;
    }

  },

  setState (state) {
    this.log('Setting state ', state);

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
    //
    // remoteStorage events
    //
  //   this.rs.on('connected', () => {
  //     console.debug('RS CONNECTED');

  //     this.rs.sync.on('req-done', () => {
  //       console.debug('SYNC REQ DONE');
  //       this.rsSyncButton.classList.add('rs-rotate');
  //     });

  //     this.rs.sync.on('done', () => {
  //       console.debug('SYNC DONE');

  //       if (this.rsWidget.classList.contains('rs-state-unauthorized') ||
  //           !this.rs.remote.online) {
  //         console.error('sono qui dentro ?!?!!?')
  //         this.updateLastSyncedOutput();
  //       } else if (this.rs.remote.online) {
  //         this.lastSynced = new Date();
  //         console.debug('Set lastSynced to', this.lastSynced);
  //         let subHeadlineEl = document.querySelector('.rs-box-connected .rs-sub-headline');
  //         this.fadeOut(subHeadlineEl);
  //         subHeadlineEl.innerHTML = 'Synced just now';
  //         this.delayFadeIn(subHeadlineEl, 300);
  //       } else {
  //         console.error('sono proprio qui')
  //       }
  //       this.rsSyncButton.classList.remove('rs-rotate');
  //     });

  //     let connectedUser = this.rs.remote.userAddress;
  //     // TODO set user address/name in rs.js core
  //     if (typeof connectedUser === 'undefined' &&
  //         this.rs.backend === 'googledrive') {
  //       connectedUser = 'Google Drive';
  //     }
  //     this.rsWidget.classList.remove("rs-state-sign-in");
  //     this.signInBox.setAttribute("style", "height: 0;");
  //     this.rsWidget.classList.remove('rs-state-initial')
  //     this.rsWidget.classList.remove("rs-state-choose");
  //     this.rsWidget.classList.add("rs-state-connected");
  //     this.fadeOut(this.rsInitial);
  //     this.chooseBox.setAttribute("style", "height: 0");
  //     this.rsConnectedUser.innerHTML = connectedUser;
  //     this.delayFadeIn(this.rsConnected, 600);
  //   });

  //   this.rs.on('disconnected', () => {
  //     console.debug('RS DISCONNECTED');
  //     this.rsWidget.classList.remove("rs-state-connected");
  //     this.rsWidget.classList.add("rs-state-initial");
  //     this.hideErrorBox();
  //     this.fadeOut(this.rsConnected);
  //     this.delayFadeIn(this.rsInitial, 300);
  //   });

  //   this.rs.on('error', (error) => {
  //     if (error instanceof RemoteStorage.DiscoveryError) {
  //       this.handleDiscoveryError(error);
  //     } else if (error instanceof RemoteStorage.SyncError) {
  //       this.handleSyncError(error);
  //     } else if (error instanceof RemoteStorage.Unauthorized) {
  //       this.handleUnauthorized(error);
  //     } else {
  //       console.debug('Encountered unhandled error', error);
  //     }
  //   });

  //   this.rs.on('network-offline', () => {
  //     console.debug('NETWORK OFFLINE');
  //     this.rsWidget.classList.add("rs-state-offline");
  //   });

  //   this.rs.on('network-online', () => {
  //     console.debug('NETWORK ONLINE');
  //     this.rsWidget.classList.remove("rs-state-offline");
  //   });

  //   this.rs.on('ready', () => {
  //     console.debug('RS READY');
  //     this.rs.on('wire-busy', () => {
  //       console.debug('WIRE BUSY');
  //     });
  //     this.rs.on('wire-done', () => {
  //       console.debug('WIRE DONE');
  //     });
  //   });
  // },

  setClickHandlers() {

    // Initial button
    this.rsInitial.addEventListener('click', () => {
      if (this.showProviders) {
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
    this.rsSyncButton.addEventListener('click', () => {
      if (this.rsSyncButton.classList.contains('rs-rotate')) {
        this.rs.stopSync();
        this.rsSyncButton.classList.remove("rs-rotate");
      } else {
        this.rs.startSync();
        this.rsSyncButton.classList.add("rs-rotate");
      }
    });

    // Reduce to only icon if connected and clicked outside of widget
    document.addEventListener('click', () => {
      // if (this.rsErrorBox.classList.contains('visible')) {
      //   // Don't allow closing the widget while there's an error to acknowledge
      //   return;
      // }
      // if (this.rsWidget.classList.contains("rs-state-connected")) {
      //   this.rsWidget.classList.toggle("rs-hide", true);
      //   // this.fadeOut(this.rsConnected);
      // } else {
        this.closeWidget();
      // }
    });

    // Stop clicks on the widget itthis from triggering the above event
    this.rsWidget.addEventListener('click', e => e.stopPropagation() );

    // Click on the logo to bring the full widget back
    this.rsLogo.addEventListener('click', () => this.openWidget());
  },

  openWidget() {
    this.closed = false;
    this.setState(this.active ? 'connected' : 'initial');
  },

  closeWidget() {
    this.setState('close');
    this.closed = true;
    // if (this.rsErrorBox.classList.contains('visible')) {
    //   // Don't allow closing the widget while there's an error to acknowledge
    //   return;
    // }
    // this.rsWidget.classList.remove("rs-state-sign-in");
    // this.rsWidget.classList.remove("rs-state-choose");
    // // this.delayFadeIn(this.rsInitial, 300);
    // this.signInBox.setAttribute("style", "height: 0;");
    // this.chooseBox.setAttribute("style", "height: 0;");
  },

  showErrorBox(errorMsg) {
    // this.openWidget();
    this.rsErrorBox.innerHTML = errorMsg;
    this.setState('error');
    // this.rsErrorBox.classList.remove('hidden');
    // this.rsErrorBox.classList.add('visible');
    // // this.fadeIn(this.rsErrorBox);
  },

  hideErrorBox() {
    this.rsErrorBox.innerHTML = '';
    this.setState('close');
    // this.rsErrorBox.classList.remove('visible');
    // this.rsErrorBox.classList.add('hidden');
  },

  handleDiscoveryError(error) {
    let msgContainer = document.querySelector('.rs-sign-in-error');
    msgContainer.innerHTML = error.message;
    msgContainer.classList.remove('hidden');
    msgContainer.classList.add('visible');
    // // this.fadeIn(msgContainer);
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

RemoteStorage.prototype.displayWidget = function(options) {
  this.widget = new RemoteStorageWidget(this, options);
};
