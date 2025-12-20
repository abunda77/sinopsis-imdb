# Production Deployment Guide

## CORS Fix for Production

The app uses a Node.js proxy server to handle CORS issues with the Perplexity API in production.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your API credentials:
```bash
cp .env.example .env
# Edit .env and add your API key and model name
```

3. Build the app:
```bash
npm run build
```

This will:
- Compile TypeScript
- Build the Vite app
- Generate `dist/config.js` from your `.env` file (runtime config)

4. Start the production server:
```bash
npm start
```

The server will run on port 3000 (or PORT environment variable).

## Configuration

### Environment Variables

**For Development (.env file):**
```env
VITE_API_KEY=your-perplexity-api-key
VITE_MODEL_NAME=sonar
```

**For Production Server:**
Set these on your hosting platform:
```bash
PORT=3000  # Optional, defaults to 3000
```

### Runtime Configuration

The app uses a hybrid configuration approach:

- **Development**: Reads from `.env` file via Vite's `import.meta.env`
- **Production**: Reads from `dist/config.js` (generated during build)

The `npm run build` command automatically generates `dist/config.js` from your `.env` file, so your API credentials are embedded at build time but can be updated by editing `dist/config.js` without rebuilding.

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
