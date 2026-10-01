import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationRoot = path.join(root, 'supabase', 'migrations')
const expectedPrefixes = ['0001', '0002', '0003', '0004', '0005']
const documentationFiles = [
  'README.md',
  'docs/beta-runbook.md',
  'docs/zero-cost-launch.md',
  'docs/agent-handoff-public-free-beta.md',
  'docs/deployment-topology.md',
]

const errors = []
const migrationFiles = (await readdir(migrationRoot))
  .filter((file) => file.endsWith('.sql'))
  .sort()

const fileByPrefix = new Map()
for (const prefix of expectedPrefixes) {
  const matches = migrationFiles.filter((file) => file.startsWith(`${prefix}_`))
  if (matches.length !== 1) {
    errors.push(
      `Expected exactly one SQL migration with prefix ${prefix}; found ${matches.length}: ${matches.join(', ') || 'none'}`,
    )
    continue
  }
  fileByPrefix.set(prefix, matches[0])
}

const orderedExpectedFiles = expectedPrefixes
  .map((prefix) => fileByPrefix.get(prefix))
  .filter(Boolean)

for (let index = 1; index < orderedExpectedFiles.length; index += 1) {
  const previous = orderedExpectedFiles[index - 1]
  const current = orderedExpectedFiles[index]
  if (previous.localeCompare(current) >= 0) {
    errors.push(`Migration order is not lexical: ${previous} must precede ${current}`)
  }
}

for (const relativePath of documentationFiles) {
  const content = await readFile(path.join(root, relativePath), 'utf8')
  for (const prefix of expectedPrefixes) {
    if (!content.includes(prefix)) {
      errors.push(`${relativePath} does not mention required migration prefix ${prefix}`)
    }
  }
}

for (const message of errors) console.error(`ERROR: ${message}`)

if (errors.length > 0) {
  console.error(`Migration plan validation failed with ${errors.length} error(s).`)
  process.exitCode = 1
} else {
  console.log('Migration plan validation passed:')
  for (const prefix of expectedPrefixes) {
    console.log(`- ${prefix}: ${fileByPrefix.get(prefix)}`)
  }
}
