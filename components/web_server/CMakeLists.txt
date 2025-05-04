idf_component_register(
    SRCS "web_server.c" "api.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_http_server esp_common json
    PRIV_REQUIRES oscillator
    EMBED_FILES "static/index.html" "static/scripts.js" "static/value-control.js" "static/value-control.css" "static/style.css"
)

# Embed web files
target_add_binary_data(${COMPONENT_LIB} "static/index.html" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/style.css" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/scripts.js" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/value-control.css" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/value-control.js" TEXT)

# Copy static files to the build directory
# file(COPY "static" DESTINATION ".")