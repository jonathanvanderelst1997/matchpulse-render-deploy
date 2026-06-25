import { createServer } from 'node:http'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { matches, viewer } from '../src/data.js'

const PORT = Number(process.env.PORT ?? process.env.MATCHPULSE_API_PORT ?? 8787)
const HOST = process.env.HOST ?? '127.0.0.1'
const dbUrl = new URL('./matchpulse-db.json', import.meta.url)
const tempDbUrl = new URL('./matchpulse-db.json.tmp', import.meta.url)
const serverDir = fileURLToPath(new URL('.', import.meta.url))
const uploadsDir = join(serverDir, 'uploads')
const distDir = join(serverDir, '..', 'dist')
const openAiModel = process.env.OPENAI_MODEL ?? 'gpt-5-mini'
const supabaseStateId = process.env.MATCHPULSE_STATE_ID ?? 'beta'
const supabaseStorageBucket = process.env.MATCHPULSE_STORAGE_BUCKET ?? 'profile-photos'
let mutationQueue = Promise.resolve()

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const defaultPrivacySettings = {
  memoryLearning: true,
  attentionLearning: true,
  weeklyBriefing: true,
  fuzzyLocation: true,
  onlineStatus: true,
}

const genderIdentityOptions = ['Not shown', 'Man', 'Woman', 'Non-binary', 'Trans man', 'Trans woman', 'Another identity']
const interestPreferences = ['Men', 'Women', 'Men & women', 'Everyone']
const photoPrivacyIds = new Set(['public', 'blurred', 'private'])

const memoryVisibilityIds = new Set(['private', 'match_ai', 'shareable', 'profile', 'never'])

const defaultLinkedTools = [
  { id: 'chatgpt', label: 'ChatGPT export', connected: true, detail: 'Profile conversations' },
  { id: 'calendar', label: 'Calendar', connected: true, detail: 'Date rhythm' },
  { id: 'spotify', label: 'Spotify', connected: false, detail: 'Taste and mood' },
  { id: 'photos', label: 'Photos', connected: false, detail: 'Visual preference' },
  { id: 'notes', label: 'Notes', connected: true, detail: 'Private reflections' },
  { id: 'location', label: 'Location', connected: true, detail: 'Nearby, fuzzed' },
]

const betaTesterPersonas = [
  {
    name: 'Lina',
    age: 28,
    role: 'Architect',
    city: 'Brussels',
    photo: '/portraits/maya.jpg',
    orientation: 'Straight',
    genderIdentity: 'Woman',
    interestedIn: 'Men',
    photoPrivacy: 'public',
    lookingFor: 'Serious',
    bio: 'Quiet confidence, design, long walks, honest timing and emotional steadiness. I feel most open with someone who can plan calmly, listen closely, and still bring a little spark into ordinary evenings. I like people with warm eyes, natural style, creative discipline, and enough self-knowledge to say what they want without pressure.',
    values: ['Calm chemistry', 'Creative life', 'Clear plans', 'Kind ambition'],
    visualTaste: ['Natural style', 'Warm eyes', 'Minimal elegance'],
    dateRhythm: ['Coffee first', 'Gallery walks', 'Dinner after trust'],
  },
  {
    name: 'Milan',
    age: 30,
    role: 'Designer',
    city: 'Antwerp',
    photo: '/portraits/milan.jpg',
    orientation: 'Gay',
    genderIdentity: 'Man',
    interestedIn: 'Men',
    photoPrivacy: 'blurred',
    lookingFor: 'Serious',
    bio: 'Design, wellness, outdoor weekends and people who make time instead of excuses. I am drawn to clean style, expressive eyes, grounded confidence, and people who can move between deep conversation and easy silence. I want something serious, but it has to feel light enough to breathe.',
    values: ['Presence', 'Growth', 'Reliability', 'Taste'],
    visualTaste: ['Quiet confidence', 'Clean style', 'Expressive eyes'],
    dateRhythm: ['Walk first', 'Dinner if it flows', 'Weekend plans'],
  },
  {
    name: 'Zara',
    age: 27,
    role: 'Brand strategist',
    city: 'Ghent',
    photo: '/portraits/zara.jpg',
    orientation: 'Open',
    genderIdentity: 'Non-binary',
    interestedIn: 'Everyone',
    photoPrivacy: 'private',
    lookingFor: 'Casual',
    bio: 'Playful but direct. I like art openings, late talks, and chemistry with boundaries. I notice bold style, warm humor, curiosity, and people who flirt with clarity instead of games. I am not rushing into a label, but I care about honesty, autonomy, and leaving each other better than we arrived.',
    values: ['Honesty', 'Autonomy', 'Curiosity', 'Warm humor'],
    visualTaste: ['Bold style', 'Warm smile', 'Creative energy'],
    dateRhythm: ['Spontaneous drinks', 'Art nights', 'No pressure'],
  },
  {
    name: 'Noor',
    age: 29,
    role: 'Product lead',
    city: 'Brussels',
    photo: '/portraits/kai.jpg',
    orientation: 'Straight',
    genderIdentity: 'Trans man',
    interestedIn: 'Everyone',
    photoPrivacy: 'public',
    lookingFor: 'Tonight',
    bio: 'City energy, clean communication, sharp minds and dates that do not feel overplanned. I like confident presence, warm voices, spontaneous plans that still feel respectful, and a first meeting that can stay short if the energy is off. I am open to tonight, but never at the cost of safety or kindness.',
    values: ['Directness', 'Energy', 'Respect', 'Ambition'],
    visualTaste: ['Confident presence', 'Natural style', 'Warm voice'],
    dateRhythm: ['Tonight if easy', 'Cocktails', 'Short first meeting'],
  },
]

function now() {
  return new Date().toISOString()
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeMemoryVisibility(value) {
  return memoryVisibilityIds.has(value) ? value : 'match_ai'
}

function legacyMemoryId(text, index = 0) {
  const slug = slugify(text).slice(0, 48) || 'memory'
  return `legacy-${index}-${slug}`
}

function createMemoryNote(text, visibility = 'match_ai', source = 'manual') {
  const cleanText = String(text ?? '').replace(/\s+/g, ' ').trim()
  const displayText = cleanText.startsWith('You said:')
    || cleanText.startsWith('Profile created')
    || cleanText.startsWith('Feedback:')
    || cleanText.startsWith('Beta tester profile:')
    || cleanText.startsWith('Values ')
    ? cleanText
    : `You said: ${cleanText}`

  return {
    id: randomUUID(),
    text: displayText,
    visibility: normalizeMemoryVisibility(visibility),
    source,
    createdAt: now(),
    updatedAt: now(),
  }
}

function normalizeMemory(note, index = 0) {
  if (note && typeof note === 'object') {
    const text = String(note.text ?? note.note ?? '').replace(/\s+/g, ' ').trim()
    if (!text) return null
    return {
      id: note.id || legacyMemoryId(text, index),
      text,
      visibility: normalizeMemoryVisibility(note.visibility),
      source: note.source ?? 'memory',
      createdAt: note.createdAt ?? '',
      updatedAt: note.updatedAt ?? note.createdAt ?? '',
    }
  }

  const text = String(note ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return null
  return {
    id: legacyMemoryId(text, index),
    text,
    visibility: 'match_ai',
    source: 'legacy',
    createdAt: '',
    updatedAt: '',
  }
}

function normalizeMemories(memories = []) {
  return Array.isArray(memories)
    ? memories.map((memory, index) => normalizeMemory(memory, index)).filter(Boolean)
    : []
}

function normalizeAttentionSignal(signal, index = 0) {
  if (!signal || typeof signal !== 'object') return null
  const label = String(signal.label ?? '').replace(/\s+/g, ' ').trim()
  const body = String(signal.body ?? '').replace(/\s+/g, ' ').trim()
  if (!label && !body) return null
  const id = slugify(signal.id || label || body) || `attention-${index}`
  return {
    id,
    kind: 'attention',
    matchId: String(signal.matchId ?? '').slice(0, 96),
    matchName: String(signal.matchName ?? 'Someone').replace(/\s+/g, ' ').trim().slice(0, 80),
    style: String(signal.style ?? label).replace(/\s+/g, ' ').trim().slice(0, 80),
    label: label.slice(0, 96) || 'Private attention signal',
    body: body.slice(0, 220) || 'Private learning signal for your matching algorithm.',
    count: clamp(Number.parseInt(signal.count, 10) || 1, 1, 99),
    seconds: clamp(Number.parseInt(signal.seconds, 10) || 0, 0, 999),
    visibility: 'Private algorithm only',
    updatedAt: signal.updatedAt ?? now(),
  }
}

function normalizeAttentionSignals(signals = []) {
  return Array.isArray(signals)
    ? signals.map((signal, index) => normalizeAttentionSignal(signal, index)).filter(Boolean).slice(0, 8)
    : []
}

function mergeAttentionSignalList(signals, nextSignal) {
  const normalizedSignal = normalizeAttentionSignal(nextSignal)
  if (!normalizedSignal) return normalizeAttentionSignals(signals)
  const currentSignals = normalizeAttentionSignals(signals)
  const existing = currentSignals.find((signal) => signal.id === normalizedSignal.id)
  const merged = existing
    ? {
        ...existing,
        count: clamp(existing.count + 1, 1, 99),
        seconds: clamp(existing.seconds + normalizedSignal.seconds, 0, 999),
        matchId: normalizedSignal.matchId,
        matchName: normalizedSignal.matchName,
        style: normalizedSignal.style,
        label: normalizedSignal.label,
        body: normalizedSignal.body,
        updatedAt: now(),
      }
    : { ...normalizedSignal, updatedAt: now() }

  return [merged, ...currentSignals.filter((signal) => signal.id !== merged.id)].slice(0, 8)
}

function prependMemory(db, userId, text, options = {}) {
  const memory = createMemoryNote(text, options.visibility, options.source)
  db.memories[userId] = [memory, ...normalizeMemories(db.memories[userId])].slice(0, options.limit ?? 10)
  return memory
}

function memoryMatchesRequest(memory, body) {
  return Boolean(
    (body.memoryId && memory.id === body.memoryId)
    || (body.note && memory.text === body.note)
    || (body.text && memory.text === body.text),
  )
}

function matchingMemoryText(db, userId) {
  return normalizeMemories(db?.memories?.[userId])
    .filter((memory) => ['match_ai', 'shareable', 'profile'].includes(memory.visibility))
    .map((memory) => memory.text)
    .join(' ')
}

function hashNumber(value, min, max) {
  const text = String(value)
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000
  }
  return min + (hash % (max - min + 1))
}

function normalizePreferences(profile) {
  return {
    values: profile.preferences?.values?.length
      ? profile.preferences.values
      : ['Honesty', 'Warmth', 'Growth', 'Clear communication'],
    dealbreakers: profile.preferences?.dealbreakers?.length
      ? profile.preferences.dealbreakers
      : ['Poor communication', 'Vague intent'],
    visualTaste: profile.preferences?.visualTaste?.length
      ? profile.preferences.visualTaste
      : ['Natural style', 'Warm eyes', 'Quiet confidence'],
    dateRhythm: profile.preferences?.dateRhythm?.length
      ? profile.preferences.dateRhythm
      : ['Coffee first', 'Walks', 'Dinner after trust'],
  }
}

function normalizeContact(value) {
  const contact = String(value ?? '').trim()
  if (!contact) return { contact: '', email: '', phone: '' }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
  const phone = contact.replace(/[^\d+]/g, '')
  return {
    contact,
    email: isEmail ? contact.toLowerCase() : '',
    phone: isEmail ? '' : phone || contact,
  }
}

function findUserByContact(db, contact = '') {
  const contactInfo = normalizeContact(contact)
  if (!contactInfo.contact) return null

  return db.users.find((user) => {
    if (user.deletedAt) return false
    const profile = user.profile ?? {}
    const profileContact = normalizeContact(profile.contact || profile.email || profile.phone)
    const profilePhone = normalizeContact(profile.phone)
    const profileEmail = String(profile.email ?? '').trim().toLowerCase()

    return Boolean(
      (contactInfo.email && profileEmail === contactInfo.email) ||
      (contactInfo.email && profileContact.email === contactInfo.email) ||
      (contactInfo.phone && profilePhone.phone === contactInfo.phone) ||
      (contactInfo.phone && profileContact.phone === contactInfo.phone) ||
      (!contactInfo.email && !contactInfo.phone && profileContact.contact === contactInfo.contact),
    )
  }) ?? null
}

function profilesShareContact(left = {}, right = {}) {
  const leftContact = normalizeContact(left.contact || left.email || left.phone)
  const rightContact = normalizeContact(right.contact || right.email || right.phone)
  const leftEmail = String(left.email ?? '').trim().toLowerCase()
  const rightEmail = String(right.email ?? '').trim().toLowerCase()
  const leftPhone = normalizeContact(left.phone).phone
  const rightPhone = normalizeContact(right.phone).phone

  return Boolean(
    (leftEmail && rightEmail && leftEmail === rightEmail) ||
    (leftContact.email && rightContact.email && leftContact.email === rightContact.email) ||
    (leftPhone && rightPhone && leftPhone === rightPhone) ||
    (leftContact.phone && rightContact.phone && leftContact.phone === rightContact.phone),
  )
}

function applyDraftProfileHints(profile, hints = {}) {
  const next = { ...profile }
  if (hints.language) next.language = hints.language
  if (hints.orientation) next.orientation = hints.orientation
  if (hints.genderIdentity) next.genderIdentity = normalizeGenderIdentity(hints.genderIdentity)
  if (hints.interestedIn) next.interestedIn = normalizeInterestPreference(hints.interestedIn, hints.orientation, hints.genderIdentity)
  if (hints.photoPrivacy) next.photoPrivacy = normalizePhotoPrivacy(hints.photoPrivacy)
  if (hints.lookingFor) next.lookingFor = hints.lookingFor
  return next
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
  return photoPrivacyIds.has(value) ? value : 'public'
}

function withDatingDefaults(profile = {}) {
  const genderIdentity = normalizeGenderIdentity(profile.genderIdentity)
  const interestedIn = normalizeInterestPreference(profile.interestedIn, profile.orientation, genderIdentity)
  return {
    ...profile,
    genderIdentity,
    interestedIn,
    photoPrivacy: normalizePhotoPrivacy(profile.photoPrivacy),
  }
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

function profilesCanMatch(currentProfile = {}, candidateProfile = {}) {
  const current = withDatingDefaults(currentProfile)
  const candidate = withDatingDefaults(candidateProfile)
  if (!interestAllows(current.interestedIn, candidate.genderIdentity)) return false
  if (current.genderIdentity === 'Not shown') {
    return candidate.interestedIn === 'Everyone' || candidate.interestedIn === 'Men & women'
  }
  return interestAllows(candidate.interestedIn, current.genderIdentity)
}

function profileFromMatch(match) {
  return withDatingDefaults({
    id: `seed-${match.id}`,
    name: match.name,
    fullName: `${match.name} ${match.role.split(' ')[0]}`,
    age: match.age,
    plan: 'Member',
    role: match.role,
    city: match.city,
    email: `${match.id}@matchpulse.local`,
    phone: '',
    language: match.language ?? 'English',
    photo: match.portrait ?? match.photo,
    portrait: match.portrait ?? match.photo,
    orientation: match.orientation ?? 'Open',
    genderIdentity: match.genderIdentity,
    interestedIn: match.interestedIn,
    photoPrivacy: match.photoPrivacy,
    lookingFor: match.intent.includes('Tonight')
      ? 'Tonight'
      : match.intent.includes('Casual')
        ? 'Casual'
        : 'Serious',
    bio: match.about,
    about: match.about,
    profileCompletion: match.score,
    preferences: normalizePreferences({
      preferences: {
        values: match.shared.slice(0, 2),
        dealbreakers: ['Low effort', 'Unclear intent'],
        visualTaste: ['Natural confidence', 'Warm presence'],
        dateRhythm: ['Coffee first', 'Walkable plans'],
      },
    }),
    seedMatch: match,
    status: match.status,
    inviteCode: slugify(match.name),
    onboarded: true,
    createdAt: now(),
  })
}

function createSeedDatabase() {
  const seedUsers = matches.map((match) => ({
    id: `seed-${match.id}`,
    provider: 'seed',
    profile: profileFromMatch(match),
    inviteCode: slugify(match.name),
    onboarded: true,
    isSeed: true,
    createdAt: now(),
  }))

  return {
    users: seedUsers,
    sessions: [],
    invites: [],
    memories: Object.fromEntries(seedUsers.map((user) => [user.id, normalizeMemories(viewer.aiMemory)])),
    linkedTools: Object.fromEntries(seedUsers.map((user) => [user.id, defaultLinkedTools])),
    privacySettings: Object.fromEntries(seedUsers.map((user) => [user.id, defaultPrivacySettings])),
    attentionSignals: {},
    favorites: {},
    hidden: {},
    messages: [],
    datePlans: [],
    feedback: [],
    reports: [],
    testerFeedback: [],
    blocks: {},
    briefings: [],
    consentEvents: [],
  }
}

async function loadDb() {
  if (useSupabaseState()) {
    try {
      return await loadSupabaseState()
    } catch (error) {
      if (process.env.MATCHPULSE_DATA_PROVIDER === 'supabase') throw error
    }
  }

  try {
    const content = await readFile(dbUrl, 'utf8')
    return ensureDatabaseShape(JSON.parse(content))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    const db = createSeedDatabase()
    await saveDb(db)
    return db
  }
}

function ensureDatabaseShape(db) {
  db.feedback ??= []
  db.reports ??= []
  db.testerFeedback ??= []
  db.blocks ??= {}
  db.briefings ??= []
  db.consentEvents ??= []
  db.invites ??= []
  db.messages ??= []
  db.datePlans ??= []
  db.users ??= []
  db.sessions ??= []
  db.memories ??= {}
  Object.keys(db.memories).forEach((userId) => {
    db.memories[userId] = normalizeMemories(db.memories[userId])
  })
  db.attentionSignals ??= {}
  Object.keys(db.attentionSignals).forEach((userId) => {
    db.attentionSignals[userId] = normalizeAttentionSignals(db.attentionSignals[userId])
  })
  db.linkedTools ??= {}
  db.privacySettings ??= {}
  db.favorites ??= {}
  db.hidden ??= {}
  const currentSeedProfiles = new Map(matches.map((match) => [`seed-${match.id}`, profileFromMatch(match)]))
  db.users = db.users.map((user) => {
    if (user.isSeed && currentSeedProfiles.has(user.id)) {
      return { ...user, profile: currentSeedProfiles.get(user.id) }
    }
    return { ...user, profile: withDatingDefaults(user.profile) }
  })
  return db
}

async function saveDb(db) {
  if (useSupabaseState()) {
    try {
      await saveSupabaseState(db)
      return
    } catch (error) {
      if (process.env.MATCHPULSE_DATA_PROVIDER === 'supabase') throw error
    }
  }

  await writeFile(tempDbUrl, `${JSON.stringify(db, null, 2)}\n`)
  await rename(tempDbUrl, dbUrl)
}

function supabaseUrl() {
  return process.env.SUPABASE_URL?.replace(/\/$/, '') ?? ''
}

function useSupabaseState() {
  return (
    process.env.MATCHPULSE_DATA_PROVIDER === 'supabase' &&
    Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

function useSupabaseStorage() {
  return (
    process.env.MATCHPULSE_STORAGE_PROVIDER === 'supabase' &&
    Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error ?? `Supabase request failed: ${response.status}`)
  }

  return payload
}

async function loadSupabaseState() {
  const rows = await supabaseRequest(
    `/rest/v1/matchpulse_app_state?id=eq.${encodeURIComponent(supabaseStateId)}&select=data`,
  )
  if (rows?.[0]?.data) return ensureDatabaseShape(rows[0].data)

  const db = createSeedDatabase()
  await saveSupabaseState(db)
  return db
}

async function saveSupabaseState(db) {
  await supabaseRequest('/rest/v1/matchpulse_app_state?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: {
      id: supabaseStateId,
      data: ensureDatabaseShape(db),
      updated_at: now(),
    },
  })
}

function safeFilePath(root, requestPath) {
  const decoded = decodeURIComponent(requestPath)
  const cleanPath = normalize(`/${decoded}`).replace(/^[/\\]+/, '')
  const filePath = join(root, cleanPath)
  if (!filePath.startsWith(join(root, '/'))) return ''
  return filePath
}

async function sendFile(response, filePath, method = 'GET') {
  const file = await readFile(filePath)
  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': file.byteLength,
    'Cache-Control': filePath.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  if (method === 'HEAD') {
    response.end()
    return
  }
  response.end(file)
}

async function serveStatic(response, root, requestPath, fallbackToIndex = false, method = 'GET') {
  const cleanPath = requestPath === '/' ? '/index.html' : requestPath
  const filePath = safeFilePath(root, cleanPath)

  try {
    if (filePath && (await stat(filePath)).isFile()) {
      await sendFile(response, filePath, method)
      return true
    }
  } catch {
    // Fall through to index fallback or not found.
  }

  if (fallbackToIndex) {
    try {
      await sendFile(response, join(root, 'index.html'), method)
      return true
    } catch {
      return false
    }
  }

  return false
}

function parseImageDataUrl(dataUrl) {
  const match = String(dataUrl ?? '').match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-zA-Z0-9+/=]+)$/)
  if (!match) throw new Error('Upload must be a PNG, JPG, or WebP image')

  const mime = match[1] === 'image/jpg' ? 'image/jpeg' : match[1]
  const bytes = Buffer.from(match[2], 'base64')
  const maxBytes = 6 * 1024 * 1024
  if (bytes.length > maxBytes) throw new Error('Photo is too large. Use an image under 6 MB.')

  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  return { bytes, extension }
}

async function storeProfilePhoto(dataUrl, userId) {
  const { bytes, extension } = parseImageDataUrl(dataUrl)
  if (useSupabaseStorage()) {
    try {
      return await storeSupabasePhoto(bytes, extension, userId)
    } catch (error) {
      if (process.env.MATCHPULSE_STORAGE_PROVIDER === 'supabase') throw error
    }
  }

  await mkdir(uploadsDir, { recursive: true })
  const filename = `${slugify(userId)}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`
  await writeFile(join(uploadsDir, filename), bytes)
  return `/uploads/${filename}`
}

async function storeSupabasePhoto(bytes, extension, userId) {
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`
  const objectPath = `${slugify(userId)}/${filename}`
  const mime = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'
  const response = await fetch(
    `${supabaseUrl()}/storage/v1/object/${supabaseStorageBucket}/${objectPath}`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': mime,
        'x-upsert': 'false',
      },
      body: bytes,
    },
  )
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Supabase storage upload failed: ${response.status}`)
  }

  return `${supabaseUrl()}/storage/v1/object/public/${supabaseStorageBucket}/${objectPath}`
}

function getOrigin(request) {
  if (process.env.MATCHPULSE_PUBLIC_URL) {
    return process.env.MATCHPULSE_PUBLIC_URL.replace(/\/$/, '')
  }

  const proto = request.headers['x-forwarded-proto'] ?? 'http'
  const forwardedHost = request.headers['x-forwarded-host']
  const rawHost = forwardedHost ?? request.headers.host ?? `127.0.0.1:${PORT}`
  const shouldUseDevClientPort =
    !process.env.MATCHPULSE_SERVE_STATIC &&
    !process.env.PORT &&
    rawHost.endsWith(`:${PORT}`)
  const host = shouldUseDevClientPort
    ? rawHost.replace(`:${PORT}`, `:${process.env.MATCHPULSE_CLIENT_PORT ?? 5173}`)
    : rawHost
  return `${proto}://${host}`
}

function getSessionUser(db, sessionId) {
  const session = db.sessions.find((item) => item.id === sessionId)
  if (!session) return null
  return db.users.find((user) => user.id === session.userId) ?? null
}

function ensureUserCollections(db, userId) {
  db.memories[userId] = normalizeMemories(db.memories[userId] ?? viewer.aiMemory)
  db.linkedTools[userId] ??= defaultLinkedTools.map((tool) => ({ ...tool }))
  db.privacySettings[userId] ??= { ...defaultPrivacySettings }
  db.attentionSignals[userId] = normalizeAttentionSignals(db.attentionSignals[userId])
  db.favorites[userId] ??= []
  db.hidden[userId] ??= []
  db.blocks[userId] ??= []
}

function createDraftProfile(userNumber, provider, contact = '') {
  const contactInfo = normalizeContact(contact)
  const fallbackEmail = `alex${userNumber}@matchpulse.local`

  return withDatingDefaults({
    ...viewer,
    id: `user-${randomUUID()}`,
    name: `Alex ${userNumber}`,
    fullName: `Alex ${userNumber}`,
    email: contactInfo.email || fallbackEmail,
    phone: contactInfo.phone,
    language: viewer.language,
    contact: contactInfo.contact,
    provider,
    plan: 'Beta',
    profileCompletion: 35,
    preferences: normalizePreferences(viewer),
  })
}

function createBetaTesterProfile(db, invitedBy = '') {
  const persona = betaTesterPersonas[hashNumber(`${db.users.length}-${invitedBy}`, 0, betaTesterPersonas.length - 1)]
  const suffix = db.users.filter((user) => user.profile?.name?.startsWith(persona.name)).length + 1
  const name = suffix > 1 ? `${persona.name} ${suffix}` : persona.name

  return withDatingDefaults({
    id: `tester-${randomUUID()}`,
    name,
    fullName: name,
    age: persona.age,
    plan: 'Beta',
    role: persona.role,
    city: persona.city,
    email: `${slugify(name)}@matchpulse.test`,
    phone: '',
    language: persona.language ?? 'English',
    photo: persona.photo,
    portrait: persona.photo,
    orientation: persona.orientation,
    genderIdentity: persona.genderIdentity,
    interestedIn: persona.interestedIn,
    photoPrivacy: persona.photoPrivacy,
    lookingFor: persona.lookingFor,
    bio: persona.bio,
    about: persona.bio,
    profileCompletion: 100,
    preferences: normalizePreferences({
      preferences: {
        values: persona.values,
        dealbreakers: ['Vague intent', 'Pushy pace'],
        visualTaste: persona.visualTaste,
        dateRhythm: persona.dateRhythm,
      },
    }),
    status: 'Online now',
  })
}

function profileFromSupabaseUser(authUser, userNumber) {
  const metadata = authUser.user_metadata ?? {}
  const fallbackName = authUser.email?.split('@')[0] ?? `Alex ${userNumber}`
  const name = metadata.full_name || metadata.name || metadata.user_name || fallbackName
  return {
    ...createDraftProfile(userNumber, authUser.app_metadata?.provider ?? 'Supabase'),
    id: authUser.id,
    name,
    fullName: metadata.full_name || name,
    email: authUser.email ?? `${slugify(name)}@matchpulse.local`,
    phone: authUser.phone ?? metadata.phone ?? '',
    language: metadata.language ?? viewer.language,
    contact: authUser.email ?? authUser.phone ?? '',
    photo: metadata.avatar_url || metadata.picture || viewer.photo,
    portrait: metadata.avatar_url || metadata.picture || viewer.photo,
    provider: authUser.app_metadata?.provider ?? 'Supabase',
  }
}

async function verifySupabaseAccessToken(accessToken) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase Auth is not configured')
  }

  const response = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.msg ?? payload.message ?? 'Supabase session could not be verified')
  }

  return payload
}

function authStartPayload(db, user, session, request, meta = {}) {
  return {
    sessionId: session.id,
    profile: withDatingDefaults(user.profile),
    photos: [user.profile.photo].filter(Boolean),
    inviteLink: `${getOrigin(request)}/?invite=${user.inviteCode}`,
    onboarded: Boolean(user.onboarded),
    accountStatus: meta.isReturningUser ? 'existing' : 'new',
  }
}

function createInviteCode(db, profile) {
  const base = slugify(profile.name || profile.fullName || 'matchpulse') || 'matchpulse'
  let code = base
  let suffix = 2
  const used = new Set(db.users.map((user) => user.inviteCode).filter(Boolean))

  while (used.has(code)) {
    code = `${base}-${suffix}`
    suffix += 1
  }

  return code
}

function tokenSet(profile, extraText = '') {
  const source = [
    profile.name,
    profile.role,
    profile.city,
    profile.bio,
    profile.about,
    profile.lookingFor,
    profile.orientation,
    profile.genderIdentity,
    profile.interestedIn,
    ...(profile.preferences?.values ?? []),
    ...(profile.preferences?.visualTaste ?? []),
    ...(profile.preferences?.dateRhythm ?? []),
    extraText,
  ]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ')

  return new Set(
    source
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 4),
  )
}

function overlapScore(a, b, leftExtra = '', rightExtra = '') {
  const left = tokenSet(a, leftExtra)
  const right = tokenSet(b, rightExtra)
  let overlap = 0
  left.forEach((word) => {
    if (right.has(word)) overlap += 1
  })
  return overlap
}

function includesAnyText(text, needles) {
  const clean = String(text ?? '').toLowerCase()
  return needles.some((needle) => clean.includes(needle))
}

const attractionAxes = [
  {
    id: 'visualWarmth',
    label: 'Visual warmth',
    detail: 'soft eye contact, openness, kindness',
    keywords: ['warm', 'kind', 'soft', 'gentle', 'smile', 'eyes', 'lief', 'open'],
  },
  {
    id: 'aestheticPrecision',
    label: 'Aesthetic precision',
    detail: 'taste, styling, clean composition',
    keywords: ['design', 'architect', 'gallery', 'art', 'clean', 'sharp', 'style', 'minimal'],
  },
  {
    id: 'bodyEnergy',
    label: 'Body energy',
    detail: 'movement, posture, active presence',
    keywords: ['walk', 'bike', 'sport', 'active', 'outdoor', 'travel', 'adventure', 'nature'],
  },
  {
    id: 'cityMagnetism',
    label: 'City magnetism',
    detail: 'night energy, social confidence, pace',
    keywords: ['city', 'night', 'cocktail', 'social', 'tonight', 'bar', 'dinner', 'energy'],
  },
  {
    id: 'calmIntensity',
    label: 'Calm intensity',
    detail: 'quiet confidence, grounded attraction',
    keywords: ['calm', 'quiet', 'grounded', 'steady', 'wellness', 'slow', 'safe', 'rustig'],
  },
  {
    id: 'ambitionSignal',
    label: 'Ambition signal',
    detail: 'drive, growth, direction',
    keywords: ['ambition', 'ambitious', 'growth', 'drive', 'company', 'founder', 'momentum', 'groei'],
  },
  {
    id: 'emotionalClarity',
    label: 'Emotional clarity',
    detail: 'directness, honesty, communicative pull',
    keywords: ['conversation', 'honest', 'direct', 'communication', 'clear', 'clarity', 'eerlijk'],
  },
  {
    id: 'playfulSpark',
    label: 'Playful spark',
    detail: 'humor, spontaneity, lightness',
    keywords: ['humor', 'fun', 'playful', 'spontaneous', 'laugh', 'fast', 'vibe', 'spark'],
  },
]

function profileSignalText(profile, extraText = '') {
  return [
    profile.name,
    profile.role,
    profile.city,
    profile.bio,
    profile.about,
    profile.lookingFor,
    profile.orientation,
    ...(profile.preferences?.values ?? []),
    ...(profile.preferences?.visualTaste ?? []),
    ...(profile.preferences?.dateRhythm ?? []),
    extraText,
  ].join(' ')
}

function axisKeywordWeight(text, keywords) {
  const clean = String(text ?? '').toLowerCase()
  return keywords.reduce((total, keyword) => total + (clean.includes(keyword) ? 1 : 0), 0)
}

function buildAttractionVector(profile, memoryText = '', signals = []) {
  const text = profileSignalText(profile, memoryText)
  const normalizedSignals = normalizeAttentionSignals(signals)
  return Object.fromEntries(
    attractionAxes.map((axis) => {
      const textWeight = axisKeywordWeight(text, axis.keywords)
      const signalWeight = normalizedSignals.reduce((total, signal) => {
        const signalText = `${signal.style} ${signal.label} ${signal.body}`
        if (!includesAnyText(signalText, axis.keywords)) return total
        return total + signal.count + Math.min(3, Math.floor(signal.seconds / 12))
      }, 0)
      const baseline = 42 + hashNumber(`${profile.id ?? profile.name}-${axis.id}`, 0, 18)
      return [axis.id, clamp(baseline + textWeight * 9 + signalWeight * 7, 14, 99)]
    }),
  )
}

function vectorSimilarity(leftVector, rightVector) {
  const distance = attractionAxes.reduce((total, axis) => {
    return total + Math.abs((leftVector[axis.id] ?? 50) - (rightVector[axis.id] ?? 50))
  }, 0) / attractionAxes.length
  return clamp(Math.round(100 - distance * 0.82), 38, 99)
}

function topAttractionAxes(preferenceVector, presenceVector) {
  return attractionAxes
    .map((axis) => {
      const preference = preferenceVector[axis.id] ?? 50
      const presence = presenceVector[axis.id] ?? 50
      const closeness = clamp(100 - Math.abs(preference - presence), 0, 100)
      return {
        id: axis.id,
        label: axis.label,
        detail: axis.detail,
        strength: Math.round((preference + presence + closeness) / 3),
      }
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5)
}

function buildAttractionDna(currentUser, candidateUser, db) {
  const currentMemory = matchingMemoryText(db, currentUser.id)
  const candidateMemory = matchingMemoryText(db, candidateUser.id)
  const currentPreferenceVector = buildAttractionVector(
    currentUser.profile,
    currentMemory,
    db.attentionSignals?.[currentUser.id],
  )
  const currentPresenceVector = buildAttractionVector(currentUser.profile, currentMemory)
  const candidatePresenceVector = buildAttractionVector(candidateUser.profile, candidateMemory)
  const candidatePreferenceVector = buildAttractionVector(
    candidateUser.profile,
    candidateMemory,
    db.attentionSignals?.[candidateUser.id],
  )
  const visualAffinity = vectorSimilarity(currentPreferenceVector, candidatePresenceVector)
  const reciprocalPull = vectorSimilarity(candidatePreferenceVector, currentPresenceVector)
  const mutual = clamp(Math.round(visualAffinity * 0.58 + reciprocalPull * 0.42), 38, 99)
  const evidenceCount = normalizeAttentionSignals(db.attentionSignals?.[currentUser.id]).length
    + normalizeAttentionSignals(db.attentionSignals?.[candidateUser.id]).length

  return {
    visualAffinity,
    reciprocalPull,
    mutual,
    confidence: clamp(58 + evidenceCount * 5, 58, 96),
    axes: topAttractionAxes(currentPreferenceVector, candidatePresenceVector),
    privateModel: true,
  }
}

function attentionKeywords(signal) {
  const source = `${signal.style ?? ''} ${signal.label ?? ''} ${signal.body ?? ''}`.toLowerCase()
  if (includesAnyText(source, ['creative', 'design', 'art'])) {
    return ['design', 'architect', 'creative', 'gallery', 'art']
  }
  if (includesAnyText(source, ['active', 'natural', 'outdoor', 'nature'])) {
    return ['walk', 'outdoor', 'bike', 'travel', 'nature', 'active']
  }
  if (includesAnyText(source, ['calm', 'warm', 'steady'])) {
    return ['calm', 'quiet', 'wellness', 'steady', 'warm']
  }
  if (includesAnyText(source, ['city', 'confidence', 'night'])) {
    return ['city', 'night', 'cocktail', 'tonight', 'social']
  }
  if (includesAnyText(source, ['direct', 'clarity', 'conversation', 'honest'])) {
    return ['conversation', 'honest', 'direct', 'communication', 'clear']
  }
  return ['natural', 'chemistry', 'warm', 'intentional']
}

function attentionMatchBonus(profile, signals) {
  const profileText = [
    profile.name,
    profile.role,
    profile.city,
    profile.bio,
    profile.about,
    profile.lookingFor,
    ...(profile.preferences?.values ?? []),
    ...(profile.preferences?.visualTaste ?? []),
    ...(profile.preferences?.dateRhythm ?? []),
  ].join(' ')
  const bonus = normalizeAttentionSignals(signals).reduce((total, signal) => {
    if (!includesAnyText(profileText, attentionKeywords(signal))) return total
    return total + clamp(1 + Math.floor(signal.count / 2), 1, 3)
  }, 0)
  return clamp(bonus, 0, 6)
}

function parseDistanceKm(distance) {
  const value = Number.parseFloat(String(distance ?? '').replace(',', '.'))
  return Number.isFinite(value) ? value : 9
}

function buildDiscoveryRanking({ currentUser, profile, score, uncertainty, distance, attractionDna, overlap }) {
  const distanceKm = parseDistanceKm(distance)
  const novelty = hashNumber(`${currentUser.id}-${profile.id}-discovery`, 0, 12)
  const proximity = clamp(13 - Math.round(distanceKm * 1.7), 0, 13)
  const confidence = clamp(20 - uncertainty, 0, 14)
  const mutualPull = clamp(Math.round((attractionDna.mutual - 74) / 2), 0, 13)
  const exploration = clamp(novelty + (overlap < 5 ? 5 : 0) + (score >= 94 ? -3 : 2), 0, 14)
  const discoveryScore = clamp(
    Math.round(score * 0.76 + attractionDna.mutual * 0.16 + proximity * 0.45 + confidence * 0.35 + exploration * 0.42),
    58,
    99,
  )
  const lane =
    mutualPull >= 9
      ? 'Mutual pull'
      : proximity >= 9
        ? 'Nearby spark'
        : exploration >= 9
          ? 'Fresh angle'
          : uncertainty <= 11
            ? 'Low uncertainty'
            : 'Deep fit'
  const reason =
    lane === 'Fresh angle'
      ? 'Shown because it expands your pattern, not only because it has a high score.'
      : lane === 'Nearby spark'
        ? 'Boosted by proximity, shared signal and low friction to meet.'
        : lane === 'Mutual pull'
          ? 'Boosted because both sides look visually and energetically plausible.'
          : lane === 'Low uncertainty'
            ? 'Boosted because MatchPulse has enough signal to be more confident.'
            : 'Ranked by compatibility, attraction DNA and current private memory.'

  return {
    discoveryScore,
    lane,
    reason,
    novelty,
    proximity,
    confidence,
    mutualPull,
  }
}

function isInternalTestUser(user) {
  const name = String(user?.profile?.name ?? '')
  return (
    /^Smoke (Left|Right|Delete)\b/i.test(name) ||
    /^QA\b/i.test(name) ||
    /^Attention QA\b/i.test(name) ||
    /^(Pretest|DNA Inspect)\b/i.test(name) ||
    /\b(VisualQA|DeepQA|FixedQA|RadarQA|LastQA)\b/i.test(name) ||
    /^(Mira Atelier|Elias Depth|Lina Spark|Noor Flow|Nora QA)\s+\d{10,}$/i.test(name) ||
    /\bQA\s+\d{10,}$/i.test(name) ||
    /^Browser QA\b/i.test(name) ||
    /\bAudit\b/i.test(name)
  )
}

function softDeleteUser(db, user, sessionId = '') {
  if (!user || user.deletedAt) return false
  user.deletedAt = now()
  user.onboarded = false
  user.profile = {
    ...user.profile,
    name: 'Deleted profile',
    fullName: 'Deleted profile',
    email: `deleted-${user.id}@matchpulse.local`,
    bio: '',
    about: '',
    photo: viewer.photo,
    portrait: viewer.photo,
  }
  delete db.memories[user.id]
  delete db.attentionSignals[user.id]
  delete db.linkedTools[user.id]
  delete db.privacySettings[user.id]
  delete db.favorites[user.id]
  delete db.hidden[user.id]
  delete db.blocks[user.id]
  db.sessions = db.sessions.filter((session) =>
    sessionId ? session.id !== sessionId : session.userId !== user.id,
  )
  db.messages = db.messages.filter((message) => message.userId !== user.id && message.matchId !== user.id)
  db.datePlans = db.datePlans.filter((plan) => plan.userId !== user.id && plan.matchId !== user.id)
  db.feedback = db.feedback.filter((feedback) => feedback.userId !== user.id && feedback.matchId !== user.id)
  db.testerFeedback = (db.testerFeedback ?? []).filter((feedback) => feedback.userId !== user.id)
  db.reports = db.reports.filter((report) => report.userId !== user.id && report.matchId !== user.id)
  db.invites = db.invites.filter((invite) => invite.inviterId !== user.id && invite.acceptedBy !== user.id)
  db.consentEvents.push({
    id: randomUUID(),
    userId: user.id,
    type: 'account_deleted',
    scope: ['profile', 'memory', 'messages', 'attention'],
    provider: 'matchpulse',
    createdAt: now(),
  })
  return true
}

function cleanupInternalTestUsers(db, currentUserId) {
  const deletedNames = []
  db.users.forEach((user) => {
    if (user.id === currentUserId || user.deletedAt || !isInternalTestUser(user)) return
    deletedNames.push(user.profile.name)
    softDeleteUser(db, user)
  })
  return deletedNames
}

function attentionSignalFromMessage(db, matchId, text) {
  const matchUser = db.users.find((candidate) => candidate.id === matchId)
  const signalText = `${text} ${matchUser?.profile?.role ?? ''} ${matchUser?.profile?.bio ?? ''}`.toLowerCase()
  let style = 'thoughtful conversation'
  if (includesAnyText(signalText, ['design', 'art', 'creative', 'architect'])) style = 'clean creative style'
  if (includesAnyText(signalText, ['calm', 'rustig', 'warm', 'zacht'])) style = 'calm warm presence'
  if (includesAnyText(signalText, ['coffee', 'koffie', 'walk', 'wandeling', 'nature'])) style = 'low-pressure date rhythm'
  if (includesAnyText(signalText, ['direct', 'clear', 'duidelijk', 'communication'])) style = 'direct emotional clarity'

  return {
    id: `attention-message-${slugify(style)}`,
    kind: 'attention',
    matchId,
    matchName: matchUser?.profile?.name ?? 'Someone',
    style,
    label: `Chat rhythm: ${style}`,
    body: 'Specific message energy suggests a private preference for matches who invite thoughtful replies.',
    count: 1,
    seconds: Math.min(120, Math.max(12, Math.round(String(text).length / 3))),
    visibility: 'Private algorithm only',
    updatedAt: now(),
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function buildMatch(currentUser, candidateUser, db) {
  const userProfile = withDatingDefaults(currentUser.profile)
  const profile = withDatingDefaults(candidateUser.profile)
  const seed = profile.seedMatch
  const overlap = overlapScore(
    userProfile,
    profile,
    matchingMemoryText(db, currentUser.id),
    matchingMemoryText(db, candidateUser.id),
  )
  const intentBonus =
    userProfile.lookingFor === profile.lookingFor ||
    seed?.intent?.includes(userProfile.lookingFor)
      ? 9
      : 2
  const cityBonus = userProfile.city === profile.city ? 5 : 1
  const languageBonus = userProfile.language && profile.language && userProfile.language === profile.language ? 4 : 0
  const privacySettings = { ...defaultPrivacySettings, ...(db.privacySettings?.[currentUser.id] ?? {}) }
  const attentionBonus = privacySettings.attentionLearning
    ? attentionMatchBonus(profile, db.attentionSignals?.[currentUser.id])
    : 0
  const attractionDna = buildAttractionDna(currentUser, candidateUser, db)
  const mutualAttractionBonus = clamp(Math.round((attractionDna.mutual - 76) / 4), 0, 6)
  const baseScore = seed?.score ?? 72
  const score = clamp(
    Math.round(
      baseScore + overlap * 2.4 + intentBonus + cityBonus + languageBonus + attentionBonus + mutualAttractionBonus - 4,
    ),
    58,
    98,
  )
  const uncertainty = clamp(28 - overlap * 2 - intentBonus - attentionBonus - mutualAttractionBonus, 6, 31)
  const distanceKm = seed?.distance ?? `${(hashNumber(profile.id, 8, 62) / 10).toFixed(1)} km away`
  const ranking = buildDiscoveryRanking({
    currentUser,
    profile,
    score,
    uncertainty,
    distance: distanceKm,
    attractionDna,
    overlap,
  })

  return {
    id: candidateUser.id,
    name: profile.name,
    age: Number(profile.age) || 28,
    role: profile.role || `${profile.city} member`,
    city: profile.city || 'Nearby',
    distance: distanceKm,
    status: profile.status || 'Online now',
    intent: seed?.intent ?? [profile.lookingFor, 'Values aligned'],
    score,
    discoveryScore: ranking.discoveryScore,
    ranking,
    photo: profile.photo,
    portrait: profile.portrait ?? profile.photo,
    genderIdentity: profile.genderIdentity,
    interestedIn: profile.interestedIn,
    photoPrivacy: profile.photoPrivacy,
    attractionDna,
    about: profile.bio || profile.about || 'Still teaching MatchPulse their profile.',
    shared: seed?.shared ?? [
      `You both show signals around ${profile.lookingFor.toLowerCase()} intent.`,
      profile.language && userProfile.language === profile.language
        ? `You can both communicate in ${profile.language}.`
        : 'Your profile language still needs a bit more signal.',
      uncertainty < 16
        ? 'The AI sees enough shared signal for a confident introduction.'
        : 'There is promise here, but MatchPulse needs more feedback.',
    ],
    metrics: seed?.metrics ?? {
      Values: clamp(score + 2, 55, 98),
      Attraction: clamp(
        Math.round((score - 3 + hashNumber(profile.id, 0, 7) + attentionBonus + attractionDna.mutual) / 2),
        55,
        96,
      ),
      Lifestyle: clamp(score - 5 + cityBonus + Math.floor(attentionBonus / 2), 52, 95),
      Intent: clamp(score - 2 + intentBonus, 52, 97),
      Uncertainty: uncertainty,
    },
    map: seed?.map ?? {
      x: hashNumber(profile.id, 18, 82),
      y: hashNumber(`${profile.id}-map`, 20, 78),
    },
  }
}

function providerStatus(request) {
  const publicUrl = process.env.MATCHPULSE_PUBLIC_URL || getOrigin(request)
  const hasSupabaseProject = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  const hasSupabaseService = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  const hasSupabaseState = useSupabaseState()
  const hasSupabasePhotoStorage = useSupabaseStorage()
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY)
  const hasEmail = Boolean(process.env.RESEND_API_KEY && process.env.MATCHPULSE_FROM_EMAIL)
  const paidServices = [
    hasOpenAi ? 'OpenAI API' : '',
  ].filter(Boolean)
  const zeroCostReady = !paidServices.length

  return {
    publicUrl,
    costMode: zeroCostReady ? 'zero-cost' : 'external-paid-api',
    paidServices,
    database: hasSupabaseState ? 'supabase-state' : 'local-json',
    auth: hasSupabaseProject ? 'supabase-oauth-ready' : 'local-simulated',
    ai: hasOpenAi ? `openai:${openAiModel}` : 'local-heuristic',
    email: hasEmail ? 'resend-ready' : 'local-preview',
    storage: hasSupabasePhotoStorage ? 'supabase-storage' : 'local-file-uploads',
    costChecklist: [
      {
        id: 'noPaidAi',
        label: 'No paid AI calls',
        ready: !hasOpenAi,
        detail: hasOpenAi ? 'OpenAI key detected; remove it for strict zero-cost mode' : 'Local heuristic AI is active',
      },
      {
        id: 'noRequiredEmailProvider',
        label: 'No paid email required',
        ready: true,
        detail: hasEmail ? 'Resend can run on its free tier for small tests' : 'Briefings are saved as local previews',
      },
      {
        id: 'freeDatabasePath',
        label: 'Free persistence path',
        ready: hasSupabaseState || !process.env.MATCHPULSE_PUBLIC_URL,
        detail: hasSupabaseState
          ? 'Supabase Free can persist beta state'
          : 'Local JSON is free, but only reliable on your machine',
      },
      {
        id: 'freeStoragePath',
        label: 'Free photo storage path',
        ready: hasSupabasePhotoStorage || !process.env.MATCHPULSE_PUBLIC_URL,
        detail: hasSupabasePhotoStorage
          ? 'Supabase Free Storage can persist profile photos'
          : 'Local uploads are free, but not durable on free deploy hosts',
      },
    ],
    checklist: [
      {
        id: 'auth',
        label: 'Real login',
        ready: hasSupabaseProject,
        detail: hasSupabaseProject ? 'Supabase Auth public env detected' : 'Using simulated Google/Apple/email sessions',
      },
      {
        id: 'database',
        label: 'Hosted database',
        ready: hasSupabaseState,
        detail: hasSupabaseState
          ? `Supabase state table enabled: ${supabaseStateId}`
          : 'Using server/matchpulse-db.json locally',
      },
      {
        id: 'storage',
        label: 'Hosted photo storage',
        ready: hasSupabasePhotoStorage,
        detail: hasSupabasePhotoStorage
          ? `Supabase Storage bucket: ${supabaseStorageBucket}`
          : 'Using local server/uploads files',
      },
      {
        id: 'ai',
        label: 'AI memory engine',
        ready: true,
        detail: hasOpenAi
          ? `OpenAI Responses API via ${openAiModel}`
          : 'Using deterministic local insight model with no API cost',
      },
      {
        id: 'email',
        label: 'Sunday briefing email',
        ready: true,
        detail: hasEmail ? 'Resend env detected' : 'Preview is saved locally, no email provider required',
      },
      {
        id: 'publicInvite',
        label: 'Public invite URL',
        ready: Boolean(process.env.MATCHPULSE_PUBLIC_URL),
        detail: process.env.MATCHPULSE_PUBLIC_URL ? publicUrl : 'Localhost/LAN links only',
      },
      {
        id: 'serviceRole',
        label: 'Backend Supabase service',
        ready: hasSupabaseService,
        detail: hasSupabaseService ? 'Service role key detected server-side' : 'Service role key missing',
      },
    ],
  }
}

function summarizeLocalInsight(text, user) {
  const clean = String(text ?? '').trim()
  const lower = clean.toLowerCase()
  const signals = [
    ['honesty', ['honest', 'eerlijk', 'clear', 'duidelijk', 'communicatie']],
    ['calm chemistry', ['calm', 'rustig', 'zacht', 'veilig', 'slow']],
    ['ambition', ['ambition', 'ambitie', 'growth', 'groei', 'drive']],
    ['warm attraction', ['warm', 'kind', 'lief', 'attract', 'mooi']],
    ['intentional plans', ['plan', 'date', 'avond', 'dinner', 'coffee']],
  ]
    .filter(([, needles]) => needles.some((needle) => lower.includes(needle)))
    .map(([label]) => label)

  const values = signals.length ? signals.slice(0, 3) : user.profile.preferences.values.slice(0, 3)
  const summary = clean
    ? `I read this as a signal around ${values.join(', ')}. It should make matches with clear intent and warm consistency rank higher.`
    : 'Give me a real sentence and I will turn it into profile signals.'

  return {
    provider: 'local-heuristic',
    summary,
    values,
    boundaries: lower.includes('no ') || lower.includes('niet') ? ['respect explicit boundaries'] : ['keep uncertainty visible'],
    matchWeight: signals.length ? 'medium-high' : 'medium',
  }
}

async function buildAiInsight(text, user) {
  if (!process.env.OPENAI_API_KEY) return summarizeLocalInsight(text, user)

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openAiModel,
      input: [
        {
          role: 'developer',
          content:
            'You are MatchPulse, a consent-first dating profile analyst. Return concise JSON with summary, values, boundaries, matchWeight. Avoid medical/legal claims.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            profile: {
              lookingFor: user.profile.lookingFor,
              orientation: user.profile.orientation,
              preferences: user.profile.preferences,
            },
            newSignal: text,
          }),
        },
      ],
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'OpenAI insight failed')
  }

  const outputText =
    payload.output_text ??
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((part) => part.text ?? '')
      .join('\n') ??
    ''

  try {
    return { provider: `openai:${openAiModel}`, ...JSON.parse(outputText) }
  } catch {
    return {
      provider: `openai:${openAiModel}`,
      summary: outputText || 'AI profile signal saved.',
      values: [],
      boundaries: [],
      matchWeight: 'medium',
    }
  }
}

function buildBriefing(db, user, request) {
  const state = buildAppState(db, user, request)
  const topMatches = state.matches.slice(0, 3)
  return {
    id: randomUUID(),
    userId: user.id,
    to: user.profile.email,
    subject: 'Your Sunday MatchPulse briefing',
    mode: providerStatus(request).email,
    topMatches: topMatches.map((match) => ({
      id: match.id,
      name: match.name,
      score: match.score,
      reason: match.shared[0],
    })),
    body: `We found ${state.matches.length} active matches. Top signal: ${topMatches[0]?.name ?? 'keep teaching your profile'}.`,
    createdAt: now(),
  }
}

function briefingHtml(briefing) {
  const rows = briefing.topMatches
    .map(
      (match) => `
        <li style="margin: 0 0 16px;">
          <strong>${escapeHtml(match.name)} · ${match.score}%</strong><br />
          <span>${escapeHtml(match.reason)}</span>
        </li>
      `,
    )
    .join('')

  return `
    <div style="font-family: Inter, Arial, sans-serif; color: #202127; line-height: 1.55;">
      <h1 style="font-size: 28px; margin: 0 0 12px;">Your MatchPulse briefing</h1>
      <p style="margin: 0 0 24px;">${escapeHtml(briefing.body)}</p>
      <ul style="padding-left: 20px; margin: 0;">${rows}</ul>
      <p style="margin-top: 28px; color: #747884;">You can edit AI memory, privacy, and briefing settings inside MatchPulse.</p>
    </div>
  `
}

async function deliverBriefing(briefing) {
  if (!process.env.RESEND_API_KEY || !process.env.MATCHPULSE_FROM_EMAIL) {
    return { delivered: false, mode: 'local-preview' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MATCHPULSE_FROM_EMAIL,
      to: [briefing.to],
      subject: briefing.subject,
      html: briefingHtml(briefing),
    }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? 'Resend delivery failed')
  }

  return { delivered: true, mode: 'resend', providerId: payload.id }
}

function userMessages(db, userId) {
  return db.messages
    .filter((message) => message.userId === userId || message.matchId === userId)
    .map((message) => {
      const outgoing = message.userId === userId
      return {
        ...message,
        status: normalizeMessageStatus(message),
        matchId: outgoing ? message.matchId : message.userId,
        from: outgoing ? (message.from ?? 'you') : 'them',
        requestDirection: outgoing ? 'outgoing' : 'incoming',
      }
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function displayNameForUser(db, userId) {
  return db.users.find((user) => user.id === userId)?.profile?.name ?? 'Unknown profile'
}

function normalizeMessageStatus(message = {}) {
  return message.status === 'request' ? 'request' : 'accepted'
}

function messagesBelongToPair(message = {}, leftUserId = '', rightUserId = '') {
  return (
    (message.userId === leftUserId && message.matchId === rightUserId) ||
    (message.userId === rightUserId && message.matchId === leftUserId)
  )
}

function messageThreadAccepted(db, userId, matchId) {
  return db.messages.some(
    (message) => messagesBelongToPair(message, userId, matchId) && normalizeMessageStatus(message) === 'accepted',
  )
}

function isPremiumProfile(profile = {}) {
  return /premium|pro/i.test(String(profile.plan ?? ''))
}

function dailyRequestLimit(profile = {}) {
  return isPremiumProfile(profile) ? 25 : 5
}

function isSameUtcDay(left, right) {
  if (!left || !right) return false
  const leftDate = new Date(left)
  const rightDate = new Date(right)
  return (
    leftDate.getUTCFullYear() === rightDate.getUTCFullYear() &&
    leftDate.getUTCMonth() === rightDate.getUTCMonth() &&
    leftDate.getUTCDate() === rightDate.getUTCDate()
  )
}

function dailyRequestCount(db, userId) {
  const today = now()
  return db.messages.filter(
    (message) =>
      message.userId === userId &&
      normalizeMessageStatus(message) === 'request' &&
      isSameUtcDay(message.createdAt, today),
  ).length
}

function isAutoAcceptingDemoUser(user = {}) {
  const id = String(user.id ?? user.profile?.id ?? '')
  return Boolean(
    user.isSeed ||
    user.provider === 'seed' ||
    id.startsWith('seed-') ||
    id.startsWith('tester-') ||
    String(user.profile?.email ?? '').endsWith('@matchpulse.test'),
  )
}

function demoAutoReply(matchUser = {}, requesterProfile = {}, incomingText = '') {
  const profile = matchUser.profile ?? {}
  const name = requesterProfile.name ?? 'you'
  const sharedSignal = profile.preferences?.values?.[0] ?? profile.lookingFor ?? 'that shared signal'
  const text = String(incomingText).toLowerCase()

  if (text.includes('[photo request]')) {
    return `Yes ${name}, that feels respectful. I would share more after a little chat first.`
  }

  const cleanSignal = String(sharedSignal)
    .replace(/[.!?]+$/g, '')
    .replace(/^you both\s+/i, '')
    .replace(/^both\s+/i, '')
    .replace(/^value\s+/i, '')
    .toLowerCase()
  return `I like that opener, ${name}. That shared signal (${cleanSignal}) feels worth exploring. Coffee sounds easy.`
}

function buildBetaOverview(db, request) {
  const activeUsers = db.users.filter((user) => !user.deletedAt)
  const onboardedUsers = activeUsers.filter((user) => user.onboarded)
  const testAccounts = activeUsers.filter((user) => isInternalTestUser(user))
  const latestReports = [...db.reports]
    .slice(-8)
    .reverse()
    .map((report) => ({
      id: report.id,
      reporter: displayNameForUser(db, report.userId),
      reported: displayNameForUser(db, report.matchId),
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
    }))
  const latestFeedback = [...db.feedback]
    .slice(-8)
    .reverse()
    .map((feedback) => ({
      id: feedback.id,
      user: displayNameForUser(db, feedback.userId),
      match: displayNameForUser(db, feedback.matchId),
      type: feedback.type,
      createdAt: feedback.createdAt,
    }))
  const latestTesterFeedback = [...db.testerFeedback]
    .slice(-8)
    .reverse()
    .map((feedback) => ({
      id: feedback.id,
      user: displayNameForUser(db, feedback.userId),
      surface: feedback.surface,
      rating: feedback.rating,
      issueType: feedback.issueType,
      body: feedback.body,
      createdAt: feedback.createdAt,
    }))

  return {
    totals: {
      activeUsers: activeUsers.length,
      onboardedUsers: onboardedUsers.length,
      invitesAccepted: db.invites.length,
      feedback: db.feedback.length,
      testerFeedback: db.testerFeedback.length,
      reports: db.reports.length,
      blocks: Object.values(db.blocks).reduce((total, list) => total + list.length, 0),
      briefings: db.briefings.length,
      testAccounts: testAccounts.length,
    },
    latestReports,
    latestFeedback,
    latestTesterFeedback,
    latestBriefings: [...db.briefings]
      .slice(-5)
      .reverse()
      .map((briefing) => ({
        id: briefing.id,
        to: briefing.to,
        mode: briefing.mode,
        delivered: Boolean(briefing.delivered),
        topMatch: briefing.topMatches?.[0]?.name ?? 'No match yet',
        createdAt: briefing.createdAt,
      })),
    providerStatus: providerStatus(request),
  }
}

function buildAppState(db, user, request) {
  ensureUserCollections(db, user.id)
  const blocked = db.blocks[user.id] ?? []
  const hidden = [...new Set([...(db.hidden[user.id] ?? []), ...blocked])]
  const visibleCandidates = db.users.filter(
    (candidate) =>
      candidate.id !== user.id &&
      candidate.onboarded &&
      !candidate.deletedAt &&
      !isInternalTestUser(candidate) &&
      !profilesShareContact(user.profile, candidate.profile) &&
      !hidden.includes(candidate.id) &&
      profilesCanMatch(user.profile, candidate.profile),
  )
  const matchList = visibleCandidates
    .map((candidate) => buildMatch(user, candidate, db))
    .sort((a, b) => (b.discoveryScore ?? b.score) - (a.discoveryScore ?? a.score))

  return {
    sessionId: db.sessions.find((session) => session.userId === user.id)?.id ?? '',
    profile: withDatingDefaults(user.profile),
    onboarded: Boolean(user.onboarded),
    inviteCode: user.inviteCode,
    inviteLink: `${getOrigin(request)}/?invite=${user.inviteCode || createInviteCode(db, user.profile)}`,
    matches: matchList,
    memoryNotes: normalizeMemories(db.memories[user.id]),
    attentionSignals: normalizeAttentionSignals(db.attentionSignals[user.id]),
    linkedTools: db.linkedTools[user.id] ?? defaultLinkedTools,
    privacySettings: { ...defaultPrivacySettings, ...(db.privacySettings[user.id] ?? {}) },
    favorites: db.favorites[user.id] ?? [],
    hiddenMatches: hidden,
    plannedDates: db.datePlans.filter((plan) => plan.userId === user.id),
    messages: userMessages(db, user.id),
    feedback: db.feedback.filter((item) => item.userId === user.id),
    testerFeedback: db.testerFeedback.filter((item) => item.userId === user.id),
    reports: db.reports.filter((item) => item.userId === user.id),
    briefings: db.briefings.filter((item) => item.userId === user.id).slice(-5).reverse(),
    providerStatus: providerStatus(request),
    betaOverview: buildBetaOverview(db, request),
  }
}

async function readJson(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function send(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  })
  response.end(JSON.stringify(payload))
}

function notFound(response) {
  send(response, 404, { error: 'Not found' })
}

function requireSession(db, body, requestUrl) {
  const sessionId = body.sessionId ?? requestUrl.searchParams.get('sessionId')
  const user = getSessionUser(db, sessionId)
  return { sessionId, user }
}

function shouldSerializeMutation(request, requestUrl) {
  return (
    requestUrl.pathname.startsWith('/api/') &&
    !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
  )
}

async function routeCore(request, response) {
  if (request.method === 'OPTIONS') {
    send(response, 204, {})
    return
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`)

  try {
    const staticMethod = request.method === 'GET' || request.method === 'HEAD'

    if (staticMethod && requestUrl.pathname.startsWith('/uploads/')) {
      const served = await serveStatic(
        response,
        uploadsDir,
        requestUrl.pathname.replace('/uploads', ''),
        false,
        request.method,
      )
      if (!served) notFound(response)
      return
    }

    if (staticMethod && !requestUrl.pathname.startsWith('/api/')) {
      const served = await serveStatic(response, distDir, requestUrl.pathname, true, request.method)
      if (!served) notFound(response)
      return
    }

    const db = await loadDb()

    if (request.method === 'GET' && requestUrl.pathname === '/api/health') {
      send(response, 200, {
        ok: true,
        users: db.users.filter((user) => !user.deletedAt).length,
        onboarded: db.users.filter((user) => user.onboarded && !user.deletedAt).length,
        providerStatus: providerStatus(request),
      })
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/auth/start') {
      const body = await readJson(request)
      const contact = body.contact ?? body.email ?? body.phone ?? ''
      const authMode = body.mode === 'login' ? 'login' : 'signup'
      let user = findUserByContact(db, contact)
      const isReturningUser = Boolean(user)

      if (!user && authMode === 'login') {
        const isDutch = body.profile?.language === 'Nederlands'
        send(response, 404, {
          error: isDutch
            ? 'Geen MatchPulse profiel gevonden voor deze e-mail of gsm. Kies Sign up om er een te maken.'
            : 'No MatchPulse profile found for this email or mobile. Choose Sign up to create one.',
          code: 'account_not_found',
        })
        return
      }

      if (!user) {
        const profile = applyDraftProfileHints(
          createDraftProfile(
            db.users.length + 1,
            body.provider ?? 'Email',
            contact,
          ),
          body.profile,
        )
        user = {
          id: profile.id,
          provider: body.provider ?? 'Email',
          profile,
          inviteCode: createInviteCode(db, profile),
          invitedBy: body.inviteCode || '',
          onboarded: false,
          createdAt: now(),
        }
        db.users.push(user)
        ensureUserCollections(db, user.id)
      } else {
        user.provider = body.provider ?? user.provider ?? 'Email'
        user.profile = {
          ...user.profile,
          provider: user.provider,
          contact: contact || user.profile.contact,
        }
      }
      const session = { id: randomUUID(), userId: user.id, createdAt: now() }

      db.sessions.push(session)
      ensureUserCollections(db, user.id)
      db.consentEvents.push({
        id: randomUUID(),
        userId: user.id,
        type: isReturningUser ? 'auth_returned' : 'auth_started',
        provider: user.provider,
        createdAt: now(),
      })

      if (!isReturningUser && body.inviteCode) {
        db.invites.push({
          id: randomUUID(),
          code: body.inviteCode,
          acceptedBy: user.id,
          createdAt: now(),
        })
      }

      await saveDb(db)
      send(response, 200, authStartPayload(db, user, session, request, { isReturningUser }))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/auth/supabase') {
      const body = await readJson(request)
      const authUser = await verifySupabaseAccessToken(body.accessToken)
      let user = db.users.find((candidate) => candidate.authUserId === authUser.id || candidate.id === authUser.id)
      const isNewUser = !user

      if (!user) {
        const profile = profileFromSupabaseUser(authUser, db.users.length + 1)
        user = {
          id: authUser.id,
          authUserId: authUser.id,
          provider: authUser.app_metadata?.provider ?? 'Supabase',
          profile,
          inviteCode: createInviteCode(db, profile),
          invitedBy: body.inviteCode || '',
          onboarded: false,
          createdAt: now(),
        }
        db.users.push(user)
        ensureUserCollections(db, user.id)
      } else {
        user.authUserId = authUser.id
        user.provider = authUser.app_metadata?.provider ?? user.provider ?? 'Supabase'
        user.profile = {
          ...user.profile,
          email: authUser.email ?? user.profile.email,
          provider: user.provider,
        }
      }

      const session = { id: randomUUID(), userId: user.id, createdAt: now() }
      db.sessions.push(session)
      ensureUserCollections(db, user.id)
      db.consentEvents.push({
        id: randomUUID(),
        userId: user.id,
        type: isNewUser ? 'supabase_auth_started' : 'supabase_auth_returned',
        provider: user.provider,
        createdAt: now(),
      })

      if (isNewUser && body.inviteCode) {
        db.invites.push({
          id: randomUUID(),
          code: body.inviteCode,
          acceptedBy: user.id,
          createdAt: now(),
        })
      }

      await saveDb(db)
      send(response, 200, authStartPayload(db, user, session, request, { isReturningUser: !isNewUser }))
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/app-state') {
      const { user } = requireSession(db, {}, requestUrl)
      if (!user) {
        send(response, 401, { error: 'Session expired' })
        return
      }
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/beta/overview') {
      const { user } = requireSession(db, {}, requestUrl)
      if (!user) {
        send(response, 401, { error: 'Session expired' })
        return
      }
      send(response, 200, buildBetaOverview(db, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/beta/tester') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })

      const profile = createBetaTesterProfile(db, user.inviteCode)
      const tester = {
        id: profile.id,
        provider: 'beta-tester',
        profile,
        inviteCode: createInviteCode(db, profile),
        invitedBy: user.inviteCode,
        onboarded: true,
        createdAt: now(),
      }
      const testerSession = {
        id: randomUUID(),
        userId: tester.id,
        provider: 'beta-tester',
        createdAt: now(),
      }

      db.users.push(tester)
      db.sessions.push(testerSession)
      ensureUserCollections(db, tester.id)
      db.memories[tester.id] = [
        createMemoryNote(`Beta tester profile: ${profile.bio}`, 'profile', 'beta-profile'),
        ...profile.preferences.values.map((value) =>
          createMemoryNote(`Values ${value.toLowerCase()} in relationships.`, 'shareable', 'beta-profile'),
        ),
      ].slice(0, 8)
      db.invites.push({
        id: randomUUID(),
        code: user.inviteCode,
        inviterId: user.id,
        acceptedBy: tester.id,
        createdAt: now(),
      })
      db.consentEvents.push({
        id: randomUUID(),
        userId: tester.id,
        type: 'beta_tester_created',
        scope: ['profile', 'matching_memory'],
        provider: 'local-beta-lab',
        createdAt: now(),
      })

      await saveDb(db)
      send(response, 200, {
        tester: tester.profile,
        testerSessionId: testerSession.id,
        state: buildAppState(db, user, request),
      })
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/beta/cleanup') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const deletedNames = cleanupInternalTestUsers(db, user.id)
      await saveDb(db)
      send(response, 200, {
        cleaned: deletedNames.length,
        deletedNames,
        state: buildAppState(db, user, request),
      })
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/uploads/photo') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })

      const photoUrl = await storeProfilePhoto(body.dataUrl, user.id)
      user.profile = {
        ...user.profile,
        photo: photoUrl,
        portrait: photoUrl,
      }
      db.consentEvents.push({
        id: randomUUID(),
        userId: user.id,
        type: 'photo_uploaded',
        scope: ['profile_photo'],
        createdAt: now(),
      })
      await saveDb(db)
      send(response, 200, { photoUrl, state: buildAppState(db, user, request) })
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/onboarding/complete') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) {
        send(response, 401, { error: 'Session expired' })
        return
      }
      const cleanAge = Number.parseInt(body.profile?.age, 10)
      if (!Number.isNaN(cleanAge) && cleanAge < 18) {
        send(response, 400, { error: 'MatchPulse beta is 18+ only' })
        return
      }

      const completedBio = String(body.profile?.bio ?? user.profile.bio ?? '')
      const completedPhotos = Array.isArray(body.photos) ? body.photos.filter(Boolean).length : 0
      const completionScore = clamp(
        64 +
          (completedBio.length > 80 ? 8 : 0) +
          (completedBio.length > 180 ? 8 : 0) +
          (completedPhotos ? 6 : 0) +
          (body.profile?.genderIdentity && body.profile.genderIdentity !== 'Not shown' ? 4 : 0) +
          (body.profile?.interestedIn ? 4 : 0),
        62,
        92,
      )

      user.profile = withDatingDefaults({
        ...user.profile,
        ...body.profile,
        age: cleanAge || user.profile.age,
        photo: body.profile?.photo || body.photos?.[0] || user.profile.photo,
        portrait: body.profile?.photo || body.photos?.[0] || user.profile.photo,
        preferences: normalizePreferences({ ...user.profile, ...body.profile }),
        profileCompletion: completionScore,
      })
      user.inviteCode = createInviteCode(
        { ...db, users: db.users.filter((candidate) => candidate.id !== user.id) },
        user.profile,
      )
      user.onboarded = true
      db.consentEvents.push({
        id: randomUUID(),
        userId: user.id,
        type: 'profile_created',
        scope: ['profile', 'photos', 'matching_memory'],
        createdAt: now(),
      })
      prependMemory(
        db,
        user.id,
        `Profile created through ${user.provider}: ${String(user.profile.bio ?? '').slice(0, 96)}`,
        { visibility: 'match_ai', source: 'onboarding' },
      )

      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/ai/profile-insight') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const text = String(body.text ?? '').trim()
      const insight = await buildAiInsight(text, user)
      send(response, 200, { insight, providerStatus: providerStatus(request) })
      return
    }

    if (request.method === 'PATCH' && requestUrl.pathname === '/api/profile') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) {
        send(response, 401, { error: 'Session expired' })
        return
      }
      user.profile = withDatingDefaults({
        ...user.profile,
        ...body.profile,
        age: Number.parseInt(body.profile?.age, 10) || user.profile.age,
        preferences: normalizePreferences({ ...user.profile, ...body.profile }),
      })
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/memory') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const text = String(body.text ?? '').trim()
      if (text) {
        const memory = prependMemory(db, user.id, text, {
          visibility: normalizeMemoryVisibility(body.visibility),
          source: 'ai-profile-tool',
        })
        db.consentEvents.push({
          id: randomUUID(),
          userId: user.id,
          type: 'memory_created',
          memoryId: memory.id,
          visibility: memory.visibility,
          createdAt: now(),
        })
      }
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'PATCH' && requestUrl.pathname === '/api/memory') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })

      const visibility = normalizeMemoryVisibility(body.visibility)
      let changedMemory = null
      db.memories[user.id] = normalizeMemories(db.memories[user.id]).map((memory) => {
        if (!memoryMatchesRequest(memory, body)) return memory
        changedMemory = { ...memory, visibility, updatedAt: now() }
        return changedMemory
      })

      if (!changedMemory) {
        send(response, 404, { error: 'Memory not found' })
        return
      }

      db.consentEvents.push({
        id: randomUUID(),
        userId: user.id,
        type: 'memory_visibility_updated',
        memoryId: changedMemory.id,
        visibility,
        createdAt: now(),
      })

      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'DELETE' && requestUrl.pathname === '/api/memory') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const currentMemories = normalizeMemories(db.memories[user.id])
      const deleted = currentMemories.find((memory) => memoryMatchesRequest(memory, body))
      db.memories[user.id] = currentMemories.filter((memory) => !memoryMatchesRequest(memory, body))
      if (deleted) {
        db.consentEvents.push({
          id: randomUUID(),
          userId: user.id,
          type: 'memory_deleted',
          memoryId: deleted.id,
          visibility: deleted.visibility,
          createdAt: now(),
        })
      }
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/tools/toggle') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      db.linkedTools[user.id] = (db.linkedTools[user.id] ?? defaultLinkedTools).map((tool) =>
        tool.id === body.toolId ? { ...tool, connected: !tool.connected } : tool,
      )
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/privacy/toggle') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const currentSettings = { ...defaultPrivacySettings, ...(db.privacySettings[user.id] ?? {}) }
      db.privacySettings[user.id] = {
        ...currentSettings,
        [body.settingId]: !currentSettings[body.settingId],
      }
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/attention') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const currentSettings = { ...defaultPrivacySettings, ...(db.privacySettings[user.id] ?? {}) }
      if (!currentSettings.attentionLearning) {
        send(response, 200, buildAppState(db, user, request))
        return
      }
      const signal = normalizeAttentionSignal(body.signal)
      if (!signal) return send(response, 400, { error: 'Attention signal is empty' })
      db.attentionSignals[user.id] = mergeAttentionSignalList(db.attentionSignals[user.id], signal)
      db.consentEvents.push({
        id: randomUUID(),
        userId: user.id,
        type: 'attention_signal_updated',
        signalId: signal.id,
        scope: ['private_attention_learning'],
        visibility: 'private_algorithm_only',
        createdAt: now(),
      })
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'DELETE' && requestUrl.pathname === '/api/attention') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const currentSignals = normalizeAttentionSignals(db.attentionSignals[user.id])
      if (body.clear) {
        db.attentionSignals[user.id] = []
      } else {
        db.attentionSignals[user.id] = currentSignals.filter((signal) => signal.id !== body.signalId)
      }
      db.consentEvents.push({
        id: randomUUID(),
        userId: user.id,
        type: body.clear ? 'attention_signals_cleared' : 'attention_signal_deleted',
        signalId: body.clear ? '' : String(body.signalId ?? ''),
        scope: ['private_attention_learning'],
        visibility: 'private_algorithm_only',
        createdAt: now(),
      })
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/favorites/toggle') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const favorites = db.favorites[user.id] ?? []
      db.favorites[user.id] = favorites.includes(body.matchId)
        ? favorites.filter((id) => id !== body.matchId)
        : [...favorites, body.matchId]
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/hidden/hide') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      db.hidden[user.id] = [...new Set([...(db.hidden[user.id] ?? []), body.matchId])]
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/hidden/reset') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      db.hidden[user.id] = []
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/messages/send') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const text = String(body.text ?? '').trim()
      const matchId = String(body.matchId ?? '').trim()
      if (text && matchId) {
        const matchUser = db.users.find((candidate) => candidate.id === matchId)
        const autoAcceptDemo = isAutoAcceptingDemoUser(matchUser)
        const status = messageThreadAccepted(db, user.id, matchId) || autoAcceptDemo ? 'accepted' : 'request'
        if (status === 'request') {
          const limit = dailyRequestLimit(user.profile)
          const used = dailyRequestCount(db, user.id)
          if (used >= limit) {
            return send(response, 429, {
              error: `Daily message request limit reached. Premium unlocks ${dailyRequestLimit({ plan: 'Premium' })} requests per day.`,
              limit,
              used,
            })
          }
        }
        const createdAt = now()
        db.messages.push({
          id: randomUUID(),
          userId: user.id,
          matchId,
          from: body.from ?? 'you',
          text,
          status,
          requestType: body.requestType ?? (text.startsWith('[Photo request]') ? 'photo' : 'message'),
          createdAt,
          acceptedAt: autoAcceptDemo ? createdAt : undefined,
        })
        if (autoAcceptDemo) {
          db.messages.push({
            id: randomUUID(),
            userId: matchId,
            matchId: user.id,
            from: 'them',
            text: demoAutoReply(matchUser, user.profile, text),
            status: 'accepted',
            requestType: 'message',
            createdAt: new Date(new Date(createdAt).getTime() + 1000).toISOString(),
            acceptedAt: createdAt,
            simulated: true,
          })
        }
        const privacySettings = { ...defaultPrivacySettings, ...(db.privacySettings[user.id] ?? {}) }
        if (privacySettings.attentionLearning && text.length >= 60) {
          db.attentionSignals[user.id] = mergeAttentionSignalList(
            db.attentionSignals[user.id],
            attentionSignalFromMessage(db, body.matchId, text),
          )
        }
      }
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/messages/accept') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const matchId = String(body.matchId ?? '').trim()
      const acceptedAt = now()
      let accepted = 0
      db.messages.forEach((message) => {
        if (!messagesBelongToPair(message, user.id, matchId)) return
        message.status = 'accepted'
        message.acceptedAt ??= acceptedAt
        accepted += 1
      })
      await saveDb(db)
      send(response, 200, {
        accepted,
        state: buildAppState(db, user, request),
      })
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/feedback') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const feedback = {
        id: randomUUID(),
        userId: user.id,
        matchId: body.matchId,
        type: body.type ?? 'general',
        note: String(body.note ?? '').slice(0, 500),
        createdAt: now(),
      }
      db.feedback.push(feedback)
      if (feedback.type === 'stronger') {
        db.favorites[user.id] = [...new Set([...(db.favorites[user.id] ?? []), body.matchId])]
        prependMemory(
          db,
          user.id,
          `Feedback: ${body.matchName ?? 'This match'} feels stronger than the score.`,
          { visibility: 'match_ai', source: 'match-feedback' },
        )
      }
      if (feedback.type === 'weaker') {
        prependMemory(
          db,
          user.id,
          `Feedback: lower confidence for ${body.matchName ?? 'this profile'} until more signals are known.`,
          { visibility: 'match_ai', source: 'match-feedback' },
        )
      }
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/tester-feedback') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const feedback = {
        id: randomUUID(),
        userId: user.id,
        surface: String(body.surface ?? 'app').slice(0, 80),
        rating: clamp(Number.parseInt(body.rating, 10) || 0, 1, 5),
        issueType: [
          'general',
          'confusing',
          'visual',
          'bug',
          'privacy',
          'match_quality',
          'performance',
        ].includes(body.issueType) ? body.issueType : 'general',
        body: String(body.body ?? '').replace(/\s+/g, ' ').trim().slice(0, 1200),
        metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
        createdAt: now(),
      }
      if (!feedback.body) {
        return send(response, 400, { error: 'Feedback cannot be empty' })
      }
      db.testerFeedback.push(feedback)
      prependMemory(
        db,
        user.id,
        `Tester feedback (${feedback.issueType}): ${feedback.body}`,
        { visibility: 'match_ai', source: 'tester-feedback', limit: 12 },
      )
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/reports') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      const report = {
        id: randomUUID(),
        userId: user.id,
        matchId: body.matchId,
        reason: String(body.reason ?? 'No reason provided').slice(0, 280),
        notes: String(body.notes ?? '').slice(0, 1000),
        status: 'queued_for_review',
        createdAt: now(),
      }
      db.reports.push(report)
      db.blocks[user.id] = [...new Set([...(db.blocks[user.id] ?? []), body.matchId])]
      db.hidden[user.id] = [...new Set([...(db.hidden[user.id] ?? []), body.matchId])]
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/plans') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      db.datePlans.push({
        id: randomUUID(),
        userId: user.id,
        matchId: body.matchId,
        matchName: body.matchName,
        place: body.place,
        time: body.time,
        createdAt: now(),
      })
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/briefing/send') {
      const body = await readJson(request)
      const { user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      if (!({ ...defaultPrivacySettings, ...(db.privacySettings[user.id] ?? {}) }).weeklyBriefing) {
        return send(response, 403, { error: 'Sunday briefing is disabled in privacy settings' })
      }
      const briefing = buildBriefing(db, user, request)
      const delivery = await deliverBriefing(briefing)
      briefing.mode = delivery.mode
      briefing.delivered = delivery.delivered
      briefing.providerId = delivery.providerId ?? ''
      db.briefings.push(briefing)
      await saveDb(db)
      send(response, 200, buildAppState(db, user, request))
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/export') {
      const { user } = requireSession(db, {}, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      send(response, 200, {
        profile: user.profile,
        memory: normalizeMemories(db.memories[user.id]),
        attentionSignals: normalizeAttentionSignals(db.attentionSignals[user.id]),
        privacySettings: { ...defaultPrivacySettings, ...(db.privacySettings[user.id] ?? {}) },
        linkedTools: db.linkedTools[user.id] ?? defaultLinkedTools,
        feedback: db.feedback.filter((item) => item.userId === user.id),
        reports: db.reports.filter((item) => item.userId === user.id),
        consentEvents: db.consentEvents.filter((item) => item.userId === user.id),
      })
      return
    }

    if (request.method === 'DELETE' && requestUrl.pathname === '/api/account') {
      const body = await readJson(request)
      const { sessionId, user } = requireSession(db, body, requestUrl)
      if (!user) return send(response, 401, { error: 'Session expired' })
      softDeleteUser(db, user, sessionId)
      await saveDb(db)
      send(response, 200, { ok: true })
      return
    }

    notFound(response)
  } catch (error) {
    send(response, 500, { error: error.message })
  }
}

async function route(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`)
  if (!shouldSerializeMutation(request, requestUrl)) {
    await routeCore(request, response)
    return
  }

  const runMutation = mutationQueue.then(() => routeCore(request, response))
  mutationQueue = runMutation.catch(() => {})
  await runMutation
}

createServer(route).listen(PORT, HOST, () => {
  console.log(`MatchPulse API running on http://${HOST}:${PORT}`)
})
