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

// Default demo page - shows when user opens chat
const DEFAULT_DEMO_PAGE: BevGeniePage = {
  type: 'solution_brief',
  title: 'Welcome to BevGenie',
  description: 'AI-powered solutions for your beverage business - Ask any question to get started',
  sections: [
    {
      type: 'hero',
      headline: 'Welcome to BevGenie AI Assistant',
      subheadline: 'Ask any question about your beverage business and watch the page update in real-time',
      ctas: [
        { text: 'Try a Question', url: '#' },
        { text: 'Learn More', url: '#' }
      ]
    },
    {
      type: 'feature_grid',
      title: 'How BevGenie Can Help',
      features: [
        {
          title: 'Get Instant Insights',
          description: 'Ask questions about your business challenges and get AI-powered solutions',
          icon: 'lightbulb'
        },
        {
          title: 'Real-Time Pages',
          description: 'Watch as this page updates based on your questions and context',
          icon: 'zap'
        },
        {
          title: 'Smart Recommendations',
          description: 'Receive personalized recommendations tailored to your role and company',
          icon: 'target'
        },
        {
          title: 'Continuous Learning',
          description: 'The AI learns from your questions to provide better insights over time',
          icon: 'brain'
        }
      ]
    },
    {
      type: 'metrics',
      title: 'Why Choose BevGenie?',
      metrics: [
        {
          value: '1000+',
          label: 'Beverage Companies',
          description: 'Already using BevGenie'
        },
        {
          value: '24/7',
          label: 'AI Support',
          description: 'Available anytime, anywhere'
        },
        {
          value: '95%',
          label: 'Satisfaction',
          description: 'Customer satisfaction rating'
        }
      ]
    },
    {
      type: 'cta',
      title: 'Start Your Conversation Now',
      description: 'Use the chat sidebar to ask questions and get personalized solutions',
      buttons: [
        { text: 'Ask Your First Question', url: '#' },
        { text: 'View Documentation', url: '#' }
      ]
    }
  ]
};

export default function HomePage() {
  const [showPageWithChat, setShowPageWithChat] = useState(false);
  const [currentPage, setCurrentPage] = useState<BevGeniePage | null>(null);
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

  // If page+chat is open, show it
  if (showPageWithChat) {
    return (
      <PageWithChatSidebar
        page={currentPage || DEFAULT_DEMO_PAGE}
        messages={messages}
        isLoading={generationStatus.isGeneratingPage}
        generationStatus={generationStatus}
        onClose={() => {
          setShowPageWithChat(false);
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
      <ChatWidget
        onPageGenerated={() => {
          setShowPageWithChat(true);
          setCurrentPage(DEFAULT_DEMO_PAGE);
        }}
      />
    </main>
  )
}
