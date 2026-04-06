import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { API_CONFIG } from '@/config/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, text, sessionId, messages = [] } = body;

    // console.log('=== IMAGE ANALYSIS API DEBUG ===');
    // console.log('Image URL:', imageUrl);
    // console.log('Text:', text);
    // console.log('Session ID:', sessionId);
    // console.log('Chat History:', messages.length, 'messages');
    // console.log('================================');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }

    // Build conversation context - limit to last 5 messages to avoid token limit
    let conversationContext = '';
    if (messages.length > 0) {
      const recentMessages = messages.slice(-5); // Only last 5 messages
      conversationContext = 'Previous conversation:\n';
      recentMessages.forEach((msg: any) => {
        const role = msg.role === 'user' ? 'User' : 'AI';
        // Truncate long messages
        const content = msg.content.length > 200 
          ? msg.content.substring(0, 200) + '...' 
          : msg.content;
        conversationContext += `${role}: ${content}\n`;
      });
      conversationContext += '\n';
    }

    // Combine context with current question - keep it short
    const userQuestion = text || 'What is inside this image? Describe it in detail.';
    const fullPrompt = conversationContext 
      ? `${conversationContext}Current question: ${userQuestion}`
      : userQuestion;

    try {
      // Call NekoLabs GPT-5 API for image analysis
      const apiUrl = `${API_CONFIG.NEKOLABS_BASE_URL}${API_CONFIG.NEKOLABS_IMAGE_ANALYSIS_PATH}`;
      const response = await axios.get(apiUrl, {
        params: {
          text: fullPrompt,
          imageUrl: imageUrl,
          sessionId: sessionId || `chat-${Date.now()}`,
        },
        timeout: 60000, // 60 second timeout (image analysis takes longer)
      });

      // Check for successful response
      if (response.data && (response.data.success || response.data.result)) {
        return NextResponse.json({
          success: true,
          type: 'image-analysis',
          description: response.data.result || response.data.message || response.data.description,
          timestamp: response.data.timestamp || new Date().toISOString(),
          responseTime: response.data.responseTime || 'N/A',
        });
      } else {
        // API returned unsuccessful response
        throw new Error(response.data?.message || 'API returned unsuccessful response');
      }
    } catch (apiError: any) {
      console.error('NekoLabs API error details:', {
        message: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status,
      });
      
      // Try fallback to Gemini Vision API
      console.log('Trying Gemini Vision as fallback...');
      try {
        const geminiResponse = await axios.post('/api/gemini-analysis', {
          imageUrl: imageUrl,
          prompt: fullPrompt,
          analysisType: 'general',
        }, {
          baseURL: request.url.replace('/api/image-analysis', ''),
          timeout: 30000,
        });

        if (geminiResponse.data?.success) {
          return NextResponse.json({
            success: true,
            type: 'image-analysis',
            description: geminiResponse.data.description,
            timestamp: new Date().toISOString(),
            responseTime: 'N/A',
            provider: 'gemini-fallback',
          });
        }
      } catch (geminiError) {
        console.error('Gemini fallback also failed:', geminiError);
      }
      
      // Both services failed - return error
      let errorMessage = 'Failed to analyze image';
      let suggestion = 'Please try again with a different image or simpler question.';
      
      if (apiError.response?.data?.message?.includes('choices')) {
        errorMessage = 'Image analysis service error';
        suggestion = 'Try simplifying your question or use a different image format (JPG/PNG recommended).';
      } else if (apiError.response?.status === 500) {
        errorMessage = 'Image analysis service is temporarily unavailable';
        suggestion = 'Please try again in a moment or simplify your question.';
      } else if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
        errorMessage = 'Image analysis timed out';
        suggestion = 'The image may be too large or complex. Try a smaller image or simpler question.';
      } else {
        errorMessage = apiError.response?.data?.message 
          || apiError.response?.data?.error
          || apiError.message
          || 'Failed to analyze image';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestion: suggestion
        },
        { status: apiError.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Image analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image analysis request', details: error.message },
      { status: 500 }
    );
  }
}
