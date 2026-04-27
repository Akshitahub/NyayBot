# NyayBot V2 — Bias Intelligence Engine

## Setup

### 1. Install
```
npm install
```

### 2. Create `.env` file
```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```
Get key: https://aistudio.google.com/app/apikey

### 3. Run
```
npm start
```

---

## Deploy to Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Public dir: build | SPA: yes | Overwrite: no
npm run build
firebase deploy
```

---

## Features
- 🏢 Organization path: CSV upload → bias audit → BIR PDF report
- 🧑‍💼 Individual path: Rejection analysis → legal rights → govt schemes → complaint letter
- 🇮🇳 India-specific: Caste, religion, pincode bias detection
- 🌐 Hindi + English
- 📊 Real statistical disparity ratios (not AI guessing)
- ✦ Gemini AI interpretation + fix recommendations
