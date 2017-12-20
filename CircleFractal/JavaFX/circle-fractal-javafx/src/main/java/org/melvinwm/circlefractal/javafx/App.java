package org.melvinwm.circlefractal.javafx;

import java.io.IOException;
import java.util.Optional;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javafx.application.Application;
import javafx.application.HostServices;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.control.Alert;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;

/**
 * The starting point of the circle-fractal drawing JavaFX application.
 *
 * <p>
 * Thread safety: JavaFX thread only.
 */
public class App extends Application {

	private static final Logger logger = LogManager.getLogger(App.class);

	@Override
	public void start(Stage primaryStage) {

		// Setup global exception catching.

		{
			Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {

				// We only report and inform, since for this application it is
				// fine for
				// the system to simply continue.

				logger.error("An uncaught exception was encountered by the default exception handler.", throwable);

				final Alert errorAlert = new Alert(AlertType.ERROR,
						"An internal error occurred, see the logs\nfor more information.");
				errorAlert.showAndWait();
			});
		}

		// Load the GUI and show it.
		loadGUIShow(primaryStage, Optional.of(getHostServices()));
	}

	public static void main(String[] args) {
		Application.launch(App.class, args);
	}

	/**
	 * Loads the whole GUI and shows it.
	 *
	 * <p>
	 * Blocking: Yes.
	 * 
	 * @param primaryStage
	 *            Primary stage.
	 * @param hostServices
	 *            Host services.
	 */
	public static void loadGUIShow(Stage primaryStage, Optional<HostServices> hostServices) {

		try {

			final Pane root = loadInitializeMainContent(primaryStage, hostServices);

			primaryStage.setTitle("Circle fractal drawing.");
			primaryStage.setScene(new Scene(root));

			primaryStage.show();

		} catch (Exception e) {

			logger.error("Exception when building the JavaFX GUI for circle-fractal drawing.", e);

			throw e;
		}
	}

	/**
	 * Loads and initializes the main content.
	 *
	 * <p>
	 * Blocking: Yes.
	 * 
	 * @param primaryStage
	 *            Primary stage of the application.
	 * @param hostServices
	 *            Host services.
	 * @return The root pane.
	 */
	private static Pane loadInitializeMainContent(Stage primaryStage, Optional<HostServices> hostServices) {

		try {

			// The source for the main circle-fractal view hierarchy.
			final String mainCircleFractalViewPath = InternalSourcePaths.javafxResourcePathPrefix
					+ "CircleFractalMainView.fxml";

			final FXMLLoader loader = new FXMLLoader(App.class.getClassLoader().getResource(mainCircleFractalViewPath));
			// NOTE: Not type-safe.
			final Pane root = loader.load();

			// NOTE: Owned by 'primaryStage', cleaned up in
			// a'setOnHidden'-registered callback.
			final CircleFractalMainController mainController = loader.getController();
			mainController.setHostServices(hostServices);

			// Releasing owned resources upon shutdown.
			primaryStage.setOnHidden(windowEvent -> mainController.close());

			return root;
		} catch (IOException e) {
			// Should only happen if there is a programming/configuration error.
			throw new IllegalStateException("Failed to load FXML or similar for the 'main' view.", e);
		}
	}
}
