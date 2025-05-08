import React, { useState, useCallback } from 'react';
import ValueControl from '@controls/value-control/value-control'
import './oscillator-control.css';

interface OscillatorControlProps {
    header?: string;
    showHeader?: boolean;
    showLabel?: boolean;
    onChange?: (frequency: number) => void;
}

const OscillatorControl: React.FC<OscillatorControlProps> = ({
    header = 'Oscillator',
    showHeader = true,
    showLabel = true,
    onChange
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    // const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // const getNoteDisplay = useCallback((midiNote: number) => {
    //     const octave = Math.floor(midiNote / 12) - 1;
    //     const noteName = noteNames[midiNote % 12];
    //     return `${noteName}${octave}`;
    // }, [noteNames]);

    const frequencyToMidiNote = useCallback((frequency: number) => {
        return Math.round(12 * Math.log2(frequency/440) + 69);
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
            <ValueControl
                id="frequency"
                label="Frequency (Hz)"
                min={20}
                max={2000}
                initialValue={440}
                onChange={handleFrequencyChange}
                // formatValue={(value) => `${Math.round(value)} Hz`}
                showLabel={showLabel}
            />
            <ValueControl
                id="note"
                label="Note"
                min={0}
                max={127}
                initialValue={69}
                onChange={handleNoteChange}
                // formatValue={getNoteDisplay}
                showLabel={showLabel}
            />
        </div>
    );
};

export default OscillatorControl;