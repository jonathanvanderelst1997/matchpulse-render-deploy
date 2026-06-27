function normalizeBaseUrl(value) {
  return String(value).replace(/\/+$/, '')
}

const apiBase = normalizeBaseUrl(process.env.MATCHPULSE_TEST_API ?? 'http://127.0.0.1:8787')
const webBase = normalizeBaseUrl(process.env.MATCHPULSE_TEST_WEB ?? 'http://127.0.0.1:5173')
const onePixelPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

function runScopedName(prefix = 'smoke') {
  return `${prefix}-${runId}`
}

function cleanPasswordSuffix(value = 'user') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28) || 'user'
}

function absoluteWebUrl(pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${webBase}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${payload.error ?? response.statusText}`)
  }
  return payload
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function createAccount(name, inviteCode = '') {
  const contact = `${name.toLowerCase().replaceAll(' ', '.')}-${runId}@matchpulse.local`
  const clean = name.toLowerCase().replaceAll(' ', '-').replaceAll('.', '-')
  const password = `Pass-${clean}-2026`
  const auth = await request(webBase, '/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'Email',
      mode: 'signup',
      inviteCode,
      contact,
      password,
      passwordConfirm: password,
    }),
  })
  assert(auth.profile.email === contact, 'Auth contact email was not saved to draft profile')
  const authState = await request(webBase, `/api/app-state?sessionId=${encodeURIComponent(auth.sessionId)}`)
  const verificationEmail = authState.authEmails?.find((item) => item.type === 'email_verification')
  if (verificationEmail?.previewUrl) {
    const verificationUrl = new URL(verificationEmail.previewUrl)
    const verified = await request(webBase, '/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({
        contact: verificationUrl.searchParams.get('verifyContact'),
        token: verificationUrl.searchParams.get('verifyToken'),
        language: 'Nederlands',
      }),
    })
    assert(verified.ok, 'Signup verification preview link did not verify the account')
  } else if (auth.emailVerification?.required) {
    throw new Error('Email verification is required, but no local preview verification link was available for smoke testing')
  }
  const upload = await request(webBase, '/api/uploads/photo', {
    method: 'POST',
    body: JSON.stringify({ sessionId: auth.sessionId, dataUrl: onePixelPng }),
  })
  const state = await request(webBase, '/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: auth.sessionId,
      profile: {
        ...auth.profile,
        name,
        fullName: name,
        age: 31,
        city: 'Brussels',
        email: `${name.toLowerCase().replaceAll(' ', '.')}@matchpulse.local`,
        language: 'Nederlands',
        bio: `${name} values warm communication, design, honesty and calm chemistry.`,
        lookingFor: 'Serious',
        photo: upload.photoUrl,
      },
      photos: [upload.photoUrl],
    }),
  })
  assert(state.profile.language === 'Nederlands', 'Language preference was not saved')
  assert(
    state.authEmails?.some((item) => item.type === 'email_verification'),
    'Signup verification email was not visible in app state',
  )

  return { auth, upload, state, password }
}

async function run() {
  const results = {}
  const cleanupSessionIds = []
  const health = await request(apiBase, '/api/health')
  assert(health.ok, 'API health is not ok')
  results.health = health.providerStatus.database

  const ageGate = await request(webBase, '/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'Email',
      mode: 'signup',
      contact: `+32 470 12 ${runId.replaceAll('-', '').slice(0, 5)}`,
      password: 'AgeGate2026',
      passwordConfirm: 'AgeGate2026',
    }),
  })
  cleanupSessionIds.push(ageGate.sessionId)
  assert(ageGate.profile.phone.includes('32470'), 'Mobile contact was not saved to draft profile')
  await fetch(`${webBase}/api/onboarding/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: ageGate.sessionId,
      profile: { ...ageGate.profile, age: 17 },
      photos: ageGate.photos,
    }),
  }).then(async (response) => {
    assert(response.status === 400, `18+ gate expected 400, received ${response.status}`)
  })
  results.ageGate = 'passed'

  const left = await createAccount(runScopedName('Smoke Left'))
  const right = await createAccount(runScopedName('Smoke Right'), left.state.inviteCode)
  cleanupSessionIds.push(left.auth.sessionId, right.auth.sessionId)
  const missingLogin = await fetch(`${webBase}/api/auth/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'Email',
      mode: 'login',
      contact: `missing-${Date.now()}@matchpulse.local`,
      profile: { language: 'Nederlands' },
    }),
  })
  assert(missingLogin.status === 401, `Missing login expected 401, received ${missingLogin.status}`)
  const missingLoginPayload = await missingLogin.json().catch(() => ({}))
  assert(missingLoginPayload.code === 'password_required', 'Missing login did not return password_required')
  const duplicateSignup = await fetch(`${webBase}/api/auth/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'Email',
      mode: 'signup',
      contact: left.state.profile.email,
      password: 'Another2026',
      passwordConfirm: 'Another2026',
    }),
  })
  assert(duplicateSignup.status === 409, `Duplicate signup expected 409, received ${duplicateSignup.status}`)
  const returningLogin = await request(webBase, '/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'Email',
      mode: 'login',
      contact: left.state.profile.email,
      password: left.password,
    }),
  })
  cleanupSessionIds.push(returningLogin.sessionId)
  assert(returningLogin.onboarded, 'Returning login did not load the completed profile')
  assert(returningLogin.profile.id === left.state.profile.id, 'Returning login did not reuse the same profile')
  const wrongPasswordLogin = await fetch(`${webBase}/api/auth/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'Email',
      mode: 'login',
      contact: left.state.profile.email,
      password: 'WrongPassword2026',
    }),
  })
  assert(wrongPasswordLogin.status === 401, `Wrong password login expected 401, received ${wrongPasswordLogin.status}`)
  const resetStart = await request(webBase, '/api/auth/password-reset/start', {
    method: 'POST',
    body: JSON.stringify({ contact: left.state.profile.email, language: 'Nederlands' }),
  })
  assert(resetStart.ok, 'Password reset request did not return generic success')
  const resetState = await request(webBase, `/api/app-state?sessionId=${encodeURIComponent(left.auth.sessionId)}`)
  const resetEmail = resetState.authEmails?.find((item) => item.type === 'password_reset')
  assert(resetEmail, 'Password reset email was not visible in app state')
  const resetComplete = await fetch(`${webBase}/api/auth/password-reset/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact: left.state.profile.email,
      token: 'invalid-token',
      password: 'ResetPass2026',
      passwordConfirm: 'ResetPass2026',
      language: 'Nederlands',
    }),
  })
  assert(resetComplete.status === 400, `Invalid reset token expected 400, received ${resetComplete.status}`)
  if (resetEmail.previewUrl) {
    const resetUrl = new URL(resetEmail.previewUrl)
    const nextPassword = `Reset-${cleanPasswordSuffix(left.state.profile.email)}-2026`
    const resetValid = await request(webBase, '/api/auth/password-reset/complete', {
      method: 'POST',
      body: JSON.stringify({
        contact: resetUrl.searchParams.get('resetContact'),
        token: resetUrl.searchParams.get('resetToken'),
        password: nextPassword,
        passwordConfirm: nextPassword,
        language: 'Nederlands',
      }),
    })
    cleanupSessionIds.push(resetValid.sessionId)
    assert(resetValid.sessionId, 'Valid reset preview link did not sign the user back in')
    left.password = nextPassword
  }
  results.authModes = 'signup-login-existing-password'
  const betaTester = await request(webBase, '/api/beta/tester', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId }),
  })
  if (betaTester.testerSessionId) cleanupSessionIds.push(betaTester.testerSessionId)
  assert(betaTester.tester?.id, 'Beta tester was not created')
  assert(
    betaTester.state.matches.some((item) => item.id === betaTester.tester.id),
    'Created beta tester did not appear in match list',
  )
  results.betaTester = betaTester.tester.name

  const uploadResponse = await fetch(absoluteWebUrl(left.upload.photoUrl))
  assert(uploadResponse.ok, 'Uploaded profile photo is not served through web origin')
  results.upload = left.upload.photoUrl

  const match = left.state.matches.find((item) => item.id === right.state.profile.id) ?? left.state.matches[0]
  assert(match, 'No match available after onboarding')
  assert(match.attractionDna?.mutual >= 38, 'Attraction DNA mutual score missing')
  assert(match.attractionDna?.axes?.length, 'Attraction DNA axes missing')
  results.attractionDna = `${match.attractionDna.mutual}% mutual`

  await request(webBase, '/api/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: left.auth.sessionId,
      matchId: right.state.profile.id,
      text: 'Smoke test says hello.',
    }),
  })
  const rightState = await request(webBase, `/api/app-state?sessionId=${encodeURIComponent(right.auth.sessionId)}`)
  const incomingRequest = rightState.messages.find(
    (message) => message.matchId === left.state.profile.id && message.from === 'them',
  )
  assert(
    incomingRequest,
    'Two-way message did not appear for recipient',
  )
  assert(incomingRequest.status === 'request', 'First message should arrive as a request')
  const acceptedRequest = await request(webBase, '/api/messages/accept', {
    method: 'POST',
    body: JSON.stringify({ sessionId: right.auth.sessionId, matchId: left.state.profile.id }),
  })
  assert(
    acceptedRequest.state.messages.some(
      (message) => message.matchId === left.state.profile.id && message.status === 'accepted',
    ),
    'Accepted request did not unlock the chat',
  )
  results.messages = 'request-accept-chat'

  const demoAutoAccepted = await request(webBase, '/api/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: left.auth.sessionId,
      matchId: betaTester.tester.id,
      text: 'Demo tester, please help me test the chat flow.',
    }),
  })
  assert(
    demoAutoAccepted.messages.some(
      (message) => message.matchId === betaTester.tester.id && message.from === 'you' && message.status === 'accepted',
    ),
    'Demo tester did not auto-accept the outgoing message',
  )
  assert(
    demoAutoAccepted.messages.some(
      (message) => message.matchId === betaTester.tester.id && message.from === 'them' && message.status === 'accepted',
    ),
    'Demo tester did not send an automatic reply',
  )
  results.demoAutoAccept = 'accepted-replied'

  const memory = await request(webBase, '/api/memory', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, text: 'I prefer kind ambition and clear plans.' }),
  })
  assert(memory.memoryNotes[0]?.text?.includes('kind ambition'), 'Memory was not saved')
  assert(memory.memoryNotes[0]?.visibility === 'match_ai', 'Memory default consent was not set')
  const updatedMemory = await request(webBase, '/api/memory', {
    method: 'PATCH',
    body: JSON.stringify({
      sessionId: left.auth.sessionId,
      memoryId: memory.memoryNotes[0].id,
      visibility: 'profile',
    }),
  })
  assert(updatedMemory.memoryNotes[0]?.visibility === 'profile', 'Memory consent was not updated')
  await request(webBase, '/api/memory', {
    method: 'DELETE',
    body: JSON.stringify({ sessionId: left.auth.sessionId, memoryId: memory.memoryNotes[0].id }),
  })
  results.memory = 'add-update-delete'

  const insight = await request(webBase, '/api/ai/profile-insight', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, text: 'Warm honesty matters to me.' }),
  })
  assert(insight.insight?.summary, 'AI insight did not return a summary')
  results.ai = insight.insight.provider

  const toggledPrivacy = await request(webBase, '/api/privacy/toggle', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, settingId: 'weeklyBriefing' }),
  })
  assert(toggledPrivacy.privacySettings.weeklyBriefing === false, 'Privacy toggle did not persist')
  const toggledAttention = await request(webBase, '/api/privacy/toggle', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, settingId: 'attentionLearning' }),
  })
  assert(toggledAttention.privacySettings.attentionLearning === false, 'Attention privacy toggle did not persist')
  await request(webBase, '/api/privacy/toggle', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, settingId: 'attentionLearning' }),
  })
  await request(webBase, '/api/privacy/toggle', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, settingId: 'weeklyBriefing' }),
  })
  results.privacy = 'toggle-attention'

  const attentionSignal = {
    id: 'attention-profile-clean-creative-style',
    label: 'Profile pull: clean creative style',
    body: 'Smoke test private attention signal.',
    style: 'clean creative style',
    matchId: match.id,
    matchName: match.name,
    count: 1,
    seconds: 8,
  }
  const savedAttention = await request(webBase, '/api/attention', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, signal: attentionSignal }),
  })
  assert(
    savedAttention.attentionSignals.some((signal) => signal.id === attentionSignal.id),
    'Private attention signal was not saved',
  )
  const deletedAttention = await request(webBase, '/api/attention', {
    method: 'DELETE',
    body: JSON.stringify({ sessionId: left.auth.sessionId, signalId: attentionSignal.id }),
  })
  assert(
    !deletedAttention.attentionSignals.some((signal) => signal.id === attentionSignal.id),
    'Private attention signal was not deleted',
  )
  await request(webBase, '/api/attention', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, signal: attentionSignal }),
  })
  const clearedAttention = await request(webBase, '/api/attention', {
    method: 'DELETE',
    body: JSON.stringify({ sessionId: left.auth.sessionId, clear: true }),
  })
  assert(clearedAttention.attentionSignals.length === 0, 'Private attention signals were not cleared')
  results.attention = 'save-delete-clear'

  const tools = await request(webBase, '/api/tools/toggle', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, toolId: 'spotify' }),
  })
  assert(tools.linkedTools.some((tool) => tool.id === 'spotify' && tool.connected), 'Tool toggle failed')
  results.tools = 'toggle'

  const favorite = await request(webBase, '/api/favorites/toggle', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, matchId: match.id }),
  })
  assert(favorite.favorites.includes(match.id), 'Favorite toggle failed')
  results.favorite = 'saved'

  const hidden = await request(webBase, '/api/hidden/hide', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId, matchId: match.id }),
  })
  assert(hidden.hiddenMatches.includes(match.id), 'Hide match failed')
  const restored = await request(webBase, '/api/hidden/reset', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId }),
  })
  assert(!restored.hiddenMatches.includes(match.id), 'Reset hidden matches failed')
  results.hidden = 'hide-reset'

  const feedback = await request(webBase, '/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: left.auth.sessionId,
      matchId: match.id,
      matchName: match.name,
      type: 'stronger',
    }),
  })
  assert(feedback.feedback.length > 0, 'Feedback was not saved')
  results.feedback = 'saved'

  const testerFeedback = await request(webBase, '/api/tester-feedback', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: left.auth.sessionId,
      surface: 'smoke-test',
      rating: 4,
      issueType: 'confusing',
      body: 'Smoke tester feedback checks the beta feedback loop.',
    }),
  })
  assert(testerFeedback.testerFeedback.length > 0, 'Tester feedback was not saved')
  assert(
    testerFeedback.betaOverview?.latestTesterFeedback?.some((item) => item.surface === 'smoke-test'),
    'Tester feedback did not appear in beta overview',
  )
  results.testerFeedback = 'saved-overview'

  const plan = await request(webBase, '/api/plans', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: left.auth.sessionId,
      matchId: match.id,
      matchName: match.name,
      place: 'Smoke Cafe',
      time: 'Friday 20:00',
    }),
  })
  assert(plan.plannedDates.some((item) => item.place === 'Smoke Cafe'), 'Date plan was not saved')
  results.plans = 'saved'

  const briefing = await request(webBase, '/api/briefing/send', {
    method: 'POST',
    body: JSON.stringify({ sessionId: left.auth.sessionId }),
  })
  assert(briefing.briefings.length > 0, 'Briefing was not created')
  results.briefing = briefing.briefings[0].mode

  const report = await request(webBase, '/api/reports', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: left.auth.sessionId,
      matchId: match.id,
      reason: 'Smoke test report',
      notes: 'Verifies report and block flow.',
    }),
  })
  assert(report.reports.length > 0, 'Report was not saved')
  assert(!report.matches.some((item) => item.id === match.id), 'Reported match was not blocked from match list')
  results.reports = 'saved-blocked'

  const exported = await request(webBase, `/api/export?sessionId=${encodeURIComponent(left.auth.sessionId)}`)
  assert(exported.profile?.name?.startsWith('Smoke Left'), 'Export did not contain profile')
  assert(Array.isArray(exported.consentEvents), 'Export did not contain consent events')
  results.export = 'profile-consent'

  const overview = await request(webBase, `/api/beta/overview?sessionId=${encodeURIComponent(left.auth.sessionId)}`)
  assert(overview.totals.activeUsers >= 2, 'Beta overview did not count active users')
  assert(overview.totals.feedback >= 1, 'Beta overview did not count feedback')
  results.betaOverview = overview.totals

  const deleteCandidate = await createAccount(`Smoke Delete ${Date.now()}`)
  const deleted = await request(webBase, '/api/account', {
    method: 'DELETE',
    body: JSON.stringify({ sessionId: deleteCandidate.auth.sessionId }),
  })
  assert(deleted.ok, 'Account delete did not return ok')
  results.deleteAccount = 'ok'

  const html = await fetch(`${webBase}/`).then((response) => response.text())
  assert(html.includes('MatchPulse'), 'Web root did not serve MatchPulse')
  results.webRoot = 'ok'

  for (const sessionId of cleanupSessionIds.reverse()) {
    await request(webBase, '/api/account', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId }),
    }).catch(() => null)
  }
  results.cleanup = 'smoke-accounts-deleted'

  console.log(JSON.stringify({ ok: true, results }, null, 2))
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
