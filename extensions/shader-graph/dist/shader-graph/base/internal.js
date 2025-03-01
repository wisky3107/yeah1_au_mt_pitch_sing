"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.MaskType = void 0;
var MaskType;
(function (MaskType) {
    MaskType[MaskType["None"] = 0] = "None";
    /**
     * 等待加载
     */
    MaskType[MaskType["WaitLoad"] = 1] = "WaitLoad";
    /**
     * 资源发生变化的时候
     */
    MaskType[MaskType["AssetChange"] = 10] = "AssetChange";
    /**
     * 资源丢失
     */
    MaskType[MaskType["AssetMissing"] = 30] = "AssetMissing";
    /**
     * 没有选择 shader graph 时，需要提示用户去创建
     */
    MaskType[MaskType["NeedCreateNewAsset"] = 50] = "NeedCreateNewAsset";
    /**
     * 是否需要保存并重新加载
     */
    MaskType[MaskType["NeedSaveBeReloadByRename"] = 51] = "NeedSaveBeReloadByRename";
    /**
     * 等待场景加载完成
     */
    MaskType[MaskType["WaitSceneReady"] = 100] = "WaitSceneReady";
})(MaskType = exports.MaskType || (exports.MaskType = {}));
var MessageType;
(function (MessageType) {
    // --- assets ---
    MessageType["AssetLoaded"] = "asset-loaded";
    MessageType["SceneReady"] = "scene-ready";
    MessageType["SceneClose"] = "scene-closed";
    MessageType["EnterGraph"] = "enter-graph";
    MessageType["SetGraphDataToForge"] = "set-graph-data-to-forge";
    MessageType["Restore"] = "restore";
    MessageType["Loaded"] = "load-completed";
    MessageType["Declared"] = "declare-completed";
    MessageType["Dirty"] = "dirty";
    MessageType["DirtyChanged"] = "dirty-changed";
    MessageType["DraggingProperty"] = "dragging-property";
    // mask
    MessageType["UpdateMask"] = "update-mask";
    // menu
    MessageType["ShowCreateNodeWindow"] = "show-create-node";
    MessageType["CreateMenuChange"] = "create-menu-change";
    // float window
    MessageType["FloatWindowConfigChanged"] = "float-window-config-changed";
    // window
    MessageType["Resize"] = "resize";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJuYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2hhZGVyLWdyYXBoL2Jhc2UvaW50ZXJuYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsSUFBWSxRQTBCWDtBQTFCRCxXQUFZLFFBQVE7SUFDaEIsdUNBQVEsQ0FBQTtJQUNSOztPQUVHO0lBQ0gsK0NBQVksQ0FBQTtJQUNaOztPQUVHO0lBQ0gsc0RBQWdCLENBQUE7SUFDaEI7O09BRUc7SUFDSCx3REFBaUIsQ0FBQTtJQUNqQjs7T0FFRztJQUNILG9FQUF1QixDQUFBO0lBQ3ZCOztPQUVHO0lBQ0gsZ0ZBQTZCLENBQUE7SUFDN0I7O09BRUc7SUFDSCw2REFBb0IsQ0FBQTtBQUN4QixDQUFDLEVBMUJXLFFBQVEsR0FBUixnQkFBUSxLQUFSLGdCQUFRLFFBMEJuQjtBQXVCRCxJQUFZLFdBOEJYO0FBOUJELFdBQVksV0FBVztJQUVuQixpQkFBaUI7SUFDakIsMkNBQTRCLENBQUE7SUFFNUIseUNBQTBCLENBQUE7SUFDMUIsMENBQTJCLENBQUE7SUFFM0IseUNBQTBCLENBQUE7SUFFMUIsOERBQStDLENBQUE7SUFDL0Msa0NBQW1CLENBQUE7SUFDbkIsd0NBQXlCLENBQUE7SUFDekIsNkNBQThCLENBQUE7SUFDOUIsOEJBQWUsQ0FBQTtJQUNmLDZDQUE4QixDQUFBO0lBQzlCLHFEQUFzQyxDQUFBO0lBRXRDLE9BQU87SUFDUCx5Q0FBMEIsQ0FBQTtJQUUxQixPQUFPO0lBQ1Asd0RBQXlDLENBQUE7SUFDekMsc0RBQXVDLENBQUE7SUFFdkMsZUFBZTtJQUNmLHVFQUF3RCxDQUFBO0lBRXhELFNBQVM7SUFDVCxnQ0FBaUIsQ0FBQTtBQUNyQixDQUFDLEVBOUJXLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBOEJ0QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElOb2RlRGV0YWlscyB9IGZyb20gJy4uL2ludGVyZmFjZSc7XG5pbXBvcnQgeyBCbG9ja0RhdGEsIExpbmVEYXRhIH0gZnJvbSAnLi4vLi4vYmxvY2stZm9yZ2UvaW50ZXJmYWNlJztcblxuZXhwb3J0IGVudW0gTWFza1R5cGUge1xuICAgIE5vbmUgPSAwLFxuICAgIC8qKlxuICAgICAqIOetieW+heWKoOi9vVxuICAgICAqL1xuICAgIFdhaXRMb2FkID0gMSxcbiAgICAvKipcbiAgICAgKiDotYTmupDlj5HnlJ/lj5jljJbnmoTml7blgJlcbiAgICAgKi9cbiAgICBBc3NldENoYW5nZSA9IDEwLFxuICAgIC8qKlxuICAgICAqIOi1hOa6kOS4ouWksVxuICAgICAqL1xuICAgIEFzc2V0TWlzc2luZyA9IDMwLFxuICAgIC8qKlxuICAgICAqIOayoeaciemAieaLqSBzaGFkZXIgZ3JhcGgg5pe277yM6ZyA6KaB5o+Q56S655So5oi35Y675Yib5bu6XG4gICAgICovXG4gICAgTmVlZENyZWF0ZU5ld0Fzc2V0ID0gNTAsXG4gICAgLyoqXG4gICAgICog5piv5ZCm6ZyA6KaB5L+d5a2Y5bm26YeN5paw5Yqg6L29XG4gICAgICovXG4gICAgTmVlZFNhdmVCZVJlbG9hZEJ5UmVuYW1lID0gNTEsXG4gICAgLyoqXG4gICAgICog562J5b6F5Zy65pmv5Yqg6L295a6M5oiQXG4gICAgICovXG4gICAgV2FpdFNjZW5lUmVhZHkgPSAxMDAsXG59XG5cbi8qKlxuICog55So5LqO5re75YqgIGJsb2NrIOWxnuaAp1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEdyYXBoRWRpdG9yQWRkT3B0aW9ucyB7XG4gICAgdXVpZD86IHN0cmluZztcbiAgICB0eXBlOiBzdHJpbmc7XG4gICAgeD86IG51bWJlcjtcbiAgICB5PzogbnVtYmVyO1xuICAgIGRvbnRDb252ZXJ0UG9zPzogYm9vbGVhbjtcbiAgICBkZXRhaWxzOiBJTm9kZURldGFpbHM7XG59XG5cbi8qKlxuICog5YW25LuW5a2Y5YKo5pWw5o2u5L6L5aaC5ou36LSd77yM57KY6LS0XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgR3JhcGhFZGl0b3JPdGhlck9wdGlvbnMge1xuICAgIHV1aWQ6IHN0cmluZztcbiAgICBsaW5lRGF0YT86IExpbmVEYXRhO1xuICAgIGJsb2NrRGF0YT86IEJsb2NrRGF0YTtcbn1cblxuZXhwb3J0IGVudW0gTWVzc2FnZVR5cGUge1xuXG4gICAgLy8gLS0tIGFzc2V0cyAtLS1cbiAgICBBc3NldExvYWRlZCA9ICdhc3NldC1sb2FkZWQnLFxuXG4gICAgU2NlbmVSZWFkeSA9ICdzY2VuZS1yZWFkeScsXG4gICAgU2NlbmVDbG9zZSA9ICdzY2VuZS1jbG9zZWQnLFxuXG4gICAgRW50ZXJHcmFwaCA9ICdlbnRlci1ncmFwaCcsXG5cbiAgICBTZXRHcmFwaERhdGFUb0ZvcmdlID0gJ3NldC1ncmFwaC1kYXRhLXRvLWZvcmdlJyxcbiAgICBSZXN0b3JlID0gJ3Jlc3RvcmUnLFxuICAgIExvYWRlZCA9ICdsb2FkLWNvbXBsZXRlZCcsXG4gICAgRGVjbGFyZWQgPSAnZGVjbGFyZS1jb21wbGV0ZWQnLFxuICAgIERpcnR5ID0gJ2RpcnR5JyxcbiAgICBEaXJ0eUNoYW5nZWQgPSAnZGlydHktY2hhbmdlZCcsXG4gICAgRHJhZ2dpbmdQcm9wZXJ0eSA9ICdkcmFnZ2luZy1wcm9wZXJ0eScsXG5cbiAgICAvLyBtYXNrXG4gICAgVXBkYXRlTWFzayA9ICd1cGRhdGUtbWFzaycsXG5cbiAgICAvLyBtZW51XG4gICAgU2hvd0NyZWF0ZU5vZGVXaW5kb3cgPSAnc2hvdy1jcmVhdGUtbm9kZScsXG4gICAgQ3JlYXRlTWVudUNoYW5nZSA9ICdjcmVhdGUtbWVudS1jaGFuZ2UnLFxuXG4gICAgLy8gZmxvYXQgd2luZG93XG4gICAgRmxvYXRXaW5kb3dDb25maWdDaGFuZ2VkID0gJ2Zsb2F0LXdpbmRvdy1jb25maWctY2hhbmdlZCcsXG5cbiAgICAvLyB3aW5kb3dcbiAgICBSZXNpemUgPSAncmVzaXplJyxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRmxvYXRXaW5kb3dDb25maWcge1xuICAgIHBvc2l0aW9uPzoge1xuICAgICAgICB0b3A/OiBzdHJpbmc7XG4gICAgICAgIGxlZnQ/OiBzdHJpbmc7XG4gICAgICAgIHJpZ2h0Pzogc3RyaW5nO1xuICAgICAgICBib3R0b20/OiBzdHJpbmc7XG4gICAgfVxuXG4gICAgc2hvdz86IGJvb2xlYW47XG4gICAgd2lkdGg/OiBzdHJpbmc7XG4gICAgaGVpZ2h0Pzogc3RyaW5nO1xuXG4gICAgW2tleTogc3RyaW5nXTogYW55O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElGbG9hdFdpbmRvd0NvbmZpZ3Mge1xuICAgIFtuYW1lOiBzdHJpbmddOiBJRmxvYXRXaW5kb3dDb25maWcsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdyYXBoQ29uZmlnIHtcbiAgICBvZmZzZXQ6IHsgeDogbnVtYmVyLCB5OiBudW1iZXIgfSxcbiAgICBzY2FsZTogbnVtYmVyLFxuICAgIGZsb2F0V2luZG93czogSUZsb2F0V2luZG93Q29uZmlncyxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJR3JhcGhDb25maWdzIHtcbiAgICBbdXVpZDogc3RyaW5nXTogSUdyYXBoQ29uZmlnXG59XG4iXX0=