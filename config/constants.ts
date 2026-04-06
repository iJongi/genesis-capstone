import { AIModel, AIProvider, ModelConfig } from '@/types';

// API Configuration
export const API_CONFIG = {
  RESITA_BASE_URL: 'https://api.ferdev.my.id/ai/aicoding',
  RESITA_API_KEY: process.env.RESITA_API_KEY || '',
  NEKOLABS_BASE_URL: 'https://api.nekolabs.my.id',
  NEKOLABS_IMAGE_ANALYSIS_PATH: '/ai/gpt/5',
  THUMBSNAP_API_URL: 'https://thumbsnap.com/api/upload',
  THUMBSNAP_API_KEY: process.env.THUMBSNAP_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL_ID: 'gemini-2.0-flash-exp',
  // OpenRouter API - Requires account at https://openrouter.ai
  // Get your API key at: https://openrouter.ai/keys
  // Note: Free models available after registration
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  OPENROUTER_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://chat.fsu.my.id',
  OPENROUTER_SITE_NAME: 'AI Vision Chatbot',
};

// Image Analysis Models
export const IMAGE_ANALYSIS_MODELS = [
  {
    id: 'gemini-native',
    name: 'Gemini 2.0 Flash (Native)',
    provider: 'google',
    apiType: 'gemini-native',
    modelId: 'gemini-2.0-flash-exp',
    description: 'Google native API - Fast & free',
    free: true,
  },
  {
    id: 'gemini-flash-lite',
    name: 'Gemini Flash Lite (Native)',
    provider: 'google',
    apiType: 'gemini-native',
    modelId: 'gemini-flash-lite-latest',
    description: 'Google native API - Fast & free',
    free: true,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite (Native)',
    provider: 'google',
    apiType: 'gemini-native',
    modelId: 'gemini-2.5-flash-lite',
    description: 'Google native API - Fast & free',
    free: true,
  },
  {
    id: 'gemini-openrouter',
    name: 'Gemini 2.0 Flash (OpenRouter)',
    provider: 'google',
    apiType: 'openrouter',
    modelId: 'google/gemini-2.0-flash-exp:free',
    description: 'Via OpenRouter - Free',
    free: true,
  },
  // Note: GLM-4.5 Air does not support image input on OpenRouter
  // {
  //   id: 'glm-4.5-air',
  //   name: 'GLM-4.5 Air',
  //   provider: 'zhipu',
  //   apiType: 'openrouter',
  //   modelId: 'z-ai/glm-4.5-air:free',
  //   description: 'Chinese AI model - Free (Text only)',
  //   free: true,
  // }
];

// Available AI Models Configuration
export const AI_MODELS: Record<AIModel, { name: string; provider: AIProvider; contextWindow: number }> = {
  // Resita API Models (Free to use)
  'resita-aicoding': {
    name: 'AI Coding',
    provider: 'resita',
    contextWindow: 128000,
  },
  'resita-claude': {
    name: 'Claude AI',
    provider: 'resita',
    contextWindow: 200000,
  },
  'resita-chatgpt': {
    name: 'ChatGPT 4',
    provider: 'resita',
    contextWindow: 128000,
  },
  'resita-felo': {
    name: 'Felo AI',
    provider: 'resita',
    contextWindow: 32000,
  },
  'resita-gemini': {
    name: 'Gemini',
    provider: 'resita',
    contextWindow: 1000000,
  },
  'resita-gptlogic': {
    name: 'GPT Logic',
    provider: 'resita',
    contextWindow: 32000,
  },
  'resita-venice': {
    name: 'Venice AI',
    provider: 'resita',
    contextWindow: 32000,
  },
  
  // NekoLabs API Models (Free to use)
  'nekolabs-gpt4o': {
    name: 'GPT-4o',
    provider: 'nekolabs',
    contextWindow: 128000,
  },
  'nekolabs-gpt41': {
    name: 'GPT-4.1',
    provider: 'nekolabs',
    contextWindow: 128000,
  },
  'nekolabs-gpt5mini': {
    name: 'GPT-5 Mini',
    provider: 'nekolabs',
    contextWindow: 128000,
  },
  'nekolabs-gpt5nano': {
    name: 'GPT-5 Nano',
    provider: 'nekolabs',
    contextWindow: 128000,
  },
};

// Default Model Configuration
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  id: 'default',
  name: 'Default Configuration',
  provider: 'resita',
  model: 'resita-chatgpt',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can analyze images and provide detailed information about them.',
};

// Model Pricing (per 1K tokens)
export const MODEL_PRICING = {
  // Resita API (Free to use)
  'resita-aicoding': { input: 0, output: 0 },
  'resita-claude': { input: 0, output: 0 },
  'resita-chatgpt': { input: 0, output: 0 },
  'resita-felo': { input: 0, output: 0 },
  'resita-gemini': { input: 0, output: 0 },
  'resita-gptlogic': { input: 0, output: 0 },
  'resita-venice': { input: 0, output: 0 },
};

// Image Analysis Types
export const ANALYSIS_TYPES = [
  { value: 'object-detection', label: 'Object Detection', icon: '🎯' },
  { value: 'label-detection', label: 'Label Detection', icon: '🏷️' },
  { value: 'text-recognition', label: 'Text Recognition (OCR)', icon: '📝' },
  { value: 'face-detection', label: 'Face Detection', icon: '👤' },
  { value: 'landmark-recognition', label: 'Landmark Recognition', icon: '🗺️' },
  { value: 'image-description', label: 'Image Description', icon: '📸' },
  { value: 'visual-qa', label: 'Visual Q&A', icon: '❓' },
] as const;

// File Upload Constraints
export const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
};

// App Constants
export const APP_CONFIG = {
  name: 'AI Vision Chat',
  version: '1.0.0',
  description: 'Intelligent AI Chatbot with Image Analysis',
  maxChatHistory: 100,
  autoSaveInterval: 30000, // 30 seconds
  maxMessageLength: 4000,
  defaultTheme: 'system' as const,
};

// API Endpoints (for future backend integration)
export const API_ENDPOINTS = {
  chat: '/api/chat',
  imageAnalysis: '/api/image-analysis',
  models: '/api/models',
  settings: '/api/settings',
  auth: '/api/auth',
  export: '/api/export',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  chats: 'ai-vision-chats',
  currentChat: 'ai-vision-current-chat',
  modelConfig: 'ai-vision-model-config',
  userPreferences: 'ai-vision-preferences',
  apiKeys: 'ai-vision-api-keys',
  folders: 'ai-vision-folders',
};

// Toast Messages
export const TOAST_MESSAGES = {
  chatSaved: 'Chat saved successfully',
  chatDeleted: 'Chat deleted successfully',
  chatRenamed: 'Chat renamed successfully',
  imageSizeError: 'Image size exceeds maximum limit',
  imageTypeError: 'Invalid image type',
  copySuccess: 'Copied to clipboard',
  exportSuccess: 'Chat exported successfully',
  settingsSaved: 'Settings saved successfully',
  apiKeyInvalid: 'Invalid API key',
  networkError: 'Network error. Please try again.',
};
