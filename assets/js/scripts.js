document.onreadystatechange = function() {
  var state = document.readyState;

  // if (state == "interactive") {
  // console.log("document ready for interaction")
  //   init();
  // }

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

// TODO
// CSS can't animate to responsive height so we need to check the
// height and add it with JS
var chooseBox = document.getElementsByClassName("rs-box-choose")[0];
var chooseBoxHeight = chooseBox.clientHeight;
// chooseBox.style.height = "0";
chooseBox.setAttribute("style", "height: 0");

// Also center sign in box




var signInBox = document.getElementsByClassName("rs-box-sign-in")[0];
var signInBoxHeight = signInBox.clientHeight;




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

  chooseBox.setAttribute("style", "height: " + chooseBoxHeight);
});

// Choose RS button
rsChooseButton[0].addEventListener("click", function(e) {
  console.log("clicked RS button");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-sign-in");
});

// Sign in button
rsSignIn[0].addEventListener("click", function(e) {
  rsWidget.classList.remove("rs-state-sign-in");
  rsWidget.classList.add("rs-state-connected");
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
