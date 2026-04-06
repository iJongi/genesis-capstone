'use client';

import { useState, useCallback } from 'react';
import { Message, ImageAttachment } from '@/types';
import { useChatStore } from '@/lib/store/chat-store';
import { useToast } from '@/lib/store/toast-store';
import { estimateTokenCount } from '@/lib/utils';

export function useChat() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentChatId, addMessage, getCurrentChat } = useChatStore();
  const { error } = useToast();

  const currentChat = getCurrentChat();

  const sendMessage = useCallback(
    async (content: string, images?: ImageAttachment[]) => {
      if (!currentChatId) {
        error('No active chat', 'Please create or select a chat first');
        return;
      }

      if (!content.trim() && (!images || images.length === 0)) {
        error('Empty message', 'Please enter a message or attach images');
        return;
      }

      try {
        // Add user message
        addMessage(currentChatId, {
          role: 'user',
          content,
          images,
          tokens: estimateTokenCount(content),
        });

        setIsGenerating(true);

        // TODO: Replace with actual API call
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockResponse = `I received your message: "${content.substring(0, 50)}${
          content.length > 50 ? '...' : ''
        }"

${images && images.length > 0 ? `I can see you've attached ${images.length} image(s).\n\n` : ''}

This is a mock response. To enable actual AI responses:
1. Configure API keys in Settings
2. Implement the API integration

The UI is fully functional and ready for backend integration.`;

        addMessage(currentChatId, {
          role: 'assistant',
          content: mockResponse,
          tokens: estimateTokenCount(mockResponse),
        });
      } catch (err) {
        error('Failed to send message', 'Please try again');
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    },
    [currentChatId, addMessage, error]
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      if (!currentChatId || !currentChat) {
        error('No active chat', 'Please create or select a chat first');
        return;
      }

      try {
        setIsGenerating(true);

        // Find the message to regenerate
        const messageIndex = currentChat.messages.findIndex((m) => m.id === messageId);
        if (messageIndex === -1 || currentChat.messages[messageIndex].role !== 'assistant') {
          error('Invalid message', 'Can only regenerate assistant messages');
          return;
        }

        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockResponse = 'This is a regenerated response. Backend integration needed.';

        addMessage(currentChatId, {
          role: 'assistant',
          content: mockResponse,
          tokens: estimateTokenCount(mockResponse),
          parentId: messageId,
        });
      } catch (err) {
        error('Failed to regenerate', 'Please try again');
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    },
    [currentChatId, currentChat, addMessage, error]
  );

  return {
    currentChat,
    isGenerating,
    sendMessage,
    regenerateMessage,
  };
}
