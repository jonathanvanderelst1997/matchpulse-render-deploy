// Meet hoeveel bytes de API van Supabase binnenhaalt (egress aan Supabase-kant).
// Start een nep-PostgREST voor matchpulse_app_state, draait server/api.mjs daartegen
// en telt de antwoordbytes per aanroep. Geen netwerk, geen echte sleutel, geen kosten.
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const apiPath = fileURLToPath(new URL('./api.mjs', import.meta.url))
const maxBytesPerCachedRequest = Number(process.env.MATCHPULSE_EGRESS_MAX_BYTES_PER_REQUEST ?? 2000)

let row = null
let egressBytes = 0
const log = []

function reply(response, status, body) {
  const text = body === undefined ? '' : JSON.stringify(body)
  egressBytes += Buffer.byteLength(text)
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(text)
}

const mock = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://mock')
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  log.push(`${request.method} ${url.pathname}?${url.searchParams.get('select') ?? ''}`)

  if (url.pathname !== '/rest/v1/matchpulse_app_state') return reply(response, 404, { message: 'not mocked' })
  if (request.method === 'GET') {
    if (!row) return reply(response, 200, [])
    const select = (url.searchParams.get('select') ?? '').split(',')
    return reply(response, 200, [Object.fromEntries(select.map((key) => [key, row[key]]))])
  }
  if (request.method === 'POST') {
    const body = JSON.parse(raw)
    row = { id: body.id, data: body.data, updated_at: new Date(body.updated_at).toISOString().replace('Z', '+00:00') }
    return reply(response, 201)
  }
  return reply(response, 405, { message: 'method' })
})

await new Promise((resolve) => mock.listen(0, '127.0.0.1', resolve))
const mockUrl = `http://127.0.0.1:${mock.address().port}`
const apiPort = 18000 + Math.floor(Math.random() * 2000)
const apiBase = `http://127.0.0.1:${apiPort}`

const child = spawn(process.execPath, [apiPath], {
  env: {
    PATH: process.env.PATH,
    MATCHPULSE_API_PORT: String(apiPort),
    HOST: '127.0.0.1',
    MATCHPULSE_DATA_PROVIDER: 'supabase',
    SUPABASE_URL: mockUrl,
    SUPABASE_SERVICE_ROLE_KEY: 'egress-check-dummy',
    MATCHPULSE_STATE_ID: 'egress-check',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let childOutput = ''
child.stdout.on('data', (chunk) => { childOutput += chunk })
child.stderr.on('data', (chunk) => { childOutput += chunk })

function fail(message) {
  console.error(`FAIL: ${message}`)
  console.error(childOutput)
  child.kill()
  mock.close()
  process.exit(1)
}

async function api(path) {
  const response = await fetch(`${apiBase}${path}`)
  if (!response.ok) fail(`${path} gaf ${response.status}`)
  return response.json()
}

for (let attempt = 0; attempt < 50; attempt += 1) {
  try {
    await api('/api/health')
    break
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (attempt === 49) fail('API startte niet')
}

const stateBytes = Buffer.byteLength(JSON.stringify(row?.data ?? {}))
if (!row) fail('seedstaat werd niet naar Supabase geschreven')

// 1. Veertig leesaanroepen zonder wijziging: alleen de versieprobe mag over de lijn.
egressBytes = 0
const reads = 40
for (let index = 0; index < reads; index += 1) await api('/api/health')
const perRead = egressBytes / reads
console.log(`staat: ${stateBytes} bytes; egress per ongewijzigde aanroep: ${perRead.toFixed(0)} bytes`)
if (perRead > maxBytesPerCachedRequest) {
  fail(`elke aanroep haalt nog ${perRead.toFixed(0)} bytes op (max ${maxBytesPerCachedRequest}); de volledige staat wordt telkens opnieuw geladen`)
}

// 2. Een eigen schrijfactie (account maken) moet daarna zonder volledige herlading leesbaar zijn.
const signupContact = `egress-${Date.now()}@matchpulse.local`
const signupResponse = await fetch(`${apiBase}/api/auth/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'Email',
    mode: 'signup',
    contact: signupContact,
    password: 'Pass-egress-check-2026',
    passwordConfirm: 'Pass-egress-check-2026',
  }),
})
if (!signupResponse.ok) fail(`/api/auth/start gaf ${signupResponse.status}`)
const signup = await signupResponse.json()
const loadsAfterWrite = (await api('/api/health')).stateCache?.fullLoads
const ownState = await api(`/api/app-state?sessionId=${encodeURIComponent(signup.sessionId)}`)
if (ownState.profile?.email !== signupContact) fail('eigen schrijfactie niet teruggelezen')
if ((await api('/api/health')).stateCache?.fullLoads !== loadsAfterWrite) fail('eigen schrijfactie veroorzaakte een volledige herlading')
if (!row.data.users.some((user) => user.profile?.email === signupContact)) fail('eigen schrijfactie niet naar Supabase geschreven')
console.log('eigen schrijfactie: naar Supabase geschreven en uit de cache teruggelezen')

// 3. Een andere schrijver verandert de staat: de API moet de nieuwe versie zien.
const before = await api('/api/health')
row.data.users = row.data.users.map((user) => ({ ...user, deletedAt: user.deletedAt || new Date().toISOString() }))
row.updated_at = new Date(Date.parse(row.updated_at) + 1000).toISOString().replace('Z', '+00:00')
const after = await api('/api/health')
if (after.users !== 0 || before.users === 0) {
  fail(`externe wijziging niet gezien: voor ${before.users}, na ${after.users} gebruikers`)
}
console.log(`externe wijziging gezien: ${before.users} -> ${after.users} actieve gebruikers`)
console.log(`tellers: ${JSON.stringify(after.stateCache ?? {})}`)

child.kill()
mock.close()
console.log('OK: staatcache houdt Supabase-egress klein en blijft actueel')
