#include "logical_ops.h"
#include <esp_log.h>

static const char *TAG = "logical_ops";

esp_err_t logical_ops_init(logical_ops_t* ops)
{
    if (!ops) {
        return ESP_ERR_INVALID_ARG;
    }
    
    ops->input1 = NULL;
    ops->input2 = NULL;
    ops->operation = LOGICAL_OP_AND;
    ops->result = false;
    
    ESP_LOGI(TAG, "Initializing logical operations component");
    return ESP_OK;
}

esp_err_t logical_ops_set_operation(logical_ops_t* ops, logical_op_t op)
{
    if (!ops || op > LOGICAL_OP_XNOR) {
        ESP_LOGE(TAG, "Invalid operation type or null pointer");
        return ESP_ERR_INVALID_ARG;
    }
    
    ops->operation = op;

    ESP_LOGI(TAG, "Operation set to %d", op);
    return ESP_OK;
}

esp_err_t logical_ops_set_inputs(logical_ops_t* ops, bool *input1, bool *input2)
{
    if (!ops) {
        return ESP_ERR_INVALID_ARG;
    }
    
    ops->input1 = input1;
    ops->input2 = input2;
    return ESP_OK;
}

bool logical_ops_calculate(logical_ops_t* ops)
{
    if (!ops || !ops->input1 || !ops->input2) {
        return false;
    }
    
    bool result = false;
    
    switch (ops->operation) {
        case LOGICAL_OP_AND:
            result = *ops->input1 && *ops->input2;
            break;
        case LOGICAL_OP_OR:
            result = *ops->input1 || *ops->input2;
            break;
        case LOGICAL_OP_XOR:
            result = *ops->input1 != *ops->input2;
            break;
        case LOGICAL_OP_NAND:
            result = !(*ops->input1 && *ops->input2);
            break;
        case LOGICAL_OP_NOR:
            result = !(*ops->input1 || *ops->input2);
            break;
        case LOGICAL_OP_XNOR:
            result = *ops->input1 == *ops->input2;
            break;
        default:
            ESP_LOGE(TAG, "Invalid operation type");
            return false;
    }
    
    ops->result = result;
    return result;
}

bool* logical_ops_get_result_pointer(logical_ops_t* ops)
{
    if (!ops) {
        return NULL;
    }
    return &ops->result;
}
