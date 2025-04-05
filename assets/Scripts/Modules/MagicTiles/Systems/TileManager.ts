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
    //#region Properties

    //#region Prefabs and References
    @property({
        type: Prefab,
        tooltip: 'Reference to the tile prefab',
        group: {
            name: 'References',
            id: '1'
        }
    })
    tilePrefab: Prefab = null!;

    @property({
        type: [Node],
        tooltip: 'Lane container nodes',
        group: {
            name: 'References',
            id: '1'
        }
    })
    laneContainers: Node[] = [];
    //#endregion

    //#region Position Settings
    @property({
        tooltip: 'Tile spawn position (Y coordinate)',
        group: {
            name: 'Position Settings',
            id: '2'
        }
    })
    spawnPositionY: number = 1200;

    @property({
        tooltip: 'Tile target position (Y coordinate - the hit zone)',
        group: {
            name: 'Position Settings',
            id: '2'
        }
    })
    targetPositionY: number = -400;

    @property({
        tooltip: 'Position where tiles should be recycled',
        group: {
            name: 'Position Settings',
            id: '2'
        }
    })
    recyclePositionY: number = -1500;

    @property({
        tooltip: 'Position threshold for missed tiles',
        group: {
            name: 'Position Settings',
            id: '2'
        }
    })
    missThreshold: number = -450;
    //#endregion

    //#region Gameplay Settings
    @property({
        tooltip: 'How many seconds ahead to spawn tiles',
        group: {
            name: 'Gameplay Settings',
            id: '3'
        }
    })
    lookAheadTime: number = 4.0;

    @property({
        tooltip: 'Default scroll speed (pixels per second)',
        group: {
            name: 'Gameplay Settings',
            id: '3'
        }
    })
    defaultScrollSpeed: number = 600;

    @property({
        tooltip: 'Width of a lane',
        group: {
            name: 'Gameplay Settings',
            id: '3'
        }
    })
    laneWidth: number = 160;

    @property({
        tooltip: 'Maximum number of tiles to pool',
        group: {
            name: 'Gameplay Settings',
            id: '3'
        }
    })
    maxPoolSize: number = 50;

    @property({
        tooltip: 'Enable autoplay mode',
        group: {
            name: 'Gameplay Settings',
            id: '3'
        }
    })
    private isAutoplay: boolean = false;
    //#endregion

    //#region Private Variables
    private scrollSpeed: number = 600;
    private beatmapManager: BeatmapManager | null = null;
    private audioManager: MTAudioManager | null = null;
    private tilePool: Tile[] = [];
    private activeTiles: Tile[] = [];
    private nextNoteIndex: number = 0;
    private gameTime: number = 0;
    private gameState: 'stopped' | 'playing' | 'paused' = 'stopped';
    private _updateScheduled: boolean = false;
    private touchedTiles: Map<number, Tile> = new Map();
    private minTileHeight: number = 300.0;
    private tempVec3: Vec3 = new Vec3();
    private lanePositionVec3: Vec3 = new Vec3();
    private tilePositionsY: Float32Array | null = null;
    private tileIndices: Map<Tile, number> = new Map();
    private nextTileIndex: number = 0;
    //#endregion

    //#endregion Properties

    //#region Lifecycle Methods
    protected onLoad(): void {
        if (!this.beatmapManager) {
            this.beatmapManager = BeatmapManager.instance;
        }
        if (!this.audioManager) {
            this.audioManager = MTAudioManager.instance;
        }
        this.initTilePool();
    }

    start() {
        this.ensureLaneContainers();
    }

    update(dt: number) {
        if (this.gameState !== 'playing') return;
        this.gameTime = this.audioManager.getEstimatedAudioTime();

        if (Math.random() < 0.03) {
            MTUIManager.instance.updateSongTimeDisplay(this.gameTime);
        }

        this.spawnTiles();
        this.balancedUpdateActiveTiles();
    }
    //#endregion

    //#region Initialization Methods
    initialize(beatmapManager: BeatmapManager, audioManager: MTAudioManager) {
        this.beatmapManager = beatmapManager;
        this.audioManager = audioManager;
        this.initTilePool();
    }

    private initTilePool() {
        this.tilePool = [];

        const notes = this.beatmapManager?.getNotes();
        if (notes && notes.length > 0) {
            const visibleDistance = this.spawnPositionY - this.recyclePositionY;
            const noteTimeSpan = notes[notes.length - 1].time - notes[0].time;
            const scrollSpeedToUse = this.scrollSpeed || this.defaultScrollSpeed;
            const estimatedVisibleNotes = Math.ceil(notes.length * (visibleDistance / (scrollSpeedToUse * Math.max(0.1, noteTimeSpan))));
            this.maxPoolSize = Math.max(this.maxPoolSize, estimatedVisibleNotes + 10);
            console.log(`Dynamic pool size calculated: ${this.maxPoolSize} (estimated visible: ${estimatedVisibleNotes})`);
        }

        for (let i = 0; i < this.maxPoolSize; i++) {
            const tileNode = instantiate(this.tilePrefab);
            const tile = tileNode.getComponent(Tile)!;
            tileNode.active = false;
            this.tilePool.push(tile);
        }

        this.tilePositionsY = new Float32Array(this.maxPoolSize);
        this.tileIndices = new Map();
        this.nextTileIndex = 0;
    }

    private ensureLaneContainers() {
        const requiredLanes = 4;

        if (this.laneContainers.length < requiredLanes) {
            console.warn(`TileManager needs ${requiredLanes} lane containers, but only ${this.laneContainers.length} were provided.`);

            for (let i = this.laneContainers.length; i < requiredLanes; i++) {
                const laneNode = new Node(`Lane_${i}`);
                laneNode.parent = this.node;
                this.lanePositionVec3.set((i - requiredLanes / 2 + 0.5) * this.laneWidth, 0, 0);
                laneNode.position = this.lanePositionVec3;
                this.laneContainers.push(laneNode);
            }
        }

        this.laneWidth = this.laneContainers[0].getComponent(UITransform)!.width;
    }
    //#endregion

    //#region Game State Management
    initGame() {
        this.clearActiveTiles();
        this.nextNoteIndex = 0;
        this.gameTime = 0.0;
        this.activeTiles = [];
        this.touchedTiles.clear();
        this.calculateDynamicScrollSpeed();
    }

    startGame() {
        this.gameState = 'playing';
        if (!this._updateScheduled) {
            director.getScheduler().schedule(this.update, this, 0);
            this._updateScheduled = true;
        }
    }

    stopGame() {
        this.gameState = 'stopped';
        if (this._updateScheduled) {
            director.getScheduler().unschedule(this.update, this);
            this._updateScheduled = false;
        }
        this.clearActiveTiles();
    }

    pauseGame() {
        this.gameState = 'paused';
    }

    resumeGame() {
        this.gameState = 'playing';
        if (!this._updateScheduled) {
            director.getScheduler().schedule(this.update, this, 0);
            this._updateScheduled = true;
        }
    }
    //#endregion

    //#region Tile Management
    private spawnTiles() {
        const notes = this.beatmapManager.getNotes();
        if (!notes.length) return;

        const spawnTime = this.gameTime + this.lookAheadTime;

        while (this.nextNoteIndex < notes.length && notes[this.nextNoteIndex].time <= spawnTime) {
            this.spawnTile(notes[this.nextNoteIndex]);
            this.nextNoteIndex++;
        }
    }

    private updateTilePosition(tile: Tile, posY: number) {
        this.tempVec3.set(0, posY, 0);
        tile.node.position = this.tempVec3;
    }

    private spawnTile(note: TrackNoteInfo) {
        const tile = this.getTileFromPool();
        if (!tile) {
            console.warn("Tile pool exhausted, cannot spawn more tiles");
            return;
        }

        const lane = note.lane;
        if (lane < 0 || lane >= this.laneContainers.length) {
            console.error(`Invalid lane ${lane} for note ${note.midi}`);
            return;
        }

        const laneNode = this.laneContainers[lane];
        tile.node.parent = laneNode;

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

        const tileIndex = this.nextTileIndex % this.maxPoolSize;
        this.tileIndices.set(tile, tileIndex);
        this.tilePositionsY[tileIndex] = this.spawnPositionY;
        this.nextTileIndex++;

        this.updateTilePosition(tile, this.spawnPositionY);

        const totalDistance = this.spawnPositionY - this.recyclePositionY + tile.getTileHeight() + 500.0;
        const distanceToTarget = this.spawnPositionY - this.targetPositionY;
        const travelTimeToTarget = distanceToTarget / this.scrollSpeed;
        const totalTravelTime = totalDistance / this.scrollSpeed;
        const hitTime = note.time;
        const startTime = hitTime - travelTimeToTarget;

        if (startTime <= this.gameTime) {
            tile.startMovement(totalTravelTime, startTime);
        } else {
            const delay = startTime - this.gameTime;
            this.scheduleOnce(() => {
                if (tile.node.active) {
                    tile.startMovement(totalTravelTime, startTime);
                }
            }, delay);
        }

        this.activeTiles.push(tile);
    }

    private balancedUpdateActiveTiles() {
        if (this.isAutoplay) {
            this.handleAutoplay();
        }

        let i = 0;
        while (i < this.activeTiles.length) {
            const tile = this.activeTiles[i];
            if (tile.getStatus() === TileStatus.ACTIVE && tile.node.position.y <= this.missThreshold) {
                tile.miss();
            }

            if (tile.node.position.y + tile.getTileHeight() <= this.recyclePositionY) {
                if (tile.getStatus() === TileStatus.HOLDING && tile.isLongPressType()) {
                    tile.release(this.gameTime);
                }

                this.returnTileToPool(tile);
                this.activeTiles[i] = this.activeTiles[this.activeTiles.length - 1];
                this.activeTiles.pop();
                break;
            } else {
                i++;
            }
        }
    }
    //#endregion

    //#region Autoplay Management
    private handleAutoplay(): void {
        if (!this.isAutoplay) return;

        const autoplayTiles = this.activeTiles.filter(tile => {
            if (tile.getStatus() !== TileStatus.ACTIVE) return false;

            const note = tile.getNote();
            if (!note) return false;

            const timeDiff = note.time - this.gameTime;
            return timeDiff <= 0.05;
        });

        for (const tile of autoplayTiles) {
            const laneIndex = tile.getLane();
            const note = tile.getNote();

            if (!note) continue;

            if (tile.isLongPressType()) {
                if (!this.touchedTiles.has(laneIndex)) {
                    const hitRating = tile.tap(this.gameTime);
                    if (hitRating !== HitRating.MISS) {
                        this.touchedTiles.set(laneIndex, tile);
                    }
                }
            } else {
                tile.tap(this.gameTime);
            }
        }

        this.touchedTiles.forEach((tile, laneIndex) => {
            const note = tile.getNote();
            if (!note || tile.getStatus() !== TileStatus.HOLDING) {
                this.touchedTiles.delete(laneIndex);
                return;
            }

            const releaseTime = note.time + note.duration;

            if (releaseTime <= this.gameTime) {
                tile.release(this.gameTime);
                this.touchedTiles.delete(laneIndex);
            }
        });
    }

    toggleAutoplay(enable?: boolean): void {
        if (enable !== undefined) {
            this.isAutoplay = enable;
        } else {
            this.isAutoplay = !this.isAutoplay;
        }
        console.log(`Autoplay ${this.isAutoplay ? 'enabled' : 'disabled'}`);
    }

    isAutoplayEnabled(): boolean {
        return this.isAutoplay;
    }
    //#endregion

    //#region Pool Management
    private clearActiveTiles() {
        for (const tile of this.activeTiles) {
            this.returnTileToPool(tile);
        }
        this.activeTiles = [];
    }

    private getTileFromPool(): Tile | null {
        if (this.tilePool.length === 0) {
            if (this.activeTiles.length < this.maxPoolSize) {
                const tileNode = instantiate(this.tilePrefab);
                const tile = tileNode.getComponent(Tile)!;
                return tile;
            } else {
                return null;
            }
        }

        const tile = this.tilePool.pop()!;
        tile.node.active = true;
        return tile;
    }

    private returnTileToPool(tile: Tile) {
        const laneIndex = tile.getLane();
        if (this.touchedTiles.has(laneIndex) && this.touchedTiles.get(laneIndex) === tile) {
            if (tile.getStatus() === TileStatus.HOLDING) {
                tile.release(this.gameTime);
            }
            this.touchedTiles.delete(laneIndex);
        }

        tile.recycle();
        this.tilePool.push(tile);
        this.tileIndices.delete(tile);
    }
    //#endregion

    //#region Input Handling
    handleLaneTouch(laneIndex: number, isTouchStart: boolean): HitRating {
        if (!isTouchStart) {
            const touchedTile = this.touchedTiles.get(laneIndex);
            if (touchedTile && touchedTile.isLongPressType()) {
                this.touchedTiles.delete(laneIndex);
                return touchedTile.release(this.gameTime);
            }
        }

        const hitableTiles = this.activeTiles.filter(tile => 
            tile.getLane() === laneIndex && 
            tile.getStatus() === TileStatus.ACTIVE
        );

        hitableTiles.sort((a, b) => {
            const aNote = a.getNote();
            const bNote = b.getNote();
            if (!aNote || !bNote) return 0;
            return Math.abs(aNote.time - this.gameTime) - Math.abs(bNote.time - this.gameTime);
        });

        if (hitableTiles.length === 0) {
            return HitRating.MISS;
        }

        const tile = hitableTiles[0];

        if (isTouchStart) {
            const rating = tile.tap(this.gameTime);

            if (tile.isLongPressType() && rating !== HitRating.MISS) {
                this.touchedTiles.set(laneIndex, tile);
            }

            return rating;
        }

        return HitRating.MISS;
    }
    //#endregion

    //#region Speed Management
    setScrollSpeed(speed: number) {
        const oldSpeed = this.scrollSpeed;
        this.scrollSpeed = speed;
    }

    getScrollSpeed(): number {
        return this.scrollSpeed;
    }

    private calculateDynamicScrollSpeed() {
        const notes = this.beatmapManager.getNotes();
        if (!notes || notes.length < 2) {
            this.scrollSpeed = this.defaultScrollSpeed;
            return;
        }

        const minSpeed = this.defaultScrollSpeed * 0.5;
        const maxSpeed = this.defaultScrollSpeed * 1.5;

        let isSorted = true;
        for (let i = 1; i < notes.length; i++) {
            if (notes[i].time < notes[i - 1].time) {
                isSorted = false;
                break;
            }
        }

        const sortedNotes = isSorted ? notes : [...notes].sort((a, b) => a.time - b.time);

        let minTimeGap = Number.MAX_VALUE;
        let totalTimeGap = 0;
        let totalGaps = 0;
        let maxNoteDuration = 0;

        for (let i = 1; i < sortedNotes.length; i++) {
            const timeGap = sortedNotes[i].time - sortedNotes[i - 1].time;
            if (timeGap > 0) {
                if (timeGap < minTimeGap) {
                    minTimeGap = timeGap;
                }
                totalTimeGap += timeGap;
                totalGaps++;
            }

            const duration = sortedNotes[i].duration;
            if (duration > maxNoteDuration) {
                maxNoteDuration = duration;
            }
        }

        const averageTimeGap = totalGaps > 0 ? totalTimeGap / totalGaps : 1.0;

        if (minTimeGap === Number.MAX_VALUE) {
            minTimeGap = 1.0;
        }

        const speedFactor = Math.min(1.0, minTimeGap * 0.7 + 0.3);
        const avgSpeedFactor = Math.min(1.0, averageTimeGap * 0.5 + 0.5);

        let durationFactor = 1.0;
        if (maxNoteDuration > 0) {
            durationFactor = Math.max(0.7, 1.0 - (maxNoteDuration * 0.1));
        }

        const combinedFactor = (speedFactor * 0.6) + (avgSpeedFactor * 0.25) + (durationFactor * 0.15);
        const calculatedSpeed = minSpeed + (maxSpeed - minSpeed) * combinedFactor;

        this.setScrollSpeed(calculatedSpeed * 2.5);
    }
    //#endregion

    //#region Beginning Tile Management
    setupBeginningTile() {
        this.clearActiveTiles();
        this.gameState = 'paused';
        const lane = Math.min(Math.floor(this.laneContainers.length / 2), this.laneContainers.length - 1);
        this.createBeginningTile(lane);
    }

    private createBeginningTile(lane: number) {
        const tile = this.getTileFromPool();
        if (!tile) {
            console.error("Failed to create beginning tile - pool empty");
            return;
        }

        const beginningNote = {
            midi: 60,
            time: 0,
            lane: lane,
            type: 0,
            duration: 0.3,
            durationTicks: 0,
            velocity: 100
        };

        const laneContainer = this.laneContainers[lane];
        tile.node.parent = laneContainer;
        const yPos = this.targetPositionY;

        tile.init(beginningNote, lane, yPos, yPos, this.laneWidth, this.scrollSpeed, this.minTileHeight);
        tile.setBufferHeight(this.minTileHeight / 2.0);
        tile.setBeginningNodeActive(true);

        tile.node.name = "beginning_tile";

        this.activeTiles.push(tile);
    }

    checkBeginningTileTap(laneIndex: number): boolean {
        for (let i = 0; i < this.activeTiles.length; i++) {
            const tile = this.activeTiles[i];
            if (tile.node.name === "beginning_tile" && tile.getLane() === laneIndex) {
                tile.startMovement(1.0, this.gameTime);
                return true;
            }
        }
        return false;
    }
    //#endregion

    //#region Utility Methods
    getActiveTileCount(): number {
        return this.activeTiles.length;
    }

    getGameTime(): number {
        return this.gameTime;
    }

    setGameTime(time: number) {
        this.gameTime = time;
    }

    private removeTile(tile: Tile) {
        const index = this.activeTiles.indexOf(tile);
        if (index >= 0) {
            this.activeTiles.splice(index, 1);
        }
        this.returnTileToPool(tile);
    }
    //#endregion
}
