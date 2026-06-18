import React, { useState } from "react";
import { usePOS } from "../store/posStore";
import { Order, OrderItem, OrderStatus, Product, Table, UserRole, getSomaliaToday } from "../types";
import { 
  Coffee, Layers, Check, ShoppingCart, Search, Plus, Minus, Trash2, 
  MessageSquare, Printer, CheckCircle, Flame, Coffee as Cup, ShieldCheck, X, FileText, ChevronRight, AlertTriangle,
  Edit, Save, Calendar
} from "lucide-react";
import { ReceiptView } from "./ReceiptPrinters";
import { LunaLogo } from "./LunaLogo";

export const StaffDashboard: React.FC = () => {
  const { 
    currentUser, categories, products, tables, orders, settings, users,
    createOrder, approveOrder, rejectOrder, updateOrderItems, serveOrder, cancelOrder, payOrder, logout,
    theme, setTheme, updateOrderWaiter, updateOrderWithAuditTrail,
    updateProduct
  } = usePOS();

  // Screen modes: "order" (Create Order) or "queue" (Order Queue manager)
  const [activeScreen, setActiveScreen] = useState<"order" | "queue">("order");
  
  // Dashboard Order Queue Tab (1 = New, 2 = Served, 3 = Paid, 4 = QR Pending)
  const [queueTab, setQueueTab] = useState<OrderStatus | "Pending">("Pending");

  // Selection states inside "Create Order" mode
  const [selectedTable, setSelectedTable] = useState<string>("LUNA-T01");
  const [orderCustomerType, setOrderCustomerType] = useState<"Dine-In" | "Takeaway">("Dine-In");
  const [assignedWaiterName, setAssignedWaiterName] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [orderCategory, setOrderCategory] = useState<string>("all");
  const [productSearch, setProductSearch] = useState<string>("");
  
  // Active temporary order tray for creating a POS order
  const [trayItems, setTrayItems] = useState<OrderItem[]>([]);
  const [trayNotes, setTrayNotes] = useState<{ [id: string]: string }>({});
  const [generalTrayComment, setGeneralTrayComment] = useState("");

  // Receipt printing state variables
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [receiptType, setReceiptType] = useState<"kitchen" | "barista" | "customer">("customer");
  const [servingOrderWithOptions, setServingOrderWithOptions] = useState<Order | null>(null);
  const [printKitchenChecked, setPrintKitchenChecked] = useState(true);
  const [printBaristaChecked, setPrintBaristaChecked] = useState(true);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState<string>(getSomaliaToday());

  const canEditWaiter = currentUser?.role === UserRole.DEVELOPER || currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.CASHIER;

  // Waiter editing state variables
  const [editingWaiterOrder, setEditingWaiterOrder] = useState<Order | null>(null);
  const [selectedWaiterName, setSelectedWaiterName] = useState("");

  const handleOpenWaiterEdit = (order: Order) => {
    setEditingWaiterOrder(order);
    setSelectedWaiterName(order.waiterName || "");
  };

  const handleSaveWaiterEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWaiterOrder) {
      updateOrderWaiter(editingWaiterOrder.id, selectedWaiterName);
      setEditingWaiterOrder(null);
    }
  };

  // Quick Edit Product dashboard state variables
  const [dashboardEditingProduct, setDashboardEditingProduct] = useState<Product | null>(null);
  const [dashEditName, setDashEditName] = useState("");
  const [dashEditPrice, setDashEditPrice] = useState(0);
  const [dashEditAvailable, setDashEditAvailable] = useState(true);
  const [dashEditCategory, setDashEditCategory] = useState("");
  const [dashEditStation, setDashEditStation] = useState("");
  const [dashEditDescription, setDashEditDescription] = useState("");

  const handleOpenDashEdit = (p: Product) => {
    setDashboardEditingProduct(p);
    setDashEditName(p.name);
    setDashEditPrice(p.price);
    setDashEditAvailable(!!p.available);
    setDashEditCategory(p.categoryId);
    setDashEditStation(p.stationId || "station-kitchen");
    setDashEditDescription(p.description || "");
  };

  const handleSaveDashProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardEditingProduct) return;
    updateProduct(dashboardEditingProduct.id, {
      name: dashEditName,
      price: dashEditPrice,
      available: dashEditAvailable,
      categoryId: dashEditCategory,
      stationId: dashEditStation,
      description: dashEditDescription
    });
    
    // Sync active tray items names/prices if they were updated
    setTrayItems(prev => prev.map(it => {
      if (it.productId === dashboardEditingProduct.id) {
        return {
          ...it,
          name: dashEditName,
          price: dashEditPrice
        };
      }
      return it;
    }));

    setDashboardEditingProduct(null);
  };

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
    createOrder(
      selectedTable,
      trayItems,
      generalTrayComment,
      assignedWaiterName || currentUser?.name || "Staff",
      false, // Directly confirmed
      orderCustomerType
    );

    // Reset Tray
    setTrayItems([]);
    setTrayNotes({});
    setGeneralTrayComment("");
    setAssignedWaiterName("");
    setOrderCustomerType("Dine-In");
    
    // Switch to queue
    setActiveScreen("queue");
    setQueueTab(OrderStatus.NEW);
  };

  // Helper to match order with selected filterDate
  const orderMatchesDate = (o: Order) => {
    if (!filterDate) return true;
    try {
      const d = new Date(o.createdAt);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      const localDateStr = `${yr}-${mo}-${da}`;
      return localDateStr === filterDate;
    } catch (err) {
      return o.createdAt.startsWith(filterDate);
    }
  };

  const [queueSearchQuery, setQueueSearchQuery] = useState("");
  const [postSaveOrder, setPostSaveOrder] = useState<Order | null>(null);

  // Filter orders by active queue tab selection and queueSearchQuery
  const filteredOrders = orders.filter(o => {
    if (!orderMatchesDate(o)) return false;
    
    // Tab 4 is Customer self order Pending QR
    const matchesTab = queueTab === "Pending" ? o.status === OrderStatus.PENDING_QR : o.status === queueTab;
    if (!matchesTab) return false;

    if (queueSearchQuery.trim()) {
      const q = queueSearchQuery.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.tableName?.toLowerCase().includes(q) ||
        o.tableId?.toLowerCase().includes(q) ||
        o.waiterName?.toLowerCase().includes(q) ||
        (o.customerNotes && o.customerNotes.toLowerCase().includes(q)) ||
        o.items.some(item => item.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState("");
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
    if (currentUser?.role === UserRole.WAITER || currentUser?.role?.toLowerCase() === "waiter") {
      alert("Waiters are not allowed to settle payment or mark orders as paid.");
      return;
    }
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
    if (currentUser?.role === UserRole.WAITER || currentUser?.role?.toLowerCase() === "waiter") {
      alert("Waiters are not allowed to settle payment or mark orders as paid.");
      return;
    }
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

    // After checkout triggers, configure the paid model parameters to load the high-fidelity receipt view instantly
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
  };

  const updateEditQty = (prodId: string, delta: number) => {
    if (!editingOrder) return;
    const isWaiter = currentUser?.role === UserRole.WAITER || currentUser?.role?.toLowerCase() === "waiter";
    if (isWaiter && delta < 0) {
      alert("Waiters are only allowed to add items, not to remove or decrease quantities on served or paid orders.");
      return;
    }
    const updatedItems = editingOrder.items.map(it => {
      if (it.productId === prodId) {
        const next = it.quantity + delta;
        return { ...it, quantity: next };
      }
      return it;
    }).filter(it => it.quantity > 0);

    setEditingOrder({
      ...editingOrder,
      items: updatedItems
    });
  };

  const addEditProduct = (prod: Product) => {
    if (!editingOrder) return;
    const existingItem = editingOrder.items.find(it => it.productId === prod.id);
    if (existingItem) {
      updateEditQty(prod.id, 1);
    } else {
      setEditingOrder({
        ...editingOrder,
        items: [
          ...editingOrder.items,
          {
            productId: prod.id,
            name: prod.name,
            price: prod.price,
            quantity: 1,
            isDrink: prod.isDrink,
            stationId: prod.stationId || (prod.isDrink ? "station-bar" : "station-kitchen")
          }
        ]
      });
    }
  };

  const saveEditedOrder = () => {
    if (!editingOrder) return;
    
    const subtotal = editingOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const vatRate = editingOrder.vatRate ?? (settings.vatPercentage / 100);
    const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
    const discount = editingOrder.discountAmount || 0;
    const serviceChg = editingOrder.serviceCharge || 0;
    const grandTotal = parseFloat((subtotal + vatAmount + serviceChg - discount).toFixed(2));

    const updatedOrder: Order = {
      ...editingOrder,
      subtotal,
      vatRate,
      vatAmount,
      grandTotal,
    };

    // Update local context with detailed auditing trace
    updateOrderWithAuditTrail(
      editingOrder.id,
      editingOrder.items,
      currentUser?.name || "Staff Cashier",
      currentUser?.role || "Cashier",
      discount, // discount
      serviceChg, // service charge
      editReason ? editReason.trim() : "Items/Quantities adjusted",
      editingOrder.customerNotes,
      editingOrder.waiterName,
      editingOrder.tableId,
      editingOrder.tableName
    );
    
    setEditingOrder(null);
    setEditReason("");
    setPostSaveOrder(updatedOrder);
  };

  const markOrderPaid = (orderId?: string) => {
    if (currentUser?.role?.toLowerCase() === "waiter") {
      alert("Waiters are not allowed to settle payment or mark orders as paid.");
      return;
    }
    if (orderId) {
      payOrder(orderId, "Cash", currentUser?.name || "Staff", "", 0, 0, 0, "Dine-In");
      alert("Order marked as paid.");
    } else {
      alert("Demonstrating permission validation: Allowed!");
    }
  };

  const deleteOrder = (orderId?: string) => {
    if (currentUser?.role?.toLowerCase() === "waiter") {
      alert("Waiters are not allowed to delete orders.");
      return;
    }
    if (orderId) {
      cancelOrder(orderId, "Deleted by staff");
      alert("Order deleted.");
    } else {
      alert("Demonstrating permission validation: Allowed!");
    }
  };

  return (
    <div id="staff-workspace" className="min-h-screen bg-stone-100 flex flex-col font-sans select-none overflow-hidden h-screen">

      {/* Header bar */}
      <header className="bg-amber-950 text-white px-6 py-3 shrink-0 flex flex-col md:flex-row items-center gap-3 justify-between shadow-md">
        <div className="flex items-center gap-3 justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-900 rounded-xl flex items-center justify-center border border-amber-800">
              <Coffee className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">{settings.restaurantName} POS</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-neutral-300 font-bold">
                  Logged in: <span className="text-amber-400">{currentUser?.name}</span> ({currentUser?.role})
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick mobile logout toggle */}
          <button 
            type="button" 
            onClick={logout}
            className="md:hidden text-[10px] bg-amber-900 px-2.5 py-1.5 rounded-lg border border-amber-800 font-extrabold text-amber-200"
          >
            Logout
          </button>
        </div>

        {/* Universal Search Bar input container */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900 font-extrabold" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            placeholder="Search matching order #No, waitstaff, table ID or number..."
            className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl bg-orange-50 hover:bg-white focus:bg-white text-neutral-900 placeholder:text-neutral-500 border-2 border-amber-800 outline-none focus:outline-none focus:border-amber-950 font-bold shadow-md transition"
          />
          {globalSearchQuery && (
            <button
              onClick={() => setGlobalSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 hover:text-neutral-950 transition"
              title="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View toggles */}
        <div className="flex bg-amber-900/40 p-1 rounded-xl border border-amber-800/50">
          <button 
            onClick={() => setActiveScreen("order")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeScreen === "order" ? "bg-amber-900 text-white shadow-md" : "text-amber-200/80 hover:text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Create POS Order
          </button>
          
          <button 
            onClick={() => setActiveScreen("queue")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 relative ${
              activeScreen === "queue" ? "bg-amber-900 text-white shadow-md" : "text-amber-200/80 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            Order Queue Manager
            {orders.some(o => o.status === OrderStatus.PENDING_QR) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                {orders.filter(o => o.status === OrderStatus.PENDING_QR).length}
              </span>
            )}
          </button>
        </div>

        {/* Theme mode selector */}
        <div className="flex bg-amber-900/40 p-1 rounded-xl border border-amber-800/50 items-center">
          <button 
            type="button"
            onClick={() => setTheme("light")}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition ${
              theme === "light" ? "bg-amber-100 text-amber-950 font-extrabold" : "text-amber-200 hover:text-white"
            }`}
          >
            Light
          </button>
          <button 
            type="button"
            onClick={() => setTheme("dark")}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition ${
              theme === "dark" ? "bg-amber-950 text-white font-extrabold" : "text-amber-200 hover:text-white"
            }`}
          >
            Dark
          </button>
          <button 
            type="button"
            onClick={() => setTheme("white")}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition ${
              theme === "white" ? "bg-white text-black font-extrabold" : "text-amber-200 hover:text-white"
            }`}
          >
            White
          </button>
        </div>

        <button 
          onClick={logout}
          className="text-xs font-bold bg-amber-900 hover:bg-neutral-800 border border-amber-800/80 text-amber-300 px-3.5 py-2 rounded-xl transition active:scale-95"
        >
          Logout PIN
        </button>
      </header>

      {/* Main stage splits */}
      <div className="flex-1 flex overflow-hidden">
        
        {globalSearchQuery ? (
          /* ==============================================
             UNIVERSAL SEARCH SYSTEM RESULTS VIEW
             ============================================== */
          <div className="flex-1 flex flex-col bg-stone-100 overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-stone-200 pb-4 shrink-0">
              <div>
                <span className="text-[10px] text-amber-800 uppercase tracking-widest font-black block">Luna Café Search Hub</span>
                <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-700" />
                  Real-time Lookup System
                </h1>
                <p className="text-xs text-stone-500 font-medium">
                  Showing results matching <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">"{globalSearchQuery}"</span>
                </p>
              </div>
              <button
                onClick={() => setGlobalSearchQuery("")}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              {/* Left & Center: Matching POS Orders */}
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-widest text-stone-500 font-extrabold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    Matching Orders ({orders.filter(o => 
                      orderMatchesDate(o) && (
                        o.orderNumber?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        o.tableName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        o.tableId?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        o.waiterName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        (o.customerNotes && o.customerNotes.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
                        o.items.some(item => item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                      )
                    ).length})
                  </h3>
                </div>

                {orders.filter(o => 
                  orderMatchesDate(o) && (
                    o.orderNumber?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    o.tableName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    o.tableId?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    o.waiterName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    (o.customerNotes && o.customerNotes.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
                    o.items.some(item => item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                  )
                ).length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center text-stone-400 space-y-3">
                    <p className="text-xs">No registered orders match your current lookup criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.filter(o => 
                      orderMatchesDate(o) && (
                        o.orderNumber?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        o.tableName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        o.tableId?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        o.waiterName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                        (o.customerNotes && o.customerNotes.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
                        o.items.some(item => item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                      )
                    ).map((order) => (
                      <div key={order.id} className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                          order.status === OrderStatus.PENDING_QR ? "bg-amber-500" :
                          order.status === OrderStatus.NEW ? "bg-blue-500" :
                          order.status === OrderStatus.SERVED ? "bg-emerald-500" :
                          order.status === OrderStatus.CANCELLED ? "bg-red-500" : "bg-neutral-400"
                        }`} />
                        
                        <div className="flex justify-between items-start pt-1">
                          <div>
                            <span className="text-[10px] text-stone-400 font-bold block uppercase font-mono">{order.status}</span>
                            <h4 className="font-black text-sm text-stone-900 flex items-center gap-1.5 leading-tight">
                              {order.orderNumber}
                              <span className="bg-stone-100 text-stone-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                {order.tableName}
                              </span>
                            </h4>
                            <span className="text-[10px] text-stone-400 font-medium block mt-0.5 whitespace-nowrap">
                              Server: <span className="font-bold text-stone-700">{order.waiterName || "Counter POS"}</span>
                              {canEditWaiter && (
                                <button
                                  onClick={() => handleOpenWaiterEdit(order)}
                                  className="inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-stone-600 rounded text-[9px] font-bold transition border border-stone-200 cursor-pointer"
                                  title="Edit Waiter Name"
                                >
                                  <Edit className="w-2.5 h-2.5" />
                                  Edit Waiter
                                </button>
                              )}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 font-bold block">TOTAL AMOUNT</span>
                            <span className="text-sm font-black text-stone-900">${order.grandTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Items listed */}
                        <div className="bg-stone-50 rounded-xl p-3 space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-stone-700">
                              <span className="font-semibold">{it.quantity}x {it.name}</span>
                              <span className="font-mono text-stone-500">${(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order action routes */}
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedTable(order.tableId);
                                setActiveScreen("order");
                                setGlobalSearchQuery("");
                              }}
                              className="bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-black py-2 rounded-lg transition shrink-0 cursor-pointer"
                            >
                              Open Table POS
                            </button>
                            <button
                              onClick={() => { setPrintingOrder(order); setReceiptType("customer"); }}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-black py-2 rounded-lg transition shrink-0 cursor-pointer"
                            >
                              Print Bill / Invoice
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => { setPrintingOrder(order); setReceiptType("kitchen"); }}
                              className="border border-stone-250 hover:bg-stone-50 text-stone-700 text-[10px] font-bold py-2 rounded-lg transition shrink-0 cursor-pointer"
                            >
                              Kitchen Copy
                            </button>
                            <button
                              onClick={() => { setPrintingOrder(order); setReceiptType("barista"); }}
                              className="border border-stone-250 hover:bg-stone-50 text-stone-700 text-[10px] font-bold py-2 rounded-lg transition shrink-0 cursor-pointer"
                            >
                              Barista Copy
                            </button>
                          </div>

                          <button
                            onClick={() => startEditingPending(order)}
                            className="w-full bg-white hover:bg-stone-50 border border-stone-250 text-stone-700 text-[10px] font-black py-2 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5 text-stone-500" />
                            Edit Items / Details
                          </button>

                          {order.status === OrderStatus.SERVED && currentUser?.role !== "Waiter" && (
                            <button
                              onClick={() => handleOpenCheckout(order)}
                              className="w-full bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 text-[10px] font-black py-2.5 rounded-lg text-center transition shrink-0 cursor-pointer"
                            >
                              Settle & Checkout Bill
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Matching Restaurant Tables */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-stone-500 font-extrabold flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-stone-400" />
                  Matching Tables ({tables.filter(t => 
                    t.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    t.tableId.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                    (t.assignedWaiter && t.assignedWaiter.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                  ).length})
                </h3>

                {tables.filter(t => 
                  t.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  t.tableId.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  (t.assignedWaiter && t.assignedWaiter.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                ).length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center text-stone-400">
                    <p className="text-xs">No active tables match your search query.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tables.filter(t => 
                      t.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      t.tableId.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      (t.assignedWaiter && t.assignedWaiter.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                    ).map((table) => {
                      const isDirty = table.status === "dirty";
                      const isOrdered = table.status === "ordered";
                      return (
                        <div key={table.id} className="bg-white border border-stone-250/75 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] bg-stone-100 text-stone-700 font-mono font-bold px-1.5 py-0.5 rounded">
                              {table.tableId}
                            </span>
                            <h4 className="font-extrabold text-stone-900 text-xs mt-1">{table.name}</h4>
                            <p className="text-[10px] text-stone-450 font-medium mt-0.5">
                              Assigned Waiter: <span className="text-stone-700 font-semibold">{table.assignedWaiter || "None"}</span>
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                              isDirty ? "bg-amber-100 text-amber-800" :
                              isOrdered ? "bg-stone-100 text-cyan-800" :
                              "bg-emerald-100 text-emerald-800"
                            }`}>
                              {table.status}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedTable(table.tableId);
                                setActiveScreen("order");
                                setGlobalSearchQuery("");
                              }}
                              className="px-3 py-1.5 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 rounded-lg text-[10px] font-black transition cursor-pointer"
                            >
                              Launch POS
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeScreen === "order" ? (
          /* ==============================================
             1. CREATING AN ORDER PANEL (Waiter & Cashier POS)
             ============================================== */
          <>
            {/* Left sidebar categories */}
            <div className="w-56 bg-white border-r border-neutral-200 flex flex-col shrink-0">
              <div className="p-4 border-b border-neutral-100 uppercase tracking-widest text-neutral-400 font-extrabold text-[10px]">
                Menu Sections
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => setOrderCategory("all")}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    orderCategory === "all" ? "bg-amber-100/70 text-amber-950" : "text-neutral-600 hover:bg-stone-50"
                  }`}
                >
                  <span>All Dishes</span>
                  <span className="text-[10px] bg-neutral-200/50 text-neutral-500 px-1.5 py-0.5 rounded-md font-extrabold">
                    {products.filter(p=>!p.isArchived && p.available).length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = products.filter(p => p.categoryId === cat.id && !p.isArchived && p.available).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setOrderCategory(cat.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        orderCategory === cat.id ? "bg-amber-100/70 text-amber-950" : "text-neutral-600 hover:bg-stone-50"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] bg-neutral-200/50 text-neutral-500 px-1.5 py-0.5 rounded-md font-extrabold">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center Product menu grids */}
            <div className="flex-1 flex flex-col bg-neutral-50">
              {/* Product searches */}
              <div className="p-4 border-b border-neutral-150 flex items-center gap-3 bg-white shadow-xs">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900" />
                  <input 
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search dishes or active items..."
                    className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl bg-orange-50 hover:bg-white focus:bg-white text-neutral-900 placeholder:text-neutral-500 border border-amber-900/40 outline-none focus:outline-none focus:ring-1 focus:ring-amber-950 focus:border-amber-950 font-bold transition"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800"
                      title="Clear product search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                {/* Visual tables count indicator */}
                <div className="text-xs font-medium text-neutral-500 ml-auto flex items-center gap-1.5">
                  <span className="font-bold text-neutral-800">Default VAT Rate:</span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-1 rounded font-black">
                    {settings.vatPercentage}%
                  </span>
                </div>
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products
                  .filter(p => !p.isArchived && p.available)
                  .filter(p => productSearch ? true : (orderCategory === "all" || p.categoryId === orderCategory))
                  .filter(p => {
                    const matchesName = p.name.toLowerCase().includes(productSearch.toLowerCase());
                    const cat = categories.find(c => c.id === p.categoryId);
                    const matchesCategoryName = cat ? cat.name.toLowerCase().includes(productSearch.toLowerCase()) : false;
                    return matchesName || matchesCategoryName;
                  })
                  .map((p) => {
                    const matchesTray = trayItems.find(it => it.productId === p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => p.available && handleAddTrayItem(p)}
                        className={`bg-white border text-left rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-amber-900/50 cursor-pointer active:scale-98 transition flex flex-col ${
                          matchesTray ? "border-amber-950 ring-1 ring-amber-950" : "border-neutral-200"
                        } ${!p.available ? "opacity-60 select-none cursor-not-allowed" : ""}`}
                      >
                        <div className="h-28 bg-neutral-100 relative">
                          <img 
                            src={p.image} 
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400`;
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDashEdit(p);
                            }}
                            className="absolute top-1.5 left-1.5 p-1.5 bg-neutral-900/75 hover:bg-neutral-900 text-white rounded-lg backdrop-blur-xs border border-white/20 transition-all cursor-pointer z-10 hover:scale-105 active:scale-95 flex items-center justify-center shadow-md"
                            title="Edit Product Details"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {!p.available && (
                            <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
                              <span className="text-[10px] text-white bg-red-600 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Sold out
                              </span>
                            </div>
                          )}
                          {p.isDrink ? (
                            <span className="absolute bottom-1.5 right-1.5 p-1 bg-white border border-neutral-100 rounded-md text-[9px] font-black text-amber-800">
                              BEVERAGE
                            </span>
                          ) : (
                            <span className="absolute bottom-1.5 right-1.5 p-1 bg-white border border-neutral-100 rounded-md text-[9px] font-black text-emerald-800">
                              FOOD
                            </span>
                          )}
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                          <h4 className="text-xs font-black text-neutral-900 line-clamp-2 leading-tight">
                            {p.name}
                          </h4>
                          <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
                            <span className="text-xs font-black text-neutral-900">${p.price.toFixed(2)}</span>
                            {matchesTray && (
                              <span className="text-[10px] bg-amber-950 text-white font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                                {matchesTray.quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            </div>

             {/* Right side: ACTIVE Order panel */}
            <div className="w-96 bg-white border-l border-neutral-200 flex flex-col shrink-0">
              
              {/* Header: Table and Waiter select */}
              <div className="p-4 border-b border-neutral-150 space-y-3 bg-neutral-50/55">
                {/* Order Mode selector */}
                <div className="space-y-1">
                  <h3 className="text-xs uppercase tracking-widest font-black text-neutral-500">
                    Order Mode
                  </h3>
                  <div className="grid grid-cols-2 gap-2 bg-neutral-200/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setOrderCustomerType("Dine-In")}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                        orderCustomerType === "Dine-In"
                          ? "bg-amber-950 text-white shadow-xs"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      🛋️ Dine-In
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderCustomerType("Takeaway")}
                      className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                        orderCustomerType === "Takeaway"
                          ? "bg-amber-950 text-white shadow-xs"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      🛍️ Takeaway
                    </button>
                  </div>
                </div>

                {orderCustomerType === "Dine-In" ? (
                  <div className="space-y-1">
                    <h3 className="text-xs uppercase tracking-widest font-black text-neutral-500">
                      Assign Restaurant Table
                    </h3>
                    <div className="relative flex-1 text-xs">
                      <select 
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 font-bold outline-none text-neutral-800"
                      >
                        {tables.map(t => (
                          <option key={t.tableId} value={t.tableId}>
                            {t.name} ({t.tableId}) - {t.status.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-bold flex items-start gap-2">
                    <span className="text-sm">📌</span>
                    <div>
                      <span className="block font-black uppercase text-[10px] tracking-wide text-amber-950 mb-0.5">Takeaway Mode</span>
                      Order automatically assigned to counter virtual POS (no table reservation locked).
                    </div>
                  </div>
                )}

                {/* Optional Waiter Assign option */}
                {(currentUser?.role === UserRole.CASHIER || currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.DEVELOPER || currentUser?.role === UserRole.WAITER || currentUser?.role?.toLowerCase() === "waiter") && (
                  <div className="space-y-1">
                    <h3 className="text-xs uppercase tracking-widest font-black text-neutral-500">
                      Assign Waiter
                    </h3>
                    <div className="relative flex-1 text-xs">
                      <select 
                        value={assignedWaiterName}
                        onChange={(e) => setAssignedWaiterName(e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 font-bold outline-none text-neutral-800"
                      >
                        <option value="">-- Assign to Waiter --</option>
                        {users
                          .filter(u => u.role === UserRole.WAITER && u.isActive)
                          .map(w => (
                            <option key={w.id} value={w.name}>
                              {w.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Items tray List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {trayItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-neutral-400">
                    <ShoppingCart className="w-12 h-12 text-neutral-300 stroke-[1.5]" />
                    <div>
                      <p className="font-bold text-neutral-500 text-sm">Cart is empty</p>
                      <p className="text-xs text-neutral-400 mt-1">Select cafe dishes on left to append to order list.</p>
                    </div>
                  </div>
                ) : (
                  trayItems.map((item, index) => (
                    <div key={index} className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-black text-neutral-800">{item.name}</h4>
                          <p className="text-[10px] text-neutral-400 font-bold">${item.price.toFixed(2)} unit</p>
                        </div>
                        <span className="text-xs font-extrabold text-neutral-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Comment line input */}
                      <div className="flex items-center gap-1.5 text-neutral-400 focus-within:text-amber-800">
                        <MessageSquare className="w-3 h-3 shrink-0" />
                        <input 
                          type="text"
                          placeholder="Special instructions (e.g., no sugar)"
                          value={item.notes || ""}
                          onChange={(e) => handleTrayItemNote(item.productId, e.target.value)}
                          className="w-full text-[10px] bg-white border border-neutral-150 p-1 rounded-md outline-none focus:border-amber-950 font-medium"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-neutral-100/50">
                        <button 
                          onClick={() => updateTrayQty(item.productId, -99)}
                          className="text-red-500 hover:bg-red-50 p-1 px-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>

                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => updateTrayQty(item.productId, -1)}
                            className="w-6 h-6 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center font-bold text-neutral-800"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-extrabold text-neutral-800 w-3 text-center">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateTrayQty(item.productId, 1)}
                            className="w-6 h-6 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center font-bold text-neutral-800"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total calculations */}
              <div className="p-4 border-t border-neutral-150 bg-neutral-50/50 space-y-3 shrink-0">
                
                {trayItems.length > 0 && (
                  <div className="space-y-1.5 text-xs font-medium text-neutral-500">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-neutral-800">${traySubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({settings.vatPercentage}%)</span>
                      <span className="font-bold text-neutral-900">${trayVat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-neutral-900 border-t border-neutral-200 pt-2">
                      <span>Grand Total</span>
                      <span>${trayTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSubmitTray}
                  disabled={trayItems.length === 0}
                  className={`w-full font-bold py-3.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider ${
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
             2. ACTIVE ORDER QUEUE MANAGEMENT (Tabs 1 to 4)
             ============================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Prominent Select Order Date Header */}
            <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-950" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-950">Select Order Date</span>
                <span className="text-[9px] px-2 py-0.5 bg-amber-100/50 border border-amber-200/50 rounded-md text-amber-900 font-extrabold uppercase font-mono shadow-2xs">Somalia Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-amber-950 text-neutral-900 rounded-xl text-xs font-black outline-none tracking-tight focus:ring-1 focus:ring-amber-950 font-sans shadow-2xs cursor-pointer min-w-[140px]"
                />
                
                <div className="text-[10px] text-neutral-400 font-bold uppercase hidden sm:block ml-2 select-none">
                  Tracking {filteredOrders.length} records
                </div>
              </div>
            </div>

            {/* Horizontal sub-tabs selector */}
            <div className="bg-white border-b border-neutral-200 px-6 py-2 shrink-0 flex items-center justify-between overflow-x-auto">
              <div className="flex gap-2">
                
                {/* Tab 4: QR self-orders Pending (Orange) */}
                <button 
                  onClick={() => setQueueTab("Pending")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    queueTab === "Pending" 
                      ? "bg-amber-500 text-black border-amber-500 shadow-sm" 
                      : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-amber-600 rounded-full animate-pulse" />
                  Pending QR Orders
                  <span className="ml-1 bg-white border border-amber-300 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {orders.filter(o => o.status === OrderStatus.PENDING_QR && orderMatchesDate(o)).length}
                  </span>
                </button>

                {/* Tab 1: New order list confirmed (Blue) */}
                <button 
                  onClick={() => setQueueTab(OrderStatus.NEW)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    queueTab === OrderStatus.NEW 
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                      : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  New Orders
                  <span className="ml-1 bg-white border border-blue-300 text-blue-800 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {orders.filter(o => o.status === OrderStatus.NEW && orderMatchesDate(o)).length}
                  </span>
                </button>

                {/* Tab 2: Served (Green) */}
                <button 
                  onClick={() => setQueueTab(OrderStatus.SERVED)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    queueTab === OrderStatus.SERVED 
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs" 
                      : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping-slow" />
                  Served to Table
                  <span className="ml-1 bg-white border border-emerald-305 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {orders.filter(o => o.status === OrderStatus.SERVED && orderMatchesDate(o)).length}
                  </span>
                </button>

                {/* Tab 3: Paid & complete history (Gray) */}
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
                    {orders.filter(o => o.status === OrderStatus.PAID && orderMatchesDate(o)).length}
                  </span>
                </button>

                {/* Tab 5: Cancelled Orders (Red) */}
                <button 
                  onClick={() => setQueueTab(OrderStatus.CANCELLED)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    queueTab === OrderStatus.CANCELLED 
                      ? "bg-red-650 text-white border-red-600 shadow-xs" 
                      : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50"
                  }`}
                >
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  Cancelled Orders
                  <span className="ml-1 bg-white border border-red-300 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {orders.filter(o => o.status === OrderStatus.CANCELLED && orderMatchesDate(o)).length}
                  </span>
                </button>

              </div>
              
              <div className="flex items-center gap-3 shrink-0 ml-4 py-1">
                <div className="text-[10px] text-neutral-400 font-bold uppercase hidden sm:block">
                  Active View: <span className="font-extrabold text-stone-700">{filteredOrders.length} matches</span>
                </div>
              </div>
            </div>

            {/* Displaying orders details inside grid cards */}
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 flex flex-col">
              
              {filteredOrders.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-12 bg-white rounded-2xl shadow-xs border border-neutral-200/50 max-w-lg mx-auto w-full my-auto space-y-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-neutral-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-800 text-sm">No active entries</h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-normal max-w-xs">
                      There are currently no orders registered under the <b>{queueTab}</b> status.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl w-full mx-auto">
                  {filteredOrders.map((order) => (
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
                        order.status === OrderStatus.SERVED ? "bg-emerald-500" :
                        order.status === OrderStatus.CANCELLED ? "bg-red-500" : "bg-neutral-400"
                      }`} />

                      {/* Topmeta */}
                      <div className="flex justify-between items-start pt-1.5">
                        <div>
                          <span className="text-[10px] text-neutral-400 font-bold block">
                            ORDER REFS
                          </span>
                          <h4 className="font-black text-sm text-neutral-900 flex items-center gap-1.5">
                            {order.orderNumber}
                            <span className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                              {order.tableName}
                            </span>
                          </h4>
                          <div className="text-[10px] text-stone-500 font-medium flex items-center gap-1.5 mt-1.5 whitespace-nowrap">
                            Server: <span className="font-extrabold text-stone-800">{order.waiterName || "Counter POS"}</span>
                            {canEditWaiter && (
                              <button
                                onClick={() => handleOpenWaiterEdit(order)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-stone-600 rounded text-[9px] font-bold transition border border-stone-200 cursor-pointer"
                                title="Edit Waiter Name"
                              >
                                <Edit className="w-2.5 h-2.5 text-stone-500" />
                                Edit Waiter
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 font-bold block">TOTAL AMOUNT</span>
                          <span className="text-sm font-black text-neutral-900">${order.grandTotal.toFixed(2)}</span>
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
                              <button 
                                onClick={() => { setPrintingOrder(order); setReceiptType("kitchen"); }}
                                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1 transition"
                                title="Print Kitchen duplicate"
                              >
                                <Flame className="w-3.5 h-3.5 text-orange-500" />
                                Kitchen
                              </button>
                              
                              <button 
                                onClick={() => { setPrintingOrder(order); setReceiptType("barista"); }}
                                className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1 transition"
                                title="Print Barista duplicate"
                              >
                                <Cup className="w-3.5 h-3.5 text-blue-500" />
                                Barista
                              </button>

                              <button 
                                onClick={() => {
                                  setServingOrderWithOptions(order);
                                  setPrintKitchenChecked(true);
                                  setPrintBaristaChecked(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1 transition"
                              >
                                Mark Served
                              </button>
                            </div>
                            <button 
                              onClick={() => startEditingPending(order)}
                              className="w-full bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg transition shadow-xs text-center flex items-center justify-center gap-1"
                            >
                              Edit / Change Items
                            </button>
                            {(currentUser?.role === UserRole.CASHIER || currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.DEVELOPER) && (
                              <button 
                                onClick={() => {
                                  setCancellingOrder(order);
                                  setCancelReasonText("");
                                }}
                                className="w-full bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 text-[11px] font-black py-2 rounded-lg transition-all"
                              >
                                Cancel Order
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
                                View Bill Info
                              </button>
                              <button 
                                onClick={() => startEditingPending(order)}
                                className="bg-white hover:bg-neutral-50 border border-neutral-250 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                              >
                                Edit Items
                              </button>
                            </div>
                            
                            {/* Payout channels via Settle and Checkout modal */}
                            {currentUser?.role !== UserRole.WAITER && currentUser?.role?.toLowerCase() !== "waiter" && (
                              <button 
                                  onClick={() => handleOpenCheckout(order)}
                                  className="w-full bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 text-[11px] font-black py-3 rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Settle & Checkout Bill
                              </button>
                            )}

                            {(currentUser?.role === UserRole.CASHIER || currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.DEVELOPER) && (
                              <button 
                                onClick={() => {
                                  setCancellingOrder(order);
                                  setCancelReasonText("");
                                }}
                                className="w-full bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 text-[11px] font-black py-2 rounded-lg transition-all"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        )}

                        {order.status === OrderStatus.CANCELLED && (
                          /* Cancelled order state display */
                          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-[11px] font-bold space-y-2">
                            <div>
                              <span className="block text-red-800 uppercase tracking-wide font-extrabold mb-1">
                                Voided / Cancelled Order
                              </span>
                              <span className="text-neutral-500 font-medium block leading-normal font-sans">
                                This order has been officially voided/cancelled by an authorized Cashier or Developer.
                              </span>
                            </div>
                            {order.cancelReason && (
                              <div className="mt-1.5 border-t border-red-200 pt-1.5 bg-red-100/40 p-2.5 rounded-lg">
                                <span className="block text-red-800 tracking-wider font-extrabold uppercase text-[9px] font-sans">
                                  Cancellation Reason:
                                </span>
                                <span className="italic block font-black text-red-950 mt-0.5 text-[11.5px] leading-relaxed">
                                  "{order.cancelReason}"
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {order.status === OrderStatus.PAID && (
                          /* History details display */
                          <div className="text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded-lg space-y-0.5">
                            <div>Checked out by Cashier: <b className="text-neutral-800">{order.cashierName || "Siti"}</b></div>
                            <div>Paid Category: <b className="text-neutral-800">{order.paymentMethod || "Cash"}</b></div>
                            <div>Checkout Time: <b className="text-neutral-800">{new Date(order.updatedAt).toLocaleTimeString()}</b></div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button 
                                onClick={() => { setPrintingOrder(order); setReceiptType("customer"); }}
                                className="text-blue-600 hover:underline hover:bg-blue-50/50 block py-1.5 rounded font-extrabold text-center uppercase border border-blue-100 text-[10px]"
                              >
                                Reprint Bill
                              </button>
                              <button 
                                onClick={() => startEditingPending(order)}
                                className="text-neutral-600 hover:bg-neutral-105 block py-1.5 rounded font-extrabold text-center uppercase border border-neutral-250 text-[10px]"
                              >
                                Edit Items
                              </button>
                            </div>
                            {(currentUser?.role === UserRole.CASHIER || currentUser?.role === UserRole.MANAGER || currentUser?.role === UserRole.DEVELOPER) && (
                              <button 
                                onClick={() => {
                                  setCancellingOrder(order);
                                  setCancelReasonText("");
                                }}
                                className="w-full mt-2 bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 text-[11px] font-black py-2 rounded-lg transition-all"
                              >
                                Cancel Order
                              </button>
                            )}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
                  <span className="text-[9px] text-stone-500 font-bold uppercase">Subtotal: ${paymentActiveOrder.subtotal.toFixed(2)} | Tax: ${paymentActiveOrder.vatAmount.toFixed(2)}</span>
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
                        : "bg-stone-950 border-stone-800 text-stone-400 hover:text-white"
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

      {/* Custom Order Cancellation Modal with Auditing Reason */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            <button 
              onClick={() => { setCancellingOrder(null); setCancelReasonText(""); }}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-450 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] text-red-400 font-bold font-mono uppercase tracking-widest block">Audit Safe Protocol</span>
                <h2 className="text-base font-black text-white uppercase tracking-tight">
                  Cancel Order {cancellingOrder.orderNumber}
                </h2>
                <p className="text-[11px] text-stone-400 mt-1">
                  Table Reference: <span className="font-bold text-stone-200">{cancellingOrder.tableName}</span>
                </p>
              </div>
            </div>

            <div className="bg-stone-950 border border-stone-850 p-4 rounded-xl space-y-3">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Select or Enter Cancellation Reason
              </label>
              
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  "Customer changed mind",
                  "Ordered by mistake / duplicate",
                  "Kitchen stock out of items",
                  "Wrong table selected",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReasonText(preset)}
                    className={`py-1.5 px-2.5 rounded-lg border text-left font-semibold transition ${
                      cancelReasonText === preset 
                        ? "bg-red-950/30 border-red-800 text-red-300" 
                        : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block mb-1.5">
                  Detailed Explanation / Remark:
                </label>
                <textarea
                  required
                  rows={2}
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Explain why this order is cancelled/voided..."
                  className="w-full bg-stone-900 border border-stone-800 p-2.5 rounded-xl text-xs outline-none text-white focus:border-red-500 font-sans leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => { setCancellingOrder(null); setCancelReasonText(""); }}
                className="py-3 bg-stone-950 border border-stone-800 hover:bg-stone-800 font-bold rounded-xl text-stone-400 hover:text-white transition cursor-pointer text-center"
              >
                No, Keep Order
              </button>
              
              <button
                type="button"
                disabled={!cancelReasonText.trim()}
                onClick={() => {
                  if (cancelReasonText.trim()) {
                    cancelOrder(cancellingOrder.id, cancelReasonText.trim());
                    setCancellingOrder(null);
                    setCancelReasonText("");
                  }
                }}
                className={`py-3 font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 text-center ${
                  cancelReasonText.trim()
                    ? "bg-red-650 hover:bg-red-600 text-white cursor-pointer"
                    : "bg-stone-800 text-stone-500 cursor-not-allowed"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing dialog modal (For cashiers to customize Pending QR Orders prior approval) */}
      {editingOrder && (() => {
        const isReadOnly = editingOrder.status === OrderStatus.PAID || ((currentUser?.role === UserRole.WAITER || currentUser?.role?.toLowerCase() === "waiter") && !settings.allowWaiterEdit);
        const subtotal = editingOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
        const vatRate = editingOrder.vatRate ?? (settings.vatPercentage / 100);
        const vatAmount = parseFloat((subtotal * vatRate).toFixed(2));
        const discount = editingOrder.discountAmount || 0;
        const serviceChg = editingOrder.serviceCharge || 0;
        const grandTotal = parseFloat((subtotal + vatAmount + serviceChg - discount).toFixed(2));
        return (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-2 md:p-4">
            <div className="bg-white rounded-3xl shadow-2xl relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/50">
              <div>
                <h2 className="text-base md:text-lg font-black text-neutral-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-950">
                    <FileText className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                  Edit / Adjust Order Items
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] md:text-xs">
                  <span className="text-neutral-500 font-bold">
                    Ref: <span className="text-neutral-900 font-extrabold">{editingOrder.orderNumber}</span>
                  </span>
                  <span className="text-neutral-500 font-bold">
                    Table: <span className="text-neutral-900 font-extrabold">{editingOrder.tableName}</span>
                  </span>
                  <span className="text-neutral-500 font-bold flex items-center gap-1">
                    Status: <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-black text-[9px] uppercase">{editingOrder.status}</span>
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setEditingOrder(null)}
                className="p-2 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Content Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              
              {/* Left Column: Current Order Items, Chef Notes, Change Reason & Save Actions */}
              <div className="w-full md:w-[42%] border-b md:border-b-0 md:border-r border-neutral-100 p-4 md:p-5 flex flex-col overflow-hidden justify-between bg-white min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  
                  {/* Notice for Waitstaff if editing disabled */}
                  {(currentUser?.role === UserRole.WAITER || currentUser?.role?.toLowerCase() === "waiter") && !settings.allowWaiterEdit && (
                    <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-[10.5px] text-amber-900 font-medium leading-normal">
                      ⚠️ <b>Waiter Editing Restricted</b>: Pre-payment order editing must be toggled on in Cafe Settings by an Admin/Manager for you to modify active lists. Opened as read-only.
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Current Order List ({subtotal > 0 ? editingOrder.items.reduce((acc, current) => acc + current.quantity, 0) : 0} items)
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
                              <h4 className="text-xs font-black text-neutral-800 leading-tight">{it.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-extrabold text-amber-950">${(it.price * it.quantity).toFixed(2)}</span>
                                <span className="text-[10px] text-neutral-400 font-medium">${it.price.toFixed(2)} each</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!isReadOnly && (
                                <button 
                                  type="button"
                                  onClick={() => updateEditQty(it.productId, -1)}
                                  className="w-7 h-7 rounded-full bg-white hover:bg-neutral-100 border border-neutral-250 flex items-center justify-center font-bold text-neutral-800 shadow-xs active:scale-90 transition cursor-pointer"
                                >
                                  <Minus className="w-3 h-3 text-neutral-600" />
                                </button>
                              )}
                              
                              <span className="text-xs font-black w-5 text-center select-none text-neutral-800">{it.quantity}</span>
                              
                              {!isReadOnly && (
                                <button 
                                  type="button"
                                  onClick={() => updateEditQty(it.productId, 1)}
                                  className="w-7 h-7 rounded-full bg-white hover:bg-neutral-100 border border-neutral-250 flex items-center justify-center font-bold text-neutral-800 shadow-xs active:scale-90 transition cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 text-neutral-600" />
                                </button>
                              )}
                              
                              {!isReadOnly && (
                                <button 
                                  type="button"
                                  onClick={() => updateEditQty(it.productId, -it.quantity)}
                                  className="ml-1 p-1 hover:bg-red-50 text-red-500 rounded-md transition cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Waiter Assign dropdown inside receipt modal */}
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Waitstaff Assignment
                    </span>
                    {!isReadOnly ? (
                      <div className="flex gap-2">
                        <select
                          value={users.some(u => u.name === editingOrder.waiterName && u.role === UserRole.WAITER) ? editingOrder.waiterName : (editingOrder.waiterName ? "__custom__" : "")}
                          onChange={(e) => {
                            if (e.target.value !== "__custom__") {
                              setEditingOrder({ ...editingOrder, waiterName: e.target.value });
                            } else {
                              setEditingOrder({ ...editingOrder, waiterName: "New Waiter" });
                            }
                          }}
                          className="flex-1 text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-bold text-neutral-800"
                        >
                          <option value="">Counter POS / None</option>
                          {users
                            .filter(u => u.role === UserRole.WAITER && u.isActive)
                            .map(w => (
                              <option key={w.id} value={w.name}>
                                {w.name}
                              </option>
                            ))}
                          <option value="__custom__">Custom Waiter Name...</option>
                        </select>
                        
                        {(!users.some(u => u.name === editingOrder.waiterName && u.role === UserRole.WAITER) && editingOrder.waiterName) && (
                          <input
                            type="text"
                            required
                            placeholder="Type waiter name..."
                            value={editingOrder.waiterName || ""}
                            onChange={(e) => setEditingOrder({ ...editingOrder, waiterName: e.target.value })}
                            className="flex-1 text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-bold text-neutral-800"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="bg-neutral-50 border p-3 rounded-xl text-xs flex justify-between items-center">
                        <span className="text-neutral-505 font-bold">Assigned Waiter</span>
                        <span className="font-extrabold text-neutral-800">{editingOrder.waiterName || "Counter POS"}</span>
                      </div>
                    )}
                  </div>

                  {/* Table Assign dropdown inside receipt modal */}
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Restaurant Table
                    </span>
                    {!isReadOnly ? (
                      <select
                        value={editingOrder.tableId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matchedTbl = tables.find(t => t.tableId === val);
                          setEditingOrder({
                            ...editingOrder,
                            tableId: val,
                            tableName: matchedTbl ? matchedTbl.name : "Takeaway"
                          });
                        }}
                        className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-extrabold text-neutral-800"
                      >
                        <option value="">Takeaway / Virtual Counter POS</option>
                        {tables.map(t => (
                          <option key={t.tableId} value={t.tableId}>
                            {t.name} ({t.tableId}) - {t.status.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="bg-neutral-50 border p-3 rounded-xl text-xs flex justify-between items-center">
                        <span className="text-neutral-505 font-bold">Assigned Table</span>
                        <span className="font-extrabold text-neutral-800">{editingOrder.tableName || "Takeaway Mode"}</span>
                      </div>
                    )}
                  </div>

                  {/* Discount Modifier field */}
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Financial Discount
                    </span>
                    {!isReadOnly ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-neutral-400 text-xs">$</span>
                        <input 
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0.00"
                          value={editingOrder.discountAmount || ""}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setEditingOrder({ ...editingOrder, discountAmount: val });
                          }}
                          className="w-full text-xs pl-7 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-mono font-bold"
                        />
                      </div>
                    ) : (
                      <div className="bg-neutral-50 border p-3 rounded-xl text-xs flex justify-between items-center">
                        <span className="text-neutral-505 font-bold">Discount Amount</span>
                        <span className="font-extrabold text-red-600 font-mono">-${(editingOrder.discountAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Overview Summary */}
                  {editingOrder.items.length > 0 && (
                    <div className="bg-amber-50/45 border border-amber-900/5 rounded-2xl p-4 space-y-2 text-xs text-neutral-600 shadow-sm">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span className="font-mono font-extrabold text-neutral-850">${subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between font-medium text-red-650">
                          <span>Discount Added</span>
                          <span className="font-mono font-extrabold">-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>VAT ({(vatRate * 100).toFixed(0)}%)</span>
                        <span className="font-mono font-extrabold text-neutral-850">${vatAmount.toFixed(2)}</span>
                      </div>
                      {serviceChg > 0 && (
                        <div className="flex justify-between font-medium">
                          <span>Service Charge</span>
                          <span className="font-mono font-extrabold text-neutral-850">${serviceChg.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-dashed border-neutral-200 pt-2.5 text-xs font-black text-neutral-950 uppercase tracking-wide">
                        <span>Grand Total</span>
                        <span className="font-mono text-amber-950 font-black text-base">
                          ${grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Chef Notes / Table Instruction */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Edit Chef Instructions
                    </label>
                    <textarea 
                      value={editingOrder.customerNotes || ""}
                      onChange={(e) => setEditingOrder({ ...editingOrder, customerNotes: e.target.value })}
                      disabled={isReadOnly}
                      rows={2}
                      placeholder={isReadOnly ? "No instructions entered." : "e.g. Extra hot, milk on the side..."}
                      className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none transition disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                    />
                  </div>

                  {/* Reason for Editing (for Audit Logs) */}
                  {!isReadOnly && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                        Reason for Editing (Required for Audit Trail)
                      </label>
                      <input 
                        type="text"
                        required
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="e.g. Order changed, incorrect item..."
                        className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none transition font-sans font-bold"
                      />
                    </div>
                  )}
                </div>

                {/* Left Pane Action Footer */}
                <div className="pt-4 border-t border-neutral-100 shrink-0 mt-3 md:mt-2 bg-white">
                  {isReadOnly ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => { setPrintingOrder(editingOrder); setReceiptType("customer"); }}
                        className="py-2.5 bg-neutral-150 hover:bg-neutral-205 font-extrabold rounded-xl text-neutral-700 flex items-center justify-center gap-1.5 transition cursor-pointer text-xs uppercase"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Receipt
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingOrder(null)}
                        className="py-2.5 bg-neutral-900 hover:bg-neutral-850 font-extrabold rounded-xl text-white transition cursor-pointer text-xs uppercase"
                      >
                        Close View
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setEditingOrder(null)}
                        className="py-2.5 bg-neutral-100 hover:bg-neutral-200 font-extrabold rounded-xl text-neutral-600 transition cursor-pointer text-xs text-center uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={saveEditedOrder}
                        disabled={editingOrder.items.length === 0}
                        className="py-2.5 bg-amber-950 hover:bg-amber-905 font-extrabold rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer text-xs uppercase"
                      >
                        Save updates
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Dynamic Visual Product Menu Picker */}
              <div className="flex-1 bg-neutral-50 p-4 md:p-5 flex flex-col overflow-hidden min-h-0">
                {isReadOnly ? (
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="shrink-0 mb-4 bg-white border border-neutral-100 p-4 rounded-2xl shadow-2xs">
                      <span className="text-[10px] text-amber-955 font-black uppercase tracking-widest block">Security logs</span>
                      <h3 className="font-extrabold text-sm text-neutral-800 mt-1">Receipt Modification History</h3>
                      <p className="text-[11px] text-neutral-400 leading-normal mt-0.5">Official audit trace recording table, staff, and item changes.</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                      {!editingOrder.auditHistory || editingOrder.auditHistory.length === 0 ? (
                        <div className="bg-white border text-center p-8 rounded-2xl space-y-2.5 my-auto shadow-2xs">
                          <span className="text-3xl block select-none">🛡️</span>
                          <p className="text-xs font-black text-neutral-600 text-center">No edit history recorded</p>
                          <p className="text-[10.5px] text-neutral-400 max-w-xs mx-auto leading-relaxed text-center">
                            This bill reflects its pristine initial placement without pre-payment amendments.
                          </p>
                        </div>
                      ) : (
                        editingOrder.auditHistory.map((log, lidx) => (
                          <div key={lidx} className="bg-white border rounded-2xl p-4 space-y-2 shadow-2xs hover:shadow-xs transition duration-150">
                            <div className="flex justify-between items-start text-[10.5px]">
                              <div>
                                <span className="font-black text-neutral-900 block">{log.editedBy}</span>
                                <span className="text-neutral-400 font-medium block mt-0.5">{log.userRole.toUpperCase()} • {new Date(log.editedAt).toLocaleString()}</span>
                              </div>
                              <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-800 font-black font-mono">
                                ${log.newTotal.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[12px] font-bold text-stone-750 font-sans border-t border-neutral-100 pt-2 leading-relaxed">
                              "{log.reason}"
                            </p>
                            <div className="text-[10px] text-neutral-500 bg-neutral-50 p-2.5 rounded-xl space-y-1">
                              <div>• {log.changesSummary}</div>
                              {log.addedItemsSummary && <div className="text-emerald-700 font-bold">• Added: {log.addedItemsSummary}</div>}
                              {log.removedItemsSummary && <div className="text-red-700 font-medium">• Removed: {log.removedItemsSummary}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                
                {/* Search Bar & Categories Tabs */}
                <div className="shrink-0 space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      type="text"
                      value={editProductSearch}
                      onChange={(e) => setEditProductSearch(e.target.value)}
                      placeholder="Search to add products..."
                      className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 outline-none focus:ring-1 focus:ring-amber-950 focus:border-amber-950 font-bold shadow-xs transition"
                    />
                    {editProductSearch && (
                      <button
                        type="button"
                        onClick={() => setEditProductSearch("")}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Categories Horizontally Scrollable Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setEditCategoryFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-black tracking-wider whitespace-nowrap transition cursor-pointer ${
                        editCategoryFilter === "all" 
                          ? "bg-amber-950 text-white shadow-xs" 
                          : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/50"
                      }`}
                    >
                      ALL ITEMS
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setEditCategoryFilter(cat.id);
                          setEditProductSearch("");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-black tracking-wider whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                          editCategoryFilter === cat.id 
                            ? "bg-amber-950 text-white shadow-xs" 
                            : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/50"
                        }`}
                      >
                        <span>{cat.name.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Grid View */}
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products
                      .filter(p => !p.isArchived && p.available)
                      .filter(p => editProductSearch ? true : (editCategoryFilter === "all" || p.categoryId === editCategoryFilter))
                      .filter(p => {
                        const matchesName = p.name.toLowerCase().includes(editProductSearch.toLowerCase());
                        const cat = categories.find(c => c.id === p.categoryId);
                        const matchesCategoryName = cat ? cat.name.toLowerCase().includes(editProductSearch.toLowerCase()) : false;
                        return matchesName || matchesCategoryName;
                      })
                      .map(p => {
                        const countInEdit = editingOrder.items.find(it => it.productId === p.id)?.quantity || 0;
                        return (
                          <div 
                            key={p.id}
                            onClick={() => addEditProduct(p)}
                            className={`bg-white border text-left rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-amber-900/50 cursor-pointer active:scale-97 transition flex flex-col group relative ${
                              countInEdit > 0 ? "border-amber-950 ring-1 ring-amber-950" : "border-neutral-200/80"
                            }`}
                          >
                            <div className="h-20 bg-neutral-100 relative overflow-hidden shrink-0">
                              <img 
                                src={p.image} 
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400`;
                                }}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDashEdit(p);
                                }}
                                className="absolute bottom-1 left-1 p-1 bg-neutral-900/75 hover:bg-neutral-900 text-white rounded-md backdrop-blur-xs border border-white/10 transition-all cursor-pointer z-10 hover:scale-105 active:scale-95 flex items-center justify-center shadow-xs"
                                title="Edit Product Details"
                              >
                                <Edit className="w-2.5 h-2.5" />
                              </button>
                              <div className="absolute top-1 right-1 flex flex-col gap-1 items-end">
                                {p.isDrink ? (
                                  <span className="px-1.5 py-0.5 bg-white/90 backdrop-blur-xs border border-neutral-100/30 rounded-md text-[8px] font-black text-amber-800 uppercase">
                                    Drink
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-white/90 backdrop-blur-xs border border-neutral-100/30 rounded-md text-[8px] font-black text-emerald-800 uppercase">
                                    Food
                                  </span>
                                )}
                              </div>
                              {countInEdit > 0 && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center animate-fade-in">
                                  <span className="bg-amber-950 text-white font-extrabold text-xs w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white scale-110">
                                    {countInEdit}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                              <h4 className="text-[11px] font-black text-neutral-800 line-clamp-2 leading-tight">
                                {p.name}
                              </h4>
                              <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
                                <span className="text-xs font-black text-neutral-900">${p.price.toFixed(2)}</span>
                                <span className="text-[9px] bg-neutral-100 text-neutral-700 font-extrabold px-1.5 py-0.5 rounded-md group-hover:bg-amber-950 group-hover:text-white transition uppercase">
                                  + Add
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {products
                    .filter(p => !p.isArchived && p.available)
                    .filter(p => editProductSearch ? true : (editCategoryFilter === "all" || p.categoryId === editCategoryFilter))
                    .filter(p => {
                      const matchesName = p.name.toLowerCase().includes(editProductSearch.toLowerCase());
                      const cat = categories.find(c => c.id === p.categoryId);
                      const matchesCategoryName = cat ? cat.name.toLowerCase().includes(editProductSearch.toLowerCase()) : false;
                      return matchesName || matchesCategoryName;
                    }).length === 0 && (
                      <div className="text-center py-10 text-neutral-400 text-xs">
                        No available menu items match the active filters.
                      </div>
                  )}
                </div>
                </>
              )}
              </div>

            </div>

          </div>
        </div>
        );
      })()}

      {/* Post-Save Order Wizard Modal */}
      {postSaveOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-55 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 max-w-md w-full space-y-5 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-450 to-[#E5C158]" />
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-neutral-900 text-base">Receipt Updated Safely!</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                All changes to order <span className="font-extrabold text-neutral-800">{postSaveOrder.orderNumber}</span> have been logged and computed. What would you like to do next?
              </p>
            </div>

            <div className="bg-neutral-50 p-4 rounded-2xl flex flex-col space-y-1.5 text-xs text-neutral-600 text-left">
              <div className="flex justify-between">
                <span>Waiter / Staff</span>
                <span className="font-extrabold text-neutral-800">{postSaveOrder.waiterName || "Counter POS"}</span>
              </div>
              <div className="flex justify-between">
                <span>Table / Seat</span>
                <span className="font-extrabold text-neutral-800">{postSaveOrder.tableName || "Takeaway"}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-250/50 pt-2 font-black text-neutral-900 uppercase">
                <span>New Grand Total</span>
                <span className="text-amber-950 font-bold font-mono">${postSaveOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => {
                  setPrintingOrder(postSaveOrder);
                  setReceiptType("customer");
                }}
                className="w-full py-2.5 bg-amber-950 hover:bg-amber-900 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Updated Bill / Invoice
              </button>
              
              {currentUser?.role !== UserRole.WAITER && currentUser?.role?.toLowerCase() !== "waiter" ? (
                <button 
                  onClick={() => {
                    const orderToSettle = postSaveOrder;
                    setPostSaveOrder(null);
                    handleOpenCheckout(orderToSettle);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer uppercase"
                >
                  <CheckCircle className="w-4 h-4" />
                  Proceed to Settle Payment
                </button>
              ) : (
                <div className="p-2 border border-dashed border-amber-200/50 bg-amber-50 rounded-xl text-[10px] text-amber-900 leading-normal font-medium text-center">
                  ⚠️ Waitstaff Role: Settle Payment locked. Please handover table to Cashier to settle payment.
                </div>
              )}

              <button 
                onClick={() => setPostSaveOrder(null)}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-extrabold rounded-xl transition cursor-pointer uppercase"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-serving Print and Checklist options dialog */}
      {servingOrderWithOptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-5">
            <button 
              onClick={() => setServingOrderWithOptions(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-500 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[9px] text-[#E5C158] font-bold font-mono uppercase tracking-widest block">Luna Cafe Ticket Control</span>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Print Options before Serving</h3>
              <p className="text-[10px] text-stone-400">Order Ref: {servingOrderWithOptions.orderNumber} ({servingOrderWithOptions.tableName})</p>
            </div>

            <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl space-y-3">
              <label className="text-[9px] font-black text-stone-500 uppercase tracking-wider block">Receipt Type Options</label>
              
              <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-stone-200">
                <input 
                  type="checkbox"
                  checked={printKitchenChecked}
                  onChange={(e) => setPrintKitchenChecked(e.target.checked)}
                  className="w-4 h-4 accent-[#E5C158]"
                />
                <span>📄 Kitchen Receipt (Food duplicate)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-stone-200">
                <input 
                  type="checkbox"
                  checked={printBaristaChecked}
                  onChange={(e) => setPrintBaristaChecked(e.target.checked)}
                  className="w-4 h-4 accent-[#E5C158]"
                />
                <span>☕ Barista Receipt (Drink duplicate)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => {
                  if (printKitchenChecked && printBaristaChecked) {
                    setPrintingOrder(servingOrderWithOptions);
                    setReceiptType("kitchen");
                  } else if (printKitchenChecked) {
                    setPrintingOrder(servingOrderWithOptions);
                    setReceiptType("kitchen");
                  } else if (printBaristaChecked) {
                    setPrintingOrder(servingOrderWithOptions);
                    setReceiptType("barista");
                  }
                  serveOrder(servingOrderWithOptions.id);
                  setServingOrderWithOptions(null);
                }}
                className="col-span-2 py-3 bg-[#E5C158] hover:bg-[#D4AF37] text-stone-900 font-extrabold rounded-xl transition shadow-md uppercase tracking-wider text-[10px]"
              >
                Print Selected & Serve
              </button>

              <button 
                onClick={() => {
                  setPrintingOrder(servingOrderWithOptions);
                  setReceiptType("kitchen");
                  serveOrder(servingOrderWithOptions.id);
                  setServingOrderWithOptions(null);
                }}
                className="py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-150 font-bold rounded-xl transition text-[10px] uppercase"
              >
                Print Both
              </button>

              <button 
                onClick={() => {
                  setPrintingOrder(servingOrderWithOptions);
                  setReceiptType("kitchen");
                }}
                className="py-2.5 bg-stone-850 hover:bg-stone-750 text-stone-200 font-bold rounded-xl transition text-[10px] uppercase"
              >
                Print Kitchen
              </button>

              <button 
                onClick={() => {
                  setPrintingOrder(servingOrderWithOptions);
                  setReceiptType("barista");
                }}
                className="py-2.5 bg-stone-850 hover:bg-stone-750 text-stone-200 font-bold rounded-xl transition text-[10px] uppercase"
              >
                Print Barista
              </button>

              <button 
                onClick={() => {
                  serveOrder(servingOrderWithOptions.id);
                  setServingOrderWithOptions(null);
                }}
                className="col-span-2 py-2.5 bg-stone-950 border border-stone-800 hover:bg-stone-850 text-stone-400 font-bold rounded-xl transition text-[10px] uppercase"
              >
                Skip Printing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive print preview popup modal */}
      {printingOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[360px] h-[90vh]">
            <ReceiptView 
              order={printingOrder}
              settings={settings}
              type={receiptType}
              onClose={() => setPrintingOrder(null)}
            />
          </div>
        </div>
      )}

      {/* Quick Edit Product Modal */}
      {dashboardEditingProduct && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white border text-neutral-900 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative animate-in fade-in duration-200">
            <button 
              type="button"
              onClick={() => setDashboardEditingProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-950" />
              <h3 className="font-black text-sm uppercase tracking-wider text-amber-950">Quick Edit Product</h3>
            </div>

            <form onSubmit={handleSaveDashProductEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-[#78350F] text-[10px] uppercase">Product Name</label>
                <input 
                  type="text"
                  required
                  value={dashEditName}
                  onChange={(e) => setDashEditName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-[#78350F] text-[10px] uppercase">Price ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={dashEditPrice}
                    onChange={(e) => setDashEditPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-bold font-mono"
                  />
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                    <input 
                      type="checkbox"
                      checked={dashEditAvailable}
                      onChange={(e) => setDashEditAvailable(e.target.checked)}
                      className="w-4 h-4 text-amber-950 border-neutral-300 rounded focus:ring-amber-950 accent-amber-950"
                    />
                    <span className="font-extrabold text-[#78350F] text-[10px] uppercase">Available</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-[#78350F] text-[10px] uppercase">Category</label>
                  <select
                    value={dashEditCategory}
                    onChange={(e) => setDashEditCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-bold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[#78350F] text-[10px] uppercase">Station</label>
                  <select
                    value={dashEditStation}
                    onChange={(e) => setDashEditStation(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-bold"
                  >
                    <option value="station-kitchen">Kitchen</option>
                    <option value="station-bar">Bar / Barista</option>
                    <option value="station-dessert">Dessert Spot</option>
                    <option value="station-juice">Juice Station</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[#78350F] text-[10px] uppercase">Description</label>
                <textarea 
                  value={dashEditDescription}
                  onChange={(e) => setDashEditDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-bold placeholder:font-normal"
                  placeholder="Describe the main ingredients or station style notes..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setDashboardEditingProduct(null)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 font-extrabold rounded-xl text-neutral-600 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-950 hover:bg-amber-900 font-extrabold rounded-xl text-white transition cursor-pointer text-xs flex items-center justify-center gap-1 uppercase"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Waiter Modal Overlay */}
      {editingWaiterOrder && (
        <div id="edit-waiter-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[60] flex items-center justify-center p-4 hover:cursor-default" onClick={() => setEditingWaiterOrder(null)}>
          <div className="bg-white border border-neutral-200 text-stone-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-5" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setEditingWaiterOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-950 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 border border-amber-250 rounded-2xl flex items-center justify-center text-amber-900">
                <Edit className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[9px] text-amber-800 font-bold font-mono uppercase tracking-widest block">Operational Adjustments</span>
                <h2 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                  Edit waiter
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Order: <span className="font-extrabold text-stone-850">{editingWaiterOrder.orderNumber}</span> • Table: <span className="font-extrabold text-stone-850">{editingWaiterOrder.tableName}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWaiterEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Select New Waiter
                </label>
                <select
                  required
                  value={selectedWaiterName}
                  onChange={(e) => setSelectedWaiterName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold outline-none text-stone-800 focus:ring-1 focus:ring-amber-950"
                >
                  <option value="">-- Choose Waiter --</option>
                  <option value="Counter POS">Counter POS (None)</option>
                  {users
                    .filter(u => u.role === UserRole.WAITER && u.isActive)
                    .map(w => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWaiterOrder(null)}
                  className="flex-1 bg-stone-105 hover:bg-stone-200 text-stone-700 text-xs font-black py-2.5 rounded-xl transition cursor-pointer border border-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black py-2.5 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};// WAITER POS ACCESS PERMISSIONS

const ROLE_PERMISSIONS = {
  waiter: {
    canAccessPOS: true,
    canCreatePOSOrder: true,
    canAccessOrderQueue: true,
    canAccessMenuSelection: true,

    canMarkPaid: false,
    canSettleBill: false,
    canCheckoutBill: false,
    canProcessPayment: false,
    canAccessAdmin: false,
    canAccessCustomerQR: false,
  },

  cashier: {
    canAccessPOS: true,
    canCreatePOSOrder: true,
    canAccessOrderQueue: true,
    canAccessMenuSelection: true,

    canMarkPaid: true,
    canSettleBill: true,
    canCheckoutBill: true,
    canProcessPayment: true,
    canAccessAdmin: false,
    canAccessCustomerQR: false,
  },

  admin: {
    canAccessPOS: true,
    canCreatePOSOrder: true,
    canAccessOrderQueue: true,
    canAccessMenuSelection: true,

    canMarkPaid: true,
    canSettleBill: true,
    canCheckoutBill: true,
    canProcessPayment: true,
    canAccessAdmin: true,
    canAccessCustomerQR: true,
  },
};

function showPage(page: string) {
  console.log("Navigating to module page:", page);
}

function getPermissions(user) {
  return ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.waiter;
}

function can(user, permission) {
  return getPermissions(user)[permission] === true;
}

// WAITER MENU ACCESS
function getVisibleMenuItems(user) {
  const menu = [];

  if (can(user, "canAccessPOS")) menu.push("POS");
  if (can(user, "canCreatePOSOrder")) menu.push("Create POS Order");
  if (can(user, "canAccessOrderQueue")) menu.push("Order Queue");
  if (can(user, "canAccessMenuSelection")) menu.push("Menu Selection");

  if (can(user, "canMarkPaid")) menu.push("Payments");
  if (can(user, "canAccessAdmin")) menu.push("Admin Management");
  if (can(user, "canAccessCustomerQR")) menu.push("Customer Self-Order QR");

  return menu;
}

// PROTECT POS PAGES
function openPOSPage(user) {
  if (!can(user, "canAccessPOS")) {
    alert("Access denied.");
    return;
  }

  showPage("POS");
}

function openCreatePOSOrder(user) {
  if (!can(user, "canCreatePOSOrder")) {
    alert("Access denied.");
    return;
  }

  showPage("Create POS Order");
}

function openOrderQueue(user) {
  if (!can(user, "canAccessOrderQueue")) {
    alert("Access denied.");
    return;
  }

  showPage("Order Queue");
}

function openMenuSelection(user) {
  if (!can(user, "canAccessMenuSelection")) {
    alert("Access denied.");
    return;
  }

  showPage("Menu Selection");
}

// WAITER IN-LINE ACCESS CONTROL BUTTON COMPONENT
interface WaiterProtectedButtonProps {
  role: string | UserRole;
  feature: "create_order" | "mark_paid" | "delete_order";
  onClick?: () => void;
  children: React.ReactNode;
}

export const WaiterProtectedButton: React.FC<WaiterProtectedButtonProps> = ({
  role,
  feature,
  onClick,
  children
}) => {
  const isWaiter = String(role).toLowerCase() === "waiter";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWaiter && (feature === "mark_paid" || feature === "delete_order")) {
      const act = feature === "mark_paid" ? "settle payment or mark orders as paid" : "delete orders";
      alert(`Waiters are not allowed to ${act}.`);
      return;
    }
    if (onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-900 border border-amber-850 rounded-lg hover:bg-amber-850 hover:text-white transition active:scale-95 text-amber-300"
    >
      {children}
    </button>
  );
}
