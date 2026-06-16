import React, { useState } from "react";
import { usePOS } from "../store/posStore";
import { UserRole, Table, Category, Product, Order, User, OrderStatus, OrderItem } from "../types";
import { 
  BarChart3, Settings, ShieldCheck, Users, Utensils, TableProperties, 
  Percent, FileJson, Sparkles, TrendingUp, DollarSign, ListOrdered, 
  Trash2, Edit, Plus, Check, Star, AlertTriangle, QrCode, Key, Eye, EyeOff, Save, Download, Coffee, Activity, X,
  Copy, FolderPlus, Flame, Cake, Pizza, Soup, ChefHat, Printer
} from "lucide-react";
import { LunaLogo } from "./LunaLogo";
import { ReceiptView } from "./ReceiptPrinters";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from "../data";

export const AdminPanel: React.FC = () => {
  const { 
    currentUser, users, categories, products, tables, orders, settings,
    productionStations, addProductionStation, updateProductionStation, deleteProductionStation,
    adminEditPastOrder,
    updateVat, updateSettings, addUser, updateUser, deleteUser,
    addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct,
    addTable, removeTable, backupData, restoreData, addNotification,
    clearAllCategories, clearAllProducts, importNewMenu, reseedDefaultMenu
  } = usePOS();

  // Active admin sub-tab: "reports" | "menu" | "users" | "tables" | "settings" | "manual" | "stations"
  const [adminTab, setAdminTab] = useState<"reports" | "menu" | "users" | "tables" | "settings" | "manual" | "stations">("reports");

  // Report Period Selector: "today" | "week" | "month" | "year"
  const [reportPeriod, setReportPeriod] = useState<"today" | "week" | "month" | "year">("month");
  const [selectedLedgerDate, setSelectedLedgerDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // User details state
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.WAITER);
  const [newUserPin, setNewUserPin] = useState("");
  const [newUserMail, setNewUserMail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");

  // Category details state
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("Coffee");
  const [catImage, setCatImage] = useState("");

  // Category editing states
  const [editingCategoryItem, setEditingCategoryItem] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatIcon, setEditCatIcon] = useState("Coffee");
  const [editCatImage, setEditCatImage] = useState("");

  // Selected Category ID
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("cat-main");
  const [isAddingProductInline, setIsAddingProductInline] = useState(true);
  const [adminProductSearch, setAdminProductSearch] = useState("");

  // Product details state
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodPrice, setProdPrice] = useState(5.5);
  const [prodImage, setProdImage] = useState("");
  const [prodIsDrink, setProdIsDrink] = useState(false);
  const [prodStationId, setProdStationId] = useState("station-kitchen");
  const [prodDescription, setProdDescription] = useState("");

  // Stations management states
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editingStationName, setEditingStationName] = useState("");
  const [newStationName, setNewStationName] = useState("");

  // Past bill editing modal states
  const [auditingOrder, setAuditingOrder] = useState<Order | null>(null);
  const [auditedItems, setAuditedItems] = useState<OrderItem[]>([]);
  const [auditDiscount, setAuditDiscount] = useState<number>(0);
  const [auditService, setAuditService] = useState<number>(0);
  const [auditReason, setAuditReason] = useState<string>("");
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Product Edit modal States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState("");
  const [editProdCategory, setEditProdCategory] = useState("");
  const [editProdPrice, setEditProdPrice] = useState(5.5);
  const [editProdImage, setEditProdImage] = useState("");
  const [editProdIsDrink, setEditProdIsDrink] = useState(false);
  const [editProdStationId, setEditProdStationId] = useState("station-kitchen");
  const [editProdDescription, setEditProdDescription] = useState("");

  // Employee Edit modal States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserRole>(UserRole.WAITER);
  const [editUserPin, setEditUserPin] = useState("");
  const [editUserMail, setEditUserMail] = useState("");
  const [editUserPass, setEditUserPass] = useState("");

  // Table details state
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableName, setNewTableName] = useState("");

  // Restore details state
  const [restoreJson, setRestoreJson] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState<boolean | null>(null);

  // Visual Image preset dictionary
  const PRESET_PICTURES = [
    { title: "Latte Coffee", url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400" },
    { title: "Matcha Tea", url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400" },
    { title: "Smoothie Shakes", url: "https://images.unsplash.com/photo-1536882240095-0379873feb4e?auto=format&fit=crop&q=80&w=400" },
    { title: "Fresh Juice", url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400" },
    { title: "Pancakes", url: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&q=80&w=400" },
    { title: "Cheese Pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400" },
    { title: "Beef Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400" },
    { title: "Fries Basket", url: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=400" }
  ];

  // Filter out archived products for stats
  const activeProducts = products.filter(p => !p.isArchived);

  // CALCULATE REPORTS AND ANALYTICS BY TEMPORAL SELECTOR
  // -------------------------------------------------------------
  const paidOrders = orders.filter(o => o.status === "Paid" || o.paymentStatus === "Paid");
  
  const filteredPaidOrders = paidOrders.filter(o => {
    const orderTimeMs = typeof o.createdAt === "string" ? new Date(o.createdAt).getTime() : o.createdAt;
    const diffMs = Date.now() - orderTimeMs;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (reportPeriod === "today") return diffDays <= 1;
    if (reportPeriod === "week") return diffDays <= 7;
    if (reportPeriod === "month") return diffDays <= 30;
    if (reportPeriod === "year") return diffDays <= 365;
    return true;
  });

  const totalRevenue = filteredPaidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalSubtotal = filteredPaidOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalVatCollected = filteredPaidOrders.reduce((sum, o) => sum + o.vatAmount, 0);
  const ordersCount = filteredPaidOrders.length;
  
  // Calculate best and least selling products on the current temporal query
  const productSalesMap: { [id: string]: { name: string; count: number; rev: number } } = {};
  
  activeProducts.forEach(p => {
    productSalesMap[p.id] = { name: p.name, count: 0, rev: 0 };
  });

  filteredPaidOrders.forEach(order => {
    order.items.forEach(it => {
      if (productSalesMap[it.productId]) {
        productSalesMap[it.productId].count += it.quantity;
        productSalesMap[it.productId].rev += it.price * it.quantity;
      } else {
        productSalesMap[it.productId] = { name: it.name, count: it.quantity, rev: it.price * it.quantity };
      }
    });
  });

  const sortedSales = Object.entries(productSalesMap)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => b.count - a.count);

  const bestSellers = sortedSales.slice(0, 5).filter(s => s.count > 0);
  const leastSellers = [...sortedSales].reverse().slice(0, 5).filter(s => s.count >= 0);

  // Waiter workload stats on target period
  const waiterWorkMap: { [name: string]: { count: number; rev: number } } = {};
  filteredPaidOrders.forEach(o => {
    const waiter = o.waiterName || "Counter Self-Order";
    if (!waiterWorkMap[waiter]) {
      waiterWorkMap[waiter] = { count: 0, rev: 0 };
    }
    waiterWorkMap[waiter].count += 1;
    waiterWorkMap[waiter].rev += o.grandTotal;
  });

  // Table usage stats on target period
  const tableRevenueMap: { [tableId: string]: { name: string; count: number; rev: number } } = {};
  tables.forEach(t => {
    tableRevenueMap[t.tableId] = { name: t.name, count: 0, rev: 0 };
  });
  filteredPaidOrders.forEach(o => {
    if (tableRevenueMap[o.tableId]) {
      tableRevenueMap[o.tableId].count += 1;
      tableRevenueMap[o.tableId].rev += o.grandTotal;
    }
  });

  const sortedTablesStats = Object.entries(tableRevenueMap)
    .map(([tableId, info]) => ({ tableId, ...info }))
    .sort((a,b) => b.rev - a.rev)
    .slice(0, 5);

  // CHANNEL BREAKDOWN MAP (Required for multi payment channel statistics reporting)
  const paymentChannelSummaryMap: { [key: string]: { total: number; count: number } } = {
    "Cash": { total: 0, count: 0 },
    "Zaad (480495)": { total: 0, count: 0 },
    "Sahal (319347)": { total: 0, count: 0 },
    "eDahab (759816)": { total: 0, count: 0 },
    "MyCash (951993)": { total: 0, count: 0 },
    "TPlus (871056)": { total: 0, count: 0 }
  };

  filteredPaidOrders.forEach(o => {
    const method = o.paymentMethod || "Cash";
    let groupKey = "Cash";
    if (method.includes("Zaad")) groupKey = "Zaad (480495)";
    else if (method.includes("Sahal")) groupKey = "Sahal (319347)";
    else if (method.includes("eDahab")) groupKey = "eDahab (759816)";
    else if (method.includes("MyCash")) groupKey = "MyCash (951993)";
    else if (method.includes("TPlus")) groupKey = "TPlus (871056)";

    if (paymentChannelSummaryMap[groupKey]) {
      paymentChannelSummaryMap[groupKey].total += o.grandTotal;
      paymentChannelSummaryMap[groupKey].count += 1;
    }
  });

  // Action methods
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName) return;
    const isSystemRole = newUserRole === UserRole.DEVELOPER || newUserRole === UserRole.MANAGER;
    addUser(
      newUserName, 
      newUserRole, 
      isSystemRole ? undefined : (newUserPin || undefined), 
      isSystemRole ? (newUserMail || undefined) : undefined,
      isSystemRole ? (newUserPass || undefined) : undefined
    );
    setNewUserName("");
    setNewUserPin("");
    setNewUserMail("");
    setNewUserPass("");
  };

  const startEditingEmployee = (u: User) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserRole(u.role);
    setEditUserPin(u.pin || "");
    setEditUserMail(u.username || "");
    setEditUserPass(u.password || "");
  };

  const handleSaveEmployeeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const isSystemRole = editUserRole === UserRole.DEVELOPER || editUserRole === UserRole.MANAGER;
    updateUser(editingUser.id, {
      name: editUserName,
      role: editUserRole,
      pin: isSystemRole ? undefined : editUserPin,
      username: isSystemRole ? editUserMail : undefined,
      password: isSystemRole ? editUserPass : undefined
    });
    setEditingUser(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    addCategory(catName, catIcon, catImage);
    setCatName("");
    setCatImage("");
    setCatIcon("Coffee");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName) return;
    
    const imgUrl = prodImage || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400`;

    const targetCatId = prodCategory || selectedCategoryId || categories[0]?.id || "cat-main";

    addProduct({
      name: prodName,
      categoryId: targetCatId,
      price: prodPrice,
      available: true,
      image: imgUrl,
      isDrink: prodIsDrink,
      stationId: prodStationId,
      description: prodDescription
    });

    setProdName("");
    setProdImage("");
    setProdPrice(5.5);
    setProdIsDrink(false);
    setProdStationId("station-kitchen");
    setProdDescription("");
  };

  const startEditingProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdCategory(p.categoryId);
    setEditProdPrice(p.price);
    setEditProdImage(p.image);
    setEditProdIsDrink(!!p.isDrink);
    setEditProdStationId(p.stationId || "station-kitchen");
    setEditProdDescription(p.description || "");
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, {
      name: editProdName,
      categoryId: editProdCategory,
      price: editProdPrice,
      image: editProdImage,
      isDrink: editProdIsDrink,
      stationId: editProdStationId,
      description: editProdDescription
    });
    setEditingProduct(null);
  };

  const handleInitiateEditBill = (order: Order) => {
    setAuditingOrder(order);
    setAuditedItems([...order.items]);
    setAuditDiscount(order.discountAmount || 0);
    setAuditService(order.serviceCharge || 0);
    setAuditReason("");
  };

  const handleUpdateAuditQty = (pId: string, delta: number) => {
    setAuditedItems(prev => prev.map(it => {
      if (it.productId === pId) {
        return { ...it, quantity: Math.max(0, it.quantity + delta) };
      }
      return it;
    }).filter(it => it.quantity > 0));
  };

  const handleUpdateAuditPrice = (pId: string, newPrice: number) => {
    setAuditedItems(prev => prev.map(it => {
      if (it.productId === pId) {
        return { ...it, price: Math.max(0, newPrice) };
      }
      return it;
    }));
  };

  const handleAddProductToAudit = (pId: string) => {
    const prod = products.find(p => p.id === pId);
    if (!prod) return;
    
    const existing = auditedItems.find(it => it.productId === pId);
    if (existing) {
      handleUpdateAuditQty(pId, 1);
    } else {
      const newItem: OrderItem = {
        name: prod.name,
        productId: prod.id,
        price: prod.price,
        quantity: 1,
        isDrink: !!prod.isDrink,
        stationId: prod.stationId || (prod.isDrink ? "station-bar" : "station-kitchen")
      };
      setAuditedItems(prev => [...prev, newItem]);
    }
  };

  const handleSaveBillAudits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditingOrder) return;

    if (auditedItems.length === 0) {
      addNotification("SYSTEM", "Update Rejected", "Order must contain at least one selection.");
      return;
    }

    const editorName = currentUser?.name || "Admin (Auditing)";
    adminEditPastOrder(
      auditingOrder.id,
      auditedItems,
      auditDiscount,
      auditService,
      `${editorName}: ${auditReason || "Admin adjustments applied"}`
    );

    addNotification("SYSTEM", "Bill Edited Success", `Order ${auditingOrder.orderNumber} recalculated, audit logs generated.`);
    setAuditingOrder(null);
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum) return;
    const padded = newTableNum.padStart(2, "0");
    const name = newTableName || `Table ${padded}`;
    addTable(padded, name);
    setNewTableNum("");
    setNewTableName("");
  };

  const handleDownloadBackup = () => {
    const data = backupData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `luna-cafe-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ok = restoreData(restoreJson);
      setRestoreSuccess(ok);
      if (ok) {
        setRestoreJson("");
        setTimeout(() => setRestoreSuccess(null), 3000);
      }
    } catch {
      setRestoreSuccess(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-stone-950 font-sans text-stone-100 relative">
      
      {/* Header controls pane */}
      <header className="bg-stone-900 border-b border-stone-850 px-6 py-4 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1 px-2.5 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-center">
            <LunaLogo size={42} hideText={true} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
              Luna Control Centre
              <span className="text-[10px] bg-amber-500/15 border border-[#E5C158]/20 text-[#E5C158] font-mono px-2 py-0.5 rounded-full font-black uppercase">
                {currentUser?.role || "ADMIN"} PANEL
              </span>
            </h2>
            <p className="text-[11px] text-stone-400">Manage cafe dishes, shifts, tables, and financial reporting modules.</p>
          </div>
        </div>

        {/* Tab switcher buttons under customized black/golds */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
          {[
            { id: "reports", label: "Reports & Channels", icon: BarChart3 },
            { id: "menu", label: "Beverages & Dishes", icon: Utensils },
            { id: "stations", label: "Production Stations", icon: ChefHat },
            { id: "users", label: "Employees Auth", icon: Users },
            { id: "tables", label: "Floor Tables & QR", icon: TableProperties },
            { id: "settings", label: "Cafe Settings", icon: Settings },
            { id: "manual", label: "System Manual (PDF)", icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-[11px] font-black tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                  adminTab === tab.id 
                    ? "bg-[#E5C158] text-stone-950 shadow-md font-bold" 
                    : "text-stone-400 hover:text-stone-100 hover:bg-stone-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container Contents */}
      <div className="flex-1 overflow-hidden p-6 max-w-7xl w-full mx-auto flex flex-col">
        
        {adminTab === "reports" && (
          /* ==============================================
             KPI REPORTS & SALES ANALYTICS
             ============================================== */
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            
            {/* Temporal Period Bar */}
            <div className="bg-stone-900 border border-stone-800 p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#E5C158]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-300">Reporting Query Interval</span>
              </div>
              <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-850 gap-1 text-[10px] font-extrabold uppercase">
                {[
                  { id: "today", label: "Daily (24H)" },
                  { id: "week", label: "Weekly (7D)" },
                  { id: "month", label: "Monthly (30D)" },
                  { id: "year", label: "Yearly (365D)" }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setReportPeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      reportPeriod === p.id 
                        ? "bg-[#E5C158]/25 border border-[#E5C158]/30 text-[#E5C158]" 
                        : "text-stone-400 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Metric Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
              <div className="bg-stone-900 rounded-2xl p-4 border border-stone-850 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#E5C158] font-black uppercase tracking-widest block">Gross Revenue</span>
                  <p className="text-xl font-bold font-mono text-white">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-[#E5C158]/10 rounded-xl flex items-center justify-center text-[#E5C158] border border-[#E5C158]/10">
                  <DollarSign className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              <div className="bg-stone-900 rounded-2xl p-4 border border-stone-850 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-widest block">Invoices Cleared</span>
                  <p className="text-xl font-bold font-mono text-white">{ordersCount} orders</p>
                </div>
                <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center text-stone-300">
                  <ListOrdered className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              <div className="bg-stone-900 rounded-2xl p-4 border border-stone-850 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-widest block">Total VAT ({settings.vatPercentage || 5}%)</span>
                  <p className="text-xl font-bold font-mono text-white">${totalVatCollected.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center text-stone-300">
                  <Percent className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              <div className="bg-stone-900 rounded-2xl p-4 border border-stone-850 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#E5C158] font-black uppercase tracking-widest block">Net Subtotal</span>
                  <p className="text-xl font-bold font-mono text-white">${totalSubtotal.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-[#E5C158]/10 rounded-xl flex items-center justify-center text-[#E5C158] border border-[#E5C158]/10">
                  <TrendingUp className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>

            {/* CHANNEL BILLING CONTRIBUTIONS (Required Payment Summary) */}
            <div className="bg-stone-900 border border-stone-850 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <h3 className="text-xs uppercase tracking-widest font-black text-[#E5C158] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Mobile Wallet Channels & Cash Split
                </h3>
                <span className="text-[9px] text-stone-500 font-mono font-bold uppercase">Consolidated contributions</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-1">
                {Object.entries(paymentChannelSummaryMap).map(([method, data]) => {
                  const share = totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0;
                  return (
                    <div key={method} className="bg-stone-950 border border-stone-800 p-3 rounded-xl flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[10px] text-stone-300 font-extrabold block truncate leading-tight">{method}</span>
                        <span className="text-[9px] text-stone-500 block">{data.count} tx slips</span>
                      </div>
                      <div>
                        <p className="text-base font-bold font-mono text-white leading-tight">${data.total.toFixed(2)}</p>
                        <div className="w-full bg-stone-900 h-1.5 rounded-full overflow-hidden mt-1 max-w-[80px]">
                          <div className="h-full bg-[#E5C158]" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-[9px] text-[#E5C158] font-bold mt-1 block">{share.toFixed(1)}% split</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Middle Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              
              <div className="bg-stone-900 border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#E5C158] flex items-center gap-1.5 pb-2 border-b border-stone-800">
                  <Star className="w-4 h-4 text-[#E5C158] fill-[#E5C158]" />
                  Best-Selling Items Matrix
                </h3>
                
                {bestSellers.length === 0 ? (
                  <p className="text-xs text-stone-550 py-10 text-center font-bold uppercase tracking-widest">No Sales Registered For This Period.</p>
                ) : (
                  <div className="space-y-4">
                    {bestSellers.map((item, idx) => {
                      const maxUnits = bestSellers[0]?.count || 1;
                      const percent = (item.count / maxUnits) * 100;
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-stone-300 font-bold">
                            <span>{idx+1}. {item.name}</span>
                            <span className="font-mono text-stone-100">{item.count} items - <b className="text-[#E5C158]">${item.rev.toFixed(2)}</b></span>
                          </div>
                          <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-stone-900 border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#E5C158] flex items-center gap-1.5 pb-2 border-b border-stone-800">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Under-performing Selections
                </h3>
                
                {leastSellers.length === 0 ? (
                  <p className="text-xs text-stone-550 py-10 text-center font-bold uppercase tracking-widest">Beverage analytics unavailable.</p>
                ) : (
                  <div className="space-y-4">
                    {leastSellers.map((item, idx) => {
                      const maxUnits = Math.max(...leastSellers.map(s => s.count)) || 1;
                      const percent = maxUnits > 0 ? (item.count / maxUnits) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-stone-300 font-bold">
                            <span>{idx+1}. {item.name}</span>
                            <span className="font-mono text-stone-100">{item.count} items - <b className="text-rose-450">${item.rev.toFixed(2)}</b></span>
                          </div>
                          <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.max(percent, 5)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tables Usage & Staff Workload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              
              <div className="bg-stone-900 border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[#E5C158] text-[#E5C158] pb-2 border-b border-stone-800">
                  Most Visited floor tables
                </h3>
                {sortedTablesStats.filter(t => t.rev > 0).length === 0 ? (
                  <p className="text-xs text-stone-550 py-10 text-center font-bold uppercase">No transactions printed on floor tables yet.</p>
                ) : (
                  <div className="space-y-4">
                    {sortedTablesStats.filter(t => t.rev > 0).map((t, idx) => {
                      const maxRev = sortedTablesStats[0]?.rev || 1;
                      const percent = (t.rev / maxRev) * 100;
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-stone-200 font-bold">
                            <span>{t.name} ({t.tableId})</span>
                            <span className="font-mono text-stone-300">{t.count} checks - <b className="text-[#E5C158]">${t.rev.toFixed(2)}</b></span>
                          </div>
                          <div className="h-1.5 bg-stone-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-stone-900 border border-stone-850 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#E5C158] pb-2 border-b border-stone-800">
                  Waiter & Chef Shift workloads
                </h3>
                {Object.keys(waiterWorkMap).length === 0 ? (
                  <p className="text-xs text-stone-550 py-10 text-center font-bold uppercase">No operational worker took orders today.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(waiterWorkMap).map(([name, data], idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-stone-850 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-[#E5C158] rounded-full animate-pulse" />
                          <span className="font-bold text-stone-200">{name}</span>
                        </div>
                        <div className="font-mono text-stone-300">
                          <span>{data.count} orders</span>
                          <span className="text-stone-600 mx-2">|</span>
                          <span className="text-white font-extrabold">${data.rev.toFixed(2)} values</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Daily Ledger Archive System */}
            <div className="bg-stone-900 border border-stone-850 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-stone-800 gap-2">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-black text-[#E5C158] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Staff Activity Journals & Daily Ledger History
                  </h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Audit historical billing ledgers for waiters & cashiers across months and years.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 uppercase font-black">Audit Date:</span>
                  <input 
                    type="date" 
                    id="ledger-audit-date"
                    className="bg-stone-950 text-white font-mono text-xs rounded border border-stone-800 px-2 py-1 focus:border-[#E5C158] outline-none"
                    value={selectedLedgerDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if(val) setSelectedLedgerDate(val);
                    }}
                  />
                </div>
              </div>

              {(() => {
                const targetDate = selectedLedgerDate || new Date().toISOString().split('T')[0];
                const dayOrders = orders.filter(o => o.createdAt.startsWith(targetDate));
                
                const grossSales = dayOrders
                  .filter(o => o.status === OrderStatus.PAID)
                  .reduce((sum, o) => sum + o.totalAmount, 0);

                const countPaid = dayOrders.filter(o => o.status === OrderStatus.PAID).length;
                const countServedUnpaid = dayOrders.filter(o => o.status === OrderStatus.SERVED).length;
                const countPending = dayOrders.filter(o => o.status === OrderStatus.PENDING_QR).length;
                const countCancelled = dayOrders.filter(o => o.status === OrderStatus.CANCELLED).length;
                const countNew = dayOrders.filter(o => o.status === OrderStatus.NEW).length;

                const waiterSales: { [waiterName: string]: { count: number; total: number } } = {};
                const cashierSales: { [cashierName: string]: { count: number; total: number } } = {};

                dayOrders.forEach(o => {
                  const wName = o.waiterName || "Self-Service (QR)";
                  if (!waiterSales[wName]) {
                    waiterSales[wName] = { count: 0, total: 0 };
                  }
                  waiterSales[wName].count += 1;
                  if (o.status === OrderStatus.PAID) {
                    waiterSales[wName].total += o.totalAmount;
                  }

                  if (o.status === OrderStatus.PAID) {
                    const cName = o.cashierName || "Farhan";
                    if (!cashierSales[cName]) {
                      cashierSales[cName] = { count: 0, total: 0 };
                    }
                    cashierSales[cName].count += 1;
                    cashierSales[cName].total += o.totalAmount;
                  }
                });

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 font-sans">
                      <div className="bg-stone-950 p-3 rounded-xl border border-stone-850">
                        <span className="text-[9px] text-[#E5C158] uppercase font-black tracking-wider block">Gross Sales</span>
                        <span className="text-xs font-bold font-mono text-white">${grossSales.toFixed(2)}</span>
                      </div>
                      <div className="bg-stone-950 p-3 rounded-xl border border-stone-850">
                        <span className="text-[9px] text-emerald-400 uppercase font-black tracking-wider block">Paid/Settled</span>
                        <span className="text-xs font-bold font-mono text-white">{countPaid} orders</span>
                      </div>
                      <div className="bg-stone-950 p-3 rounded-xl border border-stone-850">
                        <span className="text-[9px] text-amber-500 uppercase font-black tracking-wider block">Served Unpaid</span>
                        <span className="text-xs font-bold font-mono text-white">{countServedUnpaid} orders</span>
                      </div>
                      <div className="bg-stone-950 p-3 rounded-xl border border-stone-850">
                        <span className="text-[9px] text-red-500 uppercase font-black tracking-wider block">Cancelled/Void</span>
                        <span className="text-xs font-bold font-mono text-white">{countCancelled} orders</span>
                      </div>
                      <div className="bg-stone-950 p-3 rounded-xl border border-stone-850 col-span-2 lg:col-span-1">
                        <span className="text-[9px] text-stone-400 uppercase font-black tracking-wider block">WIP / Pending</span>
                        <span className="text-xs font-bold font-mono text-white">{countNew + countPending} orders</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans">
                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-850 space-y-3">
                        <h4 className="text-[10px] uppercase font-black text-stone-300 tracking-wider pb-1.5 border-b border-stone-900">
                          Waiter Daily Journals
                        </h4>
                        {Object.keys(waiterSales).length === 0 ? (
                          <p className="text-[10px] text-stone-500 italic py-2">No waiters logged activities for this date.</p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {Object.entries(waiterSales).map(([name, stats]) => (
                              <div key={name} className="flex justify-between text-xs text-stone-300 pb-1.5 border-b border-stone-900/40 last:border-0 last:pb-0">
                                <span className="font-extrabold">{name}</span>
                                <span className="font-mono text-stone-400">
                                  {stats.count} orders created | <span className="text-emerald-400 font-bold">${stats.total.toFixed(2)} settled value</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-850 space-y-3">
                        <h4 className="text-[10px] uppercase font-black text-stone-300 tracking-wider pb-1.5 border-b border-stone-900">
                          Cashier Settlement Journals
                        </h4>
                        {Object.keys(cashierSales).length === 0 ? (
                          <p className="text-[10px] text-stone-500 italic py-2">No cashier log settlements for this date.</p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {Object.entries(cashierSales).map(([name, stats]) => (
                              <div key={name} className="flex justify-between text-xs text-stone-300 pb-1.5 border-b border-stone-900/40 last:border-0 last:pb-0">
                                <span className="font-extrabold">{name}</span>
                                <span className="font-mono text-stone-400">
                                  {stats.count} checks cleared | <span className="text-emerald-400 font-black">${stats.total.toFixed(2)} collected</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BILL EDITOR & LEDGER SEARCH */}
                    <div className="bg-stone-950 p-5 rounded-2xl border border-stone-850 space-y-4 font-sans">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-stone-900">
                        <div>
                          <h4 className="text-[11px] uppercase font-black text-[#E5C158] tracking-wider">
                            Daily Bills Ledger & Auditing Terminal
                          </h4>
                          <p className="text-[10px] text-stone-500 font-medium">Browse, adjust pricing, modify item counts, and reprint past receipts.</p>
                        </div>
                        <span className="text-[9px] bg-stone-900 border border-stone-805 text-stone-300 px-2.5 py-1 rounded-md font-bold font-mono">
                          {dayOrders.length} Completed Bills
                        </span>
                      </div>

                      {dayOrders.length === 0 ? (
                        <div className="text-center py-8 text-stone-600 text-xs font-bold uppercase tracking-wider">
                          No transactions found on {selectedLedgerDate}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-stone-900 text-stone-400 font-extrabold uppercase text-[9px] tracking-wider">
                                <th className="py-2.5">Order No</th>
                                <th className="py-2.5">Table</th>
                                <th className="py-2.5">Waiter</th>
                                <th className="py-2.5">Status</th>
                                <th className="py-2.5">Channel</th>
                                <th className="py-2.5 text-right font-mono">Settle Amount</th>
                                <th className="py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-900/60">
                              {dayOrders.map(order => (
                                <tr key={order.id} className="text-stone-300 hover:bg-stone-900/40 transition">
                                  <td className="py-3 font-semibold font-mono text-white">{order.orderNumber}</td>
                                  <td className="py-3 font-extrabold text-amber-400 uppercase">{order.tableName}</td>
                                  <td className="py-3 text-stone-400 font-medium">{order.waiterName || "Self-QR"}</td>
                                  <td className="py-3 font-bold">
                                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-black ${
                                      order.status === "Paid" || order.paymentStatus === "Paid" 
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-950"
                                        : "bg-amber-500/10 text-amber-500 border border-amber-950"
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="py-3 font-mono text-[10px] text-stone-400">{order.paymentMethod || "Cache"}</td>
                                  <td className="py-3 text-right font-bold font-mono text-white">${(order.grandTotal ?? order.totalAmount ?? 0).toFixed(2)}</td>
                                  <td className="py-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleInitiateEditBill(order)}
                                        className="px-2.5 py-1 text-[10px] font-bold bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 rounded-lg transition-all transform active:scale-95 cursor-pointer flex items-center gap-1"
                                      >
                                        <Edit className="w-3 h-3" />
                                        Audit/Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPrintingOrder(order)}
                                        className="px-2.5 py-1 text-[10px] bg-stone-900 text-stone-300 hover:text-white rounded-lg border border-stone-800 transition cursor-pointer flex items-center gap-1"
                                      >
                                        <Printer className="w-3 h-3" />
                                        Print
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        )}

        {adminTab === "menu" && (
          /* ==============================================
             BEVERAGES & DISHES CATALOGUE CONFIGURATOR
             ============================================== */
          <div className="flex-1 overflow-hidden flex flex-col gap-6">
            
            {/* Catalog Master Administration Bar */}
            <div className="bg-stone-950/80 border border-stone-850 p-4 rounded-3xl shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-[#E5C158] uppercase tracking-widest font-black block">Catalog Administration Terminal</span>
                <span className="text-xs text-stone-400 font-sans">Delete default menus, import custom selections, or build catalogs from scratch securely.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete ALL categories? This will wipe your categories list.")) {
                      clearAllCategories();
                      setSelectedCategoryId("");
                    }
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-rose-950 border border-stone-850 hover:border-red-900 rounded-xl text-stone-300 hover:text-red-400 font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Delete All Categories
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete ALL products? This will completely clear your food items list.")) {
                      clearAllProducts();
                    }
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-rose-955 border border-stone-850 hover:border-red-900 rounded-xl text-stone-300 hover:text-red-400 font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Delete All Products
                </button>
                 <button
                  type="button"
                  onClick={() => {
                    if (confirm("Do you want to import a newly designed custom menu? This will replace your catalog.")) {
                      importNewMenu(INITIAL_CATEGORIES, INITIAL_PRODUCTS);
                      setSelectedCategoryId("cat-main");
                    }
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-850 rounded-xl text-stone-250 hover:text-[#E5C158] font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E5C158]" />
                  Import New Menu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Would you like to build menu from scratch? This clears all entries and sets up basic placeholder categories.")) {
                      clearAllCategories();
                      clearAllProducts();
                      setSelectedCategoryId("");
                    }
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-850 rounded-xl text-stone-250 hover:text-[#E5C158] font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5 text-amber-500" />
                  Build Menu from Scratch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reset to factory Luna Café standard default menus?")) {
                      reseedDefaultMenu();
                      setSelectedCategoryId("cat-main");
                    }
                  }}
                  className="px-3 py-1.5 bg-[#E5C158] hover:bg-amber-450 rounded-xl text-stone-950 font-black text-[10px] uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                  Reseed Defaults
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
            
            {/* LEFT COLUMN: Categories Management Section */}
            <div className="w-full lg:w-96 bg-stone-900 border border-stone-850 p-5 rounded-3xl flex flex-col h-full overflow-hidden shrink-0">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 shrink-0">
                <h3 className="font-black text-xs text-[#E5C158] uppercase tracking-widest flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-500" />
                  Menu Categories
                </h3>
                <span className="text-[10px] bg-stone-950 px-2.5 py-1 text-stone-400 font-mono font-bold rounded-full border border-stone-800">
                  {categories.length} total
                </span>
              </div>

              {/* Inline Add Category Form */}
              <div className="mt-4 bg-stone-950 p-4 rounded-2xl border border-stone-850 space-y-3 shrink-0">
                <span className="text-[10px] font-black uppercase text-[#E5C158] tracking-wider block">Add New Category</span>
                <form onSubmit={handleAddCategory} className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" required placeholder="Category Name"
                      value={catName} onChange={(e) => setCatName(e.target.value)}
                      className="w-full p-2 bg-stone-900 border border-stone-800 rounded-xl text-white outline-none focus:border-[#E5C158]"
                    />
                    <select
                      value={catIcon} onChange={(e) => setCatIcon(e.target.value)}
                      className="w-full p-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-200 outline-none font-bold"
                    >
                      <option value="Coffee">☕ Coffee</option>
                      <option value="Utensils">🍽️ Dishes / Mains</option>
                      <option value="Flame">🔥 Sizzling</option>
                      <option value="Cake">🍰 Desserts</option>
                      <option value="Pizza">🍕 Pizza</option>
                      <option value="Soup">🍲 Soup/Appetizers</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-stone-500 font-bold uppercase tracking-wider block">Optional Cover Image URL</span>
                    <input 
                      type="text" placeholder="https://images.unsplash.com/promo.jpg"
                      value={catImage} onChange={(e) => setCatImage(e.target.value)}
                      className="w-full p-2 bg-stone-900 border border-stone-800 rounded-xl text-[10px] font-mono text-stone-300 outline-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 font-black rounded-xl uppercase tracking-widest text-[10px] transition-all cursor-pointer"
                  >
                    + Create Category
                  </button>
                </form>
              </div>

              {/* Scrollable Categories List */}
              <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2.5">
                {categories.map((c) => {
                  const itemsCount = activeProducts.filter(p => p.categoryId === c.id).length;
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <div 
                      key={c.id}
                      onClick={() => setSelectedCategoryId(c.id)}
                      className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${
                        isSelected 
                          ? "bg-amber-955/15 border-[#E5C158] shadow-md" 
                          : "bg-stone-950/50 border-stone-850 hover:bg-stone-950"
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        {c.image ? (
                          <img 
                            src={c.image} alt={c.name}
                            className="w-10 h-10 rounded-xl object-cover border border-stone-800"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100`; }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center border border-stone-700 font-bold">
                            ☕
                          </div>
                        )}
                        <div>
                          <span className={`font-black text-xs block ${isSelected ? "text-[#E5C158]" : "text-white"}`}>{c.name}</span>
                          <span className="text-[10px] text-stone-500 font-bold block">{itemsCount} Products</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 relative z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategoryItem(c);
                            setEditCatName(c.name);
                            setEditCatIcon(c.icon);
                            setEditCatImage(c.image || "");
                          }}
                          className="p-1 px-2 bg-stone-900 border border-stone-800 hover:border-[#E5C158] text-stone-400 hover:text-white rounded-lg transition text-[10px] font-bold cursor-pointer"
                          title="Edit Category"
                        >
                          Edit
                        </button>
                        {categories.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete Category "${c.name}"?`)) {
                                deleteCategory(c.id);
                                if (selectedCategoryId === c.id) {
                                  setSelectedCategoryId(categories.find(cat => cat.id !== c.id)?.id || "");
                                }
                              }
                            }}
                            className="p-1 px-2 bg-stone-900 border border-stone-800 hover:bg-rose-950 text-stone-500 hover:text-rose-400 rounded-lg transition text-[10px] cursor-pointer"
                            title="Delete Category"
                          >
                            Purge
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Selected Category Products Showcase */}
            <div className="flex-1 bg-stone-900 border border-stone-850 rounded-3xl p-5 shadow-xs flex flex-col h-full overflow-hidden">
              {(() => {
                const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
                if (!selectedCategory) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-500">
                      <Coffee className="w-12 h-12 mb-3 text-stone-600 animate-bounce" />
                      <p className="font-extrabold uppercase tracking-wider text-xs">No Categories Exist Yet</p>
                      <p className="text-[10px] mt-1">Use the left column form to initialize a menu category.</p>
                    </div>
                  );
                }

                const catProducts = activeProducts
                  .filter(p => adminProductSearch ? true : (p.categoryId === selectedCategory.id))
                  .filter(p => {
                    const matchesName = p.name.toLowerCase().includes(adminProductSearch.toLowerCase());
                    const cat = categories.find(c => c.id === p.categoryId);
                    const matchesCategoryName = cat ? cat.name.toLowerCase().includes(adminProductSearch.toLowerCase()) : false;
                    return matchesName || matchesCategoryName;
                  });

                return (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Category Cover Banner Header */}
                    <div className="relative h-28 rounded-2xl overflow-hidden shrink-0 mb-5 border border-stone-850 shadow">
                      {selectedCategory.image ? (
                        <img 
                          src={selectedCategory.image} alt={selectedCategory.name}
                          className="w-full h-full object-cover filter brightness-[0.25]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-amber-950 to-stone-950 opacity-90" />
                      )}
                      <div className="absolute inset-0 p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] bg-amber-500/10 border border-[#E5C158]/30 text-[#E5C158] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Luna Café Menu Station
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategoryItem(selectedCategory);
                                setEditCatName(selectedCategory.name);
                                setEditCatIcon(selectedCategory.icon);
                                setEditCatImage(selectedCategory.image || "");
                              }}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                            >
                              Edit Category
                            </button>
                            <button
                              onClick={() => {
                                const prodNameInp = prompt(`Enter product name for category "${selectedCategory.name}":`);
                                if (prodNameInp) {
                                  const priceInp = parseFloat(prompt("Enter catalog price ($):", "5.50") || "0") || 5.5;
                                  const descInp = prompt("Enter brief catalog description (optional):") || "";
                                  addProduct({
                                    name: prodNameInp,
                                    categoryId: selectedCategory.id,
                                    price: priceInp,
                                    available: true,
                                    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400",
                                    isDrink: false,
                                    description: descInp
                                  });
                                }
                              }}
                              className="px-2.5 py-1 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-900 font-extrabold rounded-lg text-[10px] transition cursor-pointer"
                            >
                              + Add New Item
                            </button>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-wider">{selectedCategory.name} Catalogue</h2>
                          <p className="text-[10px] text-stone-300 mt-0.5">Manage products and pricing for the {selectedCategory.name} station.</p>
                        </div>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-4 relative shrink-0">
                      <input 
                        type="text"
                        value={adminProductSearch}
                        onChange={(e) => setAdminProductSearch(e.target.value)}
                        placeholder="Search menu items, beverages, or dishes..."
                        className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl bg-orange-50 hover:bg-white focus:bg-white text-stone-900 border-2 border-amber-800/60 outline-none focus:outline-none focus:border-amber-950 font-bold shadow-sm transition font-sans"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-950 font-black">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </span>
                      {adminProductSearch && (
                        <button 
                          onClick={() => setAdminProductSearch("")}
                          type="button"
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 hover:text-neutral-950 rounded-full font-semibold text-[9px] w-4.5 h-4.5 flex items-center justify-center transition"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Products Management Grid */}
                    <div className="flex-1 overflow-y-auto mt-2 pr-1">
                      {catProducts.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500 bg-stone-950/45 rounded-3xl border border-dashed border-stone-850 p-6">
                          <Utensils className="w-10 h-10 mb-2 text-stone-700 animate-pulse" />
                          <p className="font-extrabold uppercase text-xs tracking-wider">No Products Exist in {selectedCategory.name}</p>
                          <p className="text-[10px] mt-1 text-stone-500">Click the "+ Add New Item" or use the form underneath to seed a new selection.</p>
                          <button
                            onClick={() => {
                              setSelectedCategoryId(selectedCategory.id);
                              setProdCategory(selectedCategory.id);
                              setIsAddingProductInline(true);
                            }}
                            className="mt-3 px-4 py-2 bg-amber-500/10 border border-[#E5C158]/30 text-[#E5C158] font-bold rounded-xl text-[10px] hover:bg-amber-500/20 cursor-pointer"
                          >
                            + Add First Selection
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {catProducts.map((p) => (
                            <div key={p.id} className="bg-stone-950/50 border border-stone-850 p-4 rounded-3xl hover:border-stone-700 transition flex flex-col justify-between">
                              <div className="flex gap-3">
                                <img 
                                  src={p.image} alt={p.name} 
                                  className="w-16 h-16 rounded-xl object-cover border border-stone-800 shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=150`; }}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="space-y-1 w-full overflow-hidden">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-extrabold text-white text-xs truncate max-w-[120px]">{p.name}</h4>
                                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${p.isDrink ? "bg-cyan-900/40 text-cyan-400" : "bg-orange-900/40 text-orange-400"}`}>
                                      {p.isDrink ? "Drink" : "Food"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-400 line-clamp-2 leading-relaxed">
                                    {p.description || "Premium specialty option tailored for Luna Café."}
                                  </p>
                                  <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Price</span>
                                    <div className="flex items-center">
                                      <span className="text-stone-500 text-xs mr-0.5 font-bold font-mono">$</span>
                                      <input 
                                        type="number" step="0.01" min="0.1" max="1000000"
                                        value={p.price}
                                        onChange={(e) => {
                                          const nextValue = parseFloat(e.target.value) || 0;
                                          updateProduct(p.id, { price: nextValue });
                                        }}
                                        className="w-16 bg-stone-900 text-white font-mono font-black text-xs rounded border border-stone-800 px-1 py-0.5 text-center focus:border-[#E5C158] outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action items row */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-900">
                                <button
                                  onClick={() => updateProduct(p.id, { available: !p.available })}
                                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer ${
                                    p.available 
                                      ? "bg-[#2e7d32]/10 border border-[#2e7d32]/30 text-[#4caf50] hover:bg-[#2e7d32]/20" 
                                      : "bg-[#c62828]/10 border border-[#c62828]/30 text-[#ef5350] hover:bg-[#c62828]/20"
                                  }`}
                                >
                                  {p.available ? "● Available" : "● Disabled"}
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      // Duplicate Product function
                                      addProduct({
                                        name: `${p.name} (Copy)`,
                                        categoryId: p.categoryId,
                                        price: p.price,
                                        available: p.available,
                                        image: p.image,
                                        isDrink: p.isDrink,
                                        description: p.description
                                      });
                                    }}
                                    className="p-1.5 bg-stone-900 hover:bg-stone-800 text-[#E5C158] hover:text-white rounded-lg border border-stone-800 transition cursor-pointer"
                                    title="Duplicate product"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => startEditingProduct(p)}
                                    className="p-1.5 bg-stone-900 hover:bg-stone-800 text-sky-400 hover:text-white rounded-lg border border-stone-800 transition cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                        deleteProduct(p.id);
                                      }
                                    }}
                                    className="p-1.5 bg-stone-900 hover:bg-stone-850 text-red-500 hover:text-white rounded-lg border border-stone-800 transition cursor-pointer"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Adding Segment underneath */}
                    <div className="mt-4 bg-stone-950 p-4 rounded-2xl border border-stone-850 shrink-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                          Create Menu Selection Under {selectedCategory.name}
                        </span>
                        <button 
                          onClick={() => setIsAddingProductInline(!isAddingProductInline)}
                          className="text-[9px] text-[#E5C158] hover:underline font-bold cursor-pointer"
                        >
                          {isAddingProductInline ? "Hide Creator Form" : "Open Creator Form"}
                        </button>
                      </div>
                      
                      {isAddingProductInline && (
                        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                          <div className="space-y-1 col-span-1">
                            <input 
                              type="text" required placeholder="Product Name"
                              value={prodName} onChange={(e) => setProdName(e.target.value)}
                              className="w-full p-2.5 bg-stone-900 border border-stone-850 rounded-xl text-white outline-none focus:border-[#E5C158]"
                            />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <input 
                              type="number" step="0.01" required min="0.1" max="1000000" placeholder="Price ($)"
                              value={prodPrice} onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                              className="w-full p-2.5 bg-stone-900 border border-stone-850 rounded-xl text-white outline-none font-mono focus:border-[#E5C158]"
                            />
                          </div>
                          <div className="space-y-1 col-span-1">
                            <select 
                              value={prodStationId} onChange={(e) => setProdStationId(e.target.value)}
                              className="w-full p-2.5 bg-stone-900 border border-stone-850 rounded-xl text-white outline-none focus:border-[#E5C158]"
                            >
                              {productionStations.map(station => (
                                <option key={station.id} value={station.id}>
                                  {station.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1 col-span-1 flex-1">
                            <input 
                              type="text" placeholder="Description (E.g. Sweet, Creamy)"
                              value={prodDescription} onChange={(e) => setProdDescription(e.target.value)}
                              className="w-full p-2.5 bg-stone-900 border border-stone-850 rounded-xl text-white outline-none focus:border-[#E5C158]"
                            />
                          </div>
                          <button 
                            type="submit"
                            className="w-full p-2.5 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 font-black rounded-xl uppercase font-mono tracking-wider cursor-pointer"
                          >
                            + Save Selection
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
        )}

        {adminTab === "users" && (
          /* ==============================================
             STAFF USERS & PIN SYSTEM CONFIG
             ============================================== */
          <div className="flex-1 overflow-hidden flex gap-6">
            
            {/* Locked Registry Notice */}
            <div className="w-80 bg-stone-900 border border-stone-850 p-6 rounded-3xl h-fit space-y-5 shrink-0 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-950/20 border border-amber-900/40 flex items-center justify-center text-[#E5C158] animate-pulse">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-sm text-[#E5C158] uppercase tracking-wider">
                  Registry State: Locked
                </h3>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  The active system staff credentials directory is synchronized with the restaurant's official registry. Manual creation of new employee files is strictly restricted.
                </p>
              </div>
              <div className="w-full pt-4 border-t border-stone-800/85 flex items-center justify-center gap-2 text-[10px] uppercase font-black text-stone-500 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                Enrollment Locked
              </div>
            </div>

            {/* Employee lists */}
            <div className="flex-1 bg-stone-900 border border-stone-850 rounded-3xl p-5 flex flex-col h-full overflow-hidden">
              <h3 className="font-black text-xs text-[#E5C158] uppercase tracking-widest pb-3 border-b border-stone-800 shrink-0 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Staff Credentials Directory
              </h3>

              <div className="flex-1 overflow-y-auto mt-4 pr-1">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-450 uppercase tracking-widest font-extrabold text-[9px]">
                      <th className="py-2.5">Name</th>
                      <th className="py-2.5">Assigned Role</th>
                      <th className="py-2.5 font-mono">PIN / Credential Details</th>
                      <th className="py-2.5">Floor Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-stone-800/40 hover:bg-stone-950/35 transition">
                        <td className="py-3 font-extrabold text-[#E5C158] uppercase text-xs">{u.name}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            u.role === UserRole.DEVELOPER ? "bg-rose-950/20 border-rose-900/40 text-rose-450" :
                            u.role === UserRole.MANAGER ? "bg-amber-950/20 border-amber-900/40 text-[#E5C158]" :
                            u.role === UserRole.WAITER ? "bg-blue-950/20 border-blue-900/40 text-blue-400" : "bg-stone-950 text-stone-400 border-stone-800"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold tracking-wider text-stone-300">
                          {u.pin ? `PIN: ${u.pin}` : u.username ? u.username : "SYSTEM KEY APIS"}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                            className={`px-2 py-0.5 rounded text-[9px] font-black cursor-pointer uppercase ${
                              u.isActive ? "bg-emerald-950/50 border border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20" : "bg-stone-950 border border-stone-850 text-stone-500"
                            }`}
                          >
                            {u.isActive ? "ACTIVE" : "DISABLED"}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => startEditingEmployee(u)}
                              className="p-1.5 bg-stone-950 border border-stone-800 hover:border-[#E5C158] text-[#E5C158] rounded-lg transition cursor-pointer"
                              title="Edit credentials"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {u.id !== "u-dev" && (
                              <button 
                                onClick={() => deleteUser(u.id)}
                                className="p-1.5 bg-stone-950 border border-stone-800 hover:border-rose-500 text-rose-400 rounded-lg transition cursor-pointer"
                                title="Revoke staff clearance"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {adminTab === "tables" && (
          /* ==============================================
             CAFE TABLES & QR CODE SYSTEMS
             ============================================== */
          <div className="flex-1 overflow-hidden flex gap-6">
            
            <div className="w-80 bg-stone-900 border border-stone-850 p-5 rounded-3xl h-fit space-y-4 shrink-0">
              <div>
                <dt className="text-[10px] text-[#E5C158] font-bold font-mono uppercase tracking-widest">Table Creator</dt>
                <h3 className="font-extrabold text-sm text-white mt-1">Deploy Ground Floor Tables</h3>
                <p className="text-[11px] text-stone-400 leading-normal mt-1">
                  Generates an instantly active customer-facing QR scanning and self-ordering interface.
                </p>
              </div>

              <form onSubmit={handleAddTable} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider block">Floor Table Number (ID)</label>
                  <input 
                    type="number" required placeholder="E.g. 51" min="1" max="99"
                    value={newTableNum} onChange={(e) => setNewTableNum(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 font-bold font-mono outline-none text-white focus:border-[#E5C158]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider block">Custom Desk Alias (Option)</label>
                  <input 
                    type="text" placeholder="E.g. VIP Cushion Lounge 3"
                    value={newTableName} onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 outline-none text-white focus:border-[#E5C158]"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 font-black rounded-xl transition uppercase tracking-wider font-mono shadow-md cursor-pointer"
                >
                  Mount Floor Table QR
                </button>
              </form>
            </div>

            {/* Tables Grid Layout */}
            <div className="flex-1 bg-stone-900 border border-stone-850 rounded-3xl p-5 flex flex-col h-full overflow-hidden">
              <h3 className="font-black text-xs text-[#E5C158] uppercase tracking-widest pb-3 border-b border-stone-800 shrink-0 flex items-center gap-2">
                <TableProperties className="w-4 h-4" />
                Floor plan QR ordering indices
              </h3>

              <div className="flex-1 overflow-y-auto mt-4 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tables.map((t) => (
                    <div key={t.id} className={`bg-stone-950 border p-4 rounded-2xl flex flex-col justify-between gap-3 transition ${t.isEnabled !== false ? "border-stone-800" : "border-red-950 opacity-60"}`}>
                      
                      <div className="flex items-center gap-3">
                        {/* QR Preview Panel */}
                        <div className="p-1.5 bg-white border border-stone-800 rounded-xl flex flex-col items-center justify-center shrink-0">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/?table=${t.tableId}`)}`}
                            alt={t.name}
                            className="w-16 h-16 object-contain"
                          />
                          <span className="text-[7px] text-stone-500 font-black uppercase mt-0.5">QR Preview</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-[#E5C158] text-xs uppercase leading-none">{t.name}</h4>
                          <span className="text-[10px] font-bold font-mono text-stone-400 uppercase tracking-wider block mt-1">{t.tableId}</span>
                          
                          {/* Active Waiter status */}
                          <div className="text-[8px] text-stone-500 uppercase mt-1">
                            Assigned Waiter: <span className="text-stone-300 font-bold">{t.assignedWaiter || "None"}</span>
                          </div>

                          {/* Enabled / Disabled status */}
                          <div className="mt-1">
                            {t.isEnabled !== false ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                ACTIVE / READY
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                                DISABLED / ARCHIVED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* QR Utilities */}
                      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-900 text-[9px] uppercase font-bold tracking-wider">
                        <button 
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?table=${t.tableId}`;
                            navigator.clipboard.writeText(link);
                            addNotification("SYSTEM", "Link Copied", `Table ${t.tableId} link copied.`);
                          }}
                          className="bg-stone-900 border border-stone-800 hover:border-[#E5C158] text-stone-300 hover:text-white py-1 rounded transition text-center"
                        >
                          Copy Link
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?table=${t.tableId}`;
                            const printWindow = window.open("", "_blank");
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Luna Café - ${t.name}</title>
                                    <style>
                                      body { font-family: sans-serif; text-align: center; padding: 40px; margin: 0; background: #fff; color: #000; }
                                      .receipt-box { width: 80mm; margin: 0 auto; border: 1px dashed #ccc; padding: 15px; }
                                      img { width: 180px; height: 180px; margin: 15px 0; }
                                      h1 { font-size: 20px; font-weight: 950; margin: 0; letter-spacing: 1px; }
                                      p { font-size: 11px; margin: 5px 0; }
                                      .footer { font-size: 9px; color: #666; border-top: 1px dashed #000; padding-top: 10px; margin-top: 15px; }
                                    </style>
                                  </head>
                                  <body onload="window.print();">
                                    <div class="receipt-box">
                                      <h1>LUNA CAFÉ</h1>
                                      <p>${t.name} / ${t.tableId}</p>
                                      <p>SCAN TO BROWSE MENU & PLACE ORDER</p>
                                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}" />
                                      <div class="footer">
                                        Thank You For Visiting Luna Cafe
                                      </div>
                                    </div>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }
                          }}
                          className="bg-stone-900 border border-stone-800 hover:border-[#E5C158] text-stone-300 hover:text-white py-1 rounded transition text-center"
                        >
                          Print QR
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?table=${t.tableId}`;
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(link)}`;
                            const a = document.createElement("a");
                            a.href = qrUrl;
                            a.download = `Luna_Cafe_${t.tableId}_QR.png`;
                            a.target = "_blank";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="bg-stone-900 border border-stone-800 hover:border-[#E5C158] text-stone-300 hover:text-white py-1 rounded transition text-center"
                        >
                          Download
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeTable(t.tableId)}
                          className={`border py-1 rounded transition text-center font-black ${
                            t.isEnabled !== false 
                              ? "bg-[#E5C158]/5 border-red-950/30 text-rose-450 hover:bg-rose-950/20" 
                              : "bg-emerald-950/20 border-emerald-900/40 text-emerald-450 hover:bg-emerald-900/20"
                          }`}
                        >
                          {t.isEnabled !== false ? "Disable" : "Enable"}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {adminTab === "settings" && (
          /* ==============================================
             FINANCIAL CONTROLS & SYSTEM SETTINGS
             ============================================== */
          <div className="flex-1 overflow-hidden flex gap-6">
            
            {/* Setting configuration fields */}
            <div className="w-1/2 bg-stone-900 border border-stone-850 p-5 rounded-3xl space-y-4 overflow-y-auto max-h-full scrollbar-thin">
              <h3 className="font-black text-xs text-[#E5C158] uppercase tracking-widest pb-1 border-b border-stone-800">
                Official Business Specifications
              </h3>

              <div className="space-y-4 text-xs">
                
                {/* VAT Configure */}
                <div className="bg-stone-950 p-4 border border-stone-800 rounded-2xl space-y-2">
                  <h4 className="font-black text-[#E5C158] uppercase tracking-widest text-[9px]">
                    VAT Settings (Government Tax Configure)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min={0} max={30} step={1}
                      value={settings.vatPercentage}
                      onChange={(e) => updateVat(parseInt(e.target.value) || 0)}
                      className="w-20 p-2 border border-stone-800 bg-stone-900 font-mono text-center text-sm font-black rounded-lg focus:border-[#E5C158] text-white outline-none"
                    />
                    <span className="text-stone-400 font-bold text-xs select-none">% of Total Orders</span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-normal">
                    This modifier dynamically recalculates subtotal tax multipliers across waitery invoices. Somali Standard is 5%.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-400 uppercase tracking-wider block">Cafe Name</label>
                    <input 
                      type="text"
                      value={settings.restaurantName}
                      onChange={(e) => updateSettings({ restaurantName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white outline-none focus:border-[#E5C158]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-400 uppercase tracking-wider block">Hotline Number</label>
                    <input 
                      type="text"
                      value={settings.phone}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white font-mono outline-none focus:border-[#E5C158]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-400 uppercase tracking-wider block">Official Email Address</label>
                    <input 
                      type="email"
                      value={settings.email || ""}
                      onChange={(e) => updateSettings({ email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white font-mono outline-none focus:border-[#E5C158]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-400 uppercase tracking-wider block">Default Service Charge (%)</label>
                    <input 
                      type="number" min="0" max="25" step="1"
                      value={settings.serviceChargePercentage || ""}
                      onChange={(e) => updateSettings({ serviceChargePercentage: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white font-mono outline-none focus:border-[#E5C158]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider block">Cafe Location Address</label>
                  <input 
                    type="text"
                    value={settings.address}
                    onChange={(e) => updateSettings({ address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white outline-none focus:border-[#E5C158]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider block">Receipt Welcome Slogan (Header)</label>
                  <input 
                    type="text"
                    value={settings.welcomeMessage || ""}
                    onChange={(e) => updateSettings({ welcomeMessage: e.target.value })}
                    placeholder="Thank You For Visiting Luna Cafe"
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white outline-none focus:border-[#E5C158]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider block">Receipt Appreciation Message (Footer)</label>
                  <textarea 
                    rows={2}
                    value={settings.appreciationMessage || ""}
                    onChange={(e) => updateSettings({ appreciationMessage: e.target.value })}
                    placeholder="We Look Forward To Serving You Again, Welcome Back"
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 outline-none text-white focus:border-[#E5C158]"
                  />
                </div>

                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-stone-300">Thermic Printer Margin</h5>
                    <p className="text-[10px] text-stone-500">Controls layouts for roll sizes.</p>
                  </div>
                  <select 
                    value={settings.printerPaperWidth}
                    onChange={(e) => updateSettings({ printerPaperWidth: e.target.value as any })}
                    className="bg-stone-900 border border-stone-800 p-2 text-xs font-bold rounded-lg outline-none cursor-pointer text-white"
                  >
                    <option value="80mm">Standard Thermal (80mm)</option>
                    <option value="58mm">Mobile Pocket (58mm)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Backups controls and imports */}
            <div className="flex-1 bg-stone-900 border border-stone-850 p-5 rounded-3xl space-y-4 flex flex-col h-full justify-between">
              <div>
                <dt className="text-[10px] text-[#E5C158] font-bold font-mono uppercase tracking-widest">Management Panel</dt>
                <h3 className="font-black text-sm text-white mt-1">
                  JSON Backups & Auditing
                </h3>
                <p className="text-[11px] text-stone-400 leading-normal mt-1">
                  Download full system logs or import structured data tables instantaneously.
                </p>
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-end">
                
                <div className="space-y-2">
                  <button 
                    onClick={handleDownloadBackup}
                    className="w-full py-3 bg-stone-950 border border-stone-800 hover:border-[#E5C158] text-white hover:text-[#E5C158] font-black rounded-xl transition flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download System Backup (.JSON)
                  </button>
                </div>

                <form onSubmit={handleRestoreSubmit} className="space-y-2.5 pt-4 border-t border-dashed border-stone-800">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Paste JSON Backup block to Override
                  </label>
                  <textarea 
                    value={restoreJson}
                    onChange={(e) => setRestoreJson(e.target.value)}
                    required
                    placeholder='{"users": [...], "categories": [...], "products": [...], ...}'
                    rows={3}
                    className="w-full text-[10px] font-mono p-2.5 border border-stone-800 bg-stone-950 text-stone-300 rounded-xl outline-none focus:border-[#E5C158]"
                  />

                  {restoreSuccess === true && (
                    <p className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 animate-pulse">
                      <Check className="w-3.5 h-3.5" /> Successful Restoration! All transaction registers overwritten.
                    </p>
                  )}

                  {restoreSuccess === false && (
                    <p className="text-[10px] text-rose-450 font-extrabold flex items-center gap-1 animate-bounce">
                      <AlertTriangle className="w-3.5 h-3.5" /> Restorations failed. Verify JSON syntax formatting.
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3 bg-stone-950 hover:bg-stone-800 border border-stone-850 text-stone-300 font-semibold rounded-xl transition cursor-pointer"
                  >
                    Deploy restoration JSON
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* DISH EDITING INTERACTIVE MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProductEdit} className="bg-stone-900 border border-stone-800 text-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-xs">
            <button 
              type="button"
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Utensils className="w-4 h-4 text-[#E5C158]" />
              <h3 className="font-black text-sm uppercase tracking-wider text-white">Edit Dish properties</h3>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Dish name</label>
              <input 
                type="text" required
                value={editProdName} onChange={(e) => setEditProdName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white outline-none focus:border-[#E5C158]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Dish Description</label>
              <input 
                type="text"
                value={editProdDescription} onChange={(e) => setEditProdDescription(e.target.value)}
                placeholder="Product description E.g. Delicious cheese pizza"
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white outline-none focus:border-[#E5C158]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-stone-400 uppercase tracking-wider block">Category</label>
                <select 
                  value={editProdCategory} onChange={(e) => setEditProdCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 font-bold outline-none cursor-pointer text-stone-200"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-400 uppercase tracking-wider block">Price ($)</label>
                <input 
                  type="number" step="0.01" required min="0.1" max="1000000"
                  value={editProdPrice} onChange={(e) => setEditProdPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 font-bold font-mono outline-none text-white focus:border-[#E5C158]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Production Station</label>
              <select 
                value={editProdStationId} onChange={(e) => setEditProdStationId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 font-bold outline-none cursor-pointer text-stone-200"
              >
                {productionStations.map(station => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
            </div>

            {/* Editing Preset pictures selection */}
            <div className="space-y-2">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Choose Visual Preset Photo</label>
              <div className="grid grid-cols-4 gap-1 bg-stone-950 border border-stone-800 p-2 rounded-xl">
                {PRESET_PICTURES.map((pic) => (
                  <button
                    key={pic.title}
                    type="button"
                    onClick={() => setEditProdImage(pic.url)}
                    className={`w-9 h-9 rounded-lg overflow-hidden border transition transform active:scale-90 ${
                      editProdImage === pic.url ? "border-[#E5C158] scale-105" : "border-transparent opacity-60"
                    }`}
                  >
                    <img src={pic.url} alt={pic.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <input 
                type="text" placeholder="Custom photo URL"
                value={editProdImage} onChange={(e) => setEditProdImage(e.target.value)}
                className="w-full p-2 bg-stone-950 border border-stone-800 rounded-lg text-[9px] font-mono outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <input 
                type="checkbox" id="editProdIsDrink"
                checked={editProdIsDrink} onChange={(e) => setEditProdIsDrink(e.target.checked)}
                className="w-4 h-4 text-[#D4AF37] border-stone-705 bg-stone-95  rounded"
              />
              <label htmlFor="editProdIsDrink" className="font-bold text-stone-300 text-[11px] select-none">
                Beverage / Cold Soda (Sends to Barista station)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setEditingProduct(null)}
                className="py-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl font-bold border border-stone-800 cursor-pointer text-stone-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2.5 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-955 font-black rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PAST BILL AUDITING & EDITS MODAL */}
      {auditingOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveBillAudits} className="bg-stone-900 border border-stone-800 text-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-xs flex flex-col max-h-[90vh]">
            <button 
              type="button"
              onClick={() => setAuditingOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white bg-stone-950 border border-stone-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-800 pb-3 shrink-0">
              <Printer className="w-4 h-4 text-[#E5C158]" />
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">Audit/Edit Past Receipt</h3>
                <p className="text-[10px] text-stone-400">Order: {auditingOrder.orderNumber} • Table: {auditingOrder.tableName}</p>
              </div>
            </div>

            {/* List of items current in bill */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[140px]">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">Adjust Selection Items</span>
              {auditedItems.length === 0 ? (
                <p className="text-center py-6 text-stone-500 font-bold uppercase">No items on this bill. Add some below.</p>
              ) : (
                <div className="space-y-2">
                  {auditedItems.map(item => (
                    <div key={item.productId} className="bg-stone-950 p-3 rounded-xl border border-stone-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-white text-xs truncate">{item.name}</p>
                        <p className="text-[9px] text-[#E5C158] font-bold uppercase tracking-wider">
                          Station: {productionStations.find(s => s.id === item.stationId)?.name || "Kitchen"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-start">
                        {/* Unit Price Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-stone-500 font-bold uppercase">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleUpdateAuditPrice(item.productId, parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 text-center bg-stone-900 border border-stone-800 rounded text-stone-200 outline-none text-[11px] font-mono font-bold"
                            title="Edit Unit Settle Price"
                          />
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateAuditQty(item.productId, -1)}
                            className="w-6 h-6 rounded-md bg-stone-855 hover:bg-stone-800 text-stone-300 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold font-mono text-white text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateAuditQty(item.productId, 1)}
                            className="w-6 h-6 rounded-md bg-stone-855 hover:bg-stone-800 text-stone-300 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add item search dropdown selection */}
              <div className="pt-3 border-t border-stone-850/60 space-y-1.5 shrink-0">
                <label className="text-[10px] text-stone-400 font-bold uppercase block">Add Dish/Beverage to Receipt</label>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      handleAddProductToAudit(val);
                      e.target.value = ""; // reset dropdown
                    }
                  }}
                  className="w-full p-2.5 bg-stone-950 border border-stone-855 rounded-xl text-stone-300 font-bold outline-none cursor-pointer text-xs"
                >
                  <option value="" disabled>-- Choose a product from the catalog to inject --</option>
                  {products.filter(p => !p.isArchived).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calculations summaries & adjustments inputs */}
            <div className="border-t border-stone-800 pt-3 space-y-3 shrink-0 bg-stone-900 p-1">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 font-bold uppercase block">Custom Discount ($)</label>
                  <input 
                    type="number" step="0.01" min="0" max="10000"
                    value={auditDiscount} onChange={(e) => setAuditDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-850 text-white outline-none font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-stone-400 font-bold uppercase block">Service Charge ($)</label>
                  <input 
                    type="number" step="0.01" min="0" max="10000"
                    value={auditService} onChange={(e) => setAuditService(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-stone-950 border border-stone-850 text-white outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Justification input */}
              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 font-bold uppercase block">Audit Note / Reason for modifying bill</label>
                <input 
                  type="text" required placeholder="E.g. Refunded beverage, pricing adjustment"
                  value={auditReason} onChange={(e) => setAuditReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-850 text-white outline-none font-medium focus:border-[#E5C158]"
                />
              </div>
            </div>

            {/* Submit and Controls */}
            <div className="grid grid-cols-2 gap-2 pt-2 shrink-0 border-t border-stone-805">
              <button 
                type="button"
                onClick={() => setAuditingOrder(null)}
                className="py-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl font-bold border border-stone-800 cursor-pointer text-stone-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2.5 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-955 font-black uppercase tracking-wider font-mono rounded-xl cursor-pointer"
              >
                Log Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADMIN PRINTER DIALOG / PREVIEWER */}
      {printingOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md h-[90vh] rounded-3xl p-6 relative overflow-hidden flex flex-col shadow-2xl">
            <button
              type="button"
              onClick={() => setPrintingOrder(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white transition cursor-pointer z-10 p-1.5 bg-stone-950/80 rounded-full border border-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex-1 overflow-hidden mt-4">
              <ReceiptView
                order={printingOrder}
                settings={settings}
                type="customer"
                onClose={() => setPrintingOrder(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* STAFF / EMPLOYEE EDITING MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveEmployeeEdit} className="bg-stone-900 border border-stone-800 text-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-xs">
            <button 
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Users className="w-4 h-4 text-[#E5C158]" />
              <h3 className="font-black text-sm uppercase tracking-wider text-white">Edit Employee credentials</h3>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">First & Last Name</label>
              <input 
                type="text" required
                value={editUserName} onChange={(e) => setEditUserName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white outline-none focus:border-[#E5C158]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Employee Shift Role</label>
              <select 
                value={editUserRole} onChange={(e) => setEditUserRole(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 font-bold outline-none cursor-pointer text-stone-200"
              >
                <option value={UserRole.WAITER}>{UserRole.WAITER}</option>
                <option value={UserRole.CASHIER}>{UserRole.CASHIER}</option>
                <option value={UserRole.MANAGER}>{UserRole.MANAGER}</option>
                <option value={UserRole.KITCHEN}>{UserRole.KITCHEN}</option>
                <option value={UserRole.BARISTA}>{UserRole.BARISTA}</option>
                <option value={UserRole.DEVELOPER}>{UserRole.DEVELOPER} / ADMIN</option>
              </select>
            </div>

            {(editUserRole === UserRole.DEVELOPER || editUserRole === UserRole.MANAGER) ? (
              <>
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider block">Admin Login Email</label>
                  <input 
                    type="email" required
                    value={editUserMail} onChange={(e) => setEditUserMail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-400 uppercase tracking-wider block">Security Password</label>
                  <input 
                    type="password" required placeholder="Enter password"
                    value={editUserPass} onChange={(e) => setEditUserPass(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white font-mono"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="font-bold text-stone-400 uppercase tracking-wider block">Secure 4-Digit PIN Code</label>
                <input 
                  type="text" maxLength={4} required
                  value={editUserPin} onChange={(e) => setEditUserPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-amber-400 text-center font-mono tracking-widest text-sm font-black"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                className="py-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl font-bold border border-stone-800 cursor-pointer text-stone-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2.5 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-955 font-black rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {adminTab === "stations" && (
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-12 animate-fade-in">
          <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-[#E5C158] uppercase tracking-widest font-black block">Prep Workspace Routing</span>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Production Stations Setup</h2>
              <p className="text-xs text-stone-400">Establish and coordinate kitchen prep locations. Customize receipts and route items seamlessly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl space-y-4 shadow-xl">
                <span className="text-[10px] text-[#E5C158] uppercase tracking-widest font-black block">Active Routing Locations</span>
                
                <div className="divide-y divide-stone-850">
                  {productionStations.map(station => {
                    const itemsInStation = products.filter(p => p.stationId === station.id && !p.isArchived);
                    const isDeletingRestricted = station.id === "station-kitchen";

                    return (
                      <div key={station.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {editingStationId === station.id ? (
                            <div className="flex items-center gap-2 max-w-sm">
                              <input
                                type="text"
                                value={editingStationName}
                                onChange={(e) => setEditingStationName(e.target.value)}
                                className="flex-1 p-2 bg-stone-950 border border-stone-800 rounded-xl text-white outline-none focus:border-[#E5C158] text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingStationName.trim()) {
                                    updateProductionStation(station.id, editingStationName.trim());
                                    setEditingStationId(null);
                                  }
                                }}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-stone-950 rounded-xl transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStationId(null)}
                                className="p-2 bg-stone-800 hover:bg-stone-750 text-stone-400 rounded-xl transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-black text-white hover:text-amber-400 transition cursor-default">
                                {station.name}
                              </h4>
                              <p className="text-[10px] text-stone-500 font-extrabold font-mono uppercase">
                                {itemsInStation.length} Menu Selection{itemsInStation.length !== 1 ? "s" : ""} Assigned
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {editingStationId !== station.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStationId(station.id);
                                setEditingStationName(station.name);
                              }}
                              className="p-2 text-stone-300 bg-stone-850 hover:bg-stone-800 rounded-xl transition cursor-pointer"
                              title="Edit Station"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isDeletingRestricted && (
                            <button
                              type="button"
                              onClick={() => deleteProductionStation(station.id)}
                              className="p-2 text-red-400 bg-red-950/20 hover:bg-red-950/80 rounded-xl transition cursor-pointer"
                              title="Delete Station"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl space-y-4 shadow-xl">
                <span className="text-[10px] text-[#E5C158] uppercase tracking-widest font-black block">Form Station Creator</span>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newStationName.trim()) {
                      addProductionStation(newStationName.trim());
                      setNewStationName("");
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Station Name</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Coffee Corner"
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      className="w-full p-2.5 bg-stone-950 border border-stone-850 rounded-xl text-white outline-none focus:border-[#E5C158] text-xs font-medium"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    + Build Station
                  </button>
                </form>
              </div>

              <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl space-y-3 text-stone-400 text-xs shadow-xl leading-relaxed">
                <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black block">Operational Insight</span>
                <p>
                  Every menu selection must be mapped to exactly one active workspace/production station.
                </p>
                <p>
                  When orders are submitted, they will be automatically separated to prevent beverages, appetizers, and desserts from routing on the same ticket.
                </p>
                <div className="flex gap-2 items-center text-[10px] text-stone-500 uppercase mt-2 pt-2 border-t border-stone-850 font-bold">
                  <Activity className="w-3.5 h-3.5 text-[#E5C158]" />
                  Real-time ticket routing active
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminTab === "manual" && (
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-12">
          
          {/* Top Info Bar - Hidden in Print */}
          <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 no-print">
            <div className="space-y-1">
              <span className="text-[10px] text-[#E5C158] uppercase tracking-widest font-black block">SYSTEM REFERENCE ENGINE</span>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Luna Café System Guide & PDF Exporter</h2>
              <p className="text-xs text-stone-400">Use this terminal to view dynamic operational instructions, persistent state rules, and print/save a PDF file.</p>
            </div>
            <button
              onClick={() => {
                window.print();
              }}
              className="px-5 py-3 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-stone-950" />
              Save Document as PDF
            </button>
          </div>

          {/* DOCUMENT CONTAINER - Designed to print perfectly to PDF/A4 */}
          <div className="bg-white text-stone-900 border border-stone-200 rounded-3xl p-8 md:p-12 shadow-md space-y-8 font-sans max-w-4xl mx-auto" id="print-manual-target">
            
            {/* Document Header block */}
            <div className="border-b-4 border-stone-950 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[11px] font-mono tracking-widest font-extrabold text-[#B28926] uppercase">
                  Official Operations & Provisioning Manual
                </span>
                <h1 className="text-3xl font-black tracking-tight text-stone-955 uppercase">
                  LUNA CAFÉ POS ENGINE
                </h1>
                <p className="text-xs text-stone-500 font-mono">
                  Release v2.4.0 • Enterprise Restaurant Management System
                </p>
              </div>
              <div className="flex flex-col sm:items-end text-left sm:text-right text-stone-500 text-xs font-mono">
                <div>Document ID: <b>LUNA-OPS-2026</b></div>
                <div>Author: <b>System Operations Team</b></div>
                <div>Date: <b>June 11, 2026</b></div>
              </div>
            </div>

            {/* Part 1: How the App Operates */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-300 pb-1.5">
                <span className="text-xs font-mono font-black text-white bg-stone-950 px-2 py-0.5 rounded-sm">01</span>
                <h3 className="text-base font-extrabold text-stone-950 uppercase tracking-tight">OPERATIONAL LOGIC & STATEMENTS</h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                Luna Café POS runs a robust transactional pipeline optimized for busy quick-service countertops and floor table dining ordering. The core operating interface features automatic user transitions conforming precisely to staff rosters:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-1.5">
                  <h4 className="font-extrabold text-xs text-stone-950 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#E5C158] rounded-full"></span>
                    Waiter Shift Operations & Barriers
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Waiters have complete localized clearance to create customer orders, edit serving notes, configure and reorder items, send orders to production, and trigger physical slips. However, **Waiters are strictly forbidden** from updating status to Paid or carrying out checkout. Their pathway terminates at "Served".
                  </p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-1.5">
                  <h4 className="font-extrabold text-xs text-stone-950 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#E5C158] rounded-full"></span>
                    Cashier / Manager Authority
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-normal">
                    Only authentic Cashier or Admin accounts possess the authorization block to finalize payment statuses, accept customer tender, and settle tables. Upon checkout completion, tables automatically transition from "dirty" back to "available" to ensure continuous seating throughput.
                  </p>
                </div>
              </div>

              {/* State Machine Transition Steps */}
              <div className="bg-stone-950 text-stone-200 rounded-2xl p-4 mt-2">
                <span className="text-[9px] uppercase font-mono tracking-widest text-[#E5C158] font-black block mb-2">Order State Machine Sequence</span>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center font-mono text-[10px]">
                  <div className="flex-1 p-2 bg-stone-900 border border-stone-850 rounded-xl w-full">
                    <div className="text-amber-400 font-extrabold">STATUS: PENDING_QR</div>
                    <div className="text-[9px] text-stone-500 mt-0.5">Submitted via Table QR Self-Order</div>
                  </div>
                  <div className="text-xs font-bold text-stone-600">➔</div>
                  <div className="flex-1 p-2 bg-stone-900 border border-stone-850 rounded-xl w-full">
                    <div className="text-blue-400 font-extrabold">STATUS: NEW</div>
                    <div className="text-[9px] text-stone-500 mt-0.5">Sent to Kitchen / Barista queue</div>
                  </div>
                  <div className="text-xs font-bold text-stone-600">➔</div>
                  <div className="flex-1 p-2 bg-stone-900 border border-stone-850 rounded-xl w-full">
                    <div className="text-emerald-400 font-extrabold">STATUS: SERVED</div>
                    <div className="text-[9px] text-stone-500 mt-0.5">Dispatched to guest tables</div>
                  </div>
                  <div className="text-xs font-bold text-stone-600">➔</div>
                  <div className="flex-1 p-2 bg-[#E5C158] text-stone-950 rounded-xl w-full">
                    <div className="font-extrabold text-[#111]">STATUS: PAID</div>
                    <div className="text-[9px] text-stone-850 mt-0.5">Settle bill via Cashier POS</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Part 2: Persistence Setup */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-300 pb-1.5">
                <span className="text-xs font-mono font-black text-white bg-stone-950 px-2 py-0.5 rounded-sm">02</span>
                <h3 className="text-base font-extrabold text-stone-950 uppercase tracking-tight">PERSISTENT ADAPTER PROVISIONING</h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                To guarantee zero-data-loss continuous operation, the system synchronizes all transaction tables, order logs, product inventories, and employee auth permissions across persistent backends:
              </p>

              <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-extrabold border-b border-stone-200">
                    <th className="p-3 w-1/3">Storage Adapter</th>
                    <th className="p-3">Deployment Specification</th>
                    <th className="p-3">Primary Responsibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  <tr>
                    <td className="p-3 font-bold text-stone-900">Firebase Firestore</td>
                    <td className="p-3 font-mono text-[11px] text-stone-600">Project: isometric-infusion-bpnh2</td>
                    <td className="p-3 text-stone-600">Durable, multi-device real-time sync of cash states, active tickets, and staff parameters.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-stone-900">Cloud SQL (PostgreSQL)</td>
                    <td className="p-3 font-mono text-[11px] text-stone-600">Region: europe-west2 (GCP Platform)</td>
                    <td className="p-3 text-stone-600">Relational schemas, sales audit journaling, and transactional record integrity checks.</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Part 3: Google Workspace API Integrations */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-300 pb-1.5">
                <span className="text-xs font-mono font-black text-white bg-stone-950 px-2 py-0.5 rounded-sm">03</span>
                <h3 className="text-base font-extrabold text-stone-950 uppercase tracking-tight">GOOGLE WORKSPACE & API SCOPES</h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                The terminal utilizes real Google Workspace APIs to automate external communications and store financial journals. Ensure the following OAuth permissions are configured and authorized within your developer brand panel:
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row gap-2 justify-between">
                  <div>
                    <span className="bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">GMAIL SERVICE</span>
                    <p className="text-xs font-sans font-bold text-stone-900 mt-1">Automatic Customer Invoice Dispatches</p>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">Sends physical, clean invoice templates directly to customer emails upon table checkouts.</p>
                  </div>
                  <div className="text-stone-500 text-right font-bold text-[10px] uppercase font-mono">
                    Scope: ...auth/gmail
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row gap-2 justify-between">
                  <div>
                    <span className="bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">GOOGLE CHAT</span>
                    <p className="text-xs font-sans font-bold text-stone-900 mt-1">Kitchen & Barista Production Room Webhooks</p>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">Instantly publishes chat alerts for kitchen duplicate lists when VIP or custom order modifiers are requested.</p>
                  </div>
                  <div className="text-stone-500 text-right font-bold text-[10px] uppercase font-mono">
                    Scope: ...auth/chat
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row gap-2 justify-between">
                  <div>
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">GOOGLE CALENDAR</span>
                    <p className="text-xs font-sans font-bold text-stone-900 mt-1">Employee Scheduling & Table Reservation Sync</p>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">Coordinates table reservation events and maps employee shift rosters instantly into Google calendar records.</p>
                  </div>
                  <div className="text-stone-500 text-right font-bold text-[10px] uppercase font-mono">
                    Scope: ...auth/calendar
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row gap-2 justify-between">
                  <div>
                    <span className="bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">GOOGLE SHEETS DUPLICATE</span>
                    <p className="text-xs font-sans font-bold text-stone-900 mt-1">Temporal Reporting & Financial Spreadsheet Sync</p>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">Feeds total transactions, tax values, menu item updates, and audit lines straight to custom accounting sheets.</p>
                  </div>
                  <div className="text-stone-500 text-right font-bold text-[10px] uppercase font-mono">
                    Scope: ...auth/sheets
                  </div>
                </div>
              </div>
            </section>

            {/* Part 4: Menu Administration Controls */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-300 pb-1.5">
                <span className="text-xs font-mono font-black text-white bg-stone-950 px-2 py-0.5 rounded-sm">04</span>
                <h3 className="text-base font-extrabold text-stone-950 uppercase tracking-tight">MENU CATALOG MANAGEMENT PROCESS</h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                The catalog configurator empowers systemic administrative roles with complete control over inventory. Under the **"Beverages & Dishes"** center, the developer or shop manager can execute the following commands securely:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                <div className="border border-stone-200 rounded-xl p-3.5 space-y-1">
                  <h5 className="font-extrabold text-stone-900 uppercase">1. Full Purge Controls</h5>
                  <p className="text-[11px] text-stone-500">Completely deletes all current menu classifications and dishes. No categories are locked down by default.</p>
                </div>
                <div className="border border-stone-200 rounded-xl p-3.5 space-y-1">
                  <h5 className="font-extrabold text-stone-900 uppercase">2. Bulk Catalog Imports</h5>
                  <p className="text-[11px] text-stone-500">Inject custom inventory datasets into the storage engine with a single-click template trigger.</p>
                </div>
                <div className="border border-stone-200 rounded-xl p-3.5 space-y-1">
                  <h5 className="font-extrabold text-stone-900 uppercase">3. Build From Scratch</h5>
                  <p className="text-[11px] text-stone-500">Wipe previous states and build fresh custom catalog items with unique names, prices, categories, and cover photography.</p>
                </div>
              </div>
            </section>

            {/* Part 5: Thermal Receipt System Design */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-300 pb-1.5">
                <span className="text-xs font-mono font-black text-white bg-stone-950 px-2 py-0.5 rounded-sm">05</span>
                <h3 className="text-base font-extrabold text-stone-950 uppercase tracking-tight">THERMAL PRINTER DOCUMENT GUIDES</h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                To guarantee optimal readability on physical paper systems or 80mm ESC/POS thermal counter machines, receipts comply with modern typographic rules:
              </p>

              <ul className="list-disc list-inside text-xs text-stone-600 space-y-1.5 pl-2 font-sans">
                <li><b>Pure High-Contrast Type Headers:</b> Replaced all placeholder assets with a clear, heavy-weight letterpress <span className="font-extrabold text-stone-900 bg-stone-100 px-1 py-0.5 rounded">LUNA CAFÉ</span> title.</li>
                <li><b>Roster Meta-Logging:</b> Logs servers, cashiers, specific timestamps, tax grids (VAT 5%), and unique numerical transaction numbers (`ORD-XXXX`).</li>
                <li><b>Aesthetic Thermal Padding:</b> Explicitly configured margins to prevent text clipping from thermal blade cutters during rapid physical paper prints.</li>
              </ul>
            </section>

            {/* Part 6: Universal Search Lookup Hub */}
            <section className="space-y-4">
              <div className="flex items-center gap-1.5 border-b border-stone-300 pb-1.5">
                <span className="text-xs font-mono font-black text-white bg-stone-950 px-2 py-0.5 rounded-sm">06</span>
                <h3 className="text-base font-extrabold text-stone-950 uppercase tracking-tight">UNIVERSAL INSTANT LOOKUP SYSTEM</h3>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                The global navigation header includes a fast reactive database query bar that resolves strings instantly. The engine matches entries on search query parameters across the active workspace and lists action options:
              </p>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 font-mono text-xs">
                <span className="text-[10px] text-stone-400 font-bold block mb-1">SUPPORTED SEARCH PATTERNS & ACTIONS</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-stone-800 font-bold">🎯 Search Terms:</p>
                    <ul className="list-disc list-inside text-[11px] text-stone-500 space-y-0.5 leading-normal font-sans">
                      <li>Table Identifiers (e.g. Table 12, LUNA-T50)</li>
                      <li>Order Identifiers (e.g. ORD-1001)</li>
                      <li>Employee Names (e.g. Waiter Ahmed, Mohamed)</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-stone-800 font-bold">⚡ Inline Executions:</p>
                    <ul className="list-disc list-inside text-[11px] text-stone-500 space-y-0.5 leading-normal font-sans">
                      <li>Open and resume table’s active POS workspace</li>
                      <li>Print immediate Kitchen and Barista duplicates</li>
                      <li>Initiate cashier checkouts & financial settlements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Document Signature Signoff */}
            <div className="border-t border-stone-300 pt-6 flex justify-between items-center text-[10px] text-stone-500 font-mono">
              <div>System: <b>Luna Cafe Cloud Core v2.4.0</b></div>
              <div>Security Certification: <b>Verified & Provisioned (GCP)</b></div>
            </div>

          </div>
        </div>
      )}

      {/* CATEGORY EDITING INTERACTIVE MODAL */}
      {editingCategoryItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateCategory(editingCategoryItem.id, editCatName, editCatIcon, editCatImage);
              setEditingCategoryItem(null);
            }} 
            className="bg-stone-900 border border-stone-800 text-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            <button 
              type="button"
              onClick={() => setEditingCategoryItem(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Utensils className="w-4 h-4 text-[#E5C158]" />
              <h3 className="font-black text-sm uppercase tracking-wider text-white">Edit Menu Category</h3>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Category name</label>
              <input 
                type="text" required
                value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 text-white outline-none focus:border-[#E5C158]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Category Icon</label>
              <select
                value={editCatIcon} onChange={(e) => setEditCatIcon(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 font-bold outline-none cursor-pointer text-stone-200"
              >
                <option value="Coffee">☕ Coffee / Drink</option>
                <option value="Utensils">🍽️ Main Course</option>
                <option value="Flame">🔥 Grilled / Sizzling</option>
                <option value="Cake">🍰 Sweet Dessert</option>
                <option value="Pizza">🍕 Pizza</option>
                <option value="Soup">🍲 Soup/Appetizer</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-400 uppercase tracking-wider block">Category Cover Image URL</label>
              <input 
                type="text" placeholder="https://images.unsplash.com/promo.jpg"
                value={editCatImage} onChange={(e) => setEditCatImage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-800 bg-stone-950 outline-none text-white focus:border-[#E5C158]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setEditingCategoryItem(null)}
                className="py-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl font-bold border border-stone-800 cursor-pointer text-stone-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="py-2.5 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 font-black rounded-xl cursor-pointer"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};// WAITER / CASHIER PERMISSION CONTROL

const ROLE_PERMISSIONS = {
  waiter: {
    canCreateOrder: true,
    canEditOwnOrder: true,
    canAddItems: true,
    canRemoveItems: true,
    canSearchOrders: true,
    canViewOrderStatus: true,
    canPrintKitchen: true,
    canPrintBill: true,
    canViewServedOrders: true,
    canViewPaidHistory: true,

    canMarkPaid: false,
    canSettleBill: false,
    canCheckoutBill: false,
    canProcessPayment: false,
    canRefund: false,
    canCancelPaidOrder: false,
    canViewSalesReports: false,
    canAccessAdmin: false,
    canAccessCustomerQR: false,
    canAccessSettings: false,
  },

  cashier: {
    canCreateOrder: true,
    canEditOwnOrder: true,
    canAddItems: true,
    canRemoveItems: true,
    canSearchOrders: true,
    canViewOrderStatus: true,
    canPrintKitchen: true,
    canPrintBill: true,
    canViewServedOrders: true,
    canViewPaidHistory: true,

    canMarkPaid: true,
    canSettleBill: true,
    canCheckoutBill: true,
    canProcessPayment: true,
    canRefund: true,
    canCancelPaidOrder: true,
    canViewSalesReports: true,
    canAccessAdmin: false,
    canAccessCustomerQR: false,
    canAccessSettings: false,
  },

  admin: {
    canCreateOrder: true,
    canEditOwnOrder: true,
    canAddItems: true,
    canRemoveItems: true,
    canSearchOrders: true,
    canViewOrderStatus: true,
    canPrintKitchen: true,
    canPrintBill: true,
    canViewServedOrders: true,
    canViewPaidHistory: true,

    canMarkPaid: true,
    canSettleBill: true,
    canCheckoutBill: true,
    canProcessPayment: true,
    canRefund: true,
    canCancelPaidOrder: true,
    canViewSalesReports: true,
    canAccessAdmin: true,
    canAccessCustomerQR: true,
    canAccessSettings: true,
  },
};

function getPermissions(user) {
  return ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.waiter;
}

function can(user, permission) {
  const permissions = getPermissions(user);
  return permissions[permission] === true;
}

// HIDE DASHBOARD MENU ITEMS BY ROLE
function getVisibleMenuItems(user) {
  const role = user?.role;

  const waiterMenu = [
    "Dashboard",
    "Tables",
    "New Order",
    "Orders",
    "Kitchen Status",
    "Served Orders",
    "Order Search",
    "Paid History",
  ];

  const cashierMenu = [
    ...waiterMenu,
    "Payments",
    "Bills",
  ];

  const adminMenu = [
    ...cashierMenu,
    "Admin Management",
    "Users Management",
    "Customer Self-Order QR",
    "Settings",
    "VAT Settings",
    "Receipt Header Settings",
    "Employee Management",
    "Expense Categories",
    "Expenses",
    "Sales Reports",
    "Financial Reports",
    "System Configuration",
  ];

  if (role === "admin" || role === "developer") return adminMenu;
  if (role === "cashier") return cashierMenu;
  return waiterMenu;
}

// PROTECT MARK PAID FUNCTION
function markOrderAsPaid(user, order) {
  if (!can(user, "canMarkPaid")) {
    alert("Access denied: Waiters cannot mark orders as paid.");
    return;
  }

  order.status = "paid";
  order.paidAt = new Date().toISOString();
  order.paidBy = user.name;

  // saveOrder(order);
}

// BUTTON DISPLAY EXAMPLE
function shouldShowSettleButton(user) {
  return can(user, "canSettleBill");
}

function shouldShowCheckoutButton(user) {
  return can(user, "canCheckoutBill");
}

function shouldShowMarkPaidButton(user) {
  return can(user, "canMarkPaid");
}function printOnlyNew(order, station) {
  const items = order.items.filter(i => i.station === station && !i.printed);

  if (!items.length) return alert("No new " + station + " items");

  const text = `
LUNA CAFÈ
${station.toUpperCase()} ORDER
Table: ${order.tableNumber}
Order: ${order.orderNumber}
----------------
${items.map(i => `${i.name} x${i.qty}`).join("\n")}
----------------
${new Date().toLocaleString()}
`;

  const w = window.open("", "", "width=300,height=500");
  w.document.write(`<pre style="font-family:monospace;font-size:13px">${text}</pre>`);
  w.print();
  w.close();

  order.items.forEach(i => {
    if (i.station === station && !i.printed) i.printed = true;
  });

  return order;
}async function editWaiterName(orderId: string, newWaiterName: string, updateOrderWaiter?: (id: string, name: string) => void) {
  if (!newWaiterName.trim()) return alert("Enter waiter name");

  if (updateOrderWaiter) {
    updateOrderWaiter(orderId, newWaiterName.trim());
  } else {
    // If called outside of components, do a direct alert
    console.log(`Updated waiter name for order ${orderId} to: ${newWaiterName}`);
  }

  alert("Waiter name updated");
}