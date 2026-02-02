import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface RubricCriterion {
  criterion: string;
  points: number;
  description: string;
}

export interface RubricTemplate {
  id: string;
  name: string;
  description: string | null;
  criteria: RubricCriterion[];
  total_points: number;
  is_system_default: boolean;
}

export interface GradingResult {
  rubric_scores: Record<string, number>;
  total_score: number;
  max_score: number;
  feedback: string;
}

export interface AutoGrade {
  id: string;
  student_id: string;
  week_number: number;
  day_number: number;
  rubric_id: string;
  rubric_scores: Record<string, number>;
  total_score: number;
  max_score: number;
  ai_feedback: string;
  graded_at: string;
  teacher_reviewed: boolean;
  teacher_adjusted_score: number | null;
  teacher_feedback: string | null;
  reviewed_at: string | null;
}

/**
 * Get the default system rubric
 */
export async function getDefaultRubric(): Promise<RubricTemplate | null> {
  try {
    const { data, error } = await supabase
      .from('rubric_templates')
      .select('*')
      .eq('is_system_default', true)
      .single();

    if (error) {
      console.error('Error fetching default rubric:', error);
      return null;
    }

    return data as RubricTemplate;
  } catch (err) {
    console.error('Error getting default rubric:', err);
    return null;
  }
}

/**
 * Grade a writing assignment using Claude AI
 */
export async function gradeWritingAssignment(
  response: string,
  prompt: string,
  rubric: RubricCriterion[]
): Promise<GradingResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('Anthropic API key not configured - using fallback grading');
    return fallbackGrading(response, rubric);
  }

  try {
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true // Allow browser usage for client-side grading
    });

    const maxPoints = rubric.reduce((sum, r) => sum + r.points, 0);
    const rubricText = rubric.map(r =>
      `${r.criterion} (${r.points} points): ${r.description}`
    ).join('\n');

    const gradingPrompt = `You are grading a high school financial literacy writing assignment.

ASSIGNMENT PROMPT:
${prompt}

STUDENT RESPONSE:
${response}

GRADING RUBRIC (Total: ${maxPoints} points):
${rubricText}

Grade this response according to the rubric. For each criterion, assign a score from 0 to the maximum points for that criterion. Be fair but encouraging - this is a learning exercise.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "scores": {
    "${rubric.map(r => r.criterion).join('": 0,\n    "')}"
  },
  "total": 0,
  "feedback": "Your feedback here - 2-3 sentences that are constructive and specific."
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: gradingPrompt
      }]
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse grading response:', responseText);
      return fallbackGrading(response, rubric);
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and clamp scores
    const validatedScores: Record<string, number> = {};
    let validatedTotal = 0;

    for (const criterion of rubric) {
      const score = result.scores[criterion.criterion] ?? 0;
      const clampedScore = Math.max(0, Math.min(criterion.points, Math.round(score)));
      validatedScores[criterion.criterion] = clampedScore;
      validatedTotal += clampedScore;
    }

    return {
      rubric_scores: validatedScores,
      total_score: validatedTotal,
      max_score: maxPoints,
      feedback: result.feedback || 'Good effort! Keep practicing your financial literacy skills.'
    };
  } catch (err) {
    console.error('Error grading with Claude:', err);
    return fallbackGrading(response, rubric);
  }
}

/**
 * Fallback grading when API is unavailable
 * Uses simple heuristics based on response length and keywords
 */
function fallbackGrading(response: string, rubric: RubricCriterion[]): GradingResult {
  const maxPoints = rubric.reduce((sum, r) => sum + r.points, 0);
  const wordCount = response.trim().split(/\s+/).length;
  const charCount = response.length;

  // Base score on length (minimum 200 chars required)
  let lengthScore = Math.min(1, charCount / 500); // Full credit at 500+ chars

  // Check for financial keywords
  const financialKeywords = [
    'budget', 'save', 'spend', 'money', 'income', 'expense', 'cost',
    'invest', 'bank', 'credit', 'debt', 'loan', 'interest', 'goal',
    'emergency', 'fund', 'account', 'financial', 'percent', 'dollar'
  ];
  const keywordMatches = financialKeywords.filter(kw =>
    response.toLowerCase().includes(kw)
  ).length;
  const keywordScore = Math.min(1, keywordMatches / 5); // Full credit at 5+ keywords

  // Calculate scores for each criterion
  const rubricScores: Record<string, number> = {};
  let totalScore = 0;

  for (const criterion of rubric) {
    let criterionScore: number;

    switch (criterion.criterion) {
      case 'Understanding of Concept':
        criterionScore = Math.round(criterion.points * keywordScore * 0.9);
        break;
      case 'Real-World Application':
        criterionScore = Math.round(criterion.points * lengthScore * 0.85);
        break;
      case 'Writing Quality':
        criterionScore = Math.round(criterion.points * (wordCount > 50 ? 0.8 : 0.6));
        break;
      case 'Completeness':
        criterionScore = Math.round(criterion.points * lengthScore * 0.85);
        break;
      default:
        criterionScore = Math.round(criterion.points * 0.7);
    }

    rubricScores[criterion.criterion] = criterionScore;
    totalScore += criterionScore;
  }

  return {
    rubric_scores: rubricScores,
    total_score: totalScore,
    max_score: maxPoints,
    feedback: `Your response shows effort in addressing the prompt. Consider adding more specific examples and connecting your ideas to real-world financial situations. Word count: ${wordCount}.`
  };
}

/**
 * Trigger auto-grading for a submitted writing assignment
 */
export async function triggerAutoGrading(
  studentId: string,
  weekNumber: number,
  dayNumber: number,
  responseText: string,
  activityQuestion: string
): Promise<AutoGrade | null> {
  try {
    // Get default rubric
    const rubric = await getDefaultRubric();
    if (!rubric) {
      console.error('No default rubric found');
      return null;
    }

    // Check if student's class has auto-grading enabled
    const { data: studentClass } = await supabase
      .from('teacher_students')
      .select('class_id, classes(auto_grading_enabled)')
      .eq('student_id', studentId)
      .single();

    // If student has a class and auto-grading is disabled, skip
    // The classes join returns an object with auto_grading_enabled
    const classSettings = studentClass?.classes as { auto_grading_enabled?: boolean } | null;
    if (classSettings && classSettings.auto_grading_enabled === false) {
      console.log('Auto-grading disabled for this class');
      return null;
    }

    // Grade the assignment
    const gradingResult = await gradeWritingAssignment(
      responseText,
      activityQuestion,
      rubric.criteria
    );

    // Save auto-grade to database
    const { data: autoGrade, error } = await supabase
      .from('auto_grades')
      .upsert({
        student_id: studentId,
        week_number: weekNumber,
        day_number: dayNumber,
        rubric_id: rubric.id,
        rubric_scores: gradingResult.rubric_scores,
        total_score: gradingResult.total_score,
        max_score: gradingResult.max_score,
        ai_feedback: gradingResult.feedback,
        graded_at: new Date().toISOString(),
        teacher_reviewed: false
      }, {
        onConflict: 'student_id,week_number,day_number'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving auto-grade:', error);
      // Try to save to localStorage as backup
      const gradeKey = `btg_auto_grade_${studentId}_${weekNumber}_${dayNumber}`;
      localStorage.setItem(gradeKey, JSON.stringify({
        ...gradingResult,
        graded_at: new Date().toISOString()
      }));
      return null;
    }

    console.log('Auto-grade saved successfully:', autoGrade);
    return autoGrade as AutoGrade;
  } catch (err) {
    console.error('Error in triggerAutoGrading:', err);
    return null;
  }
}

/**
 * Get auto-grade for a specific assignment
 */
export async function getAutoGrade(
  studentId: string,
  weekNumber: number,
  dayNumber: number
): Promise<AutoGrade | null> {
  try {
    const { data, error } = await supabase
      .from('auto_grades')
      .select('*')
      .eq('student_id', studentId)
      .eq('week_number', weekNumber)
      .eq('day_number', dayNumber)
      .single();

    if (error) {
      // Check localStorage backup
      const gradeKey = `btg_auto_grade_${studentId}_${weekNumber}_${dayNumber}`;
      const localGrade = localStorage.getItem(gradeKey);
      if (localGrade) {
        return JSON.parse(localGrade) as AutoGrade;
      }
      return null;
    }

    return data as AutoGrade;
  } catch (err) {
    console.error('Error getting auto-grade:', err);
    return null;
  }
}

/**
 * Get all auto-grades for a student
 */
export async function getStudentAutoGrades(studentId?: string): Promise<AutoGrade[]> {
  try {
    const user = studentId ? { id: studentId } : await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('auto_grades')
      .select('*')
      .eq('student_id', user.id)
      .order('week_number', { ascending: true })
      .order('day_number', { ascending: true });

    if (error) {
      console.error('Error fetching auto-grades:', error);
      return [];
    }

    return (data || []) as AutoGrade[];
  } catch (err) {
    console.error('Error getting student auto-grades:', err);
    return [];
  }
}

/**
 * Teacher: Review and adjust auto-grade
 */
export async function reviewAutoGrade(
  autoGradeId: string,
  adjustedScore?: number,
  feedback?: string
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('auto_grades')
      .update({
        teacher_reviewed: true,
        teacher_adjusted_score: adjustedScore ?? null,
        teacher_feedback: feedback ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', autoGradeId);

    if (error) {
      console.error('Error reviewing auto-grade:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in reviewAutoGrade:', err);
    return false;
  }
}

/**
 * Get all auto-grades for teacher's students
 */
export async function getTeacherAutoGrades(): Promise<Array<AutoGrade & { student_email?: string; student_name?: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Get all students assigned to this teacher
    const { data: students } = await supabase
      .from('teacher_students')
      .select('student_id')
      .eq('teacher_id', user.id);

    if (!students || students.length === 0) {
      return [];
    }

    const studentIds = students.map(s => s.student_id);

    // Get auto-grades for those students
    const { data: grades, error } = await supabase
      .from('auto_grades')
      .select('*')
      .in('student_id', studentIds)
      .order('graded_at', { ascending: false });

    if (error) {
      console.error('Error fetching teacher auto-grades:', error);
      return [];
    }

    // Get student info
    const { data: users } = await supabase
      .from('users')
      .select('id, email, display_name')
      .in('id', studentIds);

    const userMap = new Map(users?.map(u => [u.id, u]) || []);

    return (grades || []).map(grade => ({
      ...grade,
      student_email: userMap.get(grade.student_id)?.email,
      student_name: userMap.get(grade.student_id)?.display_name
    })) as Array<AutoGrade & { student_email?: string; student_name?: string }>;
  } catch (err) {
    console.error('Error getting teacher auto-grades:', err);
    return [];
  }
}
