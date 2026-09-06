import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { Invoice, InvoiceItem } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientId,
      supplierId,
      userId,
      items,
    }: {
      clientId: string;
      supplierId: string;
      userId: string;
      items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
      }>;
    } = body;

    // التحقق من البيانات
    if (!clientId || !supplierId || !userId || !items.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // حساب الإجمالي
    let totalAmount = 0;
    items.forEach((item) => {
      totalAmount += item.quantity * item.unitPrice;
    });

    // إنشاء الفاتورة
    const invoiceId = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO invoices (id, user_id, client_id, supplier_id, total_amount, currency, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, userId, clientId, supplierId, totalAmount, "SAR", "draft", now, now]
    );

    // إضافة بنود الفاتورة
    for (const item of items) {
      const itemId = uuidv4();
      const itemTotal = item.quantity * item.unitPrice;

      await db.execute(
        `INSERT INTO invoice_items (id, invoice_id, product_name, quantity, unit_price, total_price, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemId, invoiceId, item.productName, item.quantity, item.unitPrice, itemTotal, now]
      );

      // حفظ في price_history لتتبع الأسعار
      await db.execute(
        `INSERT INTO price_history (id, supplier_id, product_name, price, recorded_date)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), supplierId, item.productName, item.unitPrice, now]
      );
    }

    return NextResponse.json(
      {
        success: true,
        invoiceId,
        totalAmount,
        message: "Invoice created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
