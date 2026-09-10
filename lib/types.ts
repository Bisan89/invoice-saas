export interface Account {
  id: string; // = Supabase auth user id
  email: string;
  companyName: string | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  accountId: string;
  name: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  accountId: string;
  supplierId: string | null;
  supplierNameRaw: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalAmount: number;
  currency: string;
  status: "draft" | "confirmed";
  sourceFileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productName: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalPrice: number;
}

export interface PriceComparisonRow {
  productName: string;
  quantity: number;
  currentPrice: number;
  previousPrice: number | null;
  previousInvoiceDate: string | null;
  difference: number | null;
  percentageChange: number | null;
  status: "increased" | "decreased" | "same" | "new";
}

export interface ExtractedInvoiceItem {
  productName: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
}

export interface ExtractedInvoiceData {
  supplierName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  currency: string | null;
  items: ExtractedInvoiceItem[];
}
