const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;

function getLocalIp() {
  const nets = os.networkInterfaces();
  // Ưu tiên Wi-Fi
  for (const name of Object.keys(nets)) {
    if (/wi-?fi/i.test(name)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) return net.address;
      }
    }
  }
  // Các card mạng IPv4 khác (bỏ qua hotspot ảo 192.168.137)
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('192.168.137.')) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

// Active SSE client connections
const sseClients = new Set();

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 1. API: Server Info (Trả về IP Wi-Fi LAN để tạo mã QR chuẩn cho điện thoại)
  if (parsedUrl.pathname === '/api/info') {
    const currentIp = getLocalIp();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ localIp: currentIp, port: PORT }));
    return;
  }

  // 2. API: Server-Sent Events (SSE Realtime Relay cho Máy chiếu & Điện thoại)
  if (parsedUrl.pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write(': keep-alive\n\n');

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 3. API: Post Message (Phát lại tức thời cho tất cả các thiết bị kết nối)
  if (parsedUrl.pathname === '/api/message' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        const dataStr = `data: ${JSON.stringify(msg)}\n\n`;
        for (const client of sseClients) {
          try {
            client.write(dataStr);
          } catch (e) {}
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }

  // 4. Phục vụ Static Files (index.html, ảnh, font...)
  let safePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 HCM202 Cyber Matrix Relay Server Started!`);
  console.log(`🖥️  Host (Máy chiếu trên laptop): http://localhost:${PORT}`);
  console.log(`📱 Thí sinh (Điện thoại quét QR): http://${localIp}:${PORT}`);
  console.log(`====================================================`);
});
