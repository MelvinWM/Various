
"use strict";


// Utility.



const sqr = function(x) {return x*x;};
/** For a delta x and a delta y, calculate distance.
  *
  * @param xd Delta x.
  * @param yd Delta y.
  */
const calcLength = function(xd, yd) {
  return Math.sqrt(sqr(xd) + sqr(yd));
};



// Circle-fractal drawer.
// NOTE: It would have been great to be able to put this into a module in its own file,
// but as of the current time of writing (2017-04-26), ES6 module support in browsers
// is very, very limited. One could use some library for modules, but that is a bit
// involved for a toy project.



/** Calculates color for given points in the circle-fractal.
  *
  * Also calculates distance to nearest circle in the circle-fractal as well
  * as color given distance.
  */
class PointToColorCalculator {

  /**
    * @param centerX The X-coordinate of the start of the fractal, typically the center
    *   of the image.
    * @param centerY The Y-coordinate of the start of the fractal, typically the center
    *   of the image.
    * @param numberOfIterations The number of iterations of the fractal. Ie. 0 gives one circle,
    *   1 gives four circles, 2 gives thirteen circles, etc.
    *   Formula: circleCount(n) = (3^(n+1) - 1)/2
    *   (using similar reasoning as 2^0 + 2^1 + 2^2...2^n = 2^(n+1) - 1, but instead using base 3).
    *   Must be non-negative integer.
    * @param maximumDistance Floating-point, is used for color calculation (since color is calculated
    *   depending on the distance to the closest circle). Must be positive, and at least 1 greater
    *   than 'cutOff' to avoid issues with underflow and the like.
    * @param divisionFactor Strictly positive integer, division factor decrease in circle size for
    *   each iteration.
    * @param cutOff Floating-point, used for color interpolation based on distance. Must be
    *   non-negative. Smoothing length from the circle edge and outwards.
    */
  constructor(centerX, centerY, numberOfIterations, maximumDistance, divisionFactor,
      cutOff) {

    this.centerX = centerX;
    this.centerY = centerY;
    this.numberOfIterations = numberOfIterations;
    this.maximumDistance = maximumDistance;
    this.divisionFactor = divisionFactor;
    this.cutOff = cutOff;

    // NOTE: Could add more argument checking.

    if (cutOff < 0.0 || maximumDistance < cutOff + 1.0) {
      throw new Error(
        "'cutOff' and/or 'maximumDistance' did not have legal values. c: " +
        cutOff + ", m: " + maximumDistance + "."
      );
    }

    this.startRadius = 50; // Side-note: Hard-coded.
    this.startDirection = 0;
  }

  dirReturn(dir, newDir) {
    return (dir + newDir) % 4;
  };

  /** Gets distance from given point to the nearest circle,
    * with distance ceiled by 'maximumDistance'.
    *
    * Basic concept: Determine distance to current iteration's circle. If inside it,
    * done, else figure out which partition of space the possibly closest circle is
    * in and check for the next iteration's circle in that given partition of space.
    */
  getDistance(x, y) {

    const currentObject = this;

    const getNewDirection = function(c1x, c1y, dir) {
      const radsOffset = dir*Math.PI/2.0;
      const isZero = (y - c1y) == 0 && (x - c1x) == 0;
      var rads = 0.0;
      if (!isZero) {
        rads = (Math.atan2(y - c1y, x - c1x) - radsOffset + 4.0*Math.PI) % (2.0*Math.PI);
      }

      if (rads <= Math.PI/4.0) {
        return currentObject.dirReturn(dir, 0);
      }
      else if (rads <= Math.PI) {
        return currentObject.dirReturn(dir, 1);
      }
      else if (rads <= Math.PI*7.0/4.0) {
        return currentObject.dirReturn(dir, 3);
      }
      else {
        return currentObject.dirReturn(dir, 0);
      }
    };

    // NOTE: Since JavaScript is not guaranteed to have tail recursion optimization,
    // this can overflow the stack for too high iteration values.
    const distanceToCircle = function(c1x, c1y, r1, n1, dir, lastDistance) {

      const currentDistance = Math.min(calcLength(x - c1x, y - c1y) - r1, lastDistance);

      if (currentDistance <= 0 || n1 <= 0) {
        return currentDistance;
      }
      else {
        // Calculate new circle.

        const rnew = r1*(1.0/(1.0*currentObject.divisionFactor));
        const dirnew = getNewDirection(c1x, c1y, dir);
        const radsnew = dirnew*Math.PI/2.0;
        const cnx = c1x + (r1 + rnew)*Math.cos(radsnew);
        const cny = c1y + (r1 + rnew)*Math.sin(radsnew);

        return distanceToCircle(cnx, cny, rnew, n1 - 1, dirnew, currentDistance);
      }
    };

    return distanceToCircle(
      this.centerX, this.centerY, this.startRadius, this.numberOfIterations,
      this.startDirection, this.maximumDistance);
  };

  /** Returns color given distance from some point to the nearest circle for that point.
    *
    * @param distance The distance for some point to its nearest circle.
    *
    * @return An array with RGBA-color (with values in [0; 255]). For instance,
    *   "[0, 255, 0, 255]" is green.
    */
  getColorFromDistanceFromNearestCircle(distance) {
    if (distance <= 0) {
      return [0, 0, 0, 255];
    }
    else if (distance <= this.cutOff && this.cutOff > 0.00001) { // Interpolate from black to red.
      const val = Math.max(Math.min(Math.round(255*distance/this.cutOff), 255), 0);
      return [val, 0, 0, 255];
    }
    else { // Interpolate from red to blue.
      const val = Math.max(Math.min(Math.round(255*(distance-this.cutOff)/(this.maximumDistance-this.cutOff)), 255), 0);
      return [255-val, 0, val, 255];
    }
  };

  /** Given point, returns the corresponding color.
    *
    * @return An array with RGBA-color (with values in [0; 255]). For instance,
    *   "[0, 255, 0, 255]" is green.
    */
  getColor(x, y) {
    const distanceToNearestCircle = this.getDistance(x, y);

    const rgbaArray = this.getColorFromDistanceFromNearestCircle(distanceToNearestCircle);

    return rgbaArray;
  };
};



// Main web worker function.



/** A web worker regarding drawing a circle-fractal and sending it back.
  *
  * The web worker supports receiving a request regarding the specific
  * circle-fractal it should draw, begin drawing it (including sending
  * progress messages back in case it takes a long time), and sending
  * the resulting image back.
  *
  * Communication protocol
  * (NOTE: Currently very little validation of message shape and content):
  * - Receiving messages:
  * -- Draw image request:
  * --- data[0]: Web worker ID: int (used when sending messages back in
  *       order to determine where the message came from).
  * --- data[1]: Drawing instructions: object; {width: int, height: int,
  *       numberOfIterations: int, divisionFactor: int, cutOff: int}.
  *       See 'PointToColorCalculator' for argument explanations.
  * - Sending messages:
  * -- Progress report:
  * --- data[0]: type == "PROGRESS".
  * --- data[1]: Web worker ID: int.
  * --- data[2]: Progress report: object; {progressSoFar: int, totalWork: int}.
  *       'progressSoFar/totalWork' gives the percentage of completion.
  * -- Drawn image:
  * --- data[0]: type == "DRAWING_RESULT".
  * --- data[1]: Web worker ID: int.
  * --- data[2]: Drawn image: ImageBitmap
  *       (https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap).
  *
  * The web worker in its current version can be reused, though it does not
  * respond until it has finished its current task. It also does not keep its
  * ID upon new uses.
  */
const drawToImage = function(event) {

  // Reading in data from message.

  const myWebWorkerCount = event.data[0];
  const drawingInstructions = event.data[1];

  const width = drawingInstructions.width;
  const height = drawingInstructions.height;
  const numberOfIterations = drawingInstructions.numberOfIterations;
  const divisionFactor = drawingInstructions.divisionFactor;
  const cutOff = drawingInstructions.cutOff;

  // Setup.

  const centerX = width/2.0;
  const centerY = height/2.0;
  // Note: Could maybe give as argument instead, but care would have
  // to be taken regarding the cut-off.
  const maximumDistance = calcLength(centerX, centerY) + 10;

  const pointToColorCalculator = new PointToColorCalculator(
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
        postMessage(["PROGRESS", myWebWorkerCount, {progressSoFar: progressSoFar, totalWork: totalWork}]);
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
      postMessage(
        ["DRAWING_RESULT", myWebWorkerCount, bitmap]
      );
    })
    .catch(function(error) {
      // NOTE: Using hack/trick to get errors out from the promise in the web worker.
      // See more here:
      // http://stackoverflow.com/questions/39992417/how-to-bubble-a-web-worker-error-in-a-promise-via-worker-onerror.
      setTimeout(function() { throw error; });
    });
};

self.addEventListener(
  'message',
  drawToImage,
  // Arg. "useCapture":
  false
);

