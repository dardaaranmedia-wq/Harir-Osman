import React, { useState } from "react";
import { usePOS, getBusinessDate } from "../store/posStore";
import { Order, OrderItem, OrderStatus, Product, Table } from "../types";
import { 
  Coffee, Layers, Check, ShoppingCart, Search, Plus, Minus, Trash2, 
  MessageSquare, Printer, CheckCircle, Flame, Coffee as Cup, ShieldCheck, X, FileText, ChevronRight 
} from "lucide-react";
import { ReceiptView } from "./ReceiptPrinters";
import { LunaLogo } from "./LunaLogo";

export const StaffDashboard: React.FC = () => {
  const { 
    currentUser, categories, products, tables, orders, settings, users,
    createOrder, approveOrder, rejectOrder, updateOrderItems, serveOrder, payOrder, logout,
    theme, setTheme, updateOrderWaiter, updateOrderWithAuditTrail,
    selectedBusinessDate, setSelectedBusinessDate
  } = usePOS();

  // Screen modes: "order" (Create Order), "queue" (Order Queue manager), or "waiter_landing" (Waiter dashboard)
  const [activeScreen, setActiveScreen] = useState<"order" | "queue" | "waiter_landing" >(() => 
    currentUser?.role === "Waiter" ? "waiter_landing" : "order"
  );
  
  // Dashboard Order Queue Tab (Pending, NEW, SERVED, PAID)
  const [queueTab, setQueueTab] = useState<OrderStatus | "Pending">(() => 
    currentUser?.role === "Waiter" ? OrderStatus.NEW : "Pending"
  );

  // Selection states inside "Create Order" mode
  const [selectedTable, setSelectedTable] = useState<string>("LUNA-T01");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [orderCategory, setOrderCategory] = useState<string>("all");
  const [productSearch, setProductSearch] = useState<string>("");
  
  // Active temporary order waiter assignment for Cashiers
  const [assignedWaiterName, setAssignedWaiterName] = useState<string>("");

  // Active temporary order tray for creating a POS order
  const [trayItems, setTrayItems] = useState<OrderItem[]>([]);
  const [trayNotes, setTrayNotes] = useState<{ [id: string]: string }>({});
  const [generalTrayComment, setGeneralTrayComment] = useState("");

  // Section specific search states with modes: all, order, table, waiter, item
  const [newSearchQuery, setNewSearchQuery] = useState("");
  const [newSearchMode, setNewSearchMode] = useState<"order" | "table" | "waiter" | "item" | "all">("all");

  const [servedSearchQuery, setServedSearchQuery] = useState("");
  const [servedSearchMode, setServedSearchMode] = useState<"order" | "table" | "waiter" | "item" | "all">("all");

  const [paidSearchQuery, setPaidSearchQuery] = useState("");
  const [paidSearchMode, setPaidSearchMode] = useState<"order" | "table" | "waiter" | "item" | "all">("all");

  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [pendingSearchMode, setPendingSearchMode] = useState<"order" | "table" | "waiter" | "item" | "all">("all");

  // Receipt printing state variables
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [receiptType, setReceiptType] = useState<"kitchen" | "barista" | "customer">("customer");
  const [servingOrderWithOptions, setServingOrderWithOptions] = useState<Order | null>(null);
  const [printKitchenChecked, setPrintKitchenChecked] = useState(true);
  const [printBaristaChecked, setPrintBaristaChecked] = useState(true);

  // Filter tables to pick
  const filteredTablesToPick = tables.filter(t => 
    t.name.toLowerCase().includes(tableSearch.toLowerCase()) || 
    t.tableId.toLowerCase().includes(tableSearch.toLowerCase())
  );

  const traySubtotal = trayItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const trayVat = traySubtotal * (settings.vatPercentage / 100);
  const trayTotal = traySubtotal + trayVat;

  const handleAddTrayItem = (p: Product) => {
    if (!p.available) return;
    setTrayItems(prev => {
      const existing = prev.find(it => it.productId === p.id);
      if (existing) {
        return prev.map(it => it.productId === p.id ? { ...it, quantity: it.quantity + 1 } : it);
      } else {
        return [...prev, {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: 1,
          isDrink: p.isDrink,
          notes: trayNotes[p.id] || ""
        }];
      }
    });
  };

  const updateTrayQty = (prodId: string, delta: number) => {
    setTrayItems(prev => prev.map(item => {
      if (item.productId === prodId) {
        const next = item.quantity + delta;
        return next > 0 ? { ...item, quantity: next } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleTrayItemNote = (prodId: string, notesText: string) => {
    setTrayNotes(prev => ({ ...prev, [prodId]: notesText }));
    setTrayItems(prev => prev.map(it => it.productId === prodId ? { ...it, notes: notesText } : it));
  };

  const handleSubmitTray = () => {
    if (trayItems.length === 0) return;
    
    // Create new active order
    const waiter = currentUser?.role === "Cashier" 
      ? (assignedWaiterName || "Counter POS") 
      : (currentUser?.name || "Staff");

    createOrder(
      selectedTable,
      trayItems,
      generalTrayComment,
      waiter,
      false // Directly confirmed
    );

    // Reset Tray
    setTrayItems([]);
    setTrayNotes({});
    setGeneralTrayComment("");
    setAssignedWaiterName("");
    
    // Switch to queue
    setActiveScreen("queue");
    setQueueTab(OrderStatus.NEW);
  };

  const matchSearch = (
    order: Order, 
    query: string, 
    mode: "order" | "table" | "waiter" | "item" | "all"
  ): boolean => {
    if (!query) return true;
    const cleanQuery = query.toLowerCase().trim();

    if (mode === "order") {
      // User only types digits sequence after prefix 'LN-', check if order number matches cleanest
      return (order.orderNumber || "").toLowerCase().includes(cleanQuery);
    }
    if (mode === "table") {
      // User typed digit code after prefix 'Table-', e.g. '05' matches 'Table 05'
      return (order.tableName || "").toLowerCase().includes(`table ${cleanQuery}`) ||
             (order.tableId || "").toLowerCase().includes(cleanQuery);
    }
    if (mode === "waiter") {
      return (order.waiterName || "").toLowerCase().includes(cleanQuery);
    }
    if (mode === "item") {
      return order.items.some(it => (it.name || "").toLowerCase().includes(cleanQuery));
    }

    return (
      (order.orderNumber || "").toLowerCase().includes(cleanQuery) ||
      (order.tableName || "").toLowerCase().includes(cleanQuery) ||
      (order.waiterName || "").toLowerCase().includes(cleanQuery) ||
      order.items.some(it => (it.name || "").toLowerCase().includes(cleanQuery))
    );
  };

  // Filter orders by active queue tab selection & search matching logic
  const displayedOrders = orders.filter(o => {
    const matchesDate = !o.businessDate || o.businessDate === selectedBusinessDate;

    if (queueTab === "Pending") {
      return o.status === OrderStatus.PENDING_QR && matchesDate && matchSearch(o, pendingSearchQuery, pendingSearchMode);
    }
    if (queueTab === OrderStatus.NEW) {
      return o.status === OrderStatus.NEW && matchesDate && matchSearch(o, newSearchQuery, newSearchMode);
    }
    if (queueTab === OrderStatus.SERVED) {
      return o.status === OrderStatus.SERVED && matchesDate && matchSearch(o, servedSearchQuery, servedSearchMode);
    }
    // For paid status we filter strictly by orders where businessDate === selectedBusinessDate!
    return o.status === OrderStatus.PAID && 
           matchesDate &&
           matchSearch(o, paidSearchQuery, paidSearchMode);
  });

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState<{ [id: string]: string }>({});
  const [editProductSearch, setEditProductSearch] = useState("");
  const [editCategoryFilter, setEditCategoryFilter] = useState("all");

  // Settle Bill / Checkout Modal state variables
  const [paymentActiveOrder, setPaymentActiveOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [paymentRefNo, setPaymentRefNo] = useState<string>("Cash");
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [serviceChgVal, setServiceChgVal] = useState<number>(0);
  const [amountReceivedVal, setAmountReceivedVal] = useState<string>("");
  const [customerTypeVal, setCustomerTypeVal] = useState<"Dine-In" | "Takeaway" | "Delivery">("Dine-In");

  const handleOpenCheckout = (order: Order) => {
    setPaymentActiveOrder(order);
    setPaymentMethod("Cash");
    setPaymentRefNo("");
    setDiscountVal(0);
    const scPercent = settings.serviceChargePercentage || 0;
    setServiceChgVal(parseFloat((order.subtotal * (scPercent / 100)).toFixed(2)));
    setAmountReceivedVal("");
    setCustomerTypeVal(order.customerType || "Dine-In");
  };

  const checkoutGrandTotal = paymentActiveOrder 
    ? parseFloat((paymentActiveOrder.subtotal + paymentActiveOrder.vatAmount + serviceChgVal - discountVal).toFixed(2))
    : 0;

  const submitCheckoutPayment = () => {
    if (!paymentActiveOrder) return;
    const receivedAmount = paymentMethod === "Cash" 
      ? (parseFloat(amountReceivedVal) || checkoutGrandTotal)
      : checkoutGrandTotal;
    
    payOrder(
      paymentActiveOrder.id,
      paymentMethod,
      currentUser?.name || "Cashier",
      paymentMethod === "Cash" ? "" : paymentRefNo,
      receivedAmount,
      discountVal,
      serviceChgVal,
      customerTypeVal
    );

    // Prompt receipt printing view
    const simulatedPaidOrder = {
      ...paymentActiveOrder,
      status: OrderStatus.PAID,
      paymentStatus: "Paid",
      paymentMethod: paymentMethod,
      paymentReference: paymentMethod === "Cash" ? "" : paymentRefNo,
      discountAmount: discountVal,
      serviceCharge: serviceChgVal,
      amountReceived: receivedAmount,
      balanceReturned: parseFloat(Math.max(0, receivedAmount - checkoutGrandTotal).toFixed(2)),
      customerType: customerTypeVal,
      grandTotal: checkoutGrandTotal,
      receiptNumber: "LUNA-REC-" + (10000 + orders.length)
    };

    setPaymentActiveOrder(null);
    setPrintingOrder(simulatedPaidOrder);
    setReceiptType("customer");
  };

  const startEditingPending = (order: Order) => {
    setEditingOrder(order);
    const initialNotes: { [id: string]: string } = {};
    order.items.forEach(it => {
      initialNotes[it.productId] = it.notes || "";
    });
    setEditNotes(initialNotes);
    setEditProductSearch("");
    setEditCategoryFilter("all");
    setEditReason("");
  };

  const updateEditQty = (prodId: string, delta: number) => {
    if (!editingOrder) return;
    const updatedItems = editingOrder.items.map(it => {
      if (it.productId === prodId) {
        const next = it.quantity + delta;
        return next > 0 ? { ...it, quantity: next } : null;
      }
      return it;
    }).filter((it): it is OrderItem => it !== null);

    setEditingOrder({
      ...editingOrder,
      items: updatedItems
    });
  };

  const handleAddEditProduct = (prod: Product) => {
    if (!editingOrder) return;
    const existingItem = editingOrder.items.find(it => it.productId === prod.id);
    let updatedItems: OrderItem[];

    if (existingItem) {
      updatedItems = editingOrder.items.map(it => 
        it.productId === prod.id ? { ...it, quantity: it.quantity + 1 } : it
      );
    } else {
      updatedItems = [
        ...editingOrder.items,
        {
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: 1,
          isDrink: prod.isDrink,
          notes: editNotes[prod.id] || ""
        }
      ];
    }

    setEditingOrder({
      ...editingOrder,
      items: updatedItems
    });
  };

  const handleSaveEditOrder = () => {
    if (!editingOrder) return;
    
    updateOrderWithAuditTrail(
      editingOrder.id,
      editingOrder.items,
      currentUser?.name || "Staff",
      currentUser?.role || "Cashier",
      editingOrder.discountAmount || 0,
      editingOrder.serviceCharge || 0,
      editReason || "Manually updated order items",
      editingOrder.customerNotes
    );

    setEditingOrder(null);
    setEditReason("");
  };

  const handleEditNote = (prodId: string, txt: string) => {
    setEditNotes(prev => ({ ...prev, [prodId]: txt }));
    if (!editingOrder) return;
    setEditingOrder({
      ...editingOrder,
      items: editingOrder.items.map(it => it.productId === prodId ? { ...it, notes: txt } : it)
    });
  };

  const handleServerOrderWithOptions = () => {
    if (!servingOrderWithOptions) return;
    serveOrder(servingOrderWithOptions.id);
    
    // Auto printing optional station tickets on serving
    const activeOrder = servingOrderWithOptions;
    setServingOrderWithOptions(null);

    const matchItems = activeOrder.items.map(it => ({
      name: it.name,
      qty: it.quantity,
      price: it.price,
      note: it.notes
    }));

    const printOrder = {
      orderNo: activeOrder.orderNumber,
      table: activeOrder.tableName,
      waiter: activeOrder.waiterName || "-",
      cashier: currentUser?.name || "Cashier",
      createdAt: new Date().toLocaleString(),
      items: matchItems,
      subtotal: activeOrder.subtotal,
      discount: activeOrder.discountAmount || 0,
      tax: activeOrder.vatAmount || 0,
      total: activeOrder.grandTotal
    };

    if (printKitchenChecked && activeOrder.items.some(it => !it.isDrink)) {
      setPrintingOrder(activeOrder);
      setReceiptType("kitchen");
    } else if (printBaristaChecked && activeOrder.items.some(it => it.isDrink)) {
      setPrintingOrder(activeOrder);
      setReceiptType("barista");
    }
  };

  // Reusable custom prefixed Search Bar component
  const renderCustomSearchBar = (
    query: string,
    setQuery: (q: string) => void,
    mode: "order" | "table" | "waiter" | "item" | "all",
    setMode: (m: "order" | "table" | "waiter" | "item" | "all") => void
  ) => {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-neutral-200/60 mb-6 shrink-0 flex flex-col gap-3 max-w-7xl mx-auto w-full">
        {/* Toggle selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold text-neutral-400">
          <span className="uppercase tracking-widest font-black text-neutral-850">Search Area Fields:</span>
          <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => { setMode("all"); setQuery(""); }}
              className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-md transition-all ${
                mode === "all" ? "bg-amber-950 text-white font-black" : "text-neutral-500 hover:text-neutral-805"
              }`}
            >
              All columns
            </button>
            <button
              type="button"
              onClick={() => { setMode("order"); setQuery(""); }}
              className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-md transition-all flex items-center gap-1 ${
                mode === "order" ? "bg-amber-950 text-white font-black" : "text-neutral-500 hover:text-neutral-805"
              }`}
            >
              Order ID (LN-)
            </button>
            <button
              type="button"
              onClick={() => { setMode("table"); setQuery(""); }}
              className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-md transition-all flex items-center gap-1 ${
                mode === "table" ? "bg-amber-950 text-white font-black" : "text-neutral-500 hover:text-neutral-805"
              }`}
            >
              Table (Table-)
            </button>
            <button
              type="button"
              onClick={() => { setMode("waiter"); setQuery(""); }}
              className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-md transition-all ${
                mode === "waiter" ? "bg-amber-950 text-white font-black" : "text-neutral-500 hover:text-neutral-855"
              }`}
            >
              Waiter
            </button>
            <button
              type="button"
              onClick={() => { setMode("item"); setQuery(""); }}
              className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-md transition-all ${
                mode === "item" ? "bg-amber-950 text-white font-black" : "text-neutral-500 hover:text-neutral-855"
              }`}
            >
              Food Item
            </button>
          </div>
        </div>

        {/* Input bar with absolute text prefix badges */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 flex items-center">
            
            {mode === "order" && (
              <div className="absolute left-3 bg-neutral-100/80 text-neutral-700 border border-neutral-200 text-[10px] font-black px-1.5 py-0.5 rounded select-none uppercase">
                LN-
              </div>
            )}
            {mode === "table" && (
              <div className="absolute left-3 bg-neutral-100/80 text-neutral-700 border border-neutral-200 text-[10px] font-black px-1.5 py-0.5 rounded select-none uppercase">
                Table-
              </div>
            )}

            <input
              type="text"
              placeholder={
                mode === "order" ? "Type sequence number (e.g. 1002)" :
                mode === "table" ? "Type table number (e.g. 05)" :
                mode === "waiter" ? "Search waiter name" :
                mode === "item" ? "Search menu item name" :
                "Search in logs..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full bg-neutral-50 border border-neutral-200 outline-none text-xs text-neutral-800 font-extrabold p-3 rounded-xl focus:bg-white focus:border-amber-950 transition-all ${
                mode === "order" ? "pl-14" : mode === "table" ? "pl-20" : "pl-11"
              }`}
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 w-5 pointer-events-none" style={{ display: mode === "order" || mode === "table" ? "none" : "block" }} />
          </div>

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-neutral-500 hover:text-neutral-800 bg-neutral-100 p-2.5 rounded-xl text-xs font-bold transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  };

  const currentCategoryObj = categories.find(c => c.id === orderCategory);

  return (
    <div className="h-screen flex flex-col bg-neutral-50 text-neutral-800 overflow-hidden select-none">
      
      {/* Upper POS Status Nav bar */}
      <header className="bg-white border-b border-neutral-200/90 py-3.5 px-6 shrink-0 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-850 px-3.5 py-1 text-white text-xs font-black uppercase rounded-xl tracking-widest leading-none">
            <Layers className="w-4 h-4 text-amber-500 scale-90" />
            LUNA CAFÈ POS 
          </div>
          <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider hidden sm:block">
            Shift Operator: <b className="text-[#3a2010] pr-1.5">{currentUser?.name}</b> ({currentUser?.role})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
            {currentUser?.role === "Waiter" && (
              <button 
                onClick={() => setActiveScreen("waiter_landing")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  activeScreen === "waiter_landing" 
                    ? "bg-amber-950 text-white shadow-xs" 
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Dashboard
              </button>
            )}

            {(currentUser?.role !== "Waiter" || activeScreen === "order") && (
              <button 
                onClick={() => setActiveScreen("order")}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  activeScreen === "order" 
                    ? "bg-amber-950 text-white shadow-xs" 
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Dine In POS
              </button>
            )}

            <button 
              onClick={() => setActiveScreen("queue")}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                activeScreen === "queue" 
                  ? "bg-amber-950 text-white shadow-xs" 
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Active Book ({orders.filter(o => o.status !== OrderStatus.PAID && (!o.businessDate || o.businessDate === selectedBusinessDate)).length})
            </button>
          </div>

          <button 
            onClick={logout}
            className="px-3.5 py-2 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-neutral-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main content viewport panels */}
      <div className="flex-1 flex overflow-hidden">
        
        {activeScreen === "waiter_landing" ? (
          <div className="flex-1 overflow-y-auto bg-neutral-100/60 p-8 flex justify-center items-center">
            <div className="w-full max-w-3xl space-y-8">
              {/* Dynamic Welcome Heading Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-neutral-200/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-[#B08E2B] font-black uppercase">
                    EMPLOYEE SECURITY AUTHENTICATED
                  </span>
                  <h1 className="text-xl font-black text-neutral-900">
                    Welcome back, {currentUser?.name || "Staff Member"} ☕
                  </h1>
                  <p className="text-xs text-neutral-500 font-medium">
                    Manage table seatings, register customer beverages, and process order flows seamlessly.
                  </p>
                </div>
                <div className="bg-[#B08E2B]/10 hover:bg-[#B08E2B]/20 border border-[#B08E2B]/15 text-[#B08E2B] text-xs font-black p-3 px-5 rounded-2xl flex items-center gap-2 select-none uppercase font-mono shadow-xs">
                  PIN Auth ACTIVE: {currentUser?.pin || "****"}
                </div>
              </div>

              {/* Grid links list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Create New Order */}
                <button 
                  onClick={() => {
                    setActiveScreen("order");
                  }}
                  className="bg-white rounded-3xl p-6 border-2 border-transparent hover:border-[#B08E2B] shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 group"
                >
                  <div className="p-3 bg-amber-50 rounded-2xl text-[#3a2010] shrink-0">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#3a2010] group-hover:text-[#B08E2B] transition-colors text-sm uppercase">Create New Order</h3>
                    <p className="text-xs text-neutral-500 leading-normal">
                      Initiate a table transaction, customize customer dishes, specify comments, and submit to production.
                    </p>
                  </div>
                </button>

                {/* 2. Search Orders */}
                <button 
                  onClick={() => {
                    setQueueTab("Pending");
                    setActiveScreen("queue");
                  }}
                  className="bg-white rounded-3xl p-6 border-2 border-transparent hover:border-[#B08E2B] shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 group"
                >
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-800 shrink-0">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#3a2010] group-hover:text-[#B08E2B] transition-colors text-sm uppercase">Search Orders</h3>
                    <p className="text-xs text-neutral-500 leading-normal">
                      Instantly index orders by customer reference, invoice total, table room name, or status codes.
                    </p>
                  </div>
                </button>

                {/* 3. View Served Orders */}
                <button 
                  onClick={() => {
                    setQueueTab(OrderStatus.SERVED);
                    setActiveScreen("queue");
                  }}
                  className="bg-white rounded-3xl p-6 border-2 border-transparent hover:border-[#B08E2B] shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 group"
                >
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-800 shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#3a2010] group-hover:text-[#B08E2B] transition-colors text-sm uppercase">View Served Orders</h3>
                    <p className="text-xs text-neutral-500 leading-normal">
                      Audit past server-carried plates. Track delivery status variables to tables and confirm receipts.
                    </p>
                  </div>
                </button>

                {/* 4. View Paid Orders (Read-Only) */}
                <button 
                  onClick={() => {
                    setQueueTab(OrderStatus.PAID);
                    setActiveScreen("queue");
                  }}
                  className="bg-white rounded-3xl p-6 border-2 border-transparent hover:border-[#B08E2B] shadow-xs hover:shadow-md transition-all text-left flex items-start gap-4 group"
                >
                  <div className="p-3 bg-violet-50 rounded-2xl text-violet-800 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#3a2010] group-hover:text-[#B08E2B] transition-colors text-sm uppercase">View Paid Orders</h3>
                    <p className="text-xs text-neutral-500 leading-normal">
                      Access read-only financial ledger statements, invoices, and shift payment archives for historical date.
                    </p>
                  </div>
                </button>

              </div>
            </div>
          </div>
        ) : activeScreen === "order" ? (
          /* ==============================================
             1. CREATE ORDER SCREEN (POS catalog layout)
             ============================================== */
          <>
            {/* Catalog Grid panel (Left) */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-100/60 p-6 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0 justify-between">
                
                {/* Tables fast pick lists */}
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1.5">Pick Room Table:</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {tables.filter(t => t.isEnabled !== false).map((tbl) => {
                      const hasActiveOrder = orders.some(o => o.tableId === tbl.tableId && o.status !== OrderStatus.PAID);
                      return (
                        <button
                          key={tbl.tableId}
                          type="button"
                          onClick={() => setSelectedTable(tbl.tableId)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 border uppercase flex flex-col items-center justify-center min-w-[70px] ${
                            selectedTable === tbl.tableId
                              ? "bg-amber-950 text-white border-amber-950 shadow-sm"
                              : hasActiveOrder
                              ? "bg-amber-100 text-amber-900 border-amber-200"
                              : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                          }`}
                        >
                          <span className="text-[9px] font-black">{tbl.name}</span>
                          {hasActiveOrder && (
                            <span className="text-[7px] text-amber-800 tracking-tighter mt-0.5">Occupied</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Local search inside POS */}
                <div className="w-full md:w-64">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1.5">Filter Products:</span>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Type name to search..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 pl-9 outline-none text-xs font-extrabold focus:border-amber-950"
                    />
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Menu horizontal categories scrollbar */}
              <div className="flex gap-2 overflow-x-auto pb-4 shrink-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setOrderCategory("all")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                    orderCategory === "all"
                      ? "bg-amber-950 text-white border-amber-950 shadow-sm"
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  All catalog
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setOrderCategory(cat.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                      orderCategory === cat.id
                        ? "bg-amber-950 text-white border-amber-950 shadow-sm"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Products list selection grid */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                  {products
                    .filter(p => !p.isArchived)
                    .filter(p => orderCategory === "all" || p.categoryId === orderCategory)
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => handleAddTrayItem(p)}
                        className={`bg-white rounded-2xl p-4 border border-neutral-200 cursor-pointer hover:border-amber-900 hover:shadow-md transition duration-250 flex flex-col justify-between h-36 relative overflow-hidden active:scale-95 group ${
                          !p.available ? "opacity-50 !cursor-not-allowed select-none" : ""
                        }`}
                      >
                        {/* Sold out overlay */}
                        {!p.available && (
                          <div className="absolute inset-0 bg-neutral-900/5 backdrop-blur-3xs z-10 flex items-center justify-center">
                            <span className="bg-neutral-900 text-white font-black text-[8px] tracking-widest px-2 py-1 roundeduppercase rounded-md">
                              SOLD OUT
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-extrabold text-[12px] text-neutral-800 leading-tight group-hover:text-amber-955 transition">
                              {p.name}
                            </h4>
                            <span className="text-[10px] bg-neutral-100 px-1 rounded font-black text-neutral-500 uppercase flex shrink-0">
                              {p.isDrink ? "Drink" : "Food"}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-[10px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-medium">
                              {p.description}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-end border-t border-neutral-100 pt-2 shrink-0">
                          <span className="font-black text-sm text-neutral-900 font-mono">
                            ${p.price.toFixed(2)}
                          </span>
                          <span className="w-7 h-7 bg-amber-50 group-hover:bg-amber-950 text-amber-950 group-hover:text-white rounded-xl flex items-center justify-center transition">
                            <Plus className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>

            {/* Current Order Tray Sidebar (Right) */}
            <div className="w-96 bg-white border-l border-neutral-200 shadow-xl flex flex-col h-full shrink-0 overflow-hidden">
              
              <div className="p-4 border-b border-neutral-150 shrink-0 bg-neutral-50/50 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-black block">Active POS Tray</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-950 text-[10px] font-black uppercase rounded-md shadow-3xs">
                    {selectedTable}
                  </span>
                </div>
                <h3 className="font-black text-sm text-neutral-900 uppercase">
                  Order Details
                </h3>
              </div>

              {/* Items stack scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {trayItems.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 text-neutral-400">
                    <ShoppingCart className="w-10 h-10 opacity-20 text-neutral-500 mb-3" />
                    <p className="text-xs font-black text-neutral-800">Tray is empty</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 max-w-[200px]">
                      Trigger items on the left menu catalog to compile delicious bills instantly.
                    </p>
                  </div>
                ) : (
                  trayItems.map((item) => (
                    <div key={item.productId} className="bg-neutral-50/80 rounded-2xl p-4 border border-neutral-200/50 space-y-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-xs text-neutral-800 leading-tight">
                            {item.name}
                          </h4>
                          <span className="text-[11px] font-black font-mono text-neutral-900 mt-1 block">
                            ${(item.price * item.quantity).toFixed(2)} 
                            <span className="text-[9px] text-neutral-400 font-normal ml-1">(${item.price.toFixed(2)} each)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg px-2 py-1 flex-1">
                        <MessageSquare className="w-3 h-3 shrink-0 text-neutral-400" />
                        <input 
                          type="text"
                          placeholder="Special instructions (e.g., no sugar)"
                          value={item.notes || ""}
                          onChange={(e) => handleTrayItemNote(item.productId, e.target.value)}
                          className="w-full text-[10px] bg-white text-neutral-800 p-0 outline-none font-medium"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-neutral-200/65">
                        <button 
                          onClick={() => updateTrayQty(item.productId, -99)}
                          className="text-red-500 hover:bg-red-50 p-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>

                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => updateTrayQty(item.productId, -1)}
                            className="w-7 h-7 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center font-bold text-neutral-800"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-neutral-800 w-4 text-center">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateTrayQty(item.productId, 1)}
                            className="w-7 h-7 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center font-bold text-neutral-800"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total calculations & submitting */}
              <div className="p-4 border-t border-neutral-150 bg-neutral-50/50 space-y-4 shrink-0">
                
                {trayItems.length > 0 && (
                  <div className="space-y-3 font-medium text-neutral-500">
                    <div className="flex justify-between text-xs">
                      <span>Subtotal</span>
                      <span className="font-extrabold text-neutral-800">${traySubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>VAT ({settings.vatPercentage}%)</span>
                      <span className="font-extrabold text-neutral-900">${trayVat.toFixed(2)}</span>
                    </div>
                    
                    {/* Waiter assignment dropdown for Cashiers */}
                    {currentUser?.role === "Cashier" && (
                      <div className="space-y-1.5 border-t border-neutral-150 pt-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase block">Assign Waiter Shift:</label>
                        <select
                          value={assignedWaiterName}
                          onChange={(e) => setAssignedWaiterName(e.target.value)}
                          className="w-full bg-white border border-neutral-250 rounded-xl p-2.5 text-xs font-black outline-none cursor-pointer focus:border-amber-950 text-neutral-800"
                        >
                          <option value="">Counter POS (Self-service)</option>
                          {users.filter(u => u.role === "Waiter" && u.isActive).map(u => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-black text-neutral-905 border-t border-neutral-200 pt-3">
                      <span>Grand Total</span>
                      <span className="text-base text-amber-955">${trayTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSubmitTray}
                  disabled={trayItems.length === 0}
                  className={`w-full font-bold py-4 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider ${
                    trayItems.length > 0 
                      ? "bg-amber-950 hover:bg-amber-900 text-white cursor-pointer" 
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Submit To Kitchen
                </button>
              </div>

            </div>
          </>
        ) : (
          /* ==============================================
             2. ACTIVE ORDER QUEUE MANAGEMENT (Tabs)
             ============================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Horizontal tabs selector & business date picker */}
            <div className="bg-white border-b border-neutral-200 px-6 py-3 shrink-0 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between overflow-x-auto">
              <div className="flex flex-wrap gap-2">
                
                {/* Pending QR Approval tab */}
                {currentUser?.role !== "Waiter" && (
                  <button 
                    onClick={() => setQueueTab("Pending")}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                      queueTab === "Pending" 
                        ? "bg-amber-500 text-black border-amber-500 shadow-xs" 
                        : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse" />
                    Pending QR Orders
                    <span className="ml-1 bg-white border border-amber-300 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                      {orders.filter(o => o.status === OrderStatus.PENDING_QR && (!o.businessDate || o.businessDate === selectedBusinessDate)).length}
                    </span>
                  </button>
                )}

                {/* Tab 1: Confirmed NEW Orders (Blue) */}
                <button 
                  onClick={() => setQueueTab(OrderStatus.NEW)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    queueTab === OrderStatus.NEW 
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs" 
                      : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  New Orders
                  <span className="ml-1 bg-white border border-blue-300 text-blue-800 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {orders.filter(o => o.status === OrderStatus.NEW && (!o.businessDate || o.businessDate === selectedBusinessDate)).length}
                  </span>
                </button>

                {/* Tab 2: Served Orders (Green) */}
                <button 
                  onClick={() => setQueueTab(OrderStatus.SERVED)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    queueTab === OrderStatus.SERVED 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                      : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  Served to Table
                  <span className="ml-1 bg-white border border-emerald-305 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {orders.filter(o => o.status === OrderStatus.SERVED && (!o.businessDate || o.businessDate === selectedBusinessDate)).length}
                  </span>
                </button>

                {/* Tab 3: Paid & Complete History (Gray) */}
                <button 
                  onClick={() => setQueueTab(OrderStatus.PAID)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    queueTab === OrderStatus.PAID 
                      ? "bg-neutral-600 text-white border-neutral-600 shadow-xs" 
                      : "bg-neutral-50 text-neutral-600 border-neutral-100 hover:bg-neutral-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-neutral-400 rounded-full" />
                  Paid History
                  <span className="ml-1 bg-white border border-neutral-300 text-neutral-600 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {orders.filter(o => o.status === OrderStatus.PAID && o.businessDate === selectedBusinessDate).length}
                  </span>
                </button>

              </div>
              
              {/* Datepicker calendar selector to consult historical shifts */}
              <div className="flex items-center gap-2 self-stretch md:self-auto bg-neutral-100 p-1.5 rounded-xl border border-neutral-200 shrink-0">
                <span className="text-[10px] uppercase font-black text-neutral-500 pl-1">Shift Day:</span>
                <input
                  type="date"
                  value={selectedBusinessDate}
                  onChange={(e) => setSelectedBusinessDate(e.target.value)}
                  className="bg-white border border-neutral-300 rounded-lg text-xs font-black p-1.5 outline-none focus:border-amber-950 cursor-pointer text-stone-800 font-mono"
                />
              </div>
            </div>

            {/* Displaying orders details inside grid cards */}
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 flex flex-col">
              
              {/* Distinct search bar matching active selected tab filters and prefacing */}
              {queueTab === "Pending" && renderCustomSearchBar(pendingSearchQuery, setPendingSearchQuery, pendingSearchMode, setPendingSearchMode)}
              {queueTab === OrderStatus.NEW && renderCustomSearchBar(newSearchQuery, setNewSearchQuery, newSearchMode, setNewSearchMode)}
              {queueTab === OrderStatus.SERVED && renderCustomSearchBar(servedSearchQuery, setServedSearchQuery, servedSearchMode, setServedSearchMode)}
              {queueTab === OrderStatus.PAID && renderCustomSearchBar(paidSearchQuery, setPaidSearchQuery, paidSearchMode, setPaidSearchMode)}

              {displayedOrders.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-12 bg-white rounded-2xl shadow-xs border border-neutral-200/50 max-w-lg mx-auto w-full my-auto space-y-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-neutral-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-800 text-sm">No active entries</h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-normal max-w-xs">
                      There are currently no orders under the <b>{queueTab === "Pending" ? "Pending QR" : queueTab}</b> status matching filters.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl w-full mx-auto">
                  {displayedOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className={`bg-white rounded-2xl p-5 shadow-xs border flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300 ${
                        order.status === OrderStatus.PENDING_QR 
                          ? "border-amber-400/80 bg-gradient-to-br from-amber-50/15 via-white to-white" 
                          : "border-neutral-200"
                      }`}
                    >
                      {/* Decorative status top flags */}
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        order.status === OrderStatus.PENDING_QR ? "bg-amber-500" :
                        order.status === OrderStatus.NEW ? "bg-blue-500" :
                        order.status === OrderStatus.SERVED ? "bg-emerald-500" : "bg-neutral-600"
                      }`} />

                       {/* Polished header with prominent Table Number & Waiter Name */}
                      <div className="flex justify-between items-start pt-1.5 pb-2.5 border-b border-neutral-100 mb-3.5">
                        <div>
                          {/* Table Name prominently highlighted at the top */}
                          <div className="flex items-center gap-1.5">
                            <span className="bg-amber-500 text-stone-950 text-xs font-black px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                              {order.tableName}
                            </span>
                          </div>
                          {/* Waiter Name directly below Table Number */}
                          <div className="text-[11px] text-neutral-500 font-bold mt-1.5 flex items-center gap-1">
                            Waiter: <span className="text-neutral-800 font-extrabold">{order.waiterName || "Unassigned"}</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <span className="text-[10px] font-bold text-neutral-400">{order.orderNumber}</span>
                          <span className="text-sm font-black text-[#B08E2B] mt-1">${order.grandTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Items loop */}
                      <div className="bg-neutral-50/70 rounded-xl p-3 space-y-2 flex-1">
                        <table className="w-full text-xs">
                          <tbody>
                            {order.items.map((item, id) => (
                              <tr key={id} className="align-top">
                                <td className="py-1 font-extrabold pr-2 text-neutral-500 w-10">{item.quantity}x</td>
                                <td className="py-1">
                                  <div className="font-semibold text-neutral-800 flex items-center gap-1">
                                    {item.name}
                                    {item.isDrink ? (
                                      <span className="bg-amber-50 text-[8px] text-amber-800 font-bold px-1 rounded uppercase">Drink</span>
                                    ) : (
                                      <span className="bg-emerald-50 text-[8px] text-emerald-800 font-bold px-1 rounded uppercase">Food</span>
                                    )}
                                  </div>
                                  {item.notes && (
                                    <span className="text-[10px] italic text-amber-700 block mt-0.5 font-medium">* {item.notes}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {order.customerNotes && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200">
                            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-extrabold block">General Instructions:</span>
                            <p className="text-[10px] text-neutral-800 font-medium italic">"{order.customerNotes}"</p>
                          </div>
                        )}
                      </div>

                      {/* Actions workflow */}
                      <div className="space-y-2">
                        {order.status === OrderStatus.PENDING_QR && (
                          /* Pending approval actions */
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => startEditingPending(order)}
                              className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-black py-2 rounded-lg transition-all"
                            >
                              Edit / Change
                            </button>
                            <button 
                              onClick={() => approveOrder(order.id)}
                              className="bg-amber-500 hover:bg-amber-600 text-black text-[11px] font-black py-2 rounded-lg transition-all"
                            >
                              Approve Order
                            </button>
                            <button 
                              onClick={() => rejectOrder(order.id)}
                              className="col-span-2 text-red-600 hover:bg-red-50 text-[10px] font-extrabold py-1.5 rounded transition"
                            >
                              Reject & Purge Order
                            </button>
                          </div>
                        )}

                        {order.status === OrderStatus.NEW && (
                          /* Serving actions */
                          <div className="space-y-2 w-full">
                            <div className="grid grid-cols-3 gap-2">
                              {currentUser?.role !== "Waiter" && (
                                <button 
                                  onClick={() => { setPrintingOrder(order); setReceiptType("kitchen"); }}
                                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1 transition"
                                  title="Print Kitchen ticket"
                                >
                                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                                  Kitchen
                                </button>
                              )}
                              
                              {currentUser?.role !== "Waiter" && (
                                <button 
                                  onClick={() => { setPrintingOrder(order); setReceiptType("barista"); }}
                                  className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1 transition"
                                  title="Print Barista ticket"
                                >
                                  <Cup className="w-3.5 h-3.5 text-blue-500" />
                                  Barista
                                </button>
                              )}

                              <button 
                                onClick={() => {
                                  setServingOrderWithOptions(order);
                                  setPrintKitchenChecked(true);
                                  setPrintBaristaChecked(true);
                                }}
                                className="col-span-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1 transition"
                              >
                                Mark Served
                              </button>
                            </div>
                            
                            {/* Waiters cannot edit order items */}
                            {currentUser?.role !== "Waiter" && (
                              <button 
                                onClick={() => startEditingPending(order)}
                                className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg transition shadow-xs text-center flex items-center justify-center gap-1"
                              >
                                Edit / Change Items
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === OrderStatus.SERVED && (
                          /* Print invoice & Cashed out actions */
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              {/* Open customer printer modal directly */}
                              <button 
                                onClick={() => { setPrintingOrder(order); setReceiptType("customer"); }}
                                className="bg-white hover:bg-neutral-50 border border-neutral-250 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Print Invoice
                              </button>
                              
                              {/* Waiters cannot edit active order items */}
                              {currentUser?.role !== "Waiter" ? (
                                <button 
                                  onClick={() => startEditingPending(order)}
                                  className="bg-white hover:bg-neutral-50 border border-neutral-250 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                                >
                                  Edit Items
                                </button>
                              ) : (
                                <div className="bg-neutral-100 border border-neutral-200 rounded-lg text-[9px] text-neutral-400 flex items-center justify-center uppercase font-black px-2">
                                  Waiter Shift Checked
                                </div>
                              )}
                            </div>
                            
                            {/* Payout channels via Settle and Checkout modal */}
                            {currentUser?.role !== "Waiter" && (
                              <button 
                                onClick={() => handleOpenCheckout(order)}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 text-[11px] font-black py-3 rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Settle & Checkout Bill
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === OrderStatus.PAID && (
                          /* History details display */
                          <div className="text-[10px] text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200/50 space-y-1.5">
                            <div>Checked out by Cashier: <b className="text-neutral-800 font-extrabold">{order.cashierName || "Siti"}</b></div>
                            <div>Paid Category: <b className="text-neutral-800 font-extrabold">{order.paymentMethod || "Cash"}</b></div>
                            <div>Checkout Time: <b className="text-neutral-801 font-extrabold">{new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              <button 
                                onClick={() => { setPrintingOrder(order); setReceiptType("customer"); }}
                                className="text-blue-600 hover:bg-blue-50/50 block py-1.5 rounded-lg font-extrabold text-center uppercase border border-blue-100 text-[10px]"
                              >
                                Reprint Bill
                              </button>
                              
                              {/* Waiters strictly cannot edit past paid orders */}
                              {currentUser?.role !== "Waiter" && (
                                <button 
                                  onClick={() => startEditingPending(order)}
                                  className="text-neutral-600 hover:bg-neutral-100 block py-1.5 rounded-lg font-extrabold text-center uppercase border border-neutral-250 text-[10px]"
                                >
                                  Edit Items
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Checkout Modal overlay */}
      {paymentActiveOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-3xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-6">
            <button 
              onClick={() => setPaymentActiveOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-450 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-1 bg-stone-950 border border-stone-800 rounded-2xl flex items-center justify-center">
                <LunaLogo size={48} hideText={true} />
              </div>
              <div>
                <span className="text-[9px] text-[#E5C158] font-bold font-mono uppercase tracking-widest block">Luna Cafe Cashier Settle Desk</span>
                <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1">
                  Settling Order: {paymentActiveOrder.orderNumber}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-500 font-bold uppercase">Table Reference</span>
                <p className="font-extrabold text-[#E5C158] uppercase">{paymentActiveOrder.tableName}</p>
              </div>
              <div className="bg-stone-950 border border-stone-800 p-3 rounded-xl space-y-1">
                <span className="text-[10px] text-stone-500 font-bold uppercase">Assigned Staff</span>
                <p className="font-extrabold text-stone-300">{paymentActiveOrder.waiterName || "Counter POS"} / {currentUser?.name}</p>
              </div>
            </div>

            {/* Financial modifier inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Discount ($)</label>
                  <input 
                    type="number" min="0" step="0.5"
                    value={discountVal || ""} 
                    onChange={(e) => setDiscountVal(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl font-bold font-mono outline-none text-white focus:border-[#E5C158]"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Service Charge ($)</label>
                  <input
                    type="number" min="0" step="0.1"
                    value={serviceChgVal || ""}
                    onChange={(e) => setServiceChgVal(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0.00"
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl font-bold font-mono outline-none text-white focus:border-[#E5C158]"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Customer Type</label>
                  <select
                    value={customerTypeVal}
                    onChange={(e) => setCustomerTypeVal(e.target.value as any)}
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl font-bold outline-none cursor-pointer focus:border-[#E5C158] text-stone-200"
                  >
                    <option value="Dine-In">🏡 Dine-In</option>
                    <option value="Takeaway">🥡 Takeaway</option>
                    <option value="Delivery">🚲 Delivery</option>
                  </select>
                </div>
              </div>

              {/* Grand summary banner */}
              <div className="bg-stone-950 border border-stone-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-[#E5C158] font-black uppercase tracking-widest block">Net total to be collected (VAT Incl.)</span>
                  <span className="text-[9px] text-stone-500 font-bold uppercase animate-pulse">Subtotal: ${paymentActiveOrder.subtotal.toFixed(2)} | Tax: ${paymentActiveOrder.vatAmount.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#E5C158] font-mono">
                    ${checkoutGrandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block">
                Select Payment Channel Code
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { name: "Cash", sub: "Hard currency" },
                  { name: "Zaad (480495)", sub: "Evc Digital" },
                  { name: "Sahal (319347)", sub: "Golis E-Wallet" },
                  { name: "eDahab (759816)", sub: "Somnet Wallet" },
                  { name: "MyCash (951993)", sub: "Hormuud Mobile" },
                  { name: "TPlus (871056)", sub: "Telecom Plus" }
                ].map((ch) => (
                  <button
                    key={ch.name}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(ch.name);
                      if (ch.name !== "Cash") setAmountReceivedVal(""); 
                    }}
                    className={`p-2 border rounded-xl text-left transition transform active:scale-95 flex flex-col justify-between h-14 cursor-pointer ${
                      paymentMethod === ch.name 
                        ? "bg-[#E5C158]/10 border-[#E5C158] text-white" 
                        : "bg-stone-950 border-stone-800 text-stone-300 hover:text-white"
                    }`}
                  >
                    <span className="font-extrabold text-[10px] leading-tight block">{ch.name}</span>
                    <span className="text-[8px] text-stone-500 uppercase leading-none font-medium">{ch.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fields based on selection */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                  {paymentMethod === "Cash" ? "Cash Received ($)" : "Transaction Reference No."}
                </label>
                {paymentMethod === "Cash" ? (
                  <input 
                    type="number" min={checkoutGrandTotal} step="1" required
                    value={amountReceivedVal}
                    placeholder={`E.g., $${Math.ceil(checkoutGrandTotal)}`}
                    onChange={(e) => setAmountReceivedVal(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl font-bold font-mono outline-none text-white focus:border-[#E5C158]"
                  />
                ) : (
                  <input 
                    type="text" required
                    placeholder="E.g., TX-921038"
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl font-mono text-white outline-none focus:border-[#E5C158]"
                  />
                )}
              </div>

              {/* Dynamic Returned Cash Calculation */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">
                  {paymentMethod === "Cash" ? "Balance / Change Returned" : "E-Wallet Status"}
                </span>
                <div className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl text-stone-300 font-bold font-mono flex items-center h-[38px]">
                  {paymentMethod === "Cash" ? (
                    <span className="text-emerald-400 font-extrabold text-sm font-mono">
                      ${(parseFloat(amountReceivedVal) > checkoutGrandTotal ? (parseFloat(amountReceivedVal) - checkoutGrandTotal) : 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[#E5C158] text-[9px] font-bold uppercase tracking-wider">DIGITAL GATEWAY READY</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentActiveOrder(null)}
                className="py-3 bg-stone-950 border border-stone-800 hover:bg-stone-800 font-bold rounded-xl text-stone-400 hover:text-white transition cursor-pointer"
              >
                Cancel Settle
              </button>
              
              <button
                type="button"
                onClick={submitCheckoutPayment}
                className="py-3 bg-[#E5C158] hover:bg-[#D4AF37] font-black text-stone-950 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                Complete Payment
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Editing dialog modal (For cashiers to customize Pending QR Orders prior approval) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-3xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl relative overflow-hidden flex flex-col h-[85vh] text-neutral-800">
            
            {/* Header banner */}
            <div className="px-6 py-4 bg-neutral-900 text-white shrink-0 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-[#E5C158] font-bold font-mono tracking-wider block uppercase">Modification & Item Auditing Log</span>
                <h3 className="text-sm font-black flex items-center gap-2">
                  Ref: <span className="text-neutral-205 font-extrabold">{editingOrder.orderNumber}</span>
                  <span>|</span>
                  Table: <span className="text-neutral-205 font-extrabold">{editingOrder.tableName}</span>
                  <span>|</span>
                  Status: <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-[9px] uppercase">{editingOrder.status}</span>
                </h3>
              </div>
              <button 
                onClick={() => setEditingOrder(null)}
                className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-800 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core body grid */}
            <div className="flex-1 flex overflow-hidden min-h-0">
              
              {/* Order content lists (Left side) */}
              <div className="w-1/2 p-6 overflow-y-auto border-r border-neutral-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Current Order List ({editingOrder.items.reduce((acc, current) => acc + current.quantity, 0)} items)
                    </span>
                    {editingOrder.items.length === 0 ? (
                      <div className="bg-neutral-50 border border-dashed border-neutral-200/60 rounded-2xl p-6 text-center text-neutral-400">
                        <ShoppingCart className="w-7 h-7 mx-auto mb-2 opacity-30 text-neutral-500" />
                        <p className="text-xs font-bold">Order list is empty</p>
                        <p className="text-[10px] mt-0.5 text-neutral-400">Select items on the right list to add them.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editingOrder.items.map((it, idx) => (
                          <div key={idx} className="bg-neutral-50 p-3 rounded-xl flex items-center justify-between border border-neutral-200/50 hover:bg-neutral-100/50 transition">
                            <div className="space-y-0.5 flex-1 pr-2">
                              <h4 className="text-xs font-black text-neutral-801 leading-tight">{it.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-extrabold text-amber-955">${(it.price * it.quantity).toFixed(2)}</span>
                                <span className="text-[10px] text-neutral-400 font-medium">${it.price.toFixed(2)} each</span>
                              </div>
                              <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded px-1.5 py-0.5 mt-1">
                                <MessageSquare className="w-2.5 h-2.5 text-neutral-400" />
                                <input
                                  type="text"
                                  placeholder="Item note..."
                                  value={it.notes || ""}
                                  onChange={(e) => handleEditNote(it.productId, e.target.value)}
                                  className="w-full text-[9px] bg-transparent outline-none py-0.5"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                type="button"
                                onClick={() => updateEditQty(it.productId, -1)}
                                className="w-7 h-7 rounded-full bg-white hover:bg-neutral-100 border border-neutral-250 flex items-center justify-center font-bold text-neutral-800 shadow-3xs active:scale-90 transition cursor-pointer"
                              >
                                <Minus className="w-3 h-3 text-neutral-600" />
                              </button>
                              
                              <span className="text-xs font-black w-5 text-center select-none text-neutral-808">{it.quantity}</span>
                              
                              <button 
                                type="button"
                                onClick={() => updateEditQty(it.productId, 1)}
                                className="w-7 h-7 rounded-full bg-white hover:bg-neutral-100 border border-neutral-250 flex items-center justify-center font-bold text-neutral-800 shadow-3xs active:scale-90 transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-neutral-600" />
                              </button>
                              
                              <button 
                                type="button"
                                onClick={() => updateEditQty(it.productId, -it.quantity)}
                                className="ml-1 p-1 hover:bg-red-55 text-red-500 rounded-md transition cursor-pointer shrink-0"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pricing Overview Summary */}
                  {editingOrder.items.length > 0 && (
                    <div className="bg-amber-50/40 border border-amber-900/5 rounded-xl p-3 space-y-1.5 text-xs text-neutral-600">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span className="font-extrabold text-neutral-800">
                          ${editingOrder.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>VAT (${((editingOrder.vatRate ?? settings.vatPercentage / 100) * 100).toFixed(0)}%)</span>
                        <span className="font-extrabold text-neutral-800">
                          ${(editingOrder.items.reduce((s, i) => s + i.price * i.quantity, 0) * (editingOrder.vatRate ?? settings.vatPercentage / 100)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-200/50 pt-2 text-xs font-black text-neutral-900 uppercase tracking-wide">
                        <span>Estimated Total</span>
                        <span className="text-amber-955 font-extrabold text-sm">
                          ${(
                            editingOrder.items.reduce((s, i) => s + i.price * i.quantity, 0) * 
                            (1 + (editingOrder.vatRate ?? settings.vatPercentage / 100))
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Notes / Special Instructions and Audit fields */}
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">
                        General Customer Notes:
                      </span>
                      <textarea
                        rows={2}
                        placeholder="E.g. Table order special requests"
                        value={editingOrder.customerNotes || ""}
                        onChange={(e) => setEditingOrder({ ...editingOrder, customerNotes: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-neutral-400"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1">
                        Auditing/Change Reason (Mandatory):
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="E.g. Customer changed mind, added order extra, cancelled item"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-neutral-400 text-neutral-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Audit trigger button */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-100 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold rounded-xl text-center text-xs transition cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditOrder}
                    disabled={editingOrder.items.length === 0 || !editReason.trim()}
                    className={`py-3 text-white font-black rounded-xl text-center text-xs transition flex items-center justify-center gap-1.5 shadow-xs uppercase tracking-wider ${
                      editingOrder.items.length > 0 && editReason.trim()
                        ? "bg-amber-950 hover:bg-amber-900 cursor-pointer"
                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Apply Changes
                  </button>
                </div>

              </div>

              {/* Add menu items panel (Right side) */}
              <div className="w-1/2 bg-neutral-50 p-6 flex flex-col overflow-hidden">
                <div className="flex gap-3 mb-4 shrink-0">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Filter category or item..."
                      value={editProductSearch}
                      onChange={(e) => setEditProductSearch(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-xl p-2 pl-8 text-xs font-semibold outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select
                    value={editCategoryFilter}
                    onChange={(e) => setEditCategoryFilter(e.target.value)}
                    className="bg-white border border-neutral-200 text-xs font-semibold rounded-xl px-2 outline-none cursor-pointer"
                  >
                    <option value="all">All Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Menu elements grid scroll */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3 pb-2">
                    {products
                      .filter(p => !p.isArchived)
                      .filter(p => editCategoryFilter === "all" || p.categoryId === editCategoryFilter)
                      .filter(p => p.name.toLowerCase().includes(editProductSearch.toLowerCase()))
                      .map(p => {
                        const countInEdit = editingOrder.items.find(it => it.productId === p.id)?.quantity || 0;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleAddEditProduct(p)}
                            className="bg-white p-3 rounded-xl border border-neutral-200 hover:border-amber-955 hover:shadow-2xs cursor-pointer flex flex-col justify-between h-24 relative overflow-hidden transition"
                          >
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-extrabold text-[11px] text-neutral-800 leading-tight">
                                {p.name}
                              </h5>
                              {countInEdit > 0 && (
                                <span className="bg-amber-950 text-white font-black text-[9px] px-1.5 rounded-full shrink-0">
                                  {countInEdit}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-end border-t border-neutral-100 pt-1.5">
                              <span className="font-black text-xs text-neutral-800 font-mono">${p.price.toFixed(2)}</span>
                              <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-955 flex items-center justify-center font-bold">
                                +
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Served Tickets printer options Modal */}
      {servingOrderWithOptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-850 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-5">
            <button 
              onClick={() => setServingOrderWithOptions(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-450 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest block">Luna Serving Station Manager</span>
              <h3 className="text-sm font-black text-white uppercase mt-0.5">
                Serving Order: {servingOrderWithOptions.orderNumber}
              </h3>
            </div>

            <p className="text-xs text-stone-400 leading-normal font-medium">
              Would you like to print additional station tickets directly to the thermal receipt paper rolls?
            </p>

            <div className="space-y-3.5 pt-1">
              <label className="flex items-center gap-2.5 font-bold text-xs select-none text-stone-300">
                <input 
                  type="checkbox" 
                  checked={printKitchenChecked}
                  onChange={(e) => setPrintKitchenChecked(e.target.checked)}
                  className="w-4.5 h-4.5 accent-amber-500 cursor-pointer text-stone-950 rounded bg-stone-950"
                />
                Print Kitchen Ticket (Food)
              </label>

              <label className="flex items-center gap-2.5 font-bold text-xs select-none text-stone-300">
                <input 
                  type="checkbox" 
                  checked={printBaristaChecked}
                  onChange={(e) => setPrintBaristaChecked(e.target.checked)}
                  className="w-4.5 h-4.5 accent-amber-500 cursor-pointer text-stone-950 rounded bg-stone-950"
                />
                Print Barista Ticket (Drinks)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setPrintKitchenChecked(false);
                  setPrintBaristaChecked(false);
                  serveOrder(servingOrderWithOptions.id);
                  setServingOrderWithOptions(null);
                }}
                className="py-2.5 bg-stone-950 border border-stone-800 hover:bg-stone-800 font-bold rounded-xl text-stone-400 hover:text-white text-xs transition cursor-pointer"
              >
                Skip Printing
              </button>
              
              <button
                type="button"
                onClick={handleServerOrderWithOptions}
                className="py-2.5 bg-[#E5C158] hover:bg-[#D4AF37] font-black text-stone-950 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                Accept & Print
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Global Receipt Printer Modal Layer View */}
      {printingOrder && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-3xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-950 border border-stone-850 text-white rounded-3xl overflow-hidden w-full max-w-sm h-[80vh] shadow-2xl relative">
            <button 
              onClick={() => setPrintingOrder(null)}
              className="absolute top-4 right-4 p-1 bg-stone-900 border border-stone-850 hover:bg-stone-800 rounded-full text-stone-300 hover:text-white transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="h-full p-1.5">
              <ReceiptView 
                order={printingOrder}
                settings={settings}
                type={receiptType}
                onClose={() => setPrintingOrder(null)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
