# R Shiny app: WebGL tunnel point cloud viewer for cylindrical TIFF depth maps
# All heavy lifting is done in browser via low-level WebGL2 for maximum speed.

library(shiny)

ui <- fluidPage(
  tags$head(
    # Load 3rd party libs (CDN)
    tags$script(src="https://cdn.jsdelivr.net/npm/utif@3.0.0/UTIF.min.js"),
    tags$script(src="https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/gl-matrix-min.js"),
    # Module scripts (ES6 modules, loaded in main.js)
    tags$script(type = "module", src = "main.js"),
    # Some basic styling to fill the window
    tags$style(HTML("
      #glcanvas {
        width: 100vw; height: 80vh; display: block; background: #181818;
      }
      #viewer-controls {
        margin-top: 10px;
      }
    "))
  ),
  titlePanel("Tunnel Point Cloud WebGL Viewer"),
  sidebarLayout(
    sidebarPanel(
      fileInput("tiffFile", "Upload 16-bit Cylindrical TIFF", accept = ".tif,.tiff"),
      div(
        id="viewer-controls",
        sliderInput("zPos", "Forward/Back (cm)", min = 0, max = 1000, value = 0, step = 1),
        sliderInput("zoom", "Zoom", min = 0.5, max = 3, value = 1, step = 0.01)
      ),
      helpText("Rotate: Mouse drag | Move: Forward/Back slider | Zoom: Mouse wheel or slider")
    ),
    mainPanel(
      # The canvas for WebGL - we inject a <canvas id="glcanvas"> here from JS after file is loaded.
      htmlOutput("webgl_viewer")
    )
  )
)

server <- function(input, output, session) {
  # The only server role: expose file blob path to JS via input binding.
  output$webgl_viewer <- renderUI({
    # Place an empty div; JS will inject canvas here!
    tags$div(id = "glviewer-container")
  })
  
  # Send slider changes to JS
  observe({
    session$sendCustomMessage("zPos", input$zPos)
  })
  observe({
    session$sendCustomMessage("zoom", input$zoom)
  })
}

shinyApp(ui, server)