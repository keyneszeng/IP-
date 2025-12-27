
import React from 'react';
import { TechnicalLabel } from './TechnicalLabel';

interface Props {
  title: string;
  subtitle: string;
  content?: string;
  imageUrl?: string;
  isLoading?: boolean;
  color?: string;
  isHero?: boolean;
}

export const DesignBlock: React.FC<Props> = ({ 
  title, 
  subtitle, 
  content, 
  imageUrl, 
  isLoading, 
  color = "#3b82f6",
  isHero = false
}) => {
  return (
    <div className={`relative bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-300 ${isHero ? 'row-span-1' : ''}`}>
      {/* 顶部修饰线条 */}
      <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: color }}></div>
      
      {/* 标题区域 */}
      <div className="p-4 border-b border-slate-50">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tighter mb-1">{title}</h3>
            <p className="text-[10px] text-slate-400 technical-font uppercase">{subtitle}</p>
          </div>
          <div className="text-[10px] technical-font text-slate-300">参考编码_{Math.random().toString(36).substr(2, 4).toUpperCase()}</div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="flex-grow p-4 space-y-4">
        {imageUrl ? (
          <div className="relative aspect-square bg-slate-50 overflow-hidden border border-slate-100 rounded-sm">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
            />
            {/* 技术层叠显示 */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 text-white technical-font text-[8px] rounded backdrop-blur-sm uppercase">
              渲染版本_V1.0
            </div>
            <div className="absolute bottom-2 right-2 flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-slate-50 border border-slate-100 border-dashed rounded-sm flex items-center justify-center">
             <span className="text-[10px] text-slate-400 technical-font">等待资产生成...</span>
          </div>
        )}

        <div className="space-y-3">
          <TechnicalLabel text="技术规格 & 说明" />
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-2 bg-slate-100 rounded w-full animate-pulse"></div>
              <div className="h-2 bg-slate-100 rounded w-5/6 animate-pulse"></div>
              <div className="h-2 bg-slate-100 rounded w-4/6 animate-pulse"></div>
            </div>
          ) : (
            <div className="text-[11px] leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
              {content || "正在同步核心数据..."}
            </div>
          )}
        </div>
      </div>

      {/* 页脚信息 */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[9px] technical-font text-slate-400 uppercase">设计核心_V3.5_系统</span>
        <div className="flex gap-2">
           <div className="w-1.5 h-1.5 border border-slate-300"></div>
           <div className="w-1.5 h-1.5 border border-slate-300"></div>
        </div>
      </div>
    </div>
  );
};
