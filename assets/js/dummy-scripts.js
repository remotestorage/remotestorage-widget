var rsWidget = document.getElementById("rs-widget");
var rsInitial = document.getElementsByClassName("rs-box-initial");
var rsChooseButton = document.getElementById("rs-choose-rs");
var rsDisconnectButton = document.getElementById("rs-disconnect");


// rsWidget.onclick = function(e) {
//   console.log("clicked inital button"); rsWidget.classList.remove("rs-state-initial");
//   rsWidget.classList.add("rs-state-choose");
//   rsWidget.onclick = null;
// };

rsInitial[0].addEventListener("click", function(e) {
  console.log("clicked initial button");
  rsWidget.classList.remove("rs-state-initial");
  rsWidget.classList.add("rs-state-choose");
});

rsChooseButton.addEventListener("click", function(e) {
  console.log("clicked choose rs");
  rsWidget.classList.remove("rs-state-choose");
  rsWidget.classList.add("rs-state-connected");
});
