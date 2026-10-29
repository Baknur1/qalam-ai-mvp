import { OutputLanguage } from './types';

export interface TranslationStrings {
  header: {
    exitDemo: string;
    demoMode: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    subtitle: string;
    tabFile: string;
    tabText: string;
    dropPrompt: string;
    dropFormats: string;
    chooseFile: string;
    textPlaceholder: string;
    processText: string;
    processing: string;
    feature1Title: string;
    feature1Desc: string;
    feature1Tags: string[];
    feature1Bullets: string[];
    feature2Title: string;
    feature2Desc: string;
    feature2Tags: string[];
    feature2Bullets: string[];
    feature3Title: string;
    feature3Desc: string;
    feature3Tags: string[];
    feature3Bullets: string[];
    feature4Title: string;
    feature4Desc: string;
    feature4Tags: string[];
    feature4Bullets: string[];
  };
  activeFile: {
    tabFile: string;
    tabText: string;
    logs: [string, string, string, string];
  };
  factChecking: {
    title: string;
    verifiedLabel: string;
    verifiedOf: (count: number, total: number) => string;
    listenAudioTitle: string;
    declineBtn: string;
    approveBtn: string;
    fixedBtn: string;
    claimedLabel: string;
    verifiedAuditLabel: string;
    sourceLabel: string;
    modalTitle: string;
    modalOpt1Title: string;
    modalOpt1Desc: string;
    modalOpt2Title: string;
    modalOpt2Desc: string;
    modalOpt3Title: string;
    modalOpt3Desc: string;
    modalOpt4Title: string;
    modalOpt4Desc: string;
    modalCancel: string;
  };
  leadDraft: {
    title: string;
    editBtn: string;
    previewBtn: string;
    editTooltip: string;
    previewTooltip: string;
    rawMarkdownTooltip: string;
    rawPlaceholder: string;
  };
  exportSection: {
    title: string;
    tabPost: string;
    tabTelegram: string;
    tabScenario: string;
    copy: string;
    copied: string;
  };
}

export const TRANSLATIONS: Record<OutputLanguage, TranslationStrings> = {
  ru: {
    header: {
      exitDemo: 'Выйти из демо',
      demoMode: 'Демо режим'
    },
    hero: {
      titleLine1: 'От аудиозаписи до',
      titleLine2: 'проверенного материала',
      titleLine3: 'за считанные минуты.',
      subtitle: 'Билингвальная расшифровка интервью, проверка рисков фактов и генерация черновиков под полным контролем редакции.',
      tabFile: 'Файл',
      tabText: 'Текст',
      dropPrompt: 'Перетащите аудиофайл сюда или нажмите для выбора',
      dropFormats: 'Поддерживаются форматы MP3, WAV, M4A и MP4 до 25 МБ (казахский/русский языки).',
      chooseFile: 'Выбрать файл',
      textPlaceholder: 'Вставьте исходный текст интервью, расшифровку аудио или пресс-релиз...',
      processText: 'Обработать текст',
      processing: 'Обработка...',
      feature1Title: 'Аудио в текст',
      feature1Desc: 'Билингвальная транскрибация речи (KZ/RU) с таймкодами и разделением спикеров.',
      feature1Tags: ['KZ / RU', 'Таймкоды', 'Спикеры'],
      feature1Bullets: [
        'Распознавание сложных региональных терминов и имен',
        'Интерактивная привязка аудио к тексту',
        'Экспорт полной стенограммы'
      ],
      feature2Title: 'Фактчекинг',
      feature2Desc: 'Автоматическая проверка цифр, фактов и цитат с валидацией рисков перед печатью.',
      feature2Tags: ['Сверка цифр', 'Аудит цитат', 'Quick Fix'],
      feature2Bullets: [
        'Сравнение с госреестрами и бюджетными росписями',
        'Подсветка расхождений в 1 клик',
        '4 сценария исправления (AI, сноска, удаление)'
      ],
      feature3Title: 'Черновик статьи',
      feature3Desc: 'Генерация готового журналистского черновика под полным контролем редактора.',
      feature3Tags: ['WYSIWYG', 'Редактура', 'Структура'],
      feature3Bullets: [
        'Готовый журналистский лид и заголовок',
        'Редактирование в реальном времени',
        'Синхронизация с проверенными фактами'
      ],
      feature4Title: 'Мульти-экспорт',
      feature4Desc: 'Адаптация материала в 1 клик для Telegram, соцсетей и информационных лент.',
      feature4Tags: ['Telegram', 'Сценарий', 'Соцсети'],
      feature4Bullets: [
        'Форматированные посты с эмодзи и ссылками',
        'Сценарий для видеосюжетов и reels',
        'Быстрое копирование в буфер обмена'
      ]
    },
    activeFile: {
      tabFile: 'Файл',
      tabText: 'Текст',
      logs: [
        '..расшифровка файла',
        '..проверка фактов',
        '..генерация черновика',
        '..генерация публикаций для соцсетей'
      ]
    },
    factChecking: {
      title: 'Фактчекинг',
      verifiedLabel: 'Верифицировано:',
      verifiedOf: (count, total) => `${count} из ${total}`,
      listenAudioTitle: 'Прослушать цитату первоисточника',
      declineBtn: 'Отклонить',
      approveBtn: 'Принять',
      fixedBtn: 'Исправлено',
      claimedLabel: 'Заявлено:',
      verifiedAuditLabel: 'Проверка:',
      sourceLabel: 'Источник:',
      modalTitle: 'Действие при отклонении факта',
      modalOpt1Title: '1. Применить факт ИИ (Автозамена)',
      modalOpt1Desc: 'Заменить на выверенные данные в черновике.',
      modalOpt2Title: '2. Оставить со сноской редакции',
      modalOpt2Desc: 'Сохранить цитату, добавив сноску редакции с первоисточником.',
      modalOpt3Title: '3. Удалить сомнительное утверждение',
      modalOpt3Desc: 'Чисто убрать некорректное утверждение из публикации.',
      modalOpt4Title: '4. Просто пометить как Отклонено',
      modalOpt4Desc: 'Отклонить факт без автоматического изменения текста.',
      modalCancel: 'Отмена'
    },
    leadDraft: {
      title: 'Черновик статьи',
      editBtn: 'Редактировать',
      previewBtn: 'Предпросмотр',
      editTooltip: 'Перейти в режим редактирования текста',
      previewTooltip: 'Посмотреть готовый отформатированный материал',
      rawMarkdownTooltip: 'Переключить исходный Markdown код',
      rawPlaceholder: 'Введите или отредактируйте Markdown код...'
    },
    exportSection: {
      title: 'Мультиплатформенный экспорт',
      tabPost: 'Статья',
      tabTelegram: 'Telegram',
      tabScenario: 'Сценарий',
      copy: 'Копировать',
      copied: 'Скопировано'
    }
  },
  kz: {
    header: {
      exitDemo: 'Демодан шығу',
      demoMode: 'Демо режимі'
    },
    hero: {
      titleLine1: 'Аудиожазбадан',
      titleLine2: 'тексерілген мақалаға дейін',
      titleLine3: 'санаулы минуттарда.',
      subtitle: 'Қос тілді сұхбаттарды мәтінге айналдыру, фактілерді тексеру және редакциялық бақылаудағы дайын мақалалар.',
      tabFile: 'Файл',
      tabText: 'Мәтін',
      dropPrompt: 'Аудиофайлды осында сүйреңіз немесе таңдау үшін басыңыз',
      dropFormats: '25 МБ дейінгі MP3, WAV, M4A және MP4 файлдары қолданылады (қазақ/орыс тілдері).',
      chooseFile: 'Файлды таңдау',
      textPlaceholder: 'Сұхбат мәтінін, аудио транскриптін немесе баспасөз хабарламасын енгізіңіз...',
      processText: 'Мәтінді өңдеу',
      processing: 'Өңделуде...',
      feature1Title: 'Аудиодан мәтінге',
      feature1Desc: 'Таймкодтармен және спикерлерді ажыратумен қос тілді транскрипция (KZ/RU).',
      feature1Tags: ['KZ / RU', 'Таймкодтар', 'Спикерлер'],
      feature1Bullets: [
        'Күрделі өңірлік терминдер мен есімдерді тану',
        'Аудио мен мәтіннің интерактивті байланысы',
        'Толық стенограмманы экспорттау'
      ],
      feature2Title: 'Фактчекинг',
      feature2Desc: 'Жариялау алдында сандарды, фактілерді және дәйексөздерді автоматты тексеру.',
      feature2Tags: ['Сандар аудиті', 'Дәйексөздер', 'Quick Fix'],
      feature2Bullets: [
        'Мемлекеттік реестрлермен және бюджетпен салыстыру',
        'Сәйкессіздіктерді 1 шертумен анықтау',
        'Түзетудің 4 сценарийі (AI, анықтама, жою)'
      ],
      feature3Title: 'Мақала черновигі',
      feature3Desc: 'Редактордың толық бақылауымен дайын журналистік черновик жасау.',
      feature3Tags: ['WYSIWYG', 'Редакциялау', 'Құрылым'],
      feature3Bullets: [
        'Дайын журналистік лид пен тақырып',
        'Нақты уақытта мәтінді өңдеу',
        'Тексерілген фактілермен синхрондау'
      ],
      feature4Title: 'Мульти-экспорт',
      feature4Desc: 'Telegram, әлеуметтік желілер және ақпараттық арналар үшін 1 батырмамен бейімдеу.',
      feature4Tags: ['Telegram', 'Сценарий', 'Әлеуметтік желі'],
      feature4Bullets: [
        'Эмодзи және сілтемелері бар пішімделген жазбалар',
        'Бейнесюжеттер мен reels сценарийі',
        'Алмасу буферіне жылдам көшіру'
      ]
    },
    activeFile: {
      tabFile: 'Файл',
      tabText: 'Мәтін',
      logs: [
        '..файлды транскрипциялау',
        '..фактілерді тексеру',
        '..мақала черновигін жасау',
        '..әлеуметтік желілерге арналған жазба жасау'
      ]
    },
    factChecking: {
      title: 'Фактчекинг',
      verifiedLabel: 'Тексерілді:',
      verifiedOf: (count, total) => `${count} / ${total}`,
      listenAudioTitle: 'Түпнұсқа дәйексөзді тыңдау',
      declineBtn: 'Қабылдамау',
      approveBtn: 'Мақұлдау',
      fixedBtn: 'Түзетілді',
      claimedLabel: 'Мәлімделген:',
      verifiedAuditLabel: 'Тексеріс:',
      sourceLabel: 'Дереккөз:',
      modalTitle: 'Фактіні қабылдамау кезіндегі әрекет',
      modalOpt1Title: '1. ЖИ фактісін қолдану (Автоалмастыру)',
      modalOpt1Desc: 'Черновиктегі мәліметтерді тексерілген деректерге ауыстыру.',
      modalOpt2Title: '2. Редакция сілтемесімен қалдыру',
      modalOpt2Desc: 'Дәйексөзді сақтап, бастапқы дереккөз көрсетілген редакция сілтемесін қосу.',
      modalOpt3Title: '3. Күмәнді мәлімдемені жою',
      modalOpt3Desc: 'Басылымнан қате мәлімдемені толық алып тастау.',
      modalOpt4Title: '4. Тек Қабылданбады деп белгілеу',
      modalOpt4Desc: 'Мәтінді өзгертпей фактіні қабылдамау.',
      modalCancel: 'Болдырмау'
    },
    leadDraft: {
      title: 'Мақала черновигі',
      editBtn: 'Өңдеу',
      previewBtn: 'Алдын ала қарау',
      editTooltip: 'Мәтінді өңдеу режиміне өту',
      previewTooltip: 'Дайын пішімделген материалды көру',
      rawMarkdownTooltip: 'Бастапқы Markdown кодын ауыстырып қосу',
      rawPlaceholder: 'Markdown кодын енгізіңіз немесе өңдеңіз...'
    },
    exportSection: {
      title: 'Платформаларға экспорттау',
      tabPost: 'Мақала',
      tabTelegram: 'Telegram',
      tabScenario: 'Сценарий',
      copy: 'Көшіру',
      copied: 'Көшірілді'
    }
  },
  en: {
    header: {
      exitDemo: 'Exit demo',
      demoMode: 'Demo mode'
    },
    hero: {
      titleLine1: 'From raw audio to',
      titleLine2: 'verified story in',
      titleLine3: 'minutes.',
      subtitle: 'Transcribe bilingual interviews, flag verification risks, and generate publication-ready drafts under full editorial control.',
      tabFile: 'File',
      tabText: 'Text',
      dropPrompt: 'Drag and drop an audio file here or click to select.',
      dropFormats: 'MP3, WAV, M4A, and MP4 files up to 25 MB are supported (Kazakh/Russian languages).',
      chooseFile: 'Choose file',
      textPlaceholder: 'Insert raw interview text, audio transcript, or press release here...',
      processText: 'Process text',
      processing: 'Processing...',
      feature1Title: 'Audio to Text',
      feature1Desc: 'Bilingual speech transcription (KZ/RU) with timestamps and speaker diarization.',
      feature1Tags: ['KZ / RU', 'Timestamps', 'Speakers'],
      feature1Bullets: [
        'Accurate recognition of regional names & terms',
        'Interactive audio-to-text synchronization',
        'Full verbatim transcript export'
      ],
      feature2Title: 'Fact Checking',
      feature2Desc: 'Automated verification of figures, facts, and quotes with pre-publishing risk review.',
      feature2Tags: ['Data audit', 'Quote check', 'Quick Fix'],
      feature2Bullets: [
        'Cross-check against budget records & registries',
        'One-click discrepancy highlighting',
        '4 correction paths (AI, footnote, removal)'
      ],
      feature3Title: 'Lead Draft',
      feature3Desc: 'Generation of a publication-ready news draft under complete editorial oversight.',
      feature3Tags: ['WYSIWYG', 'Editing', 'Structure'],
      feature3Bullets: [
        'Publication-ready news lead & outline',
        'Real-time rich text editing',
        'Instant sync with verified facts'
      ],
      feature4Title: 'Multi-Export',
      feature4Desc: 'One-click content adaptation for Telegram, social channels, and news feeds.',
      feature4Tags: ['Telegram', 'Script', 'Social channels'],
      feature4Bullets: [
        'Formatted posts with emojis & links',
        'Video & reels script templates',
        'One-click copy to clipboard'
      ]
    },
    activeFile: {
      tabFile: 'File',
      tabText: 'Text',
      logs: [
        '..file decryption',
        '..fact checking',
        '..generating a draft post',
        '..generating a post for social networks'
      ]
    },
    factChecking: {
      title: 'Fact checking',
      verifiedLabel: 'Verified:',
      verifiedOf: (count, total) => `${count} of ${total}`,
      listenAudioTitle: 'Listen to source quote audio',
      declineBtn: 'Decline',
      approveBtn: 'Approve',
      fixedBtn: 'Fixed',
      claimedLabel: 'Claimed:',
      verifiedAuditLabel: 'Verified:',
      sourceLabel: 'Source:',
      modalTitle: 'Action upon declining fact',
      modalOpt1Title: '1. Apply AI verified fact (Auto-replace)',
      modalOpt1Desc: 'Replace with verified data in the draft.',
      modalOpt2Title: '2. Keep with editorial footnote',
      modalOpt2Desc: 'Keep quote, adding an editorial footnote citing original source.',
      modalOpt3Title: '3. Remove unverified statement',
      modalOpt3Desc: 'Cleanly remove incorrect statement from publication.',
      modalOpt4Title: '4. Mark as Declined only',
      modalOpt4Desc: 'Decline fact without automatic text alteration.',
      modalCancel: 'Cancel'
    },
    leadDraft: {
      title: 'Lead Draft',
      editBtn: 'Edit',
      previewBtn: 'Preview',
      editTooltip: 'Switch to text editing mode',
      previewTooltip: 'View formatted final story',
      rawMarkdownTooltip: 'Toggle raw Markdown code',
      rawPlaceholder: 'Type or edit Markdown source code...'
    },
    exportSection: {
      title: 'Multi-platform export',
      tabPost: 'Post',
      tabTelegram: 'Telegram',
      tabScenario: 'Scenario',
      copy: 'Copy',
      copied: 'Copied'
    }
  }
};
