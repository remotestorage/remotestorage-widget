document.onreadystatechange = function() {
  var state = document.readyState;

  // When document has completely loaded
  if (state == "complete") {
    console.log("document completely loaded");
    initOnCompleteLoad();
  }

};

function initOnCompleteLoad () {
  var logo = document.getElementById("rs-logo");
  var logoWidth = logo.clientWidth;

  // var box = document.getElementById("rs-box");
  // var boxWidth = box.clientWidth;
  // box.style.margin = "polygon(0% 0%, 90% 0%, 90% 8%, 95.5% 12.5%, 100% 9%, 100% 100%, 0% 100%)";
}


// CSS can't animate to responsive height (as in height: auto)
// so we need to store the height, set it to 0 and readd it when we want the animation
var chooseBox = document.getElementsByClassName("rs-box-choose")[0];
var chooseBoxHeight = chooseBox.clientHeight;
// Set the height to zero until the initial button is triggered
chooseBox.setAttribute("style", "height: 0");


// Also center sign in box
var signInBox = document.getElementsByClassName("rs-box-sign-in")[0];
var signInBoxHeight = signInBox.clientHeight;
var signInContent = document.getElementsByClassName("rs-sign-in-content")[0]
var signInContentHeight = signInContent.clientHeight;


// Button events
var rsWidget = document.getElementById("rs-widget");
var rsInitial = document.getElementsByClassName("rs-box-initial");
var rsChooseButton = document.getElementsByClassName("rs-big-button");
var rsDisconnectButton = document.getElementsByClassName("rs-disconnect");
var rsSignIn = document.getElementsByClassName("rs-submit")

// Initial button
rsInitial[0].addEventListener("click", function(e) {
  console.log("clicked initial button");
  rsWidget.classList.remove("rs-state-initial");
  rsWidget.classList.add("rs-state-choose");

  // Set height of the ChooseBox back to original height.
  chooseBox.setAttribute("style", "height: " + chooseBoxHeight);
});

// Choose RS button
rsChooseButton[0].addEventListener("click", function(e) {
  console.log("clicked RS button");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-sign-in");

  chooseBox.setAttribute("style", "height: 0");
  signInBox.setAttribute("style", "height: " + chooseBoxHeight);
  signInContent.setAttribute("style", "padding-top:" + (chooseBoxHeight - signInContentHeight) / 2);
});

// Sign in button
rsSignIn[0].addEventListener("click", function(e) {
  rsWidget.classList.remove("rs-state-sign-in");
  rsWidget.classList.add("rs-state-connected");

  signInBox.setAttribute("style", "height: 0;");
});

// Choose Dropbox button
rsChooseButton[1].addEventListener("click", function(e) {
  console.log("clicked Dropbox button");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-connected");
});

// Choose Google drive button
rsChooseButton[2].addEventListener("click", function(e) {
  console.log("clicked Google drive Button");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-connected");
});

// Disconnect button
rsDisconnectButton[0].addEventListener("click", function(e) {
  console.log("clicked disconnect button");
  rsWidget.classList.remove("rs-state-connected");
  rsWidget.classList.add("rs-state-initial");
});
