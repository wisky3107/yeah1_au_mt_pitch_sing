import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { Utils } from '../Utils';
const { ccclass, property } = _decorator;

@ccclass('UINumberByImages')
export class UINumberByImages extends Component {
    @property([SpriteFrame])
    spriteframeNumbers: SpriteFrame[] = [];

    @property([Sprite])
    spriteNumbers: Sprite[] = [];

    @property([Sprite])
    spriteDecimals: Sprite[] = [];

    @property(Node)
    nodeDot: Node = null;

    private charMap: Map<string, SpriteFrame> = new Map();

    protected onLoad() {
        this.spriteframeNumbers.forEach(num => this.charMap.set(num.name, num));
    }

    private getChar(charNumber: string): SpriteFrame {
        return this.charMap.get(charNumber);
    }

    public setNumber(number: number) {
        this.setNumberString(Utils.toFixed(number, 5));
    }

    public setNumberString(number: string) {
        const numbers = number.split(".");
        this.nodeDot.active = numbers.length > 1;

        //must set the nubers before dot first
        const beforeDot = numbers[0] ?? "";
        for (let i = 0; i < this.spriteNumbers.length; i++) {
            const char = beforeDot[i];
            this.spriteNumbers[i].node.active = !!char;
            if (!!char) {
                this.spriteNumbers[i].spriteFrame = this.getChar(char);
            }
        }

        //set the decimals number
        const afterDot = numbers[1] ?? "";
        for (let i = 0; i < this.spriteDecimals.length; i++) {
            const char = afterDot[i];
            this.spriteDecimals[i].node.active = !!char;
            if (!!char) {
                this.spriteDecimals[i].spriteFrame = this.getChar(char);
            }
        }
    }
}


