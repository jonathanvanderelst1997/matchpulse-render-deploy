// Uitvaltoets: hoe gedraagt de API zich als Supabase wegvalt?
//
// Start een nep-Supabase (PostgREST voor matchpulse_app_state) die we per stap een
// storing laten spelen: gepauzeerd project (540), Fair-Use-restrictie (402), geweigerde
// sleutel (401), een HTML-foutpagina (502), geen antwoord, en een voorbijgaande 503.
// Daartegen draait het echte server/api.mjs als kindproces. Geen netwerk, geen echte
// sleutel, geen kosten.
//
// Wat moet blijken:
// - /api/health meldt de oorzaak eerlijk (503 + dependencies.supabase), /api/live blijft 200;
// - een storing wordt een leesbare 503 met code database_unavailable, geen kale 500 met
//   "Unexpected token";
// - geen antwoord kost seconden, geen minuten; voorbijgaande fouten worden opnieuw geprobeerd;
// - lezen gaat door uit de laatst geladen staat, schrijven wordt eerlijk geweigerd;
// - een onleesbare Host-kop stopt het proces niet meer;
// - de browser houdt de sessie bij een tijdelijke storing en logt alleen uit bij 401.
import { createServer } from 'node:http'
import { connect } from 'node:net'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const apiPath = fileURLToPath(new URL('./api.mjs', import.meta.url))
const timeoutMs = 400

let mode = 'ok'
let failNext = 0
let row = null
let requests = 0
const results = []

function reply(response, status, body, type = 'application/json') {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body)
  response.writeHead(status, { 'Content-Type': type })
  response.end(text)
}

const mock = createServer(async (request, response) => {
  requests += 1
  const url = new URL(request.url, 'http://mock')
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')

  if (failNext > 0) {
    failNext -= 1
    return reply(response, 503, { message: 'upstream connect error' })
  }
  if (mode === 'hang') return // nooit antwoorden
  if (mode === 'paused') return reply(response, 540, 'Project paused', 'text/plain')
  if (mode === 'restricted') {
    return reply(response, 402, {
      message: 'Service for this project is restricted due to the following violations: exceed_egress_quota.',
    })
  }
  if (mode === 'key') return reply(response, 401, { message: 'Invalid API key' })
  if (mode === 'html502') return reply(response, 502, '<html><body>Bad gateway</body></html>', 'text/html')

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

const children = []
let childOutput = ''

function startApi(extraEnv) {
  const port = 20000 + Math.floor(Math.random() * 2000)
  const child = spawn(process.execPath, [apiPath], {
    env: {
      PATH: process.env.PATH,
      MATCHPULSE_API_PORT: String(port),
      HOST: '127.0.0.1',
      MATCHPULSE_DATA_PROVIDER: 'supabase',
      SUPABASE_URL: mockUrl,
      SUPABASE_SERVICE_ROLE_KEY: 'resilience-test-dummy',
      MATCHPULSE_STATE_ID: 'resilience-test',
      MATCHPULSE_SUPABASE_TIMEOUT_MS: String(timeoutMs),
      MATCHPULSE_SUPABASE_RETRIES: '2',
      MATCHPULSE_SUPABASE_RETRY_BASE_MS: '20',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', (chunk) => { childOutput += chunk })
  child.stderr.on('data', (chunk) => { childOutput += chunk })
  children.push(child)
  return { child, port, base: `http://127.0.0.1:${port}` }
}

function finish(code) {
  for (const child of children) child.kill()
  mock.closeAllConnections()
  mock.close()
  process.exit(code)
}

function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition) })
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
}

async function call(base, path, options = {}) {
  const started = Date.now()
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })
  const text = await response.text()
  let body = {}
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text }
  }
  return { status: response.status, body, headers: response.headers, ms: Date.now() - started }
}

// Wacht tot het proces antwoordt, met welke status ook; of dat een 200 is, toetsen we apart.
async function waitForLive(base) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      await call(base, '/api/live')
      return
    } catch {
      // nog niet gestart
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  console.error(childOutput)
  throw new Error('API startte niet')
}

function rawRequest(port, text) {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1', () => socket.end(text))
    let data = ''
    socket.on('data', (chunk) => { data += chunk })
    socket.on('error', () => resolve(data))
    socket.on('close', () => resolve(data))
    setTimeout(() => {
      socket.destroy()
      resolve(data)
    }, 3000)
  })
}

const noParseError = (body) => !JSON.stringify(body).includes('Unexpected token')

try {
  const api = startApi()
  const { base } = api
  mode = 'paused'
  await waitForLive(base)

  // 1. Koude start terwijl het project gepauzeerd is (zo lag MatchPulse 10-08 tot 25-09-2026 plat).
  requests = 0
  let health = await call(base, '/api/health')
  check('gepauzeerd: /api/health geeft 503', health.status === 503, `kreeg ${health.status}`)
  check('gepauzeerd: oorzaak supabase_paused gemeld', health.body.error === 'supabase_paused' &&
    health.body.dependencies?.supabase?.state === 'down' && health.body.dependencies?.supabase?.status === 540)
  check('gepauzeerd: 540 wordt niet herhaald', requests === 1, `${requests} verzoeken`)
  let write = await call(base, '/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({ provider: 'Email', mode: 'signup', contact: 'a@matchpulse.local', password: 'Pass-a-2026', passwordConfirm: 'Pass-a-2026' }),
  })
  check('gepauzeerd: schrijven geeft 503 database_unavailable', write.status === 503 &&
    write.body.code === 'database_unavailable' && write.body.reason === 'supabase_paused', `kreeg ${write.status}`)
  check('gepauzeerd: leesbare melding, geen JSON-parsefout', noParseError(write.body) && noParseError(health.body))
  let read = await call(base, '/api/app-state?sessionId=onbekend')
  check('gepauzeerd zonder cache: lezen geeft 503, geen 401', read.status === 503, `kreeg ${read.status}`)
  const live = await call(base, '/api/live')
  check('gepauzeerd: /api/live blijft 200', live.status === 200)

  // 2. Fair-Use-restrictie na te veel egress (402) en een geweigerde sleutel (401).
  mode = 'restricted'
  health = await call(base, '/api/health')
  check('restrictie: 503 met supabase_restricted', health.status === 503 && health.body.error === 'supabase_restricted')
  mode = 'key'
  health = await call(base, '/api/health')
  check('sleutel geweigerd: 503 met supabase_key_rejected', health.status === 503 && health.body.error === 'supabase_key_rejected')

  // 3. Geen antwoord: begrensd in seconden (voorheen tot 300 s per aanroep, en de
  //    schrijfwachtrij bleef zolang dicht).
  mode = 'hang'
  requests = 0
  health = await call(base, '/api/health')
  check('geen antwoord: 503 supabase_timeout', health.status === 503 && health.body.error === 'supabase_timeout')
  check('geen antwoord: binnen 3 s afgerond', health.ms < 3000, `${health.ms} ms`)
  check('geen antwoord: drie pogingen', requests === 3, `${requests} verzoeken`)
  mock.closeAllConnections()

  // 4. HTML-foutpagina (502): herkend als storing, niet als JSON-parsefout.
  mode = 'html502'
  requests = 0
  health = await call(base, '/api/health')
  check('HTML-502: 503 supabase_unavailable', health.status === 503 && health.body.error === 'supabase_unavailable')
  check('HTML-502: opnieuw geprobeerd', requests === 3, `${requests} verzoeken`)

  // 5. Voorbijgaande 503: de herhaling vangt hem op.
  mode = 'ok'
  failNext = 2
  health = await call(base, '/api/health')
  check('voorbijgaande 503: herhaling geeft 200', health.status === 200 && health.body.ok === true, `kreeg ${health.status}`)
  check('voorbijgaande 503: Supabase weer up', health.body.dependencies?.supabase?.state === 'up')
  check('wekker-contract: database supabase-state en users', health.body.providerStatus?.database === 'supabase-state' &&
    Number.isInteger(health.body.users))

  // 6. Een account maken terwijl alles werkt, dan pauzeert het project.
  const contact = `uitval-${Date.now()}@matchpulse.local`
  write = await call(base, '/api/auth/start', {
    method: 'POST',
    body: JSON.stringify({ provider: 'Email', mode: 'signup', contact, password: 'Pass-uitval-2026', passwordConfirm: 'Pass-uitval-2026' }),
  })
  check('gezond: account aangemaakt', write.status === 200 && write.body.sessionId, `kreeg ${write.status}`)
  const sessionId = write.body.sessionId
  mode = 'paused'
  read = await call(base, `/api/app-state?sessionId=${encodeURIComponent(sessionId)}`)
  check('gepauzeerd met cache: lezen gaat door (200)', read.status === 200 && read.body.profile?.email === contact, `kreeg ${read.status}`)
  check('gepauzeerd met cache: gemarkeerd als degraded', read.headers.get('x-matchpulse-degraded') === 'supabase_paused')
  read = await call(base, '/api/app-state?sessionId=niet-in-cache')
  check('gepauzeerd met cache: onbekende sessie geeft 503, geen 401', read.status === 503, `kreeg ${read.status}`)
  write = await call(base, '/api/profile', { method: 'PATCH', body: JSON.stringify({ sessionId, profile: { city: 'Gent' } }) })
  check('gepauzeerd met cache: schrijven geweigerd met 503', write.status === 503 && write.body.code === 'database_unavailable')
  health = await call(base, '/api/health')
  check('gepauzeerd met cache: /api/health blijft eerlijk 503', health.status === 503 && health.body.stateCache?.cached === true)

  // 7. Herstel.
  mode = 'ok'
  health = await call(base, '/api/health')
  check('herstel: /api/health weer 200', health.status === 200 && health.body.dependencies?.supabase?.state === 'up')

  // 8. Onleesbare Host-kop en request-URL: voorheen stopte dit het hele proces.
  const badHost = await rawRequest(api.port, 'GET /api/live HTTP/1.1\r\nHost: [\r\nConnection: close\r\n\r\n')
  check('onleesbare Host: antwoord gekregen', /^HTTP\/1\.1 200/.test(badHost), badHost.split('\r\n')[0] || 'geen antwoord')
  await rawRequest(api.port, 'GET http://[/ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n')
  const stillLive = await call(base, '/api/live')
  check('onleesbare Host/URL: proces leeft nog', stillLive.status === 200 && api.child.exitCode === null)

  // 9. Supabase gevraagd maar sleutel ontbreekt: geen stille terugval zonder melding.
  const misconfigured = startApi({ SUPABASE_SERVICE_ROLE_KEY: '' })
  await waitForLive(misconfigured.base)
  health = await call(misconfigured.base, '/api/health')
  check('sleutel ontbreekt: /api/health 503 misconfigured', health.status === 503 &&
    health.body.dependencies?.supabase?.state === 'misconfigured')

  // 10. Browserkant: alleen 401 logt uit; een storing of netwerkfout houdt de sessie.
  const { fetchAppState, isSessionRejected, isTemporaryOutage } = await import('../src/api.js')
  const realFetch = globalThis.fetch
  const stub = (status, body) => async () => new Response(JSON.stringify(body), { status })
  try {
    globalThis.fetch = stub(401, { error: 'Session expired' })
    let error = await fetchAppState('x').catch((caught) => caught)
    check('browser: 401 logt uit', isSessionRejected(error) && !isTemporaryOutage(error))
    globalThis.fetch = stub(503, { error: 'database', code: 'database_unavailable' })
    error = await fetchAppState('x').catch((caught) => caught)
    check('browser: 503 houdt de sessie', !isSessionRejected(error) && isTemporaryOutage(error))
    globalThis.fetch = stub(500, { error: 'Unexpected token' })
    error = await fetchAppState('x').catch((caught) => caught)
    check('browser: 500 houdt de sessie', !isSessionRejected(error) && isTemporaryOutage(error))
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    error = await fetchAppState('x').catch((caught) => caught)
    check('browser: netwerkfout houdt de sessie', error.status === 0 && error.code === 'network_error' &&
      !isSessionRejected(error) && isTemporaryOutage(error))
  } finally {
    globalThis.fetch = realFetch
  }
} catch (error) {
  console.error(`FOUT: ${error.stack ?? error}`)
  console.error(childOutput)
  finish(1)
}

const failed = results.filter((result) => !result.ok)
if (failed.length) {
  console.error(`\n${failed.length} van ${results.length} controles faalden.`)
  console.error(childOutput)
  finish(1)
}
console.log(`\nOK: ${results.length} uitvalcontroles geslaagd`)
finish(0)
