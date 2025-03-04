import { _decorator, Component, math, Node, randomRangeInt, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ImageLoader')
export class ImageLoader extends Component {
    //#region singleton
    public static instance: ImageLoader = null;
    protected onLoad(): void {
        ImageLoader.instance = this;
        this.initSpriteFrames();
    }
    //#endregion

    @property([SpriteFrame])
    preloadSpriteFrames: SpriteFrame[] = [];

    @property([SpriteFrame])
    avatarSpriteframe: SpriteFrame[] = [];

    @property(SpriteFrame)
    sfDiamonds: SpriteFrame = null;

    @property(SpriteFrame)
    sfCoins: SpriteFrame = null;

    private spriteFrameMap: Map<string, SpriteFrame> = new Map<string, SpriteFrame>();
    private initSpriteFrames(): void {
        this.preloadSpriteFrames.forEach(spriteFrame => {
            this.spriteFrameMap.set(spriteFrame.name, spriteFrame);
        });
    }

    public getSpriteFrame(name: string): SpriteFrame {
        if (this.spriteFrameMap.has(name)) {
            return this.spriteFrameMap.get(name);
        }
        console.error("Unknown sprite" + name);
        return null;
    }

    public getAvatar(id: string): SpriteFrame {
        const number = (Number(id) % 1000).toString();
        const getNumberWithNumberAgo = (input: number) => {
            try {
                return parseInt(number[number.length - input] ?? "0");
            }
            catch {
                return 0;
            }
        }

        try {
            // const number = (Number("0x" + id) % 1000).toString();
            const lastChar = getNumberWithNumberAgo(1);
            const lastChar2 = getNumberWithNumberAgo(2);
            const index = math.clamp(lastChar + lastChar2, 0, this.avatarSpriteframe.length - 1);
            return this.avatarSpriteframe[index];
        } catch (e) {
            return null;
        }
    }

    public getRandomCapyImage(): SpriteFrame {
        return this.avatarSpriteframe[randomRangeInt(0, this.avatarSpriteframe.length)];
    }
}


