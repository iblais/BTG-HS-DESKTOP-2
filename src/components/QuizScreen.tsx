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
  programId?: string;
  onBack: () => void;
  onComplete: (score: number, passed: boolean) => void;
}

export function QuizScreen({
  weekNumber,
  weekTitle,
  programId = 'HS',
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
    ],
    11: [
      {
        id: 1,
        question: "What's the most important skill employers look for beyond technical abilities?",
        options: ["Communication skills", "Physical appearance", "Social media following", "Expensive wardrobe"],
        correctAnswer: 0,
        explanation: "Communication skills consistently rank as the #1 soft skill employers want. Technical skills can be taught, but communication is foundational."
      },
      {
        id: 2,
        question: "When should you arrive for a professional meeting or interview?",
        options: ["Exactly on time", "5-10 minutes early", "30 minutes early", "Whenever you can"],
        correctAnswer: 1,
        explanation: "5-10 minutes early is ideal. It shows respect without being awkwardly early. Exactly on time often means you're actually late."
      },
      {
        id: 3,
        question: "What's the best approach when you make a mistake at work?",
        options: ["Hide it and hope no one notices", "Blame someone else", "Own it, fix it, learn from it", "Quit immediately"],
        correctAnswer: 2,
        explanation: "Taking responsibility and learning from mistakes builds trust and shows maturity. Everyone makes mistakes - how you handle them defines you."
      },
      {
        id: 4,
        question: "Which statement best describes leadership?",
        options: ["Being the boss and giving orders", "Having the biggest title", "Influencing and helping others succeed", "Working alone to prove yourself"],
        correctAnswer: 2,
        explanation: "Leadership is about influence, not authority. You can lead from any position by helping others succeed and taking initiative."
      },
      {
        id: 5,
        question: "When problem-solving at work, you should:",
        options: ["Wait for someone to tell you what to do", "Bring problems AND potential solutions", "Only point out problems", "Ignore problems you notice"],
        correctAnswer: 1,
        explanation: "Don't just bring problems - bring solutions too. This shows initiative and critical thinking. Even if your solution isn't chosen, the effort is valued."
      },
      {
        id: 6,
        question: "What's the 'transferable skill' advantage of student experience?",
        options: ["Free tickets to games", "Nothing useful", "Time management, discipline, teamwork", "Automatic job offers"],
        correctAnswer: 2,
        explanation: "Your student experiences build valuable transferable skills: discipline, time management, teamwork, performing under pressure, and goal-setting."
      },
      {
        id: 7,
        question: "How should you handle a difficult conversation at work?",
        options: ["Avoid it completely", "Send an angry email", "Have it privately and professionally", "Complain to everyone else first"],
        correctAnswer: 2,
        explanation: "Address issues directly and professionally. Private conversations prevent embarrassment and allow for honest dialogue."
      },
      {
        id: 8,
        question: "What does 'emotional intelligence' mean in the workplace?",
        options: ["Being really smart", "Understanding and managing emotions", "Never showing any emotion", "Crying at work"],
        correctAnswer: 1,
        explanation: "EQ is understanding your own emotions, managing them, and empathizing with others. It's crucial for leadership and teamwork."
      },
      {
        id: 9,
        question: "Which is TRUE about professional growth?",
        options: ["It stops after graduation", "It only happens through formal training", "It's a lifelong continuous process", "Only managers need to grow"],
        correctAnswer: 2,
        explanation: "Professional growth never stops. The most successful people are continuous learners who adapt and develop throughout their careers."
      },
      {
        id: 10,
        question: "What's the best way to handle feedback you disagree with?",
        options: ["Argue immediately", "Listen, consider it, then respond thoughtfully", "Ignore it completely", "Complain to others about it"],
        correctAnswer: 1,
        explanation: "Listen first, consider the feedback honestly, and respond thoughtfully. Even feedback you disagree with often contains useful insights."
      }
    ],
    12: [
      {
        id: 1,
        question: "What percentage of jobs are filled through networking rather than job postings?",
        options: ["10-20%", "30-40%", "50-60%", "70-80%"],
        correctAnswer: 3,
        explanation: "70-80% of jobs are filled through networking! Most opportunities never get posted publicly. This is called the 'hidden job market.'"
      },
      {
        id: 2,
        question: "When following up after meeting someone professionally, you should:",
        options: ["Wait a month to not seem eager", "Follow up within 24-48 hours", "Never follow up", "Call them every day"],
        correctAnswer: 1,
        explanation: "Follow up within 24-48 hours while you're still fresh in their memory. A quick thank-you email or LinkedIn connection works great."
      },
      {
        id: 3,
        question: "What's an 'informational interview'?",
        options: ["A formal job interview", "A casual meeting to learn about someone's career", "A salary negotiation", "A performance review"],
        correctAnswer: 1,
        explanation: "It's a conversation (not a job interview) where you learn about someone's career path, industry, and advice. Great for networking!"
      },
      {
        id: 4,
        question: "What's the best networking approach?",
        options: ["Only reach out when you need something", "Build relationships before you need them", "Just collect business cards", "Send mass messages to everyone"],
        correctAnswer: 1,
        explanation: "Network before you need it. Building genuine relationships over time means help is available when you actually need it."
      },
      {
        id: 5,
        question: "LinkedIn is most valuable for:",
        options: ["Sharing vacation photos", "Professional networking and job searching", "Playing games", "Dating"],
        correctAnswer: 1,
        explanation: "LinkedIn is THE platform for professional networking, job searching, and building your career brand. Treat it professionally."
      },
      {
        id: 6,
        question: "When networking, the most effective approach is:",
        options: ["Talking only about yourself", "Asking how you can help THEM", "Immediately asking for a job", "Avoiding eye contact"],
        correctAnswer: 1,
        explanation: "The best networkers focus on giving, not getting. Ask how you can help others. The help comes back around naturally."
      },
      {
        id: 7,
        question: "What should you include in a LinkedIn connection request?",
        options: ["Nothing, just click connect", "A generic message to everyone", "A personalized message explaining why you're connecting", "Your entire resume"],
        correctAnswer: 2,
        explanation: "Personalize every connection request. Explain how you know them or why you want to connect. Generic requests often get ignored."
      },
      {
        id: 8,
        question: "How often should you engage with your professional network?",
        options: ["Only when job hunting", "Once a year", "Regularly, even when you don't need anything", "Never"],
        correctAnswer: 2,
        explanation: "Stay in touch regularly - share articles, congratulate achievements, check in periodically. Don't be a 'ghost who only appears when job hunting.'"
      },
      {
        id: 9,
        question: "What's a 'warm introduction'?",
        options: ["Introducing yourself in hot weather", "Being introduced by a mutual connection", "Sending a heated email", "Cold calling someone"],
        correctAnswer: 1,
        explanation: "A warm introduction is when someone who knows both you and your target contact makes the introduction. Much more effective than cold outreach."
      },
      {
        id: 10,
        question: "At networking events, you should:",
        options: ["Stay in the corner on your phone", "Have a 30-second intro ready and ask questions", "Talk only about yourself", "Leave immediately after arriving"],
        correctAnswer: 1,
        explanation: "Be prepared with a brief intro, but spend most of the time asking questions and showing genuine interest in others."
      }
    ],
    13: [
      {
        id: 1,
        question: "What's the difference between an entrepreneur and an employee?",
        options: ["Entrepreneurs are smarter", "Entrepreneurs own risk and reward, employees trade time for money", "There is no difference", "Employees work harder"],
        correctAnswer: 1,
        explanation: "Entrepreneurs take on risk in exchange for potentially unlimited reward. Employees trade their time for a guaranteed paycheck. Neither is 'better.'"
      },
      {
        id: 2,
        question: "What's the first step before starting a business?",
        options: ["Quit your job immediately", "Validate that people will pay for your solution", "Borrow as much money as possible", "Print business cards"],
        correctAnswer: 1,
        explanation: "Validate your idea FIRST. Talk to potential customers, make sure there's real demand before investing time and money."
      },
      {
        id: 3,
        question: "An MVP (Minimum Viable Product) is:",
        options: ["A video game award", "The simplest version that tests your core idea", "The final polished product", "A type of business loan"],
        correctAnswer: 1,
        explanation: "MVP is the simplest version of your product that lets you test your core idea with real customers. Build fast, learn fast."
      },
      {
        id: 4,
        question: "What's 'bootstrapping' a business?",
        options: ["Starting with no shoes", "Self-funding without external investors", "A type of dance", "Buying cheap equipment"],
        correctAnswer: 1,
        explanation: "Bootstrapping means growing your business using your own money and revenue, without taking outside investment. You keep full control."
      },
      {
        id: 5,
        question: "Which is a common reason startups fail?",
        options: ["Building something nobody wants", "Having too much customer feedback", "Growing too slowly", "Saving too much money"],
        correctAnswer: 0,
        explanation: "The #1 reason startups fail is building something nobody wants. That's why customer validation is so critical before you build."
      },
      {
        id: 6,
        question: "What's the difference between a side hustle and a business?",
        options: ["Side hustles are illegal", "Businesses are always bigger", "Side hustles have more flexible time commitment", "There is no difference"],
        correctAnswer: 2,
        explanation: "Side hustles typically have flexible, part-time commitment alongside another job. Businesses often require full-time focus and more structure."
      },
      {
        id: 7,
        question: "When pricing your product or service, you should:",
        options: ["Always be the cheapest", "Consider value to customer, costs, and competition", "Copy exact competitor prices", "Make it free"],
        correctAnswer: 1,
        explanation: "Price based on value, not just cost. Consider what it's worth to customers, your costs, and competitive pricing. Most new entrepreneurs underprice."
      },
      {
        id: 8,
        question: "What's a 'value proposition'?",
        options: ["A business loan offer", "The unique value your product provides to customers", "A marriage proposal", "A legal document"],
        correctAnswer: 1,
        explanation: "Your value proposition explains what unique value you provide, to whom, and why they should choose you over alternatives."
      },
      {
        id: 9,
        question: "How many potential customers should you talk to before building a product?",
        options: ["0 - just build it", "1-2", "10-20+", "1000+"],
        correctAnswer: 2,
        explanation: "Talk to at least 10-20 potential customers. You need enough data points to spot patterns and validate (or invalidate) your assumptions."
      },
      {
        id: 10,
        question: "What mindset is most important for entrepreneurs?",
        options: ["Fear of failure", "Resilience and learning from setbacks", "Perfectionism", "Avoiding all risks"],
        correctAnswer: 1,
        explanation: "Resilience is key. Failure is inevitable in entrepreneurship - it's feedback, not defeat. Successful entrepreneurs learn and keep going."
      }
    ],
    14: [
      {
        id: 1,
        question: "What's the purpose of a business plan?",
        options: ["To impress your friends", "To organize your thinking and communicate your strategy", "It's only needed for loans", "To predict the future exactly"],
        correctAnswer: 1,
        explanation: "A business plan helps you think through your strategy and communicate it to others. It's a thinking tool, not a crystal ball."
      },
      {
        id: 2,
        question: "What's 'break-even' in business?",
        options: ["When you tie in a game", "When revenue equals costs (no profit or loss)", "When your business fails", "When you get investors"],
        correctAnswer: 1,
        explanation: "Break-even is when your total revenue equals your total costs. Below break-even you're losing money, above it you're profitable."
      },
      {
        id: 3,
        question: "Fixed costs in a business are:",
        options: ["Costs that stay the same regardless of sales", "Costs that are broken", "Costs that change with sales", "Free costs"],
        correctAnswer: 0,
        explanation: "Fixed costs (like rent, salaries) stay the same whether you sell 1 item or 1000. Variable costs (like materials) change with volume."
      },
      {
        id: 4,
        question: "What's 'customer acquisition cost' (CAC)?",
        options: ["How much you pay customers", "How much it costs to get a new customer", "The cost of your product", "A type of tax"],
        correctAnswer: 1,
        explanation: "CAC is the total cost to acquire a new customer (marketing, sales, etc.). It needs to be less than what customers are worth to you."
      },
      {
        id: 5,
        question: "What's 'lifetime value' (LTV) of a customer?",
        options: ["How long they live", "Total revenue from a customer over time", "Their insurance policy", "First purchase only"],
        correctAnswer: 1,
        explanation: "LTV is the total revenue you expect from a customer over your entire relationship. LTV should be higher than CAC for a sustainable business."
      },
      {
        id: 6,
        question: "What's a 'pitch deck'?",
        options: ["A wooden deck for pitching", "A presentation summarizing your business for investors", "A sales technique", "A boat part"],
        correctAnswer: 1,
        explanation: "A pitch deck is a short presentation (usually 10-15 slides) that summarizes your business, market, team, and ask for potential investors."
      },
      {
        id: 7,
        question: "When should you start building business credit?",
        options: ["Only when you need a loan", "When your business is 10 years old", "From the beginning", "Never"],
        correctAnswer: 2,
        explanation: "Start building business credit early. Separate business and personal finances, get a business bank account and card, pay on time."
      },
      {
        id: 8,
        question: "What's the difference between revenue and profit?",
        options: ["They're the same thing", "Revenue is total income, profit is what's left after expenses", "Profit is before expenses", "Revenue is taxable, profit isn't"],
        correctAnswer: 1,
        explanation: "Revenue is total money coming in. Profit is what remains after subtracting all expenses. A business can have high revenue but low/no profit."
      },
      {
        id: 9,
        question: "Why might someone choose to form an LLC?",
        options: ["It sounds cool", "For liability protection and tax flexibility", "It's required by law", "To avoid all taxes"],
        correctAnswer: 1,
        explanation: "LLCs separate personal and business liability (protecting personal assets) and offer tax flexibility. Consult a professional for your situation."
      },
      {
        id: 10,
        question: "What's 'cash flow' in business?",
        options: ["Money flowing to charity", "The timing of money in vs money out", "Only income", "Only expenses"],
        correctAnswer: 1,
        explanation: "Cash flow is about TIMING - when money comes in vs when it goes out. Profitable businesses can still fail if cash flow is poorly managed."
      }
    ],
    15: [
      {
        id: 1,
        question: "What's the most important part of a presentation?",
        options: ["Fancy slides", "Knowing your audience and what they care about", "Speaking fast", "Using lots of jargon"],
        correctAnswer: 1,
        explanation: "Understanding your audience is everything. Tailor your message to what THEY care about, not just what you want to say."
      },
      {
        id: 2,
        question: "How long should you speak before checking if the audience is engaged?",
        options: ["Never check", "Every 5-10 minutes", "Only at the end", "Every 30 seconds"],
        correctAnswer: 1,
        explanation: "Engage your audience every 5-10 minutes with questions, interactions, or key takeaways. Keep them active, not passive listeners."
      },
      {
        id: 3,
        question: "When receiving feedback on your presentation, you should:",
        options: ["Argue with every point", "Listen openly and thank the person", "Ignore it completely", "Get defensive immediately"],
        correctAnswer: 1,
        explanation: "Listen openly to feedback without getting defensive. Thank the person. Then decide what's actionable. Not all feedback needs to be implemented."
      },
      {
        id: 4,
        question: "The 'hook' of a presentation is:",
        options: ["A fishing term", "Something that grabs attention in the first 10-30 seconds", "The conclusion", "A technical problem"],
        correctAnswer: 1,
        explanation: "Your hook grabs attention immediately. Start with a surprising fact, compelling question, or powerful story to pull people in."
      },
      {
        id: 5,
        question: "How many times should you practice a presentation before delivering it?",
        options: ["0 - just wing it", "1-2 times", "Until you're confident", "100 times"],
        correctAnswer: 2,
        explanation: "Practice until you're confident, not just prepared. For most people, that's 5-10 run-throughs. Practice out loud, not just in your head."
      },
      {
        id: 6,
        question: "During Q&A, if you don't know the answer, you should:",
        options: ["Make something up", "Say 'I don't know, but I'll find out' honestly", "Ignore the question", "Get angry"],
        correctAnswer: 1,
        explanation: "It's okay to not know everything. 'I don't know, but I'll find out' is honest and professional. Then actually follow up."
      },
      {
        id: 7,
        question: "Stories in presentations are effective because:",
        options: ["They take up time", "People remember stories better than facts", "They're easier to prepare", "They avoid hard topics"],
        correctAnswer: 1,
        explanation: "Stories are memorable. Facts tell, but stories sell. Use real examples and narratives to make your points stick."
      },
      {
        id: 8,
        question: "How should slides support your presentation?",
        options: ["They should be walls of text", "They should be visual aids, not a script", "You should read directly from them", "They should replace you entirely"],
        correctAnswer: 1,
        explanation: "Slides are visual aids to support YOUR presentation. Use images, key points, and minimal text. Don't read from slides."
      },
      {
        id: 9,
        question: "What's the 'rule of three' in presentations?",
        options: ["Use three fonts", "Present in groups of three", "People remember things better in threes", "Speak for three hours"],
        correctAnswer: 2,
        explanation: "Three main points, three examples, three takeaways. Our brains find threes memorable and satisfying. Use this to your advantage."
      },
      {
        id: 10,
        question: "After a presentation, you should:",
        options: ["Disappear immediately", "Follow up with key contacts and share materials", "Ignore everyone", "Take a long vacation"],
        correctAnswer: 1,
        explanation: "Follow up! Share your slides, connect with people who showed interest, and capitalize on the momentum from your presentation."
      }
    ],
    16: [
      {
        id: 1,
        question: "What's the 'Rule of 72' used for?",
        options: ["Retirement age", "Estimating how long to double your money", "Credit scores", "Tax calculations"],
        correctAnswer: 1,
        explanation: "Divide 72 by your interest rate to estimate years to double your money. At 8% return, your money doubles in about 9 years (72÷8=9)."
      },
      {
        id: 2,
        question: "What's 'compound interest'?",
        options: ["Interest on your principal only", "Interest on your interest AND principal", "A type of fee", "Interest you owe"],
        correctAnswer: 1,
        explanation: "Compound interest earns interest on interest. $100 at 10% becomes $110, then next year you earn 10% on $110, not just $100. Growth accelerates."
      },
      {
        id: 3,
        question: "What's diversification in investing?",
        options: ["Putting all money in one stock", "Spreading investments across different assets", "Avoiding the stock market", "Only investing in bonds"],
        correctAnswer: 1,
        explanation: "Diversification means spreading investments across different assets, sectors, and geographies to reduce risk. Don't put all eggs in one basket."
      },
      {
        id: 4,
        question: "What's a Roth IRA advantage?",
        options: ["Tax deduction now", "Tax-free growth and withdrawals in retirement", "Unlimited contributions", "Employer matching"],
        correctAnswer: 1,
        explanation: "Roth IRA: pay taxes now, your money grows tax-free, and withdrawals in retirement are tax-free. Great for young people expecting higher future income."
      },
      {
        id: 5,
        question: "What's an index fund?",
        options: ["A book index", "A fund that tracks a market index like S&P 500", "An individual stock", "A savings account"],
        correctAnswer: 1,
        explanation: "Index funds track a market index (like S&P 500), giving you broad diversification at low cost. Simple and effective for most investors."
      },
      {
        id: 6,
        question: "What's 'dollar cost averaging'?",
        options: ["Exchanging dollars for coins", "Investing a fixed amount regularly regardless of price", "Timing the market", "Only buying when cheap"],
        correctAnswer: 1,
        explanation: "Invest the same amount regularly (weekly, monthly). You buy more shares when prices are low, fewer when high. No need to time the market."
      },
      {
        id: 7,
        question: "At what age should you start investing for retirement?",
        options: ["30s", "40s", "50s", "As soon as possible"],
        correctAnswer: 3,
        explanation: "Start as soon as possible! Time is your biggest advantage. Someone who starts at 22 beats someone who starts at 32 with more money, because of compound growth."
      },
      {
        id: 8,
        question: "What's the advantage of a 401(k) employer match?",
        options: ["It's optional", "It's literally free money", "It reduces your salary", "It has no advantage"],
        correctAnswer: 1,
        explanation: "Employer 401(k) match is FREE MONEY. If your employer matches 3%, that's an instant 3% return. Always contribute at least enough to get the full match."
      },
      {
        id: 9,
        question: "What's 'asset allocation'?",
        options: ["Donating assets", "How you divide investments between stocks, bonds, etc.", "Selling everything", "Only investing in real estate"],
        correctAnswer: 1,
        explanation: "Asset allocation is how you divide your portfolio between different asset classes (stocks, bonds, real estate). It determines most of your risk and return."
      },
      {
        id: 10,
        question: "Why is long-term investing usually better than short-term trading?",
        options: ["It's more exciting", "Lower costs, lower taxes, and time smooths volatility", "Markets always go up", "It requires no thought"],
        correctAnswer: 1,
        explanation: "Long-term investing means lower transaction costs, more favorable tax treatment, and time to ride out market ups and downs. Most traders underperform."
      }
    ],
    17: [
      {
        id: 1,
        question: "What's 'financial independence'?",
        options: ["Being rich", "Having enough passive income to cover expenses", "Never working again", "Inheriting money"],
        correctAnswer: 1,
        explanation: "Financial independence means your passive income (investments, rental income, etc.) covers your living expenses. You work by choice, not necessity."
      },
      {
        id: 2,
        question: "What's the '4% rule' in retirement planning?",
        options: ["Only save 4% of income", "Withdraw 4% yearly from investments in retirement", "Retire at age 4", "Pay 4% in fees"],
        correctAnswer: 1,
        explanation: "The 4% rule suggests you can withdraw 4% of your portfolio yearly in retirement without running out. $1M portfolio = $40K/year sustainable withdrawal."
      },
      {
        id: 3,
        question: "What's your 'FI number'?",
        options: ["Your age", "Annual expenses x 25", "Your credit score", "Your salary"],
        correctAnswer: 1,
        explanation: "FI number = Annual Expenses × 25. If you need $40K/year to live, your FI number is $1M. That's roughly how much you need invested to be financially independent."
      },
      {
        id: 4,
        question: "Which is most important for building wealth over time?",
        options: ["High income only", "Consistent saving and investing over decades", "Getting lucky once", "Spending less than $10/day"],
        correctAnswer: 1,
        explanation: "Consistent saving and investing over time beats everything else. Time in the market and compound interest do the heavy lifting."
      },
      {
        id: 5,
        question: "What's 'lifestyle creep'?",
        options: ["Scary movies", "Spending more as income increases", "Moving to a new house", "A fitness trend"],
        correctAnswer: 1,
        explanation: "Lifestyle creep is when your spending automatically rises with your income. Combat it by banking raises instead of spending them."
      },
      {
        id: 6,
        question: "Estate planning is important because:",
        options: ["It's only for rich people", "It ensures your wishes are carried out after death", "It's legally required", "It reduces income taxes"],
        correctAnswer: 1,
        explanation: "Estate planning (wills, beneficiaries, trusts) ensures your assets go where you want and your wishes are followed. Everyone needs basic estate planning."
      },
      {
        id: 7,
        question: "What's the benefit of having multiple income streams?",
        options: ["More complex taxes", "If one fails, others continue; more total income", "Less work overall", "Required by law"],
        correctAnswer: 1,
        explanation: "Multiple income streams provide security (if one fails, others continue) and increase total income potential. Diversify your income like your investments."
      },
      {
        id: 8,
        question: "What's 'passive income'?",
        options: ["Income from being lazy", "Income that comes with minimal ongoing effort", "Government payments", "Income you hide"],
        correctAnswer: 1,
        explanation: "Passive income requires upfront work but then generates ongoing income with minimal effort: investments, rental properties, royalties, digital products."
      },
      {
        id: 9,
        question: "Which statement about money and happiness is TRUE?",
        options: ["More money always equals more happiness", "Money has no impact on happiness", "Money removes stress up to a point, then impact decreases", "Happiness makes you rich"],
        correctAnswer: 2,
        explanation: "Research shows money increases happiness by removing financial stress, but the effect diminishes once basic needs and security are covered."
      },
      {
        id: 10,
        question: "What's the most important next step after finishing this course?",
        options: ["Do nothing", "Take action on what you learned", "Start another course immediately", "Forget everything"],
        correctAnswer: 1,
        explanation: "Knowledge without action is worthless. Take one action in the next 24 hours. Start small, be consistent, and keep learning."
      }
    ],
    18: [
      {
        id: 1,
        question: "What's the most important financial habit to maintain?",
        options: ["Checking investments daily", "Spending less than you earn and investing the difference", "Avoiding all debt", "Never spending money on fun"],
        correctAnswer: 1,
        explanation: "The core habit: spend less than you earn, invest the difference consistently. This simple formula, applied over time, builds wealth."
      },
      {
        id: 2,
        question: "How often should you review your financial plan?",
        options: ["Never", "Every 10 years", "At least quarterly, with annual deep reviews", "Only when something bad happens"],
        correctAnswer: 2,
        explanation: "Review quarterly to stay on track. Do a deeper annual review to assess progress, adjust goals, and optimize your strategy."
      },
      {
        id: 3,
        question: "What's the benefit of automating your finances?",
        options: ["It's complicated", "You make better decisions and can't forget", "Banks don't allow it", "It costs extra"],
        correctAnswer: 1,
        explanation: "Automation ensures you save/invest consistently without relying on willpower. Set up automatic transfers and let the system work for you."
      },
      {
        id: 4,
        question: "Why should you teach others about financial literacy?",
        options: ["To show off", "Teaching reinforces your own knowledge", "It's legally required", "To make money from them"],
        correctAnswer: 1,
        explanation: "Teaching others reinforces your own understanding and creates accountability. Plus, you're helping break the cycle of financial illiteracy."
      },
      {
        id: 5,
        question: "Which is TRUE about financial success?",
        options: ["It requires a high income", "It requires luck", "It's about behavior more than income", "Only some people can achieve it"],
        correctAnswer: 2,
        explanation: "Financial success is more about behavior (saving, investing, avoiding debt) than income level. Many high earners are broke; many modest earners are wealthy."
      },
      {
        id: 6,
        question: "What should be in place before you start investing?",
        options: ["Nothing", "Emergency fund and high-interest debt paid off", "A financial advisor", "A huge income"],
        correctAnswer: 1,
        explanation: "Before investing, have an emergency fund (3-6 months expenses) and pay off high-interest debt. Don't invest while credit cards drain you."
      },
      {
        id: 7,
        question: "What's the difference between being frugal and being cheap?",
        options: ["They're the same", "Frugal is strategic, cheap sacrifices quality/value", "Cheap is better", "Frugal means never spending"],
        correctAnswer: 1,
        explanation: "Frugal is strategic - spending on what matters and cutting what doesn't. Cheap sacrifices quality and value just to save money."
      },
      {
        id: 8,
        question: "At this point in the course, you should have:",
        options: ["A million dollars", "A budget, emergency fund progress, and clear goals", "Quit your job", "Stopped all spending"],
        correctAnswer: 1,
        explanation: "By now you should have a working budget, be building an emergency fund, understand credit, and have clear short and long-term financial goals."
      },
      {
        id: 9,
        question: "What's the most valuable thing you've gained from this program?",
        options: ["Free coffee", "Knowledge and skills for lifelong financial success", "A certificate only", "Nothing"],
        correctAnswer: 1,
        explanation: "The knowledge and skills you've developed will serve you for life. This is just the beginning of your financial journey."
      },
      {
        id: 10,
        question: "What's your first action after completing this course?",
        options: ["Nothing", "Pick ONE thing from the course and do it today", "Start over from the beginning", "Celebrate by overspending"],
        correctAnswer: 1,
        explanation: "Action beats perfection. Pick one thing - set up automatic savings, check your credit, update your budget - and do it TODAY."
      }
    ]
  };

  // College-specific quiz questions (16 weeks)
  const collegeQuizData: { [key: number]: QuizQuestion[] } = {
    1: [
      {
        id: 1,
        question: "What's the main difference between federal and private student loans?",
        options: ["Federal loans have higher interest rates", "Federal loans offer income-driven repayment and forgiveness options", "Private loans are from the government", "There is no difference"],
        correctAnswer: 1,
        explanation: "Federal loans offer benefits like income-driven repayment plans, deferment options, and potential forgiveness programs that private loans typically don't have."
      },
      {
        id: 2,
        question: "What does 'subsidized' mean for a federal student loan?",
        options: ["You pay interest while in school", "The government pays interest while you're in school", "The interest rate is higher", "The loan has no interest"],
        correctAnswer: 1,
        explanation: "With subsidized loans, the government pays the interest while you're enrolled at least half-time, during grace periods, and during deferment."
      },
      {
        id: 3,
        question: "You borrowed $30,000 at 5% interest. If you make minimum payments over 10 years, roughly how much total will you pay?",
        options: ["$30,000", "$35,000", "$38,000", "$45,000"],
        correctAnswer: 2,
        explanation: "Over 10 years at 5%, you'll pay about $8,000 in interest, bringing your total to roughly $38,000. This is why paying extra when you can saves money!"
      },
      {
        id: 4,
        question: "What's the standard repayment period for federal student loans?",
        options: ["5 years", "10 years", "20 years", "30 years"],
        correctAnswer: 1,
        explanation: "The standard federal student loan repayment plan is 10 years, though income-driven plans can extend to 20-25 years."
      },
      {
        id: 5,
        question: "Which income-driven repayment plan caps payments at 10% of discretionary income?",
        options: ["Standard Plan", "PAYE (Pay As You Earn)", "Extended Plan", "Graduated Plan"],
        correctAnswer: 1,
        explanation: "PAYE caps your monthly payments at 10% of discretionary income and offers forgiveness after 20 years."
      },
      {
        id: 6,
        question: "What happens if you don't pay your student loans?",
        options: ["Nothing, they're forgiven", "Only your credit score drops", "Wages can be garnished and tax refunds seized", "You just pay more interest"],
        correctAnswer: 2,
        explanation: "Defaulting on federal loans can result in wage garnishment, tax refund seizure, damaged credit, and losing eligibility for future aid."
      },
      {
        id: 7,
        question: "What is Public Service Loan Forgiveness (PSLF)?",
        options: ["Automatic forgiveness after 10 years", "Forgiveness after 120 payments while working for qualifying employers", "Only for doctors", "Private loan forgiveness"],
        correctAnswer: 1,
        explanation: "PSLF forgives remaining federal loan balances after 120 qualifying monthly payments while working full-time for qualifying public service employers."
      },
      {
        id: 8,
        question: "You have extra money this month. What's the BEST loan strategy?",
        options: ["Save it all", "Pay extra on the highest-interest loan", "Pay minimum on all loans", "Pay extra on the smallest loan only"],
        correctAnswer: 1,
        explanation: "The avalanche method (paying extra on highest-interest debt) saves you the most money over time."
      },
      {
        id: 9,
        question: "What does loan 'capitalization' mean?",
        options: ["Your loan is paid off", "Unpaid interest is added to your principal", "Your interest rate increases", "You qualify for forgiveness"],
        correctAnswer: 1,
        explanation: "Capitalization adds unpaid interest to your loan principal, which means you start paying interest on a larger amount."
      },
      {
        id: 10,
        question: "What should you do FIRST before accepting any student loan?",
        options: ["Sign immediately", "Max out federal loans before considering private", "Take private loans first", "Skip the financial aid office"],
        correctAnswer: 1,
        explanation: "Always exhaust federal loan options first - they have lower interest rates, flexible repayment options, and forgiveness programs that private loans don't offer."
      }
    ],
    2: [
      {
        id: 1,
        question: "What makes up the LARGEST portion of your credit score?",
        options: ["Credit utilization (30%)", "Payment history (35%)", "Length of credit history (15%)", "Types of credit (10%)"],
        correctAnswer: 1,
        explanation: "Payment history is 35% of your FICO score - paying on time is the single most important factor!"
      },
      {
        id: 2,
        question: "What's the ideal credit utilization ratio?",
        options: ["0%", "Under 30%", "50%", "100%"],
        correctAnswer: 1,
        explanation: "Keep your credit utilization under 30% of your available credit. Under 10% is even better for your score."
      },
      {
        id: 3,
        question: "You're 18 with no credit history. What's the BEST first step?",
        options: ["Open 5 credit cards at once", "Become an authorized user on a parent's card", "Take out a car loan", "Avoid credit entirely"],
        correctAnswer: 1,
        explanation: "Becoming an authorized user on a trusted family member's card is a safe way to start building credit history without the risk of managing your own account."
      },
      {
        id: 4,
        question: "What is a secured credit card?",
        options: ["A card with extra security features", "A card backed by a cash deposit you provide", "A card only for emergencies", "A card with high limits"],
        correctAnswer: 1,
        explanation: "Secured cards require a cash deposit that becomes your credit limit. They're great for building credit when you can't qualify for regular cards."
      },
      {
        id: 5,
        question: "How often can you check your own credit score without hurting it?",
        options: ["Never", "Once a year", "As often as you want", "Only when applying for loans"],
        correctAnswer: 2,
        explanation: "Checking your own credit is a 'soft inquiry' and doesn't hurt your score. Check often to catch errors or fraud!"
      },
      {
        id: 6,
        question: "Your credit card bill is $500 but you can only pay $300. What should you do?",
        options: ["Pay nothing and wait", "Pay the $300 and the rest next month", "Pay minimum due and more when you can", "Close the account"],
        correctAnswer: 2,
        explanation: "Always pay at least the minimum to protect your payment history. Paying more reduces interest charges on the remaining balance."
      },
      {
        id: 7,
        question: "How long do late payments stay on your credit report?",
        options: ["6 months", "2 years", "7 years", "Forever"],
        correctAnswer: 2,
        explanation: "Late payments stay on your credit report for 7 years, though their impact decreases over time."
      },
      {
        id: 8,
        question: "What's a hard inquiry on your credit?",
        options: ["Checking your own score", "When a lender checks your credit for an application", "Paying off a loan", "Adding an authorized user"],
        correctAnswer: 1,
        explanation: "Hard inquiries happen when you apply for credit. They can temporarily lower your score and stay on your report for 2 years."
      },
      {
        id: 9,
        question: "Which action will HURT your credit score the most?",
        options: ["Having a mix of credit types", "Keeping old accounts open", "Missing a payment by 30+ days", "Paying your balance in full"],
        correctAnswer: 2,
        explanation: "Missing a payment by 30+ days gets reported to credit bureaus and significantly damages your payment history, the biggest factor in your score."
      },
      {
        id: 10,
        question: "You got your first credit card. What's the smartest way to use it?",
        options: ["Max it out and pay minimum", "Use it for everything to build points fast", "Small purchases, pay in full each month", "Never use it"],
        correctAnswer: 2,
        explanation: "Use your card for small, regular purchases and pay the full balance each month. This builds payment history without paying interest."
      }
    ],
    3: [
      {
        id: 1,
        question: "You make $1,500/month from your campus job. How much should you budget for rent using the 30% rule?",
        options: ["$300", "$450", "$600", "$750"],
        correctAnswer: 1,
        explanation: "The 30% rule suggests spending no more than 30% of income on housing. $1,500 × 0.30 = $450 max for rent."
      },
      {
        id: 2,
        question: "What's the FIRST thing to do when creating a college budget?",
        options: ["List all your wants", "Track your income sources", "Open more credit cards", "Cut all entertainment spending"],
        correctAnswer: 1,
        explanation: "Start by knowing exactly how much money comes in - from jobs, financial aid refunds, family support, etc. You can't budget what you don't track."
      },
      {
        id: 3,
        question: "Which is typically the BIGGEST expense for college students?",
        options: ["Food", "Entertainment", "Housing", "Textbooks"],
        correctAnswer: 2,
        explanation: "Housing (dorm or rent) is usually the largest expense for college students, often 30-50% of the budget."
      },
      {
        id: 4,
        question: "You got a $3,000 financial aid refund. What's the smartest approach?",
        options: ["Spend it celebrating", "Budget it for the semester's expenses", "Put it all in savings", "Loan it to friends"],
        correctAnswer: 1,
        explanation: "Divide your refund by the number of months in the semester to create a monthly budget. This prevents running out mid-semester."
      },
      {
        id: 5,
        question: "What's the biggest meal-related budget mistake college students make?",
        options: ["Using the meal plan", "Eating out frequently instead of cooking", "Buying groceries", "Eating at the dining hall"],
        correctAnswer: 1,
        explanation: "Eating out regularly can cost $300-500+/month vs. $150-200 for groceries. Cooking saves serious money."
      },
      {
        id: 6,
        question: "Your fixed expenses are $1,000/month and you make $1,400. How much is truly 'flexible' spending?",
        options: ["$1,400", "$1,000", "$400", "$200"],
        correctAnswer: 2,
        explanation: "$1,400 income - $1,000 fixed expenses = $400 for flexible spending, savings, and fun money."
      },
      {
        id: 7,
        question: "What's the 'envelope method' of budgeting?",
        options: ["Mailing cash to yourself", "Putting budgeted cash in labeled envelopes for each category", "Only using credit cards", "Saving receipts in envelopes"],
        correctAnswer: 1,
        explanation: "The envelope method uses physical cash in labeled envelopes for each spending category. When an envelope is empty, you're done spending in that category."
      },
      {
        id: 8,
        question: "Which budgeting app feature is MOST important for college students?",
        options: ["Investment tracking", "Expense categorization and tracking", "Cryptocurrency support", "Business accounting"],
        correctAnswer: 1,
        explanation: "Expense tracking and categorization helps you see exactly where your money goes - essential for identifying spending patterns and opportunities to save."
      },
      {
        id: 9,
        question: "Your roommate wants to split Netflix, Hulu, and Spotify. What's the BEST approach?",
        options: ["Pay for all three yourself", "Share accounts and split costs", "Don't subscribe to anything", "Each person pays for all their own"],
        correctAnswer: 1,
        explanation: "Sharing streaming services with roommates is a smart way to get entertainment for a fraction of the cost while staying legal with family/household plans."
      },
      {
        id: 10,
        question: "What's a 'sinking fund' and why use one in college?",
        options: ["Money you lose", "Saving monthly for predictable irregular expenses", "An emergency fund", "A bad investment"],
        correctAnswer: 1,
        explanation: "Sinking funds are for predictable but irregular expenses (textbooks, car insurance, holidays). Save monthly so you're ready when bills come due."
      }
    ],
    4: [
      {
        id: 1,
        question: "What's the main advantage of a checking account over cash?",
        options: ["Higher interest rates", "Safer storage, tracking, and convenient payments", "No fees ever", "Automatic budgeting"],
        correctAnswer: 1,
        explanation: "Checking accounts offer security (FDIC insurance), transaction tracking, and convenient payment methods like debit cards and transfers."
      },
      {
        id: 2,
        question: "How much is FDIC insurance coverage per account?",
        options: ["$100,000", "$250,000", "$500,000", "Unlimited"],
        correctAnswer: 1,
        explanation: "FDIC insures deposits up to $250,000 per depositor, per bank, per ownership category. Your money is protected if the bank fails."
      },
      {
        id: 3,
        question: "You're choosing a bank as a college student. What matters MOST?",
        options: ["Fancy mobile app", "No minimum balance requirements and low fees", "Most ATMs worldwide", "Best interest rates on checking"],
        correctAnswer: 1,
        explanation: "With limited income, avoiding monthly fees and minimum balance requirements is crucial. Many student accounts offer fee-free banking."
      },
      {
        id: 4,
        question: "What's the difference between a debit card and credit card?",
        options: ["Debit cards have higher limits", "Debit pulls directly from your account; credit borrows money", "Credit cards are safer", "There is no difference"],
        correctAnswer: 1,
        explanation: "Debit cards withdraw directly from your checking account immediately. Credit cards are a loan you must repay, usually with interest if not paid in full."
      },
      {
        id: 5,
        question: "You're about to overdraft your account. What's the BEST option?",
        options: ["Let it overdraft and pay the $35 fee", "Transfer money from savings to cover it", "Ignore it", "Close the account"],
        correctAnswer: 1,
        explanation: "Transferring from savings (often $5-10 fee or free) is much cheaper than overdraft fees ($30-35 per transaction)."
      },
      {
        id: 6,
        question: "What should you do FIRST when setting up a new bank account?",
        options: ["Order checks", "Set up direct deposit", "Get a fancy debit card design", "Apply for overdraft protection"],
        correctAnswer: 1,
        explanation: "Direct deposit ensures your income goes straight to your account safely. Many banks waive fees if you have direct deposit set up."
      },
      {
        id: 7,
        question: "What's a high-yield savings account?",
        options: ["A risky investment account", "A savings account with better interest rates (often online banks)", "A checking account with high limits", "A certificate of deposit"],
        correctAnswer: 1,
        explanation: "High-yield savings accounts (often from online banks) offer significantly higher interest rates than traditional savings, helping your money grow faster."
      },
      {
        id: 8,
        question: "How often should you check your bank account?",
        options: ["Never", "Once a month", "Weekly or more often", "Only when you get a statement"],
        correctAnswer: 2,
        explanation: "Check your accounts weekly or more to catch fraudulent charges early, track spending, and ensure bills are paid correctly."
      },
      {
        id: 9,
        question: "What's Zelle, Venmo, or Cash App useful for?",
        options: ["Building credit", "Quickly sending money to friends and splitting bills", "Earning high interest", "Taking out loans"],
        correctAnswer: 1,
        explanation: "Payment apps make splitting rent, bills, and group expenses with roommates fast and easy without handling cash."
      },
      {
        id: 10,
        question: "Your card was stolen. What's your FIRST step?",
        options: ["Wait to see if charges appear", "Immediately freeze or cancel the card", "File a police report first", "Post about it on social media"],
        correctAnswer: 1,
        explanation: "Immediately freeze or cancel your card through your banking app or by calling the bank. Speed limits your liability for fraudulent charges."
      }
    ],
    5: [
      {
        id: 1,
        question: "What form do you fill out to apply for federal financial aid?",
        options: ["W-2", "FAFSA", "1040", "W-4"],
        correctAnswer: 1,
        explanation: "The FAFSA (Free Application for Federal Student Aid) is required for federal grants, loans, and work-study programs."
      },
      {
        id: 2,
        question: "When should you file the FAFSA for the best chance at aid?",
        options: ["Right before classes start", "As soon as it opens (October 1st)", "After your tax return is done", "During winter break"],
        correctAnswer: 1,
        explanation: "File FAFSA as early as possible when it opens October 1st. Many types of aid are first-come, first-served!"
      },
      {
        id: 3,
        question: "What is the American Opportunity Tax Credit?",
        options: ["A scholarship", "A tax credit up to $2,500/year for college expenses", "A federal grant", "A student loan"],
        correctAnswer: 1,
        explanation: "AOTC provides up to $2,500/year in tax credits for qualified education expenses during the first 4 years of higher education."
      },
      {
        id: 4,
        question: "You earned $5,000 from a summer job. Do you need to file taxes?",
        options: ["No, students don't pay taxes", "Yes, if it exceeded the standard deduction", "Only if you're over 21", "Only if you had taxes withheld"],
        correctAnswer: 1,
        explanation: "If your income exceeds the standard deduction (around $13,850 for 2023), you must file. Even if below, filing may get you a refund of withheld taxes."
      },
      {
        id: 5,
        question: "What's the difference between a tax credit and a tax deduction?",
        options: ["They're the same thing", "Credits reduce your tax dollar-for-dollar; deductions reduce taxable income", "Deductions are better", "Credits only apply to businesses"],
        correctAnswer: 1,
        explanation: "Tax credits directly reduce your tax bill ($1,000 credit = $1,000 less tax). Deductions reduce taxable income, so the savings depends on your tax bracket."
      },
      {
        id: 6,
        question: "What's a W-4 form used for?",
        options: ["Filing your taxes", "Telling your employer how much tax to withhold", "Applying for financial aid", "Opening a bank account"],
        correctAnswer: 1,
        explanation: "The W-4 tells your employer how much federal income tax to withhold from your paycheck based on your situation and preferences."
      },
      {
        id: 7,
        question: "What does SAI (Student Aid Index) determine?",
        options: ["Your GPA requirement for aid", "Your expected family contribution toward college", "Your loan interest rate", "Which scholarships you qualify for"],
        correctAnswer: 1,
        explanation: "SAI (formerly EFC) is calculated from your FAFSA and determines how much financial aid you're eligible to receive based on family financial situation."
      },
      {
        id: 8,
        question: "You received a Pell Grant. What do you have to pay back?",
        options: ["Everything with interest", "Half of it", "Nothing - grants are free money", "Only if you drop out"],
        correctAnswer: 2,
        explanation: "Pell Grants are free money for students with financial need. Unlike loans, you don't have to repay grants (unless you withdraw early)."
      },
      {
        id: 9,
        question: "What's the Lifetime Learning Credit?",
        options: ["A credit card for students", "A tax credit for any level of higher education, no limit on years", "A federal grant", "A type of student loan"],
        correctAnswer: 1,
        explanation: "The Lifetime Learning Credit provides up to $2,000/year for qualified education expenses and has no limit on years you can claim it."
      },
      {
        id: 10,
        question: "Which form shows your tuition payments for tax purposes?",
        options: ["W-2", "1098-T", "1099", "W-4"],
        correctAnswer: 1,
        explanation: "Form 1098-T is sent by your school and shows tuition paid, which you need for education tax credits and deductions."
      }
    ],
    6: [
      {
        id: 1,
        question: "You're a full-time student. How many hours per week is realistic to work?",
        options: ["0 - students shouldn't work", "10-15 hours", "40+ hours", "As many as possible"],
        correctAnswer: 1,
        explanation: "Studies show 10-15 hours/week is optimal - enough to earn money and gain experience without hurting grades. Beyond 20 hours can impact academics."
      },
      {
        id: 2,
        question: "What's the main benefit of a paid internship besides money?",
        options: ["Free food", "Building skills and professional network", "Less homework", "Better parking"],
        correctAnswer: 1,
        explanation: "Internships build real skills, professional connections, and resume experience that help you land better jobs after graduation."
      },
      {
        id: 3,
        question: "Which side hustle has the LOWEST startup cost?",
        options: ["Starting a food truck", "Freelance tutoring or writing", "Flipping cars", "Opening a store"],
        correctAnswer: 1,
        explanation: "Freelance services like tutoring, writing, or graphic design require minimal startup costs - just your skills and time."
      },
      {
        id: 4,
        question: "What is Federal Work-Study?",
        options: ["Studying to get a federal job", "A need-based program providing part-time jobs for students", "Working from home for the government", "A type of scholarship"],
        correctAnswer: 1,
        explanation: "Federal Work-Study provides part-time employment for students with financial need, often on-campus or in community service."
      },
      {
        id: 5,
        question: "You're offered an unpaid internship at a dream company. What should you consider?",
        options: ["Take it immediately", "Whether you can afford it and if the experience truly adds value", "Unpaid work is always bad", "Only GPA matters, skip it"],
        correctAnswer: 1,
        explanation: "Weigh the true costs (lost wages, expenses) against the value of experience and connections. Sometimes it's worth it; often paid internships exist too."
      },
      {
        id: 6,
        question: "What's the gig economy?",
        options: ["Only music industry jobs", "Flexible, short-term work like Uber, Fiverr, DoorDash", "Traditional 9-5 jobs", "Government employment"],
        correctAnswer: 1,
        explanation: "The gig economy includes flexible, on-demand work through apps and platforms - great for student schedules but lacks benefits."
      },
      {
        id: 7,
        question: "You freelance on the side and made $2,000. What must you do at tax time?",
        options: ["Nothing - it's under $10,000", "Report it as self-employment income", "Only report if you get a 1099", "Claim it as a gift"],
        correctAnswer: 1,
        explanation: "All income over $400 from self-employment must be reported, and you may owe self-employment tax (Social Security + Medicare)."
      },
      {
        id: 8,
        question: "What's the biggest advantage of on-campus jobs?",
        options: ["Higher pay", "Work schedule built around class schedule", "No taxes", "No interview required"],
        correctAnswer: 1,
        explanation: "On-campus employers understand student schedules and typically work around classes and finals - plus no commute!"
      },
      {
        id: 9,
        question: "You want to start freelancing. What's your FIRST step?",
        options: ["Quit your day job", "Identify a skill you have that others need", "Build a website", "Buy expensive equipment"],
        correctAnswer: 1,
        explanation: "Start with a marketable skill you already have. Then test the market before investing in websites or equipment."
      },
      {
        id: 10,
        question: "How should you negotiate pay for an internship or entry-level job?",
        options: ["Never negotiate, just be grateful", "Research market rates and practice your pitch", "Demand double the offer", "Threaten to walk away immediately"],
        correctAnswer: 1,
        explanation: "Research comparable salaries, know your value, and practice negotiating professionally. Most employers expect some negotiation."
      }
    ],
    7: [
      {
        id: 1,
        question: "You have $10,000 in credit card debt at 22% APR and $10,000 in student loans at 5%. Which do you pay off first?",
        options: ["Student loans - they're bigger", "Credit cards - higher interest saves more money", "Pay equal amounts to both", "Neither - invest instead"],
        correctAnswer: 1,
        explanation: "The avalanche method: Pay minimums on all, then throw extra money at the highest interest rate (22% credit card). This saves the most money over time."
      },
      {
        id: 2,
        question: "What's the 'snowball method' of debt payoff?",
        options: ["Paying off smallest debts first for psychological wins", "Paying off highest interest first", "Making minimum payments only", "Consolidating all debt"],
        correctAnswer: 0,
        explanation: "The snowball method pays off the smallest balance first regardless of interest rate. The quick wins keep you motivated, even if it costs slightly more than avalanche."
      },
      {
        id: 3,
        question: "What is debt consolidation?",
        options: ["Ignoring your debt", "Combining multiple debts into one payment, ideally at lower interest", "Declaring bankruptcy", "Taking on more debt"],
        correctAnswer: 1,
        explanation: "Consolidation combines multiple debts into one loan, ideally with a lower interest rate. It simplifies payments but doesn't reduce what you owe."
      },
      {
        id: 4,
        question: "You're struggling to pay bills. Which should you pay FIRST?",
        options: ["Credit card minimums", "Netflix subscription", "Rent/housing", "New clothes"],
        correctAnswer: 2,
        explanation: "Essentials first: shelter, utilities, food, transportation to work. Then minimum debt payments. Everything else can wait."
      },
      {
        id: 5,
        question: "What's a 0% APR balance transfer offer useful for?",
        options: ["Getting free money", "Paying down credit card debt faster without interest", "Building credit history", "Getting a higher credit limit"],
        correctAnswer: 1,
        explanation: "Balance transfer offers let you move debt to a 0% card temporarily. Use that time to aggressively pay down the balance before regular APR kicks in."
      },
      {
        id: 6,
        question: "What does 'debt-to-income ratio' measure?",
        options: ["How much debt you can handle", "Monthly debt payments as a percentage of monthly income", "Your credit score", "How much you save"],
        correctAnswer: 1,
        explanation: "DTI = (total monthly debt payments ÷ gross monthly income) × 100. Lenders use this to determine if you can afford new loans."
      },
      {
        id: 7,
        question: "You receive a windfall of $5,000. You have $3,000 in credit card debt and no emergency fund. What's wisest?",
        options: ["Pay off all debt, save nothing", "Save $1,000 emergency fund, pay off the $3,000 debt, save the rest", "Invest it all", "Spend it - treat yourself"],
        correctAnswer: 1,
        explanation: "Build a small emergency fund first ($1,000), then attack high-interest debt. Without an emergency fund, you'll just go back into debt when something breaks."
      },
      {
        id: 8,
        question: "What's predatory lending?",
        options: ["All lending is predatory", "Unfair loan practices targeting vulnerable people with high fees/rates", "Loans from banks", "Student loans"],
        correctAnswer: 1,
        explanation: "Predatory lenders target desperate borrowers with extremely high interest rates, hidden fees, and unfair terms. Avoid payday loans and title loans."
      },
      {
        id: 9,
        question: "When does it make sense to use a personal loan?",
        options: ["Never", "To consolidate high-interest debt at a lower rate", "For vacation", "To pay minimum credit card payments"],
        correctAnswer: 1,
        explanation: "Personal loans can make sense when the interest rate is lower than your current debt (like credit cards) and you have a plan to pay it off."
      },
      {
        id: 10,
        question: "How long does bankruptcy stay on your credit report?",
        options: ["1 year", "3 years", "7-10 years", "Forever"],
        correctAnswer: 2,
        explanation: "Bankruptcy stays on your credit report for 7-10 years. It's a last resort that makes getting credit, housing, and sometimes jobs much harder."
      }
    ],
    8: [
      {
        id: 1,
        question: "What is compound interest?",
        options: ["Interest on your principal only", "Earning interest on your interest over time", "A type of bank fee", "Tax on investments"],
        correctAnswer: 1,
        explanation: "Compound interest means you earn interest on your original investment AND on previously earned interest. It's how money grows exponentially over time."
      },
      {
        id: 2,
        question: "You invest $1,000 at 7% annually. Roughly how much will it be worth in 10 years (compound interest)?",
        options: ["$1,070", "$1,700", "$1,967", "$2,500"],
        correctAnswer: 2,
        explanation: "At 7% compounding annually, $1,000 becomes about $1,967 in 10 years. The 'rule of 72' says your money doubles every ~10 years at 7%."
      },
      {
        id: 3,
        question: "What's an index fund?",
        options: ["A fund run by one manager picking stocks", "A fund that tracks a market index like the S&P 500", "A guaranteed return investment", "A savings account"],
        correctAnswer: 1,
        explanation: "Index funds track a market index (like S&P 500) and hold the same stocks. They offer diversification with low fees."
      },
      {
        id: 4,
        question: "Why is diversification important in investing?",
        options: ["It guarantees profits", "It spreads risk so one bad investment doesn't ruin you", "It's required by law", "It increases fees"],
        correctAnswer: 1,
        explanation: "Don't put all your eggs in one basket. Diversification spreads your money across different investments so one failure doesn't wipe you out."
      },
      {
        id: 5,
        question: "What's the difference between stocks and bonds?",
        options: ["They're the same thing", "Stocks are ownership; bonds are loans to companies/governments", "Bonds are riskier", "Stocks pay guaranteed interest"],
        correctAnswer: 1,
        explanation: "When you buy stock, you own a piece of the company. When you buy bonds, you're lending money and earning interest. Stocks are riskier but historically have higher returns."
      },
      {
        id: 6,
        question: "You're 20 years old. What investment mix makes the most sense for retirement?",
        options: ["100% bonds for safety", "Mostly stocks because you have time to recover from losses", "All cash", "50/50 stocks and bonds"],
        correctAnswer: 1,
        explanation: "Young investors can afford more risk because they have decades to recover from market downturns. A stock-heavy portfolio typically grows more over time."
      },
      {
        id: 7,
        question: "What is a brokerage account?",
        options: ["A savings account", "An account for buying and selling investments", "A type of loan", "A checking account at a broker"],
        correctAnswer: 1,
        explanation: "A brokerage account lets you buy and sell investments like stocks, bonds, ETFs, and mutual funds. Many are now free with no minimums."
      },
      {
        id: 8,
        question: "What does 'buying the dip' mean?",
        options: ["Buying when prices are at all-time highs", "Buying investments when prices drop temporarily", "Buying on credit", "Selling when prices drop"],
        correctAnswer: 1,
        explanation: "Buying the dip means purchasing investments when prices temporarily fall, ideally getting more shares for less money. But timing the market is tricky."
      },
      {
        id: 9,
        question: "What's dollar-cost averaging?",
        options: ["Investing a large sum all at once", "Investing fixed amounts regularly regardless of market conditions", "Only buying when prices are low", "Converting to different currencies"],
        correctAnswer: 1,
        explanation: "Dollar-cost averaging means investing the same amount regularly (like $100/month). You buy more shares when prices are low, fewer when high, reducing timing risk."
      },
      {
        id: 10,
        question: "What is an ETF?",
        options: ["A type of bond", "Exchange-Traded Fund - trades like a stock but holds many investments", "A government savings account", "A high-interest savings account"],
        correctAnswer: 1,
        explanation: "ETFs are baskets of investments that trade on stock exchanges like individual stocks. They offer diversification with low fees and flexibility."
      }
    ],
    9: [
      {
        id: 1,
        question: "At what age can you start contributing to a 401(k)?",
        options: ["Must be 30+", "Any age if your employer offers one", "Only after paying off student loans", "Must be 25+"],
        correctAnswer: 1,
        explanation: "You can contribute to a 401(k) as soon as you're eligible at your job - often immediately or after a short waiting period. Start early!"
      },
      {
        id: 2,
        question: "Your employer matches 50% of 401(k) contributions up to 6% of salary. You make $40,000. How much FREE money can you get yearly?",
        options: ["$400", "$1,200", "$2,400", "$6,000"],
        correctAnswer: 1,
        explanation: "6% of $40,000 = $2,400. Employer matches 50% of that = $1,200/year in FREE money! Always contribute at least enough to get the full match."
      },
      {
        id: 3,
        question: "What's the key difference between a Traditional and Roth IRA?",
        options: ["Roth has no contribution limits", "Traditional = tax-deferred; Roth = tax-free in retirement", "Traditional is only for employees", "There is no difference"],
        correctAnswer: 1,
        explanation: "Traditional IRA: contribute pre-tax, pay taxes on withdrawals. Roth IRA: contribute after-tax, withdraw tax-free in retirement. When young, Roth is often better."
      },
      {
        id: 4,
        question: "What's the 2024 annual contribution limit for IRAs?",
        options: ["$3,000", "$6,500", "$7,000", "$23,000"],
        correctAnswer: 2,
        explanation: "The 2024 IRA contribution limit is $7,000 (or $8,000 if you're 50+). Max it out if you can!"
      },
      {
        id: 5,
        question: "Why should you start saving for retirement in your 20s?",
        options: ["Retirement is soon", "Compound interest needs time - starting early makes a huge difference", "Tax laws require it", "Your employer requires it"],
        correctAnswer: 1,
        explanation: "Time is your superpower. Someone who invests $200/month from age 22-32 and stops can have MORE than someone who starts at 32 and invests until 62!"
      },
      {
        id: 6,
        question: "What happens if you withdraw from a 401(k) before age 59½?",
        options: ["Nothing", "10% early withdrawal penalty plus income taxes", "You lose the account", "You only pay regular income tax"],
        correctAnswer: 1,
        explanation: "Early withdrawal triggers a 10% penalty PLUS income taxes. Only access retirement funds early in true emergencies."
      },
      {
        id: 7,
        question: "What does 'vesting' mean for 401(k)?",
        options: ["Your contribution amounts", "How much of employer contributions you can keep if you leave", "A type of investment", "The account opening process"],
        correctAnswer: 1,
        explanation: "Vesting determines how much of your employer's contributions you own. Your own contributions are always 100% yours immediately."
      },
      {
        id: 8,
        question: "You switch jobs. What should you do with your old 401(k)?",
        options: ["Cash it out", "Roll it into your new employer's plan or an IRA", "Leave it forever", "It disappears automatically"],
        correctAnswer: 1,
        explanation: "Roll it into a new 401(k) or IRA to avoid taxes and penalties. Never cash out - you'll lose a huge chunk to taxes and penalties."
      },
      {
        id: 9,
        question: "What is a target-date fund?",
        options: ["A fund with a specific end date when you get paid", "An investment that automatically adjusts risk as you approach retirement", "A guaranteed return fund", "A short-term savings account"],
        correctAnswer: 1,
        explanation: "Target-date funds (like 'Target 2060') automatically shift from aggressive to conservative investments as you approach retirement. Set it and forget it!"
      },
      {
        id: 10,
        question: "You're 22 and can invest $100/month. What should you prioritize?",
        options: ["Just savings account", "401(k) up to employer match, then Roth IRA", "Individual stocks only", "Wait until you're older"],
        correctAnswer: 1,
        explanation: "First, get the full 401(k) employer match (free money!). Then max out a Roth IRA for tax-free growth. Time in the market beats timing the market."
      }
    ],
    10: [
      {
        id: 1,
        question: "You receive a job offer for $55,000. Research shows similar roles pay $58,000-$65,000. What should you do?",
        options: ["Accept immediately - you need the job", "Counter at $60,000-$62,000 with your research", "Demand $80,000", "Decline and wait"],
        correctAnswer: 1,
        explanation: "Always negotiate! Counter with market data. Most employers expect it and have room in the budget. A few thousand more compounds over your career."
      },
      {
        id: 2,
        question: "Beyond salary, what benefits should you evaluate in a job offer?",
        options: ["Only salary matters", "Health insurance, 401(k) match, PTO, and other perks", "Just the job title", "Only location"],
        correctAnswer: 1,
        explanation: "Total compensation includes health insurance, retirement benefits, PTO, bonuses, stock options, and perks. A lower salary with great benefits might be worth more!"
      },
      {
        id: 3,
        question: "What's a common mistake when negotiating salary?",
        options: ["Asking for too much", "Giving your desired salary first instead of letting them make the first offer", "Researching market rates", "Negotiating at all"],
        correctAnswer: 1,
        explanation: "Let the employer make the first offer when possible. If you name a number first, you might aim too low. Always research before negotiating."
      },
      {
        id: 4,
        question: "What is an HSA (Health Savings Account)?",
        options: ["A retirement account", "A tax-advantaged account for medical expenses with a high-deductible health plan", "A type of health insurance", "A checking account"],
        correctAnswer: 1,
        explanation: "HSAs offer triple tax advantages: tax-deductible contributions, tax-free growth, and tax-free withdrawals for medical expenses. A hidden retirement gem!"
      },
      {
        id: 5,
        question: "Your employer offers a $5,000 deductible health plan with an HSA or a $500 deductible plan. As a healthy 23-year-old, which might be better?",
        options: ["Always the low deductible", "The high-deductible HSA plan if you're healthy", "Neither - go uninsured", "They're always equal"],
        correctAnswer: 1,
        explanation: "If you're healthy and rarely see doctors, a high-deductible plan + HSA often costs less overall. The HSA money is yours forever and can be invested."
      },
      {
        id: 6,
        question: "What's the best time to ask for a raise?",
        options: ["When you're about to quit", "After a major accomplishment or during annual reviews", "Your first week", "When you're upset"],
        correctAnswer: 1,
        explanation: "Ask after you've demonstrated value - completed a big project, exceeded goals, or during scheduled reviews. Document your achievements."
      },
      {
        id: 7,
        question: "What is equity compensation (stock options)?",
        options: ["A loan from your employer", "Ownership stake or options to buy company stock as part of compensation", "Your 401(k)", "A bonus"],
        correctAnswer: 1,
        explanation: "Equity compensation gives you ownership in the company through stock grants or options to purchase stock. Can be very valuable if the company grows!"
      },
      {
        id: 8,
        question: "What does 'vesting schedule' mean for stock options?",
        options: ["When you can sell your clothes", "The timeline for earning your equity, usually 4 years with a 1-year cliff", "Tax payment schedule", "When the company pays dividends"],
        correctAnswer: 1,
        explanation: "Vesting schedules determine when you actually own your equity. Common: 4-year vesting with a 1-year 'cliff' (you must stay 1 year to get anything)."
      },
      {
        id: 9,
        question: "What should you prioritize when comparing job offers?",
        options: ["Only the base salary", "Total compensation, growth potential, work-life balance, and career fit", "The coolest office", "Shortest commute only"],
        correctAnswer: 1,
        explanation: "Consider the whole picture: salary, benefits, growth opportunities, company culture, work-life balance, and alignment with your career goals."
      },
      {
        id: 10,
        question: "Why is networking important for career growth?",
        options: ["It's not - only skills matter", "Many jobs are filled through connections before being posted", "It only helps salespeople", "To get free stuff"],
        correctAnswer: 1,
        explanation: "Up to 80% of jobs are filled through networking. Building genuine professional relationships opens doors throughout your career."
      }
    ],
    11: [
      {
        id: 1,
        question: "You earn $3,500/month. Using the 30% rule, what's your maximum rent?",
        options: ["$350", "$700", "$1,050", "$1,500"],
        correctAnswer: 2,
        explanation: "$3,500 × 0.30 = $1,050. Spending more than 30% on housing can strain your entire budget."
      },
      {
        id: 2,
        question: "What's typically included in 'utilities' for an apartment?",
        options: ["Only electricity", "Electricity, water, gas, trash, sometimes internet", "Just wifi", "Furniture"],
        correctAnswer: 1,
        explanation: "Utilities usually include electricity, water, gas, and trash. Internet/cable may be separate. Always clarify what's included in rent."
      },
      {
        id: 3,
        question: "What is a security deposit?",
        options: ["Monthly rent payment", "Refundable money held by landlord for potential damages", "A down payment you never get back", "Insurance premium"],
        correctAnswer: 1,
        explanation: "Security deposits (usually 1-2 months rent) are refundable if you leave the unit in good condition. Document everything when moving in!"
      },
      {
        id: 4,
        question: "Before signing a lease, what should you check FIRST?",
        options: ["The paint color", "Move-in costs, lease terms, landlord reviews, and neighborhood safety", "If pets are cute", "Nothing - just sign"],
        correctAnswer: 1,
        explanation: "Calculate total move-in costs, read lease terms carefully, research the landlord, check crime stats, and visit at different times of day."
      },
      {
        id: 5,
        question: "What is renter's insurance?",
        options: ["Insurance the landlord must buy", "Coverage for your belongings, liability, and additional living expenses", "Expensive and unnecessary", "The same as health insurance"],
        correctAnswer: 1,
        explanation: "Renter's insurance covers your stuff if stolen/damaged, liability if someone's hurt in your unit, and hotel costs if you can't stay there. Usually $15-30/month!"
      },
      {
        id: 6,
        question: "Your landlord wants to enter your apartment. What are your rights?",
        options: ["They can enter anytime", "They must typically give 24-48 hours notice except emergencies", "They can never enter", "You decide all entry times"],
        correctAnswer: 1,
        explanation: "Landlords must usually give advance notice (24-48 hours in most states) except for emergencies. Know your local tenant rights!"
      },
      {
        id: 7,
        question: "What's the advantage of having a roommate?",
        options: ["No advantages", "Split rent, utilities, and shared household expenses", "They do all the cleaning", "You never have to communicate"],
        correctAnswer: 1,
        explanation: "Roommates cut housing costs significantly. But choose wisely and discuss expectations about cleaning, guests, bills, and quiet hours upfront."
      },
      {
        id: 8,
        question: "You find mold in your apartment. Whose responsibility is it?",
        options: ["Always yours", "Typically the landlord's - it's a health hazard", "Nobody's", "Previous tenant's"],
        correctAnswer: 1,
        explanation: "Landlords are generally responsible for maintaining habitable conditions, including addressing mold. Document it, report it in writing, and know your rights."
      },
      {
        id: 9,
        question: "What happens if you break a lease early?",
        options: ["Nothing", "You may owe penalties or rent until the unit is re-rented", "You go to jail", "The landlord must pay you"],
        correctAnswer: 1,
        explanation: "Breaking a lease typically means penalties, losing your deposit, or paying rent until a new tenant is found. Read your lease's early termination clause."
      },
      {
        id: 10,
        question: "When apartment hunting, what hidden costs should you budget for?",
        options: ["Just first month's rent", "First/last month, security deposit, application fees, moving costs, setup fees", "Only security deposit", "Nothing else"],
        correctAnswer: 1,
        explanation: "Budget for application fees, first + last month rent, security deposit, moving costs, utility setup fees, and immediate needs like curtains or cleaning supplies."
      }
    ],
    12: [
      {
        id: 1,
        question: "What are the main types of insurance young adults need?",
        options: ["Only car insurance", "Health, renter's, auto (if you drive), and life (if you have dependents)", "All types from day one", "None until age 30"],
        correctAnswer: 1,
        explanation: "Start with health and auto insurance (required). Add renter's insurance (cheap protection). Life insurance matters if others depend on your income."
      },
      {
        id: 2,
        question: "What's a deductible?",
        options: ["Your monthly payment", "What you pay before insurance kicks in", "Tax deduction", "The insurance company's fee"],
        correctAnswer: 1,
        explanation: "The deductible is what you pay out-of-pocket before insurance covers costs. Higher deductible = lower premium, but more risk if something happens."
      },
      {
        id: 3,
        question: "You're 24 and can stay on your parents' health insurance. Until what age?",
        options: ["21", "23", "26", "30"],
        correctAnswer: 2,
        explanation: "Under the ACA, you can stay on a parent's health plan until age 26, regardless of student status, marriage, or whether you live with them."
      },
      {
        id: 4,
        question: "What does 'premium' mean in insurance?",
        options: ["The deductible", "The regular payment you make to maintain coverage", "What insurance pays", "A fancy plan"],
        correctAnswer: 1,
        explanation: "The premium is your regular payment (monthly or annually) to keep your insurance active, whether or not you file any claims."
      },
      {
        id: 5,
        question: "You cause a car accident. What type of auto insurance pays for the other driver's car?",
        options: ["Collision", "Comprehensive", "Liability", "Personal injury protection"],
        correctAnswer: 2,
        explanation: "Liability insurance covers damage you cause to others (their car, their injuries). It's required in most states."
      },
      {
        id: 6,
        question: "What's the difference between HMO and PPO health plans?",
        options: ["HMO is always better", "HMO requires referrals and has a network; PPO offers more flexibility at higher cost", "They're identical", "PPO requires referrals"],
        correctAnswer: 1,
        explanation: "HMOs have lower costs but require staying in-network and getting referrals. PPOs cost more but let you see any doctor without referrals."
      },
      {
        id: 7,
        question: "What is an 'out-of-pocket maximum'?",
        options: ["Your premium", "The most you'll pay in a year before insurance covers 100%", "The deductible", "The maximum coverage amount"],
        correctAnswer: 1,
        explanation: "The out-of-pocket maximum is your safety net - once you hit it, insurance covers 100% of covered expenses for the rest of the year."
      },
      {
        id: 8,
        question: "When might a young adult need life insurance?",
        options: ["Never - they're too young", "If someone depends on their income (spouse, kids, cosigned debts)", "Only after age 40", "Everyone needs it immediately"],
        correctAnswer: 1,
        explanation: "Life insurance matters when someone depends on your income. If you're single with no dependents or cosigned debt, you may not need it yet."
      },
      {
        id: 9,
        question: "What does comprehensive auto insurance cover?",
        options: ["Only collisions", "Non-collision damage: theft, weather, vandalism, hitting animals", "Liability to others", "Medical expenses only"],
        correctAnswer: 1,
        explanation: "Comprehensive covers non-collision events: theft, hail, flood, fire, vandalism, and hitting an animal. 'Comp and collision' together cover most vehicle damage."
      },
      {
        id: 10,
        question: "How can you lower your auto insurance premiums?",
        options: ["Drive a sports car", "Raise your deductible, maintain good credit, take safe driver discounts, bundle policies", "Never get quotes", "Buy the cheapest car"],
        correctAnswer: 1,
        explanation: "Higher deductibles, good driving record, bundling (home + auto), good student discounts, and shopping around all help reduce premiums."
      }
    ],
    13: [
      {
        id: 1,
        question: "You have $5,000 on a card with 20% APR and $5,000 on a card with 10% APR. You have $200 extra. Best strategy?",
        options: ["Split it 50/50", "Pay minimum on both, extra on the 20% APR card", "Pay extra on the 10% card", "Put it in savings instead"],
        correctAnswer: 1,
        explanation: "Avalanche method: pay minimums on all, then extra on highest interest (20% APR). This saves the most money in interest over time."
      },
      {
        id: 2,
        question: "What's 'credit utilization' and why does it matter?",
        options: ["How often you use credit", "Percentage of available credit you're using - affects 30% of your score", "The number of credit cards you have", "Your credit history length"],
        correctAnswer: 1,
        explanation: "Credit utilization is your balance ÷ credit limit. Keep it under 30% (ideally under 10%). It's 30% of your credit score!"
      },
      {
        id: 3,
        question: "Should you close old credit cards you don't use?",
        options: ["Always - they're risky", "Usually no - they help credit history length and utilization", "Yes, close all but one", "Only if they have fees"],
        correctAnswer: 1,
        explanation: "Keeping old cards open (especially with no annual fee) helps your credit history length and keeps your overall utilization low. Just use them occasionally."
      },
      {
        id: 4,
        question: "What's a good credit score to aim for?",
        options: ["500+", "650+", "740+ (excellent)", "Only 850 matters"],
        correctAnswer: 2,
        explanation: "740+ is considered excellent and qualifies you for the best rates on mortgages, car loans, and credit cards. 670-739 is good."
      },
      {
        id: 5,
        question: "How many credit cards should a young adult have?",
        options: ["Zero", "1-3, used responsibly", "As many as possible", "Exactly 10"],
        correctAnswer: 1,
        explanation: "1-3 cards is usually optimal. Too few limits your credit mix; too many can be hard to manage. Focus on using them responsibly."
      },
      {
        id: 6,
        question: "What's a 'credit builder loan'?",
        options: ["A regular loan", "A loan where your payments are held in savings until paid off, building credit", "A credit card", "A payday loan"],
        correctAnswer: 1,
        explanation: "Credit builder loans hold your loan amount in savings while you make payments. Once paid off, you get the money and a better credit score."
      },
      {
        id: 7,
        question: "You're denied credit. What should you do?",
        options: ["Apply to 10 more places immediately", "Request the denial reason and review your credit report for errors", "Give up on credit", "Ignore it"],
        correctAnswer: 1,
        explanation: "You have the right to know why you were denied. Get your free credit report, dispute any errors, and work on the issues before applying again."
      },
      {
        id: 8,
        question: "What's the benefit of asking for a credit limit increase?",
        options: ["So you can spend more", "It lowers your utilization ratio if spending stays the same", "Higher interest rates", "More fees"],
        correctAnswer: 1,
        explanation: "Higher credit limits lower your utilization ratio (if you don't spend more), which can boost your credit score. Request this after your income increases."
      },
      {
        id: 9,
        question: "How often should you check your credit report?",
        options: ["Never - it hurts your score", "At least annually, ideally quarterly", "Only when applying for credit", "Every 10 years"],
        correctAnswer: 1,
        explanation: "Check each bureau's report at least once a year for free at annualcreditreport.com. Many services offer free weekly monitoring now."
      },
      {
        id: 10,
        question: "You found an error on your credit report. What's the next step?",
        options: ["Ignore it", "File a dispute with the credit bureau in writing", "Sue immediately", "Close all accounts"],
        correctAnswer: 1,
        explanation: "Dispute errors in writing with the credit bureau(s). They must investigate within 30 days. Include documentation supporting your dispute."
      }
    ],
    14: [
      {
        id: 1,
        question: "At age 22, you invest $5,000 at 8% average annual return. What will it be worth at 62?",
        options: ["$10,000", "$50,000", "$108,000", "$250,000"],
        correctAnswer: 2,
        explanation: "Compound interest is powerful! $5,000 at 8% for 40 years becomes about $108,000. Time in the market matters most."
      },
      {
        id: 2,
        question: "What's the 'Rule of 72' used for?",
        options: ["Calculating taxes", "Estimating how long it takes money to double at a given interest rate", "Determining your retirement age", "Calculating your budget"],
        correctAnswer: 1,
        explanation: "72 ÷ interest rate = years to double. At 8%, money doubles every 9 years. At 6%, about 12 years."
      },
      {
        id: 3,
        question: "What's 'asset allocation'?",
        options: ["Where you keep your money physically", "How you divide investments among stocks, bonds, and other assets", "Your emergency fund amount", "Your savings rate"],
        correctAnswer: 1,
        explanation: "Asset allocation is how you split your portfolio among different types of investments. It's the biggest factor in your long-term returns and risk."
      },
      {
        id: 4,
        question: "What's the typical historical average annual return of the S&P 500?",
        options: ["2-3%", "5-6%", "9-10%", "15-20%"],
        correctAnswer: 2,
        explanation: "The S&P 500 has historically returned about 9-10% annually on average, though individual years vary wildly."
      },
      {
        id: 5,
        question: "What's a 'bear market'?",
        options: ["When stocks rise 20%+", "When stocks fall 20%+ from recent highs", "A market for selling bears", "A stable market"],
        correctAnswer: 1,
        explanation: "A bear market is when major indices fall 20% or more from recent highs. They're scary but historically temporary - usually the best buying opportunities."
      },
      {
        id: 6,
        question: "You panic and sell during a market crash. Why is this usually bad?",
        options: ["You lock in losses and miss the recovery", "It's actually the smart move", "You save money", "Markets never recover"],
        correctAnswer: 0,
        explanation: "Selling in a panic locks in your losses. Markets have always recovered eventually. Time in the market beats timing the market."
      },
      {
        id: 7,
        question: "What's a REIT?",
        options: ["A type of bond", "A Real Estate Investment Trust - own real estate without buying property", "A retirement account", "A type of cryptocurrency"],
        correctAnswer: 1,
        explanation: "REITs let you invest in real estate without buying physical property. They own buildings and pay dividends from rental income."
      },
      {
        id: 8,
        question: "What's 'rebalancing' your portfolio?",
        options: ["Selling everything and starting over", "Adjusting your asset allocation back to your target percentages", "Moving money between banks", "Canceling your accounts"],
        correctAnswer: 1,
        explanation: "Rebalancing means periodically selling winners and buying losers to maintain your target allocation. Usually done annually or when significantly off-target."
      },
      {
        id: 9,
        question: "Why are index funds popular for long-term wealth building?",
        options: ["They're guaranteed to make money", "Low fees, broad diversification, and they often outperform active managers", "No risk", "Fast returns"],
        correctAnswer: 1,
        explanation: "Index funds have low fees, provide instant diversification, and over time typically outperform most actively managed funds."
      },
      {
        id: 10,
        question: "What's the danger of trying to 'time the market'?",
        options: ["There is none - it works great", "Missing the best days tanks your returns - staying invested beats timing", "It's too easy", "You'll always succeed"],
        correctAnswer: 1,
        explanation: "Missing just the 10 best days in the market over 20 years can cut your returns in half. Consistent investing beats trying to time the market."
      }
    ],
    15: [
      {
        id: 1,
        question: "What's the first step before starting a side business?",
        options: ["Quit your job", "Validate your idea by testing if people will actually pay", "Buy expensive equipment", "Rent an office"],
        correctAnswer: 1,
        explanation: "Validate first! Test your idea cheaply before investing time and money. Talk to potential customers and get actual sales/commitments."
      },
      {
        id: 2,
        question: "What's the difference between gross and net income for a freelancer?",
        options: ["They're the same", "Gross is total revenue; net is what's left after expenses and taxes", "Net is before taxes", "Gross is after expenses"],
        correctAnswer: 1,
        explanation: "Gross income is total revenue. Net income is what you actually keep after expenses, taxes, and business costs."
      },
      {
        id: 3,
        question: "As a freelancer, you should set aside approximately what percentage for taxes?",
        options: ["5%", "10%", "25-30%", "50%"],
        correctAnswer: 2,
        explanation: "Self-employed individuals should save 25-30% for taxes (income tax + self-employment tax). Pay quarterly estimated taxes to avoid penalties."
      },
      {
        id: 4,
        question: "What's an LLC and why might a freelancer want one?",
        options: ["It's only for big companies", "A Limited Liability Company that separates personal and business assets", "It eliminates all taxes", "It's required to freelance"],
        correctAnswer: 1,
        explanation: "An LLC protects your personal assets from business debts and lawsuits. It's not always necessary for small freelancers but adds protection as you grow."
      },
      {
        id: 5,
        question: "What's the 'gig economy'?",
        options: ["Only for musicians", "Flexible, short-term contract work through platforms like Uber, Fiverr, Upwork", "Traditional 9-5 employment", "Government jobs only"],
        correctAnswer: 1,
        explanation: "The gig economy includes flexible, on-demand work through apps and platforms. It offers flexibility but typically lacks benefits and job security."
      },
      {
        id: 6,
        question: "You're freelancing while employed full-time. What should you check first?",
        options: ["Nothing - it's always fine", "Your employment contract for non-compete and outside work clauses", "If your boss will be jealous", "If you need a business card"],
        correctAnswer: 1,
        explanation: "Check your employment contract and company policies. Many have non-compete clauses or restrictions on outside work in similar industries."
      },
      {
        id: 7,
        question: "What's the main advantage of building a personal brand online?",
        options: ["Fame", "Attracting clients/opportunities and commanding higher rates", "Getting free stuff", "It's required by law"],
        correctAnswer: 1,
        explanation: "A strong personal brand builds credibility, attracts clients and opportunities, and allows you to charge more for your expertise."
      },
      {
        id: 8,
        question: "What's 'bootstrapping' a business?",
        options: ["Taking out loans", "Starting with personal savings without external funding", "Getting a small business grant", "Using crowdfunding"],
        correctAnswer: 1,
        explanation: "Bootstrapping means funding your business yourself without investors or loans. It keeps you in full control but limits how fast you can grow."
      },
      {
        id: 9,
        question: "A client wants to pay $500 for work that should cost $2,000. What should you do?",
        options: ["Take whatever you can get", "Politely decline or negotiate - know your worth", "Do the work and resent them", "Ghost them"],
        correctAnswer: 1,
        explanation: "Know your worth and be willing to walk away from bad deals. Explain your value, negotiate, or politely decline. Underpricing hurts your business."
      },
      {
        id: 10,
        question: "What's the biggest mistake new entrepreneurs make?",
        options: ["Starting too small", "Not validating the idea and running out of money before finding customers", "Having too much savings", "Being too careful"],
        correctAnswer: 1,
        explanation: "Many entrepreneurs build without validating that customers will pay. Test your idea small, get paying customers, then scale."
      }
    ],
    16: [
      {
        id: 1,
        question: "What does FIRE stand for?",
        options: ["Fast Income Retirement Earnings", "Financial Independence, Retire Early", "Future Investment Returns Expected", "Free Income Retirement Easily"],
        correctAnswer: 1,
        explanation: "FIRE = Financial Independence, Retire Early. It's about saving aggressively and investing wisely to have the option to retire decades early."
      },
      {
        id: 2,
        question: "According to the 4% rule, how much do you need saved to withdraw $40,000 annually?",
        options: ["$400,000", "$600,000", "$1,000,000", "$2,000,000"],
        correctAnswer: 2,
        explanation: "The 4% rule: Annual spending × 25 = amount needed. $40,000 × 25 = $1,000,000. This assumes your investments grow enough to last 30+ years."
      },
      {
        id: 3,
        question: "What's the most important factor for achieving financial independence?",
        options: ["Having a high income", "Your savings rate (the percentage of income you save)", "Winning the lottery", "Inheriting money"],
        correctAnswer: 1,
        explanation: "Savings rate matters more than income. Someone earning $50k saving 50% can reach FI faster than someone earning $200k saving 10%."
      },
      {
        id: 4,
        question: "What's 'Coast FIRE'?",
        options: ["Retiring on a coast", "When you have enough invested that it will grow to your retirement goal without adding more", "A type of investment", "Saving less than $1,000"],
        correctAnswer: 1,
        explanation: "Coast FIRE means you've invested enough that compound growth alone will get you to your retirement goal. You just need to cover current expenses."
      },
      {
        id: 5,
        question: "To achieve financial independence faster, what's most effective?",
        options: ["Only focus on cutting expenses", "Only focus on increasing income", "Both increasing income AND decreasing expenses", "Timing the market perfectly"],
        correctAnswer: 2,
        explanation: "The most powerful approach combines cutting unnecessary expenses AND growing income. The gap between income and expenses is what you can invest."
      },
      {
        id: 6,
        question: "What's 'lifestyle inflation' and why is it dangerous?",
        options: ["When prices go up", "Increasing spending as income increases, preventing wealth building", "A good thing to do", "Inflation rate"],
        correctAnswer: 1,
        explanation: "Lifestyle inflation is spending more as you earn more. It's why many high earners live paycheck to paycheck. Keep expenses stable as income grows."
      },
      {
        id: 7,
        question: "You get a $10,000 raise. To build wealth fastest, what should you do with most of it?",
        options: ["Upgrade your apartment", "Invest most of the increase before lifestyle inflation sets in", "Buy a nicer car", "Celebrate with a big vacation"],
        correctAnswer: 1,
        explanation: "Invest raises and windfalls before you 'need' them. Lifestyle inflation happens slowly - capturing raises for investing accelerates wealth building."
      },
      {
        id: 8,
        question: "What's the relationship between your savings rate and years until retirement?",
        options: ["No relationship", "Higher savings rate = fewer years until you can retire", "Higher savings rate = more years", "Only income matters"],
        correctAnswer: 1,
        explanation: "A 10% saver might work 50+ years. A 50% saver can retire in ~17 years. Your savings rate dramatically affects your timeline to FI."
      },
      {
        id: 9,
        question: "What's a 'net worth statement' and why track it?",
        options: ["Only for wealthy people", "Assets minus liabilities - shows your true financial position and progress", "Your salary", "A bill you receive"],
        correctAnswer: 1,
        explanation: "Net worth = what you own - what you owe. Tracking it monthly or quarterly shows your real progress toward financial goals."
      },
      {
        id: 10,
        question: "You just finished this financial literacy program. What's your most important next step?",
        options: ["Forget about it", "Take ONE action today: automate savings, check your credit, or start tracking expenses", "Wait until you're older", "Read another book"],
        correctAnswer: 1,
        explanation: "Action beats perfection. Pick ONE thing from everything you've learned and do it TODAY. Small actions compound into life-changing results."
      }
    ]
  };

  const questions = programId === 'COLLEGE' ? (collegeQuizData[weekNumber] || []) : (quizData[weekNumber] || []);
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
      <div className="w-full space-y-6 pb-6 md:pb-0">
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
      <div className="w-full space-y-6 pb-6 md:pb-0">
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
    <div className="w-full space-y-6 pb-6 md:pb-0">
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
