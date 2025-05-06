class AudioStreamHandler {
    constructor() {
        this.eventSource = null;
        this.audioContext = null;
        this.isPlaying = false;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.audioContext.resume();
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
            throw error;
        }
    }

    start() {
        if (this.eventSource) {
            this.stop();
        }

        this.isPlaying = true;
        this.eventSource = new EventSource('/stream/audio');
        
        this.eventSource.addEventListener('audio', async (event) => {
            if (!this.isPlaying) return;

            try {
                // Convert hex string to ArrayBuffer
                const hexData = event.data;
                const arrayBuffer = new ArrayBuffer(hexData.length / 2);
                const uint8Array = new Uint8Array(arrayBuffer);
                
                for (let i = 0; i < hexData.length; i += 2) {
                    uint8Array[i/2] = parseInt(hexData.substr(i, 2), 16);
                }

                // Create audio buffer and play it
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.audioContext.destination);
                source.start(0);
            } catch (error) {
                console.error('Error processing audio data:', error);
            }
        });

        this.eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            this.stop();
            // Try to reconnect after a delay
            setTimeout(() => this.start(), 5000);
        };
    }

    stop() {
        this.isPlaying = false;
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

// Create and export instance
const audioHandler = new AudioStreamHandler();
export default audioHandler; 