# JLPT N2 Practice App 📚

Web-based practice platform for JLPT N2 (Japanese Language Proficiency Test).

## Features

- **語彙 (Vocabulary)** - ~32 questions per chapter
- **文法 (Grammar)** - Grammar practice with reading comprehension
- **読解 (Reading)** - Text-based reading drills with 6 chapters
- **模擬テスト (Mock Test)** - Full simulation mode

### Special Features

- 🌙 **Dark/Light Theme** - Toggle between themes, preference saved
- 📱 **Mobile Responsive** - Optimized for phones and tablets
- 📖 **Furigana Helper** - Select any Japanese text to see reading and meaning (via Jisho API)
- ⏱️ **Timer** - Track your test time
- ✅ **Instant Feedback** - See correct/incorrect answers immediately

## Structure

```
├── index.html          # Main menu
├── test.html           # Test/Study page
├── shiken_dokkai.html  # Reading drill menu
├── app.js              # Main application logic
├── styles.css          # Styling with theme support
└── data/               # Question data files
```

## Usage

1. Open `index.html` in a browser
2. Select chapter and mode
3. Start practicing!

For furigana helper to work properly, run via local server:
```bash
npx serve .
```

## Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- Jisho API for dictionary lookups
- LocalStorage for theme preference

---
Made for JLPT N2 preparation 🇯🇵
