# BTG Platform Architecture Specification v2.0
## Module Restructure - January 2026

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [New Course Structure](#2-new-course-structure)
3. [Data Model Changes](#3-data-model-changes)
4. [Screen Flow Architecture](#4-screen-flow-architecture)
5. [Module Component Design](#5-module-component-design)
6. [Quiz System Redesign](#6-quiz-system-redesign)
7. [Assignment & AI Grading System](#7-assignment--ai-grading-system)
8. [Teacher Dashboard & Reporting](#8-teacher-dashboard--reporting)
9. [Video System Architecture](#9-video-system-architecture)
10. [Language (i18n) System](#10-language-i18n-system)
11. [Platform Compatibility](#11-platform-compatibility)
12. [Migration Strategy](#12-migration-strategy)
13. [Feature Flags](#13-feature-flags)
14. [Implementation Phases](#14-implementation-phases)

---

## 1. Executive Summary

### 1.1 Overview
This document specifies the architectural changes required to restructure BTG from a variable-section weekly model to a standardized 5-day classroom-aligned structure.

### 1.2 Key Changes
| Aspect | Current | New |
|--------|---------|-----|
| Week Structure | 3-5 sections/week (variable) | 5 days × 4 modules = 20 modules/week |
| Track Levels | Beginner, Intermediate, Advanced | Beginner, Advanced only |
| Quiz Timing | Any day after lesson | Friday only (Day 5) |
| Quiz Scope | All week content | Previous 4 days (16 modules) |
| Assignments | None | 1 per module with AI grading |
| Teacher Features | None | Full dashboard + reporting |
| Video | Placeholder text | Video container with upload backend |

### 1.3 Design Principles
1. **Backward Compatibility**: Preserve all existing content
2. **Teacher-First UX**: Intuitive for busy educators
3. **Standards-Aligned**: 40-45 minute class periods
4. **Progressive Enhancement**: Feature flags for safe rollout

---

## 2. New Course Structure

### 2.1 Week Layout (5 Days)

```
WEEK N
├── Day 1 (Monday)
│   ├── Module 1 (~5 min each)
│   ├── Module 2
│   ├── Module 3
│   └── Module 4
├── Day 2 (Tuesday)
│   ├── Module 5
│   ├── Module 6
│   ├── Module 7
│   └── Module 8
├── Day 3 (Wednesday)
│   ├── Module 9
│   ├── Module 10
│   ├── Module 11
│   └── Module 12
├── Day 4 (Thursday)
│   ├── Module 13
│   ├── Module 14
│   ├── Module 15
│   └── Module 16
└── Day 5 (Friday)
    └── Weekly Quiz (10 questions from Days 1-4)
```

### 2.2 Daily Lesson Flow (40-45 minutes)

```
SINGLE DAY BREAKDOWN
├── Warm-Up (1 min)
│   └── "Think about this: What do you know about ___?"
├── Direct Instruction (10-12 min)
│   ├── Video lesson
│   ├── Teacher script
│   └── Vocabulary
├── Reading Time (10 min)
│   └── Short accessible article
├── Assignment (10 min)
│   └── Written response / worksheet
├── Activity (10 min)
│   ├── Diagram / picture notes
│   ├── Educational game
│   ├── Turn-and-talk
│   └── Small group work
└── Reflection
    ├── "What did you learn?"
    ├── "What do you still wonder?"
    └── "How does this apply to real life?"
```

### 2.3 Module Structure

Each module contains:
```
MODULE N
├── video_url (nullable - for future uploads)
├── intro_story (Mike's hook narrative)
├── lesson_content (micro-lesson text)
├── vocabulary[] (key terms)
├── activity (20-min class activity)
├── assignment (written response prompt)
├── references[] (2 school-safe links)
└── key_points[] (3-5 takeaways)
```

### 2.4 Program Duration

| Program | Total Weeks | Total Modules | Total Quizzes |
|---------|-------------|---------------|---------------|
| High School | 18 weeks | 288 modules (16/week × 18) | 18 quizzes |
| College | 16 weeks | 256 modules (16/week × 16) | 16 quizzes |

---

## 3. Data Model Changes

### 3.1 New Database Schema

#### 3.1.1 Programs Table (Modified)
```sql
-- No changes to programs table structure
-- Weeks count remains 18 (HS) and 16 (College)
```

#### 3.1.2 Enrollments Table (Modified)
```sql
ALTER TABLE enrollments
  DROP CONSTRAINT IF EXISTS enrollments_track_level_check;

ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_track_level_check
  CHECK (track_level IN ('beginner', 'advanced'));

-- Migration: UPDATE enrollments SET track_level = 'beginner' WHERE track_level = 'intermediate';
```

#### 3.1.3 NEW: Modules Table
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT REFERENCES programs(id) NOT NULL,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 4),
  module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 4),

  -- Content
  title TEXT NOT NULL,
  intro_story TEXT, -- Mike's hook
  lesson_content TEXT NOT NULL,
  vocabulary JSONB DEFAULT '[]', -- [{term, definition}]
  activity_description TEXT,
  activity_duration_minutes INTEGER DEFAULT 20,
  assignment_prompt TEXT,
  key_points JSONB DEFAULT '[]', -- string[]
  references JSONB DEFAULT '[]', -- [{title, url}]

  -- Video (nullable for future)
  video_url TEXT,
  video_duration_seconds INTEGER,
  video_transcript TEXT,

  -- Metadata
  estimated_duration_minutes INTEGER DEFAULT 5,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'advanced')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es')),

  -- Legacy mapping
  legacy_week_number INTEGER, -- maps to old week
  legacy_section_index INTEGER, -- maps to old section

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, week_number, day_number, module_number, language)
);

CREATE INDEX idx_modules_program_week ON modules(program_id, week_number);
CREATE INDEX idx_modules_language ON modules(language);
```

#### 3.1.4 NEW: Module Progress Table
```sql
CREATE TABLE module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) NOT NULL,

  -- Progress
  video_watched BOOLEAN DEFAULT FALSE,
  video_watch_seconds INTEGER DEFAULT 0,
  lesson_read BOOLEAN DEFAULT FALSE,
  activity_completed BOOLEAN DEFAULT FALSE,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_module_progress_user ON module_progress(user_id);
CREATE INDEX idx_module_progress_enrollment ON module_progress(enrollment_id);
```

#### 3.1.5 NEW: Assignments Table
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) NOT NULL,

  -- Response
  response_text TEXT,
  response_submitted_at TIMESTAMPTZ,

  -- AI Grading
  ai_score TEXT CHECK (ai_score IN ('full', 'half', 'none')),
  ai_feedback TEXT,
  ai_graded_at TIMESTAMPTZ,
  ai_model_used TEXT, -- 'gpt-4', 'claude-3', etc.
  ai_rubric_version TEXT,

  -- Teacher Override
  teacher_score TEXT CHECK (teacher_score IN ('full', 'half', 'none')),
  teacher_feedback TEXT,
  teacher_override_at TIMESTAMPTZ,
  teacher_id UUID REFERENCES auth.users(id),

  -- Final Score
  final_score TEXT GENERATED ALWAYS AS (
    COALESCE(teacher_score, ai_score)
  ) STORED,

  -- Metadata
  time_spent_seconds INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, module_id, attempt_number)
);

CREATE INDEX idx_assignments_user ON assignments(user_id);
CREATE INDEX idx_assignments_module ON assignments(module_id);
CREATE INDEX idx_assignments_needs_grading ON assignments(ai_score) WHERE teacher_score IS NULL;
```

#### 3.1.6 NEW: AI Grading Rubrics Table
```sql
CREATE TABLE grading_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id),
  week_number INTEGER, -- For week-level rubrics

  -- Rubric Definition
  rubric_name TEXT NOT NULL,
  full_credit_criteria TEXT NOT NULL,
  full_credit_example TEXT,
  half_credit_criteria TEXT NOT NULL,
  half_credit_example TEXT,
  no_credit_criteria TEXT NOT NULL,
  no_credit_example TEXT,

  -- Keywords/concepts that must be present
  required_concepts JSONB DEFAULT '[]', -- string[]

  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.1.7 Quiz Tables (Modified)
```sql
-- Modify quiz_questions to link to modules
CREATE TABLE quiz_questions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT REFERENCES programs(id) NOT NULL,
  week_number INTEGER NOT NULL,

  -- Question content
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- string[4]
  correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
  explanation TEXT,

  -- Source tracking (which modules this tests)
  source_module_ids UUID[] DEFAULT '{}', -- Links to modules table
  source_day_numbers INTEGER[] DEFAULT '{}', -- e.g., [1,2,3,4]

  -- Metadata
  difficulty_level TEXT DEFAULT 'beginner',
  language TEXT DEFAULT 'en',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, week_number, question_text, language)
);

-- Quiz attempts table (keep existing, add fields)
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS
  retry_count INTEGER DEFAULT 0;
```

#### 3.1.8 NEW: Teachers & Classes Tables
```sql
-- Teacher profiles
CREATE TABLE teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  school_name TEXT,
  district TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes/Sections
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL, -- "Period 1", "Block A"
  program_id TEXT REFERENCES programs(id),
  school_year TEXT, -- "2025-2026"

  -- Google Classroom integration
  google_classroom_id TEXT,
  google_classroom_link TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student-Class enrollment
CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id),

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);
```

### 3.2 TypeScript Types

```typescript
// src/lib/types/curriculum.ts

export type TrackLevel = 'beginner' | 'advanced'; // REMOVED: 'intermediate'

export type GradeScore = 'full' | 'half' | 'none';

export interface Module {
  id: string;
  program_id: 'HS' | 'COLLEGE';
  week_number: number;
  day_number: 1 | 2 | 3 | 4;
  module_number: 1 | 2 | 3 | 4;

  title: string;
  intro_story: string | null;
  lesson_content: string;
  vocabulary: Array<{ term: string; definition: string }>;
  activity_description: string | null;
  activity_duration_minutes: number;
  assignment_prompt: string | null;
  key_points: string[];
  references: Array<{ title: string; url: string }>;

  video_url: string | null;
  video_duration_seconds: number | null;
  video_transcript: string | null;

  estimated_duration_minutes: number;
  difficulty_level: TrackLevel;
  language: 'en' | 'es';

  // Legacy mapping
  legacy_week_number: number | null;
  legacy_section_index: number | null;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;

  video_watched: boolean;
  video_watch_seconds: number;
  lesson_read: boolean;
  activity_completed: boolean;

  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;
}

export interface Assignment {
  id: string;
  user_id: string;
  module_id: string;

  response_text: string | null;
  response_submitted_at: string | null;

  ai_score: GradeScore | null;
  ai_feedback: string | null;

  teacher_score: GradeScore | null;
  teacher_feedback: string | null;

  final_score: GradeScore | null;

  time_spent_seconds: number;
  attempt_number: number;
}

export interface GradingRubric {
  id: string;
  module_id: string | null;
  week_number: number | null;

  rubric_name: string;
  full_credit_criteria: string;
  full_credit_example: string | null;
  half_credit_criteria: string;
  half_credit_example: string | null;
  no_credit_criteria: string;
  no_credit_example: string | null;

  required_concepts: string[];
}

export interface DaySchedule {
  day_number: 1 | 2 | 3 | 4 | 5;
  day_name: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  modules: Module[]; // 4 modules for days 1-4, empty for day 5
  is_quiz_day: boolean;
}

export interface WeekSchedule {
  week_number: number;
  week_title: string;
  days: DaySchedule[];
  quiz: {
    question_count: number;
    passing_score: number;
    source_module_count: number;
  };
}
```

---

## 4. Screen Flow Architecture

### 4.1 Student Navigation Flow

```
App Launch
    │
    ▼
┌─────────────────┐
│   Login/Auth    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │────▶│    Courses      │
│  (Home Screen)  │     │   (Week List)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         │              ▼                 ▼
         │     ┌─────────────┐   ┌─────────────┐
         │     │  Day View   │   │  Quiz View  │
         │     │ (Modules)   │   │ (Friday)    │
         │     └──────┬──────┘   └─────────────┘
         │            │
         │            ▼
         │     ┌─────────────┐
         │     │Module Detail│
         │     │             │
         │     │ ┌─────────┐ │
         │     │ │ Video   │ │
         │     │ └─────────┘ │
         │     │ ┌─────────┐ │
         │     │ │ Lesson  │ │
         │     │ └─────────┘ │
         │     │ ┌─────────┐ │
         │     │ │Activity │ │
         │     │ └─────────┘ │
         │     │ ┌─────────┐ │
         │     │ │Assign-  │ │
         │     │ │ment     │ │
         │     │ └─────────┘ │
         │     └─────────────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌─────────┐        ┌─────────┐
│  Games  │        │ Profile │
└─────────┘        └─────────┘
```

### 4.2 Teacher Navigation Flow

```
Teacher Login
    │
    ▼
┌──────────────────────────────────────────────────┐
│              Teacher Dashboard                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Classes  │ │ Students │ │ Grading Queue    │ │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
└───────┼────────────┼────────────────┼───────────┘
        │            │                │
        ▼            ▼                ▼
   ┌─────────┐  ┌─────────┐    ┌───────────┐
   │ Class   │  │ Student │    │ Grade     │
   │ Roster  │  │ Progress│    │ Assignment│
   │         │  │ Detail  │    │           │
   └─────────┘  └─────────┘    │ ┌───────┐ │
        │                      │ │AI Score│ │
        ▼                      │ └───────┘ │
   ┌─────────┐                 │ ┌───────┐ │
   │ Export  │                 │ │Override│ │
   │ Grades  │                 │ └───────┘ │
   └─────────┘                 └───────────┘
```

### 4.3 Component Hierarchy

```
<App>
├── <StudentLayout>
│   ├── <Sidebar> (desktop)
│   ├── <BottomNav> (mobile)
│   └── <MainContent>
│       ├── <DashboardScreen>
│       ├── <CoursesScreen>
│       │   └── <WeekView>
│       │       ├── <DayCard> × 4
│       │       │   └── <ModuleCard> × 4
│       │       └── <QuizCard> (Friday)
│       ├── <DayScreen>
│       │   └── <ModuleScreen>
│       │       ├── <VideoPlayer>
│       │       ├── <LessonContent>
│       │       ├── <ActivitySection>
│       │       ├── <AssignmentForm>
│       │       └── <ReferencesSection>
│       ├── <QuizScreen>
│       ├── <GamesScreen>
│       └── <ProfileScreen>
│
└── <TeacherLayout>
    ├── <TeacherSidebar>
    └── <TeacherMainContent>
        ├── <TeacherDashboard>
        ├── <ClassManagement>
        ├── <StudentRoster>
        ├── <StudentProgressDetail>
        ├── <GradingQueue>
        ├── <AssignmentGrader>
        └── <ReportsExport>
```

---

## 5. Module Component Design

### 5.1 ModuleScreen Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Day 1                    Week 1 • Day 1  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │              VIDEO PLAYER                     │  │
│  │          (or placeholder if no video)         │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  MODULE 1: Understanding Income                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 📖 MIKE'S STORY                             │    │
│  │ "Let me tell you about when I first..."     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 📚 LESSON CONTENT                           │    │
│  │ Income is money that comes into your...     │    │
│  │                                             │    │
│  │ Key Vocabulary:                             │    │
│  │ • Income - Money received from work...      │    │
│  │ • Expense - Money spent on goods...         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🎯 KEY TAKEAWAYS                            │    │
│  │ ✓ Income is money coming in                 │    │
│  │ ✓ Track all sources of income               │    │
│  │ ✓ Regular vs irregular income               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🎮 CLASS ACTIVITY (20 min)                  │    │
│  │ In groups of 3-4, create a list of all...   │    │
│  │                                             │    │
│  │ [Mark as Completed]                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ✏️ ASSIGNMENT                               │    │
│  │ Prompt: Describe three sources of income    │    │
│  │ a high school student could have...         │    │
│  │                                             │    │
│  │ ┌───────────────────────────────────────┐   │    │
│  │ │                                       │   │    │
│  │ │  [Student response textarea]          │   │    │
│  │ │                                       │   │    │
│  │ └───────────────────────────────────────┘   │    │
│  │                                             │    │
│  │ [Submit Assignment]                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 📎 REFERENCES                               │    │
│  │ • Khan Academy: Introduction to Income      │    │
│  │ • Practical Money Skills: Earning Money     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ────────────────────────────────────────────────   │
│  [← Previous Module]              [Next Module →]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 Module Progress States

```typescript
type ModuleProgressState =
  | 'not_started'      // Gray badge
  | 'video_watched'    // 25% complete
  | 'lesson_read'      // 50% complete
  | 'activity_done'    // 75% complete
  | 'assignment_submitted' // 100% complete (pending grade)
  | 'completed'        // Green badge (graded)
```

---

## 6. Quiz System Redesign

### 6.1 Friday Quiz Rules

1. **Timing**: Only available on Day 5 (Friday) of each week
2. **Question Count**: 10 questions
3. **Source**: Questions derived from Days 1-4 modules only
4. **Distribution**: 2-3 questions per day (balanced)
5. **Pass Threshold**: 70% (7/10 correct)
6. **Retakes**: Unlimited until pass
7. **Attempt Tracking**: All attempts recorded with scores

### 6.2 Quiz Question Generation

```typescript
interface QuizGenerationConfig {
  week_number: number;
  program_id: 'HS' | 'COLLEGE';
  question_count: 10;

  // Distribution: questions per day
  distribution: {
    day_1: 2 | 3;
    day_2: 2 | 3;
    day_3: 2 | 3;
    day_4: 2 | 3;
  };

  // Total must equal 10
}

// Question selection algorithm
function selectQuizQuestions(config: QuizGenerationConfig): QuizQuestion[] {
  // 1. Get all questions for this week
  // 2. Group by source_day_numbers
  // 3. Randomly select per distribution
  // 4. Shuffle final array
  // 5. Return 10 questions
}
```

### 6.3 Quiz Attempt Flow

```
Student clicks "Start Quiz"
        │
        ▼
    ┌─────────┐
    │ Check   │──No──▶ "Complete Days 1-4 first"
    │ Days    │
    │ 1-4 Done│
    └────┬────┘
         │ Yes
         ▼
    ┌─────────┐
    │ Load    │
    │ 10 Qs   │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Timer:  │
    │ 10 min  │
    └────┬────┘
         │
    ┌────┴────┐
    │ Answer  │◀──┐
    │ Question│   │
    └────┬────┘   │
         │        │ More questions
         ▼        │
    ┌─────────┐   │
    │ Next Q  │───┘
    │ or      │
    │ Submit  │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ Grade   │
    │ & Show  │
    │ Results │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Pass      Fail
  (≥70%)   (<70%)
    │         │
    ▼         ▼
  Done    [Retry]
```

---

## 7. Assignment & AI Grading System

### 7.1 Grading Scale

| Score | Label | Criteria |
|-------|-------|----------|
| `full` | Full Credit | Demonstrates clear understanding, addresses all parts of prompt |
| `half` | Half Credit | Partial understanding, missing key elements |
| `none` | No Credit | Off-topic, incomplete, or demonstrates no understanding |

### 7.2 AI Grading Architecture

```
Student submits assignment
           │
           ▼
    ┌─────────────┐
    │  Save to    │
    │  Database   │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  Queue for  │
    │  AI Grading │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ Load Rubric │
    │ for Module  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────────────────────────────┐
    │         AI GRADING SERVICE          │
    │                                     │
    │  System Prompt:                     │
    │  "You are a teacher grading..."     │
    │                                     │
    │  Context:                           │
    │  - Assignment prompt                │
    │  - Student response                 │
    │  - Grading rubric                   │
    │  - Required concepts                │
    │  - Example responses                │
    │                                     │
    │  Output (JSON):                     │
    │  {                                  │
    │    "score": "full|half|none",       │
    │    "feedback": "string",            │
    │    "concepts_found": ["..."],       │
    │    "concepts_missing": ["..."]      │
    │  }                                  │
    └──────────────┬──────────────────────┘
                   │
                   ▼
    ┌─────────────────────────────────────┐
    │  Save AI Grade + Add to Teacher     │
    │  Review Queue (if half/none)        │
    └─────────────────────────────────────┘
```

### 7.3 AI Service Implementation

```typescript
// src/lib/aiGrading.ts

interface GradingRequest {
  assignment_id: string;
  prompt: string;
  response: string;
  rubric: GradingRubric;
}

interface GradingResult {
  score: 'full' | 'half' | 'none';
  feedback: string;
  concepts_found: string[];
  concepts_missing: string[];
  confidence: number; // 0-1
}

// Use Claude API (more cost-effective for education)
async function gradeAssignment(request: GradingRequest): Promise<GradingResult> {
  const systemPrompt = `You are a fair, encouraging teacher grading student work.

Grade this assignment using ONLY these three scores:
- "full": Student demonstrates clear understanding and addresses all parts
- "half": Student shows partial understanding but is missing key elements
- "none": Response is off-topic, incomplete, or shows no understanding

Be encouraging in feedback. Point out what they did well before areas to improve.
Students are high school or college age learning financial literacy.`;

  const userPrompt = `
ASSIGNMENT PROMPT:
${request.prompt}

STUDENT RESPONSE:
${request.response}

GRADING RUBRIC:
Full Credit: ${request.rubric.full_credit_criteria}
Half Credit: ${request.rubric.half_credit_criteria}
No Credit: ${request.rubric.no_credit_criteria}

REQUIRED CONCEPTS (check if present):
${request.rubric.required_concepts.join(', ')}

Respond with JSON only:
{
  "score": "full" | "half" | "none",
  "feedback": "encouraging feedback here",
  "concepts_found": ["concepts student demonstrated"],
  "concepts_missing": ["concepts student missed"]
}`;

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307', // Cost-effective
    max_tokens: 500,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  });

  return JSON.parse(response.content[0].text);
}
```

### 7.4 Teacher Override Workflow

```
Teacher Dashboard
       │
       ▼
┌─────────────────────────────────────┐
│        GRADING QUEUE                │
│                                     │
│  Filter: [All] [Needs Review] [Done]│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ John D. - Module 3 Assignment   ││
│  │ AI Score: half • 2 hours ago    ││
│  │ [Review]                        ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ Sarah M. - Module 5 Assignment  ││
│  │ AI Score: none • 3 hours ago    ││
│  │ [Review]                        ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
       │
       │ Click [Review]
       ▼
┌─────────────────────────────────────┐
│     ASSIGNMENT REVIEW               │
│                                     │
│  Student: John Doe                  │
│  Module: Week 1 Day 1 Module 3      │
│                                     │
│  PROMPT:                            │
│  "Describe three sources of..."     │
│                                     │
│  STUDENT RESPONSE:                  │
│  "I think income comes from jobs    │
│   and maybe allowance..."           │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  AI GRADE: half                     │
│  AI FEEDBACK:                       │
│  "Good start! You identified jobs   │
│   and allowance. Try to think of    │
│   one more source..."               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  YOUR GRADE:                        │
│  (○) Full Credit                    │
│  (●) Half Credit  ← Keep AI grade   │
│  (○) No Credit                      │
│                                     │
│  Your Feedback (optional):          │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  [Confirm Grade]                    │
└─────────────────────────────────────┘
```

### 7.5 Grade Calculation

```typescript
// Final grade calculation
function calculateWeeklyGrade(
  moduleAssignments: Assignment[],  // 16 assignments
  quizScore: number,                // 0-10
  quizPassed: boolean
): {
  assignmentGrade: number;  // 0-100
  quizGrade: number;        // 0-100
  totalGrade: number;       // 0-100
  letterGrade: string;
} {
  // Convert assignment scores to points
  const scorePoints = { full: 100, half: 50, none: 0 };

  // Assignment grade (60% of total)
  const assignmentTotal = moduleAssignments.reduce((sum, a) => {
    return sum + scorePoints[a.final_score || 'none'];
  }, 0);
  const assignmentGrade = assignmentTotal / moduleAssignments.length;

  // Quiz grade (40% of total)
  const quizGrade = (quizScore / 10) * 100;

  // Weighted total
  const totalGrade = (assignmentGrade * 0.6) + (quizGrade * 0.4);

  // Letter grade
  const letterGrade =
    totalGrade >= 90 ? 'A' :
    totalGrade >= 80 ? 'B' :
    totalGrade >= 70 ? 'C' :
    totalGrade >= 60 ? 'D' : 'F';

  return { assignmentGrade, quizGrade, totalGrade, letterGrade };
}
```

---

## 8. Teacher Dashboard & Reporting

### 8.1 Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  BTG Teacher Dashboard                     Mrs. Johnson │ Logout │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐         │
│  │   5 Classes   │ │  127 Students │ │  23 Need      │         │
│  │               │ │               │ │  Grading      │         │
│  └───────────────┘ └───────────────┘ └───────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MY CLASSES                                              │   │
│  │                                                          │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐     │   │
│  │  │ Period 1 - HS        │  │ Period 2 - HS        │     │   │
│  │  │ 28 students          │  │ 25 students          │     │   │
│  │  │ Avg: 78%             │  │ Avg: 82%             │     │   │
│  │  │ Week 3 Day 2         │  │ Week 3 Day 4         │     │   │
│  │  │ [View] [Grades]      │  │ [View] [Grades]      │     │   │
│  │  └──────────────────────┘  └──────────────────────┘     │   │
│  │                                                          │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐     │   │
│  │  │ Period 4 - College   │  │ Period 5 - HS        │     │   │
│  │  │ 32 students          │  │ 24 students          │     │   │
│  │  │ Avg: 85%             │  │ Avg: 75%             │     │   │
│  │  │ Week 2 Day 5 (Quiz)  │  │ Week 3 Day 1         │     │   │
│  │  │ [View] [Grades]      │  │ [View] [Grades]      │     │   │
│  │  └──────────────────────┘  └──────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GRADING QUEUE (23 pending)                  [View All]  │   │
│  │                                                          │   │
│  │  • John D. (P1) - W3D2M3 - AI: half - 2h ago   [Grade]  │   │
│  │  • Maria S. (P2) - W3D4M1 - AI: none - 3h ago  [Grade]  │   │
│  │  • Alex T. (P4) - W2D3M4 - AI: half - 5h ago   [Grade]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  QUICK ACTIONS                                           │   │
│  │                                                          │   │
│  │  [Export All Grades]  [Add Student]  [Create Class]      │   │
│  │  [View Reports]       [Resource Bank] [Settings]         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Class Roster View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back │ Period 1 - High School Program                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Class Average: 78%    │    On Track: 22/28    │    Week 3      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  STUDENT ROSTER                    [Export CSV] [Print]  │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Name          │ Progress │ Quiz │ Assign │ Grade │   │   │
│  │  ├──────────────────────────────────────────────────┤   │   │
│  │  │ Adams, John   │ W3D2M3   │ 80%  │ 85%    │ B     │   │   │
│  │  │ Brown, Sarah  │ W3D2M4   │ 90%  │ 92%    │ A     │   │   │
│  │  │ Chen, Mike    │ W2D5     │ 60%  │ 55%    │ D  ⚠️ │   │   │
│  │  │ Davis, Emma   │ W3D2M2   │ 70%  │ 78%    │ C+    │   │   │
│  │  │ ...           │ ...      │ ...  │ ...    │ ...   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ = Falling behind (2+ days behind class pace)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Export Format

```typescript
// CSV Export Structure
interface GradeExport {
  student_name: string;
  student_email: string;
  class_name: string;

  // Per week
  week_number: number;

  // Module assignments (16 per week)
  module_1_score: 'full' | 'half' | 'none';
  module_2_score: 'full' | 'half' | 'none';
  // ... module_3 through module_16

  assignment_average: number; // 0-100

  // Quiz
  quiz_score: number; // 0-10
  quiz_attempts: number;
  quiz_passed: boolean;
  quiz_average: number; // 0-100

  // Totals
  week_grade: number; // 0-100
  week_letter: string; // A-F

  // Cumulative
  cumulative_grade: number;
  cumulative_letter: string;
}

// Google Classroom compatible format
interface GoogleClassroomExport {
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Week 1': number;
  'Week 2': number;
  // ...
  'Final Grade': number;
}
```

---

## 9. Video System Architecture

### 9.1 Video Storage Strategy

```
Option 1: Supabase Storage (Recommended for MVP)
├── Bucket: 'module-videos'
├── Path: /{program_id}/{week}/{day}/{module}/video.mp4
├── Access: Signed URLs (24h expiry)
└── Max size: 100MB per video

Option 2: YouTube Unlisted (Alternative)
├── Store: YouTube video IDs in database
├── Embed: YouTube iframe player
├── Benefits: Free hosting, no storage costs
└── Drawbacks: Branding, ads, external dependency

Option 3: Cloudflare Stream (Future Scale)
├── Store: Video IDs in database
├── Benefits: Adaptive streaming, global CDN
└── Cost: ~$1/1000 minutes watched
```

### 9.2 Video Player Component

```typescript
// src/components/VideoPlayer.tsx

interface VideoPlayerProps {
  videoUrl: string | null;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
}

function VideoPlayer({ videoUrl, onProgress, onComplete }: VideoPlayerProps) {
  if (!videoUrl) {
    return (
      <div className="video-placeholder">
        <VideoIcon />
        <p>Video coming soon</p>
        <p className="text-sm">Continue with the lesson below</p>
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      controls
      onTimeUpdate={(e) => onProgress?.(e.currentTarget.currentTime)}
      onEnded={() => onComplete?.()}
    />
  );
}
```

### 9.3 Video Admin Upload (Future)

```
Teacher/Admin Portal
        │
        ▼
┌─────────────────────────────────────┐
│  Upload Video for Module            │
│                                     │
│  Week: [3 ▼]  Day: [2 ▼]  Mod: [1 ▼]│
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │    Drag & drop video here       ││
│  │    or click to browse           ││
│  │                                 ││
│  │    MP4, max 100MB               ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  [Upload]                           │
└─────────────────────────────────────┘
```

---

## 10. Language (i18n) System

### 10.1 Architecture

```typescript
// src/lib/i18n.ts

type Language = 'en' | 'es';

interface TranslationStrings {
  // UI strings
  dashboard: string;
  courses: string;
  games: string;
  profile: string;

  // Module UI
  video_coming_soon: string;
  lesson_content: string;
  key_takeaways: string;
  class_activity: string;
  assignment: string;
  submit: string;
  // ... etc
}

const translations: Record<Language, TranslationStrings> = {
  en: {
    dashboard: 'Dashboard',
    courses: 'Courses',
    // ...
  },
  es: {
    dashboard: 'Tablero',
    courses: 'Cursos',
    // ...
  }
};

// Hook
function useTranslation() {
  const { enrollment } = useEnrollment();
  const lang = enrollment?.language || 'en';

  return {
    t: (key: keyof TranslationStrings) => translations[lang][key],
    lang
  };
}
```

### 10.2 Content Localization

```sql
-- Modules are stored per language
-- Same module_number but different language field

-- English version
INSERT INTO modules (program_id, week_number, day_number, module_number, language, ...)
VALUES ('HS', 1, 1, 1, 'en', ...);

-- Spanish version
INSERT INTO modules (program_id, week_number, day_number, module_number, language, ...)
VALUES ('HS', 1, 1, 1, 'es', ...);
```

### 10.3 Language Toggle Persistence

```
User selects Spanish at enrollment
           │
           ▼
┌──────────────────────────────────────┐
│ enrollment.language = 'es'           │
│ (stored in Supabase)                 │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ On every page load:                  │
│ 1. Load enrollment                   │
│ 2. Set app language context          │
│ 3. Fetch Spanish content from DB     │
│ 4. Render Spanish UI strings         │
└──────────────────────────────────────┘
```

---

## 11. Platform Compatibility

### 11.1 Chromebook Requirements

```
CHROMEBOOK COMPATIBILITY CHECKLIST:
✓ Works in Chrome browser
✓ Responsive design (various screen sizes)
✓ Touch-friendly buttons (min 44px)
✓ Offline support via service worker
✓ Low bandwidth mode (lazy load images)
✓ No plugins required (Flash, Java)
✓ Keyboard navigation support
✓ PWA installable
```

### 11.2 Google Classroom Integration

```typescript
// Integration options

// Option 1: Manual Link Sharing (MVP)
// - Teacher shares BTG class join link
// - Students click link, auto-join class
// - Simple, no API needed

// Option 2: Google Classroom API (Future)
interface GoogleClassroomIntegration {
  // Import roster
  importRoster(classroomId: string): Promise<Student[]>;

  // Post assignment
  postAssignment(classroomId: string, assignment: Assignment): Promise<void>;

  // Sync grades
  syncGrades(classroomId: string, grades: Grade[]): Promise<void>;
}

// OAuth scopes needed:
// - classroom.courses.readonly
// - classroom.rosters.readonly
// - classroom.coursework.students
```

### 11.3 Kami Compatibility

```
KAMI INTEGRATION APPROACH:

Kami is a PDF annotation tool popular in schools.
Our recommendation: Generate Kami-friendly PDFs

PDF EXPORT FEATURES:
├── Export lesson content as PDF
├── Export assignment worksheet as PDF
├── Include fillable form fields
├── Maintain readable fonts (min 12pt)
└── Include BTG branding/header

WORKFLOW:
1. Teacher clicks "Export as PDF" on module
2. System generates PDF with:
   - Lesson content
   - Assignment prompt
   - Answer space (fillable)
   - Student name field
3. Teacher uploads to Kami
4. Students annotate in Kami
5. Teacher grades in Kami OR imports back to BTG

IMPLEMENTATION:
- Use @react-pdf/renderer for PDF generation
- Store PDF templates in codebase
- Generate on-demand (no storage needed)
```

---

## 12. Migration Strategy

### 12.1 Data Migration Plan

```
PHASE 1: Schema Migration (Non-destructive)
├── Create new tables (modules, assignments, etc.)
├── Keep old tables intact
└── Add feature flag: USE_NEW_STRUCTURE = false

PHASE 2: Content Migration
├── Map old sections to new modules
│   Week 1 Section 1 → Week 1 Day 1 Module 1
│   Week 1 Section 2 → Week 1 Day 1 Module 2
│   Week 1 Section 3 → Week 1 Day 1 Module 3
│   Week 1 Section 4 → Week 1 Day 1 Module 4
│   Week 1 Section 5 → Week 1 Day 2 Module 1
│   ... (continue mapping)
├── Store legacy_week_number and legacy_section_index
└── Preserve all original content text

PHASE 3: Progress Migration
├── Map old course_progress to new module_progress
├── Preserve quiz_attempts (week-based, still valid)
└── Keep backward compatibility for historical data

PHASE 4: Cutover
├── Enable USE_NEW_STRUCTURE flag
├── New enrollments use new structure
├── Existing users see both (transitional period)
└── Eventually deprecate old views
```

### 12.2 Legacy Content Mapping

```typescript
// Mapping old sections to new modules

interface LegacyMapping {
  old_week: number;
  old_section: number;
  new_week: number;
  new_day: number;
  new_module: number;
}

// Example: 5 old sections → 16 new modules
// We EXPAND content, not compress it

function mapLegacyContent(oldWeek: number, oldSections: Section[]): Module[] {
  const modules: Module[] = [];
  let sectionIndex = 0;

  // Day 1-4, 4 modules each = 16 modules
  for (let day = 1; day <= 4; day++) {
    for (let mod = 1; mod <= 4; mod++) {
      // Spread old sections across new modules
      // Some new modules will be "expansion" of old content
      const sourceSection = oldSections[sectionIndex % oldSections.length];

      modules.push({
        week_number: oldWeek,
        day_number: day,
        module_number: mod,

        // Content from old section (may be repeated/expanded)
        title: generateModuleTitle(sourceSection, mod),
        lesson_content: sourceSection.content,
        key_points: sourceSection.keyPoints,

        // NEW content to be added later
        intro_story: null,
        activity_description: null,
        assignment_prompt: null,
        video_url: null,
        references: [],

        // Legacy tracking
        legacy_week_number: oldWeek,
        legacy_section_index: sectionIndex,
      });

      // Advance section every 3-4 modules
      if (mod === 4) sectionIndex++;
    }
  }

  return modules;
}
```

### 12.3 Rollback Plan

```bash
# If migration fails, rollback procedure:

# 1. Disable feature flag
UPDATE feature_flags SET enabled = false WHERE name = 'USE_NEW_STRUCTURE';

# 2. If needed, restore from backup
git checkout pre-module-restructure-backup

# 3. Redeploy
vercel --prod

# 4. Data is safe (we only ADD tables, never DROP)
```

---

## 13. Feature Flags

### 13.1 Flag Definitions

```typescript
// src/lib/featureFlags.ts

interface FeatureFlags {
  // Core structure
  USE_NEW_STRUCTURE: boolean;      // Default: false until ready
  ENABLE_TEACHER_DASHBOARD: boolean;

  // Grading
  ENABLE_AI_GRADING: boolean;
  AI_GRADING_MODEL: 'claude-haiku' | 'gpt-4-mini';

  // Content
  ENABLE_VIDEO_PLAYER: boolean;
  ENABLE_SPANISH_CONTENT: boolean;

  // Integrations
  ENABLE_GOOGLE_CLASSROOM: boolean;
  ENABLE_PDF_EXPORT: boolean;
}

const defaultFlags: FeatureFlags = {
  USE_NEW_STRUCTURE: false,
  ENABLE_TEACHER_DASHBOARD: false,
  ENABLE_AI_GRADING: false,
  AI_GRADING_MODEL: 'claude-haiku',
  ENABLE_VIDEO_PLAYER: true,
  ENABLE_SPANISH_CONTENT: false,
  ENABLE_GOOGLE_CLASSROOM: false,
  ENABLE_PDF_EXPORT: false,
};
```

### 13.2 Flag Storage

```sql
CREATE TABLE feature_flags (
  name TEXT PRIMARY KEY,
  enabled BOOLEAN DEFAULT FALSE,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize flags
INSERT INTO feature_flags (name, enabled) VALUES
  ('USE_NEW_STRUCTURE', false),
  ('ENABLE_TEACHER_DASHBOARD', false),
  ('ENABLE_AI_GRADING', false),
  ('ENABLE_VIDEO_PLAYER', true),
  ('ENABLE_SPANISH_CONTENT', false),
  ('ENABLE_GOOGLE_CLASSROOM', false),
  ('ENABLE_PDF_EXPORT', false);
```

### 13.3 Flag Usage

```typescript
// In components
function CoursesScreen() {
  const flags = useFeatureFlags();

  if (flags.USE_NEW_STRUCTURE) {
    return <NewCoursesScreen />;
  }

  return <LegacyCoursesScreen />;
}
```

---

## 14. Implementation Phases

### Phase A: Foundation (Week 1)
```
A1. Create feature flags system
A2. Create new database tables (non-destructive)
A3. Remove intermediate level from enrollment
A4. Create Module type definitions
A5. Create content migration script (dry run)
```

### Phase B: Module System (Week 2)
```
B1. Create DayView component
B2. Create ModuleScreen component
B3. Create VideoPlayer placeholder
B4. Create AssignmentForm component
B5. Wire up module navigation
```

### Phase C: Quiz Restructure (Week 3)
```
C1. Modify quiz to Friday-only
C2. Update quiz question sourcing (days 1-4)
C3. Add retry tracking
C4. Update quiz results view
```

### Phase D: Assignment & Grading (Week 4)
```
D1. Create assignment submission flow
D2. Set up AI grading service (Claude Haiku)
D3. Create grading rubrics table
D4. Build assignment review queue
```

### Phase E: Teacher Dashboard (Week 5)
```
E1. Create teacher auth/roles
E2. Build teacher dashboard layout
E3. Create class management
E4. Build student roster view
E5. Create grade export
```

### Phase F: Integration & Polish (Week 6)
```
F1. Spanish UI strings
F2. PDF export for Kami
F3. Google Classroom prep
F4. Testing & QA
F5. Enable feature flags
```

---

## Appendices

### A. File Structure (New)

```
src/
├── components/
│   ├── student/
│   │   ├── DayView.tsx
│   │   ├── ModuleScreen.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── AssignmentForm.tsx
│   │   └── QuizScreen.tsx (modified)
│   ├── teacher/
│   │   ├── TeacherDashboard.tsx
│   │   ├── ClassManagement.tsx
│   │   ├── StudentRoster.tsx
│   │   ├── GradingQueue.tsx
│   │   └── AssignmentGrader.tsx
│   └── shared/
│       └── LanguageToggle.tsx
├── lib/
│   ├── types/
│   │   └── curriculum.ts
│   ├── featureFlags.ts
│   ├── i18n.ts
│   ├── aiGrading.ts
│   └── pdfExport.ts
└── hooks/
    ├── useModule.ts
    ├── useAssignment.ts
    └── useFeatureFlags.ts
```

### B. API Endpoints (New)

```
GET  /api/modules?week=1&day=1&lang=en
GET  /api/modules/:id
POST /api/assignments
GET  /api/assignments/:id
POST /api/assignments/:id/grade
GET  /api/quiz/:week
POST /api/quiz/:week/submit
GET  /api/teacher/classes
GET  /api/teacher/classes/:id/roster
GET  /api/teacher/grading-queue
POST /api/teacher/grades/export
```

---

*Document Version: 2.0*
*Last Updated: January 2026*
*Author: Claude Code Architecture Assistant*
