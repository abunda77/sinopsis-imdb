import express from 'express';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from dist folder
app.use(express.static(join(__dirname, 'dist')));

// Proxy endpoint for Perplexity API
app.post('/api/chat/completions', async (req, res) => {
  try {
    console.log('Proxy request received');
    console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });

    console.log('Perplexity API response status:', response.status);
    
    const data = await response.json();
    
    // Log error responses for debugging
    if (!response.ok) {
      console.error('Perplexity API error:', data);
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message 
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment check:`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`- Serving static files from: ${join(__dirname, 'dist')}`);
  console.log(`- Proxy target: https://api.perplexity.ai/chat/completions`);
});
