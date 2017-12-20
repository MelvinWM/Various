package org.melvinwm.circlefractal.javafx.drawer;

import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.function.Consumer;

import org.junit.jupiter.api.Test;

public class PointToColorCalculatorTest {

	private final static double centerX = 100;
	private final static double centerY = 100;

	@Test
	public void validInitialization() {

		final int validIterationCount = 5;
		final int validDivisionFactor = 2;

		final double basicMaximumDistance = 30;
		final double basicCutOff = 0.01;

		// Testing valid iteration counts.
		{
			for (int validIC : new int[] { 0, 1, 2, 5, 11 }) {
				new PointToColorCalculator(centerX, centerY, validIC, basicMaximumDistance, validDivisionFactor,
						basicCutOff);
			}
		}

		// Testing valid division factors.
		{
			for (int validDF : new int[] { 2, 3, 5, 10 }) {
				new PointToColorCalculator(centerX, centerY, validIterationCount, basicMaximumDistance, validDF,
						basicCutOff);
			}
		}

		// Testing valid maximum distance and cut-off combinations.
		{
			final double[] cutOffs = new double[] { 0.0, 0.01, 0.0, 40.0 };
			final double[] maximumDistances = new double[] { 2.0, 2.0, 500.0, 50.0 };

			for (int i = 0; i < cutOffs.length; i++) {
				final int ii = i;
				new PointToColorCalculator(centerX, centerY, validIterationCount, maximumDistances[ii],
						validDivisionFactor, cutOffs[ii]);
			}
		}
	}

	@Test
	public void invalidInitialization() {

		final int validIterationCount = 5;
		final int validDivisionFactor = 2;

		final double basicMaximumDistance = 30;
		final double basicCutOff = 0.01;

		// Testing invalid iteration counts.
		{
			for (int invalidIC : new int[] { -100, -1 }) {
				assertThrows(IllegalArgumentException.class, () -> new PointToColorCalculator(centerX, centerY,
						invalidIC, basicMaximumDistance, validDivisionFactor, basicCutOff));
			}
		}

		// Testing invalid division factors.
		{
			for (int invalidDF : new int[] { -1, 0, 1 }) {
				assertThrows(IllegalArgumentException.class, () -> new PointToColorCalculator(centerX, centerY,
						validIterationCount, basicMaximumDistance, invalidDF, basicCutOff));
			}
		}

		// Testing invalid maximum distance and cut-off combinations.
		{
			final double[] cutOffs = new double[] { 0.0, 10.0, -1.0, -1.0 };
			final double[] maximumDistances = new double[] { 0.0, 10.0, -2.0, 10.0 };

			for (int i = 0; i < cutOffs.length; i++) {
				final int ii = i;
				assertThrows(IllegalArgumentException.class, () -> new PointToColorCalculator(centerX, centerY,
						validIterationCount, maximumDistances[ii], validDivisionFactor, cutOffs[ii]));
			}
		}

	}

	@Test
	public void variousPointToColorCalculations() {

		// Test for a few different points.
		final Consumer<PointToColorCalculator> testFun = (PointToColorCalculator calc) -> {

			for (int x = -100; x <= 100; x += 100) {
				for (int y = -100; y <= 100; y += 100) {
					calc.getColor(x, y);
				}
			}
		};

		testFun.accept(new PointToColorCalculator(centerX, centerY, 2, 50.0, 2, 0.0));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 2, 50.0, 2, 0.01));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 2, 50.0, 2, 0.1));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 2, 10.0, 2, 0.1));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 0, 10.0, 2, 0.1));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 11, 10.0, 2, 0.1));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 5, 10.0, 3, 0.1));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 5, 10.0, 10, 0.1));
		testFun.accept(new PointToColorCalculator(centerX, centerY, 5, 20.0, 10, 10.0));
	}
}
