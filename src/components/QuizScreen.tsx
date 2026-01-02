import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Trophy, RotateCcw, Target } from 'lucide-react';
import { logo } from '@/assets';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizScreenProps {
  weekNumber: number;
  weekTitle: string;
  onBack: () => void;
  onComplete: (score: number, passed: boolean) => void;
}

export function QuizScreen({
  weekNumber,
  weekTitle,
  onBack,
  onComplete
}: QuizScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [quizStarted, setQuizStarted] = useState(false);

  // Quiz questions data - organized by week
  const quizData: { [key: number]: QuizQuestion[] } = {
    1: [
      {
        id: 1,
        question: "Sarah makes $18 an hour and works 20 hours a week. How much money does she make in a month (before taxes)?",
        options: ["$360", "$720", "$1,440", "$1,224"],
        correctAnswer: 2,
        explanation: "Do the math: $18 x 20 hours = $360 per week. Multiply by 4 weeks = $1,440 per month"
      },
      {
        id: 2,
        question: "Taxes usually take about 15% of your paycheck. If you make $1,000 before taxes, how much actually hits your account?",
        options: ["$150", "$850", "$900", "$1,000"],
        correctAnswer: 1,
        explanation: "15% of $1,000 is $150 that goes to taxes. So you get $1,000 - $150 = $850 in your pocket"
      },
      {
        id: 3,
        question: "Which one of these do you actually NEED?",
        options: ["Spotify Premium", "New Jordan sneakers", "Basic groceries", "Concert tickets"],
        correctAnswer: 2,
        explanation: "You gotta eat to survive. Groceries = need. Everything else = want (even though you really want those Jordans)"
      },
      {
        id: 4,
        question: "In the 50/30/20 rule, what percentage should you save?",
        options: ["10%", "15%", "20%", "30%"],
        correctAnswer: 2,
        explanation: "50% for needs, 30% for wants, 20% for savings. That's the 50/30/20 rule."
      },
      {
        id: 5,
        question: "You make $1,200 a month. You spend $800 on needs and $300 on wants. How much can you save?",
        options: ["$0", "$100", "$200", "$300"],
        correctAnswer: 1,
        explanation: "$1,200 total - $800 needs - $300 wants = $100 left to save"
      },
      {
        id: 6,
        question: "Which one of these makes you money WITHOUT you having to work for it?",
        options: ["Working at Target", "Babysitting", "Investment dividends", "Tutoring"],
        correctAnswer: 2,
        explanation: "Investments pay you dividends without you actively working - that's passive income. The rest require you to actually show up and work."
      },
      {
        id: 7,
        question: "How many months of expenses should you have saved up for emergencies?",
        options: ["1 month", "3-6 months", "12 months", "2 weeks"],
        correctAnswer: 1,
        explanation: "Shoot for 3-6 months worth. That way if something bad happens, you're not immediately broke."
      },
      {
        id: 8,
        question: "Federal minimum wage is $7.25. If you work 40 hours a week, how much do you make per month?",
        options: ["$290", "$580", "$1,160", "$986"],
        correctAnswer: 2,
        explanation: "$7.25 x 40 hours = $290 per week. Multiply by 4 weeks = $1,160 per month (before taxes)"
      },
      {
        id: 9,
        question: "You need to save money fast. Which expense should you cut FIRST?",
        options: ["Rent", "Health insurance", "Groceries", "Netflix subscription"],
        correctAnswer: 3,
        explanation: "Netflix is nice to have but you don't NEED it. Rent, insurance, and food are necessities. Entertainment gets cut first."
      },
      {
        id: 10,
        question: "What's the difference between gross income and net income?",
        options: ["Gross is yearly, net is monthly", "Net is after taxes and deductions", "Gross includes bonuses only", "There is no difference"],
        correctAnswer: 1,
        explanation: "Gross = total you earn before anything is taken out. Net = what actually hits your bank account after taxes and stuff."
      }
    ],
    2: [
      {
        id: 1,
        question: "Your goal is to make $1,500 a month but you're only making $900 right now. How much more do you need?",
        options: ["$500", "$600", "$700", "$1,500"],
        correctAnswer: 1,
        explanation: "Simple math: $1,500 - $900 = $600 more you gotta make"
      },
      {
        id: 2,
        question: "Which side hustle usually pays the most per hour?",
        options: ["Food delivery", "Retail work", "Tutoring", "Dog walking"],
        correctAnswer: 2,
        explanation: "Tutoring can pay anywhere from $15-40 an hour - way better than the other options"
      },
      {
        id: 3,
        question: "If you manage social media for 2 small businesses, how much could you realistically make per month?",
        options: ["$50-100", "$400-1,000", "$2,000-3,000", "$5,000+"],
        correctAnswer: 1,
        explanation: "Small businesses usually pay $200-500 per month for social media help. 2 businesses = $400-1,000 total"
      },
      {
        id: 4,
        question: "You're reselling sneakers and make a 40% profit. If you sell $500 worth of shoes, what's your profit?",
        options: ["$100", "$200", "$300", "$500"],
        correctAnswer: 1,
        explanation: "40% of $500 = $200. That's your profit baby!"
      },
      {
        id: 5,
        question: "How many hours a week should you work on a side hustle while you're in school?",
        options: ["0-5 hours", "5-15 hours", "20-30 hours", "40+ hours"],
        correctAnswer: 1,
        explanation: "5-15 hours lets you make some cash without tanking your grades. Balance is key."
      },
      {
        id: 6,
        question: "Where should you sell your handmade crafts online?",
        options: ["LinkedIn", "Etsy", "Indeed", "Craigslist"],
        correctAnswer: 1,
        explanation: "Etsy is literally made for handmade stuff. That's where all the crafty people sell their stuff."
      },
      {
        id: 7,
        question: "You charge $25/hour for tutoring and work 8 hours a week. How much you making per month?",
        options: ["$200", "$400", "$800", "$1,000"],
        correctAnswer: 2,
        explanation: "$25 x 8 hours = $200 per week. Times 4 weeks = $800 per month. Not bad!"
      },
      {
        id: 8,
        question: "Before you start a side hustle, what's the FIRST thing you gotta do?",
        options: ["Quit your main job", "Identify your skills and market need", "Borrow money to invest", "Buy expensive equipment"],
        correctAnswer: 1,
        explanation: "Figure out what you're good at and what people actually want. Don't buy a bunch of stuff before you even know if anyone wants it."
      },
      {
        id: 9,
        question: "Which one of these makes you money while you sleep?",
        options: ["Dog walking", "Food delivery", "Digital product sales", "Tutoring"],
        correctAnswer: 2,
        explanation: "Digital products = make it once, sell it over and over. You can literally be sleeping and making sales. The other stuff? You gotta actually show up."
      },
      {
        id: 10,
        question: "You want an extra $600/month from food delivery that pays $15/hour. How many hours you gotta work?",
        options: ["10 hours", "20 hours", "30 hours", "40 hours"],
        correctAnswer: 3,
        explanation: "$600 / $15/hour = 40 hours total for the month. That's like 10 hours a week."
      }
    ],
    3: [
      {
        id: 1,
        question: "What credit score counts as 'Good'?",
        options: ["500-600", "600-670", "670-739", "740-850"],
        correctAnswer: 2,
        explanation: "670-739 is 'Good' credit. Anything in that range and you're doing solid."
      },
      {
        id: 2,
        question: "A credit card is what type of credit?",
        options: ["Installment credit", "Revolving credit", "Service credit", "Fixed credit"],
        correctAnswer: 1,
        explanation: "Credit cards are revolving credit - you can use it, pay it off, and use it again. It just keeps going round and round."
      },
      {
        id: 3,
        question: "You got a $1,000 credit limit and you've used $300. What's your utilization rate?",
        options: ["3%", "30%", "70%", "100%"],
        correctAnswer: 1,
        explanation: "$300 / $1,000 = 30%. That's how much of your available credit you're using."
      },
      {
        id: 4,
        question: "You missed a payment. How long does that screw up your credit report?",
        options: ["1 year", "3 years", "7 years", "Forever"],
        correctAnswer: 2,
        explanation: "7 whole years. Yeah, it sucks. That's why you gotta pay on time."
      },
      {
        id: 5,
        question: "Which one of these does NOT affect your credit score?",
        options: ["Payment history", "Credit utilization", "Your income", "Length of credit history"],
        correctAnswer: 2,
        explanation: "Your income doesn't matter for your credit score. You could make $20k or $200k - doesn't change the score."
      },
      {
        id: 6,
        question: "How much of your credit limit should you use to keep a good score?",
        options: ["Under 30%", "50%", "75%", "100%"],
        correctAnswer: 0,
        explanation: "Keep it under 30%. So if your limit is $1,000, try not to use more than $300 at a time."
      },
      {
        id: 7,
        question: "Who's allowed to check your credit report?",
        options: ["Landlords", "Employers", "Lenders", "All of the above"],
        correctAnswer: 3,
        explanation: "All of them can check it (with your permission). That's why you gotta keep your credit clean."
      },
      {
        id: 8,
        question: "What's the highest credit score you can get?",
        options: ["750", "800", "850", "900"],
        correctAnswer: 2,
        explanation: "850 is a perfect score. It's like getting 100% on a test."
      },
      {
        id: 9,
        question: "How often can you get a FREE credit report?",
        options: ["Once per year", "Once per month", "Every 6 months", "Never"],
        correctAnswer: 0,
        explanation: "Once a year from each of the three credit bureaus. That's three free reports total per year."
      },
      {
        id: 10,
        question: "What has the BIGGEST impact on your credit score?",
        options: ["Number of credit cards", "Payment history", "Credit inquiries", "Types of accounts"],
        correctAnswer: 1,
        explanation: "Payment history is about 35% of your score - the biggest single factor. Always pay on time!"
      }
    ],
    4: [
      {
        id: 1,
        question: "If you've got zero credit history, what's the best first credit card to get?",
        options: ["Premium rewards card", "Secured credit card", "Business credit card", "Store credit card"],
        correctAnswer: 1,
        explanation: "Secured credit cards are made for beginners. You put down a deposit and that becomes your limit. Easy way to start building credit."
      },
      {
        id: 2,
        question: "How much money you gotta put down for a $500 secured credit card?",
        options: ["$0", "$250", "$500", "$1,000"],
        correctAnswer: 2,
        explanation: "You put down $500 to get a $500 limit. Whatever you deposit is what you can spend."
      },
      {
        id: 3,
        question: "What's the sweet spot for credit utilization if you want the BEST score?",
        options: ["0%", "Under 10%", "30%", "50%"],
        correctAnswer: 1,
        explanation: "Under 10% is the goal for top-tier scores. Under 30% is good, but under 10% is even better."
      },
      {
        id: 4,
        question: "How often should you use your credit card so it doesn't get shut down?",
        options: ["Daily", "Weekly", "Monthly", "Never"],
        correctAnswer: 2,
        explanation: "Use it at least once a month for something small. Keeps it active and builds your payment history."
      },
      {
        id: 5,
        question: "What happens if you close your oldest credit card?",
        options: ["Score improves", "No effect", "Score may drop", "Account disappears"],
        correctAnswer: 2,
        explanation: "Your score might drop because it shortens your credit history. Keep old cards open if you can."
      },
      {
        id: 6,
        question: "How long should you wait before applying for another credit card?",
        options: ["1 month", "3 months", "6+ months", "1 week"],
        correctAnswer: 2,
        explanation: "Wait at least 6 months. Too many applications in a short time looks sketchy and dings your credit."
      },
      {
        id: 7,
        question: "What's the WORST thing you can do to your credit score?",
        options: ["Checking your own credit", "Missing a payment", "Using 20% of limit", "Having one credit card"],
        correctAnswer: 1,
        explanation: "Missing payments is the biggest killer. Payment history is 35% of your score, so one missed payment = major damage."
      },
      {
        id: 8,
        question: "When's the best time to pay your credit card bill?",
        options: ["Before the due date", "On the due date", "After the due date", "Only when you have money"],
        correctAnswer: 0,
        explanation: "Pay it BEFORE the due date. That way you're never late and you never get hit with fees."
      },
      {
        id: 9,
        question: "What's a realistic credit score goal for your first year?",
        options: ["500-600", "650-700", "750-800", "800-850"],
        correctAnswer: 1,
        explanation: "650-700 is totally doable in your first year. That gets you into 'good' credit territory."
      },
      {
        id: 10,
        question: "How many credit cards should you have when you're just starting out?",
        options: ["0", "1-2", "5-6", "10+"],
        correctAnswer: 1,
        explanation: "Start with 1-2 cards max. Don't go crazy. Learn to manage a couple before you get more."
      }
    ],
    5: [
      {
        id: 1,
        question: "You owe $2,000 on a credit card with 22% interest. If you only pay the minimum each month, how long till you're free?",
        options: ["1 year", "2 years", "5+ years", "6 months"],
        correctAnswer: 2,
        explanation: "Over 5 years! The interest keeps piling up when you only pay the minimum. That's why minimum payments are a trap."
      },
      {
        id: 2,
        question: "Payday loans usually charge what kind of crazy interest rate?",
        options: ["20%", "50%", "100%", "400%"],
        correctAnswer: 3,
        explanation: "Around 400%! Yeah, you read that right. Payday loans are basically legal robbery. Stay away from them."
      },
      {
        id: 3,
        question: "Got multiple debts. Which one should you pay off FIRST?",
        options: ["Lowest balance", "Highest interest rate", "Newest debt", "Oldest debt"],
        correctAnswer: 1,
        explanation: "Hit the highest interest rate first. That's the one bleeding you the most money every month."
      },
      {
        id: 4,
        question: "Your friend asks you to co-sign a loan but then doesn't pay. What happens to you?",
        options: ["Nothing", "You get a warning", "You're fully responsible", "Split the debt"],
        correctAnswer: 2,
        explanation: "You're on the hook for 100% of it. That's why you NEVER co-sign unless you're ready to pay it all yourself."
      },
      {
        id: 5,
        question: "What's the biggest problem with Buy Now, Pay Later apps?",
        options: ["High interest rates", "Easy to overspend", "Build credit too fast", "They're illegal"],
        correctAnswer: 1,
        explanation: "They make it way too easy to spend money you don't have. $25 a month sounds small until you've got 10 of them going."
      },
      {
        id: 6,
        question: "If you take a cash advance from your credit card, how long before interest starts?",
        options: ["30 days", "21 days", "7 days", "No grace period"],
        correctAnswer: 3,
        explanation: "Interest starts RIGHT AWAY. No grace period at all. Cash advances are expensive as hell."
      },
      {
        id: 7,
        question: "Store credit cards (like for clothing stores) usually have interest rates around:",
        options: ["0-10%", "10-15%", "15-20%", "25-30%"],
        correctAnswer: 3,
        explanation: "25-30%! They lure you in with a discount but then charge crazy high interest. Not worth it."
      },
      {
        id: 8,
        question: "It's an emergency and you need cash fast. What's the WORST option?",
        options: ["Emergency fund", "Personal loan", "Credit card", "Payday loan"],
        correctAnswer: 3,
        explanation: "Payday loans are predatory. The interest is insane and they trap you in a cycle of debt. Literally anything else is better."
      },
      {
        id: 9,
        question: "Those rent-to-own furniture places? You end up paying:",
        options: ["Retail price", "2-3x retail price", "Half retail price", "10% over retail"],
        correctAnswer: 1,
        explanation: "2-3 times what it's worth! You could literally buy it twice for what you end up paying. Total rip-off."
      },
      {
        id: 10,
        question: "When should you use a balance transfer credit card?",
        options: ["Building credit", "Earning rewards", "Paying off high-interest debt", "Getting cash"],
        correctAnswer: 2,
        explanation: "Balance transfers let you move high-interest debt to a lower rate. Good for getting out of debt faster if you use it right."
      }
    ],
    6: [
      {
        id: 1,
        question: "What kind of bank account should you use for your everyday spending?",
        options: ["Savings account", "Checking account", "CD", "Money market"],
        correctAnswer: 1,
        explanation: "Checking account all the way. That's what your debit card connects to and where you pay bills from."
      },
      {
        id: 2,
        question: "How many times can you usually pull money OUT of a savings account per month?",
        options: ["Unlimited", "6", "10", "1"],
        correctAnswer: 1,
        explanation: "Usually 6 times. Savings accounts aren't meant for constant withdrawals - that's what checking is for."
      },
      {
        id: 3,
        question: "FDIC insurance protects your money up to how much if the bank fails?",
        options: ["$100,000", "$250,000", "$500,000", "Unlimited"],
        correctAnswer: 1,
        explanation: "$250,000 per account. So if the bank goes under, the government's got you covered up to that amount."
      },
      {
        id: 4,
        question: "Which banks usually give you the best interest on your savings?",
        options: ["Traditional banks", "Credit unions", "Online banks", "All the same"],
        correctAnswer: 2,
        explanation: "Online banks usually pay the most because they don't have to pay for physical buildings and staff."
      },
      {
        id: 5,
        question: "What happens if you take money out of a CD before it matures?",
        options: ["Nothing", "Penalty fee", "Account closes", "Interest increases"],
        correctAnswer: 1,
        explanation: "You get hit with a penalty fee. CDs make you promise to leave the money alone for a set time."
      },
      {
        id: 6,
        question: "What's the biggest downside of online banks?",
        options: ["Lower interest", "Higher fees", "No physical branches", "Not FDIC insured"],
        correctAnswer: 2,
        explanation: "No physical location to walk into. Everything's online or on the phone. Some people don't like that."
      },
      {
        id: 7,
        question: "Which one do you NOT need to open a bank account?",
        options: ["ID", "Social Security card", "Proof of address", "Birth certificate"],
        correctAnswer: 3,
        explanation: "Birth certificate isn't needed. Just bring your ID, Social Security number, and something showing where you live."
      },
      {
        id: 8,
        question: "What's an NSF fee?",
        options: ["ATM fee", "Non-sufficient funds fee", "Monthly fee", "Wire transfer fee"],
        correctAnswer: 1,
        explanation: "Non-Sufficient Funds = you tried to spend money you don't have. Banks charge you like $35 for that. Ouch."
      },
      {
        id: 9,
        question: "How do you avoid paying monthly bank fees?",
        options: ["Ask nicely", "Direct deposit", "Use more checks", "Close account"],
        correctAnswer: 1,
        explanation: "Set up direct deposit. Most banks will waive the monthly fee if your paycheck goes straight into your account."
      },
      {
        id: 10,
        question: "You see a charge on your account that you didn't make. What do you do?",
        options: ["Wait a month", "Report immediately", "Ignore if small", "Close account"],
        correctAnswer: 1,
        explanation: "Report it ASAP! The faster you report fraud, the better protected you are. Don't wait, even if it's small."
      }
    ],
    7: [
      {
        id: 1,
        question: "In the 50/30/20 budget rule, what percentage goes to your needs?",
        options: ["20%", "30%", "50%", "70%"],
        correctAnswer: 2,
        explanation: "50% for needs (rent, food, etc.), 30% for wants (fun stuff), 20% for savings. That's the split."
      },
      {
        id: 2,
        question: "Which budgeting method makes you assign EVERY single dollar a job?",
        options: ["50/30/20", "Zero-based", "Envelope", "Pay yourself first"],
        correctAnswer: 1,
        explanation: "Zero-based budgeting = every dollar gets a purpose. You literally budget down to zero so there's no random money floating around."
      },
      {
        id: 3,
        question: "You make $2,000 a month and your fixed bills are $1,200. How much is left over?",
        options: ["$600", "$800", "$1,000", "$1,200"],
        correctAnswer: 1,
        explanation: "$2,000 - $1,200 = $800 left for everything else (variable expenses and savings)."
      },
      {
        id: 4,
        question: "Which one of these is a 'fixed' expense?",
        options: ["Groceries", "Entertainment", "Rent", "Clothing"],
        correctAnswer: 2,
        explanation: "Rent is fixed - same amount every month. Groceries, entertainment, and clothes change month to month."
      },
      {
        id: 5,
        question: "What's the FIRST thing you should do when making a budget?",
        options: ["Cut all fun spending", "Calculate income", "Cancel subscriptions", "Get a second job"],
        correctAnswer: 1,
        explanation: "Figure out how much money you're actually making. You can't budget what you don't know you have."
      },
      {
        id: 6,
        question: "The envelope budgeting method works best for what?",
        options: ["Online shopping", "Cash spending", "Investments", "Automatic bills"],
        correctAnswer: 1,
        explanation: "You literally put cash in different envelopes for different categories. When the envelope's empty, you're done spending in that category."
      },
      {
        id: 7,
        question: "How often should you check in on your budget?",
        options: ["Daily", "Weekly", "Monthly", "Yearly"],
        correctAnswer: 2,
        explanation: "At least once a month. See what's working, what's not, and adjust. Budgets aren't set-it-and-forget-it."
      },
      {
        id: 8,
        question: "What's a 'sinking fund'?",
        options: ["Lost money", "Savings for specific future expense", "Investment account", "Emergency fund"],
        correctAnswer: 1,
        explanation: "It's money you save up for something specific you know is coming - like a car repair, vacation, or holiday gifts."
      },
      {
        id: 9,
        question: "You keep going over budget every month. What should you do first?",
        options: ["Earn more money", "Review if budget is realistic", "Stop budgeting", "Never spend money"],
        correctAnswer: 1,
        explanation: "Check if your budget makes sense. Maybe you're not budgeting enough for real expenses. Gotta be realistic about what stuff actually costs."
      },
      {
        id: 10,
        question: "Which one is NOT a real benefit of budgeting?",
        options: ["Reduces financial stress", "Helps reach goals", "Guarantees wealth", "Provides spending clarity"],
        correctAnswer: 2,
        explanation: "Budgeting helps you manage money better but it doesn't guarantee you'll be rich. That's on you to make happen."
      }
    ],
    8: [
      {
        id: 1,
        question: "What should you pay FIRST when you get paid?",
        options: ["Entertainment", "Savings", "Housing/survival needs", "Wants"],
        correctAnswer: 2,
        explanation: "Rent, food, utilities - the stuff you need to survive. Pay that first before anything else."
      },
      {
        id: 2,
        question: "The 24-hour rule helps you avoid:",
        options: ["Saving money", "Impulse purchases", "Bill payments", "Income loss"],
        correctAnswer: 1,
        explanation: "See something you want? Wait 24 hours before buying it. Half the time you'll realize you don't actually need it."
      },
      {
        id: 3,
        question: "How long should your weekly money check-in take?",
        options: ["2 minutes", "10 minutes", "1 hour", "3 hours"],
        correctAnswer: 1,
        explanation: "Just 10 minutes a week. Quick check on where your money went and if you're staying on track."
      },
      {
        id: 4,
        question: "You went over budget on food this month. What should you do?",
        options: ["Give up on budgeting", "Adjust other categories", "Ignore it", "Borrow money"],
        correctAnswer: 1,
        explanation: "Shift money from another category to balance it out. Maybe spend less on entertainment this month."
      },
      {
        id: 5,
        question: "Per-use cost helps you figure out:",
        options: ["Income potential", "Value of purchases", "Credit score", "Interest rates"],
        correctAnswer: 1,
        explanation: "If you buy $100 shoes and wear them 100 times, that's $1 per wear. Helps you see if something's actually worth it."
      },
      {
        id: 6,
        question: "When should you pay rent each month?",
        options: ["Week 1", "Week 2", "Week 3", "Week 4"],
        correctAnswer: 0,
        explanation: "First week of the month - get your rent and major bills out of the way immediately."
      },
      {
        id: 7,
        question: "What's 'lifestyle creep'?",
        options: ["Saving more money", "Gradually increasing spending", "Reducing expenses", "Changing jobs"],
        correctAnswer: 1,
        explanation: "You start making more money so you start spending more. Before you know it, you're broke again even though you got a raise."
      },
      {
        id: 8,
        question: "You do gig work and your income changes every month. How should you budget?",
        options: ["Don't budget", "Budget on maximum", "Budget on minimum", "Spend freely"],
        correctAnswer: 2,
        explanation: "Budget based on your lowest month. That way you can always pay your bills, even in a slow month."
      },
      {
        id: 9,
        question: "How often should you look at your spending plan?",
        options: ["Once a year", "Never", "Daily and weekly", "Only when broke"],
        correctAnswer: 2,
        explanation: "Quick daily checks and a weekly review. Keeps you aware of where your money's going."
      },
      {
        id: 10,
        question: "Which one is NOT a spending priority?",
        options: ["Housing", "Emergency fund", "Latest iPhone", "Food"],
        correctAnswer: 2,
        explanation: "The new iPhone is a want. Housing, emergency savings, and food are needs. Priorities first."
      }
    ],
    9: [
      {
        id: 1,
        question: "What percentage of employers Google you before deciding to hire you?",
        options: ["25%", "50%", "70%+", "10%"],
        correctAnswer: 2,
        explanation: "Over 70%! They're definitely looking you up. Your digital footprint matters."
      },
      {
        id: 2,
        question: "Which email address looks the most professional?",
        options: ["partygirl2024@email.com", "firstname.lastname@email.com", "sk8rboi@email.com", "420blazeit@email.com"],
        correctAnswer: 1,
        explanation: "Just use your real name. firstname.lastname@email.com is clean and professional. The others? Hard pass."
      },
      {
        id: 3,
        question: "How long should a professional handshake be?",
        options: ["1 second", "2-3 seconds", "5 seconds", "10 seconds"],
        correctAnswer: 1,
        explanation: "2-3 seconds, firm grip, eye contact. Not too long or it gets weird."
      },
      {
        id: 4,
        question: "Which one is NOT part of your personal brand?",
        options: ["Appearance", "Communication", "Parents' jobs", "Online presence"],
        correctAnswer: 2,
        explanation: "Your brand is about YOU - how you look, talk, and show up. Not what your parents do for work."
      },
      {
        id: 5,
        question: "What should your LinkedIn headline say?",
        options: ["Your current role and value proposition", "Your favorite quote", "Your hobbies", "Your relationship status"],
        correctAnswer: 0,
        explanation: "Tell people what you do and what value you bring. Save the quotes and relationship status for other platforms."
      },
      {
        id: 6,
        question: "How often should you post or update your LinkedIn?",
        options: ["Never", "Once a year", "Monthly", "Daily"],
        correctAnswer: 2,
        explanation: "At least monthly. Share wins, new skills, interesting articles. Keeps you visible and relevant."
      },
      {
        id: 7,
        question: "Which social media post will definitely hurt your chances of getting hired?",
        options: ["Volunteer work photo", "Graduation picture", "Party with illegal activity", "Professional achievement"],
        correctAnswer: 2,
        explanation: "Anything illegal or super unprofessional = instant red flag. Employers WILL see it and WILL judge you."
      },
      {
        id: 8,
        question: "What should be in your professional email signature?",
        options: ["Favorite emoji", "Name, title, contact info", "Personal photos", "Religious quotes"],
        correctAnswer: 1,
        explanation: "Keep it simple: your name, what you do, and how to reach you. That's it."
      },
      {
        id: 9,
        question: "When you meet someone in a professional setting, you should:",
        options: ["Look at your phone", "Make eye contact", "Slouch", "Chew gum"],
        correctAnswer: 1,
        explanation: "Eye contact shows confidence and respect. Phone down, stand up straight, no gum."
      },
      {
        id: 10,
        question: "Your personal brand should be:",
        options: ["Fake", "Exactly like everyone else's", "Authentic and professional", "Only online"],
        correctAnswer: 2,
        explanation: "Be yourself, but the professional version. Real, but polished. Online AND in person."
      }
    ],
    10: [
      {
        id: 1,
        question: "If you just graduated, how long should your resume be?",
        options: ["3 pages", "2 pages", "1 page", "Half page"],
        correctAnswer: 2,
        explanation: "One page max. You don't have 20 years of experience yet, so keep it tight and focused."
      },
      {
        id: 2,
        question: "Should you put your GPA on your resume?",
        options: ["Any GPA", "3.0+", "3.5+", "Never include GPA"],
        correctAnswer: 2,
        explanation: "Only if it's 3.5 or higher. If it's lower, just leave it off. Nobody needs to see that 2.7."
      },
      {
        id: 3,
        question: "Which is the strongest action verb for a resume bullet point?",
        options: ["Did", "Helped", "Achieved", "Was responsible for"],
        correctAnswer: 2,
        explanation: "'Achieved' shows you got results. 'Did' and 'helped' are weak. 'Was responsible for' is wordy. Be strong and direct."
      },
      {
        id: 4,
        question: "What percentage of resumes get filtered out by computer systems (ATS) before a human even sees them?",
        options: ["25%", "50%", "75%+", "10%"],
        correctAnswer: 2,
        explanation: "Over 75%! A robot reads your resume first. If you don't have the right keywords, you're done."
      },
      {
        id: 5,
        question: "How long should your cover letter be?",
        options: ["3 pages", "2 pages", "1 page", "1 paragraph"],
        correctAnswer: 2,
        explanation: "One page. Nobody's reading a 3-page cover letter. Keep it short and punchy."
      },
      {
        id: 6,
        question: "Which email should you use when applying for jobs?",
        options: ["coolguy99@email.com", "john.smith@email.com", "partyallnight@email.com", "unemployed2024@email.com"],
        correctAnswer: 1,
        explanation: "Use your real name. john.smith@email.com is professional. The others make you look like you're not serious."
      },
      {
        id: 7,
        question: "Your resume bullet points should start with:",
        options: ["I", "My", "Action verbs", "The company name"],
        correctAnswer: 2,
        explanation: "Action verbs! 'Managed,' 'Created,' 'Led' - hit them with strong verbs that show what you did."
      },
      {
        id: 8,
        question: "What should you NOT put on your resume?",
        options: ["Education", "Experience", "Photo", "Skills"],
        correctAnswer: 2,
        explanation: "No photos (unless you're in a country where it's normal). In the US, it can lead to bias. Just don't."
      },
      {
        id: 9,
        question: "After you apply for a job, when should you follow up?",
        options: ["Same day", "1 week", "1 month", "Never"],
        correctAnswer: 1,
        explanation: "Wait about a week, then follow up. Shows you're interested without being annoying."
      },
      {
        id: 10,
        question: "What file format should you send your resume in?",
        options: [".jpg", ".png", ".docx", ".zip"],
        correctAnswer: 2,
        explanation: ".docx works best with those robot systems (ATS). PDFs can sometimes mess things up."
      }
    ]
  };

  // Add more weeks (11-18) with placeholder
  for (let i = 11; i <= 18; i++) {
    if (!quizData[i]) {
      quizData[i] = quizData[1].map((q, idx) => ({
        ...q,
        id: idx + 1,
        question: `Week ${i} Question ${idx + 1}: ${q.question}`,
      }));
    }
  }

  const questions = quizData[weekNumber] || [];
  const totalQuestions = questions.length;

  // Timer effect
  useEffect(() => {
    if (quizStarted && !showResults && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && quizStarted) {
      handleQuizComplete();
    }
  }, [timeRemaining, quizStarted, showResults]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
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
      handleQuizComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuizComplete = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const getGradeInfo = (score: number) => {
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 90) return { grade: 'A', color: 'text-[#50D890]', passed: true };
    if (percentage >= 80) return { grade: 'B', color: 'text-[#4A5FFF]', passed: true };
    if (percentage >= 70) return { grade: 'C', color: 'text-[#FF6B35]', passed: true };
    if (percentage >= 60) return { grade: 'D', color: 'text-[#FF6B35]', passed: true };
    return { grade: 'F', color: 'text-red-500', passed: false };
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setTimeRemaining(600);
    setQuizStarted(false);
  };

  const handleComplete = () => {
    const score = calculateScore();
    const { passed } = getGradeInfo(score);
    onComplete(score, passed);
  };

  // Pre-quiz screen
  if (!quizStarted) {
    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <img src={logo} alt="Beyond The Game" className="h-12 object-contain opacity-80"/>
          <div className="w-10"></div>
        </div>

        {/* Quiz Introduction */}
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] rounded-full flex items-center justify-center mx-auto mb-4 btn-3d">
            <Target className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-white font-bold text-2xl mb-2">Quiz Time!</h1>
          <h2 className="text-[#4A5FFF] font-bold text-lg mb-4">{weekTitle}</h2>

          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#50D890] rounded-full"></div>
              <span className="text-white/80">{totalQuestions} multiple choice questions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#FF6B35] rounded-full"></div>
              <span className="text-white/80">10 minutes time limit</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#4A5FFF] rounded-full"></div>
              <span className="text-white/80">70% required to pass</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#9B59B6] rounded-full"></div>
              <span className="text-white/80">Unlimited retakes allowed</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          className="w-full bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] text-white font-bold py-4 rounded-xl btn-3d hover:scale-105 transition-all duration-300 text-center"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const score = calculateScore();
    const { grade, color, passed } = getGradeInfo(score);
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-center">
          <img src={logo} alt="Beyond The Game" className="h-12 object-contain opacity-80"/>
        </div>

        {/* Results */}
        <div className="glass-card rounded-xl p-6 text-center">
          <div className={`w-20 h-20 ${passed ? 'bg-gradient-to-r from-[#50D890] to-[#4ECDC4]' : 'bg-gradient-to-r from-red-500 to-red-600'} rounded-full flex items-center justify-center mx-auto mb-4 btn-3d`}>
            {passed ? (
              <Trophy className="w-10 h-10 text-white" />
            ) : (
              <XCircle className="w-10 h-10 text-white" />
            )}
          </div>

          <h1 className="text-white font-bold text-2xl mb-2">
            {passed ? 'Congratulations!' : 'Keep Trying!'}
          </h1>
          <h2 className="text-white/80 text-lg mb-6">{weekTitle}</h2>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80">Your Score</span>
                <span className={`font-bold text-xl ${color}`}>{score}/{totalQuestions}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/80">Percentage</span>
                <span className={`font-bold text-xl ${color}`}>{percentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">Grade</span>
                <span className={`font-bold text-2xl ${color}`}>{grade}</span>
              </div>
            </div>

            {passed && (
              <div className="bg-gradient-to-r from-[#50D890]/20 to-[#4ECDC4]/20 border border-[#50D890]/30 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-[#50D890]" />
                  <span className="text-[#50D890] font-bold">Quiz Passed!</span>
                </div>
                <p className="text-white/80 text-sm">Great job! You've mastered this week's material.</p>
              </div>
            )}

            {!passed && (
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-bold">Need 70% to Pass</span>
                </div>
                <p className="text-white/80 text-sm">Review the material and try again. You've got this!</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Review Section */}
        <div className="glass-card rounded-xl p-6 max-h-96 overflow-y-auto">
          <h3 className="text-white font-bold text-lg mb-4">Question Review</h3>
          <div className="space-y-4">
            {questions.map((question, index) => {
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

                    {question.explanation && (
                      <div className="mt-2 p-2 bg-white/5 rounded-lg">
                        <p className="text-white/70 text-xs">{question.explanation}</p>
                      </div>
                    )}
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
              onClick={handleRetakeQuiz}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8E53] text-white font-bold py-4 rounded-xl btn-3d hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Retake Quiz</span>
            </button>
          )}

          <button
            onClick={handleComplete}
            className="w-full bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] text-white font-bold py-4 rounded-xl btn-3d hover:scale-105 transition-all duration-300"
          >
            {passed ? 'Continue Learning' : 'Back to Course'}
          </button>
        </div>
      </div>
    );
  }

  // Quiz screen
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-white/80 text-sm">{formatTime(timeRemaining)}</span>
          <div className="w-px h-4 bg-white/20"></div>
          <span className="text-white/80 text-sm">{currentQuestion + 1}/{totalQuestions}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-6">{currentQ?.question}</h2>

        <div className="space-y-3">
          {currentQ?.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                selectedAnswers[currentQuestion] === index
                  ? 'bg-gradient-to-r from-[#4A5FFF]/30 to-[#00BFFF]/30 border-2 border-[#4A5FFF]/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-[#4A5FFF] bg-[#4A5FFF]'
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
          className={`flex-1 py-3 pl-6 rounded-xl font-medium transition-all duration-300 ${
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
              ? 'bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] text-white btn-3d hover:scale-105'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {currentQuestion === totalQuestions - 1 ? 'Finish Quiz' : 'Next'}
        </button>
      </div>
    </div>
  );
}
