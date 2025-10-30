/**
 * Session Tracker - Tracks every user question and interaction for presentation generation
 *
 * This tracker records the user's actual questions, problems, and solutions provided
 * to create highly personalized presentations based on their real session experience.
 */

import type { PersonaScores } from './types';

export interface UserQuery {
  query: string; // Exact question asked
  timestamp: string;
  context: string; // What page they were on
  problemType: string; // Categorized automatically
  solutionProvided: string; // What BevGenie showed them
  featureUsed: string; // Which feature answered this
}

export interface ProblemSolution {
  userQuestion: string; // Their exact words
  problemStatement: string; // Refined problem statement
  bevGenieSolution: string; // How we solved it
  featureUsed: string;
  timeSaved: number; // Estimated time saved
  beforeState: string; // What they had to do before
  afterState: string; // What they can do now
}

export interface SessionData {
  duration: string;
  queriesAsked: number;
  problemsSolved: number;
}

export interface ROIData {
  totalMinutesSaved: number;
  hoursSaved: string;
  costSaved: number;
  efficiencyGain: number;
}

export interface PresentationData {
  persona: PersonaScores;
  session: SessionData;
  actualQuestions: string[];
  problemSolutions: ProblemSolution[];
  categoryBreakdown: Record<string, number>;
  roi: ROIData;
}

export class SessionTracker {
  public queries: UserQuery[] = [];
  private persona: PersonaScores;
  private sessionStart: string;

  constructor(persona: PersonaScores) {
    this.persona = persona;
    this.sessionStart = new Date().toISOString();
  }

  /**
   * Track every single question/query
   */
  trackQuery(
    query: string,
    context: string,
    solutionProvided: string = 'Solution being generated...',
    featureUsed: string = 'BevGenie AI'
  ) {
    this.queries.push({
      query: query.trim(),
      timestamp: new Date().toISOString(),
      context,
      problemType: this.categorizeProblem(query),
      solutionProvided,
      featureUsed,
    });
  }

  /**
   * Update the last query with actual solution and feature used
   */
  updateLastQuery(solution: string, feature: string) {
    const lastQuery = this.queries[this.queries.length - 1];
    if (lastQuery) {
      lastQuery.solutionProvided = solution;
      lastQuery.featureUsed = feature;
    }
  }

  /**
   * Categorize the problem type based on the query
   */
  private categorizeProblem(query: string): string {
    const categories: Record<string, RegExp> = {
      'Data Access': /find|get|show|where|access|need data|view|display/i,
      'Analysis': /why|analyze|understand|explain|insight|breakdown|deep dive/i,
      'Comparison': /compare|versus|vs|difference|better|against/i,
      'Trends': /trend|forecast|predict|future|growth|projection/i,
      'Reporting': /report|export|share|presentation|summary|document/i,
      'Performance': /how is|performing|results|metrics|kpi|measure/i,
      'Competitive': /competitor|competitive|market share|versus|benchmark/i,
      'Territory': /territory|region|area|geographic|market|location/i,
      'ROI': /roi|return|investment|cost|value|savings|prove/i,
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(query)) return category;
    }
    return 'General Inquiry';
  }

  /**
   * Convert tracked queries into problem-solution pairs
   */
  getProblemSolutionPairs(): ProblemSolution[] {
    return this.queries.map((q) => {
      const beforeAfter = this.generateBeforeAfter(q);

      return {
        userQuestion: q.query,
        problemStatement: this.refineProblemStatement(q.query, q.problemType),
        bevGenieSolution: q.solutionProvided,
        featureUsed: q.featureUsed,
        timeSaved: this.estimateTimeSaved(q.problemType),
        beforeState: beforeAfter.before,
        afterState: beforeAfter.after,
      };
    });
  }

  /**
   * Refine a user question into a clear problem statement
   */
  private refineProblemStatement(query: string, type: string): string {
    const subject = this.extractSubject(query);

    const templates: Record<string, string> = {
      'Data Access': `Difficulty accessing: ${subject}`,
      'Analysis': `Need to understand: ${subject}`,
      'Comparison': `Unable to compare: ${subject}`,
      'Trends': `Tracking trends for: ${subject}`,
      'Reporting': `Creating reports on: ${subject}`,
      'Performance': `Monitoring performance of: ${subject}`,
      'Competitive': `Competitive intelligence needed for: ${subject}`,
      'Territory': `Territory analysis needed for: ${subject}`,
      'ROI': `Proving value and ROI for: ${subject}`,
    };

    return templates[type] || `Challenge with: ${subject}`;
  }

  /**
   * Extract the main subject from the question
   */
  private extractSubject(query: string): string {
    return query
      .replace(/^(show me|find|get|how|what|why|where|when|can you|tell me|explain)\s+/i, '')
      .replace(/\?$/, '')
      .trim();
  }

  /**
   * Generate before/after scenarios based on problem type
   */
  private generateBeforeAfter(query: UserQuery): { before: string; after: string } {
    const scenarios: Record<string, { before: string; after: string }> = {
      'Data Access': {
        before: 'Manually searching through multiple spreadsheets and databases',
        after: `Instant access via ${query.featureUsed}`,
      },
      'Analysis': {
        before: 'Hours spent in Excel creating pivot tables and formulas',
        after: `AI-powered insights delivered in seconds`,
      },
      'Comparison': {
        before: 'Building comparison tables manually across data sources',
        after: `Side-by-side comparison with one click`,
      },
      'Trends': {
        before: 'Manually tracking data points over time in spreadsheets',
        after: `Automated trend analysis with predictive insights`,
      },
      'Reporting': {
        before: 'Spending 2-3 hours creating presentation slides',
        after: `Auto-generated reports in minutes`,
      },
      'Performance': {
        before: 'Waiting for weekly reports from multiple sources',
        after: `Real-time performance dashboards`,
      },
      'Competitive': {
        before: 'Manual research across news, reports, and databases',
        after: `Consolidated competitive intelligence dashboard`,
      },
      'Territory': {
        before: 'Analyzing territories manually with static reports',
        after: `Dynamic territory intelligence with real-time insights`,
      },
      'ROI': {
        before: 'Guessing at value without concrete data',
        after: `Data-driven ROI calculations with proof points`,
      },
    };

    return (
      scenarios[query.problemType] || {
        before: 'Manual, time-consuming process',
        after: 'Automated solution via BevGenie AI',
      }
    );
  }

  /**
   * Estimate time saved based on problem type
   */
  private estimateTimeSaved(problemType: string): number {
    const timeMap: Record<string, number> = {
      'Data Access': 30,
      'Analysis': 120,
      'Comparison': 60,
      'Trends': 90,
      'Reporting': 180,
      'Performance': 45,
      'Competitive': 240,
      'Territory': 90,
      'ROI': 150,
    };
    return timeMap[problemType] || 60;
  }

  /**
   * Get comprehensive presentation data
   */
  getPresentationData(): PresentationData {
    const problemSolutions = this.getProblemSolutionPairs();
    const totalTimeSaved = problemSolutions.reduce((sum, ps) => sum + ps.timeSaved, 0);

    return {
      persona: this.persona,
      session: {
        duration: this.getSessionDuration(),
        queriesAsked: this.queries.length,
        problemsSolved: problemSolutions.length,
      },
      actualQuestions: this.queries.map((q) => q.query),
      problemSolutions: problemSolutions,
      categoryBreakdown: this.getCategoryBreakdown(),
      roi: {
        totalMinutesSaved: totalTimeSaved,
        hoursSaved: (totalTimeSaved / 60).toFixed(1),
        costSaved: Math.round((totalTimeSaved / 60) * 75), // $75/hour average
        efficiencyGain: Math.round((totalTimeSaved / (totalTimeSaved + 15)) * 100),
      },
    };
  }

  /**
   * Get breakdown of queries by category
   */
  private getCategoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    this.queries.forEach((q) => {
      breakdown[q.problemType] = (breakdown[q.problemType] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Calculate session duration
   */
  private getSessionDuration(): string {
    const start = new Date(this.sessionStart);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - start.getTime()) / 60000);

    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }

  /**
   * Get the most asked problem category
   */
  getTopCategory(): string {
    const breakdown = this.getCategoryBreakdown();
    let topCategory = 'General';
    let maxCount = 0;

    for (const [category, count] of Object.entries(breakdown)) {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    }

    return topCategory;
  }

  /**
   * Export session data for persistence
   */
  exportSession() {
    return {
      persona: this.persona,
      queries: this.queries,
      sessionStart: this.sessionStart,
    };
  }

  /**
   * Import session data from storage
   */
  static importSession(data: any): SessionTracker {
    const tracker = new SessionTracker(data.persona);
    tracker.queries = data.queries || [];
    tracker.sessionStart = data.sessionStart;
    return tracker;
  }
}
