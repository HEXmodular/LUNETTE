import { BaseApi } from './baseApi';

interface OscillatorConfig {
    oscillator_id: number;
    frequency: number;
    amplitude: number;
}

const useOscillatorApi = () => {
    const updateOscillator = async (config: OscillatorConfig): Promise<void> => {
        return BaseApi.post('oscillator', config);
    };

    return {
        updateOscillator
    };
};

export default useOscillatorApi;