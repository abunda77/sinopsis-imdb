#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load .env file
config();

const configContent = `// Runtime configuration - Auto-generated from .env
// This file is loaded before the app starts and provides runtime config
window.__APP_CONFIG__ = {
  apiKey: '${process.env.VITE_API_KEY || ''}',
  modelName: '${process.env.VITE_MODEL_NAME || ''}'
};
`;

// Write to dist/config.js (after build)
writeFileSync('dist/config.js', configContent);
console.log('✓ Generated dist/config.js from .env');
