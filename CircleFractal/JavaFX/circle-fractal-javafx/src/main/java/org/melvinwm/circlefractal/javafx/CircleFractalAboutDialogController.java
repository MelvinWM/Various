package org.melvinwm.circlefractal.javafx;

import java.util.Optional;

import javafx.application.HostServices;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Alert.AlertType;
import javafx.scene.control.Hyperlink;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;

/**
 * Controller for the 'about' dialog for the program.
 *
 * <p>
 * Must set host services before the related GUI is shown.
 *
 * <p>
 * Thread safety: JavaFX thread only.
 */
public class CircleFractalAboutDialogController {

	//
	// Internal.
	//

	/**
	 * May be null.
	 */
	private HostServices hostServices;

	@FXML
	private Hyperlink linkToSource;

	/**
	 * Internal controller method.
	 */
	@FXML
	public void initialize() {

		// Set up the various controls.

		// Open web page for source.
		{
			linkToSource.setOnAction(actionEvent -> {
				if (hostServices != null) {
					hostServices.showDocument(linkToSource.getText());
				} else {

					// Copy the link to the clipboard and inform the user about the copying.

					final Clipboard clipboard = Clipboard.getSystemClipboard();
					final ClipboardContent content = new ClipboardContent();
					content.putString(linkToSource.getText());
					clipboard.setContent(content);

					final Alert alert = new Alert(AlertType.INFORMATION, "Link copied to clipboard.");
					alert.showAndWait();
				}
			});
		}
	}

	//
	// External.
	//

	/**
	 * The host services of the application, used for things like showing web pages.
	 * 
	 * <p>
	 * Blocking: No.
	 * 
	 * @param hostServices
	 *            Application's host services.
	 */
	public void setHostServices(Optional<HostServices> hostServices) {
		this.hostServices = hostServices.get();
	}
}
