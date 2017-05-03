
"use strict";

/** WARNING: Do not match on the type of the messages! The reason is that
  * class types for TypeScript can in some cases be implemented through
  * internal values and comparisons, and this does not work when using
  * web workers, since web workers are shared-nothing (and so the values
  * used for representing the types cannot be shared). Instead, match on
  * the 'type' property in the message.
  */
namespace WebworkerImageDrawing {

  // General.

  export class WebWorkerID {
    /** Integer, intended as unique ID for the given web worker. */
    readonly webWorkerID: number;
    constructor(webWorkerID: number) {
      this.webWorkerID = webWorkerID;
      if (!Number.isInteger(webWorkerID) || webWorkerID < 0) {
        throw new Error("Web worker ID is not valid: " + webWorkerID + ".");
      }
    }
  }

  // Messages.
  // Response messages must have a property named 'webWorkerID' of type
  // 'WebWorkerID', designating the sending web worker.

  /** For more information on properties, see 'PointToColorCalculator'.
    *
    */
  export class DrawImageRequest {

    static readonly type: string = "DRAW_IMAGE";
    readonly type: string = DrawImageRequest.type;

    readonly webWorkerID: WebWorkerID;
    /** Image width, >= 1. */
    readonly width: number;
    /** Image height, >= 1. */
    readonly height: number;
    readonly numberOfIterations: number;
    readonly divisionFactor: number;
    readonly cutOff: number;

    constructor(webWorkerID: WebWorkerID, width: number, height: number,
        numberOfIterations: number, divisionFactor: number, cutOff: number) {

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
  }

  /** Sent from the web worker to the requester. */
  export class ProgressMessage {

    static readonly type: string = "PROGRESS";
    readonly type: string = ProgressMessage.type;

    readonly webWorkerID: WebWorkerID;
    /** Integer, 'progressSoFar/totalWork' gives the proportion of
      * completion.
      */
    readonly progressSoFar: number;
    /** Integer. See 'progressSoFar'. */
    readonly totalWork: number;

    constructor(webWorkerID: WebWorkerID, progressSoFar: number, totalWork: number) {
      this.webWorkerID = webWorkerID;
      this.progressSoFar = progressSoFar;
      this.totalWork = totalWork;
    }
  }

  export class DrawnImageResultResponse {

    static readonly type: string = "DRAWING_RESULT";
    readonly type: string = DrawnImageResultResponse.type;

    readonly webWorkerID: WebWorkerID;
    readonly drawnImage: ImageBitmap;

    constructor(webWorkerID: WebWorkerID, drawnImage: ImageBitmap) {
      this.webWorkerID = webWorkerID;
      this.drawnImage = drawnImage;
    }
  }
}

