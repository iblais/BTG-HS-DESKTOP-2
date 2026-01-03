import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, MessageSquare, Award, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button3D } from './ui/Button3D';

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'learning' | 'achievements' | 'reminders';
}

export function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'lesson_reminders',
      title: 'Lesson Reminders',
      description: 'Get reminded to complete your daily lessons',
      icon: <BookOpen className="w-5 h-5 text-[#4A5FFF]" />,
      enabled: true,
      category: 'learning'
    },
    {
      id: 'quiz_due',
      title: 'Quiz Due Dates',
      description: 'Notifications when quizzes are available',
      icon: <Bell className="w-5 h-5 text-[#FF6B35]" />,
      enabled: true,
      category: 'learning'
    },
    {
      id: 'weekly_progress',
      title: 'Weekly Progress Reports',
      description: 'Summary of your weekly learning progress',
      icon: <TrendingUp className="w-5 h-5 text-[#50D890]" />,
      enabled: true,
      category: 'learning'
    },
    {
      id: 'achievement_earned',
      title: 'Achievements Earned',
      description: 'Get notified when you earn new achievements',
      icon: <Award className="w-5 h-5 text-[#9B59B6]" />,
      enabled: true,
      category: 'achievements'
    },
    {
      id: 'streak_alerts',
      title: 'Streak Alerts',
      description: 'Don\'t break your learning streak',
      icon: <CheckCircle className="w-5 h-5 text-[#FFD700]" />,
      enabled: true,
      category: 'achievements'
    },
    {
      id: 'email_notifications',
      title: 'Email Notifications',
      description: 'Receive important updates via email',
      icon: <Mail className="w-5 h-5 text-[#00BFFF]" />,
      enabled: false,
      category: 'reminders'
    },
    {
      id: 'tips_tricks',
      title: 'Tips & Tricks',
      description: 'Occasional financial literacy tips',
      icon: <MessageSquare className="w-5 h-5 text-[#FF8E53]" />,
      enabled: true,
      category: 'reminders'
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => prev.map(setting => ({
          ...setting,
          enabled: parsed[setting.id] ?? setting.enabled
        })));
      } catch {
        // Use defaults if parsing fails
      }
    }
  }, []);

  const toggleSetting = (id: string) => {
    setSettings(prev => prev.map(setting =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Save to localStorage
    const settingsMap = settings.reduce((acc, setting) => ({
      ...acc,
      [setting.id]: setting.enabled
    }), {});
    localStorage.setItem('notificationSettings', JSON.stringify(settingsMap));

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const enableAll = () => {
    setSettings(prev => prev.map(setting => ({ ...setting, enabled: true })));
  };

  const disableAll = () => {
    setSettings(prev => prev.map(setting => ({ ...setting, enabled: false })));
  };

  const categories = [
    { id: 'learning', title: 'Learning & Progress', color: '#4A5FFF' },
    { id: 'achievements', title: 'Achievements', color: '#50D890' },
    { id: 'reminders', title: 'Reminders & Updates', color: '#FF6B35' }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-black text-white">Notification Settings</h1>
      </div>

      {/* Success Message */}
      {showSaved && (
        <div className="bg-[#50D890]/20 border border-[#50D890]/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#50D890]" />
          <span className="text-[#50D890]">Settings saved successfully!</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={enableAll}
          className="flex-1 py-3 px-4 bg-white/10 rounded-xl text-white/80 text-sm hover:bg-white/20 transition-colors"
        >
          Enable All
        </button>
        <button
          onClick={disableAll}
          className="flex-1 py-3 px-4 bg-white/10 rounded-xl text-white/80 text-sm hover:bg-white/20 transition-colors"
        >
          Disable All
        </button>
      </div>

      {/* Settings by Category */}
      {categories.map((category) => (
        <GlassCard key={category.id} className="p-6">
          <h2 className="text-lg font-bold text-white mb-4" style={{ color: category.color }}>
            {category.title}
          </h2>

          <div className="space-y-4">
            {settings
              .filter(setting => setting.category === category.id)
              .map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      {setting.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{setting.title}</h3>
                      <p className="text-white/60 text-sm">{setting.description}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleSetting(setting.id)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      setting.enabled ? 'bg-[#50D890]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                        setting.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
          </div>
        </GlassCard>
      ))}

      {/* Browser Permission Info */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-white font-bold mb-2">Browser Notifications</h3>
            <p className="text-white/60 text-sm mb-4">
              To receive push notifications, make sure you've allowed notifications for this website in your browser settings.
            </p>
            <button
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission();
                }
              }}
              className="text-[#4A5FFF] text-sm font-medium hover:underline"
            >
              Request Permission
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Save Button */}
      <Button3D
        onClick={handleSave}
        disabled={isSaving}
        variant="primary"
        className="w-full"
      >
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </Button3D>
    </div>
  );
}
