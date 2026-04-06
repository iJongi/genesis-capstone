import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/constants';

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    // Build conversation context from all messages
    let conversationContext = 'You are a helpful AI assistant. Continue the conversation naturally based on the chat history below.\n\n';
    conversationContext += '=== Chat History ===\n';
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'user') {
        conversationContext += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        conversationContext += `Assistant: ${msg.content}\n`;
      }
    }
    
    conversationContext += '\n=== Instructions ===\n';
    conversationContext += 'Based on the conversation above, provide a helpful and contextually relevant response. If this is the first message, respond naturally to the user\'s question.\n';

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const simplePrompt = lastMessage?.content || '';

    if (!simplePrompt || simplePrompt.trim() === '') {
      return NextResponse.json(
        { error: 'Empty message content' },
        { status: 400 }
      );
    }

    // Use full context with history for better responses
    const prompt = conversationContext.trim();

    if (model.startsWith('resita-')) {
      try {
        const response = await axios.get(API_CONFIG.RESITA_BASE_URL, {
          params: {
            prompt: prompt.trim(),
            apikey: API_CONFIG.RESITA_API_KEY,
          },
          timeout: 30000,
        });

        if (response.data.success && response.data.message) {
          return NextResponse.json({
            message: {
              role: 'assistant',
              content: response.data.message,
              tokens: Math.ceil(response.data.message.length / 4),
            },
            usage: {
              promptTokens: Math.ceil(prompt.length / 4),
              completionTokens: Math.ceil(response.data.message.length / 4),
              totalTokens: Math.ceil((prompt.length + response.data.message.length) / 4),
            },
          });
        } else {
          throw new Error(response.data.message || 'API returned unsuccessful response');
        }
      } catch (apiError: any) {
        console.error('Resita API error:', apiError.response?.data || apiError.message);
        const errorMessage = apiError.response?.data?.message 
          || apiError.response?.data?.error
          || apiError.message
          || 'Failed to get response from Resita API';
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: apiError.response?.data || apiError.message 
          },
          { status: 500 }
        );
      }
    }

    if (model.startsWith('nekolabs-')) {
      try {
        const modelEndpoints: Record<string, string> = {
          'nekolabs-gpt4o': '/ai/gpt/4o',
          'nekolabs-gpt41': '/ai/gpt/4.1',
          'nekolabs-gpt5mini': '/ai/gpt/5-mini',
          'nekolabs-gpt5nano': '/ai/gpt/5-nano',
        };

        const endpoint = modelEndpoints[model];
        if (!endpoint) {
          throw new Error(`Unknown NekoLabs model: ${model}`);
        }

        const apiUrl = `${API_CONFIG.NEKOLABS_BASE_URL}${endpoint}`;

        const response = await axios.get(apiUrl, {
          params: {
            text: prompt.trim(),
          },
          timeout: 30000,
        });

        if (response.data && response.data.success && response.data.result) {
          return NextResponse.json({
            message: {
              role: 'assistant',
              content: response.data.result,
              tokens: Math.ceil(response.data.result.length / 4),
            },
            usage: {
              promptTokens: Math.ceil(prompt.length / 4),
              completionTokens: Math.ceil(response.data.result.length / 4),
              totalTokens: Math.ceil((prompt.length + response.data.result.length) / 4),
            },
          });
        } else if (response.data && response.data.answer) {
          return NextResponse.json({
            message: {
              role: 'assistant',
              content: response.data.answer,
              tokens: Math.ceil(response.data.answer.length / 4),
            },
            usage: {
              promptTokens: Math.ceil(prompt.length / 4),
              completionTokens: Math.ceil(response.data.answer.length / 4),
              totalTokens: Math.ceil((prompt.length + response.data.answer.length) / 4),
            },
          });
        } else {
          console.error('NekoLabs unexpected format:', response.data);
          throw new Error('API returned no answer or result');
        }
      } catch (apiError: any) {
        console.error('NekoLabs API error:', apiError.response?.data || apiError.message);
        const errorMessage = apiError.response?.data?.message 
          || apiError.response?.data?.error
          || apiError.message
          || 'Failed to get response from NekoLabs API';
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: apiError.response?.data || apiError.message 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: 'This model is not yet implemented. Please use Resita or NekoLabs models.',
        tokens: 50,
      },
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
