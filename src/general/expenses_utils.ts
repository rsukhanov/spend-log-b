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