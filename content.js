const CONTENT = {
  theme: { primary: "#4a8f6f", primaryHover: "#3b755a", tg: "#229ED9", wa: "#25D366" },
  seo: { title: "Игорь Шамшин | Мио-фасциальная остеокоррекция", description: "Авторская практика. 20+ лет опыта.", ogImage: "" },
  
  analytics: { yandexMetrika: "", googleAnalytics: "" },
  onlineBooking: { enabled: false, text: "Записаться онлайн", link: "" },
  
  settings: { 
    dataCollectionEnabled: false, 
    showAllMessengersInsideMax: true, 
    osteoThreshold: 35,
    showLocations: true, showGift: true, showNews: true, showCases: true, showPricing: true
  },
  
  leadForm: { 
    enabled: true, 
    title: "Остались вопросы?", 
    subtitle: "Оставьте имя и телефон — я свяжусь с вами.", 
    privacyText: "Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности.", 
    tgUsername: "se14074027_bot", 
    waPhone: "+79951149954", 
    maxBot: "se14074027_bot" 
  },
  
  links: { 
    max: "https://max.ru/se14074027_bot", 
    test: "https://shamshinigor78-pixel.github.io/max-selfcheck/", 
    landing: "https://shamshinigor78-pixel.github.io/max-selfcheck/landing.html", 
    privacy: "https://shamshinigor78-pixel.github.io/max-selfcheck/privacy.html", 
    phone: "tel:+79951149954", 
    phoneText: "+7 (995) 114-99-54", 
    tg: "https://t.me/ТВОЙ_НИК", 
    wa: "https://wa.me/79951149954" 
  },

  priceButtons: [
    { text: "Записаться в WhatsApp", type: "wa", link: "https://wa.me/79951149954" },
    { text: "Записаться в Telegram", type: "tg", link: "https://t.me/ТВОЙ_НИК" },
    { text: "Записаться в MAX", type: "primary", link: "https://max.ru/se14074027_bot" }
  ],

  messengerButtons: [
    { text: "Написать в Telegram", type: "tg", link: "https://t.me/ТВОЙ_НИК" },
    { text: "Написать в WhatsApp", type: "wa", link: "https://wa.me/79951149954" },
    { text: "Написать в MAX", type: "primary", link: "https://max.ru/se14074027_bot" }
  ],

  app: {
    title: "Самодиагностика", subtitle: "Ответь на 15 вопросов...", btnStart: "Начать", btnRestart: "Пройти заново", btnClose: "Закрыть", hint: "Это не медицинская диагностика.", browserNote: "Вы проходите тест в браузере...", privacyList: ["Ответы не сохраняются..."], normalTitle: "Отличный баланс!", normalVerdict: "Серьёзных сигналов нет", normalBody: "Состояние хорошее...", osteoTitle: "Нужна перезагрузка", osteoVerdict: "Есть сигналы напряжения", osteoBody: "Есть зоны, где не хватает расслабления...", doctorTitle: "Лучше к врачу", doctorVerdict: "Есть нюансы", doctorBody: "Обратитесь к терапевту...", btnWriteTitle: "Написать мне", btnWriteHint: "Выберите мессенджер:", btnCall: "Позвонить мне", callNote: "Ответит секретарь...", methodTitle: "Узнать о методике", methodBtn: "Подробнее"
  },

  questions: [
    { type: "osteo", profile: "neck", text: "Где дискомфорт?", options: ["Шея", "Поясница", "Таз", "Всё тело"], weights: [4, 4, 3, 3] },
    { type: "redflag", text: "Была ли травма?", options: ["Нет", "Да"], weights: [1, 5] }
  ],

  landing: {
    heroTitle: "Верните легкость", heroText: "Авторская практика...", btnTestAgain: "Пройти тест", callNote: "Ответит секретарь...", compareTitle: "Почему 1 сеанс лучше?", compareText: "Массаж работает с мышцами...", compareBadTitle: "Обычный массаж", compareBadList: ["Поверхностно", "Боль на 2 дня"], compareGoodTitle: "У меня", compareGoodList: ["Глубоко", "Надолго"], expertTitle: "Экспертность", expertText: "Забота о теле...", expertFooter: "Использую опыт...", expertCards: [{icon:"🏥", title:"Нейрохирургия", text:"Опыт работы..."}], trustTitle: "Доверие", trustText: "20 лет опыта...", resultsTitle: "Результаты", resultsText: "Что меняется...", resultsCards: [{icon:"✨", title:"Лицо", text:"Без отеков"}], locationsTitle: "Локации", locationsText: "Выберите...", locationsBtnMap: "Маршрут", locationsCards: [{city:"Москва", title:"Китай-город", text:"Уютно", price:"8000", img:"", mapLink:"https://yandex.ru"}], pricingTitle: "Стоимость", pricingName: "Сеанс", pricingDuration: "60 мин", pricingPrice: "8000", pricingDesc: "Это работа...", giftTitle: "Подарок", giftText: "Гайд", giftSubtext: "Техники", giftNote: "Напишите ГАЙД", newsTitle: "Новости", newsText: "Анонсы", newsCards: [{date:"1 мая", title:"Гастроли", text:"Скоро"}], casesTitle: "Кейсы", casesCards: [{title:"Мария", complaints:"Боли", result:"Легче", img:""}], footerDisclaimer: "Не медицинская диагностика."
  }
};
