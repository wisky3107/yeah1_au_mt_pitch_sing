"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgeMgr = void 0;
const index_1 = require("./index");
const block_forge_1 = require("../../block-forge");
/**
 * 用于把 shader-graph 数据转成具体的对象，方便操作跟获取，主要是二次封装 Forge 这个类
 */
class ForgeMgr extends index_1.BaseMgr {
    constructor() {
        super(...arguments);
        this._forge = null;
    }
    static get Instance() {
        if (!this._instance) {
            this._instance = new ForgeMgr();
        }
        return this._instance;
    }
    get forge() {
        this._forge = new block_forge_1.Forge(this.graphForge.getRootGraph());
        return this._forge;
    }
    getGraph() {
        return this.forge.getGraph();
    }
    getBlockMap() {
        return this.getGraph().getBlockMap();
    }
    getBlockByUuid(uuid) {
        return this.getBlockMap()[uuid];
    }
    release() {
    }
}
exports.ForgeMgr = ForgeMgr;
ForgeMgr._instance = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yZ2UtbWdyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NoYWRlci1ncmFwaC9iYXNlL2ZvcmdlLW1nci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBa0M7QUFDbEMsbURBQTBDO0FBRTFDOztHQUVHO0FBQ0gsTUFBYSxRQUFTLFNBQVEsZUFBTztJQUFyQzs7UUFXWSxXQUFNLEdBQWlCLElBQUksQ0FBQztJQXFCeEMsQ0FBQztJQTVCVSxNQUFNLEtBQUssUUFBUTtRQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7U0FDbkM7UUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDMUIsQ0FBQztJQUdELElBQVksS0FBSztRQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxtQkFBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFHLENBQUMsQ0FBQztRQUN6RCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDdkIsQ0FBQztJQUVNLFFBQVE7UUFDWCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVNLFdBQVc7UUFDZCxPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRU0sY0FBYyxDQUFDLElBQVk7UUFDOUIsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELE9BQU87SUFFUCxDQUFDOztBQS9CTCw0QkFnQ0M7QUE5QlUsa0JBQVMsR0FBb0IsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQmFzZU1nciB9IGZyb20gJy4vaW5kZXgnO1xuaW1wb3J0IHsgRm9yZ2UgfSBmcm9tICcuLi8uLi9ibG9jay1mb3JnZSc7XG5cbi8qKlxuICog55So5LqO5oqKIHNoYWRlci1ncmFwaCDmlbDmja7ovazmiJDlhbfkvZPnmoTlr7nosaHvvIzmlrnkvr/mk43kvZzot5/ojrflj5bvvIzkuLvopoHmmK/kuozmrKHlsIHoo4UgRm9yZ2Ug6L+Z5Liq57G7XG4gKi9cbmV4cG9ydCBjbGFzcyBGb3JnZU1nciBleHRlbmRzIEJhc2VNZ3Ige1xuXG4gICAgc3RhdGljIF9pbnN0YW5jZTogRm9yZ2VNZ3IgfCBudWxsID0gbnVsbDtcblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0IEluc3RhbmNlKCk6IEZvcmdlTWdyIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbnN0YW5jZSkge1xuICAgICAgICAgICAgdGhpcy5faW5zdGFuY2UgPSBuZXcgRm9yZ2VNZ3IoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5faW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZm9yZ2U6IEZvcmdlIHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBnZXQgZm9yZ2UoKTogRm9yZ2Uge1xuICAgICAgICB0aGlzLl9mb3JnZSA9IG5ldyBGb3JnZSh0aGlzLmdyYXBoRm9yZ2UuZ2V0Um9vdEdyYXBoKCkhKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZvcmdlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRHcmFwaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9yZ2UuZ2V0R3JhcGgoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QmxvY2tNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEdyYXBoKCkuZ2V0QmxvY2tNYXAoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QmxvY2tCeVV1aWQodXVpZDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEJsb2NrTWFwKClbdXVpZF07XG4gICAgfVxuXG4gICAgcmVsZWFzZSgpIHtcblxuICAgIH1cbn1cbiJdfQ==