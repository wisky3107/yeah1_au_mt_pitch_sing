import { _decorator, Component, Node, Button, Label, Sprite, tween, Vec3, UIOpacity } from 'cc';
import { AuditionGameManager } from '../Core/AuditionGameManager';
import { AuditionAudioManager } from '../Systems/AuditionAudioManager';
import { AuditionUIManager } from './AuditionUIManager';
const { ccclass, property } = _decorator;

/**
 * Controller for the Results scene
 * Displays performance stats and provides navigation options
 */
@ccclass('AuditionResultsController')
export class AuditionResultsController extends Component {
    // UI components
    @property(Button)
    private retryButton: Button = null;
    
    @property(Button)
    private nextButton: Button = null;
    
    @property(Button)
    private mainMenuButton: Button = null;
    
    @property(Node)
    private resultsContent: Node = null;
    
    @property(Node)
    private expGainDisplay: Node = null;
    
    @property(Label)
    private expGainLabel: Label = null;
    
    // Audio settings
    @property
    private backgroundMusicPath: string = 'audition/audio/results_music';
    
    @property
    private buttonClickSound: string = 'click';
    
    @property
    private resultsSound: string = 'results';
    
    private isAnimatingResults: boolean = false;
    
    onLoad() {
        // Setup UI
        AuditionUIManager.instance.showResults();
        
        // Setup button events
        this.setupButtonEvents();
        
        // Hide results content initially for animation
        if (this.resultsContent) {
            this.resultsContent.scale = new Vec3(0.8, 0.8, 1);
            
            // Ensure there's a UIOpacity component
            let opacityComp = this.resultsContent.getComponent(UIOpacity);
            if (!opacityComp) {
                opacityComp = this.resultsContent.addComponent(UIOpacity);
            }
            opacityComp.opacity = 0;
        }
        
        // Hide exp gain display initially
        if (this.expGainDisplay) {
            this.expGainDisplay.active = false;
        }
    }
    
    start() {
        // Play background music
        this.playBackgroundMusic();
        
        // Play results sound
        AuditionAudioManager.instance.playSound(this.resultsSound);
        
        // Animate results with a slight delay
        this.scheduleOnce(() => {
            this.animateResults();
        }, 0.5);
    }
    
    /**
     * Setup button event listeners
     */
    private setupButtonEvents(): void {
        // Retry button
        if (this.retryButton) {
            this.retryButton.node.on(Button.EventType.CLICK, this.onRetryButtonClicked, this);
            this.retryButton.interactable = false; // Disabled until animation completes
        }
        
        // Next button
        if (this.nextButton) {
            this.nextButton.node.on(Button.EventType.CLICK, this.onNextButtonClicked, this);
            this.nextButton.interactable = false; // Disabled until animation completes
        }
        
        // Main menu button
        if (this.mainMenuButton) {
            this.mainMenuButton.node.on(Button.EventType.CLICK, this.onMainMenuButtonClicked, this);
            this.mainMenuButton.interactable = false; // Disabled until animation completes
        }
    }
    
    /**
     * Play background music for the results screen
     */
    private playBackgroundMusic(): void {
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.loadSong(this.backgroundMusicPath)
                .then(() => {
                    audioManager.playSong();
                })
                .catch(error => {
                    console.error('Failed to load results music:', error);
                });
        }
    }
    
    /**
     * Animate the results screen appearance
     */
    private animateResults(): void {
        if (!this.resultsContent) return;
        
        this.isAnimatingResults = true;
        
        // Make results content visible
        this.resultsContent.active = true;
        
        // Animate scale and opacity
        tween(this.resultsContent)
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .start();
            
        // Get or add UIOpacity component
        const opacityComp = this.resultsContent.getComponent(UIOpacity) || this.resultsContent.addComponent(UIOpacity);
        if (opacityComp) {
            tween(opacityComp)
                .to(0.5, { opacity: 255 })
                .call(() => {
                    // Show experience gain after results are displayed
                    this.scheduleOnce(() => {
                        this.showExperienceGain();
                    }, 1.0);
                })
                .start();
        }
    }
    
    /**
     * Show experience gain animation
     */
    private showExperienceGain(): void {
        if (!this.expGainDisplay || !this.expGainLabel) return;
        
        // Get experience from game manager
        const gameManager = AuditionGameManager.instance;
        if (!gameManager) return;
        
        // Set experience gain text - Using a default value of 100 EXP
        // Note: Implement getLastExperienceGain in AuditionGameManager
        const lastSongExp = 100; // Default value until proper implementation
        if (this.expGainLabel) {
            this.expGainLabel.string = `+${lastSongExp} EXP`;
        }
        
        // Show display
        this.expGainDisplay.active = true;
        
        // Animate with a bounce effect
        this.expGainDisplay.scale = new Vec3(0.5, 0.5, 1);
        tween(this.expGainDisplay)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                // Animation complete, enable buttons
                this.enableButtons();
                this.isAnimatingResults = false;
            })
            .start();
    }
    
    /**
     * Enable navigation buttons
     */
    private enableButtons(): void {
        if (this.retryButton) {
            this.retryButton.interactable = true;
        }
        
        if (this.nextButton) {
            this.nextButton.interactable = true;
        }
        
        if (this.mainMenuButton) {
            this.mainMenuButton.interactable = true;
        }
    }
    
    /**
     * Handle retry button click
     */
    private onRetryButtonClicked(): void {
        // Play click sound
        AuditionAudioManager.instance.playSound(this.buttonClickSound);
        
        // Get current song ID
        const gameManager = AuditionGameManager.instance;
        if (!gameManager) return;
        
        const currentSong = gameManager.getCurrentSong();
        if (!currentSong) return;
        
        // Restart the song
        gameManager.startSong(currentSong.id);
    }
    
    /**
     * Handle next button click
     */
    private onNextButtonClicked(): void {
        // Play click sound
        AuditionAudioManager.instance.playSound(this.buttonClickSound);
        
        // Return to song selection
        AuditionGameManager.instance.changeScene('AuditionSongSelection');
    }
    
    /**
     * Handle main menu button click
     */
    private onMainMenuButtonClicked(): void {
        // Play click sound
        AuditionAudioManager.instance.playSound(this.buttonClickSound);
        
        // Return to main menu
        AuditionGameManager.instance.changeScene('AuditionMainMenu');
    }
    
    onDestroy() {
        // Stop any playing music
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }
    }
} 