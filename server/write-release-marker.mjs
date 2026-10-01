import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const releaseId = 'matchpulse-secondary-verification-2026-07-12-v1'
const gitCommit =
  process.env.RENDER_GIT_COMMIT ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  'local'
const gitBranch =
  process.env.RENDER_GIT_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  process.env.BRANCH ||
  'local'

const publicDir = path.resolve(process.cwd(), 'public')
const target = path.join(publicDir, 'deployment-verification.json')

await mkdir(publicDir, { recursive: true })
await writeFile(
  target,
  `${JSON.stringify(
    {
      project: 'matchpulse',
      releaseId,
      gitCommit,
      gitBranch,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  'utf8',
)

console.log(`Wrote ${path.relative(process.cwd(), target)} for ${gitCommit}`)
