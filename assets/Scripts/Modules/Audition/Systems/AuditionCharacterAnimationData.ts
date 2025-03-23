import { _decorator, TextAsset } from 'cc';
import { AuditionAccuracyRating } from './AuditionBeatSystem';
import { AuditionInputType } from './AuditionInputHandler';
import { resourceUtil } from '../../../Common/resourceUtil';
const { ccclass, property } = _decorator;

/**
 * Animation state types
 */
export enum AnimationStateType {
    SPECIAL = 0,
    DANCE = 1
}

/**
 * Special state types
 */
export enum SpecialStateType {
    FIRST_STAND = 'first_stand',
    LAST_STAND = 'last_stand',
    BOY_START = 'boy_start',
    GIRL_START = 'girl_start',
    DANCE_START = 'dance_start',
    DANCE_END = 'dance_end',
    BOY_WIN = 'boy_win',
    BOY_LOSE = 'boy_lose',
    GIRL_WIN = 'girl_win',
    GIRL_LOSE = 'girl_lose',
    END1 = 'end1', // Boy loser
    END2 = 'end2', // Boy winner
    END3 = 'end3', // Girl loser
    END4 = 'end4', // Girl winner
    MISS = 'miss'  // Miss animation
}

/**
 * Interface for animation transition
 */
export interface AnimationTransition {
    srcState: string;
    destState: string;
    transitionDuration: number;
    transitionOffset: number;
    exitTime: number;
    condition?: (combo: number, accuracy: AuditionAccuracyRating) => boolean;
}

/**
 * Interface for animation state
 */
export interface DanceAnimationState {
    speed: number;
    motion: string;
    transitions: AnimationTransition[];
    isLooping?: boolean;
    nextState?: string;
}

/**
 * Class for managing dance move data
 */
@ccclass('AuditionCharacterAnimationData')
export class AuditionCharacterAnimationData {
    // Special states
    private static specialStates: Map<SpecialStateType, DanceAnimationState> = new Map();

    // Dance state data
    private static danceStates: Map<string, DanceAnimationState> = new Map();

    // Default state
    private static defaultState: string = '';

    private static beginDanceState: string = '';

    // Current dance sequence
    private static currentSequence: string[] = [];

    /**
     * Initialize dance move data
     */
    public static initialize(): void {
        // Clear existing data
        this.specialStates.clear();
        this.danceStates.clear();
        this.currentSequence = [];

        // Initialize special states with default values
        this.initializeSpecialStates();
    }

    /**
     * Initialize special states with default values
     */
    private static initializeSpecialStates(): void {
        // First stand
        this.specialStates.set(SpecialStateType.FIRST_STAND, {
            speed: 1.0,
            motion: 'first_stand',
            transitions: [{
                srcState: 'first_stand',
                destState: 'boy_start',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        // Last stand
        this.specialStates.set(SpecialStateType.LAST_STAND, {
            speed: 1.0,
            motion: 'last_stand',
            transitions: [],
            isLooping: true
        });

        // Gender-specific start animations
        this.specialStates.set(SpecialStateType.BOY_START, {
            speed: 1.0,
            motion: 'boy_start',
            transitions: [{
                srcState: 'boy_start',
                destState: 'dance_start',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        this.specialStates.set(SpecialStateType.GIRL_START, {
            speed: 1.0,
            motion: 'girl_start',
            transitions: [{
                srcState: 'girl_start',
                destState: 'dance_start',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        // Dance start/end
        this.specialStates.set(SpecialStateType.DANCE_START, {
            speed: 1.0,
            motion: 'dance_start',
            transitions: [{
                srcState: 'dance_start',
                destState: 'default_dance',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        this.specialStates.set(SpecialStateType.DANCE_END, {
            speed: 1.0,
            motion: 'dance_end',
            transitions: [],
            isLooping: false
        });
        // Win/lose animations for both genders
        this.specialStates.set(SpecialStateType.BOY_WIN, {
            speed: 1.0,
            motion: 'boy_win',
            transitions: [{
                srcState: 'boy_win',
                destState: 'last_stand',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        this.specialStates.set(SpecialStateType.BOY_LOSE, {
            speed: 1.0,
            motion: 'boy_lose',
            transitions: [{
                srcState: 'boy_lose',
                destState: 'last_stand',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        this.specialStates.set(SpecialStateType.GIRL_WIN, {
            speed: 1.0,
            motion: 'girl_win',
            transitions: [{
                srcState: 'girl_win',
                destState: 'last_stand',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        this.specialStates.set(SpecialStateType.GIRL_LOSE, {
            speed: 1.0,
            motion: 'girl_lose',
            transitions: [{
                srcState: 'girl_lose',
                destState: 'last_stand',
                transitionDuration: 0.2,
                transitionOffset: 0,
                exitTime: 0.9
            }],
            isLooping: false
        });

        // End animations
        // this.specialStates.set(SpecialStateType.END1, {
        //     speed: 1.0,
        //     motion: 'boy_lose',
        //     transitions: [{
        //         srcState: 'boy_lose',
        //         destState: 'last_stand',
        //         transitionDuration: 0.2,
        //         transitionOffset: 0,
        //         exitTime: 0.9
        //     }],
        //     isLooping: false
        // });

        // this.specialStates.set(SpecialStateType.END2, {
        //     speed: 1.0,
        //     motion: 'boy_win',
        //     transitions: [{
        //         srcState: 'boy_win',
        //         destState: 'last_stand',
        //         transitionDuration: 0.2,
        //         transitionOffset: 0,
        //         exitTime: 0.9
        //     }],
        //     isLooping: false
        // });

        // this.specialStates.set(SpecialStateType.END3, {
        //     speed: 1.0,
        //     motion: 'girl_lose',
        //     transitions: [{
        //         srcState: 'girl_lose',
        //         destState: 'last_stand',
        //         transitionDuration: 0.2,
        //         transitionOffset: 0,
        //         exitTime: 0.9
        //     }],
        //     isLooping: false
        // });

        // this.specialStates.set(SpecialStateType.END4, {
        //     speed: 1.0,
        //     motion: 'girl_win',
        //     transitions: [{
        //         srcState: 'girl_win',
        //         destState: 'last_stand',
        //         transitionDuration: 0.2,
        //         transitionOffset: 0,
        //         exitTime: 0.9
        //     }],
        //     isLooping: false
        // });

        // Miss animation
        this.specialStates.set(SpecialStateType.MISS, {
            speed: 1.0,
            motion: 'miss',
            transitions: [],
            isLooping: false
        });
    }

    /**
     * Load dance data from resources
     */
    public static loadDanceData(dataName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            resourceUtil.loadRes('audition/dances/' + dataName, TextAsset, (err: any, content: TextAsset) => {
                if (err) {
                    console.error('Failed to load dance data:', err);
                    reject(err);
                    return;
                }

                this.parseDanceData(content.text);
                resolve();
            });
        });
    }

    /**
     * Parse dance data from text content
     */
    private static parseDanceData(content: string): void {
        const lines = content.split('\n');
        let currentState: string = '';
        let currentTransitions: AnimationTransition[] = [];
        this.beginDanceState = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines
            if (!line) continue;

            // Check for default state
            if (line.startsWith('DefaultState:')) {
                this.defaultState = line.split(':')[1].trim();
                continue;
            }

            // Check for state definition
            if (line.startsWith('[') && line.endsWith(']')) {
                // Save previous state if exists
                const isSpecialState = Array.from(this.specialStates.keys()).some(key => 
                    this.specialStates.get(key).motion === currentState
                );
                if (currentState && !isSpecialState) {
                    this.saveState(currentState, currentTransitions);
                    currentTransitions = [];
                }

                currentState = line.slice(1, -1).trim();
                continue;
            }

            // Parse state properties
            if (currentState) {
                // Check if current state is a special state
                const isSpecialState = Array.from(this.specialStates.keys()).some(key => 
                    this.specialStates.get(key).motion === currentState
                );

                if (line.startsWith('Speed:')) {
                    const speed = parseFloat(line.split(':')[1].trim());
                    if (isSpecialState) {
                        this.updateSpecialStateSpeed(currentState, speed);
                    } else {
                        this.updateStateSpeed(currentState, speed);
                    }
                }
                else if (line.startsWith('Motion:')) {
                    const motion = line.split(':')[1].trim();
                    if (isSpecialState) {
                        this.updateSpecialStateMotion(currentState, motion);
                    } else {
                        this.updateStateMotion(currentState, motion);
                        // If this is the first dance motion and not a special state, set it as the begin dance state
                        if (!this.beginDanceState && !this.specialStates.has(motion as SpecialStateType)) {
                            this.beginDanceState = currentState;
                        }
                    }
                }
                else if (line.startsWith('Transition:')) {
                    const transition = this.parseTransition(lines, i);
                    if (transition) {
                        if (isSpecialState) {
                            this.updateSpecialStateTransitions(currentState, transition);
                        } else {
                            currentTransitions.push(transition);
                        }
                    }
                }
                else if (line.startsWith('IsLooping:')) {
                    const isLooping = line.split(':')[1].trim().toLowerCase() === 'true';
                    if (isSpecialState) {
                        this.updateSpecialStateLooping(currentState, isLooping);
                    } else {
                        this.updateStateLooping(currentState, isLooping);
                    }
                }
                else if (line.startsWith('NextState:')) {
                    const nextState = line.split(':')[1].trim();
                    if (!isSpecialState) {
                        this.updateStateNext(currentState, nextState);
                    }
                }
            }
        }

        // // Save last state
        // if (currentState) {
        //     this.saveState(currentState, currentTransitions);
        // }

        // Build dance sequence
        this.buildDanceSequence();

        console.log(`Loaded ${this.danceStates.size} dance states`);
    }

    /**
     * Build the dance sequence from loaded states
     */
    private static buildDanceSequence(): void {
        this.currentSequence = [];
        let currentState = this.defaultState;

        while (currentState) {
            this.currentSequence.push(currentState);
            const state = this.danceStates.get(currentState);
            if (!state || !state.nextState) break;
            currentState = state.nextState;
        }
    }

    /**
     * Get all dance states
     */
    public static getAllDanceStates(): DanceAnimationState[] {
        return Array.from(this.danceStates.values());
    }

    /**
     * Parse transition data
     */
    private static parseTransition(lines: string[], startIndex: number): AnimationTransition {
        const transition: AnimationTransition = {
            srcState: '',
            destState: '',
            transitionDuration: 0,
            transitionOffset: 0,
            exitTime: 0
        };

        let i = startIndex + 1;
        while (i < lines.length && lines[i].startsWith('\t')) {
            const line = lines[i].trim();

            if (line.startsWith('SrcState:')) {
                transition.srcState = line.split(':')[1].trim();
            }
            else if (line.startsWith('DestState:')) {
                transition.destState = line.split(':')[1].trim();
            }
            else if (line.startsWith('TransitionDuration:')) {
                transition.transitionDuration = parseFloat(line.split(':')[1].trim());
            }
            else if (line.startsWith('TransitionOffset:')) {
                transition.transitionOffset = parseFloat(line.split(':')[1].trim());
            }
            else if (line.startsWith('ExitTime:')) {
                transition.exitTime = parseFloat(line.split(':')[1].trim());
            }
            else if (line.startsWith('Condition:')) {
                // Parse condition string and create condition function
                const conditionStr = line.split(':')[1].trim();
                transition.condition = this.parseCondition(conditionStr);
            }

            i++;
        }

        return transition;
    }

    /**
     * Parse condition string into a function
     */
    private static parseCondition(conditionStr: string): (combo: number, accuracy: AuditionAccuracyRating) => boolean {
        // Example conditions:
        // "combo >= 10" -> (combo) => combo >= 10
        // "accuracy === MISS" -> (_, accuracy) => accuracy === AuditionAccuracyRating.MISS
        // "combo >= 5 && accuracy !== MISS" -> (combo, accuracy) => combo >= 5 && accuracy !== AuditionAccuracyRating.MISS

        return new Function('combo', 'accuracy', `return ${conditionStr}`) as (combo: number, accuracy: AuditionAccuracyRating) => boolean;
    }

    /**
     * Save state data
     */
    private static saveState(stateName: string, transitions: AnimationTransition[]): void {
        const state = this.danceStates.get(stateName) || {
            speed: 1.0,
            motion: stateName,
            transitions: [],
            isLooping: false
        };

        state.transitions = transitions;
        this.danceStates.set(stateName, state);
    }

    /**
     * Update state speed
     */
    private static updateStateSpeed(stateName: string, speed: number): void {
        const state = this.danceStates.get(stateName) || {
            speed: 1.0,
            motion: stateName,
            transitions: [],
            isLooping: false
        };

        state.speed = speed;
        this.danceStates.set(stateName, state);
    }

    /**
     * Update state motion
     */
    private static updateStateMotion(stateName: string, motion: string): void {
        const state = this.danceStates.get(stateName) || {
            speed: 1.0,
            motion: stateName,
            transitions: [],
            isLooping: false
        };

        state.motion = motion;
        this.danceStates.set(stateName, state);
    }

    /**
     * Update state looping
     */
    private static updateStateLooping(stateName: string, isLooping: boolean): void {
        const state = this.danceStates.get(stateName) || {
            speed: 1.0,
            motion: stateName,
            transitions: [],
            isLooping: false
        };

        state.isLooping = isLooping;
        this.danceStates.set(stateName, state);
    }

    /**
     * Update state next
     */
    private static updateStateNext(stateName: string, nextState: string): void {
        const state = this.danceStates.get(stateName) || {
            speed: 1.0,
            motion: stateName,
            transitions: [],
            isLooping: false
        };

        state.nextState = nextState;
        this.danceStates.set(stateName, state);
    }

    /**
     * Get a dance state by name
     */
    public static getDanceState(stateName: string): DanceAnimationState {
        return this.danceStates.get(stateName) || null;
    }

    /**
     * Get the default state
     */
    public static getDefaultState(): string {
        return this.defaultState;
    }

    public static getBeginDanceState(): string {
        return this.beginDanceState;
    }

    /**
     * Get a special state
     */
    public static getSpecialState(type: SpecialStateType): DanceAnimationState {
        return this.specialStates.get(type) || null;
    }

    /**
     * Get the current dance sequence
     */
    public static getDanceSequence(): string[] {
        return [...this.currentSequence];
    }

    /**
     * Get all animation names from the loaded dance data
     */
    public static getAllAnimationNames(): string[] {
        const danceStateKeys = Array.from(this.danceStates.keys());
        const specialStateKeys = Array.from(this.specialStates.keys());

        // Combine both arrays and remove duplicates using Set
        return [...new Set([...danceStateKeys, ...specialStateKeys])];
    }

    /**
     * Update special state speed
     */
    private static updateSpecialStateSpeed(stateName: string, speed: number): void {
        for (const [key, state] of this.specialStates.entries()) {
            if (state.motion === stateName) {
                state.speed = speed;
                this.specialStates.set(key, state);
                break;
            }
        }
    }

    /**
     * Update special state motion
     */
    private static updateSpecialStateMotion(stateName: string, motion: string): void {
        for (const [key, state] of this.specialStates.entries()) {
            if (state.motion === stateName) {
                state.motion = motion;
                this.specialStates.set(key, state);
                break;
            }
        }
    }

    /**
     * Update special state transitions
     */
    private static updateSpecialStateTransitions(stateName: string, transition: AnimationTransition): void {
        for (const [key, state] of this.specialStates.entries()) {
            if (state.motion === stateName) {
                state.transitions.push(transition);
                this.specialStates.set(key, state);
                break;
            }
        }
    }

    /**
     * Update special state looping
     */
    private static updateSpecialStateLooping(stateName: string, isLooping: boolean): void {
        for (const [key, state] of this.specialStates.entries()) {
            if (state.motion === stateName) {
                state.isLooping = isLooping;
                this.specialStates.set(key, state);
                break;
            }
        }
    }
} 