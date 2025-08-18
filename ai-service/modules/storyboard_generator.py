import asyncio
import logging
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

class StoryboardGenerator:
    """故事板生成器，用于生成剧本和故事板"""
    
    def __init__(self):
        self.scene_templates = {
            "开场": {
                "description": "故事的开始，介绍主要角色和背景",
                "typical_duration": "10-30秒",
                "camera_suggestions": ["全景镜头", "建立镜头", "特写介绍"]
            },
            "发展": {
                "description": "故事情节的推进和冲突的建立",
                "typical_duration": "30-60秒",
                "camera_suggestions": ["中景镜头", "对话镜头", "动作镜头"]
            },
            "高潮": {
                "description": "故事的转折点和最激烈的部分",
                "typical_duration": "15-45秒",
                "camera_suggestions": ["特写镜头", "快速剪切", "动态镜头"]
            },
            "结尾": {
                "description": "故事的解决和总结",
                "typical_duration": "10-30秒",
                "camera_suggestions": ["全景镜头", "淡出镜头", "总结镜头"]
            }
        }
        
        self.camera_movements = [
            "推镜头", "拉镜头", "摇镜头", "移镜头", 
            "升降镜头", "跟镜头", "环绕镜头", "固定镜头"
        ]
        
        self.shot_types = [
            "远景", "全景", "中景", "近景", "特写", 
            "大特写", "俯视", "仰视", "平视"
        ]
    
    async def generate_script(self, theme: str, duration: int = 60, 
                             style: str = "通用", characters: List[str] = None,
                             scenes: List[str] = None) -> Dict[str, Any]:
        """生成剧本"""
        try:
            logger.info(f"Generating script for theme: {theme}")
            logger.info(f"Duration: {duration}s, Style: {style}")
            
            # 模拟生成时间
            await asyncio.sleep(2)
            
            # 生成剧本结构
            script = await self._create_script_structure(
                theme, duration, style, characters, scenes
            )
            
            return {
                "success": True,
                "script": script,
                "metadata": {
                    "theme": theme,
                    "duration": duration,
                    "style": style,
                    "generated_at": datetime.now().isoformat(),
                    "total_scenes": len(script.get("scenes", [])),
                    "estimated_shots": sum(len(scene.get("shots", [])) for scene in script.get("scenes", []))
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating script: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _create_script_structure(self, theme: str, duration: int, 
                                      style: str, characters: List[str], 
                                      scenes: List[str]) -> Dict[str, Any]:
        """创建剧本结构"""
        # 如果没有提供角色，生成默认角色
        if not characters:
            characters = self._generate_default_characters(theme)
        
        # 如果没有提供场景，生成默认场景
        if not scenes:
            scenes = self._generate_default_scenes(theme, duration)
        
        # 计算每个场景的时长分配
        scene_durations = self._allocate_scene_durations(duration, len(scenes))
        
        script_scenes = []
        for i, scene_name in enumerate(scenes):
            scene_duration = scene_durations[i]
            scene_data = await self._create_scene(
                scene_name, scene_duration, characters, theme, style
            )
            script_scenes.append(scene_data)
        
        return {
            "title": f"{theme} - {style}风格短片",
            "theme": theme,
            "style": style,
            "total_duration": duration,
            "characters": characters,
            "scenes": script_scenes,
            "notes": f"这是一个{duration}秒的{style}风格短片，主题为{theme}"
        }
    
    def _generate_default_characters(self, theme: str) -> List[str]:
        """根据主题生成默认角色"""
        character_templates = {
            "爱情": ["男主角", "女主角", "配角朋友"],
            "冒险": ["探险者", "向导", "神秘人物"],
            "科幻": ["科学家", "机器人", "外星人"],
            "悬疑": ["侦探", "嫌疑人", "证人"],
            "喜剧": ["主角", "搞笑配角", "严肃角色"],
            "动作": ["英雄", "反派", "盟友"]
        }
        
        # 根据主题关键词匹配
        for key, chars in character_templates.items():
            if key in theme:
                return chars
        
        # 默认角色
        return ["主角", "配角A", "配角B"]
    
    def _generate_default_scenes(self, theme: str, duration: int) -> List[str]:
        """根据主题和时长生成默认场景"""
        if duration <= 30:
            return ["开场", "高潮", "结尾"]
        elif duration <= 60:
            return ["开场", "发展", "高潮", "结尾"]
        else:
            return ["开场", "发展A", "发展B", "高潮", "结尾"]
    
    def _allocate_scene_durations(self, total_duration: int, scene_count: int) -> List[int]:
        """分配场景时长"""
        if scene_count == 3:
            # 开场:发展:结尾 = 2:3:1
            return [
                int(total_duration * 0.3),
                int(total_duration * 0.5),
                int(total_duration * 0.2)
            ]
        elif scene_count == 4:
            # 开场:发展:高潮:结尾 = 2:3:3:2
            return [
                int(total_duration * 0.2),
                int(total_duration * 0.3),
                int(total_duration * 0.3),
                int(total_duration * 0.2)
            ]
        elif scene_count == 5:
            # 开场:发展A:发展B:高潮:结尾 = 1:2:2:3:2
            return [
                int(total_duration * 0.1),
                int(total_duration * 0.2),
                int(total_duration * 0.2),
                int(total_duration * 0.3),
                int(total_duration * 0.2)
            ]
        else:
            # 平均分配
            base_duration = total_duration // scene_count
            return [base_duration] * scene_count
    
    async def _create_scene(self, scene_name: str, duration: int, 
                           characters: List[str], theme: str, style: str) -> Dict[str, Any]:
        """创建单个场景"""
        # 根据场景时长确定镜头数量
        shot_count = max(2, duration // 8)  # 平均每个镜头8秒
        shot_duration = duration // shot_count
        
        shots = []
        for i in range(shot_count):
            shot = await self._create_shot(
                i + 1, shot_duration, characters, theme, style, scene_name
            )
            shots.append(shot)
        
        scene_template = self.scene_templates.get(scene_name, {
            "description": f"{scene_name}场景",
            "typical_duration": f"{duration}秒",
            "camera_suggestions": ["中景镜头"]
        })
        
        return {
            "name": scene_name,
            "duration": duration,
            "description": scene_template["description"],
            "shots": shots,
            "notes": f"本场景时长{duration}秒，包含{shot_count}个镜头"
        }
    
    async def _create_shot(self, shot_number: int, duration: int, 
                          characters: List[str], theme: str, style: str, 
                          scene_name: str) -> Dict[str, Any]:
        """创建单个镜头"""
        import random
        
        # 随机选择镜头类型和运动
        shot_type = random.choice(self.shot_types)
        camera_movement = random.choice(self.camera_movements)
        character = random.choice(characters) if characters else "主角"
        
        # 根据主题生成描述
        descriptions = self._generate_shot_descriptions(theme, style, scene_name, character)
        description = random.choice(descriptions)
        
        return {
            "shot_number": shot_number,
            "duration": duration,
            "shot_type": shot_type,
            "camera_movement": camera_movement,
            "character": character,
            "description": description,
            "dialogue": self._generate_dialogue(character, theme, style),
            "visual_notes": f"{shot_type}，{camera_movement}",
            "audio_notes": "背景音乐，环境音效"
        }
    
    def _generate_shot_descriptions(self, theme: str, style: str, 
                                   scene_name: str, character: str) -> List[str]:
        """生成镜头描述"""
        base_descriptions = [
            f"{character}出现在画面中",
            f"{character}进行关键动作",
            f"展示{character}的表情变化",
            f"{character}与环境互动",
            f"特写{character}的重要细节"
        ]
        
        # 根据场景类型调整描述
        if "开场" in scene_name:
            base_descriptions.extend([
                f"介绍{character}的背景",
                f"建立{character}所在的环境",
                f"展示故事的起始状态"
            ])
        elif "高潮" in scene_name:
            base_descriptions.extend([
                f"{character}面临重要选择",
                f"展示{character}的情感爆发",
                f"关键冲突的展现"
            ])
        elif "结尾" in scene_name:
            base_descriptions.extend([
                f"{character}的最终状态",
                f"故事的解决方案",
                f"总结性的画面"
            ])
        
        return base_descriptions
    
    def _generate_dialogue(self, character: str, theme: str, style: str) -> str:
        """生成对话"""
        dialogue_templates = {
            "爱情": [f"{character}: 我一直在等你", f"{character}: 这就是我想要的"],
            "冒险": [f"{character}: 我们必须继续前进", f"{character}: 危险就在前方"],
            "科幻": [f"{character}: 这改变了一切", f"{character}: 未来就在我们手中"],
            "悬疑": [f"{character}: 真相就在这里", f"{character}: 事情不是看起来那样"],
            "喜剧": [f"{character}: 这太荒谬了", f"{character}: 我没想到会这样"],
            "动作": [f"{character}: 行动开始", f"{character}: 我们不能失败"]
        }
        
        import random
        
        # 根据主题选择对话
        for key, dialogues in dialogue_templates.items():
            if key in theme:
                return random.choice(dialogues)
        
        # 默认对话
        return f"{character}: [根据剧情需要添加对话]"
    
    async def generate_storyboard(self, script: Dict[str, Any], 
                                 visual_style: str = "现实主义") -> Dict[str, Any]:
        """根据剧本生成故事板"""
        try:
            logger.info(f"Generating storyboard with visual style: {visual_style}")
            
            # 模拟生成时间
            await asyncio.sleep(1)
            
            storyboard_scenes = []
            
            for scene in script.get("scenes", []):
                storyboard_scene = await self._create_storyboard_scene(
                    scene, visual_style
                )
                storyboard_scenes.append(storyboard_scene)
            
            return {
                "success": True,
                "storyboard": {
                    "title": script.get("title", "未命名故事板"),
                    "visual_style": visual_style,
                    "total_scenes": len(storyboard_scenes),
                    "scenes": storyboard_scenes,
                    "generated_at": datetime.now().isoformat()
                },
                "metadata": {
                    "total_shots": sum(len(scene.get("shots", [])) for scene in storyboard_scenes),
                    "estimated_production_time": self._estimate_production_time(storyboard_scenes)
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating storyboard: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _create_storyboard_scene(self, scene: Dict[str, Any], 
                                      visual_style: str) -> Dict[str, Any]:
        """创建故事板场景"""
        storyboard_shots = []
        
        for shot in scene.get("shots", []):
            storyboard_shot = {
                "shot_number": shot["shot_number"],
                "duration": shot["duration"],
                "visual_description": self._enhance_visual_description(
                    shot["description"], visual_style
                ),
                "camera_setup": {
                    "shot_type": shot["shot_type"],
                    "movement": shot["camera_movement"],
                    "angle": "平视",  # 可以根据需要调整
                    "lens": "标准镜头"  # 可以根据需要调整
                },
                "lighting": self._suggest_lighting(visual_style, shot),
                "composition": self._suggest_composition(shot["shot_type"]),
                "dialogue": shot.get("dialogue", ""),
                "notes": shot.get("visual_notes", "")
            }
            storyboard_shots.append(storyboard_shot)
        
        return {
            "scene_name": scene["name"],
            "duration": scene["duration"],
            "description": scene["description"],
            "shots": storyboard_shots,
            "scene_notes": scene.get("notes", "")
        }
    
    def _enhance_visual_description(self, description: str, visual_style: str) -> str:
        """增强视觉描述"""
        style_enhancements = {
            "现实主义": "自然光线，真实色彩，细节丰富",
            "电影感": "戏剧性光影，深度景深，电影级构图",
            "动画风格": "鲜艳色彩，夸张表现，卡通化处理",
            "复古风格": "怀旧色调，胶片质感，经典构图",
            "未来科幻": "冷色调，科技感，几何构图",
            "艺术风格": "创意构图，独特色彩，艺术化表现"
        }
        
        enhancement = style_enhancements.get(visual_style, "标准视觉处理")
        return f"{description}。视觉风格：{enhancement}"
    
    def _suggest_lighting(self, visual_style: str, shot: Dict[str, Any]) -> str:
        """建议灯光设置"""
        lighting_suggestions = {
            "现实主义": "自然光，柔和阴影",
            "电影感": "三点布光，戏剧性对比",
            "动画风格": "明亮均匀，少阴影",
            "复古风格": "温暖色温，柔和光线",
            "未来科幻": "冷光源，强对比",
            "艺术风格": "创意光效，色彩光线"
        }
        
        return lighting_suggestions.get(visual_style, "标准布光")
    
    def _suggest_composition(self, shot_type: str) -> str:
        """建议构图方式"""
        composition_rules = {
            "远景": "三分法则，地平线构图",
            "全景": "对称构图，环境展示",
            "中景": "黄金比例，人物居中",
            "近景": "紧密构图，情感表达",
            "特写": "填充画面，细节突出",
            "大特写": "极简构图，强烈冲击"
        }
        
        return composition_rules.get(shot_type, "标准构图")
    
    def _estimate_production_time(self, scenes: List[Dict[str, Any]]) -> str:
        """估算制作时间"""
        total_shots = sum(len(scene.get("shots", [])) for scene in scenes)
        
        # 假设每个镜头需要30分钟制作时间
        total_minutes = total_shots * 30
        hours = total_minutes // 60
        minutes = total_minutes % 60
        
        return f"{hours}小时{minutes}分钟"
    
    async def export_script(self, script: Dict[str, Any], 
                           format_type: str = "json", 
                           output_path: str = "") -> str:
        """导出剧本"""
        try:
            if not output_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"script_{timestamp}.{format_type}"
                output_path = os.path.join("/tmp", filename)
            
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            if format_type == "json":
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(script, f, ensure_ascii=False, indent=2)
            elif format_type == "txt":
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(self._format_script_as_text(script))
            else:
                raise ValueError(f"Unsupported format: {format_type}")
            
            logger.info(f"Script exported to: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error exporting script: {e}")
            raise
    
    def _format_script_as_text(self, script: Dict[str, Any]) -> str:
        """将剧本格式化为文本"""
        lines = []
        lines.append(f"标题: {script.get('title', '未命名')}")
        lines.append(f"主题: {script.get('theme', '未知')}")
        lines.append(f"风格: {script.get('style', '未知')}")
        lines.append(f"总时长: {script.get('total_duration', 0)}秒")
        lines.append("\n角色:")
        
        for character in script.get('characters', []):
            lines.append(f"- {character}")
        
        lines.append("\n场景:")
        
        for i, scene in enumerate(script.get('scenes', []), 1):
            lines.append(f"\n场景 {i}: {scene['name']}")
            lines.append(f"时长: {scene['duration']}秒")
            lines.append(f"描述: {scene['description']}")
            
            for shot in scene.get('shots', []):
                lines.append(f"\n  镜头 {shot['shot_number']}:")
                lines.append(f"    时长: {shot['duration']}秒")
                lines.append(f"    类型: {shot['shot_type']}")
                lines.append(f"    运动: {shot['camera_movement']}")
                lines.append(f"    角色: {shot['character']}")
                lines.append(f"    描述: {shot['description']}")
                if shot.get('dialogue'):
                    lines.append(f"    对话: {shot['dialogue']}")
        
        return "\n".join(lines)

# 测试函数
if __name__ == "__main__":
    async def test_generator():
        generator = StoryboardGenerator()
        
        # 测试剧本生成
        script_result = await generator.generate_script(
            theme="科幻冒险",
            duration=60,
            style="电影感",
            characters=["探险者", "机器人助手", "外星向导"]
        )
        
        print("Generated script:")
        print(json.dumps(script_result, ensure_ascii=False, indent=2))
        
        if script_result["success"]:
            # 测试故事板生成
            storyboard_result = await generator.generate_storyboard(
                script_result["script"],
                visual_style="未来科幻"
            )
            
            print("\nGenerated storyboard:")
            print(json.dumps(storyboard_result, ensure_ascii=False, indent=2))