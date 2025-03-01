'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLGraphForgeElement = void 0;
const tslib_1 = require("tslib");
const graph_1 = require("./graph");
const utils_1 = require("./utils");
const event_1 = require("./event");
const structures_1 = require("@itharbors/structures");
const undo_1 = require("./undo");
const js_yaml_1 = tslib_1.__importDefault(require("js-yaml"));
const enum_1 = require("./enum");
const STYLE = /*css*/ `
:host { display: flex; flex-direction: column; }
:host > header { padding: 4px 10px; display: flex; }
:host > header > div { flex: 1; }
:host > header > div > span { cursor: pointer; }
:host > header > slot { display: block; }
:host > header > i { margin: 0 4px; }
:host > section { flex: 1; display: flex; }
:host > section > v-graph { flex: 1; }
`;
const HTML = /*html*/ `
<style>${STYLE}</style>
<header>
    <div></div>
    <slot></slot>
</header>
<section>
    <v-graph type=""><v-graph>
</section>
`;
class HTMLGraphForgeElement extends HTMLElement {
    constructor() {
        super();
        this.actionQueue = new structures_1.ActionQueue({
            forge: this,
        });
        this.paths = [];
        this.attachShadow({
            mode: 'open',
        });
        this.shadowRoot.innerHTML = HTML;
        this.$graph = this.shadowRoot.querySelector('v-graph');
        this._initHeader();
        this._initSection();
    }
    _initHeader() {
        this._updateHeader();
        this.shadowRoot.querySelector('header > div').addEventListener('click', (event) => {
            const $span = event.target;
            if (!$span.hasAttribute('path-index')) {
                return;
            }
            let index = parseInt($span.getAttribute('path-index') || '0');
            if (index < 0) {
                index = 0;
            }
            this.paths.splice(index + 1);
            this._updateGraph();
            const graph = this.paths[this.paths.length - 1];
            (0, utils_1.dispatch)(this, 'enter-graph', {
                detail: {
                    id: graph.name,
                },
            });
        });
    }
    _updateHeader() {
        const paths = this.paths.map((info, index) => `<span path-index="${index}">${info.name || info.type}</span>`).join('<i>/</i>');
        this.shadowRoot.querySelector('header > div').innerHTML = paths;
    }
    _initSection() {
        const $graph = this.shadowRoot.querySelector('v-graph');
        $graph.shadowRoot.addEventListener('block-click', (event) => {
            const customEvent = event;
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            const $node = customEvent.target;
            if (info.graph.event && info.graph.event.onBlockClick) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $node.getAttribute('node-uuid') || '';
                const block = $graph.getProperty('nodes')[uuid];
                const blockEvent = new event_1.BlockMouseEvent(nodes, lines, $node, block);
                info.graph.event.onBlockClick(blockEvent);
            }
        });
        $graph.shadowRoot.addEventListener('block-dblclick', (event) => {
            const customEvent = event;
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            const $node = customEvent.target;
            if ($node.tagName === 'V-GRAPH-NODE') {
                const details = $node.getProperty('details');
                if (details.subGraph) {
                    this.enterSubGraph(details.subGraph);
                    return;
                }
            }
            if (info.graph.event && info.graph.event.onBlockDblClick) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $node.getAttribute('node-uuid') || '';
                const block = $graph.getProperty('nodes')[uuid];
                const blockEvent = new event_1.BlockMouseEvent(nodes, lines, $node, block);
                blockEvent.initPagePosition(customEvent.detail.pageX, customEvent.detail.pageY);
                const graphPosition = $graph.convertCoordinate(customEvent.detail.offsetX, customEvent.detail.offsetY);
                blockEvent.initGraphPosition(graphPosition.x, graphPosition.y);
                info.graph.event.onBlockDblClick(blockEvent);
            }
        });
        $graph.shadowRoot.addEventListener('block-right-click', (event) => {
            const customEvent = event;
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            const $node = customEvent.target;
            if (info.graph.event && info.graph.event.onBlockRightClick) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $node.getAttribute('node-uuid') || '';
                const block = $graph.getProperty('nodes')[uuid];
                const blockEvent = new event_1.BlockMouseEvent(nodes, lines, $node, block);
                info.graph.event.onBlockRightClick(blockEvent);
            }
        });
        $graph.addEventListener('node-selected', (event) => {
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            const $node = event.target;
            if (info.graph.event && info.graph.event.onBlockSelected) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $node.getAttribute('node-uuid') || '';
                const block = $graph.getProperty('nodes')[uuid];
                const event = new event_1.BlockEvent(nodes, lines, $node, block);
                info.graph.event.onBlockSelected(event);
            }
        });
        $graph.addEventListener('node-unselected', (event) => {
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            const $node = event.target;
            if (info.graph.event && info.graph.event.onBlockUnselected) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $node.getAttribute('node-uuid') || '';
                const block = $graph.getProperty('nodes')[uuid];
                const event = new event_1.BlockEvent(nodes, lines, $node, block);
                info.graph.event.onBlockUnselected(event);
            }
        });
        $graph.addEventListener('line-selected', (event) => {
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            const $g = event.target;
            if (info.graph.event && info.graph.event.onLineSelected) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $g.getAttribute('line-uuid') || '';
                const line = lines[uuid];
                const event = new event_1.LineEvent(nodes, lines, $g, line);
                info.graph.event.onLineSelected(event);
            }
        });
        $graph.addEventListener('line-unselected', (event) => {
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            const $g = event.target;
            if (info.graph.event && info.graph.event.onLineUnselected) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $g.getAttribute('line-uuid') || '';
                const line = lines[uuid];
                const event = new event_1.LineEvent(nodes, lines, $g, line);
                info.graph.event.onLineUnselected(event);
            }
        });
        $graph.addEventListener('node-added', (event) => {
            const cEvent = event;
            (0, utils_1.dispatch)(this, 'node-added', {
                detail: cEvent.detail,
            });
            (0, utils_1.dispatch)(this, 'dirty');
        });
        $graph.addEventListener('node-removed', (event) => {
            const cEvent = event;
            (0, utils_1.dispatch)(this, 'node-removed', {
                detail: cEvent.detail,
            });
            (0, utils_1.dispatch)(this, 'dirty');
        });
        $graph.addEventListener('node-changed', (event) => {
            const cEvent = event;
            (0, utils_1.dispatch)(this, 'node-changed', {
                detail: cEvent.detail,
            });
            (0, utils_1.dispatch)(this, 'dirty');
        });
        $graph.addEventListener('node-position-changed', (event) => {
            const cEvent = event;
            const queue = cEvent.detail.moveList.map((item) => {
                return new undo_1.BlockPositionAction({
                    blockName: item.id,
                    target: item.target,
                    source: item.source,
                });
            });
            if (queue.length === 1) {
                this.actionQueue.exec(queue[0]);
            }
            else if (queue.length > 1) {
                this.actionQueue.exec(new structures_1.ActionList({
                    queue,
                }));
            }
            (0, utils_1.dispatch)(this, 'dirty', {
                detail: {
                    dirtyType: 'position-changed',
                },
            });
        });
        // //// ////
        $graph.shadowRoot.addEventListener('dirty', (event) => {
            const cEvent = event;
            if (cEvent.detail && cEvent.detail.action) {
                this.actionQueue.exec(cEvent.detail.action);
            }
            (0, utils_1.dispatch)(this, 'dirty', {
                detail: cEvent.detail,
            });
        });
        $graph.addEventListener('mouseup', (event) => {
            const info = graph_1.graphMap.get(this.rootGraph.type);
            if (!info) {
                return;
            }
            if (event.button === 2 && info.graph.event?.onGraphRightClick) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const graphPosition = $graph.convertCoordinate(event.offsetX, event.offsetY);
                const customEvent = new event_1.GraphMouseEvent(nodes, lines, $graph, this);
                customEvent.initPagePosition(event.pageX, event.pageY);
                customEvent.initGraphPosition(graphPosition.x, graphPosition.y);
                info.graph.event.onGraphRightClick(customEvent);
            }
        });
        $graph.addEventListener('line-added', (event) => {
            const customEment = event;
            const $node = $graph.queryNodeElement(customEment.detail.line.output.node);
            if ($node) {
                // @ts-ignore
                $node.onUpdate && $node.onUpdate();
            }
            (0, utils_1.dispatch)(this, 'line-added', {
                detail: customEment.detail,
            });
            (0, utils_1.dispatch)(this, 'dirty');
        });
        $graph.addEventListener('line-removed', (event) => {
            const customEment = event;
            const $node = $graph.queryNodeElement(customEment.detail.line.output.node);
            if ($node) {
                // @ts-ignore
                $node.onUpdate && $node.onUpdate();
            }
            (0, utils_1.dispatch)(this, 'line-removed', {
                detail: customEment.detail,
            });
            (0, utils_1.dispatch)(this, 'dirty');
        });
        $graph.addEventListener('line-changed', (event) => {
            const customElement = event;
            (0, utils_1.dispatch)(this, 'line-changed', {
                detail: customElement.detail,
            });
            (0, utils_1.dispatch)(this, 'dirty');
        });
        $graph.addEventListener('node-connected', (event) => {
            const customElement = event;
            this.startRecording();
            this.addLine(customElement.detail.line);
            setTimeout(() => {
                this.stopRecording();
            }, 200);
        });
        const $svg = $graph.shadowRoot.querySelector('#lines');
        function searchG(htmlArray) {
            const length = Math.min(htmlArray.length, 4);
            for (let i = 0; i < length; i++) {
                const $elem = htmlArray[i];
                // 如果找到顶部的 document 元素的话，是没有 tagName 的
                if ($elem.tagName && $elem.tagName.toLocaleLowerCase() === 'g') {
                    return $elem;
                }
            }
        }
        $svg.addEventListener('dblclick', (event) => {
            // @ts-ignore
            const $g = searchG(event.path);
            if (!$g || !$g.hasAttribute('line-uuid')) {
                return;
            }
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            if (info.graph.event && info.graph.event.onLineDblClick) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $g.getAttribute('line-uuid') || '';
                const line = lines[uuid];
                const event = new event_1.LineMouseEvent(nodes, lines, $g, line);
                info.graph.event.onLineDblClick(event);
            }
        });
        $svg.addEventListener('click', (event) => {
            // @ts-ignore
            const $g = searchG(event.path);
            if (!$g || !$g.hasAttribute('line-uuid')) {
                return;
            }
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            if (info.graph.event && info.graph.event.onLineClick) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $g.getAttribute('line-uuid') || '';
                const line = lines[uuid];
                const event = new event_1.LineMouseEvent(nodes, lines, $g, line);
                info.graph.event.onLineClick(event);
            }
        });
        $svg.addEventListener('mouseup', (event) => {
            // @ts-ignore
            const $g = searchG(event.path);
            if (!$g || !$g.hasAttribute('line-uuid')) {
                return;
            }
            if (event.button !== 2) {
                return;
            }
            const type = this.paths[this.paths.length - 1].type;
            const info = graph_1.graphMap.get(type);
            if (!info) {
                return;
            }
            if (info.graph.event && info.graph.event.onLineRightClick) {
                const nodes = $graph.getProperty('nodes');
                const lines = $graph.getProperty('lines');
                const uuid = $g.getAttribute('line-uuid') || '';
                const line = lines[uuid];
                const event = new event_1.LineMouseEvent(nodes, lines, $g, line);
                info.graph.event.onLineRightClick(event);
            }
        });
    }
    _updateGraph() {
        (0, enum_1.clearDynamicEnum)();
        const graph = this.paths[this.paths.length - 1];
        const $graph = this.shadowRoot.querySelector('v-graph');
        $graph.clear();
        requestAnimationFrame(() => {
            $graph.setAttribute('type', graph.type);
            $graph.setProperty('lines', graph.lines);
            $graph.setProperty('nodes', graph.nodes);
            this._updateHeader();
        });
    }
    undo() {
        this.actionQueue.undo();
        (0, utils_1.dispatch)(this, 'undo');
    }
    redo() {
        this.actionQueue.redo();
        (0, utils_1.dispatch)(this, 'redo');
    }
    startRecording() {
        this.actionQueue.startRecording();
    }
    stopRecording() {
        this.actionQueue.stopRecording();
    }
    getPinElement(blockName, type, index) {
        const $block = this.$graph.shadowRoot.querySelector(`v-graph-node[node-uuid=${blockName}]`);
        if (!$block) {
            return;
        }
        const $pinList = $block.shadowRoot.querySelectorAll(`.pin.in`);
        const $pin = $pinList[index];
        return $pin;
    }
    getBlockElement(blockName) {
        return this.$graph.shadowRoot.querySelector(`v-graph-node[node-uuid=${blockName}]`);
    }
    /// ---- 操作整个图
    /**
     * 将屏幕坐标转换成 Graph 内的坐标
     * @param point
     * @returns
     */
    convertCoordinate(point) {
        point = this.$graph.convertCoordinate(point.x, point.y);
        return point;
    }
    /**
     * 设置编辑的根图
     * @param graph
     */
    setRootGraph(graph) {
        this.rootGraph = graph;
        this.paths = [graph];
        this._updateGraph();
    }
    /**
     * 获取正在编辑的根图
     * @returns
     */
    getRootGraph() {
        return this.paths[0];
    }
    /**
     * 传入一个字符串，反序列化成图数据
     * @param content
     * @returns
     */
    deserialize(content) {
        const graphData = js_yaml_1.default.load(content);
        return graphData;
    }
    /**
     * 传入一个图数据，序列化成 yaml 字符串
     * @param data
     * @returns
     */
    serialize(data) {
        const str = js_yaml_1.default.dump(data || this.paths[0]);
        // return JSON.stringify(this.paths[0]);
        // outputFileSync('/Users/wangsijie/Project/Creator/cocos-editor/extension-repos/shader-graph/test.yaml', str);
        return str;
    }
    /**
     * 获取整个图现在的一些基础数据
     * @returns
     */
    getGraphInfo() {
        const offset = this.$graph.getProperty('offset');
        const scale = this.$graph.getProperty('scale');
        return {
            offset, scale,
        };
    }
    /**
     * 设置整个图的一些基础数据
     * @param info
     */
    setGraphInfo(info) {
        this.$graph.setProperty('offset', info.offset);
        this.$graph.setProperty('scale', info.scale);
    }
    /**
     * 恢复缩放比例
     */
    zoomToFit() {
        this.$graph.data.setProperty('scale', 1);
    }
    /// ---- 操作当前图
    /**
     * 获取选中的 Block 列表
     * @returns
     */
    getSelectedBlockList() {
        return this.$graph.getSelectedNodeList();
    }
    /**
     * 获取选中的 Line 列表
     * @returns
     */
    getSelectedLineList() {
        return this.$graph.getSelectedLineList();
    }
    /**
     * 设置当前正在编辑的图数据
     * @param graph
     * @returns
     */
    setCurrentGraph(graph) {
        if (this.paths.length <= 1) {
            this.setRootGraph(graph);
            return;
        }
        this.paths[this.paths.length - 1] = graph;
        this._updateGraph();
    }
    /**
     * 获取正在编辑的图数据
     * @returns
     */
    getCurrentGraph() {
        return this.paths[this.paths.length - 1];
    }
    /**
     * 在当前正在操作的图数据里增加一个 Block
     * @param block
     * @param id
     */
    addBlock(block, id) {
        this.actionQueue.exec(new undo_1.AddBlockAction({ block, id }));
    }
    /**
     * 在当前正在操作的图数据里删除一个节点
     * @param id
     */
    removeBlock(id) {
        const queue = [];
        // remove line
        const lines = this.$graph.getProperty('lines');
        for (const key in lines) {
            const line = lines[key];
            if (line.input.node === id || line.output.node === id) {
                queue.push(new undo_1.RemoveLineAction({ id: key }));
            }
        }
        queue.push(new undo_1.RemoveBlockAction({ id }));
        this.actionQueue.exec(new structures_1.ActionList({
            queue,
        }));
    }
    /**
     * 在当前正在操作的图数据里增加一个连线
     * @param line
     * @param id
     */
    addLine(line, id) {
        this.actionQueue.exec(new undo_1.AddLineAction({ line, id }));
    }
    /**
     * 在当前正在操作的图数据里删除一个连线
     * @param id
     */
    removeLine(id) {
        this.actionQueue.exec(new undo_1.RemoveLineAction({ id }));
    }
    /**
     * 进入当前图的子图
     * @param id
     */
    enterSubGraph(id) {
        const graph = this.paths[this.paths.length - 1];
        const subGraph = graph.graphs[id];
        if (subGraph) {
            this.paths.push(subGraph);
            this._updateGraph();
        }
        (0, utils_1.dispatch)(this, 'enter-graph', {
            detail: {
                id: id,
            },
        });
    }
    /**
     * 在当前编辑的图里增加一个子图
     * @param type
     * @param id
     * @returns
     */
    addSubGraph(type, id) {
        const info = this.paths[this.paths.length - 1];
        // const uuid = generateUUID();
        info.graphs[id] = {
            type,
            name: type,
            nodes: {},
            lines: {},
            graphs: {},
        };
        return info.graphs[id];
    }
    /**
     * 在当前编辑的图里，删除一个子图
     * @param id
     */
    removeSubGraph(id) {
        const info = this.paths[this.paths.length - 1];
        delete info.graphs[id];
    }
}
exports.HTMLGraphForgeElement = HTMLGraphForgeElement;
if (!window.customElements.get('ui-graph-forge')) {
    window.customElements.define('ui-graph-forge', HTMLGraphForgeElement);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYmxvY2stZm9yZ2UvZm9yZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7O0FBVWIsbUNBQW1DO0FBQ25DLG1DQUFpRDtBQUNqRCxtQ0FBa0c7QUFFbEcsc0RBSStCO0FBRS9CLGlDQU1nQjtBQUloQiw4REFBMkI7QUFDM0IsaUNBQTBDO0FBRTFDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQTs7Ozs7Ozs7O0NBU3BCLENBQUM7QUFFRixNQUFNLElBQUksR0FBRyxRQUFRLENBQUE7U0FDWixLQUFLOzs7Ozs7OztDQVFiLENBQUM7QUFFRixNQUFhLHFCQUFzQixTQUFRLFdBQVc7SUFRbEQ7UUFDSSxLQUFLLEVBQUUsQ0FBQztRQVBKLGdCQUFXLEdBQUcsSUFBSSx3QkFBVyxDQUFDO1lBQ2xDLEtBQUssRUFBRSxJQUFJO1NBQ2QsQ0FBQyxDQUFDO1FBbUJILFVBQUssR0FBZ0IsRUFBRSxDQUFDO1FBYnBCLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDZCxJQUFJLEVBQUUsTUFBTTtTQUNmLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFXLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUVsQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFXLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBa0IsQ0FBQztRQUV6RSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3hCLENBQUM7SUFLTyxXQUFXO1FBQ2YsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFXLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBRSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2hGLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFxQixD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SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNILGNBQWMsQ0FBQyxFQUFVO1FBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDL0MsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzNCLENBQUM7Q0FDSjtBQXhuQkQsc0RBd25CQztBQUVELElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0lBQzlDLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLHFCQUFxQixDQUFDLENBQUM7Q0FDekUiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB0eXBlIHtcbiAgICBHcmFwaEVsZW1lbnQsXG4gICAgTm9kZUNoYW5nZWREZXRhaWwsXG4gICAgTm9kZVBvc2l0aW9uQ2hhbmdlZERldGFpbCxcbiAgICBHcmFwaE5vZGVFbGVtZW50LFxufSBmcm9tICdAaXRoYXJib3JzL3VpLWdyYXBoJztcblxuaW1wb3J0IHR5cGUgeyBEaXJ0eURldGFpbCB9IGZyb20gJy4vcGluJztcbmltcG9ydCB7IGdyYXBoTWFwIH0gZnJvbSAnLi9ncmFwaCc7XG5pbXBvcnQgeyBnZW5lcmF0ZVVVSUQsIGRpc3BhdGNoIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBHcmFwaE1vdXNlRXZlbnQsIEJsb2NrTW91c2VFdmVudCwgQmxvY2tFdmVudCwgTGluZUV2ZW50LCBMaW5lTW91c2VFdmVudCB9IGZyb20gJy4vZXZlbnQnO1xuXG5pbXBvcnQge1xuICAgIEFjdGlvbixcbiAgICBBY3Rpb25MaXN0LFxuICAgIEFjdGlvblF1ZXVlLFxufSBmcm9tICdAaXRoYXJib3JzL3N0cnVjdHVyZXMnO1xuXG5pbXBvcnQge1xuICAgIEFkZEJsb2NrQWN0aW9uLFxuICAgIFJlbW92ZUJsb2NrQWN0aW9uLFxuICAgIEFkZExpbmVBY3Rpb24sXG4gICAgUmVtb3ZlTGluZUFjdGlvbixcbiAgICBCbG9ja1Bvc2l0aW9uQWN0aW9uLFxufSBmcm9tICcuL3VuZG8nO1xuXG5pbXBvcnQgdHlwZSB7IEdyYXBoRGF0YSwgQmxvY2tEYXRhLCBMaW5lRGF0YSwgSUdyYXBoRGVmaW5lRXZlbnQgfSBmcm9tICcuL2ludGVyZmFjZSc7XG5cbmltcG9ydCB5YW1sIGZyb20gJ2pzLXlhbWwnO1xuaW1wb3J0IHsgY2xlYXJEeW5hbWljRW51bSB9IGZyb20gJy4vZW51bSc7XG5cbmNvbnN0IFNUWUxFID0gLypjc3MqL2Bcbjpob3N0IHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgfVxuOmhvc3QgPiBoZWFkZXIgeyBwYWRkaW5nOiA0cHggMTBweDsgZGlzcGxheTogZmxleDsgfVxuOmhvc3QgPiBoZWFkZXIgPiBkaXYgeyBmbGV4OiAxOyB9XG46aG9zdCA+IGhlYWRlciA+IGRpdiA+IHNwYW4geyBjdXJzb3I6IHBvaW50ZXI7IH1cbjpob3N0ID4gaGVhZGVyID4gc2xvdCB7IGRpc3BsYXk6IGJsb2NrOyB9XG46aG9zdCA+IGhlYWRlciA+IGkgeyBtYXJnaW46IDAgNHB4OyB9XG46aG9zdCA+IHNlY3Rpb24geyBmbGV4OiAxOyBkaXNwbGF5OiBmbGV4OyB9XG46aG9zdCA+IHNlY3Rpb24gPiB2LWdyYXBoIHsgZmxleDogMTsgfVxuYDtcblxuY29uc3QgSFRNTCA9IC8qaHRtbCovYFxuPHN0eWxlPiR7U1RZTEV9PC9zdHlsZT5cbjxoZWFkZXI+XG4gICAgPGRpdj48L2Rpdj5cbiAgICA8c2xvdD48L3Nsb3Q+XG48L2hlYWRlcj5cbjxzZWN0aW9uPlxuICAgIDx2LWdyYXBoIHR5cGU9XCJcIj48di1ncmFwaD5cbjwvc2VjdGlvbj5cbmA7XG5cbmV4cG9ydCBjbGFzcyBIVE1MR3JhcGhGb3JnZUVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgICBwcml2YXRlIGFjdGlvblF1ZXVlID0gbmV3IEFjdGlvblF1ZXVlKHtcbiAgICAgICAgZm9yZ2U6IHRoaXMsXG4gICAgfSk7XG5cbiAgICAkZ3JhcGg6IEdyYXBoRWxlbWVudDtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmF0dGFjaFNoYWRvdyh7XG4gICAgICAgICAgICBtb2RlOiAnb3BlbicsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc2hhZG93Um9vdCEuaW5uZXJIVE1MID0gSFRNTDtcblxuICAgICAgICB0aGlzLiRncmFwaCA9IHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3Rvcigndi1ncmFwaCcpISBhcyBHcmFwaEVsZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5faW5pdEhlYWRlcigpO1xuICAgICAgICB0aGlzLl9pbml0U2VjdGlvbigpO1xuICAgIH1cblxuICAgIHJvb3RHcmFwaD86IEdyYXBoRGF0YTtcbiAgICBwYXRoczogR3JhcGhEYXRhW10gPSBbXTtcblxuICAgIHByaXZhdGUgX2luaXRIZWFkZXIoKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUhlYWRlcigpO1xuICAgICAgICB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlciA+IGRpdicpIS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJHNwYW4gPSBldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAoISRzcGFuLmhhc0F0dHJpYnV0ZSgncGF0aC1pbmRleCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGluZGV4ID0gcGFyc2VJbnQoJHNwYW4uZ2V0QXR0cmlidXRlKCdwYXRoLWluZGV4JykgfHwgJzAnKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnBhdGhzLnNwbGljZShpbmRleCArIDEpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlR3JhcGgoKTtcbiAgICAgICAgICAgIGNvbnN0IGdyYXBoID0gdGhpcy5wYXRoc1t0aGlzLnBhdGhzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgZGlzcGF0Y2godGhpcywgJ2VudGVyLWdyYXBoJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICBpZDogZ3JhcGgubmFtZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3VwZGF0ZUhlYWRlcigpIHtcbiAgICAgICAgY29uc3QgcGF0aHMgPSB0aGlzLnBhdGhzLm1hcCgoaW5mbywgaW5kZXgpID0+IGA8c3BhbiBwYXRoLWluZGV4PVwiJHtpbmRleH1cIj4ke2luZm8ubmFtZSB8fCBpbmZvLnR5cGV9PC9zcGFuPmApLmpvaW4oJzxpPi88L2k+Jyk7XG4gICAgICAgIHRoaXMuc2hhZG93Um9vdCEucXVlcnlTZWxlY3RvcignaGVhZGVyID4gZGl2JykhLmlubmVySFRNTCA9IHBhdGhzO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2luaXRTZWN0aW9uKCkge1xuICAgICAgICBjb25zdCAkZ3JhcGggPSB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoJ3YtZ3JhcGgnKSBhcyBHcmFwaEVsZW1lbnQ7XG4gICAgICAgICRncmFwaC5zaGFkb3dSb290IS5hZGRFdmVudExpc3RlbmVyKCdibG9jay1jbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBldmVudCBhcyBDdXN0b21FdmVudDx7XG4gICAgICAgICAgICB9PjtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLnBhdGhzW3RoaXMucGF0aHMubGVuZ3RoIC0gMV0udHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBncmFwaE1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCAkbm9kZSA9IGN1c3RvbUV2ZW50LnRhcmdldCBhcyBHcmFwaE5vZGVFbGVtZW50O1xuICAgICAgICAgICAgaWYgKGluZm8uZ3JhcGguZXZlbnQgJiYgaW5mby5ncmFwaC5ldmVudC5vbkJsb2NrQ2xpY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbm9kZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBCbG9ja0RhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogTGluZURhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICRub2RlLmdldEF0dHJpYnV0ZSgnbm9kZS11dWlkJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvY2sgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ25vZGVzJylbdXVpZF0gYXMgQmxvY2tEYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrRXZlbnQgPSBuZXcgQmxvY2tNb3VzZUV2ZW50KG5vZGVzLCBsaW5lcywgJG5vZGUsIGJsb2NrKTtcbiAgICAgICAgICAgICAgICBpbmZvLmdyYXBoLmV2ZW50Lm9uQmxvY2tDbGljayhibG9ja0V2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgICRncmFwaC5zaGFkb3dSb290IS5hZGRFdmVudExpc3RlbmVyKCdibG9jay1kYmxjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBldmVudCBhcyBDdXN0b21FdmVudDx7XG4gICAgICAgICAgICAgICAgcGFnZVg6IG51bWJlcjtcbiAgICAgICAgICAgICAgICBwYWdlWTogbnVtYmVyO1xuICAgICAgICAgICAgICAgIG9mZnNldFg6IG51bWJlcjtcbiAgICAgICAgICAgICAgICBvZmZzZXRZOiBudW1iZXI7XG4gICAgICAgICAgICB9PjtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLnBhdGhzW3RoaXMucGF0aHMubGVuZ3RoIC0gMV0udHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBncmFwaE1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCAkbm9kZSA9IGN1c3RvbUV2ZW50LnRhcmdldCBhcyBHcmFwaE5vZGVFbGVtZW50O1xuICAgICAgICAgICAgaWYgKCRub2RlLnRhZ05hbWUgPT09ICdWLUdSQVBILU5PREUnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGV0YWlscyA9ICRub2RlLmdldFByb3BlcnR5KCdkZXRhaWxzJyk7XG4gICAgICAgICAgICAgICAgaWYgKGRldGFpbHMuc3ViR3JhcGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnRlclN1YkdyYXBoKGRldGFpbHMuc3ViR3JhcGgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGluZm8uZ3JhcGguZXZlbnQgJiYgaW5mby5ncmFwaC5ldmVudC5vbkJsb2NrRGJsQ2xpY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbm9kZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBCbG9ja0RhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogTGluZURhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICRub2RlLmdldEF0dHJpYnV0ZSgnbm9kZS11dWlkJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvY2sgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ25vZGVzJylbdXVpZF0gYXMgQmxvY2tEYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrRXZlbnQgPSBuZXcgQmxvY2tNb3VzZUV2ZW50KG5vZGVzLCBsaW5lcywgJG5vZGUsIGJsb2NrKTtcbiAgICAgICAgICAgICAgICBibG9ja0V2ZW50LmluaXRQYWdlUG9zaXRpb24oY3VzdG9tRXZlbnQuZGV0YWlsLnBhZ2VYLCBjdXN0b21FdmVudC5kZXRhaWwucGFnZVkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyYXBoUG9zaXRpb24gPSAkZ3JhcGguY29udmVydENvb3JkaW5hdGUoY3VzdG9tRXZlbnQuZGV0YWlsLm9mZnNldFgsIGN1c3RvbUV2ZW50LmRldGFpbC5vZmZzZXRZKTtcbiAgICAgICAgICAgICAgICBibG9ja0V2ZW50LmluaXRHcmFwaFBvc2l0aW9uKGdyYXBoUG9zaXRpb24ueCwgZ3JhcGhQb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICBpbmZvLmdyYXBoLmV2ZW50Lm9uQmxvY2tEYmxDbGljayhibG9ja0V2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgICRncmFwaC5zaGFkb3dSb290IS5hZGRFdmVudExpc3RlbmVyKCdibG9jay1yaWdodC1jbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tRXZlbnQgPSBldmVudCBhcyBDdXN0b21FdmVudDx7XG4gICAgICAgICAgICB9PjtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLnBhdGhzW3RoaXMucGF0aHMubGVuZ3RoIC0gMV0udHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBncmFwaE1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCAkbm9kZSA9IGN1c3RvbUV2ZW50LnRhcmdldCBhcyBHcmFwaE5vZGVFbGVtZW50O1xuICAgICAgICAgICAgaWYgKGluZm8uZ3JhcGguZXZlbnQgJiYgaW5mby5ncmFwaC5ldmVudC5vbkJsb2NrUmlnaHRDbGljaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gJGdyYXBoLmdldFByb3BlcnR5KCdub2RlcycpIGFzIHsgW3V1aWQ6IHN0cmluZ106IEJsb2NrRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbGluZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBMaW5lRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gJG5vZGUuZ2V0QXR0cmlidXRlKCdub2RlLXV1aWQnKSB8fCAnJztcbiAgICAgICAgICAgICAgICBjb25zdCBibG9jayA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbm9kZXMnKVt1dWlkXSBhcyBCbG9ja0RhdGE7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvY2tFdmVudCA9IG5ldyBCbG9ja01vdXNlRXZlbnQobm9kZXMsIGxpbmVzLCAkbm9kZSwgYmxvY2spO1xuICAgICAgICAgICAgICAgIGluZm8uZ3JhcGguZXZlbnQub25CbG9ja1JpZ2h0Q2xpY2soYmxvY2tFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRncmFwaC5hZGRFdmVudExpc3RlbmVyKCdub2RlLXNlbGVjdGVkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gdGhpcy5wYXRoc1t0aGlzLnBhdGhzLmxlbmd0aCAtIDFdLnR5cGU7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gZ3JhcGhNYXAuZ2V0KHR5cGUpO1xuICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgJG5vZGUgPSBldmVudC50YXJnZXQgYXMgR3JhcGhOb2RlRWxlbWVudDtcbiAgICAgICAgICAgIGlmIChpbmZvLmdyYXBoLmV2ZW50ICYmIGluZm8uZ3JhcGguZXZlbnQub25CbG9ja1NlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZXMgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ25vZGVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogQmxvY2tEYXRhOyB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gJGdyYXBoLmdldFByb3BlcnR5KCdsaW5lcycpIGFzIHsgW3V1aWQ6IHN0cmluZ106IExpbmVEYXRhOyB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IHV1aWQgPSAkbm9kZS5nZXRBdHRyaWJ1dGUoJ25vZGUtdXVpZCcpIHx8ICcnO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJsb2NrID0gJGdyYXBoLmdldFByb3BlcnR5KCdub2RlcycpW3V1aWRdIGFzIEJsb2NrRGF0YTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IG5ldyBCbG9ja0V2ZW50KG5vZGVzLCBsaW5lcywgJG5vZGUsIGJsb2NrKTtcbiAgICAgICAgICAgICAgICBpbmZvLmdyYXBoLmV2ZW50Lm9uQmxvY2tTZWxlY3RlZChldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkZ3JhcGguYWRkRXZlbnRMaXN0ZW5lcignbm9kZS11bnNlbGVjdGVkJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gdGhpcy5wYXRoc1t0aGlzLnBhdGhzLmxlbmd0aCAtIDFdLnR5cGU7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gZ3JhcGhNYXAuZ2V0KHR5cGUpO1xuICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgJG5vZGUgPSBldmVudC50YXJnZXQgYXMgR3JhcGhOb2RlRWxlbWVudDtcbiAgICAgICAgICAgIGlmIChpbmZvLmdyYXBoLmV2ZW50ICYmIGluZm8uZ3JhcGguZXZlbnQub25CbG9ja1Vuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbm9kZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBCbG9ja0RhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogTGluZURhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICRub2RlLmdldEF0dHJpYnV0ZSgnbm9kZS11dWlkJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvY2sgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ25vZGVzJylbdXVpZF0gYXMgQmxvY2tEYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEJsb2NrRXZlbnQobm9kZXMsIGxpbmVzLCAkbm9kZSwgYmxvY2spO1xuICAgICAgICAgICAgICAgIGluZm8uZ3JhcGguZXZlbnQub25CbG9ja1Vuc2VsZWN0ZWQoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJGdyYXBoLmFkZEV2ZW50TGlzdGVuZXIoJ2xpbmUtc2VsZWN0ZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLnBhdGhzW3RoaXMucGF0aHMubGVuZ3RoIC0gMV0udHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBncmFwaE1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCAkZyA9IGV2ZW50LnRhcmdldCBhcyBTVkdHRWxlbWVudDtcbiAgICAgICAgICAgIGlmIChpbmZvLmdyYXBoLmV2ZW50ICYmIGluZm8uZ3JhcGguZXZlbnQub25MaW5lU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbm9kZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBCbG9ja0RhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogTGluZURhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICRnLmdldEF0dHJpYnV0ZSgnbGluZS11dWlkJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW3V1aWRdIGFzIExpbmVEYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IExpbmVFdmVudChub2RlcywgbGluZXMsICRnLCBsaW5lKTtcbiAgICAgICAgICAgICAgICBpbmZvLmdyYXBoLmV2ZW50Lm9uTGluZVNlbGVjdGVkKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgICRncmFwaC5hZGRFdmVudExpc3RlbmVyKCdsaW5lLXVuc2VsZWN0ZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLnBhdGhzW3RoaXMucGF0aHMubGVuZ3RoIC0gMV0udHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBncmFwaE1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCAkZyA9IGV2ZW50LnRhcmdldCBhcyBTVkdHRWxlbWVudDtcbiAgICAgICAgICAgIGlmIChpbmZvLmdyYXBoLmV2ZW50ICYmIGluZm8uZ3JhcGguZXZlbnQub25MaW5lVW5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gJGdyYXBoLmdldFByb3BlcnR5KCdub2RlcycpIGFzIHsgW3V1aWQ6IHN0cmluZ106IEJsb2NrRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbGluZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBMaW5lRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gJGcuZ2V0QXR0cmlidXRlKCdsaW5lLXV1aWQnKSB8fCAnJztcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lID0gbGluZXNbdXVpZF0gYXMgTGluZURhdGE7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgTGluZUV2ZW50KG5vZGVzLCBsaW5lcywgJGcsIGxpbmUpO1xuICAgICAgICAgICAgICAgIGluZm8uZ3JhcGguZXZlbnQub25MaW5lVW5zZWxlY3RlZChldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkZ3JhcGguYWRkRXZlbnRMaXN0ZW5lcignbm9kZS1hZGRlZCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY0V2ZW50ID0gZXZlbnQgYXMgQ3VzdG9tRXZlbnQ8Tm9kZUNoYW5nZWREZXRhaWw+O1xuICAgICAgICAgICAgZGlzcGF0Y2godGhpcywgJ25vZGUtYWRkZWQnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBjRXZlbnQuZGV0YWlsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkaXNwYXRjaCh0aGlzLCAnZGlydHknKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRncmFwaC5hZGRFdmVudExpc3RlbmVyKCdub2RlLXJlbW92ZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNFdmVudCA9IGV2ZW50IGFzIEN1c3RvbUV2ZW50PE5vZGVDaGFuZ2VkRGV0YWlsPjtcbiAgICAgICAgICAgIGRpc3BhdGNoKHRoaXMsICdub2RlLXJlbW92ZWQnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBjRXZlbnQuZGV0YWlsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkaXNwYXRjaCh0aGlzLCAnZGlydHknKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRncmFwaC5hZGRFdmVudExpc3RlbmVyKCdub2RlLWNoYW5nZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNFdmVudCA9IGV2ZW50IGFzIEN1c3RvbUV2ZW50PE5vZGVDaGFuZ2VkRGV0YWlsPjtcbiAgICAgICAgICAgIGRpc3BhdGNoKHRoaXMsICdub2RlLWNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBjRXZlbnQuZGV0YWlsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkaXNwYXRjaCh0aGlzLCAnZGlydHknKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRncmFwaC5hZGRFdmVudExpc3RlbmVyKCdub2RlLXBvc2l0aW9uLWNoYW5nZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNFdmVudCA9IGV2ZW50IGFzIEN1c3RvbUV2ZW50PE5vZGVQb3NpdGlvbkNoYW5nZWREZXRhaWw+O1xuICAgICAgICAgICAgY29uc3QgcXVldWUgPSBjRXZlbnQuZGV0YWlsLm1vdmVMaXN0Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvY2tQb3NpdGlvbkFjdGlvbih7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrTmFtZTogaXRlbS5pZCxcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBpdGVtLnRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBpdGVtLnNvdXJjZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uUXVldWUuZXhlYyhxdWV1ZVswXSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHF1ZXVlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvblF1ZXVlLmV4ZWMobmV3IEFjdGlvbkxpc3Qoe1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZSxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaCh0aGlzLCAnZGlydHknLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgIGRpcnR5VHlwZTogJ3Bvc2l0aW9uLWNoYW5nZWQnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIC8vLy8gLy8vL1xuICAgICAgICAkZ3JhcGguc2hhZG93Um9vdC5hZGRFdmVudExpc3RlbmVyKCdkaXJ0eScsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY0V2ZW50ID0gZXZlbnQgYXMgQ3VzdG9tRXZlbnQ8RGlydHlEZXRhaWw+O1xuICAgICAgICAgICAgaWYgKGNFdmVudC5kZXRhaWwgJiYgY0V2ZW50LmRldGFpbC5hY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvblF1ZXVlLmV4ZWMoY0V2ZW50LmRldGFpbC5hY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGF0Y2godGhpcywgJ2RpcnR5Jywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogY0V2ZW50LmRldGFpbCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAkZ3JhcGguYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGdyYXBoTWFwLmdldCh0aGlzLnJvb3RHcmFwaCEudHlwZSk7XG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmJ1dHRvbiA9PT0gMiAmJiBpbmZvLmdyYXBoLmV2ZW50Py5vbkdyYXBoUmlnaHRDbGljaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gJGdyYXBoLmdldFByb3BlcnR5KCdub2RlcycpIGFzIHsgW3V1aWQ6IHN0cmluZ106IEJsb2NrRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbGluZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBMaW5lRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBncmFwaFBvc2l0aW9uID0gJGdyYXBoLmNvbnZlcnRDb29yZGluYXRlKGV2ZW50Lm9mZnNldFgsIGV2ZW50Lm9mZnNldFkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gbmV3IEdyYXBoTW91c2VFdmVudChub2RlcywgbGluZXMsICRncmFwaCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgY3VzdG9tRXZlbnQuaW5pdFBhZ2VQb3NpdGlvbihldmVudC5wYWdlWCwgZXZlbnQucGFnZVkpO1xuICAgICAgICAgICAgICAgIGN1c3RvbUV2ZW50LmluaXRHcmFwaFBvc2l0aW9uKGdyYXBoUG9zaXRpb24ueCwgZ3JhcGhQb3NpdGlvbi55KTtcbiAgICAgICAgICAgICAgICBpbmZvLmdyYXBoLmV2ZW50Lm9uR3JhcGhSaWdodENsaWNrKGN1c3RvbUV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgJGdyYXBoLmFkZEV2ZW50TGlzdGVuZXIoJ2xpbmUtYWRkZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbUVtZW50ID0gZXZlbnQgYXMgQ3VzdG9tRXZlbnQ8e2xpbmU6IExpbmVEYXRhfT47XG4gICAgICAgICAgICBjb25zdCAkbm9kZSA9ICRncmFwaC5xdWVyeU5vZGVFbGVtZW50KGN1c3RvbUVtZW50LmRldGFpbC5saW5lLm91dHB1dC5ub2RlKTtcbiAgICAgICAgICAgIGlmICgkbm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAkbm9kZS5vblVwZGF0ZSAmJiAkbm9kZS5vblVwZGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGF0Y2godGhpcywgJ2xpbmUtYWRkZWQnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBjdXN0b21FbWVudC5kZXRhaWwsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRpc3BhdGNoKHRoaXMsICdkaXJ0eScpO1xuICAgICAgICB9KTtcbiAgICAgICAgJGdyYXBoLmFkZEV2ZW50TGlzdGVuZXIoJ2xpbmUtcmVtb3ZlZCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tRW1lbnQgPSBldmVudCBhcyBDdXN0b21FdmVudDx7bGluZTogTGluZURhdGF9PjtcbiAgICAgICAgICAgIGNvbnN0ICRub2RlID0gJGdyYXBoLnF1ZXJ5Tm9kZUVsZW1lbnQoY3VzdG9tRW1lbnQuZGV0YWlsLmxpbmUub3V0cHV0Lm5vZGUpO1xuICAgICAgICAgICAgaWYgKCRub2RlKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICRub2RlLm9uVXBkYXRlICYmICRub2RlLm9uVXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXNwYXRjaCh0aGlzLCAnbGluZS1yZW1vdmVkJywge1xuICAgICAgICAgICAgICAgIGRldGFpbDogY3VzdG9tRW1lbnQuZGV0YWlsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkaXNwYXRjaCh0aGlzLCAnZGlydHknKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRncmFwaC5hZGRFdmVudExpc3RlbmVyKCdsaW5lLWNoYW5nZWQnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbUVsZW1lbnQgPSBldmVudCBhcyBDdXN0b21FdmVudDx7bGluZTogTGluZURhdGF9PjtcbiAgICAgICAgICAgIGRpc3BhdGNoKHRoaXMsICdsaW5lLWNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBjdXN0b21FbGVtZW50LmRldGFpbCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGlzcGF0Y2godGhpcywgJ2RpcnR5Jyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRncmFwaC5hZGRFdmVudExpc3RlbmVyKCdub2RlLWNvbm5lY3RlZCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tRWxlbWVudCA9IGV2ZW50IGFzIEN1c3RvbUV2ZW50PHtsaW5lOiBMaW5lRGF0YX0+O1xuICAgICAgICAgICAgdGhpcy5zdGFydFJlY29yZGluZygpO1xuICAgICAgICAgICAgdGhpcy5hZGRMaW5lKGN1c3RvbUVsZW1lbnQuZGV0YWlsLmxpbmUpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wUmVjb3JkaW5nKCk7XG4gICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCAkc3ZnID0gJGdyYXBoLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvcignI2xpbmVzJykhO1xuICAgICAgICBmdW5jdGlvbiBzZWFyY2hHKGh0bWxBcnJheTogKEhUTUxFbGVtZW50IHwgU1ZHR0VsZW1lbnQpW10pIHtcbiAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IE1hdGgubWluKGh0bWxBcnJheS5sZW5ndGgsIDQpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0ICRlbGVtID0gaHRtbEFycmF5W2ldO1xuICAgICAgICAgICAgICAgIC8vIOWmguaenOaJvuWIsOmhtumDqOeahCBkb2N1bWVudCDlhYPntKDnmoTor53vvIzmmK/msqHmnIkgdGFnTmFtZSDnmoRcbiAgICAgICAgICAgICAgICBpZiAoJGVsZW0udGFnTmFtZSAmJiAkZWxlbS50YWdOYW1lLnRvTG9jYWxlTG93ZXJDYXNlKCkgPT09ICdnJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGVsZW0gYXMgU1ZHR0VsZW1lbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICRzdmcuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGNvbnN0ICRnID0gc2VhcmNoRyhldmVudC5wYXRoKTtcbiAgICAgICAgICAgIGlmICghJGcgfHwgISRnLmhhc0F0dHJpYnV0ZSgnbGluZS11dWlkJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gdGhpcy5wYXRoc1t0aGlzLnBhdGhzLmxlbmd0aCAtIDFdLnR5cGU7XG4gICAgICAgICAgICBjb25zdCBpbmZvID0gZ3JhcGhNYXAuZ2V0KHR5cGUpO1xuICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGluZm8uZ3JhcGguZXZlbnQgJiYgaW5mby5ncmFwaC5ldmVudC5vbkxpbmVEYmxDbGljaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVzID0gJGdyYXBoLmdldFByb3BlcnR5KCdub2RlcycpIGFzIHsgW3V1aWQ6IHN0cmluZ106IEJsb2NrRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbGluZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBMaW5lRGF0YTsgfTtcbiAgICAgICAgICAgICAgICBjb25zdCB1dWlkID0gJGcuZ2V0QXR0cmlidXRlKCdsaW5lLXV1aWQnKSB8fCAnJztcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lID0gbGluZXNbdXVpZF0gYXMgTGluZURhdGE7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgTGluZU1vdXNlRXZlbnQobm9kZXMsIGxpbmVzLCAkZywgbGluZSk7XG4gICAgICAgICAgICAgICAgaW5mby5ncmFwaC5ldmVudC5vbkxpbmVEYmxDbGljayhldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAkc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCAkZyA9IHNlYXJjaEcoZXZlbnQucGF0aCk7XG4gICAgICAgICAgICBpZiAoISRnIHx8ICEkZy5oYXNBdHRyaWJ1dGUoJ2xpbmUtdXVpZCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdHlwZSA9IHRoaXMucGF0aHNbdGhpcy5wYXRocy5sZW5ndGggLSAxXS50eXBlO1xuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGdyYXBoTWFwLmdldCh0eXBlKTtcbiAgICAgICAgICAgIGlmICghaW5mbykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbmZvLmdyYXBoLmV2ZW50ICYmIGluZm8uZ3JhcGguZXZlbnQub25MaW5lQ2xpY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbm9kZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBCbG9ja0RhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogTGluZURhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICRnLmdldEF0dHJpYnV0ZSgnbGluZS11dWlkJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW3V1aWRdIGFzIExpbmVEYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IExpbmVNb3VzZUV2ZW50KG5vZGVzLCBsaW5lcywgJGcsIGxpbmUpO1xuICAgICAgICAgICAgICAgIGluZm8uZ3JhcGguZXZlbnQub25MaW5lQ2xpY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJHN2Zy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCAkZyA9IHNlYXJjaEcoZXZlbnQucGF0aCk7XG4gICAgICAgICAgICBpZiAoISRnIHx8ICEkZy5oYXNBdHRyaWJ1dGUoJ2xpbmUtdXVpZCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKChldmVudCBhcyBNb3VzZUV2ZW50KS5idXR0b24gIT09IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSB0aGlzLnBhdGhzW3RoaXMucGF0aHMubGVuZ3RoIC0gMV0udHlwZTtcbiAgICAgICAgICAgIGNvbnN0IGluZm8gPSBncmFwaE1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpZiAoIWluZm8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaW5mby5ncmFwaC5ldmVudCAmJiBpbmZvLmdyYXBoLmV2ZW50Lm9uTGluZVJpZ2h0Q2xpY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlcyA9ICRncmFwaC5nZXRQcm9wZXJ0eSgnbm9kZXMnKSBhcyB7IFt1dWlkOiBzdHJpbmddOiBCbG9ja0RhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogTGluZURhdGE7IH07XG4gICAgICAgICAgICAgICAgY29uc3QgdXVpZCA9ICRnLmdldEF0dHJpYnV0ZSgnbGluZS11dWlkJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW3V1aWRdIGFzIExpbmVEYXRhO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IExpbmVNb3VzZUV2ZW50KG5vZGVzLCBsaW5lcywgJGcsIGxpbmUpO1xuICAgICAgICAgICAgICAgIGluZm8uZ3JhcGguZXZlbnQub25MaW5lUmlnaHRDbGljayhldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3VwZGF0ZUdyYXBoKCkge1xuICAgICAgICBjbGVhckR5bmFtaWNFbnVtKCk7XG4gICAgICAgIGNvbnN0IGdyYXBoID0gdGhpcy5wYXRoc1t0aGlzLnBhdGhzLmxlbmd0aCAtIDFdO1xuICAgICAgICBjb25zdCAkZ3JhcGggPSB0aGlzLnNoYWRvd1Jvb3QhLnF1ZXJ5U2VsZWN0b3IoJ3YtZ3JhcGgnKSEgYXMgR3JhcGhFbGVtZW50O1xuICAgICAgICAkZ3JhcGguY2xlYXIoKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgICAgICAgICRncmFwaC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCBncmFwaC50eXBlKTtcbiAgICAgICAgICAgICRncmFwaC5zZXRQcm9wZXJ0eSgnbGluZXMnLCBncmFwaC5saW5lcyk7XG4gICAgICAgICAgICAkZ3JhcGguc2V0UHJvcGVydHkoJ25vZGVzJywgZ3JhcGgubm9kZXMpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlSGVhZGVyKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyB1bmRvKCkge1xuICAgICAgICB0aGlzLmFjdGlvblF1ZXVlLnVuZG8oKTtcbiAgICAgICAgZGlzcGF0Y2godGhpcywgJ3VuZG8nKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVkbygpIHtcbiAgICAgICAgdGhpcy5hY3Rpb25RdWV1ZS5yZWRvKCk7XG4gICAgICAgIGRpc3BhdGNoKHRoaXMsICdyZWRvJyk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXJ0UmVjb3JkaW5nKCkge1xuICAgICAgICB0aGlzLmFjdGlvblF1ZXVlLnN0YXJ0UmVjb3JkaW5nKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3BSZWNvcmRpbmcoKSB7XG4gICAgICAgIHRoaXMuYWN0aW9uUXVldWUuc3RvcFJlY29yZGluZygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQaW5FbGVtZW50KGJsb2NrTmFtZTogc3RyaW5nLCB0eXBlOiAnaW5wdXQnIHwgJ291dHB1dCcsIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgJGJsb2NrID0gdGhpcy4kZ3JhcGguc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKGB2LWdyYXBoLW5vZGVbbm9kZS11dWlkPSR7YmxvY2tOYW1lfV1gKTtcbiAgICAgICAgaWYgKCEkYmxvY2spIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCAkcGluTGlzdCA9ICRibG9jay5zaGFkb3dSb290IS5xdWVyeVNlbGVjdG9yQWxsKGAucGluLmluYCk7XG4gICAgICAgIGNvbnN0ICRwaW4gPSAkcGluTGlzdFtpbmRleF07XG4gICAgICAgIHJldHVybiAkcGluO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRCbG9ja0VsZW1lbnQoYmxvY2tOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJGdyYXBoLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3Rvcihgdi1ncmFwaC1ub2RlW25vZGUtdXVpZD0ke2Jsb2NrTmFtZX1dYCkgYXMgR3JhcGhOb2RlRWxlbWVudDtcbiAgICB9XG5cbiAgICAvLy8gLS0tLSDmk43kvZzmlbTkuKrlm75cblxuICAgIC8qKlxuICAgICAqIOWwhuWxj+W5leWdkOagh+i9rOaNouaIkCBHcmFwaCDlhoXnmoTlnZDmoIdcbiAgICAgKiBAcGFyYW0gcG9pbnRcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGNvbnZlcnRDb29yZGluYXRlKHBvaW50OiB7IHg6IG51bWJlciwgeTogbnVtYmVyIH0pIHtcbiAgICAgICAgcG9pbnQgPSB0aGlzLiRncmFwaC5jb252ZXJ0Q29vcmRpbmF0ZShwb2ludC54LCBwb2ludC55KTtcbiAgICAgICAgcmV0dXJuIHBvaW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9rue8lui+keeahOagueWbvlxuICAgICAqIEBwYXJhbSBncmFwaFxuICAgICAqL1xuICAgIHNldFJvb3RHcmFwaChncmFwaDogR3JhcGhEYXRhKSB7XG4gICAgICAgIHRoaXMucm9vdEdyYXBoID0gZ3JhcGg7XG4gICAgICAgIHRoaXMucGF0aHMgPSBbZ3JhcGhdO1xuICAgICAgICB0aGlzLl91cGRhdGVHcmFwaCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluato+WcqOe8lui+keeahOagueWbvlxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZ2V0Um9vdEdyYXBoKCk6IEdyYXBoRGF0YSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhzWzBdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS8oOWFpeS4gOS4quWtl+espuS4su+8jOWPjeW6j+WIl+WMluaIkOWbvuaVsOaNrlxuICAgICAqIEBwYXJhbSBjb250ZW50XG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBkZXNlcmlhbGl6ZShjb250ZW50OiBzdHJpbmcpOiBHcmFwaERhdGEge1xuICAgICAgICBjb25zdCBncmFwaERhdGEgPSB5YW1sLmxvYWQoY29udGVudCkgYXMgR3JhcGhEYXRhO1xuICAgICAgICByZXR1cm4gZ3JhcGhEYXRhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOS8oOWFpeS4gOS4quWbvuaVsOaNru+8jOW6j+WIl+WMluaIkCB5YW1sIOWtl+espuS4slxuICAgICAqIEBwYXJhbSBkYXRhXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBzZXJpYWxpemUoZGF0YT86IEdyYXBoRGF0YSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHN0ciA9IHlhbWwuZHVtcChkYXRhIHx8IHRoaXMucGF0aHNbMF0pO1xuICAgICAgICAvLyByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5wYXRoc1swXSk7XG4gICAgICAgIC8vIG91dHB1dEZpbGVTeW5jKCcvVXNlcnMvd2FuZ3NpamllL1Byb2plY3QvQ3JlYXRvci9jb2Nvcy1lZGl0b3IvZXh0ZW5zaW9uLXJlcG9zL3NoYWRlci1ncmFwaC90ZXN0LnlhbWwnLCBzdHIpO1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluaVtOS4quWbvueOsOWcqOeahOS4gOS6m+WfuuehgOaVsOaNrlxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZ2V0R3JhcGhJbmZvKCkge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLiRncmFwaC5nZXRQcm9wZXJ0eSgnb2Zmc2V0Jyk7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gdGhpcy4kZ3JhcGguZ2V0UHJvcGVydHkoJ3NjYWxlJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBvZmZzZXQsIHNjYWxlLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruaVtOS4quWbvueahOS4gOS6m+WfuuehgOaVsOaNrlxuICAgICAqIEBwYXJhbSBpbmZvXG4gICAgICovXG4gICAgc2V0R3JhcGhJbmZvKGluZm86IHsgb2Zmc2V0OiB7IHg6IG51bWJlciwgeTogbnVtYmVyLCB9LCBzY2FsZTogbnVtYmVyfSkge1xuICAgICAgICB0aGlzLiRncmFwaC5zZXRQcm9wZXJ0eSgnb2Zmc2V0JywgaW5mby5vZmZzZXQpO1xuICAgICAgICB0aGlzLiRncmFwaC5zZXRQcm9wZXJ0eSgnc2NhbGUnLCBpbmZvLnNjYWxlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDmgaLlpI3nvKnmlL7mr5TkvotcbiAgICAgKi9cbiAgICB6b29tVG9GaXQoKSB7XG4gICAgICAgIHRoaXMuJGdyYXBoLmRhdGEuc2V0UHJvcGVydHkoJ3NjYWxlJywgMSk7XG4gICAgfVxuXG4gICAgLy8vIC0tLS0g5pON5L2c5b2T5YmN5Zu+XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bpgInkuK3nmoQgQmxvY2sg5YiX6KGoXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBnZXRTZWxlY3RlZEJsb2NrTGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJGdyYXBoLmdldFNlbGVjdGVkTm9kZUxpc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDojrflj5bpgInkuK3nmoQgTGluZSDliJfooahcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIGdldFNlbGVjdGVkTGluZUxpc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRncmFwaC5nZXRTZWxlY3RlZExpbmVMaXN0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6+572u5b2T5YmN5q2j5Zyo57yW6L6R55qE5Zu+5pWw5o2uXG4gICAgICogQHBhcmFtIGdyYXBoXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBzZXRDdXJyZW50R3JhcGgoZ3JhcGg6IEdyYXBoRGF0YSkge1xuICAgICAgICBpZiAodGhpcy5wYXRocy5sZW5ndGggPD0gMSkge1xuICAgICAgICAgICAgdGhpcy5zZXRSb290R3JhcGgoZ3JhcGgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGF0aHNbdGhpcy5wYXRocy5sZW5ndGggLSAxXSA9IGdyYXBoO1xuICAgICAgICB0aGlzLl91cGRhdGVHcmFwaCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiOt+WPluato+WcqOe8lui+keeahOWbvuaVsOaNrlxuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgZ2V0Q3VycmVudEdyYXBoKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXRoc1t0aGlzLnBhdGhzLmxlbmd0aCAtIDFdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWcqOW9k+WJjeato+WcqOaTjeS9nOeahOWbvuaVsOaNrumHjOWinuWKoOS4gOS4qiBCbG9ja1xuICAgICAqIEBwYXJhbSBibG9ja1xuICAgICAqIEBwYXJhbSBpZFxuICAgICAqL1xuICAgIGFkZEJsb2NrKGJsb2NrOiBCbG9ja0RhdGEsIGlkPzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuYWN0aW9uUXVldWUuZXhlYyhuZXcgQWRkQmxvY2tBY3Rpb24oeyBibG9jaywgaWQgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWcqOW9k+WJjeato+WcqOaTjeS9nOeahOWbvuaVsOaNrumHjOWIoOmZpOS4gOS4quiKgueCuVxuICAgICAqIEBwYXJhbSBpZFxuICAgICAqL1xuICAgIHJlbW92ZUJsb2NrKGlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcXVldWU6IEFjdGlvbltdID0gW107XG4gICAgICAgIC8vIHJlbW92ZSBsaW5lXG4gICAgICAgIGNvbnN0IGxpbmVzID0gdGhpcy4kZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykgYXMgeyBbdXVpZDogc3RyaW5nXTogTGluZURhdGE7IH07XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGxpbmVzKSB7XG4gICAgICAgICAgICBjb25zdCBsaW5lID0gbGluZXNba2V5XSBhcyBMaW5lRGF0YTtcbiAgICAgICAgICAgIGlmIChsaW5lLmlucHV0Lm5vZGUgPT09IGlkIHx8IGxpbmUub3V0cHV0Lm5vZGUgPT09IGlkKSB7XG4gICAgICAgICAgICAgICAgcXVldWUucHVzaChuZXcgUmVtb3ZlTGluZUFjdGlvbih7IGlkOiBrZXkgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlLnB1c2gobmV3IFJlbW92ZUJsb2NrQWN0aW9uKHsgaWQgfSkpO1xuICAgICAgICB0aGlzLmFjdGlvblF1ZXVlLmV4ZWMobmV3IEFjdGlvbkxpc3Qoe1xuICAgICAgICAgICAgcXVldWUsXG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlnKjlvZPliY3mraPlnKjmk43kvZznmoTlm77mlbDmja7ph4zlop7liqDkuIDkuKrov57nur9cbiAgICAgKiBAcGFyYW0gbGluZVxuICAgICAqIEBwYXJhbSBpZFxuICAgICAqL1xuICAgIGFkZExpbmUobGluZTogTGluZURhdGEsIGlkPzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuYWN0aW9uUXVldWUuZXhlYyhuZXcgQWRkTGluZUFjdGlvbih7IGxpbmUsIGlkIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiDlnKjlvZPliY3mraPlnKjmk43kvZznmoTlm77mlbDmja7ph4zliKDpmaTkuIDkuKrov57nur9cbiAgICAgKiBAcGFyYW0gaWRcbiAgICAgKi9cbiAgICByZW1vdmVMaW5lKGlkOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5hY3Rpb25RdWV1ZS5leGVjKG5ldyBSZW1vdmVMaW5lQWN0aW9uKHsgaWQgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOi/m+WFpeW9k+WJjeWbvueahOWtkOWbvlxuICAgICAqIEBwYXJhbSBpZFxuICAgICAqL1xuICAgIGVudGVyU3ViR3JhcGgoaWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBncmFwaCA9IHRoaXMucGF0aHNbdGhpcy5wYXRocy5sZW5ndGggLSAxXTtcbiAgICAgICAgY29uc3Qgc3ViR3JhcGggPSBncmFwaC5ncmFwaHNbaWRdO1xuICAgICAgICBpZiAoc3ViR3JhcGgpIHtcbiAgICAgICAgICAgIHRoaXMucGF0aHMucHVzaChzdWJHcmFwaCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVHcmFwaCgpO1xuICAgICAgICB9XG4gICAgICAgIGRpc3BhdGNoKHRoaXMsICdlbnRlci1ncmFwaCcsIHtcbiAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgIGlkOiBpZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOWcqOW9k+WJjee8lui+keeahOWbvumHjOWinuWKoOS4gOS4quWtkOWbvlxuICAgICAqIEBwYXJhbSB0eXBlXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBhZGRTdWJHcmFwaCh0eXBlOiBzdHJpbmcsIGlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgaW5mbyA9IHRoaXMucGF0aHNbdGhpcy5wYXRocy5sZW5ndGggLSAxXTtcbiAgICAgICAgLy8gY29uc3QgdXVpZCA9IGdlbmVyYXRlVVVJRCgpO1xuICAgICAgICBpbmZvLmdyYXBoc1tpZF0gPSB7XG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgbmFtZTogdHlwZSxcbiAgICAgICAgICAgIG5vZGVzOiB7fSxcbiAgICAgICAgICAgIGxpbmVzOiB7fSxcbiAgICAgICAgICAgIGdyYXBoczoge30sXG4gICAgICAgIH0gYXMgR3JhcGhEYXRhO1xuXG4gICAgICAgIHJldHVybiBpbmZvLmdyYXBoc1tpZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog5Zyo5b2T5YmN57yW6L6R55qE5Zu+6YeM77yM5Yig6Zmk5LiA5Liq5a2Q5Zu+XG4gICAgICogQHBhcmFtIGlkXG4gICAgICovXG4gICAgcmVtb3ZlU3ViR3JhcGgoaWQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBpbmZvID0gdGhpcy5wYXRoc1t0aGlzLnBhdGhzLmxlbmd0aCAtIDFdO1xuICAgICAgICBkZWxldGUgaW5mby5ncmFwaHNbaWRdO1xuICAgIH1cbn1cblxuaWYgKCF3aW5kb3cuY3VzdG9tRWxlbWVudHMuZ2V0KCd1aS1ncmFwaC1mb3JnZScpKSB7XG4gICAgd2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndWktZ3JhcGgtZm9yZ2UnLCBIVE1MR3JhcGhGb3JnZUVsZW1lbnQpO1xufVxuIl19