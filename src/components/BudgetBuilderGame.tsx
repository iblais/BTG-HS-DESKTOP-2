import React, { useState, useEffect } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Button3D } from './ui/Button3D';
import {
  ArrowLeft,
  Home,
  Utensils,
  Car,
  Gamepad2,
  PiggyBank,
  Zap,
  AlertTriangle,
  Lightbulb,
  Target,
  Award,
  RotateCcw,
  Eye,
  Percent
} from 'lucide-react';

interface BudgetCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  currentAmount: number;
  budgetLimit: number;
  minRange: number;
  maxRange: number;
  color: string;
  gradient: string;
}

interface MonthlyChallenge {
  id: string;
  title: string;
  description: string;
  cost: number;
  options: {
    id: string;
    text: string;
    effect: { category?: string; amount: number; points: number };
  }[];
}

interface MonthData {
  month: number;
  title: string;
  income: number;
  savingsGoal: number;
  challenge?: MonthlyChallenge;
  description: string;
}

interface GameProgress {
  currentMonth: number;
  score: number;
  savings: number;
  categories: BudgetCategory[];
}

interface BudgetBuilderGameProps {
  onBack: () => void;
  savedProgress?: GameProgress;
  onSaveProgress?: (progress: GameProgress) => void;
}

export const BudgetBuilderGame: React.FC<BudgetBuilderGameProps> = ({ onBack, savedProgress, onSaveProgress }) => {
  const [currentMonth, setCurrentMonth] = useState(savedProgress?.currentMonth || 1);
  const [score, setScore] = useState(savedProgress?.score || 0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [showMonthSummary, setShowMonthSummary] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [monthStarted, setMonthStarted] = useState(true);

  // Save progress when key values change
  useEffect(() => {
    onSaveProgress({
      currentMonth,
      score
    });
  }, [currentMonth, score, onSaveProgress]);

  const monthsData: MonthData[] = [
    {
      month: 1,
      title: "Student Budget",
      income: 1500,
      savingsGoal: 100,
      description: "Starting out with some part-time money - let's learn the basics!",
      challenge: {
        id: "laptop-repair",
        title: "UH OH - SURPRISE EXPENSE!",
        description: "Your laptop just died and you need it for school/work. What are you gonna do?",
        cost: 300,
        options: [
          { id: "emergency", text: "Use my emergency savings (smart move!)", effect: { category: "savings", amount: -300, points: 50 } },
          { id: "reduce", text: "Cut back on other stuff this month", effect: { amount: -300, points: 25 } },
          { id: "skip", text: "Just...not fix it? (risky)", effect: { amount: 0, points: -50 } },
          { id: "payment", text: "Do a payment plan ($50/month)", effect: { amount: -50, points: 10 } }
        ]
      }
    },
    {
      month: 2,
      title: "Part-Time Worker",
      income: 2000,
      savingsGoal: 200,
      description: "Making more money now - time to build some good habits!",
      challenge: {
        id: "social-pressure",
        title: "FRIEND DRAMA INCOMING",
        description: "Your friends are planning this expensive weekend trip and everyone's going. The pressure is real...",
        cost: 400,
        options: [
          { id: "decline", text: "Say no (it's tough but gotta stick to the budget)", effect: { amount: 0, points: 75 } },
          { id: "budget", text: "Suggest something cheaper instead", effect: { amount: -100, points: 50 } },
          { id: "partial", text: "Go but keep spending low", effect: { amount: -200, points: 25 } },
          { id: "full", text: "YOLO - go all in (consequences later?)", effect: { amount: -400, points: -25 } }
        ]
      }
    },
    {
      month: 3,
      title: "Part-Time Worker",
      income: 2500,
      savingsGoal: 250,
      description: "Your income's going up but so are the challenges - welcome to adulting!",
      challenge: {
        id: "car-trouble",
        title: "CAR TROUBLE - NOT GOOD",
        description: "The mechanic just hit you with an $800 repair bill. That's a LOT of money right now...",
        cost: 800,
        options: [
          { id: "repair", text: "Just pay and fix it (ouch but necessary)", effect: { category: "transportation", amount: 800, points: 30 } },
          { id: "sell", text: "Sell the car and take the bus instead", effect: { category: "transportation", amount: -150, points: 50 } },
          { id: "loan", text: "Take out a loan (debt alert!)", effect: { amount: -800, points: -25 } },
          { id: "ignore", text: "Keep driving it broken (dangerous move)", effect: { amount: 0, points: -75 } }
        ]
      }
    }
  ];

  const [categories, setCategories] = useState<BudgetCategory[]>([
    {
      id: 'housing',
      name: 'Housing',
      icon: <Home className="w-5 h-5" />,
      currentAmount: 600,
      budgetLimit: 700,
      minRange: 400,
      maxRange: 1200,
      color: '#4A5FFF',
      gradient: 'from-[#4A5FFF] to-[#00BFFF]'
    },
    {
      id: 'food',
      name: 'Food',
      icon: <Utensils className="w-5 h-5" />,
      currentAmount: 250,
      budgetLimit: 350,
      minRange: 150,
      maxRange: 600,
      color: '#50D890',
      gradient: 'from-[#50D890] to-[#4ECDC4]'
    },
    {
      id: 'transportation',
      name: 'Transport',
      icon: <Car className="w-5 h-5" />,
      currentAmount: 100,
      budgetLimit: 150,
      minRange: 50,
      maxRange: 400,
      color: '#9B59B6',
      gradient: 'from-[#9B59B6] to-[#8E44AD]'
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      icon: <Gamepad2 className="w-5 h-5" />,
      currentAmount: 75,
      budgetLimit: 100,
      minRange: 0,
      maxRange: 300,
      color: '#FF6B35',
      gradient: 'from-[#FF6B35] to-[#FF8E53]'
    },
    {
      id: 'savings',
      name: 'Savings',
      icon: <PiggyBank className="w-5 h-5" />,
      currentAmount: 150,
      budgetLimit: 100,
      minRange: 50,
      maxRange: 500,
      color: '#FFD700',
      gradient: 'from-[#FFD700] to-[#FFA500]'
    },
    {
      id: 'utilities',
      name: 'Utilities',
      icon: <Zap className="w-5 h-5" />,
      currentAmount: 75,
      budgetLimit: 100,
      minRange: 50,
      maxRange: 150,
      color: '#4ECDC4',
      gradient: 'from-[#4ECDC4] to-[#45B7C5]'
    }
  ]);

  const currentMonthData = monthsData[currentMonth - 1];
  const totalSpent = categories.reduce((sum, cat) => sum + cat.currentAmount, 0);
  const remaining = currentMonthData.income - totalSpent;
  const savingsAmount = categories.find(cat => cat.id === 'savings')?.currentAmount || 0;

  const updateCategoryAmount = (categoryId: string, newAmount: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, currentAmount: Math.max(cat.minRange, Math.min(cat.maxRange, newAmount)) }
        : cat
    ));
  };

  const getBudgetHealth = () => {
    if (remaining >= 0 && savingsAmount >= currentMonthData.savingsGoal * 0.8) return 'healthy';
    if (remaining >= 0) return 'okay';
    return 'danger';
  };

  const getHealthColor = () => {
    const health = getBudgetHealth();
    if (health === 'healthy') return '#50D890';
    if (health === 'okay') return '#FFD700';
    return '#FF4757';
  };

  const getHealthMessage = () => {
    const health = getBudgetHealth();
    if (health === 'healthy') return "You're Crushing It!";
    if (health === 'okay') return "Getting a Bit Tight";
    return "Uh Oh - Over Budget!";
  };

  const calculateScore = () => {
    let monthScore = 0;
    
    // Base points for balanced budget
    if (remaining >= 0) monthScore += 100;
    
    // Savings goal bonus
    if (savingsAmount >= currentMonthData.savingsGoal) monthScore += 50;
    
    // Perfect allocation bonus
    if (remaining >= 0 && remaining <= 50) monthScore += 25;
    
    // Emergency fund bonus
    if (savingsAmount >= currentMonthData.income * 0.1) monthScore += 25;

    return monthScore;
  };

  const generateBudgetTip = () => {
    const housingPct = (categories.find(cat => cat.id === 'housing')?.currentAmount || 0) / currentMonthData.income * 100;
    const foodPct = (categories.find(cat => cat.id === 'food')?.currentAmount || 0) / currentMonthData.income * 100;
    const savingsPct = savingsAmount / currentMonthData.income * 100;

    if (housingPct > 35) {
      return "Real talk - you're spending " + Math.round(housingPct) + "% on housing. Most experts say keep it under 30%. Maybe get a roommate or look for something cheaper?";
    }
    if (foodPct > 15) {
      return "Food's eating up " + Math.round(foodPct) + "% of your income (see what I did there?). Try meal prepping and cooking at home - aim for 10-12%.";
    }
    if (savingsPct < 10) {
      return "You're only saving " + Math.round(savingsPct) + "% right now. That's kinda risky - try to get that up to at least 10-20% so you've got a safety net.";
    }
    if (remaining < 0) {
      return "Yikes, you're over budget by $" + Math.abs(remaining) + ". Try cutting back on entertainment or food first - those are usually the easiest to adjust.";
    }
    return "Okay, this is looking pretty solid! Keep building that emergency fund and you'll be golden!";
  };

  const applyFiftyThirtyTwentyRule = () => {
    const income = currentMonthData.income;
    const needs = income * 0.5; // 50% for needs
    const wants = income * 0.3; // 30% for wants
    const savings = income * 0.2; // 20% for savings

    setCategories(prev => prev.map(cat => {
      switch (cat.id) {
        case 'housing':
          return { ...cat, currentAmount: Math.min(needs * 0.6, cat.maxRange) };
        case 'food':
          return { ...cat, currentAmount: Math.min(needs * 0.3, cat.maxRange) };
        case 'utilities':
          return { ...cat, currentAmount: Math.min(needs * 0.1, cat.maxRange) };
        case 'transportation':
          return { ...cat, currentAmount: Math.min(wants * 0.6, cat.maxRange) };
        case 'entertainment':
          return { ...cat, currentAmount: Math.min(wants * 0.4, cat.maxRange) };
        case 'savings':
          return { ...cat, currentAmount: Math.min(savings, cat.maxRange) };
        default:
          return cat;
      }
    }));
    setScore((prev: number) => prev - 25); // Small penalty for using auto-balance
  };

  const completeMonth = () => {
    const monthScore = calculateScore();
    setScore((prev: number) => prev + monthScore);
    setShowMonthSummary(true);
  };

  const nextMonth = () => {
    if (currentMonth < monthsData.length) {
      setCurrentMonth((prev: number) => prev + 1);
      setShowMonthSummary(false);
      setShowChallenge(false);
      setChallengeCompleted(false);
      setMonthStarted(true);

      // Update categories for new month
      const newMonthData = monthsData[currentMonth];
      setCategories((prev: BudgetCategory[]) => prev.map(cat => ({
        ...cat,
        currentAmount: Math.round(cat.currentAmount * (newMonthData.income / currentMonthData.income))
      })));
    }
  };

  const resetGame = () => {
    setCurrentMonth(1);
    setScore(0);
    setShowChallenge(false);
    setChallengeCompleted(false);
    setShowMonthSummary(false);
    setShowTip(false);
    setCategories([
      {
        id: 'housing',
        name: 'Housing',
        icon: <Home className="w-5 h-5" />,
        currentAmount: 600,
        budgetLimit: 700,
        minRange: 400,
        maxRange: 1200,
        color: '#4A5FFF',
        gradient: 'from-[#4A5FFF] to-[#00BFFF]'
      },
      {
        id: 'food',
        name: 'Food',
        icon: <Utensils className="w-5 h-5" />,
        currentAmount: 250,
        budgetLimit: 350,
        minRange: 150,
        maxRange: 600,
        color: '#50D890',
        gradient: 'from-[#50D890] to-[#4ECDC4]'
      },
      {
        id: 'transportation',
        name: 'Transport',
        icon: <Car className="w-5 h-5" />,
        currentAmount: 100,
        budgetLimit: 150,
        minRange: 50,
        maxRange: 400,
        color: '#9B59B6',
        gradient: 'from-[#9B59B6] to-[#8E44AD]'
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        icon: <Gamepad2 className="w-5 h-5" />,
        currentAmount: 75,
        budgetLimit: 100,
        minRange: 0,
        maxRange: 300,
        color: '#FF6B35',
        gradient: 'from-[#FF6B35] to-[#FF8E53]'
      },
      {
        id: 'savings',
        name: 'Savings',
        icon: <PiggyBank className="w-5 h-5" />,
        currentAmount: 150,
        budgetLimit: 100,
        minRange: 50,
        maxRange: 500,
        color: '#FFD700',
        gradient: 'from-[#FFD700] to-[#FFA500]'
      },
      {
        id: 'utilities',
        name: 'Utilities',
        icon: <Zap className="w-5 h-5" />,
        currentAmount: 75,
        budgetLimit: 100,
        minRange: 50,
        maxRange: 150,
        color: '#4ECDC4',
        gradient: 'from-[#4ECDC4] to-[#45B7C5]'
      }
    ]);
  };

  // Show challenge after 10 seconds
  useEffect(() => {
    if (monthStarted && !showChallenge && !challengeCompleted && currentMonthData.challenge) {
      const timer = setTimeout(() => {
        setShowChallenge(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [monthStarted, showChallenge, challengeCompleted, currentMonthData.challenge]);

  if (showMonthSummary) {
    const monthScore = calculateScore();
    const accuracy = savingsAmount >= currentMonthData.savingsGoal ? 100 : Math.round((savingsAmount / currentMonthData.savingsGoal) * 100);
    
    return (
      <div className="min-h-screen bg-[#0A0E27] p-6">
        {/* Status Bar */}
        <div className="flex justify-between items-center pt-3 pb-2 text-white text-sm">
          <span>9:41</span>
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-3 bg-white/50 rounded-full"></div>
            </div>
            <svg className="w-4 h-3 text-white" fill="currentColor" viewBox="0 0 20 12">
              <path d="M2 3h16v6H2z"/>
              <path d="M18.5 5.5h1v1h-1z" fill="currentColor" opacity="0.6"/>
            </svg>
            <div className="w-6 h-3 border border-white rounded-sm relative">
              <div className="w-4 h-1.5 bg-green-400 rounded-sm absolute top-0.5 left-0.5"></div>
            </div>
          </div>
        </div>

        <GlassCard className="p-6">
          <div className="text-center mb-6">
            <Award className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
            <h1 className="text-white mb-2">MONTH {currentMonth} RESULTS</h1>
            
            <div className="text-4xl font-bold text-[#4A5FFF] mb-2">{monthScore}</div>
            <div className="text-white/70">Points Earned</div>
            
            <div className="flex justify-center mt-4">
              <div className={`px-4 py-2 rounded-lg font-bold ${
                accuracy >= 90 ? 'bg-[#50D890] text-white' :
                accuracy >= 70 ? 'bg-[#FFD700] text-black' :
                'bg-[#FF6B35] text-white'
              }`}>
                Grade: {accuracy >= 90 ? 'A' : accuracy >= 70 ? 'B' : 'C'}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#50D890]">${savingsAmount}</div>
              <div className="text-white/70 text-sm">Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#4A5FFF]">{accuracy}%</div>
              <div className="text-white/70 text-sm">Goal Reached</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-white font-bold mb-3">Spending Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Biggest expense:</span>
                <span className="text-white">Housing ({Math.round((categories.find(cat => cat.id === 'housing')?.currentAmount || 0) / currentMonthData.income * 100)}%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Budget balance:</span>
                <span className={`${remaining >= 0 ? 'text-[#50D890]' : 'text-[#FF4757]'}`}>
                  ${remaining >= 0 ? '+' : ''}${remaining}
                </span>
              </div>
            </div>
          </div>
          
          {savingsAmount >= currentMonthData.savingsGoal && (
            <div className="mb-6 p-4 bg-[#50D890]/20 rounded-lg border border-[#50D890]/30">
              <div className="text-[#50D890] font-bold mb-1">🏆 Achievement Unlocked!</div>
              <div className="text-white text-sm">"Savings Superstar" - You actually hit your goal!</div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {currentMonth < monthsData.length ? (
              <Button3D variant="primary" onClick={nextMonth}>
                Next Month
              </Button3D>
            ) : (
              <Button3D variant="primary" onClick={resetGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button3D>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] pb-6">
      {/* Status Bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-2 text-white text-sm">
        <span>9:41</span>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white rounded-full"></div>
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
          <svg className="w-4 h-3 text-white" fill="currentColor" viewBox="0 0 20 12">
            <path d="M2 3h16v6H2z"/>
            <path d="M18.5 5.5h1v1h-1z" fill="currentColor" opacity="0.6"/>
          </svg>
          <div className="w-6 h-3 border border-white rounded-sm relative">
            <div className="w-4 h-1.5 bg-green-400 rounded-sm absolute top-0.5 left-0.5"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="p-2 rounded-lg glass-card">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Budget Builder</h1>
          <div className="w-8"></div>
        </div>
        
        {/* Month Info */}
        <GlassCard className="p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-white font-bold">{currentMonthData.title}</h2>
              <p className="text-white/70 text-sm">{currentMonthData.description}</p>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">Month {currentMonth}</div>
              <div className="text-white/70 text-sm">of {monthsData.length}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-[#50D890] font-bold text-xl">${currentMonthData.income.toLocaleString()}</div>
              <div className="text-white/70 text-xs">Monthly Income</div>
            </div>
            <div className="text-center">
              <div className={`font-bold text-xl ${remaining >= 0 ? 'text-[#50D890]' : 'text-[#FF4757]'}`}>
                ${remaining >= 0 ? '+' : ''}${remaining}
              </div>
              <div className="text-white/70 text-xs">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-[#FFD700] font-bold text-xl">{score}</div>
              <div className="text-white/70 text-xs">Score</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Budget Health Indicator */}
      <div className="px-6 mb-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getHealthColor() }}></div>
              <span className="text-white font-medium">{getHealthMessage()}</span>
            </div>
            <div className={`text-sm font-bold`} style={{ color: getHealthColor() }}>
              {Math.round((totalSpent / currentMonthData.income) * 100)}% used
            </div>
          </div>
          
          {/* Health Meter */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500 rounded-full"
              style={{ 
                width: `${Math.min((totalSpent / currentMonthData.income) * 100, 100)}%`,
                backgroundColor: getHealthColor()
              }}
            />
          </div>
        </GlassCard>
      </div>

      {/* Central Donut Chart */}
      <div className="px-6 mb-6">
        <GlassCard className="p-4">
          <div className="relative w-48 h-48 mx-auto mb-4">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {categories.map((category, index) => {
                const total = categories.reduce((sum, cat) => sum + cat.currentAmount, 0);
                const percentage = total > 0 ? (category.currentAmount / total) * 100 : 0;
                const angle = (percentage / 100) * 360;
                const startAngle = categories.slice(0, index).reduce((sum, cat) => {
                  const catPercentage = total > 0 ? (cat.currentAmount / total) * 100 : 0;
                  return sum + (catPercentage / 100) * 360;
                }, 0);
                
                const radius = 80;
                const centerX = 100;
                const centerY = 100;
                
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = ((startAngle + angle) * Math.PI) / 180;
                
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);
                
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                if (percentage < 1) return null;
                
                return (
                  <path
                    key={category.id}
                    d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={category.color}
                    className="transition-all duration-300 hover:opacity-80"
                    opacity="0.8"
                  />
                );
              })}
              
              {/* Center circle */}
              <circle
                cx="100"
                cy="100"
                r="50"
                fill="#0A0E27"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-white font-bold text-lg">${totalSpent}</div>
              <div className="text-white/70 text-xs">Total Spent</div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="grid grid-cols-3 gap-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="text-white text-xs truncate">{category.name}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Budget Categories with Sliders */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Adjust Budget</h3>
          <div className="flex space-x-2">
            <Button3D 
              variant="secondary" 
              size="sm"
              onClick={() => {
                setCurrentTip(generateBudgetTip());
                setShowTip(true);
              }}
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Tip
            </Button3D>
            <Button3D 
              variant="secondary" 
              size="sm"
              onClick={applyFiftyThirtyTwentyRule}
            >
              <Percent className="w-4 h-4 mr-1" />
              50/30/20
            </Button3D>
          </div>
        </div>
        
        <div className="space-y-4">
          {categories.map(category => (
            <GlassCard key={category.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${category.gradient}`}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <div className="text-white font-medium">{category.name}</div>
                    <div className="text-white/70 text-sm">
                      ${category.minRange} - ${category.maxRange}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-bold">${category.currentAmount}</div>
                  <div className="text-white/70 text-sm">
                    {Math.round((category.currentAmount / currentMonthData.income) * 100)}%
                  </div>
                </div>
              </div>
              
              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min={category.minRange}
                  max={category.maxRange}
                  value={category.currentAmount}
                  onChange={(e) => updateCategoryAmount(category.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none slider"
                  style={{
                    background: `linear-gradient(to right, ${category.color} 0%, ${category.color} ${((category.currentAmount - category.minRange) / (category.maxRange - category.minRange)) * 100}%, rgba(255,255,255,0.1) ${((category.currentAmount - category.minRange) / (category.maxRange - category.minRange)) * 100}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
              </div>
              
              {/* Budget vs Actual */}
              {category.currentAmount > category.budgetLimit && (
                <div className="flex items-center space-x-1 mt-2">
                  <AlertTriangle className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-[#FF6B35] text-xs">
                    ${category.currentAmount - category.budgetLimit} over budget
                  </span>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Button3D variant="primary" onClick={completeMonth}>
            <Target className="w-4 h-4 mr-2" />
            Complete Month
          </Button3D>
          <Button3D variant="secondary" onClick={() => setShowChallenge(true)}>
            <Eye className="w-4 h-4 mr-2" />
            View Challenge
          </Button3D>
        </div>
      </div>

      {/* Savings Goal Progress */}
      <div className="px-6 mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-medium">Savings Goal</h4>
            <div className="text-white/70 text-sm">
              ${savingsAmount} / ${currentMonthData.savingsGoal}
            </div>
          </div>
          
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-500"
              style={{ width: `${Math.min((savingsAmount / currentMonthData.savingsGoal) * 100, 100)}%` }}
            />
          </div>
          
          <div className="text-center">
            <span className={`text-sm font-bold ${savingsAmount >= currentMonthData.savingsGoal ? 'text-[#50D890]' : 'text-white/70'}`}>
              {Math.round((savingsAmount / currentMonthData.savingsGoal) * 100)}% of goal
              {savingsAmount >= currentMonthData.savingsGoal && ' ✓'}
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Monthly Challenge Modal */}
      {showChallenge && currentMonthData.challenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <GlassCard className="p-6 max-w-sm w-full">
            <div className="text-center mb-4">
              <AlertTriangle className="w-12 h-12 text-[#FF6B35] mx-auto mb-2" />
              <h3 className="text-white font-bold text-lg">{currentMonthData.challenge.title}</h3>
              <p className="text-white/70 text-sm mt-2">{currentMonthData.challenge.description}</p>
              <div className="text-[#FF6B35] font-bold text-xl mt-2">
                Cost: ${currentMonthData.challenge.cost}
              </div>
            </div>
            
            <div className="space-y-3">
              {currentMonthData.challenge.options.map(option => (
                <Button3D 
                  key={option.id}
                  variant="secondary"
                  className="w-full text-left text-sm"
                  onClick={() => {
                    // Apply effect
                    if (option.effect.category) {
                      updateCategoryAmount(option.effect.category, 
                        (categories.find(cat => cat.id === option.effect.category)?.currentAmount || 0) + option.effect.amount);
                    }
                    setScore((prev: number) => prev + option.effect.points);
                    setChallengeCompleted(true);
                    setShowChallenge(false);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span>{option.text}</span>
                    <span className={`text-xs ${option.effect.points >= 0 ? 'text-[#50D890]' : 'text-[#FF4757]'}`}>
                      {option.effect.points > 0 ? '+' : ''}{option.effect.points} pts
                    </span>
                  </div>
                </Button3D>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Budget Tip Modal */}
      {showTip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <GlassCard className="p-6 max-w-sm w-full">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-6 h-6 text-[#FFD700]" />
              <h3 className="text-white font-bold">Budget Tip</h3>
            </div>
            
            <p className="text-white text-sm leading-relaxed mb-6">{currentTip}</p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button3D variant="secondary" onClick={() => setShowTip(false)}>
                Dismiss
              </Button3D>
              <Button3D variant="primary" onClick={() => setShowTip(false)}>
                Got it!
              </Button3D>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};