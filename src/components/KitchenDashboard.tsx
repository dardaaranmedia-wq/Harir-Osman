import React, { useState, useEffect } from "react";
import { usePOS } from "../store/posStore";
import { Order, OrderItem, OrderStatus, UserRole } from "../types";
import { Flame, Coffee, Check, Clock, Bell, RefreshCw, Layers } from "lucide-react";

export const KitchenDashboard: React.FC = () => {
  const { currentUser, orders, serveOrder, triggerChime } = usePOS();
  
  // Track item checkmarks locally so chefs don't lose progress on reload
  const [completedItems, setCompletedItems] = useState<{ [key: string]: boolean }>({});
  const [activeSeconds, setActiveSeconds] = useState<number>(0);

  // Core filter based on staff role
  const isChef = currentUser?.role === UserRole.KITCHEN;
  const isBarista = currentUser?.role === UserRole.BARISTA;

  // Track simple chronometer second timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter confirmed orders that are under preparation
  const activeOrders = orders.filter(o => o.status === OrderStatus.NEW);

  // Play audio alarm on receiving new active tickets
  useEffect(() => {
    if (activeOrders.length > 0) {
      const lastOrder = activeOrders[0];
      const timeDiff = Date.now() - new Date(lastOrder.createdAt).getTime();
      if (timeDiff < 5000) {
        if (isChef && lastOrder.items.some(i => !i.isDrink)) {
          triggerChime("kitchen");
        } else if (isBarista && lastOrder.items.some(i => i.isDrink)) {
          triggerChime("barista");
        }
      }
    }
  }, [activeOrders.length, isChef, isBarista, triggerChime]);

  const toggleItemCheck = (orderId: string, productId: string) => {
    const key = `${orderId}-${productId}`;
    setCompletedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getFormatElapsed = (isoStr: string) => {
    const created = new Date(isoStr).getTime();
    const diff = Math.max(0, Math.floor((Date.now() - created) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-stone-900 text-white flex flex-col font-sans select-none overflow-hidden h-screen">
      
      {/* Station Sub Header */}
      <header className="bg-stone-950 px-6 py-4 border-b border-stone-850 shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            isChef ? "bg-orange-950 border-orange-900 text-orange-400" : 
            isBarista ? "bg-amber-950 border-amber-900 text-amber-400" : "bg-purple-950 border-purple-900 text-purple-400"
          }`}>
            {isChef ? <Flame className="w-6 h-6" /> : isBarista ? <Coffee className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              {isChef ? "Kitchen Cooking Queue" : isBarista ? "Barista Brew Station" : "Unified Kitchen Monitors"}
              <span className="bg-red-650 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse bg-red-600">
                {activeOrders.length} TICKETS
              </span>
            </h1>
            <p className="text-[10px] text-stone-400 font-bold uppercase mt-0.5">
              Active Session: <span className="text-amber-400 font-black">{currentUser?.name || "Kitchen Crew"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-stone-900 border border-stone-800 text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE STATION CONNECTED
          </div>
        </div>
      </header>

      {/* Main Ticket workspace */}
      <div className="flex-1 overflow-x-auto p-6 bg-stone-900 flex gap-6 items-start h-full">
        {activeOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 max-w-sm mx-auto h-[60vh] space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-950 flex items-center justify-center border border-stone-800 animate-pulse">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-neutral-200 text-sm">All clear!</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                There are currently no dishes or drinks waiting in the preparation pipeline. Take a break!
              </p>
            </div>
          </div>
        ) : (
          activeOrders.map((order) => {
            // Filter products displayed based on cooks or baristas
            const targetItems = order.items.filter(item => {
              if (isChef) return !item.isDrink;
              if (isBarista) return item.isDrink;
              return true; // manager sees all
            });

            if (targetItems.length === 0) return null;

            // Calculate progress bars completeness
            const checkedCount = targetItems.filter(it => completedItems[`${order.id}-${it.productId}`]).length;
            const isTicketComplete = checkedCount === targetItems.length;

            return (
              <div 
                key={order.id}
                className={`w-[290px] shrink-0 bg-stone-950 border rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl min-h-[380px] hover:-translate-y-1 transition duration-200 ${
                  isTicketComplete ? "border-emerald-500 animate-pulse-slow" : "border-stone-800"
                }`}
              >
                {/* Ticket Header meta */}
                <div className={`p-4 flex items-center justify-between border-b ${
                  isTicketComplete ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" : "bg-stone-900/60 border-stone-800"
                }`}>
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-1.5 leading-none">
                      {order.tableName}
                      <span className="text-[10px] text-stone-400 font-mono">({order.orderNumber})</span>
                    </h3>
                    <span className="text-[9px] text-stone-500 font-bold mt-1 block">WAIT: {order.waiterName || "Staff"}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 p-1.5 rounded-lg border border-amber-900/10">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getFormatElapsed(order.createdAt)}</span>
                  </div>
                </div>

                {/* Checklist body items */}
                <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
                  
                  {targetItems.map((item) => {
                    const isChecked = completedItems[`${order.id}-${item.productId}`];
                    return (
                      <div 
                        key={item.productId}
                        onClick={() => toggleItemCheck(order.id, item.productId)}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition active:scale-98 relative overflow-hidden select-none ${
                          isChecked 
                            ? "bg-emerald-950/20 border-emerald-900 text-neutral-300 line-through decoration-emerald-500/35" 
                            : "bg-stone-900 border-stone-850 hover:bg-stone-850"
                        }`}
                      >
                        {/* Selector check indicator */}
                        <div className={`w-4.5 h-4.5 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                          isChecked ? "bg-emerald-500 border-emerald-500 text-black" : "border-stone-700 bg-stone-950"
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="text-xs font-bold flex justify-between pr-1">
                            <span className="break-words max-w-[150px]">{item.name}</span>
                            <span className="font-extrabold text-amber-400 text-sm">{item.quantity}x</span>
                          </div>
                          {item.notes && (
                            <div className="text-[10px] py-1 px-1.5 rounded text-amber-500 bg-amber-950/40 border border-amber-900/10 leading-snug break-words">
                              * {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* General order comments */}
                  {order.customerNotes && (
                    <div className="border-t border-stone-900 pt-3 text-[10px] text-stone-400 italic">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-stone-500 block mb-1">General Notes:</span>
                      "{order.customerNotes}"
                    </div>
                  )}

                </div>

                {/* Completion dispatch footer */}
                <div className="p-4 border-t border-stone-900 bg-stone-950/60 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-400">
                    <span>Task Completion</span>
                    <span>{checkedCount}/{targetItems.length} Products</span>
                  </div>

                  {/* Total completion timeline track */}
                  <div className="h-1 bg-stone-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(checkedCount / targetItems.length) * 100}%` }}
                    />
                  </div>

                  <button 
                    onClick={() => serveOrder(order.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase transition mt-2 active:scale-95 flex items-center justify-center gap-1.5 ${
                      isTicketComplete 
                        ? "bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer shadow-lg" 
                        : "bg-stone-900 hover:bg-stone-850 text-stone-400 cursor-pointer"
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-300" />
                    Complete & Deliver
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
