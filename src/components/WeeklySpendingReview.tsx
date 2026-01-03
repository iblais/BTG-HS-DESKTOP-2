import { useState } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button3D } from './ui/Button3D';
import { ProgressBar } from './ui/ProgressBar';

interface SpendingEntry {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'need' | 'want';
}

interface WeeklyBudget {
  needs: number;
  wants: number;
  savings: number;
}

interface WeeklySpendingReviewProps {
  onClose?: () => void;
}

const CATEGORIES = [
  { id: 'food', label: 'Food & Groceries', type: 'need' as const, color: '#50D890' },
  { id: 'transport', label: 'Transportation', type: 'need' as const, color: '#4A5FFF' },
  { id: 'utilities', label: 'Utilities', type: 'need' as const, color: '#00BFFF' },
  { id: 'housing', label: 'Housing', type: 'need' as const, color: '#9B59B6' },
  { id: 'health', label: 'Health', type: 'need' as const, color: '#FFD700' },
  { id: 'entertainment', label: 'Entertainment', type: 'want' as const, color: '#FF6B35' },
  { id: 'dining', label: 'Dining Out', type: 'want' as const, color: '#FF8E53' },
  { id: 'shopping', label: 'Shopping', type: 'want' as const, color: '#E91E63' },
  { id: 'subscriptions', label: 'Subscriptions', type: 'want' as const, color: '#673AB7' },
  { id: 'other', label: 'Other', type: 'want' as const, color: '#607D8B' }
];

export function WeeklySpendingReview({ onClose }: WeeklySpendingReviewProps) {
  const [entries, setEntries] = useState<SpendingEntry[]>(() => {
    const saved = localStorage.getItem('weeklySpending');
    return saved ? JSON.parse(saved) : [];
  });

  const [budget, setBudget] = useState<WeeklyBudget>(() => {
    const saved = localStorage.getItem('weeklyBudget');
    return saved ? JSON.parse(saved) : { needs: 300, wants: 150, savings: 100 };
  });

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [newEntry, setNewEntry] = useState({
    amount: '',
    category: 'food',
    description: ''
  });

  const [editBudget, setEditBudget] = useState(budget);

  // Get current week's entries
  const getCurrentWeekEntries = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfWeek;
    });
  };

  const weekEntries = getCurrentWeekEntries();

  // Calculate totals
  const needsTotal = weekEntries
    .filter(e => e.type === 'need')
    .reduce((sum, e) => sum + e.amount, 0);

  const wantsTotal = weekEntries
    .filter(e => e.type === 'want')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSpent = needsTotal + wantsTotal;

  // Category breakdown
  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: weekEntries
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0)
  })).filter(cat => cat.total > 0);

  const saveEntries = (updatedEntries: SpendingEntry[]) => {
    localStorage.setItem('weeklySpending', JSON.stringify(updatedEntries));
    setEntries(updatedEntries);
  };

  const saveBudget = (updatedBudget: WeeklyBudget) => {
    localStorage.setItem('weeklyBudget', JSON.stringify(updatedBudget));
    setBudget(updatedBudget);
  };

  const handleAddEntry = () => {
    if (!newEntry.amount || !newEntry.category) return;

    const category = CATEGORIES.find(c => c.id === newEntry.category);
    const entry: SpendingEntry = {
      id: Date.now().toString(),
      amount: parseFloat(newEntry.amount),
      category: newEntry.category,
      description: newEntry.description || category?.label || '',
      date: new Date().toISOString(),
      type: category?.type || 'want'
    };

    saveEntries([...entries, entry]);
    setNewEntry({ amount: '', category: 'food', description: '' });
    setShowAddEntry(false);
  };

  const handleDeleteEntry = (id: string) => {
    saveEntries(entries.filter(e => e.id !== id));
  };

  const handleSaveBudget = () => {
    saveBudget(editBudget);
    setShowBudgetEdit(false);
  };

  const needsProgress = budget.needs > 0 ? (needsTotal / budget.needs) * 100 : 0;
  const wantsProgress = budget.wants > 0 ? (wantsTotal / budget.wants) * 100 : 0;
  const totalBudget = budget.needs + budget.wants;
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return '#FF6B35';
    if (progress >= 80) return '#FFD700';
    return '#50D890';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#50D890] to-[#4ECDC4] flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Weekly Spending Review</h2>
            <p className="text-white/60 text-sm">Track and analyze your weekly expenses</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white text-sm">
            Close
          </button>
        )}
      </div>

      {/* Budget Overview */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Weekly Budget</h3>
          <button
            onClick={() => {
              setEditBudget(budget);
              setShowBudgetEdit(!showBudgetEdit);
            }}
            className="text-[#4A5FFF] text-sm hover:underline"
          >
            {showBudgetEdit ? 'Cancel' : 'Edit Budget'}
          </button>
        </div>

        {showBudgetEdit ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-1">Needs</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="number"
                    value={editBudget.needs}
                    onChange={(e) => setEditBudget({ ...editBudget, needs: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1">Wants</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="number"
                    value={editBudget.wants}
                    onChange={(e) => setEditBudget({ ...editBudget, wants: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1">Savings</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="number"
                    value={editBudget.savings}
                    onChange={(e) => setEditBudget({ ...editBudget, savings: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <Button3D onClick={handleSaveBudget} variant="primary" className="w-full">
              Save Budget
            </Button3D>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Needs */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white">Needs</span>
                <span className={needsProgress >= 100 ? 'text-[#FF6B35]' : 'text-white/60'}>
                  ${needsTotal.toFixed(2)} / ${budget.needs.toFixed(2)}
                </span>
              </div>
              <ProgressBar progress={Math.min(needsProgress, 100)} color={needsProgress >= 100 ? 'orange' : 'green'} />
            </div>

            {/* Wants */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white">Wants</span>
                <span className={wantsProgress >= 100 ? 'text-[#FF6B35]' : 'text-white/60'}>
                  ${wantsTotal.toFixed(2)} / ${budget.wants.toFixed(2)}
                </span>
              </div>
              <ProgressBar progress={Math.min(wantsProgress, 100)} color={wantsProgress >= 100 ? 'orange' : 'blue'} />
            </div>

            {/* Savings Goal */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-white">Savings Goal</span>
                <span className="text-[#50D890]">${budget.savings.toFixed(2)}/week</span>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: getStatusColor(overallProgress) }}>
            ${totalSpent.toFixed(0)}
          </div>
          <div className="text-white/60 text-xs">Total Spent</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-white">${(totalBudget - totalSpent).toFixed(0)}</div>
          <div className="text-white/60 text-xs">Remaining</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            {overallProgress > 100 ? (
              <TrendingDown className="w-5 h-5 text-[#FF6B35]" />
            ) : (
              <TrendingUp className="w-5 h-5 text-[#50D890]" />
            )}
            <span className="text-2xl font-bold" style={{ color: getStatusColor(overallProgress) }}>
              {Math.round(overallProgress)}%
            </span>
          </div>
          <div className="text-white/60 text-xs">Budget Used</div>
        </GlassCard>
      </div>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-[#4A5FFF]" />
            <h3 className="text-white font-bold">Spending by Category</h3>
          </div>

          <div className="space-y-3">
            {categoryTotals
              .sort((a, b) => b.total - a.total)
              .map((cat) => {
                const percentage = totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/80">{cat.label}</span>
                        <span className="text-white">${cat.total.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </GlassCard>
      )}

      {/* Recent Entries */}
      <GlassCard className="p-5">
        <h3 className="text-white font-bold mb-4">This Week's Expenses</h3>

        {weekEntries.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No expenses recorded this week</p>
            <p className="text-sm">Start tracking your spending!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {weekEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry) => {
                const category = CATEGORIES.find(c => c.id === entry.category);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        <DollarSign className="w-5 h-5" style={{ color: category?.color }} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{entry.description}</p>
                        <p className="text-white/60 text-xs">{formatDate(entry.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">${entry.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </GlassCard>

      {/* Add Entry Form */}
      {showAddEntry ? (
        <GlassCard className="p-6">
          <h3 className="text-white font-bold text-lg mb-4">Add Expense</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="number"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Category</label>
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4A5FFF]/50 focus:outline-none"
              >
                <optgroup label="Needs">
                  {CATEGORIES.filter(c => c.type === 'need').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Wants">
                  {CATEGORIES.filter(c => c.type === 'want').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Description (optional)</label>
              <input
                type="text"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="e.g., Groceries at Walmart"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button3D
                onClick={() => setShowAddEntry(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button3D>
              <Button3D
                onClick={handleAddEntry}
                variant="primary"
                className="flex-1"
                disabled={!newEntry.amount}
              >
                Add Expense
              </Button3D>
            </div>
          </div>
        </GlassCard>
      ) : (
        <button
          onClick={() => setShowAddEntry(true)}
          className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      )}

      {/* Weekly Insight */}
      <GlassCard className={`p-4 ${overallProgress > 100 ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#50D890]/10 border border-[#50D890]/20'}`}>
        <div className="flex items-start gap-3">
          {overallProgress > 100 ? (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-5 h-5 text-[#50D890] flex-shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className={`font-medium mb-1 ${overallProgress > 100 ? 'text-red-400' : 'text-[#50D890]'}`}>
              {overallProgress > 100 ? 'Budget Alert' : 'On Track!'}
            </h4>
            <p className="text-white/70 text-sm">
              {overallProgress > 100
                ? `You've exceeded your weekly budget by $${(totalSpent - totalBudget).toFixed(2)}. Review your spending to get back on track.`
                : `Great job! You have $${(totalBudget - totalSpent).toFixed(2)} remaining this week. Keep up the good work!`
              }
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
