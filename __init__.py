"""
KOOK_Image_Mask_Editing - ComfyUI 图像蒙版编辑节点
提供交互式蒙版编辑功能
"""

import importlib.util
import os
import sys

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
WEB_DIRECTORY = "web"


def get_ext_dir(subpath=None, mkdir=False):
    """获取扩展目录路径"""
    dir = os.path.dirname(__file__)
    if subpath is not None:
        dir = os.path.join(dir, subpath)

    dir = os.path.abspath(dir)

    if mkdir and not os.path.exists(dir):
        os.makedirs(dir)
    return dir


def serialize(obj):
    """序列化对象"""
    if isinstance(obj, (str, int, float, bool, list, dict, type(None))):
        return obj
    return str(obj)


print(f"[KOOK_Image_Mask_Editing] 正在加载扩展, 目录: {get_ext_dir()}")
print(f"[KOOK_Image_Mask_Editing] WEB_DIRECTORY: {WEB_DIRECTORY}")

# 加载 py 目录下的所有节点
py = get_ext_dir("py")
if os.path.exists(py):
    files = os.listdir(py)
    print(f"[KOOK_Image_Mask_Editing] 发现 {len(files)} 个文件在 py 目录")
    for file in files:
        if not file.endswith(".py"):
            continue
        name = os.path.splitext(file)[0]
        try:
            module_path = os.path.join(py, file)
            print(f"[KOOK_Image_Mask_Editing] 正在加载节点: {file}")
            spec = importlib.util.spec_from_file_location(name, module_path)
            module = importlib.util.module_from_spec(spec)
            sys.modules[name] = module
            spec.loader.exec_module(module)

            if hasattr(module, "NODE_CLASS_MAPPINGS"):
                NODE_CLASS_MAPPINGS.update(module.NODE_CLASS_MAPPINGS)
                print(f"[KOOK_Image_Mask_Editing] 已注册节点类: {list(module.NODE_CLASS_MAPPINGS.keys())}")
            if hasattr(module, "NODE_DISPLAY_NAME_MAPPINGS"):
                NODE_DISPLAY_NAME_MAPPINGS.update(module.NODE_DISPLAY_NAME_MAPPINGS)
                print(f"[KOOK_Image_Mask_Editing] 已注册节点显示名称: {list(module.NODE_DISPLAY_NAME_MAPPINGS.values())}")
        except Exception as e:
            print(f"[KOOK_Image_Mask_Editing] 加载节点 {file} 失败: {e}")
            import traceback
            traceback.print_exc()

print(f"[KOOK_Image_Mask_Editing] 扩展加载完成")
print(f"[KOOK_Image_Mask_Editing] NODE_CLASS_MAPPINGS: {list(NODE_CLASS_MAPPINGS.keys())}")
print(f"[KOOK_Image_Mask_Editing] NODE_DISPLAY_NAME_MAPPINGS: {list(NODE_DISPLAY_NAME_MAPPINGS.values())}")

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
