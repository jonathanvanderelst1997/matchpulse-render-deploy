import { readFile } from 'node:fs/promises'

const filePath = process.argv[2]
const expectedReleaseId = process.env.EXPECTED_RELEASE_ID

if (!filePath) throw new Error('Release marker file path is required')
if (!expectedReleaseId) throw new Error('EXPECTED_RELEASE_ID is required')

const payload = JSON.parse(await readFile(filePath, 'utf8'))

if (payload.project !== 'matchpulse') {
  throw new Error(`Unexpected project marker: ${payload.project ?? 'missing'}`)
}
if (payload.releaseId !== expectedReleaseId) {
  throw new Error(`Unexpected release marker: ${payload.releaseId ?? 'missing'}`)
}
if (!payload.gitCommit || payload.gitCommit === 'local') {
  throw new Error(`Deployment Git commit is not available: ${payload.gitCommit ?? 'missing'}`)
}

console.log(`Verified secondary release ${payload.releaseId} at ${payload.gitCommit}`)
console.log(JSON.stringify(payload, null, 2))
