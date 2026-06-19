import React, { useState, useEffect } from "react";
import { Order, OrderStatus, Table } from "../types";
import { 
  X, Search, Plus, Trash2, FileText, CheckCircle, AlertTriangle, GitMerge, ListFilter
} from "lucide-react";

interface CombineBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  tables: Table[];
  onCombine: (orderIds: string[], targetTableId: string) => void;
}

export const CombineBillsModal: React.FC<CombineBillsModalProps> = ({
  isOpen,
  onClose,
  orders,
  tables,
  onCombine,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [targetTableId, setTargetTableId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  // Active/unpaid orders that can be combined
  const eligibleOrders = orders.filter(o => 
    o.status !== OrderStatus.PAID && 
    o.status !== OrderStatus.CANCELLED && 
    o.status !== OrderStatus.COMBINED
  );

  // Auto-set target table to the first selected order's table
  useEffect(() => {
    if (selectedOrders.length > 0 && !targetTableId) {
      setTargetTableId(selectedOrders[0].tableId);
    }
  }, [selectedOrders, targetTableId]);

  if (!isOpen) return null;

  // Add order by ID/number helper
  const addOrderToSelection = (order: Order) => {
    if (selectedOrders.some(so => so.id === order.id)) {
      setError(`Order ${order.orderNumber} is already selected.`);
      return;
    }
    setSelectedOrders(prev => [...prev, order]);
    setSearchInput("");
    setError(null);
  };

  const handleManualSearchAdd = () => {
    setError(null);
    if (!searchInput.trim()) return;

    // Split input by comma or space to allow bulk adding (e.g. "LN-1001, LN-1002")
    const searchTokens = searchInput
      .split(/[,\s]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);

    let addedCount = 0;
    const errors: string[] = [];

    searchTokens.forEach(token => {
      // Find matching eligible order
      const found = eligibleOrders.find(o => {
        const orderNoNorm = o.orderNumber.toUpperCase().replace("#", "");
        const tokenNorm = token.replace("#", "");
        return o.id === token || orderNoNorm === tokenNorm || orderNoNorm.includes(tokenNorm);
      });

      if (found) {
        if (selectedOrders.some(so => so.id === found.id)) {
          errors.push(`${found.orderNumber} is already selected.`);
        } else {
          selectedOrders.push(found);
          addedCount++;
        }
      } else {
        errors.push(`Unpaid order "${token}" was not found.`);
      }
    });

    if (addedCount > 0) {
      setSelectedOrders([...selectedOrders]);
      setSearchInput("");
    }
    if (errors.length > 0) {
      setError(errors.join(" "));
    }
  };

  const removeOrderFromSelection = (orderId: string) => {
    setSelectedOrders(prev => prev.filter(so => so.id !== orderId));
    if (selectedOrders.length <= 1) {
      setTargetTableId("");
    }
  };

  // Compute combined elements
  const computedCombinedItems = selectedOrders.flatMap(o => 
    o.items.map(it => ({
      ...it,
      originalOrderNo: o.orderNumber,
      waiterName: o.waiterName || "Unknown",
      tableName: o.tableName,
    }))
  );

  const combinedSubtotal = computedCombinedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatRate = orders[0]?.vatRate ?? 0.05;
  const vatAmount = parseFloat((combinedSubtotal * vatRate).toFixed(2));
  const combinedTotal = parseFloat((combinedSubtotal + vatAmount).toFixed(2));

  const handleCombineClick = () => {
    if (selectedOrders.length < 2) {
      setError("Please select at least 2 bills to combine.");
      return;
    }
    if (!targetTableId) {
      setError("Please select a target table for the combined bill.");
      return;
    }
    setShowConfirmStep(true);
  };

  const confirmAndSubmit = () => {
    const orderIds = selectedOrders.map(o => o.id);
    onCombine(orderIds, targetTableId);
    
    // Reset state and close
    setSelectedOrders([]);
    setTargetTableId("");
    setSearchInput("");
    setError(null);
    setShowConfirmStep(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-purple-600/30 p-2 rounded-xl text-purple-400">
              <GitMerge className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight uppercase">Cashier Billing Engine</h3>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Combine Multiple Bills</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Outer content container */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* Left Hand: Selection and Lookup */}
          <div className="flex-1 flex flex-col space-y-4">
            
            {/* Form Box */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500">
                Search & Add Bills (Order ID or Number)
              </label>
              
              <div className="relative flex gap-2">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="E.g., LN-1001, LN-1002"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearchAdd()}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-white text-neutral-800 font-bold border border-neutral-300 outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 placeholder:text-neutral-400"
                />
                <button
                  type="button"
                  onClick={handleManualSearchAdd}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-95 shrink-0"
                >
                  ADD
                </button>
              </div>
              <p className="text-[10px] text-neutral-400 font-bold">
                💡 Tip: Type multiple numbers separated by spaces or commas to add in bulk (e.g., "1001 1002").
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-[11px] font-bold flex items-start gap-2 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Active Unpaid Selection Shortcuts */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
                  Quick Select Active Bills
                </h4>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-extrabold uppercase">
                  {eligibleOrders.length} active
                </span>
              </div>
              
              <div className="border border-neutral-150 rounded-2xl bg-white p-3 flex-1 overflow-y-auto max-h-[220px] space-y-1">
                {eligibleOrders.length === 0 ? (
                  <p className="text-center text-xs py-6 text-neutral-400 font-bold">
                    No active unpaid bills found in the queue.
                  </p>
                ) : (
                  eligibleOrders.map(o => {
                    const isSelected = selectedOrders.some(so => so.id === o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => !isSelected && addOrderToSelection(o)}
                        disabled={isSelected}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium transition ${
                          isSelected
                            ? "bg-purple-50 text-purple-700 border-purple-200 opacity-50 cursor-not-allowed"
                            : "hover:bg-neutral-50 border-neutral-100 hover:border-neutral-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            o.status === OrderStatus.SERVED ? "bg-emerald-500" : "bg-blue-500"
                          }`} />
                          <span className="font-mono font-black">{o.orderNumber}</span>
                          <span className="text-stone-400">|</span>
                          <span className="font-extrabold text-neutral-800">{o.tableName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-500">({o.waiterName || "Self"})</span>
                          <span className="font-black text-neutral-950">${o.grandTotal.toFixed(2)}</span>
                          {!isSelected && (
                            <span className="bg-neutral-100 text-[9px] font-black uppercase text-neutral-700 px-1.5 py-0.5 rounded-md">
                              + select
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Target table selector */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
              <label className="block text-[11px] font-black uppercase tracking-wider text-neutral-500">
                Assign Combined Order To Table
              </label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full bg-white border border-neutral-350 rounded-xl p-2.5 text-xs font-bold font-sans outline-none text-neutral-800 focus:border-purple-600"
              >
                <option value="">-- Choose Target Table --</option>
                {tables
                  .filter(t => t.isEnabled !== false)
                  .map(t => (
                    <option key={t.tableId} value={t.tableId}>
                      {t.name} ({t.tableId}) - {t.status.toUpperCase()}
                    </option>
                  ))
                }
              </select>
            </div>
            
          </div>

          {/* Right Hand: Preview and Merged Item Output */}
          <div className="flex-1 flex flex-col bg-stone-50 rounded-2xl border border-neutral-250 p-4 max-h-[500px] md:max-h-none overflow-hidden">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-600 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600" />
              Selected Bills To Merge ({selectedOrders.length})
            </h4>

            {selectedOrders.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-neutral-400 space-y-2 border-2 border-dashed border-neutral-200 rounded-xl bg-white">
                <GitMerge className="w-8 h-8 text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-500">No bills selected</p>
                <p className="text-[10px] text-neutral-400 max-w-xs leading-normal">
                  Select orders from the left panel or search by number to preview before combining.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* List of active order cards */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {selectedOrders.map(o => (
                    <div key={o.id} className="bg-white rounded-xl p-3 border border-neutral-200 shadow-3xs flex flex-col relative animate-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => removeOrderFromSelection(o.id)}
                        className="absolute top-2.5 right-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition"
                        title="Remove bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md font-mono">
                          {o.orderNumber}
                        </span>
                        <span className="text-xs font-extrabold text-neutral-850">
                          {o.tableName}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-bold">
                          by {o.waiterName || "Self"}
                        </span>
                      </div>

                      {/* Items nested scroll */}
                      <div className="space-y-1 pl-2 border-l border-purple-200">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-neutral-600">
                            <span>
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-mono text-neutral-900">
                              ${(it.price * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-neutral-100 mt-2 pt-1.5 flex justify-between items-center text-[10px] font-black text-neutral-900 uppercase tracking-tight">
                        <span>Original Total</span>
                        <span className="font-mono text-neutral-950">${o.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Combined Calculation Footer Preview */}
                <div className="bg-white border-t-2 border-dashed border-neutral-300 p-3 rounded-xl shadow-xs">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-neutral-500 font-bold">
                      <span className="uppercase text-[10px] tracking-wider">Subtotal</span>
                      <span className="font-mono">${combinedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 font-bold">
                      <span className="uppercase text-[10px] tracking-wider">Vat ({(vatRate * 100).toFixed(0)}%)</span>
                      <span className="font-mono">${vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-950 font-black border-t border-neutral-100 pt-2 text-sm uppercase">
                      <span>Combined Bill Total</span>
                      <span className="font-mono font-black text-purple-950">${combinedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Controls */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-wide">
            {selectedOrders.length >= 2 
              ? `✅ Ready to merge ${selectedOrders.length} bills into ${targetTableId || "unassigned table"}`
              : "⚠️ Select at least 2 bills to enable combining"
            }
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 border border-neutral-250 text-xs font-black rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCombineClick}
              disabled={selectedOrders.length < 2 || !targetTableId}
              className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition flex items-center gap-1.5 select-none ${
                selectedOrders.length >= 2 && targetTableId
                  ? "bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
              }`}
            >
              <GitMerge className="w-4 h-4" />
              Combine Bills
            </button>
          </div>
        </div>

        {/* Confirmation Overlay Dialog */}
        {showConfirmStep && (
          <div className="absolute inset-0 z-65 bg-neutral-950/85 backdrop-blur-xs flex items-center justify-center p-6 text-neutral-900 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center mx-auto">
                <GitMerge className="w-6 h-6 stroke-[2]" />
              </div>
              
              <div className="text-center space-y-1">
                <h4 className="font-extrabold text-sm tracking-tight uppercase">Confirm Bill Combination</h4>
                <p className="text-xs text-neutral-500 leading-normal">
                  Are you sure you want to combine <b className="text-neutral-950">{selectedOrders.length} bills</b>?
                </p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-150 text-[11px] space-y-1.5 font-bold">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Target Table</span>
                  <span className="text-neutral-900">{targetTableId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Orders Merged</span>
                  <span className="text-stone-700">{selectedOrders.map(o => o.orderNumber).join(", ")}</span>
                </div>
                <div className="flex justify-between items-center border-t border-neutral-200 pt-1.5 font-black text-xs">
                  <span className="uppercase text-[9px] tracking-wider">Merged Total Price</span>
                  <span className="text-purple-950 font-mono text-xs">${combinedTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[10px] text-amber-800 font-extrabold bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed uppercase flex gap-1.5 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  The historical matching orders ({selectedOrders.map(o => o.orderNumber).join(", ")}) will be marked as "Combined" and locked. The new bill can be settled and printed.
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmStep(false)}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:text-neutral-950 text-xs font-black rounded-xl transition"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmAndSubmit}
                  className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl transition shadow-md uppercase tracking-wider"
                >
                  Yes, Combine
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
