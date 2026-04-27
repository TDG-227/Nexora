const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── SERVE NEXORA.HTML WITH ENV VARS INJECTED ──
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'nexora.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Inject environment variables as window globals before </head>
  const envScript = `<script>
    window.NEXORA_CLAUDE_KEY = "${process.env.NEXORA_CLAUDE_KEY || ''}";
    window.NEXORA_APOLLO_KEY = "${process.env.APOLLO_API_KEY || 'BPDCD6T8nF6kMv1g99efQw'}";
    window.NEXORA_HUNTER_KEY = "${process.env.HUNTER_API_KEY || 'test-api-key'}";
    window.NEXORA_SUPABASE_URL = "${process.env.NEXORA_SUPABASE_URL || ''}";
    window.NEXORA_SUPABASE_ANON = "${process.env.NEXORA_SUPABASE_ANON || ''}";
  </script>`;

  html = html.replace('</head>', envScript + '\n</head>');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ── APOLLO PROXY ──
app.post('/api/apollo/search', (req, res) => {
  const apiKey = process.env.APOLLO_API_KEY || 'BPDCD6T8nF6kMv1g99efQw';
  const body = { ...req.body };
  delete body.api_key;
  const bodyStr = JSON.stringify(body);
  const options = {
    hostname: 'api.apollo.io', port: 443,
    path: '/v1/mixed_people/search', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey, 'Cache-Control': 'no-cache', 'Content-Length': Buffer.byteLength(bodyStr) }
  };
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.status(proxyRes.statusCode).send(data); });
  });
  proxyReq.on('error', (err) => { res.status(500).json({ error: err.message }); });
  proxyReq.write(bodyStr);
  proxyReq.end();
});

// ── HUNTER.IO PROXY ──
app.get('/api/hunter/domain-search', (req, res) => {
  const apiKey = process.env.HUNTER_API_KEY || 'test-api-key';
  const domain = req.query.domain || '';
  const limit = req.query.limit || 10;
  const department = req.query.department || '';
  let queryPath = '/v2/domain-search?api_key=' + apiKey + '&limit=' + limit;
  if (domain) queryPath += '&domain=' + encodeURIComponent(domain);
  if (department) queryPath += '&department=' + encodeURIComponent(department);
  const options = { hostname: 'api.hunter.io', port: 443, path: queryPath, method: 'GET', headers: { 'Content-Type': 'application/json' } };
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.status(proxyRes.statusCode).send(data); });
  });
  proxyReq.on('error', (err) => { res.status(500).json({ error: err.message }); });
  proxyReq.end();
});

// ── CLAUDE AI PROXY (key stays server-side, never exposed to browser) ──
app.post('/api/claude', (req, res) => {
  const apiKey = process.env.NEXORA_CLAUDE_KEY || '';
  if (!apiKey) { res.status(400).json({ error: 'Claude API key not configured on server' }); return; }
  const bodyStr = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com', port: 443,
    path: '/v1/messages', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(bodyStr) }
  };
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.status(proxyRes.statusCode).send(data); });
  });
  proxyReq.on('error', (err) => { res.status(500).json({ error: err.message }); });
  proxyReq.write(bodyStr);
  proxyReq.end();
});

app.listen(PORT, () => {
  console.log('Nexora running on port ' + PORT);
  console.log('Claude AI: ' + (process.env.NEXORA_CLAUDE_KEY ? 'Connected' : 'Key missing - add NEXORA_CLAUDE_KEY to Railway'));
  console.log('Hunter.io: ' + (process.env.HUNTER_API_KEY ? 'Connected' : 'Using test key'));
});
