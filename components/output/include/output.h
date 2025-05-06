#include "esp_err.h"
#include "driver/gptimer.h"
#include "driver/sdm.h"

typedef void* output_handle_t;

#define OUTPUT_SAMPLE_BUFFER_SIZE 256
#define OUTPUT_SAMPLE_READY_BIT BIT0

/**
 * @brief Initialize a new output instance
 * 
 * @param gpio_num GPIO pin number to use for output
 * @param value_ptr Pointer to the value that will be read for output
 * @return output_handle_t Handle to the output instance, NULL if initialization failed
 */
output_handle_t output_init(int gpio_num, int8_t* value_ptr);

/** 
 * @brief Initialize a new output instance for boolean values
 * 
 * @param gpio_num GPIO pin number to use for output
 * @param value_ptr Pointer to the boolean value that will be read for output
 * @return output_handle_t Handle to the output instance, NULL if initialization failed
 */
output_handle_t output_init_bool(int gpio_num, bool* value_ptr);

/**
 * @brief Get the current output instance
 * 
 * @return output_handle_t Handle to the output instance, NULL if not initialized
 */
output_handle_t output_get_instance(void);

/**
 * @brief Update the value pointer for an output instance
 * 
 * @param handle Output instance handle
 * @param value_ptr New pointer to the value that will be read for output
 */
void output_set_value_ptr(output_handle_t handle, int8_t* value_ptr);

/**
 * @brief Update the value pointer for an output instance for boolean values
 * 
 * @param handle Output instance handle
 * @param value_ptr New pointer to the boolean value that will be read for output
 */
void output_set_bool_value_ptr(output_handle_t handle, bool* value_ptr_bool);

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

/**
 * @brief Timer callback function that updates the PDM output for boolean values
 * This function is called by the timer system to update the output value
 */
void output_timer_callback_bool(void);

/**
 * @brief Get the current sample buffer
 * 
 * @param handle Output instance handle
 * @param buffer Buffer to store samples in (must be at least OUTPUT_SAMPLE_BUFFER_SIZE bytes)
 * @param size Size of the buffer
 * @return esp_err_t ESP_OK on success, error code otherwise
 */
esp_err_t output_get_samples(output_handle_t handle, int8_t* buffer, size_t size);

/**
 * @brief Check if a full sample buffer is ready
 * 
 * @param handle Output instance handle
 * @return true if buffer is ready, false otherwise
 */
bool output_samples_ready(output_handle_t handle);

//
