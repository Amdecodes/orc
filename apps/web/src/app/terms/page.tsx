"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function TermsPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-bg-page text-text-primary py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-12 bg-bg-surface/50 border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm backdrop-blur-xl">
        
        <div className="space-y-4 border-b border-border/50 pb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t('back_to_home')}
          </Link>
          <h1 className="text-4xl md:text-5xl font-black font-['Space_Grotesk'] tracking-tighter text-text-primary">{t('terms_of_service')}</h1>
          <p className="text-text-secondary font-medium uppercase tracking-widest text-xs">{t('last_updated', { date: 'March 2026' })}</p>
          <p className="text-lg font-bold text-accent pt-4">By using National ID Formatter, you agree to these terms.</p>
        </div>

        <div className="space-y-10 text-text-secondary leading-relaxed font-medium">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">1. SERVICE DESCRIPTION</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">1.1 What We Do</h3>
              <p>National ID Formatter is a <strong>document reconstruction and formatting service</strong>. We:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Accept user-uploaded screenshots of Ethiopian National ID cards</li>
                <li>Extract visible text and data using OCR (Optical Character Recognition) technology</li>
                <li>Reformat the extracted data into clean, print-ready PDF and PNG files</li>
                <li>Provide downloadable output files to users</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">1.2 What We DO NOT Do</h3>
              <p>We explicitly <strong>DO NOT</strong>:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Verify, validate, or authenticate any identity documents</li>
                <li>Confirm the accuracy of any information provided</li>
                <li>Issue, replace, or create official government documents</li>
                <li>Store or retain any personal data beyond 48 hours</li>
                <li>Have any affiliation with the Ethiopian government or National ID authority</li>
                <li>Provide any legal, governmental, or official validation services</li>
                <li>Guarantee that extracted data is 100% accurate</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">1.3 Nature of Service</h3>
              <p>This is a <strong>formatting and reconstruction service ONLY</strong>. All outputs are marked as "Reconstructed Copy - Not for Official Use" and are intended solely for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Personal record-keeping</li>
                <li>Printing services</li>
                <li>Non-official documentation purposes</li>
              </ul>
              <p className="font-bold text-error mt-2">Our service does NOT create legally valid identification documents.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">2. USER RESPONSIBILITIES</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">2.1 Lawful Use</h3>
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use this service only for lawful purposes</li>
                <li>Upload only documents you have legal right to process</li>
                <li>Not use outputs for fraudulent, deceptive, or illegal purposes</li>
                <li>Not claim that outputs are official government documents</li>
                <li>Not misrepresent the nature or purpose of reconstructed documents</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">2.2 Accuracy Verification</h3>
              <p>You acknowledge and agree that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>You are solely responsible for verifying all extracted data accuracy</strong></li>
                <li>OCR technology may produce errors or inaccuracies</li>
                <li>We provide a reconstruction service, not a verification service</li>
                <li>You must review all outputs before use</li>
                <li>We are not liable for any errors in extracted data</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">2.3 Prohibited Uses</h3>
              <p>You may NOT use this service to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Create fraudulent identity documents</li>
                <li>Impersonate another person</li>
                <li>Bypass official government processes</li>
                <li>Commit identity theft or fraud</li>
                <li>Violate any local, national, or international laws</li>
                <li>Create documents for official government submissions</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">3. DATA PROCESSING & PRIVACY</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">3.1 Temporary Processing Only</h3>
              <p>We process your data temporarily for service delivery:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Uploaded images: User uploads will be removed immediately after generation</li>
                <li>Generated files: Available for download for 48 hours, then permanently deleted</li>
                <li>No long-term storage of personal data</li>
                <li>No backups or archives of user documents</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">3.2 No Data Retention</h3>
              <p>We <strong>DO NOT</strong>:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Store your ID information in any database</li>
                <li>Create profiles or records of users</li>
                <li>Retain copies of uploaded images</li>
                <li>Keep extracted data after file deletion</li>
                <li>Share or sell any user data to third parties</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">3.3 Automatic Deletion</h3>
              <p>All files (uploads and outputs) are automatically and permanently deleted:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Raw uploads: Immediately after successful generation</li>
                <li>Generated outputs: 48 hours after creation</li>
                <li>This deletion is automatic and irreversible</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">4. PAYMENT & CREDITS</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">4.1 Credit System</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Service operates on a prepaid credit basis</li>
                <li>1 credit = 1 successful document reconstruction</li>
                <li>Credits are deducted only upon successful generation of output files</li>
                <li>Failed processing attempts do not consume credits</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">4.2 No Refunds</h3>
              <p>Due to the instant nature of digital service delivery:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>All credit purchases are final and non-refundable</li>
                <li>Unused credits do not expire</li>
                <li>We do not provide refunds for dissatisfaction with output quality</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">4.3 Payment Processing</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Payments are processed manually via bank transfer</li>
                <li>Payment proof must be submitted for verification</li>
                <li>Credits are added after admin approval</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">5. DISCLAIMER OF WARRANTIES</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">5.1 "AS IS" Service</h3>
              <p>This service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Accuracy of OCR extraction</li>
                <li>Completeness of data extraction</li>
                <li>Quality of output formatting</li>
                <li>Continuous availability of service</li>
                <li>Error-free operation</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">5.2 No Guarantee of Accuracy</h3>
              <p>We make <strong>NO GUARANTEE</strong> that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Extracted data will be 100% accurate</li>
                <li>All fields will be successfully extracted</li>
                <li>Output will match original document exactly</li>
                <li>OCR will correctly interpret all text</li>
              </ul>
              <p className="font-bold mt-2">Users must verify all extracted data manually.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">6. LIMITATION OF LIABILITY</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">6.1 Maximum Liability</h3>
              <p>Our total liability to you for any claims arising from use of this service is limited to the amount you paid for credits in the past 30 days, with a maximum of 1,000 Ethiopian Birr.</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">6.2 No Liability For</h3>
              <p>We are NOT LIABLE for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Errors or inaccuracies in extracted data</li>
                <li>Any damages resulting from use of reconstructed documents</li>
                <li>Loss of data or files after automatic deletion</li>
                <li>Service interruptions or downtime</li>
                <li>Third-party use or misuse of downloaded files</li>
                <li>Any legal consequences from document use</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">6.3 User Assumes All Risk</h3>
              <p>You acknowledge and agree that:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You use this service entirely at your own risk</li>
                <li>You are solely responsible for how you use generated outputs</li>
                <li>We are not responsible for any consequences of document use</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">7. INTELLECTUAL PROPERTY</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">7.1 User Content</h3>
              <p>You retain all rights to images and data you upload. By uploading, you grant us a temporary license to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Process your images using OCR technology</li>
                <li>Generate formatted output files</li>
                <li>Store files temporarily (up to 48 hours)</li>
              </ul>
              <p>This license automatically expires when files are deleted.</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">7.2 Our Intellectual Property</h3>
              <p>All service code, algorithms, templates, and branding are our exclusive property. You may not:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Copy, modify, or reverse-engineer our service</li>
                <li>Use our branding without permission</li>
                <li>Create derivative services based on our technology</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">8. INDEMNIFICATION</h2>
            <p>You agree to indemnify and hold harmless National ID Formatter, its operators, and affiliates from any claims, damages, losses, or expenses (including legal fees) arising from:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your use or misuse of the service</li>
              <li>Your violation of these terms</li>
              <li>Your violation of any laws or regulations</li>
              <li>Any fraudulent or illegal use of generated documents</li>
              <li>Third-party claims related to your use of outputs</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">9. GOVERNMENT DISCLAIMER</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">9.1 No Government Affiliation</h3>
              <p><strong>IMPORTANT:</strong> National ID Formatter is:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>An independent, private service</li>
                <li>NOT affiliated with the Ethiopian government</li>
                <li>NOT endorsed by any government authority</li>
                <li>NOT connected to the National ID authority</li>
                <li>NOT authorized to issue official documents</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">9.2 Not Official Documents</h3>
              <p>Documents generated by this service:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Are NOT official government documents</li>
                <li>Are NOT legally valid identification</li>
                <li>Cannot be used for official government purposes</li>
                <li>Are marked as "Reconstructed Copy - Not for Official Use"</li>
                <li>Are intended for personal/printing purposes only</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">10. TERMINATION</h2>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">10.1 We May Terminate</h3>
              <p>We reserve the right to terminate or suspend your access immediately, without notice, for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violation of these terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of the service</li>
                <li>Any conduct we deem harmful</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">11. CHANGES TO TERMS</h2>
            <p>We may modify these terms at any time. Changes are effective immediately upon posting. Continued use of the service after changes constitutes acceptance of new terms.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">12. GOVERNING LAW</h2>
            <p>These terms are governed by the laws of the Federal Democratic Republic of Ethiopia. Any disputes shall be resolved in Ethiopian courts.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">13. CONTACT</h2>
            <p>For questions about these terms:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:nationalidformatter@gmail.com" className="text-accent underline">nationalidformatter@gmail.com</a></li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
