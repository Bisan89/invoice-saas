import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * بترجع حساب (tenant) المستخدم المسجّل دخوله حالياً، وتنشئ سطر الحساب
 * بقاعدة Turso تلقائياً أول مرة (lazy) لو ما كان موجود بعد — يغطي حالة
 * تسجيل الدخول عبر رابط سحري/OAuth بدون المرور بـ/signup.
 * لأي API route محتاج التأكد إنه فيه مستخدم مسجّل دخول قبل أي عملية على بياناته.
 */
export async function requireAccount(): Promise<{
  id: string;
  email: string;
  companyName: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new AuthError();
  }

  const existing = await db.execute(
    "SELECT id, email, company_name FROM accounts WHERE id = ?",
    [user.id]
  );

  if (existing.rows && existing.rows.length > 0) {
    const row = existing.rows[0] as any;
    return { id: row.id, email: row.email, companyName: row.company_name };
  }

  await db.execute(
    "INSERT INTO accounts (id, email, company_name) VALUES (?, ?, ?)",
    [user.id, user.email, null]
  );

  return { id: user.id, email: user.email, companyName: null };
}

export class AuthError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "AuthError";
  }
}

// عشان uuid ما يبقى import غير مستخدم بملفات تانية بتستورد من هون لاحقاً
export function newId(): string {
  return uuidv4();
}
