#pragma once

#include "esp_http_server.h"
#include "api_types.h"

esp_err_t logical_ops_get_handler(httpd_req_t *req);
esp_err_t logical_ops_post_handler(httpd_req_t *req);

extern const api_endpoint_t logical_ops_endpoints[];
extern const int logical_ops_endpoint_count; 