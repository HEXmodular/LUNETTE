#include <stdio.h>
#include "note_generator.h"

#include <math.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "driver/sdm.h"
#include "driver/gptimer.h"

#define MHZ                             (1000000)
#define CONST_PI                        (3.1416)           // Constant of PI, used for calculating the sine wave
#define EXAMPLE_SIGMA_DELTA_GPIO_NUM    (4)                 // Select GPIO_NUM_4 as the sigma-delta output pin
#define EXAMPLE_OVER_SAMPLE_RATE        (10 * MHZ)          // 10 MHz over sample rate
#define EXAMPLE_TIMER_RESOLUTION        (1  * MHZ)          // 1 MHz timer counting resolution
#define EXAMPLE_CALLBACK_INTERVAL_US    (100)               // 100 us interval of each timer callback = 100 kHz TODO 2000
#define EXAMPLE_ALARM_COUNT             (EXAMPLE_CALLBACK_INTERVAL_US * (EXAMPLE_TIMER_RESOLUTION / MHZ))
#define EXAMPLE_SINE_WAVE_FREQ_HZ       (100)               // 100 Hz sine wave, adjust this value to decide the sine wave frequency
#define EXAMPLE_SINE_WAVE_AMPLITUDE     (90.0)            // 1 ~ 127, adjust this value to decide the sine wave amplitude
#define EXAMPLE_SINE_WAVE_POINT_NUM     (MHZ / (EXAMPLE_CALLBACK_INTERVAL_US * EXAMPLE_SINE_WAVE_FREQ_HZ)) // 1000000 / (100 * 100)  = 100
#define EXAMPLE_SINE_WAVE_POINT_NUM_DITHER (EXAMPLE_SINE_WAVE_POINT_NUM * 2)

ESP_STATIC_ASSERT(EXAMPLE_SINE_WAVE_POINT_NUM > 1, "Sine wave frequency is too high");
ESP_STATIC_ASSERT(EXAMPLE_CALLBACK_INTERVAL_US >= 7, "Timer callback interval is too short");

static const char *TAG = "sdm_dac";
static int8_t sine_wave[EXAMPLE_SINE_WAVE_POINT_NUM_DITHER];   // Sine wave data buffer
static double current_frequency = 100.0; // Current frequency in Hz
static double delta = 1.0;


static bool IRAM_ATTR example_timer_callback(gptimer_handle_t timer, const gptimer_alarm_event_data_t *edata, void *user_ctx)
{

    static double phaser = 0.0;
    sdm_channel_handle_t sdm_chan = (sdm_channel_handle_t)user_ctx;


    /* Set the pulse density */
    sdm_channel_set_pulse_density(sdm_chan, sine_wave[(int)phaser]);
    phaser += delta;

    /* Loop the sine wave data buffer */
    if (phaser >= EXAMPLE_SINE_WAVE_POINT_NUM_DITHER) {
        //cnt = 0;
        phaser -= EXAMPLE_SINE_WAVE_POINT_NUM_DITHER;
        // phaser += 0.1f;
    }
    return false;
}

static gptimer_handle_t example_init_gptimer(void* args)
{
    /* Allocate GPTimer handle */
    gptimer_handle_t timer_handle;
    gptimer_config_t timer_cfg = {
        .clk_src = GPTIMER_CLK_SRC_DEFAULT,
        .direction = GPTIMER_COUNT_UP,
        .resolution_hz = EXAMPLE_TIMER_RESOLUTION,
    };
    ESP_ERROR_CHECK(gptimer_new_timer(&timer_cfg, &timer_handle));
    ESP_LOGI(TAG, "Timer allocated with resolution %d Hz", EXAMPLE_TIMER_RESOLUTION);

    /* Set the timer alarm configuration */
    gptimer_alarm_config_t alarm_cfg = {
        .alarm_count = EXAMPLE_ALARM_COUNT,
        .reload_count = 0,
        .flags.auto_reload_on_alarm = true,
    };
    ESP_ERROR_CHECK(gptimer_set_alarm_action(timer_handle, &alarm_cfg));

    /* Register the alarm callback */
    gptimer_event_callbacks_t cbs = {
        .on_alarm = example_timer_callback,
    };
    ESP_ERROR_CHECK(gptimer_register_event_callbacks(timer_handle, &cbs, args));
    ESP_LOGI(TAG, "Timer callback registered, interval %d us", EXAMPLE_CALLBACK_INTERVAL_US);

    /* Clear the timer raw count value, make sure it'll count from 0 */
    ESP_ERROR_CHECK(gptimer_set_raw_count(timer_handle, 0));
    /* Enable the timer */
    ESP_ERROR_CHECK(gptimer_enable(timer_handle));

    ESP_LOGI(TAG, "Timer enabled");

    return timer_handle;
}

static sdm_channel_handle_t example_init_sdm(void)
{
    /* Allocate sdm channel handle */
    sdm_channel_handle_t sdm_chan = NULL;
    sdm_config_t config = {
        .clk_src = SDM_CLK_SRC_DEFAULT,
        .gpio_num = EXAMPLE_SIGMA_DELTA_GPIO_NUM,
        .sample_rate_hz = EXAMPLE_OVER_SAMPLE_RATE,
    };
    ESP_ERROR_CHECK(sdm_new_channel(&config, &sdm_chan));
    /* Enable the sdm channel */
    ESP_ERROR_CHECK(sdm_channel_enable(sdm_chan));

    ESP_LOGI(TAG, "Sigma-delta output is attached to GPIO %d", EXAMPLE_SIGMA_DELTA_GPIO_NUM);

    return sdm_chan;
}

void oscillator_init(void)
{
    /* Initialize sine wave data */
    for (int i = 0; i < EXAMPLE_SINE_WAVE_POINT_NUM_DITHER; i++) {
        // Add noise shaping and dithering
        static float error = 0;
        float sample = sin(2.0 * (double)i * CONST_PI / EXAMPLE_SINE_WAVE_POINT_NUM) * EXAMPLE_SINE_WAVE_AMPLITUDE;
        
        // Generate dither noise (-1 to 1)
        float dither = ((double)rand() / RAND_MAX) * 2.0f - 1.0f;
        dither *= 0.25f; // Scale dither amplitude
        
        // Add dither and previous quantization error with noise shaping filter
        sample += dither + error * 0.5f;

        // Quantize to int8_t
        int8_t quantized = (int8_t)sample;
        
        // Calculate new error and apply noise shaping
        error = sample - quantized;
        
        sine_wave[i] = quantized;
    }
    /* Initialize sigma-delta modulation on the specific GPIO */
    sdm_channel_handle_t sdm_chan = example_init_sdm();
    /* Initialize GPTimer and register the timer alarm callback */
    gptimer_handle_t timer_handle = example_init_gptimer(sdm_chan);
    /* Start the GPTimer */
    ESP_LOGI(TAG, "Output start");
    ESP_ERROR_CHECK(gptimer_start(timer_handle));
}

void oscillator_set_frequency(double frequency_hz) {
    if (frequency_hz <= 0) {
        ESP_LOGE(TAG, "Invalid frequency: %f Hz", frequency_hz);
        return;
    }

    current_frequency = frequency_hz;
    
    // Calculate delta for smooth frequency transition
    delta = 1 + ((current_frequency - EXAMPLE_SINE_WAVE_FREQ_HZ) * 0.01);
    //  1+ (200 - 100) * 0.01 = 1

    ESP_LOGI(TAG, "Frequency set to %d Hz", (int)current_frequency);
}
