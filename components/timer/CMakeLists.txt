idf_component_register(
    SRCS "timer.c"
    INCLUDE_DIRS "include"
    REQUIRES driver
    PRIV_REQUIRES oscillator_logic esp_event esp_timer output common_defs
) 