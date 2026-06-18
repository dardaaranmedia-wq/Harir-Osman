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
  serviceCharge?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentStatus?: string;
  amountReceived?: number;
  balanceReturned?: number;
  customerType?: string;
  restaurantName?: string;
  address?: string;
  phone?: string;
  email?: string;
  appreciationMessage?: string;
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
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
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #000;
    font-size: ${paper === "58mm" ? "11px" : "13px"};
    line-height: 1.25;
  }

  .center { text-align: center; }
  .bold { font-weight: 900; }
  .small { font-size: ${paper === "58mm" ? "9px" : "11px"}; }
  .font-mono, [style*="font-family: monospace"] {
    font-family: 'JetBrains Mono', Courier, monospace !important;
  }

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

const CODE39_MAP: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw', 'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw',
  'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn', 'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn',
  'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn', 'K': 'wnnnnnnww', 'L': 'nnwnnnnww',
  'M': 'wnwnnnnwn', 'N': 'nnnnwnnww', 'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn',
  'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn', 'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn',
  'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw', 'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw',
  'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn'
};

export function getBarcodeSVG(orderNo: string | number): string {
  const sanitized = String(orderNo).toUpperCase().replace(/[^0-9A-Z\-\. ]/g, '');
  const fullText = `*${sanitized || "LN-ORDER"}*`;
  
  const narrowWidth = 1.1;
  const wideWidth = 2.6;
  const gapWidth = 1.0;
  
  let currentX = 0;
  const paths: string[] = [];
  
  for (let c = 0; c < fullText.length; c++) {
    const char = fullText[c];
    const pattern = CODE39_MAP[char] || CODE39_MAP[' '];
    
    for (let i = 0; i < 9; i++) {
      const isBar = i % 2 === 0;
      const isWide = pattern[i] === 'w';
      const width = isWide ? wideWidth : narrowWidth;
      
      if (isBar) {
        paths.push(`<rect x="${currentX.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="32" fill="black" />`);
      }
      currentX += width;
    }
    currentX += gapWidth;
  }
  
  const totalWidth = Math.ceil(currentX);
  return `<svg width="100%" height="100%" viewBox="0 0 ${totalWidth} 32" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
    ${paths.join('')}
  </svg>`;
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

  const restaurantName = order.restaurantName || "LUNA CAFÈ";
  const address = order.address || "Las Anod";
  const phone = order.phone || "+252 904 440 414";
  const email = order.email || "";

  // Set header status banner
  const isPaid = order.paymentStatus === "Paid";
  const bannerText = isPaid ? "OFFICIAL PAID RECEIPT" : "CUSTOMER BILL INVOICE";
  
  const paymentDetailsHtml = isPaid
    ? `
      <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
      <div class="row" style="margin: 3px 0; font-size: ${paper === "58mm" ? "9.5px" : "11.5px"};">
        <span><b>PAYMENT STATUS:</b></span>
        <span style="color: #059669; font-weight: bold; font-family: monospace; border: 1px solid #10b981; padding: 1px 4px; border-radius: 3px; font-size: 8px;">[ PAID & SETTLED ]</span>
      </div>
      <div class="row" style="margin: 3px 0; font-size: ${paper === "58mm" ? "9.5px" : "11.5px"};">
        <span>Payment Method:</span>
        <b style="text-transform: uppercase;">${order.paymentMethod || "Cash"}</b>
      </div>
      ${
        order.paymentReference
          ? `<div class="row" style="margin: 3px 0; font-size: ${paper === "58mm" ? "9.5px" : "11.5px"};">
              <span>Reference/Tx ID:</span>
              <b style="font-family: monospace;">${order.paymentReference}</b>
             </div>`
          : ""
      }
      ${
        order.amountReceived && order.amountReceived > 0
          ? `<div class="row" style="margin: 3px 0; font-size: ${paper === "58mm" ? "9.5px" : "11.5px"};">
              <span>Amount Received:</span>
              <b>${money(order.amountReceived)}</b>
             </div>`
          : ""
      }
      ${
        order.balanceReturned && order.balanceReturned > 0
          ? `<div class="row" style="margin: 3px 0; font-size: ${paper === "58mm" ? "9.5px" : "11.5px"};">
              <span>Change Returned:</span>
              <b>${money(order.balanceReturned)}</b>
             </div>`
          : ""
      }
    `
    : `
      <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
      <div class="row" style="margin: 3px 0; font-size: ${paper === "58mm" ? "9.5px" : "11.5px"};">
        <span><b>PAYMENT STATUS:</b></span>
        <span style="color: #dc2626; font-weight: bold; font-family: monospace; border: 1px solid #ef4444; padding: 1px 4px; border-radius: 3px; font-size: 8px;">[ UNPAID / PENDING ]</span>
      </div>
    `;

  const body = `
    <div class="center" style="margin-bottom: 4px;">
      <div class="shop-title" style="font-weight: 900; line-height: 1.1;">${restaurantName}</div>
      <div class="small bold" style="margin-top: 2px; text-transform: uppercase;">${address}</div>
      ${phone ? `<div class="small font-mono">Tel: ${phone}</div>` : ""}
      ${email ? `<div class="small font-mono">Email: ${email}</div>` : ""}
    </div>

    <div class="receipt-title" style="margin: 6px 0; font-weight: 900; letter-spacing: 0.5px;">${bannerText}</div>

    <div style="font-size: ${paper === "58mm" ? "9.5px" : "11.5px"}; line-height: 1.4; font-family: monospace; font-weight: bold; margin-bottom: 6px;">
      <div class="row"><span>Order Ref:</span><b>#${order.orderNo}</b></div>
      <div class="row"><span>Table/Section:</span><b style="text-transform: uppercase;">${order.table || "-"}</b></div>
      <div class="row"><span>Waiter Code:</span><span>${order.waiter || "-"}</span></div>
      <div class="row"><span>Settle Cashier:</span><span>${order.cashier || "-"}</span></div>
      <div class="row"><span>Date/Timestamp:</span><span style="white-space: nowrap;">${order.createdAt || new Date().toLocaleString()}</span></div>
      ${order.customerType ? `<div class="row"><span>Service Mode:</span><span style="text-transform: uppercase;">${order.customerType}</span></div>` : ""}
    </div>

    <div class="section-title">BILL TRANSACTION ITEMS</div>

    <!-- Items Listing -->
    <div style="margin-top: 4px; margin-bottom: 4px;">
      ${billItems
        .map(
          item => `
          <div style="padding: 4px 0; border-bottom: 1px dotted #ccc;">
            <div class="row" style="font-size: ${paper === "58mm" ? "10px" : "12px"}; font-weight: 800;">
              <span>${item.name}</span>
              <span style="font-family: monospace;">${money((item.price || 0) * item.qty)}</span>
            </div>
            <div class="row" style="padding-left: 2px; font-family: monospace; font-size: ${paper === "58mm" ? "8.5px" : "10px"}; color: #444;">
              <span>${item.qty} Qty x ${money(item.price)} each</span>
            </div>
            ${item.note ? `<div style="padding-left: 8px; color: #555; font-size: ${paper === "58mm" ? "8px" : "9.5px"}; italic;">* Note: ${item.note}</div>` : ""}
          </div>
        `
        )
        .join("")}
    </div>

    <div class="section-title">PAYMENT BREAKDOWN</div>

    <div style="font-family: monospace; font-size: ${paper === "58mm" ? "10px" : "12px"}; line-height: 1.4; padding: 2px 0;">
      <div class="row"><span>Subtotal Amount:</span><b>${money(order.subtotal)}</b></div>
      ${
        order.discount && order.discount > 0
          ? `<div class="row" style="color: #444;"><span>Discount Rebate:</span><b>-${money(order.discount)}</b></div>`
          : ""
      }
      <div class="row"><span>VAT/Tax Applied:</span><b>${money(order.tax)}</b></div>
      ${
        order.serviceCharge && order.serviceCharge > 0
          ? `<div class="row"><span>Service Charge:</span><b>${money(order.serviceCharge)}</b></div>`
          : ""
      }
    </div>

    <div class="total-box" style="margin-top: 4px; margin-bottom: 6px;">
      <div class="total-row" style="font-family: monospace;">
        <span>GRAND TOTAL:</span>
        <span style="font-weight: 900;">${money(order.total)}</span>
      </div>
    </div>

    <!-- Payments Details -->
    ${paymentDetailsHtml}

    <!-- Accepted Payment Methods accounts -->
    <div style="margin-top: 10px;">
      <div class="center bold" style="font-size: ${paper === "58mm" ? "8.5px" : "10px"}; letter-spacing: 0.5px; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 4px;">ACCEPTED PAYMENT METHODS</div>
      <div style="border: 1px dashed #000; border-radius: 4px; padding: 4px 6px; font-size: ${paper === "58mm" ? "9px" : "11px"}; font-family: monospace; line-height: 1.35; background-color: #fafafa;">
        <div class="row"><span><b>ZAAD</b></span><b>480495</b></div>
        <div class="row"><span><b>SAHAL</b></span><b>319347</b></div>
        <div class="row"><span><b>EDAHAB</b></span><b>759816</b></div>
        <div class="row"><span><b>MYCASH</b></span><b>951993</b></div>
        <div class="row"><span><b>TPLUS</b></span><b>871056</b></div>
        <div style="border-top: 1px dashed #000; margin: 4px 0;"></div>
        <p style="margin: 0; font-size: ${paper === "58mm" ? "7.5px" : "9px"}; text-align: center; font-weight: normal; font-style: italic; color: #333;">Please display the Reference ID to the barista or cashier after completing the mobile money transaction.</p>
      </div>
    </div>

    <!-- Scannable Codes for Thermal Printer -->
    <div style="margin-top: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;">
      
      <!-- Barcode Card -->
      <div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 12px; padding: 6px 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 180px; margin: 0 auto; box-sizing: border-box; text-align: center; height: 50px;">
        <div style="width: 154px; height: 24px; overflow: hidden; margin: 0 auto;">
          ${getBarcodeSVG(order.orderNo)}
        </div>
        <div style="font-family: monospace; font-weight: 700; font-size: 8.5px; letter-spacing: 3.5px; text-transform: uppercase; margin-top: 2px; text-align: center; color: #111827;">
          ${String(order.orderNo).toUpperCase().replace(/[^0-9A-Z\-\.]/g, '').split('').join(' ')}
        </div>
      </div>
      <div style="font-size: 6px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 3px;">
        Receipt Reference Barcode
      </div>

    </div>

    <div style="border-top: 2px dashed #000; margin-top: 10px; margin-bottom: 6px;"></div>
    <div class="footer" style="font-weight: bold; font-family: sans-serif; font-size: ${paper === "58mm" ? "9px" : "10.5px"}; line-height: 1.35; margin-top: 4px;">
      ${order.appreciationMessage || "We Look Forward To Serving You Again, Welcome"}
    </div>
    
    <div class="center" style="margin-top: 10px; font-size: 8px; color: #777; font-family: monospace;">
      - - - - - - - - - - Tear Here - - - - - - - - - -
    </div>
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

function mapOrderToPrintOrder(order: Order, settings?: SystemSettings): PrintOrder {
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
    total: order.grandTotal,
    serviceCharge: order.serviceCharge || 0,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    paymentStatus: order.status === OrderStatus.PAID ? "Paid" : "Unpaid",
    amountReceived: order.amountReceived || 0,
    balanceReturned: order.balanceReturned || 0,
    customerType: order.customerType,
    restaurantName: settings?.restaurantName || "LUNA CAFÈ",
    address: settings?.address || "Las Anod",
    phone: settings?.phone || "+252 904 440 414",
    email: settings?.email || "",
    appreciationMessage: settings?.appreciationMessage || "We Look Forward To Serving You Again, Welcome"
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

  const [selectedStation, setSelectedStation] = useState<"kitchen" | "bar" | "bill" >(() => {
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
    const printOrder = mapOrderToPrintOrder(order, settings);
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
    const printOrder = mapOrderToPrintOrder(order, settings);
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
          style={{ fontFamily: "'Inter', sans-serif", lineHeight: "1.35" }}
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
                <span>{order.cashierName || "Siti"}</span>
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
              <div className="pt-2 border-t border-dashed border-black space-y-1 text-[9px] text-black">
                <div className="flex justify-between font-bold text-neutral-700">
                  <span>SUBTOTAL AMOUNT:</span>
                  <span className="font-mono">${subTotalAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>DISCOUNT APPLIED:</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-700">
                  <span>VAT TAX ({settings.vatPercentage || 5}%):</span>
                  <span className="font-mono">${vatAmountVal.toFixed(2)}</span>
                </div>
                {order.serviceCharge && order.serviceCharge > 0 ? (
                  <div className="flex justify-between text-neutral-700">
                    <span>SERVICE CHARGE:</span>
                    <span className="font-mono">${order.serviceCharge.toFixed(2)}</span>
                  </div>
                ) : null}
                
                <div className="flex justify-between text-[11px] font-black border-t-2 border-double border-black pt-1.5 pb-1">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-xs">${finalGrandTotal.toFixed(2)}</span>
                </div>

                {/* Payment Status & Details */}
                <div className="pt-1.5 border-t border-dotted border-neutral-400 space-y-1 text-[8.5px]">
                  <div className="flex justify-between items-center">
                    <span>PAYMENT STATUS:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      order.status === OrderStatus.PAID
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}>
                      {order.status === OrderStatus.PAID ? "Paid & Settled" : "Pending Payment"}
                    </span>
                  </div>

                  {order.status === OrderStatus.PAID && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded p-1.5 space-y-1">
                      <div className="flex justify-between">
                        <span>Paid Via:</span>
                        <span className="font-extrabold uppercase">{order.paymentMethod || "Cash"}</span>
                      </div>
                      {order.paymentReference && (
                        <div className="flex justify-between">
                          <span>Ref Code:</span>
                          <span className="font-mono font-bold">{order.paymentReference}</span>
                        </div>
                      )}
                      {order.amountReceived && order.amountReceived > 0 ? (
                        <div className="flex justify-between">
                          <span>Amt Tendered:</span>
                          <span className="font-mono">${order.amountReceived.toFixed(2)}</span>
                        </div>
                      ) : null}
                      {order.balanceReturned && order.balanceReturned > 0 ? (
                        <div className="flex justify-between">
                          <span>Change Ret:</span>
                          <span className="font-mono">${order.balanceReturned.toFixed(2)}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Accepted Payment Methods box */}
                <div className="mt-3.5 space-y-1.5">
                  <div className="text-center font-black text-neutral-800 text-[8.5px] border-b border-neutral-300 pb-1">
                    ACCEPTED PAYMENT METHODS
                  </div>
                  <div className="border border-dashed border-neutral-400 rounded-lg p-2.5 bg-neutral-50 space-y-1 font-mono text-[8px] text-neutral-800">
                    <div className="flex justify-between font-bold">
                      <span>ZAAD</span>
                      <span className="font-black">480495</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>SAHAL</span>
                      <span className="font-black">319347</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>EDAHAB</span>
                      <span className="font-black">759816</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>MYCASH</span>
                      <span className="font-black">951993</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>TPLUS</span>
                      <span className="font-black">871056</span>
                    </div>
                    <div className="border-t border-dashed border-neutral-300 my-1"></div>
                    <p className="text-[7px] leading-tight text-center italic text-neutral-600 font-sans font-medium">
                      Please show the transaction reference ID to cashier after sending the money.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-1 border-t border-dashed border-black text-center text-[8px] font-black uppercase tracking-widest text-neutral-800">
                *** PREPARE TICKET - {selectedStation.toUpperCase()} ***
              </div>
            )}

            {/* Scannable Codes Section */}
            {selectedStation === "bill" && (
              <div className="pt-2 pb-1 border-t border-dashed border-neutral-300 space-y-2.5">
                
                {/* 1. Narrow Barcode Card styled exactly like the user's reference image */}
                <div className="flex flex-col items-center">
                  <div className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 flex flex-col items-center justify-center w-full max-w-[180px] shadow-xs">
                    <div className="w-full h-[22px] overflow-hidden" dangerouslySetInnerHTML={{ __html: getBarcodeSVG(order.orderNumber) }} />
                    <span className="text-[7.5px] font-mono font-bold tracking-[0.3em] uppercase mt-0.5 text-neutral-800 text-center translate-x-[0.15em] select-all">
                      {String(order.orderNumber).toUpperCase().replace(/[^0-9A-Z\-\.]/g, '').split('').join(' ')}
                    </span>
                  </div>
                  <span className="text-[6px] text-neutral-500 font-sans font-extrabold tracking-widest uppercase mt-0.5 text-center">
                    RECEIPT REFERENCE BARCODE
                  </span>
                </div>

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
