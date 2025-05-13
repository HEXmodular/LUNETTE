import React, { useState, useCallback, useEffect } from 'react';
import ValueControl from '@controls/value-control/value-control'
import './oscillator-control.css';

import type { OscillatorConfig } from '@api/oscillatorApi'

interface OscillatorControlProps {
    header?: string;
    showHeader?: boolean;
    showLabel?: boolean;
    config?: OscillatorConfig;
    onChange?: (frequency: number) => void;
}

const OscillatorControl: React.FC<OscillatorControlProps> = ({
    header = 'Oscillator',
    showHeader = false,
    showLabel = false,
    config,
    onChange
}) => {
    const [frequency, setFrequency] = useState(config?.frequency ?? 440);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setFrequency(config?.frequency ?? 440);
    }, [config]);

    // const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // const getNoteDisplay = useCallback((midiNote: number) => {
    //     const octave = Math.floor(midiNote / 12) - 1;
    //     const noteName = noteNames[midiNote % 12];
    //     return `${noteName}${octave}`;
    // }, [noteNames]);

    const frequencyToMidiNote = useCallback((frequency: number) => {
        return Math.round(12 * Math.log2(frequency / 440) + 69);
    }, []);

    const midiNoteToFrequency = useCallback((note: number) => {
        return 440 * Math.pow(2, (note - 69) / 12);
    }, []);

    const handleFrequencyChange = useCallback((frequency: number) => {
        if (isUpdating) return;
        setIsUpdating(true);

        // const midiNote = frequencyToMidiNote(frequency);
        onChange?.(Math.round(frequency));

        setIsUpdating(false);
    }, [isUpdating, frequencyToMidiNote, onChange]);

    const handleNoteChange = useCallback((note: number) => {
        if (isUpdating) return;
        setIsUpdating(true);

        const frequency = midiNoteToFrequency(note);
        onChange?.(Math.round(frequency));

        setIsUpdating(false);
    }, [isUpdating, midiNoteToFrequency, onChange]);

    return (
        <div className="oscillator-control">
            {showHeader && <div className="title">{header}</div>}
            <div className="oscillator-control-container">
                <ValueControl
                    id="frequency"
                    label="Frequency (Hz)"
                    min={20}
                    max={2000}
                    value={frequency}
                    onChange={handleFrequencyChange}
                    // formatValue={(value) => `${Math.round(value)} Hz`}
                    showLabel={showLabel}
                />
                <ValueControl
                    id="note"
                    label="Note"
                    min={0}
                    max={127}
                    value={frequencyToMidiNote(frequency)}
                    onChange={handleNoteChange}
                    // formatValue={getNoteDisplay}
                    showLabel={showLabel}
                />
            </div>
        </div>
    );
};

export default OscillatorControl;