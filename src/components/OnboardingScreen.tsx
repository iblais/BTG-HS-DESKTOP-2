import { useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, Trophy, TrendingUp, Gamepad2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logo } from '@/assets';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      icon: BookOpen,
      title: 'Learn Financial Basics',
      description: 'Master money management through interactive courses covering budgeting, saving, investing, and more. Each lesson is designed to build practical skills you can use right away.',
      color: 'from-[#4A5FFF] to-[#00BFFF]',
      features: ['18-week structured program', 'Progress tracking', 'Offline access'],
    },
    {
      icon: Gamepad2,
      title: 'Play Fun Games',
      description: 'Learn by doing! Play engaging financial games like Stock Market Simulator, Budget Builder, and more. Put your knowledge to the test in a risk-free environment.',
      color: 'from-[#50D890] to-[#4ECDC4]',
      features: ['5 unique games', 'Real-world scenarios', 'Score leaderboards'],
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Watch your financial knowledge grow with every lesson and game. Earn points, complete weekly goals, and see your improvement over time.',
      color: 'from-[#FF6B35] to-[#FF8E53]',
      features: ['Weekly goals', 'Streak tracking', 'Progress reports'],
    },
    {
      icon: Trophy,
      title: 'Ready to Start?',
      description: "You're all set! Start with the courses to build your foundation, then test your skills in the games. Your financial literacy journey begins now.",
      color: 'from-[#9D4EDD] to-[#C77DFF]',
      features: ['Earn achievements', 'Unlock rewards', 'Build real skills'],
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      localStorage.setItem('btg-onboarding-complete', 'true');
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('btg-onboarding-complete', 'true');
    onComplete();
  };

  const page = pages[currentPage];
  const isLastPage = currentPage === pages.length - 1;
  const Icon = page.icon;

  return (
    <div className="min-h-screen bg-[#0A0E27] relative overflow-hidden flex items-center justify-center p-6">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-25 blur-[120px] transition-all duration-1000"
          style={{
            background: `radial-gradient(circle, ${page.color.includes('4A5FFF') ? '#4A5FFF' : page.color.includes('50D890') ? '#50D890' : page.color.includes('FF6B35') ? '#FF6B35' : '#9D4EDD'} 0%, transparent 70%)`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Skip Button */}
      {!isLastPage && (
        <button
          onClick={handleSkip}
          className="absolute top-6 right-6 text-white/50 hover:text-white text-sm font-medium transition-colors z-10"
        >
          Skip intro
        </button>
      )}

      {/* Logo */}
      <div className="absolute top-6 left-6">
        <img
          src={logo}
          alt="Beyond The Game"
          className="h-12 w-auto object-contain opacity-80"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className={cn(
            "p-6 rounded-3xl bg-gradient-to-br shadow-2xl transition-all duration-500",
            page.color
          )}>
            <Icon className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 lg:p-12 mb-8">
          <h2 className="text-white font-black text-3xl lg:text-4xl mb-4 text-center">
            {page.title}
          </h2>
          <p className="text-white/60 text-center text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            {page.description}
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-3">
            {page.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08]"
              >
                <Sparkles className="w-4 h-4 text-[#4A5FFF]" />
                <span className="text-white/70 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Page Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentPage
                  ? "w-10 bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF]"
                  : "w-2 bg-white/20 hover:bg-white/30"
              )}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-center gap-4">
          {currentPage > 0 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3 rounded-xl border border-white/[0.1] text-white/70 hover:text-white hover:border-white/[0.2] transition-all flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            className={cn(
              "relative group overflow-hidden rounded-xl px-8 py-3 font-semibold text-white",
              "transition-all duration-300 transform",
              "hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(74,95,255,0.3)] active:scale-[0.98]"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            <span className="relative flex items-center gap-2">
              {isLastPage ? "Let's Go!" : 'Next'}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        {/* Progress Text */}
        <p className="text-white/30 text-xs text-center mt-6">
          {currentPage + 1} of {pages.length}
        </p>
      </div>
    </div>
  );
}
