package org.melvinwm.circlefractal.javafx;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.testfx.api.FxRobot;
import org.testfx.framework.junit5.ApplicationExtension;
import org.testfx.framework.junit5.Start;

import javafx.application.Platform;
import javafx.scene.image.Image;
import javafx.scene.input.KeyCode;
import javafx.stage.Stage;

import static org.testfx.util.WaitForAsyncUtils.waitFor;
import static org.testfx.api.FxAssert.verifyThat;
import static org.testfx.matcher.base.NodeMatchers.isVisible;
import static org.testfx.matcher.base.NodeMatchers.isInvisible;

@ExtendWith(ApplicationExtension.class)
public class AppIntegrationTest {

	@Start
	public void onStart(Stage stage) {
		App.loadGUIShow(stage, Optional.empty());
	}

	/*
	 * WARNING: TestFX currently (2018-04-24) might have thread-safety and
	 * concurrency bugs. See for instance
	 * https://github.com/TestFX/TestFX/issues/143 for more information. It also is
	 * not clear which methods may be called in which ways. This is not surprising,
	 * since thread safety, memory consistency and concurrency tends to be extremely
	 * difficult areas, and may require a large amount of time and effort invested
	 * in order to acquire the necessary knowledge . This author
	 * (github.com/MelvinWM) may look into seeking to fix some of these issues
	 * upstream.
	 */

	@Test
	public void should_let_users_draw_circle_fractal(FxRobot robot) throws InterruptedException, TimeoutException {

		// Use few iterations to ensure drawing will complete very quickly.
		robot.clickOn("#numberOfIterationsSpinner");
		robot.push(KeyCode.BACK_SPACE).write("0").push(KeyCode.ENTER);

		robot.clickOn("#drawRequestButton");

		// Wait until progress bar is no longer visible, should be just about instant.
		waitFor(5, TimeUnit.SECONDS, () -> {
			return !robot.lookup("#fractalDrawingProgressBar").query().isVisible();
		});
		verifyThat("#fractalDrawingProgressBar", isInvisible());

		// Test the middle pixel in the drawn image.
		Platform.runLater(() -> {

			verifyThat("#fractalDrawingCanvas", (node) -> {

				final Image image = node.snapshot(null, null);
				final int pixelARGB = image.getPixelReader().getArgb((int) Math.round(image.getWidth() / 2.0),
						(int) Math.round(image.getHeight() / 2.0));

				return pixelARGB != 0;
			});
		});
	}

	@Test
	public void should_show_progress_bar_while_drawing(FxRobot robot) throws InterruptedException, TimeoutException {

		// Use lots of iterations to ensure drawing will not complete immediately.
		robot.clickOn("#numberOfIterationsSpinner");
		robot.push(KeyCode.BACK_SPACE).write("1000").push(KeyCode.ENTER);

		robot.clickOn("#drawRequestButton");

		// Wait until progress bar is visible, should be almost instant.
		waitFor(5, TimeUnit.SECONDS, () -> {
			return robot.lookup("#fractalDrawingProgressBar").query().isVisible();
		});

		verifyThat("#fractalDrawingProgressBar", isVisible());
	}
}
