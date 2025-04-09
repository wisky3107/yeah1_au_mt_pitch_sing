import { _decorator, Component, Node, Label, Button, Sprite, Color, AnimationClip } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { FandomModel, FandomType, FandomOption } from '../../../Models/FandomModel';
import { requestFandomData, saveFandomSelection } from '../../../Network/FandomAPI';
import { UIManager } from '../../../Common/uiManager';
import { POPUP } from '../../../Constant/PopupDefine';
import { UIRunningLabel } from '../../../Common/UI/UIRunningLabel';
import { AnimationPanel } from '../../../Common/UI/AnimationPanel';
import { GameManager } from '../../../Managers/GameManager';
import { CharacterModel } from '../../Character/CharacterModel';

const { ccclass, property } = _decorator;

@ccclass('PopupFandomSelection')
export class PopupFandomSelection extends PopupBase {
    @property(UIRunningLabel)
    private lblGreeting: UIRunningLabel = null;

    @property(AnimationPanel)
    private animPanelGreeting: AnimationPanel = null;

    @property([Button])
    private fandomButtons: Button[] = [];

    @property([Label])
    private fandomLabels: Label[] = [];

    @property(Button)
    private btnConfirm: Button = null;

    @property([Node])
    private characterNodes: Node[] = [];

    @property(AnimationClip)
    private animationClip: AnimationClip = null;

    private fandomModel: FandomModel = new FandomModel();
    private onDone: Function = null;

    show(data: { onDone: Function }, callback?: () => void): void {
        super.show(data, callback);
        this.onDone = data.onDone;

        //init values
        this.fandomModel.currentCharacterIndex = 0;
        this.fandomModel.fandomOptions[0].isSelected = true;
        this.initModels();
        this.loadFandomData();
        this.updateFandomButtons();
        this.showCurrentCharacter();
    }

    private initModels(): void {
        this.characterNodes.forEach(node => {
            const model = node.getComponentInChildren(CharacterModel);
            if (model) {    
                model.setUIMesh(this.node.layer);
                model.skeletalAnimation?.createState(this.animationClip, 'idle');
                model.skeletalAnimation?.play('idle');
            }
        });
    }

    private loadFandomData(): void {
        requestFandomData((data, error) => {
            if (error) {
                console.error('Failed to load fandom data:', error);
                return;
            }

            if (data?.selectedFandom) {
                this.fandomModel.selectedFandom = data.selectedFandom;
                this.updateFandomSelection();
            }
        });
    }

    private updateFandomButtons(): void {
        this.fandomModel.fandomOptions.forEach((option, index) => {
            if (index < this.fandomButtons.length) {
                const button = this.fandomButtons[index];
                const label = this.fandomLabels[index];

                // Set button text
                if (label) {
                    label.string = option.name;
                    label.color = option.isSelected ?
                        new Color(255, 255, 255, 255) :
                        new Color(200, 200, 200, 175);
                }

                // Set button state
                button.interactable = option.isEnabled;
                button.normalColor = option.isSelected ?
                    new Color(255, 255, 255, 255) :
                    new Color(200, 200, 200, 175);
            }
        });
    }

    private showCurrentCharacter(): void {
        // Hide all character nodes first
        this.characterNodes.forEach(node => {
            if (node) {
                node.active = false;
            }
        });

        const character = this.fandomModel.characters[this.fandomModel.currentCharacterIndex];
        if (!character) return;

        // Update greeting text
        if (this.lblGreeting) {
            this.animPanelGreeting.doShow();
            this.lblGreeting.setText(character.greeting);
        }

        // Show the current character node
        const currentCharacterNode = this.characterNodes[this.fandomModel.currentCharacterIndex];
        if (currentCharacterNode) {
            currentCharacterNode.active = true;
        }
    }

    private updateFandomSelection(): void {
        this.fandomModel.fandomOptions.forEach(option => {
            option.isSelected = option.id === this.fandomModel.selectedFandom;
        });
        this.updateFandomButtons();
        this.btnConfirm.interactable = !!this.fandomModel.selectedFandom;
    }

    public onTouch_SelectFandom(event: Event, customData: string): void {
        const fandomType = customData as FandomType;
        this.fandomModel.selectedFandom = fandomType;
        // Update the current character to match the selected fandom
        const selectedCharacterIndex = this.fandomModel.characters.findIndex(character => character.fandomType === fandomType);
        if (selectedCharacterIndex !== -1) {
            this.fandomModel.currentCharacterIndex = selectedCharacterIndex;
            this.showCurrentCharacter();
        }
        this.updateFandomSelection();
    }

    public onTouch_Confirm(): void {
        if (!this.fandomModel.selectedFandom) {
            this.showMessage('Vui lòng chọn FANDOM bạn muốn tham gia.');
            return;
        }

        saveFandomSelection(this.fandomModel.selectedFandom, (success, error) => {
            if (error || !success) {
                this.showMessage('Không thể lưu lựa chọn FANDOM.');
                return;
            }

            GameManager.instance.setFandomModel(this.fandomModel);
            this.onDone?.();
            this.doUImanagerHide();
        });
    }

    private showMessage(message: string): void {
        UIManager.instance.showDialog(POPUP.MESSAGE, [{
            message,
            buttonText: 'OK'
        }]);
    }
} 