/**
 * Generate Presentation API Endpoint
 *
 * POST /api/generate-presentation
 *
 * Creates a personalized management presentation based on the user's actual session,
 * using their real questions and the problems they solved.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { PresentationData } from '@/lib/session/session-tracker';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SlideContent {
  type: 'bullets' | 'comparison' | 'quote' | 'stats' | 'timeline' | 'grid';
  data: any[];
}

export interface Slide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  content: SlideContent;
  visualDescription: string;
  speakerNotes: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const presentationData: PresentationData = body.presentationData;

    if (!presentationData || !presentationData.actualQuestions || presentationData.actualQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No session data available. Please interact with BevGenie first.' },
        { status: 400 }
      );
    }

    console.log('[Presentation] Generating presentation for session:', {
      queries: presentationData.actualQuestions.length,
      duration: presentationData.session.duration,
    });

    const slides = await generatePresentationContent(presentationData);

    return NextResponse.json({
      success: true,
      slides,
      metadata: {
        queriesCount: presentationData.actualQuestions.length,
        duration: presentationData.session.duration,
        roiSavings: presentationData.roi.costSaved,
      },
    });
  } catch (error) {
    console.error('[Presentation] Error generating:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function generatePresentationContent(data: PresentationData): Promise<Slide[]> {
  const functionalRole = determineRole(data.persona);
  const orgType = determineOrgType(data.persona);
  const orgSize = determineOrgSize(data.persona);
  const topCategory = getTopCategory(data.categoryBreakdown);

  const prompt = `
Generate a highly specific management presentation based on this user's actual session with BevGenie AI.

PERSONA:
- Role: ${functionalRole}
- Organization: ${orgType} (${orgSize})
- Product Focus: ${data.persona.product_focus_detected || 'Beverage Industry'}

SESSION SUMMARY:
- Duration: ${data.session.duration}
- Questions Asked: ${data.session.queriesAsked}
- Problems Solved: ${data.session.problemsSolved}

ACTUAL QUESTIONS ASKED (use these verbatim):
${data.actualQuestions.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

PROBLEMS & SOLUTIONS (map to their questions):
${data.problemSolutions.map((ps, i) => `
Problem ${i + 1}: ${ps.problemStatement}
User Asked: "${ps.userQuestion}"
Solution: ${ps.bevGenieSolution}
Feature: ${ps.featureUsed}
Before: ${ps.beforeState}
After: ${ps.afterState}
Time Saved: ${ps.timeSaved} minutes
`).join('\n')}

CATEGORY BREAKDOWN:
${Object.entries(data.categoryBreakdown).map(([cat, count]) => `- ${cat}: ${count} queries`).join('\n')}

ROI CALCULATION:
- Total Time Saved: ${data.roi.totalMinutesSaved} minutes (${data.roi.hoursSaved} hours)
- Cost Savings: $${data.roi.costSaved}
- Efficiency Gain: ${data.roi.efficiencyGain}%

CREATE SLIDES (10-12 slides):

SLIDE 1: TITLE SLIDE
Title: "How BevGenie Solves ${topCategory} for ${functionalRole}s"
Subtitle: "Based on ${data.session.duration} session | ${data.session.queriesAsked} challenges addressed"

SLIDE 2: YOUR QUESTIONS TODAY
Title: "The Questions You Asked"
Content: List their actual questions (top 5-6) as bullet points
- Use their EXACT words from actualQuestions
- Group by category if many questions
Speaker Notes: "These are the exact questions you explored today..."

SLIDE 3: THE REAL CHALLENGE
Title: "What This Really Means"
Content: Transform their questions into business problems
- For each major question, explain the underlying challenge
- Use problemStatement from each problemSolution
- Show why these problems matter (cost, time, competitive risk)

SLIDE 4-7: PROBLEM-SOLUTION SLIDES (one per major problem, max 4 slides)
Title: [Specific problem from their session]
Content:
  Your Question: "${exact user question}"

  The Manual Way (Before):
  ${beforeState with specifics}

  With BevGenie (After):
  ${afterState with specifics}

  Feature Used: ${featureUsed}
  Time Saved: ${timeSaved} minutes

  Visual: Side-by-side comparison or process flow

SLIDE 8: WHAT YOU DISCOVERED
Title: "Insights Uncovered in ${data.session.duration}"
Content:
- Specific insights/answers to their questions
- Data points they found
- Decisions they can now make
- Use examples from their actual queries

SLIDE 9: TIME & COST IMPACT
Title: "The ROI of This Session Alone"
Content:
  Questions Answered: ${data.session.queriesAsked}
  Time Saved: ${data.roi.hoursSaved} hours
  Cost Savings: $${data.roi.costSaved}

  Projected Annual Impact:
  - Calculate based on ${functionalRole} at a ${orgSize} ${orgType}
  - Show weekly/monthly savings

Visual: Bar chart or infographic

SLIDE 10: FULL PLATFORM CAPABILITIES
Title: "Beyond What You Tried Today"
Content:
- Features you used: [list from their session]
- Features you haven't explored yet: [additional capabilities]
- How these solve related problems
Organize by category (Data, Analytics, Reporting, Competitive Intel)

SLIDE 11: WHAT SUCCESS LOOKS LIKE
Title: "Your Team with BevGenie"
Content:
- Specific outcomes for ${functionalRole} at a ${orgType}
- Based on the problems you're solving
- Reference their actual questions as use cases
- 30/60/90 day transformation timeline

SLIDE 12: NEXT STEPS
Title: "Let's Move Forward"
Content:
- Trial extension or purchase options
- Implementation timeline
- Training and onboarding
- Support and resources
- Clear call to action

IMPORTANT RULES:
1. Use their ACTUAL questions word-for-word (in quotes)
2. Every problem-solution must reference their specific queries
3. NO generic examples - only use their session data
4. Make before/after scenarios specific to their questions
5. Calculate ROI based on THEIR actual usage
6. Show features they ACTUALLY used, not hypothetical ones
7. Make it feel like "this presentation is about YOUR experience"

Return a JSON array of slides with this exact structure:
[
  {
    "slideNumber": 1,
    "title": "...",
    "subtitle": "..." (optional),
    "content": {
      "type": "bullets" | "comparison" | "quote" | "stats" | "timeline" | "grid",
      "data": [...]
    },
    "visualDescription": "...",
    "speakerNotes": "..."
  }
]

Return ONLY the JSON array, no markdown formatting, no code blocks.
`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Try to extract JSON from the response
  const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const slides: Slide[] = JSON.parse(jsonMatch[0]);
  return slides;
}

function determineRole(persona: any): string {
  const detection = persona.detection_vectors;
  if (!detection) return 'Business Leader';

  const roleHistory = detection.functional_role_history || [];
  if (roleHistory.length === 0) return 'Business Leader';

  // Get most recent or highest confidence role
  const latestRole = roleHistory[roleHistory.length - 1];
  const roleMap: Record<string, string> = {
    sales: 'Sales Director',
    marketing: 'Marketing Leader',
    executive: 'Executive',
    operations: 'Operations Manager',
    finance: 'Finance Director',
  };

  return roleMap[latestRole.value] || 'Business Leader';
}

function determineOrgType(persona: any): string {
  const detection = persona.detection_vectors;
  if (!detection) return 'Organization';

  const orgHistory = detection.org_type_history || [];
  if (orgHistory.length === 0) return 'Organization';

  const latestOrg = orgHistory[orgHistory.length - 1];
  const orgMap: Record<string, string> = {
    supplier: 'Supplier',
    distributor: 'Distributor',
    retailer: 'Retailer',
    manufacturer: 'Manufacturer',
  };

  return orgMap[latestOrg.value] || 'Organization';
}

function determineOrgSize(persona: any): string {
  const detection = persona.detection_vectors;
  if (!detection) return 'Mid-sized';

  const sizeHistory = detection.org_size_history || [];
  if (sizeHistory.length === 0) return 'Mid-sized';

  const latestSize = sizeHistory[sizeHistory.length - 1];
  const sizeMap: Record<string, string> = {
    craft: 'Craft/Small',
    mid_sized: 'Mid-sized',
    large: 'Large Enterprise',
  };

  return sizeMap[latestSize.value] || 'Mid-sized';
}

function getTopCategory(breakdown: Record<string, number>): string {
  let topCategory = 'Business Intelligence';
  let maxCount = 0;

  for (const [category, count] of Object.entries(breakdown)) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = category;
    }
  }

  return topCategory;
}
