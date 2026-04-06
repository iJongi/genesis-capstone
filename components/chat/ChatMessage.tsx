'use client';

import React from 'react';
import { Bot, User, Copy, Edit2, Trash2, RotateCw, ChevronDown } from 'lucide-react';
import { Message as MessageType, AIModel } from '@/types';
import { cn, formatDate, copyToClipboard } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/store/toast-store';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getGroupedModels, getModelDisplayName } from '@/lib/model-utils';

interface ChatMessageProps {
  message: MessageType;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string, model?: AIModel) => void;
  currentModel?: AIModel;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onEdit,
  onDelete,
  onRegenerate,
  currentModel,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(message.content);
  const [showActions, setShowActions] = React.useState(false);
  const [showModelSelector, setShowModelSelector] = React.useState(false);
  const { success, error } = useToast();

  const groupedModels = getGroupedModels();

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await copyToClipboard(message.content);
      success('Copied', 'Message copied to clipboard');
    } catch (err) {
      error('Error', 'Failed to copy message');
    }
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message.id, editContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'group flex gap-4 px-4 py-6 hover:bg-muted/50 transition-colors',
        isUser && 'bg-muted/30'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full',
          isUser && 'bg-primary text-primary-foreground',
          isAssistant && 'bg-accent text-accent-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          {message.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDate(message.timestamp)}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-y"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.images.map((image) => (
              <img
                key={image.id}
                src={image.preview || image.url}
                alt={image.name}
                className="max-w-xs rounded-lg border"
              />
            ))}
          </div>
        )}

        {/* Token count */}
        {message.tokens && (
          <div className="text-xs text-muted-foreground">
            {message.tokens} tokens
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCopy}
            title="Copy message"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          {onEdit && isUser && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsEditing(true)}
              title="Edit message"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}

          {onRegenerate && isAssistant && (
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setShowModelSelector(!showModelSelector)}
                title="Regenerate response"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              {showModelSelector && (
                <div className="absolute right-0 top-10 z-50 min-w-[220px] max-w-[280px] rounded-md border bg-popover shadow-lg max-h-[400px] overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold mb-2 px-2 text-muted-foreground">
                      Regenerate with:
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start text-left mb-2"
                      onClick={() => {
                        onRegenerate(message.id);
                        setShowModelSelector(false);
                      }}
                    >
                      <RotateCw className="h-3 w-3 mr-2 shrink-0" />
                      <span className="truncate">
                        Current: {currentModel ? getModelDisplayName(currentModel) : 'Default'}
                      </span>
                    </Button>
                    
                    <div className="h-px bg-border my-2" />
                    
                    {groupedModels.map((group) => (
                      <div key={group.label}>
                        <div className="text-xs font-semibold px-2 py-1.5 text-muted-foreground">
                          {group.label}
                        </div>
                        {group.models
                          .filter(m => m.key !== currentModel)
                          .map((model) => (
                            <Button
                              key={model.key}
                              size="sm"
                              variant="ghost"
                              className="w-full justify-start text-left"
                              onClick={() => {
                                onRegenerate(message.id, model.key);
                                setShowModelSelector(false);
                              }}
                            >
                              <span className="truncate">{model.name}</span>
                            </Button>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(message.id)}
              title="Delete message"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
