#include "api.h"
#include <string.h>
#include "esp_log.h"
#include "note_generator.h"

static const char *TAG = "api";

// Global oscillator data
oscillator_data_t oscillator_data[4] = {
    {.frequency = 0.0, .amplitude = 0.0},
    {.frequency = 0.0, .amplitude = 0.0},
    {.frequency = 0.0, .amplitude = 0.0},
    {.frequency = 0.0, .amplitude = 0.0}
};

void update_oscillator_data(int oscillator_id, double freq, double amp) {
    oscillator_data[oscillator_id].frequency = freq;
    oscillator_data[oscillator_id].amplitude = amp;
    oscillator_set_frequency(oscillator_id, freq, amp);
    ESP_LOGI(TAG, "Oscillator data updated: freq=%.1f, amp=%.1f", freq, amp);
} 