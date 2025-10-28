/**
 * SSE Chat Streaming Endpoint
 *
 * POST /api/chat/stream
 *
 * Streams real-time page generation with stage updates
 * Uses Server-Sent Events (SSE) for real-time progress feedback
 *
 * Request:
 * ```json
 * {
 *   "message": "How can you help our sales team?"
 * }
 * ```
 *
 * Response: Stream of SSE events
 * ```
 * event: stage
 * data: {"stageId":"intent","status":"active","stageName":"Analyzing intent...","progress":10}
 *
 * event: stage
 * data: {"stageId":"intent","status":"complete","stageName":"Intent analyzed","progress":20}
 *
 * event: page
 * data: {"page": {...}}
 *
 * event: complete
 * data: {"success":true,"message":"...","persona":{...}}
 * ```
 */

import { NextRequest } from 'next/server';
import { getSession, updatePersona, addConversationMessage, getConversationHistory } from '@/lib/session/session';
import { validateAIConfiguration } from '@/lib/ai/orchestrator';
import { detectPersonaSignals, updatePersonaWithSignals, getPrimaryPersonaClass } from '@/lib/ai/persona-detection';
import { getContextForLLM } from '@/lib/ai/knowledge-search';
import { getPersonalizedSystemPrompt, formatKnowledgeContext, PAIN_POINT_PROMPTS } from '@/lib/ai/prompts/system';
import { recordPersonaSignal, addConversationMessage as addConvMsg } from '@/lib/session/session';
import { classifyMessageIntent } from '@/lib/ai/intent-classification';
import { generatePageSpec } from '@/lib/ai/page-generator';
import OpenAI from 'openai';
import type { PersonaScores, PainPointType } from '@/lib/session/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StageEvent {
  stageId: string;
  status: 'active' | 'complete';
  stageName: string;
  progress: number;
}

function sendSSEEvent(controller: ReadableStreamDefaultController<Uint8Array>, eventType: string, data: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  console.log(`[SSE Send] ${eventType}:`, data);
  controller.enqueue(new TextEncoder().encode(message));
}

export async function POST(request: NextRequest) {
  try {
    // Validate AI configuration
    validateAIConfiguration();

    // Parse request body
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a non-empty string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message is too long (max 5000 characters)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create session
    const session = await getSession();
    if (!session.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to initialize session' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation history
    const conversationHistory = await getConversationHistory();

    // Return SSE stream
    return new Response(
      new ReadableStream<Uint8Array>(async (controller) => {
        try {
          let updatedPersona: PersonaScores = session.user!.persona;
          let aiResponse = '';
          let generatedPage: any = null;

          // Send initial event immediately so client knows stream started
          sendSSEEvent(controller, 'stage', {
            stageId: 'init',
            status: 'active',
            stageName: 'Initializing...',
            progress: 5,
          } as StageEvent);

          // Small delay to ensure first event is sent
          await new Promise(resolve => setTimeout(resolve, 100));

          // Stage 1: Analyze Intent
          sendSSEEvent(controller, 'stage', {
            stageId: 'intent',
            status: 'active',
            stageName: 'Analyzing your question...',
            progress: 10,
          } as StageEvent);

          const intentAnalysis = classifyMessageIntent(
            message,
            conversationHistory.length,
            updatedPersona
          );

          console.log(`[Stream] Intent: ${intentAnalysis.intent}, Confidence: ${intentAnalysis.confidence}`);

          sendSSEEvent(controller, 'stage', {
            stageId: 'intent',
            status: 'complete',
            stageName: 'Question analyzed',
            progress: 20,
          } as StageEvent);

          // Small delay to ensure events are processed
          await new Promise(resolve => setTimeout(resolve, 50));

          // Stage 2: Detect Signals & Update Persona
          sendSSEEvent(controller, 'stage', {
            stageId: 'signals',
            status: 'active',
            stageName: 'Detecting your profile...',
            progress: 30,
          } as StageEvent);

          const signals = detectPersonaSignals(message, updatedPersona);
          const signalDescriptions: string[] = [];

          for (const signal of signals) {
            signalDescriptions.push(`${signal.type}/${signal.category}: ${signal.strength}`);
            try {
              await recordPersonaSignal(
                signal.type === 'pain_point' ? 'pain_point_mention' : signal.type,
                signal.evidence,
                signal.strength,
                signal.type === 'pain_point' ? ([signal.category] as PainPointType[]) : undefined,
                {}
              );
            } catch (error) {
              console.error('Error recording signal:', error);
            }
          }

          updatedPersona = updatePersonaWithSignals(updatedPersona, signals);

          sendSSEEvent(controller, 'stage', {
            stageId: 'signals',
            status: 'complete',
            stageName: 'Profile updated',
            progress: 40,
          } as StageEvent);

          await new Promise(resolve => setTimeout(resolve, 50));

          // Stage 3: Search Knowledge Base
          sendSSEEvent(controller, 'stage', {
            stageId: 'knowledge',
            status: 'active',
            stageName: 'Searching knowledge base...',
            progress: 50,
          } as StageEvent);

          const knowledgeContext = await getContextForLLM(message, updatedPersona, 5);

          sendSSEEvent(controller, 'stage', {
            stageId: 'knowledge',
            status: 'complete',
            stageName: 'Context gathered',
            progress: 60,
          } as StageEvent);

          await new Promise(resolve => setTimeout(resolve, 50));

          // Stage 4: Generate Chat Response
          sendSSEEvent(controller, 'stage', {
            stageId: 'response',
            status: 'active',
            stageName: 'Generating response...',
            progress: 70,
          } as StageEvent);

          const systemPrompt = getPersonalizedSystemPrompt(
            updatedPersona,
            knowledgeContext ? `\n## Background Context:\n${knowledgeContext}` : ''
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
            {
              role: 'user' as const,
              content: message,
            },
          ];

          try {
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: enhancedSystemPrompt,
                },
                ...messages,
              ],
              temperature: 0.7,
              max_tokens: 300,
            });

            aiResponse = completion.choices[0].message.content || '';
          } catch (error) {
            console.error('Error calling OpenAI:', error);
            aiResponse = "I apologize, but I'm having trouble processing your message. Could you try again?";
          }

          sendSSEEvent(controller, 'stage', {
            stageId: 'response',
            status: 'complete',
            stageName: 'Response ready',
            progress: 80,
          } as StageEvent);

          await new Promise(resolve => setTimeout(resolve, 50));

          // Stage 5: Generate Dynamic Page
          sendSSEEvent(controller, 'stage', {
            stageId: 'page',
            status: 'active',
            stageName: 'Generating personalized page...',
            progress: 85,
          } as StageEvent);

          try {
            let pageType = intentAnalysis.suggestedPageType;

            if (!pageType) {
              if (updatedPersona.sales_focus_score > 0.5) {
                pageType = 'solution_brief';
              } else if (updatedPersona.marketing_focus_score > 0.5) {
                pageType = 'feature_showcase';
              } else {
                pageType = 'solution_brief';
              }
            }

            const pageKnowledgeContext = knowledgeContext
              ? knowledgeContext.split('\n').filter((line) => line.trim().length > 0)
              : [];

            console.log(`[Stream] Generating page: ${pageType}`);

            const pageGenResult = await generatePageSpec({
              userMessage: message,
              pageType: pageType as any,
              persona: updatedPersona,
              knowledgeContext: pageKnowledgeContext,
              conversationHistory: messages.slice(-3),
              personaDescription: getPersonaDescription(updatedPersona),
            });

            if (pageGenResult.success && pageGenResult.page) {
              console.log(`[Stream] Page generated successfully`);
              generatedPage = {
                page: pageGenResult.page,
                intent: intentAnalysis.intent,
                intentConfidence: intentAnalysis.confidence,
              };

              // Send page data
              sendSSEEvent(controller, 'page', {
                page: generatedPage.page,
              });
            } else {
              console.log(`[Stream] Page generation failed: ${pageGenResult.error}`);
            }
          } catch (error) {
            console.error('Error generating page:', error);
          }

          sendSSEEvent(controller, 'stage', {
            stageId: 'page',
            status: 'complete',
            stageName: 'Page ready',
            progress: 95,
          } as StageEvent);

          // Save to conversation history
          try {
            await addConvMsg('user', message, 'fresh');
            await addConvMsg('assistant', aiResponse, 'fresh');
          } catch (error) {
            console.error('Error saving conversation:', error);
          }

          // Update persona in session
          await updatePersona(updatedPersona);

          // Send completion event
          sendSSEEvent(controller, 'complete', {
            success: true,
            message: aiResponse,
            session: {
              sessionId: session.user.sessionId,
              persona: updatedPersona,
              messageCount: session.user.messageCount + 1,
            },
            signals: signalDescriptions,
            generationMode: determineGenerationMode(updatedPersona, conversationHistory.length),
            generatedPage,
          });

          sendSSEEvent(controller, 'stage', {
            stageId: 'complete',
            status: 'complete',
            stageName: 'Complete',
            progress: 100,
          } as StageEvent);

          controller.close();
        } catch (error) {
          console.error('Error in stream:', error);
          sendSSEEvent(controller, 'error', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.close();
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('Error in stream endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function determineGenerationMode(
  persona: PersonaScores,
  messageCount: number
): 'fresh' | 'returning' | 'data_connected' {
  if (messageCount > 5 && persona.pain_points_detected.length >= 2) {
    return 'data_connected';
  }

  if (persona.overall_confidence > 0.5 && messageCount > 2) {
    return 'returning';
  }

  return 'fresh';
}

function getPersonaDescription(persona: PersonaScores): string {
  const descriptions: string[] = [];

  if (persona.supplier_score > 0.6) {
    descriptions.push('as a beverage producer/supplier');
  }
  if (persona.distributor_score > 0.6) {
    descriptions.push('as a distributor');
  }

  if (persona.craft_score > 0.6) {
    descriptions.push('in the craft beverage segment');
  }
  if (persona.mid_sized_score > 0.6) {
    descriptions.push('as a mid-sized company');
  }
  if (persona.large_score > 0.6) {
    descriptions.push('as an enterprise');
  }

  if (persona.sales_focus_score > 0.6) {
    descriptions.push('with a focus on sales effectiveness');
  }
  if (persona.marketing_focus_score > 0.6) {
    descriptions.push('prioritizing marketing and brand positioning');
  }
  if (persona.operations_focus_score > 0.6) {
    descriptions.push('focused on operational efficiency');
  }
  if (persona.compliance_focus_score > 0.6) {
    descriptions.push('concerned with compliance and regulations');
  }

  let painPointText = '';
  if (persona.pain_points_detected.length > 0) {
    painPointText = `Their key challenges include ${persona.pain_points_detected.slice(0, 2).join(' and ')}.`;
  }

  const personaText = descriptions.length > 0
    ? `The user is ${descriptions.join(', ')}.`
    : 'The user is a beverage industry professional.';

  return `${personaText} ${painPointText}`;
}
