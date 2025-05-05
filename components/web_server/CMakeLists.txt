idf_component_register(
    SRCS 
        "web_server.c"
    INCLUDE_DIRS 
        "include"
    REQUIRES 
        esp_http_server
        json
        api
        common_defs   
    EMBED_FILES 
        "static/index.html" 
        "static/scripts.js" 
        "static/value-control.js" 
        "static/value-control.css" 
        "static/style.css"    
)

# Set logging level for the web server component
target_compile_definitions(${COMPONENT_LIB} PRIVATE
    -DCONFIG_LOG_MAXIMUM_LEVEL=ESP_LOG_INFO
)

# Embed web files
target_add_binary_data(${COMPONENT_LIB} "static/index.html" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/style.css" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/scripts.js" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/value-control.css" TEXT)
target_add_binary_data(${COMPONENT_LIB} "static/value-control.js" TEXT)

# Copy static files to the build directory
# file(COPY "static" DESTINATION ".")