const base = process.env.MATCHPULSE_TEST_API ?? 'http://127.0.0.1:8787'
const requirePublicFreeBeta = process.env.MATCHPULSE_REQUIRE_PUBLIC_FREE_BETA === '1'
const requiredPublicProviderIds = new Set([
  'auth',
  'database',
  'storage',
  'email',
  'emailVerification',
  'publicInvite',
  'serviceRole',
])

function envStatus(name, requiredFor = 'optional') {
  return {
    name,
    requiredFor,
    ready: Boolean(process.env[name]),
  }
}

async function run() {
  const response = await fetch(`${base}/api/health`)
  const health = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`/api/health failed: ${response.status} ${health.error ?? response.statusText}`)
  }

  const env = [
    envStatus('MATCHPULSE_PUBLIC_URL', 'public-free-beta'),
    envStatus('SUPABASE_URL', 'public-free-beta'),
    envStatus('SUPABASE_ANON_KEY', 'public-free-beta'),
    envStatus('SUPABASE_SERVICE_ROLE_KEY', 'public-free-beta'),
    envStatus('VITE_SUPABASE_URL', 'public-free-beta'),
    envStatus('VITE_SUPABASE_ANON_KEY', 'public-free-beta'),
    envStatus('OPENAI_API_KEY', 'optional-paid-upgrade'),
    envStatus('RESEND_API_KEY', 'optional-free-email-tier'),
    envStatus('MATCHPULSE_FROM_EMAIL', 'optional-free-email-tier'),
    envStatus('MATCHPULSE_REQUIRE_EMAIL_VERIFICATION', 'email-verification'),
    envStatus('MATCHPULSE_REQUIRE_EMAIL_DELIVERY', 'email-verification'),
  ]

  const providerChecklist = health.providerStatus?.checklist ?? []
  const costChecklist = health.providerStatus?.costChecklist ?? []
  const publicBetaEnv = env.filter((item) => item.requiredFor === 'public-free-beta')
  const readyCount = providerChecklist.filter((item) => item.ready).length
  const publicBetaEnvCount = publicBetaEnv.filter((item) => item.ready).length
  const zeroCostReady = costChecklist.every((item) => item.ready)
  const requiredProviderChecks = providerChecklist.filter((item) => requiredPublicProviderIds.has(item.id))
  const publicProviderReady =
    requiredProviderChecks.length === requiredPublicProviderIds.size &&
    requiredProviderChecks.every((item) => item.ready)
  const publicFreeBetaReady = publicProviderReady && zeroCostReady

  const result = {
    ok: true,
    api: base,
    providerStatus: health.providerStatus,
    env,
    summary: `${readyCount}/${providerChecklist.length} provider checks ready`,
    zeroCost: {
      ready: zeroCostReady,
      mode: health.providerStatus?.costMode ?? 'unknown',
      checklist: costChecklist,
    },
    publicFreeBeta: {
      ready: publicFreeBetaReady,
      summary: publicProviderReady
        ? 'Remote provider checks are ready for public free beta'
        : `${publicBetaEnvCount}/${publicBetaEnv.length} local required env vars ready; remote provider checks are not ready`,
      requiredProviderChecks,
    },
  }

  console.log(JSON.stringify(result, null, 2))

  if (requirePublicFreeBeta && (!zeroCostReady || !publicFreeBetaReady)) {
    throw new Error('Public free beta readiness failed. Fill the required Supabase/Render env vars, configure Resend when email verification is required, and keep paid AI keys empty.')
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
