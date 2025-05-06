idf_component_register(
    SRCS "oscillator_handler.c"
    INCLUDE_DIRS "include"
    REQUIRES esp_http_server api_types
    PRIV_REQUIRES log cJSON
) 