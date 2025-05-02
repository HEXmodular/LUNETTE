idf_component_register(
    SRCS "web_server.c" "api.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_http_server vfs json note_generator
    EMBED_FILES "static/index.html" "static/scripts.js" "static/value-control.js"  "static/value-control.css" "static/style.css"
)

# Copy static files to the build directory
# file(COPY "static" DESTINATION ".")