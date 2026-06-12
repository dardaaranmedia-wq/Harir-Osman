import React, { useState, useEffect } from "react";
import { usePOS } from "../store/posStore";
import { OrderItem, OrderStatus, Product } from "../types";
import { 
  ShoppingBag, Check, ArrowLeft, Search, Plus, Minus, 
  Trash2, MessageSquare, Clock, ShieldCheck, Soup, Coffee, ChevronRight, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LunaLogo } from "./LunaLogo";

interface CustomerOrderViewProps {
  tableIdParam: string;
}

export const CustomerOrderView: React.FC<CustomerOrderViewProps> = ({ tableIdParam }) => {
  const { 
    categories, products, tables, orders, createOrder, settings 
  } = usePOS();

  // Find corresponding table info
  const table = tables.find(t => t.tableId === tableIdParam || t.id === tableIdParam.replace("LUNA-T", ""));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState<{ [productId: string]: string }>({});
  const [generalComment, setGeneralComment] = useState("");
  const [activeTab, setActiveTab] = useState<"menu" | "cart" | "status">("menu");
  
  // Track submitted order in current session
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(() => {
    return localStorage.getItem(`submitted_order_id_table_${tableIdParam}`) || null;
  });

  const submittedOrder = orders.find(o => o.id === submittedOrderId);

  // If table gets cleared/paid, reset customer status tracking
  useEffect(() => {
    if (submittedOrderId && submittedOrder && submittedOrder.status === OrderStatus.PAID) {
      localStorage.removeItem(`submitted_order_id_table_${tableIdParam}`);
      setSubmittedOrderId(null);
      setCart([]);
      setActiveTab("menu");
    }
  }, [orders, submittedOrderId, submittedOrder, tableIdParam]);

  // Keep track of total items
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatRate = settings.vatPercentage / 100;
  const vatAmount = cartSubtotal * vatRate;
  const cartTotal = cartSubtotal + vatAmount;

  const handleAddToCart = (product: Product) => {
    if (!product.available) return;
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          isDrink: product.isDrink,
          notes: notes[product.id] || ""
        }];
      }
    });
  };

  const updateQty = (prodId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === prodId) {
        const next = item.quantity + delta;
        return next > 0 ? { ...item, quantity: next } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleProductNoteChange = (prodId: string, noteText: string) => {
    setNotes(prev => ({ ...prev, [prodId]: noteText }));
    setCart(prev => prev.map(item => 
      item.productId === prodId ? { ...item, notes: noteText } : item
    ));
  };

  const handleSubmit = () => {
    if (cart.length === 0) return;
    
    // Submit order as PENDING_QR status
    const newOrder = createOrder(
      table?.tableId || tableIdParam, 
      cart, 
      generalComment, 
      "Customer self-order", 
      true // Is QR Code Order
    );

    setSubmittedOrderId(newOrder.id);
    localStorage.setItem(`submitted_order_id_table_${tableIdParam}`, newOrder.id);
    setActiveTab("status");
  };

  const filteredProducts = products.filter(p => !p.isArchived).filter(product => {
    const matchCat = selectedCategory === "all" || product.categoryId === selectedCategory;
    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div id="customer-ordering-stage" className="min-h-screen bg-stone-50 text-neutral-900 pb-20 flex flex-col font-sans max-w-md mx-auto shadow-xl relative border-x border-neutral-200">
      
      {/* Table Welcome Header */}
      <header className="sticky top-0 z-30 bg-amber-950 text-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-950 flex items-center justify-center border border-amber-900/40">
            <LunaLogo className="w-6 h-6 text-[#E5C158]" />
          </div>
          <div>
            <span className="text-[9px] font-mono tracking-widest font-black uppercase text-amber-400 block leading-none mb-0.5">
              Luna Café Table Service
            </span>
            <h1 className="text-base font-black uppercase text-white tracking-wide">
              {table ? table.name : `Table Custom`}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {submittedOrderId && (
            <button 
              onClick={() => setActiveTab("status")}
              className={`text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition ${
                activeTab === "status" ? "bg-amber-400 text-black" : "bg-neutral-800 text-amber-200 hover:bg-neutral-700"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Track Order
            </button>
          )}
        </div>
      </header>

      {/* Main Container Views Container */}
      <main className="flex-1 p-4">
        {activeTab === "status" && submittedOrder ? (
          /* Live Status Tracker */
          <div className="space-y-6 pt-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-neutral-800">Your order is preparing</h3>
                <p className="text-xs text-neutral-500 mt-1">Order Ref: {submittedOrder.orderNumber}</p>
              </div>
            </div>

            {/* Timeline track progress */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 space-y-6">
              <h4 className="text-xs uppercase tracking-widest font-extrabold text-neutral-400">Preparation Steps</h4>
              
              <div className="relative pl-6 border-l-2 border-amber-600/20 space-y-6">
                {/* Step 1 */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${
                    submittedOrder.status === OrderStatus.PENDING_QR 
                      ? "bg-amber-500 animate-ping-slow" : "bg-emerald-500"
                  }`}>
                    {submittedOrder.status !== OrderStatus.PENDING_QR ? <Check className="w-2.5 h-2.5" /> : ""}
                  </span>
                  <div>
                    <h5 className="font-bold text-sm">Order Sent</h5>
                    <p className="text-xs text-neutral-500 leading-normal">
                      Received and awaiting cashier confirmation at counter.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${
                    submittedOrder.status === OrderStatus.NEW 
                      ? "bg-blue-500 font-bold" 
                      : (submittedOrder.status === OrderStatus.SERVED || submittedOrder.status === OrderStatus.PAID) 
                        ? "bg-emerald-500" : "bg-neutral-300"
                  }`}>
                    { (submittedOrder.status === OrderStatus.SERVED || submittedOrder.status === OrderStatus.PAID) ? <Check className="w-2.5 h-2.5" /> : ""}
                  </span>
                  <div>
                    <h5 className={`font-bold text-sm ${submittedOrder.status === OrderStatus.NEW ? "text-blue-600" : "text-neutral-700"}`}>
                      Preparing in Kitchen
                    </h5>
                    <p className="text-xs text-neutral-500 leading-normal">
                      Chef & Barista actively crafting your food/beverage selections.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white ${
                    submittedOrder.status === OrderStatus.SERVED 
                      ? "bg-emerald-500 font-bold" : "bg-neutral-300"
                  }`}>
                    {submittedOrder.status === OrderStatus.SERVED ? "●" : ""}
                  </span>
                  <div>
                    <h5 className={`font-bold text-sm ${submittedOrder.status === OrderStatus.SERVED ? "text-emerald-600" : "text-neutral-700"}`}>
                      Served to Table
                    </h5>
                    <p className="text-xs text-neutral-500 leading-normal">
                      Food delivered to your seat. Enjoy your meal!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Need to add items? Go back to menu and submit another order. Our cashiers will bundle them automatically under <b>{table ? table.name : "Table"}</b>.
              </p>
            </div>

            <button 
              onClick={() => setActiveTab("menu")}
              className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white font-bold py-3.5 rounded-xl hover:bg-neutral-800 transition shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Menu
            </button>
          </div>
        ) : activeTab === "cart" ? (
          /* Shopping Cart Detail View */
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={() => setActiveTab("menu")}
                className="p-1 px-2 hover:bg-neutral-100 rounded-lg flex items-center gap-1 text-sm font-semibold text-neutral-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Menu
              </button>
              <h2 className="text-lg font-black text-neutral-800 ml-auto">Cart Overview</h2>
            </div>

            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-white rounded-2xl border border-neutral-100 p-6">
                <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
                <div>
                  <p className="font-bold text-neutral-600">Your basket is empty</p>
                  <p className="text-xs text-neutral-400 mt-1">Select delicios specialties to purchase</p>
                </div>
                <button 
                  onClick={() => setActiveTab("menu")}
                  className="bg-amber-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-amber-800 transition"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-neutral-800">{item.name}</h4>
                          <span className="text-xs text-neutral-500 font-bold">${item.price.toFixed(2)} each</span>
                        </div>
                        <span className="text-sm font-extrabold text-neutral-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>

                      {/* Customize Item notes */}
                      <div className="flex items-center gap-2 text-neutral-400 focus-within:text-amber-800">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <input 
                          type="text"
                          placeholder="Note: no onions, extra hot, less sugar..."
                          value={item.notes || ""}
                          onChange={(e) => handleProductNoteChange(item.productId, e.target.value)}
                          className="w-full text-xs bg-neutral-50 hover:bg-neutral-100/50 p-2 py-1.5 focus:bg-white rounded-lg border-0 outline-none text-neutral-700 font-medium"
                        />
                      </div>

                      <div className="flex items-center justify-between border-t border-neutral-50 pt-2 text-xs">
                        <button 
                          onClick={() => updateQty(item.productId, -99)}
                          className="text-red-500 hover:bg-red-50 p-1 px-2 rounded-lg font-bold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQty(item.productId, -1)}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 active:scale-95 rounded-full flex items-center justify-center font-bold text-neutral-800 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-sm text-neutral-800 w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQty(item.productId, 1)}
                            className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 active:scale-95 rounded-full flex items-center justify-center font-bold text-neutral-800 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submitting General Comments */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Add Order Notes</h4>
                  <textarea 
                    rows={2}
                    placeholder="E.g., Please serve drinks first, or table requirements..."
                    value={generalComment}
                    onChange={(e) => setGeneralComment(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-100 focus:border-amber-900 rounded-lg outline-none bg-neutral-50 focus:bg-white transition"
                  />
                </div>

                {/* Bill Card summary */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 space-y-2 text-xs font-medium text-neutral-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-neutral-805">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({settings.vatPercentage}%)</span>
                    <span className="font-bold text-neutral-805">${vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-neutral-900 border-t border-neutral-100 pt-2">
                    <span>Estimated Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit action */}
                <button 
                  onClick={handleSubmit}
                  className="w-full bg-amber-950 text-white font-bold py-4 rounded-xl hover:bg-amber-900 transition shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Place Order Awaiting Confirmation
                </button>
              </>
            )}
          </div>
        ) : (
          /* Menu Browser view */
          <div className="space-y-4">
            
            {/* Search items bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, coffee or smoothies..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-150 rounded-xl text-sm placeholder-neutral-400 shadow-sm focus:border-amber-950 outline-none transition"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
              <button 
                onClick={() => setSelectedCategory("all")}
                className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCategory === "all" 
                    ? "bg-amber-950 text-white" 
                    : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                }`}
              >
                All Menu
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCategory === cat.id 
                      ? "bg-amber-950 text-white" 
                      : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu items list */}
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProducts.map((p) => {
                const inCart = cart.find(it => it.productId === p.id);
                return (
                  <div 
                    key={p.id}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-neutral-100 flex flex-col hover:shadow transition relative"
                  >
                    <div className="h-28 w-full bg-neutral-200 relative overflow-hidden">
                      <img 
                        src={p.image} 
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400`;
                        }}
                      />
                      {!p.available && (
                        <div className="absolute inset-0 bg-neutral-900/70 flex items-center justify-center backdrop-blur-xs">
                          <span className="text-[10px] text-white bg-red-600 font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                            Sold Out
                          </span>
                        </div>
                      )}
                      
                      {/* Alcohol/Coffee Tags icons */}
                      <span className="absolute bottom-1.5 right-1.5 p-1 bg-white/90 backdrop-blur-xs rounded-full shadow text-[10px]">
                        {p.isDrink ? <Coffee className="w-3.5 h-3.5 text-amber-700" /> : <Soup className="w-3.5 h-3.5 text-emerald-600" />}
                      </span>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-neutral-800 line-clamp-2 min-h-[32px] leading-tight-custom">
                          {p.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-50">
                        <span className="font-black text-xs text-neutral-900">${p.price.toFixed(2)}</span>
                        
                        {p.available ? (
                          <button 
                            onClick={() => handleAddToCart(p)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-95 ${
                              inCart 
                                ? "bg-amber-950 text-white" 
                                : "bg-amber-100 text-amber-950 hover:bg-amber-200"
                            }`}
                          >
                            {inCart ? (
                              <span className="text-[10px] font-black">{inCart.quantity}</span>
                            ) : (
                              <Plus className="w-3.5 h-3.5 font-bold" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-semibold italic">Sold out</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Floating Customer Checkout Bar */}
      <AnimatePresence>
        {cartCount > 0 && activeTab === "menu" && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 max-w-[416px] mx-auto z-40"
          >
            <button 
              onClick={() => setActiveTab("cart")}
              className="w-full bg-amber-950 text-white font-bold p-4 py-3.5 rounded-xl shadow-lg hover:bg-amber-900 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span className="bg-amber-500 text-black text-xs font-black w-5.5 h-5.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
                <span className="text-sm">View order tray</span>
              </div>
              <div className="flex items-center gap-1 font-extrabold">
                <span className="text-xs text-amber-200 opacity-80">(+{settings.vatPercentage}% VAT)</span>
                <span className="text-sm">${cartTotal.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
