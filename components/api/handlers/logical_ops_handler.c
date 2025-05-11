#include "logical_ops_handler.h"
#include "api_utils.h"
#include <esp_log.h>
#include "cJSON.h"
#include "logical_ops.h"
#include "oscillator_logic.h"

static const char *TAG = "logical_ops_handler";

esp_err_t logical_ops_get_handler(httpd_req_t *req)
{
    ESP_LOGD(TAG, "GET /api/logical-ops");

    cJSON *root = cJSON_CreateObject();
    if (root == NULL) {
        return send_error_response(req, 500, "Failed to create JSON object");
    }

    // TODO: Add logic to get current logical operations state
    // This will be implemented when the state management is added

    esp_err_t err = send_json_response(req, root);
    cJSON_Delete(root);
    return err;
}

esp_err_t logical_ops_post_handler(httpd_req_t *req)
{
    ESP_LOGD(TAG, "POST /api/logical-ops");

    cJSON *root = NULL;
    esp_err_t err = parse_json_body(req, &root);
    if (err != ESP_OK) {
        return err;
    }

    cJSON *logic_block_id_obj = cJSON_GetObjectItem(root, "logic_block_id");
    cJSON *operation_type_obj = cJSON_GetObjectItem(root, "operation_type");
    cJSON *conection1_id_obj = cJSON_GetObjectItem(root, "conection1_id");
    cJSON *conection2_id_obj = cJSON_GetObjectItem(root, "conection2_id");

    if (!logic_block_id_obj || !operation_type_obj || !conection1_id_obj || !conection2_id_obj) {
        ESP_LOGE(TAG, "Missing required field: %s", 
                 !logic_block_id_obj ? "logic_block_id" : 
                 !operation_type_obj ? "operation_type" : 
                 !conection1_id_obj ? "conection1_id" : 
                 "conection2_id");
        cJSON_Delete(root);
        return send_error_response(req, 400, "Missing required field");
    }

    if (!cJSON_IsNumber(logic_block_id_obj) || !cJSON_IsString(operation_type_obj) || !cJSON_IsNumber(conection1_id_obj) || !cJSON_IsNumber(conection2_id_obj)) {
        cJSON_Delete(root);
        return send_error_response(req, 400, "Invalid field type");
    }

    int logic_block_id = logic_block_id_obj->valueint;
    const char *operation_type_str = operation_type_obj->valuestring;
    
    logical_op_t operation_type;
    
    // Convert string operation type to enum
    if (strcmp(operation_type_str, "AND") == 0) {
        operation_type = LOGICAL_OP_AND;
    } else if (strcmp(operation_type_str, "OR") == 0) {
        operation_type = LOGICAL_OP_OR;
    } else if (strcmp(operation_type_str, "XOR") == 0) {
        operation_type = LOGICAL_OP_XOR;
    } else if (strcmp(operation_type_str, "NAND") == 0) {
        operation_type = LOGICAL_OP_NAND;
    } else if (strcmp(operation_type_str, "NOR") == 0) {
        operation_type = LOGICAL_OP_NOR;
    } else if (strcmp(operation_type_str, "XNOR") == 0) {
        operation_type = LOGICAL_OP_XNOR;
    } else {
        cJSON_Delete(root);
        return send_error_response(req, 400, "Invalid operation type");
    }

    // Update the logical operation type
    logical_ops_t *logical_ops = oscillator_logic_get_logical_ops();
    if (logical_ops == NULL || logic_block_id < 0 || logic_block_id >= 3) {
        cJSON_Delete(root);
        return send_error_response(req, 400, "Invalid logic block ID");
    }

    err = logical_ops_set_operation(&logical_ops[logic_block_id], operation_type);
    if (err != ESP_OK) {
        cJSON_Delete(root);
        return send_error_response(req, 500, "Failed to set operation type");
    }

    // Set inputs
    Oscillator* oscillators = oscillator_logic_get_oscillators();
    bool* input1 = &oscillators[conection1_id_obj->valueint].result_bool;
    bool* input2 = &oscillators[conection2_id_obj->valueint].result_bool;

    err = logical_ops_set_inputs(&logical_ops[logic_block_id], input1, input2);
    if (err != ESP_OK) {
        cJSON_Delete(root);
        return send_error_response(req, 500, "Failed to set inputs");
    }

    cJSON_Delete(root);

    // Create success response
    cJSON *response = cJSON_CreateObject();
    cJSON_AddStringToObject(response, "status", "success");
    err = send_json_response(req, response);
    cJSON_Delete(response);
    
    return err;
}

const api_endpoint_t logical_ops_endpoints[] = {
    {
        .uri = "/api/logical-ops",
        .method = HTTP_GET,
        .handler = logical_ops_get_handler,
        .user_ctx = NULL
    },
    {
        .uri = "/api/logical-ops",
        .method = HTTP_POST,
        .handler = logical_ops_post_handler,
        .user_ctx = NULL
    }
};

const int logical_ops_endpoint_count = 2; 