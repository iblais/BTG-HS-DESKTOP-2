import { useState, useEffect } from 'react';
import { getPrograms, createEnrollment, type Program } from '@/lib/enrollment';
import { type ProgramId, type TrackLevel, type Language } from '@/lib/supabase';
import { GraduationCap, BookOpen, TrendingUp, Target, Sparkles, Loader2, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logo } from '@/assets';

interface ProgramSelectScreenProps {
  onEnrollmentCreated: () => void;
  userEmail?: string;
}

export function ProgramSelectScreen({ onEnrollmentCreated, userEmail }: ProgramSelectScreenProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramId | null>('HS');
  const [trackLevel] = useState<TrackLevel>('beginner');
  const [language] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPrograms();
      setPrograms(data);
    } catch (err) {
      setError('Failed to load programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedProgram) {
      setError('Please select a program first');
      return;
    }

    setEnrolling(true);
    setError(null);

    try {
      await createEnrollment(selectedProgram, trackLevel, language);
      onEnrollmentCreated();
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      setError(`Failed to create enrollment: ${errorMessage}`);
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-[#4A5FFF] animate-spin" />
          <p className="text-white/60">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #4A5FFF 0%, transparent 70%)',
            left: '10%',
            top: '20%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #FF6B35 0%, transparent 70%)',
            right: '10%',
            bottom: '10%',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Welcome */}
        <div className="lg:w-2/5 xl:w-1/3 p-8 lg:p-12 flex flex-col justify-center lg:border-r lg:border-white/[0.06]">
          <div className="max-w-md mx-auto lg:mx-0">
            {/* Logo */}
            <img
              src={logo}
              alt="Beyond The Game"
              className="h-16 w-auto object-contain mb-8"
            />

            {/* Welcome Message */}
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4A5FFF] to-[#00BFFF] flex items-center justify-center mb-6 shadow-lg shadow-[#4A5FFF]/30">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white mb-4">
                Welcome to
                <span className="block mt-1 bg-gradient-to-r from-[#4A5FFF] via-[#00BFFF] to-[#50D890] bg-clip-text text-transparent">
                  Your Journey
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">
                Choose your financial literacy program and start building real-world money skills today.
              </p>
            </div>

            {/* User Info */}
            {userEmail && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
                <p className="text-white/40 text-xs mb-1">Signed in as</p>
                <p className="text-white/80 font-medium truncate">{userEmail}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Selection */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={loadPrograms}
                  className="mt-2 text-red-400 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Program Selection */}
            <div className="mb-10">
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">1</span>
                Select Your Program
              </h2>

              <div className="grid gap-4">
                {programs.map((program) => {
                  const isHS = program.id === 'HS';
                  const isSelected = selectedProgram === program.id;

                  return (
                    <button
                      key={program.id}
                      onClick={() => setSelectedProgram(program.id as ProgramId)}
                      className={cn(
                        "w-full text-left p-6 rounded-2xl border transition-all duration-300",
                        "bg-white/[0.02] hover:bg-white/[0.04]",
                        isSelected
                          ? "border-[#4A5FFF] shadow-lg shadow-[#4A5FFF]/20 bg-[#4A5FFF]/[0.08]"
                          : "border-white/[0.06] hover:border-white/[0.12]"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                          isHS
                            ? "bg-gradient-to-br from-[#4A5FFF] to-[#6B7FFF]"
                            : "bg-gradient-to-br from-[#FF6B35] to-[#FF8E53]"
                        )}>
                          {isHS ? <BookOpen className="w-7 h-7 text-white" /> : <TrendingUp className="w-7 h-7 text-white" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="text-white font-bold text-lg">{program.title}</h3>
                              <p className="text-white/40 text-sm">{program.target_audience}</p>
                            </div>
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              isSelected
                                ? "border-[#4A5FFF] bg-[#4A5FFF]"
                                : "border-white/20"
                            )}>
                              {isSelected && <Check className="w-4 h-4 text-white" />}
                            </div>
                          </div>

                          <p className="text-white/60 text-sm mb-4 leading-relaxed">
                            {program.description}
                          </p>

                          <div className="flex items-center gap-6 text-white/40 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Target className="w-4 h-4" />
                              <span>{program.weeks_total} Weeks</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" />
                              <span>Interactive Lessons</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Enroll Button */}
            {selectedProgram && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className={cn(
                    "w-full relative group overflow-hidden rounded-xl py-4 font-semibold text-white",
                    "transition-all duration-300 transform",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    !enrolling && "hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(74,95,255,0.3)] active:scale-[0.98]"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  <span className="relative flex items-center justify-center gap-2">
                    {enrolling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Start Learning
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>

                <p className="text-white/30 text-xs text-center mt-4">
                  You can change your program later in settings
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
