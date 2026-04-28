import { spawn } from 'node:child_process'

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || process.env.VITE_PREVIEW_PORT || '4173'

console.log('[novel-studio:deploy] preview listen probe')
console.log(`[novel-studio:deploy] preview_host=${host}`)
console.log(`[novel-studio:deploy] preview_port=${port}`)
console.log('[novel-studio:deploy] dokploy_static_domain_port=80')

const child = spawn('vite', ['preview', '--host', host, '--port', port, '--strictPort'], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
