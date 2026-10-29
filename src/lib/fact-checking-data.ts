import { FactCheckItem } from './types';

export const FACT_CHECK_ITEMS: FactCheckItem[] = [
  {
    id: 'fc-1',
    time: '0:42',
    speaker: 'Kanat Yskakov',
    textBefore: 'This year, as part of a ',
    underlinedPhrase: 'special initiative',
    textMid: ', we allocated ',
    highlightedFact: '500 million tenge',
    textAfter: ' in direct grant support for regional media and independent digital editorial offices.',
    factCheckInfo: {
      type: 'discrepancy',
      title: 'Расхождение в сумме бюджета',
      claimed: '500 млн тенге на прямые гранты',
      verified: 'По бюджетной росписи №412 выделено 480 млн ₸. Разница 20 млн ₸ удержана в резерве.',
      source: 'Министерство культуры и информации РК (Бюджет 2026)',
      suggestedFix: '480 млн ₸ (согласно росписи №412)'
    },
    defaultDeclineRed: false,
    defaultApproveGreen: false,
    targetPhrases: {
      ru: '500 млн тенге',
      kz: '500 млн теңгені',
      en: '500 million tenge'
    },
    fixes: {
      ru: {
        replacement: '480 млн ₸ (согласно бюджетной росписи №412, 20 млн ₸ в резерве)',
        footnote: '500 млн тенге *(Примечание редакции: по данным бюджетной росписи №412 Минкульта сумма составляет 480 млн ₸, 20 млн ₸ в резерве)*'
      },
      kz: {
        replacement: '480 млн теңгені (№412 бюджеттік кесте бойынша, 20 млн ₸ резервте)',
        footnote: '500 млн теңгені *(Редакция анықтамасы: №412 ресми бюджеттік кестеге сәйкес нақты грант 480 млн ₸ құрайды)*'
      },
      en: {
        replacement: '480 million tenge (under budget allocation #412, 20M KZT in reserve)',
        footnote: '500 million tenge *(Editorial note: according to official budget allocation #412, the net grant pool is 480M KZT with 20M KZT in reserve)*'
      }
    },
    translations: {
      ru: {
        speaker: 'Канат Ыскаков',
        textBefore: 'В этом году в рамках ',
        underlinedPhrase: 'специальной инициативы',
        textMid: ' мы выделили ',
        highlightedFact: '500 млн тенге',
        textAfter: ' на прямую грантовую поддержку региональных медиа и независимых цифровых редакций.',
        factCheckInfo: {
          type: 'discrepancy',
          title: 'Расхождение в сумме бюджета',
          claimed: '500 млн тенге на прямые гранты',
          verified: 'По бюджетной росписи №412 выделено 480 млн ₸. Разница 20 млн ₸ удержана в резерве.',
          source: 'Министерство культуры и информации РК (Бюджет 2026)'
        }
      },
      kz: {
        speaker: 'Қанат Ысқақов',
        textBefore: 'Биыл біз ',
        underlinedPhrase: 'арнайы бастама',
        textMid: ' аясында өңірлік медиа мен тәуелсіз цифрлық редакцияларға тікелей гранттық қолдау ретінде ',
        highlightedFact: '500 млн теңгені',
        textAfter: ' бөлдік.',
        factCheckInfo: {
          type: 'discrepancy',
          title: 'Бюджет көлеміндегі сәйкессіздік',
          claimed: 'Тікелей гранттарға 500 млн теңге',
          verified: '№412 бюджеттік кесте бойынша 480 млн ₸ бөлінген. 20 млн ₸ айырмашылық резервте қалдырылған.',
          source: 'ҚР Мәдениет және ақпарат министрлігі (2026 бюджеті)'
        }
      },
      en: {
        speaker: 'Kanat Yskakov',
        textBefore: 'This year, as part of a ',
        underlinedPhrase: 'special initiative',
        textMid: ', we allocated ',
        highlightedFact: '500 million tenge',
        textAfter: ' in direct grant support for regional media and independent digital editorial offices.',
        factCheckInfo: {
          type: 'discrepancy',
          title: 'Budget allocation discrepancy',
          claimed: '500 million tenge in direct grants',
          verified: 'Official budget allocation #412 designates 480M ₸. The remaining 20M ₸ is held in reserve.',
          source: 'Ministry of Culture and Information RK (Budget 2026)'
        }
      }
    }
  },
  {
    id: 'fc-2',
    time: '1:18',
    speaker: 'Arman B.',
    textBefore: 'According to our data, over ',
    highlightedFact: '80% of regional newsrooms',
    textMid: ' face severe ',
    underlinedPhrase: 'operational deficits',
    textAfter: ' and applied for urgent digital modernization assistance.',
    factCheckInfo: {
      type: 'unverified',
      title: 'Статистика требует верификации',
      claimed: 'Более 80% региональных редакций',
      verified: 'Независимый аудит Медиа-Альянса подтверждает дефицит у 58% редакций, а не 80%.',
      source: 'Отчет мониторинга региональных медиа Q3',
      suggestedFix: '58% редакций (по независимому аудиту)'
    },
    defaultDeclineRed: false,
    defaultApproveGreen: false,
    targetPhrases: {
      ru: '80% районных изданий',
      kz: 'аудандық басылымдардың 80%-ын',
      en: '80% of regional newsrooms'
    },
    fixes: {
      ru: {
        replacement: 'до 58% районных изданий (согласно аудиту Медиа-Альянса)',
        footnote: '80% районных изданий *(Примечание редакции: независимый аудит Медиа-Альянса оценивает дефицит у 58% редакций)*'
      },
      kz: {
        replacement: 'аудандық басылымдардың 58%-на дейін (Медиа-Альянс аудиті бойынша)',
        footnote: 'аудандық басылымдардың 80%-ын *(Редакция анықтамасы: Медиа-Альянс зерттеуі дефицитті 80% емес, 58% деп бағалайды)*'
      },
      en: {
        replacement: 'up to 58% of regional newsrooms (according to the Media Alliance audit)',
        footnote: '80% of regional newsrooms *(Editorial note: Media Alliance independent audit confirms operational deficits for 58% of newsrooms)*'
      }
    },
    translations: {
      ru: {
        speaker: 'Арман Б.',
        textBefore: 'По нашим данным, из-за ',
        underlinedPhrase: 'операционного дефицита',
        textMid: ' более ',
        highlightedFact: '80% районных изданий',
        textAfter: ' подали заявки на срочную цифровую модернизацию.',
        factCheckInfo: {
          type: 'unverified',
          title: 'Статистика требует верификации',
          claimed: 'Более 80% региональных редакций',
          verified: 'Независимый аудит Медиа-Альянса подтверждает дефицит у 58% редакций, а не 80%.',
          source: 'Отчет мониторинга региональных медиа Q3'
        }
      },
      kz: {
        speaker: 'Арман Б.',
        textBefore: 'Біздің дерегіміз бойынша, ',
        underlinedPhrase: 'операциялық тапшылықтан',
        textMid: ' ',
        highlightedFact: 'аудандық басылымдардың 80%-ын',
        textAfter: ' құрайтын бөлігі шұғыл цифрлық жаңғыртуға өтінім берді.',
        factCheckInfo: {
          type: 'unverified',
          title: 'Статистика тексеруді талап етеді',
          claimed: 'Өңірлік редакциялардың 80%-дан астамы',
          verified: 'Медиа-Альянстың тәуелсіз аудиті тапшылықты 80% емес, 58% редакцияда растайды.',
          source: 'Өңірлік медиа мониторингінің Q3 есебі'
        }
      },
      en: {
        speaker: 'Arman B.',
        textBefore: 'According to our data, over ',
        highlightedFact: '80% of regional newsrooms',
        textMid: ' face severe ',
        underlinedPhrase: 'operational deficits',
        textAfter: ' and applied for urgent digital modernization assistance.',
        factCheckInfo: {
          type: 'unverified',
          title: 'Statistics require verification',
          claimed: 'Over 80% of regional newsrooms',
          verified: 'Independent Media Alliance audit indicates deficits at 58% of newsrooms, not 80%.',
          source: 'Regional Media Monitoring Q3 Report'
        }
      }
    }
  },
  {
    id: 'fc-3',
    time: '2:05',
    speaker: 'Aigul Nurpeisova',
    textBefore: 'The grant application window closes on ',
    highlightedFact: 'November 15, 2026',
    textMid: ', after which an ',
    underlinedPhrase: 'independent jury',
    textAfter: ' will finalize the recipient list within 10 calendar days.',
    factCheckInfo: {
      type: 'verified',
      title: 'Срок подтвержден, регламент уточнен',
      claimed: 'Прием до 15 ноября 2026, итоги за 10 дней',
      verified: 'Дедлайн 15.11 в 18:00 AST верен. Однако регламент выделяет 30 дней на подведение итогов.',
      source: 'Официальный регламент конкурса грантов №14-П',
      suggestedFix: '15 ноября 2026 года (регламент отбора — 30 дней)'
    },
    defaultDeclineRed: false,
    defaultApproveGreen: false,
    targetPhrases: {
      ru: '15 ноября 2026 года',
      kz: '2026 жылғы 15 қарашаға дейін',
      en: 'November 15, 2026'
    },
    fixes: {
      ru: {
        replacement: '15 ноября 2026 года (регламент оценки — 30 дней)',
        footnote: '15 ноября 2026 года *(Примечание редакции: регламент оценки заявок — 30 дней согласно регламенту №14-П)*'
      },
      kz: {
        replacement: '2026 жылғы 15 қарашаға дейін (Астана уақытымен 18:00-ге дейін, іріктеу 30 күн)',
        footnote: '2026 жылғы 15 қарашаға дейін *(Редакция анықтамасы: қабылдау 18:00-ге дейін, №14-П регламенті бойынша қорытынды 30 күн ішінде шығарылады)*'
      },
      en: {
        replacement: 'November 15, 2026 at 18:00 AST (with a 30-day evaluation period)',
        footnote: 'November 15, 2026 *(Editorial note: deadline is 18:00 AST; jury deliberation timeframe is 30 calendar days)*'
      }
    },
    translations: {
      ru: {
        speaker: 'Айгуль Нурпеисова',
        textBefore: 'Прием заявок на гранты завершается ',
        highlightedFact: '15 ноября 2026 года',
        textMid: ', после чего ',
        underlinedPhrase: 'независимое жюри',
        textAfter: ' определит список получателей в течение 10 календарных дней.',
        factCheckInfo: {
          type: 'verified',
          title: 'Срок подтвержден, регламент уточнен',
          claimed: 'Прием до 15 ноября 2026, итоги за 10 дней',
          verified: 'Дедлайн 15.11 в 18:00 AST верен. Однако регламент выделяет 30 дней на подведение итогов.',
          source: 'Официальный регламент конкурса грантов №14-П'
        }
      },
      kz: {
        speaker: 'Айгүл Нұрпейісова',
        textBefore: 'Грантқа құжат қабылдау мерзімі ',
        highlightedFact: '2026 жылғы 15 қарашаға дейін',
        textMid: ' жалғасады, содан кейін ',
        underlinedPhrase: 'тәуелсіз қазылар алқасы',
        textAfter: ' 10 күн ішінде жеңімпаздарды анықтайды.',
        factCheckInfo: {
          type: 'verified',
          title: 'Мерзім расталды, регламент нақтыланды',
          claimed: 'Қабылдау 2026 ж. 15 қарашасына дейін, қорытынды 10 күнде',
          verified: '15.11 сағат 18:00 AST дедлайны дұрыс. Дегенмен регламент қорытынды шығаруға 30 күн береді.',
          source: '№14-П гранттар байқауының ресми регламенті'
        }
      },
      en: {
        speaker: 'Aigul Nurpeisova',
        textBefore: 'The grant application window closes on ',
        highlightedFact: 'November 15, 2026',
        textMid: ', after which an ',
        underlinedPhrase: 'independent jury',
        textAfter: ' will finalize the recipient list within 10 calendar days.',
        factCheckInfo: {
          type: 'verified',
          title: 'Deadline confirmed, timeline clarified',
          claimed: 'Applications until Nov 15, 2026; 10 days for review',
          verified: 'Deadline Nov 15 at 18:00 AST is correct. However, regulation allocates 30 days for results.',
          source: 'Official Grant Competition Regulation #14-P'
        }
      }
    }
  },
  {
    id: 'fc-4',
    time: '2:45',
    speaker: 'Dastan Sadykov',
    textBefore: 'Under the revised tax provisions, ',
    underlinedPhrase: 'tax exemptions',
    textMid: ' will be applied to ',
    highlightedFact: '100% of awarded grant funds',
    textAfter: ' for all regional editorial staff and local contractors.',
    factCheckInfo: {
      type: 'discrepancy',
      title: 'Налогообложение грантовых средств',
      claimed: '100% освобождение от налогов всех полученных грантов',
      verified: 'Согласно ст. 289 НК РК, грант освобождается от КПН, однако выплаты физлицам облагаются ИПН (10%) и соцналогом.',
      source: 'Налоговый кодекс РК (ст. 289, 319) и разъяснение КГД МФ РК',
      suggestedFix: 'Освобождение от КПН (выплаты физлицам облагаются ИПН 10%)'
    },
    defaultDeclineRed: false,
    defaultApproveGreen: false,
    targetPhrases: {
      ru: '100% полученных грантов',
      kz: 'барлық гранттар',
      en: '100% of awarded grant funds'
    },
    fixes: {
      ru: {
        replacement: 'целевых средств гранта (освобождаются от КПН по ст. 289 НК РК, выплаты физлицам облагаются 10% ИПН)',
        footnote: 'всех грантов *(Примечание редакции: освобождение касается только КПН; с выплат физлицам удерживается 10% ИПН и соцналог)*'
      },
      kz: {
        replacement: 'мақсатты грант қаражаты (Салық кодексінің 289-бабына сай КТС-тен босатылады, жеке тұлғаларға төлемдер 10% ЖТС-ке жатады)',
        footnote: 'барлық гранттар *(Редакция анықтамасы: КТС-тен босатылады, бірақ жеке тұлғаларға төлемдерге 10% ЖТС салынады)*'
      },
      en: {
        replacement: 'qualifying grant allocations (exempt from CIT, while personal payouts remain subject to 10% PIT)',
        footnote: '100% of awarded grant funds *(Editorial note: grants are exempt from CIT under Art. 289, but contractor fees incur 10% PIT)*'
      }
    },
    translations: {
      ru: {
        speaker: 'Дастан Садыков',
        textBefore: 'Согласно обновленным налоговым нормам, ',
        underlinedPhrase: 'налоговые льготы',
        textMid: ' распространяются на ',
        highlightedFact: '100% полученных грантов',
        textAfter: ' для всех сотрудников региональных редакций и подрядчиков.',
        factCheckInfo: {
          type: 'discrepancy',
          title: 'Налогообложение грантовых средств',
          claimed: '100% освобождение от налогов всех полученных грантов',
          verified: 'Согласно ст. 289 НК РК, грант освобождается от КПН, однако выплаты физлицам облагаются ИПН (10%) и соцналогом.',
          source: 'Налоговый кодекс РК (ст. 289, 319) и разъяснение КГД МФ РК'
        }
      },
      kz: {
        speaker: 'Дастан Садықов',
        textBefore: 'Жаңартылған салық нормаларына сай, ',
        underlinedPhrase: 'салықтық жеңілдіктер',
        textMid: ' өңірлік редакциялар мен мердігерлердің ',
        highlightedFact: 'барлық гранттар',
        textAfter: ' бойынша қаражатына толық қолданылады.',
        factCheckInfo: {
          type: 'discrepancy',
          title: 'Грант қаражатына салық салу',
          claimed: 'Барлық алынған гранттар 100% салықтан босатылады',
          verified: 'Салық кодексінің 289-бабына сай грант КТС-тен босатылады, бірақ жеке тұлғаларға төлемдер 10% ЖТС және әлеуметтік салыққа жатады.',
          source: 'ҚР Салық кодексі (289, 319-баптар) және ҚР ҚМ МКК түсіндірмесі'
        }
      },
      en: {
        speaker: 'Dastan Sadykov',
        textBefore: 'Under the revised tax provisions, ',
        underlinedPhrase: 'tax exemptions',
        textMid: ' will be applied to ',
        highlightedFact: '100% of awarded grant funds',
        textAfter: ' for all regional editorial staff and local contractors.',
        factCheckInfo: {
          type: 'discrepancy',
          title: 'Taxation of grant funds',
          claimed: '100% tax exemption for all awarded grant funds',
          verified: 'Under Art. 289 of the Tax Code, grants are exempt from CIT, but individual payouts are subject to 10% PIT and social tax.',
          source: 'Tax Code of the Republic of Kazakhstan (Arts. 289, 319)'
        }
      }
    }
  }
];
