import { useState } from 'react';
import { Target, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Plus, Trash2, Edit2, DollarSign } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button3D } from './ui/Button3D';
import { ProgressBar } from './ui/ProgressBar';

interface BudgetGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'debt' | 'purchase' | 'emergency';
  createdAt: string;
}

interface BudgetGoalCheckInProps {
  onClose?: () => void;
}

export function BudgetGoalCheckIn({ onClose }: BudgetGoalCheckInProps) {
  const [goals, setGoals] = useState<BudgetGoal[]>(() => {
    const saved = localStorage.getItem('budgetGoals');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'Emergency Fund',
        targetAmount: 1000,
        currentAmount: 350,
        deadline: '2025-06-01',
        category: 'emergency',
        createdAt: '2025-01-01'
      },
      {
        id: '2',
        name: 'New Laptop',
        targetAmount: 800,
        currentAmount: 200,
        deadline: '2025-08-01',
        category: 'purchase',
        createdAt: '2025-01-01'
      }
    ];
  });

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'savings' as BudgetGoal['category']
  });

  const [checkInAmount, setCheckInAmount] = useState<Record<string, string>>({});

  const saveGoals = (updatedGoals: BudgetGoal[]) => {
    localStorage.setItem('budgetGoals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) return;

    const goal: BudgetGoal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      deadline: newGoal.deadline,
      category: newGoal.category,
      createdAt: new Date().toISOString()
    };

    saveGoals([...goals, goal]);
    setNewGoal({ name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'savings' });
    setShowAddGoal(false);
  };

  const handleCheckIn = (goalId: string) => {
    const amount = parseFloat(checkInAmount[goalId] || '0');
    if (isNaN(amount) || amount === 0) return;

    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        return { ...goal, currentAmount: goal.currentAmount + amount };
      }
      return goal;
    });

    saveGoals(updatedGoals);
    setCheckInAmount({ ...checkInAmount, [goalId]: '' });
  };

  const handleDeleteGoal = (goalId: string) => {
    saveGoals(goals.filter(g => g.id !== goalId));
  };

  const getCategoryColor = (category: BudgetGoal['category']) => {
    switch (category) {
      case 'savings': return '#4A5FFF';
      case 'debt': return '#FF6B35';
      case 'purchase': return '#9B59B6';
      case 'emergency': return '#50D890';
      default: return '#4A5FFF';
    }
  };

  const getCategoryLabel = (category: BudgetGoal['category']) => {
    switch (category) {
      case 'savings': return 'Savings';
      case 'debt': return 'Debt Payoff';
      case 'purchase': return 'Purchase';
      case 'emergency': return 'Emergency Fund';
      default: return category;
    }
  };

  const getGoalStatus = (goal: BudgetGoal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const deadlineDate = new Date(goal.deadline);
    const today = new Date();
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (progress >= 100) return { status: 'completed', label: 'Completed!', color: '#50D890' };
    if (daysLeft < 0) return { status: 'overdue', label: 'Overdue', color: '#FF6B35' };
    if (daysLeft <= 7) return { status: 'urgent', label: `${daysLeft} days left`, color: '#FFD700' };
    return { status: 'on-track', label: `${daysLeft} days left`, color: '#4A5FFF' };
  };

  const totalProgress = goals.length > 0
    ? goals.reduce((sum, g) => sum + Math.min((g.currentAmount / g.targetAmount) * 100, 100), 0) / goals.length
    : 0;

  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4A5FFF] to-[#00BFFF] flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Budget Goals Check-In</h2>
            <p className="text-white/60 text-sm">Track progress toward your financial goals</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white text-sm">
            Close
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white">{goals.length}</div>
          <div className="text-white/60 text-sm">Active Goals</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-[#50D890]">{completedGoals}</div>
          <div className="text-white/60 text-sm">Completed</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-[#4A5FFF]">{Math.round(totalProgress)}%</div>
          <div className="text-white/60 text-sm">Avg Progress</div>
        </GlassCard>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const status = getGoalStatus(goal);
          const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

          return (
            <GlassCard key={goal.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${getCategoryColor(goal.category)}20`, color: getCategoryColor(goal.category) }}
                    >
                      {getCategoryLabel(goal.category)}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${status.color}20`, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{goal.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingGoal(editingGoal === goal.id ? null : goal.id)}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">
                    ${goal.currentAmount.toFixed(2)} of ${goal.targetAmount.toFixed(2)}
                  </span>
                  <span className="text-white font-medium">{Math.round(progress)}%</span>
                </div>
                <ProgressBar progress={progress} color={status.status === 'completed' ? 'green' : 'blue'} />
              </div>

              {/* Remaining */}
              {remaining > 0 && (
                <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                  {progress > 50 ? (
                    <TrendingUp className="w-4 h-4 text-[#50D890]" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-[#FF6B35]" />
                  )}
                  <span>${remaining.toFixed(2)} remaining to reach goal</span>
                </div>
              )}

              {/* Check-in Form */}
              {editingGoal === goal.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className="text-white/60 text-sm mb-2 block">Add to progress</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="number"
                        value={checkInAmount[goal.id] || ''}
                        onChange={(e) => setCheckInAmount({ ...checkInAmount, [goal.id]: e.target.value })}
                        placeholder="Amount"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none"
                      />
                    </div>
                    <Button3D
                      onClick={() => handleCheckIn(goal.id)}
                      variant="primary"
                    >
                      Add
                    </Button3D>
                  </div>
                </div>
              )}

              {/* Completed Celebration */}
              {status.status === 'completed' && (
                <div className="mt-4 p-3 bg-[#50D890]/10 border border-[#50D890]/30 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#50D890]" />
                  <span className="text-[#50D890] font-medium">Goal achieved! Great job!</span>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Add Goal Form */}
      {showAddGoal ? (
        <GlassCard className="p-6">
          <h3 className="text-white font-bold text-lg mb-4">Create New Goal</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Goal Name</label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="e.g., Emergency Fund, New Car"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Target Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    placeholder="1000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Starting Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="number"
                    value={newGoal.currentAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Target Date</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4A5FFF]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as BudgetGoal['category'] })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4A5FFF]/50 focus:outline-none"
                >
                  <option value="savings">Savings</option>
                  <option value="emergency">Emergency Fund</option>
                  <option value="purchase">Purchase</option>
                  <option value="debt">Debt Payoff</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button3D
                onClick={() => setShowAddGoal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button3D>
              <Button3D
                onClick={handleAddGoal}
                variant="primary"
                className="flex-1"
                disabled={!newGoal.name || !newGoal.targetAmount || !newGoal.deadline}
              >
                Create Goal
              </Button3D>
            </div>
          </div>
        </GlassCard>
      ) : (
        <button
          onClick={() => setShowAddGoal(true)}
          className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Goal</span>
        </button>
      )}

      {/* Tips */}
      <GlassCard className="p-4 bg-[#4A5FFF]/10 border border-[#4A5FFF]/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#4A5FFF] flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">Pro Tip</h4>
            <p className="text-white/70 text-sm">
              Set up automatic transfers on payday to make saving effortless. Even small consistent contributions add up over time!
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
