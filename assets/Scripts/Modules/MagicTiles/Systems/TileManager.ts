import { _decorator, Component, Node, Prefab, instantiate, UITransform, Vec3, director } from 'cc';
import { BeatmapManager } from './BeatmapManager';
import { Tile, TileStatus, HitRating } from '../UI/Tile';
import { MTAudioManager } from './MTAudioManager';
import { TrackNoteInfo } from '../Data/MTDefines';
import { MTUIManager } from './MTUIManager';
import { AudioManager } from '../../../Common/audioManager';

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

    // Tile spawn position (Y coordinate)
    @property
    spawnPositionY: number = 1200;

    // Tile target position (Y coordinate - the hit zone)
    @property
    targetPositionY: number = -400;

    // Position where tiles should be recycled regardless of their state
    @property
    recyclePositionY: number = -1500;

    // How many seconds ahead to spawn tiles
    @property
    lookAheadTime: number = 4.0;

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
    private beatmapManager: BeatmapManager | null = null;
    private audioManager: MTAudioManager | null = null;

    // Tile object pool
    private tilePool: Tile[] = [];

    // Active tiles
    private activeTiles: Tile[] = [];

    // Track the next note to spawn
    private nextNoteIndex: number = 0;

    // Track the current game time
    private gameTime: number = 0;

    // Change isPlaying to a game state enum
    private gameState: 'stopped' | 'playing' | 'paused' = 'stopped';

    // Track if update is scheduled
    private _updateScheduled: boolean = false;

    // Add autoplay flag
    @property
    private isAutoplay: boolean = false;

    // Add bottom position threshold where tiles will be considered missed
    @property
    private missThreshold: number = -450; // Slightly below the target position

    // Track touched tiles
    private touchedTiles: Map<number, Tile> = new Map();
    private minTileHeight: number = 300.0;

    // Replace Map with direct arrays for lane tiles
    private laneArrays: Tile[][] = [];

    // Reusable Vector3 objects to minimize garbage collection
    private tempVec3: Vec3 = new Vec3();
    private lanePositionVec3: Vec3 = new Vec3();

    // Use typed arrays for better performance and memory layout
    private tilePositionsY: Float32Array | null = null;
    private tileIndices: Map<Tile, number> = new Map();
    private nextTileIndex: number = 0;

    /**
     * Initialize the TileManager with dependencies
     * This allows for dependency injection rather than direct singleton usage
     * @param beatmapManager The beatmap manager instance
     * @param audioManager The audio manager instance
     */
    initialize(beatmapManager: BeatmapManager, audioManager: MTAudioManager) {
        this.beatmapManager = beatmapManager;
        this.audioManager = audioManager;
        this.initTilePool();
    }

    protected onLoad(): void {
        // Get references to managers - still use singletons for backward compatibility
        // but prefer using the initialize method for new code
        if (!this.beatmapManager) {
            this.beatmapManager = BeatmapManager.instance;
        }
        if (!this.audioManager) {
            this.audioManager = MTAudioManager.instance;
        }

        // Initialize the object pool
        this.initTilePool();
    }

    start() {
        // Ensure we have the correct number of lane containers
        this.ensureLaneContainers();
    }

    /**
     * Initialize the tile object pool
     */
    private initTilePool() {
        // Clear any existing tiles
        this.tilePool = [];

        // Estimate optimal pool size based on note density and screen size
        const notes = this.beatmapManager?.getNotes();
        if (notes && notes.length > 0) {
            const visibleDistance = this.spawnPositionY - this.recyclePositionY;
            const noteTimeSpan = notes[notes.length - 1].time - notes[0].time;
            // Prevent division by zero
            const scrollSpeedToUse = this.scrollSpeed || this.defaultScrollSpeed;
            const estimatedVisibleNotes = Math.ceil(notes.length * (visibleDistance / (scrollSpeedToUse * Math.max(0.1, noteTimeSpan))));
            this.maxPoolSize = Math.max(this.maxPoolSize, estimatedVisibleNotes + 10); // Add buffer
            console.log(`Dynamic pool size calculated: ${this.maxPoolSize} (estimated visible: ${estimatedVisibleNotes})`);
        }

        // Create the initial pool of tiles
        for (let i = 0; i < this.maxPoolSize; i++) {
            const tileNode = instantiate(this.tilePrefab);
            const tile = tileNode.getComponent(Tile)!;

            // Initialize and hide the tile
            tileNode.active = false;

            // Add to pool
            this.tilePool.push(tile);
        }

        // Initialize typed arrays for position data
        this.tilePositionsY = new Float32Array(this.maxPoolSize);
        this.tileIndices = new Map();
        this.nextTileIndex = 0;

        // Initialize lane arrays
        this.initLaneArrays();
    }

    /**
     * Initialize lane arrays for faster lookups
     */
    private initLaneArrays() {
        const laneCount = Math.max(4, this.laneContainers.length);
        this.laneArrays = new Array(laneCount);
        for (let i = 0; i < laneCount; i++) {
            this.laneArrays[i] = [];
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

                // Position the lane using reusable Vec3
                this.lanePositionVec3.set((i - requiredLanes / 2 + 0.5) * this.laneWidth, 0, 0);
                laneNode.position = this.lanePositionVec3;

                // Add to lane containers
                this.laneContainers.push(laneNode);
            }
        }

        //init lands
        this.laneWidth = this.laneContainers[0].getComponent(UITransform)!.width;

        // Initialize lane arrays
        this.initLaneArrays();
    }

    initGame() {
        this.clearActiveTiles();

        // Reset state
        this.nextNoteIndex = 0;
        this.gameTime = 0.0;
        this.activeTiles = [];
        this.touchedTiles.clear();

        // Reset lane arrays
        for (let i = 0; i < this.laneArrays.length; i++) {
            this.laneArrays[i].length = 0;
        }
        // Calculate optimal scroll speed based on note data
        this.calculateDynamicScrollSpeed();
        // Clear any active tiles
    }

    /**
     * Start spawning tiles based on the current beatmap
     */
    startGame() {
        this.gameState = 'playing';
        // Only schedule if not already scheduled
        if (!this._updateScheduled) {
            director.getScheduler().schedule(this.update, this, 0);
            this._updateScheduled = true;
        }
    }

    /**
     * Stop the game
     */
    stopGame() {
        this.gameState = 'stopped';

        // Explicitly unschedule when stopping the game completely
        if (this._updateScheduled) {
            director.getScheduler().unschedule(this.update, this);
            this._updateScheduled = false;
        }

        this.clearActiveTiles();
    }

    /**
     * Pause the game
     */
    pauseGame() {
        this.gameState = 'paused';
        // Keep the update scheduled but it will early-return based on state
    }

    /**
     * Resume the game
     */
    resumeGame() {
        this.gameState = 'playing';

        // Ensure update is scheduled
        if (!this._updateScheduled) {
            director.getScheduler().schedule(this.update, this, 0);
            this._updateScheduled = true;
        }
    }

    /**
     * Update method called every frame
     * @param dt Delta time since last frame in seconds
     */
    update(dt: number) {
        // Early return based on state
        if (this.gameState !== 'playing') return;
        this.gameTime = this.audioManager.getEstimatedAudioTime();

        // Throttle UI updates to reduce overhead - update every ~3 frames (50ms)
        if (Math.random() < 0.03) {
            MTUIManager.instance.updateSongTimeDisplay(this.gameTime);
        }

        // Spawn tiles that should be visible
        this.spawnTiles();
        // Use balanced update for better performance
        this.balancedUpdateActiveTiles();
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
     * Helper method to update tile position without creating new Vec3 objects
     * @param tile The tile to update
     * @param posY The Y position to set
     */
    private updateTilePosition(tile: Tile, posY: number) {
        // Reuse the same Vec3 object instead of creating a new one
        this.tempVec3.set(0, posY, 0);
        tile.node.position = this.tempVec3;
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
        tile.setBufferHeight(this.minTileHeight / 2.0);

        // Assign an index in the position arrays
        const tileIndex = this.nextTileIndex % this.maxPoolSize;
        this.tileIndices.set(tile, tileIndex);
        this.tilePositionsY[tileIndex] = this.spawnPositionY;
        this.nextTileIndex++;

        // Position the tile using our reusable vector
        this.updateTilePosition(tile, this.spawnPositionY);

        // Calculate the total distance from spawn to miss threshold (instead of just to target)
        const totalDistance = this.spawnPositionY - this.recyclePositionY + tile.getTileHeight() + 500.0; //500 is buffer for moving

        // Calculate how long it should take for the tile to reach the target position
        const distanceToTarget = this.spawnPositionY - this.targetPositionY;
        const travelTimeToTarget = distanceToTarget / this.scrollSpeed;

        // Calculate total travel time to reach the miss threshold
        const totalTravelTime = totalDistance / this.scrollSpeed;

        // Calculate when the tile should arrive at the target (hit time)
        const hitTime = note.time;

        // Calculate when to start the tile moving to arrive at the right time
        const startTime = hitTime - travelTimeToTarget;

        // If we need to start moving immediately
        if (startTime <= this.gameTime) {
            // Start movement immediately with the total travel time to the miss threshold
            // This will make the tile continue past the target position
            tile.startMovement(totalTravelTime, startTime);
        } else {
            // Schedule the tile to start moving at the correct time
            const delay = startTime - this.gameTime;
            this.scheduleOnce(() => {
                if (tile.node.active) { // Check if still active
                    tile.startMovement(totalTravelTime, startTime);
                }
            }, delay);
        }

        // Add to active tiles
        this.activeTiles.push(tile);

        // Add to lane array for faster lookups
        if (lane >= 0 && lane < this.laneArrays.length) {
            this.laneArrays[lane].push(tile);
        }
    }

    /**
     * Update active tiles with load balancing to maintain consistent FPS
     */
    private balancedUpdateActiveTiles() {
        // Check for tiles that need to be auto-played
        if (this.isAutoplay) {
            this.handleAutoplay();
        }

        let i = 0;
        while (i < this.activeTiles.length) {
            const tile = this.activeTiles[i];
            // Check for missed tiles
            if (tile.getStatus() === TileStatus.ACTIVE && tile.node.position.y <= this.missThreshold) {
                // Mark the tile as missed
                tile.miss();
            }

            // Check if the tile has passed the recycle position
            if (tile.node.position.y + tile.getTileHeight() <= this.recyclePositionY) {
                // For HOLD notes that are currently pressed, release them before recycling
                if (tile.getStatus() === TileStatus.HOLDING && tile.isLongPressType()) {
                    // Force release of the hold note
                    tile.release(this.gameTime);
                }

                // Return the tile to the pool
                this.returnTileToPool(tile);

                // Remove from active tiles without creating a new array
                this.activeTiles[i] = this.activeTiles[this.activeTiles.length - 1];
                this.activeTiles.pop();
                break;
            } else {
                // Only increment if we didn't remove an item
                i++;
            }
        }
    }


    /**
     * Handle autoplay functionality to automatically hit tiles at the right time
     */
    private handleAutoplay(): void {
        if (!this.isAutoplay) return;

        // Get all active tiles that are close to the target position
        const autoplayTiles = this.activeTiles.filter(tile => {
            if (tile.getStatus() !== TileStatus.ACTIVE) return false;

            const note = tile.getNote();
            if (!note) return false;

            // Check if the tile is within the autoplay hit window
            // For regular notes, tap when they're at or just before the hit time
            // For hold notes, tap them slightly earlier to ensure natural timing
            const timeDiff = note.time - this.gameTime;
            return timeDiff <= 0.05; // Within 50ms window (detect slightly ahead of time)
        });

        // Process each autoplayable tile
        for (const tile of autoplayTiles) {
            const laneIndex = tile.getLane();
            const note = tile.getNote();

            if (!note) continue;

            // Handle different tile types
            if (tile.isLongPressType()) {
                // For hold notes, store them to release later
                if (!this.touchedTiles.has(laneIndex)) {
                    // Tap the tile
                    const hitRating = tile.tap(this.gameTime);
                    // Store it for later release only if it was successfully tapped
                    if (hitRating !== HitRating.MISS) {
                        this.touchedTiles.set(laneIndex, tile);


                    }
                }
            } else {
                // For regular tap notes, just tap them
                tile.tap(this.gameTime);
            }
        }

        // Check for held notes that need to be released
        this.touchedTiles.forEach((tile, laneIndex) => {
            const note = tile.getNote();
            if (!note || tile.getStatus() !== TileStatus.HOLDING) {
                // Remove from tracked tiles if not in pressed state
                this.touchedTiles.delete(laneIndex);
                return;
            }

            // Calculate when to release the hold note
            // Release exactly at the end of the hold duration for perfect timing
            const releaseTime = note.time + note.duration;

            // Check if it's time to release the held note
            if (releaseTime <= this.gameTime) {
                tile.release(this.gameTime);
                this.touchedTiles.delete(laneIndex);
            }
        });
    }

    /**
     * Toggle autoplay mode
     * @param enable Whether to enable or disable autoplay
     */
    toggleAutoplay(enable?: boolean): void {
        if (enable !== undefined) {
            this.isAutoplay = enable;
        } else {
            this.isAutoplay = !this.isAutoplay;
        }
        console.log(`Autoplay ${this.isAutoplay ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if autoplay is enabled
     */
    isAutoplayEnabled(): boolean {
        return this.isAutoplay;
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
        // Remove from touchedTiles tracking if it's a HOLD note being tracked
        const laneIndex = tile.getLane();
        if (this.touchedTiles.has(laneIndex) && this.touchedTiles.get(laneIndex) === tile) {
            // Make sure to release the note if it's in HOLDING state
            if (tile.getStatus() === TileStatus.HOLDING) {
                tile.release(this.gameTime);
            }
            this.touchedTiles.delete(laneIndex);
        }

        // Recycle the tile
        tile.recycle();

        // Add back to pool
        this.tilePool.push(tile);

        // Remove from lane array
        if (laneIndex >= 0 && laneIndex < this.laneArrays.length) {
            const laneArray = this.laneArrays[laneIndex];
            const index = laneArray.indexOf(tile);
            if (index !== -1) {
                // Fast removal without creating a new array
                laneArray[index] = laneArray[laneArray.length - 1];
                laneArray.pop();
            }
        }

        // Remove from position tracking
        this.tileIndices.delete(tile);
    }

    /**
     * Handle a touch event in a lane
     * @param laneIndex The index of the lane that was touched
     * @param isTouchStart Whether this is a touch start (true) or touch end (false)
     * @returns The hit rating if a tile was hit
     */
    handleLaneTouch(laneIndex: number, isTouchStart: boolean): HitRating {
        if (!isTouchStart) {
            // This is a touch up event - check if we have a stored tile
            const touchedTile = this.touchedTiles.get(laneIndex);
            if (touchedTile && touchedTile.isLongPressType()) {
                this.touchedTiles.delete(laneIndex);
                return touchedTile.release(this.gameTime);
            }
        }

        // Get tiles only for the specific lane using our optimized array
        const laneTiles = (laneIndex >= 0 && laneIndex < this.laneArrays.length)
            ? this.laneArrays[laneIndex]
            : [];

        // Find hitable tiles in this lane
        const hitableTiles = laneTiles.filter(tile =>
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
        }

        return HitRating.MISS;
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
     * Optimized version with reduced math operations
     */
    private calculateDynamicScrollSpeed() {
        // Get all notes from the beatmap
        const notes = this.beatmapManager.getNotes();
        if (!notes || notes.length < 2) {
            // Not enough notes to analyze, use default speed
            this.scrollSpeed = this.defaultScrollSpeed;
            return;
        }

        // Precalculate constants
        const minSpeed = this.defaultScrollSpeed * 0.5;  // Don't go below 50% of default
        const maxSpeed = this.defaultScrollSpeed * 1.5;  // Don't go above 150% of default

        // Sort notes by time (they should already be sorted, but just to be safe)
        // We'll avoid sorting if the notes already appear to be in order
        let isSorted = true;
        for (let i = 1; i < notes.length; i++) {
            if (notes[i].time < notes[i - 1].time) {
                isSorted = false;
                break;
            }
        }

        // Only sort if necessary
        const sortedNotes = isSorted ? notes : [...notes].sort((a, b) => a.time - b.time);

        // Find the minimum time gap between consecutive notes more efficiently
        let minTimeGap = Number.MAX_VALUE;
        let totalTimeGap = 0;
        let totalGaps = 0;
        let maxNoteDuration = 0;

        // Single loop to calculate all metrics
        for (let i = 1; i < sortedNotes.length; i++) {
            const timeGap = sortedNotes[i].time - sortedNotes[i - 1].time;
            if (timeGap > 0) {
                if (timeGap < minTimeGap) {
                    minTimeGap = timeGap;
                }
                totalTimeGap += timeGap;
                totalGaps++;
            }

            // Track the longest note duration for hold notes
            const duration = sortedNotes[i].duration;
            if (duration > maxNoteDuration) {
                maxNoteDuration = duration;
            }
        }

        // Calculate average time gap
        const averageTimeGap = totalGaps > 0 ? totalTimeGap / totalGaps : 1.0;

        // If we couldn't find a valid minimum gap, use default
        if (minTimeGap === Number.MAX_VALUE) {
            minTimeGap = 1.0;
        }

        // Calculate speed factors without expensive square roots
        // Approximate sqrt(x) with a faster but still reasonable calculation
        // We'll use a simple linear mapping instead of sqrt for better performance
        const speedFactor = Math.min(1.0, minTimeGap * 0.7 + 0.3);
        const avgSpeedFactor = Math.min(1.0, averageTimeGap * 0.5 + 0.5);

        // For hold notes, calculate a simple duration factor
        let durationFactor = 1.0;
        if (maxNoteDuration > 0) {
            // Use simple linear scaling, capped at sensible values
            durationFactor = Math.max(0.7, 1.0 - (maxNoteDuration * 0.1));
        }

        // Combine all factors with appropriate weights
        const combinedFactor = (speedFactor * 0.6) + (avgSpeedFactor * 0.25) + (durationFactor * 0.15);

        // Scale the default speed by our factor, with limits
        const calculatedSpeed = minSpeed + (maxSpeed - minSpeed) * combinedFactor;

        // Use setScrollSpeed to ensure consistent behavior
        this.setScrollSpeed(calculatedSpeed * 2.5);
    }

    /**
     * Set up a beginning tile that the player must tap to start the game
     */
    setupBeginningTile() {
        // Clear any existing tiles
        this.clearActiveTiles();

        // Set game state to a ready state but not fully playing
        this.gameState = 'paused';

        // Choose a random lane for the beginning tile (typically middle lane for better UX)
        const lane = Math.min(Math.floor(this.laneContainers.length / 2), this.laneContainers.length - 1);

        // Create a special beginning tile at the hit line
        this.createBeginningTile(lane);
    }

    /**
     * Create a special beginning tile at the hit line
     * @param lane The lane to place the beginning tile in
     */
    private createBeginningTile(lane: number) {
        // Get a tile from the pool
        const tile = this.getTileFromPool();
        if (!tile) {
            console.error("Failed to create beginning tile - pool empty");
            return;
        }

        // Create a simple note for the beginning tile
        const beginningNote = {
            midi: 60, // Middle C
            time: 0,
            lane: lane,
            type: 0, // Regular tap note (NoteType.TAP)
            duration: 0.3,
            durationTicks: 0,
            velocity: 100
        };

        // Position the tile at the hit line
        const laneContainer = this.laneContainers[lane];
        tile.node.parent = laneContainer;
        const yPos = this.targetPositionY; // Position slightly above the hit line for visibility

        // Initialize the tile with special settings
        tile.init(beginningNote, lane, yPos, yPos, this.laneWidth, this.scrollSpeed, this.minTileHeight);
        tile.setBufferHeight(this.minTileHeight / 2.0);
        tile.setBeginningNodeActive(true);

        // Set a special tag to identify this tile
        tile.node.name = "beginning_tile";

        // Add to active tiles
        this.activeTiles.push(tile);

        // Add to lane array
        if (lane >= 0 && lane < this.laneArrays.length) {
            this.laneArrays[lane].push(tile);
        }
    }

    /**
     * Check if the beginning tile was tapped
     * @param laneIndex The lane that was tapped
     * @returns True if the beginning tile was tapped
     */
    checkBeginningTileTap(laneIndex: number): boolean {
        // Find the beginning tile
        for (let i = 0; i < this.activeTiles.length; i++) {
            const tile = this.activeTiles[i];
            if (tile.node.name === "beginning_tile" && tile.getLane() === laneIndex) {
                // Remove the beginning tile
                tile.startMovement(1.0, this.gameTime);
                return true;
            }
        }

        return false;
    }

    /**
     * Remove a specific tile
     * @param tile The tile to remove
     */
    private removeTile(tile: Tile) {
        // Remove from active tiles
        const index = this.activeTiles.indexOf(tile);
        if (index >= 0) {
            this.activeTiles.splice(index, 1);
        }

        // Remove from lane array
        const lane = tile.getLane();
        if (lane >= 0 && lane < this.laneArrays.length) {
            const laneIndex = this.laneArrays[lane].indexOf(tile);
            if (laneIndex >= 0) {
                this.laneArrays[lane].splice(laneIndex, 1);
            }
        }

        // Return to pool
        this.returnTileToPool(tile);
    }
}