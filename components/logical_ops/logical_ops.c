#include "logical_ops.h"
#include <esp_log.h>
#include "oscillator.h"

static const char *TAG = "logical_ops";

const char* logical_op_names[] = {
    "LOGICAL_OP_AND",
    "LOGICAL_OP_OR",
    "LOGICAL_OP_XOR",
    "LOGICAL_OP_NAND",
    "LOGICAL_OP_NOR",
    "LOGICAL_OP_XNOR"
};

const char* input_type_names[] = {
    "INPUT_TYPE_NONE",
    "INPUT_TYPE_OSCILLATOR",
    "INPUT_TYPE_LOGICAL_OP",
    "INPUT_TYPE_COUNT"
};

esp_err_t logical_ops_init(logical_ops_t *ops)
{
    if (!ops)
    {
        return ESP_ERR_INVALID_ARG;
    }

    ops->input1 = NULL;
    ops->input2 = NULL;
    ops->operation = LOGICAL_OP_AND;
    ops->result = false;

    ESP_LOGI(TAG, "Initializing logical operations component");
    return ESP_OK;
}

// Функция для получения текстового названия из массива
const char *get_logical_op_name(logical_op_t op)
{
    // Проверяем, чтобы значение enum было в допустимом диапазоне индексов
    if (op >= 0 && op < LOGICAL_OP_COUNT)
    {
        return logical_op_names[op];
    }
    else
    {
        return "UNKNOWN_LOGICAL_OP";
    }
}

const char *get_input_type_name(input_type_t type)
{
    if (type >= 0 && type < INPUT_TYPE_COUNT)
    {
        return input_type_names[type];
    }
    else
    {
        return "UNKNOWN_INPUT_TYPE";
    }
}

esp_err_t logical_ops_set_operation(logical_ops_t *ops, logical_op_t op)
{
    if (!ops || op > LOGICAL_OP_XNOR)
    {
        ESP_LOGE(TAG, "Invalid operation type or null pointer");
        return ESP_ERR_INVALID_ARG;
    }

    ops->operation = op;

    ESP_LOGI(TAG, "Operation set to %d", op);
    return ESP_OK;
}


// esp_err_t logical_ops_set_inputs(logical_ops_t *ops, Oscillator *input1, Oscillator *input2, int input1_id, int input2_id)
esp_err_t logical_ops_set_inputs(logical_ops_t *ops, bool *input1, bool *input2, int input1_id, int input2_id)
{
    if (!ops)
    {
        return ESP_ERR_INVALID_ARG;
    }

    // TODO добавить код для работы с обратной связью сюда
    ops->input1 = input1;
    ops->input1_type = INPUT_TYPE_OSCILLATOR;
    ops->input1_id = input1_id;
    ops->input2 = input2;
    ops->input2_type = INPUT_TYPE_OSCILLATOR;
    ops->input2_id = input2_id;
    return ESP_OK;
}


bool logical_ops_calculate(logical_ops_t *ops)
{
    if (!ops || !ops->input1 || !ops->input2)
    {
        return false;
    }

    bool result = false;
    // Oscillator *osc1 = (Oscillator *)ops->input1;
    // Oscillator *osc2 = (Oscillator *)ops->input2;

    // if (!osc1 || !osc2)
    // {
    //     ESP_LOGE(TAG, "Invalid oscillator pointers");
    //     return false;
    // }

    // const bool input1 = osc1->result_bool;
    // const bool input2 = osc2->result_bool;

    const bool input1 = *(ops->input1);
    const bool input2 = *(ops->input2);

    switch (ops->operation)
    {
    case LOGICAL_OP_AND:
        result = input1 && input2;
        break;
    case LOGICAL_OP_OR:
        result = input1 || input2;
        break;
    case LOGICAL_OP_XOR:
        result = input1 != input2;
        break;
    case LOGICAL_OP_NAND:
        result = !input1 && !input2;
        break;
    case LOGICAL_OP_NOR:
        result = !input1 || !input2;
        break;
    case LOGICAL_OP_XNOR:
        result = input1 == input2;
        break;
    default:
        ESP_LOGE(TAG, "Invalid operation type");
        return false;
    }

    ops->result = result;
    return result;
}

bool *logical_ops_get_result_pointer(logical_ops_t *ops)
{
    if (!ops)
    {
        ESP_LOGE(TAG, "Invalid logical operations pointer");
        return NULL;
    }
    return &ops->result;
}
