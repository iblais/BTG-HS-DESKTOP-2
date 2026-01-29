import { useState, useEffect } from 'react';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentWorkView } from './StudentWorkView';
import { GradingInterface } from './GradingInterface';
import { GradingQueueView } from './GradingQueueView';
import { RubricManager } from './RubricManager';
import { StandardsView } from './StandardsView';
import { supabase } from '@/lib/supabase';
import { type ActivityResponse } from '@/lib/teacher';

type PortalView = 'dashboard' | 'student' | 'grading' | 'queue' | 'rubrics' | 'standards';

export function TeacherPortal() {
  const [currentView, setCurrentView] = useState<PortalView>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityResponse | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [queueRefreshKey, setQueueRefreshKey] = useState(0); // Forces GradingQueueView to refresh

  // Load completed weeks for standards coverage
  useEffect(() => {
    // This would normally come from aggregating all student progress
    // For now, we'll use a placeholder
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCompletedWeeks([1, 2, 3, 4]);
  }, []);

  const handleViewStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);

    // Get student name
    const { data } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', studentId)
      .single();

    if (data) {
      setStudentName(data.display_name || data.email.split('@')[0]);
    }

    setCurrentView('student');
  };

  const handleGradeActivity = (activity: ActivityResponse) => {
    setSelectedActivity(activity);
    setCurrentView('grading');
  };

  const handleGradeActivityFromQueue = (activity: ActivityResponse, name: string) => {
    setSelectedActivity(activity);
    setStudentName(name);
    setCurrentView('grading');
  };

  const handleGradeComplete = () => {
    setSelectedActivity(null);
    // Go back to queue if we came from there, otherwise go to student view
    if (!selectedStudentId) {
      // Increment key to force GradingQueueView to refresh
      setQueueRefreshKey(prev => prev + 1);
      setCurrentView('queue');
    } else {
      setCurrentView('student');
    }
  };

  const handleBackFromStudent = () => {
    setSelectedStudentId(null);
    setStudentName('');
    setCurrentView('dashboard');
  };

  const handleBackFromGrading = () => {
    setSelectedActivity(null);
    // Go back to queue if we came from there, otherwise go to student view
    if (!selectedStudentId) {
      setCurrentView('queue');
    } else {
      setCurrentView('student');
    }
  };

  const handleBackFromQueue = () => {
    setCurrentView('dashboard');
  };

  // Render current view
  switch (currentView) {
    case 'student':
      if (!selectedStudentId) {
        setCurrentView('dashboard');
        return null;
      }
      return (
        <StudentWorkView
          studentId={selectedStudentId}
          onBack={handleBackFromStudent}
          onGradeActivity={handleGradeActivity}
        />
      );

    case 'grading':
      if (!selectedActivity) {
        setCurrentView('student');
        return null;
      }
      return (
        <GradingInterface
          activity={selectedActivity}
          studentName={studentName}
          onBack={handleBackFromGrading}
          onGradeComplete={handleGradeComplete}
        />
      );

    case 'queue':
      return (
        <GradingQueueView
          key={queueRefreshKey}
          onBack={handleBackFromQueue}
          onGradeActivity={handleGradeActivityFromQueue}
        />
      );

    case 'rubrics':
      return (
        <RubricManager
          onBack={() => setCurrentView('dashboard')}
        />
      );

    case 'standards':
      return (
        <StandardsView
          onBack={() => setCurrentView('dashboard')}
          completedWeeks={completedWeeks}
        />
      );

    case 'dashboard':
    default:
      return (
        <TeacherDashboard
          onViewStudent={handleViewStudent}
          onViewGrading={() => setCurrentView('queue')}
          onViewStandards={() => setCurrentView('standards')}
          onViewRubrics={() => setCurrentView('rubrics')}
        />
      );
  }
}
