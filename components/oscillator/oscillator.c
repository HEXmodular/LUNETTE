#include "oscillator.h"
#include <math.h>
#include <stdbool.h>
#include "common_defs.h"

#define TWO_PI 6.28318530717958647692

double oscillator_calculate_phase_increment(Oscillator* osc) {
    if (!osc || osc->frequency <= 0.0 || osc->sample_rate <= 0.0) return 0.0;
    return (double)WAVETABLE_SIZE * osc->frequency / osc->sample_rate;
}

void oscillator_init(Oscillator* osc, int oscillator_id, double frequency, double amplitude, oscillator_type_t type) {
    if (!osc || frequency <= 0.0 || amplitude < 0.0) return;
    
    osc->oscillator_id = oscillator_id;
    osc->frequency = frequency;
    osc->amplitude = amplitude;
    osc->phase = 0.0;
    osc->table_index = 0;
    osc->sample_rate = SYSTEM_SAMPLE_RATE;
    osc->type = type;
    osc->result = 0.0;
    osc->result_bool = false;
    osc->phase_increment = oscillator_calculate_phase_increment(osc);
    
    // Initialize with sine wave by default
    if (type == OSCILLATOR_TYPE_SINE) {
        generate_sine_wavetable(osc->wavetable, WAVETABLE_SIZE);
    } else if (type == OSCILLATOR_TYPE_SQUARE) {
        generate_square_wavetable(osc->wavetable, WAVETABLE_SIZE);
    } else if (type == OSCILLATOR_TYPE_SAWTOOTH) {
        generate_sawtooth_wavetable(osc->wavetable, WAVETABLE_SIZE);
    } else if (type == OSCILLATOR_TYPE_TRIANGLE) {
        generate_triangle_wavetable(osc->wavetable, WAVETABLE_SIZE);
    } else if (type == OSCILLATOR_TYPE_SQUARE_BOOL) {
        generate_square_wavetable_bool(osc->wavetable_bool, WAVETABLE_SIZE);
    }
}

void oscillator_init_wavetable(Oscillator* osc, const double* waveform, int size) {
    if (!osc || !waveform || size <= 0) return;
    
    // Ensure size is within bounds
    size = (size > WAVETABLE_SIZE) ? WAVETABLE_SIZE : size;
    
    // Copy waveform data
    for (int i = 0; i < size; i++) {
        osc->wavetable[i] = waveform[i];
    }
    
    // Zero out remaining elements
    for (int i = size; i < WAVETABLE_SIZE; i++) {
        osc->wavetable[i] = 0.0;
    }
}

bool* oscillator_get_result_bool_pointer(Oscillator* osc) {
    if (!osc) return NULL;
    return &osc->result_bool;
}

double* oscillator_get_result_pointer(Oscillator* osc) {
    if (!osc) return NULL;
    return &osc->result;
}

void oscillator_calculate_bool(volatile Oscillator* osc) {
    if (!osc) return;

    // Ensure table_index is within bounds
    // todo delete this after debugging
    if (osc->table_index < 0 || osc->table_index >= WAVETABLE_SIZE) {
        osc->table_index = 0;
        osc->phase -= 1.0;
    }

    // Get sample from wavetable
    // todo make bool wavetable
    bool sample = osc->wavetable_bool[osc->table_index];

    // Update phase and table index
    osc->phase += osc->phase_increment;
    osc->table_index = (int)osc->phase % WAVETABLE_SIZE;
    osc->result_bool = sample;
}

void oscillator_calculate(Oscillator* osc) {
    if (!osc) return;
    
    // todo delete this after debugging
    // Ensure table_index is within bounds
    if (osc->table_index < 0 || osc->table_index >= WAVETABLE_SIZE) {
        osc->table_index = 0;
    }
    
    // Get sample from wavetable
    double sample = osc->amplitude * osc->wavetable[osc->table_index];
    
    // Update phase and table index
    osc->phase += osc->phase_increment;
    osc->table_index = (int)osc->phase % WAVETABLE_SIZE;
    osc->result = sample;
}

void oscillator_set_frequency(Oscillator* osc, double frequency) {
    if (!osc || frequency <= 0.0) return;
    osc->frequency = frequency;
    osc->phase_increment = oscillator_calculate_phase_increment(osc);
}

void oscillator_set_amplitude(Oscillator* osc, double amplitude) {
    if (!osc || amplitude < 0.0) return;
    osc->amplitude = amplitude;
}

void generate_sine_wavetable(double* table, int size) {
    if (!table) return;
    
    for (int i = 0; i < size; i++) {
        table[i] = sin(TWO_PI * i / size);
    }
}

void generate_square_wavetable(double* table, int size) {
    if (!table) return;
    
    for (int i = 0; i < size; i++) {
        table[i] = (i < size/2) ? 1.0 : -1.0;
    }
}

void generate_square_wavetable_bool(bool* table, int size) {
    if (!table) return;
    
    for (int i = 0; i < size; i++) {
        table[i] = (i < size/2) ? true : false;
    }
}

void generate_sawtooth_wavetable(double* table, int size) {
    if (!table) return;
    
    for (int i = 0; i < size; i++) {
        table[i] = 2.0 * (double)i / size - 1.0;
    }
}

void generate_triangle_wavetable(double* table, int size) {
    if (!table) return;
    
    for (int i = 0; i < size; i++) {
        double t = (double)i / size;
        if (t < 0.25) {
            table[i] = 4.0 * t;
        } else if (t < 0.75) {
            table[i] = 2.0 - 4.0 * t;
        } else {
            table[i] = 4.0 * t - 4.0;
        }
    }
} 