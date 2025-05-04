idf_component_register(
    SRCS "oscillator_logic.c"
    INCLUDE_DIRS "include"
    REQUIRES oscillator
    PRIV_REQUIRES logical_ops output timer
) 