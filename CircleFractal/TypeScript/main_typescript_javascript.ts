/// <reference path="circlefractal_image_drawing.ts" />
/// <reference path="webworker_messages.ts" />
/// <reference path="webworker_image_drawing.ts" />

"use strict";

function myMainFun() {

  // Setup various.

  function nullMap<T, U>(argNull: T | null, fun: (x: T) => U): U | null {
    if (argNull === null) {
      return null;
    }
    else {
      return fun(argNull as T);
    }
  }

  // Setup GUI and various.

  const myErrorText = (function(){

    const myErrorTextNull = document.getElementById("error_text");
    if (myErrorTextNull === null) {
      throw new Error("Error text label was null.");
    }
    return myErrorTextNull as HTMLLabelElement;
  })();

  /** Handle potentially expected errors (like missing support) that users
    * might be able to recover from, for instance by switching browsers.
    *
    * For programming/unexpected errors, throw it directly instead of using
    * this function.
    *
    * In a production application, errors should probably be logged/tracked
    * and sent somewhere, and fallbacks should be provided in case of
    * missing support (or at least user-friendly and accurate error
    * handling when support is missing).
    */
  function handleError(errorMessage: string) {
    const str = "Error occurred: " + errorMessage + ".";
    myErrorText.innerHTML = str;
    window.console.error(str);
    throw new Error(errorMessage);
  };

  function getOrThrow<T>(argNull: T | null): T {
    if (argNull === null) {
      throw new Error("Argument was null.");
    }
    return argNull as T;
  }

  function notNanOrThrow(str: string): number {
    const maybeNan = parseFloat(str);
    if (isNaN(maybeNan)) {
      throw new Error("String was not a valid number: " + str + ".");
    }
    return maybeNan;
  }

  const myReloadButton = getOrThrow(document.getElementById("reload_button"));
  const myDrawingBoard = getOrThrow(document.getElementById("drawing_board")) as HTMLCanvasElement;
  const myDrawingContext = getOrThrow(myDrawingBoard.getContext("2d"));

  function bind(
      input: HTMLInputElement, showNull: HTMLLabelElement | null,
      defaultValue: number, inputValidations: HTMLInputElement[]) {
    input.value = defaultValue.toString();
    const update = function() {
      if (showNull) {
        showNull.innerHTML = input.value.toString();
      }
    };
    update();
    input.onchange = update;
    input.onclick = update;
    input.oninput = update;
    inputValidations.push(input);
  }
  const inputValidations: Array<HTMLInputElement> = [];

  const myInputIterations = getOrThrow(document.getElementById("input_iterations")) as HTMLInputElement;
  bind(myInputIterations, null, 5, inputValidations);

  const myInputDivision = getOrThrow(document.getElementById("input_division")) as HTMLInputElement;
  const myShowDivision = getOrThrow(document.getElementById("show_division")) as HTMLLabelElement;
  bind(myInputDivision, myShowDivision, 2, inputValidations);

  const myInputCutoff = getOrThrow(document.getElementById("input_cutoff")) as HTMLInputElement;
  bind(myInputCutoff, null, 1.5, inputValidations);

  const areFormsValid = function() {
    return inputValidations.every(function(input) {
      return input.checkValidity();
    });
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
  }

  // Used to track which messages from a worker belong to the current worker.
  // Side-note: Can in theory overflow, though is in practice unlikely to.
  // Alternatives include stuff like UUID (which is almost fully a guarantee and
  // depending on case requires good and secure random generation).
  var currentWebWorkerCount = new WebworkerImageDrawing.WebWorkerID(0);

  var previousImageDrawerWebWorkerNull: Worker | null = null;

  clearBoard();

  const reloadAll = function() {

    // Check input.

    if (!areFormsValid()) {
      return;
    }

    // Clear the drawing board.

    clearBoard();

    // Setup new web worker and kill the old one if any.

    nullMap(previousImageDrawerWebWorkerNull, function(previousImageDrawerWebWorker) {
      // Side-note: Another option instead of terminating would be to use poison
      // pills.
      previousImageDrawerWebWorker.terminate();
    });
    const myImageDrawerWebWorker = new Worker('webworker_file.js');
    currentWebWorkerCount = new WebworkerImageDrawing.WebWorkerID(currentWebWorkerCount.webWorkerID + 1);

    // Add the various listeners.

    myImageDrawerWebWorker.addEventListener(
      'message',
      function(e) {

        const message = e.data[0];
        const webWorkerCount = message.webWorkerID;

        if (webWorkerCount.webWorkerID === currentWebWorkerCount.webWorkerID) {

          if (message.type === WebworkerImageDrawing.DrawnImageResultResponse.type) {
            const imageBitmap: ImageBitmap = message.drawnImage;
            myDrawingContext.drawImage(imageBitmap, 0, 0);
          }
          else if (message.type === WebworkerImageDrawing.ProgressMessage.type) {

            const progressSoFar = message.progressSoFar;
            const totalWork = message.totalWork;

            clearBoard();

            myDrawingContext.strokeText(
              "Progress: " + Math.round((1.0*progressSoFar/totalWork)*100.0) + "%",
              myDrawingBoard.width/2.0, myDrawingBoard.height/2.0
            );
          }
          else {
            throw new Error("Unregnized message type from web worker: " + message + ".");
          }
        }
      },
      // Arg. "useCapture":
      false
    );

    myImageDrawerWebWorker.addEventListener(
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

    myImageDrawerWebWorker.postMessage(
      [new WebworkerImageDrawing.DrawImageRequest(
        currentWebWorkerCount,
        myDrawingBoard.width,
        myDrawingBoard.height,
        notNanOrThrow(myInputIterations.value),
        notNanOrThrow(myInputDivision.value),
        notNanOrThrow(myInputCutoff.value)
      )]
    );

    previousImageDrawerWebWorkerNull = myImageDrawerWebWorker;
  };

  myReloadButton.onclick = reloadAll;
};

myMainFun();

