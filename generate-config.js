#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { config } from 'dotenv';

// Load .env file
config();

console.log('Generating config.js...');
console.log('VITE_API_KEY:', process.env.VITE_API_KEY ? 'Present' : 'Missing');
console.log('VITE_MODEL_NAME:', process.env.VITE_MODEL_NAME || 'Missing');

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
console.log('Content preview:', configContent.substring(0, 200) + '...');

