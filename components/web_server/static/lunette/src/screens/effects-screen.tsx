// экран для управления эффектами
// использует контролы для упрпавления из папки controls

// для ревеербератора отдельный блок для управления параметрами, согласно его интерфейсу
// interface ReverbParameters {
//     delayTime1: number;
//     delayTime2: number;
//     allpassFreq1: number;
//     allpassFreq2: number;
//     allpassFreq3: number;
//     allpassFreq4: number;
//     decayTime: number;
//     damping: number;
//     wetDryMix: number;
// }

import React, { useState } from 'react';
import ValueControl from '@controls/value-control/value-control';
import { type ReverbParameters } from '@audio/reverbAlgo';

import './effects-screen.css';

interface EffectsScreenProps {
    setReverbAlgoParameters: (params: ReverbParameters) => void;
}    

const EffectsScreen: React.FC<EffectsScreenProps> = ({ 
    setReverbAlgoParameters 
}) => {
    const [reverbParams, setReverbParams] = useState<ReverbParameters>({
        delayTime1: 0.90,
        delayTime2: 0.60,
        allpassFreq1: 777,
        allpassFreq2: 888,
        allpassFreq3: 999,
        allpassFreq4: 666,
        // decayTime: 20.0,
        feedbackGain: 0.99,
        damping: 12000,
        wetDryMix: 0.99
    });

    // const { reverbAlgoNode, setReverbAlgoParameters } = useReverbAlgo(null);

    const handleParamChange = (param: keyof ReverbParameters, value: number) => {
        const newParams = { ...reverbParams, [param]: value };
        setReverbParams(newParams);
        setReverbAlgoParameters(newParams);
    };

    return (
        <div className="effects-screen">
            <div className="reverb-section">
                <h3>Reverb</h3>
                <div className="reverb-controls">
                    <div className="reverb-control-row cols-2">
                        <ValueControl
                            label="Delay Time"
                            min={0.01}
                            max={10.0}
                            formatValue={(value) => value.toFixed(2)}
                            value={reverbParams.delayTime1}
                            onChange={(value) => handleParamChange('delayTime1', value)}
                        />
                        <ValueControl
                            min={0.01}
                            max={10.0}
                            formatValue={(value) => value.toFixed(2)}
                            value={reverbParams.delayTime2}
                            onChange={(value) => handleParamChange('delayTime2', value)}
                        />
                    </div>

                    <div className="reverb-control-row cols-2">
                        <ValueControl
                            label="Allpass Freq"
                            min={500}
                            max={5000}
                            value={reverbParams.allpassFreq1}
                            onChange={(value) => handleParamChange('allpassFreq1', value)}
                        />
                        <ValueControl
                            min={500}
                            max={5000}
                            value={reverbParams.allpassFreq2}
                            onChange={(value) => handleParamChange('allpassFreq2', value)}
                        />
                    </div>

                    <div className="reverb-control-row cols-2">
                        <ValueControl
                            min={500}
                            max={5000}
                            value={reverbParams.allpassFreq3}
                            onChange={(value) => handleParamChange('allpassFreq3', value)}
                        />
                        <ValueControl
                            min={500}
                            max={5000}
                            value={reverbParams.allpassFreq4}
                            onChange={(value) => handleParamChange('allpassFreq4', value)}
                        />
                    </div>

                    <div className="reverb-control-row cols-2">
                        {/* <ValueControl
                            label="Decay Time"
                            min={0.1}
                            max={60.0}
                            value={reverbParams.decayTime}
                            onChange={(value) => handleParamChange('decayTime', value)}
                        /> */}
                        <ValueControl
                            label="Feedback Gain"
                            min={0.0}
                            max={2.0}
                            sensitivity={0.01}
                            formatValue={(value) => value.toFixed(2)}
                            value={reverbParams.feedbackGain}
                            onChange={(value) => handleParamChange('feedbackGain', value)}
                        />
                        <ValueControl
                            label="Damping"
                            min={1000}
                            max={20000}
                            value={reverbParams.damping}
                            onChange={(value) => handleParamChange('damping', value)}
                        />
                    </div>


                    <ValueControl
                        label="Wet/Dry Mix"
                        min={0}
                        max={1}
                        formatValue={(value) => value.toFixed(2)}
                        value={reverbParams.wetDryMix}
                        onChange={(value) => handleParamChange('wetDryMix', value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default EffectsScreen;
