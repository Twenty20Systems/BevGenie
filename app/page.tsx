'use client';

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Challenges } from "@/components/challenges"
import { DataPowered } from "@/components/data-powered"
import { Solutions } from "@/components/solutions"
import { Footer } from "@/components/footer"
import { ChatWidget } from "@/components/chat-widget"
import { FullScreenPageView } from "@/components/full-screen-page-view"
import { useChat } from "@/hooks/useChat"
import type { BevGeniePage } from "@/lib/ai/page-specs"

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<BevGeniePage | null>(null);
  const [isGeneratingPage, setIsGeneratingPage] = useState(false);
  const { messages, generationStatus } = useChat();

  // Listen for page generation from chat
  useEffect(() => {
    // Check if the last message has a generated page
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.generatedPage) {
        setCurrentPage(lastMessage.generatedPage.page);
        setIsGeneratingPage(false);
      }
    }
  }, [messages]);

  // Track when page is being generated
  useEffect(() => {
    setIsGeneratingPage(generationStatus.isGeneratingPage);
  }, [generationStatus.isGeneratingPage]);

  // If a page is currently displayed, show full-screen view
  if (currentPage) {
    return (
      <FullScreenPageView
        page={currentPage}
        isLoading={isGeneratingPage}
        onClose={() => setCurrentPage(null)}
        onOpenChat={() => {
          // Chat can be toggled from within the full-screen view
        }}
        chatMessages={messages.length}
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
