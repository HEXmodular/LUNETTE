#pragma once

#include "esp_err.h"

// Initialize oscillator handler
esp_err_t web_audio_handler_init(void);

// Deinitialize oscillator handler
esp_err_t web_audio_handler_deinit(void); 