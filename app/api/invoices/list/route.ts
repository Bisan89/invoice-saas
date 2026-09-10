import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAccount, AuthError } from "@/lib/get-account";

export async function GET() {
  let account;
  try {
    account = await requireAccount();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }

  const result = await db.execute(
    `SELECT id, supplier_name_raw, invoice_number, invoice_date, total_amount, currency, created_at
     FROM invoices
     WHERE account_id = ?
     ORDER BY invoice_date DESC, created_at DESC
     LIMIT 200`,
    [account.id]
  );

  return NextResponse.json({ success: true, invoices: result.rows || [] });
}