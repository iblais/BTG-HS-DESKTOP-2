import { useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Check, X, Trophy, Star, Zap, BookOpen, Award } from 'lucide-react';

// Types
interface FlashCard {
  id: number;
  term: string;
  definition: string;
  category: string;
  example?: string;
}

interface QuizQuestion {
  card: FlashCard;
  options: string[];
  correctAnswer: string;
}

type Difficulty = 'easy' | 'hard';
type GameMode = 'intro' | 'study' | 'quiz' | 'results';

interface BankingTermsFlashCardsProps {
  onBack: () => void;
  onSaveProgress?: (progress: { score: number; cardsCompleted: number }) => void;
}

// Flashcard data organized by difficulty
const flashcardsByDifficulty: Record<Difficulty, FlashCard[]> = {
  easy: [
    { id: 1, term: 'Savings Account', definition: 'A bank account that earns interest on your deposited money while keeping it safe and accessible.', category: 'Accounts', example: 'You deposit $500 and earn 2% interest annually.' },
    { id: 2, term: 'Checking Account', definition: 'A bank account for everyday transactions like paying bills, writing checks, and using a debit card.', category: 'Accounts', example: 'Using your debit card at a store.' },
    { id: 3, term: 'Interest', definition: 'Money the bank pays you for keeping your money with them, or money you pay when borrowing.', category: 'Basic Concepts', example: 'Earning $10 on your $500 savings.' },
    { id: 4, term: 'Deposit', definition: 'Putting money into your bank account.', category: 'Transactions', example: 'Adding your paycheck to your account.' },
    { id: 5, term: 'Withdrawal', definition: 'Taking money out of your bank account.', category: 'Transactions', example: 'Getting $60 cash from an ATM.' },
    { id: 6, term: 'ATM', definition: 'Automated Teller Machine - an electronic device that lets you deposit, withdraw, or transfer money.', category: 'Banking Tools', example: 'Getting cash outside a convenience store.' },
    { id: 7, term: 'Debit Card', definition: 'A card linked to your checking account that lets you spend money you already have.', category: 'Banking Tools', example: 'Paying for groceries with your bank card.' },
    { id: 8, term: 'PIN', definition: 'Personal Identification Number - a secret code that protects your bank card.', category: 'Security', example: 'Entering your 4-digit code at the ATM.' },
    { id: 9, term: 'Balance', definition: 'The amount of money currently in your account.', category: 'Basic Concepts', example: 'Your account shows $1,234.56 available.' },
    { id: 10, term: 'Direct Deposit', definition: 'When your paycheck is automatically transferred to your bank account.', category: 'Transactions', example: 'Getting paid without a paper check.' },
    { id: 11, term: 'Budget', definition: 'A plan for how you will spend and save your money.', category: 'Financial Planning', example: 'Allocating $200 for food, $100 for transportation.' },
    { id: 12, term: 'Bank Statement', definition: 'A monthly summary of all transactions in your account.', category: 'Banking Tools', example: 'Reviewing your deposits and withdrawals for March.' },
  ],
  hard: [
    // Former medium-level terms (now part of advanced)
    { id: 13, term: 'APY', definition: 'Annual Percentage Yield - the total interest you earn on savings in one year, including compound interest.', category: 'Interest', example: 'A savings account with 4.5% APY.' },
    { id: 14, term: 'APR', definition: 'Annual Percentage Rate - the yearly cost of borrowing money, expressed as a percentage.', category: 'Credit', example: 'A credit card with 18% APR.' },
    { id: 15, term: 'Compound Interest', definition: 'Interest calculated on both your initial deposit and previously earned interest.', category: 'Interest', example: 'Your $100 earns $5, then next year you earn interest on $105.' },
    { id: 16, term: 'Overdraft', definition: 'Spending more money than you have in your account, resulting in a negative balance.', category: 'Account Management', example: 'Having $50 but trying to spend $75.' },
    { id: 17, term: 'NSF Fee', definition: 'Non-Sufficient Funds fee - a charge when you try to spend more than your account balance.', category: 'Fees', example: 'Being charged $35 for a bounced check.' },
    { id: 18, term: 'Credit Score', definition: 'A number (300-850) that represents how reliably you repay borrowed money.', category: 'Credit', example: 'A score of 750 is considered excellent.' },
    { id: 19, term: 'Minimum Balance', definition: 'The lowest amount you must keep in your account to avoid fees.', category: 'Account Management', example: 'Keeping at least $300 to avoid the $10 monthly fee.' },
    { id: 20, term: 'Wire Transfer', definition: 'An electronic transfer of money between banks, often used for large or international payments.', category: 'Transactions', example: 'Sending $5,000 for a down payment.' },
    { id: 21, term: 'FDIC Insurance', definition: 'Federal protection that insures your bank deposits up to $250,000 if the bank fails.', category: 'Security', example: 'Your money is protected even if the bank goes out of business.' },
    { id: 22, term: 'Routing Number', definition: 'A 9-digit code that identifies your bank for electronic transfers.', category: 'Banking Tools', example: 'Needed to set up direct deposit.' },
    { id: 23, term: 'Certified Check', definition: 'A check guaranteed by the bank because they verify and set aside the funds.', category: 'Transactions', example: 'Required for some large purchases like a car.' },
    { id: 24, term: 'Money Market Account', definition: 'A savings account that typically offers higher interest but may require a higher minimum balance.', category: 'Accounts', example: 'Earning 4% but needing to keep $2,500 minimum.' },
    // Original hard-level terms
    { id: 25, term: 'Amortization', definition: 'The process of spreading loan payments over time, with early payments going mostly to interest.', category: 'Loans', example: 'A 30-year mortgage payment schedule.' },
    { id: 26, term: 'Collateral', definition: 'An asset you pledge to secure a loan, which the lender can take if you default.', category: 'Loans', example: 'Your car secures an auto loan.' },
    { id: 27, term: 'Escrow', definition: 'An account where a third party holds money until certain conditions are met.', category: 'Advanced Banking', example: 'Holding a home down payment until the sale closes.' },
    { id: 28, term: 'Prime Rate', definition: 'The interest rate banks charge their most creditworthy customers, used as a benchmark.', category: 'Interest', example: 'Your credit card rate might be Prime + 12%.' },
    { id: 29, term: 'Liquidity', definition: 'How quickly and easily an asset can be converted to cash without losing value.', category: 'Financial Concepts', example: 'Savings accounts are highly liquid; real estate is not.' },
    { id: 30, term: 'Certificate of Deposit (CD)', definition: 'A savings product with a fixed interest rate that requires you to keep money deposited for a set term.', category: 'Accounts', example: 'A 12-month CD at 5% APY.' },
    { id: 31, term: 'Yield Curve', definition: 'A graph showing interest rates for bonds of different maturity lengths.', category: 'Advanced Concepts', example: 'An inverted yield curve may signal a recession.' },
    { id: 32, term: 'Debt-to-Income Ratio', definition: 'Your monthly debt payments divided by your gross monthly income, expressed as a percentage.', category: 'Credit', example: 'Having $1,500 in payments on $5,000 income = 30% DTI.' },
    { id: 33, term: 'Principal', definition: 'The original amount of money borrowed or invested, not including interest.', category: 'Loans', example: 'On a $10,000 loan, the principal is $10,000.' },
    { id: 34, term: 'HELOC', definition: 'Home Equity Line of Credit - a revolving credit line using your home equity as collateral.', category: 'Credit', example: 'Borrowing against your home\'s value for renovations.' },
    { id: 35, term: 'Fiduciary', definition: 'A person or institution legally required to act in your best financial interest.', category: 'Financial Concepts', example: 'A financial advisor with fiduciary duty must prioritize your needs.' },
    { id: 36, term: 'Arbitrage', definition: 'Profiting from price differences of the same asset in different markets.', category: 'Advanced Concepts', example: 'Buying a stock on one exchange and selling it higher on another.' },
  ],
};

const difficultyConfig = {
  easy: {
    label: 'Beginner',
    description: 'Basic banking terms everyone should know',
    color: 'from-green-500 to-emerald-600',
    quizQuestions: 8,
    icon: BookOpen,
  },
  hard: {
    label: 'Advanced',
    description: 'Complex financial concepts and terminology',
    color: 'from-red-500 to-pink-600',
    quizQuestions: 12,
    icon: Award,
  },
};

export default function BankingTermsFlashCards({ onBack, onSaveProgress }: BankingTermsFlashCardsProps) {
  const [gameMode, setGameMode] = useState<GameMode>('intro');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<number>>(new Set());
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(boolean | null)[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [masteredTerms, setMasteredTerms] = useState<Set<number>>(new Set());

  const cards = flashcardsByDifficulty[difficulty];

  // Generate quiz questions
  const generateQuiz = useCallback(() => {
    const allCards = [...cards];
    const numQuestions = difficultyConfig[difficulty].quizQuestions;
    const questions: QuizQuestion[] = [];

    // Shuffle and pick cards for questions
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    const selectedCards = shuffled.slice(0, numQuestions);

    selectedCards.forEach(card => {
      // Get wrong answers from other cards
      const wrongAnswers = allCards
        .filter(c => c.id !== card.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.definition);

      const options = [card.definition, ...wrongAnswers].sort(() => Math.random() - 0.5);

      questions.push({
        card,
        options,
        correctAnswer: card.definition,
      });
    });

    setQuizQuestions(questions);
    setQuizAnswers(new Array(questions.length).fill(null));
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [cards, difficulty]);

  const handleStartStudy = (diff: Difficulty) => {
    setDifficulty(diff);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudiedCards(new Set());
    setGameMode('study');
  };

  const handleStartQuiz = () => {
    generateQuiz();
    setGameMode('quiz');
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
      setStudiedCards(prev => new Set([...prev, cards[currentCardIndex].id]));
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setStudiedCards(prev => new Set([...prev, cards[currentCardIndex].id]));
    }
  };

  const handleQuizAnswer = (answer: string) => {
    if (showFeedback) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    const isCorrect = answer === quizQuestions[currentQuizIndex].correctAnswer;
    const newAnswers = [...quizAnswers];
    newAnswers[currentQuizIndex] = isCorrect;
    setQuizAnswers(newAnswers);

    if (isCorrect) {
      setMasteredTerms(prev => new Set([...prev, quizQuestions[currentQuizIndex].card.id]));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setGameMode('results');
      // Save progress when quiz is complete
      if (onSaveProgress) {
        onSaveProgress({ score: quizAnswers.filter(a => a === true).length, cardsCompleted: currentQuizIndex + 1 });
      }
    }
  };

  const handleRestart = () => {
    setGameMode('intro');
    setStudiedCards(new Set());
    setMasteredTerms(new Set());
  };

  const correctAnswers = quizAnswers.filter(a => a === true).length;
  const scorePercentage = quizQuestions.length > 0 ? Math.round((correctAnswers / quizQuestions.length) * 100) : 0;

  // Intro Screen
  if (gameMode === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Banking Terms Flashcards</h1>
              <p className="text-purple-200">Master essential financial vocabulary</p>
            </div>
          </div>

          {/* How to Play */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-400" />
              How to Play
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-purple-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                <p>Choose a difficulty level based on your knowledge</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                <p>Study the flashcards - tap to flip and see definitions</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                <p>Take the quiz to test your knowledge</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                <p>Score 80% or higher to master the level!</p>
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <h2 className="text-xl font-bold text-white mb-4">Select Difficulty</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(Object.keys(difficultyConfig) as Difficulty[]).map((diff) => {
              const config = difficultyConfig[diff];
              const IconComponent = config.icon;
              const cardCount = flashcardsByDifficulty[diff].length;

              return (
                <button
                  key={diff}
                  onClick={() => handleStartStudy(diff)}
                  className={`bg-gradient-to-br ${config.color} rounded-2xl p-6 text-left hover:scale-105 transition-transform shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <IconComponent className="w-8 h-8 text-white" />
                    <h3 className="text-xl font-bold text-white">{config.label}</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-4">{config.description}</p>
                  <div className="flex justify-between text-white/80 text-sm">
                    <span>{cardCount} terms</span>
                    <span>{config.quizQuestions} quiz questions</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Study Mode
  if (gameMode === 'study') {
    const currentCard = cards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / cards.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setGameMode('intro')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Study Mode</h2>
              <p className="text-purple-200 text-sm">{difficultyConfig[difficulty].label}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{currentCardIndex + 1} / {cards.length}</p>
              <p className="text-purple-200 text-sm">{studiedCards.size} studied</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-white/20 rounded-full mb-8">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Flashcard */}
          <div
            onClick={handleFlipCard}
            className="relative cursor-pointer perspective-1000 mb-8"
            style={{ minHeight: '320px' }}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front - Term */}
              <div
                className={`absolute w-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center ${
                  isFlipped ? 'invisible' : ''
                }`}
                style={{ minHeight: '320px', backfaceVisibility: 'hidden' }}
              >
                <span className="text-purple-200 text-sm mb-2">{currentCard.category}</span>
                <h3 className="text-3xl font-bold text-white mb-4">{currentCard.term}</h3>
                <p className="text-purple-200 text-sm">Tap to reveal definition</p>
              </div>

              {/* Back - Definition */}
              <div
                className={`absolute w-full bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center ${
                  !isFlipped ? 'invisible' : ''
                }`}
                style={{
                  minHeight: '320px',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <span className="text-indigo-200 text-sm mb-2">{currentCard.term}</span>
                <p className="text-xl text-white mb-4">{currentCard.definition}</p>
                {currentCard.example && (
                  <div className="mt-4 p-3 bg-white/10 rounded-lg">
                    <p className="text-indigo-200 text-sm">
                      <span className="font-semibold">Example:</span> {currentCard.example}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                currentCardIndex === 0
                  ? 'bg-white/10 text-white/50 cursor-not-allowed'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {currentCardIndex === cards.length - 1 ? (
              <button
                onClick={handleStartQuiz}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-white hover:from-green-600 hover:to-emerald-700 transition-colors shadow-lg"
              >
                <Zap className="w-5 h-5" />
                Take Quiz
              </button>
            ) : (
              <button
                onClick={handleNextCard}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Skip to Quiz */}
          {currentCardIndex < cards.length - 1 && studiedCards.size >= 3 && (
            <div className="text-center mt-6">
              <button
                onClick={handleStartQuiz}
                className="text-purple-300 hover:text-white transition-colors text-sm"
              >
                Ready? Skip to Quiz →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Mode
  if (gameMode === 'quiz' && quizQuestions.length > 0) {
    const currentQuestion = quizQuestions[currentQuizIndex];
    const progress = ((currentQuizIndex + 1) / quizQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setGameMode('study')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Quiz Time!</h2>
              <p className="text-purple-200 text-sm">{difficultyConfig[difficulty].label}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{currentQuizIndex + 1} / {quizQuestions.length}</p>
              <p className="text-green-400 text-sm">{correctAnswers} correct</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-white/20 rounded-full mb-8">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <span className="text-purple-300 text-sm">{currentQuestion.card.category}</span>
            <h3 className="text-2xl font-bold text-white mt-2">
              What is the definition of "{currentQuestion.card.term}"?
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              let buttonStyle = 'bg-white/10 hover:bg-white/20 border-white/20';
              if (showFeedback) {
                if (isCorrect) {
                  buttonStyle = 'bg-green-500/30 border-green-500';
                } else if (isSelected && !isCorrect) {
                  buttonStyle = 'bg-red-500/30 border-red-500';
                } else {
                  buttonStyle = 'bg-white/5 border-white/10';
                }
              } else if (isSelected) {
                buttonStyle = 'bg-purple-500/30 border-purple-500';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleQuizAnswer(option)}
                  disabled={showFeedback}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${buttonStyle} ${
                    showFeedback ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-white flex-1">{option}</span>
                    {showFeedback && isCorrect && (
                      <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                    )}
                    {showFeedback && isSelected && !isCorrect && (
                      <X className="w-6 h-6 text-red-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback & Next */}
          {showFeedback && (
            <div className="space-y-4">
              {currentQuestion.card.example && (
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm">
                    <span className="font-semibold">Example:</span> {currentQuestion.card.example}
                  </p>
                </div>
              )}
              <button
                onClick={handleNextQuestion}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg"
              >
                {currentQuizIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results Screen
  if (gameMode === 'results') {
    const passed = scorePercentage >= 80;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center">
          {/* Trophy */}
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
            passed ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-slate-400 to-slate-600'
          }`}>
            {passed ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <BookOpen className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Results */}
          <h2 className="text-3xl font-bold text-white mb-2">
            {passed ? 'Excellent Work!' : 'Keep Learning!'}
          </h2>
          <p className="text-purple-200 mb-6">
            {passed
              ? `You've mastered ${difficultyConfig[difficulty].label} banking terms!`
              : 'Review the flashcards and try again to master these terms.'}
          </p>

          {/* Score */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <div className="text-5xl font-bold text-white mb-2">{scorePercentage}%</div>
            <div className="flex items-center justify-center gap-4 text-purple-200">
              <span className="flex items-center gap-1">
                <Check className="w-5 h-5 text-green-400" />
                {correctAnswers} correct
              </span>
              <span className="flex items-center gap-1">
                <X className="w-5 h-5 text-red-400" />
                {quizQuestions.length - correctAnswers} incorrect
              </span>
            </div>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((star) => (
              <Star
                key={star}
                className={`w-10 h-10 ${
                  scorePercentage >= star * 33
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-white/20'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {!passed && (
              <button
                onClick={() => setGameMode('study')}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-white hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Study Again
              </button>
            )}
            <button
              onClick={() => {
                generateQuiz();
                setGameMode('quiz');
              }}
              className={`w-full py-4 rounded-xl font-bold text-white transition-colors shadow-lg flex items-center justify-center gap-2 ${
                passed
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
              {passed ? 'Play Again' : 'Retry Quiz'}
            </button>
            <button
              onClick={handleRestart}
              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Choose Different Level
            </button>
          </div>

          {/* Mastered Terms */}
          {masteredTerms.size > 0 && (
            <div className="mt-8 text-left">
              <h3 className="text-lg font-bold text-white mb-3">Terms You Mastered:</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(masteredTerms).map(id => {
                  const card = cards.find(c => c.id === id);
                  return card ? (
                    <span
                      key={id}
                      className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                    >
                      {card.term}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
