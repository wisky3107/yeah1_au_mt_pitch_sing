import { _decorator, Component, Node, Sprite, Color, SpriteFrame } from 'cc';
import { Holder } from '../../../Common/adapter';
import { resourceUtil } from '../../../Common/resourceUtil';
import { SkinColor } from '../../../Models/CharacterCustomizationModel';
import { CharacterFeature } from '../../../Models/CharacterCustomizationModel';
import { PopupCharacterCustomization } from './PopupCharacterCustomization';
import { EyeStyle } from '../../../Models/CharacterCustomizationModel';

const { ccclass, property } = _decorator;

@ccclass('CustomizationItem')
export class CustomizationItem extends Component {
    @property(Sprite)
    private sprPreview: Sprite = null;

    @property(Node)
    private nodeSelected: Node = null;

    private holder: Holder<CharacterFeature> = null;

    show(holder: Holder<CharacterFeature>): void {
        this.holder = holder;
        this.nodeSelected.active = holder.data.isSelected || false;

        // Check if this is a skin color item
        const skinColor = holder.data as SkinColor;
        if (skinColor.color) {
            this.sprPreview.color = skinColor.color;
            return;
        }

        // Check if this is an eye style item
        const eyeStyle = holder.data as EyeStyle;
        if (eyeStyle.spritePath) {
            // resourceUtil.loadSpriteFrameRes(eyeStyle.spritePath).then((spriteFrame: SpriteFrame) => {
            //     if (spriteFrame) {
            //         this.sprPreview.spriteFrame = spriteFrame;
            //     }
            // });
        }
    }

    hide(): void {
        this.holder = null;
        this.nodeSelected.active = false;
    }

    onTouch_Select(): void {
        if (this.holder && this.holder.data) {
            this.holder.data.isSelected = true;
            this.nodeSelected.active = true;
            
            // Call the onSelected callback if it exists
            if (this.holder.data.onSelected) {
                this.holder.data.onSelected(this.holder.data);
            }
        }
    }
} 