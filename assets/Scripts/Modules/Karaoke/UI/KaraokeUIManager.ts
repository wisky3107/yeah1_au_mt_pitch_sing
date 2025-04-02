import { _decorator, Component, Node, Button, Label, UITransform, Vec3, tween, instantiate, Sprite, Color, Prefab } from 'cc';
import { KaraokeConstants, KaraokeState } from '../Systems/KaraokeConstants';
import { KaraokeGameplayController } from '../Systems/KaraokeGameplayController';
import { KaraokeLyricsManager } from '../Systems/KaraokeLyricsManager';
import { LyricSegment, PitchDetectionResult } from '../Data/KaraokeTypes';
import { PitchWaveform } from '../../GameCommon/Pitch/PitchWaveform';
import { KaraokePitchDetectionSystem } from '../Systems/KaraokePitchDetectionSystem';
import { KaraokeUILyric } from './KaraokeUILyric';

const { ccclass, property } = _decorator;

/**
 * Manages the karaoke screen UI layout as shown in the wireframe
 * Handles screen navigation and UI element coordination
 * Consolidates lyrics display, mic visualization, and timer functionality
 */
@ccclass('KaraokeUIManager')
export class KaraokeUIManager extends Component {

    @property({ type: Label, tooltip: "Label component to display the countdown time" })
    private timeLabel: Label = null;

    @property({ tooltip: "Format to display timer (s = seconds only, mm:ss = minutes and seconds)" })
    private timerFormat: string = "s";

    // Lyrics Component Properties
    @property({ type: Node, tooltip: "Container node for lyric labels" })
    private lyricsContainer: Node = null;

    @property({ type: Prefab, tooltip: "Prefab for lyric items" })
    private lyricPrefab: Prefab = null;

    @property({ tooltip: "Maximum characters per line" })
    private maxCharsPerLine: number = 90;

    @property({ tooltip: "Maximum lines per segment" })
    private maxLinesPerSegment: number = 2;

    @property({ tooltip: "Scroll speed multiplier" })
    private scrollSpeedMultiplier: number = 1.0;

    @property({ tooltip: "Number of preloaded lyric items for pooling" })
    private poolSize: number = 20;

    @property({ tooltip: "Viewport height for recycling lyrics" })
    private viewportHeight: number = 600;

    // Mic Visualizer Properties
    @property({ type: Node, tooltip: "Microphone icon node" })
    private micIcon: Node = null;

    @property({ type: Node, tooltip: "Sound wave container node" })
    private waveContainer: Node = null;

    @property({ type: [Node], tooltip: "Wave bar nodes" })
    private waveBars: Node[] = [];

    @property({ tooltip: "Color when microphone is active" })
    private activeColor: Color = new Color(255, 0, 255, 255); // Purple

    @property({ tooltip: "Color when microphone is inactive" })
    private inactiveColor: Color = new Color(150, 150, 150, 255); // Gray

    @property({ tooltip: "Animation speed for wave bars" })
    private animationSpeed: number = 0.3;

    @property({ tooltip: "Volume threshold for activity" })
    private volumeThreshold: number = 0.01;

    @property({ type: Label, tooltip: "Label component to display the countdown time" })
    private lbCountdown: Label = null;

    @property({ type: Label, tooltip: "Label component to display the countdown time" })
    private lbPressButton: Label = null;

    @property({ type: PitchWaveform, tooltip: "Node containing PitchWaveform component" })
    private waveformVisualizer: PitchWaveform = null;

    @property({ type: Label, tooltip: "Label component to display the score" })
    private lbScore: Label = null;
    // Private variables
    private gameController: KaraokeGameplayController = null;
    private lyricsManager: KaraokeLyricsManager = null;

    // Timer variables
    private totalDuration: number = 0;
    private remainingTime: number = 0;
    private isTimerActive: boolean = false;

    // Lyrics variables
    private lyricPool: KaraokeUILyric[] = [];
    private activeLyrics: KaraokeUILyric[] = [];
    private currentLyricIndex: number = -1;
    private targetScrollPosition: number = 0;
    private isScrolling: boolean = false;
    private lastScrollPosition: number = 0;
    
    // Added variables for improved lyric creation
    private allLyrics: LyricSegment[] = [];
    private lastCreatedLyricIndex: number = -1;
    private initialLyricCount: number = 5;
    private yOffsetForNewLyrics: number = 0;

    // Mic visualizer variables
    private isMicActive: boolean = false;
    private currentAnimations: any[] = [];

    /**
     * Initialize screen manager
     */
    start() {
        // Get reference to game controller
        this.gameController = KaraokeGameplayController.instance;

        // Get reference to lyrics manager
        this.lyricsManager = KaraokeLyricsManager.instance;

        // Set up UI elements based on wireframe layout
        this.setupUIElements();

        // Initialize timer display
        this.updateTimerDisplay(0);

        // Initialize lyric object pool
        this.initLyricPool();

        // Set initial mic state to inactive
        this.setMicActiveState(false);

        // Initialize waveform visualization using the PitchWaveform component
        if (this.waveformVisualizer) {
            this.waveformVisualizer.initialize(this.micIcon);
        }
        // No longer need to set up event listeners
        // The controller will call our methods directly
    }

    /**
     * Update method for frame-by-frame updates
     */
    update(dt: number) {
        // Update timer
        this.updateTimer(dt);
        // Update lyrics scrolling
        this.updateLyricsScrolling(dt);
    }

    /**
     * Initialize the lyric object pool
     */
    private initLyricPool() {
        if (!this.lyricPrefab || !this.lyricsContainer) return;

        // Create pool container node
        const poolNode = new Node('LyricPool');
        poolNode.active = false;
        this.node.addChild(poolNode);

        // Create pool of lyric objects
        for (let i = 0; i < this.poolSize; i++) {
            const lyricNode = instantiate(this.lyricPrefab);
            const lyricComponent = lyricNode.getComponent('KaraokeUILyric') as KaraokeUILyric;

            lyricNode.active = false;
            poolNode.addChild(lyricNode);

            if (lyricComponent) {
                this.lyricPool.push(lyricComponent);
            }
        }
    }

    /**
     * Get a lyric object from the pool
     */
    private getLyricFromPool(): KaraokeUILyric {
        // Try to find an available lyric in the pool
        for (const lyric of this.lyricPool) {
            if (!lyric.isInUse()) {
                lyric.node.active = true;
                return lyric;
            }
        }

        // If no available lyrics, create a new one
        const lyricNode = instantiate(this.lyricPrefab);
        lyricNode.active = true;

        const lyricComponent = lyricNode.getComponent('KaraokeUILyric') as KaraokeUILyric;
        if (lyricComponent) {
            this.lyricPool.push(lyricComponent);
            return lyricComponent;
        }

        return null;
    }

  

    /**
     * Setup UI elements positions and initial states
     */
    private setupUIElements() {

    }

    /**
     * Handle back button click
     */
    private onBackButtonClicked() {
        // Check if karaoke is in progress
        if (this.gameController) {
            this.gameController.handleExitRequest();
        }
    }

    /**
     * Show loading state
     */
    public showLoadingState(isLoading: boolean) {
        // Update UI for loading state
        // This would typically show a loading spinner or message
    }

    /**
     * Show ready state
     */
    public showReadyState() {
        // Update UI for ready state
        // This would show a "Press to start" message or similar
        if (this.lbPressButton) {
            this.lbPressButton.node.active = true;
        }
    }

    /**
     * Show playing state
     */
    public showPlayingState() {
        // Update UI for playing state
        // Hide press button when game starts
        if (this.lbPressButton) {
            this.lbPressButton.node.active = false;
        }
    }

    /**
     * Show paused state
     */
    public showPausedState() {
        // Update UI for paused state
        // This would show a pause overlay or similar
    }

    /**
     * Show finished state
     */
    public showFinishedState(score: number) {
        // Make sure we have a score label
        if (!this.lbScore) {
            console.warn("Score label not assigned in KaraokeUIManager");
            return;
        }
        
        // Make score label visible
        this.lbScore.node.active = true;
        
        // Get final score from scoring system
        const finalScore = score || 0;
        
        // Start from 0 and animate to the final score
        let currentDisplayScore = 0;
        this.lbScore.string = "0";
        
        // Calculate animation duration based on score (higher score = slightly longer animation)
        const duration = Math.min(2.0, 0.5 + (finalScore / 100) * 1.5);
        
        // Create a tween for score counting animation
        tween(this.lbScore.node)
            .call(() => {
                // Scale up effect at start
                tween(this.lbScore.node)
                    .to(0.2, { scale: new Vec3(1.2, 1.2, 1.2) })
                    .to(0.2, { scale: new Vec3(1.0, 1.0, 1.0) })
                    .start();
            })
            .to(duration, {}, {
                onUpdate: (target, ratio) => {
                    // Update the displayed score based on the animation progress
                    currentDisplayScore = Math.floor(finalScore * ratio);
                    this.lbScore.string = currentDisplayScore.toString();
                }
            })
            .call(() => {
                // Ensure the final score is displayed exactly
                this.lbScore.string = finalScore.toString();
                
                // Add a little bounce effect when finished
                tween(this.lbScore.node)
                    .to(0.1, { scale: new Vec3(1.3, 1.3, 1.3) })
                    .to(0.2, { scale: new Vec3(1.0, 1.0, 1.0) })
                    .start();
            })
            .start();
    }

    /**
     * Perform countdown animation and start the game when finished
     * @param callback Function to call when countdown is complete
     */
    public startCountdown(callback: () => void): void {
        if (!this.lbCountdown) {
            // If countdown label doesn't exist, call callback immediately
            callback();
            return;
        }

        // Make countdown label visible
        this.lbCountdown.node.active = true;

        // Hide press button during countdown
        if (this.lbPressButton) {
            this.lbPressButton.node.active = false;
        }

        // Start the countdown sequence
        const countdownSequence = [3, 2, 1, "Bắt đầu"];
        let index = 0;

        const updateCountdown = () => {
            if (index < countdownSequence.length) {
                // Update the countdown text
                this.lbCountdown.string = countdownSequence[index].toString();

                // Scale animation for each number
                const countdownNode = this.lbCountdown.node;
                tween(countdownNode)
                    .to(0.1, { scale: new Vec3(2.0, 2.0, 2.0) })
                    .to(0.3, { scale: new Vec3(1.0, 1.0, 1.0) })
                    .call(() => {
                        index++;
                        if (index < countdownSequence.length) {
                            updateCountdown();
                        } else {
                            // Hide countdown label when finished
                            setTimeout(() => {
                                this.lbCountdown.node.active = false;
                                // Call the callback to start the game
                                callback();
                            }, 600);
                        }
                    })
                    .start();
            }
        };

        // Start the sequence
        updateCountdown();
    }

    /**
     * Update timer each frame
     */
    private updateTimer(dt: number) {
        if (!this.isTimerActive) return;

        // Update timer based on audio playback time
        if (this.gameController) {
            const currentSong = this.gameController.getCurrentSong();
            if (currentSong) {
                // Update remaining time
                const elapsedTime = this.gameController.getCurrentPlaybackTime();
                this.remainingTime = Math.max(0, this.totalDuration - elapsedTime);

                // Update display
                this.updateTimerDisplay(this.remainingTime);

                // If timer reaches zero, handle timeout
                if (this.remainingTime <= 0) {
                    this.isTimerActive = false;
                }
            }
        }
    }

    /**
     * Format time for display
     */
    private formatTime(timeInSeconds: number): string {
        timeInSeconds = Math.floor(timeInSeconds);

        if (this.timerFormat === "s") {
            // Show only seconds (e.g., "60s")
            return `${timeInSeconds}s`;
        } else {
            // Format as mm:ss
            const minutes = Math.floor(timeInSeconds / 60);
            const seconds = timeInSeconds % 60;
            // Use string manipulation instead of padStart for compatibility
            const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
            const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
            return `${minutesStr}:${secondsStr}`;
        }
    }

    /**
     * Start the timer
     */
    public startTimer(duration: number) {
        this.totalDuration = duration;
        this.remainingTime = duration;
        this.isTimerActive = true;
        this.updateTimerDisplay(this.remainingTime);
    }

    /**
     * Stop the timer
     */
    public stopTimer() {
        this.isTimerActive = false;
    }

    /**
     * Pause the timer
     */
    public pauseTimer() {
        this.isTimerActive = false;
    }

    /**
     * Resume the timer
     */
    public resumeTimer() {
        this.isTimerActive = true;
    }

    /**
     * Update the timer display
     */
    private updateTimerDisplay(timeInSeconds: number) {
        if (this.timeLabel) {
            this.timeLabel.string = this.formatTime(timeInSeconds);
        }
    }

    /**
     * Update lyrics scrolling each frame for smooth animation
     */
    private updateLyricsScrolling(dt: number) {
        if (!this.isScrolling || !this.lyricsContainer) return;

        // Get current position
        const currentPos = this.lyricsContainer.position;

        // Calculate new position with smooth scrolling
        const newY = this.lerpValue(currentPos.y, this.targetScrollPosition, dt * 5 * this.scrollSpeedMultiplier);

        // Record last position for comparison
        this.lastScrollPosition = currentPos.y;

        // Update position
        this.lyricsContainer.setPosition(new Vec3(currentPos.x, newY, currentPos.z));

        // Check if scrolling is complete
        if (Math.abs(newY - this.targetScrollPosition) < 0.1) {
            this.isScrolling = false;
        }
    }

    /**
     * Linear interpolation helper
     */
    private lerpValue(start: number, end: number, t: number): number {
        return start + (end - start) * Math.min(1, t);
    }

    /**
     * Update lyrics display with current lyric
     * Called by the game controller when lyrics update
     */
    public updateLyrics(index: number) {
        // Skip if no change
        if (index === this.currentLyricIndex) return;

        this.currentLyricIndex = index;

        // Highlight current lyric and scroll to it
        this.highlightCurrentLyric(index);
    }

    /**
     * Create lyric labels for all lyrics
     * Called by the game controller when a song is loaded
     */
    public createLyricLabels(lyrics: LyricSegment[]) {
        if (!this.lyricsContainer || !this.lyricPrefab) return;

        // Clear existing lyrics
        this.clearLyricLabels();

        // Reset position
        this.lyricsContainer.setPosition(new Vec3(0, 0, 0));
        this.targetScrollPosition = 0;
        this.isScrolling = false;
        this.lastScrollPosition = 0;

        // Store all lyrics for later use
        this.allLyrics = lyrics;
        this.lastCreatedLyricIndex = -1;
        this.yOffsetForNewLyrics = 0;

        // Create only the first few lyric labels
        this.createInitialLyrics();
    }

    /**
     * Create the initial set of lyrics
     */
    private createInitialLyrics() {
        // Create only the first few lyrics
        let count = 0;
        let yOffset = 0;
        
        while (count < this.initialLyricCount && this.lastCreatedLyricIndex + 1 < this.allLyrics.length) {
            const nextIndex = this.lastCreatedLyricIndex + 1;
            const lyric = this.allLyrics[nextIndex];
            
            // Process text to ensure max 2 lines per segment
            const processedText = this.processLyricText(lyric.text);
            
            // Create label from pool
            const lyricComponent = this.createLyricLabel(processedText, nextIndex);
            if (lyricComponent) {
                // Position label
                const lyricHeight = lyricComponent.getHeight();
                lyricComponent.node.setPosition(new Vec3(0, yOffset, 0));
                
                // Add to container
                this.lyricsContainer.addChild(lyricComponent.node);
                this.activeLyrics.push(lyricComponent);
                
                // Update offset for next label
                yOffset -= (lyricHeight + 20); // Add spacing between lyrics
                
                // Update tracking variables
                this.lastCreatedLyricIndex = nextIndex;
                count++;
            }
        }
        
        // Store the current yOffset for future lyrics
        this.yOffsetForNewLyrics = yOffset;
    }
    
    /**
     * Create the next lyric and add it to the bottom
     */
    private createNextLyric(): boolean {
        if (this.lastCreatedLyricIndex + 1 >= this.allLyrics.length) {
            return false; // No more lyrics to create
        }
        
        const nextIndex = this.lastCreatedLyricIndex + 1;
        const lyric = this.allLyrics[nextIndex];
        
        // Process text to ensure max 2 lines per segment
        const processedText = this.processLyricText(lyric.text);
        
        // Create label from pool
        const lyricComponent = this.createLyricLabel(processedText, nextIndex);
        if (!lyricComponent) return false;
        
        // Position label at the bottom
        const lyricHeight = lyricComponent.getHeight();
        lyricComponent.node.setPosition(new Vec3(0, this.yOffsetForNewLyrics, 0));
        
        // Add to container
        this.lyricsContainer.addChild(lyricComponent.node);
        this.activeLyrics.push(lyricComponent);
        
        // Update offset for next label
        this.yOffsetForNewLyrics -= (lyricHeight + 20); // Add spacing between lyrics
        
        // Update tracking variable
        this.lastCreatedLyricIndex = nextIndex;
        
        return true;
    }

    /**
     * Process lyric text to ensure max 2 lines
     */
    private processLyricText(text: string): string {
        // Split into words
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        // Build lines word by word
        for (const word of words) {
            // Check if adding this word would exceed max chars
            if ((currentLine + ' ' + word).length > this.maxCharsPerLine && currentLine.length > 0) {
                // Line would be too long, start a new line
                lines.push(currentLine);
                currentLine = word;

                // Check if we've reached max lines
                if (lines.length >= this.maxLinesPerSegment) {
                    break;
                }
            } else {
                // Add word to current line
                currentLine = currentLine.length === 0 ? word : currentLine + ' ' + word;
            }
        }

        // Add last line if not empty and we haven't reached max lines
        if (currentLine.length > 0 && lines.length < this.maxLinesPerSegment) {
            lines.push(currentLine);
        }

        // Join lines with line breaks
        return lines.join('\n');
    }

    /**
     * Create a single lyric label from the pool
     */
    private createLyricLabel(text: string, index: number): KaraokeUILyric {
        // Get lyric from pool
        const lyricComponent = this.getLyricFromPool();
        if (!lyricComponent) return null;

        // Initialize with text and index
        lyricComponent.init(text, index);

        // Set highlight state based on index
        if (index === this.currentLyricIndex) {
            lyricComponent.setHighlightState('current');
        } else if (index < this.currentLyricIndex) {
            lyricComponent.setHighlightState('past');
        } else {
            lyricComponent.setHighlightState('future');
        }

        return lyricComponent;
    }

    /**
     * Clear all lyric labels
     */
    private clearLyricLabels() {
        // Recycle all active lyrics
        this.activeLyrics.forEach(lyric => {
            if (lyric && lyric.isInUse()) {
                lyric.recycle();
                lyric.node.active = false;
                lyric.node.removeFromParent();
            }
        });

        this.activeLyrics = [];
        this.currentLyricIndex = -1;
    }

    /**
     * Highlight the current lyric and scroll to it
     */
    private highlightCurrentLyric(index: number) {
        if (index < 0) return;
        
        // Ensure the requested lyric exists in the active list
        const targetLyricExists = this.activeLyrics.some(lyric => lyric.getIndex() === index);
        
        // If the target lyric doesn't exist and we haven't created all lyrics yet,
        // keep creating lyrics until we find it or reach the end
        if (!targetLyricExists && this.lastCreatedLyricIndex < this.allLyrics.length - 1) {
            while (this.createNextLyric()) {
                if (this.activeLyrics.some(lyric => lyric.getIndex() === index)) {
                    break;
                }
            }
        }

        // Update highlight states for all lyrics
        this.activeLyrics.forEach(lyric => {
            if (!lyric || !lyric.isInUse()) return;

            const lyricIndex = lyric.getIndex();

            if (lyricIndex === index) {
                lyric.setHighlightState('current');
            } else if (lyricIndex < index) {
                // Set as past lyric
                lyric.setHighlightState('past');
                this.scheduleLyricRecycling(lyric);
            } else {
                lyric.setHighlightState('future');
            }
        });

        // Scroll to current lyric
        if (this.lyricsContainer) {
            const targetLyric = this.activeLyrics.find(lyric => lyric.getIndex() === index);
            if (targetLyric) {
                // Calculate target position
                this.targetScrollPosition = -targetLyric.node.position.y;
                this.isScrolling = true;
            }
        }
    }

    /**
     * Schedule a lyric for recycling with fade-out effect
     */
    private scheduleLyricRecycling(lyric: KaraokeUILyric): void {
        if (!lyric || !lyric.isInUse()) return;

        // Apply fade out effect and recycle when complete
        lyric.fadeOut(() => {
            // Check if the lyric is still in the active list
            const index = this.activeLyrics.indexOf(lyric);
            if (index !== -1) {
                // Remove from active list
                this.activeLyrics.splice(index, 1);

                // Recycle the lyric
                lyric.recycle();
                lyric.node.active = false;
                lyric.node.removeFromParent();

                
                // Create a new lyric to replace the recycled one
                this.createNextLyric();
            }
        });
    }

    /**
     * Update microphone visualization based on pitch detection result
     * Called by the game controller when pitch is detected
     */
    public updateMicVisualization(result: PitchDetectionResult, detectionSystem: KaraokePitchDetectionSystem) {
        // Check if volume is above threshold
        const isActive = result.detected && result.volume > this.volumeThreshold;

        // Update visual state
        this.setMicActiveState(isActive);

        // If active, adjust wave visualization based on volume
        if (isActive) {
            this.animateWaveBars(result.volume);
        }

        // Update waveform visualization using the PitchWaveform component
        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateWaveformVisualization(result.volume, result.frequency, detectionSystem);
        }
    }

    /**
     * Set active/inactive visual state for mic visualizer
     */
    private setMicActiveState(active: boolean) {
        // Skip if state hasn't changed
        if (this.isMicActive === active) return;

        this.isMicActive = active;

        // Update microphone icon color
        if (this.micIcon) {
            const iconSprite = this.micIcon.getComponent(Sprite);
            if (iconSprite) {
                iconSprite.color = active ? this.activeColor : this.inactiveColor;
            }
        }

        // Show/hide wave container
        if (this.waveContainer) {
            this.waveContainer.active = active;
        }

        // If deactivated, stop animations
        if (!active) {
            this.stopAllAnimations();
        }
    }

    /**
     * Animate wave bars based on volume
     */
    private animateWaveBars(volume: number) {
        // Skip if no wave bars
        if (!this.waveBars || this.waveBars.length === 0) return;

        // Stop previous animations
        this.stopAllAnimations();

        // Scale volume to a more visually appealing range
        const scaledVolume = Math.min(1, volume * 2);

        // Animate each wave bar
        this.waveBars.forEach((bar, index) => {
            if (!bar) return;

            // Calculate random height based on volume
            const barHeight = 0.5 + (scaledVolume * Math.random() * 0.5);

            // Create animation
            const duration = this.animationSpeed + (Math.random() * 0.2);
            const delay = index * 0.05;

            // Scale animation
            const scaleAnim = tween(bar)
                .delay(delay)
                .to(duration, { scale: new Vec3(1, barHeight, 1) })
                .to(duration, { scale: new Vec3(1, 0.5, 1) })
                .union()
                .repeat(3)
                .start();

            // Store animation for cleanup
            this.currentAnimations.push(scaleAnim);
        });
    }

    /**
     * Stop all running animations
     */
    private stopAllAnimations() {
        this.currentAnimations.forEach(anim => {
            if (anim) {
                anim.stop();
            }
        });

        this.currentAnimations = [];

        // Reset all wave bars to default scale
        this.waveBars.forEach(bar => {
            if (bar) {
                bar.setScale(new Vec3(1, 0.5, 1));
            }
        });
    }

    /**
     * Hide current lyric highlight
     * Used when no lyric is active or during transitions
     */
    public hideLyricHighlight(): void {
        // Remove highlight from current lyric
        this.activeLyrics.forEach(lyric => {
            if (!lyric || !lyric.isInUse()) return;

            const lyricIndex = lyric.getIndex();

            if (lyricIndex === this.currentLyricIndex) {
                lyric.setHighlightState('future');
            }
        });
    }

    /**
     * Clean up on destroy
     */
    onDestroy() {
        // Stop all animations
        this.stopAllAnimations();

        // Clear all lyric labels
        this.clearLyricLabels();

        // Clear the lyric pool
        this.lyricPool = [];
    }
} 