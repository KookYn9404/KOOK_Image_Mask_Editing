"""
KOOK_文本编辑器节点
提供交互式文本输入功能，支持阻塞运行等待用户输入，支持固定提示词+弹窗输入合并
"""

import traceback
import time
import os
import json

from server import PromptServer
from aiohttp import web


# 存储节点状态数据
text_editor_node_data = {}

# 使用ComfyUI根目录下的存储目录
_current_dir = os.path.dirname(os.path.abspath(__file__))
while _current_dir != "/" and not os.path.exists(os.path.join(_current_dir, "custom_nodes")):
    _parent = os.path.dirname(_current_dir)
    if _parent == _current_dir:
        break
    _current_dir = _parent

if os.path.exists(os.path.join(_current_dir, "custom_nodes")):
    TEXT_STORAGE_DIR = os.path.join(_current_dir, "custom_nodes", "KOOK_Image_Mask_Editing", "text_storage")
else:
    TEXT_STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "text_storage")

os.makedirs(TEXT_STORAGE_DIR, exist_ok=True)
print(f"[KOOK_文本编辑器] 文本存储目录: {TEXT_STORAGE_DIR}")


def save_text_to_file(node_id, text):
    """将文本保存到文件，用于多进程共享"""
    try:
        text_path = os.path.join(TEXT_STORAGE_DIR, f"text_{node_id}.txt")
        with open(text_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"[KOOK_文本编辑器] 文本已保存到文件: {text_path}")
        return text_path
    except Exception as e:
        print(f"[KOOK_文本编辑器] 保存文本到文件失败: {e}")
        traceback.print_exc()
        return None


def load_text_from_file(node_id):
    """从文件加载文本"""
    try:
        text_path = os.path.join(TEXT_STORAGE_DIR, f"text_{node_id}.txt")
        if os.path.exists(text_path):
            with open(text_path, 'r', encoding='utf-8') as f:
                text = f.read()
            print(f"[KOOK_文本编辑器] 文本已从文件加载: {text_path}")
            os.remove(text_path)
            return text
        else:
            print(f"[KOOK_文本编辑器] 文本文件不存在: {text_path}")
    except Exception as e:
        print(f"[KOOK_文本编辑器] 从文件加载文本失败: {e}")
        traceback.print_exc()
    return None


def save_text_status_to_file(node_id, status_dict):
    """保存状态到文件"""
    try:
        status_path = os.path.join(TEXT_STORAGE_DIR, f"status_{node_id}.json")
        with open(status_path, 'w') as f:
            json.dump(status_dict, f)
        print(f"[KOOK_文本编辑器] 状态已保存到文件: {status_path}")
    except Exception as e:
        print(f"[KOOK_文本编辑器] 保存状态到文件失败: {e}")
        traceback.print_exc()


def load_text_status_from_file(node_id):
    """从文件加载状态"""
    try:
        status_path = os.path.join(TEXT_STORAGE_DIR, f"status_{node_id}.json")
        if os.path.exists(status_path):
            with open(status_path, 'r') as f:
                status = json.load(f)
            print(f"[KOOK_文本编辑器] 状态已从文件加载: {status_path}")
            os.remove(status_path)
            return status
        else:
            files = os.listdir(TEXT_STORAGE_DIR)
            status_files = [f for f in files if f.startswith('status_')]
            print(f"[KOOK_文本编辑器] 状态文件不存在: {status_path}, 目录中状态文件: {status_files}")
    except Exception as e:
        print(f"[KOOK_文本编辑器] 从文件加载状态失败: {e}")
        traceback.print_exc()
    return None


class KOOKTextEditor:
    """KOOK_文本编辑器节点 - 交互式文本输入，支持固定提示词+弹窗输入合并"""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "固定提示词": ("STRING", {"multiline": True, "default": ""}),
            },
            "optional": {
                "依赖": ("*",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("合并文本",)
    FUNCTION = "edit_text"
    CATEGORY = "KOOK"

    @classmethod
    def IS_CHANGED(cls, 固定提示词, **kwargs):
        """强制每次执行都刷新"""
        import time
        return time.time()

    def edit_text(self, 固定提示词, 依赖=None, unique_id=None):
        """执行文本编辑器节点"""
        try:
            node_id = unique_id
            
            # 初始化节点数据
            text_editor_node_data[node_id] = {
                "fixed_text": 固定提示词,  # 固定提示词
                "popup_text": "",  # 弹窗输入的文本
                "cancelled": False,
                "processing_complete": False,
                "timestamp": time.time()
            }
            
            # 同时初始化文件状态（多进程环境）
            save_text_status_to_file(node_id, {
                "processing_complete": False,
                "cancelled": False,
                "node_id": node_id,
                "timestamp": time.time()
            })
            
            print(f"[KOOK_文本编辑器] 等待用户输入，节点ID: {node_id}")
            print(f"[KOOK_文本编辑器] 固定提示词: {固定提示词[:50] if 固定提示词 else 'None'}...")
            
            # 发送信号到前端打开弹窗
            if PromptServer.instance:
                PromptServer.instance.send_sync("kook_text_editor_update", {
                    "node_id": node_id,
                    "fixed_text": 固定提示词
                })
                print(f"[KOOK_文本编辑器] 弹窗信号已发送，节点ID: {node_id}")
            
            # 等待前端完成文本输入
            print(f"[KOOK_文本编辑器] 开始等待用户操作，节点ID: {node_id}")
            max_wait_time = 600
            wait_interval = 0.1
            waited_time = 0
            result_text = None
            cancelled = False
            
            while waited_time < max_wait_time:
                time.sleep(wait_interval)
                waited_time += wait_interval
                
                # 检查文件中的状态（多进程环境）
                status = load_text_status_from_file(node_id)
                if status:
                    cancelled = status.get("cancelled", False)
                    if not cancelled:
                        result_text = load_text_from_file(node_id)
                    break
                
                # 检查内存中的状态
                if node_id in text_editor_node_data:
                    node_info = text_editor_node_data[node_id]
                    if node_info.get("processing_complete"):
                        cancelled = node_info.get("cancelled", False)
                        if not cancelled:
                            result_text = node_info.get("text", "")
                        break
                
                if waited_time % 10 == 0:
                    print(f"[KOOK_文本编辑器] 仍在等待用户输入... 已等待 {waited_time:.1f} 秒, 节点ID: {node_id}")
            
            if waited_time >= max_wait_time:
                print(f"[KOOK_文本编辑器] 等待超时，节点ID: {node_id}")
            
            print(f"[KOOK_文本编辑器] 获取结果，节点ID: {node_id}, cancelled: {cancelled}")
            
            # 清理节点数据
            if node_id in text_editor_node_data:
                del text_editor_node_data[node_id]
            
            # 处理结果
            if cancelled:
                print(f"[KOOK_文本编辑器] 用户取消，返回固定提示词")
                return (固定提示词,)
            
            if result_text is not None:
                # 合并文本：弹窗输入 + 固定提示词
                # 弹窗输入在前，固定提示词在后
                if result_text.strip():
                    merged_text = result_text.strip() + ", " + 固定提示词.strip() if 固定提示词.strip() else result_text.strip()
                else:
                    merged_text = 固定提示词.strip()
                
                print(f"[KOOK_文本编辑器] 合并文本: {merged_text[:100]}...")
                return (merged_text,)
            else:
                print(f"[KOOK_文本编辑器] 未获取到结果，返回固定提示词")
                return (固定提示词,)
                
        except Exception as e:
            print(f"[KOOK_文本编辑器] 处理过程中出错: {str(e)}")
            traceback.print_exc()
            if node_id in text_editor_node_data:
                del text_editor_node_data[node_id]
            return (固定提示词,)


@PromptServer.instance.routes.post("/kook_text_editor/apply")
async def apply_text_editor(request):
    """处理前端提交的文本数据"""
    try:
        data = await request.json()
        node_id = data.get("node_id")
        popup_text = data.get("popup_text", "")
        
        print(f"[KOOK_文本编辑器] 收到应用请求，节点ID: {node_id}, 弹窗文本: {popup_text[:50]}...")
        
        if node_id not in text_editor_node_data:
            print(f"[KOOK_文本编辑器] 错误: 节点 {node_id} 未找到")
            return web.json_response({"success": False, "error": "节点未找到"})
        
        node_info = text_editor_node_data[node_id]
        fixed_text = node_info.get("fixed_text", "")
        
        # 保存弹窗输入的文本
        node_info["popup_text"] = popup_text
        node_info["processing_complete"] = True
        node_info["cancelled"] = False
        
        # 同时保存到文件（多进程环境）
        save_text_to_file(node_id, popup_text)
        save_text_status_to_file(node_id, {
            "processing_complete": True,
            "cancelled": False,
            "node_id": node_id
        })
        
        print(f"[KOOK_文本编辑器] 应用文本成功: 弹窗文本={popup_text[:50]}..., 固定提示词={fixed_text[:50]}...")
        return web.json_response({"success": True})
        
    except Exception as e:
        print(f"[KOOK_文本编辑器] 请求处理出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


@PromptServer.instance.routes.post("/kook_text_editor/cancel")
async def cancel_text_editor(request):
    """处理取消请求"""
    try:
        data = await request.json()
        node_id = data.get("node_id")
        
        if node_id in text_editor_node_data:
            node_info = text_editor_node_data[node_id]
            node_info["processing_complete"] = True
            node_info["cancelled"] = True
            
            # 同时保存到文件（多进程环境）
            save_text_status_to_file(node_id, {
                "processing_complete": True,
                "cancelled": True,
                "node_id": node_id
            })
            
            print(f"[KOOK_文本编辑器] 取消编辑操作: 节点ID {node_id}")
            return web.json_response({"success": True})
        else:
            return web.json_response({"success": False, "error": "节点未找到"})
            
    except Exception as e:
        print(f"[KOOK_文本编辑器] 取消请求处理出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


# 节点映射 - KOOK_文本编辑器已停用
NODE_CLASS_MAPPINGS = {
    # "KOOKTextEditor": KOOKTextEditor,  # 已删除
}

NODE_DISPLAY_NAME_MAPPINGS = {
    # "KOOKTextEditor": "KOOK_文本编辑器",  # 已删除
}
