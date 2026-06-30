import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const enabledOAuthProviders = new Set(
  String(import.meta.env.VITE_MATCHPULSE_OAUTH_PROVIDERS ?? '')
    .split(',')
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean),
)

let client

export function canUseSupabaseOAuth(provider) {
  const normalizedProvider = String(provider).toLowerCase()
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      ['google', 'apple'].includes(normalizedProvider) &&
      enabledOAuthProviders.has(normalizedProvider),
  )
}

function getSupabaseClient() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  }

  return client
}

export async function startSupabaseOAuth(provider, inviteCode = '') {
  const redirectUrl = new URL(window.location.origin)
  redirectUrl.searchParams.set('authCallback', '1')
  if (inviteCode) redirectUrl.searchParams.set('invite', inviteCode)

  const { error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: String(provider).toLowerCase(),
    options: {
      redirectTo: redirectUrl.toString(),
    },
  })

  if (error) throw new Error(error.message)
}

export async function completeSupabaseOAuth() {
  const supabase = getSupabaseClient()
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw new Error(error.message)
    return data.session?.access_token ?? ''
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  return data.session?.access_token ?? ''
}

export async function clearSupabaseOAuthSession() {
  if (!client) return
  await client.auth.signOut()
}
