import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

console.log("[KOOK_CLIP文本编码器] JS 文件开始加载");

// 创建文本编辑器弹窗
function createTextEditorModal() {
    console.log("[KOOK_CLIP文本编码器] 创建弹窗");
    
    // 检查是否已存在
    const existingModal = document.getElementById("kook-clip-text-editor-modal");
    if (existingModal) {
        console.log("[KOOK_CLIP文本编码器] 弹窗已存在，复用");
        return existingModal;
    }
    
    const modal = document.createElement("dialog");
    modal.id = "kook-clip-text-editor-modal";
    modal.className = "kook-clip-text-editor-modal";
    modal.innerHTML = `
        <div class="kook-clip-text-editor-container">
            <div class="kook-clip-text-editor-header">
                <h3>KOOK CLIP 文本编码器</h3>
                <button class="kook-clip-text-close-button" title="关闭">&times;</button>
            </div>
            <div class="kook-clip-text-editor-body">
                <div class="kook-clip-text-fixed-area" id="kook-clip-text-fixed-area" style="display: none;">
                    <label>固定提示词:</label>
                    <div class="kook-clip-text-fixed-content" id="kook-clip-text-fixed-content"></div>
                </div>
                <div class="kook-clip-text-input-area">
                    <label for="kook-clip-text-input">补充提示词 (将加在固定提示词前面):</label>
                    <textarea id="kook-clip-text-input" class="kook-clip-text-textarea" 
                        placeholder="在此输入补充提示词...&#10;例如：1girl, masterpiece, best quality, highres..."
                        rows="8"></textarea>
                </div>
            </div>
            <div class="kook-clip-text-editor-footer">
                <span class="kook-clip-text-editor-info">按 Ctrl+Enter 快速确认</span>
                <div class="kook-clip-text-editor-actions">
                    <button id="kook-clip-text-cancel" class="kook-clip-text-btn kook-clip-text-btn-secondary">取消</button>
                    <button id="kook-clip-text-confirm" class="kook-clip-text-btn kook-clip-text-btn-primary">确认</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    console.log("[KOOK_CLIP文本编码器] 弹窗已添加到页面");
    return modal;
}

// 添加样式
const style = document.createElement("style");
style.textContent = `
    .kook-clip-text-editor-modal {
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 0;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        max-width: 600px;
        width: 90vw;
    }
    
    .kook-clip-text-editor-modal::backdrop {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
    }
    
    .kook-clip-text-editor-container {
        display: flex;
        flex-direction: column;
        min-height: 300px;
    }
    
    /* 头部 */
    .kook-clip-text-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #252525;
        border-bottom: 1px solid #444;
        border-radius: 8px 8px 0 0;
    }
    
    .kook-clip-text-editor-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: #fff;
    }
    
    .kook-clip-text-close-button {
        background: transparent;
        border: none;
        color: #999;
        font-size: 24px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
    }
    
    .kook-clip-text-close-button:hover {
        background: #444;
        color: #fff;
    }
    
    /* 主体 */
    .kook-clip-text-editor-body {
        flex: 1;
        padding: 20px;
        background: #1e1e1e;
    }
    
    .kook-clip-text-input-area {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .kook-clip-text-input-area label {
        font-size: 14px;
        color: #ccc;
        font-weight: 500;
    }
    
    /* 固定提示词区域 */
    .kook-clip-text-fixed-area {
        margin-bottom: 16px;
        padding: 12px;
        background: #252525;
        border: 1px solid #444;
        border-radius: 6px;
    }
    
    .kook-clip-text-fixed-area label {
        font-size: 14px;
        color: #2a8af6;
        font-weight: 500;
        display: block;
        margin-bottom: 8px;
    }
    
    .kook-clip-text-fixed-content {
        font-size: 13px;
        color: #aaa;
        line-height: 1.5;
        max-height: 80px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 8px;
        background: #1a1a1a;
        border-radius: 4px;
    }
    
    .kook-clip-text-textarea {
        width: 100%;
        min-height: 200px;
        padding: 12px;
        background: #252525;
        border: 1px solid #444;
        border-radius: 6px;
        color: #e0e0e0;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        font-family: inherit;
        box-sizing: border-box;
    }
    
    .kook-clip-text-textarea:focus {
        outline: none;
        border-color: #2a8af6;
        box-shadow: 0 0 0 2px rgba(42, 138, 246, 0.2);
    }
    
    .kook-clip-text-textarea::placeholder {
        color: #666;
    }
    
    /* 底部 */
    .kook-clip-text-editor-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #252525;
        border-top: 1px solid #444;
        border-radius: 0 0 8px 8px;
    }
    
    .kook-clip-text-editor-info {
        font-size: 12px;
        color: #666;
    }
    
    .kook-clip-text-editor-actions {
        display: flex;
        gap: 12px;
    }
    
    .kook-clip-text-btn {
        padding: 10px 24px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .kook-clip-text-btn-primary {
        background: #2a8af6;
        color: #fff;
    }
    
    .kook-clip-text-btn-primary:hover {
        background: #1a7ae6;
    }
    
    .kook-clip-text-btn-secondary {
        background: #444;
        color: #e0e0e0;
    }
    
    .kook-clip-text-btn-secondary:hover {
        background: #555;
    }
`;
document.head.appendChild(style);
console.log("[KOOK_CLIP文本编码器] 样式已添加");

// 文本编辑器类
class KOOKCLIPTextEditor {
    constructor() {
        console.log("[KOOK_CLIP文本编码器] 初始化编辑器类");
        this.modal = createTextEditorModal();
        this.textarea = this.modal.querySelector("#kook-clip-text-input");
        this.currentNodeId = null;
        this.isApplied = false;
        
        this.setupEventListeners();
        console.log("[KOOK_CLIP文本编码器] 编辑器类初始化完成");
    }
    
    setupEventListeners() {
        // 关闭按钮
        this.modal.querySelector(".kook-clip-text-close-button").addEventListener("click", () => {
            this.cleanupAndClose(true);
        });
        
        // 取消按钮
        this.modal.querySelector("#kook-clip-text-cancel").addEventListener("click", () => {
            this.cleanupAndClose(true);
        });
        
        // 确认按钮
        this.modal.querySelector("#kook-clip-text-confirm").addEventListener("click", () => {
            this.applyText();
        });
        
        // 键盘快捷键
        this.textarea.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                this.applyText();
            } else if (e.key === "Escape") {
                e.preventDefault();
                this.cleanupAndClose(true);
            }
        });
        
        // 弹窗关闭事件 - 仅在用户手动关闭时触发
        this.modal.addEventListener("close", () => {
            console.log("[KOOK_CLIP文本编码器] 弹窗关闭事件触发, currentNodeId:", this.currentNodeId, "isApplied:", this.isApplied);
            // 如果已经应用了，不要发送取消信号
            if (this.isApplied) {
                console.log("[KOOK_CLIP文本编码器] 已经应用，跳过取消信号");
                return;
            }
            if (this.currentNodeId) {
                this.cleanupAndClose(true);
            }
        });
    }
    
    async applyText() {
        const text = this.textarea.value.trim();
        console.log("[KOOK_CLIP文本编码器] 应用文本:", text.substring(0, 50) + "...");
        
        const currentNodeId = this.currentNodeId;
        if (!currentNodeId) {
            console.error("[KOOK_CLIP文本编码器] 错误: 节点ID为空");
            return;
        }
        
        // 标记为已应用，防止关闭事件发送取消信号
        this.isApplied = true;
        
        try {
            // 先发送确认请求到后端
            console.log("[KOOK_CLIP文本编码器] 发送应用请求，节点ID:", currentNodeId);
            const response = await api.fetchApi("/kook_clip_text_editor/apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    node_id: currentNodeId,
                    text: text
                })
            });
            
            const result = await response.json();
            console.log("[KOOK_CLIP文本编码器] 应用文本响应:", result);
            
            // 请求成功后清理状态
            this.textarea.value = "";
            this.currentNodeId = null;
            
            // 使用 setTimeout 延迟关闭弹窗，避免 close 事件触发 cleanupAndClose
            setTimeout(() => {
                this.isApplied = false;
                this.modal.close();
            }, 100);
            
        } catch (error) {
            console.error("[KOOK_CLIP文本编码器] 应用文本失败:", error);
            this.isApplied = false;
        }
    }
    
    async cleanupAndClose(cancelled = false) {
        console.log("[KOOK_CLIP文本编码器] 清理并关闭弹窗, cancelled:", cancelled, "isApplied:", this.isApplied);
        
        // 如果已经应用了，不要发送取消信号
        if (this.isApplied) {
            console.log("[KOOK_CLIP文本编码器] 已经应用，跳过取消信号");
            return;
        }
        
        if (cancelled && this.currentNodeId) {
            try {
                await api.fetchApi("/kook_clip_text_editor/cancel", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        node_id: this.currentNodeId
                    })
                });
            } catch (error) {
                console.error("[KOOK_CLIP文本编码器] 发送取消信号失败:", error);
            }
        }
        
        this.textarea.value = "";
        this.currentNodeId = null;
        this.modal.close();
    }
    
    show(nodeId, fixedText = "") {
        console.log("[KOOK_CLIP文本编码器] 显示弹窗, nodeId:", nodeId, "固定提示词:", fixedText);
        this.currentNodeId = nodeId;
        this.textarea.value = "";  // 清空输入框
        
        // 显示固定提示词区域
        const fixedArea = this.modal.querySelector("#kook-clip-text-fixed-area");
        const fixedContent = this.modal.querySelector("#kook-clip-text-fixed-content");
        
        if (fixedText && fixedText.trim()) {
            fixedArea.style.display = "block";
            fixedContent.textContent = fixedText;
        } else {
            fixedArea.style.display = "none";
            fixedContent.textContent = "";
        }
        
        this.modal.showModal();
        this.modal.focus();
        this.textarea.focus();
        
        console.log("[KOOK_CLIP文本编码器] 弹窗显示完成");
    }
}

// 创建编辑器实例
let clipTextEditor = null;

// 注册扩展
app.registerExtension({
    name: "KOOK.CLIPTextEditor",
    
    setup() {
        console.log("[KOOK_CLIP文本编码器] 扩展 setup 开始");
        clipTextEditor = new KOOKCLIPTextEditor();
        
        api.addEventListener("kook_clip_text_editor_update", (event) => {
            console.log("[KOOK_CLIP文本编码器] 收到更新事件:", event.detail);
            const { node_id, fixed_text } = event.detail;
            if (clipTextEditor) {
                clipTextEditor.show(node_id, fixed_text);
            } else {
                console.error("[KOOK_CLIP文本编码器] clipTextEditor 实例不存在");
            }
        });
        
        // 监听执行完成事件，更新节点文本显示
        api.addEventListener("executed", (event) => {
            const data = event.detail;
            console.log("[KOOK_CLIP文本编码器] 收到executed事件:", data);
            if (data && data.node === "KOOKCLIPTextEditor") {
                console.log("[KOOK_CLIP文本编码器] 执行完成事件:", data);
                // 从 ui 字段或 output 获取文本
                const text = data.ui && data.ui.text ? data.ui.text : (data.output && data.output[1] ? data.output[1] : null);
                const nodeId = data.ui && data.ui.node_id ? data.ui.node_id : data.node_id;
                if (text && nodeId) {
                    console.log("[KOOK_CLIP文本编码器] 更新文本:", text.substring(0, 50) + "...", "节点ID:", nodeId);
                    // 找到对应的节点并更新文本显示
                    const node = app.graph.getNodeById(parseInt(nodeId));
                    if (node) {
                        console.log("[KOOK_CLIP文本编码器] 找到节点:", node.id);
                        // 更新自定义文本显示区域
                        if (node.textDisplayElement) {
                            node.textDisplayElement.textContent = text || "<空文本>";
                            console.log("[KOOK_CLIP文本编码器] 文本已更新到显示区域");
                        }
                        // 同时更新 hidden widget 的值
                        if (node.widgets) {
                            const textWidget = node.widgets.find(w => w.name === "text");
                            if (textWidget) {
                                textWidget.value = text;
                                const widgetIndex = node.widgets.indexOf(textWidget);
                                if (widgetIndex >= 0 && node.widgets_values) {
                                    node.widgets_values[widgetIndex] = text;
                                }
                            }
                        }
                    } else {
                        console.log("[KOOK_CLIP文本编码器] 未找到节点:", nodeId);
                    }
                }
            }
        });
        
        console.log("[KOOK_CLIP文本编码器] 扩展 setup 完成");
    },
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "KOOKCLIPTextEditor") {
            console.log("[KOOK_CLIP文本编码器] 注册节点定义");
        }
    },
    
    nodeCreated(node) {
        if (node.comfyClass === "KOOKCLIPTextEditor") {
            console.log("[KOOK_CLIP文本编码器] 节点已创建:", node.id);
            node.color = "#2a8af6";
            node.bgcolor = "#1a1a2e";
            // 不再添加文本显示区域
        }
    }
});

console.log("[KOOK_CLIP文本编码器] JS 文件加载完成");
