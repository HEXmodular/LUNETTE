#include "api_utils.h"
#include <esp_log.h>
#include "cJSON.h"

static const char *TAG = "api_utils";

esp_err_t send_json_response(httpd_req_t *req, cJSON *json) {
    if (json == NULL) {
        return ESP_FAIL;
    }

    char *response = cJSON_Print(json);
    if (response == NULL) {
        ESP_LOGE(TAG, "Failed to print JSON");
        return ESP_FAIL;
    }

    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-cache, no-store, must-revalidate");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    esp_err_t err = httpd_resp_send(req, response, strlen(response));
    free(response);
    
    return err;
}

esp_err_t send_error_response(httpd_req_t *req, int status_code, const char* message) {
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    cJSON *error = cJSON_CreateObject();
    cJSON_AddStringToObject(error, "error", message);
    
    httpd_resp_set_status(req, status_code == 404 ? "404 Not Found" :
                              status_code == 400 ? "400 Bad Request" :
                              status_code == 408 ? "408 Request Timeout" :
                              "500 Internal Server Error");
    
    esp_err_t err = send_json_response(req, error);
    cJSON_Delete(error);
    return err;
}

esp_err_t parse_json_body(httpd_req_t *req, cJSON **json) {
    int total_len = req->content_len;
    if (total_len >= 1024) {
        return send_error_response(req, 400, "Request too large");
    }

    char *content = malloc(total_len + 1);
    if (!content) {
        return ESP_FAIL;
    }

    int ret = httpd_req_recv(req, content, total_len);
    if (ret <= 0) {
        free(content);
        if (ret == HTTPD_SOCK_ERR_TIMEOUT) {
            return send_error_response(req, 408, "Request timeout");
        }
        return ESP_FAIL;
    }
    content[ret] = '\0';

    *json = cJSON_Parse(content);
    free(content);
    
    if (*json == NULL) {
        return send_error_response(req, 400, "Invalid JSON");
    }

    return ESP_OK;
}

esp_err_t api_options_handler(httpd_req_t *req)
{
    ESP_LOGD(TAG, "OPTIONS %s", req->uri);
    
    httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    httpd_resp_set_hdr(req, "Access-Control-Allow-Headers", "Content-Type");
    httpd_resp_send(req, NULL, 0);
    return ESP_OK;
} 