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
