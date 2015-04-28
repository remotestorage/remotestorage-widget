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
