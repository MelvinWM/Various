package org.melvinwm.circlefractal.javafx.drawer;

import java.nio.IntBuffer;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.melvinwm.circlefractal.javafx.App;

import javafx.concurrent.Task;
import javafx.scene.image.Image;
import javafx.scene.image.PixelFormat;
import javafx.scene.image.PixelWriter;
import javafx.scene.image.WritableImage;

/**
 * Task class for supporting drawing circle-fractals and the drawing life-cycle.
 * 
 * <p>
 * Supports progress and cancellation.
 * 
 * <p>
 * Thread safety: Same as the Task superclass.
 */
public final class CircleFractalDrawer extends Task<Image> {

	private final int width;
	private final int height;
	private final int numberOfIterations;
	private final int divisionFactor;
	private final double cutOff;
	private final boolean isParallelizedComputation;

	private final Logger logger = LogManager.getLogger(App.class);

	public CircleFractalDrawer(int width, int height, int numberOfIterations, int divisionFactor, double cutOff,
			boolean isParallelizedComputation) {

		this.width = width;
		this.height = height;
		this.numberOfIterations = numberOfIterations;
		this.divisionFactor = divisionFactor;
		this.cutOff = cutOff;
		this.isParallelizedComputation = isParallelizedComputation;
	}

	/**
	 * Continually update the progress until cancelled.
	 * 
	 * <p>
	 * Updating the drawing progress using a scheduler in order to avoid the issues
	 * that updating from multiple threads can give, such as progress decreasing
	 * wrongly. Progress decreasing wrongly can for instance happen this way: a task
	 * gets the progress value, its executing thread gets paused, and then after
	 * another task executed by another thread updates with a newer progress value,
	 * the first thread resumes and the first task updates with its outdated
	 * progress value.
	 * 
	 * @param progressSoFarCount
	 *            The progress so far, owned and updated by the caller.
	 * @param totalWork
	 *            The total work. Strictly positive integer, with
	 * 
	 *            {@code 0 <= progressSoFarCount <= totalWork}.
	 */
	private void scheduleProgressCountUpdating(AtomicInteger progressSoFarCount, int totalWork,
			ScheduledExecutorService updateProgressScheduledExecutorService) {

		updateProgressScheduledExecutorService.schedule(() -> {
			updateProgress(progressSoFarCount.get(), totalWork);

			if (!isDone()) {
				scheduleProgressCountUpdating(progressSoFarCount, totalWork, updateProgressScheduledExecutorService);
			}

		}, 5, TimeUnit.MILLISECONDS);
	}

	/*
	 * Perform the task of drawing the image, handling cancellation, parallelization
	 * and progress indication.
	 * 
	 * <p> If there was no progress indication, parallelized drawing, or
	 * cancellation supported, this would simply be a loop that calculated the color
	 * for each point using {@link PointToColorCalculator} and returning the
	 * resulting image.
	 * 
	 * <p> If there was only parallelized drawing and no cancellation and progress
	 * indication, this would also be relatively simple, since you could just create
	 * a number of tasks, execute them without giving them any further input or get
	 * output from them, and wait for them all to finish. And likewise, if there was
	 * only cancellation and progress indication and no parallelization, simply make
	 * a basic loop that outputs progress as well as checks for cancellation. It is
	 * the combination of the three features that complicates matters a whole lot.
	 * 
	 * <p> This is arguably an argument against relatively many inclusions of
	 * features, and possibly an argument in favour of having something similar to a
	 * "feature budget" or similar, given that features can have many costs, and the
	 * more features that are supported, the more everything may be strained, which
	 * can have both considerably up-front as well as short-term and long-term
	 * consequences. What if a feature is needed and the "feature budget" is full?
	 * It may be necessary to take out or deprecate one or more other features. It
	 * also motivates work towards being able to "increase" the "feature budget",
	 * which can depend on many factors, including architecture.
	 */
	@Override
	protected Image call() throws Exception {

		logger.trace("JVM active thread count: {}", Thread.activeCount());

		// Setup.

		final double centerX = width / 2.0;
		final double centerY = height / 2.0;
		// Note: Could maybe give as argument instead, but care would have
		// to be taken regarding the cut-off.
		final double maximumDistance = PointToColorCalculator.calcLength(centerX, centerY) + 10;

		final PointToColorCalculator pointToColorCalculator = new PointToColorCalculator(centerX, centerY,
				numberOfIterations, maximumDistance, divisionFactor, cutOff);

		final int totalWork = width * height;

		updateProgress(0, totalWork);

		final AtomicInteger progressSoFarCount = new AtomicInteger();
		progressSoFarCount.set(0);

		// NOTE: Ownership (thread pool): Locally here, closed in this scope.
		ExecutorService paintingExecutorService;
		if (isParallelizedComputation) {
			paintingExecutorService = Executors.newWorkStealingPool();
		} else {
			paintingExecutorService = Executors.newSingleThreadExecutor();
		}

		// NOTE: Ownership (thread pool): Locally here, closed in this scope.
		final ScheduledExecutorService updateProgressScheduledExecutorService = Executors.newScheduledThreadPool(1);

		// Drawing.

		try {

			scheduleProgressCountUpdating(progressSoFarCount, totalWork, updateProgressScheduledExecutorService);

			// Create a task for every line.
			final List<Callable<int[]>> tasks = IntStream.range(0, height).<Callable<int[]>>mapToObj(y -> {
				return new Callable<int[]>() {

					@Override
					public int[] call() throws Exception {

						final int[] lineBuffer = new int[width];

						for (int x = 0; x < width; x++) {

							if (isCancelled()) {
								paintingExecutorService.shutdownNow();
								throw new InterruptedException("Circle-fractal drawing task was cancelled.");
							}

							final int argb = pointToColorCalculator.getColor(x, y);
							lineBuffer[x] = argb;

							progressSoFarCount.incrementAndGet();
						}

						return lineBuffer;
					}
				};
			}).collect(Collectors.toList());

			final List<Future<int[]>> results = paintingExecutorService.invokeAll(tasks);

			if (isCancelled()) {
				return null;
			}

			// Get results and turn into image.
			final int[] buffer = results.stream().<int[]>map(future -> {
				try {
					return future.get();
				} catch (InterruptedException | ExecutionException e) {
					throw new IllegalArgumentException(e);
				}
			}).flatMapToInt(line -> Arrays.stream(line)).toArray();

			final WritableImage writableImage = new WritableImage(width, height);
			final PixelWriter pixelWriter = writableImage.getPixelWriter();
			pixelWriter.setPixels(0, 0, width, height, PixelFormat.getIntArgbInstance(), IntBuffer.wrap(buffer), width);

			updateProgress(totalWork, totalWork);

			return writableImage;
		} finally {

			paintingExecutorService.shutdownNow();
			updateProgressScheduledExecutorService.shutdownNow();
		}
	}
}
