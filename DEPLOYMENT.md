# Production Deployment Guide

## CORS Fix for Production

The app uses a Node.js proxy server to handle CORS issues with the Perplexity API in production.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the app:
```bash
npm run build
```

3. Set environment variables on your server:
```bash
VITE_API_KEY=your-perplexity-api-key
VITE_MODEL_NAME=sonar
VITE_API_BASE_URL=https://api.perplexity.ai/chat/completions
PORT=3000
```

4. Start the production server:
```bash
npm start
```

## How It Works

- **Development**: Vite's dev proxy handles `/api` requests
- **Production**: Express server (`server.js`) proxies `/api` requests to Perplexity API
- The frontend always calls `/api/chat/completions` (relative path)
- No CORS issues because the proxy server makes the actual API calls

## Deployment Options

### Option 1: Node.js Server (Recommended)
Deploy `server.js` with your built `dist` folder to any Node.js hosting:
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

### Option 2: Serverless Functions
Convert the proxy to serverless functions:
- Vercel (create `api/chat/completions.js`)
- Netlify Functions
- AWS Lambda

### Option 3: Nginx Reverse Proxy
Use Nginx to proxy API requests if you prefer not to use Node.js in production.

## Environment Variables

Make sure these are set in your production environment:
- `VITE_API_KEY` - Your Perplexity API key
- `VITE_MODEL_NAME` - Model name (e.g., "sonar")
- `PORT` - Server port (default: 3000)
