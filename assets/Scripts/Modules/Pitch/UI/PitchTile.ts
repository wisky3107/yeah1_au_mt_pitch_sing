import { _decorator, Component, Node, Sprite, UITransform, Color } from 'cc';
import { MusicalNote } from '../Systems/PitchConstants';
const { ccclass, property } = _decorator;

@ccclass('PitchTile')
export class PitchTile extends Component {
    @property(Sprite)
    private sprite: Sprite = null;

    @property(UITransform)
    private transform: UITransform = null;

    @property(Sprite)
    private progressSprite: Sprite = null;

    private note: MusicalNote = null;
    private duration: number = 0;
    private scrollSpeed: number = 0;
    private currentProgress: number = 0;
    private isActive: boolean = false;

    public initialize(note: MusicalNote, duration: number, scrollSpeed: number): void {
        this.note = note;
        this.duration = duration;
        this.scrollSpeed = scrollSpeed;
        this.currentProgress = 0;
        this.isActive = false;

        // Set width based on duration and scroll speed
        const width = duration * scrollSpeed;
        if (this.transform) {
            this.transform.setContentSize(width, this.transform.height);
        }

        // Reset progress sprite
        if (this.progressSprite) {
            this.progressSprite.fillRange = 0;
            this.progressSprite.color = new Color(255, 255, 255, 255);
        }
    }

    public updateProgress(deltaTime: number): void {
        if (!this.isActive) return;

        this.currentProgress = Math.min(1, this.currentProgress + (deltaTime / this.duration));
        
        if (this.progressSprite) {
            this.progressSprite.fillRange = this.currentProgress;
        }
    }

    public setActive(active: boolean): void {
        this.isActive = active;
        if (this.progressSprite) {
            this.progressSprite.color = active ? new Color(0, 255, 0, 255) : new Color(255, 255, 255, 255);
        }
    }

    public getProgress(): number {
        return this.currentProgress;
    }

    public isComplete(): boolean {
        return this.currentProgress >= 1;
    }

    public getNote(): MusicalNote {
        return this.note;
    }

    public getDuration(): number {
        return this.duration;
    }

    public updateDurationProgress(progress: number): void {
        if (this.progressSprite) {
            this.progressSprite.fillRange = progress;
            
            // Update color based on progress
            if (progress >= 0.95) {
                this.progressSprite.color = new Color(0, 255, 0, 255); // Green for perfect
            } else if (progress >= 0.8) {
                this.progressSprite.color = new Color(255, 255, 0, 255); // Yellow for good
            } else {
                this.progressSprite.color = new Color(255, 255, 255, 255); // White for in progress
            }
        }
    }
} 