import { ArrowLeft, FileText } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface TermsOfServiceScreenProps {
  onBack: () => void;
}

export function TermsOfServiceScreen({ onBack }: TermsOfServiceScreenProps) {
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
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#50D890]" />
          <h1 className="text-2xl font-black text-white">Terms of Service</h1>
        </div>
      </div>

      <GlassCard className="p-6">
        <p className="text-white/60 text-sm mb-6">Last updated: January 2025</p>

        <div className="space-y-6 text-white/80">
          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using Beyond The Game ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service. These terms apply to all users, including students, educators, and administrators.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Description of Service</h2>
            <p className="leading-relaxed">
              Beyond The Game is a financial literacy education platform designed to help students learn essential money management skills. The Service includes educational content, interactive lessons, quizzes, games, and progress tracking features accessible through web browsers.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. User Accounts</h2>
            <p className="leading-relaxed mb-3">To access certain features of the Service, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Not share your account credentials with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Educational Content</h2>
            <p className="leading-relaxed mb-3">The educational content provided through our Service:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Is for informational and educational purposes only</li>
              <li>Does not constitute professional financial, legal, or tax advice</li>
              <li>Should not be relied upon as the sole basis for financial decisions</li>
              <li>May be updated or modified at any time without notice</li>
            </ul>
            <p className="leading-relaxed mt-3">
              We encourage users to consult with qualified professionals for personalized financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Acceptable Use</h2>
            <p className="leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the integrity of the Service</li>
              <li>Copy, modify, or distribute our content without permission</li>
              <li>Use automated systems or bots to access the Service</li>
              <li>Submit false information or impersonate others</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload malicious code or attempt to compromise security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Intellectual Property</h2>
            <p className="leading-relaxed">
              All content, features, and functionality of the Service, including text, graphics, logos, icons, images, audio, video, software, and educational materials, are owned by Beyond The Game or its licensors and are protected by intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. User Content</h2>
            <p className="leading-relaxed">
              You retain ownership of any content you submit to the Service. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute that content in connection with the Service. You represent that you have the right to submit such content and that it does not violate any third party's rights.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Certificates and Achievements</h2>
            <p className="leading-relaxed">
              Certificates and achievements earned through the Service are intended for personal and educational purposes. They represent completion of educational modules within our platform and are not professional certifications or credentials recognized by financial regulatory bodies.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">9. Third-Party Services</h2>
            <p className="leading-relaxed">
              The Service may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third-party sites. Your interactions with third-party services are solely between you and the third party.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">10. Disclaimer of Warranties</h2>
            <p className="leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE MAKE NO WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF ANY CONTENT OBTAINED THROUGH THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">11. Limitation of Liability</h2>
            <p className="leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BEYOND THE GAME SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE OR ANY FINANCIAL DECISIONS MADE BASED ON CONTENT PROVIDED THROUGH THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">12. Indemnification</h2>
            <p className="leading-relaxed">
              You agree to indemnify and hold harmless Beyond The Game and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">13. Termination</h2>
            <p className="leading-relaxed">
              We may terminate or suspend your account and access to the Service at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">14. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes through the Service or via email. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">15. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">16. Contact Information</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-white/5 rounded-xl">
              <p className="text-white font-medium">Beyond The Game</p>
              <p className="text-white/60">Email: legal@beyondthegame.app</p>
            </div>
          </section>
        </div>
      </GlassCard>
    </div>
  );
}
