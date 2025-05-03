#ifndef API_H
#define API_H

#include <stdint.h>

// Data structure for oscillator
typedef struct {
    double frequency;
    double amplitude;

} oscillator_data_t;

// Global sensor data
extern oscillator_data_t oscillator_data[4];

// Function to update oscillator data
void update_oscillator_data(int oscillator_id, double freq, double amp);

#endif // API_DATA_H 