'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceDeclareBlock = exports.unDeclareBlock = exports.declareBlock = exports.removeDeclareBlock = exports.getDeclareBlock = exports.hasDeclareBlock = exports.generateBlockOption = exports.blockMap = void 0;
const ui_graph_1 = require("@itharbors/ui-graph");
const utils_1 = require("./utils");
const pin_1 = require("./pin");
// import { unregisterNode } from '@itharbors/ui-graph/dist/manager';
exports.blockMap = new Map();
/**
 * Block 元素更新的一些工具方法
 * 一般是传入元素 + 数据，更新元素内的一些 HTML 对象
 */
const BlockElementUtils = {
    /**
     * 更新 Block 元素的 title
     * @param elem
     * @param blockDesc
     * @param details
     */
    updateTitle(elem, blockDesc, details) {
        const title = blockDesc.title || details.title || 'Unknown';
        elem.shadowRoot.querySelector(`.title ui-label`).innerHTML = title;
    },
    /**
     * 更新 Block 元素的 icon
     * @param elem
     * @param blockDesc
     * @returns
     */
    updateIcon(elem, blockDesc) {
        const feature = blockDesc.feature || {};
        const icon = feature.icon;
        if (!icon) {
            return;
        }
        const $icon = elem.shadowRoot.querySelector(`.title ui-icon`);
        $icon.removeAttribute('hidden');
        $icon.setAttribute('value', icon);
    },
    /**
     * 更新 Block 元素是否可进入的图标显示状态
     * @param elem
     * @param blockDesc
     */
    updateCollapsed(elem, blockDesc) {
        const feature = blockDesc.feature || {};
        const isCollapsed = feature.isCollapsedBlock;
        const $svg = elem.shadowRoot.querySelector(`.title svg`);
        if (isCollapsed) {
            $svg.removeAttribute('hidden');
        }
        else {
            $svg.setAttribute('hidden', '');
        }
    },
    /**
     * 更新元素展开折叠的状态
     * @param elem
     * @param blockDesc
     * @param details
     */
    updateExpand(elem, blockDesc, details) {
        if (blockDesc.inputPins.length > 0 || blockDesc.outputPins.length > 0) {
            elem.setAttribute('expand', '');
        }
        else {
            elem.removeAttribute('expand');
        }
    },
};
/**
 * 创建一个专用的节点渲染对象
 *
 * @returns
 * @param blockDesc
 */
function generateBlockOption(blockDesc) {
    blockDesc.style = blockDesc.style || {};
    blockDesc.feature = blockDesc.feature || {};
    const showQuickConnectPoint = !!blockDesc.feature.showQuickConnectPoint;
    return {
        template: /*html*/ `
<section class="wrapper">
    <header class="title">
        <div>
            <ui-icon hidden></ui-icon>
            <ui-label></ui-label>
            <svg hidden viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M1 13L8 3L15 13H1Z"></path></svg>
        </div>
        ${showQuickConnectPoint ? '<div hidden class="quick-connect" name="t"></div' : ''}
    </header>
    <section class="content"></section>
</section>
        `,
        style: `${STYLE.host(blockDesc)}${STYLE.header(blockDesc)}${STYLE.pin(blockDesc)}`,
        /**
         * 初始化的时候设置一些事件和 HTML
         * @param this
         * @param details
         */
        onInit(details) {
            // 设置 title 可拖拽
            const $title = this.shadowRoot.querySelector('header.title');
            $title.addEventListener('mousedown', (event) => {
                event.stopPropagation();
                event.preventDefault();
                if (!this.hasAttribute('selected')) {
                    if (!event.metaKey && !event.ctrlKey) {
                        this.clearOtherSelected();
                    }
                    this.select({
                        clearLines: false,
                        clearNodes: false,
                    });
                }
                this.startMove();
            });
            // 绑定快速连接点的事件
            const $param = this.shadowRoot.querySelector(`.quick-connect`);
            $param && $param.addEventListener('mousedown', () => {
                this.startConnect('straight');
            });
            // 绑定元素点击开始连接的事件
            if (blockDesc.inputPins.length === 0 && blockDesc.outputPins.length === 0) {
                this.addEventListener('mousedown', (event) => {
                    if (event.button === 0 && this.hasConnect()) {
                        event.stopPropagation();
                        event.preventDefault();
                        this.startConnect('straight');
                    }
                }, true);
            }
            this.addEventListener('dblclick', (event) => {
                // event.stopPropagation();
                // event.preventDefault();
                const customEvent = new CustomEvent('block-dblclick', {
                    bubbles: true,
                    cancelable: true,
                    detail: {
                        pageX: event.pageX,
                        pageY: event.pageY,
                        offsetX: event.offsetX,
                        offsetY: event.offsetY,
                    },
                });
                this.dispatchEvent(customEvent);
            });
            this.addEventListener('click', (event) => {
                const custom = new CustomEvent('block-click', {
                    bubbles: true,
                    cancelable: true,
                    detail: {},
                });
                this.dispatchEvent(custom);
            });
            this.addEventListener('mouseup', (event) => {
                if (event.button !== 2) {
                    return;
                }
                const custom = new CustomEvent('block-right-click', {
                    bubbles: true,
                    cancelable: true,
                    detail: {},
                });
                this.dispatchEvent(custom);
            });
            this.data.addPropertyListener('selected', (selected, legacySelected) => {
                if (selected === legacySelected) {
                    return;
                }
                if (selected) {
                    const custom = new CustomEvent('block-selected', {
                        bubbles: true,
                        cancelable: true,
                        detail: {},
                    });
                    this.dispatchEvent(custom);
                }
                else {
                    const custom = new CustomEvent('block-unselected', {
                        bubbles: true,
                        cancelable: true,
                        detail: {},
                    });
                    this.dispatchEvent(custom);
                }
            });
        },
        onUpdate(details) {
            // 更新 title
            BlockElementUtils.updateTitle(this, blockDesc, details);
            // 更新 icon
            BlockElementUtils.updateIcon(this, blockDesc);
            // 更新折叠图标
            BlockElementUtils.updateCollapsed(this, blockDesc);
            // 更新折叠状态
            BlockElementUtils.updateExpand(this, blockDesc, details);
            // 数据更新后，更新对应的资源
            // this.data.addPropertyListener('details', (details) => {
            //     updateHTML(details.label);
            // });
            // 生成针脚
            const $content = this.shadowRoot.querySelector('.content');
            $content.innerHTML = '';
            if (blockDesc.createDynamicOutputPins) {
                const outputList = blockDesc.createDynamicOutputPins(blockDesc, details);
                outputList.forEach((pin, index) => {
                    return $content?.appendChild((0, pin_1.generateOutputPinHTML)(pin, details.outputPins[index]));
                });
            }
            else {
                blockDesc.outputPins.forEach((pin, index) => {
                    return $content?.appendChild((0, pin_1.generateOutputPinHTML)(pin, details.outputPins[index]));
                });
            }
            const $graph = this.getRootNode().host;
            const uuid = this.getAttribute('node-uuid');
            if (blockDesc.createDynamicInputPins) {
                const inputList = blockDesc.createDynamicInputPins(blockDesc, details);
                inputList.forEach((pin, index) => {
                    return $content?.appendChild((0, pin_1.generateInputPinHTML)(pin, details.inputPins, index, uuid, $graph.getProperty('lines')));
                });
            }
            else {
                blockDesc.inputPins.forEach((pin, index) => {
                    return $content?.appendChild((0, pin_1.generateInputPinHTML)(pin, details.inputPins, index, uuid, $graph.getProperty('lines')));
                });
            }
            // 绑定参数连接点的事件
            const $paramList = this.shadowRoot.querySelectorAll(`v-graph-node-param`);
            Array.prototype.forEach.call($paramList, ($param) => {
                $param.addEventListener('mousedown', (event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    const name = $param.getAttribute('name');
                    if (!name) {
                        return;
                    }
                    const paramDirection = $param.getAttribute('direction');
                    if (paramDirection !== 'input' && paramDirection !== 'output') {
                        return;
                    }
                    this.startConnect('curve', name, paramDirection);
                });
            });
        },
    };
}
exports.generateBlockOption = generateBlockOption;
const STYLE = {
    host(block) {
        const config = block.style || {};
        return /*css*/ `
:host *[hidden] {
    display: none;
}
:host {
    --font-color: ${config.fontColor || '#ccc'};
    --font-color-hover: ${config.fontHoverColor || config.fontColor || '#ccc'};
    --border-color: ${config.borderColor || 'white'};
    --border-color-hover: ${config.borderHoverColor || config.borderColor || 'white'};
    --shadow-color: ${config.shadowColor || '#ccc'};
    --shadow-color-hover: ${config.shadowHoverColor || config.shadowColor || '#ccc'};
    --background-color: ${config.backgroundColor || '#2b2b2bcc'};
    --border-radius: 2px;

    --header-height: 24px;
    --header-background: ${config.headerColor || '#2b2b2bcc'};

    --pin-height: 24px;

    width: 200px;

    color: var(--font-color);
    cursor: default;

}
:host > section.wrapper {
    margin: 10px;
}
:host(:hover) > section.wrapper, :host([selected]) > section.wrapper {
    border-color: var(--border-color-hover);
    color: var(--font-color-hover);
    box-shadow: 0px 0px 7px 2px var(--shadow-color-hover);
}
section.wrapper {
    position: relative;
    border-radius: var(--border-radius); 
    background: var(--background-color);
    box-shadow: 0px 0px 7px 2px none;
}
:host(:hover) > section.wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    border-radius: var(--border-radius); 
    box-shadow: 0px 0px 0px 1px var(--shadow-color-hover) inset;
    pointer-events: none;
}
`;
    },
    header(block) {
        const config = block.style || {};
        return /*css*/ `
header.title {
    line-height: var(--header-height);

    text-align: center;
    border-radius: var(--border-radius);

    ${config.secondaryColor ? `background: ${config.secondaryColor}; padding-left: 6px;` : ''}
}
header.title > div {
    padding: 0 10px;
    height: 24px;
    border-radius: var(--border-radius);
    display: flex;
    background: var(--header-background);
}
:host([expand]) header.title > div {
    border-radius: var(--border-radius) var(--border-radius) 0 0;
}
header.title > div > ui-label {
    display: block;
    padding: 0 10px;
}
header.title > div > ui-icon {
    display: block;
}
header.title > div > svg {
    fill: white;
    display: block;
    width: 10px;
    transform: rotate(90deg);
}
header.title > .quick-connect {
    display: block;
    padding: 0;
    width: 12px;
    height: 12px;
    border-radius: 6px;
    background: white;
    position: absolute;
    right: -6px;
    top: 50%;
    margin-top: -6px;
    opacity: 0;
    transition: opacity 0.3s;
}
:host(:hover) header.title > .quick-connect {
    display: block;
    opacity: 1;
}
        `;
    },
    pin: pin_1.generateStyle,
};
function hasDeclareBlock(type) {
    return exports.blockMap.has(type);
}
exports.hasDeclareBlock = hasDeclareBlock;
function getDeclareBlock(type) {
    return exports.blockMap.get(type);
}
exports.getDeclareBlock = getDeclareBlock;
function removeDeclareBlock(type) {
    const graph = '*';
    const unknownOption = (0, ui_graph_1.queryNode)(graph, 'unknown');
    (0, ui_graph_1.registerNode)(graph, type, unknownOption);
    exports.blockMap.delete(type);
}
exports.removeDeclareBlock = removeDeclareBlock;
// @ts-ignore
window.removeDeclareBlock = removeDeclareBlock;
/**
 * 注册一个 block 类型
 * @param block
 * @returns
 */
function declareBlock(block) {
    const graph = '*';
    // if (blockMap.has(block.type)) {
    //     console.warn(`Cannot declare duplicate block types: ${block.type}`);
    //     return;
    // }
    // 合并 extend 数据
    if (block.extend) {
        const extend = exports.blockMap.get(block.extend);
        if (!extend) {
            console.warn(`Inheritance data not found: ${block.extend}`);
        }
        else {
            (0, utils_1.completeBlockTarget)(block, extend);
        }
    }
    const options = generateBlockOption(block);
    (0, ui_graph_1.registerNode)(graph, block.type, options);
    exports.blockMap.set(block.type, block);
}
exports.declareBlock = declareBlock;
function unDeclareBlock(type) {
    const graph = '*';
    // TODO 需要删除底层 block 节点
    // unregisterNode(graph, type);
    exports.blockMap.delete(type);
}
exports.unDeclareBlock = unDeclareBlock;
function replaceDeclareBlock(searchType, block) {
    if (exports.blockMap.has(searchType)) {
        unDeclareBlock(searchType);
    }
    declareBlock(block);
}
exports.replaceDeclareBlock = replaceDeclareBlock;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYmxvY2stZm9yZ2UvYmxvY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7QUFJYixrREFBOEQ7QUFFOUQsbUNBQThDO0FBRTlDLCtCQUF1RztBQUN2RyxxRUFBcUU7QUFFeEQsUUFBQSxRQUFRLEdBQW1DLElBQUksR0FBRyxFQUFFLENBQUM7QUFFbEU7OztHQUdHO0FBQ0gsTUFBTSxpQkFBaUIsR0FBRztJQUN0Qjs7Ozs7T0FLRztJQUNILFdBQVcsQ0FBQyxJQUFzQixFQUFFLFNBQTRCLEVBQUUsT0FBK0I7UUFDN0YsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQztRQUM1RCxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBRSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDeEUsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsVUFBVSxDQUFDLElBQXNCLEVBQUUsU0FBNEI7UUFDM0QsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDeEMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztRQUMxQixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTztTQUNWO1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUUsQ0FBQztRQUMvRCxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsZUFBZSxDQUFDLElBQXNCLEVBQUUsU0FBNEI7UUFDaEUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9B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IEdyYXBoTm9kZUVsZW1lbnQgfSBmcm9tICdAaXRoYXJib3JzL3VpLWdyYXBoL2Rpc3QvZWxlbWVudC9ncmFwaC1ub2RlJztcbmltcG9ydCB0eXBlIHsgR3JhcGhFbGVtZW50IH0gZnJvbSAnQGl0aGFyYm9ycy91aS1ncmFwaC9kaXN0L2VsZW1lbnQvZ3JhcGgnO1xuaW1wb3J0IHsgcmVnaXN0ZXJOb2RlLCBxdWVyeU5vZGUgfSBmcm9tICdAaXRoYXJib3JzL3VpLWdyYXBoJztcbmltcG9ydCB0eXBlIHsgSVBpbkRlc2NyaXB0aW9uLCBJQmxvY2tEZXNjcmlwdGlvbiB9IGZyb20gJy4vaW50ZXJmYWNlJztcbmltcG9ydCB7IGNvbXBsZXRlQmxvY2tUYXJnZXQgfSBmcm9tICcuL3V0aWxzJztcblxuaW1wb3J0IHsgZ2VuZXJhdGVPdXRwdXRQaW5IVE1MLCBnZW5lcmF0ZUlucHV0UGluSFRNTCwgZ2VuZXJhdGVTdHlsZSBhcyBnZW5lcmF0ZVBpblN0eWxlIH0gZnJvbSAnLi9waW4nO1xuLy8gaW1wb3J0IHsgdW5yZWdpc3Rlck5vZGUgfSBmcm9tICdAaXRoYXJib3JzL3VpLWdyYXBoL2Rpc3QvbWFuYWdlcic7XG5cbmV4cG9ydCBjb25zdCBibG9ja01hcDogTWFwPHN0cmluZywgSUJsb2NrRGVzY3JpcHRpb24+ID0gbmV3IE1hcCgpO1xuXG4vKipcbiAqIEJsb2NrIOWFg+e0oOabtOaWsOeahOS4gOS6m+W3peWFt+aWueazlVxuICog5LiA6Iis5piv5Lyg5YWl5YWD57SgICsg5pWw5o2u77yM5pu05paw5YWD57Sg5YaF55qE5LiA5LqbIEhUTUwg5a+56LGhXG4gKi9cbmNvbnN0IEJsb2NrRWxlbWVudFV0aWxzID0ge1xuICAgIC8qKlxuICAgICAqIOabtOaWsCBCbG9jayDlhYPntKDnmoQgdGl0bGVcbiAgICAgKiBAcGFyYW0gZWxlbVxuICAgICAqIEBwYXJhbSBibG9ja0Rlc2NcbiAgICAgKiBAcGFyYW0gZGV0YWlsc1xuICAgICAqL1xuICAgIHVwZGF0ZVRpdGxlKGVsZW06IEdyYXBoTm9kZUVsZW1lbnQsIGJsb2NrRGVzYzogSUJsb2NrRGVzY3JpcHRpb24sIGRldGFpbHM6IHsgW2tleTogc3RyaW5nXTogYW55IH0pIHtcbiAgICAgICAgY29uc3QgdGl0bGUgPSBibG9ja0Rlc2MudGl0bGUgfHwgZGV0YWlscy50aXRsZSB8fCAnVW5rbm93bic7XG4gICAgICAgIGVsZW0uc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKGAudGl0bGUgdWktbGFiZWxgKSEuaW5uZXJIVE1MID0gdGl0bGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOabtOaWsCBCbG9jayDlhYPntKDnmoQgaWNvblxuICAgICAqIEBwYXJhbSBlbGVtXG4gICAgICogQHBhcmFtIGJsb2NrRGVzY1xuICAgICAqIEByZXR1cm5zXG4gICAgICovXG4gICAgdXBkYXRlSWNvbihlbGVtOiBHcmFwaE5vZGVFbGVtZW50LCBibG9ja0Rlc2M6IElCbG9ja0Rlc2NyaXB0aW9uKSB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmUgPSBibG9ja0Rlc2MuZmVhdHVyZSB8fCB7fTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGZlYXR1cmUuaWNvbjtcbiAgICAgICAgaWYgKCFpY29uKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgJGljb24gPSBlbGVtLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvcihgLnRpdGxlIHVpLWljb25gKSE7XG4gICAgICAgICRpY29uLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJyk7XG4gICAgICAgICRpY29uLnNldEF0dHJpYnV0ZSgndmFsdWUnLCBpY29uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5pu05pawIEJsb2NrIOWFg+e0oOaYr+WQpuWPr+i/m+WFpeeahOWbvuagh+aYvuekuueKtuaAgVxuICAgICAqIEBwYXJhbSBlbGVtXG4gICAgICogQHBhcmFtIGJsb2NrRGVzY1xuICAgICAqL1xuICAgIHVwZGF0ZUNvbGxhcHNlZChlbGVtOiBHcmFwaE5vZGVFbGVtZW50LCBibG9ja0Rlc2M6IElCbG9ja0Rlc2NyaXB0aW9uKSB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmUgPSBibG9ja0Rlc2MuZmVhdHVyZSB8fCB7fTtcbiAgICAgICAgY29uc3QgaXNDb2xsYXBzZWQgPSBmZWF0dXJlLmlzQ29sbGFwc2VkQmxvY2s7XG4gICAgICAgIGNvbnN0ICRzdmcgPSBlbGVtLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvcihgLnRpdGxlIHN2Z2ApITtcbiAgICAgICAgaWYgKGlzQ29sbGFwc2VkKSB7XG4gICAgICAgICAgICAkc3ZnLnJlbW92ZUF0dHJpYnV0ZSgnaGlkZGVuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkc3ZnLnNldEF0dHJpYnV0ZSgnaGlkZGVuJywgJycpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOabtOaWsOWFg+e0oOWxleW8gOaKmOWPoOeahOeKtuaAgVxuICAgICAqIEBwYXJhbSBlbGVtXG4gICAgICogQHBhcmFtIGJsb2NrRGVzY1xuICAgICAqIEBwYXJhbSBkZXRhaWxzXG4gICAgICovXG4gICAgdXBkYXRlRXhwYW5kKGVsZW06IEdyYXBoTm9kZUVsZW1lbnQsIGJsb2NrRGVzYzogSUJsb2NrRGVzY3JpcHRpb24sIGRldGFpbHM6IHsgW2tleTogc3RyaW5nXTogYW55IH0pIHtcbiAgICAgICAgaWYgKGJsb2NrRGVzYy5pbnB1dFBpbnMubGVuZ3RoID4gMCB8fCBibG9ja0Rlc2Mub3V0cHV0UGlucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZSgnZXhwYW5kJywgJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbS5yZW1vdmVBdHRyaWJ1dGUoJ2V4cGFuZCcpO1xuICAgICAgICB9XG4gICAgfSxcbn07XG5cbi8qKlxuICog5Yib5bu65LiA5Liq5LiT55So55qE6IqC54K55riy5p+T5a+56LGhXG4gKlxuICogQHJldHVybnNcbiAqIEBwYXJhbSBibG9ja0Rlc2NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQmxvY2tPcHRpb24oYmxvY2tEZXNjOiBJQmxvY2tEZXNjcmlwdGlvbikge1xuICAgIGJsb2NrRGVzYy5zdHlsZSA9IGJsb2NrRGVzYy5zdHlsZSB8fCB7fTtcbiAgICBibG9ja0Rlc2MuZmVhdHVyZSA9IGJsb2NrRGVzYy5mZWF0dXJlIHx8IHt9O1xuXG4gICAgY29uc3Qgc2hvd1F1aWNrQ29ubmVjdFBvaW50ID0gISFibG9ja0Rlc2MuZmVhdHVyZS5zaG93UXVpY2tDb25uZWN0UG9pbnQ7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0ZW1wbGF0ZTogLypodG1sKi9gXG48c2VjdGlvbiBjbGFzcz1cIndyYXBwZXJcIj5cbiAgICA8aGVhZGVyIGNsYXNzPVwidGl0bGVcIj5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDx1aS1pY29uIGhpZGRlbj48L3VpLWljb24+XG4gICAgICAgICAgICA8dWktbGFiZWw+PC91aS1sYWJlbD5cbiAgICAgICAgICAgIDxzdmcgaGlkZGVuIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+PHBhdGggZD1cIk0xIDEzTDggM0wxNSAxM0gxWlwiPjwvcGF0aD48L3N2Zz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgICR7c2hvd1F1aWNrQ29ubmVjdFBvaW50ID8gJzxkaXYgaGlkZGVuIGNsYXNzPVwicXVpY2stY29ubmVjdFwiIG5hbWU9XCJ0XCI+PC9kaXYnIDogJyd9XG4gICAgPC9oZWFkZXI+XG4gICAgPHNlY3Rpb24gY2xhc3M9XCJjb250ZW50XCI+PC9zZWN0aW9uPlxuPC9zZWN0aW9uPlxuICAgICAgICBgLFxuXG4gICAgICAgIHN0eWxlOiBgJHtTVFlMRS5ob3N0KGJsb2NrRGVzYyl9JHtTVFlMRS5oZWFkZXIoYmxvY2tEZXNjKX0ke1NUWUxFLnBpbihibG9ja0Rlc2MpfWAsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIOWIneWni+WMlueahOaXtuWAmeiuvue9ruS4gOS6m+S6i+S7tuWSjCBIVE1MXG4gICAgICAgICAqIEBwYXJhbSB0aGlzXG4gICAgICAgICAqIEBwYXJhbSBkZXRhaWxzXG4gICAgICAgICAqL1xuICAgICAgICBvbkluaXQodGhpczogR3JhcGhOb2RlRWxlbWVudCwgZGV0YWlsczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSkge1xuICAgICAgICAgICAgLy8g6K6+572uIHRpdGxlIOWPr+aLluaLvVxuICAgICAgICAgICAgY29uc3QgJHRpdGxlID0gdGhpcy5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlci50aXRsZScpISBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgICR0aXRsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNBdHRyaWJ1dGUoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoZXZlbnQgYXMgTW91c2VFdmVudCkubWV0YUtleSAmJiAhKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmN0cmxLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJPdGhlclNlbGVjdGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJMaW5lczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhck5vZGVzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRNb3ZlKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8g57uR5a6a5b+r6YCf6L+e5o6l54K555qE5LqL5Lu2XG4gICAgICAgICAgICBjb25zdCAkcGFyYW0gPSB0aGlzLnNoYWRvd1Jvb3QucXVlcnlTZWxlY3RvcihgLnF1aWNrLWNvbm5lY3RgKSE7XG4gICAgICAgICAgICAkcGFyYW0gJiYgJHBhcmFtLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0Q29ubmVjdCgnc3RyYWlnaHQnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyDnu5HlrprlhYPntKDngrnlh7vlvIDlp4vov57mjqXnmoTkuovku7ZcbiAgICAgICAgICAgIGlmIChibG9ja0Rlc2MuaW5wdXRQaW5zLmxlbmd0aCA9PT0gMCAmJiBibG9ja0Rlc2Mub3V0cHV0UGlucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAwICYmIHRoaXMuaGFzQ29ubmVjdCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0Q29ubmVjdCgnc3RyYWlnaHQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgLy8gZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbUV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdibG9jay1kYmxjbGljaycsIHtcbiAgICAgICAgICAgICAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlWDogZXZlbnQucGFnZVgsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWdlWTogZXZlbnQucGFnZVksXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXRYOiBldmVudC5vZmZzZXRYLFxuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WTogZXZlbnQub2Zmc2V0WSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoY3VzdG9tRXZlbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VzdG9tID0gbmV3IEN1c3RvbUV2ZW50KCdibG9jay1jbGljaycsIHtcbiAgICAgICAgICAgICAgICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiB7fSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoY3VzdG9tKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbSA9IG5ldyBDdXN0b21FdmVudCgnYmxvY2stcmlnaHQtY2xpY2snLCB7XG4gICAgICAgICAgICAgICAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChjdXN0b20pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuZGF0YS5hZGRQcm9wZXJ0eUxpc3RlbmVyKCdzZWxlY3RlZCcsIChzZWxlY3RlZCwgbGVnYWN5U2VsZWN0ZWQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWQgPT09IGxlZ2FjeVNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbSA9IG5ldyBDdXN0b21FdmVudCgnYmxvY2stc2VsZWN0ZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDoge30sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoY3VzdG9tKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b20gPSBuZXcgQ3VzdG9tRXZlbnQoJ2Jsb2NrLXVuc2VsZWN0ZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDoge30sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoY3VzdG9tKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblVwZGF0ZSh0aGlzOiBHcmFwaE5vZGVFbGVtZW50LCBkZXRhaWxzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9KSB7XG4gICAgICAgICAgICAvLyDmm7TmlrAgdGl0bGVcbiAgICAgICAgICAgIEJsb2NrRWxlbWVudFV0aWxzLnVwZGF0ZVRpdGxlKHRoaXMsIGJsb2NrRGVzYywgZGV0YWlscyk7XG5cbiAgICAgICAgICAgIC8vIOabtOaWsCBpY29uXG4gICAgICAgICAgICBCbG9ja0VsZW1lbnRVdGlscy51cGRhdGVJY29uKHRoaXMsIGJsb2NrRGVzYyk7XG5cbiAgICAgICAgICAgIC8vIOabtOaWsOaKmOWPoOWbvuagh1xuICAgICAgICAgICAgQmxvY2tFbGVtZW50VXRpbHMudXBkYXRlQ29sbGFwc2VkKHRoaXMsIGJsb2NrRGVzYyk7XG5cbiAgICAgICAgICAgIC8vIOabtOaWsOaKmOWPoOeKtuaAgVxuICAgICAgICAgICAgQmxvY2tFbGVtZW50VXRpbHMudXBkYXRlRXhwYW5kKHRoaXMsIGJsb2NrRGVzYywgZGV0YWlscyk7XG5cbiAgICAgICAgICAgIC8vIOaVsOaNruabtOaWsOWQju+8jOabtOaWsOWvueW6lOeahOi1hOa6kFxuICAgICAgICAgICAgLy8gdGhpcy5kYXRhLmFkZFByb3BlcnR5TGlzdGVuZXIoJ2RldGFpbHMnLCAoZGV0YWlscykgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHVwZGF0ZUhUTUwoZGV0YWlscy5sYWJlbCk7XG4gICAgICAgICAgICAvLyB9KTtcblxuICAgICAgICAgICAgLy8g55Sf5oiQ6ZKI6ISaXG4gICAgICAgICAgICBjb25zdCAkY29udGVudCA9IHRoaXMuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCcuY29udGVudCcpITtcbiAgICAgICAgICAgICRjb250ZW50LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgaWYgKGJsb2NrRGVzYy5jcmVhdGVEeW5hbWljT3V0cHV0UGlucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG91dHB1dExpc3QgPSBibG9ja0Rlc2MuY3JlYXRlRHluYW1pY091dHB1dFBpbnMoYmxvY2tEZXNjLCBkZXRhaWxzKTtcbiAgICAgICAgICAgICAgICBvdXRwdXRMaXN0LmZvckVhY2goKHBpbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRjb250ZW50Py5hcHBlbmRDaGlsZChnZW5lcmF0ZU91dHB1dFBpbkhUTUwocGluLCBkZXRhaWxzLm91dHB1dFBpbnNbaW5kZXhdKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJsb2NrRGVzYy5vdXRwdXRQaW5zLmZvckVhY2goKHBpbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRjb250ZW50Py5hcHBlbmRDaGlsZChnZW5lcmF0ZU91dHB1dFBpbkhUTUwocGluLCBkZXRhaWxzLm91dHB1dFBpbnNbaW5kZXhdKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCAkZ3JhcGggPSAodGhpcy5nZXRSb290Tm9kZSgpIGFzIGFueSkuaG9zdCBhcyBHcmFwaEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCB1dWlkID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ25vZGUtdXVpZCcpITtcbiAgICAgICAgICAgIGlmIChibG9ja0Rlc2MuY3JlYXRlRHluYW1pY0lucHV0UGlucykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0TGlzdCA9IGJsb2NrRGVzYy5jcmVhdGVEeW5hbWljSW5wdXRQaW5zKGJsb2NrRGVzYywgZGV0YWlscyk7XG4gICAgICAgICAgICAgICAgaW5wdXRMaXN0LmZvckVhY2goKHBpbiwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRjb250ZW50Py5hcHBlbmRDaGlsZChnZW5lcmF0ZUlucHV0UGluSFRNTChwaW4sIGRldGFpbHMuaW5wdXRQaW5zLCBpbmRleCwgdXVpZCwgJGdyYXBoLmdldFByb3BlcnR5KCdsaW5lcycpKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGJsb2NrRGVzYy5pbnB1dFBpbnMuZm9yRWFjaCgocGluLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGNvbnRlbnQ/LmFwcGVuZENoaWxkKGdlbmVyYXRlSW5wdXRQaW5IVE1MKHBpbiwgZGV0YWlscy5pbnB1dFBpbnMsIGluZGV4LCB1dWlkLCAkZ3JhcGguZ2V0UHJvcGVydHkoJ2xpbmVzJykpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g57uR5a6a5Y+C5pWw6L+e5o6l54K555qE5LqL5Lu2XG4gICAgICAgICAgICBjb25zdCAkcGFyYW1MaXN0ID0gdGhpcy5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3JBbGwoYHYtZ3JhcGgtbm9kZS1wYXJhbWApO1xuICAgICAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbCgkcGFyYW1MaXN0LCAoJHBhcmFtKSA9PiB7XG4gICAgICAgICAgICAgICAgJHBhcmFtLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChldmVudDogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gJHBhcmFtLmdldEF0dHJpYnV0ZSgnbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbURpcmVjdGlvbiA9ICRwYXJhbS5nZXRBdHRyaWJ1dGUoJ2RpcmVjdGlvbicpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyYW1EaXJlY3Rpb24gIT09ICdpbnB1dCcgJiYgcGFyYW1EaXJlY3Rpb24gIT09ICdvdXRwdXQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydENvbm5lY3QoJ2N1cnZlJywgbmFtZSwgcGFyYW1EaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuY29uc3QgU1RZTEUgPSB7XG4gICAgaG9zdChibG9jazogSUJsb2NrRGVzY3JpcHRpb24pIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gYmxvY2suc3R5bGUgfHwge307XG4gICAgICAgIHJldHVybiAvKmNzcyovYFxuOmhvc3QgKltoaWRkZW5dIHtcbiAgICBkaXNwbGF5OiBub25lO1xufVxuOmhvc3Qge1xuICAgIC0tZm9udC1jb2xvcjogJHtjb25maWcuZm9udENvbG9yIHx8ICcjY2NjJ307XG4gICAgLS1mb250LWNvbG9yLWhvdmVyOiAke2NvbmZpZy5mb250SG92ZXJDb2xvciB8fCBjb25maWcuZm9udENvbG9yIHx8ICcjY2NjJ307XG4gICAgLS1ib3JkZXItY29sb3I6ICR7Y29uZmlnLmJvcmRlckNvbG9yIHx8ICd3aGl0ZSd9O1xuICAgIC0tYm9yZGVyLWNvbG9yLWhvdmVyOiAke2NvbmZpZy5ib3JkZXJIb3ZlckNvbG9yIHx8IGNvbmZpZy5ib3JkZXJDb2xvciB8fCAnd2hpdGUnfTtcbiAgICAtLXNoYWRvdy1jb2xvcjogJHtjb25maWcuc2hhZG93Q29sb3IgfHwgJyNjY2MnfTtcbiAgICAtLXNoYWRvdy1jb2xvci1ob3ZlcjogJHtjb25maWcuc2hhZG93SG92ZXJDb2xvciB8fCBjb25maWcuc2hhZG93Q29sb3IgfHwgJyNjY2MnfTtcbiAgICAtLWJhY2tncm91bmQtY29sb3I6ICR7Y29uZmlnLmJhY2tncm91bmRDb2xvciB8fCAnIzJiMmIyYmNjJ307XG4gICAgLS1ib3JkZXItcmFkaXVzOiAycHg7XG5cbiAgICAtLWhlYWRlci1oZWlnaHQ6IDI0cHg7XG4gICAgLS1oZWFkZXItYmFja2dyb3VuZDogJHtjb25maWcuaGVhZGVyQ29sb3IgfHwgJyMyYjJiMmJjYyd9O1xuXG4gICAgLS1waW4taGVpZ2h0OiAyNHB4O1xuXG4gICAgd2lkdGg6IDIwMHB4O1xuXG4gICAgY29sb3I6IHZhcigtLWZvbnQtY29sb3IpO1xuICAgIGN1cnNvcjogZGVmYXVsdDtcblxufVxuOmhvc3QgPiBzZWN0aW9uLndyYXBwZXIge1xuICAgIG1hcmdpbjogMTBweDtcbn1cbjpob3N0KDpob3ZlcikgPiBzZWN0aW9uLndyYXBwZXIsIDpob3N0KFtzZWxlY3RlZF0pID4gc2VjdGlvbi53cmFwcGVyIHtcbiAgICBib3JkZXItY29sb3I6IHZhcigtLWJvcmRlci1jb2xvci1ob3Zlcik7XG4gICAgY29sb3I6IHZhcigtLWZvbnQtY29sb3ItaG92ZXIpO1xuICAgIGJveC1zaGFkb3c6IDBweCAwcHggN3B4IDJweCB2YXIoLS1zaGFkb3ctY29sb3ItaG92ZXIpO1xufVxuc2VjdGlvbi53cmFwcGVyIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7IFxuICAgIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtY29sb3IpO1xuICAgIGJveC1zaGFkb3c6IDBweCAwcHggN3B4IDJweCBub25lO1xufVxuOmhvc3QoOmhvdmVyKSA+IHNlY3Rpb24ud3JhcHBlcjo6YmVmb3JlIHtcbiAgICBjb250ZW50OiAnJztcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgdG9wOiAwO1xuICAgIGxlZnQ6IDA7XG4gICAgcmlnaHQ6IDA7XG4gICAgYm90dG9tOiAwO1xuICAgIHotaW5kZXg6IDE7XG4gICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7IFxuICAgIGJveC1zaGFkb3c6IDBweCAwcHggMHB4IDFweCB2YXIoLS1zaGFkb3ctY29sb3ItaG92ZXIpIGluc2V0O1xuICAgIHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuYDtcbiAgICB9LFxuICAgIGhlYWRlcihibG9jazogSUJsb2NrRGVzY3JpcHRpb24pIHtcbiAgICAgICAgY29uc3QgY29uZmlnID0gYmxvY2suc3R5bGUgfHwge307XG4gICAgICAgIHJldHVybiAvKmNzcyovYFxuaGVhZGVyLnRpdGxlIHtcbiAgICBsaW5lLWhlaWdodDogdmFyKC0taGVhZGVyLWhlaWdodCk7XG5cbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgYm9yZGVyLXJhZGl1czogdmFyKC0tYm9yZGVyLXJhZGl1cyk7XG5cbiAgICAke2NvbmZpZy5zZWNvbmRhcnlDb2xvciA/IGBiYWNrZ3JvdW5kOiAke2NvbmZpZy5zZWNvbmRhcnlDb2xvcn07IHBhZGRpbmctbGVmdDogNnB4O2AgOiAnJ31cbn1cbmhlYWRlci50aXRsZSA+IGRpdiB7XG4gICAgcGFkZGluZzogMCAxMHB4O1xuICAgIGhlaWdodDogMjRweDtcbiAgICBib3JkZXItcmFkaXVzOiB2YXIoLS1ib3JkZXItcmFkaXVzKTtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWhlYWRlci1iYWNrZ3JvdW5kKTtcbn1cbjpob3N0KFtleHBhbmRdKSBoZWFkZXIudGl0bGUgPiBkaXYge1xuICAgIGJvcmRlci1yYWRpdXM6IHZhcigtLWJvcmRlci1yYWRpdXMpIHZhcigtLWJvcmRlci1yYWRpdXMpIDAgMDtcbn1cbmhlYWRlci50aXRsZSA+IGRpdiA+IHVpLWxhYmVsIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBwYWRkaW5nOiAwIDEwcHg7XG59XG5oZWFkZXIudGl0bGUgPiBkaXYgPiB1aS1pY29uIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbn1cbmhlYWRlci50aXRsZSA+IGRpdiA+IHN2ZyB7XG4gICAgZmlsbDogd2hpdGU7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgd2lkdGg6IDEwcHg7XG4gICAgdHJhbnNmb3JtOiByb3RhdGUoOTBkZWcpO1xufVxuaGVhZGVyLnRpdGxlID4gLnF1aWNrLWNvbm5lY3Qge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIHBhZGRpbmc6IDA7XG4gICAgd2lkdGg6IDEycHg7XG4gICAgaGVpZ2h0OiAxMnB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgcmlnaHQ6IC02cHg7XG4gICAgdG9wOiA1MCU7XG4gICAgbWFyZ2luLXRvcDogLTZweDtcbiAgICBvcGFjaXR5OiAwO1xuICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4zcztcbn1cbjpob3N0KDpob3ZlcikgaGVhZGVyLnRpdGxlID4gLnF1aWNrLWNvbm5lY3Qge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG9wYWNpdHk6IDE7XG59XG4gICAgICAgIGA7XG4gICAgfSxcbiAgICBwaW46IGdlbmVyYXRlUGluU3R5bGUsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gaGFzRGVjbGFyZUJsb2NrKHR5cGU6IHN0cmluZykge1xuICAgIHJldHVybiBibG9ja01hcC5oYXModHlwZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWNsYXJlQmxvY2sodHlwZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGJsb2NrTWFwLmdldCh0eXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZURlY2xhcmVCbG9jayh0eXBlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBncmFwaCA9ICcqJztcbiAgICBjb25zdCB1bmtub3duT3B0aW9uID0gcXVlcnlOb2RlKGdyYXBoLCAndW5rbm93bicpO1xuICAgIHJlZ2lzdGVyTm9kZShncmFwaCwgdHlwZSwgdW5rbm93bk9wdGlvbik7XG4gICAgYmxvY2tNYXAuZGVsZXRlKHR5cGUpO1xufVxuXG4vLyBAdHMtaWdub3JlXG53aW5kb3cucmVtb3ZlRGVjbGFyZUJsb2NrID0gcmVtb3ZlRGVjbGFyZUJsb2NrO1xuXG4vKipcbiAqIOazqOWGjOS4gOS4qiBibG9jayDnsbvlnotcbiAqIEBwYXJhbSBibG9ja1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY2xhcmVCbG9jayhibG9jazogSUJsb2NrRGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBncmFwaCA9ICcqJztcbiAgICAvLyBpZiAoYmxvY2tNYXAuaGFzKGJsb2NrLnR5cGUpKSB7XG4gICAgLy8gICAgIGNvbnNvbGUud2FybihgQ2Fubm90IGRlY2xhcmUgZHVwbGljYXRlIGJsb2NrIHR5cGVzOiAke2Jsb2NrLnR5cGV9YCk7XG4gICAgLy8gICAgIHJldHVybjtcbiAgICAvLyB9XG5cbiAgICAvLyDlkIjlubYgZXh0ZW5kIOaVsOaNrlxuICAgIGlmIChibG9jay5leHRlbmQpIHtcbiAgICAgICAgY29uc3QgZXh0ZW5kID0gYmxvY2tNYXAuZ2V0KGJsb2NrLmV4dGVuZCk7XG4gICAgICAgIGlmICghZXh0ZW5kKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYEluaGVyaXRhbmNlIGRhdGEgbm90IGZvdW5kOiAke2Jsb2NrLmV4dGVuZH1gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbXBsZXRlQmxvY2tUYXJnZXQoYmxvY2ssIGV4dGVuZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBvcHRpb25zID0gZ2VuZXJhdGVCbG9ja09wdGlvbihibG9jayk7XG4gICAgcmVnaXN0ZXJOb2RlKGdyYXBoLCBibG9jay50eXBlLCBvcHRpb25zKTtcbiAgICBibG9ja01hcC5zZXQoYmxvY2sudHlwZSwgYmxvY2spO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5EZWNsYXJlQmxvY2sodHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZ3JhcGggPSAnKic7XG4gICAgLy8gVE9ETyDpnIDopoHliKDpmaTlupXlsYIgYmxvY2sg6IqC54K5XG4gICAgLy8gdW5yZWdpc3Rlck5vZGUoZ3JhcGgsIHR5cGUpO1xuICAgIGJsb2NrTWFwLmRlbGV0ZSh0eXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcGxhY2VEZWNsYXJlQmxvY2soc2VhcmNoVHlwZTogc3RyaW5nLCBibG9jazogSUJsb2NrRGVzY3JpcHRpb24pIHtcbiAgICBpZiAoYmxvY2tNYXAuaGFzKHNlYXJjaFR5cGUpKSB7XG4gICAgICAgIHVuRGVjbGFyZUJsb2NrKHNlYXJjaFR5cGUpO1xuICAgIH1cbiAgICBkZWNsYXJlQmxvY2soYmxvY2spO1xufVxuIl19