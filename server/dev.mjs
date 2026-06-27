import { spawn } from 'node:child_process'

const host = process.env.MATCHPULSE_HOST ?? '127.0.0.1'
const viteArgs = ['vite', '--host', host, ...process.argv.slice(2)]

const children = [
  spawn('node', ['server/api.mjs'], { stdio: 'inherit' }),
  spawn('npx', viteArgs, { stdio: 'inherit', shell: true }),
]

function stop() {
  children.forEach((child) => {
    if (!child.killed) child.kill('SIGTERM')
  })
}

process.on('SIGINT', () => {
  stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stop()
  process.exit(0)
})

children.forEach((child) => {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      stop()
      process.exit(code)
    }
  })
})
