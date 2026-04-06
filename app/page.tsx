'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/lib/store/chat-store';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { MessageSquare, Sparkles, Image as ImageIcon, Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { currentChatId, createChat, chats } = useChatStore();

  const handleNewChat = () => {
    const newChatId = createChat();
    router.push(`/chat/${newChatId}`);
  };

  const handleContinueChat = () => {
    if (currentChatId) {
      router.push(`/chat/${currentChatId}`);
    } else if (chats.length > 0) {
      router.push(`/chat/${chats[0].id}`);
    } else {
      handleNewChat();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <Logo size="lg" className="mx-auto" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI Vision Chat
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Chat dengan AI, upload gambar untuk analisis, dan dapatkan jawaban cerdas
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 max-w-lg mx-auto">
          <Button
            onClick={handleNewChat}
            size="lg"
            className="h-32 flex flex-col gap-3 text-lg"
          >
            <Sparkles className="h-8 w-8" />
            <div>
              <div className="font-semibold">New Chat</div>
              <div className="text-xs opacity-80">Mulai percakapan baru</div>
            </div>
          </Button>

          {chats.length > 0 && (
            <Button
              onClick={handleContinueChat}
              size="lg"
              variant="outline"
              className="h-32 flex flex-col gap-3 text-lg"
            >
              <MessageSquare className="h-8 w-8" />
              <div>
                <div className="font-semibold">Continue Chat</div>
                <div className="text-xs opacity-80">Lanjutkan percakapan</div>
              </div>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-8 text-sm">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-muted-foreground">Multi-Model AI</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50">
            <ImageIcon className="h-6 w-6 text-primary" />
            <span className="text-muted-foreground">Vision Analysis</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-muted-foreground">Fast Response</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-4">
          Powered by OpenRouter & Google Gemini
        </div>
      </div>
    </div>
  );
}
