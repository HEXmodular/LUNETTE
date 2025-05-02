idf_component_register(
    SRCS "web_server.c" "api.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_http_server esp_common
    EMBED_FILES "static/index.html" "static/scripts.js" "static/value-control.js"  "static/value-control.css" "static/style.css"
)

# Embed web files
target_add_binary_data(${COMPONENT_LIB} "web/index.html" TEXT)
target_add_binary_data(${COMPONENT_LIB} "web/style.css" TEXT)
target_add_binary_data(${COMPONENT_LIB} "web/oscillator_control.js" TEXT)
target_add_binary_data(${COMPONENT_LIB} "web/oscillator_control.css" TEXT)

# Copy static files to the build directory
# file(COPY "static" DESTINATION ".")