#ifndef OSCILLATOR_H
#define OSCILLATOR_H

#include <stdint.h>
#include <stdbool.h>

#define WAVETABLE_SIZE 256

typedef enum {
    OSCILLATOR_TYPE_SINE,
    OSCILLATOR_TYPE_SQUARE,
    OSCILLATOR_TYPE_SAWTOOTH,
    OSCILLATOR_TYPE_TRIANGLE,
    OSCILLATOR_TYPE_SQUARE_BOOL,
} oscillator_type_t;

typedef struct {
    double frequency;
    double phase;
    double amplitude;
    double phase_increment;
    double sample_rate;
    double wavetable[WAVETABLE_SIZE];  // Wavetable for synthesis
    bool wavetable_bool[WAVETABLE_SIZE];  // Wavetable for boolean values
    int table_index;
    oscillator_type_t type;
    bool result_bool;
    double result;
} Oscillator;

// Initialize oscillator with given parameters
void oscillator_init(Oscillator* osc, double frequency, double amplitude, oscillator_type_t type);

// Initialize wavetable with a specific waveform
void oscillator_init_wavetable(Oscillator* osc, const double* waveform, int size);

// Calculate the phase increment for the oscillator
double oscillator_calculate_phase_increment(Oscillator* osc);

// Generate next sample from oscillator using wavetable
void oscillator_calculate(Oscillator* osc);

// Calculate the boolean value from the oscillator
void oscillator_calculate_bool(volatile Oscillator* osc);

// Get the result of the oscillator
bool* oscillator_get_result_bool_pointer(Oscillator* osc);

double* oscillator_get_result_pointer(Oscillator* osc);

// Update oscillator frequency
void oscillator_set_frequency(Oscillator* osc, double frequency);

// Update oscillator amplitude
void oscillator_set_amplitude(Oscillator* osc, double amplitude);

// Generate a sine wave wavetable
void generate_sine_wavetable(double* table, int size);

// Generate a square wave wavetable
void generate_square_wavetable(double* table, int size);

// Generate a square wave wavetable for boolean values
void generate_square_wavetable_bool(bool* table, int size);

// Generate a sawtooth wave wavetable
void generate_sawtooth_wavetable(double* table, int size);

// Generate a triangle wave wavetable
void generate_triangle_wavetable(double* table, int size);

#endif // OSCILLATOR_H 