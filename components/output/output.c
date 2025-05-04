#include "output.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"

#define MHZ                             (1000000)
#define EXAMPLE_OVER_SAMPLE_RATE        (10 * MHZ)          // 10 MHz over sample rate
#define EXAMPLE_TIMER_RESOLUTION        (1  * MHZ)          // 1 MHz timer counting resolution
#define EXAMPLE_CALLBACK_INTERVAL_US    (100)               // 100 us interval of each timer callback = 100 kHz
#define EXAMPLE_ALARM_COUNT             (EXAMPLE_CALLBACK_INTERVAL_US * (EXAMPLE_TIMER_RESOLUTION / MHZ))

ESP_STATIC_ASSERT(EXAMPLE_CALLBACK_INTERVAL_US >= 7, "Timer callback interval is too short");

static const char *TAG = "output";

typedef struct {
    gptimer_handle_t timer_handle;
    sdm_channel_handle_t sdm_chan;
    int8_t* value_ptr;
} output_instance_t;

static bool IRAM_ATTR example_timer_callback(gptimer_handle_t timer, const gptimer_alarm_event_data_t *edata, void *user_ctx)
{
    output_instance_t* instance = (output_instance_t*)user_ctx;
    if (instance && instance->value_ptr) {
        sdm_channel_set_pulse_density(instance->sdm_chan, *(instance->value_ptr));
    }
    return false;
}

static gptimer_handle_t example_init_gptimer(output_instance_t* instance)
{
    gptimer_handle_t timer_handle;
    gptimer_config_t timer_cfg = {
        .clk_src = GPTIMER_CLK_SRC_DEFAULT,
        .direction = GPTIMER_COUNT_UP,
        .resolution_hz = EXAMPLE_TIMER_RESOLUTION,
    };
    ESP_ERROR_CHECK(gptimer_new_timer(&timer_cfg, &timer_handle));

    gptimer_alarm_config_t alarm_cfg = {
        .alarm_count = EXAMPLE_ALARM_COUNT,
        .reload_count = 0,
        .flags.auto_reload_on_alarm = true,
    };
    ESP_ERROR_CHECK(gptimer_set_alarm_action(timer_handle, &alarm_cfg));

    gptimer_event_callbacks_t cbs = {
        .on_alarm = example_timer_callback,
    };
    ESP_ERROR_CHECK(gptimer_register_event_callbacks(timer_handle, &cbs, instance));

    ESP_ERROR_CHECK(gptimer_set_raw_count(timer_handle, 0));
    ESP_ERROR_CHECK(gptimer_enable(timer_handle));

    return timer_handle;
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
    output_instance_t* instance = malloc(sizeof(output_instance_t));
    if (!instance) {
        return NULL;
    }

    instance->value_ptr = value_ptr;
    instance->sdm_chan = example_init_sdm(gpio_num);
    instance->timer_handle = example_init_gptimer(instance);
    
    ESP_ERROR_CHECK(gptimer_start(instance->timer_handle));
    
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
        if (instance->timer_handle) {
            gptimer_stop(instance->timer_handle);
            gptimer_disable(instance->timer_handle);
            gptimer_del_timer(instance->timer_handle);
        }
        if (instance->sdm_chan) {
            sdm_channel_disable(instance->sdm_chan);
            sdm_del_channel(instance->sdm_chan);
        }
        free(instance);
    }
} 