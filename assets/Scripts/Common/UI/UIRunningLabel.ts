import { _decorator, Component, Label, Node, tween, Tween } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIRunningLabel')
@requireComponent(Label)
export class UIRunningLabel extends Component {
    @property
    private wordDelay: number = 0.1; // Delay between each word appearance

    private label: Label = null;
    private tweenMain: Tween<any> = null;
    private fullText: string = '';
    private words: string[] = [];
    private currentWordIndex: number = 0;

    protected onLoad(): void {
        this.label = this.node.getComponent(Label);
    }

    /**
     * Sets the text to be animated word by word
     * @param text The full text to display
     * @param duration Total duration for the animation
     * @param callback Function to call when animation completes
     */
    public setText(text: string, duration: number = 1, callback?: () => void): void {
        this.stop();
        this.fullText = text;
        this.words = text.split(' ');
        this.currentWordIndex = 0;
        this.label.string = '';

        if (this.words.length === 0) {
            callback?.();
            return;
        }

        const totalWords = this.words.length;
        const wordDuration = duration / totalWords;
        this.wordDelay = Math.min(wordDuration, 0.1); // Cap the delay at 0.1s per word

        this.animateNextWord(callback);
    }

    private animateNextWord(callback?: () => void): void {
        if (this.currentWordIndex >= this.words.length) {
            callback?.();
            return;
        }

        const currentText = this.words.slice(0, this.currentWordIndex + 1).join(' ');
        this.label.string = currentText;
        this.currentWordIndex++;

        this.tweenMain = tween(this.node)
            .delay(this.wordDelay)
            .call(() => {
                this.animateNextWord(callback);
            })
            .start();
    }

    public stop(): void {
        this.tweenMain?.stop();
        this.tweenMain = null;
        this.currentWordIndex = 0;
    }

    protected onDisable(): void {
        this.stop();
    }
} 