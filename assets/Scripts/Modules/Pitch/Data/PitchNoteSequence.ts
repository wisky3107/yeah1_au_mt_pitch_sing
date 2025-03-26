import { _decorator } from 'cc';
import { MusicalNote } from '../Systems/PitchConstants';

/**
 * Interface for a note in a sequence
 */
export interface PitchNote {
    note: MusicalNote;
    duration: number; // Duration in seconds
}

/**
 * Class representing a sequence of notes for the Pitch Detection Game
 */
export class PitchNoteSequence {
    public id: string;
    public name: string;
    public difficulty: number; // 1-5, where 5 is hardest
    public notes: PitchNote[];
    
    constructor(id: string, name: string, difficulty: number, notes: PitchNote[]) {
        this.id = id;
        this.name = name;
        this.difficulty = difficulty;
        this.notes = notes;
    }
    
    /**
     * Get the total duration of the sequence
     * @returns Total duration in seconds
     */
    public getTotalDuration(): number {
        return this.notes.reduce((total, note) => total + note.duration, 0);
    }
    
    /**
     * Get the number of notes in the sequence
     * @returns Number of notes
     */
    public getNoteCount(): number {
        return this.notes.length;
    }
}

/**
 * Library of predefined note sequences
 */
export class PitchSequenceLibrary {
    private static sequences: Map<string, PitchNoteSequence> = new Map();
    
    /**
     * Initialize the sequence library with predefined sequences
     */
    public static initialize(): void {
        // Add predefined sequences
        this.addSequence(
            new PitchNoteSequence(
                'sequence_1',
                'Basic Scale',
                1,
                [
                    { note: MusicalNote.DO, duration: 2 },
                    { note: MusicalNote.RE, duration: 2 },
                    { note: MusicalNote.MI, duration: 2 },
                    { note: MusicalNote.FA, duration: 2 },
                    { note: MusicalNote.SOL, duration: 2 },
                    { note: MusicalNote.LA, duration: 2 },
                    { note: MusicalNote.SI, duration: 2 }
                ]
            )
        );
        
        this.addSequence(
            new PitchNoteSequence(
                'sequence_2',
                'Simple Melody',
                2,
                [
                    { note: MusicalNote.DO, duration: 1 },
                    { note: MusicalNote.MI, duration: 1 },
                    { note: MusicalNote.SOL, duration: 1 },
                    { note: MusicalNote.MI, duration: 1 },
                    { note: MusicalNote.DO, duration: 2 }
                ]
            )
        );
        
        this.addSequence(
            new PitchNoteSequence(
                'sequence_3',
                'Advanced Pattern',
                3,
                [
                    { note: MusicalNote.DO, duration: 1 },
                    { note: MusicalNote.MI, duration: 1 },
                    { note: MusicalNote.SOL, duration: 1 },
                    { note: MusicalNote.SI, duration: 1 },
                    { note: MusicalNote.LA, duration: 1 },
                    { note: MusicalNote.FA, duration: 1 },
                    { note: MusicalNote.RE, duration: 1 },
                    { note: MusicalNote.DO, duration: 2 }
                ]
            )
        );
        
        this.addSequence(
            new PitchNoteSequence(
                'sequence_4',
                'Expert Challenge',
                5,
                [
                    { note: MusicalNote.DO, duration: 0.5 },
                    { note: MusicalNote.RE, duration: 0.5 },
                    { note: MusicalNote.MI, duration: 0.5 },
                    { note: MusicalNote.FA, duration: 0.5 },
                    { note: MusicalNote.SOL, duration: 0.5 },
                    { note: MusicalNote.LA, duration: 0.5 },
                    { note: MusicalNote.SI, duration: 0.5 },
                    { note: MusicalNote.LA, duration: 0.5 },
                    { note: MusicalNote.SOL, duration: 0.5 },
                    { note: MusicalNote.FA, duration: 0.5 },
                    { note: MusicalNote.MI, duration: 0.5 },
                    { note: MusicalNote.RE, duration: 0.5 },
                    { note: MusicalNote.DO, duration: 1 }
                ]
            )
        );
    }
    
    /**
     * Add a sequence to the library
     * @param sequence Sequence to add
     */
    public static addSequence(sequence: PitchNoteSequence): void {
        this.sequences.set(sequence.id, sequence);
    }
    
    /**
     * Get a sequence by ID
     * @param id Sequence ID
     * @returns Sequence or null if not found
     */
    public static getSequenceById(id: string): PitchNoteSequence | null {
        return this.sequences.get(id) || null;
    }
    
    /**
     * Get all sequences
     * @returns Array of all sequences
     */
    public static getAllSequences(): PitchNoteSequence[] {
        return Array.from(this.sequences.values());
    }
    
    /**
     * Get sequences by difficulty
     * @param difficulty Difficulty level (1-5)
     * @returns Array of sequences with the specified difficulty
     */
    public static getSequencesByDifficulty(difficulty: number): PitchNoteSequence[] {
        return Array.from(this.sequences.values())
            .filter(sequence => sequence.difficulty === difficulty);
    }
}
