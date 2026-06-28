export const viewer = {
  id: 'alex',
  name: 'Alex',
  fullName: 'Alex Mercer',
  age: 31,
  plan: 'Premium',
  city: 'Brussels',
  email: 'you@matchpulse.com',
  phone: '',
  language: 'English',
  photo: '/portraits/alex.jpg',
  orientation: 'Straight',
  genderIdentity: 'Man',
  interestedIn: 'Everyone',
  photoPrivacy: 'public',
  lookingFor: 'Serious',
  bio: 'Warm, ambitious, direct. I like city energy, quiet mornings, and dates that feel natural instead of performed.',
  profileCompletion: 98,
  preferences: {
    values: ['Consistency', 'Emotional availability', 'Growth', 'Creative life'],
    dealbreakers: ['Vague intent', 'Poor communication', 'No curiosity'],
    visualTaste: ['Natural style', 'Warm eyes', 'Quiet confidence'],
    dateRhythm: ['Coffee first', 'Walks', 'Dinner after trust'],
  },
  aiMemory: [
    'You value honesty, consistency and ambition.',
    'You prefer deep conversations and real connection over small talk.',
    'You are most attracted to emotionally intelligent people with a creative side.',
    'You enjoy active lifestyles and spontaneous adventures.',
  ],
}

const portraitPool = [
  '/portraits/marco.jpg',
  '/portraits/ethan.jpg',
  '/portraits/julian.jpg',
  '/portraits/noah.jpg',
  '/portraits/liam.jpg',
  '/portraits/zara.jpg',
  '/portraits/kai.jpg',
  '/portraits/maya.jpg',
  '/portraits/milan.jpg',
  '/portraits/alex.jpg',
]

const matchSeeds = [
  ['julian', 'Julian', 28, 'Architect at Studio A', '2.4 km away', 'Online now', ['Serious', 'Tonight', 'Values aligned'], 93, 7, 'public', 'Designs quiet spaces, cooks late, and likes dates that turn into long walks.', ['Calm chemistry and clear communication.', 'Architecture, slow travel and atmospheric dinners.', 'Serious intent without forcing the timeline.'], [93, 91, 88, 90, 7], [50, 44], 'Man', 'Everyone'],
  ['marco', 'Marco', 31, 'Product Designer', '4.1 km away', 'Online now', ['Serious', 'Creative', 'Slow dating'], 89, 1, 'blurred', 'Soft-spoken, visually sharp, and very good at finding a table near the window.', ['Good taste without showing off.', 'Slow starts and thoughtful messages.', 'Compatible first-date rhythm.'], [88, 89, 85, 86, 14], [75, 30], 'Man', 'Men'],
  ['ethan', 'Ethan', 26, 'Founder', '1.8 km away', 'Online now', ['Serious', 'Ambitious', 'Tonight'], 87, 2, 'private', 'Building a small company and looking for someone who understands momentum.', ['Growth and meaningful connection.', 'Soulful conversations and travel.', 'High attraction with a faster pace.'], [90, 92, 82, 84, 18], [28, 63], 'Man', 'Everyone'],
  ['noah', 'Noah', 29, 'Data Scientist', '3.2 km away', 'Online now', ['Serious', 'Grounded', 'Quiet'], 84, 3, 'public', 'Curious, grounded, into long bike rides and cleanly written thoughts.', ['Precision and emotionally safe conversations.', 'Calm social style and weekend rhythm.', 'Strong long-term stability.'], [86, 79, 91, 87, 12], [64, 75], 'Man', 'Men & women'],
  ['liam', 'Liam', 27, 'Brand Strategist', '5.5 km away', 'Online now', ['Casual', 'Tonight', 'Playful'], 81, 4, 'public', 'Fast humor, big energy, and open to a fun plan when the vibe is honest.', ['Spontaneous evenings and city energy.', 'High attraction, lower intent alignment.', 'Best as a playful low-pressure match.'], [75, 90, 84, 68, 26], [38, 26], 'Non-binary', 'Everyone'],
  ['maya', 'Maya', 30, 'Documentary Photographer', '1.1 km away', 'Online now', ['Serious', 'Creative', 'Travel'], 95, 7, 'public', 'Warm observer, loves cats, trains, old cities and photo walks after coffee.', ['Travel curiosity and gentle ambition.', 'Cats, photography and slow weekend mornings.', 'High trust potential with natural chemistry.'], [95, 94, 91, 92, 6], [45, 34], 'Woman', 'Everyone'],
  ['zara', 'Zara', 33, 'Clinical Psychologist', '2.0 km away', 'Offline', ['Serious', 'Emotionally available', 'Slow dating'], 92, 5, 'public', 'Direct, kind, and interested in people who can name what they feel.', ['Emotional availability and honest repair.', 'Deep conversations without pressure.', 'Compatible boundaries and communication.'], [96, 86, 88, 94, 9], [58, 55], 'Woman', 'Men & women'],
  ['kai', 'Kai', 25, 'Barista and Musician', '0.8 km away', 'Online now', ['Casual', 'Creative', 'Music'], 78, 6, 'blurred', 'Makes espresso, writes tiny songs, and is happiest in intimate live music rooms.', ['Music and creative city energy.', 'Easy first-date ideas.', 'Fun spark with less long-term certainty.'], [73, 88, 80, 65, 29], [34, 40], 'Non-binary', 'Everyone'],
  ['milan', 'Milan', 35, 'Urban Planner', '6.2 km away', 'Offline', ['Serious', 'Stable', 'Family-minded'], 88, 8, 'public', 'Likes public spaces, Sunday markets, and relationships that become calmer over time.', ['Stable pace and grounded values.', 'City walks and thoughtful planning.', 'Clear serious intent.'], [90, 82, 93, 91, 11], [70, 68], 'Man', 'Everyone'],
  ['amelie', 'Amelie', 29, 'UX Researcher', '3.7 km away', 'Online now', ['Serious', 'Curious', 'Coffee first'], 91, 5, 'public', 'Asks precise questions, keeps a travel notebook, and prefers honesty over performance.', ['Curiosity and clear communication.', 'Coffee-first rhythm and travel stories.', 'A strong explainable AI fit.'], [92, 87, 90, 89, 10], [22, 52], 'Woman', 'Everyone'],
  ['samir', 'Samir', 32, 'Policy Advisor', '7.4 km away', 'Offline', ['Serious', 'Calm', 'Values aligned'], 85, 0, 'public', 'Introverted, loyal, politically engaged, and happiest with one good plan per weekend.', ['Loyalty and thoughtful values.', 'Calm pacing and direct intent.', 'Less visual spark, strong trust signal.'], [91, 76, 87, 92, 16], [80, 42], 'Man', 'Women'],
  ['lena', 'Lena', 27, 'Yoga Teacher', '2.8 km away', 'Online now', ['Serious', 'Active', 'Gentle'], 86, 7, 'blurred', 'Morning movement, warm friends, cats, and dates that feel simple and kind.', ['Natural active energy.', 'Gentle communication and healthy routines.', 'Shared love of animals and quiet mornings.'], [84, 89, 92, 82, 15], [42, 72], 'Woman', 'Men'],
  ['victor', 'Victor', 36, 'Chef', '4.9 km away', 'Online now', ['Casual', 'Dinner', 'Tonight'], 76, 1, 'public', 'Extroverted chef with a loud laugh, late shifts and excellent pasta opinions.', ['Dinner chemistry and city energy.', 'Fun attraction but different routines.', 'Better for spontaneous plans than stability.'], [70, 91, 72, 63, 31], [18, 28], 'Man', 'Everyone'],
  ['nora', 'Nora', 34, 'Museum Curator', '5.1 km away', 'Offline', ['Serious', 'Creative', 'Slow dating'], 90, 5, 'public', 'Reads exhibition labels fully, loves jazz, and moves carefully when something matters.', ['Creative life and quiet depth.', 'Slow romantic pacing.', 'Strong cultural overlap.'], [94, 84, 86, 91, 8], [60, 22], 'Woman', 'Everyone'],
  ['daan', 'Daan', 30, 'Physiotherapist', '1.6 km away', 'Online now', ['Serious', 'Sporty', 'Outdoors'], 83, 6, 'public', 'Sporty but soft, into hiking, recovery science and making breakfast after a long run.', ['Active lifestyle and care-oriented work.', 'Warm practical date rhythm.', 'Good but not perfect personality overlap.'], [82, 85, 94, 80, 17], [25, 77], 'Man', 'Women'],
  ['ines', 'Ines', 28, 'Illustrator', '2.2 km away', 'Online now', ['Serious', 'Creative', 'Introvert'], 94, 7, 'private', 'Draws tiny city scenes, loves cats, rainy bookstores and people who are emotionally clear.', ['Cats, creativity and emotional clarity.', 'Quiet first dates and bookstore energy.', 'Very high values and attraction match.'], [96, 93, 89, 93, 7], [52, 18], 'Woman', 'Men & women'],
  ['renee', 'Renee', 37, 'Lawyer', '8.5 km away', 'Offline', ['Serious', 'Direct', 'Stable'], 82, 8, 'public', 'Sharp, loyal and busy; makes room when something feels serious and respectful.', ['Direct communication and loyalty.', 'Clear relationship intent.', 'Schedule friction creates some uncertainty.'], [88, 80, 76, 90, 21], [83, 58], 'Woman', 'Men'],
  ['otto', 'Otto', 24, 'Game Developer', '3.9 km away', 'Online now', ['Casual', 'Creative', 'Playful'], 73, 3, 'blurred', 'Night owl, indie games, ramen, and chaotic but charming voice notes.', ['Creative curiosity and humor.', 'Different routines and lower intent match.', 'Fun conversation potential.'], [68, 86, 70, 58, 34], [15, 62], 'Man', 'Everyone'],
  ['sofia', 'Sofia', 31, 'AI Ethicist', '6.8 km away', 'Online now', ['Serious', 'AI', 'Values aligned'], 96, 5, 'public', 'Works on responsible AI, loves photography, trains to new cities and very honest conversations.', ['AI curiosity and ethical values.', 'Travel, photography and direct communication.', 'Top-tier long-form compatibility.'], [97, 92, 92, 95, 5], [68, 16], 'Woman', 'Everyone'],
  ['lucas', 'Lucas', 33, 'Teacher', '2.6 km away', 'Offline', ['Serious', 'Family-minded', 'Gentle'], 87, 0, 'public', 'Patient teacher, weekend baker, and a believer in small rituals over big gestures.', ['Gentle reliability and consistency.', 'Calm weekends and grounded plans.', 'Warm but slower attraction curve.'], [92, 78, 90, 93, 13], [33, 57], 'Man', 'Women'],
  ['elise', 'Elise', 26, 'Startup Marketer', '1.9 km away', 'Online now', ['Casual', 'Ambitious', 'Tonight'], 79, 7, 'public', 'Big calendar, big laugh, enjoys rooftop drinks and people with a plan.', ['Ambition and city energy.', 'High spark, different pacing needs.', 'Good for a vivid first date.'], [74, 90, 82, 66, 27], [48, 82], 'Woman', 'Everyone'],
  ['hugo', 'Hugo', 39, 'Bookshop Owner', '9.1 km away', 'Offline', ['Serious', 'Introvert', 'Slow dating'], 89, 2, 'public', 'Owns a small bookshop, writes letters, and prefers dates where silence is comfortable.', ['Deep conversations and quiet confidence.', 'Slow dating and literary curiosity.', 'Distance is the main downside.'], [94, 83, 84, 92, 10], [88, 74], 'Man', 'Everyone'],
  ['laila', 'Laila', 29, 'Dancer', '3.3 km away', 'Online now', ['Serious', 'Active', 'Creative'], 88, 5, 'private', 'Expressive, disciplined, loves movement, music and people who listen with their whole body.', ['Active creative energy.', 'Music, embodiment and emotional honesty.', 'Strong attraction with some lifestyle uncertainty.'], [86, 94, 85, 84, 14], [56, 66], 'Woman', 'Men & women'],
  ['benoit', 'Benoit', 34, 'Civil Engineer', '4.4 km away', 'Online now', ['Serious', 'Stable', 'Practical'], 80, 3, 'public', 'Practical, dry humor, wants a relationship that feels safe and quietly alive.', ['Safety and stable intent.', 'Practical planning style.', 'Lower novelty but strong reliability.'], [85, 74, 88, 89, 18], [21, 46], 'Man', 'Women'],
  ['clara', 'Clara', 32, 'Veterinarian', '5.9 km away', 'Offline', ['Serious', 'Animals', 'Gentle'], 93, 7, 'public', 'Veterinarian, cat person, soft but not vague, happiest near water or old streets.', ['Cats, care and emotional steadiness.', 'Gentle directness and travel curiosity.', 'Very low uncertainty for long-term fit.'], [95, 90, 91, 94, 6], [73, 83], 'Woman', 'Everyone'],
  ['youssef', 'Youssef', 27, 'Filmmaker', '2.9 km away', 'Online now', ['Casual', 'Creative', 'Adventure'], 77, 1, 'blurred', 'Carries a camera, says yes quickly, and believes every city has a secret angle.', ['Photography and adventure.', 'High creative spark.', 'Intent mismatch makes this lighter.'], [72, 89, 81, 61, 30], [31, 16], 'Man', 'Everyone'],
  ['eva', 'Eva', 35, 'Product Manager', '6.0 km away', 'Online now', ['Serious', 'Ambitious', 'Clear plans'], 91, 5, 'public', 'Ambitious but warm, likes clear plans, travel spreadsheets and honest conflict repair.', ['Ambition and clear planning.', 'Travel and honest communication.', 'Strong match explanation confidence.'], [93, 88, 89, 93, 9], [63, 38], 'Woman', 'Men'],
  ['matteo', 'Matteo', 29, 'Nurse', '1.3 km away', 'Online now', ['Serious', 'Kind', 'Grounded'], 92, 0, 'public', 'Gentle nurse, good listener, into cycling, homemade soup and people who mean what they say.', ['Kindness and consistency.', 'Active but calm lifestyle.', 'Reliable emotional availability.'], [96, 86, 93, 91, 7], [41, 61], 'Man', 'Everyone'],
  ['iris', 'Iris', 23, 'Student and DJ', '2.1 km away', 'Online now', ['Casual', 'Music', 'Tonight'], 70, 7, 'public', 'Studies sociology, DJs sometimes, spontaneous and still figuring out what she wants.', ['Music and social curiosity.', 'Fun but lower commitment clarity.', 'Best for a light first meet.'], [67, 87, 74, 52, 36], [12, 84], 'Woman', 'Everyone'],
  ['thomas', 'Thomas', 38, 'Landscape Designer', '10.4 km away', 'Offline', ['Serious', 'Outdoors', 'Slow dating'], 84, 2, 'private', 'Designs gardens, quiet voice, long walks, and a serious dislike of rushed intimacy.', ['Walks, nature and slow trust.', 'Clear boundaries and steady intent.', 'Distance and introversion add friction.'], [91, 78, 92, 90, 15], [92, 32], 'Man', 'Women'],
]

function photoSet(index) {
  return [...new Set([
    portraitPool[index % portraitPool.length],
    portraitPool[(index + 3) % portraitPool.length],
    portraitPool[(index + 6) % portraitPool.length],
  ])]
}

function laneFromScore(score, uncertainty) {
  if (score >= 92 && uncertainty <= 10) return 'Topmatch'
  if (score >= 86) return 'Deep fit'
  if (score >= 78) return 'Promising'
  return 'Light spark'
}

export const matches = matchSeeds.map(([
  id,
  name,
  age,
  role,
  distance,
  status,
  intent,
  score,
  photoIndex,
  photoPrivacy,
  about,
  shared,
  metricValues,
  mapPosition,
  genderIdentity,
  interestedIn,
], index) => {
  const photos = photoSet(photoIndex + index)
  const [values, attraction, lifestyle, intentScore, uncertainty] = metricValues
  return {
    id,
    name,
    age,
    role,
    city: 'Brussels',
    distance,
    status,
    intent,
    score,
    photo: photos[0],
    portrait: photos[0],
    photos,
    genderIdentity,
    interestedIn,
    photoPrivacy,
    about,
    shared,
    metrics: {
      Values: values,
      Attraction: attraction,
      Lifestyle: lifestyle,
      Intent: intentScore,
      Uncertainty: uncertainty,
    },
    ranking: {
      lane: laneFromScore(score, uncertainty),
      reason: shared[0],
    },
    map: { x: mapPosition[0], y: mapPosition[1] },
  }
})

export const nearby = matches.slice(0, 6).map((match) => ({
  id: match.id,
  name: match.name,
  distance: match.distance.replace(' away', ''),
  photo: match.photo,
}))
