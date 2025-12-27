
export interface BrandData {
  name: string;
  industry: string;
  prototype: string; // 新增：形象原型（如：狗、猫、机器人等）
  logoUrl?: string;
  colors: string[];
  keywords: string[];
  targetAudience: string;
  coreValues: string;
}

export interface DesignBlock {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  imageUrl?: string;
  labels?: string[];
}

export interface KanbanState {
  isGenerating: boolean;
  brandData: BrandData | null;
  blocks: Record<string, DesignBlock>;
}
