// Initialize audio player
// const audioPlayer = new AudioStreamPlayer();

// // Audio control elements
// const startButton = document.getElementById('startAudio');
// const stopButton = document.getElementById('stopAudio');
// const volumeSlider = document.getElementById('volume');
// const volumeValue = document.getElementById('volumeValue');

// // Audio control event listeners
// startButton.addEventListener('click', async () => {
//     const started = await audioPlayer.start();
//     if (started) {
//         startButton.disabled = true;
//         stopButton.disabled = false;
//     }
// });

// stopButton.addEventListener('click', () => {
//     audioPlayer.stop();
//     startButton.disabled = false;
//     stopButton.disabled = true;
// });

// volumeSlider.addEventListener('input', (e) => {
//     const value = e.target.value;
//     audioPlayer.setVolume(value / 100);
//     volumeValue.textContent = `${value}%`;
// });

// // Initialize stop button as disabled
// stopButton.disabled = true;

// Initialize WebSocket connection
const ws = new WebSocket('/ws');
// const ws = {};
const audioContext = new AudioContext();
let audioWorkletNode = null;

// Create start audio button
const startAudioButton = document.createElement('button');
startAudioButton.textContent = 'Start Audio';
startAudioButton.id = 'startAudioButton';
document.body.insertBefore(startAudioButton, document.body.firstChild);

// setupAudioWorklet();

// Initialize Web Audio API
async function initAudio() {
    try {
            console.log('initAudio', audioContext);
            // Load and register our audio worklet
            
            await audioContext.audioWorklet.addModule('/audio-worklet.js');
            console.log('AudioWorklet module loaded.');
            
            // Create audio worklet node
            audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-processor');
            audioWorkletNode.connect(audioContext.destination);
            
            // Hide the start button once audio is initialized
            startAudioButton.style.display = 'none';
        
    } catch (error) {
        console.error('Failed to initialize audio:', error);
    }
}

// Add click handler for the start button
startAudioButton.addEventListener('click', initAudio);

ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = async (event) => {
    // if (!audioContext || !audioWorkletNode) {
    //     await initAudio();
    // }
    
    if (event.data instanceof Blob) {
        // Convert blob to array buffer
        const arrayBuffer = await event.data.arrayBuffer();
        const int8Array = new Int8Array(arrayBuffer);
        
        // Convert int8 samples (-128 to 127) to float32 (-1.0 to 1.0)
        const float32Array = new Float32Array(int8Array.length);
        for (let i = 0; i < int8Array.length; i++) {
            float32Array[i] = int8Array[i] / 128.0;
        }
        
        // Send audio data to the worklet
        audioWorkletNode.port.postMessage({
            audioData: float32Array,
            sampleRate: 10000 // ESP32 sample rate
        });
    }
};

ws.onclose = () => {
    console.log('Disconnected from WebSocket server');
};

function updateOscillator(oscillator_id, value) {
    // Only send if debounce timer expired
    if (!updateOscillator.debounceTimer) {
        
        // Set debounce timer
        updateOscillator.debounceTimer = setTimeout(() => {
            updateOscillator.debounceTimer = null;
        }, 1000);

        fetch('/api/oscillator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                oscillator_id: oscillator_id,
                frequency: value,
                amplitude: 127,
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error updating oscillator:', error);
        });
    }
}

function updateLogicBlock(config) {
    const { serverId, type,  conection1, conection2} = config;
    const data = {logic_block_id: serverId, operation_type: type, conection1: conection1.conectionId, conection2: conection2.conectionId};

    fetch('/api/logical-ops', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
}

//oscillators control blocks
// Create oscillator controls
const oscillatorControls = Array(4).fill(null).map((_, i) => {
    return new OscillatorControl(`oscillatorControl${i+1}`, `OSC ${i+1}`, {
        onChange: (frequency) => {
            updateOscillator(i, frequency);
        },
        showLabel: i === 0, // Only show labels for first oscillator
        showHeader: i === 0 // Only show header for first oscillator
    });
});


const logicBlockTypes = ['AND', 'NAND', 'OR', 'NOR', 'XOR', 'XNOR', 'OFF'];
const logicConnectionsTypes = ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'];

//logic connection blocks
// Input connections for oscillators 1-4
// Configuration for input connections
const inputConnectionsConfig = [
    // Oscillator input connections (1-4)
    ...Array(4).fill(null).map((_, i) => ({
        containerId: `#input-container${i+1}`,
        columns: 2,
        parentId: [0, 0, 1, 1][i],
        conectionId: logicConnectionsTypes[i], // ie value of the connection
        defaultState: i
    })),
    // Logic block input connections (5-6) 
    ...Array(2).fill(null).map((_, i) => ({
        containerId: `#input-container${i+5}`,
        columns: 4,
        parentId: [2, 2][i],
        conectionId: logicConnectionsTypes[i+4], // ie value of the connection
        defaultState: i+4
    }))
];

 // logick_block_id, logic_block_type, input_1, input_2
// Logic block type selection
// Logic block controls configuration
const logicBlocksConfig = Array(3).fill(null).map((_, index) => ({
    id: `#logic-block-container${index + 1}`,
    labels: logicBlockTypes,
    columns: index === 2 ? 4 : 2,
    serverId: index,
    type: logicBlockTypes[0],
    conection1:  inputConnectionsConfig[index*2],
    conection2:  inputConnectionsConfig[index*2 + 1],
}));


// Create all input connections
const inputConnections = inputConnectionsConfig.map((config, index) => {
    const connection = new LogicBlockControl(config.containerId, {
        id: index,
        labels: logicConnectionsTypes,
        columns: config.columns,
        mode: 'single',
        onChange: (inputConnectionId, selectedElementIndex, active) => {
            let {parentId} = inputConnectionsConfig[inputConnectionId];
            inputConnectionsConfig[inputConnectionId].conectionId = logicConnectionsTypes[selectedElementIndex];

            updateLogicBlock(logicBlocksConfig[parentId]);
        }
    });
    connection.setState(config.defaultState, true);
    return connection;
});


// Create logic block controls
const logicBlockControls = logicBlocksConfig.map((config, index) => {
    const control = new LogicBlockControl(config.id, {
        id: config.serverId,
        labels: config.labels,
        columns: config.columns,
        mode: 'single',
        onChange: (id, index, active) => {
            logicBlocksConfig[id].type = logicBlockTypes[index];
            // const id = logicBlocksConfig[id].id;

            updateLogicBlock(logicBlocksConfig[id]);
            console.log(`Logic block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
        }
    });
    
    control.setState(0, true);
    return control;
});

// const [logicBlockControl1, logicBlockControl2, logicBlockControl3] = logicBlockControls;


//mixer block
const mixerBlockControl = new LogicBlockControl('#mixer-block-container1', {
    labels: ['1', '2', 'L1', 'L2', 'L3', 'OFF', '3', '4'],
    columns: 8,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Mixer block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

mixerBlockControl.setState(4, true);