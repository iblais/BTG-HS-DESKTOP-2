import { useState } from 'react';
import { GraduationCap, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { registerAsTeacher } from '@/lib/teacher';

interface TeacherRegistrationProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function TeacherRegistration({ onSuccess, onBack }: TeacherRegistrationProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await registerAsTeacher(inviteCode.trim());

    if (result.success) {
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } else {
      setError(result.error || 'Registration failed');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--success)]/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[var(--success)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Welcome, Teacher!</h2>
          <p className="text-[var(--text-tertiary)]">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="frost-card p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Teacher Registration</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Enter your invite code to access the teacher portal
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20">
            <p className="text-sm text-[var(--danger)] text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-[var(--text-secondary)]">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value); setError(''); }}
              placeholder="Enter your teacher invite code"
              className="w-full rounded-xl px-4 py-3.5 focus:outline-none transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="w-full py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--gradient-primary)',
              color: '#FFFFFF',
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Register as Teacher'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-[var(--text-muted)]">
          Contact your administrator if you don't have an invite code
        </p>
      </div>
    </div>
  );
}
