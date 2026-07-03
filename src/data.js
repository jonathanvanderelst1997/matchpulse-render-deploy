export const viewer = {
  id: 'alex',
  name: '',
  fullName: '',
  age: '',
  plan: 'Premium',
  city: 'Brussels',
  email: '',
  phone: '',
  language: 'English',
  photo: '/portraits/alex.jpg',
  orientation: 'Open',
  genderIdentity: 'Not shown',
  interestedIn: 'Everyone',
  photoPrivacy: 'public',
  lookingFor: '',
  bio: '',
  profileCompletion: 0,
  preferences: {
    values: [],
    dealbreakers: [],
    visualTaste: [],
    dateRhythm: [],
  },
  aiMemory: [],
}

const photoVariants = ['hero', 'close', 'social', 'soft']

function photoSet(group, id) {
  const base = `https://randomuser.me/api/portraits/${group}/${id}.jpg`
  return photoVariants.map((variant) => `${base}?matchpulse=${variant}`)
}

function uniqueList(...lists) {
  const seen = new Set()
  return lists
    .flat()
    .map((item) => String(item ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

const demoScenarioById = {
  julian: {
    publicTags: ['Architecture', 'Long walks', 'Slow dinners', 'Jazz bars', 'Gentle directness', 'Trust first'],
    extraHobbies: ['building tiny furniture models', 'collecting old city maps', 'hosting pasta nights'],
    extraInterests: ['adaptive reuse', 'acoustic cafes', 'urban sketching'],
    extraValues: ['patience', 'clear communication', 'tender routines'],
    extraActivities: ['drawing street corners', 'cooking risotto', 'evening museum visits'],
    profileUpdate: 'Recently started designing a small co-living concept and wants dates that feel calm, specific and genuinely curious.',
    aiMemory: [
      'Initial scenario: Julian is drawn to calm chemistry, design details and people who communicate clearly without rushing.',
      'Profile update: he recently added slow dinners, city walks and trust-first pacing as stronger dating signals.',
    ],
  },
  marco: {
    publicTags: ['Film photography', 'Quiet confidence', 'Coffee routes', 'Design eye', 'Slow dating', 'Window seats'],
    extraHobbies: ['repairing vintage lamps', 'shooting black-and-white portraits', 'ranking croissants'],
    extraInterests: ['independent bookstores', 'old signage', 'ceramic cups'],
    extraValues: ['taste without performance', 'patience', 'honest feedback'],
    extraActivities: ['photo walks after rain', 'small cinema nights', 'trying bakeries before noon'],
    profileUpdate: 'Wants less performative dating and more ordinary rituals that slowly become meaningful.',
    aiMemory: [
      'Initial scenario: Marco rewards subtle style, emotional patience and people who notice details.',
      'Profile update: coffee-first rhythm and creative routines became stronger than nightlife signals.',
    ],
  },
  ethan: {
    publicTags: ['Founder life', 'Morning runs', 'Momentum', 'Ambition', 'Recovery time', 'Direct planning'],
    extraHobbies: ['ice baths', 'pitch deck rewrites', 'testing ramen spots'],
    extraInterests: ['behavioral economics', 'trail races', 'startup ethics'],
    extraValues: ['drive', 'reliability under pressure', 'repair after conflict'],
    extraActivities: ['sunrise runs', 'shared planning sessions', 'late sushi after work'],
    profileUpdate: 'Learning to protect real rest so ambition does not crowd out dating.',
    aiMemory: [
      'Initial scenario: Ethan likes high-energy people but needs someone who respects recovery windows.',
      'Profile update: explicit planning and emotional accountability now matter more than pure spontaneity.',
    ],
  },
  noah: {
    publicTags: ['Data ethics', 'Bike rides', 'Quiet humor', 'Board games', 'Reliability', 'Low drama'],
    extraHobbies: ['making maps of bike routes', 'reading long essays', 'baking rye bread'],
    extraInterests: ['science podcasts', 'public libraries', 'slow strategy games'],
    extraValues: ['truthfulness', 'gentle humor', 'dependability'],
    extraActivities: ['Sunday cycling', 'bookshop dates', 'cooking with music on'],
    profileUpdate: 'Recently wrote that a good match feels safe enough for silence and specific enough for real plans.',
    aiMemory: [
      'Initial scenario: Noah values precision, loyalty and grounded routines.',
      'Profile update: quiet humor and low-drama planning should be weighted higher in compatibility.',
    ],
  },
  liam: {
    publicTags: ['Night culture', 'Fast humor', 'DJ sets', 'Street food', 'Playful energy', 'Open endings'],
    extraHobbies: ['making party playlists', 'finding late-night noodles', 'collecting odd jackets'],
    extraInterests: ['comedy rooms', 'brand worlds', 'pop-up events'],
    extraValues: ['freedom', 'candor', 'lightness'],
    extraActivities: ['cocktail walks', 'improv nights', 'midnight snacks'],
    profileUpdate: 'Says he is open to depth, but only if the first weeks stay honest and unforced.',
    aiMemory: [
      'Initial scenario: Liam has strong spark but lower certainty around long-term intent.',
      'Profile update: playful chemistry is real, yet intent should be checked before the score climbs too high.',
    ],
  },
  maya: {
    publicTags: ['Documentary photography', 'Cats', 'Train travel', 'Old cities', 'Human stories', 'Tender ambition'],
    extraHobbies: ['fostering shy cats', 'archiving family photos', 'planning train loops'],
    extraInterests: ['slow journalism', 'street portraits', 'quiet hotels'],
    extraValues: ['kindness', 'curiosity', 'emotional truth'],
    extraActivities: ['photo walks', 'Sunday coffee', 'train station dates'],
    profileUpdate: 'Added that trust grows when someone asks thoughtful questions about the stories behind photos.',
    aiMemory: [
      'Initial scenario: Maya is a strong signal for cats, travel, observation and emotional warmth.',
      'Profile update: thoughtful questions and gentle ambition should become more important matching signals.',
    ],
  },
  zara: {
    publicTags: ['Emotional repair', 'Boundaries', 'Pilates', 'Ceramics', 'Direct kindness', 'Accountability'],
    extraHobbies: ['throwing imperfect bowls', 'annotating memoirs', 'walking after difficult days'],
    extraInterests: ['mental health', 'design hotels', 'relationship rituals'],
    extraValues: ['repair', 'integrity', 'soft boundaries'],
    extraActivities: ['slow brunch', 'ceramics class', 'evening walks'],
    profileUpdate: 'Recently added that consistency after conflict matters more than big romantic gestures.',
    aiMemory: [
      'Initial scenario: Zara needs emotional maturity, repair skills and direct but kind communication.',
      'Profile update: inconsistency should lower confidence quickly even when attraction is high.',
    ],
  },
  kai: {
    publicTags: ['Indie music', 'Espresso', 'Poetry', 'Vinyl hunting', 'Creative softness', 'Open mic'],
    extraHobbies: ['recording tiny songs', 'tuning a cheap synth', 'drawing lyric fragments'],
    extraInterests: ['small venues', 'zines', 'rainy coffee bars'],
    extraValues: ['authenticity', 'kindness', 'freedom'],
    extraActivities: ['open mic nights', 'record shops', 'late cappuccino'],
    profileUpdate: 'Wants connection without pressure while still being honest if feelings become serious.',
    aiMemory: [
      'Initial scenario: Kai is creative, gentle and commitment-light unless trust grows naturally.',
      'Profile update: music and poetic communication are stronger signals than fixed plans.',
    ],
  },
  milan: {
    publicTags: ['Urban planning', 'Sunday markets', 'Family rituals', 'Bike routes', 'Stable pace', 'Public space'],
    extraHobbies: ['mapping tram stops', 'cooking market vegetables', 'reading city plans'],
    extraInterests: ['sustainability', 'local politics', 'street trees'],
    extraValues: ['stability', 'care', 'long-term thinking'],
    extraActivities: ['farmers markets', 'bike routes', 'planning day trips'],
    profileUpdate: 'Added that romance feels strongest when daily life becomes calmer together.',
    aiMemory: [
      'Initial scenario: Milan is high for stability, civic-minded values and serious partnership intent.',
      'Profile update: local routines and family-minded signals should raise long-term fit.',
    ],
  },
  amelie: {
    publicTags: ['UX research', 'Coffee mapping', 'Travel notebook', 'Precise questions', 'Curiosity', 'Honesty'],
    extraHobbies: ['rating train station cafes', 'learning idioms', 'saving voice notes from trips'],
    extraInterests: ['human behavior', 'language learning', 'museum afternoons'],
    extraValues: ['reciprocity', 'honesty', 'curiosity'],
    extraActivities: ['coffee tastings', 'city trips', 'question games'],
    profileUpdate: 'Recently said she wants someone who enjoys being asked real questions and can ask them back.',
    aiMemory: [
      'Initial scenario: Amelie strongly matches curiosity, language, research and clear communication.',
      'Profile update: reciprocal questions should matter more than polished photos.',
    ],
  },
  samir: {
    publicTags: ['Policy', 'Loyalty', 'Quiet weekends', 'History', 'Hiking', 'Principled'],
    extraHobbies: ['making stew on Sundays', 'reading parliamentary debates', 'planning quiet hikes'],
    extraInterests: ['public policy', 'history podcasts', 'slow travel'],
    extraValues: ['justice', 'loyalty', 'consistency'],
    extraActivities: ['long hikes', 'book talks', 'home dinners'],
    profileUpdate: 'Added that political values matter, but kindness in everyday conflict matters even more.',
    aiMemory: [
      'Initial scenario: Samir rewards principled values, loyalty and low-noise dating.',
      'Profile update: shared civic values should help, but emotional warmth is required for high confidence.',
    ],
  },
  lena: {
    publicTags: ['Yoga', 'Plant care', 'Cats', 'Gentle routines', 'Morning energy', 'Soft directness'],
    extraHobbies: ['propagating plants', 'cat rescue shifts', 'making herbal tea blends'],
    extraInterests: ['nutrition', 'soft travel', 'body awareness'],
    extraValues: ['presence', 'kindness', 'health'],
    extraActivities: ['morning classes', 'picnics', 'plant markets'],
    profileUpdate: 'Wants dates that feel easy on the nervous system, not intense or performative.',
    aiMemory: [
      'Initial scenario: Lena is a strong gentle-care, animal-love and healthy-routine profile.',
      'Profile update: softness and nervous-system safety should be weighted higher than city intensity.',
    ],
  },
  victor: {
    publicTags: ['Chef life', 'Late nights', 'Pasta opinions', 'Wine bars', 'Big laugh', 'Sensual energy'],
    extraHobbies: ['fermenting hot sauce', 'arguing about olive oil', 'shopping at night markets'],
    extraInterests: ['food culture', 'music', 'travel kitchens'],
    extraValues: ['pleasure', 'generosity', 'honesty'],
    extraActivities: ['dinner parties', 'wine tastings', 'after-service walks'],
    profileUpdate: 'Open to more than chemistry, but schedule friction needs to be named early.',
    aiMemory: [
      'Initial scenario: Victor has strong sensual spark and lower routine compatibility for calm daters.',
      'Profile update: late-shift lifestyle should increase uncertainty unless the other person likes that rhythm.',
    ],
  },
  nora: {
    publicTags: ['Museum nights', 'Jazz', 'Letters', 'Art history', 'Slow romance', 'Patience'],
    extraHobbies: ['writing postcards', 'cataloguing exhibitions', 'collecting old cinema tickets'],
    extraInterests: ['architecture', 'jazz records', 'old cinemas'],
    extraValues: ['depth', 'patience', 'beauty'],
    extraActivities: ['museum nights', 'record stores', 'long letters'],
    profileUpdate: 'Recently added that she prefers one meaningful message over ten fast ones.',
    aiMemory: [
      'Initial scenario: Nora is high for cultural depth, patience and slow romantic pacing.',
      'Profile update: thoughtful message quality should matter more than frequency.',
    ],
  },
  daan: {
    publicTags: ['Trail running', 'Breakfast dates', 'Recovery science', 'Practical care', 'Soft smile', 'Early nights'],
    extraHobbies: ['making granola', 'mobility drills', 'testing hiking socks'],
    extraInterests: ['health science', 'mountains', 'simple routines'],
    extraValues: ['discipline', 'warmth', 'care'],
    extraActivities: ['trail runs', 'sauna visits', 'breakfast after sport'],
    profileUpdate: 'Wants active love, but not competition inside the relationship.',
    aiMemory: [
      'Initial scenario: Daan is active, caring and routine-oriented.',
      'Profile update: active lifestyle should help only when it is paired with warmth and flexibility.',
    ],
  },
  ines: {
    publicTags: ['Illustration', 'Bookstores', 'Cats', 'Rain walks', 'Emotional clarity', 'Graphic novels'],
    extraHobbies: ['drawing cafe windows', 'cat sitting', 'collecting tiny notebooks'],
    extraInterests: ['graphic novels', 'slow fashion', 'rainy cities'],
    extraValues: ['creativity', 'clarity', 'gentleness'],
    extraActivities: ['bookstore dates', 'drawing cafes', 'rain walks'],
    profileUpdate: 'Added that she needs clear emotional language before she opens up fully.',
    aiMemory: [
      'Initial scenario: Ines is strong for cats, creativity, quiet intimacy and emotional clarity.',
      'Profile update: clear words and gentle pacing should be weighted heavily.',
    ],
  },
  renee: {
    publicTags: ['Law', 'Rowing', 'Direct communication', 'City breaks', 'Loyalty', 'Busy calendar'],
    extraHobbies: ['rowing before work', 'saving wine bar lists', 'listening to courtroom podcasts'],
    extraInterests: ['ethics', 'European cities', 'legal culture'],
    extraValues: ['respect', 'clarity', 'loyalty'],
    extraActivities: ['rowing mornings', 'wine dinners', 'short city trips'],
    profileUpdate: 'Recently wrote that respect means making room even during busy weeks.',
    aiMemory: [
      'Initial scenario: Renee is direct, loyal and schedule-intense.',
      'Profile update: proactive planning should reduce uncertainty; vague availability should lower score.',
    ],
  },
  otto: {
    publicTags: ['Indie games', 'Ramen', 'Voice notes', 'Animation', 'Chaotic charm', 'Playful ideas'],
    extraHobbies: ['building tiny game prototypes', 'ranking ramen broth', 'sending strange voice notes'],
    extraInterests: ['sci-fi', 'internet culture', 'animation festivals'],
    extraValues: ['curiosity', 'play', 'honesty'],
    extraActivities: ['ramen quests', 'game nights', 'late animation screenings'],
    profileUpdate: 'Knows he can be chaotic and wants someone who likes playfulness but names needs clearly.',
    aiMemory: [
      'Initial scenario: Otto has playful spark and creative chaos.',
      'Profile update: match confidence should rise with users who like humor but need honest boundaries.',
    ],
  },
  sofia: {
    publicTags: ['Garden design', 'Birdwatching', 'Woodland walks', 'Slow intimacy', 'Trust', 'Nature weekends'],
    extraHobbies: ['pressing leaves', 'designing tiny balconies', 'tracking birds'],
    extraInterests: ['plants', 'rural weekends', 'landscape design'],
    extraValues: ['patience', 'nature', 'trust'],
    extraActivities: ['forest walks', 'garden visits', 'simple picnics'],
    profileUpdate: 'Added that rushed intimacy is an immediate mismatch, even if attraction is high.',
    aiMemory: [
      'Initial scenario: Sofia needs slow trust, nature and patience.',
      'Profile update: fast dating pace should increase uncertainty for this profile.',
    ],
  },
  lucas: {
    publicTags: ['Sound design', 'Vinyl', 'Quiet walks', 'Listening bars', 'Craft', 'Honesty'],
    extraHobbies: ['repairing old headphones', 'collecting field recordings', 'building studio shelves'],
    extraInterests: ['analogue gear', 'small concerts', 'warm studios'],
    extraValues: ['presence', 'craft', 'honesty'],
    extraActivities: ['listening bars', 'studio visits', 'quiet night walks'],
    profileUpdate: 'Recently added that being listened to matters more than being impressed.',
    aiMemory: [
      'Initial scenario: Lucas is quiet, technical, music-driven and emotionally attentive.',
      'Profile update: listening quality and calm creative energy should be high-value signals.',
    ],
  },
}

function laneFromScore(score, uncertainty) {
  if (score >= 92 && uncertainty <= 10) return 'Topmatch'
  if (score >= 86) return 'Deep fit'
  if (score >= 78) return 'Promising'
  return 'Light spark'
}

function makeBio(profile) {
  return `${profile.name} is ${profile.character}. They work as ${profile.role.toLowerCase()} and bring a ${profile.communicationStyle.toLowerCase()} communication style into dating. Their lifestyle is ${profile.lifestyle.toLowerCase()}, with hobbies like ${profile.hobbies.join(', ')} and favorite activities such as ${profile.favoriteActivities.join(', ')}. They value ${profile.values.join(', ')} and are looking for ${profile.datingGoals.toLowerCase()}. A typical weekend is ${profile.weekend.toLowerCase()}. Longer term, ${profile.name} wants ${profile.futurePlans.toLowerCase()}. Education: ${profile.education}.`
}

function makeAiAnalysis(profile) {
  const [primaryShared, secondaryShared, thirdShared] = profile.shared
  return {
    whySelected: `${profile.name} was selected because ${primaryShared.toLowerCase()} and the relationship intent is readable from the profile context.`,
    longTermChance: profile.score >= 92 ? 'High chance of long-term fit if the first conversations stay concrete and emotionally honest.' : profile.score >= 84 ? 'Good long-term potential, especially if pacing and expectations are discussed early.' : 'Interesting spark, but the AI recommends checking intent and lifestyle rhythm before investing heavily.',
    attentionPoint: profile.metrics.Uncertainty <= 10 ? 'Low uncertainty. The main advice is to avoid over-planning and let the connection breathe.' : profile.metrics.Uncertainty <= 20 ? 'Moderate uncertainty. Align on pace, availability and what a good first month should feel like.' : 'Higher uncertainty. Treat this as exploratory until values and communication habits are confirmed.',
    conversationStarters: [
      `Ask about ${profile.favoriteActivities[0].toLowerCase()}.`,
      `Compare weekend rhythms: ${profile.weekend.toLowerCase()}.`,
      `Open with the shared signal: ${secondaryShared ?? primaryShared}.`,
    ],
    trustScore: Math.max(68, Math.min(99, profile.score - Math.round(profile.metrics.Uncertainty / 3))),
    strengths: [primaryShared, secondaryShared ?? profile.values[0], thirdShared ?? profile.lifestyle],
    risks: profile.risks,
  }
}

function createProfile(profile) {
  const scenario = demoScenarioById[profile.id] ?? {}
  const enrichedProfile = {
    ...profile,
    about: uniqueList(profile.about, scenario.profileUpdate).join(' '),
    hobbies: uniqueList(profile.hobbies, scenario.extraHobbies),
    interests: uniqueList(profile.interests, scenario.extraInterests),
    values: uniqueList(profile.values, scenario.extraValues),
    favoriteActivities: uniqueList(profile.favoriteActivities, scenario.extraActivities),
    publicTags: uniqueList(scenario.publicTags, profile.publicTags),
    aiMemory: uniqueList(scenario.aiMemory),
    profileScenario: scenario.profileUpdate ?? '',
  }
  const photos = photoSet(enrichedProfile.photoGroup, enrichedProfile.photoId)
  const bio = makeBio(enrichedProfile)
  const aiAnalysis = makeAiAnalysis(enrichedProfile)
  return {
    ...enrichedProfile,
    city: enrichedProfile.city ?? 'Brussels',
    photo: photos[0],
    portrait: photos[0],
    photos,
    about: enrichedProfile.about,
    bio,
    aiAnalysis,
    compatibility: [
      { label: 'Values', score: enrichedProfile.metrics.Values, detail: enrichedProfile.values.slice(0, 2).join(' + ') },
      { label: 'Attraction', score: enrichedProfile.metrics.Attraction, detail: enrichedProfile.visualSignal },
      { label: 'Lifestyle', score: enrichedProfile.metrics.Lifestyle, detail: enrichedProfile.lifestyle },
      { label: 'Intent', score: enrichedProfile.metrics.Intent, detail: enrichedProfile.datingGoals },
    ],
    ranking: {
      lane: laneFromScore(enrichedProfile.score, enrichedProfile.metrics.Uncertainty),
      reason: enrichedProfile.shared[0],
    },
  }
}

const profileSeeds = [
  {
    id: 'julian', name: 'Julian', age: 28, role: 'Architect at Studio A', distance: '2.4 km away', status: 'Online now', intent: ['Serious', 'Tonight', 'Values aligned'], score: 93, photoGroup: 'men', photoId: 32, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Designs quiet spaces, cooks late, and likes dates that turn into long walks.', character: 'calm, observant and quietly romantic', hobbies: ['architecture walks', 'seasonal cooking', 'slow travel'], interests: ['design', 'urban life', 'jazz bars'], values: ['care', 'consistency', 'creative independence'], lifestyle: 'structured weekdays with warm, unhurried evenings', datingGoals: 'a serious relationship that grows through trust and shared routines', communicationStyle: 'clear, gentle and specific', education: 'Master in Architecture', favoriteActivities: ['gallery openings', 'long walks', 'home-cooked dinners'], weekend: 'a market visit, a design exhibition and dinner with close friends', futurePlans: 'to build a stable home life without losing curiosity', visualSignal: 'quiet confidence and warm eye contact', shared: ['Calm chemistry and clear communication.', 'Architecture, slow travel and atmospheric dinners.', 'Serious intent without forcing the timeline.'], risks: ['May need time before showing strong emotion.'], metrics: { Values: 93, Attraction: 91, Lifestyle: 88, Intent: 90, Uncertainty: 7 }, map: { x: 50, y: 44 },
  },
  {
    id: 'marco', name: 'Marco', age: 31, role: 'Product Designer', distance: '4.1 km away', status: 'Online now', intent: ['Serious', 'Creative', 'Slow dating'], score: 89, photoGroup: 'men', photoId: 45, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Men',
    about: 'Soft-spoken, visually sharp, and very good at finding a table near the window.', character: 'warm, precise and creatively grounded', hobbies: ['film photography', 'coffee tasting', 'furniture restoration'], interests: ['interface design', 'independent cinema', 'small restaurants'], values: ['aesthetic care', 'honesty', 'patience'], lifestyle: 'creative office days balanced with slow evenings', datingGoals: 'a thoughtful connection that does not rush intimacy', communicationStyle: 'reflective, kind and visually expressive', education: 'Bachelor in Interaction Design', favoriteActivities: ['photo walks', 'cinema nights', 'trying new bakeries'], weekend: 'editing photos, seeing one close friend and cooking something simple', futurePlans: 'to design meaningful products and build a calm partnership', visualSignal: 'soft style and attentive presence', shared: ['Good taste without showing off.', 'Slow starts and thoughtful messages.', 'Compatible first-date rhythm.'], risks: ['Can overthink early signals.'], metrics: { Values: 88, Attraction: 89, Lifestyle: 85, Intent: 86, Uncertainty: 14 }, map: { x: 75, y: 30 },
  },
  {
    id: 'ethan', name: 'Ethan', age: 26, role: 'Founder', distance: '1.8 km away', status: 'Online now', intent: ['Serious', 'Ambitious', 'Tonight'], score: 87, photoGroup: 'men', photoId: 12, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Building a small company and looking for someone who understands momentum.', character: 'energetic, strategic and emotionally curious', hobbies: ['running', 'pitch nights', 'podcasts'], interests: ['startups', 'travel', 'personal growth'], values: ['ambition', 'directness', 'resilience'], lifestyle: 'busy, active and sometimes unpredictable', datingGoals: 'a real relationship with someone who respects drive and recovery time', communicationStyle: 'fast, direct and optimistic', education: 'MSc Business Engineering', favoriteActivities: ['morning runs', 'new restaurants', 'weekend city trips'], weekend: 'a workout, a founder event and a relaxed Sunday reset', futurePlans: 'to grow a company while protecting a healthy private life', visualSignal: 'high energy and open smile', shared: ['Growth and meaningful connection.', 'Soulful conversations and travel.', 'High attraction with a faster pace.'], risks: ['Work intensity can crowd out dating if not named early.'], metrics: { Values: 90, Attraction: 92, Lifestyle: 82, Intent: 84, Uncertainty: 18 }, map: { x: 28, y: 63 },
  },
  {
    id: 'noah', name: 'Noah', age: 29, role: 'Data Scientist', distance: '3.2 km away', status: 'Online now', intent: ['Serious', 'Grounded', 'Quiet'], score: 84, photoGroup: 'men', photoId: 52, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Men & women',
    about: 'Curious, grounded, into long bike rides and cleanly written thoughts.', character: 'analytical, loyal and quietly funny', hobbies: ['cycling', 'reading essays', 'board games'], interests: ['data ethics', 'nature routes', 'science podcasts'], values: ['truthfulness', 'reliability', 'gentle humor'], lifestyle: 'balanced between focused work and outdoor recovery', datingGoals: 'a stable relationship where both people can be fully themselves', communicationStyle: 'thoughtful, precise and low-drama', education: 'PhD track in Machine Learning', favoriteActivities: ['bike rides', 'bookshops', 'quiet dinners'], weekend: 'cycling out of the city and making dinner with music on', futurePlans: 'to keep learning while building a dependable partnership', visualSignal: 'calm eyes and steady presence', shared: ['Precision and emotionally safe conversations.', 'Calm social style and weekend rhythm.', 'Strong long-term stability.'], risks: ['May appear reserved before trust is built.'], metrics: { Values: 86, Attraction: 79, Lifestyle: 91, Intent: 87, Uncertainty: 12 }, map: { x: 64, y: 75 },
  },
  {
    id: 'liam', name: 'Liam', age: 27, role: 'Brand Strategist', distance: '5.5 km away', status: 'Online now', intent: ['Casual', 'Tonight', 'Playful'], score: 81, photoGroup: 'men', photoId: 76, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Fast humor, big energy, and open to a fun plan when the vibe is honest.', character: 'playful, socially fluent and spontaneous', hobbies: ['live comedy', 'street food', 'DJ sets'], interests: ['branding', 'nightlife', 'fashion'], values: ['fun', 'candor', 'freedom'], lifestyle: 'social, late and highly flexible', datingGoals: 'a light connection that can become serious if the rhythm is right', communicationStyle: 'witty, quick and flirtatious', education: 'Bachelor in Communication', favoriteActivities: ['cocktail bars', 'pop-up events', 'late walks'], weekend: 'friends, music and one spontaneous plan that was not on the calendar', futurePlans: 'to build a creative career and stay emotionally honest', visualSignal: 'expressive style and confident smile', shared: ['Spontaneous evenings and city energy.', 'High attraction, lower intent alignment.', 'Best as a playful low-pressure match.'], risks: ['Different pacing may create uncertainty.'], metrics: { Values: 75, Attraction: 90, Lifestyle: 84, Intent: 68, Uncertainty: 26 }, map: { x: 38, y: 26 },
  },
  {
    id: 'maya', name: 'Maya', age: 30, role: 'Documentary Photographer', distance: '1.1 km away', status: 'Online now', intent: ['Serious', 'Creative', 'Travel'], score: 95, photoGroup: 'women', photoId: 44, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Warm observer, loves cats, trains, old cities and photo walks after coffee.', character: 'empathetic, adventurous and visually sensitive', hobbies: ['documentary photography', 'train travel', 'cat fostering'], interests: ['human stories', 'old cities', 'slow journalism'], values: ['kindness', 'curiosity', 'emotional truth'], lifestyle: 'mobile but deeply intentional with people', datingGoals: 'a serious relationship with room for travel and tenderness', communicationStyle: 'warm, attentive and story-led', education: 'MA Visual Anthropology', favoriteActivities: ['photo walks', 'train trips', 'Sunday coffee'], weekend: 'editing images, wandering a city and cooking for friends', futurePlans: 'to publish a long-form project and build a loving base', visualSignal: 'natural warmth and expressive eyes', shared: ['Travel curiosity and gentle ambition.', 'Cats, photography and slow weekend mornings.', 'High trust potential with natural chemistry.'], risks: ['Travel periods require planning and reassurance.'], metrics: { Values: 95, Attraction: 94, Lifestyle: 91, Intent: 92, Uncertainty: 6 }, map: { x: 45, y: 34 },
  },
  {
    id: 'zara', name: 'Zara', age: 33, role: 'Clinical Psychologist', distance: '2.0 km away', status: 'Offline', intent: ['Serious', 'Emotionally available', 'Slow dating'], score: 92, photoGroup: 'women', photoId: 68, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Men & women',
    about: 'Direct, kind, and interested in people who can name what they feel.', character: 'emotionally intelligent, steady and honest', hobbies: ['pilates', 'memoir reading', 'ceramics'], interests: ['mental health', 'design hotels', 'good questions'], values: ['emotional safety', 'repair', 'integrity'], lifestyle: 'structured, reflective and health-conscious', datingGoals: 'a mature relationship with accountability and tenderness', communicationStyle: 'direct, warm and boundaried', education: 'MSc Clinical Psychology', favoriteActivities: ['ceramics class', 'slow brunch', 'evening walks'], weekend: 'movement, one meaningful social plan and quiet reading', futurePlans: 'to keep a balanced practice and create a peaceful home', visualSignal: 'composed style and clear attention', shared: ['Emotional availability and honest repair.', 'Deep conversations without pressure.', 'Compatible boundaries and communication.'], risks: ['Will notice inconsistency quickly.'], metrics: { Values: 96, Attraction: 86, Lifestyle: 88, Intent: 94, Uncertainty: 9 }, map: { x: 58, y: 55 },
  },
  {
    id: 'kai', name: 'Kai', age: 25, role: 'Barista and Musician', distance: '0.8 km away', status: 'Online now', intent: ['Casual', 'Creative', 'Music'], score: 78, photoGroup: 'men', photoId: 81, photoPrivacy: 'public', genderIdentity: 'Non-binary', interestedIn: 'Everyone',
    about: 'Makes espresso, writes tiny songs, and is happiest in intimate live music rooms.', character: 'softly charismatic, musical and spontaneous', hobbies: ['songwriting', 'espresso', 'vinyl hunting'], interests: ['indie music', 'small venues', 'poetry'], values: ['freedom', 'authenticity', 'kindness'], lifestyle: 'late mornings, creative evenings and flexible plans', datingGoals: 'a kind connection without pressure while life stays creative', communicationStyle: 'playful, poetic and emotionally open', education: 'Music production certificate', favoriteActivities: ['open mic nights', 'record shops', 'late coffee'], weekend: 'a shift, a rehearsal and one intimate show', futurePlans: 'to record an EP and keep relationships honest', visualSignal: 'creative softness and expressive styling', shared: ['Music and creative city energy.', 'Easy first-date ideas.', 'Fun spark with less long-term certainty.'], risks: ['Commitment clarity may need checking.'], metrics: { Values: 73, Attraction: 88, Lifestyle: 80, Intent: 65, Uncertainty: 29 }, map: { x: 34, y: 40 },
  },
  {
    id: 'milan', name: 'Milan', age: 35, role: 'Urban Planner', distance: '6.2 km away', status: 'Offline', intent: ['Serious', 'Stable', 'Family-minded'], score: 88, photoGroup: 'men', photoId: 28, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Likes public spaces, Sunday markets, and relationships that become calmer over time.', character: 'grounded, civic-minded and quietly affectionate', hobbies: ['urban walks', 'market cooking', 'cycling'], interests: ['public space', 'sustainability', 'family rituals'], values: ['stability', 'care', 'long-term thinking'], lifestyle: 'steady workdays with active local weekends', datingGoals: 'a serious partnership that can become family-oriented', communicationStyle: 'steady, practical and reassuring', education: 'Master in Urban Studies', favoriteActivities: ['farmers markets', 'bike routes', 'planning trips'], weekend: 'market shopping, a bike ride and dinner with siblings', futurePlans: 'to shape better cities and a calm family life', visualSignal: 'reliable warmth and relaxed confidence', shared: ['Stable pace and grounded values.', 'City walks and thoughtful planning.', 'Clear serious intent.'], risks: ['May feel too settled for very spontaneous daters.'], metrics: { Values: 90, Attraction: 82, Lifestyle: 93, Intent: 91, Uncertainty: 11 }, map: { x: 70, y: 68 },
  },
  {
    id: 'amelie', name: 'Amelie', age: 29, role: 'UX Researcher', distance: '3.7 km away', status: 'Online now', intent: ['Serious', 'Curious', 'Coffee first'], score: 91, photoGroup: 'women', photoId: 12, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Asks precise questions, keeps a travel notebook, and prefers honesty over performance.', character: 'curious, emotionally precise and gently playful', hobbies: ['travel journaling', 'coffee mapping', 'podcasts'], interests: ['human behavior', 'design research', 'language learning'], values: ['honesty', 'curiosity', 'reciprocity'], lifestyle: 'structured curiosity with frequent small adventures', datingGoals: 'a serious connection built through questions and shared experiences', communicationStyle: 'clear, question-led and warm', education: 'MSc Human-Computer Interaction', favoriteActivities: ['coffee tastings', 'city trips', 'museum afternoons'], weekend: 'a new cafe, a notebook page and a long conversation', futurePlans: 'to work internationally while keeping a stable relationship base', visualSignal: 'bright attention and natural style', shared: ['Curiosity and clear communication.', 'Coffee-first rhythm and travel stories.', 'A strong explainable AI fit.'], risks: ['May ask for clarity sooner than some people expect.'], metrics: { Values: 92, Attraction: 87, Lifestyle: 90, Intent: 89, Uncertainty: 10 }, map: { x: 22, y: 52 },
  },
  {
    id: 'samir', name: 'Samir', age: 32, role: 'Policy Advisor', distance: '7.4 km away', status: 'Offline', intent: ['Serious', 'Calm', 'Values aligned'], score: 85, photoGroup: 'men', photoId: 64, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Women',
    about: 'Introverted, loyal, politically engaged, and happiest with one good plan per weekend.', character: 'principled, loyal and quietly intense', hobbies: ['reading politics', 'hiking', 'cooking stews'], interests: ['public policy', 'history', 'slow travel'], values: ['justice', 'loyalty', 'consistency'], lifestyle: 'focused, calm and low-noise', datingGoals: 'a stable relationship with shared values and mutual respect', communicationStyle: 'measured, sincere and detail-oriented', education: 'Master in Public Policy', favoriteActivities: ['long hikes', 'book talks', 'home dinners'], weekend: 'one meaningful plan, a long walk and a quiet Sunday', futurePlans: 'to contribute to policy work and build a deeply reliable partnership', visualSignal: 'thoughtful presence and serious warmth', shared: ['Loyalty and thoughtful values.', 'Calm pacing and direct intent.', 'Less visual spark, strong trust signal.'], risks: ['Needs enough quiet time to recharge.'], metrics: { Values: 91, Attraction: 76, Lifestyle: 87, Intent: 92, Uncertainty: 16 }, map: { x: 80, y: 42 },
  },
  {
    id: 'lena', name: 'Lena', age: 27, role: 'Yoga Teacher', distance: '2.8 km away', status: 'Online now', intent: ['Serious', 'Active', 'Gentle'], score: 86, photoGroup: 'women', photoId: 31, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Men',
    about: 'Morning movement, warm friends, cats, and dates that feel simple and kind.', character: 'gentle, embodied and emotionally open', hobbies: ['yoga', 'plant care', 'cat rescue'], interests: ['wellness', 'nutrition', 'soft travel'], values: ['kindness', 'presence', 'health'], lifestyle: 'early mornings, movement and relaxed evenings', datingGoals: 'a caring relationship with emotional softness and shared routines', communicationStyle: 'soft, encouraging and direct when needed', education: 'Yoga therapy training', favoriteActivities: ['morning classes', 'plant markets', 'picnics'], weekend: 'teaching, seeing friends and cooking something green', futurePlans: 'to open a small studio and have a peaceful home', visualSignal: 'natural warmth and relaxed body language', shared: ['Natural active energy.', 'Gentle communication and healthy routines.', 'Shared love of animals and quiet mornings.'], risks: ['Needs a partner who respects slower mornings and softness.'], metrics: { Values: 84, Attraction: 89, Lifestyle: 92, Intent: 82, Uncertainty: 15 }, map: { x: 42, y: 72 },
  },
  {
    id: 'victor', name: 'Victor', age: 36, role: 'Chef', distance: '4.9 km away', status: 'Online now', intent: ['Casual', 'Dinner', 'Tonight'], score: 76, photoGroup: 'men', photoId: 7, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Extroverted chef with a loud laugh, late shifts and excellent pasta opinions.', character: 'sensual, generous and socially bold', hobbies: ['cooking', 'wine tasting', 'late markets'], interests: ['food culture', 'music', 'travel kitchens'], values: ['pleasure', 'honesty', 'generosity'], lifestyle: 'late nights, intense work and rich social meals', datingGoals: 'chemistry first, with openness if the rhythm becomes real', communicationStyle: 'expressive, teasing and direct', education: 'Culinary institute graduate', favoriteActivities: ['night markets', 'dinner parties', 'wine bars'], weekend: 'service, friends after midnight and a slow recovery meal', futurePlans: 'to open a neighborhood restaurant and keep life flavorful', visualSignal: 'big smile and confident energy', shared: ['Dinner chemistry and city energy.', 'Fun attraction but different routines.', 'Better for spontaneous plans than stability.'], risks: ['Late work schedule may clash with calmer routines.'], metrics: { Values: 70, Attraction: 91, Lifestyle: 72, Intent: 63, Uncertainty: 31 }, map: { x: 18, y: 28 },
  },
  {
    id: 'nora', name: 'Nora', age: 34, role: 'Museum Curator', distance: '5.1 km away', status: 'Offline', intent: ['Serious', 'Creative', 'Slow dating'], score: 90, photoGroup: 'women', photoId: 52, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Reads exhibition labels fully, loves jazz, and moves carefully when something matters.', character: 'cultured, patient and quietly passionate', hobbies: ['jazz records', 'exhibitions', 'letter writing'], interests: ['art history', 'architecture', 'old cinemas'], values: ['depth', 'patience', 'beauty'], lifestyle: 'slow, cultural and intentionally social', datingGoals: 'a serious connection that respects time and depth', communicationStyle: 'thoughtful, lyrical and precise', education: 'MA Art History', favoriteActivities: ['museum nights', 'jazz bars', 'long letters'], weekend: 'an exhibition, a record store and dinner with one close friend', futurePlans: 'to curate a major show and share a beautiful home life', visualSignal: 'elegant calm and expressive attention', shared: ['Creative life and quiet depth.', 'Slow romantic pacing.', 'Strong cultural overlap.'], risks: ['Needs patience and may not rush early certainty.'], metrics: { Values: 94, Attraction: 84, Lifestyle: 86, Intent: 91, Uncertainty: 8 }, map: { x: 60, y: 22 },
  },
  {
    id: 'daan', name: 'Daan', age: 30, role: 'Physiotherapist', distance: '1.6 km away', status: 'Online now', intent: ['Serious', 'Sporty', 'Outdoors'], score: 83, photoGroup: 'men', photoId: 18, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Women',
    about: 'Sporty but soft, into hiking, recovery science and making breakfast after a long run.', character: 'active, caring and practically romantic', hobbies: ['trail running', 'mobility training', 'breakfast cooking'], interests: ['health science', 'mountains', 'simple routines'], values: ['care', 'discipline', 'warmth'], lifestyle: 'active mornings and early nights', datingGoals: 'a grounded relationship with shared movement and care', communicationStyle: 'practical, reassuring and affectionate', education: 'BSc Physiotherapy', favoriteActivities: ['trail runs', 'sauna visits', 'breakfast dates'], weekend: 'a run, recovery and a relaxed meal with friends', futurePlans: 'to run his own practice and build a healthy family rhythm', visualSignal: 'healthy energy and soft smile', shared: ['Active lifestyle and care-oriented work.', 'Warm practical date rhythm.', 'Good but not perfect personality overlap.'], risks: ['Very active schedule may need flexibility.'], metrics: { Values: 82, Attraction: 85, Lifestyle: 94, Intent: 80, Uncertainty: 17 }, map: { x: 25, y: 77 },
  },
  {
    id: 'ines', name: 'Ines', age: 28, role: 'Illustrator', distance: '2.2 km away', status: 'Online now', intent: ['Serious', 'Creative', 'Introvert'], score: 94, photoGroup: 'women', photoId: 25, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Men & women',
    about: 'Draws tiny city scenes, loves cats, rainy bookstores and people who are emotionally clear.', character: 'imaginative, introverted and emotionally sincere', hobbies: ['illustration', 'bookstores', 'cat sitting'], interests: ['graphic novels', 'rainy cities', 'slow fashion'], values: ['creativity', 'clarity', 'gentleness'], lifestyle: 'quiet creative work with intimate social circles', datingGoals: 'a serious relationship with emotional clarity and artistic room', communicationStyle: 'gentle, precise and visually expressive', education: 'BA Illustration', favoriteActivities: ['bookstore dates', 'drawing cafes', 'rain walks'], weekend: 'drawing, reading and seeing one trusted friend', futurePlans: 'to publish a visual diary and share a calm creative home', visualSignal: 'soft creative style and attentive gaze', shared: ['Cats, creativity and emotional clarity.', 'Quiet first dates and bookstore energy.', 'Very high values and attraction match.'], risks: ['May need slower pacing in crowded social settings.'], metrics: { Values: 96, Attraction: 93, Lifestyle: 89, Intent: 93, Uncertainty: 7 }, map: { x: 52, y: 18 },
  },
  {
    id: 'renee', name: 'Renee', age: 37, role: 'Lawyer', distance: '8.5 km away', status: 'Offline', intent: ['Serious', 'Direct', 'Stable'], score: 82, photoGroup: 'women', photoId: 65, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Men',
    about: 'Sharp, loyal and busy; makes room when something feels serious and respectful.', character: 'direct, loyal and intellectually sharp', hobbies: ['courtroom podcasts', 'rowing', 'wine dinners'], interests: ['law', 'ethics', 'city breaks'], values: ['respect', 'clarity', 'loyalty'], lifestyle: 'busy but intentional with protected downtime', datingGoals: 'a serious relationship with mutual respect and independence', communicationStyle: 'direct, efficient and protective', education: 'LLM European Law', favoriteActivities: ['rowing mornings', 'wine bars', 'short city trips'], weekend: 'one elegant dinner, a workout and legal reading', futurePlans: 'to become partner without losing a private life', visualSignal: 'polished confidence and steady attention', shared: ['Direct communication and loyalty.', 'Clear relationship intent.', 'Schedule friction creates some uncertainty.'], risks: ['Busy calendar needs proactive planning.'], metrics: { Values: 88, Attraction: 80, Lifestyle: 76, Intent: 90, Uncertainty: 21 }, map: { x: 83, y: 58 },
  },
  {
    id: 'otto', name: 'Otto', age: 24, role: 'Game Developer', distance: '3.9 km away', status: 'Online now', intent: ['Casual', 'Creative', 'Playful'], score: 73, photoGroup: 'men', photoId: 86, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Night owl, indie games, ramen, and chaotic but charming voice notes.', character: 'inventive, funny and slightly chaotic', hobbies: ['indie games', 'ramen quests', 'animation'], interests: ['game design', 'sci-fi', 'internet culture'], values: ['play', 'curiosity', 'honesty'], lifestyle: 'late, creative and sometimes inconsistent', datingGoals: 'a playful connection without heavy pressure at the start', communicationStyle: 'funny, voice-note heavy and informal', education: 'Game development bootcamp', favoriteActivities: ['arcades', 'ramen nights', 'co-op games'], weekend: 'debugging, gaming and one spontaneous food mission', futurePlans: 'to ship an indie game and learn steadier routines', visualSignal: 'playful energy and youthful charm', shared: ['Creative curiosity and humor.', 'Different routines and lower intent match.', 'Fun conversation potential.'], risks: ['Routine and intent may be weaker than desired.'], metrics: { Values: 68, Attraction: 86, Lifestyle: 70, Intent: 58, Uncertainty: 34 }, map: { x: 15, y: 62 },
  },
  {
    id: 'sofia', name: 'Sofia', age: 31, role: 'AI Ethicist', distance: '6.8 km away', status: 'Online now', intent: ['Serious', 'AI', 'Values aligned'], score: 96, photoGroup: 'women', photoId: 72, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Works on responsible AI, loves photography, trains to new cities and very honest conversations.', character: 'principled, brilliant and emotionally brave', hobbies: ['photography', 'train travel', 'essay writing'], interests: ['AI ethics', 'philosophy', 'public talks'], values: ['responsibility', 'truth', 'care'], lifestyle: 'intellectual, mobile and deeply values-led', datingGoals: 'a serious relationship with honesty, autonomy and shared curiosity', communicationStyle: 'direct, nuanced and compassionate', education: 'PhD in Responsible AI', favoriteActivities: ['photo walks', 'public lectures', 'train weekends'], weekend: 'a lecture, a photo route and a long dinner conversation', futurePlans: 'to shape ethical AI policy and build a thoughtful partnership', visualSignal: 'intelligent warmth and intentional style', shared: ['AI curiosity and ethical values.', 'Travel, photography and direct communication.', 'Top-tier long-form compatibility.'], risks: ['High standards for honesty and accountability.'], metrics: { Values: 97, Attraction: 92, Lifestyle: 92, Intent: 95, Uncertainty: 5 }, map: { x: 68, y: 16 },
  },
  {
    id: 'lucas', name: 'Lucas', age: 33, role: 'Teacher', distance: '2.6 km away', status: 'Offline', intent: ['Serious', 'Family-minded', 'Gentle'], score: 87, photoGroup: 'men', photoId: 37, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Women',
    about: 'Patient teacher, weekend baker, and a believer in small rituals over big gestures.', character: 'patient, tender and quietly reliable', hobbies: ['baking', 'reading aloud', 'cycling'], interests: ['education', 'family rituals', 'local travel'], values: ['patience', 'care', 'stability'], lifestyle: 'school rhythm, early evenings and simple pleasures', datingGoals: 'a serious family-minded partnership with warmth and humor', communicationStyle: 'patient, kind and reassuring', education: 'MA Education', favoriteActivities: ['baking bread', 'park walks', 'small concerts'], weekend: 'baking, grading lightly and seeing nieces or friends', futurePlans: 'to become a school coordinator and build a kind family life', visualSignal: 'gentle smile and approachable warmth', shared: ['Gentle reliability and consistency.', 'Calm weekends and grounded plans.', 'Warm but slower attraction curve.'], risks: ['May feel too calm if seeking constant novelty.'], metrics: { Values: 92, Attraction: 78, Lifestyle: 90, Intent: 93, Uncertainty: 13 }, map: { x: 33, y: 57 },
  },
  {
    id: 'elise', name: 'Elise', age: 26, role: 'Startup Marketer', distance: '1.9 km away', status: 'Online now', intent: ['Casual', 'Ambitious', 'Tonight'], score: 79, photoGroup: 'women', photoId: 41, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Big calendar, big laugh, enjoys rooftop drinks and people with a plan.', character: 'bright, ambitious and socially fearless', hobbies: ['rooftop drinks', 'growth experiments', 'dance classes'], interests: ['startups', 'fashion', 'travel deals'], values: ['ambition', 'fun', 'directness'], lifestyle: 'fast, social and opportunity-driven', datingGoals: 'chemistry and adventure first, with honesty about expectations', communicationStyle: 'quick, enthusiastic and candid', education: 'BA Marketing', favoriteActivities: ['rooftops', 'dance nights', 'pitch events'], weekend: 'events, friends and a recovery brunch', futurePlans: 'to lead a brand team and keep life exciting', visualSignal: 'bright smile and social confidence', shared: ['Ambition and city energy.', 'High spark, different pacing needs.', 'Good for a vivid first date.'], risks: ['May not want the same serious pace immediately.'], metrics: { Values: 74, Attraction: 90, Lifestyle: 82, Intent: 66, Uncertainty: 27 }, map: { x: 48, y: 82 },
  },
  {
    id: 'hugo', name: 'Hugo', age: 39, role: 'Bookshop Owner', distance: '9.1 km away', status: 'Offline', intent: ['Serious', 'Introvert', 'Slow dating'], score: 89, photoGroup: 'men', photoId: 91, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Owns a small bookshop, writes letters, and prefers dates where silence is comfortable.', character: 'literary, calm and deeply loyal', hobbies: ['bookselling', 'letter writing', 'old cinema'], interests: ['literature', 'history', 'quiet travel'], values: ['depth', 'loyalty', 'patience'], lifestyle: 'slow, local and culturally rich', datingGoals: 'a lasting relationship with emotional depth and peaceful routines', communicationStyle: 'careful, warm and reflective', education: 'MA Comparative Literature', favoriteActivities: ['bookshop evenings', 'letter writing', 'old films'], weekend: 'opening the shop, reading and cooking slowly', futurePlans: 'to keep the bookshop alive and share a quiet home', visualSignal: 'quiet confidence and thoughtful expression', shared: ['Deep conversations and quiet confidence.', 'Slow dating and literary curiosity.', 'Distance is the main downside.'], risks: ['Distance and introversion may slow momentum.'], metrics: { Values: 94, Attraction: 83, Lifestyle: 84, Intent: 92, Uncertainty: 10 }, map: { x: 88, y: 74 },
  },
  {
    id: 'laila', name: 'Laila', age: 29, role: 'Dancer', distance: '3.3 km away', status: 'Online now', intent: ['Serious', 'Active', 'Creative'], score: 88, photoGroup: 'women', photoId: 84, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Men & women',
    about: 'Expressive, disciplined, loves movement, music and people who listen with their whole body.', character: 'expressive, disciplined and emotionally intuitive', hobbies: ['contemporary dance', 'live music', 'bodywork'], interests: ['performance', 'movement research', 'nutrition'], values: ['presence', 'discipline', 'emotional honesty'], lifestyle: 'physically active and artistically intense', datingGoals: 'a serious connection that respects art, body and vulnerability', communicationStyle: 'embodied, honest and passionate', education: 'Dance conservatory graduate', favoriteActivities: ['dance shows', 'music nights', 'stretching in parks'], weekend: 'rehearsal, a show and a nourishing meal', futurePlans: 'to choreograph internationally and build a supportive partnership', visualSignal: 'expressive energy and strong presence', shared: ['Active creative energy.', 'Music, embodiment and emotional honesty.', 'Strong attraction with some lifestyle uncertainty.'], risks: ['Rehearsal schedules can be intense.'], metrics: { Values: 86, Attraction: 94, Lifestyle: 85, Intent: 84, Uncertainty: 14 }, map: { x: 56, y: 66 },
  },
  {
    id: 'benoit', name: 'Benoit', age: 34, role: 'Civil Engineer', distance: '4.4 km away', status: 'Online now', intent: ['Serious', 'Stable', 'Practical'], score: 80, photoGroup: 'men', photoId: 23, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Women',
    about: 'Practical, dry humor, wants a relationship that feels safe and quietly alive.', character: 'practical, dryly funny and dependable', hobbies: ['woodworking', 'cycling', 'pub quizzes'], interests: ['infrastructure', 'Belgian beer', 'weekend trips'], values: ['safety', 'reliability', 'humor'], lifestyle: 'stable, practical and low-drama', datingGoals: 'a serious relationship with trust, humor and shared planning', communicationStyle: 'straightforward, dry and reassuring', education: 'MSc Civil Engineering', favoriteActivities: ['cycling routes', 'pub quizzes', 'DIY projects'], weekend: 'a practical project, a bike ride and a casual beer', futurePlans: 'to renovate a home and build a secure partnership', visualSignal: 'grounded presence and understated charm', shared: ['Safety and stable intent.', 'Practical planning style.', 'Lower novelty but strong reliability.'], risks: ['May underplay romance unless encouraged.'], metrics: { Values: 85, Attraction: 74, Lifestyle: 88, Intent: 89, Uncertainty: 18 }, map: { x: 21, y: 46 },
  },
  {
    id: 'clara', name: 'Clara', age: 32, role: 'Veterinarian', distance: '5.9 km away', status: 'Offline', intent: ['Serious', 'Animals', 'Gentle'], score: 93, photoGroup: 'women', photoId: 20, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Veterinarian, cat person, soft but not vague, happiest near water or old streets.', character: 'gentle, competent and emotionally steady', hobbies: ['animal care', 'kayaking', 'old streets'], interests: ['veterinary medicine', 'nature', 'slow food'], values: ['care', 'clarity', 'responsibility'], lifestyle: 'care-oriented, active and calm', datingGoals: 'a stable serious relationship with tenderness and shared care', communicationStyle: 'gentle, clear and responsible', education: 'Doctor of Veterinary Medicine', favoriteActivities: ['water walks', 'animal shelters', 'slow dinners'], weekend: 'a clinic shift, nature and a dinner near water', futurePlans: 'to open a small clinic and build a warm home', visualSignal: 'kind eyes and grounded softness', shared: ['Cats, care and emotional steadiness.', 'Gentle directness and travel curiosity.', 'Very low uncertainty for long-term fit.'], risks: ['Work emergencies may interrupt plans.'], metrics: { Values: 95, Attraction: 90, Lifestyle: 91, Intent: 94, Uncertainty: 6 }, map: { x: 73, y: 83 },
  },
  {
    id: 'youssef', name: 'Youssef', age: 27, role: 'Filmmaker', distance: '2.9 km away', status: 'Online now', intent: ['Casual', 'Creative', 'Adventure'], score: 77, photoGroup: 'men', photoId: 55, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Carries a camera, says yes quickly, and believes every city has a secret angle.', character: 'adventurous, visual and impulsively charming', hobbies: ['short films', 'street photography', 'night buses'], interests: ['cinema', 'travel', 'urban secrets'], values: ['freedom', 'curiosity', 'art'], lifestyle: 'fluid, project-based and spontaneous', datingGoals: 'adventure, honesty and maybe depth if the timing aligns', communicationStyle: 'visual, excited and sometimes nonlinear', education: 'Film school graduate', favoriteActivities: ['film shoots', 'street food', 'midnight walks'], weekend: 'shooting footage and discovering a new neighborhood', futurePlans: 'to make a feature documentary and travel more', visualSignal: 'artistic intensity and open expression', shared: ['Photography and adventure.', 'High creative spark.', 'Intent mismatch makes this lighter.'], risks: ['Intent and routine may be less stable.'], metrics: { Values: 72, Attraction: 89, Lifestyle: 81, Intent: 61, Uncertainty: 30 }, map: { x: 31, y: 16 },
  },
  {
    id: 'eva', name: 'Eva', age: 35, role: 'Product Manager', distance: '6.0 km away', status: 'Online now', intent: ['Serious', 'Ambitious', 'Clear plans'], score: 91, photoGroup: 'women', photoId: 33, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Men',
    about: 'Ambitious but warm, likes clear plans, travel spreadsheets and honest conflict repair.', character: 'strategic, warm and emotionally accountable', hobbies: ['travel planning', 'strength training', 'hosting dinners'], interests: ['product strategy', 'wine regions', 'psychology'], values: ['accountability', 'ambition', 'warmth'], lifestyle: 'planned, active and socially warm', datingGoals: 'a serious partnership with shared ambition and good repair skills', communicationStyle: 'clear, structured and affectionate', education: 'MBA', favoriteActivities: ['dinner hosting', 'travel planning', 'strength classes'], weekend: 'a workout, errands and a well-planned dinner', futurePlans: 'to lead a product org and build a generous home life', visualSignal: 'polished warmth and confident posture', shared: ['Ambition and clear planning.', 'Travel and honest communication.', 'Strong match explanation confidence.'], risks: ['May need plans to feel secure.'], metrics: { Values: 93, Attraction: 88, Lifestyle: 89, Intent: 93, Uncertainty: 9 }, map: { x: 63, y: 38 },
  },
  {
    id: 'matteo', name: 'Matteo', age: 29, role: 'Nurse', distance: '1.3 km away', status: 'Online now', intent: ['Serious', 'Kind', 'Grounded'], score: 92, photoGroup: 'men', photoId: 41, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Gentle nurse, good listener, into cycling, homemade soup and people who mean what they say.', character: 'kind, grounded and emotionally present', hobbies: ['cycling', 'soup recipes', 'community volunteering'], interests: ['healthcare', 'local food', 'family stories'], values: ['kindness', 'consistency', 'service'], lifestyle: 'shift-based but caring and grounded', datingGoals: 'a serious relationship built on kindness and reliability', communicationStyle: 'listening-first, warm and honest', education: 'Bachelor in Nursing', favoriteActivities: ['bike rides', 'home cooking', 'neighborhood walks'], weekend: 'a shift, a bike ride and cooking for someone he likes', futurePlans: 'to specialize in emergency care and create a warm family rhythm', visualSignal: 'gentle face and calm confidence', shared: ['Kindness and consistency.', 'Active but calm lifestyle.', 'Reliable emotional availability.'], risks: ['Shift work requires flexible planning.'], metrics: { Values: 96, Attraction: 86, Lifestyle: 93, Intent: 91, Uncertainty: 7 }, map: { x: 41, y: 61 },
  },
  {
    id: 'iris', name: 'Iris', age: 23, role: 'Student and DJ', distance: '2.1 km away', status: 'Online now', intent: ['Casual', 'Music', 'Tonight'], score: 70, photoGroup: 'women', photoId: 8, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Studies sociology, DJs sometimes, spontaneous and still figuring out what she wants.', character: 'curious, social and still exploring', hobbies: ['DJ sets', 'sociology reading', 'thrifting'], interests: ['music scenes', 'social theory', 'night culture'], values: ['freedom', 'learning', 'fun'], lifestyle: 'student rhythm with late music nights', datingGoals: 'fun, respect and room to discover what feels right', communicationStyle: 'casual, honest and energetic', education: 'BA Sociology student', favoriteActivities: ['DJ nights', 'thrift markets', 'late fries'], weekend: 'music, friends and recovering with coffee', futurePlans: 'to finish studies and understand what kind of life she wants', visualSignal: 'youthful spark and playful styling', shared: ['Music and social curiosity.', 'Fun but lower commitment clarity.', 'Best for a light first meet.'], risks: ['Commitment goals are not fully defined yet.'], metrics: { Values: 67, Attraction: 87, Lifestyle: 74, Intent: 52, Uncertainty: 36 }, map: { x: 12, y: 84 },
  },
  {
    id: 'thomas', name: 'Thomas', age: 38, role: 'Landscape Designer', distance: '10.4 km away', status: 'Offline', intent: ['Serious', 'Outdoors', 'Slow dating'], score: 84, photoGroup: 'men', photoId: 68, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Women',
    about: 'Designs gardens, quiet voice, long walks, and a serious dislike of rushed intimacy.', character: 'quiet, earthy and deeply patient', hobbies: ['garden design', 'birdwatching', 'woodland walks'], interests: ['landscapes', 'plants', 'rural weekends'], values: ['patience', 'nature', 'trust'], lifestyle: 'outdoor, slow and restorative', datingGoals: 'a serious relationship that grows through patience and shared quiet', communicationStyle: 'soft, slow and sincere', education: 'Landscape Architecture degree', favoriteActivities: ['garden visits', 'forest walks', 'simple picnics'], weekend: 'plants, a walk and a calm meal outside the city', futurePlans: 'to design public gardens and live closer to nature', visualSignal: 'natural calm and understated warmth', shared: ['Walks, nature and slow trust.', 'Clear boundaries and steady intent.', 'Distance and introversion add friction.'], risks: ['Distance and slow pace may reduce early momentum.'], metrics: { Values: 91, Attraction: 78, Lifestyle: 92, Intent: 90, Uncertainty: 15 }, map: { x: 92, y: 32 },
  },
  {
    id: 'ruben', name: 'Ruben', age: 31, role: 'Sound Engineer', distance: '3.5 km away', status: 'Online now', intent: ['Serious', 'Music', 'Calm'], score: 86, photoGroup: 'men', photoId: 90, photoPrivacy: 'public', genderIdentity: 'Man', interestedIn: 'Everyone',
    about: 'Quiet sound engineer who loves warm studios, vinyl, and honest people who do not need to perform.', character: 'attentive, calm and technically creative', hobbies: ['vinyl collecting', 'studio sessions', 'night walks'], interests: ['sound design', 'analogue gear', 'small concerts'], values: ['presence', 'craft', 'honesty'], lifestyle: 'creative nights with calm recovery days', datingGoals: 'a serious but unforced connection with room for music and quiet', communicationStyle: 'listening-heavy, precise and gentle', education: 'Audio engineering diploma', favoriteActivities: ['listening bars', 'studio visits', 'quiet walks'], weekend: 'a session, records and one honest conversation', futurePlans: 'to build a small studio and a steady relationship', visualSignal: 'calm style and attentive listening', shared: ['Music, quiet confidence and craft.', 'Emotionally safe pacing.', 'Good balance of creativity and stability.'], risks: ['Late studio hours can affect availability.'], metrics: { Values: 88, Attraction: 84, Lifestyle: 86, Intent: 87, Uncertainty: 13 }, map: { x: 36, y: 51 },
  },
  {
    id: 'mina', name: 'Mina', age: 30, role: 'Climate Consultant', distance: '4.7 km away', status: 'Online now', intent: ['Serious', 'Values aligned', 'Outdoors'], score: 94, photoGroup: 'women', photoId: 56, photoPrivacy: 'public', genderIdentity: 'Woman', interestedIn: 'Everyone',
    about: 'Climate consultant, mountain walker, and direct communicator with a very soft laugh.', character: 'principled, warm and quietly adventurous', hobbies: ['mountain walks', 'climate reading', 'vegetarian cooking'], interests: ['sustainability', 'policy', 'nature travel'], values: ['responsibility', 'kindness', 'future thinking'], lifestyle: 'purposeful work with outdoor recovery', datingGoals: 'a serious relationship with shared values and room for adventure', communicationStyle: 'direct, caring and solution-oriented', education: 'MSc Environmental Policy', favoriteActivities: ['hikes', 'farm-to-table dinners', 'train trips'], weekend: 'a hike, a climate article and dinner with friends', futurePlans: 'to work on climate resilience and build a grounded shared life', visualSignal: 'fresh natural style and steady warmth', shared: ['Strong values and outdoor rhythm.', 'Clear communication with softness.', 'Long-term future orientation.'], risks: ['May need a partner who takes values seriously.'], metrics: { Values: 97, Attraction: 88, Lifestyle: 94, Intent: 92, Uncertainty: 6 }, map: { x: 77, y: 24 },
  },
]

export const matches = profileSeeds.map(createProfile)

export const nearby = matches.slice(0, 12).map((match) => ({
  id: match.id,
  name: match.name,
  distance: match.distance.replace(' away', ''),
  photo: match.photo,
}))
