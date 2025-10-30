/**
 * SSE Chat Streaming Endpoint - Web Streams API Implementation
 *
 * POST /api/chat/stream
 *
 * Real-time streaming of page generation stages
 * Uses Web Streams API (proper Next.js app router pattern)
 */

import { NextRequest } from 'next/server';
import { getSession, updatePersona, addConversationMessage as addConvMsg, getConversationHistory } from '@/lib/session/session';
import { validateAIConfiguration } from '@/lib/ai/orchestrator';
import { detectPersonaSignals, updatePersonaWithSignals, detectAndUpdateVectors } from '@/lib/ai/persona-detection';
import { getCurrentVectorClassification } from '@/lib/ai/vector-detection';
import { getContextForLLM, getKnowledgeDocuments } from '@/lib/ai/knowledge-search';
import { getPersonalizedSystemPrompt, PAIN_POINT_PROMPTS } from '@/lib/ai/prompts/system';
import { recordPersonaSignal } from '@/lib/session/session';
import { classifyMessageIntent } from '@/lib/ai/intent-classification';
import { generatePageSpec } from '@/lib/ai/page-generator';
import OpenAI from 'openai';
import type { PersonaScores, PainPointType } from '@/lib/session/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to send SSE event
function createEvent(eventType: string, data: any): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  try {
    validateAIConfiguration();

    const body = await request.json();
    const { message, context, interactionSource } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response('Invalid message', { status: 400 });
    }

    const session = await getSession();
    if (!session.user) {
      return new Response('No session', { status: 500 });
    }

    const conversationHistory = await getConversationHistory();

    // Use Web Streams API for proper Next.js compatibility
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await processStreamWithController(
            message,
            session,
            conversationHistory,
            controller,
            encoder,
            context,
            interactionSource
          );
          controller.close();
        } catch (error) {
          console.error('[Stream] Fatal error:', error);
          controller.enqueue(
            encoder.encode(
              createEvent('error', {
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[Stream] Error:', error);
    return new Response('Stream error', { status: 500 });
  }
}

async function processStreamWithController(
  message: string,
  session: any,
  conversationHistory: any[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  pageContext?: any,
  interactionSource?: string
): Promise<void> {
  let updatedPersona: PersonaScores = session.user.persona;
  let aiResponse = '';
  let generatedPage: any = null;
  const signalDescriptions: string[] = [];

  try {
    // Helper to enqueue event
    const sendEvent = (eventType: string, data: any) => {
      const eventStr = createEvent(eventType, data);
      controller.enqueue(encoder.encode(eventStr));
    };

    // Stage 0: Init
    sendEvent('stage', {
      stageId: 'init',
      status: 'active',
      stageName: 'Initializing...',
      progress: 5,
    });

    await delay(150);

    // Stage 1: Intent
    sendEvent('stage', {
      stageId: 'intent',
      status: 'active',
      stageName: 'Analyzing your question...',
      progress: 15,
    });

    const intentAnalysis = classifyMessageIntent(
      message,
      conversationHistory.length,
      updatedPersona
    );

    sendEvent('stage', {
      stageId: 'intent',
      status: 'complete',
      stageName: 'Question analyzed',
      progress: 25,
    });

    await delay(100);

    // Stage 2: Signals
    sendEvent('stage', {
      stageId: 'signals',
      status: 'active',
      stageName: 'Detecting your profile...',
      progress: 35,
    });

    const signals = detectPersonaSignals(message, updatedPersona);

    for (const signal of signals) {
      signalDescriptions.push(`${signal.type}/${signal.category}`);
      try {
        await recordPersonaSignal(
          signal.type === 'pain_point' ? 'pain_point_mention' : signal.type,
          signal.evidence,
          signal.strength,
          signal.type === 'pain_point' ? ([signal.category] as PainPointType[]) : undefined,
          {}
        );
      } catch (e) {
        console.error('Signal error:', e);
      }
    }

    updatedPersona = updatePersonaWithSignals(updatedPersona, signals);

    // ==================== NEW: Update 4-Vector Detection ====================
    // Detect and update the 4 key persona vectors based on message + interaction context
    updatedPersona = detectAndUpdateVectors(message, updatedPersona, pageContext ? {
      source: pageContext.source,
      text: pageContext.text,
      context: pageContext.context,
    } : undefined);

    // Get current vector classification for logging/tracking
    const vectorClassification = getCurrentVectorClassification(updatedPersona.detection_vectors);
    console.log('[Stream] Persona vectors updated:', {
      functional_role: vectorClassification.functional_role.value,
      org_type: vectorClassification.org_type.value,
      org_size: vectorClassification.org_size.value,
      product_focus: vectorClassification.product_focus.value,
    });
    // ======================================================================

    sendEvent('stage', {
      stageId: 'signals',
      status: 'complete',
      stageName: 'Profile updated',
      progress: 45,
    });

    // Send persona vector update event for client awareness
    sendEvent('persona_vectors', {
      functional_role: vectorClassification.functional_role.value,
      org_type: vectorClassification.org_type.value,
      org_size: vectorClassification.org_size.value,
      product_focus: vectorClassification.product_focus.value,
      all_vectors_identified: vectorClassification.all_vectors_identified,
    });

    await delay(100);

    // Stage 3: Knowledge
    sendEvent('stage', {
      stageId: 'knowledge',
      status: 'active',
      stageName: 'Searching knowledge base...',
      progress: 55,
    });

    const knowledgeContext = await getContextForLLM(message, updatedPersona, 5);
    const knowledgeDocuments = await getKnowledgeDocuments(message, undefined, undefined, 5);

    sendEvent('stage', {
      stageId: 'knowledge',
      status: 'complete',
      stageName: 'Context gathered',
      progress: 65,
    });

    await delay(100);

    // Stage 4: Response
    sendEvent('stage', {
      stageId: 'response',
      status: 'active',
      stageName: 'Generating response...',
      progress: 75,
    });

    const systemPrompt = getPersonalizedSystemPrompt(
      updatedPersona,
      knowledgeContext ? `\n## Context:\n${knowledgeContext}` : ''
    );

    let enhancedSystemPrompt = systemPrompt;
    if (updatedPersona.pain_points_detected.length > 0) {
      const topPainPoint = updatedPersona.pain_points_detected[0];
      if (PAIN_POINT_PROMPTS[topPainPoint]) {
        enhancedSystemPrompt += `\n\n${PAIN_POINT_PROMPTS[topPainPoint]}`;
      }
    }

    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.message_role,
        content: msg.message_content,
      })),
      { role: 'user' as const, content: message },
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: enhancedSystemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 300,
      });

      aiResponse = completion.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI error:', error);
      aiResponse = 'Error generating response';
    }

    sendEvent('stage', {
      stageId: 'response',
      status: 'complete',
      stageName: 'Response ready',
      progress: 82,
    });

    await delay(100);

    // Stage 5: Page Generation
    sendEvent('stage', {
      stageId: 'page',
      status: 'active',
      stageName: 'Generating personalized page...',
      progress: 90,
    });

    try {
      let pageType = intentAnalysis.suggestedPageType || 'solution_brief';

      const pageKnowledgeContext = knowledgeContext
        ? knowledgeContext.split('\n').filter((l: string) => l.trim())
        : [];

      const pageGenResult = await generatePageSpec({
        userMessage: message,
        pageType: pageType as any,
        persona: updatedPersona,
        knowledgeContext: pageKnowledgeContext,
        knowledgeDocuments: knowledgeDocuments,
        conversationHistory: messages.slice(-3),
        personaDescription: 'User profile',
        pageContext: pageContext,
        interactionSource: interactionSource,
      });

      if (pageGenResult.success && pageGenResult.page) {
        generatedPage = {
          page: pageGenResult.page,
          intent: intentAnalysis.intent,
          intentConfidence: intentAnalysis.confidence,
        };

        sendEvent('page', {
          page: generatedPage.page,
        });
      } else {
        console.warn('[Stream] Page generation failed:', pageGenResult.error, 'Retries:', pageGenResult.retryCount);
      }
    } catch (error) {
      console.error('[Stream] Page gen error:', error);
    }

    sendEvent('stage', {
      stageId: 'page',
      status: 'complete',
      stageName: 'Page ready',
      progress: 95,
    });

    // Save to history
    try {
      await addConvMsg('user', message, 'fresh');
      await addConvMsg('assistant', aiResponse, 'fresh');
    } catch (e) {
      console.error('Save error:', e);
    }

    // Update persona
    await updatePersona(updatedPersona);

    // Complete event
    sendEvent('complete', {
      success: true,
      message: aiResponse,
      session: {
        sessionId: session.user.sessionId,
        persona: updatedPersona,
        messageCount: session.user.messageCount + 1,
      },
      signals: signalDescriptions,
      generationMode: 'fresh',
      generatedPage,
    });

    sendEvent('stage', {
      stageId: 'complete',
      status: 'complete',
      stageName: 'Complete',
      progress: 100,
    });

    console.log('[Stream] Processing complete');
  } catch (error) {
    console.error('[Stream] Fatal error:', error);
    controller.enqueue(
      encoder.encode(
        createEvent('error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      )
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
