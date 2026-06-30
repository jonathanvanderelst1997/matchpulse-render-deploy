import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Flame,
  Globe2,
  Heart,
  HeartPulse,
  Link2,
  Mail,
  MessageSquare,
  Mic,
  MoreVertical,
  Navigation,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  WandSparkles,
  X,
} from 'lucide-react'
import {
  acceptMessageRequest as acceptMessageRequestOnServer,
  cleanupBetaTestData,
  clearAttentionSignals as clearAttentionSignalsOnServer,
  completePasswordReset,
  completeSupabaseAuth as completeApiSupabaseAuth,
  completeOnboarding,
  createBetaTester,
  createDatePlan,
  deleteAccount,
  exportPrivateProfile,
  fetchAppState,
  hideMatchOnServer,
  removeAttentionSignal,
  removeMemory,
  reportAndBlockMatch,
  requestPasswordReset,
  verifyEmailToken,
  resetHiddenOnServer,
  saveAttentionSignal,
  saveMemories,
  saveProfile,
  sendMessage as sendMessageToServer,
  sendMatchFeedback,
  sendTesterFeedback,
  sendSundayBriefing,
  startAuthSession,
  toggleFavoriteOnServer,
  toggleLinkedTool,
  togglePrivacy,
  updateMemoryConsent,
  uploadProfilePhoto,
} from './api'
import { matches, nearby, viewer } from './data'
import { canUseSupabaseOAuth, completeSupabaseOAuth, startSupabaseOAuth } from './supabaseAuth'
import './App.css'

const genderIdentityOptions = ['Not shown', 'Man', 'Woman', 'Non-binary', 'Trans man', 'Trans woman', 'Another identity']
const interestPreferences = ['Men', 'Women', 'Men & women', 'Everyone']
const languages = ['Nederlands', 'English', 'Francais', 'Deutsch', 'Espanol', 'Italiano', 'Portuguese', 'Arabic']
const photoPrivacyOptions = [
  { id: 'public', label: 'Visible', detail: 'Photos are visible on your profile.' },
  { id: 'blurred', label: 'Blur first', detail: 'People see a soft preview until you chat.' },
  { id: 'private', label: 'Ask first', detail: 'People can request access after a respectful chat.' },
]
const ONBOARDING_PHOTO_LIMIT = 6

const optionLabels = {
  Nederlands: {
    'Not shown': 'Niet tonen',
    Man: 'Man',
    Woman: 'Vrouw',
    'Non-binary': 'Non-binair',
    'Trans man': 'Trans man',
    'Trans woman': 'Trans vrouw',
    'Another identity': 'Andere identiteit',
    Men: 'Mannen',
    Women: 'Vrouwen',
    'Men & women': 'Mannen & vrouwen',
    Everyone: 'Iedereen',
    public: 'Zichtbaar',
    blurred: 'Eerst vervagen',
    private: 'Eerst vragen',
  },
  English: {},
}

function displayOption(value, language = viewer.language) {
  return optionLabels[language]?.[value] ?? value
}

const photoPrivacyDetails = {
  Nederlands: {
    public: "Foto's zijn zichtbaar op je profiel.",
    blurred: 'Mensen zien een zachte preview tot je chat.',
    private: 'Mensen kunnen na een respectvolle chat toegang vragen.',
  },
}

function normalizeOnboardingPhotos(photos) {
  return [...new Set((Array.isArray(photos) ? photos : []).map((photo) => (typeof photo === 'string' ? photo.trim() : '')).filter(Boolean))].slice(
    0,
    ONBOARDING_PHOTO_LIMIT,
  )
}

function resolveOnboardingPhotos(source = {}) {
  const list = Array.isArray(source?.photos) ? source.photos : []
  const fallback = source?.profile?.photo ? [source.profile.photo] : []
  return normalizeOnboardingPhotos(list.length ? list : fallback)
}

function onboardingPhotoControlKey(photo = '') {
  const text = String(photo ?? '')
  let hash = 0
  const step = Math.max(1, Math.floor(text.length / 80))
  for (let index = 0; index < text.length; index += step) {
    hash = (hash * 31 + text.charCodeAt(index)) % 1000003
  }
  return `photo-${text.length}-${hash}`
}

function displayPhotoPrivacyDetail(option, language = viewer.language) {
  return photoPrivacyDetails[language]?.[option.id] ?? option.detail
}

const onboardingSteps = [
  { id: 'login' },
  { id: 'pulse' },
  { id: 'profile' },
  { id: 'photos' },
  { id: 'invite' },
]

function onboardingStepIndex(step) {
  return Math.max(0, onboardingSteps.findIndex((item) => item.id === step))
}

const authCopy = {
  English: {
    steps: {
      login: 'Login',
      pulse: 'AI pulse',
      profile: 'Profile',
      photos: 'Photos',
      invite: 'Invite',
    },
    topSecurity: 'Consent-first AI matching',
    back: 'Back',
    saved: 'Autosaved',
    languageDetail: 'Used for onboarding, profile tone and future translated app copy.',
    login: {
      kicker: 'Private beta',
      title: 'Welcome to your living dating profile.',
      loginTitle: 'Log back into your MatchPulse profile.',
      signupTitle: 'Create your living dating profile.',
      body: 'Choose whether you already have a profile or want to create a new one. MatchPulse keeps every account separated by email/mobile and password.',
      loginBody: 'Use your email or mobile number and password. We will bring back only your profile, matches, AI memory and beta invite link.',
      signupBody: 'Create your profile with a real password, let the AI build a soft pulse, then share your link so friends can join and test real compatibility.',
      resetTitle: 'Reset your MatchPulse password.',
      resetBody: 'Enter your email address and we will send a secure reset link if an account exists.',
      resetTokenBody: 'Choose a new password for this MatchPulse account.',
      modeLogin: 'Log in',
      modeSignup: 'Sign up',
      forgot: 'Forgot password?',
      backToLogin: 'Back to login',
      oauthUnavailable: 'Email and password login is required in this beta. OAuth is not enabled yet.',
      contact: 'Email or mobile number',
      resetContact: 'Email address',
      placeholder: 'email or mobile',
      password: 'Password',
      passwordPlaceholder: '8+ characters',
      passwordConfirm: 'Repeat password',
      passwordConfirmPlaceholder: 'repeat your password',
      loginHelper: 'Use the exact same email or mobile from your existing profile.',
      signupHelper: 'This contact becomes your account login. Email is best for password reset.',
      loginPasswordHelper: 'Your password stays private and is never shown on your profile.',
      signupPasswordHelper: 'Use at least 8 characters with 1 letter and 1 number. We hash it server-side.',
      resetHelper: 'For privacy, this screen shows the same message whether the email exists or not.',
      passwordRules: ['8+ characters', '1 letter', '1 number'],
      loginCta: 'Log in to my profile',
      signupCta: 'Create new profile',
      resetCta: 'Send reset link',
      resetCompleteCta: 'Save new password',
      missingContact: 'Add your email or mobile number first.',
      missingPassword: 'Add your password first.',
      passwordPolicy: 'Use at least 8 characters with 1 letter and 1 number.',
      passwordMismatch: 'The two passwords do not match.',
      invalidCredentials: 'This contact and password do not match a MatchPulse account.',
      accountExists: 'An account with this email or mobile already exists. Log in instead.',
      resetMissingToken: 'This reset link is missing or invalid.',
      resetSent: 'Check your email for a secure reset link.',
      resetComplete: 'Password updated. Welcome back.',
      verificationSent: 'A verification email was sent. Open it to confirm your account.',
      verificationPreview: 'Email verification is required. Free beta mode is showing a secure verification link here until real mailbox delivery is connected.',
      verificationPreviewCta: 'Confirm account now',
      verificationComplete: 'Your account is verified. You can now sign in and continue.',
      verificationMissingToken: 'This verification link is missing or invalid.',
      verificationRequired: 'Please verify your email before signing in.',
      alreadyVerified: 'This email is already verified.',
      switchAccount: 'Switch account',
    },
    providers: {
      Google: ['Continue with Google', 'Works as beta login; real OAuth can be enabled later'],
      Email: ['Use email or mobile', 'Free beta access, no SMS cost'],
      Apple: ['Apple later', 'Skipped until Apple setup is worth it'],
    },
    pulse: {
      kicker: 'AI connected',
      title: 'Your MatchPulse AI is waking up.',
      body: 'The profile model starts with your secure beta login, then grows from what you type, choose, upload and later allow from linked tools.',
      signals: [
        'Values, attraction and intent are separate signals.',
        'You can edit or delete assumptions anytime.',
        'The neural map updates while you write.',
      ],
      cta: 'Build my profile',
    },
    profile: {
      kicker: 'Profile signal',
      title: 'Tell the AI who you are.',
      body: 'Keep it natural. When you create the account, this is saved to your profile and becomes the first version of your matching memory.',
      name: 'Name',
      namePlaceholder: 'Your name',
      age: 'Age',
      city: 'City',
      cityPlaceholder: 'Brussels',
      mobile: 'Mobile',
      email: 'Email',
      language: 'Language',
      gender: 'I am',
      genderHelper: 'Optional. Used privately for reciprocal matching unless you show it yourself.',
      interestedIn: 'Show me',
      interestedHelper: 'MatchPulse only shows people where the interest is mutual.',
      question: 'What should your AI understand about you?',
      placeholder: 'I like warm confidence, clear plans, deep conversation and someone who is kind when nobody is watching.',
      signalTitle: 'Live profile signals',
      signalEmpty: 'Type naturally and MatchPulse will pull out values, attraction, boundaries and date rhythm.',
      depth: 'AI profile depth',
      cta: 'Continue to photos',
    },
    photos: {
      kicker: 'Visual signal',
      title: 'Add photos that feel like you.',
      body: 'For this prototype, you can upload from your device or pick a sample so the flow is immediately testable.',
      hint: 'Empty slots are ready first. Drag photos to reorder them; the first photo is your main profile photo.',
      add: 'Add photo',
      change: 'Replace',
      remove: 'Remove photo',
      primary: 'Main photo',
      limitReached: 'You already reached the photo limit. Remove or replace a photo first.',
      uploading: 'Uploading photo...',
      sample: 'Use sample',
      privacyTitle: 'Photo privacy',
      privacyBody: 'You can match without making every photo public. People can ask after chat.',
      cta: 'Create account',
    },
    invite: {
      kicker: 'Beta link ready',
      title: 'Invite people and test real AI matching.',
      body: 'Send this link to friends or early testers. They land on this onboarding flow with your invite code attached.',
      copy: 'Copy',
      copyLink: 'Copy beta link',
      tester: 'Add sample tester',
      enter: 'Enter MatchPulse',
      signals: [
        'New accounts can create their own profile.',
        'Matches can be compared once multiple profiles exist.',
        'Sunday briefing can later email the best matches.',
      ],
    },
    consent: [
      ['AI may learn', 'Values, attraction style, date rhythm, feedback and private attention signals.'],
      ['Private by default', 'Raw memory, timing and deleted signals are not public profile content.'],
      ['You approve sharing', 'Other people only see photos, profile fields and memory you mark as profile-visible.'],
    ],
    visual: {
      ready: 'ready to match',
      photos: 'visual signal',
      profile: 'learning you',
      pulse: 'warming up',
      values: 'Values',
      attraction: 'Attraction',
      rhythm: 'Rhythm',
      boundaries: 'Boundaries',
      core: 'AI profile',
      caption: 'Learning pulse',
      text: 'grows into a living map of values, desire, rhythm and boundaries.',
      signals: {
        values: 'clarity + warmth',
        attraction: 'kind ambition',
        rhythm: 'calm plans',
        boundaries: 'clear respect',
      },
    },
  },
  Nederlands: {
    steps: {
      login: 'Login',
      pulse: 'AI-puls',
      profile: 'Profiel',
      photos: "Foto's",
      invite: 'Uitnodigen',
    },
    topSecurity: 'AI matching met toestemming',
    back: 'Terug',
    saved: 'Automatisch bewaard',
    languageDetail: 'Gebruikt voor onboarding, profieltoon en toekomstige app-vertalingen.',
    login: {
      kicker: 'Private beta',
      title: 'Welkom bij je levende datingprofiel.',
      loginTitle: 'Log opnieuw in op je MatchPulse profiel.',
      signupTitle: 'Maak je levende datingprofiel.',
      body: 'Kies duidelijk of je al een profiel hebt of een nieuw profiel wil maken. MatchPulse houdt elk account apart via e-mail/gsm en wachtwoord.',
      loginBody: 'Gebruik je e-mail of gsm en wachtwoord. We halen alleen jouw profiel, matches, AI memory en beta-link terug op.',
      signupBody: 'Maak je profiel met een echt wachtwoord, laat de AI je profielpuls bouwen en deel daarna je link zodat vrienden echte compatibiliteit kunnen testen.',
      resetTitle: 'Reset je MatchPulse wachtwoord.',
      resetBody: 'Vul je e-mailadres in. Als er een account bestaat, sturen we een veilige resetlink.',
      resetTokenBody: 'Kies een nieuw wachtwoord voor dit MatchPulse account.',
      modeLogin: 'Log in',
      modeSignup: 'Registreren',
      forgot: 'Wachtwoord vergeten?',
      backToLogin: 'Terug naar login',
      oauthUnavailable: 'Deze beta gebruikt alleen e-mail en wachtwoord. Schakel OAuth later in.',
      contact: 'E-mail of gsm-nummer',
      resetContact: 'E-mailadres',
      placeholder: 'e-mail of gsm',
      password: 'Wachtwoord',
      passwordPlaceholder: '8+ tekens',
      passwordConfirm: 'Herhaal wachtwoord',
      passwordConfirmPlaceholder: 'herhaal je wachtwoord',
      loginHelper: 'Gebruik exact dezelfde e-mail of gsm van je bestaande profiel.',
      signupHelper: 'Dit contact wordt je account-login. E-mail is het beste voor wachtwoord reset.',
      loginPasswordHelper: 'Je wachtwoord blijft privé en wordt nooit op je profiel getoond.',
      signupPasswordHelper: 'Gebruik minstens 8 tekens met 1 letter en 1 cijfer. We hashen dit op de server.',
      resetHelper: 'Voor privacy toont dit scherm dezelfde melding, ook als het e-mailadres niet bestaat.',
      passwordRules: ['8+ tekens', '1 letter', '1 cijfer'],
      loginCta: 'Log in op mijn profiel',
      signupCta: 'Nieuw profiel maken',
      resetCta: 'Stuur resetlink',
      resetCompleteCta: 'Nieuw wachtwoord opslaan',
      missingContact: 'Vul eerst je e-mail of gsm in.',
      missingPassword: 'Vul eerst je wachtwoord in.',
      passwordPolicy: 'Gebruik minstens 8 tekens met 1 letter en 1 cijfer.',
      passwordMismatch: 'De twee wachtwoorden komen niet overeen.',
      invalidCredentials: 'Deze e-mail/gsm en wachtwoord komen niet overeen met een bestaand account.',
      accountExists: 'Er bestaat al een account met dit e-mailadres of gsm-nummer. Log in in plaats daarvan.',
      resetMissingToken: 'Deze resetlink ontbreekt of is ongeldig.',
      resetSent: 'Check je e-mail voor een veilige resetlink.',
      resetComplete: 'Wachtwoord aangepast. Welkom terug.',
      verificationSent: 'Verificatie e-mail verstuurd. Open de link om je account te bevestigen.',
      verificationPreview: 'E-mailverificatie is verplicht. Gratis beta-modus toont hier tijdelijk een veilige verificatielink tot echte mailbox-delivery gekoppeld is.',
      verificationPreviewCta: 'Account nu bevestigen',
      verificationComplete: 'Je account is geverifieerd. Je kunt nu inloggen en doorgaan.',
      verificationMissingToken: 'Deze verificatielink ontbreekt of is ongeldig.',
      verificationRequired: 'Verifieer eerst je e-mail om in te loggen.',
      alreadyVerified: 'Deze e-mail is al geverifieerd.',
      switchAccount: 'Ander account proberen',
    },
    providers: {
      Google: ['Verder met Google', 'Werkt als beta-login; echte OAuth kan later volledig aan'],
      Email: ['Gebruik e-mail of gsm', 'Gratis beta-toegang, geen SMS-kost'],
      Apple: ['Apple later', 'Overgeslagen tot Apple setup nuttig is'],
    },
    pulse: {
      kicker: 'AI verbonden',
      title: 'Je MatchPulse AI wordt wakker.',
      body: 'Het profielmodel start met je veilige beta-login en groeit daarna door wat je typt, kiest, uploadt en later zelf toestaat uit gekoppelde tools.',
      signals: [
        'Waarden, aantrekking en intentie blijven aparte signalen.',
        'Je kan aannames altijd aanpassen of wissen.',
        'De neurale map beweegt mee terwijl je schrijft.',
      ],
      cta: 'Bouw mijn profiel',
    },
    profile: {
      kicker: 'Profielsignaal',
      title: 'Vertel de AI wie je bent.',
      body: 'Schrijf natuurlijk. Wanneer je het account maakt, wordt dit opgeslagen in je profiel en wordt het de eerste versie van je matching memory.',
      name: 'Naam',
      namePlaceholder: 'Je naam',
      age: 'Leeftijd',
      city: 'Stad',
      cityPlaceholder: 'Brussel',
      mobile: 'Gsm',
      email: 'E-mail',
      language: 'Taal',
      gender: 'Ik ben',
      genderHelper: 'Optioneel. Wordt prive gebruikt voor wederzijdse matching, tenzij jij het zelf zichtbaar maakt.',
      interestedIn: 'Toon mij',
      interestedHelper: 'MatchPulse toont alleen mensen waar de voorkeur wederzijds klopt.',
      question: 'Wat moet je AI over jou begrijpen?',
      placeholder: 'Ik hou van warme zelfzekerheid, duidelijke plannen, diepe gesprekken en iemand die lief is als niemand kijkt.',
      signalTitle: 'Live profielsignalen',
      signalEmpty: 'Typ natuurlijk en MatchPulse haalt waarden, aantrekking, grenzen en date-ritme eruit.',
      depth: 'AI profieldiepte',
      cta: "Verder naar foto's",
    },
    photos: {
      kicker: 'Visueel signaal',
      title: "Voeg foto's toe die bij jou passen.",
      body: 'Voor dit prototype kan je uploaden vanaf je toestel of een voorbeeld kiezen zodat de flow meteen testbaar is.',
      hint: "Lege vakken staan eerst klaar. Sleep foto's om de volgorde te veranderen; de eerste foto is je hoofdfoto.",
      add: 'Foto toevoegen',
      change: 'Vervangen',
      remove: 'Foto verwijderen',
      primary: 'Hoofdfoto',
      limitReached: "Je hebt de fotolimiet bereikt. Verwijder of vervang eerst een foto.",
      uploading: 'Foto uploaden...',
      sample: 'Gebruik voorbeeld',
      privacyTitle: 'Foto-privacy',
      privacyBody: 'Je kan matchen zonder elke foto meteen publiek te maken. Mensen kunnen na chat toestemming vragen.',
      cta: 'Account maken',
    },
    invite: {
      kicker: 'Beta-link klaar',
      title: 'Nodig mensen uit en test echte AI matching.',
      body: 'Stuur deze link naar vrienden of eerste testers. Zij landen in deze onboarding met jouw invite-code.',
      copy: 'Kopieer',
      copyLink: 'Kopieer beta-link',
      tester: 'Voeg testprofiel toe',
      enter: 'Open MatchPulse',
      signals: [
        'Nieuwe accounts kunnen hun eigen profiel maken.',
        'Matches kunnen vergeleken worden zodra er meerdere profielen zijn.',
        'De zondagsbriefing kan later de beste matches mailen.',
      ],
    },
    consent: [
      ['AI mag leren', 'Waarden, aantrekkingsstijl, date-ritme, feedback en private aandachtssignalen.'],
      ['Prive standaard', 'Ruwe memory, timing en verwijderde signalen zijn geen publieke profielinhoud.'],
      ['Jij keurt delen goed', "Anderen zien enkel foto's, profielvelden en memory die jij zichtbaar maakt."],
    ],
    visual: {
      ready: 'klaar om te matchen',
      photos: 'visueel signaal',
      profile: 'leert jou',
      pulse: 'wordt wakker',
      values: 'Waarden',
      attraction: 'Aantrekking',
      rhythm: 'Ritme',
      boundaries: 'Grenzen',
      core: 'AI profiel',
      caption: 'Leer-puls',
      text: 'groeit naar een levende map van waarden, verlangen, ritme en grenzen.',
      signals: {
        values: 'helderheid + warmte',
        attraction: 'zachte ambitie',
        rhythm: 'rustige plannen',
        boundaries: 'duidelijk respect',
      },
    },
  },
}

function authText(language) {
  return authCopy[language] ?? authCopy.English
}

function resolveAuthError(error, language = viewer.language) {
  const copy = authText(language).login
  const byCode = {
    contact_required: copy.missingContact,
    missing_contact: copy.missingContact,
    missing_password: copy.missingPassword,
    password_required: copy.missingPassword,
    password_policy: copy.passwordPolicy,
    password_mismatch: copy.passwordMismatch,
    invalid_credentials: copy.invalidCredentials,
    account_exists: copy.accountExists,
    invalid_verification_token: copy.verificationMissingToken,
    already_verified: copy.alreadyVerified,
    verification_pending: copy.verificationRequired,
    verification_required: copy.verificationRequired,
    invalid_reset_token: copy.resetMissingToken,
  }
  if (!error?.code) {
    if (error?.status === 401 || error?.statusCode === 401) {
      return copy.invalidCredentials
    }
  }
  const fallback = language === 'Nederlands'
    ? 'Authenticatie is mislukt. Probeer opnieuw.'
    : 'Authentication failed. Please try again.'
  return byCode[error?.code] || error?.message || fallback
}

const memoryVisibilityOptions = [
  {
    id: 'private',
    label: 'Private',
    detail: 'Only inside your memory board. Not used in match scores.',
  },
  {
    id: 'match_ai',
    label: 'AI match only',
    detail: 'Used for compatibility, never shown as raw text.',
  },
  {
    id: 'shareable',
    label: 'Ask before sharing',
    detail: 'AI may suggest it in explanations, you approve first.',
  },
  {
    id: 'profile',
    label: 'On profile',
    detail: 'Can appear as a visible profile signal.',
  },
  {
    id: 'never',
    label: 'Never use',
    detail: 'Hidden from matching and sharing.',
  },
]

const memoryVisibilityIds = new Set(memoryVisibilityOptions.map((option) => option.id))

const memoryVisibilityLabels = {
  Nederlands: {
    private: {
      label: 'Prive',
      detail: 'Alleen in je memory board. Niet gebruikt in matchscores.',
    },
    match_ai: {
      label: 'Alleen AI match',
      detail: 'Gebruikt voor compatibiliteit, nooit als ruwe tekst getoond.',
    },
    shareable: {
      label: 'Eerst vragen',
      detail: 'AI mag dit voorstellen in uitleg, jij keurt eerst goed.',
    },
    profile: {
      label: 'Op profiel',
      detail: 'Mag zichtbaar worden als profielsignaal.',
    },
    never: {
      label: 'Nooit gebruiken',
      detail: 'Verborgen voor matching en delen.',
    },
  },
}

const defaultPrivacySettings = {
  memoryLearning: true,
  attentionLearning: true,
  weeklyBriefing: true,
  fuzzyLocation: true,
  onlineStatus: true,
}

const defaultDiscoveryScore = (match) => match.discoveryScore ?? match.ranking?.discoveryScore ?? match.score ?? 0
const freeMessageRequestLimit = 5
const premiumMessageRequestLimit = 25

function normalizeMessageStatus(message = {}) {
  return message.status === 'request' ? 'request' : 'accepted'
}

function isAutoAcceptingDemoMatch(matchId = '') {
  const id = String(matchId)
  return id.startsWith('seed-') || id.startsWith('tester-')
}

function isThreadAccepted(messages = [], matchId) {
  return messages.some(
    (message) => message.matchId === matchId && normalizeMessageStatus(message) === 'accepted',
  )
}

function threadStatus(messages = [], matchId) {
  if (isThreadAccepted(messages, matchId)) return 'accepted'
  if (messages.some((message) => message.matchId === matchId && normalizeMessageStatus(message) === 'request')) {
    return 'request'
  }
  return 'empty'
}

function isPremiumProfile(profile = {}) {
  return /premium|pro/i.test(String(profile.plan ?? ''))
}

function messageRequestLimit(profile = {}) {
  return isPremiumProfile(profile) ? premiumMessageRequestLimit : freeMessageRequestLimit
}

function isToday(value) {
  if (!value) return false
  const date = new Date(value)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function messageRequestUsage(messages = [], profile = {}) {
  const used = messages.filter(
    (message) =>
      message.from === 'you' &&
      normalizeMessageStatus(message) === 'request' &&
      isToday(message.createdAt),
  ).length
  const limit = messageRequestLimit(profile)
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    premium: isPremiumProfile(profile),
  }
}

function normalizeGenderIdentity(value) {
  return genderIdentityOptions.includes(value) ? value : 'Not shown'
}

function normalizeInterestPreference(value, legacyOrientation = '', genderIdentity = 'Not shown') {
  if (interestPreferences.includes(value)) return value

  const gender = normalizeGenderIdentity(genderIdentity)
  if (legacyOrientation === 'Straight') {
    if (gender === 'Man' || gender === 'Trans man') return 'Women'
    if (gender === 'Woman' || gender === 'Trans woman') return 'Men'
    return 'Men & women'
  }
  if (legacyOrientation === 'Gay') {
    if (gender === 'Man' || gender === 'Trans man') return 'Men'
    if (gender === 'Woman' || gender === 'Trans woman') return 'Women'
    return 'Everyone'
  }
  if (legacyOrientation === 'Bi') return 'Men & women'
  if (legacyOrientation === 'Open' || legacyOrientation === 'Queer') return 'Everyone'
  return 'Everyone'
}

function normalizePhotoPrivacy(value) {
  return photoPrivacyOptions.some((option) => option.id === value) ? value : 'public'
}

function genderGroup(genderIdentity) {
  const gender = normalizeGenderIdentity(genderIdentity)
  if (gender === 'Man' || gender === 'Trans man') return 'men'
  if (gender === 'Woman' || gender === 'Trans woman') return 'women'
  if (gender === 'Non-binary') return 'nonbinary'
  if (gender === 'Another identity') return 'another'
  return 'unknown'
}

function interestAllows(preference, genderIdentity) {
  const interest = normalizeInterestPreference(preference)
  const group = genderGroup(genderIdentity)
  if (interest === 'Everyone') return true
  if (interest === 'Men') return group === 'men'
  if (interest === 'Women') return group === 'women'
  if (interest === 'Men & women') return group === 'men' || group === 'women'
  return true
}

function profileInterest(profile) {
  return normalizeInterestPreference(profile?.interestedIn, profile?.orientation, profile?.genderIdentity)
}

function matchFitsPreference(viewerProfile, match) {
  const viewerInterest = profileInterest(viewerProfile)
  const viewerGender = normalizeGenderIdentity(viewerProfile?.genderIdentity)
  const matchGender = normalizeGenderIdentity(match?.genderIdentity)
  const matchInterest = profileInterest(match)

  if (viewerGender === 'Not shown' || matchGender === 'Not shown') return true
  if (!interestAllows(viewerInterest, matchGender)) return false
  return interestAllows(matchInterest, viewerGender)
}

function resolveMatchPool(serverMatches = []) {
  return Array.isArray(serverMatches) ? serverMatches : matches
}

function realMatchPriority(match = {}) {
  if (match.isRealUser === true) return 1
  if (match.isSeed === true) return 0
  return String(match.id ?? '').startsWith('seed-') ? 0 : 1
}

function compareRealMatchesFirst(a, b) {
  return realMatchPriority(b) - realMatchPriority(a)
}

function memorySlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeMemoryNote(note, index = 0) {
  if (note && typeof note === 'object') {
    const text = String(note.text ?? note.note ?? '').replace(/\s+/g, ' ').trim()
    return {
      id: note.id || `legacy-${index}-${memorySlug(text).slice(0, 48) || 'memory'}`,
      text,
      visibility: memoryVisibilityIds.has(note.visibility) ? note.visibility : 'match_ai',
      source: note.source ?? 'memory',
      kind: note.kind ?? (text.includes('AI tag:') ? 'auto-tag' : 'memory'),
      weight: Number.isFinite(note.weight) ? note.weight : undefined,
      sourceText: note.sourceText ?? '',
      createdAt: note.createdAt ?? '',
      updatedAt: note.updatedAt ?? note.createdAt ?? '',
    }
  }

  const text = String(note ?? '').replace(/\s+/g, ' ').trim()
  return {
    id: `legacy-${index}-${memorySlug(text).slice(0, 48) || 'memory'}`,
    text,
    visibility: 'match_ai',
    source: 'legacy',
    kind: text.includes('AI tag:') ? 'auto-tag' : 'memory',
    sourceText: '',
    createdAt: '',
    updatedAt: '',
  }
}

function normalizeMemoryNotes(notes = []) {
  return Array.isArray(notes)
    ? notes.map((note, index) => normalizeMemoryNote(note, index)).filter((note) => note.text)
    : []
}

function memoryVisibilityCopy(visibility, language = viewer.language) {
  const fallback = memoryVisibilityOptions.find((option) => option.id === visibility) ?? memoryVisibilityOptions[1]
  return {
    ...fallback,
    ...(memoryVisibilityLabels[language]?.[fallback.id] ?? {}),
  }
}

function memoryWeight(note, attentionSignals = []) {
  const memory = normalizeMemoryNote(note)
  const text = memory.text.toLowerCase()
  const visibilityWeight = {
    never: 0,
    private: 18,
    match_ai: 76,
    shareable: 66,
    profile: 88,
  }[memory.visibility] ?? 58
  const attentionBoost = (Array.isArray(attentionSignals) ? attentionSignals : []).some((signal) =>
    `${signal.label} ${signal.body} ${signal.style}`.toLowerCase().split(/\W+/).some((word) => word.length > 4 && text.includes(word)),
  ) ? 10 : 0
  const detailBoost = Math.min(12, Math.round(memory.text.length / 42))
  return clamp(visibilityWeight + attentionBoost + detailBoost, 0, 98)
}

function onboardingQuality(profile, signals = [], photos = []) {
  const fields = [
    profile.name,
    profile.age,
    profile.city,
    profile.email || profile.phone,
    profile.language,
    profile.orientation,
    profile.bio && profile.bio.length > 80 ? profile.bio : '',
    photos.length ? 'photo' : profile.photo,
  ]
  const base = fields.filter(Boolean).length * 9
  const signalScore = Math.min(22, signals.length * 3)
  return clamp(base + signalScore, 18, 100)
}

function readyRatio(items = []) {
  if (!items.length) return 0
  return Math.round((items.filter((item) => item.ready).length / items.length) * 100)
}

function memoryThoughtText(note) {
  return normalizeMemoryNote(note).text.replace(/^You said:\s*/i, '')
}

function isChecklistReady(checklist = [], id) {
  return checklist.some((item) => item.id === id && item.ready)
}

function isInternalSmokeProfile(profile) {
  const name = String(profile?.name ?? '')
  return (
    /^Smoke (Left|Right|Delete)\b/i.test(name) ||
    /^Browser QA\b/i.test(name) ||
    /^(Pretest|DNA Inspect)\b/i.test(name) ||
    /\b(VisualQA|DeepQA|FixedQA|RadarQA|LastQA)\b/i.test(name) ||
    /^(Mira Atelier|Elias Depth|Lina Spark|Noor Flow|Nora QA)\s+\d{10,}$/i.test(name) ||
    /\bQA\s+\d{10,}$/i.test(name) ||
    /\bAudit\b/i.test(name)
  )
}

function sameMemory(left, right) {
  const leftMemory = normalizeMemoryNote(left)
  const rightMemory = normalizeMemoryNote(right)
  return Boolean(
    (leftMemory.id && rightMemory.id && leftMemory.id === rightMemory.id)
    || (leftMemory.text && leftMemory.text === rightMemory.text),
  )
}

const maxLocalMemoryNotes = 320
const maxAutoTagsPerSave = 180

function createOptimisticMemory(text, options = {}) {
  return {
    id: options.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: options.raw ? text : `You said: ${text}`,
    visibility: options.visibility ?? 'match_ai',
    source: options.source ?? 'ai-profile-tool',
    kind: options.kind ?? 'memory',
    weight: options.weight,
    sourceText: options.sourceText ?? '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function createAutoTagMemory(signal, sourceText = '') {
  const label = signalLabel(signal)
  const cleanLabel = String(label ?? '').replace(/\s+/g, ' ').trim()
  return createOptimisticMemory(`AI tag: ${cleanLabel}`, {
    id: `auto-${memorySlug(cleanLabel).slice(0, 72) || Date.now()}`,
    raw: true,
    visibility: 'match_ai',
    source: 'auto-tag-extractor',
    kind: signal.kind ?? 'auto-tag',
    weight: signal.weight ?? 56,
    sourceText: summarizeThought(sourceText),
  })
}

function publicTagFromMemory(note) {
  const text = normalizeMemoryNote(note).text
    .replace(/^You said:\s*/i, '')
    .replace(/^AI tag:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 64 ? text.slice(0, 61).trim() : text
}

function addProfilePreferenceTag(profile, tag, group = 'values') {
  const cleanTag = normalizeAutoTagLabel(tag)
  if (!cleanTag) return profile
  const preferences = {
    values: [...(profile.preferences?.values?.length ? profile.preferences.values : viewer.preferences.values)],
    dealbreakers: [...(profile.preferences?.dealbreakers?.length ? profile.preferences.dealbreakers : viewer.preferences.dealbreakers)],
    visualTaste: [...(profile.preferences?.visualTaste?.length ? profile.preferences.visualTaste : viewer.preferences.visualTaste)],
    dateRhythm: [...(profile.preferences?.dateRhythm?.length ? profile.preferences.dateRhythm : viewer.preferences.dateRhythm)],
  }
  const targetGroup = preferences[group] ? group : 'values'
  const exists = preferences[targetGroup].some((item) => signalMatchesText(item, cleanTag) || signalMatchesText(cleanTag, item))
  if (exists) return profile
  return {
    ...profile,
    preferences: {
      ...preferences,
      [targetGroup]: [...preferences[targetGroup], cleanTag],
    },
  }
}

function normalizeAttentionId(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function inferAttentionStyle(match) {
  const text = `${match?.role ?? ''} ${match?.about ?? ''} ${match?.shared?.join(' ') ?? ''}`.toLowerCase()
  if (includesAny(text, ['design', 'architect', 'gallery', 'art'])) return 'clean creative style'
  if (includesAny(text, ['walk', 'outdoor', 'bike', 'travel', 'nature'])) return 'natural active energy'
  if (includesAny(text, ['calm', 'quiet', 'wellness', 'steady'])) return 'calm warm presence'
  if (includesAny(text, ['city', 'night', 'cocktail', 'tonight'])) return 'city confidence'
  if (includesAny(text, ['conversation', 'honest', 'direct', 'communication'])) return 'direct emotional clarity'
  return 'natural profile chemistry'
}

function createAttentionSignal(type, match, details = {}) {
  const style = inferAttentionStyle(match)
  const seconds = Number(details.seconds ?? 0)
  const base = {
    kind: 'attention',
    matchId: match?.id ?? '',
    matchName: match?.name ?? 'Someone',
    style,
    count: 1,
    seconds,
    visibility: 'Private algorithm only',
    updatedAt: new Date().toISOString(),
  }

  if (type === 'photo') {
    return {
      ...base,
      id: `attention-photo-${normalizeAttentionId(style)}`,
      label: `Style pull: ${style}`,
      body: `You pause on photos with ${style.toLowerCase()}. MatchPulse keeps this private and uses it only to tune attraction fit.`,
    }
  }

  if (type === 'chat') {
    return {
      ...base,
      id: `attention-chat-${normalizeAttentionId(style)}`,
      label: `Chat rhythm: ${style}`,
      body: `Conversation energy seems stronger around profiles with ${style.toLowerCase()}.`,
    }
  }

  if (type === 'message') {
    return {
      ...base,
      id: 'attention-message-depth',
      label: 'Message depth',
      body: 'Longer, specific replies suggest you prefer matches who invite thoughtful conversation.',
    }
  }

  return {
    ...base,
    id: `attention-profile-${normalizeAttentionId(style)}`,
    label: `Profile pull: ${style}`,
    body: `You spend more time reading profiles with ${style.toLowerCase()}. This never appears on your public profile.`,
  }
}

function mergeAttentionSignal(currentSignals, nextSignal) {
  const existing = currentSignals.find((signal) => signal.id === nextSignal.id)
  const merged = existing
    ? {
        ...existing,
        count: existing.count + 1,
        seconds: Math.min(999, (existing.seconds ?? 0) + (nextSignal.seconds ?? 0)),
        body: nextSignal.body,
        matchName: nextSignal.matchName,
        updatedAt: nextSignal.updatedAt,
      }
    : nextSignal

  return [
    merged,
    ...currentSignals.filter((signal) => signal.id !== nextSignal.id),
  ].slice(0, 8)
}

const fallbackAttractionAxes = [
  { id: 'visualWarmth', label: 'Visual warmth', detail: 'soft eye contact and openness' },
  { id: 'aestheticPrecision', label: 'Aesthetic precision', detail: 'taste, styling and composition' },
  { id: 'bodyEnergy', label: 'Body energy', detail: 'movement and active presence' },
  { id: 'calmIntensity', label: 'Calm intensity', detail: 'quiet confidence and depth' },
  { id: 'emotionalClarity', label: 'Emotional clarity', detail: 'directness and communicative pull' },
]

function buildFallbackAttractionDna(match) {
  const attraction = match.metrics?.Attraction ?? match.score ?? 76
  const values = match.metrics?.Values ?? match.score ?? 74
  const lifestyle = match.metrics?.Lifestyle ?? match.score ?? 74
  const intent = match.metrics?.Intent ?? match.score ?? 74
  const uncertainty = match.metrics?.Uncertainty ?? 18
  const visualAffinity = clamp(Math.round(attraction + (match.score - 82) * 0.24), 52, 97)
  const reciprocalPull = clamp(Math.round((values + lifestyle + intent) / 3 - uncertainty * 0.18), 48, 96)
  const mutual = clamp(Math.round(visualAffinity * 0.58 + reciprocalPull * 0.42), 48, 98)

  return {
    visualAffinity,
    reciprocalPull,
    mutual,
    confidence: clamp(78 - Math.round(uncertainty / 2), 54, 94),
    axes: fallbackAttractionAxes.map((axis, index) => ({
      ...axis,
      strength: clamp(Math.round(mutual - index * 4 + (index % 2 ? lifestyle : attraction) * 0.05), 44, 98),
    })),
    privateModel: true,
  }
}

function getAttractionDna(match) {
  if (match.attractionDna?.mutual) return match.attractionDna
  return buildFallbackAttractionDna(match)
}

function buildProfileAttractionDna({ profile, attentionSignals = [], notes = [], liveSignals = [] }) {
  const noteText = normalizeMemoryNotes(notes).map((note) => note.text).join(' ')
  const signalText = [
    profile.bio,
    profile.preferences?.visualTaste?.join(' '),
    noteText,
    liveSignals.map((signal) => signal.label).join(' '),
    attentionSignals.map((signal) => `${signal.style} ${signal.label}`).join(' '),
  ].join(' ').toLowerCase()
  const axes = fallbackAttractionAxes.map((axis) => {
    const words = `${axis.label} ${axis.detail}`.toLowerCase().split(/\W+/).filter(Boolean)
    const hits = words.filter((word) => signalText.includes(word)).length
    const attentionBoost = attentionSignals.some((signal) =>
      `${signal.style} ${signal.label}`.toLowerCase().includes(axis.label.split(' ')[0].toLowerCase()),
    ) ? 10 : 0
    return {
      ...axis,
      strength: clamp(58 + hits * 7 + attentionBoost + attentionSignals.length * 3, 42, 98),
    }
  }).sort((a, b) => b.strength - a.strength)
  const visualAffinity = clamp(Math.round(axes[0]?.strength ?? 68), 42, 98)
  const reciprocalPull = clamp(Math.round(axes.slice(0, 3).reduce((total, axis) => total + axis.strength, 0) / 3), 42, 98)
  const mutual = clamp(Math.round(visualAffinity * 0.54 + reciprocalPull * 0.46), 42, 98)

  return {
    visualAffinity,
    reciprocalPull,
    mutual,
    confidence: clamp(62 + attentionSignals.length * 7 + liveSignals.length * 3, 54, 97),
    axes,
    privateModel: true,
  }
}

const authProviders = [
  { id: 'Google', label: 'Continue with Google', detail: 'Works as beta login; real OAuth can be enabled later', mark: 'G' },
  { id: 'Apple', label: 'Apple later', detail: 'Skipped until Apple setup is worth it', mark: 'A', disabled: true },
]

const samplePhotos = ['/portraits/alex.jpg', '/portraits/zara.jpg', '/portraits/maya.jpg']

const filterOptions = [
  { id: 'ageCore', label: 'Age 25-34', test: (match) => match.age >= 25 && match.age <= 34 },
  { id: 'nearby', label: 'Within 5 km', test: (match) => Number.parseFloat(match.distance) <= 5 },
  { id: 'online', label: 'Online now', test: (match) => match.status === 'Online now' },
  { id: 'highIntent', label: 'High intent', test: (match) => match.score >= 85 },
  { id: 'serious', label: 'Serious intent', test: (match) => match.intent.includes('Serious') },
  { id: 'creative', label: 'Creative', test: (match) => match.intent.includes('Creative') || /creative|design|photo|music|illustrator|film/i.test(`${match.role} ${match.about}`) },
  { id: 'active', label: 'Active', test: (match) => match.intent.includes('Active') || /sport|bike|cycling|run|hiking|walk|dance|yoga/i.test(`${match.intent.join(' ')} ${match.about}`) },
]

const radarFilterOptions = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'online', label: 'Online', test: (match) => match.status === 'Online now' },
  { id: 'fresh', label: 'Fresh', test: (_match, index) => index < 8 },
  { id: 'tonight', label: 'Tonight', test: (match) => match.intent.includes('Tonight') },
  { id: 'top', label: 'Top match', test: (match) => match.score >= 90 },
]

const signalRules = [
  { id: 'honesty', label: 'Honesty', kind: 'values', terms: ['honesty', 'honest', 'eerlijk', 'eerlijkheid'] },
  { id: 'kindness', label: 'Kindness', kind: 'values', terms: ['kind', 'kindness', 'lief', 'zacht'] },
  { id: 'ambition', label: 'Ambition', kind: 'values', terms: ['ambition', 'ambitious', 'ambitie', 'gedreven'] },
  { id: 'growth', label: 'Growth', kind: 'values', terms: ['growth', 'groei', 'ontwikkel'] },
  { id: 'deep-talk', label: 'Deep conversations', kind: 'values', terms: ['deep conversation', 'deep conversations', 'diepe gesprekken', 'gesprekken', 'conversation'] },
  { id: 'creativity', label: 'Creativity', kind: 'values', terms: ['creativity', 'creative', 'creatief', 'creatieve'] },
  { id: 'warmth', label: 'Warmth', kind: 'values', terms: ['warmth', 'warm', 'warmte'] },
  { id: 'confidence', label: 'Quiet confidence', kind: 'attraction', terms: ['confidence', 'confident', 'zelfzeker', 'quiet confidence'] },
  { id: 'natural-style', label: 'Natural style', kind: 'attraction', terms: ['natural', 'natuurlijk', 'style', 'stijl', 'mooi'] },
  { id: 'warm-eyes', label: 'Warm eyes', kind: 'attraction', terms: ['eyes', 'ogen', 'warm eyes'] },
  { id: 'clear-plans', label: 'Clear plans', kind: 'rhythm', terms: ['clear plans', 'plans', 'plan', 'duidelijk', 'afspraak'] },
  { id: 'calm-pace', label: 'Calm pace', kind: 'rhythm', terms: ['calm', 'rust', 'rustig', 'pace', 'tempo', 'slow'] },
  { id: 'coffee-first', label: 'Coffee first', kind: 'rhythm', terms: ['coffee', 'koffie', 'walk', 'wandeling'] },
  { id: 'city-energy', label: 'City energy', kind: 'rhythm', terms: ['city energy', 'city', 'stad', 'urban'] },
  { id: 'travel', label: 'Travel', kind: 'rhythm', terms: ['travel', 'reizen', 'reis', 'reist'] },
  { id: 'cats', label: 'Cats', kind: 'values', terms: ['cat', 'cats', 'kat', 'katten'] },
  { id: 'music', label: 'Music', kind: 'values', terms: ['music', 'muziek', 'concert', 'jazz', 'dj'] },
  { id: 'photography', label: 'Photography', kind: 'attraction', terms: ['photo', 'photos', 'photography', 'foto', 'fotos', 'fotografie', 'camera'] },
  { id: 'ai-curiosity', label: 'AI curiosity', kind: 'values', terms: ['ai', 'artificial intelligence', 'kunstmatige intelligentie'] },
  { id: 'humor', label: 'Humor', kind: 'values', terms: ['humor', 'funny', 'grappig', 'laugh', 'lach'] },
  { id: 'sunday-reset', label: 'Sunday reset', kind: 'rhythm', terms: ['sunday', 'zondag', 'quiet morning', 'quiet mornings'] },
  { id: 'respect', label: 'Respect', kind: 'boundaries', terms: ['respect', 'respectvol'] },
  { id: 'no-drama', label: 'No drama', kind: 'boundaries', terms: ['no drama', 'drama', 'toxisch', 'toxic'] },
  { id: 'communication', label: 'Clear communication', kind: 'boundaries', terms: ['communication', 'communicatie', 'communiceer', 'communiceert', 'duidelijke communicatie', 'duidelijke', 'reply', 'antwoord'] },
]

const automaticTagRules = [
  ...signalRules,
  { id: 'social-worker', label: 'Sociaal werker', kind: 'identity', terms: ['sociaal werker', 'social worker', 'maatschappelijk werker'] },
  { id: 'creative-maker', label: 'Creatieveling', kind: 'values', terms: ['creatieveling', 'maker', 'creative person', 'creatief persoon'] },
  { id: 'many-ideas', label: 'Veel ideeën', kind: 'personality', terms: ['meer ideeën dan uren', 'veel ideeen', 'veel ideeën', 'many ideas'] },
  { id: 'helpful', label: 'Behulpzaam', kind: 'values', terms: ['behulpzaam', 'helpen', 'help mensen', 'helping people', 'helpful'] },
  { id: 'social-impact', label: 'Maatschappelijke impact', kind: 'values', terms: ['maatschappelijke impact', 'social impact', 'maatschappij verbeteren'] },
  { id: 'politics', label: 'Politiek', kind: 'interests', terms: ['politiek', 'politics', 'beleid', 'policy'] },
  { id: 'society', label: 'Maatschappij', kind: 'interests', terms: ['maatschappij', 'samenleving', 'society'] },
  { id: 'technology', label: 'Technologie', kind: 'interests', terms: ['technologie', 'technology', 'tech', 'software'] },
  { id: 'innovation', label: 'Innovatie', kind: 'interests', terms: ['innovatie', 'innovation', 'vernieuwing'] },
  { id: 'future-oriented', label: 'Toekomstgericht', kind: 'values', terms: ['toekomstgericht', 'future oriented', 'future-focused', 'toekomst'] },
  { id: 'curious', label: 'Nieuwsgierig', kind: 'personality', terms: ['nieuwsgierig', 'curious', 'curiosity'] },
  { id: 'open-minded', label: 'Open-minded', kind: 'values', terms: ['open-minded', 'open minded', 'open van geest'] },
  { id: 'loyal', label: 'Loyaliteit', kind: 'values', terms: ['loyaal', 'loyal', 'loyaliteit', 'loyalty'] },
  { id: 'emotionally-available', label: 'Emotioneel beschikbaar', kind: 'values', terms: ['emotioneel beschikbaar', 'emotionally available', 'emotional availability'] },
  { id: 'problem-solver', label: 'Probleemoplossend', kind: 'personality', terms: ['probleemoplossend', 'problem solving', 'problem-solver', 'oplossingen'] },
  { id: 'analytical', label: 'Analytisch', kind: 'personality', terms: ['analytisch', 'analytical', 'analyseer', 'analysis'] },
  { id: 'introvert', label: 'Introvert', kind: 'personality', terms: ['introvert', 'introverted'] },
  { id: 'extravert', label: 'Extravert', kind: 'personality', terms: ['extravert', 'extrovert', 'extraverted', 'extroverted'] },
  { id: 'ambivert', label: 'Ambivert', kind: 'personality', terms: ['ambivert', 'soms introvert', 'soms extravert'] },
  { id: 'music-lover', label: 'Muziekliefhebber', kind: 'interests', terms: ['muziekliefhebber', 'music lover', 'hou van muziek', 'love music'] },
  { id: 'travel-lover', label: 'Reizen', kind: 'interests', terms: ['reizen', 'travel', 'travelling', 'traveling'] },
  { id: 'city-explorer', label: 'Steden ontdekken', kind: 'interests', terms: ['steden ontdekken', 'cities ontdekken', 'city exploring', 'explore cities'] },
  { id: 'cat-lover', label: 'Kattenliefhebber', kind: 'interests', terms: ['kattenliefhebber', 'katten', 'cats', 'cat person'] },
  { id: 'walking', label: 'Wandelen', kind: 'rhythm', terms: ['wandelen', 'walking', 'walks', 'hiking'] },
  { id: 'coffee-dates', label: 'Koffiedates', kind: 'rhythm', terms: ['koffiedates', 'coffee dates', 'koffie date', 'coffee date'] },
  { id: 'creative-projects', label: 'Creatieve projecten', kind: 'interests', terms: ['creatieve projecten', 'creative projects', 'projecten maken'] },
  { id: 'smart-talks', label: 'Slimme gesprekken', kind: 'values', terms: ['slimme gesprekken', 'smart conversations', 'intelligente gesprekken'] },
  { id: 'humor-lightness', label: 'Humor en lichtheid', kind: 'values', terms: ['humor', 'grappen', 'lachen', 'laughing', 'jokes'] },
  { id: 'deep-connection', label: 'Diepe connectie', kind: 'values', terms: ['diepe connectie', 'deep connection', 'echte connectie'] },
  { id: 'family-minded', label: 'Familiegericht', kind: 'intent', terms: ['familie', 'family', 'kinderen', 'children', 'gezin'] },
  { id: 'serious-relationship', label: 'Serieuze relatie', kind: 'intent', terms: ['serieuze relatie', 'serious relationship', 'vaste relatie'] },
  { id: 'slow-dating', label: 'Rustig daten', kind: 'rhythm', terms: ['rustig daten', 'slow dating', 'niet rushen', 'no rush'] },
  { id: 'spontaneous', label: 'Spontaan', kind: 'personality', terms: ['spontaan', 'spontaneous', 'impulsief'] },
  { id: 'structured', label: 'Gestructureerd', kind: 'personality', terms: ['gestructureerd', 'structured', 'planning', 'gepland'] },
  { id: 'entrepreneurial', label: 'Ondernemend', kind: 'personality', terms: ['ondernemend', 'entrepreneurial', 'ondernemen', 'startup'] },
  { id: 'ambitious-career', label: 'Carrieregericht', kind: 'values', terms: ['carriere', 'career', 'ambitieus werk', 'professioneel groeien'] },
  { id: 'art-design', label: 'Kunst en design', kind: 'interests', terms: ['kunst', 'art', 'design', 'museum', 'galerie', 'gallery'] },
  { id: 'photography-love', label: 'Fotografie', kind: 'interests', terms: ['fotografie', 'photography', 'camera', 'foto'] },
  { id: 'food-cooking', label: 'Koken en eten', kind: 'interests', terms: ['koken', 'cooking', 'food', 'eten', 'restaurant'] },
  { id: 'sports-active', label: 'Actieve levensstijl', kind: 'rhythm', terms: ['sport', 'sports', 'fitness', 'running', 'lopen', 'cycling', 'fietsen'] },
  { id: 'nature', label: 'Natuur', kind: 'interests', terms: ['natuur', 'nature', 'bos', 'forest', 'mountains', 'bergen'] },
  { id: 'animals', label: 'Dierenliefhebber', kind: 'interests', terms: ['dieren', 'animals', 'hond', 'dog', 'kat', 'cat'] },
  { id: 'books', label: 'Boeken', kind: 'interests', terms: ['boeken', 'books', 'reading', 'lezen', 'bookstore'] },
  { id: 'film', label: 'Film en cinema', kind: 'interests', terms: ['film', 'cinema', 'movies', 'documentaire', 'documentary'] },
  { id: 'gaming', label: 'Gaming', kind: 'interests', terms: ['gaming', 'games', 'game developer', 'videogames'] },
  { id: 'wellness', label: 'Wellness', kind: 'rhythm', terms: ['wellness', 'yoga', 'meditatie', 'meditation', 'mindfulness'] },
  { id: 'mental-health', label: 'Mentale gezondheid', kind: 'values', terms: ['mentale gezondheid', 'mental health', 'therapy', 'therapie'] },
  { id: 'empathy', label: 'Empathisch', kind: 'values', terms: ['empathisch', 'empathy', 'empathie', 'inlevend'] },
  { id: 'warm-communication', label: 'Warme communicatie', kind: 'boundaries', terms: ['warme communicatie', 'warm communication', 'zachte communicatie'] },
  { id: 'direct-communication', label: 'Directe communicatie', kind: 'boundaries', terms: ['directe communicatie', 'direct communication', 'rechtuit'] },
  { id: 'clear-boundaries', label: 'Duidelijke grenzen', kind: 'boundaries', terms: ['duidelijke grenzen', 'clear boundaries', 'grenzen'] },
  { id: 'consent', label: 'Toestemming en veiligheid', kind: 'boundaries', terms: ['toestemming', 'consent', 'veilig', 'safe'] },
  { id: 'trust', label: 'Vertrouwen', kind: 'values', terms: ['vertrouwen', 'trust', 'reliable', 'betrouwbaar'] },
  { id: 'stability', label: 'Stabiliteit', kind: 'values', terms: ['stabiliteit', 'stability', 'stabiel'] },
  { id: 'adventure', label: 'Avontuur', kind: 'rhythm', terms: ['avontuur', 'adventure', 'adventurous'] },
  { id: 'calm-home', label: 'Rustig thuisgevoel', kind: 'rhythm', terms: ['thuis', 'home', 'rustig thuis', 'cozy'] },
  { id: 'nightlife', label: 'Nachtleven', kind: 'rhythm', terms: ['nachtleven', 'nightlife', 'party', 'feest'] },
  { id: 'morning-person', label: 'Ochtendmens', kind: 'rhythm', terms: ['ochtendmens', 'morning person', 'ochtend'] },
  { id: 'night-owl', label: 'Nachtmens', kind: 'rhythm', terms: ['nachtmens', 'night owl', 'late nights'] },
  { id: 'learning', label: 'Leergierig', kind: 'values', terms: ['leergierig', 'learning', 'leren', 'bijleren'] },
  { id: 'self-development', label: 'Zelfontwikkeling', kind: 'values', terms: ['zelfontwikkeling', 'self development', 'personal growth'] },
  { id: 'ethical', label: 'Ethisch bewust', kind: 'values', terms: ['ethiek', 'ethical', 'ethisch', 'responsible'] },
  { id: 'climate', label: 'Klimaatbewust', kind: 'values', terms: ['klimaat', 'climate', 'sustainability', 'duurzaam'] },
  { id: 'community', label: 'Communitygericht', kind: 'values', terms: ['community', 'gemeenschap', 'buurt'] },
  { id: 'leadership', label: 'Leiderschap', kind: 'personality', terms: ['leiderschap', 'leadership', 'leader'] },
  { id: 'sensitive', label: 'Gevoelig', kind: 'personality', terms: ['gevoelig', 'sensitive', 'sensitief'] },
  { id: 'resilient', label: 'Veerkrachtig', kind: 'personality', terms: ['veerkrachtig', 'resilient', 'resilience'] },
]

const autoTagStopWords = new Set([
  'about', 'after', 'alles', 'also', 'altijd', 'andere', 'because', 'ben', 'bij', 'but', 'can', 'dat', 'deze',
  'door', 'een', 'eens', 'echt', 'en', 'for', 'from', 'gaan', 'geen', 'heeft', 'heel', 'hier', 'hij', 'hoe',
  'iemand', 'iets', 'jouw', 'kan', 'like', 'maar', 'mijn', 'more', 'niet', 'nog', 'ook', 'over', 'people',
  'persoon', 'that', 'the', 'this', 'tot', 'van', 'veel', 'voor', 'waar', 'want', 'wat', 'when', 'with',
  'zonder', 'zoals', 'zijn',
])

const signalAnchors = {
  values: { x: 20, y: 24 },
  attraction: { x: 78, y: 25 },
  boundaries: { x: 22, y: 72 },
  rhythm: { x: 78, y: 72 },
  attention: { x: 50, y: 48 },
  live: { x: 50, y: 52 },
}

const navItems = [
  { id: 'discover', label: 'Nearby', icon: Compass },
  { id: 'matches', label: 'Deep Match', icon: HeartPulse },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: UserRound },
]

function BrandLogo({ showText = false }) {
  return (
    <span className={showText ? 'brand-logo with-text' : 'brand-logo'} aria-label="MatchPulse">
      <img src="/favicon.svg" alt="" />
      {showText ? <strong>MatchPulse</strong> : null}
    </span>
  )
}

const appCopy = {
  Nederlands: {
    nav: {
      profile: 'Profiel',
      discover: 'Radar',
      matches: 'Deep Match',
      messages: 'Berichten',
      plans: 'Plannen',
      memory: 'AI Memory',
      settings: 'Instellingen',
      dev: 'Dev',
    },
    search: 'Zoek profielen, tags...',
    aiLearning: 'AI leert',
    betaPlan: 'Beta',
    alertsClear: 'Geen kritieke meldingen',
    messages: {
      kicker: 'Berichten',
      title: 'Chats en berichtverzoeken',
      body: 'Verzoeken blijven apart. Na acceptatie opent de chat en zie je jullie gedeelde neuron-analyse.',
      inbox: 'Inbox',
      chats: 'Chats',
      requests: 'Verzoeken',
      openChat: 'chat open',
      wantsToChat: 'wil chatten',
      requestLane: 'verzoek',
      new: 'Nieuw',
      sent: 'Verzonden',
      noChats: 'Nog geen geaccepteerde chats. Open Verzoeken of stuur iemand een verzoek via Radar.',
      noRequests: 'Geen open verzoeken. Start bij iemand uit Radar.',
      accept: 'Accepteren',
      block: 'Blokkeren',
      draftReply: 'Maak antwoord',
      draftRequest: 'Maak verzoek',
      requestQuality: 'Verzoekkwaliteit',
      dailyRequests: 'Dagelijkse verzoeken',
      learnedFromChat: 'Leert uit chat',
      ready: 'klaar',
      lockedUntilAccepted: 'Op slot tot acceptatie',
      premiumPower: 'Premium verzoeken',
      freePower: 'Gratis verzoeken',
      leftToday: 'over vandaag',
      premiumDetail: `${premiumMessageRequestLimit} verzoeken per dag plus diepere gedeelde-neuron context.`,
      freeDetail: `${freeMessageRequestLimit} verzoeken per dag. Premium geeft ${premiumMessageRequestLimit}/dag en pro match-tools.`,
      empty: 'Nog geen verzoek. Kies een AI-suggestie of schrijf iets specifiek en respectvol.',
      requestLabel: 'Verzoek',
      sendPlaceholder: 'Schrijf een warme, eerlijke boodschap...',
      requestPlaceholder: 'Schrijf een respectvol berichtverzoek...',
      acceptPlaceholder: 'Accepteer het verzoek om te antwoorden...',
      limitPlaceholder: 'Daglimiet voor verzoeken bereikt...',
      checks: ['Specifiek voor profiel', 'Nodigt uit tot antwoord', 'Warm maar duidelijk'],
    },
    memory: {
      kicker: 'AI Memory',
      title: 'Wat MatchPulse over jou leert',
      body: 'Kies per herinnering wat prive blijft, wat de AI mag gebruiken en wat zichtbaar mag worden.',
      stats: {
        ai: 'AI bruikbaar',
        private: 'Prive',
        never: 'Nooit',
        attention: 'Aandacht',
      },
      emptyTitle: 'Nog geen private memory.',
      emptyBody: 'Open de AI-profieltool en vertel MatchPulse wat belangrijk is.',
      delete: 'Verwijder memory',
      weight: 'Matchgewicht',
      openTool: 'Open AI-profieltool',
    },
    plans: {
      kicker: 'Plannen',
      title: 'Afspraken',
      body: 'Zet goede matches om in eenvoudige, veilige plannen.',
      create: 'Maak afspraak',
      empty: 'Nog geen plannen. Kies een match en druk op Date plannen.',
    },
    settings: {
      kicker: 'Instellingen',
      title: 'Privacy en matchcontrole',
      body: 'Alles wat gevoelig is moet zichtbaar, omkeerbaar en makkelijk te begrijpen zijn.',
      zeroCost: 'Gratis modus',
      freeActive: 'Gratis modus actief: lokale AI, briefing-preview en geen betaalde API-calls.',
      paidDetected: 'Betaalde API gedetecteerd:',
      readiness: 'Beta-status',
      currentMode: 'Huidige modus',
      consentProfile: 'Profiel met toestemming',
      consentBody: 'Je memory, aandachtssignalen, export en zichtbaarheid blijven onder jouw controle.',
      export: 'Exporteer prive profiel',
      restart: 'Log uit / ander account',
      testers: 'Testers uitnodigen',
      testersBody: 'Deel deze beta-link zodat iemand anders een profiel kan maken en matching kan testen.',
      copyLink: 'Kopieer link',
      safety: 'Veiligheidsknoppen',
      noHidden: 'Geen verborgen profielen.',
      hidden: 'profiel verborgen uit je matchlijst.',
      reports: 'Reports',
      feedback: 'Feedbacksignalen',
      restore: 'Herstel verborgen matches',
      delete: 'Verwijder beta-account',
      on: 'Aan',
      off: 'Uit',
      toggles: {
        memoryLearning: ['AI memory learning', 'MatchPulse mag profielnotities, berichten en feedback gebruiken om uitleg te verbeteren.'],
        attentionLearning: ['Private aandacht learning', 'AI mag leren van kijktijd, fotopreviews en chatritme. Nooit zichtbaar voor anderen.'],
        weeklyBriefing: ['Sunday match briefing', 'Wekelijks overzicht met topmatches, nearby opties en date-ideeen.'],
        fuzzyLocation: ['Vervaag locatie', 'Toon afstand in zones zonder je exacte locatie te tonen.'],
        onlineStatus: ['Online status tonen', 'Laat sterke matches zien wanneer je beschikbaar bent.'],
      },
    },
    profileTool: {
      kicker: 'Je AI-profiel',
      title: 'Leer MatchPulse wie je bent',
      body: 'Typ vrij. De neurale map vormt waarden, aantrekking, grenzen en ritme terwijl je schrijft.',
      addPhoto: 'Toevoegen',
      fields: {
        name: 'Naam',
        age: 'Leeftijd',
        email: 'E-mail',
        mobile: 'Gsm',
        language: 'Taal',
        bio: 'Bio',
      },
      signals: 'Compatibiliteitssignalen',
      editable: 'Bewerkbaar',
      aiTool: 'AI Profieltool',
      aiToolHint: 'Typ vrij. De map groeit voordat je dit opslaat in memory.',
      extracted: 'Gevonden signaalwolken',
      extractedEmpty: 'Typ in de AI-box of bio. Signalen verschijnen hier en trekken de neurale map in clusters.',
      placeholder: 'Voorbeeld: ik hou van zelfzekere mensen, maar ik heb zachtheid en duidelijke plannen nodig.',
      voice: 'Voice',
      import: 'Import',
      save: 'Opslaan in memory',
      privacy: 'Dating privacy',
      privacyNote: 'Gender en fotozichtbaarheid zijn optioneel en worden gebruikt voor wederzijdse matching.',
      iAm: 'Ik ben',
      showMe: 'Toon mij',
      photoVisibility: 'Fotozichtbaarheid',
      saveRecalculate: 'Opslaan en herberekenen',
      linkedSources: 'Gekoppelde bronnen',
      linked: 'Gekoppeld',
      link: 'Koppel',
      liveMemory: 'Live memory',
      groups: {
        values: ['Waarden', 'Wat moet aligned voelen.'],
        dealbreakers: ['Dealbreakers', 'Wat nooit genegeerd mag worden.'],
        visualTaste: ['Aantrekkingssmaak', 'De energie en look die je opmerkt.'],
        dateRhythm: ['Date-ritme', 'Hoe plannen moeten voelen.'],
      },
    },
  },
  English: {
    nav: {},
    search: 'Search anything...',
    aiLearning: 'AI learning',
    betaPlan: 'Beta',
    alertsClear: 'No new critical alerts',
    messages: {},
    memory: {},
    plans: {},
    settings: {},
    profileTool: {},
  },
}

function appText(language = viewer.language) {
  return appCopy[language] ?? appCopy.English
}

function isDutchLanguage(language = viewer.language) {
  return language === 'Nederlands'
}

const metricLabelTranslations = {
  Values: 'Waarden',
  Attraction: 'Aantrekking',
  Lifestyle: 'Levensstijl',
  Intent: 'Intentie',
  Uncertainty: 'Onzekerheid',
}

function metricLabel(label, language = viewer.language) {
  return isDutchLanguage(language) ? (metricLabelTranslations[label] ?? label) : label
}

const laneTranslations = {
  'Mutual pull': 'Wederzijdse pull',
  'Nearby spark': 'Dichtbij spark',
  'Deep fit': 'Diepe fit',
  'Fresh angle': 'Nieuwe invalshoek',
  'Tonight signal': 'Vanavond signaal',
  'Fresh signal': 'Nieuw signaal',
  'High intent': 'Sterke intentie',
  'Low uncertainty': 'Meer zekerheid',
  'Top match': 'Topmatch',
}

function laneLabel(label, language = viewer.language) {
  return isDutchLanguage(language) ? (laneTranslations[label] ?? label) : label
}

const roleTranslations = {
  'Architect at Studio A': 'Architect bij Studio A',
  'Product Designer': 'Productdesigner',
  Entrepreneur: 'Ondernemer',
  'Data Scientist': 'Data scientist',
  'Brand Strategist': 'Brand strateeg',
  Architect: 'Architect',
}

function displayRole(role, language = viewer.language) {
  if (!isDutchLanguage(language)) return role
  if (String(role ?? '').endsWith(' member')) {
    const city = String(role).replace(/\s+member$/, '').replace(/^Brussels$/, 'Brussel')
    return `Lid uit ${city}`
  }
  return roleTranslations[role] ?? role ?? ''
}

function displayDistance(distance, language = viewer.language) {
  if (!isDutchLanguage(language)) return distance
  return String(distance ?? '').replace(/\s+away$/i, '')
}

function displayStatus(status, language = viewer.language) {
  if (!isDutchLanguage(language)) return status
  return {
    'Online now': 'Online nu',
    Online: 'Online',
  }[status] ?? status
}

const matchTextTranslations = {
  'You value honesty, consistency and ambition.': 'Je waardeert eerlijkheid, consistentie en ambitie.',
  'You prefer deep conversations and real connection over small talk.':
    'Je verkiest diepe gesprekken en echte connectie boven smalltalk.',
  'You are most attracted to emotionally intelligent people with a creative side.':
    'Je voelt je het meest aangetrokken tot emotioneel intelligente mensen met een creatieve kant.',
  'You enjoy active lifestyles and spontaneous adventures.':
    'Je houdt van een actieve levensstijl en spontane avonturen.',
  'You both value calm chemistry and clear communication.':
    'Jullie waarderen allebei rustige chemie en heldere communicatie.',
  'You both like architecture, slow travel and dinner places with atmosphere.':
    'Jullie houden allebei van architectuur, traag reizen en plekken met sfeer.',
  'You both want something serious, but without forcing the timeline.':
    'Jullie willen allebei iets serieus, zonder het tempo te forceren.',
  'You both care about good taste without showing off.':
    'Jullie hebben allebei smaak zonder ermee te willen pronken.',
  'You share a preference for slow starts and thoughtful messages.':
    'Jullie delen een voorkeur voor rustig starten en doordachte berichten.',
  'Your date rhythms are compatible: short first date, no pressure.':
    'Jullie date-ritme past: korte eerste date, geen druk.',
  'You both value growth and meaningful connection.':
    'Jullie waarderen allebei groei en betekenisvolle connectie.',
  'You share interest in soulful conversations and travel.':
    'Jullie delen interesse in diepere gesprekken en reizen.',
  'There is high attraction, but more uncertainty around pace.':
    'Er is veel aantrekking, maar nog wat onzekerheid rond tempo.',
  'You both enjoy precision and emotionally safe conversations.':
    'Jullie houden allebei van precisie en emotioneel veilige gesprekken.',
  'You share a calm social style and similar weekend rhythm.':
    'Jullie delen een rustige sociale stijl en gelijkaardig weekendritme.',
  'The AI sees less obvious spark, but strong long-term stability.':
    'De AI ziet minder directe spark, maar wel sterke stabiliteit op lange termijn.',
  'You both like spontaneous evenings and city energy.':
    'Jullie houden allebei van spontane avonden en stadsenergie.',
  'The attraction signal is high, but intent alignment is lower.':
    'Het aantrekkingssignaal is hoog, maar intentie matcht minder sterk.',
  'Better as a playful or low-pressure match.':
    'Beter als speelse match zonder te veel druk.',
  'Soft-spoken, visually sharp, and very good at finding a table near the window.':
    'Zacht in communicatie, visueel scherp en goed in de beste tafel bij het raam vinden.',
  'Designs quiet spaces, cooks late, and likes dates that turn into long walks.':
    'Ontwerpt rustige ruimtes, kookt laat en houdt van dates die vanzelf lange wandelingen worden.',
  'Building a small company and looking for someone who understands momentum.':
    'Bouwt aan een klein bedrijf en zoekt iemand die momentum begrijpt.',
  'Curious, grounded, into long bike rides and cleanly written thoughts.':
    'Nieuwsgierig, gegrond, houdt van lange fietstochten en helder geschreven gedachten.',
  'Fast humor, big energy, and open to a fun plan when the vibe is honest.':
    'Snelle humor, veel energie en open voor een leuk plan als de vibe eerlijk is.',
}

function displayMatchText(text, language = viewer.language) {
  if (!isDutchLanguage(language)) return text
  const cleanText = String(text ?? '')
  if (matchTextTranslations[cleanText]) return matchTextTranslations[cleanText]
  if (cleanText.startsWith('Profile created through ')) {
    return cleanText
      .replace(/^Profile created through Email:/, 'Profiel aangemaakt via e-mail:')
      .replace(/^Profile created through ([^:]+):/, 'Profiel aangemaakt via $1:')
  }
  return cleanText
    .replace(/^You both show signals around (.+) intent\.$/i, 'Jullie tonen allebei signalen rond $1-intentie.')
    .replace(/^You can both communicate in (.+)\.$/i, 'Jullie kunnen allebei communiceren in $1.')
    .replace('Your profile language still needs a bit more signal.', 'Je profieltaal heeft nog wat extra signaal nodig.')
    .replace(
      'The AI sees enough shared signal for a confident introduction.',
      'De AI ziet genoeg gedeeld signaal voor een zelfverzekerde intro.',
    )
    .replace(
      'There is promise here, but MatchPulse needs more feedback.',
      'Er zit potentieel in, maar MatchPulse heeft nog meer feedback nodig.',
    )
}

const signalLabelTranslations = {
  Honesty: 'Eerlijkheid',
  Kindness: 'Zachtheid',
  Ambition: 'Ambitie',
  Growth: 'Groei',
  'Deep conversations': 'Diepe gesprekken',
  Creativity: 'Creativiteit',
  Warmth: 'Warmte',
  'Quiet confidence': 'Rustige zelfzekerheid',
  'Natural style': 'Natuurlijke stijl',
  'Warm eyes': 'Warme blik',
  'Clear plans': 'Duidelijke plannen',
  'Calm pace': 'Rustig tempo',
  'Coffee first': 'Eerst koffie',
  'City energy': 'Stadsenergie',
  Travel: 'Reizen',
  'Sunday reset': 'Zondagsrust',
  Respect: 'Respect',
  'No drama': 'Geen drama',
  'Clear communication': 'Heldere communicatie',
  Consistency: 'Consistentie',
  'Emotional availability': 'Emotioneel beschikbaar',
  'Creative life': 'Creatief leven',
  'Vague intent': 'Vage intentie',
  'Poor communication': 'Slechte communicatie',
  'No curiosity': 'Geen nieuwsgierigheid',
  Walks: 'Wandelingen',
  'Dinner after trust': 'Dinner na vertrouwen',
  'New signal': 'Nieuw signaal',
}

function signalLabel(value, language = viewer.language) {
  const label = typeof value === 'string' ? value : value?.label
  if (!isDutchLanguage(language)) return label ?? ''
  return signalLabelTranslations[label] ?? translateRadarTag(label ?? '')
}

function signalValueText(value, language = viewer.language) {
  if (!isDutchLanguage(language)) return value
  return String(value ?? '')
    .split(' + ')
    .map((item) => signalLabel(item, language))
    .join(' + ')
}

function attentionSignalLabel(signal, language = viewer.language) {
  const label = String(signal?.label ?? '')
  if (!isDutchLanguage(language)) return label
  return label
    .replace(/^Style pull:/i, 'Stijlpull:')
    .replace(/^Profile pull:/i, 'Profielpull:')
    .replace(/^Chat rhythm:/i, 'Chatritme:')
}

const dnaAxisTranslations = {
  visualWarmth: ['Visuele warmte', 'zachte blik en openheid'],
  aestheticPrecision: ['Esthetische precisie', 'smaak, styling en compositie'],
  bodyEnergy: ['Lichaamsenergie', 'beweging en actieve aanwezigheid'],
  calmIntensity: ['Rustige intensiteit', 'stille zelfzekerheid en diepgang'],
  emotionalClarity: ['Emotionele helderheid', 'directheid en communicatieve aantrekkingskracht'],
  cityMagnetism: ['Stadsmagnetisme', 'nachtenergie, sociale zelfzekerheid en tempo'],
  ambitionSignal: ['Ambitiesignaal', 'drive, groei en richting'],
  playfulSpark: ['Speelse spark', 'humor, spontaniteit en lichtheid'],
  styleCuriosity: ['Stijlcuriositeit', 'aandacht voor look, energie en expressie'],
}

function dnaAxisCopy(axis, language = viewer.language) {
  if (!isDutchLanguage(language)) return axis
  const translated = dnaAxisTranslations[axis.id]
  return translated
    ? { ...axis, label: translated[0], detail: translated[1] }
    : { ...axis, label: signalLabel(axis.label, language), detail: axis.detail }
}

function navLabel(item, language = viewer.language) {
  return appText(language).nav[item.id] ?? item.label
}

const initialLinkedTools = [
  { id: 'chatgpt', label: 'ChatGPT export', connected: true, detail: 'Profile conversations' },
  { id: 'calendar', label: 'Calendar', connected: true, detail: 'Date rhythm' },
  { id: 'spotify', label: 'Spotify', connected: false, detail: 'Taste and mood' },
  { id: 'photos', label: 'Photos', connected: false, detail: 'Visual preference' },
  { id: 'notes', label: 'Notes', connected: true, detail: 'Private reflections' },
  { id: 'location', label: 'Location', connected: true, detail: 'Nearby, fuzzed' },
]

const profilePromptIdeas = [
  {
    id: 'green-flag',
    label: 'Green flag',
    text: 'Green flag I notice fast: emotional availability, clear plans, calm confidence, and someone who is kind when nobody is watching.',
  },
  {
    id: 'easy-date',
    label: 'Easy date',
    text: 'A first date feels easy when there is warmth, one honest question, good lighting, and no pressure to perform.',
  },
  {
    id: 'visual-taste',
    label: 'Attraction taste',
    text: 'Visually I notice clean style, expressive eyes, relaxed posture, warm energy, and people who feel intentional without trying too hard.',
  },
  {
    id: 'boundary',
    label: 'Boundary',
    text: 'I lose interest when communication is vague, plans feel last minute, or the other person avoids emotional honesty.',
  },
]

const preTesterAuditItems = [
  {
    id: 'profile-depth',
    title: 'Profile depth',
    body: 'Prompts should help people explain values, green flags, attraction taste and date rhythm before they browse.',
    action: 'profile',
  },
  {
    id: 'nearby-grid',
    title: 'Nearby grid',
    body: 'Radar should feel fast like a nearby grid, but with fuzzed location, tags and AI reasons instead of raw distance only.',
    action: 'discover',
  },
  {
    id: 'match-reasons',
    title: 'Clear reasons',
    body: 'Every high score needs a human-readable why: shared values, mutual pull, uncertainty and the first safe next move.',
    action: 'matches',
  },
  {
    id: 'safety-consent',
    title: 'Safety and consent',
    body: 'Report, block, share-date, export, delete and memory visibility must be visible before real testers arrive.',
    action: 'settings',
  },
]

const onboardingDraftStorageKey = 'matchpulse-onboarding-draft'
const floatingFeedbackStorageKey = 'matchpulse-floating-feedback-v2'
const floatingFeedbackStorageAnonSeed = 'anonymous'
const floatingFeedbackPositionStorageKey = 'matchpulse-floating-feedback-position-v1'
const floatingFeedbackIssueTypeOptions = [
  ['general', 'General'],
  ['confusing', 'Confusing'],
  ['visual', 'Visual'],
  ['bug', 'Bug'],
  ['privacy', 'Privacy'],
  ['match_quality', 'Match'],
  ['performance', 'Performance'],
]
const floatingFeedbackMaxTextLength = 1200
const maxFloatingScreenshotsPerIssue = 8
const maxScreenshotBytes = 5 * 1024 * 1024
const maxStoredFloatingScreenshotChars = 220000
const floatingFeedbackResolvedAt = '2026-06-28T20:45:00.000Z'

const floatingFeedbackKnownResolvedRules = [
  {
    id: 'feedback-widget-flow',
    label: 'Fixed in current beta build',
    labelNl: 'Opgelost in huidige beta build',
    terms: ['feedback knop', 'tekstbalk', 'submit', 'issue 2', 'screenshot toevoegen'],
  },
  {
    id: 'feedback-photo-quota',
    label: 'Photo upload fixed',
    labelNl: 'Foto-upload opgelost',
    terms: ['quota', 'issue 4', 'nieuwe foto', 'foto upload', 'uploaden', 'screenshot upload'],
  },
  {
    id: 'profile-cleanup',
    label: 'Profile view cleaned up',
    labelNl: 'Profielweergave opgeschoond',
    terms: ['profiel verwijder', 'aantrekkings-dna', 'private aandacht', 'private attention'],
  },
]

const floatingFeedbackIssueTypeCopy = {
  general: ['General', 'General'],
  confusing: ['Confusing', 'Confusing'],
  visual: ['Visual', 'Visual'],
  bug: ['Bug', 'Bug'],
  privacy: ['Privacy', 'Privacy'],
  match_quality: ['Match', 'Match'],
  performance: ['Performance', 'Performance'],
}

const floatingFeedbackIssueTypeCopyNl = {
  general: ['Algemeen', 'Algemeen'],
  confusing: ['Onduidelijk', 'Onduidelijk'],
  visual: ['Visueel', 'Visueel'],
  bug: ['Bug', 'Bug'],
  privacy: ['Privacy', 'Privacy'],
  match_quality: ['Match', 'Match'],
  performance: ['Snelheid', 'Snelheid'],
}

function passwordChecks(password = '') {
  return [
    { id: 'length', ready: password.length >= 8 },
    { id: 'letter', ready: /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(password) },
    { id: 'number', ready: /\d/.test(password) },
  ]
}

function passwordIsReady(password = '') {
  return passwordChecks(password).every((check) => check.ready) && password.length <= 128
}

function createFeedbackClientId() {
  return `feedback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function clampFloatingFeedbackText(value) {
  return String(value ?? '').slice(0, floatingFeedbackMaxTextLength)
}

function sanitizeFeedbackIdentity(value = '') {
  const clean = String(value ?? '').trim().toLowerCase()
  if (!clean) return ''
  return clean.replace(/[^a-z0-9+@._-]/g, '').slice(0, 80)
}

function isSeedProfile(profile = {}) {
  return Boolean(profile?.id) && profile.id !== viewer.id
}

function floatingFeedbackSeedFromContext({ sessionId = '', onboardingDraft = {}, profile = {} }) {
  if (isSeedProfile(onboardingDraft)) {
    return `u-${sanitizeFeedbackIdentity(onboardingDraft.id)}`
  }

  if (isSeedProfile(profile)) {
    return `u-${sanitizeFeedbackIdentity(profile.id)}`
  }

  if (sessionId) {
    return `s-${sanitizeFeedbackIdentity(sessionId)}`
  }

  return floatingFeedbackStorageAnonSeed
}

function floatingFeedbackStorageKeyForSeed(seed = floatingFeedbackStorageAnonSeed) {
  return `${floatingFeedbackStorageKey}-${seed}`
}

function normalizeIssueType(issueType) {
  return floatingFeedbackIssueTypeOptions.some(([value]) => value === issueType) ? issueType : 'general'
}

function floatingSurfaceContext(surface = 'app', language = viewer.language, selectedMatch = null) {
  const navCopy = appText(language).nav ?? appCopy.English.nav
  const surfaceLabel = navCopy[surface] || surface

  if (surface === 'matchProfile' && selectedMatch?.name) {
    return `${surfaceLabel}: ${selectedMatch.name}`
  }

  if (surface === 'messages' && selectedMatch?.name) {
    return `${surfaceLabel}: ${selectedMatch.name}`
  }

  return surfaceLabel
}

function fallbackFloatingSurface(surface) {
  return String(surface ?? 'app').trim().slice(0, 80) || 'app'
}

function createFloatingFeedbackIssue(surface = 'app', surfaceLabel = '', surfaceContext = '') {
  return {
    id: createFeedbackClientId(),
    clientId: createFeedbackClientId(),
    body: '',
    rating: 4,
    issueType: 'general',
    screenshots: [],
    surface: fallbackFloatingSurface(surface),
    surfaceLabel: String(surfaceLabel || surface || 'App').slice(0, 80),
    surfaceContext: String(surfaceContext || '').slice(0, 140),
    syncedBody: '',
    syncedRating: 4,
    syncedIssueType: 'general',
    syncedScreenshotCount: 0,
    syncedSurface: '',
    syncedSurfaceLabel: '',
    syncedSurfaceContext: '',
    createdAt: new Date().toISOString(),
    updatedAt: '',
    syncedAt: '',
    resolvedAt: '',
    resolutionLabel: '',
    resolutionLabelNl: '',
    resolvedFixId: '',
    isLocal: true,
  }
}

function normalizeFeedbackSearchText(value = '') {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function applyKnownResolvedFloatingFeedbackIssue(issue) {
  if (!issue || issue.resolvedAt) return issue

  const createdAtMs = Date.parse(issue.createdAt || issue.updatedAt || '')
  const resolvedAtMs = Date.parse(floatingFeedbackResolvedAt)
  if (Number.isFinite(createdAtMs) && Number.isFinite(resolvedAtMs) && createdAtMs > resolvedAtMs) {
    return issue
  }

  const haystack = normalizeFeedbackSearchText([
    issue.body,
    issue.surface,
    issue.surfaceLabel,
    issue.surfaceContext,
    issue.issueType,
  ].filter(Boolean).join(' '))
  const matchedRule = floatingFeedbackKnownResolvedRules.find((rule) =>
    rule.terms.some((term) => haystack.includes(normalizeFeedbackSearchText(term))),
  )

  if (!matchedRule) return issue

  return {
    ...issue,
    resolvedAt: floatingFeedbackResolvedAt,
    resolvedFixId: matchedRule.id,
    resolutionLabel: matchedRule.label,
    resolutionLabelNl: matchedRule.labelNl,
  }
}

function normalizeFloatingIssue(item, fallbackSurface = 'app', fallbackSurfaceLabel = '') {
  if (!item || typeof item !== 'object') return null
  const cleanScreenshots = Array.isArray(item.screenshots)
    ? item.screenshots
      .map((shot) => ({
        id: String(shot?.id ?? createFeedbackClientId()),
        dataUrl: String(shot?.dataUrl ?? ''),
        name: String(shot?.name ?? 'screenshot').slice(0, 80),
        mime: String(shot?.mime ?? 'image/png').slice(0, 80),
        size: Number.parseInt(shot?.size, 10) || 0,
      }))
      .filter((shot) => shot.dataUrl && shot.name && shot.size >= 0)
      .slice(0, maxFloatingScreenshotsPerIssue)
    : []
  const surface = fallbackFloatingSurface(item.surface)
  const surfaceLabel = String(item.surfaceLabel || item.surface || fallbackSurfaceLabel || fallbackSurface).slice(0, 80)
  const normalizedIssue = {
    ...createFloatingFeedbackIssue(fallbackSurface, fallbackSurfaceLabel),
    ...item,
    id: String(item.id || createFeedbackClientId()),
    body: clampFloatingFeedbackText(item.body),
    rating: clamp(Number.parseInt(item.rating, 10) || 4, 1, 5),
    issueType: normalizeIssueType(item.issueType),
    screenshots: cleanScreenshots,
    surface,
    surfaceLabel,
    syncedBody: clampFloatingFeedbackText(item.syncedBody),
    syncedRating: clamp(Number.parseInt(item.syncedRating, 10) || 4, 1, 5),
    syncedIssueType: normalizeIssueType(item.syncedIssueType),
    syncedScreenshotCount: Number.parseInt(item.syncedScreenshotCount, 10) || 0,
    syncedSurface: String(item.syncedSurface || '').slice(0, 80),
    syncedSurfaceLabel: String(item.syncedSurfaceLabel || '').slice(0, 80),
    syncedSurfaceContext: String(item.syncedSurfaceContext || '').slice(0, 140),
    surfaceContext: String(item.surfaceContext || item.context || '').slice(0, 140),
    resolvedAt: String(item.resolvedAt || '').slice(0, 40),
    resolutionLabel: String(item.resolutionLabel || '').slice(0, 90),
    resolutionLabelNl: String(item.resolutionLabelNl || item.resolutionLabel || '').slice(0, 90),
    resolvedFixId: String(item.resolvedFixId || '').slice(0, 60),
  }

  return applyKnownResolvedFloatingFeedbackIssue(normalizedIssue)
}

function countFloatingScreenshots(screenshots = []) {
  return Array.isArray(screenshots) ? screenshots.length : 0
}

function floatingFeedbackScreenshotsBytes(screenshots = []) {
  return Array.isArray(screenshots)
    ? screenshots.reduce((sum, shot) => sum + (Number.parseInt(shot.size, 10) || 0), 0)
    : 0
}

function isFloatingFeedbackIssueResolved(issue) {
  return Boolean(issue?.resolvedAt || issue?.resolvedFixId)
}

function floatingFeedbackResolutionLabel(issue, language = viewer.language) {
  if (!isFloatingFeedbackIssueResolved(issue)) return ''
  if (isDutchLanguage(language)) {
    return issue.resolutionLabelNl || issue.resolutionLabel || 'Opgelost'
  }
  return issue.resolutionLabel || 'Resolved'
}

function compactFloatingScreenshotForStorage(shot, stripDataUrl = false) {
  const dataUrl = String(shot?.dataUrl ?? '')
  const storedDataUrl = !stripDataUrl && dataUrl.length <= maxStoredFloatingScreenshotChars ? dataUrl : ''
  const storedSize = Number.parseInt(shot?.size, 10) || estimateDataUrlBytes(storedDataUrl)

  return {
    id: String(shot?.id ?? createFeedbackClientId()),
    dataUrl: storedDataUrl,
    name: String(shot?.name ?? 'screenshot').slice(0, 80),
    mime: String(shot?.mime ?? 'image/jpeg').slice(0, 80),
    size: storedSize,
    originalSize: Number.parseInt(shot?.originalSize, 10) || Number.parseInt(shot?.size, 10) || 0,
    compacted: Boolean(shot?.compacted || stripDataUrl || dataUrl !== storedDataUrl),
  }
}

function compactFloatingFeedbackDraftForStorage(draft, stripScreenshots = false) {
  const normalized = normalizeFloatingFeedbackState(draft)
  return {
    activeItemId: normalized.activeItemId,
    collapsed: Boolean(normalized.collapsed),
    items: normalized.items.map((item) => ({
      ...item,
      screenshots: (item.screenshots ?? [])
        .map((shot) => compactFloatingScreenshotForStorage(shot, stripScreenshots))
        .filter((shot) => shot.name && (shot.dataUrl || stripScreenshots)),
    })),
  }
}

function safeWriteFloatingFeedbackDraft(storageSeed, draft) {
  if (typeof window === 'undefined') return false

  const storageKey = floatingFeedbackStorageKeyForSeed(storageSeed)
  const savedAt = new Date().toISOString()

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...compactFloatingFeedbackDraftForStorage(draft),
        savedAt,
      }),
    )
    return true
  } catch {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...compactFloatingFeedbackDraftForStorage(draft, true),
          savedAt,
          storageCompacted: true,
          storageWarning: 'Screenshots were removed from local draft storage after browser quota pressure.',
        }),
      )
      return true
    } catch {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // Ignore storage failures; feedback must never break the app shell.
      }
      return false
    }
  }
}

function safeSetLocalStorageItem(key, value) {
  if (typeof window === 'undefined') return false

  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeGetLocalStorageItem(key) {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function canUseInternalTools() {
  return import.meta.env.DEV || safeGetLocalStorageItem('matchpulse-dev-tools') === '1'
}

function defaultFloatingFeedbackDraft(surface = 'app', surfaceLabel = '') {
  const issue = createFloatingFeedbackIssue(surface, surfaceLabel)
  return {
    activeItemId: issue.id,
    collapsed: true,
    items: [issue],
  }
}

function readStoredFloatingFeedbackDraft(storageSeed = floatingFeedbackStorageAnonSeed) {
  const storageKey = floatingFeedbackStorageKeyForSeed(storageSeed)

  if (typeof window === 'undefined') return defaultFloatingFeedbackDraft()

  try {
    let payload = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null')

    if ((!payload || typeof payload !== 'object') && storageSeed === floatingFeedbackStorageAnonSeed) {
      payload = JSON.parse(window.localStorage.getItem(floatingFeedbackStorageKey) ?? 'null')
    }

    if (!payload || typeof payload !== 'object') return defaultFloatingFeedbackDraft()
    if (payload.items && Array.isArray(payload.items)) {
      const items = payload.items
        .map((item) => normalizeFloatingIssue(item))
        .filter(Boolean)
      if (items.length) {
        return {
          activeItemId: payload.activeItemId && items.some((item) => item.id === payload.activeItemId)
            ? payload.activeItemId
            : items[0].id,
          collapsed: Boolean(payload.collapsed),
          items,
        }
      }
    }
    if ('clientId' in payload || 'body' in payload || 'rating' in payload || 'issueType' in payload) {
      const issue = normalizeFloatingIssue({
        ...payload,
        id: payload.clientId || payload.id,
        surfaceLabel: payload.surfaceLabel || 'App',
      }, 'app', 'App')
      if (issue) {
        return {
          activeItemId: issue.id,
          collapsed: Boolean(payload.collapsed),
          items: [issue],
        }
      }
    }
    return {
      ...defaultFloatingFeedbackDraft(),
      ...payload,
      activeItemId: payload.activeItemId,
      collapsed: Boolean(payload.collapsed),
      items: Array.isArray(payload.items)
        ? payload.items.map((item) => normalizeFloatingIssue(item)).filter(Boolean)
        : [normalizeFloatingIssue({
          id: payload.clientId || createFeedbackClientId(),
          body: payload.body,
          rating: payload.rating,
          issueType: payload.issueType,
          syncedBody: payload.syncedBody,
          syncedRating: payload.syncedRating,
          syncedIssueType: payload.syncedIssueType,
          collapsed: payload.collapsed,
          surface: 'app',
          surfaceLabel: 'App',
        })].filter(Boolean),
    }
  } catch {
    return defaultFloatingFeedbackDraft()
  }
}

function normalizeFloatingFeedbackState(payload, surface = 'app', surfaceLabel = '') {
  const normalizedPayload = (!payload || typeof payload !== 'object')
    ? defaultFloatingFeedbackDraft(surface, surfaceLabel)
    : {
      ...defaultFloatingFeedbackDraft(surface, surfaceLabel),
      ...payload,
      activeItemId: payload.activeItemId,
      collapsed: Boolean(payload.collapsed),
      items: Array.isArray(payload.items) ? payload.items.map((item) => normalizeFloatingIssue(item, surface, surfaceLabel)).filter(Boolean) : [],
    }
  const items = normalizedPayload.items.length
    ? normalizedPayload.items
    : [createFloatingFeedbackIssue(surface, surfaceLabel)]
  const activeItemId = normalizedPayload.activeItemId && items.some((item) => item.id === normalizedPayload.activeItemId)
    ? normalizedPayload.activeItemId
    : items[0].id
  return {
    ...normalizedPayload,
    items,
    activeItemId,
  }
}

function floatingFeedbackIssueTypeLabel(value, language = viewer.language) {
  if (isDutchLanguage(language)) {
    return floatingFeedbackIssueTypeCopyNl[value]?.[0] ?? value
  }
  return floatingFeedbackIssueTypeCopy[value]?.[0] ?? value
}

function formatByteSize(bytes = 0) {
  const value = Number.parseInt(bytes, 10)
  if (!value || value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function readStoredFloatingFeedbackPosition() {
  if (typeof window === 'undefined') return null

  try {
    const payload = JSON.parse(window.localStorage.getItem(floatingFeedbackPositionStorageKey) ?? 'null')
    if (!payload || typeof payload !== 'object') return null
    const x = Number.parseInt(payload.x, 10)
    const y = Number.parseInt(payload.y, 10)
    if (Number.isNaN(x) || Number.isNaN(y)) return null
    return { x, y }
  } catch {
    return null
  }
}

function clampFloatingFeedbackPosition(position, collapsed = false) {
  if (!position || typeof window === 'undefined') return null
  const isCompact = window.innerWidth <= 760
  const margin = isCompact ? 12 : 8
  const width = isCompact
    ? (collapsed ? 58 : Math.min(372, window.innerWidth - 24))
    : (collapsed ? 252 : Math.min(372, window.innerWidth - 32))
  const height = isCompact ? (collapsed ? 58 : 480) : (collapsed ? 62 : 360)
  return {
    x: Math.round(clamp(position.x, margin, Math.max(margin, window.innerWidth - width - margin))),
    y: Math.round(clamp(position.y, margin, Math.max(margin, window.innerHeight - height - margin))),
  }
}

function defaultOnboardingDraft() {
  return {
    name: viewer.name,
    fullName: viewer.fullName,
    age: viewer.age,
    city: viewer.city,
    email: viewer.email,
    phone: viewer.phone,
    language: viewer.language,
    photo: viewer.photo,
    bio: viewer.bio,
    orientation: viewer.orientation,
    genderIdentity: viewer.genderIdentity ?? 'Not shown',
    interestedIn: profileInterest(viewer),
    photoPrivacy: normalizePhotoPrivacy(viewer.photoPrivacy),
    lookingFor: viewer.lookingFor,
  }
}

function shouldResetAuthFromUrl() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('resetAuth') === '1'
}

function readStoredOnboardingDraft() {
  if (typeof window === 'undefined' || shouldResetAuthFromUrl()) return null

  try {
    const payload = JSON.parse(window.localStorage.getItem(onboardingDraftStorageKey) ?? 'null')
    if (!payload || typeof payload !== 'object') return null
    return payload
  } catch {
    return null
  }
}

function clearStoredOnboardingDraft() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(onboardingDraftStorageKey)
}

function persistableOnboardingPhotos(photos = []) {
  return normalizeOnboardingPhotos(photos).filter((photo) => !String(photo).startsWith('data:image/'))
}

function scopedStoredOnboardingDraft(sessionId) {
  const stored = readStoredOnboardingDraft()
  if (!stored) return null
  if (stored.sessionId && stored.sessionId === sessionId) return stored
  if (!sessionId && !stored.sessionId) return stored
  return null
}

function getInitialAuthStep(sessionId, stored = readStoredOnboardingDraft()) {
  if (!sessionId) return 'login'
  if (stored?.sessionId === sessionId && onboardingSteps.some((item) => item.id === stored.step)) {
    return stored.step
  }
  return 'app'
}

function getStoredSessionId() {
  if (typeof window === 'undefined') return ''

  if (shouldResetAuthFromUrl()) {
    window.localStorage.removeItem('matchpulse-session')
    window.localStorage.removeItem(onboardingDraftStorageKey)
    const params = new URLSearchParams(window.location.search)
    params.delete('resetAuth')
    const query = params.toString()
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    )
  }

  return window.localStorage.getItem('matchpulse-session') ?? ''
}

function hasSupabaseAuthCallback() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('authCallback') === '1'
}

function readPasswordResetParams() {
  if (typeof window === 'undefined') return { token: '', contact: '' }
  const params = new URLSearchParams(window.location.search)
  return {
    token: params.get('resetToken') ?? '',
    contact: params.get('resetContact') ?? '',
  }
}

function readEmailVerificationParams() {
  if (typeof window === 'undefined') return { token: '', contact: '' }
  const params = new URLSearchParams(window.location.search)
  return {
    token: params.get('verifyToken') ?? '',
    contact: params.get('verifyContact') ?? '',
  }
}

function clearQueryParams(keys) {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  keys.forEach((key) => {
    params.delete(key)
  })

  const query = params.toString()
  window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function estimateDataUrlBytes(dataUrl = '') {
  const payload = String(dataUrl).split(',')[1] ?? ''
  return Math.ceil(payload.length * 0.75)
}

function loadImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })
}

async function compressFeedbackScreenshotDataUrl(dataUrl, { maxSide = 960, quality = 0.68 } = {}) {
  if (typeof document === 'undefined' || !String(dataUrl).startsWith('data:image/')) {
    return {
      dataUrl,
      mime: 'image/png',
      size: estimateDataUrlBytes(dataUrl),
      compacted: false,
    }
  }

  try {
    const image = await loadImageDataUrl(dataUrl)
    const largestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height, 1)
    const scale = Math.min(1, maxSide / largestSide)
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale))
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')

    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    let nextDataUrl = canvas.toDataURL('image/jpeg', quality)
    if (nextDataUrl.length > maxStoredFloatingScreenshotChars) {
      nextDataUrl = canvas.toDataURL('image/jpeg', 0.5)
    }
    if (nextDataUrl.length > maxStoredFloatingScreenshotChars) {
      const compactScale = Math.min(1, 680 / Math.max(width, height, 1))
      canvas.width = Math.max(1, Math.round(width * compactScale))
      canvas.height = Math.max(1, Math.round(height * compactScale))
      const compactContext = canvas.getContext('2d')
      if (!compactContext) throw new Error('Canvas unavailable')
      compactContext.fillStyle = '#fff'
      compactContext.fillRect(0, 0, canvas.width, canvas.height)
      compactContext.drawImage(image, 0, 0, canvas.width, canvas.height)
      nextDataUrl = canvas.toDataURL('image/jpeg', 0.44)
    }

    return {
      dataUrl: nextDataUrl,
      mime: 'image/jpeg',
      size: estimateDataUrlBytes(nextDataUrl),
      compacted: nextDataUrl !== dataUrl,
    }
  } catch {
    return {
      dataUrl,
      mime: 'image/png',
      size: estimateDataUrlBytes(dataUrl),
      compacted: false,
    }
  }
}

async function fileToFeedbackScreenshot(file) {
  const dataUrl = await fileToDataUrl(file)
  const compressed = await compressFeedbackScreenshotDataUrl(dataUrl)

  return {
    id: createFeedbackClientId(),
    dataUrl: compressed.dataUrl,
    name: file.name || 'screenshot',
    mime: compressed.mime || file.type || 'image/jpeg',
    size: compressed.size || file.size,
    originalSize: file.size,
    compacted: compressed.compacted,
  }
}

function App() {
  const [initialAuthState] = useState(() => {
    const storedSessionId = getStoredSessionId()
    const storedOnboarding = scopedStoredOnboardingDraft(storedSessionId)
    const resetParams = readPasswordResetParams()
    const emailVerificationParams = readEmailVerificationParams()
    const step = resetParams.token ? 'login' : getInitialAuthStep(storedSessionId, storedOnboarding)
    return {
      sessionId: resetParams.token ? '' : storedSessionId,
      step,
      storedOnboarding,
      resetParams,
      emailVerificationParams,
    }
  })
  const storedOnboarding = initialAuthState.storedOnboarding
  const [sessionId, setSessionId] = useState(initialAuthState.sessionId)
  const [isBooting, setIsBooting] = useState(() =>
    (Boolean(initialAuthState.sessionId) && initialAuthState.step === 'app') || hasSupabaseAuthCallback(),
  )
  const [activeView, setActiveView] = useState('discover')
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0].id)
  const [matchProfileReturnView, setMatchProfileReturnView] = useState('discover')
  const [playIndex, setPlayIndex] = useState(0)
  const [authStep, setAuthStep] = useState(initialAuthState.step)
  const [authUnlockedStep, setAuthUnlockedStep] = useState(() =>
    Math.max(
      onboardingStepIndex(initialAuthState.step),
      Number(storedOnboarding?.unlockedStep ?? 0),
    ),
  )
  const [authProvider, setAuthProvider] = useState(() => storedOnboarding?.provider ?? '')
  const [authContact, setAuthContact] = useState(() => initialAuthState.resetParams.contact || storedOnboarding?.contact || '')
  const [authPassword, setAuthPassword] = useState('')
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('')
  const [authResetSent, setAuthResetSent] = useState(false)
  const [resetToken, setResetToken] = useState(() => initialAuthState.resetParams.token)
  const [emailVerificationParams, setEmailVerificationParams] = useState(() => initialAuthState.emailVerificationParams)
  const [emailVerificationPreview, setEmailVerificationPreview] = useState('')
  const [authMode, setAuthMode] = useState(() => initialAuthState.resetParams.token ? 'reset' : storedOnboarding?.mode ?? 'login')
  const [authContactFocusSignal, setAuthContactFocusSignal] = useState(0)
  const [orientation, setOrientation] = useState(profileInterest(viewer))
  const [intent, setIntent] = useState(viewer.lookingFor)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState('Best matches this week')
  const [profileDraft, setProfileDraft] = useState(viewer)
  const [onboardingDraft, setOnboardingDraft] = useState(() => ({
    ...defaultOnboardingDraft(),
    ...(storedOnboarding?.profile ?? {}),
  }))
  const [onboardingPhotos, setOnboardingPhotos] = useState(() =>
    normalizeOnboardingPhotos(storedOnboarding?.photos ?? (storedOnboarding?.profile?.photo ? [storedOnboarding.profile.photo] : [])),
  )
  const [photoUploading, setPhotoUploading] = useState(false)
  const [matchPool, setMatchPool] = useState(matches)
  const [memoryNotes, setMemoryNotes] = useState(() => normalizeMemoryNotes(viewer.aiMemory))
  const [linkedTools, setLinkedTools] = useState(initialLinkedTools)
  const [advancedFilters, setAdvancedFilters] = useState({})
  const [hiddenMatches, setHiddenMatches] = useState([])
  const [privacySettings, setPrivacySettings] = useState(defaultPrivacySettings)
  const [attentionSignals, setAttentionSignals] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [favorites, setFavorites] = useState(['julian'])
  const [plannedDates, setPlannedDates] = useState([])
  const [feedbackItems, setFeedbackItems] = useState([])
  const [testerFeedbackItems, setTesterFeedbackItems] = useState([])
  const [reportItems, setReportItems] = useState([])
  const [briefings, setBriefings] = useState([])
  const [authEmails, setAuthEmails] = useState([])
  const [providerStatus, setProviderStatus] = useState(null)
  const [betaOverview, setBetaOverview] = useState(null)
  const [messages, setMessages] = useState([
    { id: 1, matchId: 'julian', from: 'ai', text: 'Julian is a strong fit. Try a direct, warm intro.' },
  ])
  const [serverInviteLink, setServerInviteLink] = useState('')
  const [apiError, setApiError] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [floatingFeedbackStorageSeed, setFloatingFeedbackStorageSeed] = useState(() =>
    floatingFeedbackSeedFromContext({
      sessionId: initialAuthState.sessionId,
      onboardingDraft: { ...defaultOnboardingDraft(), ...(storedOnboarding?.profile ?? {}) },
      profile: viewer,
    }),
  )
  const [floatingFeedbackDraft, setFloatingFeedbackDraft] = useState(() => readStoredFloatingFeedbackDraft(floatingFeedbackStorageSeed))

  const providerAvailability = useMemo(
    () => ({
      Google: canUseSupabaseOAuth('Google'),
      Apple: canUseSupabaseOAuth('Apple'),
    }),
    [],
  )
  const toastTimer = useRef(null)
  const inviteFrom = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('invite') ?? ''
  }, [])
  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    if (serverInviteLink) return serverInviteLink
    const code = profileDraft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return `${window.location.origin}${window.location.pathname}?invite=${code || 'matchpulse'}`
  }, [profileDraft.name, serverInviteLink])

  useEffect(() => {
    const nextSeed = floatingFeedbackSeedFromContext({
      sessionId,
      onboardingDraft,
      profile: profileDraft,
    })

    if (nextSeed === floatingFeedbackStorageSeed) return undefined
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFloatingFeedbackStorageSeed(nextSeed)
    setFloatingFeedbackDraft(readStoredFloatingFeedbackDraft(nextSeed))
  }, [floatingFeedbackStorageSeed, onboardingDraft, profileDraft, sessionId])

  const applyAppState = useCallback((state) => {
    if (state.sessionId) {
      setSessionId(state.sessionId)
      if (typeof window !== 'undefined') {
        safeSetLocalStorageItem('matchpulse-session', state.sessionId)
      }
    }
    setProfileDraft(state.profile)
    setOnboardingDraft({
      name: state.profile.name,
      fullName: state.profile.fullName,
      age: state.profile.age,
      city: state.profile.city,
      email: state.profile.email,
      phone: state.profile.phone ?? '',
      language: state.profile.language ?? viewer.language,
      photo: state.profile.photo,
      bio: state.profile.bio,
      orientation: state.profile.orientation,
      genderIdentity: normalizeGenderIdentity(state.profile.genderIdentity),
      interestedIn: profileInterest(state.profile),
      photoPrivacy: normalizePhotoPrivacy(state.profile.photoPrivacy),
      lookingFor: state.profile.lookingFor,
    })
    setOnboardingPhotos(resolveOnboardingPhotos(state))
    setOrientation(profileInterest(state.profile))
    setIntent(state.profile.lookingFor)
    setMatchPool(resolveMatchPool(state.matches))
    setMemoryNotes(normalizeMemoryNotes(state.memoryNotes ?? []))
    setAttentionSignals(state.attentionSignals ?? [])
    setLinkedTools(state.linkedTools ?? initialLinkedTools)
    setPrivacySettings({ ...defaultPrivacySettings, ...(state.privacySettings ?? {}) })
    setFavorites(state.favorites ?? [])
    setHiddenMatches(state.hiddenMatches ?? [])
    setPlannedDates(state.plannedDates ?? [])
    setFeedbackItems(state.feedback ?? [])
    setTesterFeedbackItems(state.testerFeedback ?? [])
    setReportItems(state.reports ?? [])
    setBriefings(state.briefings ?? [])
    setAuthEmails(state.authEmails ?? [])
    setProviderStatus(state.providerStatus ?? null)
    setBetaOverview(state.betaOverview ?? null)
    setMessages(state.messages ?? [])
    setServerInviteLink(state.inviteLink ?? '')
    setApiError('')
  }, [])

  useEffect(() => {
    const { token, contact } = emailVerificationParams
    if (!token || !contact || typeof window === 'undefined') return

    let cancelled = false
    verifyEmailToken(contact, token, onboardingDraft.language)
      .then(async (payload) => {
        if (cancelled) return
        setAuthContact(contact)
        setApiError('')
        setAuthPassword('')
        setAuthPasswordConfirm('')

        if (payload?.sessionId) {
          setSessionId(payload.sessionId)
          safeSetLocalStorageItem('matchpulse-session', payload.sessionId)
          setServerInviteLink(payload.inviteLink ?? '')
          setOnboardingDraft((current) => ({
            ...(payload.profile ?? {}),
            ...current,
            email: current.email || payload.profile?.email || contact,
            contact: contact || current.contact,
            language: current.language || payload.profile?.language || viewer.language,
            photo: current.photo || payload.profile?.photo || viewer.photo,
          }))
          setOnboardingPhotos((current) => normalizeOnboardingPhotos([...current, ...resolveOnboardingPhotos(payload)]))

          if (payload.onboarded) {
            const state = await fetchAppState(payload.sessionId)
            if (cancelled) return
            applyAppState(state)
            setAuthStep('app')
          } else {
            const stored = readStoredOnboardingDraft()
            const storedStep = onboardingSteps.some((item) => item.id === stored?.step) && stored.step !== 'login'
              ? stored.step
              : 'profile'
            setAuthModeWithReset('signup', { keepContact: true })
            setAuthStep(storedStep)
            setAuthUnlockedStep((current) => Math.max(current, onboardingStepIndex(storedStep)))
          }
        } else {
          setAuthModeWithReset('login', { keepContact: true })
        }

        showToast(payload.message ?? authText(onboardingDraft.language).login.verificationComplete)
      })
      .catch((error) => {
        if (cancelled) return
        const message = resolveAuthError(error, onboardingDraft.language)
        setApiError(message)
        showToast(message)
      })
      .finally(() => {
        if (!cancelled) {
          clearQueryParams(['verifyToken', 'verifyContact'])
          setEmailVerificationParams({ token: '', contact: '' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [applyAppState, emailVerificationParams.contact, emailVerificationParams.token, onboardingDraft.language])

  useEffect(() => {
    let cancelled = false
    if (typeof window === 'undefined') return undefined

    const params = new URLSearchParams(window.location.search)
    if (params.get('authCallback') !== '1') return undefined

    completeSupabaseOAuth()
      .then((accessToken) => {
        if (!accessToken) throw new Error('Supabase login did not return a session')
        return completeApiSupabaseAuth(accessToken, params.get('invite') ?? inviteFrom)
      })
      .then(async (auth) => {
        if (cancelled) return
        setAuthProvider(auth.profile.provider ?? 'Supabase')
        setSessionId(auth.sessionId)
        safeSetLocalStorageItem('matchpulse-session', auth.sessionId)
        const stored = readStoredOnboardingDraft()
        setOnboardingDraft({
          ...auth.profile,
          ...(stored?.profile ?? {}),
          email: stored?.profile?.email || auth.profile.email,
          contact: stored?.profile?.contact || auth.profile.contact,
          emailVerified: true,
        })
        setOnboardingPhotos(normalizeOnboardingPhotos([
          ...resolveOnboardingPhotos(auth),
          ...(stored?.photos ?? []),
        ]))
        setServerInviteLink(auth.inviteLink)
        window.history.replaceState({}, '', window.location.pathname)

        if (auth.onboarded) {
          applyAppState(await fetchAppState(auth.sessionId))
          setAuthStep('app')
        } else {
          const storedStep = onboardingSteps.some((item) => item.id === stored?.step) && stored.step !== 'login'
            ? stored.step
            : 'profile'
          setAuthModeWithReset('signup', { keepContact: true })
          setAuthStep(storedStep)
          setAuthUnlockedStep((current) => Math.max(current, onboardingStepIndex(storedStep)))
        }

        showToast('Secure login connected')
      })
      .catch((error) => {
        if (cancelled) return
        setApiError(error.message)
        setAuthStep('login')
        showToast(error.message)
      })
      .finally(() => {
        if (!cancelled) setIsBooting(false)
      })

    return () => {
      cancelled = true
    }
  }, [applyAppState, inviteFrom])

  useEffect(() => {
    let cancelled = false
    if (!sessionId || authStep !== 'app') {
      return () => {
        cancelled = true
      }
    }

    fetchAppState(sessionId)
      .then((state) => {
        if (cancelled) return
        if (!state.onboarded) {
          setProfileDraft(state.profile)
          setOnboardingDraft({
            name: state.profile.name,
            fullName: state.profile.fullName,
            age: state.profile.age,
            city: state.profile.city,
            email: state.profile.email,
            phone: state.profile.phone ?? '',
            language: state.profile.language ?? viewer.language,
            photo: state.profile.photo,
            bio: state.profile.bio,
            orientation: state.profile.orientation,
            genderIdentity: normalizeGenderIdentity(state.profile.genderIdentity),
            interestedIn: profileInterest(state.profile),
            photoPrivacy: normalizePhotoPrivacy(state.profile.photoPrivacy),
            lookingFor: state.profile.lookingFor,
          })
          setOnboardingPhotos(resolveOnboardingPhotos(state))
          setServerInviteLink(state.inviteLink ?? '')
          setAuthStep(readStoredOnboardingDraft()?.step ?? 'profile')
          return
        }
        applyAppState(state)
        setAuthStep('app')
      })
      .catch((error) => {
        if (cancelled) return
        window.localStorage.removeItem('matchpulse-session')
        setSessionId('')
        setAuthStep('login')
        setApiError(error.message)
      })
      .finally(() => {
        if (!cancelled) setIsBooting(false)
      })

    return () => {
      cancelled = true
    }
  }, [applyAppState, authStep, sessionId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (authStep === 'app') {
      clearStoredOnboardingDraft()
      return
    }

    safeSetLocalStorageItem(onboardingDraftStorageKey, JSON.stringify({
      step: authStep,
      unlockedStep: Math.max(authUnlockedStep, onboardingStepIndex(authStep)),
      sessionId,
      provider: authProvider,
      contact: authContact,
      mode: authMode,
      profile: onboardingDraft,
      photos: persistableOnboardingPhotos(onboardingPhotos),
      updatedAt: new Date().toISOString(),
    }))
  }, [authContact, authMode, authProvider, authStep, authUnlockedStep, onboardingDraft, onboardingPhotos, sessionId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    safeWriteFloatingFeedbackDraft(floatingFeedbackStorageSeed, floatingFeedbackDraft)
  }, [floatingFeedbackDraft, floatingFeedbackStorageSeed])

  useEffect(() => {
    if (!sessionId || authStep === 'login' || authStep === 'app' || authStep === 'invite') return undefined

    const timeout = window.setTimeout(() => {
      saveProfile(sessionId, onboardingDraft).catch(() => {})
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [authStep, onboardingDraft, sessionId])

  useEffect(() => {
    if (typeof window === 'undefined' || authStep !== 'app' || !sessionId) return undefined

    let cancelled = false
    const refreshMatches = () => {
      fetchAppState(sessionId)
        .then((state) => {
          if (cancelled) return
          setMatchPool(resolveMatchPool(state.matches))
          setHiddenMatches(state.hiddenMatches ?? [])
          setFavorites(state.favorites ?? [])
          setMessages(state.messages ?? [])
        })
        .catch(() => {})
    }
    const refreshOnVisible = () => {
      if (!document.hidden) refreshMatches()
    }
    const interval = window.setInterval(refreshMatches, 15000)
    window.addEventListener('focus', refreshMatches)
    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshMatches)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [authStep, sessionId])

  const visibleMatches = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    const activeFilters = filterOptions.filter((filter) => advancedFilters[filter.id])
    const byQuery = matchPool.filter((match) => {
      const searchable = [
        match.name,
        match.role,
        match.city,
        match.distance,
        match.status,
        match.about,
        match.bio,
        match.character,
        match.lifestyle,
        match.datingGoals,
        match.communicationStyle,
        match.education,
        ...match.intent,
        ...(match.hobbies ?? []),
        ...(match.interests ?? []),
        ...(match.values ?? []),
        ...(match.favoriteActivities ?? []),
      ]
        .join(' ')
        .toLowerCase()

      return (
        !isInternalSmokeProfile(match) &&
        match.id !== profileDraft.id &&
        !hiddenMatches.includes(match.id) &&
        matchFitsPreference({ ...profileDraft, interestedIn: orientation }, match) &&
        (!cleanQuery || searchable.includes(cleanQuery)) &&
        activeFilters.every((filter) => filter.test(match))
      )
    })

    return [...byQuery].sort((a, b) => {
      const realMatchSort = compareRealMatchesFirst(a, b)
      if (realMatchSort) return realMatchSort
      if (sortMode === 'Closest nearby') {
        return Number.parseFloat(a.distance) - Number.parseFloat(b.distance)
      }
      if (sortMode === 'Mutual pull') {
        return getAttractionDna(b).mutual - getAttractionDna(a).mutual
      }
      return defaultDiscoveryScore(b) - defaultDiscoveryScore(a)
    })
  }, [advancedFilters, hiddenMatches, matchPool, orientation, profileDraft, query, sortMode])

  const radarVisibleMatches = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    const byQuery = matchPool.filter((match) => {
      const searchable = [
        match.name,
        match.role,
        match.city,
        match.distance,
        match.status,
        match.about,
        match.bio,
        match.character,
        match.lifestyle,
        match.datingGoals,
        match.communicationStyle,
        match.education,
        ...match.intent,
        ...(match.hobbies ?? []),
        ...(match.interests ?? []),
        ...(match.values ?? []),
        ...(match.favoriteActivities ?? []),
      ]
        .join(' ')
        .toLowerCase()

      return (
        !isInternalSmokeProfile(match) &&
        match.id !== profileDraft.id &&
        !hiddenMatches.includes(match.id) &&
        (!cleanQuery || searchable.includes(cleanQuery))
      )
    })

    return [...byQuery].sort((a, b) => (
      compareRealMatchesFirst(a, b) ||
      Number.parseFloat(a.distance) - Number.parseFloat(b.distance) ||
      defaultDiscoveryScore(b) - defaultDiscoveryScore(a)
    ))
  }, [hiddenMatches, matchPool, profileDraft.id, query])

  const selectedMatch =
    visibleMatches.find((match) => match.id === selectedMatchId) ??
    visibleMatches[0] ??
    matchPool.find((match) => !hiddenMatches.includes(match.id) && !isInternalSmokeProfile(match)) ??
    matches[0]

  const floatingFeedbackSurfaceContext = useMemo(
    () => floatingSurfaceContext(activeView, profileDraft.language, selectedMatch),
    [activeView, profileDraft.language, selectedMatch],
  )

  const navigateToView = useCallback((viewId) => {
    const requestedView = viewId === 'plans'
      ? 'messages'
      : (['briefing', 'dev', 'lab', 'play'].includes(viewId) && !canUseInternalTools())
        ? 'discover'
        : viewId

    if (requestedView === 'messages') {
      const preferredThread =
        visibleMatches.find((match) =>
          messages.some(
            (message) =>
              message.matchId === match.id &&
              normalizeMessageStatus(message) === 'request' &&
              message.from === 'them',
          ),
        ) ??
        visibleMatches.find((match) =>
          messages.some(
            (message) =>
              message.matchId === match.id &&
              normalizeMessageStatus(message) === 'request',
          ),
        ) ??
        visibleMatches.find((match) =>
          messages.some((message) => message.matchId === match.id),
        )

      if (preferredThread) setSelectedMatchId(preferredThread.id)
    }
    setActiveView(requestedView)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' })
  }, [messages, visibleMatches])

  const syncAttentionSignal = useCallback(async (signal) => {
    if (!sessionId) return
    try {
      const state = await saveAttentionSignal(sessionId, signal)
      setAttentionSignals(state.attentionSignals ?? [])
      setMatchPool(resolveMatchPool(state.matches))
    } catch (error) {
      setApiError(error.message)
    }
  }, [sessionId])

  const recordAttentionSignal = useCallback((signal) => {
    if (!privacySettings.attentionLearning || !signal) return
    setAttentionSignals((current) => mergeAttentionSignal(current, signal))
    void syncAttentionSignal(signal)
  }, [privacySettings.attentionLearning, syncAttentionSignal])

  const recordAttentionDwell = useCallback((view, matchId, seconds) => {
    if (seconds < 6) return
    const match = matchPool.find((item) => item.id === matchId)
    if (!match) return
    recordAttentionSignal(createAttentionSignal(view === 'messages' ? 'chat' : 'profile', match, { seconds }))
  }, [matchPool, recordAttentionSignal])

  useEffect(() => {
    const trackedView = activeView === 'matchProfile' || activeView === 'messages'
    if (!trackedView) return undefined

    const matchId = selectedMatch.id
    const view = activeView
    const startedAt = Date.now()

    return () => {
      recordAttentionDwell(view, matchId, Math.round((Date.now() - startedAt) / 1000))
    }
  }, [activeView, recordAttentionDwell, selectedMatch.id])

  function selectMatch(matchId) {
    setSelectedMatchId(matchId)
    setActiveView('matches')
  }

  function openMatchProfile(matchId, returnView = 'discover') {
    const match = matchPool.find((item) => item.id === matchId)
    if (match) recordAttentionSignal(createAttentionSignal('profile', match))
    setMatchProfileReturnView(returnView)
    setSelectedMatchId(matchId)
    setActiveView('matchProfile')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectMatchInMessages(matchId) {
    const match = matchPool.find((item) => item.id === matchId)
    if (match) recordAttentionSignal(createAttentionSignal('chat', match))
    setSelectedMatchId(matchId)
    setActiveView('messages')
  }

  function recordPhotoAttention(match, photoIndex) {
    recordAttentionSignal(createAttentionSignal('photo', match, { photoIndex }))
  }

  function openPhotoRequest(matchId) {
    const match = matchPool.find((item) => item.id === matchId)
    if (match) recordAttentionSignal(createAttentionSignal('profile', match))
    setSelectedMatchId(matchId)
    setModal({ type: 'photoRequest' })
  }

  async function deleteAttentionSignal(signalId) {
    setAttentionSignals((current) => current.filter((signal) => signal.id !== signalId))
    showToast(profileDraft.language === 'Nederlands' ? 'Private aandachtssignaal verwijderd' : 'Private attention signal removed')
    if (!sessionId) return
    try {
      const state = await removeAttentionSignal(sessionId, signalId)
      setAttentionSignals(state.attentionSignals ?? [])
      setMatchPool(resolveMatchPool(state.matches))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function clearAttentionSignals() {
    setAttentionSignals([])
    showToast(profileDraft.language === 'Nederlands' ? 'Private aandachtssignalen gewist' : 'Private attention signals cleared')
    if (!sessionId) return
    try {
      const state = await clearAttentionSignalsOnServer(sessionId)
      setAttentionSignals(state.attentionSignals ?? [])
      setMatchPool(resolveMatchPool(state.matches))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function toggleFavorite(matchId) {
    setFavorites((current) =>
      current.includes(matchId)
        ? current.filter((id) => id !== matchId)
        : [...current, matchId],
    )
    if (!sessionId) return
    try {
      applyAppState(await toggleFavoriteOnServer(sessionId, matchId))
    } catch (error) {
      showToast(error.message)
    }
  }

  function rotateSort() {
    const order = ['Best matches this week', 'Mutual pull', 'Closest nearby']
    const next = order[(order.indexOf(sortMode) + 1) % order.length]
    setSortMode(next)
  }

  function updateInterestPreference(value) {
    const nextPreference = normalizeInterestPreference(value)
    setOrientation(nextPreference)
    setProfileDraft((current) => ({ ...current, interestedIn: nextPreference }))
  }

  function showToast(message) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast(message)
    toastTimer.current = window.setTimeout(() => setToast(''), 2400)
  }

  function nextMessageStatus(matchId) {
    if (isAutoAcceptingDemoMatch(matchId)) return 'accepted'
    return isThreadAccepted(messages, matchId) ? 'accepted' : 'request'
  }

  function canSendMessageTo(matchId) {
    if (nextMessageStatus(matchId) === 'accepted') return true
    const usage = messageRequestUsage(messages, profileDraft)
    if (usage.remaining > 0) return true
    showToast(profileDraft.language === 'Nederlands'
      ? `Daglimiet bereikt. Premium opent ${premiumMessageRequestLimit} verzoeken per dag.`
      : `Daily request limit reached. Premium unlocks ${premiumMessageRequestLimit} requests/day.`)
    return false
  }

  async function sendIntro(text) {
    const intro = text.trim()
    if (!intro) return
    if (!canSendMessageTo(selectedMatch.id)) return
    const status = nextMessageStatus(selectedMatch.id)

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        matchId: selectedMatch.id,
        from: 'you',
        text: intro,
        status,
        requestDirection: 'outgoing',
        createdAt: new Date().toISOString(),
      },
    ])
    setModal(null)
    showToast(profileDraft.language === 'Nederlands'
      ? (status === 'request' ? `Berichtverzoek naar ${selectedMatch.name} verzonden` : `Bericht naar ${selectedMatch.name} verzonden`)
      : (status === 'request' ? `Message request sent to ${selectedMatch.name}` : `Message sent to ${selectedMatch.name}`))
    if (!sessionId) return
    try {
      applyAppState(await sendMessageToServer(sessionId, selectedMatch.id, intro))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function savePlan(plan) {
    setPlannedDates((current) => [
      ...current,
      { id: Date.now(), matchId: selectedMatch.id, matchName: selectedMatch.name, ...plan },
    ])
    setModal(null)
    showToast(profileDraft.language === 'Nederlands'
      ? `Date-plan met ${selectedMatch.name} gemaakt`
      : `Date plan created with ${selectedMatch.name}`)
    if (!sessionId) return
    try {
      applyAppState(await createDatePlan(sessionId, selectedMatch, plan))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function shareDateDetails(plan) {
    const summary = [
      `MatchPulse safety card for ${selectedMatch.name}`,
      `When: ${plan.time}`,
      `Where: ${plan.place}`,
      `Match: ${selectedMatch.score}% Deep Match, ${selectedMatch.distance}`,
      plan.trustedContact ? `Trusted contact: ${plan.trustedContact}` : '',
      `Profile: ${selectedMatch.role}`,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await navigator.clipboard.writeText(summary)
      showToast('Date safety card copied')
    } catch {
      showToast('Date safety card ready')
    }
    setModal(null)
  }

  function activateDeepMatch() {
    setAdvancedFilters({})
    setQuery('')
    setSortMode('Best matches this week')
    showToast('Deep Match refreshed around your profile memory')
  }

  function toggleAdvancedFilter(filterId) {
    setAdvancedFilters((current) => ({ ...current, [filterId]: !current[filterId] }))
  }

  function clearAdvancedFilters() {
    setAdvancedFilters({})
    showToast(profileDraft.language === 'Nederlands' ? 'Geavanceerde filters gewist' : 'Advanced filters cleared')
  }

  async function hideMatch(matchId) {
    const hiddenName = selectedMatch.name
    setHiddenMatches((current) => (current.includes(matchId) ? current : [...current, matchId]))
    setModal(null)
    showToast(profileDraft.language === 'Nederlands' ? `${hiddenName} verborgen uit je matches` : `${hiddenName} hidden from matches`)
    if (!sessionId) return
    try {
      applyAppState(await hideMatchOnServer(sessionId, matchId))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function submitAiMemory(event) {
    event?.preventDefault()
    const text = aiInput.trim()
    if (!text) return

    const memory = createOptimisticMemory(text)
    const existingNotes = normalizeMemoryNotes(memoryNotes)
    const extractionCorpus = [
      profileDraft.bio,
      text,
      existingNotes.map((note) => note.text).join(' '),
    ].join('\n')
    const autoTagMemories = extractAutomaticProfileTags(extractionCorpus, existingNotes)
      .slice(0, maxAutoTagsPerSave)
      .map((signal) => createAutoTagMemory(signal, extractionCorpus))

    setMemoryNotes((current) => {
      const merged = [memory, ...autoTagMemories, ...normalizeMemoryNotes(current)]
      const seen = new Set()
      return merged.filter((note) => {
        const key = memorySlug(note.text.replace(/^You said:\s*/i, '').replace(/^AI tag:\s*/i, ''))
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      }).slice(0, maxLocalMemoryNotes)
    })
    setAiInput('')
    showToast(profileDraft.language === 'Nederlands'
      ? `AI-profielmemory bijgewerkt · ${autoTagMemories.length} tags geleerd`
      : `AI profile memory updated · learned ${autoTagMemories.length} tags`)
    if (!sessionId) return
    try {
      const payload = [
        { text, visibility: memory.visibility, source: memory.source },
        ...autoTagMemories.map((tagMemory) => ({
          text: tagMemory.text,
          visibility: tagMemory.visibility,
          source: tagMemory.source,
        })),
      ]
      applyAppState(await saveMemories(sessionId, payload))
    } catch (error) {
      showToast(error.message)
    }
  }

  function captureProfileSignal(kind) {
    const signal =
      kind === 'voice'
        ? (profileDraft.language === 'Nederlands'
            ? 'Voice note: ik voel me het meest open bij rustige, bewuste en flexibele plannen.'
            : 'Voice note: I feel most open when plans are calm, intentional, and flexible.')
        : (profileDraft.language === 'Nederlands'
            ? 'Imported signal: recente gesprekken tonen dat duidelijke plannen, warme zelfzekerheid en rustig tempo goed werken.'
            : 'Imported signal: recent conversations show I respond best to clear plans, warm confidence, and thoughtful pace.')

    setAiInput((current) => (current.trim() ? `${current}\n${signal}` : signal))
    showToast(profileDraft.language === 'Nederlands'
      ? (kind === 'voice' ? 'Voice-signaal toegevoegd aan de map' : 'Bron-signaal geimporteerd')
      : (kind === 'voice' ? 'Voice signal added to the map' : 'Source signal imported'))
  }

  async function toggleTool(toolId) {
    setLinkedTools((current) =>
      current.map((tool) =>
        tool.id === toolId ? { ...tool, connected: !tool.connected } : tool,
      ),
    )
    if (!sessionId) return
    try {
      applyAppState(await toggleLinkedTool(sessionId, toolId))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function togglePrivacySetting(settingId) {
    setPrivacySettings((current) => ({ ...current, [settingId]: !current[settingId] }))
    if (!sessionId) return
    try {
      applyAppState(await togglePrivacy(sessionId, settingId))
    } catch (error) {
      showToast(error.message)
    }
  }

  function clearAuthInputs({ keepContact = true } = {}) {
    if (!keepContact) setAuthContact('')
    setAuthPassword('')
    setAuthPasswordConfirm('')
    setAuthResetSent(false)
    setResetToken('')
  }

  function setAuthModeWithReset(mode, { keepContact = true } = {}) {
    clearAuthInputs({ keepContact })
    setAuthMode(mode)
    setApiError('')
  }

  function startFreshAuth() {
    const nextLanguage = onboardingDraft.language || viewer.language
    if (typeof window !== 'undefined') clearStoredOnboardingDraft()
    if (typeof window !== 'undefined') window.localStorage.removeItem('matchpulse-session')
    setAuthStep('login')
    setAuthUnlockedStep(0)
    setAuthProvider('')
    setOnboardingDraft({ ...defaultOnboardingDraft(), language: nextLanguage })
    setOnboardingPhotos([])
    setSessionId('')
    setServerInviteLink('')
    clearAuthInputs({ keepContact: false })
    setAuthMode('login')
    setApiError('')
    setAuthContactFocusSignal((signal) => signal + 1)
  }

  async function startAuth(provider, mode = authMode) {
    try {
      const contact = authContact.trim()
      if (provider !== 'Email' && !canUseSupabaseOAuth(provider)) {
        const message = authText(onboardingDraft.language).login.oauthUnavailable
        setApiError(message)
        showToast(message)
        return
      }
      if (provider === 'Email' && !contact) {
        const message = authText(onboardingDraft.language).login.missingContact
        setApiError(message)
        showToast(message)
        return
      }
      const password = authPassword
      if (provider === 'Email' && !password) {
        const message = authText(onboardingDraft.language).login.missingPassword
        setApiError(message)
        showToast(message)
        return
      }
      if (provider === 'Email' && mode === 'signup' && !passwordIsReady(password)) {
        const message = authText(onboardingDraft.language).login.passwordPolicy
        setApiError(message)
        showToast(message)
        return
      }
      if (provider === 'Email' && mode === 'signup' && password !== authPasswordConfirm) {
        const message = authText(onboardingDraft.language).login.passwordMismatch
        setApiError(message)
        showToast(message)
        return
      }

      if (canUseSupabaseOAuth(provider)) {
        setAuthProvider(provider)
        await startSupabaseOAuth(provider, inviteFrom)
        return
      }

      const session = await startAuthSession(provider, inviteFrom, contact, {
        language: onboardingDraft.language,
        orientation: onboardingDraft.orientation,
        genderIdentity: onboardingDraft.genderIdentity,
        interestedIn: onboardingDraft.interestedIn,
        photoPrivacy: onboardingDraft.photoPrivacy,
        lookingFor: onboardingDraft.lookingFor,
      }, mode, { password, passwordConfirm: authPasswordConfirm })
      const verificationPending = session.emailVerification?.status === 'pending' && mode === 'signup' && provider === 'Email'
      const verificationPreviewUrl = verificationPending ? (session.emailVerification?.previewUrl ?? '') : ''
      setEmailVerificationPreview(verificationPreviewUrl)
      if (verificationPending && session.emailVerification?.required) {
        const message = verificationPreviewUrl
          ? authText(onboardingDraft.language).login.verificationPreview
          : authText(onboardingDraft.language).login.verificationSent
        setAuthProvider(provider)
        setServerInviteLink(session.inviteLink)
        setAuthModeWithReset('login', { keepContact: true })
        setApiError(message)
        showToast(message)
        return
      }

      setAuthProvider(provider)
      setEmailVerificationPreview('')
      setSessionId(session.sessionId)
      setAuthPassword('')
      setAuthPasswordConfirm('')
      setAuthResetSent(false)
      setResetToken('')
      safeSetLocalStorageItem('matchpulse-session', session.sessionId)
      setOnboardingDraft(session.profile)
      setOnboardingPhotos(resolveOnboardingPhotos(session))
      setServerInviteLink(session.inviteLink)
      if (session.onboarded) {
        applyAppState(await fetchAppState(session.sessionId))
        setAuthStep('app')
        clearStoredOnboardingDraft()
        showToast(onboardingDraft.language === 'Nederlands' ? 'Welkom terug bij MatchPulse' : 'Welcome back to MatchPulse')
        return
      }

      if (verificationPending) {
        showToast(authText(onboardingDraft.language).login.verificationSent)
      }

      setAuthStep('pulse')
      const isDutch = onboardingDraft.language === 'Nederlands'
      showToast(
        session.accountStatus === 'existing'
          ? (isDutch ? 'Profiel gevonden' : 'Profile found')
          : (isDutch ? 'Nieuw beta-profiel gestart' : 'New beta profile started'),
      )
    } catch (error) {
      const message = resolveAuthError(error, onboardingDraft.language)
      if (error?.code === 'account_exists' && mode === 'signup') {
        setAuthModeWithReset('login', { keepContact: true })
      }
      if (error?.code === 'invalid_credentials') {
        setAuthPassword('')
      }
      setApiError(message)
      showToast(message)
    }
  }

  async function sendResetEmail() {
    try {
      const contact = authContact.trim()
      if (!contact) {
        const message = authText(onboardingDraft.language).login.missingContact
        setApiError(message)
        showToast(message)
        return
      }

      const payload = await requestPasswordReset(contact, onboardingDraft.language)
      setAuthResetSent(true)
      setApiError('')
      showToast(payload.message)
    } catch (error) {
      const message = resolveAuthError(error, onboardingDraft.language)
      setApiError(message)
      showToast(message)
    }
  }

  async function finishPasswordReset() {
    try {
      const contact = authContact.trim()
      if (!contact || !resetToken) {
        const message = authText(onboardingDraft.language).login.resetMissingToken
        setApiError(message)
        showToast(message)
        return
      }
      if (!passwordIsReady(authPassword)) {
        const message = authText(onboardingDraft.language).login.passwordPolicy
        setApiError(message)
        showToast(message)
        return
      }
      if (authPassword !== authPasswordConfirm) {
        const message = authText(onboardingDraft.language).login.passwordMismatch
        setApiError(message)
        showToast(message)
        return
      }

      const session = await completePasswordReset(
        contact,
        resetToken,
        authPassword,
        authPasswordConfirm,
        onboardingDraft.language,
      )
      setAuthProvider('Email')
      setSessionId(session.sessionId)
      setAuthPassword('')
      setAuthPasswordConfirm('')
      setAuthResetSent(false)
      setResetToken('')
      safeSetLocalStorageItem('matchpulse-session', session.sessionId)
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname)
      }
      setOnboardingDraft(session.profile)
      setOnboardingPhotos(resolveOnboardingPhotos(session))
      setServerInviteLink(session.inviteLink)

      if (session.onboarded) {
        applyAppState(await fetchAppState(session.sessionId))
        setAuthStep('app')
        clearStoredOnboardingDraft()
      } else {
        setAuthStep('pulse')
      }
      showToast(authText(onboardingDraft.language).login.resetComplete)
    } catch (error) {
      const message = resolveAuthError(error, onboardingDraft.language)
      if (error?.code === 'invalid_reset_token') setResetToken('')
      setApiError(message)
      showToast(message)
    }
  }

  function updateOnboardingField(field, value) {
    setOnboardingDraft((current) => ({ ...current, [field]: value }))
  }

  function goToAuthStep(nextStep) {
    if (!onboardingSteps.some((item) => item.id === nextStep)) return
    setAuthStep(nextStep)
    setAuthUnlockedStep((current) => Math.max(current, onboardingStepIndex(nextStep)))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function goBackAuthStep() {
    const currentIndex = onboardingSteps.findIndex((item) => item.id === authStep)
    const previousStep = onboardingSteps[Math.max(0, currentIndex - 1)]?.id
    if (previousStep) goToAuthStep(previousStep)
  }

  function expireOnboardingSession() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('matchpulse-session')
    }
    setSessionId('')
  }

  function continueToPhotos() {
    goToAuthStep('photos')
    showToast(onboardingDraft.language === 'Nederlands' ? 'Profielbasis bewaard' : 'Profile basics saved')
  }

  async function addOnboardingPhoto(event, replaceIndex = null) {
    const files = Array.from(event.target.files ?? []).filter(Boolean)
    if (!files.length) return

    const replacing = replaceIndex !== null && Number.isFinite(Number(replaceIndex)) && Number(replaceIndex) >= 0
    const currentPhotoCount = normalizeOnboardingPhotos(onboardingPhotos).length
    const remainingSlots = Math.max(0, ONBOARDING_PHOTO_LIMIT - currentPhotoCount)
    const uploadLimit = replacing ? Math.max(1, remainingSlots + 1) : remainingSlots
    const filesToUpload = files.slice(0, uploadLimit)
    if (!filesToUpload.length) {
      event.target.value = ''
      showToast(authText(onboardingDraft.language).photos.limitReached)
      return
    }

    setPhotoUploading(true)
    try {
      const uploads = []
      for (const file of filesToUpload) {
        const image = await fileToDataUrl(file)
        uploads.push(image)
      }

      setOnboardingPhotos((current) => {
        const base = normalizeOnboardingPhotos(current)
        if (replaceIndex !== null && Number.isFinite(replaceIndex) && replaceIndex >= 0) {
          const next = [...base]
          if (!uploads.length) return next
          if (replaceIndex < next.length) {
            next[replaceIndex] = uploads[0]
          } else {
            next.push(uploads[0])
          }
          if (uploads.length > 1) {
            next.push(...uploads.slice(1))
          }
          return normalizeOnboardingPhotos(next)
        }
        return normalizeOnboardingPhotos([...base, ...uploads])
      })
      event.target.value = ''
      showToast(
        onboardingDraft.language === 'Nederlands'
          ? 'Foto toegevoegd aan je profiel'
          : 'Photo added to your profile',
      )
    } catch (error) {
      if (error?.code === 'session_expired' || /session expired/i.test(error?.message ?? '')) {
        expireOnboardingSession()
      }
      showToast(error.message || (onboardingDraft.language === 'Nederlands' ? 'Kon die foto niet lezen' : 'Could not read that photo'))
    } finally {
      setPhotoUploading(false)
    }
  }

  async function addProfilePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const image = await fileToDataUrl(file)
      const uploadedImage = sessionId
        ? (await uploadProfilePhoto(sessionId, image)).photoUrl
        : image
      setProfileDraft((current) => ({ ...current, photo: uploadedImage }))
      setOnboardingPhotos((current) => normalizeOnboardingPhotos([uploadedImage, ...current]))
      event.target.value = ''
      showToast('Profile photo added')
    } catch (error) {
      if (error?.code === 'session_expired' || /session expired/i.test(error?.message ?? '')) {
        expireOnboardingSession()
        const image = await fileToDataUrl(file)
        setProfileDraft((current) => ({ ...current, photo: image }))
        setOnboardingPhotos((current) => normalizeOnboardingPhotos([image, ...current]))
        event.target.value = ''
        showToast(onboardingDraft.language === 'Nederlands' ? 'Foto lokaal gekozen. Account maken bewaart hem straks.' : 'Photo selected locally. Creating the account will save it.')
        return
      }
      showToast(error.message || 'Could not read that photo')
    }
  }

  function pickSamplePhoto(photo) {
    setOnboardingPhotos((current) => normalizeOnboardingPhotos([photo, ...current.filter((item) => item !== photo)]))
    showToast(onboardingDraft.language === 'Nederlands' ? 'Profielfoto gekozen' : 'Profile photo selected')
  }

  function removeOnboardingPhoto(indexToRemove) {
    const currentPhotos = normalizeOnboardingPhotos(onboardingPhotos)
    const removedPhoto = currentPhotos[indexToRemove]
    const nextPhotos = normalizeOnboardingPhotos(currentPhotos.filter((_, index) => index !== indexToRemove))
    setOnboardingPhotos(nextPhotos)
    setProfileDraft((current) => (
      current.photo === removedPhoto
        ? { ...current, photo: nextPhotos[0] || viewer.photo }
        : current
    ))
  }

  function reorderOnboardingPhoto(fromIndex, toIndex) {
    setOnboardingPhotos((current) => {
      const next = normalizeOnboardingPhotos(current)
      const from = Number(fromIndex)
      const to = Number(toIndex)
      if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return next
      if (from < 0 || from >= next.length) return next

      const moved = next.splice(from, 1)[0]
      const target = Math.min(to, next.length)
      next.splice(target, 0, moved)
      return next
    })
  }

  async function finishOnboarding() {
    if (photoUploading) {
      showToast(onboardingDraft.language === 'Nederlands' ? 'Wacht tot je foto klaar is met uploaden' : 'Wait until your photo finishes uploading')
      return
    }

    const cleanAge = Number.parseInt(onboardingDraft.age, 10)
    const completedProfile = {
      ...profileDraft,
      ...onboardingDraft,
      name: onboardingDraft.name.trim() || viewer.name,
      fullName: onboardingDraft.fullName?.trim() || onboardingDraft.name.trim() || viewer.fullName,
      age: Number.isNaN(cleanAge) ? viewer.age : cleanAge,
      city: onboardingDraft.city.trim() || viewer.city,
      email: onboardingDraft.email.trim() || viewer.email,
      phone: onboardingDraft.phone?.trim() || profileDraft.phone || '',
      language: onboardingDraft.language || viewer.language,
      bio: onboardingDraft.bio.trim() || viewer.bio,
      photo: onboardingDraft.photo || onboardingPhotos[0] || viewer.photo,
      orientation: onboardingDraft.orientation,
      genderIdentity: normalizeGenderIdentity(onboardingDraft.genderIdentity),
      interestedIn: profileInterest(onboardingDraft),
      photoPrivacy: normalizePhotoPrivacy(onboardingDraft.photoPrivacy),
      lookingFor: onboardingDraft.lookingFor,
      profileCompletion: 100,
    }

    try {
      const state = await completeOnboarding(sessionId, completedProfile, onboardingPhotos, {
        allowDraftSession: true,
        inviteCode: inviteFrom,
      })
      applyAppState(state)
      goToAuthStep('invite')
      showToast(completedProfile.language === 'Nederlands' ? 'Je AI-profiel is klaar' : 'Your AI profile is ready')
    } catch (error) {
      if (error?.code === 'session_expired' || /session expired/i.test(error?.message ?? '')) {
        expireOnboardingSession()
      }
      showToast(error.message)
    }
  }

  function enterApp() {
    setAuthStep('app')
    setActiveView('discover')
    clearStoredOnboardingDraft()
    showToast(profileDraft.language === 'Nederlands' ? 'Welkom bij MatchPulse' : 'Welcome to MatchPulse')
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      showToast(profileDraft.language === 'Nederlands' ? 'Invite-link gekopieerd' : 'Invite link copied')
    } catch {
      showToast(profileDraft.language === 'Nederlands' ? 'Invite-link klaar om te kopieren' : 'Invite link ready to copy')
    }
  }

  async function resetHiddenMatches() {
    setHiddenMatches([])
    if (!sessionId) {
      showToast('Hidden matches restored')
      return
    }
    try {
      applyAppState(await resetHiddenOnServer(sessionId))
      showToast('Hidden matches restored')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function exportProfile() {
    if (!sessionId) {
      showToast('Create an account session first')
      return
    }
    try {
      const data = await exportPrivateProfile(sessionId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'matchpulse-private-profile.json'
      link.click()
      URL.revokeObjectURL(url)
      showToast('Private profile export downloaded')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function deleteMemoryNote(note) {
    setMemoryNotes((current) => normalizeMemoryNotes(current).filter((item) => !sameMemory(item, note)))
    if (!sessionId) return
    try {
      applyAppState(await removeMemory(sessionId, note))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function updateMemoryVisibility(note, visibility) {
    const copy = memoryVisibilityCopy(visibility)
    setMemoryNotes((current) =>
      normalizeMemoryNotes(current).map((item) =>
        sameMemory(item, note) ? { ...item, visibility: copy.id, updatedAt: new Date().toISOString() } : item,
      ),
    )
    if (copy.id === 'profile') {
      const publicTag = publicTagFromMemory(note)
      setProfileDraft((current) => addProfilePreferenceTag(current, publicTag))
      setOnboardingDraft((current) => addProfilePreferenceTag(current, publicTag))
    }
    showToast(`Memory set to ${copy.label}`)
    if (!sessionId) return
    try {
      applyAppState(await updateMemoryConsent(sessionId, note, copy.id))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function saveProfileChanges() {
    if (!sessionId) {
      setActiveView('discover')
      return
    }
    try {
      applyAppState(await saveProfile(sessionId, {
        ...profileDraft,
        interestedIn: orientation,
        orientation: profileDraft.orientation,
        genderIdentity: normalizeGenderIdentity(profileDraft.genderIdentity),
        photoPrivacy: normalizePhotoPrivacy(profileDraft.photoPrivacy),
        lookingFor: intent,
      }))
      setActiveView('discover')
      showToast(profileDraft.language === 'Nederlands'
        ? 'Profiel bewaard en matches herberekend'
        : 'Profile saved and matches recalculated')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function sendDirectMessage(text) {
    const messageText = text.trim()
    if (!messageText) return
    if (!canSendMessageTo(selectedMatch.id)) return
    const status = nextMessageStatus(selectedMatch.id)
    const attentionSignal = createAttentionSignal(messageText.length > 80 ? 'message' : 'chat', selectedMatch)
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        matchId: selectedMatch.id,
        from: 'you',
        text: messageText,
        status,
        requestDirection: 'outgoing',
        createdAt: new Date().toISOString(),
      },
    ])
    showToast(profileDraft.language === 'Nederlands'
      ? (status === 'request' ? 'Berichtverzoek verzonden' : 'Bericht verzonden')
      : (status === 'request' ? 'Message request sent' : 'Message sent'))
    if (!sessionId) {
      recordAttentionSignal(attentionSignal)
      return
    }
    try {
      applyAppState(await sendMessageToServer(sessionId, selectedMatch.id, messageText))
      recordAttentionSignal(attentionSignal)
    } catch (error) {
      showToast(error.message)
    }
  }

  async function acceptMessageRequest(matchId) {
    if (!sessionId) {
      setMessages((current) =>
        current.map((message) =>
          message.matchId === matchId
            ? { ...message, status: 'accepted', acceptedAt: new Date().toISOString() }
            : message,
        ),
      )
      showToast('Chat unlocked')
      return
    }
    try {
      const payload = await acceptMessageRequestOnServer(sessionId, matchId)
      applyAppState(payload.state ?? payload)
      showToast('Chat unlocked')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function submitMatchFeedback(type, note = '') {
    if (!sessionId) {
      showToast('Create an account session first')
      return
    }
    try {
      applyAppState(await sendMatchFeedback(sessionId, selectedMatch, type, note))
      setModal(null)
      showToast('Match feedback saved')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function submitTesterFeedback(feedback, options = {}) {
    if (!sessionId) {
      const message = profileDraft.language === 'Nederlands' ? 'Maak eerst een profiel aan' : 'Create a profile first'
      if (options.toast !== false) showToast(message)
      if (options.toast === false) throw new Error(message)
      return null
    }
    try {
      const state = await sendTesterFeedback(sessionId, feedback)
      if (options.applyState !== false) applyAppState(state)
      if (options.toast !== false) {
        showToast(profileDraft.language === 'Nederlands' ? 'Testerfeedback opgeslagen' : 'Tester feedback saved')
      }
      return state
    } catch (error) {
      if (options.toast !== false) showToast(error.message)
      if (options.toast === false) throw error
      return null
    }
  }

  async function submitReport(reason, notes = '') {
    if (!sessionId) {
      showToast('Create an account session first')
      return
    }
    try {
      applyAppState(await reportAndBlockMatch(sessionId, selectedMatch, reason, notes))
      setModal(null)
      showToast(`${selectedMatch.name} blocked and report saved`)
    } catch (error) {
      showToast(error.message)
    }
  }

  async function sendBriefingNow() {
    if (!sessionId) {
      showToast('Create an account session first')
      return
    }
    try {
      applyAppState(await sendSundayBriefing(sessionId))
      showToast('Sunday briefing preview created')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function createLocalBetaTester() {
    if (!sessionId) {
      showToast('Create an account session first')
      return
    }

    try {
      const result = await createBetaTester(sessionId)
      applyAppState(result.state)
      showToast(`${result.tester.name} joined your sample pool`)
    } catch (error) {
      showToast(error.message)
    }
  }

  async function cleanupBetaData() {
    if (!sessionId) {
      showToast('Create an account session first')
      return
    }
    const confirmed = window.confirm('Clean internal QA and smoke-test profiles from the beta pool?')
    if (!confirmed) return

    try {
      const result = await cleanupBetaTestData(sessionId)
      applyAppState(result.state)
      showToast(result.cleaned ? `${result.cleaned} test profiles cleaned` : 'No internal test profiles found')
    } catch (error) {
      showToast(error.message)
    }
  }

  async function handlePlayChoice(match, choice) {
    const actions = {
      pass: {
        toast: `${match.name} moved out of your stack`,
        feedback: 'weaker',
        note: 'Quick Play pass signal.',
      },
      maybe: {
        toast: `${match.name} kept as a maybe`,
        feedback: 'general',
        note: 'Quick Play maybe signal.',
      },
      spark: {
        toast: `${match.name} saved as a spark`,
        feedback: 'stronger',
        note: 'Quick Play spark signal.',
      },
    }
    const action = actions[choice] ?? actions.maybe

    setSelectedMatchId(match.id)
    setPlayIndex((current) => current + 1)

    if (choice === 'pass') {
      setHiddenMatches((current) => (current.includes(match.id) ? current : [...current, match.id]))
    }
    if (choice === 'spark') {
      setFavorites((current) => (current.includes(match.id) ? current : [...current, match.id]))
    }

    showToast(action.toast)
    if (!sessionId) return

    try {
      if (choice === 'pass') {
        applyAppState(await hideMatchOnServer(sessionId, match.id))
        return
      }

      if (choice === 'spark' && !favorites.includes(match.id)) {
        await toggleFavoriteOnServer(sessionId, match.id)
      }

      applyAppState(await sendMatchFeedback(sessionId, match, action.feedback, action.note))
    } catch (error) {
      showToast(error.message)
    }
  }

  async function deleteBetaAccount() {
    if (!sessionId) return
    const confirmed = window.confirm('Delete this local beta account and clear its private MatchPulse data?')
    if (!confirmed) return

    try {
      await deleteAccount(sessionId)
      window.localStorage.removeItem('matchpulse-session')
      clearStoredOnboardingDraft()
      setSessionId('')
      setAuthStep('login')
      setActiveView('discover')
      setIsBooting(false)
      showToast('Beta account deleted')
    } catch (error) {
      showToast(error.message)
    }
  }

  function restartOnboarding() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('matchpulse-session')
      clearStoredOnboardingDraft()
    }
    const nextLanguage = onboardingDraft.language || viewer.language
    setSessionId('')
    setOnboardingDraft({ ...defaultOnboardingDraft(), language: nextLanguage })
    setOnboardingPhotos([])
    setAuthModeWithReset('login', { keepContact: false })
    setAuthStep('login')
    setAuthUnlockedStep(0)
    setAuthProvider('')
    setEmailVerificationPreview('')
    setAuthContactFocusSignal((signal) => signal + 1)
    setIsBooting(false)
    showToast(profileDraft.language === 'Nederlands' ? 'Uitgelogd. Kies je account.' : 'Signed out. Choose your account.')
  }

  if (isBooting) {
    return <LoadingShell />
  }

  if (authStep !== 'app') {
    return (
      <>
        <AuthExperience
          step={authStep}
          unlockedStep={authUnlockedStep}
          provider={authProvider}
          authMode={authMode}
          setAuthMode={setAuthModeWithReset}
          profile={onboardingDraft}
          photos={normalizeOnboardingPhotos(onboardingPhotos)}
          inviteFrom={inviteFrom}
          inviteLink={inviteLink}
          authContact={authContact}
          setAuthContact={setAuthContact}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authPasswordConfirm={authPasswordConfirm}
          setAuthPasswordConfirm={setAuthPasswordConfirm}
          authResetSent={authResetSent}
          resetToken={resetToken}
          emailVerificationPreview={emailVerificationPreview}
          setApiError={setApiError}
          authContactFocusSignal={authContactFocusSignal}
          startAuth={startAuth}
          sendResetEmail={sendResetEmail}
          finishPasswordReset={finishPasswordReset}
          goToStep={goToAuthStep}
          goBack={goBackAuthStep}
          continueFromPulse={() => goToAuthStep('profile')}
          providerAvailability={providerAvailability}
          updateProfile={updateOnboardingField}
          continueToPhotos={continueToPhotos}
          addPhotos={addOnboardingPhoto}
          removePhoto={removeOnboardingPhoto}
          reorderPhoto={reorderOnboardingPhoto}
          photoUploading={photoUploading}
          pickSamplePhoto={pickSamplePhoto}
          finishProfile={finishOnboarding}
          enterApp={enterApp}
          copyInviteLink={copyInviteLink}
          createLocalBetaTester={createLocalBetaTester}
          startFreshAuth={startFreshAuth}
          apiError={apiError}
        />
      <FloatingFeedbackWidget
        language={onboardingDraft.language}
        sessionId={sessionId}
        surface={`onboarding:${authStep}`}
        surfaceLabel={`${(isDutchLanguage(onboardingDraft.language) ? 'Onboarding' : 'Onboarding')}: ${String(authStep)}`}
        surfaceContext={`${isDutchLanguage(onboardingDraft.language) ? 'Onboarding' : 'Onboarding'}: ${String(authStep)}`}
        draft={floatingFeedbackDraft}
        onDraftChange={setFloatingFeedbackDraft}
        onSync={(feedback) => submitTesterFeedback(feedback, { toast: false, applyState: false })}
      />
        {toast ? <div className="toast">{toast}</div> : null}
      </>
    )
  }

  return (
    <main className="mp-window">
      <Rail activeView={activeView} setActiveView={navigateToView} profile={profileDraft} />
      <section className="mp-product">
        <Topbar
          query={query}
          setQuery={setQuery}
          profile={profileDraft}
          setActiveView={navigateToView}
          onNotify={() => showToast(appText(profileDraft.language).alertsClear)}
        />

        {activeView === 'matches' ? (
          <MatchesView
            matches={visibleMatches}
            selectedMatch={selectedMatch}
            profile={profileDraft}
            sortMode={sortMode}
            rotateSort={rotateSort}
            advancedFilters={advancedFilters}
            activateDeepMatch={activateDeepMatch}
            favorites={favorites}
            selectMatch={selectMatch}
            toggleFavorite={toggleFavorite}
            openModal={setModal}
            openMatchProfile={(matchId) => openMatchProfile(matchId, 'matches')}
          />
        ) : null}

        {activeView === 'discover' ? (
          <DiscoverView
            matches={radarVisibleMatches}
            selectedMatch={selectedMatch}
            profile={profileDraft}
            openMatchProfile={openMatchProfile}
            openMatchMessages={selectMatchInMessages}
            setActiveView={navigateToView}
            openModal={setModal}
            openPhotoRequest={openPhotoRequest}
            recordPhotoAttention={recordPhotoAttention}
          />
        ) : null}

        {activeView === 'matchProfile' ? (
          <MatchProfileView
            match={selectedMatch}
            memoryNotes={memoryNotes}
            openModal={setModal}
            setActiveView={navigateToView}
            submitMatchFeedback={submitMatchFeedback}
            profile={profileDraft}
            returnView={matchProfileReturnView}
          />
        ) : null}

        {activeView === 'play' ? (
          <PlayView
            matches={visibleMatches}
            playIndex={playIndex}
            favorites={favorites}
            onChoice={handlePlayChoice}
            onOpenMatch={selectMatch}
            onReset={() => setPlayIndex(0)}
          />
        ) : null}

        {activeView === 'messages' ? (
          <MessagesView
            matches={visibleMatches}
            selectedMatch={selectedMatch}
            selectMatch={selectMatchInMessages}
            messages={messages}
            profile={profileDraft}
            plannedDates={plannedDates}
            sendDirectMessage={sendDirectMessage}
            acceptMessageRequest={acceptMessageRequest}
            openModal={setModal}
          />
        ) : null}

        {activeView === 'briefing' ? (
          <BriefingView
            matches={visibleMatches}
            selectMatch={selectMatch}
            sendBriefingNow={sendBriefingNow}
            briefings={briefings}
            providerStatus={providerStatus}
          />
        ) : null}

        {activeView === 'memory' ? (
          <MemoryView
            profile={profileDraft}
            notes={memoryNotes}
            attentionSignals={attentionSignals}
            deleteMemoryNote={deleteMemoryNote}
            deleteAttentionSignal={deleteAttentionSignal}
            clearAttentionSignals={clearAttentionSignals}
            updateMemoryVisibility={updateMemoryVisibility}
            setActiveView={navigateToView}
          />
        ) : null}

        {activeView === 'plans' ? (
          <PlansView plannedDates={plannedDates} openModal={setModal} profile={profileDraft} />
        ) : null}

        {activeView === 'lab' ? (
          <BetaLabView
            betaOverview={betaOverview}
            providerStatus={providerStatus}
            createLocalBetaTester={createLocalBetaTester}
            cleanupBetaData={cleanupBetaData}
            inviteLink={inviteLink}
            copyInviteLink={copyInviteLink}
            setActiveView={navigateToView}
          />
        ) : null}

        {activeView === 'dev' ? (
          <DevFeedbackView
            language={profileDraft.language}
            localFeedbackItems={floatingFeedbackDraft.items ?? []}
            testerFeedbackItems={testerFeedbackItems}
            authEmails={authEmails}
          />
        ) : null}

        {activeView === 'profile' || activeView === 'settings' ? (
          activeView === 'settings' ? (
            <SettingsView
              profile={profileDraft}
              orientation={orientation}
              setOrientation={updateInterestPreference}
              privacySettings={privacySettings}
              togglePrivacySetting={togglePrivacySetting}
              hiddenCount={hiddenMatches.length}
              resetHiddenMatches={resetHiddenMatches}
              exportProfile={exportProfile}
              inviteLink={inviteLink}
              copyInviteLink={copyInviteLink}
              createLocalBetaTester={createLocalBetaTester}
              cleanupBetaData={cleanupBetaData}
              restartOnboarding={restartOnboarding}
              deleteBetaAccount={deleteBetaAccount}
              providerStatus={providerStatus}
              betaOverview={betaOverview}
              setActiveView={navigateToView}
              reportCount={reportItems.length}
              feedbackCount={feedbackItems.length}
              testerFeedbackCount={testerFeedbackItems.length}
              submitTesterFeedback={submitTesterFeedback}
            />
          ) : (
          <ProfileToolView
            profile={profileDraft}
            setProfile={setProfileDraft}
            orientation={orientation}
            setOrientation={updateInterestPreference}
            linkedTools={linkedTools}
            toggleTool={toggleTool}
            aiInput={aiInput}
            setAiInput={setAiInput}
            submitAiMemory={submitAiMemory}
            notes={memoryNotes}
            deleteMemoryNote={deleteMemoryNote}
            attentionSignals={attentionSignals}
            deleteAttentionSignal={deleteAttentionSignal}
            clearAttentionSignals={clearAttentionSignals}
            captureProfileSignal={captureProfileSignal}
            addProfilePhoto={addProfilePhoto}
            photos={normalizeOnboardingPhotos(onboardingPhotos)}
            removePhoto={removeOnboardingPhoto}
            reorderPhoto={reorderOnboardingPhoto}
            saveProfileChanges={saveProfileChanges}
          />
          )
        ) : null}
      </section>

      {modal ? (
        <ActionModal
          key={`${modal.type}-${selectedMatch.id}-${modal.seed ?? ''}-${modal.place ?? ''}-${modal.time ?? ''}`}
          modal={modal}
          match={selectedMatch}
          close={() => setModal(null)}
          sendIntro={sendIntro}
          savePlan={savePlan}
          shareDateDetails={shareDateDetails}
          toggleFavorite={toggleFavorite}
          openModal={setModal}
          isFavorite={favorites.includes(selectedMatch.id)}
          advancedFilters={advancedFilters}
          toggleAdvancedFilter={toggleAdvancedFilter}
          clearAdvancedFilters={clearAdvancedFilters}
          hideMatch={hideMatch}
          submitMatchFeedback={submitMatchFeedback}
          submitReport={submitReport}
          language={profileDraft.language}
        />
      ) : null}

        <FloatingFeedbackWidget
          language={profileDraft.language}
          sessionId={sessionId}
          surface={activeView}
          surfaceLabel={appText(profileDraft.language).nav?.[activeView] ?? activeView}
          surfaceContext={floatingFeedbackSurfaceContext}
          draft={floatingFeedbackDraft}
          onDraftChange={setFloatingFeedbackDraft}
          onSync={(feedback) => submitTesterFeedback(feedback, { toast: false, applyState: true })}
        />

      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  )
}

function LoadingShell() {
  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <div className="auth-brand">
          <BrandLogo showText />
        </div>
        <span className="auth-security">
          <ShieldCheck size={17} />
          Loading secure session
        </span>
      </header>
      <section className="auth-stage single">
        <section className="auth-panel loading-panel">
          <div className="auth-copy">
            <p>Connecting</p>
            <h1>Your private match space is opening.</h1>
            <span>We are loading your profile, matches, memory and account controls.</span>
          </div>
          <AuthPulseVisual step="pulse" profile={viewer} photos={[viewer.photo]} copy={authText(viewer.language).visual} />
        </section>
      </section>
    </main>
  )
}

function AuthLanguageMenu({ language, onChange, helper }) {
  return (
    <label className="auth-language-menu">
      <Globe2 size={17} />
      <span>{language}</span>
      <select
        aria-label="Language"
        value={language}
        onChange={(event) => onChange(event.target.value)}
      >
        {languages.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown size={16} />
      <small>{helper}</small>
    </label>
  )
}

function AuthExperience({
  step,
  unlockedStep,
  provider,
  authMode,
  setAuthMode,
  profile,
  photos,
  inviteFrom,
  inviteLink,
  authContact,
  setAuthContact,
  authPassword,
  setAuthPassword,
  authPasswordConfirm,
  setAuthPasswordConfirm,
  authResetSent,
  resetToken,
  emailVerificationPreview = '',
  setApiError,
  startAuth,
  sendResetEmail,
  finishPasswordReset,
  goToStep,
  goBack,
  continueFromPulse,
  updateProfile,
  startFreshAuth,
  continueToPhotos,
  addPhotos,
  removePhoto,
  reorderPhoto,
  photoUploading,
  pickSamplePhoto,
  finishProfile,
  enterApp,
  copyInviteLink,
  createLocalBetaTester,
  authContactFocusSignal,
  providerAvailability = {},
  apiError,
}) {
  const activeStep = onboardingSteps.findIndex((item) => item.id === step)
  const copy = authText(profile.language)
  const [dismissedOnboardingSignals, setDismissedOnboardingSignals] = useState([])
  const rawOnboardingSignals = useMemo(() => extractProfileSignals(profile?.bio ?? ''), [profile?.bio])
  const onboardingSignals = useMemo(
    () => rawOnboardingSignals.filter((signal) => !dismissedOnboardingSignals.includes(signal.id)),
    [dismissedOnboardingSignals, rawOnboardingSignals],
  )
  const profileQuality = useMemo(
    () => onboardingQuality(profile, onboardingSignals, photos),
    [onboardingSignals, photos, profile],
  )
  const [draggingPhotoIndex, setDraggingPhotoIndex] = useState(null)
  const [photoPositions, setPhotoPositions] = useState({})
  const [photoZooms, setPhotoZooms] = useState({})
  const photoSlots = [...Array(ONBOARDING_PHOTO_LIMIT)].map((_, index) => photos[index] ?? '')

  function photoPosition(photo) {
    return photoPositions[onboardingPhotoControlKey(photo)] ?? { x: 50, y: 50 }
  }

  function photoZoom(photo) {
    return photoZooms[onboardingPhotoControlKey(photo)] ?? 1
  }

  function photoStyle(photo) {
    const position = photoPosition(photo)
    const zoom = photoZoom(photo)
    return {
      objectPosition: `${position.x}% ${position.y}%`,
      transform: `scale(${zoom})`,
      transformOrigin: `${position.x}% ${position.y}%`,
    }
  }

  function nudgePhoto(photo, xDelta, yDelta) {
    const key = onboardingPhotoControlKey(photo)
    setPhotoPositions((current) => {
      const position = current[key] ?? { x: 50, y: 50 }
      return {
        ...current,
        [key]: {
          x: clamp(position.x + xDelta, 0, 100),
          y: clamp(position.y + yDelta, 0, 100),
        },
      }
    })
  }

  function updatePhotoZoom(photo, value) {
    const key = onboardingPhotoControlKey(photo)
    const nextZoom = clamp(Number.parseFloat(value) || 1, 1, 1.8)
    setPhotoZooms((current) => ({ ...current, [key]: nextZoom }))
  }

  function handlePhotoDragStart(index) {
    setDraggingPhotoIndex(index)
    return String(index)
  }

  function handlePhotoDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handlePhotoDrop(event, targetIndex) {
    event.preventDefault()
    const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
    if (Number.isNaN(sourceIndex)) return
    reorderPhoto(sourceIndex, targetIndex)
    setDraggingPhotoIndex(null)
  }

  function handlePhotoDragEnd() {
    setDraggingPhotoIndex(null)
  }

  function updateProfileSignal(field, value) {
    if (field === 'bio') setDismissedOnboardingSignals([])
    updateProfile(field, value)
  }

  function removeOnboardingSignal(signal) {
    setDismissedOnboardingSignals((current) => [...new Set([...current, signal.id])])
    updateProfile('bio', removeSignalFromText(profile.bio, signal.label))
  }

  function addOnboardingPrompt(prompt) {
    setDismissedOnboardingSignals([])
    const nextBio = profile.bio?.trim()
      ? `${profile.bio.trim()}\n\n${prompt.text}`
      : prompt.text
    updateProfile('bio', nextBio)
  }

  function canOpenStep(index) {
    return index <= Math.max(activeStep, unlockedStep)
  }

  const isPasswordReset = authMode === 'reset'
  const isCompletingReset = isPasswordReset && Boolean(resetToken)
  const activePasswordChecks = passwordChecks(authPassword)
  const contactInputRef = useRef(null)

  useEffect(() => {
    contactInputRef.current?.focus()
  }, [authContactFocusSignal])

  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <div className="auth-brand">
          <Activity size={32} />
          <span>MatchPulse</span>
        </div>
        <div className="auth-top-actions">
          <AuthLanguageMenu
            language={profile.language ?? viewer.language}
            onChange={(value) => updateProfileSignal('language', value)}
            helper={copy.languageDetail}
          />
          <span className="auth-security">
            <ShieldCheck size={17} />
            {copy.topSecurity}
          </span>
        </div>
      </header>

      <section className="auth-stage">
        <section className="auth-panel">
          <div className="auth-panel-nav">
            <button
              className="auth-back-button"
              type="button"
              onClick={goBack}
              disabled={activeStep <= 0}
            >
              <ChevronLeft size={17} />
              {copy.back}
            </button>
            <div className="auth-stepper" aria-label="Onboarding progress">
              {onboardingSteps.map((item, index) => (
                <button
                  className={index <= activeStep ? 'active' : ''}
                  type="button"
                  disabled={!canOpenStep(index)}
                  onClick={() => goToStep(item.id)}
                  aria-current={item.id === step ? 'step' : undefined}
                  key={item.id}
                >
                  <i>{index + 1}</i>
                  {copy.steps[item.id]}
                </button>
              ))}
            </div>
            <span className="auth-save-state">
              <Activity size={14} />
              {copy.saved}
            </span>
          </div>

          {step === 'login' ? (
            <form
              className="auth-copy auth-login-form"
              onSubmit={(event) => {
                event.preventDefault()
                if (isPasswordReset) {
                  if (isCompletingReset) finishPasswordReset()
                  else sendResetEmail()
                  return
                }
                startAuth('Email', authMode)
              }}
            >
              {inviteFrom ? (
                <div className="auth-invite-note">
                  <Link2 size={17} />
                  Invited by {inviteFrom}
                </div>
              ) : null}
              <p>{copy.login.kicker}</p>
              <h1>
                {isPasswordReset
                  ? copy.login.resetTitle
                  : authMode === 'login'
                    ? copy.login.loginTitle
                    : copy.login.signupTitle}
              </h1>
              <span>
                {isPasswordReset
                  ? (isCompletingReset ? copy.login.resetTokenBody : copy.login.resetBody)
                  : authMode === 'login'
                    ? copy.login.loginBody
                    : copy.login.signupBody}
              </span>
              {apiError ? <p className="auth-error">{apiError}</p> : null}
              {emailVerificationPreview ? (
                <div className="auth-verification-preview">
                  <ShieldCheck size={17} />
                  <span>{copy.login.verificationPreview}</span>
                  <a href={emailVerificationPreview}>{copy.login.verificationPreviewCta}</a>
                </div>
              ) : null}
              {!isPasswordReset ? (
                <div className="auth-mode-switch" aria-label="Choose login or sign up">
                  {[
                    ['login', copy.login.modeLogin],
                    ['signup', copy.login.modeSignup],
                  ].map(([mode, label]) => (
                    <button
                      className={authMode === mode ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        setAuthMode(mode)
                      }}
                      aria-pressed={authMode === mode}
                      key={mode}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              <label className="auth-contact-field">
                {isPasswordReset ? copy.login.resetContact : copy.login.contact}
                <input
                  ref={contactInputRef}
                  autoComplete="email tel"
                  inputMode="email"
                  value={authContact}
                  onChange={(event) => {
                    setAuthContact(event.target.value)
                    setApiError('')
                  }}
                  placeholder={copy.login.placeholder}
                />
                <small>
                  {isPasswordReset
                    ? copy.login.resetHelper
                    : authMode === 'login'
                      ? copy.login.loginHelper
                      : copy.login.signupHelper}
                </small>
              </label>
              {!isPasswordReset || isCompletingReset ? (
                <label className="auth-contact-field">
                  {copy.login.password}
                  <input
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    value={authPassword}
                    onChange={(event) => {
                      setAuthPassword(event.target.value)
                      setApiError('')
                    }}
                    placeholder={copy.login.passwordPlaceholder}
                    type="password"
                  />
                  <small>
                    {authMode === 'login' && !isCompletingReset
                      ? copy.login.loginPasswordHelper
                      : copy.login.signupPasswordHelper}
                  </small>
                </label>
              ) : null}
              {(authMode === 'signup' || isCompletingReset) ? (
                <>
                  <label className="auth-contact-field">
                    {copy.login.passwordConfirm}
                    <input
                      autoComplete="new-password"
                      value={authPasswordConfirm}
                      onChange={(event) => {
                        setAuthPasswordConfirm(event.target.value)
                        setApiError('')
                      }}
                      placeholder={copy.login.passwordConfirmPlaceholder}
                      type="password"
                    />
                  </label>
                  <div className="password-rule-list">
                    {activePasswordChecks.map((check, index) => (
                      <span className={check.ready ? 'ready' : ''} key={check.id}>
                        <i />
                        {copy.login.passwordRules[index]}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
              {authResetSent ? <p className="auth-success">{copy.login.resetSent}</p> : null}
              <button className="auth-email-submit" type="submit">
                <UserRound size={17} />
                {isPasswordReset
                  ? (isCompletingReset ? copy.login.resetCompleteCta : copy.login.resetCta)
                  : authMode === 'login'
                    ? copy.login.loginCta
                    : copy.login.signupCta}
              </button>
              <div className="auth-secondary-actions">
                {isPasswordReset ? (
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                  >
                    {copy.login.backToLogin}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode('reset')}
                  >
                    {copy.login.forgot}
                  </button>
                )}
                <button
                  type="button"
                  onClick={startFreshAuth}
                >
                  {copy.login.switchAccount}
                </button>
              </div>
              {!isPasswordReset ? <div className="auth-provider-list">
                {authProviders.map((option) => (
                  <button
                    type="button"
                    className={!option.disabled && (option.id === 'Email' || providerAvailability[option.id]) ? '' : 'auth-provider-disabled'}
                    onClick={() => startAuth(option.id, authMode)}
                    disabled={option.disabled || (option.id !== 'Email' && !providerAvailability[option.id])}
                    key={option.id}
                  >
                    <i>{option.mark}</i>
                    <span>
                      <strong>{copy.providers[option.id]?.[0] ?? option.label}</strong>
                      <small>{(option.id === 'Email' || providerAvailability[option.id])
                        ? (copy.providers[option.id]?.[1] ?? option.detail)
                        : copy.login.oauthUnavailable}
                      </small>
                    </span>
                    <ChevronRight size={19} />
                  </button>
                ))}
              </div> : null}
            </form>
          ) : null}

          {step === 'pulse' ? (
            <div className="auth-copy">
              <p>{provider || copy.pulse.kicker}</p>
              <h1>{copy.pulse.title}</h1>
              <span>{copy.pulse.body}</span>
              <div className="auth-signal-list">
                {copy.pulse.signals.map((signal, index) => {
                  const Icon = [Sparkles, Brain, Activity][index] ?? Sparkles
                  return (
                    <p key={signal}>
                      <Icon size={17} />
                      {signal}
                    </p>
                  )
                })}
              </div>
              <button className="auth-primary" type="button" onClick={continueFromPulse}>
                {copy.pulse.cta}
                <ChevronRight size={19} />
              </button>
            </div>
          ) : null}

          {step === 'profile' ? (
            <form
              className="auth-copy auth-form"
              onSubmit={(event) => {
                event.preventDefault()
                continueToPhotos()
              }}
            >
              <p>{copy.profile.kicker}</p>
              <h1>{copy.profile.title}</h1>
              <span>{copy.profile.body}</span>
              <div className="auth-field-grid">
                <label>
                  {copy.profile.name}
                  <input
                    value={profile.name}
                    onChange={(event) => updateProfileSignal('name', event.target.value)}
                    placeholder={copy.profile.namePlaceholder}
                  />
                </label>
                <label>
                  {copy.profile.age}
                  <input
                    inputMode="numeric"
                    value={profile.age}
                    onChange={(event) => updateProfileSignal('age', event.target.value)}
                    placeholder="31"
                  />
                </label>
                <label>
                  {copy.profile.city}
                  <input
                    value={profile.city}
                    onChange={(event) => updateProfileSignal('city', event.target.value)}
                    placeholder={copy.profile.cityPlaceholder}
                  />
                </label>
                <label>
                  {copy.profile.mobile}
                  <input
                    inputMode="tel"
                    value={profile.phone ?? ''}
                    onChange={(event) => updateProfileSignal('phone', event.target.value)}
                    placeholder="+32 470 12 34 56"
                  />
                </label>
                <label className="wide">
                  {copy.profile.email}
                  <input
                    value={profile.email}
                    onChange={(event) => updateProfileSignal('email', event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="wide">
                  {copy.profile.language}
                  <select
                    value={profile.language ?? viewer.language}
                    onChange={(event) => updateProfileSignal('language', event.target.value)}
                  >
                    {languages.map((language) => (
                      <option value={language} key={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="auth-segments single">
                <label className="auth-select-card">
                  <span>
                    <strong>{copy.profile.gender}</strong>
                    <small>{copy.profile.genderHelper}</small>
                  </span>
                  <select
                    value={normalizeGenderIdentity(profile.genderIdentity)}
                    onChange={(event) => updateProfileSignal('genderIdentity', event.target.value)}
                  >
                    {genderIdentityOptions.map((option) => (
                      <option value={option} key={option}>
                        {displayOption(option, profile.language)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="auth-select-card">
                  <span>
                    <strong>{copy.profile.interestedIn}</strong>
                    <small>{copy.profile.interestedHelper}</small>
                  </span>
                  <Segmented
                    value={profileInterest(profile)}
                    options={interestPreferences}
                    labels={Object.fromEntries(interestPreferences.map((option) => [option, displayOption(option, profile.language)]))}
                    onChange={(value) => updateProfileSignal('interestedIn', value)}
                  />
                </div>
              </div>
              <label className="auth-long-field">
                {copy.profile.question}
                <textarea
                  aria-label={copy.profile.question}
                  value={profile.bio}
                  onChange={(event) => updateProfileSignal('bio', event.target.value)}
                  placeholder={copy.profile.placeholder}
                />
              </label>
              <div className="auth-feeling-prompts" aria-label="Profile prompt shortcuts">
                {profilePromptIdeas.slice(0, 4).map((prompt) => (
                  <button type="button" onClick={() => addOnboardingPrompt(prompt)} key={prompt.id}>
                    <Sparkles size={14} />
                    {promptIdeaLabel(prompt, profile.language)}
                  </button>
                ))}
              </div>
              <DataConsentPrimer compact language={profile.language} />
              <SignalCloud
                signals={onboardingSignals}
                onRemove={removeOnboardingSignal}
                title={copy.profile.signalTitle}
                emptyText={copy.profile.signalEmpty}
                language={profile.language}
              />
              <div
                className="auth-quality-meter"
                aria-label={profile.language === 'Nederlands'
                  ? `Profielkwaliteit ${profileQuality}%`
                  : `Profile quality ${profileQuality}%`}
              >
                <span>
                  <Activity size={16} />
                  {copy.profile.depth}
                </span>
                <i>
                  <b style={{ width: `${profileQuality}%` }} />
                </i>
                <strong>{profileQuality}%</strong>
              </div>
              <button className="auth-primary" type="submit">
                {copy.profile.cta}
                <ChevronRight size={19} />
              </button>
            </form>
          ) : null}

          {step === 'photos' ? (
            <div className="auth-copy">
              <p>{copy.photos.kicker}</p>
              <h1>{copy.photos.title}</h1>
              <span>{copy.photos.body}</span>
              <small className="auth-photo-helper">{copy.photos.hint}</small>
              <div className="auth-photo-grid">
                {photoSlots.map((photo, index) => {
                  if (!photo) {
                    return (
                      <label
                        className="auth-photo-slot auth-photo-slot-empty"
                        onDragOver={handlePhotoDragOver}
                        onDrop={(event) => handlePhotoDrop(event, index)}
                        key={`slot-${index}`}
                      >
                        <Upload size={20} />
                        {photoUploading ? copy.photos.uploading : copy.photos.add}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            void addPhotos(event)
                          }}
                          disabled={photoUploading}
                        />
                      </label>
                    )
                  }

                  return (
                    <div
                      className={`auth-photo-slot${index === 0 ? ' active' : ''}${draggingPhotoIndex === index ? ' dragging' : ''}`}
                      key={`photo-${index}`}
                      draggable={photos.length > 1 && !photoUploading}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', handlePhotoDragStart(index))
                        event.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={handlePhotoDragOver}
                      onDrop={(event) => handlePhotoDrop(event, index)}
                      onDragEnd={handlePhotoDragEnd}
                    >
                      <img src={photo} alt="" draggable="false" style={photoStyle(photo)} />
                      {index === 0 ? <strong className="auth-photo-primary-badge">{copy.photos.primary}</strong> : null}
                      <button
                        type="button"
                        className="auth-photo-remove"
                        onClick={() => removePhoto(index)}
                        aria-label={copy.photos.remove}
                        title={copy.photos.remove}
                      >
                        <X size={15} />
                      </button>
                      <label className="auth-photo-slot-add-more">
                        <Upload size={14} />
                        <span>{copy.photos.change}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            void addPhotos(event, index)
                          }}
                          disabled={photoUploading}
                        />
                      </label>
                      <span className="auth-photo-drag-handle" aria-hidden="true">
                        <MoreVertical size={14} />
                      </span>
                      <div className="auth-photo-mobile-tools">
                        <div className="auth-photo-order-controls">
                          <button type="button" onClick={() => reorderPhoto(index, index - 1)} disabled={index <= 0}>
                            {isDutchLanguage(profile.language) ? 'Eerder' : 'Earlier'}
                          </button>
                          <button type="button" onClick={() => reorderPhoto(index, index + 1)} disabled={index >= photos.length - 1}>
                            {isDutchLanguage(profile.language) ? 'Later' : 'Later'}
                          </button>
                        </div>
                        <div className="auth-photo-nudge-controls" aria-label={isDutchLanguage(profile.language) ? 'Foto positie' : 'Photo position'}>
                          <button type="button" onClick={() => nudgePhoto(photo, 0, -8)}>
                            {isDutchLanguage(profile.language) ? 'Omhoog' : 'Up'}
                          </button>
                          <button type="button" onClick={() => nudgePhoto(photo, 0, 8)}>
                            {isDutchLanguage(profile.language) ? 'Omlaag' : 'Down'}
                          </button>
                          <button type="button" onClick={() => nudgePhoto(photo, -8, 0)}>
                            {isDutchLanguage(profile.language) ? 'Links' : 'Left'}
                          </button>
                          <button type="button" onClick={() => nudgePhoto(photo, 8, 0)}>
                            {isDutchLanguage(profile.language) ? 'Rechts' : 'Right'}
                          </button>
                        </div>
                        <label className="auth-photo-zoom-control">
                          <span>Zoom</span>
                          <input
                            type="range"
                            min="1"
                            max="1.8"
                            step="0.05"
                            value={photoZoom(photo)}
                            onChange={(event) => updatePhotoZoom(photo, event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="sample-photo-row">
                {samplePhotos.map((photo) => (
                  <button type="button" onClick={() => pickSamplePhoto(photo)} key={photo}>
                    <img src={photo} alt="" />
                    {copy.photos.sample}
                  </button>
                ))}
              </div>
              <div className="photo-privacy-picker">
                <span>
                  <strong>{copy.photos.privacyTitle}</strong>
                  <small>{copy.photos.privacyBody}</small>
                </span>
                <div>
                  {photoPrivacyOptions.map((option) => (
                    <button
                      className={normalizePhotoPrivacy(profile.photoPrivacy) === option.id ? 'active' : ''}
                      type="button"
                      onClick={() => updateProfileSignal('photoPrivacy', option.id)}
                      key={option.id}
                    >
                      <strong>{displayOption(option.id, profile.language)}</strong>
                      <small>{displayPhotoPrivacyDetail(option, profile.language)}</small>
                    </button>
                  ))}
                </div>
              </div>
              <button className="auth-primary" type="button" onClick={finishProfile} disabled={photoUploading}>
                {photoUploading ? copy.photos.uploading : copy.photos.cta}
                <ChevronRight size={19} />
              </button>
            </div>
          ) : null}

          {step === 'invite' ? (
            <div className="auth-copy">
              <p>{copy.invite.kicker}</p>
              <h1>{copy.invite.title}</h1>
              <span>{copy.invite.body}</span>
              <div className="invite-link-row">
                <input value={inviteLink} readOnly />
                <button type="button" onClick={copyInviteLink}>
                  <Link2 size={17} />
                  {copy.invite.copy}
                </button>
              </div>
              <div className="auth-signal-list">
                {copy.invite.signals.map((signal, index) => {
                  const Icon = [UserRound, HeartPulse, Mail][index] ?? UserRound
                  return (
                    <p key={signal}>
                      <Icon size={17} />
                      {signal}
                    </p>
                  )
                })}
              </div>
              <div className="invite-action-grid">
                <button type="button" onClick={copyInviteLink}>
                  <Link2 size={17} />
                  {copy.invite.copyLink}
                </button>
                <button type="button" onClick={createLocalBetaTester}>
                  <UserRound size={17} />
                  {copy.invite.tester}
                </button>
              </div>
              <button className="auth-primary" type="button" onClick={enterApp}>
                {copy.invite.enter}
                <ChevronRight size={19} />
              </button>
            </div>
          ) : null}
        </section>

        <AuthPulseVisual step={step} profile={profile} photos={photos} copy={copy.visual} />
      </section>
    </main>
  )
}

function AuthPulseVisual({ step, profile, photos, copy = authText(viewer.language).visual }) {
  const image = profile.photo || photos[0] || viewer.photo
  const liveLabel =
    step === 'invite'
      ? copy.ready
      : step === 'photos'
        ? copy.photos
        : step === 'profile'
          ? copy.profile
          : copy.pulse
  const signals = copy.signals ?? authCopy.English.visual.signals

  return (
    <aside className="auth-visual-card" aria-label="Animated AI profile pulse">
      <div className="auth-pulse-canvas">
        <span className="auth-orbit one" />
        <span className="auth-orbit two" />
        <span className="auth-orbit three" />
        <div className="auth-wave" />
        <article className="auth-pulse-node values">
          <small>{copy.values}</small>
          <strong>{signals.values}</strong>
        </article>
        <article className="auth-pulse-node attraction">
          <small>{copy.attraction}</small>
          <strong>{signals.attraction}</strong>
        </article>
        <article className="auth-pulse-node rhythm">
          <small>{copy.rhythm}</small>
          <strong>{signals.rhythm}</strong>
        </article>
        <article className="auth-pulse-node intent">
          <small>{copy.boundaries}</small>
          <strong>{signals.boundaries}</strong>
        </article>
        <div className="auth-pulse-core">
          <img src={image} alt="" />
          <span>{copy.core}</span>
          <strong>{liveLabel}</strong>
        </div>
      </div>
      <div className="auth-visual-caption">
        <span>
          <Activity size={17} />
          {copy.caption}
        </span>
        <p>
          {profile.name || 'Your profile'} {copy.text}
        </p>
      </div>
    </aside>
  )
}

function Rail({ activeView, setActiveView, profile }) {
  const language = profile?.language ?? viewer.language
  return (
    <aside className="rail">
      <div className="traffic" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <button className="rail-brand" type="button" onClick={() => setActiveView('discover')} aria-label="MatchPulse Radar">
        <BrandLogo />
      </button>
      <nav className="rail-nav" aria-label="App navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id || (activeView === 'matchProfile' && item.id === 'discover')
          return (
            <button
              className={isActive ? 'active' : ''}
              data-view={item.id}
              aria-label={navLabel(item, language)}
              type="button"
              onClick={() => setActiveView(item.id)}
              key={item.id}
            >
              <Icon size={24} strokeWidth={1.9} />
              <span>{navLabel(item, language)}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function Topbar({ query, setQuery, profile, setActiveView, onNotify }) {
  const copy = appText(profile?.language)
  const plan = isPremiumProfile(profile) ? 'Premium' : copy.betaPlan
  return (
    <header className="mp-topbar">
      <button className="wordmark" type="button" onClick={() => setActiveView('discover')}>
        <BrandLogo showText />
      </button>
      <label className="search-bar">
        <Search size={19} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.search}
        />
        <kbd>⌘K</kbd>
      </label>
      <button className="learning-pill" type="button" onClick={() => setActiveView('profile')}>
        <Activity size={18} />
        <span>{copy.aiLearning}</span>
        <strong>{profile.profileCompletion}%</strong>
      </button>
      <button className="top-icon" type="button" onClick={onNotify} aria-label="Notifications">
        <Bell size={22} />
      </button>
      <button className="account-chip" type="button" onClick={() => setActiveView('settings')} aria-label={copy.nav?.settings ?? 'Settings'}>
        <img src={profile.photo} alt="" />
        <span>
          {profile.name}
          <small>{plan}</small>
        </span>
        <ChevronDown size={18} />
      </button>
    </header>
  )
}

function MatchesView({
  matches: matchList,
  selectedMatch,
  profile,
  sortMode,
  rotateSort,
  advancedFilters,
  activateDeepMatch,
  favorites,
  selectMatch,
  toggleFavorite,
  openModal,
  openMatchProfile,
}) {
  const language = profile?.language ?? viewer.language
  const isDutch = isDutchLanguage(language)
  const translatedSortMode = laneLabel(sortMode, language)
  return (
    <section className="matches-screen">
      <div className="filter-toolbar">
        <button className="deep-chip" type="button" onClick={activateDeepMatch}>
          <HeartPulse size={18} />
          Deep Match
          {Object.values(advancedFilters).some(Boolean) ? <i /> : null}
        </button>
        <div className="toolbar-spacer" />
        <button className="sort-button" type="button" onClick={rotateSort}>
          {translatedSortMode}
          <ChevronDown size={17} />
        </button>
        <button className="filter-button" type="button" onClick={() => openModal({ type: 'filters' })}>
          <SlidersHorizontal size={21} />
        </button>
      </div>

      <div className="match-canvas">
        <section className="results-list" aria-label="Best matches">
          {matchList.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              active={match.id === selectedMatch.id}
              favorite={favorites.includes(match.id)}
              onSelect={() => {
                openMatchProfile(match.id)
              }}
              onActivate={() => selectMatch(match.id)}
              onMessage={() => {
                selectMatch(match.id)
                openModal({ type: 'intro' })
              }}
              onWhy={() => {
                selectMatch(match.id)
                openModal({ type: 'why' })
              }}
              onShare={() => {
                selectMatch(match.id)
                openModal({ type: 'shareDate' })
              }}
              onFavorite={() => toggleFavorite(match.id)}
              language={language}
            />
          ))}
          {!matchList.length ? (
            <div className="empty-state">
              <Sparkles size={26} />
              <h2>{isDutch ? 'Geen matches in deze filter' : 'No matches in this filter'}</h2>
              <p>{isDutch ? 'Probeer een andere voorkeur, zoekterm of Radar-filter.' : 'Try another preference, search term, or Radar filter.'}</p>
            </div>
          ) : null}
        </section>

      </div>
    </section>
  )
}

function MatchRow({
  match,
  active,
  favorite,
  onSelect,
  onActivate,
  onMessage,
  onWhy,
  onShare,
  onFavorite,
  language = viewer.language,
}) {
  const attractionDna = getAttractionDna(match)
  const lane = match.ranking?.lane ?? 'Deep fit'
  const isDutch = isDutchLanguage(language)
  const aiReason = match.ranking?.reason ?? match.shared?.[0] ?? match.about
  const aiAnalysis = match.aiAnalysis ?? {}
  const compatibility = match.compatibility ?? []
  const sharedSignals = match.shared ?? []
  const metricEntries = Object.entries(match.metrics ?? {}).filter(([label]) => label !== 'Uncertainty')
  const analysisCards = [
    {
      label: isDutch ? 'Waarom geselecteerd' : 'Why selected',
      value: aiAnalysis.whySelected ?? aiReason,
    },
    {
      label: isDutch ? 'Langetermijnkans' : 'Long-term chance',
      value: aiAnalysis.longTermChance ?? `${defaultDiscoveryScore(match)}% ${isDutch ? 'matchvertrouwen' : 'match confidence'}.`,
    },
    {
      label: isDutch ? 'Aandachtspunt' : 'Attention point',
      value: aiAnalysis.attentionPoint ?? (isDutch ? 'Check tempo en intentie tijdens het eerste gesprek.' : 'Check pace and intent during the first conversation.'),
    },
  ]

  return (
    <article className={active ? 'match-row active' : 'match-row'}>
      <button className="match-row-main" type="button" onClick={onActivate}>
        <Avatar image={match.portrait} online photoPrivacy={match.photoPrivacy} />
        <span className="row-copy">
          <strong>
            {match.name}: {match.age}
            <ShieldCheck size={18} />
          </strong>
          <small>{displayRole(match.role, language)}</small>
          <em>
            {displayDistance(match.distance, language)}
            <b>{displayStatus(match.status, language)}</b>
            <b>{defaultDiscoveryScore(match)}% Deep Match</b>
          </em>
          <span className="row-tags">
            {match.intent.slice(0, 3).map((tag) => (
              <i key={tag}>{isDutch ? translateRadarTag(tag) : tag}</i>
            ))}
          </span>
          <span className="row-ai-summary">
            <b>{isDutch ? 'AI reden' : 'AI reason'}</b>
            {aiReason}
          </span>
          <span className="row-shared">
            {(match.shared ?? []).slice(0, 2).map((item) => (
              <i key={item}>{item}</i>
            ))}
          </span>
        </span>
        <span className="row-score">
          <strong>{defaultDiscoveryScore(match)}%</strong>
          <em>{laneLabel(lane, language)}</em>
          <small>{attractionDna.mutual}% {isDutch ? 'wederzijds' : 'Mutual pull'}</small>
        </span>
        <ChevronRight size={25} />
      </button>

      <div className="match-row-actions" aria-label={isDutch ? `Acties voor ${match.name}` : `Actions for ${match.name}`}>
        <button type="button" onClick={onMessage}>
          <MessageSquare size={16} />
          {isDutch ? 'Bericht' : 'Message'}
        </button>
        <button type="button" onClick={onSelect}>
          <UserRound size={16} />
          {isDutch ? 'Profiel' : 'Profile'}
        </button>
        <button type="button" onClick={onFavorite}>
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
          {favorite ? (isDutch ? 'Bewaard' : 'Saved') : (isDutch ? 'Opslaan' : 'Save')}
        </button>
        <button type="button" onClick={onShare}>
          <Link2 size={16} />
          {isDutch ? 'Delen' : 'Share'}
        </button>
      </div>

      <div className="match-row-ai-panel">
        <div className="match-ai-panel-head">
          <span>
            <Brain size={16} />
            {isDutch ? 'AI-analyse' : 'AI analysis'}
          </span>
          <strong>{aiAnalysis.trustScore ?? defaultDiscoveryScore(match)}% {isDutch ? 'vertrouwen' : 'trust'}</strong>
          <button type="button" onClick={onWhy}>{isDutch ? 'Waarom?' : 'Why?'}</button>
        </div>

        <div className="match-shared-pills">
          <small>{isDutch ? 'Jullie delen' : 'You share'}</small>
          {sharedSignals.slice(0, 4).map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>

        <div className="match-ai-analysis-grid">
          {analysisCards.map((card) => (
            <span key={card.label}>
              <small>{card.label}</small>
              {card.value}
            </span>
          ))}
        </div>

        <div className="match-ai-metrics-mini">
          {(compatibility.length ? compatibility : metricEntries.map(([label, score]) => ({ label, score, detail: lane }))).slice(0, 4).map((item) => (
            <span key={item.label}>
              <small>{item.label}</small>
              <strong>{item.score}%</strong>
              <em>{item.detail}</em>
            </span>
          ))}
        </div>

        {aiAnalysis.conversationStarters?.length ? (
          <div className="match-conversation-starters">
            <small>{isDutch ? 'Start hiermee' : 'Start with this'}</small>
            {aiAnalysis.conversationStarters.slice(0, 3).map((starter) => (
              <span key={starter}>{starter}</span>
            ))}
          </div>
        ) : null}
      </div>

      <button
        className={favorite ? 'favorite-button active' : 'favorite-button'}
        type="button"
        aria-label={isDutch ? `Bewaar ${match.name}` : `Favorite ${match.name}`}
        onClick={onFavorite}
      >
        <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
      </button>
    </article>
  )
}

function SelectedMatch({ match, memoryNotes, openModal, setActiveView, submitMatchFeedback, language = viewer.language }) {
  const isDutch = language === 'Nederlands'
  const photoPrivacy = normalizePhotoPrivacy(match.photoPrivacy)
  const photoProtected = photoPrivacy !== 'public'

  return (
    <>
      <div className="selected-hero">
        <div className="selected-copy">
          <h1>
            {match.name}: {match.age}
            <ShieldCheck size={22} />
          </h1>
          <p>{displayRole(match.role, language)}</p>
          <span>
            {displayDistance(match.distance, language)}
            <b>{displayStatus(match.status, language)}</b>
          </span>
          <div className="hero-actions">
            <button type="button" onClick={() => openModal({ type: 'intro' })}>
              <Send size={18} />
              {isDutch ? 'Stuur intro' : 'Send intro'}
            </button>
            <button type="button" onClick={() => openModal({ type: 'plan' })}>
              <CalendarDays size={18} />
              {isDutch ? 'Date plannen' : 'Plan date'}
            </button>
            <button type="button" onClick={() => openModal({ type: 'shareDate' })}>
              <ShieldCheck size={18} />
              {isDutch ? 'Deel date' : 'Share date'}
            </button>
            {photoProtected ? (
              <button type="button" onClick={() => openModal({ type: 'photoRequest' })}>
                <UserRound size={18} />
                {isDutch ? 'Vraag foto' : 'Request photo'}
              </button>
            ) : null}
            <button type="button" onClick={() => openModal({ type: 'more' })} aria-label={isDutch ? 'Meer acties' : 'More actions'}>
              <MoreVertical size={20} />
            </button>
          </div>
        </div>
        <MatchPhotoGallery match={match} language={language} />
        <PulseRibbon />
      </div>

      <SharedSignals match={match} language={language} />

      <details className="match-ai-details">
        <summary>
          <Brain size={18} />
          {isDutch ? 'AI Insights' : 'AI Insights'}
          <span>{isDutch ? 'Compatibiliteit, DNA en uitleg' : 'Compatibility, DNA and reasoning'}</span>
        </summary>
        <MetricStrip metrics={match.metrics} language={language} />
        <CompatibilityBreakdown match={match} language={language} />
        <MatchIntelligence match={match} openModal={openModal} language={language} />
        <div className="insight-grid">
          <MemoryCard
            title={isDutch ? 'AI Profielmemory' : 'AI Profile Memory'}
            subtitle={isDutch ? 'Leert' : 'Learning'}
            items={memoryNotes.slice(0, 4)}
            onOpen={() => setActiveView('memory')}
            language={language}
          />
          <NearbyMap match={match} onOpen={() => setActiveView('discover')} isDutch={isDutch} />
        </div>
        <AttractionDnaPanel dna={getAttractionDna(match)} matchName={match.name} language={language} />
      </details>

      <MatchFeedbackPanel
        match={match}
        openModal={openModal}
        submitMatchFeedback={submitMatchFeedback}
        language={language}
      />
    </>
  )
}

function MatchProfileView({ match, memoryNotes, openModal, setActiveView, submitMatchFeedback, profile, returnView = 'discover' }) {
  const language = profile?.language ?? viewer.language
  const isDutch = language === 'Nederlands'
  const backToDeepMatch = returnView === 'matches'
  return (
    <section className="secondary-screen match-profile-screen">
      <div className="match-profile-toolbar">
        <button type="button" onClick={() => setActiveView(returnView)}>
          <ChevronLeft size={18} />
          {backToDeepMatch
            ? (isDutch ? 'Terug naar Deep Match' : 'Back to Deep Match')
            : (isDutch ? 'Terug naar Radar' : 'Back to Radar')}
        </button>
        <button type="button" onClick={() => setActiveView('discover')}>
          <Compass size={18} />
          {isDutch ? 'Open Radar' : 'Open Radar'}
        </button>
      </div>
      <SelectedMatch
        match={match}
        memoryNotes={memoryNotes}
        openModal={openModal}
        setActiveView={setActiveView}
        submitMatchFeedback={submitMatchFeedback}
        language={language}
      />
    </section>
  )
}

function MatchFeedbackPanel({ match, openModal, submitMatchFeedback, language = viewer.language }) {
  const isDutch = language === 'Nederlands'
  const feedbackActions = isDutch
    ? [
        {
          id: 'stronger',
          label: 'Klopt sterk',
          note: 'Deze match-uitleg voelt juist.',
          icon: HeartPulse,
        },
        {
          id: 'general',
          label: 'Interessant',
          note: 'Interessant, maar heeft meer context nodig.',
          icon: Sparkles,
        },
        {
          id: 'weaker',
          label: 'Minder mijn type',
          note: 'Deze match voelt zwakker dan de score.',
          icon: X,
        },
      ]
    : [
        {
          id: 'stronger',
          label: 'Spot on',
          note: 'This match explanation felt accurate.',
          icon: HeartPulse,
        },
        {
          id: 'general',
          label: 'Interesting',
          note: 'This match is interesting but needs more context.',
          icon: Sparkles,
        },
        {
          id: 'weaker',
          label: 'Less my type',
          note: 'This match felt weaker than the score suggested.',
          icon: X,
        },
      ]

  return (
    <section className="match-feedback-panel" aria-label={`Private match feedback for ${match.name}`}>
      <div>
        <span>
          <Brain size={17} />
          {isDutch ? 'Private match-learning' : 'Private match learning'}
        </span>
        <h2>{isDutch ? 'Voelt deze score juist?' : 'Does this score feel right?'}</h2>
        <p>
          {isDutch
            ? 'Een tik leert je persoonlijke model. Andere mensen zien dit nooit.'
            : 'One tap teaches your personal model. Other people never see this feedback.'}
        </p>
      </div>
      <div className="match-feedback-actions">
        {feedbackActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              type="button"
              onClick={() => submitMatchFeedback(action.id, action.note)}
              key={action.id}
            >
              <Icon size={16} />
              {action.label}
            </button>
          )
        })}
        <button type="button" onClick={() => openModal({ type: 'why' })}>
          <Sparkles size={16} />
          {isDutch ? 'Waarom?' : 'Why?'}
        </button>
      </div>
    </section>
  )
}

function DataConsentPrimer({ compact = false, language = viewer.language }) {
  const icons = [Brain, ShieldCheck, UserRound]
  const items = authText(language).consent.map(([title, detail], index) => ({
    id: ['ai', 'private', 'share'][index],
    title,
    detail,
    icon: icons[index],
  }))

  return (
    <section className={compact ? 'consent-primer compact' : 'consent-primer'} aria-label="AI data and privacy">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <article key={item.id}>
            <Icon size={17} />
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
          </article>
        )
      })}
    </section>
  )
}

function MatchPhotoGallery({ match, language = viewer.language }) {
  const isDutch = isDutchLanguage(language)
  const photos = getRadarPhotos(match)
  const [activePhoto, setActivePhoto] = useState(0)
  const photoPrivacy = normalizePhotoPrivacy(match.photoPrivacy)
  const activeImage = photos[activePhoto] ?? photos[0] ?? match.photo
  const person = { ...match, photo: activeImage, language }
  const hasMultiplePhotos = photos.length > 1

  function stepPhoto(direction) {
    if (!hasMultiplePhotos) return
    setActivePhoto((current) => (current + direction + photos.length) % photos.length)
  }

  return (
    <div className="match-photo-gallery" aria-label={isDutch ? `${match.name} foto's` : `${match.name} photos`}>
      <div className="match-photo-main">
        <PrivacyImage person={person} />
        {hasMultiplePhotos ? (
          <>
            <button
              className="match-photo-arrow previous"
              type="button"
              onClick={() => stepPhoto(-1)}
              aria-label={isDutch ? 'Vorige foto' : 'Previous photo'}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="match-photo-arrow next"
              type="button"
              onClick={() => stepPhoto(1)}
              aria-label={isDutch ? 'Volgende foto' : 'Next photo'}
            >
              <ChevronRight size={22} />
            </button>
            <span className="match-photo-count">{activePhoto + 1} / {photos.length}</span>
          </>
        ) : null}
        <span className="photo-consent-badge">
          <ShieldCheck size={15} />
          {photoPrivacy === 'public'
            ? (isDutch ? 'Zichtbaar met controle' : 'Visible with controls')
            : photoPrivacy === 'blurred'
              ? (isDutch ? 'Vervaagd tot chat' : 'Blurred until chat')
            : (isDutch ? 'Alleen op verzoek' : 'By request only')}
        </span>
      </div>
    </div>
  )
}

function Segmented({ value, options, onChange, labels = {} }) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          type="button"
          className={option === value ? 'active' : ''}
          onClick={() => onChange(option)}
          key={option}
        >
          {labels[option] ?? option}
        </button>
      ))}
    </div>
  )
}

function CompatibilityBreakdown({ match, language = viewer.language }) {
  const isDutch = isDutchLanguage(language)
  const dna = getAttractionDna(match)
  const topAxis = dnaAxisCopy(dna.axes?.[0] ?? fallbackAttractionAxes[0], language)
  const strongestShared = displayMatchText(match.shared[0] ?? '', language)
  const rows = [
    {
      id: 'values',
      label: metricLabel('Values', language),
      score: match.metrics.Values,
      detail: isDutch
        ? `Gedeelde waarden zitten vooral in: ${strongestShared.toLowerCase()}`
        : `Shared values show up as: ${strongestShared.toLowerCase()}`,
    },
    {
      id: 'attraction',
      label: metricLabel('Attraction', language),
      score: match.metrics.Attraction,
      detail: isDutch
        ? `${topAxis.label} is een stijl- en energiesignaal, geen beschermd kenmerk.`
        : `${topAxis.label} is a style and energy signal, not a protected-class signal.`,
    },
    {
      id: 'lifestyle',
      label: metricLabel('Lifestyle', language),
      score: match.metrics.Lifestyle,
      detail: isDutch
        ? `Tempo en omgeving lijken te passen bij ${displayDistance(match.distance, language).toLowerCase()} en ${displayRole(match.role, language).toLowerCase()}.`
        : `Pace and context fit around ${displayDistance(match.distance, language).toLowerCase()} and ${displayRole(match.role, language).toLowerCase()}.`,
    },
    {
      id: 'intent',
      label: metricLabel('Intent', language),
      score: match.metrics.Intent,
      detail: isDutch
        ? `Intent-tags: ${match.intent.map((tag) => translateRadarTag(tag)).join(', ')}.`
        : `Intent tags: ${match.intent.join(', ')}.`,
    },
    {
      id: 'uncertainty',
      label: metricLabel('Uncertainty', language),
      score: match.metrics.Uncertainty,
      detail: isDutch
        ? 'Vraag eerst naar timing, communicatiestijl en comfort voordat je te veel plant.'
        : 'Ask about timing, communication style and comfort before planning too much.',
      inverted: true,
    },
  ]

  return (
    <section className="compatibility-breakdown" aria-label={`Compatibility breakdown for ${match.name}`}>
      <div className="compatibility-head">
        <span>
          <HeartPulse size={18} />
          {isDutch ? 'Compatibility breakdown' : 'Compatibility breakdown'}
        </span>
        <strong>{defaultDiscoveryScore(match)}%</strong>
      </div>
      <div className="compatibility-grid">
        {rows.map((row) => (
          <article className={row.inverted ? 'uncertainty' : ''} key={row.id}>
            <div>
              <strong>{row.label}</strong>
              <em>{row.score}%</em>
            </div>
            <i>
              <b style={{ width: `${row.inverted ? 100 - row.score : row.score}%` }} />
            </i>
            <p>{row.detail}</p>
          </article>
        ))}
      </div>
      <div className="compatibility-privacy-note">
        <ShieldCheck size={16} />
        <span>
          {isDutch
            ? 'Geen ras/ethniciteit matching. Uiterlijk blijft beperkt tot veilige signalen zoals stijl, uitstraling, energie, verzorging, vibe en foto-interactie.'
            : 'No race or ethnicity matching. Appearance stays limited to safer signals like style, presence, energy, grooming, vibe and photo interaction.'}
        </span>
      </div>
    </section>
  )
}

function MetricStrip({ metrics, language = viewer.language }) {
  return (
    <div className="metric-strip">
      {Object.entries(metrics).map(([label, value]) => (
        <section key={label}>
          <span>{metricLabel(label, language)}</span>
          <strong>{value}%</strong>
          <i>
            <b style={{ width: `${value}%` }} />
          </i>
        </section>
      ))}
    </div>
  )
}

function AttractionDnaPanel({ dna, matchName = 'this match', compact = false, language = viewer.language }) {
  const isDutch = isDutchLanguage(language)
  const topAxes = (dna.axes ?? []).slice(0, compact ? 3 : 5).map((axis) => dnaAxisCopy(axis, language))

  return (
    <section className={compact ? 'attraction-dna-panel compact' : 'attraction-dna-panel'}>
      <div className="attraction-dna-head">
        <div>
          <span>{isDutch ? 'Aantrekkings-DNA' : 'Attraction DNA'}</span>
          <h2>{isDutch ? `Wederzijdse aantrekking met ${matchName}` : `Mutual pull with ${matchName}`}</h2>
        </div>
        <strong>{dna.mutual}%</strong>
      </div>
      <div className="dna-score-grid">
        <p>
          <small>{isDutch ? 'Jij naar hen' : 'You to them'}</small>
          <b>{dna.visualAffinity}%</b>
        </p>
        <p>
          <small>{isDutch ? 'Zij naar jou' : 'Them to you'}</small>
          <b>{dna.reciprocalPull}%</b>
        </p>
        <p>
          <small>{isDutch ? 'Modelzekerheid' : 'Model confidence'}</small>
          <b>{dna.confidence}%</b>
        </p>
      </div>
      <div className="dna-axis-list">
        {topAxes.map((axis) => (
          <article key={axis.id}>
            <span>
              <strong>{axis.label}</strong>
              <small>{axis.detail}</small>
            </span>
            <i>
              <b style={{ width: `${axis.strength}%` }} />
            </i>
            <em>{axis.strength}%</em>
          </article>
        ))}
      </div>
      <div className="dna-privacy-note">
        <ShieldCheck size={16} />
        <span>
          {isDutch
            ? 'Prive latent model. Gebruikt voor matchkwaliteit, niet als publieke filter.'
            : 'Private latent model. Used for matching quality, not exposed as public filters.'}
        </span>
      </div>
    </section>
  )
}

function MemoryCard({ title, subtitle, items, onOpen, language = viewer.language }) {
  const memories = normalizeMemoryNotes(items)
  const isDutch = isDutchLanguage(language)

  return (
    <section className="memory-card">
      <div className="panel-title">
        <WandSparkles size={20} />
        <div>
          <h2>{title}</h2>
          {subtitle ? <small>{subtitle}</small> : null}
        </div>
      </div>
      <div className="memory-list">
        {memories.map((item) => (
          <p key={item.id}>
            <i />
            <span>
              {displayMatchText(item.text, language)}
              <small>{memoryVisibilityCopy(item.visibility, language).label}</small>
            </span>
          </p>
        ))}
      </div>
      {onOpen ? (
        <button className="panel-button" type="button" onClick={onOpen}>
          {isDutch ? 'Bekijk volledige memory' : 'View full memory'}
        </button>
      ) : null}
    </section>
  )
}

function NearbyMap({ match, onOpen, isDutch = false }) {
  return (
    <section className="nearby-card">
      <div className="panel-title inline">
        <Navigation size={20} />
        <h2>{isDutch ? 'Dichtbij vanavond' : 'Nearby tonight'}</h2>
        <button type="button" onClick={onOpen}>{isDutch ? 'Bekijk alles' : 'See all'}</button>
      </div>
      <div className="map-canvas">
        {[...nearby, match].map((person, index) => (
          <button
            className={person.id === match.id ? 'map-face selected' : 'map-face'}
            style={{
              left: `${person.map?.x ?? 19 + index * 18}%`,
              top: `${person.map?.y ?? 28 + (index % 2) * 34}%`,
            }}
            type="button"
            key={person.id}
          >
            <img src={person.portrait ?? person.photo} alt="" />
          </button>
        ))}
      </div>
    </section>
  )
}

function SharedSignals({ match, language = viewer.language }) {
  const isDutch = isDutchLanguage(language)
  return (
    <section className="shared-card">
      <div className="panel-title inline">
        <Sparkles size={19} />
        <h2>{isDutch ? 'Wat jullie delen' : 'What you share'}</h2>
        <strong>{match.score}% signal</strong>
      </div>
      <div className="shared-grid">
        {match.shared.map((signal) => (
          <p key={signal}>
            <i />
            {displayMatchText(signal, language)}
          </p>
        ))}
      </div>
    </section>
  )
}

function buildMatchDateIdeas(match, language = viewer.language) {
  const isDutch = isDutchLanguage(language)
  const roleText = `${match.role} ${match.about}`.toLowerCase()
  const creative = includesAny(roleText, ['design', 'architect', 'studio', 'gallery', 'art'])
  const active = includesAny(roleText, ['walk', 'bike', 'travel', 'active'])

  return [
    {
      id: 'calm-coffee',
      title: isDutch ? 'Rustige koffie' : 'Calm coffee',
      detail: isDutch
        ? `Korte eerste ontmoeting in ${match.city}, met ruimte om makkelijk af te ronden.`
        : `A short first meet in ${match.city}, with an easy exit if the rhythm is not there.`,
      place: isDutch ? `Rustige koffiebar in ${match.city}` : `Quiet coffee bar in ${match.city}`,
      time: isDutch ? 'Deze week 19:00' : 'This week 19:00',
    },
    {
      id: creative ? 'gallery-walk' : active ? 'walk-loop' : 'warm-light',
      title: creative
        ? (isDutch ? 'Galerie + wandeling' : 'Gallery + walk')
        : active
          ? (isDutch ? 'Korte wandeling' : 'Short walk')
          : (isDutch ? 'Warme bar' : 'Warm bar'),
      detail: creative
        ? (isDutch ? 'Iets visueels geeft vanzelf gesprek zonder druk.' : 'Something visual creates conversation without forcing it.')
        : active
          ? (isDutch ? 'Beweging maakt het lichter dan tegenover elkaar zitten.' : 'Movement keeps it lighter than sitting face to face.')
          : (isDutch ? 'Goed licht, duidelijk plan, geen late-night druk.' : 'Good lighting, clear plan, no late-night pressure.'),
      place: creative
        ? (isDutch ? 'Kleine galerie of designplek' : 'Small gallery or design store')
        : active
          ? (isDutch ? 'Parklus met koffie erna' : 'Park loop with coffee after')
          : (isDutch ? 'Bar met rustig hoekje' : 'Bar with a quiet corner'),
      time: isDutch ? 'Weekend namiddag' : 'Weekend afternoon',
    },
    {
      id: 'honest-question',
      title: isDutch ? 'Vraag-date' : 'Question date',
      detail: isDutch
        ? 'Elk brengt een eerlijke vraag over tempo, intentie of wat veilig voelt.'
        : 'Each person brings one honest question about pace, intent or what feels safe.',
      place: isDutch ? 'Lage-druk plek dichtbij' : 'Low-pressure nearby spot',
      time: isDutch ? 'Na werk, 45 minuten' : 'After work, 45 minutes',
    },
  ]
}

function buildMatchIntroOpeners(match, language = viewer.language) {
  const isDutch = isDutchLanguage(language)
  const displayAbout = displayMatchText(match.about, language)
  const sharedSignal = cleanSharedSignalText(displayMatchText(match.shared[0] ?? '', language))

  return [
    {
      id: 'specific',
      label: isDutch ? 'Specifiek' : 'Specific',
      text: isDutch
        ? `Hey ${match.name}, je profiel bleef hangen door dit: ${displayAbout.toLowerCase()} Wat maakt een eerste date voor jou natuurlijk?`
        : `Hey ${match.name}, your profile stayed with me because of this: ${match.about.toLowerCase()} What makes a first date feel natural for you?`,
    },
    {
      id: 'shared',
      label: isDutch ? 'Gedeeld punt' : 'Shared point',
      text: isDutch
        ? `Ik merkte dat ${sharedSignal.toLowerCase()}. Zin om dat rustig te ontdekken bij koffie?`
        : `I noticed that ${sharedSignal.toLowerCase()}. Want to explore that over coffee, low pressure?`,
    },
    {
      id: 'consent',
      label: isDutch ? 'Respectvol' : 'Respectful',
      text: isDutch
        ? `Je energie voelt bewust. Als je ervoor openstaat: wat is een fijne manier om elkaar eerst rustig te leren kennen?`
        : `Your energy feels intentional. If you are open to it, what is a comfortable way to get to know each other first?`,
    },
  ]
}

function MatchIntelligence({ match, openModal, language = viewer.language }) {
  const isDutch = isDutchLanguage(language)
  const attractionDna = getAttractionDna(match)
  const ranking = match.ranking ?? {
    lane: 'Deep fit',
    reason: 'Ranked by compatibility, attraction DNA and current private memory.',
  }
  const strongestMetric = Object.entries(match.metrics)
    .filter(([label]) => label !== 'Uncertainty')
    .sort((a, b) => b[1] - a[1])[0]
  const uncertainty = match.metrics.Uncertainty
  const dateIdeas = buildMatchDateIdeas(match, language)
  const openers = buildMatchIntroOpeners(match, language)
  const metric = strongestMetric?.[0] ?? 'Values'
  const privacyNotes = isDutch
    ? [
        'Private memory wordt niet letterlijk gedeeld.',
        'Foto-toegang blijft zichtbaar, vervaagd of op verzoek.',
        'Geen scores op ras/ethniciteit of andere beschermde klasse.',
        'Date delen kopieert enkel praktische info, geen AI-notities.',
      ]
    : [
        'Private memory is not shared as raw text.',
        'Photo access stays visible, blurred, or by request.',
        'No scoring on race, ethnicity, or other protected classes.',
        'Share date copies practical details, not AI notes.',
      ]

  return (
    <section className="match-intelligence" aria-label={`AI match intelligence for ${match.name}`}>
      <article className="match-intel-panel">
        <div className="panel-title inline">
          <Brain size={19} />
          <h2>{isDutch ? 'AI-uitleg' : 'AI reasoning'}</h2>
          <strong>{isDutch ? `${metricLabel(metric, language)} eerst` : `${metric} led`}</strong>
        </div>
        <p>
          {isDutch
            ? `MatchPulse ziet het sterkste signaal in ${metricLabel(metric, language).toLowerCase()}. Het attraction-DNA leest ${attractionDna.mutual}% wederzijdse aantrekking wanneer je private visuele smaak wordt vergeleken met de energie van ${match.name}. Dit profiel zit in de lane ${laneLabel(ranking.lane, language).toLowerCase()}.`
            : `MatchPulse sees the strongest signal in ${metric.toLowerCase()}. The attraction DNA model reads ${attractionDna.mutual}% mutual pull when your private visual taste is compared with ${match.name}'s presence and likely reciprocal pattern. This profile is in the ${ranking.lane.toLowerCase()} lane: ${ranking.reason}`}
        </p>
        <button type="button" onClick={() => openModal({ type: 'intro' })}>
          <Send size={16} />
          {isDutch ? 'Maak intro' : 'Draft intro'}
        </button>
      </article>

      <article className="match-intel-panel">
        <div className="panel-title inline">
          <CalendarDays size={19} />
          <h2>{isDutch ? 'Date-ideeen' : 'Date ideas'}</h2>
          <strong>{displayDistance(match.distance, language)}</strong>
        </div>
        <div className="date-idea-stack">
          {dateIdeas.map((idea) => (
            <button
              type="button"
              onClick={() => openModal({ type: 'plan', place: idea.place, time: idea.time })}
              key={idea.id}
            >
              <span>
                <strong>{idea.title}</strong>
                <small>{idea.detail}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </article>

      <article className="match-intel-panel">
        <div className="panel-title inline">
          <MessageSquare size={19} />
          <h2>{isDutch ? 'Openers' : 'Openers'}</h2>
          <strong>{isDutch ? 'Mens eerst' : 'Human first'}</strong>
        </div>
        <div className="opener-stack">
          {openers.map((opener) => (
            <button type="button" onClick={() => openModal({ type: 'intro', seed: opener.text })} key={opener.id}>
              <strong>{opener.label}</strong>
              <span>{opener.text}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="match-intel-panel uncertainty-panel">
        <div className="panel-title inline">
          <Activity size={19} />
          <h2>{isDutch ? 'Onzekerheid' : 'Uncertainty'}</h2>
          <strong>{uncertainty}%</strong>
        </div>
        <div className="uncertainty-meter">
          <i style={{ width: `${Math.min(100, uncertainty)}%` }} />
        </div>
        <p>
          {isDutch
            ? 'Vraag naar timing en communicatiestijl voor je te veel plant. Het doel is ritme leren, niet een perfecte score forceren.'
            : 'Ask about timing and communication style before planning too much. The goal is to learn rhythm, not to force a perfect score.'}
        </p>
      </article>

      <article className="match-intel-panel privacy-respect-panel">
        <div className="panel-title inline">
          <ShieldCheck size={19} />
          <h2>{isDutch ? 'Privacy-respect' : 'Privacy respect'}</h2>
          <strong>{isDutch ? 'Aan' : 'On'}</strong>
        </div>
        <div className="privacy-respect-list">
          {privacyNotes.map((note) => (
            <p key={note}>
              <i />
              {note}
            </p>
          ))}
        </div>
      </article>
    </section>
  )
}

function getRadarPhotos(match) {
  const ownPhotos = Array.isArray(match.photos) && match.photos.length ? match.photos : [match.photo, match.portrait]
  return [...new Set(ownPhotos.filter(Boolean))].slice(0, 5)
}

function getRadarTags(match) {
  const laneTag = match.ranking?.lane ?? ''
  const roleTags = [
    laneTag,
    match.role.includes('Design') || match.role.includes('Architect') ? 'Design' : '',
    match.about.includes('walk') || match.about.includes('bike') ? 'Walks' : '',
    match.about.includes('travel') ? 'Travel' : '',
    normalizePhotoPrivacy(match.photoPrivacy) === 'private' ? 'Photo private' : '',
    normalizePhotoPrivacy(match.photoPrivacy) === 'blurred' ? 'Blur first' : '',
    Number.parseFloat(match.distance) <= 3 ? 'Close' : '',
  ].filter(Boolean)

  return [...new Set([...match.intent, ...roleTags])].slice(0, 5)
}

function DiscoverView({
  matches: matchList,
  selectedMatch,
  profile,
  openMatchProfile,
  openMatchMessages,
  openPhotoRequest,
  recordPhotoAttention,
}) {
  const [photoIndexes, setPhotoIndexes] = useState({})
  const radarGridRef = useRef(null)
  const [radarFilter, setRadarFilter] = useState(() => safeGetLocalStorageItem('matchpulse-radar-filter') || 'all')
  const activeRadarFilter =
    radarFilterOptions.find((filter) => filter.id === radarFilter) ?? radarFilterOptions[0]
  const radarFilterCounts = radarFilterOptions.reduce((counts, filter) => ({
    ...counts,
    [filter.id]: matchList.filter((match, index) => filter.test(match, index)).length,
  }), {})
  const radarFilteredMatches = matchList.filter((match, index) => activeRadarFilter.test(match, index))
  const radarMatches = radarFilteredMatches
  const isDutch = profile?.language === 'Nederlands'
  const radarCopy = isDutch
    ? {
        kicker: 'Radar dichtbij',
        title: 'Mensen in je buurt',
        body: 'Directe nearby grid met vierkante foto’s, snelle previews en profielen naast elkaar.',
        allProfiles: 'profielen in Radar',
        filteredProfiles: 'profielen',
        location: 'Locatie vervaagd',
      }
    : {
        kicker: 'Radar nearby',
        title: 'People around you',
        body: 'A visual nearby grid with fuzzed location, profile tags, and quick photo previews.',
        allProfiles: 'profiles in Radar',
        filteredProfiles: 'profiles',
        location: 'Location fuzzed',
      }
  const radarFilterLabel = (filter) => {
    if (!isDutch) return filter.label
    return {
      all: 'Alles',
      online: 'Online',
      fresh: 'Nieuw',
      tonight: 'Vanavond',
      top: 'Topmatch',
      lowRisk: 'Zekerder',
      low: 'Zekerder',
    }[filter.id] ?? filter.label
  }

  function setRadarPhoto(matchId, photoIndex) {
    setPhotoIndexes((current) => ({ ...current, [matchId]: photoIndex }))
    const match = matchList.find((item) => item.id === matchId)
    if (match) recordPhotoAttention(match, photoIndex)
  }

  function openMessage(matchId) {
    openMatchMessages(matchId)
  }

  function updateRadarFilter(filterId) {
    setRadarFilter(filterId)
    safeSetLocalStorageItem('matchpulse-radar-filter', filterId)
  }

  useEffect(() => {
    const savedScroll = Number.parseInt(safeGetLocalStorageItem('matchpulse-radar-scroll'), 10)
    if (!Number.isNaN(savedScroll) && radarGridRef.current) {
      radarGridRef.current.scrollTop = savedScroll
    }
  }, [])

  return (
    <section className="secondary-screen">
      <ScreenHeading
        kicker={radarCopy.kicker}
        title={radarCopy.title}
        body={radarCopy.body}
      />
      <div className="discover-grid radar-grid-only">
        <section className="radar-grid-shell radar-grid-shell-full">
          <div className="radar-grid-toolbar">
            <span>
              <strong>{radarFilteredMatches.length}</strong>
              {' '}
              {activeRadarFilter.id === 'all'
                ? radarCopy.allProfiles
                : `${radarFilterLabel(activeRadarFilter).toLowerCase()} ${radarCopy.filteredProfiles}`}
            </span>
            <em>{radarCopy.location}</em>
          </div>
          <div className="radar-filter-strip" aria-label="Radar filters">
            {radarFilterOptions.map((filter) => (
              <button
                className={filter.id === radarFilter ? 'active' : ''}
                type="button"
                onClick={() => updateRadarFilter(filter.id)}
                key={filter.id}
              >
                {filter.id === 'tonight' ? <Flame size={14} /> : null}
                {radarFilterLabel(filter)}
                <small>{radarFilterCounts[filter.id]}</small>
              </button>
            ))}
          </div>
          <div
            className="radar-grid"
            aria-label="Nearby people grid"
            ref={radarGridRef}
            onScroll={(event) => safeSetLocalStorageItem('matchpulse-radar-scroll', String(event.currentTarget.scrollTop))}
          >
            {radarMatches.map((match) => (
              <RadarPersonCard
                match={match}
                active={match.id === selectedMatch.id}
                photoIndex={photoIndexes[match.id] ?? 0}
                setPhotoIndex={setRadarPhoto}
                openProfile={openMatchProfile}
                openMessage={openMessage}
                requestPhoto={openPhotoRequest}
                isDutch={isDutch}
                key={match.id}
              />
            ))}
            {!radarMatches.length ? (
              <p className="radar-more">
                {isDutch
                  ? 'Nog geen profielen in deze Radar-weergave. Probeer Alles, Online of Topmatch.'
                  : 'No profiles in this Radar view yet. Try All, Online, or Top match.'}
              </p>
            ) : null}
            {radarFilteredMatches.length > radarMatches.length ? (
              <p className="radar-more">
                {isDutch
                  ? `Eerste ${radarMatches.length} mensen in deze Radar-weergave.`
                  : `Showing the first ${radarMatches.length} people in this Radar view.`}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  )
}

function RadarPersonCard({ match, active, photoIndex, setPhotoIndex, openProfile, openMessage, requestPhoto, isDutch = false }) {
  const photos = getRadarPhotos(match)
  const safePhotoIndex = Math.min(Math.max(photoIndex, 0), Math.max(photos.length - 1, 0))
  const currentPhoto = photos[safePhotoIndex] ?? photos[0]
  const tags = getRadarTags(match)
  const hasMultiplePhotos = photos.length > 1

  function stepPhoto(direction) {
    if (!hasMultiplePhotos) return
    setPhotoIndex(match.id, (safePhotoIndex + direction + photos.length) % photos.length)
  }

  return (
    <article className={active ? 'radar-person-card active' : 'radar-person-card'}>
      <div className="radar-photo-frame">
        <button className="radar-photo-button" type="button" onClick={() => openProfile(match.id)}>
          <PrivacyImage person={{ ...match, photo: currentPhoto, language: isDutch ? 'Nederlands' : 'English' }} />
          <span className="radar-photo-overlay">
            <em>{displayDistance(match.distance, isDutch ? 'Nederlands' : 'English')}</em>
            <strong>{defaultDiscoveryScore(match)}%</strong>
          </span>
        </button>
        {hasMultiplePhotos ? (
          <>
            <button
              className="radar-photo-arrow previous"
              type="button"
              onClick={() => stepPhoto(-1)}
              aria-label={isDutch ? `Vorige foto van ${match.name}` : `Previous photo for ${match.name}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="radar-photo-arrow next"
              type="button"
              onClick={() => stepPhoto(1)}
              aria-label={isDutch ? `Volgende foto van ${match.name}` : `Next photo for ${match.name}`}
            >
              <ChevronRight size={18} />
            </button>
            <span className="radar-photo-count">{safePhotoIndex + 1} / {photos.length}</span>
          </>
        ) : null}
      </div>

      <div className="radar-photo-dots" aria-hidden="true">
        {photos.map((photo, index) => (
          <button
            className={index === safePhotoIndex ? 'active' : ''}
            type="button"
            onClick={() => setPhotoIndex(match.id, index)}
            tabIndex={-1}
            key={photo}
          >
            {normalizePhotoPrivacy(match.photoPrivacy) === 'public' ? (
              <img src={photo} alt="" loading="lazy" decoding="async" />
            ) : (
              <span className="radar-private-dot" />
            )}
          </button>
        ))}
      </div>

      <div className="radar-person-copy">
        <span>
          <strong>{match.name}, {match.age}</strong>
          <i>{displayStatus(match.status, isDutch ? 'Nederlands' : 'English')}</i>
        </span>
        <small>{displayRole(match.role, isDutch ? 'Nederlands' : 'English')}</small>
      </div>

      <p className="radar-shared-line">
        <Brain size={14} />
        <span>{isDutch ? 'Wat jullie delen' : 'What you share'}</span>
        <strong>{match.shared?.[0] ?? match.about}</strong>
      </p>

      <div className="radar-tags">
        {tags.map((tag) => (
          <RadarTag tag={tag} isDutch={isDutch} key={tag} />
        ))}
      </div>

      <div className="radar-card-actions">
        <button type="button" onClick={() => openMessage(match.id)}>
          <MessageSquare size={15} />
          {isDutch ? 'Bericht' : 'Message'}
        </button>
        {normalizePhotoPrivacy(match.photoPrivacy) === 'private' ? (
          <button type="button" onClick={() => requestPhoto(match.id)}>
            <UserRound size={15} />
            {isDutch ? 'Vraag foto' : 'Ask photo'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openProfile(match.id)}
            aria-label={isDutch ? `Bekijk profiel van ${match.name}` : `View ${match.name} profile`}
          >
            <UserRound size={15} />
            {isDutch ? 'Profiel' : 'Profile'}
          </button>
        )}
      </div>
    </article>
  )
}

function RadarTag({ tag, isDutch = false }) {
  if (tag === 'Tonight') {
    return (
      <span className="tonight-tag">
        <Flame size={12} />
        {isDutch ? 'Vanavond' : 'Tonight'}
      </span>
    )
  }

  return <span>{isDutch ? translateRadarTag(tag) : tag}</span>
}

function translateRadarTag(tag) {
  return {
    New: 'Nieuw',
    Serious: 'Serieus',
    Casual: 'Vrijblijvend',
    Growth: 'Groei',
    'Deep conversations': 'Diepe gesprekken',
    'Values aligned': 'Waarden matchen',
    'Calm pace': 'Rustig tempo',
    'Coffee first': 'Eerst koffie',
    Travel: 'Reizen',
    'Clear communication': 'Heldere communicatie',
    'Fresh angle': 'Nieuwe invalshoek',
    Designs: 'Design',
    Design: 'Design',
    'Mutual pull': 'Wederzijdse pull',
    'Nearby spark': 'Dichtbij spark',
    Building: 'Bouwen',
    Spoken: 'Zachte communicatie',
    Visually: 'Visuele stijl',
    Sharp: 'Scherp',
    Finding: 'Vindingrijk',
    Walks: 'Wandelen',
    'Photo private': 'Foto prive',
    'Blur first': 'Eerst vervaagd',
    'Low uncertainty': 'Zekerder',
    Close: 'Dichtbij',
  }[tag] ?? tag
}

function PlayView({ matches: matchList, playIndex, favorites, onChoice, onOpenMatch, onReset }) {
  const current = matchList[playIndex]
  const nextMatches = matchList.slice(playIndex + 1, playIndex + 5)

  if (!matchList.length) {
    return (
      <section className="secondary-screen play-screen">
        <ScreenHeading
          kicker="Play"
          title="No active profiles in this stack"
          body="Restore hidden matches or loosen filters to bring people back."
        />
      </section>
    )
  }

  if (!current) {
    return (
      <section className="secondary-screen play-screen">
        <ScreenHeading
          kicker="Play"
          title="Stack complete"
          body="Your quick feedback is now part of the matching model."
        />
        <div className="play-complete">
          <HeartPulse size={34} />
          <strong>{matchList.length} profiles reviewed</strong>
          <button type="button" onClick={onReset}>Replay stack</button>
        </div>
      </section>
    )
  }

  return (
    <section className="secondary-screen play-screen">
      <ScreenHeading
        kicker="Play"
        title="Quick chemistry stack"
        body="Fast reactions teach MatchPulse what the score alone cannot see."
      />

      <div className="play-layout">
        <article className="play-profile">
          <PrivacyImage person={current} />
          <div className="play-profile-copy">
            <span>{playIndex + 1} / {matchList.length}</span>
            <h2>
              {current.name}: {current.age}
              <ShieldCheck size={21} />
            </h2>
            <p>{current.role} · {current.distance}</p>
            <div className="row-tags">
              {current.intent.slice(0, 3).map((tag) => (
                <i key={tag}>{tag}</i>
              ))}
            </div>
          </div>
          <strong className="play-score">{current.score}%</strong>
        </article>

        <section className="play-panel">
          <div className="panel-title inline">
            <Sparkles size={20} />
            <h2>Why this is in your stack</h2>
          </div>
          <div className="play-signals">
            {current.shared.slice(0, 3).map((signal) => (
              <p key={signal}>
                <i />
                {signal}
              </p>
            ))}
          </div>
          <MetricStrip metrics={current.metrics} />
        </section>

        <section className="play-actions" aria-label="Quick match actions">
          <button type="button" onClick={() => onChoice(current, 'pass')}>
            <X size={21} />
            Pass
          </button>
          <button type="button" onClick={() => onChoice(current, 'maybe')}>
            <Sparkles size={21} />
            Maybe
          </button>
          <button
            className={favorites.includes(current.id) ? 'active' : ''}
            type="button"
            onClick={() => onChoice(current, 'spark')}
          >
            <Heart size={21} fill={favorites.includes(current.id) ? 'currentColor' : 'none'} />
            Spark
          </button>
          <button type="button" onClick={() => onOpenMatch(current.id)}>
            <UserRound size={21} />
            Full profile
          </button>
        </section>

        <section className="play-next">
          <div className="panel-title inline">
            <Activity size={20} />
            <h2>Next up</h2>
          </div>
          {nextMatches.length ? (
            nextMatches.map((match) => (
              <button type="button" onClick={() => onOpenMatch(match.id)} key={match.id}>
                <Avatar image={match.portrait} online />
                <span>
                  <strong>{match.name}</strong>
                  <small>{match.score}% · {match.distance}</small>
                </span>
              </button>
            ))
          ) : (
            <p>No more profiles after this one.</p>
          )}
        </section>
      </div>
    </section>
  )
}

function MessagesView({
  matches: matchList,
  selectedMatch,
  selectMatch,
  messages,
  profile,
  plannedDates = [],
  sendDirectMessage,
  acceptMessageRequest,
  openModal,
}) {
  const messageCopy = {
    kicker: 'Messages',
    title: 'Chats and message requests',
    body: 'Requests stay separate until accepted. Once a chat opens, MatchPulse can explain the shared neurons between you.',
    inbox: 'Inbox',
    chats: 'Chats',
    requests: 'Requests',
    openChat: 'open chat',
    wantsToChat: 'wants to chat',
    requestLane: 'request lane',
    new: 'New',
    sent: 'Sent',
    noChats: 'No accepted chats yet. Open Requests or send a request from Radar.',
    noRequests: 'No pending requests. Start with someone from Radar.',
    accept: 'Accept',
    block: 'Block',
    draftReply: 'Draft reply',
    draftRequest: 'Draft request',
    requestQuality: 'Request quality',
    dailyRequests: 'Daily requests',
    learnedFromChat: 'Learned from chat',
    ready: 'ready',
    lockedUntilAccepted: 'Locked until accepted',
    premiumPower: 'Premium request power',
    freePower: 'Free request power',
    leftToday: 'left today',
    premiumDetail: `${premiumMessageRequestLimit} daily requests plus deeper shared-neuron context.`,
    freeDetail: `${freeMessageRequestLimit} daily requests. Premium unlocks ${premiumMessageRequestLimit}/day and pro match tools.`,
    empty: 'No request yet. Pick an AI suggestion or write something specific and respectful.',
    requestLabel: 'Request',
    sendPlaceholder: 'Write a warm, honest message...',
    requestPlaceholder: 'Write a respectful message request...',
    acceptPlaceholder: 'Accept the request to reply...',
    limitPlaceholder: 'Daily request limit reached...',
    planDate: 'Plan date',
    plannedDates: 'Date plans',
    checks: ['Specific to profile', 'Invites a reply', 'Warm but clear'],
    ...appText(profile?.language).messages,
  }
  const isDutch = profile?.language === 'Nederlands'
  const [draft, setDraft] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const thread = messages.filter((message) => message.matchId === selectedMatch.id)
  const selectedStatus = threadStatus(messages, selectedMatch.id)
  const [messageTab, setMessageTab] = useState(() => (selectedStatus === 'accepted' ? 'chats' : 'requests'))
  const incomingRequest = selectedStatus === 'request' && thread.some(
    (message) => normalizeMessageStatus(message) === 'request' && message.from === 'them',
  )
  const outgoingRequest = selectedStatus === 'request' && thread.some(
    (message) => normalizeMessageStatus(message) === 'request' && message.from === 'you',
  )
  const requestUsage = messageRequestUsage(messages, profile)
  const requestLocked = selectedStatus !== 'accepted' && requestUsage.remaining <= 0
  const composeDisabled = incomingRequest || requestLocked
  const selectedPlans = plannedDates.filter((plan) => plan.matchId === selectedMatch.id)
  const messageMatchIds = new Set(messages.map((message) => message.matchId))
  const threadMatches = [
    ...matchList.filter((match) => messageMatchIds.has(match.id)),
    ...matchList.filter((match) => !messageMatchIds.has(match.id)).slice(0, 12),
  ]
  const threads = threadMatches.map((match) => {
    const items = messages.filter((message) => message.matchId === match.id)
    const last = items.at(-1)
    const status = threadStatus(messages, match.id)
    const requestFromThem = status === 'request' && items.some(
      (message) => normalizeMessageStatus(message) === 'request' && message.from === 'them',
    )
    return {
      match,
      status,
      count: items.length,
      preview:
        last?.text ??
        (status === 'empty'
          ? 'Send a respectful request.'
          : match.shared[0] ?? 'No messages yet.'),
      fromYou: last?.from === 'you',
      requestFromThem,
    }
  })
  const chatThreads = threads.filter((item) => item.status === 'accepted')
  const requestThreads = threads.filter((item) => item.status === 'request')
  const selectedSummary = threads.find((item) => item.match.id === selectedMatch.id)
  const visibleThreads = messageTab === 'chats' ? chatThreads : requestThreads
  const sidebarThreads =
    messageTab === 'requests' &&
    selectedSummary &&
    selectedSummary.status === 'request' &&
    !visibleThreads.some((item) => item.match.id === selectedSummary.match.id)
      ? [selectedSummary, ...visibleThreads]
      : visibleThreads
  const suggestedMessage = selectedStatus === 'accepted'
    ? (isDutch
        ? `Koffie deze week, zonder druk?`
        : `Coffee this week, low pressure?`)
    : (isDutch
        ? `Hey ${selectedMatch.name}, je profiel voelt bewust en warm. Welke eerste date voelt voor jou natuurlijk?`
        : `Hey ${selectedMatch.name}, I liked that your profile feels intentional. What kind of first date feels natural to you?`)

  function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || composeDisabled) return
    sendDirectMessage(text)
    setDraft('')
  }

  function handleAcceptRequest() {
    setMessageTab('chats')
    acceptMessageRequest(selectedMatch.id)
  }

  return (
    <section className="secondary-screen messages-screen">
      <div className={chatOpen ? 'messages-layout chat-open' : 'messages-layout inbox-open'}>
        <aside className="conversation-list" aria-label="Message threads">
          <div className="panel-title inline">
            <MessageSquare size={20} />
            <h2>{messageCopy.inbox}</h2>
            <strong>{chatThreads.length + requestThreads.length}</strong>
          </div>
          <div className="message-tabs" aria-label="Message inbox tabs">
            <button
              className={messageTab === 'chats' ? 'active' : ''}
              type="button"
              onClick={() => setMessageTab('chats')}
            >
              {messageCopy.chats}
              <small>{chatThreads.length}</small>
            </button>
            <button
              className={messageTab === 'requests' ? 'active' : ''}
              type="button"
              onClick={() => setMessageTab('requests')}
            >
              {messageCopy.requests}
              <small>{requestThreads.length}</small>
            </button>
          </div>
          {sidebarThreads.length ? (
            sidebarThreads.map(({ match, count, preview, fromYou, status, requestFromThem }) => (
              <button
                className={[
                  'thread-row',
                  match.id === selectedMatch.id ? 'active' : '',
                  status === 'request' ? 'request' : '',
                ].filter(Boolean).join(' ')}
                type="button"
                onClick={() => {
                  selectMatch(match.id)
                  setChatOpen(true)
                }}
                key={match.id}
              >
                <Avatar image={match.portrait} online={match.status === 'Online now'} photoPrivacy={match.photoPrivacy} />
                <span>
                  <strong>{match.name}</strong>
                  <small>
                    {status === 'accepted'
                      ? `${match.score}% match · ${messageCopy.openChat}`
                      : requestFromThem
                        ? `${match.score}% match · ${messageCopy.wantsToChat}`
                        : `${match.score}% match · ${messageCopy.requestLane}`}
                  </small>
                  <em>{fromYou ? (isDutch ? 'Jij: ' : 'You: ') : ''}{preview}</em>
                </span>
                <i>{status === 'request' ? (requestFromThem ? messageCopy.new : messageCopy.sent) : count || match.score}</i>
              </button>
            ))
          ) : (
            <p className="thread-empty">
              {messageTab === 'chats'
                ? messageCopy.noChats
                : messageCopy.noRequests}
            </p>
          )}
        </aside>

        <div className="conversation-card">
          <div className="conversation-head">
            <button className="chat-back-button" type="button" onClick={() => setChatOpen(false)} aria-label={isDutch ? 'Terug naar berichten' : 'Back to messages'}>
              <ChevronLeft size={20} />
            </button>
            <Avatar image={selectedMatch.portrait} online photoPrivacy={selectedMatch.photoPrivacy} />
            <span>
              <strong>{selectedMatch.name}</strong>
              <small>
                {selectedMatch.role} · {selectedStatus === 'accepted'
                  ? messageCopy.openChat
                  : incomingRequest
                    ? messageCopy.requestLabel.toLowerCase()
                    : outgoingRequest
                      ? messageCopy.sent.toLowerCase()
                      : messageCopy.requestLane}
              </small>
            </span>
            {incomingRequest ? (
              <div className="conversation-actions">
                <button type="button" onClick={handleAcceptRequest}>
                  {messageCopy.accept}
                </button>
                <button type="button" onClick={() => openModal({ type: 'report' })}>
                  {messageCopy.block}
                </button>
              </div>
            ) : (
              <div className="conversation-actions">
                <button type="button" onClick={() => setDraft(suggestedMessage)}>
                  {selectedStatus === 'accepted' ? messageCopy.draftReply : messageCopy.draftRequest}
                </button>
                {selectedStatus === 'accepted' ? (
                  <button type="button" onClick={() => openModal({ type: 'plan' })}>
                    <CalendarDays size={17} />
                    {isDutch ? 'Date plannen' : messageCopy.planDate}
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {selectedPlans.length ? (
            <div className="message-plan-list" aria-label={isDutch ? 'Date-plannen' : messageCopy.plannedDates}>
              <span>
                <CalendarDays size={16} />
                {isDutch ? 'Date-plannen' : messageCopy.plannedDates}
              </span>
              {selectedPlans.map((plan) => (
                <p key={plan.id}>
                  <strong>{plan.place}</strong>
                  <small>{plan.time}</small>
                </p>
              ))}
            </div>
          ) : null}

          <div className="message-list">
            {thread.length ? (
              thread.map((message) => (
                <p
                  className={[
                    message.from === 'you' ? 'you' : '',
                    normalizeMessageStatus(message) === 'request' ? 'request-message' : '',
                  ].filter(Boolean).join(' ')}
                  key={message.id}
                >
                  {message.text}
                  {normalizeMessageStatus(message) === 'request' ? <small>{messageCopy.requestLabel}</small> : null}
                </p>
              ))
            ) : (
              <p className="message-empty">
                {messageCopy.empty}
              </p>
            )}
          </div>

          <form className="message-compose" onSubmit={sendMessage}>
            <label className={composeDisabled ? 'compose-photo disabled' : 'compose-photo'} aria-label={isDutch ? 'Foto sturen' : 'Send photo'}>
              <Upload size={18} />
              <input
                type="file"
                accept="image/*"
                disabled={composeDisabled}
                onChange={(event) => {
                  if (event.target.files?.length) {
                    sendDirectMessage(isDutch ? 'Foto verstuurd' : 'Photo sent')
                    event.target.value = ''
                  }
                }}
              />
            </label>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={composeDisabled}
              placeholder={
                incomingRequest
                  ? messageCopy.acceptPlaceholder
                  : requestLocked
                    ? messageCopy.limitPlaceholder
                    : selectedStatus === 'accepted'
                      ? messageCopy.sendPlaceholder
                      : messageCopy.requestPlaceholder
              }
            />
            <button type="submit" aria-label="Send message" disabled={composeDisabled}>
              <Send size={18} />
            </button>
          </form>
          {requestLocked ? (
            <p className="message-limit-note">
              {isDutch ? 'Je hebt vandaag je gratis berichten gebruikt.' : "You have used today's free messages."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function BriefingView({ matches: matchList, selectMatch, sendBriefingNow, briefings, providerStatus }) {
  const lastBriefing = briefings[0]

  return (
    <section className="secondary-screen">
      <ScreenHeading
        kicker="Sunday Match Briefing"
        title="Your week in connection"
        body="A curated email-style digest with top matches, nearby options, and AI notes."
      />
      <div className="briefing-layout">
        <article className="email-preview">
          <Mail size={24} />
          <h2>Hi Alex, your strongest signals are ready.</h2>
          <p>
            This week we found {matchList.length} high-potential matches and one wildcard
            outside your usual pattern.
          </p>
          <div>
            {matchList.slice(0, 3).map((match) => (
              <button type="button" onClick={() => selectMatch(match.id)} key={match.id}>
                <img src={match.portrait} alt="" />
                <span>{match.name}</span>
                <strong>{match.score}%</strong>
              </button>
            ))}
          </div>
        </article>
        <section className="briefing-stats">
          <h2>Digest metrics</h2>
          <p>12 new matches</p>
          <p>85% average compatibility</p>
          <p>3 date ideas created</p>
          <button type="button" onClick={sendBriefingNow}>
            <Mail size={18} />
            Send test briefing
          </button>
          <small>
            {providerStatus?.email === 'resend-ready'
              ? 'Ready to send through Resend'
              : 'Saved as local preview until email keys are added'}
          </small>
          {lastBriefing ? (
            <em>
              Last preview: {lastBriefing.topMatches?.[0]?.name ?? 'No top match'} · {lastBriefing.mode}
            </em>
          ) : null}
        </section>
      </div>
    </section>
  )
}

function MemoryView({
  profile,
  notes,
  attentionSignals,
  deleteMemoryNote,
  deleteAttentionSignal,
  clearAttentionSignals,
  updateMemoryVisibility,
  setActiveView,
}) {
  const language = profile?.language ?? viewer.language
  const copy = {
    kicker: 'AI Memory',
    title: 'What MatchPulse currently knows',
    body: 'Choose exactly what the AI may use for matching, what needs approval before sharing, and what stays private.',
    stats: {
      ai: 'AI usable',
      private: 'Private only',
      never: 'Never use',
      attention: 'Attention',
    },
    emptyTitle: 'No private memory yet.',
    emptyBody: 'Open the AI profile tool and teach MatchPulse what matters.',
    delete: 'Delete memory',
    weight: 'Match weight',
    openTool: 'Open AI profile tool',
    ...appText(language).memory,
  }
  const memories = normalizeMemoryNotes(notes)
  const memoryStats = [
    [copy.stats.ai, memories.filter((note) => ['match_ai', 'shareable', 'profile'].includes(note.visibility)).length],
    [copy.stats.private, memories.filter((note) => note.visibility === 'private').length],
    [copy.stats.never, memories.filter((note) => note.visibility === 'never').length],
    [copy.stats.attention, attentionSignals.length],
  ]

  return (
    <section className="secondary-screen">
      <ScreenHeading
        kicker={copy.kicker}
        title={copy.title}
        body={copy.body}
      />
      <DataConsentPrimer language={language} />
      <div className="memory-signal-summary" aria-label="Memory privacy summary">
        {memoryStats.map(([label, value]) => (
          <span key={label}>
            <strong>{value}</strong>
            {label}
          </span>
        ))}
      </div>
      <div className="memory-board">
        {memories.map((note) => (
          <article key={note.id}>
            <header>
              <Brain size={20} />
              <span>
                <p>{note.text}</p>
                <small>{memoryVisibilityCopy(note.visibility, language).detail}</small>
              </span>
              <button
                type="button"
                aria-label={copy.delete}
                onClick={() => deleteMemoryNote(note)}
              >
                <Trash2 size={17} />
              </button>
            </header>
            <MemoryWeightRow note={note} attentionSignals={attentionSignals} label={copy.weight} />
            <div className="memory-consent-options" aria-label={`Memory sharing setting for ${note.text}`}>
              {memoryVisibilityOptions.map((option) => (
                <button
                  className={note.visibility === option.id ? 'active' : ''}
                  type="button"
                  onClick={() => updateMemoryVisibility(note, option.id)}
                  key={option.id}
                >
                  {memoryVisibilityCopy(option.id, language).label}
                </button>
              ))}
            </div>
          </article>
        ))}
        {!memories.length ? (
          <article className="memory-empty">
            <header>
              <Brain size={20} />
              <span>
                <p>{copy.emptyTitle}</p>
                <small>{copy.emptyBody}</small>
              </span>
            </header>
          </article>
        ) : null}
      </div>
      <PrivateAttentionPanel
        signals={attentionSignals}
        onDelete={deleteAttentionSignal}
        onClear={clearAttentionSignals}
        language={language}
      />
      <button className="primary-wide" type="button" onClick={() => setActiveView('profile')}>
        {copy.openTool}
      </button>
    </section>
  )
}

function MemoryWeightRow({ note, attentionSignals, label = 'Match weight' }) {
  const weight = memoryWeight(note, attentionSignals)

  return (
    <div className="memory-weight-row" aria-label={`Match weight ${weight}%`}>
      <span>{label}</span>
      <i>
        <b style={{ width: `${weight}%` }} />
      </i>
      <strong>{weight}%</strong>
    </div>
  )
}

function PlansView({ plannedDates, openModal, profile }) {
  const copy = {
    kicker: 'Plans',
    title: 'Date planner',
    body: 'Turn good matches into low-pressure plans.',
    create: 'Create a date plan',
    empty: 'No plans yet. Pick a match and press Plan date.',
    ...appText(profile?.language).plans,
  }

  return (
    <section className="secondary-screen">
      <ScreenHeading
        kicker={copy.kicker}
        title={copy.title}
        body={copy.body}
      />
      <div className="plans-card">
        <button type="button" onClick={() => openModal({ type: 'plan' })}>
          <Plus size={18} />
          {copy.create}
        </button>
        {plannedDates.length ? (
          plannedDates.map((plan) => (
            <article key={plan.id}>
              <CalendarDays size={20} />
              <span>
                <strong>{plan.matchName}</strong>
                <small>{plan.place} · {plan.time}</small>
              </span>
            </article>
          ))
        ) : (
          <p>{copy.empty}</p>
        )}
      </div>
    </section>
  )
}

function BetaLabView({
  betaOverview,
  providerStatus,
  createLocalBetaTester,
  cleanupBetaData,
  inviteLink,
  copyInviteLink,
  setActiveView,
}) {
  const totals = betaOverview?.totals ?? {
    activeUsers: 0,
    onboardedUsers: 0,
    invitesAccepted: 0,
    feedback: 0,
    reports: 0,
    blocks: 0,
    briefings: 0,
    authEmails: 0,
    testAccounts: 0,
  }
  const checklist = betaOverview?.providerStatus?.checklist ?? providerStatus?.checklist ?? []

  return (
    <section className="secondary-screen lab-screen">
      <ScreenHeading
        kicker="Beta Lab"
        title="Make the private beta measurable"
        body="Track whether profiles, invites, safety signals and briefings are actually moving."
      />

      <div className="lab-grid">
        <BetaLaunchPanel
          betaOverview={betaOverview}
          providerStatus={providerStatus}
          inviteLink={inviteLink}
          copyInviteLink={copyInviteLink}
          createLocalBetaTester={createLocalBetaTester}
          cleanupBetaData={cleanupBetaData}
          setActiveView={setActiveView}
        />

        <section className="lab-panel lab-actions">
          <div className="panel-title inline">
            <Plus size={20} />
            <h2>Test pool</h2>
          </div>
          <p>Create a realistic local profile so matching, Play, messages and reports can be tested immediately.</p>
          <button type="button" onClick={createLocalBetaTester}>
            <UserRound size={18} />
            Create local tester
          </button>
        </section>

        <PreTesterAuditPanel setActiveView={setActiveView} />

        <section className="lab-metrics">
          {[
            ['Active users', totals.activeUsers],
            ['Onboarded', totals.onboardedUsers],
            ['Invites', totals.invitesAccepted],
            ['Feedback', totals.feedback],
            ['Tester notes', totals.testerFeedback ?? 0],
            ['Reports', totals.reports],
            ['Blocks', totals.blocks],
            ['Briefings', totals.briefings],
            ['Auth mails', totals.authEmails ?? 0],
            ['Test data', totals.testAccounts ?? 0],
          ].map(([label, value]) => (
            <article key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="lab-panel">
          <div className="panel-title inline">
            <ShieldCheck size={20} />
            <h2>Launch checklist</h2>
          </div>
          <div className="readiness-list compact">
            {checklist.map((item) => (
              <p className={item.ready ? 'ready' : ''} key={item.id}>
                <i />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </p>
            ))}
          </div>
        </section>

        <LabList
          title="Report queue"
          icon={ShieldCheck}
          empty="No reports yet."
          rows={(betaOverview?.latestReports ?? []).map((report) => ({
            id: report.id,
            title: `${report.reported} · ${report.status}`,
            body: `${report.reason} · by ${report.reporter}`,
          }))}
        />

        <LabList
          title="Match feedback"
          icon={HeartPulse}
          empty="No feedback signals yet."
          rows={(betaOverview?.latestFeedback ?? []).map((feedback) => ({
            id: feedback.id,
            title: `${feedback.match} felt ${feedback.type}`,
            body: `Signal from ${feedback.user}`,
          }))}
        />

        <LabList
          title="Tester feedback"
          icon={MessageSquare}
          empty="No tester notes yet."
          rows={(betaOverview?.latestTesterFeedback ?? []).map((feedback) => ({
            id: feedback.id,
            title: `${feedback.issueType} · ${feedback.rating}/5`,
            body: `${feedback.surface} · ${feedback.user}: ${feedback.body}`,
          }))}
        />

        <LabList
          title="Auth email log"
          icon={Mail}
          empty="No verification or reset emails yet."
          rows={(betaOverview?.latestAuthEmails ?? []).map((email) => ({
            id: email.id,
            title: `${email.type} · ${email.provider}`,
            body: `${email.to} · ${email.delivered ? 'delivered' : 'preview'}${email.error ? ` · ${email.error}` : ''}`,
          }))}
        />

        <LabList
          title="Briefing log"
          icon={Mail}
          empty="No briefing previews yet."
          rows={(betaOverview?.latestBriefings ?? []).map((briefing) => ({
            id: briefing.id,
            title: `${briefing.topMatch} · ${briefing.mode}`,
            body: briefing.delivered ? `Delivered to ${briefing.to}` : `Preview for ${briefing.to}`,
          }))}
        />
      </div>
    </section>
  )
}

function LabList({ title, icon: Icon, rows, empty }) {
  return (
    <section className="lab-panel">
      <div className="panel-title inline">
        <Icon size={20} />
        <h2>{title}</h2>
      </div>
      <div className="lab-list">
        {rows.length ? (
          rows.map((row) => (
            <article key={row.id}>
              <strong>{row.title}</strong>
              <small>{row.body}</small>
            </article>
          ))
        ) : (
          <p>{empty}</p>
        )}
      </div>
    </section>
  )
}

function PreTesterAuditPanel({ setActiveView }) {
  return (
    <section className="lab-panel pretester-audit">
      <div className="panel-title inline">
        <SlidersHorizontal size={20} />
        <h2>Pre-tester product audit</h2>
        <strong>4 focus areas</strong>
      </div>
      <p>
        Built from the strongest patterns in modern dating apps: prompts for depth, fast nearby browsing,
        explainable matching, and visible safety controls.
      </p>
      <div className="audit-focus-list">
        {preTesterAuditItems.map((item) => (
          <button type="button" onClick={() => setActiveView(item.action)} key={item.id}>
            <span>
              <strong>{item.title}</strong>
              <small>{item.body}</small>
            </span>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </section>
  )
}

function SafetyReadinessCard({ hiddenCount, reportCount, feedbackCount, setActiveView, exportProfile, language = viewer.language }) {
  const isDutch = language === 'Nederlands'
  const items = isDutch
    ? [
        { id: 'memory', label: 'Memory toestemming', detail: 'Elke AI memory kan prive, AI-only, eerst vragen, profiel of nooit zijn.', ready: true },
        { id: 'location', label: 'Vervaagde locatie', detail: 'Radar toont afstand zonder exacte locatie.', ready: true },
        { id: 'report', label: 'Report en block', detail: `${reportCount} reports bewaard. Verborgen profielen: ${hiddenCount}.`, ready: true },
        { id: 'export', label: 'Export en verwijderen', detail: 'Prive export en beta-account verwijderen zijn beschikbaar.', ready: true },
        { id: 'feedback', label: 'Feedback loop', detail: `${feedbackCount} matchfeedback signalen opgeslagen.`, ready: feedbackCount > 0 },
      ]
    : [
        { id: 'memory', label: 'Memory consent', detail: 'Every AI memory can be private, AI-only, approved, public, or never used.', ready: true },
        { id: 'location', label: 'Fuzzed location', detail: 'Radar communicates distance without exposing exact position.', ready: true },
        { id: 'report', label: 'Report and block', detail: `${reportCount} reports saved. Hidden profiles: ${hiddenCount}.`, ready: true },
        { id: 'export', label: 'Export and delete', detail: 'Private profile export and beta account deletion are available.', ready: true },
        { id: 'feedback', label: 'Feedback loop', detail: `${feedbackCount} match feedback signals captured.`, ready: feedbackCount > 0 },
      ]

  return (
    <section className="settings-panel safety-readiness-card">
      <div className="panel-title inline">
        <ShieldCheck size={20} />
        <h2>{isDutch ? 'Veilig klaar voor testers' : 'Tester safety readiness'}</h2>
        <strong>{readyRatio(items)}%</strong>
      </div>
      <div className="readiness-list compact">
        {items.map((item) => (
          <p className={item.ready ? 'ready' : ''} key={item.id}>
            <i />
            <span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
          </p>
        ))}
      </div>
      <div className="safety-action-row">
        <button type="button" onClick={() => setActiveView('memory')}>
          <Brain size={17} />
          {isDutch ? 'Memory board' : 'Memory board'}
        </button>
        <button type="button" onClick={exportProfile}>
          <Upload size={17} />
          {isDutch ? 'Exporteer profiel' : 'Export profile'}
        </button>
      </div>
    </section>
  )
}

function SafetyRoadmapCard({ reportCount = 0, language = viewer.language }) {
  const isDutch = language === 'Nederlands'
  const items = isDutch
    ? [
        { id: 'moderation', label: 'Moderation queue', detail: `${reportCount} reports zichtbaar voor beta-review. Volgende stap: status/assignee per case.` },
        { id: 'fake', label: 'Fake profile flags', detail: 'Signalen zoals hergebruikte fotos, spamlinks en druk om platform te verlaten.' },
        { id: 'consent', label: 'Consent reminders', detail: 'Zachte nudges voor fotos, meeting en gevoelige info voor iets gedeeld wordt.' },
        { id: 'screenshot', label: 'Screenshot/privacy warning', detail: 'Waarschuwing in chat/profiel wanneer iemand gevoelige content probeert te bewaren.' },
        { id: 'safe-date', label: 'Veilige date checklist', detail: 'Publieke plek, eigen vervoer, trusted contact en check-in reminder.' },
      ]
    : [
        { id: 'moderation', label: 'Moderation queue', detail: `${reportCount} reports visible for beta review. Next: status and assignee per case.` },
        { id: 'fake', label: 'Fake profile flags', detail: 'Signals like reused photos, spam links, and pressure to leave the platform.' },
        { id: 'consent', label: 'Consent reminders', detail: 'Soft nudges before photos, meetups, or sensitive info are shared.' },
        { id: 'screenshot', label: 'Screenshot/privacy warning', detail: 'Warn in chat/profile when someone tries to keep sensitive content.' },
        { id: 'safe-date', label: 'Safe date checklist', detail: 'Public place, own transport, trusted contact, and check-in reminder.' },
      ]

  return (
    <section className="settings-panel safety-roadmap-card">
      <div className="panel-title inline">
        <ShieldCheck size={20} />
        <h2>{isDutch ? 'Safety volgende laag' : 'Next safety layer'}</h2>
        <strong>{isDutch ? 'Na testers' : 'After testers'}</strong>
      </div>
      <div className="safety-roadmap-list">
        {items.map((item) => (
          <article key={item.id}>
            <i />
            <span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}

function SettingsView({
  profile,
  orientation,
  setOrientation,
  privacySettings,
  togglePrivacySetting,
  hiddenCount,
  resetHiddenMatches,
  exportProfile,
  inviteLink,
  copyInviteLink,
  restartOnboarding,
  deleteBetaAccount,
  setActiveView,
  reportCount,
  feedbackCount,
}) {
  const language = profile?.language ?? viewer.language
  const isDutch = isDutchLanguage(language)
  const settingsCopy = appText(language).settings
  const defaultToggleCopy = {
    memoryLearning: ['AI memory learning', 'Let MatchPulse use profile notes, messages, and feedback to improve explanations.'],
    attentionLearning: ['Private attention learning', 'Let the AI learn from profile dwell, photo previews, and chat rhythm. Never shown to other people.'],
    weeklyBriefing: ['Sunday match briefing', 'Receive the weekly digest with top matches, nearby opportunities, and date ideas.'],
    fuzzyLocation: ['Fuzz nearby location', 'Show distance ranges without exposing your exact position.'],
    onlineStatus: ['Show online status', 'Let high-potential matches see when you are available.'],
  }
  const copy = {
    kicker: 'Settings',
    title: 'Privacy and match controls',
    body: 'Keep the luxury flow, but make the sensitive parts explicit and reversible.',
    consentProfile: 'Consent-first profile',
    consentBody: 'Your private memory, attention signals, exports, and visibility choices stay under your control.',
    export: 'Export private profile',
    restart: 'Log out / switch account',
    testers: 'Invite testers',
    testersBody: 'Share this beta link so another profile can be created for AI match testing.',
    copyLink: 'Copy link',
    safety: 'Safety controls',
    noHidden: 'No hidden profiles.',
    hidden: 'profile hidden from your match list.',
    reports: 'Reports',
    feedback: 'Feedback signals',
    restore: 'Restore hidden matches',
    delete: 'Delete beta account',
    on: 'On',
    off: 'Off',
    ...settingsCopy,
    toggles: {
      memoryLearning: settingsCopy.toggles?.memoryLearning ?? defaultToggleCopy.memoryLearning,
      attentionLearning: settingsCopy.toggles?.attentionLearning ?? defaultToggleCopy.attentionLearning,
      weeklyBriefing: settingsCopy.toggles?.weeklyBriefing ?? defaultToggleCopy.weeklyBriefing,
      fuzzyLocation: settingsCopy.toggles?.fuzzyLocation ?? defaultToggleCopy.fuzzyLocation,
      onlineStatus: settingsCopy.toggles?.onlineStatus ?? defaultToggleCopy.onlineStatus,
    },
  }
  const settings = [
    {
      id: 'memoryLearning',
      title: copy.toggles.memoryLearning[0],
      body: copy.toggles.memoryLearning[1],
    },
    {
      id: 'attentionLearning',
      title: copy.toggles.attentionLearning[0],
      body: copy.toggles.attentionLearning[1],
    },
    {
      id: 'weeklyBriefing',
      title: copy.toggles.weeklyBriefing[0],
      body: copy.toggles.weeklyBriefing[1],
    },
    {
      id: 'fuzzyLocation',
      title: copy.toggles.fuzzyLocation[0],
      body: copy.toggles.fuzzyLocation[1],
    },
    {
      id: 'onlineStatus',
      title: copy.toggles.onlineStatus[0],
      body: copy.toggles.onlineStatus[1],
    },
  ]

  return (
    <section className="secondary-screen settings-screen">
      <ScreenHeading
        kicker={copy.kicker}
        title={copy.title}
        body={copy.body}
      />

      <div className="settings-grid">
        <section className="settings-summary">
          <ShieldCheck size={28} />
          <h2>{copy.consentProfile}</h2>
          <p>{copy.consentBody}</p>
          <button type="button" onClick={exportProfile}>
            <Upload size={18} />
            {copy.export}
          </button>
          <button type="button" onClick={restartOnboarding}>
            <UserRound size={18} />
            {copy.restart}
          </button>
        </section>

        <section className="settings-panel search-preferences-panel">
          <div>
            <h2>{isDutch ? 'Zoekvoorkeuren' : 'Search preferences'}</h2>
            <p>{isDutch ? 'Kies hier wie je wil zien. Radar en Deep Match blijven daardoor rustig.' : 'Choose who you want to see here, so Radar and Deep Match stay clean.'}</p>
          </div>
          <div>
            <span className="segmented-label">{isDutch ? 'Toon mij' : 'Show me'}</span>
            <Segmented
              value={orientation}
              options={interestPreferences}
              labels={Object.fromEntries(interestPreferences.map((option) => [option, displayOption(option, language)]))}
              onChange={setOrientation}
            />
          </div>
        </section>

        <SafetyReadinessCard
          hiddenCount={hiddenCount}
          reportCount={reportCount}
          feedbackCount={feedbackCount}
          setActiveView={setActiveView}
          exportProfile={exportProfile}
          language={language}
        />

        <SafetyRoadmapCard reportCount={reportCount} language={language} />

        <section className="settings-panel">
          {settings.map((setting) => (
            <button
              className="setting-row"
              type="button"
              onClick={() => togglePrivacySetting(setting.id)}
              key={setting.id}
            >
              <span>
                <strong>{setting.title}</strong>
                <small>{setting.body}</small>
              </span>
              <em className={privacySettings[setting.id] ? 'on' : ''}>
                {privacySettings[setting.id] ? copy.on : copy.off}
              </em>
            </button>
          ))}
        </section>

        <section className="settings-panel invite-settings">
          <div>
            <h2>{copy.testers}</h2>
            <p>{copy.testersBody}</p>
          </div>
          <div className="settings-link-row">
            <input value={inviteLink} readOnly />
            <button type="button" onClick={copyInviteLink}>
              <Link2 size={17} />
              {copy.copyLink}
            </button>
          </div>
        </section>

        <section className="settings-panel danger-zone">
          <div>
            <h2>{copy.safety}</h2>
            <p>
              {hiddenCount ? `${hiddenCount} ${copy.hidden}` : copy.noHidden}
              {' '}{copy.reports}: {reportCount}. {copy.feedback}: {feedbackCount}.
            </p>
          </div>
          <button type="button" onClick={resetHiddenMatches} disabled={!hiddenCount}>
            <Trash2 size={18} />
            {copy.restore}
          </button>
          <button type="button" onClick={deleteBetaAccount}>
            <X size={18} />
            {copy.delete}
          </button>
        </section>
      </div>
    </section>
  )
}

function DevFeedbackView({
  language = viewer.language,
  localFeedbackItems = [],
  testerFeedbackItems = [],
  authEmails = [],
}) {
  const isDutch = isDutchLanguage(language)
  const localItems = Array.isArray(localFeedbackItems) ? localFeedbackItems : []
  const serverItems = Array.isArray(testerFeedbackItems) ? testerFeedbackItems : []
  const emailItems = Array.isArray(authEmails) ? authEmails : []

  const localScreenshotBytes = localItems.reduce((sum, item) => (
    sum + floatingFeedbackScreenshotsBytes(item.screenshots)
  ), 0)
  const localScreenshotCount = localItems.reduce((sum, item) => sum + countFloatingScreenshots(item.screenshots), 0)

  const localSortedItems = [...localItems].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.syncedAt || left.createdAt || 0)
    const rightTime = Date.parse(right.updatedAt || right.syncedAt || right.createdAt || 0)
    return rightTime - leftTime
  })
  const serverSortedItems = [...serverItems].sort((left, right) => {
    const leftTime = Date.parse(left.updatedAt || left.createdAt || 0)
    const rightTime = Date.parse(right.updatedAt || right.createdAt || 0)
    return rightTime - leftTime
  })
  const emailSortedItems = [...emailItems].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || 0)
    const rightTime = Date.parse(right.createdAt || 0)
    return rightTime - leftTime
  })

  function formatTime(value) {
    if (!value) return isDutch ? 'onbekend' : 'unknown'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return isDutch ? 'onbekend' : 'unknown'
    return date.toLocaleString(undefined, {
      hour12: false,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getLocalSyncState(item) {
    const screenshots = countFloatingScreenshots(item?.screenshots)
    const syncedScreenshots = Number.parseInt(item?.syncedScreenshotCount, 10) || 0
    const surface = String(item?.surface || '').slice(0, 80)
    const surfaceLabel = String(item?.surfaceLabel || surface || '').slice(0, 80)
    const surfaceContext = String(item?.surfaceContext || '').slice(0, 140)
    const syncedSurface = String(item?.syncedSurface || '').slice(0, 80)
    const syncedSurfaceLabel = String(item?.syncedSurfaceLabel || '').slice(0, 80)
    const syncedSurfaceContext = String(item?.syncedSurfaceContext || '').slice(0, 140)
    const body = String(item?.body ?? '').trim()
    const isSynced = Boolean(
      body &&
      item?.syncedBody === body &&
      Number.parseInt(item?.syncedRating, 10) === Number.parseInt(item?.rating, 10) &&
      String(item?.syncedIssueType || '') === String(item?.issueType || '') &&
      syncedScreenshots === screenshots &&
      (syncedSurface || surface) === surface &&
      (syncedSurfaceLabel || surfaceLabel || surface) === (surfaceLabel || surface) &&
      (syncedSurfaceContext || '') === (surfaceContext || '')
    )
    const syncLabel = isSynced
      ? (isDutch ? 'Gesynchroniseerd' : 'Synced')
      : body
        ? (isDutch ? 'Lokaal bewaard' : 'Saved locally')
        : (isDutch ? 'Leeg' : 'Empty')
    return syncLabel
  }

  return (
    <section className="secondary-screen dev-feedback-screen">
      <ScreenHeading
        kicker={isDutch ? 'Developer' : 'Developer'}
        title={isDutch ? 'Beta-feedback logboek' : 'Beta feedback log'}
        body={isDutch
          ? 'Alles wat door testers is ingevuld, inclusief screenshots, blijft lokaal opgeslagen en hier zichtbaar.'
          : 'Everything testers submit, including screenshots, is stored locally and visible here.'}
      />
      <div className="dev-feedback-grid">
        <section className="dev-feedback-panel">
          <div className="panel-title inline">
            <WandSparkles size={20} />
            <h2>{isDutch ? 'Lokale feedbackdrafts' : 'Local feedback drafts'}</h2>
            <strong>{localItems.length}</strong>
          </div>
          <p>
            {isDutch
              ? `Opslag: ${localScreenshotCount} screenshots · ${formatByteSize(localScreenshotBytes)} · ${localItems.length} issues`
              : `Stored: ${localScreenshotCount} screenshots · ${formatByteSize(localScreenshotBytes)} · ${localItems.length} issues`}
          </p>
          {localSortedItems.length ? (
            <div className="dev-feedback-list">
              {localSortedItems.map((item, index) => {
                const itemScreenshotCount = countFloatingScreenshots(item.screenshots)
                return (
                  <article className="dev-feedback-item" key={item.id || `local-${index}`}>
                  <span className="dev-feedback-index">{index + 1}.</span>
                  <div>
                    <strong>{`Issue ${index + 1} · ${floatingFeedbackIssueTypeLabel(item.issueType, language)}`}</strong>
                    <small>
                      {item.surfaceLabel || item.surface || (isDutch ? 'Onbekende pagina' : 'Unknown page')}
                      {item.surfaceContext ? ` · ${item.surfaceContext}` : ''}
                      {' · '}
                      {item.rating ?? 4}/5
                      {' · '}
                      {itemScreenshotCount} screenshot{itemScreenshotCount === 1 ? '' : 's'}
                      {' · '}
                      {getLocalSyncState(item)}
                    </small>
                    <p>{item.body || (isDutch ? 'Nog geen tekst ingevuld.' : 'No text written yet.')}</p>
                    <small>{formatTime(item.updatedAt || item.createdAt || item.syncedAt)}</small>
                    {item.screenshots?.length ? (
                      <div className="dev-feedback-previews">
                        {item.screenshots.map((shot) => (
                          <figure className="dev-feedback-preview" key={shot.id}>
                            <img src={shot.dataUrl} alt={shot.name} />
                            <figcaption>{shot.name}</figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p>{isDutch ? 'Nog geen lokale beta-feedback opgeslagen.' : 'No local beta feedback stored yet.'}</p>
          )}
        </section>

        <section className="dev-feedback-panel">
          <div className="panel-title inline">
            <MessageSquare size={20} />
            <h2>{isDutch ? 'Gesynceerde serverfeedback' : 'Synced server feedback'}</h2>
            <strong>{serverItems.length}</strong>
          </div>
          <p>{isDutch ? 'Gesynchroniseerde items die naar het account zijn opgeslagen.' : 'Feedback items already synced to your account.'}</p>
          {serverSortedItems.length ? (
            <div className="dev-feedback-list">
              {serverSortedItems.map((item) => (
                <article className="dev-feedback-item" key={item.id}>
                  <span className="dev-feedback-index">
                    {floatingFeedbackIssueTypeLabel(item.issueType, language)}
                  </span>
                  <div>
                    <strong>{`${(item.surface || (isDutch ? 'Onbekende pagina' : 'Unknown page'))} · ${item.rating}/5`}</strong>
                    <small>
                      {item.surfaceContext || item.metadata?.surfaceContext || item.surfaceLabel || (isDutch ? 'Onbekende pagina' : 'Unknown page')}
                      {' · '}
                      {formatTime(item.updatedAt || item.createdAt || item.syncedAt)}
                    </small>
                    <small>{isDutch ? 'Screenshots: ' : 'Screenshots: '}{item.metadata?.screenshotCount || 0}</small>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>{isDutch ? 'Nog geen sync-items. Dit vult aan als je ingelogd bent.' : 'No synced items yet. This fills once logged in.'}</p>
          )}
        </section>

        <section className="dev-feedback-panel">
          <div className="panel-title inline">
            <Mail size={20} />
            <h2>{isDutch ? 'Account-mails' : 'Account emails'}</h2>
            <strong>{emailItems.length}</strong>
          </div>
          <p>{isDutch ? 'Lokale previews voor verificatie en reset. Echte Resend-mails tonen hier alleen metadata.' : 'Local previews for verification and reset. Real Resend emails show metadata only.'}</p>
          {emailSortedItems.length ? (
            <div className="dev-feedback-list">
              {emailSortedItems.map((item, index) => (
                <article className="dev-feedback-item" key={item.id || `email-${index}`}>
                  <span className="dev-feedback-index">{index + 1}.</span>
                  <div>
                    <strong>{item.subject || item.type || (isDutch ? 'Account-mail' : 'Account email')}</strong>
                    <small>
                      {item.type || 'email'}
                      {' · '}
                      {item.provider || 'local-preview'}
                      {' · '}
                      {item.delivered ? (isDutch ? 'verzonden' : 'delivered') : (isDutch ? 'preview' : 'preview')}
                      {' · '}
                      {formatTime(item.createdAt)}
                    </small>
                    <p>{item.to}</p>
                    {item.previewUrl ? (
                      <a className="dev-feedback-link" href={item.previewUrl}>
                        {isDutch ? 'Open preview link' : 'Open preview link'}
                      </a>
                    ) : null}
                    {item.error ? <small>{item.error}</small> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>{isDutch ? 'Nog geen account-mails voor dit profiel.' : 'No account emails for this profile yet.'}</p>
          )}
        </section>
      </div>
    </section>
  )
}

function FloatingFeedbackWidget({
  language = viewer.language,
  sessionId = '',
  surface = 'app',
  surfaceLabel = '',
  surfaceContext = '',
  draft: externalDraft,
  onDraftChange = () => {},
  onSync,
}) {
  const isDutch = isDutchLanguage(language)
  const widgetRef = useRef(null)
  const dragRef = useRef(null)
  const fileInputRef = useRef(null)
  const activeUploadRef = useRef({ issueId: '', slotIndex: null })
  const [draggingScreenshotIndex, setDraggingScreenshotIndex] = useState(null)
  const draft = normalizeFloatingFeedbackState(externalDraft, surface, surfaceLabel)
  const [position, setPosition] = useState(readStoredFloatingFeedbackPosition)
  const [syncStatus, setSyncStatus] = useState('idle')
  const safeIssueOptions = floatingFeedbackIssueTypeOptions.map(([value]) => [value, floatingFeedbackIssueTypeLabel(value, language)])

  const issueItems = Array.isArray(draft.items) ? draft.items : []
  const activeItem = issueItems.find((item) => item.id === draft.activeItemId) ?? issueItems[0] ?? null
  const activeIndex = activeItem ? issueItems.findIndex((item) => item.id === activeItem.id) : -1
  const cleanBody = activeItem?.body?.trim() ?? ''
  const activeScreenshots = activeItem?.screenshots ?? []
  const activeIssueTypeLabel = floatingFeedbackIssueTypeLabel(activeItem?.issueType, language)
  const resolvedSurface = fallbackFloatingSurface(surface)
  const resolvedSurfaceLabel = String(surfaceLabel || surface || resolvedSurface || 'App').slice(0, 80)
  const resolvedSurfaceContext = String(surfaceContext || '').slice(0, 140)
  const activeIssueScreenshotCount = countFloatingScreenshots(activeScreenshots)
  const activeIssueSyncedScreenshotCount = Number.parseInt(activeItem?.syncedScreenshotCount, 10) || 0
  const activeSurface = String(activeItem?.surface || resolvedSurface).slice(0, 80)
  const activeSurfaceLabel = String(activeItem?.surfaceLabel || activeSurface || resolvedSurfaceLabel || 'App').slice(0, 80)
  const activeSurfaceContext = String(activeItem?.surfaceContext || resolvedSurfaceContext || '').slice(0, 140)
  const syncedSurface = String(activeItem?.syncedSurface || activeSurface).slice(0, 80)
  const syncedSurfaceLabel = String(activeItem?.syncedSurfaceLabel || activeSurfaceLabel).slice(0, 80)
  const syncedSurfaceContext = String(activeItem?.syncedSurfaceContext || '').slice(0, 140)
  const screenshotTotalBytes = floatingFeedbackScreenshotsBytes(activeScreenshots)
  const hasSyncedCurrent = Boolean(
    cleanBody &&
      activeItem?.syncedBody === cleanBody &&
      activeItem?.syncedRating === activeItem?.rating &&
      activeItem?.syncedIssueType === activeItem?.issueType &&
      activeIssueSyncedScreenshotCount === activeIssueScreenshotCount &&
      (syncedSurface || activeSurface) === activeSurface &&
      (syncedSurfaceLabel || activeSurfaceLabel) === activeSurfaceLabel &&
      (syncedSurfaceContext || '') === activeSurfaceContext,
  )
  const displaySyncStatus = !cleanBody
    ? 'idle'
    : !sessionId
      ? 'local'
      : hasSyncedCurrent
        ? 'synced'
        : syncStatus === 'error'
          ? 'error'
          : 'saving'
  const safePosition = clampFloatingFeedbackPosition(position, draft.collapsed)
  const safePositionX = safePosition?.x
  const safePositionY = safePosition?.y
  const activeItemLabel = isNaN(activeIndex) || activeIndex < 0 ? '?' : `${activeIndex + 1}.`
  const activeIssueResolved = isFloatingFeedbackIssueResolved(activeItem)
  const activeResolutionLabel = floatingFeedbackResolutionLabel(activeItem, language)

  const updateDraft = (next) => {
    const patch = typeof next === 'function'
      ? next
      : () => next
    onDraftChange((current) => {
      const baseline = normalizeFloatingFeedbackState(current, surface, surfaceLabel)
      const nextDraft = patch(baseline)
      return {
        ...baseline,
        ...nextDraft,
      }
    })
    setSyncStatus('idle')
  }

  const updateActiveItem = (patch) => {
    if (!activeItem) return
    updateDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === activeItem.id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)),
      activeItemId: activeItem.id,
    }))
  }

  function addIssue() {
    const nextIssue = createFloatingFeedbackIssue(surface, surfaceLabel, resolvedSurfaceContext)
    updateDraft((current) => ({
      ...current,
      collapsed: false,
      activeItemId: nextIssue.id,
      items: [...current.items, nextIssue],
    }))
  }

  function setActiveItem(itemId) {
    updateDraft((current) => ({
      ...current,
      activeItemId: itemId,
    }))
  }

  function setIssueScreenshots(issueId, screenshots) {
    updateDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === issueId ? { ...item, screenshots, updatedAt: new Date().toISOString() } : item)),
    }))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (safePositionX !== undefined && safePositionY !== undefined) {
      try {
        window.localStorage.setItem(floatingFeedbackPositionStorageKey, JSON.stringify({
          x: safePositionX,
          y: safePositionY,
        }))
      } catch {
        // Ignore storage pressure; widget position is cosmetic.
      }
    }
  }, [safePositionX, safePositionY])

  useEffect(() => {
    if (!cleanBody) {
      return undefined
    }
    if (!sessionId) {
      return undefined
    }
    if (hasSyncedCurrent) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      onSync({
        clientId: activeItem.clientId,
        surface: activeSurface,
        surfaceLabel: activeSurfaceLabel,
        rating: activeItem.rating,
        issueType: activeItem.issueType,
        body: cleanBody,
        metadata: {
          floating: true,
          surface: activeSurface,
          surfaceLabel: activeSurfaceLabel,
          surfaceContext: activeSurfaceContext,
          screenshotCount: activeIssueScreenshotCount,
          screenshotBytes: floatingFeedbackScreenshotsBytes(activeScreenshots),
          language,
        },
      })
        .then(() => {
          updateActiveItem({
            syncedBody: cleanBody,
            syncedRating: activeItem.rating,
            syncedIssueType: activeItem.issueType,
            syncedSurface: activeSurface,
            syncedSurfaceLabel: activeSurfaceLabel,
            syncedSurfaceContext: activeSurfaceContext,
            syncedScreenshotCount: activeIssueScreenshotCount,
            syncedAt: new Date().toISOString(),
          })
          setSyncStatus('synced')
        })
        .catch(() => setSyncStatus('error'))
    }, 900)

    return () => window.clearTimeout(timer)
  }, [
    cleanBody,
    activeItem?.clientId,
    activeItem?.issueType,
    activeItem?.rating,
    activeIssueScreenshotCount,
    screenshotTotalBytes,
    activeSurface,
    activeSurfaceLabel,
    activeSurfaceContext,
    activeItem?.syncedBody,
    activeItem?.syncedIssueType,
    activeItem?.syncedRating,
    activeItem?.syncedScreenshotCount,
    activeItem?.syncedSurface,
    activeItem?.syncedSurfaceLabel,
    activeItem?.syncedSurfaceContext,
    hasSyncedCurrent,
    activeScreenshots,
    onSync,
    sessionId,
    language,
    updateActiveItem,
  ])

  useEffect(() => {
    if (!activeItem || activeItem.surface !== 'app' || activeItem.surfaceContext) return

    // Keep explicit issue context once set (especially for bug reports per page),
    // only fill missing context when we only have the default app fallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateActiveItem({
      surface: resolvedSurface,
      surfaceLabel: resolvedSurfaceLabel,
      surfaceContext: resolvedSurfaceContext,
      updatedAt: new Date().toISOString(),
    })
  }, [activeItem, resolvedSurface, resolvedSurfaceLabel, resolvedSurfaceContext, updateActiveItem])

  useEffect(() => {
    function move(event) {
      if (!dragRef.current || !widgetRef.current) return
      const rect = widgetRef.current.getBoundingClientRect()
      const width = rect.width || 360
      const height = rect.height || 240
      setPosition({
        x: Math.round(clamp(event.clientX - dragRef.current.offsetX, 8, window.innerWidth - width - 8)),
        y: Math.round(clamp(event.clientY - dragRef.current.offsetY, 8, window.innerHeight - height - 8)),
      })
    }

    function stopDrag() {
      dragRef.current = null
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stopDrag)
      window.removeEventListener('pointercancel', stopDrag)
    }
  }, [])

  function startDrag(event) {
    if (!widgetRef.current) return
    const rect = widgetRef.current.getBoundingClientRect()
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
  }

  function removeScreenshot(issueId, screenshotId) {
    const target = issueItems.find((item) => item.id === issueId)
    if (!target) return
    setIssueScreenshots(
      issueId,
      target.screenshots.filter((item) => item.id !== screenshotId),
    )
  }

  function triggerFileUpload(issueId) {
    activeUploadRef.current = { issueId, slotIndex: null }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  function triggerSlotUpload(issueId, slotIndex = null) {
    activeUploadRef.current = { issueId, slotIndex }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  async function handleFilePick(event) {
    const files = Array.from(event.target.files ?? [])
    const issueId = activeUploadRef.current.issueId
    const slotIndex = activeUploadRef.current.slotIndex
    if (!issueId || !files.length) {
      activeUploadRef.current = { issueId: '', slotIndex: null }
      return
    }
    const target = issueItems.find((item) => item.id === issueId)
    if (!target) {
      activeUploadRef.current = { issueId: '', slotIndex: null }
      return
    }

    const nextShots = []
    const insertAt = clampScreenshotSlotIndex(target.screenshots, slotIndex)
    const uploadCapacity = slotIndex === null
      ? Math.max(0, maxFloatingScreenshotsPerIssue - target.screenshots.length)
      : Math.max(0, maxFloatingScreenshotsPerIssue - insertAt)
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > maxScreenshotBytes) continue
      if (nextShots.length >= uploadCapacity) break
      try {
        nextShots.push(await fileToFeedbackScreenshot(file))
      } catch {
        // ignore bad file
      }
    }
    if (!nextShots.length) {
      activeUploadRef.current = { issueId: '', slotIndex: null }
      return
    }

    const next = [...target.screenshots]
    let writeIndex = insertAt
    for (const shot of nextShots) {
      if (writeIndex >= maxFloatingScreenshotsPerIssue) break
      next[writeIndex] = shot
      writeIndex += 1
    }
    setIssueScreenshots(issueId, next.slice(0, maxFloatingScreenshotsPerIssue))
    activeUploadRef.current = { issueId: '', slotIndex: null }
  }

  const statusCopy = {
    idle: isDutch ? 'Klaar voor feedback' : 'Ready for feedback',
    local: isDutch ? 'Lokaal bewaard' : 'Saved locally',
    saving: isDutch ? 'Opslaan...' : 'Saving...',
    synced: isDutch ? 'Automatisch opgeslagen' : 'Autosaved',
    error: isDutch ? 'Opnieuw proberen...' : 'Retrying...',
  }
  const issueStatusLabel = syncStatus === 'error'
    ? statusCopy.error
    : cleanBody
      ? hasSyncedCurrent
        ? statusCopy.synced
        : statusCopy.saving
      : sessionId
        ? statusCopy.local
        : statusCopy.idle

  function clampScreenshotSlotIndex(screenshots = [], slotIndex = null) {
    const list = Array.isArray(screenshots) ? screenshots : []
    if (slotIndex === null || !Number.isFinite(slotIndex)) {
      return list.length
    }
    return Math.max(0, Math.min(list.length, Math.floor(slotIndex)))
  }

  function reorderActiveIssueScreenshots(issueId, sourceIndex, targetIndex) {
    const target = issueItems.find((item) => item.id === issueId)
    if (!target) return

    const source = Number(sourceIndex)
    const targetSlot = Number(targetIndex)

    if (!Number.isFinite(source) || !Number.isFinite(targetSlot)) return
    if (source === targetSlot) return
    if (source < 0 || source >= target.screenshots.length) return

    const next = [...target.screenshots]
    const moved = next.splice(source, 1)[0]
    if (!moved) return

    const safeTarget = Math.min(Math.max(targetSlot, 0), next.length)
    next.splice(safeTarget, 0, moved)
    setIssueScreenshots(issueId, next.slice(0, maxFloatingScreenshotsPerIssue))
  }

  function handleScreenshotDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleScreenshotDrop(event, targetIndex) {
    event.preventDefault()
    const activeItemId = activeItem?.id
    if (!activeItemId) {
      setDraggingScreenshotIndex(null)
      return
    }

    const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
    const targetSlot = Number(targetIndex)
    if (!Number.isFinite(sourceIndex) || !Number.isFinite(targetSlot)) {
      setDraggingScreenshotIndex(null)
      return
    }

    reorderActiveIssueScreenshots(activeItemId, sourceIndex, targetSlot)
    setDraggingScreenshotIndex(null)
  }

  async function submitActiveIssue() {
    if (!activeItem) return
    const body = cleanBody || (isDutch ? 'Screenshot-feedback zonder extra tekst.' : 'Screenshot feedback without extra text.')
    if (!cleanBody && !activeIssueScreenshotCount) return

    if (!sessionId) {
      updateActiveItem({ body })
      setSyncStatus('idle')
      return
    }

    setSyncStatus('saving')
    try {
      await onSync({
        clientId: activeItem.clientId,
        surface: activeSurface,
        surfaceLabel: activeSurfaceLabel,
        rating: activeItem.rating,
        issueType: activeItem.issueType,
        body,
        metadata: {
          floating: true,
          manualSubmit: true,
          surface: activeSurface,
          surfaceLabel: activeSurfaceLabel,
          surfaceContext: activeSurfaceContext,
          screenshotCount: activeIssueScreenshotCount,
          screenshotBytes: floatingFeedbackScreenshotsBytes(activeScreenshots),
          language,
        },
      })
      updateActiveItem({
        body,
        syncedBody: body,
        syncedRating: activeItem.rating,
        syncedIssueType: activeItem.issueType,
        syncedSurface: activeSurface,
        syncedSurfaceLabel: activeSurfaceLabel,
        syncedSurfaceContext: activeSurfaceContext,
        syncedScreenshotCount: activeIssueScreenshotCount,
        syncedAt: new Date().toISOString(),
      })
      setSyncStatus('synced')
    } catch {
      setSyncStatus('error')
    }
  }

  return (
    <section
      className={draft.collapsed ? 'floating-feedback collapsed' : 'floating-feedback'}
      ref={widgetRef}
      style={safePosition ? { left: safePosition.x, top: safePosition.y } : undefined}
      aria-label={isDutch ? 'Zwevende testerfeedback' : 'Floating tester feedback'}
    >
      <div className="floating-feedback-head">
        <button
          className="floating-feedback-drag"
          type="button"
          onPointerDown={startDrag}
          aria-label={isDutch ? 'Versleep feedbackvenster' : 'Drag feedback window'}
          title={isDutch ? 'Versleep' : 'Drag'}
        >
          <span />
          <span />
        </button>
        <div>
          <strong>{isDutch ? 'Beta feedback' : 'Beta feedback'}</strong>
          <small>{statusCopy[displaySyncStatus]}</small>
        </div>
        <button
          className="floating-feedback-toggle"
          type="button"
          onClick={() => updateDraft((current) => ({ ...current, collapsed: !current.collapsed }))}
          aria-label={draft.collapsed ? (isDutch ? 'Open feedback' : 'Open feedback') : (isDutch ? 'Klap feedback in' : 'Collapse feedback')}
        >
          {draft.collapsed ? <MessageSquare size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!draft.collapsed ? (
        <div className="floating-feedback-body">
          <div className="floating-feedback-issue-switcher">
            <label>
              <span>{isDutch ? 'Issue kiezen' : 'Choose issue'}</span>
              <select
                value={activeItem?.id ?? ''}
                onChange={(event) => setActiveItem(event.target.value)}
                aria-label={isDutch ? 'Kies feedback issue' : 'Choose feedback issue'}
              >
                {issueItems.map((item, index) => (
                  <option value={item.id} key={item.id}>
                    {`Issue ${index + 1}. · ${floatingFeedbackIssueTypeLabel(item.issueType, language)} · ${countFloatingScreenshots(item.screenshots)}/${maxFloatingScreenshotsPerIssue}${isFloatingFeedbackIssueResolved(item) ? ` · ${isDutch ? 'Opgelost' : 'Resolved'}` : ''}`}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={addIssue}>
              <Plus size={14} />
              {isDutch ? 'Nieuw issue' : 'New issue'}
            </button>
          </div>

          <div className="floating-feedback-editor-card">
            <div className="floating-feedback-meta">
              <strong className="floating-feedback-title-line">
                {isDutch
                  ? `Issue ${activeItemLabel} · ${activeSurfaceLabel}`
                  : `Issue ${activeItemLabel} · ${activeSurfaceLabel}`}
                {activeIssueResolved ? (
                  <span className="floating-feedback-resolved-badge">
                    <span aria-hidden="true">✓</span>
                    {activeResolutionLabel}
                  </span>
                ) : null}
              </strong>
              <small>
                {isDutch
                  ? `${activeIssueTypeLabel} · ${activeItem?.rating ?? 4}/5`
                  : `${activeIssueTypeLabel} · ${activeItem?.rating ?? 4}/5`}
                {' · '}
                {formatByteSize(screenshotTotalBytes)}
              </small>
              {activeSurfaceContext ? (
                <small className="floating-feedback-context">
                  {isDutch ? 'Context: ' : 'Context: '}
                  {activeSurfaceContext}
                </small>
              ) : null}
            </div>
            <small className={`floating-feedback-status-line${activeIssueResolved ? ' resolved' : ''}`}>
              {activeIssueResolved ? activeResolutionLabel : issueStatusLabel}
            </small>
            <textarea
              value={activeItem?.body ?? ''}
              onChange={(event) => updateActiveItem({ body: clampFloatingFeedbackText(event.target.value) })}
              placeholder={isDutch
                ? 'Typ hier meteen je feedback voor dit issue. Alles wordt lokaal bewaard en kan je met Verstuur syncen.'
                : 'Type feedback for this issue here. Everything is saved locally and can be synced with Submit.'}
            />
            <div className="floating-feedback-uploads">
              <button
                type="button"
                onClick={() => triggerFileUpload(activeItem?.id || '')}
                disabled={!activeItem}
              >
                <Upload size={14} />
                {isDutch ? 'Screenshot toevoegen' : 'Add screenshots'}
              </button>
              <small>
                {isDutch ? `${activeScreenshots.length}/${maxFloatingScreenshotsPerIssue} screenshots` : `${activeScreenshots.length}/${maxFloatingScreenshotsPerIssue} screenshots`}
              </small>
            <input
              className="floating-feedback-file-input"
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFilePick}
            />
            </div>
            <div className="floating-feedback-previews">
              {Array.from({ length: maxFloatingScreenshotsPerIssue }).map((_, index) => {
                const shot = activeScreenshots[index]
                const onDragOver = activeItem?.id ? handleScreenshotDragOver : undefined
                const onDrop = activeItem?.id
                  ? (event) => handleScreenshotDrop(event, index)
                  : undefined
                if (!shot) {
                  return (
                    <figure
                      className="floating-feedback-preview floating-feedback-preview-empty"
                      key={`floating-feedback-slot-${index}`}
                      onDragOver={onDragOver}
                      onDrop={onDrop}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          triggerSlotUpload(activeItem?.id || '', index)
                        }
                      }}
                    >
                      <button
                        type="button"
                        className="floating-feedback-preview-action"
                        onClick={() => triggerSlotUpload(activeItem?.id || '', index)}
                        aria-label={isDutch ? 'Screenshot toevoegen' : 'Add screenshot'}
                      >
                        <Upload size={14} />
                        {isDutch ? 'Leeg' : 'Empty'}
                      </button>
                    </figure>
                  )
                }

                return (
                  <figure
                    className={`floating-feedback-preview ${draggingScreenshotIndex === index ? 'dragging' : ''}`}
                    key={shot.id}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    draggable
                    onDragStart={(event) => {
                      setDraggingScreenshotIndex(index)
                      event.dataTransfer.setData('text/plain', String(index))
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => setDraggingScreenshotIndex(null)}
                  >
                    <img src={shot.dataUrl} alt={shot.name} />
                    <div className="floating-feedback-actions">
                      <button
                        type="button"
                        className="floating-feedback-preview-action"
                        onClick={() => triggerSlotUpload(activeItem?.id || '', index)}
                        aria-label={isDutch ? 'Vervang screenshot' : 'Replace screenshot'}
                      >
                        <Upload size={11} />
                      </button>
                      <button
                        type="button"
                        className="floating-feedback-preview-action"
                        onClick={() => removeScreenshot(activeItem.id, shot.id)}
                        aria-label={isDutch ? 'Verwijder screenshot' : 'Remove screenshot'}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <span className="floating-feedback-drag-handle" aria-hidden="true">
                      <MoreVertical size={12} />
                    </span>
                    <figcaption>
                      {shot.name} · {formatByteSize(shot.size)}
                    </figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
          <div className="floating-feedback-controls">
            <div className="floating-feedback-rating" aria-label={isDutch ? 'Feedbackscore' : 'Feedback rating'}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  className={activeItem?.rating === value ? 'active' : ''}
                  type="button"
                  onClick={() => updateActiveItem({ rating: value })}
                  key={value}
                  aria-pressed={activeItem?.rating === value}
                >
                  {value}
                </button>
              ))}
            </div>
            <select
              value={activeItem?.issueType ?? 'general'}
              onChange={(event) => updateActiveItem({ issueType: event.target.value })}
              aria-label={isDutch ? 'Feedbacktype' : 'Feedback type'}
            >
              {safeIssueOptions.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="floating-feedback-foot">
            <span>{sessionId ? statusCopy[displaySyncStatus] : (isDutch ? 'Wordt gesynct zodra je profiel start' : 'Syncs once your profile starts')}</span>
            <button
              className="floating-feedback-submit"
              type="button"
              onClick={submitActiveIssue}
              disabled={!activeItem || (!cleanBody && !activeIssueScreenshotCount)}
            >
              <Upload size={14} />
              {sessionId ? (isDutch ? 'Verstuur' : 'Submit') : (isDutch ? 'Bewaar lokaal' : 'Save locally')}
            </button>
          </div>
          <details className="floating-feedback-issue-drawer">
            <summary>{isDutch ? `Alle issues (${issueItems.length})` : `All issues (${issueItems.length})`}</summary>
            <div className="floating-feedback-issue-list">
              {issueItems.map((item, index) => (
                <button
                  className={`floating-feedback-issue ${item.id === activeItem?.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActiveItem(item.id)}
                  key={item.id}
                >
                  <span className="floating-feedback-issue-title">
                    <strong>{`Issue ${index + 1}. · ${floatingFeedbackIssueTypeLabel(item.issueType, language)}`}</strong>
                    {isFloatingFeedbackIssueResolved(item) ? (
                      <span className="floating-feedback-resolved-badge">
                        <span aria-hidden="true">✓</span>
                        {floatingFeedbackResolutionLabel(item, language)}
                      </span>
                    ) : null}
                  </span>
                  <small className="floating-feedback-issue-meta">
                    {item.surfaceLabel || item.surface || (isDutch ? 'Onbekende pagina' : 'Unknown page')}
                    {item.surfaceContext ? ` · ${item.surfaceContext}` : ''}
                  </small>
                  <small>{item.body ? item.body.slice(0, 78) : (isDutch ? 'Typ feedback voor dit issue...' : 'Type feedback for this issue...')}</small>
                  <small className="floating-feedback-issue-meta">
                    {countFloatingScreenshots(item.screenshots)} / {maxFloatingScreenshotsPerIssue} screenshots
                  </small>
                </button>
              ))}
            </div>
          </details>
        </div>
      ) : null}
    </section>
  )
}

function BetaLaunchPanel({
  betaOverview,
  providerStatus,
  inviteLink,
  copyInviteLink,
  createLocalBetaTester,
  cleanupBetaData,
  setActiveView,
  language = 'English',
}) {
  const isDutch = isDutchLanguage(language)
  const totals = betaOverview?.totals ?? {}
  const checklist = betaOverview?.providerStatus?.checklist ?? providerStatus?.checklist ?? []
  const paidServices = providerStatus?.paidServices ?? []
  const launchSteps = [
    {
      id: 'free',
      label: isDutch ? 'Gratis stack' : 'Zero-cost stack',
      detail: paidServices.length
        ? `${isDutch ? 'Betaalde key gevonden' : 'Paid key detected'}: ${paidServices.join(', ')}`
        : isDutch
          ? 'Render Free, Supabase Free, geen betaalde AI. Resend Free kan echte account-mails sturen.'
          : 'Render Free, Supabase Free, no paid AI. Resend Free can send real account emails.',
      ready: !paidServices.length,
    },
    {
      id: 'invite',
      label: isDutch ? 'Publieke invite-link' : 'Public invite link',
      detail: inviteLink
        ? isDutch ? 'Klaar om naar testers te sturen.' : 'Ready to send to testers.'
        : isDutch ? 'Maak een account om je beta-link te genereren.' : 'Create an account to generate your beta link.',
      ready: Boolean(inviteLink) || isChecklistReady(checklist, 'publicInvite'),
    },
    {
      id: 'pool',
      label: isDutch ? 'Testerpool' : 'Tester pool',
      detail: isDutch
        ? `${totals.activeUsers ?? 0} actieve gebruikers, ${totals.invitesAccepted ?? 0} geaccepteerde invites.`
        : `${totals.activeUsers ?? 0} active users, ${totals.invitesAccepted ?? 0} accepted invites.`,
      ready: (totals.activeUsers ?? 0) > 1 || (totals.invitesAccepted ?? 0) > 0,
    },
    {
      id: 'clean',
      label: isDutch ? 'Propere QA-data' : 'Clean QA data',
      detail: isDutch
        ? `${totals.testAccounts ?? 0} interne testprofielen gevonden.`
        : `${totals.testAccounts ?? 0} internal test profiles detected.`,
      ready: !(totals.testAccounts ?? 0),
    },
    {
      id: 'privacy',
      label: isDutch ? 'Private learning' : 'Private learning',
      detail: isDutch
        ? 'Memory-toestemming en aandachtssignalen blijven onder controle van de gebruiker.'
        : 'Memory consent and attention signals stay user-controlled.',
      ready: isChecklistReady(checklist, 'database') || isChecklistReady(checklist, 'storage'),
    },
  ]

  return (
    <section className="beta-launch-panel">
      <div className="beta-launch-copy">
        <span>
          <Sparkles size={18} />
          {isDutch ? 'Publieke beta-flow' : 'Public beta path'}
        </span>
        <h2>{isDutch ? 'Klaar om met echte mensen te testen' : 'Ready to test with real people'}</h2>
        <p>
          {isDutch
            ? 'Kopieer de link, voeg eventueel een testprofiel toe voor directe data, en loop daarna door Radar, berichten en AI Memory als nieuwe gebruiker.'
            : 'Copy the link, add a sample tester if you want instant data, then walk through Radar, messages and AI Memory like a new user.'}
        </p>
      </div>
      <div className="beta-launch-actions">
        <button type="button" onClick={copyInviteLink}>
          <Link2 size={17} />
          {isDutch ? 'Kopieer invite' : 'Copy invite'}
        </button>
        <button type="button" onClick={createLocalBetaTester}>
          <UserRound size={17} />
          {isDutch ? 'Voeg tester toe' : 'Add tester'}
        </button>
        <button type="button" onClick={() => setActiveView('discover')}>
          <Compass size={17} />
          {isDutch ? 'Open Radar' : 'Open Radar'}
        </button>
        <button type="button" onClick={() => setActiveView('memory')}>
          <Brain size={17} />
          {isDutch ? 'Privacybord' : 'Privacy board'}
        </button>
        <button type="button" onClick={cleanupBetaData}>
          <Trash2 size={17} />
          {isDutch ? 'Testdata wissen' : 'Clean tests'}
        </button>
      </div>
      <div className="beta-launch-steps">
        {launchSteps.map((step) => (
          <p className={step.ready ? 'ready' : ''} key={step.id}>
            <i />
            <span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </span>
          </p>
        ))}
      </div>
    </section>
  )
}

function ProfileToolView({
  profile,
  setProfile,
  orientation,
  setOrientation,
  linkedTools,
  toggleTool,
  aiInput,
  setAiInput,
  submitAiMemory,
  notes,
  deleteMemoryNote,
  attentionSignals,
  captureProfileSignal,
  addProfilePhoto,
  photos = [],
  removePhoto = () => {},
  reorderPhoto = () => {},
  saveProfileChanges,
}) {
  const toolCopy = {
    kicker: 'Your AI profile',
    title: 'Teach MatchPulse who you are',
    body: 'Say anything and watch the live neural map reshape your values, attraction, boundaries, rhythm, and sources.',
    addPhoto: 'Add',
    fields: {
      name: 'Name',
      age: 'Age',
      email: 'Email',
      mobile: 'Mobile',
      language: 'Language',
      bio: 'Bio',
    },
    signals: 'Compatibility signals',
    editable: 'Editable',
    aiTool: 'AI Profile Tool',
    aiToolHint: 'Type freely. The map grows before you save it to memory.',
    extracted: 'Extracted signal clouds',
    extractedEmpty: 'Type in the AI box or your bio. Signals will appear here and pull the neural map into clusters.',
    placeholder: 'Example: I like confident people, but I need kindness and clear plans.',
    voice: 'Voice',
    import: 'Import',
    save: 'Save to memory',
    privacy: 'Privacy dating settings',
    privacyNote: 'Gender and photo visibility are optional controls for reciprocal matching. They are not shown publicly unless you decide to share them.',
    iAm: 'I am',
    showMe: 'Show me',
    photoVisibility: 'Photo visibility',
    saveRecalculate: 'Save and recalculate',
    linkedSources: 'Linked sources',
    linked: 'Linked',
    link: 'Link',
    liveMemory: 'Live memory',
    groups: {
      values: ['Values', 'What should feel aligned.'],
      dealbreakers: ['Dealbreakers', 'What should never be ignored.'],
      visualTaste: ['Attraction taste', 'The energy and look you notice.'],
      dateRhythm: ['Date rhythm', 'How plans should unfold.'],
    },
    ...appText(profile?.language).profileTool,
  }
  const [dismissedProfileSignals, setDismissedProfileSignals] = useState([])
  const [photoPositions, setPhotoPositions] = useState({})
  const [photoZooms, setPhotoZooms] = useState({})
  const [draggingProfilePhotoIndex, setDraggingProfilePhotoIndex] = useState(null)
  const photoDragRef = useRef(null)
  const memoryCorpus = useMemo(
    () => normalizeMemoryNotes(notes).map((note) => note.text).join(' '),
    [notes],
  )
  const rawLiveSignals = useMemo(
    () => extractProfileSignals(`${profile.bio ?? ''} ${aiInput} ${memoryCorpus}`),
    [aiInput, memoryCorpus, profile.bio],
  )
  const liveSignals = useMemo(
    () => rawLiveSignals.filter((signal) => !dismissedProfileSignals.includes(signal.id)),
    [dismissedProfileSignals, rawLiveSignals],
  )
  const profileAttractionDna = useMemo(
    () => buildProfileAttractionDna({ profile, attentionSignals, notes, liveSignals }),
    [attentionSignals, liveSignals, notes, profile],
  )
  const profilePhotos = normalizeOnboardingPhotos(photos.length ? photos : [profile.photo])
  const activePhotoPosition = photoPositions[profile.photo] ?? { x: 50, y: 50 }
  const neuralMap = useMemo(
    () =>
      buildNeuralProfile({
        profile,
        orientation,
        linkedTools,
        notes,
        aiInput,
        liveSignals,
        attentionSignals,
        attractionDna: profileAttractionDna,
        hasSignalText: Boolean(`${profile.bio ?? ''} ${aiInput}`.trim()),
      }),
    [aiInput, attentionSignals, linkedTools, liveSignals, notes, orientation, profile, profileAttractionDna],
  )

  function updateField(field, value) {
    if (field === 'bio') setDismissedProfileSignals([])
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function readPreferences(current) {
    return {
      values: [...(current.preferences?.values?.length ? current.preferences.values : viewer.preferences.values)],
      dealbreakers: [
        ...(current.preferences?.dealbreakers?.length
          ? current.preferences.dealbreakers
          : viewer.preferences.dealbreakers),
      ],
      visualTaste: [
        ...(current.preferences?.visualTaste?.length
          ? current.preferences.visualTaste
          : viewer.preferences.visualTaste),
      ],
      dateRhythm: [
        ...(current.preferences?.dateRhythm?.length
          ? current.preferences.dateRhythm
          : viewer.preferences.dateRhythm),
      ],
    }
  }

  function removeSignalEverywhere(signal) {
    setDismissedProfileSignals((current) => [...new Set([...current, signal.id])])
    setAiInput((current) => removeSignalFromText(current, signal.label))
    setProfile((current) => {
      const preferences = readPreferences(current)
      Object.keys(preferences).forEach((group) => {
        preferences[group] = preferences[group].filter(
          (item) => !signalMatchesText(item, signal.label),
        )
        if (!preferences[group].length) {
          preferences[group] = [current.language === 'Nederlands' ? 'Nieuw signaal' : 'New signal']
        }
      })

      return {
        ...current,
        bio: removeSignalFromText(current.bio ?? '', signal.label),
        preferences,
      }
    })
  }

  function pickProfilePhoto(photo) {
    setProfile((current) => ({ ...current, photo }))
  }

  function removeProfilePhoto(index, photo) {
    removePhoto(index)
    if (profile.photo === photo) {
      const nextPhoto = profilePhotos.filter((item) => item !== photo)[0] || viewer.photo
      pickProfilePhoto(nextPhoto)
    }
  }

  function profilePhotoStyle(photo = profile.photo) {
    const position = photoPositions[photo] ?? { x: 50, y: 50 }
    const zoom = photoZooms[photo] ?? 1
    return {
      objectPosition: `${position.x}% ${position.y}%`,
      transform: `scale(${zoom})`,
      transformOrigin: `${position.x}% ${position.y}%`,
    }
  }

  function setProfilePhotoPosition(photo, nextPosition) {
    setPhotoPositions((current) => {
      const currentPosition = current[photo] ?? { x: 50, y: 50 }
      const resolvedPosition = typeof nextPosition === 'function'
        ? nextPosition(currentPosition)
        : nextPosition
      return {
        ...current,
        [photo]: {
          x: Math.round(clamp(resolvedPosition.x, 0, 100)),
          y: Math.round(clamp(resolvedPosition.y, 0, 100)),
        },
      }
    })
  }

  function setProfilePhotoZoom(photo, value) {
    const zoom = clamp(Number.parseFloat(value) || 1, 1, 1.8)
    setPhotoZooms((current) => ({ ...current, [photo]: zoom }))
  }

  function startProfilePhotoDrag(event) {
    photoDragRef.current = {
      photo: profile.photo,
      startX: event.clientX,
      startY: event.clientY,
      ...activePhotoPosition,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function dragProfilePhoto(event) {
    const drag = photoDragRef.current
    if (!drag || drag.photo !== profile.photo) return

    setProfilePhotoPosition(profile.photo, {
      x: drag.x - (event.clientX - drag.startX) * 0.12,
      y: drag.y - (event.clientY - drag.startY) * 0.12,
    })
  }

  function stopProfilePhotoDrag() {
    photoDragRef.current = null
  }

  function handleProfilePhotoDragStart(event, index) {
    setDraggingProfilePhotoIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function handleProfilePhotoDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  function handleProfilePhotoDrop(event, targetIndex) {
    event.preventDefault()
    const sourceIndex = Number(event.dataTransfer.getData('text/plain'))
    if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDraggingProfilePhotoIndex(null)
      return
    }
    reorderPhoto(sourceIndex, targetIndex)
    setDraggingProfilePhotoIndex(null)
  }

  function handleProfilePhotoDragEnd() {
    setDraggingProfilePhotoIndex(null)
  }

  function updateAiInput(value) {
    setDismissedProfileSignals([])
    setAiInput(value)
  }

  function neuralNodePreferenceGroup(node = {}) {
    const kind = String(node.kind || '')
    if (kind.includes('attraction') || kind.includes('dna')) return 'visualTaste'
    if (kind.includes('boundaries')) return 'dealbreakers'
    if (kind.includes('rhythm')) return 'dateRhythm'
    return 'values'
  }

  function neuralNodeTagText(node = {}) {
    return String(node.value || node.label || '')
      .replace(/\s*·\s*\d+%/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 56) || String(node.label || 'Nieuw signaal')
  }

  function addNeuralNodeAsProfileTag(node) {
    const group = neuralNodePreferenceGroup(node)
    const tag = neuralNodeTagText(node)
    setProfile((current) => addProfilePreferenceTag(current, tag, group))
  }

  return (
    <section className="profile-tool-screen">
      <ScreenHeading
        kicker={toolCopy.kicker}
        title={toolCopy.title}
        body={toolCopy.body}
      />

      <div className="profile-tool-grid">
        <section className="profile-card">
          <div className="profile-photo-editor">
            <div
              className="profile-photo-stage"
              onPointerDown={startProfilePhotoDrag}
              onPointerMove={dragProfilePhoto}
              onPointerUp={stopProfilePhotoDrag}
              onPointerCancel={stopProfilePhotoDrag}
              title={profile.language === 'Nederlands' ? 'Sleep de foto om hem goed te positioneren' : 'Drag the photo to position it'}
            >
              <img src={profile.photo} alt="" style={profilePhotoStyle(profile.photo)} draggable="false" />
              <span>{profile.language === 'Nederlands' ? 'Sleep om te positioneren' : 'Drag to position'}</span>
            </div>
            <label className="profile-photo-zoom-control">
              <span>{profile.language === 'Nederlands' ? 'Zoom' : 'Zoom'}</span>
              <input
                type="range"
                min="1"
                max="1.8"
                step="0.05"
                value={photoZooms[profile.photo] ?? 1}
                onChange={(event) => setProfilePhotoZoom(profile.photo, event.target.value)}
              />
            </label>
            <div className="profile-photo-strip" aria-label="Profile photo choices">
              {profilePhotos.map((photo, index) => (
                <span
                  className={[
                    'profile-photo-choice',
                    draggingProfilePhotoIndex === index ? 'dragging' : '',
                  ].filter(Boolean).join(' ')}
                  draggable={profilePhotos.length > 1}
                  onDragStart={(event) => handleProfilePhotoDragStart(event, index)}
                  onDragOver={handleProfilePhotoDragOver}
                  onDrop={(event) => handleProfilePhotoDrop(event, index)}
                  onDragEnd={handleProfilePhotoDragEnd}
                  key={photo}
                >
                  <button
                    className={profile.photo === photo ? 'profile-photo-choice-main active' : 'profile-photo-choice-main'}
                    type="button"
                    onClick={() => pickProfilePhoto(photo)}
                    aria-label="Use this profile photo"
                  >
                    <img src={photo} alt="" style={profilePhotoStyle(photo)} />
                  </button>
                  <button
                    className="profile-photo-remove"
                    type="button"
                    onClick={() => removeProfilePhoto(index, photo)}
                    aria-label={profile.language === 'Nederlands' ? 'Verwijder foto' : 'Remove photo'}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
              <label className="profile-photo-upload">
                <Upload size={15} />
                {toolCopy.addPhoto}
                <input type="file" accept="image/*" onChange={addProfilePhoto} />
              </label>
            </div>
          </div>
          <div className="profile-fields">
            <label>
              {toolCopy.fields.name}
              <input value={profile.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <label>
              {toolCopy.fields.age}
              <input value={profile.age} onChange={(event) => updateField('age', event.target.value)} />
            </label>
            <label className="wide">
              {toolCopy.fields.email}
              <input value={profile.email} onChange={(event) => updateField('email', event.target.value)} />
            </label>
            <label className="wide">
              {toolCopy.fields.mobile}
              <input
                inputMode="tel"
                value={profile.phone ?? ''}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </label>
            <label className="wide">
              {toolCopy.fields.language}
              <select
                value={profile.language ?? viewer.language}
                onChange={(event) => updateField('language', event.target.value)}
              >
                {languages.map((language) => (
                  <option value={language} key={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              {toolCopy.fields.bio}
              <textarea value={profile.bio} onChange={(event) => updateField('bio', event.target.value)} />
            </label>
          </div>
        </section>

        <section className="ai-tool">
          <div className="panel-title">
            <Brain size={22} />
            <div>
              <h2>{toolCopy.aiTool}</h2>
              <small>{toolCopy.aiToolHint}</small>
            </div>
          </div>
          <NeuralMindMap
            map={neuralMap}
            profile={profile}
            onRemoveSignal={removeSignalEverywhere}
            onAddProfileTag={addNeuralNodeAsProfileTag}
          />
          <ProfileInsightControlPanel
            signals={liveSignals}
            profile={profile}
            onRemoveSignal={removeSignalEverywhere}
            onAddProfileTag={addNeuralNodeAsProfileTag}
          />
          <form className="ai-input" onSubmit={submitAiMemory}>
            <textarea
              value={aiInput}
              onChange={(event) => updateAiInput(event.target.value)}
              placeholder={toolCopy.placeholder}
            />
            <div>
              <button type="button" onClick={() => captureProfileSignal('voice')}>
                <Mic size={17} />
                {toolCopy.voice}
              </button>
              <button type="button" onClick={() => captureProfileSignal('import')}>
                <Upload size={17} />
                {toolCopy.import}
              </button>
              <button type="submit">
                <Send size={17} />
                {toolCopy.save}
              </button>
            </div>
          </form>
        </section>

        <section className="preference-card">
          <h2>{toolCopy.privacy}</h2>
          <p className="privacy-settings-note">
            {toolCopy.privacyNote}
          </p>
          <label className="privacy-select-line">
            <span>{toolCopy.iAm}</span>
            <select
              value={normalizeGenderIdentity(profile.genderIdentity)}
              onChange={(event) => updateField('genderIdentity', event.target.value)}
            >
              {genderIdentityOptions.map((option) => (
                <option value={option} key={option}>
                  {displayOption(option, profile.language)}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="segmented-label">{toolCopy.showMe}</span>
            <Segmented
              value={orientation}
              options={interestPreferences}
              labels={Object.fromEntries(interestPreferences.map((option) => [option, displayOption(option, profile.language)]))}
              onChange={setOrientation}
            />
            <span className="segmented-label">{toolCopy.photoVisibility}</span>
            <Segmented
              value={normalizePhotoPrivacy(profile.photoPrivacy)}
              options={photoPrivacyOptions.map((option) => option.id)}
              labels={Object.fromEntries(photoPrivacyOptions.map((option) => [option.id, displayOption(option.id, profile.language)]))}
              onChange={(value) => updateField('photoPrivacy', value)}
            />
          </div>
          <button type="button" onClick={saveProfileChanges}>
            {toolCopy.saveRecalculate}
          </button>
        </section>

        <section className="tools-card">
          <div className="panel-title inline">
            <Link2 size={20} />
            <h2>{toolCopy.linkedSources}</h2>
          </div>
          <div className="tool-list">
            {linkedTools.map((tool) => (
              <button
                className={tool.connected ? 'connected' : ''}
                type="button"
                onClick={() => toggleTool(tool.id)}
                key={tool.id}
              >
                <span>
                  <strong>{tool.label}</strong>
                  <small>{tool.detail}</small>
                </span>
                <em>{tool.connected ? toolCopy.linked : toolCopy.link}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="live-memory-card">
          <div className="panel-title inline">
            <WandSparkles size={20} />
            <h2>{toolCopy.liveMemory}</h2>
          </div>
          <div className="memory-list">
            {normalizeMemoryNotes(notes).slice(0, 5).map((note) => (
              <p key={note.id}>
                <i />
                <span>
                  {note.text}
                  <small>{memoryVisibilityCopy(note.visibility, profile.language).label}</small>
                </span>
                <button
                  type="button"
                  onClick={() => deleteMemoryNote(note)}
                  aria-label={profile.language === 'Nederlands' ? 'Verwijder memory' : 'Delete memory'}
                >
                  <X size={13} />
                </button>
              </p>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function promptIdeaLabel(prompt, language = viewer.language) {
  if (!isDutchLanguage(language)) return prompt.label
  return {
    'green-flag': 'Green flag',
    'easy-date': 'Makkelijke date',
    'visual-taste': 'Aantrekkingssmaak',
    boundary: 'Grens',
  }[prompt.id] ?? prompt.label
}

function profileInsightCategory(signal = {}, language = viewer.language) {
  const isDutch = isDutchLanguage(language)
  const label = signalLabel(signal, language).toLowerCase()
  if (/cat|kat|travel|reis|muziek|music|photo|foto|ai|coffee|koffie|walk|wandelen/.test(label)) {
    return isDutch ? 'Interesses' : 'Interests'
  }
  if (signal.kind === 'boundaries' || /communicatie|communication|arrogance|arrogantie|dealbreaker|grens/.test(label)) {
    return isDutch ? 'Afknappers en grenzen' : 'Dealbreakers and boundaries'
  }
  if (signal.kind === 'rhythm' || /date|ritme|koffie|coffee|plan|tempo|walk/.test(label)) {
    return isDutch ? 'Date voorkeur' : 'Date preference'
  }
  if (signal.kind === 'attraction') {
    return isDutch ? 'Aantrekkingssmaak' : 'Attraction taste'
  }
  if (signal.kind === 'identity') {
    return isDutch ? 'Identiteit en beroep' : 'Identity and work'
  }
  if (signal.kind === 'interests') {
    return isDutch ? 'Interesses' : 'Interests'
  }
  if (signal.kind === 'personality') {
    return isDutch ? 'Persoonlijkheid' : 'Personality'
  }
  if (signal.kind === 'intent') {
    return isDutch ? 'Datingdoel' : 'Dating intent'
  }
  if (/rustig|creative|creatief|ambitious|ambitieus|introvert|extravert|humor/.test(label)) {
    return isDutch ? 'Persoonlijkheid' : 'Personality'
  }
  return isDutch ? 'Waarden' : 'Values'
}

function ProfileInsightControlPanel({ signals = [], profile, onRemoveSignal, onAddProfileTag }) {
  const language = profile?.language ?? viewer.language
  const isDutch = isDutchLanguage(language)
  const [visibility, setVisibility] = useState({})
  const uniqueSignals = signals.reduce((items, signal) => {
    const key = signalLabel(signal, language).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (!key || items.some((item) => item.key === key)) return items
    return [...items, { key, signal }]
  }, [])
  const groups = uniqueSignals.reduce((collection, item) => {
    const category = profileInsightCategory(item.signal, language)
    collection[category] = [...(collection[category] ?? []), item.signal]
    return collection
  }, {})
  const fallbackText = isDutch
    ? 'Typ in de AI-box over waarden, interesses, katten, reizen, koffie, grenzen of date-ritme. MatchPulse splitst dit hier automatisch op.'
    : 'Type in the AI box about values, interests, cats, travel, coffee, boundaries or date rhythm. MatchPulse will split it here automatically.'

  return (
    <section className="profile-insight-control">
      <div className="panel-title inline">
        <Eye size={19} />
        <h2>{isDutch ? 'AI-inzichten met controle' : 'AI insights with control'}</h2>
        <strong>{uniqueSignals.length}</strong>
      </div>
      <p>
        {isDutch
          ? 'Elk gevonden inzicht krijgt een categorie. Jij kiest wat op je profiel komt en wat alleen de AI mag gebruiken.'
          : 'Every detected insight gets a category. You choose what appears on your profile and what stays AI-only.'}
      </p>
      {uniqueSignals.length ? (
        <div className="profile-insight-groups">
          {Object.entries(groups).map(([category, groupSignals]) => (
            <article key={category}>
              <h3>{category}</h3>
              {groupSignals.map((signal) => {
                const currentVisibility = visibility[signal.id] ?? 'ai'
                return (
                  <div className="profile-insight-row" key={signal.id}>
                    <span>
                      <strong>{signalLabel(signal, language)}</strong>
                      <small>{isDutch ? 'Standaard: alleen AI' : 'Default: AI only'}</small>
                    </span>
                    <div>
                      <button
                        className={currentVisibility === 'profile' ? 'active' : ''}
                        type="button"
                        onClick={() => {
                          setVisibility((current) => ({ ...current, [signal.id]: 'profile' }))
                          onAddProfileTag({ ...signal, value: signalLabel(signal, language) })
                        }}
                      >
                        {isDutch ? 'Publiek' : 'Public'}
                      </button>
                      <button
                        className={currentVisibility === 'ai' ? 'active' : ''}
                        type="button"
                        onClick={() => setVisibility((current) => ({ ...current, [signal.id]: 'ai' }))}
                      >
                        {isDutch ? 'Alleen AI' : 'AI only'}
                      </button>
                      <button type="button" onClick={() => onRemoveSignal(signal)}>
                        {isDutch ? 'Verwijder' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </article>
          ))}
        </div>
      ) : (
        <p className="profile-insight-empty">{fallbackText}</p>
      )}
    </section>
  )
}

function NeuralMindMap({ map, profile, onRemoveSignal, onAddProfileTag = () => {} }) {
  const language = profile.language ?? viewer.language
  const isDutch = isDutchLanguage(language)
  const [nodeVisibility, setNodeVisibility] = useState({})
  const [profileTags, setProfileTags] = useState({})

  function toggleNodeVisibility(node) {
    const isPublic = nodeVisibility[node.id] === true || profileTags[node.id]
    setNodeVisibility((current) => ({ ...current, [node.id]: !isPublic }))
    if (!isPublic) addNodeAsProfileTag(node)
  }

  function addNodeAsProfileTag(node) {
    setProfileTags((current) => ({ ...current, [node.id]: true }))
    onAddProfileTag(node)
  }

  return (
    <section className="neural-map" aria-label="Live AI profile neural map">
      <div className="neural-map-top">
        <span>
          <Activity size={16} />
          {isDutch ? 'Live neurale map' : 'Live Neural Map'}
        </span>
        <strong>{map.learning}% {isDutch ? 'geleerd' : 'learning'}</strong>
      </div>

      <div className="neural-canvas">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="signalLine" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f0645b" stopOpacity="0.08" />
              <stop offset="52%" stopColor="#f0645b" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#7ac6ab" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {map.nodes.map((node) => (
            <path
              d={`M 50 50 C ${node.x} 50, 50 ${node.y}, ${node.x} ${node.y}`}
              key={`line-${node.id}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="neural-core">
          <img src={profile.photo} alt="" />
          <span>{profile.name?.split(' ')[0] || (isDutch ? 'Jouw' : 'Your')} model</span>
          <strong>{map.pulseLabel}</strong>
        </div>

        <div className="neural-node-board">
          {map.nodes.map((node) => {
            const isProfileTag = Boolean(profileTags[node.id])
            const profileVisible = nodeVisibility[node.id] === true || isProfileTag
            return (
              <article
                className={`neural-node ${node.kind} ${node.active ? 'active' : ''} ${profileVisible ? '' : 'profile-hidden'}`}
                style={{ '--node-x': `${node.x}%`, '--node-y': `${node.y}%`, '--node-size': `${node.size}px` }}
                key={node.id}
              >
                <i />
                <span>{node.label}</span>
                <strong>{node.value}</strong>
                <div className="neural-node-actions">
                  <button
                    className={profileVisible ? 'active' : ''}
                    type="button"
                    onClick={() => toggleNodeVisibility(node)}
                    aria-pressed={profileVisible}
                    aria-label={isDutch ? 'Zichtbaarheid wisselen' : 'Toggle visibility'}
                  >
                    <Eye size={13} />
                    {profileVisible ? (isDutch ? 'Publiek' : 'Public') : (isDutch ? 'Alleen AI' : 'AI only')}
                  </button>
                  <button
                    className={isProfileTag ? 'active' : ''}
                    type="button"
                    onClick={() => addNodeAsProfileTag(node)}
                    aria-pressed={isProfileTag}
                  >
                    <Plus size={13} />
                    {isProfileTag ? (isDutch ? 'Profieltag' : 'Profile tag') : (isDutch ? 'Neem op' : 'Add tag')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="neural-keywords">
        {map.keywords.map((keyword) => (
          <button type="button" onClick={() => onRemoveSignal(keyword)} key={keyword.id}>
            <span>{signalLabel(keyword, language)}</span>
            <X size={12} />
          </button>
        ))}
      </div>
    </section>
  )
}

function buildNeuralProfile({
  profile,
  orientation,
  linkedTools,
  notes,
  aiInput,
  liveSignals,
  attentionSignals = [],
  attractionDna,
  hasSignalText,
}) {
  const language = profile.language ?? viewer.language
  const isDutch = isDutchLanguage(language)
  const connectedTools = linkedTools.filter((tool) => tool.connected)
  const liveKeywords = extractKeywords(aiInput)
  const liveText = aiInput.trim()
  const normalizedNotes = normalizeMemoryNotes(notes)
  const firstMemory = normalizedNotes[0] ? memoryThoughtText(normalizedNotes[0]) : 'Still learning your pattern'
  const signalNodes = liveSignals.slice(0, 24).map((signal, index) => {
    const anchor = signalAnchors[signal.kind] ?? signalAnchors.live
    const columnOffset = ((index % 3) - 1) * 8
    const rowOffset = Math.floor(index / 3) * 7
    return {
      id: `signal-${signal.id}`,
      label: isDutch
        ? ({
            values: 'waarde',
            attraction: 'aantrekking',
            rhythm: 'ritme',
            boundaries: 'grens',
          }[signal.kind] ?? signal.kind)
        : signal.kind,
      value: signalLabel(signal, language),
      kind: `signal signal-${signal.kind}`,
      x: clamp(anchor.x + columnOffset, 14, 86),
      y: clamp(anchor.y + rowOffset, 16, 84),
      size: 104,
      active: true,
    }
  })
  const attentionNodes = attentionSignals.slice(0, 4).map((signal, index) => {
    const angle = (-40 + index * 28) * (Math.PI / 180)
    const radius = 21 + index * 2
    return {
      id: `attention-${signal.id}`,
      label: 'Private attention',
      value: signal.label.replace(/^Style pull:\s*|^Profile pull:\s*|^Chat rhythm:\s*/i, ''),
      kind: 'signal signal-attention',
      x: clamp(50 + Math.cos(angle) * radius, 16, 84),
      y: clamp(51 + Math.sin(angle) * radius, 18, 82),
      size: 116,
      active: true,
    }
  })
  const attractionDnaNodes = (attractionDna?.axes ?? []).slice(0, 3).map((axis, index) => ({
      id: `dna-${axis.id}`,
    label: isDutch ? 'Aantrekkings-DNA' : 'Attraction DNA',
    value: `${dnaAxisCopy(axis, language).label} · ${axis.strength}%`,
    kind: 'signal signal-dna',
    x: clamp(67 + index * 6, 18, 84),
    y: clamp(38 + index * 9, 18, 82),
    size: 122,
    active: axis.strength >= 70,
  }))
  const learning = Math.min(
    99,
    Math.max(
      74,
      profile.profileCompletion - 7 + connectedTools.length * 2 + Math.min(40, liveSignals.length) + attentionSignals.length
        + (attractionDna?.axes?.length ?? 0),
    ),
  )

  return {
    learning,
    pulseLabel: liveText ? (isDutch ? 'wordt nu gevormd' : 'rewiring now') : (isDutch ? 'stabiele memory' : 'stable memory'),
    keywords: liveSignals.length
      ? liveSignals.slice(0, 48)
      : hasSignalText
        ? []
        : extractProfileSignals(liveKeywords.join(' ') || 'honesty calm chemistry ambition city energy'),
    nodes: [
      {
        id: 'values',
        label: isDutch ? 'Waarden' : 'Values',
        value: signalValueText(profile.preferences.values.slice(0, 2).join(' + '), language),
        kind: 'values',
        x: 18,
        y: 24,
        size: 128,
        active: includesAny(liveText, ['value', 'honest', 'kind', 'ambitious', 'ambitieus']),
      },
      {
        id: 'attraction',
        label: isDutch ? 'Aantrekking' : 'Attraction',
        value: signalValueText(profile.preferences.visualTaste.slice(0, 2).join(' + '), language),
        kind: 'attraction',
        x: 77,
        y: 22,
        size: 138,
        active: includesAny(liveText, ['attract', 'mooi', 'confident', 'warm', 'kindness']),
      },
      {
        id: 'boundaries',
        label: isDutch ? 'Grenzen' : 'Boundaries',
        value: signalValueText(profile.preferences.dealbreakers.slice(0, 2).join(' + '), language),
        kind: 'boundaries',
        x: 18,
        y: 72,
        size: 134,
        active: includesAny(liveText, ['need', 'no ', 'niet', 'boundary', 'clear', 'respect']),
      },
      {
        id: 'rhythm',
        label: isDutch ? 'Date-ritme' : 'Date rhythm',
        value: signalValueText(profile.preferences.dateRhythm.slice(0, 2).join(' + '), language),
        kind: 'rhythm',
        x: 78,
        y: 72,
        size: 130,
        active: includesAny(liveText, ['date', 'plan', 'avond', 'trip', 'coffee', 'rustig']),
      },
      {
        id: 'intent',
        label: isDutch ? 'Ontdekking' : 'Discovery',
        value: `${displayOption(orientation, language)} · ${isDutch ? 'wederzijds' : 'reciprocal'}`,
        kind: 'intent',
        x: 50,
        y: 16,
        size: 118,
        active: includesAny(liveText, ['match', 'relatie', 'partner', 'men', 'women', 'iedereen']),
      },
      {
        id: 'sources',
        label: isDutch ? 'Bronnen' : 'Sources',
        value: `${connectedTools.length} ${isDutch ? 'gekoppeld' : 'linked'}`,
        kind: 'sources',
        x: 50,
        y: 85,
        size: 114,
        active: connectedTools.length > 3,
      },
      {
        id: 'live',
        label: liveText ? (isDutch ? 'Live gedachte' : 'Live thought') : (isDutch ? 'Laatste memory' : 'Latest memory'),
        value: liveText ? summarizeThought(liveText) : summarizeThought(firstMemory),
        kind: 'live',
        x: liveText ? 75 : 30,
        y: liveText ? 50 : 51,
        size: liveText ? 152 : 124,
        active: Boolean(liveText),
      },
      ...signalNodes,
      ...attentionNodes,
      ...attractionDnaNodes,
    ],
  }
}

function SignalCloud({ signals, onRemove, title, emptyText, language = viewer.language }) {
  const isDutch = isDutchLanguage(language)
  return (
    <section className="signal-cloud" aria-label={title}>
      <div className="signal-cloud-title">
        <Sparkles size={15} />
        <span>{title}</span>
      </div>
      {signals.length ? (
        <div className="signal-cloud-list">
          {signals.map((signal) => (
            <button
              className={`signal-chip ${signal.kind}`}
              type="button"
              onClick={() => onRemove(signal)}
              key={signal.id}
              aria-label={isDutch ? `Verwijder ${signalLabel(signal, language)}` : `Remove ${signal.label}`}
              title={isDutch ? 'Verwijder signaal' : 'Remove signal'}
            >
              <span className="signal-chip-label">{signalLabel(signal, language)}</span>
              <span className="signal-chip-remove" aria-hidden="true">
                <X size={11} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p>{emptyText}</p>
      )}
    </section>
  )
}

function PrivateAttentionPanel({ signals = [], onDelete, onClear, language = viewer.language }) {
  const isDutch = language === 'Nederlands'
  return (
    <section className="private-attention-panel" aria-label="Private attention learning">
      <div className="private-attention-head">
        <span>
          <Activity size={17} />
          {isDutch ? 'Private aandacht learning' : 'Private attention learning'}
        </span>
        <strong>{isDutch ? 'Alleen jouw algoritme' : 'Only your algorithm'}</strong>
      </div>
      <p>
        {isDutch
          ? 'MatchPulse mag leren van veilige signalen zoals kijktijd, foto-interesse en chatritme. Ruwe timing wordt niet aan anderen getoond.'
          : 'MatchPulse can learn from safe signals like profile dwell, photo curiosity and chat rhythm. Raw timing is not shown to other people.'}
      </p>
      {signals.length ? (
        <>
          <div className="attention-signal-list">
            {signals.map((signal) => (
              <article key={signal.id}>
                <span>
                  <strong>{attentionSignalLabel(signal, language)}</strong>
                  <small>
                    {signal.body}
                    {signal.count > 1 ? ` · ${signal.count} ${isDutch ? 'signalen' : 'signals'}` : ''}
                    {signal.seconds ? ` · ${signal.seconds}s ${isDutch ? 'prive kijktijd' : 'private dwell'}` : ''}
                  </small>
                </span>
                <em>{signal.visibility}</em>
                <button
                  type="button"
                  onClick={() => onDelete(signal.id)}
                  aria-label={isDutch
                    ? `Verwijder ${attentionSignalLabel(signal, language)}`
                    : `Delete ${signal.label}`}
                >
                  <X size={14} />
                </button>
              </article>
            ))}
          </div>
          <button className="attention-clear" type="button" onClick={onClear}>
            <Trash2 size={15} />
            {isDutch ? 'Wis private signalen' : 'Clear private signals'}
          </button>
        </>
      ) : (
        <div className="attention-empty">
          <ShieldCheck size={17} />
          <span>
            {isDutch
              ? 'Nog geen private aandachtssignalen. Bekijk profielen, preview fotos of chat om dit te laten leren.'
              : 'No private attention signals yet. Browse profiles, preview photos or chat to let this learn.'}
          </span>
        </div>
      )}
    </section>
  )
}

function extractProfileSignals(text) {
  return extractAutomaticProfileTags(text, [], 72)
}

function extractAutomaticProfileTags(text, existingNotes = [], limit = maxAutoTagsPerSave) {
  const rawText = String(text ?? '').replace(/\s+/g, ' ').trim()
  const clean = rawText.toLowerCase()
  if (!clean) return []

  const existingKeys = new Set(
    normalizeMemoryNotes(existingNotes).map((note) =>
      memorySlug(note.text.replace(/^You said:\s*/i, '').replace(/^AI tag:\s*/i, '')),
    ),
  )
  const byKey = new Map()

  function addTag(label, kind = 'live', weight = 52, source = 'inferred') {
    const cleanLabel = normalizeAutoTagLabel(label)
    if (!cleanLabel) return
    const key = memorySlug(cleanLabel)
    if (!key || existingKeys.has(key)) return
    const current = byKey.get(key)
    const next = {
      id: `${source}-${key}`.slice(0, 96),
      label: cleanLabel,
      kind,
      weight,
      source,
    }
    if (!current || next.weight > current.weight) byKey.set(key, next)
  }

  automaticTagRules.forEach((rule) => {
    const hitCount = rule.terms.filter((term) => clean.includes(term.toLowerCase())).length
    if (hitCount) addTag(rule.label, rule.kind, 72 + hitCount * 5, 'rule')
  })

  const ageMatch = clean.match(/\b(?:ik ben|i am|age|leeftijd)?\s*(1[89]|[2-7][0-9])\s*(?:jaar|years?|yo)?\b/)
  if (ageMatch) addTag(`${ageMatch[1]} jaar`, 'identity', 74, 'age')

  const professionMatch = rawText.match(/\b(?:ik ben|i am|werk als|work as|beroep|job|profession)\s+([^,.!?;:\n]{3,42})/i)
  if (professionMatch) addTag(professionMatch[1], 'identity', 76, 'profession')

  rawText
    .split(/[.!?;\n]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 12)
    .slice(0, 36)
    .forEach((sentence) => {
      sentence
        .split(/,|\ben\b|\band\b|\bmaar\b|\bbut\b|\bmet\b|\bwith\b/gi)
        .map((part) => normalizeAutoTagLabel(part))
        .filter((part) => part.length >= 4 && part.length <= 44)
        .forEach((part) => addTag(part, inferSignalKind(part), 50, 'phrase'))
    })

  const tokens = clean
    .replace(/[^a-zA-ZÀ-ÿ0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !autoTagStopWords.has(word))

  tokens.forEach((word) => addTag(word, inferSignalKind(word), 44, 'keyword'))
  for (let index = 0; index < tokens.length - 1; index += 1) {
    addTag(`${tokens[index]} ${tokens[index + 1]}`, inferSignalKind(`${tokens[index]} ${tokens[index + 1]}`), 48, 'phrase')
  }
  for (let index = 0; index < tokens.length - 2; index += 1) {
    addTag(`${tokens[index]} ${tokens[index + 1]} ${tokens[index + 2]}`, inferSignalKind(`${tokens[index]} ${tokens[index + 1]} ${tokens[index + 2]}`), 46, 'phrase')
  }

  return [...byKey.values()]
    .sort((left, right) => right.weight - left.weight || left.label.localeCompare(right.label))
    .slice(0, limit)
}

function normalizeAutoTagLabel(label) {
  const clean = String(label ?? '')
    .replace(/^ik ben\s+/i, '')
    .replace(/^i am\s+/i, '')
    .replace(/^werk als\s+/i, '')
    .replace(/^work as\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.;:\s]+|[,.;:\s]+$/g, '')
    .trim()
  if (!clean) return ''
  const words = clean.split(/\s+/).filter((word) => !autoTagStopWords.has(word.toLowerCase()))
  if (!words.length) return ''
  const clipped = words.join(' ').slice(0, 56).trim()
  if (clipped.length < 3) return ''
  return titleCase(clipped.toLowerCase())
}

function inferSignalKind(keyword) {
  const clean = keyword.toLowerCase()
  const matched = signalRules.find((signal) => signal.terms.some((term) => clean.includes(term)))
  return matched?.kind ?? 'live'
}

function uniqueSignals(signals) {
  const seen = new Set()
  return signals.filter((signal) => {
    const id = `${signal.kind}-${signal.label.toLowerCase()}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function removeSignalFromText(text, label) {
  const cleanLabel = String(label ?? '').trim()
  if (!cleanLabel) return text
  let next = String(text ?? '')
  const exact = new RegExp(`\\b${escapeRegExp(cleanLabel)}\\b`, 'gi')
  next = next.replace(exact, ' ')
  cleanLabel
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .forEach((word) => {
      next = next.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi'), ' ')
    })
  return next.replace(/\s+([,.;:])/g, '$1').replace(/\s{2,}/g, ' ').trim()
}

function signalMatchesText(text, label) {
  const cleanText = String(text ?? '').toLowerCase()
  const cleanLabel = String(label ?? '').toLowerCase()
  return cleanText.includes(cleanLabel) || cleanLabel.split(/\s+/).some((word) => word.length > 4 && cleanText.includes(word))
}

function cleanSharedSignalText(text = '') {
  return String(text)
    .trim()
    .replace(/[.!?]+$/g, '')
    .replace(/^you both\s+/i, '')
    .replace(/^both\s+/i, '')
    .replace(/^value\s+/i, '')
}

function titleCase(text) {
  return String(text)
    .split(/\s+/)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function extractKeywords(text) {
  const fallback = []
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .filter((word) => ![
      'someone',
      'iemand',
      'people',
      'graag',
      'clear',
      'voice',
      'note',
      'signal',
      'mensen',
      'zoals',
      'waarbij',
      'zonder',
    ].includes(word))

  words.forEach((word) => {
    if (!fallback.includes(word)) fallback.push(word)
  })

  return fallback.slice(0, 5)
}

function summarizeThought(text) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 54 ? `${clean.slice(0, 51)}...` : clean
}

function includesAny(text, needles) {
  const clean = text.toLowerCase()
  return needles.some((needle) => clean.includes(needle))
}

function ActionModal({
  modal,
  match,
  close,
  sendIntro,
  savePlan,
  shareDateDetails,
  toggleFavorite,
  openModal,
  isFavorite,
  advancedFilters,
  toggleAdvancedFilter,
  clearAdvancedFilters,
  hideMatch,
  submitMatchFeedback,
  submitReport,
  language = viewer.language,
}) {
  const isDutch = language === 'Nederlands'
  const defaultIntro = isDutch
    ? `Hey ${match.name}, je profiel trok mijn aandacht. Ik vond je energie rond ${displayRole(match.role, language).toLowerCase()} interessant en je lijkt bewust in connectie.`
    : `Hey ${match.name}, your profile caught my attention. I liked the part about ${match.role.toLowerCase()} and the way you seem intentional about connection.`
  const defaultPlace = isDutch ? 'Rustige wijnbar in de buurt' : 'Quiet wine bar near Ixelles'
  const defaultTime = isDutch ? 'Donderdag 20:30' : 'Thursday 20:30'
  const [intro, setIntro] = useState(modal.seed ?? defaultIntro)
  const [place, setPlace] = useState(modal.place ?? defaultPlace)
  const [time, setTime] = useState(modal.time ?? defaultTime)
  const [trustedContact, setTrustedContact] = useState('')
  const [reportReason, setReportReason] = useState(isDutch ? 'Ongepast of onveilig gedrag' : 'Inappropriate or unsafe behavior')
  const [reportNotes, setReportNotes] = useState('')

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [close])

  return (
    <div className="modal-backdrop" role="presentation" onClick={close}>
      <section className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={close} aria-label="Close">
          <X size={18} />
        </button>

        {modal.type === 'intro' ? (
          <>
            <h2>{isDutch ? `Stuur intro naar ${match.name}` : `Send intro to ${match.name}`}</h2>
            <p>{isDutch ? 'AI mag helpen, maar jij kan elk woord aanpassen.' : 'The AI can draft, but you can edit every word.'}</p>
            <textarea value={intro} onChange={(event) => setIntro(event.target.value)} />
            <button className="primary-modal" type="button" onClick={() => sendIntro(intro)}>
              <Send size={18} />
              {isDutch ? 'Intro opslaan' : 'Save intro'}
            </button>
          </>
        ) : null}

        {modal.type === 'plan' ? (
          <>
            <h2>{isDutch ? `Date plannen met ${match.name}` : `Plan date with ${match.name}`}</h2>
            <p>{isDutch ? 'Maak het concreet, laagdrempelig en makkelijk te verlaten.' : 'Keep it specific, low-pressure, and easy to exit.'}</p>
            <label>
              {isDutch ? 'Plaats' : 'Place'}
              <input value={place} onChange={(event) => setPlace(event.target.value)} />
            </label>
            <label>
              {isDutch ? 'Tijd' : 'Time'}
              <input value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
            <button className="primary-modal" type="button" onClick={() => savePlan({ place, time })}>
              <CalendarDays size={18} />
              {isDutch ? 'Maak plan' : 'Create plan'}
            </button>
          </>
        ) : null}

        {modal.type === 'photoRequest' ? (
          <>
            <h2>{isDutch ? `Vraag foto van ${match.name}` : `Request ${match.name}'s photo`}</h2>
            <p>
              {isDutch
                ? 'Stuur een respectvol verzoek. Het profiel blijft prive tot die persoon zelf fotos deelt in chat.'
                : 'Send a respectful request. The profile stays private unless they choose to reveal photos in chat.'}
            </p>
            <textarea
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              aria-label="Photo request message"
            />
            <button
              className="primary-modal"
              type="button"
              onClick={() => sendIntro(`[Photo request] ${intro}`)}
            >
              <UserRound size={18} />
              {isDutch ? 'Vraag foto-toegang' : 'Ask for photo access'}
            </button>
          </>
        ) : null}

        {modal.type === 'shareDate' ? (
          <>
            <h2>{isDutch ? 'Deel safety card' : 'Share date safety card'}</h2>
            <p>
              {isDutch
                ? 'Kopieer een rustig date-plan voor iemand die je vertrouwt, zonder private AI memory te delen.'
                : 'Copy a calm, practical date plan for someone you trust. It keeps the who, where and when together without exposing private AI memory.'}
            </p>
            <div className="safety-preview">
              <span>
                <ShieldCheck size={18} />
                {match.name}, {match.age}
              </span>
              <strong>{match.score}% Deep Match</strong>
              <small>{displayRole(match.role, language)} · {displayDistance(match.distance, language)}</small>
            </div>
            <div className="date-safety-checklist">
              {(isDutch
                ? ['Publieke plek', 'Eigen vervoer mogelijk', 'Trusted contact weet waar je bent', 'Geen private AI memory gedeeld']
                : ['Public place', 'Own transport possible', 'Trusted contact knows where you are', 'No private AI memory shared']
              ).map((item) => (
                <span key={item}>
                  <i />
                  {item}
                </span>
              ))}
            </div>
            <label>
              {isDutch ? 'Plaats' : 'Place'}
              <input value={place} onChange={(event) => setPlace(event.target.value)} />
            </label>
            <label>
              {isDutch ? 'Tijd' : 'Time'}
              <input value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
            <label>
              {isDutch ? 'Vertrouwde contactpersoon' : 'Trusted contact'}
              <input
                value={trustedContact}
                onChange={(event) => setTrustedContact(event.target.value)}
                placeholder={isDutch ? 'Naam, gsm of notitie voor jezelf' : 'Name, phone or note for yourself'}
              />
            </label>
            <button
              className="primary-modal"
              type="button"
              onClick={() => shareDateDetails({ place, time, trustedContact })}
            >
              <ShieldCheck size={18} />
              {isDutch ? 'Kopieer safety card' : 'Copy safety card'}
            </button>
          </>
        ) : null}

        {modal.type === 'filters' ? (
          <>
            <h2>{isDutch ? 'Matchfilters' : 'Match filters'}</h2>
            <p>{isDutch ? 'Deze filters passen je matchlijst meteen aan.' : 'These settings update your match list immediately.'}</p>
            <div className="filter-modal-grid">
              {filterOptions.map((filter) => (
                <button
                  className={advancedFilters[filter.id] ? 'active' : ''}
                  type="button"
                  onClick={() => toggleAdvancedFilter(filter.id)}
                  key={filter.id}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="modal-split-actions">
              <button type="button" onClick={clearAdvancedFilters}>{isDutch ? 'Wis filters' : 'Clear filters'}</button>
              <button className="primary-modal compact" type="button" onClick={close}>
                {isDutch ? 'Pas toe' : 'Apply filters'}
              </button>
            </div>
          </>
        ) : null}

        {modal.type === 'more' ? (
          <>
            <h2>{match.name}</h2>
            <p>{match.about}</p>
            <div className="modal-action-list">
              <button type="button" onClick={() => toggleFavorite(match.id)}>
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                {isFavorite ? (isDutch ? 'Favoriet verwijderen' : 'Remove favorite') : (isDutch ? 'Bewaar favoriet' : 'Save favorite')}
              </button>
              <button type="button" onClick={() => openModal({ type: 'why' })}>
                <Sparkles size={18} />
                {isDutch ? 'Vraag AI waarom dit werkt' : 'Ask AI why this works'}
              </button>
              <button type="button" onClick={() => hideMatch(match.id)}>
                <X size={18} />
                {isDutch ? 'Verberg match' : 'Hide this match'}
              </button>
              <button type="button" onClick={() => openModal({ type: 'report' })}>
                <ShieldCheck size={18} />
                {isDutch ? 'Report en block' : 'Report and block'}
              </button>
            </div>
          </>
        ) : null}

        {modal.type === 'why' ? (
          <>
            <h2>{isDutch ? `Waarom ${match.name} past` : `Why ${match.name} works`}</h2>
            <p>
              {isDutch
                ? 'MatchPulse weegt gedeelde waarden, aantrekking, intentie, lifestyle en onzekerheid voordat dit profiel wordt aanbevolen.'
                : 'MatchPulse is weighing shared values, attraction signals, intent, lifestyle and uncertainty before recommending this profile.'}
            </p>
            <div className="modal-score-grid">
              {Object.entries(match.metrics).map(([label, value]) => (
                <span key={label}>
                  <small>{label}</small>
                  <strong>{value}%</strong>
                </span>
              ))}
            </div>
            <div className="modal-action-list">
              {match.shared.map((signal) => (
                <p key={signal}>
                  <Sparkles size={16} />
                  {signal}
                </p>
              ))}
            </div>
            <div className="modal-split-actions">
              <button type="button" onClick={() => submitMatchFeedback('stronger')}>
                {isDutch ? 'Voelt sterker' : 'Feels stronger'}
              </button>
              <button type="button" onClick={() => submitMatchFeedback('weaker')}>
                {isDutch ? 'Voelt zwakker' : 'Feels weaker'}
              </button>
            </div>
            <button className="primary-modal" type="button" onClick={() => openModal({ type: 'intro' })}>
              <Send size={18} />
              {isDutch ? 'Maak intro' : 'Draft an intro'}
            </button>
          </>
        ) : null}

        {modal.type === 'report' ? (
          <>
            <h2>{isDutch ? `Report ${match.name}` : `Report ${match.name}`}</h2>
            <p>{isDutch ? 'Dit blokkeert het profiel en maakt een review-record voor het beta-team.' : 'This blocks the profile locally and creates a review record for the beta team.'}</p>
            <label>
              {isDutch ? 'Reden' : 'Reason'}
              <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
                {(isDutch
                  ? ['Ongepast of onveilig gedrag', 'Nep profiel of scam', 'Intimidatie of druk', 'Verkeerde intentie of misleidend profiel', 'Andere']
                  : ['Inappropriate or unsafe behavior', 'Fake profile or scam', 'Harassment or pressure', 'Wrong intent or misleading profile', 'Other']
                ).map((reason) => <option key={reason}>{reason}</option>)}
              </select>
            </label>
            <label>
              {isDutch ? 'Notities' : 'Notes'}
              <textarea
                value={reportNotes}
                onChange={(event) => setReportNotes(event.target.value)}
                placeholder={isDutch ? 'Optionele context voor beta-review.' : 'Optional context for the beta review log.'}
              />
            </label>
            <button className="primary-modal" type="button" onClick={() => submitReport(reportReason, reportNotes)}>
              <ShieldCheck size={18} />
              {isDutch ? 'Report en block' : 'Report and block'}
            </button>
          </>
        ) : null}
      </section>
    </div>
  )
}

function ScreenHeading({ kicker, title, body }) {
  return (
    <header className="screen-heading">
      <p>{kicker}</p>
      <h1>{title}</h1>
      <span>{body}</span>
    </header>
  )
}

function PrivacyImage({ person, className = '' }) {
  const privacy = normalizePhotoPrivacy(person?.photoPrivacy)
  const image = person?.photo || person?.portrait || viewer.photo
  const isDutch = person?.language === 'Nederlands'

  if (privacy === 'private') {
    return (
      <span className={`privacy-image privacy-image-private ${className}`}>
        <UserRound size={28} />
        <small>{isDutch ? 'Foto op verzoek' : 'Photo by request'}</small>
      </span>
    )
  }

  if (privacy === 'blurred') {
    return (
      <span className={`privacy-image privacy-image-blurred ${className}`}>
        <img src={image} alt="" loading="lazy" decoding="async" />
        <small>{isDutch ? 'Foto na chat' : 'Photo after chat'}</small>
      </span>
    )
  }

  return <img className={className} src={image} alt="" loading="lazy" decoding="async" />
}

function Avatar({ image, online, photoPrivacy = 'public' }) {
  return (
    <span className="avatar">
      {normalizePhotoPrivacy(photoPrivacy) === 'public' ? (
        <img src={image} alt="" />
      ) : (
        <span className="avatar-private">
          <UserRound size={16} />
        </span>
      )}
      {online ? <i /> : null}
    </span>
  )
}

function PulseRibbon() {
  return (
    <svg className="pulse-ribbon" viewBox="0 0 900 260" aria-hidden="true">
      <path d="M0 132 C116 70 220 96 330 134 C456 178 556 156 676 92 C772 42 830 62 900 88" />
      <path d="M0 158 C122 98 222 116 340 154 C460 190 566 180 682 124 C774 80 830 88 900 120" />
      <path d="M0 184 C132 128 230 142 348 176 C476 212 584 198 704 142 C792 102 842 112 900 146" />
      <circle cx="762" cy="102" r="8" />
      <circle cx="478" cy="168" r="7" />
      <circle cx="884" cy="86" r="8" />
    </svg>
  )
}

export default App
