"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShaderGraph380 = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
module.paths.push((0, path_1.join)(Editor.App.path, 'node_modules'));
const { Asset, Importer } = require('@editor/asset-db');
const shader_graph_1 = tslib_1.__importDefault(require("./shader-graph"));
const utils_3_8_1 = require("./utils-3.8");
class ShaderGraph380 extends Importer {
    // 引擎内对应的类型
    get assetType() {
        return shader_graph_1.default.assetType;
    }
    get version() {
        return shader_graph_1.default.version;
    }
    get name() {
        return shader_graph_1.default.name;
    }
    get migrations() {
        return shader_graph_1.default.migrations;
    }
    /**
     * 返回是否导入成功的标记
     * 如果返回 false，则 imported 标记不会变成 true
     * 后续的一系列操作都不会执行
     * @param asset
     */
    // @ts-expect-error
    async import(asset) {
        try {
            await (0, utils_3_8_1.generateEffectAsset)(asset, await shader_graph_1.default.generateEffectByAsset(asset));
            return true;
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }
}
exports.ShaderGraph380 = ShaderGraph380;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhZGVyLWdyYXBoLTMuOC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbXBvcnRlci9zaGFkZXItZ3JhcGgtMy44LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFDQSwrQkFBNEI7QUFDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBQSxXQUFJLEVBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUV6RCxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBRXhELDBFQUF5QztBQUN6QywyQ0FBa0Q7QUFFbEQsTUFBYSxjQUFlLFNBQVEsUUFBUTtJQUV4QyxXQUFXO0lBQ1gsSUFBSSxTQUFTO1FBQ1QsT0FBTyxzQkFBVyxDQUFDLFNBQVMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsSUFBSSxPQUFPO1FBQ1AsT0FBTyxzQkFBVyxDQUFDLE9BQU8sQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ0osT0FBTyxzQkFBVyxDQUFDLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsSUFBSSxVQUFVO1FBQ1YsT0FBTyxzQkFBVyxDQUFDLFVBQVUsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxtQkFBbUI7SUFDWixLQUFLLENBQUMsTUFBTSxDQUFDLEtBQVk7UUFDNUIsSUFBSTtZQUNBLE1BQU0sSUFBQSwrQkFBbUIsRUFBQyxLQUFLLEVBQUUsTUFBTSxzQkFBVyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakYsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixPQUFPLEtBQUssQ0FBQztTQUNoQjtJQUNMLENBQUM7Q0FDSjtBQW5DRCx3Q0FtQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbm1vZHVsZS5wYXRocy5wdXNoKGpvaW4oRWRpdG9yLkFwcC5wYXRoLCAnbm9kZV9tb2R1bGVzJykpO1xuXG5jb25zdCB7IEFzc2V0LCBJbXBvcnRlciB9ID0gcmVxdWlyZSgnQGVkaXRvci9hc3NldC1kYicpO1xuXG5pbXBvcnQgc2hhZGVyR3JhcGggZnJvbSAnLi9zaGFkZXItZ3JhcGgnO1xuaW1wb3J0IHsgZ2VuZXJhdGVFZmZlY3RBc3NldCB9IGZyb20gJy4vdXRpbHMtMy44JztcblxuZXhwb3J0IGNsYXNzIFNoYWRlckdyYXBoMzgwIGV4dGVuZHMgSW1wb3J0ZXIge1xuXG4gICAgLy8g5byV5pOO5YaF5a+55bqU55qE57G75Z6LXG4gICAgZ2V0IGFzc2V0VHlwZSgpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRlckdyYXBoLmFzc2V0VHlwZTtcbiAgICB9XG5cbiAgICBnZXQgdmVyc2lvbigpIHtcbiAgICAgICAgcmV0dXJuIHNoYWRlckdyYXBoLnZlcnNpb247XG4gICAgfVxuXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiBzaGFkZXJHcmFwaC5uYW1lO1xuICAgIH1cblxuICAgIGdldCBtaWdyYXRpb25zKCkge1xuICAgICAgICByZXR1cm4gc2hhZGVyR3JhcGgubWlncmF0aW9ucztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDov5Tlm57mmK/lkKblr7zlhaXmiJDlip/nmoTmoIforrBcbiAgICAgKiDlpoLmnpzov5Tlm54gZmFsc2XvvIzliJkgaW1wb3J0ZWQg5qCH6K6w5LiN5Lya5Y+Y5oiQIHRydWVcbiAgICAgKiDlkI7nu63nmoTkuIDns7vliJfmk43kvZzpg73kuI3kvJrmiafooYxcbiAgICAgKiBAcGFyYW0gYXNzZXRcbiAgICAgKi9cbiAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgcHVibGljIGFzeW5jIGltcG9ydChhc3NldDogQXNzZXQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGdlbmVyYXRlRWZmZWN0QXNzZXQoYXNzZXQsIGF3YWl0IHNoYWRlckdyYXBoLmdlbmVyYXRlRWZmZWN0QnlBc3NldChhc3NldCkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=