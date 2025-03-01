import { SpriteAtlas, SpriteFrame, assetManager, DynamicAtlasManager, AssetManager, Texture2D, ImageAsset } from 'cc';
import { CurrentEnviroment } from '../Constant/Constants';

export class assetRemoteUtil {

    //#region bundle
    public static loadBundle(bundleName: string, cb: Function) {
        assetManager.loadBundle(bundleName, null, (error, data: AssetManager.Bundle) => {
            if (error) {
                console.error(error);
                cb(error, null);
                return;
            };
            cb(null, data);
        });
    }

    public static loadAltas(bundeName: string, atlasName: string, cb: Function) {
        this.loadBundle(bundeName, (error, bundle: AssetManager.Bundle) => {
            if (error) {
                cb?.(error, null);
                return;
            }

            bundle.load(atlasName, SpriteAtlas, (error, atlas: SpriteAtlas) => {
                if (error) {
                    console.error(error);
                    cb?.(error, null);
                    return;
                }
                cb?.(null, atlas);
            })
        })
    }

    public static async loadRemoteImage(url: string): Promise<SpriteFrame> {
        try {
            // Fetch the image data
            url = "https://cors-anywhere.herokuapp.com/" + url;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Convert the response to a blob
            const blob = await response.blob();

            // Create an image element
            const image = new Image();
            image.crossOrigin = 'Anonymous';
            const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error('Failed to load image element'));
            });
            image.src = URL.createObjectURL(blob);

            // Wait for the image to load
            await imageLoadPromise;

            // Create a Texture2D from the image element
            const texture = new Texture2D();
            texture.image = new ImageAsset(image);
            let sf = new SpriteFrame();
            sf.texture = texture;

            return sf;
        } catch (error) {
            throw new Error(`Failed to load remote image: ${error.message}`);
        }
    }

    //#endregion

    //#region fetch image

    public static async fetchImage(url: string): Promise<SpriteFrame> {
        if (!url) throw new Error("Failed to fetch image: URL is null or empty.");
        try {
            const response = await fetch(url);
            const binaryData = new Uint8Array(await response.arrayBuffer());
            const base64String = this.bufferToBase64(binaryData);
            return this.convertBase64ToSpriteFrame(base64String);
        } catch (error) {
            throw new Error(`Failed to get SpriteFrame: ${error.message}`);
        }
    }

    public static bufferToBase64(buffer: Uint8Array): string {
        const binary = Array.from(buffer).map(byte => String.fromCharCode(byte)).join('');
        return btoa(binary);
    }

    public static async convertBase64ToSpriteFrame(base64String: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const texture = new Texture2D();
                texture.image = new ImageAsset(img);
                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                resolve(spriteFrame);
                URL.revokeObjectURL(img.src); // Free memory by revoking the object URL
            };
            img.onerror = () => {
                reject(new Error('Failed to load base64 image'));
                URL.revokeObjectURL(img.src); // Ensure memory is freed on error as well
            };
            img.src = 'data:image/png;base64,' + base64String;
        });
    }
    //#endregion

    //#region avatars
    public static spriteFrameMap: Map<string, SpriteFrame> = new Map();
    public static loadingSprites: string[] = [];
    public static spriteCallbacks: Map<string, Function[]> = new Map();
    public static loadedImages: ImageAsset[] = [];
    public static loadedTextures: Texture2D[] = [];

    public static loadAndListenAvatar(url: string, cb: Function) {
        if (this.spriteFrameMap.has(url)) {
            cb?.(this.spriteFrameMap.get(url));
            return;
        }

        if (!this.spriteCallbacks.has(url)) {
            this.spriteCallbacks.set(url, []);
        }
        this.spriteCallbacks.get(url).push(cb);

        if (this.loadingSprites.indexOf(url) >= 0) {
            return;
        }

        this.loadingSprites.push(url);
        const onDone = (sf: SpriteFrame) => {
            this.spriteFrameMap.set(url, sf);
            const cbs = this.spriteCallbacks.get(url);
            cbs.forEach(func => func(sf));

            this.spriteCallbacks.set(url, []);
            this.loadingSprites = this.loadingSprites.filter(str => str !== url);

            // Auto clear when reaching 100 records
            if (this.spriteFrameMap.size > 100) {
                this.spriteFrameMap.clear();
                if (CurrentEnviroment.LOG) console.log("SpriteFrameMap cache cleared due to exceeding 100 records.");
            }

            if (CurrentEnviroment.LOG) console.log("Total loaded avatar: ", this.spriteFrameMap.size);
        };

        this.fetchImage(url)
            .then(sf => {
                onDone(sf);
            })
            .catch(err => {
                onDone(null);
            });
    }

    public static removeListenAvatar(url: string, cb: Function) {
        if (this.spriteCallbacks.has(url) == false) return;
        this.spriteCallbacks.set(url, this.spriteCallbacks.get(url).filter(ccb => ccb != cb));
    }

    //#endregion
}



