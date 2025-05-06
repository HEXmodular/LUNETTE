#include "esp_http_server.h"
#include "cJSON.h"

esp_err_t send_json_response(httpd_req_t *req, cJSON *json);
esp_err_t send_error_response(httpd_req_t *req, int status_code, const char* message);
esp_err_t parse_json_body(httpd_req_t *req, cJSON **json);