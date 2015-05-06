
// CSS can't animate to unknown height (as in height: auto)
// so we need to store the height, set it to 0 and use it when we want the animation
var chooseBox = document.getElementsByClassName("rs-box-choose")[0];
var chooseBoxHeight = chooseBox.clientHeight;
// Set the height to zero until the initial button is clicked
chooseBox.setAttribute("style", "height: 0");

var signInBox = document.getElementsByClassName("rs-box-sign-in")[0];
var signInContent = document.getElementsByClassName("rs-sign-in-content")[0];
var signInContentHeight = signInContent.clientHeight;

var rsWidget = document.getElementById("rs-widget");
var rsLogo = document.getElementsByClassName("rs-main-logo")[0];
var rsCloseButton = document.getElementsByClassName("rs-close")[0];
var rsInitial = document.getElementsByClassName("rs-box-initial")[0];
var rsChooseButton = document.getElementsByClassName("rs-button-big");
var rsDisconnectButton = document.getElementsByClassName("rs-disconnect")[0];
var rsSyncButton = document.getElementsByClassName("rs-sync")[0];
var rsSignInButton = document.getElementsByClassName("rs-submit")[0];
var rsConnected = document.getElementsByClassName("rs-box-connected")[0];

// Initial button
rsInitial.addEventListener("click", function(e) {
  console.log("clicked initial button");
  rsWidget.classList.remove("rs-state-initial");
  rsWidget.classList.add("rs-state-choose");
  fadeOut(this);
  // Set height of the ChooseBox back to original height.
  chooseBox.setAttribute("style", "height: " + chooseBoxHeight);
});

// Choose RS button
rsChooseButton[0].addEventListener("click", function(e) {
  console.log("clicked RS button");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-sign-in");
  chooseBox.setAttribute("style", "height: 0");
  signInBox.setAttribute("style", "height: " + chooseBoxHeight); // Set the sign in box to same height as chooseBox
  signInContent.setAttribute("style", "padding-top:" + (chooseBoxHeight - signInContentHeight) / 2); // Center it
});

// Sign in button
rsSignInButton.addEventListener("click", function(e) {
  rsWidget.classList.remove("rs-state-sign-in");
  rsWidget.classList.add("rs-state-connected");
  delayFadeIn(rsConnected, 600);
  signInBox.setAttribute("style", "height: 0;");
});

// Choose Dropbox button
rsChooseButton[1].addEventListener("click", function(e) {
  console.log("clicked Dropbox button");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-connected");
  chooseBox.setAttribute("style", "height: 0");
  delayFadeIn(rsConnected, 600);
});

// Choose Google drive button
rsChooseButton[2].addEventListener("click", function(e) {
  console.log("clicked Google drive Button");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-connected");
  chooseBox.setAttribute("style", "height: 0");
  delayFadeIn(rsConnected, 600);
});

// Disconnect button
rsDisconnectButton.addEventListener("click", function(e) {
  console.log("clicked disconnect button");
  rsWidget.classList.remove("rs-state-connected");
  rsWidget.classList.add("rs-state-initial");
  fadeOut(rsConnected);
  delayFadeIn(rsInitial, 300);
});

// Sync button
rsSyncButton.addEventListener("click", function(e) {
  console.log("clicked sync button");
  rsSyncButton.classList.toggle("rs-rotate");
});

// Close button
rsCloseButton.addEventListener("click", function(e) {
  console.log("clicked close button");
  rsWidget.classList.remove("rs-state-sign-in");
  rsWidget.classList.remove("rs-state-choose");
  delayFadeIn(rsInitial, 300);
  signInBox.setAttribute("style", "height: 0;");
  chooseBox.setAttribute("style", "height: 0;");
});

// Reduce to only icon if connected and clicked outside of widget
document.addEventListener("click", function(e) {
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
rsLogo.addEventListener("click", function(e) {
  if (rsWidget.classList.contains("rs-state-connected")) {
    rsWidget.classList.toggle("rs-hide", false);
    delayFadeIn(rsConnected, 300);
  }
});


// To delay fadeIn until other animations are finished
function delayFadeIn(element, delayTime) {
  setTimeout(function() {
    fadeIn(element);
  }, delayTime);
}

// CSS can't fade elements in and out of the page flow so we have to do it in JS
function fadeOut(element) {
  var op = 1;  // initial opacity
  var timer = setInterval(function () {
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
  var op = 0.1;  // initial opacity
  element.style.display = "block";
  var timer = setInterval(function () {
    if (op >= 1){
      clearInterval(timer);
    }
    element.style.opacity = op;
    element.style.filter = "alpha(opacity=" + op * 100 + ")";
    op += op * 0.1;
  }, 3);
}
