import { _decorator, Component, Node, Label, Button, UITransform, Sprite, Color, Tween, tween, Vec3, game, UIOpacity, ParticleSystem2D, Animation } from 'cc';
import { SongData } from '../Data/SongData';
import { AuditionAudioManager } from '../Systems/AuditionAudioManager';
const { ccclass, property } = _decorator;

/**
 * UI state enum
 */
enum UIState {
    MAIN_MENU,
    SONG_SELECTION,
    GAMEPLAY,
    RESULTS,
    SETTINGS
}

/**
 * Feedback type enum for visual feedback
 */
export enum FeedbackType {
    PERFECT,
    GREAT,
    COOL,
    MISS
}

/**
 * UI Manager for Audition module
 * Manages UI screens, transitions, and common functionality
 */
@ccclass('AuditionUIManager')
export class AuditionUIManager extends Component {
    //#region Singleton
    private static _instance: AuditionUIManager = null;

    public static get instance(): AuditionUIManager {
        return this._instance;
    }
    //#endregion

    @property({type: AuditionAudioManager, group: {name: "Audio Manager", id: "audioManager"}})
    private audioManager: AuditionAudioManager = null;


    //#region UI Screen Properties
    @property({type: Node, group: {name: "UI Screens", id: "screens"}})
    private mainMenuScreen: Node = null;

    @property({type: Node, group: {name: "UI Screens", id: "screens"}})
    private songSelectionScreen: Node = null;

    @property({type: Node, group: {name: "UI Screens", id: "screens"}})
    private gameplayScreen: Node = null;

    @property({type: Node, group: {name: "UI Screens", id: "screens"}})
    private resultsScreen: Node = null;

    @property({type: Node, group: {name: "UI Screens", id: "screens"}})
    private settingsScreen: Node = null;
    //#endregion

    //#region Gameplay UI Properties
    @property({type: Label, group: {name: "Gameplay UI", id: "gameplay"}})
    private scoreLabel: Label = null;

    @property({type: Label, group: {name: "Gameplay UI", id: "gameplay"}})
    private comboCountLabel: Label = null;

    @property({type: Sprite, group: {name: "Gameplay UI", id: "gameplay"}})
    private progressBar: Sprite = null;

    @property({type: Animation, group: {name: "Gameplay UI", id: "gameplay"}})
    private readyGoAnimation: Animation = null;
    //#endregion

    //#region Results UI Properties
    @property({type: Label, group: {name: "Results UI", id: "results"}})
    private finalScoreLabel: Label = null;

    @property({type: Label, group: {name: "Results UI", id: "results"}})
    private accuracyLabel: Label = null;

    @property({type: Label, group: {name: "Results UI", id: "results"}})
    private maxComboLabel: Label = null;

    @property({type: Label, group: {name: "Results UI", id: "results"}})
    private gradeLabel: Label = null;
    //#endregion

    //#region Song Info Properties
    @property({type: Label, group: {name: "Song Info", id: "songInfo"}})
    private songNameLabel: Label = null;

    @property({type: Label, group: {name: "Song Info", id: "songInfo"}})
    private artistNameLabel: Label = null;

    @property({type: Label, group: {name: "Song Info", id: "songInfo"}})
    private bpmLabel: Label = null;

       

    //#endregion

    //#region Feedback Properties
    @property({
        type: [Node],
        tooltip: "Feedback animation nodes in order: perfect, good, cool, miss"
    })
    feedbackNodes: Node[] = [];

    @property(ParticleSystem2D)
    particleSystemPerfectFragments: ParticleSystem2D = null!;

    @property({type: Animation, group: {name: "Feedback", id: "feedback"}})
    animScoreFeedBacks: Animation = null;
    //#endregion

    //#region State Management
    private currentUIState: UIState = UIState.MAIN_MENU;
    private feedbackTween: Tween<Node> = null;
    private comboTween: Tween<Node> = null;
    //#endregion

    //#region Lifecycle Methods
    onLoad() {
        if (AuditionUIManager._instance === null) {
            AuditionUIManager._instance = this;
        } else {
            this.node.destroy();
        }
    }

    //#endregion

    //#region Screen Management
    public showMainMenu(): void {
        this.hideAllScreens();
        if (this.mainMenuScreen) {
            this.mainMenuScreen.active = true;
            this.currentUIState = UIState.MAIN_MENU;
        }
        console.log('Showing main menu');
    }

    public showSongSelection(): void {
        this.hideAllScreens();
        if (this.songSelectionScreen) {
            this.songSelectionScreen.active = true;
            this.currentUIState = UIState.SONG_SELECTION;
        }
        console.log('Showing song selection');
    }

    public showGameplay(songData: SongData): void {
        this.hideAllScreens();
        if (this.gameplayScreen) {
            this.gameplayScreen.active = true;
            this.currentUIState = UIState.GAMEPLAY;
        }
        console.log('Showing gameplay');

        if (this.songNameLabel) {
            this.songNameLabel.string = songData.title;
        }

        if (this.artistNameLabel) {
            this.artistNameLabel.string = songData.artist;
        }

        if (this.bpmLabel) {
            this.bpmLabel.string = songData.bpm.toString() + " BPM";
        }
    }

    public showResults(): void {
        this.hideAllScreens();
        if (this.resultsScreen) {
            this.resultsScreen.active = true;
            this.currentUIState = UIState.RESULTS;
        }
        console.log('Showing results');
    }

    public showSettings(): void {
        this.hideAllScreens();
        if (this.settingsScreen) {
            this.settingsScreen.active = true;
            this.currentUIState = UIState.SETTINGS;
        }
        console.log('Showing settings');
    }

    private hideAllScreens(): void {
        if (this.mainMenuScreen) this.mainMenuScreen.active = false;
        if (this.songSelectionScreen) this.songSelectionScreen.active = false;
        if (this.gameplayScreen) this.gameplayScreen.active = false;
        if (this.resultsScreen) this.resultsScreen.active = false;
        if (this.settingsScreen) this.settingsScreen.active = false;
    }
    //#endregion

    //#region Gameplay UI Updates
    public updateScore(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = this.formatNumberWithZeros(score, 8);
        }
    }

    public updateCombo(combo: number): void {
        if (this.comboCountLabel) {
            this.comboCountLabel.string = "x" + combo.toString();
            this.comboCountLabel.node.active = combo > 1;
        }
    }

    public updateProgress(progress: number): void {
        if (this.progressBar) {
            this.progressBar.fillRange = Math.max(0, Math.min(1, progress));
        }
    }

    public playReadyGoAnimation(): void {
        this.readyGoAnimation.node.active = true;
        this.readyGoAnimation.play();
        this.audioManager.playSound("s_ready");
        this.scheduleOnce(() => {
            this.audioManager.playSound("s_go");
        }, 1.0);
    }
    //#endregion

    //#region Results UI Updates
    public updateResults(score: number, accuracy: number, maxCombo: number, grade: string): void {
        if (this.finalScoreLabel) {
            this.finalScoreLabel.string = this.formatNumberWithZeros(score, 8);
        }

        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${accuracy.toFixed(2)}%`;
        }

        if (this.maxComboLabel) {
            this.maxComboLabel.string = `${maxCombo}`;
        }

        if (this.gradeLabel) {
            this.gradeLabel.string = grade;
            this.setGradeColor(grade);
        }
    }

    private setGradeColor(grade: string): void {
        switch (grade) {
            case 'S':
                this.gradeLabel.color = new Color(255, 215, 0, 255); // Gold
                break;
            case 'A':
                this.gradeLabel.color = new Color(0, 191, 255, 255); // Blue
                break;
            case 'B':
                this.gradeLabel.color = new Color(50, 205, 50, 255); // Green
                break;
            case 'C':
                this.gradeLabel.color = new Color(255, 165, 0, 255); // Orange
                break;
            case 'D':
                this.gradeLabel.color = new Color(255, 69, 0, 255); // Red
                break;
            case 'F':
                this.gradeLabel.color = new Color(128, 128, 128, 255); // Gray
                break;
        }
    }
    //#endregion

    //#region Utility Methods
    private formatNumberWithZeros(num: number, length: number): string {
        let result = num.toString();
        while (result.length < length) {
            result = '0' + result;
        }
        return result;
    }

    public getCurrentUIState(): UIState {
        return this.currentUIState;
    }
    //#endregion

    //#region Feedback System
    get perfectAnimNode(): Node { return this.feedbackNodes[0]; }
    get goodNode(): Node { return this.feedbackNodes[1]; }
    get coolNode(): Node { return this.feedbackNodes[2]; }
    get missNode(): Node { return this.feedbackNodes[3]; }
    private feedbackAnimNames = ["perfect", "great", "cool", "miss"];

    public showFeedback(type: FeedbackType): void {
        for (const node of this.feedbackNodes) {
            node.active = false;
        }

        if (this.feedbackNodes[type]) {
            this.feedbackNodes[type].active = true;
        }

        const animName = this.feedbackAnimNames[type];
        this.animScoreFeedBacks.play(animName);
    }
    //#endregion
} 