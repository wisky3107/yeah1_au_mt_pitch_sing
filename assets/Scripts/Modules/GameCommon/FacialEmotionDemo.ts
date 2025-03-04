import { _decorator, Component, Node, Button, EventHandler, Vec3 } from 'cc';
import { FacialEmotion, FacialEmotionController } from './FacialEmotionController';
const { ccclass, property } = _decorator;

/**
 * Demo script showing how to use the FacialEmotionController
 */
@ccclass('FacialEmotionDemo')
export class FacialEmotionDemo extends Component {
    @property(FacialEmotionController)
    faceController: FacialEmotionController | null = null;

    @property(Node)
    emotionButtonsContainer: Node | null = null;

    @property
    transitionDuration: number = 0.5;

    private emotionButtons: Map<string, Button> = new Map();

    start() {
        if (!this.faceController) {
            console.error('Face controller not assigned!');
            return;
        }

        // Set up emotion buttons if container is provided
        if (this.emotionButtonsContainer) {
            this.setupEmotionButtons();
        }

        // Start with neutral expression
        this.setEmotion(FacialEmotion.NEUTRAL);
    }

    /**
     * Set up buttons for each emotion
     */
    private setupEmotionButtons() {
        if (!this.emotionButtonsContainer) return;
        
        // Get all buttons in the container
        const buttons = this.emotionButtonsContainer.getComponentsInChildren(Button);
        
        // Set up click handlers for each button
        for (const button of buttons) {
            const buttonName = button.node.name.toLowerCase();
            
            // Check if button name matches an emotion
            const emotions = [
                FacialEmotion.NEUTRAL,
                FacialEmotion.HAPPY,
                FacialEmotion.SAD,
                FacialEmotion.ANGRY,
                FacialEmotion.SURPRISED,
                FacialEmotion.FEAR,
                FacialEmotion.DISGUST
            ];
            
            const matchingEmotion = emotions.find(
                (emotion: string) => buttonName.includes(emotion.toLowerCase())
            );
            
            if (matchingEmotion) {
                // Store the button for later reference
                this.emotionButtons.set(matchingEmotion, button);
                
                // Add click event handler
                const clickHandler = new EventHandler();
                clickHandler.target = this.node;
                clickHandler.component = 'FacialEmotionDemo';
                clickHandler.handler = 'onEmotionButtonClicked';
                clickHandler.customEventData = matchingEmotion;
                
                button.clickEvents.push(clickHandler);
            }
        }
    }

    /**
     * Button click handler
     */
    onEmotionButtonClicked(event: Event, customData: string) {
        this.setEmotion(customData);
    }

    /**
     * Set a facial emotion with transition
     */
    setEmotion(emotion: string) {
        if (!this.faceController) return;
        
        console.log(`Setting emotion: ${emotion}`);
        this.faceController.setEmotion(emotion, this.transitionDuration);
        
        // Update button states (optional)
        this.updateButtonStates(emotion);
    }

    /**
     * Update button states to highlight the active emotion
     */
    private updateButtonStates(activeEmotion: string) {
        this.emotionButtons.forEach((button, emotion) => {
            // You can customize how buttons appear when active/inactive
            button.interactable = (emotion !== activeEmotion);
            
            // You could also change colors, scale, etc.
            const scale = (emotion === activeEmotion) ? 1.2 : 1.0;
            button.node.setScale(new Vec3(scale, scale, scale));
        });
    }

    /**
     * Example of triggering emotions based on game events
     */
    triggerEmotionBasedOnEvent(eventType: string) {
        switch (eventType) {
            case 'victory':
                this.setEmotion(FacialEmotion.HAPPY);
                break;
            case 'defeat':
                this.setEmotion(FacialEmotion.SAD);
                break;
            case 'damage':
                this.setEmotion(FacialEmotion.ANGRY);
                break;
            case 'surprise':
                this.setEmotion(FacialEmotion.SURPRISED);
                break;
            case 'scary':
                this.setEmotion(FacialEmotion.FEAR);
                break;
            case 'disgust':
                this.setEmotion(FacialEmotion.DISGUST);
                break;
            default:
                this.setEmotion(FacialEmotion.NEUTRAL);
                break;
        }
    }

    /**
     * Example of a sequence of emotions
     */
    playEmotionSequence() {
        const sequence = [
            { emotion: FacialEmotion.SURPRISED, duration: 1.0 },
            { emotion: FacialEmotion.HAPPY, duration: 2.0 },
            { emotion: FacialEmotion.NEUTRAL, duration: 1.0 }
        ];
        
        let delay = 0;
        
        sequence.forEach(item => {
            this.scheduleOnce(() => {
                this.setEmotion(item.emotion);
            }, delay);
            
            delay += item.duration;
        });
    }
} 