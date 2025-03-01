import { _decorator, Prefab, Node, SpriteComponent, SpriteFrame, ImageAsset, resources, error, Texture2D, instantiate, isValid, find, TextAsset, JsonAsset, SpriteRenderer, SpriteAtlas } from "cc";
const { ccclass } = _decorator;

@ccclass("resourceUtil")
export class resourceUtil {

    private static resLoadedMap: Map<string, any> = new Map<string, any>();
    public static loadRes(url: string, type: any, cb: Function = () => { }) {
        if (this.resLoadedMap.has(url)) {
            cb && cb(null, this.resLoadedMap.get(url));
            return;
        }
        resources.load(url, (err: any, res: any) => {
            if (err) {
                error(err.message || err);
                cb(err, res);
                return;
            }

            if (!res) {
                error("res not found");
                cb("res not found", res);
                return;
            }

            this.resLoadedMap.set(url, res);
            cb && cb(null, res);
        })
    }

    public static loadResNoCache(url: string, type: any, cb: Function = () => { }) {
        resources.load(url, (err: any, res: any) => {
            if (err) {
                error(err.message || err);
                cb(err, res);
                return;
            }

            this.resLoadedMap.set(url, res);
            cb && cb(null, res);
        })
    }

    public static loadEffectRes(modulePath: string) {
        return new Promise((resolve, reject) => {
            this.loadRes(`prefab/effect/${modulePath}`, Prefab, (err: any, prefab: Prefab) => {
                if (err) {
                    console.error('effect load failed', modulePath);
                    reject && reject();
                    return;
                }

                resolve && resolve(prefab);
            })
        })
    }

    public static loadIslandRes(modulePath: string) {
        return new Promise((resolve, reject) => {
            this.loadRes(`prefab/island/${modulePath}`, Prefab, (err: any, prefab: Prefab) => {
                if (err) {
                    console.error('loadIslandRes failed', modulePath);
                    reject && reject();
                    return;
                }

                resolve && resolve(prefab);
            })
        })
    }

    /**
     * @param path 
     * @param arrName 
     * @param progressCb 
     * @param completeCb 
     */
    public static loadModelResArr(path: string, arrName: Array<string>, progressCb: any, completeCb: any) {
        let arrUrls = arrName.map((item) => {
            return `${path}/${item}`;
        })

        resources.load(arrUrls, Prefab, progressCb, completeCb);
    }

    public static loadResArr(arrName: Array<string>, progressCb: any, completeCb: any) {
        resources.load(arrName, Prefab, progressCb, completeCb);
    }

    /**
     * @param path 
     * @returns 
     */
    public static loadSpriteFrameRes(path: string) {
        return new Promise((resolve, reject) => {
            this.loadRes(path, SpriteFrame, (err: any, img: ImageAsset) => {
                if (err) {
                    console.error('spriteFrame load failed!', path, err);
                    reject && reject();
                    return;
                }

                let texture = new Texture2D();
                texture.image = img;

                let sf = new SpriteFrame();
                sf.texture = texture;

                resolve && resolve(sf);
            })
        })
    }

    /**
     * @param level 
     * @param cb 
     */
    public static getMap(level: number, cb: Function) {
        let levelStr: string = 'map';
        if (level >= 100) {
            levelStr += level;
        } else if (level >= 10) {
            levelStr += '0' + level;
        } else {
            levelStr += '00' + level;
        }

        this.loadRes(`map/config/${levelStr}`, null, (err: {}, txtAsset: any) => {
            if (err) {
                cb(err, txtAsset);
                return;
            }

            let content: string = '';
            if (txtAsset._file) {
                //@ts-ignore
                if (window['LZString']) {
                    //@ts-ignore
                    content = window['LZString'].decompressFromEncodedURIComponent(txtAsset._file);
                }
                var objJson = JSON.parse(content);
                cb(null, objJson);
            } else if (txtAsset.text) {
                //@ts-ignore
                if (window['LZString']) {
                    //@ts-ignore
                    content = window['LZString'].decompressFromEncodedURIComponent(txtAsset.text);
                }
                var objJson = JSON.parse(content);
                cb(null, objJson);
            } else if (txtAsset.json) {
                cb(null, txtAsset.json);
            } else {
                cb('failed');
            }
        });
    }

    /**
     * @param type 
     * @param arrName 
     * @param progressCb 
     * @param completeCb 
     */
    public static getMapObj(type: string, arrName: Array<string>, progressCb?: any, completeCb?: any) {
        let arrUrls: string[] = [];
        for (let idx = 0; idx < arrName.length; idx++) {
            arrUrls.push(`map/${type}/${arrName[idx]}`)
        }

        resources.load(arrUrls, Prefab, progressCb, completeCb);
    }

    /**
     * @param prefabPath  
     * @param cb 
     */
    public static getUIPrefabRes(prefabPath: string, cb?: Function) {
        this.loadRes("prefab/ui/" + prefabPath, Prefab, cb);
    }

    /**
     * @param path 
     * @param cb 
     * @param parent 
     */
    public static createUI(path: string, cb?: Function, parent?: Node, parentPath: string = "Game/Canvas/Popup") {
        this.getUIPrefabRes(path, function (err: {}, prefab: Prefab) {
            if (err) return;
            let node: Node = instantiate(prefab);
            node.setPosition(0, 0, 0);
            if (!parent) {
                parent = find(parentPath) as Node;
            }

            if (!parent) {
                cb && cb(null, node);
                return;
            }

            parent.addChild(node);
            cb && cb(null, node);
        });
    }

    public static preloadUI(path: string, cb?: Function) {
        this.getUIPrefabRes(path, function (err: {}, prefab: Prefab) {
            if (err) {
                cb && cb(err, null);
                return;
            }

            let node: Node = instantiate(prefab);
            cb && cb(null, node);
        });
    }


    /**
     * @param fileName 
     * @param cb  
     */
    public static getJsonData(fileName: string, cb: Function) {
        this.loadRes("datas/" + fileName, null, function (err: any, content: JsonAsset) {
            if (err) {
                error(err.message || err);
                return;
            }

            if (content.json) {
                cb(err, content.json);
            } else {
                cb('failed!!!');
            }
        });
    }

    /**
     * @param fileName 
     * @param cb  
     */
    public static getTextData(fileName: string, cb: Function) {
        this.loadRes("datas/" + fileName, null, function (err: any, content: TextAsset) {
            if (err) {
                error(err.message || err);
                return;
            }

            let text: string = content.text;
            cb(err, text);
        });
    }

    /**
     * @param path 
     * @param sprite 
     * @param cb 
     */
    public static setSpriteFrame(path: string, sprite: SpriteComponent, cb: Function) {
        resources.load<SpriteFrame>(path, (err: any, spriteFrame: SpriteFrame) => {
            if (err) {
                error(err.message || err);
                cb(err, spriteFrame);
                return;
            }

            if (sprite && isValid(sprite)) {
                sprite.spriteFrame = spriteFrame;
                cb?.(null);
            }
        })
    }

    public static setSpriteFrameFromAtlas(pathAtlas: string, imgName: string, sprite: SpriteComponent, cb: Function) {
        resources.load(pathAtlas, SpriteAtlas, (err: any, atlas: SpriteAtlas) => {
            if (err) {
                console.error('set sprite frame form atlas failed! err:', pathAtlas, err);
                cb?.(err);
                return;
            }
            if (sprite && isValid(sprite)) {
                const spriteFrame = atlas.getSpriteFrame(imgName);
                sprite.spriteFrame = spriteFrame;
                cb?.(null);
            }
        });
    }

    public static setSpriteFrameFromAutoAtlas(pathAtlas: string, imgName: string, sprite: SpriteComponent, cb: Function) {
        resources.load(`${pathAtlas}/${imgName}`, SpriteFrame, (err: any, sf: SpriteFrame) => {
            if (err) {
                console.error('set sprite frame form atlas failed! err:', pathAtlas, err);
                cb?.(err);
                return;
            }
            if (sprite && isValid(sprite)) {
                sprite.spriteFrame = sf;
                cb?.(null);
            }
        });
    }

    public static loadAndConvertSpriteFrame(path: string, sprite: SpriteComponent, cb: Function) {
        this.loadRes(path, SpriteFrame, (err: any, img: ImageAsset) => {
            if (err) {
                console.error('set sprite frame failed! err:', path, err);
                cb?.(err);
                return;
            }

            let texture = new Texture2D();
            texture.image = img;

            let sf = new SpriteFrame();
            sf.texture = texture;

            if (sf && isValid(sf)) {
                sprite.spriteFrame = sf;
                cb?.(null);
            }
        });
    }


    public static setSpriteFrameRenderer(path: string, sprite: SpriteRenderer, cb: Function) {
        this.loadRes(path, SpriteFrame, (err: any, img: ImageAsset) => {
            if (err) {
                console.error('set sprite frame failed! err:', path, err);
                cb?.(err);
                return;
            }

            let texture = new Texture2D();
            texture.image = img;

            let sf = new SpriteFrame();
            sf.texture = texture;

            if (sf && isValid(sf)) {
                sprite.spriteFrame = sf;
                cb?.(null);
            }
        });
    }

    public static loadAllResources(directory: string, callback: (assets: any[]) => void): void {
        resources.loadDir(directory, (err, assets) => {
            if (err) {
                console.error("Error loading resources: ", err);
                return;
            }
            callback(assets);
        });
    }

    public static loadAllSprites(directory: string, callback: (assets: SpriteFrame[]) => void): void {
        resources.loadDir(directory, (err, assets: any[]) => {
            if (err) {
                console.error("Error loading resources: ", err);
                return;
            }

            const spriteFrames = assets.filter(asset => asset instanceof SpriteFrame);
            callback(spriteFrames);
        });
    }

}
