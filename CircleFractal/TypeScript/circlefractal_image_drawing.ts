
"use strict";

namespace CirclefractalImageDrawing {

  // Utility.



  export const sqr = function(x: number) {return x*x;};
  /** For a delta x and a delta y, calculate distance.
    *
    * @param xd Delta x.
    * @param yd Delta y.
    */
  export const calcLength = function(xd: number, yd: number) {
    return Math.sqrt(sqr(xd) + sqr(yd));
  };



  // Circle-fractal drawer.



  /** Calculates color for given points in the circle-fractal.
    *
    * Also calculates distance to nearest circle in the circle-fractal as well
    * as color given distance.
    */
  export class PointToColorCalculator {

    /** The X-coordinate of the start of the fractal, typically the center
      * of the image.
      */
    readonly centerX: number;
    /** The Y-coordinate of the start of the fractal, typically the center
      * of the image.
      */
    readonly centerY: number;
    /** The number of iterations of the fractal. Ie. 0 gives one circle,
      * 1 gives four circles, 2 gives thirteen circles, etc.
      *
      * Formula: circleCount(n) = (3^(n+1) - 1)/2
      * (using similar reasoning as 2^0 + 2^1 + 2^2...2^n = 2^(n+1) - 1, but instead using base 3).
      *
      * Must be non-negative integer.
      */
    readonly numberOfIterations: number;
    /** Used for color calculation (since color is calculated depending on
      * the distance to the closest circle). Must be positive, and at least
      * 1 greater than 'cutOff' to avoid issues with underflow and the like.
      */
    readonly maximumDistance: number;
    /** Strictly positive integer, >= 2, division factor decrease in circle size for
      * each iteration.
      */
    readonly divisionFactor: number;
    /** Used for color interpolation based on distance. Must be
      * non-negative. Smoothing length from the circle edge and outwards.
      */
    readonly cutOff: number;

    readonly startRadius: number = 50; // Side-note: Hard-coded.
    readonly startDirection = 0;

    constructor(centerX: number, centerY: number, numberOfIterations: number,
        maximumDistance: number, divisionFactor: number, cutOff: number) {

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
        throw new Error("'divisionFactor' was not an integer greater than 1: "+ divisionFactor + ".");
      }

      if (!Number.isInteger(numberOfIterations) || numberOfIterations < 0) {
        throw new Error("'numberOfIterations' was not a non-negative integer.");
      }
    }

    dirReturn(dir: number, newDir: number) {
      return (dir + newDir) % 4;
    };

    /** Gets distance from given point to the nearest circle,
      * with distance ceiled by 'maximumDistance'.
      *
      * Basic concept: Determine distance to current iteration's circle. If inside it,
      * done, else figure out which partition of space the possibly closest circle is
      * in and check for the next iteration's circle in that given partition of space.
      */
    getDistance(x: number, y: number): number {

      const currentObject = this;

      const getNewDirection = function(c1x: number, c1y: number, dir: number) {
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

      // NOTE: Since JavaScript/TypeScript is not guaranteed to have tail recursion optimization,
      // this can overflow the stack for too high iteration values.
      const distanceToCircle = function(c1x: number, c1y: number, r1: number, n1: number,
          dir: number, lastDistance: number): number {

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
    getColorFromDistanceFromNearestCircle(distance: number) {
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
    getColor(x: number, y: number) {
      const distanceToNearestCircle = this.getDistance(x, y);

      const rgbaArray = this.getColorFromDistanceFromNearestCircle(distanceToNearestCircle);

      return rgbaArray;
    };
  };
}

