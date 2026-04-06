import { AIModel } from '@/types';
import { AI_MODELS } from '@/config/constants';

export interface ModelGroup {
  label: string;
  models: { key: AIModel; name: string }[];
}

export function getGroupedModels(): ModelGroup[] {
  const resitaModels = Object.entries(AI_MODELS)
    .filter(([key]) => key.startsWith('resita-'))
    .map(([key, model]) => ({ key: key as AIModel, name: model.name }));

  const nekolabsModels = Object.entries(AI_MODELS)
    .filter(([key]) => key.startsWith('nekolabs-'))
    .map(([key, model]) => ({ key: key as AIModel, name: model.name }));

  return [
    { label: 'Resita AI', models: resitaModels },
    { label: 'NekoLabs AI', models: nekolabsModels },
  ];
}

export function getAllAvailableModels(): AIModel[] {
  return Object.keys(AI_MODELS) as AIModel[];
}

export function getModelDisplayName(model: AIModel): string {
  return AI_MODELS[model]?.name || model;
}
