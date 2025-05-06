#pragma once

#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

typedef void (*timer_callback_t)(void* user_ctx);

typedef struct {
    timer_callback_t callback;
    void* user_ctx;
} timer_callback_info_t;

/**
 * @brief Initialize the shared timer component
 * 
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t timer_init(void);

/**
 * @brief Register a callback to be called on timer events
 * 
 * @param callback The callback function to register
 * @param user_ctx User context to pass to the callback
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t timer_register_callback(timer_callback_t callback, void* user_ctx);

/**
 * @brief Unregister a previously registered callback
 * 
 * @param callback The callback function to unregister
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t timer_unregister_callback(timer_callback_t callback);

/**
 * @brief Get the timer interval in microseconds
 * 
 * @return uint32_t Timer interval in microseconds
 */
uint32_t timer_get_interval_us(void); 