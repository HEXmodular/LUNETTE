#include "output.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "timer.h"

#define MHZ                             (1000000)
#define EXAMPLE_OVER_SAMPLE_RATE        (10 * MHZ)          // 10 MHz over sample rate
#define EXAMPLE_TIMER_RESOLUTION        (1  * MHZ)          // 1 MHz timer counting resolution
#define EXAMPLE_CALLBACK_INTERVAL_US    (100)               // 100 us interval of each timer callback = 100 kHz
#define EXAMPLE_ALARM_COUNT             (EXAMPLE_CALLBACK_INTERVAL_US * (EXAMPLE_TIMER_RESOLUTION / MHZ))

// Convert boolean to PDM value (-128 to 127)
#define BOOL_TO_PDM(value) ((value) ? 127 : -128)

ESP_STATIC_ASSERT(EXAMPLE_CALLBACK_INTERVAL_US >= 7, "Timer callback interval is too short");

static const char *TAG = "output";

typedef struct {
    sdm_channel_handle_t sdm_chan;
    int8_t* value_ptr;
} output_instance_t;

static output_instance_t* g_output_instance = NULL;

void output_timer_callback(void)
{
    if (g_output_instance && g_output_instance->value_ptr) {
        int8_t pdm_value = BOOL_TO_PDM(*(g_output_instance->value_ptr));
        sdm_channel_set_pulse_density(g_output_instance->sdm_chan, pdm_value);
    }
}

static sdm_channel_handle_t example_init_sdm(int gpio_num)
{
    sdm_channel_handle_t sdm_chan = NULL;
    sdm_config_t config = {
        .clk_src = SDM_CLK_SRC_DEFAULT,
        .gpio_num = gpio_num,
        .sample_rate_hz = EXAMPLE_OVER_SAMPLE_RATE,
    };
    ESP_ERROR_CHECK(sdm_new_channel(&config, &sdm_chan));
    ESP_ERROR_CHECK(sdm_channel_enable(sdm_chan));

    return sdm_chan;
}

output_handle_t output_init(int gpio_num, int8_t* value_ptr)
{
    if (g_output_instance != NULL) {
        ESP_LOGW(TAG, "Output already initialized");
        return (output_handle_t)g_output_instance;
    }

    output_instance_t* instance = malloc(sizeof(output_instance_t));
    if (!instance) {
        ESP_LOGE(TAG, "Failed to allocate output instance");
        return NULL;
    }

    instance->value_ptr = value_ptr;
    instance->sdm_chan = example_init_sdm(gpio_num);
    
    if (!instance->sdm_chan) {
        ESP_LOGE(TAG, "Failed to initialize SDM channel");
        free(instance);
        return NULL;
    }

    g_output_instance = instance;
    ESP_LOGI(TAG, "Output initialized on GPIO %d", gpio_num);
    
    return (output_handle_t)instance;
}

void output_set_value_ptr(output_handle_t handle, int8_t* value_ptr)
{
    output_instance_t* instance = (output_instance_t*)handle;
    if (instance) {
        instance->value_ptr = value_ptr;
    }
}

void output_deinit(output_handle_t handle)
{
    output_instance_t* instance = (output_instance_t*)handle;
    if (instance) {
        if (instance->sdm_chan) {
            sdm_channel_disable(instance->sdm_chan);
            sdm_del_channel(instance->sdm_chan);
        }
        free(instance);
        g_output_instance = NULL;
    }
} 