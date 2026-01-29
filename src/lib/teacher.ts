import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// Types for teacher portal
export interface Teacher {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  school?: string;
  created_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  code?: string;
  grade_level?: string;
  created_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at?: string;
}

export interface StudentWithProgress {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  // Progress data
  weeks_completed: number;
  total_activities: number;
  average_quiz_score: number;
  last_active?: string;
}

export interface ActivityResponse {
  id: string;
  user_id: string;
  week_number: number;
  day_number: number;
  module_number: number;
  response_text: string;
  submitted_at: string;
  created_at: string;
  // Grade info (if graded)
  grade?: number;
  feedback?: string;
  graded_at?: string;
  graded_by?: string;
}

export interface GradingRubric {
  id: string;
  name: string;
  description?: string;
  criteria: RubricCriterion[];
  total_points: number;
  created_by?: string;
  created_at: string;
}

export interface RubricCriterion {
  name: string;
  description: string;
  max_points: number;
}

export interface AssignmentGrade {
  id: string;
  activity_response_id: string;
  teacher_id: string;
  student_id: string;
  week_number: number;
  day_number: number;
  grade: number;
  max_grade: number;
  feedback?: string;
  rubric_id?: string;
  rubric_scores?: Record<string, number>;
  graded_at: string;
}

export interface LessonStandard {
  week_number: number;
  lesson_number: number;
  standard_code: string;
  standard_description: string;
  category: string;
}

// California State Standards for Financial Literacy
export const CA_FINANCIAL_LITERACY_STANDARDS: LessonStandard[] = [
  // Week 1: Income, Expenses, Savings
  { week_number: 1, lesson_number: 1, standard_code: 'CA.HSS.12.1.1', standard_description: 'Understand sources of income including wages, salaries, and other earnings', category: 'Personal Finance' },
  { week_number: 1, lesson_number: 2, standard_code: 'CA.HSS.12.1.2', standard_description: 'Identify and categorize different types of expenses', category: 'Personal Finance' },
  { week_number: 1, lesson_number: 3, standard_code: 'CA.HSS.12.1.3', standard_description: 'Explain the importance of saving and strategies for saving money', category: 'Personal Finance' },
  { week_number: 1, lesson_number: 4, standard_code: 'CA.HSS.12.1.4', standard_description: 'Apply the concepts of income, expenses, and savings to personal financial planning', category: 'Personal Finance' },

  // Week 2: Budgeting
  { week_number: 2, lesson_number: 1, standard_code: 'CA.HSS.12.2.1', standard_description: 'Define budgeting and explain its importance in financial planning', category: 'Budgeting' },
  { week_number: 2, lesson_number: 2, standard_code: 'CA.HSS.12.2.2', standard_description: 'Create a personal budget using the 50/30/20 rule', category: 'Budgeting' },
  { week_number: 2, lesson_number: 3, standard_code: 'CA.HSS.12.2.3', standard_description: 'Track spending and adjust budget accordingly', category: 'Budgeting' },
  { week_number: 2, lesson_number: 4, standard_code: 'CA.HSS.12.2.4', standard_description: 'Use technology tools to manage personal finances', category: 'Budgeting' },

  // Week 3: Banking
  { week_number: 3, lesson_number: 1, standard_code: 'CA.HSS.12.3.1', standard_description: 'Compare different types of financial institutions', category: 'Banking' },
  { week_number: 3, lesson_number: 2, standard_code: 'CA.HSS.12.3.2', standard_description: 'Understand checking and savings accounts', category: 'Banking' },
  { week_number: 3, lesson_number: 3, standard_code: 'CA.HSS.12.3.3', standard_description: 'Evaluate fees and services of financial institutions', category: 'Banking' },
  { week_number: 3, lesson_number: 4, standard_code: 'CA.HSS.12.3.4', standard_description: 'Practice using banking services safely and securely', category: 'Banking' },

  // Week 4: Credit Basics
  { week_number: 4, lesson_number: 1, standard_code: 'CA.HSS.12.4.1', standard_description: 'Define credit and explain how it works', category: 'Credit' },
  { week_number: 4, lesson_number: 2, standard_code: 'CA.HSS.12.4.2', standard_description: 'Understand credit scores and factors that affect them', category: 'Credit' },
  { week_number: 4, lesson_number: 3, standard_code: 'CA.HSS.12.4.3', standard_description: 'Compare different types of credit products', category: 'Credit' },
  { week_number: 4, lesson_number: 4, standard_code: 'CA.HSS.12.4.4', standard_description: 'Analyze the costs and benefits of using credit', category: 'Credit' },

  // Week 5: Credit Cards
  { week_number: 5, lesson_number: 1, standard_code: 'CA.HSS.12.5.1', standard_description: 'Understand how credit cards work and their terms', category: 'Credit' },
  { week_number: 5, lesson_number: 2, standard_code: 'CA.HSS.12.5.2', standard_description: 'Calculate interest charges and minimum payments', category: 'Credit' },
  { week_number: 5, lesson_number: 3, standard_code: 'CA.HSS.12.5.3', standard_description: 'Develop responsible credit card usage habits', category: 'Credit' },
  { week_number: 5, lesson_number: 4, standard_code: 'CA.HSS.12.5.4', standard_description: 'Identify and avoid credit card debt traps', category: 'Credit' },

  // Week 6: Loans
  { week_number: 6, lesson_number: 1, standard_code: 'CA.HSS.12.6.1', standard_description: 'Understand different types of loans (personal, auto, student)', category: 'Loans' },
  { week_number: 6, lesson_number: 2, standard_code: 'CA.HSS.12.6.2', standard_description: 'Calculate loan payments and total interest costs', category: 'Loans' },
  { week_number: 6, lesson_number: 3, standard_code: 'CA.HSS.12.6.3', standard_description: 'Evaluate loan terms and compare offers', category: 'Loans' },
  { week_number: 6, lesson_number: 4, standard_code: 'CA.HSS.12.6.4', standard_description: 'Develop strategies for managing and paying off debt', category: 'Loans' },

  // Week 7: Investing Basics
  { week_number: 7, lesson_number: 1, standard_code: 'CA.HSS.12.7.1', standard_description: 'Define investing and explain the risk-return relationship', category: 'Investing' },
  { week_number: 7, lesson_number: 2, standard_code: 'CA.HSS.12.7.2', standard_description: 'Understand compound interest and time value of money', category: 'Investing' },
  { week_number: 7, lesson_number: 3, standard_code: 'CA.HSS.12.7.3', standard_description: 'Compare different investment vehicles (stocks, bonds, mutual funds)', category: 'Investing' },
  { week_number: 7, lesson_number: 4, standard_code: 'CA.HSS.12.7.4', standard_description: 'Explain the importance of diversification', category: 'Investing' },

  // Week 8: Stock Market
  { week_number: 8, lesson_number: 1, standard_code: 'CA.HSS.12.8.1', standard_description: 'Understand how the stock market works', category: 'Investing' },
  { week_number: 8, lesson_number: 2, standard_code: 'CA.HSS.12.8.2', standard_description: 'Analyze stock performance using basic metrics', category: 'Investing' },
  { week_number: 8, lesson_number: 3, standard_code: 'CA.HSS.12.8.3', standard_description: 'Understand market volatility and long-term investing', category: 'Investing' },
  { week_number: 8, lesson_number: 4, standard_code: 'CA.HSS.12.8.4', standard_description: 'Practice making informed investment decisions', category: 'Investing' },

  // Week 9: Retirement Planning
  { week_number: 9, lesson_number: 1, standard_code: 'CA.HSS.12.9.1', standard_description: 'Understand the importance of early retirement planning', category: 'Retirement' },
  { week_number: 9, lesson_number: 2, standard_code: 'CA.HSS.12.9.2', standard_description: 'Compare retirement account types (401k, IRA, Roth IRA)', category: 'Retirement' },
  { week_number: 9, lesson_number: 3, standard_code: 'CA.HSS.12.9.3', standard_description: 'Calculate retirement savings goals', category: 'Retirement' },
  { week_number: 9, lesson_number: 4, standard_code: 'CA.HSS.12.9.4', standard_description: 'Understand employer benefits and matching contributions', category: 'Retirement' },

  // Week 10: Insurance
  { week_number: 10, lesson_number: 1, standard_code: 'CA.HSS.12.10.1', standard_description: 'Understand the purpose and types of insurance', category: 'Insurance' },
  { week_number: 10, lesson_number: 2, standard_code: 'CA.HSS.12.10.2', standard_description: 'Evaluate health insurance options and coverage', category: 'Insurance' },
  { week_number: 10, lesson_number: 3, standard_code: 'CA.HSS.12.10.3', standard_description: 'Understand auto and renters insurance', category: 'Insurance' },
  { week_number: 10, lesson_number: 4, standard_code: 'CA.HSS.12.10.4', standard_description: 'Calculate insurance needs and compare policies', category: 'Insurance' },

  // Week 11: Taxes
  { week_number: 11, lesson_number: 1, standard_code: 'CA.HSS.12.11.1', standard_description: 'Understand the U.S. tax system and types of taxes', category: 'Taxes' },
  { week_number: 11, lesson_number: 2, standard_code: 'CA.HSS.12.11.2', standard_description: 'Read and understand a W-2 form and pay stub', category: 'Taxes' },
  { week_number: 11, lesson_number: 3, standard_code: 'CA.HSS.12.11.3', standard_description: 'File a basic tax return', category: 'Taxes' },
  { week_number: 11, lesson_number: 4, standard_code: 'CA.HSS.12.11.4', standard_description: 'Understand tax deductions and credits', category: 'Taxes' },

  // Week 12: Consumer Protection
  { week_number: 12, lesson_number: 1, standard_code: 'CA.HSS.12.12.1', standard_description: 'Identify consumer rights and protections', category: 'Consumer Protection' },
  { week_number: 12, lesson_number: 2, standard_code: 'CA.HSS.12.12.2', standard_description: 'Recognize and avoid financial scams and fraud', category: 'Consumer Protection' },
  { week_number: 12, lesson_number: 3, standard_code: 'CA.HSS.12.12.3', standard_description: 'Protect personal financial information', category: 'Consumer Protection' },
  { week_number: 12, lesson_number: 4, standard_code: 'CA.HSS.12.12.4', standard_description: 'Understand dispute resolution processes', category: 'Consumer Protection' },

  // Week 13: Housing
  { week_number: 13, lesson_number: 1, standard_code: 'CA.HSS.12.13.1', standard_description: 'Compare renting vs. buying a home', category: 'Housing' },
  { week_number: 13, lesson_number: 2, standard_code: 'CA.HSS.12.13.2', standard_description: 'Understand lease agreements and tenant rights', category: 'Housing' },
  { week_number: 13, lesson_number: 3, standard_code: 'CA.HSS.12.13.3', standard_description: 'Calculate housing affordability', category: 'Housing' },
  { week_number: 13, lesson_number: 4, standard_code: 'CA.HSS.12.13.4', standard_description: 'Understand mortgages and the home buying process', category: 'Housing' },

  // Week 14: Career & Income
  { week_number: 14, lesson_number: 1, standard_code: 'CA.HSS.12.14.1', standard_description: 'Explore career options and earning potential', category: 'Career' },
  { week_number: 14, lesson_number: 2, standard_code: 'CA.HSS.12.14.2', standard_description: 'Understand employee benefits and compensation packages', category: 'Career' },
  { week_number: 14, lesson_number: 3, standard_code: 'CA.HSS.12.14.3', standard_description: 'Negotiate salary and benefits', category: 'Career' },
  { week_number: 14, lesson_number: 4, standard_code: 'CA.HSS.12.14.4', standard_description: 'Plan for career advancement and income growth', category: 'Career' },

  // Week 15: Entrepreneurship
  { week_number: 15, lesson_number: 1, standard_code: 'CA.HSS.12.15.1', standard_description: 'Understand entrepreneurship and business ownership', category: 'Entrepreneurship' },
  { week_number: 15, lesson_number: 2, standard_code: 'CA.HSS.12.15.2', standard_description: 'Develop a basic business plan', category: 'Entrepreneurship' },
  { week_number: 15, lesson_number: 3, standard_code: 'CA.HSS.12.15.3', standard_description: 'Understand startup costs and funding options', category: 'Entrepreneurship' },
  { week_number: 15, lesson_number: 4, standard_code: 'CA.HSS.12.15.4', standard_description: 'Manage business finances and cash flow', category: 'Entrepreneurship' },

  // Week 16: Financial Goals
  { week_number: 16, lesson_number: 1, standard_code: 'CA.HSS.12.16.1', standard_description: 'Set SMART financial goals', category: 'Financial Planning' },
  { week_number: 16, lesson_number: 2, standard_code: 'CA.HSS.12.16.2', standard_description: 'Create short-term and long-term financial plans', category: 'Financial Planning' },
  { week_number: 16, lesson_number: 3, standard_code: 'CA.HSS.12.16.3', standard_description: 'Track progress toward financial goals', category: 'Financial Planning' },
  { week_number: 16, lesson_number: 4, standard_code: 'CA.HSS.12.16.4', standard_description: 'Adjust financial plans based on life changes', category: 'Financial Planning' },

  // Week 17: Financial Decision Making
  { week_number: 17, lesson_number: 1, standard_code: 'CA.HSS.12.17.1', standard_description: 'Apply decision-making frameworks to financial choices', category: 'Decision Making' },
  { week_number: 17, lesson_number: 2, standard_code: 'CA.HSS.12.17.2', standard_description: 'Evaluate opportunity costs and trade-offs', category: 'Decision Making' },
  { week_number: 17, lesson_number: 3, standard_code: 'CA.HSS.12.17.3', standard_description: 'Avoid emotional and impulsive financial decisions', category: 'Decision Making' },
  { week_number: 17, lesson_number: 4, standard_code: 'CA.HSS.12.17.4', standard_description: 'Seek professional financial advice when needed', category: 'Decision Making' },

  // Week 18: Building Wealth
  { week_number: 18, lesson_number: 1, standard_code: 'CA.HSS.12.18.1', standard_description: 'Understand wealth building strategies', category: 'Wealth Building' },
  { week_number: 18, lesson_number: 2, standard_code: 'CA.HSS.12.18.2', standard_description: 'Develop multiple income streams', category: 'Wealth Building' },
  { week_number: 18, lesson_number: 3, standard_code: 'CA.HSS.12.18.3', standard_description: 'Understand generational wealth and legacy planning', category: 'Wealth Building' },
  { week_number: 18, lesson_number: 4, standard_code: 'CA.HSS.12.18.4', standard_description: 'Create a comprehensive personal financial plan', category: 'Wealth Building' },
];

// Default grading rubric for writing assignments
export const DEFAULT_WRITING_RUBRIC: GradingRubric = {
  id: 'default-writing-rubric',
  name: 'Writing Assignment Rubric',
  description: 'Standard rubric for grading weekly writing assignments',
  total_points: 100,
  created_at: new Date().toISOString(),
  criteria: [
    {
      name: 'Understanding of Concept',
      description: 'Demonstrates clear understanding of the financial concept being discussed',
      max_points: 30,
    },
    {
      name: 'Real-World Application',
      description: 'Effectively connects concepts to real-world scenarios and personal experiences',
      max_points: 25,
    },
    {
      name: 'Critical Thinking',
      description: 'Shows analysis, evaluation, and original thinking about the topic',
      max_points: 20,
    },
    {
      name: 'Writing Quality',
      description: 'Clear, organized writing with proper grammar and structure',
      max_points: 15,
    },
    {
      name: 'Completeness',
      description: 'Addresses all parts of the prompt with sufficient detail',
      max_points: 10,
    },
  ],
};

// Check if current user is a teacher
export async function isTeacher(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    // Check for teacher emails (hardcoded for now - can be moved to env or database)
    const teacherEmails = [
      'itsblais@gmail.com',
      'creditchampionz@gmail.com',
    ];
    if (teacherEmails.includes(user.email.toLowerCase())) {
      return true;
    }

    // Check user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role === 'teacher') return true;

    // Also check profiles table for role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profileData?.role === 'teacher';
  } catch {
    return false;
  }
}

// Get teacher's classes
export async function getTeacherClasses(): Promise<Class[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // First get teacher record
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!teacherData) return [];

    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherData.id)
      .order('created_at', { ascending: false });

    return classes || [];
  } catch (err) {
    console.error('Failed to get teacher classes:', err);
    return [];
  }
}

// Get students in a class
export async function getClassStudents(classId: string): Promise<StudentWithProgress[]> {
  try {
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', classId);

    if (!enrollments || enrollments.length === 0) return [];

    const studentIds = enrollments.map(e => e.student_id);

    // Get student profiles
    const { data: students } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url, created_at, last_active')
      .in('id', studentIds);

    if (!students) return [];

    // Get progress data for each student
    const studentsWithProgress: StudentWithProgress[] = await Promise.all(
      students.map(async (student) => {
        // Get course progress
        const { data: progress } = await supabase
          .from('course_progress')
          .select('week_number, quiz_completed, best_quiz_score')
          .eq('user_id', student.id);

        // Get activity count
        const { data: activities } = await supabase
          .from('activity_responses')
          .select('id')
          .eq('user_id', student.id);

        const weeksCompleted = progress?.filter(p => p.quiz_completed).length || 0;
        const totalActivities = activities?.length || 0;
        const quizScores = progress?.filter(p => p.best_quiz_score !== null).map(p => p.best_quiz_score) || [];
        const averageQuizScore = quizScores.length > 0
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : 0;

        return {
          id: student.id,
          email: student.email,
          display_name: student.display_name,
          avatar_url: student.avatar_url,
          created_at: student.created_at,
          weeks_completed: weeksCompleted,
          total_activities: totalActivities,
          average_quiz_score: averageQuizScore,
          last_active: student.last_active,
        };
      })
    );

    return studentsWithProgress;
  } catch (err) {
    console.error('Failed to get class students:', err);
    return [];
  }
}

// Get all students for a teacher (all users in the system)
export async function getAllTeacherStudents(): Promise<StudentWithProgress[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('[Teacher] No current user found');
      return [];
    }

    console.log('[Teacher] Current user:', currentUser.email, currentUser.id);

    // First check if there are ANY users at all (including self)
    const { data: allUsers, error: countError } = await supabase
      .from('users')
      .select('id, email')
      .limit(100);

    console.log('[Teacher] Total users in database:', allUsers?.length || 0, countError?.message || 'no error');
    if (allUsers) {
      console.log('[Teacher] User list:', allUsers.map(u => u.email));
    }

    // Get ALL users from the database (except the current teacher)
    const { data: students, error } = await supabase
      .from('users')
      .select('id, email, display_name, avatar_url, created_at')
      .neq('id', currentUser.id)
      .order('created_at', { ascending: false });

    console.log('[Teacher] Students (excluding self):', students?.length || 0, error?.message || 'no error');

    if (error) {
      console.error('[Teacher] Error fetching users:', error);
      return [];
    }

    if (!students || students.length === 0) {
      console.log('[Teacher] No students found in database');
      return [];
    }

    // Get progress data for each student
    const studentsWithProgress: StudentWithProgress[] = await Promise.all(
      students.map(async (student) => {
        // Get course progress
        const { data: progress } = await supabase
          .from('course_progress')
          .select('week_number, quiz_completed, best_quiz_score')
          .eq('user_id', student.id);

        // Get activity count
        const { data: activities } = await supabase
          .from('activity_responses')
          .select('id')
          .eq('user_id', student.id);

        const weeksCompleted = progress?.filter(p => p.quiz_completed).length || 0;
        const totalActivities = activities?.length || 0;
        const quizScores = progress?.filter(p => p.best_quiz_score !== null).map(p => p.best_quiz_score) || [];
        const averageQuizScore = quizScores.length > 0
          ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
          : 0;

        return {
          id: student.id,
          email: student.email,
          display_name: student.display_name,
          avatar_url: student.avatar_url,
          created_at: student.created_at,
          weeks_completed: weeksCompleted,
          total_activities: totalActivities,
          average_quiz_score: averageQuizScore,
        };
      })
    );

    return studentsWithProgress;
  } catch (err) {
    console.error('Failed to get all teacher students:', err);
    return [];
  }
}

// Get student's activity responses
export async function getStudentActivities(studentId: string): Promise<ActivityResponse[]> {
  try {
    const { data } = await supabase
      .from('activity_responses')
      .select('*')
      .eq('user_id', studentId)
      .order('week_number', { ascending: true })
      .order('day_number', { ascending: true });

    return data || [];
  } catch (err) {
    console.error('Failed to get student activities:', err);
    return [];
  }
}

// Get student's quiz scores
export async function getStudentQuizScores(studentId: string): Promise<{ week_number: number; score: number; passed: boolean }[]> {
  try {
    const { data } = await supabase
      .from('course_progress')
      .select('week_number, best_quiz_score, quiz_completed')
      .eq('user_id', studentId)
      .not('best_quiz_score', 'is', null)
      .order('week_number', { ascending: true });

    return (data || []).map(d => ({
      week_number: d.week_number,
      score: d.best_quiz_score || 0,
      passed: d.quiz_completed || false,
    }));
  } catch (err) {
    console.error('Failed to get student quiz scores:', err);
    return [];
  }
}

// Grade an activity response
export async function gradeActivity(
  activityResponseId: string,
  studentId: string,
  weekNumber: number,
  dayNumber: number,
  grade: number,
  maxGrade: number,
  feedback?: string,
  rubricId?: string,
  rubricScores?: Record<string, number>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('[Teacher] gradeActivity: Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }

    console.log('[Teacher] Saving grade:', {
      activityResponseId,
      studentId,
      teacherId: user.id,
      teacherEmail: user.email,
      weekNumber,
      dayNumber,
      grade,
      maxGrade
    });

    // Store grade in activity_grades table
    const gradeData = {
      activity_response_id: activityResponseId || null,
      student_id: studentId,
      teacher_id: user.id,
      week_number: weekNumber,
      day_number: dayNumber,
      grade: grade,
      max_grade: maxGrade,
      feedback: feedback || null,
      rubric_id: rubricId || null,
      rubric_scores: rubricScores || null,
      graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[Teacher] Grade data to insert:', JSON.stringify(gradeData, null, 2));

    const { data, error } = await supabase
      .from('activity_grades')
      .upsert(gradeData, {
        onConflict: 'student_id,week_number,day_number',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('[Teacher] Supabase grade error:', error.message, error.details, error.hint, error.code);
      // Store locally as backup
      const gradeKey = `btg_grade_${studentId}_${weekNumber}_${dayNumber}`;
      localStorage.setItem(gradeKey, JSON.stringify({
        grade,
        maxGrade,
        feedback,
        rubricId,
        rubricScores,
        gradedAt: new Date().toISOString(),
        gradedBy: user.id,
      }));
      console.log('[Teacher] Saved to localStorage as backup');
      return { success: true }; // Still return success since we saved locally
    }

    console.log('[Teacher] Grade saved successfully to database:', data);

    // Also save to localStorage as cache
    const gradeKey = `btg_grade_${studentId}_${weekNumber}_${dayNumber}`;
    localStorage.setItem(gradeKey, JSON.stringify({
      grade,
      maxGrade,
      feedback,
      rubricId,
      rubricScores,
      gradedAt: new Date().toISOString(),
      gradedBy: user.id,
    }));

    return { success: true };
  } catch (err) {
    console.error('[Teacher] Failed to grade activity:', err);
    return { success: false, error: 'Failed to save grade' };
  }
}

// Get grade for an activity
export async function getActivityGrade(
  studentId: string,
  weekNumber: number,
  dayNumber: number
): Promise<AssignmentGrade | null> {
  try {
    // Query the database first
    const { data, error } = await supabase
      .from('activity_grades')
      .select('*')
      .eq('student_id', studentId)
      .eq('week_number', weekNumber)
      .eq('day_number', dayNumber)
      .single();

    if (data && !error) {
      console.log('[Teacher] Found grade in database:', data);
      return {
        id: data.id,
        activity_response_id: data.activity_response_id || '',
        teacher_id: data.teacher_id,
        student_id: data.student_id,
        week_number: data.week_number,
        day_number: data.day_number,
        grade: data.grade,
        max_grade: data.max_grade,
        feedback: data.feedback,
        rubric_id: data.rubric_id,
        rubric_scores: data.rubric_scores,
        graded_at: data.graded_at,
      };
    }

    // Fall back to localStorage if not in database
    const gradeKey = `btg_grade_${studentId}_${weekNumber}_${dayNumber}`;
    const localGrade = localStorage.getItem(gradeKey);

    if (localGrade) {
      try {
        const parsed = JSON.parse(localGrade);
        console.log('[Teacher] Found grade in localStorage:', parsed);
        return {
          id: `local-${gradeKey}`,
          activity_response_id: '',
          teacher_id: parsed.gradedBy,
          student_id: studentId,
          week_number: weekNumber,
          day_number: dayNumber,
          grade: parsed.grade,
          max_grade: parsed.maxGrade,
          feedback: parsed.feedback,
          rubric_id: parsed.rubricId,
          rubric_scores: parsed.rubricScores,
          graded_at: parsed.gradedAt,
        };
      } catch {
        // Invalid local data
      }
    }

    return null;
  } catch (err) {
    console.error('[Teacher] Error fetching grade:', err);

    // Fall back to localStorage on error
    const gradeKey = `btg_grade_${studentId}_${weekNumber}_${dayNumber}`;
    const localGrade = localStorage.getItem(gradeKey);

    if (localGrade) {
      try {
        const parsed = JSON.parse(localGrade);
        return {
          id: `local-${gradeKey}`,
          activity_response_id: '',
          teacher_id: parsed.gradedBy,
          student_id: studentId,
          week_number: weekNumber,
          day_number: dayNumber,
          grade: parsed.grade,
          max_grade: parsed.maxGrade,
          feedback: parsed.feedback,
          rubric_id: parsed.rubricId,
          rubric_scores: parsed.rubricScores,
          graded_at: parsed.gradedAt,
        };
      } catch {
        // Invalid local data
      }
    }

    return null;
  }
}

// Get all grades (for efficient batch checking)
export async function getAllGrades(): Promise<Map<string, AssignmentGrade>> {
  const gradesMap = new Map<string, AssignmentGrade>();

  try {
    // Query all grades from database
    const { data, error } = await supabase
      .from('activity_grades')
      .select('*');

    if (data && !error) {
      data.forEach(grade => {
        const key = `${grade.student_id}-${grade.week_number}-${grade.day_number}`;
        gradesMap.set(key, {
          id: grade.id,
          activity_response_id: grade.activity_response_id || '',
          teacher_id: grade.teacher_id,
          student_id: grade.student_id,
          week_number: grade.week_number,
          day_number: grade.day_number,
          grade: grade.grade,
          max_grade: grade.max_grade,
          feedback: grade.feedback,
          rubric_id: grade.rubric_id,
          rubric_scores: grade.rubric_scores,
          graded_at: grade.graded_at,
        });
      });
    }
  } catch (err) {
    console.error('[Teacher] Error fetching all grades:', err);
  }

  // Also check localStorage for any grades not in database
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('btg_grade_')) {
      try {
        const localGrade = localStorage.getItem(key);
        if (localGrade) {
          const parsed = JSON.parse(localGrade);
          // Extract studentId, weekNumber, dayNumber from key
          const parts = key.replace('btg_grade_', '').split('_');
          if (parts.length >= 3) {
            const studentId = parts[0];
            const weekNumber = parseInt(parts[1]);
            const dayNumber = parseInt(parts[2]);
            const mapKey = `${studentId}-${weekNumber}-${dayNumber}`;

            // Only add if not already in map (database takes precedence)
            if (!gradesMap.has(mapKey)) {
              gradesMap.set(mapKey, {
                id: `local-${key}`,
                activity_response_id: '',
                teacher_id: parsed.gradedBy,
                student_id: studentId,
                week_number: weekNumber,
                day_number: dayNumber,
                grade: parsed.grade,
                max_grade: parsed.maxGrade,
                feedback: parsed.feedback,
                rubric_id: parsed.rubricId,
                rubric_scores: parsed.rubricScores,
                graded_at: parsed.gradedAt,
              });
            }
          }
        }
      } catch {
        // Invalid local data
      }
    }
  }

  return gradesMap;
}

// Create a new class
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createClass(name: string, _gradeLevel?: string): Promise<Class | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Get or create teacher record
    let { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!teacher) {
      const { data: newTeacher } = await supabase
        .from('teachers')
        .insert({ email: user.email })
        .select()
        .single();
      teacher = newTeacher;
    }

    if (!teacher) return null;

    // Create class
    const { data: newClass } = await supabase
      .from('classes')
      .insert({
        teacher_id: teacher.id,
        name,
      })
      .select()
      .single();

    return newClass;
  } catch (err) {
    console.error('Failed to create class:', err);
    return null;
  }
}

// Add student to class
export async function addStudentToClass(classId: string, studentEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find student by email
    const { data: student } = await supabase
      .from('users')
      .select('id')
      .eq('email', studentEmail)
      .single();

    if (!student) {
      return { success: false, error: 'Student not found' };
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', student.id)
      .single();

    if (existing) {
      return { success: false, error: 'Student already in class' };
    }

    // Add enrollment
    const { error } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: classId,
        student_id: student.id,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to add student to class:', err);
    return { success: false, error: 'Failed to add student' };
  }
}

// Get standards for a week
export function getWeekStandards(weekNumber: number): LessonStandard[] {
  return CA_FINANCIAL_LITERACY_STANDARDS.filter(s => s.week_number === weekNumber);
}

// Get all unique standard categories
export function getStandardCategories(): string[] {
  const categories = new Set(CA_FINANCIAL_LITERACY_STANDARDS.map(s => s.category));
  return Array.from(categories);
}

// Generate standards coverage report
export function generateStandardsCoverageReport(completedWeeks: number[]): {
  covered: LessonStandard[];
  notCovered: LessonStandard[];
  coveragePercent: number;
} {
  const covered = CA_FINANCIAL_LITERACY_STANDARDS.filter(s => completedWeeks.includes(s.week_number));
  const notCovered = CA_FINANCIAL_LITERACY_STANDARDS.filter(s => !completedWeeks.includes(s.week_number));
  const coveragePercent = Math.round((covered.length / CA_FINANCIAL_LITERACY_STANDARDS.length) * 100);

  return { covered, notCovered, coveragePercent };
}

// Week titles for reference
export const WEEK_TITLES: Record<number, string> = {
  1: 'Income, Expenses & Savings',
  2: 'Budgeting Basics',
  3: 'Banking Fundamentals',
  4: 'Credit Basics',
  5: 'Credit Cards',
  6: 'Loans & Debt',
  7: 'Investing Basics',
  8: 'Stock Market',
  9: 'Retirement Planning',
  10: 'Insurance',
  11: 'Taxes',
  12: 'Consumer Protection',
  13: 'Housing',
  14: 'Career & Income',
  15: 'Entrepreneurship',
  16: 'Financial Goals',
  17: 'Financial Decision Making',
  18: 'Building Wealth',
};
