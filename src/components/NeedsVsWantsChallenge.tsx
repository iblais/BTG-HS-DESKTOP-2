import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, ShoppingBag, Clock, Trophy, Zap, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface NeedsVsWantsChallengeProps {
  onBack: () => void;
  onSaveProgress: (progress: any) => void;
  savedProgress?: any;
}

interface Item {
  id: number;
  name: string;
  emoji: string;
  category: 'need' | 'want';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const allItems: Item[] = [
  // Easy items - clear needs
  { id: 1, name: 'Rent Payment', emoji: '🏠', category: 'need', explanation: 'Shelter is a basic human need. Without paying rent, you lose your home.', difficulty: 'easy' },
  { id: 2, name: 'Groceries', emoji: '🥗', category: 'need', explanation: 'Food is essential for survival and health. Basic groceries are a need.', difficulty: 'easy' },
  { id: 3, name: 'Water Bill', emoji: '💧', category: 'need', explanation: 'Clean water is essential for drinking, cooking, and hygiene.', difficulty: 'easy' },
  { id: 4, name: 'Electricity', emoji: '⚡', category: 'need', explanation: 'Power for heating/cooling, refrigeration, and basic living is a need.', difficulty: 'easy' },
  { id: 5, name: 'Health Insurance', emoji: '🏥', category: 'need', explanation: 'Medical emergencies can bankrupt you without insurance.', difficulty: 'easy' },

  // Easy items - clear wants
  { id: 6, name: 'Designer Shoes', emoji: '👟', category: 'want', explanation: 'You need shoes, but designer brands are a want. Basic shoes are a need.', difficulty: 'easy' },
  { id: 7, name: 'Netflix Subscription', emoji: '📺', category: 'want', explanation: 'Entertainment is nice but not essential for survival.', difficulty: 'easy' },
  { id: 8, name: 'Concert Tickets', emoji: '🎤', category: 'want', explanation: 'Live entertainment is fun but definitely a want.', difficulty: 'easy' },
  { id: 9, name: 'New Video Game', emoji: '🎮', category: 'want', explanation: 'Gaming is entertainment, not a necessity.', difficulty: 'easy' },
  { id: 10, name: 'Fancy Coffee Daily', emoji: '☕', category: 'want', explanation: '$5 lattes add up. Home coffee or free work coffee saves money.', difficulty: 'easy' },

  // Medium items - situational
  { id: 11, name: 'Car Payment', emoji: '🚗', category: 'need', explanation: 'If you need a car to get to work and there\'s no public transit, reliable transportation is a need.', difficulty: 'medium' },
  { id: 12, name: 'Internet Service', emoji: '📶', category: 'need', explanation: 'In today\'s world, internet is often needed for work, school, and essential services.', difficulty: 'medium' },
  { id: 13, name: 'Phone Bill', emoji: '📱', category: 'need', explanation: 'A basic phone plan is needed for emergencies and job contacts. Premium plans are wants.', difficulty: 'medium' },
  { id: 14, name: 'Work Clothes', emoji: '👔', category: 'need', explanation: 'Appropriate work attire is needed to maintain employment.', difficulty: 'medium' },
  { id: 15, name: 'Gym Membership', emoji: '💪', category: 'want', explanation: 'You can exercise for free outdoors. A gym is convenient but not necessary.', difficulty: 'medium' },
  { id: 16, name: 'Eating Out', emoji: '🍔', category: 'want', explanation: 'Restaurant food is a want. You can prepare meals at home for less.', difficulty: 'medium' },
  { id: 17, name: 'New Phone Upgrade', emoji: '📲', category: 'want', explanation: 'If your current phone works, upgrading is a want, not a need.', difficulty: 'medium' },
  { id: 18, name: 'Haircut', emoji: '💇', category: 'need', explanation: 'Basic grooming is needed for professional appearance and hygiene.', difficulty: 'medium' },
  { id: 19, name: 'Spotify Premium', emoji: '🎵', category: 'want', explanation: 'Music is available for free with ads. Premium is convenience, not necessity.', difficulty: 'medium' },
  { id: 20, name: 'Textbooks', emoji: '📚', category: 'need', explanation: 'Required course materials are a need for education.', difficulty: 'medium' },

  // Hard items - tricky
  { id: 21, name: 'Laptop for School', emoji: '💻', category: 'need', explanation: 'Most courses require a computer. Libraries help but having your own is often necessary.', difficulty: 'hard' },
  { id: 22, name: 'Mental Health Therapy', emoji: '🧠', category: 'need', explanation: 'Mental health care is as important as physical health. This is a need.', difficulty: 'hard' },
  { id: 23, name: 'Emergency Fund', emoji: '🏦', category: 'need', explanation: 'Saving for emergencies prevents debt when unexpected costs hit.', difficulty: 'hard' },
  { id: 24, name: 'Professional Development Course', emoji: '🎓', category: 'want', explanation: 'Career growth is good, but courses for future benefits are wants, not immediate needs.', difficulty: 'hard' },
  { id: 25, name: 'Retirement Savings', emoji: '👴', category: 'need', explanation: 'While not immediate, retirement savings is essential for future security.', difficulty: 'hard' },
  { id: 26, name: 'Pet Food', emoji: '🐕', category: 'need', explanation: 'If you have a pet, feeding them is a responsibility and a need.', difficulty: 'hard' },
  { id: 27, name: 'Birthday Gift for Friend', emoji: '🎁', category: 'want', explanation: 'While socially expected, gifts are wants. Your presence can be the gift.', difficulty: 'hard' },
  { id: 28, name: 'Dental Checkup', emoji: '🦷', category: 'need', explanation: 'Preventive dental care prevents expensive problems later.', difficulty: 'hard' },
  { id: 29, name: 'Fast Fashion Clothes', emoji: '👗', category: 'want', explanation: 'Trendy clothes beyond basic wardrobe needs are wants.', difficulty: 'hard' },
  { id: 30, name: 'Childcare', emoji: '👶', category: 'need', explanation: 'If you have children and work, childcare is essential.', difficulty: 'hard' },
];

export const NeedsVsWantsChallenge: React.FC<NeedsVsWantsChallengeProps> = ({ onBack, onSaveProgress, savedProgress }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'results'>('intro');
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState<{ item: Item; correct: boolean }[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [gameItems, setGameItems] = useState<Item[]>([]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('results');
    }
  }, [timeLeft, gameState]);

  const startGame = (selectedDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(selectedDifficulty);

    // Filter and shuffle items based on difficulty
    let filteredItems: Item[];
    if (selectedDifficulty === 'easy') {
      filteredItems = allItems.filter(item => item.difficulty === 'easy');
      setTimeLeft(90);
    } else if (selectedDifficulty === 'medium') {
      filteredItems = allItems.filter(item => item.difficulty === 'easy' || item.difficulty === 'medium');
      setTimeLeft(75);
    } else {
      filteredItems = allItems;
      setTimeLeft(60);
    }

    // Shuffle items
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
    setGameItems(shuffled);

    setCurrentItemIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setAnswers([]);
    setGameState('playing');
  };

  const handleAnswer = (answer: 'need' | 'want') => {
    const currentItem = gameItems[currentItemIndex];
    const isCorrect = currentItem.category === answer;

    if (isCorrect) {
      const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20;
      const streakBonus = streak >= 3 ? Math.min(streak * 2, 10) : 0;
      setScore(prev => prev + points + streakBonus);
      setStreak(prev => prev + 1);
      setMaxStreak(prev => Math.max(prev, streak + 1));
    } else {
      setStreak(0);
    }

    setAnswers(prev => [...prev, { item: currentItem, correct: isCorrect }]);
    setLastAnswer({ correct: isCorrect, explanation: currentItem.explanation });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      setLastAnswer(null);

      if (currentItemIndex < gameItems.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
      } else {
        setGameState('results');
      }
    }, 1500);
  };

  const resetGame = () => {
    setGameState('intro');
    setCurrentItemIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setAnswers([]);
  };

  const renderIntro = () => (
    <div className="min-h-screen bg-[#0A0E27] p-6">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/10">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white font-bold text-xl">Needs vs Wants</h1>
        <div className="w-10"></div>
      </div>

      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🤔</div>
        <h2 className="text-white text-2xl font-bold mb-2">Can You Tell the Difference?</h2>
        <p className="text-white/70">
          Swipe left for WANTS, right for NEEDS. How fast can you go?
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h3 className="text-white font-bold mb-4">How to Play:</h3>
        <div className="space-y-3 text-white/80 text-sm">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-red-400" />
            <span>NEEDS = Things you must have to survive and function</span>
          </div>
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-purple-400" />
            <span>WANTS = Nice to have but not essential</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Build streaks for bonus points!</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => startGame('easy')}
          className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white font-bold text-lg"
        >
          <div className="flex items-center justify-between">
            <span>Easy Mode</span>
            <span className="text-sm opacity-80">90 seconds • Clear choices</span>
          </div>
        </button>

        <button
          onClick={() => startGame('medium')}
          className="w-full p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold text-lg"
        >
          <div className="flex items-center justify-between">
            <span>Medium Mode</span>
            <span className="text-sm opacity-80">75 seconds • Some tricky ones</span>
          </div>
        </button>

        <button
          onClick={() => startGame('hard')}
          className="w-full p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-bold text-lg"
        >
          <div className="flex items-center justify-between">
            <span>Hard Mode</span>
            <span className="text-sm opacity-80">60 seconds • Context matters!</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderPlaying = () => {
    const currentItem = gameItems[currentItemIndex];
    if (!currentItem) return null;

    return (
      <div className="min-h-screen bg-[#0A0E27] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/10">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4 text-white" />
              <span className={`text-white font-bold ${timeLeft <= 10 ? 'text-red-400' : ''}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-bold">{score}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-white/60 mb-2">
            <span>Item {currentItemIndex + 1} of {gameItems.length}</span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              Streak: {streak}
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] transition-all duration-300"
              style={{ width: `${((currentItemIndex + 1) / gameItems.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className={`relative transition-all duration-300 ${showFeedback ? 'scale-95 opacity-80' : ''}`}>
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-7xl mb-6">{currentItem.emoji}</div>
            <h2 className="text-gray-900 text-2xl font-bold mb-2">{currentItem.name}</h2>
            <p className="text-gray-500 text-sm">Is this a NEED or a WANT?</p>
          </div>

          {/* Feedback Overlay */}
          {showFeedback && lastAnswer && (
            <div className={`absolute inset-0 rounded-3xl flex items-center justify-center ${
              lastAnswer.correct ? 'bg-green-500/90' : 'bg-red-500/90'
            }`}>
              <div className="text-center text-white">
                {lastAnswer.correct ? (
                  <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                ) : (
                  <XCircle className="w-16 h-16 mx-auto mb-2" />
                )}
                <p className="font-bold text-xl mb-2">
                  {lastAnswer.correct ? 'Correct!' : 'Not quite!'}
                </p>
                <p className="text-sm px-4 opacity-90">{lastAnswer.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Answer Buttons */}
        {!showFeedback && (
          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => handleAnswer('want')}
              className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl text-white"
            >
              <ShoppingBag className="w-10 h-10 mx-auto mb-2" />
              <span className="font-bold text-xl">WANT</span>
            </button>
            <button
              onClick={() => handleAnswer('need')}
              className="p-6 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl text-white"
            >
              <Heart className="w-10 h-10 mx-auto mb-2" />
              <span className="font-bold text-xl">NEED</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    const correctAnswers = answers.filter(a => a.correct).length;
    const totalAnswers = answers.length;
    const percentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    let grade = 'F';
    let gradeColor = 'text-red-500';
    if (percentage >= 90) { grade = 'A'; gradeColor = 'text-green-400'; }
    else if (percentage >= 80) { grade = 'B'; gradeColor = 'text-blue-400'; }
    else if (percentage >= 70) { grade = 'C'; gradeColor = 'text-yellow-400'; }
    else if (percentage >= 60) { grade = 'D'; gradeColor = 'text-orange-400'; }

    return (
      <div className="min-h-screen bg-[#0A0E27] p-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/10">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white font-bold text-xl">Results</h1>
          <div className="w-10"></div>
        </div>

        <div className="text-center mb-8">
          <div className={`text-8xl font-black ${gradeColor} mb-2`}>{grade}</div>
          <p className="text-white/70">Final Grade</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{score}</div>
            <div className="text-white/60 text-sm">Total Points</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{correctAnswers}/{totalAnswers}</div>
            <div className="text-white/60 text-sm">Correct</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{maxStreak}</div>
            <div className="text-white/60 text-sm">Best Streak</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{percentage}%</div>
            <div className="text-white/60 text-sm">Accuracy</div>
          </div>
        </div>

        {/* Missed Items Review */}
        {answers.filter(a => !a.correct).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
            <h3 className="text-white font-bold mb-3">Review Missed Items:</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {answers.filter(a => !a.correct).map((answer, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-2xl">{answer.item.emoji}</span>
                  <div>
                    <p className="text-white font-medium">{answer.item.name}</p>
                    <p className="text-white/60">Actually a {answer.item.category.toUpperCase()}</p>
                    <p className="text-white/40 text-xs">{answer.item.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={resetGame}
            className="w-full p-4 bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] rounded-xl text-white font-bold flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full p-4 bg-white/10 rounded-xl text-white font-bold"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  };

  switch (gameState) {
    case 'intro':
      return renderIntro();
    case 'playing':
      return renderPlaying();
    case 'results':
      return renderResults();
    default:
      return renderIntro();
  }
};
