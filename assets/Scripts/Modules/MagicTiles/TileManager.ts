import { _decorator, Component, Node, Prefab, instantiate, UITransform, Vec3, director } from 'cc';
import { BeatmapManager } from './BeatmapManager';
import { Tile, TileStatus, HitRating } from './Tile';
import { MagicTilesAudioManager } from './AudioManager';
import { TrackNoteInfo } from './MTDefines';
import { MTUIManager } from './MTUIManager';

const { ccclass, property } = _decorator;

/**
 * TileManager for Magic Tiles 3
 * Manages the spawning, movement, and destruction of tiles
 */
@ccclass('TileManager')
export class TileManager extends Component {
    // Reference to the tile prefab
    @property(Prefab)
    tilePrefab: Prefab = null!;

    // Lane container nodes
    @property([Node])
    laneContainers: Node[] = [];

    // Minimum height for tiles to ensure visibility

    // Tile spawn position (Y coordinate)
    @property
    spawnPositionY: number = 800;

    // Tile target position (Y coordinate - the hit zone)
    @property
    targetPositionY: number = -400;

    // How many seconds ahead to spawn tiles
    @property
    lookAheadTime: number = 2.0;

    // Default scroll speed (pixels per second)s    
    @property
    defaultScrollSpeed: number = 600;

    // Current scroll speed
    private scrollSpeed: number = 600;

    // Width of a lane
    @property
    laneWidth: number = 160;

    // Maximum number of tiles to pool
    @property
    maxPoolSize: number = 50;

    // Reference to managers
    private beatmapManager: BeatmapManager = null!;
    private audioManager: MagicTilesAudioManager = null!;

    // Tile object pool
    private tilePool: Tile[] = [];

    // Active tiles
    private activeTiles: Tile[] = [];

    // Track the next note to spawn
    private nextNoteIndex: number = 0;

    // Track the current game time
    private gameTime: number = 0;

    // Track if the game is currently playing
    private isPlaying: boolean = false;

    // Track touched tiles
    private touchedTiles: Map<number, Tile> = new Map();
    private minTileHeight: number = 450.0;

    onLoad() {
        // Get references to managers
        this.beatmapManager = BeatmapManager.instance;
        this.audioManager = MagicTilesAudioManager.instance;

        // Initialize the object pool
        this.initTilePool();

        // Ensure we have the correct number of lane containers
        this.ensureLaneContainers();
    }

    /**
     * Initialize the tile object pool
     */
    private initTilePool() {
        // Clear any existing tiles
        this.tilePool = [];

        // Create the initial pool of tiles
        for (let i = 0; i < this.maxPoolSize; i++) {
            const tileNode = instantiate(this.tilePrefab);
            const tile = tileNode.getComponent(Tile)!;

            // Initialize and hide the tile
            tileNode.active = false;

            // Add to pool
            this.tilePool.push(tile);
        }
    }

    /**
     * Ensure we have the correct number of lane containers
     */
    private ensureLaneContainers() {
        const requiredLanes = 4; // Magic Tiles typically has 4 lanes

        if (this.laneContainers.length < requiredLanes) {
            console.warn(`TileManager needs ${requiredLanes} lane containers, but only ${this.laneContainers.length} were provided.`);

            // Create missing lane containers
            for (let i = this.laneContainers.length; i < requiredLanes; i++) {
                const laneNode = new Node(`Lane_${i}`);
                laneNode.parent = this.node;

                // Position the lane
                laneNode.position = new Vec3((i - requiredLanes / 2 + 0.5) * this.laneWidth, 0, 0);

                // Add to lane containers
                this.laneContainers.push(laneNode);
            }
        }

        //init lands
        this.laneWidth = this.laneContainers[0].getComponent(UITransform)!.width;
    }

    /**
     * Start spawning tiles based on the current beatmap
     */
    startGame() {
        // Reset state
        this.nextNoteIndex = 0;
        this.gameTime = 0.0;
        this.isPlaying = true;
        this.activeTiles = [];
        this.touchedTiles.clear();

        // Calculate optimal scroll speed based on note data
        this.calculateDynamicScrollSpeed();

        // Clear any active tiles
        this.clearActiveTiles();

        // Start the update loop
        director.getScheduler().schedule(this.update, this, 0);
    }

    /**
     * Stop the game
     */
    stopGame() {
        this.isPlaying = false;
        director.getScheduler().unschedule(this.update, this);
        this.clearActiveTiles();
    }

    /**
     * Pause the game
     */
    pauseGame() {
        this.isPlaying = false;
        director.getScheduler().unschedule(this.update, this);
    }

    /**
     * Resume the game
     */
    resumeGame() {
        this.isPlaying = true;
        director.getScheduler().schedule(this.update, this, 0);
    }

    /**
     * Update method called every frame
     * @param dt Delta time since last frame in seconds
     */
    update(dt: number) {
        if (!this.isPlaying) return;

        // Update game time
        this.gameTime += dt;
        MTUIManager.instance.updateSongTimeDisplay(this.gameTime);

        // Spawn tiles that should be visible
        this.spawnTiles();

        // Update active tiles
        this.updateActiveTiles();
    }

    /**
     * Spawn tiles that should be visible based on current time
     */
    private spawnTiles() {
        // Get all notes from the beatmap
        const notes = this.beatmapManager.getNotes();
        if (!notes.length) return;

        // Calculate how far ahead we should spawn tiles
        const spawnTime = this.gameTime + this.lookAheadTime;

        // Spawn all notes that should be visible by now
        while (this.nextNoteIndex < notes.length && notes[this.nextNoteIndex].time <= spawnTime) {
            this.spawnTile(notes[this.nextNoteIndex]);
            this.nextNoteIndex++;
        }
    }

    /**
     * Spawn a single tile
     * @param note The note data to spawn a tile for
     */
    private spawnTile(note: TrackNoteInfo) {
        // Get a tile from te pool
        const tile = this.getTileFromPool();
        if (!tile) {
            console.warn("Tile pool exhausted, cannot spawn more tiles");
            return;
        }

        // Calculate which lane to spawn in
        const lane = note.lane;
        if (lane < 0 || lane >= this.laneContainers.length) {
            console.error(`Invalid lane ${lane} for note ${note.midi}`);
            return;
        }

        // Add the tile to the correct lane
        const laneNode = this.laneContainers[lane];
        tile.node.parent = laneNode;

        // Initialize the tile
        tile.init(
            note,
            lane,
            this.spawnPositionY,
            this.targetPositionY,
            this.laneWidth,
            this.scrollSpeed,
            this.minTileHeight
        );

        // Calculate how long it should take for the tile to reach the target position
        const distance = this.spawnPositionY - this.targetPositionY;
        const travelTime = distance / this.scrollSpeed;

        // Calculate when the tile should arrive at the target (hit time)
        const hitTime = note.time;

        // Calculate when to start the tile moving to arrive at the right time
        const startTime = hitTime - travelTime;
 
        // If we need to start moving immediately
        if (startTime <= this.gameTime) {
            // Start movement immediately
            tile.startMovement(travelTime, startTime);
        } else {
            // Schedule the tile to start moving at the correct time
            const delay = startTime - this.gameTime;
            this.scheduleOnce(() => {
                if (tile.node.active) { // Check if still active
                    tile.startMovement(travelTime, startTime);
                }
            }, delay);
        }

        // Add to active tiles
        this.activeTiles.push(tile);
    }

    /**
     * Update all active tiles
     */
    private updateActiveTiles() {
        // Filter out tiles that are no longer active
        this.activeTiles = this.activeTiles.filter(tile => {
            const status = tile.getStatus();
            return status !== TileStatus.HIT && status !== TileStatus.MISSED && status !== TileStatus.EXPIRED;
        });
    }

    /**
     * Clear all active tiles and return them to the pool
     */
    private clearActiveTiles() {
        for (const tile of this.activeTiles) {
            this.returnTileToPool(tile);
        }
        this.activeTiles = [];
    }

    /**
     * Get a tile from the object pool
     */
    private getTileFromPool(): Tile | null {
        // Check if there are any tiles in the pool
        if (this.tilePool.length === 0) {
            // No tiles available, create a new one if we haven't reached max capacity
            if (this.activeTiles.length < this.maxPoolSize) {
                const tileNode = instantiate(this.tilePrefab);
                const tile = tileNode.getComponent(Tile)!;
                return tile;
            } else {
                return null; // Pool exhausted and at max capacity
            }
        }

        // Get a tile from the pool
        const tile = this.tilePool.pop()!;
        tile.node.active = true;
        return tile;
    }

    /**
     * Return a tile to the object pool
     */
    private returnTileToPool(tile: Tile) {
        // Recycle the tile
        tile.recycle();

        // Add back to pool
        this.tilePool.push(tile);
    }

    /**
     * Handle a touch event in a lane
     * @param laneIndex The index of the lane that was touched
     * @param isTouchStart Whether this is a touch start (true) or touch end (false)
     * @returns The hit rating if a tile was hit
     */
    handleLaneTouch(laneIndex: number, isTouchStart: boolean): HitRating {
        // Find the closest tile in this lane that can be hit
        const hitableTiles = this.activeTiles.filter(tile =>
            tile.getLane() === laneIndex &&
            tile.getStatus() === TileStatus.ACTIVE
        );

        // Sort by closest to target position
        hitableTiles.sort((a, b) => {
            const aNote = a.getNote();
            const bNote = b.getNote();
            if (!aNote || !bNote) return 0;
            return Math.abs(aNote.time - this.gameTime) - Math.abs(bNote.time - this.gameTime);
        });

        if (hitableTiles.length === 0) {
            return HitRating.MISS; // No tiles to hit
        }

        const tile = hitableTiles[0];

        if (isTouchStart) {
            // This is a touch down event
            const rating = tile.tap(this.gameTime);

            // If this is a long press type, store it for the release event
            if (tile.isLongPressType() && rating !== HitRating.MISS) {
                this.touchedTiles.set(laneIndex, tile);
            }

            return rating;
        } else {
            // This is a touch up event - check if we have a stored tile
            const touchedTile = this.touchedTiles.get(laneIndex);
            if (touchedTile && touchedTile.isLongPressType()) {
                this.touchedTiles.delete(laneIndex);
                return touchedTile.release(this.gameTime);
            }

            return HitRating.MISS;
        }
    }

    /**
     * Set the scroll speed for tiles
     * @param speed The new scroll speed in pixels per second
     */
    setScrollSpeed(speed: number) {
        const oldSpeed = this.scrollSpeed;
        this.scrollSpeed = speed;
    }

    /**
     * Get the current scroll speed
     */
    getScrollSpeed(): number {
        return this.scrollSpeed;
    }

    /**
     * Get the number of active tiles
     */
    getActiveTileCount(): number {
        return this.activeTiles.length;
    }

    /**
     * Get the current game time
     */
    getGameTime(): number {
        return this.gameTime;
    }

    /**
     * Set the current game time (useful for syncing with audio)
     */
    setGameTime(time: number) {
        this.gameTime = time;
    }

    /**
     * Calculate optimal scroll speed based on note density and timing
     */
    private calculateDynamicScrollSpeed() {
        // Get all notes from the beatmap
        const notes = this.beatmapManager.getNotes();
        if (!notes || notes.length < 2) {
            // Not enough notes to analyze, use default speed
            this.scrollSpeed = this.defaultScrollSpeed;
            return;
        }

        // Sort notes by time (they should already be sorted, but just to be safe)
        const sortedNotes = [...notes].sort((a, b) => a.time - b.time);

        // Find the minimum time gap between consecutive notes
        let minTimeGap = Number.MAX_VALUE;
        let averageTimeGap = 0;
        let totalGaps = 0;
        let maxNoteDuration = 0;

        for (let i = 1; i < sortedNotes.length; i++) {
            const timeGap = sortedNotes[i].time - sortedNotes[i - 1].time;
            if (timeGap > 0) {
                minTimeGap = Math.min(minTimeGap, timeGap);
                averageTimeGap += timeGap;
                totalGaps++;
            }

            // Track the longest note duration for hol d notes
            if (sortedNotes[i].duration > 0) {
                maxNoteDuration = Math.max(maxNoteDuration, sortedNotes[i].duration);
            }
        }

        // Calculate average time gap
        averageTimeGap = totalGaps > 0 ? averageTimeGap / totalGaps : 1.0;

        // If we couldn't find a valid minimum gap, use default
        if (minTimeGap === Number.MAX_VALUE) {
            minTimeGap = 1.0;
        }

        // Calculate a base speed factor from the minimum time gap
        // The shorter the gap, the slower we want the tiles to move
        // This gives players more time to react to dense patterns
        const speedFactor = Math.min(1.0, Math.sqrt(minTimeGap * 2));

        // Also factor in the average gap to avoid extreme speeds for outliers
        const avgSpeedFactor = Math.min(1.0, Math.sqrt(averageTimeGap));

        // If we have hold notes, consider their duration in the calculation
        // Longer hold notes should generally move slower for better playability
        let durationFactor = 1.0;
        if (maxNoteDuration > 0) {
            // Reduce speed more for extremely long hold notes, but cap the reduction
            durationFactor = Math.max(0.7, 1.0 - (maxNoteDuration * 0.1));
        }

        // Combine all factors, with appropriate weights
        const combinedFactor = (speedFactor * 0.6) + (avgSpeedFactor * 0.25) + (durationFactor * 0.15);

        // Scale the default speed by our factor, with limits
        const minSpeed = this.defaultScrollSpeed * 0.5;  // Don't go below 50% of default
        const maxSpeed = this.defaultScrollSpeed * 1.5;  // Don't go above 150% of default

        const calculatedSpeed = Math.max(minSpeed, Math.min(maxSpeed, this.defaultScrollSpeed * combinedFactor));

        // Use setScrollSpeed to ensure consistent behavior
        // this.setScrollSpeed(calculatedSpeed * 3.0);
        this.setScrollSpeed(calculatedSpeed * 7.0);

        console.log(`Dynamic scroll speed calculated: ${this.scrollSpeed.toFixed(1)} px/s (min gap: ${minTimeGap.toFixed(3)}s, avg gap: ${averageTimeGap.toFixed(3)}s, max duration: ${maxNoteDuration.toFixed(3)}s)`);
    }


}