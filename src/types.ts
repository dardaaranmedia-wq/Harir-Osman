export enum UserRole {
  DEVELOPER = "Developer",
  MANAGER = "Manager",
  CASHIER = "Cashier",
  WAITER = "Waiter",
  KITCHEN = "Kitchen Staff",
  BARISTA = "Barista",
}

export interface User {
  id: string;
  username?: string; // used for admin/dev login
  password?: string; // secure password for admin/dev login
  pin?: string;       // 4-digit PIN for staff login
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  image?: string; // Optional cover image URL
}

export interface ProductionStation {
  id: string;
  name: string;
}

export interface OrderAuditLog {
  editedBy: string;
  userRole: string;
  editedAt: string;
  changesSummary: string;
  addedItemsSummary?: string;
  removedItemsSummary?: string;
  previousTotal: number;
  newTotal: number;
  reason?: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  available: boolean;
  image: string;
  isDrink: boolean; // false = Kitchen, true = Barista
  description?: string; // Optional descriptive text E.g. "Classic pepperoni pizza"
  isArchived?: boolean;
  stationId?: string; // assigned production station
}

export interface Table {
  id: string;      // Table number format e.g. "01"
  tableId: string; // Unique format e.g. "LUNA-T01"
  name: string;    // Display name e.g. "Table 01"
  qrUrl: string;   // Simulated URL for self-ordering
  status: "available" | "ordered" | "dirty";
  assignedWaiter?: string; // Assigned waiter name E.g. "Ahmed Ali"
  isEnabled?: boolean;     // Table status: true (default enabled) or false (disabled)
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isDrink: boolean;
  stationId?: string;
}

export enum OrderStatus {
  PENDING_QR = "Pending",     // Orange: Customer self-orders from QR waiting for Cashier approval
  NEW = "New Order",          // Blue: Confirmed, in preparation
  SERVED = "Served",          // Green: Food delivered to table
  PAID = "Paid",              // Gray: Paid and closed
  CANCELLED = "Cancelled",    // Red: Cancelled / voided orders
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "#1001"
  tableId: string;     // Unique id LUNA-Txx
  tableName: string;    // e.g. Table 03
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  vatRate: number;      // e.g. 0.05 (5%)
  vatAmount: number;
  grandTotal: number;
  paymentMethod?: string; // Support expanded custom methods like Cash, Zaad (480495), Sahal (319347), eDahab (759816), MyCash (951993), and TPlus (871056)
  paymentReference?: string; // Optional reference number
  discountAmount?: number;
  serviceCharge?: number;
  amountReceived?: number;
  balanceReturned?: number;
  customerType?: "Dine-In" | "Takeaway" | "Delivery";
  paymentStatus?: "Paid" | "Unpaid";
  receiptNumber?: string;
  createdAt: string;    // Date timestamp string
  updatedAt: string;
  waiterName?: string;
  cashierName?: string;
  customerNotes?: string;
  auditHistory?: OrderAuditLog[];
}

export interface ReceiptTemplate {
  restaurantName: string;
  address: string;
  phone: string;
  footerMessage: string;
}

export interface Notification {
  id: string;
  type: "KITCHEN" | "BARISTA" | "CASHIER" | "SYSTEM";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface SystemSettings {
  vatPercentage: number; // Default 5
  restaurantName: string;
  address: string;
  phone: string;
  email?: string;
  welcomeMessage?: string;
  appreciationMessage?: string;
  serviceChargePercentage?: number; // E.g. 10%
  logoUrl?: string;
  printerPaperWidth: "80mm" | "58mm";
}
