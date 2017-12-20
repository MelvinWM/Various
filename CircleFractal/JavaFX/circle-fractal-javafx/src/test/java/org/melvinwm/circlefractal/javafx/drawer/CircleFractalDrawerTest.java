package org.melvinwm.circlefractal.javafx.drawer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;

import javafx.application.Platform;
import javafx.concurrent.Worker;
import javafx.scene.image.Image;
import javafx.stage.Stage;

@ExtendWith(ApplicationExtension.class)
public class CircleFractalDrawerTest {

	private final static int width = 700;
	private final static int height = 500;

	@Start
	public void onStart(Stage stage) {
		// Do nothing, we only want JavaFX to initialize.
	}

	@Test
	public void should_do_basic_drawing() throws Exception {

		final int iterationCount = 5;
		final int divisionFactor = 2;
		final double cutOff = 0.0;

		for (final boolean doParallelizedComputation : new boolean[] { false, true }) {

			final CircleFractalDrawer drawer = new CircleFractalDrawer(width, height, iterationCount, divisionFactor,
					cutOff, doParallelizedComputation);

			drawer.run();

			final Image image = drawer.get();

			Platform.runLater(() -> {
				assertEquals(image.getWidth(), width);
				assertEquals(image.getHeight(), height);
				assertNotEquals(image.getPixelReader().getArgb(width / 2, height / 2), 0);

				assertTrue(drawer.getProgress() > 0.5);
			});
		}
	}

	@Test
	public void should_handle_cancellation() throws Exception {

		/*
		 * If cancellation does not work, this test should take a long time to complete
		 * (5+ seconds).
		 */

		/*
		 * Very high iteration count to make it likely that cancellation happens while
		 * calculating.
		 */
		final int iterationCount = 1000;
		final int divisionFactor = 2;
		final double cutOff = 0.0;

		for (final boolean doParallelizedComputation : new boolean[] { false, true }) {

			final CircleFractalDrawer drawer = new CircleFractalDrawer(width, height, iterationCount, divisionFactor,
					cutOff, doParallelizedComputation);

			final Thread thread = new Thread(() -> drawer.run());
			thread.start();
			drawer.cancel();
			thread.join();

			Platform.runLater(() -> {
				assertEquals(drawer.getState(), Worker.State.CANCELLED);
			});
		}
	}
}
