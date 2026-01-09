import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, FileText, Video, Users, Send, MessageSquare } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { ProgressBar } from './ui/ProgressBar';
import { Button3D } from './ui/Button3D';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface LessonScreenProps {
  weekNumber: number;
  weekTitle: string;
  trackLevel?: string;
  programId?: string;
  startSection?: number; // Now represents day number (0-3 for days 1-4)
  onBack: () => void;
  onComplete: (completed: boolean) => void;
  onSectionComplete?: (sectionIndex: number, totalSections: number) => void;
}

// Day names for display
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export function LessonScreen({ weekNumber, weekTitle, trackLevel = 'beginner', programId = 'HS', startSection = 0, onBack, onComplete, onSectionComplete }: LessonScreenProps) {
  const [currentSection, setCurrentSection] = useState(startSection);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  // Activity submission state
  const [activityResponse, setActivityResponse] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [activitySubmitted, setActivitySubmitted] = useState(false);
  const [showActivitySection, setShowActivitySection] = useState(false);

  // Sync currentSection when startSection prop changes
  useEffect(() => {
    setCurrentSection(startSection);
    // Reset activity state when day changes
    setActivityResponse('');
    setActivitySubmitted(false);
    setShowActivitySection(false);
  }, [startSection, weekNumber]);

  // Get current day number (1-4)
  const currentDay = currentSection + 1;
  const currentDayName = DAY_NAMES[currentSection] || 'Day ' + currentDay;

  // Lesson content for different weeks
  const getLessonContent = (week: number) => {
    const lessonMap: Record<number, any> = {
      1: {
        title: "Understanding Income, Expenses, and Savings",
        sections: [
          {
            title: "What is Income?",
            type: "reading",
            duration: "5 min",
            content: `Alright, so what even is income? It's basically all the money that comes INTO your pocket from wherever. Pretty simple, right?

As a student, you might be getting money from a bunch of different places:

• **Part-time jobs** - Like working at Chipotle, the campus bookstore, or wherever
• **Scholarships** - Yup, athletic scholarships and academic ones both count
• **Family support** - Money your parents or family members give you
• **Side hustles** - Maybe you tutor younger kids, run a YouTube channel, or sell stuff online

Here's the big picture: You want MORE money coming in than going out. That's literally the whole game. If you make more than you spend, you're winning. If you spend more than you make, you're gonna have problems real quick.`,
            keyPoints: [
              "Keep track of every place money comes from",
              "Your scholarship counts as income too",
              "Save receipts and records for tax season",
              "Always look for ways to make more money"
            ]
          },
          {
            title: "Types of Expenses",
            type: "reading",
            duration: "4 min",
            content: `So expenses are basically everywhere money LEAVES your pocket. But not all expenses are the same - there's two types you gotta know:

**FIXED EXPENSES (Same amount every single month):**
• Rent - gotta have somewhere to live
• Phone bill - always the same price
• Insurance - same monthly charge
• Loan payments - doesn't change month to month

**VARIABLE EXPENSES (This is where things get wild):**
• Food - depends on how much you eat out vs cook
• Entertainment - movies, concerts, games, etc.
• Shopping - clothes, random stuff you "need"
• Gas - depends on how much you drive

Why does this matter? Because fixed expenses are locked in - you can't really change them much. But variable expenses? That's where you have POWER. You can totally control how much you spend on food, entertainment, and shopping. That's where you'll save money if you need to.`,
            keyPoints: [
              "Fixed = same every month, can't really change it",
              "Variable = you control this, cuts can happen here",
              "Track what you spend for a month to see patterns",
              "Buy what you NEED first, then wants if there's money left"
            ]
          },
          {
            title: "The Power of Saving",
            type: "video",
            duration: "6 min",
            content: `Real talk - saving money is just like building any skill. You don't become great overnight, and you don't build wealth overnight either. It takes discipline and doing it consistently, even when you don't feel like it.

Even if you're only saving like $5 or $10 a week, that stuff ADDS UP. Seriously. That's the magic of compound interest (basically your money making more money over time).

**Why even bother saving?**
• Emergency fund - because your car WILL break down at the worst time
• Future goals - want a car? Your own place? To start a business? You need cash
• Peace of mind - not stressing about money is honestly priceless
• Building up credit and being able to invest later

**How much should you save?**
Try the 50/30/20 rule (it's pretty simple):
• 50% goes to NEEDS (rent, food, bills - the stuff you can't skip)
• 30% goes to WANTS (fun stuff, eating out, entertainment)
• 20% goes to SAVINGS and paying off any debt you have`,
            keyPoints: [
              "Literally start with $5/week if that's all you got",
              "Set up automatic transfers so you don't forget",
              "Keep your emergency money in a separate account",
              "Pick a specific goal - like 'save $500 by June'"
            ]
          },
          {
            title: "Creating Your First Budget",
            type: "interactive",
            duration: "8 min",
            content: `Okay, time to make your first budget. Don't worry, it's not as boring as it sounds. Think of a budget like your game plan - except instead of planning plays, you're planning where your money goes BEFORE you spend it.

**Step 1: Figure out your monthly income**
Just add up all the money you get in a month. Scholarship, job, parents, whatever.

**Step 2: Write down ALL your expenses**
And I mean everything - rent, food, Netflix, gas, that energy drink you buy every morning. Everything.

**Step 3: Do the math: Income minus Expenses**
If you get a positive number = you're good! You're making more than you're spending.
If you get a negative number = Houston, we have a problem. You need to either make more money or spend less.

**Step 4: Put savings FIRST**
This is the secret sauce: pay yourself FIRST. Before you buy anything fun, move some money to savings. Treat savings like a bill you HAVE to pay.`,
            keyPoints: [
              "Every single dollar needs a job - track it all",
              "Be honest about what you actually spend",
              "Check your budget every month and fix what's not working",
              "Hit a savings goal? Celebrate! You earned it"
            ]
          }
        ]
      },
      2: {
        title: "Increasing Your Income & Reach Your Goal",
        sections: [
          {
            title: "Side Hustle Opportunities for Students",
            type: "reading",
            duration: "7 min",
            content: `Look, you're a student. You've got skills and time that you can turn into cash. Why not use them to make some money? Here are some legit ways to earn:

**Use your unique skills:**
• Tutoring - help other students in subjects you're good at
• Content creation - YouTube, TikTok, Instagram about your interests
• Freelance work - graphic design, writing, video editing
• Social media management - help local businesses with their accounts
• Sell stuff you make or don't use anymore

**Flexible gigs that work around your schedule:**
• Delivery driving - DoorDash, Uber Eats, Instacart
• Campus jobs - library, rec center, bookstore
• Photography - take photos at events
• Pet sitting or dog walking - people always need this
• Reselling - buy low, sell high on eBay or Poshmark

IMPORTANT: Before you start, make sure it doesn't interfere with your studies or any scholarships/financial aid you're receiving. Check the rules first!`,
            keyPoints: [
              "You've got skills others will pay for - use them",
              "Check any scholarship or financial aid rules first",
              "Start small, see what works, then do more",
              "Pick stuff that fits around your class schedule"
            ]
          },
          {
            title: "Goal Setting and Income Planning",
            type: "interactive",
            duration: "6 min",
            content: `If you don't have a clear goal, you're just gonna spend money on random stuff and wonder where it all went. Goals keep you focused and actually motivated to make and save money.

**How to set SMART goals (yeah, it's an acronym):**
• **Specific** - Say EXACTLY what you want. "Save $1,000" not just "save money"
• **Measurable** - Use numbers so you can track it
• **Achievable** - Be real with yourself. Don't say you'll save $10,000 in a month on a part-time job
• **Relevant** - Pick something that actually matters to YOU
• **Time-bound** - Give yourself a deadline or it'll never happen

**Here's what a good goal looks like:**
"I'm gonna save $500 for an emergency fund by working 10 hours a week at my campus job for the next 4 months."

See? Specific, measurable, achievable, relevant, and has a deadline. That's how you do it.`,
            keyPoints: [
              "Write your goals down - seriously, grab your phone and type it out",
              "Big goal? Break it into smaller chunks",
              "Have short-term goals (next month) AND long-term (next year)",
              "Check your progress every month and adjust if needed"
            ]
          },
          {
            title: "Building Multiple Income Streams",
            type: "reading",
            duration: "5 min",
            content: `Think about successful people - they don't just have one source of income. They've got investments, businesses, side projects, all kinds of stuff. You should think the same way about YOUR money, even if it's on a smaller scale.

**Your main income:**
This is your primary thing - your scholarship, your main job, whatever.

**Add more income streams:**
• Part-time job on the side
• Use your skills to make money (coaching, tutoring, etc.)
• Passive income once you get it set up (like selling designs online)
• Investment returns (this is advanced stuff for later)

**Why bother with multiple streams?**
• If one dries up, you're not screwed - you have others
• More streams = more total money coming in
• If you lose your main job, you still have money coming in
• You learn different skills and get experience in different areas

Don't try to do everything at once. Start with ONE extra income stream. Get good at it. Then add another when you're ready.`,
            keyPoints: [
              "Don't put all your eggs in one basket - have multiple income sources",
              "Start with what you already know how to do",
              "Add new streams slowly - don't overwhelm yourself",
              "Keep track of how much each stream brings in"
            ]
          }
        ]
      },
      3: {
        title: "What is Credit? (How it works, importance of credit score)",
        sections: [
          {
            title: "Understanding Credit Basics",
            type: "reading",
            duration: "6 min",
            content: `Okay, so what even is credit? Basically, it's borrowing money that you promise to pay back later. Think of it like your financial reputation - are you someone who keeps their promises or nah?

**Here's how it works:**
1. You apply for credit (like a credit card or loan)
2. The bank or whoever checks if you're trustworthy with money
3. If they say yes, they give you a limit - like "you can borrow up to $500"
4. You gotta pay back what you borrow, PLUS extra money called interest
5. How well you pay stuff back affects your credit score (we'll get to that)

**Different types of credit:**
• **Revolving Credit** - Credit cards. You can use it, pay it back, use it again
• **Installment Credit** - Loans where you pay the same amount every month (like car loans)
• **Secured Credit** - You put something up as backup (like your car)
• **Unsecured Credit** - Nothing backing it up - they just trust you'll pay it back`,
            keyPoints: [
              "Credit = borrowing money you HAVE to pay back",
              "Interest = extra money you pay for borrowing (it's how they make money)",
              "How you pay stuff back is THE most important thing",
              "Different types of credit work in different ways"
            ]
          },
          {
            title: "Your Credit Score Explained",
            type: "video",
            duration: "8 min",
            content: `Your credit score is just a number between 300 and 850 that shows if you're good with borrowed money. Higher number = you're more trustworthy = better deals when you need to borrow money.

**What the numbers mean:**
• 800-850: Excellent (you're crushing it)
• 740-799: Very Good (nice job)
• 670-739: Good (solid)
• 580-669: Fair (needs work)
• 300-579: Poor (gotta fix this)

**What actually affects your score:**
• Payment History (35%) - This is HUGE. Pay your bills on time. Every. Single. Time.
• Credit Utilization (30%) - Don't max out your cards. Use less than 30% of your limit
• Length of Credit History (15%) - How long you've had credit. Keep old accounts open
• Types of Credit (10%) - Having a mix of credit cards and loans is good
• New Credit (10%) - Don't apply for a bunch of credit cards all at once`,
            keyPoints: [
              "Paying on time is the #1 thing that matters",
              "Never use more than 30% of your credit limit",
              "Keep your old credit cards - don't close them",
              "Check your score regularly (it's free)"
            ]
          },
          {
            title: "Building Credit as a Student",
            type: "interactive",
            duration: "7 min",
            content: `Starting to build credit NOW is honestly one of the smartest things you can do. Future you will be thanking present you. Here's how to do it without screwing it up:

**Good ways to start building credit:**
1. **Student Credit Card** - Made specifically for people like you with no credit
2. **Secured Credit Card** - You put down like $200, they give you a $200 limit. Can't mess up too bad
3. **Get added to a parent's card** - If your parents have good credit, ask them to add you as an authorized user
4. **Credit Builder Loan** - A small loan that's designed to help you build credit

**How to actually build good credit:**
• Get ONE card to start. Don't go crazy
• Use it for small stuff you already buy - like gas or groceries
• Pay off the FULL balance every single month - not just the minimum
• Don't spend money you don't have. The card isn't free money
• Set up autopay so you never forget to pay
• Check your credit report once a year for free at annualcreditreport.com`,
            keyPoints: [
              "Start with a student card or secured card",
              "Pay the FULL balance on time every month - no exceptions",
              "Use less than 30% of whatever your limit is",
              "Check your credit regularly to catch any problems"
            ]
          }
        ]
      },
      4: {
        title: "How to Build & Maintain Good Credit",
        sections: [
          {
            title: "Practical Credit Building Strategies",
            type: "reading",
            duration: "6 min",
            content: `Alright, so you know WHAT credit is and WHY it matters. Now let's talk about HOW to actually build it up without messing it up.

**Best ways to start building credit RIGHT NOW:**
1. **Get a student credit card** - Banks literally make these for people with zero credit history
2. **Become an authorized user** - Ask a parent or trusted family member with good credit to add you to their card
3. **Try a secured credit card** - You put down $200-500 as a deposit, that becomes your credit limit. Can't overspend
4. **Get a credit-builder loan** - Some credit unions offer these specifically to help people build credit

**The golden rules for building credit:**
• Only charge what you can pay off IN FULL every month
• Never use more than 30% of your credit limit (if you have a $500 limit, only use $150 max)
• Set up autopay for at least the minimum payment (but always pay the full balance)
• Keep your old credit cards open - even if you don't use them much
• Don't apply for a bunch of credit cards at once - each application dings your score`,
            keyPoints: [
              "Start with ONE credit card and use it responsibly",
              "Pay the FULL balance every month - not just the minimum",
              "Keep credit utilization under 30% of your limit",
              "Set up autopay so you never miss a payment"
            ]
          },
          {
            title: "Common Credit Mistakes to Avoid",
            type: "video",
            duration: "7 min",
            content: `Let's keep it real - there's a LOT of ways people mess up their credit. Don't be that person. Here's what NOT to do:

**Mistake #1: Paying only the minimum payment**
If you only pay the minimum, you're basically just paying the interest. Your actual debt barely goes down and you end up paying WAY more over time. Not worth it.

**Mistake #2: Maxing out your credit cards**
Using 100% of your credit limit KILLS your score. Banks see that and think "this person is desperate for money." Keep it under 30%.

**Mistake #3: Missing payments**
One missed payment can drop your score by like 100 points. Set. Up. Autopay. Seriously.

**Mistake #4: Closing old credit cards**
Your credit history length matters. Keep those old cards open even if you just use them for gas once a month.

**Mistake #5: Co-signing for friends**
If they don't pay, it's YOUR credit that gets wrecked. Don't do it unless you're willing to pay their debt for them.

**Mistake #6: Not checking your credit report**
Errors happen. Identity theft happens. Check your report at least once a year for free at annualcreditreport.com`,
            keyPoints: [
              "ALWAYS pay more than the minimum (ideally the full balance)",
              "Missing payments is the fastest way to destroy your credit",
              "Keep old accounts open to maintain credit history length",
              "Check your credit report yearly to catch errors or fraud"
            ]
          },
          {
            title: "Maintaining Good Credit Long-Term",
            type: "interactive",
            duration: "8 min",
            content: `Building credit is one thing. Keeping it good for years? That's where most people slip up. Here's how to maintain that good credit score:

**Monthly credit card routine:**
1. Use your card for normal stuff you're already buying (gas, groceries, etc.)
2. Keep track of what you spend (use your bank app)
3. Pay off the FULL balance before the due date
4. Check your statement for any weird charges
5. Repeat next month

**Every 3-6 months:**
• Check your credit score (many apps do this for free now - like Credit Karma)
• Review your credit utilization - make sure you're under 30% on all cards
• Set up balance alerts so you know if you're getting close to your limit

**Once a year:**
• Get your free credit report from all 3 bureaus (Equifax, Experian, TransUnion) at annualcreditreport.com
• Look for errors or accounts you don't recognize
• Dispute any errors you find
• Celebrate if your score went up

**Pro tips for keeping your credit solid:**
• If you get a raise or more income, ask for a credit limit increase (but don't increase your spending)
• Diversify your credit types over time (credit card + car loan = better than just credit cards)
• Never close your oldest credit card unless it has a crazy annual fee
• If you're struggling to pay, call the company BEFORE you miss a payment - they might work with you`,
            keyPoints: [
              "Treat your credit card like a debit card - only spend what you have",
              "Check your score regularly to track progress and catch problems",
              "Pull your free credit report yearly from annualcreditreport.com",
              "If you're struggling, communicate with creditors before missing payments"
            ]
          }
        ]
      },
      5: {
        title: "How to Build Credit & Avoid Debt Traps",
        sections: [
          {
            title: "Common Debt Traps to Avoid",
            type: "reading",
            duration: "6 min",
            content: `Listen up - companies WANT you to fall into debt. That's how they make money off you. Here are the traps you need to watch out for:

**Buy Now, Pay Later (BNPL):**
• Seems harmless but it adds up FAST
• Miss a payment? Big fees and it hurts your credit
• Makes you spend more than you would with cash

**Payday Loans:**
• STAY AWAY. These have insane interest rates (like 400%+)
• They trap you in a cycle where you keep borrowing
• There's almost always a better option

**Credit Card Minimum Payments:**
• Only paying the minimum means you're paying mostly interest
• A $1000 balance can take 10+ years to pay off at minimums
• Always pay more than the minimum if you can

**Store Credit Cards:**
• "Save 20% today!" but the interest rate is usually crazy high
• You end up spending more to "earn rewards"
• One store card is fine, but don't get a bunch`,
            keyPoints: [
              "If it sounds too easy, there's probably a catch",
              "NEVER take a payday loan - ever",
              "Pay more than the minimum on credit cards",
              "Sleep on big purchases - wait 24-48 hours"
            ]
          },
          {
            title: "Smart Borrowing Strategies",
            type: "reading",
            duration: "5 min",
            content: `Sometimes you HAVE to borrow money - for school, a car, whatever. The key is doing it smart:

**Good debt vs Bad debt:**
• Good debt: Student loans, mortgage, starting a business
• Bad debt: Credit cards for stuff you don't need, payday loans

**How to borrow smart:**
• Shop around for the lowest interest rate
• Understand ALL the terms before you sign
• Know exactly when payments are due
• Have a plan to pay it back before you borrow

**Student Loans specifically:**
• Federal loans usually have better terms than private
• Only borrow what you actually need
• Know whether your loan has subsidized interest
• Look into income-driven repayment plans`,
            keyPoints: [
              "Not all debt is created equal - some is actually useful",
              "Always compare rates from multiple lenders",
              "Read the fine print - all of it",
              "Federal student loans first, private loans last"
            ]
          }
        ]
      },
      6: {
        title: "How to Open & Manage a Bank Account",
        sections: [
          {
            title: "Choosing the Right Bank",
            type: "reading",
            duration: "5 min",
            content: `Not all banks are the same. Here's what to look for:

**Types of financial institutions:**
• Big banks (Chase, Bank of America) - lots of ATMs, good apps
• Credit unions - often lower fees, better rates
• Online banks - usually best interest rates, no physical locations

**What to look for:**
• No monthly fees (or easy ways to waive them)
• Free ATMs near you or ATM fee reimbursement
• Good mobile app with deposit features
• No minimum balance requirements
• Good customer service

**Red flags to avoid:**
• High monthly fees
• Lots of hidden charges
• Poor online/mobile banking
• Limited ATM access`,
            keyPoints: [
              "Credit unions often have better deals than big banks",
              "Online banks pay higher interest on savings",
              "Look for no-fee checking accounts",
              "Make sure ATMs are convenient for you"
            ]
          },
          {
            title: "Opening Your Account",
            type: "interactive",
            duration: "6 min",
            content: `Ready to open an account? Here's what you need:

**Documents to bring:**
• Government ID (driver's license, passport, state ID)
• Social Security number
• Proof of address (utility bill, lease)
• Initial deposit (some banks need $25-100 to start)

**Types of accounts to consider:**
• Checking account - for everyday spending and bills
• Savings account - for money you're not touching
• High-yield savings - better interest for your emergency fund

**Pro tips:**
• Set up direct deposit right away
• Download the mobile app immediately
• Set up alerts for low balance and large transactions
• Link your checking and savings for easy transfers`,
            keyPoints: [
              "Have your ID and SSN ready",
              "Start with checking + savings combo",
              "Set up mobile banking and alerts right away",
              "Direct deposit often waives monthly fees"
            ]
          },
          {
            title: "Managing Your Account Like a Pro",
            type: "reading",
            duration: "5 min",
            content: `Having an account is one thing - managing it well is another:

**Check your balance regularly:**
• Use the app to check before spending
• Set up low balance alerts
• Know what's pending vs what's cleared

**Avoid overdraft fees:**
• These can be $30-35 EACH TIME you overdraw
• Link savings as backup or decline overdraft "protection"
• Track your spending so you don't overspend

**Protect your account:**
• Never share your PIN or login info
• Use strong, unique passwords
• Enable two-factor authentication
• Review statements monthly for weird charges
• Report lost/stolen cards immediately`,
            keyPoints: [
              "Check your balance before big purchases",
              "Set up overdraft protection linked to savings",
              "Review your statement every month",
              "Report anything suspicious immediately"
            ]
          }
        ]
      },
      7: {
        title: "Create a Personal Budget",
        sections: [
          {
            title: "Budgeting Methods That Actually Work",
            type: "reading",
            duration: "6 min",
            content: `There's no one-size-fits-all budget. Here are methods that work for different people:

**50/30/20 Rule (most popular):**
• 50% Needs - rent, food, bills, transportation
• 30% Wants - entertainment, eating out, shopping
• 20% Savings - emergency fund, investments, debt payoff

**Zero-Based Budget:**
• Every dollar gets assigned a job
• Income minus expenses equals zero
• Great if you want total control

**Envelope Method:**
• Put cash in envelopes for each category
• When the envelope is empty, stop spending
• Good for people who overspend with cards

**Pay Yourself First:**
• Move savings out immediately when you get paid
• Spend whatever's left guilt-free
• Simple and effective`,
            keyPoints: [
              "Try different methods to find what works for you",
              "50/30/20 is a great starting point",
              "The best budget is one you'll actually stick to",
              "Adjust as your income and expenses change"
            ]
          },
          {
            title: "Building Your Personal Budget",
            type: "interactive",
            duration: "8 min",
            content: `Let's build YOUR budget step by step:

**Step 1: Calculate your monthly income**
Add up everything: job, scholarships, family help, side hustles

**Step 2: List your fixed expenses**
Things that are the same every month: rent, phone, insurance, subscriptions

**Step 3: Estimate variable expenses**
Things that change: food, gas, entertainment, personal care

**Step 4: Subtract expenses from income**
Positive = you have money to save
Negative = you need to cut spending or earn more

**Step 5: Set savings goals**
Emergency fund first, then other goals

**Step 6: Track and adjust**
Review weekly at first, then monthly once you get the hang of it`,
            keyPoints: [
              "Be honest about what you actually spend",
              "Include all income sources",
              "Don't forget irregular expenses (car repairs, gifts)",
              "Review and adjust your budget monthly"
            ]
          }
        ]
      },
      8: {
        title: "Create Your Spending Plan",
        sections: [
          {
            title: "Tracking Every Dollar",
            type: "reading",
            duration: "5 min",
            content: `You can't manage what you don't measure. Here's how to track your spending:

**Manual tracking:**
• Write down every purchase in a notebook or notes app
• Take photos of receipts
• Review at the end of each day

**Apps that help:**
• Mint - connects to your accounts, categorizes automatically
• YNAB (You Need A Budget) - great for the zero-based method
• Personal Capital - good for seeing the big picture
• Your bank's built-in spending tracker

**What to track:**
• Amount spent
• Category (food, transportation, entertainment)
• Whether it was a need or want
• How you paid (cash, debit, credit)`,
            keyPoints: [
              "Pick ONE tracking method and stick with it",
              "Review your spending weekly",
              "Categorize everything for better insights",
              "Look for patterns in your spending"
            ]
          },
          {
            title: "Creating Your Spending Plan",
            type: "interactive",
            duration: "7 min",
            content: `A spending plan is like a budget, but more flexible. Here's how to make one:

**1. Know your priorities:**
What matters most to you? Saving for a car? Having fun on weekends? Be honest.

**2. Allocate money to priorities FIRST:**
Before bills even, decide how much goes to what matters most.

**3. Cover the essentials:**
Rent, utilities, food, transportation - the stuff you can't skip.

**4. Plan for fun:**
Yes, include entertainment. A plan with no fun won't last.

**5. Build in flexibility:**
Have a "miscellaneous" category for unexpected stuff.

**6. Review and adjust:**
Life changes. Your plan should too.`,
            keyPoints: [
              "Your spending plan should reflect YOUR priorities",
              "Include fun money - you're more likely to stick to it",
              "Build in a buffer for unexpected expenses",
              "Adjust your plan as your life changes"
            ]
          }
        ]
      },
      9: {
        title: "Personal Branding & Professionalism",
        sections: [
          {
            title: "What is Personal Branding?",
            type: "reading",
            duration: "6 min",
            content: `Your personal brand is how people see you - online and in real life. Think of yourself as a product. What makes YOU unique and valuable?

**Your brand includes:**
• How you present yourself online (social media, LinkedIn)
• How you dress and carry yourself
• How you communicate (speaking, writing, texting)
• Your reputation - what people say about you

**Why it matters:**
• Recruiters Google you before interviews
• Your online presence can help or hurt job chances
• Networking is easier when people know what you're about
• A strong brand opens doors

**As a student:**
• You're building your reputation now
• Your discipline and work ethic are valuable
• Use your unique experiences as part of your brand
• Don't limit yourself to just one identity`,
            keyPoints: [
              "Your brand is what people say about you when you're not there",
              "Google yourself - see what comes up",
              "Be consistent across all platforms",
              "Your unique experiences are strengths - use them"
            ]
          },
          {
            title: "Building Your Online Presence",
            type: "interactive",
            duration: "7 min",
            content: `Let's clean up your online presence:

**LinkedIn (essential for careers):**
• Professional photo (no party pics)
• Clear headline: "Finance Major | Aspiring Business Leader | Problem Solver"
• Summary that tells your story
• List your achievements and experiences

**Social Media Audit:**
• Would you be okay with a future employer seeing everything?
• Delete or hide anything questionable
• Set accounts to private if needed
• Think before you post - always

**Creating valuable content:**
• Share your journey and lessons learned
• Post about your interests and goals
• Engage with others in your field
• Be helpful, not just self-promotional`,
            keyPoints: [
              "LinkedIn is non-negotiable for career building",
              "Audit your social media - delete the sketchy stuff",
              "Post content that adds value",
              "Be authentic but professional"
            ]
          }
        ]
      },
      10: {
        title: "Resume Building & Job Applications",
        sections: [
          {
            title: "Creating a Standout Resume",
            type: "reading",
            duration: "7 min",
            content: `Your resume is your first impression. Make it count:

**Format basics:**
• One page (unless you have 10+ years experience)
• Clean, readable font (no Comic Sans ever)
• Consistent formatting throughout
• PDF format when sending

**What to include:**
• Contact info at the top
• Education (include GPA if 3.0+)
• Experience (jobs, internships, volunteer work)
• Skills (technical and soft skills)
• Athletic experience (leadership, teamwork, discipline)

**Power words to use:**
• Led, managed, created, developed
• Increased, improved, achieved
• Coordinated, organized, implemented

**What NOT to include:**
• "References available upon request" (obvious)
• Irrelevant hobbies
• Personal info (age, marital status)
• Lies (they will check)`,
            keyPoints: [
              "Keep it to one page",
              "Use action verbs to describe achievements",
              "Quantify results when possible (increased sales by 20%)",
              "Tailor your resume for each job application"
            ]
          },
          {
            title: "Job Application Strategy",
            type: "interactive",
            duration: "6 min",
            content: `Applying for jobs is a numbers game, but strategy matters:

**Before you apply:**
• Research the company thoroughly
• Read the job description carefully
• Make sure you meet at least 70% of requirements
• Customize your resume for this specific job

**The application process:**
• Follow instructions exactly
• Write a tailored cover letter
• Use keywords from the job posting
• Proofread everything twice

**After you apply:**
• Keep a spreadsheet of applications
• Follow up after 1-2 weeks if no response
• Connect with employees on LinkedIn
• Keep applying - don't wait for responses

**Common mistakes:**
• Applying to everything without customizing
• Typos and grammar errors
• Not following up
• Giving up too soon`,
            keyPoints: [
              "Quality over quantity - customize each application",
              "Keep track of where you've applied",
              "Follow up politely if you don't hear back",
              "Rejection is normal - keep going"
            ]
          }
        ]
      },
      11: {
        title: "Career Readiness & Leadership",
        sections: [
          {
            title: "Developing Leadership Skills",
            type: "reading",
            duration: "6 min",
            content: `Leadership isn't just for managers - it's a skill everyone needs:

**What makes a good leader:**
• Takes initiative without being asked
• Communicates clearly and listens well
• Takes responsibility for mistakes
• Lifts others up instead of putting them down
• Stays calm under pressure

**Leadership as a student:**
• You already lead by example in group projects
• You know how to work as part of a team
• You understand discipline and commitment
• Use these experiences in job interviews

**Ways to develop leadership:**
• Take on projects others don't want
• Mentor younger students
• Volunteer for leadership roles in clubs
• Practice public speaking
• Learn to give and receive feedback`,
            keyPoints: [
              "Leadership is a skill you can develop",
              "Your student experiences ARE leadership experiences",
              "Look for opportunities to lead in any role",
              "Great leaders are also great listeners"
            ]
          },
          {
            title: "Professional Workplace Skills",
            type: "interactive",
            duration: "7 min",
            content: `What employers actually want (beyond technical skills):

**Communication:**
• Write clear, professional emails
• Speak up in meetings (but know when to listen)
• Give updates without being asked
• Handle difficult conversations professionally

**Time Management:**
• Meet deadlines consistently
• Prioritize tasks effectively
• Don't overcommit - learn to say no
• Use calendar and task tools

**Problem Solving:**
• Don't just bring problems - bring solutions
• Think critically before asking for help
• Learn from mistakes instead of hiding them
• Stay calm when things go wrong

**Professionalism:**
• Be on time (actually, be early)
• Dress appropriately for the environment
• Keep personal drama out of work
• Represent your employer well`,
            keyPoints: [
              "Soft skills matter as much as hard skills",
              "Reliability is the foundation of professionalism",
              "Always come with solutions, not just problems",
              "Your reputation follows you - protect it"
            ]
          }
        ]
      },
      12: {
        title: "Networking & Professional Connections",
        sections: [
          {
            title: "Why Networking Matters",
            type: "reading",
            duration: "5 min",
            content: `Most jobs aren't posted online - they're filled through connections:

**The hidden job market:**
• 70-80% of jobs are never advertised
• People hire people they know and trust
• A referral makes you 10x more likely to get hired

**Networking isn't just about getting jobs:**
• Learn from people ahead of you
• Get advice and mentorship
• Find opportunities you didn't know existed
• Build relationships that last your whole career

**Networking as a student:**
• You already network with professors, classmates, alumni
• Campus events are great for meeting people
• Your dedication is impressive to professionals
• Use your existing connections!`,
            keyPoints: [
              "Your network is your net worth",
              "Most opportunities come through people you know",
              "Start building relationships before you need them",
              "Give value to others - networking is not just taking"
            ]
          },
          {
            title: "How to Network Effectively",
            type: "interactive",
            duration: "7 min",
            content: `Networking doesn't have to be awkward. Here's how to do it right:

**Where to network:**
• Campus events and career fairs
• LinkedIn (reach out to alumni)
• Professional associations
• Alumni events and games
• Informational interviews

**How to reach out:**
• Personalize every message
• Be specific about why you're reaching out
• Offer something in return (even if it's just gratitude)
• Follow up but don't be pushy

**At events:**
• Have a 30-second intro ready
• Ask questions about THEM, not just you
• Get contact info and follow up within 24 hours
• Connect on LinkedIn same day

**Building real relationships:**
• Stay in touch even when you don't need something
• Share interesting articles or opportunities
• Congratulate people on their wins
• Be genuinely interested in others`,
            keyPoints: [
              "Network before you need it",
              "Focus on giving, not just getting",
              "Follow up within 24 hours of meeting someone",
              "Keep relationships warm with regular contact"
            ]
          }
        ]
      },
      13: {
        title: "Entrepreneurship & Career Planning",
        sections: [
          {
            title: "Exploring Entrepreneurship",
            type: "reading",
            duration: "7 min",
            content: `Ever thought about starting your own business? Here's what you need to know:

**Is entrepreneurship for you?**
• Do you like solving problems?
• Are you okay with uncertainty?
• Can you handle rejection and failure?
• Do you see opportunities others miss?

**Types of businesses to consider:**
• Service business (coaching, tutoring, consulting)
• Product business (physical or digital products)
• Online business (content, e-commerce, apps)
• Freelancing (using your skills for hire)

**Starting small:**
• Test your idea before going all in
• Start as a side hustle while in school
• Use your existing skills and network
• Learn from failure - it's part of the process

**Student advantages:**
• Discipline and work ethic
• Ability to handle pressure
• Experience learning and adapting
• Access to resources and networks`,
            keyPoints: [
              "You don't need a revolutionary idea to start",
              "Start small and validate your idea first",
              "Your student mindset is an entrepreneurial asset",
              "Failure is feedback - learn and keep going"
            ]
          },
          {
            title: "Career Planning Strategies",
            type: "interactive",
            duration: "6 min",
            content: `Whether you go entrepreneur or traditional career, you need a plan:

**Know yourself:**
• What are you good at?
• What do you enjoy doing?
• What kind of lifestyle do you want?
• What industries interest you?

**Research careers:**
• Talk to people in jobs you're curious about
• Look up salary ranges and growth potential
• Understand what education/skills are needed
• Consider work-life balance

**Create a career roadmap:**
• Where do you want to be in 5 years? 10 years?
• What skills do you need to develop?
• What experiences will help you get there?
• Who can help you along the way?

**Stay flexible:**
• Plans change - and that's okay
• Be open to opportunities you didn't expect
• Keep learning and growing
• Build transferable skills that work anywhere`,
            keyPoints: [
              "Self-awareness is the foundation of career planning",
              "Have a plan but stay flexible",
              "Invest in skills that transfer across careers",
              "Relationships matter more than you think"
            ]
          }
        ]
      },
      14: {
        title: "Entrepreneurship Workshop Project",
        sections: [
          {
            title: "Developing Your Business Idea",
            type: "interactive",
            duration: "8 min",
            content: `Time to get practical. Let's develop YOUR business idea:

**Finding your idea:**
• What problems do you see that need solving?
• What do people ask you for help with?
• What would you create if money didn't matter?
• What skills do you have that others need?

**Validating your idea:**
• Talk to potential customers (at least 10 people)
• Would they actually PAY for this?
• How much would they pay?
• What would make them say no?

**Creating your value proposition:**
• Who is your target customer?
• What problem do you solve for them?
• How are you different from alternatives?
• Why should they choose you?

**MVP (Minimum Viable Product):**
• What's the simplest version you can create?
• How can you test with minimal investment?
• What feedback do you need?`,
            keyPoints: [
              "Ideas are worthless without execution",
              "Talk to potential customers before building anything",
              "Start with the simplest version possible",
              "Get feedback early and often"
            ]
          },
          {
            title: "Building Your Business Plan",
            type: "reading",
            duration: "7 min",
            content: `A simple business plan keeps you focused:

**Key components:**
• Executive summary: What's your business in 2 sentences?
• Problem: What problem are you solving?
• Solution: How do you solve it?
• Target market: Who are your customers?
• Revenue model: How will you make money?
• Marketing: How will people find you?
• Financials: What will it cost? What will you earn?

**Keep it simple:**
• You don't need a 50-page document
• Focus on assumptions you need to test
• Update as you learn

**Funding options:**
• Bootstrapping (your own money)
• Friends and family
• Competitions and grants
• Crowdfunding
• Angel investors (later stage)`,
            keyPoints: [
              "A business plan is a living document",
              "Focus on the key assumptions first",
              "Start small - you don't need huge funding",
              "Your plan will change as you learn"
            ]
          }
        ]
      },
      15: {
        title: "Community Showcase",
        sections: [
          {
            title: "Preparing Your Presentation",
            type: "reading",
            duration: "6 min",
            content: `Time to show off what you've built! Here's how to present like a pro:

**Know your audience:**
• Who will be watching?
• What do they care about?
• What questions will they have?

**Structure your pitch:**
• Hook: Grab attention in 10 seconds
• Problem: What issue are you solving?
• Solution: How does your idea solve it?
• Traction: What have you accomplished?
• Ask: What do you need? (feedback, support, connections)

**Storytelling matters:**
• Use real examples and stories
• Make it personal - why do YOU care?
• Show, don't just tell
• Keep it simple and clear

**Practice:**
• Practice out loud, not just in your head
• Time yourself
• Get feedback and adjust
• Prepare for tough questions`,
            keyPoints: [
              "Know your audience and what they care about",
              "Lead with the problem, not the solution",
              "Stories are more memorable than facts",
              "Practice until you're confident, not just prepared"
            ]
          },
          {
            title: "Giving and Receiving Feedback",
            type: "interactive",
            duration: "5 min",
            content: `Feedback is how you get better. Here's how to handle it:

**Giving good feedback:**
• Be specific, not vague
• Focus on the work, not the person
• Offer suggestions, not just criticism
• Balance positive and constructive

**Receiving feedback:**
• Listen without getting defensive
• Ask clarifying questions
• Thank the person for their input
• Decide what to act on (you don't have to take everything)

**After the showcase:**
• Follow up with people who showed interest
• Implement the best feedback
• Keep building relationships
• Celebrate your progress!`,
            keyPoints: [
              "Feedback is a gift - receive it graciously",
              "You don't have to act on every piece of feedback",
              "Follow up with connections made at the showcase",
              "This is just the beginning of your journey"
            ]
          }
        ]
      },
      16: {
        title: "Financial Wellness & Future Planning",
        sections: [
          {
            title: "Long-Term Financial Planning",
            type: "reading",
            duration: "7 min",
            content: `Now that you've got the basics down, let's talk about planning your financial future beyond just next month or next year. We're talking 5, 10, 20 years out.

**Why plan long-term?**
• Your future self will thank you
• Small actions now = huge results later (compound interest baby!)
• You'll avoid scrambling when big life events happen
• Financial stress kills dreams - planning reduces stress

**Key milestones to plan for:**
• **Age 18-25:** Build emergency fund, establish credit, start investing
• **Age 25-35:** Save for big purchases (house, car), retirement contributions, career growth
• **Age 35-45:** College savings for kids, increase retirement savings, build wealth
• **Age 45-55:** Max out retirement contributions, pay off major debts
• **Age 55+:** Plan retirement lifestyle, healthcare planning, legacy planning

**Setting up your financial roadmap:**
1. **Define your goals** - What do you actually want? House? Business? Travel?
2. **Attach numbers and dates** - "Save $50,000 for house down payment by age 28"
3. **Break it down** - $50k in 10 years = $417/month
4. **Automate it** - Set up automatic transfers so you don't forget
5. **Review quarterly** - Life changes, your plan should too`,
            keyPoints: [
              "Think in decades, not just months",
              "Break big goals into small monthly actions",
              "Automate your savings and investments",
              "Review and adjust your plan regularly"
            ]
          },
          {
            title: "Advanced Investing Strategies",
            type: "video",
            duration: "8 min",
            content: `You know the basics of investing. Now let's level up your game.

**Investment vehicles beyond the basics:**
• **Index Funds** - Buy the whole market, super low risk, great for long-term
• **ETFs** - Like index funds but trade like stocks
• **Real Estate** - Rental properties, REITs, house hacking
• **Bonds** - Lower risk than stocks, good for balancing your portfolio
• **Retirement Accounts** - 401k, Roth IRA, Traditional IRA (maximize these!)

**The magic of tax-advantaged accounts:**
• **Roth IRA** - Pay taxes now, grow tax-free forever. Max is $6,500/year
• **401k** - Employer match is FREE MONEY. Always take it.
• **HSA** - Triple tax advantage for healthcare expenses

**Asset allocation by age:**
• **Teens-20s:** 90% stocks, 10% bonds (you have time to recover from dips)
• **30s:** 80% stocks, 20% bonds
• **40s:** 70% stocks, 30% bonds
• **50s+:** Gradually shift more to bonds for stability

**Dollar cost averaging:**
Instead of trying to "time the market" (which nobody can do consistently), just invest the same amount every month. Market up? You buy. Market down? You buy. Over time, you smooth out the ups and downs.`,
            keyPoints: [
              "Maximize tax-advantaged accounts first (401k, Roth IRA)",
              "Dollar cost averaging beats trying to time the market",
              "Diversify across different assets and industries",
              "Rebalance your portfolio at least yearly"
            ]
          },
          {
            title: "Building Multiple Income Streams",
            type: "interactive",
            duration: "9 min",
            content: `Real wealth comes from having money work for you in multiple ways. Here's how to build multiple income streams:

**Income Stream Categories:**
1. **Active Income** - Trade time for money (your job)
2. **Portfolio Income** - Stocks, dividends, capital gains
3. **Passive Income** - Money that comes in without active work

**Realistic passive income ideas:**
• **Rental property** - Buy a house, rent it out. Cashflow every month
• **Dividend stocks** - Companies pay you just for owning their stock
• **Create digital products** - Courses, ebooks, templates you make once and sell forever
• **YouTube/Content creation** - Build once, earn from ads forever
• **Affiliate marketing** - Promote products, earn commission on sales

**How to start building:**
1. **Master your primary income** - Get raises, promotions, skills
2. **Start investing** - Begin with index funds, build over time
3. **Pick ONE side income** - Don't try everything at once
4. **Build it to $500/month** - Prove the concept works
5. **Scale or add another** - Once one works, optimize or add more

**The goal:**
Have 3-5 income streams so if one fails, you're not broke. Financial security comes from diversification.`,
            keyPoints: [
              "Start with active income, transition to passive",
              "Build one stream to $500/month before adding more",
              "Passive income requires active work upfront",
              "Aim for 3-5 diverse income streams long-term"
            ]
          }
        ]
      },
      17: {
        title: "Life Skills & Financial Independence",
        sections: [
          {
            title: "Achieving True Financial Independence",
            type: "reading",
            duration: "6 min",
            content: `Financial independence doesn't mean you're rich. It means you have enough passive income to cover your expenses without HAVING to work. That's the dream, right?

**What is FI (Financial Independence)?**
When your assets generate enough income to cover your living expenses. Example: If your expenses are $3,000/month and your investments generate $3,000/month, you're financially independent.

**The FI formula:**
Annual Expenses x 25 = Your FI Number
If you need $36,000/year to live, your FI number is $900,000. Once you have that invested, you can safely withdraw 4% per year forever.

**Levels of Financial Independence:**
• **Coast FI** - You've saved enough that it'll grow to FI by retirement without adding more
• **Lean FI** - You're FI but living on a tight budget
• **FI** - You can cover your normal lifestyle without working
• **Fat FI** - You can live comfortably with extra cushion

**Real talk:** Most people won't fully retire at 30. But having the OPTION to? That's freedom. Financial independence gives you choices.`,
            keyPoints: [
              "FI = Passive income covers all expenses",
              "Your FI number = Annual expenses x 25",
              "Multiple paths to FI - pick what works for you",
              "FI gives you freedom to choose, not just to retire"
            ]
          },
          {
            title: "Essential Life Skills for Success",
            type: "video",
            duration: "8 min",
            content: `Money is important, but these life skills will multiply your success:

**Communication Skills:**
• **Active listening** - Actually hear what people say, don't just wait to talk
• **Clear writing** - Emails, texts, proposals - write clearly and concisely
• **Public speaking** - Practice until it's not scary
• **Difficult conversations** - Don't avoid them, learn to handle them well

**Time Management:**
• **Prioritization** - Do the most important things first
• **Calendar blocking** - Schedule your priorities or they won't happen
• **Saying no** - Protect your time like you protect your money
• **Deep work** - Block out distractions for focused work sessions

**Emotional Intelligence:**
• **Self-awareness** - Know your triggers, strengths, and weaknesses
• **Self-regulation** - Control your reactions
• **Empathy** - Understand others' perspectives
• **Social skills** - Build and maintain relationships

**Resilience:**
• **Embrace failure** - It's data, not defeat
• **Manage stress** - Exercise, meditation, whatever works for you
• **Build support systems** - Friends, mentors, community
• **Maintain perspective** - Most things aren't as bad as they seem`,
            keyPoints: [
              "Communication and emotional intelligence matter as much as money skills",
              "Time management = life management",
              "Continuous learning is non-negotiable",
              "Resilience is a skill you can develop"
            ]
          },
          {
            title: "Your Next Steps & Lifelong Growth",
            type: "interactive",
            duration: "7 min",
            content: `You've almost completed the program and learned so much. Here's how to keep growing:

**Immediate next steps (this week):**
1. **Set 3 financial goals** - 1 short-term (3 months), 1 medium (1 year), 1 long-term (5 years)
2. **Automate one thing** - Savings transfer, bill payment, investment contribution
3. **Review your budget** - Is it realistic? Adjust as needed
4. **Check your credit score** - Know where you stand
5. **Share what you learned** - Teach someone else, it reinforces your knowledge

**Monthly money habits to maintain:**
• Review spending and budget
• Check progress on goals
• Contribute to savings/investments
• Read one finance article or book chapter
• Optimize one expense

**Resources to keep learning:**
• **Books:** "I Will Teach You to Be Rich," "The Simple Path to Wealth," "Rich Dad Poor Dad"
• **Podcasts:** "ChooseFI," "BiggerPockets Money," "Afford Anything"
• **Communities:** r/personalfinance, r/financialindependence

**You're ready:**
You have the knowledge. You have the tools. Now you just need to execute. Start small, stay consistent, and watch your future self thank you.`,
            keyPoints: [
              "Set clear short, medium, and long-term goals",
              "Maintain monthly, quarterly, and annual money habits",
              "Never stop learning about personal finance",
              "Teach others what you've learned - it reinforces your knowledge"
            ]
          }
        ]
      },
      18: {
        title: "Graduation & Certification",
        sections: [
          {
            title: "Reflecting on Your Journey",
            type: "reading",
            duration: "5 min",
            content: `You made it! Let's look back at everything you've accomplished:

**What you've learned:**
• How to manage income, expenses, and savings
• The power of compound interest and investing
• Credit building and avoiding debt traps
• Banking basics and budgeting
• Personal branding and professionalism
• Resume building and job applications
• Networking and relationship building
• Entrepreneurship fundamentals

**Skills you've developed:**
• Financial literacy and money management
• Goal setting and planning
• Professional communication
• Leadership and teamwork
• Problem-solving and critical thinking

**You're now equipped to:**
• Make smart financial decisions
• Build wealth over time
• Navigate the professional world
• Create your own opportunities`,
            keyPoints: [
              "Look how far you've come!",
              "These skills will serve you for life",
              "Financial literacy is just the beginning",
              "Keep learning and growing"
            ]
          },
          {
            title: "Your Next Steps",
            type: "interactive",
            duration: "6 min",
            content: `Graduation is just the beginning. Here's what's next:

**Immediate actions:**
• Open a savings account if you haven't
• Set up automatic savings (even $20/month)
• Review and update your budget
• Update your LinkedIn profile

**30-day goals:**
• Build an emergency fund (start with $500)
• Apply for a student credit card
• Reach out to 5 people for networking
• Set a specific financial goal

**Long-term vision:**
• Where do you see yourself in 5 years?
• What financial milestones do you want to hit?
• How will you continue learning?
• How will you help others on their journey?

**Remember:**
• Progress over perfection
• Consistency beats intensity
• Community matters - find your people
• You've got this!`,
            keyPoints: [
              "Take action within 24 hours of finishing",
              "Small consistent actions beat big occasional ones",
              "Share what you've learned with others",
              "Your financial journey is just beginning"
            ]
          },
          {
            title: "Certification Complete",
            type: "video",
            duration: "3 min",
            content: `Congratulations! You've completed the Beyond The Game Financial Literacy Program!

**Your certification means you:**
• Understand fundamental financial concepts
• Can create and manage a budget
• Know how to build credit responsibly
• Have professional skills for the workplace
• Understand entrepreneurship basics

**What comes with your certification:**
• Digital badge for LinkedIn
• Certificate of completion
• Access to alumni network
• Continued access to course materials

**Stay connected:**
• Join our alumni community
• Share your success stories
• Mentor future students
• Keep building on what you've learned

You put in the work. You learned the material. You're ready for whatever comes next. Go out there and build your legacy!`,
            keyPoints: [
              "You've earned this certification",
              "Add it to your LinkedIn profile",
              "Stay connected with the community",
              "This is just the beginning of your journey"
            ]
          }
        ]
      }
    };

    return lessonMap[week] || {
      title: "Lesson Coming Soon",
      sections: [
        {
          title: "Content Under Development",
          type: "reading",
          duration: "1 min",
          content: "This lesson is currently being developed. Check back soon for comprehensive content covering this important topic.",
          keyPoints: ["Lesson content coming soon"]
        }
      ]
    };
  };

  // College-specific lesson content (16 weeks)
  const getCollegeLessonContent = (week: number) => {
    const collegeLessonMap: Record<number, any> = {
      1: {
        title: "Student Loans Mastery",
        sections: [
          {
            title: "Understanding Federal vs Private Loans",
            type: "reading",
            duration: "6 min",
            content: `Let's talk about the money that's funding your education. Student loans come in two main flavors, and understanding the difference could save you thousands.

**FEDERAL STUDENT LOANS:**
These come from the government and are almost always your better option:
• **Direct Subsidized Loans** - The government pays interest while you're in school (need-based)
• **Direct Unsubsidized Loans** - Interest accrues from day one, but still decent rates
• **PLUS Loans** - For graduate students or parents (higher rates)

**PRIVATE STUDENT LOANS:**
These come from banks, credit unions, or online lenders:
• Interest rates vary widely (often higher than federal)
• Usually require a co-signer if you have no credit
• Fewer repayment options and protections
• No income-driven repayment plans

**The Golden Rule:** Always max out federal loans before considering private loans. Federal loans have income-driven repayment, potential forgiveness programs, and deferment options that private loans simply don't offer.`,
            keyPoints: [
              "Federal loans have better protections and lower rates",
              "Subsidized loans don't accrue interest in school",
              "Private loans should be your last resort",
              "Always complete FAFSA to see federal options first"
            ]
          },
          {
            title: "Interest Rates and How They Work",
            type: "reading",
            duration: "5 min",
            content: `Interest is the cost of borrowing money, and understanding it is crucial for managing your loans.

**HOW STUDENT LOAN INTEREST WORKS:**

Let's say you borrow $10,000 at 5% interest:
• Annual interest = $10,000 × 5% = $500
• Daily interest = $500 ÷ 365 = about $1.37 per day

**CAPITALIZATION - THE SNEAKY COST:**
When you're not making payments (like during school), unpaid interest can "capitalize" - meaning it gets added to your principal balance. Now you're paying interest on interest.

Example: $10,000 loan, 5% rate, 4 years of school
• Interest accrued: ~$2,000
• New balance after capitalization: $12,000
• You now pay interest on $12,000, not $10,000

**PRO TIP:** Even paying $25-50/month toward interest while in school can save you hundreds or thousands over the life of your loan.`,
            keyPoints: [
              "Interest accrues daily on most student loans",
              "Capitalization adds unpaid interest to your principal",
              "Small payments in school can save thousands later",
              "Federal subsidized loans don't accrue interest during school"
            ]
          },
          {
            title: "Repayment Plans Explained",
            type: "video",
            duration: "7 min",
            content: `After graduation, you'll need to choose how to repay your federal loans. Here are your options:

**STANDARD REPAYMENT:**
• Fixed payments over 10 years
• Highest monthly payment, lowest total cost
• Best if you can afford it

**GRADUATED REPAYMENT:**
• Starts low, increases every 2 years
• Still 10-year term
• Good if you expect rising income

**EXTENDED REPAYMENT:**
• Stretch payments over 25 years
• Lower monthly payments, more interest paid

**INCOME-DRIVEN PLANS (MOST POPULAR):**
• **IBR (Income-Based Repayment)** - 10-15% of discretionary income
• **PAYE (Pay As You Earn)** - 10% of discretionary income
• **SAVE (Saving on a Valuable Education)** - Newest plan, often lowest payments
• **ICR (Income-Contingent)** - 20% of discretionary income

**FORGIVENESS POTENTIAL:**
After 20-25 years of income-driven payments, remaining balance may be forgiven (though potentially taxable).
Public Service Loan Forgiveness (PSLF): Work for government/nonprofit for 10 years, remaining balance forgiven tax-free.`,
            keyPoints: [
              "Standard 10-year plan costs least in total interest",
              "Income-driven plans base payments on what you earn",
              "PSLF can forgive loans after 10 years of public service",
              "You can change repayment plans anytime"
            ]
          },
          {
            title: "Your Loan Management Strategy",
            type: "interactive",
            duration: "8 min",
            content: `Let's create your personal loan management plan:

**STEP 1: KNOW YOUR NUMBERS**
Log into StudentAid.gov and document:
• Total federal loan balance
• Interest rate on each loan
• Servicer for each loan
• Expected monthly payment

**STEP 2: GRACE PERIOD GAME PLAN**
You have 6 months after graduation before payments start. Use this time wisely:
• Research repayment plans
• Set up auto-pay (often gets you 0.25% rate reduction)
• Consider making interest-only payments

**STEP 3: PRIORITIZE STRATEGICALLY**
• Pay minimums on all loans
• Put extra money toward highest interest rate first (avalanche method)
• OR pay smallest balance first for motivation (snowball method)

**STEP 4: REFINANCING CONSIDERATION**
After establishing income and credit:
• Private refinancing can lower rates
• BUT you lose federal protections (income-driven plans, forgiveness)
• Only refinance if you're sure you won't need those protections

**EMERGENCY PLAN:**
If you can't pay, contact your servicer immediately. Options include deferment, forbearance, or switching plans. Never just stop paying.`,
            keyPoints: [
              "Know exactly what you owe and to whom",
              "Use your grace period to prepare, not ignore loans",
              "Auto-pay often reduces your interest rate",
              "Contact servicer immediately if you can't pay"
            ]
          }
        ]
      },
      2: {
        title: "Credit Building Fundamentals",
        sections: [
          {
            title: "Your Credit Score Decoded",
            type: "reading",
            duration: "6 min",
            content: `Your credit score is a three-digit number that affects everything from apartment applications to car insurance rates. Here's exactly how it works:

**THE FICO SCORE BREAKDOWN:**

• **Payment History (35%)** - Do you pay on time? This is HUGE.
• **Credit Utilization (30%)** - How much of your available credit are you using?
• **Length of Credit History (15%)** - How long have you had credit?
• **Credit Mix (10%)** - Do you have different types of credit?
• **New Credit (10%)** - Have you opened many accounts recently?

**SCORE RANGES:**
• 800-850: Exceptional
• 740-799: Very Good
• 670-739: Good
• 580-669: Fair
• Below 580: Poor

**AS A COLLEGE STUDENT:**
You're starting from scratch, which is actually better than having bad credit. A "thin file" (little credit history) is easier to build than a damaged one is to repair.

**WHERE TO CHECK YOUR SCORE:**
• AnnualCreditReport.com - Free credit reports (not scores)
• Credit Karma, Credit Sesame - Free score estimates
• Many banks now offer free FICO scores
• Never pay for your credit score`,
            keyPoints: [
              "Payment history is 35% of your score - always pay on time",
              "Keep credit utilization under 30%, ideally under 10%",
              "Length of history matters - start building early",
              "Check your credit regularly through free services"
            ]
          },
          {
            title: "Your First Credit Card",
            type: "reading",
            duration: "5 min",
            content: `Getting your first credit card is a milestone. Here's how to do it right:

**BEST OPTIONS FOR STUDENTS:**

1. **Secured Credit Cards**
   • You deposit $200-500 as collateral
   • That becomes your credit limit
   • Easiest approval, great for building credit
   • Examples: Discover it Secured, Capital One Platinum Secured

2. **Student Credit Cards**
   • Designed for college students
   • No security deposit needed
   • Lower credit limits ($500-1500)
   • Examples: Discover it Student, Capital One Journey

3. **Authorized User**
   • Get added to a parent's card
   • Their good history can boost your score
   • You get a card but they're responsible

**WHAT TO LOOK FOR:**
• No annual fee (never pay annual fees when starting out)
• Reports to all three credit bureaus
• Rewards are a bonus, not a priority
• Low or no foreign transaction fees if you travel

**APPLICATION TIPS:**
• Only apply for one card at a time
• Each application creates a hard inquiry
• Have income (even part-time job) before applying
• Use your campus address if more stable`,
            keyPoints: [
              "Secured cards are easiest to get approved for",
              "Never pay an annual fee on a starter card",
              "Being an authorized user can jumpstart your credit",
              "Only apply for one card - multiple apps hurt your score"
            ]
          },
          {
            title: "Using Credit Cards Wisely",
            type: "video",
            duration: "6 min",
            content: `A credit card is a tool. Used correctly, it builds your financial future. Used poorly, it creates debt that follows you for years.

**THE GOLDEN RULES:**

1. **Pay Your FULL Balance Every Month**
   • Treat it like a debit card
   • Only charge what you can pay off
   • Carrying a balance costs you interest (15-25% APR is common)

2. **Keep Utilization Low**
   • Use less than 30% of your limit
   • If limit is $1,000, keep balance under $300
   • Ideally, keep it under 10%

3. **Never Miss a Payment**
   • Set up autopay for at least the minimum
   • Late payments stay on your report for 7 years
   • One late payment can drop your score 100+ points

4. **Don't Close Old Cards**
   • Length of history matters
   • Keep your first card open forever (even if you don't use it)
   • Closing cards also increases your utilization ratio

**WHAT NOT TO DO:**
• Don't buy things you can't afford
• Don't pay only the minimum
• Don't max out your card for rewards
• Don't let friends borrow your card`,
            keyPoints: [
              "Pay your full balance every month, not just the minimum",
              "Keep utilization under 30% of your credit limit",
              "One late payment can devastate your score",
              "Never close your first credit card"
            ]
          },
          {
            title: "Building Credit Fast",
            type: "interactive",
            duration: "7 min",
            content: `Ready to build excellent credit quickly? Here's your action plan:

**MONTH 1: FOUNDATION**
• Apply for a secured or student credit card
• Set up autopay for full balance
• Make one small recurring purchase (like Netflix or Spotify)
• Pay it off immediately

**MONTHS 2-6: CONSISTENCY**
• Keep using the card for small, planned purchases
• Pay balance weekly (keeps utilization ultra-low)
• Never miss a payment
• Don't apply for any new credit

**MONTH 6-12: GROWTH**
• Request a credit limit increase (don't use more credit, just have more available)
• Your score should be 650+ by now
• Consider becoming an authorized user on a parent's old card

**YEAR 2: ADVANCEMENT**
• Apply for a second card (cash-back is great)
• Your score should be 700+ with good habits
• Start using cards for bigger purchases, always paying in full

**CREDIT-BUILDING HACKS:**
• Use credit cards for bills you'd pay anyway
• Time your purchases to keep reported balance low
• Experian Boost can add utility/phone payments
• Rent reporting services can help too

**REMEMBER:** Good credit takes time. There's no shortcut, but consistent good behavior gets you there faster than you'd think.`,
            keyPoints: [
              "Start with one card and small recurring purchases",
              "Pay weekly to keep utilization reported as low",
              "Request limit increases after 6 months",
              "Be patient - good credit takes 12-24 months to build"
            ]
          }
        ]
      },
      3: {
        title: "Smart Budgeting for College Life",
        sections: [
          {
            title: "The Real Costs of College",
            type: "reading",
            duration: "5 min",
            content: `Tuition is just the beginning. Let's break down what college really costs:

**THE OBVIOUS COSTS:**
• Tuition and fees
• Room and board
• Books and supplies
• Meal plans

**THE HIDDEN COSTS (where budgets die):**
• Food outside the meal plan
• Uber/Lyft and transportation
• Subscriptions (streaming, Spotify, apps)
• Weekend activities and events
• Clothes and personal items
• Late-night snacks and coffee
• Greek life or club dues
• Formals, trips, and events
• Technology (laptop repairs, phone)

**REALITY CHECK:**
The average college student spends $2,000-3,000 per SEMESTER on discretionary spending. That's $500-750 per month beyond the basics.

**YOUR FIRST STEP:**
Track every dollar for 2 weeks. Use an app or just note it in your phone. You'll be shocked at where money goes.`,
            keyPoints: [
              "Discretionary spending can exceed $500/month",
              "Food outside meal plans is usually the biggest budget leak",
              "Track every purchase for 2 weeks to see reality",
              "Hidden costs often double what you expect to spend"
            ]
          },
          {
            title: "Creating Your College Budget",
            type: "video",
            duration: "6 min",
            content: `Here's a realistic college budget framework:

**STEP 1: CALCULATE YOUR INCOME**
• Financial aid refund (divide by months)
• Part-time job earnings
• Family contributions
• Savings you're willing to spend

**STEP 2: FIXED EXPENSES**
• Phone bill
• Subscriptions
• Insurance
• Any recurring payments

**STEP 3: VARIABLE EXPENSES (where control matters)**
• Food beyond meal plan: $100-200/month
• Entertainment: $50-100/month
• Transportation: $50-100/month
• Personal/shopping: $50-75/month
• Unexpected: $50/month buffer

**SAMPLE BUDGET: $800/month available**
• Fixed expenses: $100
• Food/coffee: $150
• Entertainment: $75
• Transportation: $75
• Personal items: $75
• Savings/emergency: $100
• Buffer for unexpected: $225

**THE KEY:** Review and adjust monthly. Your first budget won't be perfect, and that's okay.`,
            keyPoints: [
              "Include financial aid refunds in your monthly income",
              "Fixed expenses should be as low as possible",
              "Always include a buffer for unexpected costs",
              "Review and adjust your budget monthly"
            ]
          },
          {
            title: "Saving Money in College",
            type: "reading",
            duration: "5 min",
            content: `Being broke in college is optional. Here's how to stretch your money:

**FOOD HACKS:**
• Max out your meal plan swipes - those are paid for
• Bring containers to the dining hall for leftovers (if allowed)
• Learn 5-10 cheap recipes you can make in a dorm/apartment
• Use campus food pantries - no shame, that's what they're for
• Student discounts at restaurants (always ask!)

**TEXTBOOK STRATEGIES:**
• Never buy new textbooks from the campus store
• Check Library Genesis, OpenStax for free versions
• Rent from Chegg, Amazon
• Buy older editions (usually same content)
• Share with classmates

**ENTERTAINMENT ON A BUDGET:**
• Campus events are usually free (and often have free food)
• Student discounts on streaming, Spotify, Amazon Prime
• Free gym access at recreation center
• Library has free movies, games, even board games

**TRANSPORTATION SAVINGS:**
• Campus shuttles are usually free
• Bike instead of Uber for close distances
• Carpool with friends for grocery runs
• Many cities offer student transit discounts

**THE MINDSET SHIFT:**
Rich people got rich by not spending money on things that don't matter. Being frugal in college isn't embarrassing - it's smart.`,
            keyPoints: [
              "Campus resources (events, food pantries, gym) are already paid for",
              "Never buy new textbooks - always find alternatives",
              "Student discounts are everywhere - always ask",
              "Being frugal now builds wealth habits for life"
            ]
          },
          {
            title: "Budget Apps and Tools",
            type: "interactive",
            duration: "5 min",
            content: `Technology makes budgeting easier. Here are the best tools:

**FREE BUDGETING APPS:**

1. **Mint (by Intuit)**
   • Connects to all accounts
   • Automatic categorization
   • Bill reminders
   • Good for passive tracking

2. **YNAB (You Need A Budget)**
   • Free for students (1-year trial)
   • Zero-based budgeting method
   • Best for active budget management
   • Strong community and education

3. **Copilot (iOS) / Monarch (all platforms)**
   • Modern, clean interface
   • Great for couples/roommates
   • More expensive but worth it for some

4. **Spreadsheets**
   • Google Sheets is free
   • Full control and customization
   • Great templates available online

**STUDENT-SPECIFIC TOOLS:**
• UNiDAYS - Student discounts central
• Student Beans - More discounts
• Campus apps - Many have deals/offers

**AUTOMATION TIP:**
• Set up autopay for all bills
• Auto-transfer savings on payday
• Set spending alerts at 80% of budget categories

**YOUR ASSIGNMENT:**
Download one budgeting app today and connect your accounts. Start by just tracking - no judgment. Information is power.`,
            keyPoints: [
              "YNAB is free for students and highly effective",
              "Automate bill payments to never miss due dates",
              "Start with tracking, then add budget limits",
              "Use student discount apps to save on everything"
            ]
          }
        ]
      },
      4: {
        title: "Banking Essentials",
        sections: [
          {
            title: "Choosing the Right Bank Account",
            type: "reading",
            duration: "5 min",
            content: `Your bank account is the foundation of your finances. Here's how to choose wisely:

**CHECKING VS SAVINGS:**
• **Checking**: For daily spending, bill payments, debit card
• **Savings**: For emergency fund and goals, limited transactions

**WHAT TO LOOK FOR:**

**Must-Haves:**
• No monthly maintenance fees (or easy ways to waive them)
• Free ATM network or ATM fee refunds
• Mobile deposit and good app
• No minimum balance requirements

**Nice-to-Haves:**
• Early direct deposit
• Overdraft protection options
• Zelle or instant transfers
• Good customer service

**YOUR OPTIONS:**

1. **Big Banks (Chase, Bank of America, Wells Fargo)**
   • Branches everywhere
   • Often have student accounts with no fees
   • May charge fees after you graduate

2. **Online Banks (Ally, Marcus, Discover)**
   • Higher savings interest rates
   • Usually no fees ever
   • ATM fee refunds common
   • No physical branches

3. **Credit Unions**
   • Lower fees generally
   • Better loan rates
   • Must qualify for membership
   • Community-focused

**STUDENT RECOMMENDATION:**
• Open a student checking at a big bank (free, convenient)
• Open a high-yield savings at an online bank (earn interest)
• Use both strategically`,
            keyPoints: [
              "Never pay monthly maintenance fees - student accounts waive these",
              "Online banks offer higher savings interest rates",
              "Having accounts at two institutions can be strategic",
              "ATM access matters - check the bank's network"
            ]
          },
          {
            title: "Banking Apps and Technology",
            type: "video",
            duration: "5 min",
            content: `Modern banking is mobile-first. Here's what you need to know:

**ESSENTIAL FEATURES TO USE:**

1. **Mobile Check Deposit**
   • Snap a photo of checks
   • Funds usually available next day
   • Keep checks for 30 days, then shred

2. **Instant Transfers**
   • Zelle for person-to-person payments
   • Linked to phone number or email
   • Usually instant and free

3. **Bill Pay**
   • Schedule recurring payments
   • Never miss a due date
   • Some even mail paper checks for you

4. **Alerts and Notifications**
   • Low balance warnings
   • Large transaction alerts
   • Login notifications for security

**PAYMENT APPS:**
• Venmo - Social, great for splitting bills
• Cash App - Also has debit card and stocks
• Apple Pay/Google Pay - Tap to pay with phone
• PayPal - Good for online purchases

**SECURITY MUST-DOs:**
• Enable two-factor authentication
• Use unique, strong passwords
• Don't use public WiFi for banking
• Set up account alerts
• Review transactions weekly`,
            keyPoints: [
              "Set up mobile deposit - it's faster than going to a branch",
              "Use Zelle for free instant transfers",
              "Enable two-factor authentication on all accounts",
              "Set up alerts for large transactions and low balances"
            ]
          },
          {
            title: "Avoiding Fees and Pitfalls",
            type: "reading",
            duration: "5 min",
            content: `Banks make billions from fees. Here's how to pay $0:

**COMMON FEES AND HOW TO AVOID THEM:**

**Overdraft Fees ($35 each!)**
• Set up low balance alerts
• Link savings as backup
• Opt out of overdraft "protection"
• Track your spending closely

**Monthly Maintenance Fees**
• Use student accounts (fee-free)
• Meet minimum balance requirements
• Set up direct deposit
• Switch to online banks

**ATM Fees ($3-5 per transaction)**
• Use your bank's ATM network
• Get cash back at stores
• Use online banks that refund ATM fees
• Plan cash withdrawals ahead

**Wire Transfer Fees**
• Use Zelle or ACH instead (free)
• Only wire when absolutely necessary

**Foreign Transaction Fees**
• Get a no-FTF debit card before traveling
• Many student cards have no FTF

**THE $500+ PROBLEM:**
Average American pays $500+ per year in bank fees. That's money that could be in YOUR pocket. Being aware is 90% of the solution.`,
            keyPoints: [
              "Overdraft fees are the biggest trap - opt out of overdraft",
              "Set up alerts to prevent low balance surprises",
              "Use Zelle/ACH instead of wire transfers",
              "The average person wastes $500/year on avoidable fees"
            ]
          },
          {
            title: "Building Your Banking System",
            type: "interactive",
            duration: "6 min",
            content: `Let's set up your optimal banking system:

**THE MULTI-ACCOUNT STRATEGY:**

**Account 1: Primary Checking**
• Where paychecks go
• Pay bills from here
• Keep 1 month of expenses as buffer

**Account 2: High-Yield Savings**
• Emergency fund goes here
• Earning 4-5% interest
• Separate bank makes it harder to spend

**Account 3: Goals Savings**
• For specific goals (travel, car, etc.)
• Some banks let you create "buckets"
• Automate transfers on payday

**AUTOMATION SETUP:**

Day 1 of paycheck:
• 10-20% auto-transfers to savings
• Bill pay sends fixed expenses
• What's left is your spending money

**WEEKLY HABITS:**
• Check accounts every Sunday
• Categorize transactions
• Review upcoming bills
• Adjust if needed

**MONTHLY HABITS:**
• Review all subscriptions
• Check for unexpected fees
• Assess progress toward goals
• Adjust budget if needed

**YOUR ACTION STEPS:**
1. Open a high-yield savings (5 minutes online)
2. Set up automatic transfers
3. Download your banks' apps
4. Set up all security features`,
            keyPoints: [
              "Multiple accounts help organize money by purpose",
              "Automate savings on payday so it happens first",
              "Review accounts weekly to catch issues early",
              "Keep emergency fund in separate bank to avoid temptation"
            ]
          }
        ]
      },
      5: {
        title: "Taxes & Financial Aid",
        sections: [
          {
            title: "Student Tax Basics",
            type: "reading",
            duration: "6 min",
            content: `Taxes aren't as scary as they seem. Here's what college students need to know:

**DO YOU NEED TO FILE?**
If you earned income, probably yes. For 2024:
• Self-employed: File if you earned $400+
• Employed: File if you earned $13,850+ (or any tax was withheld)
• Even if you don't have to, you might want to (to get refunds!)

**FORMS YOU'LL SEE:**

**W-2** - From your employer
• Shows wages earned and taxes withheld
• You'll get this by January 31

**1099-NEC** - For freelance/gig work
• Shows payments over $600
• You owe self-employment tax on this

**1098-T** - From your school
• Shows tuition paid
• Used for education credits
• Your parents might need this

**1098-E** - Student loan interest
• Shows interest paid on loans
• Can deduct up to $2,500

**STANDARD DEDUCTION:**
Most students take the standard deduction ($13,850 for 2024). This means you don't owe tax on your first $13,850 of income.`,
            keyPoints: [
              "File taxes if you had any tax withheld - you might get it back",
              "Keep all tax forms you receive (W-2, 1099, 1098)",
              "Standard deduction means first $13,850 is tax-free",
              "Self-employment income has extra taxes - plan for it"
            ]
          },
          {
            title: "Education Tax Benefits",
            type: "video",
            duration: "6 min",
            content: `Education comes with significant tax benefits. Here's how to claim them:

**AMERICAN OPPORTUNITY TAX CREDIT (AOTC)**
• Worth up to $2,500 per year
• First 4 years of college only
• 40% is refundable (get money even if you owe no tax)
• Covers tuition, fees, books, supplies
• Income limits apply (usually parents claim this)

**LIFETIME LEARNING CREDIT**
• Worth up to $2,000 per year
• Any year of college or grad school
• Not refundable
• Good backup if AOTC doesn't apply

**STUDENT LOAN INTEREST DEDUCTION**
• Deduct up to $2,500 of interest paid
• Available even if you don't itemize
• Income limits apply
• You can claim this yourself

**529 PLAN WITHDRAWALS**
• Tax-free when used for education
• Can cover tuition, room, board, books
• Leftover funds can be rolled to Roth IRA (new rule!)

**WHO CLAIMS WHAT:**
If your parents claim you as a dependent:
• They claim education credits
• You can still claim student loan interest deduction
• Coordinate with them at tax time`,
            keyPoints: [
              "AOTC can get you up to $2,500 back per year",
              "Student loan interest deduction saves money on taxes",
              "Coordinate with parents on who claims what",
              "529 withdrawals are tax-free for qualified expenses"
            ]
          },
          {
            title: "FAFSA Mastery",
            type: "reading",
            duration: "5 min",
            content: `The Free Application for Federal Student Aid (FAFSA) is your key to financial aid. Here's how to maximize it:

**WHEN TO FILE:**
• Opens October 1 each year
• File as early as possible
• Some aid is first-come, first-served
• State deadlines vary (check yours!)

**WHAT YOU'LL NEED:**
• Your FSA ID (create at StudentAid.gov)
• Social Security number
• Tax returns (yours and parents')
• Bank statements
• Investment records

**TIPS TO MAXIMIZE AID:**

1. **Report Assets Correctly**
   • Retirement accounts don't count
   • Money in parent's name counts less than yours
   • 529 plans count as parent assets

2. **Timing Matters**
   • Report assets as of date you file
   • Large cash gifts should come after filing
   • Don't deposit money right before filing

3. **Special Circumstances**
   • Job loss, medical expenses, divorce
   • Request a "professional judgment" appeal
   • Explain circumstances in writing

**YOUR SAI (Student Aid Index):**
This number determines your aid. Lower = more need-based aid. The formula considers income, assets, family size, and number in college.`,
            keyPoints: [
              "File FAFSA as early as possible after October 1",
              "Create your FSA ID before you need it",
              "Report assets as of the day you file",
              "Appeal if special circumstances affect your finances"
            ]
          },
          {
            title: "Filing Your Tax Return",
            type: "interactive",
            duration: "6 min",
            content: `Ready to file? Here's your step-by-step guide:

**FREE FILING OPTIONS:**

1. **IRS Free File**
   • Free if income under $79,000
   • Uses major tax software
   • Go through IRS.gov to access

2. **Cash App Taxes (formerly Credit Karma)**
   • Totally free, any income
   • Good for simple returns
   • Handles most student situations

3. **VITA (Volunteer Income Tax Assistance)**
   • Free in-person help
   • Often on college campuses
   • Great for complex situations

**STEP-BY-STEP:**

1. **Gather Documents**
   • All W-2s and 1099s
   • 1098-T from school
   • 1098-E for loan interest
   • Last year's return

2. **Choose Your Method**
   • Free software for simple returns
   • VITA if you need help
   • Parent's accountant if they claim you

3. **Answer Questions Carefully**
   • Are you a dependent?
   • Full-time student?
   • Any education expenses?

4. **Review Before Filing**
   • Check Social Security number
   • Verify bank account for refund
   • Don't rush through

5. **Save Everything**
   • Keep copies of returns
   • Save receipts and documents
   • You might need them for 7 years

**REFUND TIMING:**
E-file + direct deposit = fastest (often 2-3 weeks)
Paper filing = slowest (2+ months)`,
            keyPoints: [
              "Free filing options exist for most students",
              "E-file with direct deposit for fastest refund",
              "Save copies of everything for at least 7 years",
              "Coordinate with parents if they claim you as dependent"
            ]
          }
        ]
      },
      6: {
        title: "Maximizing Your Income",
        sections: [
          {
            title: "Part-Time Jobs That Build Skills",
            type: "reading",
            duration: "5 min",
            content: `Not all jobs are equal. Some pay bills; others launch careers. Here's how to choose wisely:

**HIGH-VALUE CAMPUS JOBS:**

• **Research Assistant** - Get paid to learn, build professor relationships
• **Teaching Assistant** - Great for grad school applications
• **IT Help Desk** - Tech skills, flexible hours
• **Library** - Quiet, often allows studying during slow times
• **Admissions/Alumni Office** - Networking, communication skills
• **Rec Center** - Fitness, CPR certification

**JOBS THAT BUILD CAREER SKILLS:**

• **Internships (paid)** - Industry experience, connections
• **Tutoring** - Communication, patience, expertise demonstration
• **Campus Media** - Writing, video, social media skills
• **Student Government** - Leadership, budgeting, politics

**FLEXIBILITY MATTERS:**
Look for jobs that:
• Understand exam schedules
• Offer flexible hours
• Allow shift swaps
• Won't schedule during classes

**PAY VS. EXPERIENCE:**
Early in college: Prioritize flexibility and experience
Later in college: Prioritize pay and career relevance

**WORK-STUDY:**
If you have federal work-study:
• Guaranteed job funding
• Often more flexible
• Doesn't affect financial aid
• Use it or lose it each year`,
            keyPoints: [
              "Research and TA positions build academic credentials",
              "Some jobs let you study during slow periods",
              "Work-study doesn't affect your financial aid",
              "Career-relevant jobs matter more than high hourly rates"
            ]
          },
          {
            title: "Side Hustles for Students",
            type: "video",
            duration: "6 min",
            content: `Want more income without a traditional job? Here are proven side hustles:

**LOW-BARRIER HUSTLES:**

• **Tutoring** - $20-50/hour for subjects you know
• **Food Delivery** - Flexible, instant pay (DoorDash, UberEats)
• **Reselling** - Thrift stores to eBay/Poshmark
• **Task Apps** - TaskRabbit, Fiverr for odd jobs
• **Surveys/Studies** - Campus research studies often pay $15-50

**SKILL-BASED HUSTLES:**

• **Freelance Writing** - Content mills pay $10-50 per article
• **Graphic Design** - Logos, social media graphics on Fiverr
• **Web Development** - Small business sites for $500-2000
• **Photography** - Events, headshots, product photos
• **Video Editing** - YouTube, TikTok content creation

**PASSIVE-ISH INCOME:**

• **Sell Notes** - StudySoup, Stuvia
• **Print on Demand** - Design t-shirts (Printful, Redbubble)
• **Content Creation** - YouTube, TikTok, Substack
• **Referral Programs** - Bank bonuses, app referrals

**REALITY CHECK:**
• Side hustles take time to build
• Don't sacrifice grades for extra income
• Track all income for taxes
• Self-employment has extra tax (15.3%)`,
            keyPoints: [
              "Tutoring is high-paying and flexible for students",
              "Track all side hustle income for taxes",
              "Don't sacrifice academics for extra income",
              "Skills-based hustles pay more but take time to build"
            ]
          },
          {
            title: "Internships and Career Income",
            type: "reading",
            duration: "5 min",
            content: `Internships are the bridge between college and career. Here's how to land them:

**WHEN TO START:**
• Freshman/Sophomore: Explore, any experience counts
• Junior: Target your industry seriously
• Senior: Full-time recruiting, less interning

**WHERE TO FIND THEM:**
• Handshake (your campus job board)
• LinkedIn
• Company websites directly
• Career fairs (actually valuable!)
• Professor and alumni connections

**WHAT INTERNSHIPS PAY:**
• Tech: $30-50/hour (some over $10k/month)
• Finance: $20-40/hour
• Marketing/Communications: $15-25/hour
• Nonprofits: Often unpaid (but valuable)
• Government: Varies, some competitive pay

**NEGOTIATING INTERNSHIP PAY:**
• Research market rates (Glassdoor, Levels.fyi)
• Highlight relevant experience
• Ask politely: "Is there flexibility in the compensation?"
• Benefits matter: Housing stipend, relocation, training

**CONVERTING TO FULL-TIME:**
• 70%+ of interns get full-time offers
• Treat it like a long job interview
• Network with everyone, not just your team
• Ask for feedback regularly
• Express interest in returning`,
            keyPoints: [
              "Start looking for internships sophomore year",
              "Tech and finance internships pay exceptionally well",
              "Most internships lead to full-time job offers",
              "Networking during internships is as important as the work"
            ]
          },
          {
            title: "Building Multiple Income Streams",
            type: "interactive",
            duration: "6 min",
            content: `Wealthy people have multiple income streams. Start building yours now:

**THE STUDENT INCOME PORTFOLIO:**

**Stream 1: Primary Job/Work-Study**
• Stable, predictable income
• 10-15 hours/week max during classes

**Stream 2: Side Hustle**
• Flexible, variable income
• 5-10 hours/week
• Build skills and extra cash

**Stream 3: Summer Internship**
• Biggest earning period
• Full-time focus
• Build career and savings

**Stream 4: Passive Income (Building)**
• Takes time to develop
• Could be content, investments, etc.
• Plant seeds now, harvest later

**MANAGING MULTIPLE INCOMES:**

Tax Planning:
• Set aside 25-30% of side hustle income
• Track all income sources
• Keep receipts for business expenses

Time Management:
• Academics FIRST, always
• Block time for each income stream
• Don't overcommit

Goal Setting:
• Monthly income targets
• Savings goals from each source
• Skills to develop per stream

**ACTION PLAN:**
1. Secure one stable income source
2. Add one flexible side income
3. Plan for summer internship
4. Explore passive income options
5. Track everything in a spreadsheet`,
            keyPoints: [
              "Multiple income streams provide security and growth",
              "Never sacrifice academics for income",
              "Summer is your highest earning potential",
              "Start building passive income early, even if small"
            ]
          }
        ]
      },
      7: {
        title: "Debt Management Strategies",
        sections: [
          {
            title: "Understanding Your Debt",
            type: "reading",
            duration: "5 min",
            content: `Before you can manage debt, you need to understand it completely.

**TYPES OF DEBT YOU MIGHT HAVE:**

**Student Loans**
• Federal: Lower rates, more protections
• Private: Higher rates, fewer options
• Accrues interest, payments start after graduation

**Credit Card Debt**
• Highest interest rates (15-25% APR)
• Minimum payments are a trap
• Should be paid in full monthly

**Car Loans**
• Fixed payments
• Asset can be repossessed
• Often underwater (owe more than value)

**GOOD DEBT VS. BAD DEBT:**

Good debt (potentially):
• Student loans (if degree leads to income)
• Mortgage (builds equity)
• Business loans (for profitable ventures)

Bad debt (almost always):
• Credit card balances
• Payday loans
• High-interest personal loans
• Financing for depreciating items

**KNOW YOUR NUMBERS:**
Create a debt inventory:
• Lender name
• Balance owed
• Interest rate
• Minimum payment
• Payoff date

This clarity is the foundation of your debt strategy.`,
            keyPoints: [
              "Know exactly what you owe, to whom, and at what rate",
              "Credit card debt is almost always bad debt",
              "Student loans can be good debt if degree pays off",
              "Create a complete debt inventory to start"
            ]
          },
          {
            title: "Debt Payoff Strategies",
            type: "video",
            duration: "6 min",
            content: `Ready to attack your debt? Here are the two proven methods:

**AVALANCHE METHOD (Mathematically Optimal)**

1. List all debts by interest rate (highest first)
2. Pay minimums on everything
3. Put all extra money toward highest rate debt
4. Once paid, roll that payment to next highest
5. Repeat until debt-free

Example:
• Credit Card: 22% APR - attack first
• Car Loan: 7% APR - second
• Student Loans: 5% APR - last

Pros: Saves the most money on interest
Cons: Might take longer to see progress

**SNOWBALL METHOD (Psychologically Optimal)**

1. List all debts by balance (smallest first)
2. Pay minimums on everything
3. Put all extra money toward smallest balance
4. Once paid, roll that payment to next smallest
5. Repeat until debt-free

Example:
• Store Card: $200 balance - first
• Credit Card: $2,000 balance - second
• Car Loan: $10,000 balance - last

Pros: Quick wins build motivation
Cons: May pay more interest overall

**WHICH TO CHOOSE?**
• Avalanche: If you're disciplined and motivated by math
• Snowball: If you need quick wins to stay motivated
• Either works if you stick with it!`,
            keyPoints: [
              "Avalanche method saves the most money mathematically",
              "Snowball method provides quick motivational wins",
              "Both methods work - pick what fits your personality",
              "Consistency matters more than which method you choose"
            ]
          },
          {
            title: "Avoiding Debt Traps",
            type: "reading",
            duration: "5 min",
            content: `Some debt is designed to trap you. Learn to recognize and avoid these:

**PAYDAY LOANS**
• Short-term, high-cost loans
• Average APR: 400%+
• Roll over creates debt spiral
• NEVER use these, ever

**BUY NOW, PAY LATER**
• Afterpay, Klarna, Affirm
• Seems harmless
• Multiple accounts hard to track
• Late fees add up
• Hurts credit if missed

**STORE CREDIT CARDS**
• "Save 20% today!"
• Interest rates often 25-30%
• One-store limits usefulness
• Usually not worth it

**CAR TITLE LOANS**
• Use your car as collateral
• Interest rates 100-300% APR
• Risk losing your transportation
• Another hard no

**CREDIT CARD MINIMUMS**
• $5,000 balance at 20% APR
• Minimum payment: ~$100/month
• Time to payoff: 9+ years
• Interest paid: $6,000+
• Always pay more than minimum!

**FURNITURE/ELECTRONICS FINANCING**
• "No interest for 12 months!"
• Miss one payment = ALL interest owed
• Called "deferred interest"
• Read the fine print carefully`,
            keyPoints: [
              "Payday loans and title loans are predatory - never use",
              "Buy Now Pay Later can spiral out of control",
              "Store credit cards rarely make sense",
              "0% financing has catches - read the fine print"
            ]
          },
          {
            title: "Building a Debt-Free Future",
            type: "interactive",
            duration: "6 min",
            content: `Let's create your personal debt freedom plan:

**STEP 1: STOP THE BLEEDING**
• No new debt (freeze cards if needed)
• Cut subscriptions and extras
• Create a bare-bones budget

**STEP 2: BUILD A MINI EMERGENCY FUND**
• $500-1,000 in savings
• Prevents using cards for emergencies
• Do this BEFORE aggressive debt payoff

**STEP 3: CHOOSE YOUR STRATEGY**
• Avalanche or Snowball
• List all debts in order
• Calculate minimum payments total

**STEP 4: FIND EXTRA MONEY**
• Side hustle income
• Selling unused items
• Cutting expenses
• Tax refunds and windfalls

**STEP 5: AUTOMATE YOUR PLAN**
• Set up auto-payments
• Schedule extra payments
• Track progress monthly

**STEP 6: CELEBRATE MILESTONES**
• Each paid-off debt is a win
• Small rewards keep you motivated
• Share progress with accountability partner

**THE DEBT-FREE MINDSET:**
• Visualize your life without payments
• Calculate what you'll save/invest instead
• Remember: This is temporary sacrifice for permanent freedom

**YOUR NUMBERS:**
Total debt: $______
Monthly extra payment possible: $______
Estimated payoff date: ______

Write these down. Put them where you'll see them daily.`,
            keyPoints: [
              "Build $1,000 emergency fund before aggressive payoff",
              "Choose avalanche or snowball and commit",
              "Automate payments to remove emotion from the process",
              "Celebrate milestones to stay motivated"
            ]
          }
        ]
      },
      8: {
        title: "Introduction to Investing",
        sections: [
          {
            title: "Why Start Investing Now",
            type: "reading",
            duration: "5 min",
            content: `You might think investing is for people with real jobs and big salaries. Wrong. Starting now, even with tiny amounts, gives you an enormous advantage.

**THE POWER OF COMPOUND INTEREST:**

Meet two investors:
• **Early Emma**: Invests $200/month from age 22-32 (10 years), then stops. Total invested: $24,000
• **Late Larry**: Invests $200/month from age 32-62 (30 years). Total invested: $72,000

At age 62 (assuming 8% average return):
• Emma: $595,000 (invested $24,000)
• Larry: $298,000 (invested $72,000)

Emma invested 1/3 the money but ended up with DOUBLE. That's compound interest.

**TIME IS YOUR SUPERPOWER:**
• You have 40+ years until retirement
• You can take more risk (and get more reward)
• You can weather market downturns
• Small amounts grow massive

**STARTING SMALL IS FINE:**
• $50/month = $600/year
• In 40 years at 8%: ~$175,000
• That's from just $50/month!

**THE COST OF WAITING:**
Every year you wait costs you more than you think. Starting at 25 vs 35 can mean hundreds of thousands less at retirement.`,
            keyPoints: [
              "Time in the market beats timing the market",
              "Starting with $50/month is perfectly fine",
              "Compound interest turns small amounts into fortunes",
              "Every year you wait costs you exponentially"
            ]
          },
          {
            title: "Investment Basics",
            type: "video",
            duration: "7 min",
            content: `Let's demystify the main investment types:

**STOCKS**
• Ownership shares in a company
• Higher risk, higher potential return
• Can lose value short-term
• Historically ~10% annual return long-term

**BONDS**
• Loans to companies or governments
• Lower risk, lower return
• More stable than stocks
• ~4-6% typical return

**MUTUAL FUNDS**
• Baskets of stocks/bonds
• Professional management
• Diversification built-in
• Often have higher fees

**ETFs (Exchange-Traded Funds)**
• Like mutual funds but trade like stocks
• Usually lower fees
• Very popular for beginners
• Can buy with any brokerage

**INDEX FUNDS**
• Track a market index (like S&P 500)
• Very low fees
• No stock picking needed
• Warren Buffett's recommendation for most people

**WHAT SHOULD YOU BUY?**

For beginners, one of these is usually best:
• **VTI** - Total US Stock Market ETF
• **VOO** - S&P 500 ETF
• **VXUS** - International Stocks ETF
• **Target Date Fund** - Auto-adjusts as you age

A simple portfolio:
• 80-90% stocks (you're young!)
• 10-20% bonds (stability)`,
            keyPoints: [
              "Stocks = ownership, higher risk/reward",
              "Index funds are best for most investors",
              "Lower fees = more money for you",
              "Young investors should be mostly in stocks"
            ]
          },
          {
            title: "How to Start Investing",
            type: "reading",
            duration: "5 min",
            content: `Ready to invest your first dollar? Here's exactly how:

**STEP 1: OPEN A BROKERAGE ACCOUNT**

Best options for beginners:
• **Fidelity** - No minimums, great research, fractional shares
• **Charles Schwab** - Similar to Fidelity, excellent service
• **Vanguard** - Pioneer of index funds, slightly older interface
• **Robinhood** - Simple app, good for beginners (limited research)

What you need to open:
• Social Security number
• Bank account for transfers
• ~10 minutes

**STEP 2: FUND YOUR ACCOUNT**
• Link your bank account
• Set up automatic transfers (even $25/week)
• Start with what you can afford to not touch

**STEP 3: BUY YOUR FIRST INVESTMENT**
• Search for ticker symbol (like VTI or VOO)
• Choose "buy"
• Enter dollar amount or shares
• Confirm purchase

**STEP 4: SET UP AUTO-INVESTING**
• Most brokerages offer this
• Picks the same day each month
• Takes emotion out of investing
• Called "dollar-cost averaging"

**HOW MUCH TO INVEST:**
• Invest after: Emergency fund + high-interest debt paid
• Start with: Whatever you can consistently contribute
• Goal: Eventually 15-20% of income`,
            keyPoints: [
              "Fidelity and Schwab are excellent for beginners",
              "Auto-investing removes emotion and builds habit",
              "Start after you have emergency fund and no high-interest debt",
              "Dollar-cost averaging means buying regularly regardless of price"
            ]
          },
          {
            title: "Building Your First Portfolio",
            type: "interactive",
            duration: "7 min",
            content: `Let's build your starter investment portfolio:

**THE SIMPLE THREE-FUND PORTFOLIO:**

1. **US Total Stock Market (60-70%)**
   • VTI (Vanguard) or FSKAX (Fidelity)
   • Captures entire US market
   • Core of your portfolio

2. **International Stocks (20-30%)**
   • VXUS (Vanguard) or FZILX (Fidelity)
   • Global diversification
   • Don't skip this!

3. **Bonds (0-10% while young)**
   • BND (Vanguard) or FXNAX (Fidelity)
   • Stability
   • Increase this as you age

**EVEN SIMPLER: ONE-FUND OPTION**

Target Date Fund (like VFFVX for 2055 retirement):
• Pick your expected retirement year
• One fund does everything
• Auto-rebalances
• Slightly higher fees, maximum simplicity

**WHAT NOT TO DO:**
• Don't day trade
• Don't buy individual stocks (yet)
• Don't panic sell in downturns
• Don't check your balance daily

**YOUR ACTION PLAN:**

Week 1:
• Open brokerage account
• Link bank account

Week 2:
• Set up $25-50 auto-investment
• Buy your first ETF or target date fund

Every month:
• Contribute consistently
• Ignore the news
• Check quarterly at most

**REMEMBER:**
Investing is boring. That's the point. Set it, forget it, and let time do the work.`,
            keyPoints: [
              "Three-fund portfolio: US stocks, international stocks, bonds",
              "Target date funds are great one-fund solutions",
              "Don't day trade or try to time the market",
              "Boring, consistent investing beats exciting trading"
            ]
          }
        ]
      }
    };

    // Add remaining weeks 9-16
    collegeLessonMap[9] = {
      title: "Retirement Planning 101",
      sections: [
        {
          title: "Why Retirement Savings Matter Now",
          type: "reading",
          duration: "5 min",
          content: `Retirement feels impossibly far away. That's exactly why starting now is so powerful.

**THE MATH IS CLEAR:**

Starting at 22 vs 32, investing $200/month at 8% return:
• Start at 22: $702,000 at 62
• Start at 32: $298,000 at 62
• 10 years = $400,000+ difference

**THE RETIREMENT SAVINGS GAP:**
• Average American has $65,000 saved for retirement
• That covers ~2-3 years of expenses
• You need $1-2 million+ for a comfortable retirement
• Start now to close the gap

**YOUR ADVANTAGES:**
• Time: 40+ years of compounding
• Risk tolerance: Can weather market crashes
• Flexibility: No kids, mortgage, etc. (usually)
• Habit building: Save now, continue forever`,
          keyPoints: [
            "10 years of delay costs $400,000+",
            "Average Americans are severely undersaved",
            "Your youth is your biggest advantage",
            "Habits formed now last a lifetime"
          ]
        },
        {
          title: "401(k) Explained",
          type: "video",
          duration: "6 min",
          content: `The 401(k) is likely your most powerful retirement tool. Here's how it works:

**WHAT IS A 401(k)?**
• Employer-sponsored retirement account
• Pre-tax contributions (Traditional) or post-tax (Roth)
• Money grows tax-free
• Withdrawals taxed in retirement (Traditional) or tax-free (Roth)

**THE EMPLOYER MATCH:**
This is FREE MONEY. Example:
• Employer matches 50% up to 6% of salary
• You earn $50,000 and contribute 6% ($3,000)
• Employer adds $1,500 free
• That's a 50% instant return!

**ALWAYS CONTRIBUTE ENOUGH TO GET THE FULL MATCH.**

**2024 CONTRIBUTION LIMITS:**
• Employee: $23,000
• Plus employer match
• Catch-up (50+): Additional $7,500

**TRADITIONAL VS ROTH 401(k):**
Traditional: Tax break now, pay taxes later
Roth: Pay taxes now, withdrawals tax-free

**WHICH TO CHOOSE?**
Young and low income now? → Roth (tax rates probably higher later)
High income now? → Traditional (reduce current taxes)
Unsure? → Split between both`,
          keyPoints: [
            "Always contribute enough to get the full employer match",
            "Match is free money - 50-100% instant return",
            "Roth 401(k) is often best for young workers",
            "Contribution limit is $23,000 in 2024"
          ]
        },
        {
          title: "IRA Options",
          type: "reading",
          duration: "5 min",
          content: `Individual Retirement Accounts (IRAs) give you more control than a 401(k).

**TRADITIONAL IRA:**
• Contributions may be tax-deductible
• Grows tax-deferred
• Taxed when you withdraw
• 2024 limit: $7,000

**ROTH IRA:**
• Contributions are NOT tax-deductible
• Grows tax-free
• Withdrawals in retirement are TAX-FREE
• Same $7,000 limit

**WHY ROTH IRA IS AMAZING FOR YOUNG PEOPLE:**

1. Tax-free growth forever
2. Can withdraw contributions (not earnings) anytime
3. No required minimum distributions ever
4. Tax rates likely higher when you're older

**ROTH IRA INCOME LIMITS (2024):**
• Single: Up to $161,000 (phases out)
• Married: Up to $240,000 (phases out)
• If over limit: Look into "Backdoor Roth"

**WHERE TO OPEN:**
• Fidelity, Schwab, or Vanguard
• Same platforms as regular brokerage
• 10 minutes to open`,
          keyPoints: [
            "Roth IRA is the best deal for young investors",
            "Tax-free growth and tax-free withdrawals",
            "2024 limit is $7,000",
            "Open at Fidelity, Schwab, or Vanguard"
          ]
        },
        {
          title: "Your Retirement Roadmap",
          type: "interactive",
          duration: "6 min",
          content: `Here's your step-by-step retirement savings plan:

**ORDER OF OPERATIONS:**

1. **Emergency Fund First**
   • 3-6 months expenses
   • In a high-yield savings account

2. **401(k) to Get Full Match**
   • Free money, can't skip this
   • Usually 3-6% of salary

3. **Max Out Roth IRA**
   • $7,000/year
   • Tax-free forever

4. **Back to 401(k)**
   • Max out if possible ($23,000)
   • Before taxable investing

5. **Taxable Brokerage**
   • After maxing tax-advantaged
   • More flexibility, less tax benefit

**MONTHLY CONTRIBUTION TARGETS:**

To max Roth IRA ($7,000/year):
• $583/month or
• $269/biweekly

**THE 15% RULE:**
• Aim to save 15% of income for retirement
• Includes employer match
• Start with whatever you can, increase over time

**YOUR ACTION ITEMS:**
1. Check if your employer offers 401(k)
2. Open Roth IRA at Fidelity/Schwab/Vanguard
3. Set up automatic contributions
4. Set calendar reminder to increase by 1% each year`,
          keyPoints: [
            "Order: Emergency fund → 401k match → Roth IRA → More 401k",
            "Aim for 15% of income toward retirement",
            "Increase contributions by 1% each year",
            "Automation is key to consistency"
          ]
        }
      ]
    };

    collegeLessonMap[10] = {
      title: "Career Preparation",
      sections: [
        {
          title: "Salary Negotiation Fundamentals",
          type: "reading",
          duration: "6 min",
          content: `Your first job offer is negotiable. Most people don't know this or are too scared to try. Here's how to do it:

**WHY NEGOTIATE?**
• 73% of employers expect candidates to negotiate
• Average raise from negotiating: 7-15%
• First salary affects all future raises
• $5,000 more now = $500,000+ over career

**WHEN TO NEGOTIATE:**
• After receiving the official offer
• When you're ready to accept (or close)
• Never in the first interview

**WHAT TO SAY:**
"Thank you so much for this offer. I'm really excited about the role. Based on my research and experience, I was expecting something closer to [X]. Is there flexibility in the salary?"

**RESEARCH FIRST:**
• Glassdoor, Levels.fyi, LinkedIn Salary
• Ask people in similar roles
• Know the range for your role and location

**NEGOTIATION TIPS:**
• Be enthusiastic, not demanding
• Always give a specific number or range
• They might say no, and that's okay
• Silence is powerful after you ask`,
          keyPoints: [
            "73% of employers expect you to negotiate",
            "Not negotiating costs $500,000+ over career",
            "Research salary ranges before the conversation",
            "Be confident but not demanding"
          ]
        },
        {
          title: "Understanding Your Benefits",
          type: "video",
          duration: "6 min",
          content: `Salary is just part of your compensation. Benefits can be worth $10,000-50,000+ per year.

**HEALTH INSURANCE:**
• Employer usually pays 50-80% of premium
• HSA vs PPO options
• Deductibles, copays, out-of-pocket max
• This alone can be worth $5,000-15,000/year

**RETIREMENT BENEFITS:**
• 401(k) match (often 3-6% of salary)
• If you make $60,000 and get 4% match = $2,400 free/year

**PAID TIME OFF:**
• Vacation days
• Sick days
• Holidays
• Parental leave
• Value: $200-500 per day

**OTHER BENEFITS:**
• Health Savings Account (HSA) contributions
• Life/disability insurance
• Tuition reimbursement ($5,000+ common)
• Stock options/equity
• Gym memberships, commuter benefits

**CALCULATING TOTAL COMPENSATION:**
Salary: $60,000
+ Health insurance value: $8,000
+ 401(k) match: $2,400
+ PTO value: $5,000
= Total comp: ~$75,400`,
          keyPoints: [
            "Benefits can add $10,000-50,000 to your compensation",
            "Health insurance alone is often $5,000-15,000 value",
            "401(k) match is free money - always take it",
            "Calculate total compensation, not just salary"
          ]
        },
        {
          title: "Your First 90 Days",
          type: "reading",
          duration: "5 min",
          content: `The first 90 days set the tone for your entire tenure. Here's how to crush them:

**WEEK 1: ABSORB**
• Listen more than you talk
• Take extensive notes
• Meet everyone you can
• Understand the culture
• Set up your systems (email, calendar, files)

**WEEKS 2-4: LEARN**
• Understand your role deeply
• Identify key stakeholders
• Learn the unwritten rules
• Find a mentor or ally
• Start contributing in small ways

**MONTHS 2-3: CONTRIBUTE**
• Take on increasing responsibility
• Deliver quality work on time
• Ask for feedback proactively
• Build relationships across teams
• Look for quick wins

**WHAT TO AVOID:**
• Trying to change things immediately
• Complaining about processes
• Being late or missing deadlines
• Overpromising and underdelivering
• Gossiping or office politics

**QUESTIONS TO ASK:**
• "What does success look like in this role?"
• "What should I prioritize?"
• "Who should I connect with?"
• "What would you do differently if you were me?"`,
          keyPoints: [
            "Listen and learn before trying to change things",
            "The first impression is lasting",
            "Build relationships across the organization",
            "Seek feedback early and often"
          ]
        },
        {
          title: "Building Your Career",
          type: "interactive",
          duration: "6 min",
          content: `Your first job is just the beginning. Here's how to build an exceptional career:

**THE FIRST 5 YEARS:**
• Learn as much as possible
• Build foundational skills
• Develop a specialty
• Change jobs every 2-3 years if needed
• Average job tenure for 25-34: 2.8 years

**SALARY GROWTH STRATEGIES:**
• Internal promotions: 3-5% raises typical
• Job hopping: 10-20% increases common
• New skills: Certifications, degrees
• Networking: Many jobs never get posted

**SKILLS THAT MATTER:**
Technical:
• Data analysis
• Project management
• Industry-specific tools

Soft:
• Communication (written and verbal)
• Leadership
• Problem-solving
• Emotional intelligence

**YOUR 5-YEAR PLAN:**
Year 1: Master your current role
Year 2: Take on additional responsibilities
Year 3: Get promoted or find new opportunity
Year 4: Develop leadership skills
Year 5: Consider management or specialization

**ACTION ITEMS:**
1. Set up LinkedIn properly
2. Identify skills gaps in your industry
3. Find a mentor
4. Network consistently (even when not job hunting)
5. Save at least 15% of income`,
          keyPoints: [
            "Change jobs every 2-3 years for faster salary growth",
            "Soft skills matter as much as technical skills",
            "Network before you need to",
            "Always be learning and growing"
          ]
        }
      ]
    };

    // Weeks 11-16 with more condensed but complete content
    collegeLessonMap[11] = {
      title: "Housing & Renting",
      sections: [
        { title: "Finding Your First Apartment", type: "reading", duration: "6 min", content: `Finding your first apartment is exciting. Here's how to do it right:\n\n**WHAT YOU'LL NEED:**\n• Proof of income (3x rent typically)\n• Credit check (soft pull usually)\n• References (landlord, employer)\n• Security deposit (1-2 months rent)\n• First month's rent\n\n**BUDGETING FOR RENT:**\nThe 30% rule: Spend no more than 30% of gross income on housing.\n• $40,000 salary = $1,000/month max rent\n• $50,000 salary = $1,250/month max rent\n\n**WHAT TO LOOK FOR:**\n• Location (commute, safety, amenities)\n• Included utilities\n• Parking situation\n• Laundry access\n• Natural light and ventilation\n• Cell service in the unit`, keyPoints: ["Never spend more than 30% of income on rent", "Budget for security deposit + first month", "Location affects more than just commute", "Check cell service before signing"] },
        { title: "Understanding Your Lease", type: "video", duration: "5 min", content: `Your lease is a legal contract. Know what you're signing:\n\n**KEY TERMS:**\n• Lease term (usually 12 months)\n• Rent amount and due date\n• Late fees\n• Security deposit terms\n• Pet policies\n• Subletting rules\n• Renewal terms\n\n**RED FLAGS:**\n• Fees not disclosed upfront\n• Vague maintenance responsibility\n• Excessive penalties\n• No written documentation`, keyPoints: ["Read every word of your lease", "Document apartment condition at move-in", "Understand renewal and termination terms", "Get everything in writing"] },
        { title: "Roommate Finances", type: "reading", duration: "5 min", content: `Living with roommates saves money but requires financial coordination:\n\n**SPLITTING COSTS:**\n• Rent: By room size or equally\n• Utilities: Equally or by usage\n• Shared supplies: Household fund\n\n**TOOLS:**\n• Splitwise for tracking\n• Joint account for bills\n• Written agreement for expectations\n\n**CONFLICT PREVENTION:**\n• Discuss finances before moving in\n• Set up autopay systems\n• Have monthly check-ins`, keyPoints: ["Discuss money before moving in together", "Use apps to track shared expenses", "Have a written roommate agreement", "Regular communication prevents issues"] },
        { title: "Moving Costs & Setup", type: "interactive", duration: "5 min", content: `Moving is expensive. Budget for:\n\n**UPFRONT COSTS:**\n• Security deposit: $1,000-3,000\n• First month's rent: $1,000-2,000\n• Moving truck/help: $200-500\n• Utility deposits: $100-300\n\n**SETUP COSTS:**\n• Basic furniture\n• Kitchen essentials\n• Cleaning supplies\n• Internet setup\n\n**MONEY-SAVING TIPS:**\n• Move mid-month or winter (lower demand)\n• Facebook Marketplace for furniture\n• Ask friends to help move\n• Start utility accounts early`, keyPoints: ["Budget $3,000-5,000 for moving costs", "Timing your move can save money", "Buy used furniture to save thousands", "Set up utilities before move-in day"] }
      ]
    };

    collegeLessonMap[12] = {
      title: "Insurance Fundamentals",
      sections: [
        { title: "Health Insurance 101", type: "reading", duration: "6 min", content: `Health insurance is confusing but essential. Here's what you need to know:\n\n**KEY TERMS:**\n• **Premium**: Monthly cost\n• **Deductible**: What you pay before insurance kicks in\n• **Copay**: Fixed amount per visit\n• **Coinsurance**: Percentage you pay after deductible\n• **Out-of-pocket max**: Most you'll pay per year\n\n**PLAN TYPES:**\n• HMO: Lower cost, need referrals, in-network only\n• PPO: More flexibility, higher cost\n• HDHP: High deductible, pairs with HSA\n\n**STAYING ON PARENTS' PLAN:**\nYou can stay on until age 26, regardless of:\n• Student status\n• Marital status\n• Living situation\n• Employment`, keyPoints: ["Stay on parents' insurance until 26 if possible", "Understand deductibles before choosing a plan", "In-network vs out-of-network matters greatly", "HSA-eligible plans can save money long-term"] },
        { title: "Auto Insurance Explained", type: "video", duration: "5 min", content: `If you drive, you need auto insurance. Here's the breakdown:\n\n**COVERAGE TYPES:**\n• Liability: Covers damage you cause to others (required)\n• Collision: Covers your car in accidents\n• Comprehensive: Covers theft, weather, etc.\n• Uninsured motorist: Covers you if other driver has no insurance\n\n**SAVING MONEY:**\n• Shop around every 6-12 months\n• Bundle with renters insurance\n• Good student discounts\n• Higher deductible = lower premium\n• Pay full premium upfront`, keyPoints: ["Liability is required, collision/comprehensive optional", "Shop around - prices vary significantly", "Good student discounts can save 10-25%", "Higher deductible lowers premium but increases risk"] },
        { title: "Renters Insurance", type: "reading", duration: "4 min", content: `Renters insurance is cheap and incredibly valuable:\n\n**WHAT IT COVERS:**\n• Your belongings (theft, fire, water damage)\n• Liability (someone gets hurt in your place)\n• Additional living expenses (if displaced)\n\n**COST:**\n• Typically $15-30/month\n• Easily worth it for peace of mind\n\n**HOW MUCH COVERAGE:**\n• Inventory your belongings\n• Most people have $20,000-50,000 in stuff\n• Don't underestimate electronics and clothes`, keyPoints: ["Only $15-30/month for protection", "Covers theft, fire, and liability", "Your landlord's insurance doesn't cover your stuff", "Document your belongings with photos/video"] },
        { title: "Building Your Insurance Portfolio", type: "interactive", duration: "5 min", content: `Here's what insurance you need at each stage:\n\n**COLLEGE STUDENT:**\n• Health (parents' plan or school's)\n• Renters (highly recommended)\n• Auto (if you drive)\n\n**FIRST JOB:**\n• Health (employer plan)\n• Renters (required by many landlords)\n• Auto (required if driving)\n• Disability (if offered)\n\n**AS YOU GROW:**\n• Life insurance (when you have dependents)\n• Umbrella policy (extra liability coverage)\n\n**ACTION ITEMS:**\n1. Review current coverage\n2. Get renters insurance quote today\n3. Shop auto insurance annually\n4. Understand employer health options`, keyPoints: ["Build coverage as your life complexity grows", "Renters insurance is a no-brainer at $15-30/month", "Shop insurance annually for better rates", "Document everything you own for claims"] }
      ]
    };

    collegeLessonMap[13] = {
      title: "Advanced Credit Strategies",
      sections: [
        { title: "Optimizing Your Credit Score", type: "reading", duration: "5 min", content: `Once you've built credit, here's how to optimize it:\n\n**UTILIZATION HACKS:**\n• Keep under 10% for best scores (not just 30%)\n• Pay before statement closes to report low balance\n• Request limit increases (without hard pull if possible)\n• Multiple cards = more total credit = lower utilization\n\n**PAYMENT STRATEGIES:**\n• Set up autopay for every card\n• Pay weekly to keep utilization low\n• Never miss a payment - set multiple reminders\n\n**LENGTH OF HISTORY:**\n• Never close your oldest card\n• Authorized user on parent's old card\n• Unused cards can be closed by issuers - use them occasionally`, keyPoints: ["Under 10% utilization is ideal, not just 30%", "Pay before statement closes to report lower balance", "Never close your oldest credit card", "Set up autopay on every single card"] },
        { title: "Credit Card Rewards Strategy", type: "video", duration: "5 min", content: `Once your credit is solid, rewards cards can pay you back:\n\n**TYPES OF REWARDS:**\n• Cash back (1-5%)\n• Travel points (often higher value)\n• Store-specific rewards\n\n**BEGINNER REWARDS CARDS:**\n• Citi Double Cash (2% on everything)\n• Chase Freedom Flex (5% categories)\n• Discover it (5% rotating categories)\n\n**THE GOLDEN RULES:**\n• Never carry a balance for rewards\n• Rewards < interest if you carry balance\n• Sign-up bonuses can be $200-500+\n• Upgrade path within card families`, keyPoints: ["Never carry a balance just to earn rewards", "Sign-up bonuses can be worth hundreds", "2% cash back is the baseline to beat", "Only get rewards cards when credit is solid"] },
        { title: "Protecting Your Credit", type: "reading", duration: "4 min", content: `Your credit is valuable. Protect it:\n\n**MONITORING:**\n• Free credit monitoring (Credit Karma, bank apps)\n• Review credit reports annually (AnnualCreditReport.com)\n• Set up fraud alerts\n\n**SECURITY:**\n• Freeze your credit at all three bureaus (free)\n• Strong, unique passwords for all accounts\n• Enable two-factor authentication everywhere\n\n**IF YOU'RE A VICTIM:**\n• Freeze credit immediately\n• File police report\n• Contact all affected creditors\n• Place fraud alert on credit reports`, keyPoints: ["Freeze your credit at all three bureaus for free", "Monitor credit weekly through free services", "Strong passwords and 2FA prevent most fraud", "Act immediately if you suspect identity theft"] },
        { title: "Credit for Major Purchases", type: "interactive", duration: "5 min", content: `Your credit affects major life purchases:\n\n**AUTO LOANS:**\n• 750+ credit: Best rates (4-6% currently)\n• 700-749: Good rates (6-8%)\n• Below 700: Higher rates, consider waiting\n\n**MORTGAGES:**\n• 740+ for best rates\n• 620 minimum for most loans\n• Each 20-point improvement saves thousands\n\n**PREPARATION TIMELINE:**\n• 12 months before: Check credit, fix errors\n• 6 months before: Pay down balances, no new accounts\n• 3 months before: Stop credit shopping\n• Day of: Rate shop within 14-day window\n\n**CREDIT IMPACT OF LOANS:**\n• Hard inquiry: Small, temporary dip\n• New account: Short-term decrease\n• Payment history: Long-term benefit`, keyPoints: ["740+ credit score gets best mortgage rates", "Don't open new credit 6+ months before major purchase", "Rate shopping within 14 days counts as one inquiry", "Good credit saves tens of thousands on homes"] }
      ]
    };

    collegeLessonMap[14] = {
      title: "Wealth Building Foundations",
      sections: [
        { title: "The Wealth Building Framework", type: "reading", duration: "6 min", content: `Building wealth follows a proven formula:\n\n**THE EQUATION:**\nWealth = (Income - Expenses) × Time × Rate of Return\n\n**THE LEVERS:**\n1. **Increase Income**: Career growth, side hustles\n2. **Decrease Expenses**: Live below your means\n3. **Increase Time**: Start early (you have this!)\n4. **Improve Returns**: Invest wisely\n\n**THE MILLIONAIRE MATH:**\n• Invest $500/month at 8% for 30 years = $745,000\n• Invest $1,000/month at 8% for 30 years = $1.49 million\n• Start 10 years earlier with $500/month = $1.19 million\n\n**WEALTH VS HIGH INCOME:**\nMany high earners are broke because they spend it all. Wealth is what you keep, not what you make.`, keyPoints: ["Wealth = (Income - Expenses) × Time × Returns", "Starting early is your biggest advantage", "High income doesn't equal wealth", "Consistency beats intensity in building wealth"] },
        { title: "Investment Diversification", type: "video", duration: "5 min", content: `Don't put all your eggs in one basket:\n\n**DIVERSIFICATION ACROSS:**\n• Asset classes (stocks, bonds, real estate)\n• Geography (US, international, emerging)\n• Sectors (tech, healthcare, finance)\n• Time (consistent investing regardless of market)\n\n**A DIVERSIFIED PORTFOLIO:**\n• 60% US stocks (VTI)\n• 20% International stocks (VXUS)\n• 10% Bonds (BND)\n• 10% REITs/Alternative (VNQ)\n\n**REBALANCING:**\n• Check annually\n• Sell winners, buy losers to maintain ratios\n• Or use target-date funds that auto-rebalance`, keyPoints: ["Diversification reduces risk without sacrificing returns", "Rebalance annually to maintain your allocation", "Target-date funds auto-diversify and rebalance", "Don't over-concentrate in any single stock"] },
        { title: "Real Estate Basics", type: "reading", duration: "5 min", content: `Real estate is a powerful wealth builder:\n\n**WAYS TO INVEST:**\n• Primary residence (build equity)\n• Rental properties (cash flow + appreciation)\n• REITs (real estate stocks, no property management)\n\n**BUYING YOUR FIRST HOME:**\n• Save 20% down to avoid PMI\n• Budget for closing costs (2-5%)\n• Maintenance reserves (1% of value/year)\n• Don't exceed 3x annual income\n\n**RENTING VS BUYING:**\nRent makes sense when:\n• Staying less than 5 years\n• Market prices are inflated\n• You need flexibility\n\nBuying makes sense when:\n• Long-term commitment\n• Building equity > rent cost\n• You want control/customization`, keyPoints: ["20% down avoids PMI (private mortgage insurance)", "Budget 1% of home value for annual maintenance", "REITs give real estate exposure without buying property", "Don't buy if staying less than 5 years"] },
        { title: "Your Wealth Building Plan", type: "interactive", duration: "6 min", content: `Create your personalized wealth building roadmap:\n\n**PHASE 1: FOUNDATION (Now - Age 30)**\n• Emergency fund: 6 months\n• Retirement: 15% of income\n• Debt: Eliminate high-interest\n• Net worth goal: $100,000\n\n**PHASE 2: GROWTH (30-45)**\n• Max retirement accounts\n• Build taxable investments\n• Consider real estate\n• Net worth goal: $500,000+\n\n**PHASE 3: ACCUMULATION (45-55)**\n• Coast to early retirement\n• Diversify income streams\n• Net worth goal: $1-2 million\n\n**PHASE 4: PRESERVATION (55+)**\n• Shift to income-producing assets\n• Estate planning\n• Enjoy your wealth!\n\n**YOUR ACTIONS:**\n1. Calculate current net worth\n2. Set 1-year financial goals\n3. Automate your savings/investing\n4. Review quarterly`, keyPoints: ["Set net worth goals for each life phase", "Automate everything to ensure consistency", "Review and adjust quarterly", "Wealth building is a 40-year game"] }
      ]
    };

    collegeLessonMap[15] = {
      title: "Entrepreneurship & Freelancing",
      sections: [
        { title: "The Entrepreneur Mindset", type: "reading", duration: "5 min", content: `Entrepreneurship isn't just about starting companies—it's a mindset:\n\n**ENTREPRENEURIAL THINKING:**\n• See problems as opportunities\n• Take calculated risks\n• Learn from failure\n• Create value for others\n• Always be learning\n\n**SIDE BUSINESS VS FULL-TIME:**\nStart as a side hustle while employed:\n• Test your idea with minimal risk\n• Build income before quitting\n• Save 12+ months expenses first\n• Grow it until it replaces your salary\n\n**BUSINESS IDEAS TO START SMALL:**\n• Freelance your current skills\n• Consulting in your expertise\n• Content creation\n• E-commerce/products\n• Services (tutoring, coaching, etc.)`, keyPoints: ["Start side hustles while still employed", "Entrepreneurship is a learnable skill", "Solve problems others have", "Save 12+ months expenses before going full-time"] },
        { title: "Freelancing Fundamentals", type: "video", duration: "5 min", content: `Freelancing is entrepreneurship with training wheels:\n\n**GETTING STARTED:**\n• List your marketable skills\n• Research going rates\n• Create simple portfolio/website\n• Start with people you know\n\n**FINDING CLIENTS:**\n• Upwork, Fiverr (to start)\n• LinkedIn networking\n• Referrals from happy clients\n• Cold outreach\n\n**PRICING YOUR SERVICES:**\n• Research market rates\n• Value-based pricing > hourly\n• Start competitive, raise as you prove value\n• Never work for free (even for "exposure")\n\n**FREELANCE FINANCES:**\n• Set aside 25-30% for taxes\n• Track all expenses\n• Separate business bank account\n• Invoice promptly, follow up on late payments`, keyPoints: ["Start freelancing with skills you already have", "Set aside 25-30% for taxes", "Value-based pricing beats hourly rates", "Never work for free or 'exposure'"] },
        { title: "Business Basics", type: "reading", duration: "5 min", content: `If you're making money, you're running a business:\n\n**LEGAL STRUCTURE:**\n• Sole proprietorship: Simplest, least protection\n• LLC: Good protection, moderate complexity\n• S-Corp: Tax advantages at higher income\n\n**BUSINESS BANKING:**\n• Separate business account\n• Keep business/personal expenses separate\n• Makes taxes much easier\n\n**TAXES:**\n• Quarterly estimated payments\n• Self-employment tax (15.3%)\n• Deduct legitimate business expenses\n• Consider hiring an accountant\n\n**INSURANCE:**\n• General liability\n• Professional liability (if applicable)\n• Health insurance (marketplace or spouse's plan)`, keyPoints: ["LLC provides liability protection", "Keep business and personal finances separate", "Pay quarterly estimated taxes", "Deduct all legitimate business expenses"] },
        { title: "Scaling Your Business", type: "interactive", duration: "5 min", content: `From side hustle to real business:\n\n**GROWTH PATH:**\n1. Validate: Does someone pay for this?\n2. Systemize: Document your processes\n3. Optimize: Improve efficiency\n4. Scale: Increase capacity/clients\n5. Hire: Delegate to grow further\n\n**WHEN TO GO FULL-TIME:**\n• Business income = 75%+ of salary\n• 12+ months expenses saved\n• Health insurance figured out\n• Strong pipeline/recurring revenue\n\n**BUILDING RECURRING REVENUE:**\n• Retainer clients\n• Subscription services\n• Productized services\n• Digital products\n\n**YOUR ACTION PLAN:**\n1. Identify one skill to monetize\n2. Get your first paying client\n3. Reinvest profits in the business\n4. Build towards recurring revenue`, keyPoints: ["Validate before scaling", "Recurring revenue creates stability", "Save 12+ months before going full-time", "Systemize your processes to scale"] }
      ]
    };

    collegeLessonMap[16] = {
      title: "Financial Independence Planning",
      sections: [
        { title: "What is Financial Independence?", type: "reading", duration: "5 min", content: `Financial Independence (FI) means your investments cover your living expenses:\n\n**THE DEFINITION:**\n• Passive income ≥ expenses\n• Work becomes optional\n• You own your time\n\n**THE 4% RULE:**\n• Safe withdrawal rate from investments\n• $1M invested = $40,000/year safely\n• Adjust for inflation annually\n• 25x your annual expenses = FI number\n\n**EXAMPLES:**\n• Spend $40,000/year → Need $1,000,000\n• Spend $60,000/year → Need $1,500,000\n• Spend $80,000/year → Need $2,000,000\n\n**IT'S ACHIEVABLE:**\nWith $500/month at 8% for 35 years = $1.1 million\nThat's starting at 22, FI by 57 with just $500/month.`, keyPoints: ["25x annual expenses = financial independence number", "4% withdrawal rate is considered safe", "Lower expenses = faster path to FI", "FI is achievable even with modest savings"] },
        { title: "Calculating Your FI Number", type: "video", duration: "5 min", content: `Let's calculate your personal FI number:\n\n**STEP 1: KNOW YOUR EXPENSES**\nTrack for 3 months minimum:\n• Housing\n• Food\n• Transportation\n• Healthcare\n• Entertainment\n• Everything else\n\n**STEP 2: ANNUAL EXPENSES**\nMonthly × 12 = annual\nExample: $3,500/month × 12 = $42,000/year\n\n**STEP 3: MULTIPLY BY 25**\n$42,000 × 25 = $1,050,000 = Your FI number\n\n**STEP 4: TRACK YOUR PROGRESS**\n• Current investments / FI number = % FI\n• Example: $50,000 / $1,050,000 = 4.7% FI\n\n**ACCELERATING FI:**\n• Reduce expenses (25x less needed)\n• Increase savings rate\n• Optimize investment returns`, keyPoints: ["Annual expenses × 25 = FI number", "Track expenses to know your true number", "Lowering expenses reduces FI target", "Calculate your FI percentage to track progress"] },
        { title: "The Path to FI", type: "reading", duration: "5 min", content: `Here's the roadmap to financial independence:\n\n**SAVINGS RATE IS EVERYTHING:**\n• 10% savings rate = 51 years to FI\n• 25% savings rate = 32 years to FI\n• 50% savings rate = 17 years to FI\n• 75% savings rate = 7 years to FI\n\n**THE FI JOURNEY:**\n\n1. **Coast FI** - Enough invested that you'll have enough by traditional retirement, even if you stop contributing\n\n2. **Barista FI** - Investments + part-time work covers expenses\n\n3. **Lean FI** - FI with tight budget\n\n4. **FI** - FI with normal spending\n\n5. **Fat FI** - FI with luxurious spending\n\n**YOUR OPTIONS:**\n• Keep working (optional now)\n• Work part-time on passion projects\n• Volunteer full-time\n• Travel the world\n• Start businesses without financial pressure`, keyPoints: ["Savings rate determines years to FI", "There are many flavors of FI", "Coast FI is an achievable milestone", "FI gives you options, not just retirement"] },
        { title: "Your FI Action Plan", type: "interactive", duration: "6 min", content: `Create your personalized path to financial independence:\n\n**CALCULATE YOUR NUMBERS:**\n• Monthly expenses: $______\n• Annual expenses: $______\n• FI number (×25): $______\n• Current investments: $______\n• FI percentage: ______%\n\n**SET YOUR MILESTONES:**\n• $10,000 invested (started!)\n• $100,000 invested (six figures!)\n• Coast FI\n• 50% FI\n• 75% FI\n• 100% FI\n\n**YOUR ACTION ITEMS:**\n1. Calculate your FI number today\n2. Automate savings (even 10%)\n3. Increase savings rate by 1% every 6 months\n4. Track net worth monthly\n5. Optimize the big three: housing, transport, food\n\n**REMEMBER:**\n• This is a marathon, not a sprint\n• Small consistent actions win\n• You're already ahead by thinking about this\n• Financial independence is freedom`, keyPoints: ["Know your FI number", "Increase savings rate incrementally", "Track net worth monthly", "Every 1% increase in savings rate matters"] }
      ]
    };

    return collegeLessonMap[week] || {
      title: "Lesson Coming Soon",
      sections: [
        {
          title: "Content Under Development",
          type: "reading",
          duration: "1 min",
          content: "This college-level lesson is currently being developed. Check back soon for comprehensive content.",
          keyPoints: ["College lesson content coming soon"]
        }
      ]
    };
  };

  // Get difficulty-specific additional content
  const getDifficultyContent = (week: number, sectionIndex: number, level: string) => {
    if (level === 'beginner') return null;

    const difficultyAdditions: Record<number, Record<number, { intermediate?: string; advanced?: string; extraPoints?: string[] }>> = {
      1: {
        0: {
          intermediate: `**Going Deeper: Income Tracking**

For intermediate learners, let's talk about tracking income more precisely. Consider using apps like Mint, YNAB, or even a simple spreadsheet. The key is consistency - log every source of income weekly.

Pro tip: Create separate categories for regular income vs. one-time payments. This helps you budget more accurately since you can only count on consistent income.`,
          advanced: `**Advanced Concept: Tax Implications of Income**

Different income sources have different tax treatments:
- W-2 employment: Taxes withheld automatically
- 1099 freelance work: You owe self-employment tax (about 15.3%)
- Scholarship money for tuition: Usually tax-free
- Scholarship money for room/board: Often taxable

Start setting aside 25-30% of any freelance or side hustle income for taxes. Open a separate savings account just for this purpose.`,
          extraPoints: level === 'advanced' ? [
            "Track gross vs net income separately",
            "Understand your effective tax rate",
            "Consider quarterly estimated tax payments for side income"
          ] : [
            "Use budgeting apps to automate income tracking",
            "Review your income sources monthly"
          ]
        },
        1: {
          intermediate: `**Expense Tracking Methods**

Beyond just knowing fixed vs variable, try the envelope method digitally. Allocate specific amounts to spending categories at the start of each month. When an envelope is empty, stop spending in that category.

Track your expenses for 30 days before making any changes. You might be surprised where your money actually goes.`,
          advanced: `**Expense Optimization Strategies**

Advanced budgeters look at cost-per-use. That $200 jacket you wear 100 times costs $2 per wear. That $50 shirt you wore twice? $25 per wear.

Also consider opportunity cost. Every dollar spent is a dollar not invested. At 7% annual returns, $100 spent today could have been $200 in 10 years.`,
          extraPoints: level === 'advanced' ? [
            "Calculate cost-per-use for major purchases",
            "Factor in opportunity cost for spending decisions",
            "Audit subscriptions quarterly - cancel unused ones"
          ] : [
            "Try the envelope budgeting method",
            "Track expenses for 30 days before making changes"
          ]
        },
        2: {
          intermediate: `**Building Your Emergency Fund**

The standard advice is 3-6 months of expenses. But as a student, consider this: unexpected things happen - car trouble, medical bills, job loss. Aim for at least 6 months, and keep it in a high-yield savings account earning 4-5% APY.

Start with a mini emergency fund of $1,000, then build from there.`,
          advanced: `**Investment Basics for Savers**

Once you have your emergency fund, don't let extra savings sit idle. Consider:
- High-yield savings accounts (4-5% APY currently)
- I-Bonds for inflation protection (up to $10,000/year)
- Roth IRA if you have earned income (up to $7,000/year in 2024)

The power of compound interest means starting early matters more than starting big.`,
          extraPoints: level === 'advanced' ? [
            "Build a 6-month emergency fund minimum",
            "Explore high-yield savings accounts",
            "Consider opening a Roth IRA if you have earned income"
          ] : [
            "Start with a $1,000 mini emergency fund",
            "Use high-yield savings accounts for better returns"
          ]
        }
      },
      2: {
        0: {
          intermediate: `**Income Diversification Strategies**

Don't rely on just one income source. Successful people build multiple streams:
- Active income (your job/hustle)
- Passive income (investments, royalties)
- Portfolio income (dividends, interest)

Start by adding one additional income stream to your primary source.`,
          advanced: `**Building Scalable Income**

The difference between trading time for money and scalable income is crucial. Scalable income grows without proportional time investment:
- Digital products (courses, templates, apps)
- Affiliate marketing and referral programs
- Rental income or peer-to-peer lending

Consider what skills you have that could be packaged and sold repeatedly.`,
          extraPoints: level === 'advanced' ? [
            "Identify at least 3 potential income streams",
            "Focus on one scalable income opportunity",
            "Calculate your hourly rate for different activities"
          ] : [
            "Map out your current income sources",
            "Research one new potential income stream"
          ]
        },
        1: {
          intermediate: `**SMART Goals Deep Dive**

Make your goals truly actionable:
- Break big goals into weekly milestones
- Set up automatic transfers toward savings goals
- Create accountability systems (apps, partners)

Example: Instead of "save $1,000", try "transfer $50 every Friday for 20 weeks."`,
          advanced: `**Goal Stacking and Systems**

Advanced goal-setters create systems, not just goals:
- Automate everything possible (savings, bill pay, investments)
- Use goal stacking: attach new habits to existing routines
- Track leading indicators, not just outcomes

Build systems that make success the default path.`,
          extraPoints: level === 'advanced' ? [
            "Automate at least 3 financial actions",
            "Create a habit stack for financial review",
            "Set up weekly and monthly financial checkpoints"
          ] : [
            "Break one big goal into weekly milestones",
            "Set up automatic transfers for savings"
          ]
        }
      },
      3: {
        0: {
          intermediate: `**Credit Score Deep Dive**

Your credit score is calculated from 5 factors:
- Payment history (35%) - Pay on time, every time
- Credit utilization (30%) - Keep below 30% of your limit
- Length of history (15%) - Don't close old accounts
- Credit mix (10%) - Different types help
- New credit (10%) - Don't apply too frequently

Focus on the top two factors for the biggest impact.`,
          advanced: `**Strategic Credit Building**

Advanced credit strategies for 750+ scores:
- Request credit limit increases (without hard pulls)
- Become an authorized user on a parent's old account
- Use credit for recurring bills, pay immediately
- Time your applications (only when needed)
- Dispute any errors on your credit report

Consider using a credit monitoring service to track all three bureaus.`,
          extraPoints: level === 'advanced' ? [
            "Check credit reports from all 3 bureaus annually",
            "Calculate your credit utilization ratio",
            "Create a credit-building action plan"
          ] : [
            "Sign up for free credit monitoring",
            "Understand the 5 factors affecting your score"
          ]
        }
      },
      4: {
        0: {
          intermediate: `**Debt Prioritization Methods**

Two popular approaches:
- Avalanche: Pay highest interest first (saves most money)
- Snowball: Pay smallest balance first (builds momentum)

Both work! Choose based on your personality. The avalanche is mathematically optimal, but the snowball provides faster wins.`,
          advanced: `**Advanced Debt Strategies**

Beyond basic repayment:
- Balance transfer cards (0% APR periods)
- Personal loan consolidation (lower rates)
- Negotiating with creditors (especially medical debt)
- Understanding the statute of limitations on debt

Calculate the true cost of debt including opportunity cost of those payments not being invested.`,
          extraPoints: level === 'advanced' ? [
            "Calculate total interest saved with different strategies",
            "Research balance transfer opportunities",
            "Create a debt payoff timeline with specific dates"
          ] : [
            "List all debts with interest rates",
            "Choose avalanche or snowball method"
          ]
        }
      },
      5: {
        0: {
          intermediate: `**Choosing the Right Bank Account**

Beyond just checking and savings:
- High-yield savings accounts (online banks offer 4-5% APY)
- Money market accounts (higher rates, limited transactions)
- CD laddering (stagger maturity dates for flexibility)

Compare fees, minimums, and interest rates across multiple banks.`,
          advanced: `**Banking Optimization**

Advanced banking strategies:
- Multi-bank approach: checking at one bank, savings at a high-yield bank
- Cash back checking accounts and signup bonuses
- Using brokerage sweep accounts for excess cash
- International considerations (fee-free foreign transactions)

Your banking setup should work as a system, not just individual accounts.`,
          extraPoints: level === 'advanced' ? [
            "Compare rates across 5 different savings accounts",
            "Set up a multi-bank system",
            "Optimize for both yield and convenience"
          ] : [
            "Research high-yield savings accounts",
            "Understand the difference between account types"
          ]
        }
      },
      6: {
        0: {
          intermediate: `**Investment Fundamentals**

Key concepts for beginners:
- Index funds: Own a piece of the entire market
- Dollar-cost averaging: Invest regularly regardless of price
- Time in market beats timing the market
- Diversification reduces risk without sacrificing returns

Start with a simple target-date fund or total market index fund.`,
          advanced: `**Portfolio Construction**

Building an optimized portfolio:
- Asset allocation (stocks vs bonds vs alternatives)
- Rebalancing strategies (calendar vs threshold-based)
- Tax-loss harvesting in taxable accounts
- Understanding factor investing (value, momentum, quality)

Consider the total picture: tax-advantaged accounts for growth, taxable for more stable investments.`,
          extraPoints: level === 'advanced' ? [
            "Determine your asset allocation based on time horizon",
            "Research low-cost index fund options",
            "Understand the tax implications of different account types"
          ] : [
            "Open an investment account (brokerage or Roth IRA)",
            "Research target-date funds for your retirement year"
          ]
        }
      },
      9: {
        0: {
          intermediate: `**Building a Professional Network**

Beyond just connecting:
- Follow up within 24 hours of meeting someone
- Offer value before asking for anything
- Maintain relationships with regular touchpoints
- Use LinkedIn strategically (not just job searching)

Quality connections matter more than quantity.`,
          advanced: `**Personal Brand as an Asset**

Your brand has real financial value:
- Thought leadership opens premium opportunities
- Content creation builds audience and influence
- Speaking engagements and consulting income
- Brand equity can be leveraged for ventures

Think of your personal brand as a long-term investment that compounds over time.`,
          extraPoints: level === 'advanced' ? [
            "Create a content strategy for your expertise",
            "Identify speaking or writing opportunities",
            "Build systems for maintaining your network"
          ] : [
            "Optimize your LinkedIn profile",
            "Reach out to 3 new connections this week"
          ]
        }
      },
      11: {
        0: {
          intermediate: `**Validating Business Ideas**

Before investing time and money:
- Talk to potential customers (at least 20)
- Build a minimum viable product (MVP)
- Test pricing with real purchase intent
- Calculate your break-even point

Most businesses fail because they build something nobody wants. Validate first.`,
          advanced: `**Financial Planning for Entrepreneurs**

Critical financial skills for business owners:
- Separating personal and business finances
- Understanding unit economics (customer acquisition cost, lifetime value)
- Managing cash flow vs. profit
- Building business credit separately from personal

Consider forming an LLC for liability protection and tax flexibility.`,
          extraPoints: level === 'advanced' ? [
            "Create a business financial model",
            "Research business entity types (LLC, S-Corp)",
            "Understand business tax deductions"
          ] : [
            "Interview potential customers before building",
            "Calculate startup costs and break-even point"
          ]
        }
      },
      10: {
        0: {
          intermediate: `**Resume Optimization Strategies**

Beyond basic formatting:
- Use ATS-friendly formats (many companies use automated screening)
- Include keywords from the job description
- Quantify achievements whenever possible (increased sales by 25%)
- Tailor each resume to the specific job

Consider creating a master resume with all experiences, then customize for each application.`,
          advanced: `**Strategic Job Search**

Advanced job hunting techniques:
- Target companies, not just job postings (reach out even without openings)
- Leverage LinkedIn for warm introductions
- Prepare salary negotiation strategy before the offer
- Understand the hidden job market (70%+ of jobs aren't posted)

Track your applications systematically: company, position, date applied, contact person, follow-up dates.`,
          extraPoints: level === 'advanced' ? [
            "Create an ATS-optimized resume template",
            "Build a job search tracking spreadsheet",
            "Research salary ranges before interviewing"
          ] : [
            "Learn to quantify your achievements",
            "Customize your resume for each application"
          ]
        },
        1: {
          intermediate: `**Cover Letter Mastery**

Make your cover letter stand out:
- Address the hiring manager by name (research!)
- Open with something specific about the company
- Connect your experience to their needs
- End with a clear call to action

One page maximum - quality over quantity.`,
          advanced: `**Building Your Career Capital**

Think beyond the immediate job:
- What skills will this role develop?
- What network will you build?
- How does it position you for future opportunities?
- What's the growth trajectory?

Sometimes the best job isn't the highest paying - it's the one that builds the most valuable experience.`,
          extraPoints: level === 'advanced' ? [
            "Map your career trajectory 5-10 years out",
            "Identify skill gaps and how to fill them",
            "Build relationships before you need them"
          ] : [
            "Research hiring managers before applying",
            "Create a cover letter template to customize"
          ]
        }
      },
      12: {
        0: {
          intermediate: `**Strategic Networking**

Quality over quantity:
- Focus on building genuine relationships, not collecting business cards
- Follow up within 24 hours of meeting someone
- Offer value before asking for anything
- Maintain relationships even when you don't need anything

Your network is an asset that compounds over time.`,
          advanced: `**Network as a System**

Build a networking system:
- Use a CRM or spreadsheet to track contacts
- Set reminders for regular touchpoints (birthdays, work anniversaries)
- Create content that attracts your target network
- Host events or facilitate introductions between others

The best networkers are connectors - they help others, and it comes back around.`,
          extraPoints: level === 'advanced' ? [
            "Set up a personal CRM for contact management",
            "Create a monthly networking goal",
            "Become a connector - introduce people to each other"
          ] : [
            "Follow up within 24 hours of meeting someone",
            "Offer value before asking for favors"
          ]
        },
        1: {
          intermediate: `**Informational Interviews**

The underutilized power move:
- Ask for 15-20 minutes of someone's time
- Prepare thoughtful questions about their career path
- Never directly ask for a job (but opportunities often arise)
- Send a thank you note within 24 hours

Most people love talking about their work - use this to build relationships.`,
          advanced: `**Building Your Advisory Board**

Create your personal board of advisors:
- Mentor: Someone 10+ years ahead in your field
- Peer mentor: Someone at your level for mutual support
- Sponsor: Someone who advocates for you in rooms you're not in
- Technical advisor: Expert in skills you're developing

Nurture these relationships intentionally - they're career accelerators.`,
          extraPoints: level === 'advanced' ? [
            "Identify and reach out to potential mentors",
            "Create a 'personal board' of advisors",
            "Seek sponsors, not just mentors"
          ] : [
            "Request 3 informational interviews this month",
            "Prepare a list of thoughtful questions"
          ]
        }
      },
      13: {
        0: {
          intermediate: `**Entrepreneurship Mindset**

Key traits of successful entrepreneurs:
- Bias toward action (start before you feel ready)
- Comfort with uncertainty and ambiguity
- Ability to learn from failure quickly
- Customer obsession (solve real problems)

You don't need a revolutionary idea - execution matters more than ideas.`,
          advanced: `**Building for Scale**

Think about scalability from day one:
- Can this grow without proportional time investment?
- What's the unit economics at scale?
- How do you acquire customers profitably?
- What systems need to be in place?

The best businesses create value while you sleep.`,
          extraPoints: level === 'advanced' ? [
            "Analyze unit economics of your idea",
            "Identify what doesn't scale (and what does)",
            "Build systems early, even when small"
          ] : [
            "Start small and validate before scaling",
            "Talk to customers every week"
          ]
        },
        1: {
          intermediate: `**Side Hustle to Business**

Transitioning from side project to business:
- Know your break-even point (when can you quit your day job?)
- Build savings runway (6-12 months of expenses)
- Test market demand before going full-time
- Start building systems while it's still a side hustle

Don't quit your job too early - let the business prove itself first.`,
          advanced: `**Business Model Innovation**

Different ways to structure your business:
- Product vs. service vs. hybrid
- One-time purchase vs. subscription/recurring
- B2C (consumer) vs. B2B (business) vs. B2B2C
- Marketplace vs. direct sale

The business model often matters more than the product. Choose wisely.`,
          extraPoints: level === 'advanced' ? [
            "Map out different business model options",
            "Calculate runway needed for full-time transition",
            "Study business models of companies you admire"
          ] : [
            "Know your break-even point",
            "Build 6-12 months of savings before quitting"
          ]
        }
      },
      14: {
        0: {
          intermediate: `**MVP Development**

Build the minimum viable product:
- What's the smallest version that proves your concept?
- How can you test with minimal investment?
- What's the one thing that must work perfectly?
- How quickly can you get to customer feedback?

Speed matters - the faster you learn, the faster you succeed.`,
          advanced: `**Financial Modeling for Startups**

Create a simple financial model:
- Revenue projections (conservative, moderate, aggressive)
- Cost structure (fixed vs. variable costs)
- Cash flow timeline (when does money come in vs. go out?)
- Key assumptions and what could break them

Your model won't be perfect - it's a thinking tool, not a crystal ball.`,
          extraPoints: level === 'advanced' ? [
            "Build a 12-month financial projection",
            "Identify your key assumptions and test them",
            "Understand your burn rate and runway"
          ] : [
            "Define your MVP scope clearly",
            "Set a deadline for launch (and stick to it)"
          ]
        },
        1: {
          intermediate: `**Pricing Strategy**

How to price your product or service:
- Cost-plus: Your costs + profit margin
- Value-based: What's it worth to the customer?
- Competitive: What do alternatives cost?
- Test different price points - you might be underpricing

Most first-time entrepreneurs underprice. Don't leave money on the table.`,
          advanced: `**Funding Options**

Ways to finance your venture:
- Bootstrapping (personal savings, revenue)
- Friends & family (be careful with relationships)
- Grants and competitions (free money, no equity given up)
- Angel investors (early stage, high risk tolerant)
- Venture capital (for hyper-growth businesses)

Understand the tradeoffs: bootstrapping = control but slower. Funding = faster but dilution.`,
          extraPoints: level === 'advanced' ? [
            "Research funding options for your stage",
            "Understand dilution and what you're giving up",
            "Prepare a pitch deck even if bootstrapping"
          ] : [
            "Test multiple price points",
            "Research what competitors charge"
          ]
        }
      },
      15: {
        0: {
          intermediate: `**Presentation Skills**

Deliver compelling presentations:
- Start with a hook - grab attention in the first 10 seconds
- Tell stories, not just facts
- Use visuals, not walls of text
- Practice out loud, not just in your head
- Time yourself and stay within limits

The audience remembers how you made them feel, not what you said.`,
          advanced: `**Pitching to Investors**

What investors look for:
- Team: Can you execute? Do you have relevant experience?
- Market: Is it big enough? Is it growing?
- Traction: What proof do you have? (customers, revenue, growth)
- Ask: How much do you need? What will you do with it?

Know your numbers cold. Practice tough questions. Be confident but honest.`,
          extraPoints: level === 'advanced' ? [
            "Create a 3-minute and 10-minute version of your pitch",
            "Practice answering tough investor questions",
            "Know your financials and key metrics"
          ] : [
            "Practice your presentation out loud 10 times",
            "Get feedback from people outside your field"
          ]
        },
        1: {
          intermediate: `**Handling Q&A**

Managing questions and objections:
- Listen fully before responding
- Repeat the question to confirm understanding
- It's OK to say 'I don't know, but I'll find out'
- Bridge back to your key messages
- Stay calm even with hostile questions

The Q&A often matters more than the presentation itself.`,
          advanced: `**Building in Public**

Share your journey:
- Document your progress on social media
- Be transparent about challenges (people connect with authenticity)
- Build an audience before you need them
- Turn customers into advocates

Building in public creates accountability and attracts opportunities.`,
          extraPoints: level === 'advanced' ? [
            "Start documenting your journey publicly",
            "Build an email list or social following",
            "Turn early customers into case studies"
          ] : [
            "Prepare for common objections",
            "Practice saying 'I don't know' gracefully"
          ]
        }
      },
      16: {
        0: {
          intermediate: `**The FIRE Movement**

Financial Independence, Retire Early:
- FI Number = Annual Expenses × 25
- Safe Withdrawal Rate = 4% per year
- It's about options, not necessarily retirement
- Even partial FI gives you leverage

Start calculating your FI number and working backward to monthly savings needed.`,
          advanced: `**Tax Optimization Strategies**

Legal ways to reduce your tax burden:
- Max out tax-advantaged accounts (401k, Roth IRA, HSA)
- Tax-loss harvesting in taxable accounts
- Understand capital gains (short-term vs. long-term)
- Consider tax-efficient fund placement
- Business owners: explore SEP-IRA, Solo 401k

A dollar saved in taxes is a dollar invested for your future.`,
          extraPoints: level === 'advanced' ? [
            "Calculate your personal FI number",
            "Optimize your tax-advantaged account strategy",
            "Understand tax implications of different investments"
          ] : [
            "Learn about the 4% safe withdrawal rate",
            "Calculate how much you need to save monthly"
          ]
        },
        1: {
          intermediate: `**Building Generational Wealth**

Think beyond your own lifetime:
- Teach financial literacy to family members
- Understand estate planning basics
- Consider life insurance if others depend on you
- Create family traditions around money conversations

Wealth isn't just about accumulation - it's about preservation and transfer.`,
          advanced: `**Advanced Estate Planning**

Protecting and transferring wealth:
- Wills vs. trusts (and when you need each)
- Beneficiary designations (these override your will!)
- 529 plans for education savings
- Donor-advised funds for charitable giving
- Life insurance as a wealth transfer tool

Start simple: create a will, set beneficiaries, document your wishes.`,
          extraPoints: level === 'advanced' ? [
            "Create or update your will",
            "Review all beneficiary designations",
            "Understand trust options and when they make sense"
          ] : [
            "Have money conversations with family",
            "Start documenting your financial wishes"
          ]
        }
      },
      17: {
        0: {
          intermediate: `**Work-Life Integration**

Balance is a myth - integration is the goal:
- Define what 'success' means to YOU (not society)
- Set boundaries that protect your priorities
- Build sustainable habits, not burnout cycles
- Your career is a marathon, not a sprint

Financial success means nothing if you sacrifice health and relationships.`,
          advanced: `**Designing Your Ideal Life**

Work backward from your ideal day:
- What does your perfect Tuesday look like?
- Who are you spending time with?
- What work are you doing (or not doing)?
- Where are you living?

Then figure out what financial resources you need to support that life.`,
          extraPoints: level === 'advanced' ? [
            "Write out your ideal day in detail",
            "Calculate the cost of your ideal lifestyle",
            "Identify what's blocking you from that life"
          ] : [
            "Define what success means to you personally",
            "Set one boundary to protect this week"
          ]
        },
        1: {
          intermediate: `**Continuous Learning**

Stay relevant and valuable:
- Allocate time weekly for skill development
- Follow industry trends and leaders
- Seek feedback regularly
- Be willing to unlearn and relearn

The most valuable skill is learning how to learn.`,
          advanced: `**Building Your Legacy**

Think about impact beyond wealth:
- What do you want to be remembered for?
- How can you use your resources to help others?
- What causes or communities matter to you?
- How can you mentor the next generation?

Financial independence enables you to focus on impact and meaning.`,
          extraPoints: level === 'advanced' ? [
            "Define your personal legacy goals",
            "Identify ways to give back now (not just later)",
            "Find someone to mentor"
          ] : [
            "Block weekly time for learning",
            "Identify one skill to develop this quarter"
          ]
        }
      },
      18: {
        0: {
          intermediate: `**Putting It All Together**

Your financial foundation checklist:
- Emergency fund (3-6 months expenses)
- Budget you actually follow
- Automated savings and investing
- Good credit score (670+)
- Basic insurance coverage
- Career growth plan

Review this checklist quarterly and keep improving.`,
          advanced: `**Your 10-Year Financial Plan**

Create a comprehensive roadmap:
- Year 1-2: Foundation (emergency fund, credit, budget mastery)
- Year 3-4: Acceleration (increase income, max retirement accounts)
- Year 5-6: Optimization (multiple income streams, tax strategies)
- Year 7-8: Wealth building (real estate, business investments)
- Year 9-10: FI milestone (passive income covering expenses)

Adjust timelines based on your situation - the key is having a plan.`,
          extraPoints: level === 'advanced' ? [
            "Create your personal 10-year financial plan",
            "Set annual milestones and track progress",
            "Build accountability systems for long-term goals"
          ] : [
            "Complete the financial foundation checklist",
            "Set specific goals for the next 12 months"
          ]
        },
        1: {
          intermediate: `**Your Action Plan**

What to do in the next 30 days:
- Set up automatic savings (even $50/month)
- Check your credit score
- Update your budget
- Open an investment account
- Share what you learned with someone

Action beats perfection. Start now, improve later.`,
          advanced: `**Becoming a Financial Leader**

Pay it forward:
- Teach others what you've learned
- Be open about your financial journey
- Advocate for financial education
- Build wealth with intention and purpose
- Remember: money is a tool, not the goal

You've completed this program - now go build the life you want.`,
          extraPoints: level === 'advanced' ? [
            "Commit to teaching financial literacy to others",
            "Create a personal financial dashboard",
            "Schedule quarterly financial review dates"
          ] : [
            "Take one action in the next 24 hours",
            "Share your biggest takeaway with someone"
          ]
        }
      }
    };

    const weekContent = difficultyAdditions[week];
    if (!weekContent) return null;

    const sectionContent = weekContent[sectionIndex];
    if (!sectionContent) return null;

    return {
      additionalContent: level === 'advanced' ? sectionContent.advanced : sectionContent.intermediate,
      extraPoints: sectionContent.extraPoints || []
    };
  };

  const lessonData = programId === 'COLLEGE' ? getCollegeLessonContent(weekNumber) : getLessonContent(weekNumber);
  const currentSectionData = lessonData.sections[currentSection];
  const totalSections = lessonData.sections.length;
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;
  const difficultyContent = getDifficultyContent(weekNumber, currentSection, trackLevel);

  // Submit activity response to database
  const submitActivityResponse = async () => {
    if (!activityResponse.trim()) return;

    setIsSubmittingActivity(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        // Save activity response
        await supabase
          .from('activity_responses')
          .upsert({
            user_id: user.id,
            week_number: weekNumber,
            day_number: currentDay,
            module_number: currentDay,
            response_text: activityResponse.trim(),
            submitted_at: new Date().toISOString(),
          }, { onConflict: 'user_id,week_number,day_number' });
      }
      setActivitySubmitted(true);
    } catch (err) {
      console.error('Failed to submit activity:', err);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleNext = () => {
    // Mark current section as completed
    if (!completedSections.includes(currentSection)) {
      setCompletedSections([...completedSections, currentSection]);
      // Notify parent about section completion for progress tracking
      onSectionComplete?.(currentSection, totalSections);
    }

    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      // At the last section - show activity if not already shown
      if (!showActivitySection) {
        setShowActivitySection(true);
      } else if (activitySubmitted) {
        // Activity submitted - complete the module/day
        onComplete(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'interactive':
        return Users;
      case 'reading':
      default:
        return FileText;
    }
  };

  const isLastSection = currentSection === totalSections - 1;

  return (
    <div className="w-full space-y-6 pb-6 md:pb-0">
      {/* Header - Shows Week and Day */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <div className="text-white font-bold">Week {weekNumber} • Day {currentDay}</div>
          <div className="text-white/60 text-sm">{currentDayName} – {weekTitle}</div>
        </div>
        <div className="text-white/60 text-sm">
          {showActivitySection ? 'Activity' : `${currentSection + 1}/${totalSections}`}
        </div>
      </div>

      {/* Progress */}
      <ProgressBar progress={progressPercentage} color="blue" />

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {lessonData.sections.map((section: any, index: number) => {
          const IconComponent = getSectionIcon(section.type);
          return (
            <button
              key={index}
              onClick={() => setCurrentSection(index)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                currentSection === index
                  ? 'bg-[#4A5FFF]/20 text-[#4A5FFF] border border-[#4A5FFF]/30'
                  : completedSections.includes(index)
                  ? 'bg-[#50D890]/20 text-[#50D890] border border-[#50D890]/30'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}
            >
              <div className="flex items-center gap-1">
                <IconComponent size={12} />
                <span>{index + 1}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {(() => {
            const IconComponent = getSectionIcon(currentSectionData.type);
            return <IconComponent size={20} className="text-[#4A5FFF]" />;
          })()}
          <div>
            <h3 className="text-white font-bold">{currentSectionData.title}</h3>
            <span className="text-white/40 text-xs">{currentSectionData.duration}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
            {currentSectionData.content}
          </div>
        </div>

        {/* Difficulty-specific additional content */}
        {difficultyContent?.additionalContent && (
          <div className="mb-6 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-purple-400 font-bold text-xs uppercase">
                {trackLevel === 'advanced' ? 'Advanced' : 'Intermediate'} Content
              </span>
            </div>
            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {difficultyContent.additionalContent}
            </div>
          </div>
        )}

        {/* Key Points */}
        <div className="bg-[#4A5FFF]/10 border border-[#4A5FFF]/20 rounded-lg p-4">
          <h4 className="text-[#4A5FFF] font-bold text-sm mb-3 flex items-center gap-2">
            <CheckCircle size={16} />
            Key Takeaways
          </h4>
          <ul className="space-y-2">
            {currentSectionData.keyPoints.map((point: string, index: number) => (
              <li key={index} className="text-white/70 text-sm flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-[#4A5FFF] rounded-full mt-2 flex-shrink-0"></div>
                <span>{point}</span>
              </li>
            ))}
            {/* Additional points for higher difficulty levels */}
            {difficultyContent?.extraPoints?.map((point, index) => (
              <li key={`extra-${index}`} className="text-purple-300 text-sm flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </GlassCard>

      {/* Activity Section - Shows after completing all lesson content */}
      {showActivitySection && (
        <GlassCard className="p-6 border-2 border-[#9B59B6]/30 bg-[#9B59B6]/5">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare size={20} className="text-[#9B59B6]" />
            <div>
              <h3 className="text-white font-bold">Activity / Discussion</h3>
              <span className="text-white/40 text-xs">Required to complete this module</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              {currentSectionData?.keyPoints ? (
                <>Reflect on today's lesson and answer the following: What's the most important thing you learned, and how will you apply it to your own financial life?</>
              ) : (
                <>Share your thoughts on today's module. What did you learn and how can you use it?</>
              )}
            </p>

            {!activitySubmitted ? (
              <>
                <textarea
                  value={activityResponse}
                  onChange={(e) => setActivityResponse(e.target.value)}
                  placeholder="Write your response here... (minimum 50 characters)"
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-[#9B59B6]/50"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${activityResponse.length >= 50 ? 'text-[#50D890]' : 'text-white/40'}`}>
                    {activityResponse.length}/50 characters minimum
                  </span>
                  <Button3D
                    onClick={submitActivityResponse}
                    disabled={activityResponse.length < 50 || isSubmittingActivity}
                    variant="primary"
                    className="px-6"
                  >
                    <Send size={16} className="mr-2" />
                    {isSubmittingActivity ? 'Submitting...' : 'Submit Response'}
                  </Button3D>
                </div>
              </>
            ) : (
              <div className="bg-[#50D890]/10 border border-[#50D890]/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-[#50D890] font-bold mb-2">
                  <CheckCircle size={20} />
                  Activity Submitted!
                </div>
                <p className="text-white/60 text-sm">
                  Your response has been saved and will be reviewed. Click "Complete Module" to finish Day {currentDay}.
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button3D
          onClick={handlePrevious}
          disabled={currentSection === 0 || showActivitySection}
          variant="secondary"
          className="flex-1"
        >
          {showActivitySection ? 'Activity Required' : 'Previous'}
        </Button3D>

        <Button3D
          onClick={handleNext}
          disabled={showActivitySection && !activitySubmitted}
          variant="primary"
          className="flex-1"
        >
          {showActivitySection
            ? (activitySubmitted ? 'Complete Module' : 'Submit Activity First')
            : (isLastSection ? 'Continue to Activity' : 'Next Section')}
        </Button3D>
      </div>
    </div>
  );
}
