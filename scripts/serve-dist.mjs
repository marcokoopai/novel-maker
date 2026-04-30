import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'

const host = process.env.HOST || '0.0.0.0'
const port = Number(process.env.PORT || process.env.VITE_PREVIEW_PORT || 4173)
const distDir = resolve('dist')
const indexPath = join(distDir, 'index.html')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
}

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function resolveAssetPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/')
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const relative = normalized === sep ? 'index.html' : normalized.replace(/^[/\\]/, '')
  const candidate = resolve(distDir, relative)
  return candidate.startsWith(distDir + sep) || candidate === distDir ? candidate : indexPath
}

if (!existsSync(indexPath)) {
  console.error('[novel-studio:serve] dist/index.html is missing. Run npm run build first.')
  process.exit(1)
}

const server = createServer((req, res) => {
  const method = req.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed')
    return
  }

  let filePath
  try {
    filePath = resolveAssetPath(req.url || '/')
  } catch {
    send(res, 400, 'Bad Request')
    return
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = indexPath
  }

  const contentType = contentTypes[extname(filePath)] || 'application/octet-stream'
  const size = statSync(filePath).size
  res.writeHead(200, {
    'Cache-Control': filePath === indexPath ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Length': size,
    'Content-Type': contentType,
  })

  if (method === 'HEAD') {
    res.end()
    return
  }

  createReadStream(filePath).pipe(res)
})

server.on('error', (error) => {
  console.error(`[novel-studio:serve] failed to listen on ${host}:${port}`)
  console.error(`[novel-studio:serve] ${error.message}`)
  process.exit(1)
})

server.listen(port, host, () => {
  console.log('[novel-studio:serve] serving ./dist')
  console.log(`[novel-studio:serve] host=${host}`)
  console.log(`[novel-studio:serve] port=${port}`)
})
