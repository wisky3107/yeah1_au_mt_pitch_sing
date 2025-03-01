"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMgr = void 0;
const tslib_1 = require("tslib");
const events_1 = tslib_1.__importDefault(require("events"));
class BaseMgr extends events_1.default {
    constructor() {
        super(...arguments);
        this._graphForge = null;
    }
    get graphForge() {
        return this._graphForge;
    }
    setGraphForge(forge) {
        this._graphForge = forge;
    }
    getRootGraphData() {
        return this.graphForge.rootGraph;
    }
    getCurrentGraphData() {
        const currentGraphData = this.graphForge.getCurrentGraph();
        if (currentGraphData) {
            if (!currentGraphData.details) {
                currentGraphData.details = {};
            }
            if (!Array.isArray(currentGraphData.details.properties)) {
                currentGraphData.details.properties = [];
            }
        }
        return currentGraphData;
    }
    setGraphDataToForge(graphData) {
        this.graphForge.setCurrentGraph(graphData);
    }
    release() {
    }
}
exports.BaseMgr = BaseMgr;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1tZ3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2hhZGVyLWdyYXBoL2Jhc2UvYmFzZS1tZ3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLDREQUFrQztBQUlsQyxNQUFhLE9BQVEsU0FBUSxnQkFBWTtJQUF6Qzs7UUFFYyxnQkFBVyxHQUFpQyxJQUFJLENBQUM7SUFpQy9ELENBQUM7SUFoQ0csSUFBVyxVQUFVO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLFdBQVksQ0FBQztJQUM3QixDQUFDO0lBRU0sYUFBYSxDQUFDLEtBQTRCO1FBQzdDLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0lBQzdCLENBQUM7SUFFTSxnQkFBZ0I7UUFDbkIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVUsQ0FBQztJQUN0QyxDQUFDO0lBRU0sbUJBQW1CO1FBQ3RCLE1BQU0sZ0JBQWdCLEdBQWMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN0RSxJQUFJLGdCQUFnQixFQUFFO1lBQ2xCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7Z0JBQzNCLGdCQUFnQixDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7YUFDakM7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ3JELGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO2FBQzVDO1NBQ0o7UUFDRCxPQUFPLGdCQUFnQixDQUFDO0lBQzVCLENBQUM7SUFFTSxtQkFBbUIsQ0FBQyxTQUFvQjtRQUMzQyxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRU0sT0FBTztJQUVkLENBQUM7Q0FDSjtBQW5DRCwwQkFtQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQgeyBIVE1MR3JhcGhGb3JnZUVsZW1lbnQgfSBmcm9tICcuLi8uLi9ibG9jay1mb3JnZSc7XG5pbXBvcnQgeyBHcmFwaERhdGEgfSBmcm9tICcuLi8uLi9ibG9jay1mb3JnZS9pbnRlcmZhY2UnO1xuXG5leHBvcnQgY2xhc3MgQmFzZU1nciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgICBwcm90ZWN0ZWQgX2dyYXBoRm9yZ2U6IEhUTUxHcmFwaEZvcmdlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgIHB1YmxpYyBnZXQgZ3JhcGhGb3JnZSgpOiBIVE1MR3JhcGhGb3JnZUVsZW1lbnQge1xuICAgICAgICByZXR1cm4gdGhpcy5fZ3JhcGhGb3JnZSE7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEdyYXBoRm9yZ2UoZm9yZ2U6IEhUTUxHcmFwaEZvcmdlRWxlbWVudCkge1xuICAgICAgICB0aGlzLl9ncmFwaEZvcmdlID0gZm9yZ2U7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFJvb3RHcmFwaERhdGEoKTogR3JhcGhEYXRhIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JhcGhGb3JnZS5yb290R3JhcGghO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRDdXJyZW50R3JhcGhEYXRhKCk6IEdyYXBoRGF0YSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRHcmFwaERhdGE6IEdyYXBoRGF0YSA9IHRoaXMuZ3JhcGhGb3JnZS5nZXRDdXJyZW50R3JhcGgoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRHcmFwaERhdGEpIHtcbiAgICAgICAgICAgIGlmICghY3VycmVudEdyYXBoRGF0YS5kZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEdyYXBoRGF0YS5kZXRhaWxzID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoY3VycmVudEdyYXBoRGF0YS5kZXRhaWxzLnByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudEdyYXBoRGF0YS5kZXRhaWxzLnByb3BlcnRpZXMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudEdyYXBoRGF0YTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0R3JhcGhEYXRhVG9Gb3JnZShncmFwaERhdGE6IEdyYXBoRGF0YSkge1xuICAgICAgICB0aGlzLmdyYXBoRm9yZ2Uuc2V0Q3VycmVudEdyYXBoKGdyYXBoRGF0YSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbGVhc2UoKSB7XG5cbiAgICB9XG59XG4iXX0=