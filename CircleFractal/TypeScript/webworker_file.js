"use strict";
var CirclefractalImageDrawing;
(function (CirclefractalImageDrawing) {
    // Utility.
    CirclefractalImageDrawing.sqr = function (x) { return x * x; };
    /** For a delta x and a delta y, calculate distance.
      *
      * @param xd Delta x.
      * @param yd Delta y.
      */
    CirclefractalImageDrawing.calcLength = function (xd, yd) {
        return Math.sqrt(CirclefractalImageDrawing.sqr(xd) + CirclefractalImageDrawing.sqr(yd));
    };
    // Circle-fractal drawer.
    /** Calculates color for given points in the circle-fractal.
      *
      * Also calculates distance to nearest circle in the circle-fractal as well
      * as color given distance.
      */
    var PointToColorCalculator = (function () {
        function PointToColorCalculator(centerX, centerY, numberOfIterations, maximumDistance, divisionFactor, cutOff) {
            this.startRadius = 50; // Side-note: Hard-coded.
            this.startDirection = 0;
            this.centerX = centerX;
            this.centerY = centerY;
            this.numberOfIterations = numberOfIterations;
            this.maximumDistance = maximumDistance;
            this.divisionFactor = divisionFactor;
            this.cutOff = cutOff;
            // NOTE: Could add more argument checking.
            if (cutOff < 0.0 || maximumDistance < cutOff + 1.0) {
                throw new Error("'cutOff' and/or 'maximumDistance' did not have legal values. c: " +
                    cutOff + ", m: " + maximumDistance + ".");
            }
            if (!Number.isInteger(divisionFactor) || divisionFactor < 2) {
                throw new Error("'divisionFactor' was not an integer greater than 1: " + divisionFactor + ".");
            }
            if (!Number.isInteger(numberOfIterations) || numberOfIterations < 0) {
                throw new Error("'numberOfIterations' was not a non-negative integer.");
            }
        }
        PointToColorCalculator.prototype.dirReturn = function (dir, newDir) {
            return (dir + newDir) % 4;
        };
        ;
        /** Gets distance from given point to the nearest circle,
          * with distance ceiled by 'maximumDistance'.
          *
          * Basic concept: Determine distance to current iteration's circle. If inside it,
          * done, else figure out which partition of space the possibly closest circle is
          * in and check for the next iteration's circle in that given partition of space.
          */
        PointToColorCalculator.prototype.getDistance = function (x, y) {
            var currentObject = this;
            var getNewDirection = function (c1x, c1y, dir) {
                var radsOffset = dir * Math.PI / 2.0;
                var isZero = (y - c1y) == 0 && (x - c1x) == 0;
                var rads = 0.0;
                if (!isZero) {
                    rads = (Math.atan2(y - c1y, x - c1x) - radsOffset + 4.0 * Math.PI) % (2.0 * Math.PI);
                }
                if (rads <= Math.PI / 4.0) {
                    return currentObject.dirReturn(dir, 0);
                }
                else if (rads <= Math.PI) {
                    return currentObject.dirReturn(dir, 1);
                }
                else if (rads <= Math.PI * 7.0 / 4.0) {
                    return currentObject.dirReturn(dir, 3);
                }
                else {
                    return currentObject.dirReturn(dir, 0);
                }
            };
            // NOTE: Since JavaScript/TypeScript is not guaranteed to have tail recursion optimization,
            // this can overflow the stack for too high iteration values.
            var distanceToCircle = function (c1x, c1y, r1, n1, dir, lastDistance) {
                var currentDistance = Math.min(CirclefractalImageDrawing.calcLength(x - c1x, y - c1y) - r1, lastDistance);
                if (currentDistance <= 0 || n1 <= 0) {
                    return currentDistance;
                }
                else {
                    // Calculate new circle.
                    var rnew = r1 * (1.0 / (1.0 * currentObject.divisionFactor));
                    var dirnew = getNewDirection(c1x, c1y, dir);
                    var radsnew = dirnew * Math.PI / 2.0;
                    var cnx = c1x + (r1 + rnew) * Math.cos(radsnew);
                    var cny = c1y + (r1 + rnew) * Math.sin(radsnew);
                    return distanceToCircle(cnx, cny, rnew, n1 - 1, dirnew, currentDistance);
                }
            };
            return distanceToCircle(this.centerX, this.centerY, this.startRadius, this.numberOfIterations, this.startDirection, this.maximumDistance);
        };
        ;
        /** Returns color given distance from some point to the nearest circle for that point.
          *
          * @param distance The distance for some point to its nearest circle.
          *
          * @return An array with RGBA-color (with values in [0; 255]). For instance,
          *   "[0, 255, 0, 255]" is green.
          */
        PointToColorCalculator.prototype.getColorFromDistanceFromNearestCircle = function (distance) {
            if (distance <= 0) {
                return [0, 0, 0, 255];
            }
            else if (distance <= this.cutOff && this.cutOff > 0.00001) {
                var val = Math.max(Math.min(Math.round(255 * distance / this.cutOff), 255), 0);
                return [val, 0, 0, 255];
            }
            else {
                var val = Math.max(Math.min(Math.round(255 * (distance - this.cutOff) / (this.maximumDistance - this.cutOff)), 255), 0);
                return [255 - val, 0, val, 255];
            }
        };
        ;
        /** Given point, returns the corresponding color.
          *
          * @return An array with RGBA-color (with values in [0; 255]). For instance,
          *   "[0, 255, 0, 255]" is green.
          */
        PointToColorCalculator.prototype.getColor = function (x, y) {
            var distanceToNearestCircle = this.getDistance(x, y);
            var rgbaArray = this.getColorFromDistanceFromNearestCircle(distanceToNearestCircle);
            return rgbaArray;
        };
        ;
        return PointToColorCalculator;
    }());
    CirclefractalImageDrawing.PointToColorCalculator = PointToColorCalculator;
    ;
})(CirclefractalImageDrawing || (CirclefractalImageDrawing = {}));
/** WARNING: Do not match on the type of the messages! The reason is that
  * class types for TypeScript can in some cases be implemented through
  * internal values and comparisons, and this does not work when using
  * web workers, since web workers are shared-nothing (and so the values
  * used for representing the types cannot be shared). Instead, match on
  * the 'type' property in the message.
  */
var WebworkerImageDrawing;
/** WARNING: Do not match on the type of the messages! The reason is that
  * class types for TypeScript can in some cases be implemented through
  * internal values and comparisons, and this does not work when using
  * web workers, since web workers are shared-nothing (and so the values
  * used for representing the types cannot be shared). Instead, match on
  * the 'type' property in the message.
  */
(function (WebworkerImageDrawing) {
    // General.
    var WebWorkerID = (function () {
        function WebWorkerID(webWorkerID) {
            this.webWorkerID = webWorkerID;
            if (!Number.isInteger(webWorkerID) || webWorkerID < 0) {
                throw new Error("Web worker ID is not valid: " + webWorkerID + ".");
            }
        }
        return WebWorkerID;
    }());
    WebworkerImageDrawing.WebWorkerID = WebWorkerID;
    // Messages.
    // Response messages must have a property named 'webWorkerID' of type
    // 'WebWorkerID', designating the sending web worker.
    /** For more information on properties, see 'PointToColorCalculator'.
      *
      */
    var DrawImageRequest = (function () {
        function DrawImageRequest(webWorkerID, width, height, numberOfIterations, divisionFactor, cutOff) {
            this.type = DrawImageRequest.type;
            this.webWorkerID = webWorkerID;
            this.width = width;
            this.height = height;
            this.numberOfIterations = numberOfIterations;
            this.divisionFactor = divisionFactor;
            this.cutOff = cutOff;
            if (width < 1 || height < 1) {
                throw new Error("Width and height were not legal: " + width + ", " + height + ".");
            }
        }
        return DrawImageRequest;
    }());
    DrawImageRequest.type = "DRAW_IMAGE";
    WebworkerImageDrawing.DrawImageRequest = DrawImageRequest;
    /** Sent from the web worker to the requester. */
    var ProgressMessage = (function () {
        function ProgressMessage(webWorkerID, progressSoFar, totalWork) {
            this.type = ProgressMessage.type;
            this.webWorkerID = webWorkerID;
            this.progressSoFar = progressSoFar;
            this.totalWork = totalWork;
        }
        return ProgressMessage;
    }());
    ProgressMessage.type = "PROGRESS";
    WebworkerImageDrawing.ProgressMessage = ProgressMessage;
    var DrawnImageResultResponse = (function () {
        function DrawnImageResultResponse(webWorkerID, drawnImage) {
            this.type = DrawnImageResultResponse.type;
            this.webWorkerID = webWorkerID;
            this.drawnImage = drawnImage;
        }
        return DrawnImageResultResponse;
    }());
    DrawnImageResultResponse.type = "DRAWING_RESULT";
    WebworkerImageDrawing.DrawnImageResultResponse = DrawnImageResultResponse;
})(WebworkerImageDrawing || (WebworkerImageDrawing = {}));
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
                var progressMessagePixelIndex = Math.round(1000000.0 / (numberOfIterations + 1));
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
