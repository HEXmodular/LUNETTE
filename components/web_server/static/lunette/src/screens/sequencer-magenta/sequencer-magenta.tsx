import { Sequencer } from '@controls/sequencer-control/sequencer';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useOscillatorContext } from '@contexts/OscillatorContext';
import { getMIDINoteFrequency } from '@utils/noteFreq';
import { SequencerSelect } from './controls/sequencer-select';

import { SequencerSelectMenuBlock } from './controls/sequencer-select-menu-block';
import { Player } from './mmPlayer';

import './sequencer-magenta.css';
import { LiveMusicService } from './liveMusic';

declare global {
    var mm: any;
}

const MAPPING_8 = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 } as { [key: number]: number };
const MAPPING_4 = { 0: 0, 1: 2, 2: 5, 3: 7 } as { [key: number]: number };

const CONSTANTS = {
    NOTES_PER_OCTAVE: 12,
    WHITE_NOTES_PER_OCTAVE: 7,
    LOWEST_PIANO_KEY_MIDI_NOTE: 21,
    GENIE_CHECKPOINT: 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',
}

interface Prompt {
    readonly promptId: string;
    text: string;
    weight: number;
    cc: number;
    color: string;
  }

// TODO когда сбрасывать модель?
// семена?

const OCTAVES = 2;
const TEMPERATURE = 0.25;
//   const bonusNotes = OCTAVES > 6 ? 4 : 0;  // starts on an A, ends on a C.
const totalNotes = CONSTANTS.NOTES_PER_OCTAVE * OCTAVES; //+ bonusNotes; 
//   const totalWhiteNotes = CONSTANTS.WHITE_NOTES_PER_OCTAVE * OCTAVES //+ (bonusNotes - 1); 
// const keyWhitelist = Array(totalNotes).fill(0).map((x, i) => {
//     // if (OCTAVES > 6) return i;
//     // Starting 3 semitones up on small screens (on a C), and a whole octave up.
//     return i + 3 + CONSTANTS.NOTES_PER_OCTAVE;
// });

const gMajTwoOctaves = [
    22, 24, 26, 27, 29, 31, 33,
    34, 36, 38, 39, 41, 43, 45
];

const keyWhitelist = gMajTwoOctaves;

//   const note = genie.nextFromKeyWhitelist(BUTTON_MAPPING[0], keyWhitelist, TEMPERATURE);
//   const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + note;

const INITIAL_ACTIVE_NOTES = Array(8).fill(false).map((_, i) => [0, 2, 5, 7].includes(i));
const INITIAL_SEQUENCE_LENGTH = 16;







const SequencerMagenta: React.FC = () => {
    const BUTTON_MAPPING = MAPPING_4;

    const genieRef = useRef<any | null>(null);
    const sequencersRef = useRef<Sequencer[]>([]);
    const playerRef = useRef<Player | null>(null);

    // Add state for active notes and sequence length
    const [activeNotes, setActiveNotes] = useState<boolean[]>(INITIAL_ACTIVE_NOTES);
    const [sequenceLength, setSequenceLength] = useState<number>(INITIAL_SEQUENCE_LENGTH);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // Add menu state
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [menuData, setMenuData] = useState<{
        activeNotes: boolean[];
        temperature: number;
        steps: string;
    }>({
        activeNotes: INITIAL_ACTIVE_NOTES,
        temperature: 0.5,
        steps: INITIAL_SEQUENCE_LENGTH.toString()
    });

    // State for sequencer values and current step
    const [sequencerState, setSequencerState] = useState<{
        values: boolean[][],
        currentStep: number
    }>({
        values: Array(16).fill(false),
        currentStep: 0
    });

    const { oscillators, updateOscillator, isLoading: oscillatorsLoading } = useOscillatorContext();

    const updateOscillatorFrequency = (oscillator_id: number, frequency: number) => {
        updateOscillator({ oscillator_id, frequency, amplitude: 1.0 });
    }



    useEffect(() => {
        const prompts = new Map<string, Prompt>();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
        // audioAnalyser = new AudioAnalyser(this.audioContext);
        // this.audioAnalyser.node.connect(this.audioContext.destination);

        console.log("liveMusicService new", liveMusicService);
        if (liveMusicService) { return }
        liveMusicService = new LiveMusicService(
            "AIzaSyCt_3X9-uersas1gHUmFGFmOn9CjvmpVaQ",
            audioContext,
            {
                onPlaybackStateChange: (newState) => {
                    console.log("playbackStateChange", newState);
                    //   this.playbackState = newState;
                },
                onFilteredPrompt: (filteredPrompt) => {
                    console.log("filteredPrompt", filteredPrompt);
                    //   this.filteredPrompts = new Set([...this.filteredPrompts, filteredPrompt.text]);
                    //   this.toastMessage.show(filteredPrompt.filteredReason);
                    //   this.requestUpdate('filteredPrompts');
                },
                onSetupComplete: () => {
                    console.log("setup complete");
                    //   this.connectionError = false;
                    // if playback was loading due to initial connection, service will push 'playing'
                },
                onError: (errorMessage) => {
                    //   this.connectionError = true;
                    //   this.toastMessage.show(errorMessage);
                    console.error("error", errorMessage);
                    // Playback state is managed by the service and updated via onPlaybackStateChange
                },
                onClose: (message) => {
                    //   this.connectionError = true;
                    //   this.toastMessage.show(message);
                    console.error("error", message);
                    // Playback state is managed by the service
                },
                onOutputNodeChanged: (newNode) => () => { console.log("outputNodeChanged", newNode) },
            })

        const currentServiceOutputNode = liveMusicService.getOutputNode();
        currentServiceOutputNode.connect(audioContext.destination);

        (async () => {
            console.log("liveMusicService connect 1", liveMusicService);
            await liveMusicService.connect();
            
            if (liveMusicService.isConnected()) {
                const promptsToSend = [{text: "ambient", weight: 1, promptId: "test", cc: 0, color: "red"}]
              await liveMusicService.setWeightedPrompts(promptsToSend);

            } else {
              // this.playbackState = 'stopped'; // Reflect failed initial connection
              console.error("error", "failed to connect to live music service");
            }
        })();
          
        
        //   private getPromptsToSend() {
        //     return Array.from(this.prompts.values())
        //       .filter((p) => {
        //         return !this.filteredPrompts.has(p.text) && p.weight !== 0;
        //       })
        //   }
        
        //   private setSessionPrompts = throttle(async () => {
        //     const promptsToSend = this.getPromptsToSend();
        //     if (promptsToSend.length === 0) {
        //       this.toastMessage.show('There needs to be one active prompt to play.')
        //       this.liveMusicService.pause(); // Tell service to pause
        //       return;
        //     }
        //     await this.liveMusicService.setWeightedPrompts(promptsToSend);
        //   }, 200);
    }, []);

    // Initialize PianoGenie and Player
    useEffect(() => {
        if (!mm) return;

        // Initialize PianoGenie
        if (!genieRef.current) {
            const genie = new mm.PianoGenie(CONSTANTS.GENIE_CHECKPOINT);
            genieRef.current = genie;

            console.log('🧞‍♀️ initializing', genie);

            genie.initialize().then(() => {
                console.log('🧞‍♀️ ready!');
            });
        }

        // Initialize Player
        (async () => {
            playerRef.current = await new Player();
            setIsPlayerReady(true);
        })();


        // // Initialize player methods
        // const initPlayer = async () => {
        //     try {
        //         await player.loadSamples();
        //         console.log('Player initialized');
        //         setIsPlayerReady(true);
        //     } catch (err: unknown) {
        //         console.error('Failed to initialize player:', err);
        //     }
        // };

        // initPlayer();

        return () => {
            // if (playerRef.current) {
            //     playerRef.current.stopAll();
            // }
        };
    }, [mm]);

    // Separate effect for sequencer initialization and updates
    useEffect(() => {
        if (!genieRef.current || !playerRef.current || !isPlayerReady) return;

        const handleStepChange = (step: number) => {

            // const isActiveStep = sequencerState.values.find(row => row[step]);
            const activeRow = sequencerState.values.findIndex(row => row[step]);
            const isActiveStep = activeRow !== -1;
            const mapping = menuData.activeNotes
                .map((note, index) => [index, note])
                .filter(([_, note]) => note)
                .map(([index]) => index).reverse();



            if (isActiveStep) {
                const note = genieRef.current?.nextFromKeyWhitelist(mapping[activeRow], keyWhitelist, menuData.temperature);
                const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + note;
                console.log("genie", activeRow, step, pitch, mapping[activeRow], menuData);
                playerRef.current?.playNoteDown(pitch);
            }

            if (step === 15) {
                // console.log("resetting genie");
                // genieRef.current?.resetState();
            }

            setSequencerState(prev => ({
                ...prev,
                currentStep: step
            }));
        };

        if (sequencersRef.current?.length) {
            sequencersRef.current[0].onStepChange = (step) => handleStepChange(step);
        } else {
            sequencersRef.current = [new Sequencer({
                sequenceLength: 16,
                timeUnit: 1000,
                onStepChange: (step) => handleStepChange(step)
            })];

            sequencersRef.current[0].start();
        }

    }, [sequencerState, genieRef.current, playerRef.current, isPlayerReady, keyWhitelist]);

    const handleValueChange = (sequencerIndex: number, newValues: boolean[]) => {

    };

    const handleMenuClick = (index: number) => {
        // Toggle menu visibility
        setIsMenuOpen(prev => !prev);

        // If opening menu, load current state
        if (!isMenuOpen) {
            setMenuData({
                activeNotes: activeNotes,
                temperature: 0.5, // You might want to add state for this
                steps: sequenceLength.toString()
            });
        }
    };

    return (<>
        {isMenuOpen && (
            <SequencerSelectMenuBlock
                activeNotes={menuData.activeNotes}
                temperature={menuData.temperature}
                steps={menuData.steps as "8" | "16"}
                onNotesChange={(values) => {
                    console.log("values", values);
                    setActiveNotes(values);
                    setMenuData(prev => ({ ...prev, activeNotes: values }));
                }}
                onStepsChange={(value) => {
                    console.log("steps", value);
                    setSequenceLength(parseInt(value));
                    setMenuData(prev => ({ ...prev, steps: value }));
                }}
                onTemperatureChange={(value) => {
                    console.log("temperature", value);
                    setMenuData(prev => ({ ...prev, temperature: value }));
                }}
            />
        )}
        <div className="sequencer-container">
            {!isPlayerReady && <div className="loading">Loading player...</div>}
            <SequencerSelect
                label="Voice 1"
                rows={activeNotes?.filter(note => note).length}
                sequenceLength={sequenceLength}
                currentStep={sequencerState.currentStep}
                values={0}
                onMenuClick={() => handleMenuClick(0)}
                onChange={(values) => {
                    console.log("onChange", values);
                    setSequencerState(prev => ({
                        ...prev,
                        values: (values as unknown as boolean[])
                    }));
                }}
            />
        </div>
    </>
    );
};


export default SequencerMagenta;