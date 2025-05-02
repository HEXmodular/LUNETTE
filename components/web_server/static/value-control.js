class ValueControl {
    constructor(options = {}) {
        this.options = {
            min: 0,
            max: 100,
            initialValue: 50,
            onChange: null,
            ...options
        };

        this.currentValue = this.options.initialValue;
        this.startY = 0;
        this.lastY = 0;
        this.isDragging = false;
        this.updateInterval = null;

        this.init();
    }

    init() {
        // Create component structure
        this.element = document.createElement('div');
        this.element.className = 'value-control';
        
        this.display = document.createElement('div');
        this.display.className = 'value-display';
        this.display.textContent = this.currentValue;
        
        this.slider = document.createElement('div');
        this.slider.className = 'value-slider';
        
        this.element.appendChild(this.display);
        this.element.appendChild(this.slider);
        
        // Add event listeners
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.element.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        
        // Add mouse support for desktop testing
        this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    updateValue(newValue) {
        this.currentValue = Math.max(this.options.min, Math.min(this.options.max, newValue));
        this.display.textContent = Math.round(this.currentValue);
        
        if (this.options.onChange) {
            this.options.onChange(this.currentValue);
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.startY = e.touches[0].clientY;
        this.lastY = this.startY;
        this.isDragging = true;
        this.slider.classList.add('active');
        
        // Start continuous update
        this.updateInterval = setInterval(() => {
            if (this.isDragging) {
                const deltaY = this.lastY - this.startY;
                const speed = Math.abs(deltaY) / 100; // Speed factor based on distance
                const change = deltaY > 0 ? -speed : speed;
                this.updateValue(this.currentValue + change);
            }
        }, 16); // ~60fps
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.lastY = e.touches[0].clientY;
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.isDragging = false;
        this.slider.classList.remove('active');
        
        // Stop continuous update
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    // Mouse support for desktop testing
    handleMouseDown(e) {
        e.preventDefault();
        this.startY = e.clientY;
        this.lastY = this.startY;
        this.isDragging = true;
        this.slider.classList.add('active');
        
        // Start continuous update
        this.updateInterval = setInterval(() => {
            if (this.isDragging) {
                const deltaY = this.lastY - this.startY;
                const speed = Math.abs(deltaY) / 100; // Speed factor based on distance
                const change = deltaY > 0 ? -speed : speed;
                this.updateValue(this.currentValue + change);
            }
        }, 16); // ~60fps
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.lastY = e.clientY;
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.isDragging = false;
        this.slider.classList.remove('active');
        
        // Stop continuous update
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Public methods
    getValue() {
        return this.currentValue;
    }

    setValue(value) {
        this.updateValue(value);
    }

    // Mount component to container
    mount(selector) {
        const container = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (container) {
            container.appendChild(this.element);
        }
    }

    // Unmount component
    unmount() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
} 