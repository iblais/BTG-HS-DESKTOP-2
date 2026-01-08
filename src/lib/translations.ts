/**
 * Translation System for BTG Platform
 * Supports English and Spanish with persistence
 */

import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export type Language = 'en' | 'es';

// Local storage key
const LANGUAGE_KEY = 'btg_language';

// ============================================
// TRANSLATION DATA
// ============================================

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.courses': 'Courses',
    'nav.games': 'Games',
    'nav.profile': 'Profile',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.progress': 'Your Progress',
    'dashboard.continue': 'Continue Learning',
    'dashboard.streakDays': 'Day Streak',
    'dashboard.totalXP': 'Total XP',
    'dashboard.level': 'Level',
    'dashboard.weeksCompleted': 'Weeks Completed',

    // Courses
    'courses.title': 'Your Learning Program',
    'courses.highSchool': 'High School',
    'courses.college': 'College',
    'courses.track': 'Track',
    'courses.week': 'Week',
    'courses.weeks': 'Weeks',
    'courses.complete': 'Complete',
    'courses.inProgress': 'In Progress',
    'courses.locked': 'Locked',
    'courses.ready': 'Ready',
    'courses.lessons': 'lessons',
    'courses.startLesson': 'Start Lesson',
    'courses.continueLesson': 'Continue Lesson',
    'courses.takeQuiz': 'Take Quiz',
    'courses.fridayQuiz': 'Friday Quiz',
    'courses.completeDays': 'Complete Days 1-4',
    'courses.finalExam': 'Final Certification Exam',
    'courses.finalExamDesc': '50 questions covering all course material - 70% to pass',
    'courses.earnCertificate': 'Earn your',
    'courses.certificate': 'Financial Literacy Certificate',

    // Lessons
    'lesson.back': 'Back',
    'lesson.next': 'Next Section',
    'lesson.complete': 'Complete Lesson',
    'lesson.keyPoints': 'Key Points',
    'lesson.section': 'Section',

    // Quiz
    'quiz.title': 'Quiz Time!',
    'quiz.questions': 'multiple choice questions',
    'quiz.timeLimit': 'minute time limit',
    'quiz.passingScore': 'required to pass',
    'quiz.unlimitedRetakes': 'Unlimited retakes allowed',
    'quiz.start': 'Start Quiz',
    'quiz.submit': 'Submit',
    'quiz.next': 'Next',
    'quiz.previous': 'Previous',
    'quiz.congratulations': 'Congratulations!',
    'quiz.keepTrying': 'Keep Trying!',
    'quiz.score': 'Score',
    'quiz.passed': 'You passed!',
    'quiz.failed': 'Not quite there yet',
    'quiz.retake': 'Retake Quiz',
    'quiz.continue': 'Continue',
    'quiz.timeUp': 'Time\'s Up!',

    // Assignments
    'assignment.title': 'Assignment',
    'assignment.yourTask': 'Your Task',
    'assignment.yourResponse': 'Your Response',
    'assignment.submit': 'Submit Assignment',
    'assignment.grading': 'Grading...',
    'assignment.graded': 'Assignment Graded',
    'assignment.fullCredit': 'Full Credit',
    'assignment.halfCredit': 'Half Credit',
    'assignment.needsImprovement': 'Needs Improvement',
    'assignment.feedback': 'Feedback',
    'assignment.tryAgain': 'Try Again',
    'assignment.done': 'Done',
    'assignment.attempt': 'Attempt',
    'assignment.tips': 'Tips for full credit: Include specific examples, explain your reasoning, and connect concepts to real-life situations.',
    'assignment.tooShort': 'Your response is too short. Please write at least 10 words.',
    'assignment.writeResponse': 'Please write a response before submitting.',

    // Profile
    'profile.title': 'Profile',
    'profile.editProfile': 'Edit Profile',
    'profile.accountSettings': 'Account Settings',
    'profile.notifications': 'Notifications',
    'profile.privacy': 'Privacy & Security',
    'profile.downloadData': 'Download Data',
    'profile.clearCache': 'Clear Cache',
    'profile.resetOnboarding': 'Reset Onboarding',
    'profile.signOut': 'Sign Out',
    'profile.joined': 'Joined',
    'profile.program': 'Program',
    'profile.difficulty': 'Difficulty Level',
    'profile.language': 'Language',

    // Settings
    'settings.account': 'Account',
    'settings.data': 'Data',
    'settings.profileDesc': 'Profile, password, and security',
    'settings.notificationsDesc': 'Manage notification preferences',
    'settings.privacyDesc': 'Password and security settings',
    'settings.downloadDesc': 'Export your progress and data',
    'settings.cacheDesc': 'Clear offline data cache',
    'settings.resetDesc': 'Start fresh with program selection',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',

    // Program Selection
    'program.welcome': 'Welcome to',
    'program.yourJourney': 'Your Journey',
    'program.selectProgram': 'Select Your Program',
    'program.chooseLevel': 'Choose Your Level',
    'program.languagePreference': 'Language Preference',
    'program.startLearning': 'Start Learning',
    'program.changeLater': 'You can change your program later in settings',
    'program.beginner': 'Beginner',
    'program.beginnerDesc': 'New to financial concepts',
    'program.intermediate': 'Intermediate',
    'program.intermediateDesc': 'Some prior knowledge',
    'program.advanced': 'Advanced',
    'program.advancedDesc': 'Ready for deep dives',
    'program.english': 'English',
    'program.spanish': 'Español',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
  },

  es: {
    // Navigation
    'nav.dashboard': 'Inicio',
    'nav.courses': 'Cursos',
    'nav.games': 'Juegos',
    'nav.profile': 'Perfil',

    // Dashboard
    'dashboard.welcome': 'Bienvenido de nuevo',
    'dashboard.progress': 'Tu Progreso',
    'dashboard.continue': 'Continuar Aprendiendo',
    'dashboard.streakDays': 'Días Seguidos',
    'dashboard.totalXP': 'XP Total',
    'dashboard.level': 'Nivel',
    'dashboard.weeksCompleted': 'Semanas Completadas',

    // Courses
    'courses.title': 'Tu Programa de Aprendizaje',
    'courses.highSchool': 'Preparatoria',
    'courses.college': 'Universidad',
    'courses.track': 'Nivel',
    'courses.week': 'Semana',
    'courses.weeks': 'Semanas',
    'courses.complete': 'Completado',
    'courses.inProgress': 'En Progreso',
    'courses.locked': 'Bloqueado',
    'courses.ready': 'Listo',
    'courses.lessons': 'lecciones',
    'courses.startLesson': 'Iniciar Lección',
    'courses.continueLesson': 'Continuar Lección',
    'courses.takeQuiz': 'Tomar Examen',
    'courses.fridayQuiz': 'Examen de Viernes',
    'courses.completeDays': 'Completa los Días 1-4',
    'courses.finalExam': 'Examen Final de Certificación',
    'courses.finalExamDesc': '50 preguntas que cubren todo el material - 70% para aprobar',
    'courses.earnCertificate': 'Obtén tu',
    'courses.certificate': 'Certificado de Educación Financiera',

    // Lessons
    'lesson.back': 'Atrás',
    'lesson.next': 'Siguiente Sección',
    'lesson.complete': 'Completar Lección',
    'lesson.keyPoints': 'Puntos Clave',
    'lesson.section': 'Sección',

    // Quiz
    'quiz.title': '¡Hora del Examen!',
    'quiz.questions': 'preguntas de opción múltiple',
    'quiz.timeLimit': 'minutos de límite de tiempo',
    'quiz.passingScore': 'requerido para aprobar',
    'quiz.unlimitedRetakes': 'Reintentos ilimitados permitidos',
    'quiz.start': 'Iniciar Examen',
    'quiz.submit': 'Enviar',
    'quiz.next': 'Siguiente',
    'quiz.previous': 'Anterior',
    'quiz.congratulations': '¡Felicidades!',
    'quiz.keepTrying': '¡Sigue Intentando!',
    'quiz.score': 'Puntuación',
    'quiz.passed': '¡Aprobaste!',
    'quiz.failed': 'Todavía no lo lograste',
    'quiz.retake': 'Reintentar Examen',
    'quiz.continue': 'Continuar',
    'quiz.timeUp': '¡Se Acabó el Tiempo!',

    // Assignments
    'assignment.title': 'Tarea',
    'assignment.yourTask': 'Tu Tarea',
    'assignment.yourResponse': 'Tu Respuesta',
    'assignment.submit': 'Enviar Tarea',
    'assignment.grading': 'Calificando...',
    'assignment.graded': 'Tarea Calificada',
    'assignment.fullCredit': 'Crédito Completo',
    'assignment.halfCredit': 'Crédito Parcial',
    'assignment.needsImprovement': 'Necesita Mejora',
    'assignment.feedback': 'Comentarios',
    'assignment.tryAgain': 'Intentar de Nuevo',
    'assignment.done': 'Listo',
    'assignment.attempt': 'Intento',
    'assignment.tips': 'Consejos para crédito completo: Incluye ejemplos específicos, explica tu razonamiento y conecta conceptos con situaciones de la vida real.',
    'assignment.tooShort': 'Tu respuesta es muy corta. Por favor escribe al menos 10 palabras.',
    'assignment.writeResponse': 'Por favor escribe una respuesta antes de enviar.',

    // Profile
    'profile.title': 'Perfil',
    'profile.editProfile': 'Editar Perfil',
    'profile.accountSettings': 'Configuración de Cuenta',
    'profile.notifications': 'Notificaciones',
    'profile.privacy': 'Privacidad y Seguridad',
    'profile.downloadData': 'Descargar Datos',
    'profile.clearCache': 'Limpiar Caché',
    'profile.resetOnboarding': 'Reiniciar Registro',
    'profile.signOut': 'Cerrar Sesión',
    'profile.joined': 'Registrado',
    'profile.program': 'Programa',
    'profile.difficulty': 'Nivel de Dificultad',
    'profile.language': 'Idioma',

    // Settings
    'settings.account': 'Cuenta',
    'settings.data': 'Datos',
    'settings.profileDesc': 'Perfil, contraseña y seguridad',
    'settings.notificationsDesc': 'Administrar preferencias de notificaciones',
    'settings.privacyDesc': 'Configuración de contraseña y seguridad',
    'settings.downloadDesc': 'Exportar tu progreso y datos',
    'settings.cacheDesc': 'Limpiar datos de caché offline',
    'settings.resetDesc': 'Comenzar de nuevo con selección de programa',

    // Auth
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Registrarse',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.forgotPassword': '¿Olvidaste tu Contraseña?',
    'auth.noAccount': '¿No tienes una cuenta?',
    'auth.haveAccount': '¿Ya tienes una cuenta?',

    // Program Selection
    'program.welcome': 'Bienvenido a',
    'program.yourJourney': 'Tu Viaje',
    'program.selectProgram': 'Selecciona Tu Programa',
    'program.chooseLevel': 'Elige Tu Nivel',
    'program.languagePreference': 'Preferencia de Idioma',
    'program.startLearning': 'Comenzar a Aprender',
    'program.changeLater': 'Puedes cambiar tu programa más tarde en configuración',
    'program.beginner': 'Principiante',
    'program.beginnerDesc': 'Nuevo en conceptos financieros',
    'program.intermediate': 'Intermedio',
    'program.intermediateDesc': 'Algún conocimiento previo',
    'program.advanced': 'Avanzado',
    'program.advancedDesc': 'Listo para profundizar',
    'program.english': 'English',
    'program.spanish': 'Español',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.retry': 'Reintentar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.confirm': 'Confirmar',
    'common.close': 'Cerrar',
    'common.yes': 'Sí',
    'common.no': 'No',
  },
};

// ============================================
// LANGUAGE MANAGEMENT
// ============================================

/**
 * Get current language from localStorage
 */
export function getLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return 'en';
}

/**
 * Set language in localStorage
 */
export function setLanguage(language: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Persist language to database (for logged-in users)
 */
export async function persistLanguage(language: Language): Promise<void> {
  setLanguage(language);

  const user = await getCurrentUser();
  if (!user) return;

  try {
    // Update user_preferences table
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        language,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Also update enrollment if exists
    await supabase
      .from('enrollments')
      .update({ language })
      .eq('user_id', user.id);
  } catch (err) {
    console.warn('[Translations] Failed to persist language:', err);
  }
}

/**
 * Load language preference from database
 */
export async function loadLanguagePreference(): Promise<Language> {
  const user = await getCurrentUser();
  if (!user) {
    return getLanguage();
  }

  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('language')
      .eq('user_id', user.id)
      .single();

    if (data?.language === 'en' || data?.language === 'es') {
      setLanguage(data.language);
      return data.language;
    }
  } catch {
    // Use localStorage fallback
  }

  return getLanguage();
}

// ============================================
// TRANSLATION FUNCTION
// ============================================

/**
 * Get a translated string
 */
export function t(key: string, language?: Language): string {
  const lang = language || getLanguage();
  return translations[lang][key] || translations.en[key] || key;
}

/**
 * Get all translations for a language
 */
export function getTranslations(language?: Language): Record<string, string> {
  const lang = language || getLanguage();
  return translations[lang] || translations.en;
}

export default {
  getLanguage,
  setLanguage,
  persistLanguage,
  loadLanguagePreference,
  t,
  getTranslations,
};
