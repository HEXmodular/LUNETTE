#ifndef API_TYPES_H
#define API_TYPES_H

#include "esp_http_server.h"

typedef esp_err_t (*api_handler_func_t)(httpd_req_t *req);

typedef struct {
    const char* uri;
    httpd_method_t method;
    api_handler_func_t handler;
    void* user_ctx;
} api_endpoint_t;

#endif /* API_TYPES_H */
