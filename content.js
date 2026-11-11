window.CONTENT = {
  version: "2.2.1",
  theme: { primary: "#4a8f6f", primaryHover: "#3b755a", tg: "#229ED9", wa: "#25D366" },
  seo: { title: "Игорь Шамшин | Мио-фасциальная остеокоррекция", description: "Авторская практика. 20+ лет опыта.", ogImage: "https://shamshinigor78-pixel.github.io/max-selfcheck/igor.jpg" },
  analytics: { yandexMetrika: "", googleAnalytics: "" },
  settings: {
    dataCollectionEnabled: false, showAllMessengersInsideMax: true, osteoThreshold: 30,
    showLocations: true, showPricing: true, showGift: true, showNews: true, showCases: true, showEducation: true, showFloatingButton: true
  },
  links: {
    max: "https://max.ru/se14074027_bot", test: "https://shamshinigor78-pixel.github.io/max-selfcheck/",
    landing: "https://shamshinigor78-pixel.github.io/max-selfcheck/landing.html",
    privacy: "https://shamshinigor78-pixel.github.io/max-selfcheck/privacy.html",
    phone: "tel:+79951149954", phoneText: "+7 (995) 114-99-54", tg: "", wa: "https://wa.me/79951149954"
  },
  leadForm: { enabled: false, title: "", subtitle: "", privacyText: "", tgUsername: "", waPhone: "", maxBot: "" },
  cookieBanner: { text: "Мы используем cookie для аналитики.", acceptText: "Принять", declineText: "Отклонить" },
  floatingButton: { title: "Связаться со мной", subtitle: "Выберите удобный способ:" },

  app: {
    title: "Самодиагностика", subtitle: "16 вопросов о вашем теле. Оценим зоны напряжения и составим план действий.",
    btnStart: "Начать тест", btnBack: "← Назад", btnRestart: "Пройти заново", btnClose: "Закрыть",
    hint: "Это не медицинская диагностика. Результат носит ознакомительный характер.",
    browserNote: "Вы проходите тест в браузере.",
    privacyList: ["Ответы не сохраняются.", "Данные исчезают при закрытии.", "Нет доступа к камере и геолокации."],
    
    normalTitle: "Отличный баланс!", normalVerdict: "Серьёзных сигналов не обнаружено",
    normalBody: "Судя по вашим ответам, тело в порядке. Проходите опрос раз в 2–3 месяца для профилактики.",
    
    osteoTitle: "Есть зоны напряжения", osteoVerdict: "Телу нужна перезагрузка",
    osteoBody: "Ваши ответы указывают на участки, где фасции и мышцы зажаты. Это не болезнь, а сигнал о том, что телу нужна помощь. С этим бережно работает остеокоррекция.",
    
    doctorTitle: "Рекомендована консультация врача", doctorVerdict: "Есть нюансы, требующие внимания",
    doctorBody: "Некоторые ваши ответы указывают на симптомы, с которыми сначала нужно обратиться к неврологу или терапевту, чтобы исключить противопоказания. Если станет плохо — звоните 103.",

    prizeTitle: "Твой персональный разбор",
    guideBox: "🎁 Напишите мне в мессенджер и пришлите скриншот результата — я подскажу, как помочь именно вашей зоне.",
    warningText: "Вы отметили серьёзный симптом. Рекомендую перед сеансом проконсультироваться с врачом.",
    btnWriteTitle: "Написать мне", btnWriteHint: "Выберите мессенджер:",
    btnWriteMax: "Написать в MAX", btnWriteTg: "Написать в Telegram", btnWriteWa: "Написать в WhatsApp", btnCall: "Позвонить мне",
    callNote: "Если я на сеансе, ответит секретарь.", 
    methodTitle: "Узнать о методике", methodBtn: "Подробнее на сайте",
    
    profiles: {
      neck: "Профиль «Офисная шея». Голова уходит вперед, фасции шеи и груди сжимаются. Нужно мягко раскрыть грудную клетку.",
      lower_back: "Профиль «Зажатая поясница». Напряжение в нижней части спины из-за сидения или нагрузок.",
      pelvis: "Профиль «Перекос таза». Ось смещена, одна сторона тела работает больше.",
      scar: "Профиль «Скрытые спайки». Рубцы стягивают фасции, вызывая перекосы.",
      jaw: "Профиль «Зажатая челюсть». Спазм жевательных мышц часто дает головные боли и зажимы шеи.",
      radiculopathy: "Профиль «Корешковый синдром». Есть прострелы, похожие на зажатие нерва (грыжа/протрузия). Мы можем мягко снять мышечный спазм, чтобы убрать давление.",
      general: "Профиль «Внутренний марафон». Нервная система в напряжении, тело зажато, как пружина."
    }
  },

  questions: [
    { type: "osteo", includeInScore: false, forceOutcome: "osteo", text: "Где вы чаще всего чувствуете дискомфорт?",
      options: [
        { text: "Шея и плечи", weight: 4, profile: "neck" },
        { text: "Поясница", weight: 4, profile: "lower_back" },
        { text: "Таз и бедра", weight: 3, profile: "pelvis" },
        { text: "Живот и диафрагма", weight: 3 },
        { text: "Всё тело (системное напряжение)", weight: 5, forceOutcome: "osteo" }
      ] },
    { type: "osteo", text: "Как бы вы описали эти ощущения?",
      options: [
        { text: "Тупая, ноющая боль", weight: 3 },
        { text: "Чувство скованности, как в тисках", weight: 4 },
        { text: "Простреливающая, отдает в руку/ногу", weight: 5, profile: "radiculopathy" },
        { text: "Жжение, покалывание", weight: 4 },
        { text: "Дискомфорта нет", weight: 1 }
      ] },
    { type: "osteo", text: "Замечаете ли вы асимметрию? (лямка спадает, одна нога короче)",
      options: [{ text: "Нет", weight: 1 }, { text: "Возможно", weight: 2 }, { text: "Иногда", weight: 3 }, { text: "Да", weight: 4 }, { text: "Выраженная", weight: 5 }] },
    { type: "osteo", text: "Когда дискомфорт дает о себе знать чаще?",
      options: [{ text: "После долгого сидения", weight: 4 }, { text: "Утром после сна", weight: 4 }, { text: "При наклонах/поворотах", weight: 4 }, { text: "После нагрузки", weight: 3 }, { text: "Не усиливается", weight: 1 }] },
    { type: "osteo", text: "Ухудшается ли состояние при смене погоды или стрессе?",
      options: [{ text: "Никогда", weight: 1 }, { text: "Редко", weight: 2 }, { text: "Иногда", weight: 3 }, { text: "Часто", weight: 4 }, { text: "Постоянно", weight: 5 }] },
    { type: "osteo", text: "Сжимаете ли вы зубы днем или скрипите ночью?",
      options: [{ text: "Нет", weight: 1 }, { text: "Иногда", weight: 3 }, { text: "Да, постоянно", weight: 5, profile: "jaw" }] },
    { type: "osteo", text: "Получается ли сделать глубокий вдох животом, или дышите только грудью?",
      options: [{ text: "Дышу легко и глубоко", weight: 1 }, { text: "С трудом", weight: 3 }, { text: "Нет, грудная клетка зажата", weight: 5 }] },
    { type: "osteo", text: "Достаете ли вы руками до пола, не сгибая ног?",
      options: [{ text: "Да, легко", weight: 1 }, { text: "С усилием", weight: 2 }, { text: "С трудом", weight: 3 }, { text: "Почти нет", weight: 4 }, { text: "Не могу", weight: 5 }] },
    { type: "osteo", text: "Ограничены ли повороты головы?",
      options: [{ text: "Нет", weight: 1 }, { text: "Небольшие", weight: 2 }, { text: "Умеренные", weight: 3 }, { text: "Заметные", weight: 4 }, { text: "Сильные", weight: 5 }] },
    { type: "osteo", text: "Есть ли дискомфорт при поднятии рук вверх?",
      options: [{ text: "Никогда", weight: 1 }, { text: "Редко", weight: 2 }, { text: "Иногда", weight: 3 }, { text: "Часто", weight: 4 }, { text: "Постоянно", weight: 5 }] },
    { type: "osteo", text: "Есть ли рубцы или операции в прошлом?",
      options: [{ text: "Нет", weight: 1 }, { text: "Старые, не беспокоят", weight: 2 }, { text: "Есть, чувствую натяжение", weight: 4, profile: "scar" }, { text: "Были недавно", weight: 5, profile: "scar" }] },
    { type: "osteo", text: "Какой у вас образ жизни?",
      options: [{ text: "Сидячая работа", weight: 4 }, { text: "Физический труд", weight: 3 }, { text: "Спорт", weight: 2 }, { text: "Смешанный", weight: 3 }, { text: "Малоподвижный", weight: 5 }] },
    
    { type: "redflag", text: "Была ли серьёзная травма, перелом или операция за последние 6 месяцев?",
      options: [{ text: "Нет", redflag: false }, { text: "Да", redflag: true }] },
    { type: "redflag", text: "Бывает ли внезапное онемение одной стороны тела, асимметрия лица или проблемы с речью?",
      options: [{ text: "Нет", redflag: false }, { text: "Да", redflag: true }] },
    { type: "redflag", text: "Есть ли необъяснимая потеря веса или внезапная слабость в конечностях?",
      options: [{ text: "Нет", redflag: false }, { text: "Да", redflag: true }] }
  ],

  landing: {
    heroTitle: "Верните телу природную легкость", heroText: "Авторская мио-фасциальная практика от Игоря Шамшина. 20+ лет опыта.",
    heroImage: "igor.jpg", btnTestAgain: "Пройти тест еще раз", callNote: "Если я на сеансе, ответит секретарь.",
    btnWriteMax: "Написать в MAX", btnWriteTg: "Написать в Telegram", btnWriteWa: "Написать в WhatsApp", btnCall: "Позвонить мне",
    compareTitle: "Почему 1 сеанс эффективнее курса массажа?", compareText: "Классический массаж работает с мышцами. Игорь работает с первопричиной.",
    compareBadTitle: "Обычный массаж", compareBadList: ["Поверхностно", "Болит шея — массируют шею", "Облегчение на 2 дня"],
    compareGoodTitle: "У Игоря", compareGoodList: ["Глубоко", "Ищет первопричину", "Накопительный эффект"],
    comparePrice: "Сеанс стоит 8 000 ₽, потому что это тонкая настройка тела.",
    expertTitle: "Экспертность", expertText: "Знания и опыт.", expertFooter: "Помогаю возвращать легкость.",
    expertCards: [{ icon: "🏥", title: "Нейрохирургия", text: "Опыт работы." }, { icon: "🏆", title: "Спорт", text: "Работа с атлетами." }, { icon: "📜", title: "20+ лет", text: "В медицине." }],
    trustTitle: "Почему мне доверяют", trustText: "Более 20 лет в восстановительной медицине.",
    educationTitle: "Образование", educationText: "Постоянное обучение.", educationCards: [{ icon: "🎓", title: "Медобразование", text: "База." }, { icon: "🖐", title: "Остеопластика", text: "У Виталия Кима." }],
    resultsTitle: "Что меняется после 2–3 сеансов?", resultsText: "Уходит напряжение.", resultsCards: [{ icon: "✨", title: "Лицо", text: "Без отеков." }, { icon: "🦴", title: "Спина", text: "Без сутулости." }],
    locationsTitle: "География приема", locationsText: "Выберите локацию для маршрута.",
    locationsBtnMap: "Маршрут", locationsBtnBook: "Записаться",
    locationsCards: [
      { icon: "📍", city: "Москва", title: "м. Китай-город", metro: "Китай-город", address: "", schedule: "", price: "8 000 ₽", text: "Уютный кабинет.", features: [], img: "loc-center.jpg", mapLink: "https://yandex.ru/maps/?text=Москва" },
      { icon: "🌿", city: "Москва", title: "м. Сокольники", metro: "Сокольники", address: "", schedule: "", price: "8 000 ₽", text: "Зеленая зона.", features: ["Парковка"], img: "loc-sokolniki.jpg", mapLink: "https://yandex.ru/maps/?text=Москва" }
    ],
    pricingTitle: "Стоимость", pricingName: "Сеанс остеокоррекции", pricingDuration: "60 или 120 минут", pricingPrice: "от 6 000 ₽", pricingDesc: "Индивидуальный подход.",
    priceButtons: [{ text: "Записаться", type: "primary", link: "https://max.ru/se14074027_bot" }],
    giftTitle: "Подарок", giftText: "Гайд по разгрузке.", giftSubtext: "Мягкие техники.", giftNote: "Напишите слово ГАЙД.",
    newsTitle: "Новости", newsText: "Анонсы.", newsCards: [{ date: "15 мая", title: "Гастроли", text: "Скоро в Волгограде." }],
    casesTitle: "Истории клиентов", casesCards: [{ title: "Екатерина", complaints: "Шея", result: "Легче.", img: "" }],
    footerDisclaimer: "Не заменяет медицинскую диагностику."
  }
};
