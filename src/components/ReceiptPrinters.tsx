import React, { useState } from "react";
import { Order, OrderItem, SystemSettings } from "../types";
import { Printer, Scissors, X, Copy, Check, Mail, Download, Sparkles } from "lucide-react";
import { LunaLogo } from "./LunaLogo";

interface ReceiptProps {
  order: Order;
  settings: SystemSettings;
  type: "kitchen" | "barista" | "customer";
  onClose?: () => void;
}

export const ReceiptView: React.FC<ReceiptProps> = ({ order, settings, type, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">(settings.printerPaperWidth as any || "80mm");
  
  // Filters
  const foodItems = order.items.filter(item => !item.isDrink);
  const drinkItems = order.items.filter(item => item.isDrink);
  
  const displayItems = 
    type === "kitchen" ? foodItems : 
    type === "barista" ? drinkItems : 
    order.items;
 
  const handlePrint = () => {
    const printContent = document.getElementById(`receipt-print-${type}-${order.id}`);
    if (!printContent) return;
    
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body { 
          background: white; 
          color: black; 
          margin: 0; 
          padding: 4mm; 
          font-family: 'Courier New', Courier, monospace; 
        }
        .no-print { display: none !important; }
        .print-only { display: block !important; width: 100% !important; max-width: ${paperWidth === "58mm" ? "58mm" : "80mm"} !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleDownloadPDF = () => {
    // Generate a printable data URI or downloadable HTML snapshot mimicking thermal print
    const receiptContent = document.getElementById(`receipt-print-${type}-${order.id}`);
    if (!receiptContent) return;
    
    const printHtml = `
      <html>
        <head>
          <title>Receipt_${order.orderNumber}</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              padding: 20px; 
              color: black; 
              background: #f7f7f7;
              display: flex;
              justify-content: center;
            }
            .paper {
              background: white;
              padding: 30px;
              width: 320px;
              border: 1px solid #ddd;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .text-center { text-align: center; }
            .flex { display: flex; justify-content: space-between; }
            .border-b { border-bottom: 1px dashed black; padding-bottom: 8px; margin-bottom: 8px; }
            .mt-4 { margin-top: 16px; }
            th, td { text-align: left; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="paper">
            ${receiptContent.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    const blob = new Blob([printHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LUNA_RECEIPT_${order.orderNumber || order.id}.html`;
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
    const textEl = document.getElementById(`receipt-text-${type}-${order.id}`);
    if (!textEl) return;
    navigator.clipboard.writeText(textEl.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (type === "kitchen" && foodItems.length === 0) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 text-amber-805 rounded-xl text-center font-sans">
        No food items in this order to send to Kitchen ticket.
      </div>
    );
  }

  if (type === "barista" && drinkItems.length === 0) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 text-amber-805 rounded-xl text-center font-sans">
        No barista beverage selections in this order.
      </div>
    );
  }

  // Formatting variables
  const subTotalAmount = order.subtotal || 0;
  const discountAmount = order.discountAmount || 0;
  const serviceChargeAmount = order.serviceCharge || 0;
  const vatAmountVal = order.vatAmount || 0;
  const finalGrandTotal = order.grandTotal || (subTotalAmount + vatAmountVal + serviceChargeAmount - discountAmount);
  const amountReceivedVal = order.amountReceived || finalGrandTotal;
  const balanceVal = order.balanceReturned !== undefined ? order.balanceReturned : Math.max(0, amountReceivedVal - finalGrandTotal);

  return (
    <div className="flex flex-col h-full font-mono bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Header controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-900 border-b border-stone-800 no-print">
        <span className="text-[10px] text-amber-400 uppercase tracking-widest font-black flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          {type === "kitchen" ? "KITCHEN DUPLICATE" : type === "barista" ? "BARISTA DUPLICATE" : "CUSTOMER RECEIPT"}
        </span>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={copyToClipboard}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
            title="Copy Raw Text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          
          {type === "customer" && (
            <>
              <button 
                onClick={() => setEmailModalOpen(true)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
                title="Email Receipt"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
                title="Download PDF/HTML Copy"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          <button 
            onClick={handlePrint}
            className="p-1.5 text-stone-100 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition"
            title="Thermal Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 text-stone-500 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Thermic paper container */}
      <div className="flex-1 overflow-y-auto p-5 bg-neutral-900/60 flex justify-center items-start">
        <div 
          id={`receipt-print-${type}-${order.id}`}
          className={`w-full bg-white text-black p-5 shadow-inner border border-neutral-300 rounded-lg relative transition-all duration-300 ${paperWidth === "58mm" ? "max-w-[245px]" : "max-w-[325px]"}`}
          style={{ fontFamily: "'Courier New', Courier, monospace" }}
        >
          {/* Decorative Thermal paper notch edge */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100/80 flex justify-between px-2 overflow-hidden select-none whitespace-nowrap">
            {[...Array(15)].map((_, i) => (
              <span key={i} className="text-[6px] text-neutral-300">■</span>
            ))}
          </div>

          <div id={`receipt-text-${type}-${order.id}`} className="space-y-3 text-xs pt-1">
            
            {/* Business Header Section */}
            <div className="text-center space-y-1 pb-1.5 border-b-2 border-dashed border-black">
              <h1 className="text-xl font-black uppercase tracking-wider text-black">
                LUNA CAFÉ
              </h1>
              <p className="text-[9px] uppercase font-mono tracking-widest text-stone-700 font-black">
                {type === "kitchen" ? "KITCHEN DUPLICATE" : type === "barista" ? "BARISTA DUPLICATE" : "CUSTOMER RECEIPT"}
              </p>
            </div>

            <div className="text-center space-y-1">
              
              {type === "customer" && (
                <div className="text-[10px] items-center leading-tight text-stone-600 font-bold space-y-0.5">
                  <p>{settings.address || "Xafada Exka, Wadada Xawo & Adam"}</p>
                  <p>Tel: {settings.phone || "+252 904 440 414"}</p>
                  <p>Email: {settings.email || "lunacafe041@gmail.com"}</p>
                  <p className="font-extrabold uppercase tracking-widest text-stone-800 mt-1 pt-1 border-t border-dashed border-stone-300">
                    {settings.welcomeMessage || "Thank You For Visiting Luna Cafe"}
                  </p>
                </div>
              )}
              
              <div className="border-b border-dashed border-black pt-1"></div>
            </div>

            {/* Comprehensive Meta Information details */}
            <div className="space-y-0.5 text-[10px] font-bold">
              {type === "customer" && (
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <span>{order.receiptNumber || `LUNA-REC-${10000 + parseInt(order.orderNumber.replace(/\D/g, "") || "100")}`}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ORDER NO:</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>TABLE:</span>
                <span className="font-extrabold uppercase">{order.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER TYPE:</span>
                <span className="font-extrabold">{order.customerType || "Dine-In"}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{order.cashierName || "Siti Nur"}</span>
              </div>
              <div className="flex justify-between">
                <span>WAITER:</span>
                <span>{order.waiterName || "Waiter"}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE / TIME:</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-black pb-2">
                <span>PAYMENT STATUS:</span>
                <span className={order.status === "Paid" || order.paymentStatus === "Paid" ? "font-black text-emerald-800" : "font-black text-red-600"}>
                  {(order.paymentStatus || (order.status === "Paid" ? "Paid" : "Unpaid")).toUpperCase()}
                </span>
              </div>
            </div>

            {/* List Table Items Ordered */}
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-dashed border-black text-left font-bold">
                  <th className="py-1 w-10">QTY</th>
                  <th className="py-1">ITEMS DESCRIPTION</th>
                  {type === "customer" && <th className="py-1 text-right w-16">UNIT</th>}
                  {type === "customer" && <th className="py-1 text-right w-16">TOTAL</th>}
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, idx) => (
                  <tr key={idx} className="align-top border-b border-dotted border-neutral-200">
                    <td className="py-1 font-extrabold">{item.quantity}x</td>
                    <td className="py-1">
                      <div className="font-bold text-stone-800">{item.name}</div>
                      {item.notes && (
                        <div className="text-[9px] text-neutral-600 italic">
                          * {item.notes}
                        </div>
                      )}
                    </td>
                    {type === "customer" && <td className="py-1 text-right font-medium">${item.price.toFixed(2)}</td>}
                    {type === "customer" && (
                      <td className="py-1 text-right font-extrabold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Detailed Financial Summary section (Customer only) */}
            {type === "customer" ? (
              <div className="pt-2 border-t border-dashed border-black space-y-1 text-[10px] font-bold">
                <div className="flex justify-between font-medium">
                  <span>SUBTOTAL</span>
                  <span>${subTotalAmount.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-700">
                    <span>DISCOUNT AMOUNT</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-medium">
                  <span>TAX ({settings.vatPercentage || 5}%)</span>
                  <span>${vatAmountVal.toFixed(2)}</span>
                </div>

                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between font-medium text-emerald-900">
                    <span>SERVICE CHARGE</span>
                    <span>+${serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-black border-t border-double border-black pt-1.5 pb-1">
                  <span>GRAND TOTAL</span>
                  <span>${finalGrandTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[11px] font-extrabold pt-1 border-t border-dotted border-black">
                  <span>AMOUNT RECEIVED</span>
                  <span>${amountReceivedVal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[11px] font-black text-stone-900">
                  <span>BALANCE RETURNED</span>
                  <span>${balanceVal.toFixed(2)}</span>
                </div>

                {/* Selected payment methods display */}
                {order.paymentMethod && (
                  <div className="bg-neutral-50 p-2 border border-neutral-200 rounded-md mt-2 space-y-0.5 text-[9px]">
                    <div className="flex justify-between text-stone-700">
                      <span>PAYMENT CHANNEL:</span>
                      <span className="font-extrabold text-stone-900">{order.paymentMethod}</span>
                    </div>
                    {order.paymentReference && (
                      <div className="flex justify-between text-stone-700">
                        <span>TX REFERENCE NO:</span>
                        <span className="font-mono font-bold text-stone-900">{order.paymentReference}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-dashed border-black text-center text-[9px] text-stone-500 font-extrabold uppercase">
                *** DUPLICATE RECEIPT WORKFLOW ***<br />PRICES INVISIBLE ON COOK COPY
              </div>
            )}

            {/* Standard Scannable QR Code Picture printed at the bottom */}
            {type === "customer" && (
              <div className="flex flex-col items-center justify-center pt-3 pb-1 border-t border-dashed border-stone-300">
                <div className="w-20 h-20 bg-white border border-neutral-200 p-1 rounded-md flex items-center justify-center shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/?table=${order.tableId}`)}`}
                    alt="Receipt Table QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[8px] text-stone-600 font-semibold tracking-wide uppercase mt-1">
                  Scan to Order Or Track Order Live
                </span>
              </div>
            )}

            {/* Footer Appreciation */}
            <div className="text-center pt-2.5 space-y-2">
              <div className="border-b border-dashed border-black"></div>
              {type === "customer" && (
                <p className="text-[9px] italic leading-tight text-[#B28926] font-bold px-1.5">
                  {settings.appreciationMessage || "We Look Forward To Serving You Again, Welcome Back"}
                </p>
              )}
              <div className="flex items-center justify-center gap-1 text-[8px] text-neutral-400 no-print select-none">
                <Scissors className="w-2.5 h-2.5 rotate-90" />
                <span>-------------------------</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Embedded thermal action bar customizers */}
      <div className="px-4 py-3 bg-stone-900 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-3 no-print">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase">
            Select Format:
          </span>
          <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800">
            <button 
              type="button"
              onClick={() => setPaperWidth("58mm")}
              className={`px-2.5 py-1 rounded text-[9px] font-black transition ${
                paperWidth === "58mm" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
              }`}
            >
              58mm Roll
            </button>
            <button 
              type="button"
              onClick={() => setPaperWidth("80mm")}
              className={`px-2.5 py-1 rounded text-[9px] font-black transition ${
                paperWidth === "80mm" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-white"
              }`}
            >
              80mm Roll
            </button>
          </div>
        </div>
        
        <button 
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 font-black px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-center"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Ticket ({paperWidth})
        </button>
      </div>

      {/* Simulated Email sending Modal Dialog */}
      {emailModalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-2xl relative text-white">
            <button 
              onClick={() => setEmailModalOpen(false)}
              className="absolute top-3 right-3 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Email Receipt
              </h3>
              <p className="text-[10px] text-stone-400">
                Send a beautiful HTML digital invoice directly to the customer's mailbox.
              </p>
            </div>

            {emailSentSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-900/50 p-3 rounded-xl text-center space-y-1 text-xs">
                <Check className="w-5 h-5 text-emerald-400 mx-auto animate-bounce" />
                <p className="font-bold text-emerald-400">Receipt Sent successfully!</p>
                <p className="text-[9px] text-stone-400">Delivered to: {customerEmail}</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block">Customer E-mail Address</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@domain.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-lg text-white font-sans outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={emailSending}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-800 text-stone-950 font-black rounded-lg transition text-xs uppercase"
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
