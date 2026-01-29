import { useState } from 'react';
import {
  ArrowLeft, BookOpen, Search,
  ChevronDown, ChevronRight, CheckCircle, Download,
  FileText, TrendingUp
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button3D } from '../ui/Button3D';
import {
  CA_FINANCIAL_LITERACY_STANDARDS,
  getStandardCategories,
  generateStandardsCoverageReport,
  WEEK_TITLES,
  type LessonStandard
} from '@/lib/teacher';

interface StandardsViewProps {
  onBack: () => void;
  completedWeeks?: number[];
}

export function StandardsView({ onBack, completedWeeks = [] }: StandardsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'byWeek' | 'byCategory' | 'coverage'>('byWeek');

  const categories = getStandardCategories();
  const coverageReport = generateStandardsCoverageReport(completedWeeks);

  // Filter standards
  const filteredStandards = CA_FINANCIAL_LITERACY_STANDARDS.filter(standard => {
    const matchesSearch = searchQuery === '' ||
      standard.standard_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      standard.standard_description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || standard.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by week
  const standardsByWeek = filteredStandards.reduce((acc, standard) => {
    if (!acc[standard.week_number]) acc[standard.week_number] = [];
    acc[standard.week_number].push(standard);
    return acc;
  }, {} as Record<number, LessonStandard[]>);

  // Group by category
  const standardsByCategory = filteredStandards.reduce((acc, standard) => {
    if (!acc[standard.category]) acc[standard.category] = [];
    acc[standard.category].push(standard);
    return acc;
  }, {} as Record<string, LessonStandard[]>);

  const handleExportReport = () => {
    const report = `
CALIFORNIA STATE STANDARDS COVERAGE REPORT
Beyond The Game - Financial Literacy Curriculum
Generated: ${new Date().toLocaleDateString()}

COVERAGE SUMMARY
================
Total Standards: ${CA_FINANCIAL_LITERACY_STANDARDS.length}
Standards Covered: ${coverageReport.covered.length}
Coverage Percentage: ${coverageReport.coveragePercent}%

STANDARDS BY WEEK
=================
${Object.entries(standardsByWeek).map(([week, standards]) => `
Week ${week}: ${WEEK_TITLES[Number(week)] || 'Financial Literacy'}
${standards.map(s => `  - ${s.standard_code}: ${s.standard_description}`).join('\n')}
`).join('\n')}

STANDARDS BY CATEGORY
=====================
${Object.entries(standardsByCategory).map(([category, standards]) => `
${category}
${standards.map(s => `  - ${s.standard_code} (Week ${s.week_number}): ${s.standard_description}`).join('\n')}
`).join('\n')}
    `.trim();

    // Create and download file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `btg-standards-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <h2 className="text-xl font-bold text-white">California State Standards</h2>
            <p className="text-white/50 text-sm">Financial literacy curriculum alignment</p>
          </div>
        </div>

        <Button3D
          variant="secondary"
          size="sm"
          onClick={handleExportReport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button3D>
      </div>

      {/* Coverage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#4A5FFF]/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#4A5FFF]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{CA_FINANCIAL_LITERACY_STANDARDS.length}</p>
              <p className="text-white/50 text-sm">Total Standards</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#50D890]/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#50D890]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{coverageReport.covered.length}</p>
              <p className="text-white/50 text-sm">Standards Covered</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{coverageReport.coveragePercent}%</p>
              <p className="text-white/50 text-sm">Coverage Rate</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search standards..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF]"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-[#4A5FFF] appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#12162F]">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat} className="bg-[#12162F]">{cat}</option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex rounded-lg bg-white/[0.05] p-1">
          <button
            onClick={() => setViewMode('byWeek')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              viewMode === 'byWeek'
                ? 'bg-[#4A5FFF] text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            By Week
          </button>
          <button
            onClick={() => setViewMode('byCategory')}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              viewMode === 'byCategory'
                ? 'bg-[#4A5FFF] text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            By Category
          </button>
        </div>
      </div>

      {/* Standards List - By Week */}
      {viewMode === 'byWeek' && (
        <div className="space-y-3">
          {Object.entries(standardsByWeek)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([week, standards]) => {
              const weekNum = Number(week);
              const isExpanded = expandedWeek === weekNum;
              const isCompleted = completedWeeks.includes(weekNum);

              return (
                <GlassCard key={week} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCompleted ? 'bg-[#50D890]/20' : 'bg-[#4A5FFF]/20'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-[#50D890]" />
                        ) : (
                          <span className="text-[#4A5FFF] font-bold">{week}</span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">
                          Week {week}: {WEEK_TITLES[weekNum] || 'Financial Literacy'}
                        </p>
                        <p className="text-white/50 text-sm">
                          {standards.length} standard{standards.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        isCompleted
                          ? 'bg-[#50D890]/20 text-[#50D890]'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {isCompleted ? 'Covered' : 'Not Covered'}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {standards.map((standard, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                        >
                          <div className="flex items-start gap-3">
                            <span className="px-2 py-1 rounded bg-[#4A5FFF]/20 text-[#4A5FFF] text-xs font-mono whitespace-nowrap">
                              {standard.standard_code}
                            </span>
                            <div>
                              <p className="text-white/80 text-sm">{standard.standard_description}</p>
                              <p className="text-white/40 text-xs mt-1">
                                Module {standard.lesson_number} | {standard.category}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              );
            })}
        </div>
      )}

      {/* Standards List - By Category */}
      {viewMode === 'byCategory' && (
        <div className="space-y-3">
          {Object.entries(standardsByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, standards]) => {
              const isExpanded = expandedWeek === categories.indexOf(category);

              return (
                <GlassCard key={category} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedWeek(
                      isExpanded ? null : categories.indexOf(category)
                    )}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#FF6B35]" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{category}</p>
                        <p className="text-white/50 text-sm">
                          {standards.length} standard{standards.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {standards.map((standard, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                        >
                          <div className="flex items-start gap-3">
                            <span className="px-2 py-1 rounded bg-[#4A5FFF]/20 text-[#4A5FFF] text-xs font-mono whitespace-nowrap">
                              {standard.standard_code}
                            </span>
                            <div>
                              <p className="text-white/80 text-sm">{standard.standard_description}</p>
                              <p className="text-white/40 text-xs mt-1">
                                Week {standard.week_number}, Module {standard.lesson_number}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              );
            })}
        </div>
      )}

      {/* No Results */}
      {filteredStandards.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No standards match your search</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
            className="mt-2 text-[#4A5FFF] text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
