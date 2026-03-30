"""
KOOK_图片保存节点
保存图像到指定目录，同时输出图像供下游使用
支持图像缓存，前面节点被忽略时也能输出缓存的图像
"""

import torch
import numpy as np
from PIL import Image
from PIL.PngImagePlugin import PngInfo
import os
import json
import sys

# 导入ComfyUI相关模块
try:
    import folder_paths
    import comfy.utils
except ImportError:
    print("[KOOK_图片保存] 警告: 无法导入ComfyUI模块")


# 获取命令行参数
try:
    args = comfy.utils.parse_args()
except:
    # 如果无法获取args，创建一个模拟对象
    class MockArgs:
        disable_metadata = False
    args = MockArgs()


# 全局图像缓存
image_cache = {}


class KOOKImageSave:
    """KOOK_图片保存节点 - 保存图像并输出供下游使用"""

    def __init__(self):
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"
        self.prefix_append = ""
        self.compress_level = 4

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "filename_prefix": ("STRING", {"default": "ComfyUI"}),
            },
            "hidden": {
                "prompt": "PROMPT",
                "extra_pnginfo": "EXTRA_PNGINFO",
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("IMAGE",)
    RETURN_NAMES = ("图像",)
    FUNCTION = "save_images"
    CATEGORY = "KOOK"

    def save_images(self, images, filename_prefix="ComfyUI", prompt=None, extra_pnginfo=None, unique_id=None):
        """保存图像并返回图像供下游使用"""
        node_id = unique_id
        
        # 如果有输入图像，保存并缓存
        if images is not None and len(images) > 0:
            # 缓存图像
            image_cache[node_id] = images.clone()
            print(f"[KOOK_图片保存] 图像已缓存，节点ID: {node_id}")
            
            # 执行保存逻辑
            return self._do_save(images, filename_prefix, prompt, extra_pnginfo, node_id)
        
        # 如果没有输入图像，尝试从缓存获取
        if node_id in image_cache:
            cached_images = image_cache[node_id]
            print(f"[KOOK_图片保存] 使用缓存的图像，节点ID: {node_id}")
            return (cached_images,)
        
        # 没有缓存，返回空
        print(f"[KOOK_图片保存] 警告: 没有输入图像且没有缓存，节点ID: {node_id}")
        return (None,)

    def _do_save(self, images, filename_prefix, prompt, extra_pnginfo, node_id):
        """执行实际的保存操作"""
        filename_prefix += self.prefix_append
        full_output_folder, filename, counter, subfolder, filename_prefix = folder_paths.get_save_image_path(
            filename_prefix, self.output_dir, images[0].shape[1], images[0].shape[0]
        )

        results = []
        saved_paths = []

        for batch_number, image in enumerate(images):
            # 转换图像格式
            i = 255.0 * image.cpu().numpy()
            img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))

            # 生成文件名
            file = f"{filename}_{counter:05}_.png"
            full_path = os.path.join(full_output_folder, file)

            # 准备元数据
            metadata = None
            if not args.disable_metadata:
                metadata = PngInfo()
                if prompt is not None:
                    metadata.add_text("prompt", json.dumps(prompt))
                if extra_pnginfo is not None:
                    for x in extra_pnginfo:
                        metadata.add_text(x, json.dumps(extra_pnginfo[x]))

            # 保存图像
            img.save(full_path, pnginfo=metadata, compress_level=self.compress_level)
            saved_paths.append(full_path)

            results.append({
                "filename": file,
                "subfolder": subfolder,
                "type": self.type
            })
            counter += 1

        print(f"[KOOK_图片保存] 已保存 {len(images)} 张图片到: {full_output_folder}")
        for path in saved_paths:
            print(f"  - {path}")

        # 返回图像供下游使用
        return (images,)


NODE_CLASS_MAPPINGS = {
    "KOOKImageSave": KOOKImageSave,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "KOOKImageSave": "KOOK_图片保存",
}
