import { _decorator, Component, CCFloat, CCBoolean } from 'cc';
import { AuditionInputType } from './AuditionInputHandler';
import { PatternData, PatternSequence } from './PatternData';
const { ccclass, property } = _decorator;

/**
 * Pattern Manager for Audition module
 * Handles pattern sequences, validation, and progression
 */
@ccclass('AuditionPatternManager')
export class AuditionPatternManager extends Component {
    // Pattern management properties
    @property
    private patternComplexityLevels: number[] = [3, 4, 5, 6, 7, 8, 9]; // Corresponds to levels

    @property(CCFloat)
    private patternInputTimeWindow: number = 2000; // Time window for completing a pattern in ms

    @property(CCBoolean)
    private enableFinishMoves: boolean = true; // Whether finish moves are enabled

    // Runtime variables
    private currentPattern: PatternData | null = null;
    private patternProgress: number = 0;
    private currentComplexityLevel: number = 0; // Index into patternComplexityLevels
    private patternStartTime: number = 0;
    private finishMoveTriggered: boolean = false;
    private patternsCompleted: number = 0;
    
    // Pattern validation callback
    private onPatternProgressCallback: (progress: number, total: number) => void = null;
    private onPatternCompleteCallback: (success: boolean, isFinishMove: boolean) => void = null;
    private onFinishMoveReadyCallback: () => void = null;

    /**
     * Load a new pattern
     * @param patternData The pattern data to load
     */
    public loadPattern(patternData: PatternData): void {
        this.currentPattern = patternData;
        this.patternProgress = 0;
        this.patternStartTime = Date.now();
        
        // Notify about new pattern
        if (this.onPatternProgressCallback && this.currentPattern) {
            this.onPatternProgressCallback(0, this.currentPattern.sequence.length);
        }
        
        console.log(`Loaded new pattern with complexity ${patternData.complexity}, ` +
                    `finish move: ${patternData.isFinishMove}`);
    }
    
    /**
     * Validate an input against the current pattern
     * @param input The input type to validate
     * @returns Whether the input was correct
     */
    public validateInput(input: AuditionInputType): boolean {
        if (!this.currentPattern) return false;
        
        // Check if we've exceeded the time window
        if (Date.now() - this.patternStartTime > this.patternInputTimeWindow) {
            this.breakPattern();
            return false;
        }
        
        const expected = this.currentPattern.sequence[this.patternProgress];
        if (input === expected) {
            // Correct input in sequence
            this.patternProgress++;
            
            // Notify progress
            if (this.onPatternProgressCallback && this.currentPattern) {
                this.onPatternProgressCallback(
                    this.patternProgress, 
                    this.currentPattern.sequence.length
                );
            }
            
            // Check if pattern is complete
            if (this.isPatternComplete()) {
                console.log(`Pattern sequence completed. Ready for sync input!`);
                
                // Pattern sequence completed, ready for sync input
                if (this.onPatternCompleteCallback) {
                    this.onPatternCompleteCallback(true, this.currentPattern.isFinishMove);
                }
            }
            
            return true;
        } else {
            // Incorrect input
            this.breakPattern();
            return false;
        }
    }
    
    /**
     * Check if the current pattern is complete and ready for sync input
     * @returns Whether the pattern is complete
     */
    public isPatternComplete(): boolean {
        return this.patternProgress >= (this.currentPattern?.sequence.length || 0);
    }
    
    /**
     * Get the current pattern
     * @returns The current pattern data or null if none
     */
    public getCurrentPattern(): PatternData | null {
        return this.currentPattern;
    }
    
    /**
     * Handle a pattern break (incorrect input or timeout)
     */
    private breakPattern(): void {
        console.log('Pattern broken!');
        
        if (this.onPatternCompleteCallback && this.currentPattern) {
            this.onPatternCompleteCallback(false, this.currentPattern.isFinishMove);
        }
        
        this.resetPattern();
    }
    
    /**
     * Reset the current pattern
     */
    private resetPattern(): void {
        this.currentPattern = null;
        this.patternProgress = 0;
    }
    
    /**
     * Advance to next complexity level
     */
    public advanceComplexityLevel(): void {
        if (this.currentComplexityLevel < this.patternComplexityLevels.length - 1) {
            this.currentComplexityLevel++;
            this.patternsCompleted = 0;
            console.log(`Advanced to complexity level ${this.currentComplexityLevel}: ` +
                       `${this.getCurrentComplexity()} inputs`);
        } else {
            console.log('Already at maximum complexity level');
        }
    }
    
    /**
     * Get current pattern complexity (number of inputs required)
     * @returns Current complexity level
     */
    public getCurrentComplexity(): number {
        return this.patternComplexityLevels[this.currentComplexityLevel];
    }
    
    /**
     * Check if a finish move should be triggered
     * @returns Whether a finish move should be triggered
     */
    public shouldTriggerFinishMove(): boolean {
        // Trigger finish move after certain patterns at each complexity level
        const patternsNeededForFinishMove = 5;
        return this.enableFinishMoves && 
               this.patternsCompleted >= patternsNeededForFinishMove && 
               !this.finishMoveTriggered;
    }
    
    /**
     * Generate a finish move pattern based on the previous pattern
     * @param previousPattern The previous pattern to reverse
     * @returns A new finish move pattern
     */
    public createFinishMovePattern(previousPattern: PatternData): PatternData {
        // Create a reversed sequence of the previous pattern
        const reversedSequence = [...previousPattern.sequence].reverse();
        
        return {
            sequence: reversedSequence,
            syncPoint: previousPattern.syncPoint,
            complexity: previousPattern.complexity,
            isFinishMove: true
        };
    }
    
    /**
     * Mark a pattern as completed
     * @param success Whether the pattern was completed successfully
     */
    public markPatternCompleted(success: boolean): void {
        if (success) {
            this.patternsCompleted++;
            
            // Check if we should trigger a finish move
            if (this.shouldTriggerFinishMove()) {
                this.finishMoveTriggered = true;
                
                if (this.onFinishMoveReadyCallback) {
                    this.onFinishMoveReadyCallback();
                }
            }
        }
        
        this.resetPattern();
    }
    
    /**
     * Reset finish move state after it's been executed
     */
    public resetFinishMoveState(): void {
        this.finishMoveTriggered = false;
        this.patternsCompleted = 0;
    }
    
    /**
     * Set up progress callback
     * @param callback Function to call with progress updates
     */
    public setPatternProgressCallback(callback: (progress: number, total: number) => void): void {
        this.onPatternProgressCallback = callback;
    }
    
    /**
     * Set up completion callback
     * @param callback Function to call when pattern is completed or broken
     */
    public setPatternCompleteCallback(callback: (success: boolean, isFinishMove: boolean) => void): void {
        this.onPatternCompleteCallback = callback;
    }
    
    /**
     * Set up finish move ready callback
     * @param callback Function to call when a finish move is ready
     */
    public setFinishMoveReadyCallback(callback: () => void): void {
        this.onFinishMoveReadyCallback = callback;
    }
    
    /**
     * Generate a random pattern at the current complexity level
     * @param syncPoint The synchronization point time
     * @returns A new random pattern
     */
    public generateRandomPattern(syncPoint: number): PatternData {
        const complexity = this.getCurrentComplexity();
        const sequence: AuditionInputType[] = [];
        
        // Generate a random sequence of LEFT and RIGHT inputs
        for (let i = 0; i < complexity; i++) {
            // Random 0 or 1 (LEFT or RIGHT)
            const input = Math.random() < 0.5 ? 
                        AuditionInputType.LEFT : 
                        AuditionInputType.RIGHT;
            sequence.push(input);
        }
        
        return {
            sequence: sequence,
            syncPoint: syncPoint,
            complexity: complexity,
            isFinishMove: false
        };
    }
} 