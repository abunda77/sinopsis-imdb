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

// Proxy endpoint for LLM API (supports multiple providers)
app.post('/api/chat/completions', async (req, res) => {
  try {
    // Determine target API based on environment or default to Perplexity
    const apiTarget = process.env.LLM_API_TARGET || 'https://api.perplexity.ai/chat/completions';
    
    const response = await fetch(apiTarget, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // Log error responses for debugging
    if (!response.ok) {
      console.error('LLM API error:', {
        status: response.status,
        target: apiTarget,
        error: data
      });
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
  const apiTarget = process.env.LLM_API_TARGET || 'https://api.perplexity.ai/chat/completions';
  console.log(`Server running on port ${PORT}`);
  console.log(`Proxy target: ${apiTarget}`);
});
