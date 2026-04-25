const express = require('express');
const https = require('https');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'nexora.html')); });
app.post('/api/apollo/search', (req, res) => { const apiKey = process.env.APOLLO_API_KEY || 'BPDCD6T8nF6kMv1g99efQw'; const body = { ...req.body, api_key: apiKey }; const bodyStr = JSON.stringify(body); const options = { hostname: 'api.apollo.io', port: 443, path: '/v1/mixed_people/search', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr) } }; const proxyReq = https.request(options, (proxyRes) => { let data = ''; proxyRes.on('data', chunk => data += chunk); proxyRes.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.status(proxyRes.statusCode).send(data); }); }); proxyReq.on('error', (err) => { res.status(500).json({ error: err.message }); }); proxyReq.write(bodyStr); proxyReq.end(); });
app.listen(PORT, () => { console.log('Nexora running on port ' + PORT); });