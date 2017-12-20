package org.melvinwm.circlefractal.javafx;

import java.io.IOException;
import java.util.Optional;

import javafx.application.HostServices;
import javafx.fxml.FXMLLoader;
import javafx.scene.control.Dialog;
import javafx.scene.control.DialogPane;

/**
 * Thread safety: JavaFX thread only.
 */
class CircleFractalMenuBar {

	/**
	 * Shows an "about" dialog.
	 * 
	 * <p>
	 * Must be called from an input event handler or from the run method of a
	 * Runnable passed to Platform.runLater, as described in
	 * 
	 * {@link javafx.scene.control.Dialog#showAndWait Dialog.showAndWait}.
	 * 
	 * @param hostServices
	 *            Host services of the application.
	 */
	public static void showAboutDialogAndWait(Optional<HostServices> hostServices) {
		createAboutDialog(hostServices).showAndWait();
	}

	private static Dialog<String> createAboutDialog(Optional<HostServices> hostServices) {

		final Dialog<String> dialog = new Dialog<>();

		final String aboutDialogViewFXMLSource = InternalSourcePaths.javafxResourcePathPrefix
				+ "CircleFractalAboutDialogView.fxml";

		try {
			final FXMLLoader loader = new FXMLLoader(
					CircleFractalMenuBar.class.getClassLoader().getResource(aboutDialogViewFXMLSource));
			// NOTE: Not type safe.
			final DialogPane aboutDialogPane = loader.load();

			// NOTE: Not type safe.
			final CircleFractalAboutDialogController controller = loader.getController();
			controller.setHostServices(hostServices);

			dialog.setDialogPane(aboutDialogPane);

		} catch (IOException e) {
			// Only happens if there is a programming/configuration error.
			throw new IllegalStateException("Failed to load FXML or similar for the 'about' dialog.", e);
		}

		return dialog;
	}
}
