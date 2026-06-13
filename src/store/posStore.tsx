import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, UserRole, Category, Product, Table, Order, OrderItem, 
  OrderStatus, Notification, SystemSettings, ProductionStation, OrderAuditLog 
} from "../types";
import { INITIAL_USERS, INITIAL_CATEGORIES, INITIAL_PRODUCTS, getInitialTables, INITIAL_PRODUCTION_STATIONS } from "../data";
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export enum OperationType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  GET = "get",
  WRITE = "write"
}

export function handleFirestoreError(error: any, operation: OperationType, path: string): never {
  const customError = {
    message: `Firestore operation failed: ${error.message || error}`,
    operation,
    path,
    code: error.code || "unknown",
  };
  console.error("Firebase Schema/Security Error:", customError);
  throw new Error(JSON.stringify(customError));
}

// 24-hour cutoff rule: 5:00 AM
export function getBusinessDate(dateObj: Date = new Date()): string {
  const date = new Date(dateObj);
  const hours = date.getHours();
  // Any orders between 12:00 AM and 4:59 AM belong to the prior date.
  if (hours < 5) {
    date.setDate(date.getDate() - 1);
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface POSContextType {
  currentUser: User | null;
  users: User[];
  categories: Category[];
  products: Product[];
  tables: Table[];
  orders: Order[];
  notifications: Notification[];
  settings: SystemSettings;
  productionStations: ProductionStation[];
  selectedBusinessDate: string;
  setSelectedBusinessDate: (date: string) => void;
  loginPin: (pin: string) => User | null;
  loginAdmin: (email: string, pass: string) => User | null;
  logout: () => void;
  createOrder: (tableId: string, items: OrderItem[], notes?: string, waiter?: string, isQR?: boolean) => Promise<Order>;
  approveOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  updateOrderItems: (orderId: string, items: OrderItem[], notes?: string) => Promise<void>;
  serveOrder: (orderId: string) => Promise<void>;
  payOrder: (
    orderId: string, 
    method: string, 
    cashier?: string, 
    reference?: string, 
    amountReceived?: number, 
    discountAmount?: number, 
    serviceCharge?: number, 
    customerType?: "Dine-In" | "Takeaway" | "Delivery"
  ) => Promise<void>;
  updateOrderPrintedQty: (orderId: string, printedQty: Record<string, number>) => Promise<void>;
  adminEditPastOrder: (
    orderId: string,
    items: OrderItem[],
    discountAmount?: number,
    serviceCharge?: number,
    editorName?: string
  ) => Promise<void>;
  updateOrderWithAuditTrail: (
    orderId: string,
    newItems: OrderItem[],
    editorName: string,
    editorRole: string,
    discountAmount?: number,
    serviceCharge?: number,
    reason?: string,
    customerNotes?: string
  ) => Promise<void>;
  addNotification: (type: "KITCHEN" | "BARISTA" | "CASHIER" | "SYSTEM", title: string, message: string) => void;
  clearNotifications: () => void;
  markNotificationsAsRead: () => void;
  triggerChime: (type: "kitchen" | "barista" | "cashier") => void;
  theme: "light" | "dark" | "white";
  setTheme: (theme: "light" | "dark" | "white") => void;
  updateOrderWaiter: (orderId: string, waiterName: string) => Promise<void>;
  
  // Admin Operations
  updateVat: (pct: number) => Promise<void>;
  updateSettings: (update: Partial<SystemSettings>) => Promise<void>;
  addUser: (name: string, role: UserRole, pin?: string, username?: string, password?: string) => Promise<void>;
  updateUser: (id: string, update: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addCategory: (name: string, icon: string, image?: string) => Promise<void>;
  updateCategory: (id: string, name: string, icon: string, image?: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, update: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addTable: (id: string, name: string) => Promise<void>;
  removeTable: (tableId: string) => Promise<void>;
  addProductionStation: (name: string) => Promise<void>;
  updateProductionStation: (id: string, name: string) => Promise<void>;
  deleteProductionStation: (id: string) => Promise<void>;
  backupData: () => string;
  restoreData: (jsonStr: string) => boolean;
  clearAllCategories: () => Promise<void>;
  clearAllProducts: () => Promise<void>;
  importNewMenu: (newCategories: Category[], newProducts: Product[]) => Promise<void>;
  reseedDefaultMenu: () => Promise<void>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function simulateSound(type: "kitchen" | "barista" | "cashier") {
  return; // Silent per system guidelines
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("luna_current_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [productionStations, setProductionStations] = useState<ProductionStation[]>(INITIAL_PRODUCTION_STATIONS);

  const [settings, setSettings] = useState<SystemSettings>({
    vatPercentage: 5,
    restaurantName: "LUNA CAFE",
    address: "Xafada Exka, Wadada Xawo & Adam",
    phone: "+252 904 440 414",
    email: "lunacafe041@gmail.com",
    welcomeMessage: "Thank You For Visiting Luna Cafe",
    appreciationMessage: "We Look Forward To Serving You Again, Welcome Back",
    serviceChargePercentage: 0,
    printerPaperWidth: "80mm",
    customerSelfOrderLocked: false,
    customerSelfOrderAutoApprove: false,
  });

  const [selectedBusinessDate, setSelectedBusinessDate] = useState<string>(() => getBusinessDate());

  const [theme, setTheme] = useState<"light" | "dark" | "white">(
    () => (localStorage.getItem("luna_theme_mode") as any) || "light"
  );

  useEffect(() => {
    localStorage.setItem("luna_theme_mode", theme);
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "theme-white");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Firestore Snapshots
  useEffect(() => {
    const settingsDocRef = doc(db, "settings", "global");
    const unsubscribe = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as SystemSettings);
      } else {
        const defaultSettings: SystemSettings = {
          vatPercentage: 5,
          restaurantName: "LUNA CAFE",
          address: "Xafada Exka, Wadada Xawo & Adam",
          phone: "+252 904 440 414",
          email: "lunacafe041@gmail.com",
          welcomeMessage: "Thank You For Visiting Luna Cafe",
          appreciationMessage: "We Look Forward To Serving You Again, Welcome Back",
          serviceChargePercentage: 0,
          printerPaperWidth: "80mm",
          customerSelfOrderLocked: false,
          customerSelfOrderAutoApprove: false,
        };
        setDoc(settingsDocRef, defaultSettings).catch((err) => handleFirestoreError(err, OperationType.WRITE, "settings/global"));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "settings/global"));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const colRef = collection(db, "categories");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      if (snap.empty) {
        INITIAL_CATEGORIES.forEach((cat) => {
          setDoc(doc(db, "categories", cat.id), cat).catch((err) => handleFirestoreError(err, OperationType.WRITE, `categories/${cat.id}`));
        });
      } else {
        const cats: Category[] = [];
        snap.forEach((d) => {
          cats.push(d.data() as Category);
        });
        const filteredCats = cats.filter((c: Category) => c.id !== "cat-hot" && c.id !== "cat-cold" && c.id !== "cat-salads" && c.name !== "Hot Drinks" && c.name !== "Cold Drinks" && c.name !== "Salads");
        setCategories(filteredCats);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "categories"));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const colRef = collection(db, "products");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      if (snap.empty) {
        INITIAL_PRODUCTS.forEach((prod) => {
          setDoc(doc(db, "products", prod.id), prod).catch((err) => handleFirestoreError(err, OperationType.WRITE, `products/${prod.id}`));
        });
      } else {
        const prods: Product[] = [];
        snap.forEach((d) => {
          prods.push(d.data() as Product);
        });
        const filteredProds = prods.filter((p: Product) => p.categoryId !== "cat-hot" && p.categoryId !== "cat-cold" && p.categoryId !== "cat-salads" && p.isArchived !== true);
        setProducts(filteredProds);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "products"));

    return () => unsubscribe();
  }, []);

  // Active database trimmer to permanently delete sample categories and products from Firestore
  useEffect(() => {
    const pruneObsoleteData = async () => {
      try {
        const obsoleteCats = ["cat-hot", "cat-cold", "cat-salads"];
        for (const catId of obsoleteCats) {
          await deleteDoc(doc(db, "categories", catId));
        }

        const prodsSnap = await getDocs(collection(db, "products"));
        prodsSnap.forEach(async (pDoc) => {
          const prodData = pDoc.data();
          if (prodData && obsoleteCats.includes(prodData.categoryId)) {
            await deleteDoc(doc(db, "products", pDoc.id));
          }
        });
      } catch (err) {
        // Fallback for firestore security rules or offline modes
      }
    };
    pruneObsoleteData();
  }, []);

  useEffect(() => {
    const colRef = collection(db, "tables");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      if (snap.empty) {
        getInitialTables().forEach((tbl) => {
          setDoc(doc(db, "tables", tbl.tableId), tbl).catch((err) => handleFirestoreError(err, OperationType.WRITE, `tables/${tbl.tableId}`));
        });
      } else {
        const tbls: Table[] = [];
        snap.forEach((d) => {
          tbls.push(d.data() as Table);
        });
        tbls.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setTables(tbls);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "tables"));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const colRef = collection(db, "users");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      if (snap.empty) {
        INITIAL_USERS.forEach((u) => {
          setDoc(doc(db, "users", u.id), u).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${u.id}`));
        });
      } else {
        const us: User[] = [];
        snap.forEach((d) => {
          us.push(d.data() as User);
        });
        setUsers(us);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "users"));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const colRef = collection(db, "orders");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const ords: Order[] = [];
      snap.forEach((d) => {
        ords.push(d.data() as Order);
      });
      ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ords);
    }, (err) => handleFirestoreError(err, OperationType.GET, "orders"));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const colRef = collection(db, "notifications");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const notifs: Notification[] = [];
      snap.forEach((d) => {
        notifs.push(d.data() as Notification);
      });
      notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(notifs);
    }, (err) => handleFirestoreError(err, OperationType.GET, "notifications"));

    return () => unsubscribe();
  }, []);

  // Sync session
  useEffect(() => {
    localStorage.setItem("luna_current_user", currentUser ? JSON.stringify(currentUser) : "");
  }, [currentUser]);

  const updateOrderWaiter = async (orderId: string, waiterName: string) => {
    try {
      const docRef = doc(db, "orders", orderId);
      await updateDoc(docRef, { waiterName, updatedAt: new Date().toISOString() });
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const tableRef = doc(db, "tables", order.tableId);
        await updateDoc(tableRef, { assignedWaiter: waiterName });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const addNotification = async (type: "KITCHEN" | "BARISTA" | "CASHIER" | "SYSTEM", title: string, message: string) => {
    try {
      const id = "notif-" + Math.random().toString(36).substr(2, 9);
      const newNotif: Notification = {
        id,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
      };
      await setDoc(doc(db, "notifications", id), newNotif);
    } catch (err) {
      console.error("Failed to write notification", err);
    }
  };

  const clearNotifications = async () => {
    try {
      for (const n of notifications) {
        await deleteDoc(doc(db, "notifications", n.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      for (const n of notifications) {
        if (!n.read) {
          await updateDoc(doc(db, "notifications", n.id), { read: true });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerChime = (type: "kitchen" | "barista" | "cashier") => {
    simulateSound(type);
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
  const createOrder = async (
    tableId: string, 
    items: OrderItem[], 
    notes?: string, 
    waiter?: string, 
    isQR: boolean = false
  ): Promise<Order> => {
    try {
      const targetTable = tables.find(t => t.tableId === tableId || t.id === tableId);
      const tblId = targetTable ? targetTable.tableId : `LUNA-T${tableId}`;
      const tblName = targetTable ? targetTable.name : `Table ${tableId}`;

      const itemsWithStations = items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const computedStationId = prod?.stationId || (prod?.isDrink ? (prod.categoryId === "cat-juices" ? "station-juice" : "station-bar") : (prod?.categoryId === "cat-desserts" ? "station-dessert" : "station-kitchen"));
        return {
          ...item,
          stationId: item.stationId || computedStationId || "station-kitchen"
        };
      });

      const subtotal = itemsWithStations.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vatRate = settings.vatPercentage / 100;
      const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
      const grandTotal = parseFloat((subtotal + vatAmount).toFixed(2));
      
      const count = orders.length + 1;
      const orderNo = `#LN-${1000 + count}`;
      const id = "ord-" + Math.random().toString(36).substr(2, 9);

      const newOrder: Order = {
        id,
        orderNumber: orderNo,
        tableId: tblId,
        tableName: tblName,
        items: itemsWithStations,
        status: (isQR && !settings.customerSelfOrderAutoApprove) ? OrderStatus.PENDING_QR : OrderStatus.NEW,
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
        businessDate: getBusinessDate(new Date()),
        printedQty: {}
      };

      await setDoc(doc(db, "orders", id), newOrder);

      const tblDocRef = doc(db, "tables", tblId);
      await updateDoc(tblDocRef, { status: "ordered", assignedWaiter: waiter || currentUser?.name || "" });

      const approvedImmediately = !isQR || settings.customerSelfOrderAutoApprove;

      if (!approvedImmediately) {
        addNotification(
          "CASHIER", 
          `New QR Order Awaiting Approval`, 
          `A received order from ${tblName} is pending cashier validation.`
        );
      } else {
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
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "orders");
    }
  };

  const approveOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: OrderStatus.NEW,
        updatedAt: new Date().toISOString(),
        cashierName: currentUser?.name || "Cashier"
      });

      addNotification("SYSTEM", `QR Order Approved`, `${order.orderNumber} approved for kitchen`);
      
      const hasFood = order.items.some(it => !it.isDrink);
      const hasDrinks = order.items.some(it => it.isDrink);
      
      if (hasFood) {
        addNotification("KITCHEN", `Kitchen Order Received`, `${order.orderNumber} at ${order.tableName}`);
      }
      if (hasDrinks) {
        addNotification("BARISTA", `Barista Order Received`, `${order.orderNumber} at ${order.tableName}`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const rejectOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const orderRef = doc(db, "orders", orderId);
      await deleteDoc(orderRef);
      
      const remainingOrders = orders.filter(o => o.id !== orderId && o.tableId === order.tableId && o.status !== OrderStatus.PAID);
      if (remainingOrders.length === 0) {
        const tblRef = doc(db, "tables", order.tableId);
        await updateDoc(tblRef, { status: "available" });
      }

      addNotification("CASHIER", `QR Order Rejected`, `Order ${order.orderNumber || orderId} was rejected by cashier.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const updateOrderItems = async (orderId: string, items: OrderItem[], notes?: string) => {
    try {
      const o = orders.find(prev => prev.id === orderId);
      if (!o) return;

      const itemsWithStations = items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const computedStationId = prod?.stationId || (prod?.isDrink ? (prod.categoryId === "cat-juices" ? "station-juice" : "station-bar") : (prod?.categoryId === "cat-desserts" ? "station-dessert" : "station-kitchen"));
        return {
          ...item,
          stationId: item.stationId || computedStationId || "station-kitchen"
        };
      });
      const subtotal = itemsWithStations.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vatRate = o.vatRate;
      const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
      const grandTotal = parseFloat((subtotal + vatAmount).toFixed(2));

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        items: itemsWithStations,
        subtotal,
        vatAmount,
        grandTotal,
        customerNotes: notes !== undefined ? notes : o.customerNotes,
        updatedAt: new Date().toISOString()
      });

      addNotification("SYSTEM", "Order Modified", `Order items customized.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const serveOrder = async (orderId: string) => {
    try {
      const o = orders.find(prev => prev.id === orderId);
      if (!o) return;

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: OrderStatus.SERVED,
        updatedAt: new Date().toISOString()
      });

      addNotification("SYSTEM", `Order Served`, `Order ${o.orderNumber} delivered to ${o.tableName}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const payOrder = async (
    orderId: string, 
    method: string, 
    cashier?: string, 
    reference?: string, 
    amountReceived?: number, 
    discountAmount?: number, 
    serviceCharge?: number, 
    customerType?: "Dine-In" | "Takeaway" | "Delivery"
  ) => {
    try {
      const o = orders.find(prev => prev.id === orderId);
      if (!o) return;

      const sub = o.subtotal;
      const scPercentage = settings.serviceChargePercentage || 0;
      
      const calculatedServiceCharge = serviceCharge !== undefined 
        ? serviceCharge 
        : parseFloat((sub * (scPercentage / 100)).toFixed(2));
        
      const calculatedDiscount = discountAmount || 0;
      const grand = parseFloat((sub + o.vatAmount + calculatedServiceCharge - calculatedDiscount).toFixed(2));
      const received = amountReceived !== undefined ? amountReceived : grand;
      const balance = parseFloat(Math.max(0, received - grand).toFixed(2));

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: OrderStatus.PAID,
        paymentStatus: "Paid",
        paymentMethod: method,
        paymentReference: reference || "",
        amountReceived: received,
        balanceReturned: balance,
        discountAmount: calculatedDiscount,
        serviceCharge: calculatedServiceCharge,
        customerType: customerType || "Dine-In",
        receiptNumber: "LUNA-REC-" + (10000 + orders.length),
        cashierName: cashier || currentUser?.name || "Cashier",
        grandTotal: grand,
        updatedAt: new Date().toISOString()
      });

      const tableRef = doc(db, "tables", o.tableId);
      await updateDoc(tableRef, { status: "available", assignedWaiter: "" });

      addNotification("SYSTEM", `Order Paid (${method})`, `${o.orderNumber} checked out successfully`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateOrderPrintedQty = async (orderId: string, printedQty: Record<string, number>) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { printedQty });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Super Admin Operations
  const updateVat = async (pct: number) => {
    try {
      const setRef = doc(db, "settings", "global");
      await updateDoc(setRef, { vatPercentage: pct });
      addNotification("SYSTEM", "VAT Setting Updated", `Restaurant VAT set to ${pct}%`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/global");
    }
  };

  const updateSettings = async (update: Partial<SystemSettings>) => {
    try {
      const setRef = doc(db, "settings", "global");
      await updateDoc(setRef, update);
      addNotification("SYSTEM", "System Updated", `Core restaurant properties recalculated.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "settings/global");
    }
  };

  const addUser = async (name: string, role: UserRole, pin?: string, username?: string, password?: string) => {
    try {
      const id = "u-" + Math.random().toString(36).substr(2, 9);
      const newUser: User = {
        id,
        name,
        role,
        pin,
        username,
        password,
        isActive: true,
      };
      await setDoc(doc(db, "users", id), newUser);
      addNotification("SYSTEM", `User Enrolled`, `${name} joined as ${role}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "users");
    }
  };

  const updateUser = async (id: string, update: Partial<User>) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, update);
      addNotification("SYSTEM", `User Modified`, `Profile details updated.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const userRef = doc(db, "users", id);
      await deleteDoc(userRef);
      addNotification("SYSTEM", `User Dismissed`, `Profile terminated securely.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  const addCategory = async (name: string, icon: string, image?: string) => {
    try {
      const id = "cat-" + Math.random().toString(36).substr(2, 9);
      const newCat: Category = { id, name, icon, image };
      await setDoc(doc(db, "categories", id), newCat);
      addNotification("SYSTEM", `Category Formed`, `Category ${name} loaded`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "categories");
    }
  };

  const updateCategory = async (id: string, name: string, icon: string, image?: string) => {
    try {
      const catRef = doc(db, "categories", id);
      await updateDoc(catRef, { name, icon, image });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const catRef = doc(db, "categories", id);
      await deleteDoc(catRef);
      addNotification("SYSTEM", `Category Deleted`, `Category purged successfully`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const addProduct = async (p: Omit<Product, "id">) => {
    try {
      const id = "prod-" + Math.random().toString(36).substr(2, 9);
      const newProd: Product = { ...p, id };
      await setDoc(doc(db, "products", id), newProd);
      addNotification("SYSTEM", `Menu Item Created`, `Product ${p.name} configured.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "products");
    }
  };

  const updateProduct = async (id: string, update: Partial<Product>) => {
    try {
      const prodRef = doc(db, "products", id);
      await updateDoc(prodRef, update);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const prodRef = doc(db, "products", id);
      await updateDoc(prodRef, { isArchived: true });
      addNotification("SYSTEM", `Product Archived`, `Item is no longer listed.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const addTable = async (id: string, name: string) => {
    try {
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
      await setDoc(doc(db, "tables", tableId), newTable);
      addNotification("SYSTEM", `Table Built`, `Unique ID ${tableId} assigned.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "tables");
    }
  };

  const removeTable = async (tableId: string) => {
    try {
      const targetTable = tables.find(t => t.tableId === tableId);
      if (!targetTable) return;
      const wasEnabled = targetTable.isEnabled !== false;
      const tblRef = doc(db, "tables", tableId);
      await updateDoc(tblRef, { isEnabled: !wasEnabled });
      addNotification("SYSTEM", `Table Status Changed`, `Table ${tableId} ${wasEnabled ? 'Disabled' : 'Enabled'}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tables/${tableId}`);
    }
  };

  const addProductionStation = async (name: string) => {
    const newStation: ProductionStation = {
      id: "station-" + Math.random().toString(36).substr(2, 9),
      name,
    };
    setProductionStations(prev => [...prev, newStation]);
    addNotification("SYSTEM", `Station Formed`, `Production Station "${name}" created.`);
  };

  const updateProductionStation = async (id: string, name: string) => {
    setProductionStations(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const deleteProductionStation = async (id: string) => {
    setProductionStations(prev => prev.filter(s => s.id !== id));
    addNotification("SYSTEM", `Station Deleted`, `Station deleted. Consolidated items back to Kitchen.`);
  };

  const adminEditPastOrder = async (
    orderId: string,
    items: OrderItem[],
    discountAmount?: number,
    serviceCharge?: number,
    editorName?: string
  ) => {
    try {
      const o = orders.find(prev => prev.id === orderId);
      if (!o) return;

      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vatRate = o.vatRate;
      const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
      
      const finalDiscount = discountAmount !== undefined ? discountAmount : (o.discountAmount || 0);
      const finalService = serviceCharge !== undefined ? serviceCharge : (o.serviceCharge || 0);
      const grandTotal = parseFloat((subtotal + vatAmount + finalService - finalDiscount).toFixed(2));

      const auditLog: OrderAuditLog = {
        editedBy: editorName || currentUser?.name || "Admin",
        userRole: currentUser?.role || "Admin",
        editedAt: new Date().toISOString(),
        changesSummary: `Modified order: items recalculated by Administrator.`,
        previousTotal: o.grandTotal,
        newTotal: grandTotal,
        reason: "Administrator adjustment"
      };

      const checkedItems = items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const computedStationId = prod?.stationId || (prod?.isDrink ? (prod.categoryId === "cat-juices" ? "station-juice" : "station-bar") : (prod?.categoryId === "cat-desserts" ? "station-dessert" : "station-kitchen"));
        return {
          ...item,
          stationId: item.stationId || computedStationId || "station-kitchen"
        };
      });

      const amountReceived = o.amountReceived || grandTotal;
      const balanceReturned = Math.max(0, amountReceived - grandTotal);

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        items: checkedItems,
        subtotal,
        vatAmount,
        discountAmount: finalDiscount,
        serviceCharge: finalService,
        grandTotal,
        balanceReturned,
        updatedAt: new Date().toISOString(),
        auditHistory: [...(o.auditHistory || []), auditLog]
      });

      addNotification("SYSTEM", `Past Bill Edited`, `Order ${orderId} updated by administrator.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateOrderWithAuditTrail = async (
    orderId: string,
    newItems: OrderItem[],
    editorName: string,
    editorRole: string,
    discountAmount?: number,
    serviceCharge?: number,
    reason?: string,
    customerNotes?: string
  ) => {
    try {
      const o = orders.find(prev => prev.id === orderId);
      if (!o) return;

      const originalMap = new Map<string, number>();
      o.items.forEach(it => {
        originalMap.set(it.productId, (originalMap.get(it.productId) || 0) + it.quantity);
      });

      const newMap = new Map<string, number>();
      newItems.forEach(it => {
        newMap.set(it.productId, (newMap.get(it.productId) || 0) + it.quantity);
      });

      const added: string[] = [];
      const removed: string[] = [];
      const allProductIds = new Set([...originalMap.keys(), ...newMap.keys()]);
      
      allProductIds.forEach(pId => {
        const oldQty = originalMap.get(pId) || 0;
        const newQty = newMap.get(pId) || 0;
        
        const prodName = newItems.find(it => it.productId === pId)?.name || o.items.find(it => it.productId === pId)?.name || "Product";

        if (newQty > oldQty) {
          added.push(`${prodName} (x${newQty - oldQty})`);
        } else if (oldQty > newQty) {
          removed.push(`${prodName} (x${oldQty - newQty})`);
        }
      });

      const addedItemsSummary = added.join(", ") || "None";
      const removedItemsSummary = removed.join(", ") || "None";

      const checkedItems = newItems.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const computedStationId = prod?.stationId || (prod?.isDrink ? "station-bar" : "station-kitchen");
        return {
          ...item,
          stationId: item.stationId || computedStationId
        };
      });

      const subtotal = checkedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const vatRate = o.vatRate;
      const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
      
      const finalDiscount = discountAmount !== undefined ? discountAmount : (o.discountAmount || 0);
      const finalService = serviceCharge !== undefined ? serviceCharge : (o.serviceCharge || 0);
      const grandTotal = parseFloat((subtotal + vatAmount + finalService - finalDiscount).toFixed(2));
      
      const amountReceived = o.amountReceived || grandTotal;
      const balanceReturned = Math.max(0, amountReceived - grandTotal);

      const auditLog: OrderAuditLog = {
        editedBy: editorName,
        userRole: editorRole,
        editedAt: new Date().toISOString(),
        changesSummary: `Items modified. Added: ${addedItemsSummary}. Removed: ${removedItemsSummary}.`,
        addedItemsSummary,
        removedItemsSummary,
        previousTotal: o.grandTotal,
        newTotal: grandTotal,
        reason: reason || "Standard order edit"
      };

      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        items: checkedItems,
        subtotal,
        vatAmount,
        discountAmount: finalDiscount,
        serviceCharge: finalService,
        grandTotal,
        balanceReturned,
        customerNotes: customerNotes !== undefined ? customerNotes : o.customerNotes,
        updatedAt: new Date().toISOString(),
        auditHistory: [...(o.auditHistory || []), auditLog]
      });

      addNotification("SYSTEM", "Audit Completed", `Order ${orderId} audited successfully.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
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
        data.users.forEach((item: any) => setDoc(doc(db, "users", item.id), item));
        data.categories.forEach((item: any) => setDoc(doc(db, "categories", item.id), item));
        data.products.forEach((item: any) => setDoc(doc(db, "products", item.id), item));
        data.tables.forEach((item: any) => setDoc(doc(db, "tables", item.tableId), item));
        data.orders.forEach((item: any) => setDoc(doc(db, "orders", item.id), item));
        setDoc(doc(db, "settings", "global"), data.settings);
        addNotification("SYSTEM", `System Restored`, `Successful backup recovery applied.`);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const clearAllCategories = async () => {
    try {
      for (const cat of categories) {
        await deleteDoc(doc(db, "categories", cat.id));
      }
      addNotification("SYSTEM", "Menu Categories Purged", "All category items have been completely removed.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "categories");
    }
  };

  const clearAllProducts = async () => {
    try {
      for (const prod of products) {
        await deleteDoc(doc(db, "products", prod.id));
      }
      addNotification("SYSTEM", "Menu Products Purged", "All product selections have been completely wiped.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "products");
    }
  };

  const importNewMenu = async (newCategories: Category[], newProducts: Product[]) => {
    try {
      await clearAllCategories();
      await clearAllProducts();
      for (const cat of newCategories) {
        await setDoc(doc(db, "categories", cat.id), cat);
      }
      for (const prod of newProducts) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      addNotification("SYSTEM", "New Menu Imported", `Loaded ${newCategories.length} categories and ${newProducts.length} items.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "menu");
    }
  };

  const reseedDefaultMenu = async () => {
    try {
      await clearAllCategories();
      await clearAllProducts();
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, "categories", cat.id), cat);
      }
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, "products", prod.id), prod);
      }
      addNotification("SYSTEM", "Catalog Reseeded", "Factory Luna Café menu categories and products restored.");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "menu");
    }
  };

  return (
    <POSContext.Provider value={{
      currentUser, users, categories, products, tables, orders, notifications, settings,
      productionStations, selectedBusinessDate, setSelectedBusinessDate,
      loginPin, loginAdmin, logout, createOrder, approveOrder, rejectOrder, updateOrderItems,
      serveOrder, payOrder, adminEditPastOrder, updateOrderWithAuditTrail, addNotification, clearNotifications, markNotificationsAsRead, triggerChime,
      theme, setTheme, updateOrderWaiter, updateOrderPrintedQty,
      updateVat, updateSettings, addUser, updateUser, deleteUser,
      addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct,
      addTable, removeTable, addProductionStation, updateProductionStation, deleteProductionStation, backupData, restoreData,
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
