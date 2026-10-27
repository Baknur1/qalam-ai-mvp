import { MultilingualOutputs, VerificationFlag } from './types';

const SYSTEM_PROMPT = `Ты — опытный выпускающий редактор казахстанского независимого цифрового издания.
Твоя задача — обработать предоставленный транскрипт интервью или события (на русском, казахском или смешанном языке).

Правила:
1. Сохраняй тон, контекст и фактуру первоисточника. Категорически запрещено выдумывать факты.
2. Найди все сомнительные утверждения, цифры (особенно в тенге), имена, должности, госорганы РК и даты, требующие фактчекинга, и вынеси их в массив "flags".
    - type может быть: 'claim' (громкие/сомнительные утверждения), 'entity' (имена, должности, ведомства), 'number' (суммы, даты, проценты), 'quote' (цитата).
3. Создай версии на русском, казахском и английском языках:
   - web_article: профессиональный публицистический стиль, заголовок (##), лид, тело статьи с подзаголовками (###), цитаты спикера (>). Без шаблонных штампов ("В заключение хочется сказать...").
   - telegram_post: динамичный стиль новостных каналов Казахстана (как BES.media / KazTAG / Власть), сильный хук (⚡️), 3-4 емких буллета, блок для ссылки.
   - social_script: сценарий для Instagram Reels / TikTok или карусели на 5 слайдов с таймкодами (0-3 сек хук, суть, проверка фактов, CTA).
4. Перевод на казахский и английский языки должен соответствовать нормам качественной журналистики.

СТРОГО верни валидный JSON без markdown-оберток (без \`\`\`json ... \`\`\`):
{
  "title": "Краткий емкий заголовок темы",
  "flags": [
    {
      "id": "flag_1",
      "text": "500 млн тенге",
      "type": "number",
      "timestamp": "00:15",
      "reason": "Требуется сверка с паспортом бюджетной программы",
      "suggestedCorrection": "Уточнить подпрограмму финансирования",
      "verified": false
    }
  ],
  "outputs": {
    "ru": {
      "web_article": "...",
      "telegram_post": "...",
      "social_script": "..."
    },
    "kz": {
      "web_article": "...",
      "telegram_post": "...",
      "social_script": "..."
    },
    "en": {
      "web_article": "...",
      "telegram_post": "...",
      "social_script": "..."
    }
  }
}`;

export interface GeminiProcessResponse {
  title: string;
  flags: VerificationFlag[];
  outputs: MultilingualOutputs;
}

export async function processWithGemini(
  transcriptText: string,
  apiKey?: string
): Promise<GeminiProcessResponse> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `\n\nВот транскрипт источника для обработки:\n${transcriptText}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    // Fallback to gemini-1.5-flash if 2.5-flash is not available for this key
    const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const fallbackRes = await fetch(fallbackEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!fallbackRes.ok) {
      throw new Error(`Gemini API error: ${res.status} ${errorText}`);
    }
    const fallbackData = await fallbackRes.json();
    const rawContent = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(rawContent);
  }

  const data = await res.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) {
    throw new Error('Empty response from Gemini API');
  }

  // Clean JSON response if model wrapped in code blocks
  const cleaned = rawContent.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned) as GeminiProcessResponse;
  const defaultPlatformOutputs = {
    web_article: '',
    telegram_post: '',
    social_script: ''
  };
  if (!parsed.outputs) {
    parsed.outputs = {
      ru: { ...defaultPlatformOutputs },
      kz: { ...defaultPlatformOutputs },
      en: { ...defaultPlatformOutputs }
    };
  }
  if (!parsed.outputs.en) {
    parsed.outputs.en = parsed.outputs.ru || parsed.outputs.kz || { ...defaultPlatformOutputs };
  }
  return parsed;
}
