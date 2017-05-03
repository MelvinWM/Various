"use strict";
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
