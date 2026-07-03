const { createServer } = require('http');
const { readFileSync, existsSync } = require('fs');
const { join, extname } = require('path');
const MIME = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const dist = join(__dirname, 'dist');
createServer((req, res) => {
  let url = req.url.split('?')[0];
  let file = join(dist, url === '/' ? 'index.html' : url);
  if (!existsSync(file)) file = join(dist, 'index.html');
  res.setHeader('Content-Type', MIME[extname(file)] || 'text/plain');
  res.end(readFileSync(file));
}).listen(5173, '0.0.0.0', () => console.log('Running at http://localhost:5173'));
