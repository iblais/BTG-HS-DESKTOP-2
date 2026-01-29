import { useState } from 'react';
import {
  ArrowLeft, Plus, Trash2,
  Star, ChevronDown, ChevronUp, Check, X
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button3D } from '../ui/Button3D';
import {
  DEFAULT_WRITING_RUBRIC,
  type GradingRubric,
  type RubricCriterion
} from '@/lib/teacher';

interface RubricManagerProps {
  onBack: () => void;
}

export function RubricManager({ onBack }: RubricManagerProps) {
  const [rubrics, setRubrics] = useState<GradingRubric[]>([
    DEFAULT_WRITING_RUBRIC
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_editingRubric, _setEditingRubric] = useState<GradingRubric | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedRubric, setExpandedRubric] = useState<string | null>(DEFAULT_WRITING_RUBRIC.id);

  const [newRubricName, setNewRubricName] = useState('');
  const [newRubricDescription, setNewRubricDescription] = useState('');
  const [newCriteria, setNewCriteria] = useState<RubricCriterion[]>([
    { name: '', description: '', max_points: 25 }
  ]);

  const handleAddCriterion = () => {
    setNewCriteria(prev => [
      ...prev,
      { name: '', description: '', max_points: 25 }
    ]);
  };

  const handleRemoveCriterion = (index: number) => {
    setNewCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (
    index: number,
    field: keyof RubricCriterion,
    value: string | number
  ) => {
    setNewCriteria(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: value } : c
    ));
  };

  const handleCreateRubric = () => {
    if (!newRubricName.trim()) return;

    const validCriteria = newCriteria.filter(c => c.name.trim());
    if (validCriteria.length === 0) return;

    const totalPoints = validCriteria.reduce((sum, c) => sum + c.max_points, 0);

    const newRubric: GradingRubric = {
      id: `custom-${Date.now()}`,
      name: newRubricName.trim(),
      description: newRubricDescription.trim() || undefined,
      criteria: validCriteria,
      total_points: totalPoints,
      created_at: new Date().toISOString()
    };

    setRubrics(prev => [...prev, newRubric]);

    // Save to localStorage
    const savedRubrics = JSON.parse(localStorage.getItem('btg_custom_rubrics') || '[]');
    savedRubrics.push(newRubric);
    localStorage.setItem('btg_custom_rubrics', JSON.stringify(savedRubrics));

    // Reset form
    setNewRubricName('');
    setNewRubricDescription('');
    setNewCriteria([{ name: '', description: '', max_points: 25 }]);
    setShowCreateModal(false);
  };

  const handleDeleteRubric = (rubricId: string) => {
    if (rubricId === DEFAULT_WRITING_RUBRIC.id) return; // Can't delete default

    setRubrics(prev => prev.filter(r => r.id !== rubricId));

    // Update localStorage
    const savedRubrics = JSON.parse(localStorage.getItem('btg_custom_rubrics') || '[]');
    const filtered = savedRubrics.filter((r: GradingRubric) => r.id !== rubricId);
    localStorage.setItem('btg_custom_rubrics', JSON.stringify(filtered));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Grading Rubrics</h2>
            <p className="text-white/50 text-sm">Manage rubrics for writing assignments</p>
          </div>
        </div>

        <Button3D
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Rubric
        </Button3D>
      </div>

      {/* Rubrics List */}
      <div className="space-y-4">
        {rubrics.map(rubric => (
          <GlassCard key={rubric.id} className="overflow-hidden">
            {/* Rubric Header */}
            <button
              onClick={() => setExpandedRubric(
                expandedRubric === rubric.id ? null : rubric.id
              )}
              className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{rubric.name}</p>
                    {rubric.id === DEFAULT_WRITING_RUBRIC.id && (
                      <span className="px-2 py-0.5 rounded-full bg-[#4A5FFF]/20 text-[#4A5FFF] text-xs">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-sm">
                    {rubric.criteria.length} criteria | {rubric.total_points} points total
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {rubric.id !== DEFAULT_WRITING_RUBRIC.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRubric(rubric.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {expandedRubric === rubric.id ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {expandedRubric === rubric.id && (
              <div className="px-5 pb-5 space-y-3">
                {rubric.description && (
                  <p className="text-white/60 text-sm px-4 py-2 bg-white/[0.02] rounded-lg">
                    {rubric.description}
                  </p>
                )}

                {/* Criteria Table */}
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/[0.03] text-white/50 text-sm font-medium">
                    <div className="col-span-3">Criterion</div>
                    <div className="col-span-7">Description</div>
                    <div className="col-span-2 text-center">Max Points</div>
                  </div>

                  {rubric.criteria.map((criterion, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border-t border-white/[0.06] items-center"
                    >
                      <div className="col-span-3 text-white font-medium">
                        {criterion.name}
                      </div>
                      <div className="col-span-7 text-white/70 text-sm">
                        {criterion.description}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="px-3 py-1 rounded-full bg-[#4A5FFF]/20 text-[#4A5FFF] text-sm font-medium">
                          {criterion.max_points}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Total Row */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                    <div className="col-span-10 text-right text-white font-medium">
                      Total Points:
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="px-3 py-1 rounded-full bg-[#50D890]/20 text-[#50D890] text-sm font-bold">
                        {rubric.total_points}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Create Rubric Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <GlassCard className="w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create New Rubric</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-white/[0.1] transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Rubric Name</label>
                <input
                  type="text"
                  value={newRubricName}
                  onChange={(e) => setNewRubricName(e.target.value)}
                  placeholder="e.g., Essay Writing Rubric"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/70 text-sm mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={newRubricDescription}
                  onChange={(e) => setNewRubricDescription(e.target.value)}
                  placeholder="Brief description of when to use this rubric"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF]"
                />
              </div>

              {/* Criteria */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white/70 text-sm">Criteria</label>
                  <button
                    onClick={handleAddCriterion}
                    className="flex items-center gap-1 text-[#4A5FFF] text-sm hover:text-[#6B7AFF]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Criterion
                  </button>
                </div>

                <div className="space-y-3">
                  {newCriteria.map((criterion, index) => (
                    <div key={index} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={criterion.name}
                            onChange={(e) => handleCriterionChange(index, 'name', e.target.value)}
                            placeholder="Criterion name"
                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF] text-sm"
                          />
                          <input
                            type="text"
                            value={criterion.description}
                            onChange={(e) => handleCriterionChange(index, 'description', e.target.value)}
                            placeholder="Description of what to look for"
                            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF] text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <label className="text-white/40 text-xs">Points</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={criterion.max_points}
                              onChange={(e) => handleCriterionChange(index, 'max_points', Number(e.target.value))}
                              className="w-16 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-2 text-white text-center focus:outline-none focus:border-[#4A5FFF] text-sm"
                            />
                          </div>
                          {newCriteria.length > 1 && (
                            <button
                              onClick={() => handleRemoveCriterion(index)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Preview */}
                <div className="mt-3 text-right text-white/50 text-sm">
                  Total Points: {newCriteria.reduce((sum, c) => sum + c.max_points, 0)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button3D
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button3D>
                <Button3D
                  variant="primary"
                  onClick={handleCreateRubric}
                  disabled={!newRubricName.trim() || newCriteria.filter(c => c.name.trim()).length === 0}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Create Rubric
                </Button3D>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
