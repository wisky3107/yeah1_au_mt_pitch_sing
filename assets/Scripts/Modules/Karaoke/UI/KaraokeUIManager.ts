import { _decorator, Component, Node, Button, Label, RichText, UITransform, Vec3, tween, instantiate, Sprite, Color } from 'cc';
import { KaraokeConstants, KaraokeState } from '../Systems/KaraokeConstants';
import { KaraokeGameplayController } from '../Systems/KaraokeGameplayController';
import { KaraokeLyricsManager } from '../Systems/KaraokeLyricsManager';
import { LyricSegment, PitchDetectionResult } from '../Data/KaraokeTypes';
import { PitchWaveform } from '../../GameCommon/Pitch/PitchWaveform';
import { KaraokePitchDetectionSystem } from '../Systems/KaraokePitchDetectionSystem';

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

    @property({ type: RichText, tooltip: "Template for lyric labels" })
    private lyricLabelTemplate: RichText = null;

    @property({ tooltip: "Maximum characters per line" })
    private maxCharsPerLine: number = 90;

    @property({ tooltip: "Maximum lines per segment" })
    private maxLinesPerSegment: number = 2;

    @property({ tooltip: "Scroll speed multiplier" })
    private scrollSpeedMultiplier: number = 1.0;

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

    // Private variables
    private gameController: KaraokeGameplayController = null;
    private lyricsManager: KaraokeLyricsManager = null;

    // Timer variables
    private totalDuration: number = 0;
    private remainingTime: number = 0;
    private isTimerActive: boolean = false;

    // Lyrics variables
    private lyricLabels: Node[] = [];
    private currentLyricIndex: number = -1;
    private targetScrollPosition: number = 0;
    private isScrolling: boolean = false;

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

        // Hide lyric template if it exists
        if (this.lyricLabelTemplate) {
            this.lyricLabelTemplate.node.active = false;
        }

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
    public showFinishedState() {
        // Update UI for finished state
        // This would show score results or similar
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
        if (!this.lyricsContainer || !this.lyricLabelTemplate) return;

        // Clear existing lyrics
        this.clearLyricLabels();

        // Reset position
        this.lyricsContainer.setPosition(new Vec3(0, 0, 0));
        this.targetScrollPosition = 0;
        this.isScrolling = false;

        // Create new lyric labels
        let yOffset = 0;

        lyrics.forEach((lyric, index) => {
            // Process text to ensure max 2 lines per segment
            const processedText = this.processLyricText(lyric.text);

            // Create label
            const lyricNode = this.createLyricLabel(processedText, index);
            if (lyricNode) {
                // Position label
                const lyricHeight = lyricNode.getComponent(UITransform)?.height || 50;
                lyricNode.setPosition(new Vec3(0, yOffset, 0));

                // Add to container
                this.lyricsContainer.addChild(lyricNode);
                this.lyricLabels.push(lyricNode);

                // Update offset for next label
                yOffset -= (lyricHeight + 20); // Add spacing between lyrics
            }
        });
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
     * Create a single lyric label
     */
    private createLyricLabel(text: string, index: number): Node {
        if (!this.lyricLabelTemplate) return null;

        // Clone template
        const lyricNode = instantiate(this.lyricLabelTemplate.node);
        lyricNode.active = true;

        // Set text
        const richText = lyricNode.getComponent(RichText);
        if (richText) {
            richText.string = text;
        }

        // Set name
        lyricNode.name = `Lyric_${index}`;

        return lyricNode;
    }

    /**
     * Clear all lyric labels
     */
    private clearLyricLabels() {
        // Remove all child nodes
        this.lyricLabels.forEach(node => {
            node.removeFromParent();
        });

        this.lyricLabels = [];
        this.currentLyricIndex = -1;
    }

    /**
     * Highlight the current lyric and scroll to it
     */
    private highlightCurrentLyric(index: number) {
        if (index < 0 || index >= this.lyricLabels.length) return;

        // Update styles for all lyrics
        this.lyricLabels.forEach((node, i) => {
            const richText = node.getComponent(RichText);
            if (richText) {
                if (i === index) {
                    // Highlight current lyric
                    richText.string = `<color=#ffffff><b>${richText.string}</b></color>`;
                } else if (i < index) {
                    // Dim past lyrics
                    richText.string = `<color=#888888>${richText.string}</color>`;
                } else {
                    // Normal style for future lyrics
                    richText.string = `<color=#cccccc>${richText.string}</color>`;
                }
            }
        });

        // Scroll to current lyric
        if (this.lyricsContainer && index >= 0 && index < this.lyricLabels.length) {
            const targetNode = this.lyricLabels[index];
            if (targetNode) {
                // Calculate target position
                this.targetScrollPosition = -targetNode.position.y;
                this.isScrolling = true;
            }
        }
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
     * Clean up on destroy
     */
    onDestroy() {
        // Stop all animations
        this.stopAllAnimations();
    }
} 