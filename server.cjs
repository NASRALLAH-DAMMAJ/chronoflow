const { createServer } = require('http')
const { readFileSync, existsSync, statSync } = require('fs')
const { join, extname, resolve } = require('path')
const { createGzip } = require('zlib')

const PORT = process.env.PORT || 5173
const HOST = process.env.HOST || '0.0.0.0'
const dist = join(__dirname, 'dist')

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; manifest-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
}

const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60000
const RATE_LIMIT_MAX = 200

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { start: now, count: 1 })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT_MAX
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW_MS * 2) rateLimitMap.delete(ip)
  }
}, RATE_LIMIT_WINDOW_MS * 2)

function generateETag(content) {
  const crypto = require('crypto')
  return '"' + crypto.createHash('md5').update(content).digest('hex') + '"'
}

function getContentType(filePath) {
  const ext = extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

function getCacheControl(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.html') return 'no-cache, no-store, must-revalidate'
  if (/\.[a-f0-9]{8,}\.\w+$/.test(filePath)) return 'public, max-age=31536000, immutable'
  return 'public, max-age=3600'
}

function sendError(res, status, message) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    ...SECURITY_HEADERS,
  })
  res.end(`<!DOCTYPE html><html><head><title>${status}</title></head><body><h1>${message}</h1></body></html>`)
}

const server = createServer((req, res) => {
  const ip = req.socket.remoteAddress || 'unknown'
  const start = Date.now()

  if (!checkRateLimit(ip)) {
    sendError(res, 429, 'Too Many Requests')
    return
  }

  let url = req.url.split('?')[0]

  // Prevent path traversal by resolving and verifying the path is within dist
  // Strip leading slash so join treats it as relative (otherwise it becomes absolute)
  const relativePath = url === '/' ? 'index.html' : url.replace(/^\//, '')
  const requestedPath = join(dist, relativePath)
  const resolvedPath = resolve(requestedPath)
  if (!resolvedPath.startsWith(dist + '/')) {
    sendError(res, 403, 'Forbidden')
    return
  }

  let filePath = resolvedPath

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(dist, 'index.html')
  }

  try {
    const content = readFileSync(filePath)
    const etag = generateETag(content)
    const ifNoneMatch = req.headers['accept-encoding']?.includes('gzip')
    const acceptGzip = req.headers['accept-encoding']?.includes('gzip')

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, SECURITY_HEADERS)
      res.end()
      return
    }

    const headers = {
      'Content-Type': getContentType(filePath),
      'Cache-Control': getCacheControl(filePath),
      'ETag': etag,
      ...SECURITY_HEADERS,
    }

    if (acceptGzip && content.length > 1024) {
      headers['Content-Encoding'] = 'gzip'
      res.writeHead(200, headers)
      const gzip = createGzip()
      gzip.pipe(res)
      gzip.end(content)
    } else {
      res.writeHead(200, headers)
      res.end(content)
    }
  } catch (err) {
    sendError(res, 500, 'Internal Server Error')
  }

  const duration = Date.now() - start
  const status = res.statusCode
  console.log(`${ip} ${req.method} ${url} ${status} ${duration}ms`)
})

server.listen(PORT, HOST, () => {
  console.log(`ChronoFlow server running at http://${HOST}:${PORT}`)
  console.log(`Serving static files from ${dist}`)
})
