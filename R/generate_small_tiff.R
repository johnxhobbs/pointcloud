#' Generate a 20x36 2-layer 16-bit TIFF file at img/sample_cyl_36x20.tif
#'
#' This script generates a synthetic test image with two 16-bit layers (radius and reflectivity)
#' for testing viewers and pipelines. It writes the file to 'img/sample_cyl_36x20.tif'.
#' If the script is run standalone, it will execute immediately.

# Check for required package
if (!requireNamespace("tiff", quietly = TRUE)) {
  message("The 'tiff' package is required but not installed. Please install it with install.packages('tiff').")
} else {
  # Parameters
  width <- 36L
  height <- 20L
  n_layers <- 2L
  outfile <- file.path("img", "sample_cyl_36x20.tif")

  # Generate data: Layer 1 = "radius" (cylindrical ramp), Layer 2 = "reflectivity" (checkerboard)
  arr <- array(0L, dim = c(height, width, n_layers))

  # Layer 1: radial ramp from center
  x <- matrix(rep(seq_len(width), each = height), nrow = height)
  y <- matrix(rep(seq_len(height), times = width), nrow = height)
  cx <- (width + 1) / 2
  cy <- (height + 1) / 2
  radius <- sqrt((x - cx)^2 + (y - cy)^2)
  arr[, , 1] <- as.integer(round(65535 * (radius / max(radius))))

  # Layer 2: checkerboard pattern
  arr[, , 2] <- as.integer(((x %% 4 < 2) == (y %% 4 < 2)) * 65535)

  # Write TIFF (big-endian, 16-bit, 2 layers)
  tiff::writeTIFF(arr, outfile, bits.per.sample = 16L)
  message(sprintf("Wrote test image to '%s' [%dx%dx%d, 16-bit]", outfile, width, height, n_layers))
}

# Allow script to run standalone
if (identical(environment(), globalenv()) && !length(commandArgs(trailingOnly = TRUE))) {
  # Already ran above (no-op), included for clarity
}