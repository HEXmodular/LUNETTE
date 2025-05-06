#include "esp_http_server.h"
#include "api_types.h"
#include "oscillator.h"

// Handler function declarations
esp_err_t oscillator_get_handler(httpd_req_t *req);
esp_err_t oscillator_post_handler(httpd_req_t *req);

// Endpoint definitions
extern const api_endpoint_t oscillator_endpoints[];
extern const int oscillator_endpoint_count;