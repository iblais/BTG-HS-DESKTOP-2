import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw, Award, Clock, Target, BookOpen } from 'lucide-react';
import { logo } from '@/assets';

interface ExamQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface FinalExamScreenProps {
  onBack: () => void;
  onComplete: (score: number, passed: boolean) => void;
}

// Comprehensive 50-question final exam covering all course topics
const examQuestions: ExamQuestion[] = [
  // Week 1: Income & Budgeting Basics (Questions 1-5)
  {
    id: 1,
    category: "Income & Budgeting",
    question: "Marcus earns $15/hour and works 25 hours per week. What is his gross monthly income (before taxes)?",
    options: ["$375", "$750", "$1,500", "$1,875"],
    correctAnswer: 2,
    explanation: "$15 x 25 = $375/week. $375 x 4 weeks = $1,500/month gross income."
  },
  {
    id: 2,
    category: "Income & Budgeting",
    question: "In the 50/30/20 budgeting rule, what does the '20' represent?",
    options: ["Percentage for wants", "Percentage for savings", "Percentage for needs", "Percentage for entertainment"],
    correctAnswer: 1,
    explanation: "50% needs, 30% wants, 20% savings. The 20 represents the savings portion of your budget."
  },
  {
    id: 3,
    category: "Income & Budgeting",
    question: "Which of the following is considered a 'need' rather than a 'want'?",
    options: ["Streaming subscriptions", "Designer clothing", "Groceries", "Concert tickets"],
    correctAnswer: 2,
    explanation: "Groceries are essential for survival. Streaming, designer items, and concerts are wants."
  },
  {
    id: 4,
    category: "Income & Budgeting",
    question: "If your gross pay is $2,000 and taxes take 20%, what is your net pay?",
    options: ["$400", "$1,600", "$1,800", "$2,000"],
    correctAnswer: 1,
    explanation: "20% of $2,000 = $400 in taxes. $2,000 - $400 = $1,600 net pay."
  },
  {
    id: 5,
    category: "Income & Budgeting",
    question: "What is the difference between gross and net income?",
    options: ["There is no difference", "Gross is after taxes, net is before", "Net is after taxes and deductions", "Gross includes only bonuses"],
    correctAnswer: 2,
    explanation: "Gross is your total earnings before anything is taken out. Net is what you actually receive after taxes and deductions."
  },

  // Week 2: Side Hustles & Extra Income (Questions 6-10)
  {
    id: 6,
    category: "Side Hustles",
    question: "Which side hustle typically has the lowest startup cost?",
    options: ["Food truck business", "Tutoring", "Real estate investing", "Opening a retail store"],
    correctAnswer: 1,
    explanation: "Tutoring requires minimal startup costs - mainly your knowledge and time. The others require significant capital."
  },
  {
    id: 7,
    category: "Side Hustles",
    question: "What is passive income?",
    options: ["Income from your main job", "Money earned without active work", "Government assistance", "Borrowed money"],
    correctAnswer: 1,
    explanation: "Passive income is money earned with minimal ongoing effort, like investments, royalties, or rental income."
  },
  {
    id: 8,
    category: "Side Hustles",
    question: "You charge $30/hour for graphic design and work 10 hours per week. What's your monthly side hustle income?",
    options: ["$300", "$600", "$1,200", "$3,000"],
    correctAnswer: 2,
    explanation: "$30 x 10 hours = $300/week. $300 x 4 weeks = $1,200/month."
  },
  {
    id: 9,
    category: "Side Hustles",
    question: "What's the FIRST step before starting any side hustle?",
    options: ["Borrow money to invest", "Identify your skills and market demand", "Quit your main job", "Buy expensive equipment"],
    correctAnswer: 1,
    explanation: "Always identify what skills you have and whether there's demand before investing time or money."
  },
  {
    id: 10,
    category: "Side Hustles",
    question: "Which platform is best for selling handmade crafts online?",
    options: ["LinkedIn", "Etsy", "Indeed", "Glassdoor"],
    correctAnswer: 1,
    explanation: "Etsy is specifically designed for handmade, vintage, and craft items."
  },

  // Week 3-4: Credit Basics & Building Credit (Questions 11-18)
  {
    id: 11,
    category: "Credit",
    question: "What credit score range is considered 'Good'?",
    options: ["300-579", "580-669", "670-739", "740-850"],
    correctAnswer: 2,
    explanation: "670-739 is considered 'Good' credit. 740+ is 'Excellent'."
  },
  {
    id: 12,
    category: "Credit",
    question: "What percentage of your credit limit should you ideally use to maintain a good score?",
    options: ["Under 30%", "50%", "75%", "100%"],
    correctAnswer: 0,
    explanation: "Credit utilization under 30% is recommended. Under 10% is even better for optimal scores."
  },
  {
    id: 13,
    category: "Credit",
    question: "How long does a missed payment stay on your credit report?",
    options: ["1 year", "3 years", "7 years", "Forever"],
    correctAnswer: 2,
    explanation: "Negative items like missed payments remain on your credit report for 7 years."
  },
  {
    id: 14,
    category: "Credit",
    question: "Which factor has the BIGGEST impact on your credit score?",
    options: ["Credit inquiries", "Payment history", "Types of credit", "New accounts"],
    correctAnswer: 1,
    explanation: "Payment history accounts for about 35% of your credit score - the largest factor."
  },
  {
    id: 15,
    category: "Credit",
    question: "What type of credit card is best for someone with no credit history?",
    options: ["Premium rewards card", "Secured credit card", "Business credit card", "Store credit card with high limit"],
    correctAnswer: 1,
    explanation: "Secured credit cards are designed for people building credit. You provide a deposit that becomes your limit."
  },
  {
    id: 16,
    category: "Credit",
    question: "You have a $2,000 credit limit and spent $600. What's your credit utilization?",
    options: ["15%", "30%", "60%", "3%"],
    correctAnswer: 1,
    explanation: "$600 / $2,000 = 0.30 = 30% utilization."
  },
  {
    id: 17,
    category: "Credit",
    question: "Which of these does NOT affect your credit score?",
    options: ["Payment history", "Your income level", "Credit utilization", "Length of credit history"],
    correctAnswer: 1,
    explanation: "Your income is not a factor in your credit score. It's about how you manage credit, not how much you earn."
  },
  {
    id: 18,
    category: "Credit",
    question: "How often can you get a free credit report from each bureau?",
    options: ["Monthly", "Once per year", "Every 6 months", "Only when you apply for credit"],
    correctAnswer: 1,
    explanation: "You can get one free report per year from each of the three bureaus through AnnualCreditReport.com."
  },

  // Week 5: Debt Traps (Questions 19-23)
  {
    id: 19,
    category: "Debt Management",
    question: "Payday loans typically have annual interest rates around:",
    options: ["15%", "50%", "100%", "400%"],
    correctAnswer: 3,
    explanation: "Payday loans often have APRs around 400% or higher - they're predatory and should be avoided."
  },
  {
    id: 20,
    category: "Debt Management",
    question: "When paying off multiple debts, which strategy saves the most money on interest?",
    options: ["Pay smallest balance first", "Pay highest interest rate first", "Pay oldest debt first", "Pay equal amounts to all"],
    correctAnswer: 1,
    explanation: "The avalanche method (highest interest first) saves the most money over time."
  },
  {
    id: 21,
    category: "Debt Management",
    question: "What happens if you only pay the minimum on your credit card?",
    options: ["Debt is paid quickly", "No interest is charged", "It takes years to pay off", "Your credit improves faster"],
    correctAnswer: 2,
    explanation: "Minimum payments mostly cover interest. A $2,000 balance could take 5+ years to pay off."
  },
  {
    id: 22,
    category: "Debt Management",
    question: "If you co-sign a loan and the borrower doesn't pay, what happens?",
    options: ["Nothing", "You get a warning", "You're fully responsible for the debt", "The loan is forgiven"],
    correctAnswer: 2,
    explanation: "Co-signing makes you 100% responsible if the primary borrower doesn't pay."
  },
  {
    id: 23,
    category: "Debt Management",
    question: "What's the main risk with Buy Now, Pay Later services?",
    options: ["They improve credit too fast", "Easy to overspend", "Interest rates are too low", "They require too much ID"],
    correctAnswer: 1,
    explanation: "BNPL makes it easy to accumulate multiple payments, leading to overspending and missed payments."
  },

  // Week 6: Banking (Questions 24-28)
  {
    id: 24,
    category: "Banking",
    question: "FDIC insurance protects your deposits up to what amount?",
    options: ["$100,000", "$250,000", "$500,000", "Unlimited"],
    correctAnswer: 1,
    explanation: "FDIC insurance covers up to $250,000 per depositor, per bank, per ownership category."
  },
  {
    id: 25,
    category: "Banking",
    question: "Which type of account typically offers the highest interest rate?",
    options: ["Checking account", "Savings account at a traditional bank", "High-yield savings at an online bank", "Safe deposit box"],
    correctAnswer: 2,
    explanation: "Online banks offer higher interest rates because they have lower overhead costs than traditional banks."
  },
  {
    id: 26,
    category: "Banking",
    question: "What is an NSF fee?",
    options: ["New savings fund fee", "Non-sufficient funds fee", "National security fee", "Next statement fee"],
    correctAnswer: 1,
    explanation: "NSF (Non-Sufficient Funds) fee is charged when you try to spend more than you have in your account."
  },
  {
    id: 27,
    category: "Banking",
    question: "What's the main advantage of a checking account over savings?",
    options: ["Higher interest", "Limited transactions", "Easy access for daily spending", "Better for long-term savings"],
    correctAnswer: 2,
    explanation: "Checking accounts are designed for frequent transactions and daily spending needs."
  },
  {
    id: 28,
    category: "Banking",
    question: "How many withdrawals per month are typically allowed from a savings account?",
    options: ["Unlimited", "6", "12", "1"],
    correctAnswer: 1,
    explanation: "Federal Regulation D historically limited savings withdrawals to 6 per month (though this has been relaxed)."
  },

  // Week 7-8: Budgeting Methods & Spending (Questions 29-35)
  {
    id: 29,
    category: "Budgeting",
    question: "In zero-based budgeting, what should your income minus expenses equal?",
    options: ["Positive number", "Negative number", "Zero", "Your savings goal"],
    correctAnswer: 2,
    explanation: "Zero-based budgeting assigns every dollar a purpose, so income minus all budget categories equals zero."
  },
  {
    id: 30,
    category: "Budgeting",
    question: "Which expense is considered 'fixed'?",
    options: ["Groceries", "Entertainment", "Rent/mortgage", "Clothing"],
    correctAnswer: 2,
    explanation: "Fixed expenses stay the same each month. Rent is fixed; groceries, entertainment, and clothing vary."
  },
  {
    id: 31,
    category: "Budgeting",
    question: "What is a 'sinking fund'?",
    options: ["Emergency savings", "Money for a specific future expense", "Debt payment account", "Failed investment"],
    correctAnswer: 1,
    explanation: "A sinking fund is money saved for a specific planned expense, like a vacation, car repair, or holiday gifts."
  },
  {
    id: 32,
    category: "Budgeting",
    question: "The 24-hour rule helps you avoid:",
    options: ["Saving money", "Impulse purchases", "Paying bills", "Investing"],
    correctAnswer: 1,
    explanation: "Waiting 24 hours before non-essential purchases helps prevent impulse buying decisions."
  },
  {
    id: 33,
    category: "Budgeting",
    question: "What is 'lifestyle creep'?",
    options: ["Saving more as income increases", "Spending more as income increases", "Reducing expenses", "Changing jobs frequently"],
    correctAnswer: 1,
    explanation: "Lifestyle creep is when your spending increases as your income rises, preventing wealth building."
  },
  {
    id: 34,
    category: "Budgeting",
    question: "If you have irregular income, how should you budget?",
    options: ["Based on your highest month", "Based on your lowest month", "Don't budget", "Only save in good months"],
    correctAnswer: 1,
    explanation: "Budget based on your lowest expected income to ensure you can always cover essentials."
  },
  {
    id: 35,
    category: "Budgeting",
    question: "How often should you review your budget?",
    options: ["Once a year", "Never", "Weekly or monthly", "Only when broke"],
    correctAnswer: 2,
    explanation: "Regular reviews (weekly or monthly) help you stay on track and adjust for changing circumstances."
  },

  // Week 9-10: Personal Brand & Career (Questions 36-40)
  {
    id: 36,
    category: "Career & Brand",
    question: "What percentage of employers research candidates online before hiring?",
    options: ["25%", "50%", "70%+", "10%"],
    correctAnswer: 2,
    explanation: "Over 70% of employers Google candidates. Your digital footprint matters for career opportunities."
  },
  {
    id: 37,
    category: "Career & Brand",
    question: "Which email address is most professional?",
    options: ["coolkid2024@email.com", "john.smith@email.com", "partylife@email.com", "gamer999@email.com"],
    correctAnswer: 1,
    explanation: "Use your real name for professional communications. firstname.lastname is the standard."
  },
  {
    id: 38,
    category: "Career & Brand",
    question: "How long should your resume be if you're entry-level?",
    options: ["3 pages", "2 pages", "1 page", "Half page"],
    correctAnswer: 2,
    explanation: "Entry-level candidates should keep resumes to one page. Quality over quantity."
  },
  {
    id: 39,
    category: "Career & Brand",
    question: "Resume bullet points should start with:",
    options: ["I", "My responsibilities", "Action verbs", "The company name"],
    correctAnswer: 2,
    explanation: "Start with strong action verbs like 'Achieved,' 'Created,' 'Led,' 'Managed.'"
  },
  {
    id: 40,
    category: "Career & Brand",
    question: "When should you follow up after applying for a job?",
    options: ["Same day", "1 week", "1 month", "Never"],
    correctAnswer: 1,
    explanation: "Following up after about a week shows interest without being overly aggressive."
  },

  // Weeks 11-14: Investing & Wealth Building (Questions 41-45)
  {
    id: 41,
    category: "Investing",
    question: "What is compound interest?",
    options: ["Interest on principal only", "Interest on interest plus principal", "A penalty fee", "Monthly account fee"],
    correctAnswer: 1,
    explanation: "Compound interest earns interest on both your original investment AND the accumulated interest."
  },
  {
    id: 42,
    category: "Investing",
    question: "What is diversification in investing?",
    options: ["Putting all money in one stock", "Spreading investments across different assets", "Only investing in cash", "Day trading"],
    correctAnswer: 1,
    explanation: "Diversification means spreading investments across different asset types to reduce risk."
  },
  {
    id: 43,
    category: "Investing",
    question: "What's the main advantage of starting to invest young?",
    options: ["Lower taxes", "More time for compound growth", "Higher interest rates", "Less paperwork"],
    correctAnswer: 1,
    explanation: "Starting early gives your money more time to grow through compound interest - time is your biggest advantage."
  },
  {
    id: 44,
    category: "Investing",
    question: "What is an index fund?",
    options: ["A savings account", "A fund that tracks a market index", "Individual stocks", "A type of loan"],
    correctAnswer: 1,
    explanation: "Index funds track a market index (like S&P 500), offering broad diversification at low cost."
  },
  {
    id: 45,
    category: "Investing",
    question: "What's the 'Rule of 72' used for?",
    options: ["Calculating taxes", "Estimating how long to double your money", "Budgeting", "Credit scores"],
    correctAnswer: 1,
    explanation: "Divide 72 by your interest rate to estimate years to double your money. At 8%, it takes about 9 years."
  },

  // Weeks 15-18: Financial Planning & Goals (Questions 46-50)
  {
    id: 46,
    category: "Financial Planning",
    question: "How many months of expenses should be in an emergency fund?",
    options: ["1 month", "3-6 months", "12 months", "No emergency fund needed"],
    correctAnswer: 1,
    explanation: "3-6 months of expenses provides a solid safety net for job loss or unexpected emergencies."
  },
  {
    id: 47,
    category: "Financial Planning",
    question: "What is a SMART financial goal?",
    options: ["Simple, Modern, Achievable, Random, Temporary", "Specific, Measurable, Achievable, Relevant, Time-bound", "Save Money And Retire Today", "Standard Money Allocation Rate"],
    correctAnswer: 1,
    explanation: "SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound."
  },
  {
    id: 48,
    category: "Financial Planning",
    question: "What should you do FIRST when you get a raise?",
    options: ["Upgrade your lifestyle", "Increase savings/investments", "Buy a new car", "Go on vacation"],
    correctAnswer: 1,
    explanation: "Avoid lifestyle creep by directing raises toward savings and investments first."
  },
  {
    id: 49,
    category: "Financial Planning",
    question: "What's the purpose of insurance?",
    options: ["To make money", "To protect against financial loss", "To avoid taxes", "To build credit"],
    correctAnswer: 1,
    explanation: "Insurance protects you from catastrophic financial losses due to accidents, illness, or disasters."
  },
  {
    id: 50,
    category: "Financial Planning",
    question: "Which statement about financial success is TRUE?",
    options: ["It requires high income", "It's about how much you keep, not just earn", "Only lucky people succeed", "You need to start with money"],
    correctAnswer: 1,
    explanation: "Wealth building is about saving and investing consistently, not just earning a high income."
  }
];

export function FinalExamScreen({ onBack, onComplete }: FinalExamScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes for 50 questions
  const [examStarted, setExamStarted] = useState(false);

  const totalQuestions = examQuestions.length;
  const passingScore = Math.ceil(totalQuestions * 0.7); // 70% to pass = 35 questions

  // Timer effect
  useEffect(() => {
    if (examStarted && !showResults && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && examStarted) {
      handleExamComplete();
    }
  }, [timeRemaining, examStarted, showResults]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleExamComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleExamComplete = () => {
    setShowResults(true);
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestion(index);
  };

  const calculateScore = () => {
    let correct = 0;
    examQuestions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const calculateCategoryScores = () => {
    const categories: { [key: string]: { correct: number; total: number } } = {};

    examQuestions.forEach((question, index) => {
      if (!categories[question.category]) {
        categories[question.category] = { correct: 0, total: 0 };
      }
      categories[question.category].total++;
      if (selectedAnswers[index] === question.correctAnswer) {
        categories[question.category].correct++;
      }
    });

    return categories;
  };

  const getGradeInfo = (score: number) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 90) return { grade: 'A', color: 'text-[#50D890]', bgColor: 'from-[#50D890] to-[#4ECDC4]', passed: true };
    if (percentage >= 80) return { grade: 'B', color: 'text-[#4A5FFF]', bgColor: 'from-[#4A5FFF] to-[#00BFFF]', passed: true };
    if (percentage >= 70) return { grade: 'C', color: 'text-[#FF6B35]', bgColor: 'from-[#FF6B35] to-[#FF8E53]', passed: true };
    if (percentage >= 60) return { grade: 'D', color: 'text-yellow-500', bgColor: 'from-yellow-500 to-yellow-400', passed: false };
    return { grade: 'F', color: 'text-red-500', bgColor: 'from-red-500 to-red-400', passed: false };
  };

  const handleRetakeExam = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setTimeRemaining(3600);
    setExamStarted(false);
  };

  const handleComplete = () => {
    const score = calculateScore();
    const { passed } = getGradeInfo(score);
    onComplete(score, passed);
  };

  // Pre-exam screen
  if (!examStarted) {
    return (
      <div className="w-full space-y-6 pb-6 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <img src={logo} alt="Beyond The Game" className="h-12 object-contain opacity-80"/>
          <div className="w-10"></div>
        </div>

        {/* Exam Introduction */}
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] rounded-full flex items-center justify-center mx-auto mb-6 btn-3d">
            <Award className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-white font-bold text-3xl mb-2">Final Exam</h1>
          <h2 className="text-[#9B59B6] font-bold text-xl mb-6">Financial Literacy Certification</h2>

          <p className="text-white/70 mb-8 max-w-md mx-auto">
            This comprehensive exam covers all topics from the course. Pass this exam to earn your Financial Literacy Certificate!
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <BookOpen className="w-5 h-5 text-[#4A5FFF]" />
                <span className="text-white font-bold text-lg">{totalQuestions}</span>
              </div>
              <p className="text-white/60 text-sm">Questions</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-[#FF6B35]" />
                <span className="text-white font-bold text-lg">60</span>
              </div>
              <p className="text-white/60 text-sm">Minutes</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-[#50D890]" />
                <span className="text-white font-bold text-lg">70%</span>
              </div>
              <p className="text-white/60 text-sm">To Pass</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <RotateCcw className="w-5 h-5 text-[#9B59B6]" />
                <span className="text-white font-bold text-lg">Unlimited</span>
              </div>
              <p className="text-white/60 text-sm">Retakes</p>
            </div>
          </div>

          <div className="space-y-3 text-left max-w-md mx-auto mb-8">
            <h3 className="text-white font-bold text-center mb-4">Topics Covered:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {['Income & Budgeting', 'Side Hustles', 'Credit', 'Debt Management', 'Banking', 'Investing', 'Career & Brand', 'Financial Planning'].map((topic) => (
                <div key={topic} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#4A5FFF] rounded-full"></div>
                  <span className="text-white/80">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartExam}
          className="w-full bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white font-bold py-4 rounded-xl btn-3d hover:scale-105 transition-all duration-300 text-center"
        >
          Start Final Exam
        </button>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const score = calculateScore();
    const { grade, color, bgColor, passed } = getGradeInfo(score);
    const percentage = Math.round((score / totalQuestions) * 100);
    const categoryScores = calculateCategoryScores();

    return (
      <div className="w-full space-y-6 pb-6 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-center">
          <img src={logo} alt="Beyond The Game" className="h-12 object-contain opacity-80"/>
        </div>

        {/* Results Summary */}
        <div className="glass-card rounded-xl p-8 text-center">
          <div className={`w-24 h-24 bg-gradient-to-r ${bgColor} rounded-full flex items-center justify-center mx-auto mb-6 btn-3d`}>
            {passed ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <XCircle className="w-12 h-12 text-white" />
            )}
          </div>

          <h1 className="text-white font-bold text-3xl mb-2">
            {passed ? 'Congratulations!' : 'Keep Trying!'}
          </h1>
          <h2 className="text-white/80 text-xl mb-6">Final Exam Results</h2>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
            <div className="bg-white/5 rounded-xl p-4">
              <span className={`font-bold text-3xl ${color}`}>{score}/{totalQuestions}</span>
              <p className="text-white/60 text-sm mt-1">Score</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <span className={`font-bold text-3xl ${color}`}>{percentage}%</span>
              <p className="text-white/60 text-sm mt-1">Percentage</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <span className={`font-bold text-3xl ${color}`}>{grade}</span>
              <p className="text-white/60 text-sm mt-1">Grade</p>
            </div>
          </div>

          {passed ? (
            <div className="bg-gradient-to-r from-[#50D890]/20 to-[#4ECDC4]/20 border border-[#50D890]/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Award className="w-6 h-6 text-[#50D890]" />
                <span className="text-[#50D890] font-bold text-lg">Certificate Earned!</span>
              </div>
              <p className="text-white/80 text-sm">You've demonstrated strong financial literacy knowledge!</p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <XCircle className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-bold text-lg">Need {passingScore} correct ({Math.ceil(70)}%) to pass</span>
              </div>
              <p className="text-white/80 text-sm">Review the material and try again. You've got this!</p>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold text-lg mb-4">Performance by Category</h3>
          <div className="space-y-3">
            {Object.entries(categoryScores).map(([category, { correct, total }]) => {
              const catPercentage = Math.round((correct / total) * 100);
              const catColor = catPercentage >= 70 ? 'bg-[#50D890]' : catPercentage >= 50 ? 'bg-[#FF6B35]' : 'bg-red-500';

              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">{category}</span>
                    <span className="text-white/60 text-sm">{correct}/{total} ({catPercentage}%)</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${catColor} transition-all duration-500`}
                      style={{ width: `${catPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Review */}
        <div className="glass-card rounded-xl p-6 max-h-[400px] overflow-y-auto">
          <h3 className="text-white font-bold text-lg mb-4">Question Review</h3>
          <div className="space-y-4">
            {examQuestions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border ${
                    isCorrect
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-[#4A5FFF] font-medium">{question.category}</span>
                      </div>
                      <p className="text-white font-medium text-sm">Q{index + 1}: {question.question}</p>
                    </div>
                  </div>

                  <div className="ml-9 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        Your answer:
                      </span>
                      <span className={`text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                        {userAnswer !== undefined ? question.options[userAnswer] : 'No answer'}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-green-400">Correct answer:</span>
                        <span className="text-sm text-green-300">{question.options[question.correctAnswer]}</span>
                      </div>
                    )}

                    <div className="mt-2 p-2 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-xs">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!passed && (
            <button
              onClick={handleRetakeExam}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8E53] text-white font-bold py-4 rounded-xl btn-3d hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Retake Exam</span>
            </button>
          )}

          <button
            onClick={handleComplete}
            className="w-full bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] text-white font-bold py-4 rounded-xl btn-3d hover:scale-105 transition-all duration-300"
          >
            {passed ? 'Continue' : 'Back to Course'}
          </button>
        </div>
      </div>
    );
  }

  // Exam screen
  const currentQ = examQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const answeredCount = selectedAnswers.filter(a => a !== undefined).length;

  return (
    <div className="w-full space-y-6 pb-6 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4 text-white/60" />
            <span className={`text-sm font-medium ${timeRemaining < 300 ? 'text-red-400' : 'text-white/80'}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="text-white/80 text-sm">
            {currentQuestion + 1}/{totalQuestions}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Question Navigator */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60 text-sm">Question Navigator</span>
          <span className="text-white/60 text-sm">{answeredCount} of {totalQuestions} answered</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {examQuestions.map((_, index) => {
            const isAnswered = selectedAnswers[index] !== undefined;
            const isCurrent = index === currentQuestion;

            return (
              <button
                key={index}
                onClick={() => handleJumpToQuestion(index)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white'
                    : isAnswered
                    ? 'bg-[#50D890]/30 text-[#50D890] border border-[#50D890]/50'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xs text-[#9B59B6] font-medium bg-[#9B59B6]/20 px-2 py-1 rounded">
            {currentQ?.category}
          </span>
        </div>

        <h2 className="text-white font-bold text-lg mb-6">{currentQ?.question}</h2>

        <div className="space-y-3">
          {currentQ?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                selectedAnswers[currentQuestion] === index
                  ? 'bg-gradient-to-r from-[#9B59B6]/30 to-[#8E44AD]/30 border-2 border-[#9B59B6]/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-[#9B59B6] bg-[#9B59B6]'
                    : 'border-white/30'
                }`}>
                  {selectedAnswers[currentQuestion] === index && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={`${
                  selectedAnswers[currentQuestion] === index ? 'text-white font-medium' : 'text-white/80'
                }`}>
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
            currentQuestion === 0
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selectedAnswers[currentQuestion] === undefined}
          className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 ${
            selectedAnswers[currentQuestion] !== undefined
              ? 'bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white btn-3d hover:scale-105'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {currentQuestion === totalQuestions - 1 ? 'Finish Exam' : 'Next'}
        </button>
      </div>
    </div>
  );
}
