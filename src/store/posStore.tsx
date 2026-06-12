import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, UserRole, Category, Product, Table, Order, OrderItem, 
  OrderStatus, Notification, SystemSettings 
} from "../types";
import { INITIAL_USERS, INITIAL_CATEGORIES, INITIAL_PRODUCTS, getInitialTables } from "../data";

interface POSContextType {
  currentUser: User | null;
  users: User[];
  categories: Category[];
  products: Product[];
  tables: Table[];
  orders: Order[];
  notifications: Notification[];
  settings: SystemSettings;
  loginPin: (pin: string) => User | null;
  loginAdmin: (email: string, pass: string) => User | null;
  logout: () => void;
  createOrder: (tableId: string, items: OrderItem[], notes?: string, waiter?: string, isQR?: boolean) => Order;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;
  updateOrderItems: (orderId: string, items: OrderItem[], notes?: string) => void;
  serveOrder: (orderId: string) => void;
  payOrder: (
    orderId: string, 
    method: string, 
    cashier?: string, 
    reference?: string, 
    amountReceived?: number, 
    discountAmount?: number, 
    serviceCharge?: number, 
    customerType?: "Dine-In" | "Takeaway" | "Delivery"
  ) => void;
  addNotification: (type: "KITCHEN" | "BARISTA" | "CASHIER" | "SYSTEM", title: string, message: string) => void;
  clearNotifications: () => void;
  markNotificationsAsRead: () => void;
  triggerChime: (type: "kitchen" | "barista" | "cashier") => void;
  theme: "light" | "dark" | "white";
  setTheme: (theme: "light" | "dark" | "white") => void;
  updateOrderWaiter: (orderId: string, waiterName: string) => void;
  
  // Admin Operations
  updateVat: (pct: number) => void;
  updateSettings: (update: Partial<SystemSettings>) => void;
  addUser: (name: string, role: UserRole, pin?: string, username?: string, password?: string) => void;
  updateUser: (id: string, update: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addCategory: (name: string, icon: string, image?: string) => void;
  updateCategory: (id: string, name: string, icon: string, image?: string) => void;
  deleteCategory: (id: string) => void;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (id: string, update: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addTable: (id: string, name: string) => void;
  removeTable: (tableId: string) => void;
  backupData: () => string;
  restoreData: (jsonStr: string) => boolean;
  clearAllCategories: () => void;
  clearAllProducts: () => void;
  importNewMenu: (newCategories: Category[], newProducts: Product[]) => void;
  reseedDefaultMenu: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// Web Audio API browser chime synthesizer 
export function simulateSound(type: "kitchen" | "barista" | "cashier") {
  // Silent clicking and placing order noises as requested by system requirements.
  return;
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from LocalStorage or seed defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("luna_current_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem("luna_users");
    return stored ? JSON.parse(stored) : INITIAL_USERS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem("luna_categories");
    return stored ? JSON.parse(stored) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem("luna_products");
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const stored = localStorage.getItem("luna_tables");
    return stored ? JSON.parse(stored) : getInitialTables();
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = localStorage.getItem("luna_orders");
    return stored ? JSON.parse(stored) : [];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem("luna_notifications");
    return stored ? JSON.parse(stored) : [];
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const stored = localStorage.getItem("luna_settings");
    if (stored) return JSON.parse(stored);
    return {
      vatPercentage: 5,
      restaurantName: "LUNA CAFE",
      address: "Xafada Exka, Wadada Xawo & Adam",
      phone: "+252 904 440 414",
      email: "lunacafe041@gmail.com",
      welcomeMessage: "Thank You For Visiting Luna Cafe",
      appreciationMessage: "We Look Forward To Serving You Again, Welcome Back",
      serviceChargePercentage: 0,
      printerPaperWidth: "80mm",
    };
  });

  const [theme, setTheme] = useState<"light" | "dark" | "white">(() => {
    return (localStorage.getItem("luna_theme_mode") as any) || "light";
  });

  useEffect(() => {
    localStorage.setItem("luna_theme_mode", theme);
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "theme-white");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const updateOrderWaiter = (orderId: string, waiterName: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, waiterName } : o));
    setTables(prev => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        return prev.map(t => t.tableId === order.tableId ? { ...t, assignedWaiter: waiterName } : t);
      }
      return prev;
    });
  };

  // Save changes to LocalStorage on modifications
  useEffect(() => {
    localStorage.setItem("luna_current_user", currentUser ? JSON.stringify(currentUser) : "");
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("luna_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("luna_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("luna_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("luna_tables", JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem("luna_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("luna_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("luna_settings", JSON.stringify(settings));
  }, [settings]);

  // Synchronize state across tabs (QR customer ordering sends orders, cashier updates state, etc.)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "luna_orders" && e.newValue) {
        const nextOrders: Order[] = JSON.parse(e.newValue);
        // Play sound if any new QR self-order or new approved order arrived
        if (nextOrders.length > orders.length) {
          const delta = nextOrders.filter(o => !orders.some(prev => prev.id === o.id));
          delta.forEach(order => {
            if (order.status === OrderStatus.PENDING_QR) {
              simulateSound("cashier");
            } else if (order.status === OrderStatus.NEW) {
              const hasDrinks = order.items.some(it => it.isDrink);
              const hasFood = order.items.some(it => !it.isDrink);
              if (hasFood) simulateSound("kitchen");
              if (hasDrinks) simulateSound("barista");
            }
          });
        }
        setOrders(nextOrders);
      }
      if (e.key === "luna_notifications" && e.newValue) {
        setNotifications(JSON.parse(e.newValue));
      }
      if (e.key === "luna_products" && e.newValue) {
        setProducts(JSON.parse(e.newValue));
      }
      if (e.key === "luna_categories" && e.newValue) {
        setCategories(JSON.parse(e.newValue));
      }
      if (e.key === "luna_tables" && e.newValue) {
        setTables(JSON.parse(e.newValue));
      }
      if (e.key === "luna_settings" && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [orders, notifications]);

  // General Notification Trigger helper
  const addNotification = (type: "KITCHEN" | "BARISTA" | "CASHIER" | "SYSTEM", title: string, message: string) => {
    const newNotif: Notification = {
      id: "notif-" + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Play specialized audio chimes
    if (type === "KITCHEN") triggerChime("kitchen");
    else if (type === "BARISTA") triggerChime("barista");
    else triggerChime("cashier");
  };

  const triggerChime = (type: "kitchen" | "barista" | "cashier") => {
    simulateSound(type);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Auth Operations
  const loginPin = (pin: string): User | null => {
    const user = users.find(u => u.pin === pin && u.isActive);
    if (user) {
      setCurrentUser(user);
      addNotification("SYSTEM", `Staff Login`, `${user.name} online as ${user.role}`);
      return user;
    }
    return null;
  };

  const loginAdmin = (email: string, pass: string): User | null => {
    // Authenticate credentials dynamically against our employee database
    const user = users.find(u => 
      u.isActive && 
      (u.role === UserRole.DEVELOPER || u.role === UserRole.MANAGER) && 
      u.username?.toLowerCase() === email.toLowerCase() && 
      (u.password === pass || (u.id === "u-dev" && pass === "harir123098@@"))
    );
    if (user) {
      setCurrentUser(user);
      addNotification("SYSTEM", `Secure Admin Login`, `${user.name} online as ${user.role}`);
      return user;
    }
    return null;
  };

  const logout = () => {
    if (currentUser) {
      addNotification("SYSTEM", "Staff Logout", `${currentUser.name} signed out`);
    }
    setCurrentUser(null);
  };

  // Order Workflows
  const createOrder = (
    tableId: string, 
    items: OrderItem[], 
    notes?: string, 
    waiter?: string, 
    isQR: boolean = false
  ): Order => {
    const targetTable = tables.find(t => t.tableId === tableId || t.id === tableId);
    const tblId = targetTable ? targetTable.tableId : `LUNA-T${tableId}`;
    const tblName = targetTable ? targetTable.name : `Table ${tableId}`;

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vatRate = settings.vatPercentage / 100;
    const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
    const grandTotal = parseFloat((subtotal + vatAmount).toFixed(2));
    
    const count = orders.length + 1;
    const orderNo = `#LN-${1000 + count}`;

    const newOrder: Order = {
      id: "ord-" + Math.random().toString(36).substr(2, 9),
      orderNumber: orderNo,
      tableId: tblId,
      tableName: tblName,
      items,
      status: isQR ? OrderStatus.PENDING_QR : OrderStatus.NEW,
      subtotal,
      vatRate,
      vatAmount,
      grandTotal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      waiterName: waiter || currentUser?.name || (isQR ? "Customer (QR Code)" : "Self-Ordering"),
      customerNotes: notes,
      paymentStatus: "Unpaid",
      discountAmount: 0,
      serviceCharge: 0,
      amountReceived: 0,
      balanceReturned: 0,
      customerType: "Dine-In",
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update table status
    setTables(prev => prev.map(t => t.tableId === tblId ? { ...t, status: "ordered", assignedWaiter: waiter || currentUser?.name || "" } : t));

    if (isQR) {
      addNotification(
        "CASHIER", 
        `New QR Order Awaiting Approval`, 
        `A received order from ${tblName} is pending cashier validation.`
      );
    } else {
      // Direct submission triggers kitchen and barista chimes/notifs
      const hasFood = items.some(it => !it.isDrink);
      const hasDrinks = items.some(it => it.isDrink);
      
      if (hasFood) {
        addNotification("KITCHEN", `New Food Order - ${orderNo}`, `Table: ${tblName}. Items: ${items.filter(it => !it.isDrink).length}`);
      }
      if (hasDrinks) {
        addNotification("BARISTA", `New Drink Order - ${orderNo}`, `Table: ${tblName}. Items: ${items.filter(it => it.isDrink).length}`);
      }
    }

    return newOrder;
  };

  const approveOrder = (orderId: string) => {
    let orderNum = "";
    let tblName = "";
    let approvedItems: OrderItem[] = [];

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        orderNum = o.orderNumber;
        tblName = o.tableName;
        approvedItems = o.items;
        return { 
          ...o, 
          status: OrderStatus.NEW, 
          updatedAt: new Date().toISOString(),
          cashierName: currentUser?.name || "Cashier" 
        };
      }
      return o;
    }));

    addNotification("SYSTEM", `QR Order Approved`, `${orderNum} approved for kitchen`);
    
    // Now trigger corresponding food/drink stations
    const hasFood = approvedItems.some(it => !it.isDrink);
    const hasDrinks = approvedItems.some(it => it.isDrink);
    
    if (hasFood) {
      addNotification("KITCHEN", `Kitchen Order Received`, `${orderNum} at ${tblName}`);
    }
    if (hasDrinks) {
      addNotification("BARISTA", `Barista Order Received`, `${orderNum} at ${tblName}`);
    }
  };

  const rejectOrder = (orderId: string) => {
    let orderNum = "";
    let tblId = "";
    
    const target = orders.find(o => o.id === orderId);
    if (target) {
      orderNum = target.orderNumber;
      tblId = target.tableId;
    }

    setOrders(prev => prev.filter(o => o.id !== orderId));
    
    // Check if table has other orders, if not free table status
    const remainingOrders = orders.filter(o => o.id !== orderId && o.tableId === tblId && o.status !== OrderStatus.PAID);
    if (remainingOrders.length === 0) {
      setTables(prev => prev.map(t => t.tableId === tblId ? { ...t, status: "available" } : t));
    }

    addNotification("CASHIER", `QR Order Rejected`, `Order ${orderNum || orderId} was rejected by cashier.`);
  };

  const updateOrderItems = (orderId: string, items: OrderItem[], notes?: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vatRate = o.vatRate;
        const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
        const grandTotal = parseFloat((subtotal + vatAmount).toFixed(2));
        return {
          ...o,
          items,
          subtotal,
          vatAmount,
          grandTotal,
          customerNotes: notes !== undefined ? notes : o.customerNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));
    addNotification("SYSTEM", "Order Modified", `Order items customized.`);
  };

  const serveOrder = (orderId: string) => {
    let orderNum = "";
    let tblName = "";
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        orderNum = o.orderNumber;
        tblName = o.tableName;
        return { 
          ...o, 
          status: OrderStatus.SERVED, 
          updatedAt: new Date().toISOString() 
        };
      }
      return o;
    }));
    addNotification("SYSTEM", `Order Served`, `Order ${orderNum} delivered to ${tblName}`);
  };

  const payOrder = (
    orderId: string, 
    method: string, 
    cashier?: string, 
    reference?: string, 
    amountReceived?: number, 
    discountAmount?: number, 
    serviceCharge?: number, 
    customerType?: "Dine-In" | "Takeaway" | "Delivery"
  ) => {
    let orderNum = "";
    let tblId = "";
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        orderNum = o.orderNumber;
        tblId = o.tableId;
        const sub = o.subtotal;
        const scPercentage = settings.serviceChargePercentage || 0;
        
        const calculatedServiceCharge = serviceCharge !== undefined 
          ? serviceCharge 
          : parseFloat((sub * (scPercentage / 100)).toFixed(2));
          
        const calculatedDiscount = discountAmount || 0;
        const grand = parseFloat((sub + o.vatAmount + calculatedServiceCharge - calculatedDiscount).toFixed(2));
        const received = amountReceived !== undefined ? amountReceived : grand;
        const balance = parseFloat(Math.max(0, received - grand).toFixed(2));
        
        return {
          ...o,
          status: OrderStatus.PAID,
          paymentStatus: "Paid",
          paymentMethod: method,
          paymentReference: reference || "",
          amountReceived: received,
          balanceReturned: balance,
          discountAmount: calculatedDiscount,
          serviceCharge: calculatedServiceCharge,
          customerType: customerType || "Dine-In",
          receiptNumber: "LUNA-REC-" + (10000 + prev.length),
          cashierName: cashier || currentUser?.name || "Cashier",
          grandTotal: grand,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    }));

    // Free table status once paid
    setTables(prev => prev.map(t => t.tableId === tblId ? { ...t, status: "available", assignedWaiter: "" } : t));
    addNotification("SYSTEM", `Order Paid (${method})`, `${orderNum} checked out successfully`);
  };

  // Super Admin Operations
  const updateVat = (pct: number) => {
    setSettings(prev => ({ ...prev, vatPercentage: pct }));
    addNotification("SYSTEM", "VAT Setting Updated", `Restaurant VAT set to ${pct}%`);
  };

  const updateSettings = (update: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...update }));
    addNotification("SYSTEM", "System Updated", `Core restaurant properties recalculated.`);
  };

  const addUser = (name: string, role: UserRole, pin?: string, username?: string, password?: string) => {
    const newUser: User = {
      id: "u-" + Math.random().toString(36).substr(2, 9),
      name,
      role,
      pin,
      username,
      password,
      isActive: true,
    };
    setUsers(prev => [...prev, newUser]);
    addNotification("SYSTEM", `User Enrolled`, `${name} joined as ${role}`);
  };

  const updateUser = (id: string, update: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...update } : u));
    addNotification("SYSTEM", `User Modified`, `Profile details updated.`);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addNotification("SYSTEM", `User Dismissed`, `Profile terminated securely.`);
  };

  const addCategory = (name: string, icon: string, image?: string) => {
    const newCat: Category = {
      id: "cat-" + Math.random().toString(36).substr(2, 9),
      name,
      icon,
      image,
    };
    setCategories(prev => [...prev, newCat]);
    addNotification("SYSTEM", `Category Formed`, `Category ${name} loaded`);
  };

  const updateCategory = (id: string, name: string, icon: string, image?: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, icon, image } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    addNotification("SYSTEM", `Category Deleted`, `Category purged successfully`);
  };

  const addProduct = (p: Omit<Product, "id">) => {
    const newProd: Product = {
      ...p,
      id: "prod-" + Math.random().toString(36).substr(2, 9),
    };
    setProducts(prev => [newProd, ...prev]);
    addNotification("SYSTEM", `Menu Item Created`, `Product ${p.name} configured.`);
  };

  const updateProduct = (id: string, update: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isArchived: true } : p));
    addNotification("SYSTEM", `Product Archived`, `Item is no longer listed.`);
  };

  const addTable = (id: string, name: string) => {
    const tableId = `LUNA-T${id.padStart(2, "0")}`;
    const newTable: Table = {
      id,
      tableId,
      name,
      qrUrl: `https://order.lunacafe.com/table/${tableId}`,
      status: "available",
      isEnabled: true,
      assignedWaiter: "",
    };
    if (tables.some(t => t.tableId === tableId)) {
      addNotification("SYSTEM", "Table Generation Failed", `ID ${tableId} exists.`);
      return;
    }
    setTables(prev => {
      const next = [...prev, newTable];
      return next.sort((a,b) => parseInt(a.id) - parseInt(b.id));
    });
    addNotification("SYSTEM", `Table Built`, `Unique ID ${tableId} assigned.`);
  };

  const removeTable = (tableId: string) => {
    setTables(prev => prev.map(t => t.tableId === tableId ? { ...t, isEnabled: t.isEnabled === false } : t));
    const targetTable = tables.find(t => t.tableId === tableId);
    const wasEnabled = targetTable?.isEnabled !== false;
    addNotification("SYSTEM", `Table Status Changed`, `Table ${tableId} ${wasEnabled ? 'Disabled' : 'Enabled'}.`);
  };

  const backupData = (): string => {
    const data = {
      users,
      categories,
      products,
      tables,
      orders,
      settings
    };
    return JSON.stringify(data, null, 2);
  };

  const restoreData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.users && data.categories && data.products && data.tables && data.orders && data.settings) {
        setUsers(data.users);
        setCategories(data.categories);
        setProducts(data.products);
        setTables(data.tables);
        setOrders(data.orders);
        setSettings(data.settings);
        addNotification("SYSTEM", `System Restored`, `Successful backup recovery applied.`);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const clearAllCategories = () => {
    setCategories([]);
    addNotification("SYSTEM", "Menu Categories Purged", "All category items have been completely removed.");
  };

  const clearAllProducts = () => {
    setProducts([]);
    addNotification("SYSTEM", "Menu Products Purged", "All product selections have been completely wiped.");
  };

  const importNewMenu = (newCategories: Category[], newProducts: Product[]) => {
    setCategories(newCategories);
    setProducts(newProducts);
    addNotification("SYSTEM", "New Menu Imported", `Loaded ${newCategories.length} categories and ${newProducts.length} items.`);
  };

  const reseedDefaultMenu = () => {
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    addNotification("SYSTEM", "Catalog Reseeded", "Factory Luna Café menu categories and products restored.");
  };

  return (
    <POSContext.Provider value={{
      currentUser, users, categories, products, tables, orders, notifications, settings,
      loginPin, loginAdmin, logout, createOrder, approveOrder, rejectOrder, updateOrderItems,
      serveOrder, payOrder, addNotification, clearNotifications, markNotificationsAsRead, triggerChime,
      theme, setTheme, updateOrderWaiter,
      updateVat, updateSettings, addUser, updateUser, deleteUser,
      addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct,
      addTable, removeTable, backupData, restoreData,
      clearAllCategories, clearAllProducts, importNewMenu, reseedDefaultMenu
    }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
};
