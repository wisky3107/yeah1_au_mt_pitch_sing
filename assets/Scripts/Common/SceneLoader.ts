import { _decorator, director, Scene, Asset, game, assetManager, resources } from 'cc';
import { UIManager } from './uiManager';
import { PopupProcessLoading } from '../Modules/Popup/ProcessLoading/PopupProcessLoading';

/**
 * Utility class for handling scene loading with progress tracking
 */
export class SceneLoader {
    private static _instance: SceneLoader;
    private _currentScene: string = '';
    private _preloadedScenes: Set<string> = new Set();
    private _isLoading: boolean = false;

    private constructor() { }

    public static get instance(): SceneLoader {
        if (!this._instance) {
            this._instance = new SceneLoader();
        }
        return this._instance;
    }

    /**
     * Get the name of the current scene
     */
    public get currentScene(): string {
        return this._currentScene;
    }

    /**
     * Check if a scene is currently loading
     */
    public get isLoading(): boolean {
        return this._isLoading;
    }

    /**
     * Loads a scene asynchronously with progress tracking
     * @param sceneName Name of the scene to load
     * @param popupProcessName Name of the loading popup to show (optional)
     * @returns Promise that resolves when scene is loaded
     */
    public loadSceneAsync(sceneName: string, popupProcessName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._isLoading) {
                reject(new Error('Another scene is currently loading'));
                return;
            }

            this._isLoading = true;

            // Show loading popup
            let popupProcess: PopupProcessLoading = null;
            UIManager.instance.showDialog(popupProcessName, [{
                message: 'Loading...'
            }], (popup: PopupProcessLoading) => {
                popupProcess = popup;
            });

            // Preload the scene
            director.preloadScene(sceneName,
                (completedCount: number, totalCount: number) => {
                    // Update progress through the popup's setProgress callback
                    popupProcess?.setProgress(completedCount / totalCount);
                },
                (error) => {
                    if (error) {
                        UIManager.instance.hideDialog(popupProcessName);
                        this._isLoading = false;
                        reject(error);
                        return;
                    }

                    // Load the scene
                    director.loadScene(sceneName, (error) => {
                        if (error) {
                            UIManager.instance.hideDialog(popupProcessName);
                            this._isLoading = false;
                            reject(error);
                            return;
                        }
                        this._currentScene = sceneName;
                        this._isLoading = false;
                        resolve();
                    });
                }
            );
        });
    }

    /**
     * Preload a scene without loading it
     * @param sceneName Name of the scene to preload
     * @returns Promise that resolves when scene is preloaded
     */
    public preloadScene(sceneName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._preloadedScenes.has(sceneName)) {
                resolve();
                return;
            }

            director.preloadScene(sceneName, 
                (completedCount: number, totalCount: number) => {
                    // Optional: Emit progress event if needed
                }, 
                (error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    this._preloadedScenes.add(sceneName);
                    resolve();
                }
            );
        });
    }

    /**
     * Load a scene directly without progress tracking
     * @param sceneName Name of the scene to load
     * @returns Promise that resolves when scene is loaded
     */
    public loadSceneDirectly(sceneName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._isLoading) {
                reject(new Error('Another scene is currently loading'));
                return;
            }

            this._isLoading = true;
            director.loadScene(sceneName, (error) => {
                this._isLoading = false;
                if (error) {
                    reject(error);
                    return;
                }
                this._currentScene = sceneName;
                resolve();
            });
        });
    }

    /**
     * Preload multiple scenes in parallel
     * @param sceneNames Array of scene names to preload
     * @returns Promise that resolves when all scenes are preloaded
     */
    public preloadScenes(sceneNames: string[]): Promise<void[]> {
        const preloadPromises = sceneNames.map(sceneName => this.preloadScene(sceneName));
        return Promise.all(preloadPromises);
    }

    /**
     * Release a preloaded scene from memory
     * @param sceneName Name of the scene to release
     */
    public releaseScene(sceneName: string): void {
        if (this._preloadedScenes.has(sceneName)) {
            // In Cocos Creator 3.x, scenes are automatically released when no longer needed
            this._preloadedScenes.delete(sceneName);
        }
    }

    /**
     * Release all preloaded scenes from memory
     */
    public releaseAllPreloadedScenes(): void {
        this._preloadedScenes.forEach(sceneName => {
            this.releaseScene(sceneName);
        });
        this._preloadedScenes.clear();
    }

    /**
     * Check if a scene is preloaded
     * @param sceneName Name of the scene to check
     */
    public isScenePreloaded(sceneName: string): boolean {
        return this._preloadedScenes.has(sceneName);
    }

    /**
     * Handles scene loading errors with user feedback
     * @param sceneName Name of the scene that failed to load
     * @param error Error object from the failed load attempt
     * @param popupName Optional custom popup name for error message
     */
    public handleSceneLoadError(sceneName: string, error: Error, popupName?: string): void {
        console.error(`Failed to load ${sceneName} scene:`, error);
        UIManager.instance.showDialog(popupName || 'MESSAGE', {
            message: `Failed to load ${sceneName}. Please try again later.`,
            buttonText: 'OK'
        });
    }

    /**
     * Clean up resources when game is shutting down or scene loader is being destroyed
     */
    public destroy(): void {
        this.releaseAllPreloadedScenes();
        this._currentScene = '';
        this._isLoading = false;
        SceneLoader._instance = null;
    }
} 