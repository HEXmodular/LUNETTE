idf_component_register(
    SRCS "oscillator_logic.c"
    INCLUDE_DIRS "include"
    REQUIRES oscillator logical_ops
    PRIV_REQUIRES output timer
) 