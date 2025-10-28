/**
 * useChat Hook
 *
 * Manages chat state and API communication
 * Handles message sending, response parsing, and session management
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface DynamicPageData {
  page: any;
  intent: string;
  intentConfidence: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedPage?: DynamicPageData;
}

export interface PersonaData {
  supplier_score: number;
  distributor_score: number;
  craft_score: number;
  mid_sized_score: number;
  large_score: number;
  sales_focus_score: number;
  marketing_focus_score: number;
  operations_focus_score: number;
  compliance_focus_score: number;
  pain_points_detected: string[];
  pain_points_confidence: Record<string, number>;
  overall_confidence: number;
  total_interactions: number;
}

export interface GenerationStatus {
  isGeneratingPage: boolean;
  stage: number;
  stageName?: string;
  progress: number; // 0-100
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  persona: PersonaData | null;
  generationMode: 'fresh' | 'returning' | 'data_connected';
  generationStatus: GenerationStatus;
}

export function useChat() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    sessionId: null,
    persona: null,
    generationMode: 'fresh',
    generationStatus: {
      isGeneratingPage: false,
      stage: 0,
      stageName: undefined,
      progress: 0,
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  /**
   * Send a message to the chat API
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) {
        return;
      }

      // Add user message to state
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
        generationStatus: {
          isGeneratingPage: false,
          stage: 0,
          progress: 0,
        },
      }));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();

        // If page is being generated, show loading state
        if (data.generatedPage) {
          setState((prev) => ({
            ...prev,
            generationStatus: {
              isGeneratingPage: true,
              stage: 0,
              stageName: 'Understanding Query',
              progress: 0,
            },
          }));
        }

        // Add assistant message to state
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          generatedPage: data.generatedPage,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          sessionId: data.session?.sessionId || prev.sessionId,
          persona: data.session?.persona || prev.persona,
          generationMode: data.generationMode || 'fresh',
          generationStatus: {
            isGeneratingPage: !!data.generatedPage,
            stage: 0,
            stageName: data.generatedPage ? 'Understanding Query' : undefined,
            progress: 0,
          },
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        // Add error message to chat
        const errorMsgObj: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMsgObj],
        }));
      }
    },
    []
  );

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      error: null,
    }));
  }, []);

  /**
   * Reset entire chat state
   */
  const resetChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      sessionId: null,
      persona: null,
      generationMode: 'fresh',
    });
  }, []);

  /**
   * Get persona display info
   */
  const getPersonaInfo = useCallback(() => {
    if (!state.persona) {
      return null;
    }

    const userType =
      state.persona.supplier_score > state.persona.distributor_score
        ? 'Supplier'
        : 'Distributor';

    const topPainPoints = Object.entries(state.persona.pain_points_confidence)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([key]) => key.replace(/_/g, ' '));

    return {
      userType,
      topPainPoints,
      confidence: Math.round(state.persona.overall_confidence * 100),
    };
  }, [state.persona]);

  return {
    ...state,
    sendMessage,
    clearMessages,
    resetChat,
    getPersonaInfo,
    messagesEndRef,
  };
}
