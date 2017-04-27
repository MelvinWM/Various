
"use strict";

const myMainFun = function() {

  // Setup GUI.

  const myReloadButton = document.getElementById("reload_button");
  const myDrawingBoard = document.getElementById("drawing_board");
  const myErrorText = document.getElementById("error_text");
  const myDrawingContext = myDrawingBoard.getContext("2d");

  const bind = function(input, show, defaultValue, inputValidations) {
    input.value = defaultValue;
    const update = function() {
      show.innerHTML = input.value;
    };
    update();
    input.onchange = update;
    input.onclick = update;
    input.oninput = update;
    inputValidations.push(input);
  }
  const inputValidations = [];

  const myInputIterations = document.getElementById("input_iterations");
  const myShowIterations = document.getElementById("show_iterations");
  bind(myInputIterations, myShowIterations, 5, inputValidations);

  const myInputDivision = document.getElementById("input_division");
  const myShowDivision = document.getElementById("show_division");
  bind(myInputDivision, myShowDivision, 2, inputValidations);

  const myInputCutoff = document.getElementById("input_cutoff");
  const myShowCutoff = document.getElementById("show_cutoff");
  bind(myInputCutoff, myShowCutoff, 1.5, inputValidations);

  const areFormsValid = function() {
    return inputValidations.every(function(input) {
      return input.checkValidity();
    });
  };

  const handleError = function(errorMessage) {
    myErrorText.innerHTML = "Internal error occurred. See logs for more information.";
    window.console.error("Error occurred: " + errorMessage);
  };

  // Setup drawing.

  const clearBoard = function() {
    myDrawingContext.save();
    myDrawingContext.fillStyle = 'gray';
    myDrawingContext.fillRect(0, 0, myDrawingBoard.width, myDrawingBoard.height);
    myDrawingContext.restore();
  };

  // Setup worker communication and control.

  if (!window.Worker) {
    handleError("Web workers are not supported.");
    // Continue onwards optimistically (OK in a toy project).
  }

  // Used to track which messages from a worker belong to the current worker.
  // Side-note: Can in theory overflow, though is in practice unlikely to.
  // Alternatives include stuff like UUID (which is almost fully a guarantee and
  // depending on case requires good and secure random generation).
  var currentWebWorkerCount = 0;

  var myImageDrawerWebWorkerNull = null;

  clearBoard();

  const reloadAll = function() {

    // Check input.

    if (!areFormsValid()) {
      return;
    }

    // Clear the drawing board.

    clearBoard();

    // Setup new web worker and kill the old one if any.

    if (myImageDrawerWebWorkerNull != null) {
      // Side-note: Another option instead of terminating would be to use poison
      // pills.
      myImageDrawerWebWorkerNull.terminate();
    }
    myImageDrawerWebWorkerNull = new Worker('webworker_image_drawer.js');
    currentWebWorkerCount++;

    // Add the various listeners.

    myImageDrawerWebWorkerNull.addEventListener(
      'message',
      function(e) {

        const type = e.data[0];
        const webWorkerCount = e.data[1];

        if (webWorkerCount === currentWebWorkerCount) {

          if (type === "DRAWING_RESULT") {
            const imageBitmap = e.data[2];
            myDrawingContext.drawImage(imageBitmap, 0, 0);
          }
          else if (type === "PROGRESS") {

            const progressSoFar = e.data[2].progressSoFar;
            const totalWork = e.data[2].totalWork;

            clearBoard();

            myDrawingContext.strokeText(
              "Progress: " + Math.round((1.0*progressSoFar/totalWork)*100.0) + "%",
              myDrawingBoard.width/2.0, myDrawingBoard.height/2.0
            );
          }
          else {
            handleError("Unregnized message type from web worker: " + type);
          }
        }
      },
      // Arg. "useCapture":
      false
    );

    myImageDrawerWebWorkerNull.addEventListener(
      'error',
      function(errorEvent) {
        handleError(
          errorEvent.message + ", (filename): " + errorEvent.filename + ", (lineno, colono):" +
          errorEvent.lineno + ", " + errorEvent.colno + "."
        );
      },
      // Arg. "useCapture":
      false
    );

    // Instruct the web worker to create the drawing.

    const drawingInstructions = {
      width: myDrawingBoard.width,
      height: myDrawingBoard.height,
      numberOfIterations: myInputIterations.value,
      divisionFactor: myInputDivision.value,
      cutOff: myInputCutoff.value
    };
    myImageDrawerWebWorkerNull.postMessage([currentWebWorkerCount, drawingInstructions]);
  };

  myReloadButton.onclick = reloadAll;
};

myMainFun();

