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

//logic connection blocks
// Input connections for oscillators 1-4
// Configuration for input connections
const inputConnectionsConfig = [
    // Oscillator input connections (1-4)
    ...Array(4).fill(null).map((_, i) => ({
        containerId: `#input-container${i+1}`,
        columns: 2,
        defaultState: i
    })),
    // Logic block input connections (5-6) 
    ...Array(2).fill(null).map((_, i) => ({
        containerId: `#input-container${i+5}`,
        columns: 4,
        defaultState: i+4
    }))
];

// Create all input connections
const inputConnections = inputConnectionsConfig.map(config => {
    const connection = new LogicBlockControl(config.containerId, {
        labels: ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'],
        columns: config.columns,
        mode: 'single',
        onChange: (index, active) => {
            console.log(`Block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
        }
    });
    connection.setState(config.defaultState, true);
    return connection;
});

// Logic block type selection
// Logic block controls configuration
const logicBlocksConfig = Array(3).fill(null).map((_, index) => ({
    id: `#logic-block-container${index + 1}`,
    labels: ['AND', 'NAND', 'OR', 'NOR', 'XOR', 'XNOR', 'OFF'],
    columns: index === 2 ? 4 : 2
}));

// Create logic block controls
const logicBlockControls = logicBlocksConfig.map((config, index) => {
    const control = new LogicBlockControl(config.id, {
        labels: config.labels,
        columns: config.columns,
        mode: 'single',
        onChange: (blockIndex, active) => {
            console.log(`Logic block ${blockIndex + 1} is now ${active ? 'active' : 'inactive'}`);
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