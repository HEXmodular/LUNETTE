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

// Oscillator Diagram
class OscillatorDiagram {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }

        this.connections = new Map();
        this.activeConnections = new Set();
        this.connectionLabels = new Map();
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

                // Create label for connection
                const label = document.createElement('div');
                label.className = 'connection-label';
                label.textContent = ''; // Empty by default
                grid.appendChild(label);
                
                this.connections.set(`${nodes[i].dataset.id}-${nodes[j].dataset.id}`, {
                    line,
                    label,
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
            
            // Update label position
            const labelX = fromX + (toX - fromX) / 2;
            const labelY = fromY + (toY - fromY) / 2;
            
            // Adjust label position to be perpendicular to the line
            const labelAngle = angle + 90;
            connection.label.style.left = `${labelX}px`;
            connection.label.style.top = `${labelY}px`;
            connection.label.style.transform = `translate(-50%, -50%) rotate(${labelAngle}deg)`;
            
            // Update visibility based on active state
            const isActive = this.activeConnections.has(key);
            connection.line.style.opacity = isActive ? '1' : '0.3';
            connection.label.style.opacity = isActive ? '1' : '0.3';
        });
    }

    setConnection(fromId, toId, active = true, labelText = '') {
        const key = [fromId, toId].sort().join('-');
        const connection = this.connections.get(key);
        
        if (connection) {
            if (active) {
                connection.line.classList.add('active');
                connection.label.classList.add('active');
                connection.from.classList.add('active');
                connection.to.classList.add('active');
                this.activeConnections.add(key);
                
                // Set label text if provided
                if (labelText) {
                    connection.label.textContent = labelText;
                    connection.label.style.display = 'block';
                } else {
                    connection.label.style.display = 'none';
                }
            } else {
                connection.line.classList.remove('active');
                connection.label.classList.remove('active');
                connection.from.classList.remove('active');
                connection.to.classList.remove('active');
                this.activeConnections.delete(key);
                connection.label.style.display = 'none';
            }
            
            // Force a reflow to ensure styles are applied
            this.element.offsetHeight;
            
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
            connection.label.classList.remove('active');
            connection.from.classList.remove('active');
            connection.to.classList.remove('active');
        });
        this.activeConnections.clear();
        // Update visual state after clearing connections
        this.updateConnections();
    }
}

// Logic Matrix Control
class LogicMatrixControl {
    constructor(containerSelector, options = {}) {
        this.container = typeof containerSelector === 'string'
            ? document.querySelector(containerSelector)
            : containerSelector;
        if (!this.container) throw new Error('Container not found');

        this.rows = options.rows || ['OR', 'AND', 'XOR', '-', 'NOR', 'NAND', '-', 'OFF'];
        this.cols = options.cols || ['L1', 'L2', 'L3', 'OFF'];
        this.onChange = options.onChange || null;
        this.state = Array(this.rows.length).fill(null).map(() => Array(this.cols.length).fill(false));

        this.render();
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'logic-matrix-control';
        const table = document.createElement('table');
        table.className = 'logic-matrix-table';

        // Header
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        headRow.appendChild(document.createElement('th'));
        for (const col of this.cols) {
            const th = document.createElement('th');
            th.textContent = col;
            headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        for (let i = 0; i < this.rows.length; i++) {
            const tr = document.createElement('tr');
            const rowLabel = document.createElement('td');
            rowLabel.textContent = this.rows[i];
            tr.appendChild(rowLabel);
            for (let j = 0; j < this.cols.length; j++) {
                const td = document.createElement('td');
                const btn = document.createElement('button');
                btn.className = 'logic-matrix-btn';
                btn.textContent = this.state[i][j] ? 'ON' : 'OFF';
                btn.dataset.row = i;
                btn.dataset.col = j;
                btn.onclick = () => this.toggle(i, j, btn);
                td.appendChild(btn);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        this.element.innerHTML = '';
        this.element.appendChild(table);
        this.container.innerHTML = '';
        this.container.appendChild(this.element);
    }

    toggle(i, j, btn) {
        this.state[i][j] = !this.state[i][j];
        btn.textContent = this.state[i][j] ? 'ON' : 'OFF';
        btn.classList.toggle('active', this.state[i][j]);
        if (this.onChange) {
            this.onChange(i, j, this.state[i][j]);
        }
    }

    setState(i, j, value) {
        this.state[i][j] = !!value;
        this.render();
    }

    getState(i, j) {
        return this.state[i][j];
    }
}

class LogicBlockControl {
    constructor(containerSelector, options = {}) {
        this.container = typeof containerSelector === 'string'
            ? document.querySelector(containerSelector)
            : containerSelector;
        if (!this.container) throw new Error('Container not found');

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
                this.onChange(i, true);
            }
        } else {
            // Множественный выбор
            this.state[i] = !this.state[i];
            btn.classList.toggle('active', this.state[i]);
            if (this.onChange) {
                this.onChange(i, this.state[i]);
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

