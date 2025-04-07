import { _decorator, Component, director, Label, Node } from 'cc';
import { UIRunningLabel } from '../../Common/UI/UIRunningLabel';
import { UIManager } from '../../Common/uiManager';
import { POPUP } from '../../Constant/PopupDefine';
import { SCENE_NAME } from '../../Constant/SceneDefine';
const { ccclass, property } = _decorator;

@ccclass('OnboardingController')
export class OnboardingController extends Component {

    @property(UIRunningLabel)
    lbMessage: UIRunningLabel = null;

    private isCharacterCustomizationDone: boolean = false;
    private isFandomSelectionDone: boolean = false;

    protected start(): void {
        this.runOnboardingSequence();
    }

    private async runOnboardingSequence(): Promise<void> {
        try {
            // Welcome message sequence
            await this.showWelcomeMessages();
            await this.showCharacterCustomization();
            await this.showFandomSelection();

            // If both steps are completed, proceed to home scene
            if (this.isCharacterCustomizationDone && this.isFandomSelectionDone) {
                director.loadScene(SCENE_NAME.HOME);
            }
        } catch (error) {
            console.error('Error in onboarding sequence:', error);
            // Handle error appropriately - could show an error dialog
        }
    }

    private showWelcomeMessages(): Promise<void> {
        return new Promise<void>((resolve) => {
            UIManager.instance.preloadDialog(POPUP.CHARACTER_CUSTOMIZATION);//repload while show the dialog
            // First welcome message
            this.lbMessage.setText("Chào mừng bạn đến với chương trình Tân Binh Toàn Năng", 1.0);

            // Second welcome message after 5 seconds
            this.scheduleOnce(() => {
                this.lbMessage.setText("Hãy giới thiệu đôi chút về bạn nào!", 1.0);
                // Resolve after the second message is shown and its duration
                this.scheduleOnce(() => resolve(), 2.0);
            }, 3.0);
        });
    }

    private showCharacterCustomization(): Promise<void> {
        return new Promise<void>((resolve) => {
            UIManager.instance.preloadDialog(POPUP.FANDOM_SELECTION);//repload while character customization is showing
            UIManager.instance.showDialog(POPUP.CHARACTER_CUSTOMIZATION, [{
                onDone: () => {
                    this.isCharacterCustomizationDone = true;
                    resolve();
                }
            }]);
        });
    }

    private showFandomSelection(): Promise<void> {
        return new Promise<void>((resolve) => {
            UIManager.instance.showDialog(POPUP.FANDOM_SELECTION, [{
                onDone: () => {
                    this.isFandomSelectionDone = true;
                    resolve();
                }
            }]);
        });
    }
}


