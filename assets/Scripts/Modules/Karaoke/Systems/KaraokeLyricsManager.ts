import { _decorator, Component, EventTarget, resources, JsonAsset } from 'cc';
import { KaraokeConstants } from './KaraokeConstants';
import { resourceUtil } from '../../../Common/resourceUtil';
import { LyricSegment } from '../../../Models/Songs/KaraokeSongModel';
import { KaraokeSongModel } from '../../../Models/Songs/KaraokeSongModel';

const { ccclass, property } = _decorator;

/**
 * Manages lyrics display and timing for the Karaoke application
 */
@ccclass('KaraokeLyricsManager')
export class KaraokeLyricsManager extends Component {
    private eventTarget: EventTarget = new EventTarget();

    //#region Properties
    private lyrics: LyricSegment[] = [];
    private currentLyricIndex: number = -1;
    private lyricUpdateInterval: number = null;
    private currentTime: number = 0;
    private isPlaying: boolean = false;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {

    }

    onDestroy() {
        // Clean up any resources
        this.stopLyricUpdates();
    }
    //#endregion

    //#region Public Methods
    /**
     * Load lyrics for a song from resources
     * @param song Song object containing lyricPath
     * @returns Promise with updated song including lyrics
     */
    public loadLyrics(song: KaraokeSongModel): Promise<KaraokeSongModel> {
        return new Promise((resolve, reject) => {
            if (!song || !song.lyricPath) {
                console.error('Song or lyricPath is missing');
                reject(new Error('Song or lyricPath is missing'));
                return;
            }
            const resourcePath = KaraokeSongModel.getLyricPath(song);
            resourceUtil.loadRes(resourcePath, JsonAsset, (err, jsonAsset: JsonAsset) => {
                if (err) {
                    console.error(`Failed to load lyrics from path: ${resourcePath}`, err);
                    reject(err);
                    return;
                }

                try {
                    const jsonData = jsonAsset.json;

                    // Convert the JSON data to LyricSegment objects
                    const lyricSegments: LyricSegment[] = jsonData.segments.map(segment => {
                        return {
                            text: segment.text,
                            startTime: segment.start,
                            endTime: segment.end,
                            completed: false
                        };
                    });

                    // Update the lyrics array
                    this.lyrics = lyricSegments || [];
                    this.resetLyrics();

                    // Update the song object with the lyrics data
                    const updatedSong = {
                        ...song,
                        lyrics: lyricSegments,
                        duration: jsonData.duration || song.duration
                    };

                    console.log(`Loaded ${this.lyrics.length} lyric segments`);

                    resolve(updatedSong);
                } catch (error) {
                    console.error('Error parsing lyrics JSON:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Set lyrics directly
     * @param lyrics Array of lyric segments
     */
    public setLyrics(lyrics: LyricSegment[]): void {
        this.lyrics = lyrics || [];
        this.resetLyrics();

        console.log(`Set ${this.lyrics.length} lyric segments`);
    }

    /**
     * Start lyrics playback
     */
    public startPlayback(): void {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentTime = 0;
        this.currentLyricIndex = -1;

        // Start update interval for lyric timing
        this.lyricUpdateInterval = setInterval(() => {
            this.updateLyrics();
        }, 100);

        console.log('Lyrics playback started');
    }

    /**
     * Stop lyrics playback
     */
    public stopPlayback(): void {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.stopLyricUpdates();
        this.resetLyrics();

        console.log('Lyrics playback stopped');
    }

    /**
     * Pause lyrics playback
     */
    public pausePlayback(): void {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        this.stopLyricUpdates();

        console.log('Lyrics playback paused');
    }

    /**
     * Resume lyrics playback
     */
    public resumePlayback(): void {
        if (this.isPlaying) return;

        this.isPlaying = true;

        console.log('Lyrics playback resumed');
    }

    /**
     * Update current playback time
     * @param time Current playback time in seconds
     */
    public updateTime(time: number): void {
        this.currentTime = time;

        // If not using the update interval, manually update lyrics
        if (!this.lyricUpdateInterval) {
            this.updateLyrics();
        }
    }

    /**
     * Get the current lyric
     * @returns The current lyric segment or null if none
     */
    public getCurrentLyric(): LyricSegment | null {
        if (this.currentLyricIndex < 0 || this.currentLyricIndex >= this.lyrics.length) {
            return null;
        }

        return this.lyrics[this.currentLyricIndex];
    }

    /**
     * Get the next lyric
     * @returns The next lyric segment or null if none
     */
    public getNextLyric(): LyricSegment | null {
        const nextIndex = this.currentLyricIndex + 1;

        if (nextIndex >= this.lyrics.length) {
            return null;
        }

        return this.lyrics[nextIndex];
    }

    /**
     * Check if a lyric is active at the current time
     * @returns True if a lyric is active, false otherwise
     */
    public isLyricActive(): boolean {
        const currentLyric = this.getCurrentLyric();

        if (!currentLyric) {
            return false;
        }

        return this.currentTime >= currentLyric.startTime && this.currentTime <= currentLyric.endTime;
    }
    //#endregion

    //#region Private Methods
    private updateLyrics(): void {
        if (!this.isPlaying || this.lyrics.length === 0) return;

        // Find the current lyric based on time
        const newIndex = this.findLyricIndexAtTime(this.currentTime);

        // If the lyric has changed, emit an event
        if (newIndex !== this.currentLyricIndex) {
            const prevIndex = this.currentLyricIndex;
            this.currentLyricIndex = newIndex;

            // Mark previous lyric as completed if moving forward
            if (prevIndex >= 0 && prevIndex < this.lyrics.length && newIndex > prevIndex) {
                this.lyrics[prevIndex].completed = true;
            }

            // Emit lyric updated event
            this.emitLyricUpdated();
        }

        // Increment current time (only if not being externally updated)
        if (this.lyricUpdateInterval) {
            this.currentTime += 0.1; // 100ms
        }
    }

    private findLyricIndexAtTime(time: number): number {
        // Handle no lyrics case
        if (this.lyrics.length === 0) {
            return -1;
        }

        // If before first lyric
        if (time < this.lyrics[0].startTime) {
            return -1;
        }

        // Find the lyric that contains the current time
        for (let i = 0; i < this.lyrics.length; i++) {
            const lyric = this.lyrics[i];

            if (time >= lyric.startTime && time <= lyric.endTime) {
                return i;
            }
        }

        // If after last lyric, return last index
        if (time > this.lyrics[this.lyrics.length - 1].endTime) {
            return this.lyrics.length - 1;
        }

        // Between lyrics, return the previous one
        for (let i = 0; i < this.lyrics.length - 1; i++) {
            if (time > this.lyrics[i].endTime && time < this.lyrics[i + 1].startTime) {
                return i;
            }
        }

        return -1;
    }

    private stopLyricUpdates(): void {
        if (this.lyricUpdateInterval) {
            clearInterval(this.lyricUpdateInterval);
            this.lyricUpdateInterval = null;
        }
    }

    private resetLyrics(): void {
        this.currentLyricIndex = -1;
        this.currentTime = 0;

        // Reset completed flags
        this.lyrics.forEach(lyric => {
            lyric.completed = false;
        });
    }

    private emitLyricUpdated(): void {
        const currentLyric = this.getCurrentLyric();
        const nextLyric = this.getNextLyric();

        this.emit(KaraokeConstants.EVENTS.LYRICS_UPDATED, {
            currentLyric,
            nextLyric,
            currentLyricIndex: this.currentLyricIndex,
            totalLyrics: this.lyrics.length
        });
    }
    //#endregion

    //#region Event Methods
    public on(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget?.on(eventName, callback, target);
    }

    public off(eventName: string, callback: (...args: any[]) => void, target?: any): void {
        this.eventTarget?.off(eventName, callback, target);
    }

    private emit(eventName: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void {
        this.eventTarget?.emit(eventName, arg1, arg2, arg3, arg4, arg5);
    }
    //#endregion
} 