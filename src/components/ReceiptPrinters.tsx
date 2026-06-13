import React, { useState, useEffect } from "react";
import { Order, OrderItem, SystemSettings, OrderStatus } from "../types";
import { usePOS } from "../store/posStore";
import { Printer, Scissors, X, Copy, Check, Mail, Download, Sparkles, ChefHat, Receipt } from "lucide-react";

export type PrintItem = {
  name: string;
  qty: number;
  price?: number;
  station?: "kitchen" | "bar" | "bill" | string;
  note?: string;
};

export type PrintOrder = {
  orderNo: string | number;
  table?: string | number;
  waiter?: string;
  cashier?: string;
  createdAt?: string;
  items: PrintItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
};

const money = (n?: number) => `$${Number(n || 0).toFixed(2)}`;

function baseHtml(title: string, body: string, paper: "58mm" | "80mm" = "80mm") {
  const width = paper === "58mm" ? "58mm" : "80mm";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  @page {
    size: ${width} auto;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  body {
    width: ${width};
    margin: 0;
    padding: 4px 6px;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    font-size: ${paper === "58mm" ? "11px" : "13px"};
    line-height: 1.15;
  }

  .center { text-align: center; }
  .bold { font-weight: 900; }
  .small { font-size: ${paper === "58mm" ? "9px" : "11px"}; }

  .shop-title {
    font-size: ${paper === "58mm" ? "17px" : "22px"};
    font-weight: 900;
    letter-spacing: 1px;
  }

  .receipt-title {
    margin-top: 2px;
    padding: 3px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    font-size: ${paper === "58mm" ? "13px" : "16px"};
    font-weight: 900;
    text-align: center;
  }

  .section-title {
    margin-top: 5px;
    padding: 2px 0;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    font-size: ${paper === "58mm" ? "11px" : "13px"};
    font-weight: 900;
    text-align: center;
  }

  .line {
    border-top: 1px dashed #000;
    margin: 4px 0;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 4px;
  }

  .item-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 4px;
    font-size: ${paper === "58mm" ? "10px" : "12px"};
  }

  .item-table th {
    border-bottom: 2px dashed #005;
    text-align: left;
    padding-bottom: 2px;
  }

  .item-table td {
    padding: 4px 0;
    border-bottom: 1px dotted #aaa;
  }

  .total-box {
    margin-top: 5px;
    padding: 5px 3px;
    border-top: 3px solid #000;
    border-bottom: 3px solid #000;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: ${paper === "58mm" ? "16px" : "22px"};
    font-weight: 900;
  }

  .station-item {
    display: flex;
    justify-content: space-between;
    font-size: ${paper === "58mm" ? "15px" : "19px"};
    font-weight: 900;
    margin: 4px 0;
  }

  .note {
    font-size: ${paper === "58mm" ? "10px" : "12px"};
    font-weight: 800;
    margin-bottom: 3px;
  }

  .footer {
    margin-top: 4px;
    text-align: center;
    font-weight: 800;
  }
</style>
</head>
<body>
${body}
<script>
  window.onload = function () {
    setTimeout(function () {
      window.focus();
      window.print();
      setTimeout(function () {
        window.close();
      }, 400);
    }, 250);
  };
</script>
</body>
</html>`;
}

function openPrintWindow(html: string) {
  const printWindow = window.open("", "_blank", "width=420,height=600");
  if (!printWindow) {
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printBill(order: PrintOrder, paper: "58mm" | "80mm" = "80mm") {
  const body = `
    <div class="center">
      <div class="shop-title">LUNA CAFÈ</div>
      <div class="small bold">Las Anod</div>
    </div>

    <div class="receipt-title">CUSTOMER BILL</div>

    <div class="row"><span>Order</span><b>#${order.orderNo}</b></div>
    <div class="row"><span>Table</span><b>${order.table || "-"}</b></div>
    <div class="row"><span>Waiter</span><b>${order.waiter || "-"}</b></div>
    <div class="row"><span>Cashier</span><b>${order.cashier || "-"}</b></div>
    <div class="row"><span>Date</span><b>${order.createdAt || new Date().toLocaleString()}</b></div>

    <div class="section-title">ITEMS</div>

    <table class="item-table">
      <thead>
        <tr>
          <th>ITEM DETAILS</th>
          <th style="text-align: right">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            item => `
          <tr>
            <td>
              <div class="bold">${item.name}</div>
              <div style="font-size: 10px; color: #555;">${item.qty} x ${money(item.price)}</div>
              ${item.note ? `<div style="font-size: 9px; font-style: italic;">* Note: ${item.note}</div>` : ""}
            </td>
            <td style="text-align: right; font-weight: 900;">
              ${money((item.price || 0) * item.qty)}
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="section-title">PAYMENT SUMMARY</div>

    <div class="row"><span>Subtotal</span><b>${money(order.subtotal)}</b></div>
    <div class="row"><span>Discount</span><b>${money(order.discount)}</b></div>
    <div class="row"><span>VAT/Tax</span><b>${money(order.tax)}</b></div>

    <div class="total-box">
      <div class="total-row">
        <span>TOTAL</span>
        <span>${money(order.total)}</span>
      </div>
    </div>

    <div class="center bold" style="margin-top: 8px; font-size: ${paper === "58mm" ? "9px" : "11px"};">MOBILE MONEY ACCOUNTS</div>
    <div style="border: 1px dashed #000; border-radius: 4px; padding: 4px 6px; margin: 4px 0 8px 0; font-size: ${paper === "58mm" ? "9px" : "11px"}; line-height: 1.3;">
      <div class="row"><b>Zaad</b><b>480495</b></div>
      <div class="row"><b>Sahal</b><b>319347</b></div>
      <div class="row"><b>eDahab</b><b>759816</b></div>
      <div class="row"><b>MyCash</b><b>951993</b></div>
      <div class="row"><b>TPlus</b><b>871056</b></div>
    </div>

    <div class="footer">THANK YOU — COME AGAIN</div>
  `;

  openPrintWindow(baseHtml("Bill Print", body, paper));
}

export function printKitchen(order: PrintOrder, paper: "58mm" | "80mm" = "80mm") {
  const body = `
    <div class="receipt-title">KITCHEN ORDER</div>

    <div class="row"><span>Order</span><b>#${order.orderNo}</b></div>
    <div class="row"><span>Table</span><b>${order.table || "-"}</b></div>
    <div class="row"><span>Waiter</span><b>${order.waiter || "-"}</b></div>
    <div class="row"><span>Time</span><b>${new Date().toLocaleTimeString()}</b></div>

    <div class="section-title">KITCHEN ITEMS</div>

    ${order.items
      .map(
        item => `
        <div class="station-item">
          <span>${item.name}</span>
          <span>x${item.qty}</span>
        </div>
        ${item.note ? `<div class="note">NOTE: ${item.note}</div>` : ""}
      `
      )
      .join("")}

    <div class="footer">PREPARE ORDER</div>
  `;

  openPrintWindow(baseHtml("Kitchen Print", body, paper));
}

export function printBar(order: PrintOrder, paper: "58mm" | "80mm" = "80mm") {
  const body = `
    <div class="receipt-title">BAR ORDER</div>

    <div class="row"><span>Order</span><b>#${order.orderNo}</b></div>
    <div class="row"><span>Table</span><b>${order.table || "-"}</b></div>
    <div class="row"><span>Waiter</span><b>${order.waiter || "-"}</b></div>
    <div class="row"><span>Time</span><b>${new Date().toLocaleTimeString()}</b></div>

    <div class="section-title">BAR ITEMS</div>

    ${order.items
      .map(
        item => `
        <div class="station-item">
          <span>${item.name}</span>
          <span>x${item.qty}</span>
        </div>
        ${item.note ? `<div class="note">NOTE: ${item.note}</div>` : ""}
      `
      )
      .join("")}

    <div class="footer">PREPARE DRINKS</div>
  `;

  openPrintWindow(baseHtml("Bar Print", body, paper));
}

interface ReceiptProps {
  order: Order;
  settings: SystemSettings;
  type: "kitchen" | "barista" | "customer";
  onClose?: () => void;
}

export const ReceiptView: React.FC<ReceiptProps> = ({ order, settings, type, onClose }) => {
  const { updateOrderPrintedQty } = usePOS();
  const [copied, setCopied] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");
  const [newOnlyMode, setNewOnlyMode] = useState(true); // Default to true (printing only added items)

  useEffect(() => {
    if (settings && settings.printerPaperWidth) {
      setPaperWidth(settings.printerPaperWidth);
    }
  }, [settings]);

  const [selectedStation, setSelectedStation] = useState<"kitchen" | "bar" | "bill">(() => {
    if (type === "customer") return "bill";
    if (type === "barista") return "bar";
    return "kitchen";
  });

  // Automatically switch new-only mode based on station
  useEffect(() => {
    if (selectedStation === "bill") {
      setNewOnlyMode(false); // Customer bill always full!
    } else {
      setNewOnlyMode(true);  // Kitchen/Bar delta only from the first print by default
    }
  }, [selectedStation]);

  const displayItems = order.items.filter(item => {
    if (selectedStation === "bill") return true;
    const nameLower = (item.name || "").toLowerCase();
    const isDrink = nameLower.includes("coffee") || 
      nameLower.includes("latte") || 
      nameLower.includes("cappuccino") || 
      nameLower.includes("espresso") || 
      nameLower.includes("macchiato") || 
      nameLower.includes("matcha") || 
      nameLower.includes("mocha") || 
      nameLower.includes("tea") || 
      nameLower.includes("americano") ||
      nameLower.includes("cold brew") ||
      item.isDrink;

    if (selectedStation === "bar") return isDrink;
    return !isDrink;
  }).map(item => {
    const alreadyPrinted = order.printedQty?.[item.productId] || 0;
    const displayQty = newOnlyMode && selectedStation !== "bill" 
      ? Math.max(0, item.quantity - alreadyPrinted) 
      : item.quantity;
    
    return {
      ...item,
      displayQty,
      totalQty: item.quantity,
      alreadyPrinted
    };
  }).filter(item => item.displayQty > 0 || !newOnlyMode);

  const handlePrint = () => {
    const printItems = displayItems.map(item => ({
      name: item.name,
      qty: item.displayQty,
      price: item.price,
      station: selectedStation,
      note: item.notes
    }));

    const printOrder: PrintOrder = {
      orderNo: order.orderNumber,
      table: order.tableName,
      waiter: order.waiterName || "-",
      cashier: order.cashierName || "-",
      createdAt: order.createdAt 
        ? new Date(order.createdAt).toLocaleString() 
        : new Date().toLocaleString(),
      items: printItems,
      subtotal: order.subtotal,
      discount: order.discountAmount || 0,
      tax: order.vatAmount || 0,
      total: order.grandTotal
    };

    if (selectedStation === "bill") {
      printBill(printOrder, paperWidth);
    } else if (selectedStation === "kitchen") {
      printKitchen(printOrder, paperWidth);
    } else {
      printBar(printOrder, paperWidth);
    }

    // Persist printed quantity tracking to Firestore
    if (selectedStation !== "bill") {
      const nextPrinted = { ...(order.printedQty || {}) };
      displayItems.forEach(item => {
        nextPrinted[item.productId] = (nextPrinted[item.productId] || 0) + item.displayQty;
      });
      updateOrderPrintedQty(order.id, nextPrinted);
    }
  };

  const handleDownloadHTML = () => {
    const title = selectedStation === "bill" ? "Bill" : selectedStation === "kitchen" ? "Kitchen" : "Bar";
    let bodyText = "";
    if (selectedStation === "bill") {
      bodyText = `
        <div class="center">
          <div class="shop-title">${settings.restaurantName || "LUNA CAFÈ"}</div>
          <div class="small bold">${settings.address || "Las Anod"}</div>
        </div>
        <div class="receipt-title">CUSTOMER BILL</div>
        <table class="item-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th style="text-align: right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${displayItems.map(item => `
              <tr>
                <td>
                  <div class="bold">${item.name}</div>
                  <div>${item.quantity} x ${money(item.price)}</div>
                </td>
                <td style="text-align: right; font-weight: 900;">${money(item.price * item.quantity)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="total-box">
          <div class="total-row"><span>TOTAL</span><span>${money(order.grandTotal)}</span></div>
        </div>
      `;
    } else {
      bodyText = `
        <div class="receipt-title">${selectedStation.toUpperCase()} ORDER</div>
        ${displayItems.map(item => `
          <div class="station-item"><span>${item.name}</span><span>x${item.displayQty}</span></div>
        `).join("")}
      `;
    }

    const htmlContent = baseHtml(title, bodyText, paperWidth);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LUNA_RECEIPT_${order.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyToClipboard = () => {
    const textEl = document.getElementById(`receipt-text-preview-${order.id}`);
    if (!textEl) return;
    navigator.clipboard.writeText(textEl.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subTotalAmount = order.subtotal || 0;
  const discountAmount = order.discountAmount || 0;
  const vatAmountVal = order.vatAmount || 0;
  const finalGrandTotal = order.grandTotal || (subTotalAmount + vatAmountVal - discountAmount);

  return (
    <div className="flex flex-col h-full font-mono bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl relative text-xs">
      
      {/* Header controls bar */}
      <div className="flex items-center justify-between px-3.5 py-3.5 bg-stone-900 border-b border-stone-800 text-stone-100">
        <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {selectedStation === "bill" ? "CUSTOMER BILL" : `${selectedStation.toUpperCase()} PREVIEW`}
        </span>
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={copyToClipboard}
            className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition"
            title="Copy Raw Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            type="button"
            onClick={handleDownloadHTML}
            className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition"
            title="Download Copy"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button 
            type="button"
            onClick={handlePrint}
            className="p-1.5 text-stone-100 hover:text-amber-400 hover:bg-stone-800 rounded transition"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-white rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Production Station Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-stone-900 px-3 py-2 border-b border-stone-800 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedStation("bill")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${
            selectedStation === "bill"
              ? "bg-amber-500 text-stone-950"
              : "bg-stone-800 text-stone-400 hover:text-white"
          }`}
        >
          <Receipt className="w-3 h-3" />
          Customer Bill
        </button>
        <button
          type="button"
          onClick={() => setSelectedStation("kitchen")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${
            selectedStation === "kitchen"
              ? "bg-amber-500 text-stone-950"
              : "bg-stone-800 text-stone-400 hover:text-white"
          }`}
        >
          <ChefHat className="w-3 h-3" />
          Kitchen
        </button>
        <button
          type="button"
          onClick={() => setSelectedStation("bar")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${
            selectedStation === "bar"
              ? "bg-amber-500 text-stone-950"
              : "bg-stone-800 text-stone-400 hover:text-white"
          }`}
        >
          <ChefHat className="w-3 h-3" />
          Bar/Drinks
        </button>
      </div>

      {/* Station Print Mode Selector (New Items vs All Items) */}
      {selectedStation !== "bill" && (
        <div className="bg-stone-900 border-b border-stone-800 px-4 py-2 flex items-center justify-between text-[10px] text-stone-300">
          <span>Filter Print Mode:</span>
          <div className="flex bg-stone-950 rounded border border-stone-800 p-0.5">
            <button
              type="button"
              onClick={() => setNewOnlyMode(true)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                newOnlyMode ? "bg-amber-500 text-stone-950" : "text-stone-400"
              }`}
            >
              New Items Only
            </button>
            <button
              type="button"
              onClick={() => setNewOnlyMode(false)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                !newOnlyMode ? "bg-amber-500 text-stone-950" : "text-stone-400"
              }`}
            >
              All Items
            </button>
          </div>
        </div>
      )}

      {/* Simulated thermal receipt paper viewport */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-900/65 flex justify-center items-start">
        <div 
          id={`receipt-text-preview-${order.id}`}
          className={`w-full bg-stone-50 text-stone-900 p-4 border border-stone-200 rounded shadow-2xl relative transition-all duration-200 ${
            paperWidth === "58mm" ? "max-w-[240px]" : "max-w-[325px]"
          }`}
          style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "1.25" }}
        >
          {/* Jagged paper top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-stone-200 flex justify-between px-1.5 overflow-hidden select-none whitespace-nowrap">
            {[...Array(24)].map((_, i) => (
              <span key={i} className="text-[6px] text-stone-300">▲</span>
            ))}
          </div>

          <div className="space-y-2.5 text-[10px] pt-1 text-black">
            
            {/* Header Details */}
            <div className="text-center pb-1 border-b border-dashed border-stone-400">
              <h1 className="text-base font-black uppercase tracking-wider">
                {settings.restaurantName || "LUNA CAFÈ"}
              </h1>
              <p className="text-[8.5px] uppercase tracking-widest text-neutral-600 font-bold">
                {selectedStation === "bill" ? "CUSTOMER RECEIPTS" : `${selectedStation.toUpperCase()} ORDER`}
              </p>
              {order.status === OrderStatus.PAID && selectedStation === "bill" && (
                <p className="text-[8px] font-black text-emerald-800 border border-emerald-800 px-1.5 py-0.5 inline-block uppercase mt-1 rounded">
                  ** PAID RECEIPT **
                </p>
              )}
            </div>

            {selectedStation === "bill" && (
              <div className="text-center text-[8px] leading-tight text-neutral-600 font-medium pb-1.5 border-b border-dotted border-stone-300">
                <p>{settings.address || "Las Anod"}</p>
                <p>Tel: {settings.phone || "+252 904 440 414"}</p>
                {settings.email && <p>Email: {settings.email}</p>}
              </div>
            )}

            {/* Informational rows */}
            <div className="space-y-0.5 text-[8.5px] font-bold">
              <div className="flex justify-between">
                <span>ORDER REF:</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>TABLE / BLOCK:</span>
                <span className="font-extrabold uppercase">{order.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span>WAITER:</span>
                <span>{order.waiterName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{order.cashierName || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-stone-400 pb-1">
                <span>DATE/TIME:</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Items Column Details */}
            <table className="w-full text-[9px] text-black">
              <thead>
                <tr className="border-b-2 border-dashed border-stone-400 text-left font-black">
                  <th className="py-0.5">ITEM DETAILS</th>
                  <th className="py-0.5 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-3 text-center text-neutral-500 italic">
                      No matching items.
                    </td>
                  </tr>
                ) : (
                  displayItems.map((item, idx) => (
                    <tr key={idx} className="align-top border-b border-dotted border-neutral-300">
                      <td className="py-1">
                        <div className="font-black">{item.name}</div>
                        <div className="text-[8px] text-neutral-500 font-bold">
                          {item.displayQty} x ${item.price.toFixed(2)}
                          {item.alreadyPrinted > 0 && selectedStation !== "bill" && (
                            <span className="text-[7.5px] text-amber-700 ml-1">
                              ({item.alreadyPrinted} already printed)
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <div className="text-[8px] text-stone-500 italic">
                            * Note: {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-1 text-right font-black font-mono">
                        ${(item.price * item.displayQty).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Bill Summary section */}
            {selectedStation === "bill" ? (
              <div className="pt-1 border-t border-dashed border-black space-y-0.5 text-[9px] font-bold">
                <div className="flex justify-between font-bold text-neutral-600">
                  <span>SUBTOTAL AMOUNT</span>
                  <span>${subTotalAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>DISCOUNT APPLIED</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-600">
                  <span>VAT TAX ({settings.vatPercentage || 5}%)</span>
                  <span>${vatAmountVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black border-t-2 border-double border-black pt-1">
                  <span>GRAND TOTAL DET</span>
                  <span>${finalGrandTotal.toFixed(2)}</span>
                </div>
                {order.paymentMethod && (
                  <div className="p-1.5 bg-neutral-200/50 border border-neutral-350 rounded mt-1.5 text-[8px] text-neutral-700">
                    <div className="flex justify-between">
                      <span>CHANNEL:</span>
                      <span className="font-black">{order.paymentMethod}</span>
                    </div>
                    {order.paymentReference && (
                      <div className="flex justify-between">
                        <span>REFERENCE:</span>
                        <span className="font-mono font-bold">{order.paymentReference}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Mobile money instructions inside preview */}
                <div className="mt-2 text-[8px] border border-stone-300 rounded p-1.5 text-black bg-white/50 space-y-0.5">
                  <div className="font-black text-center border-b border-dotted border-stone-350 pb-0.5">MOBILE MONEY ACCOUNTS</div>
                  <div className="flex justify-between"><span>Zaad</span><b>480495</b></div>
                  <div className="flex justify-between"><span>Sahal</span><b>319347</b></div>
                  <div className="flex justify-between"><span>eDahab</span><b>759816</b></div>
                  <div className="flex justify-between"><span>MyCash</span><b>951993</b></div>
                  <div className="flex justify-between"><span>TPlus</span><b>871056</b></div>
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-dashed border-black text-center text-[8px] font-black uppercase tracking-widest text-neutral-700">
                *** PREPARE TICKET - {selectedStation.toUpperCase()} ***
              </div>
            )}

            {/* Brand Logo and scan */}
            {selectedStation === "bill" && (
              <div className="flex flex-col items-center justify-center pt-2 pb-1 border-t border-dashed border-neutral-300">
                <div className="w-[50px] h-[50px] bg-white border border-neutral-200 p-0.5 rounded flex items-center justify-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${window.location.origin}/?table=${order.tableId}`)}`}
                    alt="Table QR"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[6.5px] text-neutral-600 font-bold tracking-tight uppercase mt-0.5 text-center">
                  Scan to Settle / Re-Order
                </span>
              </div>
            )}

            {/* Appreciation message */}
            <div className="text-center pt-1 mt-1 border-t border-dashed border-neutral-300">
              {selectedStation === "bill" && (
                <p className="text-[8px] font-black text-neutral-650 leading-tight">
                  {settings.appreciationMessage || "We Look Forward To Serving You Again, Welcome"}
                </p>
              )}
              <div className="flex items-center justify-center gap-1 text-[7px] text-neutral-400 select-none mt-1">
                <Scissors className="w-2 h-2 rotate-90" />
                <span>------------------------</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Embedded actions panel */}
      <div className="px-4 py-3 bg-stone-900 border-t border-stone-800 flex justify-between items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-stone-400 font-black uppercase">
            Paper:
          </span>
          <div className="flex bg-stone-950 p-0.5 rounded border border-stone-800">
            <button 
              type="button"
              onClick={() => setPaperWidth("58mm")}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black transition ${
                paperWidth === "58mm" ? "bg-amber-500 text-stone-950" : "text-stone-400 w-11 text-center"
              }`}
            >
              58mm
            </button>
            <button 
              type="button"
              onClick={() => setPaperWidth("80mm")}
              className={`px-1.5 py-0.5 rounded text-[8px] font-black transition ${
                paperWidth === "80mm" ? "bg-amber-500 text-stone-950" : "text-stone-400 w-11 text-center"
              }`}
            >
              80mm
            </button>
          </div>
        </div>
        
        <button 
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1 text-[10px] bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-3.5 py-2 rounded-xl transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Ticket
        </button>
      </div>

    </div>
  );
};
