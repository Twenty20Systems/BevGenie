/**
 * SSE Chat Streaming Endpoint - Scalable Implementation
 *
 * POST /api/chat/stream
 *
 * Real-time streaming of page generation stages
 * Uses proper Node.js stream handling for scalability
 */

import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import { getSession, updatePersona, addConversationMessage as addConvMsg, getConversationHistory } from '@/lib/session/session';
import { validateAIConfiguration } from '@/lib/ai/orchestrator';
import { detectPersonaSignals, updatePersonaWithSignals } from '@/lib/ai/persona-detection';
import { getContextForLLM } from '@/lib/ai/knowledge-search';
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
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response('Invalid message', { status: 400 });
    }

    const session = await getSession();
    if (!session.user) {
      return new Response('No session', { status: 500 });
    }

    const conversationHistory = await getConversationHistory();

    // Create a readable stream that processes the entire pipeline
    const readable = Readable.from(processStream(message, session, conversationHistory));

    return new Response(readable as any, {
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

async function* processStream(
  message: string,
  session: any,
  conversationHistory: any[]
) {
  let updatedPersona: PersonaScores = session.user.persona;
  let aiResponse = '';
  let generatedPage: any = null;
  const signalDescriptions: string[] = [];

  try {
    // Stage 0: Init
    yield createEvent('stage', {
      stageId: 'init',
      status: 'active',
      stageName: 'Initializing...',
      progress: 5,
    });

    await delay(150);

    // Stage 1: Intent
    yield createEvent('stage', {
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

    yield createEvent('stage', {
      stageId: 'intent',
      status: 'complete',
      stageName: 'Question analyzed',
      progress: 25,
    });

    await delay(100);

    // Stage 2: Signals
    yield createEvent('stage', {
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

    yield createEvent('stage', {
      stageId: 'signals',
      status: 'complete',
      stageName: 'Profile updated',
      progress: 45,
    });

    await delay(100);

    // Stage 3: Knowledge
    yield createEvent('stage', {
      stageId: 'knowledge',
      status: 'active',
      stageName: 'Searching knowledge base...',
      progress: 55,
    });

    const knowledgeContext = await getContextForLLM(message, updatedPersona, 5);

    yield createEvent('stage', {
      stageId: 'knowledge',
      status: 'complete',
      stageName: 'Context gathered',
      progress: 65,
    });

    await delay(100);

    // Stage 4: Response
    yield createEvent('stage', {
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

    yield createEvent('stage', {
      stageId: 'response',
      status: 'complete',
      stageName: 'Response ready',
      progress: 82,
    });

    await delay(100);

    // Stage 5: Page Generation
    yield createEvent('stage', {
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
        conversationHistory: messages.slice(-3),
        personaDescription: 'User profile',
      });

      if (pageGenResult.success && pageGenResult.page) {
        generatedPage = {
          page: pageGenResult.page,
          intent: intentAnalysis.intent,
          intentConfidence: intentAnalysis.confidence,
        };

        yield createEvent('page', {
          page: generatedPage.page,
        });
      }
    } catch (error) {
      console.error('Page gen error:', error);
    }

    yield createEvent('stage', {
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
    yield createEvent('complete', {
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

    yield createEvent('stage', {
      stageId: 'complete',
      status: 'complete',
      stageName: 'Complete',
      progress: 100,
    });

    console.log('[Stream] Processing complete');
  } catch (error) {
    console.error('[Stream] Fatal error:', error);
    yield createEvent('error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
