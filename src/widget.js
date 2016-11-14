import RemoteStorage from 'remotestoragejs'
/**
 * RemoteStorage connect widget
 * @constructor
 * @param {object} remoteStorage - remoteStorage instance
 * @param {object} options - Widget options (domID, ...)
 */

let RemoteStorageWidget = function(remoteStorage, options={}) {
  this.rs = remoteStorage;

  // RemoteStorage.eventHandling(this,
  //   'connect', 'disconnect', 'sync', 'reset'
  // );
  // for (var event in this.events){
  //   this.events[event] = this.events[event].bind(this);
  // }

  this.insertHtmlTemplate(options.domID);

  // CSS can't animate to unknown height (as in height: auto)
  // so we need to store the height, set it to 0 and use it when we want the animation
  this.chooseBox = document.querySelector('.rs-box-choose');
  this.chooseBoxHeight = this.chooseBox.clientHeight;
  // Set the height to zero until the initial button is clicked
  this.chooseBox.setAttribute("style", "height: 0");

  this.signInBox = document.querySelector('.rs-box-sign-in');
  this.signInContent = document.querySelector('.rs-sign-in-content');
  this.signInContentHeight = this.signInContent.clientHeight;

  this.rsWidget = document.querySelector('#rs-widget');
  this.rsLogo = document.querySelector('.rs-main-logo');
  this.rsCloseButton = document.querySelector('.rs-close');
  this.rsInitial = document.querySelector('.rs-box-initial');
  this.rsChooseRemoteStorageButton = document.querySelector('button.rs-choose-rs');
  this.rsChooseDropboxButton = document.querySelector('button.rs-choose-dropbox');
  this.rsChooseGoogleDriveButton = document.querySelector('button.rs-choose-gdrive');
  this.rsDisconnectButton = document.querySelector('.rs-disconnect');
  this.rsSyncButton = document.querySelector('.rs-sync');
  this.rsConnected = document.querySelector('.rs-box-connected');
  this.rsConnectedUser = document.querySelector('.rs-connected-text h1.rs-user');

  this.lastSynced = null;

  this.setAssetUrls();
  this.setEventListeners();
  this.setClickHandlers();
};

RemoteStorageWidget.prototype = {

  insertHtmlTemplate(elementId=null) {
    let element = document.createElement('div');
    let style = document.createElement('style');
    style.innerHTML = require('raw!./assets/styles.css');

    element.id = "remotestorage-widget";
    element.innerHTML = require('raw!./assets/widget.html');
    element.appendChild(style); 

    if (elementId) {
      let parent = document.getElementById(elementId);
      if (!parent) {
        throw "Failed to find target DOM element with id=\"" + elementId + "\"";
      }
      parent.appendChild(element);
    } else {
      document.body.appendChild(element);
    }
  },

  setAssetUrls() {
    this.rsCloseButton.src = require('./assets/close.svg');
    this.rsLogo.src = require('./assets/remoteStorage.svg');
    document.querySelector('.rs-logo').src = require('./assets/remoteStorage.svg');
    document.querySelector('.dropbox-logo').src = require('./assets/dropbox.svg');
    document.querySelector('.gdrive-logo').src = require('./assets/gdrive.svg');
    document.querySelector('.rs-power-icon').src = require('./assets/power.svg');
    document.querySelector('.rs-loop-icon').src = require('./assets/loop.svg');
  },

  setEventListeners() {
    // Sign-in form
    let rsSignInForm = document.querySelector('.rs-sign-in-form');
    rsSignInForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let userAddress = document.querySelector('input[name=rs-user-address]').value;
      this.rs.connect(userAddress);
    });

    //
    // remoteStorage events
    //
    this.rs.on('connected', () => {
      let connectedUser = this.rs.remote.userAddress;
      // TODO set user address/name in rs.js core
      if (typeof connectedUser === 'undefined' &&
          this.rs.backend === 'googledrive') {
        connectedUser = 'Google Drive';
      }
      this.rsWidget.classList.remove("rs-state-choose");
      this.rsWidget.classList.add("rs-state-connected");
      this.fadeOut(this.rsInitial);
      this.chooseBox.setAttribute("style", "height: 0");
      this.rsConnectedUser.innerHTML = connectedUser;
      this.delayFadeIn(this.rsConnected, 600);
    });

    this.rs.on('disconnected', () => {
      this.rsWidget.classList.remove("rs-state-connected");
      this.rsWidget.classList.add("rs-state-initial");
      this.fadeOut(this.rsConnected);
      this.delayFadeIn(this.rsInitial, 300);
    });

    this.rs.on('error', (error) => {
      if (error instanceof RemoteStorage.DiscoveryError) {
        this.handleDiscoveryError(error);
      } else if (error instanceof RemoteStorage.SyncError) {
        this.handleSyncError(error);
      }
    });

    this.rs.on('network-offline', () => {
      console.debug('NETWORK OFFLINE');
      this.rsWidget.classList.add("rs-state-offline");
    });

    this.rs.on('network-online', () => {
      console.debug('NETWORK ONLINE');
      this.rsWidget.classList.remove("rs-state-offline");
    });

    this.rs.on('ready', () => {

      this.rs.on('wire-busy', () => {
        console.debug('WIRE BUSY');
      });

      this.rs.on('wire-done', () => {
        console.debug('WIRE DONE');
      });

      this.rs.sync.on('req-done', () => {
        console.debug('SYNC REQ DONE');
        this.rsSyncButton.classList.add('rs-rotate');
      });

      this.rs.sync.on('done', () => {
        console.debug('SYNC DONE');
        console.debug('this.rs.remote.online', this.rs.remote.online);

        if (this.rs.remote.online) {
          this.lastSynced = new Date();
          console.debug('Set lastSynced to', this.lastSynced);
          let subHeadlineEl = document.querySelector('.rs-box-connected .rs-sub-headline');
          this.fadeOut(subHeadlineEl);
          subHeadlineEl.innerHTML = 'Synced just now';
          this.delayFadeIn(subHeadlineEl, 300);
        } else {
          this.updateLastSyncedOutput();
        }

        this.rsSyncButton.classList.remove('rs-rotate');
      });

    });
  },

  setClickHandlers() {
    // Initial button
    this.rsInitial.addEventListener('click', () => {
      this.rsWidget.classList.remove("rs-state-initial");
      this.rsWidget.classList.add("rs-state-choose");
      this.fadeOut(this.rsInitial);
      // Set height of the ChooseBox back to original height.
      this.chooseBox.setAttribute("style", "height: " + this.chooseBoxHeight);
    });

    // Choose RS button
    this.rsChooseRemoteStorageButton.addEventListener('click', () => {
      this.rsWidget.classList.remove("rs-state-choose");
      this.rsWidget.classList.add("rs-state-sign-in");
      this.chooseBox.setAttribute("style", "height: 0");
      this.signInBox.setAttribute("style", "height: " + this.chooseBoxHeight + "px"); // Set the sign in box to same height as chooseBox
      this.signInContent.setAttribute("style", "padding-top: " + ((this.chooseBoxHeight - this.signInContentHeight) / 2) + "px"); // Center it
    });

    // Choose Dropbox button
    this.rsChooseDropboxButton.addEventListener('click', () => {
      this.rs["dropbox"].connect();
      // this.rsWidget.classList.remove("rs-state-choose");
      // this.rsWidget.classList.add("rs-state-connected");
      // this.chooseBox.setAttribute("style", "height: 0");
      // this.delayFadeIn(this.rsConnected, 600);
    });

    // Choose Google drive button
    this.rsChooseGoogleDriveButton.addEventListener('click', () => {
      this.rs["googledrive"].connect();
      // this.rsWidget.classList.remove("rs-state-choose");
      // this.rsWidget.classList.add("rs-state-connected");
      // this.chooseBox.setAttribute("style", "height: 0");
      // this.delayFadeIn(this.rsConnected, 600);
    });

    // Disconnect button
    this.rsDisconnectButton.addEventListener('click', () => {
      this.rs.disconnect();
    });

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

    // Close button
    this.rsCloseButton.addEventListener('click', () => {
      this.closeWidget();
    });

    // Reduce to only icon if connected and clicked outside of widget
    document.addEventListener('click', () => {
      if (this.rsWidget.classList.contains("rs-state-connected")) {
        this.rsWidget.classList.toggle("rs-hide", true);
        this.fadeOut(this.rsConnected);
      } else {
        this.closeWidget();
      }
    });

    // Stop clicks on the widget itthis from triggering the above event
    this.rsWidget.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Click on the logo to bring the full widget back
    this.rsLogo.addEventListener('click', () => {
      if (this.rsWidget.classList.contains("rs-state-connected")) {
        this.rsWidget.classList.toggle("rs-hide", false);
        this.delayFadeIn(this.rsConnected, 300);
      }
    });
  },

  closeWidget() {
    this.rsWidget.classList.remove("rs-state-sign-in");
    this.rsWidget.classList.remove("rs-state-choose");
    this.delayFadeIn(this.rsInitial, 300);
    this.signInBox.setAttribute("style", "height: 0;");
    this.chooseBox.setAttribute("style", "height: 0;");
  },

  // To delay fadeIn until other animations are finished
  delayFadeIn(element, delayTime) {
    setTimeout(() => {
      this.fadeIn(element);
    }, delayTime);
  },

  // CSS can't fade elements in and out of the page flow so we have to do it in JS
  fadeOut(element) {
    let op = 1;  // initial opacity
    let timer = setInterval(function () {
      if (op <= 0.1){
        clearInterval(timer);
        element.style.display = "none";
      }
      element.style.opacity = op;
      element.style.filter = "alpha(opacity=" + op * 100 + ")";
      op -= op * 0.1;
    }, 3);
  },

  fadeIn(element) {
    let op = 0.1;  // initial opacity
    element.style.display = "block";
    let timer = setInterval(function () {
      if (op >= 1){
        clearInterval(timer);
      }
      element.style.opacity = op;
      element.style.filter = "alpha(opacity=" + op * 100 + ")";
      op += op * 0.1;
    }, 3);
  },

  handleDiscoveryError(error) {
    let msgContainer = document.querySelector('.rs-sign-in-error');
    msgContainer.innerHTML = error.message;
    msgContainer.classList.remove('hidden');
    msgContainer.classList.add('visible');
    this.fadeIn(msgContainer);
  },

  handleSyncError(error) {
    // console.debug('Encountered SyncError', error);
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
