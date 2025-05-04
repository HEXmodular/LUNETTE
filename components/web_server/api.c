#include "api.h"
#include <string.h>
#include "esp_log.h"
#include "oscillator.h"
#include "oscillator_logic.h"
static const char *TAG = "api";

void update_oscillator_data(int oscillator_id, double freq, double amp) {
    Oscillator* oscillators = oscillator_logic_get_oscillators();
    oscillator_set_frequency(&oscillators[oscillator_id], freq);
    oscillator_set_amplitude(&oscillators[oscillator_id], amp);
    ESP_LOGI(TAG, "Updating oscillator data: id=%d, freq=%.1f, amp=%.1f", oscillator_id, freq, amp);
} 

Oscillator *get_oscillators_data() {   
    return oscillator_logic_get_oscillators();
}
