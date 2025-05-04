#pragma once

#include <stdbool.h>
#include "esp_err.h"
#include "oscillator.h"


/**
 * @brief Initialize the oscillator logic component
 * 
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t oscillator_logic_init(void);

/**
 * @brief Enable or disable the logical operation
 * 
 * @param enabled true to enable, false to disable
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t oscillator_logic_set_enabled(bool enabled);

/**
 * @brief Get the current state of the logical operation
 * 
 * @param enabled Pointer to store the enabled state
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t oscillator_logic_get_enabled(bool *enabled);

/**
 * @brief Get the oscillators array
 * 
 * @return Oscillator* Pointer to the oscillators array
 */
Oscillator* oscillator_logic_get_oscillators(void); 