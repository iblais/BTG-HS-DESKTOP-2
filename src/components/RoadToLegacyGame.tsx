import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface RoadToLegacyGameProps {
  onBack: () => void;
  savedProgress?: RoadToLegacyProgress;
  onSaveProgress?: (progress: RoadToLegacyProgress) => void;
}

interface RoadToLegacyProgress {
  selectedRole: Role | null;
  playerStats: PlayerStats;
  currentScenarioIndex: number;
  completedScenarios: number[];
  gameScreen: GameScreen;
}

type GameScreen = 'onboarding' | 'gameplay' | 'results' | 'dashboard';

interface PlayerStats {
  money: number;
  health: number;
  energy: number;
  grades: number;
  coachTrust: number;
  relationships: number;
  community: number;
  scholarship: number;
}

interface Choice {
  emoji: string;
  title: string;
  description: string;
  type: 'responsible' | 'balanced' | 'risky';
  consequences: {
    text: string;
    statChanges: Partial<PlayerStats>;
    educationalFact?: string;
  };
}

interface Scenario {
  id: number;
  emoji: string;
  category: string;
  title: string;
  description: string;
  context?: string;
  choices: [Choice, Choice, Choice];
}

interface Role {
  id: string;
  name: string;
  emoji: string;
  startingStats: PlayerStats;
  description: string[];
}

const roles: Role[] = [
  {
    id: 'athlete',
    name: 'Student-Athlete',
    emoji: '🏃‍♂️',
    startingStats: { money: 500, health: 80, energy: 70, grades: 75, coachTrust: 70, relationships: 60, community: 50, scholarship: 60 },
    description: ['Juggling sports and school', 'Always switching between practice and homework', 'Dealing with team drama and pressure']
  },
  {
    id: 'foster',
    name: 'Foster Youth',
    emoji: '🏠',
    startingStats: { money: 200, health: 60, energy: 50, grades: 65, coachTrust: 80, relationships: 40, community: 70, scholarship: 40 },
    description: ['Not much family support to lean on', 'Hungry to make it and prove yourself', 'Your community has your back']
  },
  {
    id: 'working',
    name: 'Working Student',
    emoji: '💼',
    startingStats: { money: 800, health: 65, energy: 40, grades: 60, coachTrust: 60, relationships: 50, community: 55, scholarship: 50 },
    description: ['Grinding between your job and classes', 'Making your own money, handling your own bills', 'Never enough hours in the day']
  },
  {
    id: 'justice',
    name: 'Justice-Impacted',
    emoji: '⚖️',
    startingStats: { money: 300, health: 70, energy: 60, grades: 55, coachTrust: 50, relationships: 45, community: 60, scholarship: 35 },
    description: ['Working through your past every day', 'Gotta show people you\'re more than your mistakes', 'Built different - nothing can break you']
  }
];

// Role-specific scenarios
const athleteScenarios: Scenario[] = [
  {
    id: 1,
    emoji: '🏃',
    category: 'Athletic',
    title: 'NIL Deal Opportunity',
    description: 'A local car dealership wants to pay you $5,000 to post about them on social media and appear at events. Your coach warns it might distract from training, but that money could really help your family.',
    context: 'Your scholarship covers tuition but not living expenses. You currently work 10 hours/week.',
    choices: [
      {
        emoji: '🛡️',
        title: 'Decline the deal',
        description: 'Focus 100% on your sport and grades',
        type: 'responsible',
        consequences: {
          text: 'You turned it down and your coach was impressed by your focus. Your performance improved and you caught the eye of bigger scouts. Sometimes the best opportunities come from patience.',
          statChanges: { money: 0, coachTrust: 25, scholarship: 15, energy: 10 },
          educationalFact: 'Athletes who prioritize development over early NIL money often get bigger deals later. Your value increases with your performance.'
        }
      },
      {
        emoji: '⚠️',
        title: 'Negotiate limited involvement',
        description: 'Accept but set strict boundaries',
        type: 'balanced',
        consequences: {
          text: 'You negotiated 2 posts per month and 1 event per quarter. The extra $3,000 helps with bills without crushing your schedule. Smart move balancing both worlds.',
          statChanges: { money: 300, coachTrust: 5, energy: -5, relationships: 10 },
          educationalFact: 'Successful NIL athletes set clear boundaries. Time management is key - your athletic career should always come first.'
        }
      },
      {
        emoji: '💸',
        title: 'Go all in on the deal',
        description: 'Take the full $5,000 and all commitments',
        type: 'risky',
        consequences: {
          text: 'The money was nice but the 20+ hours of commitments destroyed your training schedule. Your performance dropped and coach benched you. Was it worth it?',
          statChanges: { money: 500, coachTrust: -30, scholarship: -20, energy: -25, grades: -15 },
          educationalFact: 'Many athletes lose scholarships chasing NIL money. Remember: your athletic ability IS your NIL value. Protect it first.'
        }
      }
    ]
  },
  {
    id: 2,
    emoji: '🍽️',
    category: 'Nutrition',
    title: 'Meal Plan Crisis',
    description: 'Your meal plan ran out 2 weeks before the semester ends. The athletic dining hall is closed for renovations. You need to figure out how to eat properly to maintain your training.',
    context: 'You have $150 left for the month. Proper nutrition is crucial for your upcoming championship.',
    choices: [
      {
        emoji: '🥗',
        title: 'Meal prep on a budget',
        description: 'Buy groceries and cook healthy meals',
        type: 'responsible',
        consequences: {
          text: 'You learned to cook! Rice, beans, chicken, and veggies kept you fueled. Your teammates started asking for recipes. You spent $120 and ate better than the dining hall.',
          statChanges: { money: -120, health: 20, energy: 15, community: 10 },
          educationalFact: 'Athletes who meal prep save 40-60% on food costs while having more control over their nutrition. It\'s a life skill that pays off forever.'
        }
      },
      {
        emoji: '🤝',
        title: 'Ask teammates to share',
        description: 'See if friends with remaining meals can help',
        type: 'balanced',
        consequences: {
          text: 'Your teammates came through - everyone shared guest passes and leftovers. It brought the team closer together. You learned asking for help isn\'t weakness.',
          statChanges: { money: -50, relationships: 20, community: 15, health: 5 },
          educationalFact: 'Building a support network is crucial for athletes. Teams that share resources and help each other perform better overall.'
        }
      },
      {
        emoji: '🍔',
        title: 'Survive on fast food',
        description: 'It\'s cheap and easy, you\'ll manage',
        type: 'risky',
        consequences: {
          text: 'Dollar menus seemed smart until your energy crashed. You felt sluggish at practice and your times got worse. Coach noticed and wasn\'t happy.',
          statChanges: { money: -100, health: -25, energy: -20, coachTrust: -15 },
          educationalFact: 'Poor nutrition can decrease athletic performance by 20-30%. What you eat directly impacts your speed, strength, and recovery.'
        }
      }
    ]
  },
  {
    id: 3,
    emoji: '🎓',
    category: 'Academic',
    title: 'Tutor or Training?',
    description: 'You\'re struggling in your required math class and might lose eligibility. A tutor costs $50/hour but you also have extra practice sessions coach wants you at.',
    context: 'You need a C to stay eligible. You currently have a D+. Final exam is in 2 weeks.',
    choices: [
      {
        emoji: '📚',
        title: 'Prioritize tutoring',
        description: 'Skip some practices for study sessions',
        type: 'responsible',
        consequences: {
          text: 'You talked to coach honestly about your grades. They respected it and gave you modified practice times. You got a B- on the final and stayed eligible!',
          statChanges: { money: -150, grades: 25, coachTrust: 10, scholarship: 20 },
          educationalFact: 'NCAA athletes who use academic support services have a 15% higher graduation rate. Coaches respect players who handle their business.'
        }
      },
      {
        emoji: '⚖️',
        title: 'Balance both somehow',
        description: 'Study late nights, never miss practice',
        type: 'balanced',
        consequences: {
          text: 'You ran on 4 hours of sleep for two weeks. Passed the class with a C but felt destroyed. Your body took weeks to recover from the exhaustion.',
          statChanges: { money: -100, grades: 10, health: -20, energy: -25 },
          educationalFact: 'Sleep deprivation hurts athletic performance as much as being legally drunk. Recovery is when your body actually builds strength.'
        }
      },
      {
        emoji: '🏃',
        title: 'Focus only on athletics',
        description: 'You\'ll figure out the grades somehow',
        type: 'risky',
        consequences: {
          text: 'You failed the final and lost eligibility for next semester. All that practice meant nothing when you couldn\'t even play. The whole team was affected.',
          statChanges: { money: 0, grades: -30, coachTrust: -25, scholarship: -40, relationships: -15 },
          educationalFact: 'About 2% of college athletes go pro. Your degree is your real long-term investment. Don\'t sacrifice it for short-term athletic focus.'
        }
      }
    ]
  },
  {
    id: 4,
    emoji: '🏥',
    category: 'Health',
    title: 'Playing Through Pain',
    description: 'Your ankle has been hurting for weeks but you\'ve been hiding it. Championship game is Saturday. The trainer suspects something\'s wrong and wants to do imaging.',
    context: 'If you\'re injured, you might miss the biggest game of the season. Scouts will be watching.',
    choices: [
      {
        emoji: '🏥',
        title: 'Get it checked out',
        description: 'Be honest with medical staff',
        type: 'responsible',
        consequences: {
          text: 'Turns out it was a stress fracture. Missing the game hurt, but the doctor said playing would\'ve ended your season - maybe your career. You came back stronger.',
          statChanges: { health: 30, coachTrust: 15, scholarship: 10 },
          educationalFact: 'Playing through injuries causes 60% of career-ending damage in college sports. One game is never worth your entire future.'
        }
      },
      {
        emoji: '💊',
        title: 'Get treatment but still play',
        description: 'Heavy tape, painkillers, and hope',
        type: 'balanced',
        consequences: {
          text: 'You played at 70% but your team won. However, the injury got worse and you missed the next month. The scouts noticed you weren\'t yourself.',
          statChanges: { health: -15, coachTrust: 5, relationships: 10, scholarship: -10 },
          educationalFact: 'Painkillers mask problems, they don\'t fix them. Many athletes develop long-term issues from playing injured.'
        }
      },
      {
        emoji: '🤫',
        title: 'Hide it completely',
        description: 'You\'ve played through worse',
        type: 'risky',
        consequences: {
          text: 'You made it worse during warmups and collapsed on the field. Emergency surgery. Season over. The team lost without you and scouts wrote you off.',
          statChanges: { health: -40, coachTrust: -30, scholarship: -35, energy: -30 },
          educationalFact: 'Hidden injuries that become catastrophic are the #1 reason promising athletic careers end early. Trust your medical team.'
        }
      }
    ]
  },
  {
    id: 5,
    emoji: '👨‍👩‍👧',
    category: 'Family',
    title: 'Family Financial Emergency',
    description: 'Your mom calls crying - she lost her job and rent is due. She needs $800 or they might get evicted. You have $1,000 saved from your part-time job.',
    context: 'That money was supposed to cover your summer training camp registration.',
    choices: [
      {
        emoji: '❤️',
        title: 'Send the money',
        description: 'Family comes first, always',
        type: 'responsible',
        consequences: {
          text: 'You sent $800 and your mom cried happy tears. You found a free local training program instead. Coach connected you with a booster who covered camp costs when they heard your story.',
          statChanges: { money: -800, community: 25, relationships: 30, coachTrust: 15 },
          educationalFact: 'Many successful athletes came from difficult backgrounds. Using your resources to help family while finding alternative paths shows character scouts value.'
        }
      },
      {
        emoji: '⚖️',
        title: 'Send half, find other help',
        description: 'Help research assistance programs too',
        type: 'balanced',
        consequences: {
          text: 'You sent $400 and spent hours helping mom find emergency rental assistance. Together you figured it out. You learned about resources you never knew existed.',
          statChanges: { money: -400, relationships: 20, community: 15, grades: 5 },
          educationalFact: 'Emergency rental assistance programs exist in most areas. Knowing about community resources helps you and everyone you care about.'
        }
      },
      {
        emoji: '😔',
        title: 'Say you can\'t help',
        description: 'You need that money for your future',
        type: 'risky',
        consequences: {
          text: 'You kept the money but the guilt destroyed your focus. Your family found help elsewhere but the relationship is strained. Was training camp worth it?',
          statChanges: { money: 0, relationships: -30, health: -15, energy: -20 },
          educationalFact: 'Mental health directly impacts athletic performance. Family stress you ignore doesn\'t go away - it shows up in your game.'
        }
      }
    ]
  }
];

const fosterScenarios: Scenario[] = [
  {
    id: 1,
    emoji: '🏠',
    category: 'Housing',
    title: 'Aging Out Crisis',
    description: 'You\'re about to turn 21 and age out of extended foster care. Your social worker says you need to find housing in 60 days. You have $2,000 saved from your job.',
    context: 'Average rent in your area is $1,200/month. You make $1,800/month at your job.',
    choices: [
      {
        emoji: '🔍',
        title: 'Research transitional housing',
        description: 'Look into programs for former foster youth',
        type: 'responsible',
        consequences: {
          text: 'You found a transitional living program that charges only $400/month and provides life skills classes. You\'ll have 2 years to save and prepare for full independence.',
          statChanges: { money: 100, community: 25, health: 15, energy: 20 },
          educationalFact: 'Over 25,000 youth age out of foster care yearly. Those who use transitional programs are 3x more likely to achieve housing stability.'
        }
      },
      {
        emoji: '👥',
        title: 'Find roommates',
        description: 'Split costs with coworkers or classmates',
        type: 'balanced',
        consequences: {
          text: 'You found two roommates and a 3-bedroom for $1,800 total. Your share is $600 - tight but manageable. Learning to live with others has its challenges but you\'re making it work.',
          statChanges: { money: -200, relationships: 15, community: 10, energy: -5 },
          educationalFact: 'Roommate living situations save an average of $5,000+ per year. It\'s also a great way to build your support network.'
        }
      },
      {
        emoji: '🚗',
        title: 'Live in your car temporarily',
        description: 'Save money until you can afford a place',
        type: 'risky',
        consequences: {
          text: 'You tried to save money but living in your car destroyed your health and work performance. You got fired for showing up exhausted. Now you have no income AND no home.',
          statChanges: { money: -500, health: -35, energy: -40, grades: -25 },
          educationalFact: 'Vehicle living leads to job loss 70% of the time within 3 months. Always explore assistance programs before this becomes your plan.'
        }
      }
    ]
  },
  {
    id: 2,
    emoji: '📋',
    category: 'Benefits',
    title: 'Education Benefits Expiring',
    description: 'You have Chafee Grant money that expires when you turn 26. You\'re 24 with 2 years of college left. Should you rush to finish or take your time?',
    context: 'The grant covers $5,000/year for tuition. You\'re working 30 hours/week to pay bills.',
    choices: [
      {
        emoji: '📚',
        title: 'Maximize the benefit',
        description: 'Full-time student to finish before 26',
        type: 'responsible',
        consequences: {
          text: 'You went full-time and used every dollar of that grant. It was intense but you graduated debt-free at 25. That $10,000 in savings changed your whole financial future.',
          statChanges: { money: 500, grades: 20, energy: -15, scholarship: 25 },
          educationalFact: 'Foster youth who complete degrees earn $12,000 more per year on average. Using every benefit available is smart, not desperate.'
        }
      },
      {
        emoji: '⚖️',
        title: 'Balance work and school',
        description: 'Part-time student, keep full income',
        type: 'balanced',
        consequences: {
          text: 'You got one more year of the grant before it expired. You\'ll have some loans to finish, but you also built work experience and savings. Trade-offs are real.',
          statChanges: { money: 100, grades: 5, energy: 5, relationships: 10 },
          educationalFact: 'Not everyone can go full-time, and that\'s okay. Part-time students who finish still see major income increases.'
        }
      },
      {
        emoji: '💼',
        title: 'Focus on work instead',
        description: 'You\'re making good money now',
        type: 'risky',
        consequences: {
          text: 'You let the grant expire and kept working. Two years later, your job hit a ceiling. Without a degree, promotions went to others. You regret not finishing.',
          statChanges: { money: 200, grades: -20, community: -10, scholarship: -30 },
          educationalFact: 'Bachelor\'s degree holders earn 67% more than high school graduates over their lifetime. Free money for school is worth the sacrifice.'
        }
      }
    ]
  },
  {
    id: 3,
    emoji: '💳',
    category: 'Financial',
    title: 'Building Credit from Zero',
    description: 'You have no credit history because you were never added to anyone\'s accounts. A bank is offering a secured credit card with a $300 deposit. Your savings account has $800.',
    context: 'Good credit is needed for apartments, car loans, even some jobs. But you can\'t afford mistakes.',
    choices: [
      {
        emoji: '🏦',
        title: 'Get the secured card',
        description: 'Use it only for gas, pay it off monthly',
        type: 'responsible',
        consequences: {
          text: 'You used it only for $50 in gas each month and paid it off immediately. After a year, your credit score hit 680. Doors started opening that were always closed before.',
          statChanges: { money: -50, community: 20, energy: 10 },
          educationalFact: 'Secured cards are the safest way to build credit from zero. On-time payments for 6 months can boost your score by 100+ points.'
        }
      },
      {
        emoji: '👥',
        title: 'Ask a mentor to add you',
        description: 'See if someone will add you as authorized user',
        type: 'balanced',
        consequences: {
          text: 'Your former foster parent agreed to add you to their oldest card. You got their good payment history and your score jumped to 650 immediately.',
          statChanges: { money: 0, relationships: 15, community: 15 },
          educationalFact: 'Being added as an authorized user can instantly give you credit history. It\'s a powerful shortcut if you have someone who trusts you.'
        }
      },
      {
        emoji: '🚫',
        title: 'Avoid credit completely',
        description: 'You\'ve seen debt destroy people',
        type: 'risky',
        consequences: {
          text: 'You stayed debt-free but also credit-invisible. When you needed an apartment, landlords rejected you. When you needed a car loan, rates were insane. No credit is almost as bad as bad credit.',
          statChanges: { money: 0, community: -15, energy: -10 },
          educationalFact: 'Having no credit history costs you thousands in higher interest rates and deposits. Building credit responsibly is essential for financial independence.'
        }
      }
    ]
  },
  {
    id: 4,
    emoji: '🤝',
    category: 'Support',
    title: 'Reconnecting with Bio Family',
    description: 'Your biological mom found you on social media. She wants to meet and says she\'s changed. Your foster family who supported you is worried about you getting hurt again.',
    context: 'You have complicated feelings. Part of you wants answers. Part of you is scared.',
    choices: [
      {
        emoji: '☕',
        title: 'Meet in a public place',
        description: 'Coffee shop, keep expectations low',
        type: 'responsible',
        consequences: {
          text: 'You met for coffee with realistic expectations. She apologized and explained her struggles. You\'re not best friends, but you got some closure. You set boundaries for future contact.',
          statChanges: { health: 20, relationships: 10, energy: 15 },
          educationalFact: 'Reconnecting with birth family can provide closure, but boundaries are essential. Many foster youth find healing in understanding, not necessarily in rebuilding relationships.'
        }
      },
      {
        emoji: '✋',
        title: 'Wait and observe first',
        description: 'Keep texting but don\'t meet yet',
        type: 'balanced',
        consequences: {
          text: 'You texted for 3 months first. When patterns started repeating, you were glad you didn\'t invest more. Not everyone changes, but now you know for sure.',
          statChanges: { health: 10, energy: 5, community: 10 },
          educationalFact: 'Time reveals patterns. Protecting yourself while gathering information is smart, not cold. Your mental health comes first.'
        }
      },
      {
        emoji: '🚪',
        title: 'Let her move in to help',
        description: 'She says she\'s homeless and needs you',
        type: 'risky',
        consequences: {
          text: 'Within weeks, she stole your savings and disappeared. You lost $1,500 and had to move because the lease was violated. Some people use blood ties to manipulate.',
          statChanges: { money: -600, health: -30, relationships: -20, energy: -25 },
          educationalFact: 'Financial abuse within families is common. Protect your resources until trust is established over time through actions, not words.'
        }
      }
    ]
  },
  {
    id: 5,
    emoji: '📱',
    category: 'Career',
    title: 'Job Offer Dilemma',
    description: 'You got two job offers: A stable government job with benefits paying $40,000, or a startup paying $55,000 but no benefits and they might fail in a year.',
    context: 'You have no safety net. If something goes wrong, you have no family to fall back on.',
    choices: [
      {
        emoji: '🏛️',
        title: 'Take the government job',
        description: 'Stability and benefits are priceless',
        type: 'responsible',
        consequences: {
          text: 'The stability changed everything. Health insurance meant you finally addressed old health issues. The pension means you\'ll actually be able to retire. You sleep peacefully now.',
          statChanges: { money: 150, health: 25, energy: 20, community: 15 },
          educationalFact: 'Benefits can be worth $10,000-15,000 in additional value. For foster youth without safety nets, stability often beats higher base pay.'
        }
      },
      {
        emoji: '🎲',
        title: 'Take the startup risk',
        description: 'High risk, high reward potential',
        type: 'balanced',
        consequences: {
          text: 'The startup succeeded! You got stock options worth $30,000. But the year of no health insurance meant you ignored a health issue that became serious. Was it worth it?',
          statChanges: { money: 350, health: -20, energy: -10, community: 5 },
          educationalFact: 'Startup success stories are exciting but rare. 90% of startups fail within 5 years. Risk tolerance should match your safety net.'
        }
      },
      {
        emoji: '🤷',
        title: 'Keep looking for perfect',
        description: 'Neither feels quite right',
        type: 'risky',
        consequences: {
          text: 'You declined both offers. The government job filled quickly. The startup hired someone else. You spent 6 more months job hunting with dwindling savings. Perfect is the enemy of good.',
          statChanges: { money: -400, energy: -25, health: -15 },
          educationalFact: 'Analysis paralysis costs opportunities. When you have no safety net, a good opportunity now beats a maybe-perfect opportunity later.'
        }
      }
    ]
  }
];

const workingStudentScenarios: Scenario[] = [
  {
    id: 1,
    emoji: '⏰',
    category: 'Work-Life',
    title: 'Manager Wants More Hours',
    description: 'Your manager loves your work and wants to promote you to assistant manager - but it requires 40 hours/week. You\'re currently doing 25 hours while taking 12 credits.',
    context: 'The promotion comes with a $3/hour raise. But you might have to drop to part-time student.',
    choices: [
      {
        emoji: '📚',
        title: 'Decline, prioritize school',
        description: 'Explain your education goals',
        type: 'responsible',
        consequences: {
          text: 'Your manager respected your decision and promised the opportunity would come again. You graduated on time and got an even better job with your degree. Long game won.',
          statChanges: { money: 50, grades: 20, coachTrust: 15, energy: 10 },
          educationalFact: 'Degree holders earn $1 million more over their lifetime than non-degree holders. Staying on track with education usually pays off.'
        }
      },
      {
        emoji: '⚖️',
        title: 'Negotiate a compromise',
        description: 'Maybe 32 hours and summer increase',
        type: 'balanced',
        consequences: {
          text: 'You negotiated 32 hours during school, 45 during breaks. You dropped one class but still graduate only one semester late. The management experience looks great on your resume.',
          statChanges: { money: 200, grades: -5, energy: -10, relationships: 10 },
          educationalFact: 'Management experience while in school makes you more employable. Finding creative compromises shows leadership skills.'
        }
      },
      {
        emoji: '💼',
        title: 'Take the full promotion',
        description: 'Money now, finish school later',
        type: 'risky',
        consequences: {
          text: 'You took the job and dropped to 2 classes. Two years later, you\'re still just an assistant manager with 6 more classes to finish. "Later" became "much later."',
          statChanges: { money: 300, grades: -25, energy: -20, scholarship: -30 },
          educationalFact: '60% of students who go part-time never finish their degree. Life keeps happening and school keeps getting pushed back.'
        }
      }
    ]
  },
  {
    id: 2,
    emoji: '📝',
    category: 'Academic',
    title: 'Group Project Conflict',
    description: 'Your group wants to meet Sunday at 2pm - your only shift where you get time-and-a-half pay. Missing it costs you $150 and might upset your manager.',
    context: 'This project is 30% of your grade. The group refuses to meet any other time.',
    choices: [
      {
        emoji: '💬',
        title: 'Communicate with both sides',
        description: 'Ask manager for shift swap, explain to group',
        type: 'responsible',
        consequences: {
          text: 'Your manager let you swap shifts. You explained your work situation to the group and they found a better time for everyone. Communication solved everything.',
          statChanges: { money: 100, grades: 15, relationships: 15, coachTrust: 10 },
          educationalFact: 'Clear communication about constraints usually leads to solutions. Most people are more flexible than you assume if you just ask.'
        }
      },
      {
        emoji: '📺',
        title: 'Join remotely during break',
        description: 'Video call during your lunch break',
        type: 'balanced',
        consequences: {
          text: 'You joined via Zoom during your 30-minute break. It was chaotic but you contributed. The group was annoyed but the project got done. B+ final grade.',
          statChanges: { money: 150, grades: 5, relationships: -5, energy: -10 },
          educationalFact: 'Remote participation isn\'t ideal but shows commitment. In the professional world, flexibility is often necessary.'
        }
      },
      {
        emoji: '🚫',
        title: 'Skip the meeting',
        description: 'Money matters more right now',
        type: 'risky',
        consequences: {
          text: 'The group was furious and did the project without you. You got a D because they gave you bad peer reviews. The professor flagged you. $150 but a damaged grade and reputation.',
          statChanges: { money: 150, grades: -25, relationships: -20, community: -15 },
          educationalFact: 'Group project peer reviews affect 20-30% of your grade. Burning bridges with classmates can hurt you in unexpected ways later.'
        }
      }
    ]
  },
  {
    id: 3,
    emoji: '😴',
    category: 'Health',
    title: 'Burnout Warning Signs',
    description: 'You\'ve been working 30 hours, taking 15 credits, and sleeping 5 hours a night. You\'re constantly sick, your grades are slipping, and you snapped at a customer.',
    context: 'You can\'t afford to lose this job. You also can\'t afford to fail classes.',
    choices: [
      {
        emoji: '✂️',
        title: 'Cut back somewhere',
        description: 'Reduce hours OR credits next semester',
        type: 'responsible',
        consequences: {
          text: 'You dropped to 12 credits and started sleeping 7 hours. Your grades improved, your health recovered, and your manager noticed you were sharper at work. Sustainable beats intense.',
          statChanges: { health: 30, grades: 15, energy: 25, money: -100 },
          educationalFact: 'Chronic sleep deprivation decreases cognitive function by 25%. You literally think worse when you don\'t sleep.'
        }
      },
      {
        emoji: '📅',
        title: 'Try better scheduling',
        description: 'Maybe you just need to organize better',
        type: 'balanced',
        consequences: {
          text: 'You got a planner and tried to optimize everything. It helped a little, but you can\'t schedule your way out of physics. You survived the semester but barely.',
          statChanges: { health: 5, grades: 5, energy: 5 },
          educationalFact: 'Organization helps, but there are only 24 hours in a day. Sometimes the answer is doing less, not doing it better.'
        }
      },
      {
        emoji: '☕',
        title: 'Power through with caffeine',
        description: 'You can rest after graduation',
        type: 'risky',
        consequences: {
          text: 'You ended up in the hospital with heart palpitations from too much caffeine. Missed a week of work and school. The medical bill was $800. Your body has limits.',
          statChanges: { health: -35, money: -300, grades: -20, energy: -30 },
          educationalFact: 'Burnout-related health issues cost American students $2 billion annually. Your body will force you to rest one way or another.'
        }
      }
    ]
  },
  {
    id: 4,
    emoji: '💰',
    category: 'Financial',
    title: 'Paycheck vs. Textbooks',
    description: 'Your paycheck is $600. Rent is $500. You need $200 in textbooks. You have $50 in savings. Something has to give.',
    context: 'You could ask for an advance, find free textbook alternatives, or short rent.',
    choices: [
      {
        emoji: '📖',
        title: 'Find free alternatives',
        description: 'Library reserves, PDFs, older editions',
        type: 'responsible',
        consequences: {
          text: 'You found library copies for 2 books and a PDF for the third. Spent $0 on books this semester. The library reserve desk became your second home but it worked.',
          statChanges: { money: 200, grades: 10, energy: -5, community: 10 },
          educationalFact: '70% of required textbooks are available through legal free alternatives. Librarians are your best resource for finding them.'
        }
      },
      {
        emoji: '💵',
        title: 'Ask for a paycheck advance',
        description: 'Explain the situation to your manager',
        type: 'balanced',
        consequences: {
          text: 'Your manager gave you a $150 advance. You bought the books but next paycheck was short. It helped now but you\'re still playing catch-up.',
          statChanges: { money: -50, grades: 5, coachTrust: -5, energy: -5 },
          educationalFact: 'Paycheck advances can help in emergencies but create a cycle. Use them sparingly and have a plan to break even.'
        }
      },
      {
        emoji: '🏠',
        title: 'Pay rent late',
        description: 'Most landlords give a grace period',
        type: 'risky',
        consequences: {
          text: 'The late fee was $75. Your landlord marked your record. When lease renewal came, they raised your rent $100/month citing "payment history." Short-term thinking cost you long-term.',
          statChanges: { money: -250, community: -15, health: -10, energy: -15 },
          educationalFact: 'Late rent payments stay on your record. Future landlords check payment history, and bad marks can mean higher deposits or denials.'
        }
      }
    ]
  },
  {
    id: 5,
    emoji: '🎓',
    category: 'Career',
    title: 'Unpaid Internship Opportunity',
    description: 'You got offered an amazing unpaid internship in your field - 20 hours/week for 3 months. It could lead to a real job after graduation. But you need income to survive.',
    context: 'You currently work retail for $15/hour. The internship would look incredible on your resume.',
    choices: [
      {
        emoji: '🔄',
        title: 'Restructure everything',
        description: 'Keep some work hours, take internship',
        type: 'responsible',
        consequences: {
          text: 'You dropped to 15 retail hours, took the internship, and picked up weekend gig work. It was exhausting but the internship led to a job offer paying $25/hour more than retail.',
          statChanges: { money: -200, grades: 10, community: 25, energy: -20 },
          educationalFact: 'Relevant experience increases starting salary by 10-15%. Short-term sacrifice often leads to long-term gains.'
        }
      },
      {
        emoji: '💰',
        title: 'Negotiate for payment',
        description: 'Ask if they can offer any compensation',
        type: 'balanced',
        consequences: {
          text: 'They couldn\'t pay but offered a $500 stipend and flexible hours. You made it work with adjusted retail shifts. Not ideal but you got the experience.',
          statChanges: { money: -100, community: 15, energy: -10, relationships: 10 },
          educationalFact: 'Always negotiate. Many companies have funds for intern stipends they don\'t advertise. You won\'t know unless you ask.'
        }
      },
      {
        emoji: '✋',
        title: 'Decline the internship',
        description: 'You can\'t afford to work for free',
        type: 'risky',
        consequences: {
          text: 'You kept your retail job and graduated without relevant experience. Job hunting took 8 months longer. That internship person got hired immediately.',
          statChanges: { money: 100, community: -20, grades: 5, energy: 5 },
          educationalFact: 'Unpaid internships are unfair, but they still provide access. Finding creative ways to do both often beats refusing entirely.'
        }
      }
    ]
  }
];

const justiceImpactedScenarios: Scenario[] = [
  {
    id: 1,
    emoji: '📝',
    category: 'Employment',
    title: 'The Application Question',
    description: 'You\'re applying for a great job. The application asks "Have you ever been convicted of a crime?" You have a record from when you were 19. Do you answer honestly?',
    context: 'The job doesn\'t require a background check, but lying on applications is grounds for termination if discovered later.',
    choices: [
      {
        emoji: '✅',
        title: 'Answer honestly',
        description: 'Explain briefly and move forward',
        type: 'responsible',
        consequences: {
          text: 'You answered yes with a brief explanation of your growth. They called you for an interview. Your honesty impressed them and they hired you. They valued your integrity.',
          statChanges: { money: 200, community: 25, coachTrust: 20, energy: 15 },
          educationalFact: 'Ban-the-box laws help, but honesty when asked builds trust. Many employers value redemption stories when presented professionally.'
        }
      },
      {
        emoji: '📞',
        title: 'Call HR first',
        description: 'Ask about their policy before applying',
        type: 'balanced',
        consequences: {
          text: 'You called and learned they only consider offenses from the last 5 years. Yours was 7 years ago. You confidently checked "No" and got the job legally and ethically.',
          statChanges: { money: 200, community: 15, energy: 10 },
          educationalFact: 'Many companies have specific policies about what counts. Asking HR before applying can save stress and ensure you answer correctly.'
        }
      },
      {
        emoji: '🤫',
        title: 'Just say no',
        description: 'It was years ago, no one will know',
        type: 'risky',
        consequences: {
          text: 'You got hired, but 6 months later a routine check revealed your record. Terminated for dishonesty. Now you have a gap AND a reputation for lying.',
          statChanges: { money: -300, community: -25, coachTrust: -30, relationships: -20 },
          educationalFact: 'Background checks can happen anytime. Getting fired for lying is worse for your future than having a record. Honesty protects you.'
        }
      }
    ]
  },
  {
    id: 2,
    emoji: '🏠',
    category: 'Housing',
    title: 'Rental Application Denied',
    description: 'Your rental application was denied due to your background check. The apartment was perfect and affordable. You have 2 weeks before your current lease ends.',
    context: 'You have good income, references, and rental history. But the conviction shows up.',
    choices: [
      {
        emoji: '📄',
        title: 'Request reconsideration',
        description: 'Write a letter with character references',
        type: 'responsible',
        consequences: {
          text: 'You wrote a professional letter with references from your employer and previous landlord. The property manager reconsidered and approved you. Advocacy for yourself works.',
          statChanges: { community: 20, energy: 10, relationships: 15, coachTrust: 15 },
          educationalFact: 'Many landlords have discretion. A well-written letter showing rehabilitation can change decisions. Don\'t give up after the first no.'
        }
      },
      {
        emoji: '🔍',
        title: 'Look for fair-chance housing',
        description: 'Find landlords who welcome second chances',
        type: 'balanced',
        consequences: {
          text: 'You found a fair-chance housing program. The apartment wasn\'t as nice, but the landlord understood your situation and became a mentor. Sometimes the detour is the path.',
          statChanges: { community: 15, relationships: 20, energy: 5 },
          educationalFact: 'Fair-chance housing programs exist in most cities. These landlords often become advocates for their tenants\' success.'
        }
      },
      {
        emoji: '😤',
        title: 'Give up on legitimate housing',
        description: 'Crash with friends, figure it out',
        type: 'risky',
        consequences: {
          text: 'Couch surfing lasted 3 months. You lost your job because you couldn\'t maintain stable address. Depression hit hard. One denial spiraled into multiple setbacks.',
          statChanges: { health: -30, money: -400, energy: -25, community: -20 },
          educationalFact: 'Housing instability is the #1 factor in recidivism. Stable housing must be prioritized even if it takes extra effort to secure.'
        }
      }
    ]
  },
  {
    id: 3,
    emoji: '👥',
    category: 'Relationships',
    title: 'Old Friends Reaching Out',
    description: 'Your boys from before hit you up. They\'re still doing the same stuff that got you in trouble. They say you\'ve changed, acting too good for them now.',
    context: 'You genuinely miss them. But you also worked hard to build a new life.',
    choices: [
      {
        emoji: '✋',
        title: 'Keep distance',
        description: 'Wish them well but stay away',
        type: 'responsible',
        consequences: {
          text: 'It hurt, but you stayed away. They got caught 6 months later. You would have been with them. Sometimes protecting your future means walking away from your past.',
          statChanges: { health: 15, energy: 20, community: 15, relationships: -10 },
          educationalFact: 'Association with criminal activity is itself a parole violation. Protecting your freedom sometimes means hard choices about friendships.'
        }
      },
      {
        emoji: '☕',
        title: 'Meet occasionally, stay safe',
        description: 'Quick coffee, public places only',
        type: 'balanced',
        consequences: {
          text: 'You stayed connected without getting involved in their activities. Over time, one of them saw your progress and asked for help changing too. You became his mentor.',
          statChanges: { relationships: 15, community: 20, energy: -5 },
          educationalFact: 'You can maintain friendships while setting boundaries. Sometimes your example inspires others to change too.'
        }
      },
      {
        emoji: '🤝',
        title: 'Rejoin the group',
        description: 'You can hang without participating',
        type: 'risky',
        consequences: {
          text: 'You were at the wrong place at the wrong time. Even though you didn\'t participate, your association violated parole. Back to square one. Years of progress erased.',
          statChanges: { community: -40, money: -500, energy: -30, health: -25 },
          educationalFact: '67% of people who return to old social circles within 2 years of release end up reincarcerated. Environment matters more than willpower.'
        }
      }
    ]
  },
  {
    id: 4,
    emoji: '📚',
    category: 'Education',
    title: 'Scholarship Application',
    description: 'There\'s a scholarship specifically for formerly incarcerated students. It would cover your remaining tuition. But applying means publicly sharing your story.',
    context: 'You\'ve kept your past private at school. This would change that.',
    choices: [
      {
        emoji: '✍️',
        title: 'Apply and share your story',
        description: 'Own your past, inspire others',
        type: 'responsible',
        consequences: {
          text: 'You won the scholarship. Your essay was published and others reached out saying you inspired them. A professor invited you to speak to their criminal justice class. Your story became your strength.',
          statChanges: { money: 400, community: 30, relationships: 20, grades: 15 },
          educationalFact: 'Sharing your story authentically often opens more doors than hiding. Many organizations specifically support second-chance students.'
        }
      },
      {
        emoji: '📧',
        title: 'Apply but request privacy',
        description: 'Ask if the story can remain confidential',
        type: 'balanced',
        consequences: {
          text: 'They agreed to keep your story private from the public. You got $3,000 in scholarship money without the exposure. Sometimes you can have both.',
          statChanges: { money: 300, grades: 10, energy: 10 },
          educationalFact: 'You can always ask about privacy. Many programs will accommodate. Don\'t assume you have to sacrifice privacy for support.'
        }
      },
      {
        emoji: '🚫',
        title: 'Don\'t apply',
        description: 'The risk isn\'t worth it',
        type: 'risky',
        consequences: {
          text: 'You took out loans instead. Four years later, you\'re still paying them off while someone else got that scholarship. Fear cost you $15,000+ in free money.',
          statChanges: { money: -300, grades: -5, energy: -10 },
          educationalFact: 'There are over $50 million in scholarships specifically for returning citizens annually. Most go unclaimed because people don\'t apply.'
        }
      }
    ]
  },
  {
    id: 5,
    emoji: '💼',
    category: 'Career',
    title: 'Certificate vs. Disclosure',
    description: 'Your state offers a Certificate of Rehabilitation. It takes 6 months and requires publicly documenting your rehabilitation. But it can help seal records and improve job prospects.',
    context: 'Your record currently shows up on standard background checks.',
    choices: [
      {
        emoji: '📋',
        title: 'Apply for the certificate',
        description: 'Go through the process, get official recognition',
        type: 'responsible',
        consequences: {
          text: 'The process was intensive but worth it. The certificate opened doors. Employers who saw it actually trusted you MORE because you\'d been officially recognized for rehabilitation.',
          statChanges: { community: 30, coachTrust: 25, money: 150, energy: 10 },
          educationalFact: 'Certificates of Rehabilitation significantly reduce employment discrimination. They show you\'ve officially proven your rehabilitation.'
        }
      },
      {
        emoji: '⏰',
        title: 'Wait for automatic expungement',
        description: 'Some records clear after time passes',
        type: 'balanced',
        consequences: {
          text: 'You waited for automatic expungement after 7 years. It worked for most things, but some databases still showed the old record. Partial solution, but still progress.',
          statChanges: { community: 10, energy: 5 },
          educationalFact: 'Automatic expungement helps but isn\'t complete. Private databases may still show sealed records. Active certification is more thorough.'
        }
      },
      {
        emoji: '🤷',
        title: 'Just keep living well',
        description: 'Your actions speak for themselves',
        type: 'risky',
        consequences: {
          text: 'Your actions did speak - but records spoke louder to automated systems. You lost opportunities to candidates with clean checks. In a fair world this would work. We don\'t live there.',
          statChanges: { community: -15, money: -100, energy: -15 },
          educationalFact: 'Automated background check systems don\'t see your growth. Official documentation of rehabilitation levels the playing field.'
        }
      }
    ]
  }
];

// Map roles to their scenarios
const scenariosByRole: { [key: string]: Scenario[] } = {
  'athlete': athleteScenarios,
  'foster': fosterScenarios,
  'working': workingStudentScenarios,
  'justice': justiceImpactedScenarios
};

const scenarios: Scenario[] = [
  {
    id: 2,
    emoji: '🏠',
    category: 'Housing',
    title: 'Spring Break Plans',
    description: 'Your teammates are planning this wild spring break trip to Cancun - it\'s $1,200 per person. Everyone\'s going and they\'re begging you to come. They keep saying you can just "figure out the money later." FOMO is hitting hard.',
    context: 'The problem: You got $800 saved up but that\'s supposed to be for textbooks next semester',
    choices: [
      {
        emoji: '📚',
        title: 'Skip the trip, save money',
        description: 'Focus on academic priorities',
        type: 'responsible',
        consequences: {
          text: 'You stayed behind while everyone else left. Not gonna lie, it sucked seeing all their stories online. But you got ahead on your coursework and your textbook money is still safe. You felt lonely but your grades are looking solid.',
          statChanges: { money: 100, grades: 20, relationships: -15, energy: 10 },
          educationalFact: 'Students who skip the expensive trips and work during breaks usually end up way better with money and time management. It\'s the long game that pays off.'
        }
      },
      {
        emoji: '✈️',
        title: 'Go, but budget carefully',
        description: 'Find a cheaper alternative trip',
        type: 'balanced',
        consequences: {
          text: 'You pitched a camping trip instead and honestly? Half the team was down. You guys had an amazing time bonding around the fire, and you only spent $200. Some people even said it was better than Cancun would\'ve been.',
          statChanges: { money: -200, relationships: 15, community: 10, energy: 15 },
          educationalFact: 'You don\'t always need to blow big money to have fun with your crew. Getting creative with plans can be just as good (or better) and saves you a ton of cash.'
        }
      },
      {
        emoji: '🏖️',
        title: 'Go to Cancun anyway',
        description: 'YOLO - you\'ll figure it out',
        type: 'risky',
        consequences: {
          text: 'Cancun was absolutely insane - best week ever. But real talk, you blew through all your textbook money AND had to borrow $400 more. When next semester hit, trying to share PDFs and borrow books from people was super stressful.',
          statChanges: { money: -1200, relationships: 10, grades: -25, energy: -20, health: -5 },
          educationalFact: 'Check this: 68% of students who go wild on spring break spending say they were stressed about school the whole next semester. That one week of fun can mess with months of your life.'
        }
      }
    ]
  },
  {
    id: 3,
    emoji: '🚗',
    category: 'Transportation',
    title: 'Car Trouble',
    description: 'Your car is making some scary noises and the mechanic hits you with a $1,500 repair bill. He\'s like "honestly bro, might be time to get something newer." Your part-time gig only pays $800 a month, so this is a big decision.',
    context: 'What you\'re working with: $900 in savings, $600 in bills every month',
    choices: [
      {
        emoji: '🔧',
        title: 'Fix your current car',
        description: 'Repair what you have',
        type: 'responsible',
        consequences: {
          text: 'You dropped the cash on fixing your old ride. Hurt the wallet at first, but that car kept running strong for another 2 years. Turns out it was worth it to stick with what you had.',
          statChanges: { money: -600, energy: 10, health: 5 },
          educationalFact: 'If your old car is solid, fixing it up usually makes way more sense than getting a newer one with payments hanging over your head every month.'
        }
      },
      {
        emoji: '🚌',
        title: 'Use public transit temporarily',
        description: 'Save money while you decide',
        type: 'balanced',
        consequences: {
          text: 'You started taking the bus and bumming rides from friends for 3 months while you saved up. Not gonna lie, it was annoying and took forever to get places. But you managed to save up $1,200 for a way better car situation.',
          statChanges: { money: 200, energy: -10, relationships: 5, community: 15 },
          educationalFact: 'Sometimes you gotta take the L for a bit and wait on big purchases. When you save up first instead of rushing, you end up in a way better spot financially.'
        }
      },
      {
        emoji: '🚗',
        title: 'Buy a newer car with payments',
        description: 'Get a reliable car with a loan',
        type: 'risky',
        consequences: {
          text: 'You pulled the trigger on a $15,000 car with $300 monthly payments. The new ride is clean and reliable, but now you\'re dropping half your paycheck on it every month. That\'s rough when you\'re trying to do other stuff.',
          statChanges: { money: -300, energy: 15, health: 10, grades: -10 },
          educationalFact: 'Financial experts say your car payment should be like 15-20% of what you make, max. When it\'s eating up half your income, that\'s gonna stress you out.'
        }
      }
    ]
  },
  {
    id: 4,
    emoji: '📚',
    category: 'Education',
    title: 'Textbook Choice',
    description: 'Your professor just assigned this crazy expensive textbook - $400 brand new. You did some digging and found out you could rent it for $100, grab a used one for $200, or get the digital version for $50.',
    context: 'You budgeted $300 for all your textbooks this semester',
    choices: [
      {
        emoji: '💻',
        title: 'Get the digital version',
        description: 'Save money with digital access',
        type: 'responsible',
        consequences: {
          text: 'You went digital and saved $250 straight up. Got instant access to the book and honestly the search feature made studying way easier. You could find stuff in seconds instead of flipping through pages forever.',
          statChanges: { money: 250, grades: 10, energy: 5 },
          educationalFact: 'Digital textbooks are like 40-60% cheaper than the physical ones, plus they come with search features and other tools that actually help you study better.'
        }
      },
      {
        emoji: '📖',
        title: 'Buy used copy',
        description: 'Get a physical book at moderate cost',
        type: 'balanced',
        consequences: {
          text: 'You snagged a used copy that was still in pretty good shape. It\'s yours to keep and you can sell it back at the end of the semester. Plus you saved $100 for other textbooks you need.',
          statChanges: { money: 100, grades: 5 },
          educationalFact: 'If you take care of your used textbooks, you can usually sell them for about 25% of what you paid. That\'s some money back in your pocket at least.'
        }
      },
      {
        emoji: '💰',
        title: 'Buy the new textbook',
        description: 'Get the latest edition with all features',
        type: 'risky',
        consequences: {
          text: 'You bought the brand new one and it\'s perfect... but you just blew your entire textbook budget on one book. Now you\'re scrambling to figure out how to get materials for your other classes.',
          statChanges: { money: -400, grades: 15, energy: -10 },
          educationalFact: 'New textbooks lose like 70% of their value the second you buy them. And most of the time, the "new edition" barely has any changes from the old one. It\'s kind of a scam.'
        }
      }
    ]
  },
  {
    id: 5,
    emoji: '🍕',
    category: 'Social',
    title: 'Weekend Plans',
    description: 'Your friends are trying to hit up this fancy restaurant and then go clubbing after. They\'re all hyped but you did the math - it\'s gonna be like $150 for the whole night.',
    context: 'You usually budget $50 a week for going out and having fun',
    choices: [
      {
        emoji: '🏠',
        title: 'Host dinner at home instead',
        description: 'Suggest a potluck dinner at your place',
        type: 'responsible',
        consequences: {
          text: 'You were like "yo, let\'s do a potluck at my place instead." Cost you like $20 and everyone brought something. Honestly, everyone had a blast and some people said it was more fun than going out. More chill and personal.',
          statChanges: { money: 30, relationships: 20, community: 15, energy: 10 },
          educationalFact: 'Hanging at home costs like 75% less than going out, and real talk - you actually connect with people better when you\'re not shouting over loud music at a club.'
        }
      },
      {
        emoji: '🍔',
        title: 'Suggest a cheaper alternative',
        description: 'Propose a casual restaurant instead',
        type: 'balanced',
        consequences: {
          text: 'You suggested this local burger spot instead and everyone was down to try it. Spent $60 total and the food was fire. Now it\'s everyone\'s new favorite place to go.',
          statChanges: { money: -60, relationships: 10, energy: 5 },
          educationalFact: 'When you suggest cheaper alternatives, people respect that you\'re being smart about money. Plus you might find some hidden gems you wouldn\'t have tried otherwise.'
        }
      },
      {
        emoji: '💸',
        title: 'Go out as planned',
        description: 'Don\'t miss out on the fun',
        type: 'risky',
        consequences: {
          text: 'You went all out and honestly, the night was fun. But you just blew 3 weeks worth of fun money in one night. Now you gotta stay in and watch everyone else go out for the rest of the month. That sucks.',
          statChanges: { money: -150, relationships: 5, energy: -5, health: -5 },
          educationalFact: 'Spending too much on going out is literally one of the biggest reasons college students end up in debt. One night out can mess with your whole month.'
        }
      }
    ]
  }
];

const getStatIcon = (statName: string) => {
  const icons: { [key: string]: string } = {
    money: '💰',
    health: '❤️',
    energy: '⚡',
    grades: '📚',
    coachTrust: '🏆',
    relationships: '🤝',
    community: '🌟',
    scholarship: '🎓'
  };
  return icons[statName] || '📊';
};

const getStatColor = (value: number) => {
  if (value > 70) return 'text-[#10B981]';
  if (value >= 40) return 'text-[#F59E0B]';
  return 'text-[#EF4444]';
};

export const RoadToLegacyGame: React.FC<RoadToLegacyGameProps> = ({ onBack, savedProgress, onSaveProgress }) => {
  // Initialize state from saved progress or defaults
  const [gameScreen, setGameScreen] = useState<GameScreen>(savedProgress?.gameScreen || 'onboarding');
  const [selectedRole, setSelectedRole] = useState<Role | null>(savedProgress?.selectedRole || null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(savedProgress?.playerStats || {
    money: 500,
    health: 80,
    energy: 70,
    grades: 75,
    coachTrust: 70,
    relationships: 60,
    community: 50,
    scholarship: 60
  });
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(savedProgress?.currentScenarioIndex || 0);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>(savedProgress?.completedScenarios || []);
  const [cardDirection, setCardDirection] = useState<'left' | 'right' | 'up' | null>(null);

  // Get role-specific scenarios based on selected role
  const getRoleScenarios = () => {
    if (!selectedRole) return scenarios; // fallback to default
    return scenariosByRole[selectedRole.id] || scenarios;
  };

  const roleScenarios = getRoleScenarios();
  const currentScenario = roleScenarios[currentScenarioIndex];
  const totalScenarios = roleScenarios.length;
  const progress = (completedScenarios.length / totalScenarios) * 100;

  // Save progress function
  const saveProgress = () => {
    const progressData: RoadToLegacyProgress = {
      selectedRole,
      playerStats,
      currentScenarioIndex,
      completedScenarios,
      gameScreen
    };
    if (onSaveProgress) {
      onSaveProgress(progressData);
    }
  };

  // Save progress whenever key state changes
  useEffect(() => {
    if (selectedRole || completedScenarios.length > 0) {
      saveProgress();
    }
  }, [selectedRole, playerStats, currentScenarioIndex, completedScenarios, gameScreen]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setPlayerStats(role.startingStats);
  };

  const handleBackWithSave = () => {
    saveProgress();
    onBack();
  };

  const clearProgress = () => {
    const emptyProgress: RoadToLegacyProgress = {
      selectedRole: null,
      playerStats: {
        money: 500,
        health: 80,
        energy: 70,
        grades: 75,
        coachTrust: 70,
        relationships: 60,
        community: 50,
        scholarship: 60
      },
      currentScenarioIndex: 0,
      completedScenarios: [],
      gameScreen: 'onboarding'
    };
    if (onSaveProgress) {
      onSaveProgress(emptyProgress);
    }
  };

  const handleChoiceSelect = (choice: Choice, direction?: 'left' | 'right' | 'up') => {
    setLastChoice(choice);
    setCardDirection(direction || null);
    
    // Update stats
    const newStats = { ...playerStats };
    Object.entries(choice.consequences.statChanges).forEach(([stat, change]) => {
      if (change && stat in newStats) {
        newStats[stat as keyof PlayerStats] = Math.max(0, Math.min(100, newStats[stat as keyof PlayerStats] + change));
      }
    });
    setPlayerStats(newStats);
    
    // Mark scenario as completed
    setCompletedScenarios(prev => [...prev, currentScenario.id]);
    
    // Show impact modal
    setShowImpactModal(true);
  };

  const handleContinueAfterChoice = () => {
    setShowImpactModal(false);
    setLastChoice(null);
    setCardDirection(null);
    
    if (currentScenarioIndex < roleScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    } else {
      setGameScreen('results');
    }
  };

  const renderOnboarding = () => (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0A0E1A 0%, #1A0B2E 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={handleBackWithSave} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-6" />
      </div>

      {/* Title */}
      <div className="px-6 py-8 text-center">
        <h1 className="text-white text-4xl font-black mb-4" style={{ fontFamily: 'Inter', fontWeight: 900 }}>
          ROAD TO LEGACY
        </h1>
        <p className="text-white/60 text-base font-normal" style={{ fontFamily: 'Inter' }}>
          Your choices, your future - let's go
        </p>
      </div>

      {/* Role Selection */}
      <div className="px-6 mb-8">
        <div className="space-y-4">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => handleRoleSelect(role)}
              className={`w-full text-left bg-white rounded-3xl p-6 cursor-pointer transition-all duration-300 active:scale-95 ${
                selectedRole?.id === role.id ? 'ring-4 ring-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.5)]' : ''
              }`}
              style={{ boxShadow: '0px 8px 40px rgba(0,0,0,0.3)' }}
            >
              {/* Icon */}
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">{role.emoji}</div>
                <h3 className="text-black text-xl font-bold" style={{ fontFamily: 'Inter' }}>
                  {role.name}
                </h3>
              </div>

              {/* Selected indicator */}
              {selectedRole?.id === role.id && (
                <div className="text-center mb-3">
                  <span className="bg-[#00D9FF] text-white px-4 py-1 rounded-full text-sm font-bold">
                    SELECTED
                  </span>
                </div>
              )}

              {/* Starting Stats */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <div className="bg-[#10B981] text-white px-3 py-1 rounded-full text-sm font-medium">
                  Money: ${role.startingStats.money}
                </div>
                <div className="bg-[#F59E0B] text-white px-3 py-1 rounded-full text-sm font-medium">
                  Coach Trust: {role.startingStats.coachTrust}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                {role.description.map((desc, index) => (
                  <p key={index} className="text-gray-600 text-sm text-center" style={{ fontFamily: 'Inter' }}>
                    • {desc}
                  </p>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 space-y-4">
        {/* Continue Button if there's saved progress */}
        {savedProgress && savedProgress.selectedRole && savedProgress.gameScreen !== 'onboarding' && (
          <button
            onClick={() => {
              setSelectedRole(savedProgress.selectedRole);
              setPlayerStats(savedProgress.playerStats);
              setCurrentScenarioIndex(savedProgress.currentScenarioIndex);
              setCompletedScenarios(savedProgress.completedScenarios);
              setGameScreen(savedProgress.gameScreen);
            }}
            className="w-full bg-[#50D890] text-white font-semibold py-4 rounded-2xl text-lg transition-all duration-200 hover:bg-[#3DC577]"
            style={{ fontFamily: 'Inter' }}
          >
            Continue Game ({savedProgress.selectedRole.name})
          </button>
        )}
        
        {/* Begin New Journey Button */}
        <button
          disabled={!selectedRole}
          onClick={() => {
            if (selectedRole) {
              clearProgress();
              setGameScreen('gameplay');
            }
          }}
          className="w-full bg-[#00D9FF] text-white font-semibold py-4 rounded-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-[#00C5E6] disabled:hover:bg-[#00D9FF]"
          style={{ fontFamily: 'Inter' }}
        >
          {savedProgress && savedProgress.selectedRole ? 'Start New Journey' : 'Begin Your Journey'}
        </button>
      </div>
    </div>
  );

  const renderStatsHeader = () => (
    <div className="bg-[#0A0E1A] px-6 py-4">
      {/* Stats Row */}
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide mb-4">
        {Object.entries(playerStats).map(([stat, value]) => (
          <div key={stat} className="flex-shrink-0 text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              value > 70 ? 'bg-[#10B981]' : value >= 40 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
            }`}>
              {getStatIcon(stat)}
            </div>
            <div className={`text-sm font-bold mt-1 ${getStatColor(value)}`} style={{ fontFamily: 'Inter' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="bg-gray-600 text-white px-2 py-1 rounded-lg text-xs" style={{ fontFamily: 'Inter' }}>
            Financial Literacy Set
          </div>
          <div className="text-gray-400 text-sm" style={{ fontFamily: 'Inter' }}>
            Scenario {completedScenarios.length + 1}/{totalScenarios}
          </div>
        </div>
        <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#00D9FF] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  const renderGameplay = () => {
    if (!currentScenario) {
      return (
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
          <div className="text-white text-center">
            <p>Loading scenario...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0A0E1A]">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between px-6 py-4">
          <button onClick={handleBackWithSave} className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white text-lg font-bold" style={{ fontFamily: 'Inter' }}>
            Road to Legacy
          </h1>
          <div className="w-6" />
        </div>

        {renderStatsHeader()}
        
        {/* Card Stack */}
        <div className="px-6 py-8 flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-sm">
          {/* Main Card */}
          <div
            className={`bg-white rounded-3xl p-6 transition-all duration-300 ${
              cardDirection ? `transform ${
                cardDirection === 'left' ? 'translate-x-[-100px] rotate-[-15deg]' :
                cardDirection === 'right' ? 'translate-x-[100px] rotate-[15deg]' :
                'translate-y-[-20px]'
              } opacity-50` : ''
            }`}
            style={{ 
              height: '500px',
              boxShadow: '0px 8px 40px rgba(0,0,0,0.3)' 
            }}
          >
            {/* Emoji Header */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{currentScenario.emoji}</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                currentScenario.category === 'Financial' ? 'bg-[#10B981]' :
                currentScenario.category === 'Housing' ? 'bg-[#4A5FFF]' :
                'bg-[#9B59B6]'
              }`}>
                {currentScenario.category}
              </div>
            </div>

            {/* Scenario */}
            <div className="mb-6">
              <h2 className="text-black text-xl font-bold text-center mb-4" style={{ fontFamily: 'Inter' }}>
                {currentScenario.title}
              </h2>
              <p className="text-gray-700 text-base leading-relaxed" style={{ fontFamily: 'Inter' }}>
                {currentScenario.description}
              </p>
              {currentScenario.context && (
                <p className="text-gray-500 text-sm mt-3" style={{ fontFamily: 'Inter' }}>
                  {currentScenario.context}
                </p>
              )}
            </div>
          </div>

          {/* Choice Buttons */}
          <div className="space-y-3 mt-6">
            {currentScenario.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleChoiceSelect(choice)}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  choice.type === 'responsible' ? 'border-[#10B981] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-[#10B981]/5' :
                  choice.type === 'balanced' ? 'border-[#F59E0B] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-[#F59E0B]/5' :
                  'border-[#EF4444] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-[#EF4444]/5'
                } bg-white`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{choice.emoji}</div>
                  <div className="flex-1 text-left">
                    <div className="text-black font-semibold text-base" style={{ fontFamily: 'Inter' }}>
                      {choice.title}
                    </div>
                    <div className="text-gray-600 text-sm mt-1" style={{ fontFamily: 'Inter' }}>
                      {choice.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Modal */}
      {showImpactModal && lastChoice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm relative" style={{ boxShadow: '0px 16px 64px rgba(0,0,0,0.32)' }}>
            {/* Floating Badge */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl ${
                lastChoice.type === 'responsible' ? 'bg-gradient-to-r from-[#10B981] to-[#059669]' :
                lastChoice.type === 'balanced' ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706]' :
                'bg-gradient-to-r from-[#EF4444] to-[#DC2626]'
              }`} style={{ boxShadow: '0px 8px 32px rgba(0,0,0,0.3)' }}>
                {lastChoice.type === 'responsible' ? '✓' : lastChoice.type === 'balanced' ? '⚠️' : '✗'}
              </div>
            </div>

            {/* Content */}
            <div className="pt-8">
              <h3 className="text-black text-2xl font-bold text-center mb-5" style={{ fontFamily: 'Inter' }}>
                {lastChoice.type === 'responsible' ? 'Responsible Choice' :
                 lastChoice.type === 'balanced' ? 'Balanced Approach' : 'Risky Move'}
              </h3>

              <p className="text-gray-700 text-base leading-relaxed text-center mb-8" style={{ fontFamily: 'Inter' }}>
                {lastChoice.consequences.text}
              </p>

              {/* Stat Changes */}
              <div className="mb-6">
                <h4 className="text-gray-600 text-sm font-semibold mb-3" style={{ fontFamily: 'Inter' }}>
                  Impact on Your Life:
                </h4>
                <div className="space-y-2">
                  {Object.entries(lastChoice.consequences.statChanges).map(([stat, change]) => (
                    change && (
                      <div key={stat} className="flex items-center justify-between">
                        <span className="text-gray-700 text-sm" style={{ fontFamily: 'Inter' }}>
                          {getStatIcon(stat)} {stat.charAt(0).toUpperCase() + stat.slice(1)}
                        </span>
                        <span className={`text-sm font-medium ${change > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Educational Fact */}
              {lastChoice.consequences.educationalFact && (
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <p className="text-gray-700 text-sm" style={{ fontFamily: 'Inter' }}>
                    💡 {lastChoice.consequences.educationalFact}
                  </p>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleContinueAfterChoice}
                className="w-full bg-[#00D9FF] text-white font-semibold py-4 rounded-2xl text-base"
                style={{ fontFamily: 'Inter' }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  };

  const renderResults = () => (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={handleBackWithSave} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-lg font-bold" style={{ fontFamily: 'Inter' }}>
          Results
        </h1>
        <div className="w-6" />
      </div>

      <div className="px-6 py-4">
        {/* Header */}
        <div className="text-center mb-8">
        <h1 className="text-white text-3xl font-black mb-2" style={{ fontFamily: 'Inter' }}>
          Set Complete
        </h1>
        <p className="text-white/60 text-lg" style={{ fontFamily: 'Inter' }}>
          Financial Literacy Basics
        </p>
      </div>

      {/* Legacy Score */}
      <div className="mb-8">
        <h2 className="text-white text-xl font-bold mb-6" style={{ fontFamily: 'Inter' }}>
          Your Legacy Score
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(playerStats).map(([stat, value]) => (
            <div key={stat} className="bg-[#1E293B] rounded-2xl p-4">
              <div className={`text-3xl font-bold mb-2 ${getStatColor(value)}`} style={{ fontFamily: 'Inter' }}>
                {value}
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{getStatIcon(stat)}</span>
                <span className="text-gray-400 text-sm capitalize" style={{ fontFamily: 'Inter' }}>
                  {stat === 'coachTrust' ? 'Coach Trust' : stat}
                </span>
              </div>
              <div className="text-[#10B981] text-xs" style={{ fontFamily: 'Inter' }}>
                +{Math.max(0, value - (selectedRole?.startingStats[stat as keyof PlayerStats] || 0))} from start
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="text-center mb-8">
        <p className="text-white/70 text-base mb-6" style={{ fontFamily: 'Inter' }}>
          You made it through {totalScenarios} tough calls. Here's what you learned on this journey...
        </p>

        <div className="space-y-2 text-left">
          <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter' }}>
            • Money choices you make now affect your life way down the road
          </p>
          <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter' }}>
            • Start building good habits now and future you will thank you
          </p>
          <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter' }}>
            • Every single choice opens or closes doors for what comes next
          </p>
        </div>
      </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button 
            onClick={() => {
              // Clear progress and reset game state for next set
              clearProgress();
              setCurrentScenarioIndex(0);
              setCompletedScenarios([]);
              setSelectedRole(null);
              setGameScreen('onboarding');
              setPlayerStats({
                money: 500,
                health: 80,
                energy: 70,
                grades: 75,
                coachTrust: 70,
                relationships: 60,
                community: 50,
                scholarship: 60
              });
            }}
            className="w-full bg-[#00D9FF] text-white font-semibold py-4 rounded-2xl text-base hover:bg-[#00C5E6] transition-all duration-200"
            style={{ fontFamily: 'Inter' }}
          >
            Next Set
          </button>
          <button 
            onClick={handleBackWithSave}
            className="w-full border-2 border-white text-white font-semibold py-4 rounded-2xl text-base hover:bg-white hover:text-[#0A0E1A] transition-all duration-200"
            style={{ fontFamily: 'Inter' }}
          >
            Back to Games
          </button>
        </div>
      </div>
    </div>
  );

  switch (gameScreen) {
    case 'onboarding':
      return renderOnboarding();
    case 'gameplay':
      return renderGameplay();
    case 'results':
      return renderResults();
    default:
      return renderOnboarding();
  }
};