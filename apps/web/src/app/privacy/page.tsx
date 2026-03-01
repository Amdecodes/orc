"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-bg-page text-text-primary py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto space-y-12 bg-bg-surface/50 border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm backdrop-blur-xl">
        
        <div className="space-y-4 border-b border-border/50 pb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-text-muted hover:text-text-primary uppercase tracking-widest transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t('back_to_home')}
          </Link>
          <h1 className="text-4xl md:text-5xl font-black font-['Space_Grotesk'] tracking-tighter text-text-primary">{t('privacy_policy')}</h1>
          <p className="text-text-secondary font-medium uppercase tracking-widest text-xs">{t('last_updated', { date: 'March 2026' })}</p>
          <p className="text-lg font-bold text-accent pt-4">National ID Formatter is committed to protecting your privacy.</p>
        </div>

        <div className="space-y-10 text-text-secondary leading-relaxed font-medium">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">1. INFORMATION COLLECTION</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">1.1 What We Collect</h3>
              <p>We collect <strong>ONLY</strong> the following information:</p>
              
              <p className="font-bold text-text-primary mt-3">Account Information:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Telegram username (for bot users)</li>
                <li>Email address (for web users)</li>
                <li>Payment proof images (for credit purchases)</li>
              </ul>

              <p className="font-bold text-text-primary mt-3">Uploaded Content (Temporary):</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Ethiopian ID card screenshots (front and back)</li>
                <li>QR code images (if separately uploaded)</li>
              </ul>

              <p className="font-bold text-text-primary mt-3">Automatically Collected:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Processing timestamps</li>
                <li>Credit transaction records</li>
                <li>Error logs (no personal data included)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">1.2 What We DO NOT Collect</h3>
              <p>We explicitly <strong>DO NOT</strong> collect:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Full names from ID cards (not stored)</li>
                <li>Date of birth information (not stored)</li>
                <li>ID numbers (FIN, FCN) (not stored)</li>
                <li>Addresses (not stored)</li>
                <li>Phone numbers (not stored)</li>
                <li>Biometric data (face photos not stored)</li>
                <li>Payment card details (manual bank transfer only)</li>
                <li>Browsing history or tracking data</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">2. HOW WE USE INFORMATION</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">2.1 Service Delivery</h3>
              <p>We use collected information ONLY to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Process your ID screenshots using OCR technology</li>
                <li>Extract and format visible text data</li>
                <li>Generate output PDF/PNG files</li>
                <li>Deliver files to you for download</li>
                <li>Manage your credit balance</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">2.2 What We DO NOT Do With Your Data</h3>
              <p>We <strong>NEVER</strong>:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Store extracted personal data in any database</li>
                <li>Share or sell your data to third parties</li>
                <li>Use your data for marketing or advertising</li>
                <li>Create user profiles or track behavior</li>
                <li>Retain copies after automatic deletion</li>
                <li>Use facial recognition or biometric analysis</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">3. DATA RETENTION & DELETION</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">3.1 Automatic Deletion Schedule</h3>

              <p className="font-bold text-text-primary mt-3">Uploaded Images:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Retention: Until processing completes (typically 15-30 seconds)</li>
                <li>Deletion: Immediately after generation, guaranteed</li>
                <li>Method: Permanent, irreversible deletion</li>
              </ul>

              <p className="font-bold text-text-primary mt-3">Generated Output Files:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Retention: 48 hours after generation</li>
                <li>Deletion: Automatic at 48-hour mark</li>
                <li>Method: Permanent, irreversible deletion</li>
              </ul>

              <p className="font-bold text-text-primary mt-3">Payment Proof Images:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Retention: 90 days (for financial record-keeping)</li>
                <li>Deletion: Automatic after 90 days</li>
                <li>Method: Permanent deletion</li>
              </ul>

              <p className="font-bold text-text-primary mt-3">Credit Transaction Records:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Retention: 1 year (legal/accounting requirement)</li>
                <li>Content: Only date, amount, credit count (no personal ID data)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">3.2 No Long-Term Storage</h3>
              <p>We <strong>DO NOT</strong>:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Keep backups of user documents</li>
                <li>Archive processed images</li>
                <li>Store extracted personal data</li>
                <li>Retain files beyond stated periods</li>
              </ul>
              <p>All deletion is automatic, permanent, and irreversible.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">4. DATA SECURITY</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">4.1 Security Measures</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Encrypted file storage (AES-256)</li>
                <li>Secure HTTPS connections for all data transfer</li>
                <li>Private storage URLs (signed, expiring links)</li>
                <li>Automatic file deletion systems</li>
                <li>Limited access controls (processing only)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">4.2 Processing Security</h3>
              <p>During processing:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Files are stored in isolated, temporary directories</li>
                <li>No files are accessible via public URLs</li>
                <li>Processing happens in secure server environment</li>
                <li>Files are immediately deleted after processing</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">4.3 No Guarantees</h3>
              <p>While we implement reasonable security measures, we <strong>CANNOT GUARANTEE</strong> absolute security. You use this service at your own risk.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">5. THIRD-PARTY SERVICES</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">5.1 Services We Use</h3>

              <p className="font-bold text-text-primary mt-3">Supabase (Database):</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Purpose: User accounts, credit balances, transactions</li>
                <li>Data shared: Username, credit balance, transaction records only</li>
                <li>Data NOT shared: No personal ID data stored</li>
              </ul>

              <p className="font-bold text-text-primary mt-3">Telegram (Bot Platform):</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Purpose: Service delivery interface</li>
                <li>Data shared: Messages, file uploads per Telegram's terms</li>
                <li>Privacy: Governed by Telegram's privacy policy</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">5.2 No Data Selling</h3>
              <p>We <strong>DO NOT</strong> sell, rent, or trade your data to any third parties.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">6. YOUR RIGHTS</h2>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">6.1 Right to Access</h3>
              <p>You can request information about:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your current credit balance</li>
                <li>Your transaction history</li>
                <li>When your files will be deleted</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">6.2 Right to Deletion</h3>
              <p>You can request immediate deletion of:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Your account</li>
                <li>Unused credits (no refunds)</li>
                <li>Any pending files</li>
              </ul>
              <p>Contact us via Telegram or email to request deletion.</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">6.3 No Data Portability</h3>
              <p>Since we don't store personal ID data, there is no data to export or port.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">7. COOKIES & TRACKING</h2>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-4">7.1 No Tracking</h3>
              <p>We <strong>DO NOT</strong> use:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Cookies for tracking</li>
                <li>Analytics tools (Google Analytics, etc.)</li>
                <li>Advertising pixels</li>
                <li>Social media tracking</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-text-primary mt-6">7.2 Essential Cookies Only</h3>
              <p>We use only essential session cookies for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Login authentication (web version)</li>
                <li>Maintaining user sessions</li>
                <li>These cookies do not track or profile you</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">8. CHILDREN'S PRIVACY</h2>
            <p>This service is not intended for users under 18. We do not knowingly collect data from minors. If we learn we have collected data from a minor, we will delete it immediately.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">9. INTERNATIONAL USERS</h2>
            <p>This service is operated from Ethiopia and governed by Ethiopian law. If you access from outside Ethiopia, you consent to data processing in Ethiopia.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">10. CHANGES TO PRIVACY POLICY</h2>
            <p>We may update this policy at any time. Changes are effective immediately upon posting. Continued use after changes constitutes acceptance.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">11. DATA PROCESSING SUMMARY</h2>
            
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 text-text-primary">
                    <th className="py-2 pr-4 font-bold">Data Type</th>
                    <th className="py-2 px-4 font-bold">Collected?</th>
                    <th className="py-2 px-4 font-bold">Stored?</th>
                    <th className="py-2 px-4 font-bold">How Long?</th>
                    <th className="py-2 pl-4 font-bold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border/20">
                    <td className="py-2 pr-4 font-bold">ID Screenshots</td>
                    <td className="py-2 px-4 text-success">✅ Yes</td>
                    <td className="py-2 px-4 text-error">❌ No</td>
                    <td className="py-2 px-4">Immediately removed</td>
                    <td className="py-2 pl-4">Processing only</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-2 pr-4 font-bold">Extracted Text</td>
                    <td className="py-2 px-4 text-warning">✅ Temporarily</td>
                    <td className="py-2 px-4 text-error">❌ No</td>
                    <td className="py-2 px-4">0 (not stored)</td>
                    <td className="py-2 pl-4">Generation only</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-2 pr-4 font-bold">Face Photos</td>
                    <td className="py-2 px-4 text-warning">✅ Temporarily</td>
                    <td className="py-2 px-4 text-error">❌ No</td>
                    <td className="py-2 px-4">Immediately removed</td>
                    <td className="py-2 pl-4">Placement in output</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-2 pr-4 font-bold">Output Files</td>
                    <td className="py-2 px-4 text-success">✅ Yes</td>
                    <td className="py-2 px-4 text-warning">✅ Temporarily</td>
                    <td className="py-2 px-4">48 hours</td>
                    <td className="py-2 pl-4">Download delivery</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-2 pr-4 font-bold">Name/DOB/ID Numbers</td>
                    <td className="py-2 px-4 text-error">❌ No</td>
                    <td className="py-2 px-4 text-error">❌ No</td>
                    <td className="py-2 px-4">0</td>
                    <td className="py-2 pl-4">Not retained</td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-2 pr-4 font-bold">Payment Proof</td>
                    <td className="py-2 px-4 text-success">✅ Yes</td>
                    <td className="py-2 px-4 text-success">✅ Yes</td>
                    <td className="py-2 px-4">90 days</td>
                    <td className="py-2 pl-4">Verification only</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-bold">Credit Balance</td>
                    <td className="py-2 px-4 text-success">✅ Yes</td>
                    <td className="py-2 px-4 text-success">✅ Yes</td>
                    <td className="py-2 px-4">Until account deletion</td>
                    <td className="py-2 pl-4">Service operation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">12. YOUR CONSENT</h2>
            <p>By using National ID Formatter, you consent to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Temporary processing of uploaded images</li>
              <li>Automatic deletion of all files per stated schedule</li>
              <li>Use of third-party services (Supabase)</li>
              <li>Terms outlined in this privacy policy</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black font-['Space_Grotesk'] text-text-primary">13. CONTACT US</h2>
            <p>For privacy questions or data deletion requests:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email: <a href="mailto:nationalidformatter@gmail.com" className="text-accent underline">nationalidformatter@gmail.com</a></li>
            </ul>
            <p className="mt-4">We will respond within 48 hours.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
