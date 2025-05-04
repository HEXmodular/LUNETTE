#include <string.h>

#include <esp_log.h>
#include "wifi_station.h"
#include "web_server.h"
#include "oscillator.h"

static const char *TAG = "MAIN";

void app_main(void)
{


    oscillator_init();

    //ESP_LOGI(TAG, "ESP_WIFI_MODE_AP");
    //wifi_init_softap();

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
}
