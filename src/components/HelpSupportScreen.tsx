import { useState } from 'react';
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Book, ChevronDown, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button3D } from './ui/Button3D';

interface HelpSupportScreenProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I enroll in a program?",
    answer: "After signing in, you'll be presented with available programs. Select your program (High School or College) and click 'Enroll' to begin. Your progress will be saved automatically."
  },
  {
    category: "Getting Started",
    question: "Can I access the app offline?",
    answer: "Yes! Beyond The Game is designed to work offline. Once you've loaded the lessons, you can access them without an internet connection. Your progress will sync when you're back online."
  },
  {
    category: "Getting Started",
    question: "How do I change my difficulty level?",
    answer: "You can change your difficulty level (Beginner, Intermediate, Advanced) in the Courses section. The difficulty determines the depth of content and complexity of quiz questions."
  },
  {
    category: "Courses & Progress",
    question: "How is my progress tracked?",
    answer: "Your progress is tracked automatically as you complete lessons and quizzes. You can view your overall progress on the Dashboard and detailed progress in the Courses section."
  },
  {
    category: "Courses & Progress",
    question: "What happens if I fail a quiz?",
    answer: "Don't worry! You can retake quizzes as many times as needed. We encourage learning from mistakes - review the explanations for questions you missed before trying again."
  },
  {
    category: "Courses & Progress",
    question: "How do I unlock the final exam?",
    answer: "Complete all weekly lessons and quizzes to unlock the final certification exam. You need 70% or higher to pass and earn your Financial Literacy Certificate."
  },
  {
    category: "Technical Issues",
    question: "The app isn't loading properly. What should I do?",
    answer: "Try these steps: 1) Refresh the page, 2) Clear your browser cache, 3) Make sure you have a stable internet connection, 4) Try a different browser. If issues persist, contact support."
  },
  {
    category: "Technical Issues",
    question: "My progress isn't saving. How do I fix this?",
    answer: "Progress saves automatically when connected to the internet. If you're offline, progress saves locally and syncs when reconnected. Check your internet connection and try refreshing."
  },
  {
    category: "Account",
    question: "How do I reset my password?",
    answer: "Go to Account Settings and select 'Change Password'. Enter your current password and your new password. If you've forgotten your password, use the 'Forgot Password' link on the login screen."
  },
  {
    category: "Account",
    question: "Can I delete my account?",
    answer: "Yes, you can delete your account in Account Settings under 'Danger Zone'. Note that this action is permanent and all your progress will be lost."
  }
];

export function HelpSupportScreen({ onBack }: HelpSupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [showContactForm, setShowContactForm] = useState(false);

  const categories = [...new Set(faqs.map(faq => faq.category))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleContactSubmit = () => {
    // In production, this would send to support
    alert('Your message has been sent to our support team. We\'ll respond within 24-48 hours.');
    setContactForm({ subject: '', message: '' });
    setShowContactForm(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-2xl font-black text-white">Help & Support</h1>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowContactForm(true)}>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#4A5FFF]/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#4A5FFF]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Contact Support</h3>
              <p className="text-white/60 text-xs">Get help from our team</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 cursor-pointer hover:scale-105 transition-transform">
          <a href="mailto:support@beyondthegame.app" className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#50D890]/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#50D890]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Email Us</h3>
              <p className="text-white/60 text-xs">support@btg.app</p>
            </div>
          </a>
        </GlassCard>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Contact Support</h2>
            <button
              onClick={() => setShowContactForm(false)}
              className="text-white/60 hover:text-white"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-2">Subject</label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                placeholder="What do you need help with?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-2">Message</label>
              <textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Describe your issue or question..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-[#4A5FFF]/50 focus:outline-none resize-none"
              />
            </div>

            <Button3D
              onClick={handleContactSubmit}
              disabled={!contactForm.subject || !contactForm.message}
              variant="primary"
              className="w-full"
            >
              Send Message
            </Button3D>
          </div>
        </GlassCard>
      )}

      {/* Search FAQs */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <h2 className="text-lg font-bold text-white">Frequently Asked Questions</h2>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-[#FF6B35]/50 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-[#4A5FFF] text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-[#4A5FFF] text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No FAQs found matching your search.
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-xs text-[#4A5FFF] mb-1 block">{faq.category}</span>
                    <span className="text-white font-medium">{faq.question}</span>
                  </div>
                  {expandedFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-white/60 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white/60 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-white/70 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Resources */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#9B59B6]/20 flex items-center justify-center">
            <Book className="w-5 h-5 text-[#9B59B6]" />
          </div>
          <h2 className="text-lg font-bold text-white">Additional Resources</h2>
        </div>

        <div className="space-y-3">
          <a
            href="#"
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="text-white">Getting Started Guide</span>
            <ExternalLink className="w-5 h-5 text-white/40" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="text-white">Video Tutorials</span>
            <ExternalLink className="w-5 h-5 text-white/40" />
          </a>
          <a
            href="#"
            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <span className="text-white">Financial Glossary</span>
            <ExternalLink className="w-5 h-5 text-white/40" />
          </a>
        </div>
      </GlassCard>
    </div>
  );
}
