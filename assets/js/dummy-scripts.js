var rsWidget = document.getElementById("rs-widget");
var rsInitial = document.getElementsByClassName("rs-box-initial");
var rsChooseButton = document.getElementById("rs-choose-rs");
var rsDisconnectButton = document.getElementsByClassName("rs-disconnect");


// Initial button
rsInitial[0].addEventListener("click", function(e) {
  console.log("clicked initial button");
  rsWidget.classList.remove("rs-state-initial");
  rsWidget.classList.add("rs-state-choose");
});

// Choose provider button
rsChooseButton.addEventListener("click", function(e) {
  console.log("clicked choose rs");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-connected");
});

// Disconnect button
rsDisconnectButton[0].addEventListener("click", function(e) {
  console.log("clicked disconnect button");
  rsWidget.classList.remove("rs-state-connected");
  rsWidget.classList.add("rs-state-initial");
});
