#pragma once

#include <stdbool.h>
#include "esp_err.h"

typedef enum {
    LOGICAL_OP_AND,
    LOGICAL_OP_OR,
    LOGICAL_OP_XOR,
    LOGICAL_OP_NAND,
    LOGICAL_OP_NOR,
    LOGICAL_OP_XNOR
} logical_op_t;

typedef struct {
    bool *input1;
    bool *input2;
    logical_op_t operation;
    bool result;
} logical_ops_t;

/**
 * @brief Initialize the logical operations component
 * 
 * @param ops Pointer to logical_ops_t structure to initialize
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t logical_ops_init(logical_ops_t* ops);

/**
 * @brief Set the logical operation type
 * 
 * @param ops Pointer to logical_ops_t structure
 * @param op The logical operation to perform
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t logical_ops_set_operation(logical_ops_t* ops, logical_op_t op);

/**
 * @brief Set the input values
 * 
 * @param ops Pointer to logical_ops_t structure
 * @param input1 First input value pointer
 * @param input2 Second input value pointer
 * @return esp_err_t ESP_OK on success, otherwise an error code
 */
esp_err_t logical_ops_set_inputs(logical_ops_t* ops, bool *input1, bool *input2);

/**
 * @brief Calculate the result of the logical operation
 * 
 * @param ops Pointer to logical_ops_t structure
 * @return bool The result of the logical operation
 */
bool logical_ops_calculate(logical_ops_t* ops);

/**
 * @brief Get pointer to the result value
 * 
 * @param ops Pointer to logical_ops_t structure
 * @return bool* Pointer to the result value, NULL if ops is NULL
 */
bool* logical_ops_get_result_pointer(logical_ops_t* ops);
