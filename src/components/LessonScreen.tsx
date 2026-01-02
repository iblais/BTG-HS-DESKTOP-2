import { useState } from 'react';
import { ArrowLeft, CheckCircle, FileText, Video, Users } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { ProgressBar } from './ui/ProgressBar';
import { Button3D } from './ui/Button3D';

interface LessonScreenProps {
  weekNumber: number;
  weekTitle: string;
  trackLevel?: string;
  onBack: () => void;
  onComplete: (completed: boolean) => void;
}

export function LessonScreen({ weekNumber, weekTitle, trackLevel = 'beginner', onBack, onComplete }: LessonScreenProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

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

As a student athlete, you might be getting money from a bunch of different places:

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
            content: `Real talk - saving money is just like training. You don't become a great athlete overnight, and you don't build wealth overnight either. It takes discipline and doing it consistently, even when you don't feel like it.

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
            title: "Side Hustle Opportunities for Athletes",
            type: "reading",
            duration: "7 min",
            content: `Look, you're an athlete. You've got skills that regular students don't have. Why not use them to make some cash? Here are some legit ways to earn:

**Use your athletic skills:**
• Personal training - help people get in shape
• Sports camps - teach kids your sport over the summer
• Coaching younger athletes - share what you know
• Social media - post training videos, workout tips, etc.
• Sell old gear or equipment you don't use anymore

**More flexible stuff that works around practice:**
• Delivery driving - DoorDash, Uber Eats (just check NCAA rules first!)
• Write articles about sports - blogs, local newspapers
• Photography - take photos at games or events
• Pet sitting or dog walking - people always need this
• Tutor in subjects you're good at - math, science, whatever

IMPORTANT: Before you start ANY of this, check with your coach or athletic department. NCAA has rules about what you can and can't do. Don't mess up your eligibility!`,
            keyPoints: [
              "You've got skills others don't - use them",
              "Check NCAA rules BEFORE you start anything",
              "Start small, see what works, then do more",
              "Pick stuff that fits around your practice schedule"
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
            content: `Think about pro athletes - they don't just make money from playing their sport. They've got endorsements, investments, businesses, all kinds of stuff. You should think the same way about YOUR money, even if it's on a smaller scale.

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

**As an athlete:**
• You already have a built-in platform
• Your discipline and work ethic are valuable
• Use your athletic identity as part of your brand
• But don't let it be your ONLY identity`,
            keyPoints: [
              "Your brand is what people say about you when you're not there",
              "Google yourself - see what comes up",
              "Be consistent across all platforms",
              "Your athletic background is a strength - use it"
            ]
          },
          {
            title: "Building Your Online Presence",
            type: "interactive",
            duration: "7 min",
            content: `Let's clean up your online presence:

**LinkedIn (essential for careers):**
• Professional photo (no party pics)
• Clear headline: "Student Athlete | Finance Major | Future Business Leader"
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

**Leadership as an athlete:**
• You already lead by example in training
• You know how to be part of a team
• You understand discipline and commitment
• Use these experiences in job interviews

**Ways to develop leadership:**
• Take on projects others don't want
• Mentor younger students or teammates
• Volunteer for leadership roles in clubs
• Practice public speaking
• Learn to give and receive feedback`,
            keyPoints: [
              "Leadership is a skill you can develop",
              "Your athletic experience IS leadership experience",
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

**Networking as an athlete:**
• You already network with coaches, teammates, alumni
• Athletic events are great for meeting people
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

**Athlete advantages:**
• Discipline and work ethic
• Ability to handle pressure
• Experience being coached and learning
• Built-in audience and platform`,
            keyPoints: [
              "You don't need a revolutionary idea to start",
              "Start small and validate your idea first",
              "Your athletic mindset is an entrepreneurial asset",
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

The standard advice is 3-6 months of expenses. But as an athlete, consider this: injuries happen. Aim for at least 6 months, and keep it in a high-yield savings account earning 4-5% APY.

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

  const lessonData = getLessonContent(weekNumber);
  const currentSectionData = lessonData.sections[currentSection];
  const totalSections = lessonData.sections.length;
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;
  const difficultyContent = getDifficultyContent(weekNumber, currentSection, trackLevel);

  const handleNext = () => {
    // Mark current section as completed
    if (!completedSections.includes(currentSection)) {
      setCompletedSections([...completedSections, currentSection]);
    }

    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      // Lesson completed
      onComplete(true);
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <div className="text-white font-bold">Week {weekNumber}</div>
          <div className="text-white/60 text-sm">{weekTitle}</div>
        </div>
        <div className="text-white/60 text-sm">
          {currentSection + 1}/{totalSections}
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

      {/* Navigation */}
      <div className="flex gap-3">
        <Button3D
          onClick={handlePrevious}
          disabled={currentSection === 0}
          variant="secondary"
          className="flex-1"
        >
          Previous
        </Button3D>

        <Button3D
          onClick={handleNext}
          variant="primary"
          className="flex-1"
        >
          {isLastSection ? 'Complete Lesson' : 'Next Section'}
        </Button3D>
      </div>
    </div>
  );
}
