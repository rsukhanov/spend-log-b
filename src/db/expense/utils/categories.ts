const expenses_categories: Record<string, string[]> = {
  // аренда, коммуналка
   HOUSING: [ 
      "RENT",
      "MORTGAGE",
      'UTILITIES',
      "SUBSCRIPTIONS",
      "INSURANCE",
      "REPAIRS"
   ],

  // такси, транспорт, авто
  TRANSPORT: [
    "TAXI",
    "PUBLIC_TRANSPORT",
    "FUEL",
    "CAR_MAINTENANCE",
    "CAR_INSURANCE",
    "PARKING"
  ],

  // продукты, рестораны
  FOOD: [
    "GROCERIES",
    "DINING_OUT",
    "COFFEE_SNACKS",
    "FAST_FOOD"
  ],

  // медицина, аптека
  HEALTH: [
    "MEDICINES",
    "DOCTOR",
    "PERSONAL_CARE_SERVICES"
  ],
  
  // одежда, уход, личные покупки
  PERSONAL: [
    "CLOTHING",
    "COSMETICS",
    "PERSONAL_SHOPPING",
    "SELF_EDUCATION",
    "SELF_DEVELOPMENT"
  ],
  
  // досуг, игры, развлечения
  ENTERTAINMENT: [
    "MOVIES_CONCERTS",
    "COMPUTER_GAMES",
    "ALCOHOL",
    "SMOKING",
    "GAMBLING",
    "HOBBIES",
  ],
  
  // поездки, отдых
  TRAVEL: [
    "HOTELS",
    "FLIGHTS",
    "TOURS_ACTIVITIES",
    "TRAVEL_RESTAURANTS",
    "TRAVEL_TRANSPORT",
  ],
  
  // кредиты, налоги, сбережения
  FINANCIAL: [
    "LOAN",
    "TAXES",
    "SAVINGS_INVESTMENTS",
    "BANK_FEES",
  ],

  // дети, семья, животные
  FAMILY_PETS: [
    "CHILDREN",
    "EDUCATION",
    "HOME_PETS",
    "DONATIONS_PRESENTS",
  ],

  OTHER: [
    "FORCED_PURCHASES",
    "EMOTIONAL_PURCHASES",
    "OTHER",
  ]
}

export const getMainCategory = (subCategory: string) => {
  for (const mainCategory in expenses_categories) {
    if (expenses_categories[mainCategory].includes(subCategory)){
      return mainCategory
    }
  }
  return null
}

export const getSubCategoriesList = () => {
  const allSubCategories: string[] = [];
  for (const category in expenses_categories) {
    allSubCategories.push(...expenses_categories[category]);
  }
  return allSubCategories;
}

export const CATEGORY_NAMES: Record<string, string> = {
  HOUSING: 'Жилье',
  TRANSPORT: 'Транспорт',
  FOOD: 'Еда',
  HEALTH: 'Здоровье',
  PERSONAL: 'Личное',
  ENTERTAINMENT: 'Развлечения',
  TRAVEL: 'Путешествия',
  FINANCIAL: 'Финансы',
  FAMILY_PETS: 'Семья',
  OTHER: 'Другое'
}

export const EXPENSE_SUB_CATEGORIES: Record<string, string> = {
  // --- ЖИЛЬЕ И КОММУНАЛЬНЫЕ УСЛУГИ ---
  "RENT": "Аренда жилья",
  "MORTGAGE": "Ипотека / Кредит на жильё",
  "UTILITIES": "Коммунальные услуги",
  "SUBSCRIPTIONS": "Подписки (Netflix, Spotify и т.д.)",
  "INSURANCE": "Страхование (жилья, жизни)",
  "REPAIRS": "Ремонт и обслуживание жилья",

  // --- ТРАНСПОРТ ---
  "TAXI": "Такси / Поделиться поездкой",
  "PUBLIC_TRANSPORT": "Общественный транспорт",
  "FUEL": "Топливо / Зарядка авто",
  "CAR_MAINTENANCE": "Обслуживание и ремонт авто",
  "CAR_INSURANCE": "Страхование авто",
  "PARKING": "Парковка и платные дороги",

  // --- ЕДА И ПИТАНИЕ ---
  "GROCERIES": "Продукты питания",
  "DINING_OUT": "Рестораны / Кафе",
  "COFFEE_SNACKS": "Кофе / Снеки на ходу",
  "FAST_FOOD": "Фастфуд",

  // --- ЗДОРОВЬЕ И УХОД ---
  "MEDICINES": "Лекарства / Аптека",
  "DOCTOR": "Приём врача / Медицинские услуги",
  "PERSONAL_CARE_SERVICES": "Уход за собой (Салон, Барбершоп)",

  // --- ЛИЧНЫЕ РАСХОДЫ И РАЗВИТИЕ ---
  "CLOTHING": "Одежда и обувь",
  "COSMETICS": "Косметика и гигиена",
  "PERSONAL_SHOPPING": "Личные покупки",
  "SELF_EDUCATION": "Самообразование / Курсы",
  "SELF_DEVELOPMENT": "Саморазвитие / Книги",

  // --- ДОСУГ И РАЗВЛЕЧЕНИЯ ---
  "MOVIES_CONCERTS": "Кино / Концерты / Театр",
  "COMPUTER_GAMES": "Компьютерные игры / Игровой контент",
  "ALCOHOL": "Алкоголь",
  "SMOKING": "Курение / Вейпинг",
  "GAMBLING": "Азартные игры / Лотереи",
  "HOBBIES": "Хобби / Спортивный инвентарь",

  // --- ПУТЕШЕСТВИЯ И ОТДЫХ ---
  "HOTELS": "Проживание / Отели",
  "FLIGHTS": "Авиабилеты / Поезда",
  "TOURS_ACTIVITIES": "Туры / Экскурсии",
  "TRAVEL_RESTAURANTS": "Питание в поездках",
  "TRAVEL_TRANSPORT": "Транспорт в поездках",

  // --- ФИНАНСЫ И ДОЛГИ ---
  "LOAN": "Выплата кредитов / Долгов",
  "TAXES": "Налоги и сборы",
  "SAVINGS_INVESTMENTS": "Накопления / Инвестиции",
  "BANK_FEES": "Банковские комиссии / Обслуживание счета",

  // --- СЕМЬЯ И БЛИЗКИЕ ---
  "CHILDREN": "Детские товары и расходы",
  "EDUCATION": "Образование (школа, секции)",
  "HOME_PETS": "Домашние животные / Товары для них",
  "DONATIONS_PRESENTS": "Подарки / Пожертвования",

  // --- НЕПРЕДВИДЕННЫЕ ---
  "FORCED_PURCHASES": "Вынужденные покупки / Неотложка",
  "EMOTIONAL_PURCHASES": "Эмоциональные / Спонтанные покупки",
  "OTHER": "Прочее / Неизвестно",
};