import os
import sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from datetime import datetime
import json
from .utils import log_operation, save_json

class PromptOptimizer:
    """Prompt优化器，使用Qwen2.5-VL-3B-Instruct模型"""
    
    def __init__(self):
        self.model_path = "/root/autodl-tmp/Qwen/Qwen2.5-VL-3B-Instruct"
        self.tokenizer = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.prompt_formulas = self._load_prompt_formulas()
        
    def _load_prompt_formulas(self):
        """加载提示词公式"""
        return {
            "通用型": {
                "formula": "主体 + 动作 + 场景 + 风格",
                "template": "{subject} {action} {scene} {style}",
                "description": "适用于描述通用场景，适合快速生成简单的视频内容"
            },
            "细节型": {
                "formula": "主体 + 动作 + 场景 + 细节描述 + 风格 + 氛围",
                "template": "{subject} {action} {scene} {details} {style} {atmosphere}",
                "description": "适用于需要突出细节的视频描述，适合生成画面内容较为丰富的视频"
            },
            "剧情型": {
                "formula": "主体 + 动作 + 场景 + 时间/顺序 + 风格 + 氛围",
                "template": "{subject} {action} {scene} {time_sequence} {style} {atmosphere}",
                "description": "适用于需要叙述故事或动态情节的视频描述，适合生成具有一定叙事性的视频"
            },
            "艺术型": {
                "formula": "主体 + 动作 + 场景 + 艺术元素 + 风格 + 氛围 + 镜头语言",
                "template": "{subject} {action} {scene} {art_elements} {style} {atmosphere} {camera_language}",
                "description": "适用于追求艺术化表达的视频描述，适合生成具有强烈艺术风格的视频"
            }
        }
    
    def _load_model(self):
        """加载Qwen模型"""
        if self.model is None:
            try:
                log_operation("模型加载", f"开始加载Qwen模型: {self.model_path}")
                
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.model_path,
                    trust_remote_code=True
                )
                
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_path,
                    torch_dtype=torch.bfloat16,
                    device_map="auto",
                    trust_remote_code=True
                )
                
                log_operation("模型加载", "Qwen模型加载成功")
                return True
                
            except Exception as e:
                log_operation("模型加载", f"Qwen模型加载失败: {str(e)}")
                return False
        return True
    
    def _create_optimization_prompt(self, user_input, prompt_type, style_preferences):
        """创建优化提示词的系统提示"""
        
        # 读取prompt_way.md的内容作为参考
        prompt_guide_path = "/root/autodl-tmp/easy2create/prompt_way.md"
        prompt_guide = ""
        if os.path.exists(prompt_guide_path):
            with open(prompt_guide_path, 'r', encoding='utf-8') as f:
                prompt_guide = f.read()
        
        formula_info = self.prompt_formulas.get(prompt_type, self.prompt_formulas["通用型"])
        
        system_prompt = f"""
你是一个专业的AI视频生成提示词优化专家。请根据以下指导原则和用户输入，生成一个优化的视频生成提示词。

## 优化指导原则：
{prompt_guide}

## 当前使用的提示词公式：
类型：{prompt_type}
公式：{formula_info['formula']}
描述：{formula_info['description']}

## 用户偏好风格：
{', '.join(style_preferences)}

## 优化要求：
1. 使用具体、生动的描述词汇
2. 包含适当的视觉细节和动作描述
3. 融入用户选择的风格元素
4. 确保描述逻辑清晰、层次分明
5. 控制长度在50-100字以内
6. 避免模糊或抽象的表达

请直接输出优化后的提示词，不需要解释过程。
"""
        
        user_prompt = f"原始创意：{user_input}"
        
        return system_prompt, user_prompt
    
    def optimize_prompt(self, user_input, prompt_type="通用型", style_preferences=None):
        """优化用户输入的提示词"""
        if style_preferences is None:
            style_preferences = ["写实风格"]
        
        # 如果模型未加载，尝试加载
        if not self._load_model():
            # 如果模型加载失败，使用规则基础的优化
            return self._rule_based_optimization(user_input, prompt_type, style_preferences)
        
        try:
            system_prompt, user_prompt = self._create_optimization_prompt(
                user_input, prompt_type, style_preferences
            )
            
            # 构建对话
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # 生成优化后的提示词
            text = self.tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True
            )
            
            model_inputs = self.tokenizer([text], return_tensors="pt").to(self.device)
            
            with torch.no_grad():
                generated_ids = self.model.generate(
                    model_inputs.input_ids,
                    max_new_tokens=200,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            generated_ids = [
                output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
            ]
            
            optimized_prompt = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()

            #清理显存
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
            # 记录优化结果
            log_operation("Prompt优化", f"原始: {user_input} -> 优化: {optimized_prompt}")
            
            return optimized_prompt
            
        except Exception as e:
            log_operation("Prompt优化", f"模型优化失败: {str(e)}，使用规则优化")
            return self._rule_based_optimization(user_input, prompt_type, style_preferences)
    
    def _rule_based_optimization(self, user_input, prompt_type, style_preferences):
        """基于规则的提示词优化（备用方案）"""
        
        # 基础优化词汇库
        enhancement_words = {
            "画质": ["高清", "4K", "超高清", "精细", "清晰"],
            "光线": ["柔和光线", "自然光", "电影级光效", "戏剧性光影", "温暖光线"],
            "色彩": ["色彩丰富", "饱和度适中", "色调和谐", "对比鲜明"],
            "构图": ["构图精美", "视角独特", "层次分明", "重点突出"],
            "动作": ["动作流畅", "自然运动", "优雅姿态", "生动表现"]
        }
        
        # 风格映射
        style_mapping = {
            "写实风格": "写实风格，细节丰富，真实感强",
            "卡通风格": "卡通风格，色彩明亮，造型可爱",
            "水墨画风格": "中国水墨画风格，意境深远，笔触飘逸",
            "赛博朋克风格": "赛博朋克风格，霓虹灯光，未来科技感",
            "电影风格": "电影级画质，戏剧性光影，专业摄影",
            "超现实主义风格": "超现实主义风格，梦幻色彩，想象力丰富"
        }
        
        # 根据提示词类型添加结构化描述
        formula_info = self.prompt_formulas.get(prompt_type, self.prompt_formulas["通用型"])
        
        optimized_parts = [user_input]
        
        # 添加画质增强
        optimized_parts.extend(["高清画质", "细节丰富"])
        
        # 添加风格描述
        for style in style_preferences:
            if style in style_mapping:
                optimized_parts.append(style_mapping[style])
        
        # 根据类型添加特定元素
        if prompt_type == "细节型":
            optimized_parts.extend(["精细纹理", "丰富细节", "层次分明"])
        elif prompt_type == "剧情型":
            optimized_parts.extend(["故事性强", "情节连贯", "时间流畅"])
        elif prompt_type == "艺术型":
            optimized_parts.extend(["艺术构图", "美学表现", "创意视角"])
        
        # 添加负面提示词排除
        optimized_parts.append("避免模糊、变形、低质量")
        
        optimized_prompt = "，".join(optimized_parts)
        
        log_operation("Prompt优化", f"规则优化: {user_input} -> {optimized_prompt}")
        
        return optimized_prompt
    
    def batch_optimize_prompts(self, prompts_list, prompt_type="通用型", style_preferences=None):
        """批量优化提示词"""
        optimized_prompts = []
        
        for prompt in prompts_list:
            optimized = self.optimize_prompt(prompt, prompt_type, style_preferences)
            optimized_prompts.append({
                'original': prompt,
                'optimized': optimized,
                'type': prompt_type,
                'styles': style_preferences or ["写实风格"],
                'timestamp': datetime.now().isoformat()
            })
        
        return optimized_prompts
    
    def save_optimization_history(self, project_id, original_prompt, optimized_prompt, prompt_type, styles):
        """保存优化历史"""
        history_file = f"/root/autodl-tmp/easy2create/projects/{project_id}/prompt_history.json"
        
        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'original': original_prompt,
            'optimized': optimized_prompt,
            'type': prompt_type,
            'styles': styles
        }
        
        # 加载现有历史
        history = []
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            except:
                history = []
        
        # 添加新记录
        history.append(history_entry)
        
        # 保存历史
        os.makedirs(os.path.dirname(history_file), exist_ok=True)
        save_json(history, history_file)
        
        return history_file
    
    def get_optimization_suggestions(self, user_input):
        """获取优化建议"""
        suggestions = []
        
        # 分析输入内容
        input_lower = user_input.lower()
        
        # 检查是否包含主体
        subjects = ['人', '动物', '物体', '风景', '建筑']
        has_subject = any(subject in user_input for subject in subjects)
        if not has_subject:
            suggestions.append("建议明确描述主体对象（如人物、动物、物品等）")
        
        # 检查是否包含动作
        actions = ['走', '跑', '飞', '游', '跳', '舞', '唱', '笑', '哭']
        has_action = any(action in user_input for action in actions)
        if not has_action:
            suggestions.append("建议添加动作描述，让画面更生动")
        
        # 检查是否包含场景
        scenes = ['室内', '室外', '公园', '街道', '海边', '山上', '森林']
        has_scene = any(scene in user_input for scene in scenes)
        if not has_scene:
            suggestions.append("建议添加场景描述，提供环境背景")
        
        # 检查是否包含风格
        styles = ['风格', '画风', '效果', '质感']
        has_style = any(style in user_input for style in styles)
        if not has_style:
            suggestions.append("建议指定艺术风格，如写实、卡通、水墨等")
        
        # 长度建议
        if len(user_input) < 10:
            suggestions.append("描述过于简短，建议增加更多细节")
        elif len(user_input) > 200:
            suggestions.append("描述过长，建议精简关键信息")
        
        return suggestions
    
    def cleanup_model(self):
        """清理模型内存"""
        if self.model is not None:
            del self.model
            self.model = None
        
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        log_operation("模型清理", "Qwen模型内存已清理")