// apps/web/src/lib/i18n.ts

export type SupportedLanguages = 'en' | 'am';

export const translations: Record<string, Record<SupportedLanguages, string>> = {
  // Common
  home: { en: 'Home', am: 'ዋና ገጽ' },
  dashboard: { en: 'Dashboard', am: 'ዳሽቦርድ' },
  history: { en: 'History', am: 'ታሪክ' },
  credits: { en: 'Credits', am: 'ክሬዲት' },
  add_credits: { en: 'ADD CREDITS', am: 'ክሬዲት ጨምር' },
  low_balance: { en: 'Low Balance', am: 'ዝቅተኛ ቀሪ ሂሳብ' },
  standard_account: { en: 'Standard Account', am: 'መደበኛ አካውንት' },
  login: { en: 'Login', am: 'ግባ' },
  register: { en: 'Register', am: 'ተመዝገብ' },
  logout: { en: 'Logout', am: 'ውጣ' },
  back: { en: 'Back', am: 'ተመለስ' },
  cancel: { en: 'Cancel', am: 'ሰርዝ' },
  submit: { en: 'Submit', am: 'ላክ' },
  loading: { en: 'Loading...', am: 'በመጫን ላይ...' },
  or: { en: 'or', am: 'ወይም' },

  // Header
  nav_admin: { en: 'Admin', am: 'አድሚን' },
  nav_buy_credits: { en: 'Buy Credits', am: 'ክሬዲት ግዛ' },
  buy_credits: { en: 'Buy Credits', am: 'ክሬዲት ግዛ' },
  nav_admin_portal: { en: 'Admin Portal', am: 'የአድሚን ገጽ' },
  nav_sign_out: { en: 'Sign Out', am: 'ውጣ' },
  signed_in_as: { en: 'Signed in as', am: 'ገብተዋል በ' },
  available_credits: { en: 'Available Credits', am: 'ያሎት ቀሪ ክሬዲት' },

  // Landing Page
  hero_title_1: { en: 'Screenshot to', am: 'ስክሪንሾት ወደ' },
  hero_title_2: { en: 'Print-Ready', am: 'ለህትመት ዝግጁ' },
  hero_title_3: { en: 'Formatter.', am: 'መቀየርያ።' },
  hero_desc: { en: 'Upload your digital Ethiopian ID screenshots and instantly download perfectly aligned, high-resolution formats ready for professional printing.', am: 'የዲጂታል መታወቂያዎን ስክሪንሾት በመጫን ለህትመት ዝግጁ የሆነ ጥራት ያለው ምስል ወዲያውኑ ያውርዱ።' },
  start_now: { en: 'START NOW', am: 'አሁኑኑ ይጀምሩ' },
  telegram_bot: { en: 'Telegram Bot', am: 'ቴሌግራም ቦት' },
  fastest_way: { en: 'The fastest way to format your Ethiopian ID for printing', am: 'የኢትዮጵያን መታወቂያ ለህትመት ለማዘጋጀት የቀለለ መንገድ' },
  system_architecture: { en: 'System Architecture', am: 'የስርዓቱ አወቃቀር' },
  proprietary_workflow: { en: 'Proprietary formatting workflow', am: 'ልዩ የአሰራር ሂደት' },
  
  // Steps
  capture: { en: 'Capture', am: 'ፎቶ አንሳ' },
  capture_desc: { en: 'Upload raw screenshots. Our engine handles skew, blur, and lighting variance automatically.', am: 'ስክሪንሾቱን ይጫኑ። የእኛ ሲስተም በራሱ ጥራቱን ያስተካክላል።' },
  normalize: { en: 'Normalize', am: 'አስተካክል' },
  normalize_desc: { en: 'Identity features are extracted and mapped to standardized print dimensions using computer vision.', am: 'የመታወቂያው ባህሪያት ተለይተው ለመደበኛ የህትመት ልኬቶች እንዲመጥኑ ይደረጋል።' },
  deliver: { en: 'Deliver', am: 'አቅርብ' },
  deliver_desc: { en: 'Download a high-precision PNG/JPG file, optimized for commercial-grade photo printers.', am: 'ለህትመት የተመቻቸ ምስል ያውርዱ።' },

  // Dashboard / Action Page
  upload_3_screenshots: { en: 'Upload 3 screenshots in the same order as the example guide.', am: 'በምሳሌው መሠረት 3 ስክሪንሾቶችን ይጫኑ።' },
  example_guide: { en: 'Example Guide', am: 'የምሳሌ መመሪያ' },
  follow_these_steps: { en: 'Follow these steps', am: 'እነዚህን ደረጃዎች ይከተሉ' },
  front_id: { en: 'Front Side', am: 'የፊት ገጽ' },
  back_id: { en: 'Back Side', am: 'የጀርባ ገጽ' },
  profile_photo: { en: 'Your Photo', am: 'የእርስዎ ፎቶ' },
  front_desc: { en: 'Full image of ID front. (NO CROP)', am: 'ሙሉ የመታወቂያው የፊት ገጽ። (አይቆርጡት)' },
  back_desc: { en: 'QR Code visible on back. (QR CLEAR)', am: 'የጀርባው QR ኮድ በግልፅ ይታይ።' },
  profile_desc: { en: 'Screenshot of profile. (SHOW PHOTO)', am: 'የፕሮፋይል ገጽ ስክሪንሾት።' },
  step_1: { en: '1', am: '1' },
  step_2: { en: '2', am: '2' },
  step_3: { en: '3', am: '3' },
  generate_btn: { en: 'Generate Print-Ready ID', am: 'ለህትመት ዝግጁ የሆነ መታወቂያ አዘጋጅ' },
  in_queue: { en: 'In Queue...', am: 'በተራ ላይ...' },
  generating: { en: 'Generating...', am: 'እየተዘጋጀ ነው...' },
  costs_1_credit: { en: 'Costs 1 credit — auto-updated balance', am: '1 ክሬዲት ያስከፍላል' },
  reset_all: { en: 'Reset All', am: 'ሁሉንም ሰርዝ' },
  secure_notice: { en: 'Secure — automatic deletion after processing.', am: 'ደህንነቱ የተጠበቀ — ከሂደት በኋላ ወዲያውኑ ይሰረዛል።' },
  success_formatted: { en: 'Successfully Formatted!', am: 'በተሳካ ሁኔታ ተስተካክሏል!' },
  success_desc: { en: 'Your ID is previewed below and ready for use.', am: 'መታወቂያዎ ከዚህ በታች ቀርቧል፣ ለመጠቀም ዝግጁ ነው።' },
  tip_long_press: { en: '💡 Tip: Long press the image above to save directly to your Phone Gallery', am: '💡 ጠቃሚ ምክር: ምስሉን ስልኮ ላይ ለማስቀመጥ ተጭነው ይያዙት' },
  download_png: { en: 'Download PNG', am: 'ያውርዱ' },
  preview_full: { en: 'Preview Full', am: 'ሙሉውን ይመልከቱ' },
  create_another: { en: 'Create Another ID', am: 'ሌላ መታወቂያ አዘጋጅ' },

  // Credits Page
  choose_plan: { en: 'Select Your Plan', am: 'ፓኬጅ ይምረጡ' },
  choose_plan_desc: { en: 'Select your preferred conversion package', am: 'የሚፈልጉትን የክሬዲት ፓኬጅ ይምረጡ' },
  recommended: { en: 'Recommended', am: 'ተመራጭ' },
  buy_now: { en: 'Buy Now', am: 'አሁኑኑ ይግዙ' },
  payment_details: { en: 'Payment Details', am: 'የክፍያ ዝርዝሮች' },
  confirm_payment: { en: 'Confirm Payment', am: 'ክፍያን አረጋግጥ' },
  submission_received: { en: 'Submission Received', am: 'ማመልከቻው ገብቷል' },
  activation_time: { en: 'usually takes about 15 min for account activation', am: 'ለማግበር አብዛኛውን ጊዜ 15 ደቂቃ ይወስዳል' },
  submitted: { en: 'Submitted', am: 'ገብቷል' },
  verifying: { en: 'Verifying', am: 'በማረጋገጥ ላይ' },
  activation: { en: 'Activation', am: 'ማግበር' },
  return_dashboard: { en: 'Return to Dashboard', am: 'ወደ ዳሽቦርድ ይመለሱ' },
  id_conversions: { en: 'ID Conversions', am: 'መታወቂያ ማስተካከያ' },
  select_plan: { en: 'Select Plan', am: 'ፓኬጅ ይምረጡ' },
  change_plan: { en: 'Change Plan', am: 'ፓኬጅ ቀይር' },
  payment_method: { en: 'Payment Method', am: 'የክፍያ መንገድ' },
  standard_transfer_method: { en: 'Standard transfer method', am: 'መደበኛ የክፍያ መንገድ' },
  account_details: { en: 'Account Details', am: 'የአካውንት ዝርዝሮች' },
  wallet_number: { en: 'Wallet Number', am: 'የስልክ ቁጥር' },
  account_holder: { en: 'Account Holder', am: 'የአካውንቱ ስም' },
  amount_due: { en: 'Amount Due', am: 'የሚከፈል መጠን' },
  order_summary: { en: 'Order Summary', am: 'የትዕዛዝ ማጠቃለያ' },
  transaction_reference: { en: 'Transaction Reference', am: 'የክፍያ መለያ (Reference)' },
  upload_receipt: { en: 'Upload Receipt', am: 'ደረሰኝ ይላኩ' },
  attach_image_proof: { en: 'Attach image proof', am: 'ደረሰኙን እዚህ ያያይዙ' },
  once_verified_notice: { en: 'Once verified, your credits will be added. You can safely leave this page now.', am: 'ክፍያው እንደተረጋገጠ ክሬዲቱ ይጨመራል። አሁን ገጹን መዝጋት ይችላሉ።' },
  process_notice: { en: 'Process Notice', am: 'ጠቃሚ ማሳሰቢያ' },
  fraud_notice: { en: 'Submit only after completing the transaction. We verify all references against bank statements. Fraudulent submissions result in permanent account suspension.', am: 'ክፍያውን ካጠናቀቁ በኋላ ብቻ መረጃውን ይላኩ። ሁሉንም መረጃዎች እናረጋግጣለን። የተሳሳተ መረጃ መላክ አካውንትዎ እንዲዘጋ ያደርጋል።' },
  
  // History Page
  your_history: { en: 'Your History', am: 'የእርስዎ ታሪክ' },
  history_desc: { en: 'View your past generated IDs. Files are available for 48 hours.', am: 'የቀደሙ የተሰሩ መታወቂያዎችን ይመልከቱ። ፋይሎቹ ለ48 ሰአታት ብቻ ይቆያሉ።' },
  no_jobs_found: { en: 'No jobs found. Start by formatting an ID!', am: 'ምንም የተሰራ መታወቂያ የለም። መታወቂያ በማስተካከል ይጀምሩ!' },
  job_id: { en: 'Job ID', am: 'የስራ መለያ' },
  status: { en: 'Status', am: 'ሁኔታ' },
  date: { en: 'Date', am: 'ቀን' },
  action: { en: 'Action', am: 'ድርጊት' },
  refresh: { en: 'Refresh', am: 'አድስ' },
  download: { en: 'Download', am: 'ያውርዱ' },

  // Auth Pages
  welcome_back: { en: 'Welcome back', am: 'እንኳን ደህና መጡ' },
  email_address: { en: 'Email Address', am: 'ኢሜይል' },
  password: { en: 'Password', am: 'የይለፍ ቃል' },
  remember_me: { en: 'Remember me', am: 'አስታውሰኝ' },
  forgot_password_q: { en: 'Forgot password?', am: 'የይለፍ ቃል ረስተዋል?' },
  dont_have_account: { en: "Don't have an account?", am: 'አካውንት የሎትም?' },
  register_here: { en: 'Register here', am: 'እዚህ ይመዝገቡ' },
  login_google: { en: 'Login with Google', am: 'በጎግል ይግቡ' },
  invalid_credentials: { en: 'Invalid credentials', am: 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል' },
  already_have_account: { en: 'Already have an account?', am: 'አካውንት አለዎት?' },
  create_account: { en: 'Create Account', am: 'አካውንት ይፍጠሩ' },
  full_name: { en: 'Full Name', am: 'ሙሉ ስም' },
  verify_email: { en: 'Verify Email', am: 'ኢሜይል ያረጋግጡ' },
  join_us_today: { en: 'Join us today', am: 'ዛሬውኑ ይቀላቀሉን' },
  your_full_name: { en: 'Your Full Name', am: 'የእርስዎ ሙሉ ስም' },
  confirm: { en: 'Confirm', am: 'አረጋግጥ' },
  verification_code: { en: 'Verification Code', am: 'የማረጋገጫ ኮድ' },
  wrong_email_change: { en: 'Wrong email? Change it', am: 'ኢሜይሉ ተሳስቷል? ቀይረው' },
  resend_code: { en: 'Resend Code', am: 'ኮዱን እንደገና ላክ' },
  i_agree_to: { en: 'I agree to the', am: 'እስማማለሁ በ' },
  terms_of_service: { en: 'Terms of Service', am: 'የአገልግሎት ውሎች' },
  and: { en: 'and', am: 'እና' },
  privacy_policy: { en: 'Privacy Policy', am: 'የግላዊነት ፖሊሲ' },
  confirm_account: { en: 'Confirm Account', am: 'አካውንቱን አረጋግጥ' },
  continue_google: { en: 'Continue with Google', am: 'በጎግል ይቀጥሉ' },
  passwords_dont_match: { en: 'Passwords do not match', am: 'የይለፍ ቃሎቹ አይመሳሰሉም' },
  agree_to_terms_error: { en: 'Please agree to the Terms and Privacy Policy.', am: 'እባክዎ የአገልግሎት ውሎችን እና የግላዊነት ፖሊሲውን ይቀበሉ' },
  code_sent_to: { en: 'Code sent to {{email}}', am: 'ኮዱ ወደ {{email}} ተልኳል' },
  verification_notice: { en: "We've sent a 6-digit verification code to {{email}}. Please enter it below to confirm your account.", am: "ባለ 6 ድጂት የማረጋገጫ ኮድ ወደ {{email}} ልከናል። አካውንትዎን ለማረጋገጥ እባክዎ ከታች ያስገቡት።" },

  // Legal Pages
  back_to_home: { en: 'Back to Home', am: 'ወደ መነሻ ተመለስ' },
  last_updated: { en: 'Last Updated: {{date}}', am: 'መጨረሻ የተሻሻለው፦ {{date}}' },

  // Verify Email Page
  check_your_email: { en: 'Check Your Email', am: 'ኢሜይልዎን ያረጋግጡ' },
  verification_email_sent: { en: "We've sent a verification link to", am: 'የማረጋገጫ ሊንክ ወደ' },
  verification_email_sent_suffix: { en: '. Please check your inbox and click the link to verify your account.', am: ' ልከናል። እባክዎ ኢሜይልዎን ይመልከቱ እና አካውንትዎን ለማረጋገጥ ሊንኩን ይጫኑ።' },
  resend_verification: { en: 'Resend Verification Email', am: 'የማረጋገጫ ኢሜይል እንደገና ላክ' },
  wrong_email_go_back: { en: 'Wrong email? Go back to register', am: 'ኢሜይሉ ተሳስቷል? ወደ ምዝገባ ተመለስ' },
  email_resent: { en: 'Verification email resent!', am: 'የማረጋገጫ ኢሜይል እንደገና ተልኳል!' },
  check_spam_folder: { en: "Didn't receive it? Check your spam folder.", am: 'አልደረሰዎትም? የስፓም ፎልደርዎን ይመልከቱ።' },

  // Password Reset
  reset_access: { en: 'Reset Access', am: 'መግቢያዎን ያስተካክሉ' },
  create_password: { en: 'Create Password', am: 'አዲስ የይለፍ ቃል ይፍጠሩ' },
  secure_your_account: { en: 'Secure your account', am: 'አካውንትዎን ደህንነቱ የተጠበቀ ያድርጉ' },
  send_reset_code: { en: 'Send Reset Code', am: 'የመቀየሪያ ኮድ ላክ' },
  reset_password: { en: 'Reset Password', am: 'የይለፍ ቃል ቀይር' },
  back_to_login: { en: 'Back to Login', am: 'ወደ መግቢያ ተመለስ' },
  new_password: { en: 'New Password', am: 'አዲስ የይለፍ ቃል' },
  confirm_password: { en: 'Confirm Password', am: 'የይለፍ ቃል አረጋግጥ' },
  mistyped_email_change: { en: 'Mistyped email? Change it', am: 'ኢሜይሉ ተሳስቷል? ቀይረው' },
  reset_code_sent: { en: 'Reset code sent to your email.', am: 'የመቀየሪያ ኮዱ ወደ ኢሜይልዎ ተልኳል።' },
  password_reset_success: { en: 'Your password has been successfully reset! Redirecting to login...', am: 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል! ወደ መግቢያ ገጽ እየተመለሰ ነው...' },

  // Not Found
  page_not_found: { en: '404 — Page not found', am: '404 — ገጹ አልተገኘም' },
  page_not_exist: { en: 'This page doesn’t exist or has been moved.', am: 'ይህ ገጽ የለም ወይም ቦታው ተቀይሯል።' },
  go_back_home: { en: 'Go back home', am: 'ወደ መነሻ ተመለስ' },

  // Password Reset Completion
  complete_your_reset: { en: 'Complete your reset', am: 'ለውጡን ያጠናቅቁ' },
  success_exclamation: { en: 'Success!', am: 'ተሳክቷል!' },

  // Footer Disclaimer
  disclaimer_title: { en: 'DISCLAIMER OF AFFILIATION AND LIABILITY:', am: 'የግንኙነት እና የኃላፊነት ማስተባበያ፡' },
  disclaimer_text_1: { en: 'This platform is an independent service and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with the Ethiopian National ID Program (Fayda) or the official website at ', am: 'ይህ መድረክ ራሱን የቻለ አገልግሎት ሲሆን ከኢትዮጵያ ብሄራዊ መታወቂያ ፕሮግራም (ፋይዳ) ወይም ከኦፊሴላዊው ድረ-ገጽ ' },
  disclaimer_text_2: { en: '. The generated output images are provided "as is" without warranties of any kind. Users assume full responsibility and legal liability for the generation, use, and distribution of all outputs. By using this service, you explicitly agree to our ', am: ' ጋር ምንም አይነት ይፋዊ ግንኙነት፣ ትብብር ወይም እውቅና የለውም። የሚመነጩት ምስሎች ምንም አይነት ዋስትና ሳይሰጥባቸው "እንዳሉ" የሚቀርቡ ናቸው። ተጠቃሚዎች ምስሎቹን በማመንጨት፣ በመጠቀም እና በማሰራጨት ረገድ ለሚመጣ ማንኛውም ህጋዊ ኃላፊነት ሙሉ ተጠያቂነትን ይወስዳሉ። ይህን አገልግሎት በመጠቀምዎ በ' },
  disclaimer_terms: { en: 'Terms of Service', am: 'አገልግሎት ውል' },
  disclaimer_policy: { en: 'Privacy Policy', am: 'ግላዊነት ፖሊሲያችን' },
  disclaimer_and: { en: ' and ', am: ' እና በ' },
  disclaimer_end: { en: '.', am: ' መስማማትዎን በግልፅ ያረጋግጣሉ።' },
};

export function t(key: string, lang: SupportedLanguages = 'en', params?: Record<string, string | number>): string {
  const entry = translations[key];
  if (!entry) return key;

  let text = entry[lang] || entry['en'];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return text;
}
