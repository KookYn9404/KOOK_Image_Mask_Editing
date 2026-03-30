"""
KOOK_CLIP文本编码器节点
提供交互式文本输入功能，支持阻塞运行等待用户输入
"""

import torch
import traceback
import time
import os
import json
import tempfile

from server import PromptServer
from aiohttp import web


# 存储节点状态数据
clip_text_editor_node_data = {}

# 使用ComfyUI根目录下的存储目录
# 首先尝试找到ComfyUI根目录（通过查找custom_nodes目录）
_current_dir = os.path.dirname(os.path.abspath(__file__))
while _current_dir != "/" and not os.path.exists(os.path.join(_current_dir, "custom_nodes")):
    _parent = os.path.dirname(_current_dir)
    if _parent == _current_dir:  # 到达根目录
        break
    _current_dir = _parent

# 如果找到了ComfyUI根目录，使用它；否则使用当前目录
if os.path.exists(os.path.join(_current_dir, "custom_nodes")):
    TEXT_STORAGE_DIR = os.path.join(_current_dir, "custom_nodes", "KOOK_Image_Mask_Editing", "text_storage")
else:
    # 备用方案：使用当前文件所在目录
    TEXT_STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "text_storage")

os.makedirs(TEXT_STORAGE_DIR, exist_ok=True)
print(f"[KOOK_CLIP文本编码器] 文本存储目录: {TEXT_STORAGE_DIR}")


def save_text_to_file(node_id, text):
    """将文本保存到文件，用于多进程共享"""
    try:
        text_path = os.path.join(TEXT_STORAGE_DIR, f"text_{node_id}.txt")
        with open(text_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"[KOOK_CLIP文本编码器] 文本已保存到文件: {text_path}")
        return text_path
    except Exception as e:
        print(f"[KOOK_CLIP文本编码器] 保存文本到文件失败: {e}")
        traceback.print_exc()
        return None


def load_text_from_file(node_id):
    """从文件加载文本"""
    try:
        text_path = os.path.join(TEXT_STORAGE_DIR, f"text_{node_id}.txt")
        if os.path.exists(text_path):
            with open(text_path, 'r', encoding='utf-8') as f:
                text = f.read()
            print(f"[KOOK_CLIP文本编码器] 文本已从文件加载: {text_path}")
            # 加载后删除文件
            os.remove(text_path)
            return text
        else:
            print(f"[KOOK_CLIP文本编码器] 文本文件不存在: {text_path}")
    except Exception as e:
        print(f"[KOOK_CLIP文本编码器] 从文件加载文本失败: {e}")
        traceback.print_exc()
    return None


def save_text_status_to_file(node_id, status_dict):
    """保存状态到文件"""
    try:
        status_path = os.path.join(TEXT_STORAGE_DIR, f"status_{node_id}.json")
        with open(status_path, 'w') as f:
            json.dump(status_dict, f)
        print(f"[KOOK_CLIP文本编码器] 状态已保存到文件: {status_path}")
    except Exception as e:
        print(f"[KOOK_CLIP文本编码器] 保存状态到文件失败: {e}")
        traceback.print_exc()


def load_text_status_from_file(node_id):
    """从文件加载状态"""
    try:
        status_path = os.path.join(TEXT_STORAGE_DIR, f"status_{node_id}.json")
        if os.path.exists(status_path):
            with open(status_path, 'r') as f:
                status = json.load(f)
            print(f"[KOOK_CLIP文本编码器] 状态已从文件加载: {status_path}")
            os.remove(status_path)
            return status
        else:
            # 检查目录中所有文件
            files = os.listdir(TEXT_STORAGE_DIR)
            status_files = [f for f in files if f.startswith('status_')]
            print(f"[KOOK_CLIP文本编码器] 状态文件不存在: {status_path}, 目录中状态文件: {status_files}")
    except Exception as e:
        print(f"[KOOK_CLIP文本编码器] 从文件加载状态失败: {e}")
        traceback.print_exc()
    return None


class KOOKCLIPTextEditor:
    """KOOK_CLIP文本编码器节点 - 交互式文本输入"""
    
    # 内置固定提示词
    FIXED_PROMPT = "保留所有元素的位置、细节和构图，仅调整光线和阴影以及局部透视遮挡；匹配场景的光线和阴影，调整投影与反射符号的材质规律性，校正透视对齐点，进行像素级无缝瑕疵去除，统一色彩和光线，实现原生级别的光线、透视和材质的无缝融合，没有任何不协调感"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "clip": ("CLIP",),
            },
            "optional": {
                "依赖": ("*", {"forceInput": True}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            }
        }

    RETURN_TYPES = ("CONDITIONING", "STRING")
    RETURN_NAMES = ("条件", "文本")
    FUNCTION = "edit_text"
    CATEGORY = "KOOK"

    @classmethod
    def IS_CHANGED(cls, clip, text, **kwargs):
        """强制每次执行都刷新"""
        import time
        return time.time()

    def encode_text(self, clip, text):
        """通用的CLIP编码方法，兼容多种模型"""
        errors = []
        
        # 方法1: 使用 encode_from_tokens_scheduled (Flux等模型)
        try:
            if hasattr(clip, 'tokenize') and hasattr(clip, 'encode_from_tokens_scheduled'):
                tokens = clip.tokenize(text)
                conditioning = clip.encode_from_tokens_scheduled(tokens)
                print(f"[KOOK_CLIP文本编码器] 使用 encode_from_tokens_scheduled 编码成功")
                return conditioning
        except Exception as e:
            errors.append(f"encode_from_tokens_scheduled: {str(e)}")
        
        # 方法2: 使用 encode_from_tokens (标准CLIP)
        try:
            if hasattr(clip, 'tokenize') and hasattr(clip, 'encode_from_tokens'):
                tokens = clip.tokenize(text)
                conditioning = clip.encode_from_tokens(tokens)
                print(f"[KOOK_CLIP文本编码器] 使用 encode_from_tokens 编码成功")
                return conditioning
        except Exception as e:
            errors.append(f"encode_from_tokens: {str(e)}")
        
        # 方法3: 使用 encode (简单方法)
        try:
            if hasattr(clip, 'encode'):
                conditioning = clip.encode(text)
                print(f"[KOOK_CLIP文本编码器] 使用 encode 编码成功")
                return conditioning
        except Exception as e:
            errors.append(f"encode: {str(e)}")
        
        # 方法4: 使用 cond_stage_model (某些特殊模型)
        try:
            if hasattr(clip, 'cond_stage_model') and hasattr(clip.cond_stage_model, 'encode'):
                conditioning = clip.cond_stage_model.encode(text)
                print(f"[KOOK_CLIP文本编码器] 使用 cond_stage_model.encode 编码成功")
                return conditioning
        except Exception as e:
            errors.append(f"cond_stage_model.encode: {str(e)}")
        
        # 所有方法都失败
        print(f"[KOOK_CLIP文本编码器] 所有编码方法都失败: {errors}")
        # 返回空条件
        return []

    def edit_text(self, clip, 依赖=None, unique_id=None):
        """执行CLIP文本编码节点"""
        try:
            node_id = unique_id
            
            # 初始化节点数据 - 必须在发送WebSocket事件之前完成
            clip_text_editor_node_data[node_id] = {
                "fixed_text": self.FIXED_PROMPT,  # 使用内置固定提示词
                "text": "",  # 弹窗输入的文本
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

            try:
                # 发送信号到前端，请求用户输入
                print(f"[KOOK_CLIP文本编码器] 等待用户输入，节点ID: {node_id}")
                PromptServer.instance.send_sync("kook_clip_text_editor_update", {
                    "node_id": node_id,
                    "fixed_text": self.FIXED_PROMPT,  # 传递内置固定提示词
                })

                # 等待前端完成文本输入 - 使用轮询方式检查（同时检查内存和文件）
                print(f"[KOOK_CLIP文本编码器] 开始等待用户操作，节点ID: {node_id}")
                max_wait_time = 600  # 最大等待10分钟
                wait_interval = 0.05  # 每0.05秒检查一次（更频繁）
                waited_time = 0
                result_text = ""
                cancelled = False
                check_count = 0
                
                while waited_time < max_wait_time:
                    time.sleep(wait_interval)
                    waited_time += wait_interval
                    check_count += 1
                    
                    # 先检查文件中的状态（多进程环境优先）
                    status = load_text_status_from_file(node_id)
                    if status and status.get("processing_complete", False):
                        print(f"[KOOK_CLIP文本编码器] 从文件获取结果，节点ID: {node_id}")
                        cancelled = status.get("cancelled", False)
                        if not cancelled:
                            result_text = load_text_from_file(node_id)
                        break
                    
                    # 再检查内存中的状态
                    node_info = clip_text_editor_node_data.get(node_id, {})
                    if node_info.get("processing_complete", False):
                        print(f"[KOOK_CLIP文本编码器] 从内存获取结果，节点ID: {node_id}")
                        result_text = node_info.get("text", "")
                        cancelled = node_info.get("cancelled", False)
                        break
                    
                    # 每2秒打印一次等待日志
                    if check_count % 40 == 0:
                        print(f"[KOOK_CLIP文本编码器] 仍在等待用户输入... 已等待 {waited_time:.1f} 秒, 节点ID: {node_id}")
                else:
                    print(f"[KOOK_CLIP文本编码器] 等待超时，节点ID: {node_id}")
                
                print(f"[KOOK_CLIP文本编码器] 获取结果，节点ID: {node_id}, cancelled: {cancelled}, text: {result_text[:50] if result_text else 'None'}...")

                # 清理节点数据
                if node_id in clip_text_editor_node_data:
                    del clip_text_editor_node_data[node_id]

                # 如果用户取消，返回空文本的条件
                if cancelled:
                    print(f"[KOOK_CLIP文本编码器] 用户取消，返回默认空条件")
                    empty_conditioning = self.encode_text(clip, "")
                    return (empty_conditioning, "")
                
                # 合并文本：弹窗输入的文本 + 内置固定提示词
                # 弹窗输入的文本在前面，固定提示词在后面
                if result_text:
                    combined_text = result_text + ", " + self.FIXED_PROMPT
                else:
                    combined_text = self.FIXED_PROMPT
                
                print(f"[KOOK_CLIP文本编码器] 弹窗文本: {result_text[:50] if result_text else 'None'}...")
                print(f"[KOOK_CLIP文本编码器] 内置固定提示词: {self.FIXED_PROMPT[:50]}...")
                print(f"[KOOK_CLIP文本编码器] 合并后文本: {combined_text[:150]}...")

                # 使用CLIP编码合并后的文本
                print(f"[KOOK_CLIP文本编码器] 开始编码文本: {combined_text[:50]}...")
                conditioning = self.encode_text(clip, combined_text)
                print(f"[KOOK_CLIP文本编码器] 编码完成，conditioning类型: {type(conditioning)}")
                
                # 检查conditioning格式
                if isinstance(conditioning, list) and len(conditioning) > 0:
                    print(f"[KOOK_CLIP文本编码器] conditioning是列表，长度: {len(conditioning)}")
                    if isinstance(conditioning[0], tuple) and len(conditioning[0]) >= 2:
                        cond_tensor = conditioning[0][0]
                        print(f"[KOOK_CLIP文本编码器] conditioning[0][0]形状: {cond_tensor.shape if hasattr(cond_tensor, 'shape') else 'N/A'}")
                elif hasattr(conditioning, 'shape'):
                    print(f"[KOOK_CLIP文本编码器] conditioning形状: {conditioning.shape}")
                
                # 返回结果
                return (conditioning, combined_text)

            except Exception as e:
                print(f"[KOOK_CLIP文本编码器] 处理过程中出错: {str(e)}")
                traceback.print_exc()
                if node_id in clip_text_editor_node_data:
                    del clip_text_editor_node_data[node_id]
                # 返回空文本的条件
                empty_conditioning = self.encode_text(clip, "")
                return (empty_conditioning, "")

        except Exception as e:
            print(f"[KOOK_CLIP文本编码器] 节点执行出错: {str(e)}")
            traceback.print_exc()
            # 尝试返回空条件
            empty_conditioning = self.encode_text(clip, "")
            return (empty_conditioning, "")


@PromptServer.instance.routes.post("/kook_clip_text_editor/apply")
async def apply_clip_text_editor(request):
    """处理前端提交的文本数据"""
    try:
        data = await request.json()
        node_id = data.get("node_id")
        text = data.get("text", "")
        
        print(f"[KOOK_CLIP文本编码器] 收到应用请求，节点ID: {node_id}, 文本: {text[:50]}...")

        if node_id not in clip_text_editor_node_data:
            print(f"[KOOK_CLIP文本编码器] 错误: 节点 {node_id} 未找到")
            return web.json_response({"success": False, "error": "节点未找到"})

        node_info = clip_text_editor_node_data[node_id]
        node_info["text"] = text
        node_info["processing_complete"] = True
        
        print(f"[KOOK_CLIP文本编码器] 文本已保存到内存，节点ID: {node_id}")
        
        # 同时保存到文件（多进程环境）
        save_text_to_file(node_id, text)
        save_text_status_to_file(node_id, {
            "processing_complete": True,
            "cancelled": False,
            "node_id": node_id
        })

        print(f"[KOOK_CLIP文本编码器] 应用文本成功: {text[:50]}...")
        return web.json_response({"success": True})

    except Exception as e:
        print(f"[KOOK_CLIP文本编码器] 请求处理出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


@PromptServer.instance.routes.post("/kook_clip_text_editor/cancel")
async def cancel_clip_text_editor(request):
    """处理取消请求"""
    try:
        data = await request.json()
        node_id = data.get("node_id")

        if node_id in clip_text_editor_node_data:
            node_info = clip_text_editor_node_data[node_id]
            node_info["cancelled"] = True
            node_info["processing_complete"] = True
            print(f"[KOOK_CLIP文本编码器] 取消编辑操作: 节点ID {node_id}")
            
        # 同时保存到文件（多进程环境）
        save_text_status_to_file(node_id, {
            "processing_complete": True,
            "cancelled": True,
            "node_id": node_id
        })
        
        return web.json_response({"success": True})

    except Exception as e:
        print(f"[KOOK_CLIP文本编码器] 取消请求处理出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


NODE_CLASS_MAPPINGS = {
    "KOOKCLIPTextEditor": KOOKCLIPTextEditor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "KOOKCLIPTextEditor": "KOOK_CLIP文本编码器",
}
