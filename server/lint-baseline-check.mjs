import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const eslintBin = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js')
const result = spawnSync(process.execPath, [eslintBin, '.', '--format', 'json'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
})

if (result.error) throw result.error
if (result.status > 1) {
  process.stderr.write(result.stderr || result.stdout)
  process.exit(result.status)
}

let reports
try {
  reports = JSON.parse(result.stdout || '[]')
} catch (error) {
  console.error('ERROR: ESLint did not return valid JSON.')
  process.stderr.write(result.stderr || result.stdout)
  throw error
}

const expected = [
  {
    key: 'email-verification-effect-dependencies',
    count: 1,
    matches: (message) =>
      message.ruleId === 'react-hooks/exhaustive-deps' &&
      message.message.includes("missing dependencies: 'emailVerificationParams' and 'setAuthModeWithReset'"),
  },
  {
    key: 'oauth-effect-dependency',
    count: 1,
    matches: (message) =>
      message.ruleId === 'react-hooks/exhaustive-deps' &&
      message.message.includes("missing dependency: 'setAuthModeWithReset'"),
  },
  {
    key: 'active-screenshots-stability',
    count: 1,
    matches: (message) =>
      message.ruleId === 'react-hooks/exhaustive-deps' &&
      message.message.includes("The 'activeScreenshots' logical expression"),
  },
  {
    key: 'update-active-item-stability',
    count: 2,
    matches: (message) =>
      message.ruleId === 'react-hooks/exhaustive-deps' &&
      message.message.includes("The 'updateActiveItem' function makes the dependencies"),
  },
  ...[
    'saveProfileChanges',
    'addNeuralNodeAsProfileTag',
    'ProfileInsightControlPanel',
    'uniqueSignals',
  ].map((name) => ({
    key: `staged-control-panel-${name}`,
    count: 1,
    matches: (message) =>
      message.ruleId === 'no-unused-vars' &&
      message.message.includes(`'${name}' is defined but never used`),
  })),
]

const counts = new Map(expected.map((item) => [item.key, 0]))
const unexpected = []

for (const report of reports) {
  const relativePath = path.relative(root, report.filePath)
  for (const message of report.messages ?? []) {
    const baseline = relativePath === path.join('src', 'App.jsx')
      ? expected.find((item) => item.matches(message))
      : null

    if (!baseline) {
      unexpected.push({ relativePath, message })
      continue
    }

    counts.set(baseline.key, counts.get(baseline.key) + 1)
  }
}

const baselineDrift = expected.filter((item) => counts.get(item.key) !== item.count)

for (const { relativePath, message } of unexpected) {
  console.error(
    `ERROR: ${relativePath}:${message.line ?? 0}:${message.column ?? 0} ` +
    `[${message.ruleId ?? 'eslint'}] ${message.message}`,
  )
}
for (const item of baselineDrift) {
  console.error(
    `ERROR: lint baseline ${item.key} expected ${item.count}, found ${counts.get(item.key)}.`,
  )
}

if (unexpected.length || baselineDrift.length) {
  console.error(
    `Lint baseline validation failed with ${unexpected.length} new issue(s) and ` +
    `${baselineDrift.length} changed baseline item(s).`,
  )
  process.exitCode = 1
} else {
  const total = expected.reduce((sum, item) => sum + item.count, 0)
  console.log(
    `Lint baseline validation passed. ${total} known App.jsx issues remain isolated for the ` +
    'separate local control-panel delta review; any new or changed lint issue fails this check.',
  )
}
