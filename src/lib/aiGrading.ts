/**
 * AI Grading System for BTG Platform
 * Uses Claude API to grade student assignment responses
 *
 * Grading Scale:
 * - FULL: Complete, thoughtful response demonstrating understanding
 * - HALF: Partially correct or incomplete response
 * - NONE: Missing, off-topic, or incorrect response
 */

import { supabase } from './supabase';
import { isFeatureEnabled } from './featureFlags';
import type { GradeScore, GradingRubric, Assignment } from './types';

// ============================================
// TYPES
// ============================================

interface GradingResult {
  score: GradeScore;
  feedback: string;
  model_used: string;
  rubric_version: string;
}

interface GradingRequest {
  assignment_prompt: string;
  student_response: string;
  rubric?: GradingRubric | null;
  module_title?: string;
  week_number?: number;
}

// ============================================
// CONFIGURATION
// ============================================

// Default rubric when no specific rubric is defined
const DEFAULT_RUBRIC: Partial<GradingRubric> = {
  full_credit_criteria: 'Response demonstrates clear understanding of the topic. Includes specific examples, uses relevant vocabulary, and directly answers the question with thoughtful analysis.',
  half_credit_criteria: 'Response shows partial understanding. May be missing examples, lack depth, or only partially address the question. Shows some effort but needs more detail.',
  no_credit_criteria: 'Response is off-topic, extremely brief (less than 2 sentences), copied from the prompt, or does not demonstrate any understanding of the material.',
};

// ============================================
// GRADING PROMPT
// ============================================

function buildGradingPrompt(request: GradingRequest): string {
  const rubric = request.rubric || DEFAULT_RUBRIC;

  return `You are a fair but encouraging teacher grading a student's written response for a financial literacy course.

CONTEXT:
${request.module_title ? `Module: ${request.module_title}` : ''}
${request.week_number ? `Week: ${request.week_number}` : ''}

ASSIGNMENT PROMPT:
${request.assignment_prompt}

STUDENT'S RESPONSE:
${request.student_response}

GRADING RUBRIC:
FULL CREDIT: ${rubric.full_credit_criteria}
${rubric.full_credit_example ? `Example: ${rubric.full_credit_example}` : ''}

HALF CREDIT: ${rubric.half_credit_criteria}
${rubric.half_credit_example ? `Example: ${rubric.half_credit_example}` : ''}

NO CREDIT: ${rubric.no_credit_criteria}
${rubric.no_credit_example ? `Example: ${rubric.no_credit_example}` : ''}

${rubric.required_concepts && rubric.required_concepts.length > 0 ?
    `KEY CONCEPTS TO CHECK FOR: ${rubric.required_concepts.join(', ')}` : ''}

INSTRUCTIONS:
1. Evaluate the student's response against the rubric criteria
2. Be encouraging but honest - students learn from constructive feedback
3. If the response is borderline, give the benefit of the doubt to the student
4. Provide specific, actionable feedback on how to improve

Respond in this exact JSON format:
{
  "score": "full" | "half" | "none",
  "feedback": "2-3 sentences of constructive feedback"
}

Remember: You're grading high school and college students. Be age-appropriate, encouraging, and focus on the financial literacy concepts.`;
}

// ============================================
// MOCK GRADING (for testing without API)
// ============================================

function mockGrade(request: GradingRequest): GradingResult {
  const wordCount = request.student_response.split(/\s+/).length;

  // Simple mock logic based on word count
  if (wordCount < 10) {
    return {
      score: 'none',
      feedback: 'Your response is too brief. Try to write at least 2-3 sentences explaining your thinking with specific examples.',
      model_used: 'mock',
      rubric_version: '1.0-mock',
    };
  } else if (wordCount < 30) {
    return {
      score: 'half',
      feedback: 'Good start! You\'re on the right track. Try to add more detail and specific examples to fully demonstrate your understanding.',
      model_used: 'mock',
      rubric_version: '1.0-mock',
    };
  } else {
    return {
      score: 'full',
      feedback: 'Great job! Your response shows a solid understanding of the material. You provided good detail and examples.',
      model_used: 'mock',
      rubric_version: '1.0-mock',
    };
  }
}

// ============================================
// AI GRADING FUNCTION
// ============================================

export async function gradeAssignment(request: GradingRequest): Promise<GradingResult> {
  // Check feature flags
  const aiGradingEnabled = isFeatureEnabled('aiGrading');
  const useMockGrading = isFeatureEnabled('mockAiGrading');

  // If AI grading disabled or mock mode, use mock grading
  if (!aiGradingEnabled || useMockGrading) {
    console.log('[AIGrading] Using mock grading');
    return mockGrade(request);
  }

  // Validate input
  if (!request.student_response || request.student_response.trim().length < 5) {
    return {
      score: 'none',
      feedback: 'Please provide a response to the assignment prompt.',
      model_used: 'validation',
      rubric_version: '1.0',
    };
  }

  try {
    // Build the grading prompt
    const prompt = buildGradingPrompt(request);

    // Call the grading endpoint (Supabase Edge Function)
    const { data, error } = await supabase.functions.invoke('grade-assignment', {
      body: {
        prompt,
        max_tokens: 500,
      },
    });

    if (error) {
      console.error('[AIGrading] Edge function error:', error);
      // Fall back to mock grading
      return mockGrade(request);
    }

    // Parse the response
    const result = parseGradingResponse(data.response);

    return {
      ...result,
      model_used: data.model || 'claude-3-haiku',
      rubric_version: request.rubric?.version || '1.0',
    };
  } catch (error) {
    console.error('[AIGrading] Error:', error);
    // Fall back to mock grading on any error
    return mockGrade(request);
  }
}

// ============================================
// RESPONSE PARSING
// ============================================

function parseGradingResponse(response: string): { score: GradeScore; feedback: string } {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(response);

    const score = validateScore(parsed.score);
    const feedback = parsed.feedback || 'Your response has been graded.';

    return { score, feedback };
  } catch {
    // If JSON parsing fails, try to extract from text
    const lowerResponse = response.toLowerCase();

    let score: GradeScore = 'half'; // Default to half if unclear
    if (lowerResponse.includes('"score": "full"') || lowerResponse.includes('full credit')) {
      score = 'full';
    } else if (lowerResponse.includes('"score": "none"') || lowerResponse.includes('no credit')) {
      score = 'none';
    }

    return {
      score,
      feedback: 'Your response has been reviewed. Keep up the good work!',
    };
  }
}

function validateScore(score: unknown): GradeScore {
  if (score === 'full' || score === 'half' || score === 'none') {
    return score;
  }
  return 'half'; // Default
}

// ============================================
// DATABASE OPERATIONS
// ============================================

export async function submitAndGradeAssignment(
  userId: string,
  moduleId: string,
  enrollmentId: string | null,
  responseText: string,
  assignmentPrompt: string,
  rubric?: GradingRubric | null,
  moduleTitle?: string,
  weekNumber?: number
): Promise<Assignment> {
  // Grade the response
  const gradingResult = await gradeAssignment({
    assignment_prompt: assignmentPrompt,
    student_response: responseText,
    rubric,
    module_title: moduleTitle,
    week_number: weekNumber,
  });

  // Get current timestamp
  const now = new Date().toISOString();

  // Check for existing assignment (retry case)
  const { data: existing } = await supabase
    .from('assignments')
    .select('attempt_number')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single();

  const attemptNumber = existing ? existing.attempt_number + 1 : 1;

  // Insert the assignment with grading
  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert({
      user_id: userId,
      module_id: moduleId,
      enrollment_id: enrollmentId,
      response_text: responseText,
      response_submitted_at: now,
      ai_score: gradingResult.score,
      ai_feedback: gradingResult.feedback,
      ai_graded_at: now,
      ai_model_used: gradingResult.model_used,
      ai_rubric_version: gradingResult.rubric_version,
      attempt_number: attemptNumber,
    })
    .select()
    .single();

  if (error) {
    console.error('[AIGrading] Failed to save assignment:', error);
    throw new Error('Failed to save assignment');
  }

  return assignment as Assignment;
}

// ============================================
// TEACHER GRADING
// ============================================

export async function teacherGradeAssignment(
  assignmentId: string,
  teacherId: string,
  score: GradeScore,
  feedback: string
): Promise<Assignment> {
  const { data: assignment, error } = await supabase
    .from('assignments')
    .update({
      teacher_score: score,
      teacher_feedback: feedback,
      teacher_override_at: new Date().toISOString(),
      teacher_id: teacherId,
    })
    .eq('id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error('[AIGrading] Failed to save teacher grade:', error);
    throw new Error('Failed to save teacher grade');
  }

  return assignment as Assignment;
}

// ============================================
// FETCH RUBRIC
// ============================================

export async function getRubricForModule(moduleId: string): Promise<GradingRubric | null> {
  const { data, error } = await supabase
    .from('grading_rubrics')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as GradingRubric;
}

export async function getRubricForWeek(weekNumber: number): Promise<GradingRubric | null> {
  const { data, error } = await supabase
    .from('grading_rubrics')
    .select('*')
    .eq('week_number', weekNumber)
    .is('module_id', null)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as GradingRubric;
}

export default {
  gradeAssignment,
  submitAndGradeAssignment,
  teacherGradeAssignment,
  getRubricForModule,
  getRubricForWeek,
};
