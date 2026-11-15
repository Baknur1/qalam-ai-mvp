/**
 * Модуль резолвинга и граундинга первоисточников для фактчекинга (Qalam AI).
 * 1. Интеграция с Google Search Grounding из Gemini API (прямые URL статей).
 * 2. Мультиязычный резолвинг энциклопедических статей через Wikipedia OpenSearch API (kk/ru/en).
 * 3. Подключение Google Fact Check Tools API (IFCN / Factcheck.kz / Stopfake / Snopes / Reuters).
 * 4. Умная маршрутизация с точечными поисковыми операторами для Казахстана (adilet.zan.kz, stat.gov.kz, gov.kz).
 */

import { FactCheckItem, OutputLanguage } from './types';

export interface GroundingWebChunk {
  uri: string;
  title: string;
}

export interface FactCheckClaimReview {
  publisher: string;
  url: string;
  title?: string;
  textualRating?: string;
}

/**
 * Ищет подходящий URL среди ссылок Google Grounding, возвращенных Gemini
 */
export function findMatchingGroundingChunk(
  factText: string,
  chunks?: GroundingWebChunk[]
): GroundingWebChunk | null {
  if (!chunks || chunks.length === 0 || !factText) return null;

  const cleanFact = factText.toLowerCase().replace(/[^a-z0-9а-яёәіңғүұқөһ]/gi, ' ');
  const factWords = cleanFact.split(/\s+/).filter((w) => w.length > 2);

  for (const chunk of chunks) {
    if (!chunk.uri) continue;
    const chunkTitle = (chunk.title || '').toLowerCase();
    const chunkUri = chunk.uri.toLowerCase();

    for (const w of factWords) {
      if (chunkTitle.includes(w) || chunkUri.includes(w)) {
        return chunk;
      }
    }
  }

  return chunks[0] || null;
}

/**
 * Определяет языковую версию Википедии: kk, ru или en
 */
export function detectQueryLanguage(query: string, preferredLang?: OutputLanguage): 'kk' | 'ru' | 'en' {
  if (preferredLang === 'kz') return 'kk';
  // Специфические казахские буквы
  if (/[әіңғүұқөһ]/i.test(query)) return 'kk';
  // Кириллица (русский / казахский)
  if (/[а-яё]/i.test(query)) {
    return 'ru';
  }
  // Латиница / английский
  return 'en';
}

async function fetchWikipediaOpensearch(
  query: string,
  lang: 'kk' | 'ru' | 'en'
): Promise<{ title: string; url: string } | null> {
  try {
    const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
    const res = await fetch(endpoint, {
      headers: { 'User-Agent': 'QalamAI-FactChecker/1.0' },
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) return null;
    const data = await res.json();
    const title = data[1]?.[0];
    const url = data[3]?.[0];

    if (title && url) {
      return { title, url };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Резолвит гарантированно существующую прямую ссылку через Wikipedia OpenSearch API с учетом языка
 */
export async function resolveWikipediaDirectUrl(
  query: string,
  preferredLang?: OutputLanguage
): Promise<{ title: string; url: string } | null> {
  if (!query || query.trim().length < 2) return null;

  const cleanQuery = query.replace(/[«»"'#]/g, '').trim();
  const primaryLang = detectQueryLanguage(cleanQuery, preferredLang);

  // 1. Попытка на основном определенном языке
  const primaryRes = await fetchWikipediaOpensearch(cleanQuery, primaryLang);
  if (primaryRes) return primaryRes;

  // 2. Фолбэк для казахского -> пробуем русский, если на казахском статьи еще нет
  if (primaryLang === 'kk') {
    const ruRes = await fetchWikipediaOpensearch(cleanQuery, 'ru');
    if (ruRes) return ruRes;
  }

  // 3. Фолбэк для терминов с латиницей -> пробуем английский раздел
  if (primaryLang !== 'en' && /[a-z]/i.test(cleanQuery)) {
    const enRes = await fetchWikipediaOpensearch(cleanQuery, 'en');
    if (enRes) return enRes;
  }

  return null;
}

/**
 * Опрашивает Google Fact Check Tools API для поиска профессиональных вердиктов IFCN
 */
export async function queryGoogleFactCheckTools(
  query: string,
  apiKey?: string
): Promise<FactCheckClaimReview | null> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key || !query || query.trim().length < 3) return null;

  try {
    const cleanQuery = query.replace(/[«»"'#]/g, '').trim();
    const endpoint = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(cleanQuery)}&key=${key}`;

    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(2500)
    });

    if (!res.ok) return null;
    const data = await res.json();
    const claims = data.claims;

    if (Array.isArray(claims) && claims.length > 0) {
      const claim = claims[0];
      const review = claim.claimReview?.[0];
      if (review && review.url) {
        return {
          publisher: review.publisher?.name || 'Fact Check Review',
          url: review.url,
          title: review.title || claim.text,
          textualRating: review.textualRating
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Формирует точечный URL для поиска в базах Казахстана и официальных доменах
 */
export function buildTargetedDomainUrl(
  searchQuery: string,
  sourceDomain?: string,
  factCategory?: string
): string | null {
  const q = encodeURIComponent((searchQuery || '').replace(/[«»"'#]/g, ' ').trim());
  if (!q) return null;

  const domain = (sourceDomain || '').toLowerCase();

  // 1. Законы и нормативные акты РК (Әділет / zan.kz)
  if (factCategory === 'law' || domain.includes('zan.kz') || domain.includes('adilet')) {
    return `https://adilet.zan.kz/rus/search/docs?find=${q}`;
  }

  // 2. Официальная статистика РК (stat.gov.kz)
  if (factCategory === 'stat' || domain.includes('stat.gov.kz')) {
    return `https://stat.gov.kz/ru/search/?q=${q}`;
  }

  // 3. Государственные органы и министерства РК (gov.kz)
  if (domain.includes('gov.kz')) {
    return `https://www.gov.kz/search?q=${q}`;
  }

  // 4. Ведущие казахстанские издания (Tengrinews, Informburo, Zakon.kz)
  if (domain.includes('tengrinews')) {
    return `https://tengrinews.kz/search/?text=${q}`;
  }
  if (domain.includes('informburo')) {
    return `https://informburo.kz/search?q=${q}`;
  }
  if (domain.includes('zakon.kz')) {
    return `https://www.zakon.kz/search?q=${q}`;
  }

  // 5. Любой указанный моделью конкретный домен через Google site:
  if (domain && domain.includes('.')) {
    return `https://www.google.com/search?q=site:${encodeURIComponent(domain)}+${q}`;
  }

  return null;
}

/**
 * Обогащает карточку факта проверенным, авторитетным и прямым первоисточником
 */
export async function enrichFactSource(
  item: FactCheckItem,
  speaker?: string,
  groundingChunks?: GroundingWebChunk[],
  apiKey?: string,
  currentLang?: OutputLanguage
): Promise<FactCheckItem> {
  const currentUrl = item.factCheckInfo?.sourceUrl;
  const sourceName = item.factCheckInfo?.source || 'Источник';
  const highlighted = item.highlightedFact || '';
  const claimed = item.factCheckInfo?.claimed || '';
  const searchQuery = item.searchQuery || highlighted || claimed;

  // 1. Проверяем Gemini Search Grounding chunks (настоящие URL статей от Google Search):
  const matchedChunk = findMatchingGroundingChunk(`${searchQuery} ${highlighted} ${claimed}`, groundingChunks);
  if (matchedChunk && matchedChunk.uri) {
    return {
      ...item,
      factCheckInfo: {
        ...item.factCheckInfo,
        source: matchedChunk.title ? matchedChunk.title.slice(0, 35) : sourceName,
        sourceUrl: matchedChunk.uri
      }
    };
  }

  // 2. Проверяем Google Fact Check Tools API (IFCN база верифицированных проверок):
  const factCheckReview = await queryGoogleFactCheckTools(searchQuery, apiKey);
  if (factCheckReview && factCheckReview.url) {
    return {
      ...item,
      factCheckInfo: {
        ...item.factCheckInfo,
        source: factCheckReview.publisher || 'Fact Check Review',
        sourceUrl: factCheckReview.url,
        verified: factCheckReview.textualRating
          ? `${item.factCheckInfo?.verified || ''} [Вердикт: ${factCheckReview.textualRating}]`.trim()
          : item.factCheckInfo?.verified
      }
    };
  }

  // 3. Если модель уже вернула валидный прямой URL статьи (не поисковик):
  if (
    currentUrl &&
    currentUrl.startsWith('http') &&
    !currentUrl.includes('/search') &&
    !currentUrl.includes('?s=') &&
    !currentUrl.includes('?q=') &&
    !currentUrl.includes('?text=')
  ) {
    return item;
  }

  // 4. Мультиязычная Wikipedia OpenSearch API (kk / ru / en):
  const searchCandidates = [
    searchQuery,
    highlighted.trim(),
    `${highlighted} ${speaker || ''}`.trim(),
    item.factCheckInfo?.title || ''
  ].filter(Boolean);

  for (const cand of searchCandidates) {
    const wiki = await resolveWikipediaDirectUrl(cand, currentLang);
    if (wiki) {
      return {
        ...item,
        factCheckInfo: {
          ...item.factCheckInfo,
          source: sourceName.toLowerCase().includes('wiki') ? 'Wikipedia' : sourceName,
          sourceUrl: wiki.url
        }
      };
    }
  }

  // 5. Точечный поиск по доменам Казахстана и целевым ресурсам с операторами:
  const targetedUrl = buildTargetedDomainUrl(searchQuery, item.sourceDomain, item.factCategory);
  if (targetedUrl) {
    return {
      ...item,
      factCheckInfo: {
        ...item.factCheckInfo,
        source: item.sourceDomain || sourceName,
        sourceUrl: targetedUrl
      }
    };
  }

  return item;
}
