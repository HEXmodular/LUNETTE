#include "esp_http_server.h"
#include "api_types.h"

// Initialize the API registry and register all endpoints
esp_err_t api_registry_init(httpd_handle_t server);

// Register a set of endpoints
// esp_err_t api_register_endpoints(httpd_handle_t server, const api_endpoint_t endpoints[], int count);


