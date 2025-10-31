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
Generate a concise 4-slide presentation based on this user's actual session with BevGenie AI.

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

CREATE EXACTLY 4 SLIDES:

SLIDE 1: PERSONA DETAILS
Title: "About You"
Content type: bullets
Content: Create 4-6 concise bullet points about the person based on their session:
- Role: ${functionalRole} at ${orgType} (${orgSize})
- Product Focus: ${data.persona.product_focus_detected || 'Beverage Industry'}
- Primary Interests: ${topCategory} (based on ${data.session.queriesAsked} questions asked)
- Session Duration: ${data.session.duration}
- Key Focus Areas: [Summarize the 2-3 main topics from their questions]

Visual: Professional profile-style layout with icons
Speaker Notes: "This slide captures who you are and what you explored today."

SLIDE 2: WHAT IS BEVGENIE
Title: "What is BevGenie?"
Content type: bullets
Content: Create 5-7 clear, concise bullet points explaining BevGenie:
- AI-powered business intelligence platform for the beverage industry
- Instant answers to complex business questions across sales, marketing, and operations
- Real-time data analysis replacing hours of manual work
- Personalized insights based on your role and organization type
- Features include: [List 3-4 most relevant features for ${functionalRole}s]
- Proven ROI: Average time savings of [calculate typical savings for this persona]
- Trusted by ${orgType}s ranging from craft to enterprise scale

Visual: BevGenie logo with clean, modern iconography
Speaker Notes: "BevGenie transforms how beverage professionals make data-driven decisions."

SLIDE 3: HOW BEVGENIE HELPS YOU - PART 1
Title: "How BevGenie Solves Your Challenges"
Content type: bullets
Content: Based on their ACTUAL questions, create 5-7 specific bullet points showing how BevGenie helps:
- Start each bullet with "✓" to show it's a solution
- Reference their actual questions (use quotes)
- For example: ✓ When you asked "${data.actualQuestions[0]}", BevGenie provided [specific answer/insight]
- Show the before/after: "Before: [manual process]. After: [instant insight]"
- Include time saved: "Saved ${data.problemSolutions[0]?.timeSaved || 15} minutes on this task alone"
- Make each point specific to their session, NOT generic

Example format:
✓ Your Question: "${data.actualQuestions[0]}"
  BevGenie's Answer: [Specific solution from ${data.problemSolutions[0]?.bevGenieSolution}]
  Time Saved: ${data.problemSolutions[0]?.timeSaved || 15} minutes

Visual: Checkmarks with copper/cyan gradient, clean layout
Speaker Notes: "These are the exact problems you solved today with BevGenie."

SLIDE 4: HOW BEVGENIE HELPS YOU - PART 2
Title: "Your Results & ROI"
Content type: stats
Content: Create 4-6 key metrics showing their session impact:
- Questions Answered: ${data.session.queriesAsked}
- Time Saved Today: ${data.roi.hoursSaved} hours
- Cost Savings: $${data.roi.costSaved}
- Efficiency Gain: ${data.roi.efficiencyGain}%
- Features You Used: [List 2-3 actual features from ${data.problemSolutions.map(ps => ps.featureUsed).join(', ')}]
- Projected Monthly Savings: [Calculate: $${data.roi.costSaved} × 4 weeks = monthly value]

Additional bullet points below stats:
- "If you used BevGenie weekly, you'd save approximately [calculate annual savings] per year"
- "Your top questions can now be answered in seconds instead of hours"
- "Next Steps: [Suggest 1-2 relevant features for ${functionalRole} to explore]"

Visual: Large gradient numbers for stats, clean modern layout
Speaker Notes: "This is the real impact of using BevGenie based on your actual session today."

IMPORTANT RULES:
1. Keep ALL content as concise bullet points - NO long paragraphs
2. Use their ACTUAL questions word-for-word (in quotes) on slides 3-4
3. All benefits must reference their specific session data
4. Make it personal - use "you" and "your" throughout
5. Keep it simple and scannable - maximum 7 bullets per slide
6. Focus on THEIR experience, not generic marketing

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
