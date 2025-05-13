#include "timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "driver/gptimer.h"
#include "esp_event.h"
#include "esp_timer.h"
#include "common_defs.h"

#include "oscillator_logic.h"
#include "output.h"

#define MHZ                            (1000000)
#define KHZ                            (1000)
#define TIMER_RESOLUTION               (1  * MHZ)          // 1 MHz timer counting resolution
#define CALLBACK_FREQUENCY             (SYSTEM_SAMPLE_RATE)
#define ALARM_COUNT                    (TIMER_RESOLUTION /CALLBACK_FREQUENCY)


static const char *TAG = "timer";
static gptimer_handle_t timer_handle = NULL;
static volatile bool event_post_error = false;

// общие часики для всех аудио компонентов, работают на частоте SYSTEM_SAMPLE_RATE

// Event loop declarations
ESP_EVENT_DECLARE_BASE(TIMER_EVENTS);
enum {
    TIMER_EVENT_DO_WORK,
};

ESP_EVENT_DEFINE_BASE(TIMER_EVENTS);

static void timer_event_handler(void* event_handler_arg, esp_event_base_t event_base, int32_t event_id, void* event_data)
{
    if (event_base == TIMER_EVENTS && event_id == TIMER_EVENT_DO_WORK) {
        static int64_t last_log_time = 0;
        static int64_t current_time = 0;
        
        int64_t start_time = esp_timer_get_time();
        
        int64_t oscillator_start = esp_timer_get_time();
        oscillator_logic_next_bool();
        int64_t oscillator_end = esp_timer_get_time();
        
        int64_t output_start = esp_timer_get_time();
        output_timer_callback_bool();
        int64_t output_end = esp_timer_get_time();
        
        current_time = esp_timer_get_time();
        
        // Log timing info once per second
        if (current_time - last_log_time >= 5*1000000) { // 5 second in microseconds
            int64_t oscillator_time = oscillator_end - oscillator_start;
            int64_t output_time = output_end - output_start;
            int64_t total_time = output_end - start_time;
            
            double frequency = 1000000.0 / total_time;
            ESP_LOGI(TAG, "Oscillator time: %lld us, Output time: %lld us, Total frequency: %.2f Hz", 
                     oscillator_time, output_time, frequency);
                     
            last_log_time = current_time;
        }
    }
}

static bool IRAM_ATTR timer_callback(gptimer_handle_t timer, const gptimer_alarm_event_data_t *edata, void *user_ctx)
{
    //oscillator_logic_next_bool();
    
    // Post event to event loop from ISR context
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    esp_err_t ret = esp_event_isr_post(TIMER_EVENTS, TIMER_EVENT_DO_WORK, NULL, 0, &xHigherPriorityTaskWoken);
    if (ret != ESP_OK) {
        event_post_error = true;
        // Можно добавить дополнительную логику обработки ошибки
    }
    
    // If a higher priority task was woken, yield to it
    if (xHigherPriorityTaskWoken) {
        portYIELD_FROM_ISR();
    }
    
    return false;
}

esp_err_t timer_init(void)
{
    ESP_LOGI(TAG, "Starting Timer and Event Loop Demo");

    if (timer_handle != NULL) {
        return ESP_OK; // Already initialized
    }

    // Initialize event loop - handle case when it already exists
    esp_err_t ret = esp_event_loop_create_default();
    if (ret != ESP_OK && ret != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Failed to create default event loop: %s", esp_err_to_name(ret));
        return ret;
    }
    ESP_LOGI(TAG, "Event loop ready");

    // Register event handler
    ret = esp_event_handler_instance_register(TIMER_EVENTS, TIMER_EVENT_DO_WORK, timer_event_handler, NULL, NULL);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register event handler: %s", esp_err_to_name(ret));
        return ret;
    }
    ESP_LOGI(TAG, "Event handler registered for TIMER_EVENT_DO_WORK");

    // Initialize timer
    gptimer_config_t timer_cfg = {
        .clk_src = GPTIMER_CLK_SRC_DEFAULT,
        .direction = GPTIMER_COUNT_UP,
        .resolution_hz = TIMER_RESOLUTION,
    };
    ESP_ERROR_CHECK(gptimer_new_timer(&timer_cfg, &timer_handle));

    gptimer_alarm_config_t alarm_cfg = {
        .alarm_count = ALARM_COUNT,
        .reload_count = 0,
        .flags.auto_reload_on_alarm = true,
    };
    ESP_ERROR_CHECK(gptimer_set_alarm_action(timer_handle, &alarm_cfg));

    gptimer_event_callbacks_t cbs = {
        .on_alarm = timer_callback,
    };
    ESP_ERROR_CHECK(gptimer_register_event_callbacks(timer_handle, &cbs, NULL));

    ESP_ERROR_CHECK(gptimer_set_raw_count(timer_handle, 0));
    ESP_ERROR_CHECK(gptimer_enable(timer_handle));
    ESP_ERROR_CHECK(gptimer_start(timer_handle));

    return ESP_OK;
}

// Function to check if there were any event posting errors
bool timer_has_event_errors(void)
{
    bool error = event_post_error;
    event_post_error = false;  // Reset the error flag
    return error;
}

