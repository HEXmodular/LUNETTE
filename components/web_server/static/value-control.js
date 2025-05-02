// all controls lives here

class ValueControl {
    constructor(options = {}) {
        this.options = {
            min: 0,
            max: 100,
            initialValue: 50,
            onChange: null,
            formatValue: (value) => value.toString(),
            ...options
        };

        this.currentValue = this.options.initialValue;
        this.startY = 0;
        this.lastY = 0;
        this.isDragging = false;
        this.updateInterval = null;
        this.boundEventHandlers = {};

        this.init();
    }

    init() {
        this.createElements();
        this.addEventListeners();
    }

    createElements() {
        this.element = document.createElement('div');
        this.element.className = 'value-control';
        this.element.innerHTML = `
            <label for="${this.options.id}">${this.options.label}</label>
            <div class="control-container">
                <div class="value-display">${this.options.formatValue(this.currentValue)}</div>
                <div class="value-slider"></div>
            </div>
        `;
        
        this.display = this.element.querySelector('.value-display');
        this.slider = this.element.querySelector('.value-slider');
    }

    handleDragStart(y, control) {
        this.startY = y;
        this.lastY = y;
        this.isDragging = true;
        if (control) control.classList.add('active');
        this.startContinuousUpdate(this.startY, this.lastY);
    }

    handleDragEnd(control) {
        this.isDragging = false;
        if (control) control.classList.remove('active');
        this.stopContinuousUpdate();
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.handleDragStart(e.touches[0].clientY, this.slider);
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.lastY = e.touches[0].clientY;
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.handleDragEnd(this.slider);
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.handleDragStart(e.clientY, this.slider);
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.lastY = e.clientY;
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.handleDragEnd(this.slider);
    }

    addEventListeners() {
        // Bind event handlers to preserve 'this' context
        this.boundEventHandlers = {
            touchstart: (e) => this.handleTouchStart(e),
            touchmove: (e) => this.handleTouchMove(e),
            touchend: (e) => this.handleTouchEnd(e),
            touchcancel: (e) => this.handleTouchEnd(e),
            mousedown: (e) => this.handleMouseDown(e),
            mousemove: (e) => this.handleMouseMove(e),
            mouseup: (e) => this.handleMouseUp(e)
        };

        // Touch events
        this.element.addEventListener('touchstart', this.boundEventHandlers.touchstart);
        this.element.addEventListener('touchmove', this.boundEventHandlers.touchmove);
        this.element.addEventListener('touchend', this.boundEventHandlers.touchend);
        this.element.addEventListener('touchcancel', this.boundEventHandlers.touchcancel);
        
        // Mouse events
        this.element.addEventListener('mousedown', this.boundEventHandlers.mousedown);
        document.addEventListener('mousemove', this.boundEventHandlers.mousemove);
        document.addEventListener('mouseup', this.boundEventHandlers.mouseup);
    }

    removeEventListeners() {
        // Remove touch events
        this.element.removeEventListener('touchstart', this.boundEventHandlers.touchstart);
        this.element.removeEventListener('touchmove', this.boundEventHandlers.touchmove);
        this.element.removeEventListener('touchend', this.boundEventHandlers.touchend);
        this.element.removeEventListener('touchcancel', this.boundEventHandlers.touchcancel);
        
        // Remove mouse events
        this.element.removeEventListener('mousedown', this.boundEventHandlers.mousedown);
        document.removeEventListener('mousemove', this.boundEventHandlers.mousemove);
        document.removeEventListener('mouseup', this.boundEventHandlers.mouseup);
    }

    updateValue(newValue) {
        this.currentValue = Math.max(this.options.min, Math.min(this.options.max, newValue));
        this.display.textContent = this.options.formatValue(Math.round(this.currentValue));
        
        if (this.options.onChange) {
            this.options.onChange(this.currentValue);
        }
    }

    startContinuousUpdate(startY, lastY) {
        if (this.updateInterval) clearInterval(this.updateInterval);
        
        this.updateInterval = setInterval(() => {
            if (this.isDragging) {
                const deltaY = this.lastY - this.startY;
                const speed = Math.abs(deltaY) / 100;
                const change = deltaY > 0 ? -speed : speed;
                this.updateValue(this.currentValue + change);
            }
        }, 16);
    }

    stopContinuousUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Public API
    getValue() {
        return this.currentValue;
    }

    setValue(value) {
        this.updateValue(value);
    }

    mount(selector) {
        const container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (!container) {
            throw new Error(`Container element not found for selector: ${selector}`);
        }
        
        container.appendChild(this.element);
    }

    unmount() {
        this.stopContinuousUpdate();
        this.removeEventListeners();
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Oscillator Control
class OscillatorControl {
    constructor(containerId, header, options = {}) {
        this.container = document.getElementById(containerId);
        this.container.innerHTML = `<div class="title">${header}</div>`;
        
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
        
        this.options = {
            onChange: null,
            ...options
        };

        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.isUpdating = false;
        
        this.frequencyControl = new ValueControl({
            id: 'frequency',
            label: 'Frequency (Hz)',
            min: 20,
            max: 2000,
            initialValue: 440,
            onChange: (value) => this.onFrequencyChange(value),
            formatValue: (value) => `${Math.round(value)} Hz`
        });

        this.noteControl = new ValueControl({
            id: 'note',
            label: 'Note',
            min: 0,
            max: 127,
            initialValue: 69,
            onChange: (value) => this.onNoteChange(value),
            formatValue: (value) => this.getNoteDisplay(value)
        });

        this.init();
    }

    init() {
        this.frequencyControl.mount(this.container);
        this.noteControl.mount(this.container);
    }

    onFrequencyChange(frequency) {
        if (this.isUpdating) return;
        this.isUpdating = true;
        
        const midiNote = this.frequencyToMidiNote(frequency);
        this.noteControl.setValue(midiNote);
        
        if (this.options.onChange) {
            this.options.onChange(Math.round(frequency));
        }
        
        this.isUpdating = false;
    }

    onNoteChange(note) {
        if (this.isUpdating) return;
        this.isUpdating = true;
        
        const frequency = this.midiNoteToFrequency(note);
        this.frequencyControl.setValue(frequency);
        
        if (this.options.onChange) {
            this.options.onChange(Math.round(frequency));
        }
        
        this.isUpdating = false;
    }

    getNoteDisplay(midiNote) {
        const octave = Math.floor(midiNote / 12) - 1;
        const noteName = this.noteNames[midiNote % 12];
        return `${noteName}${octave}`;
    }

    frequencyToMidiNote(frequency) {
        return Math.round(12 * Math.log2(frequency/440) + 69);
    }

    midiNoteToFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }
}

// Oscillator Diagram
class OscillatorDiagram {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }

        this.connections = new Map();
        this.activeConnections = new Set();
        this.init();
        
        // Add resize listener to update connections when window size changes
        window.addEventListener('resize', () => this.updateConnections());
    }

    init() {
        this.createElements();
        this.createConnections();
    }

    createElements() {
        this.element = document.createElement('div');
        this.element.className = 'oscillator-diagram';
        
        const grid = document.createElement('div');
        grid.className = 'oscillator-grid';
        
        // Create 4 oscillator nodes
        for (let i = 1; i <= 4; i++) {
            const node = document.createElement('div');
            node.className = 'oscillator-node';
            node.dataset.id = `osc-${i}`;
            node.innerHTML = `<div class="title">Oscillator ${i}</div>`;
            grid.appendChild(node);
        }
        
        this.element.appendChild(grid);
        this.container.appendChild(this.element);
    }

    createConnections() {
        const nodes = this.element.querySelectorAll('.oscillator-node');
        const grid = this.element.querySelector('.oscillator-grid');
        
        // Create connections between nodes
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const line = document.createElement('div');
                line.className = 'connection-line';
                line.dataset.from = nodes[i].dataset.id;
                line.dataset.to = nodes[j].dataset.id;
                grid.appendChild(line);
                
                this.connections.set(`${nodes[i].dataset.id}-${nodes[j].dataset.id}`, {
                    line,
                    from: nodes[i],
                    to: nodes[j]
                });
            }
        }
        
        this.updateConnections();
    }

    updateConnections() {
        const grid = this.element.querySelector('.oscillator-grid');
        const gridRect = grid.getBoundingClientRect();
        
        this.connections.forEach((connection, key) => {
            const fromRect = connection.from.getBoundingClientRect();
            const toRect = connection.to.getBoundingClientRect();
            
            // Calculate connection line position and angle
            const fromX = fromRect.left + fromRect.width / 2 - gridRect.left;
            const fromY = fromRect.top + fromRect.height / 2 - gridRect.top;
            const toX = toRect.left + toRect.width / 2 - gridRect.left;
            const toY = toRect.top + toRect.height / 2 - gridRect.top;
            
            const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
            const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
            
            // Update line position and rotation
            connection.line.style.width = `${length}px`;
            connection.line.style.left = `${fromX}px`;
            connection.line.style.top = `${fromY}px`;
            connection.line.style.transform = `rotate(${angle}deg)`;
            
            // Update line visibility based on active state
            const isActive = this.activeConnections.has(key);
            connection.line.style.opacity = isActive ? '1' : '0.3';
        });
    }

    setConnection(fromId, toId, active = true) {
        const key = [fromId, toId].sort().join('-');
        const connection = this.connections.get(key);
        
        if (connection) {
            if (active) {
                connection.line.classList.add('active');
                connection.from.classList.add('active');
                connection.to.classList.add('active');
                this.activeConnections.add(key);
            } else {
                connection.line.classList.remove('active');
                connection.from.classList.remove('active');
                connection.to.classList.remove('active');
                this.activeConnections.delete(key);
            }
            // Update visual state after changing connection
            this.updateConnections();
        }
    }

    getActiveConnections() {
        return Array.from(this.activeConnections);
    }

    clearConnections() {
        this.connections.forEach(connection => {
            connection.line.classList.remove('active');
            connection.from.classList.remove('active');
            connection.to.classList.remove('active');
        });
        this.activeConnections.clear();
        // Update visual state after clearing connections
        this.updateConnections();
    }
}