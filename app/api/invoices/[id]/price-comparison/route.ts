import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    // جلب بنود الفاتورة الحالية
    const result = await db.execute(
      `SELECT ii.id, ii.product_name, ii.unit_price, ii.quantity
       FROM invoice_items ii
       WHERE ii.invoice_id = ?`,
      [invoiceId]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // جلب الفاتورة للحصول على supplier_id
    const invoiceResult = await db.execute(
      `SELECT supplier_id FROM invoices WHERE id = ?`,
      [invoiceId]
    );

    if (!invoiceResult.rows.length) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const supplierId = invoiceResult.rows[0].supplier_id as string;

    // حساب الفروقات
    const comparisons = [];

    for (const row of result.rows) {
      const item = row as {
        id: string;
        product_name: string;
        unit_price: number;
        quantity: number;
      };

      // جلب أقدم سعر لنفس المنتج من نفس المورد
      const priceHistory = await db.execute(
        `SELECT price FROM price_history 
         WHERE supplier_id = ? AND product_name = ?
         ORDER BY recorded_date ASC
         LIMIT 1`,
        [supplierId, item.product_name]
      );

      if (priceHistory.rows.length > 0) {
        const previousPrice = priceHistory.rows[0].price as number;
        const currentPrice = item.unit_price;
        const difference = currentPrice - previousPrice;
        const percentageChange = ((difference / previousPrice) * 100).toFixed(2);

        comparisons.push({
          invoiceItemId: item.id,
          productName: item.product_name,
          previousPrice: previousPrice.toFixed(2),
          currentPrice: currentPrice.toFixed(2),
          priceDifference: difference.toFixed(2),
          percentageChange: `${percentageChange}%`,
          status: difference > 0 ? "increased" : difference < 0 ? "decreased" : "same",
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        invoiceId,
        supplierId,
        comparisons,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching price comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch price comparison" },
      { status: 500 }
    );
  }
}
