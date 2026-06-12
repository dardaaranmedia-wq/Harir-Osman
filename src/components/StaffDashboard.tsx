import React, { useState } from "react";
import { usePOS } from "../store/posStore";
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
    theme, setTheme, updateOrderWaiter, updateOrderWithAuditTrail
  } = usePOS();

  // Screen modes: "order" (Create Order) or "queue" (Order Queue manager)
  const [activeScreen, setActiveScreen] = useState<"order" | "queue">(() => 
    currentUser?.role === "Waiter" ? "queue" : "order"
  );
  
  // Dashboard Order Queue Tab (1 = New, 2 = Served, 3 = Paid, 4 = QR Pending)
  const [queueTab, setQueueTab] = useState<OrderStatus | "Pending">((currentUser?.role === "Waiter") ? OrderStatus.NEW : "Pending");

  // Selection states inside "Create Order" mode
  const [selectedTable, setSelectedTable] = useState<string>("LUNA-T01");
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
      currentUser?.name || "Staff",
      false // Directly confirmed
    );

    // Reset Tray
    setTrayItems([]);
    setTrayNotes({});
    setGeneralTrayComment("");
    
    // Switch to queue
    setActiveScreen("queue");
    setQueueTab(OrderStatus.NEW);
  };

  // Filter orders by active queue tab selection
  const filteredOrders = orders.filter(o => {
    // Tab 4 is Customer self order Pending QR
    if (queueTab === "Pending") {
      return o.status === OrderStatus.PENDING_QR;
    }
    return o.status === queueTab;
  });

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState<{ [id: string]: string }>({});

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
  };

  const updateEditQty = (prodId: string, delta: number) => {
    if (!editingOrder) return;
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

  const saveEditedOrder = () => {
    if (!editingOrder) return;
    
    // Update local context with detailed auditing trace
    updateOrderWithAuditTrail(
      editingOrder.id,
      editingOrder.items,
      currentUser?.name || "Staff Cashier",
      currentUser?.role || "Cashier",
      0, // discount
      0, // service charge
      editReason ? editReason.trim() : "Items/Quantities adjusted prior approval",
      editingOrder.customerNotes
    );
    
    setEditingOrder(null);
    setEditReason("");
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
        {currentUser?.role !== "Waiter" ? (
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
        ) : (
          <div className="bg-amber-900/40 p-1 rounded-xl border border-amber-800/50 px-4 py-2 text-amber-300 font-extrabold uppercase text-[10px] tracking-widest">
            Waiter Portal
          </div>
        )}

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
                      o.orderNumber?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.tableName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.tableId?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.waiterName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      (o.customerNotes && o.customerNotes.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
                      o.items.some(item => item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                    ).length})
                  </h3>
                </div>

                {orders.filter(o => 
                  o.orderNumber?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  o.tableName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  o.tableId?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  o.waiterName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                  (o.customerNotes && o.customerNotes.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
                  o.items.some(item => item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                ).length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center text-stone-400 space-y-3">
                    <p className="text-xs">No registered orders match your current lookup criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {orders.filter(o => 
                      o.orderNumber?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.tableName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.tableId?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      o.waiterName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                      (o.customerNotes && o.customerNotes.toLowerCase().includes(globalSearchQuery.toLowerCase())) ||
                      o.items.some(item => item.name.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                    ).map((order) => (
                      <div key={order.id} className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                          order.status === OrderStatus.PENDING_QR ? "bg-amber-500" :
                          order.status === OrderStatus.NEW ? "bg-blue-500" :
                          order.status === OrderStatus.SERVED ? "bg-emerald-500" : "bg-neutral-400"
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
                            <span className="text-[10px] text-stone-400 font-medium block mt-0.5">
                              Server: {order.waiterName || "Counter POS"}
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
              
              {/* Header: Table select */}
              <div className="p-4 border-b border-neutral-150 space-y-3 bg-neutral-50/55">
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-black text-neutral-500">
                    Assign Restaurant Table
                  </h3>
                </div>

                <div className="flex gap-2">
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
                    {orders.filter(o => o.status === OrderStatus.PENDING_QR).length}
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
                    {orders.filter(o => o.status === OrderStatus.NEW).length}
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
                    {orders.filter(o => o.status === OrderStatus.SERVED).length}
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
                    {orders.filter(o => o.status === OrderStatus.PAID).length}
                  </span>
                </button>

              </div>
              
              <div className="text-[10px] text-neutral-400 font-bold uppercase invisible md:visible">
                Tracking {filteredOrders.length} records
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
                        order.status === OrderStatus.SERVED ? "bg-emerald-500" : "bg-neutral-400"
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
                                    {item.isDrink ? (
                                      <span className="bg-amber-100 text-[9px] text-amber-800 font-black px-1 rounded">D</span>
                                    ) : (
                                      <span className="bg-emerald-100 text-[9px] text-emerald-800 font-black px-1 rounded">F</span>
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
                        )}

                        {order.status === OrderStatus.SERVED && (
                          /* Print invoice & Cashed out actions */
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              {/* Open customer printer modal directly */}
                              <button 
                                onClick={() => { setPrintingOrder(order); setReceiptType("customer"); }}
                                className="flex-1 bg-white hover:bg-neutral-50 border border-neutral-250 text-neutral-700 text-[11px] font-black py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                View & Print Bill Info
                              </button>
                            </div>
                            
                            {/* Payout channels via Settle and Checkout modal */}
                            <button 
                              onClick={() => handleOpenCheckout(order)}
                              className="w-full bg-[#E5C158] hover:bg-[#D4AF37] text-stone-950 text-[11px] font-black py-3 rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Settle & Checkout Bill
                            </button>
                          </div>
                        )}

                        {order.status === OrderStatus.PAID && (
                          /* History details display */
                          <div className="text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded-lg space-y-0.5">
                            <div>Checked out by Cashier: <b className="text-neutral-800">{order.cashierName || "Siti"}</b></div>
                            <div>Paid Category: <b className="text-neutral-800">{order.paymentMethod || "Cash"}</b></div>
                            <div>Checkout Time: <b className="text-neutral-800">{new Date(order.updatedAt).toLocaleTimeString()}</b></div>
                            <button 
                              onClick={() => { setPrintingOrder(order); setReceiptType("customer"); }}
                              className="w-full text-blue-600 hover:underline hover:bg-blue-50/50 block py-1.5 mt-2 rounded font-extrabold text-center uppercase border border-blue-100"
                            >
                              Reprint customer bill
                            </button>
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

      {/* Editing dialog modal (For cashiers to customize Pending QR Orders prior approval) */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <button 
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-black text-neutral-900">Edit QR Self-Order</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Table: {editingOrder.tableName}. Ref: {editingOrder.orderNumber}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 p-1">
              {editingOrder.items.map((it, index) => (
                <div key={index} className="bg-neutral-50 p-3 rounded-xl flex items-center justify-between border border-neutral-200/50">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-neutral-800">{it.name}</h4>
                    <span className="text-[11px] text-neutral-500 font-bold">${it.price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateEditQty(it.productId, -1)}
                      className="w-6 h-6 rounded-full bg-white hover:bg-neutral-100 border border-neutral-300 flex items-center justify-center font-bold text-neutral-800"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-xs font-black w-4 text-center">{it.quantity}</span>
                    <button 
                      onClick={() => updateEditQty(it.productId, 1)}
                      className="w-6 h-6 rounded-full bg-white hover:bg-neutral-100 border border-neutral-300 flex items-center justify-center font-bold text-neutral-800"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => updateEditQty(it.productId, -it.quantity)}
                      className="p-1 px-1.5 rounded-md hover:bg-red-50 text-red-500 transition-all font-bold text-[10px] flex items-center gap-0.5 ml-1"
                      title="Remove from order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Edit Chef Instructions
              </label>
              <textarea 
                value={editingOrder.customerNotes || ""}
                onChange={(e) => setEditingOrder({ ...editingOrder, customerNotes: e.target.value })}
                rows={2}
                placeholder="Adjust general customer comments..."
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-150 focus:border-amber-950 focus:bg-white rounded-xl outline-none"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Reason for Editing (for Audit Trail log)
              </label>
              <input 
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Guest changed mind, incorrect qty..."
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-150 focus:border-amber-950 focus:bg-white rounded-xl outline-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={() => setEditingOrder(null)}
                className="py-3 bg-neutral-100 font-bold rounded-xl text-neutral-600 hover:bg-neutral-250 transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveEditedOrder}
                className="py-3 bg-amber-950 font-bold rounded-xl text-white hover:bg-amber-900 transition flex items-center justify-center gap-1.5"
              >
                Save updates
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

    </div>
  );
};
