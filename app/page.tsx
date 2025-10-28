'use client';

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Challenges } from "@/components/challenges"
import { DataPowered } from "@/components/data-powered"
import { Solutions } from "@/components/solutions"
import { Footer } from "@/components/footer"
import { ChatWidget } from "@/components/chat-widget"
import { PageWithChatSidebar } from "@/components/page-with-chat-sidebar"
import { useChat } from "@/hooks/useChat"
import type { BevGeniePage } from "@/lib/ai/page-specs"

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<BevGeniePage | null>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const { messages, generationStatus, sendMessage, clearMessages } = useChat();

  // Listen for page generation from chat
  useEffect(() => {
    // Check if the last message has a generated page
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.generatedPage) {
        setCurrentPage(lastMessage.generatedPage.page);
      }
    }
  }, [messages]);

  // Track when chat started
  useEffect(() => {
    if (messages.length > 0) {
      setChatStarted(true);
    }
  }, [messages]);

  // If chat has started, show page with sidebar
  if (chatStarted) {
    return (
      <PageWithChatSidebar
        page={currentPage}
        messages={messages}
        isLoading={generationStatus.isGeneratingPage}
        generationStatus={generationStatus}
        onClose={() => {
          setChatStarted(false);
          clearMessages();
          setCurrentPage(null);
        }}
        onSendMessage={sendMessage}
        onClearChat={() => {
          clearMessages();
          setCurrentPage(null);
        }}
      />
    );
  }

  // Otherwise, show normal landing page with chat widget
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Challenges />
      <DataPowered />
      <Solutions />
      <Footer />
      <ChatWidget onPageGenerated={(page) => setCurrentPage(page)} />
    </main>
  )
}
