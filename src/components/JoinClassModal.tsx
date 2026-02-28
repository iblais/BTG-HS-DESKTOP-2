import { useState } from 'react';
import { X, Loader2, CheckCircle, Users } from 'lucide-react';
import { joinClassByCode } from '@/lib/teacher';

interface JoinClassModalProps {
  onClose: () => void;
  onJoined?: () => void;
}

export function JoinClassModal({ onClose, onJoined }: JoinClassModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a class code');
      return;
    }

    setLoading(true);
    setError('');

    const result = await joinClassByCode(trimmed);

    if (result.success) {
      setSuccess(result.className || 'your class');
      setTimeout(() => {
        onJoined?.();
        onClose();
      }, 2000);
    } else {
      setError(result.error || 'Failed to join class');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="frost-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Join a Class</h3>
              <p className="text-xs text-[var(--text-muted)]">Enter the code from your teacher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--success)]/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[var(--success)]" />
            </div>
            <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">Joined Successfully!</h4>
            <p className="text-sm text-[var(--text-tertiary)]">You've been added to {success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20">
                <p className="text-sm text-[var(--danger)] text-center">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 text-[var(--text-secondary)]">Class Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                placeholder="e.g. ABC-DEF-GHJ"
                maxLength={20}
                className="w-full rounded-xl px-4 py-3.5 text-center text-lg tracking-widest font-mono focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-medium transition-colors"
                style={{
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--gradient-primary)',
                  color: '#FFFFFF',
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Join Class'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
