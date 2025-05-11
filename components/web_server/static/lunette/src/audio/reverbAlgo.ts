import { useEffect, useRef } from 'react';
import reverbWorkletUrl from '@worklets/reverb-algo-worklet.js?url';

interface ReverbParameters {
    delayTime1: number;
    delayTime2: number;
    allpassFreq1: number;
    allpassFreq2: number;
    allpassFreq3: number;
    allpassFreq4: number;
    lowpassFreq: number;
    feedbackGain: number;
}

export const useReverbAlgo = (context: AudioContext) => {
    const workletNode = useRef<AudioWorkletNode | null>(null);

    useEffect(() => {
        const init = async () => {
            await context.audioWorklet.addModule(reverbWorkletUrl);
            console.log('ReverbWorklet module loaded.');
            // Initialize the worklet node
            workletNode.current = new AudioWorkletNode(context, 'reverb-processor');
        }
        init();
        
        // Cleanup on unmount
        return () => {
            if (workletNode.current) {
                workletNode.current.disconnect();
            }
        };
    }, [context]);

    const setParameters = (params: ReverbParameters) => {
        if (workletNode.current) {
            workletNode.current.port.postMessage({
                type: 'setParameters',
                params
            });
        }
    };

    return {
        reverbAlgoNode: workletNode.current,
        setReverbAlgoParameters: setParameters
    };
}; 

export default useReverbAlgo;