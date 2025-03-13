import { _decorator } from 'cc';
import { AuditionInputType } from './AuditionInputHandler';
const { ccclass, property } = _decorator;

/**
 * Interface defining pattern data structure for the Audition game
 * This is the core data structure for pattern-based gameplay
 */
export interface PatternData {
    /** Array of input types that form the pattern sequence */
    sequence: AuditionInputType[];
    
    /** Timestamp (in ms) when the spacebar should be pressed to sync with the beat */
    syncPoint: number;
    
    /** Complexity level (3-9) determining the difficulty of the pattern */
    complexity: number;
    
    /** Whether this is a finish move (reversed pattern) */
    isFinishMove: boolean;
}

/**
 * Runtime pattern sequence data for active patterns
 */
export interface PatternSequence {
    /** Expected pattern inputs */
    expectedInputs: AuditionInputType[];
    
    /** Time when the sync input (space) should happen */
    syncTime: number;
    
    /** When the pattern was first displayed */
    displayStartTime: number;
} 