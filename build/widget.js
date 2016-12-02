"use strict";

/**
 * RemoteStorage connect widget
 * @constructor
 * @param {object} remoteStorage - remoteStorage instance
 * @param {object} options - Widget options (domID, ...)
 */
var RemoteStorageWidget = function RemoteStorageWidget(remoteStorage) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

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
  this.rsInitial = document.querySelector('.rs-box-initial');
  this.rsChooseRemoteStorageButton = document.querySelector('button.rs-choose-rs');
  this.rsChooseDropboxButton = document.querySelector('button.rs-choose-dropbox');
  this.rsChooseGoogleDriveButton = document.querySelector('button.rs-choose-gdrive');
  this.rsDisconnectButton = document.querySelector('.rs-disconnect');
  this.rsSyncButton = document.querySelector('.rs-sync');
  this.rsConnected = document.querySelector('.rs-box-connected');
  this.rsConnectedUser = document.querySelector('.rs-connected-text h1.rs-user');

  this.rsErrorBox = document.querySelector('.rs-box-error');

  this.lastSynced = null;
  this.lastSyncedUpdateLoop = null;

  this.setAssetUrls();
  this.setEventListeners();
  this.setClickHandlers();
};

RemoteStorageWidget.prototype = {
  insertHtmlTemplate: function insertHtmlTemplate() {
    var elementId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    var element = document.createElement('div');
    var style = document.createElement('style');
    style.innerHTML = RemoteStorage.Assets.styles;

    element.id = "remotestorage-widget";
    element.innerHTML = RemoteStorage.Assets.widget;
    element.appendChild(style);

    if (elementId) {
      var parent = document.getElementById(elementId);
      if (!parent) {
        throw "Failed to find target DOM element with id=\"" + elementId + "\"";
      }
      parent.appendChild(element);
    } else {
      document.body.appendChild(element);
    }
  },
  setAssetUrls: function setAssetUrls() {
    this.rsLogo.src = RemoteStorage.Assets.remoteStorage;
    document.querySelector('.rs-logo').src = RemoteStorage.Assets.remoteStorage;
    document.querySelector('.dropbox-logo').src = RemoteStorage.Assets.dropbox;
    document.querySelector('.gdrive-logo').src = RemoteStorage.Assets.gdrive;
    document.querySelector('.rs-power-icon').src = RemoteStorage.Assets.power;
    document.querySelector('.rs-loop-icon').src = RemoteStorage.Assets.loop;
  },
  setEventListeners: function setEventListeners() {
    var _this = this;

    // Sign-in form
    var rsSignInForm = document.querySelector('.rs-sign-in-form');
    rsSignInForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var userAddress = document.querySelector('input[name=rs-user-address]').value;
      _this.rs.connect(userAddress);
    });

    //
    // remoteStorage events
    //
    this.rs.on('connected', function () {
      console.debug('RS CONNECTED');

      _this.rs.sync.on('req-done', function () {
        console.debug('SYNC REQ DONE');
        _this.rsSyncButton.classList.add('rs-rotate');
      });
      _this.rs.sync.on('done', function () {
        console.debug('SYNC DONE');
        if (_this.rsWidget.classList.contains('rs-state-unauthorized') || !_this.rs.remote.online) {
          _this.updateLastSyncedOutput();
        } else if (_this.rs.remote.online) {
          _this.lastSynced = new Date();
          console.debug('Set lastSynced to', _this.lastSynced);
          var subHeadlineEl = document.querySelector('.rs-box-connected .rs-sub-headline');
          _this.fadeOut(subHeadlineEl);
          subHeadlineEl.innerHTML = 'Synced just now';
          _this.delayFadeIn(subHeadlineEl, 300);
        }
        _this.rsSyncButton.classList.remove('rs-rotate');
      });

      var connectedUser = _this.rs.remote.userAddress;
      // TODO set user address/name in rs.js core
      if (typeof connectedUser === 'undefined' && _this.rs.backend === 'googledrive') {
        connectedUser = 'Google Drive';
      }
      _this.rsWidget.classList.remove("rs-state-sign-in");
      _this.signInBox.setAttribute("style", "height: 0;");
      _this.rsWidget.classList.remove('rs-state-initial');
      _this.rsWidget.classList.remove("rs-state-choose");
      _this.rsWidget.classList.add("rs-state-connected");
      _this.fadeOut(_this.rsInitial);
      _this.chooseBox.setAttribute("style", "height: 0");
      _this.rsConnectedUser.innerHTML = connectedUser;
      _this.delayFadeIn(_this.rsConnected, 600);
    });

    this.rs.on('disconnected', function () {
      console.debug('RS DISCONNECTED');
      _this.rsWidget.classList.remove("rs-state-connected");
      _this.rsWidget.classList.add("rs-state-initial");
      _this.hideErrorBox();
      _this.fadeOut(_this.rsConnected);
      _this.delayFadeIn(_this.rsInitial, 300);
    });

    this.rs.on('error', function (error) {
      if (error instanceof RemoteStorage.DiscoveryError) {
        _this.handleDiscoveryError(error);
      } else if (error instanceof RemoteStorage.SyncError) {
        _this.handleSyncError(error);
      } else if (error instanceof RemoteStorage.Unauthorized) {
        _this.handleUnauthorized(error);
      } else {
        console.debug('Encountered unhandled error', error);
      }
    });

    this.rs.on('network-offline', function () {
      console.debug('NETWORK OFFLINE');
      _this.rsWidget.classList.add("rs-state-offline");
    });

    this.rs.on('network-online', function () {
      console.debug('NETWORK ONLINE');
      _this.rsWidget.classList.remove("rs-state-offline");
    });

    this.rs.on('ready', function () {
      console.debug('RS READY');
      _this.rs.on('wire-busy', function () {
        console.debug('WIRE BUSY');
      });
      _this.rs.on('wire-done', function () {
        console.debug('WIRE DONE');
      });
    });
  },
  setClickHandlers: function setClickHandlers() {
    var _this2 = this;

    // Initial button
    this.rsInitial.addEventListener('click', function () {
      _this2.rsWidget.classList.remove("rs-state-initial");
      _this2.rsWidget.classList.add("rs-state-choose");
      _this2.fadeOut(_this2.rsInitial);
      // Set height of the ChooseBox back to original height.
      _this2.chooseBox.setAttribute("style", "height: " + _this2.chooseBoxHeight);
    });

    // Choose RS button
    this.rsChooseRemoteStorageButton.addEventListener('click', function () {
      _this2.rsWidget.classList.remove("rs-state-choose");
      _this2.rsWidget.classList.add("rs-state-sign-in");
      _this2.chooseBox.setAttribute("style", "height: 0");
      _this2.signInBox.setAttribute("style", "height: " + _this2.chooseBoxHeight + "px"); // Set the sign in box to same height as chooseBox
      _this2.signInContent.setAttribute("style", "padding-top: " + (_this2.chooseBoxHeight - _this2.signInContentHeight) / 2 + "px"); // Center it
    });

    // Choose Dropbox button
    this.rsChooseDropboxButton.addEventListener('click', function () {
      _this2.rs["dropbox"].connect();
      // this.rsWidget.classList.remove("rs-state-choose");
      // this.rsWidget.classList.add("rs-state-connected");
      // this.chooseBox.setAttribute("style", "height: 0");
      // this.delayFadeIn(this.rsConnected, 600);
    });

    // Choose Google drive button
    this.rsChooseGoogleDriveButton.addEventListener('click', function () {
      _this2.rs["googledrive"].connect();
      // this.rsWidget.classList.remove("rs-state-choose");
      // this.rsWidget.classList.add("rs-state-connected");
      // this.chooseBox.setAttribute("style", "height: 0");
      // this.delayFadeIn(this.rsConnected, 600);
    });

    // Disconnect button
    this.rsDisconnectButton.addEventListener('click', function () {
      _this2.rs.disconnect();
    });

    // Sync button
    this.rsSyncButton.addEventListener('click', function () {
      if (_this2.rsSyncButton.classList.contains('rs-rotate')) {
        _this2.rs.stopSync();
        _this2.rsSyncButton.classList.remove("rs-rotate");
      } else {
        _this2.rs.startSync();
        _this2.rsSyncButton.classList.add("rs-rotate");
      }
    });

    // Reduce to only icon if connected and clicked outside of widget
    document.addEventListener('click', function () {
      if (_this2.rsErrorBox.classList.contains('visible')) {
        // Don't allow closing the widget while there's an error to acknowledge
        return;
      }
      if (_this2.rsWidget.classList.contains("rs-state-connected")) {
        _this2.rsWidget.classList.toggle("rs-hide", true);
        _this2.fadeOut(_this2.rsConnected);
      } else {
        _this2.closeWidget();
      }
    });

    // Stop clicks on the widget itthis from triggering the above event
    this.rsWidget.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    // Click on the logo to bring the full widget back
    this.rsLogo.addEventListener('click', function () {
      _this2.openWidget();
    });
  },
  openWidget: function openWidget() {
    if (this.rsWidget.classList.contains("rs-state-connected")) {
      this.rsWidget.classList.toggle("rs-hide", false);
      this.fadeIn(this.rsConnected, 300);
    }
  },
  closeWidget: function closeWidget() {
    if (this.rsErrorBox.classList.contains('visible')) {
      // Don't allow closing the widget while there's an error to acknowledge
      return;
    }
    this.rsWidget.classList.remove("rs-state-sign-in");
    this.rsWidget.classList.remove("rs-state-choose");
    this.delayFadeIn(this.rsInitial, 300);
    this.signInBox.setAttribute("style", "height: 0;");
    this.chooseBox.setAttribute("style", "height: 0;");
  },


  // To delay fadeIn until other animations are finished
  delayFadeIn: function delayFadeIn(element, delayTime) {
    var _this3 = this;

    setTimeout(function () {
      _this3.fadeIn(element);
    }, delayTime);
  },


  // CSS can't fade elements in and out of the page flow so we have to do it in JS
  fadeOut: function fadeOut(element) {
    var op = 1; // initial opacity
    var timer = setInterval(function () {
      if (op <= 0.1) {
        clearInterval(timer);
        element.style.display = "none";
      }
      element.style.opacity = op;
      element.style.filter = "alpha(opacity=" + op * 100 + ")";
      op -= op * 0.1;
    }, 3);
  },
  fadeIn: function fadeIn(element) {
    var op = 0.1; // initial opacity
    element.style.display = "block";
    var timer = setInterval(function () {
      if (op >= 1) {
        clearInterval(timer);
      }
      element.style.opacity = op;
      element.style.filter = "alpha(opacity=" + op * 100 + ")";
      op += op * 0.1;
    }, 3);
  },
  showErrorBox: function showErrorBox(errorMsg) {
    this.openWidget();
    this.rsErrorBox.innerHTML = errorMsg;
    this.rsErrorBox.classList.remove('hidden');
    this.rsErrorBox.classList.add('visible');
    this.fadeIn(this.rsErrorBox);
  },
  hideErrorBox: function hideErrorBox() {
    this.rsErrorBox.innerHTML = '';
    this.rsErrorBox.classList.remove('visible');
    this.rsErrorBox.classList.add('hidden');
  },
  handleDiscoveryError: function handleDiscoveryError(error) {
    var msgContainer = document.querySelector('.rs-sign-in-error');
    msgContainer.innerHTML = error.message;
    msgContainer.classList.remove('hidden');
    msgContainer.classList.add('visible');
    this.fadeIn(msgContainer);
  },
  handleSyncError: function handleSyncError() /* error */{
    // console.debug('Encountered SyncError', error);
  },
  handleUnauthorized: function handleUnauthorized() {
    var _this4 = this;

    console.debug('RS UNAUTHORIZED');
    console.debug('Bearer token not valid anymore');
    this.rs.stopSync();
    this.rsWidget.classList.add('rs-state-unauthorized');
    this.showErrorBox('App authorization expired or revoked');
    this.lastSyncedUpdateLoop = setInterval(function () {
      _this4.updateLastSyncedOutput();
    }, 5000);
  },
  updateLastSyncedOutput: function updateLastSyncedOutput() {
    var now = new Date();
    var secondsSinceLastSync = Math.round((now.getTime() - this.lastSynced.getTime()) / 1000);
    var subHeadlineEl = document.querySelector('.rs-box-connected .rs-sub-headline');
    subHeadlineEl.innerHTML = "Synced " + secondsSinceLastSync + " seconds ago";
  }
};

RemoteStorage.prototype.displayWidget = function (options) {
  this.widget = new RemoteStorageWidget(this, options);
};

