const CONSTANTS = {
    NOTES_PER_OCTAVE: 12,
    WHITE_NOTES_PER_OCTAVE: 7,
    LOWEST_PIANO_KEY_MIDI_NOTE: 21,
    GENIE_CHECKPOINT: 'https://storage.googleapis.com/magentadata/js/checkpoints/piano_genie/model/epiano/stp_iq_auto_contour_dt_166006',
}

const OCTAVES = 8;

export class Player {
    private player: mm.SoundFontPlayer;

    constructor() {
      this.player = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
    }

    async initialize() {
      console.log("Player initializing samples..."); // For debugging
      const result = await this.loadAllSamples();
      console.log("Player samples loaded:", result); // For debugging
      return result; 
    }
    
    async loadAllSamples() {
      const seq = {notes:[]};
      for (let i = 0; i < CONSTANTS.NOTES_PER_OCTAVE * OCTAVES; i++) {
        seq.notes.push({pitch: CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + i});
      }
      await this.player.loadSamples(seq);
      return true
    }
    
    playNoteDown(pitch: number) {
      mm.Player.tone.context.resume();
      this.player.playNoteDown({pitch: pitch});
    }
    
    playNoteUp(pitch: number) {
      this.player.playNoteUp({pitch: pitch});
    }
}