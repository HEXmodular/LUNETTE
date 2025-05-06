#include "oscillator_handler.h"
#include "web_server.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

static const char *TAG = "oscillator_handler";
#define AUDIO_BUFFER_SIZE 2048

// Audio streaming task handle
static TaskHandle_t audio_stream_task_handle = NULL;

// Audio streaming task
static void audio_stream_task(void *pvParameters)
{
    uint8_t audio_buffer[AUDIO_BUFFER_SIZE];
    
    while (1) {
        // Get audio samples from oscillator output
        for (int i = 0; i < AUDIO_BUFFER_SIZE; i++) {
            // Get the next sample from the oscillator output
            // and convert it to unsigned 8-bit format
            float sample = get_next_sample();
            audio_buffer[i] = (uint8_t)((sample + 1.0f) * 127.5f);
        }
        
        // Send audio data to web server
        esp_err_t err = web_server_send_audio(audio_buffer, AUDIO_BUFFER_SIZE);
        if (err != ESP_OK) {
            ESP_LOGW(TAG, "Failed to send audio data");
        }
        
        // Small delay to control streaming rate
        vTaskDelay(pdMS_TO_TICKS(20)); // 50Hz update rate
    }
}

// Initialize oscillator handler
esp_err_t web_audio_handler_init(void)
{
    esp_err_t err = ESP_OK;
    
    // Create audio streaming task
    BaseType_t task_created = xTaskCreate(
        audio_stream_task,
        "audio_stream",
        4096,
        NULL,
        5,
        &audio_stream_task_handle
    );
    
    if (task_created != pdPASS) {
        ESP_LOGE(TAG, "Failed to create audio streaming task");
        err = ESP_FAIL;
    }
    
    return err;
}

// Deinitialize oscillator handler
esp_err_t web_audio_handler_deinit(void)
{
    if (audio_stream_task_handle != NULL) {
        vTaskDelete(audio_stream_task_handle);
        audio_stream_task_handle = NULL;
    }
    
    return ESP_OK;
}

// Get next audio sample from oscillator output
static float get_next_sample(void)
{
    // TODO: Implement actual oscillator sample generation
    // For now, return a simple sine wave
    static float phase = 0.0f;
    const float frequency = 440.0f; // A4 note
    const float sample_rate = 10000.0f;
    
    float sample = sinf(2.0f * M_PI * frequency * phase);
    phase += 1.0f / sample_rate;
    if (phase >= 1.0f) {
        phase -= 1.0f;
    }
    
    return sample;
} 