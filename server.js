const express = require('express');
const https = require('https');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'nexora.html'));
});

// Apollo proxy
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

// Hunter.io proxy - Domain Search
app.get('/api/hunter/domain-search', (req, res) => {
  const apiKey = process.env.HUNTER_API_KEY || 'test-api-key';
  const domain = req.query.domain || '';
  const company = req.query.company || '';
  const limit = req.query.limit || 10;
  const department = req.query.department || '';
  let path = '/v2/domain-search?api_key=' + apiKey + '&limit=' + limit;
  if (domain) path += '&domain=' + encodeURIComponent(domain);
  if (company) path += '&company=' + encodeURIComponent(company);
  if (department) path += '&department=' + encodeURIComponent(department);

  const options = { hostname: 'api.hunter.io', port: 443, path: path, method: 'GET', headers: { 'Content-Type': 'application/json' } };
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.status(proxyRes.statusCode).send(data); });
  });
  proxyReq.on('error', (err) => { res.status(500).json({ error: err.message }); });
  proxyReq.end();
});

// Hunter.io proxy - Company Search (Discover)
app.get('/api/hunter/discover', (req, res) => {
  const apiKey = process.env.HUNTER_API_KEY || 'test-api-key';
  const industry = req.query.industry || '';
  const country = req.query.country || '';
  const limit = req.query.limit || 10;
  let path = '/v2/discover?api_key=' + apiKey + '&limit=' + limit;
  if (industry) path += '&industry=' + encodeURIComponent(industry);
  if (country) path += '&country=' + encodeURIComponent(country);

  const options = { hostname: 'api.hunter.io', port: 443, path: path, method: 'GET', headers: { 'Content-Type': 'application/json' } };
  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.status(proxyRes.statusCode).send(data); });
  });
  proxyReq.on('error', (err) => { res.status(500).json({ error: err.message }); });
  proxyReq.end();
});

app.listen(PORT, () => { console.log('Nexora running on port ' + PORT); });