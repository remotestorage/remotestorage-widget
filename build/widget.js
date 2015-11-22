/**
 * RemoteStorage connect widget
 * @constructor
 * @param {object} remoteStorage - remoteStorage instance
 * @param {object} options - Widget options (domID, ...)
 */
"use strict";

var RemoteStorageWidget = function RemoteStorageWidget(remoteStorage) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  this.rs = remoteStorage;
  console.debug("Initializing widget for ", this.rs);

  this.insertHtmlTemplate(options.domID);

  // CSS can't animate to unknown height (as in height: auto)
  // so we need to store the height, set it to 0 and use it when we want the animation
  this.chooseBox = document.getElementsByClassName("rs-box-choose")[0];
  this.chooseBoxHeight = this.chooseBox.clientHeight;
  // Set the height to zero until the initial button is clicked
  this.chooseBox.setAttribute("style", "height: 0");

  this.signInBox = document.getElementsByClassName("rs-box-sign-in")[0];
  this.signInContent = document.getElementsByClassName("rs-sign-in-content")[0];
  this.signInContentHeight = this.signInContent.clientHeight;

  this.rsWidget = document.getElementById("rs-widget");
  this.rsLogo = document.getElementsByClassName("rs-main-logo")[0];
  this.rsCloseButton = document.getElementsByClassName("rs-close")[0];
  this.rsInitial = document.getElementsByClassName("rs-box-initial")[0];
  this.rsChooseButton = document.getElementsByClassName("rs-button-big");
  this.rsDisconnectButton = document.getElementsByClassName("rs-disconnect")[0];
  this.rsSyncButton = document.getElementsByClassName("rs-sync")[0];
  this.rsSignInButton = document.getElementsByClassName("rs-submit")[0];
  this.rsConnected = document.getElementsByClassName("rs-box-connected")[0];

  this.setAssetUrls();
  this.setClickHandlers();
};

RemoteStorageWidget.prototype = {

  insertHtmlTemplate: function insertHtmlTemplate() {
    var elementId = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    var element = document.createElement('div');
    var style = document.createElement('style');
    style.innerHTML = RemoteStorage.Assets.styles;

    element.id = "remotestorage-widget";
    element.innerHTML = RemoteStorage.Assets.widget;
    element.appendChild(style);

    if (elementId) {
      var _parent = document.getElementById(elementId);
      if (!_parent) {
        throw "Failed to find target DOM element with id=\"" + elementId + "\"";
      }
      _parent.appendChild(element);
    } else {
      document.body.appendChild(element);
    }
  },

  setAssetUrls: function setAssetUrls() {
    this.rsCloseButton.src = RemoteStorage.Assets.close;
    this.rsLogo.src = RemoteStorage.Assets.remoteStorage;
    document.getElementsByClassName('rs-logo')[0].src = RemoteStorage.Assets.remoteStorage;
    document.getElementsByClassName('dropbox-logo')[0].src = RemoteStorage.Assets.dropbox;
    document.getElementsByClassName('gdrive-logo')[0].src = RemoteStorage.Assets.gdrive;
    document.getElementsByClassName('rs-power-icon')[0].src = RemoteStorage.Assets.power;
    document.getElementsByClassName('rs-loop-icon')[0].src = RemoteStorage.Assets.loop;
  },

  setClickHandlers: function setClickHandlers() {
    var self = this;

    // Initial button
    self.rsInitial.addEventListener("click", function () {
      console.log("clicked initial button");
      self.rsWidget.classList.remove("rs-state-initial");
      self.rsWidget.classList.add("rs-state-choose");
      self.fadeOut(this);
      // Set height of the ChooseBox back to original height.
      self.chooseBox.setAttribute("style", "height: " + self.chooseBoxHeight);
    });

    // Choose RS button
    self.rsChooseButton[0].addEventListener("click", function () {
      console.log("clicked RS button");
      self.rsWidget.classList.remove("rs-state-choose");
      self.rsWidget.classList.add("rs-state-sign-in");
      self.chooseBox.setAttribute("style", "height: 0");
      self.signInBox.setAttribute("style", "height: " + self.chooseBoxHeight + "px"); // Set the sign in box to same height as chooseBox
      self.signInContent.setAttribute("style", "padding-top: " + (self.chooseBoxHeight - self.signInContentHeight) / 2 + "px"); // Center it
    });

    // Sign in button
    self.rsSignInButton.addEventListener("click", function () {
      self.rsWidget.classList.remove("rs-state-sign-in");
      self.rsWidget.classList.add("rs-state-connected");
      self.delayFadeIn(self.rsConnected, 600);
      self.signInBox.setAttribute("style", "height: 0;");
    });

    // Choose Dropbox button
    self.rsChooseButton[1].addEventListener("click", function () {
      console.log("clicked Dropbox button");
      self.rsWidget.classList.remove("rs-state-choose");
      self.rsWidget.classList.add("rs-state-connected");
      self.chooseBox.setAttribute("style", "height: 0");
      self.delayFadeIn(self.rsConnected, 600);
    });

    // Choose Google drive button
    self.rsChooseButton[2].addEventListener("click", function () {
      console.log("clicked Google drive Button");
      self.rsWidget.classList.remove("rs-state-choose");
      self.rsWidget.classList.add("rs-state-connected");
      self.chooseBox.setAttribute("style", "height: 0");
      self.delayFadeIn(self.rsConnected, 600);
    });

    // Disconnect button
    self.rsDisconnectButton.addEventListener("click", function () {
      console.log("clicked disconnect button");
      self.rsWidget.classList.remove("rs-state-connected");
      self.rsWidget.classList.add("rs-state-initial");
      self.fadeOut(self.rsConnected);
      self.delayFadeIn(self.rsInitial, 300);
    });

    // Sync button
    self.rsSyncButton.addEventListener("click", function () {
      console.log("clicked sync button");
      self.rsSyncButton.classList.toggle("rs-rotate");
    });

    // Close button
    self.rsCloseButton.addEventListener("click", function () {
      console.log("clicked close button");
      self.closeWidget();
    });

    // Reduce to only icon if connected and clicked outside of widget
    document.addEventListener("click", function () {
      console.log("clicked outside of widget");
      if (self.rsWidget.classList.contains("rs-state-connected")) {
        self.rsWidget.classList.toggle("rs-hide", true);
        self.fadeOut(self.rsConnected);
      } else {
        self.closeWidget();
      }
    });

    // Stop clicks on the widget itself from triggering the above event
    self.rsWidget.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    // Click on the logo to bring the full widget back
    self.rsLogo.addEventListener("click", function () {
      if (self.rsWidget.classList.contains("rs-state-connected")) {
        self.rsWidget.classList.toggle("rs-hide", false);
        self.delayFadeIn(self.rsConnected, 300);
      }
    });
  },

  closeWidget: function closeWidget() {
    this.rsWidget.classList.remove("rs-state-sign-in");
    this.rsWidget.classList.remove("rs-state-choose");
    this.delayFadeIn(this.rsInitial, 300);
    this.signInBox.setAttribute("style", "height: 0;");
    this.chooseBox.setAttribute("style", "height: 0;");
  },

  // To delay fadeIn until other animations are finished
  delayFadeIn: function delayFadeIn(element, delayTime) {
    var _this = this;

    setTimeout(function () {
      _this.fadeIn(element);
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
  }
};

RemoteStorage.prototype.displayWidget = function (options) {
  this.widget = new RemoteStorageWidget(this, options);
};

