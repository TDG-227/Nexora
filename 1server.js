const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the main nexora.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'nexora.html'));
});

// ── APOLLO PROXY ──
// Routes Apollo API calls server-side to avoid browser CORS restrictions
app.post('/api/apollo/search', (req, res) => {
  const apiKey = process.env.APOLLO_API_KEY || req.headers['x-apollo-key'] || 'BPDCD6T8nF6kMv1g99efQw';
  
  const body = {
    ...req.body,
    api_key: apiKey
  };

  const bodyStr = JSON.stringify(body);

  const options = {
    hostname: 'api.apollo.io',
    port: 443,
    path: '/v1/mixed_people/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(bodyStr)
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Apollo proxy error:', err);
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  });

  proxyReq.write(bodyStr);
  proxyReq.end();
});

// ── APOLLO PEOPLE ENRICH PROXY ──
app.post('/api/apollo/enrich', (req, res) => {
  const apiKey = process.env.APOLLO_API_KEY || 'BPDCD6T8nF6kMv1g99efQw';
  
  const body = { ...req.body, api_key: apiKey };
  const bodyStr = JSON.stringify(body);

  const options = {
    hostname: 'api.apollo.io',
    port: 443,
    path: '/v1/people/match',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(bodyStr)
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });

  proxyReq.write(bodyStr);
  proxyReq.end();
});

app.listen(PORT, () => {
  console.log(`Nexora server running on port ${PORT}`);
});
