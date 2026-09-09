import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;

    // Get invoice details
    const invoiceQuery = `
      SELECT id, user_id, client_id, supplier_id, total_amount
      FROM invoices
      WHERE id = ?
    `;
    const invoiceResult = await db.execute(invoiceQuery, [id]);

    if (!invoiceResult.rows || invoiceResult.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoiceResult.rows[0] as {
      id: string;
      user_id: string;
      client_id: string;
      supplier_id: string;
      total_amount: number;
    };

    // Get invoice items
    const itemsQuery = `
      SELECT id, product_name, unit_price, quantity
      FROM invoice_items
      WHERE invoice_id = ?
    `;
    const itemsResult = await db.execute(itemsQuery, [id]);

    const items = (itemsResult.rows || []).map((row: any) => ({
      id: row.id as string,
      product_name: row.product_name as string,
      unit_price: row.unit_price as number,
      quantity: row.quantity as number,
    }));

    // Get price history for comparison
    const comparisons = await Promise.all(
      items.map(async (item) => {
        const priceQuery = `
          SELECT price, recorded_date
          FROM price_history
          WHERE supplier_id = ? AND product_name = ?
          ORDER BY recorded_date ASC
          LIMIT 1
        `;
        const priceResult = await db.execute(priceQuery, [
          invoice.supplier_id,
          item.product_name,
        ]);

        const oldestPrice =
          priceResult.rows && priceResult.rows.length > 0
            ? (priceResult.rows[0] as { price: number; recorded_date: string })
            : null;

        const currentPrice = item.unit_price;
        const previousPrice = oldestPrice?.price || currentPrice;
        const difference = currentPrice - previousPrice;
        const percentageChange =
          previousPrice !== 0
            ? ((difference / previousPrice) * 100).toFixed(2)
            : "0.00";
        const status =
          currentPrice > previousPrice
            ? "increased"
            : currentPrice < previousPrice
              ? "decreased"
              : "same";

        return {
          product_name: item.product_name,
          previous_price: parseFloat(previousPrice.toString()),
          current_price: currentPrice,
          difference: parseFloat(difference.toFixed(2)),
          percentage_change: percentageChange,
          status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      supplierId: invoice.supplier_id,
      comparisons,
    });
  } catch (error) {
    console.error("Error fetching price comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch price comparison" },
      { status: 500 }
    );
  }
}
