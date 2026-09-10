import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAccount, AuthError } from "@/lib/get-account";
import { normalizeName } from "@/lib/normalize";
import { v4 as uuidv4 } from "uuid";

interface IncomingItem {
  productName: string;
  quantity: number;
  unit?: string | null;
  unitPrice: number;
}

async function findOrCreateSupplier(
  accountId: string,
  supplierName: string
): Promise<string> {
  const normalized = normalizeName(supplierName);

  const existing = await db.execute(
    "SELECT id FROM suppliers WHERE account_id = ? AND normalized_name = ?",
    [accountId, normalized]
  );

  if (existing.rows && existing.rows.length > 0) {
    return (existing.rows[0] as any).id as string;
  }

  const supplierId = uuidv4();
  await db.execute(
    "INSERT INTO suppliers (id, account_id, name, normalized_name) VALUES (?, ?, ?, ?)",
    [supplierId, accountId, supplierName.trim(), normalized]
  );
  return supplierId;
}

export async function POST(request: NextRequest) {
  let account;
  try {
    account = await requireAccount();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }

  try {
    const body = await request.json();

    const {
      supplierName,
      invoiceNumber,
      invoiceDate,
      currency,
      items,
      sourceFileName,
    }: {
      supplierName: string;
      invoiceNumber?: string | null;
      invoiceDate?: string | null;
      currency?: string | null;
      items: IncomingItem[];
      sourceFileName?: string | null;
    } = body;

    if (!supplierName || !items || items.length === 0) {
      return NextResponse.json(
        { error: "اسم المورد وبند واحد على الأقل مطلوبين" },
        { status: 400 }
      );
    }

    const supplierId = await findOrCreateSupplier(account.id, supplierName);

    let totalAmount = 0;
    items.forEach((item) => {
      totalAmount += item.quantity * item.unitPrice;
    });

    const invoiceId = uuidv4();
    const now = new Date().toISOString();
    const finalInvoiceDate = invoiceDate || now.slice(0, 10);

    await db.execute(
      `INSERT INTO invoices
        (id, account_id, supplier_id, supplier_name_raw, invoice_number, invoice_date, total_amount, currency, status, source_file_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId,
        account.id,
        supplierId,
        supplierName.trim(),
        invoiceNumber || null,
        finalInvoiceDate,
        totalAmount,
        currency || "SAR",
        "confirmed",
        sourceFileName || null,
        now,
        now,
      ]
    );

    // إدخال البنود وسجل الأسعار بالتوازي (أسرع من for-await متتابع)
    await Promise.all(
      items.map(async (item) => {
        const itemId = uuidv4();
        const itemTotal = item.quantity * item.unitPrice;
        const normalizedProductName = normalizeName(item.productName);

        await db.execute(
          `INSERT INTO invoice_items
            (id, invoice_id, product_name, normalized_product_name, quantity, unit, unit_price, total_price, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId,
            invoiceId,
            item.productName.trim(),
            normalizedProductName,
            item.quantity,
            item.unit || null,
            item.unitPrice,
            itemTotal,
            now,
          ]
        );

        await db.execute(
          `INSERT INTO price_history
            (id, account_id, supplier_id, product_name, normalized_product_name, invoice_id, price, recorded_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            account.id,
            supplierId,
            item.productName.trim(),
            normalizedProductName,
            invoiceId,
            item.unitPrice,
            finalInvoiceDate,
          ]
        );
      })
    );

    return NextResponse.json(
      { success: true, invoiceId, totalAmount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "فشل إنشاء الفاتورة" },
      { status: 500 }
    );
  }
}