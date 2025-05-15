import { useEffect, useRef } from 'react';

export interface ReverbParameters {
    delayTime1: number;
    delayTime2: number;
    allpassFreq1: number;
    allpassFreq2: number;
    allpassFreq3: number;
    allpassFreq4: number;
    // decayTime: number;
    feedbackGain: number;
    // damping: number;
    lowpassFreq: number;
    wetDryMix: number;
}

// Предполагается, что вы работаете в среде, где доступны типы Web Audio API (например, в браузере или с соответствующими @types)

class AlgorithmicReverb {
    private context: AudioContext;
    private inputNode: GainNode;  // Узел, через который звук входит в ревербератор
    private outputNode: GainNode; // Узел, через который обработанный звук выходит

    // Внутренние узлы для реализации алгоритма реверберации
    // (Это пример, реальный алгоритм потребует гораздо большего!)
    private delayNode1: DelayNode;
    private delayNode2: DelayNode;
    private filterNode: BiquadFilterNode;
    private feedbackGainNode: GainNode;
    private dryGainNode: GainNode; // Для оригинального (сухого) сигнала
    private wetGainNode: GainNode; // Для обработанного (влажного) сигнала
    private allpassFilter1: BiquadFilterNode;
    private allpassFilter2: BiquadFilterNode;
    private allpassFilter3: BiquadFilterNode;
    private allpassFilter4: BiquadFilterNode;
    private channelMerger: ChannelMergerNode;
    // Параметры ревербератора
    private _decayTime: number = 2.0; // Время затухания по умолчанию
    private _lowpassFreq: number = 8000; // Частота демпфирования по умолчанию
    private _wetDryMix: number = 0.5; // Соотношение влажный/сухой сигнал

    constructor(context: AudioContext, options?: { decayTime?: number, damping?: number, wetDryMix?: number }) {
        this.context = context;

        // 1. Создаем входной и выходной узлы обертки
        this.inputNode = this.context.createGain();
        this.outputNode = this.context.createGain();

        // Узлы для разделения сухого и влажного сигналов
        this.dryGainNode = this.context.createGain();
        this.wetGainNode = this.context.createGain();

        // Соединяем входной узел на выход сухого сигнала
        this.inputNode.connect(this.dryGainNode); 


        // 2. Создаем внутренние узлы для алгоритма реверберации
        // (Пример простой схемы: вход -> влажный гейн -> задержка1 -> фильтр -> гейн обратной связи -> задержка2 -> гейн обратной связи -> ... -> гейн обратной связи -> влажный гейн -> выход)
        // Здесь очень упрощенная схема только для демонстрации связей
        this.delayNode1 = this.context.createDelay(10);
        this.delayNode2 = this.context.createDelay(10);
        this.filterNode = this.context.createBiquadFilter();
        this.filterNode.type = 'lowpass'; // Фильтр для демпфирования

        this.allpassFilter1 = this.context.createBiquadFilter();
        this.allpassFilter2 = this.context.createBiquadFilter();
        this.allpassFilter3 = this.context.createBiquadFilter();
        this.allpassFilter4 = this.context.createBiquadFilter();

        this.allpassFilter1.type = 'allpass';
        this.allpassFilter2.type = 'allpass';
        this.allpassFilter3.type = 'allpass';
        this.allpassFilter4.type = 'allpass';

        this.feedbackGainNode = this.context.createGain(); // Гейн для обратной связи
        this.feedbackGainNode.gain.setValueAtTime(0.99, this.context.currentTime);

        this.channelMerger = this.context.createChannelMerger(2);

        this.inputNode.connect(this.wetGainNode); 
        this.wetGainNode.connect(this.feedbackGainNode);

        // 3. Соединяем внутренние узлы в соответствии с алгоритмом
        // Очень упрощенный пример обратной связи
        this.feedbackGainNode.connect(this.allpassFilter1);
        this.allpassFilter1.connect(this.allpassFilter2);
        this.allpassFilter2.connect(this.delayNode1);
        this.delayNode1.connect(this.filterNode);

        this.feedbackGainNode.connect(this.allpassFilter3);
        this.allpassFilter3.connect(this.allpassFilter4);
        this.allpassFilter4.connect(this.delayNode2);
        this.delayNode2.connect(this.filterNode);
        
        // Создаем петлю обратной связи: выход последнего делая -> гейн обратной связи -> вход первого делая
        this.filterNode.connect(this.feedbackGainNode);

        // Соединяем обработанный (влажный) сигнал с выходом обертки
        this.filterNode.connect(this.outputNode);
        this.delayNode1.connect(this.channelMerger, 0, 0);
        this.delayNode2.connect(this.channelMerger, 0, 1);

        this.dryGainNode.connect(this.outputNode);

        // 4. Соединяем сухой и влажный сигналы на выходном узле
        // this.dryGainNode.connect(this.outputNode);
        // this.wetGainNode.connect(this.outputNode);
        // this.filterNode.connect(this.outputNode);


        // 5. Применяем начальные параметры из options
        // if (options?.decayTime !== undefined) {
        //      this.setDecayTime(options.decayTime);
        // } else {
        //      this.setDecayTime(this._decayTime); // Применить значение по умолчанию
        // }

        // if (options?.damping !== undefined) {
        //     this.setDamping(options.damping);
        // } else {
        //     this.setDamping(this._dampingFrequency); // Применить значение по умолчанию
        // }

         if (options?.wetDryMix !== undefined) {
            this.setWetDryMix(options.wetDryMix);
        } else {
            this.setWetDryMix(this._wetDryMix); // Применить значение по умолчанию
        }

        // Установите начальные значения задержек (это критично для алгоритма)
        // Эти значения зависят от конкретного алгоритма реверберации
        this.delayNode1.delayTime.setValueAtTime(2, this.context.currentTime); // 50 ms
        this.delayNode2.delayTime.setValueAtTime(3, this.context.currentTime); // 70 ms
         // ... установите другие времена задержек
    }

    // 6. Методы для подключения/отключения обертки в общий аудиограф
    connect(destination: AudioNode): this {
        console.log('ReverbAlgo connect', destination);
        this.outputNode.connect(destination);
        return this;
    }

    connectParam(destination: AudioParam): this {
        this.outputNode.connect(destination);
        return this;
    }

    disconnect(): void {
        this.outputNode.disconnect();
    }

    disconnectFrom(destination: AudioNode): void {
        this.outputNode.disconnect(destination);
    }

    disconnectFromParam(destination: AudioParam): void {
        this.outputNode.disconnect(destination);
    }

    // 7. Методы для управления параметрами ревербератора
    setDecayTime(seconds: number): void {
        this._decayTime = seconds;
        const totalLoopDelay = this.delayNode1.delayTime.value + this.delayNode2.delayTime.value;
        const feedbackGain = Math.pow(0.001, (totalLoopDelay / seconds));
        this.feedbackGainNode.gain.setValueAtTime(feedbackGain, this.context.currentTime);
    }

    setFeedbackGain(gain: number): void {
        this.feedbackGainNode.gain.setValueAtTime(gain, this.context.currentTime);
    }

    getFeedbackGain(): number {
        return this.feedbackGainNode.gain.value;
    }

    getDecayTime(): number {
        return this._decayTime;
    }

    setLowpassFreq(frequency: number): void {
        this._lowpassFreq = frequency;
        this.filterNode.frequency.setValueAtTime(frequency, this.context.currentTime);
    }

    getLowpassFreq(): number {
        return this._lowpassFreq;
    }

    setWetDryMix(value: number): void {
        this._wetDryMix = Math.max(0, Math.min(1, value));
        this.dryGainNode.gain.setValueAtTime(1.0 - this._wetDryMix, this.context.currentTime);
        this.wetGainNode.gain.setValueAtTime(this._wetDryMix, this.context.currentTime);
    }

    getWetDryMix(): number {
        return this._wetDryMix;
    }

    setDelayTime1(time: number): void {
        this.delayNode1.delayTime.setValueAtTime(time, this.context.currentTime);
    }

    setDelayTime2(time: number): void {
        this.delayNode2.delayTime.setValueAtTime(time, this.context.currentTime);
    }

    setAllpassFreq1(freq: number): void {
        this.allpassFilter1.frequency.setValueAtTime(freq, this.context.currentTime);
    }

    setAllpassFreq2(freq: number): void {
        this.allpassFilter2.frequency.setValueAtTime(freq, this.context.currentTime);
    }

    setAllpassFreq3(freq: number): void {
        this.allpassFilter3.frequency.setValueAtTime(freq, this.context.currentTime);
    }

    setAllpassFreq4(freq: number): void {
        this.allpassFilter4.frequency.setValueAtTime(freq, this.context.currentTime);
    }

    setAllParameters(params: ReverbParameters): void {
        this.setDelayTime1(params.delayTime1);
        this.setDelayTime2(params.delayTime2);
        this.setAllpassFreq1(params.allpassFreq1);
        this.setAllpassFreq2(params.allpassFreq2);
        this.setAllpassFreq3(params.allpassFreq3);
        this.setAllpassFreq4(params.allpassFreq4);
        // this.setDecayTime(params.decayTime);
        this.setFeedbackGain(params.feedbackGain);
        // this.setDamping(params.damping);
        this.setLowpassFreq(params.lowpassFreq);
        this.setWetDryMix(params.wetDryMix);
    }

    // Опционально: предоставить прямой доступ к входному и выходному узлам
    get input(): AudioNode {
        return this.inputNode;
    }

    get output(): AudioNode {
        return this.outputNode;
    }

    // Опционально: метод очистки ресурсов
    destroy(): void {
        // Отключить все внутренние соединения, если это необходимо (хотя сборщик мусора обычно справляется)
        // Важно, если есть сложные петли, которые могут удерживать ссылки.
        // Проще всего просто убедиться, что входной и выходной узлы отключены от внешнего графа.
        this.disconnect(); // Отключаем от внешнего графа
        // Отключите внутренние соединения, если нужно явно
        this.inputNode.disconnect();
        this.dryGainNode.disconnect();
        this.wetGainNode.disconnect();
        this.delayNode1.disconnect();
        this.delayNode2.disconnect();
        this.filterNode.disconnect();
        this.feedbackGainNode.disconnect();
        this.allpassFilter1.disconnect();
        this.allpassFilter2.disconnect();
        this.allpassFilter3.disconnect();
        this.allpassFilter4.disconnect();
        // Установите ссылки в null, чтобы помочь сборщику мусора
        // this.inputNode = null; и т.д. (в TypeScript нужно аккуратно с типами)
    }
}


export const useReverbAlgo = (context: AudioContext | null) => {
    const reverbRef = useRef<AlgorithmicReverb | null>(null);

    useEffect(() => {
        if (!context) {
            console.error('ReverbAlgo: Audio context is not initialized');
            return;
        }

        reverbRef.current = new AlgorithmicReverb(context);

        return () => {
            if (reverbRef.current) {
                reverbRef.current.destroy();
                reverbRef.current = null;
            }
        };
    }, [context]);

    const setParameters = (params: ReverbParameters) => {
        if (reverbRef.current) {
            reverbRef.current.setAllParameters(params);
        }
    };

    return {
        reverbAlgoNode: reverbRef.current,
        setReverbAlgoParameters: setParameters
    };
}; 

export default useReverbAlgo;