// apps/bot/src/i18n.ts

type SupportedLanguages = 'en' | 'am';

const translations: Record<string, Record<SupportedLanguages, string>> = {
  start_msg: {
    en: `🇪🇹 *Ethiopian Digital ID Formatter*\n\nGet a professional, print-ready digital ID card in seconds!\n\n🚀 *How it works:*\n1️⃣ Upload 3 clear screenshot (Front, Back, Third Page)\n2️⃣ We automatically format, clean, and crop everything\n3️⃣ Download your high-quality file ready for printing\n\n💡 *Tip: For best results, use original screenshot.*\n\n💳 *Your Balance:* \`{{credits}} credits\``,
    am: `🇪🇹 *የኢትዮጵያ ዲጂታል መታወቂያ አስተካካይ*\n\nየተስተካከለ እና ለህትመት ዝግጁ የሆነ ዲጂታል መታወቂያ በሰከንዶች ውስጥ ያግኙ!\n\n🚀 *እንዴት እንደሚሰራ:*\n1️⃣ 3 ጥራት ያላቸው ፎቶዎችን(screenshots) ይላኩ (የፊት፣ የጀርባ እና ሶስተኛው ገጽ)\n2️⃣ እኛ በራሳችን እናስተካክለዋለን\n3️⃣ ለህትመት ዝግጁ የሆነ ጥራት ያለው ምስል ያውርዱ\n\n💡 *ጠቃሚ ምክር: የተሻለ ጥራት ለማግኘት፣ ስክሪንሾት በማንሳት  ይጠቀሙ።*\n\n💳 *ያሎት ቀሪ ሂሳብ:* \`{{credits}}\``
  },
  choose_language: {
    en: '🌐 Please select your preferred language:',
    am: '🌐 እባክዎ የሚፈልጉትን ቋቋ ይምረጡ:'
  },
  lang_changed: {
    en: '✅ Language changed to English.',
    am: '✅ ቋንቋ ወደ አማርኛ ተቀይሯል።'
  },
  btn_gen_id: {
    en: '🪪 Generate ID',
    am: '🪪 መታወቂያ አዘጋጅ'
  },
  btn_buy_credits: {
    en: '💳 Buy Credits',
    am: '💳 ክሬዲት ግዛ'
  },
  btn_history: {
    en: '📂 History',
    am: '📂 ታሪክ'
  },
  btn_support: {
    en: '📞 Support',
    am: '📞 እርዳታ'
  },
  btn_language: {
    en: '🌐 Language',
    am: '🌐 ቋንቋ'
  },
  btn_cancel: {
    en: '❌ Cancel & Reset',
    am: '❌ ሰርዝ እና እንደገና ጀምር'
  },
  not_enough_credits: {
    en: '❌ Not enough credits. Please top up.',
    am: '❌ በቂ ክሬዲት የለዎትም። እባክዎ ይሙሉ ።'
  },
  step1_caption: {
    en: '📷 *Step 1 of 3*\n\nPlease upload a clear photo of the **FRONT** of the Digital ID exactly like the example image above.\n\n_Note: Please upload an actual image file, not a document._',
    am: '📷 *ደረጃ 1 ከ 3*\n\nእባክዎ ከላይ ባለው ምሳሌ መሠረት የዲጂታል መታወቂያውን **የፊት** ክፍል ጥራት ያለው ፎቶ ይላኩ።\n\n_ማስታወሻ: እባክዎ እንደ ፎቶ ይላኩ እንጂ እንደ ሰነድ (document) አይደለም።_'
  },
  step2_caption: {
    en: '📷 *Step 2 of 3*\n\nGreat! Now please send a clear photo of the **BACK** of the ID like the example above.',
    am: '📷 *ደረጃ 2 ከ 3*\n\nበጣም ጥሩ! አሁን እባክዎ ከላይ ባለው ምሳሌ መሠረት የመታወቂያውን **የጀርባ** ክፍል ጥራት ያለው ፎቶ ይላኩ።'
  },
  step3_caption: {
    en: '📷 *Step 3 of 3*\n\nAlmost done! Lastly, send a **PROFILE** photo showing clearly just the face, like the example below.',
    am: '📷 *ደረጃ 3 ከ 3*\n\nተቃርበናል! በመጨረሻ፣ ፊትን ብቻ በግልፅ የሚያሳይ የ**ፕሮፋይል** ፎቶ ከምሳሌው ጋር በማመሳሰል ይላኩ።'
  },
  processing: {
    en: '⏳ *Magic in progress...*\nReconstructing your ID. This usually takes around 10 - 30 seconds 🪄',
    am: '⏳ *እየተሰራ ነው...*\nመታወቂያዎ እየተዘጋጀ ነው። ይህ ብዙውን ጊዜ 10 - 30 ሰከንዶች ይወስዳል 🪄'
  },
  success_caption: {
    en: '✅ *ID Formatted Successfully*\n\n🖨️ *Ready for Printing*\n📐 Correct size & margins applied.\n\n💳 *{{creditsLeft}} credits remaining.*',
    am: '✅ *መታወቂያው በተሳካ ሁኔታ ተስተካክሏል*\n\n🖨️ *ለህትመት ዝግጁ ነው*\n📐 ትክክለኛ መጠን እና ልኬት ተተግብሯል።\n\n💳 *{{creditsLeft}} ቀሪ ክሬዲት አሎት።*'
  },
  btn_format_another: {
    en: '🔄 Format Another',
    am: '🔄 ሌላ አዘጋጅ'
  },
  btn_home: {
    en: '🏠 Home',
    am: '🏠 ዋና ገጽ'
  },
  error_image_expected: {
    en: '⚠️ Please send a standard image file (like a photo from your gallery or camera), not a document or text.',
    am: '⚠️ እባክዎ የተለመደ የፎቶ ፋይል (ከጋለሪዎ ወይም ካሜራዎ) ይላኩ እንጂ ጽሑፍ ወይም ሰነድ አይላኩ።'
  },
  error_failed_format: {
    en: '❌ *Formatting failure*\n{{errorMsg}}',
    am: '❌ *ማስተካከል አልተሳካም*\n{{errorMsg}}'
  },
  menu_topup: {
    en: `💳 *Buy Credits*\n\nSelect a package to continue:\n\n🔹 1 ID — 50 ETB\n🔹 10 IDs — 450 ETB\n🔹 40 IDs — 1400 ETB\n\nClick below to select:`,
    am: `💳 *ክሬዲት ይግዙ*\n\nለመቀጠል ፓኬጅ ይምረጡ:\n\n🔹 1 መታወቂያ — 50 ብር\n🔹 10 መታወቂያ — 450 ብር\n🔹 40 መታወቂያ — 1400 ብር\n\nለመምረጥ ከታች ይጫኑ:`
  },
  btn_pkg_1: {
    en: '🔹 1 ID (50 ETB)',
    am: '🔹 1 መታወቂያ (50 ብር)'
  },
  btn_pkg_10: {
    en: '🔹 10 IDs (450 ETB)',
    am: '🔹 10 መታወቂያ (450 ብር)'
  },
  btn_pkg_40: {
    en: '🔹 40 IDs (1400 ETB)',
    am: '🔹 40 መታወቂያ (1400 ብር)'
  },
  btn_back: {
    en: '⬅️ Back',
    am: '⬅️ ተመለስ'
  },
  menu_history: {
    en: '📂 *Your Recent Jobs*\n\n',
    am: '📂 *የቅርብ ጊዜ ስራዎችዎ*\n\n'
  },
  menu_help: {
    en: `🛠️ *Help & Support*\n\n• Each ID generation costs **1 credit**.\n• Ensure your photos are clear, well-lit, and legible.\n• *Avoid glare* from lights when taking photos of physical screens.\n• For manual bank top-ups, please allow up to 10 minutes for an admin to verify and approve.\n\n📞 *Still need help?* Contact our support team: @AdminUsername\n\n📍 *Commands:*\n/start - Show the Main Menu\n/language - Change Language\n/cancel - Cancel whatever you are currently doing`,
    am: `🛠️ *እርዳታ እና ድጋፍ*\n\n• እያንዳንዱ መታወቂያ ማዘጋጀት **1 ክሬዲት** ያስከፍላል።\n• ፎቶዎችዎ ግልጽ፣ ብርሃን ያላቸው እና የሚነበቡ መሆናቸውን ያረጋግጡ።\n• ፎቶ ሲያነሱ የብርሃን ነፀብራቅ (*glare*) እንዳይኖር ይጠንቀቁ።\n• ለባንክ ክፍያዎች፣ አድሚን እስኪያረጋግጥ እና እስኪያፀድቅ ድረስ እስከ 10 ደቂቃ ሊወስድ ይችላል።\n\n📞 *ተጨማሪ እርዳታ ይፈልጋሉ?* ድጋፍ ሰጪ ቡድናችንን ያነጋግሩ: @AdminUsername\n\n📍 *ትዕዛዞች:*\n/start - ዋናውን ምናሌ አሳይ\n/language - ቋንቋ ቀይር\n/cancel - አሁን እየሰሩት ያለውን ነገር ለመሰረዝ`
  },
  pkg_details: {
    en: `🧾 *Order Details*\n\nPackage ID: *{{pkgId}}*\n\n📍 *Payment Instructions*\nSend payment to:\n🏦 *Bank:* Telebirr /\n🔢 *Account:* 1000xxxxxx\n👤 *Name:* National ID Services\n\n📸 *Final Step:*\nHow would you like to provide proof?`,
    am: `🧾 *የትዕዛዝ ዝርዝሮች*\n\nየፓኬጅ መለያ: *{{pkgId}}*\n\n📍 *የክፍያ መመሪያዎች*\nክፍያዎን ወደዚህ ይላኩ:\n🏦 *ባንክ:* ቴሌብር /\n🔢 *ክፍያ ሂሳብ:* 1000xxxxxx\n👤 *ስም:* National ID Services\n\n📸 *የመጨረሻ ደረጃ:*\nማስረጃዎን እንዴት ማቅረብ ይፈልጋሉ?`
  },
  btn_proof_screenshot: {
    en: '📸 Upload Screenshot',
    am: '📸 ስክሪንሾት ይላኩ'
  },
  btn_proof_text: {
    en: '✍️ Transaction Reference / ID',
    am: '✍️ የግብይት ማጣቀሻ / መለያ'
  },
  wait_proof_screenshot: {
    en: '📷 Please send a screenshot of your payment transfer.',
    am: '📷 እባክዎ የክፍያ ማስተላለፍዎን ስክሪንሾት ይላኩ።'
  },
  wait_proof_text: {
    en: '✍️ Please send the **Transaction ID** or **Reference Text** of your payment.',
    am: '✍️ እባክዎ የክፍያዎን **የግብይት መለያ (Transaction ID)** ወይም **ማጣቀሻ ጽሑፍ** ይላኩ።'
  },
  submitting_proof: {
    en: '⏳ *Submitting proof...*',
    am: '⏳ *ማስረጃዎ እየተላከ ነው...*'
  },
  submitting_ref: {
    en: '⏳ *Submitting reference...*',
    am: '⏳ *ማጣቀሻዎ እየተላከ ነው...*'
  },
  payment_submitted: {
    en: '✅ *Success!*\nYour payment has been submitted for review. An admin will approve it shortly.',
    am: '✅ *ተሳክቷል!*\nክፍያዎ ለግምገማ ቀርቧል። አድሚን በቅርቡ ያጸድቀዋል።'
  },
  action_cancelled: {
    en: '🔄 *Action cancelled.* You can start over anytime.',
    am: '🔄 *እርምጃው ተሰርዟል።* በማንኛውም ጊዜ እንደገና መጀመር ይችላሉ።'
  }
};

export function t(key: string, lang: string = 'en', params?: Record<string, string | number>): string {
  const language = (lang === 'en' || lang === 'am') ? lang : 'en';
  const entry = translations[key];
  if (!entry) return key;

  let text = entry[language];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return text;
}
