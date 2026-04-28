import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const phase = process.argv[2] || 'deploy'
const distDir = resolve('dist')
const distIndex = resolve(distDir, 'index.html')
const distReady = existsSync(distIndex)

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) {
    return 'unknown'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`
}

const indexSize = distReady ? formatBytes(statSync(distIndex).size) : 'missing'
const expectedStaticPort = '80'

const fields = [
  ['phase', phase],
  ['app', process.env.npm_package_name || 'novel-studio'],
  ['node', process.version],
  ['publish_directory', './dist'],
  ['dist_index', distReady ? 'present' : 'missing'],
  ['dist_index_size', indexSize],
  ['expected_static_listen_port', expectedStaticPort],
  ['runtime_PORT_env', process.env.PORT || 'unset']
]

console.log('[novel-studio:deploy] deployment probe')
for (const [key, value] of fields) {
  console.log(`[novel-studio:deploy] ${key}=${value}`)
}
