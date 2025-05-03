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
