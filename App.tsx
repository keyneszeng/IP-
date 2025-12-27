
import React, { useState, useRef } from 'react';
import { analyzeOrGenerateLogo, generateDesignSection, generateBlockImage } from './services/geminiService';
import { BrandData, DesignBlock as DesignBlockType } from './types';
import { DesignBlock } from './components/DesignBlock';
import { TechnicalLabel } from './components/TechnicalLabel';

// Removed declare global for aistudio to avoid conflict with existing AIStudio type.
// Will use casting to access window.aistudio features as per guidelines.

const App: React.FC = () => {
  const [name, setName] = useState('沐阳');
  const [industry, setIndustry] = useState('茶饮行业');
  const [prototype, setPrototype] = useState(''); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdatingDNA, setIsUpdatingDNA] = useState(false);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [blocks, setBlocks] = useState<Record<string, DesignBlockType>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to access aistudio from window with casting to avoid global declaration errors
  const getAIStudio = () => (window as any).aistudio;

  const checkKeyAndProceed = async (callback: () => Promise<void>) => {
    try {
      const aistudio = getAIStudio();
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
        // Assume key selection was successful after triggering openSelectKey()
        await callback();
      } else {
        await callback();
      }
    } catch (error: any) {
      // If the request fails with "Requested entity was not found.", prompt for key again.
      if (error.message?.includes("Requested entity was not found")) {
        await getAIStudio().openSelectKey();
      } else {
        console.error("API 调用错误:", error);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        checkKeyAndProceed(async () => { await reAnalyzeDNA(base64String); });
      };
      reader.readAsDataURL(file);
    }
  };

  // Fixed: handleReupload now returns Promise<void> to match checkKeyAndProceed's expected callback type
  const handleReupload = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const reAnalyzeDNA = async (logoBase64?: string) => {
    setIsUpdatingDNA(true);
    try {
      const data = await analyzeOrGenerateLogo(name, industry, prototype, logoBase64 || brandData?.logoUrl);
      setBrandData(data);
      
      if (!prototype && data.prototype) {
        setPrototype(data.prototype);
      }

      setBlocks(prev => ({
        ...prev,
        dna: {
          id: 'dna',
          title: '品牌DNA分析',
          subtitle: '品牌基础 / 核心',
          content: `形象原型: ${data.prototype}\n主色调: ${data.colors.join(', ')}\n核心关键词: ${data.keywords.join(', ')}\n受众定位: ${data.targetAudience}\n品牌使命: ${data.coreValues}`,
          imageUrl: data.logoUrl
        }
      }));
    } catch (error) {
      console.error("品牌 DNA 提取失败:", error);
    } finally {
      setIsUpdatingDNA(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startDesignProcess = async () => {
    await checkKeyAndProceed(async () => {
      setIsGenerating(true);
      try {
        const data = await analyzeOrGenerateLogo(name, industry, prototype);
        setBrandData(data);
        setPrototype(data.prototype);

        const sections = [
          { id: 'dna', title: '品牌DNA分析', sub: '品牌基础' },
          { id: 'concept', title: '概念构思', sub: '创意构思' },
          { id: 'form', title: '形态研究', sub: '形态研究' },
          { id: 'exploration', title: '概念探索', sub: '草图开发' },
          { id: 'linework', title: '精细线稿', sub: '精细线稿' },
          { id: 'refinement', title: '细节精修', sub: '细节精修' },
          { id: 'expressions', title: '表情设定表', sub: '表情设定' },
          { id: 'poses', title: '姿势库', sub: '动作姿势' },
          { id: 'turnaround', title: '转身视图', sub: '转身透视' },
          { id: 'color', title: '色彩开发', sub: '色彩系统' },
          { id: 'material', title: '材质规格', sub: '材质规格' },
          { id: 'app_color', title: '色彩应用', sub: '应用演示' },
          { id: 'tech_guide', title: '构造指南', sub: '技术规范' },
          { id: 'system_rules', title: '设计系统规则', sub: '设计规则' },
          { id: 'variants', title: '资产变体', sub: '资源变体' },
          { id: 'digital', title: '数字应用', sub: '数字端应用' },
          { id: 'physical', title: '实物应用', sub: '物料应用' },
          { id: 'final_render', title: '最终主视觉渲染', sub: '最终渲染' },
        ];

        const newBlocks: Record<string, DesignBlockType> = {};
        const chunks = Array.from({ length: Math.ceil(sections.length / 3) }, (_, i) => 
          sections.slice(i * 3, i * 3 + 3)
        );

        for (const chunk of chunks) {
          await Promise.all(chunk.map(async (sec) => {
            const content = await generateDesignSection(sec.title, data);
            const imageUrl = await generateBlockImage(`专业角色设计：${sec.title}`, data.prototype, data.name);
            
            newBlocks[sec.id] = {
              id: sec.id,
              title: sec.title,
              subtitle: sec.sub,
              content,
              imageUrl
            };
            setBlocks(prev => ({ ...prev, [sec.id]: newBlocks[sec.id] }));
          }));
        }
      } catch (error) {
        console.error("初始化失败:", error);
      } finally {
        setIsGenerating(false);
      }
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      {!brandData && !isGenerating && (
        <div className="max-w-2xl mx-auto mt-20 p-10 bg-white border border-slate-200 shadow-2xl rounded-xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-2xl shadow-lg">PRO</div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">IP 形象高级开发系统</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Powered by Gemini 3 Pro 系列大模型</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <div className="text-xs text-amber-800 leading-relaxed">
                本应用已升级至 <b>Gemini 3 Pro</b> 大模型，可提供深度思考能力及高质量视觉生成。使用前请确保您已配置付费版 API Key（需启用结算）。<br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline font-bold hover:text-amber-900">查看计费说明文档</a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">品牌名称</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold"
                  placeholder="请输入品牌名称，例如：沐阳"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">行业领域</label>
                  <input 
                    type="text" 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold"
                    placeholder="例如：茶饮行业"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">形象原型 (选填)</label>
                  <input 
                    type="text" 
                    value={prototype}
                    onChange={(e) => setPrototype(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold"
                    placeholder="例如：柴犬、熊猫、机器人..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center">
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] technical-font">高级分析：启用深度思考模式 (Thinking Budget: 32K)</p>
            </div>
            
            <button 
              onClick={startDesignProcess}
              className="w-full py-5 bg-slate-900 text-white font-black rounded-lg hover:bg-black transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-sm shadow-xl shadow-slate-200"
            >
              配置 API Key 并启动系统
              <span className="text-2xl">→</span>
            </button>
            <p className="text-[9px] text-center text-slate-300 technical-font uppercase tracking-widest">深度推理引擎 • 高清 4K 插画生成品质</p>
          </div>
        </div>
      )}

      {(brandData || isGenerating) && (
        <div className="max-w-[1920px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* 页眉 */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b-4 border-slate-900 pb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="technical-font text-[10px] font-black px-3 py-1 bg-slate-900 text-white uppercase tracking-widest rounded-sm">V4.0_PRO_CORE</span>
                <span className="technical-font text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full bg-amber-500 ${isGenerating || isUpdatingDNA ? 'animate-ping' : ''}`}></span>
                  Pro 引擎状态: {isGenerating || isUpdatingDNA ? '深度推理中...' : '深度分析就绪 / 高清输出'}
                </span>
              </div>
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {brandData?.name || "加载中"} <span className="text-slate-200">Pro 看板</span>
              </h2>
              <div className="flex flex-wrap gap-6 items-center pt-2">
                <div className="flex items-center gap-3 pr-6 border-r-2 border-slate-100">
                   <div className="w-5 h-5 bg-slate-900 rounded-sm"></div>
                   <span className="text-xs technical-font font-black uppercase tracking-widest text-slate-600">{brandData?.industry || "检测中..."}</span>
                </div>
                <div className="flex items-center gap-3 pr-6 border-r-2 border-slate-100">
                   <span className="text-xs technical-font font-black uppercase tracking-widest text-slate-400">形象原型: {brandData?.prototype || "未设定"}</span>
                </div>
                <div className="flex gap-3">
                  {brandData?.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-md shadow-sm group transition-all hover:border-slate-300">
                      <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: c }}></div>
                      <span className="text-[10px] technical-font text-slate-400 font-bold uppercase">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => window.print()}
                className="px-10 py-4 bg-slate-900 text-white text-[11px] font-black hover:bg-black transition-all uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 rounded-sm"
              >
                导出 4K 高清技术准则
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-32">
            {/* 品牌 DNA 分析区块 */}
            <div className="relative bg-white border border-slate-100 shadow-xl overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 rounded-xl">
              <div className="absolute top-0 left-0 h-2 w-full bg-slate-900"></div>
              
              <div className="p-6 border-b border-slate-50 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">品牌 DNA 深度分析</h3>
                  <p className="text-[10px] text-slate-400 technical-font font-bold uppercase tracking-widest">高级推理模块 / 根基分析</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => checkKeyAndProceed(handleReupload)}
                    disabled={isUpdatingDNA}
                    className="text-[10px] technical-font bg-white border border-slate-900 text-slate-900 px-3 py-2 rounded-sm hover:bg-slate-50 disabled:opacity-30 font-black uppercase tracking-widest transition-all shadow-sm"
                  >
                    重新上传
                  </button>
                </div>
              </div>

              <div className="flex-grow p-8 space-y-8">
                {/* Logo 展示与上传 */}
                <div className="space-y-6">
                  <TechnicalLabel text="Logo 视觉资产分析" />
                  <div className="relative aspect-square bg-slate-50 overflow-hidden border border-slate-100 rounded-lg shadow-inner group/logo ring-1 ring-slate-100">
                    {isUpdatingDNA && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-30 backdrop-blur-md">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                        <span className="text-[10px] technical-font font-black text-slate-900 tracking-[0.2em] animate-pulse">Pro 引擎深度特征提取中...</span>
                      </div>
                    )}
                    <img 
                      src={brandData?.logoUrl} 
                      alt="当前 Logo" 
                      className="w-full h-full object-contain p-8 transition-all duration-1000 group-hover/logo:scale-110"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => checkKeyAndProceed(async () => { fileInputRef.current?.click(); })}
                      disabled={isUpdatingDNA}
                      className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.25em] hover:bg-black disabled:opacity-50 transition-all duration-500 flex items-center justify-center gap-4 rounded-lg shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      更新分析素材
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    <p className="text-[9px] technical-font text-slate-400 text-center uppercase font-black tracking-widest">高级视觉分析引擎 • 支持所有通用图片格式</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <TechnicalLabel text="Pro 推理基因提取结果" />
                  <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-inner">
                    <div className="text-[11px] leading-relaxed text-slate-300 font-bold whitespace-pre-wrap h-56 overflow-y-auto custom-scrollbar technical-font">
                      {blocks.dna?.content || `品牌名称: ${brandData?.name}\n所属行业: ${brandData?.industry}\n形象原型: ${brandData?.prototype}\n核心关键词: ${brandData?.keywords?.join(', ')}\n受众群体: ${brandData?.targetAudience}\n核心理念: ${brandData?.coreValues}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 其他设计区块 */}
            <DesignBlock title="概念构思" subtitle="创意 / 构思" color={brandData?.colors[1]} imageUrl={blocks.concept?.imageUrl} isLoading={!blocks.concept} content={blocks.concept?.content} />
            <DesignBlock title="形态研究" subtitle="形态 / 探索" color={brandData?.colors[2]} imageUrl={blocks.form?.imageUrl} isLoading={!blocks.form} content={blocks.form?.content} />
            <DesignBlock title="概念探索" subtitle="开发 / 草图" color={brandData?.colors[0]} imageUrl={blocks.exploration?.imageUrl} isLoading={!blocks.exploration} content={blocks.exploration?.content} />
            <DesignBlock title="精细线稿" subtitle="细节 / 线稿" color={brandData?.colors[1]} imageUrl={blocks.linework?.imageUrl} isLoading={!blocks.linework} content={blocks.linework?.content} />
            <DesignBlock title="细节精修" subtitle="解剖 / 结构" color={brandData?.colors[2]} imageUrl={blocks.refinement?.imageUrl} isLoading={!blocks.refinement} content={blocks.refinement?.content} />
            <DesignBlock title="表情设定表" subtitle="情感 / 设定" color={brandData?.colors[0]} imageUrl={blocks.expressions?.imageUrl} isLoading={!blocks.expressions} content={blocks.expressions?.content} />
            <DesignBlock title="姿势库" subtitle="动作 / 动态" color={brandData?.colors[1]} imageUrl={blocks.poses?.imageUrl} isLoading={!blocks.poses} content={blocks.poses?.content} />
            <DesignBlock title="转身视图" subtitle="三维 / 视角" color={brandData?.colors[2]} imageUrl={blocks.turnaround?.imageUrl} isLoading={!blocks.turnaround} content={blocks.turnaround?.content} />
            <DesignBlock title="色彩开发" subtitle="色彩 / 规范" color={brandData?.colors[0]} imageUrl={blocks.color?.imageUrl} isLoading={!blocks.color} content={blocks.color?.content} />
            <DesignBlock title="材质规格" subtitle="表面 / 纹理" color={brandData?.colors[1]} imageUrl={blocks.material?.imageUrl} isLoading={!blocks.material} content={blocks.material?.content} />
            <DesignBlock title="色彩应用" subtitle="场景 / 适配" color={brandData?.colors[2]} imageUrl={blocks.app_color?.imageUrl} isLoading={!blocks.app_color} content={blocks.app_color?.content} />
            <DesignBlock title="构造指南" subtitle="技术 / 制图" color={brandData?.colors[0]} imageUrl={blocks.tech_guide?.imageUrl} isLoading={!blocks.tech_guide} content={blocks.tech_guide?.content} />
            <DesignBlock title="设计系统规则" subtitle="标准 / 规则" color={brandData?.colors[1]} imageUrl={blocks.system_rules?.imageUrl} isLoading={!blocks.system_rules} content={blocks.system_rules?.content} />
            <DesignBlock title="资产变体" subtitle="尺寸 / 格式" color={brandData?.colors[2]} imageUrl={blocks.variants?.imageUrl} isLoading={!blocks.variants} content={blocks.variants?.content} />
            <DesignBlock title="数字应用" subtitle="界面 / UI" color={brandData?.colors[0]} imageUrl={blocks.digital?.imageUrl} isLoading={!blocks.digital} content={blocks.digital?.content} />
            <DesignBlock title="实物应用" subtitle="周边 / 物料" color={brandData?.colors[1]} imageUrl={blocks.physical?.imageUrl} isLoading={!blocks.physical} content={blocks.physical?.content} />
            <DesignBlock title="最终主视觉渲染" subtitle="全彩 / 渲染" color={brandData?.colors[2]} imageUrl={blocks.final_render?.imageUrl} isLoading={!blocks.final_render} content={blocks.final_render?.content} isHero />
          </div>

          {/* 状态栏 */}
          <div className="fixed bottom-0 left-0 w-full bg-slate-900 text-white px-8 py-4 flex justify-between items-center technical-font text-[10px] z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] border-t border-slate-800">
            <div className="flex items-center gap-10">
              <span className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${isGenerating || isUpdatingDNA ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className="font-black uppercase tracking-widest">{isGenerating || isUpdatingDNA ? 'Gemini 3 Pro 推理中...' : 'Pro 级设计系统就绪'}</span>
              </span>
            </div>
            <div className="flex gap-10">
              <span className="text-slate-500 font-black uppercase tracking-widest">推理引擎: Gemini_3_Pro_Preview</span>
              <span className="text-amber-500 font-black uppercase tracking-widest bg-slate-800 px-3 py-1 rounded">PRO 模式活跃</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
