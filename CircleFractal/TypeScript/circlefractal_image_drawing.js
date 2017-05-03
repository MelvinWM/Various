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
            if (!Number.isInteger(divisionFactor) || divisionFactor < 1) {
                throw new Error("'divisionFactor' was not a positive integer: " + divisionFactor + ".");
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
