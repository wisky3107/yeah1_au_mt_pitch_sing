import { _decorator, Component, Node, Label, Button, Sprite, UITransform, tween, Vec3, Color, ProgressBar, ScrollView, Widget, view, sys, UIOpacity, EventHandler, instantiate } from 'cc';
import { MagicTilesAudioManager } from './MagicTilesAudioManager';

const { ccclass, property } = _decorator;

/**
 * UI states representing different screens in the game
 */
export enum UIState {
    NONE,
    MAIN_MENU,
    SONG_SELECT,
    GAMEPLAY,
    PAUSE_MENU,
    RESULTS,
    SETTINGS,
    TUTORIAL,
    SHOP
}

/**
 * UIManager for Magic Tiles 3
 * Handles all UI elements, menus, transitions, and responsive layout
 */
@ccclass('MTUIManager')
export class MTUIManager extends Component {
    // Static instance for global access
    private static _instance: MTUIManager | null = null;

    public static get instance(): MTUIManager {
        if (!MTUIManager._instance) {
            return null;
        }
        return MTUIManager._instance!;
    }

    // UI Screens (top-level containers)
    @property(Node)
    mainMenuScreen: Node = null!;

    @property(Node)
    songSelectScreen: Node = null!;

    @property(Node)
    gameplayScreen: Node = null!;

    @property(Node)
    pauseMenuScreen: Node = null!;

    @property(Node)
    resultsScreen: Node = null!;

    @property(Node)
    settingsScreen: Node = null!;

    @property(Node)
    tutorialScreen: Node = null!;

    @property(Node)
    shopScreen: Node = null!;

    @property(Node)
    loadingScreen: Node = null!;

    // HUD Elements
    @property(Label)
    scoreLabel: Label = null!;

    @property(Label)
    songTimeLabel: Label = null!;

    @property(Label)
    comboLabel: Label = null!;

    @property(ProgressBar)
    progressBar: ProgressBar = null!;

    @property(Sprite)
    healthBar: Sprite = null!;

    @property(Label)
    songTitleLabel: Label = null!;

    @property(Label)
    songArtistLabel: Label = null!;

    // Results Elements
    @property(Label)
    finalScoreLabel: Label = null!;

    @property(Label)
    accuracyLabel: Label = null!;

    @property(Label)
    maxComboLabel: Label = null!;

    @property(Label)
    perfectCountLabel: Label = null!;

    @property(Label)
    goodCountLabel: Label = null!;

    @property(Label)
    okCountLabel: Label = null!;

    @property(Label)
    missCountLabel: Label = null!;

    // Managers
    // @property(GameplayManager)
    // gameplayManager: GameplayManager = null!;

    // @property(ScoreManager)
    // scoreManager: ScoreManager = null!;

    // @property(TapValidator)
    // tapValidator: TapValidator = null!;

    // @property(SongSelectionManager)
    // songSelectionManager: SongSelectionManager = null!;

    // UI Settings
    @property
    transitionDuration: number = 0.3;

    @property
    popupScaleDuration: number = 0.2;

    // Current state
    private currentUIState: UIState = UIState.NONE;
    private previousUIState: UIState = UIState.NONE;
    private isTransitioning: boolean = false;
    private audioManager: MagicTilesAudioManager = null!;

    // Screen size variables for responsive layout
    private screenWidth: number = 0;
    private screenHeight: number = 0;
    private safeAreaTop: number = 0;
    private safeAreaBottom: number = 0;
    private isPortrait: boolean = true;

    onLoad() {
        // Set static instance
        MTUIManager._instance = this;

        // Get audio manager
        this.audioManager = MagicTilesAudioManager.instance;

        // Initialize UI state
        this.initializeUI();

        // Register for gameplay manager events
        // if (this.gameplayManager) {
        //     this.gameplayManager.onGameStateChanged(this.onGameStateChanged.bind(this));
        //     this.gameplayManager.onSurvivalHPChanged(this.updateHealthBar.bind(this));
        // }sys

        // // Register for score manager events
        // if (this.scoreManager) {
        //     this.scoreManager.onScoreChanged(this.updateScoreDisplay.bind(this));
        // }

        // // Register for tap validator events
        // if (this.tapValidator) {
        //     this.tapValidator.onComboChange(this.updateComboDisplay.bind(this));
        // }

        // Register for window resize events
        view.on('design-resolution-changed', this.onScreenResize, this);
        view.on('canvas-resize', this.onScreenResize, this);

        // Initial screen setup
        this.onScreenResize();
    }

    onDestroy() {
        // Unregister from window resize events
        view.off('design-resolution-changed', this.onScreenResize, this);
        view.off('canvas-resize', this.onScreenResize, this);

        // Clear static instance
        if (MTUIManager._instance === this) {
            MTUIManager._instance = null;
        }
    }

    /**
     * Initialize UI state and hide all screens
     */
    private initializeUI() {
        // Hide all screens initially
        this.hideAllScreens();

        // Set initial state
        this.changeUIState(UIState.MAIN_MENU);
    }

    /**
     * Handle screen resize to adjust layout
     */
    private onScreenResize() {
        const visibleSize = view.getVisibleSize();
        this.screenWidth = visibleSize.width;
        this.screenHeight = visibleSize.height;
        this.isPortrait = this.screenHeight > this.screenWidth;

        // Get safe area info (mainly for mobile devices with notches)
        if (sys.platform === sys.Platform.MOBILE_BROWSER ||
            sys.platform === sys.Platform.IOS ||
            sys.platform === sys.Platform.ANDROID) {

            const safeArea = sys.getSafeAreaRect();
            this.safeAreaTop = safeArea.y;
            this.safeAreaBottom = visibleSize.height - (safeArea.y + safeArea.height);
        }

        // Adjust layout for current orientation
        this.adjustLayoutForScreenSize();
    }

    /**
     * Adjust layout based on screen size and orientation
     */
    private adjustLayoutForScreenSize() {
        // Find all widgets in the scene and update their alignments
        this.updateWidgetsInNode(this.node);

        // Adjust specific layouts based on orientation
        if (this.isPortrait) {
            this.applyPortraitLayout();
        } else {
            this.applyLandscapeLayout();
        }
    }

    /**
     * Apply portrait-specific layout changes
     */
    private applyPortraitLayout() {
        // Adjust game elements for portrait mode
        // For example, make lanes narrower and taller

        // Position HUD elements for portrait
        if (this.scoreLabel) {
            this.scoreLabel.node.position = new Vec3(0, this.screenHeight * 0.4, 0);
        }

        if (this.comboLabel) {
            this.comboLabel.node.position = new Vec3(0, this.screenHeight * 0.3, 0);
        }

        // Adjust progress bar width
        if (this.progressBar) {
            const transform = this.progressBar.getComponent(UITransform);
            if (transform) {
                transform.width = this.screenWidth * 0.8;
            }
        }

        console.log("Applied portrait layout");
    }

    /**
     * Apply landscape-specific layout changes
     */
    private applyLandscapeLayout() {
        // Adjust game elements for landscape mode
        // For example, make lanes wider and shorter

        // Position HUD elements for landscape
        if (this.scoreLabel) {
            this.scoreLabel.node.position = new Vec3(this.screenWidth * 0.3, this.screenHeight * 0.4, 0);
        }

        if (this.comboLabel) {
            this.comboLabel.node.position = new Vec3(this.screenWidth * 0.3, this.screenHeight * 0.3, 0);
        }

        // Adjust progress bar width
        if (this.progressBar) {
            const transform = this.progressBar.getComponent(UITransform);
            if (transform) {
                transform.width = this.screenWidth * 0.6;
            }
        }

        console.log("Applied landscape layout");
    }

    /**
     * Update all widgets in a node hierarchy to refresh layout
     */
    private updateWidgetsInNode(node: Node) {
        // Update the current node's widget if it has one
        const widget = node.getComponent(Widget);
        if (widget) {
            widget.updateAlignment();
        }

        // Update all children recursively
        for (let i = 0; i < node.children.length; i++) {
            this.updateWidgetsInNode(node.children[i]);
        }
    }

    /**
     * Handle game state changes from the gameplay manager
     */
    // private onGameStateChanged(newState: GameState) {
    //     switch (newState) {
    //         case GameState.NONE:
    //             // Usually means we're returning to menu
    //             this.changeUIState(UIState.MAIN_MENU);
    //             break;

    //         case GameState.LOADING:
    //             this.showLoadingScreen(true);
    //             break;

    //         case GameState.COUNTDOWN:
    //             this.showLoadingScreen(false);
    //             this.changeUIState(UIState.GAMEPLAY);
    //             break;

    //         case GameState.PLAYING:
    //             this.updateGameplayUI();
    //             break;

    //         case GameState.PAUSED:
    //             this.changeUIState(UIState.PAUSE_MENU);
    //             break;

    //         case GameState.COMPLETED:
    //         case GameState.FAILED:
    //             this.prepareResultsScreen();
    //             this.changeUIState(UIState.RESULTS);
    //             break;
    //     }
    // }

    /**
     * Change the current UI state with animation
     */
    changeUIState(newState: UIState) {
        // Prevent changing during transition
        if (this.isTransitioning) return;

        // Skip if same state
        if (newState === this.currentUIState) return;

        this.isTransitioning = true;
        this.previousUIState = this.currentUIState;
        this.currentUIState = newState;

        // Fade out current screen
        const currentScreen = this.getScreenForState(this.previousUIState);
        if (currentScreen) {
            tween(currentScreen)
                .to(this.transitionDuration / 2, { scale: new Vec3(0.9, 0.9, 1) })
                .call(() => {
                    currentScreen.active = false;

                    // Fade in new screen
                    const newScreen = this.getScreenForState(newState);
                    if (newScreen) {
                        newScreen.active = true;
                        newScreen.scale = new Vec3(0.9, 0.9, 1);

                        tween(newScreen)
                            .to(this.transitionDuration / 2, { scale: new Vec3(1, 1, 1) })
                            .call(() => {
                                this.isTransitioning = false;
                                this.onUIStateChanged(newState);
                            })
                            .start();
                    } else {
                        this.isTransitioning = false;
                    }
                })
                .start();
        } else {
            // No current screen, just show new screen
            const newScreen = this.getScreenForState(newState);
            if (newScreen) {
                newScreen.active = true;
                newScreen.scale = new Vec3(0.9, 0.9, 1);

                tween(newScreen)
                    .to(this.transitionDuration / 2, { scale: new Vec3(1, 1, 1) })
                    .call(() => {
                        this.isTransitioning = false;
                        this.onUIStateChanged(newState);
                    })
                    .start();
            } else {
                this.isTransitioning = false;
            }
        }
    }

    /**
     * Get the screen node for a UI state
     */
    private getScreenForState(state: UIState): Node | null {
        switch (state) {
            case UIState.MAIN_MENU:
                return this.mainMenuScreen;
            case UIState.SONG_SELECT:
                return this.songSelectScreen;
            case UIState.GAMEPLAY:
                return this.gameplayScreen;
            case UIState.PAUSE_MENU:
                return this.pauseMenuScreen;
            case UIState.RESULTS:
                return this.resultsScreen;
            case UIState.SETTINGS:
                return this.settingsScreen;
            case UIState.TUTORIAL:
                return this.tutorialScreen;
            case UIState.SHOP:
                return this.shopScreen;
            default:
                return null;
        }
    }

    /**
     * Handle actions when UI state has changed
     */
    private onUIStateChanged(newState: UIState) {
        // Handle state-specific actions
        switch (newState) {
            case UIState.MAIN_MENU:
                // Play menu music
                this.audioManager.playSound("menu_music");
                break;

            case UIState.SONG_SELECT:
                // Initialize song list
                // if (this.songSelectionManager) {
                //     this.songSelectionManager.refreshSongList();
                // }
                break;

            case UIState.GAMEPLAY:
                // Make sure HUD elements are visible and updated
                this.updateGameplayUI();
                break;

            case UIState.RESULTS:
                // Results screen is prepared in prepareResultsScreen()
                break;
        }
    }

    /**
     * Hide all UI screens
     */
    private hideAllScreens() {
        if (this.mainMenuScreen) this.mainMenuScreen.active = false;
        if (this.songSelectScreen) this.songSelectScreen.active = false;
        if (this.gameplayScreen) this.gameplayScreen.active = false;
        if (this.pauseMenuScreen) this.pauseMenuScreen.active = false;
        if (this.resultsScreen) this.resultsScreen.active = false;
        if (this.settingsScreen) this.settingsScreen.active = false;
        if (this.tutorialScreen) this.tutorialScreen.active = false;
        if (this.shopScreen) this.shopScreen.active = false;
        if (this.loadingScreen) this.loadingScreen.active = false;
    }

    /**
     * Show/hide the loading screen
     */
    showLoadingScreen(show: boolean) {
        if (this.loadingScreen) {
            this.loadingScreen.active = show;
        }
    }

    /**
     * Update gameplay HUD elements
     */
    private updateGameplayUI() {
        // this.updateScoreDisplay(this.scoreManager.getCurrentScore());
        // this.updateComboDisplay(this.tapValidator.getCombo());
        // this.updateProgressBar(this.gameplayManager.getProgress());
        // this.updateHealthBar(this.gameplayManager.getSurvivalHP());
    }

    /**
     * Update the score display
     */
    updateScoreDisplay(score: number) {
        if (this.scoreLabel) {
            this.scoreLabel.string = score.toLocaleString();
        }
    }

    updateSongTimeDisplay(time: number) {
        if (this.songTimeLabel) {
            this.songTimeLabel.string = this.formatTime(time);
        }
    }

    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds}`;
    }

    /**
     * Update the combo display
     */
    updateComboDisplay(combo: number) {
        if (this.comboLabel) {
            if (combo > 1) {
                this.comboLabel.string = `${combo}x`;
                this.comboLabel.node.active = true;

                // Pulse animation
                tween(this.comboLabel.node)
                    .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .start();
            } else {
                this.comboLabel.string = "";
                this.comboLabel.node.active = false;
            }
        }
    }

    /**
     * Update the progress bar
     */
    updateProgressBar(progress: number) {
        if (this.progressBar) {
            this.progressBar.progress = progress;
        }
    }

    /**
     * Update the health bar
     */
    updateHealthBar(hp: number) {
        // if (this.healthBar) {
        //     // Update fill amount
        //     const maxHP = this.gameplayManager.maxSurvivalHP;
        //     const fillAmount = hp / maxHP;

        //     // Get the fill sprite if this is a progress bar
        //     const fillSprite = this.healthBar.node.getChildByName("Fill")?.getComponent(Sprite);
        //     if (fillSprite) {
        //         const transform = fillSprite.getComponent(UITransform);
        //         if (transform) {
        //             const parentTransform = this.healthBar.getComponent(UITransform);
        //             transform.width = parentTransform.width * fillAmount;
        //         }
        //     }

        //     // Change color based on health
        //     let color = new Color();
        //     if (fillAmount > 0.6) {
        //         // Green for high health
        //         color = new Color(0, 255, 0, 255);
        //     } else if (fillAmount > 0.3) {
        //         // Yellow for medium health
        //         color = new Color(255, 255, 0, 255);
        //     } else {
        //         // Red for low health
        //         color = new Color(255, 0, 0, 255);

        //         // Pulse animation for low health
        //         if (fillAmount < 0.2) {
        //             tween(this.healthBar.node)
        //                 // .to(0.5, { opacity: 150 })
        //                 // .to(0.5, { opacity: 255 })
        //                 .union()
        //                 .repeatForever()
        //                 .start();
        //         }
        //     }

        //     if (fillSprite) {
        //         fillSprite.color = color;
        //     } else {
        //         this.healthBar.color = color;
        //     }
        // }
    }

    /**
     * Prepare the results screen with final stats
     */
    private prepareResultsScreen(
        finalScore: number = 0,
        accuracy: number = 0,
        maxCombo: number = 0,
        ratingCounts: { perfect: number, good: number, ok: number, miss: number } = { perfect: 0, good: 0, ok: 0, miss: 0 }
    ) {
        if (!this.resultsScreen) return;

        // Update UI elements
        if (this.finalScoreLabel) {
            this.finalScoreLabel.string = finalScore.toLocaleString();
        }

        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${accuracy.toFixed(2)}%`;
        }

        if (this.maxComboLabel) {
            this.maxComboLabel.string = `${maxCombo}x`;
        }

        if (this.perfectCountLabel) {
            this.perfectCountLabel.string = ratingCounts.perfect.toString();
        }

        if (this.goodCountLabel) {
            this.goodCountLabel.string = ratingCounts.good.toString();
        }

        if (this.okCountLabel) {
            this.okCountLabel.string = ratingCounts.ok.toString();
        }

        if (this.missCountLabel) {
            this.missCountLabel.string = ratingCounts.miss.toString();
        }

        // Check for high score
        const isHighScore = false; // TODO: Implement high score check

        // Show high score label if applicable
        const highScoreLabel = this.resultsScreen.getChildByName("HighScoreLabel");
        if (highScoreLabel) {
            highScoreLabel.active = isHighScore;

            if (isHighScore) {
                // Animate high score label
                tween(highScoreLabel)
                    .to(0.5, { scale: new Vec3(1.2, 1.2, 1), angle: 5 })
                    .to(0.5, { scale: new Vec3(1, 1, 1), angle: -5 })
                    .union()
                    .repeatForever()
                    .start();
            }
        }
    }

    /**
     * Show a popup dialog
     */
    showPopup(message: string, title: string = "", buttonText: string = "OK") {
        // Find popup template
        const popupTemplate = this.node.getChildByName("PopupTemplate");
        if (!popupTemplate) return;

        // Create popup instance
        const popup = instantiate(popupTemplate);
        popup.parent = this.node;
        popup.active = true;

        // Set content
        const titleLabel = popup.getChildByName("Title")?.getComponent(Label);
        const messageLabel = popup.getChildByName("Message")?.getComponent(Label);
        const button = popup.getChildByName("OkButton")?.getComponent(Button);
        const buttonLabel = button?.node.getChildByName("Label")?.getComponent(Label);

        if (titleLabel) {
            titleLabel.string = title;
            titleLabel.node.active = title.length > 0;
        }

        if (messageLabel) {
            messageLabel.string = message;
        }

        if (buttonLabel) {
            buttonLabel.string = buttonText;
        }

        // Setup button action
        if (button) {
            const clickEventHandler = new EventHandler();
            clickEventHandler.target = popup;
            clickEventHandler.component = "UIManager";
            clickEventHandler.handler = "onPopupButtonClicked";
            button.clickEvents.push(clickEventHandler);
        }

        // Animation
        popup.scale = new Vec3(0.8, 0.8, 1);
        tween(popup)
            .to(this.popupScaleDuration, { scale: new Vec3(1, 1, 1) })
            .start();

        return popup;
    }

    /**
     * Close a popup
     */
    closePopup(popup: Node) {
        tween(popup)
            .to(this.popupScaleDuration, { scale: new Vec3(0.8, 0.8, 1) })
            .call(() => {
                popup.destroy();
            })
            .start();
    }

    /**
     * Event handler for popup button clicks
     */
    onPopupButtonClicked(event: Event, customData?: string) {
        // Get the popup node (parent of the button)
        const button = event.target as unknown as Node;
        if (!button) return;

        const popup = button.parent;
        if (!popup) return;

        // Close the popup
        this.closePopup(popup);

        // Handle specific actions based on customData
        if (customData) {
            switch (customData) {
                case "retry":
                    // this.gameplayManager.restartGame();
                    break;
                case "exit":
                    // this.gameplayManager.exitGame();
                    break;
            }
        }
    }

    /**
     * Navigate to main menu
     */
    navigateToMainMenu() {
        this.changeUIState(UIState.MAIN_MENU);
    }

    /**
     * Navigate to song selection
     */
    navigateToSongSelect() {
        this.changeUIState(UIState.SONG_SELECT);
    }

    /**
     * Navigate to settings
     */
    navigateToSettings() {
        this.changeUIState(UIState.SETTINGS);
    }

    /**
     * Navigate to tutorial
     */
    navigateToTutorial() {
        this.changeUIState(UIState.TUTORIAL);
    }

    /**
     * Navigate to shop
     */
    navigateToShop() {
        this.changeUIState(UIState.SHOP);
    }

    /**
     * Handle back button or ESC key
     */
    handleBackNavigation() {
        // Handle back navigation based on current state
        switch (this.currentUIState) {
            case UIState.SONG_SELECT:
            case UIState.SETTINGS:
            case UIState.TUTORIAL:
            case UIState.SHOP:
                this.navigateToMainMenu();
                break;

            case UIState.GAMEPLAY:
                // this.gameplayManager.togglePause();
                break;

            case UIState.PAUSE_MENU:
                // this.gameplayManager.resumeGame();
                break;

            case UIState.RESULTS:
                this.navigateToSongSelect();
                break;
        }
    }
} 