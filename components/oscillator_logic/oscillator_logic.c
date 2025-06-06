// этот модуль для хранения всех данных о одной законченной единице из четырех осцилляторов и трех логических операций
#include "oscillator_logic.h"
#include "oscillator.h"
#include "logical_ops.h"
#include "output.h"
#include "timer.h"
#include <esp_log.h>

static const char *TAG = "oscillator_logic";

// Initialize oscillators
static Oscillator oscillators[4];

// Initialize logical operators
static logical_ops_t logical_ops[3];

// Get oscillators array
Oscillator* oscillator_logic_get_oscillators(void) {
    return oscillators;
}

// Get logical operations array
logical_ops_t* oscillator_logic_get_logical_ops(void) {
    return logical_ops;
}

// Timer callback function that processes oscillator outputs and applies logical operations
void oscillator_logic_next_bool(void)
{
    
    //  ESP_LOGI(TAG, "---Processing oscillator logic---");
    // Calculate boolean values
    oscillator_calculate_bool(&oscillators[0]);
    oscillator_calculate_bool(&oscillators[1]);
    oscillator_calculate_bool(&oscillators[2]);
    oscillator_calculate_bool(&oscillators[3]);

    // ESP_LOGI(TAG, "osc1_value: %d", oscillators[0].result_bool);
    
    // Calculate operator results
    logical_ops_calculate(&logical_ops[0]);
    logical_ops_calculate(&logical_ops[1]);
    logical_ops_calculate(&logical_ops[2]);

    // ESP_LOGI(TAG, "result1: %d", logical_ops[0].result);
}

esp_err_t oscillator_logic_init(void) {
    ESP_LOGI(TAG, "---Initializing oscillator logic component---");

    // Initialize oscillators
    oscillator_init(&oscillators[0], 0, 440.0, 1.0, OSCILLATOR_TYPE_SQUARE_BOOL);    
    oscillator_init(&oscillators[1], 1, 420.0, 1.0, OSCILLATOR_TYPE_SQUARE_BOOL);
    oscillator_init(&oscillators[2], 2, 460.0, 1.0, OSCILLATOR_TYPE_SQUARE_BOOL);
    oscillator_init(&oscillators[3], 3, 220.0, 1.0, OSCILLATOR_TYPE_SQUARE_BOOL);

    bool* osc1_result = oscillator_get_result_bool_pointer(&oscillators[0]);
    bool* osc2_result = oscillator_get_result_bool_pointer(&oscillators[1]);
    bool* osc3_result = oscillator_get_result_bool_pointer(&oscillators[2]);
    bool* osc4_result = oscillator_get_result_bool_pointer(&oscillators[3]);

    ESP_LOGI(TAG, "---Initializing logical operators---");
    // Initialize logical operators
    logical_ops_init(&logical_ops[0]);
    logical_ops_init(&logical_ops[1]);
    logical_ops_init(&logical_ops[2]);

    ESP_LOGI(TAG, "---Configuring logical operations---");
    // Configure logical operations
    logical_ops_set_operation(&logical_ops[0], LOGICAL_OP_AND);
    logical_ops_set_operation(&logical_ops[1], LOGICAL_OP_OR);
    logical_ops_set_operation(&logical_ops[2], LOGICAL_OP_XOR);

    ESP_LOGI(TAG, "---Initializing first logical operator---");
    // Update logical operator inputs
    logical_ops_set_inputs(&logical_ops[0], osc1_result, osc2_result, 0, 1);
    logical_ops_set_inputs(&logical_ops[1], osc3_result, osc4_result, 2, 3);

    ESP_LOGI(TAG, "---Initializing final logical operator---");
    // Get results and feed to final logical operator
    bool* result1 = logical_ops_get_result_pointer(&logical_ops[0]);
    bool* result2 = logical_ops_get_result_pointer(&logical_ops[1]);
    logical_ops_set_inputs(&logical_ops[2], result1, result2, 4, 5);

    ESP_LOGI(TAG, "---Initializing output---");
    // Create output instance with final logical operator result
    bool* final_result = logical_ops_get_result_pointer(&logical_ops[2]);

    output_init_bool(4, final_result);
    //output_init_bool(4, final_result);

    ESP_LOGI(TAG, "---Initializing timer---");
    // Initialize shared timer
    ESP_ERROR_CHECK(timer_init());

    return ESP_OK;
}
