# Qalam AI — Мультимодальный ИИ-ассистент редакции и фактчекинга

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Groq Whisper](https://img.shields.io/badge/Groq-Whisper--v3-f55036?style=flat)](https://groq.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini--Flash-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![Vercel Blob](https://img.shields.io/badge/Storage-Vercel--Blob-000?style=flat&logo=vercel)](https://vercel.com/storage/blob)

**Qalam AI** — это высокопроизводительный AI-воркспейс для современных медиа и новостных редакций. Система трансформирует сырые аудио- и видеозаписи (интервью, пресс-релизы, брифинги, подкасты) в проверенные публикации, адаптированные под веб-статьи, Telegram-каналы и короткие видеосценарии (Reels / TikTok / Shorts) с автоматическим трёхъязычным фактчекингом (KZ / RU / EN).

---

## ⚡ Ключевые возможности

### 1. Сверхбыстрая обработка медиа и транскрибация
- **Двухконтурный пайплайн STT:**
  - Файлы аудио/видео до 25 МБ обрабатываются за 2–4 секунды через **Groq Whisper Large v3**.
  - Тяжёлые файлы (> 25 МБ) загружаются напрямую в облачное хранилище **Vercel Blob** в обход 4.5 МБ лимита serverless-функций.
  - Поддержка форматов: `MP3`, `WAV`, `M4A`, `MP4`, `WEBM`, `MOV`, `OGG`.
- Интеллектуальная сегментация по спикерам с таймкодами.

### 2. Автоматизированный фактчекинг и риск-валидация
- Детекция сомнительных утверждений, числовых аномалий, цитат и юридических рисков в режиме реального времени.
- **Интеграция с авторитетными источниками (Source Grounding):**
  - Подтверждение данных через Google Fact Check Tools API (IFCN / Factcheck.kz / Stopfake / Snopes / Reuters).
  - Прямой поиск энциклопедических определений через Wikipedia OpenSearch API на казахском, русском и английском языках.
- Цветовая индикация рисков (Критический, Средний, Низкий) с контекстными подсказками для редактора.

### 3. Редакционный WYSIWYG-воркспейс (Tiptap)
- Полнофункциональный богатый текстовый редактор с поддержкой Markdown, таблиц, форматирования заголовков и цитат.
- Интерактивная подсветка проверенных фактов прямо в тексте черновика с переходом к карточке первоисточника.
- Защита от потери фокуса и прыжков курсора при фоновом автосохранении (`useEditor` + custom ProseMirror plugins).

### 4. Мультиплатформенный экспорт в 1 клик
- **Лонгрид / Веб-статья:** глубокий структурированный аналитический материал.
- **Telegram-пост:** готовый пост с заголовком, тезисами, эмодзи и разметкой.
- **Сценарий Reels / TikTok / Shorts:** посекундная раскадровка (Hook, Core, Fact-check, Climax, CTA) с текстом на экране и закадровым голосом.

### 5. Трёхъязычная адаптация (KZ / RU / EN)
- Мгновенная адаптация редакционного пакета на казахский и английский язык.
- Автоматический перевод метаданных фактчека и таблиц.

---

## 🛠 Технологический стек

- **Фреймворк:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions, Serverless Streaming)
- **UI & Стилизация:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer-motion.dev/), Lucide Icons
- **Текстовый движок:** [Tiptap](https://tiptap.dev/) (ProseMirror, Tiptap Markdown, Extension Table, Highlight, Text-Align)
- **Нейросети и AI:**
  - **Google Gemini API** (`gemini-3.5-flash-lite`, `gemini-2.5-flash`, `gemini-3.8-flash`) — структурированный анализ, редполитика, мультиязычный перевод.
  - **Groq API** (`whisper-large-v3`) — сверхбыстрый Speech-to-Text.
- **Облачное хранилище:** `@vercel/blob` — прямые клиентские загрузки до 500 МБ.
- **Потоковая передача данных:** Server-Sent Events (SSE) с отдачей черновика чанками в реальном времени.

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория
---

## ⚡ Ключевые возможности

### 1. Сверхбыстрая обработка медиа и транскрибация
- **Двухконтурный пайплайн STT:**
  - Файлы аудио/видео до 25 МБ обрабатываются за 2–4 секунды через **Groq Whisper Large v3**.
  - Тяжёлые файлы (> 25 МБ) загружаются напрямую в облачное хранилище **Vercel Blob** в обход 4.5 МБ лимита serverless-функций.
  - Поддержка форматов: `MP3`, `WAV`, `M4A`, `MP4`, `WEBM`, `MOV`, `OGG`.
- Интеллектуальная сегментация по спикерам с таймкодами.

### 2. Автоматизированный фактчекинг и риск-валидация
- Детекция сомнительных утверждений, числовых аномалий, цитат и юридических рисков в режиме реального времени.
- **Интеграция с авторитетными источниками (Source Grounding):**
  - Подтверждение данных через Google Fact Check Tools API (IFCN / Factcheck.kz / Stopfake / Snopes / Reuters).
  - Прямой поиск энциклопедических определений через Wikipedia OpenSearch API на казахском, русском и английском языках.
  - Поиск нормативных актов и статистики РК (`adilet.zan.kz`, `stat.gov.kz`, `gov.kz`).
- Цветовая индикация рисков (Критический, Средний, Низкий) с контекстными подсказками для редактора.

### 3. Редакционный WYSIWYG-воркспейс (Tiptap)
- Полнофункциональный богатый текстовый редактор с поддержкой Markdown, таблиц, форматирования заголовков и цитат.
- Интерактивная подсветка проверенных фактов прямо в тексте черновика с переходом к карточке первоисточника.
- Защита от потери фокуса и прыжков курсора при фоновом автосохранении (`useEditor` + custom ProseMirror plugins).

### 4. Мультиплатформенный экспорт в 1 клик
- **Лонгрид / Веб-статья:** глубокий структурированный аналитический материал.
- **Telegram-пост:** готовый пост с заголовком, тезисами, эмодзи и разметкой.
- **Сценарий Reels / TikTok / Shorts:** посекундная раскадровка (Hook, Core, Fact-check, Climax, CTA) с текстом на экране и закадровым голосом.

### 5. Трёхъязычная адаптация (KZ / RU / EN)
- Мгновенная адаптация редакционного пакета на казахский (публицистический стиль ведущих изданий: *Азаттык*, *Baribar*, *Masa.media*) и английский язык (*Reuters / AP style*).
- Автоматический перевод метаданных фактчека и таблиц.

---

## 🛠 Технологический стек

- **Фреймворк:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions, Serverless Streaming)
- **UI & Стилизация:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer-motion.dev/), Lucide Icons
- **Текстовый движок:** [Tiptap](https://tiptap.dev/) (ProseMirror, Tiptap Markdown, Extension Table, Highlight, Text-Align)
- **Нейросети и AI:**
  - **Google Gemini API** (`gemini-3.5-flash-lite`, `gemini-2.5-flash`, `gemini-3.8-flash`) — структурированный анализ, редполитика, мультиязычный перевод.
  - **Groq API** (`whisper-large-v3`) — сверхбыстрый Speech-to-Text.
- **Облачное хранилище:** `@vercel/blob` — прямые клиентские загрузки до 500 МБ.
- **Потоковая передача данных:** Server-Sent Events (SSE) с отдачей черновика чанками в реальном времени.

---

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/Baknur1/qalam-ai-mvp.git
cd qalam-ai-mvp
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
Создайте файл `.env.local` в корне проекта (на основе `.env.example`):

```env
# Groq API Key (для мгновенного распознавания речи Whisper-v3)
# Получить бесплатно: https://console.groq.com/keys
GROQ_API_KEY=ваш_groq_api_ключ

# Google Gemini API Key (для генерации, фактчека и адаптации)
# Получить бесплатно: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=ваш_gemini_api_ключ

# Vercel Blob Token (для загрузки тяжелых медиафайлов до 500 МБ)
# Подключается автоматически в дашборде Vercel при создании Blob Store:
BLOB_READ_WRITE_TOKEN=ваш_vercel_blob_токен
```

> **Примечание:** Если API-ключи не указаны, приложение автоматически переключается в **демонстрационный режим (Demo Simulation)** с готовым кейсом правительственного брифинга, позволяя протестировать весь интерфейс без ключей.

### 4. Запуск локального сервера
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## 📦 Сборка для продакшна

```bash
npm run build
npm run start
```

---

## 🏛 Архитектура проекта

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── blob/upload/      # Авторизация клиентской загрузки Vercel Blob
│   │   │   ├── process/          # SSE-стриминг: Groq STT -> Gemini анализ -> Fact enrichment
│   │   │   ├── translate/        # Фоновая локализация пакета (KZ / EN)
│   │   │   └── upload/           # Серверная предзагрузка и кэширование файлов
│   │   ├── page.tsx              # Главный контейнер приложения и стейт пайплайна
│   │   └── layout.tsx            # Глобальный лейаут и подключение шрифтов
│   ├── components/
│   │   ├── hero-upload.tsx       # Дропзона загрузки аудио/видео с автокомпрессией
│   │   ├── lead-draft-section.tsx# Редактор Tiptap, интерактивная разметка фактов
│   │   ├── fact-checking-section.tsx # Инспекция фактов, вердикты, ссылки на источники
│   │   ├── multi-platform-export.tsx # Генератор адаптаций: Web, Telegram, Reels
│   │   └── editor-toolbar.tsx    # Панель форматирования текста
│   └── lib/
│       ├── gemini.ts             # Клиент Google Gemini SDK, фолбэки, стриминг
│       ├── groq.ts               # Клиент Groq Whisper API
│       ├── source-grounding.ts   # Резолвинг источников: Google FactCheck API, Wikipedia
│       ├── audio-extractor.ts    # Web Audio API компрессия в браузере
│       └── prompts.ts            # Системные инструкции редполитики и фактчекинга
```

---

## 📄 Лицензия

Проект разработан в рамках открытого портфолио. Свободен для использования в соответствии с [MIT License](LICENSE).
