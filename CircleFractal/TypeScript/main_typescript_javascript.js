/// <reference path="circlefractal_image_drawing.ts" />
/// <reference path="webworker_messages.ts" />
/// <reference path="webworker_image_drawing.ts" />
"use strict";
function myMainFun() {
    // Setup various.
    function nullMap(argNull, fun) {
        if (argNull === null) {
            return null;
        }
        else {
            return fun(argNull);
        }
    }
    // Setup GUI and various.
    var myErrorText = (function () {
        var myErrorTextNull = document.getElementById("error_text");
        if (myErrorTextNull === null) {
            throw new Error("Error text label was null.");
        }
        return myErrorTextNull;
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
    function handleError(errorMessage) {
        var str = "Error occurred: " + errorMessage + ".";
        myErrorText.innerHTML = str;
        window.console.error(str);
        throw new Error(errorMessage);
    }
    ;
    function getOrThrow(argNull) {
        if (argNull === null) {
            throw new Error("Argument was null.");
        }
        return argNull;
    }
    function notNanOrThrow(str) {
        var maybeNan = parseFloat(str);
        if (isNaN(maybeNan)) {
            throw new Error("String was not a valid number: " + str + ".");
        }
        return maybeNan;
    }
    var myReloadButton = getOrThrow(document.getElementById("reload_button"));
    var myDrawingBoard = getOrThrow(document.getElementById("drawing_board"));
    var myDrawingContext = getOrThrow(myDrawingBoard.getContext("2d"));
    function bind(input, show, defaultValue, inputValidations) {
        input.value = defaultValue.toString();
        var update = function () {
            show.innerHTML = input.value.toString();
        };
        update();
        input.onchange = update;
        input.onclick = update;
        input.oninput = update;
        inputValidations.push(input);
    }
    var inputValidations = [];
    var myInputIterations = getOrThrow(document.getElementById("input_iterations"));
    var myShowIterations = getOrThrow(document.getElementById("show_iterations"));
    bind(myInputIterations, myShowIterations, 5, inputValidations);
    var myInputDivision = getOrThrow(document.getElementById("input_division"));
    var myShowDivision = getOrThrow(document.getElementById("show_division"));
    bind(myInputDivision, myShowDivision, 2, inputValidations);
    var myInputCutoff = getOrThrow(document.getElementById("input_cutoff"));
    var myShowCutoff = getOrThrow(document.getElementById("show_cutoff"));
    bind(myInputCutoff, myShowCutoff, 1.5, inputValidations);
    var areFormsValid = function () {
        return inputValidations.every(function (input) {
            return input.checkValidity();
        });
    };
    // Setup drawing.
    var clearBoard = function () {
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
    var previousImageDrawerWebWorkerNull = null;
    clearBoard();
    var reloadAll = function () {
        // Check input.
        if (!areFormsValid()) {
            return;
        }
        // Clear the drawing board.
        clearBoard();
        // Setup new web worker and kill the old one if any.
        nullMap(previousImageDrawerWebWorkerNull, function (previousImageDrawerWebWorker) {
            // Side-note: Another option instead of terminating would be to use poison
            // pills.
            previousImageDrawerWebWorker.terminate();
        });
        var myImageDrawerWebWorker = new Worker('webworker_file.js');
        currentWebWorkerCount = new WebworkerImageDrawing.WebWorkerID(currentWebWorkerCount.webWorkerID + 1);
        // Add the various listeners.
        myImageDrawerWebWorker.addEventListener('message', function (e) {
            var message = e.data[0];
            var webWorkerCount = message.webWorkerID;
            if (webWorkerCount.webWorkerID === currentWebWorkerCount.webWorkerID) {
                if (message.type === WebworkerImageDrawing.DrawnImageResultResponse.type) {
                    var imageBitmap = message.drawnImage;
                    myDrawingContext.drawImage(imageBitmap, 0, 0);
                }
                else if (message.type === WebworkerImageDrawing.ProgressMessage.type) {
                    var progressSoFar = message.progressSoFar;
                    var totalWork = message.totalWork;
                    clearBoard();
                    myDrawingContext.strokeText("Progress: " + Math.round((1.0 * progressSoFar / totalWork) * 100.0) + "%", myDrawingBoard.width / 2.0, myDrawingBoard.height / 2.0);
                }
                else {
                    throw new Error("Unregnized message type from web worker: " + message + ".");
                }
            }
        }, 
        // Arg. "useCapture":
        false);
        myImageDrawerWebWorker.addEventListener('error', function (errorEvent) {
            handleError(errorEvent.message + ", (filename): " + errorEvent.filename + ", (lineno, colono):" +
                errorEvent.lineno + ", " + errorEvent.colno + ".");
        }, 
        // Arg. "useCapture":
        false);
        // Instruct the web worker to create the drawing.
        myImageDrawerWebWorker.postMessage([new WebworkerImageDrawing.DrawImageRequest(currentWebWorkerCount, myDrawingBoard.width, myDrawingBoard.height, notNanOrThrow(myInputIterations.value), notNanOrThrow(myInputDivision.value), notNanOrThrow(myInputCutoff.value))]);
        previousImageDrawerWebWorkerNull = myImageDrawerWebWorker;
    };
    myReloadButton.onclick = reloadAll;
}
;
myMainFun();
