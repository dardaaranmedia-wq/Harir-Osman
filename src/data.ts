import { Category, Product, ProductionStation, Table, User, UserRole } from "./types";

export const INITIAL_PRODUCTION_STATIONS: ProductionStation[] = [
  { id: "station-kitchen", name: "Kitchen Station" },
  { id: "station-bar", name: "Bar Station" },
  { id: "station-coffee", name: "Coffee Station" },
  { id: "station-juice", name: "Juice Station" },
  { id: "station-dessert", name: "Dessert Station" },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-smoothies", name: "Smoothies", icon: "GlassWater", image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-main", name: "Main Selections", icon: "Utensils", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-burgers", name: "Burgers", icon: "ShoppingBag", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-sandwiches", name: "Sandwiches", icon: "Flame", image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-pizza", name: "Pizza", icon: "ChefHat", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-mojitos", name: "Mojitos", icon: "GlassWater", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-tea-coffee", name: "Tea & Coffee", icon: "Coffee", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400" },
];

export const INITIAL_PRODUCTS: Product[] = [
  // SMOOTHIES
  {
    id: "prod-caana-muus",
    name: "Caana Muus",
    categoryId: "cat-smoothies",
    price: 3.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1571006886908-0bf3f7bc4d4e?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-caana-laws",
    name: "Caana Laws",
    categoryId: "cat-smoothies",
    price: 3.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-smoothie-strawberry",
    name: "Strawberry",
    categoryId: "cat-smoothies",
    price: 4.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-smoothie-mango",
    name: "Mango",
    categoryId: "cat-smoothies",
    price: 4.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-smoothie-xalib",
    name: "Xalib",
    categoryId: "cat-smoothies",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-smoothie-watermelon",
    name: "Watermelon",
    categoryId: "cat-smoothies",
    price: 3.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-smoothie-cocktail",
    name: "Cocktail",
    categoryId: "cat-smoothies",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-smoothie-orange",
    name: "Orange",
    categoryId: "cat-smoothies",
    price: 3.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=400"
  },

  // MAIN SELECTIONS
  {
    id: "prod-hilib-geel",
    name: "Hilib Geel",
    categoryId: "cat-main",
    price: 9.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-hilib-ari",
    name: "Hilib Ari",
    categoryId: "cat-main",
    price: 9.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-hanid",
    name: "Hanid",
    categoryId: "cat-main",
    price: 10.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-dhaylo",
    name: "Dhaylo",
    categoryId: "cat-main",
    price: 8.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-suqaar-hafaayn",
    name: "Suqaar Hafaayn",
    categoryId: "cat-main",
    price: 8.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-chicken-suqaar",
    name: "Chicken Suqaar",
    categoryId: "cat-main",
    price: 7.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-chicken-curry",
    name: "Chicken Curry",
    categoryId: "cat-main",
    price: 7.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-fish-curry",
    name: "Fish Curry",
    categoryId: "cat-main",
    price: 8.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-grilled-fish",
    name: "Grilled Fish",
    categoryId: "cat-main",
    price: 9.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-fish-finger",
    name: "Fish Finger",
    categoryId: "cat-main",
    price: 7.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-fish-masala",
    name: "Fish Masala",
    categoryId: "cat-main",
    price: 8.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-chicken-chips",
    name: "Chicken Chips",
    categoryId: "cat-main",
    price: 6.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-chicken-crispy",
    name: "Chicken Crispy",
    categoryId: "cat-main",
    price: 7.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-quesadilla",
    name: "Quesadilla",
    categoryId: "cat-main",
    price: 6.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-burrito",
    name: "Burrito",
    categoryId: "cat-main",
    price: 6.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-sambusa",
    name: "sambusa",
    categoryId: "cat-main",
    price: 1.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&q=80&w=400"
  },

  // BURGERS
  {
    id: "prod-burger-chicken",
    name: "Chicken Burger",
    categoryId: "cat-burgers",
    price: 5.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-burger-fish",
    name: "Fish Burger",
    categoryId: "cat-burgers",
    price: 5.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-burger-beef",
    name: "Beef Burger",
    categoryId: "cat-burgers",
    price: 6.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400"
  },

  // SANDWICHES
  {
    id: "prod-sandwich-fish",
    name: "Fish Sandwich",
    categoryId: "cat-sandwiches",
    price: 5.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-sandwich-chicken",
    name: "Chicken Sandwich",
    categoryId: "cat-sandwiches",
    price: 5.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=400"
  },

  // PIZZA
  {
    id: "prod-pizza-large",
    name: "Pizza Large",
    categoryId: "cat-pizza",
    price: 12.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-pizza-medium",
    name: "Pizza Medium",
    categoryId: "cat-pizza",
    price: 9.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-pizza-small",
    name: "Pizza Small",
    categoryId: "cat-pizza",
    price: 7.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400"
  },

  // MOJITOS
  {
    id: "prod-mojito-blueberry",
    name: "Blueberry Mojito",
    categoryId: "cat-mojitos",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-mojito-blue",
    name: "Blue Mojito",
    categoryId: "cat-mojitos",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-mojito-strawberry",
    name: "Strawberry Mojito",
    categoryId: "cat-mojitos",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-mojito-pineapple",
    name: "Pineapple Mojito",
    categoryId: "cat-mojitos",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-mojito-passion",
    name: "Passion Fruit Mojito",
    categoryId: "cat-mojitos",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-mojito-mango",
    name: "Mango Mojito",
    categoryId: "cat-mojitos",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-mojito-raspberry",
    name: "Raspberry Mojito",
    categoryId: "cat-mojitos",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400"
  },

  // TEA & COFFEE
  {
    id: "prod-coffee-latte",
    name: "Caffè Latte",
    categoryId: "cat-tea-coffee",
    price: 4.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-cappuccino",
    name: "Cappuccino",
    categoryId: "cat-tea-coffee",
    price: 4.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-chaidaawa",
    name: "Chai Daawa",
    categoryId: "cat-tea-coffee",
    price: 3.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-tea",
    name: "Tea",
    categoryId: "cat-tea-coffee",
    price: 2.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-limotea",
    name: "Limo Tea",
    categoryId: "cat-tea-coffee",
    price: 2.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-greentea",
    name: "Green Tea",
    categoryId: "cat-tea-coffee",
    price: 2.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-espresso",
    name: "Espresso",
    categoryId: "cat-tea-coffee",
    price: 2.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1510591509382-7434e0b2d6f0?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-macchiato",
    name: "Macchiato",
    categoryId: "cat-tea-coffee",
    price: 3.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-icecoffee",
    name: "Ice Coffee",
    categoryId: "cat-tea-coffee",
    price: 4.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-spanishlatte",
    name: "Spanish Latte",
    categoryId: "cat-tea-coffee",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-icecaramellatte",
    name: "Ice Caramel Latte",
    categoryId: "cat-tea-coffee",
    price: 4.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prod-coffee-frappuccino",
    name: "Frappuccino",
    categoryId: "cat-tea-coffee",
    price: 5.0,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400"
  }
];

// Generate Tables 1 to 50
export const getInitialTables = (): Table[] => {
  const tables: Table[] = [];
  for (let i = 1; i <= 50; i++) {
    const tableNum = i.toString().padStart(2, "0");
    const uniqueId = `LUNA-T${tableNum}`;
    tables.push({
      id: tableNum,
      tableId: uniqueId,
      name: `Table ${tableNum}`,
      qrUrl: `https://order.lunacafe.com/table/${uniqueId}`,
      status: "available",
      isEnabled: true,
      assignedWaiter: "",
    });
  }
  return tables;
};

// Initial system accounts
export const INITIAL_USERS: User[] = [
  {
    id: "u-dev",
    username: "harirosman25@gmail.com",
    password: "Harirdev12@@",
    name: "Hari Rosman",
    role: UserRole.DEVELOPER,
    isActive: true,
  },
  {
    id: "u-cashier-farhan",
    name: "Farhan",
    role: UserRole.CASHIER,
    pin: "5678",
    isActive: true,
  },
  {
    id: "u-cashier-dayib",
    name: "Dayib",
    role: UserRole.CASHIER,
    pin: "5679",
    isActive: true,
  },
  {
    id: "u-waiter-farhan",
    name: "Farhan Waiter",
    role: UserRole.WAITER,
    pin: "1234",
    isActive: true,
  },
  {
    id: "u-waiter-mohamed-dek",
    name: "MOHAMED DEK",
    role: UserRole.WAITER,
    pin: "8168",
    isActive: true,
  },
  {
    id: "u-waiter-ayax",
    name: "AYAX",
    role: UserRole.WAITER,
    pin: "1122",
    isActive: true,
  },
];
