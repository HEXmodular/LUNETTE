#include "api.h"
#include <string.h>
#include "esp_log.h"
#include "note_generator.h"

static const char *TAG = "api";

// Global oscillator data
oscillator_data_t oscillator_data = {
    .frequency = 0.0,
    .amplitude = 0.0
};

void update_oscillator_data(double freq, double amp) {
    oscillator_data.frequency = freq;
    oscillator_data.amplitude = amp;
    oscillator_set_frequency(freq);
    ESP_LOGI(TAG, "Oscillator data updated: freq=%.1f, amp=%.1f", freq, amp);
} 