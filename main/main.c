#include <string.h>

// #include "esp_mac.h"
// #include "esp_event.h"
#include <esp_log.h>
// #include "esp_netif.h"
// #include "esp_wifi.h"
// #include "esp_wifi_default.h"
// #include "esp_wifi_types_generic.h"
// #include "nvs_flash.h"
#include "web_server.h"
//#include "api.h"
#include "note_generator.h"
// #include "wifi_ap.h"
#include "wifi_station.h"

static const char *TAG = "MAIN";

void app_main(void)
{


    oscillator_init();

    // Initialize sensor data
    //init_sensor_data();

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
