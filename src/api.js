async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error ?? 'MatchPulse API request failed')
    error.code = payload?.code
    error.details = payload
    throw error
  }
  return payload
}

function withSession(sessionId, body = {}) {
  return JSON.stringify({ sessionId, ...body })
}

export function startAuthSession(provider, inviteCode, contact = '', profile = {}, mode = 'signup', credentials = {}) {
  return request('/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({ provider, inviteCode, contact, profile, mode, ...credentials }),
  })
}

export function requestPasswordReset(contact, language = 'English') {
  return request('/api/auth/password-reset/start', {
    method: 'POST',
    body: JSON.stringify({ contact, language }),
  })
}

export function verifyEmailToken(contact, token, language = 'English') {
  return request('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ contact, token, language }),
  })
}

export function completePasswordReset(contact, token, password, passwordConfirm, language = 'English') {
  return request('/api/auth/password-reset/complete', {
    method: 'POST',
    body: JSON.stringify({ contact, token, password, passwordConfirm, language }),
  })
}

export function completeSupabaseAuth(accessToken, inviteCode) {
  return request('/api/auth/supabase', {
    method: 'POST',
    body: JSON.stringify({ accessToken, inviteCode }),
  })
}

export function fetchAppState(sessionId) {
  return request(`/api/app-state?sessionId=${encodeURIComponent(sessionId)}`)
}

export function fetchBetaOverview(sessionId) {
  return request(`/api/beta/overview?sessionId=${encodeURIComponent(sessionId)}`)
}

export function createBetaTester(sessionId) {
  return request('/api/beta/tester', {
    method: 'POST',
    body: withSession(sessionId),
  })
}

export function cleanupBetaTestData(sessionId) {
  return request('/api/beta/cleanup', {
    method: 'POST',
    body: withSession(sessionId),
  })
}

export function uploadProfilePhoto(sessionId, dataUrl) {
  return request('/api/uploads/photo', {
    method: 'POST',
    body: withSession(sessionId, { dataUrl }),
  })
}

export function completeOnboarding(sessionId, profile, photos) {
  return request('/api/onboarding/complete', {
    method: 'POST',
    body: withSession(sessionId, { profile, photos }),
  })
}

export function saveProfile(sessionId, profile) {
  return request('/api/profile', {
    method: 'PATCH',
    body: withSession(sessionId, { profile }),
  })
}

function memoryPayload(memory) {
  if (memory && typeof memory === 'object') {
    return {
      memoryId: memory.id,
      note: memory.text,
    }
  }
  return { note: memory }
}

export function saveMemory(sessionId, text, visibility = 'match_ai', source = 'ai-profile-tool') {
  return request('/api/memory', {
    method: 'POST',
    body: withSession(sessionId, { text, visibility, source }),
  })
}

export function saveMemories(sessionId, memories = []) {
  return request('/api/memories', {
    method: 'POST',
    body: withSession(sessionId, { memories }),
  })
}

export function analyzeProfileSignal(sessionId, text) {
  return request('/api/ai/profile-insight', {
    method: 'POST',
    body: withSession(sessionId, { text }),
  })
}

export function updateMemoryConsent(sessionId, memory, visibility) {
  return request('/api/memory', {
    method: 'PATCH',
    body: withSession(sessionId, { ...memoryPayload(memory), visibility }),
  })
}

export function removeMemory(sessionId, memory) {
  return request('/api/memory', {
    method: 'DELETE',
    body: withSession(sessionId, memoryPayload(memory)),
  })
}

export function toggleLinkedTool(sessionId, toolId) {
  return request('/api/tools/toggle', {
    method: 'POST',
    body: withSession(sessionId, { toolId }),
  })
}

export function togglePrivacy(sessionId, settingId) {
  return request('/api/privacy/toggle', {
    method: 'POST',
    body: withSession(sessionId, { settingId }),
  })
}

export function saveAttentionSignal(sessionId, signal) {
  return request('/api/attention', {
    method: 'POST',
    body: withSession(sessionId, { signal }),
  })
}

export function removeAttentionSignal(sessionId, signalId) {
  return request('/api/attention', {
    method: 'DELETE',
    body: withSession(sessionId, { signalId }),
  })
}

export function clearAttentionSignals(sessionId) {
  return request('/api/attention', {
    method: 'DELETE',
    body: withSession(sessionId, { clear: true }),
  })
}

export function toggleFavoriteOnServer(sessionId, matchId) {
  return request('/api/favorites/toggle', {
    method: 'POST',
    body: withSession(sessionId, { matchId }),
  })
}

export function hideMatchOnServer(sessionId, matchId) {
  return request('/api/hidden/hide', {
    method: 'POST',
    body: withSession(sessionId, { matchId }),
  })
}

export function resetHiddenOnServer(sessionId) {
  return request('/api/hidden/reset', {
    method: 'POST',
    body: withSession(sessionId),
  })
}

export function sendMessage(sessionId, matchId, text, from = 'you', metadata = {}) {
  return request('/api/messages/send', {
    method: 'POST',
    body: withSession(sessionId, { matchId, text, from, ...metadata }),
  })
}

export function acceptMessageRequest(sessionId, matchId) {
  return request('/api/messages/accept', {
    method: 'POST',
    body: withSession(sessionId, { matchId }),
  })
}

export function createDatePlan(sessionId, match, plan) {
  return request('/api/plans', {
    method: 'POST',
    body: withSession(sessionId, {
      matchId: match.id,
      matchName: match.name,
      place: plan.place,
      time: plan.time,
    }),
  })
}

export function sendMatchFeedback(sessionId, match, type, note = '') {
  return request('/api/feedback', {
    method: 'POST',
    body: withSession(sessionId, {
      matchId: match.id,
      matchName: match.name,
      type,
      note,
    }),
  })
}

export function sendTesterFeedback(sessionId, feedback) {
  return request('/api/tester-feedback', {
    method: 'POST',
    body: withSession(sessionId, feedback),
  })
}

export function reportAndBlockMatch(sessionId, match, reason, notes = '') {
  return request('/api/reports', {
    method: 'POST',
    body: withSession(sessionId, {
      matchId: match.id,
      reason,
      notes,
    }),
  })
}

export function sendSundayBriefing(sessionId) {
  return request('/api/briefing/send', {
    method: 'POST',
    body: withSession(sessionId),
  })
}

export function exportPrivateProfile(sessionId) {
  return request(`/api/export?sessionId=${encodeURIComponent(sessionId)}`)
}

export function deleteAccount(sessionId) {
  return request('/api/account', {
    method: 'DELETE',
    body: withSession(sessionId),
  })
}
