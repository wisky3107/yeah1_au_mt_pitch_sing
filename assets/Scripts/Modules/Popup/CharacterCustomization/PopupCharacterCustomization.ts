import { _decorator, Component, Node, ScrollView, Prefab, Label, Sprite, Button, Color, SpriteFrame, EditBox, SkinnedMeshRenderer, Material } from 'cc';
import { PopupBase } from '../../../Common/UI/PopupBase';
import { requestCharacterCustomization, saveCharacterCustomization } from '../../../Network/CharacterCustomizationAPI';
import { resourceUtil } from '../../../Common/resourceUtil';
import { CustomizationScrollView } from './CustomizationScrollView';
import { UIManager } from '../../../Common/uiManager';
import { POPUP } from '../../../Constant/PopupDefine';
import { CharacterCustomizationModel, ICharacterFeature, ISkinColor, CharacterGender } from '../../../Models/CharacterCustomizationModel';
import { CustomizationTab } from '../../../Models/CharacterCustomizationModel';

const { ccclass, property } = _decorator;

@ccclass('PopupCharacterCustomization')
export class PopupCharacterCustomization extends PopupBase {
    @property(CustomizationScrollView)
    private svContent: CustomizationScrollView = null;

    @property(Node)
    private skinColorItemPrefab: Node = null;

    @property(Node)
    private eyeStyleItemPrefab: Node = null;

    @property(Node)
    private characterPreview: Node = null;

    @property([Button])
    private tabButtons: Button[] = [];

    @property([Label])
    private tabLabels: Label[] = [];

    @property(EditBox)
    private editName: EditBox = null;

    @property(Label)
    private lblGender: Label = null;

    @property(Node)
    private characterMale: Node = null;

    @property(Node)
    private characterFemale: Node = null;

    private customizationData: CharacterCustomizationModel = null;
    private currentTab: CustomizationTab = CustomizationTab.SkinColor;
    private selectedSkinColorId: string = null;
    private selectedEyeStyleId: string = null;
    private characterGender: CharacterGender = CharacterGender.Male;
    private onDone: Function = null;
    
    show(data: { onDone: Function }, callback?: () => void): void {
        super.show(data, callback);
        this.onDone = data.onDone;

        this.loadCharacterModel();
        this.loadCustomizationData();
        this.initTabs();
        this.initGenderButtons();
    }

    private initGenderButtons(): void {
        this.updateGenderDisplay();
    }

    private updateGenderDisplay(): void {
        if (!this.customizationData) return;
        this.lblGender.string = this.characterGender === CharacterGender.Male ? 'Nhân vật nam' : 'Nhân vật nữ';
        this.characterMale.active = this.characterGender === CharacterGender.Male;
        this.characterFemale.active = this.characterGender === CharacterGender.Female;
        this.loadCharacterModel();
    }

    private loadCharacterModel(): void {
        // Get the active character node based on gender
        const activeCharacter = this.characterGender === CharacterGender.Male ? this.characterMale : this.characterFemale;
        if (!activeCharacter) return;

        // Get the SkinnedMeshRenderer component
        const meshRenderer = activeCharacter.getComponentInChildren(SkinnedMeshRenderer);
        if (!meshRenderer) return;

        // Get the first material (skin material)
        const materials = meshRenderer.materials;
        if (!materials || materials.length === 0) return;

        const skinMaterial = materials[0];
        if (!skinMaterial) return;

        // Update the skin color if a color is selected
        if (this.selectedSkinColorId) {
            const skinColor = this.customizationData.skinColors.find(s => s.id === this.selectedSkinColorId);
            if (skinColor && skinColor.color) {
                // Set the main color of the material
                skinMaterial.setProperty('mainColor', skinColor.color);
            }
        }
    }

    private loadCustomizationData(): void {
        requestCharacterCustomization((data, error) => {
            if (error) {
                console.error('Failed to load customization data:', error);
                return;
            }

            this.customizationData = data;
            this.selectedSkinColorId = data.selectedSkinColorId;
            this.selectedEyeStyleId = data.selectedEyeStyleId;
            this.editName.string = data.characterName || '';
            this.characterGender = data.gender;

            this.customizationData.skinColors.forEach(s => s.onSelected = this.handleItemSelected.bind(this));
            this.customizationData.eyeStyles.forEach(e => e.onSelected = this.handleItemSelected.bind(this));

            this.refreshScrollView();
            this.updateCharacterPreview();
            this.updateGenderDisplay();
        });
    }

    private initTabs(): void {
        this.setTabActive(this.currentTab);
    }

    private setTabActive(tab: CustomizationTab): void {
        this.currentTab = tab;

        this.tabButtons.forEach((btn, index) => {
            const isActive = index === tab;
            btn.normalColor = isActive ? new Color(255, 255, 255, 255) : new Color(200, 200, 200, 255);
            this.tabLabels[index].color = isActive ? new Color(0, 0, 0, 255) : new Color(0, 0, 0, 125);
        });

        this.refreshScrollView();
    }

    private refreshScrollView(): void {
        if (!this.customizationData) return;

        const items = this.currentTab === CustomizationTab.SkinColor
            ? this.customizationData.skinColors
            : this.customizationData.eyeStyles;

        const prefab = this.currentTab === CustomizationTab.SkinColor
            ? this.skinColorItemPrefab
            : this.eyeStyleItemPrefab;

        this.svContent.updatePrefab(prefab);
        this.svContent.updateItems(items);
    }

    private updateCharacterPreview(): void {
        if (this.selectedSkinColorId) {
            const skinColor = this.customizationData.skinColors.find(s => s.id === this.selectedSkinColorId);
            if (skinColor) {
                // Update the character model's skin color
                this.loadCharacterModel();
            }
        }

        if (this.selectedEyeStyleId) {
            const eyeStyle = this.customizationData.eyeStyles.find(e => e.id === this.selectedEyeStyleId);
            if (eyeStyle) {
                // resourceUtil.loadSpriteFrameRes(eyeStyle.spritePath).then((spriteFrame: SpriteFrame) => {
                //     if (spriteFrame) {
                //     }
                // });
            }
        }
    }

    public handleItemSelected(item: ICharacterFeature): void {
        const skinColor = item as ISkinColor;
        if (skinColor.color) {
            this.selectedSkinColorId = item.id;
            this.customizationData.skinColors.forEach(s => s.isSelected = s.id === item.id);
        } else {
            this.selectedEyeStyleId = item.id;
            this.customizationData.eyeStyles.forEach(e => e.isSelected = e.id === item.id);
        }

        this.refreshScrollView();
        this.updateCharacterPreview();
    }

    public onTouch_TabSkinColor(): void {
        this.setTabActive(CustomizationTab.SkinColor);
    }

    public onTouch_TabEyes(): void {
        this.setTabActive(CustomizationTab.Eyes);
    }

    public onTouch_PrevGender(): void {
        if (!this.customizationData) return;
        this.customizationData.gender = this.customizationData.gender === CharacterGender.Male
            ? CharacterGender.Female
            : CharacterGender.Male;
        this.characterGender = this.customizationData.gender;
        this.updateGenderDisplay();
    }

    public onTouch_NextGender(): void {
        if (!this.customizationData) return;
        this.customizationData.gender = this.customizationData.gender === CharacterGender.Male
            ? CharacterGender.Female
            : CharacterGender.Male;
        this.characterGender = this.customizationData.gender;
        this.updateGenderDisplay();
    }

    public onTouch_Confirm(): void {
        if (!this.selectedSkinColorId || !this.selectedEyeStyleId) {
            this.showMessage('Please select both skin color and eye style.');
            return;
        }

        if (!this.editName.string || this.editName.string.trim() === '') {
            this.showMessage('Please enter a character name.');
            return;
        }

        saveCharacterCustomization({
            skinColorId: this.selectedSkinColorId,
            eyeStyleId: this.selectedEyeStyleId,
            characterName: this.editName.string,
            gender: this.customizationData.gender
        }, (success, error) => {
            if (error || !success) {
                this.showMessage('Failed to save character customization.');
                return;
            }

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

    protected onDestroy(): void {
        super.onDestroy();
    }
} 