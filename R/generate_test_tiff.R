#' Generate synthetic 2-layer 16-bit TIFF for viewer testing
#'
#' Output: img/sample_cyl.tif
#'
#' Layer 1: radius (oscillates with sin/cos)
#' Layer 2: reflectivity gradient

save_sample_tiff <- function(filename = "img/sample_cyl.tif") {
  if (!requireNamespace("tiff", quietly = TRUE)) {
    message("Package 'tiff' is required. Please install with install.packages('tiff').")
    return(invisible(NULL))
  }
  nr <- 100
  nc <- 360
  # Cylindrical 'radius' data
  theta <- seq(0, 2*pi, length.out = nc)
  radius <- outer(seq(0, 1, length.out = nr), sin(theta)*0.4 + cos(theta*2)*0.2 + 0.6)
  radius16 <- as.integer(65535 * (radius - min(radius)) / (max(radius) - min(radius)))
  # Reflectivity: vertical gradient, normalized
  reflect <- outer(seq(0, 1, length.out = nr), rep(1, nc))
  reflect16 <- as.integer(65535 * reflect)
  # Combine layers
  arr <- array(sample(as.numeric(1:65534), nr*nc*2, replace = TRUE), dim = c(nr, nc, 2))
  arr <- array(runif(nr*nc*2), dim = c(nr, nc, 2))
  dir.create(dirname(filename), showWarnings = FALSE, recursive = TRUE)
  tiff::writeTIFF(arr, filename, bits.per.sample = 16L)
  message(sprintf("Wrote test TIFF: %s", filename))
}

# If run interactively or as a script, generate the file:
if (sys.nframe() == 0) {
  save_sample_tiff()
}