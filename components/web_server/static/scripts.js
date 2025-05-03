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
const oscillatorControl1 = new OscillatorControl('oscillatorControl1', 'OSC 1-4', {
    onChange: (frequency) => {
        updateOscillator(0, frequency);
    },
});

const oscillatorControl2 = new OscillatorControl('oscillatorContro12', 'OSC 2', {
    onChange: (frequency) => {
        updateOscillator(1, frequency);
    },
    showLabel: false,  // Hide labels
    showHeader: false
});

const oscillatorControl3 = new OscillatorControl('oscillatorContro13', 'OSC 3', {
    onChange: (frequency) => {
        updateOscillator(2, frequency);
    },
    showLabel: false,  // Hide labels
    showHeader: false
});

const oscillatorControl4 = new OscillatorControl('oscillatorContro14', 'OSC 4', {
    onChange: (frequency) => {
        updateOscillator(3, frequency);
    },
    showLabel: false,  // Show labels
    showHeader: false
});

//logic connection blocks
const inputConnection1 = new LogicBlockControl('#input-container1', {
    labels: ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'],
    columns: 2,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

const inputConnection2 = new LogicBlockControl('#input-container2', {
    labels: ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'],
    columns: 2,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

const inputConnection3 = new LogicBlockControl('#input-container3', {
    labels: ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'],
    columns: 2,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

const inputConnection4 = new LogicBlockControl('#input-container4', {
    labels: ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'],
    columns: 2,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

const inputConnection5 = new LogicBlockControl('#input-container5', {
    labels: ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'],
    columns: 4,
    mode: 'single', 
    onChange: (index, active) => {
        console.log(`Block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

const inputConnection6 = new LogicBlockControl('#input-container6', {
    labels: ['1', '2', '3', '4', 'L1', 'L2', 'L3', 'OFF'],
    columns: 4,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

//logic blocks type selection
const logicBlockControl1 = new LogicBlockControl('#logic-block-container1', {
    labels: ['AND', 'NAND', 'XOR', 'XNOR', 'OR', 'NOR', 'OFF'],
    columns: 2,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Logic block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});

const logicBlockControl2 = new LogicBlockControl('#logic-block-container2', {
    labels: ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR', 'OFF'],
    columns: 2,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Logic block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
}); 

const logicBlockControl3 = new LogicBlockControl('#logic-block-container3', {
    labels: ['AND', 'NAND', 'OR', 'NOR', 'XOR',   'XNOR', 'OFF'],
    columns: 4,
    mode: 'single',
    onChange: (index, active) => {  
        console.log(`Logic block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});


//mixer block
const mixerBlockControl = new LogicBlockControl('#mixer-block-container1', {
    labels: ['1', '2', 'L1', 'L2', 'L3', 'OFF', '3', '4'],
    columns: 8,
    mode: 'single',
    onChange: (index, active) => {
        console.log(`Mixer block ${index + 1} is now ${active ? 'active' : 'inactive'}`);
    }
});