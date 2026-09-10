import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAccount, AuthError } from "@/lib/get-account";
import { PriceComparisonRow } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let account;
  try {
    account = await requireAccount();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const { id } = await params;

  const invoiceResult = await db.execute(
    `SELECT id, supplier_id, supplier_name_raw, invoice_date
     FROM invoices WHERE id = ? AND account_id = ?`,
    [id, account.id]
  );

  if (!invoiceResult.rows || invoiceResult.rows.length === 0) {
    return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  }

  const invoice = invoiceResult.rows[0] as any;

  const itemsResult = await db.execute(
    `SELECT product_name, normalized_product_name, quantity, unit_price
     FROM invoice_items WHERE invoice_id = ?`,
    [id]
  );

  const items = itemsResult.rows || [];

  const comparisons: PriceComparisonRow[] = await Promise.all(
    items.map(async (row: any) => {
      const currentPrice = row.unit_price as number;

      // آخر سعر مسجّل لنفس المنتج من نفس المورد بنفس الحساب، قبل تاريخ هالفاتورة
      // (أو بنفس التاريخ بس فاتورة مختلفة)، مش من نفس الفاتورة الحالية.
      const previousResult = await db.execute(
        `SELECT price, recorded_date
         FROM price_history
         WHERE account_id = ? AND supplier_id = ? AND normalized_product_name = ?
           AND invoice_id != ?
           AND recorded_date <= ?
         ORDER BY recorded_date DESC, created_at DESC
         LIMIT 1`,
        [
          account.id,
          invoice.supplier_id,
          row.normalized_product_name,
          id,
          invoice.invoice_date,
        ]
      );

      const previousRow =
        previousResult.rows && previousResult.rows.length > 0
          ? (previousResult.rows[0] as any)
          : null;

      if (!previousRow) {
        return {
          productName: row.product_name,
          quantity: row.quantity,
          currentPrice,
          previousPrice: null,
          previousInvoiceDate: null,
          difference: null,
          percentageChange: null,
          status: "new",
        } satisfies PriceComparisonRow;
      }

      const previousPrice = previousRow.price as number;
      const difference = currentPrice - previousPrice;
      const percentageChange =
        previousPrice !== 0 ? (difference / previousPrice) * 100 : 0;

      return {
        productName: row.product_name,
        quantity: row.quantity,
        currentPrice,
        previousPrice,
        previousInvoiceDate: previousRow.recorded_date,
        difference: Number(difference.toFixed(2)),
        percentageChange: Number(percentageChange.toFixed(2)),
        status:
          difference > 0 ? "increased" : difference < 0 ? "decreased" : "same",
      } satisfies PriceComparisonRow;
    })
  );

  return NextResponse.json({
    success: true,
    invoiceId: invoice.id,
    supplierName: invoice.supplier_name_raw,
    comparisons,
  });
}