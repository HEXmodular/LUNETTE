// Web Audio API
// make room reverb using two delay nodes
// after each delay node add allpass filters using BiquadFilterNode
// summ allpass filters outputs
// add lowpass filter to summ output
// add feedback to input of reverb

class ReverbProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // Initialize buffers for delays
        this.delayBuffer1 = new Float32Array(48000); // 1 second at 48kHz
        this.delayBuffer2 = new Float32Array(48000);
        this.delayIndex1 = 0;
        this.delayIndex2 = 0;
        
        // Initialize filter states
        this.filterStates = {
            allpass1: { x1: 0, y1: 0 },
            allpass2: { x1: 0, y1: 0 },
            allpass3: { x1: 0, y1: 0 },
            allpass4: { x1: 0, y1: 0 },
            lowpass: { x1: 0, y1: 0 }
        };
        
        // Default parameters
        this.parameters = {
            delayTime1: 0.1,
            delayTime2: 0.15,
            allpassFreq1: 1000,
            allpassFreq2: 2000,
            allpassFreq3: 3000,
            allpassFreq4: 4000,
            lowpassFreq: 2000,
            feedbackGain: 0.5
        };
        
        // Calculate delay buffer sizes
        this.delaySize1 = Math.floor(this.parameters.delayTime1 * sampleRate);
        this.delaySize2 = Math.floor(this.parameters.delayTime2 * sampleRate);
        
        // Handle parameter updates from main thread
        this.port.onmessage = (event) => {
            if (event.data.type === 'parameters') {
                this.parameters = { ...this.parameters, ...event.data.parameters };
                this.delaySize1 = Math.floor(this.parameters.delayTime1 * sampleRate);
                this.delaySize2 = Math.floor(this.parameters.delayTime2 * sampleRate);
            }
        };
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        
        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];
            
            for (let i = 0; i < inputChannel.length; i++) {
                // Process input through delays
                const delayed1 = this.delayBuffer1[this.delayIndex1];
                const delayed2 = this.delayBuffer2[this.delayIndex2];
                
                // Update delay buffers
                this.delayBuffer1[this.delayIndex1] = inputChannel[i];
                this.delayBuffer2[this.delayIndex2] = inputChannel[i];
                
                // Update delay indices
                this.delayIndex1 = (this.delayIndex1 + 1) % this.delaySize1;
                this.delayIndex2 = (this.delayIndex2 + 1) % this.delaySize2;
                
                // Process through allpass filters
                const allpassOut1 = this.processAllpass(delayed1, this.parameters.allpassFreq1, this.filterStates.allpass1);
                const allpassOut2 = this.processAllpass(delayed2, this.parameters.allpassFreq2, this.filterStates.allpass2);
                const allpassOut3 = this.processAllpass(allpassOut1, this.parameters.allpassFreq3, this.filterStates.allpass3);
                const allpassOut4 = this.processAllpass(allpassOut2, this.parameters.allpassFreq4, this.filterStates.allpass4);
                
                // Sum allpass outputs
                const summed = allpassOut3 + allpassOut4;
                
                // Process through lowpass filter
                const lowpassed = this.processLowpass(summed, this.parameters.lowpassFreq, this.filterStates.lowpass);
                
                // Apply feedback
                const feedback = lowpassed * this.parameters.feedbackGain;
                
                // Mix dry and wet signals
                outputChannel[i] = inputChannel[i] + lowpassed;
            }
        }
        
        return true;
    }
}

// Register the processor
registerProcessor('reverb-processor', ReverbProcessor);

// Helper class for the main thread
class ReverbWorklet {
    constructor(audioContext) {
        this.context = audioContext;
        this.node = null;
        this.filters = {
            allpass1: this.context.createBiquadFilter(),
            allpass2: this.context.createBiquadFilter(),
            allpass3: this.context.createBiquadFilter(),
            allpass4: this.context.createBiquadFilter(),
            lowpass: this.context.createBiquadFilter()
        };
        this.init();
    }
    
    async init() {
        await this.context.audioWorklet.addModule('audio-effects.js');
        this.node = new AudioWorkletNode(this.context, 'reverb-processor');
        
        // Configure filters
        this.filters.allpass1.type = 'allpass';
        this.filters.allpass2.type = 'allpass';
        this.filters.allpass3.type = 'allpass';
        this.filters.allpass4.type = 'allpass';
        this.filters.lowpass.type = 'lowpass';
        
        // Connect filters in series
        this.filters.allpass1.connect(this.filters.allpass3);
        this.filters.allpass2.connect(this.filters.allpass4);
        this.filters.allpass3.connect(this.filters.lowpass);
        this.filters.allpass4.connect(this.filters.lowpass);
    }
    
    setParameters(params) {
        if (this.node) {
            this.node.port.postMessage({
                type: 'parameters',
                parameters: params
            });
            
            // Update filter parameters
            if (params.allpassFreq1) this.filters.allpass1.frequency.value = params.allpassFreq1;
            if (params.allpassFreq2) this.filters.allpass2.frequency.value = params.allpassFreq2;
            if (params.allpassFreq3) this.filters.allpass3.frequency.value = params.allpassFreq3;
            if (params.allpassFreq4) this.filters.allpass4.frequency.value = params.allpassFreq4;
            if (params.lowpassFreq) this.filters.lowpass.frequency.value = params.lowpassFreq;
        }
    }
    
    connect(source) {
        if (this.node) {
            source.connect(this.filters.allpass1);
            source.connect(this.filters.allpass2);
            this.filters.lowpass.connect(this.node);
            return this.node;
        }
        return null;
    }
    
    disconnect() {
        if (this.node) {
            this.node.disconnect();
            Object.values(this.filters).forEach(filter => filter.disconnect());
        }
    }
}

export default ReverbWorklet;









