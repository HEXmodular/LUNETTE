// all controls lives here

class ValueControl {
    constructor(options = {}) {
        this.options = {
            min: 0,
            max: 100,
            initialValue: 50,
            showLabel: true,
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
        
        // Create label only if showLabel is true
        const labelHtml = this.options.showLabel ? 
            `<label for="${this.options.id}">${this.options.label}</label>` : '';
            
        this.element.innerHTML = `
            ${labelHtml}
            <div class="control-container">
                <div class="value-display">${this.options.formatValue(this.currentValue)}</div>
                <!-- <div class="value-slider"></div> -->
            </div>
        `;
        
        this.display = this.element.querySelector('.value-display');
        // this.slider = this.element.querySelector('.value-slider');
        this.label = this.element.querySelector('label');
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
        // this.handleDragStart(e.touches[0].clientY, this.slider);
         this.handleDragStart(e.touches[0].clientY, this.element);
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.lastY = e.touches[0].clientY;
    }

    handleTouchEnd(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        // this.handleDragEnd(this.slider);
        this.handleDragEnd(this.element);
    }

    handleMouseDown(e) {
        e.preventDefault();
        // this.handleDragStart(e.clientY, this.slider);
        this.handleDragStart(e.clientY, this.element);
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.lastY = e.clientY;
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        // this.handleDragEnd(this.slider);
        this.handleDragEnd(this.element);
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

    // Add method to toggle label visibility
    setLabelVisibility(visible) {
        this.options.showLabel = visible;
        if (visible) {
            if (!this.label) {
                const label = document.createElement('label');
                label.setAttribute('for', this.options.id);
                label.textContent = this.options.label;
                this.element.insertBefore(label, this.element.firstChild);
                this.label = label;
            }
        } else {
            if (this.label) {
                this.label.remove();
                this.label = null;
            }
        }
    }
}

// Oscillator Control
class OscillatorControl {
    constructor(containerId, header, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
        
        this.options = {
            onChange: null,
            showHeader: true,  // Add option to control header visibility
            showLabel: true,   // Add option to control label visibility
            ...options
        };

        // Only add header if showHeader is true
        if (this.options.showHeader) {
            this.container.innerHTML = `<div class="title">${header}</div>`;
        } else {
            this.container.innerHTML = '';  // Clear container if no header
        }
        
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.isUpdating = false;
        
        this.frequencyControl = new ValueControl({
            id: 'frequency',
            label: 'Frequency (Hz)',
            min: 20,
            max: 2000,
            initialValue: 440,
            onChange: (value) => this.onFrequencyChange(value),
            formatValue: (value) => `${Math.round(value)} Hz`,
            showLabel: this.options.showLabel
        });

        this.noteControl = new ValueControl({
            id: 'note',
            label: 'Note',
            min: 0,
            max: 127,
            initialValue: 69,
            onChange: (value) => this.onNoteChange(value),
            formatValue: (value) => this.getNoteDisplay(value),
            showLabel: this.options.showLabel
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

    // Add method to toggle header visibility
    setHeaderVisibility(visible) {
        this.options.showHeader = visible;
        if (visible) {
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = this.header;
            this.container.insertBefore(title, this.container.firstChild);
        } else {
            const title = this.container.querySelector('.title');
            if (title) {
                title.remove();
            }
        }
    }

    // Add method to toggle label visibility for both controls
    setLabelVisibility(visible) {
        this.options.showLabel = visible;
        this.frequencyControl.setLabelVisibility(visible);
        this.noteControl.setLabelVisibility(visible);
    }
}

class LogicBlockControl {
    constructor(containerSelector, options = {}) {
        this.container = typeof containerSelector === 'string'
            ? document.querySelector(containerSelector)
            : containerSelector;
        if (!this.container) throw new Error('Container not found');

        this.id = options.id;
        this.labels = options.labels || [];
        this.columns = options.columns || 4;
        this.mode = options.mode || 'multiple'; // 'multiple' or 'single'
        this.onChange = options.onChange || null;
        this.state = Array(this.labels.length).fill(false);

        this.render();
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'logic-block-control';
        this.element.style.display = 'grid';
        this.element.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
        this.element.style.gap = '2px';

        this.buttons = [];
        for (let i = 0; i < this.labels.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'logic-block-btn';
            btn.textContent = this.labels[i];
            btn.dataset.index = i;
            btn.classList.toggle('active', this.state[i]);
            btn.onclick = () => this.toggle(i, btn);
            this.element.appendChild(btn);
            this.buttons.push(btn);
        }
        this.container.innerHTML = '';
        this.container.appendChild(this.element);
    }

    toggle(i, btn) {
        if (this.mode === 'single') {
            // Деактивировать все, кроме выбранной
            this.state = this.state.map((_, idx) => idx === i);
            this.buttons.forEach((b, idx) => b.classList.toggle('active', idx === i));
            if (this.onChange) {
                this.onChange(this.id, i, true);
            }
        } else {
            // Множественный выбор
            this.state[i] = !this.state[i];
            btn.classList.toggle('active', this.state[i]);
            if (this.onChange) {
                this.onChange(this.id, i, this.state[i]);
            }
        }
    }

    setState(i, value) {
        if (this.mode === 'single') {
            this.state = this.state.map((_, idx) => idx === i && !!value);
        } else {
            this.state[i] = !!value;
        }
        this.render();
    }

    getState(i) {
        return this.state[i];
    }

    getActiveIndices() {
        return this.state.map((v, i) => v ? i : -1).filter(i => i !== -1);
    }
}

