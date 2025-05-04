#include "oscillator.h"
#include <math.h>
#include <stdbool.h>

#define TWO_PI 6.28318530717958647692
#define DEFAULT_SAMPLE_RATE 100000.0

double oscillator_calculate_phase_increment(Oscillator* osc) {
    return (double)WAVETABLE_SIZE * osc->frequency / osc->sample_rate;
}

void oscillator_init(Oscillator* osc, double frequency, double amplitude, oscillator_type_t type) {
    if (!osc) return;
    
    osc->frequency = frequency;
    osc->amplitude = amplitude;
    osc->phase_increment = oscillator_calculate_phase_increment(osc);
    osc->phase = 0.0;
    osc->table_index = 0;
    osc->sample_rate = DEFAULT_SAMPLE_RATE;
    osc->type = type;
    osc->result = 0.0;
    osc->result_bool = false;
    
    // Initialize with sine wave by default
    if (type == OSCILLATOR_TYPE_SINE) {
        generate_sine_wavetable(osc->wavetable, WAVETABLE_SIZE);
    } else if (type == OSCILLATOR_TYPE_SQUARE) {
        generate_square_wavetable(osc->wavetable, WAVETABLE_SIZE);
    } else if (type == OSCILLATOR_TYPE_SAWTOOTH) {
        generate_sawtooth_wavetable(osc->wavetable, WAVETABLE_SIZE);
    } else if (type == OSCILLATOR_TYPE_TRIANGLE) {
        generate_triangle_wavetable(osc->wavetable, WAVETABLE_SIZE);
    }
}

void oscillator_init_wavetable(Oscillator* osc, const double* waveform, int size) {
    if (!osc || !waveform) return;
    
    if (size > WAVETABLE_SIZE) size = WAVETABLE_SIZE;
    for (int i = 0; i < size; i++) {
        osc->wavetable[i] = waveform[i];
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

bool oscillator_next_bool(Oscillator* osc) {
    if (!osc) return false;

    // Get sample from wavetable
    bool sample = osc->wavetable[osc->table_index] > 0.0;

    // Update table index based on frequency
    osc->table_index += (int)(osc->phase_increment);
    
    // Keep index in range
    if (osc->table_index >= WAVETABLE_SIZE) {
        osc->table_index -= WAVETABLE_SIZE;
        osc->phase_increment -= WAVETABLE_SIZE;
    }

    return sample;
}

double oscillator_next(Oscillator* osc) {
    if (!osc) return 0.0;
    
    // Get sample from wavetable
    double sample = osc->amplitude * osc->wavetable[osc->table_index];
    
    // Update table index based on frequency
    osc->table_index += (int)(osc->phase_increment);
    
    // Keep index in range
    if (osc->table_index >= WAVETABLE_SIZE) {
        osc->table_index -= WAVETABLE_SIZE;
        osc->phase_increment -= WAVETABLE_SIZE;
    }
    
    // Update result based on sample value
    osc->result = sample > 0.0;
    
    return sample;
}

void oscillator_set_frequency(Oscillator* osc, double frequency) {
    if (!osc) return;
    osc->frequency = frequency;
    osc->phase_increment = oscillator_calculate_phase_increment(osc);
}

void oscillator_set_amplitude(Oscillator* osc, double amplitude) {
    if (!osc) return;
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