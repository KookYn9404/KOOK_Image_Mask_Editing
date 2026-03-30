"""
KOOK_图像蒙版编辑节点
提供交互式蒙版编辑功能，支持画笔、橡皮擦等工具
"""

import torch
import numpy as np
from PIL import Image
import io
import base64
import traceback
import time
import os
import json
import tempfile

from server import PromptServer
from aiohttp import web


# 存储节点状态数据 - 内存存储
mask_editor_node_data = {}

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
    MASK_STORAGE_DIR = os.path.join(_current_dir, "custom_nodes", "KOOK_Image_Mask_Editing", "mask_storage")
else:
    # 备用方案：使用当前文件所在目录
    MASK_STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mask_storage")

os.makedirs(MASK_STORAGE_DIR, exist_ok=True)
print(f"[KOOK_图像蒙版编辑] 蒙版存储目录: {MASK_STORAGE_DIR}")


def save_mask_to_file(node_id, mask_tensor):
    """将蒙版保存到文件，用于多进程共享"""
    try:
        # 保存为numpy数组
        mask_path = os.path.join(MASK_STORAGE_DIR, f"mask_{node_id}.npy")
        np.save(mask_path, mask_tensor.cpu().numpy())
        print(f"[KOOK_图像蒙版编辑] 蒙版已保存到文件: {mask_path}, 形状: {mask_tensor.shape}")
        return mask_path
    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 保存蒙版到文件失败: {e}")
        traceback.print_exc()
        return None


def load_mask_from_file(node_id):
    """从文件加载蒙版"""
    try:
        mask_path = os.path.join(MASK_STORAGE_DIR, f"mask_{node_id}.npy")
        if os.path.exists(mask_path):
            mask_array = np.load(mask_path)
            mask_tensor = torch.from_numpy(mask_array)
            print(f"[KOOK_图像蒙版编辑] 蒙版已从文件加载: {mask_path}, 形状: {mask_tensor.shape}")
            # 加载后删除文件
            os.remove(mask_path)
            return mask_tensor
        else:
            print(f"[KOOK_图像蒙版编辑] 蒙版文件不存在: {mask_path}")
    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 从文件加载蒙版失败: {e}")
        traceback.print_exc()
    return None


def save_status_to_file(node_id, status_dict):
    """保存状态到文件"""
    try:
        status_path = os.path.join(MASK_STORAGE_DIR, f"status_{node_id}.json")
        with open(status_path, 'w') as f:
            json.dump(status_dict, f)
        print(f"[KOOK_图像蒙版编辑] 状态已保存到文件: {status_path}")
    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 保存状态到文件失败: {e}")
        traceback.print_exc()


def load_status_from_file(node_id):
    """从文件加载状态"""
    try:
        status_path = os.path.join(MASK_STORAGE_DIR, f"status_{node_id}.json")
        if os.path.exists(status_path):
            with open(status_path, 'r') as f:
                status = json.load(f)
            print(f"[KOOK_图像蒙版编辑] 状态已从文件加载: {status_path}")
            os.remove(status_path)
            return status
        else:
            # 检查目录中所有文件
            files = os.listdir(MASK_STORAGE_DIR)
            status_files = [f for f in files if f.startswith('status_')]
            print(f"[KOOK_图像蒙版编辑] 状态文件不存在: {status_path}, 目录中状态文件: {status_files}")
    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 从文件加载状态失败: {e}")
        traceback.print_exc()
    return None


class KOOKImageMaskEditing:
    """KOOK_图像蒙版编辑节点 - 交互式蒙版编辑"""

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "反转蒙版": ("BOOLEAN", {"default": False, "label": "反转蒙版(黑=重绘)"}),
            },
            "optional": {
                "overlay_image": ("IMAGE",),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            }
        }

    RETURN_TYPES = ("IMAGE", "MASK")
    RETURN_NAMES = ("原图", "蒙版")
    FUNCTION = "edit_mask"
    CATEGORY = "KOOK"

    def edit_mask(self, image, 反转蒙版, overlay_image=None, unique_id=None):
        """执行蒙版编辑节点"""
        try:
            node_id = unique_id
            
            # 检查是否有通过右键菜单编辑的预览蒙版
            preview_mask_key = f"preview_mask_{node_id}"
            if preview_mask_key in mask_editor_node_data:
                print(f"[KOOK_图像蒙版编辑] 使用右键菜单编辑的蒙版，节点ID: {node_id}")
                cached_mask = mask_editor_node_data[preview_mask_key]
                # 确保蒙版尺寸与图像匹配
                if cached_mask.shape[1:] == image.shape[1:3]:
                    del mask_editor_node_data[preview_mask_key]
                    return (image, cached_mask)
                else:
                    print(f"[KOOK_图像蒙版编辑] 缓存蒙版尺寸不匹配，重新编辑")
                    del mask_editor_node_data[preview_mask_key]
            
            # 生成唯一的会话ID（用于多进程环境）
            import uuid
            session_id = f"{node_id}_{uuid.uuid4().hex[:8]}"
            print(f"[KOOK_图像蒙版编辑] 生成会话ID: {session_id}")

            # 将主图像转换为 base64 发送给前端
            preview_image = (torch.clamp(image.clone(), 0, 1) * 255).cpu().numpy().astype(np.uint8)[0]
            pil_image = Image.fromarray(preview_image)
            buffer = io.BytesIO()
            pil_image.save(buffer, format="PNG")
            base64_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            # 处理叠加图像（如果有）
            overlay_data = None
            if overlay_image is not None:
                print(f"[KOOK_图像蒙版编辑] 处理叠加图像，形状: {overlay_image.shape}")
                overlay_preview = (torch.clamp(overlay_image.clone(), 0, 1) * 255).cpu().numpy().astype(np.uint8)[0]
                overlay_pil = Image.fromarray(overlay_preview)
                overlay_buffer = io.BytesIO()
                overlay_pil.save(overlay_buffer, format="PNG")
                overlay_base64 = base64.b64encode(overlay_buffer.getvalue()).decode('utf-8')
                overlay_data = {
                    "image_data": f"data:image/png;base64,{overlay_base64}",
                    "width": overlay_pil.width,
                    "height": overlay_pil.height
                }
            
            # 存储图像到预览缓存（用于右键菜单功能）
            preview_image_cache[f"{node_id}_"] = {
                "image_data": f"data:image/png;base64,{base64_image}",
                "width": pil_image.width,
                "height": pil_image.height
            }
            
            # 保存图像尺寸信息到文件（供前端使用）
            image_info = {
                "width": pil_image.width,
                "height": pil_image.height,
                "node_id": node_id,
                "session_id": session_id,
                "has_overlay": overlay_data is not None
            }
            if overlay_data:
                image_info["overlay_width"] = overlay_data["width"]
                image_info["overlay_height"] = overlay_data["height"]
            
            info_path = os.path.join(MASK_STORAGE_DIR, f"info_{session_id}.json")
            with open(info_path, 'w') as f:
                json.dump(image_info, f)

            try:
                # 准备图像数据
                image_data_url = f"data:image/png;base64,{base64_image}"
                
                # 存储到会话数据（用于HTTP轮询）
                session_image_data[session_id] = {
                    "node_id": node_id,
                    "session_id": session_id,
                    "image_data": image_data_url,
                    "width": pil_image.width,
                    "height": pil_image.height,
                    "overlay_data": overlay_data
                }
                print(f"[KOOK_图像蒙版编辑] 图像数据已存储到会话缓存，会话ID: {session_id}")
                
                # 发送图像数据到前端（WebSocket）
                print(f"[KOOK_图像蒙版编辑] 发送图像到前端，节点ID: {node_id}, 会话ID: {session_id}")
                print(f"[KOOK_图像蒙版编辑] PromptServer.instance: {PromptServer.instance}")
                
                # 构建发送数据
                send_data = {
                    "node_id": node_id,
                    "session_id": session_id,
                    "image_data": image_data_url,
                    "width": pil_image.width,
                    "height": pil_image.height
                }
                
                # 如果有叠加图像，添加到发送数据
                if overlay_data:
                    send_data["overlay_data"] = overlay_data
                    print(f"[KOOK_图像蒙版编辑] 包含叠加图像: {overlay_data['width']}x{overlay_data['height']}")
                
                if PromptServer.instance:
                    PromptServer.instance.send_sync("kook_mask_editor_update", send_data)
                    print(f"[KOOK_图像蒙版编辑] 图像数据已通过WebSocket发送")
                else:
                    print(f"[KOOK_图像蒙版编辑] 错误: PromptServer.instance 为 None")

                # 等待前端完成蒙版编辑 - 完全依赖文件系统
                print(f"[KOOK_图像蒙版编辑] 等待用户编辑完成，会话ID: {session_id}")
                print(f"[KOOK_图像蒙版编辑] 存储目录: {MASK_STORAGE_DIR}")
                print(f"[KOOK_图像蒙版编辑] 目录是否存在: {os.path.exists(MASK_STORAGE_DIR)}")
                max_wait_time = 600  # 最大等待10分钟
                wait_interval = 0.05  # 每0.05秒检查一次（更频繁）
                waited_time = 0
                result_mask = None
                cancelled = False
                check_count = 0
                
                # 确保目录存在并同步
                os.makedirs(MASK_STORAGE_DIR, exist_ok=True)
                
                while waited_time < max_wait_time:
                    time.sleep(wait_interval)
                    waited_time += wait_interval
                    check_count += 1
                    
                    # 动态构建文件路径
                    status_path = os.path.join(MASK_STORAGE_DIR, f"status_{session_id}.json")
                    mask_path = os.path.join(MASK_STORAGE_DIR, f"mask_{session_id}.npy")
                    
                    # 每2秒打印一次检查信息
                    if check_count % 40 == 0:
                        print(f"[KOOK_图像蒙版编辑] 仍在等待... 已等待 {waited_time:.1f} 秒, 会话ID: {session_id}")
                        print(f"[KOOK_图像蒙版编辑] 检查路径: {status_path}")
                        # 检查目录内容
                        try:
                            if os.path.exists(MASK_STORAGE_DIR):
                                files = os.listdir(MASK_STORAGE_DIR)
                                session_files = [f for f in files if session_id in f]
                                print(f"[KOOK_图像蒙版编辑] 存储目录内容(相关): {session_files}")
                            else:
                                print(f"[KOOK_图像蒙版编辑] 存储目录不存在!")
                        except Exception as e:
                            print(f"[KOOK_图像蒙版编辑] 无法读取存储目录: {e}")
                    
                    # 检查文件中的状态（完全依赖文件系统）
                    if os.path.exists(status_path):
                        print(f"[KOOK_图像蒙版编辑] 发现状态文件: {status_path}")
                        # 等待一小段时间确保文件写入完成
                        time.sleep(0.05)
                        try:
                            with open(status_path, 'r') as f:
                                status = json.load(f)
                            print(f"[KOOK_图像蒙版编辑] 状态文件内容: {status}")
                            cancelled = status.get("cancelled", False)
                            print(f"[KOOK_图像蒙版编辑] 状态: cancelled={cancelled}")
                            
                            if not cancelled:
                                # 等待并检查蒙版文件
                                mask_wait_count = 0
                                while not os.path.exists(mask_path) and mask_wait_count < 10:
                                    time.sleep(0.05)
                                    mask_wait_count += 1
                                
                                if os.path.exists(mask_path):
                                    print(f"[KOOK_图像蒙版编辑] 发现蒙版文件: {mask_path}")
                                    mask_array = np.load(mask_path)
                                    result_mask = torch.from_numpy(mask_array)
                                    # 添加batch维度 [H, W] -> [1, H, W]
                                    if result_mask.dim() == 2:
                                        result_mask = result_mask.unsqueeze(0)
                                    print(f"[KOOK_图像蒙版编辑] 从文件加载蒙版，形状: {result_mask.shape}")
                                else:
                                    print(f"[KOOK_图像蒙版编辑] 警告: 状态为成功但蒙版文件不存在: {mask_path}")
                            
                            # 清理文件
                            try:
                                os.remove(status_path)
                                print(f"[KOOK_图像蒙版编辑] 已删除状态文件")
                            except Exception as e:
                                print(f"[KOOK_图像蒙版编辑] 删除状态文件失败: {e}")
                            if os.path.exists(mask_path):
                                try:
                                    os.remove(mask_path)
                                    print(f"[KOOK_图像蒙版编辑] 已删除蒙版文件")
                                except Exception as e:
                                    print(f"[KOOK_图像蒙版编辑] 删除蒙版文件失败: {e}")
                            break
                        except Exception as e:
                            print(f"[KOOK_图像蒙版编辑] 读取状态文件失败: {e}")
                            traceback.print_exc()
                else:
                    print(f"[KOOK_图像蒙版编辑] 等待超时，会话ID: {session_id}, 总检查次数: {check_count}")
                
                print(f"[KOOK_图像蒙版编辑] 获取结果，会话ID: {session_id}, cancelled: {cancelled}, result_mask: {result_mask is not None}")
                
                # 清理会话数据
                if session_id in session_image_data:
                    del session_image_data[session_id]
                    print(f"[KOOK_图像蒙版编辑] 已清理会话缓存，会话ID: {session_id}")

                # 如果用户取消，返回原图和空白蒙版
                if cancelled or result_mask is None:
                    empty_mask = torch.zeros((1, pil_image.height, pil_image.width), dtype=torch.float32)
                    print(f"[KOOK_图像蒙版编辑] 返回空白蒙版，形状: {empty_mask.shape}")
                    return (image, empty_mask)

                print(f"[KOOK_图像蒙版编辑] 返回蒙版，形状: {result_mask.shape}, 最小值: {result_mask.min():.4f}, 最大值: {result_mask.max():.4f}, 非零像素数: {torch.count_nonzero(result_mask).item()}")
                
                # 根据用户选择反转蒙版
                if 反转蒙版:
                    result_mask = 1.0 - result_mask
                    print(f"[KOOK_图像蒙版编辑] 蒙版已反转，新的非零像素数: {torch.count_nonzero(result_mask).item()}")
                
                # 检查是否有合并后的图像
                merged_image_path = os.path.join(MASK_STORAGE_DIR, f"merged_{session_id}.png")
                output_image = image
                if os.path.exists(merged_image_path):
                    try:
                        print(f"[KOOK_图像蒙版编辑] 发现合并后的图像，加载中...")
                        merged_pil = Image.open(merged_image_path)
                        print(f"[KOOK_图像蒙版编辑] PIL图像模式: {merged_pil.mode}, 尺寸: {merged_pil.size}")
                        # 转换为RGB模式
                        if merged_pil.mode != 'RGB':
                            merged_pil = merged_pil.convert('RGB')
                        # 转换为tensor [H, W, C]
                        merged_array = np.array(merged_pil).astype(np.float32) / 255.0
                        print(f"[KOOK_图像蒙版编辑] numpy数组形状: {merged_array.shape}")
                        # 转换为 ComfyUI IMAGE 格式 [B, H, W, C]
                        merged_tensor = torch.from_numpy(merged_array).unsqueeze(0)  # [1, H, W, C]
                        print(f"[KOOK_图像蒙版编辑] tensor形状: {merged_tensor.shape}")
                        output_image = merged_tensor
                        
                        print(f"[KOOK_图像蒙版编辑] 合并后的图像已加载，最终形状: {output_image.shape}, 类型: {output_image.dtype}")
                        
                        # 验证图像数据
                        print(f"[KOOK_图像蒙版编辑] 图像数据范围: [{output_image.min():.4f}, {output_image.max():.4f}]")
                        
                        # 保存调试用的输出图像
                        try:
                            debug_img = (output_image[0].cpu().numpy() * 255).astype(np.uint8)
                            debug_img_path = os.path.join(MASK_STORAGE_DIR, f"debug_output_image_{session_id}.png")
                            Image.fromarray(debug_img, mode='RGB').save(debug_img_path)
                            print(f"[KOOK_图像蒙版编辑] 调试输出图像已保存: {debug_img_path}")
                        except Exception as img_save_err:
                            print(f"[KOOK_图像蒙版编辑] 保存调试图像失败: {img_save_err}")
                        
                        # 清理合并图像文件
                        os.remove(merged_image_path)
                        flag_path = os.path.join(MASK_STORAGE_DIR, f"has_merged_{session_id}.txt")
                        if os.path.exists(flag_path):
                            os.remove(flag_path)
                    except Exception as merge_err:
                        print(f"[KOOK_图像蒙版编辑] 加载合并图像失败: {merge_err}")
                        traceback.print_exc()
                
                # 保存返回的蒙版用于调试
                try:
                    mask_for_save = (result_mask[0].cpu().numpy() * 255).astype(np.uint8)
                    debug_output_path = os.path.join(MASK_STORAGE_DIR, f"debug_mask_output_{session_id}.png")
                    Image.fromarray(mask_for_save, mode='L').save(debug_output_path)
                    print(f"[KOOK_图像蒙版编辑] 返回蒙版已保存到: {debug_output_path}")
                except Exception as save_err:
                    print(f"[KOOK_图像蒙版编辑] 保存调试蒙版失败（非关键错误）: {save_err}")
                
                return (output_image, result_mask)

            except Exception as e:
                print(f"[KOOK_图像蒙版编辑] 处理过程中出错: {str(e)}")
                traceback.print_exc()
                if node_id in mask_editor_node_data:
                    del mask_editor_node_data[node_id]
                # 返回原图和空白蒙版
                empty_mask = torch.zeros((1, pil_image.height, pil_image.width), dtype=torch.float32)
                return (image, empty_mask)

        except Exception as e:
            print(f"[KOOK_图像蒙版编辑] 节点执行出错: {str(e)}")
            traceback.print_exc()
            h, w = image.shape[1], image.shape[2]
            empty_mask = torch.zeros((1, h, w), dtype=torch.float32)
            return (image, empty_mask)


@PromptServer.instance.routes.post("/kook_mask_editor/apply")
async def apply_mask_editor(request):
    """处理前端提交的蒙版数据"""
    try:
        data = await request.json()
        node_id = data.get("node_id")
        session_id = data.get("session_id")  # 使用会话ID
        mask_data_base64 = data.get("mask_data")
        image_data_base64 = data.get("image_data")  # 合并后的图像数据
        
        print(f"[KOOK_图像蒙版编辑] 收到apply请求，节点ID: {node_id}, 会话ID: {session_id}")
        
        if not session_id:
            print(f"[KOOK_图像蒙版编辑] 错误: 缺少session_id")
            return web.json_response({"success": False, "error": "缺少session_id"})

        # 如果有合并后的图像数据，保存它
        if image_data_base64:
            try:
                print(f"[KOOK_图像蒙版编辑] 接收到图像数据，长度: {len(image_data_base64)}")
                if image_data_base64.startswith('data:image'):
                    base64_data = image_data_base64.split(',')[1]
                    print(f"[KOOK_图像蒙版编辑] 图像格式: {image_data_base64.split(',')[0][:30]}...")
                else:
                    base64_data = image_data_base64

                image_bytes = base64.b64decode(base64_data)
                print(f"[KOOK_图像蒙版编辑] 解码后图像大小: {len(image_bytes)} bytes")
                image_buffer = io.BytesIO(image_bytes)
                merged_image = Image.open(image_buffer)
                
                print(f"[KOOK_图像蒙版编辑] 图像已加载，模式: {merged_image.mode}, 尺寸: {merged_image.size}")
                
                # 确保图像是RGB模式
                if merged_image.mode != 'RGB':
                    merged_image = merged_image.convert('RGB')

                # 保存合并后的图像（使用PNG保持质量）
                merged_path = os.path.join(MASK_STORAGE_DIR, f"merged_{session_id}.png")
                merged_image.save(merged_path, 'PNG')
                print(f"[KOOK_图像蒙版编辑] 合并后的图像已保存到: {merged_path}, 尺寸: {merged_image.size}, 模式: {merged_image.mode}")

                # 保存标记文件表示有合并图像
                flag_path = os.path.join(MASK_STORAGE_DIR, f"has_merged_{session_id}.txt")
                with open(flag_path, 'w') as f:
                    f.write(merged_path)
                print(f"[KOOK_图像蒙版编辑] 合并图像标记已保存")
            except Exception as img_err:
                print(f"[KOOK_图像蒙版编辑] 保存合并图像失败: {img_err}")
                traceback.print_exc()

        if mask_data_base64:
            try:
                # 解码 base64 蒙版数据
                if mask_data_base64.startswith('data:image'):
                    base64_data = mask_data_base64.split(',')[1]
                else:
                    base64_data = mask_data_base64

                mask_bytes = base64.b64decode(base64_data)
                mask_buffer = io.BytesIO(mask_bytes)
                mask_image = Image.open(mask_buffer)

                # 保存调试图像（仅用于调试，保存到存储目录）
                try:
                    debug_path = os.path.join(MASK_STORAGE_DIR, f"debug_mask_{session_id}.png")
                    mask_image.save(debug_path)
                    print(f"[KOOK_图像蒙版编辑] 调试蒙版已保存到: {debug_path}")
                except Exception as debug_err:
                    print(f"[KOOK_图像蒙版编辑] 保存调试蒙版失败（非关键错误）: {debug_err}")

                # 转换为灰度图
                print(f"[KOOK_图像蒙版编辑] 蒙版图像模式: {mask_image.mode}, 尺寸: {mask_image.size}")
                if mask_image.mode != 'L':
                    mask_image = mask_image.convert('L')

                # 转换为 numpy 数组
                mask_array = np.array(mask_image).astype(np.float32) / 255.0
                print(f"[KOOK_图像蒙版编辑] 蒙版数组形状: {mask_array.shape}, 最小值: {mask_array.min():.4f}, 最大值: {mask_array.max():.4f}, 非零像素数: {np.count_nonzero(mask_array)}")
                
                # 检查蒙版数据是否有效（白色区域应该是重绘区域）
                white_pixels = np.count_nonzero(mask_array > 0.5)
                black_pixels = np.count_nonzero(mask_array < 0.5)
                print(f"[KOOK_图像蒙版编辑] 白色像素(>0.5): {white_pixels}, 黑色像素(<0.5): {black_pixels}")

                # 保存到文件（使用session_id）
                mask_path = os.path.join(MASK_STORAGE_DIR, f"mask_{session_id}.npy")
                np.save(mask_path, mask_array)
                print(f"[KOOK_图像蒙版编辑] 蒙版已保存到文件: {mask_path}")
                print(f"[KOOK_图像蒙版编辑] 蒙版文件是否存在: {os.path.exists(mask_path)}")
                
                # 保存状态
                status_path = os.path.join(MASK_STORAGE_DIR, f"status_{session_id}.json")
                status_data = {
                    "processing_complete": True,
                    "cancelled": False,
                    "session_id": session_id,
                    "node_id": node_id
                }
                with open(status_path, 'w') as f:
                    json.dump(status_data, f)
                print(f"[KOOK_图像蒙版编辑] 状态已保存到文件: {status_path}")
                print(f"[KOOK_图像蒙版编辑] 状态文件是否存在: {os.path.exists(status_path)}")
                print(f"[KOOK_图像蒙版编辑] 状态内容: {status_data}")

                return web.json_response({"success": True})

            except Exception as e:
                print(f"[KOOK_图像蒙版编辑] 处理蒙版数据时出错: {str(e)}")
                traceback.print_exc()
                # 保存错误状态
                status_path = os.path.join(MASK_STORAGE_DIR, f"status_{session_id}.json")
                with open(status_path, 'w') as f:
                    json.dump({
                        "processing_complete": True,
                        "cancelled": True,
                        "session_id": session_id,
                        "node_id": node_id
                    }, f)
                return web.json_response({"success": False, "error": str(e)})

        return web.json_response({"success": False, "error": "无蒙版数据"})

    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 请求处理出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


@PromptServer.instance.routes.post("/kook_mask_editor/cancel")
async def cancel_mask_editor(request):
    """处理取消请求"""
    try:
        data = await request.json()
        node_id = data.get("node_id")
        session_id = data.get("session_id")  # 使用会话ID
        
        print(f"[KOOK_图像蒙版编辑] 收到cancel请求，节点ID: {node_id}, 会话ID: {session_id}")
        
        if not session_id:
            print(f"[KOOK_图像蒙版编辑] 错误: 缺少session_id")
            return web.json_response({"success": False, "error": "缺少session_id"})
        
        # 保存取消状态到文件（仅当状态文件不存在时才保存）
        if session_id:
            status_path = os.path.join(MASK_STORAGE_DIR, f"status_{session_id}.json")
            if os.path.exists(status_path):
                print(f"[KOOK_图像蒙版编辑] 警告: 状态文件已存在，不覆盖: {status_path}")
                # 读取现有状态
                try:
                    with open(status_path, 'r') as f:
                        existing_status = json.load(f)
                    print(f"[KOOK_图像蒙版编辑] 现有状态: {existing_status}")
                except Exception as e:
                    print(f"[KOOK_图像蒙版编辑] 读取现有状态失败: {e}")
            else:
                with open(status_path, 'w') as f:
                    json.dump({
                        "processing_complete": True,
                        "cancelled": True,
                        "session_id": session_id,
                        "node_id": node_id
                    }, f)
                print(f"[KOOK_图像蒙版编辑] 取消状态已保存到文件: {status_path}")
        
        return web.json_response({"success": True})

    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 取消请求处理出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


# 存储预览图像数据（用于右键菜单功能）
preview_image_cache = {}

# 存储当前会话的图像数据（用于HTTP轮询）
session_image_data = {}


@PromptServer.instance.routes.get("/kook_mask_editor/get_image/{session_id}")
async def get_session_image(request):
    """通过HTTP获取当前会话的图像数据（备用方案）"""
    try:
        session_id = request.match_info.get("session_id")
        print(f"[KOOK_图像蒙版编辑] HTTP获取图像请求，会话ID: {session_id}")
        
        if session_id in session_image_data:
            data = session_image_data[session_id]
            return web.json_response({
                "success": True,
                "node_id": data["node_id"],
                "session_id": session_id,
                "image_data": data["image_data"],
                "width": data["width"],
                "height": data["height"]
            })
        else:
            print(f"[KOOK_图像蒙版编辑] 会话数据不存在: {session_id}")
            return web.json_response({"success": False, "error": "会话不存在或已过期"})
    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] HTTP获取图像出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


@PromptServer.instance.routes.post("/kook_mask_editor/get_preview")
async def get_preview_image(request):
    """获取输入图像的预览（用于右键菜单打开编辑器）"""
    try:
        data = await request.json()
        node_id = data.get("node_id")
        input_node_id = data.get("input_node_id")

        # 从缓存中获取预览图像
        cache_key = f"{node_id}_{input_node_id}"
        if cache_key in preview_image_cache:
            cached_data = preview_image_cache[cache_key]
            return web.json_response({
                "success": True,
                "image_data": cached_data["image_data"],
                "width": cached_data["width"],
                "height": cached_data["height"]
            })

        return web.json_response({"success": False, "error": "没有可用的图像预览，请先运行一次工作流"})

    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 获取预览图像出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


@PromptServer.instance.routes.post("/kook_mask_editor/apply_preview")
async def apply_preview_mask(request):
    """应用通过右键菜单编辑的蒙版"""
    try:
        data = await request.json()
        node_id = data.get("node_id")
        mask_data_base64 = data.get("mask_data")

        # 存储蒙版数据到缓存，供下次节点执行时使用
        if mask_data_base64:
            try:
                # 解码 base64 蒙版数据
                if mask_data_base64.startswith('data:image'):
                    base64_data = mask_data_base64.split(',')[1]
                else:
                    base64_data = mask_data_base64

                mask_bytes = base64.b64decode(base64_data)
                mask_buffer = io.BytesIO(mask_bytes)
                mask_image = Image.open(mask_buffer)

                # 转换为灰度图
                if mask_image.mode != 'L':
                    mask_image = mask_image.convert('L')

                # 转换为 numpy 数组
                mask_array = np.array(mask_image).astype(np.float32) / 255.0

                # 转换为 torch tensor
                mask_tensor = torch.from_numpy(mask_array).unsqueeze(0)

                # 存储到全局缓存
                mask_editor_node_data[f"preview_mask_{node_id}"] = mask_tensor

                return web.json_response({"success": True})

            except Exception as e:
                print(f"[KOOK_图像蒙版编辑] 处理预览蒙版数据时出错: {str(e)}")
                traceback.print_exc()
                return web.json_response({"success": False, "error": str(e)})

        return web.json_response({"success": False, "error": "无蒙版数据"})

    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 应用预览蒙版请求处理出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


@PromptServer.instance.routes.post("/kook_mask_editor/clear_mask")
async def clear_mask(request):
    """清除蒙版缓存"""
    try:
        data = await request.json()
        node_id = data.get("node_id")

        # 清除预览蒙版缓存
        cache_key = f"preview_mask_{node_id}"
        if cache_key in mask_editor_node_data:
            del mask_editor_node_data[cache_key]

        return web.json_response({"success": True})

    except Exception as e:
        print(f"[KOOK_图像蒙版编辑] 清除蒙版出错: {str(e)}")
        traceback.print_exc()
        return web.json_response({"success": False, "error": str(e)})


NODE_CLASS_MAPPINGS = {
    "KOOKImageMaskEditing": KOOKImageMaskEditing,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "KOOKImageMaskEditing": "KOOK_图像蒙版编辑",
}
