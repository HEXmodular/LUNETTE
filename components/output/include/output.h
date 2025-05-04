#pragma once

#include "esp_err.h"
#include "driver/gptimer.h"
#include "driver/sdm.h"

typedef void* output_handle_t;

/**
 * @brief Initialize a new output instance
 * 
 * @param gpio_num GPIO pin number to use for output
 * @param value_ptr Pointer to the boolean value that will be read for output
 * @return output_handle_t Handle to the output instance, NULL if initialization failed
 */
output_handle_t output_init(int gpio_num, int8_t* value_ptr);

/**
 * @brief Update the value pointer for an output instance
 * 
 * @param handle Output instance handle
 * @param value_ptr New pointer to the boolean value that will be read for output
 */
void output_set_value_ptr(output_handle_t handle, int8_t* value_ptr);

/**
 * @brief Deinitialize and free an output instance
 * 
 * @param handle Output instance handle
 */
void output_deinit(output_handle_t handle);

/**
 * @brief Timer callback function that updates the PDM output
 * This function is called by the timer system to update the output value
 */
void output_timer_callback(void); 

