import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

console.log("[KOOK_图像蒙版编辑] JS 文件开始加载");

// 创建蒙版编辑器弹窗的HTML结构
function createMaskEditorModal() {
    console.log("[KOOK_图像蒙版编辑] 创建弹窗DOM");
    const modal = document.createElement("dialog");
    modal.id = "kook-mask-editor-modal";
    modal.innerHTML = `
        <div class="kook-mask-editor-container">
            <!-- 顶部工具栏 -->
            <div class="kook-mask-editor-header">
                <h3>遮罩编辑器</h3>
                <div class="kook-mask-editor-header-actions">
                    <button id="kook-mask-undo" title="撤销 (Ctrl+Z)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 7v6h6"></path>
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
                        </svg>
                    </button>
                    <button id="kook-mask-redo" title="重做 (Ctrl+Y)">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 7v6h-6"></path>
                            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path>
                        </svg>
                    </button>
                    <button id="kook-mask-clear" title="清除蒙版">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                    <button class="kook-mask-close-button" title="关闭">×</button>
                </div>
            </div>
            
            <!-- 主体内容区域 -->
            <div class="kook-mask-editor-body">
                <!-- 左侧工具栏 -->
                <div class="kook-mask-editor-toolbar">
                    <div class="kook-tool-group">
                        <button class="kook-tool-btn active" data-tool="select" title="选择工具 (V)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                            </svg>
                            <span class="kook-tool-label">选择</span>
                        </button>
                    </div>
                    
                    <div class="kook-tool-divider"></div>
                    
                    <div class="kook-tool-group">
                        <button class="kook-tool-btn" data-tool="brush" title="画笔 (B)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13.284a2.955 2.955 0 0 0 .154-3.17 2.96 2.96 0 0 0-3.24-1.284 2.964 2.964 0 0 0-2.11 1.284l-6.096 8.532a.5.5 0 0 0-.072.265v2.818h2.818a.5.5 0 0 0 .265-.072l8.532-6.096a2.964 2.964 0 0 0 1.284-2.11c.056-.4.056-.806 0-1.206l-.515.059z"></path>
                                <path d="m4.5 16.5 3 3"></path>
                            </svg>
                            <span class="kook-tool-label">画笔</span>
                        </button>
                        <button class="kook-tool-btn" data-tool="eraser" title="橡皮擦 (E)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path>
                                <path d="M22 21H7"></path>
                                <path d="m5 11 9 9"></path>
                            </svg>
                            <span class="kook-tool-label">橡皮擦</span>
                        </button>
                        <button class="kook-tool-btn" data-tool="rect-select" title="方框选区 (R)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            </svg>
                            <span class="kook-tool-label">方框</span>
                        </button>
                        <button class="kook-tool-btn" data-tool="ellipse-select" title="椭圆选区 (O)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <ellipse cx="12" cy="12" rx="10" ry="7"></ellipse>
                            </svg>
                            <span class="kook-tool-label">椭圆</span>
                        </button>
                    </div>
                    
                    <div class="kook-tool-divider"></div>
                    
                    <div class="kook-tool-group">
                        <button class="kook-tool-btn" data-tool="zoom-in" title="放大">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="11" y1="8" x2="11" y2="14"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            <span class="kook-tool-label">放大</span>
                        </button>
                        <button class="kook-tool-btn" data-tool="zoom-out" title="缩小">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            <span class="kook-tool-label">缩小</span>
                        </button>
                        <button class="kook-tool-btn" data-tool="reset-zoom" title="适应窗口">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                            </svg>
                            <span class="kook-tool-label">适应</span>
                        </button>
                    </div>
                    
                    <div class="kook-tool-divider"></div>
                    
                    <div class="kook-zoom-info">
                        <span id="kook-zoom-level">100%</span>
                    </div>
                </div>
                
                <!-- 画布区域 -->
                <div class="kook-mask-editor-canvas-wrapper">
                    <div class="kook-mask-editor-canvas-container" id="kook-canvas-container">
                        <canvas id="kook-image-canvas" class="kook-canvas kook-image-canvas"></canvas>
                        <canvas id="kook-mask-canvas" class="kook-canvas kook-mask-canvas"></canvas>
                        <div id="kook-brush-cursor" class="kook-brush-cursor"></div>
                        <div id="kook-brush-preview" class="kook-brush-preview">
                            <div class="kook-brush-preview-inner"></div>
                        </div>
                        <!-- 叠加图像变换控件 -->
                        <div id="kook-transform-controls" class="kook-transform-controls" style="display: none;">
                            <div class="kook-transform-box">
                                <div class="kook-transform-handle kook-handle-tl" data-handle="tl"></div>
                                <div class="kook-transform-handle kook-handle-tr" data-handle="tr"></div>
                                <div class="kook-transform-handle kook-handle-bl" data-handle="bl"></div>
                                <div class="kook-transform-handle kook-handle-br" data-handle="br"></div>
                                <div class="kook-transform-handle kook-handle-rotate" data-handle="rotate"></div>
                                <div class="kook-transform-border"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 右侧面板 -->
                <div class="kook-mask-editor-sidebar">
                    <div class="kook-panel">
                        <h4>笔刷设置</h4>
                        
                        <div class="kook-setting-group">
                            <div class="kook-setting-header">
                                <label>大小</label>
                                <input type="number" id="kook-brush-size-input" value="24" min="1" max="500">
                            </div>
                            <input type="range" id="kook-brush-size" min="1" max="500" value="24" class="kook-slider">
                        </div>
                        
                        <div class="kook-setting-group">
                            <div class="kook-setting-header">
                                <label>蒙版颜色</label>
                                <input type="color" id="kook-mask-color" value="#ff0000">
                            </div>
                        </div>
                        
                        <div class="kook-setting-group">
                            <div class="kook-setting-header">
                                <label>不透明度</label>
                                <input type="number" id="kook-brush-opacity-input" value="1" min="0" max="1" step="0.01">
                            </div>
                            <input type="range" id="kook-brush-opacity" min="0" max="1" value="1" step="0.01" class="kook-slider">
                        </div>
                        
                        <div class="kook-setting-group">
                            <div class="kook-setting-header">
                                <label>硬度</label>
                                <input type="number" id="kook-brush-hardness-input" value="1" min="0" max="1" step="0.01">
                            </div>
                            <input type="range" id="kook-brush-hardness" min="0" max="1" value="1" step="0.01" class="kook-slider">
                        </div>
                        
                        <div class="kook-setting-group">
                            <div class="kook-setting-header">
                                <label>间距</label>
                                <input type="number" id="kook-brush-spacing-input" value="0.01" min="0.01" max="5" step="0.01">
                            </div>
                            <input type="range" id="kook-brush-spacing" min="0.01" max="5" value="0.01" step="0.01" class="kook-slider">
                        </div>
                        
                        <div class="kook-setting-group">
                            <div class="kook-setting-header">
                                <label>形状</label>
                            </div>
                            <div class="kook-shape-selector">
                                <button class="kook-shape-btn active" data-shape="circle" title="圆形">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                    </svg>
                                </button>
                                <button class="kook-shape-btn" data-shape="square" title="方形">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="kook-panel-divider"></div>
                    
                    <div class="kook-panel">
                        <h4>图层</h4>
                        <div class="kook-layer-settings">
                            <div class="kook-layer-item">
                                <label class="kook-checkbox">
                                    <input type="checkbox" id="kook-show-image" checked>
                                    <span>显示图片</span>
                                </label>
                            </div>
                            <div class="kook-layer-item">
                                <label class="kook-checkbox">
                                    <input type="checkbox" id="kook-show-mask" checked>
                                    <span>显示蒙版</span>
                                </label>
                            </div>
                            <div class="kook-layer-item">
                                <label class="kook-checkbox">
                                    <input type="checkbox" id="kook-invert-mask">
                                    <span>反转显示(仅视觉效果)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="kook-panel-divider"></div>
                    
                    <div class="kook-panel">
                        <h4>变换</h4>
                        <div class="kook-transform-buttons">
                            <button id="kook-flip-h" class="kook-transform-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"></path>
                                </svg>
                                水平翻转
                            </button>
                            <button id="kook-flip-v" class="kook-transform-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 12h8m0 0h8m-8 0V4m0 8v8"></path>
                                </svg>
                                垂直翻转
                            </button>
                            <button id="kook-rotate-left" class="kook-transform-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                    <path d="M3 3v5h5"></path>
                                </svg>
                                向左旋转
                            </button>
                            <button id="kook-rotate-right" class="kook-transform-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                    <path d="M21 3v5h-5"></path>
                                </svg>
                                向右旋转
                            </button>
                        </div>
                    </div>
                    
                </div>
            </div>
            
            <!-- 底部按钮栏 -->
            <div class="kook-mask-editor-footer">
                <div class="kook-mask-editor-info">
                    <span id="kook-image-dimensions"></span>
                </div>
                <div class="kook-mask-editor-actions">
                    <button id="kook-mask-cancel" class="kook-btn kook-btn-secondary">取消</button>
                    <button id="kook-mask-confirm" class="kook-btn kook-btn-primary">保存</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    console.log("[KOOK_图像蒙版编辑] 弹窗DOM已添加到body");
    return modal;
}

// 添加样式
console.log("[KOOK_图像蒙版编辑] 添加样式");
const style = document.createElement("style");
style.textContent = `
    #kook-mask-editor-modal {
        border: none;
        border-radius: 8px;
        padding: 0;
        background: #1a1a1a;
        max-width: 99vw;
        max-height: 99vh;
        width: 1920px;
        height: 1200px;
        overflow: hidden;
    }
    
    #kook-mask-editor-modal::backdrop {
        background: rgba(0, 0, 0, 0.85);
    }
    
    .kook-mask-editor-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background: #1a1a1a;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    /* 头部 */
    .kook-mask-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: #252525;
        border-bottom: 1px solid #333;
        flex-shrink: 0;
    }
    
    .kook-mask-editor-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: #fff;
    }
    
    .kook-mask-editor-header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    
    .kook-mask-editor-header-actions button {
        background: #333;
        border: none;
        color: #e0e0e0;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    
    .kook-mask-editor-header-actions button:hover {
        background: #444;
        color: #fff;
    }
    
    .kook-mask-close-button {
        font-size: 20px;
        margin-left: 8px;
    }
    
    /* 主体 */
    .kook-mask-editor-body {
        display: flex;
        flex: 1;
        overflow: hidden;
        min-height: 0;
    }
    
    /* 左侧工具栏 */
    .kook-mask-editor-toolbar {
        width: 56px;
        background: #252525;
        border-right: 1px solid #333;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 0;
        gap: 8px;
        flex-shrink: 0;
    }
    
    .kook-tool-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .kook-tool-btn {
        width: 56px;
        height: 64px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: #999;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: all 0.2s;
        padding: 4px;
    }
    
    .kook-tool-btn:hover {
        background: #333;
        color: #e0e0e0;
    }
    
    .kook-tool-btn.active {
        background: #2a8af6;
        color: #fff;
    }
    
    .kook-tool-label {
        font-size: 10px;
        white-space: nowrap;
    }
    
    .kook-tool-divider {
        width: 32px;
        height: 1px;
        background: #444;
        margin: 4px 0;
    }
    
    .kook-zoom-info {
        margin-top: auto;
        font-size: 11px;
        color: #666;
    }
    
    /* 画布区域 */
    .kook-mask-editor-canvas-wrapper {
        flex: 1;
        background: #0d0d0d;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        min-width: 0;
        min-height: 0;
        padding: 20px;
    }
    
    .kook-mask-editor-canvas-container {
        position: relative;
        overflow: visible;
        background: #0a0a0a;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
    }
    
    .kook-canvas {
        position: absolute;
        top: 0;
        left: 0;
    }
    
    .kook-image-canvas {
        z-index: 1;
    }
    
    .kook-mask-canvas {
        z-index: 2;
        mix-blend-mode: normal;
    }
    
    /* 选区预览层 */
    #kook-selection-preview {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 50;
    }
    
    .kook-brush-cursor {
        position: absolute;
        pointer-events: none;
        z-index: 100;
        border: 2px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(0, 0, 0, 0.8), inset 0 0 4px rgba(0, 0, 0, 0.3);
        display: none;
    }
    
    /* 画笔大小预览 */
    .kook-brush-preview {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 200;
        display: none;
        border: 3px solid rgba(255, 255, 255, 0.95);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 0, 0, 0.5);
        background: rgba(255, 0, 0, 0.3);
    }
    
    .kook-brush-preview.show {
        display: block;
        animation: brushPreviewPulse 0.15s ease-out;
    }
    
    @keyframes brushPreviewPulse {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    /* 变换控件 */
    .kook-transform-controls {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 150;
    }
    
    .kook-transform-box {
        position: absolute;
        border: 2px dashed #2a8af6;
        pointer-events: auto;
        cursor: move;
    }
    
    .kook-transform-border {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 1px solid rgba(42, 138, 246, 0.5);
    }
    
    .kook-transform-handle {
        position: absolute;
        width: 12px;
        height: 12px;
        background: #2a8af6;
        border: 2px solid #fff;
        border-radius: 50%;
        pointer-events: auto;
        z-index: 10;
    }
    
    .kook-handle-tl { top: -6px; left: -6px; cursor: nw-resize; }
    .kook-handle-tr { top: -6px; right: -6px; cursor: ne-resize; }
    .kook-handle-bl { bottom: -6px; left: -6px; cursor: sw-resize; }
    .kook-handle-br { bottom: -6px; right: -6px; cursor: se-resize; }
    
    .kook-handle-rotate {
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        cursor: grab;
        background: #f6a82a;
    }
    
    .kook-handle-rotate:active {
        cursor: grabbing;
    }
    
    /* 右侧面板 */
    .kook-mask-editor-sidebar {
        width: 240px;
        background: #252525;
        border-left: 1px solid #333;
        padding: 16px;
        overflow-y: auto;
        flex-shrink: 0;
    }
    
    .kook-panel h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 500;
        color: #fff;
    }
    
    .kook-panel-divider {
        height: 1px;
        background: #444;
        margin: 16px 0;
    }
    
    .kook-setting-group {
        margin-bottom: 16px;
    }
    
    .kook-setting-group label {
        display: block;
        font-size: 12px;
        color: #999;
        margin-bottom: 8px;
    }
    
    .kook-setting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    
    .kook-setting-header label {
        margin-bottom: 0;
    }
    
    .kook-setting-header input[type="number"] {
        width: 60px;
        background: #333;
        border: 1px solid #444;
        color: #e0e0e0;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        text-align: center;
    }
    
    .kook-setting-header input[type="color"] {
        width: 50px;
        height: 28px;
        background: #333;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .kook-slider {
        width: 100%;
        height: 6px;
        background: #333;
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
    }
    
    .kook-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #2a8af6;
        border-radius: 50%;
        cursor: pointer;
    }
    
    .kook-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #2a8af6;
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }
    
    /* 形状选择器 */
    .kook-shape-selector {
        display: flex;
        gap: 8px;
    }
    
    .kook-shape-btn {
        flex: 1;
        height: 36px;
        background: #333;
        border: 2px solid transparent;
        border-radius: 6px;
        color: #999;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    
    .kook-shape-btn:hover {
        background: #444;
        color: #e0e0e0;
    }
    
    .kook-shape-btn.active {
        background: #2a8af6;
        border-color: #1a7ae6;
        color: #fff;
    }
    
    /* 变换按钮 */
    .kook-transform-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    
    .kook-transform-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 8px 4px;
        background: #333;
        border: none;
        border-radius: 6px;
        color: #e0e0e0;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
        white-space: nowrap;
    }
    
    .kook-transform-btn:hover {
        background: #444;
    }
    
    .kook-transform-btn svg {
        flex-shrink: 0;
    }
    
    /* 图层设置 */
    .kook-layer-item {
        margin-bottom: 12px;
    }
    
    .kook-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 13px;
        color: #e0e0e0;
    }
    
    .kook-checkbox input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #2a8af6;
    }
    
    /* 底部 */
    .kook-mask-editor-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: #252525;
        border-top: 1px solid #333;
        flex-shrink: 0;
    }
    
    .kook-mask-editor-info {
        font-size: 12px;
        color: #666;
    }
    
    .kook-mask-editor-actions {
        display: flex;
        gap: 12px;
    }
    
    .kook-btn {
        padding: 10px 32px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .kook-btn-primary {
        background: #2a8af6;
        color: #fff;
    }
    
    .kook-btn-primary:hover {
        background: #1a7ae6;
    }
    
    .kook-btn-secondary {
        background: #444;
        color: #e0e0e0;
    }
    
    .kook-btn-secondary:hover {
        background: #555;
    }
`;
document.head.appendChild(style);
console.log("[KOOK_图像蒙版编辑] 样式已添加");

// 蒙版编辑器类
class KOOKMaskEditor {
    constructor() {
        console.log("[KOOK_图像蒙版编辑] 初始化编辑器类");
        this.modal = createMaskEditorModal();
        this.imageCanvas = this.modal.querySelector("#kook-image-canvas");
        this.maskCanvas = this.modal.querySelector("#kook-mask-canvas");
        this.imageCtx = this.imageCanvas.getContext("2d");
        this.maskCtx = this.maskCanvas.getContext("2d");
        this.brushCursor = this.modal.querySelector("#kook-brush-cursor");
        this.brushPreview = this.modal.querySelector("#kook-brush-preview");
        this.canvasContainer = this.modal.querySelector("#kook-canvas-container");
        this.canvasWrapper = this.modal.querySelector(".kook-mask-editor-canvas-wrapper");
        
        this.currentTool = "select";
        this.isDrawing = false;
        this.isPanning = false;
        this.lastX = 0;
        this.lastY = 0;
        this.zoom = 1;
        
        // 图片位置偏移（用于拖动图片）
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        
        // 图片原始尺寸
        this.imageWidth = 0;
        this.imageHeight = 0;
        
        // 叠加图像相关
        this.overlayImage = null;  // 叠加图像对象
        this.overlayCanvas = null; // 叠加图像canvas
        this.overlayCtx = null;    // 叠加图像context
        this.overlayTransform = {  // 叠加图像变换参数
            x: 0,      // 位置X
            y: 0,      // 位置Y
            scale: 1,  // 缩放
            rotation: 0 // 旋转角度（度）
        };
        this.isEditingOverlay = false; // 是否正在编辑叠加图像
        
        // 笔刷设置
        this.brushSettings = {
            size: 24,
            opacity: 1,
            hardness: 1,
            spacing: 0.01,
            maskColor: "#ff0000",
            shape: "circle"
        };
        
        // 框选相关
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        this.selectionCanvas = document.createElement("canvas");
        this.selectionCtx = this.selectionCanvas.getContext("2d");
        
        // 历史记录
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        // 画笔预览定时器
        this.brushPreviewTimer = null;
        
        // 反转蒙版状态
        this.isInverted = false;
        
        // 当前节点ID和会话ID
        this.currentNodeId = null;
        this.sessionId = null;
        
        // 是否正在应用蒙版（防止重复提交或取消）
        this.isApplying = false;
        
        this.setupEventListeners();
        console.log("[KOOK_图像蒙版编辑] 编辑器类初始化完成");
    }
    
    setupEventListeners() {
        // 关闭按钮
        this.modal.querySelector(".kook-mask-close-button").addEventListener("click", () => {
            if (this.isApplying) {
                console.log("[KOOK_图像蒙版编辑] 正在应用蒙版中，忽略关闭按钮");
                return;
            }
            this.cleanupAndClose(true);
        });
        
        // 取消按钮
        this.modal.querySelector("#kook-mask-cancel").addEventListener("click", () => {
            if (this.isApplying) {
                console.log("[KOOK_图像蒙版编辑] 正在应用蒙版中，忽略取消按钮");
                return;
            }
            this.cleanupAndClose(true);
        });
        
        // 确认按钮
        this.modal.querySelector("#kook-mask-confirm").addEventListener("click", () => {
            this.applyMask();
        });
        
        // 工具选择
        this.modal.querySelectorAll(".kook-tool-btn[data-tool]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.switchTool(tool);
            });
        });
        
        // 形状选择
        this.modal.querySelectorAll(".kook-shape-btn[data-shape]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const shape = e.currentTarget.dataset.shape;
                this.setBrushShape(shape);
            });
        });
        
        // 笔刷设置
        this.setupBrushSettingsListeners();
        
        // 撤销/重做
        this.modal.querySelector("#kook-mask-undo").addEventListener("click", () => this.undo());
        this.modal.querySelector("#kook-mask-redo").addEventListener("click", () => this.redo());
        this.modal.querySelector("#kook-mask-clear").addEventListener("click", () => this.clearMask());
        
        // 翻转按钮
        this.modal.querySelector("#kook-flip-h").addEventListener("click", () => this.flipHorizontal());
        this.modal.querySelector("#kook-flip-v").addEventListener("click", () => this.flipVertical());
        
        // 旋转按钮
        this.modal.querySelector("#kook-rotate-left").addEventListener("click", () => this.rotateLeft());
        this.modal.querySelector("#kook-rotate-right").addEventListener("click", () => this.rotateRight());
        
        // 图层设置
        this.modal.querySelector("#kook-show-image").addEventListener("change", (e) => {
            this.imageCanvas.style.opacity = e.target.checked ? "1" : "0";
        });
        this.modal.querySelector("#kook-show-mask").addEventListener("change", (e) => {
            this.maskCanvas.style.opacity = e.target.checked ? "1" : "0";
        });
        this.modal.querySelector("#kook-invert-mask").addEventListener("change", (e) => {
            this.isInverted = e.target.checked;
            this.updateMaskDisplay();
        });
        
        // 叠加图像控制 - 移到show方法中调用，确保每次打开都重新绑定
        
        // 画布事件
        this.canvasContainer.addEventListener("mousedown", (e) => this.handleMouseDown(e));
        this.canvasContainer.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        this.canvasContainer.addEventListener("mouseup", () => this.handleMouseUp());
        this.canvasContainer.addEventListener("mouseleave", () => this.handleMouseLeave());
        this.canvasContainer.addEventListener("wheel", (e) => this.handleWheel(e), { passive: false });
        
        // 键盘快捷键 - 使用 keydown 捕获
        document.addEventListener("keydown", (e) => this.handleKeyDown(e), true);
        
        // 窗口大小改变时重新计算缩放
        window.addEventListener("resize", () => {
            if (this.modal.open && this.imageWidth > 0) {
                this.fitImageToWindow();
            }
        });
        
        // 监听弹窗关闭事件（用户点击backdrop或按ESC）
        this.modal.addEventListener("close", () => {
            console.log("[KOOK_图像蒙版编辑] 弹窗close事件触发");
            if (this.isApplying) {
                console.log("[KOOK_图像蒙版编辑] 正在应用蒙版中，忽略close事件");
            } else if (this.currentNodeId && this.sessionId) {
                // 如果不是通过按钮正常关闭的，发送取消信号
                console.log("[KOOK_图像蒙版编辑] 弹窗非正常关闭，发送取消信号");
                this.cleanupAndClose(true);
            }
        });
    }
    
    // 设置叠加图像事件监听器
    setupOverlayEventListeners() {
        // 先清理旧的事件监听器
        if (this.cleanupTransformListeners) {
            this.cleanupTransformListeners();
            this.cleanupTransformListeners = null;
        }
        
        // 变换控件交互
        const transformBox = this.modal.querySelector(".kook-transform-box");
        if (!transformBox) return;
        
        let isDragging = false;
        let isResizing = false;
        let isRotating = false;
        let startX, startY;
        let startTransform = {};
        let activeHandle = null;
        
        // 处理鼠标按下
        const handleMouseDown = (e) => {
            if (!this.overlayImage) return;
            
            const handle = e.target.dataset.handle;
            
            if (handle) {
                // 点击了控制点
                if (handle === "rotate") {
                    isRotating = true;
                } else {
                    isResizing = true;
                    activeHandle = handle;
                }
            } else if (e.target.classList.contains("kook-transform-box") || 
                       e.target.classList.contains("kook-transform-border")) {
                // 点击了变换框内部 - 开始拖拽移动
                isDragging = true;
            }
            
            if (isDragging || isResizing || isRotating) {
                e.preventDefault();
                e.stopPropagation();
                startX = e.clientX;
                startY = e.clientY;
                startTransform = { ...this.overlayTransform };
            }
        };
        
        // 绑定鼠标按下事件
        transformBox.addEventListener("mousedown", handleMouseDown);
        
        // 处理鼠标移动
        const handleMouseMove = (e) => {
            if (!isDragging && !isResizing && !isRotating) return;
            
            const dx = (e.clientX - startX) / this.zoom;
            const dy = (e.clientY - startY) / this.zoom;
            
            if (isDragging) {
                // 移动
                this.overlayTransform.x = startTransform.x + dx;
                this.overlayTransform.y = startTransform.y + dy;
            } else if (isResizing) {
                // 缩放 - 降低灵敏度
                const scaleFactor = 0.002;
                let scaleDelta = 0;
                
                // 根据拖拽方向计算缩放
                if (activeHandle.includes('r')) {
                    scaleDelta += dx * scaleFactor;
                }
                if (activeHandle.includes('l')) {
                    scaleDelta -= dx * scaleFactor;
                }
                if (activeHandle.includes('b')) {
                    scaleDelta += dy * scaleFactor;
                }
                if (activeHandle.includes('t')) {
                    scaleDelta -= dy * scaleFactor;
                }
                
                const newScale = Math.max(0.1, Math.min(5, startTransform.scale + scaleDelta));
                this.overlayTransform.scale = newScale;
            } else if (isRotating) {
                // 旋转
                const centerX = this.overlayTransform.x + (this.overlayImage.width * this.overlayTransform.scale) / 2;
                const centerY = this.overlayTransform.y + (this.overlayImage.height * this.overlayTransform.scale) / 2;
                
                const startAngle = Math.atan2(startY - centerY, startX - centerX);
                const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                const rotationDelta = (currentAngle - startAngle) * 180 / Math.PI;
                
                this.overlayTransform.rotation = (startTransform.rotation + rotationDelta) % 360;
            }
            
            this.renderOverlay();
            this.updateTransformControls();
        };
        
        // 处理鼠标释放
        const handleMouseUp = () => {
            isDragging = false;
            isResizing = false;
            isRotating = false;
            activeHandle = null;
        };
        
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        
        // 保存清理函数
        this.cleanupTransformListeners = () => {
            transformBox.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }
    
    setupBrushSettingsListeners() {
        // 大小
        const sizeSlider = this.modal.querySelector("#kook-brush-size");
        const sizeInput = this.modal.querySelector("#kook-brush-size-input");
        
        const updateSize = (value) => {
            this.brushSettings.size = parseInt(value);
            sizeSlider.value = this.brushSettings.size;
            sizeInput.value = this.brushSettings.size;
            this.updateBrushCursor();
            this.showBrushPreview();
        };
        
        sizeSlider.addEventListener("input", (e) => updateSize(e.target.value));
        sizeInput.addEventListener("change", (e) => updateSize(e.target.value));
        
        // 蒙版颜色选择
        const maskColorInput = this.modal.querySelector("#kook-mask-color");
        maskColorInput.addEventListener("input", (e) => {
            this.brushSettings.maskColor = e.target.value;
            this.updateMaskColor();
            this.updateBrushCursor();
            this.updateMaskDisplay();
        });
        
        // 不透明度
        const opacitySlider = this.modal.querySelector("#kook-brush-opacity");
        const opacityInput = this.modal.querySelector("#kook-brush-opacity-input");
        opacitySlider.addEventListener("input", (e) => {
            this.brushSettings.opacity = parseFloat(e.target.value);
            opacityInput.value = this.brushSettings.opacity;
        });
        opacityInput.addEventListener("change", (e) => {
            this.brushSettings.opacity = parseFloat(e.target.value);
            opacitySlider.value = this.brushSettings.opacity;
        });
        
        // 硬度
        const hardnessSlider = this.modal.querySelector("#kook-brush-hardness");
        const hardnessInput = this.modal.querySelector("#kook-brush-hardness-input");
        hardnessSlider.addEventListener("input", (e) => {
            this.brushSettings.hardness = parseFloat(e.target.value);
            hardnessInput.value = this.brushSettings.hardness;
            this.updateBrushCursor();
        });
        hardnessInput.addEventListener("change", (e) => {
            this.brushSettings.hardness = parseFloat(e.target.value);
            hardnessSlider.value = this.brushSettings.hardness;
        });
        
        // 间距
        const spacingSlider = this.modal.querySelector("#kook-brush-spacing");
        const spacingInput = this.modal.querySelector("#kook-brush-spacing-input");
        spacingSlider.addEventListener("input", (e) => {
            this.brushSettings.spacing = parseFloat(e.target.value);
            spacingInput.value = this.brushSettings.spacing;
        });
        spacingInput.addEventListener("change", (e) => {
            this.brushSettings.spacing = parseFloat(e.target.value);
            spacingSlider.value = this.brushSettings.spacing;
        });
    }
    
    // 更新蒙版颜色显示
    updateMaskColor() {
        // 将蒙版颜色应用到画布显示
        const color = this.brushSettings.maskColor;
        // 使用CSS滤镜或混合模式来显示蒙版颜色
        this.maskCanvas.style.mixBlendMode = "normal";
    }
    
    // 设置画笔形状
    setBrushShape(shape) {
        this.brushSettings.shape = shape;
        
        // 更新UI
        this.modal.querySelectorAll(".kook-shape-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        this.modal.querySelector(`[data-shape="${shape}"]`)?.classList.add("active");
        
        this.updateBrushCursor();
        this.showBrushPreview();
    }
    
    // 显示画笔大小预览 - 缩短显示时间到300ms
    showBrushPreview() {
        // 清除之前的定时器
        if (this.brushPreviewTimer) {
            clearTimeout(this.brushPreviewTimer);
        }
        
        // 设置预览大小
        const previewSize = this.brushSettings.size * this.zoom;
        this.brushPreview.style.width = `${previewSize}px`;
        this.brushPreview.style.height = `${previewSize}px`;
        
        // 根据形状设置圆角
        if (this.brushSettings.shape === "circle") {
            this.brushPreview.style.borderRadius = "50%";
        } else {
            this.brushPreview.style.borderRadius = "2px";
        }
        
        // 根据工具设置颜色
        if (this.currentTool === "eraser") {
            this.brushPreview.style.background = "rgba(255, 255, 255, 0.3)";
            this.brushPreview.style.borderColor = "rgba(255, 255, 255, 0.95)";
        } else {
            this.brushPreview.style.background = `${this.brushSettings.maskColor}4D`;
            this.brushPreview.style.borderColor = this.brushSettings.maskColor;
        }
        
        // 显示预览
        this.brushPreview.classList.add("show");
        
        // 缩短到300ms后隐藏
        this.brushPreviewTimer = setTimeout(() => {
            this.brushPreview.classList.remove("show");
        }, 300);
    }
    
    switchTool(tool) {
        this.currentTool = tool;
        
        // 更新UI
        this.modal.querySelectorAll(".kook-tool-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        
        // 隐藏变换控件
        const transformControls = this.modal.querySelector("#kook-transform-controls");
        if (transformControls) {
            transformControls.style.display = "none";
        }
        
        if (tool === "brush" || tool === "eraser") {
            this.modal.querySelector(`[data-tool="${tool}"]`)?.classList.add("active");
            this.canvasContainer.style.cursor = "crosshair";
            this.brushCursor.style.display = "block";
        } else if (tool === "rect-select" || tool === "ellipse-select") {
            this.modal.querySelector(`[data-tool="${tool}"]`)?.classList.add("active");
            this.canvasContainer.style.cursor = "crosshair";
            this.brushCursor.style.display = "none";
        } else if (tool === "select") {
            this.modal.querySelector(`[data-tool="${tool}"]`)?.classList.add("active");
            this.canvasContainer.style.cursor = "default";
            this.brushCursor.style.display = "none";
            // 显示变换控件
            if (this.overlayImage && transformControls) {
                this.updateTransformControls();
                transformControls.style.display = "block";
            }
        } else if (tool === "hand") {
            this.modal.querySelector(`[data-tool="${tool}"]`)?.classList.add("active");
            this.canvasContainer.style.cursor = "grab";
            this.brushCursor.style.display = "none";
        } else if (tool === "zoom-in") {
            this.zoomIn();
        } else if (tool === "zoom-out") {
            this.zoomOut();
        } else if (tool === "reset-zoom") {
            this.fitImageToWindow();
        }
        
        this.updateBrushCursor();
    }
    
    updateBrushCursor() {
        const size = this.brushSettings.size * this.zoom;
        this.brushCursor.style.width = `${size}px`;
        this.brushCursor.style.height = `${size}px`;
        
        // 根据形状设置光标样式
        if (this.brushSettings.shape === "circle") {
            this.brushCursor.style.borderRadius = "50%";
        } else {
            this.brushCursor.style.borderRadius = "2px";
        }
        
        this.brushCursor.style.borderColor = this.currentTool === "eraser" ? "#fff" : this.brushSettings.maskColor;
    }
    
    // 获取画布坐标
    getCanvasCoordinates(e) {
        const rect = this.canvasContainer.getBoundingClientRect();
        // 考虑图片偏移和缩放
        const x = (e.clientX - rect.left - this.imageOffsetX) / this.zoom;
        const y = (e.clientY - rect.top - this.imageOffsetY) / this.zoom;
        return { x, y };
    }
    
    handleMouseDown(e) {
        // 中键(1) 或 Alt+左键 或 Ctrl+左键 都可以拖拽
        const isPanButton = e.button === 1; // 中键
        const isAltLeftClick = e.button === 0 && e.altKey; // Alt+左键
        const isCtrlLeftClick = e.button === 0 && e.ctrlKey; // Ctrl+左键
        
        if (isPanButton || isAltLeftClick || isCtrlLeftClick) {
            e.preventDefault();
            e.stopPropagation();
            this.isPanning = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvasContainer.style.cursor = "grabbing";
            console.log("[KOOK_图像蒙版编辑] 开始拖拽, 按钮:", e.button, "altKey:", e.altKey, "ctrlKey:", e.ctrlKey);
            return;
        }
        
        if (e.button !== 0) return;
        
        const coords = this.getCanvasCoordinates(e);
        
        if (this.currentTool === "brush" || this.currentTool === "eraser") {
            this.isDrawing = true;
            this.lastX = coords.x;
            this.lastY = coords.y;
            
            // 保存历史记录
            this.saveHistory();
            
            // 绘制单点
            this.draw(coords.x, coords.y);
        } else if (this.currentTool === "rect-select" || this.currentTool === "ellipse-select") {
            this.isSelecting = true;
            this.selectionStart = { x: coords.x, y: coords.y };
            this.selectionEnd = { x: coords.x, y: coords.y };
            this.saveHistory();
        }
    }
    
    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e);
        
        // 更新笔刷光标位置
        const cursorSize = this.brushSettings.size * this.zoom;
        const rect = this.canvasContainer.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - cursorSize / 2;
        const cursorY = e.clientY - rect.top - cursorSize / 2;
        
        this.brushCursor.style.left = `${cursorX}px`;
        this.brushCursor.style.top = `${cursorY}px`;
        this.brushCursor.style.display = "block";
        
        if (this.isPanning) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.imageOffsetX += dx;
            this.imageOffsetY += dy;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.updateCanvasTransform();
            console.log("[KOOK_图像蒙版编辑] 图片偏移:", this.imageOffsetX, this.imageOffsetY);
        } else if (this.isDrawing) {
            this.drawLine(this.lastX, this.lastY, coords.x, coords.y);
            this.lastX = coords.x;
            this.lastY = coords.y;
        } else if (this.isSelecting) {
            this.selectionEnd = { x: coords.x, y: coords.y };
            this.drawSelectionPreview(e.shiftKey);
        }
    }
    
    handleMouseUp() {
        if (this.isSelecting) {
            this.applySelection();
            this.isSelecting = false;
        }
        this.isDrawing = false;
        if (this.isPanning) {
            this.isPanning = false;
            this.canvasContainer.style.cursor = "default";
            console.log("[KOOK_图像蒙版编辑] 结束拖拽");
        }
    }
    
    handleMouseLeave() {
        this.brushCursor.style.display = "none";
    }
    
    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.setZoom(this.zoom * delta, e.clientX, e.clientY);
    }
    
    handleKeyDown(e) {
        // 只在弹窗打开时处理快捷键
        if (!this.modal.open) return;
        
        if (e.ctrlKey || e.metaKey) {
            if (e.key === "z") {
                e.preventDefault();
                e.stopPropagation();
                if (e.shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
            } else if (e.key === "y") {
                e.preventDefault();
                e.stopPropagation();
                this.redo();
            }
        } else {
            switch (e.key.toLowerCase()) {
                case "b":
                    e.preventDefault();
                    this.switchTool("brush");
                    break;
                case "e":
                    e.preventDefault();
                    this.switchTool("eraser");
                    break;
                case "h":
                    e.preventDefault();
                    this.switchTool("hand");
                    break;
                case " ":
                    e.preventDefault();
                    this.switchTool("hand");
                    break;
                case "escape":
                    e.preventDefault();
                    if (this.isApplying) {
                        console.log("[KOOK_图像蒙版编辑] 正在应用蒙版中，忽略ESC键");
                    } else {
                        this.cleanupAndClose(true);
                    }
                    break;
                case "r":
                    e.preventDefault();
                    this.switchTool("rect-select");
                    break;
                case "o":
                    e.preventDefault();
                    this.switchTool("ellipse-select");
                    break;
            }
        }
    }
    
    // 绘制 - 修复绘制问题
    draw(x, y) {
        const ctx = this.maskCtx;
        const size = this.brushSettings.size;
        const opacity = this.brushSettings.opacity;
        const hardness = this.brushSettings.hardness;
        const shape = this.brushSettings.shape;
        const radius = size / 2;
        
        ctx.save();
        
        if (this.currentTool === "eraser") {
            // 橡皮擦模式 - 清除蒙版
            ctx.globalCompositeOperation = "destination-out";
            ctx.globalAlpha = opacity;
            
            if (shape === "circle") {
                // 圆形橡皮擦
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                
                if (hardness < 1) {
                    // 软边
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
                    gradient.addColorStop(Math.max(0, hardness), `rgba(0, 0, 0, ${Math.max(0.01, hardness * 0.5)})`);
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = "rgba(0, 0, 0, 1)";
                }
                ctx.fill();
            } else {
                // 方形橡皮擦
                if (hardness < 1) {
                    // 软边方形 - 使用径向渐变模拟
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = size;
                    tempCanvas.height = size;
                    const tempCtx = tempCanvas.getContext("2d");
                    
                    const gradient = tempCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
                    gradient.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
                    gradient.addColorStop(Math.max(0, hardness), `rgba(0, 0, 0, ${opacity * Math.max(0.01, hardness)})`);
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    
                    tempCtx.fillStyle = gradient;
                    tempCtx.fillRect(0, 0, size, size);
                    
                    ctx.drawImage(tempCanvas, x - radius, y - radius);
                } else {
                    // 硬边方形
                    ctx.clearRect(x - radius, y - radius, size, size);
                }
            }
        } else {
            // 画笔模式 - 绘制蒙版（白色）
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = opacity;
            
            if (shape === "circle") {
                // 圆形画笔
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                
                if (hardness < 1) {
                    // 软边
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
                    gradient.addColorStop(Math.max(0, hardness), `rgba(255, 255, 255, ${Math.max(0.01, hardness * 0.5)})`);
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = "#ffffff";
                }
                ctx.fill();
            } else {
                // 方形画笔
                if (hardness < 1) {
                    // 软边方形
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = size;
                    tempCanvas.height = size;
                    const tempCtx = tempCanvas.getContext("2d");
                    
                    const gradient = tempCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                    gradient.addColorStop(Math.max(0, hardness), `rgba(255, 255, 255, ${opacity * Math.max(0.01, hardness)})`);
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                    
                    tempCtx.fillStyle = gradient;
                    tempCtx.fillRect(0, 0, size, size);
                    
                    ctx.drawImage(tempCanvas, x - radius, y - radius);
                } else {
                    // 硬边方形
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(x - radius, y - radius, size, size);
                }
            }
        }
        
        ctx.restore();
        
        // 更新蒙版显示颜色
        this.updateMaskDisplay();
    }
    
    drawLine(x1, y1, x2, y2) {
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const stepSize = this.brushSettings.size * this.brushSettings.spacing;
        const steps = Math.max(1, Math.floor(distance / Math.max(stepSize, 1)));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            this.draw(x, y);
        }
    }
    
    updateMaskDisplay() {
        // 根据蒙版颜色设置显示
        const color = this.brushSettings.maskColor;
        
        // 获取或创建颜色层canvas
        let colorCanvas = this.modal.querySelector("#kook-mask-color-layer");
        if (!colorCanvas) {
            colorCanvas = document.createElement("canvas");
            colorCanvas.id = "kook-mask-color-layer";
            colorCanvas.className = "kook-canvas kook-mask-canvas";
            colorCanvas.style.zIndex = "3";  // 在蒙版层之上
            colorCanvas.style.pointerEvents = "none";  // 不拦截鼠标事件
            colorCanvas.style.opacity = "0.5";  // 半透明，可以看到下面的图片
            // 插入到蒙版层之后（上面）
            if (this.maskCanvas.nextSibling) {
                this.canvasContainer.insertBefore(colorCanvas, this.maskCanvas.nextSibling);
            } else {
                this.canvasContainer.appendChild(colorCanvas);
            }
        }
        
        // 设置颜色层尺寸和变换（必须与蒙版层完全一致）
        colorCanvas.width = this.maskCanvas.width;
        colorCanvas.height = this.maskCanvas.height;
        colorCanvas.style.width = this.maskCanvas.style.width;
        colorCanvas.style.height = this.maskCanvas.style.height;
        colorCanvas.style.marginLeft = this.maskCanvas.style.marginLeft;
        colorCanvas.style.marginTop = this.maskCanvas.style.marginTop;
        colorCanvas.style.transform = this.maskCanvas.style.transform;
        colorCanvas.style.transformOrigin = this.maskCanvas.style.transformOrigin;
        
        const colorCtx = colorCanvas.getContext("2d");
        
        // 清除颜色层
        colorCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
        
        if (this.isInverted) {
            // 反转模式：填充整个颜色层，然后擦除蒙版区域
            colorCtx.fillStyle = color;
            colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
            // 使用destination-out模式擦除蒙版区域
            colorCtx.globalCompositeOperation = 'destination-out';
            colorCtx.drawImage(this.maskCanvas, 0, 0);
        } else {
            // 正常模式：在蒙版区域填充选中颜色
            // 1. 先绘制蒙版
            colorCtx.drawImage(this.maskCanvas, 0, 0);
            // 2. 使用source-in模式，只在蒙版非透明区域绘制
            colorCtx.globalCompositeOperation = 'source-in';
            // 3. 填充选中颜色
            colorCtx.fillStyle = color;
            colorCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
        }
        
        // 重置混合模式
        colorCtx.globalCompositeOperation = 'source-over';
    }
    
    flipHorizontal() {
        this.saveHistory();
        
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = this.maskCanvas.width;
        tempCanvas.height = this.maskCanvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        
        tempCtx.translate(tempCanvas.width, 0);
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(this.maskCanvas, 0, 0);
        
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.maskCtx.drawImage(tempCanvas, 0, 0);
        
        // 同时翻转图片
        const imgTempCanvas = document.createElement("canvas");
        imgTempCanvas.width = this.imageCanvas.width;
        imgTempCanvas.height = this.imageCanvas.height;
        const imgTempCtx = imgTempCanvas.getContext("2d");
        
        imgTempCtx.translate(imgTempCanvas.width, 0);
        imgTempCtx.scale(-1, 1);
        imgTempCtx.drawImage(this.imageCanvas, 0, 0);
        
        this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.imageCtx.drawImage(imgTempCanvas, 0, 0);
        // 翻转后更新颜色显示
        this.updateMaskDisplay();
    }

    flipVertical() {
        this.saveHistory();
        
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = this.maskCanvas.width;
        tempCanvas.height = this.maskCanvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        
        tempCtx.translate(0, tempCanvas.height);
        tempCtx.scale(1, -1);
        tempCtx.drawImage(this.maskCanvas, 0, 0);
        
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.maskCtx.drawImage(tempCanvas, 0, 0);
        
        // 同时翻转图片
        const imgTempCanvas = document.createElement("canvas");
        imgTempCanvas.width = this.imageCanvas.width;
        imgTempCanvas.height = this.imageCanvas.height;
        const imgTempCtx = imgTempCanvas.getContext("2d");
        
        imgTempCtx.translate(0, imgTempCanvas.height);
        imgTempCtx.scale(1, -1);
        imgTempCtx.drawImage(this.imageCanvas, 0, 0);
        
        this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.imageCtx.drawImage(imgTempCanvas, 0, 0);
        // 翻转后更新颜色显示
        this.updateMaskDisplay();
    }

    rotateLeft() {
        this.saveHistory();
        this.rotateCanvas(-90);
    }
    
    rotateRight() {
        this.saveHistory();
        this.rotateCanvas(90);
    }
    
    rotateCanvas(degrees) {
        const angle = degrees * Math.PI / 180;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        
        // 旋转蒙版
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = this.maskCanvas.height;
        tempCanvas.height = this.maskCanvas.width;
        const tempCtx = tempCanvas.getContext("2d");
        
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate(angle);
        tempCtx.drawImage(this.maskCanvas, -this.maskCanvas.width / 2, -this.maskCanvas.height / 2);
        
        this.maskCanvas.width = tempCanvas.width;
        this.maskCanvas.height = tempCanvas.height;
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        this.maskCtx.drawImage(tempCanvas, 0, 0);
        
        // 旋转图片
        const imgTempCanvas = document.createElement("canvas");
        imgTempCanvas.width = this.imageCanvas.height;
        imgTempCanvas.height = this.imageCanvas.width;
        const imgTempCtx = imgTempCanvas.getContext("2d");
        
        imgTempCtx.translate(imgTempCanvas.width / 2, imgTempCanvas.height / 2);
        imgTempCtx.rotate(angle);
        imgTempCtx.drawImage(this.imageCanvas, -this.imageCanvas.width / 2, -this.imageCanvas.height / 2);
        
        this.imageCanvas.width = imgTempCanvas.width;
        this.imageCanvas.height = imgTempCanvas.height;
        this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.imageCtx.drawImage(imgTempCanvas, 0, 0);
        
        // 更新尺寸
        this.imageWidth = this.imageCanvas.width;
        this.imageHeight = this.imageCanvas.height;
        this.modal.querySelector("#kook-image-dimensions").textContent = `${this.imageWidth} x ${this.imageHeight}`;
        this.fitImageToWindow();
        // 旋转后更新颜色显示
        this.updateMaskDisplay();
    }
    
    drawSelectionPreview(constrainRatio) {
        // 创建或更新选区预览层
        let previewLayer = this.modal.querySelector("#kook-selection-preview");
        if (!previewLayer) {
            previewLayer = document.createElement("canvas");
            previewLayer.id = "kook-selection-preview";
            previewLayer.style.position = "absolute";
            previewLayer.style.top = "0";
            previewLayer.style.left = "0";
            previewLayer.style.pointerEvents = "none";
            previewLayer.style.zIndex = "50";
            this.canvasContainer.appendChild(previewLayer);
        }
        
        previewLayer.width = this.maskCanvas.width;
        previewLayer.height = this.maskCanvas.height;
        previewLayer.style.width = `${this.maskCanvas.width * this.zoom}px`;
        previewLayer.style.height = `${this.maskCanvas.height * this.zoom}px`;
        
        const ctx = previewLayer.getContext("2d");
        ctx.clearRect(0, 0, previewLayer.width, previewLayer.height);
        
        // 计算选区坐标
        let x1 = this.selectionStart.x;
        let y1 = this.selectionStart.y;
        let x2 = this.selectionEnd.x;
        let y2 = this.selectionEnd.y;
        
        let width = x2 - x1;
        let height = y2 - y1;
        
        // 按住SHIFT等比例缩放
        if (constrainRatio) {
            const size = Math.max(Math.abs(width), Math.abs(height));
            width = width >= 0 ? size : -size;
            height = height >= 0 ? size : -size;
            x2 = x1 + width;
            y2 = y1 + height;
        }
        
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(width);
        const h = Math.abs(height);
        
        // 绘制选区边框
        ctx.strokeStyle = this.brushSettings.maskColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        if (this.currentTool === "rect-select") {
            ctx.strokeRect(x, y, w, h);
            // 填充半透明
            ctx.fillStyle = `${this.brushSettings.maskColor}33`;
            ctx.fillRect(x, y, w, h);
        } else if (this.currentTool === "ellipse-select") {
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            ctx.stroke();
            // 填充半透明
            ctx.fillStyle = `${this.brushSettings.maskColor}33`;
            ctx.fill();
        }
    }
    
    applySelection() {
        // 移除预览层
        const previewLayer = this.modal.querySelector("#kook-selection-preview");
        if (previewLayer) {
            previewLayer.remove();
        }
        
        // 计算选区坐标
        let x1 = this.selectionStart.x;
        let y1 = this.selectionStart.y;
        let x2 = this.selectionEnd.x;
        let y2 = this.selectionEnd.y;
        
        const width = x2 - x1;
        const height = y2 - y1;
        
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(width);
        const h = Math.abs(height);
        
        if (w < 2 || h < 2) return; // 选区太小，忽略
        
        this.maskCtx.save();
        this.maskCtx.globalCompositeOperation = "source-over";
        this.maskCtx.globalAlpha = this.brushSettings.opacity;
        
        if (this.currentTool === "rect-select") {
            // 方框选区 - 填充白色
            this.maskCtx.fillStyle = "#ffffff";
            this.maskCtx.fillRect(x, y, w, h);
        } else if (this.currentTool === "ellipse-select") {
            // 椭圆选区 - 填充白色
            this.maskCtx.fillStyle = "#ffffff";
            this.maskCtx.beginPath();
            this.maskCtx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            this.maskCtx.fill();
        }
        
        this.maskCtx.restore();
        this.updateMaskDisplay();
    }
    
    saveHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(this.maskCanvas.toDataURL());
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreHistory();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreHistory();
        }
    }
    
    restoreHistory() {
        const img = new Image();
        img.onload = () => {
            this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
            this.maskCtx.drawImage(img, 0, 0);
            // 恢复历史后更新颜色显示
            this.updateMaskDisplay();
        };
        img.src = this.history[this.historyIndex];
    }
    
    clearMask() {
        this.saveHistory();
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        // 清除后更新颜色显示
        this.updateMaskDisplay();
    }
    
    fitImageToWindow() {
        if (!this.imageWidth || !this.imageHeight) return;
        
        const wrapperRect = this.canvasWrapper.getBoundingClientRect();
        const padding = 60;
        
        const availableWidth = wrapperRect.width - padding * 2;
        const availableHeight = wrapperRect.height - padding * 2;
        
        const scaleX = availableWidth / this.imageWidth;
        const scaleY = availableHeight / this.imageHeight;
        this.zoom = Math.min(scaleX, scaleY, 1);
        this.zoom = Math.max(this.zoom, 0.1);
        
        const scaledWidth = this.imageWidth * this.zoom;
        const scaledHeight = this.imageHeight * this.zoom;
        
        this.modal.querySelector("#kook-zoom-level").textContent = `${Math.round(this.zoom * 100)}%`;
        
        this.updateCanvasTransform();
        this.updateBrushCursor();
        this.updateContainerSize();
    }
    
    updateContainerSize() {
        const scaledWidth = this.imageWidth * this.zoom;
        const scaledHeight = this.imageHeight * this.zoom;
        this.canvasContainer.style.width = `${scaledWidth}px`;
        this.canvasContainer.style.height = `${scaledHeight}px`;
    }
    
    setZoom(newZoom, centerX, centerY) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(0.1, Math.min(5, newZoom));
        
        this.modal.querySelector("#kook-zoom-level").textContent = `${Math.round(this.zoom * 100)}%`;
        
        if (centerX !== undefined && centerY !== undefined) {
            const rect = this.canvasContainer.getBoundingClientRect();
            const x = centerX - rect.left;
            const y = centerY - rect.top;
            this.imageOffsetX = x - (x - this.imageOffsetX) * (this.zoom / oldZoom);
            this.imageOffsetY = y - (y - this.imageOffsetY) * (this.zoom / oldZoom);
        }
        
        this.updateCanvasTransform();
        this.updateBrushCursor();
        this.updateContainerSize();
    }
    
    zoomIn() {
        this.setZoom(this.zoom * 1.2);
    }
    
    zoomOut() {
        this.setZoom(this.zoom / 1.2);
    }
    
    resetZoom() {
        this.zoom = 1;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.modal.querySelector("#kook-zoom-level").textContent = "100%";
        this.updateCanvasTransform();
        this.updateBrushCursor();
        this.updateContainerSize();
    }
    
    updateCanvasTransform() {
        // 只应用缩放，图片位置通过margin或transform调整
        const scaleTransform = `scale(${this.zoom})`;
        this.imageCanvas.style.transform = scaleTransform;
        this.imageCanvas.style.transformOrigin = "top left";
        this.maskCanvas.style.transform = scaleTransform;
        this.maskCanvas.style.transformOrigin = "top left";
        
        // 设置图片位置偏移
        this.imageCanvas.style.marginLeft = `${this.imageOffsetX}px`;
        this.imageCanvas.style.marginTop = `${this.imageOffsetY}px`;
        this.maskCanvas.style.marginLeft = `${this.imageOffsetX}px`;
        this.maskCanvas.style.marginTop = `${this.imageOffsetY}px`;
        
        // 同步叠加图像变换
        this.updateOverlayTransform();
    }
    
    // 设置叠加图像canvas
    setupOverlayCanvas() {
        // 移除旧的叠加图像canvas
        if (this.overlayCanvas) {
            this.overlayCanvas.remove();
        }
        
        if (!this.overlayImage) {
            return;
        }
        
        // 创建新的叠加图像canvas
        this.overlayCanvas = document.createElement("canvas");
        this.overlayCanvas.id = "kook-overlay-canvas";
        this.overlayCanvas.className = "kook-canvas kook-overlay-canvas";
        this.overlayCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            z-index: 4;
            pointer-events: none;
        `;
        
        // 设置canvas尺寸与主图像一致
        this.overlayCanvas.width = this.imageCanvas.width;
        this.overlayCanvas.height = this.imageCanvas.height;
        
        // 添加到容器
        this.canvasContainer.appendChild(this.overlayCanvas);
        this.overlayCtx = this.overlayCanvas.getContext("2d");
        
        // 渲染叠加图像
        this.renderOverlay();
    }
    
    // 渲染叠加图像
    renderOverlay() {
        if (!this.overlayCanvas || !this.overlayCtx || !this.overlayImage) {
            return;
        }
        
        // 清空canvas
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // 保存当前状态
        this.overlayCtx.save();
        
        // 应用变换
        const centerX = this.overlayTransform.x + (this.overlayImage.width * this.overlayTransform.scale) / 2;
        const centerY = this.overlayTransform.y + (this.overlayImage.height * this.overlayTransform.scale) / 2;
        
        this.overlayCtx.translate(centerX, centerY);
        this.overlayCtx.rotate((this.overlayTransform.rotation * Math.PI) / 180);
        this.overlayCtx.scale(this.overlayTransform.scale, this.overlayTransform.scale);
        
        // 绘制图像（居中）
        this.overlayCtx.drawImage(
            this.overlayImage,
            -this.overlayImage.width / 2,
            -this.overlayImage.height / 2
        );
        
        // 恢复状态
        this.overlayCtx.restore();
        
        // 同步变换到样式（用于缩放显示）
        this.updateOverlayTransform();
    }
    
    // 更新叠加图像的CSS变换
    updateOverlayTransform() {
        if (!this.overlayCanvas) return;
        
        // 获取当前缩放比例
        const scale = this.zoom || 1;
        
        // 应用与主图像相同的变换
        this.overlayCanvas.style.width = this.imageCanvas.style.width;
        this.overlayCanvas.style.height = this.imageCanvas.style.height;
        this.overlayCanvas.style.marginLeft = this.imageCanvas.style.marginLeft;
        this.overlayCanvas.style.marginTop = this.imageCanvas.style.marginTop;
        this.overlayCanvas.style.transform = this.imageCanvas.style.transform;
        this.overlayCanvas.style.transformOrigin = this.imageCanvas.style.transformOrigin;
        
        // 更新变换控件位置
        if (this.currentTool === "select") {
            this.updateTransformControls();
        }
    }
    
    // 更新变换控件位置和大小
    updateTransformControls() {
        const transformControls = this.modal.querySelector("#kook-transform-controls");
        const transformBox = this.modal.querySelector(".kook-transform-box");
        if (!transformControls || !transformBox || !this.overlayImage) return;
        
        // 计算叠加图像在屏幕上的位置和大小
        const scaledWidth = this.overlayImage.width * this.overlayTransform.scale * this.zoom;
        const scaledHeight = this.overlayImage.height * this.overlayTransform.scale * this.zoom;
        
        // 计算中心点（考虑旋转）
        const centerX = this.overlayTransform.x + (this.overlayImage.width * this.overlayTransform.scale) / 2;
        const centerY = this.overlayTransform.y + (this.overlayImage.height * this.overlayTransform.scale) / 2;
        
        // 应用缩放后的位置
        const screenX = centerX * this.zoom + this.imageOffsetX - scaledWidth / 2;
        const screenY = centerY * this.zoom + this.imageOffsetY - scaledHeight / 2;
        
        // 设置变换框的位置和大小
        transformBox.style.left = `${screenX}px`;
        transformBox.style.top = `${screenY}px`;
        transformBox.style.width = `${scaledWidth}px`;
        transformBox.style.height = `${scaledHeight}px`;
        transformBox.style.transform = `rotate(${this.overlayTransform.rotation}deg)`;
        transformBox.style.transformOrigin = "center center";
    }
    
    // 更新叠加图像控件显示状态
    updateOverlayControls() {
        const transformControls = this.modal.querySelector("#kook-transform-controls");
        if (!transformControls) return;
        
        if (this.overlayImage && this.currentTool === "select") {
            this.updateTransformControls();
            transformControls.style.display = "block";
        } else {
            transformControls.style.display = "none";
        }
    }
    
    // 设置叠加图像位置
    setOverlayPosition(x, y) {
        this.overlayTransform.x = x;
        this.overlayTransform.y = y;
        this.renderOverlay();
        this.updateTransformControls();
    }
    
    // 设置叠加图像缩放
    setOverlayScale(scale) {
        this.overlayTransform.scale = Math.max(0.1, Math.min(5, scale));
        this.renderOverlay();
        this.updateTransformControls();
    }
    
    // 设置叠加图像旋转
    setOverlayRotation(rotation) {
        this.overlayTransform.rotation = rotation % 360;
        this.renderOverlay();
        this.updateTransformControls();
    }
    
    async applyMask() {
        console.log("[KOOK_图像蒙版编辑] 应用蒙版, sessionId:", this.sessionId);
        if (!this.sessionId) {
            console.error("[KOOK_图像蒙版编辑] 错误: 缺少sessionId");
            alert("错误: 缺少会话ID，请重新运行工作流");
            return;
        }
        
        // 防止重复提交
        if (this.isApplying) {
            console.log("[KOOK_图像蒙版编辑] 已经在应用蒙版中，忽略重复请求");
            return;
        }
        
        this.isApplying = true;
        
        // 先合并图像（在关闭弹窗前完成）
        let imageData = null;
        if (this.overlayImage) {
            console.log("[KOOK_图像蒙版编辑] 合并叠加图像到主图像");
            console.log("[KOOK_图像蒙版编辑] 叠加图像尺寸:", this.overlayImage.width, "x", this.overlayImage.height);
            console.log("[KOOK_图像蒙版编辑] 变换参数:", JSON.stringify(this.overlayTransform));
            try {
                // 创建临时canvas来合并图像
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = this.imageCanvas.width;
                tempCanvas.height = this.imageCanvas.height;
                const tempCtx = tempCanvas.getContext("2d");
                
                // 先绘制原图
                tempCtx.drawImage(this.imageCanvas, 0, 0);
                
                // 再绘制叠加图像（使用变换参数）
                tempCtx.save();
                const centerX = this.overlayTransform.x + (this.overlayImage.width * this.overlayTransform.scale) / 2;
                const centerY = this.overlayTransform.y + (this.overlayImage.height * this.overlayTransform.scale) / 2;
                console.log("[KOOK_图像蒙版编辑] 绘制中心点:", centerX, centerY);
                tempCtx.translate(centerX, centerY);
                tempCtx.rotate((this.overlayTransform.rotation * Math.PI) / 180);
                const drawX = -(this.overlayImage.width * this.overlayTransform.scale) / 2;
                const drawY = -(this.overlayImage.height * this.overlayTransform.scale) / 2;
                const drawW = this.overlayImage.width * this.overlayTransform.scale;
                const drawH = this.overlayImage.height * this.overlayTransform.scale;
                console.log("[KOOK_图像蒙版编辑] 绘制区域:", drawX, drawY, drawW, drawH);
                tempCtx.drawImage(this.overlayImage, drawX, drawY, drawW, drawH);
                tempCtx.restore();
                
                // 获取合并后的图像数据（使用jpeg格式提高速度）
                imageData = tempCanvas.toDataURL("image/jpeg", 0.95);
                console.log("[KOOK_图像蒙版编辑] 图像已合并，数据长度:", imageData ? imageData.length : 0);
                
                // 调试：将合并后的图像显示在新窗口中
                if (window.location.hash === '#debug') {
                    const debugWindow = window.open('', '_blank');
                    debugWindow.document.write('<h3>合并后的图像</h3>');
                    const img = debugWindow.document.createElement('img');
                    img.src = imageData;
                    img.style.maxWidth = '100%';
                    debugWindow.document.body.appendChild(img);
                }
            } catch (mergeErr) {
                console.error("[KOOK_图像蒙版编辑] 合并图像失败:", mergeErr);
            }
        }
        
        // 关闭弹窗
        this.modal.close();
        console.log("[KOOK_图像蒙版编辑] 弹窗已关闭，后台处理中...");
        
        try {
            
            // 直接发送蒙版canvas，不应用反转
            // 反转只是显示效果，实际蒙版数据保持白色=重绘区域
            const maskData = this.maskCanvas.toDataURL("image/png");
            
            console.log("[KOOK_图像蒙版编辑] 发送apply请求...");
            const response = await api.fetchApi("/kook_mask_editor/apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    node_id: this.currentNodeId,
                    session_id: this.sessionId,
                    mask_data: maskData,
                    image_data: imageData
                })
            });
            
            const result = await response.json();
            console.log("[KOOK_图像蒙版编辑] apply请求结果:", result);
            
            if (result.success) {
                this.cleanupAndClose(false);
            } else {
                console.error("[KOOK_图像蒙版编辑] 应用蒙版失败:", result.error);
                alert("应用蒙版失败: " + (result.error || "未知错误"));
                this.isApplying = false;
            }
        } catch (error) {
            console.error("[KOOK_图像蒙版编辑] 应用蒙版请求出错:", error);
            alert("应用蒙版请求出错，请查看控制台日志");
            this.isApplying = false;
        }
    }
    
    async cleanupAndClose(cancelled = false) {
        console.log("[KOOK_图像蒙版编辑] 清理并关闭弹窗, cancelled:", cancelled, "sessionId:", this.sessionId, "isApplying:", this.isApplying);
        
        // 如果正在应用蒙版且是取消操作，跳过（防止在apply过程中发送cancel）
        if (this.isApplying && cancelled) {
            console.log("[KOOK_图像蒙版编辑] 正在应用蒙版中，跳过取消请求");
            return;
        }
        
        if (cancelled && this.currentNodeId && this.sessionId) {
            try {
                console.log("[KOOK_图像蒙版编辑] 发送cancel请求...");
                const response = await api.fetchApi("/kook_mask_editor/cancel", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        node_id: this.currentNodeId,
                        session_id: this.sessionId
                    })
                });
                const result = await response.json();
                console.log("[KOOK_图像蒙版编辑] cancel请求结果:", result);
            } catch (error) {
                console.error("[KOOK_图像蒙版编辑] 发送取消信号失败:", error);
            }
        }
        
        if (this.brushPreviewTimer) {
            clearTimeout(this.brushPreviewTimer);
            this.brushPreviewTimer = null;
        }
        
        this.isDrawing = false;
        this.isPanning = false;
        this.currentTool = "select";
        this.zoom = 1;
        this.imageOffsetX = 0;
        this.imageOffsetY = 0;
        this.history = [];
        this.historyIndex = -1;
        this.imageWidth = 0;
        this.imageHeight = 0;
        this.isInverted = false;
        this.brushSettings.shape = "circle";
        
        this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
        
        // 重置margin
        this.imageCanvas.style.marginLeft = "0px";
        this.imageCanvas.style.marginTop = "0px";
        this.maskCanvas.style.marginLeft = "0px";
        this.maskCanvas.style.marginTop = "0px";
        
        // 重置UI状态
        this.modal.querySelector("#kook-invert-mask").checked = false;
        this.maskCanvas.style.filter = "none";
        
        // 重置应用状态
        this.isApplying = false;
        
        // 清理颜色层canvas
        const colorCanvas = this.modal.querySelector("#kook-mask-color-layer");
        if (colorCanvas) {
            colorCanvas.remove();
        }
        
        // 清理叠加图像canvas
        if (this.overlayCanvas) {
            this.overlayCanvas.remove();
            this.overlayCanvas = null;
            this.overlayCtx = null;
        }
        this.overlayImage = null;
        this.overlayTransform = { x: 0, y: 0, scale: 1, rotation: 0 };
        this.isEditingOverlay = false;
        
        // 清理变换控件事件监听
        if (this.cleanupTransformListeners) {
            this.cleanupTransformListeners();
            this.cleanupTransformListeners = null;
        }
        
        // 隐藏变换控件
        const transformControls = this.modal.querySelector("#kook-transform-controls");
        if (transformControls) {
            transformControls.style.display = "none";
        }
        
        console.log("[KOOK_图像蒙版编辑] 关闭弹窗");
        this.modal.close();
        console.log("[KOOK_图像蒙版编辑] 弹窗关闭完成, 状态:", this.modal.open ? "仍打开" : "已关闭");
    }
    
    show(nodeId, sessionId, imageData, width, height, overlayData = null) {
        console.log("[KOOK_图像蒙版编辑] 显示弹窗, nodeId:", nodeId, "sessionId:", sessionId, "尺寸:", width, "x", height);
        console.log("[KOOK_图像蒙版编辑] 当前弹窗状态:", this.modal.open ? "已打开" : "未打开");
        console.log("[KOOK_图像蒙版编辑] 叠加图像数据:", overlayData ? "有" : "无");
        
        // 如果弹窗已经打开，先关闭它
        if (this.modal.open) {
            console.log("[KOOK_图像蒙版编辑] 弹窗已打开，先关闭");
            this.modal.close();
        }
        
        this.currentNodeId = nodeId;
        this.sessionId = sessionId;
        this.imageWidth = width;
        this.imageHeight = height;
        
        // 重置叠加图像状态
        this.overlayImage = null;
        this.overlayTransform = { x: 0, y: 0, scale: 1, rotation: 0 };
        this.isEditingOverlay = false;
        
        // 如果有叠加图像，先加载它
        const loadOverlay = overlayData ? new Promise((resolve) => {
            const overlayImg = new Image();
            overlayImg.onload = () => {
                console.log("[KOOK_图像蒙版编辑] 叠加图像加载完成, 尺寸:", overlayImg.width, "x", overlayImg.height);
                this.overlayImage = overlayImg;
                // 初始化叠加图像位置为中心
                this.overlayTransform.x = (width - overlayImg.width) / 2;
                this.overlayTransform.y = (height - overlayImg.height) / 2;
                resolve();
            };
            overlayImg.onerror = () => {
                console.error("[KOOK_图像蒙版编辑] 叠加图像加载失败");
                resolve();
            };
            overlayImg.src = overlayData.image_data;
        }) : Promise.resolve();
        
        loadOverlay.then(() => {
            const img = new Image();
            img.onload = () => {
                console.log("[KOOK_图像蒙版编辑] 主图片加载完成");
                this.imageCanvas.width = width;
                this.imageCanvas.height = height;
                this.maskCanvas.width = width;
                this.maskCanvas.height = height;
                
                this.imageCtx.drawImage(img, 0, 0);
                this.maskCtx.clearRect(0, 0, width, height);
                
                // 创建或更新叠加图像canvas
                this.setupOverlayCanvas();
                
                this.modal.querySelector("#kook-image-dimensions").textContent = `${width} x ${height}`;
                
                this.history = [this.maskCanvas.toDataURL()];
                this.historyIndex = 0;
                
                // 重置应用状态
                this.isApplying = false;
                
                this.modal.showModal();
                this.modal.focus();
                
                // 确保弹窗在最上层
                this.modal.style.zIndex = "999999";
                
                // 重新设置叠加图像事件监听器
                this.setupOverlayEventListeners();
                
                this.switchTool("select");
                this.fitImageToWindow();
                
                // 如果有叠加图像，显示编辑控件
                this.updateOverlayControls();
                
                console.log("[KOOK_图像蒙版编辑] 弹窗显示完成, z-index:", this.modal.style.zIndex);
            };
            img.onerror = (err) => {
                console.error("[KOOK_图像蒙版编辑] 图片加载失败:", err);
            };
            img.src = imageData;
        });
    }
}

// 创建编辑器实例
let maskEditor = null;

// 注册扩展
app.registerExtension({
    name: "KOOK.ImageMaskEditing",
    
    setup() {
        console.log("[KOOK_图像蒙版编辑] 扩展 setup 开始");
        maskEditor = new KOOKMaskEditor();
        
        api.addEventListener("kook_mask_editor_update", (event) => {
            console.log("[KOOK_图像蒙版编辑] 收到更新事件:", event.detail);
            const { node_id, session_id, image_data, width, height, overlay_data } = event.detail;
            if (maskEditor) {
                maskEditor.show(node_id, session_id, image_data, width, height, overlay_data);
            } else {
                console.error("[KOOK_图像蒙版编辑] maskEditor 实例不存在");
            }
        });
        
        console.log("[KOOK_图像蒙版编辑] 扩展 setup 完成");
    },
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "KOOKImageMaskEditing") {
            console.log("[KOOK_图像蒙版编辑] 注册节点定义");
        }
    },
    
    nodeCreated(node) {
        if (node.comfyClass === "KOOKImageMaskEditing") {
            console.log("[KOOK_图像蒙版编辑] 节点已创建:", node.id);
            node.color = "#2a8af6";
            node.bgcolor = "#1a1a2e";
            
            // 添加右键菜单
            this.addContextMenu(node);
        }
    },
    
    addContextMenu(node) {
        // 保存原始获取菜单的方法
        const originalGetMenuOptions = node.getMenuOptions;
        
        node.getMenuOptions = function() {
            const options = originalGetMenuOptions ? originalGetMenuOptions.apply(this, arguments) : [];
            
            // 添加分隔线
            options.push(null);
            
            // 添加"打开遮罩编辑器"选项
            options.push({
                content: "🎨 打开遮罩编辑器",
                callback: async () => {
                    console.log("[KOOK_图像蒙版编辑] 通过右键菜单打开编辑器, 节点ID:", node.id);
                    
                    // 获取输入图像
                    const inputLink = node.getInputLink(0);
                    if (!inputLink) {
                        alert("请先连接输入图像!");
                        return;
                    }
                    
                    // 获取输入图像的数据
                    const inputNode = node.graph.getNodeById(inputLink.origin_id);
                    if (!inputNode) {
                        alert("无法获取输入图像节点!");
                        return;
                    }
                    
                    // 尝试获取图像数据
                    try {
                        // 发送请求到后端获取图像预览
                        const response = await api.fetchApi("/kook_mask_editor/get_preview", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                node_id: node.id,
                                input_node_id: inputNode.id
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success && data.image_data) {
                            // 显示编辑器（右键菜单模式，不需要session_id）
                            maskEditor.show(node.id, null, data.image_data, data.width, data.height);
                            
                            // 设置回调，当用户确认时更新节点输出
                            maskEditor.onApply = async (maskData) => {
                                // 发送蒙版数据到后端
                                await api.fetchApi("/kook_mask_editor/apply_preview", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        node_id: node.id,
                                        mask_data: maskData
                                    })
                                });
                                
                                // 触发节点执行
                                app.queuePrompt(0, [node.id]);
                            };
                        } else {
                            alert("无法获取图像预览，请先运行一次工作流!");
                        }
                    } catch (error) {
                        console.error("[KOOK_图像蒙版编辑] 打开编辑器失败:", error);
                        alert("打开编辑器失败，请检查控制台日志!");
                    }
                }
            });
            
            // 添加"清除蒙版"选项
            options.push({
                content: "🗑️ 清除蒙版",
                callback: () => {
                    console.log("[KOOK_图像蒙版编辑] 清除蒙版, 节点ID:", node.id);
                    // 发送清除蒙版请求
                    api.fetchApi("/kook_mask_editor/clear_mask", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            node_id: node.id
                        })
                    });
                    alert("蒙版已清除，下次运行时将使用空白蒙版!");
                }
            });
            
            return options;
        };
    }
});

console.log("[KOOK_图像蒙版编辑] JS 文件加载完成");
