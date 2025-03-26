import { _decorator } from 'cc';

/**
 * Enum for musical notes
 */
export enum MusicalNote {
    DO = 0,
    RE = 1,
    MI = 2,
    FA = 3,
    SOL = 4,
    LA = 5,
    SI = 6
}

/**
 * Enum for game states
 */
export enum GameState {
    INIT = 0,
    CALIBRATING = 1,
    PLAYING = 2,
    PAUSED = 3,
    GAME_OVER = 4
}

/**
 * Enum for pitch detection accuracy
 */
export enum PitchAccuracy {
    MISS = 0,
    GOOD = 1,
    PERFECT = 2
}

/**
 * Enum for feedback types
 */
export enum FeedbackType {
    PERFECT = 0,
    GOOD = 1,
    MISS = 2,
    TIME_WARNING = 3
}

/**
 * Constants for the Pitch Detection Game
 */
export class PitchConstants {
    // Game duration in seconds
    public static readonly GAME_DURATION: number = 60;
    
    // Warning times in seconds
    public static readonly WARNING_TIME_1: number = 30;
    public static readonly WARNING_TIME_2: number = 10;
    
    // Note frequency ranges (Hz)
    public static readonly NOTE_FREQUENCIES: { [key in MusicalNote]: [number, number] } = {
        [MusicalNote.DO]: [261.63 - 10, 261.63 + 10],  // C4
        [MusicalNote.RE]: [293.66 - 10, 293.66 + 10],  // D4
        [MusicalNote.MI]: [329.63 - 10, 329.63 + 10],  // E4
        [MusicalNote.FA]: [349.23 - 10, 349.23 + 10],  // F4
        [MusicalNote.SOL]: [392.00 - 10, 392.00 + 10], // G4
        [MusicalNote.LA]: [440.00 - 10, 440.00 + 10],  // A4
        [MusicalNote.SI]: [493.88 - 10, 493.88 + 10]   // B4
    };
    
    // Note names
    public static readonly NOTE_NAMES: string[] = [
        "Do", "Re", "Mi", "Fa", "Sol", "La", "Si"
    ];
    
    // Note frequency ranges (Hz) - Alias for compatibility
    public static readonly FREQUENCY_RANGES: { [key in MusicalNote]: [number, number] } = {
        [MusicalNote.DO]: [261.63 - 10, 261.63 + 10],  // C4
        [MusicalNote.RE]: [293.66 - 10, 293.66 + 10],  // D4
        [MusicalNote.MI]: [329.63 - 10, 329.63 + 10],  // E4
        [MusicalNote.FA]: [349.23 - 10, 349.23 + 10],  // F4
        [MusicalNote.SOL]: [392.00 - 10, 392.00 + 10], // G4
        [MusicalNote.LA]: [440.00 - 10, 440.00 + 10],  // A4
        [MusicalNote.SI]: [493.88 - 10, 493.88 + 10]   // B4
    };
    
    // Animation names
    public static readonly ANIMATIONS: { [key in MusicalNote]: string } = {
        [MusicalNote.DO]: "do_animation",
        [MusicalNote.RE]: "re_animation",
        [MusicalNote.MI]: "mi_animation",
        [MusicalNote.FA]: "fa_animation",
        [MusicalNote.SOL]: "sol_animation",
        [MusicalNote.LA]: "la_animation",
        [MusicalNote.SI]: "si_animation"
    };
    
    // Animation names - Alias for compatibility
    public static readonly NOTE_ANIMATIONS: { [key in MusicalNote]: string } = {
        [MusicalNote.DO]: "do_animation",
        [MusicalNote.RE]: "re_animation",
        [MusicalNote.MI]: "mi_animation",
        [MusicalNote.FA]: "fa_animation",
        [MusicalNote.SOL]: "sol_animation",
        [MusicalNote.LA]: "la_animation",
        [MusicalNote.SI]: "si_animation"
    };
    
    // Event names
    public static readonly EVENTS = {
        PITCH_DETECTED: "pitch_detected",
        TIME_WARNING: "time_warning",
        GAME_OVER: "game_over",
        NOTE_MATCHED: "note_matched",
        SEQUENCE_COMPLETE: "sequence_complete"
    };
    
    // Accuracy thresholds
    public static readonly ACCURACY_THRESHOLDS = {
        PERFECT: 3, // Hz difference for perfect match
        GOOD: 7     // Hz difference for good match
    };
}
