import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Flame } from 'lucide-react';

const LegalPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(
    location.pathname === '/privacy' ? 'privacy' : 'terms'
  );

  // Update activeTab when the route changes
  useEffect(() => {
    setActiveTab(location.pathname === '/privacy' ? 'privacy' : 'terms');
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white-900 to-white-800 text-white-100">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12"
        >
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-red-500 animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight">V-FIRE Legal Hub</h1>
          </div>
          <p className="mt-4 sm:mt-0 text-sm text-white-400 max-w-md">
            Explore our Terms and Conditions and Privacy Policy
          </p>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="tabs">
            <div className="flex border-b border-white-700 mb-8">
              <button
                className={`tab-button px-6 py-3 text-sm font-medium transition-all duration-300 relative -mb-px ${activeTab === 'terms' ? 'active' : ''}`}
                onClick={() => setActiveTab('terms')}
              >
                Terms and Conditions
                <span className="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transition-all duration-300"></span>
              </button>
              <button
                className={`tab-button px-6 py-3 text-sm font-medium transition-all duration-300 relative -mb-px ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                Privacy Policy
                <span className="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transition-all duration-300"></span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'terms' && (
                <motion.div
                  key="terms"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="tab-content"
                >
                  <div className="bg-white-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-white-700/50 p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold text-white">Terms and Conditions</h2>
                      <p className="text-sm text-white-400 mt-1">Last Updated: May 16, 2025</p>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none space-y-6">
                      <p className="text-white-300 leading-relaxed">
                        Welcome to V-FIRE Inspect. By accessing our platform, you agree to these Terms and Conditions, which define your rights and responsibilities. Please read carefully.
                      </p>
                      <section>
                        <h3 className="text-xl font-medium text-white">1. Introduction</h3>
                        <p className="text-white-300">
                          V-FIRE Inspect is a state-of-the-art Fire Safety Inspection Management System designed for the Bureau of Fire Protection (BFP), Fire Inspectors, and Establishment Owners. It streamlines inspection scheduling, application management, and certification issuance.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">2. User Registration and Security</h3>
                        <ul className="list-disc pl-5 space-y-2 text-white-300">
                          <li>Register with accurate and current information. False data may lead to account suspension.</li>
                          <li>Maintain confidentiality of your login credentials.</li>
                          <li>Notify administrators immediately of unauthorized activity.</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">3. Use of the System</h3>
                        <ul className="list-disc pl-5 space-y-2 text-white-300">
                          <li>Intended for professional fire safety inspection management.</li>
                          <li>Do not submit false information or falsify documents.</li>
                          <li>Administrators may approve or reject registrations based on compliance.</li>
                          <li>Misuse may result in account termination and legal action.</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">4. Scheduling and Inspections</h3>
                        <ul className="list-disc pl-5 space-y-2 text-white-300">
                          <li>Admins schedule inspections with date/time and assign inspectors.</li>
                          <li>Inspectors complete checklists and upload findings.</li>
                          <li>Inspections may be rescheduled based on availability.</li>
                          <li>Data stored securely in the inspection database.</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">5. Application and Certification</h3>
                        <ul className="list-disc pl-5 space-y-2 text-white-300">
                          <li>Owners apply for certification post-registration approval.</li>
                          <li>Applications require accurate details and complete documents.</li>
                          <li>Admins review and issue or reject certifications.</li>
                          <li>Rejected applications include feedback for resubmission.</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">6. Data Storage and Retention</h3>
                        <p className="text-white-300">
                          All inspection and establishment data is securely stored and accessible only to authorized personnel.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">7. Intellectual Property</h3>
                        <p className="text-white-300">
                          V-FIRE Inspect’s interface, logos, and database are protected intellectual property. Unauthorized reproduction is prohibited.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">8. Limitations of Liability</h3>
                        <p className="text-white-300">
                          V-FIRE Inspect does not guarantee uninterrupted access or flawless data input. We are not liable for user errors or delays.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">9. Account Termination</h3>
                        <p className="text-white-300">
                          Accounts may be suspended for misuse or non-compliance. Users may delete their accounts within the system.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">10. Governing Law</h3>
                        <p className="text-white-300">
                          Governed by the laws of the Republic of the Philippines and Valenzuela City ordinances. Disputes resolved in Valenzuela courts.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">11. Updates to Terms</h3>
                        <p className="text-white-300">
                          Terms may be updated. Continued use signifies acceptance of revised Terms.
                        </p>
                      </section>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="tab-content"
                >
                  <div className="bg-white-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-white-700/50 p-8">
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold text-white">Privacy Policy</h2>
                      <p className="text-sm text-white-400 mt-1">Last Updated: May 16, 2025</p>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none space-y-6">
                      <p className="text-white-300 leading-relaxed">
                        Your privacy is paramount. This Privacy Policy outlines how V-FIRE Inspect collects, uses, and protects your personal information.
                      </p>
                      <section>
                        <h3 className="text-xl font-medium text-white">1. Data Collection and Use</h3>
                        <p className="text-white-300">We collect:</p>
                        <ul className="list-disc pl-5 space-y-2 text-white-300">
                          <li>User details (name, email, contact, position).</li>
                          <li>Establishment details (name, DTI number, address).</li>
                          <li>Inspection forms, documents, and checklists.</li>
                          <li>Scheduling data (dates, assigned inspectors).</li>
                        </ul>
                        <h4 className="text-lg font-medium text-white">Purpose</h4>
                        <ul className="list-disc pl-5 space-y-2 text-white-300">
                          <li>Facilitate inspections and certifications.</li>
                          <li>Notify inspectors of assignments.</li>
                          <li>Ensure compliance with regulations.</li>
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">2. Data Security</h3>
                        <h4 className="text-lg font-medium text-white">Protection</h4>
                        <p className="text-white-300">
                          We use robust safeguards to protect data from unauthorized access or loss.
                        </p>
                        <h4 className="text-lg font-medium text-white">Confidentiality</h4>
                        <p className="text-white-300">
                          Data is confidential and only shared with authorized personnel or as required by law.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">3. User Rights</h3>
                        <h4 className="text-lg font-medium text-white">Access and Correction</h4>
                        <p className="text-white-300">
                          Update your profile or contact admins to correct data.
                        </p>
                        <h4 className="text-lg font-medium text-white">Data Deletion</h4>
                        <p className="text-white-300">
                          Request account deletion, subject to retention policies.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">4. Third-Party Disclosure</h3>
                        <h4 className="text-lg font-medium text-white">Service Providers</h4>
                        <p className="text-white-300">
                          Limited sharing with government units for inspection tasks.
                        </p>
                        <h4 className="text-lg font-medium text-white">Legal Compliance</h4>
                        <p className="text-white-300">
                          Disclosure if required by law or to protect system integrity.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">5. Policy Updates</h3>
                        <p className="text-white-300">
                          Updates posted on the platform. Continued use signifies acceptance.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-medium text-white">6. Contact</h3>
                        <p className="text-white-300">
                          Questions? Reach us at{' '}
                          <a href="mailto:vfireinspectval@gmail.com" className="text-red-500 hover:text-red-400 transition">
                            vfireinspectval@gmail.com
                          </a>.
                        </p>
                      </section>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Custom CSS */}
      <style>
        {`
          .tabs .tab-button {
            color: #9CA3AF;
            position: relative;
          }
          .tabs .tab-button.active {
            color: #9CA3AF;
          }
          .tabs .tab-button.active .tab-indicator {
            opacity: 1;
            transform: scaleX(1);
          }
          .tabs .tab-button .tab-indicator {
            opacity: 0;
            transform: scaleX(0);
          }
          .tabs .tab-button:hover {
            color: #9CA3AF;
          }
          .tab-content {
            display: block;
          }
        `}
      </style>
    </div>
  );
};

export default LegalPage;