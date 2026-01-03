import { ArrowLeft, Shield } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
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
          <Shield className="w-6 h-6 text-[#4A5FFF]" />
          <h1 className="text-2xl font-black text-white">Privacy Policy</h1>
        </div>
      </div>

      <GlassCard className="p-6">
        <p className="text-white/60 text-sm mb-6">Last updated: January 2025</p>

        <div className="space-y-6 text-white/80">
          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Introduction</h2>
            <p className="leading-relaxed">
              Beyond The Game ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our financial literacy education application.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Information We Collect</h2>
            <p className="leading-relaxed mb-3">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account information (name, email address, password)</li>
              <li>Profile information (display name, avatar)</li>
              <li>Educational progress (lessons completed, quiz scores, achievements)</li>
              <li>Usage data (features used, time spent, interaction patterns)</li>
              <li>Device information (browser type, operating system, device type)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. How We Use Your Information</h2>
            <p className="leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Track your educational progress and personalize your learning experience</li>
              <li>Send you notifications about your courses and achievements</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Information Sharing</h2>
            <p className="leading-relaxed mb-3">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist us in operating our platform</li>
              <li>To comply with legal obligations or protect our rights</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
              <li>With educational institutions if you're enrolled through a school program</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security assessments, and access controls.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account at any time through the Account Settings. Some information may be retained for legal compliance or legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. Offline Data Storage</h2>
            <p className="leading-relaxed">
              Our app supports offline functionality. When offline, your progress and data are stored locally on your device using IndexedDB. This data syncs with our servers when you reconnect to the internet. You can clear locally stored data through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Your Rights</h2>
            <p className="leading-relaxed mb-3">Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Request correction of inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">9. Children's Privacy</h2>
            <p className="leading-relaxed">
              Our services are intended for users aged 13 and older. If you are under 18, you should have parental consent to use our services. We do not knowingly collect personal information from children under 13 without verifiable parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">10. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">11. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-3 p-4 bg-white/5 rounded-xl">
              <p className="text-white font-medium">Beyond The Game</p>
              <p className="text-white/60">Email: privacy@beyondthegame.app</p>
            </div>
          </section>
        </div>
      </GlassCard>
    </div>
  );
}
