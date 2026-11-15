import { OutputLanguage } from './types';

export interface TranslationStrings {
  header: {
    exitDemo: string;
    demoMode: string;
    newMaterial: string;
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
    readyToProcess: string;
    extractingAudio?: string;
    uploadingFile?: string;
    processFile: string;
    changeFile: string;
    textPlaceholder: string;
    processText: string;
    processing: string;
    sampleText: string;
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
  audioPreview: {
    title: string;
    speaker: string;
  };
  editorToolbar: {
    clearFormatting: string;
    bold: string;
    italic: string;
    headingStyles: string;
    h1: string;
    h2: string;
    h3: string;
    paragraph: string;
    highlightColor: string;
    editorialMarkers: string;
    markerYellow: string;
    markerRed: string;
    markerGreen: string;
    markerBlue: string;
    removeHighlight: string;
    extraStyles: string;
    strike: string;
    underline: string;
    inlineCode: string;
    lists: string;
    bulletList: string;
    orderedList: string;
    alignment: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    linkTooltip: string;
    insertLink: string;
    deleteLink: string;
    cancel: string;
    apply: string;
    insertImage: string;
    imagePrompt: string;
    insertMediaNote: string;
    mediaSnippet: string;
    quote: string;
    insertTable: string;
    extraElements: string;
    divider: string;
    codeBlock: string;
    undo: string;
    redo: string;
    rawModeWysiwyg: string;
    rawModeMarkdown: string;
  };
  alerts: {
    unsupportedFormatTitle: string;
    unsupportedFormatMsg: (name: string) => string;
    unsupportedFormatHint: string;
    sizeLimitTitle: string;
    sizeLimitMsg: (name: string, sizeMb: string) => string;
    sizeLimitHint: string;
    hintPrefix: string;
    understoodBtn: string;
    goodBtn: string;
    closeBtn: string;
    processingErrorTitle: string;
    serverError: (status: number) => string;
    unknownError: string;
    errorHint: string;
  };
  pricing: PricingStrings;
}

export interface PricingFeature {
  name: string;
  ind: string | boolean;
  team: string | boolean;
}

export interface PricingCategory {
  name: string;
  features: PricingFeature[];
}

export interface PricingStrings {
  title: string;
  subtitle: string;
  toggleMonthly: string;
  toggleYearly: string;
  billedAnnually: string;
  billedMonthly: string;
  discountLabel: string;
  fairUseTitle: string;
  fairUseDesc: string;
  perMonth: string;
  perYear: string;
  perTeamMonth: string;
  individual: {
    name: string;
    desc: string;
    button: string;
    bullets: string[];
  };
  team: {
    name: string;
    desc: string;
    annualNote: string;
    button: string;
    bullets: string[];
  };
  tableTitle: string;
  currencyBadge: string;
  colFeature: string;
  corporateNote: string;
  contactSales: string;
  categories: PricingCategory[];
}

export const TRANSLATIONS: Record<OutputLanguage, TranslationStrings> = {
  ru: {
    header: {
      exitDemo: 'Выйти из демо',
      demoMode: 'Демо режим',
      newMaterial: 'Новый материал'
    },
    hero: {
      titleLine1: 'От аудиозаписи до',
      titleLine2: 'проверенного материала',
      titleLine3: 'за считанные минуты.',
      subtitle: 'Билингвальная расшифровка интервью, проверка рисков фактов и генерация черновиков под полным контролем редакции.',
      tabFile: 'Файл',
      tabText: 'Текст',
      dropPrompt: 'Перетащите аудиофайл сюда или нажмите для выбора',
      dropFormats: 'Поддерживаются форматы MP3, WAV, M4A и MP4 (казахский, русский и английский языки).',
      chooseFile: 'Выбрать файл',
      readyToProcess: 'Файл готов к отправке',
      extractingAudio: 'Извлечение аудио...',
      uploadingFile: 'Загрузка...',
      processFile: 'Обработать файл',
      changeFile: 'Выбрать другой файл',
      textPlaceholder: 'Вставьте исходный текст интервью, расшифровку аудио или пресс-релиз...',
      processText: 'Обработать текст',
      processing: 'Обработка...',
      sampleText: 'На брифинге в Астане официальные лица сообщили о выделении 500 млн тенге на прямую грантовую поддержку региональных медиа в 2026 году. По данным ведомства, свыше 80% независимых редакций подали заявки.',
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
    },
    audioPreview: {
      title: 'Воспроизведение таймкода',
      speaker: 'Спикер'
    },
    editorToolbar: {
      clearFormatting: 'Очистить форматирование',
      bold: 'Жирный (Ctrl+B)',
      italic: 'Курсив (Ctrl+I)',
      headingStyles: 'Стили заголовков',
      h1: 'H1 Заголовок',
      h2: 'H2 Подзаголовок',
      h3: 'H3 Секция',
      paragraph: 'Обычный текст (Paragraph)',
      highlightColor: 'Цвет маркера / Выделение',
      editorialMarkers: 'Редакторские маркеры:',
      markerYellow: 'Желтый (Важно)',
      markerRed: 'Красный (Фактчек)',
      markerGreen: 'Зеленый (Подтверждено)',
      markerBlue: 'Синий (Цитата/Источник)',
      removeHighlight: '✕ Снять выделение маркером',
      extraStyles: 'Дополнительные стили',
      strike: 'Зачеркнутый',
      underline: 'Подчеркнутый',
      inlineCode: 'Код в строке',
      lists: 'Списки',
      bulletList: '• Маркированный список',
      orderedList: '1. Нумерованный список',
      alignment: 'Выравнивание текста',
      alignLeft: 'По левому краю',
      alignCenter: 'По центру',
      alignRight: 'По правому краю',
      linkTooltip: 'Вставить или изменить ссылку (Ctrl+K)',
      insertLink: 'Вставить ссылку',
      deleteLink: 'Удалить',
      cancel: 'Отмена',
      apply: 'Применить',
      insertImage: 'Вставить изображение',
      imagePrompt: 'Введите URL изображения:',
      insertMediaNote: 'Вставить медиа-сноску',
      mediaSnippet: '> 🎬 [Видеоматериал: Пресс-конференция]',
      quote: 'Цитата',
      insertTable: 'Вставить интерактивную таблицу',
      extraElements: 'Дополнительные элементы',
      divider: 'Разделительная черта',
      codeBlock: 'Блок кода',
      undo: 'Отменить (Ctrl+Z)',
      redo: 'Повторить (Ctrl+Y)',
      rawModeWysiwyg: 'Визуальный WYSIWYG режим',
      rawModeMarkdown: 'Режим исходного Markdown кода'
    },
    alerts: {
      unsupportedFormatTitle: 'Неподдерживаемый формат',
      unsupportedFormatMsg: (name) => `Формат файла «${name}» не поддерживается. Разрешенные форматы: MP3, WAV, M4A, MP4, AAC, OGG, MOV.`,
      unsupportedFormatHint: 'Для наилучшей скорости и экономии токенов рекомендуем использовать аудиофайлы MP3 или M4A.',
      sizeLimitTitle: 'Превышен лимит размера (100 МБ)',
      sizeLimitMsg: (name, sizeMb) => `Выбранный файл «${name}» весит ${sizeMb} МБ. Максимальный размер файла для обработки составляет 100 МБ.`,
      sizeLimitHint: 'Для длинных видеозаписей (1-2 часа) рекомендуем экспортировать только аудиодорожку в MP3 или M4A - это займет в 5 раз меньше объема и токенов без потери качества.',
      hintPrefix: 'Подсказка:',
      understoodBtn: 'Понятно',
      goodBtn: 'Хорошо',
      closeBtn: 'Закрыть',
      processingErrorTitle: 'Ошибка обработки',
      serverError: (status) => `Ошибка сервера: ${status}`,
      unknownError: 'Неизвестная ошибка обработки',
      errorHint: 'Проверьте настройки API ключей в верхнем меню или повторите попытку.'
    },
    pricing: {
      title: 'Инвестиция в скорость и точность вашей редакции',
      subtitle: 'Прозрачные тарифы без скрытых переплат. Автоматический фактчекинг, транскрипция и умный рерайтинг для журналистов.',
      toggleMonthly: 'Ежемесячно',
      toggleYearly: 'Годовая',
      billedAnnually: 'При оплате за год:',
      billedMonthly: 'Оплата помесячно',
      discountLabel: 'скидка 15%',
      fairUseTitle: 'Fair Use политика: 15 часов аудио на пользователя в месяц',
      fairUseDesc: 'В оба тарифных плана включено 15 часов расшифровки и фактчекинга аудио на каждого журналиста в месяц без скрытых доплат.',
      perMonth: 'в месяц',
      perYear: 'в год',
      perTeamMonth: 'в месяц на команду',
      individual: {
        name: 'Individual',
        desc: 'Идеально для фрилансеров, журналистов-расследователей и блогеров.',
        button: 'Подключить Individual',
        bullets: [
          '1 рабочий аккаунт журналиста',
          '15 часов аудио в месяц (Fair use)',
          'Стенограмма, фактчекинг и лид-статья',
          'Экспорт в Telegram и Reels / TikTok'
        ]
      },
      team: {
        name: 'Team',
        desc: 'Полноценное решение для редакций, новостных отделов и медиакоманд до 3 человек.',
        annualNote: '900 000 ₸ в год на команду до 3 человек',
        button: 'Подключить Team',
        bullets: [
          'До 3 мест для авторов и редакторов',
          '45 часов аудио в месяц (15 ч / чел)',
          'Совместный рабочий стол и история правок',
          'Оплата по договору, безнал и закрывающие акты'
        ]
      },
      tableTitle: 'Сравнение возможностей тарифов',
      currencyBadge: 'KZT (тенге)',
      colFeature: 'Возможности и функционал',
      corporateNote: 'Корпоративный тариф для редакции более 3 человек?',
      contactSales: 'Связаться с отделом продаж →',
      categories: [
        {
          name: 'Лимиты и доступ',
          features: [
            { name: 'Количество пользователей (рабочих мест)', ind: '1 журналист', team: 'До 3 журналистов' },
            { name: 'Лимит расшифровки аудио (Fair Use)', ind: '15 ч / месяц', team: '15 ч / чел (45 ч / мес)' },
            { name: 'Максимальный размер одного файла', ind: 'До 2 ГБ', team: 'До 4 ГБ' },
            { name: 'Обработка видео (MP4, MOV, WebM)', ind: true, team: true }
          ]
        },
        {
          name: 'Журналистский ИИ-инструментарий',
          features: [
            { name: 'Стенограмма с разделением спикеров и таймкодами', ind: true, team: true },
            { name: 'Автоматический фактчекинг и сверка цифр', ind: true, team: true },
            { name: 'Поиск ссылок на реальные первоисточники СМИ', ind: true, team: true },
            { name: 'Генерация готовой лид-статьи (Web Article)', ind: true, team: true },
            { name: 'Мультиплатформенный экспорт (Telegram, Reels / TikTok)', ind: true, team: true },
            { name: 'Интерактивный Tiptap редактор с быстрыми правками', ind: true, team: true },
            { name: 'Трехъязычный вывод (RU, KZ, EN)', ind: true, team: true }
          ]
        },
        {
          name: 'Командная работа и поддержка',
          features: [
            { name: 'Общее рабочее пространство редакции', ind: false, team: true },
            { name: 'Единый пул часов расшифровки на команду', ind: false, team: true },
            { name: 'Оплата по счету юрлица и закрывающие акты (ЭСФ)', ind: false, team: true },
            { name: 'Приоритетная линия поддержки', ind: 'Email-поддержка', team: 'Выделенный чат в Telegram' }
          ]
        }
      ]
    }
  },
  kz: {
    header: {
      exitDemo: 'Демодан шығу',
      demoMode: 'Демо режимі',
      newMaterial: 'Жаңа материал'
    },
    hero: {
      titleLine1: 'Аудиожазбадан',
      titleLine2: 'тексерілген мақалаға дейін',
      titleLine3: 'санаулы минуттарда.',
      subtitle: 'Қос тілді сұхбаттарды мәтінге айналдыру, фактілерді тексеру және редакциялық бақылаудағы дайын мақалалар.',
      tabFile: 'Файл',
      tabText: 'Мәтін',
      dropPrompt: 'Аудиофайлды осында сүйреңіз немесе таңдау үшін басыңыз',
      dropFormats: 'MP3, WAV, M4A және MP4 файлдары қолданылады (қазақ, орыс және ағылшын тілдері).',
      chooseFile: 'Файлды таңдау',
      readyToProcess: 'Файл жіберуге дайын',
      extractingAudio: 'Аудиожолды алу...',
      uploadingFile: 'Жүктелуде...',
      processFile: 'Файлды өңдеу',
      changeFile: 'Басқа файлды таңдау',
      textPlaceholder: 'Сұхбат мәтінін, аудио транскриптін немесе баспасөз хабарламасын енгізіңіз...',
      processText: 'Мәтінді өңдеу',
      processing: 'Өңделуде...',
      sampleText: 'Астанада өткен брифингте ресми тұлғалар 2026 жылы өңірлік медиаға тікелей гранттық қолдау ретінде 500 млн теңге бөлінгенін хабарлады. Ведомство мәліметінше, тәуелсіз редакциялардың 80%-дан астамы өтінім берген.',
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
    },
    audioPreview: {
      title: 'Таймкодты тыңдау',
      speaker: 'Спикер'
    },
    editorToolbar: {
      clearFormatting: 'Пішімдеуді тазарту',
      bold: 'Қалың (Ctrl+B)',
      italic: 'Курсив (Ctrl+I)',
      headingStyles: 'Тақырып стильдері',
      h1: 'H1 Басты тақырып',
      h2: 'H2 Ішкі тақырып',
      h3: 'H3 Бөлім',
      paragraph: 'Қарапайым мәтін (Параграф)',
      highlightColor: 'Маркер түсі / Ерекшелеу',
      editorialMarkers: 'Редакторлық маркерлер:',
      markerYellow: 'Сары (Маңызды)',
      markerRed: 'Қызыл (Фактчек)',
      markerGreen: 'Жасыл (Тексерілді)',
      markerBlue: 'Көк (Дәйексөз/Дереккөз)',
      removeHighlight: '✕ Маркерді алып тастау',
      extraStyles: 'Қосымша стильдер',
      strike: 'Сызылған',
      underline: 'Асты сызылған',
      inlineCode: 'Жолдағы код',
      lists: 'Тізімдер',
      bulletList: '• Таңбаланған тізім',
      orderedList: '1. Нөмірленген тізім',
      alignment: 'Мәтінді туралау',
      alignLeft: 'Сол жақ шетімен',
      alignCenter: 'Ортасына туралау',
      alignRight: 'Оң жақ шетімен',
      linkTooltip: 'Сілтеме қосу немесе өзгерту (Ctrl+K)',
      insertLink: 'Сілтеме қосу',
      deleteLink: 'Жою',
      cancel: 'Болдырмау',
      apply: 'Қолдану',
      insertImage: 'Сурет қосу',
      imagePrompt: 'Суреттің URL мекенжайын енгізіңіз:',
      insertMediaNote: 'Медиа-сілтеме қосу',
      mediaSnippet: '> 🎬 [Бейнематериал: Баспасөз мәслихаты]',
      quote: 'Дәйексөз',
      insertTable: 'Интерактивті кесте қосу',
      extraElements: 'Қосымша элементтер',
      divider: 'Бөлгіш сызық',
      codeBlock: 'Код блогы',
      undo: 'Болдырмау (Ctrl+Z)',
      redo: 'Қайталау (Ctrl+Y)',
      rawModeWysiwyg: 'Көрнекі WYSIWYG режимі',
      rawModeMarkdown: 'Бастапқы Markdown коды режимі'
    },
    alerts: {
      unsupportedFormatTitle: 'Қолдау көрсетілмейтін пішім',
      unsupportedFormatMsg: (name) => `«${name}» файл пішіміне қолдау көрсетілмейді. Рұқсат етілген пішімдер: MP3, WAV, M4A, MP4, AAC, OGG, MOV.`,
      unsupportedFormatHint: 'Жылдамдық пен токендерді үнемдеу үшін MP3 немесе M4A аудиофайлдарын пайдалануды ұсынамыз.',
      sizeLimitTitle: 'Өлшем шегі асып кетті (100 МБ)',
      sizeLimitMsg: (name, sizeMb) => `Таңдалған «${name}» файлының өлшемі ${sizeMb} МБ. Өңдеуге арналған ең үлкен файл өлшемі 100 МБ құрайды.`,
      sizeLimitHint: 'Ұзақ бейнежазбалар (1-2 сағат) үшін тек MP3 немесе M4A аудиожолын экспорттауды ұсынамыз - бұл көлемді 5 есе азайтады.',
      hintPrefix: 'Кеңес:',
      understoodBtn: 'Түсінікті',
      goodBtn: 'Жақсы',
      closeBtn: 'Жабу',
      processingErrorTitle: 'Өңдеу қатесі',
      serverError: (status) => `Сервер қатесі: ${status}`,
      unknownError: 'Белгісіз өңдеу қатесі',
      errorHint: 'Жоғарғы мәзірден API кілттерін тексеріңіз немесе қайталап көріңіз.'
    },
    pricing: {
      title: 'Редакцияңыздың жылдамдығы мен дәлдігіне салынған инвестиция',
      subtitle: 'Жасырын үстемеақысыз ашық бағалар. Журналистерге арналған автоматты фактчекинг, транскрипция және мультиплатформалық экспорт.',
      toggleMonthly: 'Ай сайын',
      toggleYearly: 'Жылдық',
      billedAnnually: 'Жылдық төлем кезінде:',
      billedMonthly: 'Ай сайынғы төлем',
      discountLabel: '15% жеңілдік',
      fairUseTitle: 'Fair Use саясаты: пайдаланушыға айына 15 сағат аудио',
      fairUseDesc: 'Екі тарифке де әр журналистке айына 15 сағат аудионы толық өңдеу мен фактчекинг жасау кіреді.',
      perMonth: 'айына',
      perYear: 'жылына',
      perTeamMonth: 'айына командаға',
      individual: {
        name: 'Individual',
        desc: 'Фрилансерлер, зерттеуші-журналистер мен сарапшыларға арналған.',
        button: 'Individual қосу',
        bullets: [
          '1 журналистің жұмыс аккаунты',
          'Айына 15 сағат аудио (Fair use)',
          'Стенограмма, фактчекинг және жетекші мақала',
          'Telegram және Reels / TikTok экспорттау'
        ]
      },
      team: {
        name: 'Team',
        desc: '3 адамға дейінгі редакциялар мен медиа командаларға арналған кешенді шешім.',
        annualNote: '3 адамға дейінгі командаға жылына 900 000 ₸',
        button: 'Team қосу',
        bullets: [
          'Авторлар мен редакторларға 3 орынға дейін',
          'Айына 45 сағат аудио (15 сағ / адам)',
          'Ортақ жұмыс кеңістігі мен түзетулер тарихы',
          'Шарт бойынша төлем, қолма-қолсыз және жабу құжаттары'
        ]
      },
      tableTitle: 'Тарифтердің мүмкіндіктерін салыстыру',
      currencyBadge: 'KZT (теңге)',
      colFeature: 'Мүмкіндіктер мен функциялар',
      corporateNote: '3 адамнан көп редакцияға арналған корпоративтік тариф керек пе?',
      contactSales: 'Сату бөлімімен байланысу →',
      categories: [
        {
          name: 'Лимиттер мен қолжетімділік',
          features: [
            { name: 'Пайдаланушылар саны (жұмыс орны)', ind: '1 журналист', team: '3 журналистке дейін' },
            { name: 'Аудио өңдеу лимиті (Fair Use)', ind: '15 сағ / ай', team: '15 сағ / адам (45 сағ / ай)' },
            { name: 'Бір файлдың максималды көлемі', ind: '2 ГБ дейін', team: '4 ГБ дейін' },
            { name: 'Видео файлдарды өңдеу (MP4, MOV, WebM)', ind: true, team: true }
          ]
        },
        {
          name: 'Журналистикаға арналған ЖИ құралдары',
          features: [
            { name: 'Спикерлерге бөлінген стенограмма мен таймкодтар', ind: true, team: true },
            { name: 'Автоматты фактчекинг және сандарды тексеру', ind: true, team: true },
            { name: 'Нақты БАҚ пен бастапқы дереккөздерге сілтемелер', ind: true, team: true },
            { name: 'Дайын жетекші мақала (Web Article) құру', ind: true, team: true },
            { name: 'Әлеуметтік желілерге экспорт (Telegram, Reels, TikTok)', ind: true, team: true },
            { name: 'Интерактивті Tiptap редакторы мен жылдам түзетулер', ind: true, team: true },
            { name: 'Үш тілде шығару (RU, KZ, EN)', ind: true, team: true }
          ]
        },
        {
          name: 'Командалық жұмыс пен қолдау',
          features: [
            { name: 'Редакцияның ортақ жұмыс кеңістігі', ind: false, team: true },
            { name: 'Командаға ортақ сағаттар қоры', ind: false, team: true },
            { name: 'Заңды тұлғаларға арналған шот пен жабу құжаттары (ЭСФ)', ind: false, team: true },
            { name: 'Басымдықты қолдау қызметі', ind: 'Email қолдау', team: 'Telegram жеке чаты' }
          ]
        }
      ]
    }
  },
  en: {
    header: {
      exitDemo: 'Exit demo',
      demoMode: 'Demo mode',
      newMaterial: 'New material'
    },
    hero: {
      titleLine1: 'From raw audio to',
      titleLine2: 'verified story in',
      titleLine3: 'minutes.',
      subtitle: 'Transcribe bilingual interviews, flag verification risks, and generate publication-ready drafts under full editorial control.',
      tabFile: 'File',
      tabText: 'Text',
      dropPrompt: 'Drag and drop an audio file here or click to select.',
      dropFormats: 'MP3, WAV, M4A, and MP4 files are supported (Kazakh, Russian, and English).',
      chooseFile: 'Choose file',
      readyToProcess: 'File ready for processing',
      extractingAudio: 'Extracting audio...',
      uploadingFile: 'Uploading...',
      processFile: 'Process file',
      changeFile: 'Choose another file',
      textPlaceholder: 'Insert raw interview text, audio transcript, or press release here...',
      processText: 'Process text',
      processing: 'Processing...',
      sampleText: 'At a briefing in Astana, officials announced the allocation of 500 million tenge for direct grant support of regional media in 2026. Over 80% of independent newsrooms have applied.',
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
    },
    audioPreview: {
      title: 'Playing timecode',
      speaker: 'Speaker'
    },
    editorToolbar: {
      clearFormatting: 'Clear formatting',
      bold: 'Bold (Ctrl+B)',
      italic: 'Italic (Ctrl+I)',
      headingStyles: 'Heading styles',
      h1: 'H1 Heading',
      h2: 'H2 Subheading',
      h3: 'H3 Section',
      paragraph: 'Normal text (Paragraph)',
      highlightColor: 'Highlight color',
      editorialMarkers: 'Editorial markers:',
      markerYellow: 'Yellow (Important)',
      markerRed: 'Red (Fact-check)',
      markerGreen: 'Green (Verified)',
      markerBlue: 'Blue (Quote/Source)',
      removeHighlight: '✕ Remove highlight',
      extraStyles: 'Extra styles',
      strike: 'Strikethrough',
      underline: 'Underline',
      inlineCode: 'Inline code',
      lists: 'Lists',
      bulletList: '• Bullet list',
      orderedList: '1. Numbered list',
      alignment: 'Text alignment',
      alignLeft: 'Align left',
      alignCenter: 'Align center',
      alignRight: 'Align right',
      linkTooltip: 'Insert or edit link (Ctrl+K)',
      insertLink: 'Insert link',
      deleteLink: 'Delete',
      cancel: 'Cancel',
      apply: 'Apply',
      insertImage: 'Insert image',
      imagePrompt: 'Enter image URL:',
      insertMediaNote: 'Insert media note',
      mediaSnippet: '> 🎬 [Video footage: Press conference]',
      quote: 'Quote',
      insertTable: 'Insert interactive table',
      extraElements: 'Additional elements',
      divider: 'Horizontal rule',
      codeBlock: 'Code block',
      undo: 'Undo (Ctrl+Z)',
      redo: 'Redo (Ctrl+Y)',
      rawModeWysiwyg: 'Visual WYSIWYG mode',
      rawModeMarkdown: 'Raw Markdown mode'
    },
    alerts: {
      unsupportedFormatTitle: 'Unsupported format',
      unsupportedFormatMsg: (name) => `File format for "${name}" is not supported. Allowed formats: MP3, WAV, M4A, MP4, AAC, OGG, MOV.`,
      unsupportedFormatHint: 'For optimal speed and token economy, we recommend MP3 or M4A audio files.',
      sizeLimitTitle: 'Size limit exceeded (100 MB)',
      sizeLimitMsg: (name, sizeMb) => `Selected file "${name}" is ${sizeMb} MB. Maximum file size for processing is 100 MB.`,
      sizeLimitHint: 'For long video recordings (1-2 hours), we recommend exporting audio-only to MP3 or M4A.',
      hintPrefix: 'Hint:',
      understoodBtn: 'Understood',
      goodBtn: 'OK',
      closeBtn: 'Close',
      processingErrorTitle: 'Processing error',
      serverError: (status) => `Server error: ${status}`,
      unknownError: 'Unknown processing error',
      errorHint: 'Check API key settings or try again.'
    },
    pricing: {
      title: 'Invest in speed and journalistic accuracy',
      subtitle: 'Transparent plans with no hidden charges. Automated fact-checking, transcription, and multi-format publishing for editorial teams.',
      toggleMonthly: 'Monthly',
      toggleYearly: 'Annual',
      billedAnnually: 'Billed annually:',
      billedMonthly: 'Billed monthly',
      discountLabel: '15% off',
      fairUseTitle: 'Fair Use Policy: 15 hours of audio per user per month',
      fairUseDesc: 'Both plans include 15 hours of audio transcription and automated fact-checking per journalist each month with zero surprise costs.',
      perMonth: 'per month',
      perYear: 'per year',
      perTeamMonth: 'per month for team',
      individual: {
        name: 'Individual',
        desc: 'Ideal for freelance investigative reporters, analysts, and content creators.',
        button: 'Get Individual',
        bullets: [
          '1 journalist seat',
          '15 hours of audio per month (Fair use)',
          'Transcript, fact-checking, and lead article',
          'Multi-platform export to Telegram and Reels / TikTok'
        ]
      },
      team: {
        name: 'Team',
        desc: 'Complete workflow for digital newsrooms and editorial teams up to 3 members.',
        annualNote: '900,000 ₸ per year for team up to 3 seats',
        button: 'Get Team',
        bullets: [
          'Up to 3 seats for reporters and editors',
          '45 hours of audio per month (15 hrs / user)',
          'Shared workspace & revision history',
          'Corporate invoice, bank transfer & closing docs'
        ]
      },
      tableTitle: 'Detailed Feature Comparison',
      currencyBadge: 'KZT (tenge)',
      colFeature: 'Capabilities & Tools',
      corporateNote: 'Need an enterprise plan for more than 3 journalists?',
      contactSales: 'Contact Sales →',
      categories: [
        {
          name: 'Access & Quotas',
          features: [
            { name: 'Number of user seats', ind: '1 Journalist', team: 'Up to 3 Journalists' },
            { name: 'Audio processing allowance (Fair Use)', ind: '15 hrs / month', team: '15 hrs / user (45 hrs / mo)' },
            { name: 'Max upload file size', ind: 'Up to 2 GB', team: 'Up to 4 GB' },
            { name: 'Video input support (MP4, MOV, WebM)', ind: true, team: true }
          ]
        },
        {
          name: 'AI Editorial Suite',
          features: [
            { name: 'Speaker diarization and timestamped transcript', ind: true, team: true },
            { name: 'Automated fact-checking & numeric verification', ind: true, team: true },
            { name: 'Direct links to authentic press archives & public registries', ind: true, team: true },
            { name: 'Lead web article generation', ind: true, team: true },
            { name: 'Multi-platform social exports (Telegram, Reels, TikTok)', ind: true, team: true },
            { name: 'Interactive Tiptap editor with 1-click auto-fixes', ind: true, team: true },
            { name: 'Trilingual parity (RU, KZ, EN)', ind: true, team: true }
          ]
        },
        {
          name: 'Collaboration & Governance',
          features: [
            { name: 'Shared newsroom workspace', ind: false, team: true },
            { name: 'Pooled monthly audio hours across team', ind: false, team: true },
            { name: 'Corporate invoicing and tax closing documents', ind: false, team: true },
            { name: 'Priority editorial support', ind: 'Email support', team: 'Dedicated Telegram line' }
          ]
        }
      ]
    }
  }
};
