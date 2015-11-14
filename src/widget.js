// To delay fadeIn until other animations are finished
function delayFadeIn(element, delayTime) {
  setTimeout(function() {
    fadeIn(element);
  }, delayTime);
}

// CSS can't fade elements in and out of the page flow so we have to do it in JS
function fadeOut(element) {
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
}

function fadeIn(element) {
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

let RemoteStorageWidget = function(remoteStorage) {
  this.rs = remoteStorage;

  console.debug("Initializing widget for ", this.rs);

  // CSS can't animate to unknown height (as in height: auto)
  // so we need to store the height, set it to 0 and use it when we want the animation
  let chooseBox = document.getElementsByClassName("rs-box-choose")[0];
  let chooseBoxHeight = chooseBox.clientHeight;
  // Set the height to zero until the initial button is clicked
  chooseBox.setAttribute("style", "height: 0");

  let signInBox = document.getElementsByClassName("rs-box-sign-in")[0];
  let signInContent = document.getElementsByClassName("rs-sign-in-content")[0];
  let signInContentHeight = signInContent.clientHeight;

  let rsWidget = document.getElementById("rs-widget");
  let rsLogo = document.getElementsByClassName("rs-main-logo")[0];
  let rsCloseButton = document.getElementsByClassName("rs-close")[0];
  let rsInitial = document.getElementsByClassName("rs-box-initial")[0];
  let rsChooseButton = document.getElementsByClassName("rs-button-big");
  let rsDisconnectButton = document.getElementsByClassName("rs-disconnect")[0];
  let rsSyncButton = document.getElementsByClassName("rs-sync")[0];
  let rsSignInButton = document.getElementsByClassName("rs-submit")[0];
  let rsConnected = document.getElementsByClassName("rs-box-connected")[0];

  // Initial button
  rsInitial.addEventListener("click", function() {
    console.log("clicked initial button");
    rsWidget.classList.remove("rs-state-initial");
    rsWidget.classList.add("rs-state-choose");
    fadeOut(this);
    // Set height of the ChooseBox back to original height.
    chooseBox.setAttribute("style", "height: " + chooseBoxHeight);
  });

  // Choose RS button
  rsChooseButton[0].addEventListener("click", function() {
    console.log("clicked RS button");
    rsWidget.classList.remove("rs-state-choose");
    rsWidget.classList.add("rs-state-sign-in");
    chooseBox.setAttribute("style", "height: 0");
    signInBox.setAttribute("style", "height: " + chooseBoxHeight + "px"); // Set the sign in box to same height as chooseBox
    signInContent.setAttribute("style", "padding-top: " + ((chooseBoxHeight - signInContentHeight) / 2) + "px"); // Center it
  });

  // Sign in button
  rsSignInButton.addEventListener("click", function() {
    rsWidget.classList.remove("rs-state-sign-in");
    rsWidget.classList.add("rs-state-connected");
    delayFadeIn(rsConnected, 600);
    signInBox.setAttribute("style", "height: 0;");
  });

  // Choose Dropbox button
  rsChooseButton[1].addEventListener("click", function() {
    console.log("clicked Dropbox button");
    rsWidget.classList.remove("rs-state-choose");
    rsWidget.classList.add("rs-state-connected");
    chooseBox.setAttribute("style", "height: 0");
    delayFadeIn(rsConnected, 600);
  });

  // Choose Google drive button
  rsChooseButton[2].addEventListener("click", function() {
    console.log("clicked Google drive Button");
    rsWidget.classList.remove("rs-state-choose");
    rsWidget.classList.add("rs-state-connected");
    chooseBox.setAttribute("style", "height: 0");
    delayFadeIn(rsConnected, 600);
  });

  // Disconnect button
  rsDisconnectButton.addEventListener("click", function() {
    console.log("clicked disconnect button");
    rsWidget.classList.remove("rs-state-connected");
    rsWidget.classList.add("rs-state-initial");
    fadeOut(rsConnected);
    delayFadeIn(rsInitial, 300);
  });

  // Sync button
  rsSyncButton.addEventListener("click", function() {
    console.log("clicked sync button");
    rsSyncButton.classList.toggle("rs-rotate");
  });

  // Close button
  rsCloseButton.addEventListener("click", function() {
    console.log("clicked close button");
    rsWidget.classList.remove("rs-state-sign-in");
    rsWidget.classList.remove("rs-state-choose");
    delayFadeIn(rsInitial, 300);
    signInBox.setAttribute("style", "height: 0;");
    chooseBox.setAttribute("style", "height: 0;");
  });

  // Reduce to only icon if connected and clicked outside of widget
  document.addEventListener("click", function() {
    console.log("clicked outside of widget");
    if (rsWidget.classList.contains("rs-state-connected")) {
      rsWidget.classList.toggle("rs-hide", true);
      fadeOut(rsConnected);
    }
  });
  // Stop clicks on the widget itself from triggering the above event
  rsWidget.addEventListener("click", function(e) {
    e.stopPropagation();
  });
  // Click on the logo to bring the full widget back
  rsLogo.addEventListener("click", function() {
    if (rsWidget.classList.contains("rs-state-connected")) {
      rsWidget.classList.toggle("rs-hide", false);
      delayFadeIn(rsConnected, 300);
    }
  });
};

RemoteStorage.prototype.displayWidget = function(elementId) {
  console.debug('Creating widget on element with ID', elementId);
  this.widget = new RemoteStorageWidget(this);
};
