/**
 * RemoteStorage connect widget
 * @constructor
 * @param {object} remoteStorage - remoteStorage instance
 * @param {object} options - Widget options (domID, ...)
 */
let RemoteStorageWidget = function(remoteStorage, options={}) {
  this.rs = remoteStorage;
  console.debug("Initializing widget for ", this.rs);

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

  this.setAssetUrls();
  this.setEventListeners();
  this.setClickHandlers();
};

RemoteStorageWidget.prototype = {

  insertHtmlTemplate(elementId=null) {
    let element = document.createElement('div');
    let style = document.createElement('style');
    style.innerHTML = RemoteStorage.Assets.styles;

    element.id = "remotestorage-widget";
    element.innerHTML = RemoteStorage.Assets.widget;
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
    this.rsCloseButton.src = RemoteStorage.Assets.close;
    this.rsLogo.src = RemoteStorage.Assets.remoteStorage;
    document.querySelector('.rs-logo').src = RemoteStorage.Assets.remoteStorage;
    document.querySelector('.dropbox-logo').src = RemoteStorage.Assets.dropbox;
    document.querySelector('.gdrive-logo').src = RemoteStorage.Assets.gdrive;
    document.querySelector('.rs-power-icon').src = RemoteStorage.Assets.power;
    document.querySelector('.rs-loop-icon').src = RemoteStorage.Assets.loop;
  },

  setEventListeners() {
    // Sign-in form
    let rsSignInForm = document.querySelector('.rs-sign-in-form');
    rsSignInForm.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  },

  setClickHandlers() {
    let self = this;

    // Initial button
    self.rsInitial.addEventListener("click", function() {
      console.log("clicked initial button");
      self.rsWidget.classList.remove("rs-state-initial");
      self.rsWidget.classList.add("rs-state-choose");
      self.fadeOut(this);
      // Set height of the ChooseBox back to original height.
      self.chooseBox.setAttribute("style", "height: " + self.chooseBoxHeight);
    });

    // Choose RS button
    self.rsChooseRemoteStorageButton.addEventListener("click", function() {
      console.log("clicked RS button");
      self.rsWidget.classList.remove("rs-state-choose");
      self.rsWidget.classList.add("rs-state-sign-in");
      self.chooseBox.setAttribute("style", "height: 0");
      self.signInBox.setAttribute("style", "height: " + self.chooseBoxHeight + "px"); // Set the sign in box to same height as chooseBox
      self.signInContent.setAttribute("style", "padding-top: " + ((self.chooseBoxHeight - self.signInContentHeight) / 2) + "px"); // Center it
    });

    // Choose Dropbox button
    self.rsChooseDropboxButton.addEventListener("click", function() {
      console.log("clicked Dropbox button");
      self.rsWidget.classList.remove("rs-state-choose");
      self.rsWidget.classList.add("rs-state-connected");
      self.chooseBox.setAttribute("style", "height: 0");
      self.delayFadeIn(self.rsConnected, 600);
    });

    // Choose Google drive button
    self.rsChooseGoogleDriveButton.addEventListener("click", function() {
      console.log("clicked Google drive Button");
      self.rsWidget.classList.remove("rs-state-choose");
      self.rsWidget.classList.add("rs-state-connected");
      self.chooseBox.setAttribute("style", "height: 0");
      self.delayFadeIn(self.rsConnected, 600);
    });

    // Disconnect button
    self.rsDisconnectButton.addEventListener("click", function() {
      console.log("clicked disconnect button");
      self.rsWidget.classList.remove("rs-state-connected");
      self.rsWidget.classList.add("rs-state-initial");
      self.fadeOut(self.rsConnected);
      self.delayFadeIn(self.rsInitial, 300);
    });

    // Sync button
    self.rsSyncButton.addEventListener("click", function() {
      console.log("clicked sync button");
      self.rsSyncButton.classList.toggle("rs-rotate");
    });

    // Close button
    self.rsCloseButton.addEventListener("click", function() {
      console.log("clicked close button");
      self.closeWidget();
    });

    // Reduce to only icon if connected and clicked outside of widget
    document.addEventListener("click", function() {
      console.log("clicked outside of widget");
      if (self.rsWidget.classList.contains("rs-state-connected")) {
        self.rsWidget.classList.toggle("rs-hide", true);
        self.fadeOut(self.rsConnected);
      } else {
        self.closeWidget();
      }
    });

    // Stop clicks on the widget itself from triggering the above event
    self.rsWidget.addEventListener("click", function(e) {
      e.stopPropagation();
    });

    // Click on the logo to bring the full widget back
    self.rsLogo.addEventListener("click", function() {
      if (self.rsWidget.classList.contains("rs-state-connected")) {
        self.rsWidget.classList.toggle("rs-hide", false);
        self.delayFadeIn(self.rsConnected, 300);
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
  fadeOut(element) { let op = 1;  // initial opacity
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
  }
};

RemoteStorage.prototype.displayWidget = function(options) {
  this.widget = new RemoteStorageWidget(this, options);
};
