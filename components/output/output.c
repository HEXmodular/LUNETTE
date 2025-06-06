#include <string.h>
#include "output.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "timer.h"

#define MHZ                             (1000000)
#define KHZ                            (1000)
#define OVER_SAMPLE_RATE               (10 * MHZ)          // for PDM output


// Convert boolean to PDM value (-128 to 127)
#define BOOL_TO_PDM(value) ((value) ? 127 : -128)

// реализует две функции хранение буфера и вывод сигнала на пин PDM

// жтот компонент МОЖЕТ отвечать за генерацию сигнала на пине выхода
// его высокая частота позволяет обойти ограничения по битности
// через дополнительный софтовый дельта сигма алгоритм

//  сейчас он работает на частоте вызова

static const char *TAG = "output";

typedef struct {
    sdm_channel_handle_t sdm_chan;
    int8_t* value_ptr;
    bool* value_ptr_bool;
    // Sample collection
    int8_t sample_buffer[OUTPUT_SAMPLE_BUFFER_SIZE];
    size_t sample_count;
    bool buffer_ready;
} output_instance_t;

static output_instance_t* g_output_instance = NULL;

// Callback function pointer
static void (*buffer_ready_callback)(void) = NULL;

// Function to register buffer ready callback
void output_register_buffer_ready_callback(void (*callback)(void)) {
    ESP_LOGI(TAG, "Registering buffer ready callback");
    buffer_ready_callback = callback;
}

//  для предотвращения обращения к несуществующему указателю
static void execute_buffer_ready_callback(void) {
    if (buffer_ready_callback != NULL) {
        buffer_ready_callback();
    }
}

// функция для генерации сигнала на пине выхода
// записывает в буфер значение сигнала
void output_timer_callback(void)
{
    if (g_output_instance && g_output_instance->value_ptr) {
        int8_t pdm_value = BOOL_TO_PDM(*(g_output_instance->value_ptr));
        sdm_channel_set_pulse_density(g_output_instance->sdm_chan, pdm_value);
        
        // Store sample if buffer not full
        if (g_output_instance->sample_count < OUTPUT_SAMPLE_BUFFER_SIZE) {
            g_output_instance->sample_buffer[g_output_instance->sample_count++] = pdm_value;
            if (g_output_instance->sample_count >= OUTPUT_SAMPLE_BUFFER_SIZE) {
                g_output_instance->buffer_ready = true;
                g_output_instance->sample_count = 0;
                execute_buffer_ready_callback();
            }
        }
    }
}

// функция для генерации сигнала на пине выхода
// записывает в буфер значение сигнала
void output_timer_callback_bool(void)
{
    if (g_output_instance && g_output_instance->value_ptr_bool) {
        int8_t pdm_value = BOOL_TO_PDM(*(g_output_instance->value_ptr_bool));
        sdm_channel_set_pulse_density(g_output_instance->sdm_chan, pdm_value);
        
        // Store sample if buffer not full
        if (g_output_instance->sample_count < OUTPUT_SAMPLE_BUFFER_SIZE) {
            g_output_instance->sample_buffer[g_output_instance->sample_count++] = pdm_value;
            if (g_output_instance->sample_count >= OUTPUT_SAMPLE_BUFFER_SIZE) {
                g_output_instance->buffer_ready = true;
                g_output_instance->sample_count = 0;
                execute_buffer_ready_callback();
            }
        }
    }
}

// инициализация SDM канала
static sdm_channel_handle_t example_init_sdm(int gpio_num)
{
    sdm_channel_handle_t sdm_chan = NULL;
    sdm_config_t config = {
        .clk_src = SDM_CLK_SRC_DEFAULT,
        .gpio_num = gpio_num,
        .sample_rate_hz = OVER_SAMPLE_RATE,
    };
    ESP_ERROR_CHECK(sdm_new_channel(&config, &sdm_chan));
    ESP_ERROR_CHECK(sdm_channel_enable(sdm_chan));

    return sdm_chan;
}

// инициализация экземпляра output
static output_handle_t output_init_common(int gpio_num) {
    if (g_output_instance != NULL) {
        ESP_LOGW(TAG, "Output already initialized");
        return (output_handle_t)g_output_instance;
    }

    output_instance_t* instance = malloc(sizeof(output_instance_t));
    if (!instance) {
        ESP_LOGE(TAG, "Failed to allocate output instance");
        return NULL;
    }

    // Initialize pointers to NULL
    instance->value_ptr = NULL;
    instance->value_ptr_bool = NULL; //  для хранения указателя откуда забирать данные
    instance->sample_count = 0;
    instance->buffer_ready = false;
    
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

// создание экземпляра output для работы с булевым значением
output_handle_t output_init_bool(int gpio_num, bool* value_ptr)
{
    output_handle_t handle = output_init_common(gpio_num);
    if (handle) {
        output_instance_t* instance = (output_instance_t*)handle;
        instance->value_ptr_bool = value_ptr;
    }
    return handle;
}

// создание экземпляра output для работы с целым значением
output_handle_t output_init(int gpio_num, int8_t* value_ptr)
{
    output_handle_t handle = output_init_common(gpio_num);
    if (handle) {
        output_instance_t* instance = (output_instance_t*)handle;
        instance->value_ptr = value_ptr;
    }
    return handle;
}

// не используется
void output_set_value_ptr(output_handle_t handle, int8_t* value_ptr)
{
    output_instance_t* instance = (output_instance_t*)handle;
    if (instance) {
        instance->value_ptr = value_ptr;
    }
}

// не используется
void output_set_bool_value_ptr(output_handle_t handle, bool* value_ptr_bool)
{
    output_instance_t* instance = (output_instance_t*)handle;
    if (instance) {
        instance->value_ptr_bool = value_ptr_bool;
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

// для получения буфера с выходными значениями
esp_err_t output_get_samples(output_handle_t handle, int8_t* buffer, size_t size)
{
    output_instance_t* instance = (output_instance_t*)handle;
    if (!instance || !buffer || size < OUTPUT_SAMPLE_BUFFER_SIZE) {
        return ESP_ERR_INVALID_ARG;
    }

    if (!instance->buffer_ready) {
        return ESP_ERR_NOT_FOUND;
    }

    // Copy samples to provided buffer
    memcpy(buffer, instance->sample_buffer, OUTPUT_SAMPLE_BUFFER_SIZE);
    
    // Reset buffer state
    instance->sample_count = 0;
    instance->buffer_ready = false;

    return ESP_OK;
}

bool output_samples_ready(output_handle_t handle)
{
    output_instance_t* instance = (output_instance_t*)handle;
    return instance && instance->buffer_ready;
}

output_handle_t output_get_instance(void)
{
    return (output_handle_t)g_output_instance;
} 