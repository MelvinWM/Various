/// <reference path="circlefractal_image_drawing.ts" />
/// <reference path="webworker_messages.ts" />

"use strict";

namespace WebworkerImageDrawing {

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
  export function drawToImage(event: Event) {

    // Reading in data from message.

    if (event instanceof MessageEvent) {
      const data0 = event.data[0];

      if (data0.type == DrawImageRequest.type) {
        const drawImageRequest = data0;

        const myWebWorkerCount = drawImageRequest.webWorkerID;

        const width = drawImageRequest.width;
        const height = drawImageRequest.height;
        const numberOfIterations = drawImageRequest.numberOfIterations;
        const divisionFactor = drawImageRequest.divisionFactor;
        const cutOff = drawImageRequest.cutOff;

        // Setup.

        const centerX = width/2.0;
        const centerY = height/2.0;
        // Note: Could maybe give as argument instead, but care would have
        // to be taken regarding the cut-off.
        const maximumDistance = CirclefractalImageDrawing.calcLength(centerX, centerY) + 10;

        const pointToColorCalculator = new CirclefractalImageDrawing.PointToColorCalculator(
          centerX, centerY, numberOfIterations, maximumDistance, divisionFactor,
          cutOff
        );

        const partsPerPixel = 4; // Color: RGBA.

        const imageDataArray = new Uint8ClampedArray(width*height*partsPerPixel);

        // Let the number of progress report messages depend on the number of pixels
        // and iterations. Not a great way to do it, but should be OK.
        const progressMessagePixelIndex = Math.round(1000000.0/numberOfIterations);

        // Draw (and send progress messages).

        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {

            const pixelIndex = (x + width*y);
            const index = pixelIndex*partsPerPixel;

            const rgbaArray = pointToColorCalculator.getColor(x, y);

            imageDataArray[index] = rgbaArray[0]; // Red.
            imageDataArray[index + 1] = rgbaArray[1]; // Green.
            imageDataArray[index + 2] = rgbaArray[2]; // Blue.
            imageDataArray[index + 3] = rgbaArray[3]; // Alpha.

            if ((pixelIndex % progressMessagePixelIndex) == 0) {
              const progressSoFar = pixelIndex;
              const totalWork = width*height;
              postMessage([new ProgressMessage(myWebWorkerCount, progressSoFar, totalWork)]);
            }
          }
        }

        // Send drawn image back.

        const imageData = new ImageData(imageDataArray, width, height);
        // Side-note: It would likely not be much work to rewrite to utilize transferables,
        // which would decrease the cost of transfering the image back. The ImageData
        // type should support the Transferable interface.
        createImageBitmap(imageData)
          .then(function(bitmap) {
            postMessage([new DrawnImageResultResponse(myWebWorkerCount, bitmap)]);
          })
          .catch(function(error) {
            // NOTE: Using hack/trick to get errors out from the promise in the web worker.
            // See more here:
            // http://stackoverflow.com/questions/39992417/how-to-bubble-a-web-worker-error-in-a-promise-via-worker-onerror.
            setTimeout(function() { throw error; });
          });
      }
      else {
        throw new Error("Unrecognized message: " + JSON.stringify(data0) + ".");
      }
    }
    else {
      throw new Error("Unexpected event type: " + JSON.stringify(event) + ".");
    }
  };
}

self.addEventListener(
  'message',
  WebworkerImageDrawing.drawToImage,
  // Arg. "useCapture":
  false
);

