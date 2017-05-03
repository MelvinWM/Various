/// <reference path="circlefractal_image_drawing.ts" />
/// <reference path="webworker_messages.ts" />
"use strict";
var WebworkerImageDrawing;
(function (WebworkerImageDrawing) {
    /** A web worker regarding drawing a circle-fractal and sending it back.
      *
      * The web worker supports receiving a request regarding the specific
      * circle-fractal it should draw, begin drawing it (including sending
      * progress messages back in case it takes a long time), and sending
      * the resulting image back.
      *
      * Communication protocol
      * - Receiving messages:
      * -- DrawImageRequest
      * - Sending messages:
      * -- ProgressMessage
      * -- DrawnImageResultResponse
      *
      * The web worker in its current version can be reused, though it does not
      * respond until it has finished its current task. It also does not keep its
      * ID upon new uses.
      */
    function drawToImage(event) {
        // Reading in data from message.
        if (event instanceof MessageEvent) {
            var data0 = event.data[0];
            if (data0.type == WebworkerImageDrawing.DrawImageRequest.type) {
                var drawImageRequest = data0;
                var myWebWorkerCount_1 = drawImageRequest.webWorkerID;
                var width = drawImageRequest.width;
                var height = drawImageRequest.height;
                var numberOfIterations = drawImageRequest.numberOfIterations;
                var divisionFactor = drawImageRequest.divisionFactor;
                var cutOff = drawImageRequest.cutOff;
                // Setup.
                var centerX = width / 2.0;
                var centerY = height / 2.0;
                // Note: Could maybe give as argument instead, but care would have
                // to be taken regarding the cut-off.
                var maximumDistance = CirclefractalImageDrawing.calcLength(centerX, centerY) + 10;
                var pointToColorCalculator = new CirclefractalImageDrawing.PointToColorCalculator(centerX, centerY, numberOfIterations, maximumDistance, divisionFactor, cutOff);
                var partsPerPixel = 4; // Color: RGBA.
                var imageDataArray = new Uint8ClampedArray(width * height * partsPerPixel);
                // Let the number of progress report messages depend on the number of pixels
                // and iterations. Not a great way to do it, but should be OK.
                var progressMessagePixelIndex = Math.round(1000000.0 / numberOfIterations);
                // Draw (and send progress messages).
                for (var y = 0; y < height; y++) {
                    for (var x = 0; x < width; x++) {
                        var pixelIndex = (x + width * y);
                        var index = pixelIndex * partsPerPixel;
                        var rgbaArray = pointToColorCalculator.getColor(x, y);
                        imageDataArray[index] = rgbaArray[0]; // Red.
                        imageDataArray[index + 1] = rgbaArray[1]; // Green.
                        imageDataArray[index + 2] = rgbaArray[2]; // Blue.
                        imageDataArray[index + 3] = rgbaArray[3]; // Alpha.
                        if ((pixelIndex % progressMessagePixelIndex) == 0) {
                            var progressSoFar = pixelIndex;
                            var totalWork = width * height;
                            postMessage([new WebworkerImageDrawing.ProgressMessage(myWebWorkerCount_1, progressSoFar, totalWork)]);
                        }
                    }
                }
                // Send drawn image back.
                var imageData = new ImageData(imageDataArray, width, height);
                // Side-note: It would likely not be much work to rewrite to utilize transferables,
                // which would decrease the cost of transfering the image back. The ImageData
                // type should support the Transferable interface.
                createImageBitmap(imageData)
                    .then(function (bitmap) {
                    postMessage([new WebworkerImageDrawing.DrawnImageResultResponse(myWebWorkerCount_1, bitmap)]);
                })["catch"](function (error) {
                    // NOTE: Using hack/trick to get errors out from the promise in the web worker.
                    // See more here:
                    // http://stackoverflow.com/questions/39992417/how-to-bubble-a-web-worker-error-in-a-promise-via-worker-onerror.
                    setTimeout(function () { throw error; });
                });
            }
            else {
                throw new Error("Unrecognized message: " + JSON.stringify(data0) + ".");
            }
        }
        else {
            throw new Error("Unexpected event type: " + JSON.stringify(event) + ".");
        }
    }
    WebworkerImageDrawing.drawToImage = drawToImage;
    ;
})(WebworkerImageDrawing || (WebworkerImageDrawing = {}));
self.addEventListener('message', WebworkerImageDrawing.drawToImage, 
// Arg. "useCapture":
false);
