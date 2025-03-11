import { _decorator } from 'cc';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionInputType } from './AuditionInputHandler';
const { ccclass, property } = _decorator;

/**
 * Dance move difficulty levels
 */
export enum DanceMoveDifficulty {
    BEGINNER = 0,
    BASIC = 1,
    INTERMEDIATE = 2,
    ADVANCED = 3,
    EXPERT = 4
}

/**
 * Interface for dance move data
 */
export interface DanceMoveData {
    id: string;                      // Unique identifier
    name: string;                    // Display name
    animationName: string;           // Animation clip name
    difficulty: DanceMoveDifficulty; // Difficulty level
    requiredCombo: number;           // Minimum combo required to perform
    duration: number;                // Duration in seconds
    description: string;             // Description of the move
}

/**
 * Interface for dance move requirement
 */
export interface DanceMoveRequirement {
    inputSequence: AuditionInputType[];              // Sequence of inputs required
    accuracySequence: AuditionAccuracyRating[];      // Required accuracy for each input
    timeWindow: number;                               // Time window to complete the sequence (ms)
}

/**
 * Class for managing dance move data
 */
@ccclass('AuditionCharacterAnimationData')
export class AuditionCharacterAnimationData {
    // Available dance moves
    private static danceMoves: Map<string, DanceMoveData> = new Map();
    
    // Requirements for each dance move
    private static danceMoveRequirements: Map<string, DanceMoveRequirement> = new Map();
    
    /**
     * Initialize dance move data
     */
    public static initialize(): void {
        // Clear existing data
        this.danceMoves.clear();
        this.danceMoveRequirements.clear();
        
        // Add basic dance moves
        this.addBasicDanceMoves();
        
        // Add intermediate dance moves
        this.addIntermediateDanceMoves();
        
        // Add advanced dance moves
        this.addAdvancedDanceMoves();
        
        console.log(`Initialized dance move data with ${this.danceMoves.size} moves`);
    }
    
    /**
     * Add basic dance moves
     */
    private static addBasicDanceMoves(): void {
        // Basic Step
        this.addDanceMove({
            id: 'basic_step',
            name: 'Basic Step',
            animationName: 'dance_basic_step',
            difficulty: DanceMoveDifficulty.BEGINNER,
            requiredCombo: 0,
            duration: 2.0,
            description: 'Simple stepping in place'
        }, {
            inputSequence: [AuditionInputType.LEFT, AuditionInputType.RIGHT],
            accuracySequence: [AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT],
            timeWindow: 1000
        });
        
        // Side Step
        this.addDanceMove({
            id: 'side_step',
            name: 'Side Step',
            animationName: 'dance_side_step',
            difficulty: DanceMoveDifficulty.BEGINNER,
            requiredCombo: 0,
            duration: 2.0,
            description: 'Stepping side to side'
        }, {
            inputSequence: [AuditionInputType.LEFT, AuditionInputType.RIGHT, AuditionInputType.LEFT],
            accuracySequence: [AuditionAccuracyRating.GOOD, AuditionAccuracyRating.GOOD, AuditionAccuracyRating.GOOD],
            timeWindow: 1500
        });
        
        // Jump Step
        this.addDanceMove({
            id: 'jump_step',
            name: 'Jump Step',
            animationName: 'dance_jump_step',
            difficulty: DanceMoveDifficulty.BASIC,
            requiredCombo: 5,
            duration: 1.5,
            description: 'Simple jumping motion'
        }, {
            inputSequence: [AuditionInputType.SPACE, AuditionInputType.SPACE],
            accuracySequence: [AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT],
            timeWindow: 1000
        });
    }
    
    /**
     * Add intermediate dance moves
     */
    private static addIntermediateDanceMoves(): void {
        // Spin Move
        this.addDanceMove({
            id: 'spin_move',
            name: 'Spin Move',
            animationName: 'dance_spin_move',
            difficulty: DanceMoveDifficulty.INTERMEDIATE,
            requiredCombo: 10,
            duration: 3.0,
            description: 'Spinning dance move'
        }, {
            inputSequence: [AuditionInputType.LEFT, AuditionInputType.LEFT, AuditionInputType.RIGHT, AuditionInputType.RIGHT],
            accuracySequence: [AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT],
            timeWindow: 2000
        });
        
        // Wave Dance
        this.addDanceMove({
            id: 'wave_dance',
            name: 'Wave Dance',
            animationName: 'dance_wave',
            difficulty: DanceMoveDifficulty.INTERMEDIATE,
            requiredCombo: 15,
            duration: 2.5,
            description: 'Flowing wave-like motion'
        }, {
            inputSequence: [AuditionInputType.LEFT, AuditionInputType.SPACE, AuditionInputType.RIGHT],
            accuracySequence: [AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT],
            timeWindow: 1500
        });
    }
    
    /**
     * Add advanced dance moves
     */
    private static addAdvancedDanceMoves(): void {
        // Breakdance
        this.addDanceMove({
            id: 'breakdance',
            name: 'Breakdance',
            animationName: 'dance_breakdance',
            difficulty: DanceMoveDifficulty.ADVANCED,
            requiredCombo: 20,
            duration: 4.0,
            description: 'Advanced breakdancing move'
        }, {
            inputSequence: [
                AuditionInputType.SPACE, AuditionInputType.LEFT, 
                AuditionInputType.SPACE, AuditionInputType.RIGHT, 
                AuditionInputType.SPACE
            ],
            accuracySequence: [
                AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT, 
                AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT, 
                AuditionAccuracyRating.PERFECT
            ],
            timeWindow: 3000
        });
        
        // Flip Move
        this.addDanceMove({
            id: 'flip_move',
            name: 'Flip Move',
            animationName: 'dance_flip',
            difficulty: DanceMoveDifficulty.EXPERT,
            requiredCombo: 30,
            duration: 3.0,
            description: 'Spectacular flip animation'
        }, {
            inputSequence: [
                AuditionInputType.LEFT, AuditionInputType.RIGHT, 
                AuditionInputType.LEFT, AuditionInputType.RIGHT, 
                AuditionInputType.SPACE
            ],
            accuracySequence: [
                AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT, 
                AuditionAccuracyRating.PERFECT, AuditionAccuracyRating.PERFECT, 
                AuditionAccuracyRating.PERFECT
            ],
            timeWindow: 2500
        });
    }
    
    /**
     * Add a dance move to the database
     * @param moveData Dance move data
     * @param requirement Requirements to execute the move
     */
    private static addDanceMove(moveData: DanceMoveData, requirement: DanceMoveRequirement): void {
        this.danceMoves.set(moveData.id, moveData);
        this.danceMoveRequirements.set(moveData.id, requirement);
    }
    
    /**
     * Get all dance moves
     * @returns Array of all dance moves
     */
    public static getAllDanceMoves(): DanceMoveData[] {
        return Array.from(this.danceMoves.values());
    }
    
    /**
     * Get dance moves filtered by difficulty
     * @param difficulty Difficulty level
     * @returns Array of dance moves at the specified difficulty
     */
    public static getDanceMovesByDifficulty(difficulty: DanceMoveDifficulty): DanceMoveData[] {
        return Array.from(this.danceMoves.values())
            .filter(move => move.difficulty === difficulty);
    }
    
    /**
     * Get a dance move by ID
     * @param id Dance move ID
     * @returns Dance move data or null if not found
     */
    public static getDanceMove(id: string): DanceMoveData {
        return this.danceMoves.get(id) || null;
    }
    
    /**
     * Get requirements for a dance move
     * @param id Dance move ID
     * @returns Requirements or null if not found
     */
    public static getDanceMoveRequirements(id: string): DanceMoveRequirement {
        return this.danceMoveRequirements.get(id) || null;
    }
    
    /**
     * Get dance moves available at the current combo level
     * @param combo Current combo count
     * @returns Array of available dance moves
     */
    public static getAvailableDanceMoves(combo: number): DanceMoveData[] {
        return Array.from(this.danceMoves.values())
            .filter(move => move.requiredCombo <= combo);
    }
} 