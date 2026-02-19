// Basic content types
export interface Article {
    title: string;
    content: string;
}

export interface LessonSection {
    title: string;
    type: 'video' | 'reading' | 'interactive';
    duration: string;
    videoUrl?: string;
    content: string;
    keyPoints?: string[];
    articles?: Article[];
    activityQuestion?: string;
}

export interface LessonContent {
    title: string;
    sections: LessonSection[];
}

export interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export type DeepWidenStrings<T> = {
    [K in keyof T]: T[K] extends string ? string : DeepWidenStrings<T[K]>
};
