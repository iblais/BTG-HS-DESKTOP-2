/**
 * Assignment Service for BTG Platform
 * Handles assignment submission, AI grading, and teacher overrides
 */

import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// ============================================
// TYPES
// ============================================

export interface Assignment {
  id: string;
  user_id: string;
  enrollment_id: string | null;
  module_id: string;
  rubric_id: string | null;
  response_text: string | null;
  response_submitted_at: string | null;
  ai_score: 'full' | 'half' | 'none' | null;
  ai_feedback: string | null;
  ai_graded_at: string | null;
  ai_model_used: string | null;
  ai_confidence: number | null;
  teacher_score: 'full' | 'half' | 'none' | null;
  teacher_feedback: string | null;
  teacher_override_at: string | null;
  teacher_id: string | null;
  time_spent_seconds: number;
  attempt_number: number;
  created_at: string;
  updated_at: string;
}

export interface GradingRubric {
  id: string;
  module_id: string | null;
  week_number: number | null;
  program_id: string | null;
  rubric_name: string;
  full_credit_criteria: string;
  full_credit_example: string | null;
  half_credit_criteria: string;
  half_credit_example: string | null;
  no_credit_criteria: string;
  no_credit_example: string | null;
  required_concepts: string[];
  version: string;
  is_active: boolean;
}

export interface AssignmentSubmission {
  moduleId: string;
  responseText: string;
  timeSpentSeconds?: number;
}

export interface GradingResult {
  score: 'full' | 'half' | 'none';
  feedback: string;
  confidence: number;
  matchedConcepts: string[];
  missingConcepts: string[];
}

// ============================================
// RUBRIC FUNCTIONS
// ============================================

/**
 * Get rubric for a specific module or week
 */
export async function getRubric(
  moduleId?: string,
  weekNumber?: number,
  programId?: string
): Promise<GradingRubric | null> {
  let query = supabase
    .from('grading_rubrics')
    .select('*')
    .eq('is_active', true);

  if (moduleId) {
    query = query.eq('module_id', moduleId);
  } else if (weekNumber && programId) {
    query = query.eq('week_number', weekNumber).eq('program_id', programId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error('[Assignments] Error fetching rubric:', error);
    // Return default rubric
    return getDefaultRubric();
  }

  return data || getDefaultRubric();
}

/**
 * Get the default rubric for general assignments
 */
function getDefaultRubric(): GradingRubric {
  return {
    id: 'default',
    module_id: null,
    week_number: null,
    program_id: null,
    rubric_name: 'Default Assignment Rubric',
    full_credit_criteria: 'Response demonstrates complete understanding of the concept. Includes specific examples or personal application. Shows critical thinking.',
    full_credit_example: null,
    half_credit_criteria: 'Response shows partial understanding. May lack examples or depth. Addresses the main point but misses nuances.',
    half_credit_example: null,
    no_credit_criteria: 'Response is off-topic, incomplete, or shows significant misunderstanding. May be too brief or copied.',
    no_credit_example: null,
    required_concepts: ['understanding', 'application', 'examples'],
    version: '1.0',
    is_active: true,
  };
}

// ============================================
// AI GRADING
// ============================================

/**
 * Grade an assignment using AI (pattern matching for now)
 * In production, this would call an AI API (Claude, GPT, etc.)
 */
export async function gradeAssignment(
  responseText: string,
  rubric: GradingRubric
): Promise<GradingResult> {
  const response = responseText.toLowerCase().trim();
  const wordCount = response.split(/\s+/).filter(w => w.length > 0).length;

  // Check for minimum length
  if (wordCount < 10) {
    return {
      score: 'none',
      feedback: 'Your response is too brief. Please provide a more detailed answer that demonstrates your understanding of the concepts.',
      confidence: 0.95,
      matchedConcepts: [],
      missingConcepts: rubric.required_concepts,
    };
  }

  // Check for copy/paste or nonsense
  if (isLikelyCopied(response) || isNonsense(response)) {
    return {
      score: 'none',
      feedback: 'Your response appears to be copied or doesn\'t address the question. Please provide your own thoughtful answer.',
      confidence: 0.85,
      matchedConcepts: [],
      missingConcepts: rubric.required_concepts,
    };
  }

  // Check for required concepts
  const matchedConcepts: string[] = [];
  const missingConcepts: string[] = [];

  for (const concept of rubric.required_concepts) {
    if (containsConcept(response, concept)) {
      matchedConcepts.push(concept);
    } else {
      missingConcepts.push(concept);
    }
  }

  const conceptScore = matchedConcepts.length / rubric.required_concepts.length;

  // Determine grade based on length, concepts, and quality indicators
  const hasExamples = /for example|such as|like when|instance|specifically/i.test(response);
  const hasPersonalConnection = /i think|i believe|in my experience|personally|i feel|i would/i.test(response);
  const hasDepth = wordCount > 50 && (hasExamples || hasPersonalConnection);

  let score: 'full' | 'half' | 'none';
  let feedback: string;
  let confidence: number;

  if (conceptScore >= 0.7 && hasDepth) {
    score = 'full';
    feedback = 'Excellent response! You demonstrated strong understanding of the concepts with clear examples and personal application.';
    confidence = 0.85;
  } else if (conceptScore >= 0.5 || (wordCount > 30 && matchedConcepts.length > 0)) {
    score = 'half';
    feedback = 'Good effort! Your response shows understanding but could benefit from more specific examples or deeper analysis.';
    if (missingConcepts.length > 0) {
      feedback += ` Consider expanding on: ${missingConcepts.join(', ')}.`;
    }
    confidence = 0.75;
  } else {
    score = 'none';
    feedback = 'Your response needs more development. Try to include specific examples and explain how the concepts apply to real-life situations.';
    confidence = 0.70;
  }

  return {
    score,
    feedback,
    confidence,
    matchedConcepts,
    missingConcepts,
  };
}

/**
 * Check if response contains a concept (flexible matching)
 */
function containsConcept(response: string, concept: string): boolean {
  const synonyms: Record<string, string[]> = {
    understanding: ['understand', 'comprehend', 'grasp', 'learn', 'know', 'realize', 'aware'],
    application: ['apply', 'use', 'implement', 'practice', 'utilize', 'put into'],
    examples: ['example', 'instance', 'case', 'scenario', 'situation', 'when'],
    budget: ['budget', 'spending', 'expenses', 'money management', 'financial plan'],
    savings: ['save', 'saving', 'savings', 'put aside', 'emergency fund'],
    credit: ['credit', 'credit score', 'credit card', 'borrow', 'loan'],
    income: ['income', 'earn', 'salary', 'wages', 'paycheck', 'money coming in'],
  };

  const terms = synonyms[concept.toLowerCase()] || [concept.toLowerCase()];
  return terms.some(term => response.includes(term));
}

/**
 * Check if response appears to be copied
 */
function isLikelyCopied(response: string): boolean {
  // Check for common copy indicators
  const copyIndicators = [
    'lorem ipsum',
    'according to wikipedia',
    'copy and paste',
    '[citation needed]',
    'from the textbook',
  ];
  return copyIndicators.some(indicator => response.includes(indicator));
}

/**
 * Check if response is nonsense
 */
function isNonsense(response: string): boolean {
  // Check for repeated characters or words
  const repeatedChars = /(.)\1{10,}/.test(response);
  const words = response.split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;

  return repeatedChars || (words.length > 10 && repetitionRatio < 0.3);
}

// ============================================
// ASSIGNMENT CRUD
// ============================================

/**
 * Submit an assignment
 */
export async function submitAssignment(
  submission: AssignmentSubmission
): Promise<{ success: boolean; assignment?: Assignment; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be logged in to submit assignments.' };
  }

  try {
    // Get rubric for the module
    const rubric = await getRubric(submission.moduleId);

    // Grade the assignment
    const gradingResult = await gradeAssignment(submission.responseText, rubric!);

    // Get current attempt number
    const { data: existing } = await supabase
      .from('assignments')
      .select('attempt_number')
      .eq('user_id', user.id)
      .eq('module_id', submission.moduleId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const attemptNumber = (existing?.[0]?.attempt_number || 0) + 1;

    // Insert the assignment
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        user_id: user.id,
        module_id: submission.moduleId,
        rubric_id: rubric?.id === 'default' ? null : rubric?.id,
        response_text: submission.responseText,
        response_submitted_at: new Date().toISOString(),
        ai_score: gradingResult.score,
        ai_feedback: gradingResult.feedback,
        ai_graded_at: new Date().toISOString(),
        ai_model_used: 'pattern-matching-v1',
        ai_confidence: gradingResult.confidence,
        time_spent_seconds: submission.timeSpentSeconds || 0,
        attempt_number: attemptNumber,
      })
      .select()
      .single();

    if (error) {
      console.error('[Assignments] Error submitting:', error);
      return { success: false, error: 'Failed to submit assignment. Please try again.' };
    }

    return { success: true, assignment: data };
  } catch (err) {
    console.error('[Assignments] Submit error:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Get user's assignments for a module
 */
export async function getModuleAssignments(moduleId: string): Promise<Assignment[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .order('attempt_number', { ascending: false });

  if (error) {
    console.error('[Assignments] Error fetching:', error);
    return [];
  }

  return data || [];
}

/**
 * Get assignment by ID
 */
export async function getAssignment(assignmentId: string): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (error) {
    console.error('[Assignments] Error fetching assignment:', error);
    return null;
  }

  return data;
}

/**
 * Get final grade (teacher override takes precedence)
 */
export function getFinalGrade(assignment: Assignment): 'full' | 'half' | 'none' | null {
  return assignment.teacher_score || assignment.ai_score;
}

/**
 * Get final feedback (teacher override takes precedence)
 */
export function getFinalFeedback(assignment: Assignment): string | null {
  return assignment.teacher_feedback || assignment.ai_feedback;
}

// ============================================
// TEACHER FUNCTIONS
// ============================================

/**
 * Override assignment grade (teacher only)
 */
export async function overrideGrade(
  assignmentId: string,
  score: 'full' | 'half' | 'none',
  feedback: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be logged in.' };
  }

  const { error } = await supabase
    .from('assignments')
    .update({
      teacher_score: score,
      teacher_feedback: feedback,
      teacher_override_at: new Date().toISOString(),
      teacher_id: user.id,
    })
    .eq('id', assignmentId);

  if (error) {
    console.error('[Assignments] Error overriding grade:', error);
    return { success: false, error: 'Failed to update grade.' };
  }

  return { success: true };
}

/**
 * Get pending assignments for a teacher's students
 */
export async function getTeacherPendingAssignments(): Promise<Assignment[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  // Get assignments from students in teacher's classes where AI scored but no teacher override
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      users!assignments_user_id_fkey(email, display_name)
    `)
    .not('ai_score', 'is', null)
    .is('teacher_score', null)
    .order('response_submitted_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Assignments] Error fetching pending:', error);
    return [];
  }

  return data || [];
}

export default {
  getRubric,
  gradeAssignment,
  submitAssignment,
  getModuleAssignments,
  getAssignment,
  getFinalGrade,
  getFinalFeedback,
  overrideGrade,
  getTeacherPendingAssignments,
};
