import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// يُستدعى بعد التسجيل مباشرة لحفظ اسم الشركة، أو لضمان وجود سطر الحساب
// بقاعدة Turso (تُستخدم أيضاً بشكل lazy من requireAccount() لو ما انحفظ الحساب لأي سبب).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const companyName: string | null = body?.companyName || null;

  const existing = await db.execute("SELECT id FROM accounts WHERE id = ?", [
    user.id,
  ]);

  if (existing.rows && existing.rows.length > 0) {
    if (companyName) {
      await db.execute(
        "UPDATE accounts SET company_name = ? WHERE id = ?",
        [companyName, user.id]
      );
    }
  } else {
    await db.execute(
      "INSERT INTO accounts (id, email, company_name) VALUES (?, ?, ?)",
      [user.id, user.email, companyName]
    );
  }

  return NextResponse.json({ success: true });
}