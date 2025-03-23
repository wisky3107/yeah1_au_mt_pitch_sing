import { _decorator, Component, Node, EventTouch, EventKeyboard, UITransform, Vec2, KeyCode, game, EventMouse, input, Input, Canvas } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Input types for the game
 */
export enum AuditionInputType {
    LEFT,
    RIGHT,
    SPACE
}

/**
 * Input handler for Audition module
 * Manages touch and keyboard inputs
 */
@ccclass('AuditionInputHandler')
export class AuditionInputHandler extends Component {
    // Singleton instance
    private static _instance: AuditionInputHandler = null;
    // Input areas
    @property(Node)
    private leftInputArea: Node = null;
    
    @property(Node)
    private rightInputArea: Node = null;
    
    @property(Node)
    private spaceInputArea: Node = null;
    
    // Internal properties
    private isInputEnabled: boolean = true;
    private inputCallbacks: Map<AuditionInputType, Function[]> = new Map();
    private lastInputTime: Map<AuditionInputType, number> = new Map();
    private inputDebounceTime: number = 100; // Minimum time between inputs (ms)
    
    // Singleton pattern implementation
    public static get instance(): AuditionInputHandler {
        return this._instance;
    }
    
    onLoad() {
        // Make this a singleton
        if (AuditionInputHandler._instance === null) {
            AuditionInputHandler._instance = this;
            this.initialize();
        } else {
            this.node.destroy();
        }
    }
    
    /**
     * Initialize input handler
     */
    private initialize(): void {
        // Initialize input callbacks maps
        this.inputCallbacks.set(AuditionInputType.LEFT, []);
        this.inputCallbacks.set(AuditionInputType.RIGHT, []);
        this.inputCallbacks.set(AuditionInputType.SPACE, []);
        
        // Initialize last input times
        this.lastInputTime.set(AuditionInputType.LEFT, 0);
        this.lastInputTime.set(AuditionInputType.RIGHT, 0);
        this.lastInputTime.set(AuditionInputType.SPACE, 0);
        
        // Register touch event listeners
        this.registerTouchEvents();
        
        // Register keyboard event listeners
        this.registerKeyboardEvents();
        
        console.log('Audition Input Handler initialized');
    }
    
    /**
     * Register touch event listeners
     */
    private registerTouchEvents(): void {
        // Left input area
        if (this.leftInputArea) {
            this.leftInputArea.on(Input.EventType.TOUCH_START, (event: EventTouch) => {
                if (this.isInputEnabled) {
                    this.handleInput(AuditionInputType.LEFT);
                }
            });
        }
        
        // Right input area
        if (this.rightInputArea) {
            this.rightInputArea.on(Input.EventType.TOUCH_START, (event: EventTouch) => {
                if (this.isInputEnabled) {
                    this.handleInput(AuditionInputType.RIGHT);
                }
            });
        }
        
        // Space input area
        if (this.spaceInputArea) {
            this.spaceInputArea.on(Input.EventType.TOUCH_START, (event: EventTouch) => {
                if (this.isInputEnabled) {
                    this.handleInput(AuditionInputType.SPACE);
                }
            });
        }
    }
    
    /**
     * Register keyboard event listeners
     */
    private registerKeyboardEvents(): void {
        input.on(Input.EventType.KEY_DOWN, (event: EventKeyboard) => {
            if (!this.isInputEnabled) return;
            
            switch (event.keyCode) {
                case KeyCode.ARROW_LEFT:
                case KeyCode.KEY_A:
                    this.handleInput(AuditionInputType.LEFT);
                    break;
                case KeyCode.ARROW_RIGHT:
                case KeyCode.KEY_D:
                    this.handleInput(AuditionInputType.RIGHT);
                    break;
                case KeyCode.SPACE:
                    this.handleInput(AuditionInputType.SPACE);
                    break;
            }
        });
    }
    
    /**
     * Handle input event
     * @param inputType Type of input
     */
    private handleInput(inputType: AuditionInputType): void {
        const currentTime = Date.now();
        const lastTime = this.lastInputTime.get(inputType);
        
        // Check for input debouncing
        if (currentTime - lastTime < this.inputDebounceTime) {
            return;
        }
        
        // Update last input time
        this.lastInputTime.set(inputType, currentTime);
        
        // Call all registered callbacks for this input type
        const callbacks = this.inputCallbacks.get(inputType);
        if (callbacks) {
            callbacks.forEach(callback => callback(currentTime));
        }
        
        console.log(`Input detected: ${AuditionInputType[inputType]}`);
    }
    
    /**
     * Register a callback for an input type
     * @param inputType Type of input
     * @param callback Function to call when input is detected
     */
    public registerInputCallback(inputType: AuditionInputType, callback: Function): void {
        const callbacks = this.inputCallbacks.get(inputType);
        if (callbacks) {
            callbacks.push(callback);
        }
    }
    
    /**
     * Unregister a callback for an input type
     * @param inputType Type of input
     * @param callback Function to remove
     */
    public unregisterInputCallback(inputType: AuditionInputType, callback: Function): void {
        const callbacks = this.inputCallbacks.get(inputType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * Enable or disable input
     * @param enabled Whether input should be enabled
     */
    public setInputEnabled(enabled: boolean): void {
        this.isInputEnabled = enabled;
        console.log(`Input ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Check if input is enabled
     * @returns True if input is enabled, false otherwise
     */
    public getInputEnabled(): boolean {
        return this.isInputEnabled;
    }
    
    /**
     * Set the debounce time for inputs
     * @param time Time in milliseconds
     */
    public setInputDebounceTime(time: number): void {
        this.inputDebounceTime = time;
    }
    
    /**
     * Get the current debounce time
     * @returns Debounce time in milliseconds
     */
    public getInputDebounceTime(): number {
        return this.inputDebounceTime;
    }

    /**
     * Simulate an input event for auto-play functionality
     * @param inputType Type of input to simulate
     * @param time Time of the input event
     */
    public simulateInput(inputType: AuditionInputType, time: number): void {
        // Update last input time
        this.lastInputTime.set(inputType, time);
        
        // Call all registered callbacks for this input type
        const callbacks = this.inputCallbacks.get(inputType);
        if (callbacks) {
            callbacks.forEach(callback => callback(time));
        }
        
        console.log(`Simulated input: ${AuditionInputType[inputType]}`);
    }
} 