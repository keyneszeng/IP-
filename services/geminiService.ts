
import { GoogleGenAI, Type } from "@google/genai";
import { BrandData } from "../types";

// 注意：API Key 在调用时根据最新状态重新实例化
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeOrGenerateLogo = async (name: string, industry: string, prototype?: string, logoBase64?: string): Promise<BrandData> => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  
  const prototypeInstruction = prototype 
    ? `核心形象原型已设定为："${prototype}"。` 
    : `核心形象原型未设定，请根据上传的 Logo 视觉风格、线条特征或品牌隐喻，建议一个最契合的形象原型（如某种动物、植物或几何角色）。`;

  const textPrompt = logoBase64 
    ? `你现在是一名资深的品牌视觉分析师。请仔细分析上传的真实品牌 Logo 图片。品牌名称为"${name}"，行业为"${industry}"。
       你的任务是基于这张现有的 Logo 图片提取其品牌基因，严禁提出任何重新设计或修改 Logo 的建议。
       ${prototypeInstruction}
       请严格基于图片的视觉事实进行提取：
       1. **色彩系统**：提取图片中实际使用的品牌主色及辅助色（需提供准确的 HEX 色值）；
       2. **品牌性格**：提取 5-6 个能准确描述该 Logo 视觉风格的性格关键词（如：硬朗、亲和、科技感、极简等）；
       3. **受众画像**：基于视觉语言描述该品牌的目标受众特征；
       4. **核心价值**：推导该视觉表现背后传递的核心价值理念；
       5. **形象原型建议**：如果输入原型为空，请返回建议的 "suggestedPrototype"。
       请务必使用中文（简体）以 JSON 格式返回。`
    : `为品牌 "${name}"（行业：${industry}）创建一个专业的品牌 DNA 分析。${prototypeInstruction}
       建议：
       1. 3个核心 HEX 颜色值；
       2. 5-6个品牌性格关键词；
       3. 目标受众描述；
       4. 核心价值描述；
       5. 如果未设定原型，请返回建议的 "suggestedPrototype"。
       请务必使用中文（简体）以 JSON 格式返回。`;

  const contents: any = logoBase64 ? {
    parts: [
      { inlineData: { mimeType: "image/png", data: logoBase64.split(',')[1] || logoBase64 } },
      { text: textPrompt }
    ]
  } : textPrompt;

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }, // 启用深度思考以获取更专业的分析
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          colors: { type: Type.ARRAY, items: { type: Type.STRING } },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetAudience: { type: Type.STRING },
          coreValues: { type: Type.STRING },
          suggestedPrototype: { type: Type.STRING, description: "如果输入原型为空，请建议一个原型名称" },
        },
        required: ["colors", "keywords", "targetAudience", "coreValues"]
      }
    }
  });

  const analysis = JSON.parse(response.text || '{}');
  
  return {
    name,
    industry,
    prototype: prototype || analysis.suggestedPrototype || '拟人化形象',
    logoUrl: logoBase64 || `https://picsum.photos/seed/${name}/400/400`,
    ...analysis
  };
};

export const generateDesignSection = async (sectionTitle: string, brandData: BrandData): Promise<string> => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-preview';
  const prompt = `为品牌IP角色开发看板的 "${sectionTitle}" 部分生成专业的技术设计注释和描述。
  品牌：${brandData.name}（${brandData.industry}）
  角色形象原型：${brandData.prototype}
  品牌关键词：${brandData.keywords.join(', ')}
  风格：现代、商业设计文档、专业、精细。
  请提供详细的、听起来很专业的技术说明、尺寸标注建议和设计理念。请务必使用中文（简体）以列表形式回答。`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 16384 } // 启用思考以生成更精细的技术文档
    }
  });

  return response.text || "数据生成中...";
};

export const generateBlockImage = async (prompt: string, prototype: string, brandName: string): Promise<string> => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-image-preview';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: `${prompt} Character is a ${prototype} for the brand ${brandName}. High-end professional commercial illustration, professional studio lighting, 4K resolution quality, design studio aesthetic, clear white background, technical annotations.` }]
    },
    config: {
      imageConfig: { 
        aspectRatio: "1:1",
        imageSize: "1K" // 专业级默认使用 1K，可按需提升
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return '';
};
