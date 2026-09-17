# Resume & Instruksi Perbaikan LLM Proxy dengan OpenRouter

## 1. Kondisi Saat Ini

Aplikasi menggunakan:

* Node.js
* Express
* Vite
* `server.js` sebagai backend/proxy
* OpenRouter sebagai LLM provider
* Model: `perplexity/sonar`
* Port backend: `3200`

Endpoint backend:

```text
POST /api/chat/completions
```

Target OpenRouter:

```text
https://openrouter.ai/api/v1/chat/completions
```

### Error yang ditemukan

Saat menjalankan:

```bash
npm start
```

server berhasil berjalan:

```text
Server running on port 3200
Proxy target: https://openrouter.ai/api/v1/chat/completions
```

Tetapi request LLM menghasilkan:

```text
LLM API error: {
  status: 401,
  target: 'https://openrouter.ai/api/v1/chat/completions',
  error: {
    error: {
      message: 'Missing Authentication header',
      code: 401
    }
  }
}
```

## 2. Root Cause

`server.js` saat ini menggunakan:

```javascript
'Authorization': req.headers.authorization || ''
```

Artinya backend hanya meneruskan header `Authorization` dari browser/client.

Jika browser tidak mengirim:

```http
Authorization: Bearer <API_KEY>
```

maka backend mengirim request ke OpenRouter tanpa authentication.

Akibatnya OpenRouter mengembalikan:

```text
401 Missing Authentication header
```

## 3. Masalah Keamanan

API key sebelumnya menggunakan variable:

```env
VITE_API_KEY=...
```

Ini tidak ideal untuk secret karena variable dengan prefix `VITE_` dapat tersedia pada frontend/browser bundle.

API key OpenRouter harus disimpan di environment backend dan **tidak boleh dikirim atau diekspos ke browser**.

Gunakan:

```env
OPENROUTER_API_KEY=...
```

dan jangan menggunakan:

```env
VITE_API_KEY=...
```

untuk credential OpenRouter.

---

# 4. Target Arsitektur

Gunakan pola:

```text
Browser
   |
   | POST /api/chat/completions
   | tanpa API key
   v
Node.js / Express
   |
   | Authorization: Bearer <OPENROUTER_API_KEY>
   v
OpenRouter
   |
   v
perplexity/sonar
```

Backend bertanggung jawab terhadap authentication ke OpenRouter.

Frontend hanya berkomunikasi dengan endpoint backend:

```text
/api/chat/completions
```

API key tidak boleh berada di frontend.

---

# 5. `.env` yang Diinginkan

Gunakan konfigurasi berikut:

```env
# ==========================================
# Server
# ==========================================

PORT=3200


# ==========================================
# OpenRouter
# ==========================================

OPENROUTER_API_KEY=sk-or-v1-REPLACE_WITH_REAL_KEY

LLM_API_TARGET=https://openrouter.ai/api/v1/chat/completions

LLM_MODEL_NAME=perplexity/sonar


# ==========================================
# Vite
# ==========================================

VITE_PROXY_TARGET=https://openrouter.ai
```

## Variable yang harus dihapus/tidak digunakan

Jangan gunakan:

```env
VITE_API_KEY=...
```

Jangan gunakan:

```env
VITE_API_BASE_URL=https://openrouter.ai/api/v1/chat/completions
```

Jangan membuat API key tersedia melalui `import.meta.env`.

---

# 6. Perbaikan `server.js`

Saat ini authentication menggunakan:

```javascript
'Authorization': req.headers.authorization || ''
```

Ubah agar server mengambil API key dari environment:

```javascript
const API_KEY = process.env.OPENROUTER_API_KEY;
```

Kemudian request ke OpenRouter harus menggunakan:

```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_KEY}`
}
```

## Implementasi yang disarankan

Gunakan struktur berikut:

```javascript
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

const API_KEY = process.env.OPENROUTER_API_KEY;

const API_TARGET =
  process.env.LLM_API_TARGET ||
  'https://openrouter.ai/api/v1/chat/completions';

const MODEL_NAME =
  process.env.LLM_MODEL_NAME ||
  'perplexity/sonar';

if (!API_KEY) {
  console.error(
    'ERROR: OPENROUTER_API_KEY is not configured in .env'
  );

  process.exit(1);
}

app.use(express.json());


// Serve static frontend
app.use(express.static(join(__dirname, 'dist')));


// LLM Proxy
app.post('/api/chat/completions', async (req, res) => {
  try {

    const requestBody = {
      ...req.body,
      model: req.body.model || MODEL_NAME
    };

    const response = await fetch(API_TARGET, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },

      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('LLM API error:', {
        status: response.status,
        target: API_TARGET,
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


// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(
    join(__dirname, 'dist', 'index.html')
  );
});


app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);
  console.log(`Proxy target: ${API_TARGET}`);
  console.log(`LLM model: ${MODEL_NAME}`);

});
```

---

# 7. Model Handling

Backend harus menggunakan:

```env
LLM_MODEL_NAME=perplexity/sonar
```

Jika request frontend tidak mengirim `model`, backend menggunakan:

```text
perplexity/sonar
```

Contoh request frontend:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}
```

Backend harus mengubahnya menjadi request ke OpenRouter yang setara dengan:

```json
{
  "model": "perplexity/sonar",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}
```

Jika frontend mengirim `model`, backend boleh menggunakan model tersebut sesuai kebutuhan aplikasi.

---

# 8. Frontend

Frontend **tidak boleh mengirim API key**.

Jangan menggunakan:

```javascript
Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`
```

Frontend cukup melakukan:

```javascript
fetch('/api/chat/completions', {
  method: 'POST',

  headers: {
    'Content-Type': 'application/json'
  },

  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Hello'
      }
    ]
  })
});
```

Dengan demikian API key tetap berada di server.

---

# 9. Vite Proxy

Periksa `vite.config.ts`.

Jika proxy digunakan untuk development, konfigurasi harus diarahkan ke backend aplikasi, bukan mengekspos API key.

Contoh konsep:

```text
Browser
   |
   | /api/chat/completions
   v
Vite development server
   |
   v
Node.js :3200
   |
   v
OpenRouter
```

`VITE_PROXY_TARGET` hanya digunakan jika memang dibutuhkan oleh konfigurasi Vite.

Jangan membuat frontend melakukan request langsung ke:

```text
https://openrouter.ai/api/v1/chat/completions
```

untuk production apabila tujuannya menjaga API key tetap private.

---

# 10. Validasi Environment

Setelah `.env` diperbaiki, jalankan:

```bash
node -e "require('dotenv').config(); console.log('KEY:', process.env.OPENROUTER_API_KEY ? 'TERBACA' : 'KOSONG'); console.log('TARGET:', process.env.LLM_API_TARGET); console.log('MODEL:', process.env.LLM_MODEL_NAME)"
```

Output yang diharapkan:

```text
KEY: TERBACA
TARGET: https://openrouter.ai/api/v1/chat/completions
MODEL: perplexity/sonar
```

Jangan mencetak nilai API key sebenarnya ke terminal atau log.

---

# 11. Testing Backend

Setelah server berjalan:

```bash
npm start
```

Lakukan test langsung dari server:

```bash
curl -X POST http://127.0.0.1:3200/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Say hello in Indonesian"
      }
    ]
  }'
```

Perhatikan bahwa curl **tidak perlu mengirim API key**.

Backend harus mengambil API key dari:

```env
OPENROUTER_API_KEY
```

dan menambahkan:

```http
Authorization: Bearer <OPENROUTER_API_KEY>
```

ketika melakukan request ke OpenRouter.

---

# 12. Expected Result

Jika konfigurasi benar, request:

```text
POST http://127.0.0.1:3200/api/chat/completions
```

harus diteruskan menjadi:

```text
POST https://openrouter.ai/api/v1/chat/completions
```

dengan header:

```http
Content-Type: application/json
Authorization: Bearer sk-or-v1-...
```

dan body minimal:

```json
{
  "model": "perplexity/sonar",
  "messages": [
    {
      "role": "user",
      "content": "Say hello in Indonesian"
    }
  ]
}
```

Response dari OpenRouter harus diteruskan kembali oleh Express kepada client.

---

# 13. Error Handling

Backend harus tetap menangani:

### API key tidak tersedia

```text
OPENROUTER_API_KEY is not configured
```

Server sebaiknya tidak dijalankan jika credential wajib tidak tersedia.

### OpenRouter 401

Log:

```text
status: 401
```

tetapi **jangan pernah mencetak API key ke log**.

### OpenRouter 4xx/5xx

Response status dari OpenRouter diteruskan ke client:

```javascript
res.status(response.status).json(data);
```

### Network/API failure

Gunakan:

```javascript
res.status(500).json({
  error: 'Proxy request failed',
  message: error.message
});
```

---

# 14. Security Requirements

Agent coding **WAJIB** memastikan:

* API key tidak berada di source code.
* API key tidak menggunakan `VITE_*`.
* API key tidak dikirim ke browser.
* API key tidak dicetak dalam log.
* API key hanya dibaca melalui `process.env.OPENROUTER_API_KEY`.
* `.env` tidak masuk Git.
* Pastikan `.env` terdapat dalam `.gitignore`.

Tambahkan jika belum ada:

```gitignore
.env
.env.*
!.env.example
```

`env.example` boleh berisi placeholder:

```env
PORT=3200
OPENROUTER_API_KEY=
LLM_API_TARGET=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL_NAME=perplexity/sonar
VITE_PROXY_TARGET=https://openrouter.ai
```

Jangan pernah memasukkan API key asli ke `.env.example`.

---

# 15. Acceptance Criteria

Perubahan dianggap selesai jika seluruh kondisi berikut terpenuhi:

* [ ] `npm start` menjalankan server pada port `3200`.
* [ ] Server membaca `OPENROUTER_API_KEY` dari `.env`.
* [ ] Server gagal start dengan pesan jelas jika API key tidak tersedia.
* [ ] Endpoint `/api/chat/completions` tetap tersedia.
* [ ] Backend mengirim `Authorization: Bearer <API_KEY>` ke OpenRouter.
* [ ] Frontend tidak perlu mengirim API key.
* [ ] `VITE_API_KEY` tidak lagi digunakan.
* [ ] Model default adalah `perplexity/sonar`.
* [ ] Target API adalah `https://openrouter.ai/api/v1/chat/completions`.
* [ ] Request melalui curl tanpa API key berhasil mendapatkan response dari OpenRouter.
* [ ] API key tidak muncul di console/log.
* [ ] `.env` tidak ter-commit ke Git.
* [ ] Tidak ada duplikasi `/chat/completions/chat/completions`.
* [ ] Error response dari OpenRouter tetap diteruskan dengan status HTTP yang sesuai.

---

# 16. Catatan untuk Coding Agent

Jangan hanya mengubah `.env`.

Periksa seluruh source code untuk menemukan referensi:

```text
VITE_API_KEY
VITE_API_BASE_URL
VITE_MODEL_NAME
LLM_API_TARGET
LLM_MODEL_NAME
VITE_PROXY_TARGET
req.headers.authorization
```

Pastikan perubahan pada environment variable konsisten dengan seluruh kode.

Cari juga semua pemanggilan:

```text
/api/chat/completions
```

dan:

```text
/chat/completions
```

untuk memastikan tidak terjadi penggabungan URL seperti:

```text
https://openrouter.ai/api/v1/chat/completions/chat/completions
```

Jangan mengubah arsitektur aplikasi di luar kebutuhan perbaikan ini.

Prioritas utama:

```text
Security
    ↓
Correct OpenRouter authentication
    ↓
Correct API endpoint
    ↓
Correct model handling
    ↓
Frontend compatibility
    ↓
Error handling
```

Setelah implementasi, lakukan test end-to-end dan laporkan file yang diubah serta hasil test.

