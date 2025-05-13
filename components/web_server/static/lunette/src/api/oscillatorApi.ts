import { BaseApi } from './baseApi';
import customDebounce from '@utils/customDebounce';

export interface OscillatorConfig {
    oscillator_id: number;
    frequency: number;
    amplitude: number;
}

interface OscillatorResponse {
    oscillators: OscillatorConfig[];
}

const useOscillatorApi = () => {
    const updateOscillator = customDebounce(async (config: OscillatorConfig) => {
        return await BaseApi.post('oscillator', config);
    }, 500, { maxWait: 1000 });

    const getOscillators = async () => {
        return await BaseApi.get<OscillatorResponse>('oscillators').then((data) => data.oscillators);
    };

    return {
        updateOscillator,
        getOscillators,
    };
};

export default useOscillatorApi;