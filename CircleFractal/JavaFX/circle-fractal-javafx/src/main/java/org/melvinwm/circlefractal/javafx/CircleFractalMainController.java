package org.melvinwm.circlefractal.javafx;

import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;

import org.melvinwm.circlefractal.javafx.drawer.CircleFractalDrawer;

import javafx.application.HostServices;
import javafx.beans.binding.Bindings;
import javafx.beans.property.BooleanProperty;
import javafx.beans.property.DoubleProperty;
import javafx.beans.property.IntegerProperty;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.value.ChangeListener;
import javafx.concurrent.Service;
import javafx.concurrent.Task;
import javafx.concurrent.Worker;
import javafx.fxml.FXML;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.control.Button;
import javafx.scene.control.CheckBox;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.control.Slider;
import javafx.scene.control.Spinner;
import javafx.scene.image.Image;
import javafx.scene.paint.Color;
import javafx.util.StringConverter;

/**
 * Controller for the main GUI for the circle-fractal drawing.
 *
 * <p>
 * Must be closed when usage is done.
 *
 * <p>
 * Must set host services before the related GUI is shown.
 *
 * <p>
 * Thread safety: JavaFX thread only.
 */
public class CircleFractalMainController implements AutoCloseable {

	//
	// Internal.
	//

	/**
	 * May not be used until after setup, may be null.
	 */
	private HostServices hostServices;

	@FXML
	private Canvas fractalDrawingCanvas;

	@FXML
	private ProgressBar fractalDrawingProgressBar;

	@FXML
	private Spinner<Integer> numberOfIterationsSpinner;

	@FXML
	private Slider divisionFactorSlider;

	@FXML
	private Label divisionFactorValueLabel;

	@FXML
	private Spinner<Double> cutOffSpinner;

	@FXML
	private Button drawRequestButton;

	@FXML
	private CheckBox isParallelizedComputationCheckBox;

	/*
	 * Service abstraction to implement drawing, including cancellation and progress
	 * updates.
	 * 
	 * Remember to clean up after usage.
	 */
	private static class CircleFractalDrawingService extends Service<Image> {

		public final IntegerProperty imageWidth = new SimpleIntegerProperty();
		public final IntegerProperty imageHeight = new SimpleIntegerProperty();
		public final IntegerProperty numberOfIterations = new SimpleIntegerProperty();
		public final IntegerProperty divisionFactor = new SimpleIntegerProperty();
		public final DoubleProperty cutOff = new SimpleDoubleProperty();
		public final BooleanProperty isParallelizedComputation = new SimpleBooleanProperty();

		@Override
		protected Task<Image> createTask() {
			return new CircleFractalDrawer(imageWidth.get(), imageHeight.get(), numberOfIterations.get(),
					divisionFactor.get(), cutOff.get(), isParallelizedComputation.get());
		}
	}

	// Owned by this, cleaned up in the 'close' method.
	private final CircleFractalDrawingService drawingService = new CircleFractalDrawingService();

	// Basic string converter, for use with the spinners and user-edited values.
	// This does not enable good error handling, but this author
	// (github.com/melvinwm) has difficulty with finding good alternatives.
	private static <E> StringConverter<E> getFromStringConverter(final Function<String, E> fromStringFun) {
		return new StringConverter<E>() {
			@Override
			public String toString(E object) {
				return object.toString();
			}

			@Override
			public E fromString(String string) {
				return fromStringFun.apply(string);
			}
		};
	}

	// Creates a focus-lost listener for updating spinner field values when
	// focus is lost.
	private static <E> ChangeListener<? super Boolean> getFocusLostUpdater(Spinner<E> spinner) {
		return (observable, oldFocusVal, newFocusVal) -> {
			// If focus lost, increment value with 0 and thus update internal
			// value in case the value was typed by the user, ensuring that the
			// internal value is the same as the shown value after the focus is
			// no longer in the spinner.
			if (!newFocusVal) {
				spinner.increment(0);
			}
		};
	}

	/**
	 * Internal controller method.
	 */
	@FXML
	public void initialize() {

		//
		// Set up the various controls.
		//

		// Number of iterations spinner controls.
		{
			// NOTE: Less than good error handling.
			numberOfIterationsSpinner.getValueFactory().setConverter(getFromStringConverter((string) -> {
				try {
					return Integer.parseInt(string);
				} catch (NumberFormatException e) {
					return Integer.MIN_VALUE;
				}
			}));

			numberOfIterationsSpinner.focusedProperty().addListener(getFocusLostUpdater(numberOfIterationsSpinner));
		}

		// Division factor slider controls.
		{
			// Round division slider value.
			divisionFactorSlider.valueProperty().addListener((observer, oldVal, newVal) -> {
				divisionFactorSlider.setValue(Math.round(newVal.doubleValue()));
			});

			// Pretty-print the division factor slider value in the label.
			{
				final DoubleProperty property = divisionFactorSlider.valueProperty();
				divisionFactorValueLabel.textProperty().bind(Bindings.createStringBinding(() -> {
					return String.format("%d", (int) Math.round(property.get()));
				}, property));
			}
		}

		// Cut-off spinner controls.
		{
			// Round the cut-off spinner value to nearest 0.01.
			cutOffSpinner.getValueFactory().valueProperty().addListener((observer, oldVal, newVal) -> {
				cutOffSpinner.getValueFactory().setValue(Math.round(newVal.doubleValue() * 100.0) / 100.0);
			});

			// NOTE: Less than good error handling.
			cutOffSpinner.getValueFactory().setConverter((getFromStringConverter((string) -> {
				try {
					return Double.parseDouble(string);
				} catch (NumberFormatException e) {
					return Double.NEGATIVE_INFINITY;
				}
			})));

			cutOffSpinner.focusedProperty().addListener(getFocusLostUpdater(cutOffSpinner));
		}

		// Fractal canvas and drawing service.
		{
			final Runnable clearImage = () -> {
				final GraphicsContext gc = fractalDrawingCanvas.getGraphicsContext2D();
				gc.setFill(Color.GRAY);
				gc.fillRect(0, 0, CircleFractalHardcodedSettings.drawingAreaImageWidth,
						CircleFractalHardcodedSettings.drawingAreaImageHeight);
			};
			final Consumer<Image> updateImage = (Image image) -> {
				fractalDrawingCanvas.getGraphicsContext2D().drawImage(image, 0, 0);
			};
			clearImage.run();

			drawingService.imageWidth.set(CircleFractalHardcodedSettings.drawingAreaImageWidth);
			drawingService.imageHeight.set(CircleFractalHardcodedSettings.drawingAreaImageHeight);
			drawingService.numberOfIterations.bind(numberOfIterationsSpinner.valueProperty());
			drawingService.divisionFactor.bind(divisionFactorSlider.valueProperty());
			drawingService.cutOff.bind(cutOffSpinner.valueProperty());
			drawingService.isParallelizedComputation.bind(isParallelizedComputationCheckBox.selectedProperty());

			drawRequestButton.onActionProperty().set(actionEvent -> {
				// We only restart if there were no failures.
				if (drawingService.getState() != Worker.State.FAILED) {
					fractalDrawingProgressBar.setVisible(true);
					drawingService.restart();
					clearImage.run();
				}
			});

			fractalDrawingProgressBar.progressProperty().bind(drawingService.progressProperty());

			drawingService.setOnSucceeded(workerStateEvent -> {
				updateImage.accept(drawingService.getValue());
				fractalDrawingProgressBar.setVisible(false);
			});

			// Error handling.
			drawingService.setOnFailed(workerStateEvent -> {
				throw new IllegalStateException("Failure while drawing the circle fractal.",
						drawingService.getException());
			});

			fractalDrawingProgressBar.setVisible(false);
		}
	}

	/**
	 * Internal FXML callback.
	 */
	public void showAboutDialogAndWait() {

		CircleFractalMenuBar.showAboutDialogAndWait(Optional.ofNullable(hostServices));
	}

	//
	// External.
	//

	/**
	 * The host services of the application, used for things like showing web pages.
	 * 
	 * @param hostServices
	 *            Application's host services.
	 */
	public void setHostServices(Optional<HostServices> hostServices) {
		this.hostServices = hostServices.orElse(null);
	}

	@Override
	public void close() {
		drawingService.cancel();
	}
}
