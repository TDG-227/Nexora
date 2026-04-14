const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'nexora.html'));
});

app.listen(PORT, () => {
  console.log(`Nexora running on port ${PORT}`);
});
