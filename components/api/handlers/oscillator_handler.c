#include "oscillator_handler.h"
#include "api_utils.h"
#include <esp_log.h>
#include "cJSON.h"
#include "oscillator_logic.h"


static const char *TAG = "oscillator_handler";

void update_oscillator_data(int oscillator_id, double freq, double amp) {
    Oscillator* oscillators = oscillator_logic_get_oscillators();
    oscillator_set_frequency(&oscillators[oscillator_id], freq);
    oscillator_set_amplitude(&oscillators[oscillator_id], amp);
    ESP_LOGI(TAG, "Updating oscillator data: id=%d, freq=%.1f, amp=%.1f", 
             oscillator_id, freq, amp);
}

Oscillator *get_oscillators_data(void) {
    return oscillator_logic_get_oscillators();
}

esp_err_t oscillator_get_handler(httpd_req_t *req)
{
    ESP_LOGD(TAG, "GET /api/oscillator");

    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        return send_error_response(req, 500, "Failed to create JSON object");
    }

    cJSON *arr = cJSON_CreateArray();
    Oscillator* oscillators = get_oscillators_data();

    for (int i = 0; i < 4; i++) {
        cJSON *osc = cJSON_CreateObject();
        cJSON_AddNumberToObject(osc, "frequency", oscillators[i].frequency);
        cJSON_AddNumberToObject(osc, "amplitude", oscillators[i].amplitude);
        cJSON_AddItemToArray(arr, osc);
    }
    cJSON_AddItemToObject(root, "oscillators", arr);

    esp_err_t err = send_json_response(req, root);
    cJSON_Delete(root);
    return err;
}

esp_err_t oscillator_post_handler(httpd_req_t *req)
{
    ESP_LOGD(TAG, "POST /api/oscillator");

    cJSON *root = NULL;
    esp_err_t err = parse_json_body(req, &root);
    if (err != ESP_OK) {
        return err;
    }

    cJSON *oscillator_id_obj = cJSON_GetObjectItem(root, "oscillator_id");
    cJSON *frequency_obj = cJSON_GetObjectItem(root, "frequency");
    cJSON *amplitude_obj = cJSON_GetObjectItem(root, "amplitude");

    if (!oscillator_id_obj || !frequency_obj || !amplitude_obj) {
        ESP_LOGE(TAG, "Missing required field: %s", 
                 !oscillator_id_obj ? "oscillator_id" :
                 !frequency_obj ? "frequency" : "amplitude");
        cJSON_Delete(root);
        return send_error_response(req, 400, "Missing required field");
    }

    if (!cJSON_IsNumber(oscillator_id_obj) || 
        !cJSON_IsNumber(frequency_obj) || 
        !cJSON_IsNumber(amplitude_obj)) {
        cJSON_Delete(root);
        return send_error_response(req, 400, "Invalid field type");
    }

    int oscillator_id = oscillator_id_obj->valueint;
    double frequency = frequency_obj->valuedouble;
    double amplitude = amplitude_obj->valuedouble;

    ESP_LOGD(TAG, "Oscillator ID: %d, Frequency: %f, Amplitude: %f",
             oscillator_id, frequency, amplitude);

    update_oscillator_data(oscillator_id, frequency, amplitude);
    cJSON_Delete(root);

    // Create success response
    cJSON *response = cJSON_CreateObject();
    cJSON_AddStringToObject(response, "status", "success");
    err = send_json_response(req, response);
    cJSON_Delete(response);
    
    return err;
}

// Define the endpoints
// const api_endpoint_t oscillator_endpoints 

const api_endpoint_t oscillator_endpoints[] = (api_endpoint_t[]){
    (api_endpoint_t){
        .uri = "/api/oscillator",
        .method = HTTP_GET,
        .handler = oscillator_get_handler,
        .user_ctx = NULL
    },
    (api_endpoint_t){
        .uri = "/api/oscillator",
        .method = HTTP_POST,
        .handler = oscillator_post_handler,
        .user_ctx = NULL
    }
};

const int oscillator_endpoint_count = 2;