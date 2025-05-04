#include "oscillator_logic.h"
#include "oscillator.h"
#include "logical_ops.h"
#include "output.h"

#include <esp_log.h>

static const char *TAG = "oscillator_logic";

// Initialize oscillators
static Oscillator oscillators[4];

// Initialize logical operators
static logical_ops_t logical_ops[3];

// Function to convert oscillator output to boolean
static bool oscillator_output_to_bool(double value) {
    return value > 0;
}

// Function to convert boolean to oscillator output
static int8_t bool_to_oscillator_output(bool value) {
    return value ? 127 : -128;
}

// Get oscillators array
Oscillator* oscillator_logic_get_oscillators(void) {
    return oscillators;
}

// Task function that processes oscillator outputs and applies logical operations
static void oscillator_logic_task(void* arg) {
            // Get current values from oscillators
            double osc1_value = oscillator_next(&oscillators[0]);
            double osc2_value = oscillator_next(&oscillators[1]);
            double osc3_value = oscillator_next(&oscillators[2]);
            double osc4_value = oscillator_next(&oscillators[3]);

            // Convert to boolean values
            bool osc1_bool = oscillator_output_to_bool(osc1_value);
            bool osc2_bool = oscillator_output_to_bool(osc2_value);
            bool osc3_bool = oscillator_output_to_bool(osc3_value);
            bool osc4_bool = oscillator_output_to_bool(osc4_value);

            // Update logical operator inputs
            logical_ops_set_inputs(&logical_ops[0], &osc1_bool, &osc2_bool);
            logical_ops_set_inputs(&logical_ops[1], &osc3_bool, &osc4_bool);
            
            // Calculate operator results
            logical_ops_calculate(&logical_ops[0]);
            logical_ops_calculate(&logical_ops[1]);
            
            // Get results and feed to final logical operator
            bool* result1 = logical_ops_get_result_pointer(&logical_ops[0]);
            bool* result2 = logical_ops_get_result_pointer(&logical_ops[1]);
            logical_ops_set_inputs(&logical_ops[2], result1, result2);
            
            logical_ops_calculate(&logical_ops[2]);

            bool* result = logical_ops_get_result_pointer(&logical_ops[2]);
            output_init(4, (int8_t*)result);
}

esp_err_t oscillator_logic_init(void) {
    ESP_LOGI(TAG, "Initializing oscillator logic component");

    // Initialize oscillators
    oscillator_init(&oscillators[0], 440.0, 1.0, OSCILLATOR_TYPE_SQUARE);    
    oscillator_init(&oscillators[1], 440.0, 1.0, OSCILLATOR_TYPE_SQUARE);
    oscillator_init(&oscillators[2], 440.0, 1.0, OSCILLATOR_TYPE_SQUARE);
    oscillator_init(&oscillators[3], 440.0, 1.0, OSCILLATOR_TYPE_SQUARE);

    // Initialize logical operators
    logical_ops_init(&logical_ops[0]);
    logical_ops_init(&logical_ops[1]);
    logical_ops_init(&logical_ops[2]);

    // Configure logical operations
    logical_ops_set_operation(&logical_ops[0], LOGICAL_OP_AND);
    logical_ops_set_operation(&logical_ops[1], LOGICAL_OP_OR);
    logical_ops_set_operation(&logical_ops[2], LOGICAL_OP_XOR);

    // Create output instance with final logical operator result
    bool* final_result = logical_ops_get_result_pointer(&logical_ops[2]);
    output_init(4, (int8_t*)final_result);

    // Create task for processing


    return ESP_OK;
}
