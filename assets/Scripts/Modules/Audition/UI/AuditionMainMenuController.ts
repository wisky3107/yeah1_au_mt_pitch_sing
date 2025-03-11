import { _decorator, Component, Node, Button, Label, Sprite, tween, Vec3, UIOpacity } from 'cc';
import { AuditionGameManager } from '../Core/AuditionGameManager';
import { AuditionAudioManager } from '../Systems/AuditionAudioManager';
import { AuditionUIManager } from './AuditionUIManager';
const { ccclass, property } = _decorator;

/**
 * Controller for the Main Menu scene
 * Provides options for navigating to different parts of the game
 */
@ccclass('AuditionMainMenuController')
export class AuditionMainMenuController extends Component {
    // UI elements
    @property(Button)
    private playButton: Button = null;
    
    @property(Button)
    private customizeButton: Button = null;
    
    @property(Button)
    private optionsButton: Button = null;
    
    @property(Button)
    private exitButton: Button = null;
    
    @property(Node)
    private logoNode: Node = null;
    
    @property(Label)
    private playerLevelLabel: Label = null;
    
    @property(Label)
    private versionLabel: Label = null;
    
    // Audio settings
    @property
    private backgroundMusicPath: string = 'audition/audio/menu_music';
    
    @property
    private buttonSound: string = 'click';
    
    // Animation settings
    @property
    private animateElements: boolean = true;
    
    onLoad() {
        // Setup button events
        this.setupButtonEvents();
        
        // Initialize UI animations
        if (this.animateElements) {
            this.initializeAnimations();
        }
        
        // Set version label
        if (this.versionLabel) {
            this.versionLabel.string = 'v0.1.0 Alpha';
        }
    }
    
    start() {
        // Play background music
        this.playBackgroundMusic();
        
        // Update player level display
        this.updatePlayerLevel();
    }
    
    /**
     * Setup button event listeners
     */
    private setupButtonEvents(): void {
        // Play button
        if (this.playButton) {
            this.playButton.node.on(Button.EventType.CLICK, this.onPlayButtonClicked, this);
        }
        
        // Customize button
        if (this.customizeButton) {
            this.customizeButton.node.on(Button.EventType.CLICK, this.onCustomizeButtonClicked, this);
        }
        
        // Options button
        if (this.optionsButton) {
            this.optionsButton.node.on(Button.EventType.CLICK, this.onOptionsButtonClicked, this);
        }
        
        // Exit button
        if (this.exitButton) {
            this.exitButton.node.on(Button.EventType.CLICK, this.onExitButtonClicked, this);
        }
    }
    
    /**
     * Initialize animations for UI elements
     */
    private initializeAnimations(): void {
        // Animate logo
        if (this.logoNode) {
            // Start from slightly larger scale
            this.logoNode.scale = new Vec3(1.2, 1.2, 1);
            
            // Create a subtle floating animation
            tween(this.logoNode)
                .to(2.0, { scale: new Vec3(1.1, 1.1, 1) })
                .to(2.0, { scale: new Vec3(1.2, 1.2, 1) })
                .union()
                .repeatForever()
                .start();
        }
        
        // Animate buttons (if present)
        const buttons = [this.playButton, this.customizeButton, this.optionsButton, this.exitButton];
        
        buttons.forEach((button, index) => {
            if (button) {
                const originalScale = button.node.scale.clone();
                
                // Add hover effect
                button.node.on(Node.EventType.MOUSE_ENTER, () => {
                    tween(button.node)
                        .to(0.2, { scale: new Vec3(originalScale.x * 1.1, originalScale.y * 1.1, 1) })
                        .start();
                });
                
                button.node.on(Node.EventType.MOUSE_LEAVE, () => {
                    tween(button.node)
                        .to(0.2, { scale: originalScale })
                        .start();
                });
                
                // Initial animation: fade in from bottom
                button.node.setPosition(button.node.position.x, button.node.position.y - 50);
                
                // Setup UIOpacity component
                let opacityComp = button.node.getComponent(UIOpacity);
                if (!opacityComp) {
                    opacityComp = button.node.addComponent(UIOpacity);
                }
                opacityComp.opacity = 0;
                
                // Tween position and opacity
                tween(button.node)
                    .delay(0.2 + index * 0.1)
                    .to(0.5, { position: new Vec3(button.node.position.x, button.node.position.y + 50, 0) }, { easing: 'backOut' })
                    .start();
                    
                // Tween opacity separately
                tween(opacityComp)
                    .delay(0.2 + index * 0.1)
                    .to(0.5, { opacity: 255 })
                    .start();
            }
        });
    }
    
    /**
     * Play background music for the menu
     */
    private playBackgroundMusic(): void {
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.loadSong(this.backgroundMusicPath)
                .then(() => {
                    audioManager.playSong();
                })
                .catch(error => {
                    console.error('Failed to load menu music:', error);
                });
        }
    }
    
    /**
     * Update player level display based on experience
     */
    private updatePlayerLevel(): void {
        const gameManager = AuditionGameManager.instance;
        if (!gameManager || !this.playerLevelLabel) return;
        
        const experience = gameManager.getExperience();
        
        // Calculate player level (simple formula, can be adjusted)
        const level = Math.floor(Math.sqrt(experience / 100)) + 1;
        
        // Display level
        this.playerLevelLabel.string = `Level ${level}`;
    }
    
    /**
     * Handle play button click
     */
    private onPlayButtonClicked(): void {
        AuditionAudioManager.instance.playSound(this.buttonSound);
        AuditionGameManager.instance.changeScene('AuditionSongSelection');
    }
    
    /**
     * Handle customize button click
     */
    private onCustomizeButtonClicked(): void {
        AuditionAudioManager.instance.playSound(this.buttonSound);
        // Navigate to customization scene (if implemented)
        console.log('Customize button clicked - Feature coming soon');
    }
    
    /**
     * Handle options button click
     */
    private onOptionsButtonClicked(): void {
        AuditionAudioManager.instance.playSound(this.buttonSound);
        // Navigate to options scene (if implemented)
        console.log('Options button clicked - Feature coming soon');
    }
    
    /**
     * Handle exit button click
     */
    private onExitButtonClicked(): void {
        AuditionAudioManager.instance.playSound(this.buttonSound);
        console.log('Exit button clicked');
        // Implementation depends on target platform
        // For web, might just return to a landing page
    }
    
    onDestroy() {
        // Stop background music
        const audioManager = AuditionAudioManager.instance;
        if (audioManager) {
            audioManager.stopSong();
        }
    }
} 