// Types for AI Models
export type AIProvider = 'resita' | 'nekolabs';

export type AIModel = 
  // Resita API Models (only supported models)
  | 'resita-aicoding'
  | 'resita-claude'
  | 'resita-chatgpt'
  | 'resita-felo'
  | 'resita-gemini'
  | 'resita-gptlogic'
  | 'resita-venice'
  // NekoLabs API Models
  | 'nekolabs-gpt4o'
  | 'nekolabs-gpt41'
  | 'nekolabs-gpt5mini'
  | 'nekolabs-gpt5nano';

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  model: AIModel;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt?: string;
}

// Types for Chat
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: ImageAttachment[];
  timestamp: Date;
  tokens?: number;
  isEdited?: boolean;
  parentId?: string; // For branching conversations
}

export interface ImageAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  analysis?: ImageAnalysisResult;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  modelConfig: ModelConfig;
  createdAt: Date;
  updatedAt: Date;
  summary?: string; // Rangkuman chat untuk context
  lastSummarizedIndex?: number; // Index message terakhir yang sudah dirangkum
  folderId?: string;
  isStarred: boolean;
  totalTokens: number;
}

// Types for Image Analysis
export type AnalysisType = 
  | 'object-detection'
  | 'label-detection'
  | 'text-recognition'
  | 'face-detection'
  | 'landmark-recognition'
  | 'image-description'
  | 'visual-qa';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface ImageAnalysisResult {
  type: AnalysisType;
  detections: Detection[];
  description?: string;
  text?: string;
  metadata?: Record<string, any>;
}

// Types for User & Settings
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
}

export interface APIKeyConfig {
  provider: AIProvider;
  key: string;
  isActive: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system' | 'rose' | 'blue' | 'green' | 'purple' | 'custom';
  customTheme?: {
    primary: string;
    background: string;
    foreground: string;
    accent: string;
  };
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  defaultModel: AIModel;
  defaultProvider: AIProvider;
  autoSave: boolean;
  showTokenCount: boolean;
  enableNotifications: boolean;
}

// Types for Analytics
export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  apiCalls: number;
  modelUsage: Record<AIModel, number>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
}

// Types for Folders
export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  chatIds: string[];
  createdAt: Date;
}

// Export Types
export type ExportFormat = 'pdf' | 'markdown' | 'json' | 'text';

export interface ExportOptions {
  format: ExportFormat;
  includeImages: boolean;
  includeMetadata: boolean;
}
