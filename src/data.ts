import { Category, Product, ProductionStation, Table, User, UserRole } from "./types";

export const INITIAL_PRODUCTION_STATIONS: ProductionStation[] = [
  { id: "station-kitchen", name: "Kitchen Station" },
  { id: "station-bar", name: "Bar Station" },
  { id: "station-coffee", name: "Coffee Station" },
  { id: "station-juice", name: "Juice Station" },
  { id: "station-dessert", name: "Dessert Station" },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: "cat-breakfast", name: "Breakfast", icon: "Egg" },
  { id: "cat-burgers", name: "Burgers", icon: "Layers" },
  { id: "cat-pizza", name: "Pizza", icon: "Pizza" },
  { id: "cat-pasta", name: "Pasta", icon: "Soup" },
  { id: "cat-sandwiches", name: "Sandwiches", icon: "MenuSub" },
  { id: "cat-desserts", name: "Desserts", icon: "Cake" },
  { id: "cat-juices", name: "Fresh Juices", icon: "GlassWater" },
  { id: "cat-smoothies", name: "Smoothies", icon: "Milk" },
  { id: "cat-hot", name: "Hot Drinks", icon: "Coffee" },
  { id: "cat-cold", name: "Cold Drinks", icon: "CupSoda" },
  { id: "cat-salads", name: "Salads", icon: "Salad" },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Breakfast
  {
    id: "prod-avo-toast",
    name: "Classic Avocado Toast",
    categoryId: "cat-breakfast",
    price: 8.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-croissant",
    name: "Butter Croissant",
    categoryId: "cat-breakfast",
    price: 3.8,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-pancakes",
    name: "Maple Syrup Pancakes",
    categoryId: "cat-breakfast",
    price: 9.2,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=400",
  },

  // Burgers
  {
    id: "prod-smashburger",
    name: "Luna Craft Smashburger",
    categoryId: "cat-burgers",
    price: 11.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-chickenburger",
    name: "Crispy Buttermilk Chicken Burger",
    categoryId: "cat-burgers",
    price: 12.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&q=80&w=400",
  },

  // Pizza
  {
    id: "prod-pizza-margherita",
    name: "Pizza Margherita",
    categoryId: "cat-pizza",
    price: 13.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-pizza-pep",
    name: "Double Pepperoni Pizza",
    categoryId: "cat-pizza",
    price: 15.0,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=400",
  },

  // Pasta
  {
    id: "prod-pasta-carb",
    name: "Creamy Fettuccine Carbonara",
    categoryId: "cat-pasta",
    price: 14.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-pasta-bolo",
    name: "Spaghetti Bolognese",
    categoryId: "cat-pasta",
    price: 13.8,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400",
  },

  // Sandwiches
  {
    id: "prod-club-sandwich",
    name: "Triple-Decker Club Sandwich",
    categoryId: "cat-sandwiches",
    price: 10.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&q=80&w=400",
  },

  // Desserts
  {
    id: "prod-lava-cake",
    name: "Molten Chocolate Lava Cake",
    categoryId: "cat-desserts",
    price: 7.5,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-cheesecake",
    name: "Strawberry New York Cheesecake",
    categoryId: "cat-desserts",
    price: 6.8,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=400",
  },

  // Juices
  {
    id: "prod-orange-juice",
    name: "Cold-Pressed Orange Juice",
    categoryId: "cat-juices",
    price: 5.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400",
  },

  // Smoothies
  {
    id: "prod-strawberry-smoothie",
    name: "Strawberry Banana Protein Smoothie",
    categoryId: "cat-smoothies",
    price: 6.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-mango-smoothie",
    name: "Alphonso Mango Coconut Smoothie",
    categoryId: "cat-smoothies",
    price: 6.5,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&q=80&w=400",
  },

  // Hot Drinks
  {
    id: "prod-espresso",
    name: "Classic Espresso Shot",
    categoryId: "cat-hot",
    price: 2.50,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1510707513156-46c29753aa73?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-latte",
    name: "Caffé Latte",
    categoryId: "cat-hot",
    price: 4.50,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-cappuccino",
    name: "Classic Cappuccino",
    categoryId: "cat-hot",
    price: 4.20,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=400",
  },

  // Cold Drinks
  {
    id: "prod-iced-latte",
    name: "Iced Latte Coffee",
    categoryId: "cat-cold",
    price: 4.80,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-cold-brew",
    name: "Signature Cold Brew",
    categoryId: "cat-cold",
    price: 5.00,
    available: true,
    isDrink: true,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400",
  },

  // Salads
  {
    id: "prod-caesar",
    name: "Caesar Chicken Salad",
    categoryId: "cat-salads",
    price: 11.00,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: "prod-greek",
    name: "Greek Feta Salad",
    categoryId: "cat-salads",
    price: 9.50,
    available: true,
    isDrink: false,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400",
  },
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
    id: "u-cashier",
    name: "Adrian Cashier",
    role: UserRole.CASHIER,
    pin: "5678",
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
    id: "u-waiter-samir",
    name: "Samir Waiter",
    role: UserRole.WAITER,
    pin: "1111",
    isActive: true,
  },
  {
    id: "u-waiter-layla",
    name: "Layla Waiter",
    role: UserRole.WAITER,
    pin: "2222",
    isActive: true,
  },
  {
    id: "u-waiter-zara",
    name: "Zara Waiter",
    role: UserRole.WAITER,
    pin: "3333",
    isActive: true,
  },
];
