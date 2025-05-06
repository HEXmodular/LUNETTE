#include "api_registry.h"
#include <esp_log.h>
#include "oscillator_handler.h"
#include "logical_ops_handler.h"

static const char *TAG = "api_registry";

static esp_err_t api_register_endpoints(httpd_handle_t server, const api_endpoint_t endpoints[], int count) {
    esp_err_t err;
    
    for (int i = 0; i < count; i++) {
        httpd_uri_t uri = {
            .uri = endpoints[i].uri,
            .method = endpoints[i].method,
            .handler = endpoints[i].handler,
            .user_ctx = endpoints[i].user_ctx
        };
        
        err = httpd_register_uri_handler(server, &uri);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "Failed to register handler for %s", endpoints[i].uri);
            return err;
        }
        ESP_LOGI(TAG, "Registered handler for %s", endpoints[i].uri);
    }
    
    return ESP_OK;
}

esp_err_t api_registry_init(httpd_handle_t server) {
    esp_err_t err;

    // Register oscillator endpoints
    err = api_register_endpoints(server, oscillator_endpoints, oscillator_endpoint_count);
    if (err != ESP_OK) {
        return err;
    }
    
    // Register logical operations endpoints
    err = api_register_endpoints(server, logical_ops_endpoints, logical_ops_endpoint_count);
    if (err != ESP_OK) {
        return err;
    }
    
    return ESP_OK;
} 