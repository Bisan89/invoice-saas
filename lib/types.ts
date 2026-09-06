export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  supplierId: string;
  totalAmount: number;
  currency: string;
  status: "draft" | "sent" | "paid";
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PriceComparison {
  invoiceItemId: string;
  supplierId: string;
  productName: string;
  previousPrice: number;
  currentPrice: number;
  priceDifference: number;
  percentageChange: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}
