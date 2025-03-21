import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Enum representing different note types
 */
export enum AuditionNoteType {
    LEFT = 0,
    RIGHT = 1,
}

/**
 * Object pooling system for rhythm game notes
 * Manages the creation, reuse, and recycling of note objects for optimal performance
 */
@ccclass('AuditionNotePool')
export class AuditionNotePool extends Component {
    // Prefabs for different note types
    @property(Prefab)
    private leftNotePrefab: Prefab = null;

    @property(Prefab)
    private rightNotePrefab: Prefab = null;

    // Pool configuration
    @property
    private initialPoolSize: number = 20;

    @property
    private expandPoolAmount: number = 10;

    // Object pools for each note type
    private leftNotePool: Node[] = [];
    private rightNotePool: Node[] = [];

    // Active notes currently in use
    private activeNotes: Map<number, Node> = new Map();

    // Unique ID counter for notes
    private nextNoteId: number = 0;

    onLoad() {
        // Initialize the pools
        this.initializePools();
    }

    /**
     * Initialize note pools with initial sizes
     */
    private initializePools(): void {
        // Create pools for each note type
        if (this.leftNotePrefab) {
            this.createPool(AuditionNoteType.LEFT, this.initialPoolSize);
        }

        if (this.rightNotePrefab) {
            this.createPool(AuditionNoteType.RIGHT, this.initialPoolSize);
        }
    }

    /**
     * Create a pool of note objects
     * @param noteType The type of note
     * @param size The initial size of the pool
     */
    private createPool(noteType: AuditionNoteType, size: number): void {
        const pool = this.getPoolForType(noteType);
        const prefab = this.getPrefabForType(noteType);

        if (!prefab) {
            console.error(`No prefab defined for note type: ${noteType}`);
            return;
        }

        // Create notes and add to pool
        for (let i = 0; i < size; i++) {
            const note = instantiate(prefab);
            note.parent = this.node;
            note.active = false;
            pool.push(note);
        }

        console.log(`Created pool for note type ${noteType} with ${size} notes`);
    }

    /**
     * Get a note from the pool, creating new ones if needed
     * @param noteType The type of note to get
     * @returns A reference to the note object and its unique ID
     */
    public getNote(noteType: AuditionNoteType): { id: number, node: Node } {
        const pool = this.getPoolForType(noteType);

        // If pool is empty, expand it
        if (pool.length === 0) {
            this.expandPool(noteType);
        }

        // Get a note from the pool
        const noteNode = pool.pop();
        if (!noteNode) {
            console.error(`Failed to get note of type ${noteType} from pool`);
            return null;
        }

        // Prepare note for use
        noteNode.active = true;

        // Generate unique ID and track the active note
        const noteId = this.nextNoteId++;
        this.activeNotes.set(noteId, noteNode);

        return { id: noteId, node: noteNode };
    }

    /**
     * Return a note to the pool
     * @param noteId The unique ID of the note
     */
    public recycleNote(noteId: number): void {
        const noteNode = this.activeNotes.get(noteId);
        if (!noteNode) {
            console.warn(`Note with ID ${noteId} not found in active notes`);
            return;
        }

        // Reset note properties
        noteNode.active = false;
        noteNode.setPosition(0, 0, 0);
        noteNode.setScale(1, 1, 1);

        // Get the note type and return to appropriate pool
        const noteType = this.getNoteTypeFromNode(noteNode);
        const pool = this.getPoolForType(noteType);

        // Add back to pool and remove from active notes
        pool.push(noteNode);
        this.activeNotes.delete(noteId);
    }

    /**
     * Recycle all active notes at once (for scene changes or resets)
     */
    public recycleAllNotes(): void {
        // Create a copy of the IDs to avoid modification during iteration
        const noteIds = Array.from(this.activeNotes.keys());

        // Recycle each note
        noteIds.forEach(id => this.recycleNote(id));
    }

    /**
     * Expand a note pool when it runs out of objects
     * @param noteType The type of note pool to expand
     */
    private expandPool(noteType: AuditionNoteType): void {
        console.log(`Expanding pool for note type ${noteType} with ${this.expandPoolAmount} more notes`);
        this.createPool(noteType, this.expandPoolAmount);
    }

    /**
     * Get the appropriate pool for a note type
     * @param noteType The type of note
     * @returns The pool array for the note type
     */
    private getPoolForType(noteType: AuditionNoteType): Node[] {
        switch (noteType) {
            case AuditionNoteType.LEFT:
                return this.leftNotePool;
            case AuditionNoteType.RIGHT:
                return this.rightNotePool;
            default:
                console.error(`Unknown note type: ${noteType}`);
                return null;
        }
    }

    /**
     * Get the appropriate prefab for a note type
     * @param noteType The type of note
     * @returns The prefab for the note type
     */
    private getPrefabForType(noteType: AuditionNoteType): Prefab {
        switch (noteType) {
            case AuditionNoteType.LEFT:
                return this.leftNotePrefab;
            case AuditionNoteType.RIGHT:
                return this.rightNotePrefab;
            default:
                console.error(`Unknown note type: ${noteType}`);
                return null;
        }
    }

    /**
     * Determine the note type from a node
     * This implementation uses a simple name-based approach, but you could use
     * a custom component or other method to identify note types
     * @param noteNode The note node to check
     * @returns The identified note type
     */
    private getNoteTypeFromNode(noteNode: Node): AuditionNoteType {
        // This is a simple implementation; you might want to improve this
        // based on how your notes are structured
        const nodeName = noteNode.name.toLowerCase();

        if (nodeName.includes('left')) {
            return AuditionNoteType.LEFT;
        }

        return AuditionNoteType.RIGHT;
    }

    /**
     * Get the count of active notes
     * @returns The number of active notes
     */
    public getActiveNoteCount(): number {
        return this.activeNotes.size;
    }

    /**
     * Get available notes in the pool
     * @param noteType The type of note
     * @returns The number of notes available in the pool
     */
    public getAvailableNoteCount(noteType: AuditionNoteType): number {
        const pool = this.getPoolForType(noteType);
        return pool ? pool.length : 0;
    }
} 