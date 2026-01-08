/**
 * Internationalization (i18n) System for BTG Platform
 * Supports English (en) and Spanish (es) translations
 *
 * Usage:
 *   import { useTranslation, t } from '@/lib/i18n';
 *
 *   // In components with hooks
 *   const { t, language, setLanguage } = useTranslation();
 *   <h1>{t('dashboard.welcome')}</h1>
 *
 *   // Outside components
 *   import { t } from '@/lib/i18n';
 *   console.log(t('common.loading'));
 */

import { createContext, useContext, useState, useEffect, type ReactNode, type JSX } from 'react';
import { supabase } from './supabase';
import { isFeatureEnabled } from './featureFlags';

// ============================================
// TYPES
// ============================================

export type Language = 'en' | 'es';

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = Record<string, TranslationValue>;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

// ============================================
// DEFAULT TRANSLATIONS
// ============================================

const defaultTranslations: Record<Language, Translations> = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Try again',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.continue': 'Continue',
    'common.complete': 'Complete',
    'common.start': 'Start',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.courses': 'Courses',
    'nav.games': 'Games',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign Out',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.weekProgress': 'Week {{week}} Progress',
    'dashboard.currentStreak': 'Current Streak',
    'dashboard.totalXP': 'Total XP',
    'dashboard.level': 'Level',
    'dashboard.continueLesson': 'Continue Lesson',
    'dashboard.startLesson': 'Start Lesson',

    // Courses
    'courses.title': 'Your Journey',
    'courses.week': 'Week {{number}}',
    'courses.day': 'Day {{number}}',
    'courses.module': 'Module {{number}}',
    'courses.progress': '{{percent}}% complete',
    'courses.takeQuiz': 'Take Quiz',
    'courses.fridayQuiz': 'Friday Quiz',
    'courses.completeDays': 'Complete Days 1-4',
    'courses.locked': 'Locked',
    'courses.completed': 'Completed',

    // Lessons
    'lesson.video': 'Video',
    'lesson.lesson': 'Lesson',
    'lesson.vocabulary': 'Vocabulary',
    'lesson.activity': 'Activity',
    'lesson.assignment': 'Assignment',
    'lesson.keyTakeaways': 'Key Takeaways',
    'lesson.learnMore': 'Learn More',
    'lesson.markComplete': 'Mark as Complete',
    'lesson.activityComplete': 'Activity Completed',

    // Assignment
    'assignment.prompt': 'Assignment',
    'assignment.yourResponse': 'Your Response',
    'assignment.placeholder': 'Type your response here...',
    'assignment.characters': '{{count}} characters',
    'assignment.submit': 'Submit',
    'assignment.fullCredit': 'Full Credit',
    'assignment.halfCredit': 'Half Credit',
    'assignment.noCredit': 'Needs Improvement',

    // Quiz
    'quiz.title': 'Weekly Quiz',
    'quiz.question': 'Question {{current}} of {{total}}',
    'quiz.timeRemaining': 'Time Remaining',
    'quiz.submit': 'Submit Answer',
    'quiz.nextQuestion': 'Next Question',
    'quiz.results': 'Quiz Results',
    'quiz.passed': 'Congratulations! You passed!',
    'quiz.failed': 'Keep practicing!',
    'quiz.score': 'Your Score: {{score}}%',
    'quiz.retake': 'Retake Quiz',

    // Profile
    'profile.title': 'Profile',
    'profile.editProfile': 'Edit Profile',
    'profile.accountSettings': 'Account Settings',
    'profile.changePhoto': 'Change Photo',
    'profile.displayName': 'Display Name',
    'profile.email': 'Email',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',

    // Program Select
    'program.title': 'Welcome to Your Journey',
    'program.subtitle': 'Choose your financial literacy program',
    'program.selectProgram': 'Select Your Program',
    'program.chooseLevel': 'Choose Your Level',
    'program.languagePreference': 'Language Preference',
    'program.beginner': 'Beginner',
    'program.advanced': 'Advanced',
    'program.beginnerDesc': 'New to financial concepts',
    'program.advancedDesc': 'Ready for deep dives',
    'program.startLearning': 'Start Learning',

    // Days
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',

    // Teacher
    'teacher.dashboard': 'Teacher Dashboard',
    'teacher.classes': 'Your Classes',
    'teacher.createClass': 'Create Class',
    'teacher.gradingQueue': 'Grading Queue',
    'teacher.students': 'Students',
    'teacher.analytics': 'Analytics',
    'teacher.joinCode': 'Join Code',
    'teacher.allCaughtUp': 'All Caught Up!',
    'teacher.noAssignments': 'No assignments waiting for review.',
  },

  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Algo salió mal',
    'common.retry': 'Intentar de nuevo',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.submit': 'Enviar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.continue': 'Continuar',
    'common.complete': 'Completar',
    'common.start': 'Comenzar',

    // Navigation
    'nav.dashboard': 'Panel',
    'nav.courses': 'Cursos',
    'nav.games': 'Juegos',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configuración',
    'nav.signOut': 'Cerrar Sesión',

    // Dashboard
    'dashboard.welcome': 'Bienvenido de nuevo',
    'dashboard.weekProgress': 'Progreso Semana {{week}}',
    'dashboard.currentStreak': 'Racha Actual',
    'dashboard.totalXP': 'XP Total',
    'dashboard.level': 'Nivel',
    'dashboard.continueLesson': 'Continuar Lección',
    'dashboard.startLesson': 'Comenzar Lección',

    // Courses
    'courses.title': 'Tu Viaje',
    'courses.week': 'Semana {{number}}',
    'courses.day': 'Día {{number}}',
    'courses.module': 'Módulo {{number}}',
    'courses.progress': '{{percent}}% completado',
    'courses.takeQuiz': 'Tomar Examen',
    'courses.fridayQuiz': 'Examen del Viernes',
    'courses.completeDays': 'Completa los Días 1-4',
    'courses.locked': 'Bloqueado',
    'courses.completed': 'Completado',

    // Lessons
    'lesson.video': 'Video',
    'lesson.lesson': 'Lección',
    'lesson.vocabulary': 'Vocabulario',
    'lesson.activity': 'Actividad',
    'lesson.assignment': 'Tarea',
    'lesson.keyTakeaways': 'Puntos Clave',
    'lesson.learnMore': 'Aprende Más',
    'lesson.markComplete': 'Marcar como Completado',
    'lesson.activityComplete': 'Actividad Completada',

    // Assignment
    'assignment.prompt': 'Tarea',
    'assignment.yourResponse': 'Tu Respuesta',
    'assignment.placeholder': 'Escribe tu respuesta aquí...',
    'assignment.characters': '{{count}} caracteres',
    'assignment.submit': 'Enviar',
    'assignment.fullCredit': 'Crédito Completo',
    'assignment.halfCredit': 'Crédito Parcial',
    'assignment.noCredit': 'Necesita Mejorar',

    // Quiz
    'quiz.title': 'Examen Semanal',
    'quiz.question': 'Pregunta {{current}} de {{total}}',
    'quiz.timeRemaining': 'Tiempo Restante',
    'quiz.submit': 'Enviar Respuesta',
    'quiz.nextQuestion': 'Siguiente Pregunta',
    'quiz.results': 'Resultados del Examen',
    'quiz.passed': '¡Felicitaciones! ¡Aprobaste!',
    'quiz.failed': '¡Sigue practicando!',
    'quiz.score': 'Tu Puntuación: {{score}}%',
    'quiz.retake': 'Repetir Examen',

    // Profile
    'profile.title': 'Perfil',
    'profile.editProfile': 'Editar Perfil',
    'profile.accountSettings': 'Configuración de Cuenta',
    'profile.changePhoto': 'Cambiar Foto',
    'profile.displayName': 'Nombre para Mostrar',
    'profile.email': 'Correo Electrónico',

    // Auth
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Registrarse',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.forgotPassword': '¿Olvidaste tu Contraseña?',
    'auth.noAccount': '¿No tienes una cuenta?',
    'auth.hasAccount': '¿Ya tienes una cuenta?',

    // Program Select
    'program.title': 'Bienvenido a Tu Viaje',
    'program.subtitle': 'Elige tu programa de educación financiera',
    'program.selectProgram': 'Selecciona Tu Programa',
    'program.chooseLevel': 'Elige Tu Nivel',
    'program.languagePreference': 'Preferencia de Idioma',
    'program.beginner': 'Principiante',
    'program.advanced': 'Avanzado',
    'program.beginnerDesc': 'Nuevo en conceptos financieros',
    'program.advancedDesc': 'Listo para profundizar',
    'program.startLearning': 'Comenzar a Aprender',

    // Days
    'day.monday': 'Lunes',
    'day.tuesday': 'Martes',
    'day.wednesday': 'Miércoles',
    'day.thursday': 'Jueves',
    'day.friday': 'Viernes',

    // Teacher
    'teacher.dashboard': 'Panel del Maestro',
    'teacher.classes': 'Tus Clases',
    'teacher.createClass': 'Crear Clase',
    'teacher.gradingQueue': 'Cola de Calificaciones',
    'teacher.students': 'Estudiantes',
    'teacher.analytics': 'Análisis',
    'teacher.joinCode': 'Código de Unión',
    'teacher.allCaughtUp': '¡Todo al día!',
    'teacher.noAssignments': 'No hay tareas esperando revisión.',
  },
};

// ============================================
// CONTEXT
// ============================================

const I18nContext = createContext<I18nContextType | null>(null);

// ============================================
// STORAGE
// ============================================

const LANGUAGE_STORAGE_KEY = 'btg_language';

function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'en' || stored === 'es') {
      return stored;
    }
  } catch {}

  // Detect from browser
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'es' ? 'es' : 'en';
}

function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {}
}

// ============================================
// TRANSLATION FUNCTIONS
// ============================================

let currentLanguage: Language = getStoredLanguage();
let translations: Translations = defaultTranslations[currentLanguage];
let dbTranslations: Map<string, string> = new Map();

/**
 * Translate a key with optional interpolation
 */
export function t(key: string, params?: Record<string, string | number>): string {
  // Check feature flag
  if (!isFeatureEnabled('spanishLanguage') && currentLanguage === 'es') {
    // Fall back to English if Spanish not enabled
    const enValue = getNestedValue(defaultTranslations.en, key);
    if (enValue && typeof enValue === 'string') {
      return interpolate(enValue, params);
    }
    return key;
  }

  // First check database translations (for content translations)
  if (dbTranslations.has(key)) {
    return interpolate(dbTranslations.get(key)!, params);
  }

  // Then check static translations
  const value = getNestedValue(translations, key);

  if (value && typeof value === 'string') {
    return interpolate(value, params);
  }

  // Fall back to key
  console.warn(`[i18n] Missing translation: ${key}`);
  return key;
}

function getNestedValue(obj: Translations, key: string): TranslationValue | undefined {
  // First try direct key lookup (flat keys like 'common.loading')
  if (typeof obj[key] === 'string') {
    return obj[key];
  }

  // Then try nested lookup
  const keys = key.split('.');
  let current: TranslationValue = obj;

  for (const k of keys) {
    if (typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }

  return current;
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

// ============================================
// DATABASE TRANSLATIONS
// ============================================

async function loadDbTranslations(lang: Language): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('translations')
      .select('key, value')
      .eq('language', lang);

    if (error) {
      console.warn('[i18n] Failed to load DB translations:', error);
      return;
    }

    dbTranslations.clear();
    (data || []).forEach((row: any) => {
      dbTranslations.set(row.key, row.value);
    });
  } catch (err) {
    console.warn('[i18n] Failed to load DB translations:', err);
  }
}

// ============================================
// PROVIDER COMPONENT
// ============================================

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps): JSX.Element {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initLanguage = async () => {
      setIsLoading(true);
      translations = defaultTranslations[language];
      currentLanguage = language;
      await loadDbTranslations(language);
      setIsLoading(false);
    };

    initLanguage();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setStoredLanguage(lang);
    setLanguageState(lang);
  };

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useTranslation(): I18nContextType {
  const context = useContext(I18nContext);

  if (!context) {
    // Provide fallback if used outside provider
    return {
      language: currentLanguage,
      setLanguage: (lang: Language) => {
        currentLanguage = lang;
        translations = defaultTranslations[lang];
        setStoredLanguage(lang);
      },
      t,
      isLoading: false,
    };
  }

  return context;
}

// ============================================
// EXPORTS
// ============================================

export { I18nContext };
export type { I18nContextType };
