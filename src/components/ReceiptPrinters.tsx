import React, { useState, useEffect } from "react";
import { Order, OrderItem, SystemSettings, OrderStatus } from "../types";
import { usePOS } from "../store/posStore";
import { Printer, Scissors, X, Copy, Check, Mail, Download, Sparkles, ChefHat, Receipt } from "lucide-react";

export type PrintItem = {
  name: string;
  qty: number;
  price?: number;
  station?: "kitchen" | "bar" | "bill";
  note?: string;
  printedToKitchen?: boolean;
  printedToBar?: boolean;
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

  .item-row {
    display: grid;
    grid-template-columns: 1fr 24px 48px;
    gap: 4px;
    margin: 2px 0;
  }

  .item-name {
    font-weight: 800;
    word-break: break-word;
  }

  .qty {
    text-align: center;
    font-weight: 900;
  }

  .price {
    text-align: right;
    font-weight: 800;
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
    alert("Printer popup blocked. Please allow popups for this POS system.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printBill(order: PrintOrder, paper: "58mm" | "80mm" = "80mm") {
  // Aggregate items by name for the customer bill print to handle split lines elegantly
  const aggregated: { [key: string]: PrintItem } = {};
  order.items.forEach(item => {
    if (!aggregated[item.name]) {
      aggregated[item.name] = { ...item };
    } else {
      aggregated[item.name].qty += item.qty;
    }
  });
  const billItems = Object.values(aggregated);

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

    ${billItems
      .map(
        item => `
        <div class="item-row">
          <div class="item-name">${item.name}</div>
          <div class="qty">x${item.qty}</div>
          <div class="price">${money((item.price || 0) * item.qty)}</div>
        </div>
      `
      )
      .join("")}

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

    <div class="center bold" style="margin-top: 8px; font-size: ${paper === "58mm" ? "9px" : "11px"}; tracking-wide: 0.5px;">MOBILE MONEY ACCOUNTS</div>
    <div style="border: 1px dashed #000; border-radius: 4px; padding: 4px 6px; margin: 4px 0 8px 0; font-size: ${paper === "58mm" ? "9px" : "11px"}; line-height: 1.3;">
      <div class="row"><b>Zaad</b><b>480495</b></div>
      <div class="row"><b>Sahal</b><b>319347</b></div>
      <div class="row"><b>eDahab</b><b>759816</b></div>
      <div class="row"><b>MyCash</b><b>951993</b></div>
      <div class="row"><b>TPlus</b><b>871056</b></div>
      <p style="margin: 4px 0 0 0; font-size: ${paper === "58mm" ? "7.5px" : "9px"}; text-align: center; font-weight: normal; font-style: italic;">Pay using one of the accounts above, then show staff receipt ID.</p>
    </div>

    <div class="footer">THANK YOU — COME AGAIN</div>
  `;

  openPrintWindow(baseHtml("Bill Print", body, paper));
}

export function printKitchen(order: PrintOrder, paper: "58mm" | "80mm" = "80mm") {
  const newKitchenItems = order.items.filter(
    item => (item.station === "kitchen" || !item.station) && !item.printedToKitchen
  );
  const oldKitchenItems = order.items.filter(
    item => (item.station === "kitchen" || !item.station) && item.printedToKitchen
  );

  const body = `
    <div class="receipt-title">KITCHEN DUPLICATE</div>

    <div class="row"><span>Order</span><b>#${order.orderNo}</b></div>
    <div class="row"><span>Table</span><b>${order.table || "-"}</b></div>
    <div class="row"><span>Waiter</span><b>${order.waiter || "-"}</b></div>
    <div class="row"><span>Time</span><b>${new Date().toLocaleTimeString()}</b></div>

    <div class="section-title">NEW KITCHEN ITEMS</div>

    ${newKitchenItems.length === 0 
      ? `<div class="center bold" style="padding: 15px 0; font-size: ${paper === "58mm" ? "10px" : "12px"};">NO NEW ITEMS TO PREPARE</div>`
      : newKitchenItems
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

    ${oldKitchenItems.length > 0 ? `
      <div class="section-title" style="margin-top: 15px; border-top: 1px dashed #000; font-weight: bold; font-size: ${paper === "58mm" ? "9px" : "11px"}; opacity: 0.8;">
        PREVIOUSLY PRINTED (REFERENCE)
      </div>
      ${oldKitchenItems
          .map(
            item => `
            <div class="station-item" style="font-weight: normal; font-size: ${paper === "58mm" ? "11px" : "13px"}; opacity: 0.65; text-decoration: line-through;">
              <span>${item.name}</span>
              <span>x${item.qty}</span>
            </div>
            ${item.note ? `<div class="note" style="text-decoration: line-through; opacity: 0.6;">NOTE: ${item.note}</div>` : ""}
          `
          )
          .join("")}
    ` : ""}

    <div class="footer" style="margin-top: 15px; border-top: 1px solid #000; padding-top: 5px;">PREPARE ORDER</div>
  `;

  openPrintWindow(baseHtml("Kitchen Print", body, paper));
}

export function printBar(order: PrintOrder, paper: "58mm" | "80mm" = "80mm") {
  const newBarItems = order.items.filter(item => item.station === "bar" && !item.printedToBar);
  const oldBarItems = order.items.filter(item => item.station === "bar" && item.printedToBar);

  const body = `
    <div class="receipt-title">BAR DUPLICATE</div>

    <div class="row"><span>Order</span><b>#${order.orderNo}</b></div>
    <div class="row"><span>Table</span><b>${order.table || "-"}</b></div>
    <div class="row"><span>Waiter</span><b>${order.waiter || "-"}</b></div>
    <div class="row"><span>Time</span><b>${new Date().toLocaleTimeString()}</b></div>

    <div class="section-title">NEW BAR ITEMS</div>

    ${newBarItems.length === 0
      ? `<div class="center bold" style="padding: 15px 0; font-size: ${paper === "58mm" ? "10px" : "12px"};">NO NEW ITEMS TO PREPARE</div>`
      : newBarItems
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

    ${oldBarItems.length > 0 ? `
      <div class="section-title" style="margin-top: 15px; border-top: 1px dashed #000; font-weight: bold; font-size: ${paper === "58mm" ? "9px" : "11px"}; opacity: 0.8;">
        PREVIOUSLY PRINTED (REFERENCE)
      </div>
      ${oldBarItems
          .map(
            item => `
            <div class="station-item" style="font-weight: normal; font-size: ${paper === "58mm" ? "11px" : "13px"}; opacity: 0.65; text-decoration: line-through;">
              <span>${item.name}</span>
              <span>x${item.qty}</span>
            </div>
            ${item.note ? `<div class="note" style="text-decoration: line-through; opacity: 0.6;">NOTE: ${item.note}</div>` : ""}
          `
          )
          .join("")}
    ` : ""}

    <div class="footer" style="margin-top: 15px; border-top: 1px solid #000; padding-top: 5px;">PREPARE DRINKS</div>
  `;

  openPrintWindow(baseHtml("Bar Print", body, paper));
}

function mapOrderToPrintOrder(order: Order): PrintOrder {
  return {
    orderNo: order.orderNumber,
    table: order.tableName,
    waiter: order.waiterName || "-",
    cashier: order.cashierName || "-",
    createdAt: order.createdAt 
      ? new Date(order.createdAt).toLocaleString() 
      : new Date().toLocaleString(),
    items: order.items.map(item => {
      let itemStation: "kitchen" | "bar" | "bill" | undefined;
      const nameLower = (item.name || "").toLowerCase();
      if (
        nameLower.includes("coffee") || 
        nameLower.includes("latte") || 
        nameLower.includes("cappuccino") || 
        nameLower.includes("espresso") || 
        nameLower.includes("macchiato") || 
        nameLower.includes("matcha") || 
        nameLower.includes("mocha") || 
        nameLower.includes("tea") || 
        nameLower.includes("americano") ||
        nameLower.includes("cold brew") ||
        item.isDrink
      ) {
        itemStation = "bar";
      } else {
        itemStation = "kitchen";
      }
      return {
        name: item.name,
        qty: item.quantity,
        price: item.price,
        station: itemStation,
        note: item.notes,
        printedToKitchen: item.printedToKitchen,
        printedToBar: item.printedToBar
      };
    }),
    subtotal: order.subtotal,
    discount: order.discountAmount || 0,
    tax: order.vatAmount || 0,
    total: order.grandTotal
  };
}

interface ReceiptProps {
  order: Order;
  settings: SystemSettings;
  type: "kitchen" | "barista" | "customer";
  onClose?: () => void;
}

export const ReceiptView: React.FC<ReceiptProps> = ({ order, settings, type, onClose }) => {
  const { markItemsAsPrinted } = usePOS();
  const [copied, setCopied] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");

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

  const displayItems = selectedStation === "bill"
    ? (() => {
        const aggregated: { [key: string]: OrderItem } = {};
        order.items.forEach(item => {
          if (!aggregated[item.productId]) {
            aggregated[item.productId] = { ...item };
          } else {
            aggregated[item.productId].quantity += item.quantity;
          }
        });
        return Object.values(aggregated);
      })()
    : order.items.filter(item => {
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

        if (selectedStation === "bar") {
          return isDrink && !item.printedToBar;
        }
        return !isDrink && !item.printedToKitchen;
      });

  const oldDisplayItems = selectedStation === "bill"
    ? []
    : order.items.filter(item => {
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

        if (selectedStation === "bar") {
          return isDrink && item.printedToBar;
        }
        return !isDrink && item.printedToKitchen;
      });

  const handlePrint = () => {
    const printOrder = mapOrderToPrintOrder(order);
    if (selectedStation === "bill") {
      printBill(printOrder, paperWidth);
    } else if (selectedStation === "kitchen") {
      printKitchen(printOrder, paperWidth);
      markItemsAsPrinted(order.id, "kitchen");
    } else {
      printBar(printOrder, paperWidth);
      markItemsAsPrinted(order.id, "bar");
    }
  };

  const handleDownloadPDF = () => {
    const printOrder = mapOrderToPrintOrder(order);
    const title = selectedStation === "bill" ? "Bill Print" : selectedStation === "kitchen" ? "Kitchen Print" : "Bar Print";
    let bodyText = "";
    if (selectedStation === "bill") {
      bodyText = `
        <div class="center">
          <div class="shop-title">${settings.restaurantName || "LUNA CAFÈ"}</div>
          <div class="small bold">${settings.address || "Las Anod"}</div>
        </div>
        <div class="receipt-title">CUSTOMER BILL</div>
        <div class="row"><span>Order</span><b>#${order.orderNumber}</b></div>
        <div class="row"><span>Table</span><b>${order.tableName || "-"}</b></div>
        <div class="row"><span>Waiter</span><b>${order.waiterName || "-"}</b></div>
        <div class="row"><span>Cashier</span><b>${order.cashierName || "-"}</b></div>
        <div class="row"><span>Date</span><b>${new Date(order.createdAt).toLocaleString()}</b></div>
        <div class="section-title">ITEMS</div>
        ${displayItems.map(item => `
          <div class="item-row">
            <div class="item-name">${item.name}</div>
            <div class="qty font-bold">x${item.quantity}</div>
            <div class="price">${money(item.price * item.quantity)}</div>
          </div>
        `).join("")}
        <div class="section-title">PAYMENT SUMMARY</div>
        <div class="row"><span>Subtotal</span><b>${money(order.subtotal)}</b></div>
        <div class="row"><span>Discount</span><b>${money(order.discountAmount || 0)}</b></div>
        <div class="row"><span>VAT/Tax</span><b>${money(order.vatAmount)}</b></div>
        <div class="total-box">
          <div class="total-row"><span>TOTAL</span><span>${money(order.grandTotal)}</span></div>
        </div>
        <div class="center bold" style="margin-top: 8px; font-size: ${paperWidth === "58mm" ? "9px" : "11px"}; tracking-wide: 0.5px;">MOBILE MONEY ACCOUNTS</div>
        <div style="border: 1px dashed #000; border-radius: 4px; padding: 4px 6px; margin: 4px 0 8px 0; font-size: ${paperWidth === "58mm" ? "9px" : "11px"}; line-height: 1.3;">
          <div class="row"><b>Zaad</b><b>480495</b></div>
          <div class="row"><b>Sahal</b><b>319347</b></div>
          <div class="row"><b>eDahab</b><b>759816</b></div>
          <div class="row"><b>MyCash</b><b>951993</b></div>
          <div class="row"><b>TPlus</b><b>871056</b></div>
          <p style="margin: 4px 0 0 0; font-size: ${paperWidth === "58mm" ? "7.5px" : "9px"}; text-align: center; font-weight: normal; font-style: italic;">Pay using one of the accounts above, then show staff receipt ID.</p>
        </div>
        <div class="footer">${settings.welcomeMessage || "THANK YOU — COME AGAIN"}</div>
      `;
    } else {
      bodyText = `
        <div class="receipt-title">${selectedStation.toUpperCase()} DUPLICATE</div>
        <div class="row"><span>Order</span><b>#${order.orderNumber}</b></div>
        <div class="row"><span>Table</span><b>${order.tableName || "-"}</b></div>
        <div class="row"><span>Time</span><b>${new Date().toLocaleTimeString()}</b></div>
        
        <div class="section-title">NEW ${selectedStation.toUpperCase()} ITEMS</div>
        ${displayItems.length === 0
          ? `<div class="center bold" style="padding: 10px 0;">NO NEW ITEMS</div>`
          : displayItems.map(item => `
              <div class="station-item"><span>${item.name}</span><span>x${item.quantity}</span></div>
              ${item.notes ? `<div class="note">NOTE: ${item.notes}</div>` : ""}
            `).join("")}

        ${oldDisplayItems.length > 0 ? `
          <div class="section-title" style="margin-top: 15px; border-top: 1px dashed #000; opacity: 0.8;">
            PREVIOUSLY PRINTED ITEMS (REFERENCE)
          </div>
          ${oldDisplayItems.map(item => `
            <div class="station-item" style="opacity: 0.65; text-decoration: line-through; font-weight: normal;">
              <span>${item.name}</span>
              <span>x${item.quantity}</span>
            </div>
            ${item.notes ? `<div class="note" style="text-decoration: line-through; opacity: 0.6;">NOTE: ${item.notes}</div>` : ""}
          `).join("")}
        ` : ""}
        
        <div class="footer" style="margin-top: 15px; border-top: 1px solid #000; padding-top: 5px;">PREPARE ORDER</div>
      `;
    }

    const printHtml = baseHtml(title, bodyText, paperWidth);
    const blob = new Blob([printHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LUNA_RECEIPT_${order.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail) return;
    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setEmailSentSuccess(true);
      setTimeout(() => {
        setEmailSentSuccess(false);
        setEmailModalOpen(false);
        setCustomerEmail("");
      }, 2000);
    }, 1500);
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
          {selectedStation === "bill" ? "CUSTOMER RECEIPTS" : `${selectedStation.toUpperCase()} PREP`}
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
          
          {selectedStation === "bill" && (
            <>
              <button 
                type="button"
                onClick={() => setEmailModalOpen(true)}
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition"
                title="Email Receipt"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={handleDownloadPDF}
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition"
                title="Download HTML Copy"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button 
            type="button"
            onClick={handlePrint}
            className="p-1.5 text-stone-100 hover:text-amber-400 hover:bg-stone-800 rounded transition"
            title="Print Ticket"
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
          Barista/Drinks
        </button>
      </div>

      {/* Simulated thermal receipt paper viewport */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-900/60 flex justify-center items-start">
        <div 
          id={`receipt-text-preview-${order.id}`}
          className={`w-full bg-white text-black p-4 border border-neutral-300 rounded shadow-md relative transition-all duration-200 ${
            paperWidth === "58mm" ? "max-w-[230px]" : "max-w-[310px]"
          }`}
          style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "1.2" }}
        >
          {/* Decorative notches */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-150 flex justify-between px-2 overflow-hidden select-none whitespace-nowrap">
            {[...Array(12)].map((_, i) => (
              <span key={i} className="text-[5px] text-neutral-300">■</span>
            ))}
          </div>

          <div className="space-y-2 text-[10px] pt-1 text-black">
            
            {/* Header Details */}
            <div className="text-center pb-1 border-b border-dashed border-black">
              <h1 className="text-base font-black uppercase tracking-tight">
                {settings.restaurantName || "LUNA CAFÈ"}
              </h1>
              <p className="text-[8.5px] uppercase tracking-wider text-neutral-700 font-bold">
                {selectedStation === "bill" ? "CUSTOMER RECEIPTS" : `${selectedStation.toUpperCase()} PREP`}
              </p>
              {order.status === OrderStatus.PAID && selectedStation === "bill" && (
                <p className="text-[8px] font-black text-emerald-800 border border-emerald-800 px-1 py-0.5 inline-block uppercase mt-1 rounded">
                  ** PAID RECEIPT **
                </p>
              )}
            </div>

            {selectedStation === "bill" && (
              <div className="text-center text-[8px] leading-tight text-neutral-700 font-medium pb-1.5 border-b border-dotted border-neutral-400">
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
                <span className="font-black uppercase">{order.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span>WAITER:</span>
                <span>{order.waiterName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{order.cashierName || "Farhan"}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-black pb-1">
                <span>DATE/TIME:</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Items Table ordered */}
            <table className="w-full text-[9px] text-black">
              <thead>
                <tr className="border-b-2 border-dashed border-black text-left font-black">
                  <th className="py-0.5 w-[15%]">QTY</th>
                  <th className="py-0.5 w-[55%]">ITEM</th>
                  {selectedStation === "bill" && <th className="py-0.5 text-right w-[30%]">TOTAL</th>}
                </tr>
              </thead>
              <tbody>
                {selectedStation !== "bill" ? (
                  <>
                    <tr className="bg-neutral-100 font-bold border-b border-black text-[8px] text-black">
                      <td colSpan={2} className="py-1 px-1">NEW {selectedStation.toUpperCase()} ITEMS</td>
                    </tr>
                    {displayItems.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-2 text-center text-neutral-500 italic font-medium">
                          No new items – all printed.
                        </td>
                      </tr>
                    ) : (
                      displayItems.map((item, idx) => (
                        <tr key={`new-${idx}`} className="align-top border-b border-dotted border-neutral-300">
                          <td className="py-1 font-black">{item.quantity}x</td>
                          <td className="py-1">
                            <span className="font-bold">{item.name}</span>
                            {item.notes && (
                              <div className="text-[8px] text-neutral-600 italic">
                                * Note: {item.notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                    
                    {oldDisplayItems.length > 0 && (
                      <>
                        <tr className="bg-neutral-50 font-bold border-t border-b border-black text-[8px] text-neutral-600">
                          <td colSpan={2} className="py-1 px-1 uppercase tracking-tight">Previously Printed / Old Items</td>
                        </tr>
                        {oldDisplayItems.map((item, idx) => (
                          <tr key={`old-${idx}`} className="align-top border-b border-dotted border-neutral-200 opacity-60 line-through">
                            <td className="py-1">{item.quantity}x</td>
                            <td className="py-1">
                              <span>{item.name}</span>
                              {item.notes && (
                                <div className="text-[8px] italic select-none">
                                  * Note: {item.notes}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </>
                ) : (
                  displayItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-3 text-center text-neutral-500 italic">
                        No matching items for this station.
                      </td>
                    </tr>
                  ) : (
                    displayItems.map((item, idx) => (
                      <tr key={idx} className="align-top border-b border-dotted border-neutral-300">
                        <td className="py-1 font-black">{item.quantity}x</td>
                        <td className="py-1">
                          <span className="font-bold">{item.name}</span>
                          {item.notes && (
                            <div className="text-[8px] text-neutral-600 italic">
                              * Note: {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-1 text-right font-bold font-mono">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>

            {/* Bill Summary section */}
            {selectedStation === "bill" ? (
              <div className="pt-1 border-t border-dashed border-black space-y-0.5 text-[9px] font-bold">
                <div className="flex justify-between font-bold text-neutral-700">
                  <span>SUBTOTAL AMOUNT</span>
                  <span>${subTotalAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>DISCOUNT APPLIED</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-700">
                  <span>VAT TAX ({settings.vatPercentage || 5}%)</span>
                  <span>${vatAmountVal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black border-t-2 border-double border-black pt-1">
                  <span>GRAND TOTAL DET</span>
                  <span>${finalGrandTotal.toFixed(2)}</span>
                </div>
                {order.paymentMethod && (
                  <div className="p-1 bg-neutral-100 border border-neutral-200 rounded mt-1 text-[8px] text-neutral-750">
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
                <div className="mt-2.5 p-2 bg-neutral-50 border border-dotted border-neutral-400 rounded-lg space-y-1 text-[8px] text-black">
                  <div className="font-black text-center text-neutral-900 tracking-wider">MOBILE MONEY ACCOUNTS</div>
                  <div className="flex justify-between font-bold">
                    <span>Zaad</span>
                    <span className="font-mono font-black">480495</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Sahal</span>
                    <span className="font-mono font-black">319347</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>eDahab</span>
                    <span className="font-mono font-black">759816</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>MyCash</span>
                    <span className="font-mono font-black">951993</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>TPlus</span>
                    <span className="font-mono font-black">871056</span>
                  </div>
                  <p className="text-[6.5px] mt-1 text-center font-medium italic text-neutral-500">Pay using one of the accounts above, then show staff receipt ID.</p>
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-dashed border-black text-center text-[8px] font-black uppercase tracking-widest text-neutral-800">
                *** PREPARE TICKET - {selectedStation.toUpperCase()} ***
              </div>
            )}

            {/* Simulated Scannable table QR graphic */}
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
                <p className="text-[8px] font-black text-neutral-700 leading-tight">
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
            Format:
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

      {/* Email overlay popup inside previewer modal */}
      {emailModalOpen && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 max-w-xs w-full space-y-3 relative text-white">
            <button 
              type="button"
              onClick={() => setEmailModalOpen(false)}
              className="absolute top-2.5 right-2.5 text-stone-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Email Invoice
              </h3>
              <p className="text-[9px] text-stone-400">
                Send a digital transaction invoice directly to client.
              </p>
            </div>

            {emailSentSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-900/50 p-2.5 rounded-xl text-center space-y-1">
                <Check className="w-4 h-4 text-emerald-400 mx-auto animate-bounce" />
                <p className="font-bold text-emerald-400 text-[10px]">Emailed successfully!</p>
                <p className="text-[8px] text-stone-400 font-sans">Delivered to: {customerEmail}</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-stone-500 uppercase block">Client Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="guest@domain.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded text-white font-sans outline-none focus:border-amber-500 text-[10px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailSending}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-800 text-stone-950 font-black rounded transition text-[10px] uppercase"
                >
                  {emailSending ? "Sending Invoice..." : "Dispatch Email"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
type LocalReceiptItem = {
  name: string;
  qty: number;
  price: number;
  station?: "kitchen" | "bar" | "coffee";
};

type LocalReceiptOrder = {
  receiptNo: string;
  billNo: string;
  table: string;
  waiter: string;
  status: string;
  date: string;
  items: LocalReceiptItem[];
  vatRate?: number;
};

const formatPlain = (n: number) => n.toFixed(2);

export function printCustomerReceipt(order: LocalReceiptOrder, paper: "58mm" | "80mm" = "80mm") {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const vat = subtotal * (order.vatRate ?? 0.05);
  const total = subtotal + vat;

  const html = `
  <html>
  <head>
    <style>
      @page { size: ${paper} auto; margin: 0; }
      body {
        font-family: Arial, sans-serif;
        width: ${paper === "80mm" ? "72mm" : "48mm"};
        margin: 0 auto;
        padding: 6px;
        color: #000;
        font-size: ${paper === "80mm" ? "12px" : "10px"};
      }
      .center { text-align: center; }
      .bold { font-weight: 800; }
      .title { font-size: ${paper === "80mm" ? "22px" : "17px"}; font-weight: 900; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; gap: 6px; }
      .item { margin: 7px 0; }
      .item-name { font-weight: 800; font-size: ${paper === "80mm" ? "14px" : "11px"}; }
      .total { font-size: ${paper === "80mm" ? "18px" : "15px"}; font-weight: 900; }
      .accounts {
        border: 1px dashed #000;
        border-radius: 6px;
        padding: 6px;
        margin-top: 6px;
      }
    </style>
  </head>
  <body>
    <div class="center">
      <div class="title">Luna Cafe</div>
      <div>Luna Cafe, Laascaanood, Sool, Somalia</div>
      <div>Tel: +252904440414</div>
    </div>

    <div class="line"></div>

    <div class="row"><span>Receipt:</span><b>#${order.receiptNo}</b></div>
    <div class="row"><span>Date:</span><span>${order.date}</span></div>
    <div class="row"><span>Table:</span><b>${order.table}</b></div>
    <div class="row"><span>Status:</span><b>${order.status}</b></div>
    <div class="row"><span>Waiter:</span><b>${order.waiter}</b></div>
    <div class="row"><span>Bill No:</span><b>${order.billNo}</b></div>

    <div class="line"></div>
    <div class="bold">ITEMS</div>

    ${order.items.map(i => `
      <div class="item">
        <div class="row">
          <span class="item-name">${i.name}</span>
          <span class="bold">${formatPlain(i.price * i.qty)}</span>
        </div>
        <div>${formatPlain(i.price)} x ${i.qty}</div>
      </div>
      <div class="line"></div>
    `).join("")}

    <div class="row"><span>Subtotal</span><b>${formatPlain(subtotal)}</b></div>
    <div class="row"><span>VAT (${((order.vatRate ?? 0.05) * 100).toFixed(0)}%)</span><b>${formatPlain(vat)}</b></div>

    <div class="line"></div>
    <div class="row total"><span>TOTAL</span><span>${formatPlain(total)}</span></div>
    <div class="line"></div>

    <div class="bold">MOBILE MONEY ACCOUNTS</div>
    <div class="accounts">
      <div class="row"><b>Zaad</b><b>480495</b></div>
      <div class="row"><b>Sahal</b><b>319347</b></div>
      <div class="row"><b>eDahab</b><b>759816</b></div>
      <div class="row"><b>MyCash</b><b>951993</b></div>
      <div class="row"><b>TPlus</b><b>871056</b></div>
      <p>Pay using one of the accounts above, then show staff your receipt ID.</p>
    </div>

    <div class="line"></div>
    <div class="center bold">Thank You ❤️</div>
    <div class="center">Please come again</div>
  </body>
  </html>`;

  printHtml(html);
}

export function printStationTicket(
  order: LocalReceiptOrder,
  station: "kitchen" | "bar" | "coffee",
  paper: "58mm" | "80mm" = "80mm"
) {
  const stationItems = order.items.filter(i => i.station === station);

  if (stationItems.length === 0) return;

  const title = station.toUpperCase() + " TICKET";

  const html = `
  <html>
  <head>
    <style>
      @page { size: ${paper} auto; margin: 0; }
      body {
        font-family: Arial, sans-serif;
        width: ${paper === "80mm" ? "72mm" : "48mm"};
        margin: 0 auto;
        padding: 6px;
        color: #000;
        font-size: ${paper === "80mm" ? "12px" : "10px"};
      }
      .center { text-align: center; }
      .title { font-size: ${paper === "80mm" ? "22px" : "17px"}; font-weight: 900; }
      .line { border-top: 2px dashed #000; margin: 7px 0; }
      .row { display: flex; justify-content: space-between; gap: 6px; }
      .big-order { font-size: ${paper === "80mm" ? "24px" : "18px"}; font-weight: 900; }
      .item { font-weight: 900; font-size: ${paper === "80mm" ? "14px" : "11px"}; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="center title">${title}</div>
    <div class="line"></div>

    <div class="row"><span>Order</span><span class="big-order">#${order.receiptNo}</span></div>
    <div class="row"><span>Table</span><b>${order.table}</b></div>
    <div class="row"><span>Waiter</span><b>${order.waiter}</b></div>
    <div class="row"><span>Time</span><span>${order.date}</span></div>

    <div class="line"></div>

    ${stationItems.map(i => `
      <div class="row item">
        <span>${i.name}</span>
        <span>x${i.qty}</span>
      </div>
      <div class="line"></div>
    `).join("")}

    <div class="center">Printed: ${new Date().toLocaleString()}</div>
  </body>
  </html>`;

  printHtml(html);
}

function printHtml(html: string) {
  const win = window.open("", "_blank", "width=400,height=600");

  if (!win) {
    alert("Popup blocked. Please allow popups for printing.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  win.onload = () => {
    win.focus();
    win.print();
    win.close();
  };
}
