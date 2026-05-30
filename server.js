require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Schema
const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  clicks: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Url = mongoose.model('Url', urlSchema);

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

// Rota para encurtar URL
app.post('/api/encurtar', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL é obrigatória' });
    
    let existingUrl = await Url.findOne({ originalUrl: url });
    if (existingUrl) {
      return res.json({
        originalUrl: existingUrl.originalUrl,
        shortUrl: `http://localhost:5000/${existingUrl.shortCode}`,
        shortCode: existingUrl.shortCode
      });
    }
    
    const shortCode = generateShortCode();
    const newUrl = new Url({ originalUrl: url, shortCode });
    await newUrl.save();
    
    res.json({
      originalUrl: url,
      shortUrl: `http://localhost:5000/${shortCode}`,
      shortCode: shortCode
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao encurtar URL' });
  }
});

// ROTA PARA LISTAR URLs - ADICIONADA
app.get('/api/urls', async (req, res) => {
  try {
    const urls = await Url.find().sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar URLs' });
  }
});

// ROTA PARA ESTATÍSTICAS - ADICIONADA
app.get('/api/stats', async (req, res) => {
  try {
    const urls = await Url.find().sort({ clicks: -1 });
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
    res.json({ totalUrls: urls.length, totalClicks, urls });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

app.get('/api/stats/:shortCode', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });
    if (!url) return res.status(404).json({ error: 'URL não encontrada' });
    res.json(url);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/:shortCode', async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });
    if (url) {
      url.clicks++;
      await url.save();
      return res.redirect(url.originalUrl);
    }
    res.status(404).json({ error: 'URL não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/api/teste', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
      console.log(`📋 Lista: http://localhost:${PORT}/api/urls`);
    });
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  });