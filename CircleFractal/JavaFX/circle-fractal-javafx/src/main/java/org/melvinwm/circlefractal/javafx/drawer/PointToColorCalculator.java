package org.melvinwm.circlefractal.javafx.drawer;

/**
 * Calculates color for given points in the circle-fractal.
 * 
 * <p>
 * Thread safety: Immutable and referentially transparent.
 */
final class PointToColorCalculator {

	private final double centerX;
	private final double centerY;
	private final int numberOfIterations;
	private final double maximumDistance;
	private final int divisionFactor;
	private final double cutOff;
	private final static double startRadius = 50; // Side-note: Hard-coded.
	private final static int startDirection = 0;

	/**
	 * The calculation later on may give a stack overflow if the given
	 * 'numberOfIterations' is too large.
	 * 
	 * @param centerX
	 *            Coordinate for the center of the fractal. Assumed to be relatively
	 *            small, ie. absolute value below 10E6.
	 * @param centerY
	 *            Coordinate for the center of the fractal. Assumed to be relatively
	 *            small, ie. absolute value below 10E6.
	 * @param numberOfIterations
	 *            Number of iterations used when calculating the fractal. Must be at
	 *            least 0. The calculation later on may give a stack overflow if
	 *            given values are too large.
	 * @param maximumDistance
	 *            The color interpolation distance from the cut-off. Must be
	 *            positive and should be somewhat larger than the 'cutOff', for
	 *            instance at least 2 higher.
	 * @param divisionFactor
	 *            The factor by which each fractal circle is decreased in radius.
	 *            Must be at least 2.
	 * @param cutOff
	 *            The color interpolation distance from the edge of a circle and
	 *            outwards. Must be non-negative.
	 */
	public PointToColorCalculator(double centerX, double centerY, int numberOfIterations, double maximumDistance,
			int divisionFactor, double cutOff) {

		this.centerX = centerX;
		this.centerY = centerY;
		this.numberOfIterations = numberOfIterations;
		this.maximumDistance = maximumDistance;
		this.divisionFactor = divisionFactor;
		this.cutOff = cutOff;

		if (cutOff < 0.0 || maximumDistance < cutOff + 1.0) {
			throw new IllegalArgumentException("'cutOff' and/or 'maximumDistance' did not have legal values. c: "
					+ cutOff + ", m: " + maximumDistance + ".");
		}

		if (divisionFactor < 2) {
			throw new IllegalArgumentException("'divisionFactor' was not at least 2: " + divisionFactor + ".");
		}

		if (numberOfIterations < 0) {
			throw new IllegalArgumentException(
					"'numberOfIterations' was not non-negative: " + numberOfIterations + ".");
		}
	}

	private static double sqr(double x) {
		return x * x;
	}

	public static double calcLength(double xd, double yd) {
		return Math.sqrt(sqr(xd) + sqr(yd));
	};

	private int dirReturn(int dir, int newDir) {
		return (dir + newDir) % 4;
	};

	private int getNewDirection(double c1x, double c1y, int dir, int x, int y) {

		final double radsOffset = dir * Math.PI / 2.0;
		final boolean isZero = (y - c1y) == 0.0 && (x - c1x) == 0.0;
		double rads = 0.0;
		if (!isZero) {
			rads = (Math.atan2(y - c1y, x - c1x) - radsOffset + 4.0 * Math.PI) % (2.0 * Math.PI);
		}

		if (rads <= Math.PI / 4.0) {
			return dirReturn(dir, 0);
		} else if (rads <= Math.PI) {
			return dirReturn(dir, 1);
		} else if (rads <= Math.PI * 7.0 / 4.0) {
			return dirReturn(dir, 3);
		} else {
			return dirReturn(dir, 0);
		}
	}

	// NOTE: Since Java is not guaranteed to have tail recursion optimization,
	// this can overflow the stack for too high iteration values.
	private double distanceToCircle(double c1x, double c1y, double r1, int n1, int dir, double lastDistance, int x,
			int y) {

		final double currentDistance = Math.min(calcLength(x - c1x, y - c1y) - r1, lastDistance);

		if (currentDistance <= 0 || n1 <= 0) {
			return currentDistance;
		} else {
			// Calculate new circle.

			final double rnew = r1 * (1.0 / (1.0 * divisionFactor));
			final int dirnew = getNewDirection(c1x, c1y, dir, x, y);
			final double radsnew = dirnew * Math.PI / 2.0;
			final double cnx = c1x + (r1 + rnew) * Math.cos(radsnew);
			final double cny = c1y + (r1 + rnew) * Math.sin(radsnew);

			return distanceToCircle(cnx, cny, rnew, n1 - 1, dirnew, currentDistance, x, y);
		}
	}

	/**
	 * Gets distance from given point to the nearest circle, with distance ceiled by
	 * 'maximumDistance'.
	 *
	 * Basic concept: Determine distance to current iteration's circle. If inside
	 * it, done, else figure out which partition of space the possibly closest
	 * circle is in and check for the next iteration's circle in that given
	 * partition of space.
	 */
	private double getDistance(int x, int y) {

		return distanceToCircle(centerX, centerY, startRadius, numberOfIterations, startDirection, maximumDistance, x,
				y);
	};

	private static boolean is255(int x) {
		return 0 <= x && x <= 255;
	}

	// Returns RGBA in ARGB format, in 32-bit integer.
	private static int toARGB(int red, int green, int blue) {
		if (!is255(red) || !is255(green) || !is255(blue)) {
			throw new IllegalArgumentException(
					"Illegal values for color parts: " + red + ", " + green + ", " + blue + ".");
		}
		return (255 << 24) | (red << 16) | (green << 8) | blue;
	}

	/*
	 * Returns color given distance from some point to the nearest circle for that
	 * point.
	 * 
	 * @param distance The distance for some point to its nearest circle.
	 *
	 * @return A 32-bit integer encoding ARGB-color, with each part being 0-255. For
	 * instance, 0xFF00FF00 is green.
	 */
	private int getColorFromDistanceFromNearestCircle(double distance) {
		if (distance <= 0) {
			return toARGB(0, 0, 0);
		} else if (distance <= cutOff && cutOff > 0.00001) {
			// Interpolate from black to red.
			final int val = (int) Math.max(Math.min(Math.round(255 * distance / cutOff), 255), 0);
			return toARGB(val, 0, 0);
		} else {
			// Interpolate from red to blue.
			final int val = (int) Math
					.max(Math.min(Math.round(255 * (distance - cutOff) / (maximumDistance - cutOff)), 255), 0);
			return toARGB(255 - val, 0, val);
		}
	};

	/**
	 * Given point, returns the corresponding color.
	 * 
	 * By using the color from this function for every point in a canvas, a
	 * circle-fractal image can be gained.
	 * 
	 * Blocking: Can be slightly CPU-heavy.
	 *
	 * @param x
	 *            X-coordinate of the point in the image to get color for. Should
	 *            not be too large, ie. less than 10E6.
	 * @param y
	 *            Y-coordinate of the point in the image to get color for. Should
	 *            not be too large, ie. less than 10E6.
	 * @return A 32-bit integer encoding ARGB-color, with each part being 0-255. For
	 *         instance, 0xFF00FF00 is green.
	 */
	public int getColor(int x, int y) {
		final double distanceToNearestCircle = getDistance(x, y);

		final int argb = getColorFromDistanceFromNearestCircle(distanceToNearestCircle);

		return argb;
	};
}
