#include <string.h>

#include <esp_log.h>
#include "wifi_station.h"
#include "web_server.h"
#include "oscillator_logic.h"
#include "timer.h"

static const char *TAG = "MAIN";

void app_main(void)
{
    // Initialize WiFi station
    ESP_LOGI(TAG, "ESP_WIFI_MODE_STA");
    wifi_init_sta();

    // Start the web server
    esp_err_t err = web_server_init();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start web server");
    } else {
        ESP_LOGI(TAG, "Web server started successfully");
    }

        // Initialize oscillator logic
   ESP_ERROR_CHECK(oscillator_logic_init());

   //     // Initialize shared timer
   //  ESP_ERROR_CHECK(timer_init());
}
