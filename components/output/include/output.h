#pragma once

#include "driver/sdm.h"
#include "driver/gptimer.h"

/**
 * @brief Initialize the output system (SDM and timer)
 * 
 * @return sdm_channel_handle_t Handle to the SDM channel
 */
sdm_channel_handle_t output_init(int gpio_num, int8_t* value_ptr);

/**
 * @brief Set the output value
 * 
 * @param sdm_chan SDM channel handle
 * @param value Value to output (-128 to 127)
 */
void output_set_value(sdm_channel_handle_t sdm_chan, int8_t value); 

