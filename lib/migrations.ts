export interface Migration {
  id: number;
  name: string;
  sql: string;
}

// نظام migrations مركزي بملف وحيد — كل تعديل بقاعدة البيانات يُضاف كسطر جديد بالمصفوفة
// بترتيب id تصاعدي، ولا يُعدَّل أو يُحذف أي migration طُبّق فعلياً على بيئة حقيقية.
export const migrations: Migration[] = [
  {
    id: 1,
    name: "create_accounts_table",
    sql: `
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        company_name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    id: 2,
    name: "create_suppliers_table",
    sql: `
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    id: 3,
    name: "create_suppliers_index",
    sql: `CREATE INDEX IF NOT EXISTS idx_suppliers_account ON suppliers(account_id, normalized_name);`,
  },
  {
    id: 4,
    name: "create_invoices_table",
    sql: `
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        supplier_id TEXT REFERENCES suppliers(id),
        supplier_name_raw TEXT,
        invoice_number TEXT,
        invoice_date TEXT,
        total_amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'SAR',
        status TEXT NOT NULL DEFAULT 'draft',
        source_file_name TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    id: 5,
    name: "create_invoices_index",
    sql: `CREATE INDEX IF NOT EXISTS idx_invoices_account ON invoices(account_id, invoice_date);`,
  },
  {
    id: 6,
    name: "create_invoice_items_table",
    sql: `
      CREATE TABLE IF NOT EXISTS invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES invoices(id),
        product_name TEXT NOT NULL,
        normalized_product_name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT,
        unit_price REAL NOT NULL DEFAULT 0,
        total_price REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    id: 7,
    name: "create_invoice_items_index",
    sql: `CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);`,
  },
  {
    id: 8,
    name: "create_price_history_table",
    sql: `
      CREATE TABLE IF NOT EXISTS price_history (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        supplier_id TEXT NOT NULL REFERENCES suppliers(id),
        product_name TEXT NOT NULL,
        normalized_product_name TEXT NOT NULL,
        invoice_id TEXT NOT NULL REFERENCES invoices(id),
        price REAL NOT NULL,
        recorded_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    id: 9,
    name: "create_price_history_index",
    sql: `CREATE INDEX IF NOT EXISTS idx_price_history_lookup ON price_history(account_id, supplier_id, normalized_product_name, recorded_date);`,
  },
];
