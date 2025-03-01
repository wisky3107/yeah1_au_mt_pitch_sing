'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = require("semver");
/**
 * 插件 register 的时候，触发这个钩子
 * 钩子内可以动态更改 package.json 内定义的数据
 *
 * @param info
 */
exports.register = async function (info) {
    const version = Editor.App.version;
    // 3.8.3 使用新版本的添加菜单方式，移除旧的方式
    if ((0, semver_1.gte)(version, '3.8.3')) {
        delete info.contributions.assets.menu;
        // 移除旧的导入器
        if (info.contributions['asset-db']) {
            delete info.contributions['asset-db'].importer;
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOztBQUViLG1DQUE2QjtBQUU3Qjs7Ozs7R0FLRztBQUNILE9BQU8sQ0FBQyxRQUFRLEdBQUcsS0FBSyxXQUFVLElBQTJCO0lBQ3pELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDO0lBQ25DLDRCQUE0QjtJQUM1QixJQUFJLElBQUEsWUFBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTtRQUN2QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN0QyxVQUFVO1FBQ1YsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUM7U0FDbEQ7S0FDSjtBQUNMLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgZ3RlIH0gZnJvbSAnc2VtdmVyJztcblxuLyoqXG4gKiDmj5Lku7YgcmVnaXN0ZXIg55qE5pe25YCZ77yM6Kem5Y+R6L+Z5Liq6ZKp5a2QXG4gKiDpkqnlrZDlhoXlj6/ku6XliqjmgIHmm7TmlLkgcGFja2FnZS5qc29uIOWGheWumuS5ieeahOaVsOaNrlxuICpcbiAqIEBwYXJhbSBpbmZvXG4gKi9cbmV4cG9ydHMucmVnaXN0ZXIgPSBhc3luYyBmdW5jdGlvbihpbmZvOiB7IFtrZXk6IHN0cmluZ106IGFueX0pIHtcbiAgICBjb25zdCB2ZXJzaW9uID0gRWRpdG9yLkFwcC52ZXJzaW9uO1xuICAgIC8vIDMuOC4zIOS9v+eUqOaWsOeJiOacrOeahOa3u+WKoOiPnOWNleaWueW8j++8jOenu+mZpOaXp+eahOaWueW8j1xuICAgIGlmIChndGUodmVyc2lvbiwgJzMuOC4zJykpIHtcbiAgICAgICAgZGVsZXRlIGluZm8uY29udHJpYnV0aW9ucy5hc3NldHMubWVudTtcbiAgICAgICAgLy8g56e76Zmk5pen55qE5a+85YWl5ZmoXG4gICAgICAgIGlmIChpbmZvLmNvbnRyaWJ1dGlvbnNbJ2Fzc2V0LWRiJ10pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBpbmZvLmNvbnRyaWJ1dGlvbnNbJ2Fzc2V0LWRiJ10uaW1wb3J0ZXI7XG4gICAgICAgIH1cbiAgICB9XG59O1xuIl19