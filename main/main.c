#include <string.h>

//#include "freertos/task.h"
//#include "esp_http_server.h"
#include "esp_mac.h"
//#include "esp_wifi.h"
//#include "esp_netif.h"
#include "esp_event.h"
#include <esp_log.h>
#include "esp_netif.h"
#include "esp_wifi.h"
#include "esp_wifi_default.h"
#include "esp_wifi_types_generic.h"
#include "nvs_flash.h"
#include "web_server.h"
//#include "api.h"
#include "note_generator.h"
#include "wifi_ap.h"
#define EXAMPLE_ESP_WIFI_SSID      "LUNETTE"
#define EXAMPLE_ESP_WIFI_PASS      "12345678"
#define EXAMPLE_MAX_STA_CONN       4

static const char *TAG = "wifi softap";

static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                             int32_t event_id, void* event_data)
{
    if (event_id == WIFI_EVENT_AP_STACONNECTED) {
        wifi_event_ap_staconnected_t* event = (wifi_event_ap_staconnected_t*) event_data;
        ESP_LOGI(TAG, "station "MACSTR" join, AID=%d",
                 MAC2STR(event->mac), event->aid);
    } else if (event_id == WIFI_EVENT_AP_STADISCONNECTED) {
        wifi_event_ap_stadisconnected_t* event = (wifi_event_ap_stadisconnected_t*) event_data;
        ESP_LOGI(TAG, "station "MACSTR" leave, AID=%d",
                 MAC2STR(event->mac), event->aid);
    }
}

void app_main(void)
{
    //Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_ERROR_CHECK(nvs_flash_erase());
      ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    oscillator_init();

    // Initialize sensor data
    //init_sensor_data();

    ESP_LOGI(TAG, "ESP_WIFI_MODE_AP");
    wifi_init_softap();

    // Start the web server
    esp_err_t err = web_server_init();
    if (err != ESP_OK) {
       ESP_LOGE(TAG, "Failed to start web server");
    } else {
       ESP_LOGI(TAG, "Web server started successfully");
    }
}
