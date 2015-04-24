var rsWidget = document.getElementById("rs-widget");

if (rsWidget.classList.contains("rs-state-initial")) {
  console.log("widget is in initial state");
  rsWidget.onclick = function(e) {
    console.log("clicked " + rsWidget.classList.remove("rs-state-initial"));
    rsWidget.classList.add("rs-state-choose");
  };
}
